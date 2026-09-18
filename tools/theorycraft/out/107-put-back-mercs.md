
## localStorage dump — 4 975 / 2 180, hunters 450 (93 ms, 4 stops, horizon 4)

### The stops, as generated and after the put-back
| march | troops | hired | troop floor HP | hired top HP | burn | damage | silver | queue | a silver | a hired |
|---|---|---|---|---|---|---|---|---|---|---|
| sweet-spot — generated | spearman 2 911 · rider 3 257 · rider 2 449 · rider 1 792 · archer 2 1,057 | epic-monster-hunter-6 38 | 456,624 | 365,636 | 4 | 2,520,042 | 2,268,000 | 8d 17h | 1.111 | 630,011 |
| sweet-spot — offered | spearman 2 911 · rider 3 257 · rider 2 449 · rider 1 792 · archer 2 1,057 | epic-monster-hunter-6 38 | 456,624 | 365,636 | 4 | 2,520,042 | 2,268,000 | 8d 17h | 1.111 | 630,011 |
| more-mercs — generated | rider 2 1,565 · rider 3 862 | epic-monster-hunter-6 60 | 1,622,284 | 577,320 | 6 | 2,594,899 | 2,771,800 | 14d 21h | 0.936 | 432,483 |
| more-mercs — offered (put back spearman-2: 0.2 % dmg, 2.3 % silver saved, 9.9 % queue saved) | spearman 2 1,915 · rider 2 980 · rider 3 550 | epic-monster-hunter-6 60 | 1,035,100 | 577,320 | 6 | 2,600,334 | 2,707,500 | 13d 10h | 0.960 | 433,389 |
| steady-max — generated | rider 2 1,565 · rider 3 862 | epic-monster-hunter-6 75 | 1,622,284 | 721,650 | 8 | 2,837,586 | 2,771,800 | 14d 21h | 1.024 | 354,698 |
| steady-max — offered (put back spearman-2: 0.2 % dmg, 2.3 % silver saved, 9.9 % queue saved) | spearman 2 1,915 · rider 2 980 · rider 3 550 | epic-monster-hunter-6 75 | 1,035,100 | 721,650 | 8 | 2,843,021 | 2,707,500 | 13d 10h | 1.050 | 355,378 |
| all-in — generated | rider 2 1,565 · rider 3 862 | epic-monster-hunter-6 168 | 1,622,284 | 1,616,496 | 17 | 4,342,242 | 2,771,800 | 14d 21h | 1.567 | 255,426 |
| all-in — offered | rider 2 1,565 · rider 3 862 | epic-monster-hunter-6 168 | 1,622,284 | 1,616,496 | 17 | 4,342,242 | 2,771,800 | 14d 21h | 1.567 | 255,426 |

### His Troops-first march, priced by the recap on this request
| march | troops | hired | troop floor HP | hired top HP | burn | damage | silver | queue | a silver | a hired |
|---|---|---|---|---|---|---|---|---|---|---|
| Troops first (his message) | archer 1 1,028 · spearman 1 1,027 · rider 1 513 · archer 2 568 · spearman 2 567 · rider 2 283 · rider 3 159 | epic-monster-hunter-6 25 | 245,376 | 240,550 | 3 | 2,169,458 | 1,997,400 | 5d 14h | 1.086 | 723,153 |
| Troops first (sized here, Elite) | archer 1 1,158 · spearman 1 918 · rider 1 470 · archer 2 639 · spearman 2 508 · rider 2 260 · rider 3 146 | epic-monster-hunter-6 450 | 274,772 | 4,329,900 **exposed** | 45 | 5,116,375 | 1,942,700 | 5d 9h | 2.634 | 113,697 |

