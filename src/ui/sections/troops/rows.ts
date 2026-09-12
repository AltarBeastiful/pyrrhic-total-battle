/**
 * S-11 — the four rows of the Troops section and the pure helpers that turn `profile.troops` into a
 * list of unit types.
 *
 * Everything here is derived from the game tables, never hard-coded: the tier bounds of a row, the
 * categories a tier actually offers, the order units are listed in. A data update that adds a tier or a
 * category therefore shows up in the UI without touching this file.
 */
import { getUnits } from '@/data';
import { CATEGORIES } from '@/data/types';
import type { Category, Group, UnitDef } from '@/data/types';
import type { ProfileTroops } from '@/state/schema';

/** The four rows, in the order PLAN §4.2 lists them. Row ids match the keys of `profile.troops`. */
export type TroopRowId = 'guardsmen' | 'specialists' | 'engineers' | 'monsters';

/** Rows whose top tier offers per-category chips (the only two families with several categories). */
export type ChipRowId = 'guardsmen' | 'specialists';

export interface TroopRow {
  id: TroopRowId;
  label: string;
  /** How a tier is written in the pickers: G1, S1, E1, M3. */
  prefix: string;
  /** Guardsmen and specialists let the player drop categories of the highest tier. */
  chips: boolean;
  /** Engineers and monsters can be switched off entirely ("none"). */
  allowNone: boolean;
}

export const TROOP_ROWS: readonly TroopRow[] = [
  { id: 'guardsmen', label: 'Guardsmen', prefix: 'G', chips: true, allowNone: false },
  { id: 'specialists', label: 'Specialists', prefix: 'S', chips: true, allowNone: false },
  { id: 'engineers', label: 'Engineers', prefix: 'E', chips: false, allowNone: true },
  { id: 'monsters', label: 'Monsters', prefix: 'M', chips: false, allowNone: true },
];

export const CHIP_ROWS: readonly ChipRowId[] = ['guardsmen', 'specialists'];

export function isChipRow(id: TroopRowId): id is ChipRowId {
  return (CHIP_ROWS as readonly TroopRowId[]).includes(id);
}

/** `profile.troops` names the row "specialists"; the unit tables name the group "specialist". */
const ROW_GROUP: Record<TroopRowId, Group> = {
  guardsmen: 'guardsmen',
  specialists: 'specialist',
  engineers: 'engineers',
  monsters: 'monster',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  melee: 'Melee',
  ranged: 'Ranged',
  mounted: 'Mounted',
  flying: 'Flying',
};

/** Every unit type of one row, whatever the player has unlocked. */
export function rowUnits(row: TroopRowId): UnitDef[] {
  const group = ROW_GROUP[row];
  return getUnits().filter((unit) =>
    row === 'monsters' ? unit.kind === 'monster' : unit.kind === 'troop' && unit.group === group,
  );
}

/** Lowest and highest tier the game offers for a row (monsters start at 3). */
export function rowBounds(row: TroopRowId): { min: number; max: number } {
  const tiers = rowUnits(row).map((unit) => unit.tier);
  return { min: Math.min(...tiers), max: Math.max(...tiers) };
}

/** The categories a row actually has at one tier (guardsmen gain flying at G5, specialists at S5). */
export function categoriesAtTier(row: TroopRowId, tier: number): Category[] {
  const present = new Set(
    rowUnits(row)
      .filter((unit) => unit.tier === tier)
      .map((unit) => unit.category)
      .filter((category): category is Category => category !== undefined),
  );
  return CATEGORIES.filter((category) => present.has(category));
}

const CATEGORY_ORDER: Record<Category, number> = { ranged: 0, melee: 1, mounted: 2, flying: 3 };

function sortForDisplay(units: UnitDef[]): UnitDef[] {
  return [...units].sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    const left = a.category ? CATEGORY_ORDER[a.category] : 4;
    const right = b.category ? CATEGORY_ORDER[b.category] : 4;
    return left - right;
  });
}

/**
 * The unit types a row contributes: inside the tier range and, at the highest tier, not dropped by a
 * category chip. Per-unit exclusions are deliberately *not* applied — the preview grid has to show an
 * excluded unit so the player can put it back.
 */
export function rowSelection(troops: ProfileTroops, row: TroopRowId): UnitDef[] {
  const range = troops[row];
  if (range === null) return [];
  const excludedCategories = isChipRow(row) ? troops.topTierExcluded[row] : [];
  return sortForDisplay(
    rowUnits(row).filter((unit) => {
      if (unit.tier < range.min || unit.tier > range.max) return false;
      if (unit.tier !== range.max || unit.category === undefined) return true;
      return !excludedCategories.includes(unit.category);
    }),
  );
}

export interface RowSelection {
  row: TroopRow;
  units: UnitDef[];
}

/** Every row's selection, in page order; rows with nothing selected are kept so the grid can say so. */
export function selectionByRow(troops: ProfileTroops): RowSelection[] {
  return TROOP_ROWS.map((row) => ({ row, units: rowSelection(troops, row.id) }));
}

/** All selected unit types, flattened — the grid's contents, excluded ones included. */
export function selectedUnits(troops: ProfileTroops): UnitDef[] {
  return selectionByRow(troops).flatMap((entry) => entry.units);
}
