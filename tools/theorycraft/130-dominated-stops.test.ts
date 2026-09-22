/**
 * 130 — **does the bar offer a stop another of its own stops beats outright?** (W5 of
 * `docs/plans/beating-totalstack.md`, S-122, 2026-09-22.)
 *
 * W5's acceptance is *"no stop survives that another beats on all six markers"*. `beatsOnFigures` — the one
 * rule that removes a rung from the sweet spot's pool — read **silver and the burn** and nothing else until
 * this story, so a rung costing the same silver and the same hired chunks for the same damage but twice the
 * gold, or twice the dragon coins, was its neighbour's equal. This asks the question of the **bar** rather
 * than of the pool: of the stops the player is actually offered, is any of them beaten by another on damage
 * and on **every one of the four costs the owner names** — *"a fixed silver/merc/gold/dragon coins set"*?
 *
 * A dominated stop is not a bug on its own: the bar is a *range*, and a thrift stop that is dearer in gold
 * than the sweet spot may still be the one a player wants. What it is, is a stop that **nothing recommends**
 * — worse on something, better on nothing — and the bar is a recommendation.
 *
 * Built through the benchmark's own scenarios, so no option default is frozen in a literal here (the owner's
 * rule of 2026-09-21).
 *
 * `THEORY=1 npx vitest run tools/theorycraft/130-dominated-stops.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign } from '../../src/engine/plan';
import type { PlanRow, PlanTotals } from '../../src/engine/plan';
import {
  HORIZON,
  OWNER_EXPORT,
  commonScenarios,
  ownerProfile,
  ownerScenarios,
} from '../../tests/engine/plan-scenarios';
import { Report, n } from './harness';

/** The four costs a march charges, in the order the owner names them. */
const COSTS = ['silver', 'mercLost', 'gold', 'dragonCoins'] as const;
const costOf = (row: PlanTotals, cost: (typeof COSTS)[number]): number =>
  cost === 'dragonCoins' ? (row.repeat.dragonCoins ?? 0) : row.repeat[cost];

/** True where `other` has at least `row`'s damage, at most each of its costs, and is strictly better once. */
const beats = (other: PlanTotals, row: PlanTotals): boolean =>
  other.repeat.damage >= row.repeat.damage &&
  COSTS.every((cost) => costOf(other, cost) <= costOf(row, cost)) &&
  (other.repeat.damage > row.repeat.damage || COSTS.some((cost) => costOf(other, cost) < costOf(row, cost)));

describe.skipIf(!process.env.THEORY)('stops the bar offers that another stop beats outright', () => {
  it('asks it of every benchmark army', () => {
    const report = new Report('130-dominated-stops');
    report.add('# 130 — stops the bar offers that another of its own stops beats outright\n');
    report.add(
      'A stop is **beaten** here when another stop on the same bar has at least its damage and at most ' +
        'each of the four costs the owner names — silver, hired burned, revive gold, dragon coins — and is ' +
        'strictly better on one of the five. Read on the **repeated march** (`repeat`), which is what the ' +
        "bar's own order, chord and ends are read on.\n",
    );
    const profile = ownerProfile();
    const scenarios = [...commonScenarios(), ...(profile && OWNER_EXPORT ? ownerScenarios(profile) : [])];
    const rows: string[] = ['| army | stops | beaten | which, and by what |', '|---|---|---|---|'];
    let beatenTotal = 0;
    let stopsTotal = 0;
    for (const scenario of scenarios) {
      let plan;
      try {
        plan = planCampaign({
          request: scenario.request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
      } catch {
        rows.push(`| ${scenario.label} | — | — | the plan refuses this army |`);
        continue;
      }
      const stops = plan.alternatives as PlanRow[];
      stopsTotal += stops.length;
      const told: string[] = [];
      for (const row of stops) {
        const by = stops.filter((other) => other !== row && beats(other, row));
        if (by.length === 0) continue;
        beatenTotal += 1;
        const one = by[0];
        if (!one) continue;
        told.push(
          `\`${row.pick}\` (${n(row.repeat.damage)} · ${n(row.repeat.silver)} · ${n(row.repeat.mercLost)} · ` +
            `${n(row.repeat.gold)} · ${n(row.repeat.dragonCoins ?? 0)}) by \`${one.pick}\` ` +
            `(${n(one.repeat.damage)} · ${n(one.repeat.silver)} · ${n(one.repeat.mercLost)} · ` +
            `${n(one.repeat.gold)} · ${n(one.repeat.dragonCoins ?? 0)})`,
        );
      }
      rows.push(
        `| ${scenario.label} | ${String(stops.length)} | ${told.length === 0 ? '**none**' : `**${String(told.length)}**`} | ${
          told.length === 0 ? '—' : told.join('; ')
        } |`,
      );
    }
    report.add('\n' + rows.join('\n'));
    report.add(
      `\n**${n(beatenTotal)} of ${n(stopsTotal)}** stops offered across these armies are beaten outright by ` +
        'another stop on their own bar. The five figures in each bracket are damage · silver · hired ' +
        'burned · gold · dragon coins, on the repeated march.\n',
    );
    report.save();
  }, 600_000);
});
