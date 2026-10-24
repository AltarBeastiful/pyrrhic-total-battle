/**
 * 352 — **the exact Tight package on the app's worker pool** (follows 338). One live Generate + advisor pass on
 * the account (338's workload), the raise kernel set through the app's own `createRaiseKernel` on the repo build
 * (`REPO`) or the package build (`PKG`, the worktree kernel: algo 22 + rating memo + 271 hashed memo as defaults),
 * run repo → pkg → repo → pkg. Node has no web workers, so as in 263 the pool runs inline and every `pool.map`
 * batch's jobs are timed and replayed on `WORKERS` workers (greedy, first free worker, in order); the generate
 * steps (`client.plan`, `client.positions`) and the main thread outside the batches stay serial. Reported per arm
 * (min of two): replayed wall on `WORKERS` workers and one-worker wall; every `position()` answer compared
 * between the arms (counts and how; must be identical).
 *
 * `THEORY=1 ACCT=<file> REPO=<wasm> PKG=<wasm> [WORKERS=15] OUTF=<file> pnpm vitest run tools/theorycraft/352-tight-package-pool.test.ts`
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { planMarch, withMethod } from '../../src/engine';
import { leadLineup } from '../../src/engine/captainUpgrades';
import { setRaiseKernel, type RaiseKernel } from '../../src/engine/fast';
import type { CampaignInput } from '../../src/engine/plan';
import { genericProbes } from '../../src/engine/probes';
import { compileKernel } from '../../src/kernel';
import { createRaiseKernel } from '../../src/kernel/raise';
import { parseImport } from '../../src/share/exportImport';
import { captainLineups } from '../../src/state/captainLineups';
import { captainUpgradeCandidates } from '../../src/state/captainUpgrades';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { otherProbes } from '../../src/ui/sections/march/otherSearch';
import { troopFloor } from '../../src/ui/sections/march/raise';
import { openingPosition, pickOf } from '../../src/ui/sections/march/runStore';
import { runAdvisor } from '../../src/worker/advisor';
import { runCaptainAdvice } from '../../src/worker/captainAdvice';
import { runCaptainUpgrades, type UpgradeAsk } from '../../src/worker/captainUpgrades';
import { createInlineClient } from '../../src/worker/client';
import { createCalcPool, type CalcPool, type PoolJob } from '../../src/worker/pool';

const NO_CLOCK = 1_000_000_000;
const WORKERS = Number(process.env.WORKERS ?? 15);
const kernelOf = (path: string | undefined) => (process.env.THEORY ? compileKernel(readFileSync(path ?? '')) : null!);
const repo = kernelOf(process.env.REPO);
const pkg = kernelOf(process.env.PKG);

function makespan(durations: readonly number[], workers: number): number {
  const free = Array.from({ length: Math.max(1, workers) }, () => 0);
  for (const d of durations) {
    let at = 0;
    for (let i = 1; i < free.length; i += 1) if (free[i]! < free[at]!) at = i;
    free[at]! += d;
  }
  return Math.max(0, ...free);
}

const answers: string[] = [];
let tightMs = 0;
function recording(inner: RaiseKernel): RaiseKernel {
  return {
    position(input) {
      const t = performance.now();
      const out = inner.position(input);
      tightMs += performance.now() - t;
      answers.push(JSON.stringify([out?.how ?? null, Object.entries(out?.counts ?? {}).filter(([, v]) => v !== 0).sort()]));
      return out;
    },
  };
}

function timedPool(inner: CalcPool, batches: number[][]): CalcPool {
  return {
    get alive() { return inner.alive; },
    get busy() { return inner.busy; },
    dispose: () => inner.dispose(),
    map: async (jobs, options) => {
      const durations: number[] = [];
      batches.push(durations);
      const wrapped = jobs.map((job) => (async (client: Parameters<PoolJob<never>>[0], signal: Parameters<PoolJob<never>>[1]) => {
        const at = performance.now();
        try { return await (job as unknown as PoolJob<never>)(client, signal); } finally { durations.push(performance.now() - at); }
      }) as PoolJob<never>);
      return (await inner.map(wrapped as never, options as never)) as never;
    },
  };
}

async function runWorkload(profile: Profile, batches: number[][]): Promise<{ serial: number }> {
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId) ?? profile.setups[0]!;
  const input: CampaignInput = buildPlanRequest(profile, setup);
  const request = buildStackRequest(profile, setup);
  const lane = () => ({ ...createInlineClient(), mode: 'worker' as const });
  const client = lane();
  const pool = timedPool(createCalcPool({ size: 1, createClient: lane }), batches);
  let serial = 0;
  try {
    let t = performance.now();
    const planned = await client.plan(input);
    const chosen = pickOf(planned, openingPosition(planned, null));
    const marchRequest = withMethod(request, 'elite');
    if (troopFloor(planMarch(request, chosen.counts).result) !== null)
      for (const row of planned.alternatives) await client.positions({ request: marchRequest, counts: row.counts });
    serial += performance.now() - t;
    const headline = chosen.pick;
    await runAdvisor(input, genericProbes(), pool, { headline, budgetMs: NO_CLOCK });
    const { currentKey, lineups, size } = captainLineups(profile, setup);
    const advice = await runCaptainAdvice(input, lineups.map(({ key, totals }) => ({ key, totals })), currentKey, pool, { budgetMs: NO_CLOCK });
    const lead = leadLineup(advice.best, currentKey);
    const leadCandidate = lineups.find((trio) => trio.key === lead);
    const leadStops = advice.plans[lead];
    if (leadCandidate !== undefined && leadStops !== undefined) {
      const asks: UpgradeAsk[] = captainUpgradeCandidates(profile, setup, leadCandidate, size).map((candidate) => ({
        id: candidate.spec.id,
        label: `${candidate.name} ${candidate.change}`,
        lineups: candidate.lineups.map(({ key, totals }) => ({ key, totals })),
      }));
      await runCaptainUpgrades(input, { key: lead, totals: leadCandidate.totals, stops: leadStops }, asks, pool, { budgetMs: NO_CLOCK });
    }
    t = performance.now();
    const { probes } = otherProbes(input, planned.silver);
    serial += performance.now() - t;
    await runAdvisor(input, probes, pool, { headline, budgetMs: NO_CLOCK });
  } finally {
    pool.dispose();
    client.dispose();
  }
  return { serial };
}

describe.skipIf(!process.env.THEORY)('352 — package on the pool', () => {
  it('A/B', async () => {
    const parsed = parseImport(readFileSync(process.env.ACCT ?? '', 'utf8'));
    expect(parsed.kind).toBe('profile');
    if (parsed.kind !== 'profile') return;
    const runs: { arm: string; one: number; many: number; generate: number; tight: number; answers: string[] }[] = [];
    for (const arm of ['repo', 'pkg', 'repo', 'pkg'] as const) {
      setRaiseKernel(recording(createRaiseKernel(arm === 'repo' ? repo : pkg)));
      answers.length = 0;
      tightMs = 0;
      const batches: number[][] = [];
      const t = performance.now();
      const { serial } = await runWorkload(structuredClone(parsed.payload) as Profile, batches);
      const one = performance.now() - t;
      const batchTime = batches.reduce((s, b) => s + b.reduce((a, c) => a + c, 0), 0);
      const many = one - batchTime + batches.reduce((s, b) => s + makespan(b, WORKERS), 0);
      runs.push({ arm, one, many, generate: serial, tight: tightMs, answers: [...answers] });
    }
    const a = runs[0]!.answers, b = runs[1]!.answers;
    let differ = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i += 1) if (a[i] !== b[i]) differ += 1;
    const min = (arm: string, k: 'one' | 'many' | 'generate' | 'tight') => Math.min(...runs.filter((r) => r.arm === arm).map((r) => r[k]));
    const out = [
      `position() calls repo ${a.length}, pkg ${b.length}; answers (how + counts) differ on ${differ}`,
      ...runs.map((r) => `${r.arm}: one worker ${r.one.toFixed(0)} ms, replayed on ${WORKERS} workers ${r.many.toFixed(0)} ms, generate steps ${r.generate.toFixed(0)} ms, Σ Tight ${r.tight.toFixed(0)} ms`),
      `min replayed wall on ${WORKERS} workers: repo ${min('repo', 'many').toFixed(0)} → pkg ${min('pkg', 'many').toFixed(0)} ms (×${(min('repo', 'many') / min('pkg', 'many')).toFixed(2)}, saved ${(min('repo', 'many') - min('pkg', 'many')).toFixed(0)} ms)`,
      `min one-worker wall: repo ${min('repo', 'one').toFixed(0)} → pkg ${min('pkg', 'one').toFixed(0)} ms (×${(min('repo', 'one') / min('pkg', 'one')).toFixed(2)})`,
      `min generate steps (plan + positions, serial): repo ${min('repo', 'generate').toFixed(0)} → pkg ${min('pkg', 'generate').toFixed(0)} ms`,
      `min Σ Tight: repo ${min('repo', 'tight').toFixed(0)} → pkg ${min('pkg', 'tight').toFixed(0)} ms (×${(min('repo', 'tight') / min('pkg', 'tight')).toFixed(2)})`,
    ];
    writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
  }, 7_200_000);
});
