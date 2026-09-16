/**
 * 91 — **the cross review**: every S-58 flag against every way of drawing the bar, on the engine's own figures.
 *
 * The owner, 2026-09-16, after the review of S-59: *"build the recommendation with a feature flag and let's
 * compare the two ways with theorycraft using the engine … then we'll do a full cross review of each S58
 * feature flag, the recommendation and current way with your fixes to completely understand and compare if
 * we're going in the right direction in terms of damage, damage across a campaign (around 4 marches),
 * dmg/silver and dmg/merc or merc spent each march."*
 *
 * Three ways of drawing the bar, over one search each:
 *
 *  - **current** — S-59 as shipped: four named answers sorted by campaign silver (`barAxis: 'silver'`);
 *  - **current + merge** — the same, with `mergeNearStops: 0.02`: two stops that burn the same and sit within
 *    2 % of each other on damage and silver a march are one stop;
 *  - **burn axis** — the recommendation: one plan a burn level, thriftiest first, the same sweet spot
 *    (`barAxis: 'burn'`).
 *
 * Crossed with the S-58 flags: none, A (`tokenFloor`), B (`refuseDroppedTypes`), A + B. A changes what the
 * search can express, so its sweet spot may move; B only changes what the band offers.
 *
 * Every figure is the engine's: `planCampaign` on the owner's export, scenario C, the app's horizon (4), no
 * budget. A stop's row is the repeated march (`repeat`); the campaign columns are the plan's four marches
 * with the finale (`totalDamage`, `silver`, `gold`, `mercLost`).
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/91-cross-review.test.ts`
 */
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine/plan';
import type { CampaignPlan, PlanRow, PlanTotals } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import { MERC_IDS, Report, loadOwner, n, scenarioC, withHousing } from './harness';

const HORIZON = 4;
const KEEP = 4;
const MERGE = 0.02;

const perSilver = (row: PlanTotals): number =>
  row.repeat.silver > 0 ? row.repeat.damage / row.repeat.silver : 0;
const perHired = (row: PlanTotals): number =>
  row.repeat.mercLost > 0 ? row.repeat.damage / row.repeat.mercLost : 0;
const short = (id: string): string => id.replace(/-6$/, '').replace('epic-monster-hunter', 'EMH');
const hiredOf = (row: PlanTotals): string =>
  MERC_IDS.map((id) => `${short(id)} ${n(row.counts[id] ?? 0)}`).join(' · ');
const holes = (row: PlanTotals, stocked: readonly string[]): string[] =>
  stocked.filter((id) => (row.counts[id] ?? 0) === 0).map(short);

const FLAGS: { key: string; flags: { tokenFloor?: boolean; refuseDroppedTypes?: boolean } }[] = [
  { key: 'none', flags: {} },
  { key: 'A · tokenFloor', flags: { tokenFloor: true } },
  { key: 'B · refuseDroppedTypes', flags: { refuseDroppedTypes: true } },
  { key: 'A + B', flags: { tokenFloor: true, refuseDroppedTypes: true } },
];
const WAYS: { key: string; input: { barAxis?: 'silver' | 'burn'; mergeNearStops?: number } }[] = [
  { key: 'current', input: { barAxis: 'silver' } },
  { key: 'current + merge', input: { barAxis: 'silver', mergeNearStops: MERGE } },
  { key: 'burn axis', input: { barAxis: 'burn' } },
];

