/**
 * 210 — **the planner garbage A/B** (W22 step 4): `planCampaign` alone, in-process, probes' settings (no clock),
 * release kernel, on the timing fixture. The old arm is `src/engine/plan.old.ts`, a copy of `plan.ts` as it stood
 * before the step (`cp src/engine/plan.ts src/engine/plan.old.ts`, then edit `plan.ts`; delete the copy after), the
 * new arm `plan.ts`; interleaved round by round, the arm that goes first alternating. Answers are held equal arm
 * to arm. Reports the median CPU, wall and GC pause ms of a plan per arm, the figures to keep a step by (≥ 2 % of
 * the planner). `AB_LABEL` names the step in the report file.
 * `THEORY=1 AB_LABEL=loops pnpm vitest run tools/theorycraft/210-the-planner-garbage-ab.test.ts`
 * (`AB_ROUNDS` rounds, default 30; the account is `PYRRHIC_TIMING_FIXTURE`, default
 * `pyrrhic-my-account-2026-10-11.json` at the repo root).
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { PerformanceObserver } from 'node:perf_hooks';
import { describe, expect, it } from 'vitest';

import type { CampaignInput } from '../../src/engine';
import { planCampaign as planNew } from '../../src/engine/plan';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';

const ACCOUNT = process.env.PYRRHIC_TIMING_FIXTURE ?? 'pyrrhic-my-account-2026-10-11.json';
const ROUNDS = Number(process.env.AB_ROUNDS ?? 30);
const OLD_MODULE = '../../src/engine/plan.old'; // a variable, so the type-check does not need the copy
const LABEL = process.env.AB_LABEL ?? 'step';
const OUT = `tools/theorycraft/out/210-planner-garbage-ab-${LABEL}.md`;

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
};

describe.skipIf(!process.env.THEORY || !existsSync(ACCOUNT))('210 — the planner garbage A/B', () => {
  it(
    'plans with the step off and on, interleaved',
    async () => {
      const planOld = ((await import(/* @vite-ignore */ OLD_MODULE)) as { planCampaign: typeof planNew })
        .planCampaign;
      const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
      if (parsed.kind !== 'profile') throw new Error('the timing fixture is not a profile');
      const profile = parsed.payload;
      const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
      if (setup === undefined) throw new Error('no active setup');
      const input: CampaignInput = { ...buildPlanRequest(profile, setup) };
      delete input.budgetMs;
      delete input.shouldStop;

      let gcMs = 0;
      let gcCount = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          gcMs += entry.duration;
          gcCount += 1;
        }
      });
      observer.observe({ entryTypes: ['gc'] });
      const run = (on: boolean): { cpu: number; wall: number; gc: number; answer: string } => {
        const cpu0 = process.cpuUsage();
        const wall0 = performance.now();
        const answer = JSON.stringify((on && !process.env.AB_AA ? planNew : planOld)(input).alternatives.map((row) => row.counts));
        const wall = performance.now() - wall0;
        const used = process.cpuUsage(cpu0);
        return { cpu: (used.user + used.system) / 1000, wall, gc: 0, answer };
      };
      const reference = run(false).answer;
      run(true);
      await new Promise((resolve) => setTimeout(resolve, 30));
      gcMs = 0;
      gcCount = 0;
      const arms: Record<'new' | 'old', { cpu: number[]; wall: number[]; gc: number[]; pauses: number[] }> = {
        new: { cpu: [], wall: [], gc: [], pauses: [] },
        old: { cpu: [], wall: [], gc: [], pauses: [] },
      };
      try {
        for (let i = 0; i < ROUNDS; i += 1) {
          const order: ('new' | 'old')[] = i % 2 === 0 ? ['new', 'old'] : ['old', 'new'];
          for (const arm of order) {
            const one = run(arm === 'new');
            expect(one.answer, `${arm} arm moved an answer`).toBe(reference);
            arms[arm].cpu.push(one.cpu);
            arms[arm].wall.push(one.wall);
            // GC entries reach the observer a tick later: read them before the next arm starts.
            await new Promise((resolve) => setTimeout(resolve, 30));
            arms[arm].gc.push(gcMs);
            arms[arm].pauses.push(gcCount);
            gcMs = 0;
            gcCount = 0;
          }
        }
      } finally {
        observer.disconnect();
      }
      const quartile = (values: number[]): number =>
        [...values].sort((a, b) => a - b)[Math.floor(values.length / 4)] as number;
      const gain = (key: 'cpu' | 'wall' | 'gc' | 'pauses', stat = median): string =>
        (100 * (1 - stat(arms.new[key]) / stat(arms.old[key]))).toFixed(1);
      const row = (arm: 'new' | 'old'): string =>
        `| ${arm} | ${median(arms[arm].cpu).toFixed(1)} | ${median(arms[arm].wall).toFixed(1)} (q1 ${quartile(arms[arm].wall).toFixed(1)}) | ${median(arms[arm].gc).toFixed(1)} | ${median(arms[arm].pauses).toFixed(1)} |`;
      const out = [
        `# 210 — the planner garbage A/B: ${LABEL}\n`,
        `W22 step 4. ${new Date().toISOString().slice(0, 10)}, node ${process.version}: \`planCampaign\` alone on \`${ACCOUNT}\`, ${String(ROUNDS)} rounds per arm, interleaved, release kernel; old = \`plan.old.ts\`.\n`,
        '| arm | median CPU ms | median wall ms | median GC ms | median GC pauses |',
        '|---|---:|---:|---:|---:|',
        row('new'),
        row('old'),
        `\nMedian gain: CPU **${gain('cpu')} %**, wall ${gain('wall')} % (first quartile ${gain('wall', quartile)} %), GC time ${gain('gc')} %, GC pauses ${gain('pauses')} %.\n`,
      ].join('\n');
      writeFileSync(OUT, out);
      // eslint-disable-next-line no-console -- the experiment's own report
      console.log(out);
    },
    60 * 60_000,
  );
});
