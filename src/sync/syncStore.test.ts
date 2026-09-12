// @vitest-environment jsdom
/** Persistence of the sync settings (S-44): the token is stored apart from the synced document. */
import { beforeEach, expect, test } from 'vitest';

import {
  DEFAULT_SETTINGS,
  loadSyncSettings,
  PASSPHRASE_SESSION_KEY,
  saveSyncSettings,
  SYNC_STORAGE_KEY,
  useSyncStore,
} from './syncStore';

beforeEach(() => {
  globalThis.localStorage.clear();
  globalThis.sessionStorage.clear();
  useSyncStore.setState({ settings: { ...DEFAULT_SETTINGS }, records: {}, passphrase: '' });
});

test('settings and per-profile records survive a reload', () => {
  useSyncStore.getState().setSettings({ token: 'github_pat_1', gistId: 'gist1', encrypt: true });
  useSyncStore.getState().setRecord('profile-1', { rev: 3, remoteRev: 2, at: 1_700_000_000_000 });

  const reloaded = loadSyncSettings();
  expect(reloaded.settings).toEqual({
    adapter: 'gist',
    token: 'github_pat_1',
    gistId: 'gist1',
    encrypt: true,
  });
  expect(reloaded.records['profile-1']).toEqual({ rev: 3, remoteRev: 2, at: 1_700_000_000_000 });
});

test('the passphrase goes to sessionStorage only, and reset clears everything', () => {
  useSyncStore.getState().setSettings({ token: 'github_pat_1' });
  useSyncStore.getState().setPassphrase('correct horse');

  expect(globalThis.sessionStorage.getItem(PASSPHRASE_SESSION_KEY)).toBe('correct horse');
  expect(globalThis.localStorage.getItem(SYNC_STORAGE_KEY)).not.toContain('correct horse');

  useSyncStore.getState().reset();
  expect(useSyncStore.getState().settings).toEqual(DEFAULT_SETTINGS);
  expect(globalThis.sessionStorage.getItem(PASSPHRASE_SESSION_KEY)).toBeNull();
});

test('a damaged or foreign stored value falls back to the defaults instead of throwing', () => {
  globalThis.localStorage.setItem(SYNC_STORAGE_KEY, '{not json');
  expect(loadSyncSettings()).toEqual({ settings: DEFAULT_SETTINGS, records: {} });

  saveSyncSettings({
    settings: { adapter: 'gist', token: 't', gistId: '', encrypt: false },
    records: { bad: { rev: 1, remoteRev: 2, at: 3 } },
  });
  globalThis.localStorage.setItem(
    SYNC_STORAGE_KEY,
    JSON.stringify({ version: 1, settings: { token: 42 }, records: { x: 'nope' } }),
  );
  expect(loadSyncSettings()).toEqual({ settings: DEFAULT_SETTINGS, records: {} });
});

test('forgetting one profile leaves the others alone', () => {
  useSyncStore.getState().setRecords({
    a: { rev: 1, remoteRev: 1, at: 1 },
    b: { rev: 2, remoteRev: 2, at: 2 },
  });
  useSyncStore.getState().forget('a');
  expect(Object.keys(useSyncStore.getState().records)).toEqual(['b']);
});
