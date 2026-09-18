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

import { CAMPAIGN } from '@/config';
import { getUnits } from '@/data';
import { emptyTotals, planCampaign, planMarch } from '@/engine';
import type { CampaignPlan, PlanRow, PlanTotals } from '@/engine/plan';
import type { StackRequest, UnitDef } from '@/engine/types';
import { parseImport } from '@/share/exportImport';
import { buildPlanRequest, buildStackRequest } from '@/state/derive';

import type { Scenario } from './plan-scenarios';
import { HORIZON, commonScenarios, ownerProfile, ownerScenarios } from './plan-scenarios';

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
/**
 * The hired units a march **fields**. The bar runs along the burn — what the stock pays — and this is the one
 * reading the engine takes off the counts: the `all-in` is offered when its first march fields more than the
 * steady max's repeat (`plan.ts`). The unit ids are the authority pool's; every army here holds only hired
 * soldiers in it.
 */
const hiredOf = (counts: Record<string, number>): number =>
  Object.entries(counts).reduce(
    (sum, [id, count]) =>
      getUnits().find((unit) => unit.id === id)?.pool === 'authority' ? sum + count : sum,
    0,
  );
const under = (measured: number): number => measured * 0.999;
const over = (measured: number): number => measured * 1.001;

interface Floors {
  /** The silver saver: damage a hired unit at least this, when the stop is offered. */
  leastPerHired: number;
  /** The sweet spot's two ratios and its campaign. */
  sweetPerSilver: number;
  sweetPerHired: number;
  sweetCampaignDamage: number;
  sweetCampaignSilverCeiling: number;
  /** The steady max: damage a march and a silver, and the plan's campaign. */
  mostDamage: number;
  mostPerSilver: number;
  campaignDamage: number;
}

