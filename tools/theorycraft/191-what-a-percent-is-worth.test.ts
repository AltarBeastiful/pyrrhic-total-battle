/**
 * 191 — **what a percent is worth** (W17 C3, `docs/plans/progression-advisor.md` §4): the advisor's pass —
 * the baseline and the 29 generic probes (13 health, 13 strength, 3 housing), each a whole plan read on every
 * stop of the bar as the March shows it (Tight) — run over every benchmark army, through `runAdvisor` on one
 * lane (so wall and CPU are one thread's), with no clock in any job.
 *
 * Writes `tools/theorycraft/out/191-what-a-percent-is-worth.md`: per army the ranked probes (gain in `rate()`
 * and in % of the stop's damage, on the sweet spot), the flags (`noise`, `reorder`, `worse`) and the clamps
 * counted over every probe × stop, and the time of the pass.
 *
 * `THEORY=1 pnpm vitest run tools/theorycraft/191-what-a-percent-is-worth.test.ts`
 */
/// <reference types="node" />
import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { headlineOf, type AdvisorRow, type StopAdvice } from '../../src/engine/advisor';
import type { CampaignInput } from '../../src/engine/plan';
import { genericProbes } from '../../src/engine/probes';
import { runAdvisor } from '../../src/worker/advisor';
import { createInlineClient, type CalcClient } from '../../src/worker/client';
import { createCalcPool } from '../../src/worker/pool';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';

/** Inline clients that report a worker: the pool runs its lane(s) in this thread, as in `advisor.test.ts`. */
function lanes(): CalcClient {
  return { ...createInlineClient(), mode: 'worker' };
}

const f = (value: number, digits = 2): string =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

