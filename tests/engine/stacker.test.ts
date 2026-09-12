/**
 * S-23 regression tests — every case is a real TotalStack run captured in `tests/fixtures/`.
 *
 * Counts are asserted to ±1 unit (±2 where noted): TotalStack computes server-side and its rounding
 * tie-breaks are unknown, so the contract we hold ourselves to is "same flat profile, same pool fill, same
 * unit types kept or dropped". The HP profile is asserted as *non-increasing* along the returned kill order,
 * not strictly decreasing: TotalStack's own outputs contain ties (ep-8stacks ARC2 = SP2 = 97,470 and
 * SP3 = RD3 = 96,960), so PLAN §3.4's strict-ordering clause is not what the reference implementation does.
 * Ties are reported through `result.warnings` instead.
 */
import { describe, expect, it } from 'vitest';

import { simulateBattle } from '../../src/engine/battle';
import { buildKillOrder } from '../../src/engine/killOrder';
import { sizeStacks } from '../../src/engine/stacker';
import type { StackResult, UnitDef } from '../../src/engine/types';
import { countsByLabel, hpProfile, makeRequest, totalsFrom } from '../helpers/request';
import { mercenarySet, monsterSet, troopSet } from '../helpers/units';

const EP_TROOPS = troopSet('ARC1', 'SP2', 'ARC2', 'RD1', 'SP3', 'ARC3', 'RD2', 'RD3');
const EP_TROOPS_10 = troopSet('SW1', 'ARC1', 'SP1', 'SP2', 'ARC2', 'RD1', 'SP3', 'ARC3', 'RD2', 'RD3');
const TIER3_MONSTERS = monsterSet('WE', 'BB', 'ED', 'SG');
const DEFAULT_OPTIONS = {
  method: 'elite',
  strictMercsAboveMonsters: false,
  monstersLast: false,
  roundTo10: false,
} as const;

function expectCounts(
  result: StackResult,
  units: UnitDef[],
  expected: Record<string, number>,
  tolerance = 1,
): void {
  const actual = countsByLabel(result, units);
  for (const [label, count] of Object.entries(expected)) {
    expect(actual[label], `${label}: expected ~${count}, got ${actual[label]}`).toBeGreaterThanOrEqual(
      count - tolerance,
    );
    expect(actual[label], `${label}: expected ~${count}, got ${actual[label]}`).toBeLessThanOrEqual(
      count + tolerance,
    );
  }
}

function expectNonIncreasingHp(result: StackResult): void {
  for (let i = 1; i < result.stacks.length; i += 1) {
    expect(result.stacks[i]!.totalHp).toBeLessThanOrEqual(result.stacks[i - 1]!.totalHp);
  }
}

