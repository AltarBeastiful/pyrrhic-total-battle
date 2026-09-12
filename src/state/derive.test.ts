import { describe, expect, it } from 'vitest';

import { BONUS_KEYS, SPECIAL_KEYS } from '../data/types';
import { aggregateBonuses } from '../engine/bonuses';
import { defaultSetup, newProfile } from './defaults';
import {
  buildStackRequest,
  buildUnits,
  captainValue,
  describeTotals,
  eventEnemyFormation,
  resolveSources,
  sourceCaveats,
  vipNeedsManual,
} from './derive';
import type { BattleSetup, Profile } from './schema';

/** A fresh profile and its implicit setup, both mutable, for one test. */
function fixture(): { profile: Profile; setup: BattleSetup } {
  const profile = newProfile('Test', 'device-1');
  const setup = profile.setups[0];
  if (!setup) throw new Error('newProfile() must create exactly one setup');
  return { profile, setup };
}

const sourceById = (sources: ReturnType<typeof resolveSources>, id: string) =>
  sources.find((source) => source.id === id);

describe('resolveSources — captains', () => {
  it('applies level × perLevel + stars[star] on the captain key', () => {
    const { profile, setup } = fixture();
    profile.sources.captains = [
      { id: 'c1', captainId: 'aydae', level: 20, star: 0 },
      { id: 'c2', captainId: 'skadi', level: 10, star: 2 },
    ];
    setup.active.captains = ['c1', 'c2'];

    const sources = resolveSources(profile, setup);
    const aydae = sourceById(sources, 'captain:aydae');
    expect(aydae?.label).toBe('Aydae L20 ★0');
    expect(aydae?.kind).toBe('captain');
    expect(aydae?.health).toEqual({ guardsmen: 20 });
    expect(aydae?.strength).toEqual({ guardsmen: 20 });

    // Skadi's ×2 guardsmen multiplier is already in `perLevel`: 10 × 2 + stars[2] (280) = 300.
    const skadi = sourceById(sources, 'captain:skadi');
    expect(skadi?.strength).toEqual({ guardsmen: 300 });
    expect(skadi?.health).toEqual({ guardsmen: 300 });

    const totals = aggregateBonuses(sources);
    expect(totals.strength.guardsmen).toBe(320);
    expect(totals.health.guardsmen).toBe(320);
  });

  it('does not double-apply the Sofia ÷2 and Amanitore ×1.5 multipliers', () => {
    const { profile, setup } = fixture();
    profile.sources.captains = [
      { id: 'c1', captainId: 'sofia', level: 10, star: 1 },
      { id: 'c2', captainId: 'amanitore', level: 10, star: 1 },
    ];
    setup.active.captains = ['c1', 'c2'];

    const sources = resolveSources(profile, setup);
    expect(sourceById(sources, 'captain:sofia')?.health).toEqual({ army: 7.5 }); // 10 × 0.5 + 2.5
    expect(sourceById(sources, 'captain:sofia')?.strength).toBeUndefined(); // Sofia has no strength block
    expect(sourceById(sources, 'captain:amanitore')?.strength).toEqual({ army: 30 }); // 10 × 1.5 + 15
  });

  it('resolves a captain special key (Hercules) and keeps its note as a caveat', () => {
    const { profile, setup } = fixture();
    profile.sources.captains = [{ id: 'c1', captainId: 'hercules', level: 10, star: 1 }];
    setup.active.captains = ['c1'];

    const sources = resolveSources(profile, setup);
    expect(sourceById(sources, 'captain:hercules')?.special).toEqual({
      armyStrengthAgainstEpicMonsters: 50, // 10 × 2 + stars[1] (30)
    });
    expect(sourceCaveats(profile, setup)).toContain(
      'Hercules: These bonuses only apply on battles against epic monsters.',
    );
  });

  it('gives two entries of the same captain distinct ids', () => {
    const { profile, setup } = fixture();
    profile.sources.captains = [
      { id: 'a', captainId: 'aydae', level: 10, star: 0 },
      { id: 'b', captainId: 'aydae', level: 5, star: 0 },
    ];
    setup.active.captains = ['a', 'b'];

    const sources = resolveSources(profile, setup);
    expect(sources.map((source) => source.id)).toEqual(
      expect.arrayContaining(['captain:aydae', 'captain:aydae#b']),
    );
    expect(aggregateBonuses(sources).health.guardsmen).toBe(15);
  });

  it('exposes the captain formula on its own', () => {
    expect(captainValue({ perLevel: 2, stars: [0, 140, 280] }, 10, 2)).toBe(300);
    expect(captainValue({ perLevel: 1, stars: [0] }, 20, 3)).toBe(20); // missing star row = 0
  });
});

