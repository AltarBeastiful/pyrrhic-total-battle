/**
 * Five units, one per group, for the unit tests and the kit page. Not part of the public barrel and
 * never imported by the app: the real units come from `src/data`.
 */
import type { UnitDef } from '../../data/types';

/** Guardsmen, ranged: the unit every example in the design plan uses. */
export const ARCHER: UnitDef = {
  id: 'archer-3',
  name: 'Archer',
  label: 'ARC3',
  kind: 'troop',
  pool: 'leadership',
  tier: 3,
  group: 'guardsmen',
  category: 'ranged',
  keys: ['ranged', 'guardsmen', 'army'],
  cost: 3,
  health: 420,
  strength: 380,
  strengthAgainst: {},
  doubleDamageChance: 0,
  revival: { gold: 2 },
  training: { seconds: 40, silver: 900 },
};

/** Specialists, melee. */
export const SPEARMAN: UnitDef = {
  id: 'spearman-2',
  name: 'Spearman',
  label: 'SPR2',
  kind: 'troop',
  pool: 'leadership',
  tier: 2,
  group: 'specialist',
  category: 'melee',
  keys: ['melee', 'specialist', 'army'],
  cost: 2,
  health: 310,
  strength: 260,
  strengthAgainst: {},
  doubleDamageChance: 0,
  revival: { gold: 1 },
  training: { seconds: 30, silver: 600 },
};

/** Engineers have no category: the catapult stands for the whole group. */
export const CATAPULT: UnitDef = {
  id: 'catapult-4',
  name: 'Catapult',
  label: 'CAT4',
  kind: 'troop',
  pool: 'leadership',
  tier: 4,
  group: 'engineers',
  keys: ['engineers', 'army'],
  cost: 12,
  health: 1800,
  strength: 2400,
  strengthAgainst: { engineers: 40 },
  doubleDamageChance: 0,
  revival: { gold: 9 },
  training: { seconds: 240, silver: 5400 },
};

/** Monsters are drawn by race, not by category. */
export const FIRE_ELEMENTAL: UnitDef = {
  id: 'fire-elemental-5',
  name: 'Fire Elemental',
  label: 'FEL5',
  kind: 'monster',
  pool: 'dominance',
  tier: 5,
  group: 'monster',
  category: 'ranged',
  race: 'elemental',
  keys: ['ranged', 'monster', 'elemental', 'army'],
  cost: 30,
  health: 9600,
  strength: 8800,
  strengthAgainst: {},
  doubleDamageChance: 5,
  revival: { gold: 40 },
  training: { seconds: 900, silver: 24000, dragonCoins: 3 },
};

/** A mercenary whose tags make it a guardsman: `kind` still wins, and it is drawn red. */
export const ABYSS_MARAUDER: UnitDef = {
  id: 'abyss-marauder-6',
  name: 'Abyss Marauder',
  label: 'ABM6',
  kind: 'mercenary',
  pool: 'authority',
  tier: 6,
  group: 'guardsmen',
  category: 'mounted',
  keys: ['mounted', 'guardsmen', 'army'],
  cost: 18,
  health: 15200,
  strength: 14100,
  strengthAgainst: {},
  doubleDamageChance: 0,
  revival: { gold: 55 },
};

/** One per group, in display order. */
export const SAMPLE_UNITS: UnitDef[] = [ARCHER, SPEARMAN, CATAPULT, FIRE_ELEMENTAL, ABYSS_MARAUDER];
