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
import { emptyTotals, planCampaign } from '@/engine';
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
  /** The thrift end: damage a hired unit is the bar's best, and at least this. */
  thriftPerHired: number;
  /** The sweet spot's two ratios and its campaign. */
  sweetPerSilver: number;
  sweetPerHired: number;
  sweetCampaignDamage: number;
  sweetCampaignSilverCeiling: number;
  /** The most-damage end: damage a march and a silver, and the plan's campaign. */
  mostDamage: number;
  mostPerSilver: number;
  campaignDamage: number;
}

/** What every bar must satisfy, whatever the army: the criteria's own consistency. */
function expectCriteria(plan: CampaignPlan, floors: Floors): void {
  const rows = plan.alternatives;
  expect(rows).toHaveLength(3);
  const [thrift, sweet, most] = rows as [PlanRow, PlanRow, PlanRow];
  expect(thrift.pick).toBe('spare-the-stock');
  expect(sweet.pick).toBe('sweet-spot');
  expect(most.pick).toBe('most-damage');
  expect(plan.recommend?.counts).toEqual(sweet.counts);

  // Along the bar, burning more must buy more.
  expect(sweet.repeat.mercLost).toBeGreaterThan(thrift.repeat.mercLost);
  expect(most.repeat.mercLost).toBeGreaterThan(sweet.repeat.mercLost);
  expect(sweet.repeat.damage).toBeGreaterThan(thrift.repeat.damage);
  expect(most.repeat.damage).toBeGreaterThan(sweet.repeat.damage);

  // The two efficiencies sit where the notes say they do.
  expect(thrift.bestFor.hired).toBe(true);
  expect(perHired(thrift)).toBe(Math.max(...rows.map(perHired)));
  expect(most.bestFor.silver).toBe(true);
  expect(perSilver(most)).toBe(Math.max(...rows.map(perSilver)));

  // The sweet spot is not beaten on both ratios by either end.
  for (const end of [thrift, most]) {
    const beats = perSilver(end) >= perSilver(sweet) && perHired(end) >= perHired(sweet);
    expect(beats).toBe(false);
  }

  // The floors: the criteria themselves.
  expect(perHired(thrift)).toBeGreaterThanOrEqual(floors.thriftPerHired);
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
    // Measured 2026-09-18: thrift 464 728 a hired; sweet 1.0024 a silver · 383 259 a hired, campaign
    // 6 638 206 for 6 117 600; most 2 006 473 a march at 1.3119; the plan 7 866 454.
    expectCriteria(plan, {
      thriftPerHired: under(464_728),
      sweetPerSilver: under(1.0024),
      sweetPerHired: under(383_259),
      sweetCampaignDamage: under(6_638_206),
      sweetCampaignSilverCeiling: over(6_117_600),
      mostDamage: under(2_006_473),
      mostPerSilver: under(1.3119),
      campaignDamage: under(7_866_454),
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
      const started = Date.now();
      const plan = planCampaign(buildPlanRequest(profile, setup));
      // Measured 2026-09-18 (`out/95`, `out/96`): 7 · 10 · 14 burned; thrift 548 476 a hired; sweet 1.8064 ·
      // 494 851, campaign 20 924 965 for 10 957 600; most 6 242 452 at 2.2788; the plan 24 814 601; ~1 s.
      expectCriteria(plan, {
        thriftPerHired: under(548_476),
        sweetPerSilver: under(1.8064),
        sweetPerHired: under(494_851),
        sweetCampaignDamage: under(20_924_965),
        sweetCampaignSilverCeiling: over(10_957_600),
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
      // Measured 2026-09-18: 9 · 13 · 17 burned; thrift 602 630 a hired; sweet 1.4644 · 529 175, campaign
      // 28 804 801 for 18 790 400; most 8 185 823 at 1.7426; the plan 32 231 242.
      expectCriteria(plan, {
        thriftPerHired: under(602_630),
        sweetPerSilver: under(1.4644),
        sweetPerHired: under(529_175),
        sweetCampaignDamage: under(28_804_801),
        sweetCampaignSilverCeiling: over(18_790_400),
        mostDamage: under(8_185_823),
        mostPerSilver: under(1.7426),
        campaignDamage: under(32_231_242),
      });
    }, 120_000);
  },
);
