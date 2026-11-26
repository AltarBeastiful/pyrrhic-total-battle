import type { BonusesFold } from './uiPrefs';

/**
 * The families on screen, in the order a player touches them on an ordinary day: who rides, what
 * they wear, what the account always has, what else counts, what is running, the temple. The two
 * set once come after, folded (`FOLDED`).
 */
export const ORDER = ['captains', 'equipment', 'permanent', 'other', 'events', 'recovery'] as const;
export const FOLDED = ['artifacts', 'titles'] as const satisfies readonly BonusesFold[];

export type Family = (typeof ORDER)[number];
export type Folded = (typeof FOLDED)[number];

/**
 * What a page shows of the body. The calculator shows everything; a page whose fight counts fewer sources
 * names the ones it does (the Prime Arena has no hero, no march type, no titles, events or temple).
 */
export interface BodyScope {
  /** The families on screen, in the body's own order. */
  families: readonly Family[];
  /** The folds at the foot. */
  folded: readonly Folded[];
  /** The hero's chip at the head of the captains. */
  hero: boolean;
  /** The march-type control under the captains, when a restricted captain rides. */
  marchType: boolean;
  /** The caveats and the Summary fold, which read every source the account holds. */
  audit: boolean;
}

export const FULL_SCOPE: BodyScope = {
  families: ORDER,
  folded: FOLDED,
  hero: true,
  marchType: true,
  audit: true,
};
