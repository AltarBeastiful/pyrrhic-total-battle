# The rated re-typing, in the engine — implementation plan (W11)

**Status: not started (2026-09-23). Decisions 2 and 3 of §6 are answered; decision 1 (the training bonuses) is still owed.**

The owner: *"write the plan for the rated re-typing into the engine and use markerRates"*.

---

## 0. The finding, in one paragraph

Complete optimization sizes the troops of a march on damage alone: `rankTroops`, the rung-order climb and the
Elite sizer never look at silver. Experiment 157 re-chose the troop types of every march on the bar after the
fact. The hired stacks were kept, each type was held to at least its slot's HP, and damage was held. Judged by
the owner's own rating (`CAMPAIGN.markerRates`), it improves **every stop it changes** (57 of 61, 0 rated worse).
It moves TotalStack rows dominated at matched spend from **47 to 70**. Most damage improves by up to **+8.3 %** and
damage a silver by up to **+11.1 %** (evening 1.787 → 1.985). Experiment 158 spent the owner's real speed-up stock
order by order: the training queue summed over all 61 stops goes **88,134 h → 87,544 h (−0.67 %)**, the waste
stays **0.01 %**, and the stock pays **692 → 704** whole campaigns summed over the stops. On one stop it pays one
fewer (Epic Monster Hunter ×83 all-in, 5 → 4).

## 1. What every figure here is, and is not

- Damage is the **worst opening** (`minDamage`); campaigns are four marches.
- **No training-speed bonus and no training-cost reduction is applied.** `trainingSpeed` and
  `trainingCostReduction` are empty on all 17 benchmark requests, because the owner's profile carries none.
  Every queue hour is raw base training time and every silver figure is undiscounted. With a speed bonus of
  *s* % the queue divides by (1 + *s*/100); how many campaigns the stock pays scales up with it. **The
  re-typing's relative effect can shift** if the bonus differs between troop groups, because re-typing moves
  troops between groups.
- Recovery is `retrain` on the owner's accounts and `selective · monsters` on the first-run armies, as each
  scenario declares.

## 2. `markerRates` becomes the engine's rating

