/**
 * 99 — **where three stops should stand** (owner, 2026-09-18: *"best optimization still doesn't offer enough
 * splits. It's barely changed between sweet spot and [the thrift end]. Why not … change the slider to mercs
 * spent, setting correct spots that have been calculated to be interesting: the right part being the most mercs
 * we can use while keeping them safe behind troops (most damage anyway), whilst keeping a stack that optimizes
 * silver/dmg AND merc/dmg, and the far left still being the best for silver. Does that make sense?"*)
 *
 * The whole ladder of the band — one plan a burn level, the best damage at that level, kept only where burning
 * more buys more — with every rung's damage, silver, gold and the two ratios, and where each rule lands:
 *
 *  - the app's three (lowest rung · the middle of the rungs nothing beats on both ratios · the top);
 *  - the owner's three (the best damage a silver · the rung best on both ratios at once · the top);
 *  - and the knee of damage against burn, for the record.
 *
 * On his latest export at its setup and at 12 000 leadership, and on the 2026-09-17 export at 7 000.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/99-three-stops.test.ts`
 */
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine';
import type { PlanTotals } from '../../src/engine/plan';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import { EXPORT_2026_09_17, Report, n } from './harness';

const EXPORT_LATEST =
  process.env.PYRRHIC_EXPORT_LATEST ?? '/home/remi/Downloads/pyrrhic-my-account-2026-09-17 (3).json';
const perS = (row: PlanTotals): number => row.repeat.damage / Math.max(1, row.repeat.silver);
const perH = (row: PlanTotals): number => row.repeat.damage / Math.max(1, row.repeat.mercLost);

describe.skipIf(!process.env.THEORY)('where three stops should stand', () => {
  it('lays every rule on the ladder', () => {
    const report = new Report('99-three-stops');
    for (const [label, file, leadership] of [
      ['latest export, its setup', EXPORT_LATEST, undefined],
      ['latest export, 12 000 leadership', EXPORT_LATEST, 12_000],
      ['export of 2026-09-17, its setup (7 000)', EXPORT_2026_09_17, undefined],
    ] as const) {
      const parsed = parseImport(readFileSync(file, 'utf8'));
      if (parsed.kind !== 'profile') throw new Error('not a profile export');
      const profile = parsed.payload;
      const setup = profile.setups[0];
      if (!setup) throw new Error('no setup');
      const input = buildPlanRequest(
        profile,
        leadership === undefined ? setup : { ...setup, housing: { ...setup.housing, leadership } },
      );
      const plan = planCampaign({ ...input, withTrade: true });
      const trade = plan.trade ?? [];
      // the ladder as the engine builds it
      const best = new Map<number, PlanTotals>();
      for (const row of trade) {
        const held = best.get(row.repeat.mercLost);
        if (
          !held ||
          row.repeat.damage > held.repeat.damage ||
          (row.repeat.damage === held.repeat.damage && row.repeat.silver < held.repeat.silver)
        ) {
          best.set(row.repeat.mercLost, row);
        }
      }
      const rungs: PlanTotals[] = [];
      let climbed = -Infinity;
      for (const burn of [...best.keys()].sort((a, b) => a - b)) {
        const row = best.get(burn) as PlanTotals;
        if (row.repeat.damage > climbed) {
          rungs.push(row);
          climbed = row.repeat.damage;
        }
      }
      const efficient = rungs.filter(
        (row) =>
          !rungs.some(
            (o) =>
              o !== row &&
              perS(o) >= perS(row) &&
              perH(o) >= perH(row) &&
              (perS(o) > perS(row) || perH(o) > perH(row)),
          ),
      );
      const peakS = Math.max(...rungs.map(perS));
      const peakH = Math.max(...rungs.map(perH));
      const argmax = (of: (row: PlanTotals) => number): PlanTotals =>
        rungs.reduce((b, r) => (of(r) > of(b) ? r : b), rungs[0] as PlanTotals);
      const bestS = argmax(perS);
      const bestH = argmax(perH);
      const balanced = argmax((r) => Math.min(perS(r) / peakS, perH(r) / peakH));
      const product = argmax((r) => (perS(r) / peakS) * (perH(r) / peakH));
      const top = rungs[rungs.length - 1] as PlanTotals;
      const first = rungs[0] as PlanTotals;
      const dx = top.repeat.mercLost - first.repeat.mercLost || 1;
      const dy = top.repeat.damage - first.repeat.damage || 1;
      const knee = argmax(
        (r) =>
          (r.repeat.damage -
            (first.repeat.damage + ((r.repeat.mercLost - first.repeat.mercLost) / dx) * dy)) /
          dy,
      );
      const is = (a: PlanTotals | undefined, b: PlanTotals): boolean =>
        !!a && JSON.stringify(a.counts) === JSON.stringify(b.counts);
      report.h(label);
      report.add(
        `${n(input.request.housing.leadership)} leadership. The band holds ${n(trade.length)} plans; the ladder ${n(rungs.length)} rungs, ` +
          `${n(efficient.length)} of them beaten on neither ratio. Peak damage a silver ${peakS.toFixed(2)}, peak a hired ${n(Math.round(peakH))}.\n`,
      );
      report.add(
        '| burned | damage a march | silver | gold | a silver | a hired | shape | efficient | app’s stops | owner’s rules | knee |\n|---|---|---|---|---|---|---|---|---|---|---|',
      );
      for (const row of rungs) {
        const app = plan.alternatives
          .filter((s) => is(s, row))
          .map((s) => s.pick)
          .join(', ');
        const owner = [
          is(bestS, row) ? 'best a silver' : '',
          is(balanced, row) ? 'best on both (max-min)' : '',
          is(product, row) ? 'best on both (product)' : '',
          is(bestH, row) ? 'best a hired' : '',
          is(top, row) ? 'most mercs / most damage' : '',
        ]
          .filter(Boolean)
          .join(', ');
        report.add(
          `| ${n(row.repeat.mercLost)} | **${n(row.repeat.damage)}** | ${n(row.repeat.silver)} | ${n(row.repeat.gold)} | ${perS(row).toFixed(2)} | ${n(Math.round(perH(row)))} | ${row.shape} | ` +
            `${efficient.includes(row) ? '✓' : ''} | ${app} | ${owner} | ${is(knee, row) ? '✓' : ''} |`,
        );
      }
    }
    report.save();
  }, 900_000);
});
