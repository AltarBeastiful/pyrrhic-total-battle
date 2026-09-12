/**
 * Builds `UnitDef`s for the engine tests straight from the research tables in
 * `docs/research/totalstack-data/` (factual game statistics, see that folder's README for provenance).
 *
 * The app's own tables under `src/data/tables/` are owned by another story and are not ready yet; reading the
 * research JSON keeps these regression tests pinned to the same numbers the fixtures were captured with.
 * Field mapping: `leadershipCost`/`authorityCost`/`dominanceCost` → `cost`, `revivalCost` → `revival`,
 * `trainingTime.seconds` + `trainingCost` → `training`, `pillLabel` "ARC 1" → `label` "ARC1",
 * `keys` = group/category/race/'army' for troops, 'monster' + category + race + 'army' for monsters,
 * `tags` + 'army' for mercenaries.
 */
/// <reference types="node" />
import { readFileSync } from 'node:fs';

import { CATEGORIES, GROUPS, RACES } from '../../src/data/types';
import type {
  BonusKey,
  Category,
  Group,
  Race,
  StrengthAgainstMap,
  Training,
  UnitDef,
} from '../../src/data/types';

const DATA_DIR = new URL('../../docs/research/totalstack-data/', import.meta.url);

interface RawCost {
  gold: number;
}
interface RawTraining {
  silver: number;
  dragonCoins?: number;
}
interface RawTroop {
  id: string;
  name: string;
  pillLabel: string;
  group: string;
  tier: number;
  category?: string;
  race?: string;
  leadershipCost: number;
  health: number;
  strength: number;
  strengthAgainst?: StrengthAgainstMap;
  doubleDamageChance?: number;
  revivalCost: RawCost;
  trainingTime: { seconds: number };
  trainingCost: RawTraining;
}
interface RawMonster {
  id: string;
  name: string;
  pillLabel: string;
  tier: number;
  category: Category;
  race: Race;
  dominanceCost: number;
  health: number;
  strength: number;
  strengthAgainst?: StrengthAgainstMap;
  doubleDamageChance?: number;
  revivalCost: RawCost;
  trainingTime: { seconds: number };
  trainingCost: RawTraining;
}
interface RawMercenary {
  id: string;
  name: string;
  pillLabel: string;
  tier: number;
  tags: string[];
  authorityCost: number;
  health: number;
  strength: number;
  strengthAgainst?: StrengthAgainstMap;
  doubleDamageChance?: number;
  revivalCost: RawCost;
}

function read<T>(file: string): T[] {
  return JSON.parse(readFileSync(new URL(file, DATA_DIR), 'utf8')) as T[];
}

const label = (pill: string): string => pill.replace(/\s+/g, '');
const training = (raw: { trainingTime: { seconds: number }; trainingCost: RawTraining }): Training => ({
  seconds: raw.trainingTime.seconds,
  silver: raw.trainingCost.silver,
  ...(raw.trainingCost.dragonCoins === undefined ? {} : { dragonCoins: raw.trainingCost.dragonCoins }),
});

function isCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}
function isGroup(value: string): value is Group {
  return (GROUPS as readonly string[]).includes(value);
}
function isRace(value: string): value is Race {
  return (RACES as readonly string[]).includes(value);
}

function troopDef(raw: RawTroop): UnitDef {
  // The research table types engineers as category "engineer"; our contract leaves them without a category.
  const category = raw.category !== undefined && isCategory(raw.category) ? raw.category : undefined;
  const race = raw.race !== undefined && isRace(raw.race) ? raw.race : undefined;
  const group = isGroup(raw.group) ? raw.group : 'guardsmen';
  const keys: BonusKey[] = [group, ...(category ? [category] : []), ...(race ? [race] : []), 'army'];
  return {
    id: raw.id,
    name: raw.name,
    label: label(raw.pillLabel),
    kind: 'troop',
    pool: 'leadership',
    tier: raw.tier,
    group,
    ...(category ? { category } : {}),
    ...(race ? { race } : {}),
    keys,
    cost: raw.leadershipCost,
    health: raw.health,
    strength: raw.strength,
    strengthAgainst: raw.strengthAgainst ?? {},
    doubleDamageChance: raw.doubleDamageChance ?? 0,
    revival: raw.revivalCost,
    training: training(raw),
  };
}

function monsterDef(raw: RawMonster): UnitDef {
  return {
    id: raw.id,
    name: raw.name,
    label: label(raw.pillLabel),
    kind: 'monster',
    pool: 'dominance',
    tier: raw.tier,
    group: 'monster',
    category: raw.category,
    race: raw.race,
    keys: ['monster', raw.category, raw.race, 'army'],
    cost: raw.dominanceCost,
    health: raw.health,
    strength: raw.strength,
    strengthAgainst: raw.strengthAgainst ?? {},
    doubleDamageChance: raw.doubleDamageChance ?? 0,
    revival: raw.revivalCost,
    training: training(raw),
  };
}

function mercenaryDef(raw: RawMercenary): UnitDef {
  const category = raw.tags.find(isCategory);
  const group = raw.tags.find(isGroup);
  const race = raw.tags.find(isRace);
  const keys = [...raw.tags.filter((tag): tag is BonusKey => tag !== 'army'), 'army'] as BonusKey[];
  return {
    id: raw.id,
    name: raw.name,
    label: label(raw.pillLabel),
    kind: 'mercenary',
    pool: 'authority',
    tier: raw.tier,
    ...(group ? { group } : {}),
    ...(category ? { category } : {}),
    ...(race ? { race } : {}),
    keys,
    cost: raw.authorityCost,
    health: raw.health,
    strength: raw.strength,
    strengthAgainst: raw.strengthAgainst ?? {},
    doubleDamageChance: raw.doubleDamageChance ?? 0,
    revival: raw.revivalCost,
  };
}

const troops = read<RawTroop>('troops.json').map(troopDef);
const monsters = read<RawMonster>('monsters.json').map(monsterDef);
const mercenaries = read<RawMercenary>('mercenaries.json').map(mercenaryDef);

export const ALL_UNITS: UnitDef[] = [...troops, ...monsters, ...mercenaries];

function pick(pool: UnitDef[], key: string, what: string): UnitDef {
  const found = pool.find((unit) => unit.label === key || unit.id === key);
  if (!found) throw new Error(`unknown ${what}: ${key}`);
  return found;
}

/** Leadership troop by pill label ("ARC1") or id ("archer-1"). */
export const troop = (key: string): UnitDef => pick(troops, key, 'troop');
/** Dominance monster by pill label ("WE") or id ("water-elemental"). */
export const monster = (key: string): UnitDef => pick(monsters, key, 'monster');
/** Authority mercenary by pill label ("BER5") or id ("bear-5"). */
export const mercenary = (key: string): UnitDef => pick(mercenaries, key, 'mercenary');

export const troopSet = (...keys: string[]): UnitDef[] => keys.map(troop);
export const monsterSet = (...keys: string[]): UnitDef[] => keys.map(monster);
export const mercenarySet = (...keys: string[]): UnitDef[] => keys.map(mercenary);
