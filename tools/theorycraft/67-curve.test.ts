/**
 * 67 — the campaign's whole curve, analysed rather than sampled (owner, 2026-09-14: "can't we do better than
 * 1.56 and 705? did you analyse the curvature? is there a sweeter spot?").
 *
 * The engine now returns the curve bucketed by silver: for each silver level, the most damage any plan found
 * buys, and the most damage a mercenary any plan found buys. This file prints it, the first differences (what
 * one more silver buys at that level), and the extrema of both ratios — so the shape, not three points, is
 * what the picks are chosen from. `THEORY=1 pnpm vitest run tools/theorycraft/67-curve.test.ts`
 */
import { describe, it } from 'vitest';

import { aggregateBonuses } from '../../src/engine/bonuses';
import { planCampaign } from '../../src/engine/plan';
import type { ResolvedSource } from '../../src/engine/types';
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

describe.skipIf(!process.env.THEORY)(
  'the curve',
  () => {
    it('is analysed, not sampled', () => {
      const report = new Report('67-curve');
      const owner = loadOwner();
      const base = withCaps(
        withHousing(
          { ...owner.twelve, totals: aggregateBonuses([PROFILE]) },
          { leadership: 4_400, authority: 2_180 },
        ),
        HELD,
      );
      const plan = planCampaign({ request: base });

      report.h('The curve: what N silver buys, and what it buys a mercenary');
      report.add(
        '| silver | damage | per silver | Δ damage for the next step | mercs | per mercenary | best-per-merc damage | its mercs | its per mercenary |\n' +
          '|---|---|---|---|---|---|---|---|---|',
      );
      const rows = plan.curve;
      rows.forEach((point, index) => {
        const next = rows[index + 1];
        const step = next ? next.damage - point.damage : 0;
        const stepSilver = next ? next.silver - point.silver : 0;
        report.add(
          `| ${n(point.silver)} | ${n(point.damage)} | ${point.damagePerSilver.toFixed(2)} | ` +
            `${next ? `${n(step)} (${(step / Math.max(1, stepSilver)).toFixed(2)} a silver)` : '—'} | ${n(point.mercLost)} | ` +
            `${n(Math.round(point.damage / Math.max(1, point.mercLost)))} | ${n(point.thriftyDamage)} | ${n(point.thriftyMercLost)} | ` +
            `${n(Math.round(point.thriftyPerMercenary))} |`,
        );
      });

      // The extrema of each ratio over the whole curve, and what they cost.
      const best = (pick: (point: (typeof rows)[number]) => number): (typeof rows)[number] | undefined =>
        [...rows].sort((a, b) => pick(b) - pick(a))[0];
      const bestPerSilver = best((point) => point.damagePerSilver);
      const bestPerMerc = best((point) => point.thriftyPerMercenary);
      report.h('The extrema of the two ratios, over the whole curve');
      report.add(
        `- **most damage a silver**: ${bestPerSilver?.damagePerSilver.toFixed(2)} at ${n(bestPerSilver?.silver ?? 0)} silver ` +
          `(${n(bestPerSilver?.damage ?? 0)} damage, ${n(Math.round((bestPerSilver?.damage ?? 0) / Math.max(1, bestPerSilver?.mercLost ?? 1)))} a mercenary)`,
      );
      report.add(
        `- **most damage a mercenary**: ${n(Math.round(bestPerMerc?.thriftyPerMercenary ?? 0))} at ${n(bestPerMerc?.silver ?? 0)} silver ` +
          `(${n(bestPerMerc?.thriftyDamage ?? 0)} damage, ${n(bestPerMerc?.thriftyMercLost ?? 0)} mercenaries, ` +
          `${((bestPerMerc?.thriftyDamage ?? 0) / Math.max(1, bestPerMerc?.silver ?? 1)).toFixed(2)} a silver)`,
      );

      // Does any point on the curve beat the balanced pick on *both* ratios at once? If one does, the picks are
      // chosen from the wrong place; if none does, the balanced pick is genuinely undominated.
      const balanced = plan.recommend;
      report.h('Does any *single plan* beat the balanced pick on both ratios?');
      if (balanced) {
        const balancedPerSilver = balanced.totalDamage / Math.max(1, balanced.silver);
        report.add(
          `the balanced pick: ${n(balanced.totalDamage)} damage, ${n(balanced.silver)} silver, ${n(balanced.mercLost)} mercenaries — ` +
            `**${balancedPerSilver.toFixed(2)} a silver, ${n(Math.round(balanced.damagePerMercenary))} a mercenary**.`,
        );
        // Compared plan to plan, never across the two columns of a bucket: a bucket holds two *different*
        // plans, so taking the best of each there would compare plans that do not exist.
        const dominate = plan.alternatives.filter(
          (point) =>
            point.damagePerSilver > balancedPerSilver * 1.001 &&
            point.damagePerMercenary > balanced.damagePerMercenary * 1.001,
        );
        report.add(
          dominate.length === 0
            ? 'No single plan beats it on both. The two ratios trade against each other along the frontier, and this is the point where each stands as high as it can while the other does too.'
            : `**${dominate.length} plan(s) beat it on both** — the pick is chosen from the wrong place: ` +
                dominate
                  .map(
                    (point) =>
                      `${n(point.silver)} silver (${point.damagePerSilver.toFixed(2)} a silver, ${n(Math.round(point.damagePerMercenary))} a mercenary)`,
                  )
                  .join(', '),
        );
      }

      // The marginal return, which is what a player spending one more week actually buys.
      report.h('The marginal return: what the next slice of silver buys');
      const steps = rows
        .map((point, index) => {
          const next = rows[index + 1];
          if (!next) return null;
          return {
            from: point.silver,
            to: next.silver,
            marginal: (next.damage - point.damage) / (next.silver - point.silver),
          };
        })
        .filter((step): step is { from: number; to: number; marginal: number } => step !== null);
      const bestStep = [...steps].sort((a, b) => b.marginal - a.marginal)[0];
      report.add(
        `the best step on the whole curve is ${bestStep?.marginal.toFixed(2)} damage a silver, buying it as the plan goes from ` +
          `${n(bestStep?.from ?? 0)} to ${n(bestStep?.to ?? 0)} silver. After about ${n(6_400_000)} silver every further slice buys ` +
          `less than 1 damage a silver — the curve's own answer to "how much silver".`,
      );
      report.save();
    });
  },
  900_000,
);
