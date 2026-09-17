# The plan against Tier ladder and Troops first — the latest run of `tests/engine/plan-benchmark.test.ts`

Every sequence is four marches: the sizers re-sized each march on the stock the last one left (Generate four times), the plan as its own repeats and finale. Each march priced by `simulateBattle` on its counts.

## 2026-09-17 export, its setup (7 000 leadership)

| sequence | four-march damage | silver | hired burned | a silver | a hired |
|---|---|---|---|---|---|
| Tier ladder · all types | 22,493,346 | 10,957,600 | 93 | 2.05 | 241,864 |
| Tier ladder · Generate (average damage) | 25,952,553 | 14,192,200 | 93 | 1.83 | 279,060 |
| Troops first · all types | 23,441,856 | 10,957,600 | 55 | 2.14 | 426,216 |
| Troops first · Generate (average damage) | 25,833,694 | 14,192,200 | 86 | 1.82 | 300,392 |
| Complete optimization · sweet-spot | 21,662,734 | 10,957,600 | 47 | 1.98 | 460,909 |
| Complete optimization · more-mercs | 22,133,839 | 10,957,600 | 50 | 2.02 | 442,677 |
| Complete optimization · steady-max | 23,264,491 | 10,957,600 | 53 | 2.12 | 438,953 |
| Complete optimization · all-in | 22,518,504 | 14,337,600 | 93 | 1.57 | 242,134 |

## 2026-09-17 export, 12 000 leadership

| sequence | four-march damage | silver | hired burned | a silver | a hired |
|---|---|---|---|---|---|
| Tier ladder · all types | 32,417,040 | 18,790,400 | 93 | 1.73 | 348,570 |
| Tier ladder · Generate (average damage) | 33,361,705 | 20,399,600 | 93 | 1.64 | 358,728 |
| Troops first · all types | 33,438,122 | 18,790,400 | 70 | 1.78 | 477,687 |
| Troops first · Generate (average damage) | 34,283,252 | 21,204,200 | 85 | 1.62 | 403,332 |
| Complete optimization · silver-saver | 25,145,044 | 14,231,900 | 51 | 1.77 | 493,040 |
| Complete optimization · sweet-spot | 32,231,242 | 18,790,400 | 67 | 1.72 | 481,063 |
| Complete optimization · steady-max | 32,518,195 | 21,057,500 | 73 | 1.54 | 445,455 |
| Complete optimization · all-in | 31,652,798 | 22,422,900 | 93 | 1.41 | 340,353 |

## live account of 2026-09-18 (one hired type, 20 000 leadership)

| sequence | four-march damage | silver | hired burned | a silver | a hired |
|---|---|---|---|---|---|
| Tier ladder · all types | 26,530,424 | 31,236,000 | 30 | 0.85 | 884,347 |
| Tier ladder · Generate (average damage) | 31,495,858 | 45,750,400 | 30 | 0.69 | 1,049,862 |
| Troops first · all types | 26,530,424 | 31,236,000 | 30 | 0.85 | 884,347 |
| Troops first · Generate (average damage) | 31,495,858 | 45,750,400 | 30 | 0.69 | 1,049,862 |
| Complete optimization · silver-saver | 21,453,290 | 20,537,200 | 22 | 1.04 | 975,150 |
| Complete optimization · sweet-spot | 29,677,128 | 30,607,200 | 25 | 0.97 | 1,187,085 |
| Complete optimization · steady-max | 30,215,378 | 30,270,800 | 28 | 1.00 | 1,079,121 |
| Complete optimization · all-in | 31,218,724 | 31,092,400 | 30 | 1.00 | 1,040,624 |

