/**
 * **The tier twin** (W13 §3, `docs/plans/every-ordering.md`; the owner, 2026-09-23: *"no generated march is
 * beaten by its own tier order"*), shared by `tier-twin.test.ts` and the experiments that report it (169, 170).
 *
 * The twin is built the way the engine builds it (`retypeMarch`'s tier candidate): the march's own troop
 * types, in S-22's kill order (`buildKillOrder`), over the march's own troop slots — the first to die on the
 * biggest slot — each type at least its slot's HP, **not re-scaled**; the hired stacks as they are. A twin
 * the engine's own rules would refuse is **inadmissible** and counted, not asserted: over the leadership,
 * less damage than the march (the re-typing only takes a march above its own damage), or a silver saver's
 * silver rising.
 */
import { buildKillOrder } from '../../src/engine/killOrder';
import type { PlanRow, PlanTotals } from '../../src/engine/plan';
import { effectiveTable, marchResult } from '../../src/engine/plan';
import type { MarkerRates } from '../../src/engine/rating';
import { rate } from '../../src/engine/rating';
import { marchBill } from '../../src/engine/retype';
import type { StackRequest } from '../../src/engine/types';
import { marchesOf } from './plan-campaign';

/** `rate(march, twin)` above this fails: `rate` is relative, and a near-tie can flip sign (W13 §4). */
export const TWIN_TOL = 0.01;

const SHORT: Record<string, string> = {
  'burn-saver': 'HS',
  'silver-saver': 'SS',
  'sweet-spot': 'SW',
  'more-mercs': 'MM',
  'steady-max': 'MX',
  'all-in': 'AI',
};
const short = (pick: string): string => SHORT[pick] ?? pick;
const sgn = (v: number): string =>
  Math.abs(v) < 1e-9 ? '0' : `${v > 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}`;

const marchText = (request: StackRequest, counts: Record<string, number>): string => {
  const pools = new Map(request.units.map((u) => [u.id, u.pool]));
  return Object.entries(counts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => (pools.get(a[0]) === 'leadership' ? 0 : 1) - (pools.get(b[0]) === 'leadership' ? 0 : 1))
    .map(([id, c]) => `${id} ${String(c)}${pools.get(id) === 'leadership' ? '' : '*'}`)
    .join(', ');
};

/** §3's twin: the march's own troop types in kill order over its own slots, biggest first; not re-scaled. */
export const twinOf = (request: StackRequest, counts: Record<string, number>): Record<string, number> => {
  const table = new Map(effectiveTable(request).map((e) => [e.id, e]));
  const rank = new Map(buildKillOrder(request.units, request.options).map((id, i) => [id, i]));
  const { result } = marchResult(request, counts);
  const troops = result.stacks.filter((s) => s.pool === 'leadership' && s.count > 0);
  const slots = troops.map((s) => s.totalHp).sort((a, b) => b - a);
  const types = troops.map((s) => s.unitId).sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0));
  const next: Record<string, number> = {};
  for (const s of result.stacks) if (s.pool !== 'leadership') next[s.unitId] = s.count;
  types.forEach((id, i) => (next[id] = Math.ceil((slots[i] ?? 0) / (table.get(id)?.hp ?? 1))));
  return next;
};

const leadershipOf = (request: StackRequest, counts: Record<string, number>): number => {
  let used = 0;
  for (const e of effectiveTable(request)) if (e.pool === 'leadership') used += (counts[e.id] ?? 0) * e.cost;
  return used;
};

export interface TwinTally {
  marches: number;
  pass: number;
  fail: string[];
  inadmissible: string[];
}

export const emptyTally = (): TwinTally => ({ marches: 0, pass: 0, fail: [], inadmissible: [] });

/** Every distinct march of every stop on the bar against its twin. */
export const twinTest = (
  request: StackRequest,
  label: string,
  rows: PlanRow[],
  rates: MarkerRates,
): TwinTally => {
  const tally = emptyTally();
  const seen = new Set<string>();
  for (const row of rows) {
    for (const march of marchesOf(row as PlanTotals)) {
      const key = `${row.pick}|${JSON.stringify(Object.entries(march).sort())}`;
      if (seen.has(key)) continue;
      seen.add(key);
      tally.marches += 1;
      const twin = twinOf(request, march);
      const a = marchBill(request, march);
      const b = marchBill(request, twin);
      const why =
        leadershipOf(request, twin) > request.housing.leadership
          ? 'over the leadership'
          : b.damage < a.damage - 1e-6
            ? `less damage (${sgn(((b.damage - a.damage) / a.damage) * 100)} %)`
            : row.pick === 'silver-saver' && (b.silver ?? 0) > (a.silver ?? 0) + 1e-6
              ? 'silver saver’s silver rises'
              : '';
      const r = rate(a, b, rates);
      if (why) {
        tally.inadmissible.push(`${label} ${short(row.pick)}: ${why}, rate ${sgn(r)}`);
        continue;
      }
      if (r <= TWIN_TOL) tally.pass += 1;
      else tally.fail.push(`${label} ${short(row.pick)} ${sgn(r)} (${marchText(request, march)})`);
    }
  }
  return tally;
};
