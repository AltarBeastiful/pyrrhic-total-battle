/**
 * View-only state of one "Generate" run: search progress, the running job's abort handle, and the two
 * lists the Results section needs to explain what is missing from the formation (types the priority
 * search left out, mercenaries the user removed by hand).
 *
 * It is deliberately outside `useResultStore` (which holds the *result* and is read by the share
 * dialog): a progress tick must not invalidate anything that looks at the last result.
 */
import { create } from 'zustand';

import type { SearchProgress } from '@/engine/types';

/** A mercenary taken out of the formation, kept with its owned cap so "Restore" can put it back. */
export interface RemovedMercenary {
  id: string;
  cap: number | null;
}

export interface RunState {
  /** Last progress tick of a priority search; `null` outside a search. */
  progress: SearchProgress | null;
  /** Unit types the priority search left out of the winning formation. */
  searchExcluded: string[];
  removedMercenaries: RemovedMercenary[];
  /** Abort handle of the job in flight, so the Cancel button can stop it. */
  controller: AbortController | null;
  start: (controller: AbortController) => void;
  setProgress: (progress: SearchProgress) => void;
  finish: (searchExcluded: string[]) => void;
  cancel: () => void;
  rememberMercenary: (mercenary: RemovedMercenary) => void;
  forgetMercenary: (id: string) => void;
  reset: () => void;
}

export const useRunStore = create<RunState>()((set, get) => ({
  progress: null,
  searchExcluded: [],
  removedMercenaries: [],
  controller: null,
  start: (controller) => {
    set({ controller, progress: null, searchExcluded: [] });
  },
  setProgress: (progress) => {
    set({ progress });
  },
  finish: (searchExcluded) => {
    set({ controller: null, progress: null, searchExcluded });
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
    set({ progress: null, searchExcluded: [], removedMercenaries: [], controller: null });
  },
}));
