/**
 * **The rated re-typing of one march** (W11 §3.1, `docs/plans/the-rated-retyping.md`): experiment 157's
 * `rated` search (`tools/theorycraft/silver-aware.ts`), moved into the engine.
 *
 * Complete optimization chooses which troop type stands in which stack on damage alone. This pass keeps the
 * march's **hired stacks** (every pool but `leadership`) exactly, reads its troop stacks as **slots**, each
 * with its total HP, and tries every assignment of the account's troop types to those slots — exhaustively up
 * to {@link EXHAUSTIVE} assignments, else a best-improvement climb of swaps and replacements from the march as
 * it stands. Each type is sized to **at least its slot's HP** (so the kill order's HP levels and the hired
 * stacks' shelter hold). An assignment is admissible when the leadership fits and it deals **at least the
 * march's worst-opening damage**; among those the best **positive** rating by the owner's `MarkerRates`
 * (`rate`, `rating.ts`) is kept.
 *
 * Every figure is the battle's own reading: `marchResult` (`plan.ts`, exported as `planMarch`), the same call
 * 157 priced with — worst-opening damage (`summary.minDamage`) and the account's recovery bill
 * (`summary.recovery`: silver, gold, dragon coins, queue seconds). The hired burn (chunks of ten of every
 * `authority` stack, as the plan counts `mercLost`) is carried too, so the rating forgets no cost; it cannot
 * move, since the hired stacks are kept.
 */
import { marchResult, effectiveTable } from './plan';
import type { Bill, MarkerRates } from './rating';
import { rate } from './rating';
import { chunks } from './recovery';
import type { StackRequest } from './types';

/** Up to this many assignments are tried one by one; above it, the swap/replace climb. */
export const EXHAUSTIVE = 5_000;
/** The climb's step cap (157's). */
const CLIMB_STEPS = 60;

export interface RetypeOptions {
  /**
   * A wall-clock deadline, as a `Date.now()` timestamp (the clock `planCampaign`'s budget reads). Once past
   * it the search stops and returns the best assignment found so far (W11 §3.5).
   */
  deadline?: number | undefined;
}

export interface Retyped {
  /** The re-typed march: the hired stacks as they were, the troop stacks re-chosen. */
  counts: Record<string, number>;
  /** Its rating against the march as it was (`rate`, damage-percent equivalents; always positive). */
  rating: number;
  /** Admissible-by-leadership assignments battled. */
  tried: number;
  /** Every assignment was enumerated (not the climb). */
  exhaustive: boolean;
  /** The deadline stopped the search before it finished. */
  cut: boolean;
}

/** A march's bill, the battle's way: worst-opening damage and every cost its recovery carries. */
export function marchBill(request: StackRequest, counts: Record<string, number>): Bill {
  const { summary } = marchResult(request, counts);
  let hired = 0;
  for (const unit of request.units) if (unit.pool === 'authority') hired += chunks(counts[unit.id] ?? 0);
  return {
    damage: summary.minDamage,
    silver: summary.recovery.silver,
    gold: summary.recovery.gold,
    hired,
    dragonCoins: summary.recovery.dragonCoins,
    seconds: summary.recovery.seconds,
  };
}

/**
 * The best-rated re-typing of one march, or `null` when no admissible assignment rates positive (or the march
 * fields no troop stack).
 */
export function retypeMarch(
  request: StackRequest,
  counts: Record<string, number>,
  rates: MarkerRates,
  options: RetypeOptions = {},
): Retyped | null {
  const deadline = options.deadline ?? Infinity;
  let cut = false;
  const outOfTime = (): boolean => {
    if (!cut && Date.now() > deadline) cut = true;
    return cut;
  };
  const table = effectiveTable(request).filter((e) => e.pool === 'leadership');
  const { result } = marchResult(request, counts);
  const troopStacks = result.stacks.filter((s) => s.pool === 'leadership');
  const slots = troopStacks.map((s) => s.totalHp);
  if (slots.length === 0) return null;
  const hired: Record<string, number> = {};
  for (const s of result.stacks) if (s.pool !== 'leadership') hired[s.unitId] = s.count;
  const base = marchBill(request, counts);

  const build = (types: number[]): Record<string, number> | null => {
    const next: Record<string, number> = { ...hired };
    let lead = 0;
    types.forEach((ti, slot) => {
      const t = table[ti];
      if (!t) return;
      const count = Math.ceil((slots[slot] ?? 0) / t.hp);
      next[t.id] = count;
      lead += count * t.cost;
    });
    return lead <= request.housing.leadership ? next : null;
  };

  let best: { counts: Record<string, number>; rating: number } | null = null;
  let tried = 0;
  /** The candidate's rating, or −∞ when it does not fit or deals less damage. */
  const consider = (types: number[]): number => {
    const c = build(types);
    if (!c) return -Infinity;
    tried += 1;
    const bill = marchBill(request, c);
    if (bill.damage < base.damage - 1e-6) return -Infinity;
    const score = rate(base, bill, rates);
    if (score > 1e-9 && (!best || score > best.rating)) best = { counts: c, rating: score };
    return score;
  };

  const k = slots.length;
  const m = table.length;
  let perms = 1;
  for (let i = 0; i < k; i += 1) perms *= m - i;
  const exhaustive = perms <= EXHAUSTIVE;
  if (exhaustive) {
    const walk = (acc: number[], used: Set<number>): void => {
      if (outOfTime()) return;
      if (acc.length === k) {
        consider(acc);
        return;
      }
      for (let i = 0; i < m; i += 1) {
        if (used.has(i)) continue;
        used.add(i);
        acc.push(i);
        walk(acc, used);
        acc.pop();
        used.delete(i);
      }
    };
    walk([], new Set());
  } else {
    // A best-improvement climb from the march as it stands (rating 0 against itself): swap two slots, or put
    // an unused type in a slot; move to the best neighbour while it rates higher than where the climb stands.
    let current = troopStacks.map((s) => table.findIndex((t) => t.id === s.unitId));
    let currentScore = 0;
    for (let step = 0; step < CLIMB_STEPS && !outOfTime(); step += 1) {
      let moved: { types: number[]; score: number } | null = null;
      const neighbours: number[][] = [];
      for (let a = 0; a < k; a += 1) {
        for (let b = a + 1; b < k; b += 1) {
          const next = [...current];
          [next[a], next[b]] = [next[b] as number, next[a] as number];
          neighbours.push(next);
        }
        for (let t = 0; t < m; t += 1) {
          if (current.includes(t)) continue;
          const next = [...current];
          next[a] = t;
          neighbours.push(next);
        }
      }
      for (const next of neighbours) {
        if (outOfTime()) break;
        const s = consider(next);
        if (s > currentScore + 1e-6 && (!moved || s > moved.score)) moved = { types: next, score: s };
      }
      if (!moved) break;
      current = moved.types;
      currentScore = moved.score;
    }
  }
  const found = best as { counts: Record<string, number>; rating: number } | null;
  return found ? { counts: found.counts, rating: found.rating, tried, exhaustive, cut } : null;
}
