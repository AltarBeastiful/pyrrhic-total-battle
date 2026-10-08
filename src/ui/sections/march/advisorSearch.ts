/**
 * **The "What to upgrade next" card's state** (W17 C4, `docs/plans/advisor-card.md` §4): the advisor's pass
 * (`runAdvisor`, `src/worker/advisor.ts`) asked for on a button, never on Generate, over a pool of its own.
 *
 * `positionsSearch.ts`'s shape — a store holding the answer, the worker and the `AbortController` as module
 * state, a key that is the plan's identity, answers dropped when their key is no longer on screen — with three
 * things its own:
 *
 *  - **on demand only**: the hook never starts a pass; `compute()` does, from the card's button (owner §7.5).
 *  - **six states, not three**: idle, running, done, cut (the pass's 20 s clock stopped some probes), cancelled
 *    (the Cancel button) and failed (the baseline itself failed, nothing can be read).
 *  - **the key carries the account**, by value: the pass plans its own baseline from the profile and the setup
 *    (`buildPlanRequest`), so an edit under a standing plan is a different question and the rows go.
 *
 * A new Generate sets the plan to `null` (`useRunStore.start`), and a profile switch changes the account: either
 * way the key moves, the hook stops the pass through its signal and forgets the rows. Generate never waits on
 * the card, whose pool shares nothing with `getCalcClient()`.
 *
 * **The headline stop is not stored**: it is the stop selected on the bar (`pickOf(plan, planPick).pick`), read
 * at render, so a move of the bar re-ranks the same rows (`rankAdvice`) without a new pass.
 */
import { useCallback, useEffect, useMemo } from 'react';
import { create } from 'zustand';

import { rankAdvice, type AdvisorRow } from '@/engine/advisor';
import type { CampaignInput, CampaignPlan, PlanPick } from '@/engine/plan';
import { genericProbes } from '@/engine/probes';
import { buildPlanRequest } from '@/state/derive';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { runAdvisor, type AdvisorResult } from '@/worker/advisor';
import { isAbortError } from '@/worker/client';
import { createCalcPool, type CalcPool } from '@/worker/pool';

import { planId } from './positionsSearch';
import { pickOf, useRunStore } from './runStore';

export type AdvisorStatus = 'idle' | 'running' | 'done' | 'cut' | 'cancelled' | 'failed';

export interface AdvisorEntry {
  /** `advisorKey` of the plan and the account the pass was read for. */
  key: string;
  status: Exclude<AdvisorStatus, 'idle'>;
  /** Jobs settled and jobs in the pass (the baseline and every probe), from `onProgress`. */
  done: number;
  total: number;
  /** `runAdvisor`'s answer, kept whole; the ranking per stop is derived, not stored. */
  result: AdvisorResult | null;
  /** Why the pass failed, in one line, when it did. */
  error: string | null;
}

export interface AdvisorState {
  entry: AdvisorEntry | null;
  /** A pass has started for `key`: running, nothing done, any older answer forgotten. */
  begin: (key: string, total: number) => void;
  progress: (key: string, done: number, total: number) => void;
  /** `cut` when the clock stopped a probe (or the baseline), `done` otherwise. */
  settle: (key: string, result: AdvisorResult) => void;
  fail: (key: string, message: string) => void;
  /** The Cancel button: abort the pass and say so; the progress stays, the rows were never read. */
  cancel: () => void;
  /** Abort and forget: a new plan, another account. */
  stop: () => void;
}

/**
 * **The identity of one pass's question** — the plan on screen and the account the baseline is planned from.
 * The input goes by value: a profile edit under a standing plan is another account and the rows are stale.
 */
export function advisorKey(plan: CampaignPlan, input: CampaignInput): string {
  return `${String(planId(plan))}|${JSON.stringify(input)}`;
}

/** Module state, not store state: a pool and an `AbortController` are nothing a component re-renders on. */
let pool: CalcPool | null = null;
let controller: AbortController | null = null;

function abort(): void {
  controller?.abort();
  controller = null;
}

/** For tests: the pool the passes run on. Disposes the one before it. */
export function setAdvisorPool(next: CalcPool | null): void {
  abort();
  pool?.dispose();
  pool = next;
}

/**
 * **A pass is offered only off the main thread.** The pool falls back to one inline client when the platform
 * has no `Worker`, and 30 whole plans on the page's own thread is a frozen page; the card says why instead.
 */
export function canAdvise(): boolean {
  return pool !== null || typeof Worker !== 'undefined';
}

