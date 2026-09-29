/**
 * **`Best` v2, as a research module** (S-143b; owner, 2026-09-29: *"no cost limit as it's experimental for
 * now and will be moved to assemblyscript for precomputations or improving the results. Basically in the
 * planner we've narrowed the field of research now we can hammer down to find the few percentage left of
 * gain"*).
 *
 * The shipped `Best` (`src/ui/sections/march/raise.ts`) samples its box because it runs on the main thread
 * between two keystrokes. This one is the answer with the sampling removed:
 *
 *   - **the plan's own counts are the seed and the floor** — the raise promise is kept, so nothing here goes
 *     below what the plan fields;
 *   - **the box is the plan's own limits** — `min(shelter ceiling, owned stock)` a hired type, under the
 *     authority or dominance the housing pays. Same `ceil(troopFloor / hpPerUnit) − 1` the engine's
 *     `shelterUnder` lowers a stack to, so every vector it can answer with is a march the game would take;
 *   - **the objective is the march's worst opening** (`summary.minDamage`), the figure the plan is ranked on,
 *     replayed by the app's own `applyCounts` — no model of its own.
 *
 * Two ways to the answer, and which one a stop gets is reported rather than hidden:
 *
 *   - **`walked`** — every vector in the box, when the box fits in `WALK_CAP` (the only place an optimum is
 *     *known* rather than argued);
 *   - **`searched`** — a deterministic multi-start search (pairwise neighbourhood, then one-stack, to
 *     convergence, from the plan's counts and 64 seeded starts) for the boxes too large to walk. Experiment
 *     181 measured this shape reaching the walked optimum on **every** stop where the two could be compared
 *     (14 of 14), which is the evidence for calling it "the best this box has" and not "a better guess".
 *
 * It is deliberately **not** wired into the app: the two ways it could ship are the plan's own search (the
 * engine, where a precomputation can afford it) and the AssemblyScript kernel, and both are the plan's
 * `docs/plans/best-v2.md` rather than this file's business.
 */
import type { StackRequest, StackResult } from '@/engine/types';
import { applyCounts } from '@/ui/sections/march/manual';
import { raisedCounts, shelterCeiling, troopFloor } from '@/ui/sections/march/raise';

/** Every vector in a box this size is walked; larger boxes get the search. Measured in experiment 181. */
const WALK_CAP = 300_000;
/** How many seeded starts the search takes when it cannot walk. No cost limit here — only determinism. */
const RESTARTS = 64;
/** A sweep that improves nothing has converged; this is the guard against a cycle of ties. */
const MAX_SWEEPS = 24;

type HiredPool = 'authority' | 'dominance';

interface Slot {
  unitId: string;
  pool: HiredPool;
  cost: number;
  /** The plan's own count — the seed, and the floor the raise promise keeps. */
  from: number;
  /** `min(shelter ceiling, owned stock)`. */
  to: number;
}

export interface BestV2 {
  /** The counts to replay, as the app's own sparse move record: only what it moves. */
  moves: Record<string, number>;
  /** `walked` when the whole box was enumerated, `searched` when the multi-start search answered. */
  how: 'walked' | 'searched';
  /** The vectors in the box — the space the search was allowed, reported so a reader can see its size. */
  space: number;
}

