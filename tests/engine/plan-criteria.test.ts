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
import { GROUPS, getUnits } from '@/data';
import { emptyTotals, planCampaign, planMarch } from '@/engine';
import type { CampaignPlan, PlanRow, PlanTotals } from '@/engine/plan';
import { chunks } from '@/engine/recovery';
import type { StackRequest, UnitDef } from '@/engine/types';
import { parseImport } from '@/share/exportImport';
import { buildPlanRequest } from '@/state/derive';

import { HORIZON, criteriaScenarios } from './plan-scenarios';
import { countsKey, rareStockOf, repeatsOf, shelteredRivals } from './plan-yardsticks';

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
 * steady max's repeat (`plan.ts`).
 *
 * **Every pool but `leadership`** (S-96, 2026-09-19): the dominance pool's monsters are hired stock exactly as
 * the authority pool's mercenaries are, burned a chunk of ten at a time and pooled into the same `mercLost`.
 * It read `=== 'authority'` until then, which named the same set on every army this file held before the
 * monster camp: none of them owns a dominance unit.
 */
const hiredOf = (counts: Record<string, number>): number =>
  Object.entries(counts).reduce(
    (sum, [id, count]) =>
      getUnits().find((unit) => unit.id === id)?.pool !== 'leadership' ? sum + count : sum,
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
    // **Measured again 2026-09-19 (S-94), and NOT re-based** (owner, the same day: *"the benchmark is like
    // non-regression tests. A given scenario should not be worse, or it's a discrepancy, or a new baseline
    // needs to be registered by me if the trade is ok."*). Every figure here is now the march's **worst
    // opening** where it was the midpoint of the two openings (`marchOf`). On this army the bar does not move
    // at all — the same four stops at the same 3 · 5 · 6 · 6 burned, the same counts — so every figure falls
    // by exactly the half-strike the army-first journal used to add and by nothing else: sweet 1.2211 →
    // **1.1830** a silver and 373 524 → **361 842** a hired, its campaign 7 521 725 → **7 346 498** for the
    // same 6 089 100 silver; the steady max 2 006 473 → **1 948 064** a march at 1.3119 → **1.2737**; the
    // plan 7 868 855 → **7 693 628**. `leastPerHired` is unmoved at 440 274 — the silver saver's three-burn
    // ladder is the one march on this bar whose opening stack takes the same strike either way.
    //
    // The floors below are left at the figures they were registered at, so **six of the eight now fail**.
    // The measured set is in `tests/engine/plan-baseline.proposed.json` for the owner to register.
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
      // The plan prices a march exactly as the recap will: its own figure for the sweet spot is the battle's
      // **worst opening** since 2026-09-19 (S-94 — the owner will not spend on a coin flip; `marchOf`). The
      // criterion that holds this on every army is "the bar's damage is the recap's worst opening" below;
      // this line stays where it is because this test is the one that walks his own account end to end.
      expect(plan.recommend?.repeat.damage).toBe(
        planMarch(input.request, plan.recommend?.counts ?? {}).summary.minDamage,
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
      // **Re-based 2026-09-19 (S-94): the plan is ranked, priced and printed on the worst opening** — the
      // enemy-first journal, the recap's own "Worst opening" — and no longer on the midpoint of the two
      // openings the coin decides (`marchOf`; the owner: *"it's too risky for me to spend 3M silver on a coin
      // flip"*). This account's bar moves **4 → 5 stops** and left along the burn: 7 · 10 · 12 · 14 · 26
      // where it was 11 · 12 · 13 · 27. A **silver saver** is offered again at the 7-burn rung — 3 583 107 a
      // march for 1 851 500 silver, **511 872** a hired unit, which is what `leastPerHired` now holds — and
      // the knee follows it from the 11 to the **10**: sweet spot 4 870 455 a march for 2 614 000, so
      // **1.8632** a silver (was 1.9459) and **487 046** a hired (was 484 597, a floor that rises), campaign
      // **20 079 262** for 10 581 400 (was 21 662 734 for 10 957 600).
      //
      // Two floors **rise** and they are the interesting ones: the steady max climbs a rung, 13 → 14 burned,
      // for **5 913 067** a march at **2.1585** a silver against 5 864 482 at 2.1408 — more *reliable* damage
      // than the old bar's best march, for the same silver a unit. The plan's own campaign is 22 770 620
      // against 23 264 491, which is the same campaign read honestly: the marches it sums are worth
      // 22 770 620 on the bad flip and were being sold at 23 264 491. Measured gap on every stop:
      // `tools/theorycraft/out/109-reliable-damage.md` §A.
      //
      // **Not re-based** (owner, 2026-09-19: a new baseline is registered by him, not by us). The floors
      // stay at the figures registered on the midpoint reading, so **four of the eight now fail** —
      // `leastPerHired` 521 449 against 511 872, `sweetPerSilver` 1.9459 against 1.8632,
      // `sweetCampaignDamage` 21 662 734 against 20 079 262, `campaignDamage` 23 264 491 against 22 770 620,
      // and `sweetCampaignSilverCeiling` is the one that now *passes with room* (10 581 400 under
      // 10 957 600). Two floors would **rise** if he registers them: `sweetPerHired` 484 597 → 487 046 and
      // the steady max 5 864 482 → **5 913 067** a march at 2.1408 → **2.1585** a silver, which is more
      // reliable damage than the old bar's best march for the same silver a unit.
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
      // 21 600 000 → **20 000 000** on 2026-09-19 (S-94): the campaign is the sum of its marches' **worst
      // openings** now, and the knee moved from the 11-burn rung to the 10 with the reliable reading —
      // 20 079 262 over four marches. The figure is lower because it is the one the player is guaranteed,
      // not because the plan got worse: the same bar's steady max hits harder on this reading than the old
      // bar's did (5 913 067 against 5 864 482). **The threshold is left at 21 600 000 and therefore fails**,
      // for the owner to register with the rest (2026-09-19).
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
      // **Re-based 2026-09-19 (S-93), the tighter shape.** Every rung of the burn ladder is now re-sized by
      // the sizer over each **prefix** of the troop ranking and takes the result when it is behind on none of
      // damage, silver, the stock burned and the training queue. On this army that is the whole ladder: the
      // rungs move down the burn axis (the same marches for fewer chunks) and the bar becomes
      // 9 · 10 · 13 · 17 · 19 burned, **4 → 5 stops** — a **silver saver** at 5 812 728 for 3 734 200 and
      // 10d 10h (645 859 a hired unit, where the floor below was measured on other armies).
      //
      // Three floors fall and one rises, all from one move: the knee of damage against burn now lands on the
      // **10**-burn rung instead of the 17, because the thrift end of the ladder got better and tilted the
      // chord. The sweet spot is 6 760 346 a march for 4 668 300 — 1.4481 a silver and **676 035** a hired
      // unit against 1.7426 and 481 519, campaign 28 748 251 against 32 231 242. It buys 40 % more damage out
      // of each hired unit for 17 % less damage a march; it is the recommendation moving left along the bar,
      // which is what the owner asked for on 2026-09-19 (*"with full opt I still get 70 mercs even with the
      // sweet spot"*). The steady max is the 17-burn rung the sweet spot used to be — 8 185 823 at **1.7426**
      // a silver against 8 281 474 at 1.5186, so 1.2 % less damage for 15 % more of it a silver, and the
      // Spearman I put-back that row used to carry is gone with it. The plan's own campaign is unmoved at
      // 32 518 195.
      // **Re-based 2026-09-19 (S-94): the worst opening, everywhere** (`marchOf`). The bar loses a stop —
      // **5 → 4** — and it is the `all-in`: on this reading it played 31 308 140 over four marches for
      // 23 696 200 silver and 90 burned against the steady max's 31 546 458 for 18 790 400 and 67, behind on
      // all three figures a stop prints, so the engine no longer offers it (`plan.ts`, and the criterion
      // "no stop of the bar is beaten by another stop of the same bar" holds it). The three rungs left of it
      // shift one place left: silver saver 9 → **8** burned (4 763 589 a march, **595 449** a hired), sweet
      // spot 10 → **9** (6 269 353 for 4 668 300 — **1.3430** a silver and **696 595** a hired, a floor that
      // rises 3 % because the knee moved onto a thriftier rung), more mercs 13 and steady max 17 unmoved in
      // burn at **8 014 627** a march and **1.7061** a silver. The plan's campaign is **31 546 458** where
      // the midpoint reading sold 32 518 195 — the same marches, read on the flip the player actually gets.
      //
      // **Not re-based** (owner, 2026-09-19). The floors stay where they were registered, so **six of the
      // eight now fail**: `leastPerHired` 645 859 against 595 449, `sweetPerSilver` 1.4481 against 1.3430,
      // `sweetCampaignDamage` 28 748 251 against 27 104 076, `mostDamage` 8 185 823 against 8 014 627,
      // `mostPerSilver` 1.7426 against 1.7061 and `campaignDamage` 32 518 195 against 31 546 458. One would
      // **rise**: `sweetPerHired` 676 035 → **696 595**, the knee moving onto a thriftier rung.
      expectCriteria(plan, {
        leastPerHired: under(645_859),
        sweetPerSilver: under(1.4481),
        sweetPerHired: under(676_035),
        sweetCampaignDamage: under(28_748_251),
        sweetCampaignSilverCeiling: over(18_702_500),
        mostDamage: under(8_185_823),
        mostPerSilver: under(1.7426),
        campaignDamage: under(32_518_195),
      });
    }, 120_000);
  },
);

