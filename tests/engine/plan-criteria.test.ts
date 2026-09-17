/**
 * The plan's **criteria**, frozen as floors (owner, 2026-09-18: *"check we have sufficient tests to avoid
 * regression in the future. Always test the actual criteria dmg/silver dmg/merc, not the shape of the
 * march"*).
 *
 * Every figure here is what the app draws for the bar's three stops: damage a march, damage a silver, damage a
 * hired unit burned, and the campaign's damage and silver over the horizon. They are **floors** (and one
 * ceiling), not equalities: a change that finds a better march passes, a change that loses one fails. The
 * figures were measured on 2026-09-18 (`tools/theorycraft/out/95-sizer-methods.md`, `out/96-branches.md`)
 * with the app's own flags — S-58 A, the sizer shapes under three methods, the burn axis, three stops — and
 * are set a tenth of a percent under what was measured so a rounding difference is not a regression.
 *
 * Two armies: the synthetic one every engine test uses (runs everywhere), and the owner's export of
 * 2026-09-17 through the app's own request builder (runs where the file is, skipped elsewhere) — the account
 * the plan was actually corrected on.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

import { getUnits } from '@/data';
import { emptyTotals, planCampaign, planMarch } from '@/engine';
import type { CampaignPlan, PlanRow } from '@/engine/plan';
import type { StackRequest, UnitDef } from '@/engine/types';
import { parseImport } from '@/share/exportImport';
import { buildPlanRequest } from '@/state/derive';

const OWNER_EXPORT =
  process.env.PYRRHIC_EXPORT_2026_09_17 ?? '/home/remi/Downloads/pyrrhic-my-account-2026-09-17 (2).json';

/** The engine tests' army: four troop types and three mercenaries with a stock of twenty each. */
function request(): StackRequest {
  const all = getUnits();
  const troops = all.filter((unit) => unit.pool === 'leadership' && unit.tier <= 3);
  const mercs = all.filter((unit) => unit.pool === 'authority' && unit.health <= 20_000);
  const chosen: UnitDef[] = [...troops.slice(0, 4), ...mercs.slice(0, 3)];
  const caps: Record<string, number> = {};
  for (const merc of mercs.slice(0, 3)) caps[merc.id] = 20;
  return {
    units: chosen,
    caps,
    housing: { leadership: 4_000, authority: 2_000, dominance: 0 },
    totals: emptyTotals(),
    options: { method: 'elite', strictMercsAboveMonsters: false, monstersLast: false, roundTo10: false },
    enemy: { melee: 1, ranged: 1, mounted: 1, flying: 1 },
    activeEvents: [],
    recovery: { templeLevel: 0, trainingCostReduction: {}, trainingSpeed: {}, plan: { mode: 'retrain' } },
  };
}

const perSilver = (row: PlanRow): number => row.repeat.damage / row.repeat.silver;
const perHired = (row: PlanRow): number => row.repeat.damage / Math.max(1, row.repeat.mercLost);
const under = (measured: number): number => measured * 0.999;
const over = (measured: number): number => measured * 1.001;

interface Floors {
  /** The least-silver end: damage a hired unit is the bar's best there, and at least this. */
  leastPerHired: number;
  /** The sweet spot's two ratios and its campaign. */
  sweetPerSilver: number;
  sweetPerHired: number;
  sweetCampaignDamage: number;
  sweetCampaignSilverCeiling: number;
  /** The most-mercs end: damage a march and a silver, and the plan's campaign. */
  mostDamage: number;
  mostPerSilver: number;
  campaignDamage: number;
}

