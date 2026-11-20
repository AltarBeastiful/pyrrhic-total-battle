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
function lineOf(node: Pick<TalentRecord, 'name' | 'stats' | 'values'>): { line: 'strength' | 'health'; key: BonusKey } | null {
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
