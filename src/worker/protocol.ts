/**
 * Worker protocol (S-25). Every message is plain structured-cloneable data — the engine contract is
 * already plain data (ADR-0006), so nothing here needs a serialiser.
 *
 * Request:  { kind: 'stack' | 'search' | 'plan' | 'resize' | 'raise' | 'positions', id, request }  and  { kind: 'cancel', id }
 * Response: { kind: 'stack', id, result, summary }
 *           { kind: 'progress', id, progress }   (searches only, zero or more)
 *           { kind: 'search', id, result }
 *           { kind: 'plan', id, result }
 *           { kind: 'resize', id, result }   (`null` when no shape could be built)
 *           { kind: 'raise', id, result }    (`null` when there is no box to search)
 *           { kind: 'positions', id, result }  (`PositionTrades`, S-147)
 *           { kind: 'cancelled', id }
 *           { kind: 'error', id, error: { message, code? } }   (`code: 'kernel-unavailable'`: the worker has no kernel)
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
import type { ExactRaiseAnswer, ExactRaiseInput } from '@/ui/sections/march/exact';
import type { PositionTrades } from '@/ui/sections/march/positions';

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

/**
 * **The exhaustive raise** (S-143b): `Best` with the sampling taken out, over the pools whose control
 * stands on `v2`. It is a job of its own and not an option on `stack` because it is a different computation
 * on a different thread — it walks up to a million count vectors and can take tens of seconds, where every
 * other job here answers in milliseconds.
 *
 * That cost is also why the March asks for it through a **second** client (`raiseSearch.ts`,
 * `getRaiseClient`): a job of this length on the page's one worker would sit in front of the next Generate
 * and hold it there.
 */
export interface RaiseJob {
  kind: 'raise';
  id: JobId;
  request: ExactRaiseInput;
}

/**
 * **The five raise positions, priced at once** (S-147): what each of them makes of **one stop of a plan** —
 * its counts, the damage the march would hit for and what it is paid with. It is a job of its own because it
 * is five searches where a press of the control used to be one, and one job **per stop of the bar** is what
 * lets the block under the plan have every stop's table ready before the player moves the bar.
 */
export interface PositionsJob {
  kind: 'positions';
  id: JobId;
  request: PositionsInput;
}

export interface PositionsInput {
  request: StackRequest;
  /**
   * The stop's own counts, as the plan carries them (`PlanRow.counts`). The march they describe is the one
   * the pane draws for that stop (`planMarch`, `marchResult`), so the job builds it itself rather than being
   * handed a result — one description of a stop, not two.
   */
  counts: Record<string, number>;
}

/** Cooperative cancel: the worker stops at its next checkpoint and answers `cancelled`. */
export interface CancelJob {
  kind: 'cancel';
  id: JobId;
}

export type CalcRequestMessage =
  StackJob | SearchJob | PlanJob | ResizeJob | RaiseJob | PositionsJob | CancelJob;

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

/**
 * Why a job failed when the reason is the platform rather than the job (W16 E3 S2): `kernel-unavailable` is
 * the worker's answer to every job when the wasm kernel did not load in it. There is no TypeScript to fall
 * back on any more, so the client rejects with a `KernelUnavailableError` the page can name.
 */
export type ErrorCode = 'kernel-unavailable';

export interface ErrorMessage {
  kind: 'error';
  id: JobId;
  error: { message: string; code?: ErrorCode };
}

/** The exhaustive raise's answer, or `null` when the box had nothing in it to search (`exactRaise`). */
export interface RaiseDoneMessage {
  kind: 'raise';
  id: JobId;
  result: ExactRaiseAnswer | null;
}

/** Every raise position, priced on one march (`positionTrades`), in the control's own order. */
export interface PositionsDoneMessage {
  kind: 'positions';
  id: JobId;
  result: PositionTrades;
}

export type CalcResponseMessage =
  | StackDoneMessage
  | SearchProgressMessage
  | SearchDoneMessage
  | PlanDoneMessage
  | ResizeDoneMessage
  | RaiseDoneMessage
  | PositionsDoneMessage
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
    case 'raise':
    case 'positions':
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
    case 'positions':
      return isRecord(value.result);
    // The two answers that may be nothing: an army with no troop type to field over gets no march at all,
    // and a raise with no stack it may move gets no better counts than the ones already on screen.
    case 'resize':
    case 'raise':
      return value.result === null || isRecord(value.result);
    case 'cancelled':
      return true;
    case 'error':
      return (
        isRecord(value.error) &&
        typeof value.error.message === 'string' &&
        (value.error.code === undefined || value.error.code === 'kernel-unavailable')
      );
    default:
      return false;
  }
}
