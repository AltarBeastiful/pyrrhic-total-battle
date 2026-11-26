/**
 * Versioned migrations (ADR-0004). `schemaVersion` is an integer; `migrations[n]` upgrades a document
 * from version `n` to `n + 1` and they are applied in order on load, on import and on share-link decode.
 * The zod schema in `schema.ts` is the source of truth for the *current* version, so a migration only has
 * to produce something the current schema accepts.
 *
 * Unknown fields are never a crash: zod strips them and we log one console warning naming the paths.
 */
import { talents as talentTable, unitById } from '../data';
import { DEFAULT_SETTINGS, DEFAULT_TALENTS, defaultPrimeArena } from './defaults';
import {
  DEFAULT_TALENT_GOAL_ORDER,
  profileSchema,
  rootDocumentSchema,
  savedStackSchema,
  HERO_TALENT_KEYS,
  SCHEMA_VERSION,
  TALENT_GOALS,
} from './schema';
import type { Profile, RootDocument, SavedStack } from './schema';

export type Migration = (doc: Record<string, unknown>) => Record<string, unknown>;
export type MigrationTable = Record<number, Migration>;

/**
 * Is this unit id *technology* — a monster of the top tier the account has not unlocked yet — rather
 * than a march decision? Guardsmen and specialists say the same thing with `topTierExcluded`, one
 * category at a time; monsters cannot, because one monster tier holds four unrelated types.
 */
function isTopTierMonster(unitId: string, troops: Record<string, unknown> | undefined): boolean {
  const unit = unitById(unitId);
  if (unit === undefined || unit.kind !== 'monster') return false;
  const monsters = troops?.monsters;
  if (!isPlainObject(monsters) || typeof monsters.max !== 'number') return false;
  return unit.tier === monsters.max;
}

/**
 * `1 → 2` for one profile: "left out of the march" was a *battle setup* decision stored on the
 * *profile*, so one march's exclusions changed what every other march could field. Everything in
 * `troops.excludedUnitIds` that is not a top-tier monster moves into every setup's own
 * `excludedUnitIds` (the march it was taken out of is no longer knowable, so every march keeps the
 * army the player last saw); the top-tier monsters stay where they are, because they are technology.
 */
export function splitTroopExclusions(profile: Record<string, unknown>): Record<string, unknown> {
  const troops = isPlainObject(profile.troops) ? profile.troops : undefined;
  if (troops === undefined) return profile;
  const stored = Array.isArray(troops.excludedUnitIds)
    ? troops.excludedUnitIds.filter((id): id is string => typeof id === 'string')
    : [];
  const kept = stored.filter((id) => isTopTierMonster(id, troops));
  const moved = stored.filter((id) => !kept.includes(id));
  const setups = Array.isArray(profile.setups) ? profile.setups : [];
  return {
    ...profile,
    troops: { ...troops, excludedUnitIds: kept },
    setups: setups.map((setup) => {
      if (!isPlainObject(setup)) return setup;
      const own = Array.isArray(setup.excludedUnitIds)
        ? setup.excludedUnitIds.filter((id): id is string => typeof id === 'string')
        : [];
      return { ...setup, excludedUnitIds: [...own, ...moved.filter((id) => !own.includes(id))] };
    }),
  };
}

/**
 * `2 → 3` for one profile (S-53): pins are gone, and what a march leaves out is no longer a stored
 * decision. Generate solves on everything the account can field and the player's own leave-outs live
 * with the result on screen, so both `pinnedUnitIds` and `excludedUnitIds` are **discarded** — there
 * is nowhere left to put them. `troops.excludedUnitIds` is untouched: that one is technology.
 */
export function dropSetupUnitLists(profile: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(profile.setups)) return profile;
  return {
    ...profile,
    setups: profile.setups.map((setup) => {
      if (!isPlainObject(setup)) return setup;
      const { pinnedUnitIds: _pinned, excludedUnitIds: _excluded, ...rest } = setup;
      return rest;
    }),
  };
}

