/**
 * What the Mercenaries card knows about a line (design plan §7.2, amended 2026-09-13): the unit
 * behind it, the name a screen reader reads, and how many of them the player owns.
 *
 * A player knows a mercenary by its name and its tier, so those are the two facts a line carries
 * and the two the lists are ordered by — both the camp and the picker climb the tiers, as
 * TotalStack's do.
 * Role and race are gone from the card; they were noise.
 *
 * Everything here is pure, so the ordering and the wording are tested without rendering anything.
 */
import { customMercenaryToUnit, mercenaries as mercenaryTable, unitById } from '@/data';
import type { Group, UnitDef } from '@/data/types';
import type { CustomMercenary, Profile } from '@/state/schema';
import { count, type GlyphKind } from '@/ui/domain';

/** No owned quantity typed = you are never asked to field more than you have, because you have enough. */
export const UNLIMITED = '∞';

export interface MercenaryRow {
  id: string;
  unit: UnitDef;
  /** The row's accessible name, its selected state excluded: "Bear V, tier 5". */
  label: string;
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
  return { id: unit.id, unit, label: rowLabel(unit), cap, isCustom };
}

function byName(a: MercenaryRow, b: MercenaryRow): number {
  return a.unit.name.localeCompare(b.unit.name, 'en');
}

/** Past the last tier the tables carry: where a hand-typed mercenary sorts, having no tier at all. */
const NO_TIER = 99;

/** The order the camp is read in: tier ascending, as TotalStack lists them, then the alphabet. */
function byTierThenName(a: MercenaryRow, b: MercenaryRow): number {
  const tier = (entry: MercenaryRow): number => (entry.unit.tier === 0 ? NO_TIER : entry.unit.tier);
  return tier(a) - tier(b) || byName(a, b);
}

/**
 * Every mercenary the profile fields, lowest tier first. Hand-typed ones carry no tier, so they
 * land at the end of the row rather than in the middle of it.
 */
export function ownedRows(mercenaries: Profile['mercenaries']): MercenaryRow[] {
  return [
    ...mercenaries.selected.map((entry) =>
      row(unitById(entry.id) ?? missingUnit(entry.id), entry.cap, false),
    ),
    ...mercenaries.custom.map((merc) => row(customUnit(merc), null, true)),
  ].sort(byTierThenName);
}

/** One group of the picker: a tier, and the mercenaries of that tier still to be hired. */
export interface TierGroup {
  tier: number;
  rows: MercenaryRow[];
}

/**
 * What the picker can still offer, grouped by tier from the lowest up — the order TotalStack lists
 * them in, and the order a player who is climbing the tiers reads them in — each group in the
 * alphabet.
 */
export function offerGroups(taken: Set<string>): TierGroup[] {
  const groups = new Map<number, MercenaryRow[]>();
  for (const merc of mercenaryTable) {
    if (taken.has(merc.id)) continue;
    const entry = row(unitById(merc.id) ?? missingUnit(merc.id), null, false);
    const rows = groups.get(merc.tier);
    if (rows === undefined) groups.set(merc.tier, [entry]);
    else rows.push(entry);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([tier, rows]) => ({ tier, rows: rows.sort(byName) }));
}

/**
 * The quantity as the pill writes it — "240", or "∞" when nothing caps the stack. TotalStack's pill
 * is three glanceable things ("EMH 5 ∞") and a multiplication sign is a fourth; the popover behind
 * the pill spells the figure out in words.
 */
export function capText(cap: number | null): string {
  return cap === null ? UNLIMITED : count(cap);
}

/** The same figure said out loud, for the button that opens the quantity editor. */
export function capSpoken(cap: number | null): string {
  return cap === null ? 'unlimited' : count(cap);
}

/** A mercenary's own family, when it has neither a category nor a race to show (the hunters). */
const GROUP_GLYPH: Record<Group, GlyphKind> = {
  guardsmen: 'guardsmen',
  specialist: 'specialists',
  engineers: 'engineers',
  monster: 'monsters',
};

/**
 * The silhouette a pill and a picker row wear: the category the mercenary fights as, its race when
 * the tables tag it as a monster only, and its family when it carries neither.
 */
export function mercGlyph(unit: UnitDef): GlyphKind {
  if (unit.category !== undefined) return unit.category;
  if (unit.race !== undefined) return unit.race;
  return unit.group === undefined ? 'army' : GROUP_GLYPH[unit.group];
}

/** The short code without its tier digits: the data's "ABM6" is drawn as "ABM" beside a roman VI. */
export function shortCode(label: string): string {
  return label.replace(/\d+$/, '') || label;
}
