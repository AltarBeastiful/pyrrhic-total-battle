import { describe, expect, test } from 'vitest';

import { talents as realTalents } from '@/data';
import { TALENT_TREES, type TalentRecord } from '@/data/types';
import {
  DEFAULT_TALENT_PRIORITY,
  withDefaultStatWeights,
  strengthShareOf,
  STRENGTH_SHARES,
  goalOfTree,
  TALENT_GOALS,
  TALENT_RANK_WEIGHTS,
  planTalentPriorities,
  planTalents,
  rankGain,
  talentReach,
  talentGoalWeights,
  unitKindOf,
  type TalentGoal,
  type TalentPlanInput,
  type TalentPriority,
  type TalentPriorityInput,
  type TalentPriorityPlan,
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
    expect(plan(t, { kinds: [], points: 1 }).steps.filter((s) => !s.filler)).toEqual([]);
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
    expect(ids(r.steps.filter((s) => !s.filler))).toEqual([2]);
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
    expect(ids(plan(t, { points: 2, weights: { UNIT_POWER: 0 } }).steps.filter((s) => !s.filler))).toEqual([
      2,
    ]);
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

  test('nothing in the goal worth anything still spends the points, as flagged fillers worth 0', () => {
    const r = plan([node(1, { values: [1, 1, 1], stats: ['MINE_PRODUCTION_SPEED'] })], { points: 4 });
    expect(r.steps.map((s) => [s.nodeId, s.rank, s.value, s.filler])).toEqual([
      [1, 1, 0, true],
      [1, 2, 0, true],
      [1, 3, 0, true],
    ]);
    expect(r.pointsSpent).toBe(3);
    expect(r.pointsLeft).toBe(1); // nothing left to buy
  });

  test('steps bought for their value are not fillers', () => {
    const r = plan([node(1, { values: [1, 2] })], { points: 2 });
    expect(r.steps.every((s) => !s.filler)).toBe(true);
  });

  test('a remainder smaller than the cheapest buyable rank is the only thing left over', () => {
    const t = [
      node(1, { values: [5], costs: [10] }),
      node(2, { values: [0], costs: [10], stats: ['MINE_PRODUCTION_SPEED'] }),
    ];
    const r = plan(t, { points: 25 });
    expect(r.pointsLeft).toBe(5);
    expect(r.steps.map((s) => [s.nodeId, s.filler])).toEqual([
      [1, false],
      [2, true],
    ]);
  });

  test('fillers open the parents of valuable nodes first, then the cheapest waste', () => {
    const t = [
      node(1, { values: [0, 0], stats: ['MINE_PRODUCTION_SPEED'], levelGate: 50 }), // gated now
      node(2, { values: [0, 0], stats: ['MINE_PRODUCTION_SPEED'] }), // parent of a valuable node out of reach
      node(3, { values: [9], parents: [2], levelGate: 50 }),
      node(4, { values: [0, 0], stats: ['MINE_PRODUCTION_SPEED'] }), // unrelated
    ];
    const r = plan(t, { points: 2, heroLevel: 10 });
    expect(r.steps.map((s) => [s.nodeId, s.filler])).toEqual([
      [2, true],
      [2, true],
    ]);
  });

  test('a filler never breaks a gate or a parent rule', () => {
    const t = [
      node(1, { values: [0], stats: ['MINE_PRODUCTION_SPEED'], levelGate: 99 }),
      node(2, { values: [0], stats: ['MINE_PRODUCTION_SPEED'], parents: [1] }),
    ];
    const r = plan(t, { points: 5, heroLevel: 10 });
    expect(r.steps).toEqual([]);
    expect(r.pointsLeft).toBe(5);
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
      if (!s.filler && (flying.has(s.nodeId) || monsters.has(s.nodeId))) expect(s.opens).not.toBeNull();
    }
  });

  describe('every point is spent', () => {
    const cheapest = (
      r: ReturnType<typeof planTalents>,
      heroLevel: number,
      ranks: Record<number, number>,
    ) => {
      for (const s of r.steps) ranks[s.nodeId] = s.rank;
      let min = Infinity;
      for (const t of realTalents) {
        const cur = ranks[t.id] ?? 0;
        if (cur >= t.maxRank) continue;
        if (cur === 0 && ((t.levelGate ?? 0) > heroLevel || t.parents.some((p) => (ranks[p] ?? 0) < 1)))
          continue;
        min = Math.min(min, t.costs[cur]!);
      }
      return min;
    };

    test.each([
      ['all', ALL],
      ['melee', ['melee']],
      ['none', []],
    ] as const)('Battle, %s kinds, leaves less than the cheapest buyable rank', (_n, kinds) => {
      for (const heroLevel of [1, 24, 50, 64, 65, 150, 300, 400]) {
        for (const points of [100, 300, 600, 1500]) {
          const r = planTalents({ talents: realTalents, heroLevel, points, goal: 'battle', kinds });
          expect(r.pointsSpent + r.pointsLeft).toBe(points);
          expect(r.pointsLeft).toBeLessThan(cheapest(r, heroLevel, {}));
        }
      }
    });

    test('Battle at level 150 with 300 points buys Expert nodes', () => {
      const r = planTalents({
        talents: realTalents,
        heroLevel: 150,
        points: 300,
        goal: 'battle',
        kinds: ALL,
      });
      const expert = new Set(realTalents.filter((t) => t.tree === 'expert').map((t) => t.id));
      expect(r.steps.some((s) => expert.has(s.nodeId) && !s.filler)).toBe(true);
    });

    test('a level below the Expert gate spends its points on the battle tree and fills the rest', () => {
      const r = planTalents({
        talents: realTalents,
        heroLevel: 50,
        points: 1500,
        goal: 'battle',
        kinds: ALL,
      });
      expect(r.steps.some((s) => s.filler)).toBe(true);
      expect(r.pointsLeft).toBeGreaterThan(0); // the whole open table is bought
    });
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

describe('rankGain', () => {
  test('is the table figure of a rank minus the one before it', () => {
    expect(rankGain([1, 3, 6], 1)).toBe(1);
    expect(rankGain([1, 3, 6], 3)).toBe(3);
  });
});

describe('a node that carries two stats on one series of figures', () => {
  test('is worth its dearest in-goal stat, not the sum of both', () => {
    const two = node(1, { values: [4], stats: ['CARAVAN_CAPACITY', 'CLAN_CARAVAN_CAPACITY'] });
    const one = node(2, { values: [5], stats: ['CARAVAN_SPEED'] });
    const r = plan([two, one], { goal: 'economy', points: 1 });
    expect(ids(r.steps)).toEqual([2]);
    expect(plan([two], { goal: 'economy', points: 1 }).steps[0]!.value).toBe(4);
    const weighted = plan([two], {
      goal: 'economy',
      points: 1,
      weights: { CARAVAN_CAPACITY: 0.5, CLAN_CARAVAN_CAPACITY: 2 },
    });
    expect(weighted.steps[0]!.value).toBe(8);
  });
});

describe('the next gate', () => {
  test('counts the missing ancestors in what it costs and is worth', () => {
    const t = [
      node(1, { values: [1], levelGate: 105, costs: [7] }),
      node(2, { values: [10], parents: [1], levelGate: 105, costs: [3] }),
    ];
    const r = plan(t, { heroLevel: 100, points: 0 });
    // node 2 alone: 10 for 3 points (3.33 a point); with its parent: 11 for 10 (1.1 a point), node 1 alone: 1 for 7.
    expect(r.nextGate).toEqual({ level: 105, nodeId: 2, value: 11, points: 10 });
  });

  test('skips a node that already holds a rank', () => {
    const t = [node(1, { values: [9], levelGate: 105 }), node(2, { values: [3], levelGate: 105 })];
    const r = plan(t, { heroLevel: 100, points: 0, ranks: { 1: 1 } });
    expect(r.nextGate?.nodeId).toBe(2);
  });
});

describe('a parent id that is not in the table', () => {
  test('is a broken table, not a satisfied condition', () => {
    const t = [node(1, { values: [1], parents: [99] })];
    expect(() => plan(t)).toThrow(/99/);
  });
});

describe('planTalentPriorities', () => {
  const eco = (id: number, values: number[], over: Partial<TalentRecord> = {}) =>
    node(id, { values, stats: ['STORAGE_BOOST'], tree: 'economy', ...over });
  const arch = (id: number, values: number[], over: Partial<TalentRecord> = {}) =>
    node(id, { values, stats: ['SKLEP_STRIKE_DAMAGE'], tree: 'archeology', ...over });
  const prio = (
    talents: TalentRecord[],
    priority: Partial<TalentPriority> = {},
    over: Partial<Omit<TalentPriorityInput, 'priority'>> = {},
  ) =>
    planTalentPriorities({
      talents,
      heroLevel: 200,
      points: 10,
      kinds: ALL,
      priority: { ...DEFAULT_TALENT_PRIORITY, ...priority },
      ...over,
    });
  const tagged = (steps: { nodeId: number; goal: TalentGoal | null }[]) =>
    steps.map((s) => [s.nodeId, s.goal]);
  /**
   * One active goal against the single-goal planner: the steps bought for value, the totals before and the
   * locks are the same; the fillers differ only in that they never land in an ignored goal's tree (`planTalents`
   * ignores nothing, so its fillers may), and so may the next gate's cost (it counts the ancestors still
   * missing). When none of the single-goal fillers sat in an ignored tree, the plans are equal.
   */
  const expectSingleGoalPlan = (
    talents: readonly TalentRecord[],
    r: TalentPriorityPlan,
    single: ReturnType<typeof planTalents>,
    goal: TalentGoal,
  ) => {
    const treeOf = new Map(talents.map((t) => [t.id, t.tree]));
    const inGoal = (s: { nodeId: number }) => goalOfTree(treeOf.get(s.nodeId)!) === goal;
    const valueSteps = single.steps.filter((s) => !s.filler);
    const steps = r.steps.map(({ goal: _g, ...s }) => s);
    expect(steps.slice(0, valueSteps.length)).toEqual(valueSteps);
    for (const s of steps.slice(valueSteps.length)) {
      expect(s.filler).toBe(true);
      expect(inGoal(s)).toBe(true);
    }
    expect(r.before).toEqual(single.before);
    expect(r.locked).toEqual(single.locked);
    if (single.steps.every((s) => !s.filler || inGoal(s))) {
      const { steps: _s, ...rest } = r;
      const { steps: _ss, ...singleRest } = single;
      expect(steps).toEqual(single.steps);
      expect(rest).toEqual(singleRest);
    }
  };
  const only = (goal: TalentGoal): Partial<TalentPriority> => ({
    order: [goal, ...(Object.keys(TALENT_GOALS) as TalentGoal[]).filter((g) => g !== goal)],
    ignored: Object.fromEntries((Object.keys(TALENT_GOALS) as TalentGoal[]).map((g) => [g, g !== goal])),
  });

  describe('the model', () => {
    test('the default is Battle, Archeology, Economy, nothing ignored, Focus, Blended', () => {
      expect(DEFAULT_TALENT_PRIORITY).toEqual({
        order: ['battle', 'archeology', 'economy'],
        ignored: {},
        strength: 'focus',
        mode: 'blended',
      });
    });

    test('the weights per rank are Focus 1/0.5/0.25, Lean 1/0.8/0.6, Even 1/1/1', () => {
      expect(TALENT_RANK_WEIGHTS).toEqual({ focus: [1, 0.5, 0.25], lean: [1, 0.8, 0.6], even: [1, 1, 1] });
    });

    test.each([
      ['Focus, default order', {}, { battle: 1, archeology: 0.5, economy: 0.25 }],
      ['Lean, default order', { strength: 'lean' }, { battle: 1, archeology: 0.8, economy: 0.6 }],
      ['Even', { strength: 'even' }, { battle: 1, archeology: 1, economy: 1 }],
      [
        'Battle ignored: Archeology is rank 1',
        { ignored: { battle: true } },
        { battle: 0, archeology: 1, economy: 0.5 },
      ],
      [
        'Economy first, Battle last',
        { order: ['economy', 'archeology', 'battle'] },
        { economy: 1, archeology: 0.5, battle: 0.25 },
      ],
      [
        'an order missing a goal ranks it last',
        { order: ['economy'] },
        { economy: 1, battle: 0.5, archeology: 0.25 },
      ],
    ] as const)('%s', (_name, p, weights) => {
      expect(talentGoalWeights({ ...DEFAULT_TALENT_PRIORITY, ...(p as Partial<TalentPriority>) })).toEqual(
        weights,
      );
    });
  });

  describe('one active goal', () => {
    const mixed = [
      node(1, { values: [1, 3] }),
      node(2, { values: [9], parents: [1] }),
      eco(3, [4, 5]),
      eco(4, [0.1]),
      eco(5, [30], { parents: [4] }),
      arch(6, [2, 2]),
      arch(7, [-3], { stats: ['SKLEP_PRICE_CUT'], levelGate: 250 }),
      node(8, { values: [7], unitIds: [31] }),
    ];

    test.each(['battle', 'economy', 'archeology'] as const)(
      '%s alone gives the single-goal plan, fillers kept in its own trees, every value step tagged with it',
      (goal) => {
        for (const mode of ['blended', 'strict'] as const) {
          for (const points of [0, 3, 10, 40]) {
            const r = prio(mixed, { ...only(goal), mode }, { points, kinds: ['melee'] });
            const single = planTalents({ talents: mixed, heroLevel: 200, points, goal, kinds: ['melee'] });
            expectSingleGoalPlan(mixed, r, single, goal);
            for (const s of r.steps) expect(s.goal).toBe(s.filler ? null : goal);
          }
        }
      },
    );
  });

  describe('Blended', () => {
    test.each([
      ['Focus: a Battle step goes before an Economy step of equal value', 'focus', 3, [1]],
      ['Focus: but not before a much stronger Economy step', 'focus', 20, [2]], // Economy is rank 3: 20 x 0.25 = 5 beats 3
      ['Even: the stronger raw value goes first', 'even', 4, [2]],
    ] as const)('%s', (_name, strength, ecoValue, want) => {
      const t = [node(1, { values: [3] }), eco(2, [ecoValue])];
      expect(ids(prio(t, { strength }, { points: 1 }).steps)).toEqual(want);
    });

    test.each([
      ['Focus follows the rank order', 'focus', [1, 3, 2]],
      ['Lean lets cheap lower wins in early', 'lean', [3, 1, 2]],
      ['Even interleaves by raw value', 'even', [3, 2, 1]],
    ] as const)('%s', (_name, strength, want) => {
      // Battle 3, Archeology 5, Economy 4; default order Battle, Archeology, Economy.
      const t = [node(1, { values: [3] }), eco(2, [4]), arch(3, [5])];
      expect(ids(prio(t, { strength }, { points: 3 }).steps)).toEqual(want);
    });

    test('each step carries the goal it serves and its goal-weighted value', () => {
      const t = [node(1, { values: [3] }), eco(2, [4]), arch(3, [5])];
      const r = prio(t, {}, { points: 3 });
      expect(r.steps.map((s) => [s.nodeId, s.goal, s.value])).toEqual([
        [1, 'battle', 3],
        [3, 'archeology', 2.5],
        [2, 'economy', 1],
      ]);
    });

    test('an ignored goal never gets a step of value nor a tag', () => {
      const t = [node(1, { values: [1] }), eco(2, [100, 100]), arch(3, [1])];
      const r = prio(t, { ignored: { economy: true }, strength: 'even' }, { points: 2 });
      expect(tagged(r.steps)).toEqual([
        [1, 'battle'],
        [3, 'archeology'],
      ]);
      const rich = prio(t, { ignored: { economy: true } }, { points: 10 });
      for (const s of rich.steps) {
        expect(s.goal).not.toBe('economy');
        if (s.nodeId === 2) expect(s.filler).toBe(true);
      }
      expect(Object.keys(rich.after)).not.toContain('STORAGE_BOOST');
    });

    test('the first goal ignored makes the second goal rank 1', () => {
      const t = [node(1, { values: [100] }), arch(2, [2]), eco(3, [3])];
      // Archeology is rank 1 (weight 1), Economy rank 2 (weight 0.5): 2 beats 1.5.
      const r = prio(t, { ignored: { battle: true } }, { points: 1 });
      expect(r.steps.map((s) => [s.nodeId, s.goal, s.value])).toEqual([[2, 'archeology', 2]]);
    });

    test('a node serving two goals takes the highest weight, not the sum, and is tagged with that goal', () => {
      const two = node(1, { values: [4], stats: ['UNIT_POWER', 'STORAGE_BOOST'] });
      expect(prio([two], { strength: 'even' }, { points: 1 }).steps.map((s) => [s.goal, s.value])).toEqual([
        ['battle', 4],
      ]);
      const ecoFirst = { order: ['economy', 'battle', 'archeology'] as TalentGoal[] };
      expect(prio([two], ecoFirst, { points: 1 }).steps.map((s) => [s.goal, s.value])).toEqual([
        ['economy', 4],
      ]);
      // A dearer stat weight on the Battle side lifts it over Economy's rank: 0.5 x 3 = 1.5 against 1.
      const r = prio([two], ecoFirst, { points: 1, weightsByGoal: { battle: { UNIT_POWER: 3 } } });
      expect(r.steps.map((s) => [s.goal, s.value])).toEqual([['battle', 6]]);
    });

    test('a bonus for a unit kind the player does not field counts zero in every goal', () => {
      const t = [
        node(1, { values: [50], unitIds: [31] }), // Battle, flying
        eco(2, [50], { stats: ['FACTORY_PRODUCTION_SPEED'], unitIds: [31] }), // Economy, flying training
        arch(3, [1]),
      ];
      const r = prio(t, { strength: 'even' }, { points: 1, kinds: ['melee'] });
      expect(tagged(r.steps)).toEqual([[3, 'archeology']]);
    });

    test('per-stat weights still work inside a goal', () => {
      const t = [node(1, { values: [3] }), node(2, { values: [2], stats: ['UNIT_HEALTH'] })];
      expect(ids(prio(t, {}, { points: 1 }).steps)).toEqual([1]);
      expect(ids(prio(t, {}, { points: 1, weightsByGoal: { battle: { UNIT_HEALTH: 2 } } }).steps)).toEqual([
        2,
      ]);
    });

    test('a cheap parent that opens a strong child under a lower goal is still taken', () => {
      const t = [node(1, { values: [3] }), eco(2, [0.1]), eco(3, [50], { parents: [2] })];
      // Economy at 0.25: (0.1 + 50) x 0.25 / 2 = 6.26 a point, against Battle's 3.
      const r = prio(t, {}, { points: 2 });
      expect(r.steps.map((s) => [s.nodeId, s.goal, s.opens])).toEqual([
        [2, 'economy', 3],
        [3, 'economy', null],
      ]);
    });

    test('running out of points mid-path stops at the last affordable rank', () => {
      const t = [eco(1, [1, 2, 3, 4, 5]), node(2, { values: [0.1] })];
      const r = prio(t, {}, { points: 2 });
      expect(r.steps.map((s) => [s.nodeId, s.rank])).toEqual([
        [1, 1],
        [1, 2],
      ]);
      expect(r.pointsLeft).toBe(0);
    });

    test('totals before and after cover the stats of every active goal', () => {
      const t = [node(1, { values: [3] }), eco(2, [4]), arch(3, [5])];
      const r = prio(t, { ignored: { archeology: true } }, { points: 3, ranks: { 1: 1 } });
      expect(r.before).toEqual({ UNIT_POWER: 3 });
      expect(r.after).toEqual({ UNIT_POWER: 3, STORAGE_BOOST: 4 });
    });
  });

  describe('Strict order', () => {
    const t = [node(1, { values: [1, 2] }), eco(2, [100]), arch(3, [1])];

    test('fills goal 1 completely before goal 2, then goal 3', () => {
      const r = prio(t, { mode: 'strict', order: ['battle', 'economy', 'archeology'] }, { points: 4 });
      expect(r.steps.map((s) => [s.nodeId, s.rank, s.goal])).toEqual([
        [1, 1, 'battle'],
        [1, 2, 'battle'],
        [2, 1, 'economy'],
        [3, 1, 'archeology'],
      ]);
    });

    test('spills only what goal 1 cannot take', () => {
      const r = prio(t, { mode: 'strict', order: ['battle', 'economy', 'archeology'] }, { points: 2 });
      expect(tagged(r.steps)).toEqual([
        [1, 'battle'],
        [1, 'battle'],
      ]);
    });

    test('Blended places a strong Economy step before a weak Battle one where Strict cannot', () => {
      const order: TalentGoal[] = ['battle', 'economy', 'archeology'];
      expect(ids(prio(t, { order }, { points: 1 }).steps)).toEqual([2]);
      expect(ids(prio(t, { order, mode: 'strict' }, { points: 1 }).steps)).toEqual([1]);
    });

    test('skips an ignored goal', () => {
      const r = prio(t, { mode: 'strict', ignored: { battle: true } }, { points: 2 });
      expect(tagged(r.steps)).toEqual([
        [3, 'archeology'],
        [2, 'economy'],
      ]);
    });

    test('points no goal can use are spent as fillers in an active tree, never in an ignored one', () => {
      const r = prio(
        [
          node(1, { values: [1] }),
          eco(2, [0, 0], { stats: ['MINE_PRODUCTION_SPEED'], costs: [2, 2] }), // dearest, but Economy is ignored
          node(3, { values: [0, 0], stats: ['CARAVAN_SPEED'] }), // worth nothing, in the Battle tree
        ],
        { mode: 'strict', ignored: { economy: true } },
        { points: 5 },
      );
      expect(r.steps.map((s) => [s.nodeId, s.goal, s.filler])).toEqual([
        [1, 'battle', false],
        [3, null, true],
        [3, null, true],
      ]);
      expect(r.pointsLeft).toBe(2);
    });
  });

  describe('fillers and ignored goals', () => {
    test('a filler never lands in an ignored goal tree: the points go to an active tree instead', () => {
      const t = [
        node(1, { values: [3] }),
        eco(2, [0], { stats: ['MINE_PRODUCTION_SPEED'], costs: [2] }),
        node(3, { values: [0, 0], stats: ['CARAVAN_SPEED'] }),
      ];
      for (const mode of ['blended', 'strict'] as const) {
        const r = prio(t, { mode, ignored: { economy: true } }, { points: 3 });
        expect(r.steps.map((s) => [s.nodeId, s.filler])).toEqual([
          [1, false],
          [3, true],
          [3, true],
        ]);
        expect(r.pointsLeft).toBe(0);
      }
    });

    test('with only ignored trees left to fill, the points stay left over', () => {
      const t = [node(1, { values: [3] }), eco(2, [0, 0], { stats: ['MINE_PRODUCTION_SPEED'] })];
      const r = prio(t, { ignored: { economy: true } }, { points: 3 });
      expect(r.steps.map((s) => s.nodeId)).toEqual([1]);
      expect(r.pointsSpent).toBe(1);
      expect(r.pointsLeft).toBe(2);
    });

    test('the Expert tree is Battle: ignoring Battle keeps fillers out of it', () => {
      const t = [eco(1, [3]), node(2, { values: [0], stats: ['CARAVAN_SPEED'], tree: 'expert' })];
      const r = prio(t, { ignored: { battle: true } }, { points: 2 });
      expect(r.steps.map((s) => s.nodeId)).toEqual([1]);
      expect(r.pointsLeft).toBe(1);
    });

    test('with nothing ignored, fillers go anywhere as before', () => {
      const t = [node(1, { values: [3] }), eco(2, [0], { stats: ['MINE_PRODUCTION_SPEED'], costs: [2] })];
      const r = prio(t, {}, { points: 3 });
      expect(r.steps.map((s) => [s.nodeId, s.filler])).toEqual([
        [1, false],
        [2, true],
      ]);
    });
  });

  describe('properties', () => {
    const byId = new Map(realTalents.map((t) => [t.id, t]));
    const priorities: TalentPriority[] = [
      DEFAULT_TALENT_PRIORITY,
      { ...DEFAULT_TALENT_PRIORITY, strength: 'even' },
      { ...DEFAULT_TALENT_PRIORITY, strength: 'lean', order: ['economy', 'battle', 'archeology'] },
      { ...DEFAULT_TALENT_PRIORITY, mode: 'strict' },
      { ...DEFAULT_TALENT_PRIORITY, mode: 'strict', order: ['archeology', 'economy', 'battle'] },
      { ...DEFAULT_TALENT_PRIORITY, ignored: { battle: true, archeology: true } },
    ];

    test.each([
      [24, 20],
      [86, 300],
      [150, 600],
      [400, 1500],
    ])(
      'real table, level %i, %i points: every step is affordable and open at its moment',
      (heroLevel, points) => {
        for (const priority of priorities) {
          const r = planTalentPriorities({ talents: realTalents, heroLevel, points, kinds: ALL, priority });
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
            if (!s.filler) expect(priority.ignored[s.goal!] ?? false).toBe(false);
            else expect(priority.ignored[goalOfTree(t.tree)] ?? false).toBe(false);
            held.set(s.nodeId, s.rank);
            spent += s.cost;
          }
          expect(spent).toBeLessThanOrEqual(points);
          expect(r.pointsSpent).toBe(spent);
          expect(r.pointsSpent + r.pointsLeft).toBe(points);
        }
      },
    );

    test('with one goal, the plan equals the single-goal planner on random tables, fillers aside', () => {
      let seed = 22;
      const rnd = () => {
        seed = (seed * 1103515245 + 12345) % 2147483648;
        return seed / 2147483648;
      };
      const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;
      const statPool = ['UNIT_POWER', 'UNIT_HEALTH', 'STORAGE_BOOST', 'CARAVAN_SPEED', 'SKLEP_EXP_BONUS'];
      const goals = Object.keys(TALENT_GOALS) as TalentGoal[];
      for (let trial = 0; trial < 60; trial++) {
        const n = 3 + Math.floor(rnd() * 8);
        const table: TalentRecord[] = [];
        for (let id = 1; id <= n; id++) {
          const ranks = 1 + Math.floor(rnd() * 3);
          let total = 0;
          const values = Array.from({ length: ranks }, () => (total += Math.round(rnd() * 10)));
          const tree = pick(TALENT_TREES);
          // Trees never share nodes: a parent is an earlier node of the same tree.
          const sameTree = table.filter((t) => t.tree === tree).map((t) => t.id);
          const parents = sameTree.length > 0 && rnd() < 0.5 ? [pick(sameTree)] : [];
          table.push(
            node(id, {
              values,
              stats: [pick(statPool)],
              parents,
              costs: values.map(() => 1 + Math.floor(rnd() * 3)),
              tree,
              ...(rnd() < 0.2 ? { levelGate: 100 } : {}),
            }),
          );
        }
        const goal = pick(goals);
        const points = Math.floor(rnd() * 15);
        const heroLevel = rnd() < 0.5 ? 50 : 200;
        const r = prio(
          table,
          { ...only(goal), mode: pick(['blended', 'strict'] as const) },
          { points, heroLevel },
        );
        const single = planTalents({ talents: table, heroLevel, points, goal, kinds: ALL });
        expectSingleGoalPlan(table, r, single, goal);
      }
    });

    test('the plan is a pure function: same input, same output, input untouched', () => {
      const priority: TalentPriority = {
        ...DEFAULT_TALENT_PRIORITY,
        order: ['economy', 'battle', 'archeology'],
      };
      const args = { talents: realTalents, heroLevel: 120, points: 60, kinds: ALL, priority };
      expect(planTalentPriorities(args)).toEqual(planTalentPriorities(args));
      expect(priority.order).toEqual(['economy', 'battle', 'archeology']);
    });
  });
});

describe('which stats count by default (B-23 b)', () => {
  const w = withDefaultStatWeights({});

  test.each([
    ['battle', 'UNIT_LOAD_CAPACITY'],
    ['battle', 'MARCH_SPEED'],
    ['battle', 'MARCH_SPEED_PVP'],
    ['economy', 'FACTORY_CRAFT_SPEED'],
    ['economy', 'STORAGE_BOOST'],
    ['economy', 'CARAVAN_CAPACITY'],
    ['economy', 'CLAN_CARAVAN_CAPACITY'],
    ['economy', 'CARAVAN_SPEED'],
    ['economy', 'MAP_MINING_SPEED'],
    ['economy', 'EFFECT_B_ABOVE_1_SUMMARIZABLE'],
    ['archeology', 'SKLEP_EXP_BONUS'],
    ['archeology', 'HERO_MAX_MARCH_TIME'],
  ] as const)('%s %s is off until the player ticks it', (goal, stat) => {
    expect(w[goal]?.[stat]).toBe(0);
  });

  test.each([
    ['battle', 'UNIT_POWER'],
    ['battle', 'UNIT_HEALTH'],
    ['battle', 'UNIT_CRIT'],
    ['economy', 'BUILDING_UPGRADE_SPEED'],
    ['economy', 'FACTORY_TECH_SPEED'],
    ['economy', 'FACTORY_PRODUCTION_SPEED'],
    ['economy', 'MINE_PRODUCTION_SPEED'],
    ['archeology', 'SKLEP_STRIKE_DAMAGE'],
    ['archeology', 'SKLEP_PRICE_CUT'],
    ['archeology', 'SKLEP_CRIT_PROBABILITY'],
  ] as const)('%s %s is on by default', (goal, stat) => {
    expect(w[goal]?.[stat] ?? 1).toBe(1);
  });

  test('a saved weight beats the default, in both directions', () => {
    const saved = withDefaultStatWeights({
      battle: { UNIT_LOAD_CAPACITY: 1, UNIT_POWER: 0, UNIT_HEALTH: 2.5 },
    });
    expect(saved.battle?.UNIT_LOAD_CAPACITY).toBe(1);
    expect(saved.battle?.UNIT_POWER).toBe(0);
    expect(saved.battle?.UNIT_HEALTH).toBe(2.5);
    expect(saved.battle?.MARCH_SPEED).toBe(0);
  });

  test('with the defaults, a carrying-capacity node loses to a weaker strength node', () => {
    const t = [
      node(1, { values: [5], stats: ['UNIT_LOAD_CAPACITY'], unitIds: [6] }),
      node(2, { values: [2], stats: ['UNIT_POWER'], unitIds: [6] }),
    ];
    const run = (weightsByGoal: NonNullable<TalentPriorityInput['weightsByGoal']>) =>
      planTalentPriorities({
        talents: t,
        heroLevel: 200,
        points: 1,
        kinds: ['melee'],
        priority: DEFAULT_TALENT_PRIORITY,
        weightsByGoal,
      });
    expect(ids(run({}).steps)).toEqual([1]);
    expect(ids(run(withDefaultStatWeights({})).steps)).toEqual([2]);
  });
});

describe('crypt types scope the archeology stats (B-23 b)', () => {
  // The table tags a crypt bonus with 202 (Common), 17 (Rare), 90 (Epic) or 325 (all crypts).
  const crypt = (id: number, unitIds: number[], stat = 'SKLEP_STRIKE_DAMAGE') =>
    node(id, { values: [3], stats: [stat], unitIds, tree: 'archeology' });
  const run = (t: TalentRecord[], crypts?: ('common' | 'rare' | 'epic')[]) =>
    ids(
      planTalents({
        talents: t,
        heroLevel: 200,
        points: 5,
        goal: 'archeology',
        kinds: [],
        ...(crypts === undefined ? {} : { crypts }),
      }).steps.filter((s) => !s.filler),
    );

  test('a bonus for a crypt type counts only when that type is ticked', () => {
    const t = [crypt(1, [202]), crypt(2, [17]), crypt(3, [90])];
    expect(run(t, ['rare'])).toEqual([2]);
    expect(run(t, ['common', 'epic']).sort()).toEqual([1, 3]);
  });

  test('a general crypt bonus counts when any type is ticked, and not when none is', () => {
    const t = [crypt(1, [325])];
    expect(run(t, ['epic'])).toEqual([1]);
    expect(run(t, [])).toEqual([]);
  });

  test('without a choice every crypt type counts, as before', () => {
    expect(run([crypt(1, [202]), crypt(2, [325])], undefined).sort()).toEqual([1, 2]);
  });

  test('the price cut and the explore-twice chance are scoped the same way', () => {
    const t = [crypt(1, [17], 'SKLEP_PRICE_CUT'), crypt(2, [17], 'SKLEP_CRIT_PROBABILITY')];
    expect(run(t, ['common'])).toEqual([]);
  });
});

describe('strength by troop group (B-23 d, experiment 363)', () => {
  const strengthNodes = realTalents.filter((t) => t.stats.includes('UNIT_POWER'));

  test.each([
    ["Guardsmen's strength I", 1],
    ['Army strength', 1.11],
    ["Mounted units' strength II", 0.41],
    ["Melee units' strength III", 0.23],
    ["Ranged units' strength I", 0.2],
    ["Specialists' strength II", 0.14],
    ["Monsters' strength III", 0.14],
    ["Flying units' strength I", 0.06],
  ])('%s is worth %s of a guardsmen point', (name, share) => {
    const rec = strengthNodes.find((t) => t.name === name);
    expect(rec, name).toBeDefined();
    expect(strengthShareOf(rec!)).toBe(share);
  });

  test('every strength node of the real table is covered or deliberately left at 1', () => {
    const left = strengthNodes
      .filter((t) => strengthShareOf(t) === 1 && !t.name.startsWith("Guardsmen's"))
      .map((t) => t.name.replace(/ (I|II|III)$/, ''));
    expect([...new Set(left)].sort()).toEqual(['Strength of fortifications']);
  });

  test('a node that is not strength, or has no known group, keeps a share of 1', () => {
    expect(
      strengthShareOf(node(1, { values: [1], stats: ['UNIT_HEALTH'], name: "Specialists' health I" })),
    ).toBe(1);
    expect(strengthShareOf(node(2, { values: [1], stats: ['UNIT_POWER'], name: 'Node 2' }))).toBe(1);
  });

  test('the table is what experiment 363 measured', () => {
    expect(STRENGTH_SHARES.guardsmen).toBe(1);
    expect(STRENGTH_SHARES.specialist).toBeLessThan(STRENGTH_SHARES.mounted);
  });

  const prio = (talents: TalentRecord[], kinds: UnitKind[]) =>
    ids(
      planTalentPriorities({
        talents,
        heroLevel: 200,
        points: 1,
        kinds,
        priority: DEFAULT_TALENT_PRIORITY,
        weightsByGoal: withDefaultStatWeights({}),
      }).steps,
    );

  test('a smaller guardsmen bonus beats a bigger specialist one', () => {
    const t = [
      node(1, { values: [20], name: "Specialists' strength I", unitIds: [21] }),
      node(2, { values: [5], name: "Guardsmen's strength I", unitIds: [1] }),
    ];
    expect(prio(t, ['melee', 'ranged'])).toEqual([2]);
  });

  test('a specialist bonus still wins when it is far bigger than the guardsmen one', () => {
    const t = [
      node(1, { values: [60], name: "Specialists' strength I", unitIds: [21] }),
      node(2, { values: [5], name: "Guardsmen's strength I", unitIds: [1] }),
    ];
    expect(prio(t, ['melee', 'ranged'])).toEqual([1]);
  });

  test('health on the same specialists is not scaled', () => {
    const t = [
      node(1, { values: [20], name: "Specialists' health I", stats: ['UNIT_HEALTH'], unitIds: [21] }),
      node(2, { values: [5], name: "Guardsmen's strength I", unitIds: [1] }),
    ];
    expect(prio(t, ['melee', 'ranged'])).toEqual([1]);
  });
});

describe('troop groups the player does not use (B-23 d)', () => {
  const run = (t: TalentRecord[], groups?: ('guardsmen' | 'specialist' | 'monster' | 'engineers')[]) =>
    ids(
      planTalentPriorities({
        talents: t,
        heroLevel: 200,
        points: 5,
        kinds: ['melee', 'ranged', 'mounted'],
        priority: DEFAULT_TALENT_PRIORITY,
        weightsByGoal: withDefaultStatWeights({}),
        ...(groups === undefined ? {} : { groups }),
      }).steps.filter((s) => !s.filler),
    );
  const spec = (stat: string, name: string) => node(1, { values: [9], stats: [stat], name, unitIds: [21] });

  test.each([
    ['strength', 'UNIT_POWER', "Specialists' strength I"],
    ['health', 'UNIT_HEALTH', "Specialists' health I"],
    ['double damage', 'UNIT_CRIT', 'Chance for specialists to deal double damage I'],
  ])('a specialists %s bonus counts only when specialists are in play', (_label, stat, name) => {
    const t = [spec(stat, name)];
    expect(run(t, ['guardsmen'])).toEqual([]);
    expect(run(t, ['guardsmen', 'specialist'])).toEqual([1]);
    expect(run(t, undefined)).toEqual([1]);
  });

  test('engineer corps, siege engines and monsters follow the same rule', () => {
    const t = [
      node(1, { values: [9], name: "Engineer corps' strength I", unitIds: [16] }),
      node(2, { values: [9], name: "Siege engines' strength I", unitIds: [16] }),
      node(3, { values: [9], name: "Monsters' strength I", unitIds: [149] }),
    ];
    const all = ['melee', 'engineers', 'monsters'] as const;
    const go = (groups: ('guardsmen' | 'specialist' | 'monster' | 'engineers')[]) =>
      ids(
        planTalentPriorities({
          talents: t,
          heroLevel: 200,
          points: 5,
          kinds: [...all],
          priority: DEFAULT_TALENT_PRIORITY,
          weightsByGoal: withDefaultStatWeights({}),
          groups,
        }).steps.filter((s) => !s.filler),
      );
    expect(go(['guardsmen'])).toEqual([]);
    expect(go(['engineers']).sort()).toEqual([1, 2]);
    expect(go(['monster'])).toEqual([3]);
  });

  test('a bonus for all the army and the categories is not a group bonus', () => {
    const t = [
      node(1, { values: [9], name: 'Army strength', unitIds: [1, 21] }),
      node(2, { values: [9], name: "Melee units' strength I", unitIds: [6] }),
    ];
    expect(run(t, ['guardsmen']).sort()).toEqual([1, 2]);
  });

  test('on the real table, a guardsmen-only army puts at most one opening rank into a group it does not use', () => {
    const plan = planTalentPriorities({
      talents: realTalents,
      heroLevel: 150,
      points: 120,
      kinds: ALL,
      priority: DEFAULT_TALENT_PRIORITY,
      weightsByGoal: withDefaultStatWeights({}),
      groups: ['guardsmen'],
    });
    const deepest = new Map<string, number>();
    for (const s of plan.steps) {
      const name = realTalents.find((t) => t.id === s.nodeId)!.name;
      if (
        /^(Specialists'|Monsters'|Engineer corps'|Siege engines'|Chance for (specialists|monsters|engineer corps))/.test(
          name,
        )
      )
        deepest.set(name, Math.max(deepest.get(name) ?? 0, s.rank));
    }
    // A rank on such a node is only ever the one a path to a stronger node has to pass through.
    expect([...deepest.values()].filter((rank) => rank > 1)).toEqual([]);
    expect(plan.steps.length).toBeGreaterThan(0);
  });
});


describe('talentReach: what it takes to buy a node that holds nothing yet', () => {
  const node = (id: number, parents: number[], levelGate?: number): TalentRecord => ({
    id,
    name: `N${String(id)}`,
    tree: 'battle',
    maxRank: 3,
    layout: { x: 0, y: 0, link: null, place: null, flipped: false },
    parents,
    ...(levelGate === undefined ? {} : { levelGate }),
    stats: ['UNIT_POWER'],
    unitIds: [],
    values: [1, 2, 3],
    costs: [2, 3, 4],
  });
  // 1 -> 2 -> 3 (gate 30); 4 is a root.
  const table = [node(1, []), node(2, [1]), node(3, [2], 30), node(4, [])];

  test('a root and a held node cost nothing; each missing ancestor adds its first rank', () => {
    const none = talentReach(table, {});
    expect(none.get(1)).toEqual({ levelGate: 0, pointsToReach: 0 });
    expect(none.get(2)?.pointsToReach).toBe(2);
    expect(none.get(3)).toEqual({ levelGate: 30, pointsToReach: 4 });
    expect(talentReach(table, { '1': 1 }).get(3)?.pointsToReach).toBe(2);
    expect(talentReach(table, { '1': 1, '2': 2 }).get(3)?.pointsToReach).toBe(0);
    expect(talentReach(table, { '3': 1 }).get(3)).toEqual({ levelGate: 0, pointsToReach: 0 });
  });

  test('an ancestor still to buy carries its level gate to the node under it', () => {
    const gated = [node(1, [], 40), node(2, [1])];
    expect(talentReach(gated, {}).get(2)?.levelGate).toBe(40);
    expect(talentReach(gated, { '1': 1 }).get(2)?.levelGate).toBe(0);
  });
});