/**
 * `3 → 4` for one profile (owner, 2026-09-15): the fourth stacking method is gone and the campaign card
 * with it.
 *
 * `complete` (S-54) is superseded by `plan` (S-55), so a setup that stored it becomes a plan one; the
 * other four methods are untouched. `setup.campaign` goes entirely: the plan's horizon is a policy number
 * now (`CAMPAIGN.marches`, `src/config.ts`) and the silver box is not on the card at all, so there is
 * nowhere left for a stored `marches` or `silverBudget` to be read. Dropping the field is the whole
 * migration — nothing the player typed into it survives, which is what "off the card" means.
 */
export function dropCompleteMethod(profile: Record<string, unknown>): Record<string, unknown> {
  if (!Array.isArray(profile.setups)) return profile;
  return {
    ...profile,
    setups: profile.setups.map((setup) => (isPlainObject(setup) ? withoutCompleteMethod(setup) : setup)),
  };
}

/** One setup: drop the campaign card, and read `complete` as the method that replaced it. */
function withoutCompleteMethod(setup: Record<string, unknown>): Record<string, unknown> {
  const { campaign: _campaign, ...rest } = setup;
  const options = isPlainObject(rest.options) ? rest.options : undefined;
  if (options === undefined || options.method !== 'complete') return rest;
  return { ...rest, options: { ...options, method: 'plan' } };
}

/**
 * `4 → 5` for one profile (owner, 2026-09-19): the unexplained remainder is gone from the card, so the
 * figures a player typed into it have nowhere left to be read, switched on or corrected — and a source
 * that still counts towards a march with no chip to show for it is worse than one that is simply gone.
 * Both halves go: `sources.unknown` (what was typed) and every setup's `active.unknown` (whether it
 * counted), inside the profile's saved stacks as well, because each of those carries a whole setup.
 */
export function dropUnexplainedRemainder(profile: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...profile };
  if (isPlainObject(out.sources)) {
    const { unknown: _unknown, ...sources } = out.sources;
    out.sources = sources;
  }
  if (Array.isArray(out.setups)) out.setups = out.setups.map(withoutRemainderFlag);
  if (Array.isArray(out.savedStacks)) {
    out.savedStacks = out.savedStacks.map((stack) =>
      isPlainObject(stack) ? { ...stack, setup: withoutRemainderFlag(stack.setup) } : stack,
    );
  }
  return out;
}

/** One setup: the flag that said whether the remainder counted for this march. */
function withoutRemainderFlag(setup: unknown): unknown {
  if (!isPlainObject(setup) || !isPlainObject(setup.active)) return setup;
  const { unknown: _unknown, ...active } = setup.active;
  return { ...setup, active };
}

/**
 * `5 → 6` for one profile (owner, 2026-09-21): a selective recovery is chosen in **families** now — the
 * top type of each one the player ticks — so the count of types it used to be (`selectiveTop`, and
 * TotalStack's own "TOP 1 / TOP 2 / TOP 3") has nothing left to say. Dropping it is the whole
 * migration: a plan that names no family revives all five, which is what the card offers a player who
 * has never opened it, and the nearest thing to "the top three types" an old document meant.
 *
 * Every setup, and the whole setup inside every saved stack.
 */
export function dropSelectiveTop(profile: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...profile };
  if (Array.isArray(out.setups)) out.setups = out.setups.map(withoutSelectiveTop);
  if (Array.isArray(out.savedStacks)) {
    out.savedStacks = out.savedStacks.map((stack) =>
      isPlainObject(stack) ? { ...stack, setup: withoutSelectiveTop(stack.setup) } : stack,
    );
  }
  return out;
}

/** One setup: the count of top types its recovery plan was sized by. */
function withoutSelectiveTop(setup: unknown): unknown {
  if (!isPlainObject(setup) || !isPlainObject(setup.recoveryPlan)) return setup;
  const { selectiveTop: _selectiveTop, ...recoveryPlan } = setup.recoveryPlan;
  return { ...setup, recoveryPlan };
}

