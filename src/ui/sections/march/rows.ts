/**
 * The March card's two readings of one result: the army as tiles, and the counts as rows.
 *
 * Both are pure functions of what the engine returned plus what the player has left out by hand, so
 * the components below stay declarative and the reasoning that decides "this type is in the march,
 * that one is left out" is testable on its own.
 */
import { retrainOne, reviveOne } from '@/engine';
import type { BattleSummary, Pool, Stack, StackRequest, StackResult, UnitDef } from '@/engine/types';
import { unitGroupOf } from '@/ui/domain';

import { findUnit } from './units';

// ---- The march as pills, one block per pool ------------------------------------------------------
/** A stack of the march, as one pill draws it. */
export interface PillEntry {
  unit: UnitDef;
  /** Units of this type in the march. */
  count: number;
}

/** One housing pool: what it paid for, and the stacks it is paying for, in kill order. */
export interface PoolRow {
  pool: Pool;
  used: number;
  capacity: number;
  entries: PillEntry[];
}

/** The pools in the order the Battle card asks for them. */
export const POOL_ORDER: readonly Pool[] = ['leadership', 'authority', 'dominance'];

export interface PoolRowsInput {
  /** The result on screen: its stacks are already in kill order, first to fall first. */
  result: StackResult;
  /** The unit types the march was computed from. */
  units: readonly UnitDef[];
}

/**
 * One block per housing pool (design plan §5.5): the pool's own figure, then the stacks it houses
 * as pills **in kill order** — the order the engine returned them in, which is the order they fall.
 *
 * Only what is marching (owner, 2026-09-13): a type the search or the player left out is not a
 * stack, so it does not take a stack's space. `leftOutOf` below gathers those into the small row
 * that sits under the pools.
 *
 * A pool with no stacks and no capacity is left out of the list rather than drawn empty.
 */
export function poolRows({ result, units }: PoolRowsInput): PoolRow[] {
  const byPool = new Map<Pool, PillEntry[]>();

  for (const stack of result.stacks) {
    if (stack.count <= 0) continue;
    const unit = findUnit(stack.unitId, units);
    if (unit === undefined) continue;
    const entry: PillEntry = { unit, count: stack.count };
    const list = byPool.get(stack.pool);
    if (list === undefined) byPool.set(stack.pool, [entry]);
    else list.push(entry);
  }

  const rows: PoolRow[] = [];
  for (const pool of POOL_ORDER) {
    const entries = byPool.get(pool) ?? [];
    const usage = result.pools[pool];
    if (entries.length === 0 && usage.capacity <= 0 && usage.used <= 0) continue;
    rows.push({ pool, used: usage.used, capacity: usage.capacity, entries });
  }
  return rows;
}

/** Why a type is not marching: the player took it out, or the sizer or the search dropped it. */
export type LeftOutReason = 'you' | 'search';

/** One type of the "Left out" row: what it is, and who left it out. */
export interface LeftOutUnit {
  unit: UnitDef;
  reason: LeftOutReason;
}

/**
 * The types that are *not* in this march: **every type the account can field** and did not march,
 * whether the solver dropped it or the player took it out. They are drawn under the pools as a small
 * row of outlined pills — TotalStack's "removed from formation" line, in our words — so nothing the
 * account fields ever disappears from the screen (design rule 13).
 *
 * `units` is the whole available army, because the request kept on the result is never narrowed: the
 * sizer is called with a filtered copy, so a type the player took out is still here to be put back.
 *
 * Putting one back is the same act either way (S-53), but the row still says *who* left it out, and
 * that is `leftOutByPlayer`: anything else missing from the result was the solver's own decision.
 */
export function leftOutOf(
  units: readonly UnitDef[],
  result: StackResult,
  leftOutByPlayer: readonly string[],
): LeftOutUnit[] {
  const marching = new Set(result.stacks.filter((stack) => stack.count > 0).map((s) => s.unitId));
  const byHand = new Set(leftOutByPlayer);
  const seen = new Set<string>();
  const out: LeftOutUnit[] = [];
  for (const unit of units) {
    if (marching.has(unit.id) || seen.has(unit.id)) continue;
    seen.add(unit.id);
    out.push({ unit, reason: byHand.has(unit.id) ? 'you' : 'search' });
  }
  return out.sort((a, b) => a.unit.tier - b.unit.tier || a.unit.name.localeCompare(b.unit.name));
}

