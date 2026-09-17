/**
 * 93 — **the ladder against the sizer's own march**, behind `sizerShape` (owner, 2026-09-17):
 *
 * > *"Are we actually exploring what each additional troop type in the march brings us? When generating with
 * > the same parameters but 7000 authority I get SP1 and ARC1 left out in the sweet spot, but adding them back
 * > just brings damage up and cost down … Take a step back to assess why and where we diverged from the actual
 * > best plan in the computations."*
 *
 * Where the search sizes troops: as a **ladder** — the strongest `depth` types by damage per HP, one rung each,
 * 2 % apart, scaled. It fields a *prefix* of that ranking and never any other subset, and its shape is not the
 * Elite sizer's, which is what the March pane draws after a put-back. So a put-back can beat the plan's own
 * march without the search ever having scored it. `sizerShape` scores, for every mercenary vector, the Elite
 * sizer over every troop type as one more shape.
 *
 * This file measures the bar both ways at three housings on the owner's 2026-09-13 export (scenario C) and
 * says what the flag costs in time. **It cannot reproduce the owner's live account** — his linked march hits
 * for 6 133 203 in the app and 4 986 889 under this export's bonuses — so the live case waits for a fresh export.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/93-sizer-shape.test.ts`
 */
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine/plan';
import type { PlanRow } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import { MERC_IDS, Report, loadOwner, n, scenarioC, withHousing } from './harness';

const HOUSINGS = [
  { leadership: 4_343, authority: 2_000 },
  { leadership: 12_000, authority: 2_180 },
  { leadership: 12_000, authority: 7_000 },
];
const short = (id: string): string => id.replace(/-6$/, '').replace('epic-monster-hunter', 'EMH');

describe.skipIf(!process.env.THEORY)('the ladder against the sizer shape', () => {
  it('draws the bar both ways at three housings', () => {
    const report = new Report('93-sizer-shape');
    const owner = loadOwner();
    report.h('The frame');
    report.add(
      "Owner's export of 2026-09-13, scenario C, horizon 4, A on, three stops. *ladder* = the search as shipped; " +
        '*+ sizer* = `sizerShape`, the Elite sizer over every troop type scored as one more shape a vector. ' +
        '"lead" is the leadership the repeated march uses; "types" its troop types; "dropped" the troop types the ' +
        'account holds that the march does not field.',
    );
    for (const housing of HOUSINGS) {
      const base: StackRequest = scenarioC(withHousing(owner.twelve, housing));
      const troopIds = base.units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id);
      const lead = (counts: Record<string, number>): number =>
        base.units
          .filter((unit) => unit.pool === 'leadership')
          .reduce((sum, unit) => sum + (counts[unit.id] ?? 0) * unit.cost, 0);
      report.h(`Leadership ${n(housing.leadership)} · authority ${n(housing.authority)}`);
      report.add(
        '| way | pick | burned | damage a march | silver a march | gold | a silver | a hired | lead | types | dropped | hired fielded | search |\n' +
          '|---|---|---|---|---|---|---|---|---|---|---|---|---|',
      );
      for (const way of ['ladder', '+ sizer'] as const) {
        const started = Date.now();
        const plan = planCampaign({
          request: base,
          marchTarget: 4,
          alternatives: 3,
          tokenFloor: true,
          barAxis: 'burn',
          sizerShape: way === '+ sizer',
        });
        const took = Date.now() - started;
        const line = (row: PlanRow): string => {
          const fielded = troopIds.filter((id) => (row.counts[id] ?? 0) > 0);
          const dropped = troopIds.filter((id) => (row.counts[id] ?? 0) <= 0);
          return (
            `| ${way} | \`${row.pick}\`${plan.recommend && JSON.stringify(plan.recommend.counts) === JSON.stringify(row.counts) ? ' ★' : ''} | ` +
            `${n(row.repeat.mercLost)} | **${n(row.repeat.damage)}** | ${n(row.repeat.silver)} | ${n(row.repeat.gold)} | ` +
            `${(row.repeat.damage / row.repeat.silver).toFixed(2)} | ${n(Math.round(row.repeat.damage / Math.max(1, row.repeat.mercLost)))} | ` +
            `${n(lead(row.counts))} | ${n(fielded.length)} | ${dropped.join(', ') || '—'} | ` +
            `${MERC_IDS.map((id) => `${short(id)} ${n(row.counts[id] ?? 0)}`).join(' · ')} | ${n(took)} ms |`
          );
        };
        for (const row of plan.alternatives) report.add(line(row));
      }
    }
    report.save();
  });
});