### Frontier rows fielding every troop type the account holds (the tight ladders), and their verdicts
| silver (campaign) | damage (campaign) | burn / march | troops | hired | undominated | in band | stop | generator of |
|---|---|---|---|---|---|---|---|---|
| 4,357,100 | 4,576,048 | 1 | archer 1 469 · archer 2 250 · rider 1 195 · rider 2 110 · rider 3 58 · spearman 1 403 · spearman 2 220 | epic-monster-hunter-6 9 | yes | no | — | — |
| 4,630,400 | 4,869,601 | 1 | archer 1 521 · archer 2 278 · rider 1 217 · rider 2 123 · rider 3 65 · spearman 1 448 · spearman 2 244 | epic-monster-hunter-6 10 | yes | no | — | — |
| 4,630,400 | 4,869,601 | 1 | archer 1 521 · archer 2 278 · rider 1 217 · rider 2 123 · rider 3 65 · spearman 1 448 · spearman 2 244 | epic-monster-hunter-6 10 | yes | no | — | — |
| 7,045,700 | 7,456,768 | 2 | archer 1 990 · archer 2 528 · rider 1 412 · rider 2 233 · rider 3 123 · spearman 1 852 · spearman 2 464 | epic-monster-hunter-6 19 | yes | no | — | — |
| 7,320,500 | 7,751,215 | 2 | archer 1 1,042 · archer 2 556 · rider 1 434 · rider 2 246 · rider 3 130 · spearman 1 897 · spearman 2 489 | epic-monster-hunter-6 20 | yes | no | — | — |
5 such rows of 63 on the frontier.

Sweet spot: 2,520,042 a march for 2,268,000 (1.111 a silver), 4 burned. The silver-saver rule needs a march left of it that is at least as efficient a silver.

