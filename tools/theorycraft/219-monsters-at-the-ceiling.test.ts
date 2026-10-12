/**
 * 219 — **can the monsters be taken out of the box?** (follows 216/217: the `Tight` box is multiplied out by
 * the **dominance** slots, which no cap touches, and the widest benchmark stop is 1.9 × 10²⁵ vectors over 19
 * monster slots — 39 s of the census's 48 s.)
 *
 * Experiment 217 swept each slot of those stops around the search's own answer and found the dominance counts
 * sitting at, or one or two units under, their **shelter ceiling** — the most a monster stack may field while
 * its total HP stays under the lowest troop stack. That is the shape the physics predicts: the ceiling is the
 * last kill position, and the last to fall strikes most.
 *
 * So this experiment prices the rule that follows: **hold every dominance stack at the shelter ceiling and
 * search only the mercenaries.** The kernel already answers it — `RAISE_TIGHT` on `authority` walks the mercs
 * under the plan's own burn cap, `RAISE_MOST` on `dominance` is not walked and is held at the units answer
 * (`raiseUnits`), which is exactly "every monster stack as high as the shelter allows, paid out of the spare
 * housing from the bottom of the kill order up". The box becomes the mercenaries' alone: on the 20 000 camp,
 * 1.9 × 10²⁵ → a few hundred vectors, walked, in milliseconds.
 *
 * Every stop that carries a dominance slot is priced three ways: **As is** (the plan's own counts), **A** the
 * shipped `Tight` (both pools), **B** the rule (mercs `Tight`, monsters `Most`), all through the app's own
 * replay and the owner's own rating (`CAMPAIGN.markerRates`).
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/219-monsters-at-the-ceiling.test.ts`
 */
/// <reference types="node" />
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign, planMarch } from '@/engine';
import { RAISE_MOST, RAISE_TIGHT } from '@/engine/fast';
import { rate } from '@/engine/rating';
import type { Bill } from '@/engine/rating';
import type { StackRequest, StackResult } from '@/engine/types';
import { createRaiseKernel } from '@/kernel/raise';
import { parseImport } from '@/share/exportImport';
import { buildStackRequest } from '@/state/derive';
import type { Profile } from '@/state/schema';
import { hiredLost } from '@/ui/sections/march/hired';
import { applyCounts } from '@/ui/sections/march/manual';
import { shelterCeiling, troopFloor } from '@/ui/sections/march/raise';

import { HORIZON, criteriaScenarios } from '../../tests/engine/plan-scenarios';
import { loadKernelModule } from '../../tests/kernel/load';
import { Report, n } from './harness';

const LIVE = process.env.PYRRHIC_TIMING_FIXTURE ?? 'pyrrhic-my-account-2026-10-11.json';
const MAX_SAFE = Number.MAX_SAFE_INTEGER;

function slotsOf(
  request: StackRequest,
  base: StackResult,
): { id: string; pool: string; from: number; to: number }[] {
  const floor = troopFloor(base);
  if (floor === null) return [];
  return base.stacks
    .filter((stack) => stack.count > 0 && (stack.pool === 'authority' || stack.pool === 'dominance'))
    .map((stack) => ({
      id: stack.unitId,
      pool: stack.pool,
      from: stack.count,
      to: Math.min(shelterCeiling(floor, stack.hpPerUnit), request.caps[stack.unitId] ?? MAX_SAFE),
    }))
    .filter((slot) => slot.to > slot.from);
}

function countsOf(base: StackResult): Record<string, number> {
  const out: Record<string, number> = {};
  for (const stack of base.stacks) out[stack.unitId] = stack.count;
  return out;
}

