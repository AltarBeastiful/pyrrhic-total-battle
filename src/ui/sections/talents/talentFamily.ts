/**
 * Names, tiers and icons for the talent tiles (B-21). The game's own icons are not in the data, so a tile is
 * drawn the way the owner's talents tool draws it: one mark per talent *family* (the name without its tier
 * numeral) and a tier badge, here an emoji for the stat plus one for the unit kind the name speaks of.
 */
import type { GlyphKind } from '@/ui/domain/glyphs';

const ROMAN: Readonly<Record<string, number>> = {
  I: 1,
  II: 2,
  III: 3,
  IV: 4,
  V: 5,
  VI: 6,
  VII: 7,
  VIII: 8,
  IX: 9,
  X: 10,
};

export interface TalentFamily {
  family: string;
  tier: number | null;
  numeral: string | null;
}

export function talentFamily(name: string): TalentFamily {
  const m = /^(.*\S)\s+([IVX]+)$/.exec(name);
  const family = m?.[1];
  const numeral = m?.[2];
  const tier = numeral !== undefined ? ROMAN[numeral] : undefined;
  if (family === undefined || numeral === undefined || tier === undefined) {
    return { family: name, tier: null, numeral: null };
  }
  return { family, tier, numeral };
}

const STAT_ICONS: Readonly<Record<string, GlyphKind>> = {
  UNIT_POWER: 'strength',
  UNIT_HEALTH: 'health',
  UNIT_CRIT: 'doubleDamage',
  UNIT_LOAD_CAPACITY: 'carrying',
  MARCH_SPEED: 'marchSpeed',
  MARCH_SPEED_PVP: 'marchSpeed',
  FACTORY_PRODUCTION_SPEED: 'training',
  FACTORY_TECH_SPEED: 'research',
  FACTORY_CRAFT_SPEED: 'crafting',
  MINE_PRODUCTION_SPEED: 'production',
  MAP_MINING_SPEED: 'gathering',
  STORAGE_BOOST: 'storage',
  CARAVAN_CAPACITY: 'caravanCapacity',
  CLAN_CARAVAN_CAPACITY: 'caravanCapacity',
  CARAVAN_SPEED: 'caravanSpeed',
  BUILDING_UPGRADE_SPEED: 'construction',
  EFFECT_B_ABOVE_1_SUMMARIZABLE: 'tile',
  SKLEP_STRIKE_DAMAGE: 'crypt',
  SKLEP_CRIT_PROBABILITY: 'doubleDamage',
  SKLEP_EXP_BONUS: 'experience',
  SKLEP_PRICE_CUT: 'priceCut',
  HERO_MAX_MARCH_TIME: 'range',
};

const SUBJECTS: readonly (readonly [RegExp, GlyphKind])[] = [
  [/^melee/i, 'melee'],
  [/^ranged/i, 'ranged'],
  [/^mounted/i, 'mounted'],
  [/^flying/i, 'flying'],
  [/guardsmen/i, 'guardsmen'],
  [/specialists/i, 'specialists'],
  [/engineer|siege/i, 'engineers'],
  [/monsters/i, 'monsters'],
  [/^army/i, 'army'],
  [/fortifications/i, 'fortifications'],
];

export function talentIcons(
  name: string,
  stats: readonly string[],
): { stat: GlyphKind; subject: GlyphKind | null } {
  // One production stat serves silver, food, building resources and tar; the name says which: silver has its own coin and building resources (wood, stone, iron) their own picture.
  const stat: GlyphKind = /^silver/i.test(name)
    ? 'silver'
    : /building resources/i.test(name)
      ? 'buildingResources'
      : ((stats[0] !== undefined ? STAT_ICONS[stats[0]] : undefined) ?? 'tile');
  const subject = SUBJECTS.find(([re]) => re.test(name))?.[1] ?? null;
  return { stat, subject };
}

/** The game's order: row by row, left to right. Its columns are too narrow for names, its order is not. */
export function treeOrder<T extends { layout: { x: number; y: number } }>(nodes: readonly T[]): T[] {
  return [...nodes].sort((a, b) => a.layout.y - b.layout.y || a.layout.x - b.layout.x);
}
