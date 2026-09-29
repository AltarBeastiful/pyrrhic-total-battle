/**
 * **Run any test file with the kernels set** (AssemblyScript roadmap, step 2; the raise since S-147): a vitest
 * setup file, off by default — `vitest run <file> --setupFiles tests/kernel/with-kernel.setup.ts`. It is how
 * the benchmark is held to the same numbers with the kernel on, and how the `kernel` project runs every
 * engine test a second time on the fast path (`vite.config.ts`).
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
