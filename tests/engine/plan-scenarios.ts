/**
 * **The benchmark's scenarios** — the armies `tests/engine/plan-benchmark.test.ts` measures the plan on, and
 * what each of them is pinned to.
 *
 * Extracted from that file on 2026-09-18 (S-87) so a second test can hold a criterion on **every** army the
 * benchmark builds without a second copy of them: `tests/engine/plan-criteria.test.ts` asks these same
 * scenarios whether every hired stack of every march the bar offers stands under the lowest troop stack. The
 * scenarios, their pins and the comments that date them are unchanged by the move — a pin lives once, here.
 */

import { existsSync, readFileSync } from 'node:fs';

import { unitById } from '@/data';
import { aggregateBonuses } from '@/engine/bonuses';
import type { ResolvedSource, StackRequest, UnitDef } from '@/engine/types';
import { parseImport } from '@/share/exportImport';
import { newProfile } from '@/state/defaults';
import { buildPlanRequest, buildStackRequest } from '@/state/derive';
import type { Profile } from '@/state/schema';

export const OWNER_EXPORT =
  process.env.PYRRHIC_EXPORT_2026_09_17 ?? '/home/remi/Downloads/pyrrhic-my-account-2026-09-17 (2).json';
const TOTALSTACK_CAPTURE = new URL(
  '../../docs/research/fixtures/totalstack-2026-09-15-optimize.json',
  import.meta.url,
);
const KAI_EXTRACT = new URL('../../docs/research/fixtures/kai-extract-2026-09-15-4000.json', import.meta.url);
export const HORIZON = 4;

// ---- the scenarios ---------------------------------------------------------------------------------------

export interface Pinned {
  /** The plan refuses this army outright (`planCampaign` throws). */
  refuses: boolean;
  /** Stops on the bar. */
  stops: number;
  /**
   * **No sizer sequence is behind the sweet spot on either ratio** — that is, some sizer sequence is at least
   * as efficient a silver *and* at least as efficient a hired unit as the recommendation.
   *
   * **Renamed 2026-09-18 (S-89), from `sweetLosesOnBoth`.** The comparator is `>=` on both ratios and has
   * always been, so an exact tie has always counted; nothing read it that way until the tail made ties
   * happen. On Bear V ×1 and ×2 the tailed sweet spot is now *literally* the Tier ladder sizer's campaign —
   * 18 554 768 for 32 525 600, and 18 779 168 for 32 525 600, to the unit on both rows — and a pin called
   * "loses on both" reading `true` on a plan that lost nothing is a name false on its own row. The
   * comparator is kept exactly as it is (a tie is not a loss, but it is not being ahead either); only the
   * name now says what it tests.
   */
  sweetNotAheadOnEither: boolean;
  /** The share of the best sizer sequence's four-march damage the plan's hardest campaign reaches. */
  damageFloor: number;
  /** The plan's best stop a hired unit beats every sizer sequence. */
  winsHired: boolean;
  /** The share of the best sizer sequence's damage a silver the plan's best stop reaches (0.95 unless a case says why). */
  silverFloor?: number;
  /** Against the calculators outside this repo, where a case has them: the same two readings. */
  externals?: { damageFloor: number; winsHired: boolean };
  /**
   * **The floors against TotalStack's Total Optimization** (S-101, 2026-09-19), the owner's own goal stated
   * on the row he compares against: *"at least the same as TotalStack full opt in silver/dmg, merc/dmg and
   * monster/dmg"*.
   *
   * Three standings of the plan's **best stop** — its best damage a silver, its best damage a hired soldier
   * chunk and its best damage a monster chunk (`perSoldier` / `perMonster` of `plan-yardsticks.ts`, S-98's
   * readings) — each over the same reading of the `TotalStack · Total Optimization` row, both priced by our
   * engine on the same request and on the same worst opening. A scenario carries this block exactly when a
   * **comparable** Total Optimization row is on its table.
   *
   * **They are measured, never aspirational.** Each is today's figure floored to two decimals, so the pin is
   * a non-regression line and not a wish: where the plan is already past the goal the floor sits just under
   * 1.0-and-above, and where it is **behind** the goal the floor sits just under the measured value and the
   * shortfall is reported as a discrepancy (the run's `goal` line, and the story's own table) rather than
   * pinned at 1.0. Pinning a goal the bar does not reach would make the benchmark red for a reason that is
   * not a regression, which is the one thing it must not do.
   */
  totalOptimization?: {
    /** Damage a silver, best stop over TotalStack's Total Optimization. */
    perSilver: number;
    /** Damage a hired-soldier chunk, best stop over TotalStack's Total Optimization. */
    perSoldier: number;
    /** Damage a monster chunk, best stop over TotalStack's Total Optimization. */
    perMonster: number;
    /**
     * **Damage a dragon coin, best stop over TotalStack's Total Optimization** (S-103, 2026-09-19; the
     * owner: *"TotalStack computes the total of dragon coins needed for a stack if present and the
     * dmg/dragon coins."*), the fourth standing and the one only a **monster camp** has. It is optional,
     * and deliberately so: on an army that houses no dominance unit neither side spends a coin, both sides
     * read at `damage / 1` and the quotient is the damage column again, which is a floor that says nothing.
     * A scenario carries it exactly when a coin is spent on its table, so the fourteen armies pinned before
     * this story keep the three readings they were pinned on, to the digit.
     */
    perDragonCoin?: number;
  };
  /**
   * **Dominance at matched spend** (S-121, 2026-09-22), the benchmark's **primary** reading and the one the
   * owner's own definition of beating another calculator reduces to: *"beat means using constrained
   * resources to produce better damage with a fixed silver/merc/gold/dragon coins set."*
   *
   * A scenario carries this block exactly when a **comparable** march from a calculator outside this repo is
   * on its table — the same rule `externals` above follows, so a captured row that appears or disappears is
   * caught here rather than silently dropping a floor.
   *
   * **Measured, never aspirational**, for the reason `totalOptimization` above is: five of the seventeen
   * armies beat TotalStack today and twelve do not, and a benchmark red for a target rather than for a
   * regression would stop being a non-regression suite. What is pinned is *today's standing*, so that the
   * day a change takes it away the run says so.
   */
  matched?: {
    /**
     * A stop of ours fits inside their hardest comparable march's budget at all. Pinned `false` on the
     * armies where none does (§3's G0) and **asserted only when `true`**: a stop appearing inside their
     * budget later is the coverage defect being fixed, which is news for the report rather than a failure.
     */
    fits: boolean;
    /**
     * Our best fitting stop's damage over theirs, minus one — the figure `docs/plans/beating-totalstack.md`
     * §2 tables, floored to four decimals below what it measures. Absent where nothing fits.
     */
    delta?: number;
  };
}

export interface Scenario {
  label: string;
  request: StackRequest;
  /** Marches answered by calculators outside this repo, priced under this scenario's own bonuses. */
  externals: { name: string; counts: Record<string, number> }[];
  pinned: Pinned;
}

export function ownerProfile(): Profile | null {
  if (!existsSync(OWNER_EXPORT)) return null;
  const parsed = parseImport(readFileSync(OWNER_EXPORT, 'utf8'));
  return parsed.kind === 'profile' ? parsed.payload : null;
}

/** The owner's live browser account of 2026-09-18: his export's profile with the captains he had enlisted. */
function liveProfile(profile: Profile, hired: { id: string; cap: number | null }[]): Profile {
  const live = structuredClone(profile);
  live.mercenaries.selected = hired;
  live.sources.captains = [
    { id: 'ww8j0qwv', captainId: 'aydae', level: 43, star: 3 },
    { id: '9kfdv1z0', captainId: 'alexander', level: 36, star: 0 },
    { id: 'h9i5fjdc', captainId: 'leonidas', level: 41, star: 0 },
  ];
  return live;
}

/**
 * **"Aydae alone, 4 975"** — the camp of experiment 103, added 2026-09-19 (S-97): the owner's export with
 * **one** captain enlisted (Aydae 43 ★3), the two top guardsman tiers he does not own clicked out, his live
 * hired stock (hunters 83, legionaries unlimited, chariots 10, arbalesters 60) and 4 975 leadership against
 * 2 180 authority. It is built to the unit the way `tests/engine/plan.test.ts` builds it.
 *
 * **Why it is a scenario at all.** It is the one army S-94 disclosed as a like-for-like loss: priced on the
 * same reliable reading, the engine before that story offered **4** stops with a 17-chunk steady max at
 * **4 773 281** a march, and S-94's bar offered **3**, a 7-chunk steady max at **3 387 893**, and an `all-in`
 * campaign worse on damage, silver *and* the stock at once. The cause was search coverage rather than the
 * reading — the burn ladder's top (experiment 111), which S-97 restores — and an army that has already
 * caught one whole-bar regression is an army the benchmark should be watching.
 */
function aydaeAlone(profile: Profile): StackRequest {
  const camp = structuredClone(profile);
  camp.sources.captains = [{ id: 'ww8j0qwv', captainId: 'aydae', level: 43, star: 3 }];
  camp.troops.topTierExcluded = { guardsmen: ['melee', 'ranged'], specialists: [] };
  camp.mercenaries.selected = [
    { id: 'epic-monster-hunter-6', cap: 83 },
    { id: 'legionary-6', cap: null },
    { id: 'chariot-6', cap: 10 },
    { id: 'arbalester-6', cap: 60 },
  ];
  const setup = camp.setups[0];
  if (!setup) throw new Error('no setup');
  return buildStackRequest(camp, {
    ...setup,
    housing: { ...setup.housing, leadership: 4_975, authority: 2_180 },
  });
}

/** A first-run army (Guardsmen I–III, Specialists I, no bonuses) with one hired type at a stock. */
function firstRun(hired: { id: string; cap: number }, leadership: number): StackRequest {
  const profile = newProfile('first run');
  profile.mercenaries.selected = [hired];
  const setup = profile.setups[0];
  if (!setup) throw new Error('no setup');
  return buildStackRequest(profile, { ...setup, housing: { leadership, authority: 40_000, dominance: 0 } });
}

/**
 * **A camp that has unlocked the monster tiers** (S-96) — the first-run army again, with the e2e seed's 83
 * hunters and six Bear V hired, and the profile's `troops.monsters` tier window opened on tiers **3–5**
 * against a **900** dominance pool. That window is 12 of the 28 types in `src/data/tables/monsters.json`,
 * each of them uncapped (a monster carries no `caps` entry — only a selected mercenary does), so the whole
 * dominance pool is what bounds every one of them, and at 900 it binds hard: the stops fielded here stand at
 * 795 to 898 of the 900 the camp holds.
 *
 * It is experiment 110's 900-dominance camp to the unit (`tools/theorycraft/110-monster-shelter.test.ts`,
 * `out/110-monster-shelter.md`), one of the two the owner's *"fix why the monsters are not shielded in the
 * generated stack"* was measured on: the Battle card's sizers field a monster stack for every type there and
 * the plan fielded **0 of 12 types held**, on every stop, on every march of every stop. No scenario above
 * holds a dominance unit at all — the benchmark's ten armies are mercenaries and troops — so nothing in this
 * file exercised the monster pool before it.
 *
 * **Experiment 110's other monster camp — tiers 3–7 at 20 000 dominance — is deliberately *not* registered
 * here, and the reason is a finding of its own.** It is the larger picture (20 monster types, four stops, all
 * twenty fielded and sheltered on each of them), but its search **does not finish inside the app's own plan
 * budget**: `CAMPAIGN.budgets.plan` is 25 000 ms and that camp's search ran **25 846 to 28 009 ms** in every
 * run measured on 2026-09-19 — alone and inside this suite alike — so it is always cut off and the bar it
 * answers with is whatever the search had reached when the clock ran out rather than what the engine finds.
 * A scenario whose pins are the clock's is not a non-regression test.
 *
 * **The 900 camp is registered because its search finishes**, and the pins below depend on that: about
 * **7 100 ms** run alone and **8 500 to 9 200 ms** inside this suite, a margin of roughly **2.7×** under the
 * same 25 000 ms budget, so the bar is the engine's answer and the same one on every machine. Widening the
 * search to a pool that carries a dozen to twenty uncapped types is what costs the larger camp its budget;
 * that is an open follow-up, not this scenario.
 *
 * ---- **The 20 000-dominance camp, answered by TotalStack on 2026-09-19 (S-103)** ---------------------------
 *
 * The second replay of that morning asked the page **both** of experiment 110's camps, so the sibling this
 * docstring turns down now has four captured answers of its own. They are recorded here and **asserted
 * nowhere**, because the scenario they would belong to is the one whose search does not finish: a row is
 * priced on a scenario's request, and pinning one against a bar the clock cut off would pin the clock.
 *
 * Its Total Optimization answer fields **2 730 monster units over the same 12 types** — Water Elemental 916,
 * Battle Boar 446, Emerald Dragon 387, Stone Gargoyle 335, Gorgon Medusa 144, Many-Armed Guardian 133,
 * Magic Dragon 115, Ice Phoenix 102, Desert Vanquisher 41, Flaming Centaur 39, Ettin 35, Fearsome Manticore
 * 37 — for **19 999 of the 20 000** dominance, beside the same 6 Bear V and 65 Epic Monster Hunter VI it
 * answers the 900 camp with. Its M's Preservation answer fields 3 037 units of 8 types and no hunter. The
 * shape of the finding is that the page fills the pool to the unit at either size, which is the one thing
 * the 900 camp below already shows against a bar that finishes.
 */
function monsterCamp(): StackRequest {
  const profile = newProfile('first run');
  profile.mercenaries.selected = [
    { id: 'epic-monster-hunter-6', cap: 83 },
    { id: 'bear-5', cap: 6 },
  ];
  profile.troops.monsters = { min: 3, max: 5 };
  const setup = profile.setups[0];
  if (!setup) throw new Error('no setup');
  return buildStackRequest(profile, {
    ...setup,
    housing: { leadership: 20_000, authority: 2_180, dominance: 900 },
  });
}

