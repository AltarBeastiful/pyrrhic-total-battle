/**
 * Sync types (S-44). `RemoteStore` (src/state/storage.ts) stays the contract every adapter implements;
 * it is owned by another story, so the two things the Pull/Push UI needs on top of it live here:
 *
 * - `index()` returns the profile metadata **and** the remote tombstones in one round trip. `list()`
 *   returns neither the profile name nor the tombstones, and a second call would cost a second request.
 * - `RemoteProfileMeta` adds `name` (shown in the plan table and the conflict dialog) and `docRev`
 *   (the `rev` of the stored profile itself, which is what a human recognises).
 *
 * `rev` on a remote meta is the **store's own counter**: it is bumped on every successful `put` and
 * `delete`, and it is what `expectedRev` is checked against. Two devices that independently reach
 * profile `rev` 6 would look identical if the concurrency check used the document's own revision, so
 * the document revision travels as `docRev` and is only ever displayed.
 */
import type { Profile, Tombstone } from '../state/schema';
import type { RemoteDocMeta, RemoteStore } from '../state/storage';

/** One remote profile as the index lists it. */
export interface RemoteProfileMeta extends RemoteDocMeta {
  /** Profile name as it was on the pushing device, for the plan table and the conflict dialog. */
  name: string;
  /** `rev` of the stored profile document (the meta's own `rev` is the store's concurrency counter). */
  docRev: number;
}

/** Everything the planner needs from the remote side, in one round trip. */
export interface RemoteIndex {
  profiles: RemoteProfileMeta[];
  /** Profiles deleted on another device; a pull must not resurrect them. */
  tombstones: Tombstone[];
}

/** Like `RemotePutResult`, but the conflicting meta is the richer one (it is shown to the user). */
export type SyncPutResult = { ok: true; rev: number } | { ok: false; conflict: RemoteProfileMeta };

/** A `RemoteStore` that can also hand over its index in one call. Every adapter implements this. */
export interface SyncStore extends RemoteStore {
  list(): Promise<RemoteProfileMeta[]>;
  index(): Promise<RemoteIndex>;
  put(id: string, doc: Profile, expectedRev: number | null): Promise<SyncPutResult>;
  delete(id: string, expectedRev: number | null): Promise<SyncPutResult>;
}

/** The file format shared with `src/share/exportImport.ts`: export here, import there, sync are one shape. */
export interface ProfileDocument {
  schemaVersion: number;
  dataVersion: number;
  kind: 'profile';
  payload: Profile;
}

// ---- Encryption envelope ---------------------------------------------------------------------------
/** Key-derivation parameters, written in clear in the index so any device can re-derive the key. */
export interface KdfHeader {
  kdf: 'pbkdf2-sha256';
  iterations: number;
  /** Base64, 16 random bytes. */
  salt: string;
}

/** One encrypted file body. `salt` is repeated here so a file is self-describing. */
export interface EncryptedBlob {
  enc: 'aes-gcm';
  salt: string;
  iv: string;
  data: string;
}

// ---- Errors ----------------------------------------------------------------------------------------
export type SyncErrorKind =
  /** The token was rejected (401). */
  | 'auth'
  /** The token is valid but lacks the Gists permission, or the gist belongs to someone else (403). */
  | 'forbidden'
  /** Secondary or primary rate limit hit; retry later. */
  | 'rate-limit'
  /** The gist or the file is gone (404). */
  | 'not-found'
  /** The provider refused the request body (422). */
  | 'invalid'
  /** The request never reached the provider (offline, blocked, CORS). */
  | 'network'
  /** Any other non-2xx answer. */
  | 'http'
  /** The remote is encrypted and we have no passphrase. */
  | 'encrypted'
  /** A passphrase was given but it does not decrypt the remote. */
  | 'passphrase'
  /** The remote files are not a Pyrrhic sync document. */
  | 'format'
  /** WebCrypto is unavailable (very old browser, or a non-secure context). */
  | 'unsupported';

export interface SyncErrorOptions extends ErrorOptions {
  status?: number;
}

/** Every failure the sync layer raises, so the dialog can phrase it without parsing messages. */
export class SyncError extends Error {
  readonly kind: SyncErrorKind;
  readonly status: number | undefined;

  constructor(kind: SyncErrorKind, message: string, options: SyncErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'SyncError';
    this.kind = kind;
    this.status = options.status;
  }
}

export function isSyncError(error: unknown): error is SyncError {
  return error instanceof SyncError;
}

/** A message meant for the user, whatever was thrown. */
export function syncErrorMessage(error: unknown): string {
  if (isSyncError(error)) return error.message;
  if (error instanceof Error) return error.message;
  return 'Something went wrong while syncing.';
}
