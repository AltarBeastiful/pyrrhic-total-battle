/**
 * The project's vitest config with the plan kernel set in every test file (`./with-kernel.setup.ts`), for a
 * file **outside** the `kernel` project's globs (a theorycraft experiment, say):
 * `vitest run --config tests/kernel/with-kernel.config.mjs <files>`. Engine tests need nothing of the sort —
 * `pnpm test` runs them on both paths already (`vite.config.ts`, the `kernel` project); `pnpm kernel:bench-plan`
 * is `vitest run --project kernel` on the benchmark.
 */
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

import base from '../../vite.config.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));

// The base config's two projects are dropped (the kernel would be set in the `ts` one too, under its name):
// one flat project, the base's own include, and the setup file.
const { projects: _projects, ...test } = base.test ?? {};

export default defineConfig({
  ...base,
  root,
  test: {
    ...test,
    include: ['tests/**/*.test.ts', 'tools/**/*.test.ts', 'src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: [fileURLToPath(new URL('./with-kernel.setup.ts', import.meta.url))],
  },
});
