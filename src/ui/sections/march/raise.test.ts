/**
 * The sheltered raise (S-142): the ceiling, the two bounds the owner named, the order the spare housing is
 * spent in, and the one rule the control promises — it only ever goes up. The last test pins the ceiling to
 * the engine's own shelter (`shelterCounts`), so the line a stack is raised to and the line the plan lowers
 * a stack to cannot drift apart.
 */
import { expect, test } from 'vitest';

import { getUnits } from '@/data';
import { emptyTotals, shelterCounts, sizeStacks } from '@/engine';
import type { Pool, Stack, StackRequest, StackResult } from '@/engine/types';

import { applyCounts } from './manual';
import { inTens, raisedCounts, shelterCeiling, troopFloor } from './raise';
import type { RaiseModes } from './raise';

const UNITS = getUnits();
const RD1 = 'rider-1';
const RD3 = 'rider-3';
const HUNTER = 'epic-monster-hunter-6';
const MONSTER = 'ancient-terror';

const costOf = (unitId: string): number => UNITS.find((unit) => unit.id === unitId)?.cost ?? 0;

/** An engine stack reduced to what the raise reads: its pool, its count, its health a unit. */
function stack(unitId: string, pool: Pool, count: number, hpPerUnit: number): Stack {
  return {
    unitId,
    pool,
    count,
    hpPerUnit,
    totalHp: count * hpPerUnit,
    strengthPerUnit: 0,
    target: 'melee',
    damagePerHit: 0,
    featuresDamage: 0,
    doubleDamageChance: 0,
    strikeTwoSquadsChance: 0,
  };
}

const HOUSING = { leadership: 100_000, authority: 100_000, dominance: 100_000 };

/** The march as the raise reads it: the stacks, and what each pool has spent of its housing. */
function marchOf(stacks: Stack[], housing = HOUSING): StackResult {
  const used: Record<Pool, number> = { leadership: 0, authority: 0, dominance: 0 };
  for (const one of stacks) used[one.pool] += one.count * costOf(one.unitId);
  return {
    stacks,
    pools: {
      leadership: { used: used.leadership, capacity: housing.leadership },
      authority: { used: used.authority, capacity: housing.authority },
      dominance: { used: used.dominance, capacity: housing.dominance },
    },
    dropped: [],
    warnings: [],
  };
}

/** The whole request, not only the bounds: the `best` climb **replays the battle**, so it needs all of it. */
function request(overrides: Partial<StackRequest> = {}): StackRequest {
  return {
    units: UNITS,
    caps: {},
    housing: HOUSING,
    totals: emptyTotals(),
    options: { method: 'elite', strictMercsAboveMonsters: false, monstersLast: false, roundTo10: false },
    enemy: { flying: 1, melee: 1, ranged: 1, mounted: 1 },
    activeEvents: [],
    recovery: { templeLevel: 0, trainingCostReduction: {}, trainingSpeed: {}, plan: { mode: 'retrain' } },
    ...overrides,
  };
}

const MOST: RaiseModes = { authority: 'most', dominance: 'off' };
const TENS: RaiseModes = { authority: 'tens', dominance: 'off' };
const MONSTERS: RaiseModes = { authority: 'off', dominance: 'most' };
const BEST: RaiseModes = { authority: 'best', dominance: 'off' };

/** Two troop stacks of 1 000 000 HP apiece, so the floor every case stands under is 1 000 000. */
const TROOPS = [stack(RD3, 'leadership', 500, 2_000), stack(RD1, 'leadership', 400, 2_500)];

test('the ceiling is the engine’s own: the most units that sit strictly under the floor', () => {
  expect(shelterCeiling(1_000_000, 30_000)).toBe(33); // ceil(33.33) − 1: 990 000 < 1 000 000, 34 does not fit
  // A unit that divides the floor exactly still stops one short: a tie is not shelter.
  expect(shelterCeiling(900_000, 300_000)).toBe(2);
  expect(shelterCeiling(1_000_000, 1_000_001)).toBe(0);
  expect(shelterCeiling(0, 30_000)).toBe(0);
  expect(shelterCeiling(1_000_000, 0)).toBe(0);
});

test('the tens position rounds the ceiling down, never up', () => {
  expect(inTens(32)).toBe(30);
  expect(inTens(30)).toBe(30);
  expect(inTens(9)).toBe(0);
  expect(inTens(0)).toBe(0);
});

