/**
 * The battle kernel (AssemblyScript roadmap, step 1): one march's battle and bill, bit-identical to the
 * TypeScript engine, which stays the reference.
 *
 * Ported line for line from:
 *  - `marchResult` / `marchOf` (`src/engine/plan.ts`): the stacks in table order, fielded when count > 0, sorted
 *    by total HP descending with the kill-order rank breaking a tie (a stable sort);
 *  - `hitDamage` (`src/engine/units.ts`): `round((count × strength × (100 + sp + sa)) / 100)`;
 *  - `attackOrder`, `walkBattle`, `journalDamage`, `scoreOf` (`src/engine/battle.ts`);
 *  - `retrainOne`, `reviveOne`, `recoveryCosts(...).plan` (`src/engine/recovery.ts`), summed in kill order;
 *  - `marchBill`'s hired burn (`src/engine/retype.ts`) and `rate` (`src/engine/rating.ts`).
 *
 * The table layout is documented in `src/kernel/layout.ts` and mirrored in `./layout.ts`. Nothing allocates
 * per battle: `setTable` reserves every scratch array once.
 */
import {
  FAMILIES,
  H_ENEMY_SQUADS,
  H_HOUSING_AUTHORITY,
  H_HOUSING_DOMINANCE,
  H_HOUSING_LEADERSHIP,
  H_MODE,
  H_RATE_DRAGON_COINS,
  H_RATE_GOLD,
  H_RATE_HIRED,
  H_RATE_SECONDS,
  H_RATE_SILVER,
  H_TEMPLE_DIVISOR,
  H_TYPES,
  HEADER_SIZE,
  R_AUTHORITY_USED,
  R_AVG_DAMAGE,
  R_DAMAGE_PER_DRAGON_COIN,
  R_DAMAGE_PER_GOLD,
  R_DAMAGE_PER_SILVER,
  R_DOMINANCE_USED,
  R_DRAGON_COINS,
  R_GOLD,
  R_HIRED,
  R_LEADERSHIP_USED,
  R_MAX_DAMAGE,
  R_MIN_DAMAGE,
  R_SECONDS,
  R_SILVER,
  R_STACK_COUNT,
  RECORD_SIZE,
  T_BASE_STRENGTH,
  T_BRACKET,
  T_COST,
  T_FAMILY,
  T_FAMILY_REVIVED,
  T_HAS_TRAINING,
  T_HP,
  T_POOL,
  T_RANK,
  T_REDUCTION,
  T_REVIVAL_GOLD,
  T_SPEED,
  T_STR,
  T_TIER,
  T_TRAINING_DRAGON_COINS,
  T_TRAINING_SECONDS,
  T_TRAINING_SILVER,
  TYPE_STRIDE,
} from './layout';

export {
  H_ENEMY_SQUADS,
  H_HOUSING_AUTHORITY,
  H_HOUSING_DOMINANCE,
  H_HOUSING_LEADERSHIP,
  H_MODE,
  H_RATE_DRAGON_COINS,
  H_RATE_GOLD,
  H_RATE_HIRED,
  H_RATE_SECONDS,
  H_RATE_SILVER,
  H_TEMPLE_DIVISOR,
  H_TYPES,
  HEADER_SIZE,
  R_AUTHORITY_USED,
  R_AVG_DAMAGE,
  R_DAMAGE_PER_DRAGON_COIN,
  R_DAMAGE_PER_GOLD,
  R_DAMAGE_PER_SILVER,
  R_DOMINANCE_USED,
  R_DRAGON_COINS,
  R_GOLD,
  R_HIRED,
  R_LEADERSHIP_USED,
  R_MAX_DAMAGE,
  R_MIN_DAMAGE,
  R_SECONDS,
  R_SILVER,
  R_STACK_COUNT,
  RECORD_SIZE,
  T_BASE_STRENGTH,
  T_BRACKET,
  T_COST,
  T_FAMILY,
  T_FAMILY_REVIVED,
  T_HAS_TRAINING,
  T_HP,
  T_POOL,
  T_RANK,
  T_REDUCTION,
  T_REVIVAL_GOLD,
  T_SPEED,
  T_STR,
  T_TIER,
  T_TRAINING_DRAGON_COINS,
  T_TRAINING_SECONDS,
  T_TRAINING_SILVER,
  TYPE_STRIDE,
};

// ---- state -----------------------------------------------------------------------------------------------
let table: usize = 0;
let types: i32 = 0;
let enemySquads: i32 = 0;
let mode: i32 = 0;
let templeDivisor: f64 = 1;

