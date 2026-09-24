/**
 * **The plan's hot path on the kernel** (AssemblyScript roadmap, step 2): the `PlanKernel` the engine asks for
 * through `src/engine/fast.ts`, over one compiled `kernel/build/kernel.wasm`.
 *
 * Three doors, the three the profile of `planCampaign` found hottest after the sizer's bookkeeping:
 *
 *  - `march` — `marchOf`'s figures (the enemy-first battle, its hired share, the search bill), called by the
 *    scorer on every ladder, by the finale and by the rung-order climb;
 *  - `bill` — `priceMarch`'s `recoveryCosts(...).plan`, called by `ratioOf` on every candidate recorded;
 *  - `sizePool` — the sizer's binary search and exact fill, 200 passes over a pool per call;
 *  - `sizeStacks` (step 3) — the whole sizer as the plan reads it (`sizedCounts` in `plan.ts`): the slots
 *    ranked, every pool sized, the ceilings, the tens and relaxed preservation's battles, answering the
 *    stacks' units and counts in `buildStacks`' order. It sizes on a bound table (the Elite rank is a column
 *    of it, `T.eliteRank`), found by the request or by any bound request with the same units, totals, enemy
 *    and events, and packs the request itself when none is bound.
 *
 * `march` and `bill` read a packed request (`packRequest`), one wasm instance per request, bound when
 * `effectiveTable` builds the entries the plan then passes around: an entry is known by identity, so a march
 * of entries from two tables, or from a table nothing bound, is answered `null` and the engine runs its own
 * TypeScript. `sizePool` needs no table and runs on an instance of its own. Nothing allocates per call.
 */
import type { UnitDef } from '../data/types';
import type { LadderKernel, MarchFigures, PlanKernel, PoolSlot } from '../engine/fast';
import { LADDER_ENGINE } from '../engine/fast';
import type { Effective } from '../engine/plan';
import { effectiveTable } from '../engine/plan';
import type { Bill, MarkerRates } from '../engine/rating';
import { templeDivisor } from '../engine/recovery';
import { RANK_SPREAD } from '../engine/stacker';
import type { RecoveryCost, RecoverySettings, StackRequest, StackingOptions } from '../engine/types';

import { R, RECORD_SIZE } from './layout';
import { packRequest } from './pack';

interface PlanExports {
  memory: WebAssembly.Memory;
  alloc(bytes: number): number;
  setTable(ptr: number): void;
  battle(countsPtr: number, outPtr: number): void;
  march(
    n: number,
    rowsPtr: number,
    countsPtr: number,
    enemy: number,
    searchTemple: number,
    outPtr: number,
  ): void;
  bill(n: number, rowsPtr: number, countsPtr: number, outPtr: number): void;
  sizeStacks(
    n: number,
    rowsPtr: number,
    capsPtr: number,
    housingLeadership: number,
    housingAuthority: number,
    housingDominance: number,
    flags: number,
    spread: number,
    outRowsPtr: number,
    outCountsPtr: number,
  ): number;
  sizePool(
    n: number,
    hpPtr: number,
    costPtr: number,
    capPtr: number,
    capacity: number,
    ceiling: number,
    spread: number,
    countsPtr: number,
  ): number;
  ladderScratch(slot: number): number;
  ladderShape(
    m: number,
    len: number,
    learned: number,
    marches: number,
    scale: number,
    gap: number,
    leadership: number,
    housed: number,
    housingLeadership: number,
    housingAuthority: number,
    housingDominance: number,
    budgeted: number,
    budgetPerMarch: number,
    enemy: number,
    searchTemple: number,
    billed: number,
  ): number;
  ladderGrid(
    m: number,
    nDepths: number,
    nGrowths: number,
    marches: number,
    gap: number,
    leadership: number,
    housed: number,
    housingLeadership: number,
    housingAuthority: number,
    housingDominance: number,
    budgeted: number,
    budgetPerMarch: number,
    enemy: number,
    searchTemple: number,
  ): void;
  ladderFinale(
    m: number,
    nDepths: number,
    nGrowths: number,
    gap: number,
    leadership: number,
    housed: number,
    housingLeadership: number,
    housingAuthority: number,
    housingDominance: number,
    budget: number,
    enemy: number,
    searchTemple: number,
  ): number;
}

