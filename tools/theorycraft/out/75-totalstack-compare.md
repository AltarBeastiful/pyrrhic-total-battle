
## 1. The capture, and the two armies it can be read as

The owner's correction: `guardsmenExcludedCategories` is our `troops.topTierExcluded.guardsmen` — a **top-tier** exclusion, not a ban on the categories. His export's own allocation, read from `/home/remi/Downloads/pyrrhic-my-account-2026-09-13.json`:

| profile field | value |
|---|---|
| `troops.guardsmen` | min 1, max 3 |
| `troops.specialists` | min 1, max 1 |
| `troops.topTierExcluded.guardsmen` | melee, ranged |
| `troops.excludedUnitIds` | archer-1, spearman-1, rider-1, archer-2 |
| `mercenaries.selected` | chariot-6 37, arbalester-6 76, epic-monster-hunter-6 92, legionary-6 72 (277 held) |

**The query's own army** — the tier window with the top tier's melee/ranged removed: 8 troop types (archer-1, archer-2, rider-1, rider-2, rider-3, spearman-1, spearman-2, swordsman-1). **His real army** — the same minus `excludedUnitIds`: 4 troop types (rider-2, rider-3, spearman-2, swordsman-1). The query's `excludedTroopIds` is **empty**, so the capture is an answer about the first army and fields troops the profile does not field — every table below says which army it is about.
Their answer's own shape, measured against the window: it holds 8 troop types and **no archer-3 and no spearman-3** — exactly what a top-tier melee/ranged exclusion leaves of guardsmen 1–3, since tier 3's mounted unit (rider-3) survives. The previous run read the field as a category ban and passed all nine guardsmen through; that is the artefact this pass corrects.

## 2. The exclusion, settled by measurement


| unit set | troop types | archer-3 | spearman-3 | rider-3 | avg damage | damage / silver | their answer's types |
|---|---|---|---|---|---|---|---|
| **the query's own army** (top-tier exclusion applied) | 8 | 0 | 0 | 116 | 2,475,208 | 1.63 | **same set** |
| his real army (plus `excludedUnitIds` out) | 4 | 0 | 0 | 307 | 1,942,462 | 1.06 | theirs only archer-1, spearman-1, rider-1, archer-2; ours only — |
| the previous run's reading: every guardsmen tier 1–3 | 10 | 211 | 157 | 105 | 3,041,176 | 1.86 | theirs only —; ours only archer-3, spearman-3 |