interface Capture {
  request: {
    inputValue: number;
    authorityValue: number;
    mercenaryCaps: Record<string, number>;
    selectedMercenaryIds: string[];
    relaxedPreservation: boolean;
    healthBonuses: Record<string, number>;
    strengthBonuses: Record<string, number>;
    templeLevel: number;
    enemyFormation: Record<string, number>;
  };
  response: { calculation: { troopCounts: Record<string, number>; mercenaryCounts: Record<string, number> } };
}
interface KaiExtract {
  payload: { army: { name: string; count: number }[] };
}
const KAI_NAMES: Record<string, string> = {
  'Spearman I': 'spearman-1',
  'Rider I': 'rider-1',
  'Archer I': 'archer-1',
  'Spearman II': 'spearman-2',
  'Rider II': 'rider-2',
  'Archer II': 'archer-2',
  'Rider III': 'rider-3',
  Legionary: 'legionary-6',
  Arbalester: 'arbalester-6',
  'Epic Monster Hunter VI': 'epic-monster-hunter-6',
  Chariot: 'chariot-6',
};

/**
 * The 4 000-leadership case of 2026-09-15 as TotalStack was asked it: its own answer's troop types (the
 * query's tier window as it read it), the four hired types with the caps of the query, its bonuses (melee
 * +35 / +70, army +3 / +3), its enemy and temple. TotalStack's answer and Kai's extract of the same day are
 * the external rows; Kai's extract carries no bonus figures, so it is priced under the query's.
 */
function fourThousand(): Scenario {
  const capture = JSON.parse(readFileSync(TOTALSTACK_CAPTURE, 'utf8')) as Capture;
  const kai = JSON.parse(readFileSync(KAI_EXTRACT, 'utf8')) as KaiExtract;
  const query = capture.request;
  const theirs = {
    ...capture.response.calculation.troopCounts,
    ...capture.response.calculation.mercenaryCounts,
  };
  const troopIds = Object.keys(capture.response.calculation.troopCounts);
  const units = [...troopIds, ...query.selectedMercenaryIds].map((id) => {
    const unit = unitById(id);
    if (!unit) throw new Error(`unknown unit ${id}`);
    return unit as UnitDef;
  });
  const caps = Object.fromEntries(query.selectedMercenaryIds.map((id) => [id, query.mercenaryCaps[id] ?? 0]));
  const source: ResolvedSource = {
    id: 'totalstack-2026-09-15',
    label: 'the capture request',
    kind: 'custom',
    health: { melee: query.healthBonuses['melee'] ?? 0, army: query.healthBonuses['army'] ?? 0 },
    strength: { melee: query.strengthBonuses['melee'] ?? 0, army: query.strengthBonuses['army'] ?? 0 },
  };
  const request: StackRequest = {
    units,
    caps,
    housing: { leadership: query.inputValue, authority: query.authorityValue, dominance: 0 },
    totals: aggregateBonuses([source]),
    options: {
      method: 'ms',
      strictMercsAboveMonsters: false,
      monstersLast: false,
      roundTo10: false,
      relaxedPreservation: query.relaxedPreservation,
    },
    enemy: {
      melee: query.enemyFormation['melee'] ?? 0,
      ranged: query.enemyFormation['ranged'] ?? 0,
      mounted: query.enemyFormation['mounted'] ?? 0,
      flying: query.enemyFormation['flying'] ?? 0,
    },
    activeEvents: [],
    recovery: {
      templeLevel: query.templeLevel,
      trainingCostReduction: {},
      trainingSpeed: {},
      plan: { mode: 'retrain' },
    },
  };
  const kaiCounts: Record<string, number> = {};
  for (const stack of kai.payload.army) {
    const id = KAI_NAMES[stack.name];
    if (!id) throw new Error(`unmapped Kai stack ${stack.name}`);
    kaiCounts[id] = stack.count;
  }
  return {
    label:
      'the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)',
    request,
    externals: [
      { name: 'TotalStack · optimize (as captured, repeated)', counts: theirs },
      { name: 'Kai’s calculator · extract (as captured, repeated)', counts: kaiCounts },
    ],
    // Measured 2026-09-18: three stops; 96.5 % of the best sizer sequence's damage. TotalStack's own answer,
    // repeated, out-hits every row here by 3.2 % (Troops first · Generate) at the same silver, 24 burned
    // against the plan's 21; the plan keeps the better damage a hired.
    // **Re-measured 2026-09-18 with the put-back pass**: the all-in puts a low tier back for 8 394 732 over
    // four marches at 6 241 000 silver, against 8 154 596 for 6 250 700 — more damage for slightly less
    // silver — and the gap to TotalStack's captured answer closes from 9.3 % to **0.25 %** (8 415 312
    // against 8 394 732). It is the widest of the two put-backs this file measures; the floors are unmoved.
    // **Re-based 2026-09-19 (S-94), every row priced on the worst opening.** The bar does not move — three
    // stops, the same counts, the same burn, a coin flip of 1.1–1.3 % on each of them — and the shares rise
    // because TotalStack's captured answer and the Generate rows give up more of themselves than ours do:
    // the sizers 0.999 → **1.000** and the two captured answers 0.968 → **0.972**. **Neither pin is
    // re-based** (see the bear ×1 case above): 0.96 and 0.93 stand, and both still pass.
    // **The floors against Total Optimization, measured 2026-09-19 (S-101)**: 1.0166 a silver, **1.2185** a
    // hired soldier chunk, 1.0166 a monster chunk. The four hired types of this query are all soldier hires,
    // so the monster reading is `damage / 1` on both sides and repeats the damage column; the soldier one is
    // the plan 22 % ahead on the stock at a better damage a silver. All three are at or above the goal —
    // the only one of the five first-run-sized cases where that is so.
    pinned: {
      refuses: false,
      stops: 3,
      sweetNotAheadOnEither: false,
      damageFloor: 0.96,
      winsHired: true,
      externals: { damageFloor: 0.93, winsHired: true },
      // **`perSoldier` re-pinned 1.21 → 1.01 on 2026-09-21, by the owner** (*"lets pin the benchmark where
      // we fall short with total stack and review them later"*). Measured today: **1.0134843**. The plan is
      // still **above** his goal of 1.0 on all three readings here; what it lost is the 22 % margin S-101
      // recorded. **Not a trade he has accepted — a shortfall he has parked**, so that the suite is red for
      // new regressions rather than for this one, and the gap stays on the table to be explained.
      totalOptimization: { perSilver: 1.01, perSoldier: 1.01, perMonster: 1.01 },
      // **Dominance at matched spend, measured 2026-09-22** (S-121), the reading the owner's own
      // definition of beating another calculator reduces to. Their hardest comparable march is
      // `TotalStack · M’s Preservation`,
      // and the bar's best stop inside its budget at 5 % hits **-2.77 %** against it.
      // Over all of their comparable marches the bar dominates **6/11**, and every one of them has a stop of ours inside it.
      // Only the delta is pinned, and only where a stop fits — `Pinned.matched` says why.
      matched: { fits: true, delta: -0.0278 },
    },
  };
}

