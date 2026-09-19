/**
 * Worker protocol (S-25). Every message is plain structured-cloneable data — the engine contract is
 * already plain data (ADR-0006), so nothing here needs a serialiser.
 *
 * Request:  { kind: 'stack' | 'search' | 'plan' | 'resize', id, request }  and  { kind: 'cancel', id }
 * Response: { kind: 'stack', id, result, summary }
 *           { kind: 'progress', id, progress }   (searches only, zero or more)
 *           { kind: 'search', id, result }
 *           { kind: 'plan', id, result }
 *           { kind: 'resize', id, result }   (`null` when no shape could be built)
 *           { kind: 'cancelled', id }
 *           { kind: 'error', id, error: { message } }
 *
 * `id` pairs a response with its request, so one worker can serve several concurrent jobs. Errors are
 * flattened to `{ message }`: an `Error` does not survive `postMessage` in every browser, and the stack
 * trace of a worker frame is useless to the user anyway.
 */
import type { CampaignInput, CampaignPlan, MarchWithin, ResizedMarch } from '@/engine/plan';
import type {
  BattleSummary,
  SearchProgress,
  SearchRequest,
  SearchResult,
  StackRequest,
  StackResult,
} from '@/engine/types';

export type JobId = string;

export interface StackJob {
  kind: 'stack';
  id: JobId;
  request: StackRequest;
}

export interface SearchJob {
  kind: 'search';
  id: JobId;
  request: SearchRequest;
}

/** Complete optimization v2 (S-55): the campaign planned from the army alone. */
export interface PlanJob {
  kind: 'plan';
  id: JobId;
  request: CampaignInput;
}

/**
 * **One stop of a plan, re-sized over another set of troop types** (S-104): what a press on a "Left out —
 * tap to put back" pill runs. It is its own message rather than an option on `stack` because it is a
 * different job — `stack` is `sizeStacks`, and this is the plan's own rules over one march (`resizeMarchOver`)
 * — and because it runs off the main thread for the same reason `plan` does: it sizes a dozen shapes and
 * plays a battle for each.
 */
export interface ResizeInput {
  /** The march's whole army, as the snapshot carries it: the left-out row is read off it. */
  request: StackRequest;
  within: MarchWithin;
}

export interface ResizeJob {
  kind: 'resize';
  id: JobId;
  request: ResizeInput;
}

/** Cooperative cancel: the worker stops at its next checkpoint and answers `cancelled`. */
export interface CancelJob {
  kind: 'cancel';
  id: JobId;
}

export type CalcRequestMessage = StackJob | SearchJob | PlanJob | ResizeJob | CancelJob;

export interface StackDoneMessage {
  kind: 'stack';
  id: JobId;
  result: StackResult;
  summary: BattleSummary;
}

export interface SearchProgressMessage {
  kind: 'progress';
  id: JobId;
  progress: SearchProgress;
}

export interface SearchDoneMessage {
  kind: 'search';
  id: JobId;
  result: SearchResult;
}

export interface PlanDoneMessage {
  kind: 'plan';
  id: JobId;
  result: CampaignPlan;
}

/** A re-sized march, or `null` when not one shape over those types could be built. */
export interface ResizeDoneMessage {
  kind: 'resize';
  id: JobId;
  result: ResizedMarch | null;
}

export interface CancelledMessage {
  kind: 'cancelled';
  id: JobId;
}

export interface ErrorMessage {
  kind: 'error';
  id: JobId;
  error: { message: string };
}

export type CalcResponseMessage =
  | StackDoneMessage
  | SearchProgressMessage
  | SearchDoneMessage
  | PlanDoneMessage
  | ResizeDoneMessage
  | CancelledMessage
  | ErrorMessage;

/** What `stack()` resolves with: the sizing and the battle summary computed from it. */
export interface StackOutcome {
  result: StackResult;
  summary: BattleSummary;
}

let counter = 0;

/** Job ids only have to be unique within one client instance. */
export function nextJobId(prefix = 'job'): JobId {
  counter += 1;
  return `${prefix}-${String(counter)}`;
}

/** Anything thrown, flattened to something that crosses `postMessage` and reads well in the UI. */
export function errorPayload(error: unknown): { message: string } {
  if (error instanceof Error) return { message: error.message };
  if (typeof error === 'string') return { message: error };
  return { message: 'Calculation failed.' };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function hasId(value: Record<string, unknown>): boolean {
  return typeof value.id === 'string' && value.id !== '';
}

/** Guard for the worker side: a message from anywhere else is ignored rather than crashing the worker. */
export function isCalcRequestMessage(value: unknown): value is CalcRequestMessage {
  if (!isRecord(value) || !hasId(value)) return false;
  switch (value.kind) {
    case 'stack':
    case 'search':
    case 'plan':
    case 'resize':
      return isRecord(value.request);
    case 'cancel':
      return true;
    default:
      return false;
  }
}

/** Guard for the client side, so a stray `postMessage` never resolves a job with garbage. */
export function isCalcResponseMessage(value: unknown): value is CalcResponseMessage {
  if (!isRecord(value) || !hasId(value)) return false;
  switch (value.kind) {
    case 'stack':
      return isRecord(value.result) && isRecord(value.summary);
    case 'progress':
      return isRecord(value.progress);
    case 'search':
    case 'plan':
      return isRecord(value.result);
    // The one answer that may be nothing: an army with no troop type to field over gets no march at all.
    case 'resize':
      return value.result === null || isRecord(value.result);
    case 'cancelled':
      return true;
    case 'error':
      return isRecord(value.error) && typeof value.error.message === 'string';
    default:
      return false;
  }
}
