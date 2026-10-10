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
  T_ELITE_RANK,
  T_ORDER,
  T_SIZER_RANK,
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
  T_ELITE_RANK,
  T_ORDER,
  T_SIZER_RANK,
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

/** What `recoveryOf` bills: the march's recovery, silver, gold, dragon coins and queue seconds, rounded. */
let bSilver: f64 = 0.0;
let bGold: f64 = 0.0;
let bDragonCoins: f64 = 0.0;
let bSeconds: f64 = 0.0;

/** The recovery bill of the `k` stacks in `stackType`/`stackCount`, kill order, under the plan's mode (`recoveryCosts`); into `bSilver` and its three. */
function recoveryOf(k: i32): void {
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
  bSilver = silver;
  bGold = gold;
  bDragonCoins = dragonCoins;
  bSeconds = seconds;
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

  recoveryOf(k);
  const silver = bSilver;
  const gold = bGold;
  const dragonCoins = bDragonCoins;
  const seconds = bSeconds;

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

// ---- the plan's hot path (AssemblyScript roadmap, step 2) -------------------------------------------------

/**
 * `marchOf` (`src/engine/plan.ts`) on `n` stacks given **in the caller's order** — row index at `rowsPtr` (i32),
 * count at `countsPtr` (f64) — against `enemy` squads. The stacks with a count above 0 are sorted the way
 * `marchOf` sorts them (total HP descending, the rank breaking a tie, stable over the caller's order), so a tie
 * the rank does not break falls exactly where it falls in the engine. Writes, from `outPtr` (f64):
 * 0 `round(enemy-first damage)`, 1 `round(hired share of it)`, 2 the silver, 3 the gold, 4 the chunks of
 * mercenaries lost, 5 the army lines of that journal — the bill `retrainOne` makes under the search's recovery:
 * temple divisor `searchTemple`, and each row's training cost reduction from `setSearchReduction` (none —
 * `SEARCH_RECOVERY`'s — until one is set). A training speed reaches none of these figures: it only divides
 * the queue, which the march does not report.
 */
export function march(n: i32, rowsPtr: usize, countsPtr: usize, enemy: i32, searchTemple: f64, outPtr: usize): void {
  const k = killOrder(n, rowsPtr, countsPtr);
  attackOrderOf(k);
  // `buildJournal(built, enemyStacks, false)`: the army lines, their sum and the authority stacks' share of it.
  let total: f64 = 0.0;
  let hired: f64 = 0.0;
  let hits: f64 = 0.0;
  if (k > 0 && enemy > 0) {
    memory.fill(dead, 0, <usize>k);
    memory.fill(acted, 0, <usize>k);
    cursor = 0;
    let killed = 0;
    while (killed < k) {
      for (let e = 0; e < enemy && killed < k; e += 1) {
        store<u8>(dead + <usize>killed, 1);
        killed += 1;
        if (e < enemy - 1 && killed < k) {
          const index = nextAttacker(k);
          if (index >= 0) {
            const d = f64At(stackDamage, index);
            total += d;
            hits += 1.0;
            if (<i32>cell(i32At(stackType, index), T_POOL) == 1) hired += d;
          }
        }
      }
      for (let j = 0; j < k; j += 1) {
        const index = i32At(attackers, j);
        if (load<u8>(dead + <usize>index) == 0 && load<u8>(acted + <usize>index) == 0) {
          const d = f64At(stackDamage, index);
          total += d;
          hits += 1.0;
          if (<i32>cell(i32At(stackType, index), T_POOL) == 1) hired += d;
        }
      }
      memory.fill(acted, 0, <usize>k);
      cursor = 0;
    }
  }
  // The bill, stack by stack in kill order: `retrainOne(unit, count, SEARCH_RECOVERY)`.
  let silver: f64 = 0.0;
  let gold: f64 = 0.0;
  let mercLost: f64 = 0.0;
  for (let s = 0; s < k; s += 1) {
    const type = i32At(stackType, s);
    const count = f64At(stackCount, s);
    const pool = <i32>cell(type, T_POOL);
    const billed = pool == 0 ? count : chunks(count);
    // `cost.silver = billed × training.silver × reduction`, the reduction `1 − percent / 100` of the search's
    // recovery (`1 − 0 / 100` under `SEARCH_RECOVERY`); 0 without training.
    const reduction: f64 = searchReduction == 0 ? 1.0 : f64At(searchReduction, type);
    silver += cell(type, T_HAS_TRAINING) != 0 ? billed * cell(type, T_TRAINING_SILVER) * reduction : 0.0;
    if (pool != 0) {
      gold +=
        pool == 1 ? Math.ceil(((count - chunks(count)) * cell(type, T_REVIVAL_GOLD)) / searchTemple) : 0.0;
      if (pool == 1) mercLost += chunks(count);
    }
  }
  store<f64>(outPtr, jsRound(total));
  store<f64>(outPtr + 8, jsRound(hired));
  store<f64>(outPtr + 16, silver);
  store<f64>(outPtr + 24, gold);
  store<f64>(outPtr + 32, mercLost);
  store<f64>(outPtr + 40, hits);
}

/**
 * The search recovery's training cost reduction, one f64 a row (`1 − trainingCostReduction[group] / 100`, as
 * `retrainOne` computes it), that `march` bills its silver with; 0 for none (`SEARCH_RECOVERY`, every row 1).
 * The request's own reductions are the table's (`T_REDUCTION`, `bill`): this is the yardstick the search
 * prices a march at, which the engine may set apart from the account's.
 */
let searchReduction: usize = 0;
export function setSearchReduction(ptr: usize): void {
  searchReduction = ptr;
}

/**
 * `recoveryCosts(stacks, units, request.recovery).plan` (`src/engine/recovery.ts`) on `n` stacks given in the
 * caller's order (rows at `rowsPtr`, counts at `countsPtr`; a count of 0 is left out, as `priceMarch` leaves
 * it out), summed **in that order**, each total rounded. Writes silver, gold, dragon coins, seconds from
 * `outPtr`.
 */
export function bill(n: i32, rowsPtr: usize, countsPtr: usize, outPtr: usize): void {
  let k = 0;
  for (let i = 0; i < n; i += 1) {
    const count = f64At(countsPtr, i);
    if (!(count > 0)) continue;
    store<i32>(stackType + ((<usize>k) << 2), i32At(rowsPtr, i));
    store<f64>(stackCount + ((<usize>k) << 3), count);
    k += 1;
  }
  recoveryBill(k, outPtr);
}

/** The stacks of `rowsPtr`/`countsPtr` with a count above 0, into `stackType`/`stackCount`/`stackHp`, kill order. */
function killOrder(n: i32, rowsPtr: usize, countsPtr: usize): i32 {
  return killOrderBy(n, rowsPtr, countsPtr, T_RANK);
}

/** Per-hit damage (`hitDamage`) and attack base of the `k` kill-ordered stacks, then the attack order. */
function attackOrderOf(k: i32): void {
  for (let s = 0; s < k; s += 1) {
    const type = i32At(stackType, s);
    const count = f64At(stackCount, s);
    const scale = count * cell(type, T_BASE_STRENGTH);
    store<f64>(stackDamage + ((<usize>s) << 3), jsRound((scale * cell(type, T_BRACKET)) / 100.0));
    store<f64>(stackBase + ((<usize>s) << 3), count * cell(type, T_STR));
  }
  for (let i = 0; i < k; i += 1) {
    const base = f64At(stackBase, i);
    let j = i - 1;
    while (j >= 0 && f64At(stackBase, i32At(attackers, j)) < base) {
      store<i32>(attackers + ((<usize>(j + 1)) << 2), i32At(attackers, j));
      j -= 1;
    }
    store<i32>(attackers + ((<usize>(j + 1)) << 2), i);
  }
}

/** `walkBattle`'s `attack()`, answering the stack index that strikes (−1 when none is left this round). */
function nextAttacker(k: i32): i32 {
  while (cursor < k) {
    const index = i32At(attackers, cursor);
    if (load<u8>(dead + <usize>index) == 0 && load<u8>(acted + <usize>index) == 0) {
      store<u8>(acted + <usize>index, 1);
      return index;
    }
    cursor += 1;
  }
  return -1;
}

/** The plan's recovery bill over the `k` stacks in `stackType`/`stackCount`, in that order (`recoveryCosts`). */
function recoveryBill(k: i32, outPtr: usize): void {
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
      const c = chunks(count);
      silver += trained ? c * cell(type, T_TRAINING_SILVER) * cell(type, T_REDUCTION) : 0.0;
      gold += reviveGold(type, count);
      dragonCoins += pool == 2 ? c * cell(type, T_TRAINING_DRAGON_COINS) : 0.0;
      seconds += trained ? (c * cell(type, T_TRAINING_SECONDS)) / cell(type, T_SPEED) : 0.0;
    } else {
      const billed = pool == 0 ? count : chunks(count);
      if (trained) {
        silver += billed * cell(type, T_TRAINING_SILVER) * cell(type, T_REDUCTION);
        dragonCoins += billed * cell(type, T_TRAINING_DRAGON_COINS);
        seconds += (billed * cell(type, T_TRAINING_SECONDS)) / cell(type, T_SPEED);
      }
      gold += pool == 1 ? reviveGold(type, count) : 0.0;
    }
  }
  store<f64>(outPtr, jsRound(silver));
  store<f64>(outPtr + 8, jsRound(gold));
  store<f64>(outPtr + 16, jsRound(dragonCoins));
  store<f64>(outPtr + 24, jsRound(seconds));
}

// ---- the sizer's pool (`sizePool`, `src/engine/stacker.ts`) --------------------------------------------------

/**
 * `sizePool(slots, capacity, { ceiling })` on `n` slots in rank order — HP, cost and cap at `hpPtr`, `costPtr`,
 * `capPtr` (f64) — with `ceiling` NaN for none and `spread` the engine's `RANK_SPREAD`. Writes each slot's count
 * at `countsPtr` (f64) and answers `capacity − rest`. Needs no table. The binary search's `usedBy(countsAt(h))`
 * is summed slot by slot in the engine's order, without the array.
 */
export function sizePool(
  n: i32,
  hpPtr: usize,
  costPtr: usize,
  capPtr: usize,
  capacity: f64,
  ceiling: f64,
  spread: f64,
  countsPtr: usize,
): f64 {
  const hasCeiling = !isNaN(ceiling);
  let maxHp: f64 = -Infinity;
  for (let i = 0; i < n; i += 1) maxHp = max(maxHp, f64At(hpPtr, i));
  let low: f64 = 0;
  let high: f64 = hasCeiling ? ceiling : (capacity + 1) * max(maxHp, 1.0);
  if (hasCeiling && usedAt(n, hpPtr, costPtr, capPtr, ceiling, spread) <= capacity) low = ceiling;
  else {
    for (let step = 0; step < 200; step += 1) {
      const mid = (low + high) / 2;
      const wasLow = low;
      const wasHigh = high;
      if (usedAt(n, hpPtr, costPtr, capPtr, mid, spread) <= capacity) low = mid;
      else high = mid;
      // A step that leaves both bounds bit for bit where they were is a fixed point — the next step reads
      // the same two numbers — so the other steps of the engine's 200 would change nothing (step 5).
      if (
        reinterpret<u64>(low) == reinterpret<u64>(wasLow) &&
        reinterpret<u64>(high) == reinterpret<u64>(wasHigh)
      )
        break;
    }
  }
  const delta = spread * low;
  let used: f64 = 0;
  for (let i = 0; i < n; i += 1) {
    const count = unitsFor(f64At(hpPtr, i), f64At(costPtr, i), f64At(capPtr, i), low - <f64>i * delta);
    store<f64>(countsPtr + ((<usize>i) << 3), count);
    used = used + count * f64At(costPtr, i);
  }
  let rest = capacity - used;
  let changed = true;
  while (changed && rest > 0) {
    changed = false;
    for (let i = 0; i < n; i += 1) {
      const hp = f64At(hpPtr, i);
      if (hp <= 0) continue;
      const cost = f64At(costPtr, i);
      const next = f64At(countsPtr, i) + 1;
      if (cost > rest || next > f64At(capPtr, i)) continue;
      if (hasCeiling && next * hp > ceiling) continue;
      store<f64>(countsPtr + ((<usize>i) << 3), next);
      rest -= cost;
      changed = true;
    }
  }
  return capacity - rest;
}

/** `unitsForTarget`. */
@inline function unitsFor(hp: f64, cost: f64, cap: f64, target: f64): f64 {
  if (hp <= 0 || cost <= 0) return 0;
  return max(0.0, min(Math.floor(target / hp), cap));
}

/** `usedBy(countsAt(ceilingHp))`. */
function usedAt(n: i32, hpPtr: usize, costPtr: usize, capPtr: usize, ceilingHp: f64, spread: f64): f64 {
  const delta = spread * ceilingHp;
  let sum: f64 = 0;
  for (let i = 0; i < n; i += 1) {
    const count = unitsFor(f64At(hpPtr, i), f64At(costPtr, i), f64At(capPtr, i), ceilingHp - <f64>i * delta);
    sum = sum + count * f64At(costPtr, i);
  }
  return sum;
}

