/**
 * Derive layer (S-05) — the bridge between the stored config and the engine.
 *
 * `src/state/schema.ts` stores what the *player* typed (a captain entry is "Aydae, level 20, ★0", an
 * artifact is "Heart of the Forest, level 20, ★2.1"); `src/engine/types.ts` wants plain resolved numbers
 * (`ResolvedSource`, `StackRequest`). Everything that reads a game table to turn the first into the second
 * lives here, so the engine stays table-free and the store stays engine-free.
 *
 * Percentages stay "as entered" (39.5 means +39.5 %), exactly like the data and engine contracts: nothing
 * here divides by 100.
 *
 * Assumptions taken (see the story report):
 * - Artifact contribution = `levels.base[level] + levels.star[star]` (TotalStack shows the two tables side
 *   by side and the in-game sheet shows one number, so we read them as additive). Artifacts without a level
 *   table fall back to the `manual` values typed by the player.
 * - VIP falls back to `sources.vipManual` whenever the table has no row for the level or the row is all
 *   zeroes (today `vip.json` is a placeholder: every level is 0).
 * - Conditional sources (Svyatogor "alone only", Amanitore "group marches only", Hercules "epic monsters
 *   only") are always applied; the condition is surfaced as text by `sourceCaveats()` for the UI to show.
 */
import {
  artifacts as artifactTable,
  captains as captainTable,
  customMercenaryToUnit,
  equipment as equipmentTable,
  events as eventTable,
  getUnits,
  heroes as heroTable,
  otherPills as otherPillTable,
  titles as titleTable,
  vip as vipTable,
} from '../data';
import { BONUS_KEYS, CATEGORIES, SPECIAL_KEYS } from '../data/types';
import type {
  ArtifactRecord,
  BonusContribution,
  BonusKey,
  CaptainProgression,
  CaptainRecord,
  Category,
  EquipmentRecord,
  EventRecord,
  Group,
  HeroRecord,
  MatchupBonus,
  OtherPillRecord,
  SpecialKey,
  TitleRecord,
  UnitDef,
  VipRecord,
} from '../data/types';
import { aggregateBonuses } from '../engine/bonuses';
import type {
  BonusTotals,
  EnemyFormation,
  RecoverySettings,
  ResolvedSource,
  StackingOptions,
  StackRequest,
} from '../engine/types';
import type { BattleSetup, Profile, ProfileTroops } from './schema';

// ---- Tables ---------------------------------------------------------------------------------------
/** The game tables the derive layer reads. Injectable so tests can pin values without touching `src/data`. */
export interface DeriveTables {
  captains: readonly CaptainRecord[];
  equipment: readonly EquipmentRecord[];
  artifacts: readonly ArtifactRecord[];
  titles: readonly TitleRecord[];
  heroes: readonly HeroRecord[];
  otherPills: readonly OtherPillRecord[];
  events: readonly EventRecord[];
  vip: readonly VipRecord[];
}

export const DEFAULT_TABLES: DeriveTables = {
  captains: captainTable,
  equipment: equipmentTable,
  artifacts: artifactTable,
  titles: titleTable,
  heroes: heroTable,
  otherPills: otherPillTable,
  events: eventTable,
  vip: vipTable,
};

const byId = <T extends { id: string }>(rows: readonly T[], id: string): T | undefined =>
  rows.find((row) => row.id === id);

/** Entries of a profile list, in the order the setup activated them; unknown ids are dropped. */
function activeEntries<T extends { id: string }>(entries: readonly T[], activeIds: readonly string[]): T[] {
  const index = new Map(entries.map((entry) => [entry.id, entry]));
  return activeIds.flatMap((id) => {
    const entry = index.get(id);
    return entry ? [entry] : [];
  });
}

