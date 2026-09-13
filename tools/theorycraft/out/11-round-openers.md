# A2 — which type sits at the round-opening kill positions

With N = 4 the closed form is `hits(p) = ceil(p/4) − (p ≡ 1 mod 4 ? 1 : 0)`, +1 at p = 1 army-first. So p = 1, 5, 9, 13 each lose exactly one hit of the stack that sits there, and the loss is that stack's whole per-hit damage. The question is which type to put there. Mercenary ladder: `count = min(cap, floor(ceiling / hpPerUnit))`, ceiling = lowest troop stack − 1, cascaded down the chosen order (the M's-Preservation rule at authority 2,000, where the caps 92/76/72/37 bind). Troop ladder: the repo sizer, `sizeStacks` with `method: 'custom'` and the wanted `customOrder`.

## 0. The openers today

| scenario | base | method | p=1 | p=5 | p=9 | hits lost | damage lost to the openers |
|---|---|---|---|---|---|---|---|
| A | E8 | elite | EMH6 (1,329,731) | SW1 (110,331) | — | 2 | 1,440,062 |
| A | E8 | ms | SW1 (110,331) | ABT6 (534,888) | — | 2 | 645,219 |
| A | E8 | msRelaxed | SW1 (110,331) | RD3 (222,307) | — | 2 | 332,638 |
| A | K7 | elite | EMH6 (1,329,731) | ABT6 (883,728) | — | 2 | 2,213,459 |
| A | K7 | ms | ARC2 (311,936) | ABT6 (883,728) | — | 2 | 1,195,664 |
| A | K7 | msRelaxed | ARC2 (311,936) | ABT6 (883,728) | — | 2 | 1,195,664 |
| A | K8 | elite | EMH6 (1,329,731) | ARC2 (224,543) | — | 2 | 1,554,274 |
| A | K8 | ms | ARC2 (224,543) | ABT6 (662,796) | — | 2 | 887,339 |
| A | K8 | msRelaxed | LGN6 (438,596) | RD3 (271,709) | — | 2 | 710,305 |
| B | E8 | elite | EMH6 (1,673,370) | SW1 (220,319) | — | 2 | 1,893,689 |
| B | E8 | ms | SW1 (220,319) | EMH6 (636,608) | — | 2 | 856,927 |
| B | E8 | msRelaxed | SW1 (220,319) | EMH6 (636,608) | — | 2 | 856,927 |
| B | K7 | elite | EMH6 (1,673,370) | ABT6 (1,150,868) | — | 2 | 2,824,238 |
| B | K7 | ms | ARC2 (594,120) | ABT6 (1,150,868) | — | 2 | 1,744,988 |
| B | K7 | msRelaxed | ARC2 (594,120) | ABT6 (1,150,868) | — | 2 | 1,744,988 |
| B | K8 | elite | EMH6 (1,673,370) | ARC2 (427,472) | — | 2 | 2,100,842 |
| B | K8 | ms | ARC2 (427,472) | ABT6 (863,151) | — | 2 | 1,290,623 |
| B | K8 | msRelaxed | ARC2 (427,472) | ABT6 (863,151) | — | 2 | 1,290,623 |

Read it as the price list of the ladder: whatever sits at p = 1 never strikes (enemy first), and whatever sits at p = 5 strikes once instead of twice.

## A · E8 · troop-order permutations (mercenaries in the sizer's own order)

M's Preservation baseline: SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · ABT6 46 · LGN6 46 · CHR6 23 · EMH6 43 — avg 4,062,895

