/**
 * **The hired saver** (W10, `docs/plans/the-stops-the-bar-offers.md`; experiments 144–146).
 *
 * The plan it came from exists because a comparison went out with a mandatory metric missing — damage a merc —
 * and it changed which option was free. So the regression test is written on **all seven readings** of that
 * plan's §1, on every benchmark army: the bar with the hired saver must read at least as well as the bar
 * without it, marker by marker. Adding a stop cannot lower the bar's best on anything *unless the engine
 * changes another stop while adding it*, which is the failure this catches.
 *
 * The rest holds the stop to its own definition: the fewest burned the band holds, the cheaper of two plans
 * at one burn, left of every other stop and under all of them on damage (S-61), more than one troop stack,
 * and never a second copy of a stop the bar already carries.
 */
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import type { CampaignPlan, PlanTotals } from '@/engine/plan';
import { planCampaign } from '@/engine/plan';
import type { StackRequest } from '@/engine/types';

import type { Campaign } from './plan-campaign';
import { campaignOf, marchesOf } from './plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from './plan-scenarios';

const profile = ownerProfile();
const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];

const planWith = (request: StackRequest, burnSaver: 'guard' | undefined): CampaignPlan | undefined => {
  try {
    return planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      burnSaver,
      putBack: CAMPAIGN.putBack,
      withFrontier: true,
    });
  } catch {
    return undefined;
  }
};

/** The seven readings of the plan's §1, as the bar's best over its stops; every one is "higher is better". */
const readings = (set: Campaign[]): Record<string, number> => ({
  damage: Math.max(...set.map((c) => c.damage)),
  'damage a silver': Math.max(...set.map((c) => (c.silver > 0 ? c.damage / c.silver : 0))),
  'damage a merc': Math.max(...set.map((c) => c.hiredDamage / Math.max(1, c.burned))),
  'damage a gold': Math.max(...set.map((c) => (c.gold > 0 ? c.damage / c.gold : 0))),
  'damage a coin': Math.max(...set.map((c) => (c.dragonCoins > 0 ? c.damage / c.dragonCoins : 0))),
  'least silver': -Math.min(...set.map((c) => c.silver)),
  'least burn': -Math.min(...set.map((c) => c.burned)),
});

describe('the hired saver', () => {
  test('ships on: the app’s plan fixes turn it on', () => {
    expect(CAMPAIGN.planFixes.burnSaver).toBe('guard');
  });

  for (const scenario of scenarios) {
    test(
      scenario.label,
      () => {
        const without = planWith(scenario.request, undefined);
        const withIt = planWith(scenario.request, 'guard');
        expect(withIt === undefined).toBe(without === undefined);
        if (!without || !withIt || without.alternatives.length === 0) return;

        // 5.6 — the seven readings, marker by marker.
        const priced = (plan: CampaignPlan): Campaign[] =>
          plan.alternatives.map((stop) =>
            campaignOf(scenario.request, stop.pick, 'plan', marchesOf(stop as PlanTotals)),
          );
        const before = readings(priced(without));
        const after = readings(priced(withIt));
        const worse = Object.keys(before).filter(
          (marker) => (after[marker] ?? 0) < (before[marker] ?? 0) - 1e-9,
        );
        expect(worse, `markers the hired saver made worse: ${worse.join(', ')}`).toEqual([]);

        // Every other stop is the one the bar offered without it.
        const others = withIt.alternatives.filter((row) => row.pick !== 'burn-saver');
        expect(others.map((row) => [row.pick, row.counts, row.totalDamage])).toEqual(
          without.alternatives.map((row) => [row.pick, row.counts, row.totalDamage]),
        );

        const saver = withIt.alternatives.find((row) => row.pick === 'burn-saver');
        if (!saver) return;
        // 5.3 — never a second copy of a stop.
        const keys = withIt.alternatives.map((row) => JSON.stringify(row.counts));
        expect(new Set(keys).size).toBe(keys.length);
        // Left of every other stop and under all of them on damage (S-61).
        expect(withIt.alternatives[0]).toBe(saver);
        for (const row of others) {
          if (row.pick === 'all-in') continue;
          expect(row.repeat.mercLost).toBeGreaterThan(saver.repeat.mercLost);
          expect(row.repeat.damage).toBeGreaterThan(saver.repeat.damage);
        }
        // 5.5 — more than one troop stack.
        const troops = Object.keys(saver.counts).filter(
          (id) => scenario.request.units.find((unit) => unit.id === id)?.pool === 'leadership',
        );
        expect(troops.length).toBeGreaterThan(1);
        // 5.1 and 5.2 — it came from the band's fewest-burn plan, the cheapest one at that burn.
        const band = (withIt.frontier ?? []).filter((row) => row.undominated && row.inBand);
        const source = band.find((row) => row.stop === 'burn-saver' || row.generatorOf === 'burn-saver');
        expect(source, 'the saver traces back to a band row').toBeDefined();
        if (!source) return;
        const fewest = Math.min(...band.map((row) => row.mercLost));
        expect(source.mercLost).toBe(fewest);
        const cheapest = Math.min(...band.filter((row) => row.mercLost === fewest).map((row) => row.silver));
        expect(source.silver).toBe(cheapest);
      },
      600_000,
    );
  }
});
