/**
 * B-33: the Prime Arena input model. The troops card (its Guardsmen level fixes the pool), hand-typed Leadership and Dominance, five captains with one
 * shared gear loadout, and per-source toggles in, the troop pool and the aggregated bonuses out.
 * Expected numbers are read off the game tables (captain star rows, equipment quality rows, talent rank rows).
 */
import { describe, expect, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import { PRIME_ARENA_SOURCES, primeArenaInputs, primeArenaPool } from '../../src/engine/primeArenaInputs';
import type { PrimeArenaInput } from '../../src/engine/primeArenaInputs';
import { defaultSetup, newProfile } from '../../src/state/defaults';
import { resolveSources } from '../../src/state/derive';
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
      expect(unit.kind === 'monster' || ['guardsmen', 'specialist'].includes(String(unit.group))).toBe(true);
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
        ...pool
          .filter((u) => String(u.kind === 'monster' ? 'monster' : u.group) === group)
          .map((u) => u.tier),
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

  it('counts artifact bonuses against other players, in the same bracket as the others', () => {
    const profile = account();
    profile.sources.artifacts = [
      { id: 'crown', artifactId: 'forest-crown', level: 1, star: '0.1' }, // army 35.5, and 35.5 against players
      { id: 'blades', artifactId: 'mars-twin-blades', level: 1, star: '0.1' }, // army 42 against players, strike two 1.1
    ];
    const setup = squad({ artifacts: ['crown', 'blades'] });
    const { totals } = primeArenaInputs(base({ profile, setup }));
    expect(totals.strength.army).toBe(11 + 71 + 42); // dragon and Hall of Fame, then the two artifacts
    expect(totals.health.army).toBe(8 + 71 + 42);
    expect(totals.special.strikeTwoSquadsChance).toBe(1.1);

    // The calculator reads the same artifacts without what they give against other players.
    const march = aggregateBonuses(resolveSources(profile, setup));
    const without = aggregateBonuses(resolveSources(profile, squad()));
    expect(march.strength.army - without.strength.army).toBe(35.5);
    expect(march.health.army - without.health.army).toBe(35.5);
    expect(march.special.strikeTwoSquadsChance).toBe(1.1);
  });

  it('counts no captain limited to a march kind, only the unconditional ones', () => {
    const profile = account();
    profile.sources.captains = [
      { id: 'c1', captainId: 'alexander', level: 10, star: 2 },
      { id: 'h', captainId: 'hercules', level: 10, star: 2 }, // onlyOn: epic
      { id: 'a', captainId: 'amanitore', level: 10, star: 2 }, // onlyOn: group
    ];
    const withBoth = primeArenaInputs(base({ profile, setup: squad({ captains: ['c1', 'h', 'a'] }) }));
    const without = primeArenaInputs(base({ profile, setup: squad({ captains: ['c1'] }) }));
    expect(withBoth.totals).toEqual(without.totals);
    // a setup that names another march type cannot bring them back
    const named = squad({ captains: ['c1', 'h', 'a'] });
    named.marchType = 'group';
    expect(primeArenaInputs(base({ profile, setup: named })).totals).toEqual(without.totals);
  });

  it("gates a captain's star bonus on the star count, from the captain table's own ladder (Leonidas, melee health)", () => {
    // Ladder in src/data/tables/captains.json: health stars [0, 0, 40, 40, 120, 120, 280]; level adds 1 per level.
    // The table is indexed from the first star: `star` below is in-game stars − 1, so the first health boost
    // (+40) is at index 2 = 3 stars in game, as the owner says.
    const melee = (star: number /* in-game stars − 1 */): number => {
      const profile = account();
      profile.sources.captains = [{ id: 'l', captainId: 'leonidas', level: 10, star }];
      return primeArenaInputs(base({ profile, setup: squad({ captains: ['l'] }) })).totals.health.melee;
    };
    const none = melee(0);
    expect(melee(1)).toBe(none);
    expect(melee(2)).toBe(none + 40);
    expect(melee(3)).toBe(none + 40);
    expect(melee(4)).toBe(none + 120);
    expect(melee(6)).toBe(none + 280);
  });

  it('counts the typed Monuments and Personal Technologies, and not the stand-ins the arena used to read', () => {
    expect(PRIME_ARENA_SOURCES).toEqual(expect.arrayContaining(['monuments', 'personalTechnologies']));
    for (const gone of ['customization', 'armyModernization', 'monstersBoost']) {
      expect(PRIME_ARENA_SOURCES).not.toContain(gone);
    }
    const profile = account();
    profile.sources.permanent.push(
      {
        id: 'monuments',
        name: 'Monuments',
        builtin: 'monuments',
        health: { army: 2 },
        strength: { melee: 5 },
      },
      {
        id: 'personalTechnologies',
        name: 'Personal Technologies',
        builtin: 'personalTechnologies',
        health: { mounted: 6 },
        strength: { army: 3 },
      },
      {
        id: 'p-cu',
        name: 'Customization',
        builtin: 'customization',
        health: { army: 50 },
        strength: { army: 50 },
      },
      {
        id: 'p-am',
        name: 'Army Modernization',
        builtin: 'armyModernization',
        health: { army: 50 },
        strength: { army: 50 },
      },
    );
    const { totals } = primeArenaInputs(base({ profile }));
    expect(totals.strength.melee).toBe(60 + 5); // equipment + Monuments
    expect(totals.health.army).toBe(8 + 2); // dragon + Hall of Fame + Monuments
    expect(totals.health.mounted).toBe(50 + 6); // captain + Personal Technologies
    expect(totals.strength.army).toBe(11 + 3);
    const off = primeArenaInputs(
      base({ profile, toggles: { monuments: false, personalTechnologies: false } }),
    );
    expect(off.totals.strength.melee).toBe(60);
    expect(off.totals.health.mounted).toBe(50);
    expect(off.totals.strength.army).toBe(11);
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
