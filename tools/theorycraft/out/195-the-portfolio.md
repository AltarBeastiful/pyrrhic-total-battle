---
type: experiment
title: "195 — the portfolio"
created: 2026-10-09
tags: [w17, advisor, portfolio]
related: ["[[Progression-Advisor-Plan]]", "[[186-a-bigger-compute-budget]]", "[[179-search-gap]]"]
---

# 195 — the portfolio (B1)

Plan: `docs/plans/progression-advisor.md` §3 (B1). 19 benchmark armies (`criteriaScenarios`: the benchmark armies and the 20 000-dominance camp), 10 variants (the default included) at work levels ×1, ×2, ×4, ×8 (every count limit of `PLAN_LIMITS` and the re-typing multiplied; crossed types 4 → 5 from ×4; no clock in any job). One lane of a `CalcPool` in Node, so `ms` is one thread’s plan time. Every stop is priced over four marches, worst opening (`campaignOf`) and rated (`rate`, `markerRates`, **+** better) against the **default’s** stop of the same pick at the **same work level**. Gain per ms = Σ rating gained over the variant’s own plan ms (what the portfolio adds to a lane). Nothing here moves a default, a pin or a golden.

Variants:

- **default** — the app’s `CAMPAIGN.planFixes` and put-back, as shipped
- **retypeExhaustive 10 000** — `limits.retypeExhaustive` 10 000 — equal to `retype.ts` `EXHAUSTIVE` since W16 F1, so a control: it must read as the default
- **EXHAUSTIVE 50 000** — `limits.retypeExhaustive` 50 000 — the re-typing walks the death orders whole up to 50 000 (179’s `i-50000`)
- **tierSeed** — `tierSeed: true` — the rung order climbs a second time from S-22’s tier order
- **burnSaver guard** — `burnSaver: 'guard'` — the saver withheld where it breaks the bar’s order
- **burnSaver fold** — `burnSaver: 'fold'` — offered, the stops it out-hits dropped
- **burnSaver damage** — `burnSaver: 'damage'` — offered with the damage tie-break
- **putBack off** — `putBack` omitted — the stops are the marches the search generated
- **bandHired winner** — `bandHired: { mode: 'winner' }` — S-95’s predecessor
- **bandHired none** — `bandHired: { mode: 'none' }` — no token criterion


## Variants against the default, per work level


### ×1 — the default's own plans take 5,817 ms over the armies

| variant | stops better | equal | worse | armies improved | Σ rating gained | plan ms | gain per 1 000 ms | best stop | worst stop |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| retypeExhaustive 10 000 | 0 | 68 | 0 | 0 | 0 | 5,277 | 0.0000 | — | — |
| EXHAUSTIVE 50 000 | 5 | 61 | 2 | 4 | +0.737 | 10,170 | 0.0725 | +0.698 the 4 000-leadership case of 2026-09-15 · SS | −0.000 Aydae alone, 4 975 · SW |
| tierSeed | 0 | 68 | 0 | 0 | 0 | 5,259 | 0.0000 | — | — |
| burnSaver guard | 0 | 66 | 2 | 0 | −3.488 | 5,260 | -0.6633 | — | −3.340 2026-09-17 export, 12 000 leadership · HS |
| burnSaver fold | 1 | 65 | 0 | 1 | +27.571 | 5,178 | 5.3246 | +27.571 live account of 2026-09-18 · SS | — |
| burnSaver damage | 6 | 62 | 0 | 6 | +41.941 | 5,119 | 8.1930 | +23.844 his usual setup of 2026-09-19 · HS | — |
| putBack off | 0 | 1 | 66 | 0 | −379.690 | 3,269 | -116.1436 | — | −54.509 his camp of 2026-09-19, as his message reads it · HS |
| bandHired winner | 4 | 46 | 15 | 4 | −541.076 | 5,165 | -104.7544 | +13.100 the owner’s live camp of 2026-09-18 · SS | −183.251 his camp of 2026-09-19, the localStorage dump · SS |
| bandHired none | 0 | 46 | 15 | 0 | −310.242 | 4,853 | -63.9254 | — | −40.428 first-run army, Epic Monster Hunter VI ×83 · HS |

The portfolio of all 10 (best per stop, default always in): 13 stops better, 55 equal, 0 worse by construction; Σ rating gained +96.284 on 11 armies, for 55,367 plan ms against the default's 5,817 (×9.5).
Stops each variant is the strict best on: burnSaver damage 6 · EXHAUSTIVE 50 000 2 · bandHired winner 4 · burnSaver fold 1.

### ×2 — the default's own plans take 6,167 ms over the armies

| variant | stops better | equal | worse | armies improved | Σ rating gained | plan ms | gain per 1 000 ms | best stop | worst stop |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| retypeExhaustive 10 000 | 0 | 67 | 0 | 0 | 0 | 6,353 | 0.0000 | — | — |
| EXHAUSTIVE 50 000 | 5 | 60 | 2 | 4 | +0.737 | 10,535 | 0.0700 | +0.698 the 4 000-leadership case of 2026-09-15 · SS | −0.000 Aydae alone, 4 975 · SW |
| tierSeed | 0 | 67 | 0 | 0 | 0 | 6,265 | 0.0000 | — | — |
| burnSaver guard | 0 | 65 | 2 | 0 | −3.488 | 6,196 | -0.5630 | — | −3.340 2026-09-17 export, 12 000 leadership · HS |
| burnSaver fold | 1 | 64 | 0 | 1 | +27.571 | 6,214 | 4.4368 | +27.571 live account of 2026-09-18 · SS | — |
| burnSaver damage | 6 | 61 | 0 | 6 | +41.941 | 6,171 | 6.7965 | +23.844 his usual setup of 2026-09-19 · HS | — |
| putBack off | 0 | 1 | 65 | 0 | −374.344 | 4,434 | -84.4322 | — | −54.509 his camp of 2026-09-19, as his message reads it · HS |
| bandHired winner | 6 | 45 | 14 | 6 | −528.047 | 6,243 | -84.5836 | +13.100 the owner’s live camp of 2026-09-18 · SS | −183.251 his camp of 2026-09-19, the localStorage dump · SS |
| bandHired none | 0 | 45 | 15 | 0 | −316.375 | 5,824 | -54.3209 | — | −40.428 first-run army, Epic Monster Hunter VI ×83 · HS |

The portfolio of all 10 (best per stop, default always in): 15 stops better, 52 equal, 0 worse by construction; Σ rating gained +106.095 on 12 armies, for 64,401 plan ms against the default's 6,167 (×10.4).
Stops each variant is the strict best on: burnSaver damage 6 · bandHired winner 6 · EXHAUSTIVE 50 000 2 · burnSaver fold 1.

### ×4 — the default's own plans take 13,123 ms over the armies

| variant | stops better | equal | worse | armies improved | Σ rating gained | plan ms | gain per 1 000 ms | best stop | worst stop |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| retypeExhaustive 10 000 | 0 | 67 | 0 | 0 | 0 | 12,275 | 0.0000 | — | — |
| EXHAUSTIVE 50 000 | 5 | 60 | 2 | 4 | +0.737 | 17,123 | 0.0431 | +0.698 the 4 000-leadership case of 2026-09-15 · SS | −0.000 Aydae alone, 4 975 · SW |
| tierSeed | 0 | 67 | 0 | 0 | 0 | 12,709 | 0.0000 | — | — |
| burnSaver guard | 0 | 65 | 2 | 0 | −3.488 | 12,855 | -0.2714 | — | −3.340 2026-09-17 export, 12 000 leadership · HS |
| burnSaver fold | 1 | 64 | 0 | 1 | +27.571 | 12,922 | 2.1336 | +27.571 live account of 2026-09-18 · SS | — |
| burnSaver damage | 6 | 61 | 0 | 6 | +41.941 | 13,041 | 3.2161 | +23.844 his usual setup of 2026-09-19 · HS | — |
| putBack off | 0 | 1 | 65 | 0 | −373.179 | 10,530 | -35.4387 | — | −54.509 his camp of 2026-09-19, as his message reads it · HS |
| bandHired winner | 6 | 43 | 14 | 6 | −516.632 | 13,053 | -39.5806 | +15.095 first-run army, monster tiers 3–7 at 20 000 dominance · SW | −183.251 his camp of 2026-09-19, the localStorage dump · SS |
| bandHired none | 0 | 45 | 15 | 0 | −316.431 | 12,739 | -24.8398 | — | −40.428 first-run army, Epic Monster Hunter VI ×83 · HS |

The portfolio of all 10 (best per stop, default always in): 15 stops better, 52 equal, 0 worse by construction; Σ rating gained +117.510 on 12 armies, for 130,371 plan ms against the default's 13,123 (×9.9).
Stops each variant is the strict best on: burnSaver damage 6 · bandHired winner 6 · EXHAUSTIVE 50 000 2 · burnSaver fold 1.

### ×8 — the default's own plans take 19,627 ms over the armies

| variant | stops better | equal | worse | armies improved | Σ rating gained | plan ms | gain per 1 000 ms | best stop | worst stop |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| retypeExhaustive 10 000 | 2 | 59 | 5 | 2 | −0.732 | 14,853 | -0.0493 | +0.000 Aydae alone, 4 975 · SW | −0.693 the 4 000-leadership case of 2026-09-15 · SS |
| EXHAUSTIVE 50 000 | 0 | 66 | 0 | 0 | 0 | 19,835 | 0.0000 | — | — |
| tierSeed | 0 | 66 | 0 | 0 | 0 | 18,969 | 0.0000 | — | — |
| burnSaver guard | 0 | 64 | 2 | 0 | −3.488 | 18,795 | -0.1856 | — | −3.340 2026-09-17 export, 12 000 leadership · HS |
| burnSaver fold | 1 | 63 | 0 | 1 | +27.571 | 19,529 | 1.4118 | +27.571 live account of 2026-09-18 · SS | — |
| burnSaver damage | 6 | 60 | 0 | 6 | +38.839 | 20,499 | 1.8947 | +23.844 his usual setup of 2026-09-19 · HS | — |
| putBack off | 0 | 1 | 64 | 0 | −378.095 | 13,236 | -28.5661 | — | −54.509 his camp of 2026-09-19, as his message reads it · HS |
| bandHired winner | 5 | 45 | 14 | 5 | −525.959 | 19,252 | -27.3192 | +13.100 the owner’s live camp of 2026-09-18 · SS | −183.251 his camp of 2026-09-19, the localStorage dump · SS |
| bandHired none | 1 | 43 | 15 | 1 | −322.279 | 19,397 | -16.6148 | +4.851 first-run army, monster tiers 3–5 at 900 dominance · SW | −40.428 first-run army, Epic Monster Hunter VI ×83 · HS |

