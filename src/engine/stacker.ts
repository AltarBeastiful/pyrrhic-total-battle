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
import { simulateBattle } from './battle';
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

// ---- Wording -------------------------------------------------------------------------------------
/**
 * Everything in `warnings` and `dropped[].reason` is read by a player, not by us: short sentences, unit
 * labels (ARC3) instead of ids, grouped digits, the game's own housing names, and the vocabulary of
 * `docs/design.md` §7 — "Allow damage trades", never the word this codebase uses internally.
 *
 * Drop reasons stay free of unit labels on purpose: the results list groups the types that share a reason
 * under one line, and a label inside the sentence would split every group.
 */
const num = (value: number): string => value.toLocaleString('en-US');

function dropReason(slot: Slot, pool: Pool, ceiling: number | undefined, rounded: boolean): string {
  if (ceiling !== undefined && slot.hp > ceiling) {
    return `one of them alone (${num(slot.hp)} HP) is bigger than your smallest troop stack, so it could not fall after your troops`;
  }
  if (rounded) return `fewer than ${String(CHUNK)} fit, and hired units come in tens`;
  return `no ${pool} left to pay for them`;
}

// ---- Pinned unit types ---------------------------------------------------------------------------
/**
 * A pinned type is forced to the smallest stack that still makes sense: one unit, or a whole chunk of ten
 * under "round to 10s" (mercenaries and monsters only), because revival and training work in tens.
 */
function pinnedMinimum(round: boolean): number {
  return round ? CHUNK : 1;
}

/** Pinned slots whose minimum does not fit at all, with the reason to drop them for. */
type Refusals = { slot: Slot; reason: string }[];

/**
 * Size one pool while honouring the pinned unit types.
 *
 * A pinned type the normal solve leaves empty takes its minimum count **out of the pool capacity first**;
 * the rest of the pool is then re-solved with what is left, so the flat profile is rebalanced around the
 * pin instead of being broken after the fact. Forcing one pin can starve another, hence the loop — it runs
 * at most once per slot. A forced stack ignores the preservation ceiling (that is what pinning is for) but
 * never its own cap, and a pin whose minimum does not fit the housing is refused so the caller can drop it
 * with a reason that says why.
 */
function sizePoolPinned(
  slots: Slot[],
  capacity: number,
  options: PoolOptions,
  pinned: ReadonlySet<string>,
  round: boolean,
): Refusals {
  if (slots.length === 0) {
    sizePool(slots, capacity, options);
    return [];
  }
  const minimum = pinnedMinimum(round);
  const forced = new Map<Slot, number>();
  const refused: Refusals = [];
  const settled = new Set<Slot>();
  const pool = slots[0]!.unit.pool;

  for (let pass = 0; pass <= slots.length; pass += 1) {
    let reserved = 0;
    for (const [slot, count] of forced) reserved += count * slot.cost;
    const free = slots.filter((slot) => !forced.has(slot));
    const used = sizePool(free, capacity - reserved, options);
    if (round) roundDownToChunks(free, used);
    for (const [slot, count] of forced) slot.count = count;

    const short = slots.find(
      (slot) => pinned.has(slot.unit.id) && !forced.has(slot) && !settled.has(slot) && slot.count < minimum,
    );
    if (!short) break;
    settled.add(short);
    // A cap below the minimum is still worth honouring: the user pinned what they own, so give them all of
    // it rather than nothing — only an empty cap leaves us with nothing to force.
    const target = Math.min(minimum, short.cap);
    if (target < 1) {
      refused.push({ slot: short, reason: 'pinned, but you own none of them' });
      short.count = 0;
      continue;
    }
    if (target * short.cost > capacity - reserved) {
      refused.push({
        slot: short,
        reason: `pinned, but even ${String(target)} of them ${target === 1 ? 'does' : 'do'} not fit in your ${pool} housing`,
      });
      short.count = 0;
      continue;
    }
    forced.set(short, target);
  }
  return refused;
}

