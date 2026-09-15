/**
 * 86 — **the stops the slider carries** (owner, 2026-09-15: *"the slider should control this I guess… find a few
 * 4-5 common, good picks to have a slider control how much silver vs merc we want to spend, which was the whole
 * point. Just we're doing this configured and backed by data. The algorithm should still try to figure out
 * where are the best 3-5 best spots and place us in the sweet spot by default and let us slide in other good
 * and backed-by-calculation-and-data spots."*)
 *
 * `CampaignPlan.alternatives` stopped being an even sample of the frontier and became the **named picks** —
 * each the answer to a question a player asks, each defined by a rule with no parameter to set, deduplicated by
 * their counts. This file is the check: what the bar carries on the owner's account at the app's horizon, at
 * the old default, and at a silver budget where the picks are supposed to collapse to one.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/86-slider-stops.test.ts`
 */
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine/plan';
import { chunks } from '../../src/engine/recovery';
import type { StackRequest } from '../../src/engine/types';
import { MERC_IDS, Report, evaluateCounts, loadOwner, n, scenarioC, withHousing } from './harness';

describe.skipIf(!process.env.THEORY)('the stops the slider carries', () => {
  it('reports the engine’s own stops, at three settings', () => {
    const report = new Report('86-slider-stops');
    const owner = loadOwner();
    const base: StackRequest = scenarioC(withHousing(owner.twelve, { leadership: 4_343, authority: 2_000 }));

    report.h('The account');
    report.add(
      `Owner's export, scenario C, 4 343 leadership / ${n(base.housing.authority)} authority. Every figure is ` +
        `\`simulateBattle\` on the counts the engine chose for that stop.`,
    );

    const CASES = [
      { label: "the app's horizon (4)", marchTarget: 4, silverBudget: undefined },
      { label: 'the old default (10)', marchTarget: 10, silverBudget: undefined },
      { label: 'horizon 4 with a 5 M silver budget', marchTarget: 4, silverBudget: 5_000_000 },
    ] as const;

    for (const testCase of CASES) {
      const plan = planCampaign({
        request: base,
        marchTarget: testCase.marchTarget,
        alternatives: 5,
        ...(testCase.silverBudget === undefined ? {} : { silverBudget: testCase.silverBudget }),
      });
      const sweet = plan.recommend;

      report.h(testCase.label);
      report.add(
        `**${n(plan.alternatives.length)} stops**, cheapest first; the frontier holds more and says so ` +
          `(\`leftOut\` = ${n(plan.leftOut)}). The bar opens on the **sweet spot**.\n\n` +
          `| # | the plan’s own name | stacks | hired a march | burned a march | damage a march | silver a march | damage a silver | damage a hired | is the sweet spot? |\n` +
          `|---|---|---|---|---|---|---|---|---|---|\n` +
          plan.alternatives
            .map((point, index) => {
              const { result, summary } = evaluateCounts(base, point.counts);
              const hired = MERC_IDS.reduce((sum, id) => sum + (point.counts[id] ?? 0), 0);
              const burned = MERC_IDS.reduce((sum, id) => sum + chunks(point.counts[id] ?? 0), 0);
              const isSweet =
                sweet !== undefined && JSON.stringify(sweet.counts) === JSON.stringify(point.counts);
              return (
                `| ${n(index + 1)} | ${point.label} | ${n(result.stacks.length)} | ${n(hired)} | ${n(burned)} | ` +
                `**${n(summary.avgDamage)}** | ${n(summary.recovery.silver)} | ` +
                `${(summary.avgDamage / Math.max(1, summary.recovery.silver)).toFixed(2)} | ` +
                `${(summary.avgDamage / Math.max(1, burned)).toFixed(0)} | ${isSweet ? '**yes**' : '—'} |`
              );
            })
            .join('\n'),
      );
    }

    report.save();
  }, 1_800_000);
});