| troop order (first to die first) | counts | p=1 | p=5 | min | avg | max | Δ avg |
|---|---|---|---|---|---|---|---|
| SW1 → SP2 → RD2 → RD3 | SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · ABT6 46 · LGN6 46 · CHR6 23 · EMH6 43 | SW1 | ABT6 | 4,062,895 | 4,062,895 | 4,062,895 | 0 |
| SW1 → SP2 → RD3 → RD2 | SW1 1,793 · SP2 998 · RD2 497 · RD3 279 · ABT6 46 · LGN6 46 · CHR6 23 · EMH6 43 | SW1 | ABT6 | 4,063,040 | 4,063,040 | 4,063,040 | 145 |
| SW1 → RD2 → SP2 → RD3 | SW1 1,793 · SP2 996 · RD2 498 · RD3 279 · ABT6 46 · LGN6 46 · CHR6 23 · EMH6 43 | SW1 | ABT6 | 4,063,110 | 4,118,245 | 4,173,380 | 55,350 |
| SW1 → RD2 → RD3 → SP2 | SW1 1,793 · RD2 499 · SP2 994 · RD3 279 · ABT6 46 · LGN6 46 · CHR6 23 · EMH6 43 | SW1 | ABT6 | 4,063,180 | 4,063,180 | 4,063,180 | 285 |
| SW1 → RD3 → SP2 → RD2 | SW1 1,793 · RD3 280 · SP2 996 · RD2 497 · EMH6 44 · ABT6 47 · LGN6 47 · CHR6 23 | SW1 | EMH6 | 3,806,658 | 3,861,793 | 3,916,928 | -201,102 |
| SW1 → RD3 → RD2 → SP2 | SW1 1,793 · RD3 280 · RD2 498 · SP2 994 · EMH6 44 · ABT6 47 · LGN6 47 · CHR6 23 | SW1 | EMH6 | 3,806,727 | 3,861,862 | 3,916,997 | -201,033 |
| SP2 → SW1 → RD2 → RD3 | SP2 999 · SW1 1,790 · RD2 498 · RD3 279 · ABT6 46 · LGN6 46 · CHR6 23 · EMH6 43 | SP2 | ABT6 | 3,917,893 | 3,990,720 | 4,063,547 | -72,175 |
| SP2 → SW1 → RD3 → RD2 | SP2 999 · SW1 1,790 · RD3 280 · RD2 497 · EMH6 44 · ABT6 47 · LGN6 47 · CHR6 23 | SP2 | EMH6 | 3,884,545 | 3,957,372 | 4,030,199 | -105,523 |
| SP2 → RD2 → SW1 → RD3 | SP2 1,000 · RD2 499 · SW1 1,787 · RD3 279 · ABT6 46 · LGN6 46 · CHR6 23 · EMH6 43 | SP2 | ABT6 | 4,028,156 | 4,101,056 | 4,173,956 | 38,161 |
| SP2 → RD2 → RD3 → SW1 | SP2 1,000 · RD2 499 · RD3 280 · SW1 1,785 · EMH6 44 · ABT6 47 · LGN6 47 · CHR6 23 | SP2 | EMH6 | 3,885,268 | 3,958,168 | 4,031,068 | -104,727 |
| SP2 → RD3 → SW1 → RD2 | SP2 1,001 · SW1 1,788 · RD3 280 · RD2 497 · EMH6 44 · ABT6 47 · LGN6 47 · CHR6 23 | SP2 | EMH6 | 3,884,545 | 3,957,518 | 4,030,491 | -105,377 |
| SP2 → RD3 → RD2 → SW1 | SP2 1,001 · RD3 280 · RD2 498 · SW1 1,786 · EMH6 44 · ABT6 47 · LGN6 47 · CHR6 23 | SP2 | EMH6 | 3,771,641 | 3,844,614 | 3,917,587 | -218,281 |
| RD2 → SW1 → SP2 → RD3 | SW1 1,791 · RD2 499 · SP2 996 · RD3 279 · ABT6 46 · LGN6 46 · CHR6 23 · EMH6 43 | SW1 | ABT6 | 4,063,472 | 4,063,472 | 4,063,472 | 577 |
| RD2 → SW1 → RD3 → SP2 | SW1 1,791 · RD2 499 · RD3 280 · SP2 994 · EMH6 44 · ABT6 47 · LGN6 47 · CHR6 23 | SW1 | EMH6 | 4,030,193 | 4,030,193 | 4,030,193 | -32,702 |
| RD2 → SP2 → SW1 → RD3 | RD2 500 · SP2 998 · SW1 1,787 · RD3 279 · ABT6 46 · LGN6 46 · CHR6 23 · EMH6 43 | RD2 | ABT6 | 3,993,126 | 4,083,576 | 4,174,026 | 20,681 |
| RD2 → SP2 → RD3 → SW1 | RD2 500 · SP2 999 · RD3 280 · SW1 1,784 · EMH6 44 · ABT6 47 · LGN6 47 · CHR6 23 | RD2 | EMH6 | 3,850,384 | 3,940,834 | 4,031,284 | -122,061 |
| RD2 → RD3 → SW1 → SP2 | RD2 500 · SW1 1,788 · RD3 280 · SP2 995 · EMH6 44 · ABT6 47 · LGN6 47 · CHR6 23 | RD2 | EMH6 | 3,849,801 | 3,940,251 | 4,030,701 | -122,644 |
| RD2 → RD3 → SP2 → SW1 | RD2 500 · SP2 997 · RD3 280 · SW1 1,786 · EMH6 44 · ABT6 47 · LGN6 47 · CHR6 23 | RD2 | EMH6 | 3,850,093 | 3,940,543 | 4,030,993 | -122,352 |
| RD3 → SW1 → SP2 → RD2 | RD3 281 · SW1 1,791 · SP2 996 · RD2 497 · EMH6 44 · ABT6 47 · LGN6 47 · CHR6 23 | RD3 | EMH6 | 3,806,658 | 3,918,609 | 4,030,559 | -144,286 |
| RD3 → SW1 → RD2 → SP2 | RD3 281 · SW1 1,791 · RD2 498 · SP2 994 · EMH6 44 · ABT6 47 · LGN6 47 · CHR6 23 | RD3 | EMH6 | 3,806,727 | 3,918,678 | 4,030,628 | -144,217 |
| RD3 → SP2 → SW1 → RD2 | RD3 281 · SP2 999 · SW1 1,788 · RD2 497 · EMH6 44 · ABT6 47 · LGN6 47 · CHR6 23 | RD3 | EMH6 | 3,807,095 | 3,919,046 | 4,030,996 | -143,849 |
| RD3 → SP2 → RD2 → SW1 | RD3 281 · SP2 999 · RD2 498 · SW1 1,786 · EMH6 44 · ABT6 47 · LGN6 47 · CHR6 23 | RD3 | EMH6 | 3,807,456 | 3,919,407 | 4,031,357 | -143,488 |
| RD3 → RD2 → SW1 → SP2 | RD3 281 · RD2 499 · SW1 1,788 · SP2 995 · EMH6 44 · ABT6 47 · LGN6 47 · CHR6 23 | RD3 | EMH6 | 3,807,235 | 3,919,186 | 4,031,136 | -143,709 |
| RD3 → RD2 → SP2 → SW1 | RD3 281 · RD2 499 · SP2 997 · SW1 1,786 · EMH6 44 · ABT6 47 · LGN6 47 · CHR6 23 | RD3 | EMH6 | 3,807,527 | 3,919,478 | 4,031,428 | -143,417 |

