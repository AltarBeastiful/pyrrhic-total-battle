/**
 * **The stops the bar offers: the hired saver and the fold** (W10, `docs/plans/the-stops-the-bar-offers.md`;
 * experiments 144–149).
 *
 * The plan it came from exists because a comparison went out with a mandatory metric missing — damage a merc —
 * and it changed which option was free. So the regression test is written on **all ten readings** the fold is
 * judged on (the owner, 2026-09-23: *"always show all criteria, especially gold and silver/dmg and training
 * time"*), on every benchmark army: the bar as shipped must read at least as well as the bar before W10 — no
 * hired saver, no fold — reading by reading.
 *
 * The rest holds the bar to the fold's own rules: at most five stops, ordered along the burn (S-61), the sweet
 * spot on it, one name a stop, and a name true of its row — the silver saver the bar's cheapest, the hired
 * saver its fewest burned — and every stop at least one troop stack (a single one is the troop wall).
 */
import { describe, expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import type { CampaignPlan, PlanRow, PlanTotals } from '@/engine/plan';
import { planCampaign } from '@/engine/plan';
import type { StackRequest } from '@/engine/types';

import type { Campaign } from './plan-campaign';
import { campaignOf, marchesOf } from './plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from './plan-scenarios';

const profile = ownerProfile();
const scenarios = [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];

const planWith = (request: StackRequest, shipped: boolean): CampaignPlan | undefined => {
  try {
    return planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      // The bar before W10: no hired saver and no fold. The troop wall stays as configured — it is a band rule,
      // not a W10 one, and its own trade is pinned apart below.
      ...(shipped ? {} : { burnSaver: undefined, foldTo: undefined }),
      putBack: CAMPAIGN.putBack,
    });
  } catch {
    return undefined;
  }
};

/** The ten readings, as the bar's best over its stops, every one turned "higher is better". */
const readings = (set: Campaign[]): Record<string, number> => ({
  'most damage': Math.max(...set.map((c) => c.damage)),
  'least silver': -Math.min(...set.map((c) => c.silver)),
  'fewest hired burned': -Math.min(...set.map((c) => c.burned)),
  'least gold': -Math.min(...set.map((c) => c.gold)),
  'fewest coins': -Math.min(...set.map((c) => c.dragonCoins)),
  'shortest queue': -Math.min(...set.map((c) => c.seconds)),
  'damage a silver': Math.max(...set.map((c) => (c.silver > 0 ? c.damage / c.silver : 0))),
  'damage a merc': Math.max(...set.map((c) => c.hiredDamage / Math.max(1, c.burned))),
  'damage a gold': Math.max(...set.map((c) => (c.gold > 0 ? c.damage / c.gold : 0))),
  'damage a coin': Math.max(...set.map((c) => (c.dragonCoins > 0 ? c.damage / c.dragonCoins : 0))),
});

