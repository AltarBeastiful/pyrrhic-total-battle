/**
 * 92 — **the bar as the app draws it**, after the owner's answers of 2026-09-17 to the cross review (`91`):
 *
 *  1. the slider is *"about balancing between burning silver efficiently, which is constrained, and burning
 *     mercs efficiently, which is constrained as well"*;
 *  2. the sweet spot keeps the middle — *"I don't want to set the default or any parameter"*;
 *  3. S-58: *"A alone"*;
 *  4. on a "Best for silver" stop: *"consistency is good to keep always the same stops … offering a choice
 *     that doesn't come down to anything meaningful and is not very different from the other is inefficient
 *     and causes frustration … Try to assess again."*
 *
 * This file is the re-assessment, on the engine's figures. For each horizon and each axis it prints the bar as
 * the app would draw it with A on, every stop with the two efficiencies it is the bar's best at
 * (`PlanRow.bestFor`), and — the measure for question 4 — **how different each stop is from its neighbour**:
 * the damage, silver and burn between adjacent stops, as a share of the larger. A stop that differs from its
 * neighbour by under a few percent on every axis is the frustration the owner describes.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/92-the-bar-as-drawn.test.ts`
 */
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine/plan';
import type { PlanRow, PlanTotals } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import { MERC_IDS, Report, loadOwner, n, scenarioC, withHousing } from './harness';

const HORIZONS = [3, 4, 10];
const KEEP = 3;

const perSilver = (row: PlanTotals): number =>
  row.repeat.silver > 0 ? row.repeat.damage / row.repeat.silver : 0;
const perHired = (row: PlanTotals): number =>
  row.repeat.mercLost > 0 ? row.repeat.damage / row.repeat.mercLost : 0;
const short = (id: string): string => id.replace(/-6$/, '').replace('epic-monster-hunter', 'EMH');
const hiredOf = (row: PlanTotals): string =>
  MERC_IDS.map((id) => `${short(id)} ${n(row.counts[id] ?? 0)}`).join(' · ');
const pct = (a: number, b: number): string =>
  `${((Math.abs(a - b) / Math.max(Math.abs(a), Math.abs(b), 1)) * 100).toFixed(1)} %`;
const badges = (row: PlanRow): string =>
  [row.bestFor.silver ? 'best a silver' : '', row.bestFor.hired ? 'best a hired' : '']
    .filter(Boolean)
    .join(', ');

describe.skipIf(!process.env.THEORY)('the bar as drawn', () => {
  it('prints both axes at three horizons with A on, and how far apart the stops stand', () => {
    const report = new Report('92-the-bar-as-drawn');
    const owner = loadOwner();
    const base: StackRequest = scenarioC(withHousing(owner.twelve, { leadership: 4_343, authority: 2_000 }));

    report.h('The frame');
    report.add(
      `Owner's export, scenario C, 4 343 leadership / 2 000 authority, no budget, S-58 **A on** (the app's ` +
        `setting since 2026-09-17), the bar capped at ${n(KEEP)} stops. Every row is the repeated march. ` +
        `"vs previous" is how far a stop stands from the one to its left — damage, silver, burn — as a share ` +
        `of the larger; the owner's question 4 is whether a stop earns its place, and this is the measure.`,
    );

    for (const horizon of HORIZONS) {
      report.h(`Horizon ${n(horizon)}${horizon === 4 ? ' — the app’s' : ''}`);
      for (const axis of ['silver', 'burn'] as const) {
        const plan = planCampaign({
          request: base,
          marchTarget: horizon,
          alternatives: KEEP,
          tokenFloor: true,
          barAxis: axis,
          withTrade: true,
        });
        const rows = plan.alternatives;
        report.add(`### ${axis} axis — ${n(rows.length)} stops, \`leftOut\` ${n(plan.leftOut)}\n`);
        report.add(
          '| pick | best at | burned | damage a march | silver a march | gold a march | a silver | a hired | vs previous: damage · silver · burn | hired fielded |\n' +
            '|---|---|---|---|---|---|---|---|---|---|',
        );
        rows.forEach((row, index) => {
          const previous = rows[index - 1];
          const sweet =
            plan.recommend && JSON.stringify(plan.recommend.counts) === JSON.stringify(row.counts);
          const vs = previous
            ? `${pct(row.repeat.damage, previous.repeat.damage)} · ${pct(row.repeat.silver, previous.repeat.silver)} · ` +
              `${n(Math.abs(row.repeat.mercLost - previous.repeat.mercLost))} unit${Math.abs(row.repeat.mercLost - previous.repeat.mercLost) === 1 ? '' : 's'}`
            : '—';
          report.add(
            `| \`${row.pick}\`${sweet ? ' ★' : ''} | ${badges(row) || '—'} | ${n(row.repeat.mercLost)} | ` +
              `**${n(row.repeat.damage)}** | ${n(row.repeat.silver)} | ${n(row.repeat.gold)} | ` +
              `${perSilver(row).toFixed(2)} | ${n(Math.round(perHired(row)))} | ${vs} | ${hiredOf(row)} |`,
          );
        });
        report.add('');
      }
    }
    report.save();
  });
});
