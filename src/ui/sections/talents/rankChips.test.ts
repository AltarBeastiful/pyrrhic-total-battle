import { expect, test } from 'vitest';

import { keyRankPicks, rankChipLabel } from './rankChips';

test('key chips: first, held, next planned, midpoint and last, with no duplicates and at most five', () => {
  expect(keyRankPicks({ last: 20, bought: 6, plus: 2 })).toEqual([1, 6, 7, 10, 20]);
  expect(keyRankPicks({ last: 20, bought: 0, plus: 0 })).toEqual([1, 10, 20]);
  expect(keyRankPicks({ last: 3, bought: 1, plus: 1 })).toEqual([1, 2, 3]);
  expect(keyRankPicks({ last: 1, bought: 1, plus: 0 })).toEqual([1]);
  expect(keyRankPicks({ last: 20, bought: 20, plus: 0 })).toEqual([1, 10, 20]);
});

test('for every shape the picks are sorted, unique, in range and at most five', () => {
  for (let last = 1; last <= 40; last++)
    for (let bought = 0; bought <= last; bought++)
      for (const plus of [0, 1, 4]) {
        const p = keyRankPicks({ last, bought, plus });
        expect(p.length).toBeLessThanOrEqual(5);
        expect(new Set(p).size).toBe(p.length);
        expect([...p].sort((a, b) => a - b)).toEqual(p);
        expect(p.every((r) => r >= 1 && r <= last)).toBe(true);
      }
});

test('the label gives rank, cost, adds and total, and the state in words', () => {
  const values = [2, 5, 9];
  const costs = [1, 2, 3];
  expect(rankChipLabel({ name: 'Mining', rank: 2, values, costs, state: 'held' })).toBe(
    'Mining rank 2, held: costs 2 points, adds +3 %, total +5 %',
  );
  expect(rankChipLabel({ name: 'Mining', rank: 1, values, costs, state: 'plan' })).toBe(
    'Mining rank 1, planned: costs 1 point, adds +2 %, total +2 %',
  );
});