best SW1 → RD2 → SP2 → RD3 at 4,118,245; worst SP2 → RD3 → RD2 → SW1 at 3,844,614; spread 273,631

Army-first opening attack (the six best orders):
| troop order | stack at p=1 | top base damage | min | max | army-first gain |
|---|---|---|---|---|---|
| SW1 → RD2 → SP2 → RD3 | SW1 | SW1 | 4,063,110 | 4,173,380 | 110,270 |
| SP2 → RD2 → SW1 → RD3 | SP2 | SP2 | 4,028,156 | 4,173,956 | 145,800 |
| RD2 → SP2 → SW1 → RD3 | RD2 | RD2 | 3,993,126 | 4,174,026 | 180,900 |
| RD2 → SW1 → SP2 → RD3 | SW1 | RD2 | 4,063,472 | 4,063,472 | 0 |
| SW1 → RD2 → RD3 → SP2 | SW1 | RD2 | 4,063,180 | 4,063,180 | 0 |
| SW1 → SP2 → RD3 → RD2 | SW1 | SP2 | 4,063,040 | 4,063,040 | 0 |

The opening attack is one extra army action inserted before the first enemy attack; it is worth a hit only when the stack that takes it (highest base damage) would otherwise have been wiped before striking, or when the shift lets one more stack act in round 1.

## A · K7 · troop-order permutations (mercenaries in the sizer's own order)

M's Preservation baseline: ARC2 1,699 · RD2 847 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72 — avg 5,559,067

| troop order (first to die first) | counts | p=1 | p=5 | min | avg | max | Δ avg |
|---|---|---|---|---|---|---|---|
| ARC2 → RD2 → RD3 | ARC2 1,699 · RD2 847 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72 | ARC2 | ABT6 | 5,403,099 | 5,559,067 | 5,715,035 | 0 |
| ARC2 → RD3 → RD2 | ARC2 1,699 · RD3 476 · RD2 846 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72 | ARC2 | ABT6 | 5,403,534 | 5,559,502 | 5,715,470 | 435 |
| RD2 → ARC2 → RD3 | RD2 849 · ARC2 1,695 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72 | RD2 | ABT6 | 5,407,856 | 5,561,440 | 5,715,024 | 2,373 |
| RD2 → RD3 → ARC2 | RD2 849 · RD3 476 · ARC2 1,693 · EMH6 75 · ABT6 76 · CHR6 37 · LGN6 72 | RD2 | ABT6 | 5,043,463 | 5,197,047 | 5,350,631 | -362,020 |
| RD3 → ARC2 → RD2 | ARC2 1,697 · RD3 477 · RD2 846 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72 | ARC2 | ABT6 | 5,404,331 | 5,560,116 | 5,715,900 | 1,049 |
| RD3 → RD2 → ARC2 | RD3 477 · RD2 848 · ARC2 1,693 · EMH6 75 · ABT6 76 · CHR6 37 · LGN6 72 | RD3 | ABT6 | 5,350,269 | 5,540,306 | 5,730,343 | -18,761 |

best RD2 → ARC2 → RD3 at 5,561,440; worst RD2 → RD3 → ARC2 at 5,197,047; spread 364,393

Army-first opening attack (the six best orders):
| troop order | stack at p=1 | top base damage | min | max | army-first gain |
|---|---|---|---|---|---|
| RD2 → ARC2 → RD3 | RD2 | RD2 | 5,407,856 | 5,715,024 | 307,168 |
| RD3 → ARC2 → RD2 | ARC2 | ARC2 | 5,404,331 | 5,715,900 | 311,569 |
| ARC2 → RD3 → RD2 | ARC2 | ARC2 | 5,403,534 | 5,715,470 | 311,936 |
| ARC2 → RD2 → RD3 | ARC2 | ARC2 | 5,403,099 | 5,715,035 | 311,936 |
| RD3 → RD2 → ARC2 | RD3 | RD3 | 5,350,269 | 5,730,343 | 380,074 |
| RD2 → RD3 → ARC2 | RD2 | RD2 | 5,043,463 | 5,350,631 | 307,168 |

The opening attack is one extra army action inserted before the first enemy attack; it is worth a hit only when the stack that takes it (highest base damage) would otherwise have been wiped before striking, or when the shift lets one more stack act in round 1.

## A · K8 · troop-order permutations (mercenaries in the sizer's own order)

M's Preservation baseline: ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 — avg 5,107,427

