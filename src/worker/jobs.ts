/**
 * The job bodies, shared by the worker and by the main-thread fallback so both compute exactly the
 * same thing. Everything here is pure: the transport lives in `calc.worker.ts` / `client.ts`.
 */
import { planCampaign, resizeMarchOver, searchPriority, simulateBattle, sizeStacks } from '@/engine';
import type { CampaignInput, CampaignPlan, ResizedMarch } from '@/engine/plan';
import type { SearchProgress, SearchRequest, SearchResult, StackRequest } from '@/engine/types';

import type { ResizeInput, StackOutcome } from './protocol';

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
