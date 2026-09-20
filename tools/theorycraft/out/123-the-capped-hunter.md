
## A. The reconstruction against his own screen


Every figure below is read off the run; the "he pasted" column is his message of 2026-09-20. The march is the **Steady max** stop, which is the row he picked.

| # | stack | units | total HP measured | he pasted | same |
|---|---|---|---|---|---|
| 1 | RD1 | 850 | 419,900 | 419,900 | yes |
| 2 | RD3 | 260 | 410,540 | 410,540 | yes |
| 3 | ARC2 | 909 | 403,596 | 403,596 | yes |
| 4 | RD2 | 445 | 395,160 | 395,160 | yes |
| 5 | ARC1 | 1,571 | 388,037 | 388,037 | yes |
| 6 | ED | 23 | 310,500 | 310,500 | yes |
| 7 | BB | 26 | 308,776 | 308,776 | yes |
| 8 | WE | 53 | 306,658 | 306,658 | yes |
| 9 | SG | 19 | 296,400 | 296,400 | yes |
| 10 | EMH6 | 21 | 208,467 | 208,467 | yes |

| reading | measured | he pasted |
|---|---|---|
| expected damage | 5,928,282 | 5,928,282 |
| worst opening | 5,763,382 | 5,763,382 |
| silver | 2,449,200 | 2,449,200 |
| gold | 9,024 | 9,024 |
| dragon coins | 2,920 | 2,920 |
| time to recover | 8d 6h | 8d 6h |
| hired lost | 3 | 3 |
| leadership used | 5,590 of 5,600 | 5,590 of 5,600 |
| authority used | 21 of 2,180 | 21 of 2,180 |
| dominance used | 628 of 800 | 628 of 800 |
| campaign damage | 22,582,807 | 22,582,807 |
| campaign silver | 9,717,200 | 9,717,200 |
| campaign marches | 4 | 4 |
| sweet · worst opening | 5,698,946 | 5,698,946 (he read 5.7M) |
| sweet · silver | 2,499,000 | 2,499,000 (he read 2.5M) |
| sweet · time | 8d 17h | 8d 17h |
| sweet · dragon coins | 2,520 | 2,520 |
| sweet · hired lost | 2 | 2 |
| sweet · per silver | 2.280 | 2.280 |
| sweet · per hired | 482,450 | 482,450 |
| steady · per silver | 2.353 | 2.353 |
| steady · per hired | 397,312 | 397,312 |
| the bar’s rows | sweet-spot · steady-max | sweet-spot · steady-max |

**Every stack matches to the unit and every figure on his screen is reproduced.** The diagnosis below is on his army and not on a lookalike.

## B. The four ceilings on the hunter, and which one is 21


| ceiling | units | how it is computed |
|---|---|---|
| his stock | **27** | the cap he typed on the mercenary card |
| his authority housing | **2,180** | `floor(2,180 / 1)` — the pool, at a cost of 1 a unit |
| the shelter (`shelterUnder`) | **39** | `ceil(388,037 / 9,927) − 1` — the most that still stands strictly under Archer I |
| **the horizon (`largestSustained`)** | **21** | `largestSustained(27, 3)` — the most a stock of 27 can field on **each** of the 3 repeats this stop plays |

The march fields **21**. The binding ceiling is the smallest of the four: ****the horizon (`largestSustained`)****.

**Why 21 and not 22.** A fielded stack of `c` loses `chunks(c) = ceil(c/10)` units for good every march, and the count has to still be there to field on the last repeat — so a stock of 27 fielding `c` lasts `floor((27 − c) / chunks(c)) + 1` marches. The stop repeats its march 3 times (a four-march horizon is 3 repeats and a finale, `planRepeats`):

| hunters a march | chunks burned | marches the stock lasts | enough for the 3 repeats |
|---|---|---|---|
| 27 | 3 | 1 | no |
| 26 | 3 | 1 | no |
| 25 | 3 | 1 | no |
| 24 | 3 | 2 | no |
| 23 | 3 | 2 | no |
| 22 | 3 | 2 | no |
| 21 **(fielded)** | 3 | 3 | **yes** |
| 20 | 2 | 4 | **yes** |
| 19 | 2 | 5 | **yes** |
| 18 | 2 | 5 | **yes** |

And the campaign it buys, which is the line at the foot of his screen: **3 repeats of 21 hunters burning 3 chunks each, then a finale on what is left** — 9 + 2 = **11 of the 27 gone**, against his *"11 of the hired stock gone"*.

