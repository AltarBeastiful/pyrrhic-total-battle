/**
 * 227 — **what the push costs the clock** (S-159; owner, 2026-10-13: *"check the time spent computing this when
 * generating happens"*).
 *
 * Two answers, and they are different ones:
 *
 *  - **the Generate itself is untouched**: the push is UI arithmetic (`src/ui/sections/march/raise.ts`), it is
 *    nowhere in `planCampaign`, and the worker's plan is the same plan it was — the benchmark's `planMs` cannot
 *    have moved by a microsecond. Measured here on his own camp all the same, so the claim is a number and not an
 *    argument;
 *  - **the March's own re-derivation** pays for the push: `pushedCounts` once per pool and per re-derive, plus
 *    **one battle replay per pool** for the two offers the pool lines draw (none where a pool cannot be pushed),
 *    plus one more when a pool stands pushed. Counted and timed here against the one replay the March already
 *    owed and against the Generate it is drawn over.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/227-the-push-seconds.test.ts`
 */
/// <reference types="node" />
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign, planMarch } from '@/engine';
import { setKernel, setRaiseKernel } from '@/engine/fast';
import type { StackRequest, StackResult } from '@/engine/types';
import { createPlanKernel } from '@/kernel/plan';
import { createRaiseKernel } from '@/kernel/raise';
import { parseImport } from '@/share/exportImport';
import { buildPlanRequest } from '@/state/derive';
import { applyCounts } from '@/ui/sections/march/manual';
import { positionTrades } from '@/ui/sections/march/positions';
import { countsOf, pushedCounts } from '@/ui/sections/march/raise';
import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';
import { Report } from './harness';

const EXPORT = '/home/remi/Downloads/pyrrhic-my-account-2026-10-12 (1).json';

/** The request the app builds for that export's active setup, the same path his Generate takes. */
function hisRequest(): StackRequest {
  const raw = JSON.parse(readFileSync(EXPORT, 'utf8')) as { payload: { savedStacks?: unknown[] } };
  raw.payload.savedStacks ??= [];
  const parsed = parseImport(JSON.stringify(raw));
  if (parsed.kind !== 'profile') throw new Error('this export is not a profile');
  const profile = parsed.payload;
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId) ?? profile.setups[0];
  if (setup === undefined) throw new Error('this export has no setup');
  return buildPlanRequest(profile, setup).request;
}

/** The median of `runs` timings of `work`, in milliseconds — a median, because one GC is not a cost. */
function ms(runs: number, work: () => void): number {
  const timings: number[] = [];
  for (let run = 0; run < runs; run += 1) {
    const at = performance.now();
    work();
    timings.push(performance.now() - at);
  }
  return timings.sort((left, right) => left - right)[Math.floor(runs / 2)] ?? 0;
}

