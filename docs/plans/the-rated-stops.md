# The rated stops — implementation plan (W24)

**Status (2026-10-16): the owner picked R3·P1·f95·>5·tb; it is on in `CAMPAIGN.planFixes.ratedStops` (§12), uncommitted. Two goldens move (plans, raise), not re-based.**

The owner, 2026-10-14: *"I think there's rows with great rating still getting lost."* Experiments 239 and 240
showed that adding marches to the search does not fix this; the rule that picks each stop has to change. This
plan is that rule.

---

## 0. The finding, in one paragraph

Experiment 239 found the owner's 10-14 march: the Elite sizer's sheltered maximum with SW1 and ARC1 taken out,
trimmed to 40 hunters. It hits **9,858,253 at burn 4** against the sweet spot's 9,778,542 at burn 3, for −5.5 %
silver, −33 % gold, −30 % coins and −19 % queue (rating **+6.0**). It now reaches the bar only as the thrifty
stop. Experiment 240 (`out/240-the-types-out-search.md`) fed that family to the frontier itself
(`CampaignInput.typesOutSearch`, off by default). **The sweet spot did not move**: it is the knee of damage
against burn over the ladder (`sweetSpotBase`, `plan.ts`), and the ladder keeps one march per burn level, the
one with the most damage. Neither rule asks the owner's rating. The added marches moved other stops instead:
22 stops on 9 of 21 armies, and several got worse (12 000 export sweet spot −28.3 % damage, rating −10.4; the
10-13 and 10-14 burn savers −25.2 and −20.1). **So the gap is a pick rule, not a search**, as it was in W10 §0.

---

## 1. The metric set

The mandatory set of `the-stops-the-bar-offers.md` §1, unchanged: damage (worst opening), silver, merc burn,
gold, dragon coins, queue, and the ratios damage a silver and damage a merc. Every table prints all of them,
plus the **rating** `rate(old stop, new stop, CAMPAIGN.markerRates)` (`engine/rating.ts`; rates silver 5,
gold 5, hired 5, coins 8, queue 40). Figures are one repeated march at the app's horizon
(`CAMPAIGN.marches`, 4) and default recovery.

---

## 2. Where the rating is lost today

Two places, both downstream of the frontier:

1. **The ladder** (`ladderRows`, ~`plan.ts:5982`): one march a burn level, **the most damage at that level**.
   A march at the same burn with 1 % less damage and 30 % less silver and queue never becomes a rung, so no
   stop can be it. The put-back pass (`putBackOn`) re-rates a rung's own troop types, but only starting from
   the march the ladder already chose.
2. **The stops** (`sweetSpotBase`, `moreMercs`, `leastSilver`, the burn saver): each is defined on burn and
   damage (knee, middle of the gap, cheapest), never on the rating. A march one chunk away that rates higher
   is never compared.

---

## 3. The candidate rules

Three rules, from least to most invasive. Each is a `CampaignInput` option, off by default, so the
experiment can run them side by side against HEAD.

| rule | what changes | 10-14 sweet spot can become the 9.86M march? |
|---|---|---|
| **R1 rated rungs** | per burn level, the rung is the band march **best rated against the most-damage march at that level** (rating > 0 required, else the most-damage march stays) | no (it is at burn 4, the sweet spot at 3), but the burn-4 rung may become it and the knee may move |
| **R2 rated stop, same burn** | after the stops are chosen, each stop takes the band march at **its own burn or less** that rates highest against it, if rating > `minRating` | no |
| **R3 rated stop, ±1 chunk** | as R2, but the burn may also rise **one chunk**; the burn cost is already in the rating (`hired: 5`) | yes (rating +6.0, measured in 239) |

**The pool**, for each rule, read two ways:
- **P0**: the band as it is (`candidates`).
- **P1**: the band plus the types-out family as a **side pool** (the TradeRows the thrifty pass builds,
  `FifthStopRule.dropTypes`/`trims`). It is not put on the frontier, so the search and the yardstick stay as
  they are; 240 showed the frontier route moves unrelated stops.

That gives six arms: R1·P0, R1·P1, R2·P0, R2·P1, R3·P0, R3·P1.

---

## 4. The gates every swap passes

A swap the gates refuse leaves the stop as it was. The gates are the ones the bar already holds, plus
non-regression:

1. **Rating**: `rate(current, candidate, markerRates) > minRating` (start at 0; the experiment sweeps 0, 1, 2, 5).
2. **The ten readings**: the bar's `tenReadings` (`plan.ts:~7388`) loses nothing. This is the rated re-typing's
   gate (W14 §2); the swap must not buy its rating with a reading the bar held.
3. **Names stay true**: the silver saver stays the cheapest, the burn saver the fewest burned, steady max the
   most damage of the staircase (`namesHold`, as in the finale pass).
4. **Order**: along the burn, every rung burns more and hits harder than the one to its left (S-61;
   `plan-stops.test.ts`). The thrifty stop stays outside the staircase as it is now.
5. **The march gates**: ≥ 2 troop stacks, every hired stack sheltered under the lowest troop stack, every
   stock lasts the horizon, S-58 B (`fieldsRequired`).
