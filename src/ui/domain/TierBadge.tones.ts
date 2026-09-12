/**
 * The colour of each tier, as class names (design plan §7.2). A `tv()` variant map lives beside its
 * component the way `unitGroup.ts` lives beside `UnitTile`: written out literally, one entry per
 * tier, so Tailwind's scanner sees every utility it has to generate, and in a module of its own so
 * `TierBadge.tsx` exports nothing but a component.
 *
 * The values are in `src/index.css` (`--color-tier-5 … --color-tier-9`) and `pnpm contrast` proves
 * each of them readable as ink on the surfaces a badge is drawn on, and on its own 12 % ground.
 */

/** The ink of each tier, on its own faint ground: the badge. */
export const TIER_TONE: Record<number, string> = {
  5: 'bg-tier-5/12 text-tier-5',
  6: 'bg-tier-6/12 text-tier-6',
  7: 'bg-tier-7/12 text-tier-7',
  8: 'bg-tier-8/12 text-tier-8',
  9: 'bg-tier-9/12 text-tier-9',
};

/** The same inks with no ground: the heading over a group of a picker. */
export const TIER_INK: Record<number, string> = {
  5: 'text-tier-5',
  6: 'text-tier-6',
  7: 'text-tier-7',
  8: 'text-tier-8',
  9: 'text-tier-9',
};

/** A tier the tables carry no colour for (a hand-typed unit): one tonal step, no hue. */
export const TIER_NEUTRAL = 'bg-raised text-muted';