export function ownerScenarios(profile: Profile): Scenario[] {
  const setup = profile.setups[0];
  if (!setup) throw new Error('no setup');
  const at = (leadership: number, p: Profile = profile): StackRequest =>
    buildStackRequest(p, { ...setup, housing: { ...setup.housing, leadership } });
  const live = (hired: { id: string; cap: number | null }[], leadership: number): StackRequest =>
    buildStackRequest(liveProfile(profile, hired), {
      ...setup,
      housing: { leadership, authority: 2_180, dominance: 0 },
    });
  return [
    {
      // Pinned 2026-09-18: the plain Troops-first sequence beat the sweet spot on both ratios (2.14 · 426 216
      // against 1.95 · 376 087) until every hired type was kept and every hired stack sheltered (S-75); the
      // shelter cost 6 % of the top damage here (89.6 % of the sizers, experiment 101 §A).
      // S-77, 2026-09-18: only an **unlimited** hired stack is clamped under the troops, so the capped
      // legionaries may stand on top again as the enemy's first kill — 89.6 % → 95.6 % of the sizers. The bar
      // keeps four stops: the middle rule's tie now goes to the rung the other does not dominate over the
      // campaign (11 burned, not 10), and no march left of it is as efficient a silver, so no silver saver is
      // offered. The Troops-first sequence still beats the sweet spot on both **campaign** ratios (2.1394 ·
      // 426 215 against 2.0119 · 393 667): this case is a sizer shape either way, and the sweet spot is the
      // middle of the bar rather than the hardest march it can find. With the silver saver gone so is the
      // plan's win a hired unit here — it was that stop's 523 723 that beat the sizers' 426 215, and the four
      // stops left top out at the sweet spot's 393 667. The bar's thrift end on this army is now the sweet
      // spot itself; a proposal that brings a thriftier stop back should move this pin with it.
      // Re-based 2026-09-18, when the sweep began scoring each of its levels per unit as well as rounded up to
      // a whole chunk: the ladder's thriftiest rung improves to 1.9715 a silver, which puts a **silver saver**
      // back on this bar (4 → **5** stops, 16 747 720 over four marches at 478 506 a hired unit) and, by
      // tilting the chord the knee is drawn from, moves the sweet spot from the 11-burn rung to the 10 —
      // 20 924 965 at 1.9097 a silver and 475 567 a hired. Both of those beat the Troops-first sequence's
      // 426 216 a hired, so `winsHired` is true again and no sizer sequence beats the sweet spot on both
      // ratios any more (`sweetNotAheadOnEither` false). The plan's own campaign is untouched at 24 814 601 (95.6 %
      // of the best sizer), and so is the steady max at 6 242 452 a march.
      label: '2026-09-17 export, its setup (7 000 leadership)',
      request: buildStackRequest(profile, setup),
      externals: [],
      // TotalStack on the owner's own troop window (fourth run, 2026-09-18): its best is the priority search under
      // M's at 16 323 066 for 16 016 000 silver; the plan's steady max 24 814 601 for 10 957 600 is 1.52× it. Its
      // thriftiest answer keeps the better damage a hired.
      // **Re-based 2026-09-18 (S-87), the shelter over every hired type** — this case is where S-77's sponge
      // lived, so it is where the owner's *"shield mercs"* costs the most. The unsheltered MS-relaxed march
      // stood 34 legionaries (372 096 HP) over a 361 200-HP troop floor; sheltered, the steady max is the
      // 13-burn rung at 5 864 482 a march and the plan's campaign is **23 264 491** for the same 10 957 600
      // silver, against 24 814 601 — 95.6 % → **89.6 %** of the best sizer sequence (0.95 → **0.89**) and
      // 1.52× → **1.43×** TotalStack's best answer on this window (1.52 → **1.42**). The burn ladder is
      // 11 · 12 · 13 · 27 and the bar loses its silver saver — **5 → 4 stops** — because that stop must be at
      // least as efficient a silver as the sweet spot and nothing left of the 11-burn rung is (it is the same
      // four stops S-75 measured here, and the figures are S-75's to the unit). What does not move: the plan
      // still wins a hired unit against the sizers (460 909 against 426 216), no sizer sequence beats the
      // sweet spot on both ratios, and its best stop a silver is 0.993 of theirs. The search also got
      // **five times faster** on this case — 7 113 ms → 1 404 ms — because a sheltered vector collapses onto
      // the same counts from many directions and the climb stops re-scoring them.
      // **Re-based 2026-09-19 (S-94), the plan ranked and priced on the worst opening.** The bar moves left
      // and grows: **4 → 5 stops**, because the ladder's thrift end improves on the reliable reading and a
      // **silver saver** is offered again at 7 burned (3 583 107 a march for 1 851 500 silver, 511 872 a
      // hired unit). The knee follows it from the 11-burn rung to the **10** — the sweet spot is 4 870 455 a
      // march where the 11 was 5 230 687 — the steady max climbs from the 13 to the **14** at 5 913 067
      // (+2.6 % of reliable damage), and the `all-in` gains the most of any stop on this account:
      // 5 484 951 → **6 603 524**, **+20.4 %**, its 27-burn ladder replaced by a Troops-first shape with a
      // Spearman II put-back. Shares: the sizers 0.903 → **0.959** and TotalStack's best answer on this
      // window 1.436 → **1.719** — the captured answers are searched on average damage and lose a third of
      // themselves at this reading.
      // **No pin here is re-based** (owner, 2026-09-19: a new baseline is registered by him, not by us).
      // `damageFloor` 0.89 and `externals` 1.42 stand and still pass; **`stops` stays 4 and now FAILS**,
      // because the reliable bar offers five. The measured five-stop bar is in
      // `tests/engine/plan-baseline.proposed.json` for him to register.
      // **The floors against Total Optimization, measured 2026-09-19 (S-101)**, and this army carries the
      // widest discrepancy of the fifteen on the owner's own goal: **2.0702** a silver and **2.1458** a
      // monster chunk, against **0.7806** a hired *soldier* chunk. The plan hits twice as hard for the
      // silver and for the rare beast, and gives up a fifth of the soldier reading doing it, because its
      // stops field the capped legionaries where Total Optimization answers this window with far fewer,
      // larger soldier stacks. The floor is pinned at the 0.78 measured, not at the 1.0 wanted.
      pinned: {
        refuses: false,
        stops: 4,
        sweetNotAheadOnEither: false,
        damageFloor: 0.89,
        winsHired: true,
        externals: { damageFloor: 1.42, winsHired: false },
        totalOptimization: { perSilver: 2.07, perSoldier: 0.78, perMonster: 2.14 },
        // **Dominance at matched spend, measured 2026-09-22** (S-121), the reading the owner's own
        // definition of beating another calculator reduces to. Their hardest comparable march is
        // `TotalStack · priority search under M’s (averageDamage)`,
        // and the bar's best stop inside its budget at 5 % hits **+55.45 %** against it.
        // Over all of their comparable marches the bar dominates **6/9**, and **3** of them have no stop of ours inside at all.
        // Only the delta is pinned, and only where a stop fits — `Pinned.matched` says why.
        matched: { fits: true, delta: 0.5545 },
      },
    },
    {
      label: '2026-09-17 export, 12 000 leadership',
      request: at(12_000),
      externals: [],
      // Measured 2026-09-18 before the proposals: 94.9 % of the sizers' damage, four stops (no more-mercs rung).
      // TotalStack on the owner's window: best 24 167 160 for 21 785 600 silver; the plan's 32 518 195 for
      // 18 790 400 is 1.34× it; TotalStack's thriftiest keeps the better damage a hired.
      // **Unmoved by the put-back pass** (`CAMPAIGN.putBack`), and this scenario is where its two refusals are
      // visible. The steady max scores a Spearman I put-back — 8.1 % of its silver and 21.8 % of its queue for
      // 2.6 % of its damage — and the ladder guard hands the row back, because taking it would have put
      // "Steady max" 1.5 % under the sweet spot beside it (8 063 238 against 8 185 823); the all-in scores one
      // too and the queue guard refuses it, because it lengthened the training queue by 17.5 %. Every figure
      // here is therefore the one measured before the pass existed.
      // **Re-based 2026-09-19 (S-93), the tighter shape** — every rung of the burn ladder re-sized by the
      // sizer over each **prefix** of the troop ranking, taken only where it is behind on none of damage,
      // silver, the stock burned and the queue. On this army the whole ladder moves down the burn axis (the
      // same marches for fewer chunks): 11 · 17 · 19 becomes 9 · 10 · 13 · 17 · 19 and a **silver saver** is
      // offered again — **4 → 5 stops**, 25 905 397 over four marches for 15 900 200 at 645 859 a hired unit.
      // The knee follows the better thrift end from the 17-burn rung to the 10, so the recommendation is
      // 28 748 251 for 18 702 500 where it was 32 231 242 for 18 790 400, and the 17 is now the steady max at
      // 8 185 823 a march (1.7426 a silver, against the Spearman-I put-back's 8 281 474 at 1.5186 — the put-
      // back is gone, because the tighter shape reaches a better march before it is offered anything). The
      // hardest campaign on the bar is the `all-in` at **33 028 417** for 22 702 100, against 32 518 195, so
      // the plan's share of the sizers rises: 0.94 → **0.96** (the best sizer sequence is unmoved at
      // 34 283 252) and of TotalStack's best answer on this window 1.34 → **1.36**.
      // **Re-based 2026-09-19 (S-94), the plan ranked and priced on the worst opening.** Five stops still,
      // and the whole bar shifts one rung left: the silver saver 9 → **8** burned (4 763 589 a march), the
      // sweet spot 10 → **9** (6 269 353), the more-mercs and steady-max rungs unmoved at 13 and 17, the
      // `all-in` at 24. The hardest campaign is the steady max's 31 546 458 where the midpoint reading gave
      // the `all-in` 33 028 417, and the best sizer sequence (Troops first · Generate) falls from 34 283 252
      // to 33 277 720 — less than the plan does — so this is the one army of the ten whose share **falls**:
      // 0.963 → **0.948**. TotalStack's best is barely moved: 1.367 → **1.378**. And the bar is
      // **5 → 4 stops**: the `all-in` played 31 308 140 for 23 696 200 silver and 90 burned against the
      // steady max's 31 546 458 for 18 790 400 and 67 — behind on every figure a stop prints — so the engine
      // stopped offering it (S-94, `plan.ts`).
      // **No pin here is re-based** (owner, 2026-09-19). Two of them now **FAIL** and are left failing for
      // him to judge: `damageFloor` 0.96 against a measured 0.948 (a scenario that got worse on the share,
      // and the one army of the ten that did), and `stops` 5 against the four the bar now offers. The
      // measured figures are in `tests/engine/plan-baseline.proposed.json`.
      // **The floors against Total Optimization, measured 2026-09-19 (S-101)**: **1.7936** a silver and
      // **1.6972** a monster chunk, against **0.6000** a hired soldier chunk — the same shape as the 7 000
      // export above and the deepest soldier shortfall of the fifteen. It is the one reading of the three on
      // which this account is behind TotalStack's full optimisation, and it is pinned at 0.60 measured.
      pinned: {
        refuses: false,
        stops: 5,
        sweetNotAheadOnEither: false,
        damageFloor: 0.96,
        winsHired: true,
        externals: { damageFloor: 1.36, winsHired: false },
        // **`perSilver` re-pinned 1.79 → 1.71 on 2026-09-21, by the owner** (same call). Measured today:
        // **1.7171112**. It has been **masked** since S-106 behind this scenario's `stops` assertion (5
        // registered, 3 offered), which fires first and stops the test — so it was short and invisible.
        // Far above his goal of 1.0; parked for review with the rest.
        totalOptimization: { perSilver: 1.71, perSoldier: 0.6, perMonster: 1.69 },
        // **Dominance at matched spend, measured 2026-09-22** (S-121), the reading the owner's own
        // definition of beating another calculator reduces to. Their hardest comparable march is
        // `TotalStack · priority search under M’s (averageDamage)`,
        // and **no stop of ours fits inside its budget at 5 %** — the bar is not losing that
        // comparison, it is not in it (§3's G0).
        // Over all of their comparable marches the bar dominates **3/9**, and **6** of them have no stop of ours inside at all.
        // Only the delta is pinned, and only where a stop fits — `Pinned.matched` says why.
        matched: { fits: false },
      },
    },
    {
      label: 'live account of 2026-09-18 (one hired type, 20 000 leadership)',
      request: live([{ id: 'epic-monster-hunter-6', cap: 83 }], 20_000),
      externals: [],
      // Measured 2026-09-18: 99.1 %, four stops.
      // TotalStack on the owner's window: Total Optimization 30 466 476 for 31 335 200; the plan's 31 218 724 is
      // 1.02× it and wins a hired.
      // **Re-based 2026-09-19 (S-94), the plan ranked and priced on the worst opening.** Four stops still,
      // the same rungs but for the silver saver, which climbs 4 → **5** burned and gains **+25.4 %** of
      // reliable damage a march there (3 612 405 → 4 528 272): its old march leant on one Spearman I stack
      // worth 600 387 a strike that only lands if the army opens. The other three stops keep their counts
      // and give up 0.9–1.4 % with the reading. The sizers lose much more, so the plan's share rises past
      // parity: 1.004 → **1.176**. TotalStack's captured answers hold up better than the sizers do and the
      // plan's edge over them narrows: 1.038 → **1.018**, still a win.
      // **No pin here is re-based** (owner, 2026-09-19). `damageFloor` 0.99 stands and passes;
      // **`externals.damageFloor` 1.02 now FAILS** against the measured 1.018 — the plan's lead over
      // TotalStack's own answers narrows on this army, which is exactly the kind of "worse" the owner wants
      // to judge himself. `tests/engine/plan-baseline.proposed.json` carries the measured pair.
      // **The floors against Total Optimization, measured 2026-09-19 (S-101)**, and this is the army where
      // the owner's goal is met on all three at once: **1.0718** a silver, **1.1609** a hired soldier chunk,
      // **1.0178** a monster chunk (the hunter is a soldier hire and no monster is fielded, so the last is
      // the damage column read through `damage / 1` on both sides). One hired type and a large leadership is
      // the shape the plan answers best.
      pinned: {
        refuses: false,
        stops: 4,
        sweetNotAheadOnEither: false,
        damageFloor: 0.99,
        winsHired: true,
        // **`externals.damageFloor` re-pinned 1.02 → 1.01 on 2026-09-21, by the owner** (same call as the
        // 4 000 case above). Measured today: **1.0178251** — the plan's hardest campaign is 29,743,332
        // against the best captured answer's 29,222,440, still ahead of every calculator on this army but
        // by less than the 2 % S-95 recorded. It is the pin S-94 first left red on 2026-09-19; parked now
        // rather than left failing, and to be reviewed with the other three.
        externals: { damageFloor: 1.01, winsHired: true },
        // **`perSilver` 1.07 → 1.03 and `perSoldier` 1.16 → 1.04, re-pinned 2026-09-21 by the owner** (same
        // call). Measured today: **1.0325419** a silver and **1.0425534** a hired soldier chunk.
        //
        // **This army is where the masking runs deepest, and it took three runs to see the bottom of it.**
        // The three assertions fire in file order — `externals.damageFloor`, then `perSilver`, then
        // `perSoldier` — and `expect` stops the test at the first failure, so each pin parked uncovered the
        // next one below it: the run of 11 reds showed only `damageFloor`, the run of 8 only `perSilver`,
        // and this one `perSoldier`. All three had been short since S-106; only the first was visible. The
        // lesson for the review: *"pin where we fall short"* is iterative on a scenario that carries more
        // than one floor, and a green suite after one pass is not proof the rest are met.
        //
        // All three are still **above** his goal of 1.0 — what they lost is the margin S-101 recorded, not
        // the goal. `perMonster` 1.01 is unmoved (no monster on either side; `damage / 1` both ways).
        totalOptimization: { perSilver: 1.03, perSoldier: 1.04, perMonster: 1.01 },
        // **Dominance at matched spend, measured 2026-09-22** (S-121), the reading the owner's own
        // definition of beating another calculator reduces to. Their hardest comparable march is
        // `TotalStack · Elite Preservation`,
        // and the bar's best stop inside its budget at 5 % hits **+1.78 %** against it.
        // Over all of their comparable marches the bar dominates **9/9**, and every one of them has a stop of ours inside it.
        // Only the delta is pinned, and only where a stop fits — `Pinned.matched` says why.
        matched: { fits: true, delta: 0.0178 },
      },
    },
    {
      label: 'live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)',
      request: live(
        [
          { id: 'epic-monster-hunter-6', cap: 83 },
          { id: 'legionary-6', cap: null },
          { id: 'chariot-6', cap: 10 },
          { id: 'arbalester-6', cap: 60 },
        ],
        11_000,
      ),
      externals: [],
      // Measured 2026-09-18: the sizers field the unlimited legionaries by the authority pool alone — 2 017 to
      // 2 064 a march, 874 burned over four — and Generate under Troops first answers a march of legionaries
      // and no troops at all (no silver, 52 M damage), so their damage is no yardstick here: the plan's 30.1 M
      // at 70 burned is 37 % of it and wins a hired by four times. A row without silver has no ratio a silver,
      // and the Tier ladder's 4.21 a silver rides on legionaries that cost gold, not silver: 41 % of it is pinned.
      // TotalStack on the owner's window: its priority search fields ~2 000 unlimited legionaries at no silver for
      // 80 137 589 — no yardstick, as with the sizers; the plan's 30 107 115 is 37 % of it and wins a hired.
      // **Re-based 2026-09-19 (S-94), the plan ranked and priced on the worst opening.** This is the army
      // where the rivals' coin flip was largest and the pin least meaningful: the legionary wall both the
      // sizers and TotalStack answer here is ~2 000 unlimited legionaries in one stack, which strikes only
      // if the army opens — 36 832 597 over four marches at the midpoint, **and the same 36 832 597 is what
      // it keeps** once priced on the bad flip only because its repeats carry it, while the *expected*
      // figure it used to be measured against was 80 137 589. The plan's share of it therefore rises
      // 0.401 → **0.861** on both the sizers and the captured answers (`damageFloor` and `externals`
      // 0.37 → **0.86**), and the pin finally says something. The bar itself loses a stop — **5 → 4**: the
      // silver saver is gone, because the ladder's thrift end no longer clears the sweet spot on damage a
      // silver at this reading — the knee moves 13 → **11** burned, and the steady max climbs 17 → **19**
      // for **+5.6 %** of reliable damage a march (7 566 423 → 7 987 079). And `silverFloor` could go: it is
      // 0.41 because the Tier ladder's 4.21 damage a silver rode on that same legionary wall, and on the
      // reliable reading the wall's damage collapses while its silver does not — the plan's best stop a
      // silver is now **1.075×** the best sizer sequence's, so the case would hold the file's ordinary 95 %
      // floor like every other army.
      // **No pin here is re-based** (owner, 2026-09-19). `damageFloor` 0.37, `externals` 0.37 and
      // `silverFloor` 0.41 all stand and all pass — by a wide margin now, which is the discrepancy for him
      // to judge; **`stops` stays 5 and now FAILS**, because the reliable bar offers four (the silver saver
      // is gone: nothing left of the sweet spot clears it on damage a silver at this reading).
      // `tests/engine/plan-baseline.proposed.json` carries the measured bar.
      // **The floors against Total Optimization, measured 2026-09-19 (S-101)**: **1.0241** a hired soldier
      // chunk, against **0.9237** a silver and **0.9514** a monster chunk. The account holds four hired
      // types here and the plan keeps every one of them; Total Optimization answers with the legionary wall
      // that costs no silver, so the silver reading is the one it wins. Two of the three are under the goal
      // and pinned where they measure.
      pinned: {
        refuses: false,
        stops: 5,
        sweetNotAheadOnEither: false,
        damageFloor: 0.37,
        winsHired: true,
        silverFloor: 0.41,
        externals: { damageFloor: 0.37, winsHired: true },
        totalOptimization: { perSilver: 0.92, perSoldier: 1.02, perMonster: 0.95 },
        // **Dominance at matched spend, measured 2026-09-22** (S-121), the reading the owner's own
        // definition of beating another calculator reduces to. Their hardest comparable march is
        // `TotalStack · priority search under Total Optimization (averageDamage)`,
        // and the bar's best stop inside its budget at 5 % hits **-13.90 %** against it.
        // Over all of their comparable marches the bar dominates **1/9**, and every one of them has a stop of ours inside it.
        // Only the delta is pinned, and only where a stop fits — `Pinned.matched` says why.
        matched: { fits: true, delta: -0.139 },
      },
    },
    {
      label: 'Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)',
      request: aydaeAlone(profile),
      externals: [],
      // **Added 2026-09-19 (S-97)**, and its pins are the figures of the day the burn ladder's top came
      // back (`aydaeAlone` above, and `tools/theorycraft/out/111-coverage-and-all-in.md` §A). Measured on
      // the engine of that story: **3 stops** — the sweet spot at 10 chunks (4 074 558 a march for
      // 1 948 300 silver), the steady max at **17** (4 773 281 for 2 203 500) and the `all-in` at 26
      // (5 366 544 for 2 705 500) — against S-94's 3 stops topping out at **7** chunks and 3 387 893.
      //
      // The bar's hardest campaign is the `all-in`'s **18 744 735 for 11 240 800** silver, which is
      // **0.948** of the best sizer sequence (Tier ladder · Generate, 19 767 678 for 10 575 600) — hence
      // the 0.94 floor — and its best stop a silver is the sweet spot's **2.022**, 1.08× the same
      // sequence's, so the file's ordinary 95 % silver floor holds with no exception.
      //
      // `winsHired` is **false**, and it is the unlimited legionaries that make it so rather than a weak
      // bar: Troops first over every type fields 28 chunks' worth for 13 629 206 — 486 757 a chunk —
      // where the plan's best a chunk is the sweet spot's 419 836, and the plan out-damages that row by
      // 38 % (18 744 735 against 13 629 206) at 53 % more silver. `sweetNotAheadOnEither` is false: no
      // sizer sequence here is at least as efficient as the sweet spot on both ratios at once.
      pinned: {
        refuses: false,
        stops: 3,
        sweetNotAheadOnEither: false,
        damageFloor: 0.94,
        winsHired: false,
        /**
         * **Its first captured answers, 2026-09-22 (S-119).** This army and his usual setup were the two the
         * benchmark could score against nothing; the capture on his new account answered both on the
         * Generate route (48 of 48 at 2xx; the whole `optimize` route came back 403 again, so no
         * `priority search` row joins them). Pinned at what they measure today, the file's rule.
         *
         * The plan's hardest campaign is **1.0958×** the best comparable captured row — `M's Preservation`
         * is the weakest of the three at 1.6395, `Total Optimization` and `Elite Preservation` tie at
         * 1.0958 — and its best damage a hired soldier chunk is **300,662 against their 11,478**, which is
         * the unlimited legionaries: their answer spends 2,017 of them and ours keeps the stock.
         */
        /**
         * **Re-pinned 1.09 → 0.94 on 2026-09-22, hours after it was first set**, and the reason is the
         * capture completing rather than anything moving in the engine: the first run of that morning had
         * the `optimize` route refused (403), so this army's hardest captured row was a *Generate* one at
         * 1.0958. With the cookie supplied the priority searches answered too, and its hardest row is now
         * **`priority search under Elite (averageDamage)`** at 23,501,117, which our plan's hardest campaign
         * (18,744,735) reaches **0.7976** of. S-119 §2 called this exact understatement out before it
         * landed, and this army is where it bites hardest: 1.09 → 0.79 in one capture.
         *
         * `winsHired` stays **true** and only just — 300,662 a hired soldier chunk against their 299,062.
         */
        externals: { damageFloor: 0.79, winsHired: true },
        /**
         * **Damage a silver is 0.9508 — under his goal of 1.0, and pinned where it measures** rather than at
         * the goal (the rule S-101 set and S-118 applied to seven others). Their Total Optimization answers
         * with the legionary wall that costs almost no silver, which is the same shape that wins them the
         * silver reading on the evening account.
         *
         * `perMonster` is pinned at the damage ratio because **neither side fields a monster here** (no
         * dominance pool), so the reading is `damage / 1` on both and `check` skips it as non-finite — the
         * same treatment the 4 000 case gives it.
         */
        totalOptimization: { perSilver: 0.99, perSoldier: 1.0, perMonster: 1.14 },
        // **Dominance at matched spend, measured 2026-09-22** (S-121), the reading the owner's own
        // definition of beating another calculator reduces to. Their hardest comparable march is
        // `TotalStack · priority search under Total Optimization (averageDamage)`,
        // and the bar's best stop inside its budget at 5 % hits **-20.24 %** against it.
        // Over all of their comparable marches the bar dominates **0/9**, and **1** of them have no stop of ours inside at all.
        // Only the delta is pinned, and only where a stop fits — `Pinned.matched` says why.
        matched: { fits: true, delta: -0.2024 },
      },
    },
    // **The three camps, S-101 (2026-09-19)** — scenarios 13, 14 and 15, appended after the twelve and
    // changing nothing above them. They are the armies `criteriaScenarios` has held the plan's criteria on
    // since S-93 and S-97; what they lacked to be benchmark scenarios was an outside answer to stand
    // against, and the replay of 2026-09-19 gave each of them four (`totalstack-rows.ts`).
    ...liveCamp(profile),
    ...hisCamp(profile),
    // **His own TotalStack profile, S-103 (2026-09-19)** — scenario 16, appended after the fifteen and
    // changing nothing above it.
    ...totalStackProfile(profile),
    // **His usual setup, S-106 (2026-09-19)** — scenario 17, appended after the sixteen and changing
    // nothing above it.
    ...usualSetup(profile),
    // **His browser setup of 2026-09-24, experiment 174** — scenario 18, appended after the seventeen and
    // changing nothing above them. It reads its own committed fixture, not the export.
    ...browserSetup(),
  ];
}

