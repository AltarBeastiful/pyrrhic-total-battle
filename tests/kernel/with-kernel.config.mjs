/**
 * The project's vitest config with the plan kernel set in every test file (`./with-kernel.setup.ts`):
 * `vitest run --config tests/kernel/with-kernel.config.mjs <files>` — how the benchmark is held to the same
 * numbers with the kernel on (`pnpm kernel:bench-plan`).
 */
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vitest/config';

import base from '../../vite.config.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));

export default mergeConfig(
  base,
  defineConfig({
    root,
    test: { setupFiles: [fileURLToPath(new URL('./with-kernel.setup.ts', import.meta.url))] },
  }),
);
