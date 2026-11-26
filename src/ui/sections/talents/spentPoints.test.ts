import { describe, expect, it, test } from 'vitest';

import { talents as TALENTS } from '@/data';

import { lowestRank, spentPoints, stepsUpToNode, treePoints } from './spentPoints';

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

const grid = [
  { id: 1, tree: 'economy' as const, layout: { y: 0 } },
  { id: 2, tree: 'economy' as const, layout: { y: 1 } },
  { id: 3, tree: 'economy' as const, layout: { y: 1 } },
  { id: 4, tree: 'economy' as const, layout: { y: 2 } },
  { id: 9, tree: 'battle' as const, layout: { y: 0 } },
];
const stepList = [1, 9, 2, 4, 3].map((nodeId) => ({ nodeId }));
test('takes the tree up to the last step on the selected level, neighbours included', () => {
  expect(stepsUpToNode(grid, stepList, 2).map((s) => s.nodeId)).toEqual([1, 2, 4, 3]);
  expect(stepsUpToNode(grid, stepList, 1).map((s) => s.nodeId)).toEqual([1]);
});
test('a node outside the plan, or unknown, takes nothing', () => {
  expect(stepsUpToNode(grid, [{ nodeId: 1 }], 4)).toEqual([]);
  expect(stepsUpToNode(grid, stepList, 99)).toEqual([]);
});

describe('lowestRank', () => {
  const tree = [
    { id: 1, parents: [] },
    { id: 2, parents: [1] },
  ];
  it('keeps one rank on a node whose child is spent', () => {
    expect(lowestRank(tree, { '1': 3, '2': 1 }, 1)).toBe(1);
  });
  it('lets a node go to zero when nothing below it is spent', () => {
    expect(lowestRank(tree, { '1': 3 }, 1)).toBe(0);
    expect(lowestRank(tree, { '1': 3, '2': 1 }, 2)).toBe(0);
  });
});
