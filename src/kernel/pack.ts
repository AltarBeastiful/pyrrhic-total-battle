/**
 * **The game's per-battle knowledge of one request, packed for the kernel** (AssemblyScript roadmap, step 1).
 *
 * Built once per `StackRequest` with the engine's own functions — `effectiveTable` (HP, strength, the
 * strength-against, the kill rank; `plan.ts`), `enemySquadCount` (`battle.ts`), `templeDivisor` and
 * `unitFamily` (`recovery.ts`) — so the kernel never re-derives a bonus: heroes, captains, equipment, events
 * and every other source are already folded into `request.totals`, and reach the kernel only as the HP,
 * strength and strength-against of each row. Layout: `./layout.ts`.
 */
import { enemySquadCount } from '../engine/battle';
import { effectiveTable } from '../engine/plan';
import type { Effective } from '../engine/plan';
import type { MarkerRates } from '../engine/rating';
import { templeDivisor, unitFamily } from '../engine/recovery';
import type { Pool, RecoveryMode, StackRequest } from '../engine/types';
import { UNIT_FAMILIES } from '../engine/types';

import { H, HEADER_SIZE, T, TYPE_STRIDE } from './layout';

const POOL_INDEX: Record<Pool, number> = { leadership: 0, authority: 1, dominance: 2 };
const MODE_INDEX: Record<RecoveryMode, number> = { retrain: 0, revive: 1, selective: 2 };

export interface PackedRequest {
  /** Header + one row a type; `Float64Array` of `HEADER_SIZE + types × TYPE_STRIDE`. */
  table: Float64Array;
  /** Unit ids in row order (`request.units` order). */
  ids: string[];
}

/**
 * Pack `request` (and the owner's `rates`, for `rate`). Throws on a request the kernel cannot read the way
 * the engine does: two types with one id (`marchResult` would find the first, `marchOf` the last).
 */
export function packRequest(
  request: StackRequest,
  rates: MarkerRates,
  /** `effectiveTable(request)` already built (the plan's hot path binds the table it built). */
  table: readonly Effective[] = effectiveTable(request),
): PackedRequest {
  const ids = table.map((entry) => entry.id);
  if (new Set(ids).size !== ids.length) throw new Error('packRequest: two unit types share an id');
  const out = new Float64Array(HEADER_SIZE + table.length * TYPE_STRIDE);
  const settings = request.recovery;
  out[H.types] = table.length;
  out[H.enemySquads] = enemySquadCount(request.enemy);
  out[H.mode] = MODE_INDEX[settings.plan.mode];
  out[H.housingLeadership] = request.housing.leadership;
  out[H.housingAuthority] = request.housing.authority;
  out[H.housingDominance] = request.housing.dominance;
  out[H.templeDivisor] = templeDivisor(settings.templeLevel);
  out[H.rateSilver] = rates.silver;
  out[H.rateGold] = rates.gold;
  out[H.rateHired] = rates.hired;
  out[H.rateDragonCoins] = rates.dragonCoins;
  out[H.rateSeconds] = rates.seconds;
  const revived = new Set(settings.plan.reviveFamilies ?? UNIT_FAMILIES);
  table.forEach((entry, index) => {
    const row = HEADER_SIZE + index * TYPE_STRIDE;
    const unit = entry.unit;
    const group = unit.group;
    // `percent(map, group)` of `recovery.ts`, then the same two expressions `retrainOne`/`reviveOne` build.
    const reductionPct = group === undefined ? 0 : (settings.trainingCostReduction[group] ?? 0);
    const speedPct = group === undefined ? 0 : (settings.trainingSpeed[group] ?? 0);
    const family = unitFamily(unit);
    out[row + T.hp] = entry.hp;
    out[row + T.str] = entry.str;
    out[row + T.baseStrength] = unit.strength;
    // `hitDamage`: `100 + effective.strengthPercent + effective.strengthAgainst`, left to right.
    out[row + T.bracket] = 100 + entry.strengthPercent + entry.sa;
    out[row + T.cost] = entry.cost;
    out[row + T.pool] = POOL_INDEX[entry.pool];
    out[row + T.rank] = entry.rank;
    out[row + T.hasTraining] = unit.training ? 1 : 0;
    out[row + T.trainingSilver] = unit.training?.silver ?? 0;
    out[row + T.trainingSeconds] = unit.training?.seconds ?? 0;
    out[row + T.trainingDragonCoins] = unit.training?.dragonCoins ?? 0;
    out[row + T.reduction] = 1 - reductionPct / 100;
    out[row + T.speed] = 1 + speedPct / 100;
    out[row + T.revivalGold] = unit.revival.gold;
    out[row + T.family] = UNIT_FAMILIES.indexOf(family);
    out[row + T.tier] = unit.tier;
    out[row + T.familyRevived] = revived.has(family) ? 1 : 0;
  });
  return { table: out, ids };
}

/** A counts record keyed by id, as the row-order vector the kernel reads. */
export function countsVector(ids: readonly string[], counts: Record<string, number>): Float64Array {
  return Float64Array.from(ids, (id) => counts[id] ?? 0);
}
