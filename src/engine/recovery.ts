/**
 * S-33 — recovery cost (PLAN §3.5, "Recovery").
 *
 * The captured runs only add up if units are recovered in **chunks of ten**: the game trains and revives
 * monsters ten at a time, and one unit in every chunk comes back free. Writing `chunks(n) = ceil(n / 10)`:
 *
 *   retrain silver  = Σ troops   n × training.silver × (1 − reduction[group] / 100)
 *                   + Σ monsters chunks(n) × training.silver
 *   retrain time    = Σ troops   n × training.seconds / (1 + speed[group] / 100)
 *                   + Σ monsters chunks(n) × training.seconds / (1 + speed.monster / 100)
 *   dragon coins    = Σ monsters chunks(n) × training.dragonCoins
 *   revive gold     = Σ all      (n − chunks(n)) × revival.gold / templeMultiplier[level]
 *   retrain gold    = the monsters' revive gold (monsters cannot be retrained back into the march)
 *
 * That reproduces every silver, gold, dragon-coin and duration figure of the seven captured runs exactly and
 * explains the three "unexplained constants" of battle-model-observations §4 (M = 75,600 = the monsters'
 * chunk silver; 2,752 = the monsters' chunk-discounted revive gold; 13,520 = the whole army's).
 * Still open (kept as `it.todo`): revive **silver** (216,000 at temple 0) and revive **time** (1 d 2 h).
 */
import type { Group, Pool, UnitDef } from '../data/types';
import type { RecoveryCost, RecoveryMode, RecoverySettings, Stack } from './types';

/** Temple level → revival cost divisor, from the game's temple table (level 0 = 1). */
export const TEMPLE_MULTIPLIER: Record<number, number> = {
  0: 1,
  1: 1.04,
  2: 1.06,
  3: 1.08,
  4: 1.11,
  5: 1.13,
  6: 1.16,
  7: 1.19,
  8: 1.22,
  9: 1.27,
  10: 1.33,
  11: 1.36,
  12: 1.4,
  13: 1.44,
  14: 1.48,
  15: 1.53,
  16: 1.58,
  17: 1.63,
  18: 1.68,
  19: 1.74,
  20: 1.81,
  21: 1.91,
  22: 2.02,
  23: 2.15,
  24: 2.31,
  25: 2.51,
  26: 2.68,
  27: 2.88,
  28: 3.13,
  29: 3.44,
  30: 3.84,
  31: 3.93,
  32: 4.03,
  33: 4.13,
  34: 4.23,
  35: 4.34,
  36: 4.46,
  37: 4.59,
  38: 4.72,
  39: 4.87,
  40: 5.02,
  41: 5.17,
  42: 5.34,
  43: 5.52,
  44: 5.71,
  45: 5.91,
};

/** Units are trained and revived ten at a time. */
export const CHUNK = 10;
export function chunks(count: number): number {
  return Math.ceil(count / CHUNK);
}

export function templeDivisor(level: number): number {
  return TEMPLE_MULTIPLIER[Math.max(0, Math.round(level))] ?? 1;
}

function percent(map: Partial<Record<Group, number>>, group: Group | undefined): number {
  return group === undefined ? 0 : (map[group] ?? 0);
}

function empty(): RecoveryCost {
  return { silver: 0, gold: 0, dragonCoins: 0, seconds: 0 };
}

function add(into: RecoveryCost, other: RecoveryCost): RecoveryCost {
  return {
    silver: into.silver + other.silver,
    gold: into.gold + other.gold,
    dragonCoins: into.dragonCoins + other.dragonCoins,
    seconds: into.seconds + other.seconds,
  };
}

