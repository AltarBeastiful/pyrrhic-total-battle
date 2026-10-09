/**
 * 194 — **the other questions** (W17 step D, `docs/plans/advisor-step-d.md`): the dominance sweep, the next
 * troop tier, more merc stock, the horizon and the value of silver, each run as `CampaignProbe`s through
 * `runAdvisor` over every benchmark army, on one lane (wall and CPU are one thread's) with no clock in any job
 * (the 20 000-dominance camp runs under the real 20 s clock and reports what was cut).
 *
 * Per question and army: the measured gains (headline = the sweet spot, `headlineOf`), the cost of the pass in
 * wall and CPU ms, and, summed with the 29 generic probes' own pass, whether it fits `CAMPAIGN.budgets.extra`
 * or needs its own button. Display only: nothing here changes a constant.
 *
 * Writes `tools/theorycraft/out/194-the-other-questions.md`.
 * `THEORY=1 pnpm vitest run tools/theorycraft/194-the-other-questions.test.ts`
 */
/// <reference types="node" />
import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { getUnits, type UnitDef } from '../../src/data';
import { headlineOf, type AdvisorRow } from '../../src/engine/advisor';
import {
  curveOfRows,
  horizonProbes,
  housingSweep,
  mercStockProbes,
  nextTierProbes,
  silverProbes,
  type CampaignProbe,
  type TierUnlock,
} from '../../src/engine/advisor-sweeps';
import type { CampaignInput } from '../../src/engine/plan';
import { genericProbes } from '../../src/engine/probes';
import { runAdvisor, type AdvisorResult } from '../../src/worker/advisor';
import { createInlineClient, type CalcClient } from '../../src/worker/client';
import { createCalcPool } from '../../src/worker/pool';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';

const OUT = 'tools/theorycraft/out/194-the-other-questions.md';
const SWEEP = CAMPAIGN.advisorSweep;

function lanes(): CalcClient {
  return { ...createInlineClient(), mode: 'worker' };
}

const f = (value: number, digits = 2): string =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
const cpuMs = (usage: NodeJS.CpuUsage): number => (usage.user + usage.system) / 1000;

/** The troops one tier above what the request fields, per kind and group (no unit is invented: the data's own). */
function unlocksOf(input: CampaignInput): TierUnlock[] {
  const all = getUnits();
  const have = input.request.units;
  const keys = new Set(
    have.filter((unit) => unit.kind !== 'mercenary').map((unit) => `${unit.kind}:${unit.group ?? ''}`),
  );
  const out: TierUnlock[] = [];
  for (const key of keys) {
    const mine = have.filter((unit) => `${unit.kind}:${unit.group ?? ''}` === key);
    const top = Math.max(...mine.map((unit) => unit.tier));
    const next: UnitDef[] = all.filter(
      (unit) => `${unit.kind}:${unit.group ?? ''}` === key && unit.tier === top + 1,
    );
    if (next.length > 0) out.push({ label: `${key.replace(':', ' ')} tier ${String(top + 1)}`, units: next });
  }
  return out;
}

interface Timed {
  result: AdvisorResult | null;
  wall: number;
  cpu: number;
  message?: string;
}

async function pass(
  input: CampaignInput,
  probes: readonly CampaignProbe[],
  budgetMs: number,
): Promise<Timed> {
  const pool = createCalcPool({ size: 1, createClient: lanes });
  const cpu0 = process.cpuUsage();
  const began = performance.now();
  try {
    const result = await runAdvisor(input, probes, pool, { budgetMs });
    return { result, wall: performance.now() - began, cpu: cpuMs(process.cpuUsage(cpu0)) };
  } catch (error) {
    return {
      result: null,
      wall: performance.now() - began,
      cpu: cpuMs(process.cpuUsage(cpu0)),
      message: error instanceof Error ? error.message : String(error),
    };
  } finally {
    pool.dispose();
  }
}

const gainOf = (row: AdvisorRow | undefined): string => {
  const stop = row === undefined ? undefined : headlineOf(row);
  if (stop === undefined) return 'cut';
  return stop.from === null ? 'no gain' : `+${f(stop.damagePercent, 3)} %`;
};

