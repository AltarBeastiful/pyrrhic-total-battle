/**
 * S-33 — recovery cost. Every figure comes from the captured runs (`totalstack-2026-09-12-runs.json`,
 * `...-mechanics-runs.json`); the "chunk of ten" rule they imply is documented in `src/engine/recovery.ts`.
 */
import { describe, expect, it } from 'vitest';

import {
  chunks,
  recoveryCosts,
  retrainOne,
  reviveOne,
  templeDivisor,
  unitFamily,
} from '../../src/engine/recovery';
import type { RecoverySettings, Stack, UnitDef } from '../../src/engine/types';
import { mercenarySet, monsterSet, troopSet } from '../helpers/units';

const UNITS: UnitDef[] = [
  ...troopSet('ARC1', 'SP2', 'ARC2', 'RD1', 'SP3', 'ARC3', 'RD2', 'RD3'),
  ...monsterSet('WE', 'BB', 'ED', 'SG'),
];

/** Only the fields the recovery code reads are filled in. */
function stack(label: string, count: number): Stack {
  const unit = UNITS.find((candidate) => candidate.label === label)!;
  return {
    unitId: unit.id,
    pool: unit.pool,
    count,
    hpPerUnit: unit.health,
    totalHp: count * unit.health,
    strengthPerUnit: unit.strength,
    target: 'melee',
    damagePerHit: 0,
    featuresDamage: 0,
    doubleDamageChance: 0,
    strikeTwoSquadsChance: 0,
  };
}

/** Run ep-8stacks / mp-bear-army-health-25 / temple20-training-reductions all share this army. */
const EP8 = [
  stack('ARC1', 655),
  stack('SP2', 361),
  stack('ARC2', 361),
  stack('RD1', 327),
  stack('SP3', 202),
  stack('ARC3', 203),
  stack('RD2', 181),
  stack('RD3', 101),
  stack('WE', 18),
  stack('BB', 8),
  stack('ED', 7),
  stack('SG', 6),
];

function settings(overrides: Partial<RecoverySettings> = {}): RecoverySettings {
  return {
    templeLevel: 0,
    trainingCostReduction: {},
    trainingSpeed: {},
    plan: { mode: 'retrain' },
    ...overrides,
  };
}

describe('chunks of ten', () => {
  it('is the game\'s own "up to 90 %" rule: n − chunks(n) = floor(0.9 n) for every n', () => {
    for (let n = 0; n <= 300; n += 1) expect(n - chunks(n)).toBe(Math.floor(0.9 * n));
  });

  it('bills started chunks of ten', () => {
    expect(chunks(0)).toBe(0);
    expect(chunks(1)).toBe(1);
    expect(chunks(10)).toBe(1);
    expect(chunks(11)).toBe(2);
    expect(chunks(18)).toBe(2);
  });
});

describe('retrain all — run ep-8stacks at temple 0', () => {
  const cost = recoveryCosts(EP8, UNITS, settings()).retrain;

  it('reproduces the silver (1,435,200 = troops per unit + monsters per chunk)', () => {
    expect(cost.silver).toBe(1_435_200);
  });

  it('reproduces the dragon coins (1,080 = monsters per chunk)', () => {
    expect(cost.dragonCoins).toBe(1_080);
  });

  it('spends no gold at all: every unit of this army can be recruited again', () => {
    // It was **2,752** until 2026-09-21 — the monsters' revival, which the captured run's "retrain
    // all" gold line was read as (owner: *"in retrain everything, we should retrain monsters"*). A
    // monster is recruited in the Lair ten at a time, which the silver and the coins above already
    // bill in full; only a *hired* unit cannot be recruited again, and this army fields none.
    expect(cost.gold).toBe(0);
  });

  it('reproduces the duration shown as "5d 23h"', () => {
    expect(Math.floor(cost.seconds / 86_400)).toBe(5);
    expect(Math.floor((cost.seconds % 86_400) / 3_600)).toBe(23);
  });
});

