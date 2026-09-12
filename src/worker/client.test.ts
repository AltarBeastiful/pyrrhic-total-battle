import { describe, expect, test } from 'vitest';

import { getUnits } from '@/data';
import { emptyTotals } from '@/engine';
import type { StackRequest } from '@/engine/types';

import { createCalcClient, createInlineClient, isAbortError } from './client';

/** Three cheap leadership units and a small pool: enough to exercise the whole job body. */
function smallRequest(): StackRequest {
  const units = getUnits()
    .filter((unit) => unit.pool === 'leadership' && unit.tier <= 2)
    .slice(0, 3);
  expect(units.length).toBe(3);
  return {
    units,
    caps: {},
    housing: { leadership: 4100, authority: 0, dominance: 0 },
    totals: emptyTotals(),
    options: {
      method: 'elite',
      strictMercsAboveMonsters: false,
      monstersLast: false,
      roundTo10: false,
    },
    enemy: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
    activeEvents: [],
    recovery: { templeLevel: 0, trainingCostReduction: {}, trainingSpeed: {}, plan: { mode: 'retrain' } },
  };
}

describe('inline client', () => {
  test('sizes stacks and simulates the battle', async () => {
    const client = createInlineClient();
    const { result, summary } = await client.stack(smallRequest());
    expect(result.stacks.length).toBeGreaterThan(0);
    expect(result.pools.leadership.used).toBeLessThanOrEqual(result.pools.leadership.capacity);
    expect(summary.stackCount).toBe(result.stacks.length);
    expect(summary.avgDamage).toBeGreaterThan(0);
    client.dispose();
  });

  test('is asynchronous even though the job is synchronous', async () => {
    const client = createInlineClient();
    let settled = false;
    const promise = client.stack(smallRequest()).then(() => {
      settled = true;
    });
    expect(settled).toBe(false);
    await promise;
    expect(settled).toBe(true);
    client.dispose();
  });

  test('search returns a result with a score and the chosen unit ids', async () => {
    const client = createInlineClient();
    const found = await client.search({ request: smallRequest(), objective: 'avgDamage', budgetMs: 200 });
    expect(found.includedUnitIds.length).toBeGreaterThan(0);
    expect(Number.isFinite(found.score)).toBe(true);
    client.dispose();
  });

  test('an aborted signal rejects with an AbortError and never runs the job', async () => {
    const client = createInlineClient();
    const controller = new AbortController();
    controller.abort();
    await client.stack(smallRequest(), controller.signal).then(
      () => {
        throw new Error('should have rejected');
      },
      (error: unknown) => {
        expect(isAbortError(error)).toBe(true);
      },
    );
    client.dispose();
  });

  test('aborting while the job is queued rejects it', async () => {
    const client = createInlineClient();
    const controller = new AbortController();
    const promise = client.stack(smallRequest(), controller.signal);
    controller.abort();
    await expect(promise).rejects.toThrow(/cancelled/i);
    client.dispose();
  });

  test('a disposed client rejects new jobs', async () => {
    const client = createInlineClient();
    client.dispose();
    await expect(client.stack(smallRequest())).rejects.toThrow(/disposed/i);
  });
});

describe('createCalcClient', () => {
  test('falls back to the main thread when the platform has no Worker', async () => {
    expect(typeof Worker).toBe('undefined');
    const client = createCalcClient();
    expect(client.mode).toBe('inline');
    const { result } = await client.stack(smallRequest());
    expect(result.stacks.length).toBeGreaterThan(0);
    client.dispose();
  });

  test('falls back when constructing the worker throws', async () => {
    const globals = globalThis as { Worker?: unknown };
    globals.Worker = class {
      constructor() {
        throw new Error('blocked by CSP');
      }
    };
    try {
      const client = createCalcClient();
      expect(client.mode).toBe('inline');
      client.dispose();
    } finally {
      delete globals.Worker;
    }
  });
});
