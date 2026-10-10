/**
 * W17 C3 — **the advisor's job and pass** (`runProbe` in `jobs.ts`, `runAdvisor` in `advisor.ts`), on the kernel:
 * the baseline job reads every stop of its plan as the positions step prices it (Tight); a probe job reads its
 * probe against that baseline in one round trip; the pass runs the baseline first and every probe after it on
 * the pool, with no clock in any job, and ranks what it read.
 */
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import { getUnits } from '@/data';
import { BONUS_KEYS, type BonusKey } from '@/data/types';
import { emptyTotals, planCampaign, planMarch, withMethod } from '@/engine';
import { headlineOf, probeInfo } from '@/engine/advisor';
import type { CampaignInput } from '@/engine/plan';
import { bonusProbe, housingProbe, type Probe } from '@/engine/probes';
import type { StackRequest } from '@/engine/types';
import { OFFERED_POSITIONS, positionTrades } from '@/ui/sections/march/positions';

import { runAdvisor } from './advisor';
import { createInlineClient, type CalcClient } from './client';
import { runProbe, type JobContext } from './jobs';
import { createCalcPool } from './pool';
import type { ProbeInput } from './protocol';

/** The planner's small army (`plan-fixes.test.ts`): four troop types and three hired soldiers with a stock. */
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
    totals: emptyTotals(),
    options: { method: 'elite', strictMercsAboveMonsters: false, monstersLast: false, roundTo10: false },
    enemy: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
    activeEvents: [],
    recovery: { templeLevel: 0, trainingCostReduction: {}, trainingSpeed: {}, plan: { mode: 'retrain' } },
  };
}

/** What the app plans under (`buildPlanRequest`), with no clock. */
function campaign(): CampaignInput {
  return {
    request: request(),
    marchTarget: CAMPAIGN.marches,
    ...CAMPAIGN.planFixes,
    putBack: CAMPAIGN.putBack,
  };
}

/** A bonus line no unit of the army reads: a probe on it changes nothing the engine looks at. */
function inertKey(req: StackRequest): BonusKey {
  const key = BONUS_KEYS.find((candidate) => req.units.every((unit) => !unit.keys.includes(candidate)));
  if (key === undefined) throw new Error('every bonus line touches this army');
  return key;
}

const RUNNING: JobContext = { onProgress: () => undefined, cancelled: () => false };
const RATES = CAMPAIGN.markerRates;
const TIMEOUT = 120_000;

describe('runProbe: one job of the advisor', () => {
  test(
    'the baseline job reads every stop of its plan at the Tight the positions step prices',
    () => {
      const input = campaign();
      const answer = runProbe({ plan: input }, RUNNING);
      const plan = planCampaign(input);
      expect(answer.row).toBeNull();
      expect(answer.stops.map((stop) => stop.pick)).toEqual(plan.alternatives.map((row) => row.pick));
      const shown = withMethod(input.request, 'elite');
      plan.alternatives.forEach((row, index) => {
        const stop = answer.stops[index];
        const trades = positionTrades(shown, planMarch(shown, row.counts).result, OFFERED_POSITIONS);
        const tight = trades.rows.find((priced) => priced.mode === 'tight');
        expect(stop?.counts).toEqual(row.counts);
        expect(stop?.march.counts).toEqual(tight?.counts);
        expect(stop?.march.bill).toMatchObject({
          damage: tight?.damage,
          silver: tight?.silver,
          gold: tight?.gold,
          hired: tight?.mercLost,
        });
      });
    },
    TIMEOUT,
  );

  test(
    'a probe on a line the army never reads re-plans the same bar and gains nothing, with no flag',
    () => {
      const input = campaign();
      const baseline = runProbe({ plan: input }, RUNNING).stops;
      const probe = bonusProbe('health', inertKey(input.request));
      const answer = runProbe(
        {
          plan: { ...input, request: probe.apply(input.request) },
          against: { probe: probeInfo(probe), baseline, rates: RATES },
        },
        RUNNING,
      );
      expect(answer.stops).toEqual(baseline);
      expect(answer.row?.stops).toHaveLength(baseline.length);
      for (const advice of answer.row?.stops ?? []) {
        expect(advice.repriced).toEqual(advice.current);
        expect(advice.replanned).toEqual(advice.current);
        expect(advice).toMatchObject({
          gain: 0,
          from: null,
          clamped: false,
          noise: false,
          reorder: false,
          worse: false,
        });
      }
    },
    TIMEOUT,
  );

  test(
    'a probe job reads every baseline stop, against its own march, and never as a loss',
    () => {
      const input = campaign();
      const baseline = runProbe({ plan: input }, RUNNING).stops;
      const probe = bonusProbe('strength', 'army');
      const answer = runProbe(
        {
          plan: { ...input, request: probe.apply(input.request) },
          against: { probe: probeInfo(probe), baseline, rates: RATES },
        },
        RUNNING,
      );
      const row = answer.row;
      expect(row).toMatchObject({ id: 'strength:army', family: 'strength' });
      expect(row?.stops.map((advice) => advice.pick)).toEqual(baseline.map((stop) => stop.pick));
      row?.stops.forEach((advice, index) => {
        expect(advice.current).toEqual(baseline[index]?.march);
        expect(advice.gain).toBeGreaterThanOrEqual(0);
      });
      // A point of strength on every unit is worth something on the stop the advisor headlines.
      expect(row && headlineOf(row)?.gain).toBeGreaterThan(0);
      expect(structuredClone(answer)).toEqual(answer);
    },
    TIMEOUT,
  );

  test('a job cancelled before it ran reads nothing', () => {
    expect(runProbe({ plan: campaign() }, { ...RUNNING, cancelled: () => true })).toEqual({
      stops: [],
      row: null,
    });
  });
});