At a horizon of four **marches** rather than three repeats the same rule gives `largestSustained(27, 4)` = **20**, and at one march it gives **27** — the whole stock. The horizon is the lever; the shelter, at 39, never comes near.

**The same army at every horizon.** `CAMPAIGN.marches` (`src/config.ts`) is **4**; nothing else changes between these runs.

| horizon | repeats | hunters a march | rows the bar carries | damage a march | campaign damage |
|---|---|---|---|---|---|
| 1 | 1 | **27** | sweet-spot · steady-max · all-in | 5,484,374 | 5,484,374 |
| 2 | 1 | **27** | sweet-spot · steady-max | 6,103,933 | 11,737,145 |
| 3 | 2 | **24** | sweet-spot · steady-max | 5,933,656 | 17,330,250 |
| 4 **(his)** | 3 | **21** | sweet-spot · steady-max | 5,763,382 | 22,582,807 |
| 5 | 4 | **20** | sweet-spot | 5,706,622 | 28,175,906 |
| 6 | 5 | **19** | sweet-spot | 5,649,862 | 33,485,211 |

## C. The three missing stops, one rule at a time


### More mercs

It is *"the rung of the ladder nearest the middle of the gap between the sweet spot and the top, strictly inside it"*, and it is refused outright when the gap is smaller than two chunks. Measured: the sweet spot burns **2** and the steady max burns **3**, a gap of **1** — so there is no rung strictly between them and the stop is never built.

**The bar's whole axis is `chunks(hunters)`, and on this account it has three values.** The burn counts authority units only (S-102: a monster is trained, not spent), so it is `ceil(hunters / 10)`, and the hunter is capped at 21 by §B:

| hunters a march | 1–10 | 11–20 | 21 |
|---|---|---|---|
| chunks burned | 1 | 2 | 3 |

A bar of five stops is being drawn on an axis with **three points on it**, two of which the sweet spot and the steady max already occupy.

### Silver saver

It is the cheapest plan of the **band** that stands left of the sweet spot — fewer chunks burned — while costing no more silver **and** returning at least the sweet spot's damage a silver. The sweet spot burns 2, so "left of it" means a plan burning **1** chunk: ten hunters or fewer.

The search priced **3,770** plans, of which **547** are inside the band. Of those, **262** burn fewer chunks than the sweet spot, and **0** clear all three of the rule's tests.

| plan | hunters | chunks | silver a march | damage a march | per silver | ≤ sweet’s silver | ≥ sweet’s rate |
|---|---|---|---|---|---|---|---|
| 7 stacks · 59 hired · 1.5M silver a march | 9 | 1 | 1,474,000 | 3,322,289 | 2.254 | yes | **no** |
| 7 stacks · 67 hired · 1.7M silver a march | 10 | 1 | 1,680,400 | 3,754,226 | 2.234 | yes | **no** |
| 4 stacks · 119 hired · 2M silver a march | 9 | 1 | 1,965,500 | 3,810,922 | 1.939 | yes | **no** |
| 4 stacks · 122 hired · 2M silver a march | 9 | 1 | 1,982,300 | 3,864,872 | 1.950 | yes | **no** |
| 4 stacks · 132 hired · 2M silver a march | 9 | 1 | 2,004,700 | 4,296,472 | 2.143 | yes | **no** |
| 7 stacks · 80 hired · 2.3M silver a march | 10 | 1 | 2,294,000 | 4,435,523 | 1.934 | yes | **no** |
| 7 stacks · 116 hired · 2.4M silver a march | 9 | 1 | 2,369,600 | 4,781,830 | 2.018 | yes | **no** |
| 7 stacks · 116 hired · 2.4M silver a march | 9 | 1 | 2,369,600 | 4,781,830 | 2.018 | yes | **no** |
| 7 stacks · 116 hired · 2.4M silver a march | 9 | 1 | 2,369,600 | 4,781,830 | 2.018 | yes | **no** |
| 7 stacks · 116 hired · 2.4M silver a march | 9 | 1 | 2,369,600 | 4,781,830 | 2.018 | yes | **no** |
| 7 stacks · 116 hired · 2.4M silver a march | 9 | 1 | 2,369,600 | 4,781,830 | 2.018 | yes | **no** |
| 7 stacks · 116 hired · 2.4M silver a march | 9 | 1 | 2,369,600 | 4,781,830 | 2.018 | yes | **no** |

