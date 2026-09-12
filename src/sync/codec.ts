/**
 * What a sync adapter actually writes, independent of the provider (S-44/S-45).
 *
 * - `profile-<id>.json` is the **export document** of `src/share/exportImport.ts`
 *   (`{ schemaVersion, dataVersion, kind: 'profile', payload }`), so a synced file and an exported file
 *   are the same bytes and go through the same migrations on the way back in.
 * - `index.json` is `{ pyrrhic: 'sync', version, kdf?, body }` where `body` is the index
 *   (`{ profiles, tombstones }`) — or the encrypted envelope holding it. The `kdf` header stays in clear
 *   because the other device needs the salt to derive the key; everything else is inside `body`, so the
 *   provider does not even learn the profile names when encryption is on.
 *
 * `createCodec` is the one place that knows whether a body is encrypted; the Gist store and the
 * in-memory store share it, which is why the encryption round trip is testable without any network.
 */
import { migrateProfile, readSchemaVersion } from '../state/migrations';
import { SCHEMA_VERSION } from '../state/schema';
import type { Profile, Tombstone } from '../state/schema';
import { decryptValue, deriveKey, encryptValue, isEncrypted, isKdfHeader, newKdfHeader } from './crypto';
import { SyncError } from './types';
import type { EncryptedBlob, KdfHeader, ProfileDocument, RemoteIndex, RemoteProfileMeta } from './types';

/** Bumped only if the *envelope* changes; the payload has its own `schemaVersion`. */
export const SYNC_FORMAT_VERSION = 1;
export const INDEX_FILE = 'index.json';

export function profileFileName(id: string): string {
  return `profile-${id}.json`;
}

