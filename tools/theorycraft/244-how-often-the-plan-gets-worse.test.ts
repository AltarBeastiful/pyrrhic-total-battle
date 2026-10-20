/**
 * 244 — **how often the advisor's re-plan comes out worse** (owner, 2026-10-20: "the plan gets worse here:
 * search issue (re-planned 19M)"). The default pass (`runAdvisor` over `genericProbes()`) on every benchmark
 * army, counting the stops whose re-planned reading rates below the current one (`StopAdvice.worse`), and on
 * how many of them the re-priced reading still covers the miss. Run at two commits to see what the rated
 * stops (954fb77) moved. One lane, no clock, as in 191/192.
 *
 * `THEORY=1 OUT=<path> pnpm vitest run tools/theorycraft/244-how-often-the-plan-gets-worse.test.ts`
 */
/// <reference types="node" />
import { writeFileSync } from 'node:fs';
import { describe, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { headlineOf } from '../../src/engine/advisor';
import { genericProbes } from '../../src/engine/probes';
import { runAdvisor } from '../../src/worker/advisor';
import { createInlineClient, type CalcClient } from '../../src/worker/client';
import { createCalcPool } from '../../src/worker/pool';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../../tests/engine/plan-scenarios';

const OUT = process.env.OUT ?? 'tools/theorycraft/out/244-how-often-the-plan-gets-worse.md';
const lanes = (): CalcClient => ({ ...createInlineClient(), mode: 'worker' });

describe.skipIf(!process.env.THEORY)('244 — how often the plan gets worse', () => {
  it('counts worse stops on the default pass', async () => {
    const profile = ownerProfile();
    const lines: string[] = [
      '| army | probes | stops | worse stops | worse headlines | worst re-plan vs current damage | covered by re-price |',
      '|---|---|---|---|---|---|---|',
    ];
    let stopsAll = 0;
    let worseAll = 0;
    let headAll = 0;
    const detail: string[] = [];
    for (const scenario of [...(profile ? ownerScenarios(profile) : []), ...commonScenarios()]) {
      if (scenario.label.includes('20 000 dominance')) continue;
      const input = {
        request: scenario.request,
        marchTarget: HORIZON,
        ...CAMPAIGN.planFixes,
        putBack: CAMPAIGN.putBack,
      };
      const pool = createCalcPool({ size: 1, createClient: lanes });
      let result;
      try {
        result = await runAdvisor(input, genericProbes(), pool, { budgetMs: 900_000 });
      } catch (error) {
        pool.dispose();
        lines.push(`| ${scenario.label} | refused: ${String(error)} | | | | | |`);
        continue;
      }
      pool.dispose();
      let stops = 0;
      let worse = 0;
      let heads = 0;
      let covered = 0;
      let worst = 0;
      for (const row of result.rows) {
        const head = headlineOf(row);
        for (const stop of row.stops) {
          stops += 1;
          if (!stop.worse || stop.replanned === null) continue;
          worse += 1;
          if (stop === head) heads += 1;
          if (stop.repricedRating >= 0) covered += 1;
          const drop = (stop.replanned.bill.damage / stop.current.bill.damage - 1) * 100;
          worst = Math.min(worst, drop);
          detail.push(
            `${scenario.label} | ${row.id} | ${String(stop.pick)} | ${stop.current.bill.damage} -> ${stop.replanned.bill.damage} (${drop.toFixed(2)} %)${stop === head ? ' HEADLINE' : ''}`,
          );
        }
      }
      stopsAll += stops;
      worseAll += worse;
      headAll += heads;
      lines.push(
        `| ${scenario.label} | ${String(result.rows.length)} | ${String(stops)} | ${String(worse)} | ${String(heads)} | ${worst.toFixed(2)} % | ${String(covered)}/${String(worse)} |`,
      );
    }
    lines.push(`| **total** | | ${String(stopsAll)} | ${String(worseAll)} | ${String(headAll)} | | |`);
    writeFileSync(OUT, `${lines.join('\n')}\n\n## Every worse stop\n\n${detail.join('\n')}\n`);
  }, 3_600_000);
});
