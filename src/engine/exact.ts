/**
 * **The exhaustive box search** (S-143b): the best vector in a box, walked whole where the box is small
 * enough and searched to convergence where it is not.
 *
 * It knows nothing about battles, marches, mercenaries or housing. A caller hands it **slots** (an id, the
 * count to start from, the count it may go up to) and a **scorer** (a vector in, a number out, `-Infinity`
 * for a vector the caller refuses), and it answers the vector with the highest score. That is the whole
 * contract, and it is deliberate: the same search is what a port to the AssemblyScript kernel
 * (`src/kernel/`) or a precomputation inside the plan's own shape search would run, and neither of those
 * has any business importing a UI module. The march that decides what a slot and a score *are* is
 * `src/ui/sections/march/exact.ts`.
 *
 * **Why not a plain coordinate climb.** The climb climbs one stack at a time and samples each
 * stack's whole range at 16 points (`raise.ts`, `climbedCounts`) because it runs on the main thread between
 * two keystrokes. Measured (experiment 181, `tools/theorycraft/out/181-best-headroom.md`), that leaves a
 * real gap on 10 of the 43 stops where a position moves a count at all — median +2.80 %, worst +5.45 % —
 * and the gap is of two kinds this search closes:
 *
 *   - **sampling** — a stack's damage is not monotone in its count (a bigger stack has more total HP, so it
 *     climbs the kill order and strikes in fewer rounds), so 16 samples can step over the peak; and
 *   - **interaction** — two stacks can only be improved *together* (raising one costs the other a round of
 *     strikes and the pair can still come out ahead), which no one-stack-at-a-time climb can see at all.
 *
 * So the answer is the two neighbourhoods the experiment priced: **every pair, exhaustively**, then
 * **every single stack**, to convergence — restarted from seeded starts so a basin the caller's own answer
 * sits in is not the only one visited. **Only strict improvements are ever taken**, which is what makes the
 * search incapable of coming out below the vector it started from — the promise the March leans on
 * (a `Best v2` can never be worse than the climb it was seeded with, S-145).
 *
 * The cost is not bounded here on purpose (the owner, 2026-09-29: *"no cost limit as it's experimental for
 * now"*). A box of a few hundred vectors is instant; the widest one measured, 908 684 vectors, takes ~50 s,
 * which is why the March runs this off the main thread (`src/worker/jobs.ts`).
 */

/** One count the search may move: where it starts, and the highest it may go. */
export interface SearchSlot {
  /** The caller's own name for the count — an id, a key, whatever the scorer reads it as. */
  id: string;
  /** The count the search starts from, and the floor: nothing below this is ever tried. */
  from: number;
  /** The highest count the search may try. An empty range (`to <= from`) is a slot that cannot move. */
  to: number;
}

/** A vector in the box: every slot's count, as the scorer reads them. */
export type BoxVector = Record<string, number>;

export interface ExactOptions {
  /**
   * A box of at most this many vectors is **walked whole** — the only case where the answer is the optimum
   * rather than the best this search found. Chosen in experiment 181, where the walk is the *control* the
   * other readings are judged against.
   */
  walkCap?: number;
  /** Seeded starts the search takes when it cannot walk. More starts, more basins; no answer depends on how. */
  restarts?: number;
  /** A sweep that improves nothing has converged; this bounds a sweep that only ever ties. */
  maxSweeps?: number;
  /** Seed of the restart generator. **Required in spirit**: an unseeded search is not a result. */
  seed?: number;
  /** The vector to start from — the caller's own answer, which the search can only improve on. */
  start?: BoxVector;
}

export interface ExactAnswer {
  /** The best vector found, one entry per movable slot. */
  counts: BoxVector;
  /** `walked` when the whole box was enumerated, `searched` when the multistart search answered. */
  how: 'walked' | 'searched';
  /** The vectors in the box — how much space the search was allowed, reported rather than hidden. */
  space: number;
  /** How many vectors the scorer was asked about. What the answer cost, in the only unit that matters. */
  scored: number;
}

/**
 * **The shipped defaults**, exported so the kernel's own copy of this search can be held to them
 * (`src/kernel/raise.ts` hands them to the wasm rather than repeating the numbers there).
 */
