/**
 * **The kernel's one loader** (W16 E3 S2): fetch `kernel.wasm`, compile it, and set the plan and the raise
 * kernels on the engine's doors (`src/engine/fast.ts`). The calculation worker and the main thread both call
 * it, so the plan a worker runs and the march the page draws at render time (`planMarch` in `generate.ts`,
 * `PlanPanel.tsx`, `manual.ts`) are on the same arithmetic.
 *
 * The kernel is **mandatory** (owner, 2026-10-01: "retire the ts version"): a failure here — no WebAssembly,
 * the file missing, a compile refused — rejects, and the caller says so rather than running the TypeScript.
 * `src/main.tsx` renders `WasmRequired` instead of the app; the worker answers every job `kernel-unavailable`.
 */
import { setKernel, setRaiseKernel } from '@/engine/fast';

import { createPlanKernel } from './plan';
import { createRaiseKernel } from './raise';

/** The kernel could not be loaded on this platform; `cause` is what the browser threw. */
export class KernelUnavailableError extends Error {
  constructor(message = 'WebAssembly is not available here.', options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'KernelUnavailableError';
  }
}

async function compile(url: string): Promise<WebAssembly.Module> {
  try {
    return await WebAssembly.compileStreaming(fetch(url));
  } catch {
    // A server without the `application/wasm` MIME type: compile from the bytes instead.
    const response = await fetch(url);
    if (!response.ok) throw new Error(`kernel: ${String(response.status)}`);
    return WebAssembly.compile(await response.arrayBuffer());
  }
}

/**
 * Compile the kernel at `url` and set both kernels from the one module. Rejects with a
 * `KernelUnavailableError` when the platform has no WebAssembly or the module cannot be had; the doors are
 * left as they were.
 */
export async function loadKernel(url: string): Promise<void> {
  if (typeof WebAssembly === 'undefined') throw new KernelUnavailableError();
  let module: WebAssembly.Module;
  try {
    module = await compile(url);
  } catch (cause) {
    throw new KernelUnavailableError('The calculation kernel could not be loaded.', { cause });
  }
  setKernel(createPlanKernel(module));
  setRaiseKernel(createRaiseKernel(module));
}