/**
 * `6 → 7` for one profile (W17 C2): the player can type upgrades for the advisor to weigh. A document
 * written before has none, so the list starts empty; nothing else moves.
 */
export function addUpgradeList(profile: Record<string, unknown>): Record<string, unknown> {
  return Array.isArray(profile.upgrades) ? profile : { ...profile, upgrades: [] };
}

/**
 * `7 → 8` for one profile (W17 C5-0): a march can name its type, so the captains the game limits to
 * one kind of march (Amanitore, Hercules) can be applied as the game applies them. A document written
 * before named none, and `'unspecified'` is what it meant: every captain counts, as it did. Every setup,
 * and the whole setup inside every saved stack.
 */
export function addMarchType(profile: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...profile };
  if (Array.isArray(out.setups)) out.setups = out.setups.map(withMarchType);
  if (Array.isArray(out.savedStacks)) {
    out.savedStacks = out.savedStacks.map((stack) =>
      isPlainObject(stack) ? { ...stack, setup: withMarchType(stack.setup) } : stack,
    );
  }
  return out;
}

/** One setup: the type it never named, unless it already carries one. */
function withMarchType(setup: unknown): unknown {
  if (!isPlainObject(setup) || typeof setup.marchType === 'string') return setup;
  return { ...setup, marchType: 'unspecified' };
}

/**
 * `8 → 9` for one profile (`docs/plans/burn-ceiling.md` §3.1): the account gains its preferences, at the
 * defaults that leave every Generate as it was — no pool line opened, the push as the rule a setting would
 * open. Nothing else moves.
 */
export function addSettings(profile: Record<string, unknown>): Record<string, unknown> {
  return isPlainObject(profile.settings) ? profile : { ...profile, settings: { ...DEFAULT_SETTINGS } };
}

/**
 * `9 → 10` for one profile (B-19): the "captain wearing it" name of a piece of equipment is gone, because
 * nothing ever read it; a piece may now belong to a set instead. Dropping the field is the whole
 * migration, and every total stays what it was.
 */
export function dropEquipmentWearer(profile: Record<string, unknown>): Record<string, unknown> {
  if (!isPlainObject(profile.sources) || !Array.isArray(profile.sources.equipment)) return profile;
  const equipment = profile.sources.equipment.map((piece) => {
    if (!isPlainObject(piece)) return piece;
    const { name: _name, ...rest } = piece;
    return rest;
  });
  return { ...profile, sources: { ...profile.sources, equipment } };
}

/** What `16 → 17` gave a profile: the first shape of the Prime Arena inputs (B-36), frozen here. */
const PRIME_ARENA_V17 = {
  tier: 0,
  leadership: 0,
  dominance: 0,
  captains: [],
  equipment: [],
  artifacts: [],
  toggles: {},
  seeded: false,
};

/** `16 → 17` for one profile (B-36): the account gains the Prime Arena inputs, empty. Nothing else moves. */
export function addPrimeArena(profile: Record<string, unknown>): Record<string, unknown> {
  return isPlainObject(profile.primeArena)
    ? profile
    : { ...profile, primeArena: structuredClone(PRIME_ARENA_V17) };
}

/** The switches that still exist at v18: the other four are now the setup's own captains, gear and dragon. */
const ARENA_V18_TOGGLES = ['talents', 'hallOfFame', 'customization', 'armyModernization', 'monstersBoost'];

/**
 * `17 → 18` for one profile: the arena's captains, gear, dragon and pools become a `BattleSetup`. A switch that
 * was off for captains, equipment or artifacts empties that list (the same army counts); a dragon switch moves
 * to `active.dragon`; the others keep their keys. A profile that already carries a `setup` is left alone.
 */
