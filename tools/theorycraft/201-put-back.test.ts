/**
 * 201 — **putting SW1 back halves the trade** (backlog B-10, Critical 03 task 1; the owner, `todos.md`: *"with
 * SP3 and SW1 left out, adding SW1 back gives 27M damage … the plan table then offers no tight trade at that
 * point"*).
 *
 * The owner's account of 2026-10-07 (`pyrrhic-my-account-2026-10-07.json` at the repository root, read only and
 * never committed; `PYRRHIC_EXPORT_2026_10_07` names another path), planned as the app plans it
 * (`buildPlanRequest`), and walked through the March the way `generate.ts` walks it:
 *
 *  1. the plan, and the stop the bar opens on (`openingPosition` with no stop chosen);
 *  2. that stop as the plan sizes it, and under `Tight` (`liftedCounts`, the kernel);
 *  3. (a) SP3 and SW1 taken out — `resizeMarchOver` with the arguments `planStopAgain` builds — then `Tight` on
 *     the re-sized march (the `raisedCounts` path `useMarch` takes when the march is not the stop's own);
 *  4. (b) SW1 put back, the same way;
 *  5. (c) SW1 taken out again, to read whether the pair returns to (a).
 *
 * Every march is read on damage, silver, gold, mercs lost, monsters and the stacks it fields, and every stop of
 * the plan table is listed. Display only: nothing here changes a constant.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/201-put-back.test.ts`
 */
/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { largestSustained, planMarch, planRepeats, withMethod } from '../../src/engine';
import type { CampaignPlan, ResizedMarch } from '../../src/engine/plan';
import { planCampaign, resizeMarchOver } from '../../src/engine/plan';
import type { StackRequest, StackResult } from '../../src/engine/types';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';
import type { BattleSetup, Profile } from '../../src/state/schema';
import { hiredLost } from '../../src/ui/sections/march/hired';
import { liftedCounts } from '../../src/ui/sections/march/positions';
import { countsOf } from '../../src/ui/sections/march/raise';
import { defaultPlanPosition, pickOf } from '../../src/ui/sections/march/runStore';
import { Report, n } from './harness';

const OWNER_2026_10_07 = process.env.PYRRHIC_EXPORT_2026_10_07 ?? 'pyrrhic-my-account-2026-10-07.json';
const TIGHT = { authority: 'tight', dominance: 'tight' } as const;

function load(path: string): Profile | null {
  if (!existsSync(path)) return null;
  const parsed = parseImport(readFileSync(path, 'utf8'));
  return parsed.kind === 'profile' ? parsed.payload : null;
}

function activeSetup(profile: Profile): BattleSetup {
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId) ?? profile.setups[0];
  if (setup === undefined) throw new Error('no setup');
  return setup;
}

/** `planStopAgain`'s own arguments, for the types in `included`. */
function resizeOver(
  request: StackRequest,
  plan: CampaignPlan,
  position: number,
  included: Set<string>,
): ResizedMarch | null {
  const stop = pickOf(plan, position);
  const repeats = planRepeats(stop);
  const troopIds: string[] = [];
  const hired: Record<string, number> = {};
  for (const unit of request.units) {
    if (!included.has(unit.id)) continue;
    if (unit.pool === 'leadership') {
      troopIds.push(unit.id);
      continue;
    }
    if (unit.pool === 'dominance') {
      hired[unit.id] = Math.max(
        stop.counts[unit.id] ?? 0,
        Math.floor(request.housing.dominance / Math.max(1, unit.cost)),
      );
      continue;
    }
    const held = request.caps[unit.id];
    hired[unit.id] =
      held === undefined
        ? Math.floor(request.housing.authority / Math.max(1, unit.cost))
        : largestSustained(held, repeats);
  }
  return resizeMarchOver(request, {
    troopIds,
    hired,
    stop: stop.counts,
    fills: CAMPAIGN.editFills,
    putBack: CAMPAIGN.putBack,
  });
}

interface Reading {
  counts: Record<string, number>;
  damage: number;
  silver: number;
  gold: number;
  mercsLost: number;
  monsters: number;
  mercs: number;
}

