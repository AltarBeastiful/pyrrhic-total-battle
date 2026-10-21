import { describe, expect, test } from 'vitest';

import {
  CAPTAIN_MAX_STAR,
  captainUpgrades,
  inferLevelGain,
  inLeadLineup,
  leadLineup,
  lineupContaining,
  upgradeId,
  worthUpgrades,
} from './captainUpgrades';
import { lineupKey } from './captains';

const entry = (captainId: string, level = 10, star = 0) => ({
  id: `e-${captainId}-${String(level)}`,
  captainId,
  level,
  star,
});
const everyone = (): boolean => true;
/** One point a level and ten a star: every kind of upgrade adds something. */
const linear = (_captainId: string, level: number, star: number): number => level + 10 * star;

describe('captainUpgrades', () => {
  test('a captain below the top star has a star, a level and ten levels, in that order', () => {
    const specs = captainUpgrades([entry('a', 20, 2)], everyone, linear);
    expect(specs.map((spec) => spec.id)).toEqual([
      upgradeId('a', 'star'),
      upgradeId('a', 'level'),
      upgradeId('a', 'level10'),
    ]);
    expect(specs.map((spec) => spec.to)).toEqual([
      { level: 20, star: 3 },
      { level: 21, star: 2 },
      { level: 30, star: 2 },
    ]);
    expect(specs.every((spec) => spec.from.level === 20 && spec.from.star === 2)).toBe(true);
  });

  test('a captain at the top star has no star upgrade', () => {
    const kinds = captainUpgrades([entry('a', 20, CAPTAIN_MAX_STAR)], everyone, linear).map(
      (spec) => spec.kind,
    );
    expect(kinds).toEqual(['level', 'level10']);
  });

  test('an upgrade that adds nothing to the captain’s lines is not asked about', () => {
    // A captain whose stars table is flat from star 2 to 3, and whose levels count for nothing.
    const flat = (_id: string, _level: number, star: number): number => [0, 40, 40, 40][star] ?? 40;
    const kinds = captainUpgrades([entry('a', 5, 2)], everyone, flat).map((spec) => spec.kind);
    expect(kinds).toEqual([]);
    expect(captainUpgrades([entry('a', 5, 0)], everyone, flat).map((spec) => spec.kind)).toEqual(['star']);
  });

  test('a captain the march type does not count is left out', () => {
    const specs = captainUpgrades([entry('a'), entry('b')], (id) => id !== 'a', linear);
    expect(new Set(specs.map((spec) => spec.captainId))).toEqual(new Set(['b']));
  });

  test('the same captain entered twice is raised once, on its strongest entry', () => {
    const weak = { ...entry('a', 5), id: 'weak' };
    const strong = { ...entry('a', 9), id: 'strong' };
    const specs = captainUpgrades([weak, strong], everyone, linear);
    expect(new Set(specs.map((spec) => spec.entryId))).toEqual(new Set(['strong']));
    expect(specs).toHaveLength(3);
  });
});

describe('leadLineup', () => {
  test('is the lineup with the most gain over the stops', () => {
    const best = [
      { lineup: 'b', gain: 2 },
      { lineup: 'c', gain: 3 },
      { lineup: 'b', gain: 2 },
    ];
    expect(leadLineup(best, 'now')).toBe('b');
  });

  test('is the current lineup when no other gains', () => {
    expect(leadLineup([{ lineup: 'now', gain: 0 }], 'now')).toBe('now');
    expect(leadLineup([], 'now')).toBe('now');
  });

  test('a tie goes to the lineup reached first', () => {
    const best = [
      { lineup: 'x', gain: 5 },
      { lineup: 'y', gain: 5 },
    ];
    expect(leadLineup(best, 'now')).toBe('x');
  });
});

