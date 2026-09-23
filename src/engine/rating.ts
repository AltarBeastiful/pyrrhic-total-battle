/**
 * **The owner's rating of a change** (S-135, W11 §2.1): *"this many percent of this cost equals one percent of
 * damage"* — the rates live in `src/config.ts` (`CAMPAIGN.markerRates`), and this is the one place they are
 * applied.
 *
 * ```
 * rate = (damage change %) + Σ (cost saved %) / (that cost's rate)
 * ```
 *
 * A cost that falls is a positive saving; a bill of nothing saves nothing whatever the other side pays (the
 * percent is read off `before`). A cost absent from either side does not count. Plain rates only: the
 * significance of a small absolute saving (50 → 25 gold) is banked (plan §8), not applied here.
 */

/** Percent of a cost worth one percent of damage, per cost (`CAMPAIGN.markerRates`). */
export interface MarkerRates {
  silver: number;
  gold: number;
  hired: number;
  dragonCoins: number;
  seconds: number;
}

/** What a march or a campaign deals and costs. Any cost left out is not rated. */
export interface Bill {
  damage: number;
  silver?: number | undefined;
  gold?: number | undefined;
  /** Hired units burned for good. */
  hired?: number | undefined;
  dragonCoins?: number | undefined;
  /** The training queue, in seconds. */
  seconds?: number | undefined;
}

/** Percent saved on a cost (positive = cheaper), 0 on a bill of nothing. */
export const saved = (before: number, after: number): number =>
  before > 0 ? ((before - after) / before) * 100 : 0;

const COSTS = ['silver', 'gold', 'hired', 'dragonCoins', 'seconds'] as const;

/** The owner's rating of `after` against `before`: damage change % plus each cost saved % over its rate. */
export function rate(before: Bill, after: Bill, rates: MarkerRates): number {
  let score = before.damage > 0 ? ((after.damage - before.damage) / before.damage) * 100 : 0;
  for (const cost of COSTS) {
    const b = before[cost];
    const a = after[cost];
    if (b === undefined || a === undefined) continue;
    score += saved(b, a) / rates[cost];
  }
  return score;
}