// ---- Contribution drafts ---------------------------------------------------------------------------
interface Draft {
  health: Partial<Record<BonusKey, number>>;
  strength: Partial<Record<BonusKey, number>>;
  special: Partial<Record<SpecialKey, number>>;
  matchup: MatchupBonus[];
  eventStrength: number;
}

const draft = (): Draft => ({ health: {}, strength: {}, special: {}, matchup: [], eventStrength: 0 });

function addKey<K extends string>(target: Partial<Record<K, number>>, key: K, value: number): void {
  if (value === 0) return;
  target[key] = (target[key] ?? 0) + value;
}

function addInto<K extends string>(
  target: Partial<Record<K, number>>,
  source: Partial<Record<K, number>> | undefined,
): void {
  if (!source) return;
  for (const [key, value] of Object.entries(source) as [K, number | undefined][]) {
    if (value === undefined) continue;
    addKey(target, key, value);
  }
}

/** Merges a table `BonusContribution` (title, hero, pill, equipment quality row…) into a draft. */
function addContribution(target: Draft, contribution: BonusContribution | undefined): void {
  if (!contribution) return;
  addInto(target.health, contribution.health);
  addInto(target.strength, contribution.strength);
  addInto(target.special, contribution.special);
  for (const matchup of contribution.matchup ?? []) target.matchup.push({ ...matchup });
}

const isEmpty = (map: object): boolean => Object.keys(map).length === 0;

/** A draft becomes a `ResolvedSource`; empty buckets are left out (`exactOptionalPropertyTypes`). */
function toSource(id: string, label: string, kind: ResolvedSource['kind'], value: Draft): ResolvedSource {
  return {
    id,
    label,
    kind,
    ...(isEmpty(value.health) ? {} : { health: value.health }),
    ...(isEmpty(value.strength) ? {} : { strength: value.strength }),
    ...(isEmpty(value.special) ? {} : { special: value.special }),
    ...(value.matchup.length === 0 ? {} : { matchup: value.matchup }),
    ...(value.eventStrength === 0 ? {} : { eventStrength: value.eventStrength }),
  };
}

/**
 * Source ids are readable and stable (`captain:aydae`), which is what the breakdown drawer shows. Two
 * entries of the same captain/equipment/artifact would collide, so the second one is suffixed with its
 * entry id (`captain:aydae#<entryId>`).
 */
function idFactory(): (base: string, discriminator?: string) => string {
  const used = new Set<string>();
  return (base, discriminator) => {
    let id = used.has(base) && discriminator !== undefined ? `${base}#${discriminator}` : base;
    for (let n = 2; used.has(id); n += 1) id = `${base}#${n}`;
    used.add(id);
    return id;
  };
}

// ---- Captains --------------------------------------------------------------------------------------
/**
 * bonus% = level × perLevel + stars[star] (PLAN §3.1). The Sofia ÷2 / Amanitore ×1.5 / Skadi ×2 multipliers
 * are already baked into `perLevel` in `captains.json`, so they must not be applied again here.
 */
export function captainValue(
  progression: Pick<CaptainProgression, 'perLevel' | 'stars'>,
  level: number,
  star: number,
): number {
  return level * progression.perLevel + (progression.stars[star] ?? 0);
}

const captainLabel = (
  record: CaptainRecord | undefined,
  entry: { captainId: string; level: number; star: number },
): string => `${record?.name ?? entry.captainId} L${entry.level} ★${entry.star}`;

// ---- Artifacts -------------------------------------------------------------------------------------
/** Prefix of a random-bonus option id → the bonus key it feeds (`guardsmanStrength` → `guardsmen`). */
const RANDOM_OPTION_KEYS: Record<string, BonusKey> = {
  army: 'army',
  guardsman: 'guardsmen',
  specialist: 'specialist',
  engineer: 'engineers',
  monster: 'monster',
  melee: 'melee',
  ranged: 'ranged',
  mounted: 'mounted',
  flying: 'flying',
};