/** Retrain one stack: per-unit silver and time for troops, per-chunk for monsters and mercenaries. */
export function retrainOne(unit: UnitDef, count: number, settings: RecoverySettings): RecoveryCost {
  const cost = empty();
  const training = unit.training;
  const byChunk = unit.pool !== 'leadership';
  const billed = byChunk ? chunks(count) : count;
  if (training) {
    const reduction = 1 - percent(settings.trainingCostReduction, unit.group) / 100;
    const speed = 1 + percent(settings.trainingSpeed, unit.group) / 100;
    cost.silver = billed * training.silver * reduction;
    cost.seconds = (billed * training.seconds) / speed;
    cost.dragonCoins = billed * (training.dragonCoins ?? 0);
  }
  // Monsters and mercenaries cannot be retrained back into the march; the units a chunk does not return
  // are paid for in gold (this is exactly TotalStack's "retrain all" gold line).
  if (byChunk) cost.gold = reviveOne(unit, count, settings).gold;
  return cost;
}

/** Revive one stack: one unit per chunk of ten comes back free, the temple divides the gold. */
export function reviveOne(unit: UnitDef, count: number, settings: RecoverySettings): RecoveryCost {
  const paid = count - chunks(count);
  return {
    silver: 0,
    gold: (paid * unit.revival.gold) / templeDivisor(settings.templeLevel),
    dragonCoins: unit.pool === 'dominance' ? chunks(count) * (unit.training?.dragonCoins ?? 0) : 0,
    seconds: 0,
  };
}

export interface RecoveryBreakdown {
  retrain: RecoveryCost;
  revive: RecoveryCost;
  selective: RecoveryCost;
  /** The plan the user picked in `settings.plan`. */
  plan: RecoveryCost;
  /** Unit ids revived under the selective plan (top-N by tier); everything else is retrained. */
  selectiveRevived: string[];
  byPool: Record<Pool, RecoveryCost>;
}

function round(cost: RecoveryCost): RecoveryCost {
  return {
    silver: Math.round(cost.silver),
    gold: Math.round(cost.gold),
    dragonCoins: Math.round(cost.dragonCoins),
    seconds: Math.round(cost.seconds),
  };
}

/**
 * Cost of every recovery mode for a finished battle (every stack is lost — that is what an epic-monster
 * march is for). `units` must contain a definition for every stack.
 */
export function recoveryCosts(
  stacks: Stack[],
  units: UnitDef[],
  settings: RecoverySettings,
): RecoveryBreakdown {
  const byId = new Map(units.map((unit) => [unit.id, unit]));
  const resolved = stacks
    .map((stack) => ({ stack, unit: byId.get(stack.unitId) }))
    .filter((entry): entry is { stack: Stack; unit: UnitDef } => entry.unit !== undefined);

  let retrain = empty();
  let revive = empty();
  const byPool: Record<Pool, RecoveryCost> = {
    leadership: empty(),
    authority: empty(),
    dominance: empty(),
  };
  for (const { stack, unit } of resolved) {
    const one = retrainOne(unit, stack.count, settings);
    retrain = add(retrain, one);
    revive = add(revive, reviveOne(unit, stack.count, settings));
    byPool[unit.pool] = add(byPool[unit.pool], one);
  }

  const top = Math.max(0, settings.plan.selectiveTop ?? 0);
  const revivedIds = [...resolved]
    .sort((a, b) => b.unit.tier - a.unit.tier || a.unit.id.localeCompare(b.unit.id))
    .slice(0, top)
    .map((entry) => entry.unit.id);
  const revivedSet = new Set(revivedIds);
  let selective = empty();
  for (const { stack, unit } of resolved) {
    selective = add(
      selective,
      revivedSet.has(unit.id)
        ? reviveOne(unit, stack.count, settings)
        : retrainOne(unit, stack.count, settings),
    );
  }

  const modes: Record<RecoveryMode, RecoveryCost> = { retrain, revive, selective };
  return {
    retrain: round(retrain),
    revive: round(revive),
    selective: round(selective),
    plan: round(modes[settings.plan.mode]),
    selectiveRevived: revivedIds,
    byPool: {
      leadership: round(byPool.leadership),
      authority: round(byPool.authority),
      dominance: round(byPool.dominance),
    },
  };
}