export interface SyncIndexFile {
  pyrrhic: 'sync';
  version: number;
  kdf?: KdfHeader;
  body: RemoteIndex | EncryptedBlob;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function emptyIndex(): RemoteIndex {
  return { profiles: [], tombstones: [] };
}

// ---- Profile documents ------------------------------------------------------------------------------
export function buildProfileDocument(profile: Profile, dataVersion: number): ProfileDocument {
  return { schemaVersion: SCHEMA_VERSION, dataVersion, kind: 'profile', payload: profile };
}

/** Validate + migrate a remote profile file. Same code path as importing an exported file. */
export function readProfileDocument(value: unknown): Profile {
  if (!isPlainObject(value)) throw new SyncError('format', 'A synced profile file is not an object.');
  if (value.kind !== 'profile') {
    throw new SyncError('format', 'A file in this gist is not a Pyrrhic profile.');
  }
  const schemaVersion = readSchemaVersion(value);
  if (schemaVersion > SCHEMA_VERSION) {
    throw new SyncError(
      'format',
      `This gist was written by a newer version of Pyrrhic (schema ${String(schemaVersion)}); update the app first.`,
    );
  }
  try {
    return migrateProfile(value.payload, schemaVersion);
  } catch (cause) {
    throw new SyncError('format', 'A synced profile could not be read; it may be from another app.', {
      cause,
    });
  }
}

// ---- Index ------------------------------------------------------------------------------------------
function readMeta(value: unknown): RemoteProfileMeta | null {
  if (!isPlainObject(value)) return null;
  const { id, rev, updatedAt, name, docRev, deviceName } = value;
  if (typeof id !== 'string' || typeof rev !== 'number' || typeof updatedAt !== 'number') return null;
  return {
    id,
    rev,
    updatedAt,
    docRev: typeof docRev === 'number' ? docRev : rev,
    name: typeof name === 'string' ? name : 'Profile',
    ...(typeof deviceName === 'string' ? { deviceName } : {}),
  };
}

function readTombstone(value: unknown): Tombstone | null {
  if (!isPlainObject(value)) return null;
  const { id, deletedAt } = value;
  if (typeof id !== 'string' || typeof deletedAt !== 'number') return null;
  return { id, deletedAt };
}

/** Tolerant reader: an index we cannot fully understand loses entries, never crashes the sync. */
export function asRemoteIndex(value: unknown): RemoteIndex {
  if (!isPlainObject(value)) throw new SyncError('format', 'The sync index is not an object.');
  const profiles = Array.isArray(value.profiles)
    ? value.profiles.map(readMeta).filter((meta): meta is RemoteProfileMeta => meta !== null)
    : [];
  const tombstones = Array.isArray(value.tombstones)
    ? value.tombstones.map(readTombstone).filter((stone): stone is Tombstone => stone !== null)
    : [];
  return { profiles, tombstones };
}

/** Split a parsed `index.json` into its clear header and its (possibly encrypted) body. */
export function readIndexFile(value: unknown): { header: KdfHeader | undefined; body: unknown } {
  if (!isPlainObject(value)) throw new SyncError('format', 'The sync index is not an object.');
  if (value.pyrrhic !== 'sync') {
    throw new SyncError(
      'format',
      'This gist does not look like a Pyrrhic sync gist. Point the app at another gist, or clear the gist id to create a new one.',
    );
  }
  return { header: isKdfHeader(value.kdf) ? value.kdf : undefined, body: value.body };
}

export function buildIndexFile(
  header: KdfHeader | undefined,
  body: RemoteIndex | EncryptedBlob,
): SyncIndexFile {
  return {
    pyrrhic: 'sync',
    version: SYNC_FORMAT_VERSION,
    ...(header === undefined ? {} : { kdf: header }),
    body,
  };
}

// ---- Codec ------------------------------------------------------------------------------------------
export interface FileCodec {
  /** True once `adopt` has decided that bodies are encrypted. */
  readonly encrypting: boolean;
  /** Header to write into the index (undefined when encryption is off). */
  header(): KdfHeader | undefined;
  /**
   * Learn the remote's key-derivation header (undefined when the remote is new or in clear) and derive
   * the key. Throws `SyncError('encrypted')` when the remote is encrypted and no passphrase was given.
   */
  adopt(header: KdfHeader | undefined): Promise<void>;
  encode(value: unknown): Promise<unknown>;
  decode(value: unknown): Promise<unknown>;
}

/**
 * `passphrase` empty/undefined = no encryption. A remote that is already encrypted is always decoded
 * with *its* header (salt and iteration count), never with ours.
 */
export function createCodec(passphrase?: string): FileCodec {
  const secret = passphrase === undefined || passphrase === '' ? null : passphrase;
  let header: KdfHeader | undefined;
  let key: CryptoKey | null = null;

  const requireKey = (): CryptoKey => {
    if (key === null) {
      throw new SyncError(
        'encrypted',
        'This gist is encrypted. Enter the passphrase you chose when you set up sync.',
      );
    }
    return key;
  };

  return {
    get encrypting() {
      return key !== null;
    },
    header: () => header,
    async adopt(remoteHeader) {
      // Deriving a key costs ~200 ms on purpose, so never derive the same one twice.
      if (key !== null && header !== undefined && remoteHeader?.salt === header.salt) return;
      if (remoteHeader !== undefined) {
        header = remoteHeader;
        if (secret === null) {
          throw new SyncError(
            'encrypted',
            'This gist is encrypted. Tick "Encrypt" and enter the passphrase to read it.',
          );
        }
        key = await deriveKey(secret, remoteHeader);
        return;
      }
      if (secret === null) {
        header = undefined;
        key = null;
        return;
      }
      header = header ?? newKdfHeader();
      key = await deriveKey(secret, header);
    },
    async encode(value) {
      if (key === null) return value;
      if (header === undefined) {
        // Unreachable: `adopt` always sets both together, and the salt must match the derived key.
        throw new SyncError('unsupported', 'The encryption header is missing; reopen the sync dialog.');
      }
      return encryptValue(value, key, header);
    },
    async decode(value) {
      // A remote can hold both shapes while a user is turning encryption on: decide per file.
      if (!isEncrypted(value)) return value;
      return decryptValue(value, requireKey());
    },
  };
}
