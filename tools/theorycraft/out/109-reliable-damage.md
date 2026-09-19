# 109 — the plan stands on reliable damage

Run: 2026-09-19T02:13:26.225Z. This run's engine scores a plan on **reliable** damage; the other sidecar on disk is **expected** (2026-09-19T01:41:39.400Z).

The two readings: **worst opening** is the enemy-first journal (`minDamage`, what the recap calls "Worst opening"), **expected** the midpoint of the two journals (`avgDamage`), **best** the army-first journal (`maxDamage`). The game decides who opens, 50/50, so the midpoint is a number no single fight pays out.


## §A — every stop as it is offered today, at the three readings

Per stop: the **repeated** march and the whole **campaign**. The gap is `expected − worst` over expected; it is exactly **half** the opener’s one extra strike, because the army-first journal inserts a single attack by the first stack in attack order and nothing else.


**first-run army, Bear V ×1 (20 000 leadership)**

| stop | burned | repeat worst | repeat expected | repeat best | gap | the gap is | campaign worst | campaign expected | gap |
|---|---|---|---|---|---|---|---|---|---|
| sweet-spot | 1 | 4,631,402 | 4,722,842 | 4,814,282 | 1.94 % | swordsman-1 3,048 × 1 = 182,880 (top-HP stack) | 18,189,008 | 18,554,768 | 1.97 % |

**first-run army, Bear V ×2 (20 000 leadership)**

| stop | burned | repeat worst | repeat expected | repeat best | gap | the gap is | campaign worst | campaign expected | gap |
|---|---|---|---|---|---|---|---|---|---|
| sweet-spot | 1 | 4,743,602 | 4,835,042 | 4,926,482 | 1.89 % | swordsman-1 3,048 × 1 = 182,880 (top-HP stack) | 18,413,408 | 18,779,168 | 1.95 % |

**first-run army, Bear V ×3 (20 000 leadership)**

| stop | burned | repeat worst | repeat expected | repeat best | gap | the gap is | campaign worst | campaign expected | gap |
|---|---|---|---|---|---|---|---|---|---|
| sweet-spot | 1 | 4,631,402 | 4,722,842 | 4,814,282 | 1.94 % | swordsman-1 3,048 × 1 = 182,880 (top-HP stack) | 18,413,408 | 18,779,168 | 1.95 % |
| all-in | 1 | 4,044,264 | 6,054,272 | 8,064,280 | 33.20 % | archer-3 10,010 × 1 = 4,020,016 (top-HP stack) | 16,539,794 | 22,661,258 | 27.01 % |

**first-run army, Bear V ×10 (20 000 leadership)**

| stop | burned | repeat worst | repeat expected | repeat best | gap | the gap is | campaign worst | campaign expected | gap |
|---|---|---|---|---|---|---|---|---|---|
| sweet-spot | 1 | 5,192,402 | 5,283,842 | 5,375,282 | 1.73 % | swordsman-1 3,048 × 1 = 182,880 (top-HP stack) | 20,769,608 | 21,135,368 | 1.73 % |
| all-in | 1 | 4,306,064 | 6,316,072 | 8,326,080 | 31.82 % | archer-3 10,010 × 1 = 4,020,016 (top-HP stack) | 16,999,856 | 25,039,888 | 32.11 % |

**first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)**

| stop | burned | repeat worst | repeat expected | repeat best | gap | the gap is | campaign worst | campaign expected | gap |
|---|---|---|---|---|---|---|---|---|---|
| sweet-spot | 6 | 7,109,888 | 7,201,328 | 7,292,768 | 1.27 % | swordsman-1 3,048 × 1 = 182,880 (top-HP stack) | 28,655,444 | 29,021,204 | 1.26 % |
| steady-max | 7 | 7,498,490 | 7,589,930 | 7,681,370 | 1.20 % | swordsman-1 3,048 × 1 = 182,880 (top-HP stack) | 29,691,713 | 30,057,473 | 1.22 % |
| all-in | 9 | 7,897,408 | 8,047,249 | 8,197,090 | 1.86 % | archer-1 3,589 × 1 = 299,682 (top-HP stack) | 29,841,879 | 30,324,441 | 1.59 % |

**the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)**

| stop | burned | repeat worst | repeat expected | repeat best | gap | the gap is | campaign worst | campaign expected | gap |
|---|---|---|---|---|---|---|---|---|---|
| sweet-spot | 4 | 2,031,002 | 2,058,215 | 2,085,428 | 1.32 % | swordsman-1 564 × 1 = 54,426 (top-HP stack) | 8,084,653 | 8,193,505 | 1.33 % |
| steady-max | 5 | 2,048,786 | 2,075,999 | 2,103,212 | 1.31 % | swordsman-1 564 × 1 = 54,426 (top-HP stack) | 8,222,546 | 8,331,398 | 1.31 % |
| all-in | 7 | 2,447,995 | 2,475,208 | 2,502,421 | 1.10 % | swordsman-1 564 × 1 = 54,426 (top-HP stack) | 8,519,930 | 8,628,782 | 1.26 % |

