# The plan against Tier ladder, Troops first and the other calculators — the latest run of `tests/engine/plan-benchmark.test.ts`

Every sequence is four marches: the sizers re-sized each march on the stock the last one left (Generate four times), the plan as its own repeats and finale, a captured answer repeated while its stock lasts. Each march priced by `simulateBattle` on its counts — damage, retraining silver and the gold its hired stacks cost to revive (the gold column since S-90, 2026-09-18).

Run: 2026-09-19T04:07:22.044Z, commit (working tree)

No baseline is registered (`tests/engine/plan-baseline.json` is absent or still reads `registeredBy: null`), so **no row below is held to a previous run**. `pnpm bench:baseline` writes a proposal for the owner to register.

## first-run army, Bear V ×1 (20 000 leadership)

The plan offers 1 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 18,189,008 | 32,525,600 | 0 | 1 | 0.56 | 18,189,008 |
| Tier ladder · Generate (average damage) | 4 | 18,535,192 | 56,000,000 | 0 | 1 | 0.33 | 18,535,192 |
| Troops first · all types | 4 | 18,189,008 | 32,525,600 | 0 | 1 | 0.56 | 18,189,008 |
| Troops first · Generate (average damage) | 4 | 18,535,192 | 56,000,000 | 0 | 1 | 0.33 | 18,535,192 |
| Complete optimization · sweet-spot | 4 | 18,189,008 | 32,525,600 | 0 | 1 | 0.56 | 18,189,008 |

## first-run army, Bear V ×2 (20 000 leadership)

The plan offers 1 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 9,206,704 |
| Tier ladder · Generate (average damage) | 4 | 18,609,992 | 56,000,000 | 160 | 2 | 0.33 | 9,304,996 |
| Troops first · all types | 4 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 9,206,704 |
| Troops first · Generate (average damage) | 4 | 18,609,992 | 56,000,000 | 160 | 2 | 0.33 | 9,304,996 |
| Complete optimization · sweet-spot | 4 | 18,413,408 | 32,525,600 | 160 | 2 | 0.57 | 9,206,704 |

## first-run army, Bear V ×3 (20 000 leadership)

The plan offers 2 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 6,250,003 |
| Tier ladder · Generate (average damage) | 4 | 18,722,192 | 56,000,000 | 480 | 3 | 0.33 | 6,240,731 |
| Troops first · all types | 4 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 6,250,003 |
| Troops first · Generate (average damage) | 4 | 18,722,192 | 56,000,000 | 480 | 3 | 0.33 | 6,240,731 |
| TotalStack · M’s Preservation | 4 | 19,022,916 | 32,535,200 | 480 | 3 | 0.58 | 6,340,972 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 21,427,548 | 56,000,000 | 480 | 3 | 0.38 | 7,142,516 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 19,022,916 | 32,535,200 | 480 | 3 | 0.58 | 6,340,972 |
| TotalStack · Total Optimization | 4 | 18,778,808 | 32,529,600 | 480 | 3 | 0.58 | 6,259,603 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 18,741,088 | 56,000,000 | 480 | 3 | 0.33 | 6,247,029 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 18,778,808 | 32,529,600 | 480 | 3 | 0.58 | 6,259,603 |
| TotalStack · Elite Preservation | 4 | 18,778,808 | 32,529,600 | 480 | 3 | 0.58 | 6,259,603 |
| Complete optimization · sweet-spot | 4 | 18,413,408 | 32,525,600 | 0 | 3 | 0.57 | 6,137,803 |
| Complete optimization · all-in | 4 | 18,750,008 | 32,525,600 | 480 | 3 | 0.58 | 6,250,003 |

## first-run army, Bear V ×10 (20 000 leadership)

