/** B-25 seam 1 — the pure totals of the held talent ranks, and whether a "Hero Talents" source matches them. */
import { describe, expect, test } from 'vitest';

import type { TalentRecord } from '@/data/types';

import { talentCopy } from './talentCopy';

const node = (id: number, name: string, stats: string[], values: number[]): TalentRecord => ({
  id,
  name,
  tree: 'battle',
  maxRank: values.length,
  layout: { x: 0, y: 0, link: null, place: null, flipped: false },
  parents: [],
  stats,
  unitIds: [],
  values,
  costs: values.map(() => 1),
});

const meleeStrength = node(1, "Melee units' strength", ['UNIT_POWER'], [2, 4, 6]);
const meleeStrength2 = node(2, "Melee units' strength II", ['UNIT_POWER'], [1, 3]);
const rangedHealth = node(3, "Ranged units' health", ['UNIT_HEALTH'], [5, 10]);
const armyStrength = node(4, 'Army strength', ['UNIT_POWER'], [1, 2]);
const load = node(5, 'Army carrying capacity', ['UNIT_LOAD_CAPACITY'], [3, 6]);
const table = [meleeStrength, meleeStrength2, rangedHealth, armyStrength, load];

describe('talentCopy lines', () => {
  test('no ranks give no lines, nothing held, and an empty source is in sync', () => {
    const copy = talentCopy(table, {}, undefined);
    expect(copy.lines).toEqual({ strength: {}, health: {} });
    expect(copy.held).toBe(0);
    expect(copy.noEffect).toBe(0);
    expect(copy.inSync).toBe(true);
    expect(copy.differences).toEqual([]);
  });

  test('one rank gives the game running total on that key only', () => {
    const copy = talentCopy(table, { '1': 2 }, undefined);
    expect(copy.lines).toEqual({ strength: { melee: 4 }, health: {} });
    expect(copy.held).toBe(1);
  });

  test('two nodes on one key add up; health and strength stay apart', () => {
    const copy = talentCopy(table, { '1': 3, '2': 1, '3': 2 }, undefined);
    expect(copy.lines).toEqual({ strength: { melee: 7 }, health: { ranged: 10 } });
  });

  test('a talent the battle does not read counts only as no battle effect, and zero ranks are not held', () => {
    const copy = talentCopy(table, { '5': 2, '4': 0, '1': 1 }, undefined);
    expect(copy.lines).toEqual({ strength: { melee: 2 }, health: {} });
    expect(copy.noEffect).toBe(1);
    expect(copy.held).toBe(2);
  });

  test('a rank above the maximum reads as the maximum, an unknown node id is ignored', () => {
    const copy = talentCopy(table, { '3': 99, '999': 4 }, undefined);
    expect(copy.lines.health).toEqual({ ranged: 10 });
    expect(copy.held).toBe(1);
  });

  test('a node whose total is zero writes no line', () => {
    const zero = node(6, "Flying units' strength", ['UNIT_POWER'], [0, 0]);
    expect(talentCopy([zero], { '6': 2 }, undefined).lines).toEqual({ strength: {}, health: {} });
  });
});

describe('talentCopy sync', () => {
  const ranks = { '1': 3, '3': 1 };

  test('a source with the same lines is in sync, whatever its order, and a missing line is zero', () => {
    const source = { health: { ranged: 5, melee: 0 }, strength: { melee: 6, army: 0 } };
    const copy = talentCopy(table, ranks, source);
    expect(copy.inSync).toBe(true);
    expect(copy.differences).toEqual([]);
  });

  test('a one point difference is out of sync and named', () => {
    const copy = talentCopy(table, ranks, { strength: { melee: 5 }, health: { ranged: 5 } });
    expect(copy.inSync).toBe(false);
    expect(copy.differences).toEqual([{ line: 'strength', key: 'melee', tree: 6, source: 5 }]);
  });

  test('a line only the source holds is a difference against zero', () => {
    const copy = talentCopy(table, {}, { strength: { flying: 3 } });
    expect(copy.inSync).toBe(false);
    expect(copy.differences).toEqual([{ line: 'strength', key: 'flying', tree: 0, source: 3 }]);
  });

  test('differences are largest first and at most three', () => {
    const copy = talentCopy(
      table,
      { '1': 3, '3': 2, '4': 2 },
      { strength: { melee: 1, ranged: 4 }, health: { ranged: 10, melee: 1 } },
    );
    expect(copy.differences).toEqual([
      { line: 'strength', key: 'melee', tree: 6, source: 1 },
      { line: 'strength', key: 'ranged', tree: 0, source: 4 },
      { line: 'strength', key: 'army', tree: 2, source: 0 },
    ]);
  });
});

describe('talentCopy tolerance and clamp (review)', () => {
  const ranks = { '1': 3, '3': 1 };

  test('float noise is in sync, a 0.01 hand edit is not', () => {
    expect(talentCopy(table, ranks, { strength: { melee: 6 + 1e-12 }, health: { ranged: 5 } }).inSync).toBe(true);
    expect(talentCopy(table, ranks, { strength: { melee: 6.01 }, health: { ranged: 5 } }).inSync).toBe(false);
  });

  test('a rank above maxRank reads as maxRank even when the values run longer', () => {
    const long = { ...node(7, "Melee units' strength III", ['UNIT_POWER'], [1, 2, 3]), maxRank: 2 };
    expect(talentCopy([long], { '7': 3 }, undefined).lines).toEqual({ strength: { melee: 2 }, health: {} });
  });
});
