/**
 * The arithmetic behind `TierSelect`, in a module of its own so the component file exports nothing
 * but a component (which is what keeps fast refresh honest).
 */

/** The one-letter prefix a tier of a group is written with. */
export type TierPrefix = 'G' | 'S' | 'E' | 'M';

/**
 * The ink a tier is written in: the nine troop and mercenary tiers have a colour each (design plan
 * §5.5, direction A) — grey I, green II, blue III, violet IV, then the five the game gives its own
 * metals and stones. A tier ink is the scheme's *filled* shade — 7 on a light page, 5 on a dark one —
 * which is the pair `pnpm contrast` checks against every surface, the stepper's sunken well included;
 * Mantine's `-text` is shade 4 in the dark and would read a step paler than the artboards.
 *
 * It lives in the kit because the stepper writes its value in it, and the domain (`TierBadge`, the
 * march pills, the mercenary picker's headings) reads the same function through `unitGroup.ts`, so
 * "G3" on the Troops card and "III" on a pill are one ink. Tier 0 is a hand-typed mercenary with no
 * tier at all, and anything outside 1–9 gets the muted ink and no hue.
 */
export function tierInk(tier: number): string {
  if (!Number.isFinite(tier) || tier < 1 || tier > 9) return 'var(--mantine-color-dimmed)';
  return `var(--mantine-color-tier${String(Math.round(tier))}-filled)`;
}

/** The value one end of a range may actually hold, given the other end. */
export function clampTier(value: number | null, min?: number, max?: number): number | null {
  if (value === null) return null;
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}