The plan offers 2 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 21,152,576 | 32,525,600 | 4,800 | 4 | 0.65 | 5,288,144 |
| Tier ladder · Generate (average damage) | 4 | 19,769,392 | 56,000,000 | 4,800 | 4 | 0.35 | 4,942,348 |
| Troops first · all types | 4 | 20,769,608 | 32,525,600 | 3,200 | 4 | 0.64 | 5,192,402 |
| Troops first · Generate (average damage) | 4 | 19,769,392 | 56,000,000 | 4,800 | 4 | 0.35 | 4,942,348 |
| TotalStack · M’s Preservation | 4 | 21,539,692 | 32,529,600 | 4,640 | 4 | 0.66 | 5,384,923 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 22,474,748 | 56,000,000 | 4,800 | 4 | 0.40 | 5,618,687 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 21,539,692 | 32,529,600 | 4,640 | 4 | 0.66 | 5,384,923 |
| TotalStack · Total Optimization | 4 | 20,798,408 | 32,529,600 | 3,200 | 4 | 0.64 | 5,199,602 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 19,788,288 | 56,000,000 | 4,800 | 4 | 0.35 | 4,947,072 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 20,798,408 | 32,529,600 | 3,200 | 4 | 0.64 | 5,199,602 |
| TotalStack · Elite Preservation | 4 | 21,162,288 | 32,529,600 | 4,800 | 4 | 0.65 | 5,290,572 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 21,162,288 | 32,529,600 | 4,800 | 4 | 0.65 | 5,290,572 |
| Complete optimization · sweet-spot | 4 | 20,769,608 | 32,525,600 | 3,200 | 4 | 0.64 | 5,192,402 |
| Complete optimization · all-in | 4 | 20,893,375 | 36,013,400 | 4,800 | 4 | 0.58 | 5,223,344 |

## first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)

The plan offers 3 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 26,655,281 | 32,525,600 | 2,016 | 30 | 0.82 | 888,509 |
| Tier ladder · Generate (average damage) | 4 | 29,942,175 | 33,291,200 | 2,016 | 30 | 0.90 | 998,073 |
| Troops first · all types | 4 | 29,864,429 | 32,525,600 | 1,952 | 29 | 0.92 | 1,029,808 |
| Troops first · Generate (average damage) | 4 | 30,054,424 | 32,908,400 | 2,008 | 30 | 0.91 | 1,001,814 |
| TotalStack · M’s Preservation | 4 | 30,221,279 | 32,533,600 | 1,968 | 29 | 0.93 | 1,042,113 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 29,758,471 | 34,075,200 | 2,016 | 30 | 0.87 | 991,949 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 30,221,279 | 32,533,600 | 1,968 | 29 | 0.93 | 1,042,113 |
| TotalStack · Total Optimization | 4 | 29,893,229 | 32,529,600 | 1,952 | 29 | 0.92 | 1,030,801 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 29,168,019 | 34,064,000 | 2,016 | 30 | 0.86 | 972,267 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 29,893,229 | 32,529,600 | 1,952 | 29 | 0.92 | 1,030,801 |
| TotalStack · Elite Preservation | 4 | 26,679,309 | 32,529,600 | 2,016 | 30 | 0.82 | 889,310 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 29,168,019 | 34,064,000 | 2,016 | 30 | 0.86 | 972,267 |
| Complete optimization · sweet-spot | 4 | 28,655,444 | 32,525,600 | 1,760 | 25 | 0.88 | 1,146,218 |
| Complete optimization · steady-max | 4 | 29,691,713 | 32,525,600 | 1,928 | 28 | 0.91 | 1,060,418 |
| Complete optimization · all-in | 4 | 29,841,879 | 33,291,200 | 2,016 | 30 | 0.90 | 994,729 |

## first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)