describe('run temple20-training-reductions (temple 20, guardsmen −30 % cost / +50 % speed)', () => {
  const cost = recoveryCosts(
    EP8,
    UNITS,
    settings({
      templeLevel: 20,
      trainingCostReduction: { guardsmen: 30 },
      trainingSpeed: { guardsmen: 50 },
    }),
  );

  it('applies the training-cost reduction to the troops only (1,027,320)', () => {
    expect(cost.retrain.silver).toBe(1_027_320);
  });

  it('applies the training-speed bonus to the troops only ("4d 3h")', () => {
    expect(Math.floor(cost.retrain.seconds / 86_400)).toBe(4);
    expect(Math.floor((cost.retrain.seconds % 86_400) / 3_600)).toBe(3);
  });

  it('has no gold left to divide by the temple multiplier under the retrain plan', () => {
    // The divisor is the Temple's and is still exactly the game's table; what changed is that a
    // retrain does not visit the Temple for a monster any more (2026-09-21; the figure was 1,520 =
    // 2,752 / 1.81). The revive plan below is where the divisor is checked on a real figure.
    expect(templeDivisor(20)).toBe(1.81);
    expect(cost.retrain.gold).toBe(0);
  });

  it('reproduces revive-all gold at temple 0, and rounds each stack up under a temple (13,520 → 7,477)', () => {
    // Temple 0 is the captured figure to the coin and always was: with no divisor there is nothing to
    // round. Under a temple it is **7,477 and not the captured 7,470** since 2026-09-21: the game asks a
    // whole price per stack and rounds it **up** (`reviveOne`, measured on the owner's own Temple screen
    // — seven stacks, seven exact matches, three of them a coin out under round-to-nearest), where the
    // captured run's total was rounded once at the end. Seven gold on 7,470, and the game's arithmetic
    // rather than a third-party tool's.
    expect(recoveryCosts(EP8, UNITS, settings()).revive.gold).toBe(13_520);
    expect(cost.revive.gold).toBe(7_477);
  });

  // S-30, 2026-09-13: the Temple revives 90 % of the fallen ("here you can revive up to 90 % of your
  // fallen troops" — and n − chunks(n) is exactly floor(0.9 n)); the tenth unit of every chunk has to be
  // recruited again, so a revive-all still costs one chunk's worth of training silver and training time.
  it('reproduces revive-all silver: 216,000 at temple 0, 173,880 with the guardsmen discount', () => {
    expect(recoveryCosts(EP8, UNITS, settings()).revive.silver).toBe(216_000);
    expect(cost.revive.silver).toBe(173_880);
  });

  it('reproduces revive-all time: "1d 2h" at temple 0, "21h 40m" with +50 % guardsmen speed', () => {
    const plain = recoveryCosts(EP8, UNITS, settings()).revive.seconds;
    expect(plain).toBe(94_380); // 1 d 2 h 13 m, shown as "1d 2h"
    expect(Math.floor(plain / 86_400)).toBe(1);
    expect(Math.floor((plain % 86_400) / 3_600)).toBe(2);
    expect(cost.revive.seconds).toBe(78_040); // 21 h 40 m 40 s, shown as "21h 40m"
    expect(Math.floor(cost.revive.seconds / 3_600)).toBe(21);
    expect(Math.floor((cost.revive.seconds % 3_600) / 60)).toBe(40);
  });

  it('bills the temple divisor on the gold only, never on the silver or the time', () => {
    const plain = recoveryCosts(EP8, UNITS, settings()).revive;
    expect(plain.silver / cost.revive.silver).not.toBeCloseTo(1.81, 2);
    expect(plain.gold / cost.revive.gold).toBeCloseTo(1.81, 1);
  });
});