describe.skipIf(!process.env.THEORY)('the cross review', () => {
  it('crosses every S-58 flag with every way of drawing the bar', () => {
    const report = new Report('91-cross-review');
    const owner = loadOwner();
    const base: StackRequest = scenarioC(withHousing(owner.twelve, { leadership: 4_343, authority: 2_000 }));
    const stocked = MERC_IDS.filter((id) => (base.caps[id] ?? 0) > 0);

    report.h('The frame');
    report.add(
      `Owner's export, scenario C, 4 343 leadership / 2 000 authority, horizon **${n(HORIZON)}**, no budget, ` +
        `the bar capped at ${n(KEEP)} stops. Stock: ${stocked.map((id) => `${short(id)} ${n(base.caps[id] ?? 0)}`).join(' · ')}.\n\n` +
        `Three ways of drawing the bar (*current* = S-59 as shipped, sorted by campaign silver; *current + merge* ` +
        `= the same with stops that burn the same and sit within ${n(MERGE * 100)} % of each other on damage and ` +
        `silver a march merged; *burn axis* = one plan a burn level, thriftiest first, the same sweet spot), ` +
        `crossed with the S-58 flags (A = the grid's thrift end samples one chunk of every hired type, B = the ` +
        `band refuses a plan that fields none of a stocked type). A changes the search; B and the bar's way ` +
        `change only what is offered, so the rows with A off share one search.\n\n` +
        `A row is the **repeated march**; "campaign" columns are the plan's ${n(HORIZON)} marches with the finale.`,
    );

    const summary: string[] = [];
    const rowLine = (row: PlanRow, plan: CampaignPlan): string => {
      const sweet = plan.recommend && JSON.stringify(plan.recommend.counts) === JSON.stringify(row.counts);
      const hole = holes(row, stocked);
      return (
        `| \`${row.pick}\`${sweet ? ' ★' : ''} | ${n(row.repeat.mercLost)} | **${n(row.repeat.damage)}** | ` +
        `${n(row.repeat.silver)} | ${n(row.repeat.gold)} | ${perSilver(row).toFixed(2)} | ${n(Math.round(perHired(row)))} | ` +
        `${n(row.totalDamage)} | ${n(row.silver)} | ${n(row.gold)} | ${n(row.mercLost)} | ` +
        `${hiredOf(row)}${hole.length > 0 ? ` — **none of ${hole.join(', ')}**` : ''} |`
      );
    };

    for (const { key: flagKey, flags } of FLAGS) {
      report.h(`S-58 ${flagKey}`);
      for (const { key: wayKey, input } of WAYS) {
        const plan = planCampaign({
          request: base,
          marchTarget: HORIZON,
          alternatives: KEEP,
          withTrade: true,
          ...flags,
          ...input,
        });
        const trade = plan.trade ?? [];
        const burns = trade.map((row) => row.repeat.mercLost);
        report.add(`### ${wayKey}\n`);
        report.add(
          `${n(plan.alternatives.length)} stops, left to right as the bar draws them; the band offers ` +
            `${n(trade.length)} plans burning ${n(Math.min(...burns))}–${n(Math.max(...burns))} a march, ` +
            `\`leftOut\` ${n(plan.leftOut)}. ★ marks the sweet spot (where the bar opens).\n`,
        );
        report.add(
          '| pick | burned a march | damage a march | silver a march | gold a march | damage a silver | damage a hired | campaign damage | campaign silver | campaign gold | campaign burned | hired fielded |\n' +
            '|---|---|---|---|---|---|---|---|---|---|---|---|',
        );
        for (const row of plan.alternatives) report.add(rowLine(row, plan));
        const sweet = plan.recommend;
        if (sweet) {
          const hole = holes(sweet, stocked);
          summary.push(
            `| ${flagKey} | ${wayKey} | ${n(plan.alternatives.length)} | ` +
              `${plan.alternatives.map((row) => n(row.repeat.mercLost)).join(' · ')} | ` +
              `${n(sweet.repeat.mercLost)} | **${n(sweet.repeat.damage)}** | ${n(sweet.repeat.silver)} | ` +
              `${n(sweet.repeat.gold)} | ${perSilver(sweet).toFixed(2)} | ${n(Math.round(perHired(sweet)))} | ` +
              `${n(sweet.totalDamage)} | ${n(sweet.mercLost)} | ` +
              `${plan.alternatives.filter((row) => holes(row, stocked).length > 0).length}` +
              `${hole.length > 0 ? ` (the sweet spot: none of ${hole.join(', ')})` : ''} |`,
          );
        }
      }
    }

    report.h('The cross review, one line a cell');
    report.add(
      'The sweet spot is the same plan on every way of drawing the bar with the same S-58 flags (the bar changes ' +
        'what stands beside it, not what the app opens on); it can move under A, which changes the search. ' +
        '"stops with a hole" counts the rows on the bar that field none of a stocked hired type.\n',
    );
    report.add(
      '| S-58 | bar | stops | burns, left to right | sweet: burned | sweet: damage a march | sweet: silver a march | sweet: gold a march | sweet: damage a silver | sweet: damage a hired | sweet: campaign damage | sweet: campaign burned | stops with a hole |\n' +
        '|---|---|---|---|---|---|---|---|---|---|---|---|---|',
    );
    for (const line of summary) report.add(line);
    report.save();
  });
});