/**
 * The armies every criterion below is held on: the shared list of `plan-scenarios.ts` — the **fifteen** the
 * benchmark itself measures. It is exported from there so that a theorycraft experiment measuring a rule
 * runs on exactly the armies the criteria will judge it on.
 *
 * The same fifteen armies, under the same labels and in the same order, as before S-101 (2026-09-19); what
 * changed is where three of them are declared. The owner's live camp of 2026-09-18 and his camp of
 * 2026-09-19 at both readings of the Battle card used to be appended to this list by hand, because no
 * calculator outside the repo had answered them and so they could not be benchmark scenarios. The replay of
 * 2026-09-19 answered all three, they are benchmark scenarios 13, 14 and 15 now, and the list stopped
 * appending them a second time.
 */
const scenarios = criteriaScenarios();

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
 * **Every hired pool since S-96** (2026-09-19): the stacks read here are `pool !== 'leadership'`, so the
 * dominance pool's monsters are held to the same line as the authority pool's mercenaries. It named the same
 * stacks on every army that predates the monster camp — none of them owns a dominance unit — and on the camp
 * that does, it would have passed **vacuously** while the plan fielded no monster at all, which is why the
 * criterion beside it ("the plan fields the pools the account holds") exists.
 *
 * This holds on **every scenario the benchmark builds** (`plan-scenarios.ts` — the same armies and the same
 * flags, pins and all), over every march the bar can play: each stop's repeated march, its finale, and every
 * march of the `all-in`'s sequence. The stacks are the engine's own (`planMarch` builds exactly what
 * `simulateBattle` is handed), so this is the battle's reading of the march and not a second model of it.
 */
describe('every hired stack stands under the lowest troop stack', () => {
  /**
   * Every march a stop plays: the `all-in`'s own sequence, or the repeated march, the finale and the
   * troops-only tail the horizon leaves over (`PlanTotals.tail`, S-89). The tail fields no hired stack at
   * all, so it passes the shelter below by construction — it is listed so the criterion is stated over the
   * *whole* campaign the bar offers rather than over the part of it that predates the tail.
   */
  const marchesOf = (row: PlanTotals): { counts: Record<string, number>; what: string }[] =>
    row.sequence
      ? row.sequence.map((counts, index) => ({ counts, what: `march ${index + 1} of the sequence` }))
      : [
          { counts: row.counts, what: 'the repeated march' },
          ...(row.finaleCounts ? [{ counts: row.finaleCounts, what: 'the finale' }] : []),
          ...(row.tail ? [{ counts: row.tail.counts, what: 'the troops-only tail' }] : []),
        ];

  /** The hired stacks of one march that are not strictly under the lowest troop stack, as the battle sees it. */
  const exposedIn = (
    request: StackRequest,
    counts: Record<string, number>,
  ): { line: string; floor: number } => {
    const { result } = planMarch(request, counts);
    const troops = result.stacks.filter((stack) => stack.pool === 'leadership');
    // **Every pool but `leadership`** (S-96): the shelter is about what the enemy kills first, and a
    // dominance monster is hired stock exactly as an authority mercenary is. On the ten armies that predate
    // the monster camp this names the same stacks it always did.
    const hired = result.stacks.filter((stack) => stack.pool !== 'leadership');
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

        /**
         * **And every stop plays the whole horizon** (S-89; owner, 2026-09-18, choosing P1 of
         * `tools/theorycraft/out/105-six-proposals.md`).
         *
         * The horizon is the campaign the player is committing to (`CAMPAIGN.marches`), and it is what every
         * row of the bar and every row of the benchmark beside it is measured over. S-76 let a stop whose
         * hired stock ran out first simply stop there — bear ×1's sweet spot was **one** march of a
         * four-march horizon, 4 722 842 against the sizers' four-march 23 974 564 — so the bar was comparing
         * three marches with four and calling the difference a result. Since S-89 the marches left over are
         * played on troops alone, by the `all-in` inside its own sequence and by every repeated stop as its
         * `tail`, and this holds it: the plan's own campaign and every stop on the bar reach the horizon.
         *
         * **The one army it could not hold on** is one with no troop type at all to size that march from —
         * `sizer([], 'elite')` comes back with nothing, and a campaign is as short as its stock again. None of
         * the eleven scenarios here is such an army (each is checked below rather than assumed), and an army
         * that fields no troops has no march the plan would offer in the first place: the band's own third
         * criterion refuses anything standing on fewer than two troop stacks.
         */
        const fieldsTroops = Object.keys(plan.march.counts).some(
          (id) => scenario.request.units.find((unit) => unit.id === id)?.pool === 'leadership',
        );
        expect(fieldsTroops, 'the plan fields no troop type, so it can size no troops-only march').toBe(true);
        for (const { what, row } of rows) {
          expect(row.marches, `${what} plays ${String(row.marches)} of ${String(HORIZON)} marches`).toBe(
            HORIZON,
          );
        }
      },
      300_000,
    );
  }
});

