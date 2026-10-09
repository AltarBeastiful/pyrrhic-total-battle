/**
 * Client for the calculation worker (S-25).
 *
 * `createCalcClient()` runs the engine in a module worker; when the platform has no `Worker` (old
 * browser, jsdom, a Node script) or constructing one throws, it transparently falls back to the same
 * jobs on the main thread. Callers get one interface and never branch on it.
 */
import type { CampaignInput, CampaignPlan, ResizedMarch } from '@/engine/plan';
import type { SearchProgress, SearchRequest, StackRequest, SearchResult } from '@/engine/types';
import type { ExactRaiseAnswer, ExactRaiseInput } from '@/ui/sections/march/exact';
import type { PositionTrades } from '@/ui/sections/march/positions';

import { KernelUnavailableError } from '@/kernel/boot';

import {
  runCaptainScreen,
  runPlan,
  runPositions,
  runProbe,
  runRaise,
  runResize,
  runSearch,
  runStack,
} from './jobs';
import {
  errorPayload,
  isCalcResponseMessage,
  nextJobId,
  type CalcRequestMessage,
  type CaptainScreenAnswer,
  type CaptainScreenInput,
  type JobId,
  type PositionsInput,
  type ProbeAnswer,
  type ProbeInput,
  type ResizeInput,
  type StackOutcome,
} from './protocol';

export type ProgressHandler = (progress: SearchProgress) => void;

export interface CalcClient {
  /** Where the jobs actually run; useful in the About panel and in tests. */
  readonly mode: 'worker' | 'inline';
  stack(request: StackRequest, signal?: AbortSignal): Promise<StackOutcome>;
  search(request: SearchRequest, onProgress?: ProgressHandler, signal?: AbortSignal): Promise<SearchResult>;
  /** Complete optimization v2 (S-55): the campaign planned from the army alone. */
  plan(request: CampaignInput, signal?: AbortSignal): Promise<CampaignPlan>;
  /** S-104: one stop of a plan re-sized over the troop types that are in, inside the plan's own rules. */
  resize(request: ResizeInput, signal?: AbortSignal): Promise<ResizedMarch | null>;
  /**
   * S-143b: the exhaustive raise — `Best` with the sampling taken out. The one job here measured in tens of
   * seconds, and the reason `raiseSearch.ts` gives it a client of its own.
   */
  raise(request: ExactRaiseInput, signal?: AbortSignal): Promise<ExactRaiseAnswer | null>;
  /**
   * S-147: every raise position priced on one march — its counts and its trade (damage, mercenaries burnt,
   * units fielded). Five answers, so `positionsSearch.ts` gives it a client of its own rather than sharing
   * the one the exhaustive raise uses.
   */
  positions(request: PositionsInput, signal?: AbortSignal): Promise<PositionTrades>;
  /**
   * W17 C3: one job of the progression advisor — a campaign planned in full and its bar read as the March shows
   * it, and the probe read against the baseline's bar when one is given. The advisor's pool runs many at once.
   */
  probe(request: ProbeInput, signal?: AbortSignal): Promise<ProbeAnswer>;
  /**
   * W17 C5a: the captain screen — every allowed trio priced against the current one, as one job. The totals of
   * each trio are built by the caller (`src/state/captainTrios.ts`).
   */
  captains(request: CaptainScreenInput, signal?: AbortSignal): Promise<CaptainScreenAnswer>;
  /** Terminate the worker and reject every job still in flight. */
  dispose(): void;
}

/** Rejection used for both an aborted signal and a disposed client, so callers can filter it out. */
export function abortError(message = 'Calculation cancelled.'): Error {
  const error = new Error(message);
  error.name = 'AbortError';
  return error;
}

export function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

/** Written as a call so the check is re-evaluated after every `await`, not narrowed away. */
function aborted(signal: AbortSignal | undefined): boolean {
  return signal !== undefined && signal.aborted;
}

interface Pending {
  resolve: (value: never) => void;
  reject: (error: Error) => void;
  onProgress?: ProgressHandler | undefined;
}