/** Random-bonus options that are special-strength keys rather than `<key><Health|Strength>` pairs. */
const RANDOM_OPTION_SPECIALS: Record<string, SpecialKey> = {
  doubleDamageChance: 'doubleDamageChance',
  armyStrengthAgainstEpicMonsters: 'armyStrengthAgainstEpicMonsters',
};

/** Applies an artifact random bonus; returns false when the option id is not one we understand. */
function addRandomBonus(target: Draft, option: string, value: number): boolean {
  const special = RANDOM_OPTION_SPECIALS[option];
  if (special !== undefined) {
    addKey(target.special, special, value);
    return true;
  }
  for (const [prefix, key] of Object.entries(RANDOM_OPTION_KEYS)) {
    if (!option.startsWith(prefix)) continue;
    const suffix = option.slice(prefix.length);
    if (suffix === 'Health') addKey(target.health, key, value);
    else if (suffix === 'Strength') addKey(target.strength, key, value);
    else if (suffix === 'StrengthAndHealth') {
      addKey(target.health, key, value);
      addKey(target.strength, key, value);
    } else continue;
    return true;
  }
  return false;
}

/** `levels.base[level] + levels.star[star]`, or 0 when the artifact carries no table (see the header). */
function artifactLevelValue(
  progression: { levels?: { base?: Record<string, number>; star?: Record<string, number> } } | undefined,
  level: number,
  star: string,
): number {
  const levels = progression?.levels;
  if (!levels) return 0;
  return (levels.base?.[String(level)] ?? 0) + (levels.star?.[star] ?? 0);
}

const hasLevelTable = (record: ArtifactRecord | undefined): boolean =>
  Boolean(record?.health?.levels ?? record?.strength?.levels ?? record?.special?.levels);

// ---- VIP -------------------------------------------------------------------------------------------
const contributionIsZero = (bonus: BonusContribution): boolean =>
  [bonus.health, bonus.strength, bonus.special].every(
    (map) => map === undefined || Object.values(map).every((value) => !value),
  );

/**
 * Does this profile need the hand-typed VIP values (no row for the level, or a placeholder all-zero row)?
 * Level 0 is genuinely "no VIP", not an unknown, so it never asks for manual values.
 */
export function vipNeedsManual(profile: Profile, tables: DeriveTables = DEFAULT_TABLES): boolean {
  if (profile.sources.vipLevel === 0) return false;
  const row = tables.vip.find((entry) => entry.level === profile.sources.vipLevel);
  return row === undefined || contributionIsZero(row.bonus);
}

const titleCase = (value: string): string => value.charAt(0).toUpperCase() + value.slice(1);

// ---- resolveSources ---------------------------------------------------------------------------------
/**
 * Every bonus source switched on for this march, resolved to plain numbers. Permanent editors are always
 * included; everything else follows `setup.active`. Order is the order the UI lists them in.
 */
