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
import { planMarch } from '@/engine';
import { planCampaign } from '@/engine/plan';
import { rate } from '@/engine/rating';
import type { StackRequest } from '@/engine/types';

import { allInFieldsTheMost, allInNotBeaten } from './all-in-rules';
import type { Contender } from './matched-spend';
import { matchedSpend } from './matched-spend';
import type { Campaign } from './plan-campaign';
import { asCaptured, campaignOf, marchesOf } from './plan-campaign';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from './plan-scenarios';
import { totalstackRows, widenedFor } from './totalstack-rows';

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
    // Registered by the owner 2026-09-24 ("register them all"): the wall bar's cheapest stop is unchanged at
    // 6,773,900, but the bar without the wall got cheaper with the re-typing (6,570,800), so the gap grew from
    // 1.8 % to 3.1 %. Pinned on both: the wall's own figure, and the gap as it stands.
    expect(-(now['least silver'] ?? 0)).toBeLessThanOrEqual(6_773_900);
    expect(-(now['least silver'] ?? 0)).toBeLessThanOrEqual(-(was['least silver'] ?? 0) * 1.031);
    expect(now['damage a merc']).toBeGreaterThanOrEqual((was['damage a merc'] ?? 0) * 0.99);
    for (const key of Object.keys(was)) {
      if (key === 'least silver' || key === 'damage a merc') continue;
      expect(now[key] ?? 0, key).toBeGreaterThanOrEqual((was[key] ?? 0) - 1e-9);
    }
  }, 600_000);
});

/**
 * **The rated re-typing, on against off** (W11 §4.2–4.3, `docs/plans/the-rated-retyping.md`; experiment 160).
 * On every benchmark army the bar with `retype: 'rated'` (as shipped in `CAMPAIGN.planFixes`) against the same
 * request with the pass off: no stop the owner's rating reads worse (`rate` on the campaign bill, matched by
 * name), no stop's damage lower, every hired stack of every march sheltered, the bar ordered along the burn, at
 * most five stops — and TotalStack at matched spend no worse than the 47 rows dominated and 13 no stop fits the
 * bar read before the pass.
 */
