/**
 * The hero talent planner (B-21): which talent point to spend next.
 *
 * A pure function of the talent table, the hero level, the points available, the ranks already bought, a goal's
 * stat weights and the unit kinds that count. The value of a rank is the weighted percentage points it adds
 * (the game's own per-rank table, a bonus counted only when it touches a unit the player fields). No battle is
 * run; `rankValue` is the one place an engine-scored value could replace it later.
 *
 * The search is greedy on value per point, but each candidate is a whole path: the missing ancestors of a node
 * (one rank each) followed by a run of ranks of the node itself, so a weak parent in front of a strong child is
 * judged together with the child. A candidate that the remaining points cannot pay in full is shortened (a run
 * stops at the last rank that fits) or dropped. Ranks are only ever added.
 */
import type { TalentRecord } from '../data/types';
import { UNIT_ID_RANGES } from './talentUnitIds';

/** The kinds of army unit a talent bonus can be about. Engineers (siege engines) are the game's own sixth kind. */
export const UNIT_KINDS = ['melee', 'ranged', 'mounted', 'flying', 'monsters', 'engineers'] as const;
export type UnitKind = (typeof UNIT_KINDS)[number];

const KIND_BY_ID: ReadonlyMap<number, UnitKind> = (() => {
  const m = new Map<number, UnitKind>();
  for (const kind of UNIT_KINDS) {
    for (const [from, to] of UNIT_ID_RANGES[kind]) for (let id = from; id <= to; id++) m.set(id, kind);
  }
  return m;
})();

/** The kind a game unit id belongs to, or null when the game lists it in no category (it then counts for nothing). */
export function unitKindOf(id: number): UnitKind | null {
  return KIND_BY_ID.get(id) ?? null;
}

/** What rank `rank` (1-based) adds over the one before it: the table holds running totals, a rank is the step. */
export function rankGain(values: readonly number[], rank: number): number {
  return values[rank - 1]! - (rank > 1 ? values[rank - 2]! : 0);
}

export const TALENT_GOALS: Readonly<Record<'battle' | 'economy' | 'archeology', readonly string[]>> = {
  /** Army strength, health, double-damage chance, march speed and carrying capacity. */
  battle: ['UNIT_POWER', 'UNIT_HEALTH', 'UNIT_CRIT', 'MARCH_SPEED', 'MARCH_SPEED_PVP', 'UNIT_LOAD_CAPACITY'],
  /** Production, storage, caravans, building, tech, craft and training speed, map mining. */
  economy: [
    'FACTORY_PRODUCTION_SPEED',
    'FACTORY_TECH_SPEED',
    'FACTORY_CRAFT_SPEED',
    'MINE_PRODUCTION_SPEED',
    'MAP_MINING_SPEED',
    'STORAGE_BOOST',
    'CARAVAN_CAPACITY',
    'CLAN_CARAVAN_CAPACITY',
    'CARAVAN_SPEED',
    'BUILDING_UPGRADE_SPEED',
    'EFFECT_B_ABOVE_1_SUMMARIZABLE',
  ],
  /** Crypt stats and experience. */
  archeology: [
    'SKLEP_STRIKE_DAMAGE',
    'SKLEP_CRIT_PROBABILITY',
    'SKLEP_EXP_BONUS',
    'SKLEP_PRICE_CUT',
    'HERO_MAX_MARCH_TIME',
  ],
};
export type TalentGoal = keyof typeof TALENT_GOALS;

/** Stats whose bonus is about units: they count only when the node's unit ids include a kind in play. */
const UNIT_SCOPED_STATS: ReadonlySet<string> = new Set([
  'UNIT_POWER',
  'UNIT_HEALTH',
  'UNIT_CRIT',
  'UNIT_LOAD_CAPACITY',
  'MARCH_SPEED',
  'MARCH_SPEED_PVP',
  'FACTORY_PRODUCTION_SPEED',
]);

/** Whether a goal has stats about units, so the army decides what counts for it. */
export function goalHasUnitStats(goal: TalentGoal): boolean {
  return TALENT_GOALS[goal].some((s) => UNIT_SCOPED_STATS.has(s));
}

/** Stats where a lower figure is the gain (the table stores a price cut as a negative percentage). */
const LOWER_IS_BETTER: ReadonlySet<string> = new Set(['SKLEP_PRICE_CUT']);

