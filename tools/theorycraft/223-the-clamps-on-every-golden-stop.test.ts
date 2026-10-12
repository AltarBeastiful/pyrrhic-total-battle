/**
 * 223 — **do the two clamps move any march?** (investigation 0026, rules R1/R2/R3; follows 216 which measured
 * them through the caller's `caps` and 218 which found that shortcut also moves the seed.)
 *
 * The clamps are now **in the kernel** (`raise()`'s slot loop, `kernel/assembly/index.ts`): a slot's ceiling is
 * `min(shelter ceiling, stock)`, then the pool's spare housing, then — for the two `Tight` positions and the
 * mercenaries' block alone — the stack's own `10·⌈from / 10⌉` chunk top. The seed (`raiseClimb`) reads
 * `raiseCeiling` and `rCaps` and never `rTo`, so it is untouched: R3 is satisfied by construction.
 *
 * This file is the gate that says the change is answer-free. It replays `tests/golden/raise.json`'s own corpus
 * — every stop of every benchmark army, the app's own `planCampaign` and `positionTrades` — through the new
 * kernel and holds **every count** of **every position** to the capture made before the clamps existed. The
 * `how`/`space`/`scored` triple is expected to move (a smaller box is a smaller box) and is reported, not
 * asserted.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/223-the-clamps-on-every-golden-stop.test.ts`
 */
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign, planMarch } from '@/engine';
import { setKernel, setRaiseKernel } from '@/engine/fast';
import type { StackRequest } from '@/engine/types';
import { createPlanKernel } from '@/kernel/plan';
import { createRaiseKernel } from '@/kernel/raise';
import { positionTrades } from '@/ui/sections/march/positions';
import type { PositionTrade } from '@/ui/sections/march/positions';
import { countsOf } from '@/ui/sections/march/raise';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';
import { Report, n } from './harness';

const GOLDEN = fileURLToPath(new URL('../../tests/golden/raise.json', import.meta.url));

interface RaiseRow {
  mode: PositionTrade['mode'];
  counts: Record<string, number>;
  how: 'walked' | 'searched' | null;
  space: number;
  scored: number;
}
interface RaiseEntry {
  army: string;
  stop: string;
  rows: RaiseRow[];
}

/** `golden-capture.test.ts`'s own `effective`: a march as a dense count per unit the request carries. */
function effective(request: StackRequest, own: Record<string, number>, counts: Record<string, number>) {
  const merged = { ...own, ...counts };
  return Object.fromEntries(request.units.map((unit) => [unit.id, merged[unit.id] ?? 0]));
}

describe.skipIf(!process.env.THEORY)('the clamps on every golden stop', () => {
  it('holds every count of every position to the pre-clamp capture', () => {
    const module = loadKernelModule();
    const kernel = createPlanKernel(module);
    const raiseKernel = createRaiseKernel(module);
    const golden = JSON.parse(readFileSync(GOLDEN, 'utf8')) as RaiseEntry[];
    const byKey = new Map(golden.map((entry) => [`${entry.army}|${entry.stop}`, entry]));

    const report = new Report('223-the-clamps-on-every-golden-stop');
    report.add(
      [
        'The clamps (investigation 0026, in the kernel) replayed against `tests/golden/raise.json`, captured',
        'before they existed. **counts** is held; `how`/`space`/`scored` are free.',
        '',
        '| army · stop | position | counts | box before → after | how before → after |',
        '|---|---|---|---|---|',
      ].join('\n'),
    );
    setKernel(kernel);
    const tally = {
      entries: 0,
      rows: 0,
      movedCounts: 0,
      boxShrank: 0,
      boxEmpty: 0,
      searchedGone: 0,
      stale: 0,
    };
    const moved: string[] = [];

    for (const scenario of criteriaScenarios()) {
      let campaign;
      try {
        campaign = planCampaign({
          request: scenario.request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
      } catch (error) {
        if (!(error instanceof Error) || !error.message.startsWith('planCampaign:')) throw error;
        continue;
      }
      for (const stop of campaign.alternatives) {
        const base = planMarch(scenario.request, stop.counts).result;
        const own = countsOf(base);
        setRaiseKernel(raiseKernel);
        const trades = positionTrades(scenario.request, base);
        setRaiseKernel(null);
        const before = byKey.get(`${scenario.label}|${stop.pick}`);
        if (before === undefined) {
          tally.stale += 1;
          continue;
        }
        tally.entries += 1;
        for (const row of trades.rows) {
          const was = before.rows.find((one) => one.mode === row.mode);
          if (was === undefined) continue;
          tally.rows += 1;
          const mine = effective(scenario.request, own, row.counts);
          const ids = new Set([...Object.keys(mine), ...Object.keys(was.counts)]);
          const same = [...ids].every((id) => (mine[id] ?? 0) === (was.counts[id] ?? 0));
          if (!same) {
            tally.movedCounts += 1;
            moved.push(
              `${scenario.label} · ${stop.pick} · ${row.mode}: ${JSON.stringify(was.counts)} → ${JSON.stringify(mine)}`,
            );
          }
          if (row.space < was.space) tally.boxShrank += 1;
          if (row.how === null && was.how !== null) {
            tally.boxEmpty += 1;
            if (was.how === 'searched') tally.searchedGone += 1;
          }
          if (!same || row.how !== was.how || row.space !== was.space) {
            report.add(
              `| ${scenario.label} · ${stop.pick} | ${row.mode} | ${same ? 'same' : '**MOVED**'} | ${n(was.space)} → ${n(row.space)} | ${was.how ?? '—'} → ${row.how ?? '—'} |`,
            );
          }
        }
      }
    }

    report.add(
      [
        '',
        '## What the numbers say',
        `- **${tally.rows} positions over ${tally.entries} stops** (of ${golden.length} in the golden; ${tally.stale} not rebuilt).`,
        `- **Counts moved on ${tally.movedCounts} of them.**`,
        `- The box shrank on ${tally.boxShrank}; it became **empty** (nothing to search) on ${tally.boxEmpty}, of which **${tally.searchedGone}** used to be a multistart **search**.`,
      ].join('\n'),
    );
    if (moved.length > 0) report.add(`\n\`\`\`\n${moved.slice(0, 40).join('\n')}\n\`\`\``);
    report.save();
    expect(tally.rows).toBeGreaterThan(0);
    // The whole point of the change: a clamp may take a box away, never a march.
    expect(tally.movedCounts).toBe(0);
  }, 900_000);
});
