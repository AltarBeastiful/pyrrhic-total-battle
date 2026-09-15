# 46 — the bottom of the ladder

The hit schedule rises with kill position (`hits(p) = ceil(p/N) − [p ≡ 1 (mod N)]`, N = 4): for p = 1…12 it is 0 1 1 1 · 1 2 2 2 · 2 3 3 3. So the last stacks of the HP ladder strike the most and leadership spent **below** the mercenaries is the most productive in the march. 0015 tested only a token tail; this file measures it. Every number is `simulateBattle` through `evaluateCounts`; the score is `avgDamage` (procs excluded).

## 0. The three currencies (scenario C, then B)

A stack is worth `strikes(position) × count × damage-per-unit`. A march trades **HP per leadership** (what it costs to sit high enough to shelter the mercenaries) against **damage per leadership** (what each stack returns where it sits), at a **silver** price per unit (troops are recruited again every march; mercenaries cost no silver, only stock). `base/HP` is the ratio that decides the attack order: two stacks whose base damages cross while their HP order does not cost a strike.

**Scenario C**
| unit | pool | cost | HP / unit | damage / strike / unit | HP per leadership | damage per leadership | base / HP | silver / unit | stock cap |
|---|---|---|---|---|---|---|---|---|---|
| SW1 | leadership | 1 | 153 | 61 | 153 | 61 | 0.3301 | 300 | — |
| ARC1 | leadership | 1 | 392 | 179 | 392 | 179 | 0.3712 | 300 | — |
| SP1 | leadership | 1 | 392 | 165 | 392 | 165 | 0.3699 | 300 | — |
| RD1 | leadership | 2 | 783 | 355 | 392 | 178 | 0.3704 | 600 | — |
| ARC2 | leadership | 1 | 706 | 353 | 706 | 353 | 0.3710 | 500 | — |
| SP2 | leadership | 1 | 705 | 314 | 705 | 314 | 0.3702 | 500 | — |
| RD2 | leadership | 2 | 1,409 | 698 | 705 | 349 | 0.3705 | 1,000 | — |
| RD3 | leadership | 2 | 2,506 | 1,395 | 1,253 | 698 | 0.3703 | 1,400 | — |
| EMH6 | authority | 1 | 15,773 | 18,229 | 15,773 | 18,229 | 0.3719 | — | 92 |
| ABT6 | authority | 1 | 14,906 | 15,200 | 14,906 | 15,200 | 0.3709 | — | 76 |
| LGN6 | authority | 1 | 14,877 | 11,115 | 14,877 | 11,115 | 0.3704 | — | 72 |
| CHR6 | authority | 2 | 29,754 | 29,754 | 14,877 | 14,877 | 0.3704 | — | 37 |

Enemy-first strikes by position, N = 4: 0 1 1 1 1 2 2 2 2 3 3 3. A stack at position 8 returns 2 enemy-first strikes and 3 army-first — 2.5 strikes of average value, more than any stack above it.

**Scenario B**
| unit | pool | cost | HP / unit | damage / strike / unit | HP per leadership | damage per leadership | base / HP | silver / unit | stock cap |
|---|---|---|---|---|---|---|---|---|---|
| SW1 | leadership | 1 | 227 | 96 | 227 | 96 | 0.3767 | 300 | — |
| ARC1 | leadership | 1 | 365 | 178 | 365 | 178 | 0.3945 | 300 | — |
| SP1 | leadership | 1 | 365 | 163 | 365 | 163 | 0.3932 | 300 | — |
| RD1 | leadership | 2 | 729 | 352 | 365 | 176 | 0.3937 | 600 | — |
| ARC2 | leadership | 1 | 657 | 350 | 657 | 350 | 0.3945 | 500 | — |
| SP2 | leadership | 1 | 656 | 311 | 656 | 311 | 0.3938 | 500 | — |
| RD2 | leadership | 2 | 1,312 | 693 | 656 | 347 | 0.3938 | 1,000 | — |
| RD3 | leadership | 2 | 2,333 | 1,386 | 1,167 | 693 | 0.3937 | 1,400 | — |
| EMH6 | authority | 1 | 14,799 | 18,189 | 14,799 | 18,189 | 0.3937 | — | 92 |
| ABT6 | authority | 1 | 13,880 | 15,143 | 13,880 | 15,143 | 0.3942 | — | 76 |
| LGN6 | authority | 1 | 13,851 | 11,058 | 13,851 | 11,058 | 0.3937 | — | 72 |
| CHR6 | authority | 2 | 27,702 | 29,640 | 13,851 | 14,820 | 0.3937 | — | 37 |

Enemy-first strikes by position, N = 4: 0 1 1 1 1 2 2 2 2 3 3 3. A stack at position 8 returns 2 enemy-first strikes and 3 army-first — 2.5 strikes of average value, more than any stack above it.

## 1. The tail below the mercenaries — and the trap it falls into on a flat ladder

0015's best march is a **flat** ladder: ARC2 · RD2 · RD3 sized to the same HP, with the mercenaries just under the smallest of them. Flat, though, means their base damages are within 0.2 % of each other (the §0 table: the trio's base/HP are 0.3710 / 0.3705 / 0.3703), so which of RD2 and RD3 the attack order visits first is decided by the last unit — and when the attack order disagrees with the kill order the lower stack is wiped before its turn. 0015's construction, rebuilt here:

**C** — 0015's flat trio with an ARC1 tail:
| ARC1 tail | ladder in kill order | strikes lost | avg |
|---|---|---|---|
| 0 | RD2 848 · ARC2 1,692 · RD3 476 · EMH6 72 · ABT6 76 · CHR6 37 · LGN6 72 | 0 | 7,531,126 |
| 20 | ARC2 1,685 · RD2 844 · RD3 474 · ABT6 76 · EMH6 71 · CHR6 37 · LGN6 72 · ARC1 20 | 0 | 7,807,012 |
| 25 | ARC2 1,683 · RD3 474 · RD2 843 · ABT6 76 · EMH6 71 · CHR6 37 · LGN6 72 · ARC1 25 | 1 | 7,146,425 |
| 30 | ARC2 1,681 · RD2 842 · RD3 473 · ABT6 76 · EMH6 71 · CHR6 37 · LGN6 72 · ARC1 30 | 0 | 7,807,095 |
| 40 | ARC2 1,677 · RD2 840 · RD3 472 · ABT6 76 · EMH6 71 · CHR6 37 · LGN6 72 · ARC1 40 | 0 | 7,807,176 |
| 50 | ARC2 1,673 · RD2 838 · RD3 471 · ABT6 76 · EMH6 71 · CHR6 37 · LGN6 72 · ARC1 50 | 0 | 7,807,258 |
| 61 | ARC2 1,669 · RD2 836 · RD3 470 · ABT6 76 · EMH6 71 · CHR6 37 · LGN6 72 · ARC1 61 | 0 | 7,807,699 |
| 100 | ARC2 1,653 · RD2 828 · RD3 465 · ABT6 76 · EMH6 70 · LGN6 72 · CHR6 36 · ARC1 100 | 0 | 7,728,538 |
| 200 | RD2 809 · ARC2 1,614 · RD3 454 · ABT6 74 · EMH6 68 · LGN6 72 · CHR6 35 · ARC1 200 | 0 | 7,322,179 |
| 400 | RD2 770 · ARC2 1,536 · RD3 432 · LGN6 72 · ABT6 70 · EMH6 65 · CHR6 34 · ARC1 400 | 0 | 7,545,201 |
| 600 | RD2 731 · RD3 411 · ARC2 1,458 · LGN6 68 · ABT6 67 · EMH6 62 · CHR6 32 · ARC1 600 | 1 | 6,954,818 |

