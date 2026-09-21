# Beating TotalStack everywhere — implementation plan (S-119)

**Owner, 2026-09-21**: *"write a plan to beat total stack everywhere, adding missing cases if necessary …
this should also include fixing the no leadership at all on some cases."*

Everything below is measured, from the benchmark run committed in 2eaf10b
(`tools/theorycraft/out/benchmark-latest.{md,json}`, seventeen armies, 227 rows of our own algorithms since
S-118). No figure here is recalled; each is in that payload.

---

## 0. What "beat" means — settled

**Owner, 2026-09-21**: *"beat means using constrained resources to produce better damage with a fixed
silver/merc/gold/dragon coins set. So we can derive its being more efficient in the markers related. verify
we're using the proper heuristics or change them."*

So the test is **dominance at matched spend**, not a ratio:

> Take any march TotalStack answers with. Read its four costs — silver, hired chunks burned, revive gold,
> dragon coins. **We beat it when the bar offers a stop that spends no more of any of the four and deals
> more damage.**

Two consequences, and they settle the other two questions he was asked.

- **The four ratios follow for free.** If our damage is higher and none of the four costs is, then
  `damage / silver`, `damage / soldier`, `damage / monster` and `damage / dragon coin` are each at least
  theirs by construction. His *"all four ≥ 1.0 everywhere"* is therefore not a second target but the
  **derived marker** of this one — which is exactly what *"we can derive its being more efficient in the
  markers related"* says. The ratios stay in the benchmark as the readable symptom; the matched-spend test
  becomes what the work is steered by.
- **Per-reading best stop stays** (his answer): each marker may read off whichever stop is best for it,
  because under a dominance test the stop that dominates dominates on all of them at once.

**Where the old goal was too kind.** The S-101 goal compared ratios against `TotalStack · Total
Optimization` alone. A ratio can be won by *spending more and getting proportionally more* — and §1 shows
three armies where we "win" on ratio and have **no stop cheap enough to enter the comparison at all**.

**The mandate on heuristics.** *"verify we're using the proper heuristics or change them"* — §3 is that
audit, and it is the part of this plan most likely to change engine code.

---

## 1. Where we stand under that definition

For each army: TotalStack's **hardest comparable captured row**, and the best stop on our bar that spends
**≤ their silver, ≤ their burn, ≤ their gold and ≤ their dragon coins**.

| army | their hardest row | their damage | our best within their budget | verdict |
|---|---|---|---|---|
| first-run, Bear V ×1 | Total Optimization | 18,217,808 | sweet-spot 18,189,008 | −0.2 % |
| first-run, Bear V ×2 | Total Optimization | 18,442,208 | sweet-spot 18,413,408 | −0.2 % |
| first-run, Bear V ×3 | search under M's (avg) | 21,427,548 | all-in 18,750,008 | **−12.5 %** |
| first-run, Bear V ×10 | search under M's (avg) | 22,474,748 | all-in 20,893,375 | −7.0 % |
| first-run, hunters ×83 (e2e seed) | M's Preservation | 30,221,279 | steady-max 29,691,713 | −1.8 % |
| monster camp, 900 dominance | Total Optimization | 79,770,931 | — | **no stop fits** |
| the 4 000 case of 2026-09-15 | optimize (captured) | 8,762,880 | all-in 8,519,930 | −2.8 % |
| 2026-09-17 export, 7 000 | search under M's (avg) | 13,742,586 | sweet-spot 18,796,348 | **✓ +36.8 %** |
| 2026-09-17 export, 12 000 | search under M's (avg) | 22,894,812 | — | **no stop fits** |
| live account, 20 000 | Total Optimization | 29,222,440 | all-in 29,743,332 | **✓ +1.8 %** |
| live account, evening | search under M's (avg) | 36,832,597 | all-in 31,714,657 | **−13.9 %** |
| Aydae alone, 4 975 | — | — | — | not measured |
| live camp of 2026-09-18 | Total Optimization | 49,229,801 | all-in 10,899,547 | **−77.9 %** |
| camp of 2026-09-19, dump | Total Optimization | 6,422,616 | silver-saver 7,561,467 | **✓ +17.7 %** |
| camp of 2026-09-19, message | Total Optimization | 6,585,128 | — | **no stop fits** |
| his TotalStack profile | Total Optimization | 6,779,808 | silver-saver 4,919,095 | **−27.4 %** |
| his usual setup | — | — | — | not measured |