describe('other captured runs', () => {
  it('reproduces run mp-10stacks (silver 1,294,800, "4d 11h"; its 1,536 gold was the monsters\u2019)', () => {
    const army = [
      stack('ARC1', 455),
      stack('SP2', 251),
      stack('ARC2', 251),
      stack('RD1', 228),
      stack('SP3', 140),
      stack('ARC3', 141),
      stack('RD2', 126),
      stack('RD3', 70),
      stack('WE', 11),
      stack('BB', 5),
      stack('ED', 4),
      stack('SG', 4),
    ];
    const extra = [...troopSet('SW1', 'SP1')];
    const units = [...UNITS, ...extra];
    const withTier1 = [
      ...army,
      { ...stack('ARC1', 459), unitId: 'swordsman-1' },
      { ...stack('ARC1', 455), unitId: 'spearman-1' },
    ];
    const cost = recoveryCosts(withTier1, units, settings()).retrain;
    expect(cost.silver).toBe(1_294_800);
    // 1,536 under the old reading, where a retrain revived the monsters (2026-09-21).
    expect(cost.gold).toBe(0);
    expect(cost.dragonCoins).toBe(1_080);
    expect(Math.floor(cost.seconds / 3_600)).toBe(4 * 24 + 11);
  });

  it('reproduces run ep-round-to-10s (Water Elemental 10 → 120 dragon coins; its 432 gold was the monster\u2019s)', () => {
    const army = [
      stack('ARC1', 660),
      stack('ARC2', 363),
      stack('SP2', 362),
      stack('RD1', 329),
      stack('ARC3', 201),
      stack('SP3', 200),
      stack('RD2', 179),
      stack('RD3', 99),
      stack('WE', 10),
    ];
    const cost = recoveryCosts(army, UNITS, settings()).retrain;
    expect(cost.silver).toBe(1_364_600);
    expect(cost.dragonCoins).toBe(120);
    // 432 under the old reading (2026-09-21): the ten elementals are recruited again, not revived.
    expect(cost.gold).toBe(0);
  });

  it('reproduces run bonus-eng-nodom, an army with no monsters at all', () => {
    const units = [...UNITS, ...troopSet('SW1', 'SP1', 'CAT2')];
    const army = [
      { ...stack('ARC1', 473), unitId: 'swordsman-1' },
      stack('ARC1', 404),
      { ...stack('ARC1', 404), unitId: 'spearman-1' },
      stack('SP2', 223),
      stack('ARC2', 224),
      stack('RD1', 202),
      stack('SP3', 125),
      stack('ARC3', 125),
      stack('RD2', 112),
      stack('RD3', 62),
      { ...stack('ARC1', 27), unitId: 'catapult-2' },
    ];
    const cost = recoveryCosts(army, units, settings()).retrain;
    expect(cost.silver).toBe(1_237_800);
    expect(cost.dragonCoins).toBe(0);
    expect(cost.gold).toBe(0);
    expect(Math.floor(cost.seconds / 3_600)).toBe(4 * 24 + 1);
  });
});

/**
 * **The owner's own Temple, 2026-09-21** — the one set of revive figures in this repo that comes from the
 * *game* rather than from TotalStack, captured beside the journal of the march that filled it.
 *
 * The journal's losses and the Temple's offers pin the 90 % rule stack by stack: 10 → 9, 18 → 16, 37 → 33,
 * 13 → 11, 14 → 12, 174 → 156, 623 → 560 — every one of them `n − chunks(n)` exactly. The gold beside each
 * offer pins the rest: the per-unit `revival.gold` of our tables (rider 8, spearman 4, hunter 8, water
 * elemental 48, battle boar 96, emerald dragon 112, stone gargoyle 128), a **35 % discount** on that
 * account's temple, and a **ceiling** on each stack's own price.
 *
 * **His temple is level 15**, which is how this capture corrected the table: the entry read 1.53 — the
 * game's own two-decimal display — where the seven stacks measure exactly `1 / 0.65`. It is the one level
 * this repo has ever measured, and the test below runs through `templeLevel: 15` rather than applying a
 * factor by hand, so the table and the formula are held together by the game's own figures.
 */
describe('the owner’s Temple, 2026-09-21 (the game’s own figures)', () => {
  /** His temple, and the discount it was measured to apply: `TEMPLE_MULTIPLIER[15]` is `1 / 0.65`. */
  const TEMPLE = 15;
  /** unit · lost in the march · offered by the Temple · gold asked for that offer. */
  const CAPTURED: [string, number, number, number][] = [
    ['rider-3', 174, 156, 812],
    ['spearman-2', 623, 560, 1_456],
    ['battle-boar', 18, 16, 999],
    ['water-elemental', 37, 33, 1_030],
    ['stone-gargoyle', 13, 11, 916],
    ['emerald-dragon', 14, 12, 874],
    ['epic-monster-hunter-6', 10, 9, 47],
  ];

  it('offers 90 % of every fallen stack, and asks the gold our tables price it at', () => {
    const units = [
      ...troopSet('RD3', 'SP2'),
      ...monsterSet('BB', 'WE', 'SG', 'ED'),
      ...mercenarySet('epic-monster-hunter-6'),
    ];
    for (const [id, lost, offered, gold] of CAPTURED) {
      const unit = units.find((one) => one.id === id);
      if (unit === undefined) throw new Error(`${id} is not in the tables`);
      expect(lost - chunks(lost), `${id}: the Temple's own count`).toBe(offered);
      expect(
        reviveOne(unit, lost, settings({ templeLevel: TEMPLE })).gold,
        `${id}: the gold the Temple asked`,
      ).toBe(gold);
    }
  });
});

