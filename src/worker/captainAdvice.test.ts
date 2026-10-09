/**
 * W17 C5a — **the captain advice pass** (`runCaptainAdvice` in `captainAdvice.ts`), on the kernel: the current
 * trio's plan, the screen, and the shortlist planned in full on the pool, with no clock in any job.
 */
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import { getUnits } from '@/data';
import { emptyTotals, planCampaign } from '@/engine';
import type { ScreenTrio } from '@/engine/captains';
import type { CampaignInput } from '@/engine/plan';
import type { BonusTotals, StackRequest } from '@/engine/types';

import { runCaptainAdvice } from './captainAdvice';
import { abortError, createInlineClient, type CalcClient } from './client';
import { createCalcPool } from './pool';
import type { ProbeInput } from './protocol';

const TIMEOUT = 120_000;

/** The planner's small army (`advisor.test.ts`): four troop types and three hired soldiers with a stock. */
function request(): StackRequest {
  const all = getUnits();
  const troops = all.filter((unit) => unit.pool === 'leadership' && unit.tier <= 3).slice(0, 4);
  const mercs = all.filter((unit) => unit.pool === 'authority' && unit.health <= 20_000).slice(0, 3);
  const caps: Record<string, number> = {};
  for (const merc of mercs) caps[merc.id] = 30;
  return {
    units: [...troops, ...mercs],
    caps,
    housing: { leadership: 4_000, authority: 2_000, dominance: 0 },
    totals: withArmy(20),
    options: { method: 'elite', strictMercsAboveMonsters: false, monstersLast: false, roundTo10: false },
    enemy: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
    activeEvents: [],
    recovery: { templeLevel: 0, trainingCostReduction: {}, trainingSpeed: {}, plan: { mode: 'retrain' } },
  };
}

/** Totals with `points` more on the army line, health and strength: a captain every unit of the army reads. */
function withArmy(points: number): BonusTotals {
  const totals = emptyTotals();
  totals.health.army = points;
  totals.strength.army = points;
  return totals;
}

function campaign(): CampaignInput {
  return {
    request: request(),
    marchTarget: CAMPAIGN.marches,
    ...CAMPAIGN.planFixes,
    putBack: CAMPAIGN.putBack,
  };
}

const trios: ScreenTrio[] = [
  { key: 'now', totals: withArmy(20) },
  { key: 'weaker', totals: withArmy(0) },
  { key: 'better', totals: withArmy(120) },
  { key: 'best', totals: withArmy(400) },
];

/** Inline clients that report a worker, so the pool really runs `size` lanes; `wrap` can replace calls. */
function poolOf(size: number, wrap?: (client: CalcClient) => Partial<CalcClient>) {
  return createCalcPool({
    size,
    createClient: (): CalcClient => {
      const inline = createInlineClient();
      return { ...inline, mode: 'worker', ...wrap?.(inline) };
    },
  });
}

/** A job that never answers and stops when the pass aborts it, as a worker does on a cut. */
function hang<T>(signal?: AbortSignal): Promise<T> {
  return new Promise<T>((_, reject) => {
    signal?.addEventListener('abort', () => reject(abortError()), { once: true });
  });
}

