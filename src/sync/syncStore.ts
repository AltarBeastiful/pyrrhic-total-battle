/**
 * Sync settings and per-profile sync state (S-44), persisted under `pyrrhic.sync.v1` — deliberately
 * *not* inside `pyrrhic.v1`: the token is device-private and must never travel in an export, a share
 * link or the synced document itself.
 *
 * The passphrase is the one value that is not persisted at all: it lives in `sessionStorage`, so closing
 * the tab forgets it while a reload during a sync session does not ask again (ADR-0002 — nothing leaves
 * the browser that the user did not ask for; here, nothing durable is even written to disk).
 */
import { create } from 'zustand';

import type { SyncRecord, SyncStateMap } from './engine';

export const SYNC_STORAGE_KEY = 'pyrrhic.sync.v1';
export const PASSPHRASE_SESSION_KEY = 'pyrrhic.sync.passphrase';
/** Bumped if the stored shape below ever changes. */
export const SYNC_STATE_VERSION = 1;

export type SyncAdapterId = 'gist';

export interface SyncSettings {
  adapter: SyncAdapterId;
  /** GitHub fine-grained token, "Gists: Read and write". Stays in this browser. */
  token: string;
  /** Filled in after the first push, so later runs skip the gist lookup. */
  gistId: string;
  encrypt: boolean;
}

export interface SyncStoreState {
  settings: SyncSettings;
  /** Last successful sync per profile id. */
  records: SyncStateMap;
  /** Session-only; empty when the user has not entered it since the tab opened. */
  passphrase: string;
  setSettings: (patch: Partial<SyncSettings>) => void;
  setPassphrase: (value: string) => void;
  setRecords: (records: SyncStateMap) => void;
  setRecord: (id: string, record: SyncRecord) => void;
  /** Forget one profile's sync state (used when a profile is deleted on both sides). */
  forget: (id: string) => void;
  /** Clear everything, token included. */
  reset: () => void;
}

export const DEFAULT_SETTINGS: SyncSettings = { adapter: 'gist', token: '', gistId: '', encrypt: false };

interface PersistedSync {
  version: number;
  settings: SyncSettings;
  records: SyncStateMap;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRecords(value: unknown): SyncStateMap {
  if (!isPlainObject(value)) return {};
  const records: SyncStateMap = {};
  for (const [id, entry] of Object.entries(value)) {
    if (!isPlainObject(entry)) continue;
    const { rev, remoteRev, at } = entry;
    if (typeof rev !== 'number' || typeof remoteRev !== 'number' || typeof at !== 'number') continue;
    records[id] = { rev, remoteRev, at };
  }
  return records;
}

/** Every storage access is guarded: a blocked storage policy must not break the app (ADR-0004). */
function readStorage(storage: 'local' | 'session', key: string): string | null {
  try {
    const target = storage === 'local' ? globalThis.localStorage : globalThis.sessionStorage;
    return target?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function writeStorage(storage: 'local' | 'session', key: string, value: string | null): void {
  try {
    const target = storage === 'local' ? globalThis.localStorage : globalThis.sessionStorage;
    if (value === null) target?.removeItem(key);
    else target?.setItem(key, value);
  } catch {
    /* nothing else to try */
  }
}

export function loadSyncSettings(): { settings: SyncSettings; records: SyncStateMap } {
  const raw = readStorage('local', SYNC_STORAGE_KEY);
  if (raw === null) return { settings: { ...DEFAULT_SETTINGS }, records: {} };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isPlainObject(parsed)) return { settings: { ...DEFAULT_SETTINGS }, records: {} };
    const stored = isPlainObject(parsed.settings) ? parsed.settings : {};
    return {
      settings: {
        adapter: 'gist',
        token: typeof stored.token === 'string' ? stored.token : '',
        gistId: typeof stored.gistId === 'string' ? stored.gistId : '',
        encrypt: stored.encrypt === true,
      },
      records: readRecords(parsed.records),
    };
  } catch {
    return { settings: { ...DEFAULT_SETTINGS }, records: {} };
  }
}

export function saveSyncSettings(state: Pick<SyncStoreState, 'settings' | 'records'>): void {
  const persisted: PersistedSync = {
    version: SYNC_STATE_VERSION,
    settings: state.settings,
    records: state.records,
  };
  writeStorage('local', SYNC_STORAGE_KEY, JSON.stringify(persisted));
}

const initial = loadSyncSettings();

export const useSyncStore = create<SyncStoreState>()((set) => ({
  settings: initial.settings,
  records: initial.records,
  passphrase: readStorage('session', PASSPHRASE_SESSION_KEY) ?? '',
  setSettings: (patch) => {
    set((state) => ({ settings: { ...state.settings, ...patch } }));
  },
  setPassphrase: (value) => {
    writeStorage('session', PASSPHRASE_SESSION_KEY, value === '' ? null : value);
    set({ passphrase: value });
  },
  setRecords: (records) => {
    set({ records });
  },
  setRecord: (id, record) => {
    set((state) => ({ records: { ...state.records, [id]: record } }));
  },
  forget: (id) => {
    set((state) => {
      const records = { ...state.records };
      delete records[id];
      return { records };
    });
  },
  reset: () => {
    writeStorage('session', PASSPHRASE_SESSION_KEY, null);
    set({ settings: { ...DEFAULT_SETTINGS }, records: {}, passphrase: '' });
  },
}));

// The token and the sync state are small and change rarely: write them straight through, no debounce.
useSyncStore.subscribe((state, previous) => {
  if (state.settings === previous.settings && state.records === previous.records) return;
  saveSyncSettings(state);
});
