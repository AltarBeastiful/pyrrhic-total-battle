/**
 * **The silver-aware re-typing of a march** — experiment 157's search, shared with 158 so the two read one
 * implementation. The hired stacks are kept; the troop stacks are slots; every assignment of the account's
 * troop types to them is tried (exhaustively to 5 000, else a swap/replace climb), each type at least its
 * slot's HP; the assignment must fit the leadership and deal at least the march's damage (worst opening).
 *
 *  - `strict` — least silver, the training queue no longer;
 *  - `free` — least silver, the queue left free;
 *  - `rated` — the best score by the owner's rating (`CAMPAIGN.markerRates`), kept only where it is positive.
 */
import { CAMPAIGN } from '../../src/config';
import { planMarch } from '../../src/engine';
import { effectiveTable } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import type { Campaign } from '../../tests/engine/plan-campaign';

const EXHAUSTIVE = 5_000;
/**
 * Three readings of "better", each its own report:
 *  - `strict` (default) — least silver, damage and training queue both held;
 *  - `QUEUE=free` — least silver, damage held, the queue left free (the first run);
 *  - `QUEUE=rated` — the **owner's own rating** (`CAMPAIGN.markerRates`, S-135: *"this many percent of this cost
 *    equals one percent of damage"* — silver 5, gold 5, hired 5, dragon coins 8, queue 40): the assignment with
 *    the best score, damage held, kept only where the score is positive.
 */
export type RetypeMode = 'strict' | 'free' | 'rated';
export const RATES = CAMPAIGN.markerRates;
/** Percent saved on a cost (positive = cheaper), 0 on a bill of nothing. */
export const saved = (before: number, after: number): number =>
  before > 0 ? ((before - after) / before) * 100 : 0;
/** The owner's rating of `after` against `before`: damage change % plus each cost saved % over its rate. */
export const rating = (before: Campaign, after: Campaign): number =>
  (before.damage > 0 ? ((after.damage - before.damage) / before.damage) * 100 : 0) +
  saved(before.silver, after.silver) / RATES.silver +
  saved(before.gold, after.gold) / RATES.gold +
  saved(before.burned, after.burned) / RATES.hired +
  saved(before.dragonCoins, after.dragonCoins) / RATES.dragonCoins +
  saved(before.seconds, after.seconds) / RATES.seconds;
/** One march priced the battle's way: its worst-opening damage and the silver its recovery plan costs. */
export const score = (
  request: StackRequest,
  counts: Record<string, number>,
): { damage: number; silver: number; seconds: number } => {
  const { summary } = planMarch(request, counts);
  return { damage: summary.minDamage, silver: summary.recovery.silver, seconds: summary.recovery.seconds };
};

/**
 * The silver-aware re-typing of one march: the least-silver assignment of troop types to its troop slots that
 * deals at least the march's damage and fits the leadership. `null` when nothing beats the march as it is.
 */
export const retype = (
  request: StackRequest,
  counts: Record<string, number>,
  mode: RetypeMode = 'strict',
): { counts: Record<string, number>; tried: number; exhaustive: boolean } | null => {
  const table = effectiveTable(request).filter((e) => e.pool === 'leadership');
  const { result } = planMarch(request, counts);
  const slots = result.stacks.filter((s) => s.pool === 'leadership').map((s) => s.totalHp);
  if (slots.length === 0) return null;
  const hired: Record<string, number> = {};
  for (const s of result.stacks) if (s.pool !== 'leadership') hired[s.unitId] = s.count;
  const base = score(request, counts);
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
  let best: { counts: Record<string, number>; silver: number; score: number } | null = null;
  let tried = 0;
  const consider = (types: number[]): number => {
    const c = build(types);
    if (!c) return Infinity;
    tried += 1;
    const s = score(request, c);
    if (s.damage < base.damage - 1e-6) return Infinity;
    // No longer a training queue either (owner: "check if it improves all criteria"; the first run lost up to
    // 0.5 % of queue on 12 use cases to the rounding up of each re-typed stack).
    if (mode === 'strict' && s.seconds > base.seconds + 1e-6) return Infinity;
    if (mode === 'rated') {
      // The rating on one march: the hired stacks are the march's own, so only damage, silver and queue move.
      const score =
        (base.damage > 0 ? ((s.damage - base.damage) / base.damage) * 100 : 0) +
        saved(base.silver, s.silver) / RATES.silver +
        saved(base.seconds, s.seconds) / RATES.seconds;
      if (score > 1e-9 && (!best || score > best.score)) best = { counts: c, silver: s.silver, score };
      return -score;
    }
    if (s.silver < base.silver - 1e-6 && (!best || s.silver < best.silver))
      best = { counts: c, silver: s.silver, score: 0 };
    return s.silver;
  };
  const k = slots.length;
  const m = table.length;
  let perms = 1;
  for (let i = 0; i < k; i += 1) perms *= m - i;
  const exhaustive = perms <= EXHAUSTIVE;
  if (exhaustive) {
    const walk = (acc: number[], used: Set<number>): void => {
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
    // A best-improvement climb from the march as it stands: swap two slots, or put an unused type in a slot.
    const start = result.stacks
      .filter((s) => s.pool === 'leadership')
      .map((s) => table.findIndex((t) => t.id === s.unitId));
    let current = start;
    let currentSilver = mode === 'rated' ? 0 : base.silver;
    for (let step = 0; step < 60; step += 1) {
      let moved: { types: number[]; silver: number } | null = null;
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
        const s = consider(next);
        if (s < currentSilver - 1e-6 && (!moved || s < moved.silver)) moved = { types: next, silver: s };
      }
      if (!moved) break;
      current = moved.types;
      currentSilver = moved.silver;
    }
  }
  const found = best as { counts: Record<string, number>; silver: number; score: number } | null;
  return found ? { counts: found.counts, tried, exhaustive } : null;
};