The plan offers 3 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 79,635,913 | 35,450,400 | 49,056 | 114 | 2.25 | 698,561 |
| Tier ladder · Generate (average damage) | 4 | 103,438,192 | 37,939,200 | 51,184 | 76 | 2.73 | 1,361,029 |
| Troops first · all types | 4 | 82,845,061 | 35,450,400 | 48,992 | 113 | 2.34 | 733,142 |
| Troops first · Generate (average damage) | 4 | 104,626,942 | 37,290,800 | 49,888 | 77 | 2.81 | 1,358,791 |
| Complete optimization · sweet-spot | 4 | 91,948,255 | 35,274,000 | 44,840 | 97 | 2.61 | 947,920 |
| Complete optimization · more-mercs | 4 | 94,687,477 | 35,349,600 | 48,440 | 106 | 2.68 | 893,278 |
| Complete optimization · steady-max | 4 | 95,348,743 | 35,458,800 | 48,728 | 112 | 2.69 | 851,328 |

## the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

The plan offers 3 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 8,463,273 | 6,083,200 | 1,352 | 24 | 1.39 | 352,636 |
| Tier ladder · Generate (average damage) | 4 | 8,461,931 | 6,157,800 | 1,352 | 24 | 1.37 | 352,580 |
| Troops first · all types | 4 | 8,519,930 | 6,083,200 | 1,336 | 24 | 1.40 | 354,997 |
| Troops first · Generate (average damage) | 4 | 8,518,588 | 6,157,800 | 1,336 | 24 | 1.38 | 354,941 |
| TotalStack · optimize (as captured, repeated) | 4 | 8,762,880 | 6,084,400 | 1,344 | 24 | 1.44 | 365,120 |
| Kai’s calculator · extract (as captured, repeated) | 4 | 8,616,241 | 6,203,200 | 1,544 | 27 | 1.39 | 319,120 |
| TotalStack · M’s Preservation | 4 | 8,762,880 | 6,084,400 | 1,344 | 24 | 1.44 | 365,120 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 8,750,417 | 6,086,400 | 1,352 | 24 | 1.44 | 364,601 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 8,762,880 | 6,084,400 | 1,344 | 24 | 1.44 | 365,120 |
| TotalStack · Total Optimization | 4 | 8,380,649 | 6,083,200 | 1,336 | 24 | 1.38 | 349,194 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 8,380,649 | 6,083,200 | 1,336 | 24 | 1.38 | 349,194 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 8,380,649 | 6,083,200 | 1,336 | 24 | 1.38 | 349,194 |
| TotalStack · Elite Preservation | 4 | 8,262,390 | 6,083,200 | 1,352 | 24 | 1.36 | 344,266 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 8,262,390 | 6,083,200 | 1,352 | 24 | 1.36 | 344,266 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 8,262,390 | 6,083,200 | 1,352 | 24 | 1.36 | 344,266 |
| Complete optimization · sweet-spot | 4 | 8,084,653 | 6,083,200 | 1,192 | 19 | 1.33 | 425,508 |
| Complete optimization · steady-max | 4 | 8,222,546 | 6,083,200 | 1,176 | 21 | 1.35 | 391,550 |
| Complete optimization · all-in | 4 | 8,519,930 | 6,083,200 | 1,336 | 24 | 1.40 | 354,997 |

## 2026-09-17 export, its setup (7 000 leadership)

