/**
 * The kernel for node (vitest): `kernel/build/kernel.wasm`, rebuilt first when it is missing or older than any
 * source under `kernel/` (the build output is not committed).
 */
/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { compileKernel } from '@/kernel';

// **`process.cwd()`, not `import.meta.url`** (W16 E3 S3): the kernel is now installed for jsdom test files
// too (`with-kernel.setup.ts`, global `setupFiles`), and a module that imports a Node builtin (here
// `node:child_process`) is served to a jsdom test file through a different Vite pipeline than a plain
// `node`-environment one takes — `import.meta.url` there is not a `file:` URL, and `fileURLToPath` rejects
// it. Every script in this repo is run from the repo root (`pnpm <script>`, CI, `gate.sh`'s own `cd`), so
// the cwd is the root this file otherwise walked up to from its own path — with no pipeline to go through.
const ROOT = process.cwd();
const WASM = join(ROOT, 'kernel/build/kernel.wasm');

function newestSource(dir: string): number {
  let newest = 0;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    const stat = statSync(path);
    newest = Math.max(newest, stat.isDirectory() ? newestSource(path) : stat.mtimeMs);
  }
  return newest;
}

let compiled: WebAssembly.Module | null = null;

/**
 * Rebuild `kernel/build/kernel.wasm` when it is missing or older than any kernel source. Run once before the
 * workers start (`./build.global.ts`, vitest's `globalSetup`) so the two projects' parallel files never race
 * one another into `asc`; `loadKernelModule` still calls it for a file run under another config.
 */
export function buildKernelIfStale(): void {
  const sources = Math.max(
    newestSource(join(ROOT, 'kernel/assembly')),
    statSync(join(ROOT, 'kernel/asconfig.json')).mtimeMs,
  );
  if (!existsSync(WASM) || statSync(WASM).mtimeMs < sources) {
    execFileSync(
      join(ROOT, 'node_modules/.bin/asc'),
      ['kernel/assembly/index.ts', '--config', 'kernel/asconfig.json', '--target', 'release'],
      { cwd: ROOT, stdio: 'inherit' },
    );
  }
}

export function loadKernelModule(): WebAssembly.Module {
  if (compiled) return compiled;
  buildKernelIfStale();
  compiled = compileKernel(readFileSync(WASM));
  return compiled;
}
