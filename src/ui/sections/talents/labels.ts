/** The player's words for the game's stat kinds (B-21), and the goals' own names. */
export const STAT_LABELS: Readonly<Record<string, string>> = {
  UNIT_POWER: 'Strength',
  UNIT_HEALTH: 'Health',
  UNIT_CRIT: 'Double damage chance',
  UNIT_LOAD_CAPACITY: 'Carrying capacity',
  MARCH_SPEED: 'March speed',
  MARCH_SPEED_PVP: 'March speed against players',
  FACTORY_PRODUCTION_SPEED: 'Training speed',
  FACTORY_TECH_SPEED: 'Research speed',
  FACTORY_CRAFT_SPEED: 'Crafting speed',
  MINE_PRODUCTION_SPEED: 'Resource production',
  MAP_MINING_SPEED: 'Map mining speed',
  STORAGE_BOOST: 'Storage',
  CARAVAN_CAPACITY: 'Caravan capacity',
  CLAN_CARAVAN_CAPACITY: 'Clan caravan capacity',
  CARAVAN_SPEED: 'Caravan speed',
  BUILDING_UPGRADE_SPEED: 'Building speed',
  EFFECT_B_ABOVE_1_SUMMARIZABLE: 'Other economy bonuses',
  SKLEP_STRIKE_DAMAGE: 'Crypt exploration efficiency',
  SKLEP_CRIT_PROBABILITY: 'Chance to explore a Crypt twice',
  SKLEP_EXP_BONUS: 'Crypt experience',
  SKLEP_PRICE_CUT: 'Crypt exploration cost',
  HERO_MAX_MARCH_TIME: 'Hero march time',
};

export const statLabel = (stat: string): string => STAT_LABELS[stat] ?? stat;

export const GOAL_LABELS = { battle: 'Battle', economy: 'Economy', archeology: 'Archeology' } as const;

export const KIND_LABELS = {
  melee: 'Melee',
  ranged: 'Ranged',
  mounted: 'Mounted',
  flying: 'Flying',
  monsters: 'Monsters',
  engineers: 'Engineers',
} as const;

/** The tree tabs: a goal's own name, plus the expert tree. */
export const TREE_SHORT = { ...GOAL_LABELS, expert: 'Expert' } as const;

export const TREE_LABELS = {
  battle: 'Battle tactics',
  expert: 'Expert battle tactics',
  economy: 'Economy',
  archeology: 'Archeology',
} as const;

/** Whole figures stay whole; a fraction keeps its decimals but no trailing zeros. */
export function percent(value: number): string {
  return `${String(Math.round(value * 100) / 100)} %`;
}