/** The cases that need no export: a first-run army with one hired type, and the 4 000 case two calculators answered. */
export function commonScenarios(): Scenario[] {
  return [
    {
      label: 'first-run army, Bear V ×1 (20 000 leadership)',
      request: firstRun({ id: 'bear-5', cap: 1 }, 20_000),
      externals: [],
      // Measured 2026-09-18, once the horizon became a ceiling: one stop of **one** march — a stock of one
      // bear sustains no repeat — 4 722 842 for 8 131 400, 19.8 % of the four-march sizers' damage and the
      // best of every row a silver (0.581 against 0.570). It refused outright before.
      // Re-based 2026-09-18 (S-89), the troops-only tail on the repeated stops: the one stop stopped where
      // the stock did, and the three marches the horizon still had room for were the whole of the gap to the
      // sizers, which march on with troops alone. It plays them now — 4 722 842 for 8 131 400 over one march
      // → **18 554 768 for 32 525 600 over four** — so 19.8 % → **77.6 %** of the sizers' damage
      // (`damageFloor` 0.19 → **0.77**). The stop is still the best of every row a silver and still loses a
      // hired unit to the Generate rows, and `repeat` is untouched at 4 722 842 / 8 131 400 / 1 burned.
      // `sweetNotAheadOnEither` false → **true**, and it is an exact tie rather than a loss: with one bear a march
      // and troops for the rest, the stop plays **literally the Tier ladder sizer's campaign** — 18 554 768
      // for 32 525 600 on both rows, to the unit — and the test counts an equal pair of ratios as beaten.
      // **Re-based 2026-09-19 (S-94), every row priced on the worst opening.** The plan's own stop is
      // unmoved — one bear a march, the same counts, 18 189 008 over four marches where the midpoint read
      // 18 554 768 (98.0 % of it) — but the Tier ladder's **Generate** row, which searches on *average*
      // damage, loses far more of itself: 23 899 764 → 18 535 192, because the march it answers leans on a
      // stack that only strikes when the army opens. So the plan's share of the best sizer sequence rises
      // 0.776 → **0.981** on the same marches. The stop count, the counts and `sweetNotAheadOnEither` are
      // untouched: the tailed campaign is still literally the Tier ladder sizer's, 18 189 008 for 32 525 600
      // on both rows at this reading too.
      // **The pin is NOT re-based** (owner, 2026-09-19: *"the benchmark is like non-regression tests. A
      // given scenario should not be worse, or it's a discrepancy, or a new baseline needs to be registered
      // by me if the trade is ok."*). `damageFloor` stays at the 0.77 it was measured at on the midpoint
      // reading; the reliable figure above is in `tests/engine/plan-baseline.proposed.json` for him to
      // register. This floor **passes** at 0.98 measured against 0.77, so nothing here fails.
      // **Its first captured answers, 2026-09-19 (S-101)**: the replay asked TotalStack this army, which no
      // capture had ever covered, and the three Generate rows it came back with are all **the same march as
      // ours plus one bear's worth of troops** — its Elite Preservation and its Total Optimization are
      // identical to the unit (18 217 808 for 32 529 600 over four marches) and its M's Preservation is
      // behind both (17 582 756 for 32 538 400). Ours is 18 189 008 for 32 525 600: **0.9984** of the best
      // of them on damage, for 4 000 silver less, and the same one chunk burned. `winsHired` against them is
      // **false** by exactly that margin — the burn is one chunk on every row here, so damage a hired unit
      // *is* the damage column — and the three floors against Total Optimization all read 0.99.
      pinned: {
        refuses: false,
        stops: 1,
        // Registered by the owner 2026-09-24 (W11–W13 trades, "register them all"): the re-typed sweet spot now leads the sizers (6fe913c).
        sweetNotAheadOnEither: false,
        damageFloor: 0.77,
        winsHired: false,
        externals: { damageFloor: 0.99, winsHired: false },
        totalOptimization: { perSilver: 0.99, perSoldier: 0.99, perMonster: 0.99 },
        // **Dominance at matched spend, measured 2026-09-22** (S-121), the reading the owner's own
        // definition of beating another calculator reduces to. Their hardest comparable march is
        // `TotalStack · Elite Preservation`,
        // and the bar's best stop inside its budget at 5 % hits **-0.16 %** against it.
        // Over all of their comparable marches the bar dominates **1/3**, and every one of them has a stop of ours inside it.
        // Only the delta is pinned, and only where a stop fits — `Pinned.matched` says why.
        matched: { fits: true, delta: -0.0016 },
      },
    },
    {
      label: 'first-run army, Bear V ×2 (20 000 leadership)',
      request: firstRun({ id: 'bear-5', cap: 2 }, 20_000),
      externals: [],
      // Measured 2026-09-18, once the horizon became a ceiling: one stop of **two** marches — two bears
      // fielded, then the one the chunk left — 9 557 884 for 16 262 800, 39.9 % of the four-march sizers'
      // damage and the best of every row a silver (0.588 against 0.577). It refused outright before.
      // Re-based 2026-09-18 (S-89), the troops-only tail on the repeated stops: the two marches the stock
      // reaches are followed by two on troops alone — 9 557 884 for 16 262 800 over two → **18 779 168 for
      // 32 525 600 over four** — so 39.9 % → **78.3 %** of the sizers (`damageFloor` 0.39 → **0.78**), and
      // damage a hired unit 4 778 942 → 9 389 584 on the same two burned. `repeat` is untouched at
      // 4 835 042 / 8 131 400 / 1 burned. `sweetNotAheadOnEither` false → **true** for the same reason as ×1: the
      // tailed campaign *is* the Tier ladder sizer's, 18 779 168 for 32 525 600 on both rows, and an equal
      // pair of ratios counts as beaten.
      // **Re-based 2026-09-19 (S-94), every row priced on the worst opening**, for the same reason as ×1 and
      // by the same arithmetic: the stop is the same march (18 413 408 over four marches against the
      // midpoint's 18 779 168, 98.1 % of it) and the sizers' average-damage Generate rows give up much more,
      // so the share rises 0.783 → **0.989**. Nothing else on this case moves. The pin is **not** re-based
      // (see ×1 above and `plan-baseline.proposed.json`): it stays at 0.78 and passes.
      // **Its first captured answers, 2026-09-19 (S-101)**, and they read exactly as ×1's do: TotalStack's
      // Elite Preservation and Total Optimization are the same march to the unit (18 442 208 for
      // 32 529 600), its M's Preservation is behind both (17 807 156), and ours is 18 413 408 for
      // 32 525 600 — **0.9984** of the best of them for 4 000 silver less at the same two chunks. Both
      // armies' answers differ from ours by one troop stack's worth of rounding and nothing else, which is
      // the honest reading of a case where the stock decides the march and both calculators know it.
      pinned: {
        refuses: false,
        stops: 1,
        // Registered by the owner 2026-09-24 (W11–W13 trades, "register them all"): the re-typed sweet spot now leads the sizers (6fe913c).
        sweetNotAheadOnEither: false,
        damageFloor: 0.78,
        winsHired: false,
        externals: { damageFloor: 0.99, winsHired: false },
        totalOptimization: { perSilver: 0.99, perSoldier: 0.99, perMonster: 0.99 },
        // **Dominance at matched spend, measured 2026-09-22** (S-121), the reading the owner's own
        // definition of beating another calculator reduces to. Their hardest comparable march is
        // `TotalStack · Elite Preservation`,
        // and the bar's best stop inside its budget at 5 % hits **-0.16 %** against it.
        // Over all of their comparable marches the bar dominates **1/3**, and every one of them has a stop of ours inside it.
        // Only the delta is pinned, and only where a stop fits — `Pinned.matched` says why.
        matched: { fits: true, delta: -0.0016 },
      },
    },
    {
      label: 'first-run army, Bear V ×3 (20 000 leadership)',
      request: firstRun({ id: 'bear-5', cap: 3 }, 20_000),
      externals: [],
      // Measured 2026-09-18 (experiment 101 §B): one stop, one bear fielded; the sizers field all three and
      // burn the same one a march — 58.8 % of their damage, beaten a hired and on both ratios.
      // TotalStack's dataset of 2026-09-18: its priority search under M's fields the three bears in three tier-3
      // stacks and goes on with troops alone when they are gone — 25 439 016 over four marches; the plan's one
      // bear a march reaches 55.7 % of it and loses a hired.
      // Re-based 2026-09-18: the `all-in` is offered on what its first march **fields** rather than on what it
      // burns. A stock of three burns one chunk whatever it fields, so 3 · 2 · 1 tied the one-bear repeat on
      // the bar's own axis and was dropped as a duplicate of it. 1 → **2** stops, and the new one is the
      // plan's hardest campaign here: 14 505 126 against 14 168 526, which is 58.8 % → **60.2 %** of the
      // sizers and 55.7 % → **57.0 %** of TotalStack's answer. Nothing else on this case moved.
      // Re-based 2026-09-19, the all-in's tail: the stop stopped where the stock did — 3 · 2 · 1, three
      // marches of a four-march horizon — and the fourth march was the whole of the gap to the sizers, which
      // go on with troops alone. It now plays it: 14 505 126 for 24 394 200 over three marches →
      // **19 115 768 for 32 525 600 over four**, which is 60.2 % → **79.4 %** of the sizers and 57.0 % →
      // **75.1 %** of TotalStack's best. At equal silver it is 98.6 % of TotalStack's M's Preservation
      // (19 388 676 for 32 535 200). Its ratios move with it — 0.595 → 0.588 a silver, 4 835 042 →
      // 6 371 923 a hired — and the stop count, the stops' own marches and every other row are unmoved.
      // Re-based 2026-09-18 (S-89), the same tail on the **repeated** stops: the sweet spot played three
      // marches of the four and now plays the fourth on troops alone — 14 168 526 for 24 394 200 →
      // **18 779 168 for 32 525 600** — which is 58.8 % → **78.0 %** of the sizers and, against TotalStack's
      // own answers as captured, 96.9 % of its M's Preservation at the same silver (19 388 676 for
      // 32 535 200) where the `all-in` beside it reaches 98.6 %. Not one pin moves: the `all-in` is still
      // this case's hardest campaign at 19 115 768, so `damageFloor` stays 0.79 and the externals' 0.75, and
      // the sweet spot is still beaten on both ratios by the Tier ladder sizer (0.577 / 6 259 723 against
      // 0.588 / 6 371 923), which is what `sweetNotAheadOnEither` has said here since the shelter went in.
      // **Re-based 2026-09-19 (S-94), the plan ranked and priced on the worst opening.** This is the army
      // where the old reading cost the most: the `all-in`'s first march stood one enormous Archer III stack
      // that strikes **once if we open and not at all if the monster does** — 6 054 272 expected against
      // 4 044 264 worst, a 33 % coin flip on the dearest stop of the bar (`out/109-reliable-damage.md` §A).
      // Ranked on the bad flip the search finds a different first march for the same one chunk burned:
      // 4 855 802 worst against 4 044 264, **+20.1 %** of reliable damage, and the campaign 16 539 794 →
      // 19 411 328. With the sizers re-priced too the plan's share is 0.941 → **1.000** and TotalStack's
      // best 0.891 → **0.875**, both stops kept. **Neither pin is re-based** (see ×1 above): 0.79 and 0.75
      // stand, both pass, and the measured pair is in `plan-baseline.proposed.json` for the owner.
      // **The floors against Total Optimization, measured 2026-09-19 (S-101)**: 0.9986 a silver and 0.9985
      // on both rare readings. The bear is a monster and the only hired type here, so `soldiersLost` is
      // nought on every row and damage a soldier and damage a monster are the same reading of the same
      // campaign — all three floors are one chunk's worth of damage apart from the goal, and all three are
      // under it, which is the discrepancy this army reports.
      pinned: {
        refuses: false,
        stops: 2,
        sweetNotAheadOnEither: true,
        damageFloor: 0.79,
        winsHired: false,
        externals: { damageFloor: 0.75, winsHired: false },
        totalOptimization: { perSilver: 0.99, perSoldier: 0.99, perMonster: 0.99 },
        // **Dominance at matched spend, measured 2026-09-22** (S-121), the reading the owner's own
        // definition of beating another calculator reduces to. Their hardest comparable march is
        // `TotalStack · priority search under M’s (averageDamage)`,
        // and the bar's best stop inside its budget at 5 % hits **-12.50 %** against it.
        // Over all of their comparable marches the bar dominates **2/9**, and every one of them has a stop of ours inside it.
        // Only the delta is pinned, and only where a stop fits — `Pinned.matched` says why.
        matched: { fits: true, delta: -0.125 },
      },
    },
    {
      label: 'first-run army, Bear V ×10 (20 000 leadership)',
      request: firstRun({ id: 'bear-5', cap: 10 }, 20_000),
      externals: [],
      // Measured 2026-09-18 (experiment 101 §B): one stop, six bears under the Elite sizer; the sizers field
      // ten, nine, eight, seven for the same four chunks — 84.1 % of their damage, beaten a hired.
      // S-77, 2026-09-18: the bears are capped, so the sizer's shape no longer lowers them under the troops
      // and the stop hits harder — 84.1 % → 86.4 %.
      // TotalStack's priority search under M's: 26 486 216 over four marches (ten bears first, then what is left);
      // the plan's six a march reaches 82 % and loses a hired.
      // Re-based 2026-09-18: the `all-in` is offered on what its first march **fields**, so 10 · 9 · 8 · 7 is a
      // stop — 1 → **2** — where on the burn it tied the eight-a-march repeat at one chunk and was dropped as a
      // duplicate. It is the *stop* that is new and not the damage: 21 700 948 over four marches for
      // 45 577 400 silver against the repeat's 21 732 276 for 32 525 600, so 40 % more silver to spend the
      // stock four times faster for slightly less damage. The bar can show that as a poor deal now, which it
      // could not before; every pinned figure is unmoved (86.5 % of the sizers, 82.1 % of TotalStack).
      // Unmoved again on 2026-09-19 by the all-in's tail: 10 · 9 · 8 · 7 already lasts the whole horizon, so
      // this case has no tail to play and not one figure of it changed.
      // Unmoved a third time on 2026-09-18 by S-89, the tail on the repeated stops: the sweet spot's **six**
      // bears a march — S-87 lowered the Elite sizer's eight to six to shelter them, 396 000 HP under the
      // troop floor, 21 135 368 — last the four marches too, so there is nothing here for a tail to fill.
      // **Re-based 2026-09-18 (S-87), the shelter over every hired type.** The bears are capped, so S-77 let
      // the Elite sizer stand them on top: eight of them, 528 000 HP over a lowest troop stack of 449 280.
      // Sheltered they are **six** — 396 000 HP — and the sweet spot's campaign falls from 21 732 276 to
      // **21 135 368** (32 525 600 silver either way, 4 burned). The all-in is untouched at 21 700 948 and is
      // now this case's hardest campaign, so the plan's share of the sizers is 86.5 % → **86.3 %** (the floor
      // of 0.86 still holds) and of TotalStack's priority search 82.1 % → **81.9 %**, which is the one pin
      // that moves: 0.82 → **0.81**. Both stops, both ratios and the stop count are otherwise unmoved.
      // **Re-based 2026-09-19 (S-94), the plan ranked and priced on the worst opening.** The same Archer III
      // coin flip as ×3 sat on this bar's `all-in` — 6 316 072 expected against 4 306 064 worst, 31.8 % — and
      // ranking on the bad flip buys **+25.0 %** of reliable damage a march there (5 384 084), the sizer's
      // own shape with a Spearman II put-back rather than the one giant stack. The sweet spot's six bears are
      // untouched. Shares: the sizers 0.996 → **0.988** and TotalStack's priority search 0.945 → **0.930**.
      // **Neither pin is re-based** (see ×1 above): 0.86 and 0.81 stand and both pass.
      // **The floors against Total Optimization, measured 2026-09-19 (S-101)**: 0.9987 a silver, **1.0046**
      // a monster chunk (and the same figure a soldier chunk, the bear being the only hired type and a
      // monster). This is the first of the three bear armies where the stock is large enough for the plan's
      // shape to matter, and the first where it is **ahead** of Total Optimization on the stock while still
      // a shade behind it a silver.
      pinned: {
        refuses: false,
        stops: 2,
        // Registered by the owner 2026-09-24 (W11–W13 trades, "register them all"): the sweet spot now leads the sizers, and the best damage a hired beats the sizers and the other calculators.
        sweetNotAheadOnEither: false,
        damageFloor: 0.86,
        winsHired: true,
        externals: { damageFloor: 0.81, winsHired: true },
        totalOptimization: { perSilver: 0.99, perSoldier: 1.0, perMonster: 1.0 },
        // **Dominance at matched spend, measured 2026-09-22** (S-121), the reading the owner's own
        // definition of beating another calculator reduces to. Their hardest comparable march is
        // `TotalStack · priority search under M’s (averageDamage)`,
        // and the bar's best stop inside its budget at 5 % hits **-7.04 %** against it.
        // Over all of their comparable marches the bar dominates **2/9**, and every one of them has a stop of ours inside it.
        // Only the delta is pinned, and only where a stop fits — `Pinned.matched` says why.
        matched: { fits: true, delta: -0.0704 },
      },
    },
    {
      label: 'first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)',
      request: firstRun({ id: 'epic-monster-hunter-6', cap: 83 }, 20_000),
      externals: [],
      // Measured 2026-09-18: 98.8 %, three stops (no silver saver, no more-mercs rung).
      // TotalStack's M's Preservation: 30 587 159 over four marches; the plan reaches 98.2 % and wins a hired.
      // **Re-based 2026-09-19 (S-94), every row priced on the worst opening.** The quietest army of the ten:
      // the coin flip here is 1.2–1.9 % on every stop (`out/109-reliable-damage.md` §A) and the bar does not
      // move at all — the same three stops, the same counts, the same burn. Only the level drops with the
      // reading, and it drops on the rivals too, so the two shares barely shift: the sizers 0.996 →
      // **0.993** and TotalStack's M's Preservation 0.991 → **0.987**. **Neither pin is re-based** (see the
      // bear ×1 case above): 0.98 and 0.98 stand, and both still pass.
      // **The floors against Total Optimization, measured 2026-09-19 (S-101)**: 0.9934 a silver, **1.1120**
      // a hired soldier chunk, 0.9983 a monster chunk. The hunter is a *soldier* hire, so this army's
      // monster reading is the `damage / 1` floor on both sides and says only what the damage column says;
      // the soldier reading is the live one, and it is the plan 11 % ahead on the stock for a 0.7 % loss a
      // silver — the trade the bar exists to make, on the quietest army of the fifteen.
      pinned: {
        refuses: false,
        stops: 3,
        sweetNotAheadOnEither: false,
        damageFloor: 0.98,
        winsHired: true,
        externals: { damageFloor: 0.98, winsHired: true },
        // **`perSoldier` re-pinned 1.11 → 1.04 on 2026-09-21, by the owner** (same call as the 4 000 case).
        // Measured today: **1.0410258**. Above his goal of 1.0, below the margin S-101 recorded; parked for
        // review, not accepted.
        totalOptimization: { perSilver: 0.99, perSoldier: 1.04, perMonster: 0.99 },
        // **Dominance at matched spend, measured 2026-09-22** (S-121), the reading the owner's own
        // definition of beating another calculator reduces to. Their hardest comparable march is
        // `TotalStack · M’s Preservation`,
        // and the bar's best stop inside its budget at 5 % hits **-1.26 %** against it.
        // Over all of their comparable marches the bar dominates **5/9**, and every one of them has a stop of ours inside it.
        // Only the delta is pinned, and only where a stop fits — `Pinned.matched` says why.
        matched: { fits: true, delta: -0.0126 },
      },
    },
    {
      label:
        'first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)',
      request: monsterCamp(),
      externals: [],
      // **Added 2026-09-19 (S-96), the first scenario in this file that holds a dominance pool**, and the
      // first whose plan fields a monster at all. Measured that day on the engine that widened the hired set
      // to every non-leadership pool — **three stops** (sweet spot, more mercs, steady max), each of them
      // fielding **9, 9 and 11** of the camp's 12 monster types — 95, 123 and 125 monster units — with every
      // monster stack under the lowest troop stack and **795, 879 and 898** of the 900 dominance in use, and
      // the burn counting them: 23 · 26 · 28 chunks a march, 97 · 106 · 112 over the campaign, against the
      // **0 of 12** the plan fielded on the same camp the day before (experiment 110). They are also the
      // first stops in this file to carry a **dragon-coin** price: 6 840 · 7 200 · 7 720 a march.
      //
      // **What the shares say.** The plan's hardest campaign is the steady max's 95 348 743 over four
      // marches for 35 458 800 silver, which is **0.911** of the best sizer sequence (Troops first ·
      // Generate, 104 626 942 for 37 290 800) and **0.958** of its damage a silver — so this army holds the
      // file's ordinary 95 % silver floor with no exception. Against the two plain sizer rows, the ones a
      // player actually clicks, the plan is ahead on both readings at once: Tier ladder · all types plays
      // 79 635 913 for 35 450 400 and Troops first · all types 82 845 061 for the same, where the plan's
      // *sweet spot* alone reaches 91 948 255 for 35 274 000 — more damage, less silver, and 97 chunks of
      // stock against their 114 and 113. `winsHired` is `false` because the two Generate rows search on
      // average damage and field far fewer, larger stacks (1 361 029 a chunk against the plan's 947 920),
      // and `sweetNotAheadOnEither` is `true` for the same row.
      //
      // **Nothing here is registered as a baseline**: these are the figures of the day the plan first
      // fielded a monster, and what an acceptable trade on a monster camp is, is the owner's call —
      // `tests/engine/plan-baseline.proposed.json` carries the measured bar.
      //
      // ---- **Re-measured 2026-09-19 (S-102), and the three pins below moved with it.** ----------------
      //
      // The owner: *"monsters should be there if dominance has been set and damage is interesting; they
      // have a cost in silver but in dragon coins also, which are both constrained; but at least, apart
      // from mercs, they can be trained just like troops."* So a dominance monster left the burn axis:
      // `mercLost` counts the **authority** pool alone, and a monster's price is its silver, its queue and
      // its dragon coins. This is the one army in the file that holds a dominance pool, so it is the one
      // army the change can move — the other fourteen are byte-identical to snapshot 17, the three stop
      // pins and four criteria floors that were red before it are red after it and nothing else is.
      //
      // **The bar, before → after** (S-101's snapshot 17 against this run; every figure from
      // `tools/theorycraft/out/benchmark-2026-09-19-{17-totalstack-floors,18-monsters-trained}.md`):
      //
      //   | stop          | damage                 | silver                 | burn      | coins  | a silver    | a hired               | a coin |
      //   | silver-saver  | — → 61 696 768          | — → 25 764 300          | — → 18   | 31 680 | — → 2.39    | — → 3 427 598        | 1 947  |
      //   | sweet-spot    | 91 948 255 → 77 280 595 | 35 274 000 → 35 450 400 | 97 → 24  | 28 440 → 31 680 | 2.61 → 2.18 | 947 920 → 3 220 025 | 2 439 |
      //   | more-mercs    | 94 687 477 → 78 871 786 | 35 349 600 → 35 450 400 | 106 → 26 | 29 520 → 31 680 | 2.68 → 2.22 | 893 278 → 3 033 530 | 2 490 |
      //   | steady-max    | 95 348 743 → 95 348 743 | 35 458 800 → 35 458 800 | 112 → 32 | 31 080 | 2.69 → 2.69 | 851 328 → 2 979 648 | 3 068 |
      //   | all-in        | — → 82 845 061          | — → 35 450 400          | — → 33   | 31 680 | — → 2.34    | — → 2 510 456        | 2 615  |
      //
      // The **hardest** stop does not move at all — steady-max, 95 348 743 for 35 458 800 — which is why
      // `damageFloor` is untouched at 0.91 (measured 0.9113 both days, the best sizer sequence being the
      // same 104 626 942). What moved is the *shape* of the bar and the three pins that describe it:
      //
      //  - **`stops` 3 → 5.** The bar is ordered on `repeat.mercLost`, and on this camp that figure used
      //    to be dominated by monster chunks: three stops stood at 97, 106 and 112. With the monsters off
      //    the axis the whole bar spreads over the 32 authority chunks its 83 hunters and 6 bears can lose,
      //    and the ladder finds five rungs there — 18 · 24 · 26 · 32 · 33 — including a **silver saver**
      //    and an **all-in** this camp never offered before. The silver saver is the news: 61 696 768 for
      //    **25 764 300** silver, ten million under every other answer on the table, at 18 chunks.
      //  - **`winsHired` false → true.** The plan's best damage a hired unit is the silver saver's
      //    3 427 598 against the best sizer sequence's 3 077 263 (Troops first · Generate). It was 947 920
      //    against 1 361 029 before, and the reason it was behind is the reason it is not now: the sizers'
      //    marches burn 33–34 authority chunks where the plan's thrift end burns 18, and the pooled axis
      //    hid that behind 84 monster chunks both sides were paying anyway.
      //  - **`sweetNotAheadOnEither` true → false.** No sizer sequence now matches the sweet spot on both
      //    ratios at once: the best of them a silver (2.81) is behind it a hired (3 077 263 against
      //    3 220 025), and the best a hired is behind it a silver.
      //
      // **The trade to judge, and it is a real one**: the sweet spot and the "more mercs" stop each give up
      // about 16 % of their damage (91.9 M → 77.3 M, 94.7 M → 78.9 M) and half a point of damage a silver
      // (2.61 → 2.18, 2.68 → 2.22) for roughly four times the damage a hired unit and a quarter of the burn.
      // Every stop now trains the camp's monsters to the housing — 84 chunks, **31 680 dragon coins** a
      // campaign on four of the five — because monsters are no longer rationed by an axis that made them
      // look like spent mercenaries, which is the owner's *"monsters should be there if dominance has been
      // set"*. Whether 16 % of the sweet spot's damage is worth what it buys is his call; nothing here is a
      // registered baseline and the proposal carries the measured bar.
      //
      // ---- **TotalStack answers this camp, S-103 (2026-09-19)** ---------------------------------------
      //
      // The second replay of that morning asked the page experiment 110's own camp, and its answers are the
      // first captured rows this scenario has ever had — three of them (`totalstack-rows.ts`), and the first
      // rows in this file to field a **dominance monster**, every earlier run having come back with an empty
      // `monsterCounts`.
      //
      // **What Total Optimization plays here**: **131 monster units over all 12 of the camp's types** —
      // Water Elemental 46, Battle Boar 22, Emerald Dragon 20, Stone Gargoyle 17, Gorgon Medusa 6,
      // Many-Armed Guardian 6, Ice Phoenix 5, Magic Dragon 5 and one each of Desert Vanquisher, Ettin,
      // Fearsome Manticore and Flaming Centaur — for **898 of the 900** dominance, beside **6 Bear V** and
      // **65 Epic Monster Hunter VI** of the 83 the camp holds. Priced by our engine over four marches it is
      // **79 770 931** damage for **35 454 400** silver, 32 authority chunks and **31 680 dragon coins**;
      // its Elite Preservation answer is the same march to the unit, and its M's Preservation answer drops
      // the hunter entirely (64 727 476 for 34 658 400 at 4 chunks over the campaign).
      //
      // **The four standings, all of them the plan's** (the goal line under the table, measured this day):
      // **1.1951** a silver, **1.5469** a hired soldier, **1.1953** a monster and **1.2184** a dragon coin —
      // the first army in this file measured on the coins, and the first to clear all four readings at once.
      // The damage column says the same: the plan's hardest campaign is **1.1953×** the best captured
      // answer's, which is what `externals.damageFloor` pins. `externals.winsHired` is **false** and reads
      // as an artefact of the burn rather than a loss: M's Preservation fields no hunter at all, so it burns
      // **4** chunks over four marches against the plan's 18 at its thrift end, and a damage-a-hired ratio
      // whose denominator is four is not a march anyone sends.
      //
      // ---- **The hired prefix family, S-99 (2026-09-19)** ---------------------------------------------
      //
      // The owner, shown where the plan's monster chunks go (experiment 113): *"you can drop when the damage
      // says so."* The search gained a family of shapes it had never priced — the plan over a **prefix** of
      // the hired ranking, the types worth least a point of their own pool at **zero** — and S-58 B gained a
      // **cut**, the point below which it stops asking for a little of everything. This camp is the one army
      // in the file that earns a cut — **10 of its 14** hired types, with Stone Gargoyle, Emerald Dragon,
      // Battle Boar and Water Elemental below it: the four worth least a point of dominance held 48 % of a
      // march's monster chunks for 5 % of its damage, and the pool they were sharing is what the eight above
      // them could not fill.
      //
      // **The bar, before → after** (S-103's snapshot 19 against snapshot 20, campaign figures over the
      // horizon — damage / silver / burn):
      //
      //   | stop         | damage                     | silver                  | burn     |
      //   | silver-saver | 61 696 768 → **not offered** | 25 764 300 → —        | 18 → —   |
      //   | sweet-spot   | 77 280 595 → **89 196 808**  | 35 450 400 → 35 230 800 | 24 → 24 |
      //   | more-mercs   | 78 871 786 → **93 298 414**  | 35 450 400 → 35 230 800 | 26 → 26 |
      //   | steady-max   | 95 348 743 → **97 458 367**  | 35 458 800 → 36 436 800 | 32 → 32 |
      //   | all-in       | 82 845 061 → **102 971 902** | 35 450 400 → 37 316 000 | 33 → 34 |
      //
      // Four stops gain 15.4 %, 18.3 %, 2.2 % and 24.3 % of their damage; the hardest campaign on the bar
      // goes from 95 348 743 to **102 971 902**, which is **0.984** of the best sizer sequence's four-march
      // damage where it was 0.911, and its monster chunks fall from 84 a campaign to 48. The `all-in` is the
      // march experiment 113 §D1 measured by narrowing the *request* to the top eight monster types
      // (102 971 902 for 37 316 000 on 48 monster and 30 soldier chunks) — the search reaches it by itself
      // now.
      //
      // **What each stop fields**, before → after: the five stops of snapshot 19 each stood **13 or 14** of
      // the camp's 14 hired types; the four of snapshot 20 stand **11** (sweet spot and more mercs — the
      // ranking's first eleven, Emerald Dragon, Battle Boar and Water Elemental left at home) and **10**
      // (steady max and all-in, Stone Gargoyle left out as well). The types they drop are the bottom of
      // `rankHired`: 1 545 to 1 852 damage a point of dominance against Flaming Centaur's 10 790.
      //
      // **The four standings against Total Optimization** rise with it — 1.1951 → **1.226** a silver,
      // 1.5469 → **1.565** a hired soldier, 1.1953 → **2.259** a monster and 1.2184 → **1.512** a dragon
      // coin. The pins below are left where S-103 measured them: they are floors, and a floor a run clears
      // by more than it used to is not a reason to raise the floor without the owner.
      //
      // **`stops` stays 5 and fails (the bar offers 4): a lost stop is a trade only the owner registers.** It is a trade, not a saving. The stop that goes is the **silver saver**, and
      // it goes because the sweet spot got better: that stop is offered only when a march left of the sweet
      // spot is *at least as efficient a silver* as it (`leastSilver`, `plan.ts`), and the sweet spot's own
      // damage a silver on this camp rose with the family while the thrift end's did not — the cheapest
      // rungs are mostly troops, and dropping a monster type from a march that is already small buys little.
      // The bar keeps its four other stops at the same four burn levels and every one of them hits harder.
      // Whether a thrift stop is worth 15 % of the sweet spot's damage is the owner's call; nothing on this
      // camp is a registered baseline and `plan-baseline.proposed.json` carries the measured bar.
      pinned: {
        refuses: false,
        stops: 5,
        sweetNotAheadOnEither: false,
        damageFloor: 0.91,
        winsHired: true,
        externals: { damageFloor: 1.19, winsHired: false },
        // **`perSoldier` re-pinned 1.54 → 1.52 on 2026-09-21, by the owner** (same call). Measured today:
        // **1.5252922** — the narrowest of the seven, and **masked** since S-106 behind this camp's `stops`
        // assertion (5 registered, 4 offered). Far above his goal of 1.0. The other three readings, the
        // dragon coin among them, are unmoved and still pass on this, the benchmark's largest monster camp.
        totalOptimization: { perSilver: 1.19, perSoldier: 1.52, perMonster: 1.19, perDragonCoin: 1.21 },
        // **Dominance at matched spend, measured 2026-09-22** (S-121), the reading the owner's own
        // definition of beating another calculator reduces to. Their hardest comparable march is
        // `TotalStack · Elite Preservation`,
        // and **no stop of ours fits inside its budget at 5 %** — the bar is not losing that
        // comparison, it is not in it (§3's G0).
        // Over all of their comparable marches the bar dominates **0/3**, and **3** of them have no stop of ours inside at all.
        // Only the delta is pinned, and only where a stop fits — `Pinned.matched` says why.
        matched: { fits: false },
      },
    },
    fourThousand(),
  ];
}

