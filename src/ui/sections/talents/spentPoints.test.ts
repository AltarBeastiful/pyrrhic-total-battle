import { expect, test } from 'vitest';

import { talents as TALENTS } from '@/data';

import { spentPoints } from './spentPoints';

const nodes = [
  { id: 1, tree: 'battle', costs: [1, 2, 3] },
  { id: 2, tree: 'battle', costs: [10, 10, 10, 10] },
  { id: 3, tree: 'economy', costs: [5, 5] },
] as const;

test('points spent in a tree are the costs of the ranks held, nothing from other trees', () => {
  expect(spentPoints(nodes, 'battle', { '1': 2, '2': 3, '3': 2 })).toBe(1 + 2 + 30);
  expect(spentPoints(nodes, 'economy', { '1': 2, '3': 1 })).toBe(5);
  expect(spentPoints(nodes, 'battle', {})).toBe(0);
});

test('a rank above the maximum counts only the ranks that exist', () => {
  expect(spentPoints(nodes, 'battle', { '1': 9 })).toBe(6);
});

test('Army strength counts 10 points a rank', () => {
  const army = TALENTS.find((t) => t.name === 'Army strength')!;
  expect(spentPoints(TALENTS, army.tree, { [String(army.id)]: 3 })).toBe(30);
});
