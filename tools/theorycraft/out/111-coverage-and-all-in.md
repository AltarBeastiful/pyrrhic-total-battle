# 111 — the top of the bar, and the all-in that is dropped instead of re-sized

Two regressions S-94 left open, measured on the fifteen armies `tests/engine/plan-criteria.test.ts` holds its criteria on. **Before** is HEAD `7b5e02e` (S-96); **after** is S-97. Every damage is the worst opening on both engines — the reading is not what changed. The rivals are `sizeStacks` and the shelter alone, never the plan’s search.

## §A — “Aydae alone, 4 975”: the bar, and what the camp can field

The owner’s export with **one** captain enlisted (Aydae 43 ★3), the two top guardsman tiers clicked out, his live hired stock (hunters 83 · legionaries unlimited · chariots 10 · arbalesters 60), 4 975 leadership against 2 180 authority — experiment 103’s camp, and the one army S-94 disclosed as a like-for-like loss.

**The bar, before** (791 ms):

| stop | burned | hired | damage a march | silver a march | campaign | campaign silver | burned |
|---|--:|--:|--:|--:|--:|--:|--:|
| sweet-spot | 6 | 55 | 3,314,477 | 1,837,900 | 13,253,690 | 7,351,600 | 25 |
| steady-max | 7 | 64 | 3,387,893 | 1,837,900 | 13,473,938 | 7,351,600 | 28 |
| all-in | 26 | 244 | 5,366,544 | 2,705,500 | 18,744,735 | 11,240,800 | 111 |

The burn levels the bar may offer: **4** 2,613,210 · **5** 2,926,178 · **6** 3,314,477 · **7** 3,387,893 · **8** 3,110,814 · **9** 3,199,996 · **10** 3,236,704

**The bar, after** (878 ms):

| stop | burned | hired | damage a march | silver a march | campaign | campaign silver | burned |
|---|--:|--:|--:|--:|--:|--:|--:|
| sweet-spot | 10 | 84 | 4,074,558 | 1,948,300 | 15,533,933 | 7,682,800 | 37 |
| steady-max | 17 | 161 | 4,773,281 | 2,203,500 | 17,630,102 | 8,448,400 | 58 |
| all-in | 26 | 244 | 5,366,544 | 2,705,500 | 18,744,735 | 11,240,800 | 111 |

The burn levels the bar may offer: **4** 2,613,210 · **5** 2,926,178 · **6** 3,314,477 · **7** 3,387,893 · **8** 3,110,814 · **9** 3,199,996 · **10** 4,074,558 · **17** 4,773,281

**What the camp can field by hand** — the sizer over each prefix of its troop ranking, every hired stack lowered under the lowest troop stack. Two readings of the same family: at the account’s whole stock (a march it can send **once**) and anchored at the counts that last the three repeats a rung plays.

| shape | burned | hired | damage | silver | repeats | anchored burned | anchored damage |
|---|--:|--:|--:|--:|--:|--:|--:|
| the sizer over 8 troop types (elite) | 7 | 65 | 3,465,527 | 1,837,900 | 2 | 7 | 3,387,893 |
| the sizer over 7 troop types (elite) | 10 | 86 | 4,229,826 | 1,948,300 | 1 | 10 | 4,074,558 |
| the sizer over 6 troop types (elite) | 12 | 104 | 3,844,207 | 2,063,700 | 1 | 12 | 3,688,939 |
| the sizer over 5 troop types (elite) | 13 | 122 | 3,541,542 | 1,995,500 | 1 | 13 | 3,438,030 |
| the sizer over 4 troop types (elite) | 18 | 166 | 4,254,372 | 2,203,500 | 1 | 17 | 4,773,281 |
| the sizer over 3 troop types (elite) | 26 | 244 | 5,366,544 | 2,705,500 | 1 | 23 | 4,771,665 |
| the sizer over 2 troop types (elite) | 31 | 303 | 4,987,062 | 2,845,100 | 1 | 28 | 4,524,613 |

## §B — the burn levels the bar reaches, and what stands above its top rung

The bar’s dearest **rung** (the `steady-max`; the `all-in` is a sequence, not a rung of the ladder), and the anchored sheltered marches that burn more than it and hit harder — the offers the bar does not carry.