/**
 * **The owner's live camp of 2026-09-18**, beside the benchmark's own armies: the profile he was looking at
 * when he wrote *"mercs are unshielded on all complete optimization marches"* — arbalesters 485, legionaries
 * 1 002, bears unlimited, his three captains, 4 975 leadership and 2 180 authority, the two top guardsman
 * tiers and the top melee specialist he does not own clicked out. It is the camp experiment 106 measured
 * (`tools/theorycraft/out/106-shelter-live.md`), where **every** stop fielded hired stacks above the troops —
 * 375 legionaries and 403 arbalesters over a 274 772-HP floor at the sweet spot.
 *
 * **A benchmark scenario since S-101** (2026-09-19), where it had been a criteria-only army: the replay of
 * that day asked TotalStack this exact camp, so the one thing it was missing — a captured answer to stand
 * against — is now on its table, and an army with an outside answer belongs on the bar the benchmark draws.
 * Its request is built exactly as it always was; only its place in the file moved.
 */
const liveCamp = (owner: Profile): Scenario[] => {
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
      externals: [],
      // **Pinned 2026-09-19 (S-101), every figure measured that day.** Four stops — sweet spot, more mercs,
      // steady max, `all-in` — at 19 · 37 · 52 · 133 chunks over the campaign.
      //
      // **This is the bear-wall army, and it is why its floors read the way they do.** Its bears are
      // *unlimited*, so every rival here spends the rare stock without a ceiling: the Tier ladder sizer
      // burns **398** chunks for 43.9 M, Troops first · Generate **353** for 50.4 M, and TotalStack's Total
      // Optimization **374** for 49.2 M at 6.32 damage a silver, while the plan's hardest stop is the steady
      // max's 15.3 M for **52**. So the two damage floors are low by construction — **0.30** of the best
      // sizer sequence and **0.31** of the best captured answer — and `silverFloor` is **0.28** for the same
      // reason the evening account's was 0.41: a wall of bears costs authority and gold, not silver, and a
      // damage-a-silver column that prices it at nothing is not a yardstick the plan can be held to.
      //
      // What the plan does win, and the reason this army earns its place: **damage a hired unit**, by three
      // to five times (the sweet spot's 472 637 against the best sizer sequence's 318 635 and Total
      // Optimization's 131 630 — `winsHired` and `externals.winsHired` both true), and the two rare-stock
      // readings against Total Optimization outright: **4.2076** a hired soldier chunk and **2.1765** a
      // monster chunk. Against **0.2593** a silver, which is the widest single discrepancy on the owner's
      // goal anywhere in the fifteen and is pinned at what it measures.
      pinned: {
        refuses: false,
        stops: 4,
        sweetNotAheadOnEither: false,
        damageFloor: 0.3,
        winsHired: true,
        silverFloor: 0.28,
        externals: { damageFloor: 0.31, winsHired: true },
        // **`perSoldier` re-pinned 4.2 → 1.94 on 2026-09-21, by the owner** (same call as the 4 000 case).
        // Measured today: **1.9452876**. The widest of the four falls — this army's unlimited legionaries
        // are what made the 4.2, and the plan gets less out of a hired soldier chunk than it did — and the
        // one most worth explaining when the four are reviewed. Still above his goal of 1.0.
        totalOptimization: { perSilver: 0.25, perSoldier: 1.94, perMonster: 2.17 },
        // **Dominance at matched spend, measured 2026-09-22** (S-121), the reading the owner's own
        // definition of beating another calculator reduces to. Their hardest comparable march is
        // `TotalStack · Elite Preservation`,
        // and the bar's best stop inside its budget at 5 % hits **-77.86 %** against it.
        // Over all of their comparable marches the bar dominates **0/3**, and every one of them has a stop of ours inside it.
        // Only the delta is pinned, and only where a stop fits — `Pinned.matched` says why.
        matched: { fits: true, delta: -0.7786 },
      },
    },
  ];
};