// ---- the whole sizer (`sizeStacks`, `src/engine/stacker.ts`; AssemblyScript roadmap, step 3) -----------------

/** `sizeStacks`' option bits (mirrored by `SIZER_FLAGS` in `src/kernel/plan.ts`). */
const F_MS = 1; // `options.method === 'ms'`
const F_RELAXED = 2; // `options.relaxedPreservation === true`
const F_ROUND_TO_10 = 4; // `options.roundTo10`
const F_MONSTERS_LAST = 8; // `options.monstersLast`
const F_STRICT = 16; // `options.strictMercsAboveMonsters`

/** `MAX_RELAX_STEPS` and `CHUNK` (`stacker.ts`, `recovery.ts`). */
const MAX_RELAX_STEPS = 500;
const CHUNK: f64 = 10;

// Scratch of the sizer, one slot per type, reserved on its first call (`sizeStacks` needs a table).
let zRow: usize = 0; // i32: row of the i-th slot, rank order
let zHp: usize = 0; // f64
let zCost: usize = 0; // f64
let zCap: usize = 0; // f64
let zCount: usize = 0; // f64
let zSpread: f64 = 0;
/** The rank slot the sizer orders by: `T_ELITE_RANK`, or `T_SIZER_RANK` under a custom kill order. */
let zRankSlot: i32 = T_ELITE_RANK;
let zAvg: f64 = 0;
let zMin: f64 = 0;

