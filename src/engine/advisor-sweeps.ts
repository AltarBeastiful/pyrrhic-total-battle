/**
 * **The advisor's other questions** (W17 step D, `docs/plans/advisor-step-d.md`): a dominance sweep, the next
 * troop tier, more merc stock, the horizon and the value of silver. Each is a pure edit of the campaign's input
 * — a `CampaignProbe`, the campaign-level sibling of `Probe` — that rides the advisor's pass unchanged
 * (`runAdvisor`, `runProbe`, `readProbe`), so the reading, the Tight pricing and the flags are the generic
 * probes' own. A probe **never mutates**: every level that changes is rebuilt, every other is shared.
 */
import { CAMPAIGN } from '../config';
import type { UnitDef } from '../data/types';
import { headlineOf, type AdvisorRow, type ProbeInfo } from './advisor';
import type { CampaignInput } from './plan';
import { housingProbe, type ProbeFamily } from './probes';
import { CHUNK } from './recovery';
import type { Housing } from './types';

/** A probe on the whole campaign input (horizon, silver) as well as on its request. */
export interface CampaignProbe extends ProbeInfo {
  family: ProbeFamily;
  /** Merc units this probe adds to the stock, for "x more merc is y %"; absent for the others. */
  mercAdded?: number;
  applyInput(input: CampaignInput): CampaignInput;
}

/** True for a `CampaignProbe`, false for a request-level `Probe`. */
export function isCampaignProbe(probe: object): probe is CampaignProbe {
  return 'applyInput' in probe;
}

const SWEEP = CAMPAIGN.advisorSweep;

// ---- 1. dominance / leadership sweep ---------------------------------------------------------------

/** One step per rise of `pool`, in percent of the current pool, with the rounding of `housingProbe`. */
export function housingSweep(
  pool: keyof Housing,
  steps: readonly number[] = SWEEP.dominanceSteps,
): CampaignProbe[] {
  return steps.map((percent) => {
    const step = housingProbe(pool, percent);
    return {
      id: `sweep:${pool}:${String(percent)}`,
      family: 'sweep',
      label: step.label,
      applyInput: (input) => ({ ...input, request: step.apply(input.request) }),
    };
  });
}

export interface CurvePoint {
  /** The rise, in percent of the pool. */
  percent: number;
  /** The headline gain, never below 0. */
  gain: number;
  /** Marginal gain per extra percent of the pool, on the running maximum since the previous step. */
  marginal: number;
}

export interface SweepCurve {
  points: CurvePoint[];
  /** The index of the first step whose marginal gain is under the threshold; `null` while the curve still climbs. */
  flatAt: number | null;
  /** The rise worth reaching: the step before `flatAt` (0 when the first step is already flat). */
  peakPercent: number | null;
  /** Gains do not fall from one step to the next; false is flagged on the card, not hidden (search noise). */
  monotone: boolean;
}

/**
 * The curve of a sweep and where it flattens. `steps` and `gains` are parallel and ascending in `percent`; the
 * peak is read on the running maximum, so noise that dips a step never ends the climb early.
 */
export function sweepCurve(
  steps: readonly number[],
  gains: readonly number[],
  flattenBelow: number = SWEEP.flattenBelow,
): SweepCurve {
  const points: CurvePoint[] = [];
  let best = 0;
  let before = 0;
  let monotone = true;
  let flatAt: number | null = null;
  steps.forEach((percent, index) => {
    const gain = Math.max(0, gains[index] ?? 0);
    if (index > 0 && gain < (gains[index - 1] ?? 0)) monotone = false;
    const running = Math.max(best, gain);
    const span = percent - before;
    const marginal = span > 0 ? (running - best) / span : 0;
    points.push({ percent, gain, marginal });
    if (flatAt === null && marginal < flattenBelow) flatAt = index;
    best = running;
    before = percent;
  });
  const peakPercent = flatAt === null ? null : flatAt === 0 ? 0 : (points[flatAt - 1]?.percent ?? 0);
  return { points, flatAt, peakPercent, monotone };
}

/** The curve of the sweep rows read on the headline stop. */
export function curveOfRows(rows: readonly AdvisorRow[], steps: readonly number[]): SweepCurve {
  const ordered = steps.map((percent, index) => {
    const row = rows.find((candidate) => candidate.id.endsWith(`:${String(percent)}`));
    return { percent, gain: row === undefined ? 0 : (headlineOf(row)?.damagePercent ?? 0), index };
  });
  return sweepCurve(
    ordered.map((step) => step.percent),
    ordered.map((step) => step.gain),
  );
}

// ---- 2. next troop tier ----------------------------------------------------------------------------

/** One row of troops the next tier opens: what it is called, the units it adds and what training them costs. */
export interface TierUnlock {
  label: string;
  units: readonly UnitDef[];
  cost?: { amount: number; unit: string };
}

/**
 * The troops one tier above what the request fields, per kind and group: `have` is the request's units, `all` the
 * data's. No unit is invented, a kind or group without a higher tier gives no unlock, and mercenaries are left alone.
 */
