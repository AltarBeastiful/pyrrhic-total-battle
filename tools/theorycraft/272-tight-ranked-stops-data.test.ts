/**
 * 272 — **the data for ranking a stop's candidates on their Tight-raised figures** (follows 259, 270, 271). For each
 * non-sequence stop of each case (the 2026-10-22 account at Leonidas ★0/★1/★2, then every `criteriaScenarios()`
 * army), every distinct frontier shape at the stop's burn is re-typed (`retypeMarch`, `tierCandidate`), built
 * (`planMarch`) and read four ways against the shipped stop: its pre-Tight rating (vs the shipped stop's own march),
 * two cheap Tight proxies (the same kernel search with 0 and 4 restarts instead of 64) and the full Tight (the bar's
 * own reading). Everything rated by `rate(shipped Tight bill, candidate bill, CAMPAIGN.markerRates)`. One JSON line
 * per stop goes to `OUTF`; the selection rules are scored on it offline (`273`).
 *
 * The raise kernel is `KWASM` when set (271's hashed-memo build, proven byte-identical there) for every arm.
 *
 * `THEORY=1 ACCT=<file> OUTF=<file.jsonl> [KWASM=<wasm>] [CASES=acct|bench|both] [STOP_BUDGET_MS=900000] pnpm vitest run tools/theorycraft/272-tight-ranked-stops-data.test.ts`
 */
/// <reference types="node" />
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign, planMarch } from '../../src/engine';
import { RAISE_TIGHT, setRaiseKernel } from '../../src/engine/fast';
import type { RaiseKernel } from '../../src/engine/fast';
import type { CampaignInput } from '../../src/engine/plan';
import { rate } from '../../src/engine/rating';
import type { Bill } from '../../src/engine/rating';
import { marchBill, retypeMarch } from '../../src/engine/retype';
import type { StackRequest, StackResult } from '../../src/engine/types';
import { compileKernel } from '../../src/kernel';
import { EXACT_DEFAULTS, createRaiseKernel } from '../../src/kernel/raise';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { hiredLost } from '../../src/ui/sections/march/hired';
import { applyCounts } from '../../src/ui/sections/march/manual';
import { positionTrades } from '../../src/ui/sections/march/positions';
import { countsOf } from '../../src/ui/sections/march/raise';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';

const module = process.env.KWASM ? compileKernel(readFileSync(process.env.KWASM)) : loadKernelModule();
const full = createRaiseKernel(module);
const proxy0 = createRaiseKernel(module, { ...EXACT_DEFAULTS, restarts: 0 });
const proxy4 = createRaiseKernel(module, { ...EXACT_DEFAULTS, restarts: 4 });
const MODES = { authority: RAISE_TIGHT, dominance: RAISE_TIGHT };
const BUDGET = Number(process.env.STOP_BUDGET_MS ?? 900_000);

const key = (c: Record<string, number>): string => JSON.stringify(Object.entries(c).filter(([, v]) => v > 0).sort());

/** The Tight-raised bill under one kernel — `liftedCounts` without a burn cap, read as 259's `tightBill`. */
function tightBill(kernel: RaiseKernel, request: StackRequest, base: StackResult): { bill: Bill; ms: number; how: string | null; space: number } {
  const t = performance.now();
  const own = countsOf(base);
  const fast = kernel.position({ request, base, modes: MODES });
  let counts: Record<string, number>;
  if (fast !== null) counts = fast.counts;
  else {
    // The rare request the kernel cannot pack: the app's own path (the climb), under the full kernel.
    setRaiseKernel(full);
    counts = positionTrades(request, base, ['tight']).rows[0]?.counts ?? own;
  }
  const ms = performance.now() - t;
  const { result, summary } = applyCounts(request, base, { ...own, ...counts });
  return {
    bill: { damage: summary.minDamage, silver: summary.recovery.silver, gold: summary.recovery.gold, hired: hiredLost(result.stacks) },
    ms,
    how: fast?.how ?? null,
    space: fast?.space ?? 0,
  };
}
const slim = (b: Bill) => ({ d: b.damage, s: Math.round(b.silver ?? 0), g: Math.round(b.gold ?? 0), h: b.hired ?? 0 });

