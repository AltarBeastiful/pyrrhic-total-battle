/**
 * The tier a unit belongs to, written the way the game writes it: a roman numeral in that tier's
 * own colour (design plan §7.2, amended 2026-09-13). Players know a mercenary by its name and its
 * tier, so the tier is the one fact that travels with the name everywhere it appears — the owned
 * row, the picker row, the heading over a group of the picker.
 *
 * The colour is the game's tier palette, made readable on our surfaces (`docs/design.md` §1, tokens
 * `--color-tier-5 … --color-tier-9`, checked by `pnpm contrast`). It is a *second* colour system
 * beside the group colours and is allowed nowhere else: a tile keeps the group's red, this chip
 * carries the tier. Colour is never the only signal — the numeral says the same thing, and the
 * accessible name spells it out ("tier 6").
 */
import { tv } from 'tailwind-variants';

import { cn } from '../kit/cn';
import { TIER_NEUTRAL, TIER_TONE } from './TierBadge.tones';
import { romanTier } from './unitGroup';

const badge = tv({
  base: 'numeral-face rounded-chip inline-flex shrink-0 items-center justify-center px-1.5 py-0.5 text-xs leading-none',
});

export interface TierBadgeProps {
  /** 5–9 in the tables today; anything else is drawn without a colour. */
  tier: number;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  return (
    <span className={cn(badge(), TIER_TONE[tier] ?? TIER_NEUTRAL, className)}>
      <span aria-hidden="true">{romanTier(tier) || String(tier)}</span>
      <span className="sr-only">{`tier ${tier}`}</span>
    </span>
  );
}
