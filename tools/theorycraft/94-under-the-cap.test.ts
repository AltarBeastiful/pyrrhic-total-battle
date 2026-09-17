/**
 * 94 — **is there a better deal under the cap?** (owner, 2026-09-17: *"did we try to find a sweet spot inside
 * the 7000 … is there a better deal that maximizes even more silver/dmg and merc/dmg without filling the
 * authority at max? … And is there any branches we don't explore right now?"*)
 *
 * Three measurements on his export of 2026-09-17, through the app's own request builder (sizer shape on,
 * three stops, horizon 4):
 *
 *  A. **Leadership, swept down from the setup's 7 000.** The sizer fills whatever leadership it is given, so
 *     the only way to march with fewer troops is to plan with less leadership. Each row is one plan's three
 *     stops; the question is whether damage a silver or damage a hired unit ever rises as the cap falls.
 *  B. **Authority, swept down.** Does it bind at all? The hired side is bounded by the stock and the horizon
 *     (a type that must last four marches fields at most what `lastsMarches` allows), not by authority.
 *  C. **Troop subsets the search never tries**: the sweet spot's own mercenary counts, re-sized by the Elite
 *     sizer over every "all types but one" subset and over the sizer's default of all types — the branch the
 *     plan does not walk (the ladder walks prefixes of a ranking, the sizer shape takes every type).
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/94-under-the-cap.test.ts`
 */
import { readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { planCampaign } from '../../src/engine';
import type { PlanRow } from '../../src/engine/plan';
import type { StackRequest } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import { EXPORT_2026_09_17, Report, evaluate, n, withMethod } from './harness';

const LEADERSHIPS = [3_000, 4_000, 5_000, 6_000, 7_000];
const AUTHORITIES = [400, 800, 1_200, 2_180];
const short = (id: string): string =>
  id
    .replace(/-6$/, '')
    .replace('epic-monster-hunter', 'EMH')
    .replace(/^(\w)\w*-(\d)$/, '$1$2');

describe.skipIf(!process.env.THEORY)('a better deal under the cap', () => {
  it('sweeps the two pools and the troop subsets', () => {
    const report = new Report('94-under-the-cap');
    const parsed = parseImport(readFileSync(EXPORT_2026_09_17, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('not a profile export');
    const profile = parsed.payload;
    const setup = profile.setups[0];
    if (!setup) throw new Error('no setup');

    const line = (tag: string, row: PlanRow, req: StackRequest, sweet: boolean): string => {
      const lead = req.units
        .filter((unit) => unit.pool === 'leadership')
        .reduce((sum, unit) => sum + (row.counts[unit.id] ?? 0) * unit.cost, 0);
      const auth = req.units
        .filter((unit) => unit.pool === 'authority')
        .reduce((sum, unit) => sum + (row.counts[unit.id] ?? 0) * unit.cost, 0);
      return (
        `| ${tag} | \`${row.pick}\`${sweet ? ' ★' : ''} | ${n(row.repeat.mercLost)} | **${n(row.repeat.damage)}** | ` +
        `${n(row.repeat.silver)} | ${n(row.repeat.gold)} | **${(row.repeat.damage / row.repeat.silver).toFixed(2)}** | ` +
        `**${n(Math.round(row.repeat.damage / Math.max(1, row.repeat.mercLost)))}** | ${n(lead)} | ${n(auth)} | ` +
        `${n(row.totalDamage)} | ${n(row.silver)} |`
      );
    };
    const head =
      '| cap | pick | burned | damage a march | silver a march | gold | a silver | a hired | leadership used | authority used | campaign damage | campaign silver |\n' +
      '|---|---|---|---|---|---|---|---|---|---|---|---|';

    report.h('A. Leadership swept down');
    report.add(head);
    for (const leadership of LEADERSHIPS) {
      const input = buildPlanRequest(profile, { ...setup, housing: { ...setup.housing, leadership } });
      const plan = planCampaign(input);
      for (const row of plan.alternatives) {
        const sweet = JSON.stringify(plan.recommend?.counts) === JSON.stringify(row.counts);
        report.add(line(`L ${n(leadership)}`, row, input.request, sweet));
      }
    }

    report.h('B. Authority swept down');
    report.add(head);
    for (const authority of AUTHORITIES) {
      const input = buildPlanRequest(profile, { ...setup, housing: { ...setup.housing, authority } });
      const plan = planCampaign(input);
      for (const row of plan.alternatives) {
        const sweet = JSON.stringify(plan.recommend?.counts) === JSON.stringify(row.counts);
        report.add(line(`A ${n(authority)}`, row, input.request, sweet));
      }
    }

    report.h('C. Troop subsets, the sweet spot’s own mercenaries');
    const input = buildPlanRequest(profile, setup);
    const req = input.request;
    const plan = planCampaign(input);
    const sweet = plan.recommend;
    if (!sweet) throw new Error('no recommendation');
    const mercIds = req.units.filter((unit) => unit.pool === 'authority').map((unit) => unit.id);
    const troopIds = req.units.filter((unit) => unit.pool === 'leadership').map((unit) => unit.id);
    const hiredCaps: Record<string, number> = {};
    for (const id of mercIds) hiredCaps[id] = sweet.counts[id] ?? 0;
    report.add(
      `The sweet spot fields ${mercIds.map((id) => `${short(id)} ${n(hiredCaps[id] ?? 0)}`).join(' · ')} and every troop ` +
        `type. Below, the same mercenaries re-sized by the Elite sizer over each subset of the troop types.\n`,
    );
    report.add(
      '| troops | damage a march | silver a march | a silver | a hired | leadership used |\n|---|---|---|---|---|---|',
    );
    const subsets: { tag: string; ids: string[] }[] = [
      { tag: 'all eight', ids: troopIds },
      ...troopIds.map((id) => ({
        tag: `all but ${short(id)}`,
        ids: troopIds.filter((other) => other !== id),
      })),
      { tag: 'tier 2–3 only', ids: troopIds.filter((id) => !id.endsWith('-1')) },
      { tag: 'tier 1 only', ids: troopIds.filter((id) => id.endsWith('-1')) },
    ];
    for (const method of ['elite', 'ms'] as const) {
      for (const subset of subsets) {
        const sub = withMethod(
          {
            ...req,
            caps: { ...req.caps, ...hiredCaps },
            units: req.units.filter(
              (unit) =>
                subset.ids.includes(unit.id) || (mercIds.includes(unit.id) && (hiredCaps[unit.id] ?? 0) > 0),
            ),
          },
          method,
        );
        const ev = evaluate(sub);
        const counts = Object.fromEntries(ev.result.stacks.map((stack) => [stack.unitId, stack.count]));
        const lead = req.units
          .filter((unit) => unit.pool === 'leadership')
          .reduce((sum, unit) => sum + (counts[unit.id] ?? 0) * unit.cost, 0);
        const burn = mercIds.reduce((sum, id) => sum + Math.ceil((counts[id] ?? 0) / 10), 0);
        report.add(
          `| ${method} · ${subset.tag} | **${n(ev.summary.avgDamage)}** | ${n(ev.summary.recovery.silver)} | ` +
            `**${(ev.summary.avgDamage / Math.max(1, ev.summary.recovery.silver)).toFixed(2)}** | ` +
            `**${n(Math.round(ev.summary.avgDamage / Math.max(1, burn)))}** | ${n(lead)} |`,
        );
      }
    }
    report.save();
  });
});