### The put-back with the hired count re-derived under the new troop floor
For each stop and each left-out troop type: the MS sizer over the stop’s types plus that one with the stop’s hired count carried as its cap (what the pass does), and with the cap left at the stock so the sizer fields what the new floor shelters; both then sheltered under the lowest troop stack.
| march | troops | hired | troop floor HP | hired top HP | burn | damage | silver | queue | a silver | a hired |
|---|---|---|---|---|---|---|---|---|---|---|
| sweet-spot + archer-1 (hired carried) | archer 1 1,418 · rider 1 577 · archer 2 784 · spearman 2 623 · rider 2 319 · rider 3 179 | epic-monster-hunter-6 27 | 336,878 | 259,794 | 3 | 1,822,583 | 2,044,700 | 6d 10h | 0.891 | 607,528 |
| sweet-spot + archer-1 (hired re-derived) | archer 1 1,418 · rider 1 577 · archer 2 784 · spearman 2 623 · rider 2 319 · rider 3 179 | epic-monster-hunter-6 27 | 336,878 | 259,794 | 3 | 1,822,583 | 2,044,700 | 6d 10h | 0.891 | 607,528 |
| sweet-spot + spearman-1 (hired carried) | spearman 1 1,197 · rider 1 613 · archer 2 833 · spearman 2 661 · rider 2 339 · rider 3 190 | epic-monster-hunter-6 29 | 357,580 | 279,038 | 3 | 1,938,727 | 2,078,900 | 6d 19h | 0.933 | 646,242 |
| sweet-spot + spearman-1 (hired re-derived) | spearman 1 1,197 · rider 1 613 · archer 2 833 · spearman 2 661 · rider 2 339 · rider 3 190 | epic-monster-hunter-6 29 | 357,580 | 279,038 | 3 | 1,938,727 | 2,078,900 | 6d 19h | 0.933 | 646,242 |
| more-mercs + archer-1 (hired carried) | archer 1 2,915 · rider 2 660 · rider 3 370 | epic-monster-hunter-6 58 | 696,340 | 558,076 | 6 | 1,844,396 | 2,052,500 | 6d 20h | 0.899 | 307,399 |
| more-mercs + archer-1 (hired re-derived) | archer 1 2,915 · rider 2 660 · rider 3 370 | epic-monster-hunter-6 58 | 696,340 | 558,076 | 6 | 1,844,396 | 2,052,500 | 6d 20h | 0.899 | 307,399 |
| more-mercs + archer-2 (hired carried) | archer 2 2,191 · rider 2 892 · rider 3 500 | epic-monster-hunter-6 60 | 941,000 | 577,320 | 6 | 2,195,151 | 2,687,500 | 13d 3h | 0.817 | 365,859 |
| more-mercs + archer-2 (hired re-derived) | archer 2 2,191 · rider 2 892 · rider 3 500 | epic-monster-hunter-6 78 | 941,000 | 750,516 | 8 | 2,486,375 | 2,687,500 | 13d 3h | 0.925 | 310,797 |
| more-mercs + rider-1 (hired carried) | rider 1 1,333 · rider 2 739 · rider 3 415 | epic-monster-hunter-6 60 | 781,030 | 577,320 | 6 | 2,202,739 | 2,119,800 | 7d 13h | 1.039 | 367,123 |
| more-mercs + rider-1 (hired re-derived) | rider 1 1,333 · rider 2 739 · rider 3 415 | epic-monster-hunter-6 65 | 781,030 | 625,430 | 7 | 2,283,635 | 2,119,800 | 7d 13h | 1.077 | 326,234 |
| more-mercs + spearman-1 (hired carried) | spearman 1 2,633 · rider 2 750 · rider 3 421 | epic-monster-hunter-6 60 | 792,322 | 577,320 | 6 | 2,204,409 | 2,129,300 | 7d 16h | 1.035 | 367,402 |
| more-mercs + spearman-1 (hired re-derived) | spearman 1 2,633 · rider 2 750 · rider 3 421 | epic-monster-hunter-6 64 | 792,322 | 615,808 | 7 | 2,269,125 | 2,129,300 | 7d 16h | 1.066 | 324,161 |
| more-mercs + spearman-2 (hired carried) | spearman 2 1,915 · rider 2 980 · rider 3 550 | epic-monster-hunter-6 60 | 1,035,100 | 577,320 | 6 | 2,600,334 | 2,707,500 | 13d 10h | 0.960 | 433,389 |
| more-mercs + spearman-2 (hired re-derived) | spearman 2 1,915 · rider 2 980 · rider 3 550 | epic-monster-hunter-6 84 | 1,035,100 | 808,248 | 9 | 2,988,632 | 2,707,500 | 13d 10h | 1.104 | 332,070 |
| steady-max + archer-1 (hired carried) | archer 1 2,915 · rider 2 660 · rider 3 370 | epic-monster-hunter-6 58 | 696,340 | 558,076 | 6 | 1,844,396 | 2,052,500 | 6d 20h | 0.899 | 307,399 |
| steady-max + archer-1 (hired re-derived) | archer 1 2,915 · rider 2 660 · rider 3 370 | epic-monster-hunter-6 58 | 696,340 | 558,076 | 6 | 1,844,396 | 2,052,500 | 6d 20h | 0.899 | 307,399 |
| steady-max + archer-2 (hired carried) | archer 2 2,191 · rider 2 892 · rider 3 500 | epic-monster-hunter-6 75 | 941,000 | 721,650 | 8 | 2,437,838 | 2,687,500 | 13d 3h | 0.907 | 304,730 |
| steady-max + archer-2 (hired re-derived) | archer 2 2,191 · rider 2 892 · rider 3 500 | epic-monster-hunter-6 78 | 941,000 | 750,516 | 8 | 2,486,375 | 2,687,500 | 13d 3h | 0.925 | 310,797 |
| steady-max + rider-1 (hired carried) | rider 1 1,333 · rider 2 739 · rider 3 415 | epic-monster-hunter-6 65 | 781,030 | 625,430 | 7 | 2,283,635 | 2,119,800 | 7d 13h | 1.077 | 326,234 |
| steady-max + rider-1 (hired re-derived) | rider 1 1,333 · rider 2 739 · rider 3 415 | epic-monster-hunter-6 65 | 781,030 | 625,430 | 7 | 2,283,635 | 2,119,800 | 7d 13h | 1.077 | 326,234 |
| steady-max + spearman-1 (hired carried) | spearman 1 2,633 · rider 2 750 · rider 3 421 | epic-monster-hunter-6 64 | 792,322 | 615,808 | 7 | 2,269,125 | 2,129,300 | 7d 16h | 1.066 | 324,161 |
| steady-max + spearman-1 (hired re-derived) | spearman 1 2,633 · rider 2 750 · rider 3 421 | epic-monster-hunter-6 64 | 792,322 | 615,808 | 7 | 2,269,125 | 2,129,300 | 7d 16h | 1.066 | 324,161 |
| steady-max + spearman-2 (hired carried) | spearman 2 1,915 · rider 2 980 · rider 3 550 | epic-monster-hunter-6 75 | 1,035,100 | 721,650 | 8 | 2,843,021 | 2,707,500 | 13d 10h | 1.050 | 355,378 |
| steady-max + spearman-2 (hired re-derived) | spearman 2 1,915 · rider 2 980 · rider 3 550 | epic-monster-hunter-6 84 | 1,035,100 | 808,248 | 9 | 2,988,632 | 2,707,500 | 13d 10h | 1.104 | 332,070 |
| all-in + archer-1 (hired carried) | archer 1 2,915 · rider 2 660 · rider 3 370 | epic-monster-hunter-6 58 | 696,340 | 558,076 | 6 | 1,844,396 | 2,052,500 | 6d 20h | 0.899 | 307,399 |
| all-in + archer-1 (hired re-derived) | archer 1 2,915 · rider 2 660 · rider 3 370 | epic-monster-hunter-6 58 | 696,340 | 558,076 | 6 | 1,844,396 | 2,052,500 | 6d 20h | 0.899 | 307,399 |
| all-in + archer-2 (hired carried) | archer 2 2,191 · rider 2 892 · rider 3 500 | epic-monster-hunter-6 78 | 941,000 | 750,516 | 8 | 2,486,375 | 2,687,500 | 13d 3h | 0.925 | 310,797 |
| all-in + archer-2 (hired re-derived) | archer 2 2,191 · rider 2 892 · rider 3 500 | epic-monster-hunter-6 78 | 941,000 | 750,516 | 8 | 2,486,375 | 2,687,500 | 13d 3h | 0.925 | 310,797 |
| all-in + rider-1 (hired carried) | rider 1 1,333 · rider 2 739 · rider 3 415 | epic-monster-hunter-6 65 | 781,030 | 625,430 | 7 | 2,283,635 | 2,119,800 | 7d 13h | 1.077 | 326,234 |
| all-in + rider-1 (hired re-derived) | rider 1 1,333 · rider 2 739 · rider 3 415 | epic-monster-hunter-6 65 | 781,030 | 625,430 | 7 | 2,283,635 | 2,119,800 | 7d 13h | 1.077 | 326,234 |
| all-in + spearman-1 (hired carried) | spearman 1 2,633 · rider 2 750 · rider 3 421 | epic-monster-hunter-6 64 | 792,322 | 615,808 | 7 | 2,269,125 | 2,129,300 | 7d 16h | 1.066 | 324,161 |
| all-in + spearman-1 (hired re-derived) | spearman 1 2,633 · rider 2 750 · rider 3 421 | epic-monster-hunter-6 64 | 792,322 | 615,808 | 7 | 2,269,125 | 2,129,300 | 7d 16h | 1.066 | 324,161 |
| all-in + spearman-2 (hired carried) | spearman 2 1,915 · rider 2 980 · rider 3 550 | epic-monster-hunter-6 84 | 1,035,100 | 808,248 | 9 | 2,988,632 | 2,707,500 | 13d 10h | 1.104 | 332,070 |
| all-in + spearman-2 (hired re-derived) | spearman 2 1,915 · rider 2 980 · rider 3 550 | epic-monster-hunter-6 84 | 1,035,100 | 808,248 | 9 | 2,988,632 | 2,707,500 | 13d 10h | 1.104 | 332,070 |