/** `killOrder` with the rank read from `rankSlot`: the stacks with a count above 0, total HP descending. */
function killOrderBy(n: i32, rowsPtr: usize, countsPtr: usize, rankSlot: i32): i32 {
  let k = 0;
  for (let i = 0; i < n; i += 1) {
    const count = f64At(countsPtr, i);
    if (!(count > 0)) continue;
    const t = i32At(rowsPtr, i);
    store<i32>(stackType + ((<usize>k) << 2), t);
    store<f64>(stackCount + ((<usize>k) << 3), count);
    store<f64>(stackHp + ((<usize>k) << 3), count * cell(t, T_HP));
    k += 1;
  }
  for (let i = 1; i < k; i += 1) {
    const type = i32At(stackType, i);
    const count = f64At(stackCount, i);
    const hp = f64At(stackHp, i);
    const rank = cell(type, rankSlot);
    let j = i - 1;
    while (j >= 0) {
      const prevHp = f64At(stackHp, j);
      const prevRank = cell(i32At(stackType, j), rankSlot);
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
  return k;
}

/**
 * `relaxPreservation`'s `score()`: `simulateBattle` on `buildStacks(slots)` — the `n` slots' stacks in kill
 * order (total HP descending, the Elite rank on a tie), the two journal totals — into `zAvg` and `zMin`.
 */
function sizerScore(n: i32): void {
  if (isDefined(CENSUS)) cKillOrdersSizer += 1.0;
  const k = killOrderBy(n, zRow, zCount, zRankSlot);
  attackOrderOf(k);
  const minimum = journalDamage(k, false);
  const maximum = journalDamage(k, true);
  zMin = minimum;
  zAvg = jsRound((minimum + maximum) / 2.0);
}

/** `lowest(pool)`: the smallest total HP among the pool's live slots `from … to − 1`; NaN when none is live. */
function lowestOf(from: i32, to: i32): f64 {
  let low: f64 = NaN;
  for (let i = from; i < to; i += 1) {
    const count = f64At(zCount, i);
    if (!(count > 0)) continue;
    const hp = count * f64At(zHp, i);
    if (isNaN(low) || hp < low) low = hp;
  }
  return low;
}

/** `sizePool(slots, capacity, { ceiling })` on the slots `from … to − 1` (ceiling NaN for none). */
function sizePoolOf(from: i32, to: i32, capacity: f64, ceiling: f64): void {
  for (let i = from; i < to; i += 1) store<f64>(zCount + ((<usize>i) << 3), 0.0);
  if (to - from == 0 || capacity <= 0) return;
  const off = <usize>from << 3;
  sizePool(to - from, zHp + off, zCost + off, zCap + off, capacity, ceiling, zSpread, zCount + off);
}

/** `roundDownToChunks`: every count of the slots `from … to − 1` down to a multiple of ten. */
function roundDownOf(from: i32, to: i32): void {
  for (let i = from; i < to; i += 1) {
    const at = zCount + ((<usize>i) << 3);
    store<f64>(at, Math.floor(load<f64>(at) / CHUNK) * CHUNK);
  }
}

/** `poolUsage`: Σ count × cost over the slots `from … to − 1`, in slot order. */
function usageOf(from: i32, to: i32): f64 {
  let sum: f64 = 0;
  for (let i = from; i < to; i += 1) sum = sum + f64At(zCount, i) * f64At(zCost, i);
  return sum;
}

/**
 * **`sizeStacks(request).stacks`, the unit and the count of each** (`src/engine/stacker.ts`), on the `n` types of
 * `rowsPtr` (i32 rows of the bound table, `request.units` order) with their caps at `capsPtr` (f64,
 * `caps[id] ?? MAX_SAFE_INTEGER`), the three housings, the option bits `flags` (`F_*`) and `spread` the
 * engine's `RANK_SPREAD`. The slots are ranked by the table's Elite rank (`T_ELITE_RANK`) or, under a custom
 * kill order, by the ranks at `ranksPtr` (f64, one per type in `rowsPtr`'s order: its place in
 * `buildKillOrder(units, options)`; 0 for none), which the sizer writes into `T_SIZER_RANK` of those rows;
 * each pool is sized by `sizePool` in rank order (`byPool`: the slots stably grouped by pool, so a custom
 * list that interleaves the pools sizes each pool in its own order), the ceilings, the tens and the
 * relaxed-preservation walk exactly as the engine does them; the stacks are written in `buildStacks`' order
 * (total HP descending, the rank on a tie): row at `outRowsPtr` (i32), count at `outCountsPtr` (f64).
 * Answers the number of stacks, or −1 when it cannot answer the way the engine would (a NaN in a slot).
 */
export function sizeStacks(
  n: i32,
  rowsPtr: usize,
  capsPtr: usize,
  housingLeadership: f64,
  housingAuthority: f64,
  housingDominance: f64,
  flags: i32,
  spread: f64,
  outRowsPtr: usize,
  outCountsPtr: usize,
  ranksPtr: usize,
): i32 {
  if (zRow == 0) {
    const size = <usize>max(types, 1);
    zRow = heap.alloc(size << 2);
    zHp = heap.alloc(size << 3);
    zCost = heap.alloc(size << 3);
    zCap = heap.alloc(size << 3);
    zCount = heap.alloc(size << 3);
  }
  zSpread = spread;
  zRankSlot = T_ELITE_RANK;
  if (ranksPtr != 0) {
    zRankSlot = T_SIZER_RANK;
    for (let i = 0; i < n; i += 1) {
      const at = table + ((<usize>(HEADER_SIZE + i32At(rowsPtr, i) * TYPE_STRIDE + T_SIZER_RANK)) << 3);
      store<f64>(at, f64At(ranksPtr, i));
    }
  }
  const rankSlot = zRankSlot;
  // The slots in rank order (`slots.sort((a, b) => a.rank - b.rank)`), then grouped by pool, keeping that
  // order inside each (`byPool`): insertion by pool, then rank. The Elite rank's first key is the pool, so
  // under it the grouping changes nothing; a custom list may interleave the pools.
  for (let i = 0; i < n; i += 1) {
    const row = i32At(rowsPtr, i);
    const cap = f64At(capsPtr, i);
    const rank = cell(row, rankSlot);
    const pool = cell(row, T_POOL);
    let j = i - 1;
    while (j >= 0) {
      const before = i32At(zRow, j);
      const beforePool = cell(before, T_POOL);
      if (!(beforePool > pool || (beforePool == pool && cell(before, rankSlot) > rank))) break;
      store<i32>(zRow + ((<usize>(j + 1)) << 2), i32At(zRow, j));
      store<f64>(zCap + ((<usize>(j + 1)) << 3), f64At(zCap, j));
      j -= 1;
    }
    store<i32>(zRow + ((<usize>(j + 1)) << 2), row);
    store<f64>(zCap + ((<usize>(j + 1)) << 3), cap);
  }
  // The pools are contiguous now: find the two boundaries.
  let endLeadership = 0;
  let endAuthority = 0;
  for (let i = 0; i < n; i += 1) {
    const row = i32At(zRow, i);
    const pool = <i32>cell(row, T_POOL);
    if (pool == 0) endLeadership = i + 1;
    if (pool <= 1) endAuthority = i + 1;
    const hp = cell(row, T_HP);
    const cost = cell(row, T_COST);
    // A NaN would make the engine's ceilings NaN, which the kernel's `sizePool` hands back to the engine.
    if (isNaN(hp) || isNaN(cost) || isNaN(f64At(zCap, i))) return -1;
    store<f64>(zHp + ((<usize>i) << 3), hp);
    store<f64>(zCost + ((<usize>i) << 3), cost);
    store<f64>(zCount + ((<usize>i) << 3), 0.0);
  }
  const ms = (flags & F_MS) != 0;
  const roundTo10 = (flags & F_ROUND_TO_10) != 0;

  sizePoolOf(0, endLeadership, housingLeadership, NaN);
  const troopFloor = lowestOf(0, endLeadership);
  const hasFloor = !isNaN(troopFloor);
  const mercCeiling: f64 = ms && hasFloor ? troopFloor - 1 : NaN;
  sizePoolOf(endLeadership, endAuthority, housingAuthority, mercCeiling);
  if (roundTo10) roundDownOf(endLeadership, endAuthority);

  let monsterCeiling: f64 = NaN;
  let hasMonsterCeiling = false;
  if (ms && hasFloor) {
    monsterCeiling = troopFloor - 1;
    hasMonsterCeiling = true;
  } else if ((flags & F_MONSTERS_LAST) != 0 && hasFloor) {
    monsterCeiling = troopFloor - 1;
    hasMonsterCeiling = true;
  }
  if (ms && (flags & F_STRICT) != 0) {
    const mercFloor = lowestOf(endLeadership, endAuthority);
    if (!isNaN(mercFloor)) {
      monsterCeiling = Math.min(hasMonsterCeiling ? monsterCeiling : mercFloor - 1, mercFloor - 1);
      hasMonsterCeiling = true;
    }
  }
  sizePoolOf(endAuthority, n, housingDominance, monsterCeiling);
  if (roundTo10) roundDownOf(endAuthority, n);

  if (ms && (flags & F_RELAXED) != 0 && endLeadership < n) {
    // `relaxPreservation`: the candidates are every slot past the troops, in slot order.
    const step: f64 = roundTo10 ? CHUNK : 1;
    let usedAuthority = usageOf(endLeadership, endAuthority);
    let usedDominance = usageOf(endAuthority, n);
    sizerScore(n);
    let currentAvg = zAvg;
    let currentMin = zMin;
    for (let attempt = 0; attempt < MAX_RELAX_STEPS; attempt += 1) {
      let chosen = -1;
      let chosenAvg: f64 = 0;
      let chosenMin: f64 = 0;
      for (let i = endLeadership; i < n; i += 1) {
        const at = zCount + ((<usize>i) << 3);
        const count = load<f64>(at);
        const cost = f64At(zCost, i);
        if (count + step > f64At(zCap, i)) continue;
        if (i < endAuthority) {
          if (usedAuthority + cost * step > housingAuthority) continue;
        } else if (usedDominance + cost * step > housingDominance) continue;
        store<f64>(at, count + step);
        sizerScore(n);
        store<f64>(at, load<f64>(at) - step);
        if (chosen < 0 || zAvg > chosenAvg) {
          chosen = i;
          chosenAvg = zAvg;
          chosenMin = zMin;
        }
      }
      if (chosen < 0) break;
      if (chosenAvg <= currentAvg || chosenMin <= currentMin) break;
      const at = zCount + ((<usize>chosen) << 3);
      store<f64>(at, load<f64>(at) + step);
      if (chosen < endAuthority) usedAuthority += f64At(zCost, chosen) * step;
      else usedDominance += f64At(zCost, chosen) * step;
      currentAvg = chosenAvg;
      currentMin = chosenMin;
    }
  }

  // `buildStacks`: the live slots, total HP descending, the rank on a tie.
  if (isDefined(CENSUS)) cKillOrdersSizer += 1.0;
  const k = killOrderBy(n, zRow, zCount, rankSlot);
  for (let s = 0; s < k; s += 1) {
    store<i32>(outRowsPtr + ((<usize>s) << 2), i32At(stackType, s));
    store<f64>(outCountsPtr + ((<usize>s) << 3), f64At(stackCount, s));
  }
  return k;
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

// ---- every assignment of types to slots (experiment 175) -------------------------------------------------

/**
 * `enumerate`'s output slots (f64; mirrored by `ENUMERATION` in `src/kernel/index.ts`, not exported as globals
 * so the layout check stays the layout's), then three best assignments of `nSlots` i32 each from `assignPtr`.
 */
const E_BATTLES = 0;
const E_COMPLETE = 1;
const E_BEST_RATING = 2;
const E_BEST_GUARDED = 3;
const E_BEST_DAMAGE = 4;
const E_ADMISSIBLE = 5;
const E_POSITIVE = 6;
const E_SIZE = 8;

let eSlots: usize = 0; // f64 × nSlots: each slot's total HP
let eCands: usize = 0; // i32 × nCand: candidate type indices
let eRequired: usize = 0; // u8 × nCand: must be placed
let eCaps: usize = 0; // f64 × types
let eBase: usize = 0; // record of the march itself
let eOut: usize = 0;
let eAssignOut: usize = 0;
let eCounts: usize = 0; // f64 × types, scratch march
let eUsed: usize = 0; // u8 × nCand
let eAssign: usize = 0; // i32 × nSlots, the assignment being built
let eRec: usize = 0; // one record
let eLast: usize = 0; // i32 × nCand: the last slot a candidate fits (count within its cap), −1 if none
let eFirst: usize = 0; // i32 × nCand: the first slot a candidate fits, nSlots if none
let eDescending: bool = false;
let eNodes: f64 = 0;
let eMaxNodes: f64 = 0;
let eN: i32 = 0;
let eM: i32 = 0;
let ePools: i32 = 0;
let eMax: f64 = 0;
let eBattles: f64 = 0;
let eAbort: bool = false;
let eBestRating: f64 = -Infinity;
let eBestGuarded: f64 = -Infinity;
let eBestDamage: f64 = -Infinity;
let eAdmissible: f64 = 0;
let ePositive: f64 = 0;
let eLead: f64 = 0;
let eAuth: f64 = 0;
let eDom: f64 = 0;

@inline function copyAssign(which: i32): void {
  const to = eAssignOut + ((<usize>(which * eN)) << 2);
  memory.copy(to, eAssign, (<usize>eN) << 2);
}

function eLeaf(): void {
  if (eBattles >= eMax) {
    eAbort = true;
    return;
  }
  eBattles += 1.0;
  battle(eCounts, eRec);
  const damage = load<f64>(eRec + ((<usize>R_MIN_DAMAGE) << 3));
  const baseDamage = load<f64>(eBase + ((<usize>R_MIN_DAMAGE) << 3));
  if (damage > eBestDamage) {
    eBestDamage = damage;
    copyAssign(2);
  }
  // `retypeMarch`: admissible when it deals at least the march's worst-opening damage.
  if (damage < baseDamage - 1e-6) return;
  eAdmissible += 1.0;
  const score = rate(eBase, eRec, 0b11111);
  if (score > 1e-9) ePositive += 1.0;
  if (score > eBestRating) {
    eBestRating = score;
    copyAssign(0);
  }
  const silver = load<f64>(eRec + ((<usize>R_SILVER) << 3));
  if (silver <= load<f64>(eBase + ((<usize>R_SILVER) << 3)) && score > eBestGuarded) {
    eBestGuarded = score;
    copyAssign(1);
  }
}

function eWalk(slot: i32, unplaced: i32): void {
  if (eAbort) return;
  if (slot == eN) {
    if (unplaced == 0) eLeaf();
    return;
  }
  if (eNodes >= eMaxNodes) {
    eAbort = true;
    return;
  }
  eNodes += 1.0;
  // A required candidate still unplaced must fit some slot from this one on.
  if (unplaced > 0) {
    for (let c = 0; c < eM; c += 1) {
      if (load<u8>(eRequired + <usize>c) != 0 && load<u8>(eUsed + <usize>c) == 0 && i32At(eLast, c) < slot) return;
    }
    // Slots biggest first: the slots a candidate fits run from its first to the last (the count only grows
    // with the HP), so the required ones still unplaced can all be placed only if Hall's condition holds on
    // those nested ranges.
    if (eDescending) {
      for (let c = 0; c < eM; c += 1) {
        if (load<u8>(eRequired + <usize>c) == 0 || load<u8>(eUsed + <usize>c) != 0) continue;
        const from = i32At(eFirst, c);
        let need = 0;
        for (let d = 0; d < eM; d += 1) {
          if (load<u8>(eRequired + <usize>d) != 0 && load<u8>(eUsed + <usize>d) == 0 && i32At(eFirst, d) >= from)
            need += 1;
        }
        if (need > eN - max(from, slot)) return;
      }
    }
  }
  const hpSlot = f64At(eSlots, slot);
  for (let c = 0; c < eM; c += 1) {
    if (load<u8>(eUsed + <usize>c) != 0) continue;
    const required = load<u8>(eRequired + <usize>c) != 0;
    const left = unplaced - (required ? 1 : 0);
    // The required types still to place must find slots below this one.
    if (left > eN - slot - 1) continue;
    const type = i32At(eCands, c);
    // `retypeMarch`'s sizing: at least the slot's HP.
    const count = Math.ceil(hpSlot / cell(type, T_HP));
    if (count > f64At(eCaps, type)) continue;
    const pool = <i32>cell(type, T_POOL);
    const used = count * cell(type, T_COST);
    if (pool == 0) {
      if ((ePools & 1) != 0 && eLead + used > header(H_HOUSING_LEADERSHIP)) continue;
      eLead += used;
    } else if (pool == 1) {
      if ((ePools & 2) != 0 && eAuth + used > header(H_HOUSING_AUTHORITY)) continue;
      eAuth += used;
    } else {
      if ((ePools & 4) != 0 && eDom + used > header(H_HOUSING_DOMINANCE)) continue;
      eDom += used;
    }
    store<u8>(eUsed + <usize>c, 1);
    store<i32>(eAssign + ((<usize>slot) << 2), c);
    store<f64>(eCounts + ((<usize>type) << 3), count);
    eWalk(slot + 1, left);
    store<f64>(eCounts + ((<usize>type) << 3), 0.0);
    store<u8>(eUsed + <usize>c, 0);
    if (pool == 0) eLead -= used;
    else if (pool == 1) eAuth -= used;
    else eDom -= used;
    if (eAbort) return;
  }
}

/**
 * **Every injective assignment of `nCand` candidate types to `nSlots` slots** (experiment 175): each type sized
 * `ceil(slotHp / hp)` as `retypeMarch` sizes it, on top of `fixedPtr`'s counts (f64 × types; the candidates at
 * 0 there), each count at most `capsPtr`'s (f64 × types), the pools of `pools` (bit 0 leadership, 1 authority,
 * 2 dominance) within housing; every candidate flagged in `requiredPtr` (u8 × nCand) must be placed. Each
 * assignment is battled and rated against the record at `basePtr` with every cost. Stops after `maxBattles`.
 * Writes `E_SIZE` f64 at `outPtr` and three assignments (candidate index per slot; i32 × nSlots each) at
 * `assignPtr`: the best rating with damage held, the same with silver not rising, the most damage (any cost).
 * Also stops after 16 × `maxBattles` inner nodes of the walk (a required candidate left without a slot it
 * fits prunes its branch — and, slots biggest first, one where Hall's condition fails for them; the node cap
 * bounds a walk that prunes without battling).
 */
export function enumerate(
  nSlots: i32,
  slotsPtr: usize,
  nCand: i32,
  candPtr: usize,
  requiredPtr: usize,
  fixedPtr: usize,
  capsPtr: usize,
  pools: i32,
  basePtr: usize,
  maxBattles: f64,
  outPtr: usize,
  assignPtr: usize,
): void {
  if (eCounts == 0) {
    const n = <usize>max(types, 1);
    eCounts = heap.alloc(n << 3);
    eUsed = heap.alloc(n);
    eAssign = heap.alloc(n << 2);
    eLast = heap.alloc(n << 2);
    eFirst = heap.alloc(n << 2);
    eRec = heap.alloc(<usize>RECORD_SIZE << 3);
  }
  eSlots = slotsPtr;
  eCands = candPtr;
  eRequired = requiredPtr;
  eCaps = capsPtr;
  eBase = basePtr;
  eOut = outPtr;
  eAssignOut = assignPtr;
  eN = nSlots;
  eM = nCand;
  ePools = pools;
  eMax = maxBattles;
  eMaxNodes = maxBattles * 16.0;
  eNodes = 0;
  eBattles = 0;
  eAbort = false;
  eBestRating = -Infinity;
  eBestGuarded = -Infinity;
  eBestDamage = -Infinity;
  eAdmissible = 0;
  ePositive = 0;
  memory.copy(eCounts, fixedPtr, (<usize>types) << 3);
  memory.fill(eUsed, 0, <usize>max(nCand, 1));
  memory.fill(assignPtr, 0xff, (<usize>(3 * max(nSlots, 1))) << 2);
  eLead = 0;
  eAuth = 0;
  eDom = 0;
  let required = 0;
  for (let t = 0; t < types; t += 1) {
    const used = f64At(fixedPtr, t) * cell(t, T_COST);
    const pool = <i32>cell(t, T_POOL);
    if (pool == 0) eLead += used;
    else if (pool == 1) eAuth += used;
    else eDom += used;
  }
  for (let c = 0; c < nCand; c += 1) {
    if (load<u8>(requiredPtr + <usize>c) != 0) required += 1;
    const type = i32At(candPtr, c);
    let last = -1;
    let first = nSlots;
    for (let s = 0; s < nSlots; s += 1) {
      if (Math.ceil(f64At(slotsPtr, s) / cell(type, T_HP)) <= f64At(capsPtr, type)) {
        last = s;
        if (first == nSlots) first = s;
      }
    }
    store<i32>(eLast + ((<usize>c) << 2), last);
    store<i32>(eFirst + ((<usize>c) << 2), first);
  }
  eDescending = true;
  for (let s = 1; s < nSlots; s += 1) if (f64At(slotsPtr, s) > f64At(slotsPtr, s - 1)) eDescending = false;
  if (nSlots > 0) eWalk(0, required);
  store<f64>(outPtr + ((<usize>E_BATTLES) << 3), eBattles);
  store<f64>(outPtr + ((<usize>E_COMPLETE) << 3), eAbort ? 0.0 : 1.0);
  store<f64>(outPtr + ((<usize>E_BEST_RATING) << 3), eBestRating);
  store<f64>(outPtr + ((<usize>E_BEST_GUARDED) << 3), eBestGuarded);
  store<f64>(outPtr + ((<usize>E_BEST_DAMAGE) << 3), eBestDamage);
  store<f64>(outPtr + ((<usize>E_ADMISSIBLE) << 3), eAdmissible);
  store<f64>(outPtr + ((<usize>E_POSITIVE) << 3), ePositive);
}

// ---- the scorer's ladders (`makeScorer`, `src/engine/plan.ts`; AssemblyScript roadmap, step 4) -------------
//
// One ladder shape of the plan's scorer — the hired vector checked against the stock, the rungs built above
// its biggest stack, the hired stacks sheltered under the lowest rung, the housing, the march and its bill —
// in one call (`ladderShape`), and the final march's whole ladder grid in another (`ladderFinale`). Every
// expression is the engine's, in the engine's order (`ladder`, `shelterUnder`, `fitsHousing`, `lastsMarches`,
// `marchOf`, `recoveryCosts`), so each figure is the one the TypeScript computes. The rung order the scorer
// learns (`orderFor`) stays in the engine: a depth whose order is not learned yet is answered `LADDER_ENGINE`
// as soon as the ranking's ladder fits, which is where the engine would learn it.

const LADDER_NONE = 0; // the engine answers `null` (or skips the finale ladder)
const LADDER_SHAPE = 1; // a shape: rungs, sheltered vector and figures written
const LADDER_ENGINE = 2; // the engine must run this one (a rung order is learned there)

const G_TROOPS = 0; // i32 × types: the troop ranking's rows, weakest per HP first
const G_MERCS = 1; // i32 × types: the hired types' rows, the scorer's `mercTypes` order
const G_POWERS = 2; // f64 × 64: `rungPower(k)`
const G_ORDER = 3; // i32 × types: the rung order of one shape (in)
const G_VECTOR = 4; // f64 × types: the hired vector (in)
const G_HELD = 5; // f64 × types: what sustains each hired type (in)
const G_RUNGS = 6; // f64 × types: the rungs' counts (out)
const G_SHELTERED = 7; // f64 × types: the hired vector sheltered (out)
const G_OUT = 8; // f64 × 8: damage, hired damage, silver, gold, mercLost, strikes, bill silver
const G_DEPTHS = 9; // i32 × 32: the finale's depths
const G_GROWTHS = 10; // f64 × 32: the finale's growths
const G_LEARNED = 11; // i32 × 32: the finale's depths — 1 when its order is learned
const G_ORDER_LEN = 12; // i32 × 32: the length of each depth's order
const G_ORDERS = 13; // i32 × 32 × types: each depth's order
const G_STATUS = 14; // i32 × 32 × 32: each grid shape's answer (`ladderGrid`)
const G_GRID_RUNGS = 15; // f64 × 32 × 32 × types: each grid shape's rungs
const G_GRID_SHELTERED = 16; // f64 × 32 × 32 × types: each grid shape's sheltered vector
const G_GRID_OUT = 17; // f64 × 32 × 32 × 8: each grid shape's figures and bill
const G_SLOTS = 18;
const G_POWER_COUNT = 64;
const G_GRID = 32;

let gDir: usize = 0;
let gWorkRungs: usize = 0; // f64 × types
let gWorkShelter: usize = 0; // f64 × types
let gMarchRows: usize = 0; // i32 × types
let gMarchCounts: usize = 0; // f64 × types
let gFigures: usize = 0; // f64 × 8
let gOrderRows: usize = 0; // i32: the rows of the ladder being built, sheltered under and marched

@inline function gPtr(slot: i32): usize {
  return load<usize>(gDir + ((<usize>slot) << 2));
}

/** Reserve the ladders' scratch once per instance (after `setTable`); answers the pointer of `slot` (`G_*`). */
export function ladderScratch(slot: i32): usize {
  if (gDir == 0) {
    const n = <usize>max(types, 1);
    gDir = heap.alloc(<usize>G_SLOTS << 2);
    const grid = <usize>G_GRID;
    const slot = (s: i32, bytes: usize): void => {
      store<usize>(gDir + ((<usize>s) << 2), heap.alloc(bytes));
    };
    slot(G_TROOPS, n << 2);
    slot(G_MERCS, n << 2);
    slot(G_POWERS, <usize>G_POWER_COUNT << 3);
    slot(G_ORDER, n << 2);
    slot(G_VECTOR, n << 3);
    slot(G_HELD, n << 3);
    slot(G_RUNGS, n << 3);
    slot(G_SHELTERED, n << 3);
    slot(G_OUT, 8 << 3);
    slot(G_DEPTHS, grid << 2);
    slot(G_GROWTHS, grid << 3);
    slot(G_LEARNED, grid << 2);
    slot(G_ORDER_LEN, grid << 2);
    slot(G_ORDERS, (grid * n) << 2);
    slot(G_STATUS, (grid * grid) << 2);
    slot(G_GRID_RUNGS, (grid * grid * n) << 3);
    slot(G_GRID_SHELTERED, (grid * grid * n) << 3);
    slot(G_GRID_OUT, (grid * grid * 8) << 3);
    gWorkRungs = heap.alloc(n << 3);
    gWorkShelter = heap.alloc(n << 3);
    gMarchRows = heap.alloc(n << 2);
    gMarchCounts = heap.alloc(n << 3);
    gFigures = heap.alloc(8 << 3);
  }
  return gPtr(slot);
}

/** `lastsMarches(held, count)` for a count above 0. */
@inline function lasts(held: f64, count: f64): f64 {
  return Math.floor((held - count) / chunks(count)) + 1.0;
}

/**
 * `ladder(troops, len, mercenaryHp, gap, leadership, scale, order)` over the `len` rows at `orderPtr`: each
 * rung's count into `outPtr`; answers whether the leadership pays for it (the engine's `[]` otherwise).
 */
function buildLadder(len: i32, orderPtr: usize, mercenaryHp: f64, gap: f64, leadership: f64, scale: f64, outPtr: usize): bool {
  if (len == 0) return false;
  const floor = mercenaryHp * (1.0 + gap) * scale;
  const powers = gPtr(G_POWERS);
  let used: f64 = 0.0;
  for (let index = 0; index < len; index += 1) {
    const row = i32At(orderPtr, index);
    const hp = floor * f64At(powers, len - 1 - index);
    const count = Math.max(1.0, Math.floor(hp / cell(row, T_HP)));
    used += count * cell(row, T_COST);
    store<f64>(outPtr + ((<usize>index) << 3), count);
  }
  return used <= leadership;
}

/**
 * `shelterUnder(rungs, mercs)` over the `m` hired types (`G_MERCS`), only those with `mask` — every one, or
 * those with a count above 0 in `countsPtr` — counted as `mercs`; the others are written 0.
 */
function shelter(len: i32, rungsPtr: usize, m: i32, countsPtr: usize, onlyPositive: bool, outPtr: usize): void {
  const mercs = gPtr(G_MERCS);
  let floor: f64 = Infinity;
  for (let r = 0; r < len; r += 1) {
    floor = Math.min(floor, f64At(rungsPtr, r) * cell(i32At(gOrderRows, r), T_HP));
  }
  const lower = len > 0 && isFinite<f64>(floor) && floor > 0;
  for (let i = 0; i < m; i += 1) {
    const count = f64At(countsPtr, i);
    let out = count;
    if (onlyPositive && !(count > 0)) out = 0.0;
    else if (lower) {
      const hp = cell(i32At(mercs, i), T_HP);
      if (!(count * hp < floor || hp <= 0)) out = Math.max(0.0, Math.ceil(floor / hp) - 1.0);
    }
    store<f64>(outPtr + ((<usize>i) << 3), out);
  }
}

/**
 * `fitsHousing(housing, rungs, hired)` then `marchOf([...rungs, ...hired])`, the march's figures into
 * `gFigures`; answers false when the housing refuses it (no march then).
 */
function housedMarch(
  len: i32,
  rungsPtr: usize,
  m: i32,
  hiredPtr: usize,
  housed: bool,
  hL: f64,
  hA: f64,
  hD: f64,
  enemy: i32,
  searchTemple: f64,
): bool {
  const mercs = gPtr(G_MERCS);
  if (housed) {
    let leadership: f64 = 0.0;
    let authority: f64 = 0.0;
    let dominance: f64 = 0.0;
    for (let r = 0; r < len; r += 1) {
      const count = f64At(rungsPtr, r);
      if (count <= 0) continue;
      const row = i32At(gOrderRows, r);
      const used = count * cell(row, T_COST);
      const pool = <i32>cell(row, T_POOL);
      if (pool == 0) leadership += used;
      else if (pool == 1) authority += used;
      else dominance += used;
    }
    // `hired` is the fielded stacks only (a count above 0), where the rungs are every one the ladder built.
    for (let i = 0; i < m; i += 1) {
      const count = f64At(hiredPtr, i);
      if (!(count > 0)) continue;
      const row = i32At(mercs, i);
      const used = count * cell(row, T_COST);
      const pool = <i32>cell(row, T_POOL);
      if (pool == 0) leadership += used;
      else if (pool == 1) authority += used;
      else dominance += used;
    }
    if (!(leadership <= hL && authority <= hA && dominance <= hD)) return false;
  }
  let n = 0;
  for (let r = 0; r < len; r += 1) {
    store<i32>(gMarchRows + ((<usize>n) << 2), i32At(gOrderRows, r));
    store<f64>(gMarchCounts + ((<usize>n) << 3), f64At(rungsPtr, r));
    n += 1;
  }
  for (let i = 0; i < m; i += 1) {
    store<i32>(gMarchRows + ((<usize>n) << 2), i32At(mercs, i));
    store<f64>(gMarchCounts + ((<usize>n) << 3), f64At(hiredPtr, i));
    n += 1;
  }
  march(n, gMarchRows, gMarchCounts, enemy, searchTemple, gFigures);
  return true;
}

/**
 * The part of a ladder shape every depth and scale of one vector shares: the vector at `G_VECTOR` (the counts
 * already floored) fields something, `marches` is at least 1, the stock at `G_HELD` sustains every fielded
 * count that many marches (`lastsMarches`). Answers whether it does; the biggest hired stack's HP — what the
 * ladder is built above — into `gMercenaryHp`.
 */
let gMercenaryHp: f64 = 0.0;
function ladderPrelude(m: i32, marches: f64): bool {
  const mercs = gPtr(G_MERCS);
  const vector = gPtr(G_VECTOR);
  const held = gPtr(G_HELD);
  let fielded = false;
  for (let i = 0; i < m; i += 1) if (f64At(vector, i) > 0) fielded = true;
  if (!fielded || marches < 1) return false;
  for (let i = 0; i < m; i += 1) {
    const count = f64At(vector, i);
    if (count > 0 && lasts(f64At(held, i), count) < marches) return false;
  }
  let mercenaryHp: f64 = -Infinity;
  for (let i = 0; i < m; i += 1) {
    const count = f64At(vector, i);
    if (count > 0) mercenaryHp = Math.max(mercenaryHp, count * cell(i32At(mercs, i), T_HP));
  }
  gMercenaryHp = mercenaryHp;
  return true;
}

/**
 * One ladder shape once `ladderPrelude` passed: the ladder over the `len` rows at `orderPtr` (the ranking's
 * when not `learned`), the shelter, the housing, the march, the budget and (with `billed`) the bill, into
 * `rungsOut`, `shelteredOut` and `out` (six figures, then the bill's silver).
 */
function shapeInto(
  m: i32,
  len: i32,
  learned: bool,
  orderPtr: usize,
  scale: f64,
  gap: f64,
  leadership: f64,
  housed: bool,
  hL: f64,
  hA: f64,
  hD: f64,
  budgeted: bool,
  budgetPerMarch: f64,
  enemy: i32,
  searchTemple: f64,
  billed: bool,
  rungsOut: usize,
  shelteredOut: usize,
  out: usize,
): i32 {
  gOrderRows = orderPtr;
  if (!buildLadder(len, orderPtr, gMercenaryHp, gap, leadership, scale, rungsOut)) return LADDER_NONE;
  if (!learned) return LADDER_ENGINE;
  shelter(len, rungsOut, m, gPtr(G_VECTOR), false, shelteredOut);
  let fielded = false;
  for (let i = 0; i < m; i += 1) if (f64At(shelteredOut, i) > 0) fielded = true;
  if (!fielded) return LADDER_NONE;
  if (!housedMarch(len, rungsOut, m, shelteredOut, housed, hL, hA, hD, enemy, searchTemple)) return LADDER_NONE;
  for (let f = 0; f < 6; f += 1) store<f64>(out + ((<usize>f) << 3), f64At(gFigures, f));
  if (budgeted && f64At(out, 2) > budgetPerMarch) return LADDER_NONE;
  if (billed) {
    bill(len + m, gMarchRows, gMarchCounts, gFigures);
    store<f64>(out + 48, f64At(gFigures, 0));
  }
  return LADDER_SHAPE;
}

/**
 * **One ladder shape of the scorer** (`makeScorer`'s answer for a depth of 1 or more): the vector at
 * `G_VECTOR` (the counts already floored), `G_HELD` what sustains each type, the order at `G_ORDER` (`len`
 * rows; the ranking's when `learned` is 0). Answers `LADDER_NONE` where the scorer answers `null`,
 * `LADDER_ENGINE` where it would learn a rung order, else `LADDER_SHAPE` with the rungs at `G_RUNGS`, the
 * sheltered vector at `G_SHELTERED` and, at `G_OUT`, the march's six figures, then (with `billed`) the
 * rounded silver of `recoveryCosts(...).plan` over the fielded stacks, rungs first.
 */
export function ladderShape(
  m: i32,
  len: i32,
  learned: i32,
  marches: f64,
  scale: f64,
  gap: f64,
  leadership: f64,
  housed: i32,
  hL: f64,
  hA: f64,
  hD: f64,
  budgeted: i32,
  budgetPerMarch: f64,
  enemy: i32,
  searchTemple: f64,
  billed: i32,
): i32 {
  if (!ladderPrelude(m, marches)) return LADDER_NONE;
  return shapeInto(
    m,
    len,
    learned != 0,
    gPtr(G_ORDER),
    scale,
    gap,
    leadership,
    housed != 0,
    hL,
    hA,
    hD,
    budgeted != 0,
    budgetPerMarch,
    enemy,
    searchTemple,
    billed != 0,
    gPtr(G_RUNGS),
    gPtr(G_SHELTERED),
    gPtr(G_OUT),
  );
}

/**
 * **Every ladder shape of one vector** (`evaluateVector`'s grid): `ladderShape` at each of the `nDepths`
 * depths (orders at `G_ORDERS`, `G_ORDER_LEN`, `G_LEARNED`, as for `ladderFinale`) × `nGrowths` scales
 * (`G_GROWTHS`), shape `d × nGrowths + g` answered at `G_STATUS` with its rungs, sheltered vector and figures
 * at that index of `G_GRID_RUNGS`, `G_GRID_SHELTERED` (stride `types`) and `G_GRID_OUT` (stride 8).
 */
export function ladderGrid(
  m: i32,
  nDepths: i32,
  nGrowths: i32,
  marches: f64,
  gap: f64,
  leadership: f64,
  housed: i32,
  hL: f64,
  hA: f64,
  hD: f64,
  budgeted: i32,
  budgetPerMarch: f64,
  enemy: i32,
  searchTemple: f64,
): void {
  const status = gPtr(G_STATUS);
  const shapes = nDepths * nGrowths;
  if (!ladderPrelude(m, marches)) {
    for (let s = 0; s < shapes; s += 1) store<i32>(status + ((<usize>s) << 2), LADDER_NONE);
    return;
  }
  const n = <usize>max(types, 1);
  for (let d = 0; d < nDepths; d += 1) {
    const len = i32At(gPtr(G_ORDER_LEN), d);
    const learned = i32At(gPtr(G_LEARNED), d) != 0;
    const orderPtr = gPtr(G_ORDERS) + ((<usize>d * n) << 2);
    for (let g = 0; g < nGrowths; g += 1) {
      const s = d * nGrowths + g;
      const answer = shapeInto(
        m,
        len,
        learned,
        orderPtr,
        f64At(gPtr(G_GROWTHS), g),
        gap,
        leadership,
        housed != 0,
        hL,
        hA,
        hD,
        budgeted != 0,
        budgetPerMarch,
        enemy,
        searchTemple,
        true,
        gPtr(G_GRID_RUNGS) + ((<usize>s * n) << 3),
        gPtr(G_GRID_SHELTERED) + ((<usize>s * n) << 3),
        gPtr(G_GRID_OUT) + ((<usize>s * 8) << 3),
      );
      store<i32>(status + ((<usize>s) << 2), answer);
    }
  }
}

/**
 * **The final march's ladder grid** (`finaleFor`'s loop over depths × growths): the leftovers are the hired
 * types with a count above 0 at `G_VECTOR`, `nDepths` depths at `G_DEPTHS` (their orders at `G_ORDERS`,
 * `G_ORDER_LEN`, learned or the ranking's per `G_LEARNED`), `nGrowths` growths at `G_GROWTHS`. The best march
 * by damage (the first on a tie) under `budget` is written — rungs at `G_RUNGS`, the sheltered leftovers at
 * `G_SHELTERED` (0 for the rest), figures at `G_OUT` — and its index `depth × nGrowths + growth` answered;
 * −1 when none, −2 when the engine must run the grid (a rung order would be learned in it).
 */
export function ladderFinale(
  m: i32,
  nDepths: i32,
  nGrowths: i32,
  gap: f64,
  leadership: f64,
  housed: i32,
  hL: f64,
  hA: f64,
  hD: f64,
  budget: f64,
  enemy: i32,
  searchTemple: f64,
): i32 {
  const mercs = gPtr(G_MERCS);
  const leftovers = gPtr(G_VECTOR);
  let leftoverHp: f64 = -Infinity;
  for (let i = 0; i < m; i += 1) {
    const count = f64At(leftovers, i);
    if (count > 0) leftoverHp = Math.max(leftoverHp, count * cell(i32At(mercs, i), T_HP));
  }
  const n = <usize>max(types, 1);
  const outRungs = gPtr(G_RUNGS);
  const outSheltered = gPtr(G_SHELTERED);
  const out = gPtr(G_OUT);
  let best = -1;
  let bestDamage: f64 = 0.0;
  for (let d = 0; d < nDepths; d += 1) {
    const len = i32At(gPtr(G_ORDER_LEN), d);
    const learned = i32At(gPtr(G_LEARNED), d) != 0;
    gOrderRows = gPtr(G_ORDERS) + ((<usize>d * n) << 2);
    for (let g = 0; g < nGrowths; g += 1) {
      const growth = f64At(gPtr(G_GROWTHS), g);
      if (!buildLadder(len, gOrderRows, leftoverHp, gap, leadership, growth, gWorkRungs)) continue;
      if (!learned) return -2;
      shelter(len, gWorkRungs, m, leftovers, true, gWorkShelter);
      let any = false;
      for (let i = 0; i < m; i += 1) if (f64At(gWorkShelter, i) > 0) any = true;
      if (!any) continue;
      if (!housedMarch(len, gWorkRungs, m, gWorkShelter, housed != 0, hL, hA, hD, enemy, searchTemple)) continue;
      if (f64At(gFigures, 2) > budget) continue;
      const damage = f64At(gFigures, 0);
      if (best < 0 || damage > bestDamage) {
        best = d * nGrowths + g;
        bestDamage = damage;
        memory.copy(outRungs, gWorkRungs, (<usize>len) << 3);
        memory.copy(outSheltered, gWorkShelter, (<usize>m) << 3);
        memory.copy(out, gFigures, 6 << 3);
      }
    }
  }
  return best;
}


// ---- the sheltered raise (`raise.ts` / `exact.ts` of `src/ui/sections/march`; S-147) ----------------------

/**
 * **Which count every hired stack is raised to** (S-147): `raisedCounts` and `exactRaise` of the March's own
 * modules, in the kernel, so the app can price **every position at once** instead of one player's press at a
 * time. It is the destination `docs/plans/best-v2.md` §3 named for `src/engine/exact.ts`, which is the same
 * box search this section runs.
 *
 * The five positions are two questions and one box:
 *
 *  - `RAISE_TENS` · `RAISE_MOST` promise **units** — every live stack of a pool as high as the troops still
 *    shelter it, paid out of the spare housing from the bottom of the kill order up, rounded to a chunk of ten
 *    or exact (`raiseUnits`);
 *  - `RAISE_V2` · `RAISE_SAFE` · `RAISE_TIGHT` promise **damage**, answered exhaustively (`raiseSearch`): the
 *    climb (`raiseClimb`) is the seed, `RAISE_SAFE` may not burn more authority chunks than that seed and
 *    `RAISE_TIGHT` not more than the plan's own counts, and the box is walked whole where it fits and searched
 *    to convergence where it does not.
 *
 * **The score is the march's worst opening, read the way the March reads it** — `applyCounts`' own battle:
 * total HP descending with **the base march's own stack order** breaking a tie (`T_ORDER`), which is the one
 * place the app's two replays disagree (`docs/plans/best-v2.md` §5). Everything else — `hitDamage`, the attack
 * order, the enemy-first journal — is `battle`'s own arithmetic, unchanged.
 *
 * **`RAISE_TIGHT` ranks by the owner's rating, not by damage alone** (owner 2026-10-07, experiment 188): a
 * vector scores `rate(as is, {damage, silver, gold, hired})` over the table's rates (`raiseRating`), so an
 * extra unit is taken only when its damage is worth the silver, gold and hired burn it adds. The memo still
 * holds what a vector fights for — the position does not change that — and the rating is read off it.
 *
 * The answer is the **merge the March draws**, `{...raisedCounts, ...exactRaise}`, written as a count per type.
 */

/** The five positions, as `src/engine/fast.ts` numbers them (`RAISE_*`). */
export const RAISE_OFF: i32 = 0;
export const RAISE_TENS: i32 = 1;
export const RAISE_MOST: i32 = 2;
export const RAISE_V2: i32 = 3;
export const RAISE_SAFE: i32 = 4;
export const RAISE_TIGHT: i32 = 5;
/**
 * **`Tight (old)`: the same box, cap and seed as `RAISE_TIGHT`, ranked on damage alone** — the position as it
 * shipped before experiment 188, kept beside the rated one so the owner can compare the two (2026-10-07: *"add
 * tight-old using previous way to compute tight (only added damage) so we can compare"*). It differs from
 * `RAISE_TIGHT` by one fact, `rRated`, and nothing else.
 */
export const RAISE_TIGHT_DAMAGE: i32 = 6;

/** Either `Tight`: the two positions that start at, and are capped by, the plan's own counts. */
@inline function isTight(mode: i32): bool {
  return mode == RAISE_TIGHT || mode == RAISE_TIGHT_DAMAGE;
}

/** `raise.ts`'s own two bounds on the climb: how many counts a sweep samples, and how many sweeps it makes. */
const CLIMB_SAMPLES: f64 = 16.0;
const CLIMB_PASSES: i32 = 3;

/** `Number.MAX_SAFE_INTEGER`, the cap of a type the account may hire without limit (`?? MAX_SAFE_INTEGER`). */
const MAX_SAFE: f64 = 9007199254740991.0;

/** `CHUNK` of `src/engine/recovery.ts` — the ten units a revival works in. */
const CHUNK_TEN: f64 = 10.0;

// One scratch per thing the raise works on, reserved by `raiseAlloc` on the first call over an instance.
let rReady: bool = false;
let rRows: usize = 0; // i32 × types: each type's own row, the scorer's row list
let rBase: usize = 0; // f64 × types: the plan's own counts, the march everything is measured against
let rCaps: usize = 0; // f64 × types: the stock, `MAX_SAFE` where the account may hire without limit
let rSeed: usize = 0; // f64 × types: `raisedCounts`' answer — the climb for a damage position, units otherwise
let rHeld: usize = 0; // f64 × types: the search's held vector — every stack the search does not walk
let rWork: usize = 0; // f64 × types: the candidate a score is asked about
let rPoint: usize = 0; // f64 × types: the search's current vector, per movable slot
let rFound: usize = 0; // f64 × types: the best vector the search has found
let rFrom: usize = 0; // f64 × types: a slot's floor — the plan's own count
let rTo: usize = 0; // f64 × types: a slot's ceiling — `min(shelter ceiling, owned stock)`
let rClimb: usize = 0; // f64 × types: the climb's own working vector for one pool
let rSlots: usize = 0; // i32 × rN: the types the search may move, in the base march's own order
let rSlotOf: usize = 0; // i32 × types: a type's slot number, −1 when it cannot move
let rOrder: usize = 0; // i32 × types: the type at base-order position `i` (the inverse of `T_ORDER`)
let rBases: i32 = 0; // how many stacks the base march fields: the width of `rOrder`
let rN: i32 = 0; // how many slots the search may move
let rSpace: f64 = 0; // the vectors in the box
let rHow: i32 = 0; // 0 no search ran, 1 walked whole, 2 searched to convergence
let rScored: f64 = 0; // how many vectors the search's own scorer was asked about
let rCap: f64 = Infinity; // the burn budget, `Infinity` for none
let rWalkCap: f64 = 0; // a box of at most this many vectors is walked whole
let rRestarts: i32 = 0; // seeded starts the multistart search takes
let rSweeps: i32 = 0; // a sweep that improves nothing has converged
let rState: f64 = 0; // the restart generator's own state
let rBest: f64 = 0; // the best score the search has found
let rRated: bool = false; // whether a vector is ranked by the owner's rating and not by damage (`RAISE_TIGHT`)
let rAsDamage: f64 = 0; // the plan's own march: its damage,
let rAsSilver: f64 = 0; // its silver,
let rAsGold: f64 = 0; // its gold
let rAsHired: f64 = 0; // and its hired burn, what `raiseRating` measures against
let rAuth: i32 = 0; // the mercenaries' position, and whether its pool is walked
let rDom: i32 = 0; // the monsters'

/**
 * **The census** (W18 P0.2, experiment 196): what one `raise()` spent its time on — the battles, the ratings
 * (and how many of those a memo hit asked for), the kill orders by caller. Profile build only: the `profile`
 * target defines `CENSUS` (`kernel/asconfig.json`), and without it `isDefined(CENSUS)` folds every count
 * away, so the release wasm is the one it was. Read by `raiseCensus`; the stats block `raise` writes is untouched.
 */
let cBattles: f64 = 0; // calls to `raiseScore`
let cRatings: f64 = 0; // calls to `raiseRating`
let cRatingsOnHit: f64 = 0; // of those, the ones a memo hit asked for
let cKillOrdersScore: f64 = 0; // `killOrderBy` from `raiseScore`
let cKillOrdersRating: f64 = 0; // `killOrderBy` from `raiseRating` and the plan's own bill
/** `killOrderBy` from the sizer (`sizerScore`, `buildStacks`): the instance's own total, never reset. */
let cKillOrdersSizer: f64 = 0;

/**
 * **The score memo** (W16 B, `BoxMemo` of `src/engine/exact.ts`): one `f64` a vector of the box, indexed by
 * the vector read in mixed radix over the slots, `NaN` where no battle has been fought. It is the instance's,
 * and an instance is one base march (`src/kernel/raise.ts`), so the three exhaustive positions of a march read
 * the same memo — kept while the box is the same box (the held vector and every slot's range), cleared when it
 * is not. A box wider than `MEMO_CAP` is searched without one.
 */
const MEMO_CAP: f64 = 4194304.0;
let rMemoMem: usize = 0; // the region reserved for the memo, 0 until a box first needs one
let rMemoRoom: f64 = 0; // how many entries that region holds
let rMemo: usize = 0; // f64 × rMemoSize: what each vector fought for, `NaN` for one not yet fought; 0 when off
let rMemoSize: f64 = 0; // the box the memo describes, 0 when it describes none
let rMemoHeld: usize = 0; // f64 × types: the held vector the memo was filled under
let rMemoFrom: usize = 0; // f64 × types: each slot's floor, as it was
let rMemoTo: usize = 0; // f64 × types: each slot's ceiling, as it was
let rMemoSlots: usize = 0; // i32 × types: the slots, as they were
let rMemoN: i32 = -1; // how many there were

/**
 * **The point, slots only** (W16 E2a). Between two vectors of one search only the slots move, so what the
 * held stacks contribute — their entries of `rWork`, their burn, their housing per pool — is laid down once
 * a `raise()` (`raisePrime`) and each vector writes and adds its slots' own terms. Exact because every term
 * is an integer and every sum stays under 2^53, so the summation order cannot move a bit; a box where that
 * cannot be shown (a custom mercenary cost of 2.5, say) keeps the whole-roster point (`raisePointWhole`).
 */
let rFast: bool = false; // whether this box takes the slots-only point
let rSlotFrom: usize = 0; // f64 × rN: each slot's floor
let rSlotCost: usize = 0; // f64 × rN: each slot's cost
let rSlotPool: usize = 0; // i32 × rN: each slot's pool
let rSlotStride: usize = 0; // i32 × rN: each slot's weight in the memo index, 0 when the box has no memo
let rHeldBurn: f64 = 0; // Σ chunks over the held authority stacks
let rHeldUsed1: f64 = 0; // Σ count × cost over the held authority stacks
let rHeldUsed2: f64 = 0; // Σ count × cost over the held dominance stacks
let rAt: i32 = 0; // the memo index of the last point scored (read by `raiseProbe`)
let rPointAt: i32 = 0; // the memo index of `rPoint`, kept as its slots move (`raiseSet`)
let rPointBurn: f64 = 0; // Σ chunks over `rPoint`'s authority slots, kept the same way
let rForceWhole: bool = false; // test hook: every box takes the whole-roster point

/** Reserve the raise's scratch, once per instance. */
function raiseAlloc(): void {
  if (rReady) return;
  rReady = true;
  const n = <usize>max(types, 1);
  rRows = heap.alloc(n << 2);
  for (let t = 0; t < types; t += 1) store<i32>(rRows + ((<usize>t) << 2), t);
  rBase = heap.alloc(n << 3);
  rCaps = heap.alloc(n << 3);
  rSeed = heap.alloc(n << 3);
  rHeld = heap.alloc(n << 3);
  rWork = heap.alloc(n << 3);
  rPoint = heap.alloc(n << 3);
  rFound = heap.alloc(n << 3);
  rFrom = heap.alloc(n << 3);
  rTo = heap.alloc(n << 3);
  rClimb = heap.alloc(n << 3);
  rSlots = heap.alloc(n << 2);
  rSlotOf = heap.alloc(n << 2);
  rOrder = heap.alloc(n << 2);
  rMemoHeld = heap.alloc(n << 3);
  rMemoFrom = heap.alloc(n << 3);
  rMemoTo = heap.alloc(n << 3);
  rMemoSlots = heap.alloc(n << 2);
  rSlotFrom = heap.alloc(n << 3);
  rSlotCost = heap.alloc(n << 3);
  rSlotPool = heap.alloc(n << 2);
  rSlotStride = heap.alloc(n << 2);
}

/**
 * **The memo this search reads** — the one already filled when the box is the box it was filled for, a
 * cleared one otherwise, and none (`rMemo` 0) when the box is wider than `MEMO_CAP`. The region is reserved
 * at the widest box the instance has met (the heap only grows), and a re-fill clears only what it uses.
 */
function raiseMemo(): void {
  if (rSpace > MEMO_CAP) {
    rMemo = 0;
    rMemoSize = 0;
    return;
  }
  let same = rMemo != 0 && rMemoSize == rSpace && rMemoN == rN;
  for (let t = 0; same && t < types; t += 1) same = f64At(rMemoHeld, t) == f64At(rHeld, t);
  for (let s = 0; same && s < rN; s += 1) {
    const t = i32At(rSlots, s);
    same =
      i32At(rMemoSlots, s) == t && f64At(rMemoFrom, t) == f64At(rFrom, t) && f64At(rMemoTo, t) == f64At(rTo, t);
  }
  if (same) return;

  if (rSpace > rMemoRoom) {
    rMemoMem = heap.alloc((<usize>rSpace) << 3);
    rMemoRoom = rSpace;
  }
  rMemo = rMemoMem;
  const size = <i32>rSpace;
  for (let i = 0; i < size; i += 1) store<f64>(rMemo + ((<usize>i) << 3), NaN);
  rMemoSize = rSpace;
  rMemoN = rN;
  memory.copy(rMemoHeld, rHeld, (<usize>types) << 3);
  memory.copy(rMemoFrom, rFrom, (<usize>types) << 3);
  memory.copy(rMemoTo, rTo, (<usize>types) << 3);
  memory.copy(rMemoSlots, rSlots, (<usize>rN) << 2);
}

@inline function countAt(at: usize, t: i32): f64 {
  return f64At(at, t);
}

@inline function hpPer(t: i32): f64 {
  return cell(t, T_HP);
}

@inline function costPer(t: i32): f64 {
  return cell(t, T_COST);
}

/** 0 leadership, 1 authority, 2 dominance. */
@inline function poolPer(t: i32): i32 {
  return <i32>cell(t, T_POOL);
}

/** The type's place in the base march's own stack order — the tie `applyCounts` breaks by (`T_ORDER`). */
@inline function orderPer(t: i32): i32 {
  return <i32>cell(t, T_ORDER);
}

/** The housing a pool pays for what it fields. */
@inline function housingOf(pool: i32): f64 {
  return pool == 1 ? header(H_HOUSING_AUTHORITY) : header(H_HOUSING_DOMINANCE);
}

/** Whether this pool is one the exhaustive positions walk. */
@inline function walkedPool(pool: i32): bool {
  return pool == 1 ? rAuth >= RAISE_V2 : pool == 2 ? rDom >= RAISE_V2 : false;
}

/** The position a pool stands on. */
@inline function modeOf(pool: i32): i32 {
  return pool == 1 ? rAuth : rDom;
}

/** `raise.ts`'s `shelterCeiling`: the most units of a type that sit **strictly** under the troop floor. */
@inline function raiseCeiling(floor: f64, hp: f64): f64 {
  if (!(floor > 0) || !(hp > 0)) return 0.0;
  return Math.max(0.0, Math.ceil(floor / hp) - 1.0);
}

/**
 * **The march's worst opening for one count vector** — `applyCounts`' own replay: the fielded stacks in
 * total HP order with the base march's stack order breaking a tie (`T_ORDER`), the attack order as
 * `attackOrder` builds it, and the enemy-first journal's total.
 */
function raiseScore(countsPtr: usize): f64 {
  if (isDefined(CENSUS)) {
    cBattles += 1.0;
    cKillOrdersScore += 1.0;
  }
  const k = killOrderBy(types, rRows, countsPtr, T_ORDER);
  attackOrderOf(k);
  return journalDamage(k, false);
}

/** `burnOf`: Σ chunks(n) over the **authority** stacks — a property of the counts and not of the fight. */
function raiseBurn(countsPtr: usize): f64 {
  let burned: f64 = 0.0;
  for (let t = 0; t < types; t += 1) {
    if (poolPer(t) != 1) continue;
    burned += chunks(max(0.0, f64At(countsPtr, t)));
  }
  return burned;
}

/**
 * **The owner's rating of one vector against the plan's own march** (experiment 188, owner 2026-10-07: `Tight`
 * should trade better, not only hit harder): `rate(asIs, {damage, silver, gold, hired}, markerRates)` of
 * `rating.ts`, its operations in its order so the floats are the research copy's own. `damage` is what the
 * vector fights for (the memo's figure), the bill is the counts' own — the recovery of the stacks in the
 * march's kill order (`recoveryOf`) and the authority chunks (`raiseBurn`). The seed rates exactly 0.
 */
function raiseRating(damage: f64): f64 {
  if (isDefined(CENSUS)) {
    cRatings += 1.0;
    cKillOrdersRating += 1.0;
  }
  const k = killOrderBy(types, rRows, rWork, T_ORDER);
  recoveryOf(k);
  let score = rAsDamage > 0 ? ((damage - rAsDamage) / rAsDamage) * 100.0 : 0.0;
  score += saved(rAsSilver, bSilver) / header(H_RATE_SILVER);
  score += saved(rAsGold, bGold) / header(H_RATE_GOLD);
  score += saved(rAsHired, raiseBurn(rWork)) / header(H_RATE_HIRED);
  return score;
}

/** `poolUsage`: Σ count × cost over one pool's types, in row order. */
function raiseUsed(countsPtr: usize, pool: i32): f64 {
  let used: f64 = 0.0;
  for (let t = 0; t < types; t += 1) {
    if (poolPer(t) != pool) continue;
    used += f64At(countsPtr, t) * costPer(t);
  }
  return used;
}

/** `troopFloor`: the lowest living troop stack's total HP, or −1 when the march fields no troop at all. */
function raiseFloor(): f64 {
  let low: f64 = Infinity;
  for (let t = 0; t < types; t += 1) {
    if (poolPer(t) != 0) continue;
    const count = countAt(rBase, t);
    if (!(count > 0)) continue;
    low = min(low, count * hpPer(t));
  }
  return low > 0 && low < Infinity ? low : -1.0;
}

/** Copy the plan's own counts into `dst`. */
function raiseBaseInto(dst: usize): void {
  memory.copy(dst, rBase, (<usize>types) << 3);
}

/**
 * **A pool's units answer** (`raisedCounts`'s arithmetic half): every live stack as high as the shelter and
 * the stock allow, paid out of the spare housing **from the bottom of the kill order up** — the last to fall
 * strikes most, which is the stack that pool would spend its spare on. Writes into `dst`, answers whether it
 * moved anything.
 */
function raiseUnits(pool: i32, mode: i32, floor: f64, dst: usize): bool {
  // What the march has already spent comes off the stacks it is raising; the capacity is the request's own.
  let spare = Math.max(0.0, housingOf(pool) - raiseUsed(rBase, pool));
  let moved = false;
  for (let i = rBases - 1; i >= 0; i -= 1) {
    const t = i32At(rOrder, i);
    if (poolPer(t) != pool) continue;
    const count = countAt(rBase, t);
    if (!(count > 0)) continue;
    const cost = costPer(t);
    const allowed = Math.min(raiseCeiling(floor, hpPer(t)), f64At(rCaps, t));
    // **The tens rule rounds the count and not only the ceiling**: a stock of 83 is a cap like any other.
    const wanted = mode == RAISE_TENS ? Math.floor(allowed / CHUNK_TEN) * CHUNK_TEN : allowed;
    if (!(wanted > count)) continue;
    // A type that costs nothing is bounded by its ceiling alone (`unitsForTarget` drops a non-positive cost).
    const room = cost > 0 ? Math.floor(spare / cost) : MAX_SAFE;
    const next = Math.min(wanted, count + room);
    if (!(next > count)) continue;
    spare -= (next - count) * cost;
    store<f64>(dst + ((<usize>t) << 3), next);
    moved = true;
  }
  return moved;
}

/** The candidate `at` with stack `t` at `n`, scored — or `-Infinity` when its pool cannot pay for it (`fits`). */
function raiseTry(pool: i32, t: i32, n: f64, at: usize): f64 {
  memory.copy(rWork, at, (<usize>types) << 3);
  store<f64>(rWork + ((<usize>t) << 3), n);
  if (raiseUsed(rWork, pool) > housingOf(pool)) return -Infinity;
  return raiseScore(rWork);
}

/**
 * `climbedCounts`: the sampled coordinate climb — the seed of every exhaustive position, the vector the
 * search falls back to, and the march the March draws while it runs. One stack at a time, two samples a
 * coarse step and a step-1 refinement either side of the winner, up to three sweeps; **only improvements are
 * ever taken**, so it can never lose the damage it started from.
 */
function raiseClimb(pool: i32, floor: f64, dst: usize): bool {
  const counts = rClimb;
  raiseBaseInto(counts);
  let best = raiseScore(counts);
  let moved = false;
  for (let pass = 0; pass < CLIMB_PASSES; pass += 1) {
    let improved = false;
    // From the bottom of the kill order up (`most`'s own order).
    for (let i = rBases - 1; i >= 0; i -= 1) {
      const t = i32At(rOrder, i);
      if (poolPer(t) != pool) continue;
      if (!(countAt(rBase, t) > 0)) continue;
      const from = countAt(counts, t);
      const to = Math.min(raiseCeiling(floor, hpPer(t)), f64At(rCaps, t));
      if (!(to > from)) continue;

      let winner = from;
      let winnerDamage = best;
      const step = Math.max(1.0, Math.ceil((to - from) / CLIMB_SAMPLES));
      let last = from;
      let n = from + step;
      while (n <= to) {
        const damage = raiseTry(pool, t, n, counts);
        if (damage > winnerDamage) {
          winner = n;
          winnerDamage = damage;
        }
        last = n;
        n += step;
      }
      if (last != to) {
        const damage = raiseTry(pool, t, to, counts);
        if (damage > winnerDamage) {
          winner = to;
          winnerDamage = damage;
        }
      }
      if (winner > from) {
        let refined = Math.max(from + 1.0, winner - step);
        const refinedTo = Math.min(to, winner + step);
        while (refined <= refinedTo) {
          const damage = raiseTry(pool, t, refined, counts);
          if (damage > winnerDamage) {
            winner = refined;
            winnerDamage = damage;
          }
          refined += 1.0;
        }
      }
      if (winner > from) {
        store<f64>(counts + ((<usize>t) << 3), winner);
        best = winnerDamage;
        improved = true;
        moved = true;
      }
    }
    if (!improved) break;
  }
  /**
   * **Only this pool's stacks** — the merge is per pool, exactly as `raisedCounts` merges what each
   * `climbedCounts` answers (`Object.assign(out, climbed)`): the authority climb runs first and the
   * dominance one after it, and a whole-vector copy here would put the second pool's answer back over the
   * first's. What it costs is nothing: an unmoved stack of this pool holds the plan's own count in `counts`
   * already, so writing it is writing what is there.
   */
  if (moved) {
    for (let i = 0; i < rBases; i += 1) {
      const t = i32At(rOrder, i);
      if (poolPer(t) != pool) continue;
      store<f64>(dst + ((<usize>t) << 3), f64At(counts, t));
    }
  }
  return moved;
}

/** One pool's seed: the units answer, or the climb where the position is one of the three exhaustive ones. */
function raisePool(pool: i32, mode: i32, floor: f64, dst: usize): bool {
  if (mode >= RAISE_V2) return raiseClimb(pool, floor, dst);
  return raiseUnits(pool, mode, floor, dst);
}

/**
 * **The candidate the search is standing on**: the held vector with every slot's own count over it, then the
 * two bounds `exactSearch`'s scorer keeps — the housing over **every unit of the pool** (never only the
 * movable ones, which is the bug the plan's first draft was built on) and the burn budget of a capped
 * position, which refuses an over-budget vector exactly as the housing refuses one.
 */
function raisePointScore(): f64 {
  // **Counted here and not at the battle**: the engine counts what its scorer was *asked* about
  // (`counting` in `src/engine/exact.ts`), a vector the housing refuses included — so a kernel that
  // counted only the battles would report a different cost for the same search.
  rScored += 1.0;
  return rFast ? raisePointSlots(rMemo) : raisePointWhole(rMemo);
}

/**
 * The point over the slots alone (`rFast`): `rWork` already holds the held vector (`raisePrime`), so only the
 * slots' entries are written, and the burn, the memo index and the two housings are the held sums plus the
 * slots' own terms — the same verdicts, in the same order, as `raisePointWhole`.
 */
function raisePointSlots(memo: usize): f64 {
  // The index and the burn were kept as the slots moved (`raiseSet`), so the cap and a memo hit cost nothing
  // per slot; only a vector that is not known yet is written out and housed.
  const at = rPointAt;
  rAt = at;
  if (rHeldBurn + rPointBurn > rCap) return -Infinity;
  const slot = memo + ((<usize>at) << 3);
  if (memo != 0) {
    const known = load<f64>(slot);
    if (known == known) {
      // A known damage is a rated vector's damage too; only the bill of its counts is still to be read.
      if (rRated && known > -Infinity) {
        for (let s = 0; s < rN; s += 1) {
          const t = i32At(rSlots, s);
          store<f64>(rWork + ((<usize>t) << 3), f64At(rPoint, t));
        }
        if (isDefined(CENSUS)) cRatingsOnHit += 1.0;
        return raiseRating(known);
      }
      return known;
    }
  }
  let used1: f64 = rHeldUsed1;
  let used2: f64 = rHeldUsed2;
  for (let s = 0; s < rN; s += 1) {
    const t = i32At(rSlots, s);
    const n = f64At(rPoint, t);
    store<f64>(rWork + ((<usize>t) << 3), n);
    const used = n * f64At(rSlotCost, s);
    if (i32At(rSlotPool, s) == 1) used1 += used;
    else used2 += used;
  }
  let value: f64 = -Infinity;
  if (!(used1 > header(H_HOUSING_AUTHORITY) || used2 > header(H_HOUSING_DOMINANCE))) value = raiseScore(rWork);
  if (memo != 0) store<f64>(slot, value);
  return rRated && value > -Infinity ? raiseRating(value) : value;
}

/**
 * **Move one slot** of the search's vector: slot `s` (type `t`) to `n`, the memo index and the burn moved
 * with it on the slots-only point. Both stay exact — the index is an i32 under `MEMO_CAP`, the burn a sum of
 * integers under 2^53 (`raisePrime`'s guard) — so a kept sum is the sum `raisePointWhole` would take.
 */
@inline function raiseSet(s: i32, t: i32, n: f64): void {
  if (rFast) {
    const old = f64At(rPoint, t);
    rPointAt += <i32>(n - old) * i32At(rSlotStride, s);
    if (i32At(rSlotPool, s) == 1) rPointBurn += chunks(max(0.0, n)) - chunks(max(0.0, old));
  }
  store<f64>(rPoint + ((<usize>t) << 3), n);
}

/** The memo index and the burn of `rPoint` from scratch, after the search wrote it whole. */
function raiseResync(): void {
  let at: i32 = 0;
  let burn: f64 = 0.0;
  for (let s = 0; s < rN; s += 1) {
    const t = i32At(rSlots, s);
    const n = f64At(rPoint, t);
    at += <i32>(n - f64At(rSlotFrom, s)) * i32At(rSlotStride, s);
    if (i32At(rSlotPool, s) == 1) burn += chunks(max(0.0, n));
  }
  rPointAt = at;
  rPointBurn = burn;
}

/** Whether `x` is an integer JavaScript would call one (`Number.isInteger`): finite, no fraction. */
@inline function isWhole(x: f64): bool {
  return x == Math.trunc(x) && x - x == 0.0;
}

/**
 * **Lay the held vector down once** for the slots-only point, and decide whether this box may take it: every
 * cost and count of either pool an integer, and each pool's Σ |count × cost| (a slot at its widest) and the
 * authority Σ chunks under 2^53 — then every partial sum either order takes is the exact integer, and the two
 * orders agree to the bit. Run on every `raise()` after the slots are known: the held vector moves with the
 * position, and the climb that seeds it (`raiseTry`) writes over `rWork`.
 */
function raisePrime(): void {
  memory.copy(rWork, rHeld, (<usize>types) << 3);
  let whole = !rForceWhole;
  let stride: i32 = 1;
  for (let s = rN - 1; s >= 0; s -= 1) {
    const t = i32At(rSlots, s);
    const from = f64At(rFrom, t);
    const to = f64At(rTo, t);
    store<f64>(rSlotFrom + ((<usize>s) << 3), from);
    store<f64>(rSlotCost + ((<usize>s) << 3), costPer(t));
    store<i32>(rSlotPool + ((<usize>s) << 2), poolPer(t));
    // The same index `raisePointWhole` builds in Horner form, its weights laid out: only a box the memo holds
    // has one, and that box is under `MEMO_CAP`, so no weight and no index leaves the i32.
    store<i32>(rSlotStride + ((<usize>s) << 2), rSpace <= MEMO_CAP ? stride : 0);
    if (rSpace <= MEMO_CAP) stride *= <i32>(to - from + 1.0);
    whole = whole && isWhole(from) && isWhole(to);
  }
  rHeldBurn = 0.0;
  rHeldUsed1 = 0.0;
  rHeldUsed2 = 0.0;
  let bound1: f64 = 0.0;
  let bound2: f64 = 0.0;
  let boundBurn: f64 = 0.0;
  for (let t = 0; t < types; t += 1) {
    const pool = poolPer(t);
    if (pool != 1 && pool != 2) continue;
    const cost = costPer(t);
    const slot = i32At(rSlotOf, t) >= 0;
    const count = f64At(rHeld, t);
    const widest = slot ? max(Math.abs(f64At(rFrom, t)), Math.abs(f64At(rTo, t))) : Math.abs(count);
    whole = whole && isWhole(cost) && isWhole(count);
    if (pool == 1) {
      bound1 += widest * Math.abs(cost);
      boundBurn += chunks(widest);
    } else bound2 += widest * Math.abs(cost);
    if (slot) continue;
    if (pool == 1) {
      rHeldBurn += chunks(max(0.0, count));
      rHeldUsed1 += count * cost;
    } else rHeldUsed2 += count * cost;
  }
  rFast = whole && bound1 < MAX_SAFE && bound2 < MAX_SAFE && boundBurn < MAX_SAFE;
}

/**
 * The point over the whole roster, as it was before W16 E2a: the held vector copied under the slots, then the
 * burn and the two housings summed over every type in row order. The path a box `raisePrime` cannot prove
 * exact takes, and the reference `raiseProbe` holds the slots-only point to.
 */
function raisePointWhole(memo: usize): f64 {
  memory.copy(rWork, rHeld, (<usize>types) << 3);
  let at: i32 = 0;
  for (let s = 0; s < rN; s += 1) {
    const t = i32At(rSlots, s);
    const n = f64At(rPoint, t);
    store<f64>(rWork + ((<usize>t) << 3), n);
    if (rSpace <= MEMO_CAP) {
      const from = f64At(rFrom, t);
      at = at * <i32>(f64At(rTo, t) - from + 1.0) + <i32>(n - from);
    }
  }
  rAt = at;
  // **The cap before the battle** (W16 B): the burn is arithmetic over the counts, so an over-budget vector
  // is refused whatever it would strike for — the verdict the battle-first order gave, without the battle.
  if (rCap < Infinity && raiseBurn(rWork) > rCap) return -Infinity;
  // **And one battle a vector a march**: what a vector fights for does not depend on the position.
  const slot = memo + ((<usize>at) << 3);
  if (memo != 0) {
    const known = load<f64>(slot);
    if (known == known) {
      if (isDefined(CENSUS) && rRated && known > -Infinity) cRatingsOnHit += 1.0;
      return rRated && known > -Infinity ? raiseRating(known) : known;
    }
  }
  let value: f64 = -Infinity;
  if (!(raiseUsed(rWork, 1) > header(H_HOUSING_AUTHORITY) || raiseUsed(rWork, 2) > header(H_HOUSING_DOMINANCE)))
    value = raiseScore(rWork);
  if (memo != 0) store<f64>(slot, value);
  return rRated && value > -Infinity ? raiseRating(value) : value;
}

/**
 * **Test only** (`tests/kernel/raise-point.test.ts`): after a `raise()`, `samples` random vectors of its box,
 * each scored by the slots-only point and by the whole-roster one with the memo out of both, the two verdicts
 * and the two memo indices held to each other bit for bit. Answers how many differed, or −1 when the box did
 * not take the slots-only point. Leaves `rPoint`, `rScored` and the memo as they were.
 */
export function raiseProbe(samples: i32, seed: f64): f64 {
  if (!rFast || rN <= 0) return -1.0;
  memory.copy(rClimb, rPoint, (<usize>types) << 3);
  let state = ((Math.trunc(seed) % 4294967296.0) + 4294967296.0) % 4294967296.0;
  let differ: f64 = 0.0;
  for (let i = 0; i < samples; i += 1) {
    for (let s = 0; s < rN; s += 1) {
      const t = i32At(rSlots, s);
      const from = f64At(rFrom, t);
      state = (state * 1664525.0 + 1013904223.0) % 4294967296.0;
      raiseSet(s, t, from + Math.floor((state / 4294967296.0) * (f64At(rTo, t) - from + 1.0)));
    }
    const fast = raisePointSlots(0);
    const fastAt = rAt;
    const whole = raisePointWhole(0);
    if (reinterpret<u64>(fast) != reinterpret<u64>(whole) || fastAt != rAt) differ += 1.0;
  }
  // `rWork` is left the held vector under the last sample's slots, which is what the slots-only point wants.
  memory.copy(rPoint, rClimb, (<usize>types) << 3);
  raiseResync();
  return differ;
}

/**
 * **The census of the last `raise()`** (profile build only), written to `outPtr` (`f64 × 6`): `[battles,
 * ratings, ratingsOnHit, killOrdersScore, killOrdersRating, killOrdersSizer]`. Answers 1 when the build
 * counts, 0 (and writes nothing) when it does not — the release build.
 */
export function raiseCensus(outPtr: usize): i32 {
  if (!isDefined(CENSUS)) return 0;
  store<f64>(outPtr, cBattles);
  store<f64>(outPtr + 8, cRatings);
  store<f64>(outPtr + 16, cRatingsOnHit);
  store<f64>(outPtr + 24, cKillOrdersScore);
  store<f64>(outPtr + 32, cKillOrdersRating);
  store<f64>(outPtr + 40, cKillOrdersSizer);
  return 1;
}

/** **Test only**: whether the last `raise()` took the slots-only point (1) or the whole-roster one (0). */
export function raiseFastPath(): i32 {
  return rFast ? 1 : 0;
}

/** **Test only**: make every box take the whole-roster point (1), or let `raisePrime` decide (0). */
export function raiseForceWhole(on: i32): void {
  rForceWhole = on != 0;
}

/** One vector, taken as the best when it **strictly** improves (`exactSearch` takes improvements only). */
function raiseTake(): void {
  const value = raisePointScore();
  if (value > rBest) {
    rBest = value;
    memory.copy(rFound, rPoint, (<usize>types) << 3);
  }
}

/**
 * `exactSearch`'s `climb`: the shipped neighbourhood, walked rather than sampled, to convergence. **Its best
 * is its own** and not the search's (`rBest`): the engine's `climb` is handed a start and climbs from *that*
 * vector, so a candidate is taken when it beats where this walk stands — anchoring it to the best found so far
 * would let a restart explore a different route entirely, which is the divergence `scored` caught.
 */
function raiseClimbSearch(): void {
  let best = raisePointScore();
  for (let sweep = 0; sweep < rSweeps; sweep += 1) {
    let improved = false;
    for (let s = 0; s < rN; s += 1) {
      const t = i32At(rSlots, s);
      const from = f64At(rFrom, t);
      const to = f64At(rTo, t);
      let winner = f64At(rPoint, t);
      let winnerScore = best;
      let n = from;
      while (n <= to) {
        raiseSet(s, t, n);
        const value = raisePointScore();
        if (value > winnerScore) {
          winner = n;
          winnerScore = value;
        }
        n += 1.0;
      }
      raiseSet(s, t, winner);
      if (winnerScore > best) {
        best = winnerScore;
        improved = true;
      }
    }
    if (!improved) return;
  }
}

/**
 * `exactSearch`'s `pairwise`: every pair of slots, exhaustively — the neighbourhood a climb cannot see. Its
 * best is its own, for `raiseClimbSearch`'s reason.
 */
function raisePairwise(): void {
  let best = raisePointScore();
  for (let sweep = 0; sweep < rSweeps; sweep += 1) {
    let improved = false;
    for (let i = 0; i < rN; i += 1) {
      for (let j = i + 1; j < rN; j += 1) {
        const one = i32At(rSlots, i);
        const other = i32At(rSlots, j);
        let winnerOne = f64At(rPoint, one);
        let winnerOther = f64At(rPoint, other);
        let winnerScore = best;
        const oneTo = f64At(rTo, one);
        const otherTo = f64At(rTo, other);
        let a = f64At(rFrom, one);
        while (a <= oneTo) {
          let b = f64At(rFrom, other);
          while (b <= otherTo) {
            raiseSet(i, one, a);
            raiseSet(j, other, b);
            const value = raisePointScore();
            if (value > winnerScore) {
              winnerOne = a;
              winnerOther = b;
              winnerScore = value;
            }
            b += 1.0;
          }
          a += 1.0;
        }
        raiseSet(i, one, winnerOne);
        raiseSet(j, other, winnerOther);
        if (winnerScore > best) {
          best = winnerScore;
          improved = true;
        }
      }
    }
    if (!improved) return;
  }
}

/**
 * The walk: **every vector in the box**, enumerated in the slots' own order. It is the only case where the
 * answer is the optimum rather than the best a search found, and it is the control the search is trusted on.
 */
function raiseWalk(s: i32): void {
  if (s == rN) {
    raiseTake();
    return;
  }
  const t = i32At(rSlots, s);
  const to = f64At(rTo, t);
  let n = f64At(rFrom, t);
  while (n <= to) {
    raiseSet(s, t, n);
    raiseWalk(s + 1);
    n += 1.0;
  }
}

/** `randomFrom`: the deterministic generator an unseeded restart is not (`src/engine/exact.ts`). */
@inline function raiseRandom(): f64 {
  rState = (rState * 1664525.0 + 1013904223.0) % 4294967296.0;
  return rState / 4294967296.0;
}

/**
 * **The best vector in the box** (`exactSearch`): walked whole where the box fits, and otherwise searched to
 * convergence from the caller's own vector and `restarts` seeded ones. Answers whether it found a feasible
 * vector at all — a box where every vector is refused has no answer, which is not the same as "the start is
 * the best".
 */
function raiseSearch(): bool {
  // The caller's own vector, clipped into the box. **A `tight` pool starts at the plan's own counts** and not
  // at the seed: a slot left out of `start` is its floor, which is the plan's count — and the promise "tight
  // cannot lose to the plan's own march" holds only because the seed and the cap are the same vector.
  memory.copy(rPoint, rBase, (<usize>types) << 3);
  for (let s = 0; s < rN; s += 1) {
    const t = i32At(rSlots, s);
    if (isTight(modeOf(poolPer(t)))) continue;
    const from = f64At(rFrom, t);
    const to = f64At(rTo, t);
    store<f64>(rPoint + ((<usize>t) << 3), Math.min(to, Math.max(from, jsRound(f64At(rSeed, t)))));
  }
  raiseResync();
  rBest = raisePointScore();
  memory.copy(rFound, rPoint, (<usize>types) << 3);

  if (rSpace <= rWalkCap) {
    rHow = 1;
    raiseWalk(0);
    return rBest > -Infinity;
  }

  rHow = 2;
  for (let attempt = 0; attempt <= rRestarts; attempt += 1) {
    if (attempt > 0) {
      for (let s = 0; s < rN; s += 1) {
        const t = i32At(rSlots, s);
        const from = f64At(rFrom, t);
        const span = f64At(rTo, t) - from;
        store<f64>(rPoint + ((<usize>t) << 3), from + Math.floor(raiseRandom() * (span + 1.0)));
      }
      raiseResync();
    }
    raisePairwise();
    raiseClimbSearch();
    const value = raisePointScore();
    if (value > rBest) {
      rBest = value;
      memory.copy(rFound, rPoint, (<usize>types) << 3);
    }
  }
  return rBest > -Infinity;
}

/**
 * **The counts a position stands every hired stack at** (S-147), over both pools at once, written to `outPtr`
 * as a count per type (`f64 × types`): the plan's own counts, raised by `raisedCounts` where a pool stands on
 * the climb or on a unit answer, and by the exhaustive search where it stands on one of the three damage
 * positions — `{...raisedCounts, ...exactRaise}`, the merge the March draws.
 *
 * `basePtr` is the plan's own counts, `capsPtr` the stock (`MAX_SAFE` where unlimited); the table must carry
 * `T_ORDER` (the base march's own stack order, the tie `applyCounts` breaks by). `statsPtr` (`f64 × 4`) is
 * written `[how, space, scored, 0]`, `how` 0 when no search ran.
 *
 * Answers 1 when the table can be read, 0 when it cannot (no type at all).
 */
export function raise(
  authMode: i32,
  domMode: i32,
  basePtr: usize,
  capsPtr: usize,
  outPtr: usize,
  statsPtr: usize,
  walkCap: f64,
  restarts: i32,
  maxSweeps: i32,
  rngSeed: f64,
): i32 {
  if (types <= 0) return 0;
  raiseAlloc();
  memory.copy(rBase, basePtr, (<usize>types) << 3);
  memory.copy(rCaps, capsPtr, (<usize>types) << 3);
  rAuth = authMode;
  rDom = domMode;
  rScored = 0.0;
  if (isDefined(CENSUS)) {
    cBattles = 0.0;
    cRatings = 0.0;
    cRatingsOnHit = 0.0;
    cKillOrdersScore = 0.0;
    cKillOrdersRating = 0.0;
  }
  rHow = 0;
  rSpace = 0.0;
  rN = 0;
  rFast = false;
  rRated = false;
  rCap = Infinity;
  rWalkCap = walkCap;
  rRestarts = restarts;
  rSweeps = maxSweeps;
  // The generator is folded into `[0, 2^32)` **before** anything is drawn: a negative seed would otherwise
  // put every restart vector below its slot's floor, outside the box the caller described.
  rState = ((Math.trunc(rngSeed) % 4294967296.0) + 4294967296.0) % 4294967296.0;

  // The base march's own order, inverted: `rOrder[i]` is the type the base fields at kill position `i`, which
  // is the order the raise walks (`base.stacks` is that order, and `T_ORDER` is a type's place in it).
  rBases = 0;
  for (let t = 0; t < types; t += 1) {
    store<i32>(rSlotOf + ((<usize>t) << 2), -1);
    store<i32>(rOrder + ((<usize>t) << 2), -1);
  }
  for (let t = 0; t < types; t += 1) {
    const ord = orderPer(t);
    if (ord < 0) continue;
    store<i32>(rOrder + ((<usize>ord) << 2), t);
    if (ord + 1 > rBases) rBases = ord + 1;
  }

  const floor = raiseFloor();
  raiseBaseInto(rSeed);
  if (floor > 0) {
    if (authMode != RAISE_OFF) raisePool(1, authMode, floor, rSeed);
    if (domMode != RAISE_OFF) raisePool(2, domMode, floor, rSeed);
  }

  let answered = false;
  if (floor > 0 && (rAuth >= RAISE_V2 || rDom >= RAISE_V2)) {
    /**
     * **The two caps** (`burnCap`): `RAISE_SAFE` may not burn more authority chunks than the climb it
     * replaces, `RAISE_TIGHT` not more than the plan's own counts — not one extra chunk. Only the
     * mercenaries' block can cap anything (S-102: a trained monster is a price, not a stock).
     */
    if (rAuth == RAISE_SAFE) rCap = raiseBurn(rSeed);
    else if (isTight(rAuth)) rCap = raiseBurn(rBase);
    // `Tight` is ranked by the rating, against the plan's own march, whose bill is read once here.
    rRated = rAuth == RAISE_TIGHT;
    if (rRated) {
      rAsDamage = raiseScore(rBase);
      if (isDefined(CENSUS)) cKillOrdersRating += 1.0;
      recoveryOf(killOrderBy(types, rRows, rBase, T_ORDER));
      rAsSilver = bSilver;
      rAsGold = bGold;
      rAsHired = raiseBurn(rBase);
    }

    // The stacks the search does not walk stay where the **seed** put them, so every vector is scored as the
    // whole army it would field: the housing is paid by all of it and the battle is fought by all of it.
    raiseBaseInto(rHeld);
    for (let i = 0; i < rBases; i += 1) {
      const t = i32At(rOrder, i);
      if (!(countAt(rBase, t) > 0)) continue;
      if (walkedPool(poolPer(t))) continue;
      store<f64>(rHeld + ((<usize>t) << 3), f64At(rSeed, t));
    }

    // The slots: the plan's own count as the floor, `min(shelter ceiling, owned stock)` as the ceiling, and
    // only the ones that can actually move — `exactSearch` drops the rest before it searches.
    rN = 0;
    rSpace = 1.0;
    for (let i = 0; i < rBases; i += 1) {
      const t = i32At(rOrder, i);
      const count = countAt(rBase, t);
      if (!(count > 0)) continue;
      if (!walkedPool(poolPer(t))) continue;
      const to = Math.min(raiseCeiling(floor, hpPer(t)), f64At(rCaps, t));
      store<f64>(rFrom + ((<usize>t) << 3), count);
      store<f64>(rTo + ((<usize>t) << 3), to);
      if (!(to > count)) continue;
      store<i32>(rSlotOf + ((<usize>t) << 2), rN);
      store<i32>(rSlots + ((<usize>rN) << 2), t);
      rN += 1;
      rSpace *= to - count + 1.0;
    }

    if (rN > 0) {
      rScored = 0.0;
      raisePrime();
      raiseMemo();
      answered = raiseSearch();
    }
  }

  /**
   * **The merge.** Where the search answered, every slot takes its count from the search's own vector and the
   * rest of the army from the seed; where it did not (no slot could move, or every vector was refused), the
   * walked pools take the seed's counts too — which is exactly what `raisedCounts` answers an exhaustive
   * position with, and what the March draws while a search runs.
   */
  memory.copy(outPtr, rBase, (<usize>types) << 3);
  for (let i = 0; i < rBases; i += 1) {
    const t = i32At(rOrder, i);
    if (!(countAt(rBase, t) > 0)) continue;
    if (walkedPool(poolPer(t))) continue;
    store<f64>(outPtr + ((<usize>t) << 3), f64At(rSeed, t));
  }
  if (answered) {
    for (let s = 0; s < rN; s += 1) {
      const t = i32At(rSlots, s);
      store<f64>(outPtr + ((<usize>t) << 3), f64At(rFound, t));
    }
  }

  store<f64>(statsPtr, <f64>rHow);
  store<f64>(statsPtr + 8, rSpace);
  store<f64>(statsPtr + 16, rScored);
  store<f64>(statsPtr + 24, answered ? 1.0 : 0.0);
  return 1;
}


