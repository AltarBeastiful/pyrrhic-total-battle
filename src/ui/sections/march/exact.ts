/**
 * **The exhaustive raise** (S-143b): `Best` with the sampling taken out, as the app's own march.
 *
 * The algorithm is `src/engine/exact.ts` and knows nothing about battles. This file is the half that does:
 * what a slot is on a march (a hired stack, from the plan's own count up to `min(shelter ceiling, owned
 * stock)`) and what a score is (the march's worst opening, replayed by `applyCounts`, `-Infinity` when the
 * housing cannot pay for the vector). Every bound is `raise.ts`'s own — the same `troopFloor`,
 * `shelterCeiling` and housing check the four shipped positions live under — so **every vector this can
 * answer with is a march the game would take**, and the bounds have one definition rather than two.
 *
 * Three things make it *the answer* rather than another heuristic, and each is a promise the benchmark
 * asserts on every stop of every army (`tools/theorycraft/180-the-positions.test.ts`):
 *
 *   1. **The seed is the shipped answer.** `raisedCounts` is called first, and its counts are where the
 *      search starts from, so `Best v2` is at least `Best` **by construction** — the search takes strict
 *      improvements only and cannot come out below where it began.
 *   2. **It is a raise, never a re-sizer.** Slots run from the plan's own count upward, so nothing here can
 *      field fewer units than the plan did (the promise `raise.ts` keeps for all five positions).
 *   3. **The whole army pays for it.** The housing is counted over **every unit of the pool**, not only the
 *      stacks being moved — experiment 180's own promise check caught the first version of this search
 *      spending the same dominance twice, and that is why it is written this way.
 *
 * **Which pools it walks** (owner, 2026-09-29: *"give another options for both"*): every raised pool whose
 * own control stands on `v2`, and no other. With both on `v2` — which is what pressing the segment does —
 * it is **one search over the mercenaries and the monsters together**, and that is the configuration
 * experiment 181 measured: the joint answer is worth a median +2.80 % and up to +5.45 % of damage over the
 * shipped `Best`, on 10 of the 43 stops where a position moves a count at all. A pool standing on another
 * position is **held at that position's counts** while the others are walked, so a mixed control answers the
 * question it looks like it is asking.
 *
 * **Where it runs.** Not here and never on the main thread: the widest box measured is 908 684 vectors and
 * takes ~50 s (experiment 182). The March asks for it through the worker (`raiseSearch.ts`), shows
 * `raisedCounts`' own answer until it lands, and gets this one in place of it.
 */
import { exactSearch } from '@/engine/exact';
import type { SearchSlot } from '@/engine/exact';
import type { StackRequest, StackResult } from '@/engine/types';

import { applyCounts } from './manual';
import { RAISED_POOLS, countsOf, raisedCounts, shelterCeiling, troopFloor } from './raise';
import type { RaiseModes, RaisedPool } from './raise';

/** What the search needs to reproduce the march it was asked about — the pane's own snapshot, in full. */
export interface ExactRaiseInput {
  request: StackRequest;
  base: StackResult;
  modes: RaiseModes;
}

/** The exhaustive answer, in the app's own shape: a count per walked stack, and how it was found. */
export interface ExactRaiseAnswer {
  /**
   * **A count for every stack the search walked, and not only the ones it moved.** The distinction is not
   * cosmetic and the sparse version was a bug: a record diffed against the *plan's* own counts and then
   * merged over the shipped `Best`'s answer — which is how the March merges it — silently keeps the seed's
   * count wherever the search decided to come back **down** to the plan's. That is exactly the "two stacks
   * only improve together" move the pairwise neighbourhood exists for, so the vector on screen would be one
   * the search never scored, and it could sit below the `Best` it was seeded with.
   */
  counts: Record<string, number>;
  /** `walked` when the whole box was enumerated, `searched` when the multistart search answered. */
  how: 'walked' | 'searched';
  /** The vectors in the box — how much space the search was allowed, reported rather than hidden. */
  space: number;
}

