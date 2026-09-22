/**
 * S-40 / S-41 — priority search (PLAN §3.6).
 *
 * Search space: which of the requested unit types to include. Everything else (housing, bonuses, method,
 * caps, enemy formation, recovery plan) is fixed, so one candidate = one subset, scored by re-running
 * `sizeStacks` + `simulateBattle` and reading one number off the summary.
 *
 * Up to 12 unit types the space is small enough to enumerate exhaustively (4,095 subsets). Above that the
 * search is greedy backward elimination — drop the type whose removal improves the objective most, repeat —
 * alternated with local swaps (add one type back, or trade one in for one out), run from a set of starting
 * points: the whole formation, then the *structured* ones (each pool on its own and each pool's
 * complement), then random subsets drawn by a seeded PRNG. Both paths are deterministic for the same
 * inputs; only exhausting `budgetMs` (wall-clock) can cut a run short, and `exhaustive` then reports false.
 *
 * The structured starts and the alternation are not decoration. A per-cost objective ("damage per silver")
 * has one basin per *pool* — monsters are paid for in dragon coins and chunk silver, mercenaries are not
 * retrained at all — and no sequence of one- or two-type drops leads from the full army into a
 * monsters-only march, so a hill-climb that only ever starts from the full formation and from coin-flip
 * subsets answers whatever its seed happens to land on (investigation 0013: the zero-bonus fixture army
 * scored 1.118 on seed 1 and 4.310, the true optimum, on seed 7).
 */
import { battleScore, simulateBattle } from './battle';
import { sizeStacks } from './stacker';
import type {
  DamageReading,
  BattleScore,
  Objective,
  SearchProgress,
  SearchRequest,
  SearchResult,
  StackRequest,
  StackResult,
} from './types';

/** How often `onProgress` fires, in evaluations. */
export const PROGRESS_EVERY = 50;
/** Largest formation the search enumerates exhaustively. */
export const EXHAUSTIVE_LIMIT = 12;
/**
 * Random restarts attempted after the whole formation and the structured starts, budget permitting.
 * Each one costs a few dozen evaluations against a warm cache; 64 of them on the 14-type fixture army
 * take ~1 s of the 8 s the app gives a search.
 */
export const MAX_RESTARTS = 64;