6. **No duplicate**: a march already on the bar is not offered twice (`sameCounts`). If R3 moves the sweet
   spot onto the thrifty march, the thrifty stop runs after it as now and finds its next pick or none.

---

## 5. Experiment 241 — the rated stops

`tools/theorycraft/241-the-rated-stops.test.ts`, same harness as 240: 19 benchmark armies plus the owner's
10-13 and 10-14 exports (`PYRRHIC_HORIZON_EXPORT`), each planned at HEAD and under each arm.

**Step 1 (diagnostic, no rule):** for every army and every stop, list the band's best-rated march within
burn −1/0/+1 of the stop, with its rating and all markers. This is the ceiling: if no arm can find more than
step 1 lists, the rule is not worth its pins.

**Step 2 (the six arms × minRating 0/1/2/5):** per army and stop, before → after on every marker, and the
rating. Counts reported:
- stops better (rating > 0), equal, **worse** (any stop rating < 0, or any of the ten readings lost);
- stops that moved burn level;
- bars whose stop count changed;
- plan ms, HEAD vs arm.

**Pass bar for an arm:** **0 stops worse on all 21 armies** (the non-regression rule; only the owner can accept
a trade), and at least the 10-14 case improved for R3.

Outputs `out/241-the-rated-stops.{md,json}`; the md leads with a summary table like 240's, then every army
and every stop.

---

## 6. The decision owed to the owner

After 241, the owner picks:
- **the arm** (rule × pool) and `minRating`;
- **R3's burn allowance**: one chunk, or a share of the stop's burn;
- whether the thrifty stop stays when R3 already offers its march as the sweet spot (it may then find nothing
  on 10-14, which is correct, or a second march);