export function tierUnlocks(have: readonly UnitDef[], all: readonly UnitDef[]): TierUnlock[] {
  const keyOf = (unit: UnitDef): string => `${unit.kind}:${unit.group ?? ''}`;
  const keys = new Set(have.filter((unit) => unit.kind !== 'mercenary').map(keyOf));
  const out: TierUnlock[] = [];
  for (const key of keys) {
    const top = Math.max(...have.filter((unit) => keyOf(unit) === key).map((unit) => unit.tier));
    const units = all.filter((unit) => keyOf(unit) === key && unit.tier === top + 1);
    if (units.length > 0) out.push({ label: `${key.replace(':', ' ')} tier ${String(top + 1)}`, units });
  }
  return out;
}

/** Add the unlock's units to the request; a unit already in it is not added twice. */
export function nextTierProbes(unlocks: readonly TierUnlock[]): CampaignProbe[] {
  return unlocks
    .filter((unlock) => unlock.units.length > 0)
    .map((unlock) => ({
      id: `campaign:tier:${unlock.label}`,
      family: 'campaign',
      label: `Train ${unlock.label}`,
      ...(unlock.cost === undefined ? {} : { cost: unlock.cost }),
      applyInput: (input) => {
        const have = new Set(input.request.units.map((unit) => unit.id));
        const added = unlock.units.filter((unit) => !have.has(unit.id));
        return { ...input, request: { ...input.request, units: [...input.request.units, ...added] } };
      },
    }));
}

// ---- 3. more merc stock ----------------------------------------------------------------------------

/** Merc units a step adds to `caps`: percent of each cap, whole units, at least one training chunk. */
function raisedBy(cap: number, percent: number): number {
  return Math.max(CHUNK, Math.round((cap * percent) / 100));
}

/**
 * Every finite cap raised at once by each step. No cap, no probe: an absent key is unlimited and left alone, and
 * an account without a merc stock has no section.
 */
export function mercStockProbes(
  caps: Readonly<Record<string, number>>,
  steps: readonly number[] = SWEEP.mercSteps,
): CampaignProbe[] {
  const held = Object.entries(caps).filter(([, cap]) => cap > 0);
  if (held.length === 0) return [];
  return steps.map((percent) => {
    const raised: Record<string, number> = { ...caps };
    let added = 0;
    for (const [id, cap] of held) {
      const extra = raisedBy(cap, percent);
      raised[id] = cap + extra;
      added += extra;
    }
    return {
      id: `campaign:merc:${String(percent)}`,
      family: 'campaign',
      label: `Merc stock +${String(percent)} %`,
      mercAdded: added,
      applyInput: (input) => ({
        ...input,
        request: { ...input.request, caps: { ...input.request.caps, ...raised } },
      }),
    };
  });
}

// ---- 4. horizon ------------------------------------------------------------------------------------

/**
 * The campaign at each horizon but the baseline's, through `marchTarget` on the request's input. `baseline` is
 * `CAMPAIGN.marches` and only says which horizon the baseline plan already is; nothing edits the config.
 */
export function horizonProbes(
  baseline: number = CAMPAIGN.marches,
  horizons: readonly number[] = SWEEP.horizons,
): CampaignProbe[] {
  return horizons
    .filter((marches) => marches !== baseline)
    .map((marches) => ({
      id: `campaign:horizon:${String(marches)}`,
      family: 'campaign',
      label: `${String(marches)} marches`,
      applyInput: (input) => ({ ...input, marchTarget: marches }),
    }));
}

// ---- 5. marginal value of silver -------------------------------------------------------------------

/** The silver a probe moves: a tenth of the baseline's bill, at least `minDelta`. */
export function silverDelta(silverBill: number, minDelta = 1, share: number = SWEEP.silverShare): number {
  return Math.max(minDelta, Math.round(silverBill * share));
}

/**
 * Silver plus and minus a tenth of the baseline's bill (`silverBill`), at least `minDelta` (one training chunk's
 * worth). With no budget set the baseline spends what it can, so there is nothing to raise: only the minus side,
 * set to the bill less the delta.
 */
export function silverProbes(
  input: Pick<CampaignInput, 'silverBudget'>,
  silverBill: number,
  minDelta = 1,
  share: number = SWEEP.silverShare,
): CampaignProbe[] {
  const delta = silverDelta(silverBill, minDelta, share);
  const base = input.silverBudget ?? silverBill;
  const side = (sign: 1 | -1): CampaignProbe => ({
    id: `campaign:silver:${sign > 0 ? 'plus' : 'minus'}`,
    family: 'campaign',
    label: `Silver ${sign > 0 ? '+' : '−'}${String(delta)}`,
    applyInput: (campaign) => ({ ...campaign, silverBudget: Math.max(0, base + sign * delta) }),
  });
  return input.silverBudget === undefined ? [side(-1)] : [side(1), side(-1)];
}