export function arenaBecomesSetup(profile: Record<string, unknown>): Record<string, unknown> {
  const old = profile.primeArena;
  if (!isPlainObject(old) || isPlainObject(old.setup)) return profile;
  const deviceId = typeof profile.deviceId === 'string' ? profile.deviceId : 'migrated';
  const fresh = defaultPrimeArena(deviceId);
  const switches = isPlainObject(old.toggles) ? old.toggles : {};
  const ids = (value: unknown, key: string): string[] =>
    switches[key] === false || !Array.isArray(value) ? [] : value.filter((id) => typeof id === 'string');
  const number = (value: unknown): number => (typeof value === 'number' && value >= 0 ? value : 0);
  const toggles: Record<string, boolean> = {};
  for (const key of ARENA_V18_TOGGLES) {
    if (typeof switches[key] === 'boolean') toggles[key] = switches[key];
  }
  const setup = {
    ...fresh.setup,
    // Deterministic (the profile's own uuid), so a document migrates to the same bytes every time it is read.
    id: typeof profile.id === 'string' ? profile.id : fresh.setup.id,
    updatedAt: typeof profile.updatedAt === 'number' ? profile.updatedAt : 0,
    active: {
      ...fresh.setup.active,
      captains: ids(old.captains, 'captains'),
      equipment: ids(old.equipment, 'equipment'),
      artifacts: ids(old.artifacts, 'artifacts'),
      dragon: switches.dragon !== false,
    },
    housing: { ...fresh.setup.housing, leadership: number(old.leadership), dominance: number(old.dominance) },
  };
  return {
    ...profile,
    primeArena: {
      tier: typeof old.tier === 'number' ? old.tier : 0,
      toggles,
      setup,
      seeded: old.seeded === true,
    },
  };
}

/**
 * `18 → 19` for one profile: the arena's division tier becomes the Guardsmen "to" level of the arena's own
 * Troops card (the division was that level under another name). Tier 0 was "the top", which stays `null` for
 * the page to resolve from the game tables. A profile already carrying `troops` is left alone.
 */
export function arenaDivisionBecomesTroops(profile: Record<string, unknown>): Record<string, unknown> {
  const old = profile.primeArena;
  if (!isPlainObject(old) || 'troops' in old) return profile;
  const { tier, ...rest } = old;
  const level = typeof tier === 'number' && tier > 0 ? Math.trunc(tier) : 0;
  const troops =
    level === 0
      ? null
      : {
          guardsmen: { min: 1, max: level },
          specialists: null,
          engineers: null,
          monsters: null,
          topTierExcluded: { guardsmen: [], specialists: [] },
          excludedUnitIds: [],
        };
  return { ...profile, primeArena: { ...rest, troops } };
}

/**
 * `10 → 11` for one profile (B-21): the account gains the hero talent planner's inputs, empty: level 1, no
 * rank bought, the Battle goal. Nothing else moves.
 */
export function addTalents(profile: Record<string, unknown>): Record<string, unknown> {
  return isPlainObject(profile.talents) ? profile : { ...profile, talents: structuredClone(DEFAULT_TALENTS) };
}

/**
 * `11 → 12` for one profile (B-22): the single saved goal becomes rank 1 of an order, the other two follow in
 * the default order; nothing is ignored, the strength is Focus and the mode Blended. A goal it does not know
 * gives the default order. Every other talents field is kept as it was.
 */
export function prioritiseTalentGoals(profile: Record<string, unknown>): Record<string, unknown> {
  if (!isPlainObject(profile.talents)) return profile;
  const { goal, ...rest } = profile.talents;
  const first = TALENT_GOALS.find((g) => g === goal);
  const goals =
    first === undefined
      ? [...DEFAULT_TALENT_GOAL_ORDER]
      : [first, ...DEFAULT_TALENT_GOAL_ORDER.filter((g) => g !== first)];
  const talents = { ignored: [], strength: 'focus', mode: 'blended', ...rest, goals: rest.goals ?? goals };
  return { ...profile, talents };
}

