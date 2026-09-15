
## 1. The plan the app puts on screen

`plan` (the best found): **67 marches**, 154,214,995 damage, 113,670,300 silver, 207 mercs lost — epic-monster-hunter 10 · arbalester 10 · legionary 7 · chariot 0 ⃰
`recommend` — what the UI takes — **64 marches**, 118,544,472 damage, 64,352,400 silver, 199 mercs lost — epic-monster-hunter 9 · arbalester 10 · legionary 10 · chariot 0 ⃰
**types at 0: chariot**  (⃰ = at 0)
with `budgetMs: 25_000` (the app's own call): the same `plan` — 67 marches, 154,214,995 damage, 113,670,300 silver — and the same `recommend`, 64 marches at 64,352,400 silver, epic-monster-hunter 9 · arbalester 10 · legionary 10 · chariot 0 ⃰: **identical to the unbudgeted run (the 25 s deadline is not what shapes the answer here — the search finishes in about 2 s)**
the repeated march: spearman-1 535 · spearman-2 291 · rider-1 257 · archer-1 504 · rider-2 137 · archer-2 269 · rider-3 74 · arbalester-6 10 · epic-monster-hunter-6 9 · legionary-6 10
its finale (`finaleCounts`): archer-2 2,485 · rider-3 686 · arbalester-6 13 · chariot-6 37 · epic-monster-hunter-6 29 · legionary-6 9
binding: silver false · mercenaries false · leadership true · marches false
`plan (the maximised one)`: 67 marches, 154,214,995 damage, 113,670,300 silver, 207 mercs lost — epic-monster-hunter 10 · arbalester 10 · legionary 7 · chariot 0 ⃰ — at 0: chariot
`recommend`: 64 marches, 118,544,472 damage, 64,352,400 silver, 199 mercs lost — epic-monster-hunter 9 · arbalester 10 · legionary 10 · chariot 0 ⃰ — at 0: chariot
`knee`: 64 marches, 150,704,145 damage, 104,880,300 silver, 199 mercs lost — epic-monster-hunter 10 · arbalester 10 · legionary 10 · chariot 0 ⃰ — at 0: chariot
`mostEfficient`: 10 marches, 27,457,044 damage, 5,970,700 silver, 142 mercs lost — epic-monster-hunter 35 · arbalester 40 · legionary 40 · chariot 20 — at 0: —
`mostThrifty`: 85 marches, 146,255,402 damage, 152,929,300 silver, 105 mercs lost — epic-monster-hunter 9 · arbalester 0 ⃰ · legionary 0 ⃰ · chariot 0 ⃰ — at 0: arbalester, legionary, chariot

## 1b. Every alternative the plan carries

| label | marches | damage | silver | mercs lost | EMH | arb | leg | chariot | at 0 |
|---|---|---|---|---|---|---|---|---|---|
| 2 stacks · 158 hired · 2.1M silver a march | 2 | 10,495,873 | 4,288,500 | 46 | 64 | 15 | 72 | 7 | — |
| 2 stacks · 143 hired · 2.1M silver a march | 3 | 15,053,452 | 6,527,200 | 60 | 83 | 14 | 13 | 33 | — |
| 3 stacks · 100 hired · 2.3M silver a march | 4 | 18,154,602 | 8,926,900 | 59 | 15 | 28 | 27 | 30 | — |
| 3 stacks · 145 hired · 2M silver a march | 6 | 30,041,947 | 11,888,200 | 106 | 45 | 52 | 23 | 25 | — |
| 3 stacks · 90 hired · 2.3M silver a march | 6 | 25,335,494 | 14,158,800 | 75 | 29 | 36 | 0 | 25 | legionary |
| 3 stacks · 141 hired · 2.2M silver a march | 8 | 39,155,231 | 17,776,500 | 124 | 56 | 46 | 19 | 20 | — |
| 4 stacks · 61 hired · 1.6M silver a march | 13 | 39,699,474 | 21,079,300 | 115 | 18 | 22 | 6 | 15 | — |
| 5 stacks · 70 hired · 1.7M silver a march | 14 | 50,435,646 | 24,210,900 | 135 | 19 | 25 | 14 | 12 | — |
| 3 stacks · 20 hired · 2.3M silver a march | 14 | 31,821,407 | 32,443,000 | 65 | 8 | 0 | 0 | 12 | arbalester, legionary |
| 5 stacks · 58 hired · 1.7M silver a march | 25 | 79,428,422 | 42,024,800 | 180 | 23 | 18 | 8 | 9 | — |
| 7 stacks · 35 hired · 1.6M silver a march | 35 | 94,691,209 | 55,276,300 | 183 | 12 | 10 | 9 | 4 | — |
| 7 stacks · 29 hired · 986.5K silver a march | 64 | 118,544,472 | 64,352,400 | 199 | 9 | 10 | 10 | 0 | chariot |
| 7 stacks · 27 hired · 1.7M silver a march | 67 | 154,214,995 | 113,670,300 | 207 | 10 | 10 | 7 | 0 | chariot |

The frontier does carry chariot plans — at 1 to 20 chariots — but every one of them is a 2-to-20-march plan, an order of magnitude below the 154,214,995 the 67-march plan reaches.

## 2. The mechanism: how many marches each type allows, alone and together

| type | held | fielded | chunks lost a march | marches it allows alone |
|---|---|---|---|---|
| epic-monster-hunter | 92 | 10 | 1 | 83 |
| arbalester | 76 | 10 | 1 | 67 |
| legionary | 72 | 7 | 1 | 66 |
| chariot | 37 | 0 | 1 | not fielded |

`marchesFor` takes the **minimum over the fielded types**: the run lasts as long as the type that runs out first — here **legionary at 7 fielded, 66 marches**. So fielding a chariot at any count makes the whole campaign *shorter*, and *shorter* in the engine's arithmetic means `total = marches × damage(march) + damage(finale)` **loses a whole march's damage**.
the chariot ceilings in full (the count the type could be fielded at, and the marches that count allows):
| chariot fielded | lost a march | marches allowed |
|---|---|---|
| 1 | 1 | 37 |
| 5 | 1 | 33 |
| 9 | 1 | 29 |
| 10 | 1 | 28 |
| 12 | 2 | 13 |
| 20 | 2 | 9 |
| 26 | 3 | 4 |
| 37 | 4 | 1 |

so the largest chariot count that still allows a 66-march run is **0 — none**, and the planner's own grid asks for it at every march count it tries.

## 3. The plan's own march, chariot restored at every count (real `simulateBattle`)

the plan's own march, as the planner prices it: **2,287,262** damage, 1,688,900 silver, 3 mercs lost, 16 strikes. The real `simulateBattle` on the same counts: **2,287,262** damage (0.00 % against the planner's figure), 1,688,900 silver, 4d 16h training.