export function resolveSources(
  profile: Profile,
  setup: BattleSetup,
  tables: DeriveTables = DEFAULT_TABLES,
): ResolvedSource[] {
  const { sources } = profile;
  const { active } = setup;
  const out: ResolvedSource[] = [];
  const nextId = idFactory();

  // Permanent editors: always on, custom permanent rows included.
  for (const entry of sources.permanent) {
    const value = draft();
    addInto(value.health, entry.health);
    addInto(value.strength, entry.strength);
    addInto(value.special, entry.special);
    out.push(toSource(nextId(`permanent:${entry.id}`), entry.name || entry.id, 'permanent', value));
  }

  // Captains (up to 3 marching).
  for (const entry of activeEntries(sources.captains, active.captains)) {
    const record = byId(tables.captains, entry.captainId);
    const value = draft();
    if (record?.health)
      addKey(value.health, record.health.key, captainValue(record.health, entry.level, entry.star));
    if (record?.strength) {
      addKey(value.strength, record.strength.key, captainValue(record.strength, entry.level, entry.star));
    }
    if (record?.special) {
      addKey(value.special, record.special.key, captainValue(record.special, entry.level, entry.star));
    }
    const id = nextId(`captain:${entry.captainId}`, entry.id);
    out.push(toSource(id, captainLabel(record, entry), 'captain', value));
  }

  // Equipment: the quality row of the piece plus the gem / enchant values typed on top.
  for (const entry of activeEntries(sources.equipment, active.equipment)) {
    const record = byId(tables.equipment, entry.equipmentId);
    const value = draft();
    addContribution(value, record?.byQuality[entry.quality]);
    addInto(value.health, entry.extra?.health);
    addInto(value.strength, entry.extra?.strength);
    addInto(value.special, entry.extra?.special);
    const name = entry.name || record?.name || entry.equipmentId;
    const id = nextId(`equipment:${entry.equipmentId}`, entry.id);
    out.push(toSource(id, `${name} (${titleCase(entry.quality)})`, 'equipment', value));
  }

  // Artifacts (up to 3): level tables when we have them, hand-typed values when we do not, plus the random bonus.
  for (const entry of activeEntries(sources.artifacts, active.artifacts)) {
    const record = byId(tables.artifacts, entry.artifactId);
    const value = draft();
    if (hasLevelTable(record)) {
      if (record?.health) {
        addKey(value.health, record.health.key, artifactLevelValue(record.health, entry.level, entry.star));
      }
      if (record?.strength) {
        addKey(
          value.strength,
          record.strength.key,
          artifactLevelValue(record.strength, entry.level, entry.star),
        );
      }
      if (record?.special) {
        addKey(
          value.special,
          record.special.key,
          artifactLevelValue(record.special, entry.level, entry.star),
        );
      }
    } else {
      addInto(value.health, entry.manual?.health);
      addInto(value.strength, entry.manual?.strength);
      addInto(value.special, entry.manual?.special);
    }
    if (entry.random) addRandomBonus(value, entry.random.option, entry.random.value);
    const name = record?.name ?? entry.artifactId;
    const id = nextId(`artifact:${entry.artifactId}`, entry.id);
    out.push(toSource(id, `${name} L${entry.level} ★${entry.star || '0'}`, 'artifact', value));
  }

  // Titles: `active.titles` holds title ids straight from `titles.json`.
  for (const id of active.titles) {
    const record = byId(tables.titles, id);
    if (!record) continue;
    const value = draft();
    addContribution(value, record.bonus);
    out.push(toSource(nextId(`title:${id}`), record.name, 'title', value));
  }

  // Hero (one at most). Svyatogor's "alone only" is applied; the condition is a caveat, not a filter.
  if (active.hero && sources.hero !== undefined) {
    const record = byId(tables.heroes, sources.hero);
    if (record) {
      const value = draft();
      addContribution(value, record.bonus);
      out.push(toSource(nextId(`hero:${record.id}`), record.name, 'hero', value));
    }
  }

  // Personal / Clan / Kingdom "+25" pills and anything else in the Other section.
  for (const id of active.otherPills) {
    const record = byId(tables.otherPills, id);
    if (!record) continue;
    const value = draft();
    addContribution(value, record.bonus);
    out.push(toSource(nextId(`pill:${id}`), record.name, 'other', value));
  }

  // VIP.
  if (active.vip) {
    const row = tables.vip.find((entry) => entry.level === sources.vipLevel);
    const value = draft();
    if (row && !contributionIsZero(row.bonus)) {
      addContribution(value, row.bonus);
    } else if (sources.vipManual) {
      addKey(value.health, 'army', sources.vipManual.health);
      addKey(value.strength, 'army', sources.vipManual.strength);
    }
    out.push(toSource(nextId('vip'), `VIP ${sources.vipLevel}`, 'vip', value));
  }

  if (active.dragon) {
    const value = draft();
    addInto(value.health, sources.dragon.health);
    addInto(value.strength, sources.dragon.strength);
    addInto(value.special, sources.dragon.special);
    out.push(toSource(nextId('dragon'), 'Dragon', 'dragon', value));
  }

  if (active.unknown) {
    const value = draft();
    addInto(value.health, sources.unknown.health);
    addInto(value.strength, sources.unknown.strength);
    out.push(toSource(nextId('unknown'), 'Unknown Sources', 'other', value));
  }

  for (const entry of activeEntries(sources.custom, active.custom)) {
    const value = draft();
    addInto(value.health, entry.health);
    addInto(value.strength, entry.strength);
    addInto(value.special, entry.special);
    out.push(toSource(nextId(`custom:${entry.id}`), entry.name || entry.id, 'custom', value));
  }

  // Events: their strength sits in the same additive bracket as the rest (`eventStrength`).
  for (const id of active.events) {
    const record = byId(tables.events, id);
    if (!record) continue;
    const value = draft();
    value.eventStrength = record.strength ?? 0;
    out.push(toSource(nextId(`event:${id}`), record.name, 'event', value));
  }

  return out;
}

