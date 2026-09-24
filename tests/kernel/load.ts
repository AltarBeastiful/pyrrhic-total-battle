/**
 * The kernel for node (vitest): `kernel/build/kernel.wasm`, rebuilt first when it is missing or older than any
 * source under `kernel/` (the build output is not committed).
 */
/// <reference types="node" />
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { compileKernel } from '@/kernel';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
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

export function loadKernelModule(): WebAssembly.Module {
  if (compiled) return compiled;
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
  compiled = compileKernel(readFileSync(WASM));
  return compiled;
}