// ---- The counts to copy -------------------------------------------------------------------------
/** One stack as the march table and the unit sheet read it. */
export interface MarchStackRow {
  unit: UnitDef;
  stack: Stack;
  /** Place in the kill order, 1-based; `undefined` for a stack edited down to nothing. */
  position?: number;
  /** How many times this stack strikes before it falls (the journal's own counter). */
  hits: number;
  /** Damage this stack deals across the whole battle, summed from the journal. */
  damage: number;
  /**
   * That damage as a fraction of the biggest stack's, `0`–`1`. The kill-order column draws it as a
   * bar: total HP is nearly flat by construction (the sizer gives every stack the same ceiling), so
   * HP bars would all be the same length, while damage dealt varies by an order of magnitude.
   */
  damageShare: number;
  /** Units lost: the whole stack, since the model plays the battle to the end of the army. */
  lost: number;
  /** Gold to bring them back, this stack alone. */
  reviveGold: number;
  /** Silver and time to train them again, this stack alone. */
  retrainSilver: number;
  retrainSeconds: number;
  /** The stacking method deliberately puts this stack behind every troop stack. */
  fallsLast: boolean;
}

/** Every blow one stack lands in a journal: how many, and how much they came to. */
function strikesOf(summary: BattleSummary, unitId: string): { hits: number; damage: number } {
  let hits = 0;
  let damage = 0;
  for (const entry of summary.journals.enemyFirst.entries) {
    if (entry.actor !== 'army' || entry.unitId !== unitId) continue;
    hits += 1;
    damage += entry.damage;
  }
  return { hits, damage };
}

/** A stack the player edited down to zero: out of the battle, still on the list so it can come back. */
function zeroed(stack: Stack): Stack {
  return { ...stack, count: 0, totalHp: 0, damagePerHit: 0, featuresDamage: 0 };
}

/**
 * The stacks in kill order, with what the table and the sheet say about each one. Stacks edited to
 * zero keep a row at the end: their count is what puts them back.
 */
export function marchRows(
  request: StackRequest,
  generated: StackResult,
  shown: StackResult,
  summary: BattleSummary,
): MarchStackRow[] {
  const live = new Map(shown.stacks.map((stack) => [stack.unitId, stack]));
  const ordered = [
    ...shown.stacks,
    ...generated.stacks.filter((stack) => !live.has(stack.unitId)).map(zeroed),
  ];
  const mercenariesLast = request.options.method === 'ms';

  const rows: MarchStackRow[] = [];
  ordered.forEach((stack, index) => {
    const unit = findUnit(stack.unitId, request.units);
    if (unit === undefined) return;
    const group = unitGroupOf(unit);
    const retrain = retrainOne(unit, stack.count, request.recovery);
    rows.push({
      unit,
      stack,
      ...(live.has(stack.unitId) ? { position: index + 1 } : {}),
      ...strikesOf(summary, stack.unitId),
      damageShare: 0,
      lost: stack.count,
      reviveGold: Math.round(reviveOne(unit, stack.count, request.recovery).gold),
      retrainSilver: Math.round(retrain.silver),
      retrainSeconds: retrain.seconds,
      fallsLast: mercenariesLast && (group === 'mercenaries' || group === 'monsters'),
    });
  });

  const loudest = rows.reduce((most, row) => Math.max(most, row.damage), 0);
  return loudest <= 0 ? rows : rows.map((row) => ({ ...row, damageShare: row.damage / loudest }));
}

/** The counts as the game wants them typed back in: one line per stack, "ARC3 2310". */
export function countsText(rows: readonly MarchStackRow[]): string {
  return rows
    .filter((row) => row.stack.count > 0)
    .map((row) => `${row.unit.label} ${String(row.stack.count)}`)
    .join('\n');
}
