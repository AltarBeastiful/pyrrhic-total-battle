/**
 * The two ways a march is computed (S-53).
 *
 * **Generate** is a fresh solve: it runs the sizer, or the priority search when an objective is chosen,
 * on the whole army the forms describe, and forgets every edit made in the March since the last one.
 * **A March edit** — leaving a type out, putting one back — re-sizes the types that are left, in place:
 * the sizer only, never the search, and never a word about the result being out of date, because the
 * form has not moved.
 *
 * Plain functions rather than a hook: the same run has to be startable from an event handler in either
 * half of the page, and everything it reads or writes already lives in a store.
 */
import { planMarch, withMethod } from '@/engine';
import type { StackRequest } from '@/engine/types';
import { buildPlanRequest, buildStackRequest } from '@/state/derive';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { getCalcClient } from '@/ui/calcClient';
import { readStoredResult, useResultStore } from '@/ui/resultStore';
import { CAMPAIGN } from '@/config';
import { isAbortError } from '@/worker/client';

import { setupFingerprint, tradeoffFigures, useRunStore } from './runStore';

/**
 * The two wall-clock budgets, as `src/config.ts` sets them. They are re-exported under the names the March
 * has always used — a search long enough for the greedy descent and a few restarts on a phone, and a plan
 * that looks at far more candidates than a single-march search — and each is a cap rather than a duration:
 * the engine stops when it has finished, answers with its best find when the cap arrives, and a longer one
 * buys a better answer rather than a different kind of one.
 */
export const SEARCH_BUDGET_MS = CAMPAIGN.budgets.search;
export const PLAN_BUDGET_MS = CAMPAIGN.budgets.plan;

/** Size the stacks for the active march (running a priority search first when one is selected). */
export async function runGenerate(): Promise<void> {
  const state = useStore.getState();
  const profile = selectActiveProfile(state);
  const setup = selectActiveSetup(state);
  const results = useResultStore.getState();
  if (!profile || !setup) {
    results.setError('No march is selected.');
    return;
  }

  // What is on screen now becomes "the previous run" the moment a new result lands, and only then:
  // a cancelled or failed run must not make the recap compare a result with itself.
  const previous = results.last?.summary ?? null;

  const run = useRunStore.getState();
  run.cancel();
  const controller = new AbortController();
  // Stamped at the start, not at the end: what the answer on screen belongs to is the setup the run
  // was launched with, so an edit made while the search runs already counts as stale.
  run.start(controller, setupFingerprint(profile, setup));
  results.setRunning(true);

  try {
    const request = buildStackRequest(profile, setup);
    const client = getCalcClient();
    const common = { request, profileId: profile.id, setupId: setup.id };

    // The plan (S-55) is its own kind of run: the army alone decides the marches, the counts and the
    // split between silver and the mercenary stock, and the answer is the whole sequence rather than one
    // march. Without a silver box the plan is the most efficient one the army points to; with it, the best
    // that budget buys. Either way the march on screen is the plan's own first march, so a March edit
    // re-sizes exactly what is drawn.
    if (setup.options.method === 'plan') {
      const planned = await client.plan(
        { ...buildPlanRequest(profile, setup), budgetMs: PLAN_BUDGET_MS },
        controller.signal,
      );
      const chosen = planned.recommend ?? planned;
      const itsMarch = planMarch(request, chosen.counts);
      /**
       * The caps the march's request carries are **the hired spend the plan decided**, and nothing else.
       *
       * The plan rations the *hired stock* over the marches, so a March edit must not spend more of it than
       * the plan does. It does not ration the troops: they are rationed by leadership, which the sizer
       * already respects. Capping the troop types at the plan's own counts as well — which is what this did
       * until 2026-09-15 — left a left-out stack's leadership **unused**: every surviving type was already at
       * its ceiling, so leaving one out changed nothing at all (measured, `tools/theorycraft/out/76-plan-resize.md`;
       * the owner's *"before, when I left out a troop, it would equilibrate again the troops and mercs"*).
       */
      const hiredCaps: Record<string, number> = {};
      for (const unit of request.units) {
        const count = chosen.counts[unit.id];
        if (unit.pool === 'authority' && count !== undefined) hiredCaps[unit.id] = count;
      }
      const marchRequest: StackRequest = {
        ...withMethod(request, 'elite'),
        caps: { ...request.caps, ...hiredCaps },
      };
      useRunStore.getState().rememberPrevious(previous);
      useResultStore.getState().setResult({ ...common, request: marchRequest, ...itsMarch });
      useRunStore.getState().finish(Object.keys(chosen.counts), null, planned);
      return;
    }

    if (setup.priority === 'none') {
      const { result, summary } = await client.stack(request, controller.signal);
      useRunStore.getState().rememberPrevious(previous);
      useResultStore.getState().setResult({ ...common, result, summary });
      // Every type the account can field was offered to the sizer; what it could not pay for is in
      // `result.dropped`, with the reason the left-out row shows.
      useRunStore.getState().finish(request.units.map((unit) => unit.id));
      return;
    }

    const found = await client.search(
      { request, objective: setup.priority, budgetMs: SEARCH_BUDGET_MS },
      (progress) => {
        useRunStore.getState().setProgress(progress);
      },
      controller.signal,
    );
    const kept = new Set(found.includedUnitIds);
    const left = request.units.map((unit) => unit.id).filter((id) => !kept.has(id));
    useRunStore.getState().rememberPrevious(previous);
    useResultStore.getState().setResult({ ...common, result: found.result, summary: found.summary });
    // The search's own first evaluation is the army with every type in it: keep it, it is the only way to
    // show what the winning selection gave up (PLAN §3.6).
    useRunStore.getState().finish([...found.includedUnitIds], {
      objective: setup.priority,
      includedUnitIds: [...found.includedUnitIds],
      excludedUnitIds: left,
      selection: tradeoffFigures(found.summary),
      baseline: tradeoffFigures(found.baseline.summary),
    });
  } catch (error) {
    useRunStore.getState().finish([]);
    if (isAbortError(error)) {
      useResultStore.getState().setRunning(false);
      return;
    }
    useResultStore.getState().setError(refusalOf(error));
  }
}

