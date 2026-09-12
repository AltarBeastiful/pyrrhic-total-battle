/** S-20 — bonus aggregation: additive percentages, kept "as entered", with a per-source breakdown. */
import { describe, expect, it } from 'vitest';

import { aggregateBonuses, emptyTotals, matchupBonus } from '../../src/engine/bonuses';
import { BONUS_KEYS, SPECIAL_KEYS } from '../../src/data/types';

describe('emptyTotals', () => {
  it('has every health, strength and special key at zero', () => {
    const totals = emptyTotals();
    for (const key of BONUS_KEYS) {
      expect(totals.health[key]).toBe(0);
      expect(totals.strength[key]).toBe(0);
    }
    for (const key of SPECIAL_KEYS) expect(totals.special[key]).toBe(0);
    expect(totals.matchup).toEqual([]);
    expect(totals.eventStrength).toBe(0);
  });

  it('is the identity of aggregateBonuses', () => {
    expect(aggregateBonuses([])).toEqual(emptyTotals());
  });
});

describe('aggregateBonuses', () => {
  const totals = aggregateBonuses([
    { id: 'pill-health', label: 'Personal Health Bonus', kind: 'other', health: { army: 25 } },
    { id: 'pill-strength', label: 'Personal Strength Bonus', kind: 'other', strength: { army: 25 } },
    {
      id: 'aydae',
      label: 'Aydae 20★0',
      kind: 'captain',
      health: { guardsmen: 20 },
      strength: { guardsmen: 20 },
    },
    {
      id: 'battlemaster',
      label: 'Battlemaster',
      kind: 'title',
      special: { doubleDamageChance: 5, strikeTwoSquadsChance: 5 },
    },
    {
      id: 'gauntlets',
      label: 'Gauntlets',
      kind: 'equipment',
      matchup: [{ attacker: 'melee', target: 'mounted', value: 39 }],
    },
    { id: 'ragnarok', label: 'Ragnarok — Fenrir', kind: 'event', eventStrength: 130 },
  ]);

  it('adds the percentages of every source without scaling them', () => {
    expect(totals.health.army).toBe(25);
    expect(totals.health.guardsmen).toBe(20);
    expect(totals.strength.army).toBe(25);
    expect(totals.special.doubleDamageChance).toBe(5);
    expect(totals.special.strikeTwoSquadsChance).toBe(5);
    expect(totals.eventStrength).toBe(130);
  });

  it('records which source contributed what, for the breakdown drawer', () => {
    expect(totals.breakdown.health.guardsmen).toEqual([{ sourceId: 'aydae', value: 20 }]);
    expect(totals.breakdown.strength.army).toEqual([{ sourceId: 'pill-strength', value: 25 }]);
    expect(totals.breakdown.special.doubleDamageChance).toEqual([{ sourceId: 'battlemaster', value: 5 }]);
    // Keys nobody contributed to stay out of the breakdown even though the total exists at 0.
    expect(totals.breakdown.health.dragon).toBeUndefined();
  });

  it('collects matchup bonuses per attacker category and target', () => {
    expect(matchupBonus(totals.matchup, 'melee', 'mounted')).toBe(39);
    expect(matchupBonus(totals.matchup, 'melee', 'flying')).toBe(0);
    expect(matchupBonus(totals.matchup, 'ranged', 'mounted')).toBe(0);
    expect(matchupBonus(totals.matchup, undefined, 'mounted')).toBe(0);
  });

  it('sums two sources on the same key', () => {
    const summed = aggregateBonuses([
      { id: 'a', label: 'a', kind: 'custom', health: { army: 3 } },
      { id: 'b', label: 'b', kind: 'custom', health: { army: 39.5 } },
    ]);
    expect(summed.health.army).toBe(42.5);
    expect(summed.breakdown.health.army).toHaveLength(2);
  });
});
