/**
 * The Bonuses card as data (design plan §7.3): the groups the game puts its bonuses in, each a list
 * of source rows, and the three figures the header carries.
 *
 * Everything a row needs to draw itself and to act is decided here — its name, the one line saying
 * what it is worth, whether it is on, what switching it writes, and which editor its gear opens —
 * so `BonusesSection.tsx` is a list of rows and nothing else.
 *
 * Captains and the hero are the one group that draws itself as a **grid of tiles** rather than as
 * rows (§7.3 as amended 2026-09-13, D-33): `tiles` is what the grid renders, and `rows` stays behind
 * it as the bookkeeping the TOTAL counts, so nothing had to learn about captains twice. The hero
 * left the Other group for the head of that grid.
 *
 * The order of the groups is the order the game shows them in, so a player reading Pyrrhic next to
 * the game walks the same screens: Captains, Equipment, Artifacts, Titles, Permanent, Other,
 * Events. Two groups the design plan does not name are kept because nothing else in the app holds
 * them: Titles (Kingdom → Titles) and Temple and training, which is a single always-on row.
 */
import {
  artifacts as artifactTable,
  captains as captainTable,
  equipment as equipmentTable,
  events as eventTable,
  heroes as heroTable,
  otherPills as otherPillTable,
  temple,
  titles as titleTable,
  vip as vipTable,
} from '@/data';
import { QUALITIES } from '@/data/types';
import type {
  ArtifactRecord,
  BonusKey,
  CaptainRecord,
  EquipmentRecord,
  LevelTable,
  Quality,
} from '@/data/types';
import { aggregateBonuses } from '@/engine/bonuses';
import type { ActiveFlagKey, ActiveListKey } from '@/state/actions/bonuses';
import { captainValue, resolveSources, vipNeedsManual } from '@/state/derive';
import type { BattleSetup, Profile, ProfileSources } from '@/state/schema';

import {
  BONUS_LABELS,
  FALLBACK_STAR_KEYS,
  firstKey,
  isEmptyBonus,
  mergeBonus,
  rowValue,
  sourceLabel,
} from './labels';
import type { BonusLike } from './labels';
import { singleKey } from './values';

/** Three captains ride with one march, and three artifacts count, the same limits the game puts. */
export const MAX_ACTIVE_CAPTAINS = 3;
export const MAX_ACTIVE_ARTIFACTS = 3;
/** Three captains carry five pieces each, so a profile never holds more than fifteen. */
export const MAX_EQUIPMENT = 15;
/** The highest VIP level the game currently sells. */
export const MAX_VIP_LEVEL = 15;

type CaptainEntry = ProfileSources['captains'][number];
type EquipmentEntry = ProfileSources['equipment'][number];
type ArtifactEntry = ProfileSources['artifacts'][number];

/** Which editor a gear opens. The sheet is chosen on this, and `id` names the entry it edits. */
export type EditorTarget =
  | { kind: 'captain'; id: string }
  | { kind: 'equipment'; id: string }
  | { kind: 'artifact'; id: string }
  | { kind: 'title'; id: string }
  | { kind: 'permanent'; id: string }
  | { kind: 'custom'; id: string }
  | { kind: 'vip' }
  | { kind: 'hero' }
  | { kind: 'dragon' }
  | { kind: 'remainder' }
  | { kind: 'recovery' };

/** What a row's switch writes: one id in a list of the active setup, or one of its four flags. */
export type ToggleTarget = { list: ActiveListKey; id: string } | { flag: ActiveFlagKey };

export interface SourceRow {
  /** React key, and the row's identity inside its group. */
  id: string;
  /** The switch's accessible name and the row's visible name: the source, never what it feeds. */
  name: string;
  /** One line: "+25 % health (guardsmen)". Empty when nothing has been typed yet. */
  value: string;
  on: boolean;
  /** A permanent source counts on every march: it wears the tack instead of a switch. */
  locked?: boolean;
  /** The group is full and this row is off, so it cannot be switched on until another goes off. */
  isDisabled?: boolean;
  toggle?: ToggleTarget;
  editor?: EditorTarget;
}

/** What an "Add …" button at the end of a group creates. Captains have none: the grid is the form. */
export type AddKind = 'equipment' | 'artifact' | 'title' | 'permanent' | 'custom';

/**
 * What a tap on a captain tile acts on. A captain is named by its **table** id rather than by a
 * source entry, because the grid shows all thirty whether or not the profile has an entry for them:
 * the entry is minted by the first tap, not by an Add button.
 */
