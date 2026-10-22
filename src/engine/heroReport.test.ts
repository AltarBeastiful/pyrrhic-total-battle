import { describe, expect, test } from 'vitest';

import { buildHeroReport, type RoleReading } from './heroReport';

const heroes = ['a', 'b', 'c', 'd'].map((captainId) => ({ captainId, name: captainId, level: 1, star: 0 }));

/** Solo gains one stop wide; the trio list is every trio of the four, gain the sum of its members'. */
function reading(solo: Record<string, number>): RoleReading {
  const ids = Object.keys(solo);
  const trios = ids.map((skip) => {
    const captainIds = ids.filter((id) => id !== skip);
    return { captainIds, stops: [captainIds.reduce((sum, id) => sum + (solo[id] ?? 0), 0)] };
  });
  return { solo: Object.fromEntries(ids.map((id) => [id, [solo[id] ?? 0]])), trios };
}

describe('buildHeroReport situations', () => {
  test('marks the heroes that become, or stop being, the best under a situation', () => {
    const report = buildHeroReport({
      stops: ['sweet-spot'],
      heroes,
      worth: null,
      readings: {
        default: reading({ a: 10, b: 8, c: 6, d: 1 }),
        monsters: reading({ a: 4, b: 8, c: 6, d: 9 }),
      },
    });
    const flips = (id: string) => report.tiles.find((tile) => tile.captainId === id)?.flips;
    // d is the best solo and joins the best trio under monsters, a leaves both; b and c stay in the trio.
    expect(flips('a')).toEqual(['monsters']);
    expect(flips('b')).toEqual([]);
    expect(flips('d')).toEqual(['monsters']);
    expect(flips('c')).toEqual([]);
    expect(report.situations.map((row) => row.bestSolo)).toEqual(['a', 'd']);
  });

  test('a situation that changes nothing flips no hero', () => {
    const same = reading({ a: 10, b: 8, c: 6, d: 1 });
    const report = buildHeroReport({
      stops: ['sweet-spot'],
      heroes,
      worth: null,
      readings: { default: same, moreMercs: same },
    });
    expect(report.tiles.every((tile) => tile.flips.length === 0)).toBe(true);
  });
});

describe('buildHeroReport situational heroes', () => {
  test('a hero limited to one kind of march is rated apart and takes no solo, trio or banner place', () => {
    const solo = { a: 10, b: 8, c: 6, g: 30 };
    const report = buildHeroReport({
      stops: ['sweet-spot'],
      heroes: [
        ...heroes.slice(0, 3),
        { captainId: 'g', name: 'g', level: 1, star: 0, onlyOn: 'group' },
      ],
      worth: [{ captainId: 'g', kind: 'star', size: 1, label: 'g ★1', worth: 5 }],
      readings: { default: { solo: reading(solo).solo, trios: [{ captainIds: ['a', 'b', 'c'], stops: [24] }] } },
    });
    expect(report.tiles.map((tile) => tile.captainId)).toEqual(['a', 'b', 'c']);
    expect(report.situational.map((tile) => [tile.captainId, tile.solo])).toEqual([['g', 30]]);
    expect(report.situations[0]?.bestSolo).toBe('a');
    expect(report.banner).toEqual([]);
  });
});

describe('buildHeroReport worth getting', () => {
  const catalog = [
    { captainId: 'a', name: 'A', difficulty: 3, rating: 50, owned: true },
    { captainId: 'b', name: 'B', difficulty: 1, rating: 99, owned: false },
    { captainId: 'c', name: 'C', difficulty: 4, rating: 10, owned: false },
    { captainId: 'd', name: 'D', difficulty: 4, rating: 30, owned: false },
    { captainId: 'e', name: 'E', difficulty: 7, rating: 90, owned: false },
  ];
  const read = (rows: typeof catalog) =>
    buildHeroReport({
      stops: ['sweet-spot'],
      heroes,
      worth: null,
      catalog: rows,
      readings: { default: reading({ a: 1, b: 1, c: 1, d: 1 }) },
    }).getting;

  test('recommends the best-rated unowned hero of the easiest tier above what the account holds', () => {
    // The account holds difficulty 3: B (1) is below it, C and D tie at 4, D rates higher, E is a harder tier.
    expect(read(catalog)?.captainId).toBe('d');
  });

  test('nothing is recommended when no unowned hero is above what is held', () => {
    expect(
      read(catalog.filter((row) => row.captainId !== 'c' && row.captainId !== 'd' && row.captainId !== 'e')),
    ).toBeNull();
  });
});

describe('buildHeroReport best trio', () => {
  test('the best trio is chosen on the bar average, and each stop keeps its own best trio beside it', () => {
    const trio = (captainIds: string[], stops: number[]) => ({ captainIds, stops });
    const report = buildHeroReport({
      stops: ['sweet-spot', 'all-in'],
      heroes,
      worth: null,
      readings: {
        default: {
          solo: { a: [1, 1], b: [1, 1], c: [1, 1], d: [1, 1] },
          trios: [
            trio(['a', 'b', 'c'], [10, 1]),
            trio(['a', 'b', 'd'], [1, 14]),
            trio(['b', 'c', 'd'], [6, 6]),
          ],
        },
      },
    });
    // Averages: 5.5, 7.5, 6 — the second wins the bar; the first is best on the first stop alone.
    expect(report.bestTrio?.captainIds).toEqual(['a', 'b', 'd']);
    expect(report.stopTrios.map((best) => best?.captainIds.join())).toEqual(['a,b,c', 'a,b,d']);
  });
});
