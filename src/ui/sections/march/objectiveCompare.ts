/**
 * The objectives, side by side (investigation 0013 §5.3).
 *
 * A priority search reports the figure it optimised and nothing else, so a player who chooses
 * "Damage per silver" is never told what it cost them in average damage — and on an army the owner
 * has already hand-trimmed, four of the five objectives return byte-identical marches, which reads
 * as "choosing an objective changes nothing". The honest answer (design rule 29) is to run the other
 * objectives on the same request and print **min · avg · silver · gold for each of them**, so the
 * choice is a comparison rather than a claim.
 *
 * 0013 measured five searches at ~1.5 s on this army, which is why this is allowed to run at all.
 * It is still:
 *
 * - **started by hand or after the main run**, never in the middle of it — one worker, one queue;
 * - **cancellable** — the same `AbortController` the main run uses, so leaving the page or
 *   generating again stops it;
 * - **cached per fingerprint** — the key is the run the comparison belongs to (profile, setup and
 *   the instant the result landed), so folding the strip away and back does not recompute it, and a
 *   new march always does.
 *
 * It talks to the same shared worker client as `generate.ts` and owns no state in the document: a
 * comparison is an explanation of what is on screen, not something a march is saved with.
 */
import { useEffect } from 'react';
import { create } from 'zustand';

import type { Objective, StackRequest } from '@/engine/types';
import { getCalcClient } from '@/ui/calcClient';
import { useResultStore } from '@/ui/resultStore';
import { isAbortError } from '@/worker/client';

import type { TradeoffFigures } from './runStore';

/**
 * Half the main run's budget, per objective. Five searches at the full 8 s would be 40 s of worker
 * time for a strip nobody is waiting on; 0013 §4 reports every objective reaching the brute-force
 * optimum in ~300 ms since the restarts landed, so 4 s is ten times the measured need and still
 * bounds the whole comparison at 20 s in the worst case.
 */
export const COMPARE_BUDGET_MS = 4_000;

/** The five the bar offers, in the order the bar offers them ("No priority" is not an objective). */
export const COMPARED_OBJECTIVES = [
  'avgDamage',
  'minDamage',
  'damagePerSilver',
  'damagePerGold',
  'damagePerDragonCoin',
] as const satisfies readonly Objective[];

/** What one objective's own answer scores on the four figures every objective can be read on. */
export interface ObjectiveRow {
  objective: Objective;
  minDamage: number;
  avgDamage: number;
  silver: number;
  gold: number;
  /** Unit types that objective leaves at home. */
  dropped: number;
  /** The objective has no meaning for this army (a ratio whose denominator is zero everywhere). */
  unmeasurable: boolean;
}

/** Which figure a ratio objective divides by; the other two objectives divide by nothing. */
const DENOMINATOR: Partial<Record<Objective, keyof TradeoffFigures>> = {
  damagePerSilver: 'silver',
  damagePerGold: 'gold',
  damagePerDragonCoin: 'dragonCoins',
};

/**
 * Whether an objective can be compared at all on this army, read off the all-types march.
 *
 * The engine's own rule is "every candidate scored −∞ because its denominator was zero"
 * (`SearchResult.unmeasurable`). That is decidable from the baseline alone: dropping unit types can
 * only ever *lower* what a march costs, so a baseline that spends no dragon coins guarantees that no
 * subset of it spends any either — every candidate divides by zero, and the winner is simply the
 * plain march. Reading it here rather than threading a flag through the run keeps the answer in the
 * one place that explains the result.
 */
export function isUnmeasurable(objective: Objective, baseline: TradeoffFigures): boolean {
  const key = DENOMINATOR[objective];
  return key !== undefined && baseline[key] === 0;
}

/**
 * Run every objective on one request and read the four figures off each answer.
 *
 * Sequential on purpose: there is one calculation worker, and five searches posted at once would
 * interleave their time budgets and each return a worse answer than it would have alone.
 */
