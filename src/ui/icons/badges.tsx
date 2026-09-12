/**
 * Composite marks built out of the glyphs: the small coloured chip that stands for a unit type, and
 * the one that stands for a housing pool.
 *
 * Both are decorative by default — they sit next to a name the player can already read ("ARC1 624"),
 * so repeating it to a screen reader would only be noise. Pass `title` when the badge stands alone.
 */
import type { ComponentType } from 'react';

import { cn } from '../primitives/cn';
import type { IconProps } from './Icon';
import {
  AuthorityIcon,
  DominanceIcon,
  EngineersIcon,
  FlyingIcon,
  GuardsmenIcon,
  LeadershipIcon,
  MeleeIcon,
  MonstersIcon,
  MountedIcon,
  RangedIcon,
  SpecialistsIcon,
} from './units';

/** The four unit categories of `src/data/types.ts`. */
export type BadgeCategory = 'melee' | 'ranged' | 'mounted' | 'flying';
/** The four unit groups of `src/data/types.ts`. */
export type BadgeGroup = 'guardsmen' | 'specialist' | 'engineers' | 'monster';
/** The three housing pools of `src/engine/types.ts`. */
export type BadgePool = 'leadership' | 'authority' | 'dominance';

export type BadgeSize = 'sm' | 'md';

const CATEGORY_GLYPH: Record<BadgeCategory, ComponentType<IconProps>> = {
  melee: MeleeIcon,
  ranged: RangedIcon,
  mounted: MountedIcon,
  flying: FlyingIcon,
};

const GROUP_GLYPH: Record<BadgeGroup, ComponentType<IconProps>> = {
  guardsmen: GuardsmenIcon,
  specialist: SpecialistsIcon,
  engineers: EngineersIcon,
  monster: MonstersIcon,
};

/** One hue per group. Written out in full so Tailwind sees every class it has to generate. */
const GROUP_TONE: Record<BadgeGroup, string> = {
  guardsmen: 'text-group-guardsmen border-group-guardsmen',
  specialist: 'text-group-specialist border-group-specialist',
  engineers: 'text-group-engineers border-group-engineers',
  monster: 'text-group-monster border-group-monster',
};

const POOL_GLYPH: Record<BadgePool, ComponentType<IconProps>> = {
  leadership: LeadershipIcon,
  authority: AuthorityIcon,
  dominance: DominanceIcon,
};

const POOL_TONE: Record<BadgePool, string> = {
  leadership: 'text-group-guardsmen border-group-guardsmen',
  authority: 'text-accent border-accent',
  dominance: 'text-group-monster border-group-monster',
};

const SIZES: Record<BadgeSize, string> = {
  sm: 'gap-0.5 px-1 py-px text-[0.625rem]',
  md: 'gap-1 px-1.5 py-0.5 text-xs',
};

const GLYPH_SIZE: Record<BadgeSize, string> = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
};

export interface UnitBadgeProps {
  /** Decides the ring colour; engineers and monsters also decide the glyph. */
  group: BadgeGroup;
  /** Decides the glyph. Engineers have no category, so the group glyph stands in. */
  category?: BadgeCategory;
  /** Shown as a numeral beside the glyph. Leave out for a badge that only says "what kind". */
  tier?: number;
  size?: BadgeSize;
  /** Accessible name; without it the badge is decorative. */
  title?: string;
  className?: string;
}

/**
 * A unit type at a glance: its category glyph, its tier, and its group's colour on the ring.
 * Colour is never the only signal — the glyph and the numeral carry the same information.
 */
export function UnitBadge({ group, category, tier, size = 'md', title, className }: UnitBadgeProps) {
  const Glyph = category === undefined ? GROUP_GLYPH[group] : CATEGORY_GLYPH[category];
  const labelled =
    title === undefined
      ? ({ 'aria-hidden': true } as const)
      : ({ role: 'img', 'aria-label': title } as const);

  return (
    <span
      {...labelled}
      className={cn(
        'bg-surface inline-flex shrink-0 items-center rounded-md border font-semibold',
        GROUP_TONE[group],
        SIZES[size],
        className,
      )}
    >
      <Glyph className={GLYPH_SIZE[size]} />
      {tier !== undefined && <span className="nums leading-none">{tier}</span>}
    </span>
  );
}

export interface PoolBadgeProps {
  pool: BadgePool;
  /** Written beside the glyph; leave it out for the glyph alone. */
  label?: string;
  size?: BadgeSize;
  /** Accessible name; without it the badge is decorative. */
  title?: string;
  className?: string;
}

/** A housing pool at a glance: banner for leadership, coin for authority, crown for dominance. */
export function PoolBadge({ pool, label, size = 'md', title, className }: PoolBadgeProps) {
  const Glyph = POOL_GLYPH[pool];
  const labelled =
    title === undefined
      ? ({ 'aria-hidden': true } as const)
      : ({ role: 'img', 'aria-label': title } as const);

  return (
    <span
      {...labelled}
      className={cn(
        'bg-surface inline-flex shrink-0 items-center rounded-md border font-semibold',
        POOL_TONE[pool],
        SIZES[size],
        className,
      )}
    >
      <Glyph className={GLYPH_SIZE[size]} />
      {label !== undefined && <span>{label}</span>}
    </span>
  );
}