**Only the first set carries exactly the types their answer carries** — the top-tier exclusion, measured: no archer-3, no spearman-3, rider-3 kept. The second is his real army, which cannot field four of the types their answer is made of (archer-1, spearman-1, rider-1, archer-2 are in the profile's `excludedUnitIds`, and the query did not carry them). The third is the previous run's reading, and it fields archer-3 and spearman-3, which their answer does not have: the previous headline — "we keep archer-3 and spearman-3, therefore we win" — was an artefact of that misreading.

## 3. Parity, on the query's own army

| unit | TotalStack | our sizer | Δ | our search | Δ |
|---|---|---|---|---|---|
| archer-1 | 748 | 752 | **4** | 752 | **4** |
| spearman-1 | 561 | 562 | **1** | 562 | **1** |
| rider-1 | 375 | 375 | 0 | 375 | 0 |
| archer-2 | 416 | 416 | 0 | 416 | 0 |
| spearman-2 | 311 | 310 | **-1** | 310 | **-1** |
| rider-2 | 208 | 207 | **-1** | 207 | **-1** |
| rider-3 | 116 | 116 | 0 | 116 | 0 |
| swordsman-1 | 565 | 564 | **-1** | 564 | **-1** |
| chariot-6 | 8 | 8 | 0 | 8 | 0 |
| epic-monster-hunter-6 | 14 | 14 | 0 | 14 | 0 |
| legionary-6 | 15 | 14 | **-1** | 14 | **-1** |
| arbalester-6 | 15 | 15 | 0 | 15 | 0 |

**Largest per-type disagreement 4 units** on 12 types — the ±1 parity holds on this setup too, and the capture carries counts only (no damage, no summary), so their summary formula cannot show in this fixture.

## 4. pass A — the capture's own bonuses

melee +35 % health / +70 % strength, army +3 % / +3 %, no double damage: what TotalStack answered under, and the only fair way to judge their answer.

**the query's own army (the like-for-like)** — 8 troop types (archer-1, archer-2, rider-1, rider-2, rider-3, spearman-1, spearman-2, swordsman-1) with caps bear-5 6, cyclops-5 6, arbalester-6 15, epic-monster-hunter-6 14, chariot-6 8, legionary-6 16:

| march | stacks | troops | hired | avg damage | min | max | hits E/A | silver | damage / silver | leadership | authority | **hired spent** | **% of the stock held** | legal |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

Where the damage goes, unit by unit (enemy-first, ours minus theirs), pass A — the capture's own bonuses:

| unit | theirs | ours | Δ |
|---|---|---|---|
| legionary-6 | 0 | 248,976 | +248,976 |
| rider-1 | 126,000 | 0 | -126,000 |
| archer-2 | 152,756 | 76,378 | -76,378 |
| rider-2 | 150,508 | 74,893 | -75,615 |
| spearman-2 | 64,937 | 129,456 | +64,519 |
| archer-1 | 63,580 | 0 | -63,580 |
| **our search** (`damagePerSilver`) | 12 | 3,302 | 51 | **2,475,208** | 2,447,995 | 2,502,421 | 18/19 | 1,520,800 | 1.63 | 4,000/4,000 | 59/2,000 | **7** | 2.53 % | legal |
| **our plan**'s repeated march | 11 | 3,298 | 15 | **1,129,289** | 1,100,725 | 1,157,853 | 17/18 | 1,499,500 | 0.75 | 3,985/4,000 | 15/2,000 | **3** | 1.08 % | legal |
| TotalStack's capture | 12 | 3,300 | 52 | **2,597,180** | 2,530,490 | 2,663,870 | 21/22 | 1,521,100 | 1.71 | 3,999/4,000 | 60/2,000 | **7** | 2.53 % | query army only |
| Kai's marched stack | 11 | 3,345 | 60 | **2,605,471** | 2,560,156 | 2,650,786 | 18/19 | 1,592,300 | 1.64 | 4,107/4,000 | 68/2,000 | **7** | 2.53 % | **over leadership** |

**his real army (what our app answers)** — 4 troop types (rider-2, rider-3, spearman-2, swordsman-1) with caps chariot-6 37, arbalester-6 76, epic-monster-hunter-6 92, legionary-6 72:

| march | stacks | troops | hired | avg damage | min | max | hits E/A | silver | damage / silver | leadership | authority | **hired spent** | **% of the stock held** | legal |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **our search** (`damagePerSilver`) | 6 | 4,000 | 264 | **4,791,491** | 4,667,295 | 4,915,686 | 6/7 | 1,485,200 | 3.23 | 4,000/4,000 | 301/2,000 | **28** | 10.11 % | legal |
| **our plan**'s repeated march | 6 | 2,658 | 28 | **1,278,654** | 1,141,263 | 1,416,044 | 6/7 | 2,190,800 | 0.58 | 4,000/4,000 | 28/2,000 | **3** | 1.08 % | legal |
| TotalStack's capture | 8 | 3,300 | 52 | **1,469,741** | 1,403,051 | 1,536,431 | 10/11 | 695,400 | 2.11 | 1,524/4,000 | 60/2,000 | **7** | 2.53 % | query army only |

> 4 of that march's unit types are not in this army at all (archer-1, spearman-1, rider-1, archer-2), so its row counts only the stacks the army can field — the comparison for it is pass A's query army, not this one.
| Kai's marched stack | 7 | 3,345 | 60 | **1,414,439** | 1,367,354 | 1,461,523 | 8/9 | 610,900 | 2.32 | 1,129/4,000 | 68/2,000 | **7** | 2.53 % | **over leadership** |

> 4 of that march's unit types are not in this army at all (spearman-1, rider-1, archer-1, archer-2), so its row counts only the stacks the army can field — the comparison for it is pass A's query army, not this one.

## 4. pass B — the account's current bonuses (scenario C)

guardsmen +159 % / +189 % with the category bonuses and +3 % double damage: what the app would answer under today.

**the query's own army (the like-for-like)** — 8 troop types (archer-1, archer-2, rider-1, rider-2, rider-3, spearman-1, spearman-2, swordsman-1) with caps bear-5 6, cyclops-5 6, arbalester-6 15, epic-monster-hunter-6 14, chariot-6 8, legionary-6 16:

| march | stacks | troops | hired | avg damage | min | max | hits E/A | silver | damage / silver | leadership | authority | **hired spent** | **% of the stock held** | legal |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|

Where the damage goes, unit by unit (enemy-first, ours minus theirs), pass B — the account's current bonuses (scenario C):

| unit | theirs | ours | Δ |
|---|---|---|---|
| epic-monster-hunter-6 | 510,424 | 765,636 | +255,212 |
| arbalester-6 | 456,000 | 684,000 | +228,000 |
| rider-3 | 161,843 | 346,010 | +184,167 |
| rider-2 | 145,267 | 310,090 | +164,823 |
| archer-2 | 0 | 157,349 | +157,349 |
| spearman-2 | 293,055 | 139,775 | -153,280 |
| **our search** (`damagePerSilver`) | 11 | 3,252 | 53 | **3,582,128** | 3,509,901 | 3,654,354 | 18/19 | 1,566,200 | 2.29 | 4,000/4,000 | 61/2,000 | **7** | 2.53 % | legal |
| **our plan**'s repeated march | 10 | 3,254 | 6 | **1,454,334** | 1,385,079 | 1,523,588 | 15/16 | 1,552,900 | 0.94 | 3,991/4,000 | 6/2,000 | **3** | 1.08 % | legal |
| TotalStack's capture | 12 | 3,300 | 52 | **2,962,782** | 2,889,399 | 3,036,164 | 20/21 | 1,521,100 | 1.95 | 3,999/4,000 | 60/2,000 | **7** | 2.53 % | query army only |
| Kai's marched stack | 11 | 3,345 | 60 | **3,838,310** | 3,767,986 | 3,908,634 | 18/19 | 1,592,300 | 2.41 | 4,107/4,000 | 68/2,000 | **7** | 2.53 % | **over leadership** |

**his real army (what our app answers)** — 4 troop types (rider-2, rider-3, spearman-2, swordsman-1) with caps chariot-6 37, arbalester-6 76, epic-monster-hunter-6 92, legionary-6 72:

| march | stacks | troops | hired | avg damage | min | max | hits E/A | silver | damage / silver | leadership | authority | **hired spent** | **% of the stock held** | legal |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **our search** (`damagePerSilver`) | 7 | 2,782 | 251 | **7,579,963** | 7,334,337 | 7,825,589 | 8/9 | 2,175,200 | 3.48 | 4,000/4,000 | 288/2,000 | **27** | 9.75 % | legal |
| **our plan**'s repeated march | 4 | 2,793 | 9 | **1,555,043** | 1,305,961 | 1,804,124 | 3/4 | 2,171,600 | 0.72 | 4,000/4,000 | 9/2,000 | **1** | 0.36 % | legal |
| TotalStack's capture | 8 | 3,300 | 52 | **1,641,394** | 1,568,760 | 1,714,027 | 10/11 | 695,400 | 2.36 | 1,524/4,000 | 60/2,000 | **7** | 2.53 % | query army only |

> 4 of that march's unit types are not in this army at all (archer-1, spearman-1, rider-1, archer-2), so its row counts only the stacks the army can field — the comparison for it is pass A's query army, not this one.
| Kai's marched stack | 7 | 3,345 | 60 | **1,921,490** | 1,850,660 | 1,992,319 | 8/9 | 610,900 | 3.15 | 1,129/4,000 | 68/2,000 | **7** | 2.53 % | **over leadership** |

> 4 of that march's unit types are not in this army at all (spearman-1, rider-1, archer-1, archer-2), so its row counts only the stacks the army can field — the comparison for it is pass A's query army, not this one.

## 5. What the correction changes in our own answer

| unit | the previous reading (nine guardsmen) | the corrected reading (top tier excluded) | Δ |
|---|---|---|---|
| legionary-6 | 14 | 14 | 0 |
| swordsman-1 | 512 | 564 | **52** |
| archer-1 | 683 | 752 | **69** |
| spearman-1 | 510 | 562 | **52** |
| rider-1 | 341 | 375 | **34** |
| archer-2 | 378 | 416 | **38** |
| spearman-2 | 281 | 310 | **29** |
| rider-2 | 188 | 207 | **19** |
| archer-3 | 211 | 0 | **-211** |
| spearman-3 | 157 | 0 | **-157** |
| rider-3 | 105 | 116 | **11** |
| chariot-6 | 8 | 8 | 0 |
| arbalester-6 | 15 | 15 | 0 |
| epic-monster-hunter-6 | 14 | 14 | 0 |

**8 of the counts move for a reason other than the two tier-3 types** — the two types' removal frees leadership that the rest of the march absorbs, which is why the sum of the deltas is not confined to those two rows.

## 6. The verdict, per bonus set


**pass A — the capture's own bonuses, on the query's own army (the like-for-like).** **Ours is behind**: 2,475,208 against their 2,597,180, a gap of 121,972 (4.7 %), and Kai's stack reads 2,605,471 — **the best of the three**. Hired spent a march: theirs **7** (2.53 % of the 277 held), ours **7**, Kai's **7** — we spend no more of the irreplaceable stock than they do. Friendly hits enemy-first: 18 ours, 21 theirs, 18 Kai's.

The mechanism, named, and it is one stack at a time: both marches field the same 12 stacks with the same hired counts (±1), so nothing about the army's size decides it — **our counts move stacks across the kill order's lines, and a stack that crosses one dies before striking.** Measured in the unit table above: rider-1 strikes **0** times in our march against theirs' 126,000 damage, archer-2 and rider-2 each lose a strike, and the one we gain back (legionary-6, +248,976) does not cover them — net 121,972. Their optimizer's counts put more of their stacks on the striking side of those lines, which is the whole of their advantage here.

**pass B — the account's current bonuses (scenario C), on the query's own army (the like-for-like).** **Ours is ahead**: 3,582,128 against their 2,962,782, and Kai's stack reads 3,838,310 — **the best of the three**. Hired spent a march: theirs **7** (2.53 % of the 277 held), ours **7**, Kai's **7** — we spend no more of the irreplaceable stock than they do. Friendly hits enemy-first: 18 ours, 20 theirs, 18 Kai's.

The mechanism, named, and it is the hired stacks: under these bonuses their damage per hit dwarfs the troops', so the lever is how many times they strike. Ours buys the epic monster hunter **+255,212** and the arbalester **+228,000** enemy-first damage over theirs — two extra strikes between them — and rider-2 and rider-3 add +164,823 and +184,167, while spearman-2 gives back 153,280. Fewer friendly hits in total (18 against 20), more damage: our stacks are the heavy ones.

**On his real army** the comparison changes shape rather than ranking: our search fills the account's own stock (4,791,491 damage in pass A) because only 4 troop types survive his `excludedUnitIds`, and neither their capture nor Kai's stack can be scored there at all — 4 of the rows above had unit types their army does not hold. Their capture belongs to the query's army; Kai's stack belongs to neither, being over leadership in both.

The previous run's §3–§5 conclusions, checked against the corrected mapping: **the parity section survives** (it was measured on the eight types their answer fields, which *is* the corrected reading); **the "we keep archer-3 and spearman-3 therefore we win" headline does not** (the two types are banned by the profile, so our engine does not field them either); **and the old §6 mechanism does not survive either** — it was the two tier-3 types, which the profile bans; the pass-A gap has a different, measured cause (the kill-order crossings above). The per-march hired-spend column is new.

## 7. The plan at the horizon the app plans over (`marchTarget: 10`)

The earlier plan rows were `planCampaign({ request })` with **no `marchTarget`** — the unbounded planner, 60-odd marches of tiny stacks, which is the behaviour the owner removed today. The app plans over a horizon (`CAMPAIGN.marches`, default 10), and its repeated march is a different, fatter march. Both are shown here, per army and per bonus set, with the hired spend of the repeated march, of the whole plan, and of what is left of the stock at the end.

| pass · army | plan marches | repeated march (hired) | **per march** | share of the 277 | whole plan | share | left of the stock | finale | avg damage | silver | search: one march | ×10 marches |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| pass A · the query's own army, the capture's caps | 10 (9 + finale) | 6/7/6 | **3** | 1.08 % | **31** | 11.19 % | 22 of 277 (arbalester 5, epic-monster-hunter 4, chariot 7, legionary 6) | 11 stacks | 13,083,335 | 14,950,200 | 7 (2.53 %) | 70 (25.27 %) |

> pass A — the capture's own bonuses · the query's own army, the capture's caps: the repeated march is 6 epic-monster-hunter-6 · 7 arbalester-6 · 6 legionary-6 — **3 of the 277 held (1.08 %) a march**, 31 over the whole 10-march plan (11.19 %), 22 left. Our search's single march spends 7 (2.53 %) and would spend 70 (25.27 %) over ten of it — 2.26× the plan's whole spend, which is the point of the column.
| pass A · the query's own army, the account's own stock (the check on `out/76-plan-resize.md`) | 10 (9 + finale) | 36/40/21/20 | **13** | 4.69 % | **134** | 48.38 % | 143 of 277 (chariot 17, arbalester 36, epic-monster-hunter 50, legionary 40) | 6 stacks | 35,532,309 | 21,292,700 | 24 (8.66 %) | 240 (86.64 %) |

> pass A — the capture's own bonuses · the query's own army, the account's own stock (the check on `out/76-plan-resize.md`): the repeated march is 36 epic-monster-hunter-6 · 40 arbalester-6 · 21 legionary-6 · 20 chariot-6 — **13 of the 277 held (4.69 %) a march**, 134 over the whole 10-march plan (48.38 %), 143 left. Our search's single march spends 24 (8.66 %) and would spend 240 (86.64 %) over ten of it — 1.79× the plan's whole spend, which is the point of the column.
| pass A · his real army (what the app plans) | 10 (9 + finale) | 37/40/23/20 | **13** | 4.69 % | **134** | 48.38 % | 143 of 277 (chariot 17, arbalester 36, epic-monster-hunter 50, legionary 40) | 7 stacks | 35,134,201 | 18,367,200 | 28 (10.11 %) | 280 (101.08 %) |

> pass A — the capture's own bonuses · his real army (what the app plans): the repeated march is 37 epic-monster-hunter-6 · 40 arbalester-6 · 23 legionary-6 · 20 chariot-6 — **13 of the 277 held (4.69 %) a march**, 134 over the whole 10-march plan (48.38 %), 143 left. Our search's single march spends 28 (10.11 %) and would spend 280 (101.08 %) over ten of it — 2.09× the plan's whole spend, which is the point of the column.
| pass A · the query's own army, the account's own stock and housing (4,343) | 10 (9 + finale) | 36/40/21/20 | **13** | 4.69 % | **134** | 48.38 % | 143 of 277 (chariot 17, arbalester 36, epic-monster-hunter 50, legionary 40) | 7 stacks | 36,292,225 | 23,012,900 | 26 (9.39 %) | 260 (93.86 %) |

> pass A — the capture's own bonuses · the query's own army, the account's own stock and housing (4,343): the repeated march is 36 epic-monster-hunter-6 · 40 arbalester-6 · 21 legionary-6 · 20 chariot-6 — **13 of the 277 held (4.69 %) a march**, 134 over the whole 10-march plan (48.38 %), 143 left. Our search's single march spends 26 (9.39 %) and would spend 260 (93.86 %) over ten of it — 1.94× the plan's whole spend, which is the point of the column.
| pass B · the query's own army, the capture's caps | 10 (9 + finale) | 6/7/7 | **3** | 1.08 % | **31** | 11.19 % | 22 of 277 (arbalester 5, epic-monster-hunter 4, chariot 7, legionary 6) | 10 stacks | 20,038,060 | 15,604,500 | 7 (2.53 %) | 70 (25.27 %) |

> pass B — the account's current bonuses (scenario C) · the query's own army, the capture's caps: the repeated march is 6 epic-monster-hunter-6 · 7 arbalester-6 · 7 legionary-6 — **3 of the 277 held (1.08 %) a march**, 31 over the whole 10-march plan (11.19 %), 22 left. Our search's single march spends 7 (2.53 %) and would spend 70 (25.27 %) over ten of it — 2.26× the plan's whole spend, which is the point of the column.
| pass B · the query's own army, the account's own stock (the check on `out/76-plan-resize.md`) | 10 (9 + finale) | 50/39/40/20 | **15** | 5.42 % | **150** | 54.15 % | 127 of 277 (chariot 17, arbalester 36, epic-monster-hunter 42, legionary 32) | 7 stacks | 51,021,248 | 21,409,500 | 30 (10.83 %) | 300 (108.30 %) |

> pass B — the account's current bonuses (scenario C) · the query's own army, the account's own stock (the check on `out/76-plan-resize.md`): the repeated march is 50 epic-monster-hunter-6 · 39 arbalester-6 · 40 legionary-6 · 20 chariot-6 — **15 of the 277 held (5.42 %) a march**, 150 over the whole 10-march plan (54.15 %), 127 left. Our search's single march spends 30 (10.83 %) and would spend 300 (108.30 %) over ten of it — 2.00× the plan's whole spend, which is the point of the column.
| pass B · his real army (what the app plans) | 10 (9 + finale) | 50/39/40/20 | **15** | 5.42 % | **150** | 54.15 % | 127 of 277 (chariot 17, arbalester 36, epic-monster-hunter 42, legionary 32) | 7 stacks | 50,644,557 | 21,330,800 | 27 (9.75 %) | 270 (97.47 %) |

> pass B — the account's current bonuses (scenario C) · his real army (what the app plans): the repeated march is 50 epic-monster-hunter-6 · 39 arbalester-6 · 40 legionary-6 · 20 chariot-6 — **15 of the 277 held (5.42 %) a march**, 150 over the whole 10-march plan (54.15 %), 127 left. Our search's single march spends 27 (9.75 %) and would spend 270 (97.47 %) over ten of it — 1.80× the plan's whole spend, which is the point of the column.
| pass B · the query's own army, the account's own stock and housing (4,343) | 10 (9 + finale) | 36/40/40/20 | **14** | 5.05 % | **142** | 51.26 % | 135 of 277 (chariot 17, arbalester 36, epic-monster-hunter 50, legionary 32) | 7 stacks | 50,859,951 | 23,339,800 | 30 (10.83 %) | 300 (108.30 %) |

> pass B — the account's current bonuses (scenario C) · the query's own army, the account's own stock and housing (4,343): the repeated march is 36 epic-monster-hunter-6 · 40 arbalester-6 · 40 legionary-6 · 20 chariot-6 — **14 of the 277 held (5.05 %) a march**, 142 over the whole 10-march plan (51.26 %), 135 left. Our search's single march spends 30 (10.83 %) and would spend 300 (108.30 %) over ten of it — 2.11× the plan's whole spend, which is the point of the column.

**The sanity check on `out/76-plan-resize.md`, reconciled.** Its repeated march was "epic monster hunter 35 · arbalester 40 · legionary 40 · chariot 20 → 14 a march", measured on the eight-type army. The configuration that reproduces it is **scenario C bonuses, the query's own army, the account's own stock, and the app's own housing of 4,343** — the last row of each pass above — where the plan's repeated march measures 36 epic-monster-hunter · 40 arbalester · 40 legionary · 20 chariot = **14**, against his 14 (one unit apart on the epic monster hunter, the same ±1 the parity section holds). So his figure is confirmed, and it also says which configuration the app really plans in: the capture's own 4,000 leadership and the capture's caps are the query's, not the app's.

## 8. Our own stacking methods against TotalStack, on the query's own army

The owner asked for the comparison with the other stacking tools. Same army their answer belongs to (8 troop types), same caps as the capture, and our three shipped methods beside the search and the plan — every row scored by our `simulateBattle` under that block's bonuses.

**pass A — the capture's own bonuses · their 4,000 leadership (the query's own)**

