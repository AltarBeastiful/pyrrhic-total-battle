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
import { largestSustained, planMarch, planRepeats, shelterCounts, withMethod } from '@/engine';
import type { CampaignPlan } from '@/engine/plan';
import type { BattleSummary, StackRequest, StackResult } from '@/engine/types';
import { buildPlanRequest, buildStackRequest } from '@/state/derive';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { getCalcClient } from '@/ui/calcClient';
import { readStoredResult, useResultStore } from '@/ui/resultStore';
import { CAMPAIGN } from '@/config';
import { isAbortError } from '@/worker/client';

import { pickOf, setupFingerprint, tradeoffFigures, useRunStore } from './runStore';
import type { MarchResize } from './runStore';

/**
 * The two wall-clock budgets, as `src/config.ts` sets them. They are re-exported under the names the March
 * has always used — a search long enough for the greedy descent and a few restarts on a phone, and a plan
 * that looks at far more candidates than a single-march search — and each is a cap rather than a duration:
 * the engine stops when it has finished, answers with its best find when the cap arrives, and a longer one
 * buys a better answer rather than a different kind of one.
 */
export const SEARCH_BUDGET_MS = CAMPAIGN.budgets.search;
const PLAN_BUDGET_MS = CAMPAIGN.budgets.plan;

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

/** What a March edit was: the types the press put back, and the ones it took out. */
export interface MarchEdit {
  putBack?: readonly string[];
  tookOut?: readonly string[];
}

/** One answer on its way to the screen: the march to draw, and the line to write under the pills. */
interface Resized {
  result: StackResult;
  summary: BattleSummary;
  resize: MarchResize;
}

/**
 * Re-size the march on screen after a March edit, without a Generate.
 *
 * **On a plan** (S-104; owner, 2026-09-19: *"I'm able to put it back in and the plan then computes safely
 * the best course of action with the new parameters in mind (the spot selected, monster or any other troop
 * put back) without putting out another, because then we're manually fixing the reco without clicking
 * Generate"*) the selected stop is re-sized **inside the plan's own rules**: `resizeMarchOver` over exactly
 * the troop types that are in, with that stop's hired counts as caps and every hired stack sheltered under
 * the lowest troop stack. Until then this ran the plain sizer on the filtered request — `sizeStacks` through
 * the worker's `stack` job, which knows the request's *full* mercenary caps and knows nothing about the
 * shelter, because the shelter lives inside `planCampaign` — so a put-back replaced a sheltered stop with an
 * unsheltered sizer march carrying the mercenaries on top. That is the owner's *"adding back troops doesn't
 * shield the mercs"*, reported three times.
 *
 * **On a sizer run** (Elite, Military Science) it is still the sizer over the types that are left — a
 * priority search is an answer to the objective, and re-running it would overwrite the player's own tweak
 * with the solver's opinion — but its answer is **sheltered** too (`shelterCounts`): the owner's rule is
 * about every stack the app generates, not about the plan alone. `sizeStacks` itself is untouched, so its
 * parity with TotalStack is untouched.
 *
 * The *whole* available army stays in the snapshot's request — it is what the left-out row lists — and the
 * filtered copy is what the engine is called with. Nothing here touches `lastRunFingerprint`: a tweak is
 * still an answer to the form as it stands, so the march must not go stale under it.
 */
export async function resizeMarch(
  includedUnitIds: string[],
  leftOutByPlayer: string[],
  edit: MarchEdit = {},
): Promise<void> {
  const snapshot = useResultStore.getState().last;
  if (snapshot === null) return;
  const run = useRunStore.getState();
  const plan = run.plan;
  const position = run.planPick;
  run.setIncluded(includedUnitIds, leftOutByPlayer);

  resizing?.abort();
  const controller = new AbortController();
  resizing = controller;
  const included = new Set(includedUnitIds);

  try {
    const resized =
      plan === null
        ? await sizedAgain(snapshot.request, included, edit, controller.signal)
        : await planStopAgain(snapshot.request, plan, position, included, controller.signal);
    if (controller.signal.aborted) return;
    if (resized === null) {
      useResultStore
        .getState()
        .setError('There is no march over those types: put a troop type back to size one.');
      return;
    }
    useResultStore.getState().setResult({
      request: snapshot.request,
      result: resized.result,
      summary: resized.summary,
      profileId: snapshot.profileId,
      setupId: snapshot.setupId,
      // The same run, re-sized: keeping the stamp keeps everything keyed on it (the objective
      // comparison, five searches long) from starting again at every press on a pill.
      at: snapshot.at,
    });
    useRunStore.getState().setResize(resized.resize);
  } catch (error) {
    if (isAbortError(error)) return;
    useResultStore
      .getState()
      .setError(error instanceof Error ? error.message : 'The march could not be re-sized.');
  }
}

/**
 * **One stop of the plan, re-sized in place** (S-104). The stop is the one the bar is reading — the plan's
 * own recommendation until the player moves it (`pickOf`, `planPick`) — and it is what says how many marches
 * the re-size has to keep affordable. The troops are **not** capped: they are rationed by leadership, and
 * capping them at the stop's counts is the 2026-09-15 defect written up in the plan branch of `runGenerate`
 * above.
 *
 * **Nor is the hired stock capped at the stop's own count any more** (S-107, 2026-09-19; the owner: *"taking
 * out one group, like SP1, doesn't compute again the mercs and I'm left with a merc stack that's below what
 * could be added with proper shielding"*). S-104 read the stop's counts as the ceiling, on the argument that
 * a count that can only fall keeps the rest of the plan safe. It does — and it also makes the edit he is
 * complaining about a no-op: taking a troop type out gives its leadership back to the stacks that are left,
 * which raises the troop floor, which shelters **more** hired units than the stop was standing under it, and
 * a ceiling at the stop's count throws every one of them away. See `capOf` below for what replaces it.
 */
