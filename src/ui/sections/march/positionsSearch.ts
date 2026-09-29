/**
 * **The raise positions of a whole plan, asked for once** (S-147): the block under the plan draws the five
 * answers for **every stop on the bar**, so a press on the slide is another table rather than another wait
 * (owner, 2026-09-29: *"why the table doesn't appear for each slider spot? merc save, sweet spot… all those
 * should have their table when clicking on the plan slider. Best is to compute it ahead for all like the
 * slider spots"*).
 *
 * So this is `raiseSearch.ts`'s own shape one level up — a store holding answers, a hook the block calls, a
 * worker — with three things deliberately its own:
 *
 *  - **one job per stop**, fired together on its own client: a worker runs one job at a time, so the stop on
 *    screen is asked for **first** and the rest of the bar behind it, and each table is drawn as it lands.
 *    Pricing only the stop in view is the same arithmetic; pricing the rest of the bar is what makes the
 *    slide instant.
 *  - **a key that is the plan's identity**, not the march's. The bar moves the snapshot from one stop to
 *    another and every one of those stops belongs to one plan, so keying by the march would throw the tables
 *    away at every press. (`marchId` in `raiseSearch.ts` is the march's own key, and it stays there.)
 *  - **its own client**, and for the reason the exhaustive raise has one: a `Best v2` press measured in tens
 *    of seconds must not sit in front of the block (or behind it). Three workers cost a third wasm kernel
 *    load and nothing else.
 *
 * **Nothing is drawn while a stop is still being priced**: the block is the foot of the plan's fold, and a
 * table that appeared row by row would move the layout under a reader.
 */
import { useEffect } from 'react';
import { create } from 'zustand';

import type { CampaignPlan } from '@/engine/plan';
import type { ResultSnapshot } from '@/ui/resultStore';
import { createCalcClient, isAbortError } from '@/worker/client';
import type { CalcClient } from '@/worker/client';

import type { PositionTrades } from './positions';

/**
 * **The plan's identity**, the way `marchId` is the march's (`raiseSearch.ts`): a `CampaignPlan` is written
 * once by the search and never edited, so its object identity *is* the plan — and it survives every move of
 * the bar, which is the whole point of keying on it here.
 */
const planIds = new WeakMap<CampaignPlan, number>();
let lastPlanId = 0;

function planId(plan: CampaignPlan): number {
  const known = planIds.get(plan);
  if (known !== undefined) return known;
  lastPlanId += 1;
  planIds.set(plan, lastPlanId);
  return lastPlanId;
}

/**
 * The key of one plan's tables, as one string — the plan's identity, which is what an answer belongs to
 * (`marchId`'s own trick, one level up). Exported so a test can file an answer under the plan it is about.
 */
export function positionsKey(plan: CampaignPlan): string {
  return String(planId(plan));
}

/** The tables of one plan, in the bar's own order, and the plan they are about. */
export interface PositionsEntry {
  /** `planId` of the plan the bar is showing. */
  key: string;
  /** One entry per stop of the plan, in its order; `null` for a stop still being priced (or that failed). */
  stops: (PositionTrades | null)[];
}

export interface PositionsState {
  entry: PositionsEntry | null;
  /** File a request: the block knows the bar is being priced, and how many stops it has. */
  begin: (key: string, stops: number) => void;
  /** Answer the job of one stop, if this is still the plan on screen. */
  settle: (key: string, index: number, trades: PositionTrades | null) => void;
  /** Stop the jobs in flight, throw the worker away and forget every table. */
  stop: () => void;
}

/** Module state, not store state: a Worker and an `AbortController` are nothing a component re-renders on. */
let client: CalcClient | null = null;
let controller: AbortController | null = null;

function calc(): CalcClient {
  client ??= createCalcClient();
  return client;
}

/**
 * **`terminate` is the only way to interrupt a search already inside its box** (`exactSearch` has no
 * checkpoint to poll), and it costs one restart on the next plan — against a bar nobody is reading any more.
 */
