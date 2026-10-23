import { describe, expect, test } from 'vitest';

import { buildHeroChampion, type ChampionHero, type GridRating } from './heroChampion';

const hero = (captainId: string, level = 10, star = 0, onlyOn?: string): ChampionHero => ({
  captainId,
  name: captainId.toUpperCase(),
  level,
  star,
  ...(onlyOn === undefined ? {} : { onlyOn }),
});

/** A hero's grid: stars 0..6 at the levels given, the rating from `f(star, level)`. */
const grid = (levels: number[], f: (star: number, level: number) => number): GridRating[] =>
  levels.flatMap((level) => [0, 1, 2, 3, 4, 5, 6].map((star) => ({ star, level, rating: f(star, level) })));

const LEVELS = [10, 50, 100];

describe('the champion', () => {
  test('is the hero with the highest average lead over the field, the second is the challenger', () => {
    const result = buildHeroChampion({
      heroes: [hero('a'), hero('b'), hero('c')],
      ratings: {
        a: grid(LEVELS, (s) => 20 + 2 * s),
        b: grid(LEVELS, (s) => 18 + 2 * s),
        c: grid(LEVELS, (s) => 5 + s),
      },
    });
    expect(result.champion?.captainId).toBe('a');
    expect(result.challenger?.captainId).toBe('b');
    expect(result.champion?.lead).toBeCloseTo(2);
    expect(result.champion?.leadsAt).toEqual({ wins: 21, of: 21 });
    expect(result.overtakes).toEqual([]);
    expect(result.noClearMargin).toBe(false);
  });

  test('the grid points where the challenger overtakes are named, and a thin lead is flagged', () => {
    const result = buildHeroChampion({
      heroes: [hero('a'), hero('b')],
      ratings: {
        a: grid(LEVELS, (s) => 10 + s),
        b: grid(LEVELS, (s, l) => 10 + s + (s === 6 && l === 100 ? 0.4 : -0.1)),
      },
    });
    expect(result.champion?.captainId).toBe('a');
    expect(result.overtakes).toEqual([{ star: 6, level: 100 }]);
    expect(result.noClearMargin).toBe(true);
  });

  test('a hero that counts on one march type only never enters the race, it is listed apart', () => {
    const result = buildHeroChampion({
      heroes: [hero('a'), hero('b'), hero('g', 10, 0, 'group')],
      ratings: { a: grid(LEVELS, () => 10), b: grid(LEVELS, () => 9), g: grid(LEVELS, () => 99) },
    });
    expect(result.champion?.captainId).toBe('a');
    expect(result.situational.map((h) => h.captainId)).toEqual(['g']);
  });

  test('a hero is compared only at the points it reaches', () => {
    // b is at level 60 and reaches only 60 and 100: at those it trails; a would lead everywhere anyway.
    const result = buildHeroChampion({
      heroes: [hero('a', 10), hero('b', 60)],
      ratings: { a: grid([10, 60, 100], () => 10), b: grid([60, 100], () => 9) },
    });
    // a's level-10 points have no rival there and are not compared; b's 14 points are all compared.
    expect(result.champion?.leadsAt).toEqual({ wins: 14, of: 14 });
    expect(result.board.find((e) => e.captainId === 'b')?.leadsAt).toEqual({ wins: 0, of: 14 });
  });
});

describe('partial data', () => {
  test('a hero whose planned points were partly cut says how many are missing; the others say none', () => {
    const result = buildHeroChampion({
      heroes: [hero('a'), hero('b')],
      ratings: {
        a: grid(LEVELS, (s) => 20 + s),
        b: grid([10], (s) => 30 + s),
      },
      planned: { a: 21, b: 21 },
    });
    const cutOf = (id: string) => result.board.find((entry) => entry.captainId === id)?.cut;
    expect(cutOf('a')).toBe(0);
    expect(cutOf('b')).toBe(14);
    expect(result.tiles.find((tile) => tile.captainId === 'b')?.cut).toBe(14);
  });

  test('without a plan told, nothing is flagged', () => {
    const result = buildHeroChampion({ heroes: [hero('a')], ratings: { a: grid(LEVELS, (s) => s) } });
    expect(result.board[0]?.cut).toBe(0);
  });
});