export type CaptainTarget = { kind: 'captain'; captainId: string } | { kind: 'hero' };

/** One tile of the captain grid (design plan §7.3 as amended, D-33). */
export interface CaptainTileRow {
  /** React key: the captain's table id, or `hero`. */
  id: string;
  name: string;
  /** The key its bonuses touch; absent when they touch no stack at all. */
  bonusKey?: BonusKey;
  /** The line under the name: the key in words, or why there is no badge. */
  meta: string;
  isEnlisted: boolean;
  /** Absent when there is nothing to set: the tile has no badge and opens no editor. */
  badge?: { text: string; isSet: boolean; label?: string };
  target: CaptainTarget;
}

export interface SourceGroup {
  id: string;
  title: string;
  /** How many of this group are on, and the cap when the game puts one: "2 of 3 captains on". */
  caption: string;
  rows: SourceRow[];
  /**
   * The captains group draws itself as a grid of tiles instead of rows. `rows` stays behind it as
   * the bookkeeping the TOTAL counts, so "sources on" keeps counting enlisted captains and the hero.
   */
  tiles?: CaptainTileRow[];
  /** What the group says instead of rows when it holds none. */
  empty: string;
  add?: { label: string; kind: AddKind; isDisabled: boolean };
}

export interface TotalsSummary {
  /** Whole-army health and strength, and the double-damage chance: the three figures of the header. */
  health: number;
  strength: number;
  special: number;
  /** Sources switched on for this march, permanent ones included. */
  on: number;
  /** Of those, the ones nothing has been typed into yet. */
  empty: number;
}

// ---- What each kind of source is worth --------------------------------------------------------
const captainRecord = (id: string): CaptainRecord | undefined =>
  captainTable.find((record) => record.id === id);
const equipmentRecord = (id: string): EquipmentRecord | undefined =>
  equipmentTable.find((record) => record.id === id);
const artifactRecord = (id: string): ArtifactRecord | undefined =>
  artifactTable.find((record) => record.id === id);

/** Level × the captain's own rate, plus what the stars add — the game's own formula. */
export function captainWorth(record: CaptainRecord | undefined, entry: CaptainEntry): BonusLike {
  if (!record) return {};
  return {
    ...(record.health
      ? { health: singleKey(record.health.key, captainValue(record.health, entry.level, entry.star)) }
      : {}),
    ...(record.strength
      ? { strength: singleKey(record.strength.key, captainValue(record.strength, entry.level, entry.star)) }
      : {}),
    ...(record.special
      ? { special: singleKey(record.special.key, captainValue(record.special, entry.level, entry.star)) }
      : {}),
  };
}

/** The quality row of the piece plus whatever a gem or an enchantment adds on top of it. */
export function equipmentWorth(record: EquipmentRecord | undefined, entry: EquipmentEntry): BonusLike {
  return mergeBonus(record?.byQuality[entry.quality] ?? {}, entry.extra ?? {});
}

export const artifactHasLevels = (record: ArtifactRecord | undefined): boolean =>
  (record?.health?.levels ?? record?.strength?.levels ?? record?.special?.levels) !== undefined;

const levelValue = (levels: LevelTable | undefined, level: number, star: string): number =>
  levels === undefined ? 0 : (levels.base?.[String(level)] ?? 0) + (levels.star?.[star] ?? 0);

/**
 * What an artifact is worth at this level and star rating. Artifacts whose table we have not
 * measured yet carry the values typed by hand instead. The random bonus is not on this line: it is
 * one option out of forty and it belongs in the editor, next to the option it was rolled on.
 */
export function artifactWorth(record: ArtifactRecord | undefined, entry: ArtifactEntry): BonusLike {
  if (!record) return {};
  if (!artifactHasLevels(record)) {
    return {
      health: entry.manual?.health ?? {},
      strength: entry.manual?.strength ?? {},
      special: entry.manual?.special ?? {},
    };
  }
  return {
    ...(record.health
      ? { health: singleKey(record.health.key, levelValue(record.health.levels, entry.level, entry.star)) }
      : {}),
    ...(record.strength
      ? {
          strength: singleKey(
            record.strength.key,
            levelValue(record.strength.levels, entry.level, entry.star),
          ),
        }
      : {}),
    ...(record.special
      ? { special: singleKey(record.special.key, levelValue(record.special.levels, entry.level, entry.star)) }
      : {}),
  };
}

