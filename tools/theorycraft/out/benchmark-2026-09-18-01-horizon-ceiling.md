# The plan against Tier ladder, Troops first and the other calculators — the latest run of `tests/engine/plan-benchmark.test.ts`

Every sequence is four marches: the sizers re-sized each march on the stock the last one left (Generate four times), the plan as its own repeats and finale, a captured answer repeated while its stock lasts. Each march priced by `simulateBattle` on its counts.

Run: 2026-09-17T20:26:24.917Z, commit wip

## first-run army, Bear V ×1 (20 000 leadership)

The plan offers 1 stops.

| sequence | marches | four-march damage | silver | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 18,554,768 | 32,525,600 | 1 | 0.57 | 18,554,768 |
| Tier ladder · Generate (average damage) | 4 | 23,899,764 | 56,000,000 | 1 | 0.43 | 23,899,764 |
| Troops first · all types | 4 | 18,554,768 | 32,525,600 | 1 | 0.57 | 18,554,768 |
| Troops first · Generate (average damage) | 4 | 23,899,764 | 56,000,000 | 1 | 0.43 | 23,899,764 |
| Complete optimization · sweet-spot | 1 | 4,722,842 | 8,131,400 | 1 | 0.58 | 4,722,842 |

## first-run army, Bear V ×2 (20 000 leadership)

The plan offers 1 stops.

| sequence | marches | four-march damage | silver | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 18,779,168 | 32,525,600 | 2 | 0.58 | 9,389,584 |
| Tier ladder · Generate (average damage) | 4 | 23,974,564 | 56,000,000 | 2 | 0.43 | 11,987,282 |
| Troops first · all types | 4 | 18,779,168 | 32,525,600 | 2 | 0.58 | 9,389,584 |
| Troops first · Generate (average damage) | 4 | 23,974,564 | 56,000,000 | 2 | 0.43 | 11,987,282 |
| Complete optimization · sweet-spot | 2 | 9,557,884 | 16,262,800 | 2 | 0.59 | 4,778,942 |

## first-run army, Bear V ×3 (20 000 leadership)

The plan offers 1 stops.

| sequence | marches | four-march damage | silver | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 19,115,768 | 32,525,600 | 3 | 0.59 | 6,371,923 |
| Tier ladder · Generate (average damage) | 4 | 24,086,764 | 56,000,000 | 3 | 0.43 | 8,028,921 |
| Troops first · all types | 4 | 19,115,768 | 32,525,600 | 3 | 0.59 | 6,371,923 |
| Troops first · Generate (average damage) | 4 | 24,086,764 | 56,000,000 | 3 | 0.43 | 8,028,921 |
| Complete optimization · sweet-spot | 3 | 14,168,526 | 24,394,200 | 3 | 0.58 | 4,722,842 |

## first-run army, Bear V ×10 (20 000 leadership)

The plan offers 1 stops.

| sequence | marches | four-march damage | silver | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 21,788,376 | 32,525,600 | 4 | 0.67 | 5,447,094 |
| Tier ladder · Generate (average damage) | 4 | 25,133,964 | 56,000,000 | 4 | 0.45 | 6,283,491 |
| Troops first · all types | 4 | 21,135,368 | 32,525,600 | 4 | 0.65 | 5,283,842 |
| Troops first · Generate (average damage) | 4 | 25,133,964 | 56,000,000 | 4 | 0.45 | 6,283,491 |
| Complete optimization · sweet-spot | 4 | 21,135,368 | 32,525,600 | 4 | 0.65 | 5,283,842 |

## first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)

The plan offers 3 stops.

| sequence | marches | four-march damage | silver | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 27,526,898 | 32,525,600 | 30 | 0.85 | 917,563 |
| Tier ladder · Generate (average damage) | 4 | 30,340,395 | 33,291,200 | 30 | 0.91 | 1,011,347 |
| Troops first · all types | 4 | 30,230,189 | 32,525,600 | 29 | 0.93 | 1,042,420 |
| Troops first · Generate (average damage) | 4 | 30,436,414 | 32,908,400 | 30 | 0.92 | 1,014,547 |
| Complete optimization · sweet-spot | 4 | 29,021,204 | 32,525,600 | 25 | 0.89 | 1,160,848 |
| Complete optimization · steady-max | 4 | 30,057,473 | 32,525,600 | 28 | 0.92 | 1,073,481 |
| Complete optimization · all-in | 4 | 28,219,651 | 36,343,000 | 30 | 0.78 | 940,655 |

## the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

The plan offers 3 stops.