function study(label: string, input: CampaignInput): void {
  const t0 = performance.now();
  let plan;
  try {
    plan = planCampaign({ ...input, withFrontier: true });
  } catch (e) {
    appendFileSync(process.env.OUTF!, JSON.stringify({ label, skipped: String(e) }) + '\n');
    return;
  }
  const planMs = performance.now() - t0;
  const bar = plan.alternatives.map((s) => ({ pick: s.pick, burn: s.repeat.mercLost, seq: s.sequence !== undefined }));
  for (const [index, stop] of plan.alternatives.entries()) {
    if (stop.sequence !== undefined) continue;
    const started = performance.now();
    const shippedBase = planMarch(input.request, stop.counts).result;
    const shippedPre = marchBill(input.request, stop.counts);
    const shipped = tightBill(full, input.request, shippedBase);
    const shapes = new Map<string, Record<string, number>>();
    for (const r of plan.frontier ?? []) if (r.repeat.mercLost === stop.repeat.mercLost) shapes.set(key(r.counts), r.counts);
    const rows: unknown[] = [];
    let retypeMs = 0, buildMs = 0;
    const cands: { counts: Record<string, number>; pre: number }[] = [];
    const seen = new Set<string>([key(stop.counts)]);
    for (const counts of shapes.values()) {
      let a = performance.now();
      const found = retypeMarch(input.request, counts, CAMPAIGN.putBack.rates, { tierCandidate: true });
      retypeMs += performance.now() - a;
      const next = found?.counts ?? counts;
      if (seen.has(key(next))) continue;
      seen.add(key(next));
      a = performance.now();
      const pre = rate(shippedPre, marchBill(input.request, next), CAMPAIGN.markerRates);
      buildMs += performance.now() - a;
      cands.push({ counts: next, pre });
    }
    // Highest pre-Tight rating first, so a stop the budget cuts still has its likeliest winners read.
    cands.sort((x, y) => y.pre - x.pre);
    let complete = true;
    for (const c of cands) {
      if (performance.now() - started > BUDGET) {
        complete = false;
        break;
      }
      const a = performance.now();
      const base = planMarch(input.request, c.counts).result;
      buildMs += performance.now() - a;
      const p0 = tightBill(proxy0, input.request, base);
      const p4 = tightBill(proxy4, input.request, base);
      const f = tightBill(full, input.request, base);
      rows.push({
        pre: +c.pre.toFixed(4),
        r0: +rate(shipped.bill, p0.bill, CAMPAIGN.markerRates).toFixed(4),
        r4: +rate(shipped.bill, p4.bill, CAMPAIGN.markerRates).toFixed(4),
        rf: +rate(shipped.bill, f.bill, CAMPAIGN.markerRates).toFixed(4),
        bill: slim(f.bill),
        ms0: +p0.ms.toFixed(1),
        ms4: +p4.ms.toFixed(1),
        msf: +f.ms.toFixed(1),
        how: f.how,
        space: f.space,
      });
    }
    appendFileSync(
      process.env.OUTF!,
      JSON.stringify({
        label,
        index,
        pick: stop.pick,
        burn: stop.repeat.mercLost,
        bar,
        planMs: +planMs.toFixed(0),
        shapes: shapes.size,
        cands: cands.length,
        complete,
        shipped: { pre: slim(shippedPre), tight: slim(shipped.bill), ms: +shipped.ms.toFixed(1) },
        retypeMs: +retypeMs.toFixed(0),
        buildMs: +buildMs.toFixed(0),
        stopMs: +(performance.now() - started).toFixed(0),
        rows,
      }) + '\n',
    );
  }
}

describe.skipIf(!process.env.THEORY)('272 — tight-ranked stops, data', () => {
  it('reads every candidate four ways', () => {
    writeFileSync(process.env.OUTF!, '');
    setRaiseKernel(full);
    const cases = process.env.CASES ?? 'both';
    if (cases !== 'bench') {
      const parsed = parseImport(readFileSync(process.env.ACCT ?? '', 'utf8'));
      if (parsed.kind !== 'profile') throw new Error('profile');
      for (const star of [0, 1, 2]) {
        const profile = structuredClone(parsed.payload) as Profile;
        profile.sources.captains.find((c) => c.captainId === 'leonidas')!.star = star;
        study(`acct ★${String(star)}`, buildPlanRequest(profile, profile.setups[0]!));
      }
    }
    if (cases !== 'acct')
      for (const [i, sc] of criteriaScenarios().entries()) {
        // `FROM`: start at this scenario index (a second process can take the tail while a heavy camp runs).
        if (i < Number(process.env.FROM ?? 0)) continue;
        if (process.env.SKIP !== undefined && new RegExp(process.env.SKIP).test(sc.label)) continue;
        study(sc.label, { request: sc.request, marchTarget: HORIZON, ...CAMPAIGN.planFixes, putBack: CAMPAIGN.putBack });
      }
  }, 86_400_000);
});
