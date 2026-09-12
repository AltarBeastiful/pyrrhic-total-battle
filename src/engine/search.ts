/**
 * S-40 / S-41 — priority search (PLAN §3.6).
 *
 * Search space: which of the requested unit types to include. Everything else (housing, bonuses, method,
 * caps, enemy formation, recovery plan) is fixed, so one candidate = one subset, scored by re-running
 * `sizeStacks` + `simulateBattle` and reading one number off the summary.
 *
 * Up to 12 unit types the space is small enough to enumerate exhaustively (4,095 subsets). Above that the
 * search is greedy backward elimination — drop the type whose removal improves the objective most, repeat —
 * followed by local swaps (add one type back, or trade one in for one out), restarted from random subsets
 * drawn by a seeded PRNG. Both paths are deterministic for the same inputs; only exhausting `budgetMs`
 * (wall-clock) can cut a run short, and `exhaustive` then reports false.
 */
import { simulateBattle } from './battle';
import { sizeStacks } from './stacker';
import type {
  BattleSummary,
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
/** Random restarts attempted after the first greedy descent, budget permitting. */
export const MAX_RESTARTS = 12;

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
export function objectiveScore(summary: BattleSummary, objective: Objective): number {
  switch (objective) {
    case 'avgDamage':
      return summary.avgDamage;
    case 'damagePerSilver':
      return summary.recovery.silver > 0 ? summary.damagePerSilver : -Infinity;
    case 'damagePerGold':
      return summary.recovery.gold > 0 ? summary.damagePerGold : -Infinity;
    case 'damagePerDragonCoin':
      return summary.recovery.dragonCoins > 0 ? summary.damagePerDragonCoin : -Infinity;
  }
}

interface Evaluation {
  subset: string[];
  result: StackResult;
  summary: BattleSummary;
  score: number;
}

export function searchPriority(
  request: SearchRequest,
  onProgress?: (progress: SearchProgress) => void,
  shouldCancel?: () => boolean,
): SearchResult {
  const ids = request.request.units.map((unit) => unit.id);
  // Pinned types are not part of the search space: they are in every candidate, so the space is the power
  // set of the *free* types and `exhaustive` is decided on those alone.
  const pinned = new Set(ids.filter((id) => request.request.pinned?.includes(id) === true));
  const free = ids.filter((id) => !pinned.has(id));
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
    const summary = simulateBattle(result, scoped);
    const evaluation: Evaluation = {
      subset,
      result,
      summary,
      score: objectiveScore(summary, request.objective),
    };
    cache.set(key, evaluation);
    evaluated += 1;
    if (evaluated % PROGRESS_EVERY === 0) {
      onProgress?.({ evaluated, bestScore: best?.score ?? -Infinity, elapsedMs: now() - started });
    }
    return evaluation;
  };

  const consider = (candidate: Evaluation): void => {
    if (!best || candidate.score > best.score) best = candidate;
  };

  // Always score the full formation first, so a zero budget still returns something usable.
  consider(evaluate(ids));

  let exhaustive = false;
  if (free.length === 0) {
    // Nothing to choose: the only candidate is the formation itself, already scored above.
    exhaustive = true;
  } else if (free.length <= EXHAUSTIVE_LIMIT) {
    exhaustive = true;
    // Without pins the empty subset is skipped (it is no formation at all); with pins, "the pins only" is a
    // real candidate, so the enumeration starts at 0.
    for (let bits = pinned.size > 0 ? 0 : 1; bits < 1 << free.length; bits += 1) {
      if (stop()) {
        exhaustive = false;
        break;
      }
      const kept = new Set(free.filter((_, index) => (bits & (1 << index)) !== 0));
      consider(evaluate(ids.filter((id) => pinned.has(id) || kept.has(id))));
    }
  } else {
    const random = mulberry32(request.seed ?? 1);
    improve(ids);
    for (let restart = 0; restart < MAX_RESTARTS && !stop(); restart += 1) {
      const start = ids.filter((id) => pinned.has(id) || random() < 0.5);
      improve(start.length > 0 ? start : ids);
    }
  }

  /** Backward elimination to a local optimum, then local swaps around it. Pinned types are never dropped. */
  function improve(start: string[]): void {
    let current = evaluate(start);
    consider(current);

    let improved = true;
    while (improved && !stop()) {
      const droppable = current.subset.filter((id) => !pinned.has(id));
      // Never empty the formation: without pins one type must survive, with pins the pins themselves do.
      if (droppable.length <= (pinned.size > 0 ? 0 : 1)) break;
      improved = false;
      let bestDrop: Evaluation | undefined;
      for (const id of droppable) {
        if (stop()) break;
        const candidate = evaluate(current.subset.filter((other) => other !== id));
        if (!bestDrop || candidate.score > bestDrop.score) bestDrop = candidate;
      }
      // Some types only pay off when they leave together (the captured runs drop SW1 *and* SP1, never one
      // of them), so when no single drop helps, look one step further and try every pair.
      if (!bestDrop || bestDrop.score <= current.score) {
        for (let i = 0; i < droppable.length && !stop(); i += 1) {
          for (let j = i + 1; j < droppable.length; j += 1) {
            const pair = evaluate(
              current.subset.filter((other) => other !== droppable[i] && other !== droppable[j]),
            );
            if (!bestDrop || pair.score > bestDrop.score) bestDrop = pair;
          }
        }
      }
      if (bestDrop && bestDrop.score > current.score) {
        current = bestDrop;
        consider(current);
        improved = true;
      }
    }

    improved = true;
    while (improved && !stop()) {
      improved = false;
      const missing = ids.filter((id) => !current.subset.includes(id));
      for (const add of missing) {
        if (stop() || improved) break;
        const grown = evaluate(ids.filter((id) => current.subset.includes(id) || id === add));
        if (grown.score > current.score) {
          current = grown;
          consider(current);
          improved = true;
          break;
        }
        for (const remove of current.subset.filter((id) => !pinned.has(id))) {
          const swapped = evaluate(
            ids.filter((id) => (current.subset.includes(id) && id !== remove) || id === add),
          );
          if (swapped.score > current.score) {
            current = swapped;
            consider(current);
            improved = true;
            break;
          }
        }
      }
    }
  }

  const winner = best ?? evaluate(ids);
  onProgress?.({ evaluated, bestScore: winner.score, elapsedMs: now() - started });
  return {
    includedUnitIds: winner.subset,
    result: winner.result,
    summary: winner.summary,
    score: winner.score,
    evaluated,
    exhaustive,
  };
}
