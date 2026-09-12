#!/usr/bin/env node
/**
 * Manual TotalStack data-drift check (story S-05, local form only — see
 * `docs/decisions/0001-totalstack-drift-check.md`: nothing here downloads anything).
 *
 *   pnpm data:compare -- <path-to-index-*.js> [more chunks...]
 *   pnpm data:compare -- --selftest
 *
 * A contributor downloads TotalStack's public bundle in a browser, points this script at the files,
 * and pastes the Markdown report it prints into the pull request. Exit code 1 means "they differ from
 * `src/data/tables`" (or a table could not be found), 0 means "identical".
 *
 * Three rules keep the tool honest:
 *   1. It never evaluates the bundle. A tokenizer turns one minified object/array literal into data
 *      (`jsLiteralToJson`), and anything it cannot read is an error rather than a silent value.
 *   2. It never looks a table up by its minified variable name — those change on every build. Tables are
 *      located by content (the array that contains `id:"archer-1"`, the object with `bonusesByQuality`…).
 *   3. It reshapes their records into *our* record shape (`src/data/types.ts`) before diffing, so the
 *      report speaks in our field names and a pure naming difference never shows up as drift.
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import { CATEGORIES, GROUPS, RACES } from '../../src/data/types.ts';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const TABLES_DIR = path.join(REPO_ROOT, 'src', 'data', 'tables');

export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
export type JsonObject = { [key: string]: Json };

const isObject = (value: Json | undefined): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

// ---- 1. The no-eval tokenizer -----------------------------------------------------------------
//
// Port of the `jsconv.py` prototype. It reads one JavaScript object/array literal and returns plain
// data. Conventions for the things JSON has no room for, kept from the prototype so the two agree:
//   bare identifier  `x`      -> "$ref:x"      (a table defined elsewhere in the bundle)
//   spread           `...x`   -> "$spread:x"
//   call             `f(a,b)` -> "$call:f(a,b)"
// Booleans are usually minified to `!0` / `!1`; keys may be bare, quoted or numeric; strings may use
// any of the three quote characters. An arrow function means we are not looking at data: we throw.

const IDENT_START = /[A-Za-z_$]/;
const IDENT_PART = /[A-Za-z0-9_$]/;
const NUMBER = /^-?(?:0[xX][0-9a-fA-F]+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/;

class LiteralReader {
  private index = 0;
  private readonly source: string;

  constructor(source: string) {
    this.source = source;
  }

  private fail(message: string): never {
    const around = this.source.slice(Math.max(0, this.index - 40), this.index + 40);
    throw new Error(`${message} at ${this.index}: …${around}…`);
  }

  private peek(offset = 0): string {
    return this.source[this.index + offset] ?? '';
  }

  skipSpace(): void {
    while (this.index < this.source.length) {
      const c = this.peek();
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f' || c === '\v') this.index += 1;
      else if (c === '/' && this.peek(1) === '/') {
        const end = this.source.indexOf('\n', this.index);
        this.index = end === -1 ? this.source.length : end + 1;
      } else if (c === '/' && this.peek(1) === '*') {
        const end = this.source.indexOf('*/', this.index);
        this.index = end === -1 ? this.source.length : end + 2;
      } else break;
    }
  }

  atEnd(): boolean {
    this.skipSpace();
    return this.index >= this.source.length;
  }

  private expect(char: string): void {
    this.skipSpace();
    if (this.peek() !== char) this.fail(`expected ${char}`);
    this.index += 1;
  }

  /** Reads a quoted string (any of the three quote characters) and decodes its escapes. */
  private readString(): string {
    const quote = this.peek();
    this.index += 1;
    let out = '';
    while (this.index < this.source.length) {
      const c = this.peek();
      if (c === quote) {
        this.index += 1;
        return out;
      }
      if (c === '\\') {
        this.index += 1;
        out += this.readEscape();
        continue;
      }
      if (quote === '`' && c === '$' && this.peek(1) === '{') this.fail('template substitution');
      out += c;
      this.index += 1;
    }
    return this.fail('unterminated string');
  }

  private readEscape(): string {
    const c = this.peek();
    this.index += 1;
    switch (c) {
      case 'n':
        return '\n';
      case 't':
        return '\t';
      case 'r':
        return '\r';
      case 'b':
        return '\b';
      case 'f':
        return '\f';
      case 'v':
        return '\v';
      case '0':
        return '\0';
      case 'x': {
        const hex = this.source.slice(this.index, this.index + 2);
        this.index += 2;
        return String.fromCodePoint(Number.parseInt(hex, 16));
      }
      case 'u': {
        if (this.peek() === '{') {
          const end = this.source.indexOf('}', this.index);
          if (end === -1) this.fail('unterminated \\u{…}');
          const hex = this.source.slice(this.index + 1, end);
          this.index = end + 1;
          return String.fromCodePoint(Number.parseInt(hex, 16));
        }
        const hex = this.source.slice(this.index, this.index + 4);
        this.index += 4;
        return String.fromCodePoint(Number.parseInt(hex, 16));
      }
      case '\n':
        return ''; // line continuation
      default:
        return c;
    }
  }

  private readIdent(): string {
    const start = this.index;
    while (this.index < this.source.length && IDENT_PART.test(this.peek())) this.index += 1;
    return this.source.slice(start, this.index);
  }

  /** Object keys keep the text they are written with: `{0.1:48}` is the key "0.1", not "0.1" rounded. */
  private readKey(): string {
    this.skipSpace();
    const c = this.peek();
    if (c === '"' || c === "'" || c === '`') return this.readString();
    const number = NUMBER.exec(this.source.slice(this.index));
    if (number && !IDENT_START.test(c)) {
      this.index += number[0].length;
      return number[0];
    }
    if (IDENT_START.test(c)) return this.readIdent();
    return this.fail('expected a key');
  }

  parseValue(): Json {
    this.skipSpace();
    const c = this.peek();
    if (c === '[') return this.parseArray();
    if (c === '{') return this.parseObject();
    if (c === '"' || c === "'" || c === '`') return this.readString();
    if (c === '!' && (this.peek(1) === '0' || this.peek(1) === '1')) {
      const value = this.peek(1) === '0';
      this.index += 2;
      return value;
    }
    if (c === '.' && this.peek(1) === '.' && this.peek(2) === '.') {
      this.index += 3;
      this.skipSpace();
      return `$spread:${this.readIdent()}`;
    }
    const number = NUMBER.exec(this.source.slice(this.index));
    if (number && (c === '-' || c === '.' || (c >= '0' && c <= '9'))) {
      this.index += number[0].length;
      return Number(number[0]);
    }
    if (IDENT_START.test(c)) return this.parseIdentValue();
    return this.fail(`unexpected character ${JSON.stringify(c)}`);
  }

  private parseIdentValue(): Json {
    const start = this.index;
    const name = this.readIdent();
    if (name === 'true') return true;
    if (name === 'false') return false;
    if (name === 'null') return null;
    if (name === 'undefined') return null;
    this.skipSpace();
    if (this.peek() === '=' && this.peek(1) === '>') this.fail('arrow function');
    if (this.peek() === '(') {
      let depth = 0;
      while (this.index < this.source.length) {
        const c = this.peek();
        if (c === '(') depth += 1;
        else if (c === ')') {
          depth -= 1;
          if (depth === 0) {
            this.index += 1;
            break;
          }
        } else if (c === '"' || c === "'" || c === '`') {
          this.readString();
          continue;
        }
        this.index += 1;
      }
      return `$call:${this.source.slice(start, this.index)}`;
    }
    return `$ref:${name}`;
  }

  private parseArray(): Json[] {
    this.expect('[');
    const out: Json[] = [];
    for (;;) {
      this.skipSpace();
      if (this.peek() === ']') {
        this.index += 1;
        return out;
      }
      if (this.peek() === ',') {
        // A hole (`[1,,2]`) is not data we would ever read; keep the slot so indexes stay right.
        this.index += 1;
        out.push(null);
        continue;
      }
      out.push(this.parseValue());
      this.skipSpace();
      if (this.peek() === ',') this.index += 1;
      else if (this.peek() !== ']') this.fail('expected , or ]');
    }
  }

  private parseObject(): JsonObject {
    this.expect('{');
    const out: JsonObject = {};
    for (;;) {
      this.skipSpace();
      if (this.peek() === '}') {
        this.index += 1;
        return out;
      }
      if (this.peek() === '.' && this.peek(1) === '.' && this.peek(2) === '.') {
        this.index += 3;
        this.skipSpace();
        out[`$spread:${this.readIdent()}`] = true;
      } else {
        const key = this.readKey();
        this.expect(':');
        out[key] = this.parseValue();
      }
      this.skipSpace();
      if (this.peek() === ',') this.index += 1;
      else if (this.peek() !== '}') this.fail('expected , or }');
    }
  }
}