**2026-09-17 export, its setup (7 000 leadership)**

| stop | burned | repeat worst | repeat expected | repeat best | gap | the gap is | campaign worst | campaign expected | gap |
|---|---|---|---|---|---|---|---|---|---|
| sweet-spot | 11 | 5,230,687 | 5,330,563 | 5,430,439 | 1.87 % | spearman-1 1,272 × 1 = 187,620 | 21,363,106 | 21,662,734 | 1.38 % |
| more-mercs | 12 | 5,387,722 | 5,487,598 | 5,587,474 | 1.82 % | spearman-1 1,272 × 1 = 187,620 | 21,834,211 | 22,133,839 | 1.35 % |
| steady-max | 13 | 5,764,606 | 5,864,482 | 5,964,358 | 1.70 % | spearman-1 1,272 × 1 = 187,620 | 22,964,863 | 23,264,491 | 1.29 % |
| all-in | 27 | 5,484,951 | 6,079,639 | 6,674,327 | 9.78 % | rider-3 1,010 × 1 = 1,189,376 (top-HP stack) | 22,473,391 | 23,447,087 | 4.15 % |

**2026-09-17 export, 12 000 leadership**

| stop | burned | repeat worst | repeat expected | repeat best | gap | the gap is | campaign worst | campaign expected | gap |
|---|---|---|---|---|---|---|---|---|---|
| silver-saver | 9 | 5,677,544 | 5,812,728 | 5,947,912 | 2.33 % | spearman-1 1,833 × 1 = 270,368 (top-HP stack) | 25,328,649 | 25,905,397 | 2.23 % |
| sweet-spot | 10 | 6,591,311 | 6,760,346 | 6,929,381 | 2.50 % | spearman-1 2,292 × 1 = 338,070 (top-HP stack) | 28,069,950 | 28,748,251 | 2.36 % |
| more-mercs | 13 | 7,161,246 | 7,328,880 | 7,496,514 | 2.29 % | spearman-1 2,273 × 1 = 335,268 (top-HP stack) | 28,986,315 | 29,660,413 | 2.27 % |
| steady-max | 17 | 8,014,627 | 8,185,823 | 8,357,018 | 2.09 % | spearman-1 2,179 × 1 = 321,403 | 31,546,458 | 32,231,242 | 2.12 % |
| all-in | 24 | 8,957,800 | 9,235,912 | 9,514,023 | 3.01 % | spearman-1 3,771 × 1 = 556,223 (top-HP stack) | 31,629,770 | 33,028,417 | 4.23 % |

**live account of 2026-09-18 (one hired type, 20 000 leadership)**

| stop | burned | repeat worst | repeat expected | repeat best | gap | the gap is | campaign worst | campaign expected | gap |
|---|---|---|---|---|---|---|---|---|---|
| silver-saver | 4 | 3,612,405 | 3,747,516 | 3,882,626 | 3.61 % | spearman-1 1,749 × 1 = 270,221 (top-HP stack) | 17,891,095 | 18,681,950 | 4.23 % |
| sweet-spot | 6 | 7,164,726 | 7,464,920 | 7,765,113 | 4.02 % | spearman-1 3,886 × 1 = 600,387 (top-HP stack) | 28,495,047 | 29,677,128 | 3.98 % |
| steady-max | 7 | 7,455,950 | 7,756,144 | 8,056,337 | 3.87 % | spearman-1 3,886 × 1 = 600,387 (top-HP stack) | 29,046,352 | 30,215,378 | 3.87 % |
| all-in | 9 | 7,908,964 | 8,209,158 | 8,509,351 | 3.66 % | spearman-1 3,886 × 1 = 600,387 (top-HP stack) | 25,136,580 | 31,628,813 | 20.53 % |

**live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)**

