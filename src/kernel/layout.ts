/**
 * **The kernel's memory layout — the one place it is written** (AssemblyScript roadmap, step 1).
 *
 * Every figure below is a slot of a `Float64Array` in the kernel's linear memory. `kernel/assembly/layout.ts`
 * mirrors these numbers constant for constant (AssemblyScript cannot import this file), and the kernel
 * exports its own copy as wasm globals so `tests/kernel/parity.test.ts` asserts the two agree.
 *
 * **Table** = a header of `HEADER_SIZE` slots, then `types` rows of `TYPE_STRIDE` slots, one per unit type in
 * `request.units` order (the order `effectiveTable` and `marchResult` read). Everything a battle and its bill
 * need is in it. Heroes, captains, equipment, events and every bonus reach the kernel only through it: they are
 * already folded into `request.totals`, which `effectiveUnit` reads into each row's HP, strength and
 * strength-against when `packRequest` (`./pack.ts`) builds the table.
 *
 * **Counts** = `types` slots per march, the count of each type (0 = not fielded).
 *
 * **Record** = what one battle writes, `RECORD_SIZE` slots. Its first six slots are a `Bill` (`rating.ts`) in
 * `rate`'s own order, so `rate` reads two records directly.
 */

/** Header slots. */
export const H = {
  /** Number of unit types (rows). */
  types: 0,
  /** `enemySquadCount(request.enemy)`. */
  enemySquads: 1,
  /** Recovery plan: 0 retrain, 1 revive, 2 selective. */
  mode: 2,
  housingLeadership: 3,
  housingAuthority: 4,
  housingDominance: 5,
  /** `templeDivisor(recovery.templeLevel)`. */
  templeDivisor: 6,
  /** `MarkerRates`, in `rate`'s order: silver, gold, hired, dragon coins, seconds. */
  rateSilver: 7,
  rateGold: 8,
  rateHired: 9,
  rateDragonCoins: 10,
  rateSeconds: 11,
} as const;
export const HEADER_SIZE = 16;

/** Per-type slots. */
export const T = {
  /** `Effective.hp`, integer HP of one unit. */
  hp: 0,
  /** `Effective.str`, boosted strength of one unit (the attack order's base). */
  str: 1,
  /** `unit.strength`, the base strength `hitDamage` scales. */
  baseStrength: 2,
  /** `100 + strengthPercent + strengthAgainst`, evaluated left to right exactly as `hitDamage` does. */
  bracket: 3,
  /** Housing cost of one unit in its pool. */
  cost: 4,
  /** 0 leadership, 1 authority, 2 dominance. */
  pool: 5,
  /** Kill-order rank (`Effective.rank`): breaks a total-HP tie. */
  rank: 6,
  /** 1 when the unit has a `training` block. */
  hasTraining: 7,
  trainingSilver: 8,
  trainingSeconds: 9,
  /** `training.dragonCoins ?? 0` (0 without training). */
  trainingDragonCoins: 10,
  /** `1 − trainingCostReduction[group] / 100`. */
  reduction: 11,
  /** `1 + trainingSpeed[group] / 100`. */
  speed: 12,
  /** `unit.revival.gold`. */
  revivalGold: 13,
  /** Index in `UNIT_FAMILIES`. */
  family: 14,
  tier: 15,
  /** 1 when the selective plan revives this type's family. */
  familyRevived: 16,
} as const;
export const TYPE_STRIDE = 20;

/** Record slots (one battle's result). 0–5 are a `Bill`. */
export const R = {
  /** `summary.minDamage` — the bill's damage. */
  minDamage: 0,
  silver: 1,
  gold: 2,
  /** Σ chunks of every authority type's count (`marchBill`). */
  hired: 3,
  dragonCoins: 4,
  seconds: 5,
  maxDamage: 6,
  avgDamage: 7,
  leadershipUsed: 8,
  authorityUsed: 9,
  dominanceUsed: 10,
  damagePerSilver: 11,
  damagePerGold: 12,
  damagePerDragonCoin: 13,
  stackCount: 14,
} as const;
export const RECORD_SIZE = 16;

/** `rate`'s cost mask: bit i set when cost i (silver, gold, hired, dragon coins, seconds) is on both bills. */
export const ALL_COSTS = 0b11111;
