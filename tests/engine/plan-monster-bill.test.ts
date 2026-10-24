/**
 * Repro (2026-10-24): every plan-table stop and the Battle summary must bill a retrained monster's silver and
 * dragon coins. Each stop's repeat march is re-priced independently with `recoveryCosts` on its own counts and
 * compared with what the stop prints.
 */
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import { planCampaign } from '@/engine/plan';
import type { CampaignInput } from '@/engine/plan';
import { recoveryCosts } from '@/engine/recovery';
import type { Stack } from '@/engine/types';

import { HORIZON, commonScenarios } from './plan-scenarios';

const PLANS = [
  ['retrain everything', { mode: 'retrain' }],
  ['selective, monsters not ticked', { mode: 'selective', reviveFamilies: ['guardsmen'] }],
  ['selective, monsters ticked', { mode: 'selective', reviveFamilies: ['monsters'] }],
] as const;

describe.each(PLANS)('monster silver and dragon coins in the plan table — %s', (_label, recoveryPlan) => {
  const camp = commonScenarios().find((scenario) => scenario.label.includes('monster tiers 3–7 at 20 000'))!;
  const request = { ...camp.request, recovery: { ...camp.request.recovery, plan: recoveryPlan } };
  const input: CampaignInput = {
    request,
    marchTarget: HORIZON,
    budgetMs: CAMPAIGN.budgets.plan,
    ...CAMPAIGN.planFixes,
    putBack: CAMPAIGN.putBack,
  };
  const plan = planCampaign(input);
  const units = input.request.units;
  const bill = (counts: Record<string, number>) =>
    recoveryCosts(
      Object.entries(counts).filter(([, n]) => n > 0).map(([unitId, count]) => ({ unitId, count }) as Stack),
      units,
      input.request.recovery,
    ).plan;

  test('the account fields a monster on some stop', () => {
    const fielded = plan.alternatives.filter((row) =>
      Object.keys(row.counts).some((id) => units.find((u) => u.id === id)?.pool === 'dominance'),
    );
    expect(fielded.length).toBeGreaterThan(0);
  });

  // The owner's rule, written out independently of `recoveryCosts` and of the kernel: under a retrain plan every
  // unit of every trained stack pays its full training silver and dragon coins (2026-10-24).
  test.each(plan.alternatives.map((row, i) => [i, row.pick ?? row.shape, row] as const))(
    'stop %i (%s): under retrain, every fielded unit pays full silver and coins',
    (_i, _name, row) => {
      if (recoveryPlan.mode !== 'retrain') return;
      let silver = 0;
      let coins = 0;
      for (const [id, count] of Object.entries(row.counts)) {
        const u = units.find((candidate) => candidate.id === id)!;
        const t = u.training;
        if (!t) continue;
        const discount = (u.group === undefined ? 0 : input.request.recovery.trainingCostReduction[u.group] ?? 0) / 100;
        silver += count * t.silver * (1 - discount);
        coins += count * (t.dragonCoins ?? 0);
      }
      expect(row.repeat.silver).toBe(Math.round(silver));
      expect(row.repeat.dragonCoins ?? 0).toBe(coins);
    },
  );

  test.each(plan.alternatives.map((row, i) => [i, row.pick ?? row.shape, row] as const))(
    'stop %i (%s): repeat silver and coins equal recoveryCosts of its counts',
    (_i, _name, row) => {
      const expected = bill(row.counts);
      expect(row.repeat.silver).toBe(expected.silver);
      expect(row.repeat.dragonCoins ?? 0).toBe(expected.dragonCoins);
    },
  );
}, 600_000);
