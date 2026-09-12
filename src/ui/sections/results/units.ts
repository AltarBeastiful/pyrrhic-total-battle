/**
 * Naming a unit id in the UI. The tables are the source of truth, but a march can field a custom
 * mercenary that only exists inside the profile, so the request's own unit list wins when it has one.
 */
import { unitById } from '@/data';
import type { Pool, UnitDef } from '@/engine/types';
import type { BadgeCategory, BadgeGroup } from '@/ui/icons';

export function findUnit(unitId: string, units?: readonly UnitDef[]): UnitDef | undefined {
  return units?.find((unit) => unit.id === unitId) ?? unitById(unitId);
}

/** Full name, e.g. "Archer I". */
export function unitName(unitId: string, units?: readonly UnitDef[]): string {
  return findUnit(unitId, units)?.name ?? unitId;
}

/** Short chip label, e.g. "ARC1". */
export function unitLabel(unitId: string, units?: readonly UnitDef[]): string {
  return findUnit(unitId, units)?.label ?? unitId;
}

/** The group a unit's badge is coloured by when the table does not name one (a custom mercenary). */
const POOL_GROUP: Record<Pool, BadgeGroup> = {
  leadership: 'guardsmen',
  authority: 'specialist',
  dominance: 'monster',
};

/** What `UnitBadge` needs to draw a unit type: its glyph, its tier and its group's colour. */
export interface UnitBadgeSpec {
  group: BadgeGroup;
  category?: BadgeCategory;
  tier?: number;
}

export function unitBadge(unit: UnitDef | undefined, pool?: Pool): UnitBadgeSpec {
  const group: BadgeGroup = unit?.group ?? POOL_GROUP[unit?.pool ?? pool ?? 'leadership'];
  const spec: UnitBadgeSpec = { group };
  if (unit?.category !== undefined) spec.category = unit.category;
  if (unit !== undefined) spec.tier = unit.tier;
  return spec;
}
