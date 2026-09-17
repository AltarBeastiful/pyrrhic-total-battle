/**
 * 93 — **the ladder against the sizer's own march** (`sizerShape`), on the owner's export of 2026-09-17.
 *
 * The owner, 2026-09-17:
 *
 * > *"Are we actually exploring what each additional troop type in the march brings us? … I get SP1 and ARC1
 * > left out in the sweet spot, but adding them back just brings damage up and cost down … Take a step back
 * > to assess why and where we diverged from the actual best plan in the computations."*
 *
 * Where the search sizes troops: as a **ladder** — the strongest `depth` types by damage per HP, one rung
 * each, 2 % apart, scaled. It fields a *prefix* of that ranking and never any other subset, and its shape is
 * not the Elite sizer's, which is what the March pane draws after a put-back (`resizeMarch`: elite, the
 * plan's hired counts as caps). So a put-back can beat the plan's own march without the search ever having
 * scored it. `sizerShape` scores, for every mercenary vector, the Elite sizer over every troop type as one
 * more shape.
 *
 * Measured here on his own export through the app's own request builder (`buildPlanRequest`, so the flags,
 * horizon and bonuses are the app's): the bar both ways at his setup's housing and at 12 000 leadership, and
 * his put-back march — the eleven counts he read off the pane — priced by the same engine.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/93-sizer-shape.test.ts`
 */
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { planCampaign, planMarch } from '../../src/engine';
import type { PlanRow } from '../../src/engine/plan';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import { EXPORT_2026_09_17, Report, n } from './harness';

/** The march the owner read off the pane after putting SP1 and ARC1 back (2026-09-17). */
const PUT_BACK: Record<string, number> = {
  'legionary-6': 34,
  'archer-1': 1569,
  'spearman-1': 1272,
  'rider-1': 696,
  'archer-2': 866,
  'spearman-2': 703,
  'rider-2': 384,
  'rider-3': 215,
  'arbalester-6': 40,
  'chariot-6': 16,
  'epic-monster-hunter-6': 24,
};
const short = (id: string): string => id.replace(/-6$/, '').replace('epic-monster-hunter', 'EMH');

describe.skipIf(!process.env.THEORY)('the ladder against the sizer shape', () => {
  it('draws the bar both ways on the owner’s export', () => {
    const report = new Report('93-sizer-shape');
    const parsed = parseImport(readFileSync(EXPORT_2026_09_17, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('not a profile export');
    const profile = parsed.payload;
    const setup = profile.setups[0];
    if (!setup) throw new Error('no setup');

    report.h('The frame');
    report.add(
      `Owner's export of 2026-09-17 (${profile.setups.length} setup, captains ${profile.sources.captains.map((c) => `${c.captainId} ${n(c.level)}`).join(' · ')}), ` +
        `through \`buildPlanRequest\` — the app's own flags and horizon. *ladder* = the search as it was; *+ sizer* = ` +
        '`sizerShape`, the Elite sizer over every troop type scored as one more shape a mercenary vector. "lead" ' +
        'is the leadership the repeated march uses, "types" its troop types, "dropped" the troop types the account ' +
        'holds that the march does not field.',
    );
    for (const housing of [setup.housing, { ...setup.housing, leadership: 12_000 }]) {
      const input = buildPlanRequest(profile, { ...setup, housing });
      const req = input.request;
      const troopIds = req.units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id);
      const mercIds = req.units.filter((unit) => unit.pool === 'authority').map((unit) => unit.id);
      const lead = (counts: Record<string, number>): number =>
        req.units
          .filter((unit) => unit.pool === 'leadership')
          .reduce((sum, unit) => sum + (counts[unit.id] ?? 0) * unit.cost, 0);
      report.h(`Leadership ${n(housing.leadership)} · authority ${n(housing.authority)}`);
      report.add(
        '| way | pick | burned | damage a march | silver a march | gold | a silver | a hired | lead | types | dropped | hired fielded | campaign damage | campaign silver | search |\n' +
          '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|',
      );
      for (const way of ['ladder', '+ sizer'] as const) {
        const started = Date.now();
        const plan = planCampaign({ ...input, sizerShape: way === '+ sizer' });
        const took = Date.now() - started;
        const line = (row: PlanRow): string => {
          const fielded = troopIds.filter((id) => (row.counts[id] ?? 0) > 0);
          const dropped = troopIds.filter((id) => (row.counts[id] ?? 0) <= 0);
          const sweet =
            plan.recommend && JSON.stringify(plan.recommend.counts) === JSON.stringify(row.counts);
          return (
            `| ${way} | \`${row.pick}\`${sweet ? ' ★' : ''} | ${n(row.repeat.mercLost)} | **${n(row.repeat.damage)}** | ` +
            `${n(row.repeat.silver)} | ${n(row.repeat.gold)} | ${(row.repeat.damage / row.repeat.silver).toFixed(2)} | ` +
            `${n(Math.round(row.repeat.damage / Math.max(1, row.repeat.mercLost)))} | ${n(lead(row.counts))} | ${n(fielded.length)} | ` +
            `${dropped.join(', ') || '—'} | ${mercIds.map((id) => `${short(id)} ${n(row.counts[id] ?? 0)}`).join(' · ')} | ` +
            `${n(row.totalDamage)} | ${n(row.silver)} | ${n(took)} ms |`
          );
        };
        for (const row of plan.alternatives) report.add(line(row));
      }
      if (housing.leadership === setup.housing.leadership) {
        const its = planMarch(req, PUT_BACK);
        const burn = mercIds.reduce((sum, id) => sum + Math.ceil((PUT_BACK[id] ?? 0) / 10), 0);
        report.add(
          `\nThe owner's put-back march, priced by the same engine: **${n(its.summary.avgDamage)}** damage for ` +
            `${n(its.summary.recovery.silver)} silver and ${n(its.summary.recovery.gold)} gold a march, ${n(burn)} hired ` +
            `burned, ${n(lead(PUT_BACK))} leadership, every troop type fielded.`,
        );
      }
    }
    report.save();
  });
});