export const EXACT_DEFAULTS = {
  walkCap: 300_000,
  restarts: 64,
  maxSweeps: 24,
  seed: 20_260_929,
} as const;

/**
 * A deterministic generator. **An unseeded restart column is a coin flip, not a measurement**: experiment
 * 181's first version used `Math.random()` and a second run of the same file moved a stop from a gap to
 * none (see its own note).
 */
function randomFrom(seed: number): () => number {
  // Folded into `[0, 2^32)` **before** anything is drawn: a negative seed would otherwise make every draw
  // negative and put the restart vectors below their slots' `from`, outside the box the caller described.
  let state = ((Math.trunc(seed) % 4_294_967_296) + 4_294_967_296) % 4_294_967_296;
  return () => {
    state = (state * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return state / 4_294_967_296;
  };
}

/** How many vectors the box holds — the product of the slots' ranges, `1` for an empty box. */
export function boxSize(slots: readonly SearchSlot[]): number {
  return slots.reduce((product, slot) => product * Math.max(0, slot.to - slot.from + 1), 1);
}

/**
 * **The widest box a score memo is kept for** (W16 B): 2²² vectors, 32 MB of scores. The widest box the
 * benchmark has is 908 684; a wider one is searched without a memo, which costs time and never an answer.
 */
export const MEMO_CAP = 4_194_304;

/**
 * **A score per vector of one box, asked once** (W16 B). The search re-asks the same vectors from every
 * restart — on the owner's live camp of 2026-09-18 `Best v2` asked 5 977 076 scores for 207 386 distinct
 * vectors (step A2, `docs/plans/refactor-speed.md`) — and the scorer is a pure function of the vector, so
 * remembering what it answered cannot move an answer, only the clock.
 *
 * It is a dense table over the box, indexed by the vector read as a number in mixed radix (one digit a slot,
 * `count − from`), with `NaN` for a vector not yet scored. It knows nothing about what a score means: the
 * caller decides what it stores (the march stores the battle, and applies a position's cap before it reads).
 * `null` from `create` when the box is wider than `MEMO_CAP` or has nothing to move.
 */
export class BoxMemo {
  private readonly slots: readonly SearchSlot[];
  private readonly values: Float64Array;

  private constructor(slots: readonly SearchSlot[], size: number) {
    this.slots = slots;
    this.values = new Float64Array(size).fill(Number.NaN);
  }

  /** A memo over the movable slots of this box — the slots `exactSearch` itself searches. */
  static create(slotsIn: readonly SearchSlot[]): BoxMemo | null {
    const slots = slotsIn.filter((slot) => slot.to > slot.from);
    const size = boxSize(slots);
    if (slots.length === 0 || size > MEMO_CAP) return null;
    return new BoxMemo(slots, size);
  }

  /** The vector's place in the table. */
  index(vector: BoxVector): number {
    let at = 0;
    for (const slot of this.slots) {
      at = at * (slot.to - slot.from + 1) + ((vector[slot.id] ?? slot.from) - slot.from);
    }
    return at;
  }

  /** What was stored at `at`, `NaN` when nothing was. */
  get(at: number): number {
    return this.values[at] as number;
  }

  set(at: number, value: number): void {
    this.values[at] = value;
  }
}

/**
 * Wrap a scorer so the call count is known. The count is what the answer cost, and it is the number every
 * budget in this file would be written in if there were one.
 */
function counting(score: (vector: BoxVector) => number): {
  score: (vector: BoxVector) => number;
  calls: () => number;
} {
  let calls = 0;
  return {
    score: (vector) => {
      calls += 1;
      return score(vector);
    },
    calls: () => calls,
  };
}

/** One-stack coordinate ascent to convergence: the shipped neighbourhood, walked rather than sampled. */
function climb(
  slots: readonly SearchSlot[],
  score: (vector: BoxVector) => number,
  start: BoxVector,
  maxSweeps: number,
): BoxVector {
  let moves = { ...start };
  let best = score(moves);
  for (let sweep = 0; sweep < maxSweeps; sweep += 1) {
    let improved = false;
    for (const slot of slots) {
      let winner = moves[slot.id] ?? slot.from;
      let winnerScore = best;
      for (let count = slot.from; count <= slot.to; count += 1) {
        const value = score({ ...moves, [slot.id]: count });
        if (value > winnerScore) {
          winner = count;
          winnerScore = value;
        }
      }
      if (winnerScore > best) {
        moves = { ...moves, [slot.id]: winner };
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
  slots: readonly SearchSlot[],
  score: (vector: BoxVector) => number,
  start: BoxVector,
  maxSweeps: number,
): BoxVector {
  let moves = { ...start };
  let best = score(moves);
  for (let sweep = 0; sweep < maxSweeps; sweep += 1) {
    let improved = false;
    for (let i = 0; i < slots.length; i += 1) {
      for (let j = i + 1; j < slots.length; j += 1) {
        const one = slots[i] as SearchSlot;
        const other = slots[j] as SearchSlot;
        let winner = moves;
        let winnerScore = best;
        for (let a = one.from; a <= one.to; a += 1) {
          for (let b = other.from; b <= other.to; b += 1) {
            const value = score({ ...winner, [one.id]: a, [other.id]: b });
            if (value > winnerScore) {
              winner = { ...winner, [one.id]: a, [other.id]: b };
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
 * **The best vector in the box.** The slots that cannot move (`to <= from`) are dropped and every vector
 * the answer carries is clipped into its slot's range, so a caller's `start` may be partial or stale and
 * nothing it passes can take the search outside the box it was given.
 *
 * `null` when no slot can move — there is nothing to search, which is a different answer from "the start is
 * already the best" — and `null` also when **no vector in the box is feasible** (the scorer answered
 * `-Infinity` to every one it was shown). Both are "this search has no answer", and neither is a defect: the
 * caller decides what to show.
 */
export function exactSearch(
  slotsIn: readonly SearchSlot[],
  score: (vector: BoxVector) => number,
  options: ExactOptions = {},
): ExactAnswer | null {
  const walkCap = options.walkCap ?? EXACT_DEFAULTS.walkCap;
  const restarts = options.restarts ?? EXACT_DEFAULTS.restarts;
  const maxSweeps = options.maxSweeps ?? EXACT_DEFAULTS.maxSweeps;
  const random = randomFrom(options.seed ?? EXACT_DEFAULTS.seed);

  const slots = slotsIn.filter((slot) => slot.to > slot.from);
  if (slots.length === 0) return null;

  const space = boxSize(slots);
  const { score: counted, calls } = counting(score);

  /** The caller's own vector, clipped into the box: nowhere else could a start legitimately sit. */
  const start: BoxVector = {};
  for (const slot of slots) {
    const wanted = options.start?.[slot.id] ?? slot.from;
    start[slot.id] = Math.min(slot.to, Math.max(slot.from, Math.round(wanted)));
  }

  let best = counted(start);
  let found: BoxVector = { ...start };

  if (space <= walkCap) {
    const walk = (index: number, moves: BoxVector): void => {
      if (index === slots.length) {
        const value = counted(moves);
        if (value > best) {
          best = value;
          found = { ...moves };
        }
        return;
      }
      const slot = slots[index] as SearchSlot;
      for (let count = slot.from; count <= slot.to; count += 1) {
        walk(index + 1, { ...moves, [slot.id]: count });
      }
    };
    walk(0, start);
    // **A box with nothing feasible in it is no answer**, and so is a search that never found one: the
    // scorer's own `-Infinity` must never be handed back as a count to field.
    if (!Number.isFinite(best)) return null;
    return { counts: found, how: 'walked', space, scored: calls() };
  }

  for (let attempt = 0; attempt <= restarts; attempt += 1) {
    const from: BoxVector = {};
    // The first attempt is the caller's own answer — a raise never wanders off the answer it was given —
    // and every later one is a fresh basin inside the same box.
    for (const slot of slots) {
      const span = slot.to - slot.from;
      from[slot.id] =
        attempt === 0 ? (start[slot.id] ?? slot.from) : slot.from + Math.floor(random() * (span + 1));
    }
    const climbed = climb(slots, counted, pairwise(slots, counted, from, maxSweeps), maxSweeps);
    const value = counted(climbed);
    if (value > best) {
      best = value;
      found = climbed;
    }
  }
  if (!Number.isFinite(best)) return null;
  return { counts: found, how: 'searched', space, scored: calls() };
}
