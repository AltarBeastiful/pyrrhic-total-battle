/**
 * **The advisor's probes** (W17 C1, `docs/plans/progression-advisor.md`): each one is a pure function
 * `StackRequest → StackRequest` that asks "what if this line of the account were a little higher".
 *
 * A probe **never mutates**. The kernel recognises tables by identity (`sameArmy` compares `totals ===`,
 * `marchBill` keys on the request object), so an edit in place would read stale tables; every level that
 * changes is rebuilt and every level that does not is shared with the input.
 */
import { BONUS_KEYS, type BonusKey } from '../data/types';
import type { Housing, StackRequest } from './types';

/** Default rise of a bonus line, in percentage points as entered. */
export const PROBE_BONUS_DELTA = 1;
/** Default rise of a housing pool, as a percent of the current pool. */
export const PROBE_HOUSING_PERCENT = 1;

export type ProbeFamily = 'health' | 'strength' | 'housing' | 'user';

/** What a typed upgrade costs in the game, in the player's own unit ("talent points", "gold", "days"). */
export interface ProbeCost {
  amount: number;
  unit: string;
}

export interface Probe {
  /**
   * Stable and unique: `health:<key>`, `strength:<key>`, `housing:<pool>`, `user:<upgrade id>`. Later phases add
   * their own families.
   */
  id: string;
  family: ProbeFamily;
  label: string;
  /** Only a typed upgrade with a cost has one: the ranking then reads its gain per cost (`rankAdvice`). */
  cost?: ProbeCost;
  apply(req: StackRequest): StackRequest;
}

const HOUSING_KEYS = ['leadership', 'authority', 'dominance'] as const satisfies readonly (keyof Housing)[];

/** `+delta` points on `totals.health[key]` or `totals.strength[key]`, new objects all the way down. */
export function bonusProbe(
  family: 'health' | 'strength',
  key: BonusKey,
  delta: number = PROBE_BONUS_DELTA,
): Probe {
  return {
    id: `${family}:${key}`,
    family,
    label: `${family === 'health' ? 'Health' : 'Strength'} +${delta} % ${key}`,
    apply: (req) => ({
      ...req,
      totals: {
        ...req.totals,
        [family]: { ...req.totals[family], [key]: req.totals[family][key] + delta },
      },
    }),
  };
}

/** `+percent` % of the current pool (at least one slot, housing is whole). */
export function housingProbe(pool: keyof Housing, percent: number = PROBE_HOUSING_PERCENT): Probe {
  return {
    id: `housing:${pool}`,
    family: 'housing',
    label: `${pool[0]!.toUpperCase()}${pool.slice(1)} +${percent} %`,
    apply: (req) => ({
      ...req,
      housing: {
        ...req.housing,
        [pool]: req.housing[pool] + Math.max(1, Math.round((req.housing[pool] * percent) / 100)),
      },
    }),
  };
}

/** The 29 v1 probes: 13 health, 13 strength, 3 housing — in that order, which is the order jobs run in. */
export function genericProbes(): Probe[] {
  return [
    ...BONUS_KEYS.map((key) => bonusProbe('health', key)),
    ...BONUS_KEYS.map((key) => bonusProbe('strength', key)),
    ...HOUSING_KEYS.map((pool) => housingProbe(pool)),
  ];
}

/**
 * What one typed upgrade changes (W17 C2): points on bonus lines, as entered, and housing **slots** (not a
 * percent). Structurally the stored `UserUpgrade` of `src/state/schema.ts`, whose schema refuses an entry that
 * changes nothing; the engine does not import the state layer.
 */
export interface UserUpgradeEntry {
  id: string;
  label: string;
  deltas: {
    health?: Partial<Record<BonusKey, number>> | undefined;
    strength?: Partial<Record<BonusKey, number>> | undefined;
    housing?: { [pool in keyof Housing]?: number | undefined } | undefined;
  };
  cost?: ProbeCost | undefined;
}

function addBonuses(
  line: Record<BonusKey, number>,
  deltas: Partial<Record<BonusKey, number>> | undefined,
): Record<BonusKey, number> {
  if (deltas === undefined || Object.keys(deltas).length === 0) return line;
  const out = { ...line };
  for (const [key, delta] of Object.entries(deltas) as [BonusKey, number][]) out[key] += delta;
  return out;
}

/**
 * One probe per typed upgrade: every delta of the entry at once, on top of the request, a pool never below 0
 * slots. Levels the entry does not touch are shared with the input, as for the generic probes.
 */
export function userProbe(entry: UserUpgradeEntry): Probe {
  const { health, strength, housing } = entry.deltas;
  const touchesTotals = [health, strength].some((map) => map !== undefined && Object.keys(map).length > 0);
  const touchesHousing = housing !== undefined && Object.keys(housing).length > 0;
  return {
    id: `user:${entry.id}`,
    family: 'user',
    label: entry.label,
    ...(entry.cost === undefined ? {} : { cost: { amount: entry.cost.amount, unit: entry.cost.unit } }),
    apply: (req) => {
      let out: StackRequest = { ...req };
      if (touchesTotals) {
        out = {
          ...out,
          totals: {
            ...req.totals,
            health: addBonuses(req.totals.health, health),
            strength: addBonuses(req.totals.strength, strength),
          },
        };
      }
      if (touchesHousing) {
        const pools = { ...req.housing };
        for (const pool of HOUSING_KEYS) {
          const slots = housing[pool];
          if (slots !== undefined) pools[pool] = Math.max(0, pools[pool] + slots);
        }
        out = { ...out, housing: pools };
      }
      return out;
    },
  };
}
