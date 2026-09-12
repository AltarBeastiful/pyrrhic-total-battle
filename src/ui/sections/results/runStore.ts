/**
 * View-only state of one "Generate" run: search progress, the running job's abort handle, the two lists
 * the Results section needs to explain what is missing from the formation (types the priority search left
 * out, mercenaries the user removed by hand), and what the search gave up to win.
 *
 * It is deliberately outside `useResultStore` (which holds the *result* and is read by the share
 * dialog): a progress tick must not invalidate anything that looks at the last result.
 */
import { create } from 'zustand';

import type { BattleSummary, Objective, SearchProgress } from '@/engine/types';

/** A mercenary taken out of the formation, kept with its owned cap so "Restore" can put it back. */
export interface RemovedMercenary {
  id: string;
  cap: number | null;
}

/** The handful of figures the trade-off table compares; everything else in a summary is noise there. */
export interface TradeoffFigures {
  /** Hits your army lands before it is wiped out, the monster striking first. */
  friendlyHits: number;
  minDamage: number;
  maxDamage: number;
  avgDamage: number;
  silver: number;
  gold: number;
  dragonCoins: number;
}

/**
 * What a priority search traded away: its winning selection against the army you would have marched
 * with every unit type (`SearchResult.baseline`). Kept for the run, not for the document — it explains
 * the result on screen and nothing else.
 */
export interface SearchTradeoff {
  objective: Objective;
  includedUnitIds: string[];
  /** Types the search left out of the winner, in request order. */
  excludedUnitIds: string[];
  selection: TradeoffFigures;
  baseline: TradeoffFigures;
}

/** The seven figures of a summary the trade-off table reads. */
export function tradeoffFigures(summary: BattleSummary): TradeoffFigures {
  return {
    friendlyHits: summary.journals.enemyFirst.friendlyHits,
    minDamage: summary.minDamage,
    maxDamage: summary.maxDamage,
    avgDamage: summary.avgDamage,
    silver: summary.recovery.silver,
    gold: summary.recovery.gold,
    dragonCoins: summary.recovery.dragonCoins,
  };
}

export interface RunState {
  /** Last progress tick of a priority search; `null` outside a search. */
  progress: SearchProgress | null;
  /** Unit types the priority search left out of the winning formation. */
  searchExcluded: string[];
  /** The winner against the all-types army; `null` when the result did not come from a priority. */
  tradeoff: SearchTradeoff | null;
  removedMercenaries: RemovedMercenary[];
  /** Abort handle of the job in flight, so the Cancel button can stop it. */
  controller: AbortController | null;
  start: (controller: AbortController) => void;
  setProgress: (progress: SearchProgress) => void;
  finish: (searchExcluded: string[], tradeoff?: SearchTradeoff | null) => void;
  cancel: () => void;
  rememberMercenary: (mercenary: RemovedMercenary) => void;
  forgetMercenary: (id: string) => void;
  reset: () => void;
}

export const useRunStore = create<RunState>()((set, get) => ({
  progress: null,
  searchExcluded: [],
  tradeoff: null,
  removedMercenaries: [],
  controller: null,
  start: (controller) => {
    set({ controller, progress: null, searchExcluded: [], tradeoff: null });
  },
  setProgress: (progress) => {
    set({ progress });
  },
  finish: (searchExcluded, tradeoff = null) => {
    set({ controller: null, progress: null, searchExcluded, tradeoff });
  },
  cancel: () => {
    get().controller?.abort();
    set({ controller: null, progress: null });
  },
  rememberMercenary: (mercenary) => {
    set((state) =>
      state.removedMercenaries.some((entry) => entry.id === mercenary.id)
        ? state
        : { removedMercenaries: [...state.removedMercenaries, mercenary] },
    );
  },
  forgetMercenary: (id) => {
    set((state) => ({ removedMercenaries: state.removedMercenaries.filter((entry) => entry.id !== id) }));
  },
  reset: () => {
    set({
      progress: null,
      searchExcluded: [],
      tradeoff: null,
      removedMercenaries: [],
      controller: null,
    });
  },
}));
