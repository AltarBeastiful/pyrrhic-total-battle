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

import type { CompleteResult } from '@/engine/campaign';
import type { BattleSummary, Objective, SearchProgress } from '@/engine/types';
import type { BattleSetup, Profile } from '@/state/schema';

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
   * The whole campaign search, when the march came from "Complete optimization" (S-54): the winning
   * sizing, its ten marches and every spend level it was compared against. It explains the answer on
   * screen and nothing else, so it lives here with the run and is never stored or shared.
   */
  campaign: CompleteResult | null;
  /** Abort handle of the job in flight, so the Cancel button can stop it. */
  controller: AbortController | null;
  start: (controller: AbortController, fingerprint?: string) => void;
  setProgress: (progress: SearchProgress) => void;
  /** A finished Generate: the solver's own selection, and no March edit left over from before it. */
  finish: (
    includedUnitIds: string[],
    tradeoff?: SearchTradeoff | null,
    campaign?: CompleteResult | null,
  ) => void;
  /** A March edit: the new list to size on, and who is out by hand. */
  setIncluded: (includedUnitIds: string[], leftOutByPlayer: string[]) => void;
  cancel: () => void;
  /** Keep the summary a new result replaces; called with `null` when there is nothing to keep. */
  rememberPrevious: (summary: BattleSummary | null) => void;
  reset: () => void;
}

export const useRunStore = create<RunState>()((set, get) => ({
  progress: null,
  previousSummary: null,
  lastRunFingerprint: null,
  includedUnitIds: [],
  leftOutByPlayer: [],
  tradeoff: null,
  campaign: null,
  controller: null,
  start: (controller, fingerprint) => {
    set({
      controller,
      progress: null,
      includedUnitIds: [],
      leftOutByPlayer: [],
      tradeoff: null,
      campaign: null,
      lastRunFingerprint: fingerprint ?? null,
    });
  },
  setProgress: (progress) => {
    set({ progress });
  },
  finish: (includedUnitIds, tradeoff = null, campaign = null) => {
    set({ controller: null, progress: null, includedUnitIds, leftOutByPlayer: [], tradeoff, campaign });
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
      previousSummary: null,
      lastRunFingerprint: null,
      includedUnitIds: [],
      leftOutByPlayer: [],
      tradeoff: null,
      campaign: null,
      controller: null,
    });
  },
}));