describe('the rated re-typing', () => {
  test('ships on', () => {
    expect(CAMPAIGN.planFixes.retype).toBe('rated');
  });

  const retypePlan = (request: StackRequest, on: boolean): CampaignPlan | undefined => {
    try {
      return planCampaign({
        request,
        marchTarget: HORIZON,
        budgetMs: CAMPAIGN.budgets.plan,
        ...CAMPAIGN.planFixes,
        ...(on ? {} : { retype: undefined }),
        putBack: CAMPAIGN.putBack,
      });
    } catch {
      return undefined;
    }
  };
  const sheltered = (request: StackRequest, counts: Record<string, number>): boolean => {
    const { result } = planMarch(request, counts);
    const troops = result.stacks.filter((stack) => stack.pool === 'leadership');
    if (troops.length === 0) return true;
    const floor = Math.min(...troops.map((stack) => stack.totalHp));
    return result.stacks
      .filter((stack) => stack.pool !== 'leadership')
      .every((stack) => stack.totalHp < floor);
  };
  const totalstack = { before: { beaten: 0, unfitted: 0 }, after: { beaten: 0, unfitted: 0 }, armies: 0 };

  for (const scenario of scenarios) {
    test(
      scenario.label,
      () => {
        const off = retypePlan(scenario.request, false);
        const on = retypePlan(scenario.request, true);
        expect(on === undefined).toBe(off === undefined);
        if (!off || !on || off.alternatives.length === 0) return;
        totalstack.armies += 1;
        const priced = (row: PlanRow): Campaign =>
          campaignOf(scenario.request, row.pick, 'plan', marchesOf(row as PlanTotals));
        const before = off.alternatives.map(priced);
        const after = on.alternatives.map(priced);
        // TotalStack at matched spend, summed over **every** army — counted before any assertion below, so an
        // army that fails one of them still counts (the owner, 2026-09-24: "fix the sum test too"; it summed only
        // the armies that passed, which read 27/6 while every army read 70/13).
        const held = new Set(scenario.request.units.map((unit) => unit.id));
        const theirs: Campaign[] = [];
        for (const external of [...scenario.externals, ...totalstackRows(scenario.label)]) {
          if (!external.name.startsWith('TotalStack')) continue;
          if (Object.entries(external.counts).some(([id, c]) => c > 0 && !held.has(id))) continue;
          const row = asCaptured(
            widenedFor(scenario.request, external.counts),
            external.name,
            external.counts,
          );
          if (row.damage > 0) theirs.push(row);
        }
        if (theirs.length > 0) {
          const va = matchedSpend(before as Contender[], theirs as Contender[]);
          const vb = matchedSpend(after as Contender[], theirs as Contender[]);
          totalstack.before.beaten += va.rowsBeaten;
          totalstack.before.unfitted += va.unfitted;
          totalstack.after.beaten += vb.rowsBeaten;
          totalstack.after.unfitted += vb.unfitted;
        }
        const billOf = (c: Campaign) => ({
          damage: c.damage,
          silver: c.silver,
          gold: c.gold,
          hired: c.burned,
          dragonCoins: c.dragonCoins,
          seconds: c.seconds,
        });
        on.alternatives.forEach((row, index) => {
          const was = off.alternatives.findIndex((other) => other.pick === row.pick);
          const a = before[was];
          const b = after[index];
          if (was < 0 || !a || !b) return;
          const rated = rate(billOf(a), billOf(b), CAMPAIGN.markerRates);
          expect(rated, `${row.pick} rated`).toBeGreaterThanOrEqual(-1e-9);
          // Registered by the owner 2026-09-24 ("register them all"): damage is held, or a loss is paid for by
          // the stop's rating, never past the trade he accepted — his camp as the message reads it, the burn
          // saver 7,402,685 → 6,580,946 (−11.1 %, 15 → 6 hired, rated +14.72; 167, 7fe146c).
          if (b.damage < a.damage) {
            expect(rated, `${row.pick} damage lost, paid for by the rating`).toBeGreaterThan(0);
            expect(b.damage, `${row.pick} damage`).toBeGreaterThanOrEqual(a.damage * 0.888);
          }
        });
        // The ten readings. Registered by the owner 2026-09-24 ("register them all"; the rule he accepted on
        // 2026-09-23, "Accept all of it"): a reading may be given up only where the rating pays for it, and only
        // the two he accepted, within what was measured — shortest queue +0.08 % (Bear V ×1/×2/×3/×10, Hunter
        // ×83, tiers 3–5, the localStorage camp) and least silver +0.22 % (Aydae alone; his usual setup +0.08 %).
        const was = readings(before);
        const now = readings(after);
        const lost = Object.keys(was).filter((key) => (now[key] ?? 0) < (was[key] ?? 0) - 1e-9);
        // His browser setup of 2026-09-24: the sweet spot +0.43 % silver for a rating of +1.64, registered by him the
        // same day ("Accept the trade", experiment 174).
        const accepted: Record<string, number> = {
          // His browser setup, the same trade: shortest queue +0.148 % (registered by him 2026-09-24).
          'shortest queue': scenario.label.includes('2026-09-24') ? 0.0015 : 0.001,
          'least silver': scenario.label.includes('2026-09-24') ? 0.0045 : 0.0025,
        };
        for (const key of lost) {
          const bound = accepted[key];
          expect(bound, `a reading the pass lost that was never accepted: ${key}`).toBeDefined();
          const from = Math.abs(was[key] ?? 0);
          const loss = from > 0 ? Math.abs((now[key] ?? 0) - (was[key] ?? 0)) / from : 0;
          expect(loss, `${key} lost ${(loss * 100).toFixed(3)} %`).toBeLessThanOrEqual(bound ?? 0);
        }
        const rows = on.alternatives;
        expect(rows.length).toBeLessThanOrEqual(5);
        for (const row of rows)
          for (const march of marchesOf(row as PlanTotals))
            expect(sheltered(scenario.request, march), `${row.pick} sheltered`).toBe(true);
        const rungs = rows.filter((row) => row.pick !== 'all-in');
        for (let index = 1; index < rungs.length; index += 1) {
          const previous = rungs[index - 1] as PlanRow;
          const current = rungs[index] as PlanRow;
          expect(current.repeat.mercLost).toBeGreaterThan(previous.repeat.mercLost);
          expect(current.repeat.damage).toBeGreaterThan(previous.repeat.damage);
        }
      },
      600_000,
    );
  }

  test('TotalStack at matched spend is no worse than 47 dominated / 13 no stop fits', () => {
    if (totalstack.armies < scenarios.length) return;
    expect(totalstack.before).toEqual({ beaten: 47, unfitted: 13 });
    expect(totalstack.after.beaten).toBeGreaterThanOrEqual(47);
    expect(totalstack.after.unfitted).toBeLessThanOrEqual(13);
  });
});

/**
 * **The all-in's two bar rules** (experiment 174; `all-in-rules.ts`), on the bar as shipped, on every benchmark
 * army: (a) the all-in fields more mercenaries over its campaign than every other stop, (b) no stop beats it
 * on damage and silver while fielding at least as many. Before the fix (f4e95d9) both failed on his browser
 * setup of 2026-09-24 alone.
 */
describe('the all-in fields the most mercenaries', () => {
  for (const scenario of scenarios) {
    test(
      scenario.label,
      () => {
        const plan = planWith(scenario.request, true);
        if (!plan) return;
        const failures = [
          ...allInFieldsTheMost(scenario.request, plan.alternatives),
          ...allInNotBeaten(scenario.request, plan.alternatives),
        ];
        expect(failures.join('\n'), `the all-in's rules\n${failures.join('\n')}`).toBe('');
      },
      300_000,
    );
  }
});