- whether to keep `typesOutSearch` (240's switch) as a tool or remove it. Recommendation: remove it once 241
  ships, since the side pool P1 replaces it.

---

## 7. The change, once chosen

- `src/engine/plan.ts`: one pass, `ratedStops`, after the put-back and re-typing passes and **before** the
  thrifty pass, so the thrifty stop reads the final sweet spot. R1 sits instead where `ladderRows` is built.
- `CampaignInput.ratedStops?: { rule: 'rungs' | 'same-burn' | 'one-chunk'; minRating: number; typesOut: boolean }`.
- `src/config.ts`: `CAMPAIGN.planFixes.ratedStops` with the chosen values, documented in the config file (the
  only place a setting lives, per the horizon note).
- The types-out side pool: lift `typesOut` out of the thrifty pass into a shared helper built once per plan,
  read by both passes.
- Kernel: none expected. The pass reads rows already priced; `rate` is plain TS. If 241 shows a cost above
  noise, measure first, then decide.

---

## 8. Tests

- `tests/engine/plan-rated-stops.test.ts`: on every benchmark army, every swapped stop rates > `minRating` against the stop
  it replaced (computed with the option off), the ten readings hold, the names hold, the order holds.
- `plan-stops.test.ts`, `plan-criteria.test.ts`: unchanged rules; they must stay green.
- `tools/theorycraft/thrifty-stop.unit.test.ts`: pin the new config keys.
- Pins that move (`plan-benchmark` stops, the plans/raise/advisor goldens) are **reported, not re-based**; the
  owner registers them.

---

## 9. Risks, and what is not established

- **The knee moves under R1.** Changing rungs changes the chord and the efficient rungs, so the sweet spot
  can jump a burn level. That is a stop moving for a reason other than its rating; 241 step 2 reports it
  separately.
- **The rating has no damage floor.** At `queue: 40` a big queue saving can outweigh a small damage loss; a
  steady max that loses damage breaks its name, and gate 3 catches it. For the other stops the owner may
  want a damage floor like the thrifty stop's 0.8. Ask after 241, don't assume one.
- **One march per burn level** is a display rule as well as a search one. R2/R3 keep it; R1 changes which
  march stands for a level, not how many.
- **Not established:** that any arm passes with 0 stops worse. 240 is the warning: adding to the pool moved
  12 000 export's sweet spot by −28 %. The gates in §4 are designed to stop that, but only the experiment
  shows they do.

---

## 10. Order

1. 241 step 1 (diagnostic) → report to the owner with the ceiling.
2. Build the three rules behind the option, the side pool helper; 241 step 2.
3. Owner picks the arm (§6).
4. Config + test + doc; full suite; report the pins that moved; commit only on the owner's word.

---

## 11. Results (2026-10-15)

Reports: `tools/theorycraft/out/241-the-rated-stops.md` (step 1) and `241-the-rated-stops-arms.md` (step 2), 21 armies
(19 benchmark + the owner's 10-13 and 10-14 exports).

**Step 1, the ceiling** (83 stops). Raw, 37 stops have a better-rated march at burn −1/0/+1, but most break their
name: the top hits are silver savers doubling their silver. With gates 3 and 4 (names, order): **19** (17 not
already on the bar); with a 95 % damage floor as well: **14** (12). Steady max and all-in: **0** under the gates. The
gain sits on the burn saver and the sweet spot. 10-14 sweet spot, best gated: a types-out march at the same burn,
−5.0 % damage, −15 % silver, −36 % gold, −33 % queue, rating **+10.6** (the thrifty march rates +6.0).

**Step 2, the arms.** Built: `CampaignInput.ratedStops = { rule: 'same-burn' | 'one-chunk', minRating, typesOut,
damageFloor?, thriftyReads? }`, a pass after the finale passes and before the thrifty stop; the types-out family is now
one memoised helper (`typesOutRows`) read by both. R1 (rated rungs) is not built: steps 1–2 show the gain is at the
stops, and R1 moves the knee for reasons other than the rating (§9).

64 arms: R2/R3 × P0/P1 × floor none/95 % × minRating 0/1/2/5 × thrifty reads the sweet spot after/before the pass.
Findings:

- With the thrifty stop reading the **new** sweet spot, the owner's 10-14 thrifty march (9,858,253) leaves the bar:
  against the cheaper sweet spot it no longer qualifies. Every P1 arm loses it (and the dmg/merc reading with it).
  Reading the sweet spot **as it was before the pass** (`thriftyReads: 'before'`, *tb*) keeps it: the bar then
  carries the 9.29M sweet spot at burn 3 and the 9.86M thrifty at burn 4.
- A thrifty stop whose march the sweet spot took is counted absorbed, not lost (exp 129's camp).
- **Arms at 0 worse and 0 readings lost**: R2·P0·f95·>0/1/2, R3·P0·f95·>0/1/2/5, and with *tb*: R2·P1·>5,
  R3·P1·>5, R3·P0·>5, R2·P1·f95·>5, R3·P1·f95·>5.
- **R3·P1·>5·tb**, 4 better / 0 worse:
  - exp 129's camp more-mercs: +14.0 % damage, −19.9 % silver, burn 7 → 8, −21.6 % queue (+7.1);
  - the 2026-09-18 live camp's silver saver: +22.7 % damage, burn 9 → 10, −65.8 % queue (+28.3);
  - **10-13 sweet spot: −24.7 % damage**, −20.2 % silver, burn 3 → 2, −65.5 % gold, −51.4 % queue (+7.1);
  - **10-14 sweet spot**: −5.0 % damage, −15.0 % silver, −35.7 % gold, −33.3 % queue, burn 3 (+10.6).
- **R3·P1·f95·>5·tb**: the same less the 10-13 move (3 better / 0 worse).
- Below `minRating` 5 every arm with *tb* still has one worse stop: exp 129's thrifty stop moves to a −4.3-rated
  march once the sweet spot changes (the thrifty pass excludes the march now on the bar and takes its next pick).
- Plan time: unchanged within noise (2.6 s HEAD vs 2.0–2.4 s an arm over the 21 armies).
- With the option off, the goldens, benchmark, plan-stops, plan-criteria and fifth-stop tests pass unchanged.

**Open for the owner** (§6): the arm. Recommended **R3·P1·f95·>5·tb** (no damage cut over 5 %), or R3·P1·>5·tb if
the 10-13 trade (a quarter of the damage for half the queue and two-thirds of the gold) is one he wants offered as
the sweet spot. Also: whether steady max may lose damage while staying the most damage of the staircase (no
passing arm moves it; the 0-threshold arms do, −4.4 % on exp 110's camp).

---

## 12. Shipped as configured (2026-10-16)

The owner refused the 10-13 trade (*"quarter of the damage for half the queue doesn't sound good"*), asked for the
training-time trade, and said to ship the 95 % floor arm. Three changes after §11, found by the rule tests and the
goldens:

1. **Order is strict on burn** (S-61, `plan-stops.test.ts`): exp 129's more-mercs had moved to steady max's burn.
   That move is gone.
2. **The march is taken re-typed** (`retypeRowNow`, as every stop is; `silver-saver-per-march.test.ts` found the live
   camp's new silver saver beaten by a re-typing). The three best-rated candidates are re-typed in turn and the
   gates read again on the re-typed march. The 10-14 sweet spot comes out at 9,346,061 (−4.4 %, rating +11.2).
3. **The queue may not rise**: the golden capture showed Aydae's 4 975 camp's burn saver moving +12.9 % damage for
   +13.7 % queue; after the owner's training-time question the pass refuses any march that trains longer.

Result, 241 step 2 (21 armies): **2 better, 0 worse, 0 readings lost**:
- 10-14 sweet spot: −4.4 % damage, −15.0 % silver, −35.7 % gold, −37.0 % coins, −33.2 % queue, burn 3 (+11.2);
- 2026-09-18 live camp silver saver: +23.5 % damage, +5.1 % silver, burn 9 → 10, −65.8 % queue (+29.1).

Goldens: `plans.json` and `raise.json` move (exp 129's camp sweet spot −0.4 % damage, −6.4 % silver, −7.3 % queue; the
live camp's silver saver as above); `advisor.json` unchanged. Tests: `tests/engine/plan-rated-stops.test.ts` (new),
`plan-fifth-stop.test.ts` runs with the pass off, `thrifty-stop.unit.test.ts` pins the config. Full suite: only the
two goldens red.
