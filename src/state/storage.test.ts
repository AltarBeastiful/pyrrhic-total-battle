import { describe, expect, it, vi } from 'vitest';

import { CORRUPT_STORAGE_KEY, createLocalStorageAdapter, createMemoryAdapter, STORAGE_KEY } from './storage';

/** Minimal `Storage` double — the adapter is injected, so these tests stay in the node environment. */
function fakeStorage(options: { throwOnWrite?: boolean } = {}): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    key: (index: number) => [...map.keys()][index] ?? null,
    getItem: (key: string) => map.get(key) ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => {
      if (options.throwOnWrite) throw new Error('QuotaExceededError');
      map.set(key, value);
    },
  };
}

describe('createMemoryAdapter', () => {
  it('round-trips a value and counts writes', () => {
    const adapter = createMemoryAdapter();
    expect(adapter.load()).toBeNull();
    adapter.save('a');
    adapter.save('b');
    expect(adapter.load()).toBe('b');
    expect(adapter.writes).toBe(2);
    adapter.saveCorrupt?.('broken');
    expect(adapter.corrupt).toBe('broken');
  });
});

describe('createLocalStorageAdapter', () => {
  it('uses the single ADR-0004 key and a separate key for a corrupt document', () => {
    const storage = fakeStorage();
    const adapter = createLocalStorageAdapter(storage);
    expect(adapter.load()).toBeNull();
    adapter.save('{"schemaVersion":1}');
    expect(storage.getItem(STORAGE_KEY)).toBe('{"schemaVersion":1}');
    expect(adapter.load()).toBe('{"schemaVersion":1}');
    adapter.saveCorrupt?.('{broken');
    expect(storage.getItem(CORRUPT_STORAGE_KEY)).toBe('{broken');
  });

  it('survives a storage that refuses to write (private mode, quota)', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const adapter = createLocalStorageAdapter(fakeStorage({ throwOnWrite: true }));
    expect(() => adapter.save('x')).not.toThrow();
    expect(() => adapter.saveCorrupt?.('x')).not.toThrow();
    expect(warn).toHaveBeenCalled();
  });

  it('returns null when no storage exists at all', () => {
    const adapter = createLocalStorageAdapter();
    expect(adapter.load()).toBeNull();
  });
});
