/**
 * **The hero report's state** (`docs/plans/hero-report.md`): one pass on one button ("Analyse my heroes"), never on
 * Generate, shown in a full-page popup and **kept until the next ask**. It shares the captain pass's shape
 * (`captainSearch.ts`) — a store holding the answer, an `AbortController` as module state, a key that is the
 * question — except that the answer is *not* dropped when the question moves on: the report stays readable, and
 * `stale` says it was asked about an earlier state of the account.
 *
 * The pass is three worker passes, each on the pool's own clock: the captain advice (the lead lineup is its answer),
 * the upgrade worth list read against that lead, and the role and situation pass (`runHeroReport`).
 */
import { useCallback, useMemo } from 'react';
import { create } from 'zustand';

import { CAMPAIGN } from '@/config';
import { leadLineup } from '@/engine/captainUpgrades';
import type { HeroReport } from '@/engine/heroReport';
import type { CampaignInput } from '@/engine/plan';
import { buildPlanRequest } from '@/state/derive';
import { captainLineups } from '@/state/captainLineups';
import { captainWorthCandidates } from '@/state/captainUpgrades';
import { heroRoster } from '@/state/heroRoster';
import type { BattleSetup, Profile } from '@/state/schema';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { runCaptainAdvice } from '@/worker/captainAdvice';
import { runUpgradeWorth } from '@/worker/captainUpgrades';
import { isAbortError } from '@/worker/client';
import { runHeroReport } from '@/worker/heroReport';

import { advisorPool, type AdvisorStatus } from './advisorSearch';
import { captainKey } from './captainSearch';
import { frameBatch, type FrameBatch } from './frameBatch';
import { useRunStore } from './runStore';

export interface HeroEntry {
  key: string;
  status: Exclude<AdvisorStatus, 'idle'>;
  done: number;
  total: number;
  report: HeroReport | null;
  error: string | null;
}

export interface HeroState {
  entry: HeroEntry | null;
  /** The popup is open: it outlives the pass, so closing it does not forget the report. */
  open: boolean;
  begin: (key: string) => void;
  progress: (key: string, done: number, total: number) => void;
  settle: (key: string, report: HeroReport) => void;
  fail: (key: string, message: string) => void;
  cancel: () => void;
  setOpen: (open: boolean) => void;
}

let controller: AbortController | null = null;
let tick: FrameBatch<[number, number]> | null = null;

function abort(): void {
  controller?.abort();
  controller = null;
  tick?.drop();
  tick = null;
}

export const useHeroStore = create<HeroState>()((set, get) => {
  /** Only the pass on screen may write, and only while it runs. */
  const running = (key: string): HeroEntry | null => {
    const entry = get().entry;
    return entry !== null && entry.key === key && entry.status === 'running' ? entry : null;
  };
  return {
    entry: null,
    open: false,
    begin: (key) => {
      const report = get().entry?.report ?? null;
      set({ open: true, entry: { key, status: 'running', done: 0, total: 0, report, error: null } });
    },
    progress: (key, done, total) => {
      const entry = running(key);
      if (entry !== null) set({ entry: { ...entry, done, total } });
    },
    settle: (key, report) => {
      const entry = running(key);
      if (entry !== null) set({ entry: { ...entry, status: 'done', report } });
    },
    fail: (key, message) => {
      const entry = running(key);
      if (entry !== null) set({ entry: { ...entry, status: 'failed', error: message } });
    },
    cancel: () => {
      tick?.flush();
      abort();
      const entry = get().entry;
      if (entry?.status === 'running') set({ entry: { ...entry, status: 'cancelled' } });
    },
    setOpen: (open) => {
      set({ open });
    },
  };
});

/** The question: the captain question plus nothing else the report reads. */
export const heroKey = captainKey;

/**
 * Start the hero report for `key`. A pass already out is aborted first; the previous report stays on screen until
 * this one settles.
 */
