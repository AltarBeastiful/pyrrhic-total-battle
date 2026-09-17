/**
 * View-only state of one "Generate" run: search progress, the running job's abort handle, the unit types
 * this march is sized on, the ones the player took out by hand, and what the search gave up to win.
 *
 * **The left-out list is run state** (S-53, owner 2026-09-13): it lives with the answer on screen, not
 * in the document. Generate is a fresh solve and forgets every earlier March edit; nothing here is
 * persisted, shared or synced.
 *
 * It is deliberately outside `useResultStore` (which holds the *result* and is read by the share
 * dialog): a progress tick must not invalidate anything that looks at the last result.
 */
import { create } from 'zustand';

import type { CampaignPlan, PlanRow } from '@/engine/plan';
import type { BattleSummary, Objective, SearchProgress } from '@/engine/types';
import type { BattleSetup, Profile } from '@/state/schema';

/**
 * Where on the bar the March is read (S-55; one control since the owner's review of 2026-09-14).
 *
 * The trade **is** the axis — its plans sorted cheapest-first, from the one that stretches silver
 * furthest to the one kindest to the hired stock — so a position on it is the choice, and the three
 * directions the toggle used to offer were three of its points rather than a different question. It is a
 * position and not an input: every plan on the frontier comes out of the same search, so moving along it
 * shows another answer instead of asking for one.
 *
 * It is a **position** and not a `PlanPick`: since S-59 the engine names which of the four answers a row
 * is (`src/engine/plan.ts`), and the two are different questions — "which plan is on screen" against
 * "what kind of answer is that row". Named `PlanPosition` so a file that needs both can import both.
 */
export type PlanPosition = number;

/** The plan a position names, clamped to the bar: a fresh search can be shorter than the last one. */
export function pickOf(plan: CampaignPlan, position: number): PlanRow {
  const rows = plan.alternatives;
  const at = Math.max(0, Math.min(rows.length - 1, Math.round(position)));
  // `alternatives` always carries at least the sweet spot — the engine pushes it first, whatever the
  // band does — so the fallback is defensive: a plan of an older shape still draws as a row rather than
  // throwing on a property it has not got.
  return rows[at] ?? { ...plan, pick: 'sweet-spot', label: '', bestFor: { silver: false, hired: false } };
}

/** Where a plan's own figures sit on the frontier it was carried with (`null` when the list has no copy). */
function positionOf(plan: CampaignPlan, wanted: { silver: number; totalDamage: number }): number | null {
  const at = plan.alternatives.findIndex(
    (point) => point.silver === wanted.silver && point.totalDamage === wanted.totalDamage,
  );
  return at < 0 ? null : at;
}

/**
 * Where the **sweet spot** sits on the frontier — the plan the engine weighed both resources to choose —
 * or `null` when there is no such point. A silver box makes the plan *be* the answer (there is nothing
 * left to balance), and only then does the engine leave `recommend` out; the bar is drawn without a
 * marker, because a marker on a plan nobody weighed would be pointing at a spot that does not exist.
 *
 * **Read off `recommend` and not off `pick: 'sweet-spot'`** (S-59, considered and left alone). The engine
 * marks a sweet-spot row whether or not a budget was given, so the `pick` would answer an index in a case
 * where this function promises `null` — the two agree on every plan the app can produce, and disagree on
 * the one a caller that passes `silverBudget` gets. A simplification that changes an exported answer is
 * not a simplification.
 */
export function sweetSpotOf(plan: CampaignPlan): number | null {
  return plan.recommend === undefined ? null : positionOf(plan, plan.recommend);
}

/**
 * Where the frontier opens: on the plan the engine recommends, which is the one it weighed both resources
 * to choose. Found by the plan's own figures, because the list carries a copy of it rather than the object.
 */
export function defaultPlanPosition(plan: CampaignPlan): number {
  return sweetSpotOf(plan) ?? positionOf(plan, plan) ?? 0;
}

/** The handful of figures the trade-off table compares; everything else in a summary is noise there. */
export interface TradeoffFigures {
  /** Hits your army lands before it is wiped out, the monster striking first. */
  friendlyHits: number;
  minDamage: number;
  maxDamage: number;
  avgDamage: number;
  silver: number;
  gold: number;
  dragonCoins: number;
}

/**
 * What a priority search traded away: its winning selection against the army you would have marched
 * with every unit type (`SearchResult.baseline`). Kept for the run, not for the document — it explains
 * the result on screen and nothing else.
 */
export interface SearchTradeoff {
  objective: Objective;
  includedUnitIds: string[];
  /** Types the search left out of the winner, in request order. */
  excludedUnitIds: string[];
  selection: TradeoffFigures;
  baseline: TradeoffFigures;
}

/** The seven figures of a summary the trade-off table reads. */
export function tradeoffFigures(summary: BattleSummary): TradeoffFigures {
  return {
    friendlyHits: summary.journals.enemyFirst.friendlyHits,
    minDamage: summary.minDamage,
    maxDamage: summary.maxDamage,
    avgDamage: summary.avgDamage,
    silver: summary.recovery.silver,
    gold: summary.recovery.gold,
    dragonCoins: summary.recovery.dragonCoins,
  };
}

/**
 * Everything a march is computed from, as one string: the active setup (housing, enemy, method,
 * priority, recovery plan) and the parts of the profile the engine reads (troop ranges and
 * exclusions, mercenaries, bonus sources, recovery settings).
 *
 * Compared with the fingerprint taken when the last run started, it answers the one question the
 * Generate button asks itself — "is what is on screen still the answer to what is in the form?".
 * Cheap enough to take on every change of those objects: the store hands out the same references
 * until one of them is edited, so it is recomputed only when something really moved.
 *
 * The March's own edits are *not* in it, and must never be: leaving a type out re-sizes the march in
 * place, which is an answer to the form as it stands, not a reason to call the answer out of date.
 */
