import { beforeEach, expect, test } from 'vitest';

import { createMemoryAdapter } from '@/state/storage';
import { createAppStore, persist } from '@/state/store';

import { trackUnsavedChanges, useUiStore, withSaveTracking } from './uiStore';

beforeEach(() => {
  useUiStore.setState({ pendingShare: null, shareError: null, dirty: false, lastSavedAt: null });
});

test('an edit marks the document dirty and a write clears it', async () => {
  const store = createAppStore();
  const adapter = withSaveTracking(createMemoryAdapter());
  const stopTracking = trackUnsavedChanges(store);
  const stopPersisting = persist(store, adapter, 1);

  store.getState().createProfile('Second');
  expect(useUiStore.getState().dirty).toBe(true);

  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(useUiStore.getState().dirty).toBe(false);
  expect(useUiStore.getState().lastSavedAt).not.toBeNull();

  stopPersisting();
  stopTracking();
});

test('the wrapper keeps the adapter behaviour, corrupt quarantine included', () => {
  const memory = createMemoryAdapter('{"schemaVersion":1}');
  const adapter = withSaveTracking(memory);
  expect(adapter.load()).toBe('{"schemaVersion":1}');
  adapter.saveCorrupt?.('broken');
  expect(memory.corrupt).toBe('broken');
});
