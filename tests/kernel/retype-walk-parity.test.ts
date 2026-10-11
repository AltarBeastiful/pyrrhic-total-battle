/**
 * **The re-typing's exhaustive walk on the kernel, `Object.is` to the TypeScript** (W18 P3.5; `enumerate`'s
 * guards in `kernel/assembly/index.ts`, `PlanKernel.retypeWalk` in `src/engine/fast.ts`, `retypeMarch` in
 * `src/engine/retype.ts`).
 *
 * On every benchmark army and both fixtures one plan is run with a kernel that records every walk it is asked.
 *  - **door level**: each recorded walk (all, or an even sample) is answered by the door and by a plain
 *    TypeScript walk written here (every assignment, `marchBill`, `rate`, the same ceilings): same `tried`,
 *    same best rating, same counts;
 *  - **plan level**: `planCampaign`'s answer is the same JSON with the door and with it declined (the TypeScript
 *    walk of `retypeMarch`), every other door the kernel's on both sides.
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
/** Every door the kernel's but the re-typing walk: the plan-level reference. */
const WITHOUT_DOOR: PlanKernel = { ...real, retypeWalk: () => null };
const initial = planKernel();
afterEach(() => setKernel(initial));

/** Recorded walks compared per plan at most (an even sample past it). */
const PER_PLAN = 400;

type Walk = Parameters<PlanKernel['retypeWalk']>;

/** One plan's walks, recorded through the real door. */
function recordWalks(input: CampaignInput): Walk[] {
  const calls: Walk[] = [];
  setKernel({
    ...real,
    retypeWalk: (...args) => {
      calls.push([args[0], args[1], args[2], args[3], { ...args[4] }, { ...args[5] }, { ...args[6] }]);
      return real.retypeWalk(...args);
    },
  });
  try {
    planCampaign(input);
  } catch {
    // An army with no feasible plan still asked its walks first.
  }
  setKernel(initial);
  return calls;
}

/** `retypeMarch`'s exhaustive walk, plainly: every injective assignment, in the walk's order. */
function referenceWalk([request, rates, troops, slots, hired, base, guard]: Walk) {
  let tried = 0;
  let rating = -Infinity;
  let counts: Record<string, number> | null = null;
  const used = new Set<number>();
  const types: number[] = [];
  const consider = (): void => {
    const next: Record<string, number> = { ...hired };
    let lead = 0;
    types.forEach((ti, slot) => {
      const t = troops[ti]!;
      const count = Math.ceil(slots[slot]! / t.hp);
      next[t.id] = count;
      lead += count * t.cost;
    });
    if (lead > request.housing.leadership) return;
    tried += 1;
    const bill = marchBill(request, next);
    if (bill.damage < base.damage - 1e-6) return;
    if (
      (guard.silverCeiling !== undefined && (bill.silver ?? 0) > guard.silverCeiling + 1e-6) ||
      (guard.holdDamagePerSilver === true &&
        bill.damage * (base.silver ?? 0) < base.damage * (bill.silver ?? 0) - 1e-6) ||
      (guard.secondsCeiling !== undefined && (bill.seconds ?? 0) > guard.secondsCeiling + 1e-6)
    )
      return;
    const score = rate(base, bill, rates);
    if (score > rating) {
      rating = score;
      counts = next;
    }
  };
  const walk = (): void => {
    if (types.length === slots.length) {
      consider();
      return;
    }
    for (let i = 0; i < troops.length; i += 1) {
      if (used.has(i)) continue;
      used.add(i);
      types.push(i);
      walk();
      types.pop();
      used.delete(i);
    }
  };
  walk();
  return { tried, rating, counts };
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

describe('the re-typing walk on the kernel (W18 P3.5)', () => {
  it.each(cases)(
    '$label: every walk answers as the TypeScript does',
    ({ input }) => {
      const calls = recordWalks(input);
      const step = Math.max(1, Math.ceil(calls.length / PER_PLAN));
      let compared = 0;
      for (let c = 0; c < calls.length; c += step) {
        const call = calls[c] as Walk;
        const door = real.retypeWalk(...call);
        expect(door, `walk ${String(c)} declined`).not.toBeNull();
        if (door === null) continue;
        const reference = referenceWalk(call);
        expect(door.tried, `walk ${String(c)} tried`).toBe(reference.tried);
        expect(Object.is(door.rating, reference.rating), `walk ${String(c)} rating`).toBe(true);
        expect(door.counts === null, `walk ${String(c)} found`).toBe(reference.counts === null);
        if (door.counts && reference.counts)
          expect(JSON.stringify(Object.entries(door.counts).sort())).toBe(
            JSON.stringify(Object.entries(reference.counts).sort()),
          );
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
