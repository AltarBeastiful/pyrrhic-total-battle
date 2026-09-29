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

import { exactRaise, exhaustivePools } from './exact';
import { raiseSearchKey } from './raiseSearch';
import { applyCounts } from './manual';
import {
  EXHAUSTIVE_MODES,
  burnOf,
  inTens,
  isExhaustive,
  raisedCounts,
  shelterCeiling,
  troopFloor,
} from './raise';
import type { RaiseMode, RaiseModes } from './raise';

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
/**
 * **The damage climb, on the mercenaries' pool alone** (S-145). It is what an exhaustive position draws
 * from the first frame and what its search is seeded with; it was the `Best` segment until the benchmark
 * showed it never beat `safe`, so it is read out through an exhaustive mode rather than as a position.
 */
const CLIMB: RaiseModes = { authority: 'v2', dominance: 'off' };
/** The exhaustive search, on both pools — what pressing any of the three damage segments puts the control into. */
const V2: RaiseModes = { authority: 'v2', dominance: 'v2' };
/** The two capped readings of it (S-144): the same search under a budget of authority chunks. */
const SAFE: RaiseModes = { authority: 'safe', dominance: 'safe' };
const TIGHT: RaiseModes = { authority: 'tight', dominance: 'tight' };

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

test('the damage climb never loses damage, and never leaves the bounds', () => {
  const base = marchOf([...TROOPS, stack(HUNTER, 'authority', 5, 30_000)]);
  const counts = { [HUNTER]: 5 } as Record<string, number>;
  const at = (next: Record<string, number>): number =>
    applyCounts(request(), base, { ...counts, ...next }).summary.minDamage;

  const before = at({});
  const climbed = raisedCounts(request(), base, CLIMB);
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

test('the damage climb moves nothing when the stack is already at its ceiling', () => {
  const base = marchOf([...TROOPS, stack(HUNTER, 'authority', 33, 30_000)]);
  expect(raisedCounts(request(), base, CLIMB)).toBeNull();
});

test('the damage climb respects the stock and the pool like every other position', () => {
  const base = marchOf([...TROOPS, stack(HUNTER, 'authority', 5, 30_000)]);
  const held = raisedCounts(request({ caps: { [HUNTER]: 12 } }), base, CLIMB)?.[HUNTER] ?? 0;
  expect(held).toBeGreaterThanOrEqual(5);
  expect(held).toBeLessThanOrEqual(12);
  // A pool with no room at all: nothing to climb into.
  const none = request({ housing: { ...HOUSING, authority: costOf(HUNTER) * 5 } });
  expect(raisedCounts(none, base, CLIMB)).toBeNull();
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

// ---- The exhaustive position, `Best v2` (S-143b) ---------------------------------------------------
/**
 * A march with a hired stack of each pool, so the search has something to trade: two troops whose floor is
 * 1 000 000, one mercenary under it (a ceiling of 33) and one monster (a ceiling of 2).
 */
const BOTH_HIRED = (): StackResult =>
  marchOf([...TROOPS, stack(HUNTER, 'authority', 5, 30_000), stack(MONSTER, 'dominance', 1, 400_000)]);

test('the exhaustive position is only asked for where a control stands on it', () => {
  expect(exhaustivePools(V2)).toEqual(['authority', 'dominance']);
  // One pool on it: the search walks that pool's stacks and holds the other where its own position put it.
  expect(exhaustivePools({ authority: 'v2', dominance: 'most' })).toEqual(['authority']);
  // None: the three unit positions are answered without a search, so there is nothing to ask for.
  for (const mode of ['off', 'tens', 'most'] as const) {
    expect(exhaustivePools({ authority: mode, dominance: mode })).toEqual([]);
  }
});

test('an exhaustive position draws the climb from its first frame, and the search is never below it', () => {
  const base = BOTH_HIRED();
  /**
   * **`raisedCounts` answers an exhaustive mode with the damage climb** (S-143b, S-145): that is what the
   * March draws while the search is out. It is a legal march and not a placeholder — every stack at or above
   * the plan's own count, and never past what `Most` fields — and it is the search's own seed.
   */
  const drawn = raisedCounts(request(), base, V2);
  expect(drawn).not.toBeNull();
  const most = raisedCounts(request(), base, { authority: 'most', dominance: 'most' }) ?? {};
  for (const one of base.stacks) {
    const count = drawn?.[one.unitId] ?? one.count;
    expect(count).toBeGreaterThanOrEqual(one.count);
    expect(count).toBeLessThanOrEqual(most[one.unitId] ?? one.count);
  }

  const found = exactRaise(request(), base, V2);
  expect(found).not.toBeNull();
  if (found === null) return;
  const whole = (moves: Record<string, number> | null): Record<string, number> => ({
    ...marchCounts(base),
    ...moves,
  });
  const at = (moves: Record<string, number> | null): number =>
    applyCounts(request(), base, whole(moves)).summary.minDamage;
  expect(at({ ...drawn, ...found.counts })).toBeGreaterThanOrEqual(at(drawn));
});

test('the search walks both hired pools at once, and answers with a legal march', () => {
  const base = BOTH_HIRED();
  const found = exactRaise(request(), base, V2);
  expect(found).not.toBeNull();
  if (found === null) return;

  // **One box over both pools** — the joint search the owner asked for ("give another options for both"),
  // and the configuration experiment 181 measured.
  const mercCeiling = shelterCeiling(1_000_000, 30_000);
  const monsterCeiling = shelterCeiling(1_000_000, 400_000);
  expect(found.space).toBe((mercCeiling - 5 + 1) * (monsterCeiling - 1 + 1));
  expect(found.how).toBe('walked');

  // It is a raise under the same bounds as every other position: never fewer units than the plan's own,
  // never over a ceiling, never over the stock, never over the housing.
  const counts = { ...raisedCounts(request(), base, V2), ...found.counts };
  expect(counts[HUNTER] ?? 5).toBeGreaterThanOrEqual(5);
  expect(counts[HUNTER] ?? 5).toBeLessThanOrEqual(mercCeiling);
  expect(counts[MONSTER] ?? 1).toBeGreaterThanOrEqual(1);
  expect(counts[MONSTER] ?? 1).toBeLessThanOrEqual(monsterCeiling);
  const whole = { ...marchCounts(base), ...counts };
  for (const pool of ['authority', 'dominance'] as const) {
    let used = 0;
    for (const unit of UNITS) if (unit.pool === pool) used += (whole[unit.id] ?? 0) * unit.cost;
    expect(used).toBeLessThanOrEqual(HOUSING[pool]);
  }
});

test('the exhaustive answer never loses damage to the climb it is seeded with', () => {
  const base = BOTH_HIRED();
  const at = (moves: Record<string, number> | null): number =>
    applyCounts(request(), base, { ...marchCounts(base), ...moves }).summary.minDamage;

  const shipped = raisedCounts(request(), base, V2);
  const found = exactRaise(request(), base, V2);
  // The seed is the climb and the search takes strict improvements only, so this cannot be lower —
  // which is the promise the March leans on while the search is out (`raiseSearch.ts`).
  expect(at({ ...shipped, ...found?.counts })).toBeGreaterThanOrEqual(at(shipped));
});

test('the exhaustive position asks for nothing where there is nothing to move', () => {
  // No pool on it: the control was never drawn on `v2`.
  expect(exactRaise(request(), BOTH_HIRED(), MOST)).toBeNull();
  // No troops to shelter under: the same rule the other four positions live by.
  expect(exactRaise(request(), marchOf([stack(HUNTER, 'authority', 5, 30_000)]), V2)).toBeNull();
  // Every stack already at its ceiling.
  const full = marchOf([...TROOPS, stack(HUNTER, 'authority', 33, 30_000)]);
  expect(exactRaise(request(), full, V2)).toBeNull();
});

test('the same march answers the same counts every time', () => {
  const base = BOTH_HIRED();
  const first = exactRaise(request(), base, V2);
  const second = exactRaise(request(), base, V2);
  expect(first?.counts).toEqual(second?.counts);
});

/** The counts of a whole march, as `exactRaise` reads them — the test's own copy of `countsOf`. */
function marchCounts(base: StackResult): Record<string, number> {
  const out: Record<string, number> = {};
  for (const one of base.stacks) out[one.unitId] = one.count;
  return out;
}

test('the exhaustive answer carries every stack it walked, not only the ones it moved', () => {
  /**
   * **A defect the adversarial review of 2026-09-29 found** (S-143b). The answer used to be a *sparse* record,
   * diffed against the **plan's** own counts — but the March merges it over the shipped **`Best`**'s answer,
   * so wherever the search decided to come back *down* to the plan's count the seed's higher one silently
   * stayed. That is precisely the "two stacks only improve together" move the pairwise neighbourhood exists
   * for, so the vector on screen could be one the search never scored, and could sit below the climb it was
   * seeded with. Every walked stack is named now, moved or not.
   */
  const base = BOTH_HIRED();
  const found = exactRaise(request(), base, V2);
  expect(found).not.toBeNull();
  if (found === null) return;

  const seed = raisedCounts(request(), base, V2) ?? {};
  const walked = base.stacks
    .filter((one) => one.pool !== 'leadership' && one.count > 0)
    .map((one) => one.unitId);
  expect(walked.length).toBeGreaterThan(0);
  for (const unitId of walked) {
    // Named in the answer, so merging it over the seed replaces the seed's count rather than deferring to it.
    expect(found.counts).toHaveProperty(unitId);
    expect(found.counts[unitId]).toBeGreaterThanOrEqual(
      base.stacks.find((one) => one.unitId === unitId)?.count ?? 0,
    );
    // And the merged vector is what `exactRaise` itself scored: merging the answer over the seed cannot leave
    // a seed count standing where the search put a lower one.
    const merged = { ...seed, ...found.counts };
    expect(merged[unitId]).toBe(found.counts[unitId]);
  }
});

test('a march edit does not reuse the previous march’s answer', () => {
  /**
   * **The key names the result, not the run's stamp** (S-143b; `raiseSearch.ts`). `raiseSearchKey` is the one
   * comparison that decides whether a search is started, so this pins the property the March depends on: two
   * different results are two different keys **even when they carry the same `at`** — which is exactly what
   * `resizeMarch` produces, deliberately (*"the same run, re-sized"*).
   */
  const before = BOTH_HIRED();
  const after = marchOf([...TROOPS, stack(HUNTER, 'authority', 5, 30_000)]);
  expect(raiseSearchKey(before, V2)).not.toBe(raiseSearchKey(after, V2));
  // The march's own object is stable across renders, so the key is stable where the March has not moved.
  expect(raiseSearchKey(before, V2)).toBe(raiseSearchKey(before, V2));
  // And the position is part of it: moving the control is a different question and a different answer.
  expect(raiseSearchKey(before, V2)).not.toBe(raiseSearchKey(before, MOST));
});

/**
 * **The two capped positions** (S-144). `safe` and `tight` are the same search as `v2` under a budget of
 * authority chunks — the burn `marchOf` counts and the plan itself is ordered on — so each is held here to the
 * two things it promises: **it never spends more of the rare stock than the march it replaces** (`Best` for
 * `safe`, the plan's own counts for `tight`) and **it never loses damage to that same march**, because the
 * budget's own answer is where the search starts and the search takes strict improvements only.
 */
test('Safe never burns more than the Best it replaces, and never loses to it', () => {
  const base = BOTH_HIRED();
  const whole = (moves: Record<string, number> | null): Record<string, number> => ({
    ...marchCounts(base),
    ...moves,
  });
  const at = (moves: Record<string, number> | null): number =>
    applyCounts(request(), base, whole(moves)).summary.minDamage;

  const shipped = raisedCounts(request(), base, { authority: 'v2', dominance: 'v2' });
  const found = exactRaise(request(), base, SAFE);
  expect(found).not.toBeNull();
  if (found === null) return;
  const counts = whole({ ...shipped, ...found.counts });

  expect(burnOf(base, counts)).toBeLessThanOrEqual(burnOf(base, whole(shipped)));
  expect(at({ ...shipped, ...found.counts })).toBeGreaterThanOrEqual(at(shipped));
});

test('Tight never burns more than the plan’s own counts, and never loses to the plan’s own march', () => {
  const base = BOTH_HIRED();
  const whole = (moves: Record<string, number> | null): Record<string, number> => ({
    ...marchCounts(base),
    ...moves,
  });
  const at = (moves: Record<string, number> | null): number =>
    applyCounts(request(), base, whole(moves)).summary.minDamage;

  const found = exactRaise(request(), base, TIGHT);
  expect(found).not.toBeNull();
  if (found === null) return;

  // The plan's own march is five hunters and one monster: one chunk. The cap is that, so the search may not
  // reach a second chunk however much damage is behind it — and on this fixture it is a real bound: `v2`
  // answers the ceiling (33 hunters, four chunks) where `Tight` stops at ten.
  const own = marchCounts(base);
  expect(found.counts[HUNTER]).toBe(10);
  expect(found.counts[MONSTER]).toBe(2);
  expect(burnOf(base, whole(found.counts))).toBeLessThanOrEqual(burnOf(base, own));
  expect(at(found.counts)).toBeGreaterThanOrEqual(at(own));
  // And it is a **raise**: never fewer units than the plan fields, exactly as the other six positions — held
  // below the plain search by its budget rather than by anything about the counts themselves.
  const plain = exactRaise(request(), base, V2);
  if (plain !== null) {
    for (const one of base.stacks) {
      expect(found.counts[one.unitId] ?? one.count).toBeGreaterThanOrEqual(one.count);
    }
    expect(at(found.counts)).toBeLessThan(at(plain.counts));
  }
});

test('the burn is the mercenaries’ pool’s, so a cap on the monsters alone bounds nothing', () => {
  // S-102: a trained monster is a price paid in silver, queue and dragon coins, and not a stock that drains,
  // so `burnOf` counts authority chunks and a `safe`/`tight` on the dominance block is the plain `v2`.
  const base = BOTH_HIRED();
  const monsters = (mode: RaiseMode): Record<string, number> | null =>
    exactRaise(request(), base, { authority: 'off', dominance: mode })?.counts ?? null;
  expect(monsters('safe')).toEqual(monsters('v2'));
  expect(monsters('tight')).toEqual(monsters('v2'));
});

test('all three exhaustive positions are named by one question, and all three are the worker’s', () => {
  expect(EXHAUSTIVE_MODES).toEqual(['v2', 'safe', 'tight'] satisfies RaiseMode[]);
  for (const mode of EXHAUSTIVE_MODES) expect(isExhaustive(mode)).toBe(true);
  for (const mode of ['off', 'tens', 'most'] as const) expect(isExhaustive(mode)).toBe(false);
  // A mixed control: one block on a cap, the other on the plain search — both are walked, which is what the
  // worker's one search does with them.
  expect(exhaustivePools({ authority: 'safe', dominance: 'v2' })).toEqual(['authority', 'dominance']);
  expect(exhaustivePools({ authority: 'tight', dominance: 'most' })).toEqual(['authority']);
});
