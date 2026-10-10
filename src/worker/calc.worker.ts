/// <reference lib="webworker" />
/**
 * Calculation worker (S-25). Keeps sizing, simulation, the priority search, the campaign search (S-54), the
 * exhaustive raise (S-143b), the advisor's probes (W17 C3) and the captain screen (W17 C5a) off the main thread so the UI never freezes. It imports nothing but the
 * engine, this folder's protocol, and the march's two pure modules (`raise.ts`, `exact.ts` — plain
 * TypeScript with no React, no store and no DOM in them): no React, no store, no DOM.
 *
 * **Jobs run one at a time here**, which is exactly why the exhaustive raise gets a worker of its own rather
 * than a `kind` on this one — it is the only job measured in tens of seconds, and on this thread it would
 * sit in front of the next Generate (`raiseSearch.ts`).
 */
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
import { DEEP_PROFILING, reportTiming, timedJob } from './jobTiming';
import { errorPayload, isCalcRequestMessage } from './protocol';
import type { CalcRequestMessage, CalcResponseMessage } from './protocol';
import type { SearchProgress } from '@/engine/types';
import { loadKernel } from '@/kernel/boot';
// Built by `pnpm kernel:build` (the `dev` and `build` scripts run it first); emitted beside the worker.
import kernelUrl from '../../kernel/build/kernel.wasm?url';

const ctx = self as unknown as DedicatedWorkerGlobalScope;

/**
 * **The AssemblyScript kernel, loaded once at worker start** (`src/kernel/boot.ts`, shared with the main
 * thread). It is mandatory (W16 E3 S2): when it does not load — no WebAssembly, the file missing, a compile
 * refused — this worker runs no job at all and answers each one with a `kernel-unavailable` error, rather
 * than the TypeScript it used to fall back on silently. Jobs wait for this to settle, in order.
 */
const kernelBegan = DEEP_PROFILING ? performance.now() : 0;
const kernelReady: Promise<string | null> = loadKernel(kernelUrl).then(
  () => {
    // The compile is real work the pool pays once per worker; the profiling run reports it as `boot`.
    if (DEEP_PROFILING) reportTiming('boot', kernelBegan);
    return null;
  },
  (error: unknown) => errorPayload(error).message,
);

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
  // Every job waits for the kernel to settle (at once after the first); the order of the jobs is kept.
  void kernelReady.then((unavailable) => {
    if (unavailable === null) {
      // Timed only in a dev or `VITE_PROFILING=1` build (`jobTiming.ts`); the test is at the call so a
      // production build, where it is `false`, drops the timing code altogether.
      if (DEEP_PROFILING) {
        timedJob(message.kind, () => {
          run(message);
        });
      } else {
        run(message);
      }
      return;
    }
    cancelled.delete(message.id);
    post({ kind: 'error', id: message.id, error: { message: unavailable, code: 'kernel-unavailable' } });
  });
});

function run(message: Exclude<CalcRequestMessage, { kind: 'cancel' }>): void {
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
    if (message.kind === 'raise') {
      post({ kind: 'raise', id, result: runRaise(message.request) });
      return;
    }
    if (message.kind === 'positions') {
      post({ kind: 'positions', id, result: runPositions(message.request) });
      return;
    }
    if (message.kind === 'plan') {
      const result = runPlan(message.request, context);
      post(cancelled.has(id) ? { kind: 'cancelled', id } : { kind: 'plan', id, result });
      return;
    }
    if (message.kind === 'probe') {
      const result = runProbe(message.request, context);
      post(cancelled.has(id) ? { kind: 'cancelled', id } : { kind: 'probe', id, result });
      return;
    }
    if (message.kind === 'captains') {
      const result = runCaptainScreen(message.request, context);
      post(cancelled.has(id) ? { kind: 'cancelled', id } : { kind: 'captains', id, result });
      return;
    }
    const result = runSearch(message.request, context);
    post(cancelled.has(id) ? { kind: 'cancelled', id } : { kind: 'search', id, result });
  } catch (error) {
    post({ kind: 'error', id, error: errorPayload(error) });
  } finally {
    cancelled.delete(id);
  }
}
