/**
 * The arithmetic behind `TierSelect`, in a module of its own so the component file exports nothing
 * but a component (which is what keeps fast refresh honest).
 */

/** The one-letter prefix a tier of a group is written with. */
export type TierPrefix = 'G' | 'S' | 'E' | 'M';

/** The value one end of a range may actually hold, given the other end. */
export function clampTier(value: number | null, min?: number, max?: number): number | null {
  if (value === null) return null;
  if (min !== undefined && value < min) return min;
  if (max !== undefined && value > max) return max;
  return value;
}
