/**
 * B-33: the Prime Arena input model. The troops card (its Guardsmen level fixes the pool), hand-typed Leadership and Dominance, five captains with one
 * shared gear loadout, and per-source toggles in, the troop pool and the aggregated bonuses out.
 * Expected numbers are read off the game tables (captain star rows, equipment quality rows, talent rank rows).
 */
import { describe, expect, it } from 'vitest';

import { PRIME_ARENA_SOURCES, primeArenaInputs, primeArenaPool } from '../../src/engine/primeArenaInputs';
import type { PrimeArenaInput } from '../../src/engine/primeArenaInputs';
import { defaultSetup, newProfile } from '../../src/state/defaults';
import type { BattleSetup, Profile, ProfileTroops } from '../../src/state/schema';

function account(): Profile {
  const profile = newProfile('arena');
  profile.sources.captains = [
    { id: 'c1', captainId: 'alexander', level: 10, star: 2 }, // mounted: +60 strength, +50 health
  ];
  profile.sources.equipment = [{ id: 'e1', equipmentId: 'emerald-guardian', quality: 'epic' }]; // melee +60 / +60
  profile.sources.artifacts = [];
  profile.sources.dragon = { health: { army: 5 }, strength: { army: 7 } };
  profile.sources.titles = [];
  profile.sources.permanent = [
    { id: 'p-hof', name: 'Hall of Fame', builtin: 'hallOfFame', health: { army: 3 }, strength: { army: 4 } },
    { id: 'p-clan', name: 'Clan', builtin: 'clanTechnologies', health: { army: 9 }, strength: { army: 9 } },
    {
      id: 'p-tal',
      name: 'Talents typed',
      builtin: 'heroTalents',
      health: { army: 100 },
      strength: { army: 100 },
    },
  ];
  profile.sources.custom = [{ id: 'x1', name: 'Temporary', health: { army: 20 }, strength: { army: 20 } }];
  profile.talents.ranks = { '25013': 2 }; // Specialists' strength I, rank 2 = +1 on specialist
  return profile;
}

type Squad = { captains?: string[]; equipment?: string[]; artifacts?: string[]; dragon?: boolean };
const squad = (over: Squad = {}): BattleSetup => {
  const setup = defaultSetup();
  setup.active = {
    ...setup.active,
    captains: over.captains ?? ['c1'],
    equipment: over.equipment ?? ['e1'],
    artifacts: over.artifacts ?? [],
    dragon: over.dragon ?? true,
  };
  setup.housing = { leadership: 120_000, authority: 77, dominance: 90_000 };
  return setup;
};

const base = (over: Partial<PrimeArenaInput> = {}): PrimeArenaInput => ({
  troops: troopsAt(9),
  profile: account(),
  setup: squad(),
  ...over,
});

/** The arena's Troops card with the Guardsmen "to" level at `level` and nothing else set. */
const troopsAt = (level: number, over: Partial<ProfileTroops> = {}): ProfileTroops => ({
  guardsmen: { min: 1, max: level },
  specialists: null,
  engineers: null,
  monsters: null,
  topTierExcluded: { guardsmen: [], specialists: [] },
  excludedUnitIds: [],
  ...over,
});

