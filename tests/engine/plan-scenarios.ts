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
import { buildStackRequest } from '@/state/derive';
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

/** A first-run army (Guardsmen I–III, Specialists I, no bonuses) with one hired type at a stock. */
function firstRun(hired: { id: string; cap: number }, leadership: number): StackRequest {
  const profile = newProfile('first run');
  profile.mercenaries.selected = [hired];
  const setup = profile.setups[0];
  if (!setup) throw new Error('no setup');
  return buildStackRequest(profile, { ...setup, housing: { leadership, authority: 40_000, dominance: 0 } });
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
    pinned: {
      refuses: false,
      stops: 3,
      sweetNotAheadOnEither: false,
      damageFloor: 0.96,
      winsHired: true,
      externals: { damageFloor: 0.93, winsHired: true },
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
      pinned: {
        refuses: false,
        stops: 4,
        sweetNotAheadOnEither: false,
        damageFloor: 0.89,
        winsHired: true,
        externals: { damageFloor: 1.42, winsHired: false },
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
      pinned: {
        refuses: false,
        stops: 5,
        sweetNotAheadOnEither: false,
        damageFloor: 0.96,
        winsHired: true,
        externals: { damageFloor: 1.36, winsHired: false },
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
      pinned: {
        refuses: false,
        stops: 4,
        sweetNotAheadOnEither: false,
        damageFloor: 0.99,
        winsHired: true,
        externals: { damageFloor: 1.02, winsHired: true },
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
      pinned: {
        refuses: false,
        stops: 5,
        sweetNotAheadOnEither: false,
        damageFloor: 0.37,
        winsHired: true,
        silverFloor: 0.41,
        externals: { damageFloor: 0.37, winsHired: true },
      },
    },
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
      pinned: { refuses: false, stops: 1, sweetNotAheadOnEither: true, damageFloor: 0.77, winsHired: false },
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
      pinned: { refuses: false, stops: 1, sweetNotAheadOnEither: true, damageFloor: 0.78, winsHired: false },
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
      pinned: {
        refuses: false,
        stops: 2,
        sweetNotAheadOnEither: true,
        damageFloor: 0.79,
        winsHired: false,
        externals: { damageFloor: 0.75, winsHired: false },
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
      pinned: {
        refuses: false,
        stops: 2,
        sweetNotAheadOnEither: true,
        damageFloor: 0.86,
        winsHired: false,
        externals: { damageFloor: 0.81, winsHired: false },
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
      pinned: {
        refuses: false,
        stops: 3,
        sweetNotAheadOnEither: false,
        damageFloor: 0.98,
        winsHired: true,
        externals: { damageFloor: 0.98, winsHired: true },
      },
    },
    fourThousand(),
  ];
}