// Scratch, one slot per type (a march fields at most one stack a type), reserved by `setTable`.
let stackType: usize = 0; // i32: type index of the k-th stack, kill order once sorted
let stackCount: usize = 0; // f64: its count
let stackHp: usize = 0; // f64: total HP
let stackDamage: usize = 0; // f64: damage of one hit
let stackBase: usize = 0; // f64: count × strengthPerUnit (attack order)
let attackers: usize = 0; // i32: stack indices in attack order
let dead: usize = 0; // u8
let acted: usize = 0; // u8
let topTier: usize = 0; // f64 × FAMILIES
let cursor: i32 = 0;

/** Bump allocation in linear memory (the JS side reserves the table, counts and records with it). */
export function alloc(bytes: usize): usize {
  return heap.alloc(bytes);
}

@inline function header(slot: i32): f64 {
  return load<f64>(table + ((<usize>slot) << 3));
}

@inline function cell(type: i32, slot: i32): f64 {
  return load<f64>(table + ((<usize>(HEADER_SIZE + type * TYPE_STRIDE + slot)) << 3));
}

@inline function i32At(base: usize, i: i32): i32 {
  return load<i32>(base + ((<usize>i) << 2));
}

@inline function f64At(base: usize, i: i32): f64 {
  return load<f64>(base + ((<usize>i) << 3));
}

/** JavaScript's `Math.round`: nearest integer, a tie toward +∞. */
@inline function jsRound(x: f64): f64 {
  const up = Math.ceil(x);
  return up - 0.5 > x ? up - 1.0 : up;
}

/** `chunks(count)` (`recovery.ts`): ceil(count / 10). */
@inline function chunks(count: f64): f64 {
  return Math.ceil(count / 10.0);
}

/** Point the kernel at a packed table (layout: `src/kernel/layout.ts`) and reserve its scratch. */
export function setTable(ptr: usize): void {
  table = ptr;
  types = <i32>header(H_TYPES);
  enemySquads = <i32>header(H_ENEMY_SQUADS);
  mode = <i32>header(H_MODE);
  templeDivisor = header(H_TEMPLE_DIVISOR);
  const n = <usize>max(types, 1);
  stackType = heap.alloc(n << 2);
  stackCount = heap.alloc(n << 3);
  stackHp = heap.alloc(n << 3);
  stackDamage = heap.alloc(n << 3);
  stackBase = heap.alloc(n << 3);
  attackers = heap.alloc(n << 2);
  dead = heap.alloc(n);
  acted = heap.alloc(n);
  topTier = heap.alloc(<usize>FAMILIES << 3);
}

// ---- the battle ------------------------------------------------------------------------------------------

/** `walkBattle`'s `attack()`: the next stack in attack order alive and not yet acted this round. */
function attack(k: i32): f64 {
  while (cursor < k) {
    const index = i32At(attackers, cursor);
    if (load<u8>(dead + <usize>index) == 0 && load<u8>(acted + <usize>index) == 0) {
      store<u8>(acted + <usize>index, 1);
      return f64At(stackDamage, index);
    }
    cursor += 1;
  }
  return 0.0;
}

/** `journalDamage`: the army lines of one orientation, summed in journal order. */
function journalDamage(k: i32, armyFirst: bool): f64 {
  if (k <= 0 || enemySquads <= 0) return 0.0;
  memory.fill(dead, 0, <usize>k);
  memory.fill(acted, 0, <usize>k);
  cursor = 0;
  let total: f64 = 0.0;
  if (armyFirst) total += attack(k);
  let killed = 0;
  while (killed < k) {
    for (let e = 0; e < enemySquads && killed < k; e += 1) {
      store<u8>(dead + <usize>killed, 1);
      killed += 1;
      if (e < enemySquads - 1 && killed < k) total += attack(k);
    }
    // End-of-round sweep: everyone still alive who has not struck this round, in attack order.
    for (let j = 0; j < k; j += 1) {
      const index = i32At(attackers, j);
      if (load<u8>(dead + <usize>index) == 0 && load<u8>(acted + <usize>index) == 0) {
        total += f64At(stackDamage, index);
      }
    }
    memory.fill(acted, 0, <usize>k);
    cursor = 0;
  }
  return total;
}

/** `reviveOne(...).gold`: ceil(((count − chunks) × revival.gold) / templeDivisor). */
@inline function reviveGold(type: i32, count: f64): f64 {
  return Math.ceil(((count - chunks(count)) * cell(type, T_REVIVAL_GOLD)) / templeDivisor);
}