describe('Elite Preservation', () => {
  it('reproduces run ep-8stacks (8 troop types + 4 monsters, 3000/200)', () => {
    const units = [...EP_TROOPS, ...TIER3_MONSTERS];
    const result = sizeStacks(makeRequest({ units }));

    expectCounts(result, units, {
      ARC1: 655,
      SP2: 361,
      ARC2: 361,
      RD1: 327,
      SP3: 202,
      ARC3: 203,
      RD2: 181,
      RD3: 101,
    });
    // The monster pool reproduces exactly, fill included.
    expect(countsByLabel(result, units)).toMatchObject({ WE: 18, BB: 8, ED: 7, SG: 6 });
    expect(result.pools.leadership).toEqual({ used: 3000, capacity: 3000 });
    expect(result.pools.dominance).toEqual({ used: 199, capacity: 200 });
    expect(result.dropped).toEqual([]);
    expectNonIncreasingHp(result);

    // The flat profile, first to die first. TotalStack's own profile for this run spans 98,250 → 96,960
    // with two ties; ours spans the same range with the same endpoints.
    expect(hpProfile(result, units)).toEqual([
      'WE 102600',
      'ARC1 98250',
      'RD1 98100',
      'ARC2 97740',
      'SP2 97740',
      'ARC3 97440',
      'RD2 97200',
      'SP3 96960',
      'RD3 96960',
      'ED 94500',
      'BB 93600',
      'SG 93600',
    ]);
    expect(result.warnings).toContain('ARC2 and SP2 tie at 97,740 HP; the game decides which falls first.');
  });

  it('reproduces run ep-10stacks (SW1 and SP1 back in the formation)', () => {
    const units = [...EP_TROOPS_10, ...TIER3_MONSTERS];
    const result = sizeStacks(makeRequest({ units }));

    // ±2 on the three tier-1 stacks: they share hpPerUnit and cost, and TotalStack's remainder split
    // between them (SW1 459 / ARC1 455 / SP1 455) is not reproducible from a monotone HP ladder.
    expectCounts(result, units, { SW1: 459, ARC1: 455, SP1: 455, SP2: 251, ARC2: 251, RD1: 228 }, 2);
    expectCounts(result, units, { SP3: 140, ARC3: 141, RD2: 126, RD3: 70 });
    expect(countsByLabel(result, units)).toMatchObject({ WE: 18, BB: 8, ED: 7, SG: 6 });
    expect(result.pools.leadership.used).toBe(3000);
    expectNonIncreasingHp(result);
  });

  it('reproduces run bonus-eng-dom200-all (engineers in, army +25/+25, guardsmen +20/+20)', () => {
    const units = [...troopSet('CAT1', 'CAT2'), ...EP_TROOPS_10, ...TIER3_MONSTERS];
    const result = sizeStacks(
      makeRequest({
        units,
        totals: totalsFrom({
          health: { army: 25, guardsmen: 20 },
          strength: { army: 25, guardsmen: 20 },
        }),
      }),
    );

    // ±2: the engineers' 3,375 HP per unit is far too coarse for a flat profile, so the remainder lands
    // differently than in TotalStack's solve (it gives CAT2 23, we give 22).
    expectCounts(
      result,
      units,
      {
        SW1: 408,
        ARC1: 350,
        SP1: 349,
        SP2: 193,
        ARC2: 194,
        RD1: 175,
        SP3: 107,
        ARC3: 107,
        RD2: 97,
        RD3: 54,
        CAT1: 41,
        CAT2: 23,
      },
      2,
    );
    expect(result.pools.leadership.used).toBe(3000);
    expect(countsByLabel(result, units)).toMatchObject({ WE: 18, BB: 8, ED: 7, SG: 6 });
    // The engineers are ranked ahead of every other leadership troop, whatever their tier.
    expect(buildKillOrder(units, DEFAULT_OPTIONS).slice(0, 2)).toEqual(['catapult-1', 'catapult-2']);
  });
});

describe("M's Preservation", () => {
  it('reproduces run mp-10stacks (monsters squeezed under the lowest troop stack)', () => {
    const units = [...EP_TROOPS_10, ...TIER3_MONSTERS];
    const result = sizeStacks(makeRequest({ units, options: { method: 'ms' } }));

    expect(countsByLabel(result, units)).toMatchObject({ WE: 11, BB: 5, ED: 4, SG: 4 });
    expect(result.pools.dominance).toEqual({ used: 123, capacity: 200 });
    const troopFloor = Math.min(
      ...result.stacks.filter((stack) => stack.pool === 'leadership').map((stack) => stack.totalHp),
    );
    for (const stack of result.stacks.filter((stack) => stack.pool === 'dominance')) {
      expect(stack.totalHp).toBeLessThan(troopFloor);
    }
    expectNonIncreasingHp(result);
  });

  it('reproduces run mp-bear (Bear V capped at 1, Cyclops V dropped, monsters at 196)', () => {
    const units = [...EP_TROOPS, ...mercenarySet('BER5', 'CYC5'), ...TIER3_MONSTERS];
    const result = sizeStacks(
      makeRequest({
        units,
        caps: { 'bear-5': 6 },
        options: { method: 'ms' },
      }),
    );

    const counts = countsByLabel(result, units);
    expect(counts).toMatchObject({ BER5: 1, WE: 17, BB: 8, ED: 7, SG: 6 });
    expect(counts.CYC5).toBeUndefined();
    expect(result.dropped.map((entry) => entry.unitId)).toEqual(['cyclops-5']);
    expect(result.dropped[0]!.reason).toBe(
      'one of them alone (135,000 HP) is bigger than your smallest troop stack, so it could not fall after your troops',
    );
    expect(result.pools.leadership).toEqual({ used: 3000, capacity: 3000 });
    expect(result.pools.authority.used).toBe(21);
    expect(result.pools.dominance).toEqual({ used: 196, capacity: 200 });
    expectCounts(result, units, {
      ARC1: 655,
      SP2: 361,
      ARC2: 361,
      RD1: 327,
      SP3: 202,
      ARC3: 203,
      RD2: 181,
      RD3: 101,
    });
    expectNonIncreasingHp(result);
  });

  it('keeps every mercenary above every monster when the strict toggle is on', () => {
    const units = [...EP_TROOPS, ...mercenarySet('BER5'), ...TIER3_MONSTERS];
    const result = sizeStacks(
      makeRequest({
        units,
        caps: { 'bear-5': 6 },
        options: { method: 'ms', strictMercsAboveMonsters: true },
      }),
    );
    const mercFloor = Math.min(
      ...result.stacks.filter((stack) => stack.pool === 'authority').map((stack) => stack.totalHp),
    );
    for (const stack of result.stacks.filter((stack) => stack.pool === 'dominance')) {
      expect(stack.totalHp).toBeLessThan(mercFloor);
    }
    // The captured run does NOT enforce this (monsters sat above the Bear stack), hence the toggle.
    expect(result.pools.dominance.used).toBeLessThan(196);
  });
});

