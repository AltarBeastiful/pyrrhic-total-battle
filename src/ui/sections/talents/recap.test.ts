import { expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';

import { splitRecap, type RecapRow } from './recap';

const row = (label: string, size: number, ranks: number, maxRanks: number, now = size): RecapRow => ({
  label,
  now,
  after: size,
  ranks,
  maxRanks,
});
const filler = (n: number) => Array.from({ length: n }, (_, i) => row(`F${String(i)}`, 100 - i, 5, 10));

test('the threshold and the floor live in config', () => {
  expect(CAMPAIGN.talentRecap).toEqual({ minCompletion: 0.25, minRows: 4 });
});

test('a 1/20 family hides and a 1/1 family shows, given enough other rows', () => {
  const { shown, hidden } = splitRecap([...filler(4), row('Big', 1, 1, 20), row('Done', 0.5, 1, 1)]);
  expect(shown.map((r) => r.label)).toContain('Done');
  expect(hidden.map((r) => r.label)).toEqual(['Big']);
});

test('exactly 25 % shows, just under hides', () => {
  const rows = [...filler(4), row('Edge', 1, 1, 4), row('Under', 1, 24, 100)];
  const { hidden } = splitRecap(rows);
  expect(hidden.map((r) => r.label)).toEqual(['Under']);
});

test('fewer than 4 passing families: the 4 largest show anyway', () => {
  const rows = [
    row('A', 10, 1, 20),
    row('B', 40, 1, 20),
    row('C', 30, 1, 20),
    row('D', 20, 1, 20),
    row('E', 5, 1, 20),
  ];
  const { shown, hidden } = splitRecap(rows);
  expect(shown.map((r) => r.label)).toEqual(['B', 'C', 'D', 'A']);
  expect(hidden.map((r) => r.label)).toEqual(['E']);
});

test('rows keep the order by the larger of now and after, then name', () => {
  const rows = [
    row('Low', 5, 5, 10),
    row('Planned', 50, 5, 10, 1),
    row('Mid', 20, 5, 10),
    row('Aa', 20, 5, 10),
  ];
  expect(splitRecap(rows).shown.map((r) => r.label)).toEqual(['Planned', 'Aa', 'Mid', 'Low']);
});

test('nothing hidden when every family passes', () => {
  expect(splitRecap(filler(6)).hidden).toEqual([]);
});
