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
 * - Artifact contribution = the level row plus the star row of the game's table (B-39): the in-game sheet
 *   shows one number, so we read the two as additive. The rows may feed different stats.
 * - VIP falls back to `sources.vipManual` whenever the table has no row for the level or the row is all
 *   zeroes (today `vip.json` is a placeholder: every level is 0).
 * - Conditional sources (Svyatogor "alone only", Amanitore "group marches only", Hercules "epic monsters
 *   only") are applied whenever they are switched on; the condition is surfaced as text by
 *   `sourceCaveats()` for the UI to show. The one exception is a march that names its type (W17 C5-0):
 *   a captain limited to another kind of march (`onlyOn`) then adds nothing (`captainCounts`). A march
 *   with no type, the default, counts every captain as before.
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
import { CAMPAIGN } from '../config';
import { BONUS_KEYS, CATEGORIES, SPECIAL_KEYS } from '../data/types';
import type {
  ArtifactCapacity,
  ArtifactRecord,
  ArtifactRow,
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
import type { CampaignInput } from '../engine/plan';
import type {
  BonusTotals,
  EnemyFormation,
  Method,
  RecoverySettings,
  ResolvedSource,
  StackingOptions,
  StackRequest,
} from '../engine/types';
import { ARTIFACT_LINES } from './schema';
import type {
  ArtifactRoll,
  BattleSetup,
  Profile,
  ProfileSources,
  ProfileTroops,
  SetupMarchType,
  SetupMethod,
} from './schema';

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
export function activeEntries<T extends { id: string }>(
  entries: readonly T[],
  activeIds: readonly string[],
): T[] {
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
 * bonus% = level × perLevel + stars[star] (PLAN §3.1). `star` is the 0..6 index, i.e. in-game stars − 1
 * (3 stars in game = star 2), because the table is indexed from the first star. The Sofia ÷2 / Amanitore ×1.5 / Skadi ×2 multipliers
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

/**
 * Does this captain's bonus count on this kind of march? Always, when the march names no type (the
 * default, today's readings) or the captain has no restriction; otherwise only on the one kind its
 * `onlyOn` names: Amanitore on a group march, Hercules against epic monsters (W17 C5-0).
 */
export function captainCounts(record: CaptainRecord | undefined, marchType: SetupMarchType): boolean {
  if (marchType === 'unspecified' || record?.onlyOn === undefined) return true;
  return marchType !== 'arena' && record.onlyOn === marchType;
}

/** The kind of march, as the caveat names it. */
const MARCH_TYPE_PHRASES: Record<Exclude<SetupMarchType, 'unspecified'>, string> = {
  solo: 'a solo march',
  group: 'a group march',
  epic: 'a march against epic monsters',
  arena: 'the Prime Arena',
};

// ---- Artifacts -------------------------------------------------------------------------------------
type ArtifactEntry = ProfileSources['artifacts'][number];

/** What of a saved artifact its figures come from. */
export type ArtifactState = Pick<ArtifactEntry, 'level' | 'star' | 'lines'>;

/** The random lines a star has opened: one per whole star reached, so line k counts from star k.0 (B-42). */
export const artifactLineCount = (star: string): number => Math.min(ARTIFACT_LINES, Math.floor(Number(star)));

/** The random bonuses that count at this star: the lines it has opened, the empty ones left out. */
export function openRolls({ star, lines = [] }: Pick<ArtifactEntry, 'star' | 'lines'>): ArtifactRoll[] {
  return lines.slice(0, artifactLineCount(star)).filter((line) => line !== null);
}

/** What an artifact's figures add up from: its level row, its star row and the random lines its star has opened. */
function artifactRows(record: ArtifactRecord, entry: ArtifactState): (ArtifactRow | undefined)[] {
  const rolled = openRolls(entry).map((roll) => byId(record.randomOptions, roll.option)?.values[roll.rarity]);
  return [record.levels[String(entry.level)], record.stars[entry.star], ...rolled];
}

/**
 * What an artifact gives as the player has it, on this kind of march: its level row, its star row and the
 * random lines its star has opened, each read from the game's table (B-39, B-42). What any of them gives
 * against other players is added in the Prime Arena only, in the same additive bracket (B-41). Capacity,
 * authority and march speed are no total (capacity: `artifactCapacity`), and an option the artifact cannot
 * roll gives nothing.
 */
export function artifactBonus(
  record: ArtifactRecord,
  entry: ArtifactState,
  marchType: SetupMarchType,
): Pick<ArtifactRow, 'health' | 'strength' | 'special'> {
  const value = draft();
  for (const row of artifactRows(record, entry)) {
    addContribution(value, row);
    if (marchType === 'arena') addContribution(value, row?.againstPlayers);
  }
  return { health: value.health, strength: value.strength, special: value.special };
}

/**
 * The percent an artifact adds to what a squad can lead, per pool (B-44): the same rows and open lines. It
 * counts in the Prime Arena maximum only (`arenaMaximum`), never in a march's housing.
 */
export function artifactCapacity(record: ArtifactRecord, entry: ArtifactState): ArtifactCapacity {
  const value: ArtifactCapacity = {};
  for (const row of artifactRows(record, entry)) addInto(value, row?.capacity);
  return value;
}

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

  // Captains (up to 3 marching); one limited to another kind of march than this one adds nothing.
  for (const entry of activeEntries(sources.captains, active.captains)) {
    const record = byId(tables.captains, entry.captainId);
    if (!captainCounts(record, setup.marchType)) continue;
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
    const name = record?.name ?? entry.equipmentId;
    const id = nextId(`equipment:${entry.equipmentId}`, entry.id);
    out.push(toSource(id, `${name} (${titleCase(entry.quality)})`, 'equipment', value));
  }

  // Artifacts: what the table gives at this level and star, and on the random lines.
  for (const entry of activeEntries(sources.artifacts, active.artifacts)) {
    const record = byId(tables.artifacts, entry.artifactId);
    const value = draft();
    if (record) addContribution(value, artifactBonus(record, entry, setup.marchType));
    const name = record?.name ?? entry.artifactId;
    const id = nextId(`artifact:${entry.artifactId}`, entry.id);
    out.push(toSource(id, `${name} L${entry.level} ★${entry.star}`, 'artifact', value));
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
 * Human-readable conditions attached to the active sources. The bonuses themselves are applied — the
 * game only grants them in some situations, and only the player knows which march this is. A march that
 * names its type has said so, and a captain restricted to another kind is not counted (`captainCounts`):
 * its line says that instead, and a restriction the march meets needs no line at all.
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
    if (!record?.note) continue;
    const { marchType } = setup;
    if (marchType === 'unspecified' || record.onlyOn === undefined) {
      notes.push(`${record.name}: ${record.note}`);
    } else if (!captainCounts(record, marchType)) {
      notes.push(`${record.name} is not counted on ${MARCH_TYPE_PHRASES[marchType]}. ${record.note}`);
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
 * One thing decides it: **technology** — the tier ranges (a `null` range disables the whole row),
 * the top-tier category chips, and `troops.excludedUnitIds` for the top-tier monsters the account
 * has not unlocked. The answer is everything the account can field, which is what the Troops card,
 * the kill-order editor and every march start from. What one *march* leaves out is decided on the
 * result and never here (S-53): Generate solves on the whole army, and the player's own leave-outs
 * live with the march on screen.
 *
 * Mercenaries are the ones the player selected; a `null` cap means "unlimited", i.e. no entry in
 * `caps`. Custom mercenaries are turned into plain `UnitDef`s and are always unlimited (the form has
 * no owned field).
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
  setup: Pick<BattleSetup, 'active'>,
  tables: DeriveTables = DEFAULT_TABLES,
): EnemyFormation | undefined {
  let forced: EventRecord['enemyFormation'] | undefined;
  for (const id of setup.active.events) {
    const record = byId(tables.events, id);
    if (record?.enemyFormation) forced = record.enemyFormation;
  }
  return forced ? normalizeEnemy(forced) : undefined;
}

/**
 * The sizing the engine is asked for. Three of the four are its own; **Complete optimization v2 is not a
 * sizing at all** — it plans the army's own ladder from scratch, so the request it starts from carries the
 * tier ladder and nothing about it is read before `planCampaign` builds its own.
 */
export function engineMethod(method: SetupMethod): Method {
  // The plan decides the sizing itself; the request carries the tier ladder and nothing more.
  return method === 'plan' ? 'elite' : method;
}

function stackingOptions(setup: BattleSetup): StackingOptions {
  const { options } = setup;
  return {
    method: engineMethod(options.method),
    strictMercsAboveMonsters: options.strictMercsAboveMonsters,
    monstersLast: options.monstersLast,
    // "Mercs in tens" is offered for the Elite, MS and custom methods only (`battle/choices.ts`), and the
    // plan plays sequences such as 14 · 12 · 10 · 9 a tens rule would round away. Owner, 2026-09-24, asked
    // whether the plan should follow a saved value it never shows: "Plan ignores it".
    roundTo10: options.method === 'plan' ? false : options.roundTo10,
    relaxedPreservation: options.relaxedPreservation,
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
      // No list is *"every family"*, and the engine reads it that way (`RecoverySettings.plan`); an
      // empty one is the player having ticked nothing, which is a retrain, so it is passed as it is.
      ...(plan.reviveFamilies === undefined ? {} : { reviveFamilies: [...plan.reviveFamilies] }),
      ...(plan.reviveAllTiers === undefined ? {} : { reviveAllTiers: [...plan.reviveAllTiers] }),
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

/**
 * Everything `planCampaign` needs for one press on Generate with the plan method (S-55).
 *
 * Every number here is a **policy** number out of `src/config.ts`, and the owner's review of 2026-09-15 is
 * why: the two campaign fields left the Battle card (S-56), so the horizon the plan is planned over and the
 * silver it may spend are no longer things a player types. The horizon matters most — left to itself the
 * plan answers with the campaign that maximises total damage, which on a real account is 66 marches and
 * 313 days of training, a number to read rather than a plan to march. No silver budget is sent at all now,
 * so the plan is always the free one the army points to, and the frontier it returns shows the trade with
 * the resource that binds.
 */
export function buildPlanRequest(
  profile: Profile,
  setup: BattleSetup,
  tables: DeriveTables = DEFAULT_TABLES,
): CampaignInput {
  return {
    request: buildStackRequest(profile, setup, tables),
    marchTarget: CAMPAIGN.marches,
    // S-58: the two candidate fixes for "the plan drops a whole hired type", both off until the owner picks
    // one from the pair of experiments (`src/config.ts`, `CAMPAIGN.planFixes`).
    ...CAMPAIGN.planFixes,
    // The put-back pass, at the owner's own exchange rates between damage, silver and the training queue
    // (`CAMPAIGN.putBack`): the engine has no opinion about them, so the app is what hands them over.
    putBack: CAMPAIGN.putBack,
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