| chariot | sim damage | Δ damage | silver | chariot stack HP | kill position | chariot hits (E/A) | chariot damage |
|---|---|---|---|---|---|---|---|
| 0 | 2,287,262 | +0 | 1,688,900 | 0 | — | 0/0 | 0 |
| 1 | 2,376,524 | +89,262 | 1,688,900 | 29,754 | 11 | 3/3 | 89,262 |
| 2 | 2,465,786 | +178,524 | 1,688,900 | 59,508 | 11 | 3/3 | 178,524 |
| 4 | 2,644,310 | +357,048 | 1,688,900 | 119,016 | 10 | 3/3 | 357,048 |
| 7 | 2,855,818 | +568,556 | 1,688,900 | 208,278 | 8 | 2/2 | 416,556 |
| 10 | 3,034,342 | +747,080 | 1,688,900 | 297,540 | 8 | 2/2 | 595,080 |
| 12 | 2,960,434 | +673,172 | 1,688,900 | 357,048 | 2 | 1/1 | 357,048 |
| 15 | 2,901,800 | +614,538 | 1,688,900 | 446,310 | 1 | 0/1 | 223,155 |
| 20 | 2,976,185 | +688,923 | 1,688,900 | 595,080 | 1 | 0/1 | 297,540 |
| 26 | 3,065,447 | +778,185 | 1,688,900 | 773,604 | 1 | 0/1 | 386,802 |
| 32 | 3,154,709 | +867,447 | 1,688,900 | 952,128 | 1 | 0/1 | 476,064 |
| 37 | 3,229,094 | +941,832 | 1,688,900 | 1,100,898 | 1 | 0/1 | 550,449 |