describe('Round to 10s', () => {
  it('reproduces run ep-round-to-10s (only Water Elemental survives, dominance 30)', () => {
    const units = [...EP_TROOPS, ...TIER3_MONSTERS];
    const result = sizeStacks(makeRequest({ units, options: { roundTo10: true } }));

    const counts = countsByLabel(result, units);
    expect(counts).toMatchObject({ WE: 10 });
    expect(result.pools.dominance).toEqual({ used: 30, capacity: 200 });
    expect(result.dropped.map((entry) => entry.unitId).sort()).toEqual([
      'battle-boar',
      'emerald-dragon',
      'stone-gargoyle',
    ]);
    for (const stack of result.stacks.filter((stack) => stack.pool !== 'leadership')) {
      expect(stack.count % 10).toBe(0);
    }
    expect(result.pools.leadership.used).toBe(3000);
    // Troops are re-sized around the rounded monsters; TotalStack's leadership solve for this run is more
    // spread out than its own unrounded one (ARC1 660 vs 655) and we do not reproduce that spread.
    expectCounts(result, units, { ARC1: 660, RD1: 329, RD3: 99 }, 6);
  });
});

describe('the review §3 run from the author account', () => {
  it('reproduces 930 / 929 / 464 / 514 / 513 / 143 with the mercenaries at their caps', () => {
    const troops = troopSet('ARC1', 'SP1', 'RD1', 'ARC2', 'SP2', 'RD3');
    const mercs = mercenarySet('EMH6', 'ABT6', 'LGN6', 'CHR6');
    const units = [...troops, ...mercs];
    const caps = {
      'epic-monster-hunter-6': 22,
      'arbalester-6': 24,
      'legionary-6': 23,
      'chariot-6': 12,
    };
    const result = sizeStacks(
      makeRequest({
        units,
        caps,
        housing: { leadership: 4100, authority: 2500, dominance: 0 },
        totals: totalsFrom({
          health: { guardsmen: 39.5, melee: 1, ranged: 1, mounted: 1, army: 3 },
          strength: { guardsmen: 76, army: 3 },
        }),
      }),
    );

    expectCounts(result, units, { ARC1: 930, SP1: 929, RD1: 464, ARC2: 514, SP2: 513, RD3: 143 });
    expect(countsByLabel(result, units)).toMatchObject({ EMH6: 22, ABT6: 24, LGN6: 23, CHR6: 12 });
    expect(result.pools.leadership).toEqual({ used: 4100, capacity: 4100 });
    expect(result.pools.authority.used).toBe(93);
    // "Boosted Health per unit 1,378" from the Rider 3 popup.
    expect(result.stacks.find((stack) => stack.unitId === 'rider-3')?.hpPerUnit).toBe(1378);
  });
});