export interface TalentPlanInput {
  talents: readonly TalentRecord[];
  heroLevel: number;
  /** Points to spend now (the caller works out earned minus spent, or takes the player's override). */
  points: number;
  /** Ranks already bought, by node id. Missing means 0. */
  ranks?: Readonly<Record<number, number>>;
  goal: TalentGoal;
  /** Weight per stat kind, 1 when absent. */
  weights?: Readonly<Partial<Record<string, number>>>;
  /** The unit kinds whose bonuses count. */
  kinds: ReadonlySet<UnitKind> | readonly UnitKind[];
}

export interface TalentStep {
  nodeId: number;
  /** The rank this step reaches. */
  rank: number;
  cost: number;
  /** Weighted percentage points this rank adds. */
  value: number;
  /** Set when the step is bought to open this stronger node; null for a step bought for itself. */
  opens: number | null;
  /** Set when the step adds nothing for this goal and army: it only spends points that nothing better could use. */
  filler: boolean;
}

export interface TalentLock {
  /** `level`: the hero level is below a gate on the way (`level` is the highest one). `parent`: a parent holds no rank yet. */
  reason: 'level' | 'parent';
  level: number | null;
}

export interface TalentNextGate {
  level: number;
  nodeId: number;
  /** Weighted percentage points of the node at its maximum rank. */
  value: number;
  /** What its maximum rank costs in all. */
  points: number;
}

export interface TalentPlan {
  steps: TalentStep[];
  pointsSpent: number;
  pointsLeft: number;
  /** Percentage points per stat of the goal that the counting nodes give, before and after the steps. */
  before: Record<string, number>;
  after: Record<string, number>;
  /** Nodes at rank 0 that the hero cannot buy into today, with the reason. */
  locked: Record<number, TalentLock>;
  /** The nearest hero level above the current one that opens something worth having. */
  nextGate: TalentNextGate | null;
}

const EPS = 1e-12;

/** How strongly rank 1 wins: Focus, Lean or Even. */
export const TALENT_STRENGTHS = ['focus', 'lean', 'even'] as const;
export type TalentStrength = (typeof TALENT_STRENGTHS)[number];

/** How points are spread: Blended (one value-per-point search) or Strict order (rank 1 full first). */
export const TALENT_MODES = ['blended', 'strict'] as const;
export type TalentMode = (typeof TALENT_MODES)[number];

/**
 * The goal weight of each rank (1st, 2nd, 3rd active goal), per strength. The one place to tune them (B-22: a
 * first guess, the owner may change it after trying real plans).
 */
export const TALENT_RANK_WEIGHTS: Readonly<Record<TalentStrength, readonly [number, number, number]>> = {
  focus: [1, 0.5, 0.25],
  lean: [1, 0.8, 0.6],
  even: [1, 1, 1],
};

/** What the player wants most: the goals in order, the ones ignored, how strongly rank 1 wins, and the mode. */
export interface TalentPriority {
  /** The goals, most wanted first. A goal missing from the list comes after the listed ones, in the default order. */
  order: readonly TalentGoal[];
  /** An ignored goal weighs 0 and takes no rank. */
  ignored: Readonly<Partial<Record<TalentGoal, boolean>>>;
  strength: TalentStrength;
  mode: TalentMode;
}

export const DEFAULT_TALENT_PRIORITY: TalentPriority = {
  order: ['battle', 'archeology', 'economy'],
  ignored: {},
  strength: 'focus',
  mode: 'blended',
};

const GOALS = Object.keys(TALENT_GOALS) as TalentGoal[];

/** The active goals in rank order (ignored ones dropped, missing ones appended in the default order). */
function activeGoals(priority: TalentPriority): TalentGoal[] {
  const order = [...new Set([...priority.order.filter((g) => g in TALENT_GOALS), ...GOALS])];
  return order.filter((g) => priority.ignored[g] !== true);
}

/** The weight of each goal: its rank's weight under the strength; 0 for an ignored goal. Ranks count active goals only. */
export function talentGoalWeights(priority: TalentPriority): Record<TalentGoal, number> {
  const out = { battle: 0, economy: 0, archeology: 0 } as Record<TalentGoal, number>;
  const table = TALENT_RANK_WEIGHTS[priority.strength];
  activeGoals(priority).forEach((g, i) => (out[g] = table[i] ?? 0));
  return out;
}