describe.skipIf(!process.env.THEORY)('194 — the other questions', () => {
  it('measures the five questions on every benchmark army', async () => {
    const profile = ownerProfile();
    const scenarios = [...(profile ? ownerScenarios(profile) : []), ...commonScenarios()];
    const sections: string[] = [];
    const summary: string[] = [];
    const totals = { sweep: 0, tier: 0, merc: 0, horizon: 0, silver: 0, generic: 0 };
    const counts = { sweep: 0, tier: 0, merc: 0, horizon: 0, silver: 0 };
    let both = 0;
    let armies = 0;

    for (const scenario of scenarios) {
      const input: CampaignInput = {
        request: scenario.request,
        marchTarget: HORIZON,
        ...CAMPAIGN.planFixes,
        putBack: CAMPAIGN.putBack,
      };
      const big = scenario.label.includes('20 000 dominance');
      const budgetMs = big ? CAMPAIGN.budgets.extra : 900_000;

      // The baseline alone first: its bill is the unit of the silver probe, and its bar is the horizon's.
      const base = await pass(input, [], budgetMs);
      if (base.result === null || base.result.baseline === null) {
        summary.push(`| ${scenario.label} | — | — | — | — | — | — | refused: ${base.message ?? 'cut'} |`);
        sections.push(`## ${scenario.label}\n\nThe baseline did not run: ${base.message ?? 'cut'}.\n`);
        continue;
      }
      armies += 1;
      const sweet =
        base.result.baseline.find((stop) => stop.pick === 'sweet-spot') ?? base.result.baseline[0];
      const bill = (sweet?.march.bill.silver ?? 0) * HORIZON;

      const sweepProbes = [...housingSweep('dominance'), ...housingSweep('leadership')];
      const questions: { name: keyof typeof counts; probes: CampaignProbe[] }[] = [
        { name: 'sweep', probes: sweepProbes },
        { name: 'tier', probes: nextTierProbes(unlocksOf(input)) },
        { name: 'merc', probes: mercStockProbes(input.request.caps) },
        { name: 'horizon', probes: horizonProbes() },
        { name: 'silver', probes: silverProbes(input, bill) },
      ];
      const generic = await pass(input, genericProbes() as never, budgetMs);
      totals.generic += generic.wall;

      const out: string[] = [`## ${scenario.label}\n`];
      out.push(
        `Baseline bar: ${base.result.baseline.map((s) => s.pick).join(' · ')}; baseline pass ${f(base.wall, 0)} ms wall. The 29 generic probes: ${f(generic.wall, 0)} ms wall, ${f(generic.cpu, 0)} ms CPU.\n`,
      );
      const cells: string[] = [];
      let together = generic.wall;
      for (const question of questions) {
        if (question.probes.length === 0) {
          cells.push('—');
          continue;
        }
        const run = await pass(input, question.probes, budgetMs);
        if (run.result === null) {
          cells.push('refused');
          continue;
        }
        // The pass includes the baseline plan (a job of its own), so its cost net of that is the probes'.
        const net = Math.max(0, run.wall - base.wall);
        totals[question.name] += net;
        counts[question.name] += 1;
        together += net;
        cells.push(
          `${f(net, 0)} (${run.result.rows.length}/${question.probes.length}${run.result.cut.length > 0 ? `, ${run.result.cut.length} cut` : ''})`,
        );
        out.push(`### ${question.name}\n`);
        out.push(
          '| probe | headline gain on the sweet spot | read from | noise | worse |\n|---|---|---|---|---|',
        );
        for (const probe of question.probes) {
          const row = run.result.rows.find((one) => one.id === probe.id);
          const stop = row === undefined ? undefined : headlineOf(row);
          out.push(
            `| ${probe.label}${probe.mercAdded === undefined ? '' : ` (${String(probe.mercAdded)} merc)`} | ${gainOf(row)} | ${stop?.from ?? '—'} | ${stop?.noise ? 'yes' : ''} | ${stop?.worse ? 'yes' : ''} |`,
          );
        }
        if (question.name === 'sweep') {
          for (const pool of ['dominance', 'leadership'] as const) {
            const steps = SWEEP.dominanceSteps;
            const rows = run.result.rows.filter((row) => row.id.startsWith(`sweep:${pool}:`));
            const curve = curveOfRows(rows, steps);
            out.push(
              `\nPeak of the ${pool} sweep (flatten below ${String(SWEEP.flattenBelow)} per pool-percent): ${curve.peakPercent === null ? 'still climbing at +' + String(steps[steps.length - 1]) + ' %' : `+${String(curve.peakPercent)} %`}; ${curve.monotone ? 'monotone' : 'not monotone (flagged)'}.`,
            );
          }
        }
        out.push('');
      }
      if (together > CAMPAIGN.budgets.extra) both += 1;
      summary.push(
        `| ${scenario.label} | ${f(generic.wall, 0)} | ${cells.join(' | ')} | ${f(together / 1000, 1)} s${together > CAMPAIGN.budgets.extra ? ' over' : ''} |`,
      );
      sections.push(out.join('\n'));
    }

    const mean = (name: keyof typeof counts): string =>
      counts[name] === 0 ? '—' : f(totals[name] / counts[name], 0);
    const head = [
      '---',
      'type: experiment',
      'title: "194 — the other questions"',
      `created: ${new Date().toLocaleDateString('sv-SE')}`,
      'tags: [w17, advisor, sweeps]',
      'related: ["[[Progression-Advisor-Plan]]", "[[advisor-step-d]]", "[[191-what-a-percent-is-worth]]"]',
      '---',
      '',
      '# 194 — the other questions',
      '',
      `Design: \`docs/plans/advisor-step-d.md\`; plan: \`docs/plans/progression-advisor.md\` §5. The five questions of step D (\`src/engine/advisor-sweeps.ts\`) run through \`runAdvisor\` over ${armies} benchmark armies on one lane in Node, no clock in any job (the 20 000-dominance camp runs under the 20 s clock). A question's cost is its pass's wall ms net of the baseline plan the pass also runs; "(read/asked)" is the probes read of those asked. "Together" is the generic 29 probes plus the five questions, against \`CAMPAIGN.budgets.extra\` = ${String(CAMPAIGN.budgets.extra)} ms. Next-tier unlocks are built here from the data tables (the units one tier above what each kind and group fields); the app has no such derivation yet.`,
      '',
      '## Cost',
      '',
      `Mean net wall ms per army, over the armies where the question applies: dominance and leadership sweep ${mean('sweep')} (${String(counts.sweep)} armies), next tier ${mean('tier')} (${String(counts.tier)}), merc stock ${mean('merc')} (${String(counts.merc)}), horizon ${mean('horizon')} (${String(counts.horizon)}), silver ${mean('silver')} (${String(counts.silver)}); the generic 29 probes ${f(totals.generic / Math.max(1, armies), 0)}. Armies where generic + all five exceed the budget on one lane: **${String(both)} of ${String(armies)}**.`,
      '',
      '| army | generic 29 ms | sweep ms | next tier ms | merc stock ms | horizon ms | silver ms | together |',
      '|---|---|---|---|---|---|---|---|',
      ...summary,
      '',
    ];
    writeFileSync(OUT, [...head, ...sections].join('\n') + '\n');
    expect(scenarios.length).toBeGreaterThan(0);
  }, 7_200_000);
});
