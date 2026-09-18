# The plan across the stages of 2026-09-18 — before, S-76, S-77, the put-back, the all-in tail, the shelter, the reference table, the tail on the repeated stops

Every figure is a four-march campaign from the benchmark snapshots in this folder (`benchmark-2026-09-18-NN-*.json`): the plan's hardest stop, its best stop a silver, its best stop a hired unit, the stops on the bar, and beside them the best sizer sequence and the best comparable answer from TotalStack's dataset (rows that field troop types the army does not hold are left out).

**No timing is compared across these rows.** Each snapshot carries the `planMs` of the machine it was taken on, and the 08 run was taken on a machine under a foreign job at 800 % CPU — its `planMs` are two to three times the 07 run's on the large scenarios, and so is the 07 *engine* re-timed on that same machine (the 2026-09-17 export at 7 000: 2 302 ms on the 07 engine against 1 733 on the 08 engine, best of three each, back to back). Read the damage columns; time the search on one machine at one sitting.

## first-run army, Bear V ×1 (20 000 leadership)

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

## first-run army, Bear V ×2 (20 000 leadership)

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

## first-run army, Bear V ×3 (20 000 leadership)

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

## first-run army, Bear V ×10 (20 000 leadership)

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

## first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)

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

## the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

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

## 2026-09-17 export, its setup (7 000 leadership)

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

## 2026-09-17 export, 12 000 leadership

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

## live account of 2026-09-18 (one hired type, 20 000 leadership)

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

## live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

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

