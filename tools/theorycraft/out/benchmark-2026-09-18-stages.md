# The plan across the stages of 2026-09-18 and 2026-09-19 — before, S-76, S-77, the put-back, the all-in tail, the shelter, the reference table, the tail on the repeated stops, the finale's gold, the finale's silver, the tighter shape, reliable damage, the dominance-pool monsters, the top of the burn ladder

Every figure is a four-march campaign from the benchmark snapshots in this folder (`benchmark-2026-09-1N-NN-*.json`): the plan's hardest stop, its best stop a silver, its best stop a hired unit, the stops on the bar, and beside them the best sizer sequence and the best comparable answer from TotalStack's dataset (rows that field troop types the army does not hold are left out).

**No timing is compared across these rows.** Each snapshot carries the `planMs` of the machine it was taken on, and the 08 run was taken on a machine under a foreign job at 800 % CPU — its `planMs` are two to three times the 07 run's on the large scenarios, and so is the 07 *engine* re-timed on that same machine (the 2026-09-17 export at 7 000: 2 302 ms on the 07 engine against 1 733 on the 08 engine, best of three each, back to back). Read the damage columns; time the search on one machine at one sitting.

**09 moves no figure in this table, and that is what it is for.** S-90 fixed the one campaign total that left the finale out — the hired stacks' revive **gold** — and this table has never carried gold. Checked field by field against the 08 snapshot: every damage, silver, hired burned, damage a silver and damage a hired unit of every row of every scenario is identical to the unit, and the only difference between the two files is the new `gold` column 09 adds. What moved is the number the bar prints and this table does not: a repeated stop's campaign gold was `repeats × the repeated march's gold`, and is now its marches' own sum (the evening account's silver saver 1 944 → 3 192, the 12 000 export's 2 280 → 3 464, the owner's live camp 4 440 → 4 976). The gold column is carried from 09 on.

**10 moves no figure either.** S-91 priced the finale's silver as the recap does (under the account's temple level and training discounts) instead of the search's raw figure; every profile in the repo has no discount, so the two agree to the unit here and the snapshot is identical to 09. The criterion that tells them apart runs under a 25 % discount on every group and a level-20 temple, where the raw figure overstated a discounted finale by a quarter.

**11 is S-93, the tighter shape**: every rung of the burn ladder, and the `all-in`'s own march builder, now score the sizer over each **prefix** of the troop ranking, and a rung takes that march only when it is behind on none of damage, silver, the stock burned and the training queue. The `all-in` moves on **eight** of the ten scenarios (Bear V ×1 and ×2 carry no such stop): it fields what a deeper ladder shelters, and it pays for it on two of them — the live account at 20 000 spends 31 092 400 → 42 085 900 silver for 1.3 % more damage, and the bear armies buy theirs at 54 % and 23 % more silver. The owner's export at 12 000 gains a fifth stop while its knee walks from the 17-burn rung to the 10.

**12 is S-94, and from it on the damage columns are a different reading.** Up to and including 11 every figure in this table is a march's *expected* damage — the midpoint of the two openings the game's coin decides. From 12 on it is the **worst opening**, the enemy-first journal, on every row of every scenario: the plan is ranked, priced and printed on it (owner, 2026-09-19: *"average damage is not average for sure; it's too risky for me to spend 3M silver on a coin flip to get 1M damage or 3M. We want reliable damage actually."*), so the sizer sequences and the captured answers it is measured against are priced on it too. **A 12 figure is therefore not comparable in level to an 11 figure**, and the fall between the two rows is not a plan that got worse. The bridge is the worst/expected ratio of each army's own hardest campaign, measured on the 12 bar and printed under each table below; `tools/theorycraft/out/109-reliable-damage.md` §A has the gap on every stop of every army and §C has this same comparison in both readings. What did move, and is a real move: the bar re-ranked on the bad flip is a different bar — the owner's export at 7 000 gains a fifth stop and its `all-in` gains 20.4 % of reliable damage a march, his 12 000 loses its `all-in` (it stood behind the steady max on damage, silver **and** the stock at once), and the evening account loses its silver saver.

