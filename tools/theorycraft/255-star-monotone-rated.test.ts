/**
 * 255 — **is the displayed merc saver monotone in a star, on the owner's rating?** (follows 254). The merc saver
 * Tight-raised at Leonidas ★0 is played under ★1's bonuses and rated against the ★1 plan's own Tight-raised merc
 * saver, with the best raised candidate at that burn beside them. A positive rating means the ★1 bar left a better
 * march on the table.
 *
 * `THEORY=1 ACCT=<file> OUTF=<file> pnpm vitest run tools/theorycraft/255-star-monotone-rated.test.ts`
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign, planMarch } from '../../src/engine';
import { rate } from '../../src/engine/rating';
import type { Bill } from '../../src/engine/rating';
import type { StackRequest, StackResult } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { Profile } from '../../src/state/schema';
import { hiredLost } from '../../src/ui/sections/march/hired';
import { applyCounts } from '../../src/ui/sections/march/manual';
import { positionTrades } from '../../src/ui/sections/march/positions';
import { countsOf } from '../../src/ui/sections/march/raise';

function tightOf(request: StackRequest, stopCounts: Record<string, number>): { counts: Record<string, number>; bill: Bill } {
  const base: StackResult = planMarch(request, stopCounts).result;
  const own = countsOf(base);
  const tight = positionTrades(request, base, ['tight']).rows[0];
  const counts = { ...own, ...(tight?.counts ?? {}) };
  const { result, summary } = applyCounts(request, base, counts);
  return { counts, bill: { damage: summary.minDamage, silver: summary.recovery.silver, gold: summary.recovery.gold, hired: hiredLost(result.stacks) } };
}
const show = (b: Bill): string => `dmg ${String(b.damage)} silver ${String(Math.round(b.silver ?? 0))} gold ${String(b.gold)} burn ${String(b.hired)}`;

describe.skipIf(!process.env.THEORY)('255 — star monotone, rated', () => {
  it('rates the ★0 merc saver under ★1', () => {
    const parsed = parseImport(readFileSync(process.env.ACCT ?? '', 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('profile');
    const inputs = [0, 1].map((star) => {
      const profile = structuredClone(parsed.payload) as Profile;
      profile.sources.captains.find((c) => c.captainId === 'leonidas')!.star = star;
      const input = buildPlanRequest(profile, profile.setups[0]!);
      return { input, plan: planCampaign({ ...input, withTrade: true }) };
    });
    const out: string[] = [];
    const [z, o] = inputs as [(typeof inputs)[number], (typeof inputs)[number]];
    for (const pick of ['burn-saver', 'silver-saver', 'sweet-spot', 'steady-max'] as const) {
      const zs = z.plan.alternatives.find((a) => a.pick === pick);
      const os = o.plan.alternatives.find((a) => a.pick === pick);
      if (!zs || !os) continue;
      const own1 = tightOf(o.input.request, os.counts);
      const old1 = tightOf(o.input.request, zs.counts); // the ★0 stop, raised, under ★1
      const own0 = tightOf(z.input.request, zs.counts);
      out.push(`[${pick}] ★0 own: ${show(own0.bill)}`);
      out.push(`[${pick}] ★1 own: ${show(own1.bill)}`);
      out.push(`[${pick}] ★0's stop under ★1: ${show(old1.bill)}  rating vs ★1 own: ${rate(own1.bill, old1.bill, CAMPAIGN.markerRates).toFixed(2)}`);
    }
    writeFileSync(process.env.OUTF ?? '/dev/stdout', out.join('\n') + '\n');
  }, 1_800_000);
});
