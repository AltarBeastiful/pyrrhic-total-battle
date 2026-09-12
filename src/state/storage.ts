/**
 * Persistence adapters (ADR-0004). The store only ever sees `StorageAdapter`, so swapping localStorage
 * for IndexedDB (`idb-keyval`) later touches this file alone. `RemoteStore` is the sync-side sibling
 * described in investigation 0001; no adapter implements it yet (S-44/S-45).
 */
import type { Profile } from './schema';

/** Single key holding the whole root document (ADR-0004: one document, not ~90 keys). */
export const STORAGE_KEY = 'pyrrhic.v1';
/** Where an unreadable document is parked so a user can still recover it by hand. */
export const CORRUPT_STORAGE_KEY = 'pyrrhic.v1.corrupt';

export interface StorageAdapter {
  load(): string | null;
  save(value: string): void;
  /**
   * Keep a document we failed to migrate or validate, instead of overwriting it with a fresh default.
   * Optional so a minimal adapter (a test double, a future remote-backed one) does not have to bother.
   */
  saveCorrupt?(value: string): void;
}

/**
 * Browser storage. Every call is guarded: Safari private mode throws on `setItem`, and a disabled
 * cookie/storage policy throws on the very first access. Losing persistence must not break the app.
 */
export function createLocalStorageAdapter(storage?: Storage): StorageAdapter {
  const resolve = (): Storage | null => {
    try {
      return storage ?? globalThis.localStorage ?? null;
    } catch {
      return null;
    }
  };
  return {
    load() {
      try {
        return resolve()?.getItem(STORAGE_KEY) ?? null;
      } catch {
        return null;
      }
    },
    save(value) {
      try {
        resolve()?.setItem(STORAGE_KEY, value);
      } catch (error) {
        console.warn('[pyrrhic] could not write to localStorage', error);
      }
    },
    saveCorrupt(value) {
      try {
        resolve()?.setItem(CORRUPT_STORAGE_KEY, value);
      } catch {
        /* nothing else to try */
      }
    },
  };
}

export interface MemoryAdapter extends StorageAdapter {
  /** Number of writes, so tests can assert that saving is debounced. */
  readonly writes: number;
  readonly corrupt: string | null;
}

/** In-memory adapter for tests and for the (rare) browser with no usable storage. */
export function createMemoryAdapter(initial: string | null = null): MemoryAdapter {
  let value = initial;
  let corrupt: string | null = null;
  let writes = 0;
  return {
    load: () => value,
    save(next) {
      value = next;
      writes += 1;
    },
    saveCorrupt(next) {
      corrupt = next;
    },
    get writes() {
      return writes;
    },
    get corrupt() {
      return corrupt;
    },
  };
}

// ---- Remote (sync) contract -------------------------------------------------------------------------
/** One remote profile document as the index lists it. */
export interface RemoteDocMeta {
  id: string;
  rev: number;
  updatedAt: number;
  deviceName?: string;
}

export type RemotePutResult = { ok: true; rev: number } | { ok: false; conflict: RemoteDocMeta };

/**
 * Investigation 0001: the remote holds **one document per profile** plus a small index, so two devices
 * editing different profiles never conflict. `expectedRev` is the optimistic-concurrency check
 * (`null` = "must not exist yet"); a mismatch returns a conflict instead of overwriting.
 * Implementations: Gist (S-45), Google Drive appData (S-46), generic endpoint (S-47).
 */
export interface RemoteStore {
  list(): Promise<RemoteDocMeta[]>;
  get(id: string): Promise<Profile | null>;
  put(id: string, doc: Profile, expectedRev: number | null): Promise<RemotePutResult>;
  delete(id: string, expectedRev: number | null): Promise<RemotePutResult>;
}