describe('valleys', () => {
  const two = [hero('a'), hero('b')];
  const ratings = { a: grid(LEVELS, () => 10), b: grid(LEVELS, () => 5) };

  test('a dip that a later star recovers past is advised as one package with its total gain', () => {
    const result = buildHeroChampion({
      heroes: two,
      ratings,
      valleyCurves: { a: [10, 12, 9.6, 17, 18, 19, 20] },
    });
    expect(result.valleys.a).toEqual([{ kind: 'package', from: 1, dip: 2, to: 3, loss: 2.4, gain: 5 }]);
  });

  test('a dip with no recovery is a dead end: do not star past the rung before it', () => {
    const result = buildHeroChampion({
      heroes: two,
      ratings,
      valleyCurves: { a: [10, 12, 15, 14, 13, 14.5, 14.9] },
    });
    expect(result.valleys.a).toEqual([{ kind: 'dead-end', from: 2, dip: 3, loss: 2, gain: 0 }]);
  });

  test('a hero without a valley curve is told no valley', () => {
    const result = buildHeroChampion({ heroes: two, ratings, valleyCurves: { a: [1, 2, 3, 4, 5, 6, 7] } });
    expect(result.valleys.a).toEqual([]);
    expect(result.valleys.b).toBeUndefined();
  });
});

describe('the roster', () => {
  const heroes = [hero('a', 10, 1), hero('b', 10, 0), hero('c', 10, 0), hero('d', 10, 0)];
  const ratings = {
    a: grid(LEVELS, (s, l) => 30 + 3 * s + l / 100),
    b: grid(LEVELS, (s, l) => 29 + 3 * s + l / 100),
    c: grid(LEVELS, (s, l) => 20 + 2 * s + l / 100),
    d: grid(LEVELS, (s, l) => 1 + s + l / 100),
  };
  const result = buildHeroChampion({ heroes, ratings });

  test('heroes are grouped in tiers by their lead over the field, the champion always in S', () => {
    const crossing = buildHeroChampion({
      heroes: ['a', 'b', 'c', 'e'].map((id) => hero(id)),
      ratings: {
        a: grid(LEVELS, (s) => 30 + 3 * s),
        b: grid(LEVELS, (s) => 31 + 2 * s),
        c: grid(LEVELS, (s) => 31.5 - 5 * s),
        e: grid(LEVELS, (s) => 31.2 + s),
      },
    });
    const tierOf = (id: string) => crossing.tiles.find((t) => t.captainId === id)?.tier;
    expect([tierOf('a'), tierOf('b'), tierOf('e'), tierOf('c')]).toEqual(['S', 'S', 'A', 'B']);
    expect(crossing.replaced).toEqual([]);
  });

  test('a hero another hero beats at every point of its own grid is Replaced, and leaves the tiers', () => {
    expect(result.replaced.map((r) => [r.captainId, r.by])).toEqual([
      ['b', 'a'],
      ['c', 'a'],
      ['d', 'a'],
    ]);
    expect(result.tiles.map((t) => t.captainId)).toEqual(['a']);
  });

  test('a hero the other does not reach everywhere is not replaced', () => {
    const partial = buildHeroChampion({
      heroes: [hero('a', 60), hero('b', 10)],
      ratings: { a: grid([60, 100], () => 30), b: grid([10, 60, 100], () => 10) },
    });
    expect(partial.replaced).toEqual([]);
  });

  test('each tile carries today, the potential and the star and level paths from where the hero stands', () => {
    const solo = buildHeroChampion({
      heroes: [hero('a', 50, 2)],
      ratings: { a: grid(LEVELS, (s, l) => s + l / 100) },
    });
    const t = solo.tiles[0]!;
    expect(t.today).toBeCloseTo(2.5);
    expect(t.potential).toBeCloseTo(7);
    expect(t.starPath.map((p) => p.star)).toEqual([2, 3, 4, 5, 6]);
    expect(t.starPath.every((p) => p.level === 50)).toBe(true);
    expect(t.levelPath.map((p) => p.level)).toEqual([50, 100]);
    expect(t.levelPath.every((p) => p.star === 2)).toBe(true);
  });
});