| stop | burned | repeat worst | repeat expected | repeat best | gap | the gap is | campaign worst | campaign expected | gap |
|---|---|---|---|---|---|---|---|---|---|
| silver-saver | 10 | 4,938,216 | 5,053,087 | 5,167,958 | 2.27 % | spearman-1 1,487 × 1 = 229,742 (top-HP stack) | 21,665,681 | 22,179,294 | 2.32 % |
| sweet-spot | 13 | 6,950,963 | 7,115,969 | 7,280,975 | 2.32 % | spearman-1 2,136 × 1 = 330,012 (top-HP stack) | 27,703,922 | 28,367,940 | 2.34 % |
| more-mercs | 16 | 7,285,752 | 7,454,752 | 7,623,752 | 2.27 % | spearman-1 2,030 × 1 = 313,635 | 28,589,102 | 29,265,102 | 2.31 % |
| steady-max | 17 | 7,566,423 | 7,735,423 | 7,904,423 | 2.18 % | spearman-1 2,030 × 1 = 313,635 | 29,431,115 | 30,107,115 | 2.25 % |
| all-in | 25 | 8,703,595 | 8,703,595 | 8,703,595 | 0.00 % | spearman-2 1,926 × 1 = 570,289 | 32,179,459 | 32,348,459 | 0.52 % |

**the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)**

| stop | burned | repeat worst | repeat expected | repeat best | gap | the gap is | campaign worst | campaign expected | gap |
|---|---|---|---|---|---|---|---|---|---|
| silver-saver | 5 | 2,345,094 | 2,421,469 | 2,497,844 | 3.15 % | spearman-1 918 × 1 = 141,831 | 9,265,726 | 9,571,226 | 3.19 % |
| sweet-spot | 7 | 2,777,322 | 3,060,838 | 3,344,354 | 9.26 % | spearman-2 1,915 × 1 = 567,032 (top-HP stack) | 10,562,410 | 11,489,333 | 8.07 % |
| more-mercs | 8 | 2,909,752 | 3,193,268 | 3,476,784 | 8.88 % | spearman-2 1,915 × 1 = 567,032 (top-HP stack) | 10,959,700 | 11,886,623 | 7.80 % |
| steady-max | 10 | 3,174,612 | 3,458,128 | 3,741,644 | 8.20 % | spearman-2 1,915 × 1 = 567,032 (top-HP stack) | 11,754,280 | 12,681,203 | 7.31 % |
| all-in | 22 | 4,285,969 | 4,569,485 | 4,853,001 | 6.20 % | spearman-2 1,915 × 1 = 567,032 (top-HP stack) | 11,815,339 | 13,841,084 | 14.64 % |

**his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)**

| stop | burned | repeat worst | repeat expected | repeat best | gap | the gap is | campaign worst | campaign expected | gap |
|---|---|---|---|---|---|---|---|---|---|
| sweet-spot | 4 | 2,385,168 | 2,520,042 | 2,654,915 | 5.35 % | spearman-2 911 × 1 = 269,747 (top-HP stack) | 9,068,238 | 9,549,235 | 5.04 % |
| more-mercs | 6 | 2,316,818 | 2,600,334 | 2,883,850 | 10.90 % | spearman-2 1,915 × 1 = 567,032 (top-HP stack) | 8,863,188 | 9,790,111 | 9.47 % |
| steady-max | 8 | 2,559,505 | 2,843,021 | 3,126,537 | 9.97 % | spearman-2 1,915 × 1 = 567,032 (top-HP stack) | 9,591,249 | 10,518,172 | 8.81 % |
| all-in | 18 | 3,976,648 | 4,489,913 | 5,003,177 | 11.43 % | rider-2 1,593 × 1 = 1,026,529 (top-HP stack) | 15,906,592 | 17,959,652 | 11.43 % |

**his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)**

| stop | burned | repeat worst | repeat expected | repeat best | gap | the gap is | campaign worst | campaign expected | gap |
|---|---|---|---|---|---|---|---|---|---|
| sweet-spot | 5 | 2,509,413 | 2,509,413 | 2,509,413 | 0.00 % | spearman-2 893 × 1 = 264,417 | 10,315,775 | 10,805,841 | 4.54 % |
| more-mercs | 7 | 2,512,908 | 2,803,382 | 3,093,856 | 10.36 % | spearman-2 1,962 × 1 = 580,948 (top-HP stack) | 9,140,455 | 11,655,365 | 21.58 % |
| steady-max | 9 | 2,836,490 | 3,126,964 | 3,417,438 | 9.29 % | spearman-2 1,962 × 1 = 580,948 (top-HP stack) | 11,171,713 | 12,564,133 | 11.08 % |
| all-in | 12 | 3,131,559 | 3,658,034 | 4,184,509 | 14.39 % | rider-2 1,634 × 1 = 1,052,950 (top-HP stack) | 11,426,058 | 13,531,958 | 15.56 % |

## §B — the bar re-ranked on worst opening

The two bars side by side, stop by stop. `today` is the engine that ranks on the midpoint, `reliable` the engine that ranks on the enemy-first journal. Both columns print the **worst opening** of the march each bar chose, so the comparison is on the reading the owner asked for.


**first-run army, Bear V ×1 (20 000 leadership)**

