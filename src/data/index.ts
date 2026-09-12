/**
 * Typed access to the game tables.
 *
 * The JSON under `tables/` is validated by `pnpm data:check` and by `data.test.ts`, so the app trusts
 * it at runtime and simply types the import: no parsing cost on startup (ADR-0007). Everything the
 * engine needs about a unit is flattened into `UnitDef` by `getUnits()`.
 */
import artifactsJson from './tables/artifacts.json';
import captainsJson from './tables/captains.json';
import equipmentJson from './tables/equipment.json';
import eventsJson from './tables/events.json';
import heroesJson from './tables/heroes.json';
import mercenariesJson from './tables/mercenaries.json';
import monstersJson from './tables/monsters.json';
import ordersJson from './tables/orders.json';
import otherPillsJson from './tables/otherPills.json';
import templeJson from './tables/temple.json';
import titlesJson from './tables/titles.json';
import troopsJson from './tables/troops.json';
import versionJson from './tables/version.json';
import vipJson from './tables/vip.json';
import { CATEGORIES, GROUPS, RACES } from './types.ts';
import type {
  ArtifactRecord,
  BonusKey,
  CaptainRecord,
  Category,
  DataVersion,
  EquipmentRecord,
  EventRecord,
  Group,
  HeroRecord,
  MercenaryRecord,
  MonsterRecord,
  OrderTables,
  OtherPillRecord,
  Pool,
  Race,
  StrengthAgainstMap,
  TempleTable,
  TitleRecord,
  TroopRecord,
  UnitDef,
  VipRecord,
} from './types.ts';

export * from './types.ts';

/**
 * JSON imports widen `"melee"` to `string`, so the table type is asserted here rather than inferred.
 * That assertion is the one place the contract is taken on trust, and it is exactly what
 * `data.test.ts` re-checks with the zod schemas.
 */
const table = <T>(rows: unknown): T => rows as T;

export const troops = table<TroopRecord[]>(troopsJson);
export const monsters = table<MonsterRecord[]>(monstersJson);
export const mercenaries = table<MercenaryRecord[]>(mercenariesJson);
export const captains = table<CaptainRecord[]>(captainsJson);
export const equipment = table<EquipmentRecord[]>(equipmentJson);
export const artifacts = table<ArtifactRecord[]>(artifactsJson);
export const titles = table<TitleRecord[]>(titlesJson);
export const heroes = table<HeroRecord[]>(heroesJson);
export const otherPills = table<OtherPillRecord[]>(otherPillsJson);
export const events = table<EventRecord[]>(eventsJson);
export const vip = table<VipRecord[]>(vipJson);
export const temple = table<TempleTable>(templeJson);
export const orders = table<OrderTables>(ordersJson);
export const version = table<DataVersion>(versionJson);

// ---- Unified units --------------------------------------------------------------------------------
const isGroup = (tag: BonusKey): tag is Group => (GROUPS as readonly string[]).includes(tag);
const isCategory = (tag: BonusKey): tag is Category => (CATEGORIES as readonly string[]).includes(tag);
const isRace = (tag: BonusKey): tag is Race => (RACES as readonly string[]).includes(tag);

function troopUnit(troop: TroopRecord): UnitDef {
  return {
    id: troop.id,
    name: troop.name,
    label: troop.label,
    kind: 'troop',
    pool: 'leadership',
    tier: troop.tier,
    group: troop.group,
    ...(troop.category ? { category: troop.category } : {}),
    ...(troop.race ? { race: troop.race } : {}),
    keys: [
      troop.group,
      ...(troop.category ? [troop.category] : []),
      ...(troop.race ? [troop.race] : []),
      'army',
    ],
    cost: troop.cost,
    health: troop.health,
    strength: troop.strength,
    strengthAgainst: troop.strengthAgainst ?? {},
    doubleDamageChance: troop.doubleDamageChance ?? 0,
    revival: troop.revival,
    training: troop.training,
  };
}

function monsterUnit(monster: MonsterRecord): UnitDef {
  return {
    id: monster.id,
    name: monster.name,
    label: monster.label,
    kind: 'monster',
    pool: 'dominance',
    tier: monster.tier,
    group: 'monster',
    category: monster.category,
    race: monster.race,
    keys: ['monster', monster.category, monster.race, 'army'],
    cost: monster.cost,
    health: monster.health,
    strength: monster.strength,
    strengthAgainst: monster.strengthAgainst ?? {},
    doubleDamageChance: monster.doubleDamageChance ?? 0,
    revival: monster.revival,
    training: monster.training,
  };
}

