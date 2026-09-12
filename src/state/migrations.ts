/**
 * Versioned migrations (ADR-0004). `schemaVersion` is an integer; `migrations[n]` upgrades a document
 * from version `n` to `n + 1` and they are applied in order on load, on import and on share-link decode.
 * The zod schema in `schema.ts` is the source of truth for the *current* version, so a migration only has
 * to produce something the current schema accepts.
 *
 * Unknown fields are never a crash: zod strips them and we log one console warning naming the paths.
 */
import { profileSchema, rootDocumentSchema, savedStackSchema, SCHEMA_VERSION } from './schema';
import type { Profile, RootDocument, SavedStack } from './schema';

export type Migration = (doc: Record<string, unknown>) => Record<string, unknown>;
export type MigrationTable = Record<number, Migration>;

/**
 * Root-document migrations. Each entry needs a fixture test in `migrations.test.ts`.
 * `0 → 1`: documents written by the pre-release build carried no `schemaVersion`.
 */
export const migrations: MigrationTable = {
  0: (doc) => ({ ...doc, schemaVersion: 1 }),
};

/**
 * Per-file migrations for exported / shared profiles and stacks. They share the version line of the root
 * document, so a payload written at version `n` is upgraded with `table[n] … table[SCHEMA_VERSION - 1]`.
 * `0 → 1` is the identity here: the pre-release change was the root-level `schemaVersion` field only.
 */
const identity: Migration = (doc) => doc;
export const profileMigrations: MigrationTable = { 0: identity };
export const savedStackMigrations: MigrationTable = { 0: identity };

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