Knee (the sweet spot’s rung, hired burned a march): 1 → **1**. Stops: 1 → **1**.

| stop | today burned | reliable burned | today worst | reliable worst | Δ worst | today expected | reliable expected | today a silver | reliable a silver | today a hired | reliable a hired | shape | put-back |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sweet-spot | 1 | 1 | 4,631,402 | 4,631,402 | +0.00 % | 4,722,842 | 4,722,842 | 0.5808 | 0.5696 | 4,722,842 | 4,631,402 | elite → elite | — → — |

**first-run army, Bear V ×2 (20 000 leadership)**

Knee (the sweet spot’s rung, hired burned a march): 1 → **1**. Stops: 1 → **1**.

| stop | today burned | reliable burned | today worst | reliable worst | Δ worst | today expected | reliable expected | today a silver | reliable a silver | today a hired | reliable a hired | shape | put-back |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sweet-spot | 1 | 1 | 4,743,602 | 4,743,602 | +0.00 % | 4,835,042 | 4,835,042 | 0.5946 | 0.5834 | 4,835,042 | 4,743,602 | elite → elite | — → — |

**first-run army, Bear V ×3 (20 000 leadership)**

Knee (the sweet spot’s rung, hired burned a march): 1 → **1**. Stops: 2 → **2**.

| stop | today burned | reliable burned | today worst | reliable worst | Δ worst | today expected | reliable expected | today a silver | reliable a silver | today a hired | reliable a hired | shape | put-back |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sweet-spot | 1 | 1 | 4,631,402 | 4,631,402 | +0.00 % | 4,722,842 | 4,722,842 | 0.5808 | 0.5696 | 4,722,842 | 4,631,402 | elite → elite | — → — |
| all-in | 1 | 1 | 4,044,264 | 4,855,802 | +20.07 % | 6,054,272 | 4,947,242 | 0.4324 | 0.5972 | 6,054,272 | 4,855,802 | elite → elite | — → — |

**first-run army, Bear V ×10 (20 000 leadership)**

Knee (the sweet spot’s rung, hired burned a march): 1 → **1**. Stops: 2 → **2**.

| stop | today burned | reliable burned | today worst | reliable worst | Δ worst | today expected | reliable expected | today a silver | reliable a silver | today a hired | reliable a hired | shape | put-back |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sweet-spot | 1 | 1 | 5,192,402 | 5,192,402 | +0.00 % | 5,283,842 | 5,283,842 | 0.6498 | 0.6386 | 5,283,842 | 5,192,402 | elite → elite | — → — |
| all-in | 1 | 1 | 4,306,064 | 5,384,084 | +25.03 % | 6,316,072 | 5,616,757 | 0.4511 | 0.5427 | 6,316,072 | 5,384,084 | elite → ms | — → spearman-2 (5.6 % damage, -0.1 % silver, 1.5 % queue) |

**first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)**

Knee (the sweet spot’s rung, hired burned a march): 6 → **6**. Stops: 3 → **3**.

| stop | today burned | reliable burned | today worst | reliable worst | Δ worst | today expected | reliable expected | today a silver | reliable a silver | today a hired | reliable a hired | shape | put-back |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sweet-spot | 6 | 6 | 7,109,888 | 7,109,888 | +0.00 % | 7,201,328 | 7,201,328 | 0.8856 | 0.8744 | 1,200,221 | 1,184,981 | elite → elite | — → — |
| steady-max | 7 | 7 | 7,498,490 | 7,498,490 | +0.00 % | 7,589,930 | 7,589,930 | 0.9334 | 0.9222 | 1,084,276 | 1,071,213 | elite → elite | — → — |
| all-in | 9 | 9 | 7,897,408 | 7,897,408 | +0.00 % | 8,047,249 | 8,047,249 | 0.9452 | 0.9276 | 894,139 | 877,490 | elite → elite | — → — |

**the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)**

Knee (the sweet spot’s rung, hired burned a march): 4 → **4**. Stops: 3 → **3**.

| stop | today burned | reliable burned | today worst | reliable worst | Δ worst | today expected | reliable expected | today a silver | reliable a silver | today a hired | reliable a hired | shape | put-back |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sweet-spot | 4 | 4 | 2,031,002 | 2,031,002 | +0.00 % | 2,058,215 | 2,058,215 | 1.3534 | 1.3355 | 514,554 | 507,751 | elite → elite | — → — |
| steady-max | 5 | 5 | 2,048,786 | 2,048,786 | +0.00 % | 2,075,999 | 2,075,999 | 1.3651 | 1.3472 | 415,200 | 409,757 | elite → elite | — → — |
| all-in | 7 | 7 | 2,447,995 | 2,447,995 | +0.00 % | 2,475,208 | 2,475,208 | 1.6276 | 1.6097 | 353,601 | 349,714 | ms → ms | swordsman-1 (9.1 % damage, 3.3 % silver, 11.9 % queue) → swordsman-1 (10.1 % damage, 3.3 % silver, 11.9 % queue) |

