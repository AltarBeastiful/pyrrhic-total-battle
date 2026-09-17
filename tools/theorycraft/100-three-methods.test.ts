/**
 * 100 — **the benchmark: Tier ladder, Troops first, Complete optimization** (owner, 2026-09-18: *"add a benchmark
 * comparing the three algorithms (with each slider stop so a bit more than 3) and ensure we find the best
 * stacks; my aim is to check if optimize all actually wins instead of the tier ladder and troop first"*).
 *
 * Each method exactly as Generate runs it on his setup: Tier ladder and Troops first are the sizer over every
 * type the account holds with the hired stock as caps — and, since his setup's priority is *average damage*,
 * the priority search over subsets of the types with that objective, which is what a press on Generate does;
 * Complete optimization is the plan, one row a stop. Every march is priced by `simulateBattle` on its counts.
 *
 * Every method is played for the same **four marches**: the sizer methods re-sized each march on the stock the
 * last one left (a chunk of ten lost per hired stack fielded — what pressing Generate four times gives), the
 * plan as its own sequence of repeats and finale. The columns a player judges by: the first march's damage,
 * silver, burn and ratios; whether every hired stack stands under a troop stack (the enemy wipes the
 * highest-HP stack first); and the campaign's damage, silver, burn and ratios.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/100-three-methods.test.ts`
 */
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine';
import { searchPriority } from '../../src/engine/search';
import { effectiveUnit } from '../../src/engine/units';
import type { StackRequest } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { buildStackRequest, buildPlanRequest } from '../../src/state/derive';
import { EXPORT_2026_09_17, Report, evaluate, evaluateCounts, n } from './harness';

const EXPORT_LATEST =
  process.env.PYRRHIC_EXPORT_LATEST ?? '/home/remi/Downloads/pyrrhic-my-account-2026-09-17 (3).json';
const HORIZON = 4;

interface Row {
  name: string;
  /** The four marches of the campaign, each priced on its own counts. */
  marches: Record<string, number>[];
  /** The plan's own campaign figures, when the row is a plan stop (they include the finale). */
  planned?: { totalDamage: number; silver: number; mercLost: number; marches: number };
}

const chunks = (count: number): number => Math.ceil(count / 10);