/** What VIP is worth right now: the table row, or the values typed when we have no row. */
export function vipWorth(profile: Profile): BonusLike {
  const { vipLevel, vipManual } = profile.sources;
  if (!vipNeedsManual(profile)) return vipTable.find((entry) => entry.level === vipLevel)?.bonus ?? {};
  if (!vipManual) return {};
  return { health: { army: vipManual.health }, strength: { army: vipManual.strength } };
}

/** The temple divides revival costs; level 0 divides by 1, i.e. it changes nothing. */
export function templeDivisor(level: number): number {
  return temple.multiplier[String(level)] ?? 1;
}

// ---- The lists the editors pick from ----------------------------------------------------------
/**
 * A captain touches a stack only when it carries a health or a strength block. Ten of the thirty
 * carry neither (Hercules' bonus is a special strength chance, which no stack size depends on), so
 * they get no level badge and no editor — exactly what TotalStack's own picker does.
 */
export const hasStackEffect = (record: CaptainRecord | undefined): boolean =>
  record?.health !== undefined || record?.strength !== undefined;

/** The key a captain's stack bonus lands on; health and strength always name the same one. */
const stackKey = (record: CaptainRecord | undefined): BonusKey | undefined =>
  record?.health?.key ?? record?.strength?.key;

/** The profile's entry for one captain of the tables, if the player has ever touched it. */
export const captainEntryFor = (profile: Profile, captainId: string): CaptainEntry | undefined =>
  profile.sources.captains.find((entry) => entry.captainId === captainId);

/**
 * What this captain's two fields actually move, said in the sheet's description. The fields are
 * always the level and the stars — a captain carrying only one of the two keys is no different to
 * fill in, the key only says what the figure boosts — so the sheet says which out loud.
 */
export function captainBoosts(record: CaptainRecord | undefined): string {
  const key = stackKey(record);
  if (key === undefined || record === undefined) return '';
  const where = BONUS_LABELS[key].toLowerCase();
  if (record.health !== undefined && record.strength !== undefined) {
    return `Its level and its stars set ${where} health and ${where} strength.`;
  }
  const what = record.health !== undefined ? 'health' : 'strength';
  return `Its level and its stars set ${where} ${what} only — this captain grants nothing else.`;
}

/** Qualities the tables actually carry for this piece (a few start at uncommon). */
export function qualitiesOf(record: EquipmentRecord | undefined): Quality[] {
  return QUALITIES.filter((quality) => record?.byQuality[quality] !== undefined);
}

export function firstQuality(record: EquipmentRecord | undefined): Quality {
  return qualitiesOf(record)[0] ?? 'poor';
}

/** The star ratings this artifact's table knows; artifacts without a table get the full notation. */
export function starKeys(record: ArtifactRecord | undefined): string[] {
  const table =
    record?.health?.levels?.star ?? record?.strength?.levels?.star ?? record?.special?.levels?.star;
  const keys = table === undefined ? [] : Object.keys(table);
  return keys.length === 0 ? FALLBACK_STAR_KEYS : ['0.0', ...keys.filter((key) => key !== '0.0')];
}

// ---- The groups -------------------------------------------------------------------------------
function caption(on: number, total: number, one: string, many: string): string {
  return `${String(on)} of ${String(total)} ${total === 1 ? one : many} on`;
}

const row = (values: SourceRow): SourceRow => values;

/** Sources of a kind that keep a name of their own; an unnamed one still has to be findable. */
const named = (name: string, fallback: string): string => (name.trim() === '' ? fallback : name);

/** The badge's own text: the level and the stars once typed, the job to do before that. */
const levelBadge = (entry: CaptainEntry | undefined): { text: string; isSet: boolean } =>
  entry === undefined || entry.level === 0
    ? { text: 'Set level', isSet: false }
    : { text: `${String(entry.level)} ★${String(entry.star)}`, isSet: true };

/**
 * The hero's tile, at the head of the grid. The hero has no level of its own — all it stores is
 * *which* hero leads the march — so its badge opens the same picker the old row's gear did.
 */
