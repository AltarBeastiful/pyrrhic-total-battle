/**
 * 212 — **the retype climb A/B** (W22 step 5): `planCampaign` alone, in-process, probes' settings (no clock),
 * release kernel, timing fixture. The old arm declines the `retypeClimb` door (the TypeScript climb of
 * `retypeMarch`, every other door the kernel's), the new arm has it; interleaved, the arm that goes first
 * alternating, answers held equal. Reports median CPU and wall ms of a plan per arm (keep at ≥ 2 % of the planner).
 * `THEORY=1 pnpm vitest run tools/theorycraft/212-the-retype-climb-ab.test.ts` (`AB_ROUNDS`, default 30;
 * `PYRRHIC_TIMING_FIXTURE`, default `pyrrhic-my-account-2026-10-11.json`).
 */
/// <reference types="node" />
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import type { CampaignInput } from '../../src/engine';
import { requiredPlanKernel, setKernel } from '../../src/engine/fast';
import { planCampaign } from '../../src/engine/plan';
import { parseImport } from '../../src/share/exportImport';
import { buildPlanRequest } from '../../src/state/derive';

const ACCOUNT = process.env.PYRRHIC_TIMING_FIXTURE ?? 'pyrrhic-my-account-2026-10-11.json';
const ROUNDS = Number(process.env.AB_ROUNDS ?? 30);
const OUT = 'tools/theorycraft/out/212-the-retype-climb-ab.md';

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
};
const quartile = (values: number[]): number =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 4)] as number;

describe.skipIf(!process.env.THEORY || !existsSync(ACCOUNT))('212 — the retype climb A/B', () => {
  it(
    'plans with the door off and on, interleaved',
    () => {
      const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
      if (parsed.kind !== 'profile') throw new Error('the timing fixture is not a profile');
      const profile = parsed.payload;
      const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
      if (setup === undefined) throw new Error('no active setup');
      const input: CampaignInput = { ...buildPlanRequest(profile, setup) };
      delete input.budgetMs;
      delete input.shouldStop;
      const real = requiredPlanKernel();
      const without = { ...real, retypeClimb: () => null };
      const run = (on: boolean): { cpu: number; wall: number; answer: string } => {
        setKernel(on ? real : without);
        const cpu0 = process.cpuUsage();
        const wall0 = performance.now();
        const answer = JSON.stringify(planCampaign(input).alternatives.map((row) => row.counts));
        const wall = performance.now() - wall0;
        const used = process.cpuUsage(cpu0);
        return { cpu: (used.user + used.system) / 1000, wall, answer };
      };
      const arms: Record<'new' | 'old', { cpu: number[]; wall: number[] }> = {
        new: { cpu: [], wall: [] },
        old: { cpu: [], wall: [] },
      };
      try {
        const reference = run(false).answer;
        run(true);
        for (let i = 0; i < ROUNDS; i += 1) {
          for (const arm of i % 2 === 0 ? (['new', 'old'] as const) : (['old', 'new'] as const)) {
            const one = run(arm === 'new');
            expect(one.answer, `${arm} arm moved an answer`).toBe(reference);
            arms[arm].cpu.push(one.cpu);
            arms[arm].wall.push(one.wall);
          }
        }
      } finally {
        setKernel(real);
      }
      const gain = (key: 'cpu' | 'wall', stat = median): string =>
        (100 * (1 - stat(arms.new[key]) / stat(arms.old[key]))).toFixed(1);
      const row = (arm: 'new' | 'old'): string =>
        `| ${arm} | ${median(arms[arm].cpu).toFixed(1)} | ${median(arms[arm].wall).toFixed(1)} (q1 ${quartile(arms[arm].wall).toFixed(1)}) |`;
      const out = [
        '# 212 — the retype climb A/B\n',
        `W22 step 5. ${new Date().toISOString().slice(0, 10)}, node ${process.version}: \`planCampaign\` alone on \`${ACCOUNT}\`, ${String(ROUNDS)} rounds per arm, interleaved, release kernel; old = the \`retypeClimb\` door declined.\n`,
        '| arm | median CPU ms | median wall ms |',
        '|---|---:|---:|',
        row('new'),
        row('old'),
        `\nMedian gain: CPU **${gain('cpu')} %**, wall **${gain('wall')} %** (first quartile ${gain('wall', quartile)} %).\n`,
      ].join('\n');
      writeFileSync(OUT, out);
      // eslint-disable-next-line no-console -- the experiment's own report
      console.log(out);
    },
    60 * 60_000,
  );
});