describe('the stops the bar offers', () => {
  test('ship on: the hired saver offered everywhere, the fold to five, and the troop wall', () => {
    expect(CAMPAIGN.planFixes.burnSaver).toBe('silver');
    expect(CAMPAIGN.planFixes.foldTo).toBe(5);
    expect(CAMPAIGN.planFixes.bandTroopStacks).toBe(1);
  });

  for (const scenario of scenarios) {
    test(
      scenario.label,
      () => {
        const before = planWith(scenario.request, false);
        const after = planWith(scenario.request, true);
        expect(after === undefined).toBe(before === undefined);
        if (!before || !after || before.alternatives.length === 0) return;

        // The ten readings, reading by reading, against the bar before W10.
        const priced = (plan: CampaignPlan): Campaign[] =>
          plan.alternatives.map((stop) =>
            campaignOf(scenario.request, stop.pick, 'plan', marchesOf(stop as PlanTotals)),
          );
        const was = readings(priced(before));
        const now = readings(priced(after));
        const worse = Object.keys(was).filter((key) => (now[key] ?? 0) < (was[key] ?? 0) - 1e-9);
        expect(worse, `readings the bar lost: ${worse.join(', ')}`).toEqual([]);

        const rows = after.alternatives;
        // At most five, each name once, the sweet spot among them and the plan's recommendation.
        expect(rows.length).toBeLessThanOrEqual(5);
        expect(new Set(rows.map((row) => row.pick)).size).toBe(rows.length);
        const sweet = rows.find((row) => row.pick === 'sweet-spot');
        expect(sweet).toBeDefined();
        expect(after.recommend?.counts).toEqual(sweet?.counts);
        // No march twice.
        const keys = rows.map((row) => JSON.stringify(row.counts));
        expect(new Set(keys).size).toBe(keys.length);
        // Ordered along the burn: every rung burns more and hits harder than the one to its left (S-61).
        const rungs = rows.filter((row) => row.pick !== 'all-in');
        for (let index = 1; index < rungs.length; index += 1) {
          const previous = rungs[index - 1] as PlanRow;
          const current = rungs[index] as PlanRow;
          expect(current.repeat.mercLost).toBeGreaterThan(previous.repeat.mercLost);
          expect(current.repeat.damage).toBeGreaterThan(previous.repeat.damage);
        }
        // A saver's name is true of its row on this bar.
        const saver = rows.find((row) => row.pick === 'silver-saver');
        if (saver) {
          for (const row of rows) if (row !== saver) expect(row.silver).toBeGreaterThan(saver.silver);
        }
        const hired = rows.find((row) => row.pick === 'burn-saver');
        if (hired) {
          for (const row of rows) if (row !== hired) expect(row.mercLost).toBeGreaterThan(hired.mercLost);
        }
        // At least one troop stack on every stop: a single one is a wall (owner, 2026-09-23: "yes allow the troop
        // wall"), its hired stacks sheltered under it — which "every hired stack stands under the lowest troop
        // stack" in plan-criteria.test.ts holds on every army.
        for (const row of rows) {
          const troops = Object.keys(row.counts).filter(
            (id) => scenario.request.units.find((unit) => unit.id === id)?.pool === 'leadership',
          );
          expect(troops.length, `${row.pick} troop stacks`).toBeGreaterThan(0);
        }
      },
      600_000,
    );
  }

  /**
   * **The troop wall's one trade, accepted by the owner** (2026-09-23, experiments 152 and 154, *"yes allow the
   * troop wall"*): on his live camp of 2026-09-18 the wall doubles the bar's most damage (15,306,859 →
   * 30,986,506) and the fold, holding five stops, drops the all-in — so the cheapest stop costs 1.8 % more silver
   * (6,653,700 → 6,773,900) and the best damage a merc falls 0.5 % (233,912 → 232,812). Pinned here so the trade
   * cannot grow unnoticed; on every other army the wall changes nothing.
   */
  test('the troop wall’s accepted trade on the live camp stays what was accepted', () => {
    if (!profile) return;
    const scenario = scenarios.find((s) => s.label.startsWith('the owner’s live camp of 2026-09-18'));
    if (!scenario) return;
    const wall = planWith(scenario.request, true);
    const noWall = ((): CampaignPlan | undefined => {
      try {
        return planCampaign({
          request: scenario.request,
          marchTarget: HORIZON,
          budgetMs: CAMPAIGN.budgets.plan,
          ...CAMPAIGN.planFixes,
          bandTroopStacks: undefined,
          putBack: CAMPAIGN.putBack,
        });
      } catch {
        return undefined;
      }
    })();
    expect(wall && noWall).toBeTruthy();
    if (!wall || !noWall) return;
    const priced = (plan: CampaignPlan): Campaign[] =>
      plan.alternatives.map((stop) =>
        campaignOf(scenario.request, stop.pick, 'plan', marchesOf(stop as PlanTotals)),
      );
    const was = readings(priced(noWall));
    const now = readings(priced(wall));
    expect(now['most damage']).toBeGreaterThanOrEqual((was['most damage'] ?? 0) * 2);
    // The two readings it gives up, each within what was accepted.
    expect(-(now['least silver'] ?? 0)).toBeLessThanOrEqual(-(was['least silver'] ?? 0) * 1.02);
    expect(now['damage a merc']).toBeGreaterThanOrEqual((was['damage a merc'] ?? 0) * 0.99);
    for (const key of Object.keys(was)) {
      if (key === 'least silver' || key === 'damage a merc') continue;
      expect(now[key] ?? 0, key).toBeGreaterThanOrEqual((was[key] ?? 0) - 1e-9);
    }
  }, 600_000);
});