**B** — 0015's flat trio with an ARC1 tail:
| ARC1 tail | ladder in kill order | strikes lost | avg |
|---|---|---|---|
| 0 | ARC2 1,693 · RD2 847 · RD3 476 · ABT6 76 · EMH6 71 · CHR6 37 · LGN6 72 | 0 | 7,770,862 |
| 20 | RD2 844 · ARC2 1,685 · RD3 474 · ABT6 76 · EMH6 71 · CHR6 37 · LGN6 72 · ARC1 20 | 0 | 7,481,778 |
| 25 | RD2 843 · RD3 474 · ARC2 1,683 · ABT6 76 · EMH6 71 · CHR6 37 · LGN6 72 · ARC1 25 | 1 | 7,154,466 |
| 30 | RD2 842 · ARC2 1,681 · RD3 473 · ABT6 76 · EMH6 71 · CHR6 37 · LGN6 72 · ARC1 30 | 0 | 7,482,542 |
| 40 | RD2 840 · ARC2 1,677 · RD3 472 · ABT6 76 · EMH6 71 · CHR6 37 · LGN6 72 · ARC1 40 | 0 | 7,483,306 |
| 50 | RD2 838 · ARC2 1,673 · RD3 471 · ABT6 76 · EMH6 71 · CHR6 37 · LGN6 72 · ARC1 50 | 0 | 7,484,070 |
| 61 | RD2 836 · ARC2 1,669 · RD3 470 · ABT6 76 · EMH6 71 · CHR6 37 · LGN6 72 · ARC1 61 | 0 | 7,485,190 |
| 100 | ARC2 1,654 · RD2 828 · RD3 465 · ABT6 76 · EMH6 70 · LGN6 72 · CHR6 36 · ARC1 100 | 0 | 7,693,657 |
| 200 | ARC2 1,615 · RD2 808 · RD3 454 · ABT6 74 · EMH6 68 · LGN6 72 · CHR6 35 · ARC1 200 | 0 | 7,567,284 |
| 400 | ARC2 1,537 · RD2 769 · RD3 432 · LGN6 72 · ABT6 71 · EMH6 65 · CHR6 34 · ARC1 400 | 0 | 7,793,941 |
| 600 | ARC2 1,459 · RD2 730 · RD3 410 · LGN6 69 · ABT6 67 · EMH6 62 · CHR6 32 · ARC1 600 | 0 | 7,472,339 |