/**
 * **His camp of 2026-09-19, at both readings of the Battle card** (S-93; the owner: *"using Troops first I can
 * get 2 009 810 … by adding back troops, impossible with Complete optimization … no eco silver spot to allow
 * me to maximize silver/dmg with lower silver and training time whilst preserving merc spent low"*).
 *
 * One hired type with a **small** stock and a small leadership — the shape no scenario above has: on this army
 * a hired stack is large enough that the ladder sheltering it can only be three rungs deep, so every stop the
 * bar offered was a three-stack march at thirteen days of queue while the seven-stack march he builds by hand
 * costs less silver, burns half as much stock and recovers in five. The two readings are the `localStorage`
 * dump of that evening (4 975 / 2 180, 450 hunters) and the figures in his message (5 100 / 2 200, 120), and
 * both are here because the stock is what the thrift end turns on. Measured in
 * `tools/theorycraft/out/107-put-back-mercs.md` and `out/108-thrift-end.md`.
 *
 * **Benchmark scenarios since S-101**, for the same reason as the live camp above: the replay of 2026-09-19
 * asked TotalStack both of them, and the four Generate answers it came back with are now rows on their
 * tables. The requests are untouched.
 */
const hisCamp = (owner: Profile): Scenario[] => {
  return (
    [
      {
        label: 'his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)',
        leadership: 4_975,
        authority: 2_180,
        cap: 450,
        // **Pinned 2026-09-19 (S-101), measured that day.** Four stops — silver saver, sweet spot, more
        // mercs, steady max — at 12 · 15 · 33 · 57 chunks; no `all-in`, this being one of the two armies
        // where the top of the bar is the steady max itself.
        //
        // **A large stock and a small leadership**, which is the shape that splits the two yardsticks
        // apart. The sizers spend the whole 450 hunters — **156** chunks over four marches — for
        // 25 012 889 at 1.796 a silver, so the plan's hardest stop (13 842 678 for 57 chunks) is
        // **0.5534** of them on damage and **0.7357** of them a silver: both floors are pinned under 1,
        // and `silverFloor` at **0.73** for the same reason the two wall armies have one. Against the
        // *captured* answers the reading inverts completely — the plan is **2.1553×** TotalStack's Total
        // Optimization on damage — because the page answers this camp with a 156-chunk march of its own
        // that hits 6 422 616, less than half of ours.
        //
        // `winsHired` is **false** by a hair and by an honest one: Troops first over every type reaches
        // 637 578 a chunk on a 12-chunk march where the plan's silver saver reaches 630 122 on the same
        // 12 — 1.2 % apart — while out-damaging that sizer row by 28 %. `externals.winsHired` is false for
        // a different reason: TotalStack's M's Preservation answers this camp by fielding **no hunter at
        // all**, so its whole campaign burns nothing and `damage / 1` puts it top of that column by
        // arithmetic rather than by a march.
        //
        // **All three floors against Total Optimization are above the goal**: **1.6034** a silver,
        // **15.3051** a hired soldier chunk (its answer burns 156 chunks to our 12 on the thriftiest stop)
        // and **2.1553** a monster chunk, which on a camp with no monster on either side is the damage
        // column read through `damage / 1`.
        pinned: {
          refuses: false,
          stops: 4,
          sweetNotAheadOnEither: false,
          damageFloor: 0.55,
          winsHired: false,
          silverFloor: 0.73,
          externals: { damageFloor: 2.15, winsHired: false },
          totalOptimization: { perSilver: 1.6, perSoldier: 15.3, perMonster: 2.15 },
          // **Dominance at matched spend, measured 2026-09-22** (S-121), the reading the owner's own
          // definition of beating another calculator reduces to. Their hardest comparable march is
          // `TotalStack · Elite Preservation`,
          // and the bar's best stop inside its budget at 5 % hits **+17.73 %** against it.
          // Over all of their comparable marches the bar dominates **2/3**, and **1** of them have no stop of ours inside at all.
          // Only the delta is pinned, and only where a stop fits — `Pinned.matched` says why.
          matched: { fits: true, delta: 0.1773 },
        } as Pinned,
      },
      {
        label: 'his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)',
        leadership: 5_100,
        authority: 2_200,
        cap: 120,
        // **Pinned 2026-09-19 (S-101), measured that day.** Four stops — sweet spot, more mercs, steady
        // max, `all-in` — at 25 · 34 · 39 · 41 chunks, the tight ladder a small stock draws.
        //
        // The same camp at the reading of his own message, and **the stock is the whole difference**: with
        // 120 hunters instead of 450 the sizers can only spend 42 chunks, their best sequence reaches
        // 11 426 058, and the plan's `all-in` **beats it** — 11 585 381, a share of **1.0139** — at
        // **1.0811** of its damage a silver, so this army holds the file's ordinary 95 % silver floor with
        // no exception where its 450-hunter sibling needs one. Against the captured answers it is
        // **1.7593×** Total Optimization on damage.
        //
        // `winsHired` and `externals.winsHired` are false for the same two reasons as the sibling: Troops
        // first over every type reaches 656 059 a chunk on a 12-chunk march (the plan's best stop is the
        // sweet spot's 406 254 on 25), and TotalStack's M's Preservation again fields **no hunter at all**.
        // **All three floors against Total Optimization clear the goal**: **1.2967** a silver, **2.5911** a
        // hired soldier chunk, **1.7593** a monster chunk.
        pinned: {
          refuses: false,
          // Registered by the owner 2026-09-24 (W11–W13 trades, "register them all"): five stops (the fold, W10), and the best damage a hired now beats the sizers and the other calculators (7fe146c).
          stops: 5,
          sweetNotAheadOnEither: false,
          damageFloor: 1.01,
          winsHired: true,
          externals: { damageFloor: 1.75, winsHired: true },
          totalOptimization: { perSilver: 1.29, perSoldier: 2.59, perMonster: 1.75 },
          // **Dominance at matched spend, measured 2026-09-22** (S-121), the reading the owner's own
          // definition of beating another calculator reduces to. Their hardest comparable march is
          // `TotalStack · Elite Preservation`,
          // and **no stop of ours fits inside its budget at 5 %** — the bar is not losing that
          // comparison, it is not in it (§3's G0).
          // Over all of their comparable marches the bar dominates **0/3**, and **3** of them have no stop of ours inside at all.
          // Only the delta is pinned, and only where a stop fits — `Pinned.matched` says why.
          matched: { fits: false },
        } as Pinned,
      },
    ] as const
  ).flatMap(({ label, leadership, authority, cap, pinned }) => {
    const camp = structuredClone(owner);
    camp.sources.captains = [
      { id: 'ww8j0qwv', captainId: 'aydae', level: 43, star: 3 },
      { id: '9kfdv1z0', captainId: 'alexander', level: 36, star: 0 },
      { id: 'h9i5fjdc', captainId: 'leonidas', level: 41, star: 0 },
    ];
    camp.troops.topTierExcluded = { guardsmen: ['melee', 'ranged'], specialists: ['melee'] };
    camp.mercenaries.selected = [{ id: 'epic-monster-hunter-6', cap }];
    const setup = camp.setups[0];
    if (!setup) return [];
    return [
      {
        label,
        request: buildStackRequest(camp, {
          ...setup,
          active: { ...setup.active, captains: ['h9i5fjdc', '9kfdv1z0', 'ww8j0qwv'] },
          housing: { ...setup.housing, leadership, authority },
        }),
        externals: [],
        pinned,
      },
    ];
  });
};

