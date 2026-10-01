/**
 * **Every test file runs with the kernels set** (AssemblyScript roadmap, step 2; the raise since S-147;
 * global since W16 E3 S3, 2026-10-01): `vite.config.ts`'s `setupFiles` loads this before every test file in
 * the suite, so the kernel is mandatory the same way `src/main.tsx` makes it mandatory at runtime (S2). A
 * file that wants the TypeScript reference instead — `tests/kernel/**`'s own comparisons — sets the
 * declining kernel (`./declining.ts`) itself: `setKernel(null)` leaves an engine that throws
 * `KernelUnavailableError` at its first door (W16 E3 S5c).
 */
/// <reference types="node" />
import { setKernel, setRaiseKernel } from '@/engine/fast';
import { createPlanKernel } from '@/kernel/plan';
import { createRaiseKernel } from '@/kernel/raise';

import { loadKernelModule } from './load';

const module = loadKernelModule();
setKernel(createPlanKernel(module));
setRaiseKernel(createRaiseKernel(module));
process.stdout.write('with-kernel.setup: the plan kernel is set, and the raise kernel with it\n');
