/**
 * 221 — **what the restarts buy** (follows 220; owner, 2026-10-12: *"I want to explore reducing tight costs …
 * We also need to think about scaling tight. right now big accounts (high leadership/dominance, more troops
 * type) don't scale well."*).
 *
 * When the box is wider than `walkCap` the kernel searches it from `EXACT_DEFAULTS.restarts + 1` seeded starts,
 * each a `pairwise` pass then a `climb` to convergence (`raiseSearch`). That is the whole of what makes a wide
 * box expensive, and the default (**64 restarts, 24 sweeps**) is one figure for every army — the small box and
 * the 10²⁵ one alike. `createRaiseKernel` takes the search's own numbers, so the curve is measurable: this
 * experiment prices the identical box and rank from 1 to 65 starts and reports what each buys in the owner's
 * rating and what it costs in wall clock.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/221-what-the-restarts-buy.test.ts`
 */
/// <reference types="node" />
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign, planMarch } from '@/engine';
import { RAISE_TIGHT } from '@/engine/fast';
import { rate } from '@/engine/rating';
import type { Bill } from '@/engine/rating';
import type { StackRequest, StackResult } from '@/engine/types';
import { createRaiseKernel, EXACT_DEFAULTS } from '@/kernel/raise';
import { parseImport } from '@/share/exportImport';
import { buildStackRequest } from '@/state/derive';
import type { Profile } from '@/state/schema';
import { hiredLost } from '@/ui/sections/march/hired';
import { applyCounts } from '@/ui/sections/march/manual';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';
import { Report } from './harness';

const LIVE = process.env.PYRRHIC_TIMING_FIXTURE ?? 'pyrrhic-my-account-2026-10-11.json';
/** The starts tried: `restarts` is the default's 64 (65 attempts) and the two ends of the curve. */
const RESTARTS = [0, 3, 7, 15, 31, 63] as const;
const MODES = { authority: RAISE_TIGHT, dominance: RAISE_TIGHT } as const;

function countsOf(base: StackResult): Record<string, number> {
  const out: Record<string, number> = {};
  for (const stack of base.stacks) out[stack.unitId] = stack.count;
  return out;
}

describe.skipIf(!process.env.THEORY)('what the restarts buy', () => {
  it('prices the same wide boxes from one start to the default', () => {
    const module = loadKernelModule();
    const report = new Report('221-what-the-restarts-buy');
    report.add(
      [
        'Stops whose box is wider than a walk, priced at the identical cap, rank, seed and sweep limit, with',
        `only the number of seeded starts moved (\`EXACT_DEFAULTS.restarts\` is ${EXACT_DEFAULTS.restarts}).`,
        "**rating** is the owner's `rate(as is, ·, markerRates)`; **ms** is one call on a fresh kernel.",
        '',
        `| army · stop | space | ${RESTARTS.map((r) => `${r + 1} start${r === 0 ? '' : 's'}`).join(' | ')} |`,
        `|---|---:${RESTARTS.map(() => '---:').join('|')}|`,
      ].join('\n'),
    );
    report.add(`| | | ${RESTARTS.map(() => 'rating · ms').join(' | ')} |`);

    const scenarios = [...criteriaScenarios()];
    try {
      const parsed = parseImport(readFileSync(LIVE, 'utf8'));
      if (parsed.kind === 'profile') {
        const profile = parsed.payload as Profile;
        const setup = profile.setups.find((one) => one.id === profile.activeSetupId) ?? profile.setups[0];
        if (setup !== undefined) {
          scenarios.push({
            label: `the live account of 2026-10-11 (${profile.name})`,
            request: buildStackRequest(profile, setup),
          });
        }
      }
    } catch {
      report.add(`\n(\`${LIVE}\` was not readable.)`);
    }

    const ratio: number[] = RESTARTS.map(() => 0);
    let stops = 0;
    let differ = 0;
    for (const scenario of scenarios) {
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
        const request: StackRequest = scenario.request;
        const base = planMarch(request, stop.counts).result;
        const bill = (counts: Record<string, number>): Bill => {
          const { result, summary } = applyCounts(request, base, counts);
          return {
            damage: summary.minDamage,
            silver: summary.recovery.silver,
            gold: summary.recovery.gold,
            hired: hiredLost(result.stacks),
          };
        };
        const asIs = bill(countsOf(base));
        const cells: string[] = [];
        const ratings: number[] = [];
        const vectors: (Record<string, number> | null)[] = [];
        let wide = false;
        for (const restarts of RESTARTS) {
          const kernel = createRaiseKernel(module, { ...EXACT_DEFAULTS, restarts });
          const began = performance.now();
          const answer = kernel.position({ request, base, modes: MODES });
          const ms = performance.now() - began;
          if (answer === null) {
            cells.push('—');
            ratings.push(Number.NaN);
            vectors.push(null);
            continue;
          }
          if (answer.how === 'searched') wide = true;
          const rating = rate(asIs, bill({ ...countsOf(base), ...answer.counts }), CAMPAIGN.markerRates);
          ratings.push(rating);
          vectors.push(answer.counts);
          cells.push(`${rating.toFixed(3)} · ${ms.toFixed(0)}`);
        }
        if (!wide) continue;
        stops += 1;
        const space = answerSpace(module, request, base);
        const reference = vectors.at(-1) ?? null;
        // A rating that agrees to three decimals can still hide a moved count, so the whole vector is compared.
        const marks = vectors.map((one) => {
          if (one === null || reference === null) return '—';
          const same = Object.keys(new Set([...Object.keys(one), ...Object.keys(reference)])).every(
            (id) => (one[id] ?? 0) === (reference[id] ?? 0),
          );
          return same ? 'same' : '**diff**';
        });
        const best = ratings.at(-1) as number;
        for (let i = 0; i < ratings.length; i += 1)
          ratio[i] = (ratio[i] ?? 0) + (best - (ratings[i] as number));
        report.add(
          `| ${scenario.label} · ${stop.pick} | ${space} | ${cells.map((cell, i) => `${cell} ${marks[i]}`).join(' | ')} |`,
        );
        if (marks.some((mark) => mark === '**diff**')) differ += 1;
      }
    }
    report.add(
      [
        '',
        '## What the numbers say',
        `- **${stops} searched stops.** Each row reads across the starts; the first column is the caller's own`,
        '  vector alone — the climb the search is seeded with, which the default then improves on.',
        `- Rating given up against the default (Σ over stops): ${RESTARTS.map((r, i) => `${r + 1} starts → ${(ratio[i] ?? 0).toFixed(2)}`).join(' · ')}.`,
        `- Stops where a cheaper arm answered **different counts** than the default: **${differ}**.`,
      ].join('\n'),
    );
    report.save();
    expect(true).toBe(true);
  }, 1_800_000);
});

/** The box the default search saw, for the table's own space column (one cheap call, no restarts). */
function answerSpace(module: WebAssembly.Module, request: StackRequest, base: StackResult): string {
  const kernel = createRaiseKernel(module, { ...EXACT_DEFAULTS, restarts: 0 });
  const answer = kernel.position({ request, base, modes: MODES });
  return answer === null ? '—' : String(answer.space);
}