/** The ladders' scratch slots, mirrored from `G_*` in `kernel/assembly/index.ts`. */
const G = {
  mercs: 1,
  powers: 2,
  order: 3,
  vector: 4,
  held: 5,
  rungs: 6,
  sheltered: 7,
  out: 8,
  depths: 9,
  growths: 10,
  learned: 11,
  orderLen: 12,
  orders: 13,
  status: 14,
  gridRungs: 15,
  gridSheltered: 16,
  gridOut: 17,
} as const;
/** `G_POWER_COUNT` and `G_GRID` of the kernel. */
const POWER_COUNT = 64;
const GRID = 32;

/** One instance's ladder scratch (step 4), reserved on the first `ladders` over it. */
interface LadderScratch {
  ptr: Record<keyof typeof G, number>;
  buffer: ArrayBuffer | null;
  view: {
    mercs: Int32Array;
    powers: Float64Array;
    order: Int32Array;
    vector: Float64Array;
    held: Float64Array;
    rungs: Float64Array;
    sheltered: Float64Array;
    out: Float64Array;
    depths: Int32Array;
    growths: Float64Array;
    learned: Int32Array;
    orderLen: Int32Array;
    orders: Int32Array;
    grid: {
      status: Int32Array;
      rungs: Float64Array;
      sheltered: Float64Array;
      out: Float64Array;
      stride: number;
      serial: number;
    };
  };
  /** How many grids ran over this instance: the last one's answers are the scratch's. */
  serial: number;
  /** The ladder kernel whose hired types, powers and grid the scratch holds now. */
  owner: object | null;
}

function ladderViews(raw: PlanExports, scratch: LadderScratch, types: number): void {
  // A view over a buffer the memory grew out of is detached, and a detached view has no length: that test
  // saves reading `memory.buffer` (a getter that costs) on every call.
  if (scratch.buffer !== null && scratch.view.out.length !== 0) return;
  const buffer = raw.memory.buffer;
  if (scratch.buffer === buffer) return;
  scratch.buffer = buffer;
  const n = Math.max(1, types);
  const p = scratch.ptr;
  scratch.view = {
    mercs: new Int32Array(buffer, p.mercs, n),
    powers: new Float64Array(buffer, p.powers, POWER_COUNT),
    order: new Int32Array(buffer, p.order, n),
    vector: new Float64Array(buffer, p.vector, n),
    held: new Float64Array(buffer, p.held, n),
    rungs: new Float64Array(buffer, p.rungs, n),
    sheltered: new Float64Array(buffer, p.sheltered, n),
    out: new Float64Array(buffer, p.out, 8),
    depths: new Int32Array(buffer, p.depths, GRID),
    growths: new Float64Array(buffer, p.growths, GRID),
    learned: new Int32Array(buffer, p.learned, GRID),
    orderLen: new Int32Array(buffer, p.orderLen, GRID),
    orders: new Int32Array(buffer, p.orders, GRID * n),
    grid: {
      status: new Int32Array(buffer, p.status, GRID * GRID),
      rungs: new Float64Array(buffer, p.gridRungs, GRID * GRID * n),
      sheltered: new Float64Array(buffer, p.gridSheltered, GRID * GRID * n),
      out: new Float64Array(buffer, p.gridOut, GRID * GRID * 8),
      stride: n,
      serial: scratch.serial,
    },
  };
}

/** `sizeStacks`' option bits, mirrored from `F_*` in `kernel/assembly/index.ts`. */
const SIZER_FLAGS = { ms: 1, relaxed: 2, roundTo10: 4, monstersLast: 8, strict: 16 } as const;