**13 is S-96, the dominance-pool monsters**, and it moves **no figure of any scenario 12 measured** — checked field by field: every damage, silver, gold, queue, hired burned, damage a silver and damage a hired unit of every row of every one of the ten armies is identical to the unit, because not one of them owns a dominance unit and the widening only reaches an army that does. What it costs them in search time is below what this benchmark resolves, and two sittings disagree on the sign: three alternating rounds back to back on one machine put the ten at a median 4 776 ms on the 12 engine and 4 353 ms on the 13 (−8.9 %, the small armies slower and the large ones faster), while a second sitting put the same ten at 4 864 ms and 5 174 ms (+6.4 %). **Read no timing across the rows of this table** — the note at the top of the file applies here too. What 13 adds is an **eleventh scenario**, the first with a pool other than leadership and authority in it: a first-run army with the monster tiers 3–5 unlocked against 900 dominance (experiment 110's camp; its search finishes in about 7.1 s alone and 8.5–9.2 s inside the suite, a 2.7× margin under the 25 000 ms plan budget, which is why its figures are the engine's and not the clock's). On it the plan fielded **0 of 12 monster types** at stage 12 and fields 9, 9 and 11 of them at stage 13 — every monster stack under the lowest troop stack, 795 to 898 of the 900 dominance in use, and the burn counting them (97 · 106 · 112 chunks over four marches). Experiment 110's larger camp — tiers 3–7 at 20 000 dominance, where the plan fields all twenty types — is **not** in the table: its search ran 25 846–28 009 ms in every run measured, alone and in parallel alike, against the 25 000 ms `CAMPAIGN.budgets.plan`, so it is always cut off and the bar it answers with is whatever the search had reached when the clock ran out.

**14 is S-97, the top of the burn ladder**, and it moves **one** of the eleven armies stage 13 measured. The burn sweep walks *down* from the search's winner, so the winner's burn was the ceiling of the whole bar — and on the worst opening the winner is a deep ladder over every troop type, which is the shape with the lowest floor and therefore the one that shelters the **fewest** hired units. The search now scores the sheltered maximum over each **prefix** of the troop ranking above that ceiling, shape and all. On the 2026-09-17 export at 12 000 the ladder gains a rung at 22 chunks and the bar re-sorts around it: the sweet spot climbs from 27 104 076 to **31 546 458** at the same silver, the steady max from 31 546 458 for 18 790 400 to **31 963 845 for 21 035 600**, the silver saver from 22 586 784 for 13 096 400 to 22 531 695 for **12 539 600**, and the bar loses its "more mercs" rung (5 → 4 stops on the engine before S-94, 4 → **3** now). Its share of the best sizer sequence rises 0.948 → **0.961**, which un-masks the one floor S-94 left failing under a stop count. The other ten armies are **identical field for field** — every damage, silver, gold, queue, burn and both ratios to the unit. **Stage 14 also adds a twelfth scenario**, "Aydae alone, 4 975": the camp S-94 disclosed as a like-for-like loss, whose bar S-97 is about (its steady max 3 387 893 a march at 7 chunks → **4 773 281 at 17**, the figure the engine before S-94 reached). Read no timing across these rows — the note at the top of the file applies here too.

## first-run army, Bear V ×1 (20 000 leadership)

Bridge between the 11 and 12 rows on this army: the 12 bar's hardest campaign is **0.9803** of its own expected damage (the worst opening over the midpoint of the two openings).

| stage | stops | plan best damage | plan best a silver | plan best a hired | best sizer damage | best TotalStack damage (comparable) |
|---|---|---|---|---|---|---|
| 00 before | refused | — | — | — | 23 899 764 | — |
| 01 S-76 horizon ceiling | 1 | 4 722 842 | 0.58 | 4 722 842 | 23 899 764 | — |
| 02 S-77 shelter + tie | 1 | 4 722 842 | 0.58 | 4 722 842 | 23 899 764 | — |
| 03 S-78 all-in gate + finer sweep | 1 | 4 722 842 | 0.58 | 4 722 842 | 23 899 764 | — |
| 03b + TotalStack on the owner's window | 1 | 4 722 842 | 0.58 | 4 722 842 | 23 899 764 | — |
| 04 S-80 put-back pass | 1 | 4 722 842 | 0.58 | 4 722 842 | 23 899 764 | — |
| 05 S-81 all-in tail | 1 | 4 722 842 | 0.58 | 4 722 842 | 23 899 764 | — |
| 06 S-87 shelter, every hired type | 1 | 4 722 842 | 0.58 | 4 722 842 | 23 899 764 | — |
| 07 S-88 reference table over the band | 1 | 4 722 842 | 0.58 | 4 722 842 | 23 899 764 | — |
| 08 S-89 tail on the repeated stops | 1 | 18 554 768 | 0.57 | 18 554 768 | 23 899 764 | — |
| 09 S-90 the finale's gold | 1 | 18 554 768 | 0.57 | 18 554 768 | 23 899 764 | — |
| 10 S-91 the finale's silver | 1 | 18 554 768 | 0.57 | 18 554 768 | 23 899 764 | — |
| 11 S-93 the tighter shape | 1 | 18 554 768 | 0.57 | 18 554 768 | 23 899 764 | — |
| 12 S-94 reliable damage | 1 | 18 189 008 | 0.56 | 18 189 008 | 18 535 192 | — |
| 13 S-96 dominance-pool monsters | 1 | 18 189 008 | 0.56 | 18 189 008 | 18 535 192 | — |
| 14 S-97 the top of the burn ladder | 1 | 18 189 008 | 0.56 | 18 189 008 | 18 535 192 | — |
| 15 S-95 the band's damage yardstick | 1 | 18 189 008 | 0.56 | 18 189 008 | 18 535 192 | — |

## first-run army, Bear V ×2 (20 000 leadership)

Bridge between the 11 and 12 rows on this army: the 12 bar's hardest campaign is **0.9805** of its own expected damage (the worst opening over the midpoint of the two openings).

| stage | stops | plan best damage | plan best a silver | plan best a hired | best sizer damage | best TotalStack damage (comparable) |
|---|---|---|---|---|---|---|
| 00 before | refused | — | — | — | 23 974 564 | — |
| 01 S-76 horizon ceiling | 1 | 9 557 884 | 0.59 | 4 778 942 | 23 974 564 | — |
| 02 S-77 shelter + tie | 1 | 9 557 884 | 0.59 | 4 778 942 | 23 974 564 | — |
| 03 S-78 all-in gate + finer sweep | 1 | 9 557 884 | 0.59 | 4 778 942 | 23 974 564 | — |
| 03b + TotalStack on the owner's window | 1 | 9 557 884 | 0.59 | 4 778 942 | 23 974 564 | — |
| 04 S-80 put-back pass | 1 | 9 557 884 | 0.59 | 4 778 942 | 23 974 564 | — |
| 05 S-81 all-in tail | 1 | 9 557 884 | 0.59 | 4 778 942 | 23 974 564 | — |
| 06 S-87 shelter, every hired type | 1 | 9 557 884 | 0.59 | 4 778 942 | 23 974 564 | — |
| 07 S-88 reference table over the band | 1 | 9 557 884 | 0.59 | 4 778 942 | 23 974 564 | — |
| 08 S-89 tail on the repeated stops | 1 | 18 779 168 | 0.58 | 9 389 584 | 23 974 564 | — |
| 09 S-90 the finale's gold | 1 | 18 779 168 | 0.58 | 9 389 584 | 23 974 564 | — |
| 10 S-91 the finale's silver | 1 | 18 779 168 | 0.58 | 9 389 584 | 23 974 564 | — |
| 11 S-93 the tighter shape | 1 | 18 779 168 | 0.58 | 9 389 584 | 23 974 564 | — |
| 12 S-94 reliable damage | 1 | 18 413 408 | 0.57 | 9 206 704 | 18 609 992 | — |
| 13 S-96 dominance-pool monsters | 1 | 18 413 408 | 0.57 | 9 206 704 | 18 609 992 | — |
| 14 S-97 the top of the burn ladder | 1 | 18 413 408 | 0.57 | 9 206 704 | 18 609 992 | — |
| 15 S-95 the band's damage yardstick | 1 | 18 413 408 | 0.57 | 9 206 704 | 18 609 992 | — |

## first-run army, Bear V ×3 (20 000 leadership)

Bridge between the 11 and 12 rows on this army: the 12 bar's hardest campaign is **0.9809** of its own expected damage (the worst opening over the midpoint of the two openings).

| stage | stops | plan best damage | plan best a silver | plan best a hired | best sizer damage | best TotalStack damage (comparable) |
|---|---|---|---|---|---|---|
| 00 before | 1 | 14 168 526 | 0.58 | 4 722 842 | 24 086 764 | — |
| 01 S-76 horizon ceiling | 1 | 14 168 526 | 0.58 | 4 722 842 | 24 086 764 | — |
| 02 S-77 shelter + tie | 1 | 14 168 526 | 0.58 | 4 722 842 | 24 086 764 | 25 439 016 |
| 03 S-78 all-in gate + finer sweep | 2 | 14 505 126 | 0.59 | 4 835 042 | 24 086 764 | 25 439 016 |
| 03b + TotalStack on the owner's window | 2 | 14 505 126 | 0.59 | 4 835 042 | 24 086 764 | 25 439 016 |
| 04 S-80 put-back pass | 2 | 14 505 126 | 0.59 | 4 835 042 | 24 086 764 | 25 439 016 |
| 05 S-81 all-in tail | 2 | 19 115 768 | 0.59 | 6 371 923 | 24 086 764 | 25 439 016 |
| 06 S-87 shelter, every hired type | 2 | 19 115 768 | 0.59 | 6 371 923 | 24 086 764 | 25 439 016 |
| 07 S-88 reference table over the band | 2 | 19 115 768 | 0.59 | 6 371 923 | 24 086 764 | 25 439 016 |
| 08 S-89 tail on the repeated stops | 2 | 19 115 768 | 0.59 | 6 371 923 | 24 086 764 | 25 439 016 |
| 09 S-90 the finale's gold | 2 | 19 115 768 | 0.59 | 6 371 923 | 24 086 764 | 25 439 016 |
| 10 S-91 the finale's silver | 2 | 19 115 768 | 0.59 | 6 371 923 | 24 086 764 | 25 439 016 |
| 11 S-93 the tighter shape | 2 | 22 661 258 | 0.58 | 7 553 753 | 24 086 764 | 25 439 016 |
| 12 S-94 reliable damage | 2 | 18 750 008 | 0.58 | 6 250 003 | 18 750 008 | 21 427 548 |
| 13 S-96 dominance-pool monsters | 2 | 18 750 008 | 0.58 | 6 250 003 | 18 750 008 | 21 427 548 |
| 14 S-97 the top of the burn ladder | 2 | 18 750 008 | 0.58 | 6 250 003 | 18 750 008 | 21 427 548 |
| 15 S-95 the band's damage yardstick | 2 | 18 750 008 | 0.58 | 6 250 003 | 18 750 008 | 21 427 548 |

## first-run army, Bear V ×10 (20 000 leadership)

Bridge between the 11 and 12 rows on this army: the 12 bar's hardest campaign is **0.9669** of its own expected damage (the worst opening over the midpoint of the two openings).

| stage | stops | plan best damage | plan best a silver | plan best a hired | best sizer damage | best TotalStack damage (comparable) |
|---|---|---|---|---|---|---|
| 00 before | 1 | 21 135 368 | 0.65 | 5 283 842 | 25 133 964 | — |
| 01 S-76 horizon ceiling | 1 | 21 135 368 | 0.65 | 5 283 842 | 25 133 964 | — |
| 02 S-77 shelter + tie | 1 | 21 732 276 | 0.67 | 5 433 069 | 25 133 964 | 26 486 216 |
| 03 S-78 all-in gate + finer sweep | 2 | 21 732 276 | 0.67 | 5 433 069 | 25 133 964 | 26 486 216 |
| 03b + TotalStack on the owner's window | 2 | 21 732 276 | 0.67 | 5 433 069 | 25 133 964 | 26 486 216 |
| 04 S-80 put-back pass | 2 | 21 732 276 | 0.67 | 5 433 069 | 25 133 964 | 26 486 216 |
| 05 S-81 all-in tail | 2 | 21 732 276 | 0.67 | 5 433 069 | 25 133 964 | 26 486 216 |
| 06 S-87 shelter, every hired type | 2 | 21 700 948 | 0.65 | 5 425 237 | 25 133 964 | 26 486 216 |
| 07 S-88 reference table over the band | 2 | 21 700 948 | 0.65 | 5 425 237 | 25 133 964 | 26 486 216 |
| 08 S-89 tail on the repeated stops | 2 | 21 700 948 | 0.65 | 5 425 237 | 25 133 964 | 26 486 216 |
| 09 S-90 the finale's gold | 2 | 21 700 948 | 0.65 | 5 425 237 | 25 133 964 | 26 486 216 |
| 10 S-91 the finale's silver | 2 | 21 700 948 | 0.65 | 5 425 237 | 25 133 964 | 26 486 216 |
| 11 S-93 the tighter shape | 2 | 25 039 888 | 0.65 | 6 259 972 | 25 133 964 | 26 486 216 |
| 12 S-94 reliable damage | 2 | 20 893 375 | 0.64 | 5 223 344 | 21 152 576 | 22 474 748 |
| 13 S-96 dominance-pool monsters | 2 | 20 893 375 | 0.64 | 5 223 344 | 21 152 576 | 22 474 748 |
| 14 S-97 the top of the burn ladder | 2 | 20 893 375 | 0.64 | 5 223 344 | 21 152 576 | 22 474 748 |
| 15 S-95 the band's damage yardstick | 2 | 20 893 375 | 0.64 | 5 223 344 | 21 152 576 | 22 474 748 |

## first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)

Bridge between the 11 and 12 rows on this army: the 12 bar's hardest campaign is **0.9841** of its own expected damage (the worst opening over the midpoint of the two openings).

| stage | stops | plan best damage | plan best a silver | plan best a hired | best sizer damage | best TotalStack damage (comparable) |
|---|---|---|---|---|---|---|
| 00 before | 3 | 30 057 473 | 0.92 | 1 160 848 | 30 436 414 | — |
| 01 S-76 horizon ceiling | 3 | 30 057 473 | 0.92 | 1 160 848 | 30 436 414 | — |
| 02 S-77 shelter + tie | 3 | 30 057 473 | 0.92 | 1 160 848 | 30 436 414 | 30 587 159 |
| 03 S-78 all-in gate + finer sweep | 3 | 30 057 473 | 0.92 | 1 160 848 | 30 436 414 | 30 587 159 |
| 03b + TotalStack on the owner's window | 3 | 30 057 473 | 0.92 | 1 160 848 | 30 436 414 | 30 587 159 |
| 04 S-80 put-back pass | 3 | 30 057 473 | 0.92 | 1 160 848 | 30 436 414 | 30 587 159 |
| 05 S-81 all-in tail | 3 | 30 057 473 | 0.92 | 1 160 848 | 30 436 414 | 30 587 159 |
| 06 S-87 shelter, every hired type | 3 | 30 057 473 | 0.92 | 1 160 848 | 30 436 414 | 30 587 159 |
| 07 S-88 reference table over the band | 3 | 30 057 473 | 0.92 | 1 160 848 | 30 436 414 | 30 587 159 |
| 08 S-89 tail on the repeated stops | 3 | 30 057 473 | 0.92 | 1 160 848 | 30 436 414 | 30 587 159 |
| 09 S-90 the finale's gold | 3 | 30 057 473 | 0.92 | 1 160 848 | 30 436 414 | 30 587 159 |
| 10 S-91 the finale's silver | 3 | 30 057 473 | 0.92 | 1 160 848 | 30 436 414 | 30 587 159 |
| 11 S-93 the tighter shape | 3 | 30 324 441 | 0.92 | 1 160 848 | 30 436 414 | 30 587 159 |
| 12 S-94 reliable damage | 3 | 29 841 879 | 0.91 | 1 146 218 | 30 054 424 | 30 221 279 |
| 13 S-96 dominance-pool monsters | 3 | 29 841 879 | 0.91 | 1 146 218 | 30 054 424 | 30 221 279 |
| 14 S-97 the top of the burn ladder | 3 | 29 841 879 | 0.91 | 1 146 218 | 30 054 424 | 30 221 279 |
| 15 S-95 the band's damage yardstick | 3 | 29 841 879 | 0.91 | 1 146 218 | 30 054 424 | 30 221 279 |

## first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)

| stage | stops | plan best damage | plan best a silver | plan best a hired | best sizer damage | best TotalStack damage (comparable) |
|---|---|---|---|---|---|---|
| 00 before | — | — | — | — | — | — |
| 01 S-76 horizon ceiling | — | — | — | — | — | — |
| 02 S-77 shelter + tie | — | — | — | — | — | — |
| 03 S-78 all-in gate + finer sweep | — | — | — | — | — | — |
| 03b + TotalStack on the owner's window | — | — | — | — | — | — |
| 04 S-80 put-back pass | — | — | — | — | — | — |
| 05 S-81 all-in tail | — | — | — | — | — | — |
| 06 S-87 shelter, every hired type | — | — | — | — | — | — |
| 07 S-88 reference table over the band | — | — | — | — | — | — |
| 08 S-89 tail on the repeated stops | — | — | — | — | — | — |
| 09 S-90 the finale's gold | — | — | — | — | — | — |
| 10 S-91 the finale's silver | — | — | — | — | — | — |
| 11 S-93 the tighter shape | — | — | — | — | — | — |
| 12 S-94 reliable damage | — | — | — | — | — | — |
| 13 S-96 dominance-pool monsters | 3 | 95 348 743 | 2.69 | 947 920 | 104 626 942 | — |
| 14 S-97 the top of the burn ladder | 3 | 95 348 743 | 2.69 | 947 920 | 104 626 942 | — |
| 15 S-95 the band's damage yardstick | 3 | 95 348 743 | 2.69 | 947 920 | 104 626 942 | — |

## the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

Bridge between the 11 and 12 rows on this army: the 12 bar's hardest campaign is **0.9874** of its own expected damage (the worst opening over the midpoint of the two openings).

| stage | stops | plan best damage | plan best a silver | plan best a hired | best sizer damage | best TotalStack damage (comparable) |
|---|---|---|---|---|---|---|
| 00 before | 3 | 8 331 398 | 1.37 | 431 237 | 8 633 665 | 8 911 356 |
| 01 S-76 horizon ceiling | 3 | 8 331 398 | 1.37 | 431 237 | 8 633 665 | 8 911 356 |
| 02 S-77 shelter + tie | 3 | 8 331 398 | 1.37 | 431 237 | 8 633 665 | 8 911 356 |
| 03 S-78 all-in gate + finer sweep | 3 | 8 331 398 | 1.37 | 431 237 | 8 633 665 | 8 911 356 |
| 03b + TotalStack on the owner's window | 3 | 8 331 398 | 1.37 | 431 237 | 8 633 665 | 8 911 356 |
| 04 S-80 put-back pass | 3 | 8 394 732 | 1.37 | 431 237 | 8 633 665 | 8 911 356 |
| 05 S-81 all-in tail | 3 | 8 394 732 | 1.37 | 431 237 | 8 633 665 | 8 911 356 |
| 06 S-87 shelter, every hired type | 3 | 8 394 732 | 1.37 | 431 237 | 8 633 665 | 8 911 356 |
| 07 S-88 reference table over the band | 3 | 8 394 732 | 1.37 | 431 237 | 8 633 665 | 8 911 356 |
| 08 S-89 tail on the repeated stops | 3 | 8 394 732 | 1.37 | 431 237 | 8 633 665 | 8 911 356 |
| 09 S-90 the finale's gold | 3 | 8 394 732 | 1.37 | 431 237 | 8 633 665 | 8 911 356 |
| 10 S-91 the finale's silver | 3 | 8 394 732 | 1.37 | 431 237 | 8 633 665 | 8 911 356 |
| 11 S-93 the tighter shape | 3 | 8 628 782 | 1.42 | 431 237 | 8 633 665 | 8 911 356 |
| 12 S-94 reliable damage | 3 | 8 519 930 | 1.40 | 425 508 | 8 519 930 | 8 762 880 |
| 13 S-96 dominance-pool monsters | 3 | 8 519 930 | 1.40 | 425 508 | 8 519 930 | 8 762 880 |
| 14 S-97 the top of the burn ladder | 3 | 8 519 930 | 1.40 | 425 508 | 8 519 930 | 8 762 880 |
| 15 S-95 the band's damage yardstick | 3 | 8 519 930 | 1.40 | 425 508 | 8 519 930 | 8 762 880 |

## 2026-09-17 export, its setup (7 000 leadership)

Bridge between the 11 and 12 rows on this army: the 12 bar's hardest campaign is **1.0000** of its own expected damage (the worst opening over the midpoint of the two openings).

| stage | stops | plan best damage | plan best a silver | plan best a hired | best sizer damage | best TotalStack damage (comparable) |
|---|---|---|---|---|---|---|
| 00 before | 4 | 23 264 491 | 2.12 | 460 909 | 25 952 553 | — |
| 01 S-76 horizon ceiling | 4 | 23 264 491 | 2.12 | 460 909 | 25 952 553 | — |
| 02 S-77 shelter + tie | 4 | 24 814 601 | 2.27 | 393 667 | 25 952 553 | — |
| 03 S-78 all-in gate + finer sweep | 5 | 24 814 601 | 2.27 | 478 506 | 25 952 553 | — |
| 03b + TotalStack on the owner's window | 5 | 24 814 601 | 2.27 | 478 506 | 25 952 553 | 16 323 066 |
| 04 S-80 put-back pass | 5 | 24 814 601 | 2.27 | 478 506 | 25 952 553 | 16 323 066 |
| 05 S-81 all-in tail | 5 | 24 814 601 | 2.27 | 478 506 | 25 952 553 | 16 323 066 |
| 06 S-87 shelter, every hired type | 4 | 23 264 491 | 2.12 | 460 909 | 25 952 553 | 16 323 066 |
| 07 S-88 reference table over the band | 4 | 23 264 491 | 2.12 | 460 909 | 25 952 553 | 16 323 066 |
| 08 S-89 tail on the repeated stops | 4 | 23 264 491 | 2.12 | 460 909 | 25 952 553 | 16 323 066 |
| 09 S-90 the finale's gold | 4 | 23 264 491 | 2.12 | 460 909 | 25 952 553 | 16 323 066 |
| 10 S-91 the finale's silver | 4 | 23 264 491 | 2.12 | 460 909 | 25 952 553 | 16 323 066 |
| 11 S-93 the tighter shape | 4 | 23 447 087 | 2.12 | 460 909 | 25 952 553 | 16 323 066 |
| 12 S-94 reliable damage | 5 | 23 619 920 | 2.08 | 463 349 | 24 634 972 | 13 742 586 |
| 13 S-96 dominance-pool monsters | 5 | 23 619 920 | 2.08 | 463 349 | 24 634 972 | 13 742 586 |
| 14 S-97 the top of the burn ladder | 5 | 23 619 920 | 2.08 | 463 349 | 24 634 972 | 13 742 586 |
| 15 S-95 the band's damage yardstick | 5 | 23 619 920 | 2.08 | 537 039 | 24 634 972 | 13 742 586 |

## 2026-09-17 export, 12 000 leadership

Bridge between the 11 and 12 rows on this army: the 12 bar's hardest campaign is **0.9788** of its own expected damage (the worst opening over the midpoint of the two openings).

| stage | stops | plan best damage | plan best a silver | plan best a hired | best sizer damage | best TotalStack damage (comparable) |
|---|---|---|---|---|---|---|
| 00 before | 4 | 32 518 195 | 1.77 | 493 040 | 34 283 252 | — |
| 01 S-76 horizon ceiling | 4 | 32 518 195 | 1.77 | 493 040 | 34 283 252 | — |
| 02 S-77 shelter + tie | 4 | 32 518 195 | 1.77 | 493 040 | 34 283 252 | — |
| 03 S-78 all-in gate + finer sweep | 4 | 32 518 195 | 1.77 | 493 040 | 34 283 252 | — |
| 03b + TotalStack on the owner's window | 4 | 32 518 195 | 1.77 | 493 040 | 34 283 252 | 24 167 160 |
| 04 S-80 put-back pass | 4 | 32 518 195 | 1.77 | 493 040 | 34 283 252 | 24 167 160 |
| 05 S-81 all-in tail | 4 | 32 518 195 | 1.77 | 493 040 | 34 283 252 | 24 167 160 |
| 06 S-87 shelter, every hired type | 4 | 32 518 195 | 1.77 | 493 040 | 34 283 252 | 24 167 160 |
| 07 S-88 reference table over the band | 4 | 32 518 195 | 1.77 | 493 040 | 34 283 252 | 24 167 160 |
| 08 S-89 tail on the repeated stops | 4 | 32 518 195 | 1.77 | 493 040 | 34 283 252 | 24 167 160 |
| 09 S-90 the finale's gold | 4 | 32 518 195 | 1.77 | 493 040 | 34 283 252 | 24 167 160 |
| 10 S-91 the finale's silver | 4 | 32 518 195 | 1.77 | 493 040 | 34 283 252 | 24 167 160 |
| 11 S-93 the tighter shape | 5 | 33 028 417 | 1.72 | 598 922 | 34 283 252 | 24 167 160 |
| 12 S-94 reliable damage | 4 | 31 546 458 | 1.73 | 602 313 | 33 277 720 | 22 894 812 |
| 13 S-96 dominance-pool monsters | 4 | 31 546 458 | 1.73 | 602 313 | 33 277 720 | 22 894 812 |
| 14 S-97 the top of the burn ladder | 3 | 31 963 845 | 1.80 | 470 843 | 33 277 720 | 22 894 812 |
| 15 S-95 the band's damage yardstick | 3 | 31 963 845 | 1.80 | 470 843 | 33 277 720 | 22 894 812 |

## live account of 2026-09-18 (one hired type, 20 000 leadership)

Bridge between the 11 and 12 rows on this army: the 12 bar's hardest campaign is **1.0000** of its own expected damage (the worst opening over the midpoint of the two openings).

| stage | stops | plan best damage | plan best a silver | plan best a hired | best sizer damage | best TotalStack damage (comparable) |
|---|---|---|---|---|---|---|
| 00 before | 4 | 31 218 724 | 1.04 | 1 187 085 | 31 495 858 | — |
| 01 S-76 horizon ceiling | 4 | 31 218 724 | 1.04 | 1 187 085 | 31 495 858 | — |
| 02 S-77 shelter + tie | 4 | 31 218 724 | 1.04 | 1 187 085 | 31 495 858 | — |
| 03 S-78 all-in gate + finer sweep | 4 | 31 218 724 | 1.00 | 1 187 085 | 31 495 858 | — |
| 03b + TotalStack on the owner's window | 4 | 31 218 724 | 1.00 | 1 187 085 | 31 495 858 | 30 466 476 |
| 04 S-80 put-back pass | 4 | 31 218 724 | 1.00 | 1 187 085 | 31 495 858 | 30 466 476 |
| 05 S-81 all-in tail | 4 | 31 218 724 | 1.00 | 1 187 085 | 31 495 858 | 30 466 476 |
| 06 S-87 shelter, every hired type | 4 | 31 218 724 | 1.00 | 1 187 085 | 31 495 858 | 30 466 476 |
| 07 S-88 reference table over the band | 4 | 31 218 724 | 1.00 | 1 187 085 | 31 495 858 | 30 466 476 |
| 08 S-89 tail on the repeated stops | 4 | 31 218 724 | 1.00 | 1 187 085 | 31 495 858 | 30 466 476 |
| 09 S-90 the finale's gold | 4 | 31 218 724 | 1.00 | 1 187 085 | 31 495 858 | 30 466 476 |
| 10 S-91 the finale's silver | 4 | 31 218 724 | 1.00 | 1 187 085 | 31 495 858 | 30 466 476 |
| 11 S-93 the tighter shape | 4 | 31 628 813 | 1.00 | 1 187 085 | 31 495 858 | 30 466 476 |
| 12 S-94 reliable damage | 4 | 29 743 332 | 1.00 | 1 130 835 | 25 300 624 | 29 222 440 |
| 13 S-96 dominance-pool monsters | 4 | 29 743 332 | 1.00 | 1 130 835 | 25 300 624 | 29 222 440 |
| 14 S-97 the top of the burn ladder | 4 | 29 743 332 | 1.00 | 1 130 835 | 25 300 624 | 29 222 440 |
| 15 S-95 the band's damage yardstick | 4 | 29 743 332 | 1.00 | 1 130 835 | 25 300 624 | 29 222 440 |

## live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

Bridge between the 11 and 12 rows on this army: the 12 bar's hardest campaign is **0.9874** of its own expected damage (the worst opening over the midpoint of the two openings).

| stage | stops | plan best damage | plan best a silver | plan best a hired | best sizer damage | best TotalStack damage (comparable) |
|---|---|---|---|---|---|---|
| 00 before | 5 | 30 107 115 | 1.75 | 452 639 | 80 658 235 | — |
| 01 S-76 horizon ceiling | 5 | 30 107 115 | 1.75 | 452 639 | 80 658 235 | — |
| 02 S-77 shelter + tie | 5 | 30 107 115 | 1.75 | 452 639 | 80 658 235 | — |
| 03 S-78 all-in gate + finer sweep | 5 | 30 107 115 | 1.75 | 489 102 | 80 658 235 | — |
| 03b + TotalStack on the owner's window | 5 | 30 107 115 | 1.75 | 489 102 | 80 658 235 | 80 137 589 |
| 04 S-80 put-back pass | 5 | 30 107 115 | 1.75 | 489 102 | 80 658 235 | 80 137 589 |
| 05 S-81 all-in tail | 5 | 30 107 115 | 1.75 | 489 102 | 80 658 235 | 80 137 589 |
| 06 S-87 shelter, every hired type | 5 | 30 107 115 | 1.75 | 489 102 | 80 658 235 | 80 137 589 |
| 07 S-88 reference table over the band | 5 | 30 107 115 | 1.75 | 489 102 | 80 658 235 | 80 137 589 |
| 08 S-89 tail on the repeated stops | 5 | 30 107 115 | 1.75 | 489 102 | 80 658 235 | 80 137 589 |
| 09 S-90 the finale's gold | 5 | 30 107 115 | 1.75 | 489 102 | 80 658 235 | 80 137 589 |
| 10 S-91 the finale's silver | 5 | 30 107 115 | 1.75 | 489 102 | 80 658 235 | 80 137 589 |
| 11 S-93 the tighter shape | 5 | 32 348 459 | 1.75 | 489 102 | 80 658 235 | 80 137 589 |
| 12 S-94 reliable damage | 4 | 31 714 657 | 1.79 | 481 873 | 36 832 597 | 36 832 597 |
| 13 S-96 dominance-pool monsters | 4 | 31 714 657 | 1.79 | 481 873 | 36 832 597 | 36 832 597 |
| 14 S-97 the top of the burn ladder | 4 | 31 714 657 | 1.79 | 481 873 | 36 832 597 | 36 832 597 |
| 15 S-95 the band's damage yardstick | 5 | 31 714 657 | 1.79 | 461 316 | 36 832 597 | 36 832 597 |

## Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)

| stage | stops | plan best damage | plan best a silver | plan best a hired | best sizer damage | best TotalStack damage (comparable) |
|---|---|---|---|---|---|---|
| 14 S-97 the top of the burn ladder | 3 | 18 744 735 | 2.09 | 419 836 | 19 767 678 | — |
| 15 S-95 the band's damage yardstick | 3 | 18 744 735 | 2.09 | 419 836 | 19 767 678 | — |