The plan offers 5 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 18,589,604 | 10,957,600 | 6,656 | 93 | 1.70 | 199,888 |
| Tier ladder · Generate (average damage) | 4 | 24,032,714 | 14,192,200 | 6,656 | 93 | 1.69 | 258,416 |
| Troops first · all types | 4 | 23,341,980 | 10,957,600 | 4,064 | 55 | 2.13 | 424,400 |
| Troops first · Generate (average damage) | 4 | 24,634,972 | 14,192,200 | 6,200 | 86 | 1.74 | 286,453 |
| TotalStack · M’s Preservation | 4 | 11,013,524 | 10,972,800 | 960 | 16 | 1.00 | 688,345 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 13,742,586 | 16,016,000 | 3,472 | 51 | 0.86 | 269,462 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 7,807,482 | 8,400,000 | 3,472 | 51 | 0.93 | 153,088 |
| TotalStack · Total Optimization | 4 | 11,007,500 | 10,965,600 | 960 | 16 | 1.00 | 687,969 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 7,807,482 | 19,600,000 | 3,472 | 51 | 0.40 | 153,088 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 13,253,664 | 12,696,000 | 1,632 | 24 | 1.04 | 552,236 |
| TotalStack · Elite Preservation | 4 | 8,487,048 | 10,965,600 | 3,472 | 51 | 0.77 | 166,413 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 8,487,048 | 10,965,600 | 3,472 | 51 | 0.77 | 166,413 |
| Complete optimization · silver-saver | 4 | 16,217,218 | 8,293,900 | 2,568 | 35 | 1.96 | 463,349 |
| Complete optimization · sweet-spot | 4 | 20,079,262 | 10,581,400 | 3,072 | 44 | 1.90 | 456,347 |
| Complete optimization · more-mercs | 4 | 21,834,211 | 10,957,600 | 3,632 | 50 | 1.99 | 436,684 |
| Complete optimization · steady-max | 4 | 22,770,620 | 10,957,600 | 4,000 | 55 | 2.08 | 414,011 |
| Complete optimization · all-in | 4 | 23,619,920 | 15,179,600 | 6,608 | 92 | 1.56 | 256,738 |

## 2026-09-17 export, 12 000 leadership

The plan offers 4 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 28,513,298 | 18,790,400 | 6,656 | 93 | 1.52 | 306,595 |
| Tier ladder · Generate (average damage) | 4 | 30,640,313 | 20,399,600 | 6,656 | 93 | 1.50 | 329,466 |
| Troops first · all types | 4 | 32,753,338 | 18,790,400 | 5,072 | 70 | 1.74 | 467,905 |
| Troops first · Generate (average damage) | 4 | 33,277,720 | 21,204,200 | 6,104 | 85 | 1.57 | 391,503 |
| TotalStack · M’s Preservation | 4 | 18,971,864 | 18,808,800 | 1,696 | 24 | 1.01 | 790,494 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 22,894,812 | 21,785,600 | 2,848 | 40 | 1.05 | 572,370 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 22,894,812 | 21,785,600 | 2,848 | 40 | 1.05 | 572,370 |
| TotalStack · Total Optimization | 4 | 18,833,644 | 18,800,000 | 1,664 | 24 | 1.00 | 784,735 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 22,753,836 | 21,763,200 | 2,816 | 40 | 1.05 | 568,846 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 22,753,836 | 21,763,200 | 2,816 | 40 | 1.05 | 568,846 |
| TotalStack · Elite Preservation | 4 | 14,551,348 | 18,800,000 | 3,472 | 51 | 0.77 | 285,321 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 7,807,482 | 33,600,000 | 3,472 | 51 | 0.23 | 153,088 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 14,551,348 | 18,800,000 | 3,472 | 51 | 0.77 | 285,321 |
| Complete optimization · silver-saver | 4 | 22,586,784 | 13,096,400 | 3,224 | 42 | 1.72 | 537,781 |
| Complete optimization · sweet-spot | 4 | 27,104,076 | 18,702,500 | 3,440 | 45 | 1.45 | 602,313 |
| Complete optimization · more-mercs | 4 | 28,986,315 | 18,585,800 | 3,912 | 55 | 1.56 | 527,024 |
| Complete optimization · steady-max | 4 | 31,546,458 | 18,790,400 | 4,824 | 67 | 1.68 | 470,843 |

## live account of 2026-09-18 (one hired type, 20 000 leadership)

