/**
 * The four chip families of the Bonuses card, as data (design plan §7.3 as amended, D-34;
 * investigation 0006).
 *
 * TotalStack draws captains, artifacts, permanent sources and titles as one thing — a dense wrapping
 * row of name chips, a gear on the corner of the ones that have something to set, a dot after the
 * name once a level is recorded — and we mimic that in our own components. Every option is on screen,
 * so none of these families has an Add button: the chip *is* the form and the summary (rule 12).
 *
 * The entry that records a level is minted by the first tap, not by an Add button, which is why a
 * chip is named by its **table** id and carries the profile entry's id only once one exists.
 */
import {
  artifacts as artifactTable,
  captains as captainTable,
  heroes as heroTable,
  titles as titleTable,
} from '@/data';
import type { BattleSetup, Profile } from '@/state/schema';

import { chipValue, describeContribution, rowValue } from './labels';
import { artifactWorth, captainEntryFor, captainWorth, hasStackEffect } from './rows';

/** The highest star rating a captain's table carries: none, then ★1…★6. */
export const MAX_CAPTAIN_STAR = 6;

/** What a tap on a captain chip acts on: the hero leads the row and is not a captain. */
export type CaptainTarget = { kind: 'captain'; captainId: string } | { kind: 'hero' };

export interface CaptainChipRow {
  /** React key: the captain's table id, or `hero`. */
  id: string;
  name: string;
  enlisted: boolean;
  /** A level is recorded (or a hero is chosen): the name gets a dot, as TotalStack's does. */
  levelSet: boolean;
  /** The captain carries a health or a strength block, so the gear has something to open. */
  hasEditor: boolean;
  target: CaptainTarget;
}

/**
 * The hero, then every captain the tables know, in the table's own order. The row never reorders on
 * a tap: a chip that moves out from under the finger is a chip you cannot tap twice.
 */
export function captainChips(profile: Profile, setup: BattleSetup): CaptainChipRow[] {
  const hero = heroTable.find((record) => record.id === profile.sources.hero);
  const active = setup.active.captains;

  const heroChip: CaptainChipRow = {
    id: 'hero',
    name: hero?.name ?? 'Hero',
    enlisted: setup.active.hero && hero !== undefined,
    levelSet: hero !== undefined,
    hasEditor: true,
    target: { kind: 'hero' },
  };

  return [
    heroChip,
    ...captainTable.map((record) => {
      const entry = captainEntryFor(profile, record.id);
      return {
        id: record.id,
        name: record.name,
        enlisted: entry !== undefined && active.includes(entry.id),
        levelSet: entry !== undefined && (entry.level > 0 || entry.star > 0),
        hasEditor: hasStackEffect(record),
        target: { kind: 'captain' as const, captainId: record.id },
      } satisfies CaptainChipRow;
    }),
  ];
}

export interface ArtifactChipRow {
  /** React key and tap target: the artifact's **table** id. */
  id: string;
  name: string;
  on: boolean;
  levelSet: boolean;
  /** What it is worth right now, short enough to ride under the name. */
  value: string;
}

/** All fifteen artifacts, whether or not the profile has ever recorded one. */
export function artifactChips(profile: Profile, setup: BattleSetup): ArtifactChipRow[] {
  const active = setup.active.artifacts;
  const byArtifact = new Map(profile.sources.artifacts.map((entry) => [entry.artifactId, entry]));

  return artifactTable.map((record) => {
    const entry = byArtifact.get(record.id);
    const on = entry !== undefined && active.includes(entry.id);
    const worth = entry === undefined ? '' : rowValue(artifactWorth(record, entry));
    return {
      id: record.id,
      name: record.name,
      on,
      levelSet: entry !== undefined && worth !== '',
      value: entry === undefined ? '' : chipValue(artifactWorth(record, entry), 1).text,
    };
  });
}

export interface PermanentChipRow {
  /** React key and entry id: a permanent source always exists before it is shown. */
  id: string;
  name: string;
  value: string;
  /** A row the player added, rather than one of the eight the game always grants. */
  isCustom: boolean;
  /** Every line it is worth, for the chip's tooltip; the chip's own `value` stops at "and N more". */
  lines: string[];
}

/** The permanent sources, which count on every march and so are always highlighted. */
/**
 * In the order of their names, not of their adding (owner, 2026-09-17: "move Army Modernization
 * first"): a permanent source is named by the player, and a row the player cannot reorder reads
 * best in the one order they can predict. The unnamed ones fall to the end.
 */
export function permanentChips(profile: Profile): PermanentChipRow[] {
  return profile.sources.permanent
    .map((entry) => ({
      id: entry.id,
      name: entry.name === '' ? 'Permanent source' : entry.name,
      value: chipValue(entry, 1).text,
      isCustom: entry.builtin === undefined,
      lines: describeContribution(entry),
      unnamed: entry.name === '',
    }))
    .sort((a, b) => Number(a.unnamed) - Number(b.unnamed) || a.name.localeCompare(b.name))
    .map(({ unnamed: _unnamed, ...chip }) => chip);
}

/** Which of the three headings a title sits under, the way the game's own screen splits them. */
export type TitleFamily = 'health' | 'strength' | 'other';

export const TITLE_FAMILY_LABELS: Record<TitleFamily, string> = {
  health: 'Health',
  strength: 'Strength',
  other: 'Other',
};

export interface TitleChipRow {
  id: string;
  name: string;
  /** The line under the name, as TotalStack writes it: what the title is worth. */
  value: string;
  worn: boolean;
}

export interface TitleFamilyRow {
  family: TitleFamily;
  label: string;
  chips: TitleChipRow[];
}

function titleFamily(bonus: { health?: unknown; strength?: unknown; special?: unknown }): TitleFamily {
  const hasHealth = bonus.health !== undefined;
  const hasStrength = bonus.strength !== undefined;
  if (bonus.special !== undefined || (hasHealth && hasStrength)) return 'other';
  if (hasHealth) return 'health';
  if (hasStrength) return 'strength';
  return 'other';
}

/** Every title of the kingdom, split the way the game splits them, worn ones highlighted. */
export function titleChips(setup: BattleSetup): TitleFamilyRow[] {
  const worn = new Set(setup.active.titles);
  const families: Record<TitleFamily, TitleChipRow[]> = { health: [], strength: [], other: [] };
  for (const record of titleTable) {
    families[titleFamily(record.bonus)].push({
      id: record.id,
      name: record.name,
      value: chipValue(record.bonus, 1).text,
      worn: worn.has(record.id),
    });
  }
  return (['health', 'strength', 'other'] as const).map((family) => ({
    family,
    label: TITLE_FAMILY_LABELS[family],
    chips: families[family],
  }));
}

/** What a captain is worth at this level and star rating, as the popover's footer says it. */
export function captainBonusLines(captainId: string, level: number, star: number): string[] {
  const record = captainTable.find((entry) => entry.id === captainId);
  if (record === undefined) return [];
  const line = rowValue(captainWorth(record, { id: '', captainId, level, star }));
  return line === '' ? [] : [line];
}
