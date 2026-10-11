/**
 * **The re-typing's climb on the kernel, `Object.is` to the TypeScript** (W22 step 5; `retypeClimb` in
 * `kernel/assembly/index.ts`, `PlanKernel.retypeClimb` in `src/engine/fast.ts`, `retypeMarch` in
 * `src/engine/retype.ts`).
 *
 * On every benchmark army and both fixtures one plan is run with a kernel that records every climb it is asked.
 *  - **door level**: each recorded climb (all, or an even sample) is answered by the door and by a plain
 *    TypeScript climb written here (`consider` with its seen table, the same neighbours in the same order,
 *    `marchBill`, `rate`, the same ceilings): same `tried`, same improvement, same rating, seed and assignment;
 *  - **plan level**: `planCampaign`'s answer is the same JSON with the door and with it declined (the TypeScript
 *    climb of `retypeMarch`), every other door the kernel's on both sides.
 */
/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';

import { afterEach, describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planKernel, setKernel, type PlanKernel } from '@/engine/fast';
import type { CampaignInput } from '@/engine/plan';
import { planCampaign } from '@/engine/plan';
import { marchBill } from '@/engine/retype';
import { rate } from '@/engine/rating';
import { createPlanKernel } from '@/kernel/plan';
import { parseImport } from '@/share/exportImport';
import { buildPlanRequest } from '@/state/derive';
import type { Profile } from '@/state/schema';

import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../engine/plan-scenarios';

import { loadKernelModule } from './load';

const real = createPlanKernel(loadKernelModule());
/** Every door the kernel's but the re-typing climb: the plan-level reference. */
const WITHOUT_DOOR: PlanKernel = { ...real, retypeClimb: () => null };
const initial = planKernel();
afterEach(() => setKernel(initial));

/** Recorded climbs compared per plan at most (an even sample past it). */
const PER_PLAN = 400;

type Climb = Parameters<PlanKernel['retypeClimb']>;

/** One plan's climbs, recorded through the real door. */
function recordClimbs(input: CampaignInput): Climb[] {
  const calls: Climb[] = [];
  setKernel({
    ...real,
    retypeClimb: (...args) => {
      calls.push([
        args[0],
        args[1],
        args[2],
        args[3],
        { ...args[4] },
        { ...args[5] },
        { ...args[6] },
        args[7].map((s) => ({ ...s, types: [...s.types] })),
        args[8] ? { ...args[8], types: [...args[8].types] } : null,
        args[9],
        args[10],
        args[11],
      ]);
      return real.retypeClimb(...args);
    },
  });
  try {
    planCampaign(input);
  } catch {
    // An army with no feasible plan still asked its climbs first.
  }
  setKernel(initial);
  return calls;
}

/** `retypeMarch`'s climb, plainly: `consider` with its seen table, the neighbours in the climb's order. */
function referenceClimb([
  request,
  rates,
  troops,
  slots,
  hired,
  base,
  guard,
  starts,
  known,
  useSeen,
  steps,
  bestIn,
]: Climb) {
  const k = slots.length;
  const m = troops.length;
  const seen = new Map<string, number>();
  let tried = 0;
  let rating = bestIn;
  let improved = false;
  let seed = 0;
  let types: number[] = [];
  let from = 0;
  const consider = (assign: readonly number[]): number => {
    const key = useSeen ? assign.join(',') : '';
    if (useSeen) {
      const hit = seen.get(key);
      if (hit !== undefined) return hit;
    }
    const next: Record<string, number> = { ...hired };
    let lead = 0;
    assign.forEach((ti, slot) => {
      const t = troops[ti]!;
      const count = Math.ceil(slots[slot]! / t.hp);
      next[t.id] = count;
      lead += count * t.cost;
    });
    if (lead > request.housing.leadership) {
      if (useSeen) seen.set(key, -Infinity);
      return -Infinity;
    }
    tried += 1;
    const bill = marchBill(request, next);
    const over =
      (guard.silverCeiling !== undefined && (bill.silver ?? 0) > guard.silverCeiling + 1e-6) ||
      (guard.holdDamagePerSilver === true &&
        bill.damage * (base.silver ?? 0) < base.damage * (bill.silver ?? 0) - 1e-6) ||
      (guard.secondsCeiling !== undefined && (bill.seconds ?? 0) > guard.secondsCeiling + 1e-6);
    const score = bill.damage < base.damage - 1e-6 || over ? -Infinity : rate(base, bill, rates);
    if (useSeen) seen.set(key, score);
    if (score > 1e-9 && score > rating) {
      rating = score;
      improved = true;
      seed = from;
      types = [...assign];
    }
    return score;
  };
  if (known) seen.set(known.types.join(','), known.score);
  for (const start of starts) {
    from = start.seed;
    let current = [...start.types];
    let currentScore = start.score ?? consider(current);
    for (let step = 0; step < steps; step += 1) {
      let moved: { types: number[]; score: number } | null = null;
      const neighbours: number[][] = [];
      for (let a = 0; a < k; a += 1) {
        for (let b = a + 1; b < k; b += 1) {
          const next = [...current];
          [next[a], next[b]] = [next[b]!, next[a]!];
          neighbours.push(next);
        }
        for (let t = 0; t < m; t += 1) {
          if (current.includes(t)) continue;
          const next = [...current];
          next[a] = t;
          neighbours.push(next);
        }
      }
      for (const next of neighbours) {
        const s = consider(next);
        if (s > currentScore + 1e-6 && (!moved || s > moved.score)) moved = { types: next, score: s };
      }
      if (!moved) break;
      current = moved.types;
      currentScore = moved.score;
    }
  }
  return { tried, improved, rating, seed, types };
}

