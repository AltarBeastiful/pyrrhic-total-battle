import { describe, expect, test } from 'vitest';

import {
  CAPTAIN_MAX_STAR,
  captainUpgrades,
  inLeadTrio,
  leadTrio,
  trioContaining,
  upgradeId,
} from './captainUpgrades';
import { trioKey } from './captains';

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

describe('leadTrio', () => {
  test('is the trio with the most gain over the stops', () => {
    const best = [
      { trio: 'b', gain: 2 },
      { trio: 'c', gain: 3 },
      { trio: 'b', gain: 2 },
    ];
    expect(leadTrio(best, 'now')).toBe('b');
  });

  test('is the current trio when no other gains', () => {
    expect(leadTrio([{ trio: 'now', gain: 0 }], 'now')).toBe('now');
    expect(leadTrio([], 'now')).toBe('now');
  });

  test('a tie goes to the trio reached first', () => {
    const best = [
      { trio: 'x', gain: 5 },
      { trio: 'y', gain: 5 },
    ];
    expect(leadTrio(best, 'now')).toBe('x');
  });
});

describe('trio membership', () => {
  test('a captain in the lead trio is found, one outside it is not', () => {
    expect(inLeadTrio({ captainId: 'a' }, ['a', 'b', 'c'])).toBe(true);
    expect(inLeadTrio({ captainId: 'd' }, ['a', 'b', 'c'])).toBe(false);
  });

  test('the trios that field a captain are those of the other captains’ pairs, once each', () => {
    const owned = ['a', 'b', 'c', 'd', 'e'].map((id) => entry(id));
    const trios = trioContaining(owned, 'c', everyone);
    expect(trios).toHaveLength(6);
    expect(trios.every((trio) => trio.some((c) => c.captainId === 'c'))).toBe(true);
    expect(new Set(trios.map((trio) => trioKey(trio.map((c) => c.captainId)))).size).toBe(6);
  });

  test('a small roster is the one set of all its captains', () => {
    const owned = ['a', 'b'].map((id) => entry(id));
    expect(trioContaining(owned, 'b', everyone)).toHaveLength(1);
  });

  test('a captain the march type does not count is in no trio', () => {
    const owned = ['a', 'b', 'c', 'd'].map((id) => entry(id));
    expect(trioContaining(owned, 'a', (id) => id !== 'a')).toEqual([]);
  });
});
