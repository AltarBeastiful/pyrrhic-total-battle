import { describe, expect, it, vi } from 'vitest';

import { newProfile, newRoot, newSavedStack, uniqueProfileName } from '../state/defaults';
import { SCHEMA_VERSION } from '../state/schema';
import type { Profile, SavedStack } from '../state/schema';
import { createAppStore, selectActiveProfile } from '../state/store';
import { applyImport, exportProfileFile, exportStackFile, parseImport, slugify } from './exportImport';

const DEVICE = 'device-a';
const DATE = new Date('2026-09-12T08:30:00Z');

function sampleProfile(name = 'Rémi — main account'): Profile {
  const profile = newProfile(name, DEVICE);
  profile.sources.vipLevel = 12;
  profile.mercenaries.selected = [{ id: 'mercenary-1', cap: 22 }];
  return profile;
}

function sampleStack(): SavedStack {
  const profile = sampleProfile();
  const stack = newSavedStack('Bear 4100', profile.setups[0]!, DEVICE);
  stack.counts = [
    { unitId: 'archer-1', count: 930 },
    { unitId: 'spearman-1', count: 929 },
  ];
  stack.summary.avgDamage = 14_166_666;
  return stack;
}

describe('slugify', () => {
  it('makes a filename-safe slug', () => {
    expect(slugify('Rémi — main account')).toBe('remi-main-account');
    expect(slugify('  ')).toBe('profile');
    expect(slugify('My Account #2')).toBe('my-account-2');
  });
});

describe('export', () => {
  it('writes pyrrhic-<slug>-<date>.json with the ADR-0004 envelope', () => {
    const profile = sampleProfile();
    const file = exportProfileFile(profile, 3, DATE);
    expect(file.filename).toBe('pyrrhic-remi-main-account-2026-09-12.json');
    const parsed = JSON.parse(file.json);
    expect(parsed.schemaVersion).toBe(SCHEMA_VERSION);
    expect(parsed.dataVersion).toBe(3);
    expect(parsed.kind).toBe('profile');
    expect(parsed.payload.id).toBe(profile.id);
  });

  it('exports a saved stack with its own dataVersion', () => {
    const stack = sampleStack();
    const file = exportStackFile(stack, undefined, DATE);
    expect(file.filename).toBe('pyrrhic-bear-4100-2026-09-12.json');
    const parsed = JSON.parse(file.json);
    expect(parsed.kind).toBe('stack');
    expect(parsed.dataVersion).toBe(stack.dataVersion);
  });
});