function read(request: StackRequest, counts: Record<string, number>): Reading {
  const { result, summary } = planMarch(request, counts);
  const pool = (p: string) => result.stacks.filter((s) => s.pool === p).reduce((sum, s) => sum + s.count, 0);
  return {
    counts: Object.fromEntries(result.stacks.filter((s) => s.count > 0).map((s) => [s.unitId, s.count])),
    damage: summary.minDamage,
    silver: summary.recovery.silver,
    gold: summary.recovery.gold,
    mercsLost: hiredLost(result.stacks),
    monsters: pool('dominance'),
    mercs: pool('authority'),
  };
}

function tightOf(request: StackRequest, base: StackResult): Record<string, number> {
  const lifted = liftedCounts(request, base, TIGHT);
  return { ...countsOf(base), ...(lifted?.counts ?? {}) };
}

describe.skipIf(!process.env.THEORY)('201 the put-back on the 2026-10-07 account', () => {
  it('reproduces the march with SP3 and SW1 out, and with SW1 put back', () => {
    const profile = load(OWNER_2026_10_07);
    if (profile === null) return;
    const setup = activeSetup(profile);
    const input = buildPlanRequest(profile, setup);
    const plan = planCampaign({ ...input, budgetMs: CAMPAIGN.budgets.plan });
    const request = withMethod(input.request, 'elite');
    const report = new Report('201-put-back');
    const label = (id: string) => request.units.find((u) => u.id === id)?.id ?? id;

    report.h('Units');
    report.add(request.units.map((u) => `- ${u.id} (${u.pool}, cost ${String(u.cost)})`).join('\n'));

    const position = defaultPlanPosition(plan);
    report.h('The plan table');
    report.add('| # | stop | damage | silver | gold | mercs lost | counts |');
    report.add('|---|---|---|---|---|---|---|');
    plan.alternatives.forEach((row, i) => {
      const r = read(request, row.counts);
      report.add(
        `| ${String(i)}${i === position ? ' ◀' : ''} | ${row.pick} | ${n(r.damage)} | ${n(r.silver)} | ${n(r.gold)} | ${n(r.mercsLost)} | ${Object.entries(
          r.counts,
        )
          .map(([id, c]) => `${label(id)} ${String(c)}`)
          .join(', ')} |`,
      );
    });

    const marches: [string, Reading][] = [];
    const stop = pickOf(plan, position);
    const stopMarch = planMarch(request, stop.counts);
    marches.push(['stop as planned', read(request, stop.counts)]);
    marches.push(['stop, Tight', read(request, tightOf(request, stopMarch.result))]);

    const all = request.units.map((u) => u.id);
    const pick = (re: RegExp) => all.find((id) => re.test(id));
    const sp3 = process.env.SP3 ?? pick(/spear.*3|specialist.*3/);
    const sw1 = process.env.SW1 ?? pick(/sword.*1/);
    report.h('Taken out');
    report.add(`SP3 = ${String(sp3)}, SW1 = ${String(sw1)}`);
    const walk: [string, string[]][] = [
      ['(a) SP3 + SW1 out', all.filter((id) => id !== sp3 && id !== sw1)],
      ['(b) SW1 put back', all.filter((id) => id !== sp3)],
      ['(c) SW1 out again', all.filter((id) => id !== sp3 && id !== sw1)],
      ['(d) SW1 put back again', all.filter((id) => id !== sp3)],
    ];
    for (const [name, ids] of walk) {
      const resized = resizeOver(request, plan, position, new Set(ids));
      if (resized === null) {
        report.add(`${name}: no march`);
        continue;
      }
      const base = planMarch(request, resized.counts).result;
      marches.push([
        `${name}, re-sized (${resized.shape}, fill ${String(resized.fill)}${resized.traded ? ', traded' : ''})`,
        read(request, resized.counts),
      ]);
      marches.push([`${name}, Tight`, read(request, tightOf(request, base))]);
    }

    report.h('The marches');
    report.add('| march | damage | silver | gold | mercs (lost) | monsters | counts |');
    report.add('|---|---|---|---|---|---|---|');
    for (const [name, r] of marches) {
      report.add(
        `| ${name} | ${n(r.damage)} | ${n(r.silver)} | ${n(r.gold)} | ${n(r.mercs)} (${n(r.mercsLost)}) | ${n(r.monsters)} | ${Object.entries(
          r.counts,
        )
          .map(([id, c]) => `${label(id)} ${String(c)}`)
          .join(', ')} |`,
      );
    }
    report.save();
  }, 600_000);
});
