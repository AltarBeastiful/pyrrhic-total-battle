/**
 * **Kernel speed** — battles a second, the engine's `marchResult` against the kernel's `battleMany`, on the
 * owner's scenario-18 army (his browser setup of 2026-09-24) and the benchmark's largest army by type count.
 * Off in the suite: `pnpm kernel:bench` (`KERNEL_BENCH=1`).
 */
/// <reference types="node" />
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { mulberry32 } from '@/engine';
import { marchResult } from '@/engine/plan';
import type { StackRequest } from '@/engine/types';
import { createKernel } from '@/kernel';

import { browserSetupRequest, commonScenarios, ownerProfile, ownerScenarios } from '../engine/plan-scenarios';

import { loadKernelModule } from './load';

/** Full marches: every type fielded, a random share of its pool's room, within housing. */
function marches(request: StackRequest, n: number): Record<string, number>[] {
  const random = mulberry32(7);
  const out: Record<string, number>[] = [];
  const pools = ['leadership', 'authority', 'dominance'] as const;
  while (out.length < n) {
    const counts: Record<string, number> = {};
    for (const pool of pools) {
      const units = request.units.filter((u) => u.pool === pool);
      let left = request.housing[pool];
      for (const u of units) {
        const most = Math.min(request.caps[u.id] ?? Infinity, Math.floor(left / Math.max(1, u.cost) / 2));
        const c = Math.floor(random() * (most + 1));
        counts[u.id] = c;
        left -= c * u.cost;
      }
    }
    out.push(counts);
  }
  return out;
}

function bench(label: string, request: StackRequest): number {
  const kernel = createKernel(loadKernelModule(), request, CAMPAIGN.markerRates);
  const set = marches(request, 20_000);
  const batch = new Float64Array(set.length * kernel.types);
  set.forEach((counts, m) => kernel.ids.forEach((id, t) => (batch[m * kernel.types + t] = counts[id] ?? 0)));
  let sink = 0;
  // TS: a warm-up, then the timed pass.
  for (const counts of set.slice(0, 2_000)) sink += marchResult(request, counts).summary.minDamage;
  const tsStart = performance.now();
  for (const counts of set) sink += marchResult(request, counts).summary.minDamage;
  const tsMs = performance.now() - tsStart;
  kernel.battleMany(batch.subarray(0, 2_000 * kernel.types));
  const reps = 20;
  const wasmStart = performance.now();
  for (let r = 0; r < reps; r += 1) sink += kernel.battleMany(batch)[0] ?? 0;
  const wasmMs = (performance.now() - wasmStart) / reps;
  const tsRate = set.length / (tsMs / 1000);
  const wasmRate = set.length / (wasmMs / 1000);
  process.stderr.write(
    `kernel bench — ${label} (${String(kernel.types)} types): TS ${Math.round(tsRate).toLocaleString('en-US')} battles/s, ` +
      `kernel ${Math.round(wasmRate).toLocaleString('en-US')} battles/s, ×${(wasmRate / tsRate).toFixed(1)} (sink ${String(sink > 0)})\n`,
  );
  return wasmRate / tsRate;
}

describe.skipIf(!process.env.KERNEL_BENCH)('kernel speed', () => {
  it('beats the engine on scenario 18 and on the largest army', () => {
    const profile = ownerProfile();
    const all = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
    const largest = all.reduce((a, b) => (b.request.units.length > a.request.units.length ? b : a));
    expect(bench('scenario 18, his browser setup of 2026-09-24', browserSetupRequest())).toBeGreaterThan(1);
    expect(bench(`largest: ${largest.label}`, largest.request)).toBeGreaterThan(1);
  }, 600_000);
});
