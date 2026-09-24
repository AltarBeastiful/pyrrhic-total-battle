/// <reference lib="webworker" />
/**
 * Calculation worker (S-25). Keeps sizing, simulation, the priority search and the campaign search
 * (S-54) off the main thread so the UI never freezes. It imports nothing but the engine and this folder's protocol: no React, no
 * store, no DOM.
 */
import { runPlan, runResize, runSearch, runStack } from './jobs';
import { errorPayload, isCalcRequestMessage } from './protocol';
import type { CalcRequestMessage, CalcResponseMessage } from './protocol';
import { setKernel } from '@/engine/fast';
import type { SearchProgress } from '@/engine/types';
import { createPlanKernel } from '@/kernel/plan';
// Built by `pnpm kernel:build` (the `dev` and `build` scripts run it first); emitted beside the worker.
import kernelUrl from '../../kernel/build/kernel.wasm?url';

const ctx = self as unknown as DedicatedWorkerGlobalScope;

/**
 * **The AssemblyScript kernel, loaded once at worker start** (AssemblyScript roadmap, step 2): the plan's hot
 * path asks it for its figures (`src/engine/fast.ts`), which are exactly the TypeScript's. Any failure — no
 * WebAssembly, the file missing, a server that does not send `application/wasm` and a compile that fails
 * even from the bytes — leaves the kernel unset and the engine runs its own TypeScript, silently. Jobs wait
 * for this to settle, so a plan never starts on one path and could have started on the other.
 */
async function compileKernel(): Promise<WebAssembly.Module> {
  try {
    return await WebAssembly.compileStreaming(fetch(kernelUrl));
  } catch {
    // A server without the wasm MIME type: compile from the bytes instead.
    const response = await fetch(kernelUrl);
    if (!response.ok) throw new Error(`kernel: ${String(response.status)}`);
    return WebAssembly.compile(await response.arrayBuffer());
  }
}

const kernelReady: Promise<void> = (async () => {
  try {
    if (typeof WebAssembly === 'undefined') return;
    setKernel(createPlanKernel(await compileKernel()));
  } catch {
    setKernel(null);
  }
})();

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
  void kernelReady.then(() => {
    run(message);
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
}
