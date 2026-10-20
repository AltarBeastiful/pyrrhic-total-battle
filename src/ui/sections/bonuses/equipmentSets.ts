/**
 * What the Equipment row shows (B-19): the player's sets, the pieces without one, the grade of a
 * piece, and how many slots the selected captains wear. Sets are a view: no number here reaches a total.
 */
import type { Quality } from '@/data/types';
import type { BattleSetup, Profile, ProfileSources } from '@/state/schema';

import { BONUS_LABELS, formatPercent, type BonusLike } from './labels';
import type { BonusKey } from '@/data/types';

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

/**
 * Sets in the order their first piece appears. An unnamed set suggests the type its pieces share when
 * they all share one ("Emerald Guardian"), else "Set N" by position.
 */
export function equipmentLayout(
  profile: Profile,
  setup: BattleSetup,
  typeName: (equipmentId: string) => string,
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
  const sets = order.map((id, index): EquipmentSet => {
    const pieces = bySet.get(id) ?? [];
    const on = pieces.filter((piece) => setup.active.equipment.includes(piece.id)).length;
    const types = new Set(pieces.map((piece) => piece.equipmentId));
    const named = equipmentSetNames?.[id]?.trim() ?? '';
    const [only] = [...types];
    const suggestion = types.size === 1 && only !== undefined ? typeName(only) : `Set ${String(index + 1)}`;
    return {
      id,
      name: named === '' ? suggestion : named,
      pieces,
      on,
      state: on === 0 ? 'none' : on === pieces.length ? 'all' : 'some',
    };
  });
  return { sets, loose };
}

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