/** One battle: counts at `countsPtr` (f64 × types), a record at `outPtr` (f64 × RECORD_SIZE). */
export function battle(countsPtr: usize, outPtr: usize): void {
  // Fielded stacks, table order (`marchResult`'s `picked`).
  let k = 0;
  let hired: f64 = 0.0;
  for (let t = 0; t < types; t += 1) {
    const count = f64At(countsPtr, t);
    // `marchBill`: chunks of every authority type's count, table order, fielded or not.
    if (<i32>cell(t, T_POOL) == 1) hired += chunks(count);
    if (count > 0) {
      store<i32>(stackType + ((<usize>k) << 2), t);
      store<f64>(stackCount + ((<usize>k) << 3), count);
      store<f64>(stackHp + ((<usize>k) << 3), count * cell(t, T_HP));
      k += 1;
    }
  }

  // Kill order: total HP descending, rank ascending on a tie; stable (insertion sort).
  for (let i = 1; i < k; i += 1) {
    const type = i32At(stackType, i);
    const count = f64At(stackCount, i);
    const hp = f64At(stackHp, i);
    const rank = cell(type, T_RANK);
    let j = i - 1;
    while (j >= 0) {
      const prevHp = f64At(stackHp, j);
      const prevRank = cell(i32At(stackType, j), T_RANK);
      if (!(hp > prevHp || (hp == prevHp && prevRank > rank))) break;
      store<i32>(stackType + ((<usize>(j + 1)) << 2), i32At(stackType, j));
      store<f64>(stackCount + ((<usize>(j + 1)) << 3), f64At(stackCount, j));
      store<f64>(stackHp + ((<usize>(j + 1)) << 3), prevHp);
      j -= 1;
    }
    store<i32>(stackType + ((<usize>(j + 1)) << 2), type);
    store<f64>(stackCount + ((<usize>(j + 1)) << 3), count);
    store<f64>(stackHp + ((<usize>(j + 1)) << 3), hp);
  }

  // Per-hit damage (`hitDamage`) and attack base, pool usage, in kill order.
  let leadership: f64 = 0.0;
  let authority: f64 = 0.0;
  let dominance: f64 = 0.0;
  for (let s = 0; s < k; s += 1) {
    const type = i32At(stackType, s);
    const count = f64At(stackCount, s);
    const scale = count * cell(type, T_BASE_STRENGTH);
    store<f64>(stackDamage + ((<usize>s) << 3), jsRound((scale * cell(type, T_BRACKET)) / 100.0));
    store<f64>(stackBase + ((<usize>s) << 3), count * cell(type, T_STR));
    const pool = <i32>cell(type, T_POOL);
    const used = count * cell(type, T_COST);
    if (pool == 0) leadership += used;
    else if (pool == 1) authority += used;
    else dominance += used;
  }

  // Attack order: base damage descending, kill order on a tie; stable (insertion sort).
  for (let i = 0; i < k; i += 1) {
    const base = f64At(stackBase, i);
    let j = i - 1;
    while (j >= 0 && f64At(stackBase, i32At(attackers, j)) < base) {
      store<i32>(attackers + ((<usize>(j + 1)) << 2), i32At(attackers, j));
      j -= 1;
    }
    store<i32>(attackers + ((<usize>(j + 1)) << 2), i);
  }

  const minimum = journalDamage(k, false);
  const maximum = journalDamage(k, true);

  // Recovery, the plan's mode, summed stack by stack in kill order (`recoveryCosts`).
  if (mode == 2) {
    for (let f = 0; f < FAMILIES; f += 1) store<f64>(topTier + ((<usize>f) << 3), -Infinity);
    for (let s = 0; s < k; s += 1) {
      const type = i32At(stackType, s);
      if (cell(type, T_FAMILY_REVIVED) == 0) continue;
      const slot = topTier + ((<usize>(<i32>cell(type, T_FAMILY))) << 3);
      const tier = cell(type, T_TIER);
      if (tier > load<f64>(slot)) store<f64>(slot, tier);
    }
  }
  let silver: f64 = 0.0;
  let gold: f64 = 0.0;
  let dragonCoins: f64 = 0.0;
  let seconds: f64 = 0.0;
  for (let s = 0; s < k; s += 1) {
    const type = i32At(stackType, s);
    const count = f64At(stackCount, s);
    const pool = <i32>cell(type, T_POOL);
    const trained = cell(type, T_HAS_TRAINING) != 0;
    let revive = mode == 1;
    if (mode == 2) {
      revive =
        cell(type, T_FAMILY_REVIVED) != 0 &&
        load<f64>(topTier + ((<usize>(<i32>cell(type, T_FAMILY))) << 3)) == cell(type, T_TIER);
    }
    if (revive) {
      // `reviveOne`
      const c = chunks(count);
      silver += trained ? c * cell(type, T_TRAINING_SILVER) * cell(type, T_REDUCTION) : 0.0;
      gold += reviveGold(type, count);
      dragonCoins += pool == 2 ? c * cell(type, T_TRAINING_DRAGON_COINS) : 0.0;
      seconds += trained ? (c * cell(type, T_TRAINING_SECONDS)) / cell(type, T_SPEED) : 0.0;
    } else {
      // `retrainOne`
      const billed = pool == 0 ? count : chunks(count);
      // Without a training block silver, coins and queue are nought, and `x + 0` is `x`.
      if (trained) {
        silver += billed * cell(type, T_TRAINING_SILVER) * cell(type, T_REDUCTION);
        dragonCoins += billed * cell(type, T_TRAINING_DRAGON_COINS);
        seconds += (billed * cell(type, T_TRAINING_SECONDS)) / cell(type, T_SPEED);
      }
      gold += pool == 1 ? reviveGold(type, count) : 0.0;
    }
  }
  silver = jsRound(silver);
  gold = jsRound(gold);
  dragonCoins = jsRound(dragonCoins);
  seconds = jsRound(seconds);

  // `scoreOf`
  const average = jsRound((minimum + maximum) / 2.0);
  store<f64>(outPtr + ((<usize>R_MIN_DAMAGE) << 3), minimum);
  store<f64>(outPtr + ((<usize>R_SILVER) << 3), silver);
  store<f64>(outPtr + ((<usize>R_GOLD) << 3), gold);
  store<f64>(outPtr + ((<usize>R_HIRED) << 3), hired);
  store<f64>(outPtr + ((<usize>R_DRAGON_COINS) << 3), dragonCoins);
  store<f64>(outPtr + ((<usize>R_SECONDS) << 3), seconds);
  store<f64>(outPtr + ((<usize>R_MAX_DAMAGE) << 3), jsRound(maximum));
  store<f64>(outPtr + ((<usize>R_AVG_DAMAGE) << 3), average);
  store<f64>(outPtr + ((<usize>R_LEADERSHIP_USED) << 3), leadership);
  store<f64>(outPtr + ((<usize>R_AUTHORITY_USED) << 3), authority);
  store<f64>(outPtr + ((<usize>R_DOMINANCE_USED) << 3), dominance);
  store<f64>(outPtr + ((<usize>R_DAMAGE_PER_SILVER) << 3), silver > 0 ? average / silver : 0.0);
  store<f64>(outPtr + ((<usize>R_DAMAGE_PER_GOLD) << 3), gold > 0 ? average / gold : 0.0);
  store<f64>(outPtr + ((<usize>R_DAMAGE_PER_DRAGON_COIN) << 3), dragonCoins > 0 ? average / dragonCoins : 0.0);
  store<f64>(outPtr + ((<usize>R_STACK_COUNT) << 3), <f64>k);
}

