/**
 * **The plan with the kernel is the plan without it** (AssemblyScript roadmap, step 2: the gate).
 *
 * Every benchmark army (`commonScenarios` + `ownerScenarios`, the 18 of `plan-benchmark.test.ts`) is planned
 * twice per variant — once with no kernel set (the TypeScript engine, the reference) and once with
 * `setKernel(createPlanKernel(module))` — with **no `budgetMs`**, so no deadline makes a march depend on the
 * machine's speed, and the two `CampaignPlan`s must be deep-equal, refusals included (same message).
 *
 * The one field stripped before comparing is wall-clock: `retype.ms` (how long the re-typing pass took), on
 * the plan and on every stop that carries it. Nothing else is left out.
 *
 * Variants: the plan the benchmark runs (`CAMPAIGN.planFixes` + `CAMPAIGN.putBack`, horizon `HORIZON`), the bare
 * engine (no fixes, no put-back), a one-march horizon, and the benchmark's plan under a selective recovery
 * plan (the bill the kernel prices by family and tier).
 */
/// <reference types="node" />
import { afterEach, describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { setKernel } from '@/engine/fast';
import type { CampaignInput, CampaignPlan } from '@/engine/plan';
import { planCampaign } from '@/engine/plan';
import type { StackRequest } from '@/engine/types';
import { createPlanKernel } from '@/kernel/plan';

import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from '../engine/plan-scenarios';

import { loadKernelModule } from './load';

afterEach(() => setKernel(null));

/** Remove the wall-clock fields (`retype.ms`) wherever they sit. */
function stripClock(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripClock);
  if (value === null || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value)) {
    if (key === 'retype' && inner !== null && typeof inner === 'object') {
      const { ms: _ms, ...rest } = inner as Record<string, unknown>;
      out[key] = stripClock(rest);
    } else out[key] = stripClock(inner);
  }
  return out;
}

function plan(input: CampaignInput): { plan?: unknown; refused?: string } {
  try {
    return { plan: stripClock(planCampaign(input) satisfies CampaignPlan) };
  } catch (error) {
    return { refused: error instanceof Error ? error.message : String(error) };
  }
}

const variants: { label: string; input: (request: StackRequest) => CampaignInput }[] = [
  {
    label: 'the benchmark’s plan',
    input: (request) => ({ request, marchTarget: HORIZON, ...CAMPAIGN.planFixes, putBack: CAMPAIGN.putBack }),
  },
  { label: 'the bare engine', input: (request) => ({ request, marchTarget: HORIZON }) },
  {
    label: 'one march',
    input: (request) => ({ request, marchTarget: 1, ...CAMPAIGN.planFixes, putBack: CAMPAIGN.putBack }),
  },
  {
    label: 'selective recovery',
    input: (request) => ({
      request: { ...request, recovery: { ...request.recovery, plan: { mode: 'selective' } } },
      marchTarget: HORIZON,
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
    }),
  },
];

const profile = ownerProfile();
const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
const kernel = createPlanKernel(loadKernelModule());

describe('planCampaign with the kernel', () => {
  it('runs over all 18 benchmark armies where the owner’s export is present', () => {
    if (profile) expect(scenarios.length).toBe(18);
  });

  describe.each(scenarios.map((s, i) => [i, s.label, s.request] as const))(
    'army %i: %s',
    (_index, _label, request) => {
      it.each(variants.map((v) => [v.label, v.input] as const))(
        '%s is deep-equal to the TypeScript plan',
        (_variant, input) => {
          setKernel(null);
          const reference = plan(input(request));
          setKernel(kernel);
          const fast = plan(input(request));
          setKernel(null);
          expect(fast).toStrictEqual(reference);
        },
        600_000,
      );
    },
  );
});