describe('parseImport', () => {
  it('validates a profile file and previews it', () => {
    const parsed = parseImport(exportProfileFile(sampleProfile(), 1, DATE).json);
    expect(parsed.kind).toBe('profile');
    if (parsed.kind !== 'profile') throw new Error('wrong kind');
    expect(parsed.preview).toEqual({
      name: 'Rémi — main account',
      createdAt: parsed.payload.createdAt,
      setups: 1,
      savedStacks: 0,
      mercenaries: 1,
      bonusSources: 8,
    });
  });

  it('validates a stack file and previews it', () => {
    const parsed = parseImport(exportStackFile(sampleStack(), 1, DATE).json);
    if (parsed.kind !== 'stack') throw new Error('wrong kind');
    expect(parsed.preview.name).toBe('Bear 4100');
    expect(parsed.preview.stacks).toBe(2);
    expect(parsed.preview.units).toBe(1859);
    expect(parsed.preview.avgDamage).toBe(14_166_666);
  });

  it('rejects junk with a readable message', () => {
    expect(() => parseImport('not json')).toThrow(/not valid JSON/);
    expect(() => parseImport('[]')).toThrow(/does not look like a Pyrrhic export/);
    expect(() => parseImport(JSON.stringify({ kind: 'other', payload: {} }))).toThrow(/unknown "kind"/);
    expect(() =>
      parseImport(JSON.stringify({ schemaVersion: SCHEMA_VERSION + 1, kind: 'profile', payload: {} })),
    ).toThrow(/newer version of Pyrrhic/);
    expect(() =>
      parseImport(JSON.stringify({ schemaVersion: 1, kind: 'profile', payload: { name: 'x' } })),
    ).toThrow();
  });

  it('drops unknown payload fields with a warning instead of failing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const file = JSON.parse(exportProfileFile(sampleProfile(), 1, DATE).json);
    file.payload.legacyField = 42;
    const parsed = parseImport(JSON.stringify(file));
    expect(parsed.payload).not.toHaveProperty('legacyField');
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe('uniqueProfileName', () => {
  it('keeps a free name and numbers the suffix when it is taken', () => {
    expect(uniqueProfileName('Alpha', [])).toBe('Alpha');
    expect(uniqueProfileName('Alpha', ['Alpha'])).toBe('Alpha (imported)');
    expect(uniqueProfileName('Alpha', ['Alpha', 'Alpha (imported)'])).toBe('Alpha (imported 2)');
    expect(uniqueProfileName('Alpha', ['Alpha', 'Alpha (imported)', 'Alpha (imported 2)'])).toBe(
      'Alpha (imported 3)',
    );
  });
});

describe('applyImport', () => {
  it('adds a profile under fresh ids and activates it', () => {
    const store = createAppStore(newRoot('test'));
    const imported = sampleProfile('Imported');
    const parsed = parseImport(exportProfileFile(imported, 1, DATE).json);

    const id = applyImport(store, parsed, 'add');
    expect(id).not.toBe(imported.id);
    expect(store.getState().doc.profiles).toHaveLength(2);
    const active = selectActiveProfile(store.getState())!;
    expect(active.id).toBe(id);
    expect(active.name).toBe('Imported');
    expect(active.rev).toBe(0);
    expect(active.setups[0]?.id).not.toBe(imported.setups[0]?.id);
    expect(active.activeSetupId).toBe(active.setups[0]?.id);
  });

  it('never adds a second profile under an existing name', () => {
    const store = createAppStore(newRoot('test'));
    store.getState().renameProfile(store.getState().doc.activeProfileId, 'Alpha');
    const parsed = parseImport(exportProfileFile(sampleProfile('Alpha'), 1, DATE).json);

    applyImport(store, parsed, 'add');
    applyImport(store, parsed, 'add');

    expect(store.getState().doc.profiles.map((profile) => profile.name)).toEqual([
      'Alpha',
      'Alpha (imported)',
      'Alpha (imported 2)',
    ]);
  });

  it('replaces the profile with the same id, bumping its rev', () => {
    const store = createAppStore(newRoot('test'));
    const existing = selectActiveProfile(store.getState())!;
    const edited: Profile = {
      ...existing,
      name: 'Edited elsewhere',
      sources: { ...existing.sources, vipLevel: 15 },
    };
    const parsed = parseImport(exportProfileFile(edited, 1, DATE).json);

    const id = applyImport(store, parsed, 'replace');
    expect(id).toBe(existing.id);
    expect(store.getState().doc.profiles).toHaveLength(1);
    const after = selectActiveProfile(store.getState())!;
    expect(after.name).toBe('Edited elsewhere');
    expect(after.sources.vipLevel).toBe(15);
    expect(after.rev).toBe(existing.rev + 1);
    expect(after.deviceId).toBe(store.getState().doc.deviceId);
  });

  it('replaces the active profile when the imported id is unknown', () => {
    const store = createAppStore(newRoot('test'));
    const activeId = store.getState().doc.activeProfileId;
    const parsed = parseImport(exportProfileFile(sampleProfile('From a friend'), 1, DATE).json);

    expect(applyImport(store, parsed, 'replace')).toBe(activeId);
    expect(store.getState().doc.profiles).toHaveLength(1);
    expect(selectActiveProfile(store.getState())?.name).toBe('From a friend');
  });

  it('adds a stack under a fresh id and replaces one by id', () => {
    const store = createAppStore(newRoot('test'));
    const stack = sampleStack();
    const parsed = parseImport(exportStackFile(stack, 1, DATE).json);

    const addedId = applyImport(store, parsed, 'add');
    expect(addedId).not.toBe(stack.id);
    expect(selectActiveProfile(store.getState())?.savedStacks).toHaveLength(1);

    const replacedId = applyImport(store, parsed, 'replace');
    expect(replacedId).toBe(stack.id);
    const stacks = selectActiveProfile(store.getState())!.savedStacks;
    expect(stacks).toHaveLength(2);
    expect(stacks.map((entry) => entry.name)).toEqual(['Bear 4100', 'Bear 4100']);
  });
});