`CAMPAIGN.markerRates` (S-135: silver 5, gold 5, hired 5, dragon coins 8, queue 40 — *"this many percent of this
cost equals one percent of damage"*) is defined in `src/config.ts` and **read nowhere in the code**. The only
rating the engine applies is the put-back score (`CAMPAIGN.putBack`: silver 5, queue 10).

| # | file | change |
|---|---|---|
| 2.1 | **new** `src/engine/rating.ts` | `rate(before, after, rates): number` — damage change % plus each cost saved % over its rate; a bill of nothing saves nothing. Pure; unit-tested. |
| 2.2 | — | **Banked, not in this plan** (owner, 2026-09-23: *"ship plain rates first and bank the cost change"*). The significance rule `markerRates` states is not implemented anywhere today, and 157 did not apply it. It ships as plain rates first; the rule is §8's open work item. |
| 2.3 | `src/engine/plan.ts`, `putBackOn` (both scoring sites, today `silver / policy.silverPerDamage + seconds / policy.timePerDamage + damage`) | **the put-back is rated with `markerRates` too** (owner, 2026-09-23: *"use markerRates for put-back too"*): `rate(before, after, CAMPAIGN.markerRates)` replaces the put-back's own score, so the queue weighs 40 there instead of 10 and gold, the hired burn and dragon coins are counted. The put-back keeps its two hard rules (it recovers faster; it loses at most `damageLossCap` of the damage). `CAMPAIGN.putBack` keeps `damageLossCap` only; `silverPerDamage` and `timePerDamage` are retired. **The put-back is a shipped pass, so this moves stops on its own**: it is a separate step (§5 step 3) with its own experiment and its own named pins, before the re-typing is built on top of it. |

## 3. The re-typing pass

| # | file | change |
|---|---|---|
| 3.1 | `src/engine/plan.ts` | `retypeMarch(request, counts, rates)` — `tools/theorycraft/silver-aware.ts`'s `rated` mode, moved into the engine: hired stacks kept; troop stacks as slots; every assignment of the account's troop types to them (exhaustive to 5 000, else the swap/replace climb), each type at least its slot's HP; admissible when the leadership fits and the march deals at least its damage; the best **positive** rating kept. Priced with `marchResult`, the battle's own reading. |
| 3.2 | `src/engine/plan.ts` | applied to **every march of every stop** (repeated march, finale, tail, the all-in's sequence), cached by march, **after the put-back pass and before the fold** — so the fold chooses on re-typed marches, and restores the order where re-typing broke it (157's one break: his camp as the message reads it, sweet spot beating more mercs). |
| 3.3 | `src/engine/plan.ts` | **the band is not re-typed** (1,999 rows on the monster camp). A band plan the fold takes as a saver is re-typed once taken. Measured cost of the difference: §5 step 5. |
| 3.4 | `src/config.ts` | `CAMPAIGN.planFixes.retype: 'rated'` behind `CampaignInput.retype`; omitted, the bar is exactly today's. |
| 3.5 | `src/engine/plan.ts` | a wall-clock guard: the pass stops at its share of `budgets.plan` and keeps what it has. Every march it did not reach is left as the search made it. |

## 4. Tests

| # | file | assertion |
|---|---|---|
| 4.1 | **new** `tests/engine/rating.test.ts` | `rate` on hand-made figures: signs, rates, a zero bill. |
| 4.2 | `tests/engine/plan-stops.test.ts` | on every benchmark army, with `retype` on against off: **no stop rated worse**, damage held stop by stop, every hired stack sheltered, the bar ordered, at most five stops. |
| 4.3 | `tests/engine/plan-stops.test.ts` | TotalStack at matched spend no worse than 47 / 13 (dominated / no stop fits). |
| 4.4 | existing suites | `plan-criteria`, `plan-shape`, `plan-benchmark`: only the pre-existing reds plus named, un-rebased pins. |

## 5. Order and non-regression

1. The owner answers §6.1.
2. `rating.ts` and 4.1.
3. **The put-back on `markerRates`** (2.3), alone: an experiment runs every army with the put-back scored both ways, on the ten criteria, TotalStack at matched spend and the criteria. Then the full suite, and a commit that names every moved pin.
4. `retypeMarch` in the engine; **experiment 159** runs it and must reproduce 157-rated's per-stop figures to the unit.
5. The pass (3.2) behind the flag; 4.2 and 4.3; the full suite against today's 17 failed / 1 149 passed.
6. Experiment 160 — 157's table and 158's speed-up bill on the engine's own bar, plus the time the pass adds per army (the monster camp is 9.1 s today).
7. Commit with every moved pin named; the owner registers them (`feedback-benchmark-non-regression`).

## 6. Decisions

1. **Owed — training speed and training-cost reduction.** Enter the account's figures, per troop group, so the
   queue and silver figures are real rather than base. The re-typing's effect on the queue is measured again with
   them before shipping.
2. **Answered 2026-09-23 — the put-back uses `markerRates` too** (2.3).
3. **Answered 2026-09-23 — plain rates first; the significance rule is banked** (2.2, §8).

## 7. Risks

- **Time.** The pass battles up to 5 000 assignments a march; 157 ran every stop of all 17 armies in about
  25 s under Node. That cost is not yet measured in the browser, which is why 3.5 exists.
- **Worst opening only.** The rating holds the worst-opening damage; the average opening is not checked.
- **One stop pays one fewer campaign** of the owner's stock (158), on a first-run army he does not play.

## 8. Banked: the significance of a cost change

The owner, 2026-09-23: *"bank the cost change (the main objective was to avoid a 50 % gold reduction on a 50 to
25 gold cost as it's negligible, so we need to find the best way for that)"*.

**The problem, in his example.** The plain rating reads a cost in percent: 50 → 25 gold is a 50 % saving, worth
50 / 5 = **10 % of damage** at gold's rate — the same weight as 8 000 → 4 000 gold. To him the first is
nothing. From S-135's note: *"a 30 % drop on a 100 gold … is meaningless to me as I have around 170k … but a 10 %
drop on an 8k revival is"*, and 170 000 *"not to be used as a literal figure"*.

**Candidate readings to measure, none chosen:**

- **The spread across the marches being compared** (S-135's own wording): a cost counts in proportion to how
  far apart the candidates are on it, relative to the largest bill among them. 50 → 25 among marches that all
  cost under 100 gold would carry little weight; the same 50 % on marches paying thousands would carry it all.
- **A share of the whole bill**: weigh each cost's saving by that cost's share of the march's total price, with
  the three currencies (silver, gold, coins) put on one scale. That needs an exchange rate between them, which is
  a policy figure the owner would set.
- **An absolute floor per currency, derived rather than typed**: e.g. a fraction of the account's own typical
  bill for that currency over the bar's stops, so no player-specific constant (such as 170 000) is written down.

**How it will be judged:** an experiment on the benchmark armies, listing every decision (put-back taken,
re-typing kept, fold choice) that the plain rates and each reading disagree on, with all ten criteria for each,
so the owner chooses with the cases in front of him.
