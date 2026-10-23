/**
 * 259 — **rank the shapes at a stop's burn on their Tight-raised figures** (follows 258). For each stop of each case
 * (the 2026-10-22 account at Leonidas ★0/★1/★2, then the benchmark armies), every distinct frontier shape at the stop's
 * burn is re-typed and raised by Tight; the best by the owner's rating against the shipped stop's Tight-raised march
 * is reported (0 when the shipped stop is the best), with the shape count and the milliseconds spent.
 *
 * `THEORY=1 ACCT=<file> OUTF=<file> [BENCH=1] pnpm vitest run tools/theorycraft/259-rank-on-tight.test.ts`
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign, planMarch } from '../../src/engine';
import type { CampaignInput } from '../../src/engine/plan';
import { rate } from '../../src/engine/rating';
import type { Bill } from '../../src/engine/rating';
import { marchBill, retypeMarch } from '../../src/engine/retype';
import type { StackRequest, StackResult } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { applyCounts } from '../../src/ui/sections/march/manual';
import { hiredLost } from '../../src/ui/sections/march/hired';
import { positionTrades } from '../../src/ui/sections/march/positions';
import { countsOf } from '../../src/ui/sections/march/raise';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';

function tightBill(request: StackRequest, counts: Record<string, number>): Bill {
  const base: StackResult = planMarch(request, counts).result;
  const own = countsOf(base);
  const tight = positionTrades(request, base, ['tight']).rows[0];
  const { result, summary } = applyCounts(request, base, { ...own, ...(tight?.counts ?? {}) });
  return { damage: summary.minDamage, silver: summary.recovery.silver, gold: summary.recovery.gold, hired: hiredLost(result.stacks) };
}
const key = (c: Record<string, number>): string => JSON.stringify(Object.entries(c).filter(([, v]) => v > 0).sort());

function study(label: string, input: CampaignInput, out: string[]): void {
  const plan = planCampaign({ ...input, withFrontier: true });
  for (const stop of plan.alternatives) {
    if (stop.sequence !== undefined || !['burn-saver', 'silver-saver', 'sweet-spot'].includes(stop.pick)) continue;
    const t0 = performance.now();
    const shipped = tightBill(input.request, stop.counts);
    const shapes = new Map<string, Record<string, number>>();
    for (const r of plan.frontier ?? [])
      if (r.repeat.mercLost === stop.repeat.mercLost) shapes.set(key(r.counts), r.counts);
    const shippedBase = marchBill(input.request, stop.counts);
    // A silver saver stays one: no shape may cost more silver than the shipped stop's raised march.
    const cap = stop.pick === 'silver-saver' ? (shipped.silver ?? Infinity) * 1.0 : Infinity;
    const rows: { pre: number; tight: number; bill: Bill }[] = [];
    for (const counts of shapes.values()) {
      const found = retypeMarch(input.request, counts, CAMPAIGN.putBack.rates, { tierCandidate: true });
      const next = found?.counts ?? counts;
      const pre = rate(shippedBase, marchBill(input.request, next), CAMPAIGN.markerRates);
      const bill = tightBill(input.request, next);
      if ((bill.silver ?? 0) > cap) continue;
      rows.push({ pre, tight: rate(shipped, bill, CAMPAIGN.markerRates), bill });
    }
    rows.sort((x, y) => y.pre - x.pre);
    const topK = (k: number): number => Math.max(0, ...rows.slice(0, k).map((r) => r.tight));
    const best = rows.reduce((m, r) => (r.tight > m.tight ? r : m), { pre: 0, tight: 0, bill: shipped });
    const ms = performance.now() - t0;
    out.push(
      `${label} | ${stop.pick} | shapes ${String(shapes.size)} | shipped ${String(shipped.damage)}/${String(Math.round(shipped.silver ?? 0))} | best +${best.tight.toFixed(2)} ${String(best.bill.damage)}/${String(Math.round(best.bill.silver ?? 0))} | topK 1/3/5/10: ${[1, 3, 5, 10].map((k) => topK(k).toFixed(2)).join('/')} | ${ms.toFixed(0)} ms`,
    );
  }
}

describe.skipIf(!process.env.THEORY)('259 — rank on tight', () => {
  it('prices the alternatives', () => {
    const out: string[] = [];
    const parsed = parseImport(readFileSync(process.env.ACCT ?? '', 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('profile');
    for (const star of [0, 1, 2]) {
      const profile = structuredClone(parsed.payload) as Profile;
      profile.sources.captains.find((c) => c.captainId === 'leonidas')!.star = star;
      study(`acct ★${String(star)}`, buildPlanRequest(profile, profile.setups[0]!), out);
      writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
    }
    if (process.env.BENCH !== undefined)
      for (const sc of criteriaScenarios()) {
        try {
          study(sc.label, { request: sc.request, marchTarget: HORIZON, ...CAMPAIGN.planFixes, putBack: CAMPAIGN.putBack }, out);
        } catch (e) {
          out.push(`${sc.label} | skipped: ${String(e)}`);
        }
        writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
      }
  }, 3_600_000);
});