describe('trios', () => {
  const heroes = ['a', 'b', 'c', 'd'].map((id) => hero(id));
  const ratings = {
    a: grid(LEVELS, () => 30),
    b: grid(LEVELS, () => 28),
    c: grid(LEVELS, () => 26),
    d: grid(LEVELS, () => 5),
  };
  const ladder = (captainIds: string[], captainId: string, stars: number[], plans?: number) => ({
    captainIds,
    captainId,
    ...(plans === undefined ? {} : { plans }),
    level: 10,
    star: 0,
    stars,
    levels: [
      { level: 10, rating: stars[0]! },
      { level: 100, rating: stars[0]! + 1 },
    ],
  });

  test('the advised trio is the one with the highest ceiling, not the best today; members ordered by what they add', () => {
    const result = buildHeroChampion({
      heroes,
      ratings,
      trios: {
        now: [
          { captainIds: ['a', 'b', 'c'], rating: 40 },
          { captainIds: ['a', 'b', 'd'], rating: 39.8 },
        ],
        ladders: [
          ladder(['a', 'b', 'c'], 'a', [40, 41, 42, 42, 43, 43, 43]),
          ladder(['a', 'b', 'c'], 'b', [40, 40, 41, 41, 41, 41, 41]),
          ladder(['a', 'b', 'd'], 'a', [39.8, 41, 44, 45, 47, 50, 51]),
          ladder(['a', 'b', 'd'], 'd', [39.8, 40, 40, 40, 41, 41, 41]),
        ],
      },
    });
    expect(result.trios?.advised?.captainIds).toEqual(['a', 'b', 'd']);
    expect(result.trios?.advised?.order.map((m) => [m.captainId, m.gain])).toEqual([
      ['a', 11.2],
      ['d', 1.2],
    ]);
  });

  test('the advised trio members are told their valleys, from the ladder read on three plans', () => {
    const result = buildHeroChampion({
      heroes,
      ratings,
      trios: {
        now: [{ captainIds: ['a', 'b', 'c'], rating: 40 }],
        ladders: [ladder(['a', 'b', 'c'], 'a', [40, 42, 41, 46, 47, 48, 49], 3)],
      },
    });
    expect(result.trios?.advised?.order[0]?.valleys).toEqual([
      { kind: 'package', from: 1, dip: 2, to: 3, loss: 1, gain: 4 },
    ]);
  });

  test('a ladder read on one plan is told no valley: one plan is below the noise floor', () => {
    const result = buildHeroChampion({
      heroes,
      ratings,
      trios: {
        now: [{ captainIds: ['a', 'b', 'c'], rating: 40 }],
        ladders: [ladder(['a', 'b', 'c'], 'a', [40, 42, 41, 46, 47, 48, 49])],
      },
    });
    expect(result.trios?.advised?.order[0]?.valleys).toBeUndefined();
  });

  test('a ladder whose top star is below the one before stops there', () => {
    const result = buildHeroChampion({
      heroes,
      ratings,
      trios: {
        now: [{ captainIds: ['a', 'b', 'c'], rating: 40 }],
        ladders: [ladder(['a', 'b', 'c'], 'a', [40, 41, 42, 43, 44, 48, 45])],
      },
    });
    expect(result.trios?.advised?.order[0]).toMatchObject({ captainId: 'a', stopsAt: 5, gain: 8 });
  });

  test('a close trio with a member outside the solo podium is kept as a surprise', () => {
    const result = buildHeroChampion({
      heroes,
      ratings,
      podium: ['a', 'b', 'c'],
      trios: {
        now: [
          { captainIds: ['a', 'b', 'c'], rating: 40 },
          { captainIds: ['a', 'b', 'd'], rating: 38 },
          { captainIds: ['b', 'c', 'd'], rating: 10 },
        ],
        ladders: [],
      },
    });
    expect(result.trios?.surprising.map((t) => [t.captainIds, t.outsiders])).toEqual([
      [['a', 'b', 'd'], ['d']],
    ]);
    expect(result.trios?.advised).toBeNull();
  });
});

test('a solo-beaten hero that a kept trio needs is not Replaced', () => {
  const result = buildHeroChampion({
    heroes: [hero('a'), hero('d')],
    ratings: { a: grid(LEVELS, () => 30), d: grid(LEVELS, () => 5) },
    podium: ['a'],
    trios: { now: [{ captainIds: ['a', 'd', 'x'], rating: 40 }], ladders: [] },
  });
  expect(result.replaced).toEqual([]);
  expect(result.tiles.map((t) => t.captainId)).toEqual(['a', 'd']);
});