async function planStopAgain(
  request: StackRequest,
  plan: CampaignPlan,
  position: number,
  included: Set<string>,
  signal: AbortSignal,
): Promise<Resized | null> {
  const stop = pickOf(plan, position);
  const troopIds: string[] = [];
  const hired: Record<string, number> = {};
  /** Hired types the player asked for that the account cannot spend on every march of this stop. */
  const noStock: string[] = [];
  /** The marches this stop's own march is played, which is what a mercenary count has to last. */
  const repeats = planRepeats(stop);
  /**
   * **The two kinds of hired stock cap differently** (S-104, S-102; the owner, 2026-09-19: *"the spot
   * selected, **monster or any other troop** put back"*, and *"apart from mercs, they can be trained just
   * like troops"*).
   *
   * A **monster** is capped at **its own pool** — `housing.dominance / cost`, the same bound `planCampaign`
   * gives an uncapped hired type — because it is *trained*, not spent: there is no stock of monsters to
   * ration over the horizon (`sustain` is `Infinity` for a dominance type since S-102), so a stop that
   * fields none of one the player owns has decided nothing about it. Its silver, its queue and its dragon
   * coins are billed on the answer like any other stack's.
   *
   * A **mercenary** is capped at what the account can spend on **every march this stop plays** (S-107):
   * `largestSustained(stock, repeats)`, the engine's own anchor — the stock the player entered, or the whole
   * authority pool for a type hired with no cap, read through the arithmetic `planCampaign` rations every
   * hired type by. That is the one bound the re-size must keep, because the campaign behind the march on
   * screen is sized on it; everything else is the sizer's business, and it is the sizer and the shelter that
   * decide the count the march actually fields (`resizeMarchOver` → `shelterUnder`). The stop's own count is
   * **not** a ceiling: it is what the troops sheltered *before* the edit, and the edit is what changes the
   * floor.
   *
   * A type the bound puts at nothing — an empty stock, or one too small to last the repeats — is named in
   * the pane rather than left to bounce back without a word.
   */
  const capOf = (unit: { id: string; pool: string; cost: number }): number => {
    if (unit.pool === 'dominance') {
      const inStop = stop.counts[unit.id] ?? 0;
      return Math.max(inStop, Math.floor(request.housing.dominance / Math.max(1, unit.cost)));
    }
    const held = request.caps[unit.id];
    // A mercenary hired with no cap is bounded by its own pool and never runs out (`planCampaign`'s
    // `unlimited`): there is no stock to make last, so the pool is the whole of the bound.
    if (held === undefined) return Math.floor(request.housing.authority / Math.max(1, unit.cost));
    return largestSustained(held, repeats);
  };
  for (const unit of request.units) {
    if (!included.has(unit.id)) continue;
    if (unit.pool === 'leadership') {
      troopIds.push(unit.id);
      continue;
    }
    const cap = capOf(unit);
    hired[unit.id] = cap;
    if (cap <= 0) noStock.push(unit.id);
  }
  const answer = await getCalcClient().resize({ request, within: { troopIds, hired } }, signal);
  if (answer === null) return null;
  const { result, summary } = planMarch(request, answer.counts);
  // Read off the **stop** rather than off the press: two put-backs in a row both show, in the order a
  // player would say them, whichever pill was pressed last.
  const inStop = new Set(Object.keys(stop.counts).filter((id) => (stop.counts[id] ?? 0) > 0));
  const putBack = request.units.map((unit) => unit.id).filter((id) => included.has(id) && !inStop.has(id));
  const named = new Set(noStock);
  return {
    result,
    summary,
    resize: {
      putBack,
      tookOut: [...inStop].filter((id) => !included.has(id)),
      // What was asked for and is not in the march. A mercenary the stop spends none of is said in its own
      // words below (`noStock`), so it is not counted twice.
      unfielded: [
        ...new Set([...answer.unfielded, ...putBack.filter((id) => (answer.counts[id] ?? 0) <= 0)]),
      ].filter((id) => !named.has(id)),
      noStock: noStock.filter((id) => (answer.counts[id] ?? 0) <= 0),
      inPlan: true,
    },
  };
}

/** A March edit on a sizer run: the sizer over the types that are left, with its answer sheltered. */
async function sizedAgain(
  request: StackRequest,
  included: Set<string>,
  edit: MarchEdit,
  signal: AbortSignal,
): Promise<Resized> {
  const { result, summary } = await getCalcClient().stack(
    { ...request, units: request.units.filter((unit) => included.has(unit.id)) },
    signal,
  );
  const counts: Record<string, number> = {};
  for (const stack of result.stacks) counts[stack.unitId] = stack.count;
  // Every hired stack under the lowest troop stack, on this path too (S-104): the sizer sizes them to a
  // matched HP, which is exactly the line the enemy strikes first.
  const safe = shelterCounts(request, counts);
  const lowered = Object.keys(safe).some((id) => safe[id] !== counts[id]);
  const shown = lowered ? planMarch(request, safe) : { result, summary };
  const putBack = [...(edit.putBack ?? [])];
  return {
    result: shown.result,
    summary: shown.summary,
    resize: {
      putBack,
      tookOut: [...(edit.tookOut ?? [])],
      unfielded: putBack.filter((id) => (safe[id] ?? 0) <= 0),
      // There is no stop on this path, so nothing can be short of the stock a stop decided to spend.
      noStock: [],
      inPlan: false,
    },
  };
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