The sweet spot's own bar is **2,499,000** silver at **2.280** a silver.

**Which of the three tests actually refuses them.** Of the 262 cheaper plans, **262** cost no more silver than the sweet spot — so the silver test refuses almost none of them — while **0** return at least its 2.280 a silver. The best rate anywhere left of the sweet spot is **2.254** (9 hunters, 1,474,000 silver), and the cheapest march of all returns 2.254.

**And the efficiency test is the one that refuses them.** A hunter costs no silver to retrain — it is gone for good, and the silver column is the *troops* it stands behind. §D holds the troops of this march still and moves only the hunter: the silver does not move at all while the damage climbs, so damage a silver rises monotonically with the hunter count. On an account whose only hired stock is a mercenary, spending fewer of them is always a **worse** rate, and a stop defined as *cheaper and at least as efficient a silver* has nothing it can be.

### All in

It is offered *only* when its first march fields **more hired units** than the steady max's repeat, and "hired units" counts the **monsters as well as the hunters** (`filledOf`, over every non-leadership pool). The steady max's side of that comparison is therefore:

| pool | stacks | units |
|---|---|---|
| authority | epic-monster-hunter-6 | 21 |
| dominance | BB, ED, SG, WE | 121 |
| **total** | | **142** |

**The stop exists, and its first march fields everything.** At a horizon of **1** the same army carries it, and this is the march it offers: **27 hunters** — the whole stock — behind 154 monster units, **181 hired units in all**, for 5,484,374 worst-opening at 2,498,200 silver and 3,600 dragon coins.

| stack | the all-in’s first march | the Steady max he was shown |
|---|---|---|
| ARC1 | 1,640 | 1,571 |
| ARC2 | 909 | 909 |
| RD1 | 0 | 850 |
| RD2 | 453 | 445 |
| RD3 | 254 | 260 |
| SP1 | 1,637 | 0 |
| BB | 33 | 26 |
| ED | 28 | 23 |
| SG | 25 | 19 |
| WE | 68 | 53 |
| EMH6 | 27 | 21 |

**So the offer rule passes at his horizon too**: `filledOf` compares **181** against **142**. (`filledOf` counts only the types above the S-99 hired cut, and that cut is **inert on this army** — measured below: the bar is identical with `refuseDroppedTypes` off, which is the flag that switches the cut on.) The row is therefore **offered and then removed**, and there is exactly one rule between the offer and the payload that removes a row outright: S-94's *"the all-in is not offered when a stop beside it beats it outright"*.

**The predicate, on his own bar.** Rebuilt, the all-in plays 27 · 24 · 21 · 18 hunters over four marches: about **20,915,840** damage, about **9,992,800** silver, and **11** chunks of the 27 burned. Against the sweet spot the bar does carry:

| arm of the rule | the sweet spot | the all-in | fires |
|---|---|---|---|
| damage (needs ≥) | 22,559,776 | 20,915,840 | **yes** |
| silver (needs ≤) | 9,866,600 | 9,992,800 | **yes** |
| chunks burned (needs **<**) | 9 | 11 | **yes** |

All three arms hold, and the row goes. **The control is the horizon-1 run**, where the all-in burns 3 chunks and the dearest rung beside it burns 3 — nothing burns **strictly** fewer, the rule cannot fire, and the row survives. That is the whole difference between the two runs.

**What that means for his complaint.** The bar drops the one stop that fields his whole stock because it *costs more silver for less damage over four marches* — which is true, and which is not the question he was asking. He wanted the row that spends the mercenaries; the rule that removed it is a rule about campaign efficiency, and it was written (S-94) to stop the all-in being a strictly worse plan. On this army it removes the only offer the stop exists to make.

**A second thing the same stop gets wrong, which shows when the sizer shapes are off.** The all-in's share walk starts from every hired type's stock — a capped mercenary at its cap, an **uncapped** type at what its own pool would house — and scales them all by **one common share**, 100 %, 95 %, 90 %…, taking the first share at which some shape is both housed (`fitsHousing`) and sheltered. His four monster types are uncapped, so each of them reads the **whole** dominance pool:

| type | cost | its own stock for the walk | dominance that asks for |
|---|---|---|---|
| BB | 6 | 133 | 798 |
| ED | 7 | 114 | 798 |
| SG | 8 | 100 | 800 |
| WE | 3 | 266 | 798 |
| **together** | | | **3,194** |