describe.skipIf(!process.env.THEORY)('the monsters at the ceiling', () => {
  it('prices the rule against the shipped search on every stop that has a monster slot', () => {
    const module = loadKernelModule();
    const report = new Report('219-monsters-at-the-ceiling');
    report.add(
      [
        "Only the stops whose march carries a **dominance** slot. Rating = the owner's `rate(as is, ·,`",
        '`markerRates)`; **A** is the shipped `Tight` (both pools searched), **B** is mercs `Tight` + monsters',
        '`Most`. **box A/B** is the space the kernel searched, **ms A/B** its wall.',
        '',
        '| army · stop | dom slots | A rating | B rating | A dmg | B dmg | box A | box B | ms A | ms B | winner |',
        '|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|',
      ].join('\n'),
    );
    const tally = {
      stops: 0,
      aWins: 0,
      bWins: 0,
      ties: 0,
      worseThanAsIs: 0,
      msA: 0,
      msB: 0,
      spaceA: 0,
      spaceB: 0,
    };
    const losses: string[] = [];

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
      report.add(`\n(\`${LIVE}\` was not readable; the live account is not in this census.)`);
    }

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
      } catch (error) {
        if (!(error instanceof Error) || !error.message.startsWith('planCampaign:')) throw error;
        continue;
      }
      for (const stop of plan.alternatives) {
        const request = scenario.request;
        const base = planMarch(request, stop.counts).result;
        const slots = slotsOf(request, base);
        const monsters = slots.filter((slot) => slot.pool === 'dominance');
        if (monsters.length === 0) continue;

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

        const priced = (modes: { authority: number; dominance: number }, runs: number) => {
          let answer = null as ReturnType<ReturnType<typeof createRaiseKernel>['position']>;
          let ms = Infinity;
          for (let run = 0; run < runs; run += 1) {
            const kernel = createRaiseKernel(module);
            const began = performance.now();
            answer = kernel.position({ request, base, modes });
            ms = Math.min(ms, performance.now() - began);
          }
          if (answer === null) return null;
          const counts = { ...countsOf(base), ...answer.counts };
          return { counts, how: answer.how, space: answer.space, ms, bill: bill(counts) };
        };

        const a = priced({ authority: RAISE_TIGHT, dominance: RAISE_TIGHT }, 1);
        const b = priced({ authority: RAISE_TIGHT, dominance: RAISE_MOST }, 1);
        if (a === null || b === null) continue;
        tally.stops += 1;
        const ra = rate(asIs, a.bill, CAMPAIGN.markerRates);
        const rb = rate(asIs, b.bill, CAMPAIGN.markerRates);
        tally.msA += a.ms;
        tally.msB += b.ms;
        tally.spaceA += a.space;
        tally.spaceB += b.space;
        const winner = Math.abs(ra - rb) < 1e-9 ? 'tie' : ra > rb ? 'A' : 'B';
        if (winner === 'A') tally.aWins += 1;
        else if (winner === 'B') tally.bWins += 1;
        else tally.ties += 1;
        if (rb < -1e-9) {
          tally.worseThanAsIs += 1;
          losses.push(`${scenario.label} · ${stop.pick}: B rates ${rb.toFixed(3)} against As is`);
        }
        report.add(
          `| ${scenario.label} · ${stop.pick} | ${monsters.length} | ${ra.toFixed(2)} | ${rb.toFixed(2)} | ${n(a.bill.damage)} | ${n(b.bill.damage)} | ${n(a.space)} | ${n(b.space)} | ${a.ms.toFixed(0)} | ${b.ms.toFixed(0)} | ${winner} |`,
        );
      }
    }

    report.add(
      [
        '',
        '## What the numbers say',
        `- **${tally.stops} stops with a dominance slot**: the shipped search (A) rates higher on **${tally.aWins}**,`,
        `  the rule (B) on **${tally.bWins}**, **${tally.ties}** tie.`,
        `- Σ search space ${n(tally.spaceA)} → ${n(tally.spaceB)} (the box the rule keeps); Σ wall ${tally.msA.toFixed(0)} ms → ${tally.msB.toFixed(0)} ms.`,
        `- B rates **below As is** on ${tally.worseThanAsIs} stops.`,
      ].join('\n'),
    );
    if (losses.length > 0) report.add(`\n\`\`\`\n${losses.join('\n')}\n\`\`\``);
    report.save();
    expect(tally.stops).toBeGreaterThan(0);
  }, 1_800_000);
});