/** `march` and `bill` never read the rates (only `rate` does); the header wants numbers all the same. */
const NO_RATES: MarkerRates = { silver: 1, gold: 1, hired: 1, dragonCoins: 1, seconds: 1 };

/** One request packed into its own instance, with a scratch march of `types` stacks. */
interface Bound {
  request: StackRequest;
  table: Float64Array;
  raw: PlanExports;
  types: number;
  ids: readonly string[];
  rowsPtr: number;
  countsPtr: number;
  outPtr: number;
  buffer: ArrayBuffer | null;
  rows: Int32Array;
  counts: Float64Array;
  out: Float64Array;
  /** The sizer's scratch (`sizeStacks`): rows and caps in, rows and counts out, `types` each. */
  sizerPtrs: { rows: number; caps: number; outRows: number; outCounts: number };
  sizerRows: Int32Array;
  sizerCaps: Float64Array;
  sizerOutRows: Int32Array;
  sizerOutCounts: Float64Array;
  /** Row of each unit of `request.units`, by identity. */
  rowOfUnit: Map<UnitDef, number>;
  /** The ladders' scratch (step 4), reserved on the first `ladders` over this instance. */
  ladder: LadderScratch | null;
}

function views(bound: Bound): void {
  const buffer = bound.raw.memory.buffer;
  if (bound.buffer === buffer) return;
  bound.buffer = buffer;
  const n = Math.max(1, bound.types);
  bound.rows = new Int32Array(buffer, bound.rowsPtr, n);
  bound.counts = new Float64Array(buffer, bound.countsPtr, n);
  bound.out = new Float64Array(buffer, bound.outPtr, RECORD_SIZE);
  const p = bound.sizerPtrs;
  bound.sizerRows = new Int32Array(buffer, p.rows, n);
  bound.sizerCaps = new Float64Array(buffer, p.caps, n);
  bound.sizerOutRows = new Int32Array(buffer, p.outRows, n);
  bound.sizerOutCounts = new Float64Array(buffer, p.outCounts, n);
}

function sameTable(a: Float64Array, b: Float64Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) if (!Object.is(a[i], b[i])) return false;
  return true;
}

function isEmpty(map: object): boolean {
  for (const key in map) if (Object.prototype.hasOwnProperty.call(map, key)) return false;
  return true;
}

