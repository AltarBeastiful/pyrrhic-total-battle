/**
 * Data contract shared by the game tables (`src/data/tables/*.json`), their loaders, the engine and the UI.
 * This file is the single source of truth for the shapes below; the zod schemas in `src/data/schema.ts`
 * must match it exactly (they are type-checked against these types). Changing a shape here is a data
 * migration (ADR-0004, ADR-0007) and must be reported to the orchestrator.
 */

// ---- Bonus keys ---------------------------------------------------------------------------------
export const CATEGORIES = ['melee', 'ranged', 'mounted', 'flying'] as const;
export type Category = (typeof CATEGORIES)[number];

export const GROUPS = ['guardsmen', 'specialist', 'engineers', 'monster'] as const;
export type Group = (typeof GROUPS)[number];

export const RACES = ['beast', 'elemental', 'dragon', 'giant'] as const;
export type Race = (typeof RACES)[number];

/** The 13 keys health and strength bonuses are expressed on (PLAN §3.1). */
export const BONUS_KEYS = [...CATEGORIES, ...GROUPS, 'army', ...RACES] as const;
export type BonusKey = (typeof BONUS_KEYS)[number];

export const SPECIAL_KEYS = [
  'doubleDamageChance',
  'strikeTwoSquadsChance',
  'beastsStrikeTwoSquadsChance',
  'elementalsStrikeTwoSquadsChance',
  'dragonsStrikeTwoSquadsChance',
  'giantsStrikeTwoSquadsChance',
  'guardsmenDoubleDamageChance',
  'specialistsDoubleDamageChance',
  'engineersDoubleDamageChance',
  'monstersDoubleDamageChance',
  'armyStrengthAgainstEpicMonsters',
] as const;
export type SpecialKey = (typeof SPECIAL_KEYS)[number];

/** Targets a unit can have a "strength against" bonus for (read from the unit sheet in game). */
export const STRENGTH_AGAINST_KEYS = [
  ...CATEGORIES,
  'engineers',
  'beasts',
  'elementals',
  'dragons',
  'giants',
  'epicMonsters',
  'swarmUnits',
] as const;
export type StrengthAgainstKey = (typeof STRENGTH_AGAINST_KEYS)[number];

export type BonusMap = Partial<Record<BonusKey, number>>; // percentages as entered, e.g. 39.5
export type SpecialMap = Partial<Record<SpecialKey, number>>; // percentages
export type StrengthAgainstMap = Partial<Record<StrengthAgainstKey, number>>; // percentages
/** Category-vs-target strength bonus (equipment): e.g. melee attacking mounted +39 %. */
export interface MatchupBonus {
  attacker: Category;
  target: StrengthAgainstKey;
  value: number;
}

/** One source's contribution, the unit every bonus editor and every table resolves to. */
export interface BonusContribution {
  health?: BonusMap;
  strength?: BonusMap;
  special?: SpecialMap;
  matchup?: MatchupBonus[];
}

// ---- Unit tables --------------------------------------------------------------------------------
export interface RevivalCost {
  gold: number;
}
export interface Training {
  seconds: number;
  silver: number;
  dragonCoins?: number;
}

/** Leadership troops (guardsmen, specialists, engineers). */
export interface TroopRecord {
  id: string; // kebab-case, e.g. "archer-1"
  name: string; // "Archer I"
  label: string; // short pill label, e.g. "ARC1"
  group: Exclude<Group, 'monster'>;
  tier: number; // 1..9
  category?: Category; // absent for engineers
  race?: Race; // e.g. battle griffins are beasts
  cost: number; // leadership per unit
  health: number;
  strength: number;
  strengthAgainst?: StrengthAgainstMap;
  doubleDamageChance?: number; // unit's own chance, percent
  revival: RevivalCost;
  training: Training;
}

/** Dominance monsters. */
export interface MonsterRecord {
  id: string;
  name: string;
  label: string;
  tier: number; // 3..9
  category: Category;
  race: Race;
  cost: number; // dominance per unit
  health: number;
  strength: number;
  strengthAgainst?: StrengthAgainstMap;
  doubleDamageChance?: number;
  revival: RevivalCost;
  training: Training; // includes dragonCoins
}

/** Authority mercenaries. `tags` are the bonus keys the mercenary benefits from (role, category, race). */
export interface MercenaryRecord {
  id: string;
  name: string;
  label: string;
  tier: number;
  tags: Exclude<BonusKey, 'army'>[];
  cost: number; // authority per unit
  health: number;
  strength: number;
  strengthAgainst?: StrengthAgainstMap;
  doubleDamageChance?: number;
  revival: RevivalCost;
  /** Event this mercenary belongs to (its `swarmUnits`/event bonuses apply only when that event is active). */
  event?: string;
}

