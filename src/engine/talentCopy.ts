/**
 * **The totals of the talent ranks the player holds** (B-25): the lines the "Hero Talents" source should carry,
 * how many held talents the battle does not read, whether a source already matches the tree, and what differs.
 * It reads talents by the rule the analysis uses (`talentSource`), so the copy, the Analyze and the battle agree.
 */
import type { BonusKey, TalentRecord } from '../data/types';
import { talentSource } from './talentAnalysis';

export type TalentLine = 'strength' | 'health';

/** The two lines a talent can change, per bonus key; a key absent is zero. */
export interface TalentLines {
  strength: Partial<Record<BonusKey, number>>;
  health: Partial<Record<BonusKey, number>>;
}

export interface TalentDifference {
  line: TalentLine;
  key: BonusKey;
  /** What the held ranks give. */
  tree: number;
  /** What the source holds. */
  source: number;
}

export interface TalentCopy {
  /** The lines to copy: zeros omitted. */
  lines: TalentLines;
  /** Talents held at rank 1 or more (the button is disabled at 0). */
  held: number;
  /** Held talents the battle does not read. */
  noEffect: number;
  /** Every line of the source equals the tree's, a missing line being zero. */
  inSync: boolean;
  /** The largest differences, biggest first, at most three. */
  differences: TalentDifference[];
}

const MOST_DIFFERENCES = 3;
const LINES: readonly TalentLine[] = ['strength', 'health'];

/** What a source holds, as the two maps the schema stores; anything absent reads as zero. */
export type TalentSourceLines = { [L in TalentLine]?: Partial<Record<BonusKey, number>> | undefined };

export function talentCopy(
  nodes: readonly TalentRecord[],
  ranks: Readonly<Record<string, number>>,
  source: TalentSourceLines | undefined,
): TalentCopy {
  const sum: TalentLines = { strength: {}, health: {} };
  let held = 0;
  let noEffect = 0;
  for (const node of nodes) {
    const rank = ranks[String(node.id)] ?? 0;
    if (rank <= 0) continue;
    held++;
    const one = talentSource(node, rank);
    if (one === null) {
      noEffect++;
      continue;
    }
    for (const line of LINES) {
      for (const [key, value] of Object.entries(one[line] ?? {}) as [BonusKey, number][]) {
        sum[line][key] = (sum[line][key] ?? 0) + value;
      }
    }
  }
  const lines: TalentLines = { strength: {}, health: {} };
  for (const line of LINES) {
    for (const [key, value] of Object.entries(sum[line]) as [BonusKey, number][]) {
      if (value !== 0) lines[line][key] = value;
    }
  }
  const differences: TalentDifference[] = [];
  for (const line of LINES) {
    const keys = new Set([...Object.keys(lines[line]), ...Object.keys(source?.[line] ?? {})] as BonusKey[]);
    for (const key of keys) {
      const tree = lines[line][key] ?? 0;
      const stored = source?.[line]?.[key] ?? 0;
      if (tree !== stored) differences.push({ line, key, tree, source: stored });
    }
  }
  const inSync = differences.length === 0;
  differences.sort((a, b) => Math.abs(b.tree - b.source) - Math.abs(a.tree - a.source));
  return { lines, held, noEffect, inSync, differences: differences.slice(0, MOST_DIFFERENCES) };
}