The plan offers 4 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 25,300,624 | 31,236,000 | 2,016 | 30 | 0.81 | 843,354 |
| Tier ladder · Generate (average damage) | 4 | 23,239,806 | 45,750,400 | 2,016 | 30 | 0.51 | 774,660 |
| Troops first · all types | 4 | 25,300,624 | 31,236,000 | 2,016 | 30 | 0.81 | 843,354 |
| Troops first · Generate (average damage) | 4 | 23,239,806 | 45,750,400 | 2,016 | 30 | 0.51 | 774,660 |
| TotalStack · M’s Preservation | 4 | 25,980,608 | 31,346,400 | 2,016 | 30 | 0.83 | 866,020 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 25,980,608 | 31,346,400 | 2,016 | 30 | 0.83 | 866,020 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 25,980,608 | 31,346,400 | 2,016 | 30 | 0.83 | 866,020 |
| TotalStack · Total Optimization | 4 | 29,222,440 | 31,335,200 | 2,016 | 30 | 0.93 | 974,081 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 29,222,440 | 31,335,200 | 2,016 | 30 | 0.93 | 974,081 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 29,222,440 | 31,335,200 | 2,016 | 30 | 0.93 | 974,081 |
| TotalStack · Elite Preservation | 4 | 29,222,440 | 31,335,200 | 2,016 | 30 | 0.93 | 974,081 |
| Complete optimization · silver-saver | 4 | 20,891,829 | 20,901,800 | 1,544 | 22 | 1.00 | 949,629 |
| Complete optimization · sweet-spot | 4 | 28,270,883 | 30,516,200 | 1,760 | 25 | 0.93 | 1,130,835 |
| Complete optimization · steady-max | 4 | 28,727,202 | 30,179,700 | 1,904 | 28 | 0.95 | 1,025,972 |
| Complete optimization · all-in | 4 | 29,743,332 | 30,928,400 | 2,016 | 30 | 0.96 | 991,444 |

## live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

The plan offers 4 stops.

| sequence | marches | four-march damage | silver | gold | hired burned | a silver | a hired |
|---|---|---|---|---|---|---|---|
| Tier ladder · all types | 4 | 28,558,757 | 17,179,200 | 62,736 | 874 | 1.66 | 32,676 |
| Tier ladder · Generate (average damage) | 4 | 36,832,597 | 30,800,000 | 62,736 | 874 | 1.20 | 42,143 |
| Troops first · all types | 4 | 28,435,661 | 17,179,200 | 5,176 | 78 | 1.66 | 364,560 |
| Troops first · Generate (average damage) | 4 | 8,250,197 | 0 | 62,736 | 874 | — | 9,440 |
| TotalStack · M’s Preservation | 4 | 32,984,363 | 17,236,000 | 5,056 | 74 | 1.91 | 445,735 |
| TotalStack · priority search under M’s (averageDamage) | 4 | 36,832,597 | 30,800,000 | 62,040 | 864 | 1.20 | 42,630 |
| TotalStack · priority search under M’s (damagePerSilver) | 4 | 32,984,363 | 17,236,000 | 5,056 | 74 | 1.91 | 445,735 |
| TotalStack · Total Optimization | 4 | 33,333,894 | 17,233,600 | 5,088 | 74 | 1.93 | 450,458 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 36,832,597 | 30,800,000 | 30,616 | 428 | 1.20 | 86,057 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 33,333,894 | 17,233,600 | 5,088 | 74 | 1.93 | 450,458 |
| TotalStack · Elite Preservation | 4 | 30,966,094 | 17,233,600 | 62,040 | 864 | 1.80 | 35,840 |
| TotalStack · priority search under Elite (averageDamage) | 4 | 36,832,597 | 30,800,000 | 62,040 | 864 | 1.20 | 42,630 |
| TotalStack · priority search under Elite (damagePerSilver) | 4 | 22,905,506 | 16,332,000 | 62,136 | 868 | 1.40 | 26,389 |
| Complete optimization · sweet-spot | 4 | 25,539,281 | 17,037,600 | 3,472 | 53 | 1.50 | 481,873 |
| Complete optimization · more-mercs | 4 | 28,140,302 | 17,072,400 | 4,056 | 61 | 1.65 | 461,316 |
| Complete optimization · steady-max | 4 | 30,693,083 | 17,179,200 | 5,040 | 76 | 1.79 | 403,856 |
| Complete optimization · all-in | 4 | 31,714,657 | 18,768,000 | 6,192 | 88 | 1.69 | 360,394 |

