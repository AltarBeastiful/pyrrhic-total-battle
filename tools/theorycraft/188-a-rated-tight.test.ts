/**
 * 188 — **can `Tight` buy a better trade?** (owner, 2026-10-07: *"Tight almost always feels better than as is
 * and no other even compares as they always use more mercs. Lets first check if we can optimize tight further
 * to get better trades, then lets move it as default"*).
 *
 * `Tight` today is the exhaustive raise under one cap — not one authority chunk past the plan's own counts —
 * ranked on **damage alone**: every extra unit the shelter and the housing allow is taken the moment it adds a
 * point of damage, whatever silver and gold it costs to bring back. This prices the same box, under the same cap
 * and from the same seed, ranked instead by **the owner's rating against the plan's own march**
 * (`rate(as is, candidate, markerRates)`, `src/engine/rating.ts`) over damage, silver, gold and the hired burn.
 * The seed is the plan's own counts, whose rating is 0, so the rated answer can never rate below `As is`.
 *
 * On every stop of every benchmark army, three rows: `As is`, `Tight` (damage) and `Tight` (rated), each with
 * damage, silver, gold, mercenaries burnt and its rating against `As is`. Reported, not asserted, except the
 * promises both variants share: never past the plan's burn, never a rating below 0 for the rated one.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/188-a-rated-tight.test.ts`
 */
import { appendFileSync, writeFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign, planMarch } from '@/engine';
import { rate } from '@/engine/rating';
import type { Bill } from '@/engine/rating';
import type { StackRequest, StackResult } from '@/engine/types';
import { applyCounts } from '@/ui/sections/march/manual';
import { hiredLost } from '@/ui/sections/march/hired';
import { countsOf } from '@/ui/sections/march/raise';
import { positionTrades } from '@/ui/sections/march/positions';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { exactRaise } from './exact-raise';
import type { RaiseRank } from './exact-raise';
import { Report, n } from './harness';

const TIGHT = { authority: 'tight', dominance: 'tight' } as const;

/** The TypeScript search is the slow half; a box wider than this is reported, not searched. */
const MAX_SPACE = Number(process.env.MAX_SPACE ?? 200_000);
const PROGRESS = new URL('./out/188-progress.log', import.meta.url);

function billOf(request: StackRequest, base: StackResult, counts: Record<string, number>): Bill {
  const { result, summary } = applyCounts(request, base, counts);
  return {
    damage: summary.minDamage,
    silver: summary.recovery.silver,
    gold: summary.recovery.gold,
    hired: hiredLost(result.stacks),
  };
}

/** The counts above nought, by unit: a zero and an absent unit are the same army. */
const live = (counts: Record<string, number>): [string, number][] =>
  Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort(([a], [b]) => (a < b ? -1 : 1));

const pct = (to: number, from: number): string =>
  from === 0 || to === from ? '—' : `${to > from ? '+' : ''}${(((to - from) / from) * 100).toFixed(2)} %`;