export const useAdvisorStore = create<AdvisorState>()((set, get) => {
  /** Only the pass on screen may write, and only while it runs: a late answer for an old key is dropped. */
  const running = (key: string): AdvisorEntry | null => {
    const entry = get().entry;
    return entry !== null && entry.key === key && entry.status === 'running' ? entry : null;
  };
  return {
    entry: null,
    begin: (key, total) => {
      set({ entry: { key, status: 'running', done: 0, total, result: null, error: null } });
    },
    progress: (key, done, total) => {
      const entry = running(key);
      if (entry !== null) set({ entry: { ...entry, done, total } });
    },
    settle: (key, result) => {
      const entry = running(key);
      if (entry === null) return;
      const cut = result.baseline === null || result.cut.length > 0;
      set({ entry: { ...entry, status: cut ? 'cut' : 'done', result } });
    },
    fail: (key, message) => {
      const entry = running(key);
      if (entry !== null) set({ entry: { ...entry, status: 'failed', error: message } });
    },
    cancel: () => {
      abort();
      const entry = get().entry;
      if (entry?.status === 'running') set({ entry: { ...entry, status: 'cancelled' } });
    },
    stop: () => {
      abort();
      set({ entry: null });
    },
  };
});

/**
 * Start a pass for `key`: the baseline and every generic probe, ranked on `headline`. Any pass already out is
 * aborted first — one pass at a time, the latest question wins.
 */
export async function computeAdvice(key: string, input: CampaignInput, headline?: PlanPick): Promise<void> {
  abort();
  const own = new AbortController();
  controller = own;
  const probes = genericProbes();
  const store = useAdvisorStore.getState();
  store.begin(key, probes.length + 1);
  pool ??= createCalcPool();
  try {
    const result = await runAdvisor(input, probes, pool, {
      signal: own.signal,
      headline,
      onProgress: (done, total) => {
        useAdvisorStore.getState().progress(key, done, total);
      },
    });
    useAdvisorStore.getState().settle(key, result);
  } catch (error) {
    // A cancel or a stop has already said what happened to this pass.
    if (isAbortError(error)) return;
    useAdvisorStore.getState().fail(key, error instanceof Error ? error.message : String(error));
  } finally {
    if (controller === own) controller = null;
  }
}

/** What the card draws from. */
export interface AdvisorView {
  status: AdvisorStatus;
  done: number;
  total: number;
  /** The stop the rows are headlined on: the one selected on the bar. */
  headline: PlanPick | null;
  /** The probes read, ranked on `headline`. */
  rows: AdvisorRow[];
  result: AdvisorResult | null;
  error: string | null;
  /** A plan is on screen and the platform can run the pass off the main thread. */
  available: boolean;
  compute: () => void;
  cancel: () => void;
}

/**
 * **The card's hook.** It never starts a pass on its own; it stops one whose plan or account is no longer on
 * screen (a Generate, a profile switch, an edit), and hands back the rows of the one that is, ranked on the
 * stop the bar is showing.
 */
export function useAdvisor(): AdvisorView {
  const plan = useRunStore((state) => state.plan);
  const position = useRunStore((state) => state.planPick);
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const input = useMemo(
    () => (profile !== undefined && setup !== undefined ? buildPlanRequest(profile, setup) : null),
    [profile, setup],
  );
  const key = useMemo(
    () => (plan !== null && input !== null ? advisorKey(plan, input) : null),
    [plan, input],
  );
  const headline = plan === null ? null : pickOf(plan, position).pick;
  const stored = useAdvisorStore((state) => state.entry);
  const entry = stored !== null && stored.key === key ? stored : null;

  useEffect(() => {
    const current = useAdvisorStore.getState().entry;
    if (current !== null && current.key !== key) useAdvisorStore.getState().stop();
  }, [key]);

  const answer = entry?.result ?? null;
  const rows = useMemo(
    () => (answer === null ? [] : rankAdvice(answer.rows, headline ?? undefined)),
    [answer, headline],
  );
  const compute = useCallback(() => {
    if (key === null || input === null) return;
    void computeAdvice(key, input, headline ?? undefined);
  }, [key, input, headline]);
  const cancel = useCallback(() => {
    useAdvisorStore.getState().cancel();
  }, []);

  return {
    status: entry?.status ?? 'idle',
    done: entry?.done ?? 0,
    total: entry?.total ?? 0,
    headline,
    rows,
    result: answer,
    error: entry?.error ?? null,
    available: key !== null && canAdvise(),
    compute,
    cancel,
  };
}
