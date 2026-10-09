/**
 * **The other questions of the "What to upgrade next" card** (W17 step D, `docs/plans/advisor-step-d.md`): the
 * dominance and leadership sweeps, the next troop tier, more merc stock, the horizon and the value of silver —
 * one pass on one button ("Compute other questions"), never on Generate.
 *
 * Experiment 194 priced the five at 3.6 s a army beside 9.2 s for the generic probes, and over the 20 s cut
 * together on 2 of 19 armies, so they have their own button and clock, not a place inside `advisorSearch.ts`'s
 * passes. The shape is `captainSearch.ts`'s: a store holding the answer, an `AbortController` as module state, a
 * key that is the question, an answer dropped when its key is no longer on screen, and the one pool
 * (`advisorPool`).
 *
 * The probes are all asked in one `runAdvisor` pass (one baseline) and told apart by id afterwards
 * (`sweep:`, `campaign:tier:`, `campaign:merc:`, `campaign:horizon:`, `campaign:silver:`). What the card needs
 * besides the rows — the merc each step adds, the silver a side moves, the horizon of the baseline — is fixed
 * at the start of the pass and kept with the answer.
 */
import { useCallback, useEffect, useMemo } from 'react';
import { create } from 'zustand';

import { CAMPAIGN } from '@/config';
import { getUnits } from '@/data';
import { rankAdvice, type AdvisorRow, type StopAdvice } from '@/engine/advisor';
import {
  horizonProbes,
  housingSweep,
  mercStockProbes,
  nextTierProbes,
  silverDelta,
  silverProbes,
  tierUnlocks,
  type CampaignProbe,
} from '@/engine/advisor-sweeps';
import type { CampaignInput, CampaignPlan, PlanPick } from '@/engine/plan';
import { buildPlanRequest } from '@/state/derive';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { runAdvisor, type AdvisorResult } from '@/worker/advisor';
import { isAbortError } from '@/worker/client';

import { advisorKey, advisorPool, type AdvisorStatus } from './advisorSearch';
import { pickOf, useRunStore } from './runStore';

/** The five questions, in the order the card draws them. */
export type OtherQuestion = 'dominance' | 'leadership' | 'tier' | 'merc' | 'horizon' | 'silver';

export const OTHER_QUESTIONS: readonly OtherQuestion[] = [
  'dominance',
  'leadership',
  'tier',
  'merc',
  'horizon',
  'silver',
];

/** Which question a probe answers, from its id. */
export function questionOf(id: string): OtherQuestion | null {
  if (id.startsWith('sweep:dominance:')) return 'dominance';
  if (id.startsWith('sweep:leadership:')) return 'leadership';
  if (id.startsWith('campaign:tier:')) return 'tier';
  if (id.startsWith('campaign:merc:')) return 'merc';
  if (id.startsWith('campaign:horizon:')) return 'horizon';
  if (id.startsWith('campaign:silver:')) return 'silver';
  return null;
}

/** What the pass fixed at its start and the card reads with the rows. */
export interface OtherFacts {
  /** Merc units each stock step adds, by probe id. */
  mercAdded: Record<string, number>;
  /** The silver each side of the silver probe moves; 0 when the pass has none. */
  silverDelta: number;
  /** True when a silver budget is set, so both sides were read; false: only the loss side. */
  silverBudgeted: boolean;
  /** The horizon the baseline plan already is. */
  horizon: number;
}

export interface OtherAnswer extends AdvisorResult {
  facts: OtherFacts;
}

export interface OtherEntry {
  key: string;
  status: Exclude<AdvisorStatus, 'idle'>;
  done: number;
  total: number;
  result: OtherAnswer | null;
  error: string | null;
}

export interface OtherState {
  entry: OtherEntry | null;
  begin: (key: string, total: number) => void;
  progress: (key: string, done: number, total: number) => void;
  settle: (key: string, result: OtherAnswer) => void;
  fail: (key: string, message: string) => void;
  cancel: () => void;
  stop: () => void;
}

/** The identity of the question: the plan on screen and the account its baseline is planned from. */
export function otherKey(plan: CampaignPlan, input: CampaignInput): string {
  return `other|${advisorKey(plan, input)}`;
}

let controller: AbortController | null = null;

function abort(): void {
  controller?.abort();
  controller = null;
}