His camp houses **800**, so the walk's vector at share *s* asks for about `3,194 × s` dominance and **no share above 25 % can be housed at all** — while the same share is applied to the hunter, whose 27 becomes:

| share | dominance the vector asks for | housed | hunters it fields | hired units in all |
|---|---|---|---|---|
| 100 % | 3,194 | **no** | 27 | 640 |
| 50 % | 1,594 | **no** | 13 | 319 |
| 35 % | 1,108 | **no** | 9 | 222 |
| 30 % | 949 | **no** | 8 | 190 |
| 25 % | 792 | yes | 6 | 158 |
| 20 % | 629 | yes | 5 | 126 |
| 15 % | 470 | yes | 4 | 94 |
| 10 % | 313 | yes | 2 | 62 |

The sizer shapes rescue the walk from that (`sizeStacks` fills a pool and stops, so it answers at the full share), which is why the row above fields 27 and not six. **Switch the sizer family off and the walk is all that is left**, and the stop lands exactly where the arithmetic says:

| the plan with | rows | hunters the All in fields | hired units on it |
|---|---|---|---|
| every flag as shipped | sweet-spot · steady-max | the row is not there | — |
| `refuseDroppedTypes` off (the S-99 cut) | sweet-spot · steady-max | the row is not there | — |
| `tokenFloor` off | sweet-spot · steady-max | the row is not there | — |
| **`sizerShape` off** | all-in · sweet-spot | **6** | 157 |
| no put-back pass | sweet-spot · steady-max | the row is not there | — |

With the sizer off the All in is back on the bar — fielding **six** hunters of his 27, which is `floor(27 × 0.25)` to the unit. Two of the five rows of this bar are decided by a walk that scales a mercenary stock by a monster pool.

**The same account with the monster camp off** — everything else untouched:

| stop | hunters | chunks | damage a march | silver a march | campaign damage |
|---|---|---|---|---|---|
| sweet-spot | **20** | 2 | 2,583,622 | 2,169,700 | 10,289,828 |
| steady-max | **21** | 3 | 2,621,462 | 2,169,700 | 10,195,977 |
| all-in | **27** | 3 | 2,811,249 | 2,322,600 | 10,675,633 |

Rows: **sweet-spot · steady-max · all-in** — against **sweet-spot · steady-max** with the camp on. Take the monsters away and the stop that fields all 27 is offered, and survives.

**Where the All in comes back.** Two sweeps, each moving one thing. His account is the first line of each.

| dominance housed | over-subscribed by | rows | hunters on the dearest stop | hired units on it |
|---|---|---|---|---|
| 800 **(his)** | 4.0× | sweet-spot · steady-max | **21** | 142 |
| 900 | 3.5× | sweet-spot · steady-max · all-in | **27** | 200 |
| 1,000 | 3.2× | silver-saver · sweet-spot | **20** | 210 |
| 1,100 | 2.9× | sweet-spot · steady-max | **21** | 234 |
| 1,200 | 2.7× | sweet-spot · all-in · steady-max | **21** | 253 |
| 1,600 | 2.0× | sweet-spot · all-in | **27** | 335 |
| 2,400 | 1.3× | silver-saver · sweet-spot · all-in | **27** | 489 |
| 3,200 | 1.0× | sweet-spot · all-in | **27** | 644 |

| hunter stock | rows | hunters on the dearest stop | hired units on it |
|---|---|---|---|
| 27 **(his)** | sweet-spot · steady-max | **21** | 142 |
| 40 | sweet-spot · steady-max | **32** | 166 |
| 64 | sweet-spot · steady-max · all-in | **64** | 218 |
| 100 | sweet-spot · more-mercs · steady-max | **60** | 208 |
| 200 | sweet-spot · more-mercs · steady-max · all-in | **160** | 314 |

## D. What each hunter count is actually worth, on this march and over his campaign


The march's troops and monsters are held exactly as the Steady max fields them; only the hunter moves. His stock is 27, so rows past it are what the **shelter** would have allowed (up to 39) and the stock does not.

