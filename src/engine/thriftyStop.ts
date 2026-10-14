/**
 * **The thrifty stop's rule** (owner, 2026-10-14; experiments 232–238, `tools/theorycraft/thrifty-stop.ts`;
 * `CAMPAIGN.planFixes.fifthStop`, `src/config.ts`, holds the numbers and the reasons for them).
 *
 * One pure function over the bar the plan has already settled and the band it was drawn from: it names the march that
 * beats the sweet spot on every cost and every ratio while giving up only some damage and taking a bit more burn.
 * Nothing here searches or battles; every figure is the `repeat` the trade table prints.
 */
import type { PlanPick, PlanTotals } from './plan';

/** The four numbers the rule reads (`CAMPAIGN.planFixes.fifthStop`). */
export interface FifthStopRule {
  /** The share of the sweet spot's damage the pick must keep at least. */
  damageFloor: number;
  /** How far gold and dragon coins may rise above the sweet spot's, as a share. */
  goldTolerance: number;
  /** The share of the sweet spot's damage a silver the pick must keep at least. */
  silverFloor: number;
  /** The share of the sweet spot's damage a merc the pick must keep at least. */
  mercFloor: number;
  /**
   * Up to how many troop types the pool's extra marches take out (`planCampaign`'s thrifty pass): for each set of
   * that many or fewer, the sizer's sheltered maximum over the rest. `0` or unset: the band alone, as first shipped.
   */
  dropTypes?: number | undefined;
  /** How many chunks under that maximum each capped mercenary is also tried at; `0` or unset: none. */
  trims?: number | undefined;
}

const perSilver = (row: PlanTotals): number =>
  row.repeat.silver > 0 ? row.repeat.damage / row.repeat.silver : Infinity;
const perMerc = (row: PlanTotals): number => row.repeat.hiredDamage / Math.max(1, row.repeat.mercLost);

/**
 * The thrifty stop among `pool`, or `undefined`. A row qualifies when, against the sweet spot of `stops`:
 *
 *  - its queue is **strictly shorter** and its silver no higher; its gold and coins rise by no more than
 *    `goldTolerance`;
 *  - its damage a silver and a merc are at least `silverFloor` / `mercFloor` times the sweet spot's, and its damage at
 *    least `damageFloor` times the sweet spot's;
 *  - its burn is **at most the next stop up's** (the cheapest-burning stop that out-hits the sweet spot — `more
 *    mercs` on most bars; owner, 2026-10-14: *"costing some mercs but not too much, below or equal more mercs"*),
 *    so it may burn more than the sweet spot and never more than the rung above it. With no stop up it may not
 *    burn more than the sweet spot.
 *
 * Of the rows that qualify, the one that hits hardest; a tie goes to the shorter queue.
 */
export function thriftyStop<T extends PlanTotals>(
  stops: readonly (PlanTotals & { pick: PlanPick })[],
  pool: readonly T[],
  rule: FifthStopRule,
): T | undefined {
  const sweet = stops.find((stop) => stop.pick === 'sweet-spot');
  if (!sweet) return undefined;
  const s = sweet.repeat;
  const up = stops.filter((stop) => stop.repeat.damage > s.damage).map((stop) => stop.repeat.mercLost);
  const burnLimit = up.length > 0 ? Math.min(...up) : s.mercLost;
  const qualifies = (row: T): boolean => {
    const r = row.repeat;
    return (
      r.mercLost <= burnLimit &&
      r.damage >= s.damage * rule.damageFloor &&
      r.seconds < s.seconds &&
      r.silver <= s.silver &&
      r.gold <= s.gold * (1 + rule.goldTolerance) &&
      (r.dragonCoins ?? 0) <= (s.dragonCoins ?? 0) * (1 + rule.goldTolerance) &&
      perSilver(row) >= perSilver(sweet) * rule.silverFloor &&
      perMerc(row) >= perMerc(sweet) * rule.mercFloor
    );
  };
  return pool
    .filter(qualifies)
    .sort((a, b) => b.repeat.damage - a.repeat.damage || a.repeat.seconds - b.repeat.seconds)[0];
}