export const useOtherStore = create<OtherState>()((set, get) => {
  /** Only the pass on screen may write, and only while it runs: a late answer for an old key is dropped. */
  const running = (key: string): OtherEntry | null => {
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
 * The probes of the five questions for this account, with what the card reads beside them. `silverBill` is the
 * campaign's silver on the plan on screen, the unit of the silver step.
 */
export function otherProbes(
  input: CampaignInput,
  silverBill: number,
): { probes: CampaignProbe[]; facts: OtherFacts } {
  const horizon = input.marchTarget ?? CAMPAIGN.marches;
  const merc = mercStockProbes(input.request.caps);
  const probes = [
    ...housingSweep('dominance'),
    ...housingSweep('leadership'),
    ...nextTierProbes(tierUnlocks(input.request.units, getUnits())),
    ...merc,
    ...horizonProbes(horizon),
    ...silverProbes(input, silverBill),
  ];
  const mercAdded: Record<string, number> = {};
  for (const probe of merc) mercAdded[probe.id] = probe.mercAdded ?? 0;
  return {
    probes,
    facts: {
      mercAdded,
      silverDelta: silverDelta(silverBill),
      silverBudgeted: input.silverBudget !== undefined,
      horizon,
    },
  };
}

/** Start the pass for `key`; one at a time, the latest question wins. */
export async function computeOther(
  key: string,
  input: CampaignInput,
  silverBill: number,
  headline?: PlanPick,
): Promise<void> {
  const { probes, facts } = otherProbes(input, silverBill);
  abort();
  const own = new AbortController();
  controller = own;
  useOtherStore.getState().begin(key, probes.length + 1);
  try {
    const result = await runAdvisor(input, probes, advisorPool(), {
      signal: own.signal,
      headline,
      onProgress: (done, total) => {
        useOtherStore.getState().progress(key, done, total);
      },
    });
    useOtherStore.getState().settle(key, { ...result, facts });
  } catch (error) {
    // A cancel or a stop has already said what happened to this pass.
    if (isAbortError(error)) return;
    useOtherStore.getState().fail(key, error instanceof Error ? error.message : String(error));
  } finally {
    if (controller === own) controller = null;
  }
}

/** What the card draws from. */
export interface OtherView {
  status: AdvisorStatus;
  done: number;
  total: number;
  result: OtherAnswer | null;
  /** The rows of each question, ranked on the headline stop (probe order kept for the sweeps and the horizon). */
  rows: Record<OtherQuestion, AdvisorRow[]>;
  error: string | null;
  compute: () => void;
  cancel: () => void;
}

const EMPTY_ROWS: Record<OtherQuestion, AdvisorRow[]> = {
  dominance: [],
  leadership: [],
  tier: [],
  merc: [],
  horizon: [],
  silver: [],
};

/** The hook: stops a pass whose plan or account is no longer on screen, never starts one. */
export function useOtherAdvice(): OtherView {
  const plan = useRunStore((state) => state.plan);
  const position = useRunStore((state) => state.planPick);
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const input = useMemo(
    () => (profile !== undefined && setup !== undefined ? buildPlanRequest(profile, setup) : null),
    [profile, setup],
  );
  const key = useMemo(() => (plan !== null && input !== null ? otherKey(plan, input) : null), [plan, input]);
  const headline: PlanPick | null = plan === null ? null : pickOf(plan, position).pick;

  const held = useOtherStore((state) => state.entry);
  useEffect(() => {
    if (held !== null && held.key !== key) useOtherStore.getState().stop();
  }, [held, key]);

  const entry = held !== null && held.key === key ? held : null;
  const result = entry?.result ?? null;
  const rows = useMemo(() => {
    if (result === null) return EMPTY_ROWS;
    const split: Record<OtherQuestion, AdvisorRow[]> = {
      dominance: [],
      leadership: [],
      tier: [],
      merc: [],
      horizon: [],
      silver: [],
    };
    for (const row of result.rows) {
      const question = questionOf(row.id);
      if (question !== null) split[question].push(row);
    }
    // Only the tier list is a ranking; a sweep is a curve, the horizon a trade and the silver two sides.
    split.tier = rankAdvice(split.tier, headline ?? undefined);
    return split;
  }, [result, headline]);

  const compute = useCallback(() => {
    if (key === null || input === null || plan === null) return;
    void computeOther(key, input, plan.silver, headline ?? undefined);
  }, [key, input, plan, headline]);
  const cancel = useCallback(() => {
    useOtherStore.getState().cancel();
  }, []);
  return {
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

/**
 * **What one side of the silver probe did**, in % of the current damage per million silver moved, signed: the
 * re-planned stop's damage where there is one, else the re-priced one. The advisor's own gain is clamped at 0,
 * so the loss side is read off the bills here. `null` with no silver moved.
 */
export function silverSlope(
  stop: Pick<StopAdvice, 'current' | 'repriced' | 'replanned'>,
  moved: number,
): number | null {
  if (moved <= 0 || stop.current.bill.damage <= 0) return null;
  const reading = stop.replanned ?? stop.repriced;
  const change = ((reading.bill.damage - stop.current.bill.damage) / stop.current.bill.damage) * 100;
  return change / (moved / 1_000_000);
}
