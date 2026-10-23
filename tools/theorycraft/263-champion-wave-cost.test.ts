/**
 * 263 — **what the hero champion's waves cost** (`docs/plans/the-hero-champion.md`, Speed: "kernel functions are created
 * when the measured cost asks"). The real pass (`runHeroChampion`) runs on the account on one inline worker with no
 * clock; every pool batch and every job in it is timed, and the wall clock of 15 workers is replayed from the job
 * durations (greedy list scheduling, jobs handed to the first free worker in order, as the pool does).
 *
 * Reported per wave: batches, jobs, the sum of job time, the replayed wall on `WORKERS` workers, and the idle share
 * of that wall (the tail where workers wait for the last job). Reported once: the main thread's own time (the
 * pass's wall minus the batches' wall: lineup totals, the champion's build, bookkeeping) against the plans'.
 * Whatever dominates is the kernel's next step; if the plans do, they already run in the kernel and the next lever
 * is fewer plans, not another port.
 *
 * `THEORY=1 [ACCOUNT=file] [WORKERS=15] pnpm vitest run tools/theorycraft/263-champion-wave-cost.test.ts`
 * Writes `tools/theorycraft/out/263-champion-wave-cost.md`.
 */
/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { parseImport } from '../../src/share/exportImport';
import { championRoster } from '../../src/state/heroChampionRoster';
import type { Profile } from '../../src/state/schema';
import { createInlineClient } from '../../src/worker/client';
import { runHeroChampion } from '../../src/worker/heroChampion';
import { createCalcPool, type PoolJob } from '../../src/worker/pool';

const OUT = 'tools/theorycraft/out/263-champion-wave-cost.md';
const NO_CLOCK = 1_000_000_000;
const FILE = process.env.ACCOUNT ?? 'pyrrhic-my-account-2026-10-11.json';
const WORKERS = Number(process.env.WORKERS ?? 15);
const f = (value: number, digits = 1): string => value.toFixed(digits);

/** Wall clock of `durations` handed in order to the first free of `workers`. */
function makespan(durations: readonly number[], workers: number): number {
  const free = Array.from({ length: Math.max(1, workers) }, () => 0);
  for (const duration of durations) {
    let at = 0;
    for (let i = 1; i < free.length; i += 1) if (free[i]! < free[at]!) at = i;
    free[at]! += duration;
  }
  return Math.max(0, ...free);
}

describe.skipIf(!process.env.THEORY)('263 — the champion pass, wave by wave', () => {
  it('times every batch and replays it on the owner machine', async () => {
    const parsed = parseImport(readFileSync(FILE, 'utf8'));
    if (parsed.kind !== 'profile') throw new Error('profile');
    const profile = structuredClone(parsed.payload) as Profile;
    const setup = profile.setups[0]!;
    const inner = createCalcPool({
      size: 1,
      createClient: () => ({ ...createInlineClient(), mode: 'worker' as const }),
    });
    // Every batch: the job durations, and the wave it belongs to (the count of waves drawn so far).
    const batches: { wave: number; wall: number; jobs: number[] }[] = [];
    let wave = 0;
    const timed: typeof inner = {
      get alive() {
        return inner.alive;
      },
      get busy() {
        return inner.busy;
      },
      dispose: () => inner.dispose(),
      map: async (jobs, options) => {
        const batch = { wave, wall: 0, jobs: [] as number[] };
        batches.push(batch);
        const began = performance.now();
        const wrapped = jobs.map(
          (job): PoolJob<never> =>
            (async (client: Parameters<PoolJob<never>>[0], signal: Parameters<PoolJob<never>>[1]) => {
              const at = performance.now();
              try {
                return await (job as unknown as PoolJob<never>)(client, signal);
              } finally {
                batch.jobs.push(performance.now() - at);
              }
            }) as PoolJob<never>,
        );
        try {
          return (await inner.map(wrapped as never, options as never)) as never;
        } finally {
          batch.wall = performance.now() - began;
          const sorted = [...batch.jobs].sort((x, y) => y - x);
          process.stderr.write(
            `[263] wave ${String(batch.wave + 1)}: ${String(batch.jobs.length)} jobs, ${f(batch.wall / 1000)} s, longest ${f((sorted[0] ?? 0) / 1000, 2)} s, median ${f((sorted[Math.floor(sorted.length / 2)] ?? 0) / 1000, 2)} s\n`,
          );
        }
      },
    };
    const lines = [
      '# 263 — what the hero champion’s waves cost',
      '',
      `Account ${FILE}, setup ${setup.name}; one inline worker, no clock; replayed on ${String(WORKERS)} workers.`,
      '',
    ];
    try {
      const roster = championRoster(profile, setup);
      const began = performance.now();
      const result = await runHeroChampion(roster, timed, {
        budgetMs: NO_CLOCK,
        onWave: () => {
          wave += 1;
        },
      });
      const wall = performance.now() - began;
      const batchWall = batches.reduce((sum, batch) => sum + batch.wall, 0);

      lines.push(
        '| draw | batches | jobs | job time s | wall 1 worker s | wall on workers s | idle share |',
        '| --- | ---: | ---: | ---: | ---: | ---: | ---: |',
      );
      let replayed = 0;
      for (let at = 0; at <= wave; at += 1) {
        const mine = batches.filter((batch) => batch.wave === at);
        if (mine.length === 0) continue;
        const jobTime = mine.reduce((sum, batch) => sum + batch.jobs.reduce((a, b) => a + b, 0), 0);
        const one = mine.reduce((sum, batch) => sum + batch.wall, 0);
        const many = mine.reduce((sum, batch) => sum + makespan(batch.jobs, WORKERS), 0);
        replayed += many;
        const idle = many === 0 ? 0 : 1 - jobTime / (many * WORKERS);
        lines.push(
          `| ${String(at + 1)} | ${String(mine.length)} | ${String(mine.reduce((s, b) => s + b.jobs.length, 0))} | ${f(jobTime / 1000)} | ${f(one / 1000)} | ${f(many / 1000)} | ${f(idle * 100, 0)} % |`,
        );
      }
      const jobsAll = batches.flatMap((batch) => batch.jobs);
      lines.push(
        '',
        `Pass wall on one worker ${f(wall / 1000)} s; batches ${f(batchWall / 1000)} s; main thread outside the batches ${f((wall - batchWall) / 1000, 2)} s (${f(((wall - batchWall) / wall) * 100, 2)} % of the pass).`,
        `Jobs ${String(jobsAll.length)}, mean ${f(jobsAll.reduce((a, b) => a + b, 0) / Math.max(1, jobsAll.length) / 1000, 2)} s, longest ${f(Math.max(0, ...jobsAll) / 1000, 2)} s.`,
        `Replayed wall on ${String(WORKERS)} workers: ${f(replayed / 1000)} s of the 150 s clock.`,
        `Cuts: ${result.cuts.length === 0 ? 'none' : result.cuts.join('; ')}.`,
      );
      // One batch's worth of workers idling at the tail: the same jobs in one batch against several.
      const sequentialTail = batches.reduce((sum, batch) => sum + makespan(batch.jobs, WORKERS), 0);
      const pooled = makespan(
        batches.flatMap((batch) => batch.jobs),
        WORKERS,
      );
      lines.push(
        `Batch-by-batch wall ${f(sequentialTail / 1000)} s against every job in one batch ${f(pooled / 1000)} s (the most batching could still save).`,
      );
      expect(result.champion.champion).not.toBeNull();
    } finally {
      inner.dispose();
      writeFileSync(OUT, `${lines.join('\n')}\n`);
    }
  }, 3_600_000);
});
