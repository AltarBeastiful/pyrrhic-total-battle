import { afterEach, describe, expect, test } from 'vitest';

import { planKernel, raiseKernel } from '@/engine/fast';

import { KernelUnavailableError, loadKernel } from './boot';

describe('loadKernel (W16 E3 S2)', () => {
  const globals = globalThis as { WebAssembly?: unknown };
  const real = globals.WebAssembly;
  afterEach(() => {
    globals.WebAssembly = real;
  });

  test('rejects with KernelUnavailableError on a platform without WebAssembly, and sets nothing', async () => {
    const plan = planKernel();
    const raise = raiseKernel();
    delete globals.WebAssembly;
    await expect(loadKernel('kernel.wasm')).rejects.toBeInstanceOf(KernelUnavailableError);
    expect(planKernel()).toBe(plan);
    expect(raiseKernel()).toBe(raise);
  });

  test('rejects with KernelUnavailableError when the module cannot be fetched', async () => {
    const plan = planKernel();
    await expect(loadKernel('http://127.0.0.1:1/kernel.wasm')).rejects.toBeInstanceOf(KernelUnavailableError);
    expect(planKernel()).toBe(plan);
  });
});
