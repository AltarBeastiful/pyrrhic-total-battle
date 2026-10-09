/**
 * **The captain section of the "What to upgrade next" card** (W17 C5, `docs/plans/progression-advisor.md` §4):
 * which three captains to march with, and where the next star or level of a captain goes — one pass on one
 * button ("Compute captains"), never on Generate.
 *
 * Experiment 193 priced the captain pass at 3.4–5.7 s on one lane and, with the advisor's own pass, over the
 * 20 s clock on 3 of 7 armies, so it has its own button and its own clock (`CAMPAIGN.budgets.extra`), not a
 * place inside `advisorSearch.ts`'s two passes. It shares their shape — a store holding the answer, an
 * `AbortController` as module state, a key that is the question, an answer dropped when its key is no longer
 * on screen — and their pool (`advisorPool`).
 *
 * The pass is two worker passes under that one clock (the lead trio is the first one's answer, so they cannot
 * run side by side):
 *
 *  1. `runCaptainAdvice` — the current trio's plan, every allowed trio screened, the best planned in full: the
 *     best trio per stop of the bar, with its gain over the current one, never below it.
 *  2. `runCaptainUpgrades` — each owned captain's next star and next levels, read against the lead trio
 *     (`leadTrio`), so a row is the upgrade's own worth and not the swap of trio it might also bring.
 *
 * Which trios there are, their totals and the upgrades are the main thread's (`captainTrios`,
 * `captainUpgradeCandidates`); the worker takes them as keys and totals. **The trio is a suggestion**
 * (owner, 2026-10-07): the march keeps the captains the player chose.
 *
 * **The key carries the roster.** The plan's request already carries the active captains' totals, but a captain
 * on the bench, a level typed on it, or the march type changes which trios exist and what they are worth, so
 * they ride in the key by value.
 */
import { useCallback, useEffect, useMemo } from 'react';
import { create } from 'zustand';

import { CAMPAIGN } from '@/config';
import { rankAdvice, type AdvisorRow } from '@/engine/advisor';
import { leadTrio } from '@/engine/captainUpgrades';
import type { CampaignInput, CampaignPlan, PlanPick } from '@/engine/plan';
import { distinctCaptains } from '@/engine/captains';
import { buildPlanRequest } from '@/state/derive';
import { captainTrios } from '@/state/captainTrios';
import { captainUpgradeCandidates } from '@/state/captainUpgrades';
import type { BattleSetup, Profile } from '@/state/schema';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { runCaptainAdvice, type CaptainAdviceResult } from '@/worker/captainAdvice';
import { runCaptainUpgrades, type CaptainUpgradeResult, type UpgradeAsk } from '@/worker/captainUpgrades';
import { isAbortError } from '@/worker/client';

import { advisorKey, advisorPool, type AdvisorStatus } from './advisorSearch';
import { pickOf, useRunStore } from './runStore';

/** What a finished captain pass holds: the trio advice, and the upgrades read against its lead trio. */
export interface CaptainPassResult {
  advice: CaptainAdviceResult;
  /** `null` when the clock was out before the upgrades could start. */
  upgrades: CaptainUpgradeResult | null;
  /** Key of the trio the upgrades were read against. */
  lead: string;
}

export interface CaptainEntry {
  key: string;
  status: Exclude<AdvisorStatus, 'idle'>;
  /** Jobs settled and jobs in the pass (both worker passes), from `onProgress`. */
  done: number;
  total: number;
  result: CaptainPassResult | null;
  error: string | null;
}

export interface CaptainState {
  entry: CaptainEntry | null;
  begin: (key: string) => void;
  progress: (key: string, done: number, total: number) => void;
  settle: (key: string, result: CaptainPassResult) => void;
  fail: (key: string, message: string) => void;
  /** The Cancel button: abort the pass and say so. */
  cancel: () => void;
  /** Abort and forget: a new plan, another account. */
  stop: () => void;
}

/**
 * **The identity of the captain question**: the plan on screen, the account its baseline is planned from, the
 * captains owned (by value) and the march type.
 */
export function captainKey(
  plan: CampaignPlan,
  input: CampaignInput,
  profile: Pick<Profile, 'sources'>,
  setup: Pick<BattleSetup, 'marchType'>,
): string {
  return `${advisorKey(plan, input)}|${setup.marchType}|${JSON.stringify(profile.sources.captains)}`;
}

let controller: AbortController | null = null;

function abort(): void {
  controller?.abort();
  controller = null;
}

/** True when the pass did not read everything it set out to: the clock (or a cancel inside a worker). */
function isCut(result: CaptainPassResult): boolean {
  const { advice, upgrades } = result;
  return (
    advice.baseline === null ||
    advice.screenCut ||
    advice.cut.length > 0 ||
    upgrades === null ||
    upgrades.cut.length > 0
  );
}