| stacker | stacks | troops | hired | avg damage | min | max | hits E/A | silver | damage / silver | leadership | **hired spent** | share | vs their answer | legal |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Tier ladder** (`elite`) | 12 | 3,302 | 53 | **2,462,474** | 2,391,338 | 2,533,610 | 19/20 | 1,520,800 | 1.62 | 4,000/4,000 | **7** | 2.53 % | -5.2 % | legal |
| **Troops first** (`ms`) | 12 | 3,302 | 51 | **2,475,208** | 2,447,995 | 2,502,421 | 18/19 | 1,520,800 | 1.63 | 4,000/4,000 | **7** | 2.53 % | -4.7 % | legal |
| **Troops first, damage trades** (`msRelaxed`) | 12 | 3,302 | 51 | **2,475,208** | 2,447,995 | 2,502,421 | 18/19 | 1,520,800 | 1.63 | 4,000/4,000 | **7** | 2.53 % | -4.7 % | legal |
| **our search** (`damagePerSilver`) | 12 | 3,302 | 51 | **2,475,208** | 2,447,995 | 2,502,421 | 18/19 | 1,520,800 | 1.63 | 4,000/4,000 | **7** | 2.53 % | -4.7 % | legal |
| **our plan**'s repeated march (`marchTarget: 10`) | 11 | 3,298 | 19 | **1,285,781** | 1,257,217 | 1,314,345 | 17/18 | 1,499,500 | 0.86 | 3,985/4,000 | **3** | 1.08 % | -50.5 % | legal |
| TotalStack's capture | 12 | 3,300 | 52 | **2,597,180** | 2,530,490 | 2,663,870 | 21/22 | 1,521,100 | 1.71 | 3,999/4,000 | **7** | 2.53 % | — | their answer |
| Kai's marched stack | 11 | 3,345 | 60 | **2,605,471** | 2,560,156 | 2,650,786 | 18/19 | 1,592,300 | 1.64 | 4,107/4,000 | **7** | 2.53 % | +0.3 % | **over leadership** |