export function setupFingerprint(profile: Profile | undefined, setup: BattleSetup | undefined): string {
  if (profile === undefined || setup === undefined) return '';
  return JSON.stringify({
    setup,
    troops: profile.troops,
    mercenaries: profile.mercenaries,
    sources: profile.sources,
    recovery: profile.recovery,
  });
}

export interface RunState {
  /** Last progress tick of a priority search; `null` outside a search. */
  progress: SearchProgress | null;
  /**
   * Whether the March's counts are being edited by hand — the mode "Edit counts" turns on.
   *
   * It lives here rather than in `MarchSection` since 2026-09-15, when the row that switches it moved
   * to the foot of the left column while the stack pills it edits stayed in the March pane: the two
   * are on opposite sides of the page now, so the flag belongs to the *run* they both describe. Same
   * species as `planPick` — a view position about the answer on screen, forgotten by the next one.
   */
  editingCounts: boolean;
  setEditingCounts: (editing: boolean) => void;
  /**
   * The summary of the run *before* the one on screen, so the recap can say which way every figure
   * moved (design plan §7.5). It belongs to the run, not to the document: a reload starts again
   * with nothing to compare against rather than with a comparison nobody remembers making.
   */
  previousSummary: BattleSummary | null;
  /**
   * The setup fingerprint the last run was started with; `null` when nothing has run yet or the run
   * was cancelled. A different fingerprint now means the result on screen is stale.
   */
  lastRunFingerprint: string | null;
  /**
   * The unit types the march on screen is sized on: what the solver picked at the last Generate, then
   * what the player has put back or taken out since. Everything the account can field and is *not*
   * here was left out, and the left-out row says by whom.
   */
  includedUnitIds: string[];
  /** Of those, the ones the player took out by hand; the rest were the solver's own decision. */
  leftOutByPlayer: string[];
  /** The winner against the all-types army; `null` when the result did not come from a priority. */
  tradeoff: SearchTradeoff | null;
  /**
   * The plan, when the march came from "Complete optimization" (S-55): the marches it sized, the frontier
   * it chose from and what binds. It explains the answer on screen and nothing else, so it lives here
   * with the run and is never stored or shared.
   */
  plan: CampaignPlan | null;
  /**
   * Which plan on the frontier the March is showing, cheapest first. One control over the whole trade: the
   * ends are the plans that spend one resource to spare the other, and it opens where the engine's own
   * recommendation sits. A position, not an input — the plans are computed together, so the player chooses
   * a place on the trade without naming a silver figure.
   */
  planPick: PlanPosition;
  setPlanPick: (pick: PlanPosition) => void;
  /** Abort handle of the job in flight, so the Cancel button can stop it. */
  controller: AbortController | null;
  start: (controller: AbortController, fingerprint?: string) => void;
  setProgress: (progress: SearchProgress) => void;
  /** A finished Generate: the solver's own selection, and no March edit left over from before it. */
  finish: (includedUnitIds: string[], tradeoff?: SearchTradeoff | null, plan?: CampaignPlan | null) => void;
  /** A March edit: the new list to size on, and who is out by hand. */
  setIncluded: (includedUnitIds: string[], leftOutByPlayer: string[]) => void;
  cancel: () => void;
  /** Keep the summary a new result replaces; called with `null` when there is nothing to keep. */
  rememberPrevious: (summary: BattleSummary | null) => void;
  reset: () => void;
}

export const useRunStore = create<RunState>()((set, get) => ({
  progress: null,
  editingCounts: false,
  previousSummary: null,
  lastRunFingerprint: null,
  includedUnitIds: [],
  leftOutByPlayer: [],
  tradeoff: null,
  plan: null,
  planPick: 0,
  controller: null,
  start: (controller, fingerprint) => {
    set({
      controller,
      progress: null,
      // A fresh solve is not an edit of the previous one, so the mode the last one left on goes off
      // with the answer it belonged to.
      editingCounts: false,
      includedUnitIds: [],
      leftOutByPlayer: [],
      tradeoff: null,
      plan: null,
      planPick: 0,
      lastRunFingerprint: fingerprint ?? null,
    });
  },
  setProgress: (progress) => {
    set({ progress });
  },
  setEditingCounts: (editingCounts) => {
    set({ editingCounts });
  },
  finish: (includedUnitIds, tradeoff = null, plan = null) => {
    set({
      controller: null,
      progress: null,
      includedUnitIds,
      leftOutByPlayer: [],
      tradeoff,
      plan,
      // a fresh plan opens on the one it recommends rather than at the cheap end of its frontier
      planPick: plan === null ? 0 : defaultPlanPosition(plan),
    });
  },
  setPlanPick: (planPick) => {
    set({ planPick });
  },
  setIncluded: (includedUnitIds, leftOutByPlayer) => {
    set({ includedUnitIds, leftOutByPlayer });
  },
  cancel: () => {
    get().controller?.abort();
    // A cancelled run produced no result, so the fingerprint it was started with means nothing: the
    // button goes back to "ready" rather than claiming the setup changed under an answer.
    set({ controller: null, progress: null, lastRunFingerprint: null });
  },
  rememberPrevious: (summary) => {
    set({ previousSummary: summary });
  },
  reset: () => {
    set({
      progress: null,
      editingCounts: false,
      previousSummary: null,
      lastRunFingerprint: null,
      includedUnitIds: [],
      leftOutByPlayer: [],
      tradeoff: null,
      plan: null,
      planPick: 0,
      controller: null,
    });
  },
}));
