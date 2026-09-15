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

/**
 * An army the planner can actually plan for: it needs troops *and* a hired stock, because a campaign is
 * built by spreading the stock over marches. These are the hired soldiers, not the monster-class units
 * that share the authority pool.
 */
function mercenaryRequest(): StackRequest {
  const all = getUnits();
  const troops = all.filter((unit) => unit.pool === 'leadership' && unit.tier <= 3).slice(0, 4);
  const mercs = all.filter((unit) => unit.pool === 'authority' && unit.health <= 20_000).slice(0, 3);
  const caps: Record<string, number> = {};
  for (const merc of mercs) caps[merc.id] = 20;
  return {
    ...smallRequest(),
    units: [...troops, ...mercs],
    caps,
    housing: { leadership: 4_000, authority: 2_000, dominance: 0 },
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

  test('the plan comes back from the army alone, with its marches and its frontier', async () => {
    const client = createInlineClient();
    const plan = await client.plan({ request: mercenaryRequest() });

    expect(plan.marches).toBeGreaterThan(0);
    expect(plan.totalDamage).toBeGreaterThan(0);
    expect(Object.keys(plan.march.counts).length).toBeGreaterThan(0);
    // The frontier is what the Plan fold draws: more than one plan, cheapest first.
    expect(plan.alternatives.length).toBeGreaterThan(1);
    const silver = plan.alternatives.map((point) => point.silver);
    expect([...silver].sort((a, b) => a - b)).toEqual(silver);
    // With no silver budget the answer is the most efficient plan it found.
    expect(plan.recommend).toBeDefined();
    client.dispose();
  }, 120_000);

  test('an aborted signal cancels a plan too', async () => {
    const client = createInlineClient();
    const controller = new AbortController();
    controller.abort();
    await expect(client.plan({ request: mercenaryRequest() }, controller.signal)).rejects.toThrow(
      /cancelled/i,
    );
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

  test('answers every job it can be sent, so no kind is left waiting for ever', async () => {
    // The client settles a job by switching on the response's `kind`, and a kind with no case there is a
    // promise nobody ever settles: the March pane sits on "Cancel" for ever, with no error and no
    // cancellation, which is exactly how the plan method behaved in the app (the switch had no `plan`,
    // and every test before this one ran the *inline* client, which never goes near it).
    //
    // The requests are stubs: the worker is a stand-in, so nothing reads them. What is under test is the
    // trip out and the trip back.
    const globals = globalThis as { Worker?: unknown };
    const seen: string[] = [];
    class StandInWorker {
      private readonly listeners = new Map<string, ((event: { data: unknown }) => void)[]>();
      addEventListener(type: string, listener: (event: { data: unknown }) => void): void {
        this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
      }
      terminate(): void {
        /* nothing to unwind */
      }
      postMessage(message: { kind: string; id: string }): void {
        seen.push(message.kind);
        // the reply `calc.worker.ts` posts, in the shape the client's guard asks for
        const data = { kind: message.kind, id: message.id, result: {}, summary: {} };
        for (const listener of this.listeners.get('message') ?? []) listener({ data });
      }
    }
    globals.Worker = StandInWorker as never;
    const withDeadline = async <T>(job: Promise<T>, what: string): Promise<T> =>
      Promise.race([
        job,
        new Promise<never>((_resolve, reject) =>
          setTimeout(() => reject(new Error(`${what} never came back from the worker`)), 2_000),
        ),
      ]);
    try {
      const client = createCalcClient();
      expect(client.mode).toBe('worker');
      const jobs: [string, Promise<unknown>][] = [
        ['stack', client.stack(smallRequest())],
        ['search', client.search({} as never)],
        ['plan', client.plan({ request: smallRequest() })],
      ];
      for (const [kind, job] of jobs) {
        await expect(withDeadline(job, kind)).resolves.toBeDefined();
      }
      expect(seen).toEqual(['stack', 'search', 'plan']);
      client.dispose();
    } finally {
      delete globals.Worker;
    }
  }, 20_000);
});
