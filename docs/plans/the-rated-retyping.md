# The rated re-typing, in the engine — implementation plan (W11)

**Status: not started (2026-09-23). Two inputs are owed by the owner before step 4 (§6).**

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
| 2.2 | `src/engine/rating.ts` | the **significance rule** `markerRates` states (a cost whose spread across the marches being compared is trivial carries no weight). **Not implemented anywhere today, and 157 did not apply it**; implemented here only if the owner confirms it (§6). |
| 2.3 | `src/engine/plan.ts`, `putBackOn` | **decision owed (§6):** keep the put-back's own score, or rate put-backs with `markerRates` too. Either way the put-back keeps its two hard rules (recovers faster; loses at most `damageLossCap`). |

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

1. The owner answers §6.
2. `rating.ts` and 4.1.
3. `retypeMarch` in the engine; **experiment 159** runs it and must reproduce 157-rated's per-stop figures to the unit.
4. The pass (3.2) behind the flag; 4.2 and 4.3; the full suite against today's 17 failed / 1 149 passed.
5. Experiment 160 — 157's table and 158's speed-up bill on the engine's own bar, plus the time the pass adds per army (the monster camp is 9.1 s today).
6. Commit with every moved pin named; the owner registers them (`feedback-benchmark-non-regression`).

## 6. Owed by the owner

1. **Training speed and training-cost reduction.** Enter the account's figures, per troop group, so the queue and
   silver figures are real rather than base. The re-typing's effect on the queue is measured again with them
   before shipping.
2. **Put-back score (2.3):** keep `putBack`'s silver 5 / queue 10, or rate put-backs with `markerRates` (queue 40)?
3. **The significance rule (2.2):** implement it now, or ship the plain rates first?

## 7. Risks

- **Time.** The pass battles up to 5 000 assignments a march; 157 ran every stop of all 17 armies in about
  25 s under Node. That cost is not yet measured in the browser, which is why 3.5 exists.
- **Worst opening only.** The rating holds the worst-opening damage; the average opening is not checked.
- **One stop pays one fewer campaign** of the owner's stock (158), on a first-run army he does not play.