**pass B — the account's current bonuses (scenario C) · their 4,000 leadership (the query's own)**

| stacker | stacks | troops | hired | avg damage | min | max | hits E/A | silver | damage / silver | leadership | **hired spent** | share | vs their answer | legal |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Tier ladder** (`elite`) | 12 | 3,507 | 53 | **2,578,002** | 2,489,082 | 2,666,922 | 21/22 | 1,441,200 | 1.79 | 4,000/4,000 | **7** | 2.53 % | -13.0 % | legal |
| **Troops first** (`ms`) | 12 | 3,507 | 45 | **2,930,684** | 2,930,684 | 2,930,684 | 20/20 | 1,441,200 | 2.03 | 4,000/4,000 | **7** | 2.53 % | -1.1 % | legal |
| **Troops first, damage trades** (`msRelaxed`) | 12 | 3,507 | 46 | **2,993,161** | 2,993,161 | 2,993,161 | 20/20 | 1,441,200 | 2.08 | 4,000/4,000 | **7** | 2.53 % | +1.0 % | legal |
| **our search** (`damagePerSilver`) | 11 | 3,252 | 53 | **3,582,128** | 3,509,901 | 3,654,354 | 18/19 | 1,566,200 | 2.29 | 4,000/4,000 | **7** | 2.53 % | +20.9 % | legal |
| **our plan**'s repeated march (`marchTarget: 10`) | 10 | 3,248 | 20 | **1,966,978** | 1,897,888 | 2,036,068 | 15/16 | 1,550,400 | 1.27 | 3,984/4,000 | **3** | 1.08 % | -33.6 % | legal |
| TotalStack's capture | 12 | 3,300 | 52 | **2,962,782** | 2,889,399 | 3,036,164 | 20/21 | 1,521,100 | 1.95 | 3,999/4,000 | **7** | 2.53 % | — | their answer |
| Kai's marched stack | 11 | 3,345 | 60 | **3,838,310** | 3,767,986 | 3,908,634 | 18/19 | 1,592,300 | 2.41 | 4,107/4,000 | **7** | 2.53 % | +29.6 % | **over leadership** |