/** `12 → 13` for one profile (B-23): the talents gain the crypt types that count, all three. Nothing else moves. */
export function addTalentCrypts(profile: Record<string, unknown>): Record<string, unknown> {
  if (!isPlainObject(profile.talents)) return profile;
  return { ...profile, talents: { crypts: ['common', 'rare', 'epic'], ...profile.talents } };
}

/** `13 → 14` for one profile (B-23): the talents gain the troop-group overrides, none (follow the account). */
export function addTalentGroupOverrides(profile: Record<string, unknown>): Record<string, unknown> {
  if (!isPlainObject(profile.talents)) return profile;
  return { ...profile, talents: { groupOverrides: {}, ...profile.talents } };
}

/**
 * `14 → 15` for one profile (B-23): the typed points were the points left to spend, beside the ranks already
 * held; they become the whole stock, which the held ranks spend. What the held ranks cost is added, so the
 * points left after the upgrade are the points left before it. An empty field stays empty.
 */
export function pointsBecomeStock(profile: Record<string, unknown>): Record<string, unknown> {
  const t = profile.talents;
  if (!isPlainObject(t) || typeof t.pointsOverride !== 'number') return profile;
  const ranks = isPlainObject(t.ranks) ? t.ranks : {};
  let spent = 0;
  for (const rec of talentTable) {
    const held = Math.min(Number(ranks[String(rec.id)] ?? 0) || 0, rec.costs.length);
    for (let i = 0; i < held; i++) spent += rec.costs[i] ?? 0;
  }
  return { ...profile, talents: { ...t, pointsOverride: t.pointsOverride + spent } };
}

/**
 * `15 → 16` for one profile (B-25): the "Hero Talents" source is restricted to strength and health on the
 * nine keys a talent can touch, so values typed in any other field are deleted (the form no longer shows
 * them, and the battle must stop counting numbers nobody can see). Every other source is untouched.
 */
export function restrictHeroTalentsSource(profile: Record<string, unknown>): Record<string, unknown> {
  const sources = profile.sources;
  if (!isPlainObject(sources) || !Array.isArray(sources.permanent)) return profile;
  const allowed: readonly string[] = HERO_TALENT_KEYS;
  const only = (map: unknown): unknown =>
    isPlainObject(map)
      ? Object.fromEntries(Object.entries(map).filter(([key]) => allowed.includes(key)))
      : map;
  const permanent = sources.permanent.map((entry) => {
    if (!isPlainObject(entry) || entry.builtin !== 'heroTalents') return entry;
    const { special: _special, ...rest } = entry;
    return { ...rest, health: only(entry.health), strength: only(entry.strength) };
  });
  return { ...profile, sources: { ...sources, permanent } };
}

/** The switches the arena no longer has (v20): its stand-ins for Monuments and Personal Technologies. */
const ARENA_V20_DROPPED = ['customization', 'armyModernization', 'monstersBoost'];

/**
 * `19 → 20` for one profile: the permanent sources gain empty Monuments and Personal Technologies rows (real,
 * typed sources the arena counts), and the arena's switches for Customization, Army Modernization and Monsters
 * Boost, which stood in for them, are dropped. A row already present is kept as typed.
 */
export function addArenaSources(profile: Record<string, unknown>): Record<string, unknown> {
  let next = profile;
  const sources = profile.sources;
  if (isPlainObject(sources) && Array.isArray(sources.permanent)) {
    const have = new Set(sources.permanent.map((row) => (isPlainObject(row) ? row.builtin : undefined)));
    const add = (builtin: string, name: string) =>
      have.has(builtin) ? [] : [{ id: builtin, name, builtin, health: {}, strength: {} }];
    const permanent = [
      ...sources.permanent,
      ...add('monuments', 'Monuments'),
      ...add('personalTechnologies', 'Personal Technologies'),
    ];
    next = { ...next, sources: { ...sources, permanent } };
  }
  const arena = next.primeArena;
  if (isPlainObject(arena) && isPlainObject(arena.toggles)) {
    const toggles = Object.fromEntries(
      Object.entries(arena.toggles).filter(([key]) => !ARENA_V20_DROPPED.includes(key)),
    );
    next = { ...next, primeArena: { ...arena, toggles } };
  }
  return next;
}

