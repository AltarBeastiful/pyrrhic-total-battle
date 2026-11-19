import { describe, expect, test } from 'vitest';

import { talents as realTalents } from '@/data';
import type { TalentRecord } from '@/data/types';
import {
  TALENT_GOALS,
  planTalents,
  unitKindOf,
  type TalentGoal,
  type TalentPlanInput,
  type UnitKind,
} from '@/engine/talents';

/** A node with only the fields the planner reads; the layout is irrelevant to it. */
function node(id: number, over: Partial<TalentRecord> & { values: number[] }): TalentRecord {
  const max = over.values.length;
  return {
    name: `Node ${id}`,
    tree: 'battle',
    maxRank: max,
    layout: { x: 0, y: 0, link: null, place: null, flipped: false },
    parents: [],
    stats: ['UNIT_POWER'],
    unitIds: [],
    costs: over.values.map(() => 1),
    ...over,
    id,
  };
}

const ALL: UnitKind[] = ['melee', 'ranged', 'mounted', 'flying', 'monsters', 'engineers'];

function plan(talents: TalentRecord[], over: Partial<TalentPlanInput> = {}) {
  return planTalents({
    talents,
    heroLevel: 200,
    points: 10,
    goal: 'battle',
    kinds: ALL,
    ...over,
  });
}

const ids = (steps: { nodeId: number }[]) => steps.map((s) => s.nodeId);

describe('unit kinds', () => {
  test.each([
    [1, 'ranged'],
    [6, 'melee'],
    [11, 'mounted'],
    [31, 'flying'],
    [149, 'monsters'], // a flying monster is a monster, not a flying troop
    [152, 'monsters'],
    [16, 'engineers'],
  ] as const)('game unit id %i is %s', (id, kind) => {
    expect(unitKindOf(id)).toBe(kind);
  });

  test('an id the game lists in no category has no kind', () => {
    expect(unitKindOf(999999)).toBeNull();
  });

  test('every id of the game category nodes maps to that category (monsters excepted)', () => {
    const byName: Array<[string, UnitKind]> = [
      ["Melee units' health I", 'melee'],
      ["Ranged units' health I", 'ranged'],
      ["Mounted units' health I", 'mounted'],
      ["Flying units' health I", 'flying'],
    ];
    for (const [name, kind] of byName) {
      const t = realTalents.find((r) => r.name === name)!;
      for (const id of t.unitIds) {
        expect(unitKindOf(id) === kind || unitKindOf(id) === 'monsters').toBe(true);
      }
    }
    const mon = realTalents.find((r) => r.name === "Monsters' health I")!;
    expect(mon.unitIds.every((id) => unitKindOf(id) === 'monsters')).toBe(true);
  });
});

describe('goals', () => {
  test('goals are sets of stat kinds, and a stat kind can be in no more than one goal', () => {
    const goals = Object.keys(TALENT_GOALS) as TalentGoal[];
    expect(goals.sort()).toEqual(['archeology', 'battle', 'economy']);
    const seen = new Set<string>();
    for (const g of goals) {
      for (const s of TALENT_GOALS[g]) {
        expect(seen.has(s)).toBe(false);
        seen.add(s);
      }
    }
  });

  test('every stat kind in the real table belongs to a goal', () => {
    const all = new Set(Object.values(TALENT_GOALS).flat());
    const missing = new Set(realTalents.flatMap((t) => t.stats).filter((s) => !all.has(s)));
    expect([...missing]).toEqual([]);
  });
});