/**
 * **His own TotalStack profile, as it stood on 2026-09-19** (S-103) — scenario 16, and the one army on this
 * table whose request is not a reconstruction of what the page was asked but *the request itself*: every
 * figure below is read off the body the second replay sent
 * (`docs/research/fixtures/totalstack-2026-09-19-replay-v2.json`, the scenario `his TotalStack profile
 * 2026-09-19`), which is the page's own template filled in by him in his own browser.
 *
 * **What it is**: **5 225** leadership, **2 120** authority and **100** dominance; guardsmen I–III with the
 * top **melee and ranged** tiers clicked out (so Archer III and Spearman III are gone and Rider III stands);
 * specialists I; the **monster window on tier 3 alone**, which is the four types `src/data` holds there
 * (Battle Boar, Emerald Dragon, Stone Gargoyle, Water Elemental); **Epic Monster Hunter V ×80** hired; his
 * own bonuses as he typed them into the page — **guardsmen +60 health and +60 strength, army +3 and +3** —
 * an even enemy formation and temple 0.
 *
 * **Three readings of his profile are deliberately not ours to change, and each is worth stating.**
 *
 *  - **Swordsman I is on the field here**, where every other owner scenario in this file leaves it out. His
 *    Pyrrhic export clicks out the top *melee specialist* and its specialist window is I–I, so the two
 *    together remove the type; the profile he gave TotalStack excludes no specialist category at all
 *    (`specialistExcludedCategories: []`, `excludedTroopIds: []`) and its answers field 1 257 to 1 264 of
 *    them. This scenario is *his TotalStack profile*, so it holds what that profile holds — and it has to:
 *    an army without Swordsman I would make all four captured answers rows the player cannot make
 *    (`comparable: false`, `plan-benchmark.test.ts`), and the scenario would stand against nothing.
 *  - **Bear V and Cyclops V are capped but not hired.** His `mercenaryCaps` carries six of each, and his
 *    `selectedMercenaryIds` carries **only** the hunter — a cap is what the account owns, the selection is
 *    what the march may field — so the page fields neither, and neither is selected here. Handing our plan
 *    two monster mercenaries the page was not offered would win the comparison in the setup rather than on
 *    the field.
 *  - **The bonuses are his page's, not his export's.** The other owner scenarios derive their totals from
 *    his captains through `buildStackRequest`; this one overrides them with the single source below, so the
 *    quotients under its table are two answers to *one* army rather than two arithmetics — which is the
 *    whole reason a scenario built from a captured request is worth having.
 */
/**
 * **Pinned 2026-09-19 (S-103), measured that day**, on the bar the engine offers for his page's own army.
 *
 * **Three stops** — a silver saver at 7 authority chunks (4 919 095 over four marches for **4 431 600**
 * silver), the sweet spot at 19 (8 182 228 for 8 340 000) and the steady max at 25 (8 408 431 for
 * 8 702 400) — and **no `all-in`**, the bar offering one only where it is not behind the top stop on every
 * figure a stop prints (S-94) and this army's not being offered. Every one of the three fields **all four**
 * tier-3 types — 18 units for 97 dominance at the thrift end, 20 for 99 at the other two — which is **16
 * monster chunks** and **3 840 dragon coins** a campaign, so the coins are a real column here rather than
 * the `damage / 1` the fourteen older armies read. (Total Optimization fields 19 units for the whole 100.)
 *
 * **Against the sizers**: `damageFloor` **0.97** — the hardest campaign is 8 408 431 against Troops first ·
 * Generate's 8 647 583, the narrowest gap of any army in this file that is not a wall — and `winsHired` is
 * true by a wide margin (702 728 a chunk at the thrift end against 479 623). The plan's best stop a silver
 * is **1.110**, **1.156×** the best sizer sequence's, so the file's ordinary 95 % silver floor holds with
 * no exception, and no sizer sequence matches the sweet spot on both ratios at once.
 *
 * **Against his page**: the plan is ahead on all four readings, and this is the like-for-like table the
 * whole scenario exists for — the same army, the same bonuses, the same stock, the same enemy, one search
 * against the other. **1.3080** a silver, **3.0058** a hired soldier, **1.2402** a monster and **1.2402** a
 * dragon coin (the last two are equal because both sides train exactly the same 16 chunks for the same
 * 3 840 coins, so the quotient is the damage column). Total Optimization answers this profile with
 * **6 779 808** for 7 989 200 silver at 29 chunks; the plan's steady max hits 24 % harder for 9 % more
 * silver, and its silver saver hits 73 % as hard for **55 %** of the silver at a quarter of the burn.
 * `externals.winsHired` is **false** for the reason it is false on the monster camp: M's Preservation
 * fields no hunter at all here either (5 187 364 at **0** burned), so the ratio's denominator is the floor
 * of 1 that `perHired` uses rather than a stock any march spent.
 */
const TOTALSTACK_PROFILE_PINS: Pinned = {
  refuses: false,
  stops: 3,
  sweetNotAheadOnEither: false,
  damageFloor: 0.97,
  winsHired: true,
  externals: { damageFloor: 1.24, winsHired: false },
  // **`perMonster` re-pinned 1.24 → 0.91 on 2026-09-21, by the owner** (same call). Measured today:
  // **0.9114433**, and this is the one of the seven that is **below his goal of 1.0** — the plan gets less
  // damage out of a monster chunk here than TotalStack's Total Optimization does. It is the `✗` the run's
  // goal line has been printing on this army, so it was never hidden from a reader; what was hidden is that
  // the *pin* was short too, behind this scenario's `externals.winsHired` assertion. **The most important
  // of the seven to review**: it is a dominance reading, on one of the three armies here that house a
  // dominance pool, and S-116 is about exactly that ordering. `perDragonCoin` 1.24 is met at 1.2402 and is
  // left alone.
  totalOptimization: { perSilver: 1.3, perSoldier: 3.0, perMonster: 0.91, perDragonCoin: 1.24 },
  // **Dominance at matched spend, measured 2026-09-22** (S-121), the reading the owner's own
  // definition of beating another calculator reduces to. Their hardest comparable march is
  // `TotalStack · Elite Preservation`,
  // and the bar's best stop inside its budget at 5 % hits **+20.69 %** against it.
  // Over all of their comparable marches the bar dominates **2/3**, and **1** of them have no stop of ours inside at all.
  // Only the delta is pinned, and only where a stop fits — `Pinned.matched` says why.
  matched: { fits: true, delta: 0.2068 },
};