// ---- Caveats ----------------------------------------------------------------------------------------
/**
 * Human-readable conditions attached to the active sources. The bonuses themselves are always applied —
 * the game only grants them in some situations, and only the player knows which march this is.
 */
export function sourceCaveats(
  profile: Profile,
  setup: BattleSetup,
  tables: DeriveTables = DEFAULT_TABLES,
): string[] {
  const { sources } = profile;
  const notes: string[] = [];

  for (const entry of activeEntries(sources.captains, setup.active.captains)) {
    const record = byId(tables.captains, entry.captainId);
    if (record?.note) notes.push(`${record.name}: ${record.note}`);
  }

  for (const entry of activeEntries(sources.artifacts, setup.active.artifacts)) {
    const record = byId(tables.artifacts, entry.artifactId);
    if (!hasLevelTable(record)) {
      notes.push(`${record?.name ?? entry.artifactId}: no level table yet — the values you typed are used.`);
    }
  }

  if (setup.active.hero && sources.hero !== undefined) {
    const record = byId(tables.heroes, sources.hero);
    if (record?.aloneOnly) notes.push(`${record.name}: applies only when marching alone.`);
  }

  if (setup.active.vip && vipNeedsManual(profile, tables)) {
    notes.push(
      sources.vipManual
        ? `VIP ${sources.vipLevel} is not in the table — the values you typed are used.`
        : `VIP ${sources.vipLevel} is not in the table — enter its bonus by hand or it counts as 0.`,
    );
  }

  for (const id of setup.active.events) {
    const record = byId(tables.events, id);
    if (record?.enemyFormation) notes.push(`${record.name} sets the enemy formation for this march.`);
  }

  return notes;
}

// ---- buildUnits ---------------------------------------------------------------------------------------
/** Troops row of the profile → the `group` value the unit tables use. */
const TROOP_ROW_GROUP = {
  guardsmen: 'guardsmen',
  specialists: 'specialist',
  engineers: 'engineers',
} as const satisfies Record<string, Group>;

type TroopRow = keyof typeof TROOP_ROW_GROUP;
const TROOP_ROWS = Object.keys(TROOP_ROW_GROUP) as TroopRow[];

/** Row of `profile.troops` a unit belongs to (`undefined` for mercenaries). */
function rowOf(unit: UnitDef): TroopRow | 'monsters' | undefined {
  if (unit.kind === 'monster') return 'monsters';
  if (unit.kind !== 'troop') return undefined;
  return TROOP_ROWS.find((row) => TROOP_ROW_GROUP[row] === unit.group);
}