/** The pools whose own control stands on `v2`: the stacks this search may move. */
export function exhaustivePools(modes: RaiseModes): RaisedPool[] {
  return RAISED_POOLS.filter((pool) => modes[pool] === 'v2');
}

/**
 * **The best this box has**, or `null` when there is nothing to search: no pool stands on `v2`, the march
 * fields no troop to shelter under, or every stack of a `v2` pool is already at its ceiling or its stock.
 * `null` is not "the plan's counts are the answer" — a caller that gets `null` falls back to what
 * `raisedCounts` says, which is the shipped `Best` and is what the March was drawing anyway.
 */
export function exactRaise(
  request: StackRequest,
  base: StackResult,
  modes: RaiseModes,
): ExactRaiseAnswer | null {
  const pools = exhaustivePools(modes);
  if (pools.length === 0) return null;
  const floor = troopFloor(base);
  if (floor === null) return null;

  /**
   * **The seed, and the fallback**: `raisedCounts` reads `v2` as `best`, so this one call is both the vector
   * the search starts from and the counts the March shows while the search runs. One arithmetic, two uses —
   * which is what makes the promise "`Best v2` never loses to `Best`" true by construction rather than by
   * testing.
   */
  const seed = raisedCounts(request, base, modes) ?? {};

  /**
   * **The pools the search does not walk stay where that seed put them**, so every vector is scored as the
   * whole army it would field: the housing is paid by all of it and the battle is fought by all of it. A
   * stack the search *does* walk is left out of here — the vector supplies it.
   */
  const held = countsOf(base);
  for (const [unitId, count] of Object.entries(seed)) {
    const stack = base.stacks.find((one) => one.unitId === unitId);
    if (stack !== undefined && !pools.includes(stack.pool as RaisedPool)) held[unitId] = count;
  }

  const slots: SearchSlot[] = [];
  const start: Record<string, number> = {};
  for (const stack of base.stacks) {
    if (stack.pool === 'leadership' || stack.count <= 0) continue;
    if (!pools.includes(stack.pool as RaisedPool)) continue;
    const cap = request.caps[stack.unitId] ?? Number.MAX_SAFE_INTEGER;
    slots.push({
      id: stack.unitId,
      // The plan's own count is the floor, exactly as it is for the four shipped positions: this is a raise.
      from: stack.count,
      to: Math.min(shelterCeiling(floor, stack.hpPerUnit), cap),
    });
    const wanted = seed[stack.unitId];
    if (wanted !== undefined) start[stack.unitId] = wanted;
  }

  /** The march's worst opening on a vector — the figure the plan itself is ranked on (S-108). */
  const score = (vector: Record<string, number>): number => {
    const candidate = { ...held, ...vector };
    // **Every unit of the pool, not only the ones being moved**: a stack pinned at its ceiling or its stock
    // pays for the housing it occupies just the same, and counting only the slots let a vector spend the
    // same dominance twice.
    const used = { authority: 0, dominance: 0 };
    for (const unit of request.units) {
      if (unit.pool === 'leadership') continue;
      used[unit.pool] += (candidate[unit.id] ?? 0) * unit.cost;
    }
    if (used.authority > request.housing.authority || used.dominance > request.housing.dominance) {
      return Number.NEGATIVE_INFINITY;
    }
    return applyCounts(request, base, candidate).summary.minDamage;
  };

  const answer = exactSearch(slots, score, { start });
  if (answer === null) return null;

  /**
   * **Every slot, moved or not.** A caller merges this over the shipped answer (`{...raised, ...counts}`), and
   * a slot left out of the record would keep the seed's count — see `ExactRaiseAnswer.counts`.
   */
  const counts: Record<string, number> = {};
  for (const slot of slots) counts[slot.id] = answer.counts[slot.id] ?? slot.from;
  return { counts, how: answer.how, space: answer.space };
}
