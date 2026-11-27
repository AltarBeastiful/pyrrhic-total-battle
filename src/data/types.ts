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
/**
 * Captain progression on one key: bonus% = level × perLevel + stars[star].
 * WATCH THE OFFSET: in game a captain has 1 to 7 stars, but `stars` is indexed from 0, so
 * index = in-game stars − 1 (stars[0] is 1 star, stars[2] is 3 stars, stars[6] is 7 stars).
 * The `star` stored on a captain entry is that same 0..6 index.
 */
export interface CaptainProgression {
  key: BonusKey;
  perLevel: number;
  stars: number[]; // 7 entries, index = in-game stars − 1 (0..6)
}
/**
 * The kinds of march a bonus can be limited to (W17 C5-0): `solo` (one player's own march), `group`
 * (group marches, reinforcements and raids: Amanitore) and `epic` (battles against epic monsters:
 * Hercules).
 */
export const MARCH_TYPES = ['solo', 'group', 'epic'] as const;
export type MarchType = (typeof MARCH_TYPES)[number];
export interface CaptainRecord {
  id: string;
  name: string;
  health?: CaptainProgression;
  strength?: CaptainProgression;
  special?: { key: SpecialKey; perLevel: number; stars: number[] };
  /** The one kind of march the bonus applies on, the restriction `note` states in the game's words. */
  onlyOn?: MarchType;
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

/**
 * What one row of an artifact (a level, or a star step) gives, in the game's own values (B-39). Empty when
 * the app carries none of the row's effects.
 */
export interface ArtifactRow extends Pick<BonusContribution, 'health' | 'strength' | 'special'> {
  /** Bonuses the game gives against other players only: they count in Prime Arena and nowhere else (B-41). */
  againstPlayers?: Pick<BonusContribution, 'health' | 'strength'>;
}

/** Built from the game export by `scripts/artifacts-convert.ts`; never edited by hand. */
export interface ArtifactRecord {
  id: string;
  name: string;
  /** Keys "1".."60". An artifact's total is its level row plus its star row. */
  levels: Record<string, ArtifactRow>;
  /** Keys "0.1".."5.0", the in-game star notation. The two rows may feed different stats. */
  stars: Record<string, ArtifactRow>;
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

/** Leadership, authority and dominance at each level, 1 to 600: index = level − 1. */
export interface CapacityLadder {
  leadership: number[];
  authority: number[];
  dominance: number[];
}

/** What a captain (every captain holds the same figures) and the hero can lead at each level (B-43). */
export interface CapacityTable {
  captain: CapacityLadder;
  hero: CapacityLadder;
}

export interface TempleTable {
  /** Temple level (1..45) → revival cost divisor (1.04 … 5.91). Level 0 = 1. */
  multiplier: Record<string, number>;
}

/** The four hero-ability trees (the game's branches 18 to 21). */
export const TALENT_TREES = ['battle', 'expert', 'economy', 'archeology'] as const;
export type TalentTree = (typeof TALENT_TREES)[number];

/**
 * One node of a hero talent tree (B-21). Ranks are 1-based; `values[r - 1]` and `costs[r - 1]` belong
 * to rank `r`.
 */
export interface TalentRecord {
  /** The game's own tech id (25001 ...). Saved ranks are keyed by it, so it never changes. */
  id: number;
  name: string;
  tree: TalentTree;
  maxRank: number;
  /** Where the node sits on the game's grid, and how the game draws the link to its parent (null for the few nodes the game draws no link to). */
  layout: { x: number; y: number; link: string | null; place: string | null; flipped: boolean };
  /** Nodes that must each hold one rank before this node's first rank can be bought. Empty for a root. */
  parents: number[];
  /** Hero level needed for the first rank, when the game gates it. */
  levelGate?: number;
  /** The game's stat kinds the node affects (`UNIT_POWER`, `MARCH_SPEED` ...), usually one. */
  stats: string[];
  /** The game's unit (or building) ids the bonus applies to. Empty when it applies to nothing in particular. */
  unitIds: number[];
  /** Total bonus in percent at each rank, the game's own table (not a straight line). Negative for a price cut. */
  values: number[];
  /** Talent points each rank costs. */
  costs: number[];
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

/**
 * The order the game's battle selection screen lists unit types in, top to bottom. Display only: the
 * engine never reads it. Units the screen did not list are absent, and callers keep their own order
 * for them.
 */
export interface BattleSelectionOrder {
  source: string; // where and when the order was read
  troops: string[];
  monsters: string[];
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
