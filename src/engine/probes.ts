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

export type ProbeFamily = 'health' | 'strength' | 'housing';

export interface Probe {
  /** Stable and unique: `health:<key>`, `strength:<key>`, `housing:<pool>`. Later phases add their own families. */
  id: string;
  family: ProbeFamily;
  label: string;
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