**We beat TotalStack on 3 of the 15 armies that can be measured.** We are short on 9 and cannot enter the
comparison on 3. Two armies have no captured answer at all.

This is a much harsher reading than the ratio table the benchmark prints today (where we lead on 8 of 15),
and the difference is the whole point of his definition: **a ratio win that spends more is not a win.**

### The ratio table, for reference

Kept because it is what the benchmark pins and what the goal line prints. `✗` is below 1.0.

| army | a silver | a soldier | a monster | a coin |
|---|---|---|---|---|
| Bear V ×1 / ×2 / ×3 | 0.999 ✗ | — | 1.000 | 0.998 ✗ |
| Bear V ×10 | 0.999 ✗ | — | 1.153 | 1.005 |
| e2e seed | 0.993 ✗ | 1.041 | — | 0.998 ✗ |
| monster camp | 1.226 | 1.525 | 2.375 | 1.512 |
| 4 000 case | 1.017 | 1.013 | — | 1.017 |
| 7 000 / 12 000 export | 2.070 / 1.717 | 1.306 / 1.073 | — | 2.146 / 1.697 |
| live account 20 000 | 1.033 | 1.043 | — | 1.018 |
| live account, evening | 0.924 ✗ | 1.081 | — | 0.951 ✗ |
| live camp 2026-09-18 | 0.259 ✗ | 1.945 | — | 0.311 ✗ |
| dump / message camps | 1.603 / 1.297 | — | — | 2.155 / 1.759 |
| his TotalStack profile | 1.308 | — | 0.911 ✗ | 1.240 |

---

## 2. The gaps, diagnosed

### G0 — The bar has no stop inside their budget at all (3 armies)

On the monster camp, the 12 000 export and the 2026-09-19 message camp, **every stop we offer spends more of
at least one resource than TotalStack's hardest row.** We are not losing the comparison; we are not in it.
This is a **coverage** defect in the burn ladder rather than a quality one, and it is invisible in the ratio
table — all three read as comfortable wins there (1.226, 1.717, 1.297 a silver).

### G1 — The plan refuses to spend an unlimited stock (live camp, −77.9 %)

| row | damage | silver | burn | troop types |
|---|---|---|---|---|
| `TotalStack · Total Optimization` | **49,229,801** | 7,794,000 | 374 | 7 |
| our `Tier ladder · all types` (the sizer!) | **43,923,310** | 7,770,800 | 398 | 7 |
| our best stop (`steady-max`) | 15,306,859 | 9,849,200 | 52 | 4 |
| our `all-in` | 10,899,547 | 6,653,700 | 133 | 2 |

**Our own sizer is within 11 % of TotalStack here. Our plan is 3.2× behind our own sizer.** The camp holds
bears *unlimited*; the burn ladder tops out at 52 chunks where the sizer spends 398 and TotalStack 374. The
ladder's ceiling is the search winner's burn, and on an unlimited stock the winner is a thrifty deep ladder
nowhere near the army's capacity. S-97 added a top pass for exactly this and it is plainly not enough.

**The biggest single win in the file**, and it likely also carries G0 and G4.

### G2 — Our sizer is out-sized at identical cost (4 000 case, −2.8 %)

| row | damage | silver | burn | troop types |
|---|---|---|---|---|
| `TotalStack · M's Preservation` | **8,762,880** | 6,084,400 | 24 | 8 |
| our `Troops first · all types` | 8,519,930 | 6,083,200 | 24 | 8 |

Same army, same stock, **same silver, same burn, same eight troop types**, 2.9 % more damage. No horizon,
stock or objective explains it: our flat-profile sizing simply loses to theirs head to head. The cleanest
isolated defect here and the best place to learn what their sizer does differently.

### G3 — Their single-march search beats ours on small armies (−12.5 %)

Bear V ×3: their `priority search under M's (averageDamage)` reaches **21,427,548** at 56,000,000 silver;
our `Generate (average damage)` reaches 18,722,192 at the **same** silver. Three troop types and three bears
— small enough to solve near-exactly, so this is a correctness question, not a budget one.

### G4 — The evening account, −13.9 %

Their 36,832,597 against our all-in's 31,714,657. An unlimited hired type again; probably G1 in a milder
form.