/** A deterministic generator: an unseeded search answers differently on the same input, which is not a result. */
function randomFrom(seed: number): () => number {
  let state = seed % 4_294_967_296;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

/**
 * The box, and the scorer over it.
 *
 * The scorer returns `-Infinity` for a vector the housing cannot pay for, so no reading can leave the plan's
 * own limits, and it is the app's own replay (`applyCounts`) so a reading cannot disagree with the March.
 */
function boxOf(request: StackRequest, base: StackResult) {
  const floor = troopFloor(base);
  const slots: Slot[] = [];
  if (floor !== null) {
    for (const stack of base.stacks) {
      if (stack.pool === 'leadership' || stack.count <= 0) continue;
      const cap = request.caps[stack.unitId] ?? Number.MAX_SAFE_INTEGER;
      const to = Math.min(shelterCeiling(floor, stack.hpPerUnit), cap);
      if (to <= stack.count) continue;
      slots.push({
        unitId: stack.unitId,
        pool: stack.pool,
        cost: request.units.find((unit) => unit.id === stack.unitId)?.cost ?? 0,
        from: stack.count,
        to,
      });
    }
  }

  const counts: Record<string, number> = {};
  for (const stack of base.stacks) counts[stack.unitId] = stack.count;

  const score = (moves: Record<string, number>): number => {
    const candidate = { ...counts, ...moves };
    // **Every unit of the pool, not only the movable ones**: a stack pinned at its ceiling or its stock still
    // pays for the housing it occupies, and counting only the slots let a vector spend the same dominance
    // twice. (Experiment 180's own promise check caught it: an answer 952 over a pool of 900.)
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

  const space = slots.reduce((product, slot) => product * (slot.to - slot.from + 1), 1);
  return { slots, score, space };
}

/** One-stack coordinate ascent to convergence: the shipped neighbourhood, walked rather than sampled. */
function climb(
  slots: readonly Slot[],
  score: (moves: Record<string, number>) => number,
  start: Record<string, number>,
): Record<string, number> {
  let moves = { ...start };
  let best = score(moves);
  for (let sweep = 0; sweep < MAX_SWEEPS; sweep += 1) {
    let improved = false;
    for (const slot of slots) {
      let winner = moves[slot.unitId] ?? slot.from;
      let winnerScore = best;
      for (let count = slot.from; count <= slot.to; count += 1) {
        const value = score({ ...moves, [slot.unitId]: count });
        if (value > winnerScore) {
          winner = count;
          winnerScore = value;
        }
      }
      if (winnerScore > best) {
        moves = { ...moves, [slot.unitId]: winner };
        best = winnerScore;
        improved = true;
      }
    }
    if (!improved) return moves;
  }
  return moves;
}

/** Every pair, exhaustively, to convergence — the neighbourhood a one-stack climb cannot see. */
function pairwise(
  slots: readonly Slot[],
  score: (moves: Record<string, number>) => number,
  start: Record<string, number>,
): Record<string, number> {
  let moves = { ...start };
  let best = score(moves);
  for (let sweep = 0; sweep < MAX_SWEEPS; sweep += 1) {
    let improved = false;
    for (let i = 0; i < slots.length; i += 1) {
      for (let j = i + 1; j < slots.length; j += 1) {
        const one = slots[i] as Slot;
        const other = slots[j] as Slot;
        let winner = moves;
        let winnerScore = best;
        for (let a = one.from; a <= one.to; a += 1) {
          for (let b = other.from; b <= other.to; b += 1) {
            const value = score({ ...winner, [one.unitId]: a, [other.unitId]: b });
            if (value > winnerScore) {
              winner = { ...winner, [one.unitId]: a, [other.unitId]: b };
              winnerScore = value;
            }
          }
        }
        if (winnerScore > best) {
          moves = winner;
          best = winnerScore;
          improved = true;
        }
      }
    }
    if (!improved) return moves;
  }
  return moves;
}

/**
 * **The best this box has**, or `null` when the plan's counts are already it (every type is at its ceiling,
 * at its stock, or the march has no hired stack at all).
 */
export function bestV2(request: StackRequest, base: StackResult, seed = 20_260_929): BestV2 | null {
  const { slots, score, space } = boxOf(request, base);
  if (slots.length === 0) return null;

  const start: Record<string, number> = {};
  let best = score(start);
  let found: Record<string, number> = start;
  let how: 'walked' | 'searched' = 'walked';

  /**
   * **The search never loses to what ships.** The app's own `Best` is one candidate among the ones this
   * starts from, so `Best v2` is at least `Best` on every stop by construction rather than by luck — and the
   * two agree wherever the climb already found the box's optimum, which is most stops.
   */
  const shipped = raisedCounts(request, base, { authority: 'best', dominance: 'best' }) ?? {};
  const seeded = { ...start, ...shipped };
  const shippedScore = score(seeded);
  if (shippedScore > best) {
    best = shippedScore;
    found = seeded;
  }

  if (space <= WALK_CAP) {
    const walk = (index: number, moves: Record<string, number>): void => {
      if (index === slots.length) {
        const value = score(moves);
        if (value > best) {
          best = value;
          found = { ...moves };
        }
        return;
      }
      const slot = slots[index] as Slot;
      for (let count = slot.from; count <= slot.to; count += 1) {
        walk(index + 1, { ...moves, [slot.unitId]: count });
      }
    };
    walk(0, start);
  } else {
    how = 'searched';
    const random = randomFrom(seed);
    for (let attempt = 0; attempt <= RESTARTS; attempt += 1) {
      const from: Record<string, number> = {};
      if (attempt > 0) {
        for (const slot of slots) {
          const span = slot.to - slot.from;
          from[slot.unitId] = slot.from + (span === 0 ? 0 : Math.floor(random() * (span + 1)));
        }
      }
      const climbed = climb(slots, score, pairwise(slots, score, attempt === 0 ? start : from));
      const value = score(climbed);
      if (value > best) {
        best = value;
        found = climbed;
      }
    }
  }

  // Only what it moves: the app's own shape, so a caller can read it as a hand edit.
  const moves: Record<string, number> = {};
  for (const slot of slots) {
    const now = found[slot.unitId] ?? slot.from;
    if (now !== slot.from) moves[slot.unitId] = now;
  }
  return Object.keys(moves).length === 0 ? null : { moves, how, space };
}