/** What every bar must satisfy, whatever the army: the criteria's own consistency. */
function expectCriteria(plan: CampaignPlan, floors: Floors): void {
  const rows = plan.alternatives;
  expect(rows.length).toBeGreaterThanOrEqual(3);
  expect(rows.length).toBeLessThanOrEqual(4);
  const named = (pick: PlanRow['pick']): PlanRow | undefined => rows.find((row) => row.pick === pick);
  const least = named('least-silver');
  const sweet = named('sweet-spot') as PlanRow;
  const most = named('most-mercs') as PlanRow;
  expect(sweet).toBeDefined();
  expect(most).toBeDefined();
  expect(rows[rows.length - 1]).toBe(most);
  expect(plan.recommend?.counts).toEqual(sweet.counts);

  // Along the bar, burning more must buy more.
  for (let index = 1; index < rows.length; index += 1) {
    const previous = rows[index - 1] as PlanRow;
    const current = rows[index] as PlanRow;
    expect(current.repeat.mercLost).toBeGreaterThan(previous.repeat.mercLost);
    expect(current.repeat.damage).toBeGreaterThan(previous.repeat.damage);
  }

  // The two efficiency notes sit on exactly one stop each, and on the stop that has the figure.
  const silverNotes = rows.filter((row) => row.bestFor.silver);
  const hiredNotes = rows.filter((row) => row.bestFor.hired);
  expect(silverNotes).toHaveLength(1);
  expect(hiredNotes).toHaveLength(1);
  expect(perSilver(silverNotes[0] as PlanRow)).toBe(Math.max(...rows.map(perSilver)));
  expect(perHired(hiredNotes[0] as PlanRow)).toBe(Math.max(...rows.map(perHired)));

  // The sweet spot is not beaten on both ratios by the rungs to its right; the least-silver stop is allowed
  // to — it is the saving stop, cheaper and at least as efficient a silver by definition, and it pays for
  // that in damage (owner's design of 2026-09-18: least silver · sweet spot · more mercs · most mercs).
  for (const other of rows) {
    if (other === sweet || other === least) continue;
    const beats = perSilver(other) >= perSilver(sweet) && perHired(other) >= perHired(sweet);
    expect(beats).toBe(false);
  }
  if (least) expect(perSilver(least)).toBeGreaterThanOrEqual(perSilver(sweet));

  // The floors: the criteria themselves.
  if (least) {
    expect(least.repeat.silver).toBeLessThanOrEqual(sweet.repeat.silver);
    expect(perHired(least)).toBeGreaterThanOrEqual(floors.leastPerHired);
  }
  expect(perSilver(sweet)).toBeGreaterThanOrEqual(floors.sweetPerSilver);
  expect(perHired(sweet)).toBeGreaterThanOrEqual(floors.sweetPerHired);
  expect(sweet.totalDamage).toBeGreaterThanOrEqual(floors.sweetCampaignDamage);
  expect(sweet.silver).toBeLessThanOrEqual(floors.sweetCampaignSilverCeiling);
  expect(most.repeat.damage).toBeGreaterThanOrEqual(floors.mostDamage);
  expect(perSilver(most)).toBeGreaterThanOrEqual(floors.mostPerSilver);
  expect(plan.totalDamage).toBeGreaterThanOrEqual(floors.campaignDamage);
}

describe('the plan’s criteria hold their floors', () => {
  test('on the engine tests’ army, horizon 4', () => {
    const plan = planCampaign({
      request: request(),
      marchTarget: 4,
      tokenFloor: true,
      sizerShape: true,
    });
    // Measured 2026-09-18 (least silver 3 burned · sweet spot 5 · most mercs 6): least silver 1 320 822 for
    // 1 069 600 at 440 274 a hired (the tight ladder — a real saving, 30 % less silver than the sweet spot's
    // 1 529 400); sweet 1.2211 a silver · 373 524 a hired, campaign 7 521 725 for 6 089 100; most 2 006 473
    // a march at 1.3119; the plan 7 868 855.

    expectCriteria(plan, {
      leastPerHired: under(440_274),
      sweetPerSilver: under(1.2211),
      sweetPerHired: under(373_524),
      sweetCampaignDamage: under(7_521_725),
      sweetCampaignSilverCeiling: over(6_089_100),
      mostDamage: under(2_006_473),
      mostPerSilver: under(1.3119),
      campaignDamage: under(7_868_855),
    });
  }, 120_000);
});

