/**
 * 69 — the ladder's scale is a continuous knob, and the planner samples it ten times.
 *
 * Experiment 68 swept the shape space finer than the planner does and came back with two shapes whose
 * mercenary counts and ladder depth are **on the planner's own grid** (`largestFor` × `MERC_FRACTIONS`,
 * depth ∈ DEPTHS), differing from it in one thing only: the ladder's scale. `LADDER_GROWTHS` offers ten of
 * them (1 … 6), and the planner never refines between them.
 *
 * This file isolates that one axis. For each of 68's two best shapes it walks the scale on a grid twenty
 * times finer, reports what the ten-value list reaches and what the fine grid reaches, and puts the
 * planner's own best campaign beside them — so "how much is the coarse list costing" is one number and not
 * an inference. `THEORY=1 pnpm vitest run tools/theorycraft/69-scale-grid.test.ts`
 *
 * Measured, then acted on (2026-09-15): it found the cost was +5.6 % damage on one shape and +4.7 % against
 * the planner's whole search, and the planner now hill-climbs the scale too (`plan.ts`, `SCALE_STEPS`). So
 * this file has become the check that the refinement still beats its own coarse grid: read the last line —
 * if the planner's best campaign is ever *below* the hand-picked shape, the refinement has regressed.
 */
import { describe, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import { planCampaign, shapeScorer } from '../../src/engine/plan';
import type { ResolvedSource, StackRequest } from '../../src/engine/types';
import { Report, loadOwner, n, withCaps, withHousing } from './harness';

const PROFILE: ResolvedSource = {
  id: 'account-2026-09-14',
  label: 'the account',
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
const DEPTHS = [1, 2, 3, 4, 5, 6, 7, 8];
/** The planner's own list (`plan.ts` LADDER_GROWTHS) — the ten scales it can ask for. */
const PLANNER_SCALES = [1, 1.25, 1.5, 1.8, 2.2, 2.6, 3.2, 4, 5, 6];
const FINE: number[] = [];
for (let scale = 1; scale <= 10.0001; scale += 0.05) FINE.push(Math.round(scale * 100) / 100);

interface Row {
  scale: number;
  depth: number;
  damage: number;
  silver: number;
  mercLost: number;
}

describe.skipIf(!process.env.THEORY)(
  'the scale grid',
  () => {
    it('measures what the ten-value ladder scale list costs', () => {
      const report = new Report('69-scale-grid');
      const owner = loadOwner();
      const request: StackRequest = withCaps(
        withHousing(
          { ...owner.twelve, totals: aggregateBonuses([PROFILE]) },
          { leadership: 4_400, authority: 2_180 },
        ),
        HELD,
      );
      const score = shapeScorer(request);

      /** The best over the depth list at one scale — the planner's own inner loop, one scale at a time. */
      const bestAtScale = (K: number, counts: Record<string, number>, scale: number): Row | null => {
        let best: Row | null = null;
        for (const depth of DEPTHS) {
          const scored = score(K, counts, depth, scale);
          if (!scored) continue;
          if (!best || scored.total > best.damage)
            best = { scale, depth, damage: scored.total, silver: scored.silver, mercLost: scored.mercLost };
        }
        return best;
      };
      const sweep = (K: number, counts: Record<string, number>, scales: number[]): Row | null => {
        let best: Row | null = null;
        for (const scale of scales) {
          const row = bestAtScale(K, counts, scale);
          if (row && (!best || row.damage > best.damage)) best = row;
        }
        return best;
      };

      const cases: { name: string; K: number; counts: Record<string, number> }[] = [
        {
          name: 'the most-damage shape (68 §3, K = 12)',
          K: 12,
          counts: { 'epic-monster-hunter-6': 3, 'arbalester-6': 4, 'legionary-6': 5, 'chariot-6': 0 },
        },
        {
          name: 'the most-damage-a-mercenary shape (68 §2, K = 8)',
          K: 8,
          counts: { 'epic-monster-hunter-6': 7, 'arbalester-6': 0, 'legionary-6': 0, 'chariot-6': 0 },
        },
      ];

      report.h('What the ten-value scale list reaches, and what a twentieth-of-a-step grid reaches');
      report.add(
        '| shape | the planner’s ten scales | its best scale | a fine grid | its best scale | gain in damage | gain in silver |\n' +
          '|---|---|---|---|---|---|---|',
      );
      const results: { name: string; coarse: Row; fine: Row }[] = [];
      for (const item of cases) {
        const coarse = sweep(item.K, item.counts, PLANNER_SCALES);
        const fine = sweep(item.K, item.counts, FINE);
        if (!coarse || !fine) continue;
        results.push({ name: item.name, coarse, fine });
        report.add(
          `| ${item.name} | ${n(Math.round(coarse.damage))} damage, ${n(Math.round(coarse.silver))} silver | ` +
            `${coarse.scale} (${coarse.depth} rungs) | ${n(Math.round(fine.damage))} damage, ${n(Math.round(fine.silver))} silver | ` +
            `**${fine.scale}** (${fine.depth} rungs) | +${n(Math.round(fine.damage - coarse.damage))} ` +
            `(${(((fine.damage - coarse.damage) / coarse.damage) * 100).toFixed(1)} %) | ` +
            `${n(Math.round(fine.silver - coarse.silver))} |`,
        );
      }
      for (const result of results) {
        const { coarse, fine } = result;
        report.add(
          `- ${result.name}: the ten-value list's own best is ${coarse.scale}, the fine grid's is ${fine.scale} — ` +
            `**${fine.scale} is not offered**, so the planner cannot reach it however long it searches. ` +
            `Damage a silver ${(fine.damage / fine.silver).toFixed(2)} against ${(coarse.damage / coarse.silver).toFixed(2)}; ` +
            `damage a mercenary ${n(Math.round(fine.damage / Math.max(1, fine.mercLost)))} against ` +
            `${n(Math.round(coarse.damage / Math.max(1, coarse.mercLost)))}.`,
        );
      }

      report.h('The scale sweep itself, for the most-damage shape (K = 12)');
      report.add('| scale | rungs | damage | silver | damage / silver |\n|---|---|---|---|---|');
      const detail = { 'epic-monster-hunter-6': 3, 'arbalester-6': 4, 'legionary-6': 5, 'chariot-6': 0 };
      for (const scale of PLANNER_SCALES) {
        const row = bestAtScale(12, detail, scale);
        if (!row) continue;
        report.add(
          `| ${scale} * | ${row.depth} | ${n(Math.round(row.damage))} | ${n(Math.round(row.silver))} | ` +
            `${(row.damage / row.silver).toFixed(2)} |`,
        );
      }
      report.add('| … | | | | |');
      for (let scale = 3.0; scale <= 4.0001; scale += 0.1) {
        const row = bestAtScale(12, detail, Math.round(scale * 100) / 100);
        if (!row) continue;
        report.add(
          `| ${row.scale} | ${row.depth} | ${n(Math.round(row.damage))} | ${n(Math.round(row.silver))} | ` +
            `${(row.damage / row.silver).toFixed(2)} |`,
        );
      }

      report.h('The planner’s own campaign, beside them');
      const plan = planCampaign({ request, alternatives: 10 });
      const bar = plan.recommend;
      report.add(
        `the planner's best campaign (max total damage over everything it searches): ` +
          `**${n(Math.round(plan.totalDamage))} damage for ${n(Math.round(plan.silver))} silver**, ` +
          `${n(plan.marches)} marches.`,
      );
      if (bar)
        report.add(
          `its balanced pick: ${n(bar.totalDamage)} damage for ${n(bar.silver)} silver — ` +
            `${bar.damagePerSilver.toFixed(2)} a silver, ${n(Math.round(bar.damagePerMercenary))} a mercenary.`,
        );
      const total = results[0];
      if (total) {
        // Two separate claims, because they are two different comparisons and conflating them would
        // overstate the case: same shape against itself (only the scale moves), and the whole search.
        report.add(
          `- **the same shape against itself**, so the scale is the only thing that moves: at the list's best ` +
            `scale (${total.coarse.scale}) it is ${n(Math.round(total.coarse.damage))} damage for ` +
            `${n(Math.round(total.coarse.silver))} silver; at ${total.fine.scale} it is ` +
            `${n(Math.round(total.fine.damage))} damage for ${n(Math.round(total.fine.silver))} silver — ` +
            `**+${n(Math.round(total.fine.damage - total.coarse.damage))} damage ` +
            `(${(((total.fine.damage - total.coarse.damage) / total.coarse.damage) * 100).toFixed(1)} %)**. ` +
            `${total.fine.scale} is not on the list, so no amount of search reaches it.`,
        );
        // The sign of this comparison is the whole point of the file, so it is written to read correctly
        // whichever way it comes out: the shape is hand-picked, the planner's figure is over everything.
        const wins = total.fine.damage > plan.totalDamage;
        report.add(
          `- **against everything the planner can reach**: ${n(Math.round(plan.totalDamage))} damage for ` +
            `${n(Math.round(plan.silver))} silver. The shape above is ` +
            `${n(Math.round(Math.abs(total.fine.damage - plan.totalDamage)))} damage ` +
            `${wins ? 'more' : 'fewer'} for ` +
            `${n(Math.round(Math.abs(total.fine.silver - plan.silver)))} silver ` +
            `${total.fine.silver > plan.silver ? 'more' : 'less'} — ` +
            (wins
              ? `so the planner is still below a shape picked by hand, and the refinement has room left.`
              : `so the planner now beats the shape this file picked by hand: the scale refinement has ` +
                `closed the gap the file was written to measure.`),
        );
      }

      report.save();
    });
  },
  900_000,
);