/** `20 → 21` for one profile: the arena plays the attacker with the planner's default stack cap, as it always did. */
export function addArenaRole(profile: Record<string, unknown>): Record<string, unknown> {
  const arena = profile.primeArena;
  if (!isPlainObject(arena)) return profile;
  return { ...profile, primeArena: { role: 'attacker', maxStacks: 8, ...arena } };
}

/**
 * `21 → 22` for one profile: the arena stops keeping troops of its own. Its Guardsmen level is the account's
 * (`profile.troops`, the calculator's), so the saved copy goes; whatever level it held is not carried over, the
 * account's is what the pool follows now.
 */
export function dropArenaTroops(profile: Record<string, unknown>): Record<string, unknown> {
  const arena = profile.primeArena;
  if (!isPlainObject(arena) || !('troops' in arena)) return profile;
  const { troops: _troops, ...rest } = arena;
  return { ...profile, primeArena: rest };
}

function migrateProfiles(doc: Record<string, unknown>, step: Migration): unknown {
  if (!Array.isArray(doc.profiles)) return doc.profiles;
  return doc.profiles.map((profile) => (isPlainObject(profile) ? step(profile) : profile));
}

/**
 * Root-document migrations. Each entry needs a fixture test in `migrations.test.ts`.
 * `0 → 1`: documents written by the pre-release build carried no `schemaVersion`.
 * `1 → 2`: march exclusions move from `profile.troops` to `BattleSetup.excludedUnitIds`.
 * `2 → 3`: the setup's `pinnedUnitIds` and `excludedUnitIds` are dropped (S-53).
 * `3 → 4`: the `complete` method becomes `plan` and the setup's `campaign` is dropped (S-56).
 * `4 → 5`: the unexplained remainder is dropped, both what was typed and whether it counted.
 * `5 → 6`: a selective recovery is chosen in families, so the count of top types is dropped.
 * `6 → 7`: every profile gains an empty list of user-entered upgrades (W17 C2).
 * `7 → 8`: every setup gains an unspecified march type, so no captain restriction applies (W17 C5-0).
 * `8 → 9`: every profile gains its settings at the defaults (the pool line opens on neither pool).
 * `9 → 10`: a piece of equipment loses its wearer name and may carry a set (B-19).
 * `10 → 11`: every profile gains an empty hero talent plan (B-21).
 * `11 → 12`: the talents' single goal becomes rank 1 of an ordered list, with ignore, strength and mode (B-22).
 * `12 → 13`: the talents gain the crypt types that count, all three (B-23).
 * `13 → 14`: the talents gain the troop-group overrides, none (B-23).
 * `14 → 15`: the typed talent points become the whole stock, which held ranks spend (B-23).
 * `15 → 16`: the Hero Talents source keeps only strength and health on the nine talent keys (B-25).
 */