// ---- Bonus source tables -------------------------------------------------------------------------
/** Captain progression on one key: bonus% = level × perLevel + stars[star] (star 0..6). */
export interface CaptainProgression {
  key: BonusKey;
  perLevel: number;
  stars: number[]; // 7 entries, index = star level 0..6
}
export interface CaptainRecord {
  id: string;
  name: string;
  health?: CaptainProgression;
  strength?: CaptainProgression;
  special?: { key: SpecialKey; perLevel: number; stars: number[] };
  note?: string; // e.g. "applies only against epic monsters"
}

export const QUALITIES = [
  'poor',
  'common',
  'uncommon',
  'rare',
  'epic',
  'legendary',
  'ascendant',
  'godlike',
] as const;
export type Quality = (typeof QUALITIES)[number];
export interface EquipmentRecord {
  id: string;
  name: string;
  byQuality: Partial<Record<Quality, BonusContribution>>;
}

/** Level → percent tables; `star` keys are the in-game star notation "0.1".."5.0". */
export interface LevelTable {
  base?: Record<string, number>; // "1".."60"
  star?: Record<string, number>;
}
export interface ArtifactRecord {
  id: string;
  name: string;
  /** Which key each progression feeds; the value comes from `levels` or is typed by the user when unknown. */
  health?: { key: BonusKey; levels?: LevelTable };
  strength?: { key: BonusKey; levels?: LevelTable };
  special?: { key: SpecialKey; levels?: LevelTable };
  randomBonusOptions: string[]; // option ids the random bonus can take, e.g. "armyHealth"
}

export interface TitleRecord {
  id: string;
  name: string;
  bonus: BonusContribution;
}

/**
 * The fixed "+25 %" pills that sit beside the heroes in game (Personal / Clan / Kingdom health and
 * strength). Same shape as a title, its own table because it is its own screen.
 */
export type OtherPillRecord = TitleRecord;

export interface HeroRecord {
  id: string;
  name: string;
  bonus: BonusContribution;
  aloneOnly?: boolean; // Svyatogor: only when marching alone
}

export interface EventRecord {
  id: string; // "arachnes", "ragnarok-fenrir"
  name: string;
  /** Extra strength added inside the same additive bracket, percent (Ragnarok +130). */
  strength?: number;
  /** Enemy formation forced while the event is active (Arachne's: 2 of each). */
  enemyFormation?: Record<Category, number>;
  /** Strength-against key that becomes active for units carrying it (Arachne's: swarmUnits). */
  activatesStrengthAgainst?: StrengthAgainstKey;
}

/** VIP level → army bonus percent (health and strength given separately, some levels give only one). */
export interface VipRecord {
  level: number;
  bonus: BonusContribution;
}

export interface TempleTable {
  /** Temple level (1..45) → revival cost divisor (1.04 … 5.91). Level 0 = 1. */
  multiplier: Record<string, number>;
}

export interface DataVersion {
  dataVersion: number;
  verifiedOn: string; // ISO date
  notes: string;
}

/** Default kill orders (first to die first), used by the custom-order editor as its starting list. */
export interface OrderTables {
  troops: string[];
  monsters: string[];
  captains: string[]; // display order of captains in the picker
}

// ---- Engine-facing unified unit -------------------------------------------------------------------
export type Pool = 'leadership' | 'authority' | 'dominance';
export type UnitKind = 'troop' | 'monster' | 'mercenary';

/**
 * One unit type as the engine sees it. Built by `src/data/index.ts` from the three tables, or by the UI for
 * custom mercenaries. `keys` = every bonus key the unit benefits from, `army` included.
 */
export interface UnitDef {
  id: string;
  name: string;
  label: string;
  kind: UnitKind;
  pool: Pool;
  tier: number;
  group?: Group; // troops: guardsmen/specialist/engineers; monsters: 'monster'; mercenaries: from tags
  category?: Category;
  race?: Race;
  keys: BonusKey[];
  cost: number;
  health: number;
  strength: number;
  strengthAgainst: StrengthAgainstMap;
  doubleDamageChance: number; // percent, 0 when none
  revival: RevivalCost;
  training?: Training; // mercenaries have none (cannot be retrained)
  event?: string;
}