| troop order (first to die first) | counts | p=1 | p=5 | min | avg | max | Δ avg |
|---|---|---|---|---|---|---|---|
| ARC2 → SP2 → RD2 → RD3 | ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | ARC2 | ABT6 | 4,995,155 | 5,107,427 | 5,219,698 | 0 |
| ARC2 → SP2 → RD3 → RD2 | ARC2 1,223 · SP2 1,220 · RD3 342 · RD2 608 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | ARC2 | ABT6 | 4,995,590 | 5,107,862 | 5,220,133 | 435 |
| ARC2 → RD2 → SP2 → RD3 | ARC2 1,223 · RD2 610 · SP2 1,218 · RD3 341 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | ARC2 | ABT6 | 4,995,225 | 5,107,497 | 5,219,768 | 70 |
| ARC2 → RD2 → RD3 → SP2 | ARC2 1,223 · RD2 610 · RD3 342 · SP2 1,216 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | ARC2 | ABT6 | 4,995,731 | 5,108,003 | 5,220,274 | 576 |
| ARC2 → RD3 → SP2 → RD2 | ARC2 1,223 · RD3 343 · SP2 1,218 · RD2 608 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | ARC2 | ABT6 | 4,996,094 | 5,108,366 | 5,220,637 | 939 |
| ARC2 → RD3 → RD2 → SP2 | ARC2 1,223 · RD3 343 · RD2 609 · SP2 1,216 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | ARC2 | ABT6 | 4,996,165 | 5,108,437 | 5,220,708 | 1,010 |
| SP2 → ARC2 → RD2 → RD3 | SP2 1,223 · ARC2 1,220 · RD2 609 · RD3 341 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | SP2 | ABT6 | 5,041,271 | 5,130,428 | 5,219,584 | 23,001 |
| SP2 → ARC2 → RD3 → RD2 | SP2 1,223 · ARC2 1,220 · RD3 342 · RD2 608 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | SP2 | ABT6 | 5,041,706 | 5,130,863 | 5,220,019 | 23,436 |
| SP2 → RD2 → ARC2 → RD3 | SP2 1,223 · RD2 610 · ARC2 1,218 · RD3 341 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | SP2 | ABT6 | 5,041,266 | 5,130,423 | 5,219,579 | 22,996 |
| SP2 → RD2 → RD3 → ARC2 | SP2 1,223 · RD2 610 · RD3 342 · ARC2 1,216 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | SP2 | ABT6 | 5,041,696 | 5,130,853 | 5,220,009 | 23,426 |
| SP2 → RD3 → ARC2 → RD2 | SP2 1,223 · RD3 343 · ARC2 1,218 · RD2 608 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | SP2 | ABT6 | 5,042,135 | 5,131,292 | 5,220,448 | 23,865 |
| SP2 → RD3 → RD2 → ARC2 | SP2 1,223 · RD3 343 · RD2 609 · ARC2 1,216 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | SP2 | ABT6 | 5,042,130 | 5,131,287 | 5,220,443 | 23,860 |
| RD2 → ARC2 → SP2 → RD3 | RD2 611 · ARC2 1,221 · SP2 1,218 · RD3 341 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD2 | ABT6 | 4,998,703 | 5,109,233 | 5,219,763 | 1,806 |
| RD2 → ARC2 → RD3 → SP2 | RD2 611 · ARC2 1,221 · RD3 342 · SP2 1,216 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD2 | ABT6 | 4,999,209 | 5,109,739 | 5,220,269 | 2,312 |
| RD2 → SP2 → ARC2 → RD3 | RD2 611 · SP2 1,221 · ARC2 1,218 · RD3 341 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD2 | ABT6 | 4,998,590 | 5,109,120 | 5,219,650 | 1,693 |
| RD2 → SP2 → RD3 → ARC2 | RD2 611 · SP2 1,221 · RD3 342 · ARC2 1,216 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD2 | ABT6 | 4,999,020 | 5,109,550 | 5,220,080 | 2,123 |
| RD2 → RD3 → ARC2 → SP2 | RD2 611 · RD3 343 · ARC2 1,219 · SP2 1,216 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD2 | ABT6 | 4,999,637 | 5,110,167 | 5,220,697 | 2,740 |
| RD2 → RD3 → SP2 → ARC2 | RD2 611 · RD3 343 · SP2 1,219 · ARC2 1,216 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD2 | ABT6 | 4,999,524 | 5,110,054 | 5,220,584 | 2,627 |
| RD3 → ARC2 → SP2 → RD2 | ARC2 1,222 · RD3 343 · SP2 1,219 · RD2 608 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | ARC2 | ABT6 | 4,996,240 | 5,108,420 | 5,220,599 | 993 |
| RD3 → ARC2 → RD2 → SP2 | RD3 344 · ARC2 1,221 · RD2 609 · SP2 1,216 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD3 | ABT6 | 4,947,039 | 5,084,089 | 5,221,138 | -23,338 |
| RD3 → SP2 → ARC2 → RD2 | SP2 1,222 · RD3 343 · ARC2 1,219 · RD2 608 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | SP2 | ABT6 | 5,042,318 | 5,131,402 | 5,220,486 | 23,975 |
| RD3 → SP2 → RD2 → ARC2 | RD3 344 · SP2 1,221 · RD2 609 · ARC2 1,216 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD3 | ABT6 | 4,946,850 | 5,083,900 | 5,220,949 | -23,527 |
| RD3 → RD2 → ARC2 → SP2 | RD3 344 · RD2 610 · ARC2 1,219 · SP2 1,216 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD3 | ABT6 | 4,947,033 | 5,084,083 | 5,221,132 | -23,344 |
| RD3 → RD2 → SP2 → ARC2 | RD3 344 · RD2 610 · SP2 1,219 · ARC2 1,216 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD3 | ABT6 | 4,946,920 | 5,083,970 | 5,221,019 | -23,457 |

