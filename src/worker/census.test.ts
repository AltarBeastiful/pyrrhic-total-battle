/**
 * W18 P0.2b — **the JS layer's cache census** (`census.ts`): a note goes nowhere unless someone listens, the
 * counted `show` hands back the very answers the plain one does, and a pass's notes add up to the repeats a
 * cache would be hit by. The census changes no answer.
 */
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import { getUnits } from '@/data';
import { emptyTotals } from '@/engine';
import type { CampaignInput } from '@/engine/plan';
import type { StackRequest } from '@/engine/types';

import { runAdvisor } from './advisor';
import {
  CENSUS,
  countShows,
  noteCensus,
  startCensus,
  stableKey,
  summariseCensus,
  type CensusNote,
} from './census';
import { createInlineClient } from './client';
import { runProbe, type JobContext } from './jobs';
import { createCalcPool } from './pool';

test('is on under test, so the experiment can listen', () => {
  expect(CENSUS).toBe(true);
});

test('a stable key ignores the order an object was built in', () => {
  expect(stableKey({ a: 1, b: { c: [1, 2], d: 'x' } })).toBe(stableKey({ b: { d: 'x', c: [1, 2] }, a: 1 }));
  expect(stableKey({ a: 1 })).not.toBe(stableKey({ a: 2 }));
});

test('a note goes nowhere unless someone listens, and an inner listener hands the thread back', () => {
  let built = 0;
  const note = (): CensusNote => {
    built += 1;
    return { kind: 'bar', keys: [String(built)] };
  };
  noteCensus(note);
  expect(built).toBe(0);
  const outer = startCensus();
  noteCensus(note);
  const inner = startCensus();
  noteCensus(note);
  expect(inner.stop()).toEqual([{ kind: 'bar', keys: ['2'] }]);
  noteCensus(note);
  expect(outer.stop()).toEqual([
    { kind: 'bar', keys: ['1'] },
    { kind: 'bar', keys: ['3'] },
  ]);
});

test('the counted show is the plain one when nobody listens, and counts shows, hits and pricings when someone does', () => {
  const read = new Set<string>();
  const keyOf = (counts: Record<string, number>): string => JSON.stringify(counts);
  const show = (counts: Record<string, number>): number => {
    read.add(keyOf(counts));
    return Object.values(counts).reduce((a, b) => a + b, 0);
  };
  expect(countShows({}, keyOf, (key) => read.has(key), show)).toBe(show);
  const census = startCensus();
  const counted = countShows({ r: 1 }, keyOf, (key) => read.has(key), show);
  expect([counted({ a: 1 }), counted({ a: 2 }), counted({ a: 1 })]).toEqual([1, 2, 1]);
  const [note] = census.stop();
  expect(note).toMatchObject({ kind: 'probe', shows: 3, hits: 1 });
  expect(note?.kind === 'probe' && note.priced.map((one) => one.key)).toEqual([
    `${stableKey({ r: 1 })}|{"a":1}`,
    `${stableKey({ r: 1 })}|{"a":2}`,
  ]);
});

test('the summary counts repeats across jobs, repeated baselines and the bar priced again', () => {
  const priced = (...keys: string[]) => keys.map((key) => ({ key, ms: 2 }));
  const summary = summariseCensus([
    { kind: 'bar', keys: ['x', 'q'] },
    { kind: 'baseline', pass: 'advisor', key: 's' },
    { kind: 'probe', shows: 3, hits: 1, priced: priced('x', 'y') },
    { kind: 'probe', shows: 2, hits: 0, priced: priced('x', 'z') },
    { kind: 'baseline', pass: 'captains', key: 's' },
    { kind: 'probe', shows: 2, hits: 0, priced: priced('y', 'z') },
  ]);
  expect(summary).toEqual({
    jobs: 3,
    shows: 7,
    readHits: 1,
    priced: 6,
    distinctPriced: 3,
    repricedAcrossJobs: 3,
    repricedMs: 6,
    baselines: 2,
    repeatedBaselines: 1,
    barPricings: 2,
    barRepricedByProbes: 1,
  });
});

/** The planner's small army (`advisor.test.ts`). */
function campaign(): CampaignInput {
  const all = getUnits();
  const troops = all.filter((unit) => unit.pool === 'leadership' && unit.tier <= 3).slice(0, 4);
  const mercs = all.filter((unit) => unit.pool === 'authority' && unit.health <= 20_000).slice(0, 3);
  const caps: Record<string, number> = {};
  for (const merc of mercs) caps[merc.id] = 30;
  const request: StackRequest = {
    units: [...troops, ...mercs],
    caps,
    housing: { leadership: 4_000, authority: 2_000, dominance: 0 },
    totals: emptyTotals(),
    options: { method: 'elite', strictMercsAboveMonsters: false, monstersLast: false, roundTo10: false },
    enemy: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
    activeEvents: [],
    recovery: { templeLevel: 0, trainingCostReduction: {}, trainingSpeed: {}, plan: { mode: 'retrain' } },
  };
  return { request, marchTarget: CAMPAIGN.marches, ...CAMPAIGN.planFixes, putBack: CAMPAIGN.putBack };
}

const RUNNING: JobContext = { onProgress: () => undefined, cancelled: () => false };

describe('the census on the advisor', () => {
  test('a probe job answers the same counted or not, and notes every show', { timeout: 120_000 }, () => {
    const input = campaign();
    const plain = runProbe({ plan: input }, RUNNING);
    const census = startCensus();
    const counted = runProbe({ plan: input }, RUNNING);
    const notes = census.stop();
    expect(counted).toEqual(plain);
    expect(notes).toHaveLength(1);
    const [note] = notes;
    if (note?.kind !== 'probe') throw new Error('no probe note');
    expect(note.shows).toBe(plain.stops.length);
    expect(note.hits + note.priced.length).toBe(note.shows);
  });

  test(
    'two passes on one input repeat the baseline and every march of it',
    { timeout: 120_000 },
    async () => {
      const input = campaign();
      const pool = createCalcPool({
        size: 1,
        createClient: () => ({ ...createInlineClient(), mode: 'worker' }),
      });
      const census = startCensus();
      try {
        await runAdvisor(input, [], pool, { budgetMs: 1e9 });
        await runAdvisor(input, [], pool, { budgetMs: 1e9 });
      } finally {
        pool.dispose();
      }
      const summary = summariseCensus(census.stop());
      expect(summary).toMatchObject({ jobs: 2, baselines: 2, repeatedBaselines: 1 });
      expect(summary.priced).toBeGreaterThan(0);
      expect(summary.repricedAcrossJobs).toBe(summary.priced / 2);
      expect(summary.distinctPriced).toBe(summary.priced / 2);
    },
  );
});
