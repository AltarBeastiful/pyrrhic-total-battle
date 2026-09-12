/**
 * S-23 — stack sizing, "flat HP profile with strict ordering and exact fill" (PLAN §3.4).
 *
 * Per pool: binary-search one HP ceiling H, give rank i the target `H − i·δ` (δ = `RANK_SPREAD` × H, a small
 * ladder so the first-to-die stacks sit slightly higher), take `floor(target / hpPerUnit)` units, then
 * round-robin from the front adding single units until the pool is filled exactly.
 *
 * `RANK_SPREAD` is fitted to the captured TotalStack runs: it reproduces ep-8stacks and the review §3 run to
 * ±1 unit and the Elite-Preservation monster pool exactly. A pure "maximise the lowest stack" solve (δ = 0)
 * is off by up to 4 units, and the PLAN's "margin ≥ one unit of the later stack" is off by 13.
 *
 * PLAN §3.4 asks for a *strictly* decreasing profile; the reference implementation does not produce one
 * (ep-8stacks ships ARC2 = SP2 = 97,470 and SP3 = RD3 = 96,960) and forcing strictness costs 3-5 units per
 * stack against the fixtures. So the sizer aims for the flat profile and exact fill, returns the stacks in
 * the order the enemy really kills them (total HP descending) and reports every tie in `warnings`.
 */
import type { Pool, UnitDef } from '../data/types';
import { buildKillOrder } from './killOrder';
import { CHUNK } from './recovery';
import { effectiveUnit, hitDamage, type EffectiveUnit } from './units';
import type { Stack, StackRequest, StackResult, PoolUsage } from './types';

/** Relative gap between two consecutive HP targets. Fitted to the fixtures — see the module comment. */
export const RANK_SPREAD = 0.0019;

const POOLS: Pool[] = ['leadership', 'authority', 'dominance'];

interface Slot {
  unit: UnitDef;
  effective: EffectiveUnit;
  hp: number;
  cost: number;
  cap: number;
  count: number;
  rank: number;
}

interface PoolOptions {
  /** Hard total-HP ceiling for every stack of the pool (M's Preservation / Monsters Last). */
  ceiling?: number;
}

function unitsForTarget(slot: Slot, target: number): number {
  if (slot.hp <= 0 || slot.cost <= 0) return 0;
  return Math.max(0, Math.min(Math.floor(target / slot.hp), slot.cap));
}

/**
 * Size one pool. `slots` must already be in rank order (first to die first); the returned counts are written
 * back onto the slots.
 */
function sizePool(slots: Slot[], capacity: number, options: PoolOptions): number {
  for (const slot of slots) slot.count = 0;
  if (slots.length === 0 || capacity <= 0) return 0;
  const { ceiling } = options;

  const countsAt = (ceilingHp: number): number[] => {
    const delta = RANK_SPREAD * ceilingHp;
    return slots.map((slot, index) => unitsForTarget(slot, ceilingHp - index * delta));
  };
  const usedBy = (counts: number[]): number =>
    counts.reduce((sum, count, index) => sum + count * (slots[index]?.cost ?? 0), 0);

  const maxHp = Math.max(...slots.map((slot) => slot.hp));
  let low = 0;
  let high = ceiling ?? (capacity + 1) * Math.max(maxHp, 1);
  if (ceiling !== undefined && usedBy(countsAt(ceiling)) <= capacity) low = ceiling;
  else {
    for (let step = 0; step < 200; step += 1) {
      const mid = (low + high) / 2;
      if (usedBy(countsAt(mid)) <= capacity) low = mid;
      else high = mid;
    }
  }

  const counts = countsAt(low);
  let rest = capacity - usedBy(counts);

  // Exact fill: single-unit passes from the first-to-die stack down.
  let changed = true;
  while (changed && rest > 0) {
    changed = false;
    for (let index = 0; index < slots.length; index += 1) {
      const slot = slots[index];
      if (!slot || slot.hp <= 0) continue;
      const next = (counts[index] ?? 0) + 1;
      if (slot.cost > rest || next > slot.cap) continue;
      if (ceiling !== undefined && next * slot.hp > ceiling) continue;
      counts[index] = next;
      rest -= slot.cost;
      changed = true;
    }
  }

  slots.forEach((slot, index) => {
    slot.count = counts[index] ?? 0;
  });
  return capacity - rest;
}

/**
 * "Round to 10s": revival and training work in chunks of ten, so mercenary and monster counts are truncated
 * to a multiple of ten *after* the flat profile is solved. TotalStack leaves the freed capacity unused
 * (ep-round-to-10s: Water Elemental 18 → 10, dominance 30/200, the other three monster types dropped).
 */
function roundDownToChunks(slots: Slot[], capacity: number): number {
  let used = 0;
  for (const slot of slots) {
    slot.count = Math.floor(slot.count / CHUNK) * CHUNK;
    used += slot.count * slot.cost;
  }
  return Math.min(used, capacity);
}

function dropReason(slot: Slot, pool: Pool, ceiling: number | undefined, rounded: boolean): string {
  if (ceiling !== undefined && slot.hp > ceiling) {
    return `one unit (${slot.hp} HP) already exceeds the ${ceiling} HP ceiling of the kill order`;
  }
  if (rounded) return `fewer than ${CHUNK} units fit the flat HP profile of the ${pool} pool`;
  return `no ${pool} capacity left for this unit type`;
}

