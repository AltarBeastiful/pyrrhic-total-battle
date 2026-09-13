/**
 * Persistence adapters (ADR-0004). The store only ever sees `StorageAdapter`, so swapping localStorage
 * for IndexedDB (`idb-keyval`) later touches this file alone.
 *
 * There is no remote adapter contract here any more: the per-profile `RemoteStore` of investigation
 * 0001 existed for the Gist adapter, which ADR-0009 retired. Account sync pushes the *whole* root
 * document as one opaque blob and lives in `src/account/`.
 */
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