**Yes — on the march alone, restoring the chariot gains damage.** The best of them is **37 chariots, +941,832 damage a march** (41.18 %). Held **inside the same ladder** that shelters the fielded mercenaries, the chariot stack strikes; it is a stack the enemy has to kill, and the engine's own arithmetic agrees with the simulation on this (see the planner's figure above).

## 3b. Where the chariot stack sits in the plan's march (kill order, highest HP first)

| # | stack | count | total HP | per hit | hits E/A |
|---|---|---|---|---|---|
| 1 | SP1 | 915 | 358,680 | 150,518 | 0/1 |
| 2 | SP2 | 498 | 351,090 | 156,422 | 1/1 |
| 3 | RD1 | 440 | 344,520 | 156,200 | 1/1 |
| 4 | ARC1 | 862 | 337,904 | 154,298 | 1/1 |
| 5 | RD2 | 235 | 331,115 | 164,124 | 1/1 |
| 6 | ARC2 | 460 | 324,760 | 162,288 | 2/2 |
| 7 | RD3 | 127 | 318,262 | 177,190 | 2/2 |
| 8 | EMH6 | 10 | 157,730 | 182,294 | 2/2 |
| 9 | ABT6 | 10 | 149,060 | 152,000 | 2/2 |
| 10 | LGN6 | 7 | 104,139 | 77,805 | 3/3 |

The plan's ladder is built to clear a floor set by **the mercenaries it fields**: their largest stack is 157,730 HP, and `ladder()` puts its lowest rung 25 % above that. Read the table with that number: a chariot stack of 10 is **297,540 HP — above the mercenary floor (157,730) and below every troop rung** (358,680 at the top). The enemy kills highest-HP first, so the seven troop rungs die before it and the chariot strikes **twice** (kill position 8 of 11): the same ladder shelters it, which is why restoring it costs **no extra silver at all** (the silver column in the table above is flat) — and why, at 12 chariots and beyond, it climbs past the troop rungs and its strikes fall to one and then none.

## 4. What the uniform shape costs: the two-phase campaign the planner cannot represent

A plan is **one march repeated plus one finale** (`marchesFor` ties the repeats to the tightest type), so a type whose stock is short is either in *every* repeat or in *none*. The chariot's stock (37) is short: fielding it makes the run shorter, and the plan drops it. What it never tries is `m` marches **with** the chariot followed by `66 − m` **without** it — which is what a player would do.

the plan's finale fields 37 chariots; each of the 66 repeats reaches the field without one. Table: `m` marches with `c` chariots, then `66 − m` without, then the same finale with the chariots the repeats burned removed.

| c chariots | m marches with | chariots left for the finale | phase-A damage each | phase-B damage each | A−B each | phase A total | finale damage | **campaign total** | vs the plan |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 37 | 0 | 2,376,524 | 2,287,262 | +89,262 | 87,931,388 | 2,221,749 | **156,483,735** | +2,101,761 |
| 2 | 36 | 1 | 2,465,786 | 2,287,262 | +178,524 | 88,768,296 | 2,281,257 | **159,667,413** | +5,285,439 |
| 4 | 34 | 3 | 2,644,310 | 2,287,262 | +357,048 | 89,906,540 | 2,400,273 | **165,499,197** | +11,117,223 |
| 7 | 31 | 6 | 2,855,818 | 2,287,262 | +568,556 | 88,530,358 | 2,500,308 | **171,084,836** | +16,702,862 |
| 10 | 28 | 9 | 3,034,342 | 2,287,262 | +747,080 | 84,961,576 | 2,589,570 | **174,467,102** | +20,085,128 |
| 15 | 12 | 13 | 2,901,800 | 2,287,262 | +614,538 | 34,821,600 | 2,708,586 | **161,042,334** | +6,660,360 |
| 20 | 9 | 19 | 2,976,185 | 2,287,262 | +688,923 | 26,785,665 | 2,887,110 | **160,046,709** | +5,664,735 |
| 26 | 4 | 25 | 3,065,447 | 2,287,262 | +778,185 | 12,261,788 | 3,065,634 | **157,137,666** | +2,755,692 |
| 37 | 1 | 33 | 3,229,094 | 2,287,262 | +941,832 | 3,229,094 | 3,303,666 | **155,204,790** | +822,816 |

