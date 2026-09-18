/**
 * The five families the interface colours units by, and the one place that decides which one a
 * `UnitDef` belongs to (design plan §6.1). The data model has four `group` values plus a `kind`; the
 * interface has five families, because mercenaries are their own colour whatever their tags say.
 *
 * A family's name is also a theme colour name (`src/ui/theme.ts`), which is what lets a component
 * write `var(--mantine-color-${group}-text)` and get the right ink in either scheme. Nothing here
 * knows about class names any more — that was the Tailwind kit's job.
 */
import type { Pool, UnitDef } from '../../data/types';
import { tierInk } from '../kit/tiers';

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
 * A housing pool's colour (design plan §5.5): the pool's own figure is written in it, above the
 * stacks it paid for. Three of our ramps, chosen for what the pool's glyph already is — the shield
 * is the guardsmen green, the crown is the brass, the skull is the danger red — so the page gains a
 * meaning rather than a hue (design rule 20).
 */
export const POOL_COLOR: Record<Pool, string> = {
  leadership: 'guardsmen',
  authority: 'brass',
  dominance: 'danger',
};

export function poolInk(pool: Pool): string {
  return `var(--mantine-color-${POOL_COLOR[pool]}-filled)`;
}

/**
 * The tier inks live in the kit (`kit/tiers.ts`), where the stepper writes "G3" in one; re-exported
 * here so the domain keeps reading them from the one place that knows what a unit is.
 */
export { tierInk } from '../kit/tiers';

/**
 * The tonal wash under a tier's ink — the 12 % the palette checks that ink against. Written with
 * `color-mix` rather than with Mantine's `-light`, which is a different alpha in each scheme.
 */
export function tierGround(tier: number): string {
  return `color-mix(in srgb, ${tierInk(tier)} 13%, transparent)`;
}

/**
 * A tier as the game writes it: `Swordsman I`, `Abomination VI` (D-19). The tables run to tier 9,
 * and a hand-typed mercenary may carry 0, which has no numeral and falls back to the figure.
 */
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'] as const;

export function romanTier(tier: number): string {
  return ROMAN[tier] ?? String(tier);
}