describe.skipIf(!process.env.THEORY)('191 — what a percent is worth', () => {
  it('reads the 29 generic probes on every benchmark army', async () => {
    const profile = ownerProfile();
    const scenarios = [...(profile ? ownerScenarios(profile) : []), ...commonScenarios()];
    const probes = genericProbes();
    const out: string[] = [];
    const summary: string[] = [];
    let anyClamped = 0;
    let anyHeadlineClamped = 0;
    const bestOf = new Map<string, { health: AdvisorRow; strength: AdvisorRow; housing: AdvisorRow }>();

    for (const scenario of scenarios) {
      const input: CampaignInput = {
        request: scenario.request,
        marchTarget: HORIZON,
        ...CAMPAIGN.planFixes,
        putBack: CAMPAIGN.putBack,
      };
      // The 20 000-dominance camp's Tight alone is a minute a bar (docs/plans §4): it runs under the real
      // 20 s clock and reports what was cut; the others run uncapped so every probe is read.
      const big = scenario.label.includes('20 000 dominance');
      const budgetMs = big ? CAMPAIGN.budgets.extra : 900_000;
      const pool = createCalcPool({ size: 1, createClient: lanes });
      const cpu0 = process.cpuUsage();
      const began = performance.now();
      let result;
      try {
        result = await runAdvisor(input, probes, pool, { budgetMs });
      } catch (error) {
        pool.dispose();
        const message = error instanceof Error ? error.message : String(error);
        summary.push(`| ${scenario.label} | — | — | — | — | — | refused: ${message} |`);
        out.push(`## ${scenario.label}\n\nThe advisor's baseline did not run: ${message}\n`);
        continue;
      }
      const wall = performance.now() - began;
      const cpu = process.cpuUsage(cpu0);
      pool.dispose();

      const rows = result.rows;
      const stopsOf = (row: AdvisorRow): StopAdvice[] => row.stops;
      const all = rows.flatMap(stopsOf);
      const noise = all.filter((s) => s.noise).length;
      const reorder = all.filter((s) => s.reorder).length;
      const worse = all.filter((s) => s.worse).length;
      const clamped = all.filter((s) => s.clamped).length;
      const noGain = all.filter((s) => s.from === null).length;
      const headlines = rows.map((row) => headlineOf(row));
      const headClamped = headlines.filter((s) => s?.clamped).length;
      anyClamped += clamped;
      anyHeadlineClamped += headClamped;
      const headNoise = headlines.filter((s) => s?.noise).length;
      const headReorder = headlines.filter((s) => s?.reorder).length;
      const headWorse = headlines.filter((s) => s?.worse).length;
      const family = (name: string): AdvisorRow | undefined => rows.find((row) => row.family === name);
      const health = family('health');
      const strength = family('strength');
      const housing = family('housing');
      if (health && strength && housing) bestOf.set(scenario.label, { health, strength, housing });

      summary.push(
        `| ${scenario.label} | ${result.baseline?.length ?? 0} | ${rows.length}/${probes.length} | ${f(wall, 0)} | ${f(
          (cpu.user + cpu.system) / 1000,
          0,
        )} | ${noise}/${reorder}/${worse} · ${headNoise}/${headReorder}/${headWorse} | ${clamped} (${headClamped}) |`,
      );

      out.push(`## ${scenario.label}\n`);
      out.push(
        `Baseline bar: ${result.baseline?.map((s) => s.pick).join(' · ') ?? 'cut'}. ${rows.length} of ${
          probes.length
        } probes read, ${result.cut.length} cut${big ? ` (clock ${budgetMs} ms)` : ''}, ${result.failed.length} failed. Pass: ${f(
          wall,
          0,
        )} ms wall, ${f((cpu.user + cpu.system) / 1000, 0)} ms CPU. Over all ${all.length} probe × stop readings: ${noise} noise, ${reorder} reorder, ${worse} worse, ${clamped} clamped, ${noGain} with no gain.\n`,
      );
      out.push(
        '| rank | probe | gain (rating) | damage % | read from | noise | reorder | worse | clamped |\n|---|---|---|---|---|---|---|---|---|',
      );
      rows.forEach((row, index) => {
        const s = headlineOf(row);
        if (s === undefined) return;
        out.push(
          `| ${index + 1} | ${row.id} | ${f(s.gain, 4)} | ${s.from === null ? '—' : `${s.damagePercent >= 0 ? '+' : ''}${f(s.damagePercent, 3)}`} | ${s.from ?? 'no gain'} | ${s.noise ? 'yes' : ''} | ${s.reorder ? 'yes' : ''} | ${s.worse ? 'yes' : ''} | ${s.clamped ? 'yes' : ''} |`,
        );
      });
      out.push('');
    }

    const head = [
      '---',
      'type: experiment',
      'title: "191 — what a percent is worth"',
      `created: ${new Date().toISOString().slice(0, 10)}`,
      'tags: [w17, advisor, probes]',
      'related: ["[[Progression-Advisor-Plan]]", "[[190-the-pool]]"]',
      '---',
      '',
      '# 191 — what a percent is worth',
      '',
      `The advisor's pass (\`runAdvisor\`, \`src/worker/advisor.ts\`): the baseline and the ${probes.length} generic probes of \`genericProbes()\` (+1 point on each of 13 health and 13 strength lines, +1 % of the pool on leadership, authority, dominance), each a whole plan read on every stop of the bar as the March shows it (Tight), ranked on the sweet spot. One lane in Node (wall and CPU are one thread's), no clock in any job. The armies are the benchmark's (${scenarios.length}).`,
      '',
      '## Summary',
      '',
      'Flags are counted over every probe × stop (headline stop only, after the dot), as noise/reorder/worse; clamped likewise.',
      '',
      '| army | stops | probes read | wall ms | CPU ms | noise/reorder/worse | clamped (sweet spot) |',
      '|---|---|---|---|---|---|---|',
      ...summary,
      '',
      `Probe × stop readings clamped to zero, all armies: **${anyClamped}** (**${anyHeadlineClamped}** on a sweet spot).`,
      '',
    ];
    writeFileSync(
      'tools/theorycraft/out/191-what-a-percent-is-worth.md',
      [...head, ...out].join('\n') + '\n',
    );
    expect(scenarios.length).toBeGreaterThan(0);
  }, 3_600_000);
});
