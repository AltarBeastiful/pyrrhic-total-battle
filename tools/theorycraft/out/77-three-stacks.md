
## The arena: one set of parameters for all three

| parameter | value |
|---|---|
| leadership · authority · dominance | 4,000 · 2,000 · 0 |
| army | the query's own: guardsmen 1–3 with the top tier's melee/ranged excluded, specialists tier 1, no monsters or engineers, nothing excluded by id — 8 troop types (archer-1, archer-2, rider-1, rider-2, rider-3, spearman-1, spearman-2, swordsman-1) |
| hired | epic-monster-hunter-6 16 · arbalester-6 18 · legionary-6 18 · chariot-6 8 — Kai's widest legal reading, 60 units; TotalStack's counts fit inside it |
| enemy | melee 1, ranged 1, mounted 1, flying 1 — 4 squads |
| recovery | temple 0, retrain all, no reductions or speed-ups |
| bonuses | **one set per pass**, and every stack is both searched and scored under the pass's set: pass 1 scenario C (guardsmen +159 / +189, the category bonuses, +3 % double damage), pass 2 the capture's own (melee +35 % health / +70 % strength, army +3 % / +3 %) |

## 1. Our own answer, re-derived rather than transcribed


**pass 1 — scenario C (the account's current bonuses)** — our optimizer on this arena: the priority search (`damagePerSilver`) returns 807 archer-1 · 806 spearman-1 · 446 archer-2 · 402 rider-1 · 445 spearman-2 · 222 rider-2 · 124 rider-3 · 18 arbalester-6 · 18 legionary-6 · 16 epic-monster-hunter-6 · 8 chariot-6; the shipped sizers read `elite` 3,567 units, `ms` 3,552, `msRelaxed` 3,553.

**pass 2 — the capture's own bonuses (melee +35/+70, army +3/+3)** — our optimizer on this arena: the priority search (`damagePerSilver`) returns 564 swordsman-1 · 752 archer-1 · 562 spearman-1 · 375 rider-1 · 416 archer-2 · 310 spearman-2 · 207 rider-2 · 116 rider-3 · 14 legionary-6 · 18 arbalester-6 · 16 epic-monster-hunter-6 · 8 chariot-6; the shipped sizers read `elite` 3,362 units, `ms` 3,358, `msRelaxed` 3,358.

The owner's transcription of our stack, against what our optimizer returns on this arena (search, pass 1 → pass 2, same caps):

| unit | his transcription | our search, pass 1 | our search, pass 2 |
|---|---|---|---|
| archer-1 | 806 | 807 | 752 |
| spearman-1 | 855 | 806 | 562 |
| archer-2 | 430 | 446 | 416 |
| rider-1 | 411 | 402 | 375 |
| spearman-2 | 465 | 445 | 310 |
| rider-2 | 219 | 222 | 207 |
| rider-3 | 118 | 124 | 116 |
| arbalester-6 | 16 | 18 | 18 |
| legionary-6 | 16 | 18 | 14 |
| epic-monster-hunter-6 | 10 | 16 | 16 |
| chariot-6 | 7 | 8 | 8 |
| swordsman-1 | 0 | 0 | 564 |

**Is the transcription even on this arena?** Scored as counts: pass 1 uses 4,052 leadership and 56 authority (**over the arena's 4,000**); pass 2 uses 4,052 leadership and 56 authority (**over the arena's 4,000**). It is not closer to our **plan's repeated march at `marchTarget: 10`** than to our single-march search: on pass 1 that march is 843 spearman-1 · 459 spearman-2 · 405 rider-1 · 794 archer-1 · 216 rider-2 · 424 archer-2 · 117 rider-3 · 8 epic-monster-hunter-6 · 10 arbalester-6 · 10 legionary-6 — 11 counts away from his transcription, against 11 for the single-march search — so the transcription is a stack from different parameters again (its leadership alone rules it out of this arena), not a stack of ours reproduced.

**Ours is used from here on**, as the owner asked: the transcription differs from what our optimizer returns on this arena in 11 of 11 counts (pass 1), and it is over the arena's leadership before any of them is compared — so it was built on different parameters, and the counts below are ours.

## 2. The three stacks on that arena


**pass 1 — scenario C (the account's current bonuses)**

| stack | stacks | troops | hired | avg damage | min | max | hits E/A | silver | damage / silver | leadership | authority | hired spent | share of the 60 | legal |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **ours** (our search, this arena, this pass) | 11 | 3,252 | 60 | **3,837,194** | 3,764,967 | 3,909,420 | 18/19 | 1,566,200 | 2.45 | 4,000/4,000 | 68/2,000 | **7** | 11.67 % | legal |
| **Kai's** (from the extract) | 11 | 3,258 | 60 | **3,804,567** | 3,736,052 | 3,873,081 | 18/19 | 1,550,800 | 2.45 | 4,000/4,000 | 68/2,000 | **7** | 11.67 % | legal |
| **TotalStack's** (second capture) | 12 | 3,427 | 52 | **3,258,657** | 3,203,525 | 3,313,789 | 20/21 | 1,479,500 | 2.20 | 3,999/4,000 | 59/2,000 | **7** | 11.67 % | legal |

Where each march's damage comes from, stack by stack (enemy-first):

| unit | kill position (ours / Kai / theirs) | hits E (ours / Kai / theirs) | damage E (ours / Kai / theirs) |
|---|---|---|---|
| archer-1 | 1 / 3 / 1 | 0 / 1 / 0 | 0 / 145,885 / 0 |
| spearman-1 | 2 / 1 / 5 | 1 / 0 / 1 | 132,587 / 0 / 101,003 |
| archer-2 | 3 / 6 / 4 | 1 / 2 / 1 | 157,349 / 302,702 / 120,305 |
| rider-1 | 4 / 2 / 2 | 1 / 1 / 1 | 142,710 / 146,260 / 109,340 |
| spearman-2 | 5 / 4 / 3 | 1 / 1 / 0 | 139,775 / 137,890 / 0 |
| rider-2 | 6 / 5 / 6 | 2 / 1 / 2 | 310,090 / 151,553 / 237,456 |
| rider-3 | 7 / 7 / 8 | 2 / 2 / 2 | 346,010 / 315,316 / 262,298 |
| arbalester-6 | 8 / 8 / 9 | 2 / 2 / 2 | 547,200 / 547,200 / 456,000 |
| legionary-6 | 9 / 9 / 7 | 2 / 2 / 2 | 400,140 / 400,140 / 355,680 |
| epic-monster-hunter-6 | 10 / 10 / 10 | 3 / 3 / 3 | 875,010 / 875,010 / 765,636 |
| chariot-6 | 11 / 11 / 11 | 3 / 3 / 3 | 714,096 / 714,096 / 624,834 |
| swordsman-1 | — / — / 12 | — / — / 3 | — / — / 170,973 |

The margin against Kai's, unit by unit (enemy-first, ours minus theirs): rider-2 +158,537 · archer-1 -145,885 · archer-2 -145,353 · spearman-1 +132,587 — and the sum of every unit's difference is 28,915 enemy-first damage.

**pass 1 — scenario C (the account's current bonuses) — the verdict.** ours marches the most at 3,837,194 damage, then Kai's at 3,804,567 (-0.9 %) and TotalStack's at 3,258,657 (-15.1 %). Hired spent a march: ours 7, Kai's 7, TotalStack's 7 — of the 60 the arena holds. The mechanism is in the table above: the enemy kills highest-HP-first, so what separates the three is how many stacks strike before dying — ours fields 11 stacks against Kai's 11 and TotalStack's 12, and the friendly-hit counts read 18 / 18 / 20.

**pass 2 — the capture's own bonuses (melee +35/+70, army +3/+3)**

| stack | stacks | troops | hired | avg damage | min | max | hits E/A | silver | damage / silver | leadership | authority | hired spent | share of the 60 | legal |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **ours** (our search, this arena, this pass) | 12 | 3,302 | 56 | **2,666,584** | 2,639,371 | 2,693,797 | 18/19 | 1,520,800 | 1.75 | 4,000/4,000 | 64/2,000 | **7** | 11.67 % | legal |
| **Kai's** (from the extract) | 11 | 3,258 | 60 | **2,584,919** | 2,540,770 | 2,629,068 | 18/19 | 1,550,800 | 1.67 | 4,000/4,000 | 68/2,000 | **7** | 11.67 % | legal |
| **TotalStack's** (second capture) | 12 | 3,427 | 52 | **2,484,010** | 2,438,558 | 2,529,461 | 21/22 | 1,479,500 | 1.68 | 3,999/4,000 | 59/2,000 | **7** | 11.67 % | legal |

Where each march's damage comes from, stack by stack (enemy-first):

| unit | kill position (ours / Kai / theirs) | hits E (ours / Kai / theirs) | damage E (ours / Kai / theirs) |
|---|---|---|---|
| swordsman-1 | 1 / — / 1 | 0 / — / 0 | 0 / — / 0 |
| archer-1 | 2 / 5 / 5 | 0 / 1 / 1 | 0 / 69,275 / 52,360 |
| spearman-1 | 3 / 1 / 3 | 1 / 0 / 1 | 59,572 / 0 / 65,084 |
| rider-1 | 4 / 4 / 6 | 0 / 1 / 2 | 0 / 69,216 / 103,488 |
| archer-2 | 5 / 7 / 7 | 1 / 2 / 2 | 76,378 / 157,528 / 125,216 |
| spearman-2 | 6 / 2 / 2 | 2 / 1 / 1 | 129,456 / 91,663 / 71,410 |
| rider-2 | 7 / 6 / 8 | 1 / 2 / 2 | 74,893 / 157,022 / 123,012 |
| rider-3 | 8 / 8 / 9 | 2 / 2 / 2 | 184,858 / 180,076 / 149,798 |
| legionary-6 | 9 / 3 / 4 | 2 / 1 / 1 | 248,976 / 160,056 / 142,272 |
| arbalester-6 | 10 / 9 / 10 | 3 / 2 / 3 | 627,912 / 418,608 / 523,260 |
| epic-monster-hunter-6 | 11 / 10 / 11 | 3 / 3 / 3 | 693,774 / 693,774 / 607,050 |
| chariot-6 | 12 / 11 / 12 | 3 / 3 / 3 | 543,552 / 543,552 / 475,608 |

The margin against Kai's, unit by unit (enemy-first, ours minus theirs): arbalester-6 +209,304 · legionary-6 +88,920 · rider-2 -82,129 · archer-2 -81,150 — and the sum of every unit's difference is 98,601 enemy-first damage.

**pass 2 — the capture's own bonuses (melee +35/+70, army +3/+3) — the verdict.** ours marches the most at 2,666,584 damage, then Kai's at 2,584,919 (-3.1 %) and TotalStack's at 2,484,010 (-6.8 %). Hired spent a march: ours 7, Kai's 7, TotalStack's 7 — of the 60 the arena holds. The mechanism is in the table above: the enemy kills highest-HP-first, so what separates the three is how many stacks strike before dying — ours fields 12 stacks against Kai's 11 and TotalStack's 12, and the friendly-hit counts read 18 / 18 / 21.

## 3. Can our optimizer beat the best of the two?


**pass 1 — scenario C (the account's current bonuses)**: our search returns 807 archer-1 · 806 spearman-1 · 446 archer-2 · 402 rider-1 · 445 spearman-2 · 222 rider-2 · 124 rider-3 · 18 arbalester-6 · 18 legionary-6 · 16 epic-monster-hunter-6 · 8 chariot-6 — 3,837,194 damage, 1,566,200 silver, 7 hired spent, which **beats the best of the two by 32,627 (0.9 %)**.

**pass 2 — the capture's own bonuses (melee +35/+70, army +3/+3)**: our search returns 564 swordsman-1 · 752 archer-1 · 562 spearman-1 · 375 rider-1 · 416 archer-2 · 310 spearman-2 · 207 rider-2 · 116 rider-3 · 14 legionary-6 · 18 arbalester-6 · 16 epic-monster-hunter-6 · 8 chariot-6 — 2,666,584 damage, 1,520,800 silver, 7 hired spent, which **beats the best of the two by 81,665 (3.2 %)**.

The narrower stock (TotalStack's own counts — epic-monster-hunter-6 14, arbalester-6 15, legionary-6 16, chariot-6 7) as a second reading, since a narrower purse can only lower what our optimizer can field:
- **pass 1 — scenario C (the account's current bonuses)**, narrow stock: 807 archer-1 · 806 spearman-1 · 446 archer-2 · 402 rider-1 · 445 spearman-2 · 222 rider-2 · 124 rider-3 · 16 legionary-6 · 15 arbalester-6 · 14 epic-monster-hunter-6 · 7 chariot-6 — 3,502,898 damage, 7 hired spent.
- **pass 2 — the capture's own bonuses (melee +35/+70, army +3/+3)**, narrow stock: 564 swordsman-1 · 752 archer-1 · 562 spearman-1 · 375 rider-1 · 416 archer-2 · 310 spearman-2 · 207 rider-2 · 116 rider-3 · 14 legionary-6 · 15 arbalester-6 · 14 epic-monster-hunter-6 · 7 chariot-6 — 2,407,264 damage, 7 hired spent.

**Which is apples-to-apples**: the wide stock (60 hired), because all three stacks fit inside it — TotalStack's widest hire is 16 of a type and Kai's 18, both within Kai's own reading, so every stack is judged against the same purse and the same caps. The narrow stock is the same arena with a smaller purse, and it is the fair reading only for TotalStack's own answer.

## 4. Their optimizer left hired units at home — measured, not assumed

Their answer hires 15 of 18 arbalesters and 16 of 18 legionaries, and all 14 of 16 epic monster hunters — so two of the four types are short of their caps with authority to spare. Re-scored with 3 more arbalesters and 2 more legionaries (their counts at the caps), our engine:

| stack | pass | avg damage | silver | hits E/A | leadership | authority | hired spent | arbalester position/hits/damage | legionary position/hits/damage |
|---|---|---|---|---|---|---|---|---|---|
| their answer as returned | pass 1 | **3,258,657** | 1,479,500 | 20/21 | 3,999 | 59 | 7 | 9 / 2 / 456,000 | 7 / 2 / 355,680 |
| their answer at the caps (+3 arbalester, +2 legionary) | pass 1 | **3,167,709** | 1,479,500 | 21/22 | 3,999 | 64 | 7 | 1 / 0 / 0 | 2 / 1 / 200,070 |
| their answer as returned | pass 2 | **2,484,010** | 1,479,500 | 21/22 | 3,999 | 59 | 7 | 10 / 3 / 523,260 | 4 / 1 / 142,272 |
| their answer at the caps (+3 arbalester, +2 legionary) | pass 2 | **2,315,097** | 1,479,500 | 21/22 | 3,999 | 64 | 7 | 5 / 1 / 209,304 | 2 / 1 / 160,056 |

**What the measurement says.** Filling the two stacks to their caps makes their march *worse*, at the same silver for the troops: the hired stacks are the last to be reached by the enemy (positions 10–12 in their answer), and a fatter hired stack out-HPs the stack below it and takes its place — which is exactly the trade the numbers above show: the stack that moves up the line strikes fewer times and the ones it displaced strike more. So the shortfall is not authority left on the table through an oversight; it is their optimizer choosing the kill order over the count, and on our engine it chose right.

**Two captures, one answer — checked against what is in the tree.** The tree holds two TotalStack captures for this arena (`totalstack-2026-09-15-optimize.json`, answer created 11:51, and `totalstack-2026-09-15-optimize-1343.json`, created 13:43) and they are **not** identical: 10 of 12 counts differ, because their requests differed (the 11:51 one we have a request for carried caps 14/15/16/8 and the melee +35/+70 bonus set; the 13:43 capture carries no request at all). The 13:50 re-run reported as identical to 13:43 is **not in the tree**, so I cannot check that determinism claim from the fixtures I have — if it is saved alongside the others, the one line above it would confirm or contradict it.
