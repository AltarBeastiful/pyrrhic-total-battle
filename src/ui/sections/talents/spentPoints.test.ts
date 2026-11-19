import { expect, test } from 'vitest';

import { talents as TALENTS } from '@/data';

import { spentPoints, treePoints } from './spentPoints';

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

// Regression: the head showed 0 although the plan had allocated points, because only held ranks were counted.
const steps = [
  { nodeId: 1, rank: 3, cost: 3, filler: false },
  { nodeId: 2, rank: 1, cost: 10, filler: false },
  { nodeId: 2, rank: 2, cost: 10, filler: true },
  { nodeId: 3, rank: 1, cost: 5, filler: false },
];

test('held ranks only: spent counts them and nothing is planned', () => {
  expect(treePoints(nodes, 'battle', { '1': 2 }, [])).toEqual({ spent: 3, planned: 0 });
});

test('planned steps only: spent is 0 and the plan counts, fillers included, in its own tree', () => {
  expect(treePoints(nodes, 'battle', {}, steps)).toEqual({ spent: 0, planned: 23 });
  expect(treePoints(nodes, 'economy', {}, steps)).toEqual({ spent: 0, planned: 5 });
});

test('both: held ranks and the plan are counted apart', () => {
  expect(treePoints(nodes, 'battle', { '1': 2 }, steps)).toEqual({ spent: 3, planned: 23 });
});