**pass A — the capture's own bonuses · the app's own 4,343 leadership**

| stacker | stacks | troops | hired | avg damage | min | max | hits E/A | silver | damage / silver | leadership | **hired spent** | share | vs their answer | legal |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Tier ladder** (`elite`) | 12 | 3,585 | 53 | **2,565,653** | 2,536,075 | 2,595,230 | 19/20 | 1,651,300 | 1.55 | 4,343/4,343 | **7** | 2.53 % | -1.2 % | legal |
| **Troops first** (`ms`) | 12 | 3,585 | 52 | **2,540,360** | 2,510,782 | 2,569,937 | 18/19 | 1,651,300 | 1.54 | 4,343/4,343 | **7** | 2.53 % | -2.2 % | legal |
| **Troops first, damage trades** (`msRelaxed`) | 12 | 3,585 | 53 | **2,565,653** | 2,536,075 | 2,595,230 | 19/20 | 1,651,300 | 1.55 | 4,343/4,343 | **7** | 2.53 % | -1.2 % | legal |
| **our search** (`damagePerSilver`) | 12 | 3,585 | 53 | **2,565,653** | 2,536,075 | 2,595,230 | 19/20 | 1,651,300 | 1.55 | 4,343/4,343 | **7** | 2.53 % | -1.2 % | legal |
| **our plan**'s repeated march (`marchTarget: 10`) | 11 | 3,587 | 19 | **1,346,257** | 1,315,232 | 1,377,282 | 17/18 | 1,631,900 | 0.82 | 4,335/4,343 | **3** | 1.08 % | -48.2 % | legal |
| TotalStack's capture | 12 | 3,300 | 52 | **2,597,180** | 2,530,490 | 2,663,870 | 21/22 | 1,521,100 | 1.71 | 3,999/4,343 | **7** | 2.53 % | — | their answer |
| Kai's marched stack | 11 | 3,345 | 60 | **2,605,471** | 2,560,156 | 2,650,786 | 18/19 | 1,592,300 | 1.64 | 4,107/4,343 | **7** | 2.53 % | +0.3 % | **over leadership** |

