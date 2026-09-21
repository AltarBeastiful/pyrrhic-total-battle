/**
 * 126 — **is gold a column?** (owner, 2026-09-21: *"in the plan table the silver column should only contain
 * silver and time to train. And lets think about adding a gold column if theres significant variance"*).
 *
 * The plan's table has six columns and a hard width: a seventh head measured **505 px in a 462 px pane** the
 * last time a price was tried as one (`PlanTrade.tsx`), which is why the training queue and the dragon coins
 * ride under the silver figure rather than beside it. So a **Gold** column has to earn its width, and this
 * experiment asks the two questions that decide it, of every army the repo can put a bar on:
 *
 *  1. **Does gold move along the bar at all?** A column whose cells read the same on every stop is a column
 *     of one fact, and that fact belongs in a sentence (design rule 15).
 *  2. **Does it say anything the table does not already say?** Gold is spent on two things — the monsters a
 *     plan revives and the hired units it burns for good — and *"Hired lost"* is already a column two cells
 *     along. If the stop that spends least gold is always the stop that burns least stock, the column is a
 *     second drawing of one axis (design rule 5).
 *
 * Both are asked under the **plan a new setup now opens on** — revive the top monster, retrain the rest
 * (`state/defaults.ts`, 2026-09-21) — because that is the plan that makes gold a price at all: under
 * "retrain everything" only the hired units cost gold, and under "revive everything" every stop pays the
 * Temple for its whole army. Each army is measured under all three, so the answer can say *which* plans a
 * gold column would be worth drawing for.
 *
 * Damage is the **worst opening** (S-94/S-108); silver, gold, coins and queue are the campaign's own.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/126-is-gold-a-column.test.ts`
 */
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine/plan';
import type { CampaignPlan } from '../../src/engine/plan';
import type { RecoveryMode, StackRequest, UnitFamily } from '../../src/engine/types';
import { CAMPAIGN } from '../../src/config';
import { Report, n } from './harness';
import { commonScenarios, HORIZON, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';
import type { Scenario } from '../../tests/engine/plan-scenarios';

/** The three plans a player can be on, the middle one being what a new setup opens with. */
const PLANS: { key: string; mode: RecoveryMode; families?: readonly UnitFamily[] }[] = [
  { key: 'retrain everything', mode: 'retrain' },
  { key: 'revive the top monster', mode: 'selective', families: ['monsters'] },
  { key: 'revive everything', mode: 'revive' },
];

function planOf(request: StackRequest, plan: (typeof PLANS)[number]): CampaignPlan | null {
  const recovery: StackRequest['recovery'] = {
    ...request.recovery,
    plan: {
      mode: plan.mode,
      ...(plan.families === undefined ? {} : { reviveFamilies: [...plan.families] }),
    },
  };
  try {
    // The app's own budgets and the app's own horizon, so a stop here is a stop the bar would draw.
    return planCampaign({
      request: { ...request, recovery },
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
    });
  } catch {
    return null;
  }
}

/** How far apart the extreme cells of one column are, as a share of the larger; 0 is a flat column. */
function spread(values: number[]): number {
  const high = Math.max(...values);
  const low = Math.min(...values);
  return high <= 0 ? 0 : (high - low) / high;
}

/** Which stop is the cheapest on a column, by index; ties go to the first. */
function cheapest(values: number[]): number {
  let at = 0;
  for (const [index, value] of values.entries()) if (value < (values[at] ?? Infinity)) at = index;
  return at;
}

describe.skipIf(!process.env.THEORY)('is gold a column', () => {
  it('measures how far gold moves along the bar, and whether it moves with the stock', () => {
    const report = new Report('126-is-gold-a-column');
    const profile = ownerProfile();
    const scenarios: Scenario[] = [
      ...(profile === null ? [] : ownerScenarios(profile)),
      ...commonScenarios(),
    ];

    report.add('');
    report.add(
      `**${n(scenarios.length)} armies**, each planned under the three recovery plans. A row is one army ` +
        'under one plan; "spread" is how far the extreme cells of that column are apart, as a share of the ' +
        'larger, so 0 % is a column that reads the same on every stop.',
    );

    const summary: Record<string, { rows: number; goldSpread: number[]; disagrees: number }> = {};

    for (const plan of PLANS) {
      report.h(`${plan.key}`);
      report.add('');
      report.add(
        '| army | stops | gold a march (by stop) | gold spread | silver spread | hired spread | cheapest gold ≠ cheapest hired |',
      );
      report.add('|---|---|---|---|---|---|---|');
      const stat = { rows: 0, goldSpread: [] as number[], disagrees: 0 };
      for (const scenario of scenarios) {
        const bar = planOf(scenario.request, plan);
        const stops = bar?.alternatives ?? [];
        if (stops.length < 2) continue;
        const gold = stops.map((row) => row.repeat.gold);
        const silver = stops.map((row) => row.repeat.silver);
        const hired = stops.map((row) => row.repeat.mercLost);
        const differs = cheapest(gold) !== cheapest(hired);
        stat.rows += 1;
        stat.goldSpread.push(spread(gold));
        if (differs) stat.disagrees += 1;
        report.add(
          `| ${scenario.label.slice(0, 54)} | ${n(stops.length)} | ${gold.map((one) => n(Math.round(one))).join(' · ')} | ${(
            spread(gold) * 100
          ).toFixed(
            1,
          )} % | ${(spread(silver) * 100).toFixed(1)} % | ${(spread(hired) * 100).toFixed(1)} % | ${
            differs ? 'yes' : 'no'
          } |`,
        );
      }
      summary[plan.key] = stat;
    }

    report.h('What it comes to');
    report.add('');
    report.add(
      '| plan | armies with a bar | median gold spread | armies where gold ranks the stops differently |',
    );
    report.add('|---|---|---|---|');
    for (const plan of PLANS) {
      const stat = summary[plan.key];
      if (stat === undefined || stat.rows === 0) continue;
      const sorted = [...stat.goldSpread].sort((a, b) => a - b);
      const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
      report.add(
        `| ${plan.key} | ${n(stat.rows)} | ${(median * 100).toFixed(1)} % | ${n(stat.disagrees)} of ${n(stat.rows)} |`,
      );
    }
    report.save();
    // Three whole plans over seventeen armies: the search itself is the cost, not the arithmetic here.
  }, 600_000);
});