/** `n` battles: counts `types` f64 apart from `countsPtr`, records `RECORD_SIZE` f64 apart from `outPtr`. */
export function battleMany(n: i32, countsPtr: usize, outPtr: usize): void {
  const countsStride = (<usize>types) << 3;
  const recordStride = (<usize>RECORD_SIZE) << 3;
  for (let i = 0; i < n; i += 1) {
    battle(countsPtr + <usize>i * countsStride, outPtr + <usize>i * recordStride);
  }
}

// ---- the owner's rating ----------------------------------------------------------------------------------

/** `saved` (`rating.ts`): percent saved on a cost, 0 on a bill of nothing. */
@inline function saved(before: f64, after: f64): f64 {
  return before > 0 ? ((before - after) / before) * 100.0 : 0.0;
}

/**
 * `rate(before, after, rates)` on two bills (the first six slots of a record) with the table's rates. Bit c of
 * `mask` says cost c (silver, gold, hired, dragon coins, seconds) is on both bills.
 */
export function rate(beforePtr: usize, afterPtr: usize, mask: i32): f64 {
  const b = load<f64>(beforePtr);
  const a = load<f64>(afterPtr);
  let score = b > 0 ? ((a - b) / b) * 100.0 : 0.0;
  for (let c = 0; c < 5; c += 1) {
    if ((mask & (1 << c)) == 0) continue;
    const offset = (<usize>(1 + c)) << 3;
    score += saved(load<f64>(beforePtr + offset), load<f64>(afterPtr + offset)) / header(H_RATE_SILVER + c);
  }
  return score;
}

/** `rate(base, record i)` for `n` records, every cost present, written as f64 from `outPtr`. */
export function rateMany(n: i32, basePtr: usize, recordsPtr: usize, outPtr: usize): void {
  const recordStride = (<usize>RECORD_SIZE) << 3;
  for (let i = 0; i < n; i += 1) {
    store<f64>(outPtr + ((<usize>i) << 3), rate(basePtr, recordsPtr + <usize>i * recordStride, 0b11111));
  }
}
