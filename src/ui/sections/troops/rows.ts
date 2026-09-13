/**
 * The four groups of the Troops card (design plan §7.1, amended) and the pure helpers that turn
 * `profile.troops` into what the card draws: the tiers a stepper steps through, the unit types of
 * the top tier, and the types the March left out below it.
 *
 * Everything here is derived from the game tables, never hard-coded: the tiers of a group, the
 * categories a tier offers, the order types are listed in. A data update that adds a tier or a
 * category therefore shows up in the card without touching this file.
 */
import { getUnits } from '@/data';
import { CATEGORIES } from '@/data/types';
import type { Category, Group, UnitDef } from '@/data/types';
import type { ProfileTroops } from '@/state/schema';

/** The four groups, in the order the game lists them. Ids match the keys of `profile.troops`. */
export type TroopRowId = 'guardsmen' | 'specialists' | 'engineers' | 'monsters';

/** Groups whose top-tier tiles drop a whole category (`topTierExcluded`), not one unit id. */
export type ChipRowId = 'guardsmen' | 'specialists';

export interface TroopRow {
  id: TroopRowId;
  label: string;
  /** How a tier is written: G1, S1, E1, M3 — the prefix `TierSelect` writes its options with. */
  prefix: 'G' | 'S' | 'E' | 'M';
  /** Groups with more than one type per tier show the top tier as chips; engineers have one. */
  tiles: boolean;
  /** Engineers and monsters have a "none" position below their first tier. */
  allowNone: boolean;
}

export const TROOP_ROWS: readonly TroopRow[] = [
  { id: 'guardsmen', label: 'Guardsmen', prefix: 'G', tiles: true, allowNone: false },
  { id: 'specialists', label: 'Specialists', prefix: 'S', tiles: true, allowNone: false },
  { id: 'engineers', label: 'Engineers', prefix: 'E', tiles: false, allowNone: true },
  { id: 'monsters', label: 'Monsters', prefix: 'M', tiles: true, allowNone: true },
];

export const CHIP_ROWS: readonly ChipRowId[] = ['guardsmen', 'specialists'];

export function isChipRow(id: TroopRowId): id is ChipRowId {
  return (CHIP_ROWS as readonly TroopRowId[]).includes(id);
}

/** `profile.troops` names the row "specialists"; the unit tables name the group "specialist". */
export const ROW_GROUP: Record<TroopRowId, Group> = {
  guardsmen: 'guardsmen',
  specialists: 'specialist',
  engineers: 'engineers',
  monsters: 'monster',
};

/** Every unit type of one group, whatever the player has unlocked. */
export function rowUnits(row: TroopRowId): UnitDef[] {
  const group = ROW_GROUP[row];
  return getUnits().filter((unit) =>
    row === 'monsters' ? unit.kind === 'monster' : unit.kind === 'troop' && unit.group === group,
  );
}

/** Every tier the game offers for a group, lowest first: the positions of its steppers. */
export function rowTiers(row: TroopRowId): number[] {
  return [...new Set(rowUnits(row).map((unit) => unit.tier))].sort((left, right) => left - right);
}

/** Lowest and highest tier the game offers for a group (monsters start at 3). */
export function rowBounds(row: TroopRowId): { min: number; max: number } {
  const tiers = rowTiers(row);
  return { min: tiers[0] ?? 1, max: tiers[tiers.length - 1] ?? 1 };
}

/** The categories a group actually has at one tier (guardsmen gain flying at G5, specialists at S5). */
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
 * The unit types a group contributes: inside the tier range and, at the highest tier, not dropped
 * by a category. Per-unit exclusions are deliberately *not* applied — the card has to show a type
 * that was left out so the player can put it back.
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

/** The types of the highest tier the player owns: the tiles of the row. */
export function topTierUnits(troops: ProfileTroops, row: TroopRowId): UnitDef[] {
  const range = troops[row];
  if (range === null) return [];
  return sortForDisplay(rowUnits(row).filter((unit) => unit.tier === range.max));
}

/**
 * Is this top-tier type in the march? Guardsmen and specialists are dropped by category, monsters
 * by unit id; a type the March left out (`excludedUnitIds`) reads as off whatever its group.
 */
export function topTierIncluded(troops: ProfileTroops, row: TroopRowId, unit: UnitDef): boolean {
  if (troops.excludedUnitIds.includes(unit.id)) return false;
  if (!isChipRow(row) || unit.category === undefined) return true;
  return !troops.topTierExcluded[row].includes(unit.category);
}

/**
 * Types of this group the March left out below the top tier. Lower tiers are always in, so these
 * are the only ones the card has to offer back — the top tier says it with its tiles.
 */
export function leftOutUnits(troops: ProfileTroops, row: TroopRowId): UnitDef[] {
  const range = troops[row];
  if (range === null) return [];
  const excluded = new Set(troops.excludedUnitIds);
  return sortForDisplay(
    rowUnits(row).filter((unit) => unit.tier >= range.min && unit.tier < range.max && excluded.has(unit.id)),
  );
}

/** True when the profile owns nothing at all, which is what the guided empty state answers. */
export function isEmptyArmy(troops: ProfileTroops): boolean {
  return TROOP_ROWS.every((row) => troops[row.id] === null);
}