The 644 k drop between t = 25 and t = 50 is one lost strike of RD3 (its base damage slips below RD2's while its HP stays above). The fix is structural: sort the ladder by base-damage-per-HP descending and give the stacks strictly descending HP (`ladder()`, a 0.4 % step), which keeps the two orders together by construction. Every design below is built that way and re-checked against the engine's own journal (`strikes lost` = 0) before it is scored — a design that loses a strike is discarded, never reported. On the repaired ladder 0015's 7-type shape scores more than the flat one, so everything below counts from the **repaired** march.

**C — repaired 7-type baseline, mercenaries trimmed by simulation (tail 0):** ARC2 1,701 · RD2 847 · RD3 474 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 → 8,093,435 avg, 2,361,100 silver, 27 mercenaries lost, 4,343 leadership, 0 strikes lost.

**The tail's own value, with the mercenary vector frozen at the baseline** (so the only thing that moves is the tail and the sponges it displaces). The largest tail that still leaves every mercenary under the floor:

| tail type | best t | tail HP | avg | Δ vs tail 0 | Δ avg per tail unit | Δ silver |
|---|---|---|---|---|---|---|
| SW1 | 1 | 153 | 8,093,380 | -55 | -55.0 | -200 |
| ARC1 | 79 | 30,968 | 8,094,257 | 822 | 10.4 | -19,000 |
| SP1 | 6 | 2,352 | 8,094,004 | 569 | 94.8 | -1,200 |
| RD1 | 3 | 2,349 | 8,094,160 | 725 | 241.7 | -1,200 |
| SP2 | 198 | 139,590 | 8,147,522 | 54,087 | 273.2 | -8,400 |

**The tail with everything re-fitted** (sponges rebuilt at the remaining leadership, mercenaries re-sized under the smaller floor, best integer tail count per type):

| tail type | best t | avg | Δ vs tail 0 | silver | Δ silver | mercs lost | merc pos. | tail HP |
|---|---|---|---|---|---|---|---|---|
| SP2 | 246 | 8,159,844 | 66,409 | 2,350,300 | -10,800 | 27 | 2–7 | 173,430 |
| ARC1 | 207 | 8,094,268 | 833 | 2,310,900 | -50,200 | 27 | 3–7 | 81,144 |
| RD1 | 44 | 8,093,894 | 459 | 2,339,900 | -21,200 | 27 | 4–7 | 34,452 |
| SP1 | 49 | 8,092,590 | -845 | 2,349,300 | -11,800 | 27 | 4–7 | 19,208 |
| SW1 | 43 | 8,083,077 | -10,358 | 2,350,500 | -10,600 | 27 | 4–7 | 6,579 |

**Best tail (C):** SP2 246 → 8,159,844 (66,409 over the tail-0 baseline, 0.82 %).

Read the two tables together. **A tail is the only lever on this account that raises damage and *lowers* silver at the same time**: the leadership it takes away from the sponges is tier-2/3 leadership (500–1,400 silver a unit), the leadership it puts back is tier-1 (300–500), and it sits at the last position, where the strike count is highest. Against the no-tail optimum the same family gains ~0.8 % and saves ~10 k silver; against the same leadership spent as a fourth sponge it wins by 8–9 %, because a fourth sponge drops the floor and every mercenary stack with it.

**Same 4,343 leadership as one more flat sponge in front of the mercenaries:** ARC2 1,226 · LGN6 58 · RD2 611 · RD3 342 · SP2 1,211 · EMH6 54 · ABT6 57 · CHR6 28 → 7,512,992 avg (646,852 below the tail, 8.61 %), 2,308,300 silver, 21 mercenaries lost.

The winning tail type's curve (every 25th point, plus the optimum):
| t | ladder in kill order | avg | silver | mercs lost |
|---|---|---|---|---|
| 1 | ARC2 1,700 · RD2 847 · RD3 474 · CHR6 37 · LGN6 72 · ABT6 71 · EMH6 66 · SP2 1 | 8,019,236 | 2,361,100 | 27 |
| 26 | ARC2 1,691 · RD2 842 · RD3 471 · CHR6 37 · LGN6 72 · ABT6 71 · EMH6 66 · SP2 26 | 8,025,677 | 2,359,900 | 27 |
| 51 | ARC2 1,680 · RD2 837 · RD3 469 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 51 | 8,107,808 | 2,359,100 | 27 |
| 76 | ARC2 1,671 · RD2 832 · RD3 466 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 76 | 8,114,249 | 2,357,900 | 27 |
| 101 | ARC2 1,662 · RD2 827 · RD3 463 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 101 | 8,120,688 | 2,356,700 | 27 |
| 126 | ARC2 1,651 · RD2 823 · RD3 460 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 126 | 8,127,474 | 2,355,500 | 27 |
| 151 | ARC2 1,640 · RD2 818 · RD3 458 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 151 | 8,134,955 | 2,354,700 | 27 |
| 176 | ARC2 1,631 · RD2 813 · RD3 455 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 176 | 8,141,396 | 2,353,500 | 27 |
| 201 | ARC2 1,622 · RD2 808 · ABT6 76 · RD3 452 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 201 | 8,147,834 | 2,352,300 | 27 |
| 226 | ARC2 1,613 · ABT6 76 · RD2 803 · RD3 449 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 226 | 8,154,275 | 2,351,100 | 27 |
| 246 | ARC2 1,605 · ABT6 76 · RD2 799 · RD3 447 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 246 | 8,159,844 | 2,350,300 | 27 |
| 251 | ARC2 1,602 · RD2 798 · RD3 447 · ABT6 75 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 251 | 8,146,556 | 2,350,300 | 27 |
| 276 | ARC2 1,593 · ABT6 75 · RD2 793 · RD3 444 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 276 | 8,152,997 | 2,349,100 | 27 |
| 301 | ARC2 1,584 · ABT6 75 · RD2 788 · RD3 441 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 301 | 8,159,436 | 2,347,900 | 27 |
| 326 | ARC2 1,573 · RD2 783 · RD3 439 · ABT6 73 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 326 | 8,136,519 | 2,347,100 | 27 |
| 351 | ARC2 1,562 · RD2 779 · RD3 436 · ABT6 73 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 351 | 8,143,304 | 2,345,900 | 27 |
| 376 | ARC2 1,553 · RD2 774 · ABT6 73 · RD3 433 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 376 | 8,149,745 | 2,344,700 | 27 |
| 401 | ARC2 1,544 · ABT6 73 · RD2 769 · RD3 430 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 401 | 8,156,184 | 2,343,500 | 27 |
| 426 | ARC2 1,533 · RD2 764 · ABT6 72 · RD3 428 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 426 | 8,148,467 | 2,342,700 | 27 |
| 451 | ARC2 1,524 · ABT6 72 · LGN6 72 · RD2 759 · RD3 425 · EMH6 67 · CHR6 35 · SP2 451 | 8,095,398 | 2,341,500 | 27 |
| 476 | ARC2 1,515 · RD2 754 · ABT6 71 · RD3 422 · LGN6 71 · CHR6 35 · EMH6 65 · SP2 476 | 8,002,605 | 2,340,300 | 27 |
| 501 | ARC2 1,506 · ABT6 71 · LGN6 71 · RD2 749 · RD3 419 · CHR6 35 · EMH6 65 · SP2 501 | 8,009,045 | 2,339,100 | 27 |
| 526 | ARC2 1,495 · RD2 744 · RD3 417 · LGN6 70 · CHR6 35 · ABT6 69 · EMH6 65 · SP2 526 | 7,982,422 | 2,338,300 | 25 |
| 551 | ARC2 1,484 · ABT6 70 · RD2 740 · LGN6 70 · RD3 414 · EMH6 65 · CHR6 34 · SP2 551 | 7,937,489 | 2,337,100 | 25 |
| 576 | ARC2 1,475 · RD2 735 · RD3 411 · LGN6 69 · ABT6 68 · CHR6 34 · EMH6 63 · SP2 576 | 7,829,496 | 2,335,900 | 25 |
| 601 | ARC2 1,466 · RD2 730 · LGN6 69 · RD3 408 · ABT6 68 · CHR6 34 · EMH6 63 · SP2 601 | 7,835,936 | 2,334,700 | 25 |
| 626 | ARC2 1,455 · LGN6 69 · RD2 725 · RD3 406 · ABT6 68 · EMH6 64 · CHR6 33 · SP2 626 | 7,820,370 | 2,333,900 | 25 |
| 651 | ARC2 1,446 · RD2 720 · LGN6 68 · CHR6 34 · RD3 403 · ABT6 67 · EMH6 63 · SP2 651 | 7,830,307 | 2,332,700 | 25 |
| 676 | ARC2 1,437 · ABT6 68 · LGN6 68 · RD2 715 · RD3 400 · EMH6 63 · CHR6 33 · SP2 676 | 7,785,675 | 2,331,500 | 25 |
| 701 | ARC2 1,426 · RD2 710 · ABT6 67 · RD3 398 · LGN6 67 · CHR6 33 · EMH6 61 · SP2 701 | 7,693,924 | 2,330,700 | 25 |
| 726 | ARC2 1,417 · ABT6 67 · LGN6 67 · RD2 705 · RD3 395 · CHR6 33 · EMH6 61 · SP2 726 | 7,700,364 | 2,329,500 | 25 |
| 751 | ARC2 1,406 · RD2 701 · ABT6 66 · RD3 392 · LGN6 66 · CHR6 33 · EMH6 61 · SP2 751 | 7,680,833 | 2,328,300 | 25 |
| 776 | ARC2 1,397 · ABT6 66 · LGN6 66 · RD2 696 · RD3 389 · EMH6 61 · CHR6 32 · SP2 776 | 7,627,766 | 2,327,100 | 25 |
| 801 | ARC2 1,386 · RD2 691 · RD3 387 · LGN6 65 · ABT6 64 · CHR6 32 · EMH6 60 · SP2 801 | 7,557,274 | 2,326,300 | 24 |
| 826 | ARC2 1,377 · ABT6 65 · LGN6 65 · RD2 686 · RD3 384 · EMH6 61 · CHR6 32 · SP2 826 | 7,615,373 | 2,325,100 | 25 |
| 851 | ARC2 1,368 · RD2 681 · RD3 381 · LGN6 64 · CHR6 32 · EMH6 60 · ABT6 63 · SP2 851 | 7,549,310 | 2,323,900 | 24 |
| 876 | ARC2 1,359 · ABT6 64 · RD2 676 · LGN6 64 · RD3 378 · EMH6 60 · CHR6 31 · SP2 876 | 7,505,972 | 2,322,700 | 24 |
| 901 | ARC2 1,348 · RD2 671 · RD3 376 · ABT6 63 · LGN6 63 · EMH6 59 · CHR6 31 · SP2 901 | 7,450,679 | 2,321,900 | 24 |
| 926 | ARC2 1,339 · ABT6 63 · RD2 666 · LGN6 63 · RD3 373 · EMH6 59 · CHR6 31 · SP2 926 | 7,457,121 | 2,320,700 | 24 |
| 951 | ARC2 1,328 · LGN6 63 · RD2 662 · RD3 370 · ABT6 62 · CHR6 31 · EMH6 58 · SP2 951 | 7,412,245 | 2,319,500 | 24 |
| 976 | ARC2 1,319 · RD2 657 · ABT6 62 · LGN6 62 · RD3 367 · EMH6 58 · CHR6 30 · SP2 976 | 7,348,063 | 2,318,300 | 23 |
| 1,001 | ARC2 1,308 · LGN6 62 · CHR6 31 · RD2 652 · RD3 365 · ABT6 61 · EMH6 57 · SP2 1,001 | 7,368,220 | 2,317,500 | 24 |
| 1,026 | ARC2 1,299 · RD2 647 · ABT6 61 · LGN6 61 · RD3 362 · EMH6 57 · CHR6 30 · SP2 1,026 | 7,299,212 | 2,316,300 | 23 |
| 1,051 | ARC2 1,290 · ABT6 61 · LGN6 61 · RD2 642 · RD3 359 · EMH6 57 · CHR6 30 · SP2 1,051 | 7,305,651 | 2,315,100 | 23 |
| 1,076 | ARC2 1,279 · RD2 637 · RD3 357 · LGN6 60 · CHR6 30 · EMH6 56 · ABT6 59 · SP2 1,076 | 7,239,339 | 2,314,300 | 21 |
| 1,101 | LGN6 72 · CHR6 36 · ARC2 1,270 · RD2 632 · RD3 354 · EMH6 56 · ABT6 59 · SP2 1,101 | 7,381,570 | 2,313,100 | 24 |
| 1,126 | LGN6 72 · CHR6 36 · ARC2 1,261 · RD2 627 · RD3 351 · ABT6 59 · EMH6 55 · SP2 1,126 | 7,349,965 | 2,311,900 | 24 |

**B — repaired 7-type baseline, mercenaries trimmed by simulation (tail 0):** ARC2 1,701 · RD2 847 · RD3 474 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 → 8,059,929 avg, 2,361,100 silver, 27 mercenaries lost, 4,343 leadership, 0 strikes lost.

**The tail's own value, with the mercenary vector frozen at the baseline** (so the only thing that moves is the tail and the sponges it displaces). The largest tail that still leaves every mercenary under the floor:

| tail type | best t | tail HP | avg | Δ vs tail 0 | Δ avg per tail unit | Δ silver |
|---|---|---|---|---|---|---|
| SW1 | 1 | 227 | 8,059,946 | 17 | 17.0 | -200 |
| ARC1 | 88 | 32,120 | 8,060,617 | 688 | 7.8 | -21,200 |
| SP1 | 5 | 1,825 | 8,060,341 | 412 | 82.4 | -1,000 |
| RD1 | 21 | 15,309 | 8,060,476 | 547 | 26.0 | -10,000 |
| SP2 | 197 | 129,232 | 8,113,018 | 53,089 | 269.5 | -8,400 |

**The tail with everything re-fitted** (sponges rebuilt at the remaining leadership, mercenaries re-sized under the smaller floor, best integer tail count per type):

| tail type | best t | avg | Δ vs tail 0 | silver | Δ silver | mercs lost | merc pos. | tail HP |
|---|---|---|---|---|---|---|---|---|
| SP2 | 243 | 8,125,351 | 65,422 | 2,350,700 | -10,400 | 27 | 2–7 | 159,408 |
| ARC1 | 88 | 8,060,617 | 688 | 2,339,900 | -21,200 | 27 | 4–7 | 32,120 |
| RD1 | 44 | 8,060,353 | 424 | 2,339,900 | -21,200 | 27 | 4–7 | 32,076 |
| SP1 | 68 | 8,058,488 | -1,441 | 2,344,700 | -16,400 | 27 | 4–7 | 24,820 |
| SW1 | 63 | 8,049,572 | -10,357 | 2,345,700 | -15,400 | 27 | 4–7 | 14,301 |

**Best tail (B):** SP2 243 → 8,125,351 (65,422 over the tail-0 baseline, 0.81 %).

Read the two tables together. **A tail is the only lever on this account that raises damage and *lowers* silver at the same time**: the leadership it takes away from the sponges is tier-2/3 leadership (500–1,400 silver a unit), the leadership it puts back is tier-1 (300–500), and it sits at the last position, where the strike count is highest. Against the no-tail optimum the same family gains ~0.8 % and saves ~10 k silver; against the same leadership spent as a fourth sponge it wins by 8–9 %, because a fourth sponge drops the floor and every mercenary stack with it.

**Same 4,343 leadership as one more flat sponge in front of the mercenaries:** ARC2 1,227 · LGN6 58 · RD2 610 · SP2 1,216 · RD3 340 · ABT6 57 · EMH6 53 · CHR6 28 → 7,442,801 avg (682,550 below the tail, 9.17 %), 2,307,500 silver, 21 mercenaries lost.

The winning tail type's curve (every 25th point, plus the optimum):
| t | ladder in kill order | avg | silver | mercs lost |
|---|---|---|---|---|
| 1 | ARC2 1,700 · RD2 847 · RD3 474 · CHR6 37 · LGN6 72 · EMH6 67 · ABT6 71 · SP2 1 | 8,022,414 | 2,361,100 | 27 |
| 26 | ARC2 1,691 · RD2 842 · RD3 471 · CHR6 37 · LGN6 72 · EMH6 67 · ABT6 71 · SP2 26 | 8,028,788 | 2,359,900 | 27 |
| 51 | ARC2 1,680 · RD2 837 · RD3 469 · ABT6 76 · CHR6 37 · EMH6 69 · LGN6 72 · SP2 51 | 7,905,687 | 2,359,100 | 27 |
| 76 | ARC2 1,671 · RD2 832 · RD3 466 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 76 | 8,080,531 | 2,357,900 | 27 |
| 101 | ARC2 1,662 · RD2 827 · RD3 463 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 101 | 8,086,903 | 2,356,700 | 27 |
| 126 | ARC2 1,653 · RD2 822 · RD3 460 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 126 | 8,093,276 | 2,355,500 | 27 |
| 151 | ARC2 1,642 · RD2 817 · RD3 458 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 151 | 8,100,684 | 2,354,700 | 27 |
| 176 | ARC2 1,631 · RD2 813 · RD3 455 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 176 | 8,107,400 | 2,353,500 | 27 |
| 201 | ARC2 1,622 · RD2 808 · ABT6 76 · RD3 452 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 201 | 8,113,772 | 2,352,300 | 27 |
| 226 | ARC2 1,613 · ABT6 76 · RD2 803 · RD3 449 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 226 | 8,120,145 | 2,351,100 | 27 |
| 243 | ARC2 1,606 · ABT6 76 · RD2 799 · RD3 448 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 243 | 8,125,351 | 2,350,700 | 27 |
| 251 | ARC2 1,602 · RD2 798 · RD3 447 · ABT6 75 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 251 | 8,112,410 | 2,350,300 | 27 |
| 276 | ARC2 1,593 · ABT6 75 · RD2 793 · RD3 444 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 276 | 8,118,783 | 2,349,100 | 27 |
| 301 | ARC2 1,584 · RD2 788 · RD3 441 · ABT6 74 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 301 | 8,110,013 | 2,347,900 | 27 |
| 326 | ARC2 1,575 · RD2 783 · RD3 438 · ABT6 73 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 326 | 8,101,243 | 2,346,700 | 27 |
| 351 | ARC2 1,564 · ABT6 74 · RD2 778 · RD3 436 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 351 | 8,123,794 | 2,345,900 | 27 |
| 376 | ARC2 1,553 · RD2 774 · ABT6 73 · RD3 433 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 376 | 8,115,367 | 2,344,700 | 27 |
| 401 | ARC2 1,544 · ABT6 73 · RD2 769 · RD3 430 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 401 | 8,121,739 | 2,343,500 | 27 |
| 426 | ARC2 1,533 · RD2 764 · ABT6 72 · RD3 428 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 426 | 8,114,005 | 2,342,700 | 27 |
| 451 | ARC2 1,524 · ABT6 72 · LGN6 72 · RD2 759 · RD3 425 · EMH6 66 · CHR6 35 · SP2 451 | 8,024,719 | 2,341,500 | 27 |
| 476 | ARC2 1,515 · RD2 754 · ABT6 71 · RD3 422 · LGN6 71 · EMH6 66 · CHR6 35 · SP2 476 | 8,004,891 | 2,340,300 | 27 |
| 501 | ARC2 1,506 · ABT6 71 · LGN6 71 · RD2 749 · RD3 419 · EMH6 66 · CHR6 35 · SP2 501 | 8,011,264 | 2,339,100 | 27 |
| 526 | ARC2 1,495 · RD2 744 · RD3 417 · LGN6 70 · CHR6 35 · EMH6 65 · ABT6 69 · SP2 526 | 7,948,417 | 2,338,300 | 25 |
| 551 | ARC2 1,486 · ABT6 70 · RD2 739 · RD3 414 · LGN6 69 · EMH6 64 · CHR6 34 · SP2 551 | 7,855,750 | 2,337,100 | 25 |
| 576 | ARC2 1,477 · LGN6 70 · CHR6 35 · RD2 734 · RD3 411 · ABT6 69 · EMH6 64 · SP2 576 | 7,924,785 | 2,335,900 | 25 |
| 601 | ARC2 1,466 · RD2 730 · LGN6 69 · RD3 408 · ABT6 68 · CHR6 34 · EMH6 63 · SP2 601 | 7,802,175 | 2,334,700 | 25 |
| 626 | ARC2 1,455 · LGN6 69 · RD2 725 · RD3 406 · ABT6 68 · CHR6 34 · EMH6 63 · SP2 626 | 7,809,583 | 2,333,900 | 25 |
| 651 | ARC2 1,446 · RD2 720 · LGN6 68 · CHR6 34 · RD3 403 · EMH6 63 · ABT6 67 · SP2 651 | 7,796,576 | 2,332,700 | 25 |
| 676 | ARC2 1,437 · ABT6 68 · LGN6 68 · RD2 715 · RD3 400 · EMH6 63 · CHR6 33 · SP2 676 | 7,751,990 | 2,331,500 | 25 |
| 701 | ARC2 1,426 · RD2 710 · ABT6 67 · RD3 398 · LGN6 67 · EMH6 62 · CHR6 33 · SP2 701 | 7,696,822 | 2,330,700 | 25 |
| 726 | ARC2 1,417 · ABT6 67 · LGN6 67 · RD2 705 · RD3 395 · EMH6 62 · CHR6 33 · SP2 726 | 7,703,194 | 2,329,500 | 25 |
| 751 | ARC2 1,408 · RD2 700 · ABT6 66 · RD3 392 · LGN6 66 · CHR6 33 · EMH6 61 · SP2 751 | 7,646,988 | 2,328,300 | 25 |
| 776 | ARC2 1,399 · ABT6 66 · LGN6 66 · RD2 695 · RD3 389 · EMH6 61 · CHR6 32 · SP2 776 | 7,594,080 | 2,327,100 | 25 |
| 801 | ARC2 1,386 · RD2 691 · RD3 387 · LGN6 65 · ABT6 64 · EMH6 60 · CHR6 32 · SP2 801 | 7,524,110 | 2,326,300 | 24 |
| 826 | ARC2 1,377 · ABT6 65 · LGN6 65 · RD2 686 · RD3 384 · EMH6 60 · CHR6 32 · SP2 826 | 7,545,625 | 2,325,100 | 24 |
| 851 | ARC2 1,368 · RD2 681 · RD3 381 · LGN6 64 · CHR6 32 · ABT6 63 · EMH6 59 · SP2 851 | 7,479,806 | 2,323,900 | 24 |
| 876 | ARC2 1,359 · ABT6 64 · RD2 676 · LGN6 64 · RD3 378 · EMH6 59 · CHR6 31 · SP2 876 | 7,436,512 | 2,322,700 | 24 |
| 901 | ARC2 1,348 · RD2 671 · RD3 376 · ABT6 63 · LGN6 63 · CHR6 31 · EMH6 58 · SP2 901 | 7,381,342 | 2,321,900 | 24 |
| 926 | ARC2 1,339 · ABT6 63 · RD2 666 · LGN6 63 · RD3 373 · CHR6 31 · EMH6 58 · SP2 926 | 7,387,714 | 2,320,700 | 24 |
| 951 | ARC2 1,330 · LGN6 63 · RD2 661 · RD3 370 · ABT6 62 · CHR6 31 · EMH6 58 · SP2 951 | 7,378,944 | 2,319,500 | 24 |
| 976 | ARC2 1,321 · RD2 656 · LGN6 62 · CHR6 31 · RD3 367 · ABT6 61 · EMH6 57 · SP2 976 | 7,327,622 | 2,318,300 | 24 |
| 1,001 | ARC2 1,308 · LGN6 62 · CHR6 31 · RD2 652 · RD3 365 · ABT6 61 · EMH6 57 · SP2 1,001 | 7,335,374 | 2,317,500 | 24 |
| 1,026 | ARC2 1,299 · RD2 647 · ABT6 61 · LGN6 61 · RD3 362 · EMH6 57 · CHR6 30 · SP2 1,026 | 7,266,525 | 2,316,300 | 23 |
| 1,051 | ARC2 1,290 · ABT6 61 · LGN6 61 · RD2 642 · RD3 359 · CHR6 30 · EMH6 56 · SP2 1,051 | 7,236,520 | 2,315,100 | 23 |
| 1,076 | ARC2 1,279 · RD2 637 · RD3 357 · LGN6 60 · CHR6 30 · EMH6 56 · ABT6 59 · SP2 1,076 | 7,206,821 | 2,314,300 | 21 |
| 1,101 | ARC2 1,270 · ABT6 60 · LGN6 60 · RD2 632 · RD3 354 · EMH6 55 · CHR6 29 · SP2 1,101 | 7,128,442 | 2,313,100 | 21 |
| 1,126 | LGN6 72 · CHR6 36 · ARC2 1,261 · RD2 627 · RD3 351 · EMH6 55 · ABT6 58 · SP2 1,126 | 7,286,089 | 2,311,900 | 24 |

## 2. Interleaving — k mercenary stacks above the troops (k = 0…4)

The ladder is sorted by HP, so which stack sits at which position is decided by how many units each stack holds. Here `k` mercenary stacks are taken at their **stock cap** and put on top (authority 2,000 never binds: the four caps are 314 authority in all), the troops form a repaired ladder at the full 4,343 leadership, and the other 4−k mercenaries sit under the troop floor. Every non-empty subset of the eight troop types and all 2^k splits are tried (15 splits × 255 subsets × 2 scenarios), then a mercenary-only ascent on each winner; a row is listed only when the engine really puts the k mercenaries above every troop stack.

| scenario | k | stacks | avg | vs k=0 | silver | mercs lost | march |
|---|---|---|---|---|---|---|---|
| C | 0 | 7 | 8,018,785 | 0 | 2,361,100 | 27 | ARC2 1,701 · RD2 847 · RD3 474 · CHR6 37 · LGN6 72 · ABT6 71 · EMH6 66 |
| C | 1 | 7 | 7,649,092 | -369,693 | 2,361,100 | 30 | EMH6 92 · ARC2 1,701 · RD2 847 · RD3 474 · ABT6 76 · CHR6 37 · LGN6 72 |
| C | 2 | 7 | 7,343,040 | -675,745 | 2,171,500 | 26 | LGN6 72 · CHR6 36 · ARC2 1,453 · RD2 724 · SP2 1,442 · ABT6 68 · EMH6 64 |
| C | 3 | 8 | 6,986,052 | -1,032,733 | 2,308,300 | 28 | EMH6 92 · CHR6 37 · LGN6 72 · ARC2 1,226 · RD2 611 · RD3 342 · SP2 1,211 · ABT6 55 |
| C | 4 | 8 | 6,895,974 | -1,122,811 | 2,308,300 | 30 | EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · ARC2 1,226 · RD2 611 · RD3 342 · SP2 1,211 |
| B | 0 | 7 | 8,021,967 | 0 | 2,361,100 | 27 | ARC2 1,701 · RD2 847 · RD3 474 · CHR6 37 · LGN6 72 · EMH6 67 · ABT6 71 |
| B | 1 | 7 | 7,612,530 | -409,437 | 2,361,100 | 30 | EMH6 92 · ARC2 1,701 · RD2 847 · RD3 474 · ABT6 76 · CHR6 37 · LGN6 72 |
| B | 2 | 8 | 7,038,498 | -983,469 | 2,307,500 | 24 | CHR6 37 · LGN6 72 · ARC2 1,226 · SP2 1,221 · RD2 608 · RD3 340 · ABT6 55 · EMH6 51 |
| B | 3 | 8 | 6,989,609 | -1,032,358 | 2,307,500 | 28 | EMH6 92 · CHR6 37 · LGN6 72 · ARC2 1,226 · SP2 1,221 · RD2 608 · RD3 340 · ABT6 55 |
| B | 4 | 8 | 6,854,966 | -1,167,001 | 2,307,500 | 30 | EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · ARC2 1,226 · SP2 1,221 · RD2 608 · RD3 340 |

## 2b. The order of the four mercenary stacks

Below three sponges the mercenary positions are 4, 5, 6, 7 with enemy-first strike counts 1, 1, 2, 2 — position 5 is ≡ 1 (mod 4) and loses a strike. The HP ladder decides the position and a stack's HP is its count, so pushing a type down means shrinking it. Below: for each of the 24 assignments of the four mercenaries to the four HP ranks (rank 1 = biggest stack = position 4) the stack is sized at 5 ceiling fractions, and the best of each assignment is refined by a 600-evaluation ascent on the four counts. The last column is what the solve actually left — every row that reaches the best basin converges on the same ladder, which is the point: it is not the seed that matters, it is which mercenary ends up smallest.

| scenario | seed assignment (biggest → smallest HP) | avg | vs best | strikes lost | mercs lost | what the solve produced |
|---|---|---|---|---|---|---|
| C | EMH6 > LGN6 > CHR6 > ABT6 | 8,093,435 | 0 | 0 | 27 | ABT6 76 = 1,132,856 · LGN6 72 = 1,071,144 · CHR6 36 = 1,071,144 · EMH6 67 = 1,056,791 |
| C | ABT6 > LGN6 > EMH6 > CHR6 | 8,093,435 | 0 | 0 | 27 | ABT6 76 = 1,132,856 · LGN6 72 = 1,071,144 · CHR6 36 = 1,071,144 · EMH6 67 = 1,056,791 |
| C | ABT6 > LGN6 > CHR6 > EMH6 | 8,093,435 | 0 | 0 | 27 | ABT6 76 = 1,132,856 · LGN6 72 = 1,071,144 · CHR6 36 = 1,071,144 · EMH6 67 = 1,056,791 |
| C | CHR6 > ABT6 > LGN6 > EMH6 | 7,925,243 | -168,192 | 0 | 27 | ABT6 76 = 1,132,856 · CHR6 37 = 1,100,898 · EMH6 69 = 1,088,337 · LGN6 72 = 1,071,144 |
| B | EMH6 > LGN6 > CHR6 > ABT6 | 8,059,929 | 0 | 0 | 27 | ABT6 76 = 1,054,880 · LGN6 72 = 997,272 · CHR6 36 = 997,272 · EMH6 67 = 991,533 |
| B | ABT6 > LGN6 > EMH6 > CHR6 | 8,059,929 | 0 | 0 | 27 | ABT6 76 = 1,054,880 · LGN6 72 = 997,272 · CHR6 36 = 997,272 · EMH6 67 = 991,533 |
| B | ABT6 > LGN6 > CHR6 > EMH6 | 8,059,929 | 0 | 0 | 27 | ABT6 76 = 1,054,880 · LGN6 72 = 997,272 · CHR6 36 = 997,272 · EMH6 67 = 991,533 |
| B | CHR6 > ABT6 > LGN6 > EMH6 | 7,891,459 | -168,470 | 0 | 27 | ABT6 76 = 1,054,880 · CHR6 37 = 1,024,974 · EMH6 69 = 1,021,131 · LGN6 72 = 997,272 |

The best basin is always the same ladder — **ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67**, so the strongest stack per strike (EMH6) is the *smallest* and dies last, with the two-strike positions 6 and 7 — and the second basin, which leaves EMH6 third, is 168 k behind (2.1 %). Note what the winner does *not* do: put the weakest mercenary (LGN6, 11 k a strike) on the round opener. It cannot — LGN6's stock cap is 72, i.e. 1,071,144 HP, below ABT6's cap of 1,132,856 — so ABT6 takes position 4. The rule that survives the caps is "the strongest per strike must be the smallest stack", not "the weakest must be the biggest".

## 3. The last 1,000 leadership, with tails allowed

0015 §6.2 concluded that extra leadership is the worst buy on this account (0.22–0.65 damage per silver, `21-leadership-curve`) — but that curve was measured on **sponges**, whose leadership only raises the floor. Here the budget itself is swept in steps of 1,000 and the §1 family (tail + trio + mercenaries) is re-optimised at every step: best tail type, best integer tail count, every design repaired and checked for lost strikes. The row at 4,343 is the value of the last 1,000 leadership (2,343 → 3,343 → 4,343; the rows above 4,343 show what the next 1,000 would buy).

**Scenario C**
| leadership | best design | avg | silver | Δ avg / 1,000 L | Δ silver / 1,000 L | damage / silver | mercs lost |
|---|---|---|---|---|---|---|---|
| 2,343 | EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · ARC2 912 · RD2 454 · RD3 254 · SP2 15 | 5,569,019 | 1,273,100 | — | — | — | 30 |
| 3,343 | EMH6 92 · LGN6 72 · ARC2 1,305 · RD2 650 · RD3 364 · ABT6 61 · CHR6 30 · SP2 10 | 6,706,972 | 1,817,100 | 1,137,953 | 544,000 | 2.09 | 28 |
| 4,343 | ARC2 1,599 · RD2 796 · ABT6 75 · RD3 446 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 260 | 8,148,889 | 2,349,900 | 1,441,917 | 532,800 | 2.71 | 27 |

**Scenario B**
| leadership | best design | avg | silver | Δ avg / 1,000 L | Δ silver / 1,000 L | damage / silver | mercs lost |
|---|---|---|---|---|---|---|---|
| 2,343 | EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · ARC2 917 · RD2 457 · RD3 256 | 5,544,281 | 1,273,900 | — | — | — | 30 |
| 3,343 | LGN6 72 · CHR6 36 · ARC2 1,309 · RD2 652 · RD3 365 · ABT6 61 · EMH6 57 | 6,801,959 | 1,817,500 | 1,257,678 | 543,600 | 2.31 | 25 |
| 4,343 | ARC2 1,591 · ABT6 75 · RD2 792 · RD3 444 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 280 | 8,120,232 | 2,349,100 | 1,318,273 | 531,600 | 2.48 | 27 |

## 4. Global search over all twelve types (a check on the families)

Seeds: the app's own sizer on the 7-type and on the 8-type set, 0015's best mercenary vector, the §1 winner and the §2 winner. Each is climbed over all twelve types (multi-scale steps 80…1) and then given 10 iterated-local-search restarts (perturb three counts by up to ±60, re-climb). Every winner is re-checked for feasibility and lost strikes. These are best-found numbers, not proven optima: the climb is a coordinate ascent, so a seed can stall in a different basin (the app's own sizer stalls about 3 % low, which is why the structured ladder exists at all).

| scenario | seed | best found | avg | silver | mercs lost | strikes lost | leadership |
|---|---|---|---|---|---|---|---|
| C | sizer ms, 7 types | ARC2 1,697 · RD2 848 · RD3 475 · EMH6 75 · ABT6 76 · CHR6 37 · LGN6 72 | 7,879,075 | 2,361,500 | 28 | 0 | 4,343 |
| C | sizer ms, all 8 troops | EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · ARC1 657 · SP1 576 · RD1 288 · ARC2 318 · SP2 318 · RD2 159 · RD3 89 · SW1 1,402 | 5,790,786 | 1,564,900 | 30 | 0 | 4,343 |
| C | 0015's best merc vector | ARC2 1,697 · RD2 848 · RD3 475 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 | 8,094,822 | 2,361,500 | 27 | 0 | 4,343 |
| C | §2 winner (best k) | ARC2 1,701 · RD2 847 · RD3 474 · CHR6 37 · LGN6 72 · ABT6 71 · EMH6 66 | 8,018,785 | 2,361,100 | 27 | 0 | 4,343 |
| C | §1 winner (tail) | ARC2 1,605 · ABT6 76 · RD2 799 · RD3 447 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 246 | 8,159,844 | 2,350,300 | 27 | 0 | 4,343 |
| B | sizer ms, 7 types | ARC2 1,697 · RD2 848 · RD3 475 · ABT6 76 · CHR6 37 · EMH6 69 · LGN6 72 | 7,892,838 | 2,361,500 | 27 | 0 | 4,343 |
| B | sizer ms, all 8 troops | EMH6 92 · ABT6 76 · CHR6 37 · LGN6 72 · SP2 445 · ARC1 741 · RD3 112 · SP1 660 · SW1 1,026 · RD2 172 · ARC2 325 · RD1 289 | 6,007,659 | 1,615,300 | 30 | 0 | 4,343 |
| B | 0015's best merc vector | ARC2 1,697 · RD2 848 · RD3 475 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 | 8,061,308 | 2,361,500 | 27 | 0 | 4,343 |
| B | §2 winner (best k) | ARC2 1,701 · RD2 847 · RD3 474 · CHR6 37 · LGN6 72 · EMH6 67 · ABT6 71 | 8,021,967 | 2,361,100 | 27 | 0 | 4,343 |
| B | §1 winner (tail) | ARC2 1,606 · ABT6 76 · RD2 799 · RD3 448 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 243 | 8,125,351 | 2,350,700 | 27 | 0 | 4,343 |

**C — best found anywhere:** ARC2 1,605 · ABT6 76 · RD2 799 · RD3 447 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 246

| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | ARC2 | 1,605 | 1,133,130 | 566,244 | 420,349 | 0/1 | 0 | 566,244 |
| 2 | ABT6 | 76 | 1,132,856 | 1,155,200 | 420,204 | 1/1 | 1,155,200 | 1,155,200 |
| 3 | RD2 | 799 | 1,125,791 | 558,022 | 417,078 | 1/1 | 558,022 | 558,022 |
| 4 | RD3 | 447 | 1,120,182 | 623,654 | 414,816 | 1/1 | 623,654 | 623,654 |
| 5 | LGN6 | 72 | 1,071,144 | 800,280 | 396,720 | 1/1 | 800,280 | 800,280 |
| 6 | CHR6 | 36 | 1,071,144 | 1,071,144 | 396,720 | 2/2 | 2,142,288 | 2,142,288 |
| 7 | EMH6 | 67 | 1,056,791 | 1,221,370 | 393,069 | 2/2 | 2,442,740 | 2,442,740 |
| 8 | SP2 | 246 | 173,430 | 77,269 | 64,206 | 2/2 | 154,538 | 154,538 |

min 7,876,722 · avg 8,159,844 · max 8,442,966 · hits 10/11 · silver 2,350,300 · gold 1,339 · time 11d 12h · pools L 4,343/4,343 A 287/2,000

**B — best found anywhere:** ARC2 1,606 · ABT6 76 · RD2 799 · RD3 448 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 243

| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | ARC2 | 1,606 | 1,055,142 | 562,261 | 416,275 | 0/1 | 0 | 562,261 |
| 2 | ABT6 | 76 | 1,054,880 | 1,150,868 | 415,872 | 1/1 | 1,150,868 | 1,150,868 |
| 3 | RD2 | 799 | 1,048,288 | 553,707 | 412,763 | 1/1 | 553,707 | 553,707 |
| 4 | RD3 | 448 | 1,045,184 | 620,749 | 411,443 | 1/1 | 620,749 | 620,749 |
| 5 | LGN6 | 72 | 997,272 | 796,176 | 392,616 | 1/1 | 796,176 | 796,176 |
| 6 | CHR6 | 36 | 997,272 | 1,067,040 | 392,616 | 2/2 | 2,134,080 | 2,134,080 |
| 7 | EMH6 | 67 | 991,533 | 1,218,650 | 390,349 | 2/2 | 2,437,300 | 2,437,300 |
| 8 | SP2 | 243 | 159,408 | 75,670 | 62,767 | 2/2 | 151,340 | 151,340 |

min 7,844,220 · avg 8,125,351 · max 8,406,481 · hits 10/11 · silver 2,350,700 · gold 1,339 · time 11d 12h · pools L 4,343/4,343 A 287/2,000

## 5. Recommended marches


| scenario | march | avg | silver | mercs lost | leadership | strikes lost | mechanism |
|---|---|---|---|---|---|---|---|
| C | ARC2 1,701 · RD2 847 · RD3 474 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 | 8,093,435 | 2,361,100 | 27 | 4,343 | 0 | the repaired 7-type march with the mercenaries trimmed by simulation — the no-tail optimum |
| C | ARC2 1,605 · ABT6 76 · RD2 799 · RD3 447 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 246 | 8,159,844 | 2,350,300 | 27 | 4,343 | 0 | a tail under the mercenaries at the highest-strike position, paid for out of the sponges |
| B | ARC2 1,701 · RD2 847 · RD3 474 · ABT6 76 · LGN6 72 · CHR6 36 · EMH6 67 | 8,059,929 | 2,361,100 | 27 | 4,343 | 0 | the repaired 7-type march with the mercenaries trimmed by simulation — the no-tail optimum |
| B | ARC2 1,606 · ABT6 76 · RD2 799 · RD3 448 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 243 | 8,125,351 | 2,350,700 | 27 | 4,343 | 0 | a tail under the mercenaries at the highest-strike position, paid for out of the sponges |
| C | ARC2 1,605 · ABT6 76 · RD2 799 · RD3 447 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 246 | 8,159,844 | 2,350,300 | 27 | 4,343 | 0 | best found by the global search |
| B | ARC2 1,606 · ABT6 76 · RD2 799 · RD3 448 · LGN6 72 · CHR6 36 · EMH6 67 · SP2 243 | 8,125,351 | 2,350,700 | 27 | 4,343 | 0 | best found by the global search |

**C — recommended march** (feasible: yes, 0 strikes lost, mercenaries at positions 2–7, one stack per unit type, single march). Note that the winner is **one HP ladder for troops and mercenaries together**: ABT6 sits at position 2, above RD2 and RD3, because its stock cap (76) is bigger than theirs and shrinking it to fit under RD3 costs more than the position is worth. What matters is not "troops then mercenaries" but that no stack loses a strike (0 here) and that the strongest stacks are the last:

| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | ARC2 | 1,605 | 1,133,130 | 566,244 | 420,349 | 0/1 | 0 | 566,244 |
| 2 | ABT6 | 76 | 1,132,856 | 1,155,200 | 420,204 | 1/1 | 1,155,200 | 1,155,200 |
| 3 | RD2 | 799 | 1,125,791 | 558,022 | 417,078 | 1/1 | 558,022 | 558,022 |
| 4 | RD3 | 447 | 1,120,182 | 623,654 | 414,816 | 1/1 | 623,654 | 623,654 |
| 5 | LGN6 | 72 | 1,071,144 | 800,280 | 396,720 | 1/1 | 800,280 | 800,280 |
| 6 | CHR6 | 36 | 1,071,144 | 1,071,144 | 396,720 | 2/2 | 2,142,288 | 2,142,288 |
| 7 | EMH6 | 67 | 1,056,791 | 1,221,370 | 393,069 | 2/2 | 2,442,740 | 2,442,740 |
| 8 | SP2 | 246 | 173,430 | 77,269 | 64,206 | 2/2 | 154,538 | 154,538 |

min 7,876,722 · avg 8,159,844 · max 8,442,966 · hits 10/11 · silver 2,350,300 · gold 1,339 · time 11d 12h · pools L 4,343/4,343 A 287/2,000

**B — recommended march** (feasible: yes, 0 strikes lost, mercenaries at positions 2–7, one stack per unit type, single march). Note that the winner is **one HP ladder for troops and mercenaries together**: ABT6 sits at position 2, above RD2 and RD3, because its stock cap (76) is bigger than theirs and shrinking it to fit under RD3 costs more than the position is worth. What matters is not "troops then mercenaries" but that no stack loses a strike (0 here) and that the strongest stacks are the last:

| # | stack | units | total HP | per hit | base part | hits E/A | damage E | damage A |
|---|---|---|---|---|---|---|---|---|
| 1 | ARC2 | 1,606 | 1,055,142 | 562,261 | 416,275 | 0/1 | 0 | 562,261 |
| 2 | ABT6 | 76 | 1,054,880 | 1,150,868 | 415,872 | 1/1 | 1,150,868 | 1,150,868 |
| 3 | RD2 | 799 | 1,048,288 | 553,707 | 412,763 | 1/1 | 553,707 | 553,707 |
| 4 | RD3 | 448 | 1,045,184 | 620,749 | 411,443 | 1/1 | 620,749 | 620,749 |
| 5 | LGN6 | 72 | 997,272 | 796,176 | 392,616 | 1/1 | 796,176 | 796,176 |
| 6 | CHR6 | 36 | 997,272 | 1,067,040 | 392,616 | 2/2 | 2,134,080 | 2,134,080 |
| 7 | EMH6 | 67 | 991,533 | 1,218,650 | 390,349 | 2/2 | 2,437,300 | 2,437,300 |
| 8 | SP2 | 243 | 159,408 | 75,670 | 62,767 | 2/2 | 151,340 | 151,340 |

min 7,844,220 · avg 8,125,351 · max 8,406,481 · hits 10/11 · silver 2,350,700 · gold 1,339 · time 11d 12h · pools L 4,343/4,343 A 287/2,000

## 6. What is not established here, and what to check in game

- **Two stacks of the same unit type.** Every design here uses one stack per unit type — what the engine and the owner's own battle report show. If the game allows two, a tail can be repeated at positions 9, 10 … where the enemy-first strike counts are 2, 3, 3, and the bottom is worth more than reported. *In-game reading that settles it:* build a march with one troop type split into two squads and count the stacks the battle report prints.
- **The extra end-of-round sweep** (`src/engine/battle.ts` model note 11: the 2026-09-13 report has 21 entries where the engine has 20). Every tail figure here inherits it. *Reading:* the entry count of a report whose last stack survives a round on its own.
- **The 0.4 % ladder step.** It exists only to keep the attack order and the kill order together; the game does not show a step rule, it shows an attack order. *Reading:* two stacks with the same total HP in one report — which of them strikes first.
