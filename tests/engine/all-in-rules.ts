/**
 * **The all-in's two bar rules** (experiment 174, 2026-09-24; the owner, on his browser setup: *"why all in on
 * my current setup in my browser doesn't up the mercs to 14? … Check why there's no test for that"*).
 *
 * The `all-in` is the stop named for the mercenaries it spends, so on every bar that carries one:
 *
 *  - **(a)** it fields more mercenaries, summed over every march of its campaign, than every other stop does
 *    over every march of theirs;
 *  - **(b)** no other stop beats it on damage and silver (at least as much damage for no more silver) while
 *    fielding at least as many mercenaries.
 *
 * "Mercenaries" is the authority pool, capped or not — what the stop is named for. The dominance pool's
 * monsters are hired stock too, but they are retrained like troops (S-102), and counting them let the all-in
 * of his setup field the sweet spot's ten hunters a march and still read as "more hired" by filling the
 * dominance pool. A march is counted as the campaign plays it (`marchesOf`: the sequence, or the repeats, the
 * finale and the troops-only tail).
 *
 * Before 174 the only check on the all-in's count was `mercLost ≥` the stop before it
 * (`plan-criteria.test.ts`'s `expectCriteria`), which a campaign burning the same chunks passes.
 */
import type { PlanRow, PlanTotals } from '@/engine/plan';
import type { StackRequest } from '@/engine/types';

import { marchesOf } from './plan-campaign';

export const mercenariesOver = (request: StackRequest, row: PlanTotals): number => {
  const mercenary = new Set(request.units.filter((unit) => unit.pool === 'authority').map((unit) => unit.id));
  return marchesOf(row).reduce(
    (sum, counts) =>
      sum + Object.entries(counts).reduce((inner, [id, count]) => inner + (mercenary.has(id) ? count : 0), 0),
    0,
  );
};

const figures = (request: StackRequest, row: PlanRow): string =>
  `${row.pick} (${Math.round(row.totalDamage).toLocaleString('en-US')} damage, ` +
  `${row.silver.toLocaleString('en-US')} silver, ${String(mercenariesOver(request, row))} mercenaries fielded)`;

/** Rule (a): the lines naming every stop that fields at least as many mercenaries as the all-in. */
export function allInFieldsTheMost(request: StackRequest, stops: readonly PlanRow[]): string[] {
  const allIn = stops.find((row) => row.pick === 'all-in');
  if (!allIn) return [];
  const fielded = mercenariesOver(request, allIn);
  return stops
    .filter((other) => other !== allIn && mercenariesOver(request, other) >= fielded)
    .map((other) => `${figures(request, allIn)} fields no more than ${figures(request, other)}`);
}

/** Rule (b): the lines naming every stop that beats the all-in on damage and silver, fielding at least as many. */
export function allInNotBeaten(request: StackRequest, stops: readonly PlanRow[]): string[] {
  const allIn = stops.find((row) => row.pick === 'all-in');
  if (!allIn) return [];
  const fielded = mercenariesOver(request, allIn);
  return stops
    .filter(
      (other) =>
        other !== allIn &&
        other.totalDamage >= allIn.totalDamage &&
        other.silver <= allIn.silver &&
        mercenariesOver(request, other) >= fielded,
    )
    .map((other) => `${figures(request, allIn)} is beaten by ${figures(request, other)}`);
}