export interface TalentPriorityInput extends Omit<TalentPlanInput, 'goal' | 'weights'> {
  priority: TalentPriority;
  /** Weight per stat kind inside each goal, 1 when absent. */
  weightsByGoal?: Readonly<Partial<Record<TalentGoal, Readonly<Partial<Record<string, number>>>>>>;
}

export interface TalentPriorityStep extends TalentStep {
  /**
   * The goal the step serves: the goal that set its weight (for a step that opens another node, the goal of that
   * node; in Strict order, the goal being filled). Null for a filler.
   */
  goal: TalentGoal | null;
}

export interface TalentPriorityPlan extends Omit<TalentPlan, 'steps'> {
  /** One merged list. `before` and `after` cover the stats of every active goal. */
  steps: TalentPriorityStep[];
}

interface Prepared {
  rec: TalentRecord;
  /**
   * The weight of the node: the highest (goal weight x stat weight) among its stats that are in an active goal
   * (0 when none is). A node with two stats (a caravan bonus and its clan twin) has one series of figures that
   * applies to both, so adding the weights would count the same percentage points twice; the dearest sets it.
   */
  weight: number;
  /** The goal that set `weight`, null when it is 0. */
  goal: TalentGoal | null;
  /** The same, counted for one goal at a time (Strict order). */
  byGoal: Record<TalentGoal, number>;
  /** Whether the node's army relevance holds (true for nodes that are not about units). */
  counts: boolean;
  /** -1 when a lower figure is the gain (a price cut), else 1. */
  sign: 1 | -1;
}

/** The weighted value of one rank of a node: its table gain times a node weight. The seam for an engine-scored value. */
function rankValue(p: Prepared, rank: number, weight: number = p.weight): number {
  const v = p.rec.values;
  return rankGain(v, rank) * weight * p.sign;
}

/** The single-goal plan: the priority plan with that goal alone. */
export function planTalents(input: TalentPlanInput): TalentPlan {
  const { goal, weights, ...rest } = input;
  const plan = planCore(
    rest,
    [goal],
    { battle: 0, economy: 0, archeology: 0, [goal]: 1 },
    { [goal]: weights ?? {} },
    'blended',
  );
  return { ...plan, steps: plan.steps.map(({ goal: _goal, ...s }) => s) };
}

/**
 * The priority plan (B-22): one merged list of steps serving every active goal, each step tagged with its goal.
 * Blended runs the single-goal search once with each node weighted by its best goal; Strict order runs it goal
 * by goal in rank order, each goal taking points until nothing it values is affordable. With one active goal
 * both equal `planTalents` for that goal.
 */
export function planTalentPriorities(input: TalentPriorityInput): TalentPriorityPlan {
  const { priority, weightsByGoal, ...rest } = input;
  return planCore(
    rest,
    activeGoals(priority),
    talentGoalWeights(priority),
    weightsByGoal ?? {},
    priority.mode,
  );
}