| army | top rung before | top rung after | above it, before | above it, after |
|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership) | 1 · 4,631,402 | 1 · 4,631,402 | — | — |
| first-run army, Bear V ×2 (20 000 leadership) | 1 · 4,743,602 | 1 · 4,743,602 | — | — |
| first-run army, Bear V ×3 (20 000 leadership) | 1 · 4,631,402 | 1 · 4,631,402 | — | — |
| first-run army, Bear V ×10 (20 000 leadership) | 1 · 5,192,402 | 1 · 5,192,402 | — | — |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 7 · 7,498,490 | 7 · 7,498,490 | — | — |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 28 · 25,080,732 | 28 · 25,080,732 | — | — |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 5 · 2,048,786 | 5 · 2,048,786 | — | — |
| 2026-09-17 export, its setup (7 000 leadership) | 14 · 5,913,067 | 14 · 5,913,067 | — | — |
| 2026-09-17 export, 12 000 leadership | 17 · 8,014,627 | 22 · 8,153,756 | 22 · 8,153,756 | — |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 7 · 7,354,938 | 7 · 7,354,938 | — | — |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 19 · 7,987,079 | 19 · 7,987,079 | — | — |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | 7 · 3,387,893 | 17 · 4,773,281 | 10 · 4,074,558, 12 · 3,688,939, 13 · 3,438,030, 17 · 4,773,281, 23 · 4,771,665, 28 · 4,524,613 | — |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | 10 · 3,285,305 | 15 · 4,358,805 | 12 · 3,544,681, 21 · 3,891,819 | — |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | 5 · 2,423,299 | 18 · 3,976,648 | 10 · 2,793,778, 18 · 3,976,648 | — |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | 10 · 2,873,382 | 10 · 2,873,382 | — | — |

The burn levels each bar may offer, army by army — the ladder’s own reach, before → after:

- **first-run army, Bear V ×1 (20 000 leadership)** — 1 → 1
- **first-run army, Bear V ×2 (20 000 leadership)** — 1 → 1
- **first-run army, Bear V ×3 (20 000 leadership)** — 1 → 1
- **first-run army, Bear V ×10 (20 000 leadership)** — 1 → 1
- **first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)** — 4 · 5 · 6 · 7 → 4 · 5 · 6 · 7
- **first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)** — 19 · 20 · 21 · 22 · 23 · 24 · 25 · 26 · 27 · 28 → 19 · 20 · 21 · 22 · 23 · 24 · 25 · 26 · 27 · 28
- **the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)** — 4 · 5 → 4 · 5
- **2026-09-17 export, its setup (7 000 leadership)** — 7 · 8 · 9 · 10 · 11 · 12 · 13 · 14 → 7 · 8 · 9 · 10 · 11 · 12 · 13 · 14
- **2026-09-17 export, 12 000 leadership** — 8 · 9 · 10 · 11 · 12 · 13 · 14 · 15 · 16 · 17 → 8 · 9 · 10 · 11 · 12 · 13 · 14 · 15 · 16 · 17 · 22
- **live account of 2026-09-18 (one hired type, 20 000 leadership)** — 4 · 5 · 6 · 7 → 4 · 5 · 6 · 7
- **live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)** — 10 · 11 · 12 · 13 · 14 · 15 · 16 · 17 · 18 · 19 → 10 · 11 · 12 · 13 · 14 · 15 · 16 · 17 · 18 · 19
- **Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)** — 4 · 5 · 6 · 7 · 8 · 9 · 10 → 4 · 5 · 6 · 7 · 8 · 9 · 10 · 17
- **the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)** — 8 · 9 · 10 · 11 → 8 · 9 · 10 · 11 · 12 · 13 · 21
- **his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)** — 4 · 5 · 8 → 4 · 5 · 8 · 10 · 18
- **his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)** — 7 · 8 · 9 · 10 → 7 · 8 · 9 · 10

## §C — the all-in: offered, dropped, re-sized

The stop is on the bar because its first march **fields** more hired units than the steady max’s repeat, and S-94 drops it when a thriftier stop is behind it on neither damage nor silver. What a bar owes the player is the row below: a sheltered march that fields **more** hired than the top rung, hits at least as hard and costs **less** silver is an offer the account can plainly make.

