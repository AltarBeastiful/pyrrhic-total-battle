/**
 * vitest `globalSetup` (`vite.config.ts`): build the AssemblyScript kernel once, in the main process, before
 * any worker loads it — `pnpm test` runs dozens of files on the kernel path at once, and a stale build would
 * otherwise be rebuilt by each of them concurrently.
 */
import { buildKernelIfStale } from './load';

export default function setup(): void {
  buildKernelIfStale();
}
