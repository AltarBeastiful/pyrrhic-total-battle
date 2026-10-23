/**
 * 258 — **retype before the prune** (follows 257): the merc saver's burn level holds ~100 distinct shapes on the
 * frontier, of which dominance keeps a handful and the rated re-typing then runs on those alone. Every distinct shape
 * at that burn is re-typed here, and the best by the owner's rating against the shipped merc saver's base is raised by
 * Tight, for Leonidas ★0 and ★1, beside what the plan ships.
 *
 * `THEORY=1 ACCT=<file> OUTF=<file> pnpm vitest run tools/theorycraft/258-retype-before-prune.test.ts`
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign, planMarch } from '../../src/engine';
import { rate } from '../../src/engine/rating';
import type { Bill } from '../../src/engine/rating';
import { marchBill, retypeMarch } from '../../src/engine/retype';
import type { StackRequest, StackResult } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { hiredLost } from '../../src/ui/sections/march/hired';
import { applyCounts } from '../../src/ui/sections/march/manual';
import { positionTrades } from '../../src/ui/sections/march/positions';
import { countsOf } from '../../src/ui/sections/march/raise';

function tightBill(request: StackRequest, counts: Record<string, number>): Bill {
  const base: StackResult = planMarch(request, counts).result;
  const own = countsOf(base);
  const tight = positionTrades(request, base, ['tight']).rows[0];
  const { result, summary } = applyCounts(request, base, { ...own, ...(tight?.counts ?? {}) });
  return { damage: summary.minDamage, silver: summary.recovery.silver, gold: summary.recovery.gold, hired: hiredLost(result.stacks) };
}
const show = (b: Bill): string => `dmg ${String(b.damage)} silver ${String(Math.round(b.silver ?? 0))} gold ${String(b.gold)}`;

describe.skipIf(!process.env.THEORY)('258 — retype before prune', () => {
  it('retypes every shape at the merc saver burn', () => {
    const parsed = parseImport(readFileSync(process.env.ACCT ?? '', 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('profile');
    const out: string[] = [];
    for (const star of [0, 1]) {
      const profile = structuredClone(parsed.payload) as Profile;
      profile.sources.captains.find((c) => c.captainId === 'leonidas')!.star = star;
      const input = buildPlanRequest(profile, profile.setups[0]!);
      const plan = planCampaign({ ...input, withFrontier: true });
      const shipped = plan.alternatives.find((a) => a.pick === 'burn-saver')!;
      const burn = shipped.repeat.mercLost;
      const shapes = new Map<string, Record<string, number>>();
      for (const r of plan.frontier ?? [])
        if (r.repeat.mercLost === burn) shapes.set(JSON.stringify(Object.entries(r.counts).filter(([, v]) => v > 0).sort()), r.counts);
      const shippedBase = marchBill(input.request, shipped.counts);
      const shippedTight = tightBill(input.request, shipped.counts);
      out.push(`== ★${String(star)}: ${String(shapes.size)} shapes at burn ${String(burn)}; shipped ${show(shippedBase)} -> tight ${show(shippedTight)}`);
      const rows: { retyped: Record<string, number>; bill: Bill; rating: number }[] = [];
      for (const counts of shapes.values()) {
        const found = retypeMarch(input.request, counts, CAMPAIGN.putBack.rates, { tierCandidate: true });
        const next = found?.counts ?? counts;
        const bill = marchBill(input.request, next);
        rows.push({ retyped: next, bill, rating: rate(shippedBase, bill, CAMPAIGN.markerRates) });
      }
      rows.sort((a, b) => b.rating - a.rating);
      out.push('  top 5 retyped shapes by rating against the shipped base:');
      for (const r of rows.slice(0, 5)) out.push(`   rating ${r.rating.toFixed(2)}  ${show(r.bill)}`);
      const cheapest = [...rows].sort((a, b) => (a.bill.silver ?? 0) - (b.bill.silver ?? 0))[0]!;
      out.push(`  least silver after retype: ${show(cheapest.bill)} (rating ${cheapest.rating.toFixed(2)})`);
      const best = rows[0]!;
      const bestTight = tightBill(input.request, best.retyped);
      out.push(`  best-rated -> tight ${show(bestTight)}; rating of that vs shipped tight ${rate(shippedTight, bestTight, CAMPAIGN.markerRates).toFixed(2)}`);
      const cheapTight = tightBill(input.request, cheapest.retyped);
      out.push(`  least-silver -> tight ${show(cheapTight)}; rating vs shipped tight ${rate(shippedTight, cheapTight, CAMPAIGN.markerRates).toFixed(2)}`);
    }
    writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
  }, 1_800_000);
});