function planCore(
  input: Omit<TalentPlanInput, 'goal' | 'weights'>,
  active: readonly TalentGoal[],
  goalWeight: Readonly<Record<TalentGoal, number>>,
  weightsByGoal: Readonly<Partial<Record<TalentGoal, Readonly<Partial<Record<string, number>>>>>>,
  mode: TalentMode,
): TalentPriorityPlan {
  const { talents, heroLevel } = input;
  const ranked = active.filter((g) => goalWeight[g] > 0);
  const goalOf = new Map<string, TalentGoal>();
  for (const g of ranked) for (const s of TALENT_GOALS[g]) goalOf.set(s, g);
  const kinds = new Set<UnitKind>(input.kinds);

  const nodes = new Map<number, Prepared>();
  for (const rec of talents) {
    const byGoal = { battle: 0, economy: 0, archeology: 0 } as Record<TalentGoal, number>;
    for (const s of rec.stats) {
      const g = goalOf.get(s);
      if (g === undefined) continue;
      byGoal[g] = Math.max(byGoal[g], goalWeight[g] * (weightsByGoal[g]?.[s] ?? 1));
    }
    const scoped = rec.stats.some((s) => UNIT_SCOPED_STATS.has(s)) && rec.unitIds.length > 0;
    const counts = !scoped || rec.unitIds.some((id) => kinds.has(KIND_BY_ID.get(id) as UnitKind));
    let weight = 0;
    let goal: TalentGoal | null = null;
    for (const g of ranked) {
      if (!counts) byGoal[g] = 0;
      if (byGoal[g] > weight) {
        weight = byGoal[g];
        goal = g;
      }
    }
    const sign = rec.stats.some((s) => LOWER_IS_BETTER.has(s)) ? -1 : 1;
    nodes.set(rec.id, { rec, weight, goal, byGoal, counts, sign });
  }

  const held = new Map<number, number>();
  for (const [key, r] of Object.entries(input.ranks ?? {})) {
    const p = nodes.get(Number(key));
    if (p && r > 0) held.set(p.rec.id, Math.min(Math.floor(r), p.rec.maxRank));
  }

  const totals = (): Record<string, number> => {
    const out: Record<string, number> = {};
    for (const [id, r] of held) {
      const p = nodes.get(id)!;
      if (!p.counts) continue;
      for (const s of p.rec.stats) if (goalOf.has(s)) out[s] = (out[s] ?? 0) + p.rec.values[r - 1]!;
    }
    return out;
  };
  const before = totals();

  /**
   * What it takes to buy the first rank of a node: the nodes (ancestors first) that must get a rank before it,
   * and the highest hero-level gate met on the way (the node's own included).
   */
  const closure = (id: number): { order: number[]; gate: number } => {
    const order: number[] = [];
    let gate = 0;
    const seen = new Set<number>();
    const visit = (nid: number, isTarget: boolean): void => {
      if (seen.has(nid)) return;
      seen.add(nid);
      const p = nodes.get(nid);
      if (!p)
        throw new Error(`talent table: node ${String(nid)} is named as a parent but is not in the table`);
      if (!isTarget && (held.get(nid) ?? 0) >= 1) return;
      for (const parent of p.rec.parents) visit(parent, false);
      gate = Math.max(gate, p.rec.levelGate ?? 0);
      if (!isTarget) order.push(nid);
    };
    visit(id, true);
    return { order, gate };
  };

  const locked: Record<number, TalentLock> = {};
  for (const p of nodes.values()) {
    if ((held.get(p.rec.id) ?? 0) > 0) continue;
    const c = closure(p.rec.id);
    if (c.gate > heroLevel) locked[p.rec.id] = { reason: 'level', level: c.gate };
    else if (c.order.length > 0) locked[p.rec.id] = { reason: 'parent', level: null };
  }

  const steps: TalentPriorityStep[] = [];
  let left = Math.max(0, Math.floor(input.points));
  const start = left;

  /**
   * The greedy search on value per point with one node weight: each candidate is a whole path (missing ancestors,
   * one rank each, then a run of ranks of the node). `tag` names the goal a bought path serves.
   */
  const search = (weightOf: (p: Prepared) => number, tag: (p: Prepared) => TalentGoal | null): void => {
    while (left > 0) {
      let best: {
        id: number;
        ancestors: number[];
        upTo: number;
        ratio: number;
        value: number;
      } | null = null;

      for (const p of nodes.values()) {
        const w = weightOf(p);
        if (w <= 0) continue;
        const cur = held.get(p.rec.id) ?? 0;
        if (cur >= p.rec.maxRank) continue;
        let ancestors: number[] = [];
        let cost = 0;
        let value = 0;
        if (cur === 0) {
          const c = closure(p.rec.id);
          if (c.gate > heroLevel) continue;
          ancestors = c.order;
          for (const a of ancestors) {
            const ap = nodes.get(a)!;
            cost += ap.rec.costs[0]!;
            value += rankValue(ap, 1, weightOf(ap));
          }
        }
        if (cost > left) continue;
        for (let m = cur + 1; m <= p.rec.maxRank; m++) {
          cost += p.rec.costs[m - 1]!;
          if (cost > left) break;
          value += rankValue(p, m, w);
          const ratio = value / cost;
          if (
            value > 0 &&
            (best === null ||
              ratio > best.ratio + EPS ||
              (Math.abs(ratio - best.ratio) <= EPS && value > best.value + EPS))
          ) {
            best = { id: p.rec.id, ancestors, upTo: m, ratio, value };
          }
        }
      }
      if (!best) break;

      const p = nodes.get(best.id)!;
      const goal = tag(p);
      for (const a of best.ancestors) {
        const ap = nodes.get(a)!;
        steps.push({
          nodeId: a,
          rank: 1,
          cost: ap.rec.costs[0]!,
          value: rankValue(ap, 1, weightOf(ap)),
          opens: best.id,
          filler: false,
          goal,
        });
        held.set(a, 1);
        left -= ap.rec.costs[0]!;
      }
      const w = weightOf(p);
      for (let r = (held.get(best.id) ?? 0) + 1; r <= best.upTo; r++) {
        steps.push({
          nodeId: best.id,
          rank: r,
          cost: p.rec.costs[r - 1]!,
          value: rankValue(p, r, w),
          opens: null,
          filler: false,
          goal,
        });
        left -= p.rec.costs[r - 1]!;
      }
      held.set(best.id, best.upTo);
    }
  };

  if (mode === 'strict') {
    for (const g of ranked)
      search(
        (p) => p.byGoal[g],
        () => g,
      );
  } else {
    search(
      (p) => p.weight,
      (p) => p.goal,
    );
  }

  // Fillers: every point is spent. Nothing of value is affordable any more, so buy any rank that is legal now,
  // parents of valuable nodes (and valuable nodes the points cannot yet finish) first, then the dearest rank
  // that fits (the least waste), then the lowest id. Only a remainder below the cheapest legal rank stays.
  const useful = new Set<number>();
  for (const p of nodes.values()) {
    if (p.weight <= 0) continue;
    const mark = (id: number): void => {
      if (useful.has(id)) return;
      useful.add(id);
      for (const parent of nodes.get(id)!.rec.parents) mark(parent);
    };
    mark(p.rec.id);
  }
  while (left > 0) {
    let pick: { p: Prepared; cost: number } | null = null;
    for (const p of nodes.values()) {
      const cur = held.get(p.rec.id) ?? 0;
      if (cur >= p.rec.maxRank) continue;
      if (
        cur === 0 &&
        ((p.rec.levelGate ?? 0) > heroLevel || p.rec.parents.some((q) => (held.get(q) ?? 0) < 1))
      )
        continue;
      const cost = p.rec.costs[cur]!;
      if (cost > left) continue;
      const better =
        pick === null ||
        (useful.has(p.rec.id) ? 1 : 0) - (useful.has(pick.p.rec.id) ? 1 : 0) > 0 ||
        ((useful.has(p.rec.id) ? 1 : 0) === (useful.has(pick.p.rec.id) ? 1 : 0) &&
          (cost > pick.cost || (cost === pick.cost && p.rec.id < pick.p.rec.id)));
      if (better) pick = { p, cost };
    }
    if (!pick) break;
    const rank = (held.get(pick.p.rec.id) ?? 0) + 1;
    steps.push({
      nodeId: pick.p.rec.id,
      rank,
      cost: pick.cost,
      value: rankValue(pick.p, rank),
      opens: null,
      filler: true,
      goal: null,
    });
    held.set(pick.p.rec.id, rank);
    left -= pick.cost;
  }

  let nextGate: TalentNextGate | null = null;
  const gates = [...new Set(talents.map((t) => t.levelGate ?? 0).filter((g) => g > heroLevel))].sort(
    (a, b) => a - b,
  );
  for (const level of gates) {
    let pick: { id: number; ratio: number; value: number; points: number } | null = null;
    for (const p of nodes.values()) {
      if (p.rec.levelGate !== level || p.weight <= 0 || (held.get(p.rec.id) ?? 0) > 0) continue;
      // The path to the node: its missing ancestors (one rank each), then every rank of the node.
      const c = closure(p.rec.id);
      if (c.gate > level) continue; // a later gate sits on the way; that gate's turn comes later
      let value = 0;
      let points = 0;
      for (const a of c.order) {
        const ap = nodes.get(a)!;
        value += rankValue(ap, 1);
        points += ap.rec.costs[0]!;
      }
      for (let r = 1; r <= p.rec.maxRank; r++) {
        value += rankValue(p, r);
        points += p.rec.costs[r - 1]!;
      }
      if (value <= 0) continue;
      const ratio = value / points;
      if (!pick || ratio > pick.ratio + EPS) pick = { id: p.rec.id, ratio, value, points };
    }
    if (pick) {
      nextGate = { level, nodeId: pick.id, value: pick.value, points: pick.points };
      break;
    }
  }

  return {
    steps,
    pointsSpent: start - left,
    pointsLeft: left,
    before,
    after: totals(),
    locked,
    nextGate,
  };
}