**2026-09-17 export, its setup (7 000 leadership)**

Knee (the sweet spot’s rung, hired burned a march): 11 → **10**. Stops: 4 → **5**.

| stop | today burned | reliable burned | today worst | reliable worst | Δ worst | today expected | reliable expected | today a silver | reliable a silver | today a hired | reliable a hired | shape | put-back |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sweet-spot | 11 | 10 | 5,230,687 | 4,870,455 | -6.89 % | 5,330,563 | 4,965,077 | 1.9459 | 1.8632 | 484,597 | 487,046 | elite → ladder | — → — |
| more-mercs | 12 | 12 | 5,387,722 | 5,387,722 | +0.00 % | 5,487,598 | 5,487,598 | 2.0032 | 1.9668 | 457,300 | 448,977 | elite → elite | — → — |
| steady-max | 13 | 14 | 5,764,606 | 5,913,067 | +2.58 % | 5,864,482 | 5,913,067 | 2.1408 | 2.1585 | 451,114 | 422,362 | elite → elite | — → — |
| all-in | 27 | 26 | 5,484,951 | 6,603,524 | +20.39 % | 6,079,639 | 6,603,524 | 1.7929 | 1.7367 | 225,172 | 253,982 | ladder → ms | — → spearman-2 (13.0 % damage, 4.1 % silver, 10.8 % queue) |
| silver-saver | — | 7 | — | 3,583,107 | — | — | 3,650,146 | — | 1.9352 | — | 511,872 | — → ladder | — → — |

**2026-09-17 export, 12 000 leadership**

Knee (the sweet spot’s rung, hired burned a march): 10 → **9**. Stops: 5 → **4**.

| stop | today burned | reliable burned | today worst | reliable worst | Δ worst | today expected | reliable expected | today a silver | reliable a silver | today a hired | reliable a hired | shape | put-back |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| silver-saver | 9 | 8 | 5,677,544 | 4,763,589 | -16.10 % | 5,812,728 | 4,864,996 | 1.5566 | 1.7015 | 645,859 | 595,449 | ladder → ladder | — → — |
| sweet-spot | 10 | 9 | 6,591,311 | 6,269,353 | -4.88 % | 6,760,346 | 6,438,388 | 1.4481 | 1.3430 | 676,035 | 696,595 | ladder → ladder | — → — |
| more-mercs | 13 | 13 | 7,161,246 | 7,161,246 | +0.00 % | 7,328,880 | 7,328,880 | 1.5831 | 1.5469 | 563,760 | 550,865 | ladder → ladder | — → — |
| steady-max | 17 | 17 | 8,014,627 | 8,014,627 | +0.00 % | 8,185,823 | 8,185,823 | 1.7426 | 1.7061 | 481,519 | 471,449 | elite → elite | — → — |
| all-in | 24 | — | 8,957,800 | — | — | 9,235,912 | — | 1.6786 | — | 384,830 | — | ms → — | spearman-1 (8.8 % damage, 13.7 % silver, 29.3 % queue) → — |

**live account of 2026-09-18 (one hired type, 20 000 leadership)**

Knee (the sweet spot’s rung, hired burned a march): 6 → **6**. Stops: 4 → **4**.

| stop | today burned | reliable burned | today worst | reliable worst | Δ worst | today expected | reliable expected | today a silver | reliable a silver | today a hired | reliable a hired | shape | put-back |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| silver-saver | 4 | 5 | 3,612,405 | 4,528,272 | +25.35 % | 3,747,516 | 4,528,272 | 1.0715 | 1.0258 | 936,879 | 905,654 | ladder → ladder | — → — |
| sweet-spot | 6 | 6 | 7,164,726 | 7,096,072 | -0.96 % | 7,464,920 | 7,096,072 | 0.9604 | 0.9177 | 1,244,153 | 1,182,679 | winner → winner | — → — |
| steady-max | 7 | 7 | 7,455,950 | 7,354,938 | -1.35 % | 7,756,144 | 7,354,938 | 0.9978 | 0.9512 | 1,108,021 | 1,050,705 | ladder → ladder | — → — |
| all-in | 9 | 9 | 7,908,964 | 7,840,310 | -0.87 % | 8,209,158 | 7,840,310 | 1.0561 | 1.0140 | 912,129 | 871,146 | winner → winner | — → — |

**live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)**

Knee (the sweet spot’s rung, hired burned a march): 13 → **11**. Stops: 5 → **4**.

