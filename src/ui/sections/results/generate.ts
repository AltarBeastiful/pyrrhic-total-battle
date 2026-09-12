/**
 * The "Generate" run, shared by the Housing section (which owns the button) and the Results section
 * (which re-runs it after a unit type is removed from the formation).
 *
 * Plain functions rather than a hook: the same run has to be startable from an event handler in either
 * section, and everything it reads or writes already lives in a store.
 */
import { buildStackRequest } from '@/state/derive';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { getCalcClient } from '@/ui/calcClient';
import { readStoredResult, useResultStore } from '@/ui/resultStore';
import { isAbortError } from '@/worker/client';

import { useRunStore } from './runStore';

/**
 * Wall-clock budget of a priority search. Long enough for the greedy descent and a few restarts on a
 * phone, short enough that the button never looks stuck; the search returns its best find when it runs out.
 */
export const SEARCH_BUDGET_MS = 8_000;

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

  const run = useRunStore.getState();
  run.cancel();
  const controller = new AbortController();
  run.start(controller);
  results.setRunning(true);

  try {
    const request = buildStackRequest(profile, setup);
    const client = getCalcClient();
    const common = { request, profileId: profile.id, setupId: setup.id };

    if (setup.priority === 'none') {
      const { result, summary } = await client.stack(request, controller.signal);
      useResultStore.getState().setResult({ ...common, result, summary });
      useRunStore.getState().finish([]);
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
    useResultStore.getState().setResult({ ...common, result: found.result, summary: found.summary });
    useRunStore.getState().finish(request.units.map((unit) => unit.id).filter((id) => !kept.has(id)));
  } catch (error) {
    useRunStore.getState().finish([]);
    if (isAbortError(error)) {
      useResultStore.getState().setRunning(false);
      return;
    }
    useResultStore
      .getState()
      .setError(error instanceof Error ? error.message : 'The calculation could not be finished.');
  }
}

/** Stop the run in flight; the result already on screen is left alone. */
export function cancelGenerate(): void {
  useRunStore.getState().cancel();
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
    return true;
  } catch (error) {
    console.warn('[pyrrhic] the cached result could not be restored', error);
    return false;
  }
}