The same 66 repeats scored the uniform way (the plan's own shape): **154,381,974** damage in-game simulation. The best two-phase campaign above is **174,467,102** (c = 10, m = 28): **+20,085,128** damage, 13.01 %.

**But read this table for what it is**: it is *my* composition of two engine-priced marches, not a shape `planCampaign` can score — the engine scores `m` repeats **plus one finale**, never `m` repeats followed by `66 − m` different ones. Section 4b shows what the engine does say about a chariot in the repeat, and it says *no*: the run cannot be long enough. And the two-phase campaign is **66 marches, 308 days of training** — it is not a plan the owner would ever run either (section 6). The two claims are both true and they are about different things: the engine is right about its own shape, and the shape is not what a player does.

## 4b. The same question asked in the engine's own arithmetic (`shapeScorer`)

The table above is the real simulation with the plan's ladder held fixed. This one hands each candidate count vector to the planner's own scorer — which rebuilds the ladder for the vector's own floor, picks the best of the 80 ladders, and prices the finale from the stock the repeats burn — and takes the best over every march count the stock allows. Columns: the best `total` the engine finds for that shape.

the plan's own shape through this route: 147,671,161 damage (the planner reports 154,214,995; the small gap is the finale-cache and rounding) at depth 7, scale 1.5.

| chariot | marches the stock allows | best `total` the engine finds | vs the plan | at marches |
|---|---|---|---|---|
| 1 | 37 | **88,070,913** | -66,144,082 | 37 |
| 4 | 34 | **90,768,205** | -63,446,790 | 34 |
| 7 | 31 | **85,530,149** | -68,684,846 | 31 |
| 10 | 28 | **81,311,696** | -72,903,299 | 28 |
| 20 | 9 | **30,115,999** | -124,098,996 | 9 |
| 37 | 1 | **9,992,864** | -144,222,131 | 1 |

**Read against the same route's own figure for the plan**, not against `full.totalDamage`: this sweep walks the 80-ladder grid and nothing else, where the planner also hill-climbs the scale, so its own score for the plan's counts is the lower 147,671,161. Grid against grid, **every chariot-inclusive shape loses, and loses hugely** — the best of them is c = 4 over 34 marches at 90,768,205, against 147,671,161 for the plan's own counts: **-56,902,956**. And the march count is the whole of it: the chariot raises the *per-march* damage the engine finds (2,545,161 against 2,188,113, because a higher mercenary floor buys a bigger ladder — section 4c), but 34 repeats of it is less than 66 of the plan's, and the plan's repeats are what the total is made of.

So far, strictly inside what the engine can represent, the omission is **right**: with the chariot in the repeat the run cannot be long, and length is worth more than the chariot. Section 4 asks the different question the engine cannot: what if only *part* of the run fielded it.

## 4c. The second mechanism: the mercenary floor rises to clear the new stack (`ladder`'s `mercenaryHp`)

`ladder()` puts the lowest troop rung a quarter above **the largest mercenary stack the vector fields** (`mercenaryHp`), so adding a chariot stack raises the floor the ladder has to clear — and the leadership is already fully spent by the plan's own ladder. The engine's best ladder per chariot count:

| chariot | best ladder | rungs | rung counts | leadership used | march damage | finale damage | marches |
|---|---|---|---|---|---|---|---|
| 0 | depth 7, scale 1.5 | 7 | 849×spearman 463×spearman 408×rider 800×archer 218×rider 427×archer 118×rider | 4,027/4,343 | 2,188,113 | 3,255,703 | 66 |
| 1 | depth 7, scale 1.5 | 7 | 849×spearman 463×spearman 408×rider 800×archer 218×rider 427×archer 118×rider | 4,027/4,343 | 2,277,375 | 3,808,038 | 37 |
| 4 | depth 7, scale 1.5 | 7 | 849×spearman 463×spearman 408×rider 800×archer 218×rider 427×archer 118×rider | 4,027/4,343 | 2,545,161 | 4,232,731 | 34 |
| 7 | depth 6, scale 1.5 | 6 | 611×spearman 539×rider 1,057×archer 288×rider 564×archer 155×rider | 4,196/4,343 | 2,627,695 | 4,071,604 | 31 |
| 10 | depth 6, scale 1 | 6 | 582×spearman 514×rider 1,006×archer 274×rider 537×archer 148×rider | 3,997/4,343 | 2,744,826 | 4,456,568 | 28 |
| 20 | depth 3, scale 1.5 | 3 | 823×rider 1,612×archer 445×rider | 4,148/4,343 | 2,713,954 | 5,690,413 | 9 |
| 37 | depth 2, scale 1.25 | 2 | 2,485×archer 686×rider | 3,857/4,343 | 2,986,263 | 7,006,601 | 1 |

The chariot does not only shorten the run (section 4b): once its stack outgrows the mercenary floor it also **moves the ladder**, because `mercenaryHp` is the largest stack the vector fields. The plan's own ladder (depth 7, 4,027 of 4,343 leadership) is built for the 157,730-HP mercenary stack; 1 and 4 chariots (29,754 and 119,016 HP) stay under it and the ladder is unchanged, but 7 chariots (208,278 HP) pass it and the engine switches to a depth-6 ladder, 10 chariots to depth 6 at scale 1. Note the direction: the *per-march* damage goes **up** (a higher floor buys bigger rungs), which is why the chariot's cost is entirely the run's length. The battle confirms the rule rather than contradicting it: the plan's own ladder's **highest** troop rung is 358,680 HP, and a 10-chariot stack (297,540) is under every rung — eight kill positions down, two strikes. At 12 chariots (357,048) it clears all but one rung and is killed second, one strike; at 15 (446,310) it is the biggest stack on the field and never strikes enemy-first at all. That is exactly what `mercenaryHp` is protecting against.

## 5. With a silver budget (the app passes the campaign box through)

| budget | marches | damage | silver | mercs lost | mercs | at 0 |
|---|---|---|---|---|---|---|
| 8,000,000 | 29 | 38,765,806 | 7,984,700 | 205 | epic-monster-hunter 20 · arbalester 20 · legionary 18 · chariot 10 | — |
| 3,000,000 | 6 | 17,851,572 | 2,990,400 | 108 | epic-monster-hunter 45 · arbalester 48 · legionary 47 · chariot 22 | — |

The plan with a budget returns no `recommend` (the app then takes `plan` itself), and **the chariot is fielded at both budgets**: the omission is not a property of the search, it is a property of the unbudgeted plan's *length*. A budget caps the run at 29 and 6 marches — lengths the chariot's 37-unit stock covers — while the unbudgeted plan stretches to 66 repeats, which no chariot count can cover (section 2).

## 6. The alternatives the engine carries, and which of them are choices

| label | marches | damage a march | % of the best march | silver a march | mercs lost a march | troop stacks | merc types | damage/silver | damage/mercenary | training, whole run | verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 2 stacks · 158 hired · 2.1M silver a march | 2 | 3,968,651 | 80 % | 2,142,800 | 18 | 2 | 4 | 2.45 | 228,171 | 23 d | **practical** |
| 2 stacks · 143 hired · 2.1M silver a march | 3 | 4,324,788 | 87 % | 2,096,200 | 17 | 2 | 4 | 2.31 | 250,891 | 34 d | **practical** |
| 3 stacks · 100 hired · 2.3M silver a march | 4 | 3,942,282 | 79 % | 2,252,000 | 11 | 3 | 4 | 2.03 | 307,705 | 44 d | **practical** |
| 3 stacks · 145 hired · 2M silver a march | 6 | 4,967,978 | 100 % | 1,954,900 | 17 | 3 | 4 | 2.53 | 283,415 | 58 d | **practical** |
| 3 stacks · 90 hired · 2.3M silver a march | 6 | 3,886,299 | 78 % | 2,345,700 | 10 | 3 | 3 | 1.79 | 337,807 | 69 d | **practical** |
| 3 stacks · 141 hired · 2.2M silver a march | 8 | 4,793,778 | 96 % | 2,228,500 | 15 | 3 | 4 | 2.20 | 315,768 | 88 d | **practical** |
| 4 stacks · 61 hired · 1.6M silver a march | 13 | 2,921,026 | 59 % | 1,577,800 | 8 | 4 | 4 | 1.88 | 345,213 | 76 d | **practical** |
| 5 stacks · 70 hired · 1.7M silver a march | 14 | 3,552,631 | 72 % | 1,702,100 | 9 | 5 | 4 | 2.08 | 373,597 | 71 d | **practical** |
| 3 stacks · 20 hired · 2.3M silver a march | 14 | 2,039,069 | 41 % | 2,342,200 | 3 | 3 | 2 | 0.98 | 489,560 | 162 d | curiosity — march at 41 % of the best; 162 d of training |
| 5 stacks · 58 hired · 1.7M silver a march | 25 | 3,145,398 | 63 % | 1,657,200 | 7 | 5 | 4 | 1.89 | 441,269 | 123 d | curiosity — 123 d of training |
| 7 stacks · 35 hired · 1.6M silver a march | 35 | 2,684,769 | 54 % | 1,567,700 | 5 | 7 | 4 | 1.71 | 517,438 | 152 d | curiosity — 152 d of training |
| 7 stacks · 29 hired · 986.5K silver a march | 64 | 1,827,330 | 37 % | 986,500 | 3 | 7 | 3 | 1.84 | 595,701 | 175 d | curiosity — march at 37 % of the best; 175 d of training |
| 7 stacks · 27 hired · 1.7M silver a march | 67 | 2,287,262 | 46 % | 1,688,900 | 3 | 7 | 3 | 1.36 | 745,000 | 313 d | curiosity — march at 46 % of the best; 313 d of training |

**8 of the 13 rows the engine carries are practical** under the stated criteria (a march of more than one troop stack, per-march damage at least 50 % of the best march in the list, and a whole run that finishes inside 90 days of training): 2 stacks · 158 hired · 2.1M silver a march · 2 stacks · 143 hired · 2.1M silver a march · 3 stacks · 100 hired · 2.3M silver a march · 3 stacks · 145 hired · 2M silver a march · 3 stacks · 90 hired · 2.3M silver a march · 3 stacks · 141 hired · 2.2M silver a march · 4 stacks · 61 hired · 1.6M silver a march · 5 stacks · 70 hired · 1.7M silver a march.
The rows the owner's "I would never choose this" lands on are the others: `3 stacks · 20 hired · 2.3M silver a march`, `5 stacks · 58 hired · 1.7M silver a march`, `7 stacks · 35 hired · 1.6M silver a march`, `7 stacks · 29 hired · 986.5K silver a march`, `7 stacks · 27 hired · 1.7M silver a march`.

## 7. A stopped set for the slider

| # | point | marches | damage (the plan's own total, finale in) | silver | mercs lost | damage a march | practical? |
|---|---|---|---|---|---|---|---|
| 1 | the cheapest practical plan — `2 stacks · 158 hired · 2.1M silver a march` | 2 | 10,495,873 | 4,288,500 | 36 | 3,968,651 | yes |
| 2 | the sweet spot (`recommend`) — `7 stacks · 29 hired · 986.5K silver a march` | 64 | 118,544,472 | 64,352,400 | 192 | 1,827,330 | no — see section 6 |
| 3 | its neighbour above (by silver) — `7 stacks · 35 hired · 1.6M silver a march` | 35 | 94,691,209 | 55,276,300 | 175 | 2,684,769 | no — see section 6 |
| 4 | its neighbour below (by silver) — `5 stacks · 58 hired · 1.7M silver a march` | 25 | 79,428,422 | 42,024,800 | 175 | 3,145,398 | no — see section 6 |
| 5 | the richest practical plan the list carries — `5 stacks · 70 hired · 1.7M silver a march` | 14 | 50,435,646 | 24,210,900 | 126 | 3,552,631 | yes |

The sweet spot (`recommend` = `balanced`) is **undominated** among the rows the plan carries. Its label is `7 stacks · 29 hired · 986.5K silver a march` — 64 marches, 118,544,472 damage, 64,352,400 silver, 199 mercenaries.

**And it fails the horizon test itself**: 175 days of training (section 6). So on this account the engine's own balanced pick is one of the curiosities by the same criterion that condemns the rest of the long tail — which is the owner's complaint arriving from the other side: a slider whose marked point is a plan he would never run is not a slider. The two ends that *are* practical (rows 1 and 5, 2 and 17 marches) sit at 4,288,500 and 29,468,500 silver, i.e. **the whole practical range is the first third of the silver axis**, and the sweet spot sits at 64,352,400, past the end of it.

Note what the neighbour rows above show: the two rows nearest the sweet spot *by silver* are 9,076 k and 22,328 k away from it, i.e. **the frontier next to the sweet spot is not in the list at all** — it was thinned out (and two of the three rows the search actually settled on are between them, added back by hand). A slider drawn on this list jumps.

The `curve` is the other axis the plan carries, one point per silver bucket. Around the sweet spot:
| curve point | silver | damage | damage/silver | mercs lost | thrifty damage |
|---|---|---|---|---|---|
| just below the sweet spot | 52,167,200 | 104,367,445 | 2.00 | 219 | 57,238,099 |
| just above it | 68,869,500 | 120,851,595 | 1.75 | 199 | 56,223,547 |

The curve is a *silver* axis and the sweet spot sits at 64,352,400 silver; the bucket either side of it is inside 7 % of that spend, so a slider drawn on `curve` has real neighbouring values where `alternatives` has a gap. Both carry *different quantities of marches* at the same time, though — the curve's damage is the plan's total, and its 104,367,445 at 52,167,200 silver and 120,851,595 at 68,869,500 are two different campaign lengths, so the axis a slider should show is silver *and* marches, not silver alone.

Two different complaints, two different fixes, and neither is a bug in the arithmetic:

- **the left-out mercenary**: inside the shape the engine can score, the omission is **right** — grid against grid the best chariot-inclusive shape loses by 56,902,956 (section 4b), because `marchesFor` is a minimum over the fielded types and the run's length is worth more than the chariot. What the engine cannot score is a **lead-in phase** (`m` marches with the chariot, then the rest without it), worth 20,085,128 (`13.01 %`) if the leading marches keep the plan's own ladder (section 4) — but that campaign is 66 marches and 308 days of training, so it is not the answer to the owner's complaint either. **The omission only appears on the plan whose length is impractical**: at a 3 M or 8 M silver budget the plan fields 22 and 10 chariots (section 5), and every frontier row of 2 to 16 marches fields all four hired types (section 6). No fix to `plan.ts` is warranted for it;
- **the slider's curiosities** (sections 6, 7) are the *thinning* in `planCampaign`: `alternatives` is an even sample of the undominated frontier, and the frontier itself contains one-stack marches and century-long runs. That is a few lines in `plan.ts` (pick the practical extremes and the sweet spot's neighbours instead of evenly sampling), but it needs a definition of "practical" the engine should not invent on its own — the criteria above are the proposal, and they belong beside `summarise` so the UI's slider and the engine agree.

Nothing in `src/` was changed by this experiment.