function heroTile(profile: Profile, setup: BattleSetup): CaptainTileRow {
  const hero = heroTable.find((record) => record.id === profile.sources.hero);
  const key = hero === undefined ? undefined : firstKey(hero.bonus);
  const bonusKey = key !== undefined && key in BONUS_LABELS ? (key as BonusKey) : undefined;
  return {
    id: 'hero',
    name: hero?.name ?? 'Hero',
    ...(bonusKey === undefined ? {} : { bonusKey }),
    meta:
      hero === undefined
        ? 'No hero chosen'
        : bonusKey === undefined
          ? 'No stack bonus'
          : BONUS_LABELS[bonusKey],
    isEnlisted: setup.active.hero && hero !== undefined,
    badge: {
      text: hero === undefined ? 'Choose hero' : 'Change hero',
      isSet: hero !== undefined,
      label: hero === undefined ? 'Choose the hero' : 'Change the hero',
    },
    target: { kind: 'hero' },
  };
}

/**
 * Every captain the tables know, always on screen: the grid is the whole form and the whole summary
 * at once, so nothing opens a create flow any more. Order: the hero, then whoever is riding with
 * this march, then the captains that can change a stack, then the rest — each run by name.
 */
function captainTiles(profile: Profile, setup: BattleSetup): CaptainTileRow[] {
  const active = setup.active.captains;
  const byCaptain = new Map(profile.sources.captains.map((entry) => [entry.captainId, entry]));
  const tiles = [...captainTable]
    .map((record) => {
      const entry = byCaptain.get(record.id);
      const isEnlisted = entry !== undefined && active.includes(entry.id);
      const key = stackKey(record);
      return {
        id: record.id,
        name: record.name,
        ...(key === undefined ? {} : { bonusKey: key }),
        meta: key === undefined ? 'No stack bonus' : BONUS_LABELS[key],
        isEnlisted,
        ...(hasStackEffect(record) ? { badge: levelBadge(entry) } : {}),
        target: { kind: 'captain' as const, captainId: record.id },
      } satisfies CaptainTileRow;
    })
    .sort((a, b) => {
      const rank = (tile: CaptainTileRow): number => (tile.isEnlisted ? 0 : tile.badge === undefined ? 2 : 1);
      return rank(a) - rank(b) || a.name.localeCompare(b.name);
    });
  return [heroTile(profile, setup), ...tiles];
}

function captainsGroup(profile: Profile, setup: BattleSetup): SourceGroup {
  const active = setup.active.captains;
  const hero = heroTable.find((record) => record.id === profile.sources.hero);
  return {
    id: 'captains',
    title: 'Captains and hero',
    caption: caption(active.length, MAX_ACTIVE_CAPTAINS, 'captain', 'captains'),
    empty: '',
    tiles: captainTiles(profile, setup),
    rows: [
      row({
        id: 'hero',
        name: hero?.name ?? 'Hero',
        value: hero === undefined ? '' : rowValue(hero.bonus),
        on: setup.active.hero && hero !== undefined,
        toggle: { flag: 'hero' },
        editor: { kind: 'hero' },
      }),
      ...profile.sources.captains.map((entry) => {
        const record = captainRecord(entry.captainId);
        return row({
          id: entry.id,
          name: record?.name ?? entry.captainId,
          value: rowValue(captainWorth(record, entry)),
          on: active.includes(entry.id),
          toggle: { list: 'captains', id: entry.id },
          editor: { kind: 'captain', id: entry.id },
        });
      }),
    ],
  };
}

function equipmentGroup(profile: Profile, setup: BattleSetup): SourceGroup {
  const entries = profile.sources.equipment;
  const active = setup.active.equipment;
  return {
    id: 'equipment',
    title: 'Equipment',
    caption: caption(active.length, entries.length, 'piece', 'pieces'),
    empty: 'No piece yet. Add one for every slot your captains march with.',
    add: { label: 'Add equipment', kind: 'equipment', isDisabled: entries.length >= MAX_EQUIPMENT },
    rows: entries.map((entry) => {
      const record = equipmentRecord(entry.equipmentId);
      return row({
        id: entry.id,
        name: named(entry.name ?? '', record?.name ?? entry.equipmentId),
        value: rowValue(equipmentWorth(record, entry)),
        on: active.includes(entry.id),
        toggle: { list: 'equipment', id: entry.id },
        editor: { kind: 'equipment', id: entry.id },
      });
    }),
  };
}

