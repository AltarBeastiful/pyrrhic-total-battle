/// <reference lib="webworker" />
/**
 * Calculation worker (S-25). Keeps sizing, simulation, the priority search and the campaign search
 * (S-54) off the main thread so the UI never freezes. It imports nothing but the engine and this folder's protocol: no React, no
 * store, no DOM.
 */
import { runPlan, runResize, runSearch, runStack } from './jobs';
import { errorPayload, isCalcRequestMessage } from './protocol';
import type { CalcResponseMessage } from './protocol';
import type { SearchProgress } from '@/engine/types';

const ctx = self as unknown as DedicatedWorkerGlobalScope;

/** Ids cancelled while their job was queued or running. */
const cancelled = new Set<string>();

function post(message: CalcResponseMessage): void {
  ctx.postMessage(message);
}

ctx.addEventListener('message', (event: MessageEvent<unknown>) => {
  const message = event.data;
  if (!isCalcRequestMessage(message)) return;

  if (message.kind === 'cancel') {
    cancelled.add(message.id);
    return;
  }

  const { id } = message;
  // The two searches share one context: both report progress and both stop at their next checkpoint.
  const context = {
    onProgress: (progress: SearchProgress) => {
      post({ kind: 'progress', id, progress });
    },
    cancelled: () => cancelled.has(id),
  };
  try {
    if (message.kind === 'stack') {
      const { result, summary } = runStack(message.request);
      post({ kind: 'stack', id, result, summary });
      return;
    }
    if (message.kind === 'resize') {
      post({ kind: 'resize', id, result: runResize(message.request) });
      return;
    }
    if (message.kind === 'plan') {
      const result = runPlan(message.request, context);
      post(cancelled.has(id) ? { kind: 'cancelled', id } : { kind: 'plan', id, result });
      return;
    }
    const result = runSearch(message.request, context);
    post(cancelled.has(id) ? { kind: 'cancelled', id } : { kind: 'search', id, result });
  } catch (error) {
    post({ kind: 'error', id, error: errorPayload(error) });
  } finally {
    cancelled.delete(id);
  }
});
