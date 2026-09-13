/**
 * The job bodies, shared by the worker and by the main-thread fallback so both compute exactly the
 * same thing. Everything here is pure: the transport lives in `calc.worker.ts` / `client.ts`.
 */
import { searchComplete, searchPriority, simulateBattle, sizeStacks } from '@/engine';
import type { CompleteRequest, CompleteResult } from '@/engine/campaign';
import type { SearchProgress, SearchRequest, SearchResult, StackRequest } from '@/engine/types';

import type { StackOutcome } from './protocol';

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
 * Complete optimization (S-54): every sizing × every mercenary spend level, scored over a campaign of
 * several marches. Time-boxed and cancellable exactly like the priority search — it is the same
 * contract, and the budget is split across the cells inside the engine.
 */
export function runComplete(request: CompleteRequest, context: JobContext): CompleteResult {
  return searchComplete(request, context.onProgress, context.cancelled);
}