describe('lineup membership', () => {
  test('a captain in the lead lineup is found, one outside it is not', () => {
    expect(inLeadLineup({ captainId: 'a' }, ['a', 'b', 'c'])).toBe(true);
    expect(inLeadLineup({ captainId: 'd' }, ['a', 'b', 'c'])).toBe(false);
  });

  test('the lineups that field a captain are those of the other captains’ pairs, once each', () => {
    const owned = ['a', 'b', 'c', 'd', 'e'].map((id) => entry(id));
    const lineups = lineupContaining(owned, 'c', everyone);
    expect(lineups).toHaveLength(6);
    expect(lineups.every((lineup) => lineup.some((c) => c.captainId === 'c'))).toBe(true);
    expect(new Set(lineups.map((lineup) => lineupKey(lineup.map((c) => c.captainId)))).size).toBe(6);
  });

  test('a small roster is the one set of all its captains', () => {
    const owned = ['a', 'b'].map((id) => entry(id));
    expect(lineupContaining(owned, 'b', everyone)).toHaveLength(1);
  });

  test('a captain the march type does not count is in no lineup', () => {
    const owned = ['a', 'b', 'c', 'd'].map((id) => entry(id));
    expect(lineupContaining(owned, 'a', (id) => id !== 'a')).toEqual([]);
  });
});

describe('worthUpgrades', () => {
  const perLevel = (_id: string, level: number, star: number): number =>
    2 * level + ([0, 10, 40, 40, 120][star] ?? 120);
  const specs = (level: number, star: number, max = 100) =>
    worthUpgrades([entry('a', level, star)], everyone, perLevel, max);

  test('levels are probed at +5, +10 and +15, stars one by one and cumulative up to the top star', () => {
    const got = specs(20, 3, 100);
    expect(got.filter((s) => s.kind === 'level').map((s) => s.id)).toEqual([
      'captain:a:level+5',
      'captain:a:level+10',
      'captain:a:level+15',
    ]);
    expect(got.filter((s) => s.kind === 'level').map((s) => s.to.level)).toEqual([25, 30, 35]);
    expect(got.filter((s) => s.kind === 'star').map((s) => [s.id, s.to.star])).toEqual([
      ['captain:a:star+1', 4],
      ['captain:a:star+2', 5],
      ['captain:a:star+3', 6],
    ]);
    expect(got.every((s) => s.captainId === 'a' && s.from.level === 20 && s.from.star === 3)).toBe(true);
  });

  test('a level step is clamped to the max level, and a clamp that repeats the one before is dropped', () => {
    const got = specs(92, 6, 100).filter((s) => s.kind === 'level');
    expect(got.map((s) => [s.size, s.to.level])).toEqual([
      [5, 97],
      [8, 100],
    ]);
    expect(specs(100, 6, 100)).toEqual([]);
  });

  test('a captain with uneven level steps is probed at every level instead', () => {
    const uneven = (_id: string, level: number): number => (level <= 22 ? level : 22 + 5 * (level - 22));
    const got = worthUpgrades([entry('a', 20, 6)], everyone, uneven, 100);
    expect(got.map((s) => s.size)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
    expect(got.every((s) => s.exact)).toBe(true);
  });

  test('a star that adds nothing is not asked about', () => {
    const flat = (_id: string, level: number, star: number): number => level + ([0, 40, 40, 40][star] ?? 40);
    expect(worthUpgrades([entry('a', 20, 1)], everyone, flat, 20).filter((s) => s.kind === 'star')).toEqual(
      [],
    );
  });
});

describe('inferLevelGain', () => {
  const probes = [
    { levels: 5, bonus: 10, gain: 1 },
    { levels: 10, bonus: 20, gain: 3 },
    { levels: 15, bonus: 30, gain: 4 },
  ];

  test('scales the nearest probe by the bonus ratio', () => {
    expect(inferLevelGain(probes, { levels: 4, bonus: 8 })).toBeCloseTo(0.8);
    expect(inferLevelGain(probes, { levels: 8, bonus: 16 })).toBeCloseTo(3 * 0.8);
    expect(inferLevelGain(probes, { levels: 13, bonus: 26 })).toBeCloseTo(4 * (26 / 30));
  });

  test('a tie between two probes goes to the smaller one', () => {
    expect(inferLevelGain(probes, { levels: 7.5, bonus: 15 })).toBeCloseTo(1.5);
  });

  test('is 0 with no probe', () => {
    expect(inferLevelGain([], { levels: 3, bonus: 6 })).toBe(0);
  });
});
