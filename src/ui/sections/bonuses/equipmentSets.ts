/**
 * What the Equipment row shows (B-19): the player's sets, the pieces without one, the grade of a
 * piece, and how many slots the selected captains wear. Sets are a view: no number here reaches a total.
 */
import type { BonusKey, Quality } from '@/data/types';
import type { BattleSetup, Profile, ProfileSources } from '@/state/schema';

import { BONUS_LABELS, firstKey, formatPercent, type BonusLike } from './labels';
import { equipmentRecord, equipmentWorth } from './rows';

type Piece = ProfileSources['equipment'][number];

/** A captain wears three pieces, and with none selected a hero still has six slots to try (the owner's rule). */
export const SLOTS_PER_CAPTAIN = 3;
export const SLOTS_WITHOUT_CAPTAIN = 6;

export const slotsFor = (captains: number): number =>
  captains === 0 ? SLOTS_WITHOUT_CAPTAIN : captains * SLOTS_PER_CAPTAIN;

/** The letter and the colour token of each grade, in the game's order of rarity. */
export const GRADES: Record<Quality, { letter: string; token: string }> = {
  poor: { letter: 'P', token: 'grade1' },
  common: { letter: 'C', token: 'grade2' },
  uncommon: { letter: 'U', token: 'grade3' },
  rare: { letter: 'R', token: 'grade4' },
  epic: { letter: 'E', token: 'grade5' },
  legendary: { letter: 'L', token: 'grade6' },
  ascendant: { letter: 'A', token: 'grade7' },
  godlike: { letter: 'G', token: 'grade8' },
};

export type SetState = 'all' | 'some' | 'none';

export interface EquipmentSet {
  id: string;
  /** The name the player gave, else the suggestion. */
  name: string;
  pieces: Piece[];
  state: SetState;
  on: number;
}

export interface EquipmentLayout {
  sets: EquipmentSet[];
  loose: Piece[];
}

const QUALITY_ORDER = Object.keys(GRADES) as Quality[];

/** The value that most pieces share; a tie goes to the one `rank` puts last (the more prominent). */
function commonest<T extends string>(values: readonly T[], rank: (value: T) => number): T | undefined {
  const counts = new Map<T, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || rank(b[0]) - rank(a[0]))[0]?.[0];
}

/**
 * The name an unnamed set suggests: what its pieces mostly boost and their most prominent grade,
 * "Guardsmen (U)". Two such sets get a number so no two titles read alike; pieces with nothing to name
 * fall back to "Set N".
 */
function suggestName(pieces: readonly Piece[], worth: (piece: Piece) => BonusLike, index: number): string {
  const keys = pieces.flatMap((piece) => {
    const key = firstKey(worth(piece));
    return key !== undefined && key in BONUS_LABELS ? [key as BonusKey] : [];
  });
  const key = commonest(keys, () => 0);
  if (key === undefined) return `Set ${String(index + 1)}`;
  const quality = commonest(
    pieces.map((piece) => piece.quality),
    (value) => QUALITY_ORDER.indexOf(value),
  );
  return `${BONUS_LABELS[key]}${quality === undefined ? '' : ` (${GRADES[quality].letter})`}`;
}

/**
 * Sets in the order their first piece appears, then the empty ones the player added. A named set
 * keeps its name; an unnamed one suggests one (`suggestName`) and is numbered when another set already
 * wears the same title.
 */
export function equipmentLayout(
  profile: Profile,
  setup: BattleSetup,
  worth: (piece: Piece) => BonusLike,
): EquipmentLayout {
  const { equipment, equipmentSetNames } = profile.sources;
  const order: string[] = [];
  const bySet = new Map<string, Piece[]>();
  const loose: Piece[] = [];
  for (const piece of equipment) {
    if (piece.setId === undefined) {
      loose.push(piece);
      continue;
    }
    const list = bySet.get(piece.setId) ?? [];
    if (list.length === 0) order.push(piece.setId);
    list.push(piece);
    bySet.set(piece.setId, list);
  }
  for (const id of Object.keys(equipmentSetNames ?? {})) if (!bySet.has(id)) order.push(id);

  const taken = new Map<string, number>();
  const sets = order.map((id, index): EquipmentSet => {
    const pieces = bySet.get(id) ?? [];
    const on = pieces.filter((piece) => setup.active.equipment.includes(piece.id)).length;
    const stored = equipmentSetNames?.[id]?.trim() ?? '';
    const base = stored === '' ? suggestName(pieces, worth, index) : stored;
    const seen = (taken.get(base) ?? 0) + 1;
    taken.set(base, seen);
    return {
      id,
      name: stored === '' && seen > 1 ? `${base} ${String(seen)}` : base,
      pieces,
      on,
      state: on === 0 ? 'none' : on === pieces.length ? 'all' : 'some',
    };
  });
  return { sets, loose };
}

/** The layout of the account on screen: what each piece is worth names an unnamed set. */
export const layoutOf = (profile: Profile, setup: BattleSetup): EquipmentLayout =>
  equipmentLayout(profile, setup, (piece) => equipmentWorth(equipmentRecord(piece.equipmentId), piece));

/** "+8 % HP/STR guardsmen +1": the first key of the piece in the fewest words, then how many more. */
export function tightLine(bonus: BonusLike): string {
  const keys = new Map<string, { label: string; hp?: number; str?: number }>();
  const entry = (key: string, label: string) => {
    const found = keys.get(key) ?? { label };
    keys.set(key, found);
    return found;
  };
  for (const [key, value] of Object.entries(bonus.health ?? {})) {
    if (value) entry(key, BONUS_LABELS[key as BonusKey]).hp = value;
  }
  for (const [key, value] of Object.entries(bonus.strength ?? {})) {
    if (value) entry(key, BONUS_LABELS[key as BonusKey]).str = value;
  }
  const lines = [...keys.values()].map((line) => {
    const where = line.label.toLowerCase();
    if (line.hp !== undefined && line.hp === line.str) return `${formatPercent(line.hp)} HP/STR ${where}`;
    const parts = [
      ...(line.hp === undefined ? [] : [`${formatPercent(line.hp)} HP`]),
      ...(line.str === undefined ? [] : [`${formatPercent(line.str)} STR`]),
    ];
    return `${parts.join(' ')} ${where}`;
  });
  const specials = Object.values(bonus.special ?? {}).filter(Boolean).length + (bonus.matchup?.length ?? 0);
  const first = lines[0];
  if (first === undefined) return specials === 0 ? '' : `${String(specials)} special`;
  const more = lines.length - 1 + specials;
  return more > 0 ? `${first} +${String(more)}` : first;
}
