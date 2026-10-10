/** W18 P1.3 — longest jobs first: the start order moves, the answers stay in the caller's order. */
import { describe, expect, test } from 'vitest';

import type { CalcClient } from './client';
import { expectedCosts, longestFirst, mapInOrder } from './jobOrder';
import { createCalcPool, type PoolJob } from './pool';

describe('jobOrder', () => {
  test('longest first, ties in the order given', () => {
    expect(longestFirst([3, 9, 3, 1, 9])).toEqual([1, 4, 0, 2, 3]);
    expect(longestFirst([])).toEqual([]);
  });

  test('the last pass times only when every job has one, else the proxy', () => {
    const times = new Map([
      ['a', 5],
      ['b', 7],
    ]);
    expect(expectedCosts(['a', 'b'], times, [1, 2])).toEqual([5, 7]);
    expect(expectedCosts(['a', 'c'], times, [1, 2])).toEqual([1, 2]);
  });

  test('jobs start in the order asked and answer in the order given, progress by the caller index', async () => {
    const started: number[] = [];
    const client = { mode: 'worker', dispose: () => undefined } as unknown as CalcClient;
    const pool = createCalcPool({ size: 1, createClient: () => client });
    const jobs = [0, 1, 2, 3].map((value): PoolJob<number> => () => {
      started.push(value);
      return Promise.resolve(value * 10);
    });
    const settled: number[] = [];
    const outcomes = await mapInOrder(pool, jobs, [2, 0, 3, 1], {
      onSettled: (index) => settled.push(index),
    });
    pool.dispose();
    expect(started).toEqual([2, 0, 3, 1]);
    expect(settled).toEqual([2, 0, 3, 1]);
    expect(outcomes).toEqual([0, 10, 20, 30].map((value) => ({ kind: 'done', value })));
  });
});