/** Safety valve for the relaxed-preservation post-pass; it normally halts after two or three steps. */
export const MAX_RELAX_STEPS = 500;

function poolUsage(slots: Slot[]): number {
  return slots.reduce((sum, slot) => sum + slot.count * slot.cost, 0);
}

/** The live stacks of a slot list, in the order the enemy destroys them (total HP descending). */
function buildStacks(slots: Slot[]): Stack[] {
  const stacks: Stack[] = [];
  for (const slot of slots) {
    if (slot.count <= 0) continue;
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
  return stacks;
}

const NO_POOLS: Record<Pool, PoolUsage> = {
  leadership: { used: 0, capacity: 0 },
  authority: { used: 0, capacity: 0 },
  dominance: { used: 0, capacity: 0 },
};

/**
 * Relaxed preservation (investigation 0003, D-04): after M's Preservation has sized the pools, keep adding one
 * unit to the monster or mercenary stack whose increment improves the average damage most — but accept the
 * step only when the **minimum** damage improves as well. Without that guard the search keeps feeding one
 * sacrificial top-of-the-order stack, which only lifts the maximum; with it, the pass halts exactly where
 * TotalStack's "Total Optimization" run does (WE 11 / BB 6 / ED 5 / SG 4, dominance 136).
 */
function relaxPreservation(slots: Slot[], request: StackRequest, used: Record<Pool, number>): number {
  const step = request.options.roundTo10 ? CHUNK : 1;
  const candidates = slots.filter((slot) => slot.unit.pool !== 'leadership');
  if (candidates.length === 0) return 0;

  const score = (): { avg: number; min: number } => {
    const summary = simulateBattle(
      { stacks: buildStacks(slots), pools: NO_POOLS, dropped: [], warnings: [] },
      request,
    );
    return { avg: summary.avgDamage, min: summary.minDamage };
  };

  let current = score();
  let accepted = 0;
  for (let attempt = 0; attempt < MAX_RELAX_STEPS; attempt += 1) {
    let chosen: Slot | undefined;
    let chosenScore: { avg: number; min: number } | undefined;
    for (const slot of candidates) {
      const pool = slot.unit.pool;
      if (slot.count + step > slot.cap) continue;
      if (used[pool] + slot.cost * step > request.housing[pool]) continue;
      slot.count += step;
      const candidate = score();
      slot.count -= step;
      if (!chosenScore || candidate.avg > chosenScore.avg) {
        chosen = slot;
        chosenScore = candidate;
      }
    }
    if (!chosen || !chosenScore) break;
    if (chosenScore.avg <= current.avg || chosenScore.min <= current.min) break;
    chosen.count += step;
    used[chosen.unit.pool] += chosen.cost * step;
    current = chosenScore;
    accepted += 1;
  }
  return accepted;
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
  const pinned = new Set(request.pinned ?? []);
  const labelOf = new Map(request.units.map((unit) => [unit.id, unit.label]));
  const pinnedDrops = new Map<string, string>();
  const collect = (refusals: Refusals): void => {
    for (const { slot, reason } of refusals) pinnedDrops.set(slot.unit.id, reason);
  };

  collect(sizePoolPinned(byPool.leadership, housing.leadership, {}, pinned, false));

  const lowest = (pool: Slot[]): number | undefined => {
    const live = pool.filter((slot) => slot.count > 0).map((slot) => slot.count * slot.hp);
    return live.length > 0 ? Math.min(...live) : undefined;
  };

  const troopFloor = lowest(byPool.leadership);
  const mercCeiling = options.method === 'ms' && troopFloor !== undefined ? troopFloor - 1 : undefined;
  if (mercCeiling !== undefined) ceilings.authority = mercCeiling;
  collect(
    sizePoolPinned(
      byPool.authority,
      housing.authority,
      { ...(mercCeiling === undefined ? {} : { ceiling: mercCeiling }) },
      pinned,
      options.roundTo10,
    ),
  );

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
  collect(
    sizePoolPinned(
      byPool.dominance,
      housing.dominance,
      { ...(monsterCeiling === undefined ? {} : { ceiling: monsterCeiling }) },
      pinned,
      options.roundTo10,
    ),
  );

  let relaxed = 0;
  if (options.method === 'ms' && options.relaxedPreservation === true) {
    relaxed = relaxPreservation(slots, request, {
      leadership: poolUsage(byPool.leadership),
      authority: poolUsage(byPool.authority),
      dominance: poolUsage(byPool.dominance),
    });
  }
  for (const pool of POOLS) {
    pools[pool] = { used: poolUsage(byPool[pool]), capacity: housing[pool] };
  }

  const dropped: { unitId: string; reason: string }[] = [];
  for (const slot of slots) {
    if (slot.count > 0) continue;
    dropped.push({
      unitId: slot.unit.id,
      reason:
        pinnedDrops.get(slot.unit.id) ??
        dropReason(
          slot,
          slot.unit.pool,
          ceilings[slot.unit.pool],
          options.roundTo10 && slot.unit.pool !== 'leadership',
        ),
    });
  }
  const stacks = buildStacks(slots);

  const label = (unitId: string): string => labelOf.get(unitId) ?? unitId;
  // The troop stack the whole "hired units fall last" promise is measured against.
  const lastTroop = stacks.filter((stack) => stack.pool === 'leadership').at(-1);

  // A pin that had to break its pool's ceiling keeps its true place in the order (it is the biggest stack,
  // so the enemy takes it first) — say so, because falling last is what the user chose the method for.
  if (troopFloor !== undefined && lastTroop) {
    for (const stack of stacks) {
      if (!pinned.has(stack.unitId) || stack.pool === 'leadership') continue;
      const ceiling = ceilings[stack.pool];
      if (ceiling === undefined || stack.totalHp <= ceiling || stack.totalHp < troopFloor) continue;
      warnings.push(
        `${label(stack.unitId)} is pinned, and its stack (${num(stack.totalHp)} HP) is bigger than your smallest troop stack, so it falls before ${label(lastTroop.unitId)}.`,
      );
    }
  }

  if (relaxed > 0 && troopFloor !== undefined && lastTroop) {
    const grown = stacks.filter((stack) => stack.pool !== 'leadership' && stack.totalHp >= troopFloor);
    if (grown.length > 0) {
      const list = grown.map((stack) => `${label(stack.unitId)} to ${num(stack.count)}`);
      const phrase = list.length === 1 ? list[0] : `${list.slice(0, -1).join(', ')} and ${list.at(-1) ?? ''}`;
      warnings.push(
        `Allow damage trades grew ${phrase}; ${grown.length === 1 ? 'it now falls' : 'they now fall'} before ${label(lastTroop.unitId)}.`,
      );
    }
  }

  for (const pool of POOLS) {
    const usage = pools[pool];
    if (usage.capacity <= 0 || usage.used >= usage.capacity) continue;
    const left = `${num(usage.capacity - usage.used)} ${pool} left unused`;
    if (byPool[pool].length === 0) {
      warnings.push(`${left}; nothing in this march needs it.`);
    } else if (ceilings[pool] !== undefined) {
      warnings.push(`${left} so hired units fall after your troops.`);
    } else if (options.roundTo10 && pool !== 'leadership') {
      warnings.push(`${left} because hired units come in tens.`);
    } else {
      warnings.push(`${left}; nothing else fits.`);
    }
  }
  for (let i = 1; i < stacks.length; i += 1) {
    const previous = stacks[i - 1];
    const current = stacks[i];
    if (previous && current && previous.totalHp === current.totalHp) {
      warnings.push(
        `${label(previous.unitId)} and ${label(current.unitId)} tie at ${num(current.totalHp)} HP; the game decides which falls first.`,
      );
    }
  }

  return { stacks, pools, dropped, warnings };
}

function buildOrderIndex(request: StackRequest): Map<string, number> {
  const ids = buildKillOrder(request.units, request.options);
  return new Map(ids.map((id, index) => [id, index]));
}
