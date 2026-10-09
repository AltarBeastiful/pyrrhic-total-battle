/**
 * **The "What to upgrade next" card's state** (W17 C4, `docs/plans/advisor-card.md` §4): the advisor's pass
 * (`runAdvisor`, `src/worker/advisor.ts`) asked for on a button, never on Generate, over a pool of its own.
 *
 * `positionsSearch.ts`'s shape — a store holding the answer, the worker and the `AbortController` as module
 * state, a key that is the plan's identity, answers dropped when their key is no longer on screen — with three
 * things its own:
 *
 *  - **on demand only**: the hook never starts a pass; `compute()` does, from the card's button (owner §7.5).
 *  - **two passes, not one** (owner, 2026-10-08): "my upgrades" (the typed list) and "default upgrades" (the
 *    generic probes at their default increase) are two independent entries, each with its own button, key,
 *    progress, `AbortController` and answer. They share the one pool, which queues their jobs.
 *  - **six states, not three**: idle, running, done, cut (the pass's 20 s clock stopped some probes), cancelled
 *    (the Cancel button) and failed (the baseline itself failed, nothing can be read).
 *  - **the key carries the account**, by value: the pass plans its own baseline from the profile and the setup
 *    (`buildPlanRequest`), so an edit under a standing plan is a different question and the rows go. Only the
 *    key of `mine` also carries the typed list: typing, editing or deleting an upgrade stales `mine` alone.
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
import { genericProbes, userProbe, type Probe, type UserUpgradeEntry } from '@/engine/probes';
import { buildPlanRequest } from '@/state/derive';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { runAdvisor, type AdvisorResult } from '@/worker/advisor';
import { isAbortError } from '@/worker/client';
import { createCalcPool, type CalcPool } from '@/worker/pool';

import { planId } from './positionsSearch';
import { pickOf, useRunStore } from './runStore';

/** Which pass: the player's typed upgrades, or the generic probes at their default increase. */
export type AdvisorKind = 'mine' | 'default';

export const ADVISOR_KINDS: readonly AdvisorKind[] = ['mine', 'default'];

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
  entries: Record<AdvisorKind, AdvisorEntry | null>;
  /** A pass has started for `key`: running, nothing done, any older answer forgotten. */
  begin: (kind: AdvisorKind, key: string, total: number) => void;
  progress: (kind: AdvisorKind, key: string, done: number, total: number) => void;
  /** `cut` when the clock stopped a probe (or the baseline), `done` otherwise. */
  settle: (kind: AdvisorKind, key: string, result: AdvisorResult) => void;
  fail: (kind: AdvisorKind, key: string, message: string) => void;
  /** The Cancel button: abort that pass and say so; the progress stays, the rows were never read. */
  cancel: (kind: AdvisorKind) => void;
  /** Abort and forget: a new plan, another account. Both passes when no kind is given. */
  stop: (kind?: AdvisorKind) => void;
}

/**
 * **The identity of one pass's question** — the plan on screen and the account the baseline is planned from.
 * The input goes by value: a profile edit under a standing plan is another account and the rows are stale.
 * `upgrades` is the typed list, passed for `mine` only: the generic probes do not depend on it.
 */
export function advisorKey(
  plan: CampaignPlan,
  input: CampaignInput,
  upgrades: readonly UserUpgradeEntry[] = [],
): string {
  const typed = upgrades.length === 0 ? '' : `|${JSON.stringify(upgrades)}`;
  return `${String(planId(plan))}|${JSON.stringify(input)}${typed}`;
}

/** Module state, not store state: a pool and an `AbortController` are nothing a component re-renders on. */
let pool: CalcPool | null = null;
const controllers: Record<AdvisorKind, AbortController | null> = { mine: null, default: null };

function abort(kind: AdvisorKind): void {
  controllers[kind]?.abort();
  controllers[kind] = null;
}

/** For tests: the pool the passes run on. Disposes the one before it. */
export function setAdvisorPool(next: CalcPool | null): void {
  for (const kind of ADVISOR_KINDS) abort(kind);
  pool?.dispose();
  pool = next;
}

/** The one pool the card's passes queue on, made on first use (the captain pass, `captainSearch.ts`, shares it). */
export function advisorPool(): CalcPool {
  pool ??= createCalcPool();
  return pool;
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
  const running = (kind: AdvisorKind, key: string): AdvisorEntry | null => {
    const entry = get().entries[kind];
    return entry !== null && entry.key === key && entry.status === 'running' ? entry : null;
  };
  const write = (kind: AdvisorKind, entry: AdvisorEntry | null): void => {
    set({ entries: { ...get().entries, [kind]: entry } });
  };
  return {
    entries: { mine: null, default: null },
    begin: (kind, key, total) => {
      write(kind, { key, status: 'running', done: 0, total, result: null, error: null });
    },
    progress: (kind, key, done, total) => {
      const entry = running(kind, key);
      if (entry !== null) write(kind, { ...entry, done, total });
    },
    settle: (kind, key, result) => {
      const entry = running(kind, key);
      if (entry === null) return;
      const cut = result.baseline === null || result.cut.length > 0;
      write(kind, { ...entry, status: cut ? 'cut' : 'done', result });
    },
    fail: (kind, key, message) => {
      const entry = running(kind, key);
      if (entry !== null) write(kind, { ...entry, status: 'failed', error: message });
    },
    cancel: (kind) => {
      abort(kind);
      const entry = get().entries[kind];
      if (entry?.status === 'running') write(kind, { ...entry, status: 'cancelled' });
    },
    stop: (kind) => {
      for (const one of kind === undefined ? ADVISOR_KINDS : [kind]) {
        abort(one);
        write(one, null);
      }
    },
  };
});

