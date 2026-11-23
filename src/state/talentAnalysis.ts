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
import {
  analysisRanks,
  analyzableTalents,
  ENEMY_MIXES,
  RANKING_PLANS,
  talentSource,
  type RankingMethod,
} from '../engine/talentAnalysis';
import { heldRank, talentCopy } from '../engine/talentCopy';
import { talentReach } from '../engine/talents';
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
  return heldRank(node, profile.talents.ranks);
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

/** One analysable talent of the whole table, with what the worker needs to price it. */
export interface TalentAnalysisJob {
  node: TalentRecord;
  /** The rank the analysis starts from (the single Analyze's baseline). */
  baseline: number;
  /** The input on the march as it stands (the first of `inputs`). */
  input: TalentAnalysisInput;
  /** Talent points to buy first so that the node can be bought: its missing ancestors' first ranks; 0 when open. */
  toReach: number;
  /** One input per context the method reads: one for the plain list, a size x enemy grid for the steadier ones. */
  inputs: TalentAnalysisInput[];
}

/** The contexts a ranking method reads one talent in: the march's housing scaled, the enemy swapped, the reading chosen. */
function contextsOf(input: TalentAnalysisInput, method: RankingMethod): TalentAnalysisInput[] {
  const plan = RANKING_PLANS[method];
  const enemies = plan.enemies ? ENEMY_MIXES : [null];
  return plan.sizes.flatMap((size) =>
    enemies.map((enemy): TalentAnalysisInput => {
      const { housing } = input.request;
      return {
        ...input,
        reading: plan.reading,
        request: {
          ...input.request,
          housing: {
            leadership: Math.round(housing.leadership * size),
            authority: Math.round(housing.authority * size),
            dominance: Math.round(housing.dominance * size),
          },
          ...(enemy === null ? {} : { enemy: { ...enemy } }),
        },
      };
    }),
  );
}

/**
 * **Analyze all** (B-28): the input of every talent the rating can read, asked of the engine (`analyzableTalents`)
 * and built by the same `talentAnalysisInput` the single Analyze uses, so the two cannot disagree. `notRated` counts
 * only the talents the engine cannot read; a readable talent whose input could not be built is `skipped`, apart.
 */
export function allTalentsInputs(
  profile: Profile,
  setup: BattleSetup,
  tables: DeriveTables = DEFAULT_TABLES,
  talentTable: readonly TalentRecord[] = talents,
  method: RankingMethod = 'current',
): { jobs: TalentAnalysisJob[]; notRated: number; skipped: number; levelLocked: number } {
  const { rated, notRated } = analyzableTalents(talentTable);
  const reach = talentReach(talentTable, profile.talents.ranks);
  const jobs: TalentAnalysisJob[] = [];
  let levelLocked = 0;
  for (const node of rated) {
    const own = reach.get(node.id);
    // A talent the hero's level does not open yet (its own gate or an ancestor's) is not a choice: it is left out.
    if ((own?.levelGate ?? 0) > profile.talents.heroLevel) {
      levelLocked++;
      continue;
    }
    const input = talentAnalysisInput(profile, setup, node, tables, talentTable);
    if (input === null) continue;
    const inputs = method === 'current' ? [input] : contextsOf(input, method);
    jobs.push({
      node,
      baseline: input.baseline ?? 0,
      toReach: own?.pointsToReach ?? 0,
      input: inputs[0] ?? input,
      inputs,
    });
  }
  return { jobs, notRated, skipped: rated.length - jobs.length - levelLocked, levelLocked };
}

/** The question the ranking answers: every number that moves a rating, once for the whole table. */
export function allTalentsKey(
  profile: Profile,
  setup: BattleSetup,
  tables: DeriveTables = DEFAULT_TABLES,
  talentTable: readonly TalentRecord[] = talents,
  method: RankingMethod = 'current',
): string {
  return JSON.stringify([
    method,
    profile.talents.heroLevel,
    profile.talents.ranks,
    talentTable.map((node) => [node.id, talentBaseline(profile, node, talentTable)]),
    CAMPAIGN.talentFills,
    CAMPAIGN.markerRates,
    buildStackRequest(profile, setup, tables),
  ]);
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
