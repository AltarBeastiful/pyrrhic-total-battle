/**
 * **What the talent analysis prices, built on the main thread** (B-24): the worker takes totals already summed
 * (`derive.ts` reads the tables and the store schema), so each rank's totals are the march's own with the talent's
 * lines at that rank added. When the "Hero Talents" source matches the held ranks (B-25) the march already
 * carries them, so the analysis starts at the held rank and prices the ranks above it; else it starts at rank 0.
 */
import { CAMPAIGN } from '../config';
import { talents } from '../data';
import type { BonusKey, TalentRecord } from '../data/types';
import { aggregateBonuses } from '../engine/bonuses';
import { analysisRanks, talentSource } from '../engine/talentAnalysis';
import { talentCopy } from '../engine/talentCopy';
import type { ResolvedSource } from '../engine/types';
import type { TalentAnalysisInput } from '../worker/talentAnalysis';
import type { DeriveTables } from './derive';
import { buildStackRequest, DEFAULT_TABLES, resolveSources } from './derive';
import type { BattleSetup, Profile } from './schema';

/**
 * The rank the analysis starts from (B-25): the rank held when the "Hero Talents" source matches the held ranks of
 * the whole tree (the march already carries it), else 0 (the source is hand-typed, so rank 0 is the talent removed).
 */
export function talentBaseline(
  profile: Profile,
  node: TalentRecord,
  talentTable: readonly TalentRecord[] = talents,
): number {
  const hero = profile.sources.permanent.find((entry) => entry.builtin === 'heroTalents');
  const copy = talentCopy(talentTable, profile.talents.ranks, hero);
  if (!copy.inSync) return 0;
  return Math.min(profile.talents.ranks[String(node.id)] ?? 0, node.maxRank);
}

/** What `rank` adds to a march that already carries the talent at `baseline`: the lines' difference. */
function increment(node: TalentRecord, rank: number, baseline: number): ResolvedSource | null {
  const at = talentSource(node, rank);
  const from = talentSource(node, baseline);
  if (at === null || from === null) return null;
  const source: ResolvedSource = { ...at };
  delete source.strength;
  delete source.health;
  for (const line of ['strength', 'health'] as const) {
    for (const [key, value] of Object.entries(at[line] ?? {}) as [BonusKey, number][]) {
      source[line] = { ...source[line], [key]: value - (from[line]?.[key] ?? 0) };
    }
  }
  return source;
}

/**
 * The request and the ranked totals of one talent, or null when the battle does not read the talent. The first
 * row is the baseline (see `talentBaseline`), the march as it stands; each later row is that march with the
 * talent's own lines raised from the baseline to the rank, so a held rank is never counted twice.
 */
export function talentAnalysisInput(
  profile: Profile,
  setup: BattleSetup,
  node: TalentRecord,
  tables: DeriveTables = DEFAULT_TABLES,
  talentTable: readonly TalentRecord[] = talents,
): TalentAnalysisInput | null {
  if (talentSource(node, 1) === null) return null;
  const baseline = talentBaseline(profile, node, talentTable);
  const sources = resolveSources(profile, setup, tables);
  const ranks = analysisRanks(node.maxRank - baseline).map((step) => {
    const rank = baseline + step;
    const source = increment(node, rank, baseline);
    return { rank, totals: aggregateBonuses(source === null ? sources : [...sources, source]) };
  });
  return { request: buildStackRequest(profile, setup, tables), baseline, ranks };
}

/**
 * The question an analysis answers: the talent, the army and every number that moves a rating. A held result with
 * another key is stale.
 */
export function talentAnalysisKey(
  profile: Profile,
  setup: BattleSetup,
  node: TalentRecord,
  tables: DeriveTables = DEFAULT_TABLES,
  talentTable: readonly TalentRecord[] = talents,
): string {
  return JSON.stringify([
    node.id,
    talentBaseline(profile, node, talentTable),
    CAMPAIGN.talentFills,
    CAMPAIGN.markerRates,
    buildStackRequest(profile, setup, tables),
  ]);
}