describe('planTalents on small tables', () => {
  test('a single node is raised rank by rank with its gain per rank', () => {
    const r = plan([node(1, { values: [1, 3, 6] })], { points: 3 });
    expect(r.steps.map((s) => [s.nodeId, s.rank, s.cost, s.value])).toEqual([
      [1, 1, 1, 1],
      [1, 2, 1, 2],
      [1, 3, 1, 3],
    ]);
    expect(r.pointsSpent).toBe(3);
    expect(r.pointsLeft).toBe(0);
  });

  test('a weak parent is bought to open a strong child and the step says so', () => {
    const t = [
      node(1, { values: [0.1], stats: ['MINE_PRODUCTION_SPEED'] }), // not in the goal: worth 0
      node(2, { values: [50], parents: [1] }),
      node(3, { values: [1] }), // a modest free node
    ];
    const r = plan(t, { points: 2 });
    expect(ids(r.steps)).toEqual([1, 2]);
    expect(r.steps[0]!.opens).toBe(2);
    expect(r.steps[1]!.opens).toBeNull();
    expect(r.steps[1]!.value).toBe(50);
  });

  test('a parent that is itself worth little is taken for a child worth more per point than the best free node', () => {
    const t = [
      node(1, { values: [1] }),
      node(2, { values: [9], parents: [1] }), // (1 + 9) / 2 = 5 per point
      node(3, { values: [3] }), // 3 per point
    ];
    expect(ids(plan(t, { points: 2 }).steps)).toEqual([1, 2]);
  });

  test('a node behind a hero-level gate is refused until the level reaches it', () => {
    const t = [node(1, { values: [100], levelGate: 105 }), node(2, { values: [1] })];
    expect(ids(plan(t, { heroLevel: 104, points: 1 }).steps)).toEqual([2]);
    expect(ids(plan(t, { heroLevel: 105, points: 1 }).steps)).toEqual([1]);
  });

  test('a child under a gated parent is refused too', () => {
    const t = [
      node(1, { values: [1], levelGate: 65 }),
      node(2, { values: [100], parents: [1] }),
      node(3, { values: [1] }),
    ];
    expect(ids(plan(t, { heroLevel: 30, points: 3 }).steps)).toEqual([3]);
  });

  test('a node with two parents needs a rank in each', () => {
    const t = [
      node(1, { values: [1] }),
      node(2, { values: [1] }),
      node(3, { values: [90], parents: [1, 2] }),
    ];
    const r = plan(t, { points: 3 });
    expect(ids(r.steps)).toEqual([1, 2, 3]);
    expect(r.steps.map((s) => s.opens)).toEqual([3, 3, null]);
  });

  test('a rank that costs 10 is compared with other ranks by value per point', () => {
    const t = [
      node(1, { values: [8], costs: [10] }), // 0.8 per point
      node(2, { values: [1, 2, 3], costs: [1, 1, 1] }), // 1 per point
    ];
    expect(ids(plan(t, { points: 10 }).steps)).toEqual([2, 2, 2]);
    // with a bigger pool the dear rank still comes after the cheaper ones, and fits only when affordable
    const r = plan(t, { points: 13 });
    expect(ids(r.steps)).toEqual([2, 2, 2, 1]);
    expect(r.pointsSpent).toBe(13);
    const rich = node(1, { values: [20], costs: [10] }); // 2 per point beats 1 per point
    expect(ids(plan([rich, t[1]!], { points: 13 }).steps)).toEqual([1, 2, 2, 2]);
  });

  test('a rank is never planned that the remaining points cannot pay', () => {
    const t = [node(1, { values: [30], costs: [10] }), node(2, { values: [1] })];
    const r = plan(t, { points: 9 });
    expect(ids(r.steps)).toEqual([2]);
    expect(r.pointsLeft).toBe(8);
  });

  test('running out of points mid-path stops at the last affordable rank', () => {
    const t = [node(1, { values: [1, 2, 3, 4, 5] })];
    const r = plan(t, { points: 2 });
    expect(r.steps.map((s) => s.rank)).toEqual([1, 2]);
    expect(r.pointsLeft).toBe(0);
  });

  test('a path whose opening step cannot be paid together with its target is not started', () => {
    const t = [node(1, { values: [0.1] }), node(2, { values: [99], parents: [1] })];
    // one point: the parent alone is worth 0.1, so that is all there is to take
    const r = plan(t, { points: 1 });
    expect(ids(r.steps)).toEqual([1]);
    expect(r.steps[0]!.opens).toBeNull();
  });

  test('a bonus for a unit kind the player does not field counts for nothing', () => {
    const t = [
      node(1, { values: [50], unitIds: [31] }), // flying
      node(2, { values: [1], unitIds: [6] }), // melee
    ];
    expect(ids(plan(t, { kinds: ['melee'], points: 1 }).steps)).toEqual([2]);
    expect(ids(plan(t, { kinds: ['flying'], points: 1 }).steps)).toEqual([1]);
  });

  test('forcing a kind on is the same as fielding it', () => {
    const t = [node(1, { values: [50], unitIds: [31] })];
    expect(plan(t, { kinds: [], points: 1 }).steps).toEqual([]);
    expect(ids(plan(t, { kinds: new Set<UnitKind>(['flying']), points: 1 }).steps)).toEqual([1]);
  });

  test('with no monsters the monster bonuses count for nothing', () => {
    const t = [node(1, { values: [50], unitIds: [150, 151, 152] }), node(2, { values: [1], unitIds: [6] })];
    expect(ids(plan(t, { kinds: ['melee', 'ranged', 'mounted', 'flying'], points: 1 }).steps)).toEqual([2]);
    expect(ids(plan(t, { kinds: ['monsters'], points: 1 }).steps)).toEqual([1]);
  });

  test('a bonus that lists several kinds counts when any one is fielded', () => {
    const t = [node(1, { values: [5], unitIds: [1, 6, 11, 31] })];
    expect(ids(plan(t, { kinds: ['mounted'], points: 1 }).steps)).toEqual([1]);
  });

  test('a bonus that is not about units counts whatever is fielded', () => {
    const t = [node(1, { values: [5], stats: ['MINE_PRODUCTION_SPEED'], unitIds: [1001] })];
    expect(ids(plan(t, { goal: 'economy', kinds: [], points: 1 }).steps)).toEqual([1]);
  });

  test('two nodes on the same stat add up in the totals', () => {
    const t = [node(1, { values: [2, 5] }), node(2, { values: [3, 4] })];
    const r = plan(t, { points: 4 });
    expect(r.before.UNIT_POWER ?? 0).toBe(0);
    expect(r.after.UNIT_POWER).toBe(9);
  });

  test('stats outside the goal are neither planned nor totalled', () => {
    const t = [
      node(1, { values: [7], stats: ['MINE_PRODUCTION_SPEED'] }),
      node(2, { values: [1], stats: ['UNIT_HEALTH'] }),
    ];
    const r = plan(t, { points: 2 });
    expect(ids(r.steps)).toEqual([2]);
    expect(Object.keys(r.after)).toEqual(['UNIT_HEALTH']);
  });

  test('equal weights keep one order, a changed weight reverses it', () => {
    const t = [
      node(1, { values: [3], stats: ['UNIT_POWER'] }),
      node(2, { values: [2], stats: ['UNIT_HEALTH'] }),
    ];
    expect(ids(plan(t, { points: 2 }).steps)).toEqual([1, 2]);
    expect(ids(plan(t, { points: 2, weights: { UNIT_HEALTH: 2 } }).steps)).toEqual([2, 1]);
  });

  test('a weight of zero removes a stat from the plan', () => {
    const t = [node(1, { values: [3] }), node(2, { values: [2], stats: ['UNIT_HEALTH'] })];
    expect(ids(plan(t, { points: 2, weights: { UNIT_POWER: 0 } }).steps)).toEqual([2]);
  });

  test('a price cut is a gain: the more negative the better', () => {
    const t = [
      node(1, { values: [-2], stats: ['SKLEP_PRICE_CUT'] }),
      node(2, { values: [-4], stats: ['SKLEP_PRICE_CUT'] }),
    ];
    expect(ids(plan(t, { goal: 'archeology', points: 1 }).steps)).toEqual([2]);
  });

  test('a plan starts from the ranks already bought and never lowers one', () => {
    const t = [node(1, { values: [1, 2, 4, 8] })];
    const r = plan(t, { ranks: { 1: 2 }, points: 5 });
    expect(r.steps.map((s) => [s.rank, s.value])).toEqual([
      [3, 2],
      [4, 4],
    ]);
    expect(r.before.UNIT_POWER).toBe(2);
    expect(r.after.UNIT_POWER).toBe(8);
    expect(r.pointsSpent).toBe(2);
    expect(r.pointsLeft).toBe(3);
  });

  test('ranks above the maximum or for unknown nodes are clamped or ignored', () => {
    const t = [node(1, { values: [1, 2] })];
    const r = plan(t, { ranks: { 1: 9, 77: 3 }, points: 5 });
    expect(r.steps).toEqual([]);
    expect(r.after.UNIT_POWER).toBe(2);
  });

  test('a child already bought does not stop its parent from being raised', () => {
    const t = [node(1, { values: [1, 2] }), node(2, { values: [9], parents: [1] })];
    const r = plan(t, { ranks: { 2: 1 }, points: 1 });
    expect(ids(r.steps)).toEqual([1]);
  });

  test('no points means no steps and an empty plan explains nothing is spent', () => {
    const r = plan([node(1, { values: [1] })], { points: 0 });
    expect(r.steps).toEqual([]);
    expect(r.pointsSpent).toBe(0);
  });

  test('nothing in the goal worth anything means no steps and the points are left', () => {
    const r = plan([node(1, { values: [1], stats: ['MINE_PRODUCTION_SPEED'] })], { points: 4 });
    expect(r.steps).toEqual([]);
    expect(r.pointsLeft).toBe(4);
  });

  test('nodes the hero cannot open are reported with their reason', () => {
    const t = [
      node(1, { values: [1], levelGate: 105 }),
      node(2, { values: [1], parents: [3] }),
      node(3, { values: [1] }),
      node(4, { values: [1], parents: [1] }),
    ];
    const r = plan(t, { heroLevel: 50, points: 0 });
    expect(r.locked[1]).toEqual({ reason: 'level', level: 105 });
    expect(r.locked[2]).toEqual({ reason: 'parent', level: null });
    expect(r.locked[3]).toBeUndefined();
    expect(r.locked[4]).toEqual({ reason: 'level', level: 105 });
  });

  test('the next gate previews the best node it opens', () => {
    const t = [
      node(1, { values: [1] }),
      node(2, { values: [5, 10], levelGate: 105 }),
      node(3, { values: [4], levelGate: 105 }),
      node(4, { values: [90], levelGate: 145 }),
    ];
    const r = plan(t, { heroLevel: 100, points: 1 });
    expect(r.nextGate).toEqual({ level: 105, nodeId: 2, value: 10, points: 2 });
    expect(plan(t, { heroLevel: 105, points: 1 }).nextGate?.level).toBe(145);
    expect(plan(t, { heroLevel: 200, points: 1 }).nextGate).toBeNull();
  });

  test('a gate that opens nothing worth anything is skipped in the preview', () => {
    const t = [
      node(1, { values: [5], levelGate: 105, unitIds: [31] }),
      node(2, { values: [3], levelGate: 145 }),
    ];
    expect(plan(t, { heroLevel: 100, kinds: ['melee'], points: 0 }).nextGate?.level).toBe(145);
  });
});