describe('relaxed preservation (investigation 0003, D-04)', () => {
  const units = [...EP_TROOPS_10, ...TIER3_MONSTERS];

  it("reproduces TotalStack's Total Optimization counts (WE 11 / BB 6 / ED 5 / SG 4, dominance 136)", () => {
    const result = sizeStacks(makeRequest({ units, options: { method: 'ms', relaxedPreservation: true } }));
    expect(countsByLabel(result, units)).toMatchObject({ WE: 11, BB: 6, ED: 5, SG: 4 });
    expect(result.pools.dominance).toEqual({ used: 136, capacity: 200 });
    expect(result.pools.leadership.used).toBe(3000);
  });

  it("leaves M's Preservation untouched when the flag is off", () => {
    const plain = sizeStacks(makeRequest({ units, options: { method: 'ms' } }));
    const explicit = sizeStacks(
      makeRequest({ units, options: { method: 'ms', relaxedPreservation: false } }),
    );
    expect(countsByLabel(plain, units)).toMatchObject({ WE: 11, BB: 5, ED: 4, SG: 4 });
    expect(countsByLabel(explicit, units)).toEqual(countsByLabel(plain, units));
    expect(explicit.pools.dominance.used).toBe(123);
  });

  it('is ignored by Elite Preservation, which has no preservation ceiling to relax', () => {
    const relaxed = sizeStacks(makeRequest({ units, options: { relaxedPreservation: true } }));
    const plain = sizeStacks(makeRequest({ units }));
    expect(countsByLabel(relaxed, units)).toEqual(countsByLabel(plain, units));
  });

  it('warns which stacks now die before the lowest troop stack', () => {
    const result = sizeStacks(makeRequest({ units, options: { method: 'ms', relaxedPreservation: true } }));
    // Glossary wording (docs/design.md §7): the flag is called "Allow damage trades" everywhere a user
    // can read it, and the stacks are named by their pill label with the count they grew to.
    expect(result.warnings).toContain(
      'Allow damage trades grew BB to 6 and ED to 5; they now fall before RD3.',
    );
    // Both really are above the floor, and the stacks stay in true kill order.
    const troopFloor = Math.min(
      ...result.stacks.filter((stack) => stack.pool === 'leadership').map((stack) => stack.totalHp),
    );
    const relaxedStacks = result.stacks.filter(
      (stack) => stack.pool === 'dominance' && stack.totalHp >= troopFloor,
    );
    expect(relaxedStacks.map((stack) => stack.unitId).sort()).toEqual(['battle-boar', 'emerald-dragon']);
    expectNonIncreasingHp(result);
  });

  it('improves both the average and the minimum damage, which is the guard it uses', () => {
    const plainRequest = makeRequest({ units, options: { method: 'ms' } });
    const relaxedRequest = makeRequest({
      units,
      options: { method: 'ms', relaxedPreservation: true },
    });
    const plain = simulateBattle(sizeStacks(plainRequest), plainRequest);
    const relaxed = simulateBattle(sizeStacks(relaxedRequest), relaxedRequest);
    expect(relaxed.avgDamage).toBeGreaterThan(plain.avgDamage);
    expect(relaxed.minDamage).toBeGreaterThan(plain.minDamage);
    // The trade is paid in gold: two more monsters to bring back.
    expect(relaxed.recovery.gold).toBeGreaterThan(plain.recovery.gold);
  });

  it('grows a capped mercenary stack too (mp-bear army leaves authority nearly empty)', () => {
    const bearUnits = [...EP_TROOPS, ...mercenarySet('BER5'), ...TIER3_MONSTERS];
    const request = makeRequest({
      units: bearUnits,
      caps: { 'bear-5': 6 },
      options: { method: 'ms', relaxedPreservation: true },
    });
    const result = sizeStacks(request);
    expect(countsByLabel(result, bearUnits).BER5).toBeGreaterThan(1);
    expect(result.pools.authority.used).toBeLessThanOrEqual(1200);
  });
});

