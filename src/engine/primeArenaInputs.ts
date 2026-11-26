/**
 * Prime Arena input model (B-33): what a player types for the arena and what the match engine reads back.
 *
 * In: the division tier, Leadership and Dominance typed by hand, up to five captains with one shared gear and
 * artifact loadout, and a toggle per bonus source. Out: the troop pool (every Specialist and Monster at the
 * tier, no scouts, siege or mercenaries) and the aggregated bonuses.
 *
 * Pure. The sources are resolved by the same `resolveSources` the march calculator uses, then filtered by the
 * arena's rules; talents do not go through it (the profile's Hero Talents row is typed by hand there), they are
 * read from the rank table through `talentSource`. The output types are standalone: the match engine (B-32)
 * reads `pool`, `housing` and `totals`.
 */
import { getUnits, talents as talentTable } from '../data';
import type { UnitDef } from '../data/types';
import { resolveSources } from '../state/derive';
import { defaultSetup } from '../state/defaults';
import type { BuiltinPermanentSource, Profile } from '../state/schema';
import { aggregateBonuses } from './bonuses';
import { talentSource } from './talentAnalysis';
import type { BonusTotals, Housing, ResolvedSource } from './types';

/** An arena squad has five captains. */
export const PRIME_ARENA_CAPTAINS = 5;

/**
 * The sources that can be switched on or off: exactly the ones the rules count. Titles, clan, kingdom, events,
 * temporary bonuses, the hero and VIP have no switch; they never count.
 */
export const PRIME_ARENA_SOURCES = [
  'captains',
  'equipment',
  'artifacts',
  'dragon',
  'talents',
  ...(['hallOfFame', 'customization', 'armyModernization', 'monstersBoost'] as const),
] as const;
export type PrimeArenaSource = (typeof PRIME_ARENA_SOURCES)[number];
export type PrimeArenaToggles = Record<PrimeArenaSource, boolean>;

/** What counts by default: every source with a switch. */
export const DEFAULT_PRIME_ARENA_TOGGLES: Readonly<PrimeArenaToggles> = {
  captains: true,
  equipment: true,
  artifacts: true,
  dragon: true,
  talents: true,
  hallOfFame: true,
  customization: true,
  armyModernization: true,
  monstersBoost: true,
};

export interface PrimeArenaInput {
  /** Highest troop tier the division unlocks. */
  tier: number;
  leadership: number;
  dominance: number;
  profile: Profile;
  /** Entry ids from `profile.sources`, at most five captains. */
  captains: readonly string[];
  equipment: readonly string[];
  artifacts: readonly string[];
  /** Overrides on `DEFAULT_PRIME_ARENA_TOGGLES`. */
  toggles?: Partial<PrimeArenaToggles>;
  /** Talent ranks by game id; the profile's own ranks when absent. */
  talentRanks?: Readonly<Record<string, number>>;
}

export interface PrimeArenaInputs {
  tier: number;
  /** Troops the squad may field. */
  pool: UnitDef[];
  housing: Housing;
  sources: ResolvedSource[];
  totals: BonusTotals;
}

/** Whether a unit can be in an arena squad: a Specialist or a Monster, never guardsmen, siege, scouts or mercenaries. */
export function isPrimeArenaUnit(unit: UnitDef): boolean {
  return (unit.kind === 'troop' && unit.group === 'specialist') || unit.kind === 'monster';
}

/** Every Specialist and Monster at `tier`. */
export function primeArenaPool(tier: number): UnitDef[] {
  return getUnits().filter((unit) => unit.tier === tier && isPrimeArenaUnit(unit));
}

function talentSources(ranks: Readonly<Record<string, number>>): ResolvedSource[] {
  const out: ResolvedSource[] = [];
  for (const node of talentTable) {
    const rank = ranks[String(node.id)] ?? 0;
    if (rank <= 0) continue;
    const source = talentSource(node, rank);
    if (source !== null) out.push(source);
  }
  return out;
}

export function primeArenaInputs(input: PrimeArenaInput): PrimeArenaInputs {
  if (input.captains.length > PRIME_ARENA_CAPTAINS) {
    throw new Error(`Prime Arena takes at most five captains, got ${String(input.captains.length)}`);
  }
  const on: PrimeArenaToggles = { ...DEFAULT_PRIME_ARENA_TOGGLES, ...input.toggles };
  const { profile } = input;

  const setup = defaultSetup();
  setup.marchType = 'unspecified';
  setup.active = {
    captains: on.captains ? [...input.captains] : [],
    equipment: on.equipment ? [...input.equipment] : [],
    artifacts: on.artifacts ? [...input.artifacts] : [],
    titles: [],
    hero: false,
    events: [],
    otherPills: [],
    vip: false,
    dragon: on.dragon,
    custom: [],
  };

  // Permanent rows are always resolved; the arena decides which of them count: only the built-in rows with a
  // switch. The typed Hero Talents row is replaced by the rank table, so it never counts here.
  const permanent = new Map(profile.sources.permanent.map((row) => [`permanent:${row.id}`, row]));
  const sources = resolveSources(profile, setup).filter((source) => {
    if (source.kind !== 'permanent') return true;
    const builtin: BuiltinPermanentSource | undefined = permanent.get(source.id)?.builtin;
    return builtin !== undefined && builtin in on && on[builtin as PrimeArenaSource];
  });
  if (on.talents) sources.push(...talentSources(input.talentRanks ?? profile.talents.ranks));

  return {
    tier: input.tier,
    pool: primeArenaPool(input.tier),
    housing: { leadership: input.leadership, authority: 0, dominance: input.dominance },
    sources,
    totals: aggregateBonuses(sources),
  };
}
