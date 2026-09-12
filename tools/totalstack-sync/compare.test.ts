/**
 * End-to-end check of the manual TotalStack drift tool.
 *
 * There is no bundle in the repository (and nothing here downloads one), so the test builds a
 * minified-looking one: the research capture in `docs/research/totalstack-data/` is re-emitted as the
 * kind of JavaScript a bundler produces — bare keys, `!0`/`!1`, `3e3`, mixed quotes, bare identifiers
 * for the shared level tables — wrapped in decoy code with a regular expression, a template literal and
 * a string that pretends to be the troop table. The tool then has to find the tables by content and
 * reshape them into our record shape.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, test } from 'vitest';

import {
  compareChunks,
  explore,
  jsLiteralToJson,
  parseArguments,
  renderReport,
  runSelfTest,
  SELF_TESTS,
  slug,
  toRoman,
  type Json,
  type TableName,
} from './compare.ts';

type JsonObject = { [key: string]: Json };

const RESEARCH = path.join(
  fileURLToPath(new URL('.', import.meta.url)),
  '..',
  '..',
  'docs',
  'research',
  'totalstack-data',
);

const read = async (file: string): Promise<Json> =>
  JSON.parse(await readFile(path.join(RESEARCH, `${file}.json`), 'utf8')) as Json;

// ---- the fake bundle ------------------------------------------------------------------------------

const IDENTIFIER = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const quote = (value: string): string =>
  `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;

/** Re-emits data the way a minifier would write it. */
function minify(value: Json): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? '!0' : '!1';
  if (typeof value === 'number') {
    return Number.isInteger(value) && value !== 0 && value % 1000 === 0 ? `${value / 1000}e3` : String(value);
  }
  if (typeof value === 'string') {
    if (value.startsWith('$ref:')) return value.slice('$ref:'.length);
    if (value.startsWith('$spread:')) return `...${value.slice('$spread:'.length)}`;
    return quote(value);
  }
  if (Array.isArray(value)) return `[${value.map(minify).join(',')}]`;
  return `{${Object.entries(value)
    .map(([key, entry]) => `${IDENTIFIER.test(key) || /^\d+$/.test(key) ? key : `"${key}"`}:${minify(entry)}`)
    .join(',')}}`;
}

/** One chunk of JavaScript holding every table, plus enough noise to make the scan work for it. */
async function fakeBundle(mutate: (tables: Record<string, Json>) => void = () => {}): Promise<string> {
  const tables: Record<string, Json> = {
    troops: await read('troops'),
    monsters: await read('monsters'),
    mercenaries: await read('mercenaries'),
    captains: await read('captains'),
    captainOrder: await read('captain-order'),
    equipment: await read('equipment'),
    artifacts: await read('artifacts'),
    titles: await read('titles'),
    temple: await read('temple-revival-cost-multiplier'),
    cl: await read('artifact-base-strength-by-level'),
    gl: await read('artifact-star-strength-by-level'),
  };
  mutate(tables);
  return [
    'const Ie=/[)]/g,Te=/^\\/(\\d+)\\]$/;',
    'function Ae(e){return`squad ${e.id} [${e.n}] id:"archer-1"`}',
    'const Ne={note:"the first troop is id:\'archer-1\'",make:(e)=>({id:e})};',
    `const cl=${minify(tables.cl ?? null)},gl=${minify(tables.gl ?? null)};`,
    `var Qa=${minify(tables.troops ?? null)},zb=${minify(tables.monsters ?? null)};`,
    `const Vc=${minify(tables.mercenaries ?? null)};`,
    `let Jd=${minify(tables.captains ?? null)},Ke=${minify(tables.captainOrder ?? null)};`,
    `const Lf=${minify(tables.equipment ?? null)},Mg=${minify(tables.artifacts ?? null)};`,
    `const Nh=${minify(tables.titles ?? null)},Oi=${minify(tables.temple ?? null)};`,
    'export{Qa as a,zb as b,Vc as c,Jd as d,Ke as e,Lf as f,Mg as g,Nh as h,Oi as i};',
  ].join('\n');
}

const chunksOf = (text: string) => [{ name: 'index-Fk3p9Xa1.js', text }];

const tableOf = (
  result: Awaited<ReturnType<typeof compareChunks>>,
  file: TableName,
): NonNullable<ReturnType<(typeof result.tables)['find']>> => {
  const table = result.tables.find((entry) => entry.file === file);
  if (!table) throw new Error(`no diff for ${file}`);
  return table;
};

// ---- tests ----------------------------------------------------------------------------------------

