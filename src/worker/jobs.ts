/**
 * The job bodies, shared by the worker and by the main-thread fallback so both compute exactly the
 * same thing. Everything here is pure: the transport lives in `calc.worker.ts` / `client.ts`.
 */
import {
  planCampaign,
  planMarch,
  resizeMarchOver,
  searchPriority,
  simulateBattle,
  sizeStacks,
} from '@/engine';
import type { CampaignInput, CampaignPlan, ResizedMarch } from '@/engine/plan';
import type { SearchProgress, SearchRequest, SearchResult, StackRequest } from '@/engine/types';
import { exhaustivePools } from '@/ui/sections/march/exact';
import type { ExactRaiseAnswer, ExactRaiseInput } from '@/ui/sections/march/exact';
import { liftedCounts, positionTrades } from '@/ui/sections/march/positions';
import type { PositionTrades } from '@/ui/sections/march/positions';

import type { PositionsInput, ResizeInput, StackOutcome } from './protocol';

/** Message shown when a search is asked for before S-40 wires the search engine in. */

export interface JobContext {
  /** Report intermediate progress; the client forwards it to `onProgress`. */
  onProgress: (progress: SearchProgress) => void;
  /** Polled at every checkpoint; when it turns true the job should return early. */
  cancelled: () => boolean;
}

export function runStack(request: StackRequest): StackOutcome {
  const result = sizeStacks(request);
  return { result, summary: simulateBattle(result, request) };
}

/** Priority search (S-40/S-41): time-boxed, cancellable, progress forwarded to the client. */
export function runSearch(request: SearchRequest, context: JobContext): SearchResult {
  return searchPriority(request, context.onProgress, context.cancelled);
}

/**
 * Complete optimization v2 (S-55): the campaign planned from the army alone. Not time-boxed — it reports no
 * progress, because every candidate is scored whole and the answer is one plan rather than a ranked list —
 * but it is cancellable at a candidate boundary, which is what the Cancel button needs.
 */
export function runPlan(request: CampaignInput, context: JobContext): CampaignPlan {
  return planCampaign({ ...request, shouldStop: context.cancelled });
}

/**
 * **A March edit on a plan** (S-104): one stop re-sized over the troop types that are in, inside the plan's
 * own rules — sheltered, the stop's hired counts as caps, nothing else pushed out. Not cancellable and not
 * time-boxed: it prices a dozen shapes and comes back in a few milliseconds, where a plan walks thousands.
 */
export function runResize(input: ResizeInput): ResizedMarch | null {
  return resizeMarchOver(input.request, input.within);
}

/**
 * **The exhaustive raise** (S-143b): `Best` with the sampling taken out, on the kernel (W16 E3 S5b — the
 * same `liftedCounts` the positions block prices with, so a March edit and a row of the block are one
 * answer). Not cancellable and not time-boxed, and deliberately so — the owner's call is that there is no
 * cost limit on this one (*"no cost limit as it's experimental for now"*), and the way it is kept out of the
 * way is `raiseSearch.ts` giving it a worker of its own rather than by cutting the search short.
 *
 * `null` when no search ran — no pool on an exhaustive position, no troop to shelter under, every stack
 * already at its ceiling or its stock — which the March reads as "the climb is the answer".
 */
export function runRaise(input: ExactRaiseInput): ExactRaiseAnswer | null {
  if (exhaustivePools(input.modes).length === 0) return null;
  const lifted = liftedCounts(input.request, input.base, input.modes);
  if (lifted === null || lifted.how === null) return null;
  return { counts: lifted.counts, how: lifted.how, space: lifted.space, scored: lifted.scored };
}

/**
 * **Every raise position, priced at once** (S-147), on one stop of a plan. Five questions where a press of
 * the control used to be one, each answered by the kernel (`liftedCounts`) — and still a job rather than a
 * render, because the widest box is a million vectors even there.
 *
 * The stop's march is `planMarch`, the engine's own reading of those counts — the very result the pane draws
 * for that stop — so the block prices the march a player would be looking at rather than one built twice.
 */
export function runPositions(input: PositionsInput): PositionTrades {
  return positionTrades(input.request, planMarch(input.request, input.counts).result);
}
