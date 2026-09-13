# A6 — does a sacrificial front stack pay for itself?

Position 1 never strikes when the enemy goes first, and position p ≡ 1 (mod 4) always loses one hit. Inserting a stack at the top shifts every other stack from p to p + 1, so a stack gains a hit exactly when p + 1 is not ≡ 1 (mod 4) while p was — i.e. when it was sitting on an opener. With 4 enemy squads and 7–9 stacks there are two openers (p = 1 and p = 5), so at most two stacks gain a hit, and the sacrifice itself loses everything it would have done.

## A · E8

baseline (M's Preservation): SW1 1,794 · SP2 997 · RD2 497 · RD3 279 · ABT6 46 · LGN6 46 · CHR6 23 · EMH6 43 — avg 4,062,895; top stack 278,070 HP, troop floor 275,931

| sacrifice | pool | units | HP | leadership left for the other troops | troop floor | merc authority | still on an opener | min | avg | max | Δ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ARC1 | leadership | 1,359 | 210,645 | 2,984 | 188,899 | 126 | RD3@5 CHR6@9 | 3,271,740 | 3,329,498 | 3,387,255 | -733,397 |
| SP1 | leadership | 1,359 | 210,645 | 2,984 | 188,899 | 126 | RD3@5 CHR6@9 | 3,271,740 | 3,319,985 | 3,368,229 | -742,910 |
| RD1 | leadership | 638 | 197,142 | 3,067 | 194,833 | 129 | RD3@5 CHR6@9 | 3,274,151 | 3,327,743 | 3,381,335 | -735,152 |
| ARC2 | leadership | 815 | 226,570 | 3,528 | 224,503 | 149 | RD3@5 EMH6@9 | 3,775,955 | 3,850,772 | 3,925,589 | -212,123 |
| EMH6 | authority | 92 | 577,116 | 4,343 | 275,931 | 230 | RD3@5 | 3,354,773 | 4,019,639 | 4,684,504 | -43,256 |
| ABT6 | authority | 76 | 446,196 | 4,343 | 275,931 | 211 | RD3@5 | 3,528,007 | 3,969,871 | 4,411,735 | -93,024 |
| LGN6 | authority | 72 | 422,712 | 4,343 | 275,931 | 207 | RD3@5 | 3,902,079 | 4,174,311 | 4,446,543 | 111,416 |
| CHR6 | authority | 37 | 434,454 | 4,343 | 275,931 | 209 | RD3@5 | 3,555,975 | 3,974,963 | 4,393,951 | -87,932 |

## A · K7

baseline (M's Preservation): ARC2 1,699 · RD2 847 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72 — avg 5,559,067; top stack 472,322 HP, troop floor 469,775

| sacrifice | pool | units | HP | leadership left for the other troops | troop floor | merc authority | still on an opener | min | avg | max | Δ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SW1 | leadership | 1,795 | 278,225 | 2,548 | 275,931 | 181 | ABT6@5 | 4,100,398 | 4,155,595 | 4,210,791 | -1,403,472 |
| ARC1 | leadership | 1,795 | 278,225 | 2,548 | 275,931 | 181 | ABT6@5 | 4,100,398 | 4,176,686 | 4,252,973 | -1,382,381 |
| SP1 | leadership | 1,795 | 278,225 | 2,548 | 275,931 | 181 | ABT6@5 | 4,100,398 | 4,164,121 | 4,227,843 | -1,394,946 |
| RD1 | leadership | 898 | 277,482 | 2,547 | 274,942 | 181 | ABT6@5 | 4,099,784 | 4,175,216 | 4,250,648 | -1,383,851 |
| SP2 | leadership | 1,222 | 339,716 | 3,121 | 337,249 | 223 | ABT6@5 | 5,041,455 | 5,130,539 | 5,219,623 | -428,528 |
| EMH6 | authority | 92 | 577,116 | 4,343 | 469,775 | 314 | ABT6@5 | 4,645,469 | 5,310,335 | 5,975,200 | -248,732 |
| ABT6 | authority | — | — | — | — | — | needs 81 units but the cap is 76 | — | — | — | — |
| LGN6 | authority | — | — | — | — | — | needs 81 units but the cap is 72 | — | — | — | — |
| CHR6 | authority | — | — | — | — | — | needs 41 units but the cap is 37 | — | — | — | — |

## A · K8

baseline (M's Preservation): ARC2 1,223 · SP2 1,220 · RD2 609 · RD3 341 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 — avg 5,107,427; top stack 339,994 HP, troop floor 337,249

| sacrifice | pool | units | HP | leadership left for the other troops | troop floor | merc authority | still on an opener | min | avg | max | Δ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SW1 | leadership | 1,462 | 226,610 | 2,881 | 223,514 | 149 | RD3@5 EMH6@9 | 3,924,058 | 3,969,015 | 4,013,971 | -1,138,412 |
| ARC1 | leadership | 1,462 | 226,610 | 2,881 | 223,514 | 149 | RD3@5 EMH6@9 | 3,924,058 | 3,986,193 | 4,048,328 | -1,121,234 |
| SP1 | leadership | 1,462 | 226,610 | 2,881 | 223,514 | 149 | RD3@5 EMH6@9 | 3,924,058 | 3,975,959 | 4,027,860 | -1,131,468 |
| RD1 | leadership | 731 | 225,879 | 2,881 | 223,514 | 149 | RD3@5 EMH6@9 | 3,924,058 | 3,985,462 | 4,046,866 | -1,121,965 |
| EMH6 | authority | 92 | 577,116 | 4,343 | 337,249 | 262 | RD3@5 | 4,350,412 | 5,015,278 | 5,680,143 | -92,149 |
| ABT6 | authority | 76 | 446,196 | 4,343 | 337,249 | 242 | RD3@5 | 4,556,902 | 4,998,766 | 5,440,630 | -108,661 |
| LGN6 | authority | 72 | 422,712 | 4,343 | 337,249 | 238 | RD3@5 | 5,020,426 | 5,292,658 | 5,564,890 | 185,231 |
| CHR6 | authority | 37 | 434,454 | 4,343 | 337,249 | 241 | RD3@5 | 4,614,206 | 5,033,194 | 5,452,182 | -74,233 |

## B · E8

baseline (M's Preservation): SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 — avg 4,474,506; top stack 523,689 HP, troop floor 520,259

| sacrifice | pool | units | HP | leadership left for the other troops | troop floor | merc authority | still on an opener | min | avg | max | Δ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ARC1 | leadership | 1,088 | 397,120 | 3,255 | 389,611 | 110 | RD3@5 EMH6@9 | 3,866,809 | 3,963,369 | 4,059,929 | -511,137 |
| SP1 | leadership | 1,088 | 397,120 | 3,255 | 389,611 | 110 | RD3@5 EMH6@9 | 3,866,809 | 3,955,481 | 4,044,153 | -519,025 |
| RD1 | leadership | 544 | 396,576 | 3,255 | 389,611 | 110 | RD3@5 EMH6@9 | 3,866,809 | 3,962,553 | 4,058,297 | -511,953 |
| ARC2 | leadership | 683 | 448,731 | 3,660 | 438,604 | 121 | RD3@5 CHR6@9 | 4,270,209 | 4,389,768 | 4,509,327 | -84,738 |
| EMH6 | authority | 92 | 1,361,508 | 4,343 | 520,259 | 202 | RD3@5 | 3,837,898 | 4,674,583 | 5,511,268 | 200,077 |
| ABT6 | authority | 76 | 1,054,880 | 4,343 | 520,259 | 184 | RD3@5 | 3,990,532 | 4,565,966 | 5,141,400 | 91,460 |
| LGN6 | authority | 72 | 997,272 | 4,343 | 520,259 | 180 | RD3@5 | 4,292,822 | 4,690,910 | 5,088,998 | 216,404 |
| CHR6 | authority | 37 | 1,024,974 | 4,343 | 520,259 | 183 | RD3@5 | 4,044,074 | 4,592,414 | 5,140,754 | 117,908 |

## B · K7

baseline (M's Preservation): ARC2 1,697 · RD2 848 · RD3 475 · EMH6 74 · ABT6 76 · CHR6 37 · LGN6 72 — avg 7,825,435; top stack 1,114,929 HP, troop floor 1,108,175

| sacrifice | pool | units | HP | leadership left for the other troops | troop floor | merc authority | still on an opener | min | avg | max | Δ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SW1 | leadership | 2,382 | 540,714 | 1,961 | 499,262 | 140 | LGN6@5 | 4,556,062 | 4,669,803 | 4,783,543 | -3,155,632 |
| ARC1 | leadership | 1,793 | 654,445 | 2,550 | 650,907 | 181 | ABT6@5 | 5,721,986 | 5,881,115 | 6,040,244 | -1,944,320 |
| SP1 | leadership | 1,797 | 655,905 | 2,546 | 650,907 | 181 | ABT6@5 | 5,720,592 | 5,867,048 | 6,013,503 | -1,958,387 |
| RD1 | leadership | 899 | 655,371 | 2,545 | 648,574 | 181 | ABT6@5 | 5,719,558 | 5,877,782 | 6,036,006 | -1,947,653 |
| SP2 | leadership | 1,243 | 815,408 | 3,100 | 790,887 | 222 | LGN6@5 | 7,227,478 | 7,421,013 | 7,614,548 | -404,422 |
| EMH6 | authority | 92 | 1,361,508 | 4,343 | 1,108,175 | 314 | ABT6@5 | 6,776,524 | 7,613,209 | 8,449,894 | -212,226 |
| ABT6 | authority | — | — | — | — | — | needs 81 units but the cap is 76 | — | — | — | — |
| LGN6 | authority | — | — | — | — | — | needs 81 units but the cap is 72 | — | — | — | — |
| CHR6 | authority | — | — | — | — | — | needs 41 units but the cap is 37 | — | — | — | — |

## B · K8

baseline (M's Preservation): ARC2 1,221 · SP2 1,220 · RD2 609 · RD3 342 · ABT6 57 · LGN6 57 · EMH6 53 · CHR6 28 — avg 7,201,171; top stack 802,197 HP, troop floor 797,886

| sacrifice | pool | units | HP | leadership left for the other troops | troop floor | merc authority | still on an opener | min | avg | max | Δ |
|---|---|---|---|---|---|---|---|---|---|---|---|
| SW1 | leadership | 1,999 | 453,773 | 2,344 | 429,272 | 119 | RD3@5 CHR6@9 | 4,435,086 | 4,530,539 | 4,625,991 | -2,670,632 |
| ARC1 | leadership | 1,460 | 532,900 | 2,883 | 529,591 | 149 | RD3@5 EMH6@9 | 5,521,480 | 5,651,055 | 5,780,630 | -1,550,116 |
| SP1 | leadership | 1,464 | 534,360 | 2,879 | 527,258 | 148 | RD3@5 ABT6@9 | 5,489,148 | 5,608,464 | 5,727,780 | -1,592,707 |
| RD1 | leadership | 732 | 533,628 | 2,879 | 527,258 | 148 | RD3@5 ABT6@9 | 5,489,148 | 5,617,980 | 5,746,812 | -1,583,191 |
| EMH6 | authority | 92 | 1,361,508 | 4,343 | 797,886 | 262 | RD3@5 | 6,350,046 | 7,186,731 | 8,023,416 | -14,440 |
| ABT6 | authority | 76 | 1,054,880 | 4,343 | 797,886 | 242 | RD3@5 | 6,551,756 | 7,127,190 | 7,702,624 | -73,981 |
| LGN6 | authority | 72 | 997,272 | 4,343 | 797,886 | 238 | RD3@5 | 7,017,446 | 7,415,534 | 7,813,622 | 214,363 |
| CHR6 | authority | 37 | 1,024,974 | 4,343 | 797,886 | 241 | RD3@5 | 6,618,218 | 7,166,558 | 7,714,898 | -34,613 |

## Summary

| scenario | base | sacrifice | pool | units | sacrifice HP | stacks | troop floor after | merc authority | avg | Δ vs baseline |
|---|---|---|---|---|---|---|---|---|---|---|
| A | E8 | — (baseline) | — | — | — | 8 | 275,931 | 181 | 4,062,895 | 0 |
| A | E8 | ARC1 | leadership | 1,359 | 210,645 | 9 | 188,899 | 126 | 3,329,498 | -733,397 |
| A | E8 | SP1 | leadership | 1,359 | 210,645 | 9 | 188,899 | 126 | 3,319,985 | -742,910 |
| A | E8 | RD1 | leadership | 638 | 197,142 | 9 | 194,833 | 129 | 3,327,743 | -735,152 |
| A | E8 | ARC2 | leadership | 815 | 226,570 | 9 | 224,503 | 149 | 3,850,772 | -212,123 |
| A | E8 | EMH6 | authority | 92 | 577,116 | 8 | 275,931 | 230 | 4,019,639 | -43,256 |
| A | E8 | ABT6 | authority | 76 | 446,196 | 8 | 275,931 | 211 | 3,969,871 | -93,024 |
| A | E8 | LGN6 | authority | 72 | 422,712 | 8 | 275,931 | 207 | 4,174,311 | 111,416 |
| A | E8 | CHR6 | authority | 37 | 434,454 | 8 | 275,931 | 209 | 3,974,963 | -87,932 |
| A | K7 | — (baseline) | — | — | — | 7 | 469,775 | 296 | 5,559,067 | 0 |
| A | K7 | SW1 | leadership | 1,795 | 278,225 | 8 | 275,931 | 181 | 4,155,595 | -1,403,472 |
| A | K7 | ARC1 | leadership | 1,795 | 278,225 | 8 | 275,931 | 181 | 4,176,686 | -1,382,381 |
| A | K7 | SP1 | leadership | 1,795 | 278,225 | 8 | 275,931 | 181 | 4,164,121 | -1,394,946 |
| A | K7 | RD1 | leadership | 898 | 277,482 | 8 | 274,942 | 181 | 4,175,216 | -1,383,851 |
| A | K7 | SP2 | leadership | 1,222 | 339,716 | 8 | 337,249 | 223 | 5,130,539 | -428,528 |
| A | K7 | EMH6 | authority | 92 | 577,116 | 7 | 469,775 | 314 | 5,310,335 | -248,732 |
| A | K8 | — (baseline) | — | — | — | 8 | 337,249 | 223 | 5,107,427 | 0 |
| A | K8 | SW1 | leadership | 1,462 | 226,610 | 9 | 223,514 | 149 | 3,969,015 | -1,138,412 |
| A | K8 | ARC1 | leadership | 1,462 | 226,610 | 9 | 223,514 | 149 | 3,986,193 | -1,121,234 |
| A | K8 | SP1 | leadership | 1,462 | 226,610 | 9 | 223,514 | 149 | 3,975,959 | -1,131,468 |
| A | K8 | RD1 | leadership | 731 | 225,879 | 9 | 223,514 | 149 | 3,985,462 | -1,121,965 |
| A | K8 | EMH6 | authority | 92 | 577,116 | 8 | 337,249 | 262 | 5,015,278 | -92,149 |
| A | K8 | ABT6 | authority | 76 | 446,196 | 8 | 337,249 | 242 | 4,998,766 | -108,661 |
| A | K8 | LGN6 | authority | 72 | 422,712 | 8 | 337,249 | 238 | 5,292,658 | 185,231 |
| A | K8 | CHR6 | authority | 37 | 434,454 | 8 | 337,249 | 241 | 5,033,194 | -74,233 |
| B | E8 | — (baseline) | — | — | — | 8 | 520,259 | 145 | 4,474,506 | 0 |
| B | E8 | ARC1 | leadership | 1,088 | 397,120 | 9 | 389,611 | 110 | 3,963,369 | -511,137 |
| B | E8 | SP1 | leadership | 1,088 | 397,120 | 9 | 389,611 | 110 | 3,955,481 | -519,025 |
| B | E8 | RD1 | leadership | 544 | 396,576 | 9 | 389,611 | 110 | 3,962,553 | -511,953 |
| B | E8 | ARC2 | leadership | 683 | 448,731 | 9 | 438,604 | 121 | 4,389,768 | -84,738 |
| B | E8 | EMH6 | authority | 92 | 1,361,508 | 8 | 520,259 | 202 | 4,674,583 | 200,077 |
| B | E8 | ABT6 | authority | 76 | 1,054,880 | 8 | 520,259 | 184 | 4,565,966 | 91,460 |
| B | E8 | LGN6 | authority | 72 | 997,272 | 8 | 520,259 | 180 | 4,690,910 | 216,404 |
| B | E8 | CHR6 | authority | 37 | 1,024,974 | 8 | 520,259 | 183 | 4,592,414 | 117,908 |
| B | K7 | — (baseline) | — | — | — | 7 | 1,108,175 | 296 | 7,825,435 | 0 |
| B | K7 | SW1 | leadership | 2,382 | 540,714 | 8 | 499,262 | 140 | 4,669,803 | -3,155,632 |
| B | K7 | ARC1 | leadership | 1,793 | 654,445 | 8 | 650,907 | 181 | 5,881,115 | -1,944,320 |
| B | K7 | SP1 | leadership | 1,797 | 655,905 | 8 | 650,907 | 181 | 5,867,048 | -1,958,387 |
| B | K7 | RD1 | leadership | 899 | 655,371 | 8 | 648,574 | 181 | 5,877,782 | -1,947,653 |
| B | K7 | SP2 | leadership | 1,243 | 815,408 | 8 | 790,887 | 222 | 7,421,013 | -404,422 |
| B | K7 | EMH6 | authority | 92 | 1,361,508 | 7 | 1,108,175 | 314 | 7,613,209 | -212,226 |
| B | K8 | — (baseline) | — | — | — | 8 | 797,886 | 223 | 7,201,171 | 0 |
| B | K8 | SW1 | leadership | 1,999 | 453,773 | 9 | 429,272 | 119 | 4,530,539 | -2,670,632 |
| B | K8 | ARC1 | leadership | 1,460 | 532,900 | 9 | 529,591 | 149 | 5,651,055 | -1,550,116 |
| B | K8 | SP1 | leadership | 1,464 | 534,360 | 9 | 527,258 | 148 | 5,608,464 | -1,592,707 |
| B | K8 | RD1 | leadership | 732 | 533,628 | 9 | 527,258 | 148 | 5,617,980 | -1,583,191 |
| B | K8 | EMH6 | authority | 92 | 1,361,508 | 8 | 797,886 | 262 | 7,186,731 | -14,440 |
| B | K8 | ABT6 | authority | 76 | 1,054,880 | 8 | 797,886 | 242 | 7,127,190 | -73,981 |
| B | K8 | LGN6 | authority | 72 | 997,272 | 8 | 797,886 | 238 | 7,415,534 | 214,363 |
| B | K8 | CHR6 | authority | 37 | 1,024,974 | 8 | 797,886 | 241 | 7,166,558 | -34,613 |

The "still on an opener" column lists the stacks that sit at p ≡ 1 (mod 4) *after* the shift — those are the ones the sacrifice did **not** save. A sacrifice pays only when the stacks it moves off the openers are worth more per hit than everything the sacrifice itself gives up.
