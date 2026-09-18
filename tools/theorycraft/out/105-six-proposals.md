> **Engine: S-87** (`b080223`, *every hired stack under the troops, on every shape the plan offers*). The prerequisite is met, so the six proposals below are measured on the marches the player is actually offered. The first run of this file was made on the S-77 engine, which sheltered only the *unlimited* hired types and let a capped stack stand on top as the enemy’s first kill; those figures are superseded by these. **Nothing here is a hardcoded expectation of a run** — every table is computed from the plan the engine returns — so the file re-runs unchanged whenever the engine moves again. **Which engine a run was made on is readable off the run itself**: the last table of §P6 counts the stops that field a hired stack the troops do not stand over, and it is nought everywhere here.

Horizon 4 (`CAMPAIGN.marches`): the benchmark's ten scenarios (`tests/engine/plan-scenarios.ts`, its own labels and its own order), plus HIS BAR, plus 104's reconstruction of it, plus his live camp — 13 in all, every plan run once with `withFrontier` and read six ways. Plan run times: HIS BAR — live profile, Aydae marching, thre… 885 ms · LIVE profile as experiment 102 builds it (Ay… 738 ms · first-run army, Bear V ×1 (20 000 leadership) 9 ms · first-run army, Bear V ×2 (20 000 leadership) 14 ms · first-run army, Bear V ×3 (20 000 leadership) 10 ms · first-run army, Bear V ×10 (20 000 leadership) 19 ms · first-run army, Epic Monster Hunter VI ×83 (… 32 ms · the 4 000-leadership case of 2026-09-15 (Tot… 476 ms · 2026-09-17 export, its setup (7 000 leadersh… 1154 ms · 2026-09-17 export, 12 000 leadership 829 ms · live account of 2026-09-18 (one hired type, … 31 ms · live account, evening (hunters 83, legionari… 486 ms · live camp of 2026-09-18 (arbalesters 485 · l… 252 ms.

## P1 · the troops-only tail on the repeated stops

S-81 gave the `all-in` a troops-only Elite march for every march the horizon still had room for once its hired stock was spent. P1 is the same offer to every **repeated** stop whose stock the horizon outruns (`marches < CAMPAIGN.marches`). The tail is the Elite sizer over every troop type with no mercenaries — the engine's own `sizer([], 'elite')` — priced by `recoveryCosts(...).retrain`, which is exactly what `toMarch` writes for a march with no hired stack in it.

The tail march, per scenario:

| scenario | tail march | damage | silver | queue |
|---|---|---|---|---|
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | ARC1 1,158 · SP1 918 · RD1 470 · ARC2 639 · SP2 508 · RD2 260 · RD3 146 | 1,083,079 | 1,942,700 | 5d 9h |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | SW1 1,199 · ARC1 762 · SP1 761 · RD1 380 · ARC2 421 · SP2 420 · RD2 209 · RD3 117 | 1,041,189 | 1,837,900 | 4d 8h |
| first-run army, Bear V ×1 (20 000 leadership) | SW1 3,048 · ARC1 3,042 · SP1 3,036 · RD1 1,515 · ARC2 1,680 · SP2 1,677 · RD2 837 · ARC3 939 · SP3 938 · RD3 468 | 4,610,642 | 8,131,400 | 26d 6h |
| first-run army, Bear V ×2 (20 000 leadership) | SW1 3,048 · ARC1 3,042 · SP1 3,036 · RD1 1,515 · ARC2 1,680 · SP2 1,677 · RD2 837 · ARC3 939 · SP3 938 · RD3 468 | 4,610,642 | 8,131,400 | 26d 6h |
| first-run army, Bear V ×3 (20 000 leadership) | SW1 3,048 · ARC1 3,042 · SP1 3,036 · RD1 1,515 · ARC2 1,680 · SP2 1,677 · RD2 837 · ARC3 939 · SP3 938 · RD3 468 | 4,610,642 | 8,131,400 | 26d 6h |
| first-run army, Bear V ×10 (20 000 leadership) | SW1 3,048 · ARC1 3,042 · SP1 3,036 · RD1 1,515 · ARC2 1,680 · SP2 1,677 · RD2 837 · ARC3 939 · SP3 938 · RD3 468 | 4,610,642 | 8,131,400 | 26d 6h |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | SW1 3,048 · ARC1 3,042 · SP1 3,036 · RD1 1,515 · ARC2 1,680 · SP2 1,677 · RD2 837 · ARC3 939 · SP3 938 · RD3 468 | 4,610,642 | 8,131,400 | 26d 6h |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | SW1 564 · ARC1 752 · SP1 562 · RD1 375 · ARC2 416 · SP2 310 · RD2 207 · RD3 116 | 690,263 | 1,520,800 | 3d 23h |
| 2026-09-17 export, its setup (7 000 leadership) | ARC1 1,569 · SP1 1,272 · RD1 696 · ARC2 866 · SP2 703 · RD2 384 · RD3 215 | 1,435,533 | 2,739,400 | 7d 16h |
| 2026-09-17 export, 12 000 leadership | ARC1 2,687 · SP1 2,179 · RD1 1,193 · ARC2 1,485 · SP2 1,205 · RD2 659 · RD3 370 | 2,464,809 | 4,697,600 | 13d 4h |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | ARC1 4,653 · SP1 3,690 · RD1 1,892 · ARC2 2,570 · SP2 2,041 · RD2 1,045 · RD3 586 | 4,351,353 | 7,809,000 | 21d 18h |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | ARC1 2,560 · SP1 2,030 · RD1 1,040 · ARC2 1,414 · SP2 1,122 · RD2 575 · RD3 322 | 2,392,603 | 4,294,800 | 11d 23h |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | ARC1 1,158 · SP1 918 · RD1 470 · ARC2 639 · SP2 508 · RD2 260 · RD3 146 | 1,083,079 | 1,942,700 | 5d 9h |

**3 stops on 3 of the 13 scenarios** play fewer marches than the horizon and would take a tail. Every other stop already fills it, so P1 does nothing to them.

| scenario | stop | marches | + tail | campaign damage → | silver → | queue → | burn | a silver → | a hired → |
|---|---|---|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership) | sweet-spot | 1 | 3 | 4,722,842 → **18,554,768** (+292.87 %) | 8,131,400 → 32,525,600 (+300.00 %) | 26d 6h → 105d 1h | 1 (unchanged) | 0.581 → 0.570 | 4,722,842 → 18,554,768 |
| first-run army, Bear V ×2 (20 000 leadership) | sweet-spot | 2 | 2 | 9,557,884 → **18,779,168** (+96.48 %) | 16,262,800 → 32,525,600 (+100.00 %) | 52d 12h → 105d 1h | 2 (unchanged) | 0.588 → 0.577 | 4,778,942 → 9,389,584 |
| first-run army, Bear V ×3 (20 000 leadership) | sweet-spot | 3 | 1 | 14,168,526 → **18,779,168** (+32.54 %) | 24,394,200 → 32,525,600 (+33.33 %) | 78d 19h → 105d 1h | 3 (unchanged) | 0.581 → 0.577 | 4,722,842 → 6,259,723 |

The tail buys damage with troops alone, so it **raises damage a hired unit** (the hired burn does not move) and **lowers damage a silver** a little (troops without mercenaries are the less efficient march on these armies). Both of those are campaign ratios; neither is read by any stop rule, which is the next table.

#### Does the tail move the bar — its order, its knee, its band?
Three questions, three measurements. **Order**: the bar is sorted on `repeat.mercLost` and the tail adds marches without touching the repeated march, so no burn moves. **Knee**: the sweet spot is the chord rule over the burn ladder, read on `repeat.damage` against `repeat.mercLost` — the chord is recomputed below over the tailed ladder, and beside it the same chord read on **campaign** damage, which is the one reading the tail could move. **Band**: `inBand` reads the **campaign** ratio `damagePerSilver` against the plan's own, so tailing every candidate can change which rows the band keeps — that is recomputed too.

| scenario | knee today (burn) | knee over the tailed ladder | knee if read on campaign damage | band rows | band rows once every candidate is tailed | rows that change side |
|---|---|---|---|---|---|---|
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | 8 | 8 (same) | 8 | 16 | 16 | 0 |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | 14 | 14 (same) | 14 | 14 | 14 | 0 |
| first-run army, Bear V ×1 (20 000 leadership) | 1 | 1 (same) | — | 2 | 2 | 0 |
| first-run army, Bear V ×2 (20 000 leadership) | 1 | 1 (same) | — | 3 | 3 | 0 |
| first-run army, Bear V ×3 (20 000 leadership) | 1 | 1 (same) | — | 2 | 2 | 0 |
| first-run army, Bear V ×10 (20 000 leadership) | 1 | 1 (same) | — | 3 | 3 | 0 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 6 | 6 (same) | 6 | 14 | 14 | 0 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 4 | 4 (same) | — | 13 | 13 | 0 |
| 2026-09-17 export, its setup (7 000 leadership) | 11 | 11 (same) | 11 | 29 | 29 | 0 |
| 2026-09-17 export, 12 000 leadership | 17 | 17 (same) | 17 | 31 | 31 | 0 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 6 | 6 (same) | 5 — **differs** | 16 | 16 | 0 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 13 | 13 (same) | 13 | 24 | 24 | 0 |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | 7 | 7 (same) | — | 19 | 19 | 0 |

The knee cannot move under P1 and the table says so on every scenario: the chord is drawn on `repeat.damage` against `repeat.mercLost`, and a tail adds marches after the repeated one. The third column is the alternative the owner would be choosing if he also asked for the knee to be read on the campaign — a different proposal, measured here so it is not confused with this one.

## P2 · the plan priced under Revive

The plan always prices troops **retrained** (`toMarch` calls `retrainOne` for every troop rung and `reviveOne` for every hired stack, whatever `request.recovery.plan.mode` says); the recap follows the Battle card's mode, which is `setup.recoveryPlan.mode` through `recoverySettings` in `src/state/derive.ts`. Under revive the Temple brings back nine units in ten for gold and the tenth is recruited again, so a march costs `chunks(n)` of the training silver and `chunks(n)` of the training queue instead of `n` of each.

**Which of the twelve are on revive today: none.** Every scenario carries `plan.mode = retrain` — the owner's own profile default (`src/state/defaults.ts`), the export's setup and the TotalStack capture all. So the "over the benchmark" column below is what revive *would* read, not what any of these accounts reads.

| scenario | recovery mode on the request | temple | training discount | training speed |
|---|---|---|---|---|
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | retrain | 0 | none | none |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | retrain | 0 | none | none |
| first-run army, Bear V ×1 (20 000 leadership) | retrain | 0 | none | none |
| first-run army, Bear V ×2 (20 000 leadership) | retrain | 0 | none | none |
| first-run army, Bear V ×3 (20 000 leadership) | retrain | 0 | none | none |
| first-run army, Bear V ×10 (20 000 leadership) | retrain | 0 | none | none |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | retrain | 0 | none | none |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | retrain | 0 | none | none |
| 2026-09-17 export, its setup (7 000 leadership) | retrain | 0 | none | none |
| 2026-09-17 export, 12 000 leadership | retrain | 0 | none | none |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | retrain | 0 | none | none |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | retrain | 0 | none | none |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | retrain | 0 | none | none |

#### The re-pricing, checked against the payload first
Every figure below is `recoveryCosts` on the stacks `marchResult` builds. Under **retrain** that has to reproduce the plan's own `silver` and `seconds` exactly, or the revive column is measuring something else. (`gold` is the one figure it will not reproduce: `summarise` writes `marches × repeat.gold` and leaves the finale's gold out of the campaign total, so the check reports it separately rather than calling it a fault.)

| scenario | stops checked | worst Δ repeat silver | worst Δ repeat seconds | worst Δ campaign silver | worst Δ campaign seconds | worst Δ campaign gold |
|---|---|---|---|---|---|---|
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | 4 | 0 | 0 | 0 | 0 | 672 |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | 4 | 0 | 0 | 0 | 0 | 496 |
| first-run army, Bear V ×1 (20 000 leadership) | 1 | 0 | 0 | 0 | 0 | 0 |
| first-run army, Bear V ×2 (20 000 leadership) | 1 | 0 | 0 | 0 | 0 | 0 |
| first-run army, Bear V ×3 (20 000 leadership) | 2 | 0 | 0 | 0 | 0 | 0 |
| first-run army, Bear V ×10 (20 000 leadership) | 2 | 0 | 0 | 0 | 0 | 800 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 3 | 0 | 0 | 0 | 0 | 464 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 3 | 0 | 0 | 0 | 0 | 304 |
| 2026-09-17 export, its setup (7 000 leadership) | 4 | 0 | 0 | 0 | 0 | 968 |
| 2026-09-17 export, 12 000 leadership | 4 | 0 | 0 | 0 | 0 | 1,184 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 4 | 0 | 0 | 0 | 0 | 504 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 5 | 0 | 0 | 0 | 0 | 1,248 |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | 5 | 0 | 0 | 0 | 0 | 536 |

#### Every stop, retrained and revived
The repeated march first (what the stop itself reads), then the campaign. `a silver` is the campaign ratio. **The campaign gold under R is the recomputed retrain gold, not the figure the bar prints**: the payload leaves the finale’s gold out of its total (the omission the table above measures), so on HIS BAR’s sweet-spot this column reads 2,472 where the payload carries 1,800.

| scenario | stop | repeat silver R → V | repeat gold R → V | repeat queue R → V | campaign silver R → V | campaign gold R → V | campaign queue R → V | a silver R → V |
|---|---|---|---|---|---|---|---|---|
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | silver-saver | 1,279,900 → 129,800 | 328 → 12,148 | 3d 12h → 8h 43m | 5,782,400 → 584,500 | 1,656 → 55,020 | 16d 0h → 1d 15h | 1.987 → 19.659 |
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | sweet-spot | 1,942,700 → 195,100 | 600 → 18,504 | 5d 9h → 13h 6m | 7,770,800 → 780,400 | 2,472 → 74,088 | 21d 15h → 2d 4h | 1.944 → 19.356 |
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | steady-max | 1,942,700 → 195,100 | 688 → 18,592 | 5d 9h → 13h 6m | 7,770,800 → 780,400 | 2,736 → 74,352 | 21d 15h → 2d 4h | 1.952 → 19.438 |
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | all-in | 1,942,700 → 195,100 | 720 → 18,624 | 5d 9h → 13h 6m | 7,770,800 → 780,400 | 2,784 → 74,400 | 21d 15h → 2d 4h | 1.985 → 19.768 |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | sweet-spot | 2,203,500 → 221,100 | 1,040 → 18,944 | 8d 4h → 19h 46m | 8,448,400 → 848,600 | 3,616 → 75,224 | 28d 23h → 2d 21h | 1.862 → 18.542 |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | more-mercs | 2,203,500 → 221,100 | 1,120 → 19,024 | 8d 4h → 19h 46m | 8,448,400 → 848,600 | 3,856 → 75,464 | 28d 23h → 2d 21h | 1.934 → 19.255 |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | steady-max | 2,203,500 → 221,100 | 1,208 → 19,112 | 8d 4h → 19h 46m | 8,448,400 → 848,600 | 4,120 → 75,728 | 28d 23h → 2d 21h | 2.133 → 21.239 |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | all-in | 2,694,300 → 271,600 | 1,808 → 19,660 | 13d 7h → 1d 8h | 10,777,200 → 1,086,400 | 6,520 → 77,928 | 53d 4h → 5d 8h | 1.885 → 18.700 |
| first-run army, Bear V ×1 (20 000 leadership) | sweet-spot | 8,131,400 → 814,800 | 0 → 71,984 | 26d 6h → 2d 15h | 8,131,400 → 814,800 | 0 → 71,984 | 26d 6h → 2d 15h | 0.581 → 5.796 |
| first-run army, Bear V ×2 (20 000 leadership) | sweet-spot | 8,131,400 → 814,800 | 160 → 72,144 | 26d 6h → 2d 15h | 16,262,800 → 1,629,600 | 160 → 144,128 | 52d 12h → 5d 6h | 0.588 → 5.865 |
| first-run army, Bear V ×3 (20 000 leadership) | sweet-spot | 8,131,400 → 814,800 | 0 → 71,984 | 26d 6h → 2d 15h | 24,394,200 → 2,444,400 | 0 → 215,952 | 78d 19h → 7d 21h | 0.581 → 5.796 |
| first-run army, Bear V ×3 (20 000 leadership) | all-in | 8,131,400 → 814,800 | 320 → 72,304 | 26d 6h → 2d 15h | 32,525,600 → 3,259,200 | 480 → 288,416 | 105d 1h → 10d 12h | 0.588 → 5.865 |
| first-run army, Bear V ×10 (20 000 leadership) | sweet-spot | 8,131,400 → 814,800 | 800 → 72,784 | 26d 6h → 2d 15h | 32,525,600 → 3,259,200 | 3,200 → 291,136 | 105d 1h → 10d 12h | 0.650 → 6.485 |
| first-run army, Bear V ×10 (20 000 leadership) | all-in | 12,149,900 → 1,216,600 | 1,440 → 63,916 | 84d 8h → 8d 10h | 45,577,400 → 4,564,600 | 4,800 → 263,328 | 291d 0h → 29d 3h | 0.476 → 4.754 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | sweet-spot | 8,131,400 → 814,800 | 432 → 72,416 | 26d 6h → 2d 15h | 32,525,600 → 3,259,200 | 1,760 → 289,696 | 105d 1h → 10d 12h | 0.892 → 8.904 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | steady-max | 8,131,400 → 814,800 | 496 → 72,480 | 26d 6h → 2d 15h | 32,525,600 → 3,259,200 | 1,928 → 289,864 | 105d 1h → 10d 12h | 0.924 → 9.222 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | all-in | 11,434,600 → 1,146,500 | 592 → 72,572 | 61d 14h → 6d 4h | 36,125,500 → 3,621,800 | 2,016 → 284,868 | 147d 19h → 14d 19h | 0.797 → 7.947 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | sweet-spot | 1,520,800 → 154,100 | 296 → 14,676 | 3d 23h → 9h 39m | 6,083,200 → 616,400 | 1,192 → 58,712 | 15d 20h → 1d 14h | 1.347 → 13.293 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | steady-max | 1,520,800 → 154,100 | 296 → 14,676 | 3d 23h → 9h 39m | 6,083,200 → 616,400 | 1,176 → 58,696 | 15d 20h → 1d 14h | 1.370 → 13.516 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | all-in | 1,678,600 → 170,000 | 424 → 14,808 | 5d 13h → 13h 37m | 6,241,000 → 632,300 | 1,352 → 58,876 | 17d 10h → 1d 18h | 1.345 → 13.277 |
| 2026-09-17 export, its setup (7 000 leadership) | sweet-spot | 2,739,400 → 276,300 | 856 → 26,036 | 7d 16h → 18h 42m | 10,957,600 → 1,105,200 | 3,536 → 104,256 | 30d 18h → 3d 2h | 1.977 → 19.601 |
| 2026-09-17 export, its setup (7 000 leadership) | more-mercs | 2,739,400 → 276,300 | 888 → 26,068 | 7d 16h → 18h 42m | 10,957,600 → 1,105,200 | 3,632 → 104,352 | 30d 18h → 3d 2h | 2.020 → 20.027 |
| 2026-09-17 export, its setup (7 000 leadership) | steady-max | 2,739,400 → 276,300 | 976 → 26,156 | 7d 16h → 18h 42m | 10,957,600 → 1,105,200 | 3,896 → 104,616 | 30d 18h → 3d 2h | 2.123 → 21.050 |
| 2026-09-17 export, its setup (7 000 leadership) | all-in | 3,391,000 → 339,400 | 1,960 → 23,464 | 18d 1h → 1d 19h | 14,337,600 → 1,436,100 | 6,656 → 98,700 | 74d 19h → 7d 11h | 1.571 → 15.680 |
| 2026-09-17 export, 12 000 leadership | silver-saver | 3,178,100 → 319,800 | 760 → 30,052 | 8d 20h → 21h 30m | 14,231,900 → 1,430,300 | 3,464 → 134,528 | 39d 18h → 4d 0h | 1.767 → 17.580 |
| 2026-09-17 export, 12 000 leadership | sweet-spot | 4,697,600 → 470,900 | 1,224 → 44,412 | 13d 4h → 1d 7h | 18,790,400 → 1,883,600 | 4,824 → 177,576 | 52d 19h → 5d 7h | 1.715 → 17.112 |
| 2026-09-17 export, 12 000 leadership | steady-max | 5,453,300 → 546,300 | 1,368 → 44,448 | 20d 23h → 2d 2h | 21,057,500 → 2,109,800 | 5,256 → 177,684 | 76d 3h → 7d 15h | 1.544 → 15.413 |
| 2026-09-17 export, 12 000 leadership | all-in | 5,223,000 → 523,400 | 1,960 → 36,648 | 25d 16h → 2d 13h | 22,422,900 → 2,247,600 | 6,656 → 163,940 | 102d 9h → 10d 6h | 1.412 → 14.083 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | silver-saver | 3,497,500 → 351,800 | 280 → 32,644 | 9d 15h → 23h 19m | 18,583,900 → 1,866,700 | 1,344 → 168,920 | 54d 17h → 5d 12h | 1.005 → 10.008 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | sweet-spot | 7,773,100 → 779,300 | 432 → 72,384 | 21d 9h → 2d 3h | 30,607,200 → 3,067,800 | 1,760 → 285,080 | 84d 6h → 8d 11h | 0.970 → 9.674 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | steady-max | 7,773,100 → 779,300 | 496 → 72,448 | 21d 9h → 2d 3h | 30,270,800 → 3,035,600 | 1,928 → 282,120 | 83d 8h → 8d 9h | 0.998 → 9.954 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | all-in | 7,773,100 → 779,300 | 592 → 72,544 | 21d 9h → 2d 3h | 31,092,400 → 3,117,200 | 2,016 → 289,824 | 85d 15h → 8d 14h | 1.004 → 10.015 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | silver-saver | 2,974,200 → 299,100 | 648 → 28,132 | 8d 5h → 19h 55m | 13,217,400 → 1,329,100 | 3,192 → 125,228 | 36d 15h → 3d 16h | 1.678 → 16.687 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | sweet-spot | 4,270,000 → 428,700 | 904 → 40,364 | 11d 19h → 1d 4h | 17,104,800 → 1,717,900 | 3,960 → 161,924 | 47d 8h → 4d 18h | 1.658 → 16.513 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | more-mercs | 4,294,800 → 431,800 | 1,120 → 40,704 | 11d 23h → 1d 5h | 17,179,200 → 1,727,200 | 4,584 → 162,920 | 47d 20h → 4d 20h | 1.704 → 16.944 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | steady-max | 4,294,800 → 431,800 | 1,184 → 40,768 | 11d 23h → 1d 5h | 17,179,200 → 1,727,200 | 4,776 → 163,112 | 47d 20h → 4d 20h | 1.753 → 17.431 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | all-in | 4,294,800 → 431,800 | 1,384 → 40,968 | 11d 23h → 1d 5h | 17,179,200 → 1,727,200 | 5,176 → 163,512 | 47d 20h → 4d 20h | 1.695 → 16.855 |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | silver-saver | 2,119,800 → 213,200 | 1,480 → 19,376 | 7d 13h → 18h 19m | 8,302,100 → 834,700 | 4,976 → 76,568 | 28d 3h → 2d 20h | 1.152 → 11.461 |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | sweet-spot | 2,707,500 → 271,000 | 1,872 → 19,780 | 13d 10h → 1d 8h | 10,065,200 → 1,008,100 | 6,152 → 77,780 | 45d 16h → 4d 13h | 1.141 → 11.397 |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | more-mercs | 2,707,500 → 271,000 | 1,944 → 19,852 | 13d 10h → 1d 8h | 10,065,200 → 1,008,100 | 6,368 → 77,996 | 45d 16h → 4d 13h | 1.181 → 11.791 |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | steady-max | 2,707,500 → 271,000 | 2,088 → 19,996 | 13d 10h → 1d 8h | 10,065,200 → 1,008,100 | 6,800 → 78,428 | 45d 16h → 4d 13h | 1.260 → 12.579 |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | all-in | 2,707,500 → 271,000 | 2,896 → 20,804 | 13d 10h → 1d 8h | 10,259,100 → 1,031,800 | 15,352 → 80,828 | 54d 0h → 5d 10h | 1.224 → 12.173 |

#### Would the *search* answer differently on revive prices?
Two ways to ask. **First**, hand `planCampaign` a request whose recovery settings say revive and see whether the bar moves — the engine accepts the request, but `toMarch` never reads `plan.mode`, so this measures whether that is really so rather than taking the code's word for it.

| scenario | stops on retrain | stops on revive | identical marches? | Δ repeat damage | plan ms |
|---|---|---|---|---|---|
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | silver-saver · sweet-spot · steady-max · all-in | silver-saver · sweet-spot · steady-max · all-in | **yes — identical** | 0 | 724 |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | sweet-spot · more-mercs · steady-max · all-in | sweet-spot · more-mercs · steady-max · all-in | **yes — identical** | 0 | 712 |
| first-run army, Bear V ×1 (20 000 leadership) | sweet-spot | sweet-spot | **yes — identical** | 0 | 8 |
| first-run army, Bear V ×2 (20 000 leadership) | sweet-spot | sweet-spot | **yes — identical** | 0 | 12 |
| first-run army, Bear V ×3 (20 000 leadership) | sweet-spot · all-in | sweet-spot · all-in | **yes — identical** | 0 | 11 |
| first-run army, Bear V ×10 (20 000 leadership) | sweet-spot · all-in | sweet-spot · all-in | **yes — identical** | 0 | 20 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | sweet-spot · steady-max · all-in | sweet-spot · steady-max · all-in | **yes — identical** | 0 | 30 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | sweet-spot · steady-max · all-in | sweet-spot · steady-max · all-in | **yes — identical** | 0 | 450 |
| 2026-09-17 export, its setup (7 000 leadership) | sweet-spot · more-mercs · steady-max · all-in | sweet-spot · more-mercs · steady-max · all-in | **yes — identical** | 0 | 1183 |
| 2026-09-17 export, 12 000 leadership | silver-saver · sweet-spot · steady-max · all-in | silver-saver · sweet-spot · steady-max · all-in | **yes — identical** | 0 | 853 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | silver-saver · sweet-spot · steady-max · all-in | silver-saver · sweet-spot · steady-max · all-in | **yes — identical** | 0 | 37 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | silver-saver · sweet-spot · more-mercs · steady-max · all-in | silver-saver · sweet-spot · more-mercs · steady-max · all-in | **yes — identical** | 0 | 528 |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | silver-saver · sweet-spot · more-mercs · steady-max · all-in | silver-saver · sweet-spot · more-mercs · steady-max · all-in | **yes — identical** | 0 | 243 |

**So the engine does not accept revive pricing** — it accepts the request and ignores the mode. The second way is therefore the one that answers the question: re-price the band and re-pick by the band's own rules. The picker below is `planCampaign`'s own rules restated (burn ladder → rungs nothing beats on both repeat ratios → the chord over the whole ladder → `middleOfRange` → the steady max → the silver saver over the whole band → "more mercs" in the middle of the gap). It **cannot** re-run the put-back pass (which would have to re-size through the sizer against the new rates) nor rebuild the `all-in` (built march by march outside the frontier), so it is checked against the engine on the retrain prices first and every disagreement is named.

| scenario | engine stops (put-back / all-in in brackets) | the picker on the retrain band | agrees? |
|---|---|---|---|
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | silver-saver · sweet-spot · steady-max · all-in [all-in] | silver-saver · sweet-spot · steady-max | yes, on all 3 comparable stops |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | sweet-spot [put-back] · more-mercs [put-back] · steady-max [put-back] · all-in [all-in] | silver-saver · sweet-spot · more-mercs · steady-max | n/a — every stop is a put-back or the all-in |
| first-run army, Bear V ×1 (20 000 leadership) | sweet-spot | sweet-spot | yes, on all 1 comparable stop |
| first-run army, Bear V ×2 (20 000 leadership) | sweet-spot | sweet-spot | yes, on all 1 comparable stop |
| first-run army, Bear V ×3 (20 000 leadership) | sweet-spot · all-in [all-in] | sweet-spot | yes, on all 1 comparable stop |
| first-run army, Bear V ×10 (20 000 leadership) | sweet-spot · all-in [all-in] | sweet-spot | yes, on all 1 comparable stop |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | sweet-spot · steady-max · all-in [put-back] [all-in] | sweet-spot · steady-max | yes, on all 2 comparable stops |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | sweet-spot · steady-max · all-in [put-back] [all-in] | sweet-spot · steady-max | yes, on all 2 comparable stops |
| 2026-09-17 export, its setup (7 000 leadership) | sweet-spot · more-mercs · steady-max · all-in [all-in] | sweet-spot · more-mercs · steady-max | yes, on all 3 comparable stops |
| 2026-09-17 export, 12 000 leadership | silver-saver · sweet-spot · steady-max · all-in [all-in] | silver-saver · sweet-spot · steady-max | yes, on all 3 comparable stops |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | silver-saver · sweet-spot · steady-max · all-in [all-in] | silver-saver · sweet-spot · steady-max | yes, on all 3 comparable stops |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | silver-saver · sweet-spot · more-mercs · steady-max · all-in [all-in] | silver-saver · sweet-spot · more-mercs · steady-max | yes, on all 4 comparable stops |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | silver-saver [put-back] · sweet-spot [put-back] · more-mercs [put-back] · steady-max [put-back] · all-in [put-back] [all-in] | silver-saver · sweet-spot · more-mercs · steady-max | n/a — every stop is a put-back or the all-in |

The bar the same rules pick once the band is priced under **revive**:

| scenario | stops on retrain prices | stops on revive prices | same marches? | sweet spot burn R → V | thriftiest silver R → V |
|---|---|---|---|---|---|
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | silver-saver (7) · sweet-spot (8) · steady-max (10) | silver-saver (7) · sweet-spot (8) · steady-max (10) | **yes** | 8 → 8 | 1,279,900 → 129,800 |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | silver-saver (12) · sweet-spot (14) · more-mercs (16) · steady-max (19) | silver-saver (12) · sweet-spot (14) · more-mercs (16) · steady-max (19) | **yes** | 14 → 14 | 1,735,500 → 173,600 |
| first-run army, Bear V ×1 (20 000 leadership) | sweet-spot (1) | sweet-spot (1) | **yes** | 1 → 1 | 8,131,400 → 814,800 |
| first-run army, Bear V ×2 (20 000 leadership) | sweet-spot (1) | sweet-spot (1) | **yes** | 1 → 1 | 8,131,400 → 814,800 |
| first-run army, Bear V ×3 (20 000 leadership) | sweet-spot (1) | sweet-spot (1) | **yes** | 1 → 1 | 8,131,400 → 814,800 |
| first-run army, Bear V ×10 (20 000 leadership) | sweet-spot (1) | sweet-spot (1) | **yes** | 1 → 1 | 8,131,400 → 814,800 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | sweet-spot (6) · steady-max (7) | sweet-spot (6) · steady-max (7) | **yes** | 6 → 6 | 8,131,400 → 814,800 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | sweet-spot (4) · steady-max (5) | sweet-spot (4) · steady-max (5) | **yes** | 4 → 4 | 1,520,800 → 154,100 |
| 2026-09-17 export, its setup (7 000 leadership) | sweet-spot (11) · more-mercs (12) · steady-max (13) | sweet-spot (11) · more-mercs (12) · steady-max (13) | **yes** | 11 → 11 | 2,739,400 → 276,300 |
| 2026-09-17 export, 12 000 leadership | silver-saver (11) · sweet-spot (17) · steady-max (19) | silver-saver (11) · sweet-spot (17) · steady-max (19) | **yes** | 17 → 17 | 3,178,100 → 319,800 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | silver-saver (4) · sweet-spot (6) · steady-max (7) | silver-saver (5) · sweet-spot (6) · steady-max (7) | **no** | 6 → 6 | 3,497,500 → 441,500 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | silver-saver (10) · sweet-spot (13) · more-mercs (16) · steady-max (17) | silver-saver (10) · sweet-spot (13) · more-mercs (16) · steady-max (17) | **yes** | 13 → 13 | 2,974,200 → 299,100 |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | silver-saver (6) · sweet-spot (7) · more-mercs (8) · steady-max (10) | silver-saver (6) · sweet-spot (7) · more-mercs (8) · steady-max (10) | **yes** | 7 → 7 | 2,013,400 → 202,200 |

## P3 · the thrift end of the band

After S-80 the stops of a bar largely share one troop march and differ only by their mercenaries, so silver and time read nearly the same all the way along it — the first table checks that premise scenario by scenario rather than assuming it, since a put-back re-sizes the troop side of the stop it improves. Then: how much cheaper is the **cheapest troop march the band holds** than the one most stops share, and what would a silver-saver exception offer if its rule were relaxed. Three rules, all over the band, all left of the sweet spot in burn and silver:
- **today** — `leastSilver` in `src/engine/plan.ts`: cheaper than the sweet spot, **at least as efficient a silver**, and beaten on neither ratio by another such march;
- **relaxed** — the same without the efficiency floor: cheaper than the sweet spot and beaten on neither ratio;
- **marginal** — P5's fixed rule restricted to the marches cheaper than the sweet spot.

| scenario | troop marches over the stops | the one most stops share (silver a march) | cheapest troop march in the band (silver a march) | cheaper by | that march |
|---|---|---|---|---|---|
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | 2 over 4 stops | 1,942,700 (3 of 4: sweet-spot, steady-max, all-in) | 1,279,900 | +34.12 % | SP1 640 · RD2 179 · SP2 342 · RD1 310 · ARC1 744 · RD3 93 · ARC2 397 |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | 2 over 4 stops | 2,203,500 (3 of 4: sweet-spot, more-mercs, steady-max) | 1,702,900 | +22.72 % | RD2 622 · ARC2 1,221 · RD3 336 |
| first-run army, Bear V ×1 (20 000 leadership) | 1 over 1 stops — **one march** | 8,131,400 (1 of 1: sweet-spot) | 1,233,500 | +84.83 % | SP2 350 · RD2 172 · ARC1 607 · SP3 186 · RD1 291 · RD3 89 · ARC3 175 · ARC2 305 |
| first-run army, Bear V ×2 (20 000 leadership) | 1 over 1 stops — **one march** | 8,131,400 (1 of 1: sweet-spot) | 1,233,500 | +84.83 % | SP2 350 · RD2 172 · ARC1 607 · SP3 186 · RD1 291 · RD3 89 · ARC3 175 · ARC2 305 |
| first-run army, Bear V ×3 (20 000 leadership) | 1 over 2 stops — **one march** | 8,131,400 (2 of 2: sweet-spot, all-in) | 1,233,500 | +84.83 % | SP2 350 · RD2 172 · ARC1 607 · SP3 186 · RD1 291 · RD3 89 · ARC3 175 · ARC2 305 |
| first-run army, Bear V ×10 (20 000 leadership) | 2 over 2 stops | 8,131,400 (1 of 2: sweet-spot) | 4,936,800 | +39.29 % | SP2 1,403 · RD2 688 · SP3 759 · ARC1 2,381 · RD1 1,167 · ARC3 715 · RD3 350 · ARC2 1,222 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 2 over 3 stops | 8,131,400 (2 of 3: sweet-spot, steady-max) | 4,441,100 | +45.38 % | SP2 1,263 · RD2 619 · SP3 682 · ARC1 2,142 · RD1 1,050 · ARC3 643 · RD3 315 · ARC2 1,099 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 2 over 3 stops | 1,520,800 (2 of 3: sweet-spot, steady-max) | 766,600 | +49.59 % | SW1 304 · SP1 298 · SP2 162 · RD2 106 · ARC1 375 · RD3 57 · ARC2 201 · RD1 177 |
| 2026-09-17 export, its setup (7 000 leadership) | 2 over 4 stops | 2,739,400 (3 of 4: sweet-spot, more-mercs, steady-max) | 1,947,000 | +28.93 % | SP1 956 · SP2 521 · RD2 280 · RD1 494 · ARC1 1,087 · RD3 148 · ARC2 580 |
| 2026-09-17 export, 12 000 leadership | 4 over 4 stops | 3,178,100 (1 of 4: silver-saver) | 3,178,100 | +0.00 % | SP1 1,560 · SP2 850 · RD2 457 · RD1 806 · ARC1 1,774 · RD3 242 · ARC2 947 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 2 over 4 stops | 7,773,100 (3 of 4: sweet-spot, steady-max, all-in) | 3,497,500 | +55.01 % | SP1 1,749 · RD2 489 · RD1 863 · SP2 916 · ARC1 2,033 · RD3 254 · ARC2 1,085 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 3 over 5 stops | 4,294,800 (3 of 5: more-mercs, steady-max, all-in) | 2,974,200 | +30.75 % | SP1 1,487 · RD2 416 · SP2 795 · RD1 720 · ARC1 1,729 · RD3 216 · ARC2 923 |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | 2 over 5 stops | 2,707,500 (4 of 5: sweet-spot, more-mercs, steady-max, all-in) | 1,610,400 | +40.52 % | RD2 909 · RD3 501 |

What each rule would offer, against the sweet spot on the same bar:

| scenario | rule | offered? | already on the bar? | repeat silver | repeat damage | burn | campaign a silver | campaign a hired | Δ damage vs sweet | Δ silver vs sweet | Δ hired vs sweet | what the player sees |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | today (leastSilver) | yes | silver-saver | 1,279,900 | 2,587,655 | 7 | 1.987 | 370,677 | -23.93 % | -25.59 % | -8.82 % | SP1 640 · RD2 179 · SP2 342 · RD1 310 · ARC1 744 · RD3 93 · ARC2 397 · ABT6 15 · CHR6 4 · EMH6 14 · LGN6 12 |
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | relaxed (both ratios only) | yes | silver-saver | 1,279,900 | 2,587,655 | 7 | 1.987 | 370,677 | -23.93 % | -25.59 % | -8.82 % | SP1 640 · RD2 179 · SP2 342 · RD1 310 · ARC1 744 · RD3 93 · ARC2 397 · ABT6 15 · CHR6 4 · EMH6 14 · LGN6 12 |
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | marginal (P5, fixed) | no | — | — | — | — | — | — | — | — | — | — |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | today (leastSilver) | no | — | — | — | — | — | — | — | — | — | — |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | relaxed (both ratios only) | yes | no — a new row | 1,735,500 | 2,643,431 | 12 | 1.596 | 261,408 | -28.56 % | -16.62 % | -12.24 % | ARC2 1,959 · RD3 540 · ABT6 23 · CHR6 8 · EMH6 69 · LGN6 10 |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | marginal (P5, fixed) | no | — | — | — | — | — | — | — | — | — | — |
| first-run army, Bear V ×1 (20 000 leadership) | today (leastSilver) | no | — | — | — | — | — | — | — | — | — | — |
| first-run army, Bear V ×1 (20 000 leadership) | relaxed (both ratios only) | no | — | — | — | — | — | — | — | — | — | — |
| first-run army, Bear V ×1 (20 000 leadership) | marginal (P5, fixed) | no | — | — | — | — | — | — | — | — | — | — |
| first-run army, Bear V ×2 (20 000 leadership) | today (leastSilver) | no | — | — | — | — | — | — | — | — | — | — |
| first-run army, Bear V ×2 (20 000 leadership) | relaxed (both ratios only) | no | — | — | — | — | — | — | — | — | — | — |
| first-run army, Bear V ×2 (20 000 leadership) | marginal (P5, fixed) | no | — | — | — | — | — | — | — | — | — | — |
| first-run army, Bear V ×3 (20 000 leadership) | today (leastSilver) | no | — | — | — | — | — | — | — | — | — | — |
| first-run army, Bear V ×3 (20 000 leadership) | relaxed (both ratios only) | no | — | — | — | — | — | — | — | — | — | — |
| first-run army, Bear V ×3 (20 000 leadership) | marginal (P5, fixed) | no | — | — | — | — | — | — | — | — | — | — |
| first-run army, Bear V ×10 (20 000 leadership) | today (leastSilver) | no | — | — | — | — | — | — | — | — | — | — |
| first-run army, Bear V ×10 (20 000 leadership) | relaxed (both ratios only) | no | — | — | — | — | — | — | — | — | — | — |
| first-run army, Bear V ×10 (20 000 leadership) | marginal (P5, fixed) | no | — | — | — | — | — | — | — | — | — | — |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | today (leastSilver) | no | — | — | — | — | — | — | — | — | — | — |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | relaxed (both ratios only) | yes | no — a new row | 8,131,400 | 6,337,766 | 4 | 0.821 | 1,334,479 | -8.03 % | +0.00 % | -20.00 % | SW1 3,048 · ARC1 3,042 · SP1 3,036 · RD1 1,515 · ARC2 1,680 · SP2 1,677 · RD2 837 · ARC3 939 · SP3 938 · RD3 468 · EMH6 40 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | marginal (P5, fixed) | no | — | — | — | — | — | — | — | — | — | — |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | today (leastSilver) | no | — | — | — | — | — | — | — | — | — | — |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | relaxed (both ratios only) | no | — | — | — | — | — | — | — | — | — | — |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | marginal (P5, fixed) | no | — | — | — | — | — | — | — | — | — | — |
| 2026-09-17 export, its setup (7 000 leadership) | today (leastSilver) | no | — | — | — | — | — | — | — | — | — | — |
| 2026-09-17 export, its setup (7 000 leadership) | relaxed (both ratios only) | yes | no — a new row | 2,178,700 | 4,177,683 | 7 | 1.854 | 394,428 | -16.24 % | -10.70 % | -2.13 % | SP1 1,069 · SP2 583 · RD2 313 · RD1 553 · ARC1 1,216 · RD3 166 · ARC2 649 · ABT6 20 · CHR6 10 · EMH6 20 · LGN6 20 |
| 2026-09-17 export, its setup (7 000 leadership) | marginal (P5, fixed) | no | — | — | — | — | — | — | — | — | — | — |
| 2026-09-17 export, 12 000 leadership | today (leastSilver) | yes | silver-saver | 3,178,100 | 5,766,016 | 11 | 1.767 | 493,040 | -21.99 % | -24.26 % | -23.88 % | SP1 1,560 · SP2 850 · RD2 457 · RD1 806 · ARC1 1,774 · RD3 242 · ARC2 947 · ABT6 28 · CHR6 16 · EMH6 24 · LGN6 24 |
| 2026-09-17 export, 12 000 leadership | relaxed (both ratios only) | yes | silver-saver | 3,178,100 | 5,766,016 | 11 | 1.767 | 493,040 | -21.99 % | -24.26 % | -23.88 % | SP1 1,560 · SP2 850 · RD2 457 · RD1 806 · ARC1 1,774 · RD3 242 · ARC2 947 · ABT6 28 · CHR6 16 · EMH6 24 · LGN6 24 |
| 2026-09-17 export, 12 000 leadership | marginal (P5, fixed) | yes | no — a new row | 3,703,800 | 6,709,628 | 13 | 1.759 | 505,503 | -13.74 % | -15.87 % | -17.91 % | SP1 1,818 · SP2 991 · RD2 532 · RD1 940 · ARC1 2,067 · RD3 282 · ARC2 1,104 · ABT6 40 · CHR6 16 · EMH6 24 · LGN6 34 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | today (leastSilver) | yes | silver-saver | 3,497,500 | 3,747,516 | 4 | 1.005 | 934,098 | -37.05 % | -39.28 % | -20.00 % | SP1 1,749 · RD2 489 · RD1 863 · SP2 916 · ARC1 2,033 · RD3 254 · ARC2 1,085 · EMH6 39 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | relaxed (both ratios only) | yes | silver-saver | 3,497,500 | 3,747,516 | 4 | 1.005 | 934,098 | -37.05 % | -39.28 % | -20.00 % | SP1 1,749 · RD2 489 · RD1 863 · SP2 916 · ARC1 2,033 · RD3 254 · ARC2 1,085 · EMH6 39 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | marginal (P5, fixed) | yes | no — a new row | 4,484,100 | 4,803,700 | 5 | 1.045 | 1,001,398 | -25.77 % | -31.14 % | -12.00 % | SP1 2,242 · RD2 627 · RD1 1,107 · SP2 1,175 · ARC1 2,606 · RD3 325 · ARC2 1,392 · EMH6 50 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | today (leastSilver) | yes | silver-saver | 2,974,200 | 5,053,087 | 10 | 1.678 | 452,639 | -21.82 % | -22.73 % | -15.52 % | SP1 1,487 · RD2 416 · SP2 795 · RD1 720 · ARC1 1,729 · RD3 216 · ARC2 923 · ABT6 35 · CHR6 8 · EMH6 31 · LGN6 10 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | relaxed (both ratios only) | yes | silver-saver | 2,974,200 | 5,053,087 | 10 | 1.678 | 452,639 | -21.82 % | -22.73 % | -15.52 % | SP1 1,487 · RD2 416 · SP2 795 · RD1 720 · ARC1 1,729 · RD3 216 · ARC2 923 · ABT6 35 · CHR6 8 · EMH6 31 · LGN6 10 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | marginal (P5, fixed) | yes | no — a new row | 3,309,300 | 5,504,703 | 11 | 1.663 | 446,289 | -16.62 % | -16.85 % | -8.62 % | SP1 1,655 · RD2 463 · SP2 885 · RD1 801 · ARC1 1,924 · RD3 240 · ARC2 1,027 · ABT6 29 · CHR6 5 · EMH6 28 · LGN6 31 |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | today (leastSilver) | yes | the silver-saver’s own generated march | 2,013,400 | 2,371,111 | 6 | 1.180 | 376,806 | -18.01 % | -20.69 % | -10.71 % | RD2 1,137 · RD3 626 · ABT6 40 · BER5 10 · LGN6 10 |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | relaxed (both ratios only) | yes | the silver-saver’s own generated march | 2,013,400 | 2,371,111 | 6 | 1.180 | 376,806 | -18.01 % | -20.69 % | -10.71 % | RD2 1,137 · RD3 626 · ABT6 40 · BER5 10 · LGN6 10 |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | marginal (P5, fixed) | yes | the silver-saver’s own generated march | 2,013,400 | 2,371,111 | 6 | 1.180 | 376,806 | -18.01 % | -20.69 % | -10.71 % | RD2 1,137 · RD3 626 · ABT6 40 · BER5 10 · LGN6 10 |

## P4 · the reference table over the band

The `curve` under the bar is bucketed over **every shape `record` sees** — including marches the frontier threw away and the band would refuse. P4 buckets it over `candidates` (the band) instead, so every row of the table is a plan the bar could offer. Nothing else changes: `buckets` is written by `record` and read once at the end to build `CampaignPlan.curve`; no stop rule reads it, which is why the stops below are identical by construction and the measurement is of the table alone. **“Backed by a band plan” counts `inBand` alone** — the band proper is `undominated ∧ inBand`, so a table row whose plan the frontier dominated is counted here and would still not be a row P4 could draw; read it as an upper bound.

| scenario | table rows today | backed by a frontier plan | backed by a band plan | table rows over the band | peak a silver today | peak over the band | bar best a silver | cheapest row today | cheapest over the band |
|---|---|---|---|---|---|---|---|---|---|
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | 11 | 2 | 4 | 3 | 2.759 | 1.987 | 1.987 | 2,140,100 | 5,782,400 |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | 11 | 1 | 4 | 3 | 2.865 | 1.938 | 2.133 | 2,165,500 | 7,044,400 |
| first-run army, Bear V ×1 (20 000 leadership) | 24 | 2 | 20 | 2 | 0.599 | 0.581 | 0.581 | 119,700 | 1,233,500 |
| first-run army, Bear V ×2 (20 000 leadership) | 24 | 2 | 20 | 3 | 0.599 | 0.588 | 0.588 | 239,400 | 2,467,000 |
| first-run army, Bear V ×3 (20 000 leadership) | 24 | 2 | 20 | 2 | 0.599 | 0.581 | 0.588 | 359,100 | 3,700,500 |
| first-run army, Bear V ×10 (20 000 leadership) | 10 | 3 | 6 | 2 | 0.650 | 0.650 | 0.650 | 9,212,900 | 22,941,800 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 10 | 1 | 7 | 3 | 1.024 | 0.924 | 0.924 | 9,128,900 | 21,797,900 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 10 | 2 | 8 | 3 | 1.766 | 1.478 | 1.370 | 1,768,600 | 4,407,700 |
| 2026-09-17 export, its setup (7 000 leadership) | 10 | 3 | 4 | 2 | 2.897 | 2.123 | 2.123 | 3,734,800 | 9,089,700 |
| 2026-09-17 export, 12 000 leadership | 10 | 4 | 5 | 3 | 2.375 | 1.759 | 1.767 | 5,319,200 | 15,809,000 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 10 | 3 | 7 | 4 | 1.227 | 1.052 | 1.005 | 7,641,700 | 18,853,000 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 11 | 2 | 5 | 3 | 2.283 | 1.753 | 1.753 | 4,483,800 | 13,217,400 |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | 10 | 1 | 0 | 3 | 2.861 | 1.385 | 1.260 | 2,597,900 | 7,380,500 |

The band table itself, on HIS BAR, beside the table he is reading today:

| # | today: silver | damage | a silver | over the band: silver | damage | a silver | is it a stop? |
|---|---|---|---|---|---|---|---|
| 1 | 2,140,100 | 4,390,684 | 2.052 | 5,782,400 | 11,490,973 | 1.987 | silver-saver |
| 2 | 2,526,500 | 6,600,967 | 2.613 | 7,545,200 | 14,279,359 | 1.893 | no |
| 3 | 3,055,700 | 8,148,397 | 2.667 | 7,770,800 | 15,169,558 | 1.952 | steady-max |
| 4 | 3,551,300 | 9,799,426 | 2.759 | — | — | — | — |
| 5 | 4,256,900 | 11,146,108 | 2.618 | — | — | — | — |
| 6 | 5,273,300 | 11,617,717 | 2.203 | — | — | — | — |
| 7 | 6,423,500 | 13,419,286 | 2.089 | — | — | — | — |
| 8 | 7,545,200 | 14,279,359 | 1.893 | — | — | — | — |
| 9 | 7,770,800 | 15,169,558 | 1.952 | — | — | — | — |
| 10 | 9,593,300 | 14,877,070 | 1.551 | — | — | — | — |
| 11 | 11,199,500 | 14,367,475 | 1.283 | — | — | — | — |

## P5 · the marginal-reading stop, with the validator’s fix

104's rule 5 offers a cheaper march when the climb from it to the stop on its right buys damage at less than the march’s own average rate. The validator found two faults: the domination clause carried a **burn** term, so a stop that is cheaper *and* stronger failed to refuse a candidate that merely burned less; and the marginal rate was never required to be **positive**, so a candidate could be "offered" against a stop that does *less* damage for more silver. Fixed:
1. `C` is refused when some stop `T` has `silver_T ≤ silver_C` **and** `damage_T ≥ damage_C`;
2. `S` is the nearest stop (in silver) with `silver_S > silver_C` and `burn_S ≥ burn_C`;
3. `C` is offered when `0 < (damage_S − damage_C)/(silver_S − silver_C) < damage_C / silver_C`;
4. the best damage a silver wins per `S` (tie: more damage), placed immediately left of it.

| scenario | rows added: 104 → fixed | the row(s) the fix keeps (silver / damage / burn) | against | marginal | its own a silver | silver saved | damage | queue saved | the row(s) the fix drops | why dropped |
|---|---|---|---|---|---|---|---|---|---|---|
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | 1 → **1** | 7,040,900 / 13,745,002 / 34 | sweet-spot | 1.864 | 1.952 | +9.39 % | -9.01 % | -15.55 % | — | — |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | 1 → **1** | 7,044,400 / 13,653,248 / 61 | all-in | 1.785 | 1.938 | +34.64 % | -32.79 % | +39.15 % | — | — |
| first-run army, Bear V ×1 (20 000 leadership) | 0 → **0** | — | — | — | — | — | — | — | — | — |
| first-run army, Bear V ×2 (20 000 leadership) | 0 → **0** | — | — | — | — | — | — | — | — | — |
| first-run army, Bear V ×3 (20 000 leadership) | 0 → **0** | — | — | — | — | — | — | — | — | — |
| first-run army, Bear V ×10 (20 000 leadership) | 0 → **0** | — | — | — | — | — | — | — | — | — |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 1 → **0** | — | — | — | — | — | — | — | 32,525,600 / 27,855,395 / 22 | a stop is cheaper **and** stronger (burn term removed) |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 2 → **2** | 5,239,000 / 7,743,523 / 19<br>4,909,600 / 7,093,339 / 21 | sweet-spot<br>steady-max | 0.533<br>1.055 | 1.478<br>1.445 | +13.88 %<br>+19.29 % | -5.49 %<br>-14.86 % | +14.14 %<br>+19.61 % | — | — |
| 2026-09-17 export, its setup (7 000 leadership) | 1 → **0** | — | — | — | — | — | — | — | 10,957,600 / 20,595,580 / 44 | a stop is cheaper **and** stronger (burn term removed) |
| 2026-09-17 export, 12 000 leadership | 2 → **2** | 15,809,000 / 27,802,657 / 55<br>20,973,200 / 32,472,904 / 73 | sweet-spot<br>steady-max | 1.485<br>0.537 | 1.759<br>1.548 | +15.87 %<br>+0.40 % | -13.74 %<br>-0.14 % | +16.37 %<br>+0.44 % | 18,790,400 / 31,266,004 / 65 | a stop is cheaper **and** stronger (burn term removed) |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 1 → **1** | 25,518,800 / 26,838,851 / 28 | steady-max | 0.711 | 1.052 | +15.70 % | -11.17 % | +15.70 % | — | — |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 1 → **1** | 14,222,700 / 23,653,329 / 53 | sweet-spot | 1.636 | 1.663 | +16.85 % | -16.62 % | +16.82 % | — | — |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | 4 → **4** | 7,982,900 / 9,817,442 / 28<br>7,982,900 / 10,214,732 / 31<br>7,380,500 / 10,220,570 / 37<br>7,982,900 / 11,049,041 / 40 | sweet-spot<br>more-mercs<br>steady-max<br>all-in | 0.803<br>0.803<br>0.917<br>0.664 | 1.230<br>1.280<br>1.385<br>1.384 | +20.69 %<br>+20.69 %<br>+26.67 %<br>+22.19 % | -14.55 %<br>-14.07 %<br>-19.40 %<br>-12.03 % | +17.05 %<br>+17.05 %<br>+24.13 %<br>+29.87 % | — | — |

**The row the validator asked about** — 104's `10 957 600 / 23 226 182` offer on the export at 7 000, taken against an `all-in` that spent more silver for less damage. On this engine 104's rule offers 1 row(s) there and the fix keeps 0; what it drops is 10,957,600 / 20,595,580 / 44 (against all-in, marginal 0.569). Over all 13 scenarios the fixed rule offers **0** row whose marginal rate is not positive — the clause that refuses them is doing exactly what it was added for.

What each row the fixed rule adds actually fields:

| scenario | silver / damage / burn | shape | marches | troops | hired |
|---|---|---|---|---|---|
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | 7,040,900 / 13,745,002 / 34 | ladder | 4 | SP2 681 · RD2 343 · RD3 189 · RD1 593 · ARC2 791 | ABT6 30 · CHR6 8 · EMH6 28 · LGN6 10 |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | 7,044,400 / 13,653,248 / 61 | ladder | 4 | ARC2 1,959 · RD3 540 | ABT6 48 · CHR6 8 · EMH6 69 · LGN6 49 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 5,239,000 / 7,743,523 / 19 | ladder | 4 | SW1 491 · SP1 481 · SP2 261 · RD2 172 · ARC1 605 · RD3 93 · ARC2 324 · RD1 286 | EMH6 10 · ABT6 10 · LGN6 9 · CHR6 6 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 4,909,600 / 7,093,339 / 21 | ladder | 4 | SW1 447 · SP1 439 · SP2 238 · RD2 157 · ARC1 552 · RD3 84 · ARC2 296 · RD1 261 | EMH6 10 · ABT6 11 · LGN6 8 · CHR6 4 |
| 2026-09-17 export, 12 000 leadership | 15,809,000 / 27,802,657 / 55 | ladder | 4 | SP1 1,818 · SP2 991 · RD2 532 · RD1 940 · ARC1 2,067 · RD3 282 · ARC2 1,104 | ABT6 40 · CHR6 16 · EMH6 24 · LGN6 34 |
| 2026-09-17 export, 12 000 leadership | 20,973,200 / 32,472,904 / 73 | ladder | 4 | SP2 2,106 · RD3 636 · RD2 1,110 · RD1 1,958 · ARC2 2,394 | ABT6 40 · CHR6 16 · EMH6 86 · LGN6 34 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 25,518,800 / 26,838,851 / 28 | ladder | 4 | SP1 3,094 · RD2 866 · RD1 1,527 · SP2 1,621 · ARC1 3,597 · RD3 449 · ARC2 1,921 | EMH6 69 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 14,222,700 / 23,653,329 / 53 | ladder | 4 | SP1 1,655 · RD2 463 · SP2 885 · RD1 801 · ARC1 1,924 · RD3 240 · ARC2 1,027 | ABT6 29 · CHR6 5 · EMH6 28 · LGN6 31 |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | 7,982,900 / 9,817,442 / 28 | ladder | 4 | RD2 1,137 · RD3 626 | ABT6 50 · BER5 10 · LGN6 10 |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | 7,982,900 / 10,214,732 / 31 | ladder | 4 | RD2 1,137 · RD3 626 | ABT6 60 · BER5 10 · LGN6 10 |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | 7,380,500 / 10,220,570 / 37 | ladder | 4 | RD2 1,023 · RD3 564 | ABT6 74 · BER5 9 · LGN6 9 |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | 7,982,900 / 11,049,041 / 40 | ladder | 4 | RD2 1,137 · RD3 626 | ABT6 81 · BER5 10 · LGN6 10 |

The bar before and after, with the two monotonicity counts:

| scenario | rows before | rows after | silver-monotone breaks | burn-monotone breaks | the bar after (silver / damage / burn / row) |
|---|---|---|---|---|---|
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | 4 | 5 | 0 → 0 | 0 → 0 | 5,782,400 / 11,490,973 / 31 / silver-saver<br>7,040,900 / 13,745,002 / 34 / **new**<br>7,770,800 / 15,105,433 / 34 / sweet-spot<br>7,770,800 / 15,169,558 / 40 / steady-max<br>7,770,800 / 15,427,084 / 40 / all-in |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | 4 | 5 | 0 → 0 | 0 → 1 | 7,044,400 / 13,653,248 / 61 / **new**<br>8,448,400 / 15,734,486 / 49 / sweet-spot<br>8,448,400 / 16,340,168 / 52 / more-mercs<br>8,448,400 / 18,023,696 / 58 / steady-max<br>10,777,200 / 20,315,400 / 92 / all-in |
| first-run army, Bear V ×1 (20 000 leadership) | 1 | 1 | 0 → 0 | 0 → 0 | 8,131,400 / 4,722,842 / 1 / sweet-spot |
| first-run army, Bear V ×2 (20 000 leadership) | 1 | 1 | 0 → 0 | 0 → 0 | 16,262,800 / 9,557,884 / 2 / sweet-spot |
| first-run army, Bear V ×3 (20 000 leadership) | 2 | 2 | 0 → 0 | 0 → 0 | 24,394,200 / 14,168,526 / 3 / sweet-spot<br>32,525,600 / 19,115,768 / 3 / all-in |
| first-run army, Bear V ×10 (20 000 leadership) | 2 | 2 | 0 → 0 | 0 → 0 | 32,525,600 / 21,135,368 / 4 / sweet-spot<br>45,577,400 / 21,700,948 / 4 / all-in |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 3 | 3 | 1 → 1 | 1 → 1 | 32,525,600 / 29,021,204 / 25 / sweet-spot<br>32,525,600 / 30,057,473 / 28 / steady-max<br>36,125,500 / 28,781,642 / 30 / all-in |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 3 | 5 | 0 → 0 | 0 → 1 | 4,909,600 / 7,093,339 / 21 / **new**<br>5,239,000 / 7,743,523 / 19 / **new**<br>6,083,200 / 8,193,505 / 19 / sweet-spot<br>6,083,200 / 8,331,398 / 21 / steady-max<br>6,241,000 / 8,394,732 / 24 / all-in |
| 2026-09-17 export, its setup (7 000 leadership) | 4 | 4 | 1 → 1 | 1 → 1 | 10,957,600 / 21,662,734 / 47 / sweet-spot<br>10,957,600 / 22,133,839 / 50 / more-mercs<br>10,957,600 / 23,264,491 / 53 / steady-max<br>14,337,600 / 22,518,504 / 93 / all-in |
| 2026-09-17 export, 12 000 leadership | 4 | 6 | 1 → 1 | 1 → 1 | 14,231,900 / 25,145,044 / 51 / silver-saver<br>15,809,000 / 27,802,657 / 55 / **new**<br>18,790,400 / 32,231,242 / 67 / sweet-spot<br>20,973,200 / 32,472,904 / 73 / **new**<br>21,057,500 / 32,518,195 / 73 / steady-max<br>22,422,900 / 31,652,798 / 93 / all-in |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 4 | 5 | 1 → 1 | 0 → 1 | 18,583,900 / 18,681,950 / 20 / silver-saver<br>25,518,800 / 26,838,851 / 28 / **new**<br>30,270,800 / 30,215,378 / 28 / steady-max<br>30,607,200 / 29,677,128 / 25 / sweet-spot<br>31,092,400 / 31,218,724 / 30 / all-in |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 5 | 6 | 1 → 0 | 1 → 1 | 13,217,400 / 22,179,294 / 49 / silver-saver<br>14,222,700 / 23,653,329 / 53 / **new**<br>17,104,800 / 28,367,940 / 58 / sweet-spot<br>17,179,200 / 29,111,661 / 78 / all-in<br>17,179,200 / 29,265,102 / 67 / more-mercs<br>17,179,200 / 30,107,115 / 70 / steady-max |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | 5 | 9 | 1 → 3 | 1 → 3 | 7,380,500 / 10,220,570 / 37 / **new**<br>7,982,900 / 9,817,442 / 28 / **new**<br>7,982,900 / 10,214,732 / 31 / **new**<br>7,982,900 / 11,049,041 / 40 / **new**<br>8,302,100 / 9,566,618 / 25 / silver-saver<br>10,065,200 / 11,489,333 / 28 / sweet-spot<br>10,065,200 / 11,886,623 / 31 / more-mercs<br>10,065,200 / 12,681,203 / 37 / steady-max<br>10,259,100 / 12,560,063 / 118 / all-in |

**Rows a player could not tell from the stop beside them.** The owner's own line is that a stop another stop matches to 0.2 % "is inefficient and causes frustration". Of the 12 rows the fixed rule adds over the 13 scenarios, **1** of them save under 2 % of the silver for under 2 % of the damage: 2026-09-17 export, 12 000 leadership: 20,973,200 / 32,472,904 against steady-max 21,057,500 / 32,518,195 — 0.40 % of the silver saved for 0.14 % of the damage. Nothing in the rule bounds that — the marginal test is about the *rate* of the climb, not its size — so a minimum saving would have to be a clause of its own.

## P6 · “more mercs” and the steady max, as a battle fact

The owner keeps "more mercs". The one thing left to decide about the steady max is 104's reading that it exposed 69 of the 128 hired units on his bar — a **static proxy** read off the opening order (a hired stack standing at or above the lowest troop stack). This asks the battle instead: `simulateBattle` on the same counts, in both journals, and what it costs. `struck` counts the hired stacks the enemy **destroys**; `tithe` is `Σ ceil(n/10)` over the hired stacks, which is what the stock pays and what the bar prints as the burn.

| scenario | stop | hired fielded | hired stacks | static proxy (units) | stacks destroyed E/A | hits the hired land E/A | tithe (Σ ceil(n/10)) | printed burn | equal? | repeat damage |
|---|---|---|---|---|---|---|---|---|---|---|
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | steady-max | 89 | 4 | 0 | 4/4 | 9/9 | 10 | 10 | yes | 3,813,850 |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | more-mercs | 148 | 4 | 0 | 4/4 | 7/7 | 15 | 15 | yes | 4,343,303 |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | steady-max | 161 | 4 | 0 | 4/4 | 7/7 | 17 | 17 | yes | 4,904,479 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | steady-max | 69 | 1 | 0 | 1/1 | 3/3 | 7 | 7 | yes | 7,589,930 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | steady-max | 37 | 4 | 0 | 4/4 | 11/11 | 5 | 5 | yes | 2,075,999 |
| 2026-09-17 export, its setup (7 000 leadership) | more-mercs | 109 | 4 | 0 | 4/4 | 10/10 | 12 | 12 | yes | 5,487,598 |
| 2026-09-17 export, its setup (7 000 leadership) | steady-max | 121 | 4 | 0 | 4/4 | 10/10 | 13 | 13 | yes | 5,864,482 |
| 2026-09-17 export, 12 000 leadership | steady-max | 176 | 4 | 0 | 4/4 | 8/8 | 19 | 19 | yes | 8,281,474 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | steady-max | 69 | 1 | 0 | 1/1 | 2/2 | 7 | 7 | yes | 7,756,144 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | more-mercs | 149 | 4 | 0 | 4/4 | 10/10 | 16 | 16 | yes | 7,454,752 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | steady-max | 158 | 4 | 0 | 4/4 | 10/10 | 17 | 17 | yes | 7,735,423 |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | more-mercs | 80 | 3 | 0 | 3/3 | 4/4 | 8 | 8 | yes | 3,193,268 |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | steady-max | 100 | 3 | 0 | 3/3 | 4/4 | 10 | 10 | yes | 3,458,128 |

Over every steady-max and more-mercs stop on the 13 scenarios the tithe equals the printed burn on **every one**, and the static proxy reports units exposed on 0 of them. A hired stack the enemy destroys still costs `ceil(n/10)`, and a hired stack it never reaches costs the same: the burn is a property of the counts, not of the fight. The one figure exposure does move is **damage** — a hired stack destroyed early lands fewer hits — and that is already in `repeat.damage`, because `marchOf` runs both journals to get it.

#### The shelter, over **every** stop — S-87, checked
The proxy above was asked of two stops a bar. Asked of **every** stop of every scenario it is the check on S-87 itself, and the marker that says which engine this run was made on: under S-77 a capped hired type kept whatever count the sizer gave it and stood wherever its HP put it, so six stops on four scenarios fielded a hired stack the troops did not stand over — 1 240 units on the live camp’s steady max. `struck` is again the battle’s own answer — hired stacks the enemy destroys, enemy-first / army-first.

| scenario | stops | stops with a hired stack at or above the lowest troop stack | units so placed (worst stop) | that stop | hired stacks destroyed there E/A |
|---|---|---|---|---|---|
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | 4 | 0 | — | — | — |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | 4 | 0 | — | — | — |
| first-run army, Bear V ×1 (20 000 leadership) | 1 | 0 | — | — | — |
| first-run army, Bear V ×2 (20 000 leadership) | 1 | 0 | — | — | — |
| first-run army, Bear V ×3 (20 000 leadership) | 2 | 0 | — | — | — |
| first-run army, Bear V ×10 (20 000 leadership) | 2 | 0 | — | — | — |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 3 | 0 | — | — | — |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 3 | 0 | — | — | — |
| 2026-09-17 export, its setup (7 000 leadership) | 4 | 0 | — | — | — |
| 2026-09-17 export, 12 000 leadership | 4 | 0 | — | — | — |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 4 | 0 | — | — | — |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 5 | 0 | — | — | — |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | 5 | 0 | — | — | — |

**No stop of any of the 13 scenarios fields a hired stack the troops do not stand over.** S-87 holds on every army this file measures, and every figure above is read off a sheltered march.

## Dependencies

#### P1 → P5 · the marginal reading on a tailed bar
P1 changes campaign damage and silver on any row the horizon outruns, and P5 is stated entirely in campaign figures — so P5 is re-run with **every** band row and every stop tailed, which is what the bar would hold if P1 shipped.

| scenario | stops tailed | P5 rows without P1 | P5 rows with P1 | same rows? | the difference |
|---|---|---|---|---|---|
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | 0 | 1 | 1 | yes | — |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | 0 | 1 | 1 | yes | — |
| first-run army, Bear V ×1 (20 000 leadership) | 1 | 0 | 0 | yes | — |
| first-run army, Bear V ×2 (20 000 leadership) | 1 | 0 | 0 | yes | — |
| first-run army, Bear V ×3 (20 000 leadership) | 1 | 0 | 0 | yes | — |
| first-run army, Bear V ×10 (20 000 leadership) | 0 | 0 | 0 | yes | — |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 0 | 0 | 0 | yes | — |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 0 | 2 | 2 | yes | — |
| 2026-09-17 export, its setup (7 000 leadership) | 0 | 0 | 0 | yes | — |
| 2026-09-17 export, 12 000 leadership | 0 | 2 | 2 | yes | — |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 0 | 1 | 1 | yes | — |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 0 | 1 | 1 | yes | — |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | 0 | 4 | 4 | yes | — |

P5's rows are identical with and without P1 on all 13 scenarios. The reason is measurable and worth stating rather than generalising: the 3 scenarios P1 touches (first-run army, Bear V ×1 (20 000 leadership), first-run army, Bear V ×2 (20 000 leadership), first-run army, Bear V ×3 (20 000 leadership)) carry a bar of one or two stops, and P5 has no candidate to offer on any of them either way; on every scenario where P5 does add rows, no stop is short of the horizon, so the tail never fires. **The two are independent on this benchmark, and would not be on an account whose stops run short *and* whose bar has three or more stops** — none of the 13 is such an account.

#### P5 vs P3 · does the marginal reading cover the thrift end?
P3 asks for a cheaper march left of the sweet spot; P5 adds a march wherever the climb to the next stop is a bad deal, which is sometimes the same place and sometimes not. Per scenario: how many rows P5 adds **left of the sweet spot** (which is where a silver saver would go), and whether the three P3 rules would offer anything P5 does not.

A rule that hands back a march the bar already carries offers nothing, so the three P3 columns below say `(a stop)` where that is what happened — which is also a check on the emulation, since P3 "today" is the engine's own `leastSilver` and has to reproduce the silver saver wherever the engine offered one.

| scenario | P5 rows added | of those, left of the sweet spot | P3 today offers | P3 relaxed offers | P3 marginal offers | does P5 cover P3? |
|---|---|---|---|---|---|---|
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | 1 | 0 | 1,279,900 a march (silver-saver) | 1,279,900 a march (silver-saver) | nothing | nothing to cover — P3 hands back a march the bar already carries |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | 1 | 0 | nothing | **1,735,500 a march** | nothing | **no** — P3 would offer one and P5 does not |
| first-run army, Bear V ×1 (20 000 leadership) | 0 | 0 | nothing | nothing | nothing | nothing to cover — P3 offers nothing here |
| first-run army, Bear V ×2 (20 000 leadership) | 0 | 0 | nothing | nothing | nothing | nothing to cover — P3 offers nothing here |
| first-run army, Bear V ×3 (20 000 leadership) | 0 | 0 | nothing | nothing | nothing | nothing to cover — P3 offers nothing here |
| first-run army, Bear V ×10 (20 000 leadership) | 0 | 0 | nothing | nothing | nothing | nothing to cover — P3 offers nothing here |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 0 | 0 | nothing | **8,131,400 a march** | nothing | **no** — P3 would offer one and P5 does not |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 2 | 0 | nothing | nothing | nothing | nothing to cover — P3 offers nothing here |
| 2026-09-17 export, its setup (7 000 leadership) | 0 | 0 | nothing | **2,178,700 a march** | nothing | **no** — P3 would offer one and P5 does not |
| 2026-09-17 export, 12 000 leadership | 2 | 1 | 3,178,100 a march (silver-saver) | 3,178,100 a march (silver-saver) | **3,703,800 a march** | nothing to cover — P3 hands back a march the bar already carries |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 1 | 0 | 3,497,500 a march (silver-saver) | 3,497,500 a march (silver-saver) | **4,484,100 a march** | nothing to cover — P3 hands back a march the bar already carries |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 1 | 1 | 2,974,200 a march (silver-saver) | 2,974,200 a march (silver-saver) | **3,309,300 a march** | nothing to cover — P3 hands back a march the bar already carries |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | 4 | 0 | 2,013,400 a march (silver-saver generator) | 2,013,400 a march (silver-saver generator) | 2,013,400 a march (silver-saver generator) | nothing to cover — P3 hands back a march the bar already carries |

#### P2 → P4 and P5 · the table and the marginal rows on revive prices (HIS BAR)
Revive divides the silver by about ten and moves every plan six or seven buckets left, so the reference table is a different table and the marginal rates are different rates. Measured on HIS BAR alone, as asked.

| reading | table rows | peak a silver | cheapest row | dearest row |
|---|---|---|---|---|
| P4 over the band, retrain | 3 | 1.987 | 5,782,400 | 7,770,800 |
| P4 over the band, revive | 3 | 19.659 | 584,500 | 780,400 |

P5 on HIS BAR adds **1** rows on retrain prices and **0** on revive prices (against the bar the re-pricing picker draws there: silver-saver · sweet-spot · steady-max).

#### P4 ⟂ P5 · the table is over the band, not the stops
P4 buckets the band; P5 adds stops drawn **from** the band. So the table cannot move when P5 fires — measured by drawing it twice, once over the band and once over the band with P5's rows marked as stops.

| scenario | band table rows | band table rows with P5’s stops on the bar | identical? |
|---|---|---|---|
| HIS BAR — live profile, Aydae marching, three captains enlisted, 4 975 | 3 | 3 | yes |
| LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded) | 3 | 3 | yes |
| first-run army, Bear V ×1 (20 000 leadership) | 2 | 2 | yes |
| first-run army, Bear V ×2 (20 000 leadership) | 3 | 3 | yes |
| first-run army, Bear V ×3 (20 000 leadership) | 2 | 2 | yes |
| first-run army, Bear V ×10 (20 000 leadership) | 2 | 2 | yes |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 3 | 3 | yes |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 3 | 3 | yes |
| 2026-09-17 export, its setup (7 000 leadership) | 2 | 2 | yes |
| 2026-09-17 export, 12 000 leadership | 3 | 3 | yes |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 4 | 4 | yes |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 3 | 3 | yes |
| live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975) | 3 | 3 | yes |

## Summary — one row a proposal, plus the prerequisite

| proposal | what it changes | scenarios affected | biggest measured change | HIS BAR would show | cost (rows / monotonicity / run time) | depends on / conflicts with |
|---|---|---|---|---|---|---|
| **P1** troops-only tail on the repeated stops | campaign damage, silver and queue on a stop the horizon outruns; the repeated march is untouched | 3 of 13 (3 stops) | 4,722,842 → 18,554,768 damage (+292.87 %), first-run army, Bear V ×1 (20 000 leadership) sweet-spot | **nothing** — all three stops already play the whole horizon | no row added; order and knee unchanged (measured, every scenario); one Elite sizing a scenario, < 1 ms | independent of P2–P6 on the bar’s **composition**; measured against **P5**, whose rows are identical with and without it on every scenario here |
| **P2** price the plan on the Battle card’s mode | every silver, gold and queue figure on the bar when the player is on Revive | 0 of 13 are on revive today; all 13 would move if switched | silver ÷ 9.98 at most (first-run army, Bear V ×10 (20 000 leadership) · all-in) | sweet-spot: 7,770,800 → 780,400 silver, 21d 15h → 2d 4h, 2,472 → 74,088 gold | no row added; the engine ignores `plan.mode` today, so shipping it is an engine change and not a bar rule; re-pick cost is the plan’s own | conflicts with **nothing**, but it moves the inputs of P3, P4 and P5, all three of which are stated in silver |
| **P3** a thrift exception at the cheap end | one extra stop (or a cheaper one) left of the sweet spot | today’s rule offers a **new** march on 0 of 13; the relaxed rule adds 3 more | 1,279,900 a march against the sweet spot’s 1,942,700 | **nothing new** — it hands back the silver saver S-87 already put on his bar at 1,279,900 a march | +1 row where it fires; silver-monotone by construction | **does not overlap P5** — measured: both rules fire on 1 of the 13 scenarios and land on the same march on 0 of them; reads P2’s prices |
| **P4** bucket the table over the band | which plans the reference table names; no stop moves | all 13 (the table is redrawn everywhere) | the table loses 22 of its 24 rows (first-run army, Bear V ×1 (20 000 leadership)); peak a silver 1.476 lower at worst (live camp of 2026-09-18 (arbalesters 485 · legionaries 1 002 · bears unlimited, 4 975)) | peak 2.759 → 1.987, 11 → 3 rows | no row added to the bar; run time nil (arithmetic over rows already held) | independent of **P5** (measured); reads P2’s prices |
| **P5** the marginal-reading stop (fixed) | up to one extra stop per stop on the bar | 7 of 13 | 12 rows over the 13 (104’s rule added 14); the best of them saves 34.64 % of the silver for 32.79 % of the damage — 7,044,400 / 13,653,248 against all-in's 10,777,200 / 20,315,400 (LIVE profile as experiment 102 builds it (Aydae alone, top tiers excluded)) | **1 row** — 7,040,900 / 13,745,002 / 34 against sweet-spot: saves 9.39 % of the silver for 9.01 % of the damage, and sits 15.55 % **longer** in the barracks | +12 rows over 13 scenarios, 1 of them under 2 % of the silver from the stop beside them; silver-monotone breaks +1, burn-monotone +5 in total; 0.08 ms at worst | **independent of P1 on this benchmark** (measured: identical rows with and without the tail, on every scenario); does not overlap **P3**; reads P2’s prices |
| **P6** leave “more mercs” and the steady max alone | nothing | 13 of 13 measured, 0 changed | the tithe equals the printed burn on every steady-max and more-mercs stop; the proxy flags units on 0 of them | no change | none | independent of everything |
| **S-87** shelter every hired type (**done — the prerequisite is met**, `b080223`) | which march each stop fields: a capped hired stack the sizer had put above the lowest troop stack is lowered under it, as S-77 already did for the unlimited ones | shipped; **0 of the stops on the 13 scenarios still field an unsheltered hired stack** (it was 6 on 4 scenarios under S-77) | the live camp’s steady max: 1 240 hired units on top of the troops → 0; the plan’s campaign on his export at 7 000 24 814 601 → 23 264 491 for the same silver | the bar he reads is a different bar — see every figure above | the six rows above are measured **on** it; nothing is waiting on it any more |

**What could not be emulated faithfully, and what was done instead.** (1) P2’s "search on revive prices" — `planCampaign` accepts a revive request and ignores it (measured above: identical bars), so the band was re-priced and re-picked by the bar’s own rules restated in this file. That restatement cannot re-run the put-back pass nor rebuild the `all-in`, both of which need the engine; it is checked against the engine on the retrain prices and the table names every scenario where a put-back or an all-in is the reason for a disagreement. (2) P1’s tail is the engine’s own `sizer([], 'elite')` call reproduced from outside; the campaign totals it produces are arithmetic over that march, which is exactly what `allIn` does with it.