describe.skipIf(!process.env.THEORY)('a rated tight', () => {
  it('prices tight by damage and by rating on every stop', () => {
    const report = new Report('188-a-rated-tight');
    report.add(
      '`Tight` ranked by damage (shipped) and by the owner’s rating against `As is` (markerRates ' +
        `${JSON.stringify(CAMPAIGN.markerRates)}), same box, same cap, same seed.`,
    );
    const broken: string[] = [];
    const summary = { stops: 0, moved: 0, better: 0, worse: 0, same: 0 };
    const rates = { damage: [] as number[], rated: [] as number[] };
    const deltas = { damage: [] as number[], silver: [] as number[], gold: [] as number[] };
    let msDamage = 0;
    let msRated = 0;
    const skipped: string[] = [];
    let compared = 0;
    const mismatches: string[] = [];
    writeFileSync(PROGRESS, '');

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
      report.h(`**${scenario.label}**`);
      report.add('| stop | row | damage | silver | gold | merc | rating |');
      report.add('|---|---|---|---|---|---|---|');
      for (const stop of plan.alternatives) {
        const request = scenario.request;
        const base = planMarch(request, stop.counts).result;
        const own = countsOf(base);
        const asIs = billOf(request, base, own);

        // The shipped Tight, on the kernel (ranked by the rating since the port; held to the research copy below).
        let t = performance.now();
        const shipped = positionTrades(request, base, ['tight']).rows[0];
        msDamage += performance.now() - t;
        const byDmg = shipped === undefined ? null : { counts: shipped.counts, space: shipped.space };
        if ((shipped?.space ?? 0) > MAX_SPACE) {
          skipped.push(`${scenario.label} · ${stop.pick} (${String(shipped?.space)})`);
          appendFileSync(PROGRESS, `skip ${scenario.label} ${stop.pick} ${String(shipped?.space)}\n`);
          continue;
        }
        const rated: RaiseRank = (facts) =>
          rate(
            asIs,
            { damage: facts.damage, silver: facts.silver, gold: facts.gold, hired: facts.mercLost },
            CAMPAIGN.markerRates,
          );
        t = performance.now();
        const byRate = exactRaise(request, base, TIGHT, rated);
        msRated += performance.now() - t;
        appendFileSync(
          PROGRESS,
          `${scenario.label} ${stop.pick} space ${String(shipped?.space)} ${(performance.now() - t).toFixed(0)} ms\n`,
        );

        // **Parity (kernel port)**: the kernel's Tight now ranks by the rating, and must answer the research copy's counts.
        compared += 1;
        const kernelCounts = { ...own, ...(byDmg?.counts ?? {}) };
        const researchCounts = { ...own, ...(byRate?.counts ?? {}) };
        if (JSON.stringify(live(kernelCounts)) !== JSON.stringify(live(researchCounts))) {
          mismatches.push(`${scenario.label} · ${stop.pick}`);
        }
        const dmgBill = billOf(request, base, kernelCounts);
        const rateBill = billOf(request, base, { ...own, ...(byRate?.counts ?? {}) });
        const rDmg = rate(asIs, dmgBill, CAMPAIGN.markerRates);
        const rRate = rate(asIs, rateBill, CAMPAIGN.markerRates);
        summary.stops += 1;
        if (byDmg !== null && dmgBill.damage !== asIs.damage) summary.moved += 1;
        rates.damage.push(rDmg);
        rates.rated.push(rRate);
        if (rRate > rDmg + 1e-9) summary.better += 1;
        else if (rRate < rDmg - 1e-9) summary.worse += 1;
        else summary.same += 1;
        if (rateBill.damage !== dmgBill.damage || rateBill.silver !== dmgBill.silver) {
          deltas.damage.push(((rateBill.damage - dmgBill.damage) / dmgBill.damage) * 100);
          deltas.silver.push(
            dmgBill.silver ? (((rateBill.silver ?? 0) - (dmgBill.silver ?? 0)) / dmgBill.silver) * 100 : 0,
          );
          deltas.gold.push(
            dmgBill.gold ? (((rateBill.gold ?? 0) - (dmgBill.gold ?? 0)) / dmgBill.gold) * 100 : 0,
          );
        }
        if ((rateBill.hired ?? 0) > (asIs.hired ?? 0))
          broken.push(`${scenario.label} · ${stop.pick}: rated burnt past`);
        if ((dmgBill.hired ?? 0) > (asIs.hired ?? 0))
          broken.push(`${scenario.label} · ${stop.pick}: tight burnt past`);
        if (rRate < -1e-9) broken.push(`${scenario.label} · ${stop.pick}: rated below as is`);

        const row = (label: string, bill: Bill, rating: number | null) => {
          report.add(
            `| ${stop.pick} | ${label} | ${n(bill.damage)} ${pct(bill.damage, asIs.damage)} | ${n(
              bill.silver ?? 0,
            )} ${pct(bill.silver ?? 0, asIs.silver ?? 0)} | ${n(bill.gold ?? 0)} ${pct(
              bill.gold ?? 0,
              asIs.gold ?? 0,
            )} | ${n(bill.hired ?? 0)} | ${rating === null ? '—' : rating.toFixed(3)} |`,
          );
        };
        row('As is', asIs, null);
        row('Tight (rated)', rateBill, rRate);
      }
    }

    const mean = (xs: number[]) => (xs.length === 0 ? 0 : xs.reduce((a, b) => a + b, 0) / xs.length);
    report.h('Summary');
    report.add(
      [
        `- stops: ${String(summary.stops)}, where shipped Tight moves the damage: ${String(summary.moved)}`,
        `- kernel (rated) vs research copy (rated), by rating: better ${String(summary.better)} · same ${String(summary.same)} · worse ${String(summary.worse)}`,
        `- mean rating vs As is: damage ${mean(rates.damage).toFixed(3)} · rated ${mean(rates.rated).toFixed(3)}`,
        `- where the two differ (${String(deltas.damage.length)} stops), rated against damage: damage ${mean(deltas.damage).toFixed(2)} %, silver ${mean(deltas.silver).toFixed(2)} %, gold ${mean(deltas.gold).toFixed(2)} % (means)`,
        `- skipped (box over ${String(MAX_SPACE)}): ${String(skipped.length)} — ${skipped.join('; ')}`,
        `- time: damage ${msDamage.toFixed(0)} ms · rated ${msRated.toFixed(0)} ms (kernel) · rated on the TypeScript research copy`,
        `- note: the kernel's Tight now ranks by the rating; the damage-ranked table is saved as 188-a-rated-tight-before.md`,
        `- kernel vs research copy (rated): ${String(compared)} stops compared, ${String(mismatches.length)} mismatches${mismatches.length === 0 ? '' : ' — ' + mismatches.join('; ')}`,
        `- broken promises: ${broken.length === 0 ? 'none' : broken.join('; ')}`,
      ].join('\n'),
    );
    report.save();
    expect(mismatches).toStrictEqual([]);
    expect(broken).toStrictEqual([]);
  }, 1_800_000);
});
