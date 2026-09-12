/**
 * What the Mercenaries card knows about a line (design plan §7.2): the unit behind it, the name a
 * screen reader reads, the quiet facts under the name, and how many of them the player owns.
 *
 * Everything here is pure, so the wording and the filtering are tested without rendering anything.
 */
import { customMercenaryToUnit, mercenaries as mercenaryTable, unitById } from '@/data';
import { GROUPS, RACES } from '@/data/types';
import type { Group, Race, UnitDef } from '@/data/types';
import type { CustomMercenary, Profile } from '@/state/schema';

import { GROUP_LABELS, RACE_LABELS } from './labels';

/** No owned quantity typed = you are never asked to field more than you have, because you have enough. */
export const UNLIMITED = '∞';
const TIMES = '×';

const number = new Intl.NumberFormat('en-US');

/** The tiers the table actually carries, low to high. */
export const TIERS: number[] = [...new Set(mercenaryTable.map((merc) => merc.tier))].sort((a, b) => a - b);

export const ROLES: readonly Group[] = GROUPS;
export const MERCENARY_RACES: readonly Race[] = RACES;

export interface MercenaryRow {
  id: string;
  unit: UnitDef;
  /** The row's accessible name, its selected state excluded: "Bear V, tier 5". */
  label: string;
  /** The quiet line under the name: "Tier 5 · Monster · Beast". */
  facts: string;
  /** How many the player owns; `null` means "as much as the camp can pay for". */
  cap: number | null;
  /** Typed in by hand, so it is edited and deleted here rather than picked from the table. */
  isCustom: boolean;
}

/** A tier of 0 is the "I did not read it off the sheet" of a hand-typed mercenary. */
function tierText(unit: UnitDef): string {
  return unit.tier === 0 ? 'custom' : `tier ${unit.tier}`;
}

export function rowLabel(unit: UnitDef): string {
  return `${unit.name}, ${tierText(unit)}`;
}

export function rowFacts(unit: UnitDef): string {
  return [
    unit.tier === 0 ? 'Custom' : `Tier ${unit.tier}`,
    unit.group === undefined ? '' : GROUP_LABELS[unit.group],
    unit.race === undefined ? '' : RACE_LABELS[unit.race],
  ]
    .filter((part) => part !== '')
    .join(' · ');
}

/** The mercenary a saved profile points at, or a stand-in when the tables no longer carry it. */
function missingUnit(id: string): UnitDef {
  return {
    id,
    name: id,
    label: id.slice(0, 4).toUpperCase(),
    kind: 'mercenary',
    pool: 'authority',
    tier: 0,
    keys: ['army'],
    cost: 0,
    health: 0,
    strength: 0,
    strengthAgainst: {},
    doubleDamageChance: 0,
    revival: { gold: 0 },
  };
}

/** A hand-typed mercenary as the same `UnitDef` the tables produce; absent facets stay absent. */
function customUnit(merc: CustomMercenary): UnitDef {
  return customMercenaryToUnit({
    id: merc.id,
    name: merc.name,
    health: merc.health,
    strength: merc.strength,
    cost: merc.cost,
    revivalGold: merc.revivalGold,
    doubleDamageChance: merc.doubleDamageChance,
    role: merc.role,
    ...(merc.category === undefined ? {} : { category: merc.category }),
    ...(merc.race === undefined ? {} : { race: merc.race }),
    ...(merc.event === undefined ? {} : { event: merc.event }),
  });
}

function row(unit: UnitDef, cap: number | null, isCustom: boolean): MercenaryRow {
  return { id: unit.id, unit, label: rowLabel(unit), facts: rowFacts(unit), cap, isCustom };
}

/** Every mercenary the profile fields: the ones picked from the table, then the hand-typed ones. */
export function ownedRows(mercenaries: Profile['mercenaries']): MercenaryRow[] {
  return [
    ...mercenaries.selected.map((entry) =>
      row(unitById(entry.id) ?? missingUnit(entry.id), entry.cap, false),
    ),
    ...mercenaries.custom.map((merc) => row(customUnit(merc), null, true)),
  ];
}

/** The table rows the picker can still offer, in the table's own order. */
export function pickerRows(taken: Set<string>): MercenaryRow[] {
  return mercenaryTable
    .filter((merc) => !taken.has(merc.id))
    .map((merc) => row(unitById(merc.id) ?? missingUnit(merc.id), null, false));
}

export interface Filters {
  query: string;
  tiers: number[];
  roles: Group[];
  races: Race[];
}

export function matches(entry: MercenaryRow, filters: Filters): boolean {
  const query = filters.query.trim().toLowerCase();
  if (query !== '' && !`${entry.unit.name} ${entry.unit.label}`.toLowerCase().includes(query)) return false;
  if (filters.tiers.length > 0 && !filters.tiers.includes(entry.unit.tier)) return false;
  if (
    filters.roles.length > 0 &&
    (entry.unit.group === undefined || !filters.roles.includes(entry.unit.group))
  )
    return false;
  if (filters.races.length > 0 && (entry.unit.race === undefined || !filters.races.includes(entry.unit.race)))
    return false;
  return true;
}

/** The ones this device reached for last come first; everything else keeps the table's order. */
export function recentFirst(entries: MercenaryRow[], recent: string[]): MercenaryRow[] {
  const rank = new Map(recent.map((id, index) => [id, index]));
  return [...entries].sort((a, b) => (rank.get(a.id) ?? recent.length) - (rank.get(b.id) ?? recent.length));
}

/** "×22", or "×∞" when nothing caps the stack. */
export function ownedText(cap: number | null): string {
  return `${TIMES}${cap === null ? UNLIMITED : number.format(cap)}`;
}
