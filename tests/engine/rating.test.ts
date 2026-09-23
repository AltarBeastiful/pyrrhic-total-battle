import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { rate, saved } from '../../src/engine/rating';

const RATES = CAMPAIGN.markerRates;

describe('rate — the owner’s rating (W11 §2.1)', () => {
  it('reads a saving as positive and a rise as negative', () => {
    expect(saved(100, 80)).toBeCloseTo(20);
    expect(saved(100, 120)).toBeCloseTo(-20);
  });

  it('a bill of nothing saves nothing', () => {
    expect(saved(0, 50)).toBe(0);
    expect(rate({ damage: 100, gold: 0 }, { damage: 100, gold: 500 }, RATES)).toBe(0);
  });

  it('weighs each cost by its own rate', () => {
    // +2 % damage, 10 % silver saved (÷5 = 2), 40 % queue saved (÷40 = 1), 16 % coins saved (÷8 = 2).
    const before = { damage: 1000, silver: 1000, seconds: 1000, dragonCoins: 100 };
    const after = { damage: 1020, silver: 900, seconds: 600, dragonCoins: 84 };
    expect(rate(before, after, RATES)).toBeCloseTo(2 + 2 + 1 + 2);
  });

  it('a damage loss is paid for by savings, or not', () => {
    // −3 % damage against 10 % silver (2) and 10 % hired (2): +1.
    expect(
      rate({ damage: 100, silver: 100, hired: 10 }, { damage: 97, silver: 90, hired: 9 }, RATES),
    ).toBeCloseTo(1);
    // −3 % damage against 5 % gold (1): −2.
    expect(rate({ damage: 100, gold: 100 }, { damage: 97, gold: 95 }, RATES)).toBeCloseTo(-2);
  });

  it('ignores a cost one side does not state', () => {
    expect(rate({ damage: 100, silver: 100 }, { damage: 100 }, RATES)).toBe(0);
  });

  it('an unchanged march rates zero', () => {
    const bill = { damage: 5, silver: 5, gold: 5, hired: 5, dragonCoins: 5, seconds: 5 };
    expect(rate(bill, bill, RATES)).toBe(0);
  });
});
