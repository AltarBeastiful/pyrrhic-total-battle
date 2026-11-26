/**
 * Prime Arena input model (B-33): what a player types for the arena and what the match engine reads back.
 *
 * In: the division tier and a battle setup (Leadership and Dominance typed by hand, up to five captains with one
 * shared gear and artifact loadout, the dragon), and a toggle per permanent source and for talents. Out: the troop pool (every Specialist and Monster at the
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
import type { BattleSetup, BuiltinPermanentSource, Profile } from '../state/schema';
import { aggregateBonuses } from './bonuses';
import { talentSource } from './talentAnalysis';
import type { BonusTotals, Housing, ResolvedSource } from './types';

/** An arena squad has five captains. */
export const PRIME_ARENA_CAPTAINS = 5;

/**
 * The switches left once captains, equipment, artifacts and the dragon are the setup's own lists: the talents
 * (read from the rank table) and the four permanent sources the rules count. Titles, clan, kingdom, events,
 * temporary bonuses, the hero and VIP have no switch; they never count.
 */
export const PRIME_ARENA_PERMANENT = [
  'hallOfFame',
  'customization',
  'armyModernization',
  'monstersBoost',
] as const satisfies readonly BuiltinPermanentSource[];
export const PRIME_ARENA_SOURCES = ['talents', ...PRIME_ARENA_PERMANENT] as const;
export type PrimeArenaSource = (typeof PRIME_ARENA_SOURCES)[number];
export type PrimeArenaToggles = Record<PrimeArenaSource, boolean>;

/** What counts by default: every source with a switch. */
export const DEFAULT_PRIME_ARENA_TOGGLES: Readonly<PrimeArenaToggles> = {
  talents: true,
  hallOfFame: true,
  customization: true,
  armyModernization: true,
  monstersBoost: true,
};

export interface PrimeArenaInput {
  /** Highest troop tier the division unlocks. */
  tier: number;
  profile: Profile;
  /**
   * The squad: up to five captains, the shared gear and the dragon in `active`, Leadership and Dominance in
   * `housing`. Whatever else it holds (titles, events, hero, VIP, temporary sources, march type) is ignored.
   */
  setup: BattleSetup;
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
  const { profile, setup: given } = input;
  if (given.active.captains.length > PRIME_ARENA_CAPTAINS) {
    throw new Error(`Prime Arena takes at most five captains, got ${String(given.active.captains.length)}`);
  }
  const on: PrimeArenaToggles = { ...DEFAULT_PRIME_ARENA_TOGGLES, ...input.toggles };

  // Only the squad's own lists count; the sources the rules leave out are cleared whatever the setup holds.
  const setup: BattleSetup = {
    ...given,
    marchType: 'unspecified',
    active: {
      ...given.active,
      titles: [],
      hero: false,
      events: [],
      otherPills: [],
      vip: false,
      custom: [],
    },
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
    housing: { leadership: setup.housing.leadership, authority: 0, dominance: setup.housing.dominance },
    sources,
    totals: aggregateBonuses(sources),
  };
}