describe.skipIf(!process.env.THEORY)('the three methods', () => {
  it('benchmarks them on the owner’s exports', () => {
    const report = new Report('100-three-methods');
    for (const [label, file, leadership] of [
      ['latest export, its setup', EXPORT_LATEST, undefined],
      ['latest export, 12 000 leadership', EXPORT_LATEST, 12_000],
      ['export of 2026-09-17, its setup (7 000)', EXPORT_2026_09_17, undefined],
    ] as const) {
      const parsed = parseImport(readFileSync(file, 'utf8'));
      if (parsed.kind !== 'profile') throw new Error('not a profile export');
      const profile = parsed.payload;
      const base = profile.setups[0];
      if (!base) throw new Error('no setup');
      const setup = leadership === undefined ? base : { ...base, housing: { ...base.housing, leadership } };
      const rows: Row[] = [];
      const request0 = buildStackRequest(profile, {
        ...setup,
        options: { ...setup.options, method: 'elite' },
      });
      const mercIds = request0.units.filter((u) => u.pool === 'authority').map((u) => u.id);
      const troopIds = request0.units.filter((u) => u.pool === 'leadership').map((u) => u.id);
      const countsOf = (stacks: { unitId: string; count: number }[]): Record<string, number> =>
        Object.fromEntries(stacks.map((s) => [s.unitId, s.count]));
      /**
       * A sizer method played for the horizon the way a player plays it: Generate, march, lose a chunk of ten
       * of every hired stack fielded, Generate again on what is left. A march that fields nothing ends it.
       */
      const greedy = (
        method: 'elite' | 'ms',
        pick: (request: StackRequest) => Record<string, number>,
      ): Record<string, number>[] => {
        const caps = { ...request0.caps };
        const played: Record<string, number>[] = [];
        for (let i = 0; i < HORIZON; i += 1) {
          const request = buildStackRequest(profile, { ...setup, options: { ...setup.options, method } });
          const counts = pick({ ...request, caps: { ...caps } });
          if (Object.values(counts).every((c) => c <= 0)) break;
          played.push(counts);
          for (const id of mercIds) caps[id] = Math.max(0, (caps[id] ?? 0) - chunks(counts[id] ?? 0));
        }
        return played;
      };
      for (const [method, title] of [
        ['elite', 'Tier ladder'],
        ['ms', 'Troops first'],
      ] as const) {
        rows.push({
          name: `${title} · all types`,
          marches: greedy(method, (r) => countsOf(evaluate(r).result.stacks)),
        });
        rows.push({
          name: `${title} · priority: average damage (Generate)`,
          marches: greedy(method, (r) =>
            countsOf(searchPriority({ request: r, objective: 'avgDamage', budgetMs: 8_000 }).result.stacks),
          ),
        });
        rows.push({
          name: `${title} · priority: damage a silver`,
          marches: greedy(method, (r) =>
            countsOf(
              searchPriority({ request: r, objective: 'damagePerSilver', budgetMs: 8_000 }).result.stacks,
            ),
          ),
        });
      }
      const plan = planCampaign(buildPlanRequest(profile, setup));
      for (const stop of plan.alternatives) {
        const repeats = stop.marches - (stop.finaleCounts ? 1 : 0);
        const marches = Array.from({ length: repeats }, () => stop.counts);
        if (stop.finaleCounts) marches.push(stop.finaleCounts);
        rows.push({
          name: `Complete optimization · ${stop.pick} (${stop.shape})`,
          marches,
          planned: {
            totalDamage: stop.totalDamage,
            silver: stop.silver,
            mercLost: stop.mercLost,
            marches: stop.marches,
          },
        });
      }
      const request = request0;
      const hp = new Map(
        request.units.map((u) => [
          u.id,
          effectiveUnit(u, request.totals, request.enemy, request.activeEvents).hpPerUnit,
        ]),
      );
      report.h(label);
      report.add(
        `${n(request.housing.leadership)} leadership, stock ${mercIds.map((id) => `${id.replace(/-6$/, '').replace('epic-monster-hunter', 'EMH')} ${n(request.caps[id] ?? 0)}`).join(' · ')}. ` +
          `Every method is played for ${n(HORIZON)} marches: the sizer methods re-sized each march on the stock the last one left (a chunk of ten lost per hired stack fielded), ` +
          `the plan as its own sequence (repeats and finale). The "first march" columns are the first march of the four; the campaign columns add all four, ` +
          `each priced by \`simulateBattle\` on its counts.\n`,
      );
      report.add(
        '| method | first march: damage | silver | burned | a silver | a hired | hired sheltered | marches | campaign damage | campaign silver | campaign burned | campaign a silver | campaign a hired |\n' +
          '|---|---|---|---|---|---|---|---|---|---|---|---|---|',
      );
      let bestCampaign = -Infinity;
      const lines: { text: string; campaign: number }[] = [];
      for (const row of rows) {
        const priced = row.marches.map((counts) => {
          const ev = evaluateCounts(request, counts);
          const burn = mercIds.reduce((sum, id) => sum + chunks(counts[id] ?? 0), 0);
          const topMerc = Math.max(0, ...mercIds.map((id) => (counts[id] ?? 0) * (hp.get(id) ?? 0)));
          const troops = troopIds
            .filter((id) => (counts[id] ?? 0) > 0)
            .map((id) => (counts[id] ?? 0) * (hp.get(id) ?? 0));
          const sheltered = troops.length > 0 && Math.min(...troops) > topMerc;
          return { damage: ev.summary.avgDamage, silver: ev.summary.recovery.silver, burn, sheltered };
        });
        const first = priced[0];
        if (!first) continue;
        const campaign = priced.reduce((sum, m) => sum + m.damage, 0);
        const silver = priced.reduce((sum, m) => sum + m.silver, 0);
        const burn = priced.reduce((sum, m) => sum + m.burn, 0);
        if (row.planned && Math.abs(row.planned.totalDamage - campaign) > 1) {
          throw new Error(
            `plan row ${row.name}: the engine says ${String(row.planned.totalDamage)}, the marches add up to ${String(campaign)}`,
          );
        }
        bestCampaign = Math.max(bestCampaign, campaign);
        lines.push({
          campaign,
          text:
            `| ${row.name} | **${n(first.damage)}** | ${n(first.silver)} | ${n(first.burn)} | ${(first.damage / Math.max(1, first.silver)).toFixed(2)} | ` +
            `${n(Math.round(first.damage / Math.max(1, first.burn)))} | ${priced.every((m) => m.sheltered) ? 'yes' : priced.some((m) => m.sheltered) ? 'some' : '**no**'} | ${n(priced.length)} | ` +
            `**${n(campaign)}** | ${n(silver)} | ${n(burn)} | ${(campaign / Math.max(1, silver)).toFixed(2)} | ${n(Math.round(campaign / Math.max(1, burn)))} |`,
        });
      }
      for (const line of lines)
        report.add(line.text + (line.campaign === bestCampaign ? ' ← best campaign' : ''));
    }
    report.save();
  }, 1_800_000);
});