describe('planTalents on the real table', () => {
  const goals: TalentGoal[] = ['battle', 'economy', 'archeology'];
  const byId = new Map(realTalents.map((t) => [t.id, t]));

  test.each([
    [10, 0],
    [24, 20],
    [86, 300],
    [150, 600],
    [400, 600],
  ])('level %i, %i points: every step is affordable and open at its moment', (heroLevel, points) => {
    for (const goal of goals) {
      const r = planTalents({ talents: realTalents, heroLevel, points, goal, kinds: ALL });
      const held = new Map<number, number>();
      let spent = 0;
      for (const s of r.steps) {
        const t = byId.get(s.nodeId)!;
        expect(s.rank).toBe((held.get(s.nodeId) ?? 0) + 1);
        expect(s.cost).toBe(t.costs[s.rank - 1]);
        if (s.rank === 1) {
          if (t.levelGate) expect(heroLevel).toBeGreaterThanOrEqual(t.levelGate);
          for (const p of t.parents) expect(held.get(p) ?? 0).toBeGreaterThanOrEqual(1);
        }
        held.set(s.nodeId, s.rank);
        spent += s.cost;
        expect(spent).toBeLessThanOrEqual(points);
      }
      expect(r.pointsSpent).toBe(spent);
      expect(r.pointsSpent + r.pointsLeft).toBe(points);
    }
  });

  test('a level below 25 plans no node that has a gate; a level of 350 opens the last one', () => {
    const low = planTalents({ talents: realTalents, heroLevel: 24, points: 600, goal: 'battle', kinds: ALL });
    for (const s of low.steps) expect(byId.get(s.nodeId)!.levelGate ?? 0).toBeLessThan(25);
    const at350 = planTalents({
      talents: realTalents,
      heroLevel: 349,
      points: 600,
      goal: 'battle',
      kinds: ALL,
    });
    for (const s of at350.steps) expect(byId.get(s.nodeId)!.levelGate ?? 0).toBeLessThan(350);
  });

  test('a plan from the ranks already bought never lowers or repeats a rank', () => {
    const first = planTalents({
      talents: realTalents,
      heroLevel: 150,
      points: 40,
      goal: 'battle',
      kinds: ALL,
    });
    const ranks: Record<number, number> = {};
    for (const s of first.steps) ranks[s.nodeId] = s.rank;
    const next = planTalents({
      talents: realTalents,
      heroLevel: 150,
      points: 40,
      goal: 'battle',
      kinds: ALL,
      ranks,
    });
    for (const s of next.steps) expect(s.rank).toBeGreaterThan(ranks[s.nodeId] ?? 0);
    expect(next.before).toEqual(first.after);
  });

  test('a battle plan for a player with melee only never buys a flying-only or monster-only node', () => {
    const r = planTalents({
      talents: realTalents,
      heroLevel: 150,
      points: 300,
      goal: 'battle',
      kinds: ['melee'],
    });
    const flying = new Set(realTalents.filter((t) => /^Flying units'/.test(t.name)).map((t) => t.id));
    const monsters = new Set(realTalents.filter((t) => /^Monsters'/.test(t.name)).map((t) => t.id));
    for (const s of r.steps) {
      if (flying.has(s.nodeId) || monsters.has(s.nodeId)) expect(s.opens).not.toBeNull();
    }
  });

  test('the plan is a pure function: same input, same output, input untouched', () => {
    const ranks = { [realTalents[0]!.id]: 1 };
    const args = {
      talents: realTalents,
      heroLevel: 120,
      points: 60,
      goal: 'economy' as const,
      kinds: ALL,
      ranks,
    };
    const a = planTalents(args);
    const b = planTalents(args);
    expect(a).toEqual(b);
    expect(ranks).toEqual({ [realTalents[0]!.id]: 1 });
  });

  test('a full plan from zero at level 200 with 600 points is computed quickly', () => {
    const t0 = performance.now();
    planTalents({ talents: realTalents, heroLevel: 200, points: 600, goal: 'battle', kinds: ALL });
    expect(performance.now() - t0).toBeLessThan(1500);
  });
});