export const migrations: MigrationTable = {
  0: (doc) => ({ ...doc, schemaVersion: 1 }),
  1: (doc) => ({ ...doc, schemaVersion: 2, profiles: migrateProfiles(doc, splitTroopExclusions) }),
  2: (doc) => ({ ...doc, schemaVersion: 3, profiles: migrateProfiles(doc, dropSetupUnitLists) }),
  3: (doc) => ({ ...doc, schemaVersion: 4, profiles: migrateProfiles(doc, dropCompleteMethod) }),
  4: (doc) => ({ ...doc, schemaVersion: 5, profiles: migrateProfiles(doc, dropUnexplainedRemainder) }),
  5: (doc) => ({ ...doc, schemaVersion: 6, profiles: migrateProfiles(doc, dropSelectiveTop) }),
  6: (doc) => ({ ...doc, schemaVersion: 7, profiles: migrateProfiles(doc, addUpgradeList) }),
  7: (doc) => ({ ...doc, schemaVersion: 8, profiles: migrateProfiles(doc, addMarchType) }),
  8: (doc) => ({ ...doc, schemaVersion: 9, profiles: migrateProfiles(doc, addSettings) }),
  9: (doc) => ({ ...doc, schemaVersion: 10, profiles: migrateProfiles(doc, dropEquipmentWearer) }),
  10: (doc) => ({ ...doc, schemaVersion: 11, profiles: migrateProfiles(doc, addTalents) }),
  11: (doc) => ({ ...doc, schemaVersion: 12, profiles: migrateProfiles(doc, prioritiseTalentGoals) }),
  12: (doc) => ({ ...doc, schemaVersion: 13, profiles: migrateProfiles(doc, addTalentCrypts) }),
  13: (doc) => ({ ...doc, schemaVersion: 14, profiles: migrateProfiles(doc, addTalentGroupOverrides) }),
  14: (doc) => ({ ...doc, schemaVersion: 15, profiles: migrateProfiles(doc, pointsBecomeStock) }),
  15: (doc) => ({ ...doc, schemaVersion: 16, profiles: migrateProfiles(doc, restrictHeroTalentsSource) }),
  16: (doc) => ({ ...doc, schemaVersion: 17, profiles: migrateProfiles(doc, addPrimeArena) }),
  17: (doc) => ({ ...doc, schemaVersion: 18, profiles: migrateProfiles(doc, arenaBecomesSetup) }),
  18: (doc) => ({ ...doc, schemaVersion: 19, profiles: migrateProfiles(doc, arenaDivisionBecomesTroops) }),
  19: (doc) => ({ ...doc, schemaVersion: 20, profiles: migrateProfiles(doc, addArenaSources) }),
  20: (doc) => ({ ...doc, schemaVersion: 21, profiles: migrateProfiles(doc, addArenaRole) }),
  21: (doc) => ({ ...doc, schemaVersion: 22, profiles: migrateProfiles(doc, dropArenaTroops) }),
};

/**
 * Per-file migrations for exported / shared profiles and stacks. They share the version line of the root
 * document, so a payload written at version `n` is upgraded with `table[n] … table[SCHEMA_VERSION - 1]`.
 * `0 → 1` is the identity here: the pre-release change was the root-level `schemaVersion` field only.
 * A saved stack is a frozen snapshot of a run that already happened, so nothing moves into it at
 * `1 → 2` or `2 → 3`: its setup gains, then loses, fields the schema alone decides about.
 */
const identity: Migration = (doc) => doc;
export const profileMigrations: MigrationTable = {
  0: identity,
  1: splitTroopExclusions,
  2: dropSetupUnitLists,
  3: dropCompleteMethod,
  4: dropUnexplainedRemainder,
  5: dropSelectiveTop,
  6: addUpgradeList,
  7: addMarchType,
  8: addSettings,
  9: dropEquipmentWearer,
  10: addTalents,
  11: prioritiseTalentGoals,
  12: addTalentCrypts,
  13: addTalentGroupOverrides,
  14: pointsBecomeStock,
  15: restrictHeroTalentsSource,
  16: addPrimeArena,
  17: arenaBecomesSetup,
  18: arenaDivisionBecomesTroops,
  19: addArenaSources,
  20: addArenaRole,
  21: dropArenaTroops,
};
/**
 * A saved stack carries a *whole setup*, so `3 → 4`, `4 → 5`, `5 → 6` and `7 → 8` reach inside it: the
 * same edits as a profile's, applied to `setup` rather than to every entry of `setups`.
 */