| hunters | worst opening | silver | chunks a march | marches the stock lasts | 4-march campaign | chunks spent |
|---|---|---|---|---|---|---|
| 0  | 4,571,446 | 2,121,600 | 0 | ∞ | 18,285,784 | 0 |
| 3  | 4,741,723 | 2,449,200 | 1 | 25 | 18,966,892 | 4 |
| 6  | 4,912,000 | 2,449,200 | 1 | 22 | 19,648,000 | 4 |
| 9  | 5,082,274 | 2,449,200 | 1 | 19 | 20,329,096 | 4 |
| 12  | 5,252,551 | 2,449,200 | 2 | 8 | 21,010,204 | 8 |
| 15  | 5,422,828 | 2,449,200 | 2 | 7 | 21,691,312 | 8 |
| 18  | 5,593,105 | 2,449,200 | 2 | 5 | 22,372,420 | 8 |
| 21 **(the plan)** | 5,763,382 | 2,449,200 | 3 | 3 | 22,883,251 | 11 |
| 24  | 5,933,656 | 2,449,200 | 3 | 2 | 23,223,799 | 11 |
| 27  | 6,103,933 | 2,449,200 | 3 | 1 | 23,394,076 | 11 |
| 30 *(past his stock)* | 6,116,642 | 2,449,200 | 3 | — | — | — |
| 33 *(past his stock)* | 5,605,813 | 2,449,200 | 4 | — | — | — |
| 36 *(past his stock)* | 5,662,572 | 2,449,200 | 4 | — | — | — |
| 39 *(past his stock)* | 6,457,194 | 2,449,200 | 4 | — | — | — |

**The single march peaks at 27 hunters** (6,103,933 worst-opening) and the plan fields 21 for 5,763,382 — a gap of **5.91 %** on the one march.

**The four-march campaign peaks at 27 hunters** (23,394,076) against the plan's 22,883,251 at 21 — **2.23 %**.

**And the two campaigns spend exactly the same stock.** `chunks(27)` and `chunks(21)` are both **3**, so the descending campaign 27 · 24 · 21 · 18 burns 11 chunks of the 27 and the flat one 21 · 21 · 21 · 18 burns 11 — the same **11** the foot of his screen reports, for the same 9,796,800 silver. The horizon cap is buying **nothing** here: it gives up 510,825 damage and saves neither a chunk of stock nor a piece of silver.

And the campaign the engine actually planned — three repeats and a re-sized finale — is **22,582,807**, which is **below** the flat model's 22,883,251: its finale is worth 5,292,661, where simply repeating the march with the 18 hunters the stock has left is worth 5,593,105. That is a second, smaller finding, and it is not what this experiment is about.

**The one-march answer.** If he means to spend the stock on a single march — an epic-event opener — the best he can field is the whole 27 (the shelter allows 39), worth **6,103,933** worst-opening against the plan's **5,763,382**: **+5.91 %** for one march, burning the same 3 chunks the plan already burns.

## E. The take-out: the plan’s stop against the S-107 re-size


The pane's own caps for this stop (`src/ui/sections/march/generate.ts`, `capOf`): the hunter at `largestSustained(27, 3)` = **21**, each monster at its own pool.

| stack | the plan’s Steady max | the re-size with SP I / SP II out |
|---|---|---|
| RD1 | 850 | 818 **←** |
| RD3 | 260 | 254 **←** |
| ARC2 | 909 | 909 |
| RD2 | 445 | 453 **←** |
| ARC1 | 1,571 | 1,641 **←** |
| BB | 26 | 33 **←** |
| ED | 23 | 28 **←** |
| SG | 19 | 25 **←** |
| WE | 53 | 68 **←** |
| EMH6 | 21 | 21 |

Damage: **5,763,382** against **5,143,823**; silver **2,449,200** against **2,498,200**.

**The hunter is 21 on both, and everything else moves.** §A settled which of the two he was looking at: his screen reads 5,763,382 worst-opening and 2,449,200 silver, which is the **plan's own stop** to the unit, so the march he complained about never went through the re-size — SP I and SP II are types the search left out, not types he took out. The re-size is therefore **not** what caps the hunter: it caps it at exactly the same `largestSustained(27, 3)` = 21.

But it is worth saying out loud what the re-size *does* do, because it is a defect of its own: pressing any pill on this stop re-derives the march at **5,143,823** against the plan's **5,763,382** — **-10.7 %** — for **more** silver. The cause is visible in the table: the monsters are capped at their **own pool** in the re-size (S-102, *"a monster is trained, not spent"*), so the sizer fills the dominance pool from 628 to 798 of the 800, and the leadership it has to leave over for the troops falls with it.

And the shelter read back off the plan's own march (`shelterCounts`) leaves the hunter at **21**: the shelter has nothing to say about 21 either.
