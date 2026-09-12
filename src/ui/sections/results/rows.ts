/**
 * The March card's two readings of one result: the army as tiles, and the counts as rows.
 *
 * Both are pure functions of what the engine returned plus what the player has left out by hand, so
 * the components below stay declarative and the reasoning that decides "this type is in the march,
 * that one is left out" is testable on its own.
 */
import { retrainOne, reviveOne } from '@/engine';
import type { BattleSummary, Stack, StackRequest, StackResult, UnitDef } from '@/engine/types';
import { unitGroupOf, UNIT_GROUPS } from '@/ui/domain';
import type { UnitGroup } from '@/ui/domain';

import { amount } from './format';
import { findUnit } from './units';

// ---- The march as tiles -------------------------------------------------------------------------
/** A type of the profile's range, as the tile row draws it. */
export interface TileEntry {
  unit: UnitDef;
  /** Units of this type in the march; `0` when it is left out. */
  count: number;
  /** `pinned` is kept in by hand, `leftOut` is not marching, `on` is simply in. */
  state: 'on' | 'pinned' | 'leftOut';
}

export interface TileRow {
  group: UnitGroup;
  entries: TileEntry[];
}

/** What a tile does when it is pressed, said in full: a tile is a verb, not a decoration. */
export function tileLabel(entry: TileEntry): string {
  const head = `${entry.unit.name}, tier ${String(entry.unit.tier)}`;
  if (entry.state === 'leftOut') return `${head}, left out — keep in march`;
  const kept = entry.state === 'pinned' ? ', kept in' : '';
  return `${head}, ${amount(entry.count)} in the march${kept} — leave out`;
}

export interface TileRowsInput {
  /** The unit types the march was computed from. */
  units: readonly UnitDef[];
  /** Counts by unit id, from the result on screen. */
  counts: Map<string, number>;
  /** Types kept in the march by hand. */
  pinned: readonly string[];
  /** Types that are not in the request any more: excluded in the profile, removed here by hand. */
  leftOutIds: readonly string[];
}

/** Tiers first, then the name: the order the Troops card draws a group in. */
function byTier(a: TileEntry, b: TileEntry): number {
  return a.unit.tier - b.unit.tier || a.unit.name.localeCompare(b.unit.name);
}

/**
 * One row per group, each holding the types of the profile's range: the ones marching with their
 * count, then the ones the search or the player left out, dimmed. A row with nothing in it is left
 * out of the list rather than drawn empty.
 */
export function tileRows({ units, counts, pinned, leftOutIds }: TileRowsInput): TileRow[] {
  const entries = new Map<string, TileEntry>();

  for (const unit of units) {
    const count = counts.get(unit.id) ?? 0;
    const state = count <= 0 ? 'leftOut' : pinned.includes(unit.id) ? 'pinned' : 'on';
    entries.set(unit.id, { unit, count, state });
  }

  for (const unitId of leftOutIds) {
    if (entries.has(unitId)) continue;
    // A type the player took out is no longer in the request, so the tables name it.
    const unit = findUnit(unitId, units);
    if (unit === undefined) continue;
    entries.set(unitId, { unit, count: 0, state: 'leftOut' });
  }

  const rows: TileRow[] = [];
  for (const group of UNIT_GROUPS) {
    const inGroup = [...entries.values()].filter((entry) => unitGroupOf(entry.unit) === group);
    if (inGroup.length === 0) continue;
    rows.push({ group, entries: inGroup.sort(byTier) });
  }
  return rows;
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

/** How many hits one stack lands in a journal. */
function hitsOf(summary: BattleSummary, unitId: string): number {
  return summary.journals.enemyFirst.entries.filter(
    (entry) => entry.actor === 'army' && entry.unitId === unitId,
  ).length;
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
      hits: hitsOf(summary, stack.unitId),
      lost: stack.count,
      reviveGold: Math.round(reviveOne(unit, stack.count, request.recovery).gold),
      retrainSilver: Math.round(retrain.silver),
      retrainSeconds: retrain.seconds,
      fallsLast: mercenariesLast && (group === 'mercenaries' || group === 'monsters'),
    });
  });
  return rows;
}

/** The counts as the game wants them typed back in: one line per stack, "ARC3 2310". */
export function countsText(rows: readonly MarchStackRow[]): string {
  return rows
    .filter((row) => row.stack.count > 0)
    .map((row) => `${row.unit.label} ${String(row.stack.count)}`)
    .join('\n');
}
