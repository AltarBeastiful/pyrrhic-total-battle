/// <reference lib="webworker" />
/**
 * Calculation worker (S-25). Keeps sizing, simulation and (later) priority search off the main thread
 * so the UI never freezes. It imports nothing but the engine and this folder's protocol: no React, no
 * store, no DOM.
 */
import { runSearch, runStack } from './jobs';
import { errorPayload, isCalcRequestMessage } from './protocol';
import type { CalcResponseMessage } from './protocol';

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
  try {
    if (message.kind === 'stack') {
      const { result, summary } = runStack(message.request);
      post({ kind: 'stack', id, result, summary });
      return;
    }
    // TODO(search): wire searchPriority from '@/engine/search' — the one-line change lives in
    // `runSearch` (./jobs.ts); this branch already carries progress and cancellation.
    const result = runSearch(message.request, {
      onProgress: (progress) => {
        post({ kind: 'progress', id, progress });
      },
      cancelled: () => cancelled.has(id),
    });
    post(cancelled.has(id) ? { kind: 'cancelled', id } : { kind: 'search', id, result });
  } catch (error) {
    post({ kind: 'error', id, error: errorPayload(error) });
  } finally {
    cancelled.delete(id);
  }
});