function artifactsGroup(profile: Profile, setup: BattleSetup): SourceGroup {
  const active = setup.active.artifacts;
  const atLimit = active.length >= MAX_ACTIVE_ARTIFACTS;
  return {
    id: 'artifacts',
    title: 'Artifacts',
    caption: caption(active.length, MAX_ACTIVE_ARTIFACTS, 'artifact', 'artifacts'),
    empty: 'No artifact yet. Add the ones equipped on your hero.',
    add: { label: 'Add artifact', kind: 'artifact', isDisabled: artifactTable.length === 0 },
    rows: profile.sources.artifacts.map((entry) => {
      const record = artifactRecord(entry.artifactId);
      const on = active.includes(entry.id);
      return row({
        id: entry.id,
        name: record?.name ?? entry.artifactId,
        value: rowValue(artifactWorth(record, entry)),
        on,
        isDisabled: !on && atLimit,
        toggle: { list: 'artifacts', id: entry.id },
        editor: { kind: 'artifact', id: entry.id },
      });
    }),
  };
}

function titlesGroup(profile: Profile, setup: BattleSetup): SourceGroup {
  const owned = profile.sources.titles;
  const active = setup.active.titles;
  const rows = titleTable
    .filter((record) => owned.includes(record.id))
    .map((record) =>
      row({
        id: record.id,
        name: record.name,
        value: rowValue(record.bonus),
        on: active.includes(record.id),
        toggle: { list: 'titles', id: record.id },
        editor: { kind: 'title', id: record.id },
      }),
    );
  return {
    id: 'titles',
    title: 'Titles',
    caption: caption(active.length, rows.length, 'title', 'titles'),
    empty: 'No title yet. Add the ones your account holds, then wear one for this march.',
    add: {
      label: 'Add title',
      kind: 'title',
      isDisabled: titleTable.every((record) => owned.includes(record.id)),
    },
    rows,
  };
}

function permanentGroup(profile: Profile): SourceGroup {
  const entries = profile.sources.permanent;
  return {
    id: 'permanent',
    title: 'Permanent',
    caption: `${String(entries.length)} always on`,
    empty: 'Nothing permanent yet.',
    add: { label: 'Add permanent source', kind: 'permanent', isDisabled: false },
    rows: entries.map((entry) =>
      row({
        id: entry.id,
        name: named(entry.name, 'Permanent source'),
        value: rowValue(entry),
        on: true,
        locked: true,
        editor: { kind: 'permanent', id: entry.id },
      }),
    ),
  };
}

function otherGroup(profile: Profile, setup: BattleSetup): SourceGroup {
  const { sources } = profile;
  const { active } = setup;
  // The hero left this group for the head of the captain grid (design plan §7.3 as amended, D-33).
  const rows: SourceRow[] = [
    row({
      id: 'vip',
      name: `VIP level ${String(sources.vipLevel)}`,
      value: rowValue(vipWorth(profile)),
      on: active.vip,
      toggle: { flag: 'vip' },
      editor: { kind: 'vip' },
    }),
    row({
      id: 'dragon',
      name: 'Dragon',
      value: rowValue(sources.dragon),
      on: active.dragon,
      toggle: { flag: 'dragon' },
      editor: { kind: 'dragon' },
    }),
    ...otherPillTable.map((record) =>
      row({
        id: record.id,
        name: record.name,
        value: rowValue(record.bonus),
        on: active.otherPills.includes(record.id),
        toggle: { list: 'otherPills', id: record.id },
      }),
    ),
    ...sources.custom.map((entry) =>
      row({
        id: entry.id,
        name: named(entry.name, 'Source of your own'),
        value: rowValue(entry),
        on: active.custom.includes(entry.id),
        toggle: { list: 'custom', id: entry.id },
        editor: { kind: 'custom', id: entry.id },
      }),
    ),
    row({
      id: 'remainder',
      name: 'Unexplained remainder',
      value: rowValue(sources.unknown),
      on: active.unknown,
      toggle: { flag: 'unknown' },
      editor: { kind: 'remainder' },
    }),
  ];
  return {
    id: 'other',
    title: 'Other',
    caption: caption(rows.filter((entry) => entry.on).length, rows.length, 'source', 'sources'),
    empty: 'Nothing here yet.',
    add: { label: 'Add source', kind: 'custom', isDisabled: false },
    rows,
  };
}

function eventsGroup(setup: BattleSetup): SourceGroup {
  const active = setup.active.events;
  const rows = eventTable.map((record) =>
    row({
      id: record.id,
      name: record.name,
      value:
        record.strength !== undefined
          ? rowValue({ strength: { army: record.strength } })
          : record.enemyFormation === undefined
            ? ''
            : 'sets the enemy formation',
      on: active.includes(record.id),
      toggle: { list: 'events', id: record.id },
    }),
  );
  return {
    id: 'events',
    title: 'Events',
    caption: caption(active.length, rows.length, 'event', 'events'),
    empty: 'No event is running.',
    rows,
  };
}

