/** B-28 — **the ranking rows**: held rank, max rank, gain at max, gain per point from the baseline to max. */
import { describe, expect, test } from 'vitest';

import type { TalentRecord } from '@/data/types';
import type { TalentAnalysis } from '@/worker/talentAnalysis';

import { rankTalents } from './talentRanking';

const node = (id: number, costs: number[]): TalentRecord => ({
  id,
  name: `Talent ${String(id)}`,
  tree: 'battle',
  maxRank: costs.length,
  layout: { x: 0, y: 0, link: null, place: null, flipped: false },
  parents: [],
  stats: ['UNIT_POWER'],
  unitIds: [],
  values: costs.map(() => 1),
  costs,
});

const analysis = (ranks: number[], mean: number[]): TalentAnalysis => ({ ranks, shapes: [], mean });

describe('rankTalents', () => {
  const entries = [
    { node: node(1, [1, 1, 1, 1]), held: 0, analysis: analysis([0, 1, 2, 3, 4], [0, 1, 2, 3, 4]) }, // 4 % for 4 points
    { node: node(2, [2, 2]), held: 0, analysis: analysis([0, 1, 2], [0, 3, 6]) }, // 6 % for 4 points
    { node: node(3, [1, 1, 1]), held: 3, analysis: analysis([3], [0]) }, // already at max
    { node: node(4, [1, 1, 1, 1]), held: 2, analysis: analysis([2, 3, 4], [0, 5, 8]) }, // 8 % for 2 points
  ];

  test('rows carry held rank, max rank, gain at max and gain per point from the baseline', () => {
    const rows = rankTalents(entries);
    expect(rows.find((row) => row.id === 4)).toMatchObject({
      held: 2,
      max: 4,
      gainAtMax: 8,
      points: 2,
      perPoint: 4,
    });
    expect(rows.find((row) => row.id === 2)).toMatchObject({
      held: 0,
      max: 2,
      gainAtMax: 6,
      points: 4,
      perPoint: 1.5,
    });
  });

  test('the default sort is gain per point, best first, and a talent with nothing left to buy goes last', () => {
    expect(rankTalents(entries).map((row) => row.id)).toEqual([4, 2, 1, 3]);
    expect(rankTalents(entries).at(-1)).toMatchObject({ points: 0, perPoint: null });
  });

  test('another sort can be asked for', () => {
    expect(rankTalents(entries, 'gainAtMax').map((row) => row.id)).toEqual([4, 2, 1, 3]);
    expect(rankTalents(entries, 'name').map((row) => row.id)).toEqual([1, 2, 3, 4]);
  });
});