| sequence | marches | four-march damage | silver | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 8,616,048 | 6,083,200 | 24 | 1.42 | 359,002 |
| Tier ladder · Generate (average damage) | 4 | 8,620,931 | 6,157,800 | 24 | 1.40 | 359,205 |
| Troops first · all types | 4 | 8,628,782 | 6,083,200 | 24 | 1.42 | 359,533 |
| Troops first · Generate (average damage) | 4 | 8,633,665 | 6,157,800 | 24 | 1.40 | 359,736 |
| TotalStack · optimize (as captured, repeated) | 4 | 8,911,356 | 6,084,400 | 24 | 1.46 | 371,307 |
| Kai’s calculator · extract (as captured, repeated) | 4 | 8,792,837 | 6,203,200 | 27 | 1.42 | 325,661 |
| Complete optimization · sweet-spot | 4 | 8,193,505 | 6,083,200 | 19 | 1.35 | 431,237 |
| Complete optimization · steady-max | 4 | 8,331,398 | 6,083,200 | 21 | 1.37 | 396,733 |
| Complete optimization · all-in | 4 | 8,154,596 | 6,250,700 | 24 | 1.30 | 339,775 |

## 2026-09-17 export, its setup (7 000 leadership)

The plan offers 4 stops.

| sequence | marches | four-march damage | silver | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 22,493,346 | 10,957,600 | 93 | 2.05 | 241,864 |
| Tier ladder · Generate (average damage) | 4 | 25,952,553 | 14,192,200 | 93 | 1.83 | 279,060 |
| Troops first · all types | 4 | 23,441,856 | 10,957,600 | 55 | 2.14 | 426,216 |
| Troops first · Generate (average damage) | 4 | 25,833,694 | 14,192,200 | 86 | 1.82 | 300,392 |
| Complete optimization · sweet-spot | 4 | 21,662,734 | 10,957,600 | 47 | 1.98 | 460,909 |
| Complete optimization · more-mercs | 4 | 22,133,839 | 10,957,600 | 50 | 2.02 | 442,677 |
| Complete optimization · steady-max | 4 | 23,264,491 | 10,957,600 | 53 | 2.12 | 438,953 |
| Complete optimization · all-in | 4 | 22,518,504 | 14,337,600 | 93 | 1.57 | 242,134 |

## 2026-09-17 export, 12 000 leadership

The plan offers 4 stops.

| sequence | marches | four-march damage | silver | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 32,417,040 | 18,790,400 | 93 | 1.73 | 348,570 |
| Tier ladder · Generate (average damage) | 4 | 33,361,705 | 20,399,600 | 93 | 1.64 | 358,728 |
| Troops first · all types | 4 | 33,438,122 | 18,790,400 | 70 | 1.78 | 477,687 |
| Troops first · Generate (average damage) | 4 | 34,283,252 | 21,204,200 | 85 | 1.62 | 403,332 |
| Complete optimization · silver-saver | 4 | 25,145,044 | 14,231,900 | 51 | 1.77 | 493,040 |
| Complete optimization · sweet-spot | 4 | 32,231,242 | 18,790,400 | 67 | 1.72 | 481,063 |
| Complete optimization · steady-max | 4 | 32,518,195 | 21,057,500 | 73 | 1.54 | 445,455 |
| Complete optimization · all-in | 4 | 31,652,798 | 22,422,900 | 93 | 1.41 | 340,353 |

## live account of 2026-09-18 (one hired type, 20 000 leadership)

The plan offers 4 stops.

| sequence | marches | four-march damage | silver | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 26,530,424 | 31,236,000 | 30 | 0.85 | 884,347 |
| Tier ladder · Generate (average damage) | 4 | 31,495,858 | 45,750,400 | 30 | 0.69 | 1,049,862 |
| Troops first · all types | 4 | 26,530,424 | 31,236,000 | 30 | 0.85 | 884,347 |
| Troops first · Generate (average damage) | 4 | 31,495,858 | 45,750,400 | 30 | 0.69 | 1,049,862 |
| Complete optimization · silver-saver | 4 | 21,453,290 | 20,537,200 | 22 | 1.04 | 975,150 |
| Complete optimization · sweet-spot | 4 | 29,677,128 | 30,607,200 | 25 | 0.97 | 1,187,085 |
| Complete optimization · steady-max | 4 | 30,215,378 | 30,270,800 | 28 | 1.00 | 1,079,121 |
| Complete optimization · all-in | 4 | 31,218,724 | 31,092,400 | 30 | 1.00 | 1,040,624 |

## live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

The plan offers 5 stops.

| sequence | marches | four-march damage | silver | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 72,384,395 | 17,179,200 | 874 | 4.21 | 82,820 |
| Tier ladder · Generate (average damage) | 4 | 80,658,235 | 30,800,000 | 874 | 2.62 | 92,286 |
| Troops first · all types | 4 | 29,111,661 | 17,179,200 | 78 | 1.69 | 373,226 |
| Troops first · Generate (average damage) | 4 | 52,075,835 | 0 | 874 | — | 59,583 |
| Complete optimization · silver-saver | 4 | 22,179,294 | 13,217,400 | 49 | 1.68 | 452,639 |
| Complete optimization · sweet-spot | 4 | 26,023,854 | 17,179,200 | 58 | 1.51 | 448,687 |
| Complete optimization · more-mercs | 4 | 27,096,537 | 17,179,200 | 61 | 1.58 | 444,206 |
| Complete optimization · steady-max | 4 | 30,107,115 | 17,179,200 | 70 | 1.75 | 430,102 |
| Complete optimization · all-in | 4 | 29,111,661 | 17,179,200 | 78 | 1.69 | 373,226 |

