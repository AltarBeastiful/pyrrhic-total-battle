/**
 * Versioned migrations (ADR-0004). `schemaVersion` is an integer; `migrations[n]` upgrades a document
 * from version `n` to `n + 1` and they are applied in order on load, on import and on share-link decode.
 * The zod schema in `schema.ts` is the source of truth for the *current* version, so a migration only has
 * to produce something the current schema accepts.
 *
 * Unknown fields are never a crash: zod strips them and we log one console warning naming the paths.
 */
import { unitById } from '../data';
import { profileSchema, rootDocumentSchema, savedStackSchema, SCHEMA_VERSION } from './schema';
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
 */
export const migrations: MigrationTable = {
  0: (doc) => ({ ...doc, schemaVersion: 1 }),
  1: (doc) => ({ ...doc, schemaVersion: 2, profiles: migrateProfiles(doc, splitTroopExclusions) }),
  2: (doc) => ({ ...doc, schemaVersion: 3, profiles: migrateProfiles(doc, dropSetupUnitLists) }),
  3: (doc) => ({ ...doc, schemaVersion: 4, profiles: migrateProfiles(doc, dropCompleteMethod) }),
  4: (doc) => ({ ...doc, schemaVersion: 5, profiles: migrateProfiles(doc, dropUnexplainedRemainder) }),
  5: (doc) => ({ ...doc, schemaVersion: 6, profiles: migrateProfiles(doc, dropSelectiveTop) }),
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
};
/**
 * A saved stack carries a *whole setup*, so `3 → 4`, `4 → 5` and `5 → 6` reach inside it: the same
 * edits as a profile's, applied to `setup` rather than to every entry of `setups`.
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