/**
 * Size every pool of a march. Returns the stacks in the order the enemy destroys them — total HP descending,
 * ties broken by the kill-order ranking (the enemy always wipes our highest-HP living stack).
 */
export function sizeStacks(request: StackRequest): StackResult {
  const { options, housing, totals, enemy, activeEvents, caps } = request;
  const order = buildOrderIndex(request);
  const slots: Slot[] = request.units.map((unit) => {
    const effective = effectiveUnit(unit, totals, enemy, activeEvents);
    return {
      unit,
      effective,
      hp: effective.hpPerUnit,
      cost: unit.cost,
      cap: caps[unit.id] ?? Number.MAX_SAFE_INTEGER,
      count: 0,
      rank: order.get(unit.id) ?? Number.MAX_SAFE_INTEGER,
    };
  });
  slots.sort((a, b) => a.rank - b.rank);

  const byPool: Record<Pool, Slot[]> = { leadership: [], authority: [], dominance: [] };
  for (const slot of slots) byPool[slot.unit.pool].push(slot);

  const pools = {} as Record<Pool, PoolUsage>;
  const warnings: string[] = [];
  const ceilings: Partial<Record<Pool, number>> = {};

  const used = sizePool(byPool.leadership, housing.leadership, {});
  pools.leadership = { used, capacity: housing.leadership };

  const lowest = (pool: Slot[]): number | undefined => {
    const live = pool.filter((slot) => slot.count > 0).map((slot) => slot.count * slot.hp);
    return live.length > 0 ? Math.min(...live) : undefined;
  };

  const troopFloor = lowest(byPool.leadership);
  const mercCeiling = options.method === 'ms' && troopFloor !== undefined ? troopFloor - 1 : undefined;
  if (mercCeiling !== undefined) ceilings.authority = mercCeiling;
  let usedAuthority = sizePool(byPool.authority, housing.authority, {
    ...(mercCeiling === undefined ? {} : { ceiling: mercCeiling }),
  });
  if (options.roundTo10) usedAuthority = roundDownToChunks(byPool.authority, usedAuthority);
  pools.authority = { used: usedAuthority, capacity: housing.authority };

  let monsterCeiling: number | undefined;
  if (options.method === 'ms' && troopFloor !== undefined) monsterCeiling = troopFloor - 1;
  else if (options.monstersLast && troopFloor !== undefined) monsterCeiling = troopFloor - 1;
  if (options.method === 'ms' && options.strictMercsAboveMonsters) {
    const mercFloor = lowest(byPool.authority);
    if (mercFloor !== undefined) {
      monsterCeiling = Math.min(monsterCeiling ?? mercFloor - 1, mercFloor - 1);
    }
  }
  if (monsterCeiling !== undefined) ceilings.dominance = monsterCeiling;
  let usedDominance = sizePool(byPool.dominance, housing.dominance, {
    ...(monsterCeiling === undefined ? {} : { ceiling: monsterCeiling }),
  });
  if (options.roundTo10) usedDominance = roundDownToChunks(byPool.dominance, usedDominance);
  pools.dominance = { used: usedDominance, capacity: housing.dominance };

  const dropped: { unitId: string; reason: string }[] = [];
  const stacks: Stack[] = [];
  for (const slot of slots) {
    if (slot.count <= 0) {
      dropped.push({
        unitId: slot.unit.id,
        reason: dropReason(
          slot,
          slot.unit.pool,
          ceilings[slot.unit.pool],
          options.roundTo10 && slot.unit.pool !== 'leadership',
        ),
      });
      continue;
    }
    const { damage, features } = hitDamage(slot.effective, slot.count);
    stacks.push({
      unitId: slot.unit.id,
      pool: slot.unit.pool,
      count: slot.count,
      hpPerUnit: slot.hp,
      totalHp: slot.count * slot.hp,
      strengthPerUnit: slot.effective.strengthPerUnit,
      target: slot.effective.target,
      damagePerHit: damage,
      featuresDamage: features,
      doubleDamageChance: slot.effective.doubleDamageChance,
      strikeTwoSquadsChance: slot.effective.strikeTwoSquadsChance,
    });
  }

  const rankOf = new Map(slots.map((slot) => [slot.unit.id, slot.rank]));
  stacks.sort((a, b) => b.totalHp - a.totalHp || (rankOf.get(a.unitId) ?? 0) - (rankOf.get(b.unitId) ?? 0));

  for (const pool of POOLS) {
    const usage = pools[pool];
    if (usage.capacity > 0 && usage.used < usage.capacity) {
      warnings.push(`${usage.capacity - usage.used} unused ${pool}`);
    }
  }
  for (let i = 1; i < stacks.length; i += 1) {
    const previous = stacks[i - 1];
    const current = stacks[i];
    if (previous && current && previous.totalHp === current.totalHp) {
      warnings.push(
        `${previous.unitId} and ${current.unitId} have the same total HP (${current.totalHp}); the game may kill them in either order`,
      );
    }
  }

  return { stacks, pools, dropped, warnings };
}

function buildOrderIndex(request: StackRequest): Map<string, number> {
  const ids = buildKillOrder(request.units, request.options);
  return new Map(ids.map((id, index) => [id, index]));
}