describe('the no-eval tokenizer', () => {
  test('passes its own self-test cases', () => {
    const { passed, failures } = runSelfTest();
    expect(failures).toEqual([]);
    expect(passed).toBe(SELF_TESTS.length);
  });

  test('reads a minified record the way the bundle writes it', () => {
    expect(jsLiteralToJson('[{id:"archer-1",cost:1,flying:!1,silver:3e3,extra:Le,rest:[...Se]}]')).toEqual([
      { id: 'archer-1', cost: 1, flying: false, silver: 3000, extra: '$ref:Le', rest: ['$spread:Se'] },
    ]);
  });

  test('refuses anything that is not data', () => {
    expect(() => jsLiteralToJson('{make:(e)=>e.id}')).toThrow();
  });
});

describe('reshaping into our record shape', () => {
  test('writes unit numbers in roman numerals and slugs names the way our ids are spelled', () => {
    expect(toRoman(4)).toBe('IV');
    expect(slug("Guardsmen's Courage")).toBe('guardsmens-courage');
    expect(slug('Warrior of Ragnarök')).toBe('warrior-of-ragnarok');
    expect(slug('Ye Ho-Sung')).toBe('ye-ho-sung');
  });
});

describe('the command line', () => {
  test("keeps the file arguments and drops the flags, with or without pnpm's own `--`", () => {
    expect(parseArguments(['bundle.js']).files).toEqual(['bundle.js']);
    expect(parseArguments(['--', 'a.js', 'b.js']).files).toEqual(['a.js', 'b.js']);
    expect(parseArguments(['--explore', '--out', 'dump', 'a.js'])).toEqual({
      files: ['a.js'],
      outDir: 'dump',
    });
  });
});

describe('comparing a bundle with our tables', () => {
  test('finds every table by content and reports no difference for the unchanged capture', async () => {
    const result = await compareChunks(chunksOf(await fakeBundle()));

    expect(result.missing).toEqual([]);
    for (const table of result.tables) {
      expect(
        { file: table.file, added: table.added, removed: table.removed, changed: table.changed },
        `${table.file} should match`,
      ).toEqual({ file: table.file, added: [], removed: [], changed: [] });
      expect(table.theirs, `${table.file} record count`).toBe(table.ours);
    }
    expect(result.differences).toBe(0);
    expect(renderReport(result)).toContain('**No difference.**');

    // The one artifact whose level tables our own table carries is compared in full, which means the
    // tool followed the bare identifier the bundle stores them behind; the rest are reported as unread.
    const artifacts = tableOf(result, 'artifacts.json');
    expect(artifacts.notComparable.map((entry) => entry.id)).not.toContain('heart-of-the-forest');
    expect(artifacts.notComparable).toContainEqual({
      id: 'forest-crown',
      paths: ['health.levels', 'strength.levels'],
    });
  });

  test('reports a changed value, an added unit and a removed unit', async () => {
    const text = await fakeBundle((tables) => {
      const troops = tables.troops as JsonObject[];
      const archer1 = troops.find((troop) => troop.id === 'archer-1');
      if (archer1) archer1.health = 151;
      const archer5 = troops.find((troop) => troop.id === 'archer-5');
      tables.troops = [
        ...troops.filter((troop) => troop.id !== 'spearman-1'),
        { ...archer5, id: 'archer-10', name: 'Archer 10', pillLabel: 'ARC 10', tier: 10 },
      ];
    });

    const result = await compareChunks(chunksOf(text));
    const troops = tableOf(result, 'troops.json');

    expect(troops.added).toEqual(['archer-10']);
    expect(troops.removed).toEqual(['spearman-1']);
    expect(troops.changed).toEqual([{ id: 'archer-1', path: 'health', ours: 150, theirs: 151 }]);
    expect(result.differences).toBe(3);

    const report = renderReport(result);
    expect(report).toContain('`archer-10` — Archer X');
    expect(report).toContain('`spearman-1`');
    expect(report).toContain('| `archer-1` | `health` | `150` | `151` |');
  });

  test('can list the data literals in a bundle when a locator needs re-checking', async () => {
    const found = explore(chunksOf(await fakeBundle()));
    const troops = found.find((literal) => literal.entries === 65);
    expect(troops?.preview).toContain('"id":"archer-1"');
    // The bare level tables have no field names at all and are found by their shape instead.
    expect(found.some((literal) => literal.entries === 45)).toBe(true);
  });

  test('says which tables are missing instead of calling them empty', async () => {
    const result = await compareChunks(chunksOf('const a=1;'));
    expect(result.missing.length).toBe(result.tables.length);
    expect(renderReport(result)).toContain('not found in the files given');
  });
});