export const useCaptainStore = create<CaptainState>()((set, get) => {
  /** Only the pass on screen may write, and only while it runs: a late answer for an old key is dropped. */
  const running = (key: string): CaptainEntry | null => {
    const entry = get().entry;
    return entry !== null && entry.key === key && entry.status === 'running' ? entry : null;
  };
  return {
    entry: null,
    begin: (key) => {
      set({ entry: { key, status: 'running', done: 0, total: 0, result: null, error: null } });
    },
    progress: (key, done, total) => {
      const entry = running(key);
      if (entry !== null) set({ entry: { ...entry, done, total } });
    },
    settle: (key, result) => {
      const entry = running(key);
      if (entry !== null) set({ entry: { ...entry, status: isCut(result) ? 'cut' : 'done', result } });
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
 * Start the captain pass for `key`. A pass already out is aborted first: the latest question wins. The advice
 * pass runs on the whole clock; the upgrade pass gets what is left of it, and is not started when none is.
 */
export async function computeCaptains(
  key: string,
  input: CampaignInput,
  profile: Profile,
  setup: BattleSetup,
): Promise<void> {
  const { currentKey, trios } = captainTrios(profile, setup);
  abort();
  const own = new AbortController();
  controller = own;
  useCaptainStore.getState().begin(key);
  const began = performance.now();
  // The progress of both worker passes as one count: the second one's jobs follow the first's.
  let offset = 0;
  try {
    const pool = advisorPool();
    const advice = await runCaptainAdvice(
      input,
      trios.map(({ key: trio, totals }) => ({ key: trio, totals })),
      currentKey,
      pool,
      {
        signal: own.signal,
        onProgress: (done, total) => {
          useCaptainStore.getState().progress(key, done, total);
          offset = total;
        },
      },
    );

    const lead = leadTrio(advice.best, currentKey);
    const leadTrioCandidate = trios.find((trio) => trio.key === lead);
    const leadStops = advice.plans[lead];
    const left = CAMPAIGN.budgets.extra - (performance.now() - began);
    let upgrades: CaptainUpgradeResult | null = null;
    if (leadTrioCandidate !== undefined && leadStops !== undefined && left > 0) {
      const asks: UpgradeAsk[] = captainUpgradeCandidates(profile, setup, leadTrioCandidate).map(
        (candidate) => ({
          id: candidate.spec.id,
          label: `${candidate.name} ${candidate.change}`,
          trios: candidate.trios.map(({ key: trio, totals }) => ({ key: trio, totals })),
        }),
      );
      upgrades = await runCaptainUpgrades(
        input,
        { key: lead, totals: leadTrioCandidate.totals, stops: leadStops },
        asks,
        pool,
        {
          signal: own.signal,
          budgetMs: left,
          onProgress: (done, total) => {
            useCaptainStore.getState().progress(key, offset + done, offset + total);
          },
        },
      );
    }
    useCaptainStore.getState().settle(key, { advice, upgrades, lead });
  } catch (error) {
    // A cancel or a stop has already said what happened to this pass.
    if (isAbortError(error)) return;
    useCaptainStore.getState().fail(key, error instanceof Error ? error.message : String(error));
  } finally {
    if (controller === own) controller = null;
  }
}

/** What the card draws from. */
export interface CaptainView {
  /** The captains the account owns, one per `captainId`: the section has nothing to say with none. */
  owned: number;
  status: AdvisorStatus;
  done: number;
  total: number;
  result: CaptainPassResult | null;
  /** The upgrades read, ranked on the headline stop. */
  rows: AdvisorRow[];
  error: string | null;
  compute: () => void;
  cancel: () => void;
}

/**
 * **The section's hook.** It never starts a pass on its own; it stops one whose plan, account, roster or march
 * type is no longer on screen, and hands back the answer of the one that is, its upgrades ranked on the stop the
 * bar is showing.
 */
export function useCaptainAdvice(): CaptainView {
  const plan = useRunStore((state) => state.plan);
  const position = useRunStore((state) => state.planPick);
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const input = useMemo(
    () => (profile !== undefined && setup !== undefined ? buildPlanRequest(profile, setup) : null),
    [profile, setup],
  );
  const key = useMemo(
    () =>
      plan !== null && input !== null && profile !== undefined && setup !== undefined
        ? captainKey(plan, input, profile, setup)
        : null,
    [plan, input, profile, setup],
  );
  const headline: PlanPick | null = plan === null ? null : pickOf(plan, position).pick;

  const held = useCaptainStore((state) => state.entry);
  useEffect(() => {
    if (held !== null && held.key !== key) useCaptainStore.getState().stop();
  }, [held, key]);

  const entry = held !== null && held.key === key ? held : null;
  const result = entry?.result ?? null;
  const upgradeRows = result?.upgrades?.rows;
  const rows = useMemo(
    () => (upgradeRows === undefined ? [] : rankAdvice(upgradeRows, headline ?? undefined)),
    [upgradeRows, headline],
  );
  const compute = useCallback(() => {
    if (key === null || input === null || profile === undefined || setup === undefined) return;
    void computeCaptains(key, input, profile, setup);
  }, [key, input, profile, setup]);
  const cancel = useCallback(() => {
    useCaptainStore.getState().cancel();
  }, []);
  return {
    owned: profile === undefined ? 0 : distinctCaptains(profile.sources.captains).length,
    status: entry?.status ?? 'idle',
    done: entry?.done ?? 0,
    total: entry?.total ?? 0,
    result,
    rows,
    error: entry?.error ?? null,
    compute,
    cancel,
  };
}