test('the floor is the lowest troop stack, and a march with no troops has none', () => {
  expect(troopFloor(marchOf(TROOPS))).toBe(1_000_000);
  // A troop typed down to nothing is not on the field.
  expect(
    troopFloor(marchOf([stack(RD3, 'leadership', 0, 2_000), stack(HUNTER, 'authority', 5, 30_000)])),
  ).toBeNull();
  expect(troopFloor(marchOf([stack(HUNTER, 'authority', 5, 30_000)]))).toBeNull();
});

test('both pools on “as is” asks for nothing at all', () => {
  const base = marchOf([...TROOPS, stack(HUNTER, 'authority', 5, 30_000)]);
  expect(raisedCounts(request(), base, { authority: 'off', dominance: 'off' })).toBeNull();
  // And nothing to raise on a march with no floor to stand under.
  expect(raisedCounts(request(), marchOf([stack(HUNTER, 'authority', 5, 30_000)]), MOST)).toBeNull();
});

test('a mercenary stack is raised to the ceiling the troops shelter', () => {
  const base = marchOf([...TROOPS, stack(HUNTER, 'authority', 5, 30_000)]);
  expect(raisedCounts(request(), base, MOST)).toEqual({ [HUNTER]: 33 });
});

test('the tens position stops at the last whole ten under the ceiling', () => {
  const base = marchOf([...TROOPS, stack(HUNTER, 'authority', 5, 30_000)]);
  expect(raisedCounts(request(), base, TENS)).toEqual({ [HUNTER]: 30 });
});

test('the tens position rounds a stock bound too: a count in tens is a count in tens', () => {
  const base = marchOf([...TROOPS, stack(HUNTER, 'authority', 5, 30_000)]);
  // A stock of 33 is what the account owns, and it is the bound that bites — but 33 is not a whole ten of
  // units, and the position the owner asked for is *"rounding to the nearest 10 number that's still
  // shielded"*, cap or no cap.
  expect(raisedCounts(request({ caps: { [HUNTER]: 33 } }), base, MOST)).toEqual({ [HUNTER]: 33 });
  expect(raisedCounts(request({ caps: { [HUNTER]: 33 } }), base, TENS)).toEqual({ [HUNTER]: 30 });
});

test('a mercenary stops at the stock the account owns', () => {
  const base = marchOf([...TROOPS, stack(HUNTER, 'authority', 5, 30_000)]);
  expect(raisedCounts(request({ caps: { [HUNTER]: 12 } }), base, MOST)).toEqual({ [HUNTER]: 12 });
  // Held in full: there is nothing left to raise, so the control asks for nothing.
  expect(raisedCounts(request({ caps: { [HUNTER]: 5 } }), base, MOST)).toBeNull();
});

test('a monster has no stock: the dominance pool is what bounds it', () => {
  const monsterHp = 400_000;
  const one = (): StackResult => marchOf([...TROOPS, stack(MONSTER, 'dominance', 1, monsterHp)]);
  // Two fit under the floor (2 × 400 000 < 1 000 000), and a wide pool pays for both.
  expect(raisedCounts(request(), one(), MONSTERS)).toEqual({ [MONSTER]: 2 });
  // A pool with room for one more unit: the raise takes what it can and stops.
  const forOne = request({ housing: { ...HOUSING, dominance: costOf(MONSTER) * 2 } });
  expect(raisedCounts(forOne, one(), MONSTERS)).toEqual({ [MONSTER]: 2 });
  // A pool with no room at all: nothing to ask for.
  const forNone = request({ housing: { ...HOUSING, dominance: costOf(MONSTER) } });
  expect(raisedCounts(forNone, one(), MONSTERS)).toBeNull();
});

test('the spare housing goes to the stack that strikes most: the last to fall', () => {
  // Two mercenary types, 30 000 HP a unit each — a ceiling of 32 apiece — and room for ten units only.
  const small = stack(HUNTER, 'authority', 4, 30_000);
  const big = stack('epic-monster-hunter-5', 'authority', 4, 30_000);
  const base = marchOf([...TROOPS, big, small]);
  const spare = 10 * costOf(HUNTER);
  const housing = { ...HOUSING, authority: base.pools.authority.used + spare };
  // `small` is the last in kill order, so it is served first and takes all ten.
  expect(raisedCounts(request({ housing }), base, MOST)).toEqual({ [small.unitId]: 14 });
});

