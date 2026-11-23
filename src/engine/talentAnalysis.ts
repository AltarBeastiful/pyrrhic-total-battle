/**
 * **The pure half of the talent analysis** (B-24): which ranks of a talent are priced, what a rank adds to the
 * bonus totals, and how the shapes are averaged. The pricing itself is a job of the calculation pool
 * (`src/worker/talentAnalysis.ts`); nothing here runs a battle.
 */
import type { BonusKey, TalentRecord } from '../data/types';
import type { ResolvedSource } from './types';

/** A talent this short is priced at every rank. */
const EVERY_RANK_UNTIL = 4;

/**
 * The ranks the analysis prices: 0, the maximum, and three evenly spaced whole ranks between (a quarter, a half,
 * three quarters), sorted and without repeats. A talent of four ranks or fewer is priced at every rank.
 */
export function analysisRanks(maxRank: number): number[] {
  if (maxRank <= EVERY_RANK_UNTIL) return Array.from({ length: maxRank + 1 }, (_, rank) => rank);
  const ranks = new Set<number>([0, maxRank]);
  for (const share of [0.25, 0.5, 0.75]) ranks.add(Math.round(maxRank * share));
  return [...ranks].sort((a, b) => a - b);
}

/** The bonus key a battle talent is about, read from the game's own node name; null where the battle reads none. */
const KEY_STEMS: readonly (readonly [string, BonusKey])[] = [
  ["Guardsmen's ", 'guardsmen'],
  ["Specialists' ", 'specialist'],
  ["Monsters' ", 'monster'],
  ["Engineer corps' ", 'engineers'],
  ["Siege engines' ", 'engineers'],
  ["Melee units' ", 'melee'],
  ["Ranged units' ", 'ranged'],
  ["Mounted units' ", 'mounted'],
  ["Flying units' ", 'flying'],
  ['Army ', 'army'],
];

function keyOf(node: Pick<TalentRecord, 'name'>): BonusKey | null {
  return KEY_STEMS.find(([stem]) => node.name.startsWith(stem))?.[1] ?? null;
}

/** The stat a battle talent adds to: strength or health on one key. Crit, fortifications and the rest are not read. */
function lineOf(
  node: Pick<TalentRecord, 'name' | 'stats' | 'values'>,
): { line: 'strength' | 'health'; key: BonusKey } | null {
  const { values } = node;
  const key = keyOf(node);
  if (key === null || values.length === 0) return null;
  if (node.stats.includes('UNIT_POWER')) return { line: 'strength', key };
  if (node.stats.includes('UNIT_HEALTH')) return { line: 'health', key };
  return null;
}

/** Whether the analysis can price this talent at all. */
export function isAnalyzable(node: Pick<TalentRecord, 'name' | 'stats' | 'values'>): boolean {
  return lineOf(node) !== null;
}

/**
 * The source a talent holds at `rank`: the game's running total for that rank on the node's key. Null when the
 * battle does not read the talent. Rank 0 is a source that adds nothing.
 */
export function talentSource(node: TalentRecord, rank: number): ResolvedSource | null {
  const target = lineOf(node);
  if (target === null) return null;
  const source: ResolvedSource = { id: `talent-${String(node.id)}`, label: node.name, kind: 'hero' };
  const value = rank > 0 ? (node.values[Math.min(rank, node.values.length) - 1] ?? 0) : 0;
  if (value !== 0) source[target.line] = { [target.key]: value };
  return source;
}

/** The plain mean of the shapes' gains, rank by rank. */
export function meanOf(shapes: readonly (readonly number[])[]): number[] {
  const first = shapes[0];
  if (first === undefined) return [];
  return first.map((_, index) => shapes.reduce((sum, shape) => sum + (shape[index] ?? 0), 0) / shapes.length);
}

/**
 * Every talent the rating can read, in table order across all trees, and how many it cannot (B-28). The set is
 * asked of `isAnalyzable`, never listed, so a talent that gains a battle effect joins by itself.
 */
export function analyzableTalents<T extends Pick<TalentRecord, 'name' | 'stats' | 'values'>>(
  table: readonly T[],
): { rated: T[]; notRated: number } {
  const rated = table.filter(isAnalyzable);
  return { rated, notRated: table.length - rated.length };
}

// ---- Steadier rankings (experiment 365) -------------------------------------------------------------
/**
 * How Analyze all reads the list. Experiment 364 showed the plain list moves with the army size and the enemy
 * (rank correlation 0.46-0.68 against the saved setup); 365 scored the fixes on 5 armies x 3 tree states under 12
 * perturbed setups (stability = mean pairwise Spearman, agreement = against the consensus of the plain re-sized slope):
 *
 *  - `current`  endpoint of the re-sized march on this setup alone: stability 0.55, agreement 0.67 (the old list);
 *  - `march`    the same counts battled under each rank, this setup alone: 0.70 / 0.59;
 *  - `balanced` the re-sized march averaged over 4 army sizes x 4 enemy mixes, ranked by slope: 0.80 / 0.81;
 *  - `steady`   the same grid with the counts held fixed, ranked by slope: 0.98 / 0.66.
 */
export const RANKING_METHODS = ['current', 'march', 'balanced', 'steady'] as const;
export type RankingMethod = (typeof RANKING_METHODS)[number];

/** The enemy mixes a grid method averages over (shares of each category). */
export const ENEMY_MIXES: readonly Record<'melee' | 'ranged' | 'mounted' | 'flying', number>[] = [
  { melee: 1, ranged: 1, mounted: 1, flying: 1 },
  { melee: 0.7, ranged: 0.1, mounted: 0.1, flying: 0.1 },
  { melee: 0.1, ranged: 0.7, mounted: 0.1, flying: 0.1 },
  { melee: 0.1, ranged: 0.1, mounted: 0.7, flying: 0.1 },
];

export interface RankingPlan {
  /** `sized` re-sizes the march at each rank; `fixed` battles the current counts under each rank. */
  reading: 'sized' | 'fixed';
  /** Army sizes as shares of the march's housing; `[1]` is the march alone. */
  sizes: readonly number[];
  /** Whether the grid replaces the march's enemy by `ENEMY_MIXES`; false keeps the march's own enemy. */
  enemies: boolean;
  /** `endpoint` is the gain at the maximum rank over the points; `slope` fits every priced rank. */
  score: 'endpoint' | 'slope';
}

const GRID_SIZES = [0.5, 0.75, 1, 1.5] as const;
export const RANKING_PLANS: Record<RankingMethod, RankingPlan> = {
  current: { reading: 'sized', sizes: [1], enemies: false, score: 'endpoint' },
  march: { reading: 'fixed', sizes: [1], enemies: false, score: 'endpoint' },
  balanced: { reading: 'sized', sizes: GRID_SIZES, enemies: true, score: 'slope' },
  steady: { reading: 'fixed', sizes: GRID_SIZES, enemies: true, score: 'slope' },
};

/**
 * Gain per talent point by least squares through the origin over every priced rank: `points[i]` is what rank i
 * costs from the baseline (`points[0]` is 0, the baseline itself), `gains[i]` its gain. Null when nothing is left to buy.
 */
export function slopeOf(points: readonly number[], gains: readonly number[]): number | null {
  let xy = 0;
  let xx = 0;
  points.forEach((x, i) => {
    xy += x * (gains[i] ?? 0);
    xx += x * x;
  });
  return xx > 0 ? xy / xx : null;
}
