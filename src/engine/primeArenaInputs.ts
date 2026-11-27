/**
 * Prime Arena input model (B-33): what a player types for the arena and what the match engine reads back.
 *
 * In: the arena's troops card and a battle setup (Leadership and Dominance typed by hand, up to five captains with one
 * shared gear and artifact loadout, the dragon), and a toggle per permanent source and for talents. Out: the troop pool (Guardsmen, Specialists and Monsters from tier 2 up to the Guardsmen level, no scouts, siege or
 * mercenaries) and the aggregated bonuses.
 *
 * Pure. The sources are resolved by the same `resolveSources` the march calculator uses, then filtered by the
 * arena's rules; talents do not go through it (the profile's Hero Talents row is typed by hand there), they are
 * read from the rank table through `talentSource`. The output types are standalone: the match engine (B-32)
 * reads `pool`, `housing` and `totals`.
 */
import { captains as captainTable, getUnits, talents as talentTable } from '../data';
import type { BonusKey, CaptainRecord, UnitDef } from '../data/types';
import { captainCounts, captainValue, resolveSources } from '../state/derive';
import type { BattleSetup, BuiltinPermanentSource, Profile, ProfileTroops } from '../state/schema';
import { aggregateBonuses } from './bonuses';
import { talentSource } from './talentAnalysis';
import type { BonusTotals, Housing, ResolvedSource } from './types';

/** An arena squad has five captains. */
export const PRIME_ARENA_CAPTAINS = 5;

/**
 * The switches left once captains, equipment, artifacts and the dragon are the setup's own lists: the talents
 * (read from the rank table) and the permanent sources the rules count (Hall of Fame, Monuments, Personal Technologies: typed by hand). Titles, clan, kingdom, events,
 * temporary bonuses, the hero and VIP have no switch; they never count.
 */
export const PRIME_ARENA_PERMANENT = [
  'hallOfFame',
  'monuments',
  'personalTechnologies',
] as const satisfies readonly BuiltinPermanentSource[];
export const PRIME_ARENA_SOURCES = ['talents', ...PRIME_ARENA_PERMANENT] as const;
export type PrimeArenaSource = (typeof PRIME_ARENA_SOURCES)[number];
export type PrimeArenaToggles = Record<PrimeArenaSource, boolean>;

/** What counts by default: every source with a switch. */
export const DEFAULT_PRIME_ARENA_TOGGLES: Readonly<PrimeArenaToggles> = {
  talents: true,
  hallOfFame: true,
  monuments: true,
  personalTechnologies: true,
};

export interface PrimeArenaInput {
  /**
   * The arena's Troops card: its Guardsmen "to" level unlocks the troops of that level and below
   * (`primeArenaPool`); the categories and unit ids it drops stay out.
   */
  troops: ProfileTroops;
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
  /** The Guardsmen level the pool was built for. */
  level: number;
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

/** The lowest tier a troop of the arena may be: tier-1 troops never fight there (monsters begin at 3 on their own). */
export const PRIME_ARENA_MIN_TIER = 2;

/** The Guardsmen "to" level of the Troops card: the one number that fixes the arena's pool; 0 while the row is off. */
export function primeArenaLevel(troops: ProfileTroops): number {
  return troops.guardsmen?.max ?? 0;
}

/** Whether some squad could field this unit, at a high enough level and with nothing dropped. */
function canEverFight(unit: UnitDef): boolean {
  const isGuardsman = unit.kind === 'troop' && unit.group === 'guardsmen';
  return (isGuardsman || isPrimeArenaUnit(unit)) && unit.tier >= PRIME_ARENA_MIN_TIER;
}

/**
 * The troops a squad may field, in one place: the Guardsmen, the Specialists and the Monsters from tier 2 up to
 * the Guardsmen level (G2, S2 and M3 are the lowest), minus what the Troops card drops: the top tier's dropped
 * categories and any dropped unit id. No engineers, scouts, siege or mercenaries.
 */
export function primeArenaPool(troops: ProfileTroops): UnitDef[] {
  const level = primeArenaLevel(troops);
  return getUnits().filter((unit) => {
    if (!canEverFight(unit) || unit.tier > level) return false;
    if (troops.excludedUnitIds.includes(unit.id)) return false;
    if (unit.tier === level && unit.category !== undefined) {
      const dropped =
        unit.kind === 'troop' && unit.group === 'guardsmen'
          ? troops.topTierExcluded.guardsmen
          : unit.group === 'specialist'
            ? troops.topTierExcluded.specialists
            : [];
      if (dropped.includes(unit.category)) return false;
    }
    return true;
  });
}

type OwnedCaptain = Profile['sources']['captains'][number];

/**
 * The bonus points of a captain that count in the arena at this level and star: none for one limited to a kind of
 * march (`captainCounts`), and none on a key no arena unit reads (Brann's engineers never fight there).
 */
function arenaPoints(record: CaptainRecord, { level, star }: OwnedCaptain, read: Set<BonusKey>): number {
  if (!captainCounts(record, 'arena')) return 0;
  let points = 0;
  for (const progression of [record.health, record.strength]) {
    if (progression !== undefined && read.has(progression.key)) {
      points += captainValue(progression, level, star);
    }
  }
  if (record.special !== undefined) points += captainValue(record.special, level, star);
  return points;
}

/**
 * The owned captains (level 1 and above, the first entry of each, the one its chip shows) from the strongest down:
 * the highest level first, then the most points that count in the arena, then the picker's order (B-45).
 */
export function rankArenaCaptains(owned: readonly OwnedCaptain[]): OwnedCaptain[] {
  const read = new Set(
    getUnits()
      .filter(canEverFight)
      .flatMap((unit) => unit.keys),
  );
  return captainTable
    .flatMap((record) => {
      const entry = owned.find((candidate) => candidate.captainId === record.id);
      return entry === undefined || entry.level < 1
        ? []
        : [{ entry, points: arenaPoints(record, entry, read) }];
    })
    .sort((a, b) => b.entry.level - a.entry.level || b.points - a.points)
    .map((ranked) => ranked.entry);
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
    // The arena meets no march kind: captains limited to one (Amanitore, Hercules) do not count.
    marchType: 'arena',
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
    level: primeArenaLevel(input.troops),
    pool: primeArenaPool(input.troops),
    housing: { leadership: setup.housing.leadership, authority: 0, dominance: setup.housing.dominance },
    sources,
    totals: aggregateBonuses(sources),
  };
}