### G5 — Damage a monster below 1.0 on a dominance army (0.911)

`his TotalStack profile`. The only ratio still under the goal after S-118's pinning, on one of the three
armies housing a dominance pool. **S-116 (the order of death) is already written against this exact
mechanism** — sheltered monster stacks ordered by rounding rather than by damage per point of HP, measured
there at 8.3 %. Treat G5 as S-116's acceptance test, not as separate work.

---

## 3. The heuristics audit (his explicit mandate)

*"verify we're using the proper heuristics or change them."* Each of these is a heuristic the plan uses that
§1 now gives us grounds to doubt. Each item is *measure first, then decide* — an experiment before a change.

| # | heuristic | where | the doubt §1 raises |
|---|---|---|---|
| H1 | the burn ladder's ceiling is the search winner's burn | `plan.ts` | G0/G1: on an unlimited stock the winner is thrifty, so the ladder never reaches the army's capacity |
| H2 | the band refuses a stop fielding under half the winner's hired units | `plan.ts` | may be what removes the stops that would fit their budget (G0) |
| H3 | `beatsOnFigures` — dominance on damage, silver and burn | `plan.ts` (S-106) | it does **not** read gold or dragon coins, and his definition names all four |
| H4 | the sizer's flat HP profile, `ceiling − i·δ` | `stacker.ts` | G2: beaten at identical cost by their M's Preservation |
| H5 | `RANK_SPREAD`, the δ between stacks | `stacker.ts` | never swept against a rival; the obvious knob behind H4 |
| H6 | the greedy descent + restarts in `searchPriority` | `search.ts` | G3: 14 % behind on an army small enough to solve exactly |
| H7 | the shelter's one flat ceiling per type | `stacker.ts` | G5 / S-116 |
| H8 | the knee that picks the sweet spot | `plan.ts` | it picks on ratios, and the ratios are now the derived marker rather than the target |

**H3 is a correctness gap against his own words** and is cheap: the dominance test should read gold and
dragon coins too, or the plan can prefer a stop that is dearer in a resource it never looks at.

---

## 4. The "no leadership at all" cases — his answer: tell now, floor after

Since S-118 the benchmark's **troops** column reads `none` on **8 of our 227 rows**:

| rows | army |
|---|---|
| Tier ladder + Troops first · **damage per silver** | monster camp, his TotalStack profile, his usual setup |
| Troops first · **average damage** | live account evening; Aydae alone |

`runGenerate` branches on `setup.priority` before it reaches the sizer, so an objective makes the method
radio inert. `damagePerSilver` then empties the leadership pool on **every army housing a dominance pool and
on none that does not**: on his own camp, 2,369,400 → 173,600 silver for 2,855,908 → 776,837 damage, so
1.24 → 5.85 a silver. The search is winning the game it was given.

Two of the eight are on **average damage** — the objective this table has always used. `Troops first ·
Generate (average damage)` has read 8,250,197 against Tier ladder's 36,832,597 on the evening account since
S-101. The symptom was in the benchmark; no column and no assertion looked at it.

**Chosen (owner, 2026-09-21): fix the telling now, floor the search after.**

- **S-119a, telling.** The method radio says it is inert while an objective is selected; the March pane marks
  an answer that fields no troop stack and names the objective that chose it. No figure moves, no pin moves.
- **S-119b, floor.** `searchPriority` refuses a selection with no troop stack — or fewer than two, matching
  the band's own third criterion. This changes what four objectives answer on six armies, so the affected
  pins move and **he registers them**; it is a story of its own, behind S-119a.

---

## 5. The missing cases, and the blocker

**Two benchmark armies have no captured answer** — `Aydae alone, 4 975` and `his usual setup of 2026-09-19`,
the second being the camp he actually plays. "Everywhere" currently excludes the army that matters most.

**The blocker is capture, not code.** Every external row is a captured TotalStack response, and the replays
of 2026-09-19 answered **403 on all 170 priority-search calls** (Pro required, trial lapsed). The Generate
route still answers.

- **Without him**: nothing can be added that measures anything against TotalStack.
- **One capture session buys**: his usual setup and Aydae-alone get external rows — 15 scored armies → 17.
  The highest-value hour in this plan, and his to spend.