best RD3 → SP2 → ARC2 → RD2 at 5,131,402; worst RD3 → SP2 → RD2 → ARC2 at 5,083,900; spread 47,502

Army-first opening attack (the six best orders):
| troop order | stack at p=1 | top base damage | min | max | army-first gain |
|---|---|---|---|---|---|
| RD3 → SP2 → ARC2 → RD2 | SP2 | SP2 | 5,042,318 | 5,220,486 | 178,168 |
| SP2 → RD3 → ARC2 → RD2 | SP2 | SP2 | 5,042,135 | 5,220,448 | 178,313 |
| SP2 → RD3 → RD2 → ARC2 | SP2 | SP2 | 5,042,130 | 5,220,443 | 178,313 |
| SP2 → ARC2 → RD3 → RD2 | SP2 | SP2 | 5,041,706 | 5,220,019 | 178,313 |
| SP2 → RD2 → RD3 → ARC2 | SP2 | SP2 | 5,041,696 | 5,220,009 | 178,313 |
| SP2 → ARC2 → RD2 → RD3 | SP2 | SP2 | 5,041,271 | 5,219,584 | 178,313 |

The opening attack is one extra army action inserted before the first enemy attack; it is worth a hit only when the stack that takes it (highest base damage) would otherwise have been wiped before striking, or when the shift lets one more stack act in round 1.

## B · E8 · troop-order permutations (mercenaries in the sizer's own order)

M's Preservation baseline: SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 — avg 4,474,506

| troop order (first to die first) | counts | p=1 | p=5 | min | avg | max | Δ avg |
|---|---|---|---|---|---|---|---|
| SW1 → SP2 → RD2 → RD3 | SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | SW1 | EMH6 | 4,474,506 | 4,474,506 | 4,474,506 | 0 |
| SW1 → SP2 → RD3 → RD2 | SW1 2,308 · SP2 797 · RD3 223 · RD2 396 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | SW1 | EMH6 | 4,474,125 | 4,474,125 | 4,474,125 | -381 |
| SW1 → RD2 → SP2 → RD3 | SW1 2,306 · RD2 398 · SP2 795 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | SW1 | EMH6 | 4,474,888 | 4,474,888 | 4,474,888 | 382 |
| SW1 → RD2 → RD3 → SP2 | SW1 2,307 · RD2 398 · SP2 794 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | SW1 | EMH6 | 4,474,577 | 4,474,577 | 4,474,577 | 71 |
| SW1 → RD3 → SP2 → RD2 | SW1 2,308 · RD3 224 · SP2 795 · RD2 396 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | SW1 | EMH6 | 4,474,887 | 4,474,887 | 4,474,887 | 381 |
| SW1 → RD3 → RD2 → SP2 | SW1 2,307 · RD3 224 · SP2 794 · RD2 397 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | SW1 | EMH6 | 4,475,269 | 4,475,269 | 4,475,269 | 763 |
| SP2 → SW1 → RD2 → RD3 | SP2 799 · SW1 2,304 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | SP2 | EMH6 | 4,226,632 | 4,351,037 | 4,475,441 | -123,469 |
| SP2 → SW1 → RD3 → RD2 | SP2 799 · SW1 2,304 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | SP2 | EMH6 | 4,226,632 | 4,351,037 | 4,475,441 | -123,469 |
| SP2 → RD2 → SW1 → RD3 | SP2 800 · SW1 2,301 · RD2 398 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | SP2 | EMH6 | 4,227,325 | 4,351,885 | 4,476,445 | -122,621 |
| SP2 → RD2 → RD3 → SW1 | SP2 799 · RD2 399 · RD3 224 · SW1 2,298 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | SP2 | EMH6 | 4,229,403 | 4,353,808 | 4,478,212 | -120,698 |
| SP2 → RD3 → SW1 → RD2 | SP2 799 · RD3 224 · SW1 2,302 · RD2 397 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | SP2 | EMH6 | 4,228,017 | 4,352,422 | 4,476,826 | -122,084 |
| SP2 → RD3 → RD2 → SW1 | SP2 800 · RD3 224 · RD2 398 · SW1 2,299 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | SP2 | EMH6 | 4,228,710 | 4,353,270 | 4,477,830 | -121,236 |
| RD2 → SW1 → SP2 → RD3 | RD2 399 · SW1 2,304 · SP2 795 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | RD2 | EMH6 | 4,199,074 | 4,337,328 | 4,475,581 | -137,178 |
| RD2 → SW1 → RD3 → SP2 | RD2 399 · SW1 2,305 · SP2 794 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | RD2 | EMH6 | 4,198,763 | 4,337,017 | 4,475,270 | -137,489 |
| RD2 → SP2 → SW1 → RD3 | SP2 798 · RD2 399 · SW1 2,301 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | SP2 | EMH6 | 4,228,018 | 4,352,267 | 4,476,515 | -122,239 |
| RD2 → SP2 → RD3 → SW1 | SP2 799 · RD2 399 · RD3 224 · SW1 2,298 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | SP2 | EMH6 | 4,229,403 | 4,353,808 | 4,478,212 | -120,698 |
| RD2 → RD3 → SW1 → SP2 | RD2 399 · RD3 224 · SW1 2,302 · SP2 795 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | RD2 | EMH6 | 4,200,459 | 4,338,713 | 4,476,966 | -135,793 |
| RD2 → RD3 → SP2 → SW1 | RD2 400 · SP2 797 · RD3 224 · SW1 2,298 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | RD2 | EMH6 | 4,201,082 | 4,339,682 | 4,478,282 | -134,824 |
| RD3 → SW1 → SP2 → RD2 | SW1 2,305 · RD3 224 · SP2 796 · RD2 397 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | SW1 | EMH6 | 4,475,891 | 4,475,891 | 4,475,891 | 1,385 |
| RD3 → SW1 → RD2 → SP2 | SW1 2,305 · RD3 224 · RD2 398 · SP2 794 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | SW1 | EMH6 | 4,475,962 | 4,475,962 | 4,475,962 | 1,456 |
| RD3 → SP2 → SW1 → RD2 | SP2 798 · SW1 2,303 · RD3 224 · RD2 397 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | SP2 | EMH6 | 4,228,017 | 4,352,266 | 4,476,514 | -122,240 |
| RD3 → SP2 → RD2 → SW1 | RD3 225 · SP2 798 · RD2 398 · SW1 2,299 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | RD3 | EMH6 | 4,166,833 | 4,322,713 | 4,478,593 | -151,793 |
| RD3 → RD2 → SW1 → SP2 | RD2 399 · RD3 224 · SW1 2,302 · SP2 795 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | RD2 | EMH6 | 4,200,459 | 4,338,713 | 4,476,966 | -135,793 |
| RD3 → RD2 → SP2 → SW1 | SP2 798 · RD2 399 · RD3 224 · SW1 2,299 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 | SP2 | EMH6 | 4,229,403 | 4,353,652 | 4,477,900 | -120,854 |