const migrateSavedStackSetup: Migration = (doc) => {
  const setup = doc.setup;
  return isPlainObject(setup) ? { ...doc, setup: withoutCompleteMethod(setup) } : doc;
};
export const savedStackMigrations: MigrationTable = {
  0: identity,
  1: identity,
  2: identity,
  3: migrateSavedStackSetup,
  4: (doc) => ({ ...doc, setup: withoutRemainderFlag(doc.setup) }),
  5: (doc) => ({ ...doc, setup: withoutSelectiveTop(doc.setup) }),
  6: identity,
  7: (doc) => ({ ...doc, setup: withMarchType(doc.setup) }),
  8: identity,
  9: identity,
  10: identity,
  11: identity,
  12: identity,
  13: identity,
  14: identity,
  15: identity,
  16: identity,
  17: identity,
  18: identity,
  19: identity,
  20: identity,
  21: identity,
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** `schemaVersion` of an incoming document; anything without one is treated as the pre-release version 0. */
export function readSchemaVersion(doc: unknown): number {
  if (isPlainObject(doc) && typeof doc.schemaVersion === 'number' && Number.isInteger(doc.schemaVersion)) {
    return doc.schemaVersion;
  }
  return 0;
}

export function applyMigrations(
  doc: unknown,
  fromVersion: number,
  table: MigrationTable,
  label: string,
): Record<string, unknown> {
  if (!isPlainObject(doc)) throw new Error(`${label}: expected an object, got ${typeof doc}`);
  if (fromVersion > SCHEMA_VERSION) {
    throw new Error(
      `${label}: schemaVersion ${fromVersion} was written by a newer version of the app ` +
        `(this build understands up to ${SCHEMA_VERSION}).`,
    );
  }
  let current: Record<string, unknown> = doc;
  for (let version = fromVersion; version < SCHEMA_VERSION; version += 1) {
    const step = table[version];
    if (!step) throw new Error(`${label}: no migration from schemaVersion ${version} to ${version + 1}`);
    current = step(current);
  }
  return current;
}

/** Paths present in the input but dropped by the schema, e.g. `profiles[0].sources.legacyThing`. */
function collectDropped(input: unknown, output: unknown, path: string, found: string[]): void {
  if (Array.isArray(input) && Array.isArray(output)) {
    const length = Math.min(input.length, output.length);
    for (let i = 0; i < length; i += 1) collectDropped(input[i], output[i], `${path}[${i}]`, found);
    return;
  }
  if (!isPlainObject(input) || !isPlainObject(output)) return;
  for (const key of Object.keys(input)) {
    const child = path ? `${path}.${key}` : key;
    if (!(key in output)) {
      found.push(child);
      continue;
    }
    collectDropped(input[key], output[key], child, found);
  }
}

function warnDropped(input: unknown, output: unknown, label: string): void {
  const dropped: string[] = [];
  collectDropped(input, output, '', dropped);
  if (dropped.length > 0) {
    console.warn(`[pyrrhic] ${label}: dropped ${dropped.length} unknown field(s): ${dropped.join(', ')}`);
  }
}

/** Migrate + validate a root document. Throws on anything the current schema cannot accept. */
export function migrate(doc: unknown): RootDocument {
  const migrated = applyMigrations(doc, readSchemaVersion(doc), migrations, 'root document');
  const parsed = rootDocumentSchema.parse({ ...migrated, schemaVersion: SCHEMA_VERSION });
  warnDropped(migrated, parsed, 'root document');
  return parsed;
}

/** Migrate + validate one exported/shared profile payload. */
export function migrateProfile(payload: unknown, fromVersion: number): Profile {
  const migrated = applyMigrations(payload, fromVersion, profileMigrations, 'profile');
  const parsed = profileSchema.parse(migrated);
  warnDropped(migrated, parsed, 'profile');
  return parsed;
}

/** Migrate + validate one exported/shared saved stack payload. */
export function migrateSavedStack(payload: unknown, fromVersion: number): SavedStack {
  const migrated = applyMigrations(payload, fromVersion, savedStackMigrations, 'saved stack');
  const parsed = savedStackSchema.parse(migrated);
  warnDropped(migrated, parsed, 'saved stack');
  return parsed;
}
