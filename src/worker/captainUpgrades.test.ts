/**
 * W17 C5b — **the upgrade pass** (`runCaptainUpgrades` in `captainUpgrades.ts`), on the kernel: each upgrade read
 * against the lead trio's plan, a captain in the lead trio tried in that trio alone, a benched captain's trios
 * screened and the best planned in full, with no clock in any job.
 */
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import { getUnits } from '@/data';
import { emptyTotals } from '@/engine';
import type { ScreenTrio } from '@/engine/captains';
import type { CampaignInput } from '@/engine/plan';
import type { BonusTotals, StackRequest } from '@/engine/types';

import { runCaptainAdvice } from './captainAdvice';
import { abortError, createInlineClient, type CalcClient } from './client';
import { createCalcPool } from './pool';
import type { ProbeInput } from './protocol';
import { runCaptainUpgrades, type UpgradeAsk, type UpgradeLead } from './captainUpgrades';

const TIMEOUT = 120_000;

/** The planner's small army (`captainAdvice.test.ts`): four troop types and three hired soldiers with a stock. */
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

function poolOf(size: number, wrap?: (client: CalcClient) => Partial<CalcClient>) {
  return createCalcPool({
    size,
    createClient: (): CalcClient => {
      const inline = createInlineClient();
      return { ...inline, mode: 'worker', ...wrap?.(inline) };
    },
  });
}

function hang<T>(signal?: AbortSignal): Promise<T> {
  return new Promise<T>((_, reject) => {
    signal?.addEventListener('abort', () => reject(abortError()), { once: true });
  });
}

/** The lead trio with its bar, planned through the captain pass as the card will. */
async function leadOf(): Promise<UpgradeLead> {
  const pool = poolOf(1);
  const advice = await runCaptainAdvice(campaign(), [{ key: 'now', totals: withArmy(20) }], 'now', pool);
  pool.dispose();
  const stops = advice.plans['now'];
  if (stops === undefined) throw new Error('The baseline plan must be kept under the current key.');
  return { key: 'now', totals: withArmy(20), stops };
}

const trio = (key: string, points: number): ScreenTrio => ({ key, totals: withArmy(points) });

/** A captain in the lead trio (one trio, upgraded), one that is not (five trios), and one that gains nothing. */
function asks(): UpgradeAsk[] {
  return [
    { id: 'captain:in:star', label: 'In ★1 → ★2', trios: [trio('now', 80)] },
    {
      id: 'captain:bench:star',
      label: 'Bench ★1 → ★2',
      cost: { amount: 40, unit: 'shards' },
      trios: [trio('t0', 0), trio('t1', 10), trio('t2', 300), trio('t3', 60), trio('t4', 20)],
    },
    { id: 'captain:flat:level', label: 'Flat L5 → L6', trios: [trio('now', 20)] },
  ];
}

