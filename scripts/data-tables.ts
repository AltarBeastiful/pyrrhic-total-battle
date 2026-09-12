/**
 * Shared plumbing for `data-format.ts` and `data-check.ts`.
 *
 * One canonical form for every file in `src/data/tables/`: records sorted by id (naturally, so
 * `archer-2` comes before `archer-10`), a fixed key order inside each record, bonus maps in the order
 * the keys are declared in `src/data/types.ts`, and the whole file finally run through Prettier so
 * `pnpm format:check` and `pnpm data:check` can never disagree. A data pull request then shows only
 * the values that actually changed.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { format as prettierFormat, resolveConfig, type Options } from 'prettier';

import { TABLE_FILES, validateTable, type TableFile } from '../src/data/schema.ts';
import { BONUS_KEYS, CATEGORIES, QUALITIES, SPECIAL_KEYS, STRENGTH_AGAINST_KEYS } from '../src/data/types.ts';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const TABLES_DIR = path.join(REPO_ROOT, 'src', 'data', 'tables');
export { TABLE_FILES, type TableFile };

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

const isObject = (value: Json): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Reorders the keys of an object; anything unexpected is kept (sorted, last) so the schema can report it. */
function order(value: Json, keys: readonly string[]): Json {
  if (!isObject(value)) return value;
  const out: JsonObject = {};
  for (const key of keys) if (key in value) out[key] = value[key] as Json;
  for (const key of Object.keys(value).sort()) if (!(key in out)) out[key] = value[key] as Json;
  return out;
}

/** Sorts a `{ "3": 1.08 }` style table by the numeric value of its keys. */
function byNumericKey(value: Json): Json {
  if (!isObject(value)) return value;
  const out: JsonObject = {};
  for (const key of Object.keys(value).sort((a, b) => Number(a) - Number(b) || a.localeCompare(b))) {
    out[key] = value[key] as Json;
  }
  return out;
}

const CONTRIBUTION_KEYS = ['health', 'strength', 'special', 'matchup'] as const;

function contribution(value: Json): Json {
  if (!isObject(value)) return value;
  const out = order(value, CONTRIBUTION_KEYS) as JsonObject;
  if ('health' in out) out.health = order(out.health as Json, BONUS_KEYS);
  if ('strength' in out) out.strength = order(out.strength as Json, BONUS_KEYS);
  if ('special' in out) out.special = order(out.special as Json, SPECIAL_KEYS);
  if (Array.isArray(out.matchup)) {
    out.matchup = out.matchup.map((entry) => order(entry, ['attacker', 'target', 'value']));
  }
  return out;
}

function levels(value: Json): Json {
  if (!isObject(value)) return value;
  const out = order(value, ['base', 'star']) as JsonObject;
  if ('base' in out) out.base = byNumericKey(out.base as Json);
  if ('star' in out) out.star = byNumericKey(out.star as Json);
  return out;
}

function progression(value: Json, keys: readonly string[] = ['key', 'levels']): Json {
  if (!isObject(value)) return value;
  const out = order(value, keys) as JsonObject;
  if ('levels' in out) out.levels = levels(out.levels as Json);
  return out;
}

function unit(value: Json, keys: readonly string[]): Json {
  if (!isObject(value)) return value;
  const out = order(value, keys) as JsonObject;
  if ('strengthAgainst' in out)
    out.strengthAgainst = order(out.strengthAgainst as Json, STRENGTH_AGAINST_KEYS);
  if ('revival' in out) out.revival = order(out.revival as Json, ['gold']);
  if ('training' in out) out.training = order(out.training as Json, ['seconds', 'silver', 'dragonCoins']);
  return out;
}

const TROOP_KEYS = [
  'id',
  'name',
  'label',
  'group',
  'tier',
  'category',
  'race',
  'cost',
  'health',
  'strength',
  'strengthAgainst',
  'doubleDamageChance',
  'revival',
  'training',
] as const;

const MONSTER_KEYS = TROOP_KEYS.filter((key) => key !== 'group');
const MERCENARY_KEYS = [
  'id',
  'name',
  'label',
  'tier',
  'tags',
  'cost',
  'health',
  'strength',
  'strengthAgainst',
  'doubleDamageChance',
  'revival',
  'event',
] as const;