describe('resolveSources — permanent, titles, hero, pills, VIP, dragon, custom', () => {
  it('always includes permanent editors, active or not', () => {
    const { profile, setup } = fixture();
    profile.sources.permanent = [
      {
        id: 'heroTalents',
        name: 'Hero Talents',
        builtin: 'heroTalents',
        health: { army: 10 },
        strength: { army: 20 },
      },
    ];

    const sources = resolveSources(profile, setup);
    const permanent = sourceById(sources, 'permanent:heroTalents');
    expect(permanent?.kind).toBe('permanent');
    expect(permanent?.label).toBe('Hero Talents');
    expect(permanent?.health).toEqual({ army: 10 });
    expect(permanent?.strength).toEqual({ army: 20 });
  });

  it('reads titles and the "+25" pills from the tables', () => {
    const { profile, setup } = fixture();
    setup.active.titles = ['battlemaster'];
    setup.active.otherPills = ['clan-health-bonus'];

    const sources = resolveSources(profile, setup);
    expect(sourceById(sources, 'title:battlemaster')?.health).toEqual({ army: 150 });
    expect(sourceById(sources, 'title:battlemaster')?.special).toEqual({
      doubleDamageChance: 5,
      strikeTwoSquadsChance: 5,
    });
    expect(sourceById(sources, 'pill:clan-health-bonus')?.health).toEqual({ army: 25 });
  });

  it('applies Svyatogor and reports the "alone only" condition as a caveat', () => {
    const { profile, setup } = fixture();
    profile.sources.hero = 'svyatogor';
    setup.active.hero = true;

    const hero = sourceById(resolveSources(profile, setup), 'hero:svyatogor');
    expect(hero?.health).toEqual({ army: 50 });
    expect(hero?.strength).toEqual({ army: 50 });
    expect(sourceCaveats(profile, setup)).toContain('Svyatogor: applies only when marching alone.');
  });

  it('falls back to the hand-typed VIP values when the table row is zero', () => {
    const { profile, setup } = fixture();
    profile.sources.vipLevel = 12;
    profile.sources.vipManual = { health: 40, strength: 45 };

    expect(vipNeedsManual(profile)).toBe(true);
    const vip = sourceById(resolveSources(profile, setup), 'vip');
    expect(vip?.kind).toBe('vip');
    expect(vip?.label).toBe('VIP 12');
    expect(vip?.health).toEqual({ army: 40 });
    expect(vip?.strength).toEqual({ army: 45 });
    expect(sourceCaveats(profile, setup)).toContain(
      'VIP 12 is not in the table — the values you typed are used.',
    );
  });

  it('includes dragon, unknown sources and custom sources when they are active', () => {
    const { profile, setup } = fixture();
    profile.sources.dragon = {
      health: { army: 12 },
      strength: { army: 12 },
      special: { doubleDamageChance: 1 },
    };
    profile.sources.unknown = { health: { melee: 3 }, strength: {} };
    profile.sources.custom = [{ id: 'x1', name: 'Guild buff', health: { army: 5 }, strength: { army: 5 } }];
    setup.active.custom = ['x1'];

    const sources = resolveSources(profile, setup);
    expect(sourceById(sources, 'dragon')?.special).toEqual({ doubleDamageChance: 1 });
    expect(sourceById(sources, 'unknown')?.health).toEqual({ melee: 3 });
    expect(sourceById(sources, 'custom:x1')?.label).toBe('Guild buff');

    setup.active.dragon = false;
    setup.active.unknown = false;
    setup.active.custom = [];
    const off = resolveSources(profile, setup);
    expect(sourceById(off, 'dragon')).toBeUndefined();
    expect(sourceById(off, 'unknown')).toBeUndefined();
    expect(sourceById(off, 'custom:x1')).toBeUndefined();
  });
});

