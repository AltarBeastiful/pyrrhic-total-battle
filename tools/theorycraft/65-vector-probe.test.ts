/**
 * 65 — isolate why the planner misses the accepted plan: give it the accepted **vector** as the whole stock, so
 * the only thing left to get wrong is the ladder and the march count.
 * `THEORY=1 pnpm vitest run tools/theorycraft/65-vector-probe.test.ts`
 */
import { describe, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import { planCampaign } from '../../src/engine/plan';
import type { ResolvedSource } from '../../src/engine/types';
import { Report, evaluateCounts, lines, loadOwner, n, withCaps, withHousing, withUnits } from './harness';

const PROFILE: ResolvedSource = {
  id: 'account-2026-09-14',
  label: 'the account',
  kind: 'custom',
  health: { guardsmen: 157, melee: 2, mounted: 2, flying: 2, ranged: 2.5 },
  strength: { guardsmen: 187, melee: 1, mounted: 1, flying: 1, ranged: 2 },
  special: { doubleDamageChance: 3 },
};
/** The accepted plan's vector, and its march (file 61). */
const VECTOR = { 'epic-monster-hunter-6': 9, 'legionary-6': 10, 'arbalester-6': 10, 'chariot-6': 5 };
const MARCH: Record<string, number> = {
  'spearman-1': 486,
  'spearman-2': 269,
  'rider-3': 75,
  'rider-1': 240,
  'rider-2': 133,
  'archer-2': 264,
  'archer-1': 475,
  'arbalester-6': 10,
  'legionary-6': 10,
  'chariot-6': 5,
  'epic-monster-hunter-6': 9,
};
const ACCEPTED = { totalDamage: 7_386_547, silver: 2_998_800, mercLost: 24 };

describe.skipIf(!process.env.THEORY)(
  'vector probe',
  () => {
    it('plans with the accepted vector as the whole stock', () => {
      const report = new Report('65-vector-probe');
      const owner = loadOwner();
      const base = withHousing(
        { ...owner.twelve, totals: aggregateBonuses([PROFILE]) },
        { leadership: 4_400, authority: 2_180 },
      );

      // the accepted march, scored by the engine
      const marched = evaluateCounts(withCaps(withUnits(base, Object.keys(MARCH)), MARCH), MARCH);
      const ls = lines(marched);
      const hit = (row: (typeof ls)[number]): number => (row.hitsEnemyFirst + row.hitsArmyFirst) / 2;
      report.add(
        `the accepted march scores **${n(marched.summary.avgDamage)}** in the engine (file 61 said 2,228,327; the plan it belongs to totals ${n(ACCEPTED.totalDamage)}).`,
      );
      report.add(
        '| # | stack | units | total HP | a hit | strikes | damage |\n|---|---|---|---|---|---|---|',
      );
      for (const row of ls) {
        report.add(
          `| ${row.position} | ${row.label} | ${n(row.count)} | ${n(row.totalHp)} | ${n(row.damagePerHit)} | ${row.hitsEnemyFirst}/${row.hitsArmyFirst} | ${n(Math.round(hit(row) * row.damagePerHit))} |`,
        );
      }

      // now hand the planner the same vector as its entire stock
      const capped = withCaps(base, VECTOR);
      const plan = planCampaign({ request: capped, alternatives: 8 });
      report.add(
        `\nwith that vector as the whole stock the planner sizes **${n(plan.marches)} marches, ${n(plan.totalDamage)} total, ${n(plan.silver)} silver, ${n(plan.mercLost)} lost** ` +
          `(${plan.damagePerSilver.toFixed(2)} a silver).`,
      );
      report.add('| its march | units | HP | a hit | strikes | damage |\n|---|---|---|---|---|---|');
      const chosen = evaluateCounts(
        withCaps(withUnits(base, Object.keys(plan.march.counts)), plan.march.counts),
        plan.march.counts,
      );
      for (const row of lines(chosen)) {
        report.add(
          `| ${row.label} | ${n(row.count)} | ${n(row.totalHp)} | ${n(row.damagePerHit)} | ${row.hitsEnemyFirst}/${row.hitsArmyFirst} | ${n(Math.round(((row.hitsEnemyFirst + row.hitsArmyFirst) / 2) * row.damagePerHit))} |`,
        );
      }
      report.add(
        `\nso with the accepted *vector* the planner reaches ${n(plan.totalDamage)} against the accepted ${n(ACCEPTED.totalDamage)} ` +
          `(${(((plan.totalDamage - ACCEPTED.totalDamage) / ACCEPTED.totalDamage) * 100).toFixed(1)} %), at ${n(plan.silver)} silver against ${n(ACCEPTED.silver)}.`,
      );
      report.save();
    });
  },
  600_000,
);
