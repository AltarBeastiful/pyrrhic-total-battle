/**
 * Getting to the result. On one column the march is below the setup, so generating brings it into
 * view; when the player asked for no motion nothing moves on its own and the March section offers a
 * link instead (design plan §9). The frame owns this because it owns where the march is.
 */
import { mediaMatches, ONE_COLUMN, REDUCED_MOTION } from './useMediaQuery';

/** The anchor of the March section (the registry id) — what the page scrolls to after a run. */
export const MARCH_ANCHOR = 'march';

/** Bring the march into view; `false` when the frame deliberately left the page where it was. */
export function scrollToMarch(): boolean {
  if (!mediaMatches(ONE_COLUMN) || mediaMatches(REDUCED_MOTION)) return false;
  const march = globalThis.document.getElementById(MARCH_ANCHOR);
  if (march === null) return false;
  march.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}
