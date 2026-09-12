import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StoreApi } from 'zustand';

import { newRoot, newSavedStack } from './defaults';
import { createMemoryAdapter } from './storage';
import {
  createAppStore,
  initPersistence,
  loadStore,
  persist,
  PERSIST_DEBOUNCE_MS,
  selectActiveProfile,
  selectActiveSetup,
} from './store';
import type { StoreState } from './store';

function makeStore(): StoreApi<StoreState> {
  return createAppStore(newRoot('test device'));
}

function activeProfile(store: StoreApi<StoreState>) {
  const profile = selectActiveProfile(store.getState());
  if (!profile) throw new Error('no active profile');
  return profile;
}

describe('first run', () => {
  it('starts with one "My account" profile and one implicit setup', () => {
    const store = makeStore();
    const profile = activeProfile(store);
    expect(store.getState().doc.profiles).toHaveLength(1);
    expect(profile.name).toBe('My account');
    expect(profile.troops.guardsmen).toEqual({ min: 1, max: 3 });
    expect(profile.troops.specialists).toEqual({ min: 1, max: 1 });
    expect(profile.troops.engineers).toBeNull();
    expect(profile.sources.permanent).toHaveLength(8);
    expect(profile.setups).toHaveLength(1);
    expect(selectActiveSetup(store.getState())?.id).toBe(profile.activeSetupId);
  });
});

describe('profile actions', () => {
  it('creates, renames, duplicates and activates profiles', () => {
    const store = makeStore();
    const created = store.getState().createProfile('Alt account');
    expect(store.getState().doc.activeProfileId).toBe(created);
    expect(store.getState().doc.profiles).toHaveLength(2);

    store.getState().renameProfile(created, 'Alt');
    expect(activeProfile(store).name).toBe('Alt');

    const copy = store.getState().duplicateProfile(created);
    expect(copy).not.toBeNull();
    expect(copy).not.toBe(created);
    const duplicated = activeProfile(store);
    expect(duplicated.name).toBe('Alt (copy)');
    expect(duplicated.rev).toBe(0);
    // Nested documents must get fresh ids, otherwise two profiles share a sync identity.
    const original = store.getState().doc.profiles.find((p) => p.id === created);
    expect(duplicated.setups[0]?.id).not.toBe(original?.setups[0]?.id);
    expect(duplicated.activeSetupId).toBe(duplicated.setups[0]?.id);

    expect(store.getState().duplicateProfile('missing-id')).toBeNull();
  });

  it('deletes a profile, leaves a tombstone and moves the active id', () => {
    const store = makeStore();
    const first = store.getState().doc.profiles[0]!.id;
    const second = store.getState().createProfile('Second');

    store.getState().deleteProfile(second);
    expect(store.getState().doc.profiles.map((p) => p.id)).toEqual([first]);
    expect(store.getState().doc.tombstones.map((t) => t.id)).toEqual([second]);
    expect(store.getState().doc.activeProfileId).toBe(first);
  });

  it('recreates a default profile when the last one is deleted', () => {
    const store = makeStore();
    const only = store.getState().doc.profiles[0]!.id;
    store.getState().deleteProfile(only);
    const profiles = store.getState().doc.profiles;
    expect(profiles).toHaveLength(1);
    expect(profiles[0]?.id).not.toBe(only);
    expect(store.getState().doc.activeProfileId).toBe(profiles[0]?.id);
    expect(store.getState().doc.tombstones.map((t) => t.id)).toEqual([only]);
  });

  it('ignores unknown ids', () => {
    const store = makeStore();
    const before = store.getState().doc;
    store.getState().renameProfile('missing', 'x');
    store.getState().deleteProfile('missing');
    store.getState().setActiveProfile('missing');
    expect(store.getState().doc).toBe(before);
  });
});

describe('sync metadata', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-12T10:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('bumps rev/updatedAt/deviceId on every profile write', () => {
    const store = makeStore();
    const before = activeProfile(store);
    vi.advanceTimersByTime(5_000);

    store.getState().updateProfile(before.id, { housing: { leadership: 4100, authority: 0, dominance: 0 } });
    const after = activeProfile(store);
    expect(after.rev).toBe(before.rev + 1);
    expect(after.updatedAt).toBeGreaterThan(before.updatedAt);
    expect(after.deviceId).toBe(store.getState().doc.deviceId);
    expect(after.housing.leadership).toBe(4100);
    expect(after.id).toBe(before.id);
  });

  it('accepts an updater function and never lets a patch rewrite the id', () => {
    const store = makeStore();
    const id = activeProfile(store).id;
    store.getState().updateProfile(id, (profile) => ({ name: `${profile.name}!` }));
    expect(activeProfile(store).name).toBe('My account!');

    store.getState().updateProfile(id, { id: 'hijacked' } as never);
    expect(activeProfile(store).id).toBe(id);
  });

  it('bumps the containing profile when a setup changes', () => {
    const store = makeStore();
    const before = activeProfile(store);
    const setupBefore = selectActiveSetup(store.getState())!;
    vi.advanceTimersByTime(1_000);

    store.getState().updateActiveSetup({ housing: { leadership: 500, authority: 10, dominance: 0 } });

    const setupAfter = selectActiveSetup(store.getState())!;
    expect(setupAfter.rev).toBe(setupBefore.rev + 1);
    expect(setupAfter.housing.leadership).toBe(500);
    expect(activeProfile(store).rev).toBe(before.rev + 1);
  });
});

