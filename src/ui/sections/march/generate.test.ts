/**
 * The one thing in `generate.ts` that is a sentence rather than a run: what a player is told when the engine
 * refuses (design rule 26 — "planCampaign: no feasible plan for this army" is not a sentence for a player).
 *
 * The refusal itself is the plan method's and is reachable: an account with no mercenaries has nothing to
 * spread over the marches, and the card offers the method to everybody.
 */
import { expect, test } from 'vitest';

import type { PlanRow } from '@/engine/plan';
import type { StackRequest } from '@/engine/types';
import type { CalcClient } from '@/worker/client';
import { abortError } from '@/worker/client';
import { createCalcPool } from '@/worker/pool';

import { priceBar, refusalOf } from './generate';
import type { PositionTrades } from './positions';

test('the plan method’s refusal is said in a player’s words', () => {
  const refusal = refusalOf(new Error('planCampaign: no feasible plan for this army'));
  expect(refusal).not.toMatch(/planCampaign|feasible/);
  expect(refusal).toContain('mercenaries');
});

test('any other failure is passed through, so a bug stays reportable', () => {
  expect(refusalOf(new Error('IndexedDB is unavailable'))).toBe('IndexedDB is unavailable');
  expect(refusalOf('not an error')).toBe('The calculation could not be finished.');
});

/** A client whose `positions` answers the stop's first count after `delay(count)` ms, and records who priced it. */
function pricer(name: string, priced: string[], fail?: number): CalcClient {
  return {
    mode: 'worker',
    dispose: () => undefined,
    positions: async ({ counts }: { counts: Record<string, number> }, signal?: AbortSignal) => {
      const n = counts.a ?? 0;
      await new Promise((resolve) => setTimeout(resolve, 40 - n * 10));
      if (signal?.aborted) throw abortError();
      priced.push(`${name}:${String(n)}`);
      if (n === fail) throw new Error('kernel said no');
      return { rows: [], n } as unknown as PositionTrades;
    },
  } as unknown as CalcClient;
}

const REQUEST = {} as StackRequest;
const ROWS = [0, 1, 2, 3].map((n) => ({ counts: { a: n } }) as unknown as PlanRow);

test('the bar is priced side by side on the advisor pool, answered in stop order, a failure as no table', async () => {
  const priced: string[] = [];
  let lanes = 0;
  const pool = createCalcPool({ size: 4, createClient: () => pricer(`w${String((lanes += 1))}`, priced, 2) });
  const run = pricer('run', priced);
  const tables = await priceBar(run, pool, REQUEST, ROWS, new AbortController().signal);
  pool.dispose();
  expect(tables.map((table) => (table as { n?: number } | null)?.n ?? null)).toEqual([0, 1, null, 3]);
  // Four lanes, the shortest last-sent finishing first: they ran side by side, none on the run's client.
  expect(priced.every((entry) => entry.startsWith('w'))).toBe(true);
  expect(priced.map((entry) => entry.split(':')[1])).toEqual(['3', '2', '1', '0']);
});

test('with no pool the bar is priced on the run client, a failure as no table, a cancel rejects', async () => {
  const priced: string[] = [];
  const tables = await priceBar(pricer('run', priced, 1), null, REQUEST, ROWS, new AbortController().signal);
  expect(tables.map((table) => (table as { n?: number } | null)?.n ?? null)).toEqual([0, null, 2, 3]);
  expect(priced.every((entry) => entry.startsWith('run'))).toBe(true);
  const controller = new AbortController();
  const pool = createCalcPool({ size: 2, createClient: () => pricer('w', []) });
  const cancelled = priceBar(pricer('run', []), pool, REQUEST, ROWS, controller.signal);
  controller.abort();
  await expect(cancelled).rejects.toThrow();
  pool.dispose();
});
