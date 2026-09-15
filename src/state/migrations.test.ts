import { describe, expect, it, vi } from 'vitest';

import { newRoot, newSavedStack } from './defaults';
import {
  migrate,
  migrateProfile,
  migrateSavedStack,
  migrations,
  readSchemaVersion,
  splitTroopExclusions,
} from './migrations';
import { SCHEMA_VERSION } from './schema';

/**
 * A hand-written v1 document: the fixture ADR-0004 asks for, so the migration chain is exercised by a
 * literal payload and not only by whatever `newRoot()` happens to produce today.
 *
 * Its `troops.excludedUnitIds` carries all three cases v1 → v2 has to tell apart: a guardsman the
 * March left out (`rider-1`), a monster of a tier the account *has* passed (`battle-boar`, M3 under
 * an M3–M4 range), and a monster of the top tier it has not unlocked (`magic-dragon`, M4). Only the
 * last one is technology; the other two are march decisions and move to the setups.
 */
function v1Fixture(): Record<string, unknown> {
  const setup = {
    id: '11111111-1111-4111-8111-111111111111',
    updatedAt: 1_757_000_000_000,
    rev: 2,
    deviceId: 'device-a',
    name: 'Epic bear',
    active: {
      captains: ['captain-entry-1'],
      equipment: [],
      artifacts: [],
      titles: [],
      hero: false,
      events: ['ragnarok-fenrir'],
      otherPills: ['personal'],
      vip: true,
      dragon: true,
      unknown: false,
      custom: [],
    },
    housing: { leadership: 4100, authority: 300, dominance: 120 },
    enemy: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
    options: {
      method: 'elite',
      strictMercsAboveMonsters: false,
      monstersLast: false,
      roundTo10: true,
    },
    priority: 'avgDamage',
    recoveryPlan: { mode: 'selective', selectiveTop: 3 },
  };
  const second = { ...setup, id: '44444444-4444-4444-8444-444444444444', name: 'Arachne 8-stack' };
  return {
    schemaVersion: 1,
    dataVersion: 1,
    deviceId: 'device-a',
    deviceName: "Rémi's phone",
    activeProfileId: '22222222-2222-4222-8222-222222222222',
    profiles: [
      {
        id: '22222222-2222-4222-8222-222222222222',
        updatedAt: 1_757_000_000_000,
        rev: 7,
        deviceId: 'device-a',
        name: 'Main account',
        createdAt: 1_756_000_000_000,
        troops: {
          guardsmen: { min: 1, max: 3 },
          specialists: { min: 1, max: 2 },
          engineers: { min: 1, max: 2 },
          monsters: { min: 3, max: 4 },
          topTierExcluded: { guardsmen: ['mounted'], specialists: [] },
          excludedUnitIds: ['rider-1', 'battle-boar', 'magic-dragon'],
        },
        mercenaries: {
          selected: [
            { id: 'mercenary-1', cap: 22 },
            { id: 'mercenary-2', cap: null },
          ],
          custom: [
            {
              id: 'custom-merc-1',
              name: 'Event brute',
              health: 1200,
              strength: 340,
              cost: 12,
              revivalGold: 4,
              doubleDamageChance: 5,
              role: 'guardsmen',
              category: 'melee',
            },
          ],
        },
        sources: {
          permanent: [
            {
              id: 'heroTalents',
              name: 'Hero Talents',
              builtin: 'heroTalents',
              health: { army: 3 },
              strength: {},
            },
          ],
          captains: [{ id: 'captain-entry-1', captainId: 'aydae', level: 40, star: 3 }],
          equipment: [{ id: 'equip-1', equipmentId: 'helmet', quality: 'legendary' }],
          artifacts: [{ id: 'artifact-1', artifactId: 'crown', level: 20, star: '2.0' }],
          titles: ['baron'],
          vipLevel: 9,
          dragon: { health: { army: 2 }, strength: { army: 2 } },
          unknown: { health: {}, strength: {} },
          custom: [],
        },
        recovery: {
          templeLevel: 20,
          trainingCostReduction: { guardsmen: 12.5 },
          trainingSpeed: {},
          plan: { mode: 'retrain' },
        },
        setups: [setup, second],
        activeSetupId: setup.id,
        savedStacks: [],
      },
    ],
    tombstones: [{ id: '33333333-3333-4333-8333-333333333333', deletedAt: 1_756_500_000_000 }],
    ui: { theme: 'dark' },
  };
}

describe('readSchemaVersion', () => {
  it('reads an integer version and falls back to 0', () => {
    expect(readSchemaVersion({ schemaVersion: 3 })).toBe(3);
    expect(readSchemaVersion({})).toBe(0);
    expect(readSchemaVersion('nonsense')).toBe(0);
  });
});

