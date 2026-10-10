/**
 * **The kill order's shadow check** (W18 P2.1, `killOrderCheck` in `kernel/assembly/index.ts`): before the raise
 * keeps its sorted roster from one scored vector to the next, every battle's kill order is held, bit for bit,
 * to a fresh `killOrderBy` of the same counts, and a difference traps (`unreachable`). The check is compiled
 * only into a profile kernel built with `KILL_CHECK` (here, to a temporary file); a kernel without it answers
 * no check count, and the test is skipped against it.
 *
 * The marches are experiment 184's (every stop of every benchmark army, all five positions) and the exactness
 * fixture's Tight pricing (the owner's export: the plan's stops on the elite request, as Generate prices the
 * bar). Each answer must also be the release kernel's, so the checked build moves nothing.
 *
 * About five minutes (both kernels over 184's corpus), so it runs on request only, not in `pnpm test`:
 * `KILL_CHECK=1 pnpm vitest run tests/kernel/kill-order.test.ts`
 */
/// <reference types="node" />
import { afterAll, describe, expect, it } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign, planMarch, withMethod } from '@/engine';
import { raiseKernel, setRaiseKernel } from '@/engine/fast';
import type { RaiseAnswer, RaiseInput, RaiseKernel } from '@/engine/fast';
import { sizeStacks } from '@/engine/stacker';
import type { StackRequest } from '@/engine/types';
import { createRaiseKernel } from '@/kernel/raise';
import { buildPlanRequest, buildStackRequest } from '@/state/derive';
import { POSITIONS, positionTrades, raiseCode } from '@/ui/sections/march/positions';
import { runPlan, runPositions } from '@/worker/jobs';

import { HORIZON, criteriaScenarios, ownerProfile } from '../engine/plan-scenarios';

import { loadKernelModule, loadProfileKernelModule } from './load';

const ON = process.env.KILL_CHECK === '1';
const release = createRaiseKernel(loadKernelModule());
const checked = ON ? createRaiseKernel(loadProfileKernelModule({ killCheck: true })) : release;
const previous = raiseKernel();
afterAll(() => {
  setRaiseKernel(previous);
});

/** Whether `kernel` runs the check at all: a release (or plain profile) kernel answers no check count. */
function checks(kernel: RaiseKernel): boolean {
  const [scenario] = criteriaScenarios();
  if (scenario === undefined) return false;
  const tight = { authority: raiseCode('tight'), dominance: raiseCode('tight') };
  const answer = kernel.position({
    request: scenario.request,
    base: sizeStacks(scenario.request),
    modes: tight,
  });
  return answer?.census?.killOrderChecks !== undefined;
}

/** The checked kernel, each answer held to the release kernel's, counting the kill orders it checked. */
function shadowed(): { kernel: RaiseKernel; checked: () => number } {
  let count = 0;
  const kernel: RaiseKernel = {
    ...checked,
    position(input: RaiseInput): RaiseAnswer | null {
      const answer = checked.position(input);
      const plain = release.position(input);
      if (answer === null) {
        expect(plain).toBeNull();
        return answer;
      }
      const { census, ...rest } = answer;
      expect(rest).toStrictEqual(plain);
      count += census?.killOrderChecks ?? 0;
      return answer;
    },
  };
  return { kernel, checked: () => count };
}

describe.skipIf(!ON || !checks(checked))('the kill order shadow check', () => {
  it('holds every battle of experiment 184’s marches to a fresh sort', () => {
    const shadow = shadowed();
    setRaiseKernel(shadow.kernel);
    for (const scenario of criteriaScenarios()) {
      const request: StackRequest = scenario.request;
      let plan;
      try {
        // Experiment 184's own call, so the stops are the bar its golden pins.
        plan = planCampaign({
          request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
      } catch (error) {
        if (error instanceof Error && error.message.startsWith('planCampaign:')) continue;
        throw error;
      }
      for (const stop of plan.alternatives) {
        positionTrades(request, planMarch(request, stop.counts).result, POSITIONS);
      }
    }
    expect(shadow.checked()).toBeGreaterThan(0);
  }, 600_000);

  it('holds every battle of the exactness fixture’s Tight pricing to a fresh sort', () => {
    const profile = ownerProfile();
    expect(profile).not.toBeNull();
    if (profile === null) return;
    const setup = profile.setups.find((one) => one.id === profile.activeSetupId);
    expect(setup).toBeDefined();
    if (setup === undefined) return;
    const shadow = shadowed();
    setRaiseKernel(shadow.kernel);
    // Generate's bar: the plan, then every stop's positions on the elite request (`runGenerate`, worker mode).
    const plan = runPlan(buildPlanRequest(profile, setup), {
      onProgress: () => undefined,
      cancelled: () => false,
    });
    const request = withMethod(buildStackRequest(profile, setup), 'elite');
    for (const stop of plan.alternatives) runPositions({ request, counts: stop.counts });
    expect(shadow.checked()).toBeGreaterThan(0);
  }, 600_000);
});
