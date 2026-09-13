/**
 * The tier a unit belongs to, written the way the game writes it: a roman numeral in that tier's own
 * colour (design plan §7.2). Players know a mercenary by its name and its tier, so the tier travels
 * with the name everywhere it appears.
 *
 * A second, smaller colour system beside the group hues, and allowed nowhere else: the tile keeps
 * the group's red, this badge says which tier. Text only — no glyph — because a roman numeral is
 * already the most legible thing on a 32 px tile. The ground is Mantine's `light` variant and the
 * ink its `-text` variable, so both follow the scheme; a tier the tables carry no colour for falls
 * back to one tonal step and no hue.
 */
import { Badge } from '@mantine/core';

import { romanTier } from './unitGroup';

const COLOURED = new Set([5, 6, 7, 8, 9]);

export interface TierBadgeProps {
  /** 5–9 in the tables today; anything else is drawn without a colour. */
  tier: number;
  size?: 'xs' | 'sm' | 'md';
}

export function TierBadge({ tier, size = 'xs' }: TierBadgeProps) {
  const coloured = COLOURED.has(tier);
  return (
    <Badge
      size={size}
      radius="sm"
      variant="light"
      color={coloured ? `tier${tier}` : 'slate'}
      c={coloured ? `var(--mantine-color-tier${tier}-text)` : 'dimmed'}
      ff="var(--pyr-font-numeral)"
      aria-label={`tier ${tier}`}
    >
      {romanTier(tier) || String(tier)}
    </Badge>
  );
}