describe('migrate', () => {
  it('accepts a v1 fixture and carries everything it said forward', () => {
    const doc = migrate(v1Fixture());
    expect(doc.schemaVersion).toBe(SCHEMA_VERSION);
    expect(doc.profiles).toHaveLength(1);
    expect(doc.profiles[0]?.setups[0]?.priority).toBe('avgDamage');
    expect(doc.profiles[0]?.mercenaries.custom[0]?.name).toBe('Event brute');
    expect(doc.tombstones).toHaveLength(1);
    expect(doc.ui.theme).toBe('dark');
  });

  it('v1 → v2 moves march exclusions to the setups and leaves the technology alone', () => {
    // The step on its own: v3 takes the setups' list away again, so the end of the chain cannot
    // show what this one did.
    const fixture = v1Fixture();
    const profile = splitTroopExclusions((fixture.profiles as Record<string, unknown>[])[0]!);
    const troops = profile.troops as Record<string, unknown>;

    // Only the top-tier monster the account has not unlocked stays on the profile.
    expect(troops.excludedUnitIds).toEqual(['magic-dragon']);
    // The two march decisions land on every setup, because which march they were taken out of is
    // not knowable from a v1 document — and each march keeps the army the player last saw.
    const setups = profile.setups as Record<string, unknown>[];
    for (const setup of setups) {
      expect(setup.excludedUnitIds).toEqual(['rider-1', 'battle-boar']);
    }
    expect(setups).toHaveLength(2);
  });

  it('v1 → v2 keeps a monster exclusion that is not at the top tier out of the profile', () => {
    const fixture = v1Fixture();
    const profile = (fixture.profiles as Record<string, unknown>[])[0]!;
    // No monster row at all: nothing about a monster id can be technology.
    (profile.troops as Record<string, unknown>).monsters = null;

    const split = splitTroopExclusions(profile);
    expect((split.troops as Record<string, unknown>).excludedUnitIds).toEqual([]);
    expect((split.setups as Record<string, unknown>[])[0]?.excludedUnitIds).toEqual([
      'rider-1',
      'battle-boar',
      'magic-dragon',
    ]);
    // …and the whole chain then keeps the technology empty: nothing here was ever technology.
    expect(migrate(fixture).profiles[0]?.troops.excludedUnitIds).toEqual([]);
  });

  it('v2 → v3 discards the setup’s pinned and left-out lists, and keeps the technology', () => {
    const fixture = v1Fixture();
    const profile = (fixture.profiles as Record<string, unknown>[])[0]!;
    (profile.troops as Record<string, unknown>).excludedUnitIds = ['magic-dragon'];
    const setups = profile.setups as Record<string, unknown>[];
    setups[0]!.excludedUnitIds = ['archer-2'];
    setups[0]!.pinnedUnitIds = ['rider-1'];
    setups[1]!.excludedUnitIds = [];

    const migrated = migrate({ ...fixture, schemaVersion: 2 }).profiles[0];
    // What a march left out and what it kept are gone: both were march state, and a march's own
    // left-out list now lives with the result on screen (S-53).
    for (const setup of migrated?.setups ?? []) {
      expect(setup).not.toHaveProperty('excludedUnitIds');
      expect(setup).not.toHaveProperty('pinnedUnitIds');
    }
    // The technology is untouched.
    expect(migrated?.troops.excludedUnitIds).toEqual(['magic-dragon']);
  });

  it('carries a v1 document all the way to the current version with neither list on any setup', () => {
    const doc = migrate(v1Fixture());
    expect(doc.schemaVersion).toBe(SCHEMA_VERSION);
    for (const setup of doc.profiles[0]?.setups ?? []) {
      expect(setup).not.toHaveProperty('excludedUnitIds');
      expect(setup).not.toHaveProperty('pinnedUnitIds');
    }
    expect(newRoot().profiles[0]?.setups[0]).not.toHaveProperty('excludedUnitIds');
  });

  it('reads a v3 setup that chose Complete optimization as a plan, and drops the campaign card', () => {
    // S-56: the S-54 method was removed as superseded by the plan, and the two fields it shared with it
    // left the card. The horizon and the silver are policy numbers now (`src/config.ts`), so a stored
    // `campaign` has nowhere left to be read — dropping it *is* the migration.
    const fixture = v1Fixture();
    const setups = (fixture.profiles as Record<string, unknown>[])[0]!.setups as Record<string, unknown>[];
    setups[0]!.options = { ...(setups[0]!.options as Record<string, unknown>), method: 'complete' };
    setups[0]!.campaign = { marches: 4, silverBudget: 1_000_000 };

    const migrated = migrate({ ...fixture, schemaVersion: 3 });
    expect(migrated.profiles[0]?.setups[0]?.options.method).toBe('plan');
    expect(migrated.profiles[0]?.setups[0]).not.toHaveProperty('campaign');
    // A setup that chose something else keeps its method, and loses the campaign all the same.
    expect(migrated.profiles[0]?.setups[1]?.options.method).toBe('elite');
    expect(migrated.profiles[0]?.setups[1]).not.toHaveProperty('campaign');
  });

  it('reaches inside a saved stack, whose captured setup chose the removed method', () => {
    // A saved stack is a whole setup, frozen; `3 → 4` has to edit *its* copy or the stack stops parsing.
    const root = newRoot('desktop');
    const setup = root.profiles[0]?.setups[0];
    if (setup === undefined) throw new Error('newRoot() must create one setup');
    const raw = JSON.parse(JSON.stringify(newSavedStack('Bear', setup, 'device-a'))) as {
      setup: Record<string, unknown>;
    };
    raw.setup.options = { ...(raw.setup.options as Record<string, unknown>), method: 'complete' };
    raw.setup.campaign = { marches: 4 };

    const migrated = migrateSavedStack(raw, 3);
    expect(migrated.setup.options.method).toBe('plan');
    expect(migrated.setup).not.toHaveProperty('campaign');
  });

  it('round-trips a freshly created document', () => {
    const root = newRoot('desktop');
    expect(migrate(JSON.parse(JSON.stringify(root)))).toEqual(root);
  });

  it('runs the migration chain for an unversioned (v0) document', () => {
    const { schemaVersion: _dropped, ...unversioned } = v1Fixture();
    expect(readSchemaVersion(unversioned)).toBe(0);
    expect(migrations[0]).toBeTypeOf('function');
    expect(migrate(unversioned).schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('drops unknown fields and warns instead of crashing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fixture = v1Fixture();
    const profiles = fixture.profiles as Record<string, unknown>[];
    const profile = profiles[0] as Record<string, unknown>;
    profile.legacyKillOrder = ['archer-1'];
    // Housing used to live on the profile; a document written before it moved must still load.
    profile.housing = { leadership: 4100, authority: 300, dominance: 120 };
    (fixture as Record<string, unknown>).experiment = true;

    const doc = migrate(fixture);
    expect(doc.profiles[0]).not.toHaveProperty('legacyKillOrder');
    expect(doc.profiles[0]).not.toHaveProperty('housing');
    expect(doc).not.toHaveProperty('experiment');
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toContain('profiles[0].legacyKillOrder');
    expect(warn.mock.calls[0]?.[0]).toContain('profiles[0].housing');
    expect(warn.mock.calls[0]?.[0]).toContain('experiment');
  });

  it('refuses a document written by a newer app', () => {
    expect(() => migrate({ ...v1Fixture(), schemaVersion: SCHEMA_VERSION + 1 })).toThrow(/newer version/);
  });

  it('rejects a document the current schema cannot accept', () => {
    const broken = v1Fixture();
    (broken.profiles as Record<string, unknown>[])[0]!.troops = { guardsmen: 'all' };
    expect(() => migrate(broken)).toThrow();
  });
});

describe('migrateProfile', () => {
  it('validates a profile payload on its own', () => {
    const fixture = v1Fixture();
    const profile = (fixture.profiles as Record<string, unknown>[])[0]!;
    expect(migrateProfile(profile, 1).name).toBe('Main account');
    expect(migrateProfile(profile, 0).name).toBe('Main account');
    expect(() => migrateProfile({ name: 'nope' }, 1)).toThrow();
  });

  it('runs the whole chain on an imported or shared profile too', () => {
    const fixture = v1Fixture();
    const profile = (fixture.profiles as Record<string, unknown>[])[0]!;

    const migrated = migrateProfile(profile, 1);
    // v1 → v2 kept only the technology on the profile, and v2 → v3 dropped what it had moved onto
    // the setups: an imported profile arrives with the army the account owns and no march decision.
    expect(migrated.troops.excludedUnitIds).toEqual(['magic-dragon']);
    expect(migrated.setups[0]).not.toHaveProperty('excludedUnitIds');
  });

  it('drops a v2 profile’s pins on import', () => {
    const fixture = v1Fixture();
    const profile = (fixture.profiles as Record<string, unknown>[])[0]!;
    (profile.setups as Record<string, unknown>[])[0]!.pinnedUnitIds = ['archer-1'];

    expect(migrateProfile(profile, 2).setups[0]).not.toHaveProperty('pinnedUnitIds');
  });
});