function mercenaryUnit(mercenary: MercenaryRecord): UnitDef {
  const group = mercenary.tags.find(isGroup);
  const category = mercenary.tags.find(isCategory);
  const race = mercenary.tags.find(isRace);
  return {
    id: mercenary.id,
    name: mercenary.name,
    label: mercenary.label,
    kind: 'mercenary',
    pool: 'authority',
    tier: mercenary.tier,
    ...(group ? { group } : {}),
    ...(category ? { category } : {}),
    ...(race ? { race } : {}),
    keys: [...mercenary.tags, 'army'],
    cost: mercenary.cost,
    health: mercenary.health,
    strength: mercenary.strength,
    strengthAgainst: mercenary.strengthAgainst ?? {},
    doubleDamageChance: mercenary.doubleDamageChance ?? 0,
    revival: mercenary.revival,
    ...(mercenary.event ? { event: mercenary.event } : {}),
  };
}

let unitCache: UnitDef[] | undefined;
let unitIndexCache: Map<string, UnitDef> | undefined;

/** Every unit of the three tables, as the engine sees them: troops, then monsters, then mercenaries. */
export function getUnits(): UnitDef[] {
  unitCache ??= [...troops.map(troopUnit), ...monsters.map(monsterUnit), ...mercenaries.map(mercenaryUnit)];
  return unitCache;
}

/** One unit by id, or `undefined` when a saved profile references a unit the tables no longer have. */
export function unitById(id: string): UnitDef | undefined {
  unitIndexCache ??= new Map(getUnits().map((unit) => [unit.id, unit]));
  return unitIndexCache.get(id);
}

/** The same units grouped by the housing pool they are paid from. */
export function unitsByPool(): Record<Pool, UnitDef[]> {
  const pools: Record<Pool, UnitDef[]> = { leadership: [], authority: [], dominance: [] };
  for (const unit of getUnits()) pools[unit.pool].push(unit);
  return pools;
}

/**
 * A mercenary the player describes by hand, for a unit the tables do not carry yet (PLAN §4.3).
 * Every value is read off the mercenary's own unit sheet in game.
 */
export interface CustomMercenaryInput {
  /** Optional stable id; one is derived from the name when absent. */
  id?: string;
  name: string;
  /** Optional short pill label; initials are used when absent. */
  label?: string;
  /** Tier as shown on the sheet; 0 when the player does not know it (it only affects kill order). */
  tier?: number;
  health: number;
  strength: number;
  /** Authority per unit. */
  cost: number;
  /** Revival cost in gold, per unit. */
  revivalGold: number;
  doubleDamageChance?: number;
  /** Guardsmen / specialist / monster, as the sheet labels it. */
  role?: Group;
  category?: Category;
  race?: Race;
  strengthAgainst?: StrengthAgainstMap;
  /** Event id when the mercenary's bonuses only count while that event runs, e.g. `arachnes`. */
  event?: string;
}

const slug = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .toLowerCase();

const initials = (value: string): string =>
  value
    .split(/[\s-]+/)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 4) || 'CUS';

/** Turns the custom-mercenary form into the same `UnitDef` the tables produce. */
export function customMercenaryToUnit(input: CustomMercenaryInput): UnitDef {
  const keys: BonusKey[] = [
    ...(input.role ? [input.role] : []),
    ...(input.category ? [input.category] : []),
    ...(input.race ? [input.race] : []),
    'army',
  ];
  return {
    id: input.id ?? `custom-${slug(input.name)}`,
    name: input.name,
    label: input.label ?? initials(input.name),
    kind: 'mercenary',
    pool: 'authority',
    tier: input.tier ?? 0,
    ...(input.role ? { group: input.role } : {}),
    ...(input.category ? { category: input.category } : {}),
    ...(input.race ? { race: input.race } : {}),
    keys,
    cost: input.cost,
    health: input.health,
    strength: input.strength,
    strengthAgainst: input.strengthAgainst ?? {},
    doubleDamageChance: input.doubleDamageChance ?? 0,
    revival: { gold: input.revivalGold },
    ...(input.event ? { event: input.event } : {}),
  };
}
