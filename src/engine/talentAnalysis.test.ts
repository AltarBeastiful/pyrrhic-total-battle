/** B-24 — the pure half of the talent analysis: which ranks are priced, and what a rank adds to the bonuses. */
import { describe, expect, test } from 'vitest';

import type { TalentRecord } from '@/data/types';

import { analysisRanks, analyzableTalents, meanOf, talentSource } from './talentAnalysis';

const node = (name: string, stats: string[], values: number[]): TalentRecord => ({
  id: 1,
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

describe('analysisRanks', () => {
  test('a talent with four ranks or fewer is priced at every rank, rank 0 first', () => {
    expect(analysisRanks(1)).toEqual([0, 1]);
    expect(analysisRanks(4)).toEqual([0, 1, 2, 3, 4]);
  });

  test('a longer talent is priced at 0, a quarter, a half, three quarters and the maximum', () => {
    expect(analysisRanks(20)).toEqual([0, 5, 10, 15, 20]);
    expect(analysisRanks(150)).toEqual([0, 38, 75, 113, 150]);
  });

  test('ranks are whole, sorted and unique for any maximum', () => {
    for (let max = 1; max <= 160; max++) {
      const ranks = analysisRanks(max);
      expect(ranks[0]).toBe(0);
      expect(ranks.at(-1)).toBe(max);
      expect(ranks.length).toBeLessThanOrEqual(5);
      expect(ranks).toEqual([...new Set(ranks)].sort((a, b) => a - b));
      expect(ranks.every(Number.isInteger)).toBe(true);
    }
  });
});

describe('talentSource', () => {
  test('a strength node adds its table value at the rank to the matching key', () => {
    const source = talentSource(node("Melee units' strength", ['UNIT_POWER'], [5, 12, 20]), 2);
    expect(source?.strength).toEqual({ melee: 12 });
    expect(source?.health).toBeUndefined();
  });

  test('a health node adds to health, and army strength to the army key', () => {
    expect(talentSource(node("Guardsmen's health", ['UNIT_HEALTH'], [10]), 1)?.health).toEqual({
      guardsmen: 10,
    });
    expect(talentSource(node('Army strength', ['UNIT_POWER'], [1, 2, 3]), 3)?.strength).toEqual({ army: 3 });
  });

  test('rank 0 adds nothing', () => {
    expect(talentSource(node("Melee units' strength", ['UNIT_POWER'], [5]), 0)?.strength).toBeUndefined();
  });

  test('a talent the battle does not read has no source', () => {
    expect(talentSource(node('Army carrying capacity', ['UNIT_LOAD_CAPACITY'], [5]), 1)).toBeNull();
    expect(talentSource(node('Strength of fortifications', ['UNIT_POWER'], [5]), 1)).toBeNull();
    expect(
      talentSource(node('Chance for guardsmen to deal double damage', ['UNIT_CRIT'], [1]), 1),
    ).toBeNull();
  });
});

describe('meanOf', () => {
  test('averages the shapes rank by rank', () => {
    expect(
      meanOf([
        [0, 2, 4],
        [0, 4, 8],
      ]),
    ).toEqual([0, 3, 6]);
  });

  test('no shapes gives no ranks', () => {
    expect(meanOf([])).toEqual([]);
  });
});

describe('analyzableTalents (B-28)', () => {
  const table = (): TalentRecord[] => [
    { ...node("Melee units' strength", ['UNIT_POWER'], [5, 10]), id: 1 },
    { ...node("Guardsmen's health", ['UNIT_HEALTH'], [3]), id: 2 },
    { ...node('Army carrying capacity', ['UNIT_LOAD_CAPACITY'], [5]), id: 3, tree: 'economy' },
    { ...node('Strength of fortifications', ['UNIT_POWER'], [5]), id: 4 },
  ];

  test('the set is whatever the rating can read, across trees, and the rest is counted', () => {
    const { rated, notRated } = analyzableTalents(table());
    expect(rated.map((t) => t.id)).toEqual([1, 2]);
    expect(notRated).toBe(2);
  });

  test('a talent that gains a battle effect joins with no list to edit', () => {
    const later: TalentRecord[] = [
      ...table(),
      { ...node("Mounted units' strength", ['UNIT_POWER'], [1]), id: 5, tree: 'archeology' },
    ];
    const { rated, notRated } = analyzableTalents(later);
    expect(rated.map((t) => t.id)).toEqual([1, 2, 5]);
    expect(notRated).toBe(2);
  });
});
