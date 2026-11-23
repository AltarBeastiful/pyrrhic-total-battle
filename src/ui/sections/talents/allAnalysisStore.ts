/**
 * **Analyze all's state** (B-28): one run, held outside the card so that it can outlive it (B-29 keeps, marks
 * stale and selects rows from here). The key is the question (`allTalentsKey`); the entries are the finished
 * ranking and are null until a run completes, so a cancelled or failed run never leaves a partial ranking; the
 * ranking kept from before a re-run stays in `kept` and comes back when the re-run is cancelled or fails. One
 * run at a time: starting another, or `cancelAll`, aborts the one out.
 */
import { create } from 'zustand';

import { RANKING_PLANS, type RankingMethod } from '@/engine/talentAnalysis';
import { heldRank } from '@/engine/talentCopy';
import { CAMPAIGN } from '@/config';
import type { BattleSetup, Profile } from '@/state/schema';
import { allTalentsInputs, allTalentsKey } from '@/state/talentAnalysis';
import { combineAnalyses, type RankingEntry } from '@/state/talentRanking';
import { isAbortError } from '@/worker/client';
import { runAllTalentsAnalysis } from '@/worker/talentAnalysis';

import { advisorPool } from '../march/advisorSearch';

/** A finished ranking, kept while a later run is out so that cancelling or failing it loses nothing. */
export interface KeptRanking {
  key: string;
  entries: RankingEntry[];
  notRated: number;
}

export interface AllRun {
  key: string;
  status: 'running' | 'done' | 'failed' | 'cancelled';
  done: number;
  total: number;
  /** The finished ranking; null until the run completes. */
  entries: RankingEntry[] | null;
  /** How many talents the rating cannot read. */
  notRated: number;
  error: string | null;
  /** The last finished ranking before this run began; null when there was none. */
  kept: KeptRanking | null;
}

/** The ranking a run stands on: its own once done, else the one it kept. Never partial. */
export function rankingOf(run: AllRun | null): KeptRanking | null {
  if (run === null) return null;
  if (run.entries !== null) return { key: run.key, entries: run.entries, notRated: run.notRated };
  return run.kept;
}

interface AllState {
  run: AllRun | null;
  set: (run: AllRun | null) => void;
  /** How the list is read (experiment 365); a choice of the dialog, kept while the page is open. */
  method: RankingMethod;
  setMethod: (method: RankingMethod) => void;
}

export const useAllAnalysisStore = create<AllState>()((set) => ({
  run: null,
  method: CAMPAIGN.talentRanking,
  setMethod: (method) => {
    set({ method });
  },
  set: (run) => {
    set({ run });
  },
}));

let controller: AbortController | null = null;

/** Stop the run that is out, if any. */
export function cancelAll(): void {
  controller?.abort();
  controller = null;
  const { run, set } = useAllAnalysisStore.getState();
  if (run?.status === 'running') set({ ...run, status: 'cancelled', entries: null });
}

/** Rank every talent the rating can read on the march `setup` selects. A run already out is cancelled first. */
export async function analyzeAll(
  profile: Profile,
  setup: BattleSetup,
  method: RankingMethod = useAllAnalysisStore.getState().method,
): Promise<void> {
  cancelAll();
  const { jobs, notRated } = allTalentsInputs(profile, setup, undefined, undefined, method);
  const key = allTalentsKey(profile, setup, undefined, undefined, method);
  const own = new AbortController();
  controller = own;
  const { set, run: before } = useAllAnalysisStore.getState();
  const kept = rankingOf(before);
  set({ key, status: 'running', done: 0, total: 0, entries: null, notRated, error: null, kept });
  const live = (): AllRun | null => {
    const run = useAllAnalysisStore.getState().run;
    return run !== null && run.key === key && run.status === 'running' && controller === own ? run : null;
  };
  try {
    const analyses = await runAllTalentsAnalysis(
      jobs.flatMap((job) => job.inputs),
      advisorPool(),
      {
        signal: own.signal,
        onProgress: (done, total) => {
          const run = live();
          if (run !== null) set({ ...run, done, total });
        },
      },
    );
    const run = live();
    if (run !== null) {
      let at = 0;
      const entries = jobs.map((job): RankingEntry => {
        const own = analyses.slice(at, at + job.inputs.length);
        at += job.inputs.length;
        if (own.length !== job.inputs.length) throw new Error('The analysis was cut short.');
        return {
          node: job.node,
          held: heldRank(job.node, profile.talents.ranks),
          analysis: combineAnalyses(own),
          score: RANKING_PLANS[method].score,
        };
      });
      set({ ...run, status: 'done', entries });
    }
  } catch (error) {
    if (isAbortError(error)) return;
    const run = live();
    if (run !== null) {
      set({ ...run, status: 'failed', error: error instanceof Error ? error.message : String(error) });
    }
  } finally {
    if (controller === own) controller = null;
  }
}