/** Record-level canonical form, per table file. */
const SHAPES: Record<TableFile, (value: Json) => Json> = {
  'troops.json': (value) => unit(value, TROOP_KEYS),
  'monsters.json': (value) => unit(value, MONSTER_KEYS),
  'mercenaries.json': (value) => unit(value, MERCENARY_KEYS),
  'captains.json': (value) => {
    const out = order(value, ['id', 'name', 'health', 'strength', 'special', 'note']) as JsonObject;
    for (const key of ['health', 'strength', 'special'] as const) {
      if (key in out) out[key] = order(out[key] as Json, ['key', 'perLevel', 'stars']);
    }
    return out;
  },
  'equipment.json': (value) => {
    const out = order(value, ['id', 'name', 'byQuality']) as JsonObject;
    const byQuality = order(out.byQuality as Json, QUALITIES) as JsonObject;
    for (const quality of Object.keys(byQuality))
      byQuality[quality] = contribution(byQuality[quality] as Json);
    out.byQuality = byQuality;
    return out;
  },
  'artifacts.json': (value) => {
    const out = order(value, [
      'id',
      'name',
      'health',
      'strength',
      'special',
      'randomBonusOptions',
    ]) as JsonObject;
    for (const key of ['health', 'strength', 'special'] as const) {
      if (key in out) out[key] = progression(out[key] as Json);
    }
    return out;
  },
  'titles.json': (value) => {
    const out = order(value, ['id', 'name', 'bonus']) as JsonObject;
    out.bonus = contribution(out.bonus as Json);
    return out;
  },
  'heroes.json': (value) => {
    const out = order(value, ['id', 'name', 'bonus', 'aloneOnly']) as JsonObject;
    out.bonus = contribution(out.bonus as Json);
    return out;
  },
  'otherPills.json': (value) => {
    const out = order(value, ['id', 'name', 'bonus']) as JsonObject;
    out.bonus = contribution(out.bonus as Json);
    return out;
  },
  'events.json': (value) => {
    const out = order(value, [
      'id',
      'name',
      'strength',
      'enemyFormation',
      'activatesStrengthAgainst',
    ]) as JsonObject;
    if ('enemyFormation' in out) out.enemyFormation = order(out.enemyFormation as Json, CATEGORIES);
    return out;
  },
  'vip.json': (value) => {
    const out = order(value, ['level', 'bonus']) as JsonObject;
    out.bonus = contribution(out.bonus as Json);
    return out;
  },
  'temple.json': (value) => {
    const out = order(value, ['multiplier']) as JsonObject;
    out.multiplier = byNumericKey(out.multiplier as Json);
    return out;
  },
  'orders.json': (value) => order(value, ['troops', 'monsters', 'captains']),
  'version.json': (value) => order(value, ['dataVersion', 'verifiedOn', 'notes']),
};

/** `archer-2` before `archer-10`: digits compare as numbers, everything else as text. */
export function naturalCompare(a: string, b: string): number {
  const chunks = (value: string) => value.match(/\d+|\D+/g) ?? [];
  const left = chunks(a);
  const right = chunks(b);
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const x = left[i];
    const y = right[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const bothNumeric = /^\d/.test(x) && /^\d/.test(y);
    const diff = bothNumeric ? Number(x) - Number(y) : x < y ? -1 : x > y ? 1 : 0;
    if (diff !== 0) return diff;
  }
  return 0;
}

function sortRows(file: TableFile, rows: Json[]): Json[] {
  if (file === 'vip.json') {
    return [...rows].sort((a, b) => Number((a as JsonObject).level) - Number((b as JsonObject).level));
  }
  return [...rows].sort((a, b) => naturalCompare(String((a as JsonObject).id), String((b as JsonObject).id)));
}

/** The canonical structure of one table: rows sorted, keys ordered. */
export function canonicalValue(file: TableFile, value: Json): Json {
  const shape = SHAPES[file];
  return Array.isArray(value) ? sortRows(file, value).map(shape) : shape(value);
}

let prettierOptions: Promise<Options | null> | undefined;

/** The canonical text of one table: canonical structure, then the repository's own Prettier settings. */
export async function canonicalText(file: TableFile, value: Json): Promise<string> {
  const filepath = path.join(TABLES_DIR, file);
  prettierOptions ??= resolveConfig(filepath);
  const options = (await prettierOptions) ?? {};
  return prettierFormat(`${JSON.stringify(canonicalValue(file, value), null, 2)}\n`, {
    ...options,
    filepath,
  });
}

export interface TableReport {
  file: TableFile;
  /** Text as it is on disk. */
  text: string;
  /** Text as it should be. */
  canonical: string;
  /** Schema problems, one readable line each. */
  issues: string[];
}

/** Reads, validates and canonicalises one table. A file that is not valid JSON reports as one issue. */
export async function inspectTable(file: TableFile): Promise<TableReport> {
  const text = await readFile(path.join(TABLES_DIR, file), 'utf8');
  let value: Json;
  try {
    value = JSON.parse(text) as Json;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { file, text, canonical: text, issues: [`${file}: not valid JSON: ${message}`] };
  }
  return { file, text, canonical: await canonicalText(file, value), issues: validateTable(file, value) };
}

export async function inspectAllTables(): Promise<TableReport[]> {
  return Promise.all(TABLE_FILES.map(inspectTable));
}