describe('resolveSources — equipment', () => {
  it('looks the quality row up and merges the gem / enchant extras', () => {
    const { profile, setup } = fixture();
    profile.sources.equipment = [
      { id: 'e1', equipmentId: 'emerald-guardian', quality: 'epic', extra: { health: { melee: 5 } } },
    ];
    setup.active.equipment = ['e1'];

    const piece = sourceById(resolveSources(profile, setup), 'equipment:emerald-guardian');
    expect(piece?.label).toBe('Emerald Guardian (Epic)');
    expect(piece?.health).toEqual({ melee: 65 }); // 60 from the epic row + 5 typed
    expect(piece?.strength).toEqual({ melee: 60 });
    expect(piece?.matchup).toEqual([{ attacker: 'melee', target: 'mounted', value: 30 }]);
  });

  it('uses the quality actually selected', () => {
    const { profile, setup } = fixture();
    profile.sources.equipment = [{ id: 'e1', equipmentId: 'emerald-guardian', quality: 'legendary' }];
    setup.active.equipment = ['e1'];

    const piece = sourceById(resolveSources(profile, setup), 'equipment:emerald-guardian');
    expect(piece?.health).toEqual({ melee: 78 });
    expect(piece?.matchup).toEqual([{ attacker: 'melee', target: 'mounted', value: 39 }]);
  });
});

describe('resolveSources — artifacts', () => {
  it('adds the base-level and star-level table rows', () => {
    const { profile, setup } = fixture();
    profile.sources.artifacts = [{ id: 'a1', artifactId: 'heart-of-the-forest', level: 20, star: '2.1' }];
    setup.active.artifacts = ['a1'];

    const artifact = sourceById(resolveSources(profile, setup), 'artifact:heart-of-the-forest');
    expect(artifact?.label).toBe('Heart of the Forest L20 ★2.1');
    expect(artifact?.strength).toEqual({ army: 258 }); // base[20] 80 + star[2.1] 178
    expect(sourceCaveats(profile, setup)).toHaveLength(0);
  });

  it('falls back to the hand-typed values when the artifact has no table', () => {
    const { profile, setup } = fixture();
    profile.sources.artifacts = [
      {
        id: 'a1',
        artifactId: 'ruby-brooch',
        level: 30,
        star: '3.0',
        manual: { health: { melee: 120 }, strength: { melee: 90 } },
      },
    ];
    setup.active.artifacts = ['a1'];

    const artifact = sourceById(resolveSources(profile, setup), 'artifact:ruby-brooch');
    expect(artifact?.health).toEqual({ melee: 120 });
    expect(artifact?.strength).toEqual({ melee: 90 });
    expect(sourceCaveats(profile, setup)).toContain(
      'Ruby Brooch: no level table yet — the values you typed are used.',
    );
  });

  it('maps random-bonus options onto bonus and special keys', () => {
    const { profile, setup } = fixture();
    profile.sources.artifacts = [
      {
        id: 'a1',
        artifactId: 'wardens-quiver',
        level: 1,
        star: '0.1',
        random: { option: 'rangedStrengthAndHealth', value: 30 },
      },
      {
        id: 'a2',
        artifactId: 'zeus-lightning',
        level: 1,
        star: '0.1',
        random: { option: 'doubleDamageChance', value: 4 },
      },
      {
        id: 'a3',
        artifactId: 'ghostflame-lantern',
        level: 1,
        star: '0.1',
        random: { option: 'armyStrengthAgainstEpicMonsters', value: 15 },
      },
    ];
    setup.active.artifacts = ['a1', 'a2', 'a3'];

    const sources = resolveSources(profile, setup);
    expect(sourceById(sources, 'artifact:wardens-quiver')?.health).toEqual({ ranged: 30 });
    expect(sourceById(sources, 'artifact:wardens-quiver')?.strength).toEqual({ ranged: 30 });
    expect(sourceById(sources, 'artifact:zeus-lightning')?.special).toEqual({ doubleDamageChance: 4 });
    expect(sourceById(sources, 'artifact:ghostflame-lantern')?.special).toEqual({
      armyStrengthAgainstEpicMonsters: 15,
    });
  });
});

describe('events', () => {
  it("overrides the enemy formation and adds the event's strength", () => {
    const { profile, setup } = fixture();
    setup.enemy = { melee: 1, ranged: 1, mounted: 1, flying: 1 };
    setup.active.events = ['arachnes', 'ragnarok-fenrir'];

    expect(eventEnemyFormation(setup)).toEqual({ melee: 2, ranged: 2, mounted: 2, flying: 2 });
    const request = buildStackRequest(profile, setup);
    expect(request.enemy).toEqual({ melee: 2, ranged: 2, mounted: 2, flying: 2 });
    expect(request.totals.eventStrength).toBe(130);
    expect(request.activeEvents).toEqual(['arachnes', 'ragnarok-fenrir']);
    expect(sourceCaveats(profile, setup)).toContain(
      "Arachne's Invasion sets the enemy formation for this march.",
    );
  });

  it('keeps the setup formation when no event forces one', () => {
    const { profile, setup } = fixture();
    setup.enemy = { melee: 3, ranged: 0, mounted: 1, flying: 2 };
    setup.active.events = ['ragnarok-fenrir'];

    expect(eventEnemyFormation(setup)).toBeUndefined();
    expect(buildStackRequest(profile, setup).enemy).toEqual({ melee: 3, ranged: 0, mounted: 1, flying: 2 });
  });
});