The portfolio of all 10 (best per stop, default always in): 15 stops better, 51 equal, 0 worse by construction; Σ rating gained +103.426 on 11 armies, for 183,993 plan ms against the default's 19,627 (×9.4).
Stops each variant is the strict best on: bandHired none 1 · burnSaver damage 6 · bandHired winner 5 · burnSaver fold 1 · retypeExhaustive 10 000 2.

## Ranking by marginal gain per ms

| rank | variant | level | Σ rating gained | plan ms | gain per 1 000 ms | stops worse |
|---:|---|---|---:|---:|---:|---:|
| 1 | burnSaver damage | ×1 | +41.941 | 5,119 | 8.1930 | 0 |
| 2 | burnSaver damage | ×2 | +41.941 | 6,171 | 6.7965 | 0 |
| 3 | burnSaver fold | ×1 | +27.571 | 5,178 | 5.3246 | 0 |
| 4 | burnSaver fold | ×2 | +27.571 | 6,214 | 4.4368 | 0 |
| 5 | burnSaver damage | ×4 | +41.941 | 13,041 | 3.2161 | 0 |
| 6 | burnSaver fold | ×4 | +27.571 | 12,922 | 2.1336 | 0 |
| 7 | burnSaver damage | ×8 | +38.839 | 20,499 | 1.8947 | 0 |
| 8 | burnSaver fold | ×8 | +27.571 | 19,529 | 1.4118 | 0 |
| 9 | EXHAUSTIVE 50 000 | ×1 | +0.737 | 10,170 | 0.0725 | 2 |
| 10 | EXHAUSTIVE 50 000 | ×2 | +0.737 | 10,535 | 0.0700 | 2 |
| 11 | EXHAUSTIVE 50 000 | ×4 | +0.737 | 17,123 | 0.0431 | 2 |
| 12 | retypeExhaustive 10 000 | ×1 | 0 | 5,277 | 0.0000 | 0 |
| 13 | tierSeed | ×1 | 0 | 5,259 | 0.0000 | 0 |
| 14 | retypeExhaustive 10 000 | ×2 | 0 | 6,353 | 0.0000 | 0 |
| 15 | tierSeed | ×2 | 0 | 6,265 | 0.0000 | 0 |
| 16 | retypeExhaustive 10 000 | ×4 | 0 | 12,275 | 0.0000 | 0 |
| 17 | tierSeed | ×4 | 0 | 12,709 | 0.0000 | 0 |
| 18 | EXHAUSTIVE 50 000 | ×8 | 0 | 19,835 | 0.0000 | 0 |
| 19 | tierSeed | ×8 | 0 | 18,969 | 0.0000 | 0 |
| 20 | retypeExhaustive 10 000 | ×8 | −0.732 | 14,853 | -0.0493 | 5 |
| 21 | burnSaver guard | ×8 | −3.488 | 18,795 | -0.1856 | 2 |
| 22 | burnSaver guard | ×4 | −3.488 | 12,855 | -0.2714 | 2 |
| 23 | burnSaver guard | ×2 | −3.488 | 6,196 | -0.5630 | 2 |
| 24 | burnSaver guard | ×1 | −3.488 | 5,260 | -0.6633 | 2 |
| 25 | bandHired none | ×8 | −322.279 | 19,397 | -16.6148 | 15 |
| 26 | bandHired none | ×4 | −316.431 | 12,739 | -24.8398 | 15 |
| 27 | bandHired winner | ×8 | −525.959 | 19,252 | -27.3192 | 14 |
| 28 | putBack off | ×8 | −378.095 | 13,236 | -28.5661 | 64 |
| 29 | putBack off | ×4 | −373.179 | 10,530 | -35.4387 | 65 |
| 30 | bandHired winner | ×4 | −516.632 | 13,053 | -39.5806 | 14 |
| 31 | bandHired none | ×2 | −316.375 | 5,824 | -54.3209 | 15 |
| 32 | bandHired none | ×1 | −310.242 | 4,853 | -63.9254 | 15 |
| 33 | putBack off | ×2 | −374.344 | 4,434 | -84.4322 | 65 |
| 34 | bandHired winner | ×2 | −528.047 | 6,243 | -84.5836 | 14 |
| 35 | bandHired winner | ×1 | −541.076 | 5,165 | -104.7544 | 15 |
| 36 | putBack off | ×1 | −379.690 | 3,269 | -116.1436 | 66 |

## The other route: the default alone at a bigger work level, against the default ×1

| level | stops better | equal | worse | Σ rating gained | default plan ms | extra ms over ×1 | gain per 1 000 extra ms |
|---|---:|---:|---:|---:|---:|---:|---:|
| ×2 | 1 | 65 | 1 | −126.657 | 6,167 | 350 | -361.8104 |
| ×4 | 4 | 62 | 1 | −122.913 | 13,123 | 7,306 | -16.8231 |
| ×8 | 9 | 50 | 6 | −117.348 | 19,627 | 13,810 | -8.4974 |

## Reading the tables, and the recommendation

How to read them (measured, from the tables above):

