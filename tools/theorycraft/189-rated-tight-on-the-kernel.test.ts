/**
 * 189 — **the rated `Tight` on the kernel, every stop including the wide boxes** (owner, 2026-10-07; follows
 * experiment 188, which measured the rated rank on the TypeScript research copy and had to skip the six boxes
 * over 200 000 vectors — one is 2 × 10^25 and the TypeScript search did not come back from it).
 *
 * The damage-ranked `Tight` is what `tests/golden/raise.json` held before the port (`GOLDEN_BEFORE`, the file
 * at the commit the port started from); the rated one is what the kernel answers now (`positionTrades`). Both
 * are read through the app's own replay and rated against `As is` with `CAMPAIGN.markerRates`.
 *
 * `GOLDEN_BEFORE=<path> THEORY=1 pnpm vitest run tools/theorycraft/189-rated-tight-on-the-kernel.test.ts`
 */
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign, planMarch } from '@/engine';
import { rate } from '@/engine/rating';
import type { Bill } from '@/engine/rating';
import type { StackRequest, StackResult } from '@/engine/types';
import { hiredLost } from '@/ui/sections/march/hired';
import { applyCounts } from '@/ui/sections/march/manual';
import { positionTrades } from '@/ui/sections/march/positions';
import { countsOf } from '@/ui/sections/march/raise';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { Report, n } from './harness';

interface GoldenEntry {
  army: string;
  stop: string;
  rows: { mode: string; counts: Record<string, number> }[];
}

function billOf(request: StackRequest, base: StackResult, counts: Record<string, number>): Bill {
  const { result, summary } = applyCounts(request, base, counts);
  return {
    damage: summary.minDamage,
    silver: summary.recovery.silver,
    gold: summary.recovery.gold,
    hired: hiredLost(result.stacks),
  };
}

const pct = (to: number, from: number): string =>
  from === 0 || to === from ? '—' : `${to > from ? '+' : ''}${(((to - from) / from) * 100).toFixed(2)} %`;

describe.skipIf(!process.env.THEORY || !process.env.GOLDEN_BEFORE)('the rated tight on the kernel', () => {
  it('rates the damage-ranked and the rated tight on every stop', () => {
    const before = new Map(
      (JSON.parse(readFileSync(process.env.GOLDEN_BEFORE ?? '', 'utf8')) as GoldenEntry[]).map((entry) => [
        `${entry.army}|${entry.stop}`,
        entry.rows.find((row) => row.mode === 'tight')?.counts,
      ]),
    );
    const report = new Report('189-rated-tight-on-the-kernel');
    report.add('| army | stop | box | old Tight dmg · gold · rating | rated Tight dmg · gold · rating |');
    report.add('|---|---|---|---|---|');
    const tally = { stops: 0, better: 0, same: 0, worse: 0, belowAsIs: 0 };
    const sums = { old: 0, rated: 0 };
    const oldMismatch: string[] = [];
    for (const scenario of criteriaScenarios()) {
      let plan;
      try {
        plan = planCampaign({
          request: scenario.request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
      } catch (error) {
        if (!(error instanceof Error) || !error.message.startsWith('planCampaign:')) throw error;
        continue;
      }
      for (const stop of plan.alternatives) {
        const request = scenario.request;
        const base = planMarch(request, stop.counts).result;
        const own = countsOf(base);
        const asIs = billOf(request, base, own);
        const oldCounts = before.get(`${scenario.label}|${stop.pick}`);
        expect(oldCounts, `${scenario.label} · ${stop.pick}: not in the old golden`).toBeDefined();
        const priced = positionTrades(request, base, ['tight', 'tightOld']);
        const row = priced.rows.find((one) => one.mode === 'tight');
        const oldRow = priced.rows.find((one) => one.mode === 'tightOld');
        if (row === undefined || oldRow === undefined || oldCounts === undefined) continue;
        // **`Tight (old)` is the old Tight, count for count** — the comparison position the owner asked for is
        // only a comparison if it answers what shipped before the rating (`RAISE_TIGHT_DAMAGE`).
        const whole = (counts: Record<string, number>) =>
          Object.fromEntries(request.units.map((unit) => [unit.id, { ...own, ...counts }[unit.id] ?? 0]));
        if (JSON.stringify(whole(oldRow.counts)) !== JSON.stringify(whole(oldCounts))) {
          oldMismatch.push(`${scenario.label} · ${stop.pick}`);
        }
        const oldBill = billOf(request, base, { ...own, ...oldCounts });
        const newBill = billOf(request, base, { ...own, ...row.counts });
        const rOld = rate(asIs, oldBill, CAMPAIGN.markerRates);
        const rNew = rate(asIs, newBill, CAMPAIGN.markerRates);
        tally.stops += 1;
        sums.old += rOld;
        sums.rated += rNew;
        if (rNew > rOld + 1e-9) tally.better += 1;
        else if (rNew < rOld - 1e-9) tally.worse += 1;
        else tally.same += 1;
        if (rNew < -1e-9) tally.belowAsIs += 1;
        if (rNew !== rOld || row.space > 200_000) {
          report.add(
            `| ${scenario.label.slice(0, 60)} | ${stop.pick} | ${n(row.space)} | ${n(oldBill.damage)} ${pct(
              oldBill.damage,
              asIs.damage,
            )} · ${n(oldBill.gold ?? 0)} ${pct(oldBill.gold ?? 0, asIs.gold ?? 0)} · ${rOld.toFixed(3)} | ${n(
              newBill.damage,
            )} ${pct(newBill.damage, asIs.damage)} · ${n(newBill.gold ?? 0)} ${pct(
              newBill.gold ?? 0,
              asIs.gold ?? 0,
            )} · ${rNew.toFixed(3)} |`,
          );
        }
      }
    }
    report.h('Summary');
    report.add(
      [
        `- stops: ${String(tally.stops)}; rated vs old: better ${String(tally.better)} · same ${String(tally.same)} · worse ${String(tally.worse)}`,
        `- mean rating vs As is: old ${(sums.old / tally.stops).toFixed(3)} · rated ${(sums.rated / tally.stops).toFixed(3)}`,
        `- rated Tight below As is: ${String(tally.belowAsIs)}`,
        `- Tight (old) against the old golden: ${oldMismatch.length === 0 ? 'identical on every stop' : oldMismatch.join('; ')}`,
      ].join('\n'),
    );
    report.save();
    expect(tally.belowAsIs).toBe(0);
    expect(oldMismatch).toStrictEqual([]);
  }, 600_000);
});