/** Small, fast, seedable PRNG; the search must give the same answer on every machine. */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function now(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

/**
 * The objective as a single number, higher is better. A ratio whose denominator is zero (no silver to spend,
 * no monsters so no dragon coins) is not a score of zero — it is unmeasurable, and scores −Infinity so the
 * search never prefers it.
 */
export function objectiveScore(
  summary: BattleScore,
  objective: Objective,
  reading: DamageReading = 'worst',
): number {
  // **Which damage a ratio divides** (S-134). `BattleScore.damagePerSilver` and its two siblings are built
  // on the *average* of the two openings (`scoreOf`, `battle.ts`), so every ratio objective ranks marches by
  // a number the owner has already ruled out planning on: *"average damage is not average for sure; it's too
  // risky for me to spend 3M silver on a coin flip to get 1M damage or 3M. We want reliable damage
  // actually"* (S-94, 2026-09-19) — on which reading `plan-benchmark.test.ts` prices **every** row. So the
  // plan judges on the worst opening while the search optimises the average, and this is the one function
  // where the two meet. **`'worst'` is the default since S-134** (owner, 2026-09-22, asked whether to
  // switch the ratio objectives to the worst opening: *"1. yes"*); `'average'` is the pre-S-134 arithmetic,
  // kept so an experiment can still price both and so the change has a measured counterpart rather than a
  // memory of one.
  const damage = reading === 'worst' ? summary.minDamage : summary.avgDamage;
  const per = (cost: number): number => (cost > 0 ? damage / cost : -Infinity);
  switch (objective) {
    case 'avgDamage':
      return summary.avgDamage;
    case 'minDamage':
      return summary.minDamage;
    case 'damagePerSilver':
      return reading === 'worst'
        ? per(summary.recovery.silver)
        : summary.recovery.silver > 0
          ? summary.damagePerSilver
          : -Infinity;
    case 'damagePerGold':
      return reading === 'worst'
        ? per(summary.recovery.gold)
        : summary.recovery.gold > 0
          ? summary.damagePerGold
          : -Infinity;
    case 'damagePerDragonCoin':
      return reading === 'worst'
        ? per(summary.recovery.dragonCoins)
        : summary.recovery.dragonCoins > 0
          ? summary.damagePerDragonCoin
          : -Infinity;
  }
}

/**
 * One candidate, scored. **It carries no `BattleSummary`** (S-123, 2026-09-22): a summary is a battle report
 * — two journals with an entry list each, the damage split by pool, the model notes — and the search builds
 * thousands of these against a wall-clock budget to read *one number* off them. `battleScore` answers that
 * number off the same two journal totals without writing the report down, and the two candidates that
 * actually leave this function get their summary at the end, where a reader will use it.
 */
interface Evaluation {
  subset: string[];
  /** The army as it was scored, kept so the winner's full summary is built from exactly that request. */
  scoped: StackRequest;
  result: StackResult;
  score: number;
}

export function searchPriority(
  request: SearchRequest,
  onProgress?: (progress: SearchProgress) => void,
  shouldCancel?: () => boolean,
): SearchResult {
  const ids = request.request.units.map((unit) => unit.id);
  const started = now();
  const budget = request.budgetMs > 0 ? request.budgetMs : Infinity;
  const cache = new Map<string, Evaluation>();
  let evaluated = 0;
  let best: Evaluation | undefined;

  const stop = (): boolean => shouldCancel?.() === true || now() - started >= budget;

  const evaluate = (subset: string[]): Evaluation => {
    const key = subset.join(',');
    const cached = cache.get(key);
    if (cached) return cached;

    const included = new Set(subset);
    const scoped: StackRequest = {
      ...request.request,
      units: request.request.units.filter((unit) => included.has(unit.id)),
    };
    const result = sizeStacks(scoped);
    const evaluation: Evaluation = {
      subset,
      scoped,
      result,
      score: objectiveScore(battleScore(result, scoped), request.objective, request.reading),
    };
    cache.set(key, evaluation);
    evaluated += 1;
    if (evaluated % PROGRESS_EVERY === 0) {
      onProgress?.({ evaluated, bestScore: best?.score ?? -Infinity, elapsedMs: now() - started });
    }
    return evaluation;
  };

  /** How many troop stacks a candidate's **sized** result fields — the floor reads the march, not the subset. */
  const troopStacksOf = (evaluation: Evaluation): number =>
    evaluation.result.stacks.filter((stack) => stack.pool === 'leadership').length;

  // Always score the full formation first, so a zero budget still returns something usable — and keep it as
  // the baseline the winner is compared against. It is evaluated before `consider` exists in anger because
  // the floor below is armed off it.
  const baseline = evaluate(ids);

  /**
   * **The playability floor** (W9, S-133). Armed only where the whole formation itself meets it, so an army
   * that cannot field the troops asked for is searched exactly as it is today and `best` can never end up
   * undefined. A candidate under the floor is still evaluated, still walked through by the drop and grow
   * chains, and simply cannot become the answer.
   */
  const floor = Math.max(0, request.troopFloor ?? 0);
  const floorArmed = floor > 0 && troopStacksOf(baseline) >= floor;
  /** The best thing the floor turned down, for the telling. */
  let refused: Evaluation | undefined;

  const consider = (candidate: Evaluation): void => {
    if (floorArmed && troopStacksOf(candidate) < floor) {
      if (!refused || candidate.score > refused.score) refused = candidate;
      return;
    }
    if (!best || candidate.score > best.score) best = candidate;
  };

  consider(baseline);

  let exhaustive = false;
  if (ids.length === 0) {
    // Nothing to choose: the only candidate is the formation itself, already scored above.
    exhaustive = true;
  } else if (ids.length <= EXHAUSTIVE_LIMIT) {
    exhaustive = true;
    // The empty subset is skipped: it is no formation at all.
    for (let bits = 1; bits < 1 << ids.length; bits += 1) {
      if (stop()) {
        exhaustive = false;
        break;
      }
      consider(evaluate(ids.filter((_, index) => (bits & (1 << index)) !== 0)));
    }
  } else {
    const random = mulberry32(request.seed ?? 1);
    for (const start of structuredStarts()) {
      if (stop()) break;
      improve(start);
    }
    for (let restart = 0; restart < MAX_RESTARTS && !stop(); restart += 1) {
      const start = ids.filter(() => random() < 0.5);
      improve(start.length > 0 ? start : ids);
    }
  }

  /**
   * The starting points a coin flip practically never produces: the whole formation, then each pool on
   * its own and each pool's complement. Pools are where the cost objectives separate — monsters are paid
   * for in dragon coins and in silver by the chunk of ten, mercenaries are not retrained at all — and the
   * peak of a ratio is usually one whole pool, which is a dozen simultaneous drops away from the full
   * army and therefore unreachable by any sequence of improving one- or two-type drops.
   */
  function structuredStarts(): string[][] {
    const poolOf = new Map(request.request.units.map((unit) => [unit.id, unit.pool]));
    const pools = [...new Set(poolOf.values())];
    const starts = [ids];
    if (pools.length > 1) {
      for (const pool of pools) {
        starts.push(ids.filter((id) => poolOf.get(id) === pool));
        starts.push(ids.filter((id) => poolOf.get(id) !== pool));
      }
    }
    return starts.filter((start) => start.length > 0);
  }

  /**
   * Backward elimination and local swaps, alternated to a local optimum.
   * The two moves see different neighbours, so a set that has just grown can usually be shrunk again:
   * running each of them once, as the first version did, stopped several descents one move early.
   */
  function improve(start: string[]): void {
    let current = evaluate(start);
    consider(current);

    /** Drop the type (or pair of types) whose removal helps most, while one does. */
    const shrink = (): boolean => {
      let moved = false;
      for (let improved = true; improved && !stop();) {
        // Never empty the formation: one type must survive.
        const subset = current.subset;
        if (subset.length <= 1) break;
        improved = false;
        let bestDrop: Evaluation | undefined;
        for (const id of subset) {
          if (stop()) break;
          const candidate = evaluate(subset.filter((other) => other !== id));
          if (!bestDrop || candidate.score > bestDrop.score) bestDrop = candidate;
        }
        // Some types only pay off when they leave together (the captured runs drop SW1 *and* SP1, never
        // one of them), so when no single drop helps, look one step further and try every pair.
        if (!bestDrop || bestDrop.score <= current.score) {
          for (let i = 0; i < subset.length && !stop(); i += 1) {
            for (let j = i + 1; j < subset.length; j += 1) {
              const pair = evaluate(subset.filter((other) => other !== subset[i] && other !== subset[j]));
              if (!bestDrop || pair.score > bestDrop.score) bestDrop = pair;
            }
          }
        }
        if (bestDrop && bestDrop.score > current.score) {
          current = bestDrop;
          consider(current);
          improved = true;
          moved = true;
        }
      }
      return moved;
    };

    /** Add one type back, or trade one in for one out, while one of the two helps. */
    const grow = (): boolean => {
      let moved = false;
      for (let improved = true; improved && !stop();) {
        improved = false;
        const missing = ids.filter((id) => !current.subset.includes(id));
        for (const add of missing) {
          if (stop() || improved) break;
          const grown = evaluate(ids.filter((id) => current.subset.includes(id) || id === add));
          if (grown.score > current.score) {
            current = grown;
            consider(current);
            improved = true;
            moved = true;
            break;
          }
          for (const remove of current.subset) {
            const swapped = evaluate(
              ids.filter((id) => (current.subset.includes(id) && id !== remove) || id === add),
            );
            if (swapped.score > current.score) {
              current = swapped;
              consider(current);
              improved = true;
              moved = true;
              break;
            }
          }
        }
      }
      return moved;
    };

    for (let moved = true; moved && !stop();) moved = shrink() || grow();
  }

  const winner = best ?? evaluate(ids);
  onProgress?.({ evaluated, bestScore: winner.score, elapsedMs: now() - started });
  return {
    includedUnitIds: winner.subset,
    result: winner.result,
    // The whole battle report, for the two candidates a reader ever sees: the winner and the army the user
    // would have had without the search. Every other candidate was scored and discarded.
    summary: simulateBattle(winner.result, winner.scoped),
    score: winner.score,
    evaluated,
    exhaustive,
    // Every candidate scored −Infinity, so nothing was ever compared: the winner is the formation the
    // search started from, and calling it the answer to the objective would be a lie (PLAN §3.6).
    unmeasurable: winner.score === -Infinity,
    baseline: {
      includedUnitIds: baseline.subset,
      result: baseline.result,
      summary: simulateBattle(baseline.result, baseline.scoped),
    },
    // Only where something was actually turned down; `undefined` keeps a result built with the floor off
    // byte-identical to one built before this story.
    ...(refused
      ? {
          refused: {
            includedUnitIds: refused.subset,
            score: refused.score,
            troopStacks: troopStacksOf(refused),
          },
        }
      : {}),
  };
}
