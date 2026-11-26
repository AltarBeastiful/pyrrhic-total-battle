/**
 * B-34 — Prime Arena Attack stack planner (v1, Attack squad only).
 *
 * Finds the best Attack stack against a mirror defender: same composition, same bonuses and gear, so the
 * opponent changes with every candidate. Candidates rank as in `primeArena.ts`: rounds won, then survivor
 * share summed over both rounds. Housing bounds the army: troops spend Leadership, monsters Dominance.
 *
 * Search: a deterministic hill climb over unit counts. It starts from an even money split inside each pool,
 * then tries moving a slice of a pool's budget from one unit to another, accepting the first move that ranks
 * higher; when no move at a slice size helps, the slice halves. It stops on the smallest slice, the evaluation
 * budget or the deadline, so the runtime is bounded. A mirror gives no wins beyond the round the attacker
 * strikes first, so in practice the search is climbing the survivor share.
 */
import type { UnitDef } from '../data/types';
import { comparePrimeArenaScore, primeArenaMatch, primeArenaScore } from './primeArena';
import type { PrimeArenaArmy, PrimeArenaMatch, PrimeArenaScore, PrimeArenaStack } from './primeArena';
import type { BonusTotals, Housing } from './types';

export interface PrimeArenaPlanInput {
  /** Units the squad may field (`primeArenaInputs(...).pool`). */
  pool: readonly UnitDef[];
  /** Leadership and Dominance caps (`primeArenaInputs(...).housing`); authority is not used. */
  housing: Housing;
  /** Bonuses of our army (`primeArenaInputs(...).totals`). */
  totals: BonusTotals;
  /** Defender override; the default is a mirror of the candidate with the same totals. */
  defenderTotals?: BonusTotals;
  /** Hard cap on match evaluations (default 1500). */
  maxEvaluations?: number;
  /** Wall-clock cap in milliseconds (default 3000). */
  maxMillis?: number;
}

export interface PrimeArenaPlan {
  /** The Attack stack, pool order, zero counts dropped. */
  stacks: PrimeArenaStack[];
  /** Per-round breakdown against the mirror. */
  match: PrimeArenaMatch;
  score: PrimeArenaScore;
  spent: { leadership: number; dominance: number };
  /** Housing the army leaves empty, per pool (Leadership and Dominance). */
  unspent: { leadership: number; dominance: number };
  /**
   * Whether a pool is filled as far as it can be: what is left costs less than the cheapest unit the squad
   * could field from it (as the march calculator fills a pool). False only when units of the pool exist in
   * the pool list but cannot be fielded, or the pool has housing and no unit at all.
   */
  maxed: { leadership: boolean; dominance: boolean };
  evaluations: number;
}

const DEFAULT_EVALUATIONS = 1500;
const DEFAULT_MILLIS = 3000;
/** Slice of a pool's budget moved per step, halved until it reaches the floor. */
const FIRST_SLICE = 0.5;
const LAST_SLICE = 1 / 64;

type Counts = number[];

function budgetOf(unit: UnitDef, housing: Housing): number {
  if (unit.pool === 'leadership') return housing.leadership;
  if (unit.pool === 'dominance') return housing.dominance;
  return 0;
}

