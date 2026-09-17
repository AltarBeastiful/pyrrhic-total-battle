/**
 * The Bonuses card as data (design plan §7.3): the groups the game puts its bonuses in, each a list
 * of source rows, and the three figures the header carries.
 *
 * Everything a row needs to draw itself and to act is decided here — its name, the one line saying
 * what it is worth, whether it is on, what switching it writes, and which editor its gear opens —
 * so `BonusesSection.tsx` is a list of rows and nothing else.
 *
 * Four of the groups draw themselves as **chips** rather than as rows (§7.3 as amended 2026-09-13,
 * D-34): captains and the hero, artifacts, permanent sources and titles. `chips.ts` builds those;
 * the rows they shadow stay here as the bookkeeping the TOTAL counts, so nothing had to learn about
 * a captain twice. The hero left the Other group for the head of the captain row.
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
  describeContribution,
  FALLBACK_STAR_KEYS,
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

/**
 * Which **sheet** a gear opens, and which entry it edits. Captains, artifacts and the hero are not
 * here any more: their editors are anchored popovers on the chip itself (D-34), and a title has
 * nothing to edit at all.
 */
export type EditorTarget =
  | { kind: 'equipment'; id: string }
  | { kind: 'permanent'; id: string }
  | { kind: 'custom'; id: string }
  | { kind: 'vip' }
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
  /** Every line, for the chip's tooltip, where `value` stops at "and N more". */
  lines?: string[];
  on: boolean;
  /** A permanent source counts on every march: it wears the tack instead of a switch. */
  locked?: boolean;
  /** The group is full and this row is off, so it cannot be switched on until another goes off. */
  isDisabled?: boolean;
  toggle?: ToggleTarget;
  editor?: EditorTarget;
}

/**
 * What an "Add …" button at the end of a group creates. Only the three free-form families have one:
 * captains, artifacts and titles are every option at once, so there is nothing to add (rule 12).
 */
export type AddKind = 'equipment' | 'permanent' | 'custom';

export interface SourceGroup {
  id: string;
  title: string;
  /** How many of this group are on, and the cap when the game puts one: "2 of 3 captains on". */
  caption: string;
  rows: SourceRow[];
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

/** The profile's entry for one captain of the tables, if the player has ever touched it. */
export const captainEntryFor = (profile: Profile, captainId: string): CaptainEntry | undefined =>
  profile.sources.captains.find((entry) => entry.captainId === captainId);

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

function captainsGroup(profile: Profile, setup: BattleSetup): SourceGroup {
  const active = setup.active.captains;
  const hero = heroTable.find((record) => record.id === profile.sources.hero);
  return {
    id: 'captains',
    title: 'Captains and hero',
    caption: caption(active.length, MAX_ACTIVE_CAPTAINS, 'captain', 'captains'),
    empty: '',
    rows: [
      row({
        id: 'hero',
        name: hero?.name ?? 'Hero',
        value: hero === undefined ? '' : rowValue(hero.bonus),
        on: setup.active.hero && hero !== undefined,
        toggle: { flag: 'hero' },
      }),
      ...profile.sources.captains.map((entry) => {
        const record = captainRecord(entry.captainId);
        return row({
          id: entry.id,
          name: record?.name ?? entry.captainId,
          value: rowValue(captainWorth(record, entry)),
          on: active.includes(entry.id),
          toggle: { list: 'captains', id: entry.id },
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
        lines: describeContribution(equipmentWorth(record, entry)),
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
    empty: '',
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
      }),
    );
  return {
    id: 'titles',
    title: 'Titles',
    caption: caption(active.length, rows.length, 'title', 'titles'),
    empty: '',
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
      lines: describeContribution(vipWorth(profile)),
      on: active.vip,
      toggle: { flag: 'vip' },
      editor: { kind: 'vip' },
    }),
    row({
      id: 'dragon',
      name: 'Dragon',
      value: rowValue(sources.dragon),
      lines: describeContribution(sources.dragon),
      on: active.dragon,
      toggle: { flag: 'dragon' },
      editor: { kind: 'dragon' },
    }),
    ...otherPillTable.map((record) =>
      row({
        id: record.id,
        name: record.name,
        value: rowValue(record.bonus),
        lines: describeContribution(record.bonus),
        on: active.otherPills.includes(record.id),
        toggle: { list: 'otherPills', id: record.id },
      }),
    ),
    ...sources.custom.map((entry) =>
      row({
        id: entry.id,
        name: named(entry.name, 'Source of your own'),
        value: rowValue(entry),
        lines: describeContribution(entry),
        on: active.custom.includes(entry.id),
        toggle: { list: 'custom', id: entry.id },
        editor: { kind: 'custom', id: entry.id },
      }),
    ),
    row({
      id: 'remainder',
      name: 'Unexplained remainder',
      value: rowValue(sources.unknown),
      lines: describeContribution(sources.unknown),
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
  equipment:
    'a captain’s five equipment slots — each piece shows its type and its quality. Gems and enchantments are typed separately, because the quality table does not carry them.',
  permanent:
    'wherever it is granted — read the percentage off that screen and type it on the key it applies to.',
  custom:
    'wherever the bonus comes from — a temporary buff, a new source, anything the lists above miss. Type the percentage on the key it applies to.',
  vip: 'the VIP screen — your level, and the army bonus written next to it.',
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