| stop | today burned | reliable burned | today worst | reliable worst | Δ worst | today expected | reliable expected | today a silver | reliable a silver | today a hired | reliable a hired | shape | put-back |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| silver-saver | 10 | — | 4,938,216 | — | — | 5,053,087 | — | 1.6990 | — | 505,309 | — | ladder → — | — → — |
| sweet-spot | 13 | 11 | 6,950,963 | 6,189,687 | -10.95 % | 7,115,969 | 6,189,687 | 1.6665 | 1.4572 | 547,382 | 562,699 | ladder → ladder | — → — |
| more-mercs | 16 | 14 | 7,285,752 | 7,096,423 | -2.60 % | 7,454,752 | 7,096,423 | 1.7358 | 1.6661 | 465,922 | 506,887 | elite → ladder | — → — |
| steady-max | 17 | 19 | 7,566,423 | 7,987,079 | +5.56 % | 7,735,423 | 8,156,079 | 1.8011 | 1.8597 | 455,025 | 420,373 | elite → elite | — → — |
| all-in | 25 | 24 | 8,703,595 | 8,238,793 | -5.34 % | 8,703,595 | 8,474,406 | 1.7382 | 1.8478 | 348,144 | 343,283 | elite → ms | — → spearman-1 (7.4 % damage, 9.1 % silver, 24.8 % queue) |

**the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)**

Knee (the sweet spot’s rung, hired burned a march): 7 → **8**. Stops: 5 → **3**.

| stop | today burned | reliable burned | today worst | reliable worst | Δ worst | today expected | reliable expected | today a silver | reliable a silver | today a hired | reliable a hired | shape | put-back |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| silver-saver | 5 | — | 2,345,094 | — | — | 2,421,469 | — | 1.2464 | — | 484,294 | — | elite → — | — → — |
| sweet-spot | 7 | 8 | 2,777,322 | 2,880,077 | +3.70 % | 3,060,838 | 3,039,002 | 1.1305 | 1.2986 | 437,263 | 360,010 | ms → elite | spearman-2 (2.5 % damage, 4.6 % silver, 12.1 % queue) → — |
| more-mercs | 8 | 9 | 2,909,752 | 2,933,049 | +0.80 % | 3,193,268 | 3,091,974 | 1.1794 | 1.3224 | 399,159 | 325,894 | ms → elite | spearman-2 (2.4 % damage, 4.6 % silver, 12.1 % queue) → — |
| steady-max | 10 | 10 | 3,174,612 | 3,285,305 | +3.49 % | 3,458,128 | 3,285,305 | 1.2772 | 1.2466 | 345,813 | 328,531 | ms → ms | spearman-2 (2.2 % damage, 4.6 % silver, 12.1 % queue) → spearman-2 (9.6 % damage, 1.9 % silver, 5.5 % queue) |
| all-in | 22 | — | 4,285,969 | — | — | 4,569,485 | — | 1.6877 | — | 207,704 | — | ms → — | spearman-2 (47.9 % damage, 4.8 % silver, 12.5 % queue) → — |

**his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)**

Knee (the sweet spot’s rung, hired burned a march): 4 → **4**. Stops: 4 → **3**.

| stop | today burned | reliable burned | today worst | reliable worst | Δ worst | today expected | reliable expected | today a silver | reliable a silver | today a hired | reliable a hired | shape | put-back |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sweet-spot | 4 | 4 | 2,385,168 | 2,385,168 | +0.00 % | 2,520,042 | 2,520,042 | 1.1111 | 1.0517 | 630,011 | 596,292 | ladder → ladder | — → — |
| more-mercs | 6 | — | 2,316,818 | — | — | 2,600,334 | — | 0.9604 | — | 433,389 | — | ms → — | spearman-2 (0.2 % damage, 2.3 % silver, 9.9 % queue) → — |
| steady-max | 8 | 5 | 2,559,505 | 2,423,299 | -5.32 % | 2,843,021 | 2,423,299 | 1.0501 | 1.0700 | 355,378 | 484,660 | ms → elite | spearman-2 (0.2 % damage, 2.3 % silver, 9.9 % queue) → — |
| all-in | 18 | 18 | 3,976,648 | 3,976,648 | +0.00 % | 4,489,913 | 4,489,913 | 1.5784 | 1.3980 | 249,440 | 220,925 | elite → elite | — → — |

**his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)**

Knee (the sweet spot’s rung, hired burned a march): 5 → **5**. Stops: 4 → **4**.

