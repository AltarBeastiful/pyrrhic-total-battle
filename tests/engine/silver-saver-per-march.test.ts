/**
 * **A silver saver's march is not beaten by a re-typing whose silver does not rise** (W14 step 2,
 * `docs/plans/every-death-order.md` §3.2; experiment 176, suspect a).
 *
 * The rule "a silver saver stays one" used to be held on the whole row: when any march of a silver saver's
 * re-typed row raised silver, the whole row was handed back, including the marches whose re-typing cost no
 * silver (176: 13 marches, +60.34, of which +55.02 under "silver must not rise"). The rule is now held on
 * each march: a silver saver's march is re-typed under **its silver must not rise and its damage per silver
 * must not drop** (`retypeMarch`'s `silverCeiling` and `holdDamagePerSilver`; the owner, 2026-09-25), and under
 * **its queue must not rise** too where the bar's shortest queue would otherwise be lost (`secondsCeiling`;
 * experiment 177).
 *
 * The property, on every benchmark army (`plan-scenarios.ts`), planned as the app plans it (`CAMPAIGN.planFixes`,
 * the put-back at the owner's rates) with `budgetMs` **off**: for every march the silver saver plays (repeat,
 * finale, tail), the engine's re-typing search held to that march's own silver, damage per silver and queue
 * seconds finds nothing rating above it by more than 0.01 (175/176's tolerance). The silver saver's own-ladder
 * finale, made after the re-typing pass (read off `planTrace`), is step 3's (§3.3) and is counted, not asserted.
 */
import { describe, expect, it } from 'vitest';

import { CAMPAIGN } from '../../src/config';
import type { CampaignPlan, PlanTotals } from '../../src/engine/plan';
import { planCampaign } from '../../src/engine/plan';
import { planTrace } from '../../src/engine/plan-trace';
import { marchBill, retypeMarch } from '../../src/engine/retype';
import type { StackRequest } from '../../src/engine/types';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from './plan-scenarios';

const TOL = 0.01;
const profile = ownerProfile();
const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];

const played = (row: PlanTotals): { role: string; counts: Record<string, number> }[] => {
  if (row.sequence) return row.sequence.map((counts, i) => ({ role: `sequence ${String(i + 1)}`, counts }));
  const tail = row.tail?.marches ?? 0;
  const repeats = row.marches - (row.finaleCounts ? 1 : 0) - tail;
  const out: { role: string; counts: Record<string, number> }[] = [];
  if (repeats > 0) out.push({ role: 'repeat', counts: row.counts });
  if (row.finaleCounts) out.push({ role: 'finale', counts: row.finaleCounts });
  if (row.tail && tail > 0) out.push({ role: 'tail', counts: row.tail.counts });
  return out;
};

const failures: string[] = [];
const afterPass: string[] = [];
let checked = 0;
const keyOf = (counts: Record<string, number>): string =>
  JSON.stringify(
    Object.entries(counts)
      .filter(([, c]) => c > 0)
      .sort(),
  );

const check = (
  label: string,
  request: StackRequest,
  plan: CampaignPlan,
  ownLadder: Set<string>,
): string[] => {
  const fail: string[] = [];
  for (const row of plan.alternatives) {
    if (row.pick !== 'silver-saver') continue;
    for (const { role, counts } of played(row as PlanTotals)) {
      if (ownLadder.has(keyOf(counts))) {
        afterPass.push(`${label} SS ${role}`);
        continue;
      }
      checked += 1;
      const own = marchBill(request, counts);
      const found = retypeMarch(request, counts, CAMPAIGN.markerRates, {
        tierCandidate: CAMPAIGN.planFixes.tierCandidate,
        silverCeiling: own.silver,
        holdDamagePerSilver: true,
        secondsCeiling: own.seconds,
      });
      if (!found || !(found.rating > TOL)) continue;
      const bill = marchBill(request, found.counts);
      const broken = [
        ...((bill.silver ?? 0 <= (own.silver ?? 0) + 1e-6)
          ? []
          : [`raised silver ${String(own.silver)} → ${String(bill.silver)}`]),
        ...(bill.damage * (own.silver ?? 0) >= own.damage * (own.silver ?? 0) - 1e-6
          ? []
          : [
              `dropped damage per silver ${(own.damage / (own.silver ?? 0)).toFixed(4)} → ${(bill.damage / (own.silver ?? 0)).toFixed(4)}`,
            ]),
        ...((bill.seconds ?? 0 <= (own.seconds ?? 0) + 1e-6)
          ? []
          : [`raised queue ${String(own.seconds)} → ${String(bill.seconds)} s`]),
      ];
      fail.push(
        `${label} SS ${role}: +${found.rating.toFixed(3)}` +
          (broken.length === 0
            ? ' with its silver, damage per silver and queue held'
            : ` but the search ${broken.join(' and ')}`),
      );
    }
  }
  return fail;
};

describe('W14 step 2: a silver saver’s march is not beaten by a re-typing that holds its silver', () => {
  it.each(scenarios.map((s) => [s.label, s] as const))(
    '%s',
    (label, scenario) => {
      const ownLadder = new Set<string>();
      planTrace.sink = (e) => {
        if (e.step === 'ownLadderFinale') ownLadder.add(keyOf(e.counts));
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
      expect(
        fail,
        'silver-saver marches a re-typing holding silver, damage per silver and queue beats by more than 0.01',
      ).toEqual([]);
    },
    120_000,
  );

  it('over every army, no silver saver’s march fails', () => {
    // eslint-disable-next-line no-console
    console.log(
      `silver saver per march: ${String(checked)} marches checked, ${String(failures.length)} fail; ` +
        `${String(afterPass.length)} own-ladder finales, made after the pass (step 3, counted): ${afterPass.join('; ')}`,
    );
    expect(failures).toEqual([]);
  });
});
