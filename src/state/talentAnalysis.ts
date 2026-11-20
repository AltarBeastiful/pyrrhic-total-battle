/**
 * **What the talent analysis prices, built on the main thread** (B-24): the worker takes totals already summed
 * (`derive.ts` reads the tables and the store schema), so each rank's totals are the march's own with the talent's
 * lines at that rank added. The talent ranks the player holds are not summed into the march's bonuses (the
 * "Hero Talents" source is typed by hand), so rank 0 is the march as it stands and a rank is what the talent would
 * add to it.
 */
import { CAMPAIGN } from '../config';
import type { TalentRecord } from '../data/types';
import { aggregateBonuses } from '../engine/bonuses';
import { analysisRanks, talentSource } from '../engine/talentAnalysis';
import type { TalentAnalysisInput } from '../worker/talentAnalysis';
import type { DeriveTables } from './derive';
import { buildStackRequest, DEFAULT_TABLES, resolveSources } from './derive';
import type { BattleSetup, Profile } from './schema';

/** The request and the ranked totals of one talent, or null when the battle does not read the talent. */
export function talentAnalysisInput(
  profile: Profile,
  setup: BattleSetup,
  node: TalentRecord,
  tables: DeriveTables = DEFAULT_TABLES,
): TalentAnalysisInput | null {
  if (talentSource(node, 1) === null) return null;
  const sources = resolveSources(profile, setup, tables);
  const ranks = analysisRanks(node.maxRank).map((rank) => {
    const source = talentSource(node, rank);
    return { rank, totals: aggregateBonuses(source === null ? sources : [...sources, source]) };
  });
  return { request: buildStackRequest(profile, setup, tables), ranks };
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
): string {
  return JSON.stringify([node.id, CAMPAIGN.talentFills, CAMPAIGN.markerRates, buildStackRequest(profile, setup, tables)]);
}
