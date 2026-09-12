import { describe, expect, it, vi } from 'vitest';

import { newRoot } from './defaults';
import { migrate, migrateProfile, migrations, readSchemaVersion } from './migrations';
import { SCHEMA_VERSION } from './schema';

/**
 * A hand-written v1 document: the fixture ADR-0004 asks for, so the migration chain is exercised by a
 * literal payload and not only by whatever `newRoot()` happens to produce today.
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
          monsters: null,
          topTierExcluded: { guardsmen: ['mounted'], specialists: [] },
          excludedUnitIds: ['rider-1'],
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
        setups: [setup],
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
  it('accepts a v1 fixture unchanged', () => {
    const doc = migrate(v1Fixture());
    expect(doc.schemaVersion).toBe(SCHEMA_VERSION);
    expect(doc.profiles).toHaveLength(1);
    expect(doc.profiles[0]?.setups[0]?.priority).toBe('avgDamage');
    expect(doc.profiles[0]?.mercenaries.custom[0]?.name).toBe('Event brute');
    expect(doc.tombstones).toHaveLength(1);
    expect(doc.ui.theme).toBe('dark');
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
});