describe('runCaptainUpgrades', () => {
  test(
    'reads each upgrade against the lead trio: a captain in it in that trio alone, a benched one in its best trio',
    async () => {
      const lead = await leadOf();
      const pool = poolOf(2);
      const progress: [number, number][] = [];
      const result = await runCaptainUpgrades({ ...campaign(), budgetMs: 1 }, lead, asks(), pool, {
        onProgress: (done, total) => progress.push([done, total]),
      });
      pool.dispose();

      expect(result.lead).toBe('now');
      expect(result.rows.map((row) => row.id)).toEqual([
        'captain:in:star',
        'captain:bench:star',
        'captain:flat:level',
      ]);
      expect(result.cut).toEqual([]);
      expect(result.failed).toEqual([]);

      const [inLead, bench, flat] = result.rows;
      expect(inLead?.planned).toEqual(['now']);
      expect(inLead?.trios.every((key) => key === 'now')).toBe(true);
      expect(inLead?.stops.every((stop) => stop.gain > 0)).toBe(true);
      // The benched captain: five trios screened, two planned (the top of the re-priced screen), 300 points wins.
      expect(bench?.planned).toHaveLength(CAMPAIGN.captainUpgradeConfirm);
      expect(bench?.planned).toContain('t2');
      expect(bench?.trios.every((key) => key === 't2')).toBe(true);
      expect(bench?.cost).toEqual({ amount: 40, unit: 'shards' });
      // The same totals as the lead trio gain nothing, and say so instead of reading as a loss or vanishing.
      expect(flat?.stops.length).toBe(lead.stops.length);
      expect(flat?.stops.every((stop) => stop.gain === 0)).toBe(true);
      for (const row of result.rows)
        for (const stop of row.stops) expect(stop.gain).toBeGreaterThanOrEqual(0);
      // 1 screen + 1 + 2 + 1 plans.
      expect(progress.at(-1)).toEqual([5, 5]);
    },
    TIMEOUT,
  );

  test(
    'the confirm count caps the plans, a lead-trio upgrade skips the screen, and no job carries a clock',
    async () => {
      const lead = await leadOf();
      const sent: ProbeInput[] = [];
      let screens = 0;
      const pool = poolOf(2, (inline) => ({
        probe: (input, signal) => {
          sent.push(input);
          return inline.probe(input, signal);
        },
        captains: (input, signal) => {
          screens += 1;
          return inline.captains(input, signal);
        },
      }));
      const result = await runCaptainUpgrades({ ...campaign(), budgetMs: 1 }, lead, asks(), pool, {
        confirm: 1,
      });
      pool.dispose();
      expect(screens).toBe(1);
      expect(sent).toHaveLength(3);
      for (const job of sent) {
        expect(job.plan.budgetMs).toBeUndefined();
        expect(job.plan.shouldStop).toBeUndefined();
        expect(job.against?.baseline).toEqual(lead.stops);
      }
      expect(result.rows.find((row) => row.id === 'captain:bench:star')?.planned).toEqual(['t2']);
      expect(sent[1]?.plan.request.totals).toEqual(withArmy(300));
    },
    TIMEOUT,
  );

  test(
    'one worker and three give the same answer',
    async () => {
      const lead = await leadOf();
      const answers = [];
      for (const size of [1, 3]) {
        const pool = poolOf(size);
        answers.push(await runCaptainUpgrades(campaign(), lead, asks(), pool));
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
      const lead = await leadOf();
      const input = campaign();
      const before = structuredClone({ input, lead, given: asks() });
      const given = asks();
      const pool = poolOf(2);
      await runCaptainUpgrades(input, lead, given, pool);
      pool.dispose();
      expect({ input, lead, given }).toEqual(before);
    },
    TIMEOUT,
  );

  test(
    'a clock that runs out in the plans lists the upgrades it stopped',
    async () => {
      const lead = await leadOf();
      const pool = poolOf(1, () => ({ probe: (_input, signal) => hang(signal) }));
      const result = await runCaptainUpgrades(campaign(), lead, asks(), pool, { budgetMs: 4_000 });
      pool.dispose();
      expect(result.rows).toEqual([]);
      expect(result.cut).toEqual(asks().map((ask) => ask.id));
      expect(result.failed).toEqual([]);
    },
    TIMEOUT,
  );

  test(
    'a plan that throws is reported failed and the other upgrades are read',
    async () => {
      const lead = await leadOf();
      let calls = 0;
      const pool = poolOf(1, (inline) => ({
        probe: (input, signal) => {
          calls += 1;
          if (calls === 1) return Promise.reject(new Error('boom'));
          return inline.probe(input, signal);
        },
      }));
      const result = await runCaptainUpgrades(campaign(), lead, asks(), pool);
      pool.dispose();
      expect(result.failed.map((failure) => failure.message)).toEqual(['boom']);
      expect(result.rows.length).toBeGreaterThanOrEqual(2);
    },
    TIMEOUT,
  );

  test('an aborted pass rejects', async () => {
    const lead = await leadOf();
    const pool = poolOf(1);
    const controller = new AbortController();
    controller.abort();
    await expect(
      runCaptainUpgrades(campaign(), lead, asks(), pool, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    pool.dispose();
  });
});