describe('primeArenaPool', () => {
  it('holds the Guardsmen, Specialists and Monsters from tier 2 up to the Guardsmen level, nothing else', () => {
    const pool = primeArenaPool(troopsAt(9));
    for (const unit of pool) {
      expect(unit.tier).toBeGreaterThanOrEqual(2);
      expect(unit.tier).toBeLessThanOrEqual(9);
      expect(unit.kind === 'monster' || ['guardsmen', 'specialist'].includes(unit.group)).toBe(true);
      expect(unit.kind).not.toBe('mercenary');
    }
    const ids = pool.map((u) => u.id);
    expect(ids).toEqual(
      expect.arrayContaining(['duelist-2', 'whitemane-2', 'kraken-2', 'trickster-2', 'corax-2']),
    );
    expect(ids).not.toContain('josephine-2'); // engineer
    // The minimum is G2, S2 and M3: no tier-1 troop, and monsters begin where the game puts them.
    const lowest = (group: string): number =>
      Math.min(
        ...pool.filter((u) => (u.kind === 'monster' ? 'monster' : u.group) === group).map((u) => u.tier),
      );
    expect(lowest('guardsmen')).toBe(2);
    expect(lowest('specialist')).toBe(2);
    expect(lowest('monster')).toBe(3);
  });

  it('follows the Guardsmen level, and the lower the level the fewer troops', () => {
    const low = primeArenaPool(troopsAt(3));
    expect(low.every((u) => u.tier <= 3)).toBe(true);
    expect(low.length).toBeLessThan(primeArenaPool(troopsAt(9)).length);
  });

  it('is empty while the Guardsmen row is not used', () => {
    expect(primeArenaPool(troopsAt(9, { guardsmen: null }))).toEqual([]);
  });

  it('leaves out the top-tier categories and the unit ids the Troops card drops', () => {
    const full = primeArenaPool(troopsAt(9));
    const dropped = full.find((u) => u.kind === 'monster' && u.tier === 9);
    const category = full.find((u) => u.group === 'guardsmen' && u.tier === 9)?.category;
    const pool = primeArenaPool(
      troopsAt(9, {
        excludedUnitIds: dropped === undefined ? [] : [dropped.id],
        topTierExcluded: { guardsmen: category === undefined ? [] : [category], specialists: [] },
      }),
    );
    expect(pool.map((u) => u.id)).not.toContain(dropped?.id);
    expect(pool.some((u) => u.group === 'guardsmen' && u.tier === 9 && u.category === category)).toBe(false);
    expect(pool.some((u) => u.group === 'guardsmen' && u.tier === 8 && u.category === category)).toBe(true);
  });
});

describe('primeArenaInputs', () => {
  it('passes the hand-typed pools as housing with no authority', () => {
    const out = primeArenaInputs(base());
    expect(out.housing).toEqual({ leadership: 120_000, authority: 0, dominance: 90_000 });
    expect(out.pool).toEqual(primeArenaPool(troopsAt(9)));
  });

  it('counts captains, gear, dragon, Hall of Fame and talents by default', () => {
    const { totals } = primeArenaInputs(base());
    expect(totals.strength.mounted).toBe(60);
    expect(totals.health.mounted).toBe(50);
    expect(totals.strength.melee).toBe(60);
    // dragon 7 + Hall of Fame 4; clan technologies and custom are out
    expect(totals.strength.army).toBe(11);
    expect(totals.health.army).toBe(8);
    // talents come from the rank table, not from the typed Hero Talents row
    expect(totals.strength.specialist).toBe(1);
  });

  it('takes a source out when its toggle is off', () => {
    const { totals } = primeArenaInputs(
      base({
        setup: squad({ captains: [], equipment: [], dragon: false }),
        toggles: { talents: false, hallOfFame: false },
      }),
    );
    expect(totals.strength.mounted).toBe(0);
    expect(totals.strength.melee).toBe(0);
    expect(totals.strength.army).toBe(0);
    expect(totals.strength.specialist).toBe(0);
  });

  it('has no switch for the sources the rules leave out, and never counts them', () => {
    expect(PRIME_ARENA_SOURCES).not.toContain('titles');
    expect(PRIME_ARENA_SOURCES).not.toContain('clanTechnologies');
    expect(PRIME_ARENA_SOURCES).not.toContain('custom');
    const profile = account();
    profile.sources.titles = ['baron'];
    profile.sources.vipLevel = 12;
    const setup = squad();
    // even a setup that switched them on counts none of them
    setup.active = {
      ...setup.active,
      titles: ['baron'],
      vip: true,
      hero: true,
      custom: ['x1'],
      events: ['e'],
    };
    const out = primeArenaInputs(base({ profile, setup }));
    expect(out.sources.map((s) => s.kind)).not.toContain('custom');
    expect(out.sources.map((s) => s.kind)).not.toContain('title');
    expect(out.totals.strength.army).toBe(11);
  });

  it('accepts five captains', () => {
    const profile = account();
    profile.sources.captains = ['a', 'b', 'c', 'd', 'e'].map((id) => ({
      id,
      captainId: 'alexander',
      level: 10,
      star: 2,
    }));
    const out = primeArenaInputs(base({ profile, setup: squad({ captains: ['a', 'b', 'c', 'd', 'e'] }) }));
    expect(out.totals.strength.mounted).toBe(300);
  });

  it('rejects a sixth captain', () => {
    const ids = ['a', 'b', 'c', 'd', 'e', 'f'];
    expect(() => primeArenaInputs(base({ setup: squad({ captains: ids }) }))).toThrow(/five captains/i);
  });

  it('lets the caller override the talent ranks', () => {
    const { totals } = primeArenaInputs(base({ talentRanks: { '25013': 1 } }));
    expect(totals.strength.specialist).toBe(0.5);
  });
});
