/**
 * The five families the interface colours units by, and the one place that decides which one a
 * `UnitDef` belongs to. The data model has four `group` values plus a `kind`; the interface has
 * five families, because mercenaries are their own colour whatever their tags say (design plan
 * §6.1). Everything visual — tiles, summary markers, the march table's row edge — reads a
 * `UnitGroup`, never a raw `group` or `kind`.
 */
import type { UnitDef } from '../../data/types';

export type UnitGroup = 'guardsmen' | 'specialists' | 'engineers' | 'monsters' | 'mercenaries';

/** Display order: the order the game lists them in, mercenaries last. */
export const UNIT_GROUPS = [
  'guardsmen',
  'specialists',
  'engineers',
  'monsters',
  'mercenaries',
] as const satisfies readonly UnitGroup[];

/** What a group is called in a sentence. */
export const GROUP_LABEL: Record<UnitGroup, string> = {
  guardsmen: 'Guardsmen',
  specialists: 'Specialists',
  engineers: 'Engineers',
  monsters: 'Monsters',
  mercenaries: 'Mercenaries',
};

/**
 * Which family a unit is drawn as. Mercenaries are decided by `kind` first — a mercenary's `group`
 * comes from its tags and would otherwise paint it as a guardsman.
 */
export function unitGroupOf(unit: UnitDef): UnitGroup {
  if (unit.kind === 'mercenary') return 'mercenaries';
  if (unit.kind === 'monster') return 'monsters';
  switch (unit.group) {
    case 'specialist':
      return 'specialists';
    case 'engineers':
      return 'engineers';
    case 'monster':
      return 'monsters';
    default:
      return 'guardsmen';
  }
}

/**
 * The three colour utilities of a group, written out in full so Tailwind's scanner sees every class
 * it has to generate. Shaped as a `tv()` variant map: `variants: { group: GROUP_TONE }`.
 */
export const GROUP_TONE: Record<UnitGroup, string> = {
  guardsmen: 'bg-group-guardsmen-soft text-group-guardsmen-strong border-group-guardsmen-edge',
  specialists: 'bg-group-specialists-soft text-group-specialists-strong border-group-specialists-edge',
  engineers: 'bg-group-engineers-soft text-group-engineers-strong border-group-engineers-edge',
  monsters: 'bg-group-monsters-soft text-group-monsters-strong border-group-monsters-edge',
  mercenaries: 'bg-group-mercenaries-soft text-group-mercenaries-strong border-group-mercenaries-edge',
};

/** The group's ink alone, for text that sits on a neutral surface. */
export const GROUP_INK: Record<UnitGroup, string> = {
  guardsmen: 'text-group-guardsmen-strong',
  specialists: 'text-group-specialists-strong',
  engineers: 'text-group-engineers-strong',
  monsters: 'text-group-monsters-strong',
  mercenaries: 'text-group-mercenaries-strong',
};

/** The edge colour as a fill: the summary marker's bar. */
export const GROUP_EDGE_BG: Record<UnitGroup, string> = {
  guardsmen: 'bg-group-guardsmen-edge',
  specialists: 'bg-group-specialists-edge',
  engineers: 'bg-group-engineers-edge',
  monsters: 'bg-group-monsters-edge',
  mercenaries: 'bg-group-mercenaries-edge',
};

/**
 * The edge colour as a whole hairline, softened so it frames the tonal fill instead of boxing it in:
 * the unit tile's outline (design plan D-17 — one step of tone and one hairline, never a bar as
 * well).
 */
export const GROUP_OUTLINE: Record<UnitGroup, string> = {
  guardsmen: 'border-group-guardsmen-edge/40',
  specialists: 'border-group-specialists-edge/40',
  engineers: 'border-group-engineers-edge/40',
  monsters: 'border-group-monsters-edge/40',
  mercenaries: 'border-group-mercenaries-edge/40',
};

/** The edge colour on the left border only: the march row's edge. */
export const GROUP_EDGE_LEFT: Record<UnitGroup, string> = {
  guardsmen: 'border-l-group-guardsmen-edge',
  specialists: 'border-l-group-specialists-edge',
  engineers: 'border-l-group-engineers-edge',
  monsters: 'border-l-group-monsters-edge',
  mercenaries: 'border-l-group-mercenaries-edge',
};

/**
 * A tier as the game writes it: `Swordsman I`, `Abomination VI` (design direction D-19). The tables
 * run to tier 9, and a hand-typed mercenary may carry 0, which has no numeral and falls back to the
 * figure so the tile never renders an empty box.
 */
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'] as const;

export function romanTier(tier: number): string {
  return ROMAN[tier] ?? String(tier);
}