/**
 * **The plan fields the pools the account holds** (S-96; the owner, 2026-09-19: *"fix why the monsters are
 * not shielded in the generated stack"*).
 *
 * The question he asked was about the shelter, and the answer was that there was nothing to shelter: on a
 * camp that has unlocked the monster tiers the Battle card's sizers field a stack for every monster type it
 * holds — **17 to 21** of them on the 20 000-dominance reading — and the plan fielded **none**. `mercTypes`,
 * `unlimited`, the sizer's unit filter, the three `shelterUnder` call sites and `marchOf`'s billing were each
 * typed to `pool === 'authority'`, so a dominance unit was dropped before any rule could reach it
 * (`tools/theorycraft/out/110-monster-shelter.md`). The shelter criterion above therefore **passed
 * vacuously** on such a camp: a march with no monster in it has no monster standing over the troops. This is
 * the criterion that does not.
 *
 * Four things, on every army this file builds:
 *
 *  1. **the pools the army holds are the pools the plan fields** — an account with a dominance pool and
 *     monster types in its window has at least one monster stack on every stop's repeated march, and the same
 *     for the authority pool it always had. This is the half that **fails on HEAD** (e2b8d3e), on all three
 *     stops of the monster camp at once:
 *
 *     ```
 *     sweet-spot fields no dominance stack (the army holds 12 types, housing 900)
 *     steady-max fields no dominance stack (the army holds 12 types, housing 900)
 *     all-in     fields no dominance stack (the army holds 12 types, housing 900)
 *     ```
 *  2. **the burn counts them** — a stop's `repeat.mercLost` is exactly the chunks of ten its march loses over
 *     **every** non-leadership stack it fields, monsters and mercenaries together. The bar is ordered by that
 *     one figure, so a pool billed as a troop retrain would ride the whole bar for free;
 *  3. **every stack of a hired pool is sheltered** — restated here over `pool !== 'leadership'` for the one
 *     army where it is not vacuous, and so that a widening of the hired set without a widening of the shelter
 *     is caught by the criterion that names the pools rather than by the one that names the mercenaries;
 *  4. **the march fits the housing** — a march asking for more of a pool than the camp has room for is not a
 *     march the player can send. Measured 2026-09-19 before the check went into the engine (`fitsHousing`,
 *     `plan.ts`): with each of a dozen uncapped monster types bounded by the *whole* dominance pool, the
 *     ladder shapes proposed marches needing **4 693 to 10 739** dominance against this camp's 900, five to
 *     twelve times the room it has.
 */
