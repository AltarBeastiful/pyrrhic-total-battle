/**
 * 129 — **does the 20 000-dominance camp finish inside the raised budget?** (owner, 2026-09-22: *"raise
 * budget"*, answering S-119's open question about the one camp `plan-scenarios.ts` refuses to register.)
 *
 * That camp — experiment 110's larger one, monster tiers 3–7 against a **20 000** dominance pool, twenty
 * uncapped types — has four captured TotalStack answers recorded in `plan-scenarios.ts` and asserted
 * nowhere, because its search ran **25 846 to 28 009 ms** against a 25 000 ms cap on 2026-09-19 and was
 * always cut off. A scenario whose bar is whatever the clock had reached is not a non-regression test.
 *
 * `CAMPAIGN.budgets.plan` is **40 000 ms** since S-119. This measures, on the current engine, whether the
 * search now finishes on its own — and how much of the new cap it leaves spare, which is what decides
 * whether the camp can be registered with pins that are the engine's rather than the clock's.
 *
 * **Built through `buildStackRequest`**, the app's own request builder, on a profile assembled the way the
 * Battle card assembles one — the owner's rule of 2026-09-21, so no option default is frozen in a literal.
 *
 * `THEORY=1 npx vitest run tools/theorycraft/129-the-big-monster-camp.test.ts`
 */
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planCampaign } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import { newProfile } from '../../src/state/defaults';
import { buildStackRequest } from '../../src/state/derive';
import { Report, n } from './harness';

/** The horizon the benchmark plans over. */
const HORIZON = CAMPAIGN.marches;

/**
 * Experiment 110's camps, to the unit: the first-run army with the e2e seed's 83 hunters and six Bear V,
 * the monster window open, and the dominance pool the camp's name gives.
 */
function monsterCamp(max: number, dominance: number): StackRequest {
  const profile = newProfile('first run');
  profile.mercenaries.selected = [
    { id: 'epic-monster-hunter-6', cap: 83 },
    { id: 'bear-5', cap: 6 },
  ];
  profile.troops.monsters = { min: 3, max };
  const setup = profile.setups[0];
  if (!setup) throw new Error('no setup');
  return buildStackRequest(profile, {
    ...setup,
    housing: { leadership: 20_000, authority: 2_180, dominance },
  });
}

describe.skipIf(!process.env.THEORY)('the 20 000-dominance camp against the raised budget', () => {
  it('times both camps three times each', () => {
    const report = new Report('129-the-big-monster-camp');
    report.add(`# 129 — the big monster camp against a ${n(CAMPAIGN.budgets.plan)} ms budget\n`);
    report.add(
      `\`CAMPAIGN.budgets.plan\` is **${n(CAMPAIGN.budgets.plan)} ms** (25 000 until S-119). Three runs of ` +
        `each camp, back to back on one machine.\n`,
    );
    const rows: string[] = [
      '| camp | types housed | run 1 | run 2 | run 3 | worst | spare | stops |',
      '|---|---|---|---|---|---|---|---|',
    ];
    for (const [label, max, dominance] of [
      ['tiers 3–5, dominance 900 (the registered one)', 5, 900],
      ['**tiers 3–7, dominance 20 000** (the one that is not)', 7, 20_000],
    ] as const) {
      const request = monsterCamp(max, dominance);
      const types = request.units.filter((unit) => unit.pool === 'dominance').length;
      const times: number[] = [];
      let stops = 0;
      for (let run = 0; run < 3; run += 1) {
        const started = performance.now();
        const plan = planCampaign({
          request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
        times.push(performance.now() - started);
        stops = plan.alternatives.length;
      }
      const worst = Math.max(...times);
      rows.push(
        `| ${label} | ${String(types)} | ${n(Math.round(times[0] ?? 0))} | ${n(
          Math.round(times[1] ?? 0),
        )} | ${n(Math.round(times[2] ?? 0))} | **${n(Math.round(worst))} ms** | ${
          worst < CAMPAIGN.budgets.plan
            ? `**${(CAMPAIGN.budgets.plan / worst).toFixed(2)}×** under`
            : '**OVER — still cut off**'
        } | ${String(stops)} |`,
      );
    }
    report.add('\n' + rows.join('\n'));
    report.save();
  });

  /**
   * **B — and does the extra budget buy anything?** A is the reason this part exists: the camp did not stop
   * at 28 s because it had finished, it stopped because the clock did — at 40 s it runs 40.9 s. The search
   * is budget-bound at every budget, so the only question left is whether a longer clock answers *better*.
   * If the bar is identical at 25 s and 40 s, the raise costs a 40 s worst case and buys nothing.
   */
  it('B — the same camp at the old budget and the new one', () => {
    const report = new Report('129-the-big-monster-camp-b');
    const request = monsterCamp(7, 20_000);
    report.add(`# 129 B — is a longer clock a better answer on the 20 000 camp?\n`);
    const rows: string[] = [
      '| budget | ms | stops | hardest campaign | its silver | the stops, by burn |',
      '|---|---|---|---|---|---|',
    ];
    for (const budgetMs of [25_000, 40_000]) {
      const started = performance.now();
      const plan = planCampaign({
        request,
        marchTarget: HORIZON,
        budgetMs,
        ...CAMPAIGN.planFixes,
        putBack: CAMPAIGN.putBack,
      });
      const ms = performance.now() - started;
      const best = plan.alternatives.reduce((a, b) => (b.totalDamage > a.totalDamage ? b : a));
      rows.push(
        `| ${n(budgetMs)} ms | ${n(Math.round(ms))} | ${String(plan.alternatives.length)} | **${n(
          Math.round(best.totalDamage),
        )}** | ${n(Math.round(best.silver))} | ${plan.alternatives
          .map((a) => `${a.pick} ${String(a.mercLost)}`)
          .join(' · ')} |`,
      );
    }
    report.add('\n' + rows.join('\n'));
    report.save();
  });
});