/** Reads one minified JavaScript object/array literal without evaluating it. Throws on anything else. */
export function jsLiteralToJson(literal: string): Json {
  const reader = new LiteralReader(literal);
  const value = reader.parseValue();
  if (!reader.atEnd()) throw new Error('trailing characters after the literal');
  return value;
}

// ---- 2. Finding literals inside a bundle ---------------------------------------------------------

interface Frame {
  open: number;
  close: number;
  char: '[' | '{' | '$';
}

const REGEX_CAN_FOLLOW = new Set([
  '',
  '(',
  ',',
  '=',
  ':',
  '[',
  '!',
  '&',
  '|',
  '?',
  '{',
  '}',
  ';',
  '+',
  '-',
  '*',
  '%',
  '^',
  '~',
  '<',
  '>',
  '\n',
]);
const REGEX_CAN_FOLLOW_WORDS = new Set([
  'return',
  'typeof',
  'instanceof',
  'in',
  'of',
  'new',
  'delete',
  'void',
  'throw',
  'case',
  'do',
  'else',
  'yield',
  'await',
]);

/**
 * One pass over a whole chunk, recording the bracket stack at each requested offset. Strings, template
 * substitutions, comments and regular expressions are skipped so a `]` inside `/[)]/` cannot desynchronise
 * the scan. Frames are shared objects: their `close` is filled in when the scan reaches the closing bracket.
 */
export function bracketStacksAt(source: string, offsets: readonly number[]): Map<number, Frame[]> {
  const wanted = [...offsets].sort((a, b) => a - b);
  const result = new Map<number, Frame[]>();
  const stack: Frame[] = [];
  let cursor = 0;
  let mode: 'code' | 'template' = 'code';
  let lastSignificant = '';
  let lastWord = '';
  let i = 0;

  const capture = (): void => {
    while (cursor < wanted.length && (wanted[cursor] ?? 0) <= i) {
      result.set(wanted[cursor] ?? 0, [...stack]);
      cursor += 1;
    }
  };

  const skipQuoted = (quote: string): void => {
    i += 1;
    while (i < source.length) {
      const c = source[i];
      if (c === '\\') {
        i += 2;
        continue;
      }
      if (c === quote) {
        i += 1;
        return;
      }
      i += 1;
    }
  };

  while (i < source.length) {
    capture();
    const c = source[i] ?? '';
    if (mode === 'template') {
      if (c === '\\') i += 2;
      else if (c === '`') {
        mode = 'code';
        i += 1;
      } else if (c === '$' && source[i + 1] === '{') {
        stack.push({ open: i, close: -1, char: '$' });
        mode = 'code';
        i += 2;
      } else i += 1;
      continue;
    }
    if (c === '"' || c === "'") {
      skipQuoted(c);
      lastSignificant = c;
      lastWord = '';
      continue;
    }
    if (c === '`') {
      mode = 'template';
      i += 1;
      continue;
    }
    if (c === '/' && source[i + 1] === '/') {
      const end = source.indexOf('\n', i);
      i = end === -1 ? source.length : end;
      continue;
    }
    if (c === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i);
      i = end === -1 ? source.length : end + 2;
      continue;
    }
    if (c === '/' && (REGEX_CAN_FOLLOW.has(lastSignificant) || REGEX_CAN_FOLLOW_WORDS.has(lastWord))) {
      i += 1;
      let inClass = false;
      while (i < source.length) {
        const r = source[i];
        if (r === '\\') {
          i += 2;
          continue;
        }
        if (r === '[') inClass = true;
        else if (r === ']') inClass = false;
        else if (r === '/' && !inClass) {
          i += 1;
          break;
        } else if (r === '\n') break;
        i += 1;
      }
      while (i < source.length && IDENT_PART.test(source[i] ?? '')) i += 1;
      lastSignificant = '/';
      lastWord = '';
      continue;
    }
    if (c === '[' || c === '{') {
      stack.push({ open: i, close: -1, char: c });
    } else if (c === ']' || c === '}') {
      const frame = stack.pop();
      if (frame) {
        frame.close = i;
        if (frame.char === '$') mode = 'template';
      }
    }
    if (!/\s/.test(c)) {
      lastSignificant = c;
      lastWord = IDENT_PART.test(c) ? lastWord + c : '';
    } else if (c === '\n') {
      lastSignificant = '\n';
      lastWord = '';
    }
    i += 1;
  }
  i = source.length;
  capture();
  return result;
}