| army | all-in before | all-in after | a cheaper, fuller march the bar owes |
|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership) | **none** | **none** | none |
| first-run army, Bear V ×2 (20 000 leadership) | **none** | **none** | none |
| first-run army, Bear V ×3 (20 000 leadership) | 1 burned · 18,750,008 for 32,525,600 · 3 over 4 | 1 burned · 18,750,008 for 32,525,600 · 3 over 4 | offered |
| first-run army, Bear V ×10 (20 000 leadership) | 1 burned · 20,893,375 for 36,013,400 · 4 over 4 | 1 burned · 20,893,375 for 36,013,400 · 4 over 4 | offered |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 9 burned · 29,841,879 for 33,291,200 · 30 over 4 | 9 burned · 29,841,879 for 33,291,200 · 30 over 4 | offered |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | **none** | **none** | none |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 7 burned · 8,519,930 for 6,083,200 · 24 over 4 | 7 burned · 8,519,930 for 6,083,200 · 24 over 4 | offered |
| 2026-09-17 export, its setup (7 000 leadership) | 26 burned · 23,619,920 for 15,179,600 · 92 over 4 | 26 burned · 23,619,920 for 15,179,600 · 92 over 4 | offered |
| 2026-09-17 export, 12 000 leadership | **none** | **none** | none |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 9 burned · 29,743,332 for 30,928,400 · 30 over 4 | 9 burned · 29,743,332 for 30,928,400 · 30 over 4 | offered |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 24 burned · 31,714,657 for 18,768,000 · 88 over 4 | 24 burned · 31,714,657 for 18,768,000 · 88 over 4 | offered |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | 26 burned · 18,744,735 for 11,240,800 · 111 over 4 | 26 burned · 18,744,735 for 11,240,800 · 111 over 4 | offered |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | **none** | 25 burned · 10,899,547 for 6,653,700 · 133 over 4 | the sizer over 5 troop types (elite): 96 hired, 3,544,681 for 2,264,700 |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | 18 burned · 15,906,592 for 11,378,400 · 72 over 4 | **none** | none |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | 11 burned · 11,585,381 for 11,202,400 · 41 over 4 | 11 burned · 11,585,381 for 11,202,400 · 41 over 4 | offered |

**Two rows of that table are not what they look like.**

- *his camp of 2026-09-19, the localStorage dump* loses its `all-in` **because the bar caught up with it**: the 18-chunk march the stop used to be alone in offering (3 976 648 a march for 2 844 600) is the bar’s **steady max** now, so `offer`’s own dedupe refuses a second row of the same march. The campaign behind it is a repeated one and hits harder for less: 15 906 592 for 11 378 400 silver and 72 chunks as a sequence, 13 842 678 for 10 476 500 and **57** as a rung — less damage over the four marches, and 8 % less silver for fifteen chunks of stock kept.
- *the 12 000 export* has no `all-in` on either engine, and that is the drop rule working. Measured with the rule switched off by hand on both builds: the stop plays **31 308 140 for 23 696 200 silver and 90 burned** against the steady max’s 31 963 845 for 21 035 600 and 82 — behind on every figure a stop prints. Re-sizing it at its own hired counts changes nothing there: the strongest shape at the vector it settles on **is** the shape it settled on.

**What the re-size buys, where it buys anything.** The walk that builds this stop asks each shape *“how much of the remaining stock can you shelter?”* and keeps the one that shelters the most; nobody then asked *“and what is the best shape for that much?”*. On the owner’s live camp of 2026-09-18 the answer is a different shape at the same vector — measured march by march, all four of them: **2 509 790 damage for 1 559 600 silver** where the walk had settled on 2 509 790 for **2 844 600**, the same 347 hired and the same 36 chunks. That is 45 % of the march’s silver, for nothing, and it is what puts the stop back on that bar: 10 899 547 for **6 653 700** over four marches, which the steady max beside it (15 306 859 for 9 849 200 at 52 chunks) no longer beats on silver, so S-94’s rule no longer drops it.


## §D — what the pass costs the search

| army | before (ms) | after (ms) |
|---|--:|--:|
| first-run army, Bear V ×1 (20 000 leadership) | 57 | 66 |
| first-run army, Bear V ×2 (20 000 leadership) | 39 | 51 |
| first-run army, Bear V ×3 (20 000 leadership) | 39 | 45 |
| first-run army, Bear V ×10 (20 000 leadership) | 55 | 61 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 100 | 97 |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 7,521 | 7,087 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 577 | 629 |
| 2026-09-17 export, its setup (7 000 leadership) | 1,401 | 1,484 |
| 2026-09-17 export, 12 000 leadership | 1,265 | 1,316 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 56 | 70 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 910 | 957 |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | 791 | 878 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | 448 | 473 |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | 78 | 115 |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | 82 | 76 |
| **all fifteen** | **13,419** | **13,405** |