function recoveryGroup(profile: Profile): SourceGroup {
  const divisor = templeDivisor(profile.recovery.templeLevel);
  return {
    id: 'recovery',
    title: 'Recovery',
    caption: 'always on',
    empty: '',
    rows: [
      row({
        id: 'recovery',
        name: 'Temple and training',
        value: `revival costs divided by ${String(divisor)}`,
        on: true,
        locked: true,
        editor: { kind: 'recovery' },
      }),
    ],
  };
}

/** Every group of the card, in the order the game shows its own screens. */
export function sourceGroups(profile: Profile, setup: BattleSetup): SourceGroup[] {
  return [
    captainsGroup(profile, setup),
    equipmentGroup(profile, setup),
    artifactsGroup(profile, setup),
    titlesGroup(profile, setup),
    permanentGroup(profile),
    otherGroup(profile, setup),
    eventsGroup(setup),
    recoveryGroup(profile),
  ];
}

/**
 * The header figures: what the sources switched on add up to for the whole army, how many of them
 * there are, and how many of those have nothing typed in them yet — the one thing that silently
 * makes a march wrong, so the header says it out loud.
 */
export function totalsSummary(profile: Profile, setup: BattleSetup): TotalsSummary {
  const totals = aggregateBonuses(resolveSources(profile, setup));
  let on = 0;
  let empty = 0;
  for (const group of sourceGroups(profile, setup)) {
    if (group.id === 'recovery') continue;
    for (const entry of group.rows) {
      if (!entry.on) continue;
      // A permanent editor exists on every profile whether or not anything was typed into it, so an
      // empty one is not a source you switched on — it is a screen you have not visited yet.
      if (entry.locked === true) {
        if (entry.value !== '') on += 1;
        continue;
      }
      on += 1;
      if (entry.value === '') empty += 1;
    }
  }
  return {
    health: totals.health.army,
    strength: totals.strength.army,
    special: totals.special.doubleDamageChance,
    on,
    empty,
  };
}

// ---- Wording shared with the editors -----------------------------------------------------------
/** The one line every editor opens with: the screen its figures are read on, in our own words. */
export const WHERE: Record<EditorTarget['kind'], string> = {
  captain:
    'the Captains screen — open a captain to read its level and its stars. The bonus is the level times the captain’s own rate, plus what the stars add.',
  equipment:
    'a captain’s five equipment slots — each piece shows its type and its quality. Gems and enchantments are typed separately, because the quality table does not carry them.',
  artifact:
    'the Artifacts screen — each card shows its level, its star rating and the random bonus it rolled. Type them exactly as the card shows them.',
  title: 'Kingdom → Titles — the holder is named next to each title.',
  permanent:
    'wherever it is granted — read the percentage off that screen and type it on the key it applies to.',
  custom:
    'wherever the bonus comes from — a temporary buff, a new source, anything the lists above miss. Type the percentage on the key it applies to.',
  vip: 'the VIP screen — your level, and the army bonus written next to it.',
  hero: 'the Heroes screen — the hero leading this march and the bonus it grants.',
  dragon:
    'the Dragon screen — the army bonuses it grants at its current level, plus what its equipped runes add.',
  remainder:
    'a real battle report, or the march window on a monster: compare the army bonuses it lists with the figures above and type the difference here.',
  recovery: 'the Temple for its level; the cost and speed bonuses sit on your barracks and workshops.',
};

/** Where each of the eight builtin permanent editors is read in game. One line each, our words. */
export const PERMANENT_WHERE: Record<string, string> = {
  heroTalents: 'Hero → Talents: add up the health and strength lines of the talents you unlocked.',
  hallOfFame: 'City → Hall of Fame: the army bonuses the building lists on its info panel.',
  customization: 'Profile → Customization: frames, portraits and city looks that carry an army bonus.',
  armyModernization: 'Academy → Research → the Army Modernization branch totals.',
  monstersBoost: 'Academy → Research → the Monsters branch, one line per race.',
  clanTechnologies: 'Clan → Technologies: the army lines your clan has already researched.',
  clanCapitalAppearance: 'Clan → Capital: the bonuses the capital appearance grants every member.',
  unionOfTriumph: 'Union of Triumph: the bonus for the number of Golden Passes on the account.',
};

export { artifactRecord, captainRecord, equipmentRecord, isEmptyBonus, sourceLabel };
export type { BonusKey };
