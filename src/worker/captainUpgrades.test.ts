/**
 * W17 C5b — **the upgrade pass** (`runCaptainUpgrades` in `captainUpgrades.ts`), on the kernel: each upgrade read
 * against the lead lineup's plan, a captain in the lead lineup tried in that lineup alone, a benched captain's lineups
 * screened and the best planned in full, with no clock in any job.
 */
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import { getUnits } from '@/data';
import { emptyTotals } from '@/engine';
import type { ScreenLineup } from '@/engine/captains';
import type { CampaignInput } from '@/engine/plan';
import type { BonusTotals, StackRequest } from '@/engine/types';

import { runCaptainAdvice } from './captainAdvice';
import { abortError, createInlineClient, type CalcClient } from './client';
import { createCalcPool } from './pool';
import type { ProbeInput } from './protocol';
import {
  runCaptainUpgrades,
  runUpgradeWorth,
  type UpgradeAsk,
  type UpgradeLead,
  type WorthAsk,
} from './captainUpgrades';

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

/** The lead lineup with its bar, planned through the captain pass as the card will. */
async function leadOf(): Promise<UpgradeLead> {
  const pool = poolOf(1);
  const advice = await runCaptainAdvice(campaign(), [{ key: 'now', totals: withArmy(20) }], 'now', pool);
  pool.dispose();
  const stops = advice.plans['now'];
  if (stops === undefined) throw new Error('The baseline plan must be kept under the current key.');
  return { key: 'now', totals: withArmy(20), stops };
}

const lineup = (key: string, points: number): ScreenLineup => ({ key, totals: withArmy(points) });

/** A captain in the lead lineup (one lineup, upgraded), one that is not (five lineups), and one that gains nothing. */
function asks(): UpgradeAsk[] {
  return [
    { id: 'captain:in:star', label: 'In ★1 → ★2', lineups: [lineup('now', 80)] },
    {
      id: 'captain:bench:star',
      label: 'Bench ★1 → ★2',
      cost: { amount: 40, unit: 'shards' },
      lineups: [lineup('t0', 0), lineup('t1', 10), lineup('t2', 300), lineup('t3', 60), lineup('t4', 20)],
    },
    { id: 'captain:flat:level', label: 'Flat L5 → L6', lineups: [lineup('now', 20)] },
  ];
}

