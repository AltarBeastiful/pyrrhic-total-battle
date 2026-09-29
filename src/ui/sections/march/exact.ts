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
 * **The score is a policy** (S-144, 2026-09-29). A vector is replayed once and read three ways — the worst
 * opening, the authority chunks it burns and what the hired stacks struck for in that opening — and the
 * caller's `RaiseRank` decides which number the climb maximises. `byDamage` is the shipped `Best v2`; a rank
 * that must not spend more of the rare stock prices the same box differently without moving a bound, so the
 * two positions differ by one visible line and share everything that would be expensive to get wrong.
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
import {
  RAISED_POOLS,
  burnOf,
  countsOf,
  isExhaustive,
  raisedCounts,
  shelterCeiling,
  troopFloor,
} from './raise';
import type { RaiseModes, RaisedPool } from './raise';
import { worstDamageByPool } from './worst';

/**
 * **What one candidate vector is worth** — every reading a caller is allowed to rank it on, and all three off
 * one replay. A vector the housing cannot pay for is not scored at all (the rank never sees it).
 */
export interface RaiseFacts {
  /** The march's worst opening — the figure the plan itself is ranked on (S-108). */
  damage: number;
  /** The authority chunks the vector burns: `Σ chunks(n)`, a property of the counts and not of the fight. */
  mercLost: number;
  /** What the hired stacks themselves strike for in that opening — `damage`'s authority term (S-105). */
  hiredDamage: number;
}

/**
 * **How a caller prices a vector.** The search itself is blind to this — it climbs whatever number the rank
 * hands back — which is what lets a policy that must not spend more of the rare stock reuse the shipped
 * algorithm, the shipped box and the shipped seed rather than a second copy of them.
 */
export type RaiseRank = (facts: RaiseFacts) => number;

/**
 * **The shipped position's own rank: damage, and nothing else** (S-143b). It is the default so that every
 * caller written before a policy existed keeps the answer it had, and it is a function rather than a branch so
 * that the difference between the positions is one visible line.
 */
export const byDamage: RaiseRank = (facts) => facts.damage;

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

/** The pools whose own control stands on an exhaustive position: the stacks this search may move. */
export function exhaustivePools(modes: RaiseModes): RaisedPool[] {
  return RAISED_POOLS.filter((pool) => isExhaustive(modes[pool]));
}

/**
 * **The most of the rare stock the authority block may spend** — the whole of what `safe` and `tight` add to
 * this search (S-144).
 *
 * The reading is the engine's own: `burnOf` is `marchOf`'s `mercLost` (`Σ chunks(n)` over the authority
 * stacks), it is a property of the counts and not of the fight, and it is **the authority pool's alone**
 * (S-102 — a trained monster is a price in silver, queue and dragon coins, and not a stock that drains). So
 * only the mercenaries' control can cap anything, and the two caps are the two marches a player can compare
 * himself with: `safe` may not burn more than the shipped `Best` it replaces (its counts are exactly what
 * `raisedCounts` answers with, which is also the pane's own first frame), `tight` may not burn more than the
 * **plan's own counts** — the march before any position moved a count, so not one extra chunk.
 *
 * `null` is no cap at all: `v2`, and every control standing on `off`, `tens` or `most`, which is also why a
 * `safe` on the monsters' block alone changes nothing — there is no burn there to bound.
 */
function burnCap(base: StackResult, modes: RaiseModes, seed: Record<string, number>): number | null {
  if (modes.authority === 'safe') return burnOf(base, seed);
  if (modes.authority === 'tight') return burnOf(base, countsOf(base));
  return null;
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
  /**
   * How to price a vector. Left out, this is `byDamage` — the position the interface ships — and a policy
   * changes *which* of this box's vectors wins, never which vectors are in it: the slots, the bounds, the
   * housing check and the seed are the same ones either way, so a ranked search is still a raise, still legal
   * and still never below the `Best` it starts from.
   */
  rank: RaiseRank = byDamage,
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

  /** What this position may spend, in chunks — `null` for `v2`, and for a block with no burn to bound. */
  const cap = burnCap(base, modes, seed);

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
    /**
     * **A `Tight` block starts at the plan's own counts** — the march it promises not to cost more than —
     * where a `safe` or `v2` block starts where the shipped `Best` put it. A slot left out of `start` is its
     * `from`, which is the plan's count, so `tight` is the same statement made by leaving it out; it is
     * spelled here because the *promise* has to be visible: the answer can only improve on where it starts,
     * so `tight` cannot lose to the plan's own march, by construction, exactly as `safe` cannot lose to
     * `Best`.
     */
    if (modes[stack.pool as RaisedPool] === 'tight') continue;
    const wanted = seed[stack.unitId];
    if (wanted !== undefined) start[stack.unitId] = wanted;
  }

  /**
   * **A capped position refuses a vector the way the housing refuses one**: `-Infinity`, which the search
   * reads as "not an answer" and never returns. That is the whole of the cap — a burn over the budget is not
   * a worse march, it is a march this position will not field — and it is why the seed has to be feasible:
   * `safe`'s seed *is* its cap, and `tight`'s seed is the plan's own counts, which is the cap by definition.
   */
  const ranked: RaiseRank =
    cap === null ? rank : (facts) => (facts.mercLost <= cap ? rank(facts) : Number.NEGATIVE_INFINITY);

  /**
   * **The three readings of one vector, and the two the rank may not need are lazy.** `damage` is one replay
   * and is what the shipped position ranks on; the burn is arithmetic over the counts and the hired share is
   * one pass over the journal `damage`'s own replay already built — both nearly free, but a box of 908 684
   * vectors is a box of 908 684 of them, so a rank that reads only the damage pays only for the damage.
   */
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

    const played = applyCounts(request, base, candidate);
    const facts: RaiseFacts = {
      damage: played.summary.minDamage,
      get mercLost(): number {
        return burnOf(base, candidate);
      },
      get hiredDamage(): number {
        return worstDamageByPool(played.summary.journals.enemyFirst, played.result.stacks).authority;
      },
    };
    return ranked(facts);
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