export interface Chunk {
  name: string;
  text: string;
}

const quoted = (value: string): string => {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return `(?:"${escaped}"|'${escaped}'|\`${escaped}\`)`;
};

/** `id:"archer-1"`, however the minifier chose to quote the key. */
export const keyValueMarker = (key: string, value: string): RegExp =>
  new RegExp(`(?:${quoted(key)}|\\b${key})\\s*:\\s*${quoted(value)}`, 'g');

/** `bonusesByQuality:` — a key we recognise the table by, whatever its value. */
export const keyMarker = (key: string): RegExp => new RegExp(`(?:${quoted(key)}|\\b${key})\\s*:`, 'g');

interface Candidate {
  chunk: string;
  literal: string;
  value: Json;
}

/**
 * Every literal of the requested kind that encloses one of the marker's matches, innermost first,
 * across all chunks. Callers pick the first one whose *content* is the table they were looking for;
 * a marker that happens to sit inside a string or a function body simply yields nothing parseable.
 */
function candidates(chunks: readonly Chunk[], marker: RegExp, kind: '[' | '{'): Candidate[] {
  const out: Candidate[] = [];
  const seen = new Set<string>();
  for (const chunk of chunks) {
    marker.lastIndex = 0;
    const offsets: number[] = [];
    for (let match = marker.exec(chunk.text); match; match = marker.exec(chunk.text)) {
      offsets.push(match.index);
      if (offsets.length > 200) break;
    }
    if (offsets.length === 0) continue;
    const stacks = bracketStacksAt(chunk.text, offsets);
    for (const offset of offsets) {
      const stack = stacks.get(offset) ?? [];
      for (let depth = stack.length - 1; depth >= 0; depth -= 1) {
        const frame = stack[depth];
        if (!frame || frame.char !== kind || frame.close < 0) continue;
        const key = `${chunk.name}:${frame.open}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const literal = chunk.text.slice(frame.open, frame.close + 1);
        try {
          out.push({ chunk: chunk.name, literal, value: jsLiteralToJson(literal) });
        } catch {
          // Not a data literal (a function body, a string that merely looks like one): try the next.
        }
      }
    }
  }
  return out;
}

/** Follows a `"$ref:name"` to the literal assigned to `name` in one of the chunks. */
function resolveRef(chunks: readonly Chunk[], name: string): Json | undefined {
  const marker = new RegExp(`(?<![\\w$.])${name}\\s*=\\s*(?:Object\\.freeze\\()?[[{]`, 'g');
  for (const chunk of chunks) {
    marker.lastIndex = 0;
    const offsets: number[] = [];
    for (let match = marker.exec(chunk.text); match; match = marker.exec(chunk.text)) {
      offsets.push(match.index + match[0].length - 1);
      if (offsets.length > 50) break;
    }
    if (offsets.length === 0) continue;
    const stacks = bracketStacksAt(
      chunk.text,
      offsets.map((offset) => offset + 1),
    );
    for (const offset of offsets) {
      const frame = (stacks.get(offset + 1) ?? []).at(-1);
      if (!frame || frame.close < 0 || frame.open !== offset) continue;
      try {
        return jsLiteralToJson(chunk.text.slice(frame.open, frame.close + 1));
      } catch {
        // try the next assignment to that name
      }
    }
  }
  return undefined;
}

// ---- 3. Locating the tables by content ------------------------------------------------------------

export type TableName =
  | 'troops.json'
  | 'monsters.json'
  | 'mercenaries.json'
  | 'captains.json'
  | 'equipment.json'
  | 'artifacts.json'
  | 'titles.json'
  | 'temple.json';

export const COMPARED_TABLES: readonly TableName[] = [
  'troops.json',
  'monsters.json',
  'mercenaries.json',
  'captains.json',
  'equipment.json',
  'artifacts.json',
  'titles.json',
  'temple.json',
];

/** What we compare and how we recognise it in the bundle; no minified variable name appears here. */
const HOW_WE_FIND_IT: Record<TableName, string> = {
  'troops.json': 'the array containing `id:"archer-1"`',
  'monsters.json': 'the array containing `id:"stone-gargoyle"`',
  'mercenaries.json': 'the array containing `id:"cyclops-5"`',
  'captains.json': 'the object keyed by captain names whose values carry `bonusKey`/`starBonuses`',
  'equipment.json': 'the array whose records carry `bonusesByQuality`',
  'artifacts.json': 'the array whose records carry `randomBonusOptions`',
  'titles.json':
    'the array whose records carry `playerOnlyHealthBonuses`, or a title name such as "Battlemaster"',
  'temple.json': 'the object keyed "1".."45" whose values run 1.04 … 5.91',
};

const rows = (value: Json): JsonObject[] | undefined =>
  Array.isArray(value) && value.every(isObject) ? (value as JsonObject[]) : undefined;

function findArray(
  chunks: readonly Chunk[],
  marker: RegExp,
  accept: (records: JsonObject[]) => boolean,
): JsonObject[] | undefined {
  for (const candidate of candidates(chunks, marker, '[')) {
    const records = rows(candidate.value);
    if (records && records.length > 0 && accept(records)) return records;
  }
  return undefined;
}

function findObject(
  chunks: readonly Chunk[],
  marker: RegExp,
  accept: (value: JsonObject) => boolean,
): JsonObject | undefined {
  for (const candidate of candidates(chunks, marker, '{')) {
    if (isObject(candidate.value) && accept(candidate.value)) return candidate.value;
  }
  return undefined;
}

const hasId = (records: JsonObject[], id: string): boolean => records.some((record) => record.id === id);

export interface RawTables {
  troops?: JsonObject[];
  monsters?: JsonObject[];
  mercenaries?: JsonObject[];
  captains?: JsonObject;
  captainOrder?: string[];
  equipment?: JsonObject[];
  artifacts?: JsonObject[];
  titles?: JsonObject[];
  temple?: JsonObject;
}

export function locateTables(chunks: readonly Chunk[]): RawTables {
  const found: RawTables = {};

  const troops = findArray(
    chunks,
    keyValueMarker('id', 'archer-1'),
    (records) => hasId(records, 'archer-1') && records.every((record) => 'leadershipCost' in record),
  );
  if (troops) found.troops = troops;

  const monsters = findArray(
    chunks,
    keyValueMarker('id', 'stone-gargoyle'),
    (records) => hasId(records, 'stone-gargoyle') && records.every((record) => 'dominanceCost' in record),
  );
  if (monsters) found.monsters = monsters;

  const mercenaries = findArray(
    chunks,
    keyValueMarker('id', 'cyclops-5'),
    (records) => hasId(records, 'cyclops-5') && records.every((record) => 'authorityCost' in record),
  );
  if (mercenaries) found.mercenaries = mercenaries;

  const captains = findObject(chunks, keyMarker('starBonuses'), (value) => {
    const entries = Object.values(value);
    return (
      entries.length >= 5 &&
      entries.every((entry) => entry === null || (isObject(entry) && 'bonusKey' in entry)) &&
      entries.filter((entry) => isObject(entry) && 'starBonuses' in entry).length >= 5
    );
  });
  if (captains) {
    found.captains = captains;
    // The picker order also lists the captains whose numbers TotalStack does not have; our table keeps
    // them (name only), so we read it to avoid reporting them as removed. Located by content too: the
    // array of strings that holds several of the captain names we just found.
    const names = Object.keys(captains);
    const first = names[0];
    if (first !== undefined) {
      for (const candidate of candidates(chunks, new RegExp(quoted(first), 'g'), '[')) {
        const value = candidate.value;
        if (!Array.isArray(value) || !value.every((entry) => typeof entry === 'string')) continue;
        const list = value as string[];
        if (list.filter((entry) => names.includes(entry)).length >= Math.min(3, names.length)) {
          found.captainOrder = list;
          break;
        }
      }
    }
  }

  const equipment = findArray(chunks, keyMarker('bonusesByQuality'), (records) =>
    records.every((record) => isObject(record.bonusesByQuality)),
  );
  if (equipment) found.equipment = equipment;

  const artifacts = findArray(chunks, keyMarker('randomBonusOptions'), (records) =>
    records.some((record) => Array.isArray(record.randomBonusOptions)),
  );
  if (artifacts) found.artifacts = artifacts;

  // A title is a flat `{ name, healthBonuses, … }`; the equipment pieces carry the same bonus keys one
  // level down, inside `bonusesByQuality`, so the shape check has to rule them out.
  const isTitleTable = (records: JsonObject[]): boolean =>
    records.every(
      (record) =>
        typeof record.name === 'string' &&
        !('bonusesByQuality' in record) &&
        !('randomBonusOptions' in record) &&
        !('id' in record),
    ) &&
    records.some(
      (record) =>
        'healthBonuses' in record || 'strengthBonuses' in record || 'specialStrengthBonuses' in record,
    );
  const titles =
    findArray(chunks, keyMarker('playerOnlyHealthBonuses'), isTitleTable) ??
    findArray(
      chunks,
      keyValueMarker('name', 'Battlemaster'),
      (records) => isTitleTable(records) && records.some((record) => record.name === 'Battlemaster'),
    );
  if (titles) found.titles = titles;

  const temple = findObject(chunks, /(?<![\w.$])1\.04(?![\d])/g, (value) => {
    const keys = Object.keys(value);
    const values = Object.values(value);
    return (
      keys.length >= 20 &&
      keys.every((key) => /^\d+$/.test(key)) &&
      values.every((entry) => typeof entry === 'number') &&
      value['1'] === 1.04
    );
  });
  if (temple) found.temple = temple;

  return found;
}

// ---- 4. Reshaping their records into ours ----------------------------------------------------------
//
// The same mapping `scripts/data-tables.ts` and `docs/data/README.md` describe: `leadershipCost`/
// `dominanceCost`/`authorityCost` → `cost`, `revivalCost` → `revival`, `trainingTime` + `trainingCost` →
// `training`, `pillLabel` → `label` without its space, the trailing unit number written in roman
// numerals, engineers without a category, and every "against players" field dropped (PvP is out of scope).

const ROMAN: readonly [number, string][] = [
  [1000, 'M'],
  [900, 'CM'],
  [500, 'D'],
  [400, 'CD'],
  [100, 'C'],
  [90, 'XC'],
  [50, 'L'],
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

export function toRoman(value: number): string {
  let left = value;
  let out = '';
  for (const [amount, letters] of ROMAN) {
    while (left >= amount) {
      out += letters;
      left -= amount;
    }
  }
  return out;
}

/** "Archer 1" → "Archer I"; a name without a trailing number is left alone. */
export function romanName(name: string): string {
  return name.replace(/ (\d+)$/, (_all, digits: string) => ` ${toRoman(Number(digits))}`);
}

/** "Guardsmen's Courage" → "guardsmens-courage", "Warrior of Ragnarök" → "warrior-of-ragnarok". */
export function slug(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

const num = (value: Json | undefined): number | undefined => (typeof value === 'number' ? value : undefined);
const str = (value: Json | undefined): string | undefined => (typeof value === 'string' ? value : undefined);

function put(target: JsonObject, key: string, value: Json | undefined): void {
  if (value !== undefined) target[key] = value;
}

/** Keeps a bonus map only when it has something in it, and drops the PvP-only keys. */
function bonusMap(value: Json | undefined): JsonObject | undefined {
  if (!isObject(value)) return undefined;
  const out: JsonObject = {};
  for (const [key, entry] of Object.entries(value)) {
    if (/AgainstPlayers$/i.test(key)) continue;
    out[key] = entry;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

const TAG_ORDER = [...GROUPS, ...CATEGORIES, ...RACES] as readonly string[];

function unitCommon(record: JsonObject): JsonObject {
  const out: JsonObject = {};
  put(out, 'id', str(record.id));
  put(out, 'name', str(record.name) === undefined ? undefined : romanName(String(record.name)));
  put(out, 'label', str(record.pillLabel)?.replace(/\s+/g, ''));
  return out;
}

function unitTail(record: JsonObject, options: { training: boolean }): JsonObject {
  const out: JsonObject = {};
  put(out, 'health', num(record.health));
  put(out, 'strength', num(record.strength));
  put(out, 'strengthAgainst', bonusMap(record.strengthAgainst));
  put(out, 'doubleDamageChance', num(record.doubleDamageChance));
  const revival = record.revivalCost;
  if (isObject(revival)) put(out, 'revival', { gold: revival.gold ?? 0 });
  if (options.training) {
    const time = record.trainingTime;
    const cost = record.trainingCost;
    const training: JsonObject = {};
    if (isObject(time)) put(training, 'seconds', num(time.seconds));
    if (isObject(cost)) {
      put(training, 'silver', num(cost.silver));
      put(training, 'dragonCoins', num(cost.dragonCoins));
    }
    if (Object.keys(training).length > 0) out.training = training;
  }
  return out;
}

function normaliseTroop(record: JsonObject): JsonObject {
  const out = unitCommon(record);
  put(out, 'group', str(record.group));
  put(out, 'tier', num(record.tier));
  const category = str(record.category);
  // Engineers are listed with a `category` of their own that is not one of the four the game shows.
  if (category !== undefined && (CATEGORIES as readonly string[]).includes(category)) out.category = category;
  put(out, 'race', str(record.race));
  put(out, 'cost', num(record.leadershipCost));
  return { ...out, ...unitTail(record, { training: true }) };
}

function normaliseMonster(record: JsonObject): JsonObject {
  const out = unitCommon(record);
  put(out, 'tier', num(record.tier));
  put(out, 'category', str(record.category));
  put(out, 'race', str(record.race));
  put(out, 'cost', num(record.dominanceCost));
  return { ...out, ...unitTail(record, { training: true }) };
}

function normaliseMercenary(record: JsonObject): JsonObject {
  const out = unitCommon(record);
  put(out, 'tier', num(record.tier));
  if (Array.isArray(record.tags)) {
    const tags = record.tags.filter((tag): tag is string => typeof tag === 'string');
    out.tags = [...tags].sort((a, b) => {
      const left = TAG_ORDER.indexOf(a);
      const right = TAG_ORDER.indexOf(b);
      return (left === -1 ? TAG_ORDER.length : left) - (right === -1 ? TAG_ORDER.length : right);
    });
  }
  put(out, 'cost', num(record.authorityCost));
  return { ...out, ...unitTail(record, { training: false }) };
}

function captainProgression(value: Json | undefined): JsonObject | undefined {
  if (!isObject(value)) return undefined;
  const key = str(value.bonusKey);
  const perLevel = num(value.baseMultiplier) ?? 0;
  const stars = Array.isArray(value.starBonuses) ? value.starBonuses : [];
  // A captain the game lists with an empty progression on one of the two axes (Heimdall's health,
  // Hercules' army bonus) carries no record in our tables.
  if (key === undefined) return undefined;
  if (perLevel === 0 && stars.every((entry) => entry === 0)) return undefined;
  return { key, perLevel, stars };
}

function normaliseCaptains(raw: JsonObject, order: readonly string[] | undefined): JsonObject[] {
  const names = [...(order ?? [])];
  for (const name of Object.keys(raw)) if (!names.includes(name)) names.push(name);
  return names.map((name) => {
    const out: JsonObject = { id: slug(name), name };
    const entry = raw[name];
    if (isObject(entry)) {
      put(out, 'health', captainProgression(entry));
      put(out, 'strength', captainProgression(entry.strength));
      put(out, 'special', captainProgression(entry.specialStrength));
      put(out, 'note', str(entry.note));
    }
    return out;
  });
}

function normaliseContribution(value: Json | undefined): JsonObject {
  const out: JsonObject = {};
  if (!isObject(value)) return out;
  put(out, 'health', bonusMap(value.healthBonuses));
  put(out, 'strength', bonusMap(value.strengthBonuses));
  put(out, 'special', bonusMap(value.specialStrengthBonuses));
  const matchup = value.matchupStrengthBonuses;
  if (Array.isArray(matchup) && matchup.length > 0) {
    out.matchup = matchup.filter(isObject).map((entry) => ({
      attacker: entry.attackerCategory ?? null,
      target: entry.defenderTarget ?? null,
      value: entry.value ?? null,
    }));
  }
  return out;
}

function normaliseEquipment(record: JsonObject): JsonObject {
  const name = String(record.name ?? '');
  const byQuality: JsonObject = {};
  const raw = record.bonusesByQuality;
  if (isObject(raw)) {
    for (const [quality, value] of Object.entries(raw)) byQuality[quality] = normaliseContribution(value);
  }
  return { id: slug(name), name, byQuality };
}

function normaliseTitle(record: JsonObject): JsonObject {
  const name = String(record.name ?? '');
  return { id: slug(name), name, bonus: normaliseContribution(record) };
}

export interface NormalisedTable {
  rows: JsonObject[];
  /** `id` + path prefix pairs the bundle cannot answer for (an artifact level table behind a `$ref`). */
  notComparable: { id: string; prefix: string; reason: string }[];
}

function levelTable(
  chunks: readonly Chunk[],
  base: Json | undefined,
  star: Json | undefined,
): { levels?: JsonObject; unresolved: string[] } {
  const levels: JsonObject = {};
  const unresolved: string[] = [];
  for (const [key, value] of [
    ['base', base],
    ['star', star],
  ] as const) {
    if (value === undefined) continue;
    if (isObject(value)) {
      levels[key] = value;
      continue;
    }
    if (typeof value === 'string' && value.startsWith('$ref:')) {
      const name = value.slice('$ref:'.length);
      const resolved = resolveRef(chunks, name);
      if (isObject(resolved)) levels[key] = resolved;
      else unresolved.push(`$ref:${name}`);
    }
  }
  const out: { levels?: JsonObject; unresolved: string[] } = { unresolved };
  if (Object.keys(levels).length > 0) out.levels = levels;
  return out;
}

function normaliseArtifacts(chunks: readonly Chunk[], records: JsonObject[]): NormalisedTable {
  const notComparable: NormalisedTable['notComparable'] = [];
  const rowsOut = records.map((record) => {
    const name = String(record.name ?? '');
    const id = slug(name);
    const out: JsonObject = { id, name };

    for (const axis of ['health', 'strength'] as const) {
      const baseKey = axis === 'health' ? 'baseHealthByLevel' : 'baseStrengthByLevel';
      const starKey = axis === 'health' ? 'starHealthByLevel' : 'starStrengthByLevel';
      const targetKey = axis === 'health' ? 'healthTargetKey' : 'strengthTargetKey';
      if (!(baseKey in record) && !(starKey in record) && !(targetKey in record)) continue;
      const progression: JsonObject = { key: str(record[targetKey]) ?? 'army' };
      const table = levelTable(chunks, record[baseKey], record[starKey]);
      if (table.levels) progression.levels = table.levels;
      if (table.unresolved.length > 0) {
        notComparable.push({
          id,
          prefix: `${axis}.levels`,
          reason: `level table behind ${table.unresolved.join(' and ')}`,
        });
      }
      out[axis] = progression;
    }

    const special = record.specialStrengthProgressions;
    if (isObject(special)) {
      const [key, value] = Object.entries(special)[0] ?? [];
      if (key !== undefined) {
        const progression: JsonObject = { key };
        const table = isObject(value)
          ? levelTable(chunks, value.baseByLevel, value.starByLevel)
          : { unresolved: [] as string[] };
        if (table.levels) progression.levels = table.levels;
        if (table.unresolved.length > 0) {
          notComparable.push({
            id,
            prefix: 'special.levels',
            reason: `level table behind ${table.unresolved.join(' and ')}`,
          });
        }
        out.special = progression;
      }
    }

    const options = record.randomBonusOptions;
    out.randomBonusOptions = Array.isArray(options)
      ? options
          .map((entry) => (isObject(entry) ? str(entry.id) : str(entry)))
          .filter((entry): entry is string => entry !== undefined && !/AgainstPlayers$/.test(entry))
      : [];
    return out;
  });
  return { rows: rowsOut, notComparable };
}

export function normaliseTables(chunks: readonly Chunk[], raw: RawTables): Map<TableName, NormalisedTable> {
  const out = new Map<TableName, NormalisedTable>();
  const plain = (rowsOut: JsonObject[]): NormalisedTable => ({ rows: rowsOut, notComparable: [] });
  if (raw.troops) out.set('troops.json', plain(raw.troops.map(normaliseTroop)));
  if (raw.monsters) out.set('monsters.json', plain(raw.monsters.map(normaliseMonster)));
  if (raw.mercenaries) out.set('mercenaries.json', plain(raw.mercenaries.map(normaliseMercenary)));
  if (raw.captains) out.set('captains.json', plain(normaliseCaptains(raw.captains, raw.captainOrder)));
  if (raw.equipment) out.set('equipment.json', plain(raw.equipment.map(normaliseEquipment)));
  if (raw.artifacts) out.set('artifacts.json', normaliseArtifacts(chunks, raw.artifacts));
  if (raw.titles) out.set('titles.json', plain(raw.titles.map(normaliseTitle)));
  if (raw.temple) out.set('temple.json', plain([{ id: 'temple', multiplier: raw.temple }]));
  return out;
}

// ---- 5. The diff -------------------------------------------------------------------------------

export interface FieldChange {
  id: string;
  path: string;
  ours: Json | undefined;
  theirs: Json | undefined;
}

export interface TableDiff {
  file: TableName;
  located: boolean;
  how: string;
  ours: number;
  theirs: number;
  added: string[];
  removed: string[];
  changed: FieldChange[];
  /** Records whose `levels` (or other referenced sub-table) the bundle does not spell out in place. */
  notComparable: { id: string; paths: string[] }[];
}

export interface CompareResult {
  chunks: string[];
  dataVersion: number | undefined;
  tables: TableDiff[];
  /** Their tables, already in our record shape: what the report quotes for an added record. */
  theirRows: Map<TableName, JsonObject[]>;
  missing: TableName[];
  differences: number;
}

/** Fields our tables carry that the bundle cannot know about, so silence rather than drift. */
const OURS_ONLY: Partial<Record<TableName, readonly string[]>> = {
  // Which event a mercenary belongs to is read from the game's event screen, not from TotalStack.
  'mercenaries.json': ['event'],
};

function flatten(value: Json | undefined, prefix: string, out: Map<string, Json>): void {
  if (value === undefined) return;
  if (Array.isArray(value)) {
    if (value.length === 0) out.set(prefix, []);
    else value.forEach((entry, index) => flatten(entry, `${prefix}[${index}]`, out));
    return;
  }
  if (isObject(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0) out.set(prefix, {});
    else for (const [key, entry] of entries) flatten(entry, prefix === '' ? key : `${prefix}.${key}`, out);
    return;
  }
  out.set(prefix, value);
}

const covered = (path: string, prefix: string): boolean =>
  path === prefix || path.startsWith(`${prefix}.`) || path.startsWith(`${prefix}[`);

function diffTable(
  file: TableName,
  how: string,
  ourRows: JsonObject[],
  theirs: NormalisedTable | undefined,
): TableDiff {
  const diff: TableDiff = {
    file,
    how,
    located: theirs !== undefined,
    ours: ourRows.length,
    theirs: theirs?.rows.length ?? 0,
    added: [],
    removed: [],
    changed: [],
    notComparable: [],
  };
  if (!theirs) return diff;

  const ignoredPaths = OURS_ONLY[file] ?? [];
  const byId = (list: JsonObject[]): Map<string, JsonObject> =>
    new Map(list.map((row) => [String(row.id ?? ''), row]));
  const ours = byId(ourRows);
  const them = byId(theirs.rows);

  for (const id of them.keys()) if (!ours.has(id)) diff.added.push(id);
  for (const id of ours.keys()) if (!them.has(id)) diff.removed.push(id);

  for (const [id, ourRow] of ours) {
    const theirRow = them.get(id);
    if (!theirRow) continue;
    const skip = theirs.notComparable.filter((entry) => entry.id === id);
    if (skip.length > 0) {
      diff.notComparable.push({ id, paths: [...new Set(skip.map((entry) => entry.prefix))].sort() });
    }
    const left = new Map<string, Json>();
    const right = new Map<string, Json>();
    flatten(ourRow, '', left);
    flatten(theirRow, '', right);
    const paths = [...new Set([...left.keys(), ...right.keys()])].sort();
    for (const path of paths) {
      if (ignoredPaths.some((prefix) => covered(path, prefix))) continue;
      if (skip.some((entry) => covered(path, entry.prefix))) continue;
      const a = left.get(path);
      const b = right.get(path);
      if (JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)) {
        diff.changed.push({ id, path, ours: a, theirs: b });
      }
    }
  }

  diff.added.sort(naturalCompare);
  diff.removed.sort(naturalCompare);
  diff.changed.sort((a, b) => naturalCompare(a.id, b.id) || a.path.localeCompare(b.path));
  return diff;
}

/** `archer-2` before `archer-10`, the same order `scripts/data-tables.ts` sorts our tables in. */
export function naturalCompare(a: string, b: string): number {
  const chunksOf = (value: string): string[] => value.match(/\d+|\D+/g) ?? [];
  const left = chunksOf(a);
  const right = chunksOf(b);
  for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
    const x = left[i];
    const y = right[i];
    if (x === undefined) return -1;
    if (y === undefined) return 1;
    const bothNumeric = /^\d/.test(x) && /^\d/.test(y);
    const delta = bothNumeric ? Number(x) - Number(y) : x < y ? -1 : x > y ? 1 : 0;
    if (delta !== 0) return delta;
  }
  return 0;
}

/** Our tables as rows keyed by id; `temple.json` is one object, given the synthetic id `temple`. */
export async function readOurTables(tablesDir = TABLES_DIR): Promise<Map<TableName, JsonObject[]>> {
  const out = new Map<TableName, JsonObject[]>();
  for (const file of COMPARED_TABLES) {
    const text = await readFile(path.join(tablesDir, file), 'utf8');
    const value = JSON.parse(text) as Json;
    if (Array.isArray(value)) out.set(file, value.filter(isObject));
    else if (isObject(value)) out.set(file, [{ id: 'temple', ...value }]);
  }
  return out;
}

export async function compareChunks(
  chunks: readonly Chunk[],
  options: { tablesDir?: string } = {},
): Promise<CompareResult> {
  const raw = locateTables(chunks);
  const theirs = normaliseTables(chunks, raw);
  const ours = await readOurTables(options.tablesDir ?? TABLES_DIR);

  let dataVersion: number | undefined;
  try {
    const version = JSON.parse(
      await readFile(path.join(options.tablesDir ?? TABLES_DIR, 'version.json'), 'utf8'),
    ) as JsonObject;
    dataVersion = num(version.dataVersion);
  } catch {
    dataVersion = undefined;
  }

  const tables = COMPARED_TABLES.map((file) =>
    diffTable(file, HOW_WE_FIND_IT[file], ours.get(file) ?? [], theirs.get(file)),
  );
  return {
    chunks: chunks.map((chunk) => chunk.name),
    dataVersion,
    tables,
    theirRows: new Map([...theirs].map(([file, table]) => [file, table.rows])),
    missing: tables.filter((table) => !table.located).map((table) => table.file),
    differences: tables.reduce(
      (total, table) => total + table.added.length + table.removed.length + table.changed.length,
      0,
    ),
  };
}

// ---- 6. The report ------------------------------------------------------------------------------

const cell = (value: Json | undefined): string =>
  value === undefined ? '—' : `\`${JSON.stringify(value)}\``;

const nameOf = (rowsOut: JsonObject[], id: string): string => {
  const row = rowsOut.find((entry) => entry.id === id);
  return typeof row?.name === 'string' ? ` — ${row.name}` : '';
};

export function renderReport(result: CompareResult): string {
  const lines: string[] = [];
  lines.push('## TotalStack data comparison');
  lines.push('');
  lines.push(
    `Bundle files read locally: ${result.chunks.map((name) => `\`${name}\``).join(', ') || '(none)'}.`,
  );
  lines.push(
    `Compared against \`src/data/tables\`${result.dataVersion === undefined ? '' : ` (dataVersion ${result.dataVersion})`}. ` +
      'Nothing was downloaded by this tool (ADR-0001 is still *Proposed*).',
  );
  lines.push('');
  lines.push('| Table | ours | TotalStack | added | removed | changed |');
  lines.push('| --- | ---: | ---: | ---: | ---: | ---: |');
  for (const table of result.tables) {
    lines.push(
      table.located
        ? `| \`${table.file}\` | ${table.ours} | ${table.theirs} | ${table.added.length} | ${table.removed.length} | ${table.changed.length} |`
        : `| \`${table.file}\` | ${table.ours} | not found | — | — | — |`,
    );
  }
  lines.push('');
  lines.push(
    result.differences === 0 && result.missing.length === 0
      ? '**No difference.** Every compared table matches TotalStack value for value.'
      : `**${result.differences} difference${result.differences === 1 ? '' : 's'}.** Anything we keep on purpose must be explained in the pull request.`,
  );

  for (const table of result.tables) {
    if (!table.located) continue;
    if (table.added.length + table.removed.length + table.changed.length === 0) continue;
    lines.push('');
    lines.push(`### \`${table.file}\``);
    const rowsOut = result.theirRows.get(table.file) ?? [];
    if (table.added.length > 0) {
      lines.push('');
      lines.push('TotalStack has, we do not:');
      for (const id of table.added) lines.push(`- \`${id}\`${nameOf(rowsOut, id)}`);
    }
    if (table.removed.length > 0) {
      lines.push('');
      lines.push('We have, TotalStack does not:');
      for (const id of table.removed) lines.push(`- \`${id}\``);
    }
    if (table.changed.length > 0) {
      lines.push('');
      lines.push('| id | field | ours | TotalStack |');
      lines.push('| --- | --- | --- | --- |');
      for (const change of table.changed) {
        lines.push(
          `| \`${change.id}\` | \`${change.path}\` | ${cell(change.ours)} | ${cell(change.theirs)} |`,
        );
      }
    }
  }

  const notes = result.tables
    .filter((table) => table.notComparable.length > 0)
    .map((table) => {
      const ids = table.notComparable.map((entry) => `\`${entry.id}\``);
      const paths = [...new Set(table.notComparable.flatMap((entry) => entry.paths))].sort();
      const shown = ids.slice(0, 6).join(', ') + (ids.length > 6 ? ', …' : '');
      return (
        `- \`${table.file}\` — ${paths.map((path) => `\`${path}\``).join(', ')} not compared for ` +
        `${ids.length} record${ids.length === 1 ? '' : 's'} (${shown}): the bundle keeps those tables in ` +
        'shared variables this tool could not follow. Everything else in those records was compared.'
      );
    });
  if (result.missing.length > 0 || notes.length > 0) {
    lines.push('');
    lines.push('### Not comparable');
    lines.push('');
    for (const file of result.missing) {
      lines.push(
        `- \`${file}\` — not found in the files given. Looked for ${HOW_WE_FIND_IT[file]}. Add the lazy chunk that holds it and run again.`,
      );
    }
    for (const note of notes) lines.push(note);
    lines.push(
      '- `heroes.json`, `otherPills.json`, `events.json`, `vip.json`, `orders.json`, `version.json` — no content locator; verify these against the game.',
    );
  }
  lines.push('');
  return lines.join('\n');
}

// ---- 7. Exploring a bundle -----------------------------------------------------------------------

export interface ExploredLiteral {
  chunk: string;
  /** The minified variable name, printed only so a human can find the literal again in the file. */
  name: string;
  entries: number;
  preview: string;
  value: Json;
}

const DATA_LIKE = /\b(health|strength|name|label|level|bonus|cost|tier)\b/i;

/**
 * Every data-like literal in the chunks, for the day the game gains a table we do not model yet or a
 * locator above stops matching. This is a human diagnostic — the comparison itself never looks a table
 * up by the names printed here, because they change on every TotalStack build.
 */
export function explore(chunks: readonly Chunk[]): ExploredLiteral[] {
  const out: ExploredLiteral[] = [];
  for (const chunk of chunks) {
    const marker = /(?<![\w$.])([A-Za-z_$][\w$]*)\s*=\s*(?:Object\.freeze\()?([[{])/g;
    const hits: { name: string; open: number }[] = [];
    for (let match = marker.exec(chunk.text); match; match = marker.exec(chunk.text)) {
      hits.push({ name: match[1] ?? '?', open: match.index + match[0].length - 1 });
    }
    const stacks = bracketStacksAt(
      chunk.text,
      hits.map((hit) => hit.open + 1),
    );
    const seen = new Set<number>();
    for (const hit of hits) {
      if (seen.has(hit.open)) continue;
      const frame = (stacks.get(hit.open + 1) ?? []).at(-1);
      if (!frame || frame.open !== hit.open || frame.close < 0) continue;
      seen.add(hit.open);
      const literal = chunk.text.slice(frame.open, frame.close + 1);
      if (literal.length < 150) continue;
      let value: Json;
      try {
        value = jsLiteralToJson(literal);
      } catch {
        continue;
      }
      // Either it names the kind of thing we care about, or it is one of the bare "level → percent"
      // tables (the temple divisors, an artifact progression), which carry no field names at all.
      const numberTable =
        isObject(value) &&
        Object.keys(value).length >= 20 &&
        Object.values(value).every((entry) => typeof entry === 'number');
      if (!DATA_LIKE.test(literal) && !numberTable) continue;
      const first = Array.isArray(value)
        ? value[0]
        : isObject(value)
          ? Object.fromEntries(Object.entries(value).slice(0, 2))
          : value;
      out.push({
        chunk: chunk.name,
        name: hit.name,
        entries: Array.isArray(value) ? value.length : isObject(value) ? Object.keys(value).length : 0,
        preview: JSON.stringify(first).slice(0, 160),
        value,
      });
    }
  }
  return out;
}

// ---- 8. Self-test and CLI -------------------------------------------------------------------------

export interface SelfTestCase {
  literal: string;
  expected: Json | 'throws';
}

/** The tokenizer's unit tests, kept next to it so `--selftest` works from a checkout with no dev install. */
export const SELF_TESTS: readonly SelfTestCase[] = [
  { literal: '{a:1,b:!0,c:!1}', expected: { a: 1, b: true, c: false } },
  { literal: '[1e3,.5,-.5,-1.5e-2,0x10]', expected: [1000, 0.5, -0.5, -0.015, 16] },
  { literal: '{"a":1,\'b\':2,`c`:3}', expected: { a: 1, b: 2, c: 3 } },
  { literal: "{a:'it\\'s \"x\"'}", expected: { a: 'it\'s "x"' } },
  { literal: '{1:1.04,2:1.06,45:5.91}', expected: { '1': 1.04, '2': 1.06, '45': 5.91 } },
  { literal: '{0.1:48,"5.0":360}', expected: { '0.1': 48, '5.0': 360 } },
  { literal: '{a:b,c:[...d]}', expected: { a: '$ref:b', c: ['$spread:d'] } },
  { literal: '{a:Oe("x","y")}', expected: { a: '$call:Oe("x","y")' } },
  {
    literal: '[{id:"archer-1",name:"Archer 1"},{id:"rider-1"}]',
    expected: [{ id: 'archer-1', name: 'Archer 1' }, { id: 'rider-1' }],
  },
  { literal: '{ a : [ 1 , 2 ] , b : { c : null } }', expected: { a: [1, 2], b: { c: null } } },
  { literal: '{a:"\\u00e9\\n"}', expected: { a: 'é\n' } },
  { literal: '{a:()=>1}', expected: 'throws' },
  { literal: '{a:1}garbage', expected: 'throws' },
];

export function runSelfTest(): { passed: number; failures: string[] } {
  const failures: string[] = [];
  let passed = 0;
  for (const testCase of SELF_TESTS) {
    let actual: Json | 'throws';
    try {
      actual = jsLiteralToJson(testCase.literal);
    } catch {
      actual = 'throws';
    }
    if (JSON.stringify(actual) === JSON.stringify(testCase.expected)) passed += 1;
    else
      failures.push(
        `${testCase.literal}\n    expected ${JSON.stringify(testCase.expected)}\n    actual   ${JSON.stringify(actual)}`,
      );
  }
  return { passed, failures };
}

const USAGE = `pnpm data:compare -- <path-to-index-*.js> [more chunks...]
pnpm data:compare -- --selftest
pnpm data:compare -- --explore [--out <dir>] <path-to-index-*.js> [more chunks...]

Compares the game tables inside a locally downloaded TotalStack bundle with src/data/tables and prints a
Markdown report. Nothing is downloaded: save the files from your browser first (see
tools/totalstack-sync/README.md). Exit code 1 means the tables differ or one could not be found.

  --selftest  run the tokenizer's own test cases and exit
  --explore   list every data-like literal in the files instead of comparing (use it when a table moved
              or the game gained one we do not model yet); --out writes each one as JSON
`;

/** The file arguments, with the flags and the directory `--out` takes removed. */
export function parseArguments(argv: readonly string[]): { files: string[]; outDir: string | undefined } {
  const outIndex = argv.indexOf('--out');
  return {
    files: argv.filter(
      (argument, index) => !argument.startsWith('-') && !(outIndex !== -1 && index === outIndex + 1),
    ),
    outDir: outIndex === -1 ? undefined : argv[outIndex + 1],
  };
}

async function main(argv: readonly string[]): Promise<number> {
  const write = (text: string): void => void process.stdout.write(text);
  if (argv.includes('--help') || argv.includes('-h')) {
    write(USAGE);
    return 0;
  }
  if (argv.includes('--selftest')) {
    const { passed, failures } = runSelfTest();
    for (const failure of failures) write(`FAIL ${failure}\n`);
    write(`${passed}/${SELF_TESTS.length} tokenizer self-tests passed\n`);
    return failures.length === 0 ? 0 : 1;
  }
  const { files, outDir } = parseArguments(argv);
  if (files.length === 0) {
    write(USAGE);
    return 1;
  }
  const chunks: Chunk[] = [];
  for (const file of files) {
    chunks.push({ name: path.basename(file), text: await readFile(file, 'utf8') });
  }
  if (argv.includes('--explore')) {
    for (const literal of explore(chunks)) {
      write(`${literal.chunk} ${literal.name} n=${literal.entries} :: ${literal.preview}\n`);
      if (outDir !== undefined) {
        const target = path.join(outDir, `${literal.chunk}.${literal.name}.json`);
        await writeFile(target, `${JSON.stringify(literal.value, null, 1)}\n`);
      }
    }
    return 0;
  }
  const result = await compareChunks(chunks);
  write(renderReport(result));
  return result.differences === 0 && result.missing.length === 0 ? 0 : 1;
}

if (import.meta.filename === process.argv[1]) {
  process.exitCode = await main(process.argv.slice(2));
}
