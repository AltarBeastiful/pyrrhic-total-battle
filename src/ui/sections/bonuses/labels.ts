/**
 * Wording used across the Bonuses section: the names we give the 13 bonus keys, the special strength
 * keys, the equipment qualities and the four training groups, plus the number formatters and the two
 * value summaries a chip and an editor show.
 *
 * `derive.ts` has its own label maps for the TOTAL rows it describes; these are the editors' labels
 * and stay here so the section owns its own wording.
 */
import type {
  BonusKey,
  BonusMap,
  Group,
  MatchupBonus,
  Quality,
  SpecialKey,
  SpecialMap,
  StrengthAgainstKey,
} from '@/data/types';

/**
 * Anything that carries bonus values: a table's `BonusContribution`, a stored editor, a value we
 * computed for one level. Written with explicit `undefined`s so a stored entry (whose optional keys
 * are `T | undefined`) can be described without being copied first.
 */
export interface BonusLike {
  health?: BonusMap | undefined;
  strength?: BonusMap | undefined;
  special?: SpecialMap | undefined;
  matchup?: readonly MatchupBonus[] | undefined;
}

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

/** "1 captain" / "3 captains": the counts the header summary is made of. */
export function count(n: number, one: string, many: string): string {
  return `${String(n)} ${n === 1 ? one : many}`;
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

/** Every key a source feeds, gathered so health and strength of the same key share one line. */
function collect(bonus: BonusLike, short: boolean): { label: string; parts: string[] }[] {
  const byKey = new Map<string, { label: string; parts: string[] }>();
  const add = (id: string, label: string, part: string): void => {
    const line = byKey.get(id) ?? { label, parts: [] };
    line.parts.push(part);
    byKey.set(id, line);
  };

  for (const [key, value] of Object.entries(bonus.health ?? {})) {
    if (value) add(key, BONUS_LABELS[key as BonusKey], `${formatPercent(value)} ${short ? 'HP' : 'health'}`);
  }
  for (const [key, value] of Object.entries(bonus.strength ?? {})) {
    if (value) {
      add(key, BONUS_LABELS[key as BonusKey], `${formatPercent(value)} ${short ? 'STR' : 'strength'}`);
    }
  }
  for (const [key, value] of Object.entries(bonus.special ?? {})) {
    if (value) add(`special:${key}`, SPECIAL_LABELS[key as SpecialKey], formatPercent(value));
  }
  for (const [index, entry] of (bonus.matchup ?? []).entries()) {
    add(
      `matchup:${String(index)}`,
      `${BONUS_LABELS[entry.attacker]} against ${AGAINST_LABELS[entry.target]}`,
      formatPercent(entry.value),
    );
  }

  return [...byKey.values()];
}

/**
 * One line per key a source feeds, health and strength on the same line because that is how the game
 * writes them: "Guardsmen +20 % health / +20 % strength", "Double damage chance +5 %".
 */
export function describeContribution(bonus: BonusLike): string[] {
  return collect(bonus, false).map((line) => `${line.label} ${line.parts.join(' / ')}`);
}

/**
 * The same thing in the shortest honest form, for a chip: "+78 % HP / +78 % STR melee". HP and STR
 * are the game's own abbreviations, and the key name still ends the line so the chip's glyph repeats
 * something written.
 */
export function chipLines(bonus: BonusLike): string[] {
  return collect(bonus, true).map((line) => `${line.parts.join(' / ')} ${line.label.toLowerCase()}`);
}

/** The first key a source feeds: the one its chip glyph stands for. */
export function firstKey(bonus: BonusLike): BonusKey | SpecialKey | undefined {
  for (const map of [bonus.health, bonus.strength]) {
    const key = Object.entries(map ?? {}).find(([, value]) => value)?.[0];
    if (key !== undefined) return key as BonusKey;
  }
  const special = Object.entries(bonus.special ?? {}).find(([, value]) => value)?.[0];
  return special as SpecialKey | undefined;
}

export interface ChipValue {
  /** The key the chip's glyph stands for; it always repeats a name written in `text`. */
  key?: BonusKey | SpecialKey;
  /** What the source is worth right now, short enough to ride on a chip. */
  text: string;
}

/** What a source is worth, as a chip says it: two keys at most, then "+2 more". */
export function chipValue(bonus: BonusLike, limit = 2): ChipValue {
  const lines = chipLines(bonus);
  const key = firstKey(bonus);
  const extra = lines.length - limit;
  const text =
    lines.length === 0
      ? ''
      : lines.slice(0, limit).join(' · ') + (extra > 0 ? ` · +${String(extra)} more` : '');
  return { ...(key === undefined ? {} : { key }), text };
}

/**
 * Our own name for a source the engine labelled: the stored ids and the resolver's labels never
 * change, the words the player reads do.
 */
const RENAMED: Record<string, string> = { 'Unknown Sources': 'Unexplained remainder' };

export function sourceLabel(label: string): string {
  return RENAMED[label] ?? label;
}

/** `armyStrengthAndHealth` → "Army strength and health": the random-bonus options read as sentences. */
export function humanizeOption(option: string): string {
  const spaced = option
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