describe('runAdvisor: the pass over the pool', () => {
  test(
    'the baseline first, the probes beside it on the pool, with no clock in any job, ranked and counted',
    async () => {
      const sent: ProbeInput[] = [];
      // Inline clients that report a worker, so the pool really runs two lanes.
      const lanes = (): CalcClient => {
        const inline = createInlineClient();
        return {
          ...inline,
          mode: 'worker',
          probe: (input, signal) => {
            sent.push(input);
            return inline.probe(input, signal);
          },
        };
      };
      const pool = createCalcPool({ size: 2, createClient: lanes });
      const input = campaign();
      const probes: Probe[] = [
        bonusProbe('health', inertKey(input.request)),
        bonusProbe('strength', 'army'),
        housingProbe('leadership'),
      ];
      const progress: [number, number][] = [];
      const result = await runAdvisor({ ...input, budgetMs: 1 }, probes, pool, {
        onProgress: (done, total) => progress.push([done, total]),
      });
      pool.dispose();

      expect(result.cut).toEqual([]);
      expect(result.failed).toEqual([]);
      expect(result.baseline?.map((stop) => stop.pick)).toEqual(
        planCampaign(input).alternatives.map((row) => row.pick),
      );
      expect(result.rows.map((row) => row.id).sort()).toEqual(probes.map((probe) => probe.id).sort());
      const gains = result.rows.map((row) => headlineOf(row)?.gain ?? 0);
      expect(gains).toEqual([...gains].sort((a, b) => b - a));
      // One job for the baseline and one a probe, each counted once, out of the pass's whole.
      expect(progress).toEqual([1, 2, 3, 4].map((done) => [done, 4]));
      // The baseline goes first; a probe started before it is known plans first and reads in a second call.
      expect(sent[0]?.against).toBeUndefined();
      expect(sent[0]?.shown).toBeUndefined();
      const reads = sent.filter((job) => job.against !== undefined);
      expect(reads).toHaveLength(probes.length);
      expect(sent).toHaveLength(1 + probes.length + reads.filter((job) => job.shown !== undefined).length);
      expect(reads.some((job) => job.shown !== undefined)).toBe(true);
      for (const job of sent) {
        expect(job.plan.budgetMs).toBeUndefined();
        expect(job.plan.shouldStop).toBeUndefined();
      }
      for (const job of reads) expect(job.against?.baseline).toEqual(result.baseline);
    },
    TIMEOUT,
  );

  /** Inline clients that report a worker, so the pool really runs `size` lanes; `wrap` can replace `probe`. */
  function poolOf(size: number, wrap?: (client: CalcClient) => Partial<CalcClient>) {
    return createCalcPool({
      size,
      createClient: (): CalcClient => {
        const inline = createInlineClient();
        return { ...inline, mode: 'worker', ...wrap?.(inline) };
      },
    });
  }

  function probesOf(input: CampaignInput): Probe[] {
    return [
      bonusProbe('health', inertKey(input.request)),
      bonusProbe('strength', 'army'),
      housingProbe('leadership'),
    ];
  }

  test(
    'the pass reads its input and probes without mutating them',
    async () => {
      const input = campaign();
      const probes = probesOf(input);
      const before = structuredClone(input);
      const { request } = input;
      const { totals, housing } = request;
      const pool = poolOf(2);
      await runAdvisor(input, probes, pool);
      pool.dispose();
      expect(input).toEqual(before);
      expect(input.request).toBe(request);
      expect(input.request.totals).toBe(totals);
      expect(input.request.housing).toBe(housing);
    },
    TIMEOUT,
  );

  test(
    'one worker and three give the same baseline, rows and ranking',
    async () => {
      const input = campaign();
      const probes = probesOf(input);
      const answers = [];
      for (const size of [1, 3]) {
        const pool = poolOf(size);
        answers.push(await runAdvisor(input, probes, pool));
        pool.dispose();
      }
      expect(answers[1]).toEqual(answers[0]);
      expect(answers[0]?.rows).toHaveLength(probes.length);
    },
    TIMEOUT,
  );

  test(
    'every row of the pass is read on every stop, never as a loss, and a stop without gain says so',
    async () => {
      const input = campaign();
      const pool = poolOf(2);
      const { rows, baseline } = await runAdvisor(input, probesOf(input), pool);
      pool.dispose();
      for (const row of rows) {
        expect(row.stops.map((advice) => advice.pick)).toEqual(baseline?.map((stop) => stop.pick));
        for (const advice of row.stops) {
          expect(advice.gain).toBeGreaterThanOrEqual(0);
          // No gain is said as `from: null`, whether the probe changed nothing or the clamp held it at 0.
          if (advice.gain === 0) expect(advice.from).toBeNull();
        }
      }
    },
    TIMEOUT,
  );

  test(
    'a probe the clock stops is reported cut, in probe order, and the ones that finished are kept',
    async () => {
      const input = campaign();
      const probes = probesOf(input);
      const hung = probes[1];
      const pool = poolOf(2, (inline) => ({
        probe: (probeInput, signal) =>
          probeInput.against?.probe.id === hung?.id
            ? new Promise((_resolve, reject) => {
                signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
              })
            : inline.probe(probeInput, signal),
      }));
      const result = await runAdvisor(input, probes, pool, { budgetMs: 4_000 });
      pool.dispose();
      expect(result.baseline).not.toBeNull();
      expect(result.cut.map((info) => info.id)).toEqual([hung?.id]);
      expect(result.failed).toEqual([]);
      expect(result.rows.map((row) => row.id).sort()).toEqual(
        probes
          .filter((probe) => probe !== hung)
          .map((probe) => probe.id)
          .sort(),
      );
    },
    TIMEOUT,
  );

  test(
    'a baseline the clock stops leaves no rows and every probe cut',
    async () => {
      const input = campaign();
      const probes = probesOf(input);
      const pool = poolOf(2, () => ({
        probe: (_input, signal) =>
          new Promise((_resolve, reject) => {
            signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
          }),
      }));
      const result = await runAdvisor(input, probes, pool, { budgetMs: 50 });
      pool.dispose();
      expect(result.baseline).toBeNull();
      expect(result.rows).toEqual([]);
      expect(result.cut.map((info) => info.id)).toEqual(probes.map((probe) => probe.id));
    },
    TIMEOUT,
  );

  test(
    'a baseline that throws fails the pass with its message and stops the probes started beside it',
    async () => {
      const input = campaign();
      let reads = 0;
      const pool = poolOf(2, (inline) => ({
        probe: (probeInput, signal) => {
          if (probeInput.against !== undefined) reads += 1;
          return probeInput.plan.request === input.request
            ? Promise.reject(new Error('baseline said no'))
            : inline.probe(probeInput, signal);
        },
      }));
      await expect(runAdvisor(input, probesOf(input), pool)).rejects.toThrow('baseline said no');
      pool.dispose();
      expect(reads).toBe(0);
    },
    TIMEOUT,
  );

  test(
    'a probe that throws is reported failed with its message and the others are read',
    async () => {
      const input = campaign();
      const probes = probesOf(input);
      const broken = probes[0];
      const pool = poolOf(2, (inline) => ({
        probe: (probeInput, signal) =>
          probeInput.against?.probe.id === broken?.id
            ? Promise.reject(new Error('kernel said no'))
            : inline.probe(probeInput, signal),
      }));
      const result = await runAdvisor(input, probes, pool);
      pool.dispose();
      expect(result.failed.map((failure) => [failure.probe.id, failure.message])).toEqual([
        [broken?.id, 'kernel said no'],
      ]);
      expect(result.rows).toHaveLength(probes.length - 1);
      expect(result.cut).toEqual([]);
    },
    TIMEOUT,
  );
});
