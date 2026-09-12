/** Small helpers shared by the free-form editors (permanent sources, dragon, custom sources). */
import type { BonusMap, SpecialMap } from '@/data/types';

import type { BonusValues } from './BonusKeyGrid';

export interface BonusHolder {
  health: BonusMap;
  strength: BonusMap;
  special?: SpecialMap | undefined;
}

/**
 * Writes what the 13-key grid produced back onto a stored entry. `special` is spread conditionally
 * because the config schema marks it optional and the project compiles with `exactOptionalPropertyTypes`.
 */
export function applyBonusValues<T extends BonusHolder>(entry: T, next: BonusValues): T {
  return {
    ...entry,
    health: next.health,
    strength: next.strength,
    ...(next.special === undefined ? {} : { special: next.special }),
  };
}

/** The grid's view of a stored entry. */
export function readBonusValues(entry: BonusHolder): BonusValues {
  return {
    health: entry.health,
    strength: entry.strength,
    ...(entry.special === undefined ? {} : { special: entry.special }),
  };
}