describe('what a retrain cannot bring back', () => {
  it('charges the Temple for a hired unit under every plan, and for nothing else', () => {
    // Owner, 2026-09-21: a mercenary can never be retrained — there is no camp to recruit it from —
    // so its retrain *is* its revival, which is why it is not one of the families the Battle card
    // offers to tick. A monster, beside it, costs silver, coins and a queue and no gold at all.
    const merc = mercenarySet('wyvern-2')[0]!;
    const monster = UNITS.find((unit) => unit.pool === 'dominance')!;
    expect(retrainOne(merc, 40, settings())).toEqual(reviveOne(merc, 40, settings()));
    expect(retrainOne(merc, 40, settings()).gold).toBeGreaterThan(0);
    const retrained = retrainOne(monster, 40, settings());
    expect(retrained.gold).toBe(0);
    expect(retrained.silver).toBeGreaterThan(0);
    expect(retrained.dragonCoins).toBeGreaterThan(0);
    expect(reviveOne(monster, 40, settings()).gold).toBeGreaterThan(0);
  });
});

describe('recovery plans', () => {
  it('exposes each mode and the one the plan selected', () => {
    const breakdown = recoveryCosts(EP8, UNITS, settings({ plan: { mode: 'revive' } }));
    expect(breakdown.plan).toEqual(breakdown.revive);
    expect(breakdown.retrain.silver).toBeGreaterThan(breakdown.revive.silver);
  });

  it('revives every stack at the top tier of each family, and retrains the rest (selective)', () => {
    // Owner, 2026-09-21: *"for guardsmen the max is G3 so all G3 in the march should count as revived;
    // monsters max is M3 so all M3 stacks in the march should count as revived."* It was one *type* a
    // family, which reads the same on a tier that holds one type and leaves three of four M3 monsters
    // in the training queue on a camp that fields four.
    const breakdown = recoveryCosts(EP8, UNITS, settings({ plan: { mode: 'selective' } }));
    const fielded = EP8.map((stack) => UNITS.find((candidate) => candidate.id === stack.unitId)!);
    const topOf = (family: string): number =>
      Math.max(...fielded.filter((one) => unitFamily(one) === family).map((one) => one.tier));
    // Every stack of this army at its own family's top tier, and nothing else: three tier-3 guardsmen
    // (archer, spearman, rider) and all four tier-3 monsters.
    const expected = fielded
      .filter((unit) => unit.tier === topOf(unitFamily(unit)))
      .map((unit) => unit.id)
      .sort();
    expect([...breakdown.selectiveRevived].sort()).toEqual(expected);
    expect(breakdown.selectiveRevived).toHaveLength(7);

    expect(breakdown.selective.silver).toBeLessThan(breakdown.retrain.silver);
    expect(breakdown.selective.gold).toBeGreaterThan(breakdown.retrain.gold);
    expect(breakdown.plan).toEqual(breakdown.selective);
  });

  it('leaves out of the Temple every family the plan does not name', () => {
    const all = recoveryCosts(EP8, UNITS, settings({ plan: { mode: 'selective' } }));
    const monsters = recoveryCosts(
      EP8,
      UNITS,
      settings({ plan: { mode: 'selective', reviveFamilies: ['monsters'] } }),
    );
    // The four M3 monsters and not one of them (owner, 2026-09-21), and no guardsman.
    expect(monsters.selectiveRevived).toHaveLength(4);
    for (const id of monsters.selectiveRevived) {
      expect(unitFamily(UNITS.find((unit) => unit.id === id)!)).toBe('monsters');
    }
    expect(monsters.selective.gold).toBeLessThan(all.selective.gold);

    // No family at all is "retrain everything", to the coin: the mode stops being a third answer.
    const none = recoveryCosts(EP8, UNITS, settings({ plan: { mode: 'selective', reviveFamilies: [] } }));
    expect(none.selectiveRevived).toEqual([]);
    expect(none.selective).toEqual(none.retrain);
  });

  it('treats temple level 0 as no discount at all', () => {
    expect(templeDivisor(0)).toBe(1);
    // 15 is the one level measured against the game rather than read off its display (2026-09-21).
    expect(templeDivisor(15)).toBe(1.5385);
    expect(templeDivisor(45)).toBe(5.91);
  });
});