## his message — 5 100 / 2 200, hunters 120 (38 ms, 4 stops, horizon 4)

### The stops, as generated and after the put-back
| march | troops | hired | troop floor HP | hired top HP | burn | damage | silver | queue | a silver | a hired |
|---|---|---|---|---|---|---|---|---|---|---|
| silver-saver — generated | rider 2 709 · rider 3 391 · archer 2 1,670 | epic-monster-hunter-6 60 | 721,440 | 577,320 | 6 | 2,141,540 | 2,091,400 | 10d 5h | 1.024 | 356,923 |
| silver-saver — offered | rider 2 709 · rider 3 391 · archer 2 1,670 | epic-monster-hunter-6 60 | 721,440 | 577,320 | 6 | 2,141,540 | 2,091,400 | 10d 5h | 1.024 | 356,923 |
| sweet-spot — generated | rider 2 1,639 · rider 3 903 | epic-monster-hunter-6 70 | 1,699,446 | 673,540 | 7 | 2,833,801 | 2,903,200 | 15d 14h | 0.976 | 404,829 |
| sweet-spot — offered (put back spearman-2: -1.1 % dmg, 4.4 % silver saved, 11.9 % queue saved) | spearman 2 1,962 · rider 2 1,005 · rider 3 564 | epic-monster-hunter-6 70 | 1,061,448 | 673,540 | 7 | 2,803,382 | 2,775,600 | 13d 18h | 1.010 | 400,483 |
| steady-max — generated | rider 2 1,643 · rider 3 905 | epic-monster-hunter-6 90 | 1,703,210 | 865,980 | 9 | 3,161,270 | 2,910,000 | 15d 15h | 1.086 | 351,252 |
| steady-max — offered (put back spearman-2: -1.1 % dmg, 4.6 % silver saved, 12.1 % queue saved) | spearman 2 1,962 · rider 2 1,005 · rider 3 564 | epic-monster-hunter-6 90 | 1,061,448 | 865,980 | 9 | 3,126,964 | 2,775,600 | 13d 18h | 1.127 | 347,440 |
| all-in — generated | rider 3 2,454 | epic-monster-hunter-6 120 | 4,618,428 | 1,154,640 | 12 | 3,535,611 | 3,435,600 | 23d 20h | 1.029 | 294,634 |
| all-in — offered (put back rider-2: 3.5 % dmg, 15.1 % silver saved, 34.1 % queue saved) | rider 2 1,634 · rider 3 916 | epic-monster-hunter-6 120 | 1,723,912 | 1,154,640 | 12 | 3,658,034 | 2,916,400 | 15d 17h | 1.254 | 304,836 |