- **The ×8 rows of `retypeExhaustive 10 000` and `EXHAUSTIVE 50 000` are not variants of the work level.** A variant's `limits` override the level's, so at ×8 (re-typing walk 80 000) they *lower* it; the ×8 `retypeExhaustive 10 000` row (2 better, 5 worse, Σ −0.732) is a smaller search than the default's, not a wider one. At ×1 the `retypeExhaustive 10 000` row is the control it was meant to be: 68 stops equal, Σ 0, because 10 000 is the default since W16 F1.
- **`tierSeed` reads equal on every stop at every level** (0 better, 0 worse): the default already has `tierCandidate`, and the seed adds nothing the benchmark can see.
- **`burnSaver damage` and `burnSaver fold` are not a deeper search of the same stop; they are a different definition of the saver stop** (the W10 choice of `'silver'` with `foldTo` was made to keep S-61's order). Their +41.941 (6 stops, 0 worse) and +27.571 (1 stop) are all on the `burn-saver` pick, rated by `rate()` against the default's saver; taking them is the owner's trade on what that stop means, not something a portfolio finds for free.
- **`bandHired winner` and `bandHired none`, and `putBack off`, lose heavily** (Σ −541.076 / −310.242 / −379.690 at ×1; 15, 15 and 66 stops worse) and win a few stops each (`bandHired winner`: 4 to 6 better, best +13.100 to +15.095). A per-stop merge would keep only those wins, but a stop taken from another band rule is a stop whose counts change under a different rule: a trade the owner registers.
- **The portfolio of all ten** costs about **9.5 × the default's plan ms** at every level (55 367 ms against 5 817 at ×1; 183 993 against 19 627 at ×8) and improves **13 of 68 stops (×1) to 15 of 67 (×2 to ×8)**, Σ rating +96.284 at ×1 to +117.510 at ×4, on 11 to 12 of the 19 armies. Most of that Σ is the two saver variants (+41.941 and +27.571 at ×1), the rest being `bandHired winner`'s wins and `EXHAUSTIVE 50 000`'s +0.737 (5 stops better, 2 worse by under 0.001).
- **The other route, the default alone at a bigger work level, does not pay either**: against the default ×1, ×2 reads 1 stop better and 1 worse for Σ −126.657, ×4 reads 4 better and 1 worse for Σ −122.913, ×8 reads 9 better and 6 worse for Σ −117.348, at +350, +7 306 and +13 810 ms. The Σ is negative at every level, so at least one stop reads far worse under a bigger count; the per-army tables name it. Experiment 186 found the same (a bigger count is not monotone).

**Recommendation.** B2 is **not worth building as proposed**. The general portfolio costs about nine and a half times the plan for stops that mostly come from two saver definitions the owner has already chosen between, from one band rule that loses 14 to 15 stops for every 4 to 6 it wins, and from knobs (`tierSeed`, `retypeExhaustive` 10 000, `EXHAUSTIVE 50 000`) that buy 0 to +0.737 in all. What the table does show is that the default's saver stop can be beaten on 6 armies by `burnSaver damage` with nothing worse anywhere: that is a one-line question of what the saver stop means (an owner trade, run in a plan of its own at no extra search cost), not a reason for a K-plan pool. If the owner still wants a portfolio, the only candidates that won anything with zero losses are `burnSaver damage` and `burnSaver fold`; `bandHired winner` would need a per-stop guard before it could be kept. B3 (the UI) should wait for that decision.

## Per army


## first-run army, Bear V ×1 (20 000 leadership)

| level | variant | ms | stops better / equal / worse | Σ rated | best stop |
|---|---|---:|---|---:|---|
| ×1 | retypeExhaustive 10 000 | 12 | 0 / 1 / 0 | 0 | — |
| ×1 | EXHAUSTIVE 50 000 | 15 | 0 / 1 / 0 | 0 | — |
| ×1 | tierSeed | 10 | 0 / 1 / 0 | 0 | — |
| ×1 | burnSaver guard | 9 | 0 / 1 / 0 | 0 | — |
| ×1 | burnSaver fold | 7 | 0 / 1 / 0 | 0 | — |
| ×1 | burnSaver damage | 8 | 0 / 1 / 0 | 0 | — |
| ×1 | putBack off | 3 | 0 / 0 / 1 | −1.570 | — |
| ×1 | bandHired winner | 14 | 0 / 1 / 0 | 0 | — |
| ×1 | bandHired none | 8 | 0 / 1 / 0 | 0 | — |
| ×2 | retypeExhaustive 10 000 | 8 | 0 / 1 / 0 | 0 | — |
| ×2 | EXHAUSTIVE 50 000 | 7 | 0 / 1 / 0 | 0 | — |
| ×2 | tierSeed | 7 | 0 / 1 / 0 | 0 | — |
| ×2 | burnSaver guard | 7 | 0 / 1 / 0 | 0 | — |
| ×2 | burnSaver fold | 6 | 0 / 1 / 0 | 0 | — |
| ×2 | burnSaver damage | 5 | 0 / 1 / 0 | 0 | — |
| ×2 | putBack off | 3 | 0 / 0 / 1 | −1.570 | — |
| ×2 | bandHired winner | 9 | 0 / 1 / 0 | 0 | — |
| ×2 | bandHired none | 7 | 0 / 1 / 0 | 0 | — |
| ×4 | retypeExhaustive 10 000 | 7 | 0 / 1 / 0 | 0 | — |
| ×4 | EXHAUSTIVE 50 000 | 6 | 0 / 1 / 0 | 0 | — |
| ×4 | tierSeed | 5 | 0 / 1 / 0 | 0 | — |
| ×4 | burnSaver guard | 6 | 0 / 1 / 0 | 0 | — |
| ×4 | burnSaver fold | 5 | 0 / 1 / 0 | 0 | — |
| ×4 | burnSaver damage | 4 | 0 / 1 / 0 | 0 | — |
| ×4 | putBack off | 2 | 0 / 0 / 1 | −1.570 | — |
| ×4 | bandHired winner | 8 | 0 / 1 / 0 | 0 | — |
| ×4 | bandHired none | 7 | 0 / 1 / 0 | 0 | — |
| ×8 | retypeExhaustive 10 000 | 5 | 0 / 1 / 0 | 0 | — |
| ×8 | EXHAUSTIVE 50 000 | 6 | 0 / 1 / 0 | 0 | — |
| ×8 | tierSeed | 5 | 0 / 1 / 0 | 0 | — |
| ×8 | burnSaver guard | 4 | 0 / 1 / 0 | 0 | — |
| ×8 | burnSaver fold | 6 | 0 / 1 / 0 | 0 | — |
| ×8 | burnSaver damage | 5 | 0 / 1 / 0 | 0 | — |
| ×8 | putBack off | 2 | 0 / 0 / 1 | −1.570 | — |
| ×8 | bandHired winner | 6 | 0 / 1 / 0 | 0 | — |
| ×8 | bandHired none | 7 | 0 / 1 / 0 | 0 | — |

## first-run army, Bear V ×2 (20 000 leadership)

| level | variant | ms | stops better / equal / worse | Σ rated | best stop |
|---|---|---:|---|---:|---|
| ×1 | retypeExhaustive 10 000 | 18 | 0 / 1 / 0 | 0 | — |
| ×1 | EXHAUSTIVE 50 000 | 73 | 0 / 1 / 0 | 0 | — |
| ×1 | tierSeed | 21 | 0 / 1 / 0 | 0 | — |
| ×1 | burnSaver guard | 18 | 0 / 1 / 0 | 0 | — |
| ×1 | burnSaver fold | 15 | 0 / 1 / 0 | 0 | — |
| ×1 | burnSaver damage | 15 | 0 / 1 / 0 | 0 | — |
| ×1 | putBack off | 3 | 0 / 0 / 1 | −1.551 | — |
| ×1 | bandHired winner | 18 | 0 / 1 / 0 | 0 | — |
| ×1 | bandHired none | 19 | 0 / 1 / 0 | 0 | — |
| ×2 | retypeExhaustive 10 000 | 18 | 0 / 1 / 0 | 0 | — |
| ×2 | EXHAUSTIVE 50 000 | 44 | 0 / 1 / 0 | 0 | — |
| ×2 | tierSeed | 18 | 0 / 1 / 0 | 0 | — |
| ×2 | burnSaver guard | 17 | 0 / 1 / 0 | 0 | — |
| ×2 | burnSaver fold | 18 | 0 / 1 / 0 | 0 | — |
| ×2 | burnSaver damage | 18 | 0 / 1 / 0 | 0 | — |
| ×2 | putBack off | 3 | 0 / 0 / 1 | −1.551 | — |
| ×2 | bandHired winner | 19 | 0 / 1 / 0 | 0 | — |
| ×2 | bandHired none | 19 | 0 / 1 / 0 | 0 | — |
| ×4 | retypeExhaustive 10 000 | 17 | 0 / 1 / 0 | 0 | — |
| ×4 | EXHAUSTIVE 50 000 | 40 | 0 / 1 / 0 | 0 | — |
| ×4 | tierSeed | 41 | 0 / 1 / 0 | 0 | — |
| ×4 | burnSaver guard | 40 | 0 / 1 / 0 | 0 | — |
| ×4 | burnSaver fold | 43 | 0 / 1 / 0 | 0 | — |
| ×4 | burnSaver damage | 42 | 0 / 1 / 0 | 0 | — |
| ×4 | putBack off | 3 | 0 / 0 / 1 | −1.551 | — |
| ×4 | bandHired winner | 74 | 0 / 1 / 0 | 0 | — |
| ×4 | bandHired none | 47 | 0 / 1 / 0 | 0 | — |
| ×8 | retypeExhaustive 10 000 | 16 | 0 / 1 / 0 | 0 | — |
| ×8 | EXHAUSTIVE 50 000 | 38 | 0 / 1 / 0 | 0 | — |
| ×8 | tierSeed | 42 | 0 / 1 / 0 | 0 | — |
| ×8 | burnSaver guard | 39 | 0 / 1 / 0 | 0 | — |
| ×8 | burnSaver fold | 45 | 0 / 1 / 0 | 0 | — |
| ×8 | burnSaver damage | 39 | 0 / 1 / 0 | 0 | — |
| ×8 | putBack off | 4 | 0 / 0 / 1 | −1.551 | — |
| ×8 | bandHired winner | 46 | 0 / 1 / 0 | 0 | — |
| ×8 | bandHired none | 40 | 0 / 1 / 0 | 0 | — |

## first-run army, Bear V ×3 (20 000 leadership)

| level | variant | ms | stops better / equal / worse | Σ rated | best stop |
|---|---|---:|---|---:|---|
| ×1 | retypeExhaustive 10 000 | 10 | 0 / 2 / 0 | 0 | — |
| ×1 | EXHAUSTIVE 50 000 | 13 | 0 / 2 / 0 | 0 | — |
| ×1 | tierSeed | 12 | 0 / 2 / 0 | 0 | — |
| ×1 | burnSaver guard | 10 | 0 / 2 / 0 | 0 | — |
| ×1 | burnSaver fold | 14 | 0 / 2 / 0 | 0 | — |
| ×1 | burnSaver damage | 10 | 0 / 2 / 0 | 0 | — |
| ×1 | putBack off | 4 | 0 / 0 / 2 | −3.074 | — |
| ×1 | bandHired winner | 13 | 0 / 2 / 0 | 0 | — |
| ×1 | bandHired none | 11 | 0 / 2 / 0 | 0 | — |
| ×2 | retypeExhaustive 10 000 | 8 | 0 / 2 / 0 | 0 | — |
| ×2 | EXHAUSTIVE 50 000 | 9 | 0 / 2 / 0 | 0 | — |
| ×2 | tierSeed | 11 | 0 / 2 / 0 | 0 | — |
| ×2 | burnSaver guard | 8 | 0 / 2 / 0 | 0 | — |
| ×2 | burnSaver fold | 10 | 0 / 2 / 0 | 0 | — |
| ×2 | burnSaver damage | 8 | 0 / 2 / 0 | 0 | — |
| ×2 | putBack off | 3 | 0 / 0 / 2 | −3.074 | — |
| ×2 | bandHired winner | 11 | 0 / 2 / 0 | 0 | — |
| ×2 | bandHired none | 10 | 0 / 2 / 0 | 0 | — |
| ×4 | retypeExhaustive 10 000 | 9 | 0 / 2 / 0 | 0 | — |
| ×4 | EXHAUSTIVE 50 000 | 9 | 0 / 2 / 0 | 0 | — |
| ×4 | tierSeed | 15 | 0 / 2 / 0 | 0 | — |
| ×4 | burnSaver guard | 14 | 0 / 2 / 0 | 0 | — |
| ×4 | burnSaver fold | 11 | 0 / 2 / 0 | 0 | — |
| ×4 | burnSaver damage | 17 | 0 / 2 / 0 | 0 | — |
| ×4 | putBack off | 4 | 0 / 0 / 2 | −3.074 | — |
| ×4 | bandHired winner | 12 | 0 / 2 / 0 | 0 | — |
| ×4 | bandHired none | 10 | 0 / 2 / 0 | 0 | — |
| ×8 | retypeExhaustive 10 000 | 9 | 0 / 2 / 0 | 0 | — |
| ×8 | EXHAUSTIVE 50 000 | 9 | 0 / 2 / 0 | 0 | — |
| ×8 | tierSeed | 16 | 0 / 2 / 0 | 0 | — |
| ×8 | burnSaver guard | 10 | 0 / 2 / 0 | 0 | — |
| ×8 | burnSaver fold | 10 | 0 / 2 / 0 | 0 | — |
| ×8 | burnSaver damage | 13 | 0 / 2 / 0 | 0 | — |
| ×8 | putBack off | 3 | 0 / 0 / 2 | −3.074 | — |
| ×8 | bandHired winner | 14 | 0 / 2 / 0 | 0 | — |
| ×8 | bandHired none | 10 | 0 / 2 / 0 | 0 | — |

## first-run army, Bear V ×10 (20 000 leadership)

| level | variant | ms | stops better / equal / worse | Σ rated | best stop |
|---|---|---:|---|---:|---|
| ×1 | retypeExhaustive 10 000 | 30 | 0 / 2 / 0 | 0 | — |
| ×1 | EXHAUSTIVE 50 000 | 64 | 0 / 2 / 0 | 0 | — |
| ×1 | tierSeed | 32 | 0 / 2 / 0 | 0 | — |
| ×1 | burnSaver guard | 23 | 0 / 2 / 0 | 0 | — |
| ×1 | burnSaver fold | 22 | 0 / 1 / 0 | 0 | — |
| ×1 | burnSaver damage | 21 | 0 / 2 / 0 | 0 | — |
| ×1 | putBack off | 5 | 0 / 0 / 2 | −4.594 | — |
| ×1 | bandHired winner | 22 | 0 / 2 / 0 | 0 | — |
| ×1 | bandHired none | 21 | 0 / 2 / 0 | 0 | — |
| ×2 | retypeExhaustive 10 000 | 22 | 0 / 2 / 0 | 0 | — |
| ×2 | EXHAUSTIVE 50 000 | 43 | 0 / 2 / 0 | 0 | — |
| ×2 | tierSeed | 24 | 0 / 2 / 0 | 0 | — |
| ×2 | burnSaver guard | 23 | 0 / 2 / 0 | 0 | — |
| ×2 | burnSaver fold | 20 | 0 / 1 / 0 | 0 | — |
| ×2 | burnSaver damage | 21 | 0 / 2 / 0 | 0 | — |
| ×2 | putBack off | 4 | 0 / 0 / 2 | −4.594 | — |
| ×2 | bandHired winner | 20 | 0 / 2 / 0 | 0 | — |
| ×2 | bandHired none | 20 | 0 / 2 / 0 | 0 | — |
| ×4 | retypeExhaustive 10 000 | 19 | 0 / 2 / 0 | 0 | — |
| ×4 | EXHAUSTIVE 50 000 | 46 | 0 / 2 / 0 | 0 | — |
| ×4 | tierSeed | 48 | 0 / 2 / 0 | 0 | — |
| ×4 | burnSaver guard | 40 | 0 / 2 / 0 | 0 | — |
| ×4 | burnSaver fold | 44 | 0 / 1 / 0 | 0 | — |
| ×4 | burnSaver damage | 44 | 0 / 2 / 0 | 0 | — |
| ×4 | putBack off | 5 | 0 / 0 / 2 | −4.594 | — |
| ×4 | bandHired winner | 43 | 0 / 2 / 0 | 0 | — |
| ×4 | bandHired none | 46 | 0 / 2 / 0 | 0 | — |
| ×8 | retypeExhaustive 10 000 | 37 | 0 / 2 / 0 | 0 | — |
| ×8 | EXHAUSTIVE 50 000 | 54 | 0 / 2 / 0 | 0 | — |
| ×8 | tierSeed | 45 | 0 / 2 / 0 | 0 | — |
| ×8 | burnSaver guard | 52 | 0 / 2 / 0 | 0 | — |
| ×8 | burnSaver fold | 45 | 0 / 1 / 0 | 0 | — |
| ×8 | burnSaver damage | 43 | 0 / 2 / 0 | 0 | — |
| ×8 | putBack off | 3 | 0 / 0 / 2 | −4.594 | — |
| ×8 | bandHired winner | 52 | 0 / 2 / 0 | 0 | — |
| ×8 | bandHired none | 46 | 0 / 2 / 0 | 0 | — |

## first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)

| level | variant | ms | stops better / equal / worse | Σ rated | best stop |
|---|---|---:|---|---:|---|
| ×1 | retypeExhaustive 10 000 | 53 | 0 / 4 / 0 | 0 | — |
| ×1 | EXHAUSTIVE 50 000 | 143 | 0 / 4 / 0 | 0 | — |
| ×1 | tierSeed | 50 | 0 / 4 / 0 | 0 | — |
| ×1 | burnSaver guard | 45 | 0 / 4 / 0 | 0 | — |
| ×1 | burnSaver fold | 43 | 0 / 4 / 0 | 0 | — |
| ×1 | burnSaver damage | 44 | 0 / 4 / 0 | 0 | — |
| ×1 | putBack off | 8 | 0 / 0 / 4 | −4.686 | — |
| ×1 | bandHired winner | 48 | 0 / 3 / 1 | −48.297 | — |
| ×1 | bandHired none | 47 | 0 / 3 / 1 | −40.428 | — |
| ×2 | retypeExhaustive 10 000 | 40 | 0 / 4 / 0 | 0 | — |
| ×2 | EXHAUSTIVE 50 000 | 118 | 0 / 4 / 0 | 0 | — |
| ×2 | tierSeed | 46 | 0 / 4 / 0 | 0 | — |
| ×2 | burnSaver guard | 55 | 0 / 4 / 0 | 0 | — |
| ×2 | burnSaver fold | 46 | 0 / 4 / 0 | 0 | — |
| ×2 | burnSaver damage | 46 | 0 / 4 / 0 | 0 | — |
| ×2 | putBack off | 10 | 0 / 0 / 4 | −4.686 | — |
| ×2 | bandHired winner | 47 | 0 / 3 / 1 | −48.297 | — |
| ×2 | bandHired none | 47 | 0 / 3 / 1 | −40.428 | — |
| ×4 | retypeExhaustive 10 000 | 47 | 0 / 4 / 0 | 0 | — |
| ×4 | EXHAUSTIVE 50 000 | 119 | 0 / 4 / 0 | 0 | — |
| ×4 | tierSeed | 124 | 0 / 4 / 0 | 0 | — |
| ×4 | burnSaver guard | 124 | 0 / 4 / 0 | 0 | — |
| ×4 | burnSaver fold | 129 | 0 / 4 / 0 | 0 | — |
| ×4 | burnSaver damage | 122 | 0 / 4 / 0 | 0 | — |
| ×4 | putBack off | 6 | 0 / 0 / 4 | −4.686 | — |
| ×4 | bandHired winner | 124 | 0 / 3 / 1 | −48.297 | — |
| ×4 | bandHired none | 119 | 0 / 3 / 1 | −40.428 | — |
| ×8 | retypeExhaustive 10 000 | 47 | 0 / 4 / 0 | 0 | — |
| ×8 | EXHAUSTIVE 50 000 | 121 | 0 / 4 / 0 | 0 | — |
| ×8 | tierSeed | 124 | 0 / 4 / 0 | 0 | — |
| ×8 | burnSaver guard | 118 | 0 / 4 / 0 | 0 | — |
| ×8 | burnSaver fold | 124 | 0 / 4 / 0 | 0 | — |
| ×8 | burnSaver damage | 127 | 0 / 4 / 0 | 0 | — |
| ×8 | putBack off | 9 | 0 / 0 / 4 | −4.686 | — |
| ×8 | bandHired winner | 119 | 0 / 3 / 1 | −48.297 | — |
| ×8 | bandHired none | 113 | 0 / 3 / 1 | −40.428 | — |

## first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)

| level | variant | ms | stops better / equal / worse | Σ rated | best stop |
|---|---|---:|---|---:|---|
| ×1 | retypeExhaustive 10 000 | 640 | 0 / 5 / 0 | 0 | — |
| ×1 | EXHAUSTIVE 50 000 | 552 | 0 / 5 / 0 | 0 | — |
| ×1 | tierSeed | 568 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver guard | 640 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver fold | 548 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver damage | 557 | 1 / 4 / 0 | +4.591 | +4.591 HS |
| ×1 | putBack off | 497 | 0 / 0 / 5 | −2.574 | — |
| ×1 | bandHired winner | 633 | 0 / 4 / 1 | −8.040 | — |
| ×1 | bandHired none | 534 | 0 / 4 / 1 | −29.688 | — |
| ×2 | retypeExhaustive 10 000 | 786 | 0 / 5 / 0 | 0 | — |
| ×2 | EXHAUSTIVE 50 000 | 713 | 0 / 5 / 0 | 0 | — |
| ×2 | tierSeed | 741 | 0 / 5 / 0 | 0 | — |
| ×2 | burnSaver guard | 809 | 0 / 5 / 0 | 0 | — |
| ×2 | burnSaver fold | 817 | 0 / 5 / 0 | 0 | — |
| ×2 | burnSaver damage | 710 | 1 / 4 / 0 | +4.591 | +4.591 HS |
| ×2 | putBack off | 754 | 0 / 0 / 5 | −2.574 | — |
| ×2 | bandHired winner | 768 | 0 / 4 / 1 | −8.040 | — |
| ×2 | bandHired none | 744 | 0 / 4 / 1 | −29.688 | — |
| ×4 | retypeExhaustive 10 000 | 2,122 | 0 / 5 / 0 | 0 | — |
| ×4 | EXHAUSTIVE 50 000 | 2,361 | 0 / 5 / 0 | 0 | — |
| ×4 | tierSeed | 2,121 | 0 / 5 / 0 | 0 | — |
| ×4 | burnSaver guard | 2,260 | 0 / 5 / 0 | 0 | — |
| ×4 | burnSaver fold | 2,221 | 0 / 5 / 0 | 0 | — |
| ×4 | burnSaver damage | 2,014 | 1 / 4 / 0 | +4.591 | +4.591 HS |
| ×4 | putBack off | 2,246 | 0 / 0 / 5 | −2.574 | — |
| ×4 | bandHired winner | 2,320 | 0 / 4 / 1 | −8.040 | — |
| ×4 | bandHired none | 2,113 | 0 / 4 / 1 | −29.688 | — |
| ×8 | retypeExhaustive 10 000 | 2,601 | 0 / 4 / 0 | 0 | — |
| ×8 | EXHAUSTIVE 50 000 | 3,007 | 0 / 4 / 0 | 0 | — |
| ×8 | tierSeed | 2,511 | 0 / 4 / 0 | 0 | — |
| ×8 | burnSaver guard | 2,597 | 0 / 4 / 0 | 0 | — |
| ×8 | burnSaver fold | 2,672 | 0 / 4 / 0 | 0 | — |
| ×8 | burnSaver damage | 2,509 | 0 / 4 / 0 | 0 | — |
| ×8 | putBack off | 2,649 | 0 / 0 / 4 | −10.349 | — |
| ×8 | bandHired winner | 2,679 | 0 / 4 / 0 | 0 | — |
| ×8 | bandHired none | 2,571 | 1 / 2 / 1 | −25.136 | +4.851 SW |

## first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp)

| level | variant | ms | stops better / equal / worse | Σ rated | best stop |
|---|---|---:|---|---:|---|
| ×1 | retypeExhaustive 10 000 | 1,791 | 0 / 5 / 0 | 0 | — |
| ×1 | EXHAUSTIVE 50 000 | 2,435 | 0 / 5 / 0 | 0 | — |
| ×1 | tierSeed | 1,746 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver guard | 1,849 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver fold | 1,745 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver damage | 1,728 | 0 / 5 / 0 | 0 | — |
| ×1 | putBack off | 1,660 | 0 / 0 / 5 | −52.668 | — |
| ×1 | bandHired winner | 1,805 | 0 / 5 / 0 | 0 | — |
| ×1 | bandHired none | 1,757 | 0 / 2 / 2 | −7.685 | — |
| ×2 | retypeExhaustive 10 000 | 2,425 | 0 / 5 / 0 | 0 | — |
| ×2 | EXHAUSTIVE 50 000 | 2,823 | 0 / 5 / 0 | 0 | — |
| ×2 | tierSeed | 2,493 | 0 / 5 / 0 | 0 | — |
| ×2 | burnSaver guard | 2,521 | 0 / 5 / 0 | 0 | — |
| ×2 | burnSaver fold | 2,461 | 0 / 5 / 0 | 0 | — |
| ×2 | burnSaver damage | 2,465 | 0 / 5 / 0 | 0 | — |
| ×2 | putBack off | 2,328 | 0 / 0 / 5 | −52.668 | — |
| ×2 | bandHired winner | 2,607 | 1 / 4 / 0 | +3.680 | +3.680 SS |
| ×2 | bandHired none | 2,515 | 0 / 2 / 2 | −7.685 | — |
| ×4 | retypeExhaustive 10 000 | 6,551 | 0 / 5 / 0 | 0 | — |
| ×4 | EXHAUSTIVE 50 000 | 7,252 | 0 / 5 / 0 | 0 | — |
| ×4 | tierSeed | 6,888 | 0 / 5 / 0 | 0 | — |
| ×4 | burnSaver guard | 7,040 | 0 / 5 / 0 | 0 | — |
| ×4 | burnSaver fold | 7,034 | 0 / 5 / 0 | 0 | — |
| ×4 | burnSaver damage | 7,040 | 0 / 5 / 0 | 0 | — |
| ×4 | putBack off | 6,494 | 0 / 0 / 5 | −52.750 | — |
| ×4 | bandHired winner | 7,068 | 1 / 2 / 0 | +15.095 | +15.095 SW |
| ×4 | bandHired none | 7,249 | 0 / 2 / 2 | −7.741 | — |
| ×8 | retypeExhaustive 10 000 | 8,195 | 0 / 5 / 0 | 0 | — |
| ×8 | EXHAUSTIVE 50 000 | 8,694 | 0 / 5 / 0 | 0 | — |
| ×8 | tierSeed | 8,642 | 0 / 5 / 0 | 0 | — |
| ×8 | burnSaver guard | 8,470 | 0 / 5 / 0 | 0 | — |
| ×8 | burnSaver fold | 8,844 | 0 / 5 / 0 | 0 | — |
| ×8 | burnSaver damage | 8,715 | 1 / 4 / 0 | +1.489 | +1.489 HS |
| ×8 | putBack off | 8,115 | 0 / 0 / 5 | −49.167 | — |
| ×8 | bandHired winner | 8,858 | 0 / 4 / 1 | −2.232 | — |
| ×8 | bandHired none | 8,968 | 0 / 2 / 2 | −18.415 | — |

## the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

| level | variant | ms | stops better / equal / worse | Σ rated | best stop |
|---|---|---:|---|---:|---|
| ×1 | retypeExhaustive 10 000 | 108 | 0 / 3 / 0 | 0 | — |
| ×1 | EXHAUSTIVE 50 000 | 2,158 | 1 / 2 / 0 | +0.698 | +0.698 SS |
| ×1 | tierSeed | 114 | 0 / 3 / 0 | 0 | — |
| ×1 | burnSaver guard | 104 | 0 / 3 / 0 | 0 | — |
| ×1 | burnSaver fold | 100 | 0 / 3 / 0 | 0 | — |
| ×1 | burnSaver damage | 99 | 0 / 3 / 0 | 0 | — |
| ×1 | putBack off | 52 | 0 / 0 / 3 | −12.919 | — |
| ×1 | bandHired winner | 104 | 0 / 3 / 0 | 0 | — |
| ×1 | bandHired none | 110 | 0 / 2 / 1 | −21.113 | — |
| ×2 | retypeExhaustive 10 000 | 104 | 0 / 3 / 0 | 0 | — |
| ×2 | EXHAUSTIVE 50 000 | 1,828 | 1 / 2 / 0 | +0.698 | +0.698 SS |
| ×2 | tierSeed | 112 | 0 / 3 / 0 | 0 | — |
| ×2 | burnSaver guard | 101 | 0 / 3 / 0 | 0 | — |
| ×2 | burnSaver fold | 100 | 0 / 3 / 0 | 0 | — |
| ×2 | burnSaver damage | 104 | 0 / 3 / 0 | 0 | — |
| ×2 | putBack off | 53 | 0 / 0 / 3 | −12.919 | — |
| ×2 | bandHired winner | 110 | 0 / 3 / 0 | 0 | — |
| ×2 | bandHired none | 103 | 0 / 2 / 1 | −21.113 | — |
| ×4 | retypeExhaustive 10 000 | 103 | 0 / 3 / 0 | 0 | — |
| ×4 | EXHAUSTIVE 50 000 | 1,848 | 1 / 2 / 0 | +0.698 | +0.698 SS |
| ×4 | tierSeed | 223 | 0 / 3 / 0 | 0 | — |
| ×4 | burnSaver guard | 216 | 0 / 3 / 0 | 0 | — |
| ×4 | burnSaver fold | 221 | 0 / 3 / 0 | 0 | — |
| ×4 | burnSaver damage | 222 | 0 / 3 / 0 | 0 | — |
| ×4 | putBack off | 57 | 0 / 0 / 3 | −12.919 | — |
| ×4 | bandHired winner | 219 | 0 / 3 / 0 | 0 | — |
| ×4 | bandHired none | 225 | 0 / 2 / 1 | −21.113 | — |
| ×8 | retypeExhaustive 10 000 | 129 | 0 / 2 / 1 | −0.693 | — |
| ×8 | EXHAUSTIVE 50 000 | 2,206 | 0 / 3 / 0 | 0 | — |
| ×8 | tierSeed | 2,042 | 0 / 3 / 0 | 0 | — |
| ×8 | burnSaver guard | 2,191 | 0 / 3 / 0 | 0 | — |
| ×8 | burnSaver fold | 2,234 | 0 / 3 / 0 | 0 | — |
| ×8 | burnSaver damage | 2,364 | 0 / 3 / 0 | 0 | — |
| ×8 | putBack off | 56 | 0 / 0 / 3 | −13.604 | — |
| ×8 | bandHired winner | 2,069 | 0 / 3 / 0 | 0 | — |
| ×8 | bandHired none | 2,228 | 0 / 2 / 1 | −20.838 | — |

## 2026-09-17 export, its setup (7 000 leadership)

| level | variant | ms | stops better / equal / worse | Σ rated | best stop |
|---|---|---:|---|---:|---|
| ×1 | retypeExhaustive 10 000 | 389 | 0 / 5 / 0 | 0 | — |
| ×1 | EXHAUSTIVE 50 000 | 387 | 0 / 5 / 0 | 0 | — |
| ×1 | tierSeed | 477 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver guard | 413 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver fold | 398 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver damage | 391 | 1 / 4 / 0 | +1.409 | +1.409 HS |
| ×1 | putBack off | 114 | 0 / 0 / 5 | −35.783 | — |
| ×1 | bandHired winner | 379 | 1 / 2 / 1 | +7.291 | +7.691 SW |
| ×1 | bandHired none | 395 | 0 / 3 / 1 | −28.133 | — |
| ×2 | retypeExhaustive 10 000 | 547 | 0 / 5 / 0 | 0 | — |
| ×2 | EXHAUSTIVE 50 000 | 450 | 0 / 5 / 0 | 0 | — |
| ×2 | tierSeed | 419 | 0 / 5 / 0 | 0 | — |
| ×2 | burnSaver guard | 417 | 0 / 5 / 0 | 0 | — |
| ×2 | burnSaver fold | 408 | 0 / 5 / 0 | 0 | — |
| ×2 | burnSaver damage | 406 | 1 / 4 / 0 | +1.409 | +1.409 HS |
| ×2 | putBack off | 168 | 0 / 0 / 5 | −35.783 | — |
| ×2 | bandHired winner | 463 | 1 / 2 / 1 | +7.291 | +7.691 SW |
| ×2 | bandHired none | 437 | 0 / 3 / 1 | −28.133 | — |
| ×4 | retypeExhaustive 10 000 | 459 | 0 / 5 / 0 | 0 | — |
| ×4 | EXHAUSTIVE 50 000 | 597 | 0 / 5 / 0 | 0 | — |
| ×4 | tierSeed | 472 | 0 / 5 / 0 | 0 | — |
| ×4 | burnSaver guard | 474 | 0 / 5 / 0 | 0 | — |
| ×4 | burnSaver fold | 475 | 0 / 5 / 0 | 0 | — |
| ×4 | burnSaver damage | 468 | 1 / 4 / 0 | +1.409 | +1.409 HS |
| ×4 | putBack off | 220 | 0 / 0 / 5 | −35.783 | — |
| ×4 | bandHired winner | 522 | 1 / 2 / 1 | +7.291 | +7.691 SW |
| ×4 | bandHired none | 485 | 0 / 3 / 1 | −28.133 | — |
| ×8 | retypeExhaustive 10 000 | 569 | 0 / 5 / 0 | 0 | — |
| ×8 | EXHAUSTIVE 50 000 | 695 | 0 / 5 / 0 | 0 | — |
| ×8 | tierSeed | 607 | 0 / 5 / 0 | 0 | — |
| ×8 | burnSaver guard | 554 | 0 / 5 / 0 | 0 | — |
| ×8 | burnSaver fold | 560 | 0 / 5 / 0 | 0 | — |
| ×8 | burnSaver damage | 688 | 1 / 4 / 0 | +1.409 | +1.409 HS |
| ×8 | putBack off | 309 | 0 / 0 / 5 | −35.783 | — |
| ×8 | bandHired winner | 554 | 1 / 2 / 1 | +7.291 | +7.691 SW |
| ×8 | bandHired none | 648 | 0 / 3 / 1 | −28.133 | — |

## 2026-09-17 export, 12 000 leadership

| level | variant | ms | stops better / equal / worse | Σ rated | best stop |
|---|---|---:|---|---:|---|
| ×1 | retypeExhaustive 10 000 | 381 | 0 / 4 / 0 | 0 | — |
| ×1 | EXHAUSTIVE 50 000 | 370 | 0 / 4 / 0 | 0 | — |
| ×1 | tierSeed | 371 | 0 / 4 / 0 | 0 | — |
| ×1 | burnSaver guard | 333 | 0 / 2 / 2 | −3.488 | — |
| ×1 | burnSaver fold | 332 | 0 / 4 / 0 | 0 | — |
| ×1 | burnSaver damage | 391 | 0 / 4 / 0 | 0 | — |
| ×1 | putBack off | 109 | 0 / 0 / 4 | −22.236 | — |
| ×1 | bandHired winner | 383 | 1 / 2 / 1 | −1.190 | +3.586 SS |
| ×1 | bandHired none | 250 | 0 / 2 / 1 | −28.219 | — |
| ×2 | retypeExhaustive 10 000 | 420 | 0 / 4 / 0 | 0 | — |
| ×2 | EXHAUSTIVE 50 000 | 387 | 0 / 4 / 0 | 0 | — |
| ×2 | tierSeed | 378 | 0 / 4 / 0 | 0 | — |
| ×2 | burnSaver guard | 352 | 0 / 2 / 2 | −3.488 | — |
| ×2 | burnSaver fold | 322 | 0 / 4 / 0 | 0 | — |
| ×2 | burnSaver damage | 394 | 0 / 4 / 0 | 0 | — |
| ×2 | putBack off | 125 | 0 / 0 / 4 | −22.236 | — |
| ×2 | bandHired winner | 406 | 1 / 2 / 1 | −1.190 | +3.586 SS |
| ×2 | bandHired none | 263 | 0 / 2 / 1 | −28.219 | — |
| ×4 | retypeExhaustive 10 000 | 449 | 0 / 4 / 0 | 0 | — |
| ×4 | EXHAUSTIVE 50 000 | 392 | 0 / 4 / 0 | 0 | — |
| ×4 | tierSeed | 378 | 0 / 4 / 0 | 0 | — |
| ×4 | burnSaver guard | 335 | 0 / 2 / 2 | −3.488 | — |
| ×4 | burnSaver fold | 331 | 0 / 4 / 0 | 0 | — |
| ×4 | burnSaver damage | 391 | 0 / 4 / 0 | 0 | — |
| ×4 | putBack off | 112 | 0 / 0 / 4 | −22.236 | — |
| ×4 | bandHired winner | 399 | 1 / 2 / 1 | −1.190 | +3.586 SS |
| ×4 | bandHired none | 319 | 0 / 2 / 1 | −28.219 | — |
| ×8 | retypeExhaustive 10 000 | 380 | 0 / 4 / 0 | 0 | — |
| ×8 | EXHAUSTIVE 50 000 | 395 | 0 / 4 / 0 | 0 | — |
| ×8 | tierSeed | 379 | 0 / 4 / 0 | 0 | — |
| ×8 | burnSaver guard | 345 | 0 / 2 / 2 | −3.488 | — |
| ×8 | burnSaver fold | 345 | 0 / 4 / 0 | 0 | — |
| ×8 | burnSaver damage | 399 | 0 / 4 / 0 | 0 | — |
| ×8 | putBack off | 132 | 0 / 0 / 4 | −22.236 | — |
| ×8 | bandHired winner | 435 | 1 / 2 / 1 | −1.190 | +3.586 SS |
| ×8 | bandHired none | 263 | 0 / 2 / 1 | −28.219 | — |

## live account of 2026-09-18 (one hired type, 20 000 leadership)

| level | variant | ms | stops better / equal / worse | Σ rated | best stop |
|---|---|---:|---|---:|---|
| ×1 | retypeExhaustive 10 000 | 221 | 0 / 4 / 0 | 0 | — |
| ×1 | EXHAUSTIVE 50 000 | 213 | 0 / 4 / 0 | 0 | — |
| ×1 | tierSeed | 217 | 0 / 4 / 0 | 0 | — |
| ×1 | burnSaver guard | 194 | 0 / 4 / 0 | 0 | — |
| ×1 | burnSaver fold | 262 | 1 / 3 / 0 | +27.571 | +27.571 SS |
| ×1 | burnSaver damage | 213 | 0 / 4 / 0 | 0 | — |
| ×1 | putBack off | 5 | 0 / 0 / 4 | −6.065 | — |
| ×1 | bandHired winner | 190 | 0 / 3 / 1 | −0.787 | — |
| ×1 | bandHired none | 217 | 0 / 3 / 1 | −17.489 | — |
| ×2 | retypeExhaustive 10 000 | 215 | 0 / 4 / 0 | 0 | — |
| ×2 | EXHAUSTIVE 50 000 | 209 | 0 / 4 / 0 | 0 | — |
| ×2 | tierSeed | 216 | 0 / 4 / 0 | 0 | — |
| ×2 | burnSaver guard | 185 | 0 / 4 / 0 | 0 | — |
| ×2 | burnSaver fold | 256 | 1 / 3 / 0 | +27.571 | +27.571 SS |
| ×2 | burnSaver damage | 215 | 0 / 4 / 0 | 0 | — |
| ×2 | putBack off | 6 | 0 / 0 / 4 | −6.065 | — |
| ×2 | bandHired winner | 191 | 0 / 3 / 1 | −0.787 | — |
| ×2 | bandHired none | 214 | 0 / 3 / 1 | −17.489 | — |
| ×4 | retypeExhaustive 10 000 | 209 | 0 / 4 / 0 | 0 | — |
| ×4 | EXHAUSTIVE 50 000 | 209 | 0 / 4 / 0 | 0 | — |
| ×4 | tierSeed | 211 | 0 / 4 / 0 | 0 | — |
| ×4 | burnSaver guard | 189 | 0 / 4 / 0 | 0 | — |
| ×4 | burnSaver fold | 254 | 1 / 3 / 0 | +27.571 | +27.571 SS |
| ×4 | burnSaver damage | 208 | 0 / 4 / 0 | 0 | — |
| ×4 | putBack off | 7 | 0 / 0 / 4 | −6.065 | — |
| ×4 | bandHired winner | 188 | 0 / 3 / 1 | −0.787 | — |
| ×4 | bandHired none | 207 | 0 / 3 / 1 | −17.489 | — |
| ×8 | retypeExhaustive 10 000 | 205 | 0 / 4 / 0 | 0 | — |
| ×8 | EXHAUSTIVE 50 000 | 209 | 0 / 4 / 0 | 0 | — |
| ×8 | tierSeed | 208 | 0 / 4 / 0 | 0 | — |
| ×8 | burnSaver guard | 188 | 0 / 4 / 0 | 0 | — |
| ×8 | burnSaver fold | 256 | 1 / 3 / 0 | +27.571 | +27.571 SS |
| ×8 | burnSaver damage | 208 | 0 / 4 / 0 | 0 | — |
| ×8 | putBack off | 6 | 0 / 0 / 4 | −6.065 | — |
| ×8 | bandHired winner | 187 | 0 / 3 / 1 | −0.787 | — |
| ×8 | bandHired none | 212 | 0 / 3 / 1 | −17.489 | — |

## live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

| level | variant | ms | stops better / equal / worse | Σ rated | best stop |
|---|---|---:|---|---:|---|
| ×1 | retypeExhaustive 10 000 | 372 | 0 / 5 / 0 | 0 | — |
| ×1 | EXHAUSTIVE 50 000 | 445 | 0 / 5 / 0 | 0 | — |
| ×1 | tierSeed | 396 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver guard | 392 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver fold | 396 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver damage | 389 | 1 / 4 / 0 | +0.976 | +0.976 HS |
| ×1 | putBack off | 82 | 0 / 0 / 5 | −39.909 | — |
| ×1 | bandHired winner | 311 | 0 / 2 / 2 | −8.642 | — |
| ×1 | bandHired none | 354 | 0 / 3 / 1 | −22.818 | — |
| ×2 | retypeExhaustive 10 000 | 346 | 0 / 4 / 0 | 0 | — |
| ×2 | EXHAUSTIVE 50 000 | 409 | 0 / 4 / 0 | 0 | — |
| ×2 | tierSeed | 398 | 0 / 4 / 0 | 0 | — |
| ×2 | burnSaver guard | 366 | 0 / 4 / 0 | 0 | — |
| ×2 | burnSaver fold | 356 | 0 / 4 / 0 | 0 | — |
| ×2 | burnSaver damage | 348 | 1 / 3 / 0 | +0.976 | +0.976 HS |
| ×2 | putBack off | 116 | 0 / 0 / 4 | −34.958 | — |
| ×2 | bandHired winner | 349 | 1 / 2 / 1 | +0.707 | +6.131 SS |
| ×2 | bandHired none | 234 | 0 / 2 / 1 | −28.951 | — |
| ×4 | retypeExhaustive 10 000 | 426 | 0 / 4 / 0 | 0 | — |
| ×4 | EXHAUSTIVE 50 000 | 387 | 0 / 4 / 0 | 0 | — |
| ×4 | tierSeed | 374 | 0 / 4 / 0 | 0 | — |
| ×4 | burnSaver guard | 372 | 0 / 4 / 0 | 0 | — |
| ×4 | burnSaver fold | 382 | 0 / 4 / 0 | 0 | — |
| ×4 | burnSaver damage | 377 | 1 / 3 / 0 | +0.976 | +0.976 HS |
| ×4 | putBack off | 150 | 0 / 0 / 4 | −33.712 | — |
| ×4 | bandHired winner | 372 | 1 / 2 / 1 | +0.707 | +6.131 SS |
| ×4 | bandHired none | 269 | 0 / 2 / 1 | −28.951 | — |
| ×8 | retypeExhaustive 10 000 | 397 | 0 / 4 / 0 | 0 | — |
| ×8 | EXHAUSTIVE 50 000 | 394 | 0 / 4 / 0 | 0 | — |
| ×8 | tierSeed | 400 | 0 / 4 / 0 | 0 | — |
| ×8 | burnSaver guard | 373 | 0 / 4 / 0 | 0 | — |
| ×8 | burnSaver fold | 370 | 0 / 4 / 0 | 0 | — |
| ×8 | burnSaver damage | 375 | 1 / 3 / 0 | +0.976 | +0.976 HS |
| ×8 | putBack off | 145 | 0 / 0 / 4 | −33.712 | — |
| ×8 | bandHired winner | 414 | 1 / 2 / 1 | +0.707 | +6.131 SS |
| ×8 | bandHired none | 293 | 0 / 2 / 1 | −28.951 | — |

## Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)

| level | variant | ms | stops better / equal / worse | Σ rated | best stop |
|---|---|---:|---|---:|---|
| ×1 | retypeExhaustive 10 000 | 108 | 0 / 4 / 0 | 0 | — |
| ×1 | EXHAUSTIVE 50 000 | 712 | 1 / 2 / 1 | +0.000 | +0.000 HS |
| ×1 | tierSeed | 101 | 0 / 4 / 0 | 0 | — |
| ×1 | burnSaver guard | 103 | 0 / 4 / 0 | 0 | — |
| ×1 | burnSaver fold | 103 | 0 / 4 / 0 | 0 | — |
| ×1 | burnSaver damage | 134 | 1 / 3 / 0 | +9.520 | +9.520 HS |
| ×1 | putBack off | 75 | 0 / 0 / 4 | −5.442 | — |
| ×1 | bandHired winner | 151 | 0 / 4 / 0 | 0 | — |
| ×1 | bandHired none | 116 | 0 / 3 / 1 | −25.038 | — |
| ×2 | retypeExhaustive 10 000 | 133 | 0 / 4 / 0 | 0 | — |
| ×2 | EXHAUSTIVE 50 000 | 709 | 1 / 2 / 1 | +0.000 | +0.000 HS |
| ×2 | tierSeed | 179 | 0 / 4 / 0 | 0 | — |
| ×2 | burnSaver guard | 138 | 0 / 4 / 0 | 0 | — |
| ×2 | burnSaver fold | 138 | 0 / 4 / 0 | 0 | — |
| ×2 | burnSaver damage | 173 | 1 / 3 / 0 | +9.520 | +9.520 HS |
| ×2 | putBack off | 100 | 0 / 0 / 4 | −5.442 | — |
| ×2 | bandHired winner | 129 | 0 / 4 / 0 | 0 | — |
| ×2 | bandHired none | 128 | 0 / 3 / 1 | −25.038 | — |
| ×4 | retypeExhaustive 10 000 | 248 | 0 / 4 / 0 | 0 | — |
| ×4 | EXHAUSTIVE 50 000 | 829 | 1 / 2 / 1 | +0.000 | +0.000 HS |
| ×4 | tierSeed | 209 | 0 / 4 / 0 | 0 | — |
| ×4 | burnSaver guard | 222 | 0 / 4 / 0 | 0 | — |
| ×4 | burnSaver fold | 211 | 0 / 4 / 0 | 0 | — |
| ×4 | burnSaver damage | 374 | 1 / 3 / 0 | +9.520 | +9.520 HS |
| ×4 | putBack off | 171 | 0 / 0 / 4 | −5.442 | — |
| ×4 | bandHired winner | 218 | 0 / 4 / 0 | 0 | — |
| ×4 | bandHired none | 213 | 0 / 3 / 1 | −25.038 | — |
| ×8 | retypeExhaustive 10 000 | 341 | 1 / 2 / 1 | −0.000 | +0.000 SW |
| ×8 | EXHAUSTIVE 50 000 | 905 | 0 / 4 / 0 | 0 | — |
| ×8 | tierSeed | 802 | 0 / 4 / 0 | 0 | — |
| ×8 | burnSaver guard | 761 | 0 / 4 / 0 | 0 | — |
| ×8 | burnSaver fold | 1,012 | 0 / 4 / 0 | 0 | — |
| ×8 | burnSaver damage | 1,637 | 1 / 3 / 0 | +9.520 | +9.520 HS |
| ×8 | putBack off | 363 | 0 / 0 / 4 | −5.442 | — |
| ×8 | bandHired winner | 845 | 0 / 4 / 0 | 0 | — |
| ×8 | bandHired none | 768 | 0 / 3 / 1 | −25.038 | — |

## the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)

| level | variant | ms | stops better / equal / worse | Σ rated | best stop |
|---|---|---:|---|---:|---|
| ×1 | retypeExhaustive 10 000 | 193 | 0 / 5 / 0 | 0 | — |
| ×1 | EXHAUSTIVE 50 000 | 182 | 0 / 5 / 0 | 0 | — |
| ×1 | tierSeed | 176 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver guard | 179 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver fold | 242 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver damage | 191 | 0 / 5 / 0 | 0 | — |
| ×1 | putBack off | 55 | 0 / 0 / 5 | −49.556 | — |
| ×1 | bandHired winner | 178 | 1 / 2 / 2 | −53.013 | +13.100 SS |
| ×1 | bandHired none | 122 | 0 / 2 / 2 | −19.384 | — |
| ×2 | retypeExhaustive 10 000 | 188 | 0 / 5 / 0 | 0 | — |
| ×2 | EXHAUSTIVE 50 000 | 185 | 0 / 5 / 0 | 0 | — |
| ×2 | tierSeed | 186 | 0 / 5 / 0 | 0 | — |
| ×2 | burnSaver guard | 187 | 0 / 5 / 0 | 0 | — |
| ×2 | burnSaver fold | 195 | 0 / 5 / 0 | 0 | — |
| ×2 | burnSaver damage | 192 | 0 / 5 / 0 | 0 | — |
| ×2 | putBack off | 53 | 0 / 0 / 5 | −49.161 | — |
| ×2 | bandHired winner | 175 | 1 / 2 / 2 | −53.013 | +13.100 SS |
| ×2 | bandHired none | 114 | 0 / 2 / 2 | −19.384 | — |
| ×4 | retypeExhaustive 10 000 | 191 | 0 / 5 / 0 | 0 | — |
| ×4 | EXHAUSTIVE 50 000 | 205 | 0 / 5 / 0 | 0 | — |
| ×4 | tierSeed | 203 | 0 / 5 / 0 | 0 | — |
| ×4 | burnSaver guard | 190 | 0 / 5 / 0 | 0 | — |
| ×4 | burnSaver fold | 222 | 0 / 5 / 0 | 0 | — |
| ×4 | burnSaver damage | 197 | 0 / 5 / 0 | 0 | — |
| ×4 | putBack off | 59 | 0 / 0 / 5 | −49.161 | — |
| ×4 | bandHired winner | 173 | 1 / 2 / 2 | −53.013 | +13.100 SS |
| ×4 | bandHired none | 122 | 0 / 2 / 2 | −19.384 | — |
| ×8 | retypeExhaustive 10 000 | 192 | 0 / 5 / 0 | 0 | — |
| ×8 | EXHAUSTIVE 50 000 | 185 | 0 / 5 / 0 | 0 | — |
| ×8 | tierSeed | 188 | 0 / 5 / 0 | 0 | — |
| ×8 | burnSaver guard | 182 | 0 / 5 / 0 | 0 | — |
| ×8 | burnSaver fold | 185 | 0 / 5 / 0 | 0 | — |
| ×8 | burnSaver damage | 186 | 0 / 5 / 0 | 0 | — |
| ×8 | putBack off | 53 | 0 / 0 / 5 | −49.161 | — |
| ×8 | bandHired winner | 173 | 1 / 2 / 2 | −53.013 | +13.100 SS |
| ×8 | bandHired none | 114 | 0 / 2 / 2 | −19.384 | — |

## his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)

| level | variant | ms | stops better / equal / worse | Σ rated | best stop |
|---|---|---:|---|---:|---|
| ×1 | retypeExhaustive 10 000 | 123 | 0 / 5 / 0 | 0 | — |
| ×1 | EXHAUSTIVE 50 000 | 121 | 0 / 5 / 0 | 0 | — |
| ×1 | tierSeed | 119 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver guard | 123 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver fold | 121 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver damage | 123 | 0 / 5 / 0 | 0 | — |
| ×1 | putBack off | 10 | 0 / 1 / 4 | −14.687 | — |
| ×1 | bandHired winner | 98 | 0 / 1 / 4 | −296.581 | — |
| ×1 | bandHired none | 111 | 0 / 4 / 1 | −22.528 | — |
| ×2 | retypeExhaustive 10 000 | 116 | 0 / 5 / 0 | 0 | — |
| ×2 | EXHAUSTIVE 50 000 | 117 | 0 / 5 / 0 | 0 | — |
| ×2 | tierSeed | 114 | 0 / 5 / 0 | 0 | — |
| ×2 | burnSaver guard | 113 | 0 / 5 / 0 | 0 | — |
| ×2 | burnSaver fold | 117 | 0 / 5 / 0 | 0 | — |
| ×2 | burnSaver damage | 113 | 0 / 5 / 0 | 0 | — |
| ×2 | putBack off | 9 | 0 / 1 / 4 | −14.687 | — |
| ×2 | bandHired winner | 95 | 0 / 1 / 4 | −296.581 | — |
| ×2 | bandHired none | 113 | 0 / 4 / 1 | −22.528 | — |
| ×4 | retypeExhaustive 10 000 | 111 | 0 / 5 / 0 | 0 | — |
| ×4 | EXHAUSTIVE 50 000 | 116 | 0 / 5 / 0 | 0 | — |
| ×4 | tierSeed | 115 | 0 / 5 / 0 | 0 | — |
| ×4 | burnSaver guard | 112 | 0 / 5 / 0 | 0 | — |
| ×4 | burnSaver fold | 114 | 0 / 5 / 0 | 0 | — |
| ×4 | burnSaver damage | 114 | 0 / 5 / 0 | 0 | — |
| ×4 | putBack off | 9 | 0 / 1 / 4 | −14.687 | — |
| ×4 | bandHired winner | 92 | 0 / 1 / 4 | −296.581 | — |
| ×4 | bandHired none | 114 | 0 / 4 / 1 | −22.528 | — |
| ×8 | retypeExhaustive 10 000 | 116 | 0 / 5 / 0 | 0 | — |
| ×8 | EXHAUSTIVE 50 000 | 117 | 0 / 5 / 0 | 0 | — |
| ×8 | tierSeed | 116 | 0 / 5 / 0 | 0 | — |
| ×8 | burnSaver guard | 122 | 0 / 5 / 0 | 0 | — |
| ×8 | burnSaver fold | 124 | 0 / 5 / 0 | 0 | — |
| ×8 | burnSaver damage | 140 | 0 / 5 / 0 | 0 | — |
| ×8 | putBack off | 11 | 0 / 1 / 4 | −14.687 | — |
| ×8 | bandHired winner | 109 | 0 / 1 / 4 | −296.581 | — |
| ×8 | bandHired none | 123 | 0 / 4 / 1 | −22.528 | — |

## his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)

| level | variant | ms | stops better / equal / worse | Σ rated | best stop |
|---|---|---:|---|---:|---|
| ×1 | retypeExhaustive 10 000 | 117 | 0 / 5 / 0 | 0 | — |
| ×1 | EXHAUSTIVE 50 000 | 114 | 0 / 5 / 0 | 0 | — |
| ×1 | tierSeed | 104 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver guard | 108 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver fold | 107 | 0 / 5 / 0 | 0 | — |
| ×1 | burnSaver damage | 107 | 1 / 4 / 0 | +1.601 | +1.601 HS |
| ×1 | putBack off | 8 | 0 / 0 / 4 | −114.086 | — |
| ×1 | bandHired winner | 39 | 0 / 2 / 2 | −133.515 | — |
| ×1 | bandHired none | 50 | 0 / 3 / 1 | −19.490 | — |
| ×2 | retypeExhaustive 10 000 | 114 | 0 / 5 / 0 | 0 | — |
| ×2 | EXHAUSTIVE 50 000 | 114 | 0 / 5 / 0 | 0 | — |
| ×2 | tierSeed | 110 | 0 / 5 / 0 | 0 | — |
| ×2 | burnSaver guard | 115 | 0 / 5 / 0 | 0 | — |
| ×2 | burnSaver fold | 116 | 0 / 5 / 0 | 0 | — |
| ×2 | burnSaver damage | 109 | 1 / 4 / 0 | +1.601 | +1.601 HS |
| ×2 | putBack off | 10 | 0 / 0 / 4 | −114.086 | — |
| ×2 | bandHired winner | 42 | 0 / 2 / 2 | −133.515 | — |
| ×2 | bandHired none | 51 | 0 / 3 / 1 | −19.490 | — |
| ×4 | retypeExhaustive 10 000 | 109 | 0 / 5 / 0 | 0 | — |
| ×4 | EXHAUSTIVE 50 000 | 110 | 0 / 5 / 0 | 0 | — |
| ×4 | tierSeed | 106 | 0 / 5 / 0 | 0 | — |
| ×4 | burnSaver guard | 107 | 0 / 5 / 0 | 0 | — |
| ×4 | burnSaver fold | 107 | 0 / 5 / 0 | 0 | — |
| ×4 | burnSaver damage | 107 | 1 / 4 / 0 | +1.601 | +1.601 HS |
| ×4 | putBack off | 7 | 0 / 0 / 4 | −114.086 | — |
| ×4 | bandHired winner | 40 | 0 / 2 / 2 | −133.515 | — |
| ×4 | bandHired none | 53 | 0 / 3 / 1 | −19.490 | — |
| ×8 | retypeExhaustive 10 000 | 116 | 0 / 5 / 0 | 0 | — |
| ×8 | EXHAUSTIVE 50 000 | 108 | 0 / 5 / 0 | 0 | — |
| ×8 | tierSeed | 123 | 0 / 5 / 0 | 0 | — |
| ×8 | burnSaver guard | 106 | 0 / 5 / 0 | 0 | — |
| ×8 | burnSaver fold | 102 | 0 / 5 / 0 | 0 | — |
| ×8 | burnSaver damage | 105 | 1 / 4 / 0 | +1.601 | +1.601 HS |
| ×8 | putBack off | 7 | 0 / 0 / 4 | −114.086 | — |
| ×8 | bandHired winner | 39 | 0 / 2 / 2 | −133.515 | — |
| ×8 | bandHired none | 47 | 0 / 3 / 1 | −19.490 | — |

## his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80)

| level | variant | ms | stops better / equal / worse | Σ rated | best stop |
|---|---|---:|---|---:|---|
| ×1 | retypeExhaustive 10 000 | 178 | 0 / 3 / 0 | 0 | — |
| ×1 | EXHAUSTIVE 50 000 | 1,095 | 1 / 2 / 0 | +0.039 | +0.039 SS |
| ×1 | tierSeed | 192 | 0 / 3 / 0 | 0 | — |
| ×1 | burnSaver guard | 174 | 0 / 3 / 0 | 0 | — |
| ×1 | burnSaver fold | 178 | 0 / 3 / 0 | 0 | — |
| ×1 | burnSaver damage | 180 | 0 / 3 / 0 | 0 | — |
| ×1 | putBack off | 159 | 0 / 0 / 3 | −1.553 | — |
| ×1 | bandHired winner | 210 | 1 / 2 / 0 | +1.698 | +1.698 SS |
| ×1 | bandHired none | 200 | 0 / 2 / 0 | 0 | — |
| ×2 | retypeExhaustive 10 000 | 195 | 0 / 3 / 0 | 0 | — |
| ×2 | EXHAUSTIVE 50 000 | 1,127 | 1 / 2 / 0 | +0.039 | +0.039 SS |
| ×2 | tierSeed | 215 | 0 / 3 / 0 | 0 | — |
| ×2 | burnSaver guard | 203 | 0 / 3 / 0 | 0 | — |
| ×2 | burnSaver fold | 199 | 0 / 3 / 0 | 0 | — |
| ×2 | burnSaver damage | 196 | 0 / 3 / 0 | 0 | — |
| ×2 | putBack off | 176 | 0 / 0 / 3 | −1.553 | — |
| ×2 | bandHired winner | 192 | 1 / 2 / 0 | +1.698 | +1.698 SS |
| ×2 | bandHired none | 199 | 0 / 2 / 0 | 0 | — |
| ×4 | retypeExhaustive 10 000 | 297 | 0 / 3 / 0 | 0 | — |
| ×4 | EXHAUSTIVE 50 000 | 1,126 | 1 / 2 / 0 | +0.039 | +0.039 SS |
| ×4 | tierSeed | 329 | 0 / 3 / 0 | 0 | — |
| ×4 | burnSaver guard | 316 | 0 / 3 / 0 | 0 | — |
| ×4 | burnSaver fold | 312 | 0 / 3 / 0 | 0 | — |
| ×4 | burnSaver damage | 386 | 0 / 3 / 0 | 0 | — |
| ×4 | putBack off | 251 | 0 / 0 / 3 | −1.553 | — |
| ×4 | bandHired winner | 327 | 1 / 2 / 0 | +1.698 | +1.698 SS |
| ×4 | bandHired none | 320 | 0 / 2 / 0 | 0 | — |
| ×8 | retypeExhaustive 10 000 | 355 | 0 / 2 / 1 | −0.039 | — |
| ×8 | EXHAUSTIVE 50 000 | 1,014 | 0 / 3 / 0 | 0 | — |
| ×8 | tierSeed | 1,008 | 0 / 3 / 0 | 0 | — |
| ×8 | burnSaver guard | 1,182 | 0 / 3 / 0 | 0 | — |
| ×8 | burnSaver fold | 1,134 | 0 / 3 / 0 | 0 | — |
| ×8 | burnSaver damage | 1,232 | 0 / 3 / 0 | 0 | — |
| ×8 | putBack off | 309 | 0 / 0 / 3 | −1.592 | — |
| ×8 | bandHired winner | 988 | 1 / 2 / 0 | +1.658 | +1.658 SS |
| ×8 | bandHired none | 1,127 | 0 / 2 / 0 | 0 | — |

## his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90)

| level | variant | ms | stops better / equal / worse | Σ rated | best stop |
|---|---|---:|---|---:|---|
| ×1 | retypeExhaustive 10 000 | 229 | 0 / 3 / 0 | 0 | — |
| ×1 | EXHAUSTIVE 50 000 | 791 | 2 / 0 / 1 | +0.000 | +0.000 MX |
| ×1 | tierSeed | 260 | 0 / 3 / 0 | 0 | — |
| ×1 | burnSaver guard | 232 | 0 / 3 / 0 | 0 | — |
| ×1 | burnSaver fold | 221 | 0 / 3 / 0 | 0 | — |
| ×1 | burnSaver damage | 225 | 1 / 2 / 0 | +23.844 | +23.844 HS |
| ×1 | putBack off | 210 | 0 / 0 / 3 | −1.186 | — |
| ×1 | bandHired winner | 265 | 0 / 3 / 0 | 0 | — |
| ×1 | bandHired none | 229 | 0 / 2 / 1 | −28.229 | — |
| ×2 | retypeExhaustive 10 000 | 261 | 0 / 3 / 0 | 0 | — |
| ×2 | EXHAUSTIVE 50 000 | 897 | 2 / 0 / 1 | +0.000 | +0.000 MX |
| ×2 | tierSeed | 264 | 0 / 3 / 0 | 0 | — |
| ×2 | burnSaver guard | 258 | 0 / 3 / 0 | 0 | — |
| ×2 | burnSaver fold | 291 | 0 / 3 / 0 | 0 | — |
| ×2 | burnSaver damage | 272 | 1 / 2 / 0 | +23.844 | +23.844 HS |
| ×2 | putBack off | 256 | 0 / 0 / 3 | −1.186 | — |
| ×2 | bandHired winner | 259 | 0 / 3 / 0 | 0 | — |
| ×2 | bandHired none | 257 | 0 / 2 / 1 | −28.229 | — |
| ×4 | retypeExhaustive 10 000 | 403 | 0 / 3 / 0 | 0 | — |
| ×4 | EXHAUSTIVE 50 000 | 1,008 | 2 / 0 / 1 | +0.000 | +0.000 MX |
| ×4 | tierSeed | 415 | 0 / 3 / 0 | 0 | — |
| ×4 | burnSaver guard | 396 | 0 / 3 / 0 | 0 | — |
| ×4 | burnSaver fold | 384 | 0 / 3 / 0 | 0 | — |
| ×4 | burnSaver damage | 448 | 1 / 2 / 0 | +23.844 | +23.844 HS |
| ×4 | putBack off | 383 | 0 / 0 / 3 | −1.186 | — |
| ×4 | bandHired winner | 416 | 0 / 3 / 0 | 0 | — |
| ×4 | bandHired none | 394 | 0 / 2 / 1 | −28.229 | — |
| ×8 | retypeExhaustive 10 000 | 547 | 1 / 0 / 2 | −0.000 | +0.000 SW |
| ×8 | EXHAUSTIVE 50 000 | 1,080 | 0 / 3 / 0 | 0 | — |
| ×8 | tierSeed | 1,118 | 0 / 3 / 0 | 0 | — |
| ×8 | burnSaver guard | 840 | 0 / 3 / 0 | 0 | — |
| ×8 | burnSaver fold | 839 | 0 / 3 / 0 | 0 | — |
| ×8 | burnSaver damage | 1,126 | 1 / 2 / 0 | +23.844 | +23.844 HS |
| ×8 | putBack off | 555 | 0 / 0 / 3 | −1.186 | — |
| ×8 | bandHired winner | 1,076 | 0 / 3 / 0 | 0 | — |
| ×8 | bandHired none | 1,155 | 0 / 2 / 1 | −28.229 | — |

## his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14)

| level | variant | ms | stops better / equal / worse | Σ rated | best stop |
|---|---|---:|---|---:|---|
| ×1 | retypeExhaustive 10 000 | 301 | 0 / 2 / 0 | 0 | — |
| ×1 | EXHAUSTIVE 50 000 | 289 | 0 / 2 / 0 | 0 | — |
| ×1 | tierSeed | 293 | 0 / 2 / 0 | 0 | — |
| ×1 | burnSaver guard | 312 | 0 / 2 / 0 | 0 | — |
| ×1 | burnSaver fold | 326 | 0 / 1 / 0 | 0 | — |
| ×1 | burnSaver damage | 290 | 0 / 2 / 0 | 0 | — |
| ×1 | putBack off | 211 | 0 / 0 / 2 | −5.551 | — |
| ×1 | bandHired winner | 306 | 0 / 2 / 0 | 0 | — |
| ×1 | bandHired none | 301 | 0 / 2 / 0 | 0 | — |
| ×2 | retypeExhaustive 10 000 | 409 | 0 / 2 / 0 | 0 | — |
| ×2 | EXHAUSTIVE 50 000 | 347 | 0 / 2 / 0 | 0 | — |
| ×2 | tierSeed | 337 | 0 / 2 / 0 | 0 | — |
| ×2 | burnSaver guard | 322 | 0 / 2 / 0 | 0 | — |
| ×2 | burnSaver fold | 337 | 0 / 1 / 0 | 0 | — |
| ×2 | burnSaver damage | 376 | 0 / 2 / 0 | 0 | — |
| ×2 | putBack off | 258 | 0 / 0 / 2 | −5.551 | — |
| ×2 | bandHired winner | 352 | 0 / 2 / 0 | 0 | — |
| ×2 | bandHired none | 350 | 0 / 2 / 0 | 0 | — |
| ×4 | retypeExhaustive 10 000 | 497 | 0 / 2 / 0 | 0 | — |
| ×4 | EXHAUSTIVE 50 000 | 463 | 0 / 2 / 0 | 0 | — |
| ×4 | tierSeed | 431 | 0 / 2 / 0 | 0 | — |
| ×4 | burnSaver guard | 402 | 0 / 2 / 0 | 0 | — |
| ×4 | burnSaver fold | 424 | 0 / 1 / 0 | 0 | — |
| ×4 | burnSaver damage | 466 | 0 / 2 / 0 | 0 | — |
| ×4 | putBack off | 346 | 0 / 0 / 2 | −5.551 | — |
| ×4 | bandHired winner | 439 | 0 / 2 / 0 | 0 | — |
| ×4 | bandHired none | 428 | 0 / 2 / 0 | 0 | — |
| ×8 | retypeExhaustive 10 000 | 595 | 0 / 2 / 0 | 0 | — |
| ×8 | EXHAUSTIVE 50 000 | 597 | 0 / 2 / 0 | 0 | — |
| ×8 | tierSeed | 591 | 0 / 2 / 0 | 0 | — |
| ×8 | burnSaver guard | 660 | 0 / 2 / 0 | 0 | — |
| ×8 | burnSaver fold | 621 | 0 / 1 / 0 | 0 | — |
| ×8 | burnSaver damage | 589 | 0 / 2 / 0 | 0 | — |
| ×8 | putBack off | 504 | 0 / 0 / 2 | −5.551 | — |
| ×8 | bandHired winner | 588 | 0 / 2 / 0 | 0 | — |
| ×8 | bandHired none | 663 | 0 / 2 / 0 | 0 | — |