function troopIncluded(unit: UnitDef, troops: ProfileTroops): boolean {
  const row = rowOf(unit);
  if (row === undefined) return false;
  const range = troops[row];
  if (range === null) return false; // row disabled
  if (unit.tier < range.min || unit.tier > range.max) return false;
  if (row === 'monsters' || row === 'engineers') return true;
  // Categories of the highest unlocked tier the account has not upgraded yet.
  if (unit.tier !== range.max) return true;
  return unit.category === undefined || !troops.topTierExcluded[row].includes(unit.category);
}

/**
 * The unit types this profile fields, with the per-unit caps the engine must respect.
 *
 * Troops and monsters come from the tier ranges (a `null` range disables the whole row), minus the
 * top-tier category chips and minus the per-unit exclusions. Mercenaries are the ones the player selected;
 * a `null` cap means "unlimited", i.e. no entry in `caps`. Custom mercenaries are turned into plain
 * `UnitDef`s and are always unlimited (the form has no owned field).
 */
export function buildUnits(profile: Profile): { units: UnitDef[]; caps: Record<string, number> } {
  const excluded = new Set(profile.troops.excludedUnitIds);
  const selected = new Map(profile.mercenaries.selected.map((entry) => [entry.id, entry.cap]));
  const caps: Record<string, number> = {};

  const units = getUnits().filter((unit) => {
    if (excluded.has(unit.id)) return false;
    if (unit.kind === 'mercenary') return selected.has(unit.id);
    return troopIncluded(unit, profile.troops);
  });

  for (const unit of units) {
    const cap = selected.get(unit.id);
    if (cap !== undefined && cap !== null) caps[unit.id] = cap;
  }

  for (const custom of profile.mercenaries.custom) {
    if (excluded.has(custom.id)) continue;
    units.push(
      customMercenaryToUnit({
        id: custom.id,
        name: custom.name,
        health: custom.health,
        strength: custom.strength,
        cost: custom.cost,
        revivalGold: custom.revivalGold,
        doubleDamageChance: custom.doubleDamageChance,
        role: custom.role,
        ...(custom.category ? { category: custom.category } : {}),
        ...(custom.race ? { race: custom.race } : {}),
        ...(custom.event ? { event: custom.event } : {}),
      }),
    );
  }

  return { units, caps };
}

// ---- buildStackRequest ----------------------------------------------------------------------------------
/** Every category present, missing ones at 0, so the engine never reads an undefined squad count. */
function normalizeEnemy(formation: Partial<Record<Category, number>>): EnemyFormation {
  const enemy = {} as EnemyFormation;
  for (const category of CATEGORIES) enemy[category] = formation[category] ?? 0;
  return enemy;
}

/** The enemy formation an active event forces, if any (Arachne's: 2 of each). The last one wins. */
export function eventEnemyFormation(
  setup: BattleSetup,
  tables: DeriveTables = DEFAULT_TABLES,
): EnemyFormation | undefined {
  let forced: EventRecord['enemyFormation'] | undefined;
  for (const id of setup.active.events) {
    const record = byId(tables.events, id);
    if (record?.enemyFormation) forced = record.enemyFormation;
  }
  return forced ? normalizeEnemy(forced) : undefined;
}

function stackingOptions(setup: BattleSetup): StackingOptions {
  const { options } = setup;
  return {
    method: options.method,
    strictMercsAboveMonsters: options.strictMercsAboveMonsters,
    monstersLast: options.monstersLast,
    roundTo10: options.roundTo10,
    ...(options.customOrder ? { customOrder: [...options.customOrder] } : {}),
  };
}

/** Profile-wide recovery settings with the plan chosen for this march. */
function recoverySettings(profile: Profile, setup: BattleSetup): RecoverySettings {
  const plan = setup.recoveryPlan;
  return {
    templeLevel: profile.recovery.templeLevel,
    trainingCostReduction: { ...profile.recovery.trainingCostReduction },
    trainingSpeed: { ...profile.recovery.trainingSpeed },
    plan: {
      mode: plan.mode,
      ...(plan.selectiveTop === undefined ? {} : { selectiveTop: plan.selectiveTop }),
    },
  };
}

