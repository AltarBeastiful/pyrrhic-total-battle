/**
 * The tier a unit belongs to, written the way the game writes it: a roman numeral in that tier's own
 * colour on a wash of the same ink (design plan §7.2). Players know a mercenary by its name and its
 * tier, so the tier travels with the name everywhere it appears.
 *
 * **Inter at 11/700, not Fraunces** (the owner's review of 2026-09-13: "the V number of the
 * mercenary is not easily readable"). Fraunces' display cut draws `V` as two hairlines meeting, and
 * at 13 px on a 32 px pill that is a backslash, not a numeral — `VI` read as `\I`. A roman numeral
 * inside a badge is not typography, it is a label: it needs one stroke weight, tight tracking and
 * no optical size doing anything clever. Fraunces keeps the places it still spells rather than
 * counts — the roman on a full unit tile, where it is 21 px and the whole point of the tile.
 *
 * A second, smaller colour system beside the group hues, and allowed nowhere else: the tile keeps
 * the group's red, this badge says which tier. Text only — no glyph. The ground is a tint of the
 * badge's own ink and the ink is the scheme's filled shade, both checked by `pnpm contrast`; a tier
 * the tables carry no colour for falls back to one tonal step and no hue.
 */
import { Badge } from '@mantine/core';

import classes from './domain.module.css';
import { romanTier, tierInk } from './unitGroup';

/** Every tier the palette carries an ink for (design plan §5.5): I–IV as well as V–IX now. */
const COLOURED = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);

export interface TierBadgeProps {
  /** 5–9 in the tables today; anything else is drawn without a colour. */
  tier: number;
  size?: 'xs' | 'sm' | 'md';
}

/**
 * The three sizes, as inline variables rather than as a class. `theme.components.Badge.vars` writes
 * Mantine's own three on the element's `style`, and an inline value beats any class — which is how
 * a badge asking for 11 px in a stylesheet shipped at 13 px in a 14 px box with its numeral clipped
 * to nothing. `style` on the instance is merged after the theme's vars, so this is the one way in.
 */
const SIZES = {
  xs: { '--badge-fz': '0.6875rem', '--badge-height': '1rem', '--badge-padding-x': '0.25rem' },
  sm: { '--badge-fz': '0.75rem', '--badge-height': '1.125rem', '--badge-padding-x': '0.3125rem' },
  md: { '--badge-fz': '0.8125rem', '--badge-height': '1.25rem', '--badge-padding-x': '0.375rem' },
} as const;

export function TierBadge({ tier, size = 'xs' }: TierBadgeProps) {
  const coloured = COLOURED.has(tier);
  return (
    <Badge
      // A `span`, because a tier travels inside things that are already buttons — a mercenary pill's
      // face, a picker's row — and a `div` inside a `<button>` is not HTML. `role="img"` with it,
      // because a roman numeral in a coloured box *is* a picture of a tier: without a role the name
      // is prohibited on a generic element, the `aria-label` is dropped, and a screen reader is left
      // reading the letter "V" beside a mercenary already called "Bear V".
      component="span"
      role="img"
      radius="xs"
      variant="light"
      className={classes.tierBadge}
      style={SIZES[size]}
      color={coloured ? `tier${tier}` : 'slate'}
      c={coloured ? tierInk(tier) : 'dimmed'}
      aria-label={`tier ${tier}`}
    >
      {romanTier(tier) || String(tier)}
    </Badge>
  );
}