best RD3 → SW1 → RD2 → SP2 at 4,475,962; worst RD3 → SP2 → RD2 → SW1 at 4,322,713; spread 153,249

Army-first opening attack (the six best orders):
| troop order | stack at p=1 | top base damage | min | max | army-first gain |
|---|---|---|---|---|---|
| RD3 → SW1 → RD2 → SP2 | SW1 | RD3 | 4,475,962 | 4,475,962 | 0 |
| RD3 → SW1 → SP2 → RD2 | SW1 | RD3 | 4,475,891 | 4,475,891 | 0 |
| SW1 → RD3 → RD2 → SP2 | SW1 | RD3 | 4,475,269 | 4,475,269 | 0 |
| SW1 → RD2 → SP2 → RD3 | SW1 | RD2 | 4,474,888 | 4,474,888 | 0 |
| SW1 → RD3 → SP2 → RD2 | SW1 | RD3 | 4,474,887 | 4,474,887 | 0 |
| SW1 → RD2 → RD3 → SP2 | SW1 | RD2 | 4,474,577 | 4,474,577 | 0 |

The opening attack is one extra army action inserted before the first enemy attack; it is worth a hit only when the stack that takes it (highest base damage) would otherwise have been wiped before striking, or when the shift lets one more stack act in round 1.

## B · K7 · troop-order permutations (mercenaries in the sizer's own order)

M's Preservation baseline: ARC2 1,697 · RD2 848 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72 — avg 7,825,435

| troop order (first to die first) | counts | p=1 | p=5 | min | avg | max | Δ avg |
|---|---|---|---|---|---|---|---|
| ARC2 → RD2 → RD3 | ARC2 1,697 · RD2 848 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72 | ARC2 | ABT6 | 7,528,375 | 7,825,435 | 8,122,495 | 0 |
| ARC2 → RD3 → RD2 | ARC2 1,697 · RD3 477 · RD2 846 · EMH6 75 · ABT6 76 · CHR6 37 · LGN6 72 | ARC2 | ABT6 | 7,547,949 | 7,845,009 | 8,142,069 | 19,574 |
| RD2 → ARC2 → RD3 | RD2 849 · ARC2 1,693 · RD3 476 · EMH6 75 · ABT6 76 · CHR6 37 · LGN6 72 | RD2 | ABT6 | 7,553,005 | 7,553,005 | 7,553,005 | -272,430 |
| RD2 → RD3 → ARC2 | RD2 849 · RD3 477 · ARC2 1,691 · EMH6 75 · ABT6 76 · CHR6 37 · LGN6 72 | RD2 | ABT6 | 6,892,759 | 7,186,938 | 7,481,116 | -638,497 |
| RD3 → ARC2 → RD2 | RD3 478 · ARC2 1,695 · RD2 846 · EMH6 75 · ABT6 76 · CHR6 37 · LGN6 72 | RD3 | ABT6 | 7,480,438 | 7,480,438 | 7,480,438 | -344,997 |
| RD3 → RD2 → ARC2 | RD3 478 · RD2 848 · ARC2 1,691 · EMH6 75 · ABT6 76 · CHR6 37 · LGN6 72 | RD3 | ABT6 | 6,892,759 | 7,223,918 | 7,555,076 | -601,517 |

