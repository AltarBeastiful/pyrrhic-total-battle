/**
 * W17 C5a — **the captain screen job** (`runCaptainScreen` in `jobs.ts`), on the kernel: every trio priced two
 * ways against the current one, as one round trip through the same client the pool hands out.
 */
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import { getUnits } from '@/data';
import { emptyTotals, planCampaign } from '@/engine';
import { rankTrios } from '@/engine/captains';
import type { ScreenStop } from '@/engine/captains';
import type { BonusTotals, StackRequest } from '@/engine/types';

import { createInlineClient } from './client';
import { runCaptainScreen, trioPricer } from './jobs';
import type { CaptainScreenInput } from './protocol';

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
    totals: emptyTotals(),
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

function stopsOf(req: StackRequest): ScreenStop[] {
  const plan = planCampaign({ request: req, marchTarget: CAMPAIGN.marches, ...CAMPAIGN.planFixes });
  return plan.alternatives.map((row) => ({ pick: row.pick, counts: row.counts }));
}

function input(): CaptainScreenInput {
  const req = request();
  return {
    request: req,
    trios: [
      { key: 'now', totals: withArmy(20) },
      { key: 'weaker', totals: withArmy(0) },
      { key: 'better', totals: withArmy(120) },
      { key: 'best', totals: withArmy(400) },
    ],
    currentKey: 'now',
    stops: stopsOf(req),
    rates: CAMPAIGN.markerRates,
  };
}

const never = { onProgress: () => undefined, cancelled: () => false };

describe('runCaptainScreen', () => {
  test('rates each trio against the current one, which rates 0, and ranks the stronger army first', () => {
    const job = input();
    expect(job.stops.length).toBeGreaterThan(0);
    const { screens } = runCaptainScreen(job, never);
    expect(screens.map((screen) => screen.key)).toEqual(['now', 'weaker', 'better', 'best']);
    expect(screens[0]).toEqual({ key: 'now', sized: 0, repriced: job.stops.map(() => 0) });
    const [, weaker, better, best] = screens;
    expect(weaker!.sized).toBeLessThan(0);
    expect(better!.sized).toBeGreaterThan(0);
    expect(best!.sized).toBeGreaterThan(better!.sized);
    for (const kind of ['sized', 'repriced'] as const)
      expect(rankTrios(screens, kind).map((screen) => screen.key)).toEqual([
        'best',
        'better',
        'now',
        'weaker',
      ]);
  });

  test('is deterministic: the same job gives the same screens', () => {
    const job = input();
    expect(runCaptainScreen(job, never)).toEqual(runCaptainScreen(job, never));
  });

  test('a trio of the current captains’ totals rates 0 on both readings', () => {
    const job = input();
    job.trios.push({ key: 'twin', totals: withArmy(20) });
    const twin = runCaptainScreen(job, never).screens.find((screen) => screen.key === 'twin');
    expect(twin?.sized).toBe(0);
    expect(twin?.repriced.every((rating) => rating === 0)).toBe(true);
  });

  test('the sized reading is a march of its own and the re-priced one keeps the plan’s counts', () => {
    const job = input();
    const price = trioPricer(job.request);
    const now = job.trios[0]!.totals;
    const a = price(now, null);
    const b = price(now, job.stops[0]!.counts);
    expect(a.damage).toBeGreaterThan(0);
    expect(b.damage).toBeGreaterThan(0);
    // Pricing the same thing twice is the same bill (the request is built once per totals).
    expect(price(now, job.stops[0]!.counts)).toEqual(b);
  });

  test('a job cancelled before it starts prices no trio', () => {
    const { screens } = runCaptainScreen(input(), { ...never, cancelled: () => true });
    expect(screens).toEqual([]);
  });

  test('refuses a trio list without the current trio', () => {
    const job = { ...input(), currentKey: 'missing' };
    expect(() => runCaptainScreen(job, never)).toThrow(/current trio/);
  });
});

describe('the client', () => {
  test('the inline client runs the screen and rejects an aborted one', async () => {
    const client = createInlineClient();
    const job = input();
    const answer = await client.captains(job);
    expect(answer).toEqual(runCaptainScreen(job, never));
    const controller = new AbortController();
    controller.abort();
    await expect(client.captains(job, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    client.dispose();
  });
});
