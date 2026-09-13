/**
 * The five families the interface colours units by, and the one place that decides which one a
 * `UnitDef` belongs to (design plan §6.1). The data model has four `group` values plus a `kind`; the
 * interface has five families, because mercenaries are their own colour whatever their tags say.
 *
 * A family's name is also a theme colour name (`src/ui/theme.ts`), which is what lets a component
 * write `var(--mantine-color-${group}-text)` and get the right ink in either scheme. Nothing here
 * knows about class names any more — that was the Tailwind kit's job.
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

/** The group's ink, right in either scheme: shade 7 on a light page, shade 4 on a dark one. */
export function groupInk(group: UnitGroup): string {
  return `var(--mantine-color-${group}-text)`;
}

/** The group's tonal ground — a tinted step, never a coloured block. */
export function groupGround(group: UnitGroup): string {
  return `var(--mantine-color-${group}-light)`;
}

/**
 * A tier as the game writes it: `Swordsman I`, `Abomination VI` (D-19). The tables run to tier 9,
 * and a hand-typed mercenary may carry 0, which has no numeral and falls back to the figure.
 */
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'] as const;

export function romanTier(tier: number): string {
  return ROMAN[tier] ?? String(tier);
}
