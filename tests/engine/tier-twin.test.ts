/**
 * **No march on the bar is beaten by its own tier order** — the owner's permanent test (W13 §3,
 * `docs/plans/every-ordering.md`; 2026-09-23: *"no generated march is beaten by its own tier order"*).
 *
 * On every benchmark army (`plan-scenarios.ts`), planned as the app plans it (`CAMPAIGN.planFixes`, the
 * put-back at the app's rates) but with `budgetMs` **off**, so the deadline cannot make the result depend on
 * the machine: for every distinct march of every stop, `rate(march, twin, markerRates) ≤ 0.01`, the twin
 * being the march's own troop types in S-22's kill order over its own slots (`tier-twin.ts`). Twins the
 * engine's own rules make inadmissible (over the leadership, less damage, a silver saver's silver rising) are
 * counted, not asserted.
 *
 * Measured by experiment 169 (`tools/theorycraft/out/169-tier-order-as-a-candidate.md` §D) once the tier
 * candidate shipped: 139 marches, 22 pass, 0 fail, 117 inadmissible.
 */
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { CampaignPlan } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from './plan-scenarios';
import { emptyTally, twinTest } from './tier-twin';

const profile = ownerProfile();
const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
const total = emptyTally();

describe('the tier twin (W13 §3): no march on the bar beaten by its own tier order', () => {
  it.each(scenarios.map((s) => [s.label, s] as const))(
    '%s',
    (_label, scenario) => {
      let plan: CampaignPlan;
      try {
        plan = planCampaign({
          request: scenario.request,
          marchTarget: HORIZON,
          ...CAMPAIGN.planFixes,
          putBack: CAMPAIGN.putBack,
        });
      } catch {
        // An army the plan refuses has no bar to hold the test on (its refusal is pinned elsewhere).
        return;
      }
      const tally = twinTest(scenario.request, scenario.label, plan.alternatives, CAMPAIGN.markerRates);
      total.marches += tally.marches;
      total.pass += tally.pass;
      total.fail.push(...tally.fail);
      total.inadmissible.push(...tally.inadmissible);
      expect(tally.fail, 'marches their own tier order beats by more than 0.01').toEqual([]);
    },
    120_000,
  );

  it('counts the inadmissible twins over every army, and no march fails', () => {
    // eslint-disable-next-line no-console
    console.log(
      `tier twin: ${String(total.marches)} marches, ${String(total.pass)} pass, ${String(total.fail.length)} fail, ` +
        `${String(total.inadmissible.length)} inadmissible (counted, not asserted)`,
    );
    expect(total.fail).toEqual([]);
  });
});
