/**
 * Getting to the result. On one column the march is below the setup, so generating brings it into
 * view; when the player asked for no motion nothing moves on its own and `MarchStatus` shows a
 * "Go to march" link instead (design plan §9).
 */
import { mediaMatches, ONE_COLUMN, REDUCED_MOTION } from './useMediaQuery';

/** The anchor of the Results section — what the page scrolls to after a run. */
export const MARCH_ANCHOR = 'results';

/** Bring the march into view; `false` when the frame deliberately left the page where it was. */
export function scrollToMarch(): boolean {
  if (!mediaMatches(ONE_COLUMN) || mediaMatches(REDUCED_MOTION)) return false;
  const march = globalThis.document.getElementById(MARCH_ANCHOR);
  if (march === null) return false;
  march.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return true;
}
