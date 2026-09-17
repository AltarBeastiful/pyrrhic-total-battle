/**
 * 64 — the balanced proposal, proved against the plan the owner accepted (owner, 2026-09-14).
 *
 * `planCampaign` now returns a non-dominated frontier and, when no silver budget is given, a `recommend` — the
 * knee of the damage-against-silver curve. The acceptance test is the plan the owner marched and liked: three
 * uniform marches of 2,228,327 plus a 701,566 finale, 2,998,800 silver, 24 mercenaries lost, total 7,386,547.
 * This file prints the frontier, the recommendation, and the two side by side.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/64-plan-recommendation.test.ts`
 */
import { describe, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import { planCampaign } from '../../src/engine/plan';
import type { ResolvedSource } from '../../src/engine/types';
import { Report, loadOwner, n, withCaps, withHousing } from './harness';

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

/** What the owner marched from file 61 and kept. */
const ACCEPTED = { silver: 2_998_800, mercLost: 24, totalDamage: 7_386_547 };

describe.skipIf(!process.env.THEORY)(
  'the recommendation',
  () => {
    it('picks a plan as good as the accepted one, from the army alone', () => {
      const report = new Report('64-plan-recommendation');
      const owner = loadOwner();
      const base = withCaps(
        withHousing(
          { ...owner.twelve, totals: aggregateBonuses([PROFILE]) },
          { leadership: 4_400, authority: 2_180 },
        ),
        HELD,
      );

      const plan = planCampaign({ request: base });
      report.add(
        `input: troops + bonuses + mercenaries only — no silver, no march count.\n` +
          `the plan it sized: ${n(plan.marches)} marches, ${n(plan.totalDamage)} total, ${n(plan.silver)} silver, ` +
          `${n(plan.mercLost)} mercenaries lost (${plan.damagePerSilver.toFixed(2)} a silver, ${n(Math.round(plan.damagePerMercenary))} a mercenary).`,
      );

      report.h('The frontier it drew (non-dominated plans, cheapest first)');
      report.add(
        '| plan | marches | total damage | silver | mercenaries lost | damage / silver | damage / mercenary |\n|---|---|---|---|---|---|---|',
      );
      for (const point of plan.alternatives) {
        report.add(
          `| ${point.label} | ${point.marches} | ${n(point.totalDamage)} | ${n(point.silver)} | ${n(point.mercLost)} | ` +
            `${point.damagePerSilver.toFixed(2)} | ${n(Math.round(point.damagePerMercenary))} |`,
        );
      }

      report.h('The three picks the module carries');
      report.add(
        '| pick | marches | damage | silver | mercs | per silver | per mercenary |\n|---|---|---|---|---|---|---|',
      );
      for (const [name, point] of [
        ['recommend (compromise)', plan.recommend],
        ['most efficient', plan.mostEfficient],
        ['knee', plan.knee],
      ] as const) {
        if (!point) continue;
        report.add(
          `| ${name} | ${point.marches} | ${n(point.totalDamage)} | ${n(point.silver)} | ${n(point.mercLost)} | ${point.damagePerSilver.toFixed(2)} | ${n(Math.round(point.damagePerMercenary))} |`,
        );
      }

      report.h('The recommendation, against the plan that was marched and kept');
      report.add(
        '| | total damage | silver | mercenaries lost | damage / silver | damage / mercenary |\n|---|---|---|---|---|---|',
      );
      if (plan.recommend) {
        report.add(
          `| **recommend (the knee)** | **${n(plan.recommend.totalDamage)}** | ${n(plan.recommend.silver)} | ${n(plan.recommend.mercLost)} | ` +
            `${plan.recommend.damagePerSilver.toFixed(2)} | ${n(Math.round(plan.recommend.damagePerMercenary))} |`,
        );
      }
      report.add(
        `| file 61 (marched, 3 M silver) | ${n(ACCEPTED.totalDamage)} | ${n(ACCEPTED.silver)} | ${n(ACCEPTED.mercLost)} | ` +
          `${(ACCEPTED.totalDamage / ACCEPTED.silver).toFixed(2)} | ${n(Math.round(ACCEPTED.totalDamage / ACCEPTED.mercLost))} |`,
      );
      if (plan.recommend) {
        report.add(
          `\nverdict: the knee is ${plan.recommend.totalDamage >= ACCEPTED.totalDamage ? '**better**' : 'below'} the marched plan by ` +
            `${n(Math.abs(plan.recommend.totalDamage - ACCEPTED.totalDamage))} damage (${((100 * (plan.recommend.totalDamage - ACCEPTED.totalDamage)) / ACCEPTED.totalDamage).toFixed(1)} %), ` +
            `at ${n(plan.recommend.silver - ACCEPTED.silver)} silver and ${n(plan.recommend.mercLost - ACCEPTED.mercLost)} mercenaries.`,
        );
      }
      report.save();
    });
  },
  900_000,
);