test('the best position never loses damage, and never leaves the bounds', () => {
  const base = marchOf([...TROOPS, stack(HUNTER, 'authority', 5, 30_000)]);
  const counts = { [HUNTER]: 5 } as Record<string, number>;
  const at = (next: Record<string, number>): number =>
    applyCounts(request(), base, { ...counts, ...next }).summary.minDamage;

  const before = at({});
  const climbed = raisedCounts(request(), base, BEST);
  expect(climbed).not.toBeNull();
  const after = at(climbed ?? {});
  // The whole promise of the position (owner, 2026-09-29: *"defer the best damage option"*).
  expect(after).toBeGreaterThanOrEqual(before);
  // And it is still a raise under the same line: never over the ceiling, the stock or the housing.
  for (const [unitId, count] of Object.entries(climbed ?? {})) {
    const ceiling = shelterCeiling(1_000_000, 30_000);
    expect(count).toBeGreaterThanOrEqual(5);
    expect(count).toBeLessThanOrEqual(ceiling);
    expect(unitId).toBe(HUNTER);
  }
  // It answers the same line as `most` on a march where the units are the damage: one stack, nothing to
  // trade off, so both land on the ceiling.
  expect(climbed).toEqual(raisedCounts(request(), base, MOST));
});

test('the best position moves nothing when the stack is already at its ceiling', () => {
  const base = marchOf([...TROOPS, stack(HUNTER, 'authority', 33, 30_000)]);
  expect(raisedCounts(request(), base, BEST)).toBeNull();
});

test('the best position respects the stock and the pool like every other position', () => {
  const base = marchOf([...TROOPS, stack(HUNTER, 'authority', 5, 30_000)]);
  const held = raisedCounts(request({ caps: { [HUNTER]: 12 } }), base, BEST)?.[HUNTER] ?? 0;
  expect(held).toBeGreaterThanOrEqual(5);
  expect(held).toBeLessThanOrEqual(12);
  // A pool with no room at all: nothing to climb into.
  const none = request({ housing: { ...HOUSING, authority: costOf(HUNTER) * 5 } });
  expect(raisedCounts(none, base, BEST)).toBeNull();
});

test('the raise only ever goes up', () => {
  // A mercenary already over the line — a hand-typed count, a march the shelter does not reach — keeps it.
  const base = marchOf([...TROOPS, stack(HUNTER, 'authority', 90, 30_000)]);
  expect(raisedCounts(request(), base, MOST)).toBeNull();
  // And a stack above the tens ceiling but under the true one keeps its own count in the tens position.
  const odd = marchOf([...TROOPS, stack(HUNTER, 'authority', 31, 30_000)]);
  expect(raisedCounts(request(), odd, TENS)).toBeNull();
});

// ---- The one definition of the line ---------------------------------------------------------------
/** A whole march the engine sized itself, with the counts a hand edit would leave behind. */
function sizedRequest(): StackRequest {
  return {
    units: UNITS.filter((unit) => [RD3, RD1, HUNTER].includes(unit.id)),
    caps: {},
    housing: { leadership: 3_000, authority: 9_000, dominance: 0 },
    totals: emptyTotals(),
    options: { method: 'elite', strictMercsAboveMonsters: false, monstersLast: false, roundTo10: false },
    enemy: { flying: 1, melee: 1, ranged: 1, mounted: 1 },
    activeEvents: [],
    recovery: { templeLevel: 0, trainingCostReduction: {}, trainingSpeed: {}, plan: { mode: 'retrain' } },
  };
}

test('the ceiling is the same number the engine’s own shelter lowers a stack to', () => {
  const full = sizedRequest();
  const sized = sizeStacks(full);
  const merc = sized.stacks.find((one) => one.unitId === HUNTER);
  const floor = troopFloor(sized);
  expect(merc).toBeDefined();
  expect(floor).not.toBeNull();
  if (merc === undefined || floor === null) return;

  // `shelterCounts` only lowers, so it is asked about a count **above** the line — and it needs the troops
  // with it, because the line is theirs.
  const ceiling = shelterCeiling(floor, merc.hpPerUnit);
  const counts: Record<string, number> = {};
  for (const one of sized.stacks) counts[one.unitId] = one.unitId === HUNTER ? ceiling + 25 : one.count;
  expect(shelterCounts(full, counts)[HUNTER]).toBe(ceiling);

  // And the raise reaches the same number from below, with the pool wide enough that the line is what binds.
  const housing = {
    ...HOUSING,
    authority: ceiling * costOf(HUNTER) + 100,
    leadership: full.housing.leadership,
  };
  const below = marchOf(
    sized.stacks.map((one) => (one.unitId === HUNTER ? stack(HUNTER, 'authority', 1, one.hpPerUnit) : one)),
    housing,
  );
  expect(raisedCounts(request({ housing }), below, MOST)).toEqual({ [HUNTER]: ceiling });
});