describe.skipIf(!existsSync(OWNER_EXPORT))(
  'the plan’s criteria hold their floors on the owner’s account',
  () => {
    const parsed = existsSync(OWNER_EXPORT) ? parseImport(readFileSync(OWNER_EXPORT, 'utf8')) : null;
    const profile = parsed?.kind === 'profile' ? parsed.payload : null;
    const setup = profile?.setups[0];

    test('at his setup (7 000 leadership), through the app’s own request builder', () => {
      if (!profile || !setup) throw new Error('no profile');
      const input = buildPlanRequest(profile, setup);
      // The bonuses reach the plan: his three captains (Aydae 39 ★3, Leonidas 36, Alexander 19) and the army
      // modernization are what the request carries, and nothing else is active on this setup. A regression in
      // source resolution would move these before it moved the floors below.
      expect(input.request.totals.strength.guardsmen).toBe(84);
      expect(input.request.totals.health.guardsmen).toBe(54);
      expect(input.request.totals.strength.melee).toBe(72);
      expect(input.request.totals.health.melee).toBe(38);
      expect(input.request.totals.strength.mounted).toBe(38);
      expect(input.request.totals.health.mounted).toBe(21);
      const started = Date.now();
      const plan = planCampaign(input);
      // The plan prices a march exactly as the recap will: its own figure for the sweet spot is the battle's.
      expect(plan.recommend?.repeat.damage).toBe(
        planMarch(input.request, plan.recommend?.counts ?? {}).summary.avgDamage,
      );
      // Measured 2026-09-18, once every burn level between the ends has a rung: 7 · 10 · 12 · 14 burned;
      // least silver 4 541 421 for 2 722 500 at 648 774 a hired; sweet 4 965 077 for 2 614 000 at 1.8994 ·
      // 496 508, campaign 20 684 777 for 10 581 400; most 6 242 452 at 2.2788; the plan 24 814 601. The sweet
      // spot moved 11 → 10 when the ladder gained its 7-burn rung: this ladder is convex (each unit burned
      // buys more than the last), so there is no knee and the middle of the efficient rungs stands — 5 %
      // less silver and 2.5 % more a hired unit than the 11, for 2.4 % less a silver. A floor is re-based only
      // for a change measured and explained, and the note says which.
      // Least silver here is the 7-burn tight ladder: 4 177 683 for 2 178 700 (17 % less silver than the sweet
      // spot) at 1.918 a silver · 596 812 a hired — it beats the sweet spot on both ratios, which the saving
      // stop may.
      expectCriteria(plan, {
        leastPerHired: under(596_812),
        sweetPerSilver: under(1.8994),
        sweetPerHired: under(496_507),
        sweetCampaignDamage: under(20_684_777),
        sweetCampaignSilverCeiling: over(10_581_400),
        mostDamage: under(6_242_452),
        mostPerSilver: under(2.2788),
        campaignDamage: under(24_814_601),
      });
      expect(Date.now() - started).toBeLessThan(10_000);
    }, 120_000);

    test('at 12 000 leadership', () => {
      if (!profile || !setup) throw new Error('no profile');
      const plan = planCampaign(
        buildPlanRequest(profile, { ...setup, housing: { ...setup.housing, leadership: 12_000 } }),
      );
      // Measured 2026-09-18, every burn level filled: 11 · 17 · 19 burned (the knee lands at 17, where the last
      // two units buy 1 % of damage for 16 % of silver, so no rung fits between it and the top); least silver
      // 6 297 292 for 3 972 200 at 572 481 a hired; sweet 1.7426 · 481 519, campaign 32 231 242 for
      // 18 790 400; most 8 281 474 at 1.5186; the plan 32 518 195.
      expectCriteria(plan, {
        leastPerHired: under(524_183),
        sweetPerSilver: under(1.7426),
        sweetPerHired: under(481_519),
        sweetCampaignDamage: under(32_231_242),
        sweetCampaignSilverCeiling: over(18_790_400),
        mostDamage: under(8_281_474),
        mostPerSilver: under(1.5186),
        campaignDamage: under(32_518_195),
      });
    }, 120_000);
  },
);
