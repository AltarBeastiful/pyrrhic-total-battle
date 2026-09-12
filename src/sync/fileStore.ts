/**
 * The provider-independent half of a sync adapter (S-44): index bookkeeping, optimistic concurrency and
 * encryption. A provider only has to offer "read a file" / "write these files"; the Gist adapter
 * (`gist.ts`) and the in-memory adapter used by the tests (`memory.ts`) share everything else, so the
 * conflict rules the UI relies on are implemented — and tested — once.
 *
 * Concurrency: `put` and `delete` always re-read the index before writing and compare the caller's
 * `expectedRev` with the index entry's `rev` (the store's own counter). A mismatch returns the remote
 * meta as a conflict; nothing is overwritten. Reads are served from the last snapshot the backend took,
 * so pulling five profiles is one request, not six (ADR-0002: no polling, no chatty clients).
 */
import type { Profile } from '../state/schema';
import {
  asRemoteIndex,
  buildIndexFile,
  buildProfileDocument,
  emptyIndex,
  INDEX_FILE,
  profileFileName,
  readIndexFile,
  readProfileDocument,
} from './codec';
import type { FileCodec } from './codec';
import { SyncError } from './types';
import type { EncryptedBlob, RemoteIndex, RemoteProfileMeta, SyncPutResult, SyncStore } from './types';

/** Deleted profiles are remembered so a pull cannot resurrect them; the oldest ones are dropped. */
export const MAX_TOMBSTONES = 200;

export interface FileBackend {
  /** `fresh` forces a round trip; otherwise a cached snapshot is fine. `null` = the file does not exist. */
  read(name: string, options?: { fresh?: boolean }): Promise<string | null>;
  /** Create or replace the given files; a `null` value removes the file. One request where possible. */
  write(files: Record<string, string | null>): Promise<void>;
}

export interface FileStoreOptions {
  backend: FileBackend;
  codec: FileCodec;
  /** Stamped into the exported document, like the JSON export does. */
  dataVersion: number;
  /** Shown on the other device in the conflict dialog ("Rémi's phone"). */
  deviceName?: string;
  now?: () => number;
}

function parseJson(text: string, what: string): unknown {
  try {
    return JSON.parse(text);
  } catch (cause) {
    throw new SyncError('format', `The sync ${what} is not valid JSON.`, { cause });
  }
}

function pruneTombstones(tombstones: RemoteIndex['tombstones']): RemoteIndex['tombstones'] {
  if (tombstones.length <= MAX_TOMBSTONES) return tombstones;
  return [...tombstones].sort((a, b) => b.deletedAt - a.deletedAt).slice(0, MAX_TOMBSTONES);
}

export function createFileSyncStore(options: FileStoreOptions): SyncStore {
  const { backend, codec, dataVersion } = options;
  const now = options.now ?? (() => Date.now());
  let cached: RemoteIndex | null = null;

  /** Read the index, adopt its encryption header and decrypt it. Missing index = an empty remote. */
  const loadIndex = async (fresh: boolean): Promise<RemoteIndex> => {
    if (!fresh && cached !== null) return cached;
    const text = await backend.read(INDEX_FILE, { fresh });
    if (text === null) {
      await codec.adopt(undefined);
      cached = emptyIndex();
      return cached;
    }
    const { header, body } = readIndexFile(parseJson(text, 'index'));
    await codec.adopt(header);
    cached = asRemoteIndex(await codec.decode(body));
    return cached;
  };

  /** Write the index next to the given files, in a single backend call. */
  const writeIndex = async (index: RemoteIndex, files: Record<string, string | null>): Promise<void> => {
    const body = (await codec.encode(index)) as RemoteIndex | EncryptedBlob;
    const file = buildIndexFile(codec.header(), body);
    await backend.write({ ...files, [INDEX_FILE]: `${JSON.stringify(file, null, 2)}\n` });
    cached = index;
  };

  const sortById = (profiles: RemoteProfileMeta[]): RemoteProfileMeta[] =>
    [...profiles].sort((a, b) => a.id.localeCompare(b.id));

  return {
    async index() {
      return loadIndex(true);
    },

    async list() {
      return (await loadIndex(true)).profiles;
    },

    async get(id) {
      // Makes sure the encryption header is known before anything is decoded.
      await loadIndex(false);
      const text = await backend.read(profileFileName(id));
      if (text === null) return null;
      return readProfileDocument(await codec.decode(parseJson(text, `profile ${id}`)));
    },

    async put(id: string, doc: Profile, expectedRev: number | null): Promise<SyncPutResult> {
      const index = await loadIndex(true);
      const entry = index.profiles.find((meta) => meta.id === id);
      if (entry !== undefined && (expectedRev === null || entry.rev !== expectedRev)) {
        return { ok: false, conflict: entry };
      }
      const rev = (entry?.rev ?? 0) + 1;
      const meta: RemoteProfileMeta = {
        id,
        rev,
        updatedAt: doc.updatedAt,
        docRev: doc.rev,
        name: doc.name,
        ...(options.deviceName === undefined || options.deviceName === ''
          ? {}
          : { deviceName: options.deviceName }),
      };
      const next: RemoteIndex = {
        profiles: sortById([...index.profiles.filter((other) => other.id !== id), meta]),
        tombstones: index.tombstones.filter((stone) => stone.id !== id),
      };
      const document = await codec.encode(buildProfileDocument(doc, dataVersion));
      await writeIndex(next, { [profileFileName(id)]: `${JSON.stringify(document, null, 2)}\n` });
      return { ok: true, rev };
    },

    async delete(id: string, expectedRev: number | null): Promise<SyncPutResult> {
      const index = await loadIndex(true);
      const entry = index.profiles.find((meta) => meta.id === id);
      const tombstone = { id, deletedAt: now() };
      if (entry === undefined) {
        // Already gone. Leave a tombstone anyway so the other device does not push it back.
        if (index.tombstones.some((stone) => stone.id === id)) return { ok: true, rev: expectedRev ?? 0 };
        await writeIndex(
          { profiles: index.profiles, tombstones: pruneTombstones([...index.tombstones, tombstone]) },
          {},
        );
        return { ok: true, rev: expectedRev ?? 0 };
      }
      if (expectedRev !== null && entry.rev !== expectedRev) return { ok: false, conflict: entry };
      const next: RemoteIndex = {
        profiles: index.profiles.filter((meta) => meta.id !== id),
        tombstones: pruneTombstones([...index.tombstones.filter((stone) => stone.id !== id), tombstone]),
      };
      await writeIndex(next, { [profileFileName(id)]: null });
      return { ok: true, rev: entry.rev + 1 };
    },
  };
}
