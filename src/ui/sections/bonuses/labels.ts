/**
 * Wording used across the Bonuses section: the names we give the 13 bonus keys, the special strength
 * keys, the equipment qualities and the four training groups, plus the two number formatters.
 *
 * `derive.ts` has its own label maps for the TOTAL rows it describes; these are the editors' labels and
 * stay here so the section owns its own wording.
 */
import type {
  BonusContribution,
  BonusKey,
  Group,
  Quality,
  SpecialKey,
  StrengthAgainstKey,
} from '@/data/types';

export const BONUS_LABELS: Record<BonusKey, string> = {
  melee: 'Melee',
  ranged: 'Ranged',
  mounted: 'Mounted',
  flying: 'Flying',
  guardsmen: 'Guardsmen',
  specialist: 'Specialists',
  engineers: 'Engineers',
  monster: 'Monsters',
  army: 'Army',
  beast: 'Beasts',
  elemental: 'Elementals',
  dragon: 'Dragons',
  giant: 'Giants',
};

export const SPECIAL_LABELS: Record<SpecialKey, string> = {
  doubleDamageChance: 'Double damage chance',
  strikeTwoSquadsChance: 'Strike two squads chance',
  beastsStrikeTwoSquadsChance: 'Beasts strike two squads',
  elementalsStrikeTwoSquadsChance: 'Elementals strike two squads',
  dragonsStrikeTwoSquadsChance: 'Dragons strike two squads',
  giantsStrikeTwoSquadsChance: 'Giants strike two squads',
  guardsmenDoubleDamageChance: 'Guardsmen double damage',
  specialistsDoubleDamageChance: 'Specialists double damage',
  engineersDoubleDamageChance: 'Engineers double damage',
  monstersDoubleDamageChance: 'Monsters double damage',
  armyStrengthAgainstEpicMonsters: 'Army strength against epic monsters',
};

export const QUALITY_LABELS: Record<Quality, string> = {
  poor: 'Poor',
  common: 'Common',
  uncommon: 'Uncommon',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
  ascendant: 'Ascendant',
  godlike: 'Godlike',
};

export const GROUP_LABELS: Record<Group, string> = {
  guardsmen: 'Guardsmen',
  specialist: 'Specialists',
  engineers: 'Engineers',
  monster: 'Monsters',
};

/** Trims the float noise an addition of percentages leaves behind (0.1 + 0.2). */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** A bonus as the game writes it: "+39.5 %", "0 %", "−10 %". */
export function formatPercent(value: number): string {
  const rounded = round2(value);
  if (rounded === 0) return '0 %';
  return `${rounded > 0 ? '+' : '−'}${String(Math.abs(rounded))} %`;
}

/**
 * Star notation of the artifact tables ("0.1" … "5.0"): full stars, then the quarter steps. Used when an
 * artifact carries no star table of its own, so the player can still record what they have.
 */
export const FALLBACK_STAR_KEYS: string[] = (() => {
  const keys = ['0.0'];
  for (let full = 0; full <= 4; full += 1) {
    const first = full === 0 ? 1 : 0;
    for (let part = first; part <= 4; part += 1) keys.push(`${String(full)}.${String(part)}`);
  }
  keys.push('5.0');
  return keys;
})();

export const AGAINST_LABELS: Record<StrengthAgainstKey, string> = {
  melee: 'melee',
  ranged: 'ranged',
  mounted: 'mounted',
  flying: 'flying',
  engineers: 'engineers',
  beasts: 'beasts',
  elementals: 'elementals',
  dragons: 'dragons',
  giants: 'giants',
  epicMonsters: 'epic monsters',
  swarmUnits: 'swarm units',
};

/** One readable line per value of a table contribution (a quality row, a title, a pill, a hero). */
export function describeContribution(bonus: BonusContribution): string[] {
  const lines: string[] = [];
  for (const [key, value] of Object.entries(bonus.health ?? {})) {
    if (value) lines.push(`${BONUS_LABELS[key as BonusKey]} health ${formatPercent(value)}`);
  }
  for (const [key, value] of Object.entries(bonus.strength ?? {})) {
    if (value) lines.push(`${BONUS_LABELS[key as BonusKey]} strength ${formatPercent(value)}`);
  }
  for (const [key, value] of Object.entries(bonus.special ?? {})) {
    if (value) lines.push(`${SPECIAL_LABELS[key as SpecialKey]} ${formatPercent(value)}`);
  }
  for (const entry of bonus.matchup ?? []) {
    lines.push(
      `${BONUS_LABELS[entry.attacker]} against ${AGAINST_LABELS[entry.target]} ${formatPercent(entry.value)}`,
    );
  }
  return lines;
}

/** `armyStrengthAndHealth` → "Army strength and health": the random-bonus options read as sentences. */
export function humanizeOption(option: string): string {
  const spaced = option
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
