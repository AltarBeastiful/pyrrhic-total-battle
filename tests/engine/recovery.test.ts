/**
 * S-33 — recovery cost. Every figure comes from the captured runs (`totalstack-2026-09-12-runs.json`,
 * `...-mechanics-runs.json`); the "chunk of ten" rule they imply is documented in `src/engine/recovery.ts`.
 */
import { describe, expect, it } from 'vitest';

import { chunks, recoveryCosts, templeDivisor } from '../../src/engine/recovery';
import type { RecoverySettings, Stack, UnitDef } from '../../src/engine/types';
import { monsterSet, troopSet } from '../helpers/units';

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

  it("reproduces the gold (2,752 = the monsters' revive gold: they cannot be retrained)", () => {
    expect(cost.gold).toBe(2_752);
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

  it('divides the gold by the temple multiplier (2,752 / 1.81 = 1,520)', () => {
    expect(templeDivisor(20)).toBe(1.81);
    expect(cost.retrain.gold).toBe(1_520);
  });

  it('reproduces revive-all gold at temple 0 and temple 20 (13,520 → 7,470)', () => {
    expect(recoveryCosts(EP8, UNITS, settings()).revive.gold).toBe(13_520);
    expect(cost.revive.gold).toBe(7_470);
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
  it('reproduces run mp-10stacks (silver 1,294,800, gold 1,536, "4d 11h")', () => {
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
    expect(cost.gold).toBe(1_536);
    expect(cost.dragonCoins).toBe(1_080);
    expect(Math.floor(cost.seconds / 3_600)).toBe(4 * 24 + 11);
  });

  it('reproduces run ep-round-to-10s (Water Elemental 10 → 120 dragon coins, 432 gold)', () => {
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
    expect(cost.gold).toBe(432);
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

describe('recovery plans', () => {
  it('exposes each mode and the one the plan selected', () => {
    const breakdown = recoveryCosts(EP8, UNITS, settings({ plan: { mode: 'revive' } }));
    expect(breakdown.plan).toEqual(breakdown.revive);
    expect(breakdown.retrain.silver).toBeGreaterThan(breakdown.revive.silver);
  });

  it('revives the top-N unit types by tier and retrains the rest (selective)', () => {
    const breakdown = recoveryCosts(EP8, UNITS, settings({ plan: { mode: 'selective', selectiveTop: 3 } }));
    expect(breakdown.selectiveRevived).toHaveLength(3);
    // Tier 3 first: the three tier-3 troops and monsters sort above the tier-1 and tier-2 stacks.
    for (const id of breakdown.selectiveRevived) {
      expect(UNITS.find((unit) => unit.id === id)?.tier).toBe(3);
    }
    expect(breakdown.selective.silver).toBeLessThan(breakdown.retrain.silver);
    expect(breakdown.selective.gold).toBeGreaterThan(breakdown.retrain.gold);
    expect(breakdown.plan).toEqual(breakdown.selective);
  });

  it('treats temple level 0 as no discount at all', () => {
    expect(templeDivisor(0)).toBe(1);
    expect(templeDivisor(15)).toBe(1.53);
    expect(templeDivisor(45)).toBe(5.91);
  });
});
