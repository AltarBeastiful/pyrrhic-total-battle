/**
 * **The sizer shape on the kernel, `Object.is` to the TypeScript** (W18 P3.4 step 1; `sizerShape` in
 * `kernel/assembly/index.ts`, `PlanKernel.sizerShape` in `src/engine/fast.ts`, `sizedShape` in
 * `src/engine/plan.ts`).
 *
 * On every benchmark army (`commonScenarios` + `ownerScenarios`) and both fixtures (the owner's committed export
 * and, when present at the repo root, the account the owner profiled — read only, never copied), one plan is run
 * with a kernel that records every `sizedShape` call it is asked. Then:
 *
 *  - **door level**: each recorded call (all of them, or an even sample on the big plans) is answered by the
 *    kernel's door and by `sizedShapeDeclined` under the declining kernel (`./declining.ts`, the TypeScript
 *    sizer and all): the door must not decline, and the troop and hired stacks must be the same entries in the
 *    same order with `Object.is` counts;
 *  - **plan level**: `planCampaign`'s answer (every row's counts, figures and stops; the clock's `ms` aside) is the same
 *    JSON with the door and with the door declined (every other door the kernel's on both sides).
 */
/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs';

import { afterEach, describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planKernel, setKernel, type PlanKernel } from '@/engine/fast';
import type { CampaignInput, Effective, SizerMethod } from '@/engine/plan';
import { planCampaign, sizedShape } from '@/engine/plan';
import type { StackRequest } from '@/engine/types';
import { createPlanKernel } from '@/kernel/plan';
import { parseImport } from '@/share/exportImport';
import { buildPlanRequest } from '@/state/derive';
import type { Profile } from '@/state/schema';

import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../engine/plan-scenarios';

import { decliningKernel } from './declining';
import { loadKernelModule } from './load';

const real = createPlanKernel(loadKernelModule());
const DECLINING = decliningKernel(real);
/** Every door the kernel's but the sizer shape's: the plan-level reference. */
const WITHOUT_DOOR: PlanKernel = { ...real, sizerShape: () => null };
const initial = planKernel();
afterEach(() => setKernel(initial));

/** Recorded calls compared per plan at most (an even sample past it). */
const PER_PLAN = 1_500;

type Stacks = { entry: Effective; count: number }[];
interface Call {
  request: StackRequest;
  byId: Map<string, Effective>;
  mercs: Stacks;
  method: SizerMethod;
  troopIds: ReadonlySet<string> | undefined;
}

function sameStacks(a: Stacks, b: Stacks): string | null {
  if (a.length !== b.length) return `${String(a.length)} stacks against ${String(b.length)}`;
  for (let i = 0; i < a.length; i += 1) {
    const x = a[i] as Stacks[number];
    const y = b[i] as Stacks[number];
    if (x.entry !== y.entry) return `stack ${String(i)}: ${x.entry.id} against ${y.entry.id}`;
    if (!Object.is(x.count, y.count))
      return `stack ${String(i)} ${x.entry.id}: ${x.count} against ${y.count}`;
  }
  return null;
}

/** One plan's sizer calls, recorded through the real door. */
function recordCalls(input: CampaignInput): Call[] {
  const calls: Call[] = [];
  setKernel({
    ...real,
    sizerShape: (request, byId, mercs, method, troopIds) => {
      calls.push({
        request,
        byId: byId as Map<string, Effective>,
        mercs: mercs.map((merc) => ({ entry: merc.entry, count: merc.count })),
        method,
        troopIds,
      });
      return real.sizerShape(request, byId, mercs, method, troopIds);
    },
  });
  try {
    planCampaign(input);
  } catch {
    // An army with no feasible plan still asked its sizer first.
  }
  setKernel(initial);
  return calls;
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

describe('the sizer shape on the kernel (W18 P3.4)', () => {
  it.each(cases)(
    '$label: every sizer call answers as the TypeScript does',
    ({ input }) => {
      const calls = recordCalls(input);
      const step = Math.max(1, Math.ceil(calls.length / PER_PLAN));
      let compared = 0;
      for (let c = 0; c < calls.length; c += step) {
        const call = calls[c] as Call;
        setKernel(DECLINING);
        const reference = sizedShape(call.request, call.byId, call.mercs, call.method, call.troopIds);
        setKernel(initial);
        const door = real.sizerShape(call.request, call.byId, call.mercs, call.method, call.troopIds);
        expect(door, `call ${String(c)} declined`).not.toBeNull();
        if (door === null) continue;
        const where = sameStacks(door.rungs, reference.rungs) ?? sameStacks(door.mercs, reference.mercs);
        expect(
          where,
          `call ${String(c)} (${call.method}, ${call.troopIds?.size ?? 'all'} troop types)`,
        ).toBeNull();
        compared += 1;
      }
      expect(compared === 0 || compared >= Math.min(calls.length, PER_PLAN) / 2).toBe(true);
    },
    300_000,
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
    300_000,
  );
});
