/**
 * 338 — **the exact package on one live Generate + advisor** (330's workload on the account): the repo release
 * kernel against the scratch kernel running the shipped search with the answer-preserving speed-ups of 337
 * (algo `ALGO`, default 22: don't-look pairs + merged trajectories; rating memo `RM`, default on; the hashed
 * wide memo of 271 when the build carries it). Both arms go through the same `RaiseKernel` wrapper (one
 * instance per base march, as `src/kernel/raise.ts` keeps it), run repo → cand → repo → cand; per arm the min
 * Σ Tight ms and pass wall, and every call's counts compared between the arms (must be identical).
 *
 * `THEORY=1 ACCT=<file> KX=<wasm> [ALGO=22] [RM=1] OUTF=<file> pnpm vitest run tools/theorycraft/338-tight-exact-package-workload.test.ts`
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { planMarch, withMethod } from '../../src/engine';
import { leadLineup } from '../../src/engine/captainUpgrades';
import { setRaiseKernel, type RaiseKernel } from '../../src/engine/fast';
import type { CampaignInput } from '../../src/engine/plan';
import { genericProbes } from '../../src/engine/probes';
import type { StackResult } from '../../src/engine/types';
import { compileKernel } from '../../src/kernel';
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
import { createCalcPool } from '../../src/worker/pool';

import { loadKernelModule } from '../../tests/kernel/load';

import { Bound, SCRATCH } from './331-tight-replay';

const NO_CLOCK = 1_000_000_000;
const repo = loadKernelModule();
const cand = compileKernel(readFileSync(process.env.KX ?? `${SCRATCH}/kx8h.wasm`));
const ALGO = Number(process.env.ALGO ?? 22);
const RM = Number(process.env.RM ?? 1);

const log: { ms: number; counts: string; how: string | null }[] = [];

function wrapper(module: WebAssembly.Module, algo: number): RaiseKernel {
  const byBase = new WeakMap<StackResult, Bound>();
  return {
    position(input) {
      let b = byBase.get(input.base);
      if (b === undefined || b.request !== input.request) {
        b = new Bound(module, input.request, input.base);
        (b.raw as unknown as { xSetRateMemo?: (n: number) => void }).xSetRateMemo?.(RM);
        byBase.set(input.base, b);
      }
      const { request: _r, ...rest } = input;
      const a = b.run(rest, algo);
      const how = a.how === 1 ? 'walked' : a.how === 2 ? 'searched' : null;
      log.push({ ms: a.ms, counts: Array.from(a.counts).join(','), how });
      const counts: Record<string, number> = {};
      b.ids.forEach((id, row) => { counts[id] = a.counts[row] as number; });
      return { counts, how, space: a.how === 0 ? 0 : a.space, scored: a.how === 0 ? 0 : a.scored };
    },
  };
}

async function runWorkload(profile: Profile): Promise<void> {
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId) ?? profile.setups[0]!;
  const input: CampaignInput = buildPlanRequest(profile, setup);
  const request = buildStackRequest(profile, setup);
  const lane = () => ({ ...createInlineClient(), mode: 'worker' as const });
  const client = lane();
  const pool = createCalcPool({ size: 1, createClient: lane });
  try {
    const planned = await client.plan(input);
    const chosen = pickOf(planned, openingPosition(planned, null));
    const marchRequest = withMethod(request, 'elite');
    if (troopFloor(planMarch(request, chosen.counts).result) !== null)
      for (const row of planned.alternatives) await client.positions({ request: marchRequest, counts: row.counts });
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
    const { probes } = otherProbes(input, planned.silver);
    await runAdvisor(input, probes, pool, { headline, budgetMs: NO_CLOCK });
  } finally {
    pool.dispose();
    client.dispose();
  }
}

describe.skipIf(!process.env.THEORY)('338 — exact package on the workload', () => {
  it('A/B', async () => {
    const parsed = parseImport(readFileSync(process.env.ACCT ?? '', 'utf8'));
    expect(parsed.kind).toBe('profile');
    if (parsed.kind !== 'profile') return;
    const runs: { arm: string; pass: number; tight: number; calls: typeof log }[] = [];
    for (const arm of ['repo', 'cand', 'repo', 'cand'] as const) {
      setRaiseKernel(arm === 'repo' ? wrapper(repo, 0) : wrapper(cand, ALGO));
      log.length = 0;
      const t = performance.now();
      await runWorkload(structuredClone(parsed.payload) as Profile);
      const pass = performance.now() - t;
      runs.push({ arm, pass, tight: log.reduce((s, c) => s + c.ms, 0), calls: [...log] });
    }
    const a = runs[0]!.calls, b = runs[1]!.calls;
    let differ = 0;
    for (let i = 0; i < Math.min(a.length, b.length); i += 1) if (a[i]!.counts !== b[i]!.counts) differ += 1;
    const min = (arm: string, k: 'pass' | 'tight') => Math.min(...runs.filter((r) => r.arm === arm).map((r) => r[k]));
    const out = [
      `calls repo ${a.length}, cand ${b.length}; counts differ on ${differ}`,
      ...runs.map((r) => `${r.arm}: pass ${r.pass.toFixed(0)} ms, Σ Tight ${r.tight.toFixed(0)} ms`),
      `min Σ Tight: repo ${min('repo', 'tight').toFixed(0)} → cand ${min('cand', 'tight').toFixed(0)} ms (×${(min('repo', 'tight') / min('cand', 'tight')).toFixed(2)})`,
      `min pass: repo ${min('repo', 'pass').toFixed(0)} → cand ${min('cand', 'pass').toFixed(0)} ms (saved ${(min('repo', 'pass') - min('cand', 'pass')).toFixed(0)} ms, ${(((min('repo', 'pass') - min('cand', 'pass')) / min('repo', 'pass')) * 100).toFixed(1)} %)`,
    ];
    writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
  }, 7_200_000);
});
