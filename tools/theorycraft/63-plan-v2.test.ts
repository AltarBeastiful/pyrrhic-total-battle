/**
 * 63 — Complete optimization v2 (`src/engine/plan.ts`), on the owner's army, against the battles.
 *
 * The v2 takes the army and the enemy and nothing else: no silver budget, no number of marches. This file
 * runs it three ways — with the 3 M silver he had, with no silver limit at all, and under each objective —
 * prints the plan's stacks, and sets the result against the two plans that were actually marched and the
 * damage their journals realised.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/63-plan-v2.test.ts`
 */
import { describe, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import { planCampaign, type CampaignPlan } from '../../src/engine/plan';
import { simulateBattle } from '../../src/engine/battle';
import { sizeStacks } from '../../src/engine/stacker';
import type { BonusTotals, Objective, ResolvedSource, StackRequest } from '../../src/engine/types';
import {
  Report,
  evaluateCounts,
  label,
  lines,
  loadOwner,
  n,
  withCaps,
  withHousing,
  withUnits,
} from './harness';

/** The account as the two reports of 2026-09-14 fit it: base + the owner's buff on the categories. */
const PROFILE: ResolvedSource = {
  id: 'account-2026-09-14',
  label: 'the account (guardsmen +157/+187 base, +2/+1 on the categories)',
  kind: 'custom',
  health: { guardsmen: 157, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
  strength: { guardsmen: 187, melee: 1, mounted: 1, flying: 1, ranged: 2 },
  special: { doubleDamageChance: 3 },
};

const HELD: Record<string, number> = {
  'epic-monster-hunter-6': 14,
  'legionary-6': 16,
  'arbalester-6': 15,
  'chariot-6': 7,
};
const SILVER = 3_000_000;

/** The two plans that were marched, and what their journals realised (proc halved). */
const MARCHED = [
  { name: 'file 56 (04:39 report)', realised: 1_575_922 },
  { name: 'file 61 (05:17 report)', realised: 1_958_695 },
];

describe.skipIf(!process.env.THEORY)(
  'plan v2',
  () => {
    it('plans the campaign from the army alone', () => {
      const started = Date.now();
      const report = new Report('63-plan-v2');
      const owner = loadOwner();
      const totals: BonusTotals = aggregateBonuses([PROFILE]);
      const base: StackRequest = withCaps(
        withHousing({ ...owner.twelve, totals }, { leadership: 4_400, authority: 2_180 }),
        HELD,
      );
      report.add(
        `army: ${base.units
          .filter((u) => u.pool === 'leadership')
          .map((u) => u.label)
          .join(' · ')} · ` +
          `mercenaries ${Object.entries(HELD)
            .map(([id, count]) => `${label(id)} ${count}`)
            .join(' · ')} · ` +
          `leadership ${n(base.housing.leadership)} · enemy ${Object.values(base.enemy).reduce((a, b) => a + b, 0)} squads · ` +
          `silver ${n(SILVER)}`,
      );

      const show = (plan: CampaignPlan, title: string): void => {
        report.h(title);
        const table = (march: CampaignPlan['march'], name: string): void => {
          const req = withCaps(withUnits(base, Object.keys(march.counts)), march.counts);
          const ev = evaluateCounts(req, march.counts);
          const ls = lines(ev);
          const hit = (row: (typeof ls)[number]): number => (row.hitsEnemyFirst + row.hitsArmyFirst) / 2;
          report.add(
            `\n**${name}** — ${n(march.damage)} a march (simulated ${n(ev.summary.avgDamage)}), ${n(march.silver)} silver, ${march.mercLost} mercenaries lost\n`,
          );
          report.add(
            '| # | stack | units | total HP | a hit | strikes | damage |\n|---|---|---|---|---|---|---|',
          );
          for (const row of ls) {
            report.add(
              `| ${row.position} | ${row.label} | ${n(row.count)} | ${n(row.totalHp)} | ${n(row.damagePerHit)} | ${row.hitsEnemyFirst}/${row.hitsArmyFirst} | ${n(Math.round(hit(row) * row.damagePerHit))} |`,
            );
          }
        };
        table(plan.march, `the march, × ${plan.marches - (plan.finale ? 1 : 0)}`);
        if (plan.finale) table(plan.finale, 'the final march (the leftovers)');
        report.add(
          `\ntotal **${n(plan.totalDamage)}** · ${n(plan.marches)} marches · silver ${n(plan.silver)} · gold ${n(plan.gold)} · mercenaries lost ${n(plan.mercLost)} · ` +
            `${plan.damagePerSilver.toFixed(2)} damage a silver · ${n(Math.round(plan.damagePerMercenary))} damage a mercenary`,
        );
        report.add(
          `binding: ${
            Object.entries(plan.binding)
              .filter(([, on]) => on)
              .map(([what]) => what)
              .join(', ') || 'nothing — more stock would give more damage'
          }`,
        );
        report.add(
          `\nthe frontier it saw:\n\n| plan | marches | total damage | silver | mercenaries lost | damage / silver | damage / mercenary |\n|---|---|---|---|---|---|---|\n` +
            plan.alternatives
              .map(
                (alt) =>
                  `| ${alt.label} | ${alt.marches} | ${n(alt.totalDamage)} | ${n(alt.silver)} | ${n(alt.mercLost)} | ${alt.damagePerSilver.toFixed(2)} | ${n(Math.round(alt.damagePerMercenary))} |`,
              )
              .join('\n'),
        );
      };

      // 1. the plan from the army alone
      const free = planCampaign({ request: base });
      show(free, '1. The plan from the army alone (no silver budget, no march count)');

      // 2. the same with the 3 M silver he had
      const budgeted = planCampaign({ request: base, silverBudget: SILVER, alternatives: 400 });
      show(budgeted, `2. The same army with the ${n(SILVER)} silver he had`);

      // 3. what the objective parameter changes
      report.h('3. The objective parameter, and what it moves');
      report.add(
        '| objective | marches | total damage | silver | mercenaries lost | damage / silver | damage / mercenary |\n|---|---|---|---|---|---|---|',
      );
      for (const objective of ['avgDamage', 'damagePerSilver', 'damagePerMercenary'] as Objective[]) {
        const plan = planCampaign({ request: base, silverBudget: SILVER, objective });
        report.add(
          `| ${objective} | ${plan.marches} | ${n(plan.totalDamage)} | ${n(plan.silver)} | ${n(plan.mercLost)} | ` +
            `${plan.damagePerSilver.toFixed(2)} | ${n(Math.round(plan.damagePerMercenary))} |`,
        );
      }
      report.add(
        `\nthe objective only decides ties: with both resources finite the plan is the same whichever is asked for, ` +
          `because the total damage already prices both. It matters when one of them is *unlimited* — ask for ` +
          `damagePerSilver with no silver limit and the plan will field the minimum sponge; ask for the total and it will ` +
          `spend the stock to the last unit.`,
      );

      // 4. the two plans that were marched, for scale
      report.h('4. The plans that were marched, against the plan');
      report.add('| plan | marches | damage a march (engine) | realised in the journal |\n|---|---|---|---|');
      for (const marched of MARCHED) {
        report.add(`| ${marched.name} | 1 (of its plan) | — | **${n(marched.realised)}** |`);
      }
      report.add(
        `\nthe v2 plan's march deals ${n(budgeted.march.damage)} on paper; the two marched marches realised 1,575,922 and 1,958,695 ` +
          `(the second one 0.17 % off the engine's figure for the same counts).`,
      );

      // 5. does the analytic scout agree with the battle?
      report.h('5. The scout against the battle simulation');
      const req = withCaps(withUnits(base, Object.keys(budgeted.march.counts)), budgeted.march.counts);
      const simulated = simulateBattle(sizeStacks(req), req);
      report.add(
        `the v2's own figure for its march: **${n(budgeted.march.damage)}**. The full simulation: min ${n(simulated.minDamage)} / ` +
          `avg ${n(simulated.avgDamage)} / max ${n(simulated.maxDamage)} — the scout sits ${n(Math.round(budgeted.march.damage - simulated.avgDamage))} from the average.`,
      );
      report.add(`\n(the whole search above ran in ${((Date.now() - started) / 1000).toFixed(1)} s)`);
      report.save();
    });
  },
  300_000,
);