describe('buildUnits', () => {
  it('applies tier ranges, top-tier category chips and per-unit exclusions', () => {
    const { profile } = fixture();
    profile.troops = {
      guardsmen: { min: 1, max: 3 },
      specialists: { min: 1, max: 1 },
      engineers: null,
      monsters: null,
      topTierExcluded: { guardsmen: ['mounted'], specialists: [] },
      excludedUnitIds: ['swordsman-1'],
    };

    const { units } = buildUnits(profile);
    const ids = units.map((unit) => unit.id);
    expect(ids).toContain('rider-1');
    expect(ids).toContain('rider-2');
    expect(ids).not.toContain('rider-3'); // mounted excluded at the top tier only
    expect(ids).toContain('archer-3');
    expect(ids).toContain('spearman-3');
    expect(ids).not.toContain('archer-4'); // above the range
    expect(ids).not.toContain('swordsman-1'); // per-unit exclusion
    expect(units.some((unit) => unit.group === 'engineers')).toBe(false);
    expect(units.some((unit) => unit.kind === 'monster')).toBe(false);
    expect(units.every((unit) => unit.pool === 'leadership')).toBe(true);
    expect(ids).toHaveLength(8); // 3 guardsmen tiers × 3 categories, minus rider-3
  });

  it('includes monsters when their row is enabled', () => {
    const { profile } = fixture();
    profile.troops.monsters = { min: 3, max: 4 };

    const { units } = buildUnits(profile);
    const monsters = units.filter((unit) => unit.kind === 'monster');
    expect(monsters.length).toBeGreaterThan(0);
    expect(monsters.every((unit) => unit.tier >= 3 && unit.tier <= 4)).toBe(true);
    expect(monsters.every((unit) => unit.pool === 'dominance')).toBe(true);
  });

  it('keeps selected mercenaries and records only the caps that are set', () => {
    const { profile } = fixture();
    profile.mercenaries.selected = [
      { id: 'bear-5', cap: 120 },
      { id: 'knight-6', cap: null },
    ];

    const { units, caps } = buildUnits(profile);
    const ids = units.map((unit) => unit.id);
    expect(ids).toContain('bear-5');
    expect(ids).toContain('knight-6');
    expect(ids).not.toContain('ent-6'); // not selected
    expect(caps).toEqual({ 'bear-5': 120 }); // `null` cap = unlimited = no entry
  });

  it('turns a custom mercenary into a plain unit', () => {
    const { profile } = fixture();
    profile.mercenaries.custom = [
      {
        id: 'custom-test-merc',
        name: 'Test Merc',
        health: 1000,
        strength: 500,
        cost: 10,
        revivalGold: 5,
        doubleDamageChance: 3,
        role: 'monster',
        category: 'flying',
        race: 'dragon',
      },
    ];

    const unit = buildUnits(profile).units.find((candidate) => candidate.id === 'custom-test-merc');
    expect(unit?.kind).toBe('mercenary');
    expect(unit?.pool).toBe('authority');
    expect(unit?.keys).toEqual(['monster', 'flying', 'dragon', 'army']);
    expect(unit?.health).toBe(1000);
    expect(unit?.revival).toEqual({ gold: 5 });
    expect(unit?.training).toBeUndefined();
    expect(buildUnits(profile).caps['custom-test-merc']).toBeUndefined();
  });
});