describe('runCaptainUpgrades', () => {
  test(
    'reads each upgrade against the lead lineup: a captain in it in that lineup alone, a benched one in its best lineup',
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
      expect(inLead?.lineups.every((key) => key === 'now')).toBe(true);
      expect(inLead?.stops.every((stop) => stop.gain > 0)).toBe(true);
      // The benched captain: five lineups screened, two planned (the top of the re-priced screen), 300 points wins.
      expect(bench?.planned).toHaveLength(CAMPAIGN.captainUpgradeConfirm);
      expect(bench?.planned).toContain('t2');
      expect(bench?.lineups.every((key) => key === 't2')).toBe(true);
      expect(bench?.cost).toEqual({ amount: 40, unit: 'shards' });
      // The same totals as the lead lineup gain nothing, and say so instead of reading as a loss or vanishing.
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
    'the confirm count caps the plans, a lead-lineup upgrade skips the screen, and no job carries a clock',
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

// ---- The worth list ---------------------------------------------------------------------------------
/** A worth ask: `kind` and `size` as the main thread would give them, one lineup per `[key, points]`. */
function worthAsk(id: string, lineups: [string, number][], extra: Partial<WorthAsk> = {}): WorthAsk {
  const [captainId = id, kind = 'star', size = '1'] = id.replace('captain:', '').split(/[:+]/);
  return {
    id,
    label: id,
    captainId,
    kind: kind === 'level' ? 'level' : 'star',
    size: Number(size),
    perLevel: 1,
    lineups: lineups.map(([key, points]) => lineup(key, points)),
    ...extra,
  };
}

function worthAsks(): WorthAsk[] {
  return [
    worthAsk('captain:in:star+1', [['now', 80]]),
    worthAsk('captain:bench:star+1', [
      ['t0', 0],
      ['t1', 10],
      ['t2', 300],
      ['t3', 60],
      ['t4', 20],
    ]),
    worthAsk('captain:flat:level+5', [['now', 20]]),
  ];
}

describe('runUpgradeWorth', () => {
  test(
    'tier 1 re-prices the current march: a lead-lineup captain in its own lineup, a benched one in its best swap',
    async () => {
      const lead = await leadOf();
      const pool = poolOf(2);
      const result = await runUpgradeWorth(campaign(), lead, worthAsks(), pool, { top: 0 });
      pool.dispose();

      expect(result.lead).toBe('now');
      expect(result.cut).toEqual([]);
      expect(result.failed).toEqual([]);
      // Ranked by worth, the order of the asks on a tie.
      expect(result.rows.map((row) => row.id)).toEqual([
        'captain:bench:star+1',
        'captain:in:star+1',
        'captain:flat:level+5',
      ]);
      const [bench, inLead, flat] = result.rows;
      expect(bench?.tier1.lineups.every((key) => key === 't2')).toBe(true);
      expect(inLead?.tier1.lineups.every((key) => key === 'now')).toBe(true);
      expect(inLead?.tier1.stops).toHaveLength(lead.stops.length);
      expect(inLead?.tier1.gain).toBeCloseTo(
        inLead!.tier1.stops.reduce((sum, gain) => sum + gain, 0) / lead.stops.length,
      );
      expect(inLead?.tier1.gain).toBeGreaterThan(0);
      expect(bench!.tier1.gain).toBeGreaterThan(inLead!.tier1.gain);
      // The same totals as the lead lineup gain nothing: 0, never a loss.
      expect(flat?.tier1.gain).toBe(0);
      for (const row of result.rows)
        for (const gain of row.tier1.stops) expect(gain).toBeGreaterThanOrEqual(0);
      // top: 0 regenerates nothing.
      expect(result.rows.every((row) => row.tier2 === undefined)).toBe(true);
    },
    TIMEOUT,
  );

  test(
    'tier 2 regenerates the top upgrades of tier 1 only, and reads at least what tier 1 read',
    async () => {
      const lead = await leadOf();
      const pool = poolOf(2);
      const result = await runUpgradeWorth(campaign(), lead, worthAsks(), pool, { top: 2 });
      pool.dispose();
      const withTier2 = result.rows.filter((row) => row.tier2 !== undefined).map((row) => row.id);
      expect(withTier2).toEqual(['captain:bench:star+1', 'captain:in:star+1']);
      for (const row of result.rows)
        if (row.tier2 !== undefined) {
          expect(row.tier2.gain).toBeGreaterThanOrEqual(row.tier1.gain - 1e-9);
          expect(row.worth).toBe(row.tier2.gain);
          expect(row.tier2.planned.length).toBeGreaterThan(0);
        } else expect(row.worth).toBe(row.tier1.gain);
    },
    TIMEOUT,
  );

  test(
    'a typed cost orders the list by gain per cost, costed rows first, one group per unit',
    async () => {
      const lead = await leadOf();
      const asks = [
        worthAsk('captain:free:star+1', [['now', 300]]),
        worthAsk('captain:dear:star+1', [['now', 80]], { cost: { amount: 1000, unit: 'shards' } }),
        worthAsk('captain:cheap:star+1', [['now', 60]], { cost: { amount: 1, unit: 'shards' } }),
      ];
      const pool = poolOf(1);
      const result = await runUpgradeWorth(campaign(), lead, asks, pool, { top: 0 });
      pool.dispose();
      expect(result.rows.map((row) => row.id)).toEqual([
        'captain:cheap:star+1',
        'captain:dear:star+1',
        'captain:free:star+1',
      ]);
    },
    TIMEOUT,
  );

  test(
    'a level step reports its gain per level, and the levels between the probes are inferred from the per-level bonus',
    async () => {
      const lead = await leadOf();
      const asks = [5, 10, 15].map((n) =>
        worthAsk(`captain:cap:level+${String(n)}`, [['now', 20 + 6 * n]], { perLevel: 2 }),
      );
      const pool = poolOf(1);
      const result = await runUpgradeWorth(campaign(), lead, asks, pool, { top: 0 });
      pool.dispose();
      for (const row of result.rows) expect(row.gainPerLevel).toBeCloseTo(row.tier1.gain / row.size);
      const probed = new Map(result.rows.map((row) => [row.size, row.tier1.gain]));
      const inferred = result.inferred.filter((row) => row.captainId === 'cap');
      expect(inferred.map((row) => row.size)).toEqual([1, 2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14]);
      // 4 levels: the 5-level probe scaled by 4/5; 8 levels: the 10-level probe scaled by 8/10.
      expect(inferred.find((row) => row.size === 4)?.tier1Gain).toBeCloseTo(probed.get(5)! * (4 / 5));
      expect(inferred.find((row) => row.size === 8)?.tier1Gain).toBeCloseTo(probed.get(10)! * (8 / 10));
      expect(inferred.find((row) => row.size === 4)?.gainPerLevel).toBeCloseTo(
        (probed.get(5)! * (4 / 5)) / 4,
      );
    },
    TIMEOUT,
  );

  test(
    'a captain probed at every level (exact) has nothing inferred, and stars are never inferred',
    async () => {
      const lead = await leadOf();
      const asks = [
        worthAsk('captain:odd:level+1', [['now', 40]], { exact: true }),
        worthAsk('captain:odd:level+2', [['now', 70]], { exact: true }),
        worthAsk('captain:odd:star+1', [['now', 90]]),
      ];
      const pool = poolOf(1);
      const result = await runUpgradeWorth(campaign(), lead, asks, pool, { top: 0 });
      pool.dispose();
      expect(result.inferred).toEqual([]);
    },
    TIMEOUT,
  );

  test(
    'no job carries a clock, and one worker and three give the same list',
    async () => {
      const lead = await leadOf();
      const sent: ProbeInput[] = [];
      const answers = [];
      for (const size of [1, 3]) {
        const pool = poolOf(size, (inline) => ({
          probe: (input, signal) => {
            sent.push(input);
            return inline.probe(input, signal);
          },
        }));
        answers.push(
          await runUpgradeWorth({ ...campaign(), budgetMs: 1 }, lead, worthAsks(), pool, { top: 2 }),
        );
        pool.dispose();
      }
      expect(answers[1]).toEqual(answers[0]);
      expect(sent.length).toBeGreaterThan(0);
      for (const job of sent) {
        expect(job.plan.budgetMs).toBeUndefined();
        expect(job.plan.shouldStop).toBeUndefined();
      }
    },
    TIMEOUT,
  );

  test(
    'reads its input without mutating it, and reports a screen that throws without losing the others',
    async () => {
      const lead = await leadOf();
      const input = campaign();
      const given = worthAsks();
      const before = structuredClone({ input, lead, given });
      let calls = 0;
      const pool = poolOf(1, (inline) => ({
        captains: (request, signal) => {
          calls += 1;
          return calls === 1 ? Promise.reject(new Error('boom')) : inline.captains(request, signal);
        },
      }));
      const result = await runUpgradeWorth(input, lead, given, pool, { top: 0 });
      pool.dispose();
      expect({ input, lead, given }).toEqual(before);
      expect(result.failed).toEqual([{ id: 'captain:in:star+1', message: 'boom' }]);
      expect(result.rows.map((row) => row.id)).toEqual(['captain:bench:star+1', 'captain:flat:level+5']);
    },
    TIMEOUT,
  );

  test(
    'a clock that runs out in tier 2 keeps the tier 1 rows and lists the upgrades it stopped',
    async () => {
      const lead = await leadOf();
      const pool = poolOf(1, () => ({ probe: (_input, signal) => hang(signal) }));
      const result = await runUpgradeWorth(campaign(), lead, worthAsks(), pool, { top: 2, budgetMs: 4_000 });
      pool.dispose();
      expect(result.rows).toHaveLength(3);
      expect(result.rows.every((row) => row.tier2 === undefined)).toBe(true);
      expect(result.cut).toEqual(['captain:in:star+1', 'captain:bench:star+1']);
    },
    TIMEOUT,
  );

  test('an aborted pass rejects', async () => {
    const lead = await leadOf();
    const pool = poolOf(1);
    const controller = new AbortController();
    controller.abort();
    await expect(
      runUpgradeWorth(campaign(), lead, worthAsks(), pool, { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' });
    pool.dispose();
  });
});