**pass B — the account's current bonuses (scenario C) · the app's own 4,343 leadership**

| stacker | stacks | troops | hired | avg damage | min | max | hits E/A | silver | damage / silver | leadership | **hired spent** | share | vs their answer | legal |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **Tier ladder** (`elite`) | 12 | 3,807 | 53 | **3,197,862** | 3,108,942 | 3,286,782 | 20/21 | 1,564,900 | 2.04 | 4,343/4,343 | **7** | 2.53 % | +7.9 % | legal |
| **Troops first** (`ms`) | 12 | 3,807 | 49 | **3,323,159** | 3,323,159 | 3,323,159 | 21/21 | 1,564,900 | 2.12 | 4,343/4,343 | **7** | 2.53 % | +12.2 % | legal |
| **Troops first, damage trades** (`msRelaxed`) | 12 | 3,807 | 50 | **3,444,991** | 3,444,991 | 3,444,991 | 21/21 | 1,564,900 | 2.20 | 4,343/4,343 | **7** | 2.53 % | +16.3 % | legal |
| **our search** (`damagePerSilver`) | 12 | 3,807 | 50 | **3,444,991** | 3,444,991 | 3,444,991 | 21/21 | 1,564,900 | 2.20 | 4,343/4,343 | **7** | 2.53 % | +16.3 % | legal |
| **our plan**'s repeated march (`marchTarget: 10`) | 10 | 3,536 | 18 | **1,986,399** | 1,911,222 | 2,061,575 | 15/16 | 1,688,600 | 1.18 | 4,338/4,343 | **3** | 1.08 % | -33.0 % | legal |
| TotalStack's capture | 12 | 3,300 | 52 | **2,962,782** | 2,889,399 | 3,036,164 | 20/21 | 1,521,100 | 1.95 | 3,999/4,343 | **7** | 2.53 % | — | their answer |
| Kai's marched stack | 11 | 3,345 | 60 | **3,838,310** | 3,767,986 | 3,908,634 | 18/19 | 1,592,300 | 2.41 | 4,107/4,343 | **7** | 2.53 % | +29.6 % | **over leadership** |

