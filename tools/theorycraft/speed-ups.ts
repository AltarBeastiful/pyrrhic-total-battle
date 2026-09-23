/**
 * **The owner's speed-up stock, spent order by order** — lifted out of experiment 158 (2026-09-23) so 160 bills the
 * engine's own bar with exactly the arithmetic 158 billed 157's with. Nothing in it changed in the move.
 */
import { planMarch } from '../../src/engine';
import { recoveryCosts } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';

/** His stock, in hours an item, largest first. */
export const STOCK: readonly { hours: number; count: number }[] = [
  { hours: 24, count: 439 },
  { hours: 15, count: 49 },
  { hours: 8, count: 102 },
  { hours: 3, count: 286 },
  { hours: 1, count: 510 },
  { hours: 0.25, count: 574 },
  { hours: 1 / 60, count: 487 },
];

/** The training orders of one march, in hours: one a troop stack. */
export const ordersOf = (request: StackRequest, counts: Record<string, number>): number[] => {
  const { result } = planMarch(request, counts);
  return result.stacks
    .map((stack) => recoveryCosts([stack], request.units, request.recovery).plan.seconds / 3600)
    .filter((hours) => hours > 0);
};

/**
 * Cover one order of `hours` from `left` (mutated): whole items while they fit, then the cheapest last cover.
 * Returns the hours consumed, or `null` when the stock cannot cover it (the stock is then left as it was).
 */
export const cover = (hours: number, left: number[]): number | null => {
  const take = [...left];
  let remaining = hours;
  let consumed = 0;
  const EPS = 1e-9;
  for (let i = 0; i < STOCK.length; i += 1) {
    const size = STOCK[i]?.hours ?? 0;
    while ((take[i] ?? 0) > 0 && remaining >= size - EPS) {
      take[i] = (take[i] ?? 0) - 1;
      remaining -= size;
      consumed += size;
    }
  }
  if (remaining > EPS) {
    // The last cover: either the smallest single item at least the remainder, or smaller items greedily (which
    // the loop above has already exhausted for sizes ≤ the remainder) — so it is the smallest item left above.
    let best = -1;
    for (let i = STOCK.length - 1; i >= 0; i -= 1) {
      if ((take[i] ?? 0) > 0 && (STOCK[i]?.hours ?? 0) >= remaining - EPS) {
        best = i;
        break;
      }
    }
    if (best < 0) return null;
    take[best] = (take[best] ?? 0) - 1;
    consumed += STOCK[best]?.hours ?? 0;
  }
  take.forEach((c, i) => (left[i] = c));
  return consumed;
};

/** Play the campaign's marches again and again from the full stock; what one campaign costs, and how many fit. */
export const bill = (
  campaign: number[][],
): { queue: number; consumed: number; waste: number; campaigns: number; firstConsumed: number } => {
  const left = STOCK.map((s) => s.count);
  const queue = campaign.flat().reduce((s, h) => s + h, 0);
  let campaigns = 0;
  let consumedAll = 0;
  let firstConsumed = 0;
  for (;;) {
    let spent = 0;
    for (const march of campaign) {
      for (const order of march) {
        const used = cover(order, left);
        if (used === null) {
          return {
            queue,
            consumed: consumedAll,
            waste: consumedAll - queue * campaigns,
            campaigns,
            firstConsumed: campaigns === 0 ? Number.NaN : firstConsumed,
          };
        }
        spent += used;
      }
    }
    campaigns += 1;
    consumedAll += spent;
    if (campaigns === 1) firstConsumed = spent;
    if (queue <= 0 || campaigns > 10_000) {
      return {
        queue,
        consumed: consumedAll,
        waste: consumedAll - queue * campaigns,
        campaigns,
        firstConsumed,
      };
    }
  }
};