function kill(): void {
  controller?.abort();
  controller = null;
  client?.dispose();
  client = null;
}

export const usePositionsStore = create<PositionsState>()((set, get) => ({
  entry: null,
  begin: (key, stops) => {
    set({ entry: { key, stops: Array.from({ length: stops }, () => null) } });
  },
  settle: (key, index, trades) => {
    const entry = get().entry;
    // **A job that lands after the plan has been replaced is dropped**: the bar it was asked about is not on
    // screen any more, and its tables would be about a plan nobody is looking at.
    if (entry === null || entry.key !== key) return;
    const stops = [...entry.stops];
    stops[index] = trades;
    set({ entry: { key, stops } });
  },
  stop: () => {
    kill();
    set({ entry: null });
  },
}));

/**
 * Ask for the whole bar. The stop on screen goes first — it is the one a player is looking at — and the rest
 * behind it in the bar's own order, so a slide to a neighbour finds its table already there.
 */
function ask(key: string, snapshot: ResultSnapshot, plan: CampaignPlan, first: number): void {
  kill();
  controller = new AbortController();
  const { signal } = controller;
  const count = plan.alternatives.length;
  usePositionsStore.getState().begin(key, count);
  const onScreen = Math.max(0, Math.min(count - 1, Math.round(first)));
  const rest = Array.from({ length: count }, (_unused, index) => index).filter((index) => index !== onScreen);
  for (const index of [onScreen, ...rest]) {
    const row = plan.alternatives[index];
    if (row === undefined) continue;
    calc()
      .positions({ request: snapshot.request, counts: row.counts }, signal)
      .then(
        (trades) => {
          usePositionsStore.getState().settle(key, index, trades);
        },
        (error: unknown) => {
          // A cancelled job is not a failure and has already been forgotten; anything else is settled as "no
          // table for that stop", which leaves the block drawing nothing rather than something stale.
          if (isAbortError(error)) return;
          usePositionsStore.getState().settle(key, index, null);
        },
      );
  }
}

/**
 * **The five positions of the stop on screen**, priced ahead with the rest of the bar. The two conditions are
 * `useMarch`'s own (`canRaise`): a plan's march, with troops to shelter a hired stack by — the same two facts
 * the control itself is drawn on, so the block and the control are never on screen without each other.
 */
export function usePositions(
  snapshot: ResultSnapshot | null,
  plan: CampaignPlan | null,
  position: number,
  canRaise: boolean,
): PositionTrades | null {
  const wanted = snapshot !== null && plan !== null && canRaise;
  const key = wanted && plan !== null ? positionsKey(plan) : null;
  const entry = usePositionsStore((state) => state.entry);

  useEffect(() => {
    if (key === null || snapshot === null || plan === null) {
      if (usePositionsStore.getState().entry !== null) usePositionsStore.getState().stop();
      return;
    }
    // **The bar is priced once**, not once per stop: a slide changes `position` and nothing else, and the
    // tables of the stops behind it are already in the store (or on their way).
    if (usePositionsStore.getState().entry?.key === key) return;
    /**
     * **The jobs run off the main thread, or the block is not offered at all.** `createCalcClient` falls back
     * to running a job on the main thread when the platform has no `Worker` or a CSP refuses one, and a whole
     * bar of positions is minutes of walking there — against one position's tens of seconds, which
     * `raiseSearch.ts` already prices and accepts. A block nobody can afford is a block not drawn (design
     * rule 15), so a client that is not worker-backed stops here rather than freezing the page.
     */
    if (calc().mode !== 'worker') {
      usePositionsStore.getState().stop();
      return;
    }
    ask(key, snapshot, plan, position);
  }, [key, snapshot, plan, position]);

  if (key === null || entry === null || entry.key !== key) return null;
  return entry.stops[position] ?? null;
}
