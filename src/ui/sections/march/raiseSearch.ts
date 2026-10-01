/**
 * **The March's one asynchronous control** (S-143b): the exhaustive raise, asked for and remembered.
 *
 * Every other raise position is arithmetic over the march on screen and is derived during render
 * (`raise.ts`, a millisecond at worst). `Best v2` is a search over up to a million count vectors, measured
 * from ~1 ms to **~50 s** (experiment 182, `tools/theorycraft/out/182-v2-cost.md`), so it cannot be derived in
 * a render, cannot be awaited in one, and must not be allowed to freeze the page. This file is the whole of
 * what that costs the rest of the app: a hook the March calls, a store holding one answer, and a worker.
 *
 * **It is the second source, not the first** (S-149). When the plan's own table has already priced the
 * position — which is every press of the control in the battle summary on a host with a worker and the bar
 * priced, the case `positionsSearch.ts` is built for — the March reads that row and this search is never
 * asked. What is left for it is the march the table does not describe: a March edit, a stop whose job failed,
 * and every position on a platform with no worker at all (where the block is not offered and this is the only
 * way a `Best v2` answers).
 *
 * **A bar that is still being priced is not one of those cases** (the owner, 2026-10-01: *"it seems when
 * clicking again on generate, we're still using ts tight version instead of assembly script"*): a Generate
 * re-prices every stop, and while those rows are on their way the March draws the climb and **holds this
 * search back**, rather than starting a walk the wasm is about to finish for it.
 *
 * **Why a worker of its own** (`createCalcClient`, not the page's shared `getCalcClient`): a worker runs one
 * job at a time, and this is the only job in the app measured in tens of seconds. On the page's worker a
 * `Best v2` press would sit in front of the next Generate and hold it there — the player would wait for a
 * search they had already stopped looking at before the button they just pressed did anything. Two workers
 * cost a second wasm kernel load and nothing else. **The refactor this is packaged for**: when the search
 * moves into the plan's own shape search or the AssemblyScript kernel (`docs/plans/best-v2.md` §3), the
 * caller is this hook and the answer is a count per walked stack — neither the March nor the bench has to
 * change.
 *
 * **The key, and why there is one.** An answer belongs to one march *and* one position: the stop on screen
 * and which pools stand on `v2`. Every tick of the count editor and every keystroke in the setup form
 * re-renders the March, and a search must not be restarted by any of them — so the answer is filed under
 * `raiseSearchKey`, and re-asked only when that string really moves. A job that lands after its key has
 * been replaced is dropped rather than written: the March is already showing a different march.
 *
 * **What the March shows while it runs**: `raise.ts` answers an exhaustive position with the climb, so the counts, the figures and
 * every sentence are drawn from a march the game would take, from the first frame. The exhaustive answer
 * replaces them when it lands, and it is seeded with exactly those counts (`exact.ts`), so it can only ever
 * *raise* the damage — there is no window in which the pane shows something worse than `Best`.
 *
 * **One caveat, inherited from the app's own client and worth stating where it bites hardest.**
 * `createCalcClient` falls back to running the job on the main thread when the platform has no `Worker` or a
 * CSP refuses one — the same fallback the plan search uses. Everywhere else that costs a few seconds; here it
 * costs up to ~50, on the thread that would have drawn the loader. It is not new (the plan can already block
 * the page on such a platform), and it is the price of the app's one-client design rather than of this
 * control; a platform that cannot run a worker is one where this position is simply expensive.
 */
import { useEffect } from 'react';
import { create } from 'zustand';

import { createCalcClient, isAbortError } from '@/worker/client';
import type { CalcClient } from '@/worker/client';
import type { StackResult } from '@/engine/types';
import type { ResultSnapshot } from '@/ui/resultStore';

import { exhaustivePools } from './exact';
import type { ExactRaiseAnswer } from './exact';
import type { RaiseModes } from './raise';

/**
 * **What an answer belongs to: one result and one position.**
 *
 * The march is named by the **identity of its result object**, and not by `snapshot.at`. The stamp is
 * deliberately shared across a re-size — `resizeMarch` re-files the new march under the old one's `at`,
 * *"the same run, re-sized"*, so that the objective comparison does not start again at every press on a
 * pill — and a key built on it would therefore let a search asked about the march **before** a put-back
 * answer the march **after** it. That answer is not merely stale: the troops that came back lower the
 * shelter's floor, so its counts can sit over the new ceiling (with `MarchShelterNote` suppressed, because a
 * raise is on), under the new plan's own count, or below the new `Best`. Every writer of `last` stores a
 * fresh `StackResult` — a run, a re-size, a restored cache — so identity moves exactly when the march does.
 */
const resultIds = new WeakMap<StackResult, number>();
let lastResultId = 0;

/**
 * **The number of one result object**, handed out the first time it is seen. The March's identity is the
 * identity of its result and not the stamp on the snapshot (see `raiseSearchKey`), so everything keyed by a
 * march asks this — the exhaustive raise here, and the positions priced beside it (`positionsSearch.ts`).
 */
export function marchId(result: StackResult): number {
  const known = resultIds.get(result);
  if (known !== undefined) return known;
  lastResultId += 1;
  resultIds.set(result, lastResultId);
  return lastResultId;
}

