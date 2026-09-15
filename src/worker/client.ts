/**
 * Client for the calculation worker (S-25).
 *
 * `createCalcClient()` runs the engine in a module worker; when the platform has no `Worker` (old
 * browser, jsdom, a Node script) or constructing one throws, it transparently falls back to the same
 * jobs on the main thread. Callers get one interface and never branch on it.
 */
import type { CampaignInput, CampaignPlan } from '@/engine/plan';
import type { SearchProgress, SearchRequest, StackRequest, SearchResult } from '@/engine/types';

import { runPlan, runSearch, runStack } from './jobs';
import {
  errorPayload,
  isCalcResponseMessage,
  nextJobId,
  type CalcRequestMessage,
  type JobId,
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
        entry.resolve(message.result as never);
        return;
      case 'cancelled':
        entry.reject(abortError());
        return;
      case 'error':
        entry.reject(new Error(message.error.message));
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
 * cannot accidentally depend on synchronous completion.
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
