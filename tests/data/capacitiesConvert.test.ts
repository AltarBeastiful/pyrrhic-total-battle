/**
 * The capacity table (leadership, authority, dominance per level, for captains and for the hero) is built from the
 * hero level export by `scripts/capacities-convert.ts` (B-43). A small hand-made export checks the decoding rules;
 * when the real export is on this machine the whole table is rebuilt from it and must equal what is committed.
 */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { EXPORT_SOURCE } from '../../scripts/artifacts-convert.ts';
import { convertCapacities, LEVELS_FILE } from '../../scripts/capacities-convert.ts';
import { capacities } from '../../src/data/index.ts';

const HEADER = 'id,kind,level,expRequired,leadership,mastery,dominance,effectId,rating';

/**
 * A hand-made export: the hero (id 1) and two captains (ids 2 and 3) with the same figures. A captain holds
 * `10 × level` leadership, `20 × level` mastery and `30 × level` dominance; the hero ten times that.
 */
function handMade(): string[] {
  const lines = [HEADER];
  for (const [id, kind, times] of [
    [1, 'HERO', 10],
    [2, 'CAPTAIN', 1],
    [3, 'CAPTAIN', 1],
  ] as const) {
    for (let level = 1; level <= 600; level += 1) {
      const figures = [10, 20, 30].map((per) => (per * times * level).toFixed(1));
      lines.push([id, kind, level, 0, ...figures, 15_000 + level, 20].join(','));
    }
  }
  return lines;
}

const text = (lines: string[]): string => `${lines.join('\r\n')}\r\n`;

/** The line of one hero or captain at one level. */
const lineOf = (lines: string[], id: number, level: number): number => {
  const found = lines.findIndex((line) => new RegExp(`^${String(id)},[A-Z]+,${String(level)},`).test(line));
  if (found < 0) throw new Error(`no level ${String(level)} of ${String(id)} in the hand-made export`);
  return found;
};

/** What the converter says about a spoilt export. */
const refusal = (spoil: (lines: string[]) => void) => () => {
  const lines = handMade();
  spoil(lines);
  convertCapacities(text(lines));
};

describe('convertCapacities', () => {
  it('stores levels 1 to 600 for captains and for the hero, reading mastery as authority', () => {
    const table = convertCapacities(text(handMade()));
    for (const set of [table.captain, table.hero]) {
      expect([set.leadership.length, set.authority.length, set.dominance.length]).toEqual([600, 600, 600]);
    }
    // Index = level − 1: level 1, 7 and 600.
    expect([0, 6, 599].map((i) => table.captain.leadership[i])).toEqual([10, 70, 6000]);
    expect([0, 6, 599].map((i) => table.captain.authority[i])).toEqual([20, 140, 12_000]);
    expect([0, 6, 599].map((i) => table.captain.dominance[i])).toEqual([30, 210, 18_000]);
    expect(table.hero.authority[6]).toBe(1400);
  });
});

describe('convertCapacities refuses', () => {
  it('captains that do not share one set of figures', () => {
    expect(
      refusal((lines) => {
        const at = lineOf(lines, 3, 44);
        lines[at] = lines[at]!.replace('880.0', '881.0');
      }),
    ).toThrow(/captain 3, level 44: authority 881 where captain 2 has 880/);
  });

  it('a level that is missing, out of order or past 600', () => {
    expect(
      refusal((lines) => {
        lines.splice(lineOf(lines, 2, 5), 1);
      }),
    ).toThrow(/captain 2: level 5 is missing or out of order/);
    expect(
      refusal((lines) => {
        lines.splice(lineOf(lines, 1, 600), 1);
      }),
    ).toThrow(/hero 1: level 600 is missing or out of order/);
    expect(
      refusal((lines) => {
        lines.push('3,CAPTAIN,601,0,1.0,1.0,1.0,1,1');
      }),
    ).toThrow(/captain 3: 601 levels where 600 are expected/);
  });

  it('a kind it does not know, no hero or two, and no captain', () => {
    expect(
      refusal((lines) => {
        lines.push('9,DRAGON,1,0,1.0,1.0,1.0,1,1');
      }),
    ).toThrow(/line 1802: unknown kind DRAGON/);
    expect(
      refusal((lines) => {
        lines.splice(1, 600);
      }),
    ).toThrow(/0 heroes where one is expected/);
    expect(
      refusal((lines) => {
        lines.push(...lines.slice(1, 601).map((line) => line.replace(/^1,/, '9,')));
      }),
    ).toThrow(/2 heroes where one is expected/);
    expect(
      refusal((lines) => {
        lines.splice(601);
      }),
    ).toThrow(/no captain/);
  });

  it('a figure that is not a whole number, and a header without a column it reads', () => {
    expect(
      refusal((lines) => {
        const at = lineOf(lines, 2, 3);
        lines[at] = lines[at]!.replace('30.0', '30.5');
      }),
    ).toThrow(/line 6\d\d: leadership is 30\.5, not a whole number/);
    expect(
      refusal((lines) => {
        const at = lineOf(lines, 1, 3);
        lines[at] = '1,HERO,3,0,,600.0,900.0,1,1';
      }),
    ).toThrow(/line 4: leadership is empty/);
    expect(
      refusal((lines) => {
        lines[0] = HEADER.replace('mastery', 'authority');
      }),
    ).toThrow(/no column named mastery/);
  });
});

const REAL = EXPORT_SOURCE === null ? null : path.join(EXPORT_SOURCE, LEVELS_FILE);

describe.skipIf(!(REAL !== null && existsSync(REAL)))('against the game export', () => {
  it('rebuilds exactly the committed table', async () => {
    expect(convertCapacities(await readFile(REAL!, 'utf8'))).toEqual(capacities);
  });
});