/** Everything the engine needs for one march: units, housing, totals, options, enemy, events, recovery. */
export function buildStackRequest(
  profile: Profile,
  setup: BattleSetup,
  tables: DeriveTables = DEFAULT_TABLES,
): StackRequest {
  const { units, caps } = buildUnits(profile);
  return {
    units,
    caps,
    housing: { ...setup.housing },
    totals: aggregateBonuses(resolveSources(profile, setup, tables)),
    options: stackingOptions(setup),
    enemy: eventEnemyFormation(setup, tables) ?? normalizeEnemy(setup.enemy),
    activeEvents: [...setup.active.events],
    recovery: recoverySettings(profile, setup),
  };
}

// ---- describeTotals -------------------------------------------------------------------------------------
const BONUS_KEY_LABELS: Record<BonusKey, string> = {
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

const SPECIAL_KEY_LABELS: Record<SpecialKey, string> = {
  doubleDamageChance: 'Double damage chance',
  strikeTwoSquadsChance: 'Strike two squads chance',
  beastsStrikeTwoSquadsChance: 'Beasts strike two squads chance',
  elementalsStrikeTwoSquadsChance: 'Elementals strike two squads chance',
  dragonsStrikeTwoSquadsChance: 'Dragons strike two squads chance',
  giantsStrikeTwoSquadsChance: 'Giants strike two squads chance',
  guardsmenDoubleDamageChance: 'Guardsmen double damage chance',
  specialistsDoubleDamageChance: 'Specialists double damage chance',
  engineersDoubleDamageChance: 'Engineers double damage chance',
  monstersDoubleDamageChance: 'Monsters double damage chance',
  armyStrengthAgainstEpicMonsters: 'Army strength against epic monsters',
};

export interface TotalContributor {
  sourceId: string;
  /** The source's label when it was resolved in this session, else its id. */
  label: string;
  value: number;
}

export interface TotalRow {
  key: BonusKey | SpecialKey;
  label: string;
  value: number;
  contributors: TotalContributor[];
}

export interface TotalsDescription {
  health: TotalRow[];
  strength: TotalRow[];
  special: TotalRow[];
  matchup: MatchupBonus[];
  eventStrength: number;
}

function rows<K extends BonusKey | SpecialKey>(
  keys: readonly K[],
  labels: Record<K, string>,
  values: Record<K, number>,
  breakdown: Partial<Record<K, { sourceId: string; value: number }[]>>,
  labelOf: (sourceId: string) => string,
): TotalRow[] {
  return keys.map((key) => ({
    key,
    label: labels[key],
    value: values[key],
    contributors: (breakdown[key] ?? []).map((entry) => ({
      sourceId: entry.sourceId,
      label: labelOf(entry.sourceId),
      value: entry.value,
    })),
  }));
}

/**
 * The TOTAL cards: one row per key (always all of them, in contract order) with the sources that fed it.
 * Pass the `ResolvedSource[]` the totals were built from to get readable contributor labels.
 */
export function describeTotals(
  totals: BonusTotals,
  sources: readonly ResolvedSource[] = [],
): TotalsDescription {
  const labels = new Map(sources.map((source) => [source.id, source.label]));
  const labelOf = (sourceId: string): string => labels.get(sourceId) ?? sourceId;
  return {
    health: rows(BONUS_KEYS, BONUS_KEY_LABELS, totals.health, totals.breakdown.health, labelOf),
    strength: rows(BONUS_KEYS, BONUS_KEY_LABELS, totals.strength, totals.breakdown.strength, labelOf),
    special: rows(SPECIAL_KEYS, SPECIAL_KEY_LABELS, totals.special, totals.breakdown.special, labelOf),
    matchup: totals.matchup.map((entry) => ({ ...entry })),
    eventStrength: totals.eventStrength,
  };
}
