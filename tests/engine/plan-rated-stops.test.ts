/**
 * **The rated stops** (`CampaignInput.ratedStops`, `CAMPAIGN.planFixes.ratedStops`; owner, 2026-10-16;
 * `docs/plans/the-rated-stops.md`, experiment 241).
 *
 * On every benchmark army, the bar with the pass on against the same bar with it off:
 *  - a stop that moved rates above it by more than `minRating` (`rate`, on the repeated march, `markerRates`), keeps
 *    `damageFloor` of its damage, stays within one chunk of its burn, and **trains no longer** (the owner, 2026-10-16:
 *    *"I'm worried it will end up costing a lot of training time"*);
 *  - the bar loses none of its ten readings and no stop, but a thrifty stop whose march another stop now is;
 *  - the names hold (the silver saver the cheapest, the burn saver the fewest burned), the staircase keeps its order
 *    (each stop to the right burns more and hits harder, S-61), and no two stops are one march.
 *
 * Which armies move is a report (241 step 2), not pinned here.
 */
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import type { CampaignPlan, PlanRow, PlanTotals } from '@/engine/plan';
import { planCampaign } from '@/engine/plan';
import { rate } from '@/engine/rating';
import type { StackRequest } from '@/engine/types';

import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from './plan-scenarios';

const profile = ownerProfile();
const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
const rule = CAMPAIGN.planFixes.ratedStops;

const plan = (request: StackRequest, rated: boolean): CampaignPlan | undefined => {
  try {
    return planCampaign({
      request,
      marchTarget: HORIZON,
      ...CAMPAIGN.planFixes,
      ratedStops: rated ? rule : undefined,
      putBack: CAMPAIGN.putBack,
    });
  } catch {
    return undefined;
  }
};

const bill = (row: PlanTotals) => ({
  damage: row.repeat.damage,
  silver: row.repeat.silver,
  gold: row.repeat.gold,
  hired: row.repeat.mercLost,
  dragonCoins: row.repeat.dragonCoins ?? 0,
  seconds: row.repeat.seconds,
});
const counts = (row: PlanRow): string => JSON.stringify(row.counts);
const readings = (set: readonly PlanTotals[]): number[] => [
  Math.max(...set.map((r) => r.totalDamage)),
  -Math.min(...set.map((r) => r.silver)),
  -Math.min(...set.map((r) => r.mercLost)),
  -Math.min(...set.map((r) => r.gold)),
  -Math.min(...set.map((r) => r.dragonCoins)),
  -Math.min(...set.map((r) => r.seconds)),
  Math.max(...set.map((r) => (r.silver > 0 ? r.totalDamage / r.silver : 0))),
  Math.max(...set.map((r) => r.hiredDamage / Math.max(1, r.mercLost))),
  Math.max(...set.map((r) => (r.gold > 0 ? r.totalDamage / r.gold : 0))),
  Math.max(...set.map((r) => (r.dragonCoins > 0 ? r.totalDamage / r.dragonCoins : 0))),
];

describe('the rated stops', () => {
  test.each(scenarios.map((s) => [s.label, s] as const))(
    '%s',
    (_label, scenario) => {
      const off = plan(scenario.request, false);
      const on = plan(scenario.request, true);
      expect(off === undefined).toBe(on === undefined);
      if (!off || !on) return;
      const bar = on.alternatives;

      for (const was of off.alternatives) {
        const now = bar.find((row) => row.pick === was.pick);
        if (!now) {
          expect(
            was.pick === 'thrifty' && bar.some((row) => counts(row) === counts(was)),
            `${was.pick} is gone and its march is not on the bar`,
          ).toBe(true);
          continue;
        }
        if (counts(now) === counts(was) || was.pick === 'thrifty') continue;
        const tag = `${was.pick} moved`;
        expect(rate(bill(was), bill(now), CAMPAIGN.markerRates), `${tag}: rating`).toBeGreaterThan(
          rule.minRating,
        );
        expect(now.repeat.damage, `${tag}: damage floor`).toBeGreaterThanOrEqual(
          was.repeat.damage * rule.damageFloor,
        );
        expect(Math.abs(now.repeat.mercLost - was.repeat.mercLost), `${tag}: burn`).toBeLessThanOrEqual(1);
        expect(now.repeat.seconds, `${tag}: queue`).toBeLessThanOrEqual(was.repeat.seconds);
      }

      const before = readings(off.alternatives);
      readings(bar).forEach((value, at) =>
        expect(value, `reading ${String(at)}`).toBeGreaterThanOrEqual(
          (before[at] ?? 0) - Math.abs(before[at] ?? 0) * 1e-9,
        ),
      );

      const saver = bar.find((row) => row.pick === 'silver-saver');
      if (saver)
        expect(
          bar.every((row) => row.silver >= saver.silver),
          'the silver saver is the cheapest',
        ).toBe(true);
      const burn = bar.find((row) => row.pick === 'burn-saver');
      if (burn)
        expect(
          bar.every((row) => row.mercLost >= burn.mercLost),
          'the burn saver burns the fewest',
        ).toBe(true);

      const stair = bar
        .filter((row) => row.pick !== 'thrifty' && row.pick !== 'all-in')
        .sort((a, b) => a.repeat.mercLost - b.repeat.mercLost || a.repeat.damage - b.repeat.damage);
      stair.forEach((row, at) => {
        const left = stair[at - 1];
        if (!left) return;
        expect(row.repeat.mercLost, `${row.pick} burns more than ${left.pick}`).toBeGreaterThan(
          left.repeat.mercLost,
        );
        expect(row.repeat.damage, `${row.pick} hits harder than ${left.pick}`).toBeGreaterThan(
          left.repeat.damage,
        );
      });

      expect(new Set(bar.map(counts)).size, 'no two stops are one march').toBe(bar.length);
      // Two whole plans an army, the monster camps at seconds each.
    },
    60_000,
  );
});