/**
 * The key of one march and position, as one string so a store entry is compared in one comparison. It takes
 * the **result** rather than the whole snapshot because that is the whole of what it is about: the request
 * is the same object across a re-size, and everything else on the snapshot is provenance.
 */
export function raiseSearchKey(result: StackResult, modes: RaiseModes): string {
  return `${String(marchId(result))}|${modes.authority}|${modes.dominance}`;
}

/** The one answer the March may be showing, and what it is about. */
export interface RaiseSearchEntry {
  /** `raiseSearchKey` of the march and position this is filed under. */
  key: string;
  /** The counts found, `null` while the search runs or when it failed. */
  answer: ExactRaiseAnswer | null;
  /** `running` until the job settles; `done` once it has answered, however it ended. */
  status: 'running' | 'done';
}

export interface RaiseSearchState {
  entry: RaiseSearchEntry | null;
  /** File a request: the March knows one is in flight for this key, and shows the shipped counts meanwhile. */
  begin: (key: string) => void;
  /** Answer the job that is in flight, if its key is still the one on screen. */
  settle: (key: string, answer: ExactRaiseAnswer | null) => void;
  /** Stop the job in flight, throw the worker away and forget the answer. */
  stop: () => void;
}

/**
 * The client is **module state and not store state**: it is a Worker and an `AbortController`, neither of
 * which is anything a component should re-render on, and there is exactly one of each for the whole page.
 */
let client: CalcClient | null = null;
let controller: AbortController | null = null;

function calc(): CalcClient {
  client ??= createCalcClient();
  return client;
}

/**
 * **`terminate` is the only way to interrupt a search that is already inside the box.** `exactSearch` has no
 * checkpoint to poll — it is a walk of a box, not a loop with a shape the caller can cut short — and the
 * client's own `cancel` merely settles the promise locally while the worker keeps churning. Throwing the
 * worker away costs one restart on the next press, against a search measured in tens of seconds.
 */
function kill(): void {
  controller?.abort();
  controller = null;
  client?.dispose();
  client = null;
}

export const useRaiseSearchStore = create<RaiseSearchState>()((set, get) => ({
  entry: null,
  begin: (key) => {
    set({ entry: { key, answer: null, status: 'running' } });
  },
  settle: (key, found) => {
    // **A job that lands after its key has been replaced is dropped**: the March it was asked about is not
    // on screen any more, and writing its counts over the current one would be a march nobody asked for.
    if (get().entry?.key !== key) return;
    set({ entry: { key, answer: found, status: 'done' } });
  },
  stop: () => {
    kill();
    set({ entry: null });
  },
}));

/**
 * Ask the client for the exhaustive answer, and hold it under its key. Called by the hook below and by
 * nothing else — the store files and settles, and the asking is here, so that everything asynchronous about
 * the search is in one place.
 *
 * **A failed job is settled as "no answer" rather than raised at the player.** The fallback is the shipped
 * `Best`'s counts, which is a march the game would take and one the search can only improve on; a pane that
 * shouted about a worker it could not reach would be worse than the figures it already has.
 */
function ask(key: string, snapshot: ResultSnapshot, modes: RaiseModes): void {
  kill();
  controller = new AbortController();
  const { signal } = controller;
  useRaiseSearchStore.getState().begin(key);
  calc()
    .raise({ request: snapshot.request, base: snapshot.result, modes }, signal)
    .then(
      (answer) => {
        useRaiseSearchStore.getState().settle(key, answer);
      },
      (error: unknown) => {
        // A cancelled job is not a failure and has already been forgotten; anything else is settled as
        // "no answer", which leaves the March on the climb's counts rather than on nothing.
        if (isAbortError(error)) return;
        useRaiseSearchStore.getState().settle(key, null);
      },
    );
}

export interface RaiseSearchView {
  /** What to merge over the shipped counts, or `null` while none is known (running, failed, or not asked). */
  counts: Record<string, number> | null;
  /** Whether a search is in flight for the march and position on screen — the one thing the control says. */
  running: boolean;
}

/**
 * **The exhaustive raise for the march on screen**, asked for when the position calls for it and forgotten
 * when it does not. It reads the same two things the March does — the snapshot and the control's positions
 * — and it is the *only* place in the app that starts this search, so a second component calling it costs
 * one string comparison rather than a second job.
 */
export function useRaiseSearch(
  snapshot: ResultSnapshot | null,
  modes: RaiseModes,
  canRaise: boolean,
): RaiseSearchView {
  const wanted = snapshot !== null && canRaise && exhaustivePools(modes).length > 0;
  const key = wanted && snapshot !== null ? raiseSearchKey(snapshot.result, modes) : null;
  const entry = useRaiseSearchStore((state) => state.entry);

  useEffect(() => {
    if (key === null || snapshot === null) {
      // Off the position (or off the march): the search that was running answers a question nobody is
      // asking any more, and holding a worker for it would be holding a thread for nothing.
      if (useRaiseSearchStore.getState().entry !== null) useRaiseSearchStore.getState().stop();
      return;
    }
    if (useRaiseSearchStore.getState().entry?.key === key) return;
    ask(key, snapshot, modes);
  }, [key, snapshot, modes]);

  if (key === null || entry === null || entry.key !== key) return { counts: null, running: false };
  return {
    counts: entry.answer?.counts ?? null,
    running: entry.status === 'running',
  };
}