describe('runCaptainAdvice: the pass over the pool', () => {
  test(
    'the current trio is always there, no trio reads as a loss, and a stronger trio wins every stop',
    async () => {
      const pool = poolOf(2);
      const progress: [number, number][] = [];
      const result = await runCaptainAdvice({ ...campaign(), budgetMs: 1 }, trios, 'now', pool, {
        onProgress: (done, total) => progress.push([done, total]),
      });
      pool.dispose();

      expect(result.currentKey).toBe('now');
      expect(result.baseline?.map((stop) => stop.pick)).toEqual(
        planCampaign(campaign()).alternatives.map((row) => row.pick),
      );
      expect(result.screenCut).toBe(false);
      expect(result.screens.map((screen) => screen.key)).toEqual(trios.map((trio) => trio.key));
      expect(result.confirmed.sort()).toEqual(['best', 'better', 'weaker']);
      expect(result.confirmed).not.toContain('now');
      expect(result.cut).toEqual([]);
      expect(result.failed).toEqual([]);
      expect(result.rows.map((row) => row.id)).toEqual(result.confirmed);
      for (const row of result.rows)
        for (const stop of row.stops) expect(stop.gain).toBeGreaterThanOrEqual(0);
      // One answer per stop of the bar, never below the current trio, and the 400-point trio gains on each.
      expect(result.best.map((stop) => stop.pick)).toEqual(result.baseline?.map((stop) => stop.pick));
      for (const stop of result.best) {
        expect(stop.gain).toBeGreaterThanOrEqual(0);
        expect(stop.trio).toBe('best');
        expect(stop.gain).toBeGreaterThan(0);
        expect(stop.advice?.gain).toBe(stop.gain);
      }
      expect(progress).toEqual([1, 2, 3, 4, 5].map((done) => [done, 5]));
    },
    TIMEOUT,
  );

  test(
    'with nothing better, the answer is the current trio on every stop and a gain of 0',
    async () => {
      const pool = poolOf(1);
      const result = await runCaptainAdvice(campaign(), [trios[0]!, trios[1]!], 'now', pool);
      pool.dispose();
      expect(result.confirmed).toEqual(['weaker']);
      expect(result.best.length).toBeGreaterThan(0);
      for (const stop of result.best) expect(stop).toMatchObject({ trio: 'now', gain: 0, advice: null });
    },
    TIMEOUT,
  );

  test(
    'a lone trio is planned and screened and has nobody to confirm',
    async () => {
      const pool = poolOf(1);
      const result = await runCaptainAdvice(campaign(), [trios[0]!], 'now', pool);
      pool.dispose();
      expect(result.confirmed).toEqual([]);
      expect(result.rows).toEqual([]);
      expect(result.best.every((stop) => stop.trio === 'now' && stop.gain === 0)).toBe(true);
    },
    TIMEOUT,
  );

  test(
    'the confirm count caps the plans, and no job carries a clock',
    async () => {
      const sent: ProbeInput[] = [];
      const pool = poolOf(2, (inline) => ({
        probe: (input, signal) => {
          sent.push(input);
          return inline.probe(input, signal);
        },
      }));
      const result = await runCaptainAdvice({ ...campaign(), budgetMs: 1 }, trios, 'now', pool, {
        confirm: 1,
      });
      pool.dispose();
      expect(result.confirmed).toHaveLength(1);
      expect(sent).toHaveLength(2);
      expect(sent[0]?.against).toBeUndefined();
      for (const job of sent) {
        expect(job.plan.budgetMs).toBeUndefined();
        expect(job.plan.shouldStop).toBeUndefined();
      }
      expect(sent[1]?.against?.probe.id).toBe(result.confirmed[0]);
      expect(sent[1]?.plan.request.totals).toEqual(trios.find((t) => t.key === result.confirmed[0])?.totals);
    },
    TIMEOUT,
  );

  test(
    'one worker and three give the same answer',
    async () => {
      const answers = [];
      for (const size of [1, 3]) {
        const pool = poolOf(size);
        answers.push(await runCaptainAdvice(campaign(), trios, 'now', pool));
        pool.dispose();
      }
      expect(answers[1]).toEqual(answers[0]);
      expect(answers[0]?.rows).toHaveLength(3);
    },
    TIMEOUT,
  );

  test(
    'the pass reads its input without mutating it',
    async () => {
      const input = campaign();
      const before = structuredClone(input);
      const given = structuredClone(trios);
      const pool = poolOf(2);
      await runCaptainAdvice(input, trios, 'now', pool);
      pool.dispose();
      expect(input).toEqual(before);
      expect(trios).toEqual(given);
    },
    TIMEOUT,
  );

  test(
    'a clock that runs out in the baseline reports the screen cut and nothing failed',
    async () => {
      const pool = poolOf(1, () => ({ probe: (_input, signal) => hang(signal) }));
      const result = await runCaptainAdvice(campaign(), trios, 'now', pool, { budgetMs: 20 });
      pool.dispose();
      expect(result.baseline).toBeNull();
      expect(result.screenCut).toBe(true);
      expect(result.failed).toEqual([]);
      expect(result.confirmed).toEqual([]);
    },
    TIMEOUT,
  );

  test(
    'a clock that runs out in the confirm lists the trios it stopped and keeps the baseline and the screen',
    async () => {
      // The baseline (the first probe) answers; every trio's plan hangs until the pass's clock cuts it.
      let calls = 0;
      const pool = poolOf(1, (inline) => ({
        probe: (input, signal) => {
          calls += 1;
          return calls === 1 ? inline.probe(input, signal) : hang(signal);
        },
      }));
      const result = await runCaptainAdvice(campaign(), trios, 'now', pool, { budgetMs: 4_000 });
      pool.dispose();
      expect(result.baseline).not.toBeNull();
      expect(result.screenCut).toBe(false);
      expect(result.screens).toHaveLength(trios.length);
      expect(result.confirmed).toHaveLength(3);
      expect(result.cut).toEqual(result.confirmed);
      expect(result.rows).toEqual([]);
      expect(result.failed).toEqual([]);
      expect(result.best.every((stop) => stop.trio === 'now' && stop.gain === 0)).toBe(true);
    },
    TIMEOUT,
  );

  test(
    'a trio whose plan throws is reported failed and the others are read',
    async () => {
      let calls = 0;
      const pool = poolOf(1, (inline) => ({
        probe: (input, signal) => {
          calls += 1;
          // The baseline is call 1; the first confirmed trio is call 2.
          if (calls === 2) return Promise.reject(new Error('boom'));
          return inline.probe(input, signal);
        },
      }));
      const result = await runCaptainAdvice(campaign(), trios, 'now', pool);
      pool.dispose();
      expect(result.failed).toEqual([{ trio: result.confirmed[0], message: 'boom' }]);
      expect(result.rows).toHaveLength(2);
      expect(result.best.every((stop) => stop.gain >= 0)).toBe(true);
    },
    TIMEOUT,
  );

  test('an aborted pass rejects', async () => {
    const pool = poolOf(1);
    const controller = new AbortController();
    controller.abort();
    await expect(
      runCaptainAdvice(campaign(), trios, 'now', pool, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    pool.dispose();
  });
});
