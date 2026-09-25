/**
 * **An own-ladder finale is not beaten by an admissible re-typing** (W14 step 3, `docs/plans/every-death-order.md`
 * §3.3; experiment 176, cause e).
 *
 * The finale sized on the march's own ladder (`plan.ts`, trace step `ownLadderFinale`) is built after the re-typing
 * pass, and was never re-typed: 176 measured 5 marches, +28.65 (the message camp of 2026-09-19's steady max +12.19,
 * its burn saver and sweet spot +7.72, the evening account's silver saver +5.10, the 7 000 export's +3.62).
 *
 * The property, on every benchmark army (`plan-scenarios.ts`), planned as the app plans it (`CAMPAIGN.planFixes`, the
 * put-back at the owner's rates) with `budgetMs` **off**: for every stop that ships an own-ladder finale, the engine's
 * re-typing search (`retypeMarch`, the tier candidate on as shipped) finds no **admissible** assignment rating above
 * that finale by more than 0.01 (175/176's tolerance). Admissible is what the re-typing pass itself would keep: the
 * hired stacks to the unit (the search keeps them), the shelter held where the finale had it, and on a silver saver
 * step 2's holds — its silver not rising, its damage per silver not dropping and its queue not rising.
 */
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import { planMarch } from '../../src/engine';
import type { CampaignPlan } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import { planTrace } from '../../src/engine/plan-trace';
import { marchBill, retypeMarch } from '../../src/engine/retype';
import type { StackRequest } from '../../src/engine/types';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from './plan-scenarios';

const TOL = 0.01;
const profile = ownerProfile();
const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];

const keyOf = (counts: Record<string, number>): string =>
  JSON.stringify(
    Object.entries(counts)
      .filter(([, c]) => c > 0)
      .sort(),
  );

/** Every hired stack under the lowest troop stack (S-87), read off the battle as the plan's own check reads it. */
const sheltered = (request: StackRequest, counts: Record<string, number>): boolean => {
  const { result } = planMarch(request, counts);
  const troops = result.stacks.filter((stack) => stack.pool === 'leadership');
  if (troops.length === 0) return true;
  const floor = Math.min(...troops.map((stack) => stack.totalHp));
  return result.stacks.filter((stack) => stack.pool !== 'leadership').every((stack) => stack.totalHp < floor);
};

const failures: string[] = [];
let checked = 0;

const check = (
  label: string,
  request: StackRequest,
  plan: CampaignPlan,
  ownLadder: Map<string, string>,
): string[] => {
  const fail: string[] = [];
  for (const row of plan.alternatives) {
    if (!row.finaleCounts || row.sequence) continue;
    // A stop the own-ladder block gave a finale: that finale, or what a later re-typing made of it.
    if (!ownLadder.has(row.pick)) continue;
    checked += 1;
    const counts = row.finaleCounts;
    const own = marchBill(request, counts);
    const saver = row.pick === 'silver-saver';
    const found = retypeMarch(request, counts, CAMPAIGN.markerRates, {
      tierCandidate: CAMPAIGN.planFixes.tierCandidate,
      ...(saver ? { silverCeiling: own.silver, holdDamagePerSilver: true, secondsCeiling: own.seconds } : {}),
    });
    if (!found || !(found.rating > TOL)) continue;
    // The shelter, as the pass holds it: refused only where the finale had it and the re-typing breaks it.
    if (sheltered(request, counts) && !sheltered(request, found.counts)) continue;
    fail.push(`${label} ${row.pick} own-ladder finale: +${found.rating.toFixed(3)}`);
  }
  return fail;
};

describe('W14 step 3: an own-ladder finale is not beaten by an admissible re-typing', () => {
  it.each(scenarios.map((s) => [s.label, s] as const))(
    '%s',
    (label, scenario) => {
      /** The own-ladder finale each stop was last given, by pick. */
      const ownLadder = new Map<string, string>();
      planTrace.sink = (e) => {
        if (e.step === 'ownLadderFinale' && e.pick) ownLadder.set(e.pick, keyOf(e.counts));
      };
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
      } finally {
        planTrace.sink = null;
      }
      const fail = check(label.slice(0, 60), scenario.request, plan, ownLadder);
      failures.push(...fail);
      expect(fail, 'own-ladder finales an admissible re-typing beats by more than 0.01').toEqual([]);
    },
    120_000,
  );

  it('over every army, no own-ladder finale fails', () => {
    // eslint-disable-next-line no-console
    console.log(
      `own-ladder finale: ${String(checked)} finales checked, ${String(failures.length)} fail: ${failures.join('; ')}`,
    );
    expect(failures).toEqual([]);
  });
});