**What the four blocks show.**
- **pass A — the capture's own bonuses · their 4,000 leadership (the query's own)**: their answer 2,597,180; the closest of ours is Troops first (`ms`) at 2,475,208 (-4.7 %), and the best of our three plain stackers is Troops first (`ms`) at 2,475,208 (-4.7 %) — the search's own margin over that plain sizer is 0.
- **pass B — the account's current bonuses (scenario C) · their 4,000 leadership (the query's own)**: their answer 2,962,782; the closest of ours is Troops first, damage trades (`msRelaxed`) at 2,993,161 (1.0 %), and the best of our three plain stackers is Troops first, damage trades (`msRelaxed`) at 2,993,161 (1.0 %) — the search's own margin over that plain sizer is 0.
- **pass A — the capture's own bonuses · the app's own 4,343 leadership**: their answer 2,597,180; the closest of ours is Tier ladder (`elite`) at 2,565,653 (-1.2 %), and the best of our three plain stackers is Tier ladder (`elite`) at 2,565,653 (-1.2 %) — the search's own margin over that plain sizer is 0.
- **pass B — the account's current bonuses (scenario C) · the app's own 4,343 leadership**: their answer 2,962,782; the closest of ours is Tier ladder (`elite`) at 3,197,862 (7.9 %), and the best of our three plain stackers is Troops first, damage trades (`msRelaxed`) at 3,444,991 (16.3 %) — the search's own margin over that plain sizer is -247,129.

