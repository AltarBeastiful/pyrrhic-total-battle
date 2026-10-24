/**
 * 330 — **the Tight corpus**: every `RaiseKernel.position` input a Tight reading asks, captured once so the
 * search experiments 331+ replay the identical boxes on any kernel build without re-running the app.
 *
 * Four sources, each tagged:
 *  - `live`: one full Generate + advisor (224's workload: generate positions, upgrades, captains + captain
 *    upgrades, other probes) on the account, every `position()` call recorded by a wrapping raise kernel;
 *  - `stop`: the account at Leonidas ★0/★1/★2, every stop of the plan, priced as `runPositions` does;
 *  - `bench`: every stop of every `criteriaScenarios()` plan (the raise golden's own corpus);
 *  - `shape`: 270's stress corpus — every distinct re-typed frontier shape at the burn-saver / silver-saver /
 *    sweet-spot burn, ★0/★1/★2.
 *
 * Written as JSON (requests deduplicated by identity) to `CORPUS` (default scratch `tx/corpus.json`).
 *
 * `THEORY=1 ACCT=<file> CORPUS=<file> OUTF=<file> pnpm vitest run tools/theorycraft/330-tight-corpus.test.ts`
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign, planMarch, withMethod } from '../../src/engine';
import { leadLineup } from '../../src/engine/captainUpgrades';
import { setRaiseKernel, type RaiseInput, type RaiseKernel } from '../../src/engine/fast';
import type { CampaignInput } from '../../src/engine/plan';
import { genericProbes } from '../../src/engine/probes';
import { retypeMarch } from '../../src/engine/retype';
import type { StackRequest } from '../../src/engine/types';
import { createRaiseKernel } from '../../src/kernel/raise';
import { parseImport } from '../../src/share/exportImport';
import { captainLineups } from '../../src/state/captainLineups';
import { captainUpgradeCandidates } from '../../src/state/captainUpgrades';
import { buildPlanRequest, buildStackRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { otherProbes } from '../../src/ui/sections/march/otherSearch';
import { positionTrades } from '../../src/ui/sections/march/positions';
import { troopFloor } from '../../src/ui/sections/march/raise';
import { openingPosition, pickOf } from '../../src/ui/sections/march/runStore';
import { runAdvisor } from '../../src/worker/advisor';
import { runCaptainAdvice } from '../../src/worker/captainAdvice';
import { runCaptainUpgrades, type UpgradeAsk } from '../../src/worker/captainUpgrades';
import { createInlineClient, type CalcClient } from '../../src/worker/client';
import { createCalcPool } from '../../src/worker/pool';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';

const NO_CLOCK = 1_000_000_000;
const SCRATCH = '/tmp/claude-1000/-home-remi-projects-pyrrhic-totalbattle/ddd23d57-5930-4d86-868e-64846315b06c/scratchpad/tx';

interface Call {
  src: string;
  label: string;
  req: number;
  input: Omit<RaiseInput, 'request'>;
  ms: number;
  how: string | null;
  space: number;
  scored: number;
  counts: Record<string, number> | null;
}

const tag = { src: 'live', label: '' };
const calls: Call[] = [];
const requests: StackRequest[] = [];
const reqIndex = new Map<StackRequest, number>();

function recorder(inner: RaiseKernel): RaiseKernel {
  return {
    position(input) {
      const t = performance.now();
      const out = inner.position(input);
      const ms = performance.now() - t;
      let req = reqIndex.get(input.request);
      if (req === undefined) {
        req = requests.length;
        requests.push(input.request);
        reqIndex.set(input.request, req);
      }
      const { request: _r, ...rest } = input;
      calls.push({ src: tag.src, label: tag.label, req, input: structuredClone(rest), ms, how: out?.how ?? null, space: out?.space ?? 0, scored: out?.scored ?? 0, counts: out?.counts ?? null });
      return out;
    },
  };
}

function lane(): CalcClient {
  const inner: CalcClient = { ...createInlineClient(), mode: 'worker' as const };
  return {
    ...inner,
    async plan(request, signal) { tag.label = 'plan'; return inner.plan(request, signal); },
    async positions(request, signal) { tag.label = 'positions'; return inner.positions(request, signal); },
    async probe(request, signal) { tag.label = `probe ${request.against?.probe.id ?? (request.shown === undefined ? 'baseline' : 'shown')}`; return inner.probe(request, signal); },
    async captains(request, signal) { tag.label = 'captains'; return inner.captains(request, signal); },
  };
}

async function runWorkload(profile: Profile): Promise<void> {
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId) ?? profile.setups[0]!;
  const input: CampaignInput = buildPlanRequest(profile, setup);
  const request = buildStackRequest(profile, setup);
  const client = lane();
  const pool = createCalcPool({ size: 1, createClient: lane });
  try {
    tag.src = 'live';
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

const key = (c: Record<string, number>): string => JSON.stringify(Object.entries(c).filter(([, v]) => v > 0).sort());

describe.skipIf(!process.env.THEORY)('330 — tight corpus', () => {
  it('captures', async () => {
    const out: string[] = [];
    const flush = () => writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
    setRaiseKernel(recorder(createRaiseKernel(loadKernelModule())));
    const parsed = parseImport(readFileSync(process.env.ACCT ?? '', 'utf8'));
    expect(parsed.kind).toBe('profile');
    if (parsed.kind !== 'profile') return;
    const parts = (process.env.PARTS ?? 'live,stop,bench,shape').split(',');
    let t = performance.now();
    if (parts.includes('live')) {
      await runWorkload(structuredClone(parsed.payload) as Profile);
      out.push(`live: ${calls.filter((c) => c.src === 'live').length} calls, ${(performance.now() - t).toFixed(0)} ms wall`);
      flush();
    }
    for (const star of [0, 1, 2]) {
      const profile = structuredClone(parsed.payload) as Profile;
      profile.sources.captains.find((c) => c.captainId === 'leonidas')!.star = star;
      const setup = profile.setups.find((one) => one.id === profile.activeSetupId) ?? profile.setups[0]!;
      const input = buildPlanRequest(profile, setup);
      if (parts.includes('stop')) {
        const plan = planCampaign(input);
        const req = withMethod(buildStackRequest(profile, setup), 'elite');
        for (const stop of plan.alternatives) {
          tag.src = 'stop';
          tag.label = `★${star} ${stop.pick}`;
          const base = planMarch(req, stop.counts).result;
          if (troopFloor(base) === null) continue;
          positionTrades(req, base, ['tight']);
        }
      }
      if (parts.includes('shape')) {
        const plan = planCampaign({ ...input, withFrontier: true });
        for (const stop of plan.alternatives) {
          if (stop.sequence !== undefined || !['burn-saver', 'silver-saver', 'sweet-spot'].includes(stop.pick)) continue;
          const shapes = new Map<string, Record<string, number>>();
          for (const r of plan.frontier ?? []) if (r.repeat.mercLost === stop.repeat.mercLost) shapes.set(key(r.counts), r.counts);
          for (const counts of shapes.values()) {
            const found = retypeMarch(input.request, counts, CAMPAIGN.putBack.rates, { tierCandidate: true });
            const base = planMarch(input.request, found?.counts ?? counts).result;
            tag.src = 'shape';
            tag.label = `★${star} ${stop.pick}`;
            positionTrades(input.request, base, ['tight']);
          }
        }
      }
      out.push(`★${star} done, ${calls.length} calls total, ${(performance.now() - t).toFixed(0)} ms`);
      flush();
    }
    if (parts.includes('bench')) {
      t = performance.now();
      for (const scenario of criteriaScenarios()) {
        let campaign;
        try {
          campaign = planCampaign({ request: scenario.request, marchTarget: HORIZON, budgetMs: CAMPAIGN.budgets.plan, ...CAMPAIGN.planFixes, putBack: CAMPAIGN.putBack });
        } catch (error) {
          if (!(error instanceof Error) || !error.message.startsWith('planCampaign:')) throw error;
          continue;
        }
        for (const stop of campaign.alternatives) {
          tag.src = 'bench';
          tag.label = `${scenario.label.slice(0, 60)} · ${stop.pick}`;
          const base = planMarch(scenario.request, stop.counts).result;
          positionTrades(scenario.request, base, ['tight']);
        }
      }
      out.push(`bench done, ${calls.filter((c) => c.src === 'bench').length} calls, ${(performance.now() - t).toFixed(0)} ms`);
    }
    const bySrc: Record<string, { n: number; ms: number; walked: number; searched: number; msSearched: number }> = {};
    for (const c of calls) {
      const b = (bySrc[c.src] ??= { n: 0, ms: 0, walked: 0, searched: 0, msSearched: 0 });
      b.n += 1; b.ms += c.ms;
      if (c.how === 'walked') b.walked += 1;
      if (c.how === 'searched') { b.searched += 1; b.msSearched += c.ms; }
    }
    for (const [src, b] of Object.entries(bySrc)) out.push(`${src}: ${b.n} calls, ${b.ms.toFixed(0)} ms, walked ${b.walked}, searched ${b.searched} (${b.msSearched.toFixed(0)} ms)`);
    writeFileSync(process.env.CORPUS ?? `${SCRATCH}/corpus.json`, JSON.stringify({ requests, calls }));
    flush();
  }, 7_200_000);
});