### His Troops-first march, priced by the recap on this request
| march | troops | hired | troop floor HP | hired top HP | burn | damage | silver | queue | a silver | a hired |
|---|---|---|---|---|---|---|---|---|---|---|
| Troops first (his message) | archer 1 1,028 · spearman 1 1,027 · rider 1 513 · archer 2 568 · spearman 2 567 · rider 2 283 · rider 3 159 | epic-monster-hunter-6 25 | 245,376 | 240,550 | 3 | 2,169,458 | 1,997,400 | 5d 14h | 1.086 | 723,153 |
| Troops first (sized here, Elite) | archer 1 1,187 · spearman 1 942 · rider 1 482 · archer 2 656 · spearman 2 521 · rider 2 266 · rider 3 149 | epic-monster-hunter-6 120 | 280,418 | 1,154,640 **exposed** | 12 | 2,482,079 | 1,991,000 | 5d 13h | 1.247 | 206,840 |

### Frontier rows fielding every troop type the account holds (the tight ladders), and their verdicts
| silver (campaign) | damage (campaign) | burn / march | troops | hired | undominated | in band | stop | generator of |
|---|---|---|---|---|---|---|---|---|
| 6,035,000 | 6,326,717 | 1 | archer 1 521 · archer 2 278 · rider 1 217 · rider 2 125 · rider 3 65 · spearman 1 448 · spearman 2 239 | epic-monster-hunter-6 10 | yes | no | — | — |
| 6,035,000 | 6,326,717 | 1 | archer 1 521 · archer 2 278 · rider 1 217 · rider 2 125 · rider 3 65 · spearman 1 448 · spearman 2 239 | epic-monster-hunter-6 10 | yes | no | — | — |
| 8,641,200 | 9,121,524 | 2 | archer 1 1,042 · archer 2 556 · rider 1 434 · rider 2 251 · rider 3 130 · spearman 1 897 · spearman 2 479 | epic-monster-hunter-6 20 | yes | no | — | — |
| 8,641,200 | 9,121,524 | 2 | archer 1 1,042 · archer 2 556 · rider 1 434 · rider 2 251 · rider 3 130 · spearman 1 897 · spearman 2 479 | epic-monster-hunter-6 20 | yes | no | — | — |
| 8,641,200 | 9,121,524 | 2 | archer 1 1,042 · archer 2 556 · rider 1 434 · rider 2 251 · rider 3 130 · spearman 1 897 · spearman 2 479 | epic-monster-hunter-6 20 | yes | no | — | — |
| 9,211,200 | 9,527,625 | 2 | archer 1 1,153 · archer 2 615 · rider 1 480 · rider 2 277 · rider 3 144 · spearman 1 992 · spearman 2 530 | epic-monster-hunter-6 20 | yes | no | — | — |
| 9,264,200 | 8,621,354 | 1 | archer 1 1,147 · archer 2 612 · rider 1 477 · rider 2 276 · rider 3 143 · spearman 1 986 · spearman 2 527 | epic-monster-hunter-6 10 | yes | no | — | — |
| 9,293,000 | 8,643,452 | 1 | archer 1 1,152 · archer 2 615 · rider 1 479 · rider 2 277 · rider 3 144 · spearman 1 991 · spearman 2 530 | epic-monster-hunter-6 10 | yes | no | — | — |
8 such rows of 54 on the frontier.