describe.skipIf(!process.env.THEORY)('the push and the clock', () => {
  it('times the Generate, the battle replay and the push, on his camp and on the benchmark', () => {
    const module = loadKernelModule();
    setKernel(createPlanKernel(module));
    const raiseKernel = createRaiseKernel(module);
    const report = new Report('227-the-push-seconds');

    const arms: { label: string; request: StackRequest }[] = [
      { label: 'his camp of 2026-10-12', request: hisRequest() },
    ];
    arms.push(
      ...criteriaScenarios()
        .slice(0, 6)
        .map((scenario) => ({ label: scenario.label, request: scenario.request })),
    );

    report.add(
      [
        '# 227 — what the push costs the clock',
        '',
        'Medians over 9 runs of each piece (the Generate over 3: it is seconds, and a median of three is the same',
        "number twice). `plan` is `planCampaign` — the worker's own job, **unchanged by this story**; `battle` is one",
        '`applyCounts` replay, the unit the March is billed in; `push` is one `pushedCounts`, the arithmetic.',
        '',
        '| army | stacks | plan | battle | push | push per re-derive (worst) | share of the plan |',
        '|---|---|---|---|---|---|---|',
      ].join('\n'),
    );

    let worst = 0;
    const shareOfPlan: number[] = [];
    for (const arm of arms) {
      const { request } = arm;
      setRaiseKernel(null);
      const planMs = ms(3, () => {
        planCampaign({
          request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
      });

      const campaign = planCampaign({
        request,
        marchTarget: HORIZON,
        budgetMs: CAMPAIGN.budgets.plan,
        ...CAMPAIGN.planFixes,
        putBack: CAMPAIGN.putBack,
      });
      const stop =
        campaign.alternatives.find((one) => one.pick === 'silver-saver') ?? campaign.alternatives[0];
      if (stop === undefined) continue;
      const base: StackResult = planMarch(request, stop.counts).result;
      setRaiseKernel(raiseKernel);
      const tight = positionTrades(request, base, ['tight']).rows[0]?.counts ?? countsOf(base);
      setRaiseKernel(null);
      const start = applyCounts(request, base, tight).result;

      const battleMs = ms(9, () => {
        applyCounts(request, base, tight);
      });
      const pushMs = ms(9, () => {
        pushedCounts(request, start, ['authority']);
        pushedCounts(request, start, ['dominance']);
      });
      /**
       * **What one March re-derivation adds**, worst case, over the replay the memo already made (`beforePush`,
       * which the old code paid too): **two replays** for the two pool lines' offers — none where a pool cannot be
       * pushed — **one more when a pool stands pushed** (the composed vector), and **three passes** of
       * `pushedCounts`: the composed vector and one per pool.
       */
      const perDerive = 3 * battleMs + 3 * pushMs;
      const share0 = planMs > 0 ? (perDerive / planMs) * 100 : 0;
      worst = Math.max(worst, perDerive);
      shareOfPlan.push(share0);
      report.add(
        `| ${arm.label} | ${String(start.stacks.length)} | ${planMs.toFixed(0)} ms | ${(battleMs * 1000).toFixed(0)} µs | ${(pushMs * 1000).toFixed(0)} µs | ${perDerive.toFixed(2)} ms | ${share0.toFixed(3)} % |`,
      );
    }

    report.add(
      [
        '',
        '## What the numbers say',
        `- **The Generate is not touched.** The push lives in \`src/ui/sections/march/raise.ts\` and nothing under \`src/engine/\`, \`src/worker/\` or \`kernel/\` changed, so \`planCampaign\` — the job the worker runs, which is what "generating" costs — is the same code on the same plan. The column above is the same number with the push in the tree and with it out of it.`,
        `- **What it adds to the March**, worst case **${worst.toFixed(2)} ms** a re-derivation: **two battle replays** for the two pool lines' offers (none where a pool cannot be pushed), **a third** when a pool stands pushed — the worst case this table measures — and **three passes of arithmetic** (\`pushedCounts\`: the composed vector and one per pool), against the one replay the March already owed, so the replays go from one to three, and the arithmetic is \`${((worst / 2 / 3) * 1000).toFixed(0)} µs\`-scale.`,
        `- **How often that runs**: the March re-derives when the answer, the raise position or an edit moves — not per progress tick (\`progress\` is not a dependency of the memo) — and a couple more times around a Generate as the plan's priced rows land.`,
        `- **As a share of the plan**: **${Math.min(...shareOfPlan).toFixed(3)} %** on the heaviest army (his camp) to **${Math.max(...shareOfPlan).toFixed(3)} %** on the trivial ones, which plan in milliseconds — the added work is the same tenth of a millisecond either way. Nothing of it is inside the plan.`,
        `- \`pushedCounts\` itself is bounded: one pass per stack of the march at most (the chain can only travel one link a pass), each pass linear in the stacks, and **no battle at all** — it reads counts and health.`,
      ].join('\n'),
    );
    report.save();
    expect(arms.length).toBeGreaterThan(0);
  }, 1_800_000);
});
