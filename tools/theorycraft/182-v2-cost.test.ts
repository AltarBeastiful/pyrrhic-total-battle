/**
 * 182 — **what the exhaustive raise costs, and what it buys, on every stop of every benchmark army**
 * (S-143b). Owner, 2026-09-29: *"implement best V2 and add it to the interface. Check all your development
 * and verify gains across the benchmark"*.
 *
 * Experiment 180 prices `Best v2` against everything that ships; this one answers the two questions the
 * *interface* needed answered before the position could be drawn, and neither of them is about damage:
 *
 *   1. **What it costs.** `climbedCounts` samples 16 points a stack because it runs on the main thread
 *      between two keystrokes. This search does not sample at all, and the March cannot afford it in a
 *      render: the figure that decided the design is the **46.5 s** at the bottom of this table (the owner's
 *      live camp of 2026-09-18 at its `more-mercs` stop, a box of 908 684 vectors). That is why the position
 *      is a worker of its own (`raiseSearch.ts`) rather than a fourth branch of `raisedCounts`.
 *   2. **How big the box gets**, and which stops the walk covers — `space` and `how` are read straight off
 *      the shipped module, so the report says which answers are *known* (walked) and which are *found*.
 *
 * Every reading is the app's own arithmetic: `exactRaise` on the march `planMarch` produced from the plan's
 * own stop, replayed by `applyCounts`, scored on the worst opening. The one promise asserted here is the one
 * the March leans on — **`Best v2` never comes out below the `Best` it is seeded with**, at any cost.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/182-v2-cost.test.ts`
 */
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign, planMarch } from '@/engine';
import { exactRaise } from '@/ui/sections/march/exact';
import { applyCounts } from '@/ui/sections/march/manual';
import { raisedCounts, shelterCeiling, troopFloor } from '@/ui/sections/march/raise';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { Report, n } from './harness';

const BEST = { authority: 'best', dominance: 'best' } as const;
/** The fifth position, on both pools: what pressing `Best v2` anywhere puts the control into. */
const V2 = { authority: 'v2', dominance: 'v2' } as const;

/**
 * **The middle of a set** — the mean of the two middle values on an even count, which is what "median"
 * means everywhere else in this repo's prose and what the plan's own §2 quotes (`docs/plans/best-v2.md`;
 * experiment 181's helper takes the upper of the two, and the two conventions disagree by ~0.5 points on
 * the ten gains here, which is exactly the sort of number nobody should have to guess at).
 */
function median(values: readonly number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? 0;
  return ((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2;
}

describe.skipIf(!process.env.THEORY)('what Best v2 costs', () => {
  it('times the exhaustive raise on every stop, and holds it to the seed', () => {
    const report = new Report('182-v2-cost');
    report.add(
      [
        'The exhaustive raise (`@/ui/sections/march/exact`, the function the worker runs), on every stop of',
        'every benchmark army where a hired stack can move: what it costs in wall clock, how big the box is,',
        'and whether the answer was **walked** (an optimum, known) or **searched** (convergence, found).',
        "The gain column is its damage against the shipped `Best`'s on the same counts.",
      ].join(' '),
    );
    report.add('');
    report.add('| army · stop | box | how | v2 (ms) | app Best (ms) | v2 damage | app damage | gain |');
    report.add('|---|---|---|---|---|---|---|---|');

    const timings: number[] = [];
    const walks: number[] = [];
    const searched: number[] = [];
    const gains: number[] = [];
    const broken: string[] = [];

    for (const scenario of criteriaScenarios()) {
      let plan;
      try {
        plan = planCampaign({
          request: scenario.request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
      } catch {
        continue;
      }

      for (const stop of plan.alternatives) {
        const base = planMarch(scenario.request, stop.counts).result;
        const floor = troopFloor(base);
        if (floor === null) continue;
        // A stop the raise can move at all: the same test `boxOf` makes, made here so an empty stop is not
        // timed as if it were a search.
        const movable = base.stacks.filter(
          (stack) =>
            stack.pool !== 'leadership' &&
            stack.count > 0 &&
            Math.min(
              shelterCeiling(floor, stack.hpPerUnit),
              scenario.request.caps[stack.unitId] ?? Number.MAX_SAFE_INTEGER,
            ) > stack.count,
        );
        if (movable.length === 0) continue;

        const started = performance.now();
        const found = exactRaise(scenario.request, base, V2);
        const ms = performance.now() - started;

        const appStarted = performance.now();
        const app = raisedCounts(scenario.request, base, BEST) ?? {};
        const appMs = performance.now() - appStarted;

        const counts = found?.counts ?? {};
        const v2 = applyCounts(scenario.request, base, { ...stop.counts, ...counts }).summary.minDamage;
        const shipped = applyCounts(scenario.request, base, { ...stop.counts, ...app }).summary.minDamage;

        // **The one promise this file holds**: the search is seeded with the shipped answer and takes strict
        // improvements only, so no stop, at any cost, may come out below it.
        if (v2 < shipped) {
          broken.push(`${scenario.label} · ${stop.pick}: ${n(v2)} came out below Best's ${n(shipped)}`);
        }
        const gain = shipped === 0 ? 0 : ((v2 - shipped) / shipped) * 100;
        if (gain > 0.05) gains.push(gain);
        timings.push(ms);
        if (found?.how === 'walked') walks.push(ms);
        if (found?.how === 'searched') searched.push(ms);

        report.add(
          `| ${scenario.label} · ${stop.pick} | ${found === null ? '—' : n(found.space)} | ${
            found?.how ?? '—'
          } | ${ms.toFixed(0)} | ${appMs.toFixed(1)} | ${n(v2)} | ${n(shipped)} | ${
            gain > 0.05 ? `+${gain.toFixed(2)} %` : '—'
          } |`,
        );
      }
    }

    const worst = [...timings].sort((a, b) => b - a)[0] ?? 0;
    report.h('What the numbers say');
    report.add('');
    report.add(
      `- **The cost**: ${median(timings).toFixed(1)} ms median, **${worst.toFixed(0)} ms worst**, over ` +
        `${String(timings.length)} stops. The ${String(walks.length)} stops the box is small enough to ` +
        `**walk** cost ${median(walks).toFixed(1)} ms median and ${(walks.length === 0 ? 0 : Math.max(...walks)).toFixed(0)} ms worst; ` +
        `the ${String(searched.length)} that have to be **searched** cost ${median(searched).toFixed(0)} ms median` +
        (searched.length === 0 ? '.' : ` and ${Math.max(...searched).toFixed(0)} ms worst.`),
    );
    report.add(
      `- **The gain over \`Best\`**: ${String(gains.length)} stops beat it, **+${Math.min(...gains).toFixed(2)} % at the smallest, ` +
        `+${median(gains).toFixed(2)} % median, +${Math.max(...gains).toFixed(2)} % at the best**. The rest are level with it — ` +
        "the search is seeded with `Best`'s own counts, so a stop where it finds nothing better is a stop where",
    );
    report.add(
      `  the shipped climb had already found the box's best. And **no stop came out below it**: ${broken.length === 0 ? 'none, on any army' : broken.join('; ')}.`,
    );
    report.add('');
    report.save();

    expect(broken, broken.join('\n')).toEqual([]);
  }, 3_600_000);
});
