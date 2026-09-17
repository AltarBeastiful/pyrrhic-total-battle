/**
 * 95 — **the method as a shape**: the sizer's march under Elite, Military Science and Military Science relaxed,
 * each scored inside the plan's search (`SIZER_DEPTHS`), on the owner's export of 2026-09-17.
 *
 * `94` §C found the branch: with the sweet spot's own mercenary caps, Military Science over the same eight
 * types hit for 5 770 261 against Elite's 5 736 190 while burning fewer hired units — and the sizer shape
 * scored Elite alone. This file draws the bar with all three methods scored, at the setup's housing and at
 * 12 000 leadership, and says which shape each stop came from and what the search costs now. The Elite-only
 * bar of `out/93` is the comparison.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/95-sizer-methods.test.ts`
 */
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine';
import type { PlanRow } from '../../src/engine/plan';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import { EXPORT_2026_09_17, Report, n } from './harness';

const short = (id: string): string => id.replace(/-6$/, '').replace('epic-monster-hunter', 'EMH');

describe.skipIf(!process.env.THEORY)('the method as a shape', () => {
  it('draws the bar with the three sizer methods scored', () => {
    const report = new Report('95-sizer-methods');
    const parsed = parseImport(readFileSync(EXPORT_2026_09_17, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('not a profile export');
    const profile = parsed.payload;
    const setup = profile.setups[0];
    if (!setup) throw new Error('no setup');
    report.h('The frame');
    report.add(
      "Owner's export of 2026-09-17 through `buildPlanRequest` (the app's flags: A on, sizer shape on, burn axis, " +
        'three stops, horizon 4). "shape" is what sized the stop: a ladder, or the sizer under Elite / MS / MS ' +
        'relaxed. Compare `out/93-sizer-shape.md`, where the sizer shape was Elite alone.',
    );
    for (const housing of [setup.housing, { ...setup.housing, leadership: 12_000 }]) {
      const input = buildPlanRequest(profile, { ...setup, housing });
      const req = input.request;
      const troopIds = req.units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id);
      const mercIds = req.units.filter((unit) => unit.pool === 'authority').map((unit) => unit.id);
      const started = Date.now();
      const plan = planCampaign({ ...input, withTrade: true });
      const took = Date.now() - started;
      const shapes = new Map<string, number>();
      for (const row of plan.trade ?? []) shapes.set(row.shape, (shapes.get(row.shape) ?? 0) + 1);
      report.h(`Leadership ${n(housing.leadership)} · authority ${n(housing.authority)} — ${n(took)} ms`);
      report.add(
        `The band offers ${n(plan.trade?.length ?? 0)} plans: ${[...shapes.entries()].map(([shape, count]) => `${n(count)} ${shape}`).join(', ')}. \`leftOut\` ${n(plan.leftOut)}.\n`,
      );
      report.add(
        '| pick | shape | burned | damage a march | silver a march | gold | a silver | a hired | types | dropped | hired fielded | campaign damage | campaign silver |\n' +
          '|---|---|---|---|---|---|---|---|---|---|---|---|---|',
      );
      const line = (row: PlanRow): string => {
        const fielded = troopIds.filter((id) => (row.counts[id] ?? 0) > 0);
        const dropped = troopIds.filter((id) => (row.counts[id] ?? 0) <= 0);
        const sweet = plan.recommend && JSON.stringify(plan.recommend.counts) === JSON.stringify(row.counts);
        return (
          `| \`${row.pick}\`${sweet ? ' ★' : ''} | ${row.shape} | ${n(row.repeat.mercLost)} | **${n(row.repeat.damage)}** | ` +
          `${n(row.repeat.silver)} | ${n(row.repeat.gold)} | ${(row.repeat.damage / row.repeat.silver).toFixed(2)} | ` +
          `${n(Math.round(row.repeat.damage / Math.max(1, row.repeat.mercLost)))} | ${n(fielded.length)} | ${dropped.join(', ') || '—'} | ` +
          `${mercIds.map((id) => `${short(id)} ${n(row.counts[id] ?? 0)}`).join(' · ')} | ${n(row.totalDamage)} | ${n(row.silver)} |`
        );
      };
      for (const row of plan.alternatives) report.add(line(row));
    }
    report.save();
  });
});