| stop | today burned | reliable burned | today worst | reliable worst | Δ worst | today expected | reliable expected | today a silver | reliable a silver | today a hired | reliable a hired | shape | put-back |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| sweet-spot | 5 | 5 | 2,509,413 | 2,509,413 | +0.00 % | 2,509,413 | 2,509,413 | 1.0811 | 1.0811 | 501,883 | 501,883 | elite → elite | — → — |
| more-mercs | 7 | 8 | 2,512,908 | 2,549,800 | +1.47 % | 2,803,382 | 2,549,800 | 1.0100 | 0.9255 | 400,483 | 318,725 | ms → elite | spearman-2 (-1.1 % damage, 4.4 % silver, 11.9 % queue) → — |
| steady-max | 9 | 10 | 2,836,490 | 2,873,382 | +1.30 % | 3,126,964 | 2,873,382 | 1.1266 | 1.0429 | 347,440 | 287,338 | ms → elite | spearman-2 (-1.1 % damage, 4.6 % silver, 12.1 % queue) → — |
| all-in | 12 | 11 | 3,131,559 | 3,160,072 | +0.91 % | 3,658,034 | 3,450,546 | 1.2543 | 1.1385 | 304,836 | 287,279 | elite → ms | — → spearman-2 (0.9 % damage, 4.8 % silver, 12.4 % queue) |

## §C — the sizer sequences and the captured answers, re-priced on worst opening

The benchmark’s two pins, on the ten armies it measures. `damageFloor` is the plan’s hardest campaign over the best sizer sequence’s; `externals` the same over the best captured answer. **today** is the expected-damage engine priced on expected damage (what the pins hold now); **reliable** is the worst-opening engine priced on worst opening (what they become). The middle column isolates the two halves of the move: today’s bar, priced on worst opening.

| army | today (expected) | today’s bar on worst | reliable | externals today | externals on worst | externals reliable |
|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership) | 0.776 | 0.981 | 0.981 | — | — | — |
| first-run army, Bear V ×2 (20 000 leadership) | 0.783 | 0.989 | 0.989 | — | — | — |
| first-run army, Bear V ×3 (20 000 leadership) | 0.941 | 0.982 | 1.000 | 0.891 | 0.859 | 0.875 |
| first-run army, Bear V ×10 (20 000 leadership) | 0.996 | 0.982 | 0.988 | 0.945 | 0.924 | 0.930 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 0.996 | 0.993 | 0.993 | 0.991 | 0.987 | 0.987 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 0.999 | 1.000 | 1.000 | 0.968 | 0.972 | 0.972 |
| 2026-09-17 export, its setup (7 000 leadership) | 0.903 | 0.932 | 0.959 | 1.436 | 1.671 | 1.719 |
| 2026-09-17 export, 12 000 leadership | 0.963 | 0.950 | 0.948 | 1.367 | 1.382 | 1.378 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 1.004 | 1.148 | 1.176 | 1.038 | 0.994 | 1.018 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 0.401 | 0.874 | 0.861 | 0.404 | 0.874 | 0.861 |

The **worst / expected ratio** of each army, which is what bridges a figure of this file to a figure of benchmark 00–11 (the plan’s hardest campaign, both readings, on the engine of each run):

| army | today’s bar | reliable bar |
|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership) | 0.9803 | 0.9803 |
| first-run army, Bear V ×2 (20 000 leadership) | 0.9805 | 0.9805 |
| first-run army, Bear V ×3 (20 000 leadership) | 0.7299 | 0.9809 |
| first-run army, Bear V ×10 (20 000 leadership) | 0.6789 | 0.9669 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 0.9841 | 0.9841 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 0.9874 | 0.9874 |
| 2026-09-17 export, its setup (7 000 leadership) | 0.9585 | 1.0000 |
| 2026-09-17 export, 12 000 leadership | 0.9577 | 0.9788 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 0.7947 | 1.0000 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 0.9948 | 0.9874 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | 0.8536 | 0.9937 |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | 0.8857 | 0.8857 |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | 0.8444 | 0.9341 |

## §D — the coin flip, on the bar and over the whole frontier


**The expected engine.**