describe('setup actions', () => {
  it('creates, renames, duplicates, activates and deletes setups', () => {
    const store = makeStore();
    const implicitId = activeProfile(store).activeSetupId;

    const created = store.getState().createSetup('Arachne run');
    expect(created).not.toBeNull();
    expect(activeProfile(store).setups).toHaveLength(2);
    expect(activeProfile(store).activeSetupId).toBe(created);

    store.getState().renameSetup(created!, 'Arachne');
    expect(selectActiveSetup(store.getState())?.name).toBe('Arachne');

    const copy = store.getState().duplicateSetup(created!);
    expect(activeProfile(store).setups).toHaveLength(3);
    expect(selectActiveSetup(store.getState())?.name).toBe('Arachne (copy)');

    store.getState().setActiveSetup(implicitId);
    expect(activeProfile(store).activeSetupId).toBe(implicitId);

    store.getState().deleteSetup(copy!);
    expect(activeProfile(store).setups).toHaveLength(2);
    expect(store.getState().doc.tombstones.map((t) => t.id)).toContain(copy);
  });

  it('keeps one implicit setup when the last one is deleted', () => {
    const store = makeStore();
    const only = activeProfile(store).activeSetupId;
    store.getState().deleteSetup(only);
    const profile = activeProfile(store);
    expect(profile.setups).toHaveLength(1);
    expect(profile.setups[0]?.id).not.toBe(only);
    expect(profile.activeSetupId).toBe(profile.setups[0]?.id);
  });
});

describe('saved stacks', () => {
  it('adds, renames, upserts and removes with a tombstone', () => {
    const store = makeStore();
    const setup = selectActiveSetup(store.getState())!;
    const stack = newSavedStack('Bear 4100', setup, store.getState().doc.deviceId);

    store.getState().addSavedStack(stack);
    expect(activeProfile(store).savedStacks).toHaveLength(1);

    store.getState().renameSavedStack(stack.id, 'Bear');
    const renamed = activeProfile(store).savedStacks[0]!;
    expect(renamed.name).toBe('Bear');
    expect(renamed.rev).toBe(stack.rev + 1);

    store.getState().upsertSavedStack({ ...stack, name: 'Bear v2' });
    expect(activeProfile(store).savedStacks).toHaveLength(1);
    expect(activeProfile(store).savedStacks[0]?.name).toBe('Bear v2');

    store.getState().removeSavedStack(stack.id);
    expect(activeProfile(store).savedStacks).toHaveLength(0);
    expect(store.getState().doc.tombstones.map((t) => t.id)).toContain(stack.id);
  });
});

describe('ui', () => {
  it('stores the theme', () => {
    const store = makeStore();
    store.getState().setTheme('dark');
    expect(store.getState().doc.ui.theme).toBe('dark');
    store.getState().setDeviceName("Rémi's phone");
    expect(store.getState().doc.deviceName).toBe("Rémi's phone");
  });
});

describe('loadStore', () => {
  it('returns a fresh root when nothing is stored', () => {
    const adapter = createMemoryAdapter(null);
    expect(loadStore(adapter).profiles).toHaveLength(1);
  });

  it('reads back a stored document', () => {
    const root = newRoot('desktop');
    const adapter = createMemoryAdapter(JSON.stringify(root));
    expect(loadStore(adapter)).toEqual(root);
  });

  it('quarantines a corrupt document and starts from defaults', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const adapter = createMemoryAdapter('{not json');
    const doc = loadStore(adapter);
    expect(doc.profiles[0]?.name).toBe('My account');
    expect(adapter.corrupt).toBe('{not json');
    expect(warn).toHaveBeenCalled();
  });

  it('quarantines a document the schema rejects', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const adapter = createMemoryAdapter(JSON.stringify({ schemaVersion: 1, profiles: 'nope' }));
    loadStore(adapter);
    expect(adapter.corrupt).toContain('"profiles":"nope"');
  });
});

describe('persistence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('debounces writes by 300 ms and writes once for a burst', () => {
    const store = makeStore();
    const adapter = createMemoryAdapter();
    const dispose = persist(store, adapter);

    store.getState().setTheme('dark');
    store.getState().setTheme('light');
    expect(adapter.writes).toBe(0);

    vi.advanceTimersByTime(PERSIST_DEBOUNCE_MS - 1);
    expect(adapter.writes).toBe(0);
    vi.advanceTimersByTime(1);
    expect(adapter.writes).toBe(1);
    expect(JSON.parse(adapter.load() ?? '{}').ui.theme).toBe('light');

    dispose();
    store.getState().setTheme('system');
    vi.advanceTimersByTime(1_000);
    expect(adapter.writes).toBe(1);
  });

  it('flushes the pending document on dispose', () => {
    const store = makeStore();
    const adapter = createMemoryAdapter();
    const dispose = persist(store, adapter);
    store.getState().setTheme('dark');
    dispose();
    expect(adapter.writes).toBe(1);
    expect(JSON.parse(adapter.load() ?? '{}').ui.theme).toBe('dark');
  });

  it('initPersistence hydrates the store then keeps writing', () => {
    const stored = newRoot('desktop');
    stored.ui.theme = 'dark';
    const adapter = createMemoryAdapter(JSON.stringify(stored));
    const store = makeStore();

    const dispose = initPersistence(adapter, store);
    expect(store.getState().doc.deviceName).toBe('desktop');
    expect(store.getState().doc.ui.theme).toBe('dark');

    store.getState().setTheme('light');
    vi.advanceTimersByTime(PERSIST_DEBOUNCE_MS);
    expect(JSON.parse(adapter.load() ?? '{}').ui.theme).toBe('light');
    dispose();
  });
});
