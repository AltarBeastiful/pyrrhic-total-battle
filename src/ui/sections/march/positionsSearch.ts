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
 *
 * **And the control in the battle summary reads them** (S-149; owner, 2026-09-30: *"make the positions
 * selector (as is, tight…) use the already computed assemblyscript values (should be same as engine/TS)"*).
 * A press of that control used to answer the same question the table had already answered — one position at a
 * time, through the exhaustive raise's own search, measured at 2.7 ms median and **51 s** worst a press
 * (`out/182-v2-cost.md`) — so this module also hands the March the row it has already paid for
 * (`usePricedRaise`). Nothing is computed twice, and nothing a player presses waits.
 *
 * **A table that is still coming is not a table that will not answer** (the follow-up the owner found the next
 * morning: *"it seems when clicking again on generate, we're still using ts tight version instead of assembly
 * script"*). A Generate re-prices the whole bar, and in the frames before its rows land the March read "no
 * row" as "no row coming" and started the search the wasm was about to answer — one dispatched search per
 * Generate. The store holds the three states that tell the difference (`PositionsStop`), so the March can wait
 * for what is coming and take its own path only for what is not.
 */
import { useEffect, useMemo } from 'react';
import { create } from 'zustand';

import type { CampaignPlan } from '@/engine/plan';
import type { StackRequest } from '@/engine/types';
import type { ResultSnapshot } from '@/ui/resultStore';
import { createCalcClient, isAbortError } from '@/worker/client';
import type { CalcClient } from '@/worker/client';

import type { PositionTrades } from './positions';
import { pricedRaise } from './positions';
import type { RaiseModes } from './raise';
import { pickOf } from './runStore';

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
 *
 * **The army rides with it, and by value rather than by identity** (S-149). Since a row is priced on a
 * **march of one army** (`planMarch(request, stop.counts)`), a table is only about the marches on screen while
 * the request is the one it was priced with — and since the control now lands on those counts, using another
 * request's answer would move the hired stacks under a shelter nobody measured. A **slide** rebuilds the
 * request object (`PlanPanel`'s `read`) with the same figures in it, and the same string comes out of it, so
 * moving the bar still asks for nothing; a setup edited under a standing plan is a different army, and the bar
 * is priced again rather than left describing the account it no longer holds.
 */
export function positionsKey(plan: CampaignPlan, request: StackRequest): string {
  return `${String(planId(plan))}|${JSON.stringify(request)}`;
}

/**
 * **One stop of the bar, as the store holds it**: its table once the job has landed, `null` when the job
 * failed, and `'out'` while it is still on its way.
 *
 * Three states and not two, because **"a job that is coming" and "a job that will never answer" are different
 * facts to the March** (S-149's follow-up, owner, 2026-10-01: *"it seems when clicking again on generate, we're
 * still using ts tight version instead of assembly script"*). A press of Generate prices the whole bar again —
 * a new plan, a new army — and its rows land a frame later; a March that cannot tell that frame from a failure
 * dispatches the exhaustive raise's own search in it, which is up to 51 s of walking for an answer the wasm is
 * about to hand over (`usePricedRaise`).
 */
export type PositionsStop = PositionTrades | null | 'out';

/** The tables of one plan, in the bar's own order, and the plan they are about. */
export interface PositionsEntry {
  /** `positionsKey` of the plan and the army the bar is showing. */
  key: string;
  /** One entry per stop of the plan, in its order, in the three states of `PositionsStop`. */
  stops: PositionsStop[];
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

/**
 * **What a client of this module is** — the one fact the March has to know **during a render**: while an ask
 * is on its way it waits for the table rather than starting the exhaustive raise's own search (`PricedRaise`),
 * and on a host with no worker that wait would be for nothing.
 *
 * It is what the client says it is, remembered — a client that has been thrown away (`stop`) does not change
 * what the next one will be, and the March asks between the two — and the platform's own guess until one has
 * been built: `typeof Worker`, which is exactly what decides `createCalcClient`'s branch, and which a platform
 * that has a `Worker` it will not start (a `file://` page, a strict CSP) corrects by handing back the inline
 * client. **Read during a render and never through `calc()`**, which is a `new Worker`.
 */
let backed: boolean | null = null;

function canPrice(): boolean {
  return backed ?? typeof Worker !== 'undefined';
}

function calc(): CalcClient {
  client ??= createCalcClient();
  backed = client.mode === 'worker';
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
    // Every stop starts **out**: one job each has just been handed to the worker, in the bar's own order.
    set({ entry: { key, stops: Array.from({ length: stops }, () => 'out' as const) } });
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
function ask(
  key: string,
  request: StackRequest,
  plan: CampaignPlan,
  first: number,
  known?: PositionTrades,
): void {
  kill();
  controller = new AbortController();
  const { signal } = controller;
  const count = plan.alternatives.length;
  usePositionsStore.getState().begin(key, count);
  const onScreen = Math.max(0, Math.min(count - 1, Math.round(first)));
  // **A stop already priced is filed, not asked again** (`primePositions`): the Generate paid for it.
  if (known !== undefined) usePositionsStore.getState().settle(key, onScreen, known);
  const rest = Array.from({ length: count }, (_unused, index) => index).filter((index) => index !== onScreen);
  for (const index of known === undefined ? [onScreen, ...rest] : rest) {
    const row = plan.alternatives[index];
    if (row === undefined) continue;
    calc()
      .positions({ request, counts: row.counts }, signal)
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
 * **The stop a Generate opens on, priced before the march is drawn** (owner, 2026-10-07: *"for now it generates
 * then jump to tight. it should be tight already"*). `runGenerate` asks for the opening stop's positions on its
 * own client and files the answer here **before** it publishes the march, so the March's first frame is
 * already Tight; the rest of the bar is asked for behind it, exactly as `usePositions` would have. On a host
 * with no worker the rest is filed as "no table" rather than left on its way, which is what `usePositions`
 * would have decided for the whole bar.
 */
export function primePositions(
  plan: CampaignPlan,
  request: StackRequest,
  index: number,
  trades: PositionTrades,
): void {
  const key = positionsKey(plan, request);
  if (calc().mode === 'worker') {
    ask(key, request, plan, index, trades);
    return;
  }
  kill();
  usePositionsStore.setState({
    entry: { key, stops: plan.alternatives.map((_row, at) => (at === index ? trades : null)) },
  });
}

/**
 * **The key of the tables the March is to read** — `positionsKey` of the plan and the army on screen, or
 * `null` when there is no bar to price at all.
 *
 * Taken **once for the two objects it is made of**: `positionsKey` reads the whole army to compare it, and
 * these hooks run on every render of the pane, where the plan and the request are two objects the stores hand
 * out unchanged until one of them really moves.
 */
function usePositionsKey(
  snapshot: ResultSnapshot | null,
  plan: CampaignPlan | null,
  canRaise: boolean,
): string | null {
  const request = snapshot?.request ?? null;
  return useMemo(
    () => (plan !== null && request !== null && canRaise ? positionsKey(plan, request) : null),
    [plan, request, canRaise],
  );
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
  const key = usePositionsKey(snapshot, plan, canRaise);
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
    ask(key, snapshot.request, plan, position);
  }, [key, snapshot, plan, position]);

  if (key === null || entry === null || entry.key !== key) return null;
  const stop = entry.stops[position];
  // **`'out'` draws nothing, like `null`** — a table that appeared row by row would move the layout under a
  // reader — and which of the two it is is the March's question, not this one's (`usePricedRaise`).
  return stop === undefined || stop === 'out' ? null : stop;
}

/** Where the raise the March is to draw comes from, and whether it is still coming. */
export interface PricedRaise {
  /** The row's counts for the stop and the position on screen, or `null` while the plan's table has none. */
  counts: Record<string, number> | null;
  /** The stop's priced positions, `null` while they are coming or when the job failed (the hover preview). */
  trades: PositionTrades | null;
  /**
   * **A table for this stop is on its way** — its job is out and has not landed. The March draws the climb
   * while it comes and asks nothing else; a job that *failed* is not this (`PositionsStop`).
   */
  pricing: boolean;
}

/**
 * **The raised counts the March is to draw, when the plan's own table already holds them** (S-149; owner,
 * 2026-09-30: *"make the positions selector (as is, tight…) use the already computed assemblyscript values
 * (should be same as engine/TS)"*).
 *
 * The block under the plan prices the five positions on **every stop of the bar** before a player asks for any
 * of them, in the wasm — and until this hook existed a press answered the same question again, one position at
 * a time, through the exhaustive raise's own search. Same counts (experiment 184 holds the two paths together
 * on every stop of every benchmark army), and the press paid for them twice. This is the source the March
 * reads first now: `liftedCounts`'s own row, for the stop and the position on screen.
 *
 * `counts: null` — and the March keeps its own path, the climb and then the search — on `As is`, on any march
 * the plan did not size (`pricedRaise`), and while the bar is still being priced. **The last of those is the
 * one that had to be told apart from the others** (S-149's follow-up, the owner the next morning: *"it seems
 * when clicking again on generate, we're still using ts tight version instead of assembly script"*): a Generate
 * re-prices the bar, and in the frames before its rows land the March was starting the exhaustive search it
 * had just paid the wasm not to need. `pricing` is that fact, so the March waits instead.
 *
 * It is also the hook that starts the pricing, from the battle summary's control, and it hands the priced
 * stop (`trades`) to the control's hover preview. The table that used to ask for it under the plan is gone
 * (owner, 2026-10-07).
 */
export function usePricedRaise(
  snapshot: ResultSnapshot | null,
  plan: CampaignPlan | null,
  position: number,
  modes: RaiseModes,
  canRaise: boolean,
): PricedRaise {
  const key = usePositionsKey(snapshot, plan, canRaise);
  const trades = usePositions(snapshot, plan, position, canRaise);
  const pricing = usePositionsStore((state) => {
    const entry = state.entry;
    if (key === null || !canPrice()) return false;
    // **Nothing is settled for this key yet.** Either the store holds another plan's bar (which is what a
    // Generate leaves in it for the frame before its own ask goes out, `ask`), or this stop's own job is still
    // out — and both mean a table is coming, which is the whole of what `pricing` says.
    if (entry === null || entry.key !== key) return true;
    return entry.stops[position] === 'out';
  });
  if (snapshot === null || plan === null) return { counts: null, trades: null, pricing: false };
  return {
    counts: pricedRaise(snapshot.result, pickOf(plan, position).counts, trades, modes),
    trades,
    pricing,
  };
}
