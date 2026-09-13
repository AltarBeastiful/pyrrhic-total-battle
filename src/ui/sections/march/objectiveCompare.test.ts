import { expect, test } from 'vitest';

import { COMPARED_OBJECTIVES, isUnmeasurable } from './objectiveCompare';
import type { TradeoffFigures } from './runStore';

const BASELINE: TradeoffFigures = {
  friendlyHits: 12,
  minDamage: 3_316_771,
  maxDamage: 3_431_285,
  avgDamage: 3_374_028,
  silver: 1_549_800,
  gold: 640,
  dragonCoins: 0,
};

test('an objective with no ratio is always measurable', () => {
  expect(isUnmeasurable('avgDamage', BASELINE)).toBe(false);
  expect(isUnmeasurable('minDamage', BASELINE)).toBe(false);
});

test('a ratio whose denominator is zero on the all-types march is unmeasurable', () => {
  // Investigation 0013 §4: the engine reports `unmeasurable` when every candidate scored −∞. That is
  // decidable from the baseline alone, because dropping unit types can only lower what a march
  // costs — a march with no dragon coins has no subset that spends any.
  expect(isUnmeasurable('damagePerDragonCoin', BASELINE)).toBe(true);
  expect(isUnmeasurable('damagePerSilver', BASELINE)).toBe(false);
  expect(isUnmeasurable('damagePerGold', BASELINE)).toBe(false);
  expect(isUnmeasurable('damagePerGold', { ...BASELINE, gold: 0 })).toBe(true);
});

test('the comparison offers every objective the bar does, and only those', () => {
  expect([...COMPARED_OBJECTIVES]).toEqual([
    'avgDamage',
    'minDamage',
    'damagePerSilver',
    'damagePerGold',
    'damagePerDragonCoin',
  ]);
});