export async function compareObjectives(request: StackRequest, signal: AbortSignal): Promise<ObjectiveRow[]> {
  const client = getCalcClient();
  const rows: ObjectiveRow[] = [];
  const total = request.units.length;

  for (const objective of COMPARED_OBJECTIVES) {
    const found = await client.search({ request, objective, budgetMs: COMPARE_BUDGET_MS }, undefined, signal);
    rows.push({
      objective,
      minDamage: found.summary.minDamage,
      avgDamage: found.summary.avgDamage,
      silver: found.summary.recovery.silver,
      gold: found.summary.recovery.gold,
      dropped: total - found.includedUnitIds.length,
      unmeasurable: found.unmeasurable,
    });
  }

  return rows;
}

/** Everything the strip needs to draw itself, and the two verbs that drive it. */
export interface Comparison {
  rows: ObjectiveRow[] | null;
  running: boolean;
  /** Why the last attempt produced nothing; `null` when it produced something or never ran. */
  error: string | null;
  run: () => void;
  cancel: () => void;
}

/**
 * The comparison for one march, held outside React for the same reason `runStore` is: a job in
 * flight is an external process, and the component that draws its answer mounts and unmounts as the
 * March moves between the desktop pane and the phone sheet.
 *
 * **Exactly one entry**, keyed by the run it explains — profile, setup and the instant the result
 * landed. Folding the strip away and back, or crossing 1200 px, reads the same rows; a Generate is a
 * new fingerprint and recomputes them.
 */
interface CompareState {
  /** The run the rows belong to; `null` when nothing has been computed. */
  fingerprint: string | null;
  rows: ObjectiveRow[] | null;
  running: boolean;
  error: string | null;
  controller: AbortController | null;
  start: (request: StackRequest, fingerprint: string) => void;
  cancel: () => void;
}

export const useCompareStore = create<CompareState>()((set, get) => ({
  fingerprint: null,
  rows: null,
  running: false,
  error: null,
  controller: null,
  start: (request, fingerprint) => {
    const current = get();
    // Already answered, or answering, for this very march.
    if (current.fingerprint === fingerprint && (current.rows !== null || current.running)) return;
    current.controller?.abort();

    const controller = new AbortController();
    set({ fingerprint, rows: null, running: true, error: null, controller });

    compareObjectives(request, controller.signal)
      .then((rows) => {
        if (get().controller !== controller) return;
        set({ rows, running: false, controller: null });
      })
      .catch((reason: unknown) => {
        if (get().controller !== controller) return;
        set({
          running: false,
          controller: null,
          error: isAbortError(reason)
            ? null
            : reason instanceof Error
              ? reason.message
              : 'The objectives could not be compared.',
        });
      });
  },
  cancel: () => {
    get().controller?.abort();
    // A cancelled comparison is not an answer, so the fingerprint goes with it: pressing the strip's
    // own button starts it again rather than showing nothing for ever.
    set({ controller: null, running: false, fingerprint: null, rows: null, error: null });
  },
}));

/**
 * **A Generate always comes first.** There is one calculation worker and the comparison holds it for
 * up to five searches, so a press on Generate while the strip is still computing would sit behind
 * twenty seconds of work nobody is waiting on. The result store turning `running` is the earliest
 * signal that a march has been asked for, so the comparison steps aside there and the strip starts
 * it again — against the new march — once the answer lands.
 *
 * Subscribed once, at module scope, because the thing being guarded is one worker and not one
 * component: the strip mounts and unmounts as the March moves between the pane and the sheet.
 */
let mainRunning = useResultStore.getState().running;
useResultStore.subscribe((state) => {
  const was = mainRunning;
  mainRunning = state.running;
  if (state.running && !was) useCompareStore.getState().cancel();
});

export function useObjectiveComparison(
  request: StackRequest | null,
  fingerprint: string,
  enabled: boolean,
): Comparison {
  const state = useCompareStore();
  const mine = state.fingerprint === fingerprint;

  // Started *after* the main run, on the render that first draws the strip. The store is an external
  // system — a worker job with a lifetime of its own — so this is the effect telling it what the
  // page is now showing, not a component setting its own state.
  useEffect(() => {
    if (!enabled || request === null || mainRunning) return;
    useCompareStore.getState().start(request, fingerprint);
  }, [enabled, fingerprint, request]);

  return {
    rows: mine ? state.rows : null,
    running: mine && state.running,
    error: mine ? state.error : null,
    run: () => {
      if (request !== null) useCompareStore.getState().start(request, fingerprint);
    },
    cancel: () => {
      useCompareStore.getState().cancel();
    },
  };
}

export { isAbortError };