best ARC2 → RD3 → RD2 at 7,845,009; worst RD2 → RD3 → ARC2 at 7,186,938; spread 658,071

Army-first opening attack (the six best orders):
| troop order | stack at p=1 | top base damage | min | max | army-first gain |
|---|---|---|---|---|---|
| ARC2 → RD3 → RD2 | ARC2 | ARC2 | 7,547,949 | 8,142,069 | 594,120 |
| ARC2 → RD2 → RD3 | ARC2 | ARC2 | 7,528,375 | 8,122,495 | 594,120 |
| RD2 → ARC2 → RD3 | RD2 | ARC2 | 7,553,005 | 7,553,005 | 0 |
| RD3 → ARC2 → RD2 | RD3 | ARC2 | 7,480,438 | 7,480,438 | 0 |
| RD3 → RD2 → ARC2 | RD3 | RD3 | 6,892,759 | 7,555,076 | 662,317 |
| RD2 → RD3 → ARC2 | RD2 | RD2 | 6,892,759 | 7,481,116 | 588,357 |

The opening attack is one extra army action inserted before the first enemy attack; it is worth a hit only when the stack that takes it (highest base damage) would otherwise have been wiped before striking, or when the shift lets one more stack act in round 1.

## B · K8 · troop-order permutations (mercenaries in the sizer's own order)

M's Preservation baseline: ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 — avg 7,201,171

| troop order (first to die first) | counts | p=1 | p=5 | min | avg | max | Δ avg |
|---|---|---|---|---|---|---|---|
| ARC2 → SP2 → RD2 → RD3 | ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | ARC2 | ABT6 | 6,987,435 | 7,201,171 | 7,414,907 | 0 |
| ARC2 → SP2 → RD3 → RD2 | ARC2 1,222 · SP2 1,221 · RD3 342 · RD2 608 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | ARC2 | ABT6 | 6,987,053 | 7,200,964 | 7,414,875 | -207 |
| ARC2 → RD2 → SP2 → RD3 | ARC2 1,221 · RD2 610 · SP2 1,218 · RD3 342 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | ARC2 | ABT6 | 6,987,505 | 7,201,241 | 7,414,977 | 70 |
| ARC2 → RD2 → RD3 → SP2 | ARC2 1,222 · RD2 610 · SP2 1,217 · RD3 342 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | ARC2 | ABT6 | 6,987,194 | 7,201,105 | 7,415,016 | -66 |
| ARC2 → RD3 → SP2 → RD2 | ARC2 1,222 · RD3 343 · SP2 1,219 · RD2 608 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | ARC2 | ABT6 | 6,987,817 | 7,201,728 | 7,415,639 | 557 |
| ARC2 → RD3 → RD2 → SP2 | ARC2 1,222 · RD3 343 · RD2 609 · SP2 1,217 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | ARC2 | ABT6 | 6,987,887 | 7,201,798 | 7,415,709 | 627 |
| SP2 → ARC2 → RD2 → RD3 | SP2 1,224 · ARC2 1,219 · RD2 609 · RD3 341 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | SP2 | ABT6 | 7,032,914 | 7,223,491 | 7,414,068 | 22,320 |
| SP2 → ARC2 → RD3 → RD2 | SP2 1,224 · ARC2 1,219 · RD3 342 · RD2 608 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | SP2 | ABT6 | 7,033,606 | 7,224,183 | 7,414,760 | 23,012 |
| SP2 → RD2 → ARC2 → RD3 | SP2 1,223 · RD2 610 · ARC2 1,216 · RD3 342 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | SP2 | ABT6 | 6,611,212 | 6,801,633 | 6,992,054 | -399,538 |
| SP2 → RD2 → RD3 → ARC2 | SP2 1,224 · RD2 610 · ARC2 1,215 · RD3 342 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | SP2 | ABT6 | 7,033,592 | 7,224,169 | 7,414,746 | 22,998 |
| SP2 → RD3 → ARC2 → RD2 | SP2 1,224 · RD3 343 · ARC2 1,217 · RD2 608 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | SP2 | ABT6 | 6,559,031 | 6,749,608 | 6,940,185 | -451,563 |
| SP2 → RD3 → RD2 → ARC2 | SP2 1,224 · RD3 343 · RD2 609 · ARC2 1,215 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | SP2 | ABT6 | 6,612,248 | 6,802,825 | 6,993,402 | -398,346 |
| RD2 → ARC2 → SP2 → RD3 | RD2 611 · ARC2 1,219 · SP2 1,218 · RD3 342 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD2 | ABT6 | 6,991,547 | 6,991,547 | 6,991,547 | -209,624 |
| RD2 → ARC2 → RD3 → SP2 | RD2 611 · ARC2 1,220 · SP2 1,217 · RD3 342 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD2 | ABT6 | 6,991,586 | 6,991,586 | 6,991,586 | -209,585 |
| RD2 → SP2 → ARC2 → RD3 | RD2 611 · SP2 1,221 · ARC2 1,216 · RD3 342 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD2 | ABT6 | 6,991,431 | 7,203,143 | 7,414,854 | 1,972 |
| RD2 → SP2 → RD3 → ARC2 | SP2 1,222 · RD2 611 · ARC2 1,215 · RD3 342 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | SP2 | ABT6 | 7,034,285 | 7,224,551 | 7,414,816 | 23,380 |
| RD2 → RD3 → ARC2 → SP2 | RD2 611 · ARC2 1,218 · RD3 343 · SP2 1,217 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD2 | ABT6 | 6,992,272 | 6,992,272 | 6,992,272 | -208,899 |
| RD2 → RD3 → SP2 → ARC2 | RD2 611 · SP2 1,220 · RD3 343 · ARC2 1,215 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD2 | ABT6 | 6,992,156 | 7,203,868 | 7,415,579 | 2,697 |
| RD3 → ARC2 → SP2 → RD2 | RD3 344 · ARC2 1,220 · SP2 1,219 · RD2 608 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD3 | ABT6 | 6,939,678 | 6,939,678 | 6,939,678 | -261,493 |
| RD3 → ARC2 → RD2 → SP2 | RD3 344 · ARC2 1,220 · RD2 609 · SP2 1,217 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD3 | ABT6 | 6,939,748 | 6,939,748 | 6,939,748 | -261,423 |
| RD3 → SP2 → ARC2 → RD2 | RD3 344 · SP2 1,222 · ARC2 1,217 · RD2 608 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD3 | ABT6 | 6,939,562 | 7,177,885 | 7,416,208 | -23,286 |
| RD3 → SP2 → RD2 → ARC2 | RD3 344 · SP2 1,222 · RD2 609 · ARC2 1,215 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD3 | ABT6 | 6,517,518 | 6,755,841 | 6,994,164 | -445,330 |
| RD3 → RD2 → ARC2 → SP2 | RD3 344 · RD2 610 · ARC2 1,218 · SP2 1,217 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD3 | ABT6 | 6,517,011 | 6,755,334 | 6,993,657 | -445,837 |
| RD3 → RD2 → SP2 → ARC2 | RD3 344 · SP2 1,220 · RD2 610 · ARC2 1,215 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 | RD3 | ABT6 | 6,939,625 | 7,177,948 | 7,416,271 | -23,223 |

