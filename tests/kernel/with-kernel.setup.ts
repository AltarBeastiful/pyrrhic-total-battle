/**
 * **Run any test file with the plan kernel set** (AssemblyScript roadmap, step 2): a vitest setup file, off by
 * default — `vitest run <file> --setupFiles tests/kernel/with-kernel.setup.ts`. It is how the benchmark is held
 * to the same numbers with the kernel on.
 */
/// <reference types="node" />
import { setKernel } from '@/engine/fast';
import { createPlanKernel } from '@/kernel/plan';

import { loadKernelModule } from './load';

setKernel(createPlanKernel(loadKernelModule()));
process.stderr.write('with-kernel.setup: the plan kernel is set\n');
