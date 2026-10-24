/**
 * Owner, 2026-10-24: the plan prices a monster the way the setup recovers it. Retrained, it pays its full
 * training silver per unit; revived, it pays only the tenth it cannot revive in silver (the Temple's gold is printed, not ranked).
 * The search's yardstick (`kernel.march`) reads the bound request's own plan for a dominance monster.
 */
/// <reference types="node" />
import { describe, expect, it } from 'vitest';

import { effectiveTable } from '@/engine/plan';
import { chunks } from '@/engine/recovery';
import type { RecoverySettings, RecoveryPlan, StackRequest } from '@/engine/types';
import { createPlanKernel } from '@/kernel/plan';

import { commonScenarios } from '../engine/plan-scenarios';

import { loadKernelModule } from './load';

const SEARCH: RecoverySettings = { templeLevel: 0, trainingCostReduction: {}, trainingSpeed: {}, plan: { mode: 'retrain' } };
const camp = commonScenarios().find((s) => s.request.units.some((u) => u.pool === 'dominance'))!;

function priced(plan: RecoveryPlan, count: number) {
  const request: StackRequest = { ...camp.request, recovery: { ...camp.request.recovery, plan } };
  const table = effectiveTable(request);
  const kernel = createPlanKernel(loadKernelModule());
  kernel.bindTable(request, table);
  const entry = table.find((e) => e.pool === 'dominance')!;
  const got = kernel.march([{ entry, count }], 1, SEARCH)!;
  return { got, training: entry.unit.training! };
}

describe('the search prices a monster by the setup’s recovery plan', () => {
  it.each([18, 40, 7])('retrain: %i monsters pay silver per unit and no gold', (n) => {
    const { got, training } = priced({ mode: 'retrain' }, n);
    expect(got.silver).toBe(n * training.silver);
    expect(got.gold).toBe(0);
  });

  it.each([
    ['revive', { mode: 'revive' }],
    ['selective, monsters ticked', { mode: 'selective', reviveFamilies: ['monsters'] }],
  ] as const)('%s: 40 monsters pay the tenth in silver; the Temple’s gold is printed, not ranked', (_label, plan) => {
    const { got, training } = priced(plan, 40);
    expect(got.silver).toBe(chunks(40) * training.silver);
    expect(got.gold).toBe(0);
  });

  it('selective with monsters not ticked retrains them', () => {
    const { got, training } = priced({ mode: 'selective', reviveFamilies: ['guardsmen'] }, 40);
    expect(got.silver).toBe(40 * training.silver);
    expect(got.gold).toBe(0);
  });
});