/** The plan as JSON, its clock readings (`retype.ms`) left out: everything else must be the same. */
const answerOf = (input: CampaignInput): string => {
  try {
    const plan = planCampaign(input);
    return JSON.stringify(plan, (key, value: unknown) => (key === 'ms' ? undefined : value));
  } catch (error) {
    return `throws ${(error as Error).message}`;
  }
};

function probeSettings(profile: Profile): CampaignInput {
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
  if (setup === undefined) throw new Error('no active setup');
  const settings = { ...buildPlanRequest(profile, setup) };
  delete settings.budgetMs;
  delete settings.shouldStop;
  return settings;
}

const ACCOUNT = 'pyrrhic-my-account-2026-10-07.json';
function accountProfile(): Profile | null {
  if (!existsSync(ACCOUNT)) return null;
  const parsed = parseImport(readFileSync(ACCOUNT, 'utf8'));
  return parsed.kind === 'profile' ? parsed.payload : null;
}

const owner = ownerProfile();
const account = accountProfile();
const cases: { label: string; input: CampaignInput }[] = [
  ...[...commonScenarios(), ...(owner ? ownerScenarios(owner) : [])].map((scenario) => ({
    label: scenario.label,
    input: {
      request: scenario.request,
      marchTarget: HORIZON,
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
    },
  })),
  ...(owner ? [{ label: 'exactness fixture (2026-09-17)', input: probeSettings(owner) }] : []),
  ...(account ? [{ label: 'timing fixture (2026-10-07)', input: probeSettings(account) }] : []),
];

describe('the re-typing climb on the kernel (W22 step 5)', () => {
  it.each(cases)(
    '$label: every climb answers as the TypeScript does',
    ({ input }) => {
      const calls = recordClimbs(input);
      const step = Math.max(1, Math.ceil(calls.length / PER_PLAN));
      let compared = 0;
      for (let c = 0; c < calls.length; c += step) {
        // As asked, and under a step cap of 1 and 2: the planner's cap is rarely reached, these always are.
        for (const cap of [undefined, 1, 2]) {
          const call = (cap === undefined ? calls[c] : [...(calls[c] as Climb)]) as Climb;
          if (cap !== undefined) call[10] = cap;
          const label = `climb ${String(c)} (steps ${String(call[10])})`;
          const door = real.retypeClimb(...call);
          expect(door, `${label} declined`).not.toBeNull();
          if (door === null) continue;
          const reference = referenceClimb(call);
          expect(door.tried, `${label} tried`).toBe(reference.tried);
          expect(door.improved, `${label} improved`).toBe(reference.improved);
          expect(Object.is(door.rating, reference.rating), `${label} rating`).toBe(true);
          if (reference.improved) {
            expect(door.seed, `${label} seed`).toBe(reference.seed);
            expect(door.types, `${label} assignment`).toEqual(reference.types);
          }
        }
        compared += 1;
      }
      expect(compared === 0 || compared >= Math.min(calls.length, PER_PLAN) / 2).toBe(true);
    },
    600_000,
  );

  it.each(cases)(
    '$label: the plan is the same with the door and without it',
    ({ input }) => {
      setKernel(WITHOUT_DOOR);
      const reference = answerOf(input);
      setKernel(real);
      const door = answerOf(input);
      expect(door).toBe(reference);
    },
    600_000,
  );
});