// ---- Worker-backed client --------------------------------------------------------------------------
function createWorkerClient(worker: Worker): CalcClient {
  const pending = new Map<JobId, Pending>();
  let disposed = false;

  const settle = (id: JobId): Pending | undefined => {
    const entry = pending.get(id);
    pending.delete(id);
    return entry;
  };

  worker.addEventListener('message', (event: MessageEvent<unknown>) => {
    const message: unknown = event.data;
    if (!isCalcResponseMessage(message)) return;
    if (message.kind === 'progress') {
      pending.get(message.id)?.onProgress?.(message.progress);
      return;
    }
    const entry = settle(message.id);
    if (!entry) return;
    switch (message.kind) {
      case 'stack':
        entry.resolve({ result: message.result, summary: message.summary } as never);
        return;
      case 'search':
      case 'plan':
      case 'resize':
      case 'raise':
      case 'positions':
      case 'probe':
      case 'captains':
        entry.resolve(message.result as never);
        return;
      case 'cancelled':
        entry.reject(abortError());
        return;
      case 'error':
        entry.reject(
          message.error.code === 'kernel-unavailable'
            ? new KernelUnavailableError(message.error.message)
            : new Error(message.error.message),
        );
    }
  });

  worker.addEventListener('error', (event: ErrorEvent) => {
    const error = new Error(event.message === '' ? 'The calculation worker crashed.' : event.message);
    for (const [id, entry] of pending) {
      pending.delete(id);
      entry.reject(error);
    }
  });

  function send<T>(message: CalcRequestMessage, signal?: AbortSignal, onProgress?: ProgressHandler) {
    return new Promise<T>((resolve, reject) => {
      if (disposed) {
        reject(abortError('The calculation worker was disposed.'));
        return;
      }
      if (aborted(signal)) {
        reject(abortError());
        return;
      }
      const id = message.id;
      pending.set(id, {
        resolve: resolve as (value: never) => void,
        reject,
        onProgress,
      });
      signal?.addEventListener(
        'abort',
        () => {
          if (!pending.has(id)) return;
          worker.postMessage({ kind: 'cancel', id } satisfies CalcRequestMessage);
          settle(id)?.reject(abortError());
        },
        { once: true },
      );
      worker.postMessage(message);
    });
  }

  return {
    mode: 'worker',
    stack: (request, signal) =>
      send<StackOutcome>({ kind: 'stack', id: nextJobId('stack'), request }, signal),
    search: (request, onProgress, signal) =>
      send<SearchResult>({ kind: 'search', id: nextJobId('search'), request }, signal, onProgress),
    plan: (request, signal) => send<CampaignPlan>({ kind: 'plan', id: nextJobId('plan'), request }, signal),
    resize: (request, signal) =>
      send<ResizedMarch | null>({ kind: 'resize', id: nextJobId('resize'), request }, signal),
    raise: (request, signal) =>
      send<ExactRaiseAnswer | null>({ kind: 'raise', id: nextJobId('raise'), request }, signal),
    positions: (request, signal) =>
      send<PositionTrades>({ kind: 'positions', id: nextJobId('positions'), request }, signal),
    probe: (request, signal) => send<ProbeAnswer>({ kind: 'probe', id: nextJobId('probe'), request }, signal),
    captains: (request, signal) =>
      send<CaptainScreenAnswer>({ kind: 'captains', id: nextJobId('captains'), request }, signal),
    dispose() {
      disposed = true;
      for (const [id, entry] of pending) {
        pending.delete(id);
        entry.reject(abortError('The calculation worker was disposed.'));
      }
      worker.terminate();
    },
  };
}

// ---- Main-thread fallback --------------------------------------------------------------------------
/**
 * Same interface, same job bodies, no worker. Used by tests, by browsers without workers, and when the
 * worker fails to start (a `file://` page, a strict CSP). Jobs are still asynchronous so that callers
 * cannot accidentally depend on synchronous completion. The jobs run on the kernel the main thread loaded
 * before it rendered the app (`src/main.tsx`, `loadKernel`), exactly as they do in the worker.
 */
export function createInlineClient(): CalcClient {
  let disposed = false;
  const run = async <T>(job: () => T, signal?: AbortSignal): Promise<T> => {
    if (disposed) throw abortError('The calculation client was disposed.');
    if (aborted(signal)) throw abortError();
    await Promise.resolve();
    if (disposed) throw abortError('The calculation client was disposed.');
    if (aborted(signal)) throw abortError();
    try {
      return job();
    } catch (error) {
      throw new Error(errorPayload(error).message, { cause: error });
    }
  };

  return {
    mode: 'inline',
    stack: (request, signal) => run(() => runStack(request), signal),
    search: (request, onProgress, signal) =>
      run(
        () =>
          runSearch(request, {
            onProgress: (progress) => onProgress?.(progress),
            cancelled: () => aborted(signal),
          }),
        signal,
      ),
    plan: (request, signal) =>
      run(() => runPlan(request, { onProgress: () => undefined, cancelled: () => aborted(signal) }), signal),
    resize: (request, signal) => run(() => runResize(request), signal),
    raise: (request, signal) => run(() => runRaise(request), signal),
    positions: (request, signal) => run(() => runPositions(request), signal),
    probe: (request, signal) =>
      run(() => runProbe(request, { onProgress: () => undefined, cancelled: () => aborted(signal) }), signal),
    captains: (request, signal) =>
      run(
        () => runCaptainScreen(request, { onProgress: () => undefined, cancelled: () => aborted(signal) }),
        signal,
      ),
    dispose() {
      disposed = true;
    },
  };
}

/** A worker when the platform has one, the inline client otherwise. */
export function createCalcClient(): CalcClient {
  if (typeof Worker === 'undefined') return createInlineClient();
  try {
    const worker = new Worker(new URL('./calc.worker.ts', import.meta.url), { type: 'module' });
    return createWorkerClient(worker);
  } catch (error) {
    console.warn('[pyrrhic] calculation worker unavailable, running on the main thread', error);
    return createInlineClient();
  }
}