describe('pinned unit types', () => {
  it('keeps Cyclops V in the mp-bear march at one unit, above the preservation ceiling', () => {
    const units = [...EP_TROOPS, ...mercenarySet('BER5', 'CYC5'), ...TIER3_MONSTERS];
    const result = sizeStacks(
      makeRequest({
        units,
        caps: { 'bear-5': 6 },
        options: { method: 'ms' },
        pinned: ['cyclops-5'],
      }),
    );

    const counts = countsByLabel(result, units);
    // One Cyclops (43 authority) is the minimum, and the rest of the march is untouched: the Bear was
    // already ceiling-bound at 1 rather than capacity-bound, and the monsters live in another pool.
    expect(counts).toMatchObject({ CYC5: 1, BER5: 1, WE: 17, BB: 8, ED: 7, SG: 6 });
    expect(result.dropped).toEqual([]);
    expect(result.pools.authority.used).toBe(64); // 21 Bear + 43 Cyclops
    expect(result.pools.dominance).toEqual({ used: 196, capacity: 200 });
    expect(result.pools.leadership).toEqual({ used: 3000, capacity: 3000 });
    expectCounts(result, units, {
      ARC1: 655,
      SP2: 361,
      ARC2: 361,
      RD1: 327,
      SP3: 202,
      ARC3: 203,
      RD2: 181,
      RD3: 101,
    });

    expect(result.warnings).toContain(
      'CYC5 is pinned, and its stack (135,000 HP) is bigger than your smallest troop stack, so it falls before RD3.',
    );
    // It keeps its true place in the kill order: 135,000 HP is the first stack the enemy wipes.
    expect(result.stacks[0]?.unitId).toBe('cyclops-5');
    expectNonIncreasingHp(result);

    // M's Preservation still holds for everything that is not pinned.
    const troopFloor = Math.min(
      ...result.stacks.filter((stack) => stack.pool === 'leadership').map((stack) => stack.totalHp),
    );
    for (const stack of result.stacks) {
      if (stack.pool === 'leadership' || stack.unitId === 'cyclops-5') continue;
      expect(stack.totalHp).toBeLessThan(troopFloor);
    }
  });

  it('gives a pinned monster a whole chunk under round-to-10s and rebalances the pool around it', () => {
    const units = [...EP_TROOPS, ...TIER3_MONSTERS];
    const result = sizeStacks(
      makeRequest({ units, options: { roundTo10: true }, pinned: ['emerald-dragon'] }),
    );

    // The Dragon takes its 10 × 7 = 70 dominance first; the Water Elemental is then re-solved inside the
    // remaining 130 (16 units) and rounded down to 10, so the pool holds 100 of 200 instead of 30.
    expect(countsByLabel(result, units)).toMatchObject({ ED: 10, WE: 10 });
    expect(result.pools.dominance).toEqual({ used: 100, capacity: 200 });
    expect(result.dropped.map((entry) => entry.unitId).sort()).toEqual(['battle-boar', 'stone-gargoyle']);
    for (const stack of result.stacks.filter((stack) => stack.pool !== 'leadership')) {
      expect(stack.count % 10).toBe(0);
    }
    expect(result.pools.leadership.used).toBe(3000);
  });

  it('drops a pin whose minimum does not fit the housing, and says so', () => {
    const units = [...EP_TROOPS, ...TIER3_MONSTERS];
    const result = sizeStacks(
      makeRequest({
        units,
        housing: { dominance: 50 },
        options: { roundTo10: true },
        pinned: ['emerald-dragon'],
      }),
    );

    expect(countsByLabel(result, units).ED).toBeUndefined();
    expect(result.dropped).toContainEqual({
      unitId: 'emerald-dragon',
      reason: 'pinned, but even 10 of them do not fit in your dominance housing',
    });
  });

  it('ignores pinned ids that are not in the formation', () => {
    const units = [...EP_TROOPS, ...TIER3_MONSTERS];
    const plain = sizeStacks(makeRequest({ units, options: { method: 'ms' } }));
    const pinned = sizeStacks(
      makeRequest({ units, options: { method: 'ms' }, pinned: ['cyclops-5', 'not-a-unit'] }),
    );

    expect(countsByLabel(pinned, units)).toEqual(countsByLabel(plain, units));
    expect(pinned.dropped).toEqual(plain.dropped);
    expect(pinned.warnings).toEqual(plain.warnings);
  });

  it('changes nothing when the pinned type would be kept anyway', () => {
    const units = [...EP_TROOPS, ...TIER3_MONSTERS];
    const plain = sizeStacks(makeRequest({ units }));
    const pinned = sizeStacks(makeRequest({ units, pinned: ['water-elemental', 'archer-1'] }));

    expect(countsByLabel(pinned, units)).toEqual(countsByLabel(plain, units));
    expect(pinned.warnings).toEqual(plain.warnings);
  });
});