| army | widest gap on the bar | widest gap on the frontier | widest among unsheltered marches | unsheltered rows |
|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership) | sweet-spot 1.94 % | 3.54 % — 8 stacks · 1 hired · 1.2M silver a march (706,825 expected, 681,782 worst) | none | 0 of 2 |
| first-run army, Bear V ×2 (20 000 leadership) | sweet-spot 1.89 % | 3.55 % — 8 stacks · 2 hired · 2.5M silver a march (1,414,245 expected, 1,364,088 worst) | none | 0 of 7 |
| first-run army, Bear V ×3 (20 000 leadership) | all-in 33.20 % | 33.20 % — 2 stacks · 3 hired · 14M silver a march (6,054,272 expected, 4,044,264 worst) | none | 0 of 3 |
| first-run army, Bear V ×10 (20 000 leadership) | all-in 31.82 % | 31.82 % — 2 stacks · 10 hired · 14M silver a march (6,316,072 expected, 4,306,064 worst) | none | 0 of 19 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | all-in 1.86 % | 2.66 % — 8 stacks · 39 hired · 4.4M silver a march (3,400,875 expected, 3,310,507 worst) | none | 0 of 31 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | sweet-spot 1.32 % | 9.02 % — 4 stacks · 17 hired · 2M silver a march (1,009,835 expected, 918,798 worst) | none | 0 of 825 |
| 2026-09-17 export, its setup (7 000 leadership) | all-in 9.78 % | 56.17 % — 1 stack · 101 hired · 4.9M silver a march (3,642,335 expected, 1,596,255 worst) | none | 0 of 2,176 |
| 2026-09-17 export, 12 000 leadership | all-in 3.01 % | 15.54 % — 3 stacks · 45 hired · 6.2M silver a march (4,018,885 expected, 3,394,501 worst) | none | 0 of 1,411 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | sweet-spot 4.02 % | 6.58 % — 7 stacks · 10 hired · 7.8M silver a march (4,674,935 expected, 4,367,485 worst) | none | 0 of 38 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | sweet-spot 2.32 % | 39.61 % — 1 stack · 460 hired · 7M silver a march (8,159,756 expected, 4,927,346 worst) | none | 0 of 991 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | sweet-spot 9.26 % | 52.29 % — 1 stack · 41 hired · 3.3M silver a march (2,942,923 expected, 1,404,020 worst) | none | 0 of 441 |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | all-in 11.43 % | 36.08 % — 1 stack · 168 hired · 3.3M silver a march (4,252,444 expected, 2,718,089 worst) | none | 0 of 63 |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | all-in 14.39 % | 50.77 % — 1 stack · 99 hired · 3.6M silver a march (3,253,664 expected, 1,601,731 worst) | none | 0 of 55 |

**The reliable engine.**

| army | widest gap on the bar | widest gap on the frontier | widest among unsheltered marches | unsheltered rows |
|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership) | sweet-spot 1.94 % | 3.54 % — 8 stacks · 1 hired · 1.2M silver a march (706,825 expected, 681,782 worst) | none | 0 of 2 |
| first-run army, Bear V ×2 (20 000 leadership) | sweet-spot 1.89 % | 3.55 % — 8 stacks · 2 hired · 2.5M silver a march (1,414,245 expected, 1,364,088 worst) | none | 0 of 7 |
| first-run army, Bear V ×3 (20 000 leadership) | sweet-spot 1.94 % | 3.54 % — 8 stacks · 1 hired · 1.2M silver a march (706,825 expected, 681,782 worst) | none | 0 of 3 |
| first-run army, Bear V ×10 (20 000 leadership) | all-in 4.14 % | 4.27 % — 7 stacks · 8 hired · 8.5M silver a march (4,790,727 expected, 4,586,374 worst) | none | 0 of 19 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | all-in 1.86 % | 2.66 % — 8 stacks · 39 hired · 4.4M silver a march (3,400,875 expected, 3,310,507 worst) | none | 0 of 31 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | sweet-spot 1.32 % | 3.38 % — 7 stacks · 17 hired · 1.5M silver a march (1,005,457 expected, 971,484 worst) | none | 0 of 824 |
| 2026-09-17 export, its setup (7 000 leadership) | sweet-spot 1.91 % | 9.14 % — 3 stacks · 103 hired · 3.1M silver a march (3,373,386 expected, 3,064,938 worst) | none | 0 of 2,187 |
| 2026-09-17 export, 12 000 leadership | sweet-spot 2.63 % | 9.06 % — 4 stacks · 50 hired · 5.8M silver a march (4,506,877 expected, 4,098,353 worst) | none | 0 of 1,852 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | silver-saver 0.00 % | 6.58 % — 7 stacks · 10 hired · 7.8M silver a march (4,674,935 expected, 4,367,485 worst) | none | 0 of 47 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | all-in 2.78 % | 30.43 % — 1 stack · 460 hired · 4.6M silver a march (7,082,069 expected, 4,927,346 worst) | none | 0 of 1,406 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | sweet-spot 5.23 % | 37.84 % — 1 stack · 41 hired · 1.8M silver a march (2,258,894 expected, 1,404,020 worst) | none | 0 of 551 |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | all-in 11.43 % | 21.06 % — 1 stack · 374 hired · 3.5M silver a march (7,665,239 expected, 6,050,983 worst) | none | 0 of 103 |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | all-in 8.42 % | 18.64 % — 2 stacks · 70 hired · 2.9M silver a march (2,835,422 expected, 2,307,014 worst) | none | 0 of 79 |