**The reading.** On their own army, **their optimizer is a plain sizer's peer, not a search's**: two of the four blocks put a shipped method within 1.1 % of their answer (`ms` on the capture's bonuses and `msRelaxed` on scenario C), and on the capture's own bonuses our search does not beat our own plain sizer at all — it returns the same stack. So the owner's assumption is half right: the *method* explains almost the whole distance between our tools and theirs, and what the search adds is real only under the account's own bigger bonuses (where it is the best of ours). The method that matches theirs closest on their own bonuses is `msRelaxed`, which is the method their `relaxedPreservation: true` names.

## 9. The parameter sheet: every field of the capture, against our engine


`inputValue` 4,000 / `authorityValue` 2,000 / `dominanceValue` null → our `housing` 4,000 / 2,000 / 200; **the app's own is 4,343 / 2,000 / 0**, and `dominance` has nothing to hold with no monsters. **Leadership: their 4,000 against the app's 4,343.** Scoring a *fixed* stack is invariant — the scorer builds the stacks from the counts it is given, so the capacity enters only when something is *sized*; measured, and it is why this row cannot show the difference: the three marches below read identically under both housings.

| march (fixed counts) | damage at 4,000 | damage at 4,343 | silver, both | leadership used |
|---|---|---|---|---|
| our search (`damagePerSilver`) | **2,475,208** | **2,475,208** | 1,520,800 | 4,000/4,343 |
| TotalStack's capture | **2,597,180** | **2,597,180** | 1,521,100 | 3,999/4,343 |
| Kai's marched stack | **2,605,471** | **2,605,471** | 1,592,300 | 4,107/4,343 |

The material half of that difference is in what our *tools* field, and it is already measured in §8: at the app's 4,343 our best plain stacker reads 2,565,653 against 2,475,208 at their 4,000 — **+90,445 damage for the 343 extra leadership**, which is the number to hold in mind when reading our answers against theirs. Their capture, being a fixed stack, is unaffected.

**Temple: their 0 against the account's real 15** (the same three marches, capture bonuses, 4,000 leadership). Everything above is priced at their 0; the app's own temple is 15 (`scenarioC`; the export itself says 0):

| march | silver @0 | silver @15 | gold @0 | gold @15 | gold change |
|---|---|---|---|---|---|
| our search (`damagePerSilver`) | 1,520,800 | 1,520,800 | 408 | 267 | -34.6 % |
| TotalStack's capture | 1,521,100 | 1,521,100 | 416 | 272 | -34.6 % |
| Kai's marched stack | 1,592,300 | 1,592,300 | 480 | 314 | -34.6 % |

**Measured, the temple is not a silver field in our engine at all**: it divides the *gold* a revive costs (`reviveOne` → `templeDivisor(settings.templeLevel)`), while retraining troops is priced by `trainingCostReduction` — so temple 15 leaves the three marches' silver untouched and cuts their gold by the temple multiplier. The capture's `templeLevel: 0` therefore cannot move any silver figure here, and our `damagePerSilver` objective is temple-blind while `damagePerGold` is not.

**Mercenary caps: the query's (bear 6, cyclops 6, arbalester 15, EMH 14, chariot 8, legionary 16) against the account's own stock (chariot-6 37, arbalester-6 76, epic-monster-hunter-6 92, legionary-6 72)**, our search on the query's army:

| caps | our search: avg damage | hired fielded | hired spent a march | damage / silver |
|---|---|---|---|---|
| the query's own caps | **2,475,208** | 51 | **7** | 1.63 |
| the account's own stock | **4,126,227** | 223 | **24** | 3.44 |

**`excludedTroopIds: []` against the profile's `excludedUnitIds` (archer-1, spearman-1, rider-1, archer-2)**: their answer scores **2,597,180** on the army they answered about and **1,469,741** when the four ids are removed (1,127,439 of its damage is in stacks the profile does not field — 4 of its unit types). This is the material one for the like-for-like.

**The category percentages** (`rangedPct`/`meleePct`/`mountedPct` 25, `flyingPct` 0) **and the `guardsmenPct` 80 / `specialistPct` 20 their response carries**: our engine has **no counterpart** — `StackingOptions` holds method, strictMercsAboveMonsters, monstersLast, roundTo10, relaxedPreservation, customOrder and nothing that shapes a category mix. Measured, their own answer does not respect them either: its troop mix by category is ranged 35.3 %, melee 43.5 %, mounted 21.2 % (not 25/25/25), and its leadership splits 86.1 % guardsmen / 13.9 % specialist, not the 80/20 the response reports — so those fields describe neither a constraint their optimizer obeyed nor its own answer, and no gap in this comparison can be blamed on our not having them.

**The boolean flags.** `relaxedPreservation` true → our `relaxedPreservation` (same, and it is what `msRelaxed` adds); `monstersLast` false → our `monstersLast` false (same, and there are no monsters); `roundMonstersTo10` / `roundMercsTo10` false → our `roundTo10` false (same); `excludedMonsterIds` [] and an empty monster tier range → no monsters on either side, so our `strictMercsAboveMonsters` has nothing to act on (same by vacuity); `monsterSaving`, `damageStacking`, `damageStackingAttackOrder`, `enforceOrdering` have **no counterpart** in `StackingOptions` — each is monster- or ordering-specific arm of their optimizer, and with no monsters and an engine that always kills highest-HP-first they can change nothing here: measured, the HP profile of their stack is non-increasing (**true**) and so is ours (**true**). `bonusMode: 'source'` with `directBonuses` {} → our `totals` aggregated from sources with no direct/extra input (same); `armyStrengthAgainstEpicMonstersBonus` 0, `eventStrengthBonus` 0, `activeEventStrengthName` null, `arachnesEventActive` false → our empty `activeEvents` (same); `specialStrengthBonuses` all zero → our zero double-damage/strike-two-squads (same); `matchupStrengthBonusesByCategoryAndTarget` all empty → our empty matchup table (same).

**`objective: damagePerSilver`** → our `searchPriority({ objective: 'damagePerSilver' })` (same name, same meaning). **`optimizationSeed` / `deepOptimizationSeeds: false`** → our search's restarts (`MAX_RESTARTS` 64) with an optional numeric `seed`; their seed object is a *subset* choice (which troops, monsters, mercenaries to start from) and `deepOptimizationSeeds` off is their shallow mode. Measured on this army, our search is **exhaustive** (4,095 candidates evaluated), so the seeding question cannot move our answer here: the whole space was enumerated.

**`recoveryPlan`** {retrainAll, selectiveTopTroopTypes 1} → our `plan.mode: 'retrain'` for the whole army, which is `retrainAll`; **`selectiveTopTroopTypes: 1`** is our `'selective'` mode with `selectiveTop: 1` — retrain only the top one troop type and revive the rest — and our engine has it, so the capture's mode asks for the *other* branch (all troops retrained). `reviveAllTroops` false → our `plan.mode !== 'revive'` (same); `templeLevel` 0 → our `recovery.templeLevel`: the export itself says 0 (**same**), the app's real temple is 15 (**different and material**, measured above); `trainingCostReductions` and `trainingSpeedBonuses` all zero → the export's own {} and {} (same).

**The bonus block, side by side.** Theirs: `healthBonuses` melee +35, army +3; `strengthBonuses` melee +70, army +3; every other axis zero. Ours (pass A) is exactly that, one custom source on the same axes; pass B is scenario C (guardsmen +159 / +189 with the category bonuses and +3 % double damage). So **pass A is 'same' by construction and pass B is 'different and material'** — the two passes exist precisely because that difference moves the ranking (§6).

**`enemyFormation` 1/1/1/1** → our `enemy` — the same four squads, `enemySquadCount` 4 (same). **`guardsmenExcludedCategories` / `specialistExcludedCategories`** → our `troops.topTierExcluded` for both groups: guardsmen [melee, ranged] = the profile's [melee, ranged] and specialists [] = the profile's [] (**same**), and the top-tier reading is the one the capture supports because their answer keeps rider-3 — tier 3, mounted — while dropping archer-3 and spearman-3, which is what excluding *the top tier* leaves and what excluding a whole category could not.

**Which of these could change the verdict, and what the comparison is valid for.** One difference is **material to the ranking** — the bonus set: pass A is their own and pass B is the account's, and the ranking between our search and their answer flips between them (§6), so every claim here is per-pass and none is general. Three more move *numbers* without moving the ranking: the app's 4,343 leadership (a re-score, above), the account's real temple of 15 (silver only, above), and the mercenary caps (the query's 14/16/15/8 against the account's 92/76/72/37 — our search answers very differently under each, above). One makes the whole comparison conditional: `excludedTroopIds: []` means **their answer is about an army the profile does not field**, so it is a like-for-like against our engine on that army and not against what the app would deploy. Everything else in the sheet is either the same on both sides or a flag with nothing to act on in this fight. The comparison is therefore strictly valid for: **the query's own eight-type army, both bonus sets, their 4,000 leadership, their temple 0, their caps, their enemy, with counts as the only thing their capture gives us to check against** — their damage figures are ours, not theirs.