describe('buildStackRequest', () => {
  it('is well formed for a brand new profile', () => {
    const profile = newProfile('Fresh', 'device-1');
    const setup = defaultSetup('device-1');
    const request = buildStackRequest(profile, setup);

    expect(Object.keys(request.totals.health)).toHaveLength(BONUS_KEYS.length);
    for (const key of BONUS_KEYS) {
      expect(request.totals.health[key]).toBe(0);
      expect(request.totals.strength[key]).toBe(0);
    }
    for (const key of SPECIAL_KEYS) expect(request.totals.special[key]).toBe(0);
    expect(request.totals.matchup).toEqual([]);
    expect(request.totals.eventStrength).toBe(0);

    expect(request.units.map((unit) => unit.id)).toHaveLength(10); // G1–G3 + S1
    expect(request.caps).toEqual({});
    expect(request.housing).toEqual({ leadership: 0, authority: 0, dominance: 0 });
    expect(request.enemy).toEqual({ melee: 1, ranged: 1, mounted: 1, flying: 1 });
    expect(request.activeEvents).toEqual([]);
    expect(request.options).toEqual({
      method: 'elite',
      strictMercsAboveMonsters: false,
      monstersLast: false,
      roundTo10: false,
      relaxedPreservation: false,
    });
    expect(request.recovery).toEqual({
      templeLevel: 0,
      trainingCostReduction: {},
      trainingSpeed: {},
      plan: { mode: 'retrain' },
    });
  });

  it('carries housing, options and the recovery plan of the setup', () => {
    const { profile, setup } = fixture();
    profile.recovery.templeLevel = 30;
    profile.recovery.trainingCostReduction = { guardsmen: 12 };
    setup.housing = { leadership: 500000, authority: 1200, dominance: 900 };
    setup.options = {
      method: 'custom',
      strictMercsAboveMonsters: true,
      monstersLast: true,
      roundTo10: true,
      relaxedPreservation: false,
      customOrder: ['archer-1', 'rider-1'],
    };
    setup.recoveryPlan = { mode: 'selective', selectiveTop: 3 };

    const request = buildStackRequest(profile, setup);
    expect(request.housing).toEqual({ leadership: 500000, authority: 1200, dominance: 900 });
    expect(request.options.customOrder).toEqual(['archer-1', 'rider-1']);
    expect(request.recovery.templeLevel).toBe(30);
    expect(request.recovery.trainingCostReduction).toEqual({ guardsmen: 12 });
    expect(request.recovery.plan).toEqual({ mode: 'selective', selectiveTop: 3 });
  });

  it('forwards the pinned unit types, keeping only the ones the formation still contains', () => {
    const { profile, setup } = fixture();
    expect(buildStackRequest(profile, setup).pinned).toEqual([]);

    profile.troops.excludedUnitIds = ['rider-1'];
    setup.pinnedUnitIds = ['archer-1', 'rider-1', 'not-a-unit'];

    // `rider-1` is excluded and `not-a-unit` does not exist, so neither reaches the engine — but both stay
    // on the setup, so the pin comes back if the exclusion does.
    expect(buildStackRequest(profile, setup).pinned).toEqual(['archer-1']);
    expect(setup.pinnedUnitIds).toEqual(['archer-1', 'rider-1', 'not-a-unit']);
  });
});

describe('describeTotals', () => {
  it('returns one labelled row per key with its contributors', () => {
    const { profile, setup } = fixture();
    profile.sources.captains = [{ id: 'c1', captainId: 'aydae', level: 20, star: 0 }];
    setup.active.captains = ['c1'];
    setup.active.titles = ['battlemaster'];

    const sources = resolveSources(profile, setup);
    const described = describeTotals(aggregateBonuses(sources), sources);

    expect(described.health).toHaveLength(BONUS_KEYS.length);
    expect(described.strength).toHaveLength(BONUS_KEYS.length);
    expect(described.special).toHaveLength(SPECIAL_KEYS.length);

    const guardsmen = described.health.find((row) => row.key === 'guardsmen');
    expect(guardsmen?.label).toBe('Guardsmen');
    expect(guardsmen?.value).toBe(20);
    expect(guardsmen?.contributors).toEqual([
      { sourceId: 'captain:aydae', label: 'Aydae L20 ★0', value: 20 },
    ]);

    const army = described.health.find((row) => row.key === 'army');
    expect(army?.value).toBe(150);
    expect(army?.contributors.map((entry) => entry.label)).toEqual(['Battlemaster']);

    const double = described.special.find((row) => row.key === 'doubleDamageChance');
    expect(double?.label).toBe('Double damage chance');
    expect(double?.value).toBe(5);

    expect(described.health.find((row) => row.key === 'flying')?.contributors).toEqual([]);
  });

  it('falls back to the source id when no sources are given', () => {
    const totals = aggregateBonuses([
      { id: 'permanent:hallOfFame', label: 'Hall of Fame', kind: 'permanent', health: { army: 7 } },
    ]);
    const army = describeTotals(totals).health.find((row) => row.key === 'army');
    expect(army?.contributors).toEqual([
      { sourceId: 'permanent:hallOfFame', label: 'permanent:hallOfFame', value: 7 },
    ]);
  });
});