const totalStackProfile = (owner: Profile): Scenario[] => {
  const camp = structuredClone(owner);
  camp.troops.guardsmen = { min: 1, max: 3 };
  camp.troops.specialists = { min: 1, max: 1 };
  camp.troops.monsters = { min: 3, max: 3 };
  camp.troops.topTierExcluded = { guardsmen: ['melee', 'ranged'], specialists: [] };
  camp.mercenaries.selected = [{ id: 'epic-monster-hunter-5', cap: 80 }];
  camp.recovery = { ...camp.recovery, templeLevel: 0 };
  const setup = camp.setups[0];
  if (!setup) return [];
  /** His bonuses as the page holds them: guardsmen +60 / +60 and army +3 / +3, and nothing else. */
  const source: ResolvedSource = {
    id: 'totalstack-profile-2026-09-19',
    label: 'his TotalStack profile',
    kind: 'custom',
    health: { guardsmen: 60, army: 3 },
    strength: { guardsmen: 60, army: 3 },
  };
  const request = buildStackRequest(camp, {
    ...setup,
    // No captain is active: the totals below replace the export's derived bonuses outright, and an active
    // list that still named three would read as if they were in them.
    active: { ...setup.active, captains: [] },
    housing: { leadership: 5_225, authority: 2_120, dominance: 100 },
  });
  return [
    {
      label:
        'his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80)',
      request: { ...request, totals: aggregateBonuses([source]) },
      externals: [],
      pinned: TOTALSTACK_PROFILE_PINS,
    },
  ];
};

/**
 * **Pinned 2026-09-19 (S-106), measured that day** on the bar the engine offers for the camp he plays.
 *
 * **Two stops** — the sweet spot at 2 authority chunks a march (11 417 051 over four marches for 8 090 400
 * silver, 5 760 dragon coins) and the steady max at 4 (11 721 371 for 8 695 200 and 4 320 coins) — and this
 * is the army his *"I only get sweet spot and steady max"* was read off. **Two is what its ladder holds**:
 * the burn ladder is **1 · 2 · 4** and nothing else, so there is no rung strictly inside the gap between the
 * knee and the top for a *more mercs*, and its thrift rung is **21 % less efficient a silver** than the
 * sweet spot (1.256 against 1.440, 2 497 753 for 1 989 000 against 2 924 497 for 2 031 000) — 2 % of the
 * silver saved for 15 % of the damage given up — so the silver saver's own rule refuses it, as it should.
 *
 * Before S-105 this bar carried three, and the third was not a saving: the ratio rule threw the **top** rung
 * out of the pool the knee is read off, which put the recommendation on the thriftiest march of the three —
 * 10 136 819 against the 11 417 051 the knee now recommends, 11 % less damage for 1.5 % less silver. S-106
 * leaves the better recommendation in place and does not manufacture a stop to sit under it.
 *
 * **Against the sizers**: the hardest campaign on the bar is the steady max's 11 721 371 against the best
 * sizer sequence's 11 892 528 (Troops first · Generate), which is **0.9856** — hence the 0.98 floor, the
 * narrowest of any army in this file — and `winsHired` is true by a wide margin, **422 679** a chunk at the
 * sweet spot against the sizers' best 307 403 (Troops first over every type). The plan's best stop a silver
 * is **1.41**, 1.32× the best sizer sequence's, so the file's ordinary 95 % silver floor holds with no
 * exception, and no sizer sequence is at least as efficient as the sweet spot on both ratios at once.
 *
 * There is no captured answer for this camp — the priority-search route has refused every call since
 * 2026-09-19 — so it carries neither an `externals` block nor a Total Optimization floor.
 */
const USUAL_SETUP_PINS: Pinned = {
  refuses: false,
  stops: 2,
  sweetNotAheadOnEither: false,
  damageFloor: 0.98,
  winsHired: true,
  /**
   * **Its first captured answers, 2026-09-22 (S-119)** — the camp he actually plays, and until this capture
   * the benchmark scored it against nothing at all. The Generate route answered all four flag sets; the
   * `optimize` route came back 403 as it did on 2026-09-19, so there is no `priority search` row here.
   *
   * The plan's hardest campaign is **1.2786×** the best comparable captured row (`Total Optimization` and
   * `Elite Preservation` tie there; `M's Preservation` is weaker at 1.6513), and its best damage a hired
   * soldier chunk beats theirs outright — **422,679 against 0**, their M's Preservation fielding no
   * mercenary at all on this army.
   */
  /**
   * **Re-pinned 1.27 → 1.04 on 2026-09-22**, for the same reason as `Aydae alone` above: the completed
   * capture gave this army its priority-search rows, and its hardest is now
   * **`priority search under M's (damagePerSilver)`**, which the plan reaches **1.0432** of. Still ahead of
   * every calculator here on damage — the margin is what the fuller comparison took away, not the lead.
   *
   * **`winsHired` flips to `false` on the same evidence**: their priority searches get **461,105** out of a
   * hired soldier chunk where our best stop gets 422,679. Against the *sizers* the plan still wins it
   * (307,403), which is what the unqualified `winsHired: true` above still pins.
   */
  externals: { damageFloor: 1.04, winsHired: false },
  /**
   * **All four readings are at or above his goal here**, which makes this the third of the three
   * dominance-housing armies to clear it and the only one of them that does so on every reading: damage a
   * silver **1.3007**, damage a monster **1.0244**, damage a dragon coin **1.2786**.
   *
   * `perSoldier` is pinned at the damage ratio because **this army hires one type and their answer spends
   * none of it in chunks their side counts** — the reading is non-finite and `check` skips it. The monster
   * and coin readings are the live ones, this being one of the three armies on the table that houses a
   * dominance pool (200) and spends coins on it.
   */
  totalOptimization: { perSilver: 1.29, perSoldier: 0.96, perMonster: 1.28, perDragonCoin: 1.27 },
  // **Dominance at matched spend, measured 2026-09-22** (S-121), the reading the owner's own
  // definition of beating another calculator reduces to. Their hardest comparable march is
  // `TotalStack · priority search under M’s (damagePerSilver)`,
  // and the bar's best stop inside its budget at 5 % hits **+4.32 %** against it.
  // Over all of their comparable marches the bar dominates **5/9**, and **4** of them have no stop of ours inside at all.
  // Only the delta is pinned, and only where a stop fits — `Pinned.matched` says why.
  matched: { fits: true, delta: 0.0432 },
};

/**
 * **His usual setup, as his own app showed it on 2026-09-19** (S-106) — scenario 17, and the army his
 * *"it seems the last change made us lose some of the stops on the slider. I only get sweet spot and steady
 * max in my usual setup"* was read off. It is the camp he plays: **Aydae 43★3 alone** of his three captains,
 * **5 200** leadership, **2 000** authority and **200** dominance, guardsmen I–III with the top melee and
 * ranged tiers clicked out (so Archer III and Spearman III are gone and Rider III stands), specialists I
 * (Swordsman I is on the field, and the search leaves it out of the harder stops), the **monster window on
 * tier 3** — Battle Boar, Emerald Dragon, Stone Gargoyle, Water Elemental — **Epic Monster Hunter VI ×90**
 * hired, and temple 0.
 *
 * **The bonuses are the export's own**, derived through `buildStackRequest` from the sources his profile
 * carries with Aydae the one active captain: the eight permanent rows, of which only **Army Modernization**
 * holds values (+2 health on melee, ranged and mounted), which is what his page's *"Other: 2 of 8 sources
 * on"* is counting. Nothing is overridden here — unlike his TotalStack profile above, this is his Pyrrhic
 * account as it stands.
 *
 * **How close it is to his screen.** The steady max's march is his, to the unit: Archer I 1 313 · Rider I
 * 654 · Archer II 726 · Spearman II 725 · Rider II 361 · Rider III 203 · Epic Monster Hunter VI 32 · Water
 * Elemental 18 · Battle Boar 8 · Emerald Dragon 7 · Stone Gargoyle 6, for **2 232 600** silver, **2 976**
 * gold, **1 080** dragon coins, 7 d 11 h of queue and **4** hired units lost — every one of those figures
 * his, and the worst opening **3 025 937** against the 3 041 561 his app printed, **0.51 % under**. The
 * counts being identical to the unit, the gap is a bonus his live account carries and this export does not.
 */
function usualSetup(profile: Profile): Scenario[] {
  const camp = structuredClone(profile);
  camp.sources.captains = [{ id: 'ww8j0qwv', captainId: 'aydae', level: 43, star: 3 }];
  camp.troops.guardsmen = { min: 1, max: 3 };
  camp.troops.specialists = { min: 1, max: 1 };
  camp.troops.monsters = { min: 3, max: 3 };
  camp.troops.topTierExcluded = { guardsmen: ['melee', 'ranged'], specialists: [] };
  camp.mercenaries.selected = [{ id: 'epic-monster-hunter-6', cap: 90 }];
  camp.recovery = { ...camp.recovery, templeLevel: 0 };
  const setup = camp.setups[0];
  if (!setup) return [];
  return [
    {
      label:
        'his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90)',
      request: buildStackRequest(camp, {
        ...setup,
        active: { ...setup.active, captains: ['ww8j0qwv'] },
        housing: { leadership: 5_200, authority: 2_000, dominance: 200 },
      }),
      externals: [],
      pinned: USUAL_SETUP_PINS,
    },
  ];
}

/**
 * **The armies the criteria are held on** — the shared scenario list, built once and read by
 * `tests/engine/plan-criteria.test.ts` and by the theorycraft experiments that measure a rule against the
 * same set (`tools/theorycraft/112-band-yardstick.test.ts`). **Seventeen** since S-106 (2026-09-19; sixteen from
 * S-103 until his usual setup was appended), the
 * fifteen of S-101 in the same order and under the same labels with **his own TotalStack profile** appended
 * after them, and since S-101 they are simply *the benchmark's own scenarios*: the three camps this function
 * used to append by hand — the live camp of 2026-09-18 and his camp of 2026-09-19 at both readings of the
 * Battle card — are benchmark scenarios in their own right now (the replay of that day gave each of them a
 * captured answer to stand against), so appending them here a second time would hold every criterion on the
 * same army twice.
 *
 * The sixteenth is here for the same reason and by the same route: nothing is added to this list, it is
 * `commonScenarios` and `ownerScenarios` as they stand, so an army the benchmark measures is an army every
 * criterion is held on — which is what S-103 wanted of his profile, the one request on the table the page
 * itself was handed.
 *
 * It lives here rather than in the criteria file so that an experiment measuring a change to a rule
 * measures it on exactly the armies the criteria will judge it on — a list copied into an experiment drifts
 * from the one that holds the engine, which is what happened between experiment 108 and S-97's three new
 * armies.
 */
export function criteriaScenarios(): { label: string; request: StackRequest; pinned?: Pinned }[] {
  const profile = ownerProfile();
  return [...commonScenarios(), ...(profile ? ownerScenarios(profile) : [])];
}

/**
 * **Pinned 2026-09-24 (experiment 174), measured that day** with `CampaignInput.allInDescending` on (the
 * engine's default). Two stops — the sweet spot, ten hunters a march (16 842 084 over four marches for
 * 9 480 000 silver, 4 hunters lost), and the `all-in`, which spends the stock the way it falls:
 * **14 · 12 · 10 · 9** hunters for 17 086 508 at 9 479 200, 6 lost. Before 174 the all-in played the sweet
 * spot's 10 · 10 · 10 · 10 and was beaten by it on damage, silver, gold and queue (15 920 012 for 9 965 600
 * against 16 334 608 for 9 438 400), which S-94 could not see: both burned the same four chunks.
 *
 * No calculator outside this repo has answered this camp, so it carries neither `externals` nor the Total
 * Optimization floors, and the §7 standing does not count it.
 */
const BROWSER_SETUP_PINS: Pinned = {
  refuses: false,
  stops: 2,
  sweetNotAheadOnEither: false,
  // The all-in's 17 086 508 over the best sizer sequence's 17 013 922: 1.0043. Registered by the owner
  // 2026-09-24: 1.16 was measured while his saved "Hired units in tens" rounded the sizers' hunters down (14 714
  // 896); the plan now ignores that option ("Plan ignores it"), the sizers field their hunters whole, and the
  // plan stays ahead by 0.4 %.
  damageFloor: 1.0,
  // The same change: the plan's best damage a hired unit now beats the sizers (it did not while they rounded).
  winsHired: true,
};

const BROWSER_SETUP = new URL('../fixtures/owner-browser-2026-09-24.json', import.meta.url);

/**
 * **His browser setup of 2026-09-24** (owner: *"why all in on my current setup in my browser doesn't up the
 * mercs to 14? … Check why there's no test for that and add it to test and benchmark"*) — scenario 18, read
 * from `tests/fixtures/owner-browser-2026-09-24.json` (his localStorage, the active setup only) through the
 * app's own request builder (`buildPlanRequest`), so it is the request his Generate button sends: **Aydae 50
 * ★3**, **5 600** leadership, **2 180** authority and **600** dominance, guardsmen I–III with the top melee and
 * ranged tiers clicked out (Rider III stands), specialists I with the top melee out, the **monster window on
 * tier 3**, **Epic Monster Hunter VI ×14** hired, temple 19, and the selective recovery that revives monsters.
 *
 * The capture left the saved marches out, and the profile schema requires the list, so it is read as empty.
 */
export function browserSetupRequest(): StackRequest {
  const raw = JSON.parse(readFileSync(BROWSER_SETUP, 'utf8')) as { payload: { savedStacks?: unknown[] } };
  raw.payload.savedStacks ??= [];
  const parsed = parseImport(JSON.stringify(raw));
  if (parsed.kind !== 'profile') throw new Error('the browser setup fixture is not a profile');
  const profile = parsed.payload;
  const setup = profile.setups.find((one) => one.id === profile.activeSetupId) ?? profile.setups[0];
  if (!setup) throw new Error('the browser setup fixture has no setup');
  return buildPlanRequest(profile, setup).request;
}

function browserSetup(): Scenario[] {
  return [
    {
      label:
        'his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14)',
      request: browserSetupRequest(),
      externals: [],
      pinned: BROWSER_SETUP_PINS,
    },
  ];
}