export function planPrimeArenaAttack(input: PrimeArenaPlanInput): PrimeArenaPlan {
  const maxEvaluations = input.maxEvaluations ?? DEFAULT_EVALUATIONS;
  const deadline = Date.now() + (input.maxMillis ?? DEFAULT_MILLIS);
  // Only units a budget can pay for, and never a free one (a zero cost would be an unbounded stack).
  const units = input.pool.filter((u) => u.cost > 0 && budgetOf(u, input.housing) >= u.cost);

  const armyOf = (counts: Counts): { army: PrimeArenaArmy; stacks: PrimeArenaStack[] } => {
    const stacks = units.flatMap((unit, i) => (counts[i]! > 0 ? [{ unit, count: counts[i]! }] : []));
    return { army: { stacks, totals: input.totals }, stacks };
  };

  let evaluations = 0;
  const evaluate = (counts: Counts, counted = true): { match: PrimeArenaMatch; score: PrimeArenaScore } => {
    if (counted) evaluations += 1;
    const { army, stacks } = armyOf(counts);
    const mirror = { stacks, totals: input.defenderTotals ?? input.totals };
    const match = primeArenaMatch(army, mirror);
    return { match, score: primeArenaScore(match) };
  };

  // Start: an even money split inside each pool.
  const perPool = new Map<string, number>();
  for (const u of units) perPool.set(u.pool, (perPool.get(u.pool) ?? 0) + 1);
  const counts: Counts = units.map((u) =>
    Math.floor(budgetOf(u, input.housing) / perPool.get(u.pool)! / u.cost),
  );

  let best = evaluate(counts);
  const budgetLeft = (): boolean => evaluations < maxEvaluations && Date.now() < deadline;

  for (let slice = FIRST_SLICE; slice >= LAST_SLICE && budgetLeft(); slice /= 2) {
    let improved = true;
    while (improved && budgetLeft()) {
      improved = false;
      for (let from = 0; from < units.length && budgetLeft(); from += 1) {
        for (let to = 0; to < units.length && budgetLeft(); to += 1) {
          const a = units[from]!;
          const b = units[to]!;
          if (from === to || a.pool !== b.pool || counts[from]! <= 0) continue;
          const money = Math.min(slice * budgetOf(a, input.housing), counts[from]! * a.cost);
          const take = Math.min(counts[from]!, Math.ceil(money / a.cost));
          // Pay for as many of `b` as the freed money buys, so spending never rises above the budget.
          const give = Math.floor((take * a.cost) / b.cost);
          if (take <= 0 || give <= 0) continue;
          const trial = [...counts];
          trial[from]! -= take;
          trial[to]! += give;
          const result = evaluate(trial);
          if (comparePrimeArenaScore(result.score, best.score) > 0) {
            counts.splice(0, counts.length, ...trial);
            best = result;
            improved = true;
          }
        }
      }
    }
  }

  // Fill the housing as the calculator does: while a pool can still pay for its cheapest unit, spend it. Each
  // round tries filling the remainder with each affordable unit and keeps the best-ranked outcome.
  const spentIn = (pool: string, c: Counts): number =>
    units.reduce((a, u, i) => (u.pool === pool ? a + u.cost * c[i]! : a), 0);
  for (const pool of ['leadership', 'dominance'] as const) {
    const budget = pool === 'leadership' ? input.housing.leadership : input.housing.dominance;
    for (;;) {
      const left = budget - spentIn(pool, counts);
      let pick: { counts: Counts; result: ReturnType<typeof evaluate> } | null = null;
      for (let i = 0; i < units.length; i += 1) {
        const u = units[i]!;
        if (u.pool !== pool || u.cost > left) continue;
        const trial = [...counts];
        trial[i]! += Math.floor(left / u.cost);
        // The top-up is the price of a full pool, not search: it is outside the evaluation budget.
        const result = evaluate(trial, false);
        if (pick === null || comparePrimeArenaScore(result.score, pick.result.score) > 0) {
          pick = { counts: trial, result };
        }
      }
      if (pick === null) break;
      counts.splice(0, counts.length, ...pick.counts);
      best = pick.result;
    }
  }

  const { stacks } = armyOf(counts);
  const sum = (pool: string): number =>
    stacks.filter((s) => s.unit.pool === pool).reduce((a, s) => a + s.unit.cost * s.count, 0);
  const spent = { leadership: sum('leadership'), dominance: sum('dominance') };
  const unspent = {
    leadership: input.housing.leadership - spent.leadership,
    dominance: input.housing.dominance - spent.dominance,
  };
  const maxedIn = (pool: 'leadership' | 'dominance'): boolean => {
    const costs = input.pool.filter((u) => u.pool === pool && u.cost > 0).map((u) => u.cost);
    return costs.length === 0 ? unspent[pool] <= 0 : unspent[pool] < Math.min(...costs);
  };
  return {
    stacks,
    match: best.match,
    score: best.score,
    spent,
    unspent,
    maxed: { leadership: maxedIn('leadership'), dominance: maxedIn('dominance') },
    evaluations,
  };
}