export async function computeHeroReport(
  key: string,
  input: CampaignInput,
  profile: Profile,
  setup: BattleSetup,
): Promise<void> {
  const { currentKey, lineups, size } = captainLineups(profile, setup);
  abort();
  const own = new AbortController();
  controller = own;
  const ownTick = frameBatch((done: number, total: number) => {
    useHeroStore.getState().progress(key, done, total);
  });
  tick = ownTick;
  useHeroStore.getState().begin(key);
  // The three passes as one count: each one's jobs follow the one before's.
  let offset = 0;
  let stageTotal = 0;
  const pass = (done: number, total: number): void => {
    stageTotal = total;
    ownTick.push(offset + done, offset + total);
  };
  const nextStage = (): void => {
    offset += stageTotal;
    stageTotal = 0;
  };
  try {
    const pool = advisorPool();
    const advice = await runCaptainAdvice(
      input,
      lineups.map(({ key: lineup, totals }) => ({ key: lineup, totals })),
      currentKey,
      pool,
      {
        signal: own.signal,
        onProgress: pass,
      },
    );
    nextStage();
    const lead = leadLineup(advice.best, currentKey);
    const leadCandidate = lineups.find((lineup) => lineup.key === lead);
    const leadStops = advice.plans[lead];
    if (leadCandidate === undefined || leadStops === undefined)
      throw new Error('The current march could not be read in time.');
    const leadOf = { key: lead, totals: leadCandidate.totals, stops: leadStops };

    const asks = captainWorthCandidates(profile, setup, leadCandidate, size).map((candidate) => ({
      id: candidate.spec.id,
      label: `${candidate.name} ${candidate.change}`,
      captainId: candidate.spec.captainId,
      kind: candidate.spec.kind,
      size: candidate.spec.size,
      perLevel: candidate.perLevel,
      exact: candidate.spec.exact === true,
      lineups: candidate.lineups.map(({ key: lineup, totals }) => ({ key: lineup, totals })),
    }));
    const worth = await runUpgradeWorth(input, leadOf, asks, pool, {
      signal: own.signal,
      budgetMs: CAMPAIGN.budgets.extra,
      onProgress: pass,
    });
    nextStage();
    const report = await runHeroReport(input, leadOf, heroRoster(profile, setup), worth, pool, {
      signal: own.signal,
      onProgress: pass,
    });
    ownTick.flush();
    useHeroStore.getState().settle(key, report);
  } catch (error) {
    if (isAbortError(error)) return;
    ownTick.flush();
    useHeroStore.getState().fail(key, error instanceof Error ? error.message : String(error));
  } finally {
    ownTick.drop();
    if (tick === ownTick) tick = null;
    if (controller === own) controller = null;
  }
}

export interface HeroView {
  /** Heroes owned (level 1 and above): the report has nothing to say with none. */
  owned: number;
  /** A plan is on screen, so there is a lead march to read: the button needs it. */
  ready: boolean;
  entry: HeroEntry | null;
  /** The held report was asked about another state of the account. */
  stale: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  analyse: () => void;
  cancel: () => void;
}

/** The launcher's hook. It never starts a pass on its own. */
export function useHeroReport(): HeroView {
  const plan = useRunStore((state) => state.plan);
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const input = useMemo(
    () => (profile !== undefined && setup !== undefined ? buildPlanRequest(profile, setup) : null),
    [profile, setup],
  );
  const key = useMemo(
    () =>
      plan !== null && input !== null && profile !== undefined && setup !== undefined
        ? heroKey(plan, input, profile, setup)
        : null,
    [plan, input, profile, setup],
  );
  const entry = useHeroStore((state) => state.entry);
  const open = useHeroStore((state) => state.open);
  const analyse = useCallback(() => {
    if (key === null || input === null || profile === undefined || setup === undefined) return;
    void computeHeroReport(key, input, profile, setup);
  }, [key, input, profile, setup]);
  const cancel = useCallback(() => {
    useHeroStore.getState().cancel();
  }, []);
  const setOpen = useCallback((next: boolean) => {
    useHeroStore.getState().setOpen(next);
  }, []);
  return {
    owned: profile === undefined ? 0 : profile.sources.captains.filter((entry) => entry.level >= 1).length,
    ready: key !== null,
    entry,
    stale: entry !== null && entry.key !== key,
    open,
    setOpen,
    analyse,
    cancel,
  };
}