**The kit is prepared (2026-09-22).** He is opening a new account, so `tools/totalstack/replay.mjs` gained
the two missing armies — `Aydae alone, 4 975` and `his usual setup 2026-09-19` — built field for field from
`plan-scenarios.ts` (`aydaeAlone`, `usualSetup`); both keep the **melee specialist**, unlike the two
2026-09-19 camps, because their `topTierExcluded.specialists` is empty. The dry run prints twelve scenarios
and 9 × 12 = **168 answers**. The run-book is in `tools/totalstack/README.md` — sign in with Pro active, copy
`x-session-id` off any `/api/calculations` request, dry-run, then `--send --out=…-2026-09-22-replay.json`,
then add that path **last** to `DATASETS` in `tests/engine/totalstack-rows.ts`.

---

## 6. The work, in the order the figures justify

| # | work | gap | expected |
|---|---|---|---|
| 1 | **Matched-spend becomes the benchmark's primary reading** — a column and a pin per army, the ratios kept as the derived marker | §0 | the target becomes measurable and non-regressing; ~half a day |
| 2 | **H1/H2: the burn ladder reaches the army's real capacity** | G0, G1, G4 | −77.9 % → positive on the live camp; 3 "no stop fits" armies enter the comparison |
| 3 | **H3: the dominance test reads gold and dragon coins** | §0 | correctness against his own definition; small |
| 4 | **Capture session** (his usual setup, Aydae-alone) | §5 | 15 → 17 scored armies |
| 5 | **S-116, the order of death** | G5 | 0.911 → ≥ 1.0 a monster; +8.3 % measured |
| 6 | **H4/H5: our flat profile against theirs** on the 4 000 case | G2 | +2.9 % at identical cost, probably generalises |
| 7 | **H6: the single-march search** on small armies | G3 | +12.5 % on the bears |
| 8 | **S-119a telling, then S-119b floor** | §4 | 8 rows |

**Not in this plan**, and still open on the benchmark: 4 × `winsHired` where the plan now *beats* a pin that
says it should not, and 3 × stop-count drift. Pinning those is a re-base, not a fix, and is his call.

---

## 7. Answered, 2026-09-22

- **"ok to exceed within reasonable bounds."** The matched-spend test allows a stop to exceed any one of the
  four costs by **5 %**, and the overspend is printed beside the verdict. The number is not load-bearing and
  that is measured rather than assumed — swept over the committed payload, the verdict barely moves:

  | tolerance | beat | short | no stop fits |
  |---|---|---|---|
  | 0 % | 3 | 9 | 3 |
  | **5 %** | **4** | **8** | **3** |
  | 10 % | 4 | 8 | 3 |
  | 20 % | 5 | 9 | 1 |
  | 50 % | 5 | 9 | 1 |

  **Loosening the bound does not rescue us** — even at 50 % we beat TotalStack on 5 of 15. So every gap in
  §2 is real and none of them is an artefact of a strict gate. 5 % is chosen because it is the loosest bound
  that still means "matched spend"; past 20 % the comparison stops being one.

- **"raise budget."** `CAMPAIGN.budgets.plan` is **40 000 ms** (was 25 000). **It does not do what it was
  raised for, and that is a finding** (`tools/theorycraft/129-the-big-monster-camp.test.ts`): the
  20 000-dominance camp was read as running 25 846–28 009 ms against a 25 000 ms cap, which looked like a
  slight overrun. At a 40 000 ms cap it runs **40 843–40 934 ms**. The search is **budget-bound at every
  budget**, so that camp still cannot be registered — its bar would be the machine's, not the engine's.
  Making it converge on a twenty-type dominance pool is engine work and belongs in §6 as its own item.

  **The raise is kept anyway, because a longer clock is a strictly better bar there**: at 25 s the camp
  offers **2** stops and 1,916,803,326 damage for 89,969,600 silver; at 40 s it offers **4** and
  1,924,609,434 for **88,360,000** — more damage for less silver. It costs an ordinary account nothing: the
  slowest of the seventeen benchmark armies is the 900-dominance camp at 8 598–8 750 ms, and every army he
  plays is under 4 200 ms.

## 8. Still open

- **Make the plan search converge on a large dominance pool.** Until it does, the 20 000-dominance camp and
  its four captured answers stay unregistered whatever the budget is. New, and it belongs in §6 above the
  small-army search work.