best RD2 → SP2 → RD3 → ARC2 at 7,224,551; worst SP2 → RD3 → ARC2 → RD2 at 6,749,608; spread 474,943

Army-first opening attack (the six best orders):
| troop order | stack at p=1 | top base damage | min | max | army-first gain |
|---|---|---|---|---|---|
| RD2 → SP2 → RD3 → ARC2 | SP2 | SP2 | 7,034,285 | 7,414,816 | 380,531 |
| SP2 → ARC2 → RD3 → RD2 | SP2 | SP2 | 7,033,606 | 7,414,760 | 381,154 |
| SP2 → RD2 → RD3 → ARC2 | SP2 | SP2 | 7,033,592 | 7,414,746 | 381,154 |
| SP2 → ARC2 → RD2 → RD3 | SP2 | SP2 | 7,032,914 | 7,414,068 | 381,154 |
| RD2 → RD3 → SP2 → ARC2 | RD2 | RD2 | 6,992,156 | 7,415,579 | 423,423 |
| RD2 → SP2 → ARC2 → RD3 | RD2 | RD2 | 6,991,431 | 7,414,854 | 423,423 |

The opening attack is one extra army action inserted before the first enemy attack; it is worth a hit only when the stack that takes it (highest base damage) would otherwise have been wiped before striking, or when the shift lets one more stack act in round 1.

## Summary

| scenario | base | ms baseline avg | best troop order | best avg | gain | worst order | worst avg |
|---|---|---|---|---|---|---|---|
| A | E8 | 4,062,895 | SW1 → RD2 → SP2 → RD3 | 4,118,245 | 55,350 | SP2 → RD3 → RD2 → SW1 | 3,844,614 |
| A | K7 | 5,559,067 | RD2 → ARC2 → RD3 | 5,561,440 | 2,373 | RD2 → RD3 → ARC2 | 5,197,047 |
| A | K8 | 5,107,427 | RD3 → SP2 → ARC2 → RD2 | 5,131,402 | 23,975 | RD3 → SP2 → RD2 → ARC2 | 5,083,900 |
| B | E8 | 4,474,506 | RD3 → SW1 → RD2 → SP2 | 4,475,962 | 1,456 | RD3 → SP2 → RD2 → SW1 | 4,322,713 |
| B | K7 | 7,825,435 | ARC2 → RD3 → RD2 | 7,845,009 | 19,574 | RD2 → RD3 → ARC2 | 7,186,938 |
| B | K8 | 7,201,171 | RD2 → SP2 → RD3 → ARC2 | 7,224,551 | 23,380 | SP2 → RD3 → ARC2 → RD2 | 6,749,608 |

Closed form for reference: p1 0/1 · p2 1/1 · p3 1/1 · p4 1/1 · p5 1/1 · p6 2/2 · p7 2/2 · p8 2/2 · p9 2/2 (enemy-first / army-first, N = 4).