/** The probes a kind reads: the typed upgrades for `mine`, the 29 generic ones for `default`. */
function probesOf(kind: AdvisorKind, upgrades: readonly UserUpgradeEntry[]): Probe[] {
  return kind === 'mine' ? upgrades.map(userProbe) : genericProbes();
}

/**
 * Start the `kind` pass for `key`: the baseline and its probes, ranked on `headline`. A pass of the same kind
 * already out is aborted first — one pass per kind at a time, the latest question wins; the other kind is left
 * running, and both queue on the one pool.
 */
export async function computeAdvice(
  kind: AdvisorKind,
  key: string,
  input: CampaignInput,
  headline?: PlanPick,
  upgrades: readonly UserUpgradeEntry[] = [],
): Promise<void> {
  const probes = probesOf(kind, upgrades);
  // "My upgrades" with nothing typed has nothing to read; the card does not offer it.
  if (probes.length === 0) return;
  abort(kind);
  const own = new AbortController();
  controllers[kind] = own;
  const store = useAdvisorStore.getState();
  store.begin(kind, key, probes.length + 1);
  try {
    const result = await runAdvisor(input, probes, advisorPool(), {
      signal: own.signal,
      headline,
      onProgress: (done, total) => {
        useAdvisorStore.getState().progress(kind, key, done, total);
      },
    });
    useAdvisorStore.getState().settle(kind, key, result);
  } catch (error) {
    // A cancel or a stop has already said what happened to this pass.
    if (isAbortError(error)) return;
    useAdvisorStore.getState().fail(kind, key, error instanceof Error ? error.message : String(error));
  } finally {
    if (controllers[kind] === own) controllers[kind] = null;
  }
}

/** What the card draws from, for one kind of pass. */
export interface AdvisorKindView {
  status: AdvisorStatus;
  done: number;
  total: number;
  /** The probes read, ranked on the headline stop. */
  rows: AdvisorRow[];
  result: AdvisorResult | null;
  error: string | null;
  compute: () => void;
  cancel: () => void;
}

export interface AdvisorView {
  /** The stop the rows are headlined on: the one selected on the bar. */
  headline: PlanPick | null;
  /** A plan is on screen and the platform can run the pass off the main thread. */
  available: boolean;
  /** How many upgrades the player has typed: "my upgrades" has nothing to read at 0. */
  typed: number;
  mine: AdvisorKindView;
  default: AdvisorKindView;
}

/** One kind's view: its entry if it answers the question on screen, ranked on the headline stop. */
function useKindView(
  kind: AdvisorKind,
  key: string | null,
  input: CampaignInput | null,
  headline: PlanPick | null,
  upgrades: readonly UserUpgradeEntry[] | undefined,
): AdvisorKindView {
  const held = useAdvisorStore((state) => state.entries[kind]);
  const entry = held !== null && held.key === key ? held : null;
  const answer = entry?.result ?? null;
  const rows = useMemo(
    () => (answer === null ? [] : rankAdvice(answer.rows, headline ?? undefined)),
    [answer, headline],
  );
  const compute = useCallback(() => {
    if (key === null || input === null) return;
    void computeAdvice(kind, key, input, headline ?? undefined, upgrades);
  }, [kind, key, input, headline, upgrades]);
  const cancel = useCallback(() => {
    useAdvisorStore.getState().cancel(kind);
  }, [kind]);
  return {
    status: entry?.status ?? 'idle',
    done: entry?.done ?? 0,
    total: entry?.total ?? 0,
    rows,
    result: answer,
    error: entry?.error ?? null,
    compute,
    cancel,
  };
}

/**
 * **The card's hook.** It never starts a pass on its own; it stops one whose plan or account is no longer on
 * screen (a Generate, a profile switch, an edit; a typed-list edit for `mine` only), and hands back the rows
 * of each pass that is, ranked on the stop the bar is showing.
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
  // A typed upgrade added, edited or deleted is another question for `mine` alone.
  const upgrades = profile?.upgrades;
  const mineKey = useMemo(
    () => (plan !== null && input !== null ? advisorKey(plan, input, upgrades) : null),
    [plan, input, upgrades],
  );
  const defaultKey = useMemo(
    () => (plan !== null && input !== null ? advisorKey(plan, input) : null),
    [plan, input],
  );
  const headline = plan === null ? null : pickOf(plan, position).pick;

  useEffect(() => {
    const keys: Record<AdvisorKind, string | null> = { mine: mineKey, default: defaultKey };
    for (const kind of ADVISOR_KINDS) {
      const current = useAdvisorStore.getState().entries[kind];
      if (current !== null && current.key !== keys[kind]) useAdvisorStore.getState().stop(kind);
    }
  }, [mineKey, defaultKey]);

  const mine = useKindView('mine', mineKey, input, headline, upgrades);
  const generic = useKindView('default', defaultKey, input, headline, upgrades);
  return {
    headline,
    available: defaultKey !== null && canAdvise(),
    typed: upgrades?.length ?? 0,
    mine,
    default: generic,
  };
}