/** Stop the run in flight; the result already on screen is left alone. */
export function cancelGenerate(): void {
  useRunStore.getState().cancel();
}

/**
 * What to tell a player when a run could not be finished (design rule 26: nothing the engine says in its own
 * vocabulary reaches the screen).
 *
 * The plan is the one method that can **refuse outright**: it plans by spreading the hired stock over the
 * marches the player set, so an account that holds no mercenaries leaves it nothing to spread, and the
 * engine says so in a sentence written for a programmer. Everything else is passed through unchanged — a
 * run that fails for another reason is a bug, and hiding the message would only make it harder to report.
 */
export function refusalOf(error: unknown): string {
  if (error instanceof Error && error.message.includes('no feasible plan')) {
    return (
      'There is no campaign to plan from this army. This method spreads the hired stock you own over the ' +
      'marches you set, so it needs your mercenaries filled in first.'
    );
  }
  return error instanceof Error ? error.message : 'The calculation could not be finished.';
}

/** Abort handle of the re-size in flight: two quick presses must not race each other onto the screen. */
let resizing: AbortController | null = null;

/**
 * Re-size the march on screen after a March edit, without a Generate.
 *
 * Only the sizer runs, and only on the types that are left: a priority search is an answer to the
 * objective, and re-running it would overwrite the player's own tweak with the solver's opinion. The
 * *whole* available army stays in the snapshot's request — it is what the left-out row lists — and the
 * filtered copy is what the engine is called with.
 *
 * Nothing here touches `lastRunFingerprint`: a tweak is still an answer to the form as it stands, so
 * the march must not go stale under it.
 */
export async function resizeMarch(includedUnitIds: string[], leftOutByPlayer: string[]): Promise<void> {
  const snapshot = useResultStore.getState().last;
  if (snapshot === null) return;
  useRunStore.getState().setIncluded(includedUnitIds, leftOutByPlayer);

  resizing?.abort();
  const controller = new AbortController();
  resizing = controller;
  const included = new Set(includedUnitIds);

  try {
    const { result, summary } = await getCalcClient().stack(
      { ...snapshot.request, units: snapshot.request.units.filter((unit) => included.has(unit.id)) },
      controller.signal,
    );
    if (controller.signal.aborted) return;
    useResultStore.getState().setResult({
      request: snapshot.request,
      result,
      summary,
      profileId: snapshot.profileId,
      setupId: snapshot.setupId,
      // The same run, re-sized: keeping the stamp keeps everything keyed on it (the objective
      // comparison, five searches long) from starting again at every press on a pill.
      at: snapshot.at,
    });
  } catch (error) {
    if (isAbortError(error)) return;
    useResultStore
      .getState()
      .setError(error instanceof Error ? error.message : 'The march could not be re-sized.');
  }
}

/**
 * Put the cached result back after a reload (`pyrrhic.lastResult.v1`).
 *
 * Only a cache that belongs to the march active *now* is restored — another profile or another setup
 * would put numbers on screen that no input explains. The request is not cached (it carries the whole
 * unit table of the march), so it is rebuilt from the profile before the snapshot goes back in the store.
 */
export function restoreLastResult(): boolean {
  const state = useStore.getState();
  const profile = selectActiveProfile(state);
  const setup = selectActiveSetup(state);
  if (!profile || !setup) return false;
  if (useResultStore.getState().last !== null) return false;

  const stored = readStoredResult();
  if (!stored || stored.profileId !== profile.id || stored.setupId !== setup.id) return false;

  try {
    const request = buildStackRequest(profile, setup);
    useResultStore.getState().setResult({
      request,
      result: stored.result,
      summary: stored.summary,
      profileId: stored.profileId,
      setupId: stored.setupId,
      at: stored.at,
    });
    useResultStore.getState().setManualCounts(stored.counts);
    // What the sizer was given the first time round, read back off its own answer: the stacks it
    // fielded plus the types it had to drop. The player's own leave-outs are not cached, so a
    // restored march reads as the solver's, which is what it was before any tweak.
    useRunStore
      .getState()
      .setIncluded(
        [
          ...stored.result.stacks.map((stack) => stack.unitId),
          ...stored.result.dropped.map((entry) => entry.unitId),
        ],
        [],
      );
    return true;
  } catch (error) {
    console.warn('[pyrrhic] the cached result could not be restored', error);
    return false;
  }
}
