/**
 * In-memory `SyncStore` (S-44). It is the reference implementation of the contract — the same index
 * bookkeeping, conflict rules and encryption as the Gist adapter, without the HTTP — and it is what the
 * engine tests sync against. It also makes an encrypted round trip testable with no network at all.
 */
import { CURRENT_DATA_VERSION } from '../state/defaults';
import { createCodec } from './codec';
import { createFileSyncStore } from './fileStore';
import type { FileBackend } from './fileStore';
import type { SyncStore } from './types';

export interface MemoryRemoteOptions {
  passphrase?: string;
  dataVersion?: number;
  deviceName?: string;
  /** Start from an existing remote (e.g. the files another device wrote). */
  files?: Record<string, string>;
  now?: () => number;
}

export interface MemoryRemote extends SyncStore {
  /** The stored file bodies, exactly as an adapter would write them. */
  readonly files: Record<string, string>;
  /** Round-trip counters, so a test can assert that pulling many profiles is not many requests. */
  readonly reads: number;
  readonly writes: number;
}

export function createMemoryRemote(options: MemoryRemoteOptions = {}): MemoryRemote {
  const files = new Map<string, string>(Object.entries(options.files ?? {}));
  let reads = 0;
  let writes = 0;

  const backend: FileBackend = {
    read(name) {
      reads += 1;
      return Promise.resolve(files.get(name) ?? null);
    },
    write(changed) {
      writes += 1;
      for (const [name, content] of Object.entries(changed)) {
        if (content === null) files.delete(name);
        else files.set(name, content);
      }
      return Promise.resolve();
    },
  };

  const store = createFileSyncStore({
    backend,
    codec: createCodec(options.passphrase),
    dataVersion: options.dataVersion ?? CURRENT_DATA_VERSION,
    ...(options.deviceName === undefined ? {} : { deviceName: options.deviceName }),
    ...(options.now === undefined ? {} : { now: options.now }),
  });

  return {
    ...store,
    get files() {
      return Object.fromEntries(files);
    },
    get reads() {
      return reads;
    },
    get writes() {
      return writes;
    },
  };
}