/** What every bar must satisfy, whatever the army: the criteria's own consistency. */
function expectCriteria(plan: CampaignPlan, floors: Floors): void {
  const rows = plan.alternatives;
  expect(rows.length).toBeGreaterThanOrEqual(3);
  expect(rows.length).toBeLessThanOrEqual(5);
  const named = (pick: PlanRow['pick']): PlanRow | undefined => rows.find((row) => row.pick === pick);
  const least = named('silver-saver');
  const sweet = named('sweet-spot') as PlanRow;
  const most = named('steady-max') as PlanRow;
  const allIn = named('all-in');
  expect(sweet).toBeDefined();
  expect(most).toBeDefined();
  expect(rows[rows.length - 1]).toBe(allIn ?? most);
  expect(plan.recommend?.counts).toEqual(sweet.counts);

  // Along the bar, burning more must buy more — up to the steady max. The all-in stop fields every
  // mercenary the troops can shelter, which can cost troops: it burns the most and need not hit the hardest.
  //
  // **Re-based 2026-09-18: the all-in may share the steady max's burn.** It is offered on what its first march
  // *fields* rather than on what it burns, because a stock smaller than a chunk burns the same whatever it
  // fields (ten bears: 10 · 9 · 8 · 7 and eight a march are both one chunk a march). On this army the two land
  // on 6 burned together — 60 hired fielded against 48 — and the assertion was strict, which is why the
  // synthetic bar had three stops and now has four. The rung stops are still strictly apart on the burn.
  for (let index = 1; index < rows.length; index += 1) {
    const previous = rows[index - 1] as PlanRow;
    const current = rows[index] as PlanRow;
    if (current.pick === 'all-in') {
      expect(current.repeat.mercLost).toBeGreaterThanOrEqual(previous.repeat.mercLost);
      continue;
    }
    expect(current.repeat.mercLost).toBeGreaterThan(previous.repeat.mercLost);
    // **Strict, put-back pass or no put-back pass** (2026-09-18). The pass may trade up to
    // `CAMPAIGN.putBack.damageLossCap` of a march's damage for silver and queue, and on the owner's export at
    // 12 000 that was enough to put the steady max 1.5 % *under* the sweet spot beside it (8 063 238 against
    // 8 185 823). The engine walks the bar and hands such a row its generated march back rather than letting
    // the ladder run backwards, so this assertion stays exactly as S-61 wrote it.
    expect(current.repeat.damage).toBeGreaterThan(previous.repeat.damage);
  }
  if (allIn) {
    expect(allIn.sequence?.length).toBe(allIn.marches);
    expect(allIn.repeat.mercLost).toBeGreaterThanOrEqual(most.repeat.mercLost);
    // And it fields more than the steady max's repeat, which is the rule it is offered by.
    expect(hiredOf(allIn.counts)).toBeGreaterThan(hiredOf(most.counts));
  }

  // The two efficiency notes sit on exactly one stop each, and on the stop that has the figure.
  const silverNotes = rows.filter((row) => row.bestFor.silver);
  const hiredNotes = rows.filter((row) => row.bestFor.hired);
  expect(silverNotes).toHaveLength(1);
  expect(hiredNotes).toHaveLength(1);
  expect(perSilver(silverNotes[0] as PlanRow)).toBe(Math.max(...rows.map(perSilver)));
  expect(perHired(hiredNotes[0] as PlanRow)).toBe(Math.max(...rows.map(perHired)));

  // The sweet spot is not beaten on both ratios by the rungs to its right; the silver saver is allowed
  // to — it is the saving stop, cheaper and at least as efficient a silver by definition, and it pays for
  // that in damage (owner's design of 2026-09-18: silver saver · sweet spot · more mercs · steady max · all in).
  for (const other of rows) {
    if (other === sweet || other === least || other === allIn) continue;
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
      // The put-back pass, at the app's own rates: this army is the one that runs everywhere, so it is where
      // the pass is held to the criteria on a machine with no export on it (`CAMPAIGN.putBack`).
      putBack: CAMPAIGN.putBack,
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
      // Measured 2026-09-18 with every hired type kept (S-58 B) and every hired stack sheltered under the
      // troops: 11 · 12 · 13 · 27 burned; no silver saver (the cheaper marches left of the sweet spot drop a
      // type or are not as efficient a silver); sweet 5 330 563 for 2 739 400 at 1.9459 · 484 597, campaign
      // 21 662 734 for 10 957 600; steady max 5 864 482 at 2.1408 (it was the unsheltered MS-relaxed march at
      // 6 242 452: the shelter costs 6 % of damage here, which is the owner's choice); the plan 23 264 491.
      // Re-based 2026-09-18 (S-77): the shelter is the **unlimited** types' rule alone, so the capped
      // legionaries stand on top again as the enemy's first kill and the steady max is the sponge march at
      // 6 242 452 (2.2788 a silver), the plan 24 814 601. The burn ladder is 7 · 9 · 10 · 11 · 12 · 13 · 14,
      // no rung stands above the chord, and the middle is 10.5: the 10 and the 11 are equally near it, and the
      // tie now goes to the rung the other does not dominate over the campaign (`middleOfRange`) — the **11**,
      // 22 045 361 at 2.0119 a silver and 393 667 a hired against the 10's 20 684 777 at 1.9548 and 376 087.
      // Its own march is 5 330 563 for 2 739 400 — 1.9459 a silver, 484 597 a hired unit.
      // **No silver saver is offered**: that stop must be at least as efficient a silver as the sweet spot,
      // and the 11 at 1.9459 leaves nothing left of it that is (the 7 burns at 1.9175). The floor below is
      // kept for the armies that do offer one; `expectCriteria` reads it only then.
      // **Re-based 2026-09-18**, when the sweep began scoring each of its levels per unit as well as rounded
      // up to a whole chunk (`plan.ts`). The ladder is the same 7 · 9 · 10 · 11 · 12 · 13 · 14, but the plan at
      // its **7-burn rung is better** — 3 650 146 a march for 1 851 500 silver, 1.9715 a silver against the
      // 1.9175 quoted above — and a better thrift end tilts the chord the knee is measured from, so a rung now
      // stands above it where none did and the middle rule no longer decides. The sweet spot moves from the 11
      // to the **10**: 4 948 511 a march for 2 739 400 at 1.8064 a silver and 494 851 a hired unit, campaign
      // 20 924 965. It costs damage (22 045 361 → 20 924 965) and a silver (1.9459 → 1.8064) and buys a hired
      // unit (484 597 → 494 851). A **silver saver is offered again** at that new 7-burn rung — 16 747 720 over
      // four marches at 521 449 a hired — which is why `leastPerHired` drops from a floor nothing exercised.
      // The steady max and the plan itself are untouched: 6 242 452 at 2.2788, campaign 24 814 601.
      // **Re-based 2026-09-18 (S-87): every hired stack is sheltered again, capped or unlimited.** This is the
      // account S-77's sponge was measured on, so it is where the owner's *"a critical rule is to shield
      // mercs"* costs the most — and the bar lands exactly back on the four stops S-75 measured here, to the
      // unit. The burn ladder is 11 · 12 · 13 · 27: sweet spot 5 330 563 a march for 2 739 400 (**1.9459** a
      // silver, **484 597** a hired), campaign 21 662 734 for 10 957 600; more mercs 5 487 598; steady max
      // 5 864 482 at **2.1408** (it was the unsheltered MS-relaxed march at 6 242 452 — the shelter costs
      // 6.1 % of the top march here); the plan **23 264 491** against 24 814 601.
      //
      // Three floors fall and are explained by that one change: `sweetPerHired` 494 851 → 484 597 (the
      // recommendation moves from the 10-burn rung to the 11, which buys 3.5 % more campaign damage for 2 %
      // less a hired unit), `mostDamage` and `mostPerSilver` with the sponge, and `campaignDamage` with them.
      // Two floors **rise**: `sweetPerSilver` 1.8064 → 1.9459 and `sweetCampaignDamage` 20 924 965 →
      // 21 662 734. **No silver saver is offered** — nothing left of the 11-burn rung is as efficient a silver
      // as it is — so `leastPerHired` is again a floor nothing on this army exercises; it is kept at the
      // figure the armies that do offer one were measured at, and `expectCriteria` reads it only then.
      expectCriteria(plan, {
        leastPerHired: under(521_449),
        sweetPerSilver: under(1.9459),
        sweetPerHired: under(484_597),
        sweetCampaignDamage: under(21_662_734),
        sweetCampaignSilverCeiling: over(10_957_600),
        mostDamage: under(5_864_482),
        mostPerSilver: under(2.1408),
        campaignDamage: under(23_264_491),
      });
      // 1 429 ms measured on 2026-09-18 (benchmark 06) against 7 113 ms before the shelter: a sheltered vector is reached
      // from many directions at once, so the climb and the sweep re-score far fewer distinct shapes.
      expect(Date.now() - started).toBeLessThan(10_000);
    }, 120_000);

    test('the sweet spot’s campaign is not dominated by another stop, at 7 000', () => {
      if (!profile || !setup) throw new Error('no profile');
      // **The tie the campaign breaks** (validator, 2026-09-18; S-77). With the sponge march on the bar the
      // burn ladder has no knee, and the middle of it falls between two rungs — 10.5 on this army. Thrift used
      // to take the 10, and the 10 is dominated over the whole campaign by the 11: 20 684 777 at 1.9548 a
      // silver and 376 087 a hired against 22 045 361 at 2.0119 and 393 667. The recommendation must never be
      // a plan another stop of the same bar beats on both of the things the slider balances.
      const plan = planCampaign(buildPlanRequest(profile, setup));
      const sweet = plan.alternatives.find((row) => row.pick === 'sweet-spot') as PlanRow;
      expect(sweet).toBeDefined();
      // 22 000 000 → 20 900 000 on 2026-09-18: the knee moved from the 11-burn rung to the 10 when the sweep's
      // per-unit vectors improved the ladder's 7-burn rung and tilted the chord (see the floors above).
      // 20 900 000 → **21 600 000** later that day (S-87): with every hired stack sheltered the ladder is
      // 11 · 12 · 13 and the sweet spot is its 11-burn rung again, 21 662 734 over four marches.
      expect(sweet.totalDamage).toBeGreaterThanOrEqual(21_600_000);
      // **The silver saver is excluded, as it is in `expectCriteria`** (re-based 2026-09-18). That stop is
      // defined to be cheaper than the sweet spot *and* at least as efficient a silver, so it can only ever
      // tie or beat it on the first ratio, and a thriftier march usually beats it on the second too: the rule
      // this file already states is that the saving stop is allowed to, and it pays for it in damage. HEAD's
      // 12 000 bar is the precedent — its silver saver, 1.8143 a silver and 524 183 a hired against the sweet
      // spot's 1.7426 and 481 519, dominates it there and always has. This test was written when the 7 000 bar
      // had **no** silver saver (the sweep's per-unit vectors gave it one at 7 burned), so the exception had
      // never applied here. What it is for is unchanged: no *other* stop may beat the recommendation on both.
      for (const other of plan.alternatives) {
        if (other === sweet || other.pick === 'silver-saver') continue;
        const beats =
          other.damagePerSilver >= sweet.damagePerSilver &&
          other.damagePerMercenary >= sweet.damagePerMercenary &&
          (other.damagePerSilver > sweet.damagePerSilver ||
            other.damagePerMercenary > sweet.damagePerMercenary);
        expect(beats, `${other.pick} dominates the sweet spot over the campaign`).toBe(false);
      }
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
      // **Unmoved by the put-back pass** (`CAMPAIGN.putBack`, `engine/plan.ts`), and it is the one bar where
      // that took a guard. The steady max's ladder (SP2 2117 · RD3 640 · RD2 1115 · RD1 1968 · ARC2 2406,
      // 8 281 474 for 5 453 300 silver and 20d 23h) scores a put-back of **Spearman I** — 8 063 238 for
      // 5 013 600 and 16d 9h, 8.1 % of the silver and 21.8 % of the queue for 2.6 % of the damage, a score of
      // 1.15 — and taking it would have left "Steady max" 1.5 % **under** the sweet spot beside it
      // (8 185 823). The bar's own invariant wins: the engine walks the ladder from the thrift end and hands
      // any row that stops out-hitting its neighbour its generated march back, so these floors are the ones
      // measured before the pass. The other three stops field every troop type they hold already.
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

/**
 * **The owner's live camp of 2026-09-18**, beside the benchmark's own armies: the profile he was looking at
 * when he wrote *"mercs are unshielded on all complete optimization marches"* — arbalesters 485, legionaries
 * 1 002, bears unlimited, his three captains, 4 975 leadership and 2 180 authority, the two top guardsman
 * tiers and the top melee specialist he does not own clicked out. It is the camp experiment 106 measured
 * (`tools/theorycraft/out/106-shelter-live.md`), where **every** stop fielded hired stacks above the troops —
 * 375 legionaries and 403 arbalesters over a 274 772-HP floor at the sweet spot — and it is the one case in
 * this file that no benchmark scenario covers, which is exactly why it is here.
 */
const liveCamp = (): { label: string; request: StackRequest }[] => {
  const owner = ownerProfile();
  if (!owner) return [];
  const camp = structuredClone(owner);
  camp.sources.captains = [
    { id: 'ww8j0qwv', captainId: 'aydae', level: 43, star: 3 },
    { id: '9kfdv1z0', captainId: 'alexander', level: 36, star: 0 },
    { id: 'h9i5fjdc', captainId: 'leonidas', level: 41, star: 0 },
  ];
  camp.troops.topTierExcluded = { guardsmen: ['melee', 'ranged'], specialists: ['melee'] };
  camp.mercenaries.selected = [
    { id: 'arbalester-6', cap: 485 },
    { id: 'legionary-6', cap: 1002 },
    { id: 'bear-5', cap: null },
  ];
  const setup = camp.setups[0];
  if (!setup) return [];
  return [
    {
      label: 'the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)',
      request: buildStackRequest(camp, {
        ...setup,
        active: { ...setup.active, captains: ['h9i5fjdc', '9kfdv1z0', 'ww8j0qwv'] },
        housing: { ...setup.housing, leadership: 4_975, authority: 2_180 },
      }),
    },
  ];
};

/**
 * The armies the two criteria below are held on, built once: the benchmark's own ten
 * (`plan-scenarios.ts`, its labels and its order), the owner's when his export is where it is, and his live
 * camp above.
 */
const profile = ownerProfile();
const scenarios: { label: string; request: StackRequest; pinned?: Scenario['pinned'] }[] = [
  ...commonScenarios(),
  ...(profile ? ownerScenarios(profile) : []),
  ...liveCamp(),
];

/**
 * **The shelter: every hired stack under the lowest troop stack** (owner, 2026-09-18: *"a critical rule is to
 * shield mercs. Right now mercs are unshielded on all complete optimization marches … more damage with a lot
 * of merc spent should trigger a failing test as we're using too much of a rare resource"*, and on 2026-09-18
 * before it: *"when a merc is unlimited and is put in, don't put more, and lower it so the health stack still
 * makes sense (below the troops)"*).
 *
 * The enemy wipes the **highest-HP living stack** first (`buildKillOrder`, `simulateBattle`), so a hired stack
 * whose total HP reaches the lowest troop stack's is the enemy's first kill — the rarest resource on the
 * field spent before a single troop has died. S-75 sheltered the sizer's shapes; S-77 narrowed that to the
 * *unlimited* types on a sponge argument, and S-87 restored it for **every** hired type on every shape the
 * plan offers.
 *
 * This holds on **every scenario the benchmark builds** (`plan-scenarios.ts` — the same armies and the same
 * flags, pins and all), over every march the bar can play: each stop's repeated march, its finale, and every
 * march of the `all-in`'s sequence. The stacks are the engine's own (`planMarch` builds exactly what
 * `simulateBattle` is handed), so this is the battle's reading of the march and not a second model of it.
 */
describe('every hired stack stands under the lowest troop stack', () => {
  /** Every march a stop plays: the `all-in`'s own sequence, or the repeated march and the finale. */
  const marchesOf = (row: PlanTotals): { counts: Record<string, number>; what: string }[] =>
    row.sequence
      ? row.sequence.map((counts, index) => ({ counts, what: `march ${index + 1} of the sequence` }))
      : [
          { counts: row.counts, what: 'the repeated march' },
          ...(row.finaleCounts ? [{ counts: row.finaleCounts, what: 'the finale' }] : []),
        ];

  /** The hired stacks of one march that are not strictly under the lowest troop stack, as the battle sees it. */
  const exposedIn = (
    request: StackRequest,
    counts: Record<string, number>,
  ): { line: string; floor: number } => {
    const { result } = planMarch(request, counts);
    const troops = result.stacks.filter((stack) => stack.pool === 'leadership');
    const hired = result.stacks.filter((stack) => stack.pool === 'authority');
    if (hired.length === 0) return { line: '', floor: Infinity };
    if (troops.length === 0) return { line: 'no troop stack at all shelters the hired ones', floor: 0 };
    const floor = Math.min(...troops.map((stack) => stack.totalHp));
    const over = hired.filter((stack) => stack.totalHp >= floor);
    return {
      floor,
      line:
        over.length === 0
          ? ''
          : over
              .map(
                (stack) =>
                  `${stack.unitId} ${stack.count} = ${Math.round(stack.totalHp).toLocaleString('en-US')} HP ` +
                  `at or above the lowest troop stack (${Math.round(floor).toLocaleString('en-US')} HP)`,
              )
              .join('; '),
    };
  };

  for (const scenario of scenarios) {
    test(
      scenario.label,
      () => {
        const planned = ((): CampaignPlan | string => {
          try {
            return planCampaign({
              request: scenario.request,
              marchTarget: HORIZON,
              budgetMs: CAMPAIGN.budgets.plan,
              ...CAMPAIGN.planFixes,
              putBack: CAMPAIGN.putBack,
            });
          } catch (error) {
            return error instanceof Error ? error.message : String(error);
          }
        })();
        if (typeof planned === 'string') {
          // A scenario the plan refuses has no march to shelter; the benchmark pins the refusal itself.
          expect(scenario.pinned?.refuses ?? false, `unexpected refusal: ${planned}`).toBe(true);
          return;
        }
        const plan = planned;
        const failures: string[] = [];
        const rows: { what: string; row: PlanTotals }[] = [
          ...plan.alternatives.map((row) => ({ what: `stop ${row.pick}`, row: row as PlanTotals })),
          // The plan's own march, which the payload carries beside the bar.
          { what: 'the plan itself', row: plan as PlanTotals },
        ];
        for (const { what, row } of rows) {
          for (const march of marchesOf(row)) {
            const { line } = exposedIn(scenario.request, march.counts);
            if (line) failures.push(`${what}, ${march.what}: ${line}`);
          }
        }
        expect(failures.join('\n'), `exposed hired stacks\n${failures.join('\n')}`).toBe('');

        /**
         * **And the burn never exceeds what the troops shelter** (the owner's *"too much of a rare resource"*,
         * stated on the figures a row carries): a march burns one chunk of ten per hired stack it fields, so
         * its `repeat.mercLost` can never be more than the hired units standing on the field — every one of
         * which the assertion above has just put under the troops. A shape that burned stock it did not field,
         * or fielded a stack the troops do not shelter, breaks one of the two.
         */
        for (const row of plan.alternatives) {
          const fielded = hiredOf(row.counts);
          expect(
            row.repeat.mercLost,
            `${row.pick} burns more than the hired units its troops shelter`,
          ).toBeLessThanOrEqual(fielded);
        }

        /**
         * **And the recommendation is never the worse deal in the rare resource** (the owner's *"too much of a
         * rare resource"* in the one form that is measurable without a number of our own): the sweet spot's
         * damage a hired unit burned is at least the steady max's. The bar runs left to right from thrift to
         * the top, the sweet spot sits left of the steady max, and a recommendation that got **less** out of
         * each unit of the stock than the stop spending more of it would be recommending the waste.
         *
         * Measured on every scenario here, 2026-09-18, before it was pinned: it holds on each of the seven that
         * offer both stops, and never by a hair — the sweet spot gets **7.4 %** more out of a hired unit than
         * the steady max on the owner's export at 7 000, 10.5 % at 12 000, 10.7 % on the e2e seed, 12.3 % on his
         * live account at 20 000, 20.3 % on its evening form, 23.9 % on the 4 000 case and 26.4 % on his live
         * camp. (The four bear armies offer no steady max: their whole stock is one or two stops.) The two
         * stops it does **not** speak about are the ones the bar defines out of the comparison — the silver
         * saver, which is allowed to beat the sweet spot on both ratios because it pays for it in damage, and
         * the `all-in`, which fields every mercenary the troops shelter and is the last stop whatever it costs.
         */
        const sweet = plan.alternatives.find((row) => row.pick === 'sweet-spot');
        const steady = plan.alternatives.find((row) => row.pick === 'steady-max');
        if (sweet && steady) {
          expect(
            perHired(sweet),
            'the sweet spot gets less out of a hired unit than the steady max',
          ).toBeGreaterThanOrEqual(perHired(steady));
        }
      },
      300_000,
    );
  }
});

/**
 * **The reference table names only plans the bar may offer** (S-88; the owner, 2026-09-18, reading the table
 * under his own bar: a row at **2.91 damage a silver**, better than any stop he was offered, and he asked why
 * it was not one).
 *
 * It could never have been one. The table was bucketed inside the search's own `record`, over **every shape
 * the search prices**, while the stops are drawn from the band (`candidates`) — and that row was a
 * one-troop-stack march (Rider III 265 carrying 97 hired) the frontier threw away and the band's third
 * criterion exists to refuse (`tools/theorycraft/out/104-union-slider.md`). A table that names a plan no rule
 * could offer reads as a bar that missed something, so the `curve` is bucketed over the plans the bar may
 * offer instead: the band, plus the stops themselves, so a stop the put-back pass re-sized after it was
 * chosen is in the table the player reads under it.
 *
 * Two things are held here, on every army this file builds:
 *
 *  - **every row is an offered plan**, matched on the pair the row prints — the campaign's damage and its
 *    silver — against `plan.trade` (the band, which `withTrade` hands back) and `plan.alternatives` (the
 *    stops). This is the criterion, and it is the one the owner's question is about;
 *  - **the table's peak damage a silver is the best of that same set**, and *not* of the stops. Measured on
 *    the thirteen scenarios, 2026-09-18: on three of them the table's peak is above every stop's — 1.478
 *    against the bar's 1.370 on the 4 000-leadership case, 1.385 against 1.260 on his live camp and 1.052
 *    against 1.005 on his live account (on his own bar the two meet at 1.987) — because a band plan the stop
 *    rules passed over may still be the most efficient thing in the band. That is a true answer to his
 *    question and not the old one: the row is now a plan the bar *could* have offered, and the five stop
 *    rules are what did not pick it. Asserting it against the stops would be asserting the bar has no
 *    efficient plan it declines to name, which is not a property of the bar and would fail on those three.
 */
describe('the reference table names only plans the bar may offer', () => {
  for (const scenario of scenarios) {
    test(
      scenario.label,
      () => {
        const planned = ((): CampaignPlan | string => {
          try {
            return planCampaign({
              request: scenario.request,
              marchTarget: HORIZON,
              budgetMs: CAMPAIGN.budgets.plan,
              ...CAMPAIGN.planFixes,
              putBack: CAMPAIGN.putBack,
              // The band the stops are drawn from, as the engine kept it — the set this criterion is about.
              withTrade: true,
            });
          } catch (error) {
            return error instanceof Error ? error.message : String(error);
          }
        })();
        if (typeof planned === 'string') {
          expect(scenario.pinned?.refuses ?? false, `unexpected refusal: ${planned}`).toBe(true);
          return;
        }
        const plan = planned;
        const offered: PlanTotals[] = [...(plan.trade ?? []), ...plan.alternatives];
        expect(offered.length, 'the plan kept no offerable plan at all').toBeGreaterThan(0);
        expect(plan.curve.length, 'the reference table is empty').toBeGreaterThan(0);

        // Every row, on the pair it prints. A bucket keeps the *most* damage found at its silver level, so
        // the row is one plan's campaign and not a mixture of two — which is what makes this checkable at all.
        const strays = plan.curve.filter(
          (point) => !offered.some((row) => row.silver === point.silver && row.totalDamage === point.damage),
        );
        expect(
          strays.map((point) => `${point.silver} silver / ${point.damage} damage`).join('; '),
          'the reference table names a plan the bar could not offer',
        ).toBe('');

        // The peak of the table is the best damage a silver of the offered set — see the note above on why
        // this is not read against the stops.
        const peak = Math.max(...plan.curve.map((point) => point.damagePerSilver));
        const best = Math.max(...offered.map((row) => row.damagePerSilver));
        expect(peak, 'the table beats every plan the bar may offer on damage a silver').toBeLessThanOrEqual(
          best + 1e-9,
        );

        // And **every stop has a row at its own silver level**: the stops are in the set the table is
        // bucketed over, so the level a player is standing on is a line of the table under him. It is the
        // level and not the figures — a bucket prints the hardest-hitting plan at it, which on his own bar is
        // the `all-in` standing where the sweet spot and the steady max also land. The bucket is the engine's
        // own (1.2× from 10 000 silver, `bucketOf` in `plan.ts`), redrawn here so the assertion reads the
        // same axis; a campaign under 10 000 silver is left out of the table, and no stop on these armies is.
        const bucketOf = (silver: number): number =>
          Math.min(59, Math.max(0, Math.round(Math.log(silver / 10_000) / Math.log(1.2))));
        const levels = new Set(plan.curve.map((point) => bucketOf(point.silver)));
        for (const stop of plan.alternatives) {
          if (stop.silver <= 10_000) continue;
          expect(
            levels.has(bucketOf(stop.silver)),
            `the ${stop.pick} stop at ${stop.silver} silver has no row of the table at its own level`,
          ).toBe(true);
        }
      },
      300_000,
    );
  }
});
