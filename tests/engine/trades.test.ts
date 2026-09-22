/**
 * **The trade strategies, held to their own arithmetic** (S-128, 2026-09-22).
 *
 * The case that matters most is the counter-intuitive one, and it is the defect S-127 shipped: **a strategy
 * that reads more costs rejects fewer marches.** Adding gold to a dominance test does not make it stricter,
 * it makes it easier for a march to escape — and that is how a stop the bar's own criteria reject was kept
 * on eight armies it had not earned.
 */
import { describe, expect, it } from 'vitest';

import type { Priced } from '@/engine/trades';
import { STRATEGIES, beatenBy, beats, ratesOver } from '@/engine/trades';

const at = (damage: number, spend: Partial<Omit<Priced, 'damage'>> = {}): Priced => ({
  damage,
  silver: 0,
  gold: 0,
  dragonCoins: 0,
  hired: 0,
  seconds: 0,
  ...spend,
});

describe('one march beating another', () => {
  it('needs at least the damage, at most each cost read, and one strict improvement', () => {
    const row = at(1_000, { silver: 1_000, hired: 10 });
    expect(beats(at(1_100, { silver: 1_000, hired: 10 }), row, STRATEGIES.criteria)).toBe(true);
    expect(beats(at(1_000, { silver: 900, hired: 10 }), row, STRATEGIES.criteria)).toBe(true);
    expect(beats(at(900, { silver: 100, hired: 1 }), row, STRATEGIES.criteria)).toBe(false);
    // The same march to the unit beats nothing — it is not better on anything.
    expect(beats(at(1_000, { silver: 1_000, hired: 10 }), row, STRATEGIES.criteria)).toBe(false);
  });

  it('reads more costs and therefore rejects LESS — the S-127 defect, pinned', () => {
    // "Aydae alone" in miniature: the incumbent hits harder for fewer chunks, but costs more silver.
    const incumbent = at(17_630_102, { silver: 8_448_400, hired: 111, gold: 5_000 });
    const candidate = at(16_014_855, { silver: 7_351_600, hired: 864, gold: 62_040 });
    // Neither reading rejects it, because the candidate is genuinely cheaper in silver — which is exactly
    // why the shelter criterion, and not a dominance test, is what catches this march.
    expect(beats(incumbent, candidate, STRATEGIES.criteria)).toBe(false);
    expect(beats(incumbent, candidate, STRATEGIES.figures)).toBe(false);
    // Where the readings *do* differ: a march dearer only in gold escapes `figures` and not `criteria`.
    const dearerInGoldAlone = at(900, { silver: 100, hired: 1, gold: 999 });
    const cheap = at(1_000, { silver: 100, hired: 1, gold: 1 });
    expect(beats(cheap, dearerInGoldAlone, STRATEGIES.criteria)).toBe(true);
    expect(beats(cheap, dearerInGoldAlone, STRATEGIES.figures)).toBe(true);
    // ...and the other way round: dearer in gold, better on everything the criteria read.
    const dearGold = at(1_200, { silver: 90, hired: 1, gold: 999 });
    expect(beats(dearGold, cheap, STRATEGIES.criteria)).toBe(true);
    expect(beats(dearGold, cheap, STRATEGIES.figures)).toBe(false);
  });

  it('and the queue is one more way to escape, which is what `everything` costs', () => {
    const row = at(1_000, { silver: 1_000, hired: 10, seconds: 100 });
    const better = at(1_200, { silver: 900, hired: 9, gold: 0, dragonCoins: 0, seconds: 5_000 });
    expect(beats(better, row, STRATEGIES.figures)).toBe(true);
    expect(beats(better, row, STRATEGIES.everything)).toBe(false);
  });

  it('names the march that beat this one, over a field', () => {
    const row = at(1_000, { silver: 1_000, hired: 10 });
    const field = [row, at(800, { silver: 900, hired: 9 }), at(1_100, { silver: 900, hired: 9 })];
    expect(beatenBy(row, field, STRATEGIES.criteria)?.damage).toBe(1_100);
    expect(beatenBy(at(9_999, { silver: 1 }), field, STRATEGIES.criteria)).toBeNull();
  });
});

describe('rating a trade without weighing one marker against another', () => {
  it('reports the damage each extra unit of a cost bought', () => {
    const base = at(1_000, { silver: 100, hired: 10 });
    const richer = at(2_000, { silver: 600, hired: 20, gold: 50 });
    const rates = ratesOver(richer, base);
    expect(rates.silver).toBeCloseTo(1_000 / 500, 9);
    expect(rates.hired).toBeCloseTo(1_000 / 10, 9);
    expect(rates.gold).toBeCloseTo(1_000 / 50, 9);
    // The queue did not rise, so there is no rate for it — not a rate of zero.
    expect(rates.seconds).toBeUndefined();
    expect(rates.dragonCoins).toBeUndefined();
  });

  it('reports a negative rate where the extra spend bought less damage, which is the refusal to explain', () => {
    const rates = ratesOver(at(800, { hired: 900 }), at(1_000, { hired: 100 }));
    expect(rates.hired).toBeCloseTo(-200 / 800, 9);
  });
});