describe('the plan fields the pools the account holds', () => {
  /** Every march a stop plays — the same reading the shelter criterion above makes. */
  const marchesOf = (row: PlanTotals): { counts: Record<string, number>; what: string }[] =>
    row.sequence
      ? row.sequence.map((counts, index) => ({ counts, what: `march ${index + 1} of the sequence` }))
      : [
          { counts: row.counts, what: 'the repeated march' },
          ...(row.finaleCounts ? [{ counts: row.finaleCounts, what: 'the finale' }] : []),
          ...(row.tail ? [{ counts: row.tail.counts, what: 'the troops-only tail' }] : []),
        ];

  for (const scenario of scenarios) {
    test(
      scenario.label,
      () => {
        const planned = planFor(scenario.request);
        if (typeof planned === 'string') {
          expect(scenario.pinned?.refuses ?? false, `unexpected refusal: ${planned}`).toBe(true);
          return;
        }
        const plan = planned;
        const byId = new Map(scenario.request.units.map((unit) => [unit.id, unit]));
        /** The hired pools this army actually holds: room in the pool **and** a type to put in it. */
        const held = (['authority', 'dominance'] as const).filter(
          (pool) =>
            scenario.request.housing[pool] > 0 && scenario.request.units.some((unit) => unit.pool === pool),
        );
        const failures: string[] = [];
        for (const row of plan.alternatives) {
          // 1. the pools the army holds are the pools the stop fields, on the march it repeats (or, for the
          // `all-in`, on the first march of its sequence — the one `repeat` prices and the bar draws).
          const first = row.sequence?.[0] ?? row.counts;
          for (const pool of held) {
            const fielded = Object.entries(first).filter(
              ([id, count]) => count > 0 && byId.get(id)?.pool === pool,
            );
            if (fielded.length === 0) {
              failures.push(
                `${row.pick} fields no ${pool} stack (the army holds ` +
                  `${String(scenario.request.units.filter((unit) => unit.pool === pool).length)} types, ` +
                  `housing ${scenario.request.housing[pool].toLocaleString('en-US')})`,
              );
            }
          }
          // 2. the burn is the chunks of every hired stack, whatever pool paid for it.
          if (!row.sequence) {
            const burn = Object.entries(row.counts).reduce(
              (sum, [id, count]) =>
                count > 0 && (byId.get(id)?.pool ?? 'leadership') !== 'leadership'
                  ? sum + chunks(count)
                  : sum,
              0,
            );
            if (row.repeat.mercLost !== burn) {
              failures.push(
                `${row.pick} burns ${String(row.repeat.mercLost)} where its march loses ${String(burn)} ` +
                  'chunks of hired stock',
              );
            }
          }
          for (const march of marchesOf(row)) {
            const { result } = planMarch(scenario.request, march.counts);
            // 3. every hired stack of every hired pool, under the lowest troop stack.
            const troops = result.stacks.filter((stack) => stack.pool === 'leadership');
            const hired = result.stacks.filter((stack) => stack.pool !== 'leadership');
            if (troops.length > 0 && hired.length > 0) {
              const floor = Math.min(...troops.map((stack) => stack.totalHp));
              for (const stack of hired.filter((stack) => stack.totalHp >= floor)) {
                failures.push(
                  `${row.pick}, ${march.what}: ${stack.unitId} ${String(stack.count)} = ` +
                    `${Math.round(stack.totalHp).toLocaleString('en-US')} HP (${stack.pool}) at or above the ` +
                    `lowest troop stack (${Math.round(floor).toLocaleString('en-US')} HP)`,
                );
              }
            }
            // 4. and the march fits the housing, pool by pool.
            for (const pool of ['leadership', 'authority', 'dominance'] as const) {
              const used = result.stacks
                .filter((stack) => stack.pool === pool)
                .reduce((sum, stack) => sum + stack.count * (byId.get(stack.unitId)?.cost ?? 0), 0);
              if (used > scenario.request.housing[pool]) {
                failures.push(
                  `${row.pick}, ${march.what}: ${used.toLocaleString('en-US')} ${pool} used of ` +
                    `${scenario.request.housing[pool].toLocaleString('en-US')} the camp holds`,
                );
              }
            }
          }
        }
        expect(
          failures.join('\n'),
          `the plan does not field the pools the account holds\n${failures.join('\n')}`,
        ).toBe('');
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
        /**
         * **A band plan priced as it would be offered** (S-89). `trade` is the band as the *search* priced
         * it, pre-tail; the table under the bar prices every plan the way it would be priced if it were
         * picked, the troops-only tail included (`plan.ts`, `offered`). So the set this criterion compares
         * the table against is tailed here too — otherwise the table would be "naming a plan the bar could
         * not offer" for the one reason it must: it is offering it.
         *
         * The tail is read off the bar rather than re-derived: it is the same march for every stop of a
         * plan, so any stop that carries one carries *the* one. And the two go together — measured over
         * every scenario here, 2026-09-18: a `trade` row short of the horizon and a stop with a tail appear
         * on exactly the same three armies (the bear stocks of 1, 2 and 3), and on the other eight every
         * band plan already plays all four marches. That pairing is asserted below rather than assumed.
         */
        const tail = plan.alternatives.find((row) => row.tail)?.tail;
        const asOffered = (row: PlanTotals): PlanTotals => {
          const left = HORIZON - row.marches;
          if (!tail || left <= 0) return row;
          const totalDamage = row.totalDamage + left * tail.damage;
          const silver = row.silver + left * tail.silver;
          return {
            ...row,
            totalDamage,
            silver,
            seconds: row.seconds + left * tail.seconds,
            marches: HORIZON,
            damagePerSilver: silver > 0 ? totalDamage / silver : Infinity,
            damagePerMercenary: row.mercLost > 0 ? totalDamage / row.mercLost : Infinity,
          };
        };
        const short = (plan.trade ?? []).filter((row) => row.marches < HORIZON);
        expect(
          short.length > 0,
          'a band plan short of the horizon and a stop with a tail must go together',
        ).toBe(tail !== undefined);
        const offered: PlanTotals[] = [...(plan.trade ?? []).map(asOffered), ...plan.alternatives];
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

/**
 * **The bar agrees with the recap** (S-90; the owner, 2026-09-18, choosing the fix for the bug experiment
 * 105's validator found).
 *
 * A stop prints three prices for a campaign — silver, gold and the training queue — and every one of them
 * has to be the sum of what the game will charge for the marches the stop actually plays. The player can
 * check it: he clicks a stop, the March section draws its march and the recap under it prints that march's
 * own recovery (`marchResult` → `recoveryCosts`, the same figures `simulateBattle` hands the app). A campaign
 * total that is not the sum of those is a number with nothing behind it.
 *
 * **Gold was such a number.** `PlanTotals.gold` was `repeats × the repeated march's gold`, with the finale
 * left out — while `silver` and `seconds` beside it summed `repeats × the march + the finale` — so the last
 * march of every repeated plan, the one that spends what the stock has left and therefore fields the *most*
 * hired units of the whole campaign, was revived for free on the bar. Measured here on HEAD before the fix
 * (the same run this criterion makes, stop by stop): the evening account's silver saver printed **1 944**
 * gold against 3 192, its sweet spot 2 712 against 3 960; the 12 000 export's silver saver 2 280 against
 * 3 464 (Δ 1 184, the worst of the eleven armies); his live camp 5 616 against 6 152 at the sweet spot; and
 * the plan's own campaign was short on every army that plays a finale. Silver and the queue were already
 * exact everywhere, on every stop of every scenario — which is what said the arithmetic was right and one
 * line of it was missing.
 *
 * Held on the same armies as the shelter above: the benchmark's own scenarios, the owner's export where it
 * is, and his live camp of 2026-09-18. Over every march the bar offers — the repeats, the finale, the
 * troops-only tail (which revives nothing, and so must add nothing) and every march of the `all-in`'s
 * sequence.
 */
/**
 * The recap prices a march under the account's own recovery settings — temple level, training cost
 * reductions, training speed — and the bar's campaign has to be that pricing summed. Every profile in
 * the repo has temple 0 and no reductions, so a total that read one march off the search's raw pricing
 * agreed with the recap to the unit here and would not on the first account with a discount (S-91,
 * 2026-09-18: the finale's silver). So the criterion runs twice: as the accounts are, and under a temple
 * and discounts every group, which is the reading that tells the two pricings apart.
 */
const WITH_DISCOUNTS = (request: StackRequest): StackRequest => ({
  ...request,
  recovery: {
    ...request.recovery,
    templeLevel: 20,
    trainingCostReduction: Object.fromEntries(GROUPS.map((group) => [group, 25])),
    trainingSpeed: Object.fromEntries(GROUPS.map((group) => [group, 30])),
  },
});

const campaignIsItsMarchesSum = (title: string, variant: (request: StackRequest) => StackRequest): unknown =>
  describe(title, () => {
    /** The marches a stop plays, first to last, the way `PlanTotals` says to read them. */
    const marchesOf = (row: PlanTotals): Record<string, number>[] => {
      if (row.sequence) return row.sequence;
      const tail = row.tail?.marches ?? 0;
      const repeats = row.marches - (row.finaleCounts ? 1 : 0) - tail;
      const marches = Array.from({ length: repeats }, () => row.counts);
      if (row.finaleCounts) marches.push(row.finaleCounts);
      for (let index = 0; index < tail; index += 1) marches.push(row.tail?.counts ?? {});
      return marches;
    };

    for (const scenario of scenarios) {
      const request = variant(scenario.request);
      test(
        scenario.label,
        () => {
          const planned = ((): CampaignPlan | string => {
            try {
              return planCampaign({
                request,
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
            expect(scenario.pinned?.refuses ?? false, `unexpected refusal: ${planned}`).toBe(true);
            return;
          }
          const plan = planned;
          const rows: { what: string; row: PlanTotals }[] = [
            ...plan.alternatives.map((row) => ({ what: `stop ${row.pick}`, row: row as PlanTotals })),
            { what: 'the plan itself', row: plan as PlanTotals },
          ];
          const failures: string[] = [];
          for (const { what, row } of rows) {
            const marches = marchesOf(row);
            if (marches.length !== row.marches) {
              failures.push(
                `${what}: ${String(marches.length)} marches to price, ${String(row.marches)} played`,
              );
              continue;
            }
            // **Dragon coins ride with the other three since S-96**: the recap prices them
            // (`BattleSummary.recovery.dragonCoins`) and the dominance pool charges them, so a campaign that
            // fields monsters has a fourth price the bar has to add up the same way. Nought on every army
            // that holds none, which is the ten that predate the monster camp.
            const sum = { silver: 0, gold: 0, dragonCoins: 0, seconds: 0 };
            for (const counts of marches) {
              const { recovery } = planMarch(request, counts).summary;
              sum.silver += recovery.silver;
              sum.gold += recovery.gold;
              sum.dragonCoins += recovery.dragonCoins;
              sum.seconds += recovery.seconds;
            }
            for (const key of ['silver', 'gold', 'dragonCoins', 'seconds'] as const) {
              if (row[key] !== sum[key]) {
                failures.push(
                  `${what}: ${key} ${row[key].toLocaleString('en-US')} against the recap's ` +
                    `${sum[key].toLocaleString('en-US')} over ${String(marches.length)} marches ` +
                    `(Δ ${(sum[key] - row[key]).toLocaleString('en-US')})`,
                );
              }
            }
            // **And the rare stock adds up the same way** (S-98, 2026-09-19; the owner: *"at least the
            // same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*). The benchmark and
            // the registered baseline now print the chunks of ten told apart — the hired **soldiers** and
            // the **monsters**, monster mercenaries and dominance monsters together (`isMonsterUnit`) —
            // and a split is only a reading of the bar's own burn if the two halves come back to it. So:
            // the split over the marches the stop plays is exactly `mercLost`, the one axis the search is
            // ordered by, on every stop of every army; and the coins the same split prices are the recap's
            // `dragonCoins`, which is what ties the shared definition to `recoveryCosts`.
            const rare = marches.reduce<{
              soldiersLost: number;
              monstersLost: number;
              dragonCoins: number;
            }>(
              (into, counts) => {
                const one = rareStockOf(request.units, counts);
                return {
                  soldiersLost: into.soldiersLost + one.soldiersLost,
                  monstersLost: into.monstersLost + one.monstersLost,
                  dragonCoins: into.dragonCoins + one.dragonCoins,
                };
              },
              { soldiersLost: 0, monstersLost: 0, dragonCoins: 0 },
            );
            if (rare.soldiersLost + rare.monstersLost !== row.mercLost) {
              failures.push(
                `${what}: ${rare.soldiersLost.toLocaleString('en-US')} soldier chunks + ` +
                  `${rare.monstersLost.toLocaleString('en-US')} monster chunks against the bar's ` +
                  `${row.mercLost.toLocaleString('en-US')} burned`,
              );
            }
            if (rare.dragonCoins !== sum.dragonCoins) {
              failures.push(
                `${what}: the split prices ${rare.dragonCoins.toLocaleString('en-US')} dragon coins ` +
                  `against the recap's ${sum.dragonCoins.toLocaleString('en-US')}`,
              );
            }
            // And the repeated march's own three prices are the recap's, which is what makes the sum above
            // readable as `played × repeat + the finale` on the bar itself.
            if (row.sequence) continue;
            const { recovery } = planMarch(request, row.counts).summary;
            for (const key of ['silver', 'gold', 'dragonCoins', 'seconds'] as const) {
              if ((row.repeat[key] ?? 0) !== recovery[key]) {
                failures.push(
                  `${what}: repeat ${key} ${(row.repeat[key] ?? 0).toLocaleString('en-US')} against the recap's ` +
                    `${recovery[key].toLocaleString('en-US')}`,
                );
              }
            }
          }
          expect(failures.join('\n'), `the bar disagrees with the recap\n${failures.join('\n')}`).toBe('');
        },
        300_000,
      );
    }
  });

campaignIsItsMarchesSum('a stop’s campaign is the sum of what its marches cost', (request) => request);
campaignIsItsMarchesSum(
  'a stop’s campaign is the sum of what its marches cost — under a temple and training discounts',
  WITH_DISCOUNTS,
);

/**
 * **The bar's damage is the recap's worst opening** (S-94; the owner, 2026-09-19: *"average damage is not
 * average for sure; it's too risky for me to spend 3M silver on a coin flip to get 1M damage or 3M. We want
 * reliable damage actually."*).
 *
 * The game decides who opens the fight, 50/50, so a march has two damage figures and no third: the
 * enemy-first journal (`minDamage`, the recap's **Worst opening**) and the army-first one (`maxDamage`).
 * `avgDamage` is their midpoint — a number no single fight ever pays out — and until 2026-09-19 it was what
 * the plan ranked, priced and printed. The plan now stands on the bad flip: every figure the bar carries is
 * the enemy-first journal's, so a stop's damage is the least the player is ever handed rather than the
 * average of a coin toss he cannot influence.
 *
 * Two things, on every army this file builds, and both against `planMarch` — the recap's own arithmetic, not
 * a second model of it:
 *
 *  - every stop's **repeated march** prices at exactly the recap's `minDamage` on its own counts;
 *  - every stop's **campaign** is the sum of its marches' `minDamage` — the repeats, the finale and the
 *    troops-only tail, or the `all-in`'s sequence — to the unit, and so is the plan's own campaign.
 *
 * **Measured on HEAD (f0d2759) before the switch**, which is what it is for: it failed on all thirteen
 * armies, every stop of every one of them, by the half-strike the army-first journal inserts. The owner's
 * export at 7 000 read `sweet-spot: repeat 5 330 563 against the recap's worst opening 5 230 687 (Δ 99 876)`
 * and `campaign 21 662 734 against 21 363 106 (Δ 299 628)`; the widest repeat was his live camp's
 * `sweet-spot`, `3 060 838 against 2 777 322 (Δ 283 516)` — 9.3 % of the figure the bar printed — and the
 * widest campaign the same camp's `all-in`, `13 841 084 against 11 815 339 (Δ 2 025 745)`
 * (`tools/theorycraft/out/109-reliable-damage.md` §A has the gap on every stop of every army).
 */
describe('the bar’s damage is the recap’s worst opening', () => {
  /** The marches a stop plays, first to last — the same reading `campaignIsItsMarchesSum` makes. */
  const marchesOf = (row: PlanTotals): Record<string, number>[] => {
    if (row.sequence) return row.sequence;
    const tail = row.tail?.marches ?? 0;
    const repeats = row.marches - (row.finaleCounts ? 1 : 0) - tail;
    const marches = Array.from({ length: repeats }, () => row.counts);
    if (row.finaleCounts) marches.push(row.finaleCounts);
    for (let index = 0; index < tail; index += 1) marches.push(row.tail?.counts ?? {});
    return marches;
  };

  for (const scenario of scenarios) {
    test(
      scenario.label,
      () => {
        const planned = planFor(scenario.request);
        if (typeof planned === 'string') {
          expect(scenario.pinned?.refuses ?? false, `unexpected refusal: ${planned}`).toBe(true);
          return;
        }
        const plan = planned;
        const failures: string[] = [];
        const rows: { what: string; row: PlanTotals }[] = [
          ...plan.alternatives.map((row) => ({ what: `stop ${row.pick}`, row: row as PlanTotals })),
          { what: 'the plan itself', row: plan as PlanTotals },
        ];
        for (const { what, row } of rows) {
          if (!row.sequence) {
            const { minDamage } = planMarch(scenario.request, row.counts).summary;
            if (row.repeat.damage !== minDamage) {
              failures.push(
                `${what}: repeat ${row.repeat.damage.toLocaleString('en-US')} against the recap's worst ` +
                  `opening ${minDamage.toLocaleString('en-US')} ` +
                  `(Δ ${(row.repeat.damage - minDamage).toLocaleString('en-US')})`,
              );
            }
          }
          const sum = marchesOf(row).reduce(
            (total, counts) => total + planMarch(scenario.request, counts).summary.minDamage,
            0,
          );
          if (row.totalDamage !== sum) {
            failures.push(
              `${what}: campaign ${row.totalDamage.toLocaleString('en-US')} against the recap's ` +
                `${sum.toLocaleString('en-US')} over ${String(row.marches)} marches ` +
                `(Δ ${(row.totalDamage - sum).toLocaleString('en-US')})`,
            );
          }
        }
        expect(failures.join('\n'), `the bar is not on the worst opening\n${failures.join('\n')}`).toBe('');
      },
      300_000,
    );
  }
});

/** The plan every criterion below reads, or the refusal message the benchmark pins. */
const planFor = (request: StackRequest): CampaignPlan | string => {
  try {
    return planCampaign({
      request,
      marchTarget: HORIZON,
      budgetMs: CAMPAIGN.budgets.plan,
      ...CAMPAIGN.planFixes,
      putBack: CAMPAIGN.putBack,
      withTrade: true,
      withFrontier: true,
    });
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
};

/**
 * **No stop is beaten on every reading by a sheltered march the account can field** (S-93; the owner,
 * 2026-09-19: *"using Troops first I can get 2 009 810 … by adding back troops, impossible with Complete
 * optimization … I thought we had tests for this"*).
 *
 * The bar runs along the hired units a march burns, and a stop's whole claim is that it is the best march at
 * that price. A march that does **at least as much damage for no more silver, no more of the hired stock and
 * no longer in the barracks** — with one of those strictly better — is that stop's own answer done better:
 * whatever rule picked the stop passed over a plan the player can field by hand, which is exactly what he
 * did. The four readings are the four the bar and the recap print, and they are the repeated march's own.
 *
 * The rivals are `shelteredRivals` above, plus the plans the search itself summarised (`withFrontier`),
 * priced by their own `repeat` and filtered by the same two rules.
 */
describe('no stop is beaten on every reading by a sheltered march the account can field', () => {
  for (const scenario of scenarios) {
    test(
      scenario.label,
      () => {
        const planned = planFor(scenario.request);
        if (typeof planned === 'string') {
          expect(scenario.pinned?.refuses ?? false, `unexpected refusal: ${planned}`).toBe(true);
          return;
        }
        const plan = planned;
        const hiredIds = scenario.request.units
          .filter((unit) => unit.pool === 'authority')
          .map((unit) => unit.id);
        const rivals = shelteredRivals(scenario.request);
        for (const row of plan.frontier ?? []) {
          // Only the plans the bar may **offer**: a row the frontier dominated has a worse campaign behind
          // the same repeated march (the two are judged on different figures — the campaign's damage and
          // silver against the repeat's), and the band's own three refusals apply to a rival as to a stop.
          if (!row.undominated || !row.inBand) continue;
          const troopStacks = Object.entries(row.counts).filter(
            ([id, count]) => count > 0 && !hiredIds.includes(id),
          ).length;
          if (troopStacks < 2) continue;
          if (!hiredIds.every((id) => (row.counts[id] ?? 0) > 0)) continue;
          rivals.push({
            repeats: repeatsOf(row),
            what: `the frontier’s ${row.label}`,
            counts: row.counts,
            damage: row.repeat.damage,
            silver: row.repeat.silver,
            burn: row.repeat.mercLost,
            hired: hiredOf(row.counts),
            seconds: row.repeat.seconds,
            key: countsKey(row.counts),
          });
        }
        const failures: string[] = [];
        for (const stop of plan.alternatives) {
          const mine = countsKey(stop.counts);
          const repeats = repeatsOf(stop);
          /**
           * **The `all-in` is judged on what it fields**, as it is everywhere else in this file: it is
           * offered because its first march fields more hired units than the steady max's repeat (owner,
           * 2026-09-18: *"a last stop: all mercs possible … fill all the mercs you can safely"*), so a march
           * that spends less of everything by fielding **less** of the stock is not that stop's answer done
           * better — it is a different question. A march that fields as much and costs less is. Measured on
           * the owner's export at 7 000, 2026-09-19: the `all-in` stands 254 hired under two rungs, and the
           * sizer over five of his seven troop types fields 161 for more damage and half the queue — fewer
           * of the stock, so not a rival here; on the e2e seed both shapes field the whole stock of 83 and
           * the sizer's hit for 8 047 249 against 7 708 571 at a quarter less silver, which is one.
           */
          const fields = (counts: Record<string, number>): number =>
            hiredIds.reduce((sum, id) => sum + (counts[id] ?? 0), 0);
          const mustField = stop.pick === 'all-in' ? fields(stop.counts) : 0;
          for (const rival of rivals) {
            if (rival.key === mine) continue;
            if (rival.repeats < repeats) continue;
            if (fields(rival.counts) < mustField) continue;
            const better =
              rival.damage >= stop.repeat.damage &&
              rival.silver <= stop.repeat.silver &&
              rival.burn <= stop.repeat.mercLost &&
              rival.seconds <= stop.repeat.seconds &&
              (rival.damage > stop.repeat.damage ||
                rival.silver < stop.repeat.silver ||
                rival.burn < stop.repeat.mercLost ||
                rival.seconds < stop.repeat.seconds);
            if (!better) continue;
            failures.push(
              `${stop.pick} (${stop.repeat.damage.toLocaleString('en-US')} damage, ` +
                `${stop.repeat.silver.toLocaleString('en-US')} silver, ${String(stop.repeat.mercLost)} burned, ` +
                `${String(Math.round(stop.repeat.seconds / 3_600))} h) is beaten on every reading by ` +
                `${rival.what} (${Math.round(rival.damage).toLocaleString('en-US')}, ` +
                `${rival.silver.toLocaleString('en-US')}, ${String(rival.burn)}, ` +
                `${String(Math.round(rival.seconds / 3_600))} h)`,
            );
            break;
          }
        }
        expect(failures.join('\n'), `stops beaten on every reading\n${failures.join('\n')}`).toBe('');
      },
      300_000,
    );
  }
});

/**
 * **The thrift end is offered** (S-93; the owner, 2026-09-19: *"no eco silver spot to allow me to maximize
 * silver/dmg with lower silver and training time whilst preserving merc spent low"*).
 *
 * The silver saver's own definition is a plan left of the sweet spot that costs no more silver and is at
 * least as efficient a silver (`leastSilver`, `plan.ts`). Stated over the band alone that is very nearly a
 * tautology — the stop is *chosen* from the band by exactly that test — so it is stated here over the
 * **marches the account can field** (`shelteredRivals`): when one of those stands left of the sweet spot,
 * costs no more silver and is at least as efficient a silver, the bar has to carry a thrift stop that is
 * **no dearer in the stock** than it. A bar whose thriftiest offer burns twice what the player reaches by
 * hand is the complaint in one line.
 */
describe('the thrift end is offered', () => {
  for (const scenario of scenarios) {
    test(
      scenario.label,
      () => {
        const planned = planFor(scenario.request);
        if (typeof planned === 'string') {
          expect(scenario.pinned?.refuses ?? false, `unexpected refusal: ${planned}`).toBe(true);
          return;
        }
        const plan = planned;
        const sweet = plan.alternatives.find((row) => row.pick === 'sweet-spot') as PlanRow;
        expect(sweet).toBeDefined();
        const kneePerSilver = sweet.repeat.damage / sweet.repeat.silver;
        const thrifty = shelteredRivals(scenario.request).filter(
          (rival) =>
            rival.repeats >= repeatsOf(sweet) &&
            rival.burn < sweet.repeat.mercLost &&
            rival.silver <= sweet.repeat.silver &&
            rival.damage / rival.silver >= kneePerSilver,
        );
        if (thrifty.length === 0) return;
        const cheapest = thrifty.reduce((held, rival) => (rival.burn < held.burn ? rival : held));
        const thriftiestStop = plan.alternatives.reduce((held, row) =>
          row.repeat.mercLost < held.repeat.mercLost ? row : held,
        );
        expect(
          thriftiestStop.repeat.mercLost,
          `${cheapest.what} stands left of the sweet spot at ${String(cheapest.burn)} burned — ` +
            `${Math.round(cheapest.damage).toLocaleString('en-US')} damage for ` +
            `${cheapest.silver.toLocaleString('en-US')} silver, ` +
            `${String(Math.round(cheapest.seconds / 3_600))} h — against the sweet spot's ` +
            `${sweet.repeat.damage.toLocaleString('en-US')} for ` +
            `${sweet.repeat.silver.toLocaleString('en-US')} at ${String(sweet.repeat.mercLost)} burned, and ` +
            `the bar's thriftiest stop (${thriftiestStop.pick}) burns ${String(thriftiestStop.repeat.mercLost)}`,
        ).toBeLessThanOrEqual(cheapest.burn);
      },
      300_000,
    );
  }
});

/**
 * **The bar's top rung is not beaten by a sheltered march the account can field at a higher burn** (S-97,
 * 2026-09-19; the owner's own camp, *"Aydae alone"* at 4 975, is where it was found).
 *
 * The bar runs along the hired units a march burns and is read left to right as *"spend less … spend more"*.
 * Its dearest **rung** — the `steady-max`, the top of the burn ladder — claims to be the hardest march the
 * account can repeat. A sheltered march it can field that burns **more** and hits **harder** is therefore a
 * rung the ladder should have carried and a stop the player was never offered: the bar stops short of what
 * the army can do, and no rule downstream can put it back, because the ladder's levels are settled on the
 * marches the search generated.
 *
 * The yardstick is `shelteredRivals` **at the rung's own repeats** — every hired type capped at the largest
 * count that lasts the campaign, so a march the account can send once is not counted against a stop that has
 * to march four times. It is the sizer and the shelter alone, never the plan's search, and every figure is
 * `planMarch`'s, which is the recap's.
 *
 * **Measured on HEAD (7b5e02e), which is what it is for**: it fails on **four** of the fifteen armies —
 * the owner's export at 12 000 (top rung 17 chunks for 8 014 627 against the sizer over five of its troop
 * types, 22 chunks for 8 153 756), his live camp of 2026-09-18 (10 for 3 285 305 against 12 for 3 544 681
 * and 21 for 3 891 819), his camp of 2026-09-19's localStorage dump (5 for 2 423 299 against 10 for
 * 2 793 778 and 18 for 3 976 648) and **Aydae alone at 4 975**, where the ladder tops out at **7** chunks
 * and 3 387 893 a march while six sheltered marches above it reach 3 438 030 to **4 773 281**
 * (`tools/theorycraft/out/111-coverage-and-all-in.md` §A).
 */
/**
 * **The thrift half of the trade is not refused by the band** (S-95; the owner, 2026-09-19, on his camp at
 * 5 100 / 2 200 with 120 hunters: his seven-type march with 25 hunters costs less silver than the bar's
 * recommendation, burns three chunks against five and recovers in 5d 14h against 8d 21h, *"and there is no
 * eco silver spot"*).
 *
 * The bar's four answers are all drawn from the **band** (`candidates`, `plan.ts`), so a family of marches
 * the band refuses is a family no stop rule downstream can ever offer, however well it scores. Until S-95 the
 * band's token-field arm read the *count* of hired units — at least half the winner's fielded hired — and on
 * his camp the winner fields 100, so it asked 50 and put every plan of his own family outside the bar's reach.
 *
 * Stated here over the **marches the account can field** (`shelteredRivals`), on the three readings the bar
 * and the recap print and nothing else: when one of them burns **less** of the stock than the sweet spot,
 * costs **no more silver**, and still does at least **half** the damage of the bar's **steady max**
 * (`BAND_SHARE` below) — the plans the bar draws from have to carry one no dearer in the stock.
 *
 * **The half is the band's fraction, not the band's denominator.** `inBand` measures a march against the
 * plan's own **winner** (`chosenPoint.repeat.damage`), which is not a figure anything outside the engine
 * can read; this criterion is stated over what the bar prints, so it takes the same fraction against the
 * **steady max** — the top rung the bar carries. Measured over the fifteen
 * (`tools/theorycraft/out/112-band-yardstick.md`), the steady max is **never below** the winner: equal on
 * ten of them, and above it on the five where S-97's top-of-the-bar pass reaches past the winner's own burn
 * (the 12 000 export 8 014 627 against 8 153 756, his camp of 2026-09-19 2 792 387 against 2 873 382, his
 * localStorage dump 2 396 472 against 3 976 648, his live camp of 2026-09-18 2 868 384 against 4 358 805,
 * Aydae alone 3 387 893 against 4 773 281). So stating it this way asks for **at least** as much damage as
 * the band's own arm does, never less. It says nothing about which stop is picked:
 * that is the silver saver's business, and experiment 112 §C measures why the silver saver cannot pick his
 * march (of every thrifty sheltered march on all fifteen armies, **not one** is also at least as efficient a
 * silver as the sweet spot once both are read on the worst opening — his own is 1.046 against 1.081).
 *
 * **Measured on HEAD (4c74cfb), which is what it is for**: it fails on **two** of the fifteen armies —
 * his camp of 2026-09-19 at 5 100 / 2 200 (the cheapest such march burns **3** — 1 968 177 for 1 991 000 in
 * 5d 13h — and the plans the bar draws from start at **5**) and his live camp of 2026-09-18 (**7** —
 * 2 230 444 for 1 942 700 in 5d 9h — against **8**). Both pass under the damage yardstick
 * (`tools/theorycraft/out/112-band-yardstick.md` §C).
 */
const BAND_SHARE = 0.5;

describe('the thrift half of the trade is not refused by the band', () => {
  for (const scenario of scenarios) {
    test(
      scenario.label,
      () => {
        const planned = planFor(scenario.request);
        if (typeof planned === 'string') {
          expect(scenario.pinned?.refuses ?? false, `unexpected refusal: ${planned}`).toBe(true);
          return;
        }
        const plan = planned;
        const sweet = plan.alternatives.find((row) => row.pick === 'sweet-spot');
        const most = plan.alternatives.find((row) => row.pick === 'steady-max');
        // An army whose bar has no knee and no top rung has no thrift half to refuse.
        if (!sweet || !most) return;
        const thrifty = shelteredRivals(scenario.request).filter(
          (rival) =>
            rival.repeats >= repeatsOf(sweet) &&
            rival.burn < sweet.repeat.mercLost &&
            rival.silver <= sweet.repeat.silver &&
            rival.damage >= BAND_SHARE * most.repeat.damage,
        );
        if (thrifty.length === 0) return;
        const cheapest = thrifty.reduce((held, rival) => (rival.burn < held.burn ? rival : held));
        /**
         * **The plans the bar draws from**: the band (`withTrade`) and the stops themselves. The two are not
         * the same set — a stop is re-sized after the band is drawn (the put-back and the tighter shape), so
         * a stop's burn can sit under every band row's, which is measured and not hypothetical (his camp at
         * 5 100 / 2 200: band 7, sweet spot 5).
         */
        const reach = Math.min(
          ...[...(plan.trade ?? []), ...plan.alternatives].map((row) => row.repeat.mercLost),
        );
        expect(
          reach,
          `${cheapest.what} burns ${String(cheapest.burn)} — ` +
            `${Math.round(cheapest.damage).toLocaleString('en-US')} damage for ` +
            `${cheapest.silver.toLocaleString('en-US')} silver, ` +
            `${String(Math.round(cheapest.seconds / 3_600))} h — against the sweet spot's ` +
            `${sweet.repeat.damage.toLocaleString('en-US')} for ` +
            `${sweet.repeat.silver.toLocaleString('en-US')} at ${String(sweet.repeat.mercLost)} burned and ` +
            `the steady max's ${most.repeat.damage.toLocaleString('en-US')}, and the thriftiest plan the bar ` +
            `draws from burns ${String(reach)}`,
        ).toBeLessThanOrEqual(cheapest.burn);
      },
      300_000,
    );
  }
});

describe('the bar’s top rung is not beaten by a sheltered march the account can field at a higher burn', () => {
  for (const scenario of scenarios) {
    test(
      scenario.label,
      () => {
        const planned = planFor(scenario.request);
        if (typeof planned === 'string') {
          expect(scenario.pinned?.refuses ?? false, `unexpected refusal: ${planned}`).toBe(true);
          return;
        }
        // The burn ladder's own top. The `all-in` is not a rung of it — it is a *sequence*, offered on what
        // its first march fields rather than on what it burns — so it is neither the top nor a cover for it.
        const rungs = planned.alternatives.filter((row) => row.pick !== 'all-in');
        expect(rungs.length, 'the bar carries a rung').toBeGreaterThan(0);
        const top = rungs.reduce((held, row) => (row.repeat.mercLost > held.repeat.mercLost ? row : held));
        const repeats = repeatsOf(top);
        const failures = shelteredRivals(scenario.request, repeats)
          .filter(
            (rival) =>
              rival.repeats >= repeats &&
              rival.burn > top.repeat.mercLost &&
              rival.damage > top.repeat.damage,
          )
          .map(
            (rival) =>
              `the bar's top rung (${top.pick}, ${top.repeat.damage.toLocaleString('en-US')} damage for ` +
              `${top.repeat.silver.toLocaleString('en-US')} silver at ${String(top.repeat.mercLost)} burned) is ` +
              `beaten by ${rival.what} (${Math.round(rival.damage).toLocaleString('en-US')} for ` +
              `${rival.silver.toLocaleString('en-US')} at ${String(rival.burn)} burned)`,
          );
        expect(failures.join('\n'), `the bar stops short\n${failures.join('\n')}`).toBe('');
      },
      300_000,
    );
  }
});

/**
 * **An `all-in` is offered whenever a sheltered march fields more hired than the steady max and is behind it
 * on neither damage nor silver** (S-97, 2026-09-19).
 *
 * That stop exists for one sentence — *"a last stop: all mercs possible … fill all the mercs you can safely"*
 * (owner, 2026-09-18) — and S-94 gave the engine leave to drop it when a thriftier stop beats it on the
 * campaign's own figures. What the drop must not do is take away an offer the account can plainly make: when
 * the player can put **more** of his stock on the field, hit at least as hard for it and pay **less** silver
 * than the bar's top rung, a bar with no `all-in` on it is a bar that has hidden the one march this stop is
 * for. The honest answer to a stop that is behind is to re-size it at its own hired counts, and to drop it
 * only when nothing at that burn clears the rung beside it (`plan.ts`, the `all-in`'s own builder).
 *
 * **Equal silver is left to the campaign**, and that is a measured line rather than a cautious one. The
 * owner's export at 12 000 can field 178 hired for 8 903 181 a march at the steady max's own 4 697 600 —
 * more of the stock and 11 % more damage for the same silver — and the campaign behind it is *still* behind
 * that stop on damage, silver and the stock at once (31 308 140 for 23 696 200 and 90 burned, against
 * 31 963 845 for 21 035 600 and 82), because the stock it spends in one march is the stock the three behind
 * it do not have. Re-sizing it does not change that (experiment 111 §C), so the bar is right to drop it
 * there, and this criterion says so by asking for a **strictly cheaper** march.
 *
 * **Measured on HEAD (7b5e02e)**: it fails on the owner's live camp of 2026-09-18, where the sizer over five
 * of its troop types fields **96** hired against the steady max's 93 for **3 544 681** a march against
 * 3 285 305 and **2 264 700** silver against 2 635 500 — more of the stock, more damage, 14 % less silver —
 * and the bar carries no `all-in` at all.
 */
describe('an all-in is offered whenever a sheltered march fields more hired than the steady max for less silver', () => {
  for (const scenario of scenarios) {
    test(
      scenario.label,
      () => {
        const planned = planFor(scenario.request);
        if (typeof planned === 'string') {
          expect(scenario.pinned?.refuses ?? false, `unexpected refusal: ${planned}`).toBe(true);
          return;
        }
        if (planned.alternatives.some((row) => row.pick === 'all-in')) return;
        const rungs = planned.alternatives.filter((row) => row.pick !== 'all-in');
        expect(rungs.length, 'the bar carries a rung').toBeGreaterThan(0);
        const top = rungs.reduce((held, row) => (row.repeat.mercLost > held.repeat.mercLost ? row : held));
        const fielded = hiredOf(top.counts);
        const asks = shelteredRivals(scenario.request)
          .filter(
            (rival) =>
              rival.hired > fielded && rival.damage >= top.repeat.damage && rival.silver < top.repeat.silver,
          )
          .map(
            (rival) =>
              `${rival.what} fields ${String(rival.hired)} hired for ` +
              `${Math.round(rival.damage).toLocaleString('en-US')} damage and ` +
              `${rival.silver.toLocaleString('en-US')} silver, against the bar's top rung (${top.pick}) at ` +
              `${String(fielded)} hired, ${top.repeat.damage.toLocaleString('en-US')} and ` +
              `${top.repeat.silver.toLocaleString('en-US')} — and the bar offers no all-in`,
          );
        expect(asks.join('\n'), `an all-in is owed\n${asks.join('\n')}`).toBe('');
      },
      300_000,
    );
  }
});

/**
 * **No stop of the bar is beaten by another stop of the same bar** — on the three figures a stop's campaign
 * prints: damage, silver and the hired units burned for good (owner, 2026-09-18: *"more damage with a lot of
 * merc spent should trigger a failing test as we're using too much of a rare resource"* — and worse than
 * that, a stop that spends **more** of both resources for **less** damage than a stop standing beside it on
 * the same bar).
 *
 * The bar is read left to right as "spend less … spend more", and each stop's claim is that moving right buys
 * something. `expectCriteria` already holds that on the repeated march's damage for the rung stops; this is
 * the campaign's own reading and it speaks about **every** stop, the `all-in` included. That stop is offered
 * on what its first march *fields* and may cost whatever it costs — but a campaign that hits less hard than
 * one beside it for more silver *and* more of the stock is not a dearer offer, it is a worse one, and there
 * is no reading of the bar under which a player would take it.
 *
 * It is stated over `plan.alternatives` alone: no model of the plan, no second search — the rows the app
 * draws, compared with each other.
 *
 * **The engine enforces it since S-94** (2026-09-19): the `all-in` is not offered when a stop beside it burns
 * strictly less of the stock and is behind on neither damage nor silver (`plan.ts`, just before the two
 * efficiencies are read off the bar). It held by construction until the plan moved onto the worst opening,
 * and then stopped holding on two armies — the owner's export at 12 000 (31 308 140 for 23 696 200 and 90
 * burned against the steady max's 31 546 458 for 18 790 400 and 67) and his live camp (11 815 339 for
 * 11 241 300 and 130 against 12 086 359 for 9 849 200 and 37). Both bars are one stop shorter now.
 *
 * **What the three figures cannot see is tempo, and that is where the exceptions are.** The `all-in` is the
 * one stop offered on what its first march **fields** rather than on what it burns (`expectCriteria` above
 * already exempts it from "burning more buys more" for exactly this reason), because on a stock smaller than
 * a chunk two campaigns that burn the same chunks are told apart by nothing else. So a pair holding the
 * `all-in` is judged here only when the `all-in` burns **strictly more** of the stock than the other stop —
 * then it is the dearer offer in the resource that does not come back and has to buy something. Two measured
 * pairs it passes over, both 2026-09-19: a first-run army holding three Bear V, where 3 · 2 · 1 plays
 * 18 750 008 over four marches against the sweet spot's 18 413 408 for the same 32 525 600 silver and the
 * same 3 chunks; and one holding ten, where 10 · 9 · 8 · 7 plays **20 893 375 for 36 013 400** against six
 * bears a march at **20 769 608 for 32 525 600**, both burning the same 4 chunks — 10.7 % more silver for
 * 0.6 % more damage, with the stock spent four times faster. (Experiment 101 §B measured that same shape
 * under the midpoint reading, where it was 40 % more silver for slightly *less* damage; the figures here are
 * this engine's.) Dropping either would take a real offer away to satisfy an arithmetic; this criterion
 * speaks about what the **rungs** do to each other, and about an `all-in` that spends more of the stock for
 * nothing.
 */
describe('no stop of the bar is beaten by another stop of the same bar', () => {
  for (const scenario of scenarios) {
    test(
      scenario.label,
      () => {
        const planned = planFor(scenario.request);
        if (typeof planned === 'string') {
          expect(scenario.pinned?.refuses ?? false, `unexpected refusal: ${planned}`).toBe(true);
          return;
        }
        const failures: string[] = [];
        for (const stop of planned.alternatives) {
          for (const other of planned.alternatives) {
            if (other === stop) continue;
            // The tempo exception (see the note above): a pair holding the `all-in` counts only when the
            // `all-in` burns strictly more of the stock than the other stop. Equal chunks means the same
            // place on the bar's own axis reached at a different speed, which the three figures cannot see.
            if (other.pick === 'all-in' || (stop.pick === 'all-in' && other.mercLost >= stop.mercLost)) {
              continue;
            }
            const beats =
              other.totalDamage >= stop.totalDamage &&
              other.silver <= stop.silver &&
              other.mercLost <= stop.mercLost &&
              (other.totalDamage > stop.totalDamage ||
                other.silver < stop.silver ||
                other.mercLost < stop.mercLost);
            if (!beats) continue;
            failures.push(
              `${stop.pick} (${stop.totalDamage.toLocaleString('en-US')} damage, ` +
                `${stop.silver.toLocaleString('en-US')} silver, ${String(stop.mercLost)} burned) is beaten ` +
                `by ${other.pick} (${other.totalDamage.toLocaleString('en-US')}, ` +
                `${other.silver.toLocaleString('en-US')}, ${String(other.mercLost)})`,
            );
            break;
          }
        }
        expect(failures.join('\n'), `stops beaten by another stop\n${failures.join('\n')}`).toBe('');
      },
      300_000,
    );
  }
});