export function createPlanKernel(module: WebAssembly.Module): PlanKernel {
  const byRequest = new WeakMap<StackRequest, Bound>();
  /**
   * The bounds by `request.units`, for the sizer: its rows depend on the units, the totals, the enemy and the
   * events alone (`effectiveUnit`, `eliteOrder`, `enemySquadCount`), so a request spread from a bound one with
   * other caps, housing or options sizes on the bound table.
   */
  const byUnits = new WeakMap<readonly UnitDef[], Bound[]>();
  const rowOf = new WeakMap<Effective, { bound: Bound; row: number }>();

  const bind = (request: StackRequest, table: readonly Effective[]): Bound | null => {
    let packed;
    try {
      packed = packRequest(request, NO_RATES, table);
    } catch {
      return null;
    }
    const held = byRequest.get(request);
    if (held && sameTable(held.table, packed.table)) return held;
    const raw = new WebAssembly.Instance(module, {}).exports as unknown as PlanExports;
    const types = packed.ids.length;
    const tablePtr = raw.alloc(packed.table.byteLength);
    new Float64Array(raw.memory.buffer, tablePtr, packed.table.length).set(packed.table);
    raw.setTable(tablePtr);
    const n = Math.max(1, types);
    const bound: Bound = {
      request,
      table: packed.table,
      raw,
      types,
      ids: packed.ids,
      rowsPtr: raw.alloc(4 * n),
      countsPtr: raw.alloc(8 * n),
      outPtr: raw.alloc(8 * RECORD_SIZE),
      buffer: null,
      rows: new Int32Array(0),
      counts: new Float64Array(0),
      out: new Float64Array(0),
      sizerPtrs: {
        rows: raw.alloc(4 * n),
        caps: raw.alloc(8 * n),
        outRows: raw.alloc(4 * n),
        outCounts: raw.alloc(8 * n),
      },
      sizerRows: new Int32Array(0),
      sizerCaps: new Float64Array(0),
      sizerOutRows: new Int32Array(0),
      sizerOutCounts: new Float64Array(0),
      rowOfUnit: new Map(request.units.map((unit, row) => [unit, row])),
      ladder: null,
    };
    views(bound);
    byRequest.set(request, bound);
    const siblings = byUnits.get(request.units);
    if (siblings) siblings.push(bound);
    else byUnits.set(request.units, [bound]);
    return bound;
  };

  /** Lay `stacks` into their instance's scratch; the instance, or `null` when they are not all its own. */
  const lay = (stacks: readonly { entry: Effective; count: number }[]): Bound | null => {
    const n = stacks.length;
    if (n === 0) return null;
    const first = rowOf.get((stacks[0] as { entry: Effective }).entry);
    if (!first) return null;
    const bound = first.bound;
    if (n > bound.types) return null;
    views(bound);
    const { rows, counts } = bound;
    for (let i = 0; i < n; i += 1) {
      const stack = stacks[i] as { entry: Effective; count: number };
      const at = rowOf.get(stack.entry);
      if (!at || at.bound !== bound) return null;
      rows[i] = at.row;
      counts[i] = stack.count;
    }
    return bound;
  };

  // `SEARCH_RECOVERY` is one object; its temple divisor is read once.
  let searchRecovery: RecoverySettings | null = null;
  let searchTemple = 1;

  // The sizer's own instance and scratch, grown on demand.
  let sizer: PlanExports | null = null;
  let room = 0;
  let hpPtr = 0;
  let costPtr = 0;
  let capPtr = 0;
  let poolPtr = 0;
  let sizerBuffer: ArrayBuffer | null = null;
  let hpView = new Float64Array(0);
  let costView = new Float64Array(0);
  let capView = new Float64Array(0);
  let poolView = new Float64Array(0);

  return {
    bindTable(request, table) {
      const bound = bind(request, table);
      if (!bound) return;
      table.forEach((entry, row) => rowOf.set(entry, { bound, row }));
    },

    march(stacks, enemyStacks, recovery): MarchFigures | null {
      if (recovery !== searchRecovery) {
        // The kernel bills `retrainOne` with no reduction and no speed: any other settings go to the engine.
        if (!isEmpty(recovery.trainingCostReduction) || !isEmpty(recovery.trainingSpeed)) return null;
        searchRecovery = recovery;
        searchTemple = templeDivisor(recovery.templeLevel);
      }
      if (!Number.isInteger(enemyStacks) || enemyStacks < 0 || enemyStacks > 0x7fffffff) return null;
      const bound = lay(stacks);
      if (!bound) return null;
      bound.raw.march(stacks.length, bound.rowsPtr, bound.countsPtr, enemyStacks, searchTemple, bound.outPtr);
      const out = bound.out;
      return {
        damage: out[0] as number,
        hiredDamage: out[1] as number,
        silver: out[2] as number,
        gold: out[3] as number,
        mercLost: out[4] as number,
        strikes: out[5] as number,
      };
    },

    bill(stacks, recovery): RecoveryCost | null {
      const bound = lay(stacks);
      if (!bound || recovery !== bound.request.recovery) return null;
      bound.raw.bill(stacks.length, bound.rowsPtr, bound.countsPtr, bound.outPtr);
      const out = bound.out;
      return {
        silver: out[0] as number,
        gold: out[1] as number,
        dragonCoins: out[2] as number,
        seconds: out[3] as number,
      };
    },

    marchBill(request: StackRequest, counts: Record<string, number>): Bill | null {
      // Packed by `effectiveTable` (which binds through this kernel) the first time, known by identity after.
      let bound = byRequest.get(request);
      if (!bound) {
        effectiveTable(request);
        bound = byRequest.get(request);
        if (!bound) return null;
      }
      views(bound);
      const into = bound.counts;
      const ids = bound.ids;
      for (let t = 0; t < ids.length; t += 1) into[t] = counts[ids[t] as string] ?? 0;
      bound.raw.battle(bound.countsPtr, bound.outPtr);
      const out = bound.out;
      return {
        damage: out[R.minDamage] as number,
        silver: out[R.silver] as number,
        gold: out[R.gold] as number,
        hired: out[R.hired] as number,
        dragonCoins: out[R.dragonCoins] as number,
        seconds: out[R.seconds] as number,
      };
    },

    sizeStacks(request, units, caps, options: StackingOptions) {
      if (options.method === 'custom' && (options.customOrder?.length ?? 0) > 0) return null;
      const sameArmy = (held: Bound): boolean =>
        held.request.totals === request.totals &&
        held.request.enemy === request.enemy &&
        held.request.activeEvents === request.activeEvents;
      let bound = byRequest.get(request);
      if (!bound || !sameArmy(bound)) bound = byUnits.get(request.units)?.find(sameArmy);
      // Not bound yet (a host sizing before planning, or a test): pack it here, once.
      bound ??= bind(request, effectiveTable(request)) ?? undefined;
      if (!bound) return null;
      views(bound);
      const { rowOfUnit, sizerRows, sizerCaps } = bound;
      const n = units.length;
      if (n > bound.types) return null;
      let last = -1;
      for (let i = 0; i < n; i += 1) {
        const unit = units[i] as UnitDef;
        const row = rowOfUnit.get(unit);
        // `units` must be `request.units` filtered in its own order: the Elite rank of the subset is then the
        // table's.
        if (row === undefined || row <= last) return null;
        last = row;
        sizerRows[i] = row;
        sizerCaps[i] = caps[unit.id] ?? Number.MAX_SAFE_INTEGER;
      }
      const flags =
        (options.method === 'ms' ? SIZER_FLAGS.ms : 0) |
        (options.relaxedPreservation === true ? SIZER_FLAGS.relaxed : 0) |
        (options.roundTo10 ? SIZER_FLAGS.roundTo10 : 0) |
        (options.monstersLast ? SIZER_FLAGS.monstersLast : 0) |
        (options.strictMercsAboveMonsters ? SIZER_FLAGS.strict : 0);
      const p = bound.sizerPtrs;
      const housing = request.housing;
      const k = bound.raw.sizeStacks(
        n,
        p.rows,
        p.caps,
        housing.leadership,
        housing.authority,
        housing.dominance,
        flags,
        RANK_SPREAD,
        p.outRows,
        p.outCounts,
      );
      if (k < 0) return null;
      // Its first call reserves the sizer's scratch, which may have grown the memory: read through fresh views.
      views(bound);
      const ids = bound.ids;
      const out: { unitId: string; count: number }[] = new Array(k);
      for (let s = 0; s < k; s += 1) {
        out[s] = {
          unitId: ids[bound.sizerOutRows[s] as number] as string,
          count: bound.sizerOutCounts[s] as number,
        };
      }
      return out;
    },

    ladders(troops, mercTypes, enemyStacks, recovery, powers, depths, growths): LadderKernel | null {
      if (!isEmpty(recovery.trainingCostReduction) || !isEmpty(recovery.trainingSpeed)) return null;
      if (!Number.isInteger(enemyStacks) || enemyStacks < 0 || enemyStacks > 0x7fffffff) return null;
      const firstEntry = troops[0] ?? mercTypes[0];
      const first = firstEntry && rowOf.get(firstEntry);
      if (!first) return null;
      const bound = first.bound;
      const m = mercTypes.length;
      if (troops.length + m > bound.types || troops.length > POWER_COUNT || powers.length < POWER_COUNT)
        return null;
      if (depths.length > GRID || growths.length > GRID) return null;
      if (!depths.every((depth) => Number.isInteger(depth) && depth >= 1)) return null;
      // Every entry one row of this instance, no row twice: a march then never fields more stacks than the
      // table has types, the bound the kernel's scratch is sized by.
      const mercRows = new Int32Array(m);
      const troopRows = new Int32Array(troops.length);
      const mercSet = new Set<number>();
      const troopSet = new Set<number>();
      for (let i = 0; i < m; i += 1) {
        const at = rowOf.get(mercTypes[i] as Effective);
        if (!at || at.bound !== bound || mercSet.has(at.row)) return null;
        mercSet.add(at.row);
        mercRows[i] = at.row;
      }
      for (let i = 0; i < troops.length; i += 1) {
        const at = rowOf.get(troops[i] as Effective);
        if (!at || at.bound !== bound || troopSet.has(at.row) || mercSet.has(at.row)) return null;
        troopSet.add(at.row);
        troopRows[i] = at.row;
      }
      const raw = bound.raw;
      if (!bound.ladder) {
        const ptr = {} as Record<keyof typeof G, number>;
        for (const key of Object.keys(G) as (keyof typeof G)[]) ptr[key] = raw.ladderScratch(G[key]);
        bound.ladder = {
          ptr,
          buffer: null,
          view: null as unknown as LadderScratch['view'],
          owner: null,
          serial: 0,
        };
      }
      const scratch = bound.ladder;
      const temple = templeDivisor(recovery.templeLevel);
      const stride = Math.max(1, bound.types);
      /** An order's rows — a learned order is a permutation of some troop types — or `null` if not one. */
      const ordersRows = new WeakMap<readonly Effective[], Int32Array | null>();
      const rowsOfOrder = (order: readonly Effective[]): Int32Array | null => {
        let rows = ordersRows.get(order);
        if (rows !== undefined) return rows;
        rows = new Int32Array(order.length);
        const seen = new Set<number>();
        for (let i = 0; i < order.length; i += 1) {
          const at = rowOf.get(order[i] as Effective);
          if (!at || at.bound !== bound || !troopSet.has(at.row) || seen.has(at.row)) {
            rows = null;
            break;
          }
          seen.add(at.row);
          rows[i] = at.row;
        }
        ordersRows.set(order, rows);
        return rows;
      };
      // `troops.slice(-depth)` for an integer depth of 1 or more.
      const ranking = (depth: number): Int32Array => troopRows.subarray(Math.max(0, troops.length - depth));
      const vector = new Float64Array(m);
      const held = new Float64Array(m);
      const kernel: LadderKernel = {
        vector,
        held,
        rungs: new Float64Array(0),
        sheltered: new Float64Array(0),
        out: new Float64Array(0),
        recovery: bound.request.recovery,
        shape(marches, depth, scale, order, gap, leadership, housing, budgetPerMarch) {
          if (!Number.isInteger(depth) || depth < 1) return LADDER_ENGINE;
          const rows = order === undefined ? ranking(depth) : rowsOfOrder(order);
          if (rows === null) return LADDER_ENGINE;
          activate();
          const view = scratch.view;
          view.order.set(rows);
          view.vector.set(vector);
          view.held.set(held);
          return raw.ladderShape(
            m,
            rows.length,
            order === undefined ? 0 : 1,
            marches,
            scale,
            gap,
            leadership,
            housing ? 1 : 0,
            housing ? housing.leadership : 0,
            housing ? housing.authority : 0,
            housing ? housing.dominance : 0,
            budgetPerMarch === undefined ? 0 : 1,
            budgetPerMarch ?? 0,
            enemyStacks,
            temple,
            1,
          );
        },
        finale(orders, gap, leadership, housing, budget) {
          activate();
          const view = scratch.view;
          if (!layOrders(orders)) return null;
          view.vector.set(vector);
          const best = raw.ladderFinale(
            m,
            depths.length,
            growths.length,
            gap,
            leadership,
            housing ? 1 : 0,
            housing ? housing.leadership : 0,
            housing ? housing.authority : 0,
            housing ? housing.dominance : 0,
            budget,
            enemyStacks,
            temple,
          );
          return best === -2 ? null : best;
        },
        grid(marches, orders, gap, leadership, housing, budgetPerMarch) {
          activate();
          const view = scratch.view;
          if (!layOrders(orders)) return -1;
          view.vector.set(vector);
          view.held.set(held);
          raw.ladderGrid(
            m,
            depths.length,
            growths.length,
            marches,
            gap,
            leadership,
            housing ? 1 : 0,
            housing ? housing.leadership : 0,
            housing ? housing.authority : 0,
            housing ? housing.dominance : 0,
            budgetPerMarch === undefined ? 0 : 1,
            budgetPerMarch ?? 0,
            enemyStacks,
            temple,
          );
          scratch.serial += 1;
          return scratch.serial;
        },
        gridView() {
          ladderViews(raw, scratch, bound.types);
          const grid = scratch.view.grid;
          grid.serial = scratch.serial;
          return grid;
        },
      };
      /** Each depth's order into the scratch (the ranking's where none is learned); false if one is unreadable. */
      const layOrders = (orders: readonly (readonly Effective[] | undefined)[]): boolean => {
        const view = scratch.view;
        for (let j = 0; j < depths.length; j += 1) {
          const order = orders[j];
          const rows = order === undefined ? ranking(depths[j] as number) : rowsOfOrder(order);
          if (rows === null) return false;
          view.learned[j] = order === undefined ? 0 : 1;
          view.orderLen[j] = rows.length;
          view.orders.set(rows, j * stride);
        }
        return true;
      };
      /** Fresh views, and this kernel's hired types, powers and grid in the instance's scratch. */
      const activate = (): void => {
        ladderViews(raw, scratch, bound.types);
        if (scratch.owner !== kernel) {
          scratch.owner = kernel;
          const view = scratch.view;
          view.mercs.set(mercRows);
          for (let k = 0; k < POWER_COUNT; k += 1) view.powers[k] = powers[k] as number;
          for (let j = 0; j < depths.length; j += 1) view.depths[j] = depths[j] as number;
          for (let g = 0; g < growths.length; g += 1) view.growths[g] = growths[g] as number;
        }
        const view = scratch.view;
        kernel.rungs = view.rungs;
        kernel.sheltered = view.sheltered;
        kernel.out = view.out;
      };
      return kernel;
    },

    sizePool(slots: readonly PoolSlot[], capacity: number, ceiling: number | undefined, spread: number) {
      if (ceiling !== undefined && Number.isNaN(ceiling)) return null;
      const n = slots.length;
      if (!sizer) sizer = new WebAssembly.Instance(module, {}).exports as unknown as PlanExports;
      if (n > room) {
        room = Math.max(n, 2 * room, 16);
        hpPtr = sizer.alloc(8 * room);
        costPtr = sizer.alloc(8 * room);
        capPtr = sizer.alloc(8 * room);
        poolPtr = sizer.alloc(8 * room);
        sizerBuffer = null;
      }
      if (sizerBuffer !== sizer.memory.buffer) {
        sizerBuffer = sizer.memory.buffer;
        hpView = new Float64Array(sizerBuffer, hpPtr, room);
        costView = new Float64Array(sizerBuffer, costPtr, room);
        capView = new Float64Array(sizerBuffer, capPtr, room);
        poolView = new Float64Array(sizerBuffer, poolPtr, room);
      }
      for (let i = 0; i < n; i += 1) {
        const slot = slots[i] as PoolSlot;
        hpView[i] = slot.hp;
        costView[i] = slot.cost;
        capView[i] = slot.cap;
      }
      const used = sizer.sizePool(n, hpPtr, costPtr, capPtr, capacity, ceiling ?? NaN, spread, poolPtr);
      for (let i = 0; i < n; i += 1) (slots[i] as PoolSlot).count = poolView[i] as number;
      return used;
    },
  };
}