Sweet spot: 2,803,382 a march for 2,775,600 (1.010 a silver), 7 burned. The silver-saver rule needs a march left of it that is at least as efficient a silver.

### The put-back with the hired count re-derived under the new troop floor
For each stop and each left-out troop type: the MS sizer over the stop’s types plus that one with the stop’s hired count carried as its cap (what the pass does), and with the cap left at the stock so the sizer fields what the new floor shelters; both then sheltered under the lowest troop stack.
| march | troops | hired | troop floor HP | hired top HP | burn | damage | silver | queue | a silver | a hired |
|---|---|---|---|---|---|---|---|---|---|---|
| silver-saver + archer-1 (hired carried) | archer 1 2,257 · archer 2 1,251 · rider 2 510 · rider 3 286 | epic-monster-hunter-6 45 | 538,252 | 432,990 | 5 | 1,428,275 | 2,213,000 | 7d 21h | 0.645 | 285,655 |
| silver-saver + archer-1 (hired re-derived) | archer 1 2,257 · archer 2 1,251 · rider 2 510 · rider 3 286 | epic-monster-hunter-6 45 | 538,252 | 432,990 | 5 | 1,428,275 | 2,213,000 | 7d 21h | 0.645 | 285,655 |
| silver-saver + rider-1 (hired carried) | rider 1 1,003 · archer 2 1,362 · rider 2 555 · rider 3 311 | epic-monster-hunter-6 49 | 585,302 | 471,478 | 5 | 1,717,457 | 2,273,200 | 8d 12h | 0.756 | 343,491 |
| silver-saver + rider-1 (hired re-derived) | rider 1 1,003 · archer 2 1,362 · rider 2 555 · rider 3 311 | epic-monster-hunter-6 49 | 585,302 | 471,478 | 5 | 1,717,457 | 2,273,200 | 8d 12h | 0.756 | 343,491 |
| silver-saver + spearman-1 (hired carried) | spearman 1 1,973 · archer 2 1,377 · rider 2 561 · rider 3 314 | epic-monster-hunter-6 48 | 590,948 | 461,856 | 5 | 1,698,469 | 2,281,000 | 8d 14h | 0.745 | 339,694 |
| silver-saver + spearman-1 (hired re-derived) | spearman 1 1,973 · archer 2 1,377 · rider 2 561 · rider 3 314 | epic-monster-hunter-6 48 | 590,948 | 461,856 | 5 | 1,698,469 | 2,281,000 | 8d 14h | 0.745 | 339,694 |
| silver-saver + spearman-2 (hired carried) | archer 2 1,664 · spearman 2 1,322 · rider 2 677 · rider 3 380 | epic-monster-hunter-6 58 | 715,160 | 558,076 | 6 | 2,259,787 | 2,702,000 | 12d 17h | 0.836 | 376,631 |
| silver-saver + spearman-2 (hired re-derived) | archer 2 1,664 · spearman 2 1,322 · rider 2 677 · rider 3 380 | epic-monster-hunter-6 58 | 715,160 | 558,076 | 6 | 2,259,787 | 2,702,000 | 12d 17h | 0.836 | 376,631 |
| sweet-spot + archer-1 (hired carried) | archer 1 2,990 · rider 2 676 · rider 3 379 | epic-monster-hunter-6 59 | 713,278 | 567,698 | 6 | 1,882,578 | 2,103,600 | 7d 0h | 0.895 | 313,763 |
| sweet-spot + archer-1 (hired re-derived) | archer 1 2,990 · rider 2 676 · rider 3 379 | epic-monster-hunter-6 59 | 713,278 | 567,698 | 6 | 1,882,578 | 2,103,600 | 7d 0h | 0.895 | 313,763 |
| sweet-spot + archer-2 (hired carried) | archer 2 2,246 · rider 2 914 · rider 3 513 | epic-monster-hunter-6 70 | 965,466 | 673,540 | 7 | 2,388,009 | 2,755,200 | 13d 11h | 0.867 | 341,144 |
| sweet-spot + archer-2 (hired re-derived) | archer 2 2,246 · rider 2 914 · rider 3 513 | epic-monster-hunter-6 80 | 965,466 | 769,760 | 8 | 2,549,800 | 2,755,200 | 13d 11h | 0.925 | 318,725 |
| sweet-spot + rider-1 (hired carried) | rider 1 1,367 · rider 2 758 · rider 3 425 | epic-monster-hunter-6 66 | 799,850 | 635,052 | 7 | 2,330,574 | 2,173,200 | 7d 18h | 1.072 | 332,939 |
| sweet-spot + rider-1 (hired re-derived) | rider 1 1,367 · rider 2 758 · rider 3 425 | epic-monster-hunter-6 66 | 799,850 | 635,052 | 7 | 2,330,574 | 2,173,200 | 7d 18h | 1.072 | 332,939 |
| sweet-spot + spearman-1 (hired carried) | spearman 1 2,700 · rider 2 769 · rider 3 431 | epic-monster-hunter-6 66 | 811,142 | 635,052 | 7 | 2,331,895 | 2,182,400 | 7d 20h | 1.069 | 333,128 |
| sweet-spot + spearman-1 (hired re-derived) | spearman 1 2,700 · rider 2 769 · rider 3 431 | epic-monster-hunter-6 66 | 811,142 | 635,052 | 7 | 2,331,895 | 2,182,400 | 7d 20h | 1.069 | 333,128 |
| sweet-spot + spearman-2 (hired carried) | spearman 2 1,962 · rider 2 1,005 · rider 3 564 | epic-monster-hunter-6 70 | 1,061,448 | 673,540 | 7 | 2,803,382 | 2,775,600 | 13d 18h | 1.010 | 400,483 |
| sweet-spot + spearman-2 (hired re-derived) | spearman 2 1,962 · rider 2 1,005 · rider 3 564 | epic-monster-hunter-6 86 | 1,061,448 | 827,492 | 9 | 3,062,248 | 2,775,600 | 13d 18h | 1.103 | 340,250 |
| steady-max + archer-1 (hired carried) | archer 1 2,990 · rider 2 676 · rider 3 379 | epic-monster-hunter-6 59 | 713,278 | 567,698 | 6 | 1,882,578 | 2,103,600 | 7d 0h | 0.895 | 313,763 |
| steady-max + archer-1 (hired re-derived) | archer 1 2,990 · rider 2 676 · rider 3 379 | epic-monster-hunter-6 59 | 713,278 | 567,698 | 6 | 1,882,578 | 2,103,600 | 7d 0h | 0.895 | 313,763 |
| steady-max + archer-2 (hired carried) | archer 2 2,246 · rider 2 914 · rider 3 513 | epic-monster-hunter-6 80 | 965,466 | 769,760 | 8 | 2,549,800 | 2,755,200 | 13d 11h | 0.925 | 318,725 |
| steady-max + archer-2 (hired re-derived) | archer 2 2,246 · rider 2 914 · rider 3 513 | epic-monster-hunter-6 80 | 965,466 | 769,760 | 8 | 2,549,800 | 2,755,200 | 13d 11h | 0.925 | 318,725 |
| steady-max + rider-1 (hired carried) | rider 1 1,367 · rider 2 758 · rider 3 425 | epic-monster-hunter-6 66 | 799,850 | 635,052 | 7 | 2,330,574 | 2,173,200 | 7d 18h | 1.072 | 332,939 |
| steady-max + rider-1 (hired re-derived) | rider 1 1,367 · rider 2 758 · rider 3 425 | epic-monster-hunter-6 66 | 799,850 | 635,052 | 7 | 2,330,574 | 2,173,200 | 7d 18h | 1.072 | 332,939 |
| steady-max + spearman-1 (hired carried) | spearman 1 2,700 · rider 2 769 · rider 3 431 | epic-monster-hunter-6 66 | 811,142 | 635,052 | 7 | 2,331,895 | 2,182,400 | 7d 20h | 1.069 | 333,128 |
| steady-max + spearman-1 (hired re-derived) | spearman 1 2,700 · rider 2 769 · rider 3 431 | epic-monster-hunter-6 66 | 811,142 | 635,052 | 7 | 2,331,895 | 2,182,400 | 7d 20h | 1.069 | 333,128 |
| steady-max + spearman-2 (hired carried) | spearman 2 1,962 · rider 2 1,005 · rider 3 564 | epic-monster-hunter-6 86 | 1,061,448 | 827,492 | 9 | 3,062,248 | 2,775,600 | 13d 18h | 1.103 | 340,250 |
| steady-max + spearman-2 (hired re-derived) | spearman 2 1,962 · rider 2 1,005 · rider 3 564 | epic-monster-hunter-6 86 | 1,061,448 | 827,492 | 9 | 3,062,248 | 2,775,600 | 13d 18h | 1.103 | 340,250 |
| all-in + archer-1 (hired carried) | archer 1 4,066 · rider 3 517 | epic-monster-hunter-6 81 | 972,994 | 779,382 | 9 | 1,982,193 | 1,943,600 | 5d 17h | 1.020 | 220,244 |
| all-in + archer-1 (hired re-derived) | archer 1 4,066 · rider 3 517 | epic-monster-hunter-6 81 | 972,994 | 779,382 | 9 | 1,982,193 | 1,943,600 | 5d 17h | 1.020 | 220,244 |
| all-in + archer-2 (hired carried) | archer 2 3,498 · rider 3 801 | epic-monster-hunter-6 120 | 1,507,482 | 1,154,640 | 12 | 2,982,151 | 2,870,400 | 15d 1h | 1.039 | 248,513 |
| all-in + archer-2 (hired re-derived) | archer 2 3,498 · rider 3 801 | epic-monster-hunter-6 120 | 1,507,482 | 1,154,640 | 12 | 2,982,151 | 2,870,400 | 15d 1h | 1.039 | 248,513 |
| all-in + rider-1 (hired carried) | rider 1 1,944 · rider 3 606 | epic-monster-hunter-6 95 | 1,140,492 | 914,090 | 10 | 2,640,230 | 2,014,800 | 6d 13h | 1.310 | 264,023 |
| all-in + rider-1 (hired re-derived) | rider 1 1,944 · rider 3 606 | epic-monster-hunter-6 95 | 1,140,492 | 914,090 | 10 | 2,640,230 | 2,014,800 | 6d 13h | 1.310 | 264,023 |
| all-in + rider-2 (hired carried) | rider 2 1,634 · rider 3 916 | epic-monster-hunter-6 120 | 1,723,912 | 1,154,640 | 12 | 3,658,034 | 2,916,400 | 15d 17h | 1.254 | 304,836 |
| all-in + rider-2 (hired re-derived) | rider 2 1,634 · rider 3 916 | epic-monster-hunter-6 120 | 1,723,912 | 1,154,640 | 12 | 3,658,034 | 2,916,400 | 15d 17h | 1.254 | 304,836 |
| all-in + spearman-1 (hired carried) | spearman 1 3,864 · rider 3 618 | epic-monster-hunter-6 95 | 1,163,076 | 914,090 | 10 | 2,638,415 | 2,024,400 | 6d 16h | 1.303 | 263,842 |
| all-in + spearman-1 (hired re-derived) | spearman 1 3,864 · rider 3 618 | epic-monster-hunter-6 95 | 1,163,076 | 914,090 | 10 | 2,638,415 | 2,024,400 | 6d 16h | 1.303 | 263,842 |
| all-in + spearman-2 (hired carried) | spearman 2 3,236 · rider 3 932 | epic-monster-hunter-6 120 | 1,754,024 | 1,154,640 | 12 | 3,631,436 | 2,922,800 | 15d 19h | 1.242 | 302,620 |
| all-in + spearman-2 (hired re-derived) | spearman 2 3,236 · rider 3 932 | epic-monster-hunter-6 120 | 1,754,024 | 1,154,640 | 12 | 3,631,436 | 2,922,800 | 15d 19h | 1.242 | 302,620 |

