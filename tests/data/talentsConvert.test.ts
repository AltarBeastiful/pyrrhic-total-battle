/**
 * The talent table is built from the owner's recon dump by `scripts/talents-convert.ts` (B-21).
 * One small hand-made dump checks the decoding rules; when the real dump is on this machine the whole
 * table is rebuilt from it and must equal what is committed.
 */
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import { DUMP_SOURCE, convertTalents, type TalentDump } from '../../scripts/talents-convert.ts';
import { talents } from '../../src/data/index.ts';

const level = (n: number, guard: [string, number[]][], b: number, cost = 1) => ({
  level: n,
  learnGuard: { calls: guard.map(([fn, args]) => ({ fn, args })) },
  effect: { coeffs: [{ typeName: 'UNIT_POWER', affectedIds: [7, 8], A: 0, B: b, C: 0 }] },
  instantPrice: [{ resource: 17, amount: cost }],
});
const layout = { x: 1, y: 2, linkType: '1-1-B', linkPlace: 'left', linkFlipped: '1' };

const dump: TalentDump = {
  branches: [
    {
      id: 18,
      type: 'heroAbility',
      techs: [
        {
          id: 100,
          name: 'Root',
          branchId: 18,
          maxLevel: 1,
          layout,
          levels: [level(1, [['HasTech', [100, 1, 1]]], 10100)],
        },
        {
          id: 101,
          name: 'Child',
          branchId: 18,
          maxLevel: 2,
          layout,
          levels: [
            level(
              1,
              [
                ['HasTech', [100, 1, 0]],
                ['HasLevel', [65, 0]],
                ['HasTech', [101, 1, 1]],
              ],
              10050,
              10,
            ),
            level(2, [['HasTech', [101, 1, 1]]], 10200, 10),
          ],
        },
        { id: 102, name: 'Unplaced', branchId: 18, maxLevel: 1, layout: null, levels: [] },
      ],
    },
    {
      id: 17,
      type: 'clanTalents',
      techs: [{ id: 1, name: 'Clan', branchId: 17, maxLevel: 1, layout, levels: [] }],
    },
  ],
};

describe('convertTalents', () => {
  it('takes the highest of several level conditions', () => {
    const odd = structuredClone(dump);
    odd.branches[0]?.techs[1]?.levels[0]?.learnGuard.calls.push({ fn: 'HasLevel', args: [80, 0] });
    expect(convertTalents(odd)[1]).toMatchObject({ levelGate: 80 });
  });

  it('refuses a parent that is not in the output', () => {
    const odd = structuredClone(dump);
    odd.branches[0]?.techs[1]?.levels[0]?.learnGuard.calls.push({ fn: 'HasTech', args: [555, 1, 1] });
    expect(() => convertTalents(odd)).toThrow(/555/);
  });

  it('keeps hero-tree nodes with a place, decodes parents, gate, values and costs', () => {
    const rows = convertTalents(dump);
    expect(rows.map((row) => row.id)).toEqual([100, 101]);
    expect(rows[0]).toMatchObject({ tree: 'battle', parents: [], values: [1], costs: [1] });
    expect(rows[0]).not.toHaveProperty('levelGate');
    expect(rows[1]).toMatchObject({
      parents: [100],
      levelGate: 65,
      values: [0.5, 2],
      costs: [10, 10],
      stats: ['UNIT_POWER'],
      unitIds: [7, 8],
      layout: { x: 1, y: 2, link: '1-1-B', place: 'left', flipped: true },
    });
  });

  it('refuses a condition it does not understand', () => {
    const odd = structuredClone(dump);
    odd.branches[0]?.techs[0]?.levels[0]?.learnGuard.calls.push({ fn: 'HasMagic', args: [1] });
    expect(() => convertTalents(odd)).toThrow(/unknown first-rank condition/);
  });
});

describe.skipIf(!(DUMP_SOURCE !== null && existsSync(DUMP_SOURCE)))('against the recon dump', () => {
  it('rebuilds exactly the committed table', async () => {
    const rebuilt = convertTalents(JSON.parse(await readFile(DUMP_SOURCE!, 'utf8')) as TalentDump);
    expect(rebuilt).toEqual(talents);
  });
});
