# 149 — the fold, as the engine ships it

**Today** is the bar as shipped in 54c7e3d (`burnSaver: 'guard'`); **fold** is the hired saver offered everywhere and the bar re-chosen to at most five stops (`burnSaver: 'silver', foldTo: 5`). Figures are the campaign’s — four marches, worst opening, default recovery; the queue is one training queue’s total over the four marches, speed bonuses on, no speed-up items. In the per-army tables a change is printed as the player reads it: **+** better, **−** worse.

## Summary

| army | today | fold | readings better | readings worse | TS beaten (today → fold) | TS no fit (today → fold) | criteria broken by the fold | fold ms |
|---|---|---|---|---|---|---|---|---:|
| first-run army, Bear V ×1 (20 000 leader | SW | SW | — | — | 1 → 1 | 0 → 0 | — | -30 |
| first-run army, Bear V ×2 (20 000 leader | SW | SW | — | — | 1 → 1 | 0 → 0 | — | -5 |
| first-run army, Bear V ×3 (20 000 leader | SW · AI | SW · AI | — | — | 2 → 2 | 0 → 0 | — | -1 |
| first-run army, Bear V ×10 (20 000 leade | SW · AI | SW · AI | — | — | 2 → 2 | 0 → 0 | — | 1 |
| first-run army, Epic Monster Hunter VI × | HS · SW · MX · AI | HS · SW · MX · AI | — | — | 5 → 5 | 0 → 0 | — | -18 |
| first-run army, monster tiers 3–5 at 900 | HS · SW · MM · MX · AI | HS · SW · MM · MX · AI | — | — | 0 → 0 | 3 → 3 | — | -313 |
| the 4 000-leadership case of 2026-09-15  | SS · SW · AI | SS · SW · AI | — | — | 6 → 6 | 0 → 0 | — | -60 |
| 2026-09-17 export, its setup (7 000 lead | HS · SS · SW · MM · MX · AI | HS · SS · SW · MX · AI | — | — | 6 → 6 | 3 → 3 | — | -53 |
| 2026-09-17 export, 12 000 leadership | SS · SW · MX | HS · SS · SW · MX | fewest hired burned, least gold, dmg a silver, dmg a merc, dmg a gold | — | 3 → 3 | 6 → 2 | — | 2 |
| live account of 2026-09-18 (one hired ty | SS · SW · MX · AI | SS · SW · MX · AI | — | — | 9 → 9 | 0 → 0 | — | -1 |
| live account, evening (hunters 83, legio | HS · SS · SW · MM · MX · AI | HS · SS · SW · MX · AI | — | — | 1 → 1 | 0 → 0 | — | -3 |
| Aydae alone, 4 975 (one captain, four hi | HS · SW · MX · AI | HS · SW · MX · AI | — | — | 0 → 0 | 0 → 0 | — | -31 |
| the owner’s live camp of 2026-09-18 (arb | HS · SW · MM · MX · AI | HS · SW · MM · MX · AI | — | — | 0 → 0 | 0 → 0 | — | -2 |
| his camp of 2026-09-19, the localStorage | HS · SS · SW · MM · MX | HS · SS · SW · MM · MX | — | — | 2 → 2 | 1 → 1 | — | 4 |
| his camp of 2026-09-19, as his message r | HS · SW · MM · MX · AI | HS · SW · MM · MX · AI | — | — | 2 → 2 | 1 → 1 | — | 5 |
| his TotalStack profile of 2026-09-19 (5  | SS · SW · MX | SS · SW · MX | — | — | 2 → 2 | 1 → 1 | — | -95 |
| his usual setup of 2026-09-19 (Aydae alo | HS · SW · MX | HS · SW · MX | — | — | 5 → 5 | 2 → 2 | — | 60 |


**TotalStack rows**: today 47 beaten / 17 no stop fits; fold 47 / 13. **Armies where the fold reads worse on some reading:** 0. **Armies where the folded bar breaks a criterion:** 0. **The most the fold added to one plan:** 60 ms.

| reading | armies better | armies worse |
|---|---:|---:|
| most damage | 0 | 0 |
| least silver | 0 | 0 |
| fewest hired burned | 1 | 0 |
| least gold | 1 | 0 |
| fewest coins | 0 | 0 |
| shortest queue | 0 | 0 |
| dmg a silver | 1 | 0 |
| dmg a merc | 1 | 0 |
| dmg a gold | 1 | 0 |
| dmg a coin | 0 | 0 |


## first-run army, Bear V ×1 (20 000 leadership)

**Today**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SW | 1 | 4,631,402 | 18,189,008 | 32,525,600 | 1 | 0 | 0 | 2,522 h | 0.559 | 112,200 | 0 | — |

**Fold**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SW | 1 | 4,631,402 | 18,189,008 | 32,525,600 | 1 | 0 | 0 | 2,522 h | 0.559 | 112,200 | 0 | — |

| bar | most damage | least silver | fewest hired burned | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS beaten | TS no fit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| today | 18,189,008 | 32,525,600 | 1 | 0 | 0 | 2,522 h | 0.559 | 112,200 | 0 | — | 1 | 0 |
| fold | 18,189,008 | 32,525,600 | 1 | 0 | 0 | 2,522 h | 0.559 | 112,200 | 0 | — | 1 | 0 |

## first-run army, Bear V ×2 (20 000 leadership)

**Today**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SW | 1 | 4,743,602 | 18,413,408 | 32,525,600 | 2 | 160 | 0 | 2,522 h | 0.566 | 168,300 | 115,084 | — |

**Fold**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SW | 1 | 4,743,602 | 18,413,408 | 32,525,600 | 2 | 160 | 0 | 2,522 h | 0.566 | 168,300 | 115,084 | — |

| bar | most damage | least silver | fewest hired burned | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS beaten | TS no fit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| today | 18,413,408 | 32,525,600 | 2 | 160 | 0 | 2,522 h | 0.566 | 168,300 | 115,084 | — | 1 | 0 |
| fold | 18,413,408 | 32,525,600 | 2 | 160 | 0 | 2,522 h | 0.566 | 168,300 | 115,084 | — | 1 | 0 |

## first-run army, Bear V ×3 (20 000 leadership)

**Today**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SW | 1 | 4,631,402 | 18,413,408 | 32,525,600 | 3 | 0 | 0 | 2,522 h | 0.566 | 112,200 | 0 | — |
| AI | 1 | 4,855,802 | 18,750,008 | 32,525,600 | 3 | 480 | 0 | 2,522 h | 0.576 | 224,400 | 39,063 | — |

**Fold**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SW | 1 | 4,631,402 | 18,413,408 | 32,525,600 | 3 | 0 | 0 | 2,522 h | 0.566 | 112,200 | 0 | — |
| AI | 1 | 4,855,802 | 18,750,008 | 32,525,600 | 3 | 480 | 0 | 2,522 h | 0.576 | 224,400 | 39,063 | — |

| bar | most damage | least silver | fewest hired burned | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS beaten | TS no fit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| today | 18,750,008 | 32,525,600 | 3 | 0 | 0 | 2,522 h | 0.576 | 224,400 | 39,063 | — | 2 | 0 |
| fold | 18,750,008 | 32,525,600 | 3 | 0 | 0 | 2,522 h | 0.576 | 224,400 | 39,063 | — | 2 | 0 |

## first-run army, Bear V ×10 (20 000 leadership)

**Today**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SW | 1 | 5,192,402 | 20,769,608 | 32,525,600 | 4 | 3,200 | 0 | 2,522 h | 0.639 | 673,200 | 6,491 | — |
| AI | 1 | 5,384,084 | 20,893,375 | 36,013,400 | 4 | 4,800 | 0 | 3,417 h | 0.580 | 776,050 | 4,353 | — |

**Fold**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SW | 1 | 5,192,402 | 20,769,608 | 32,525,600 | 4 | 3,200 | 0 | 2,522 h | 0.639 | 673,200 | 6,491 | — |
| AI | 1 | 5,384,084 | 20,893,375 | 36,013,400 | 4 | 4,800 | 0 | 3,417 h | 0.580 | 776,050 | 4,353 | — |

| bar | most damage | least silver | fewest hired burned | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS beaten | TS no fit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| today | 20,893,375 | 32,525,600 | 4 | 3,200 | 0 | 2,522 h | 0.639 | 776,050 | 6,491 | — | 2 | 0 |
| fold | 20,893,375 | 32,525,600 | 4 | 3,200 | 0 | 2,522 h | 0.639 | 776,050 | 6,491 | — | 2 | 0 |

## first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)

**Today**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 1 | 4,950,983 | 22,524,152 | 32,525,600 | 11 | 736 | 0 | 2,522 h | 0.693 | 404,304 | 30,603 | — |
| SW | 6 | 7,109,888 | 28,655,444 | 32,525,600 | 25 | 1,760 | 0 | 2,522 h | 0.881 | 423,145 | 16,282 | — |
| MX | 7 | 7,498,490 | 29,691,713 | 32,525,600 | 28 | 1,928 | 0 | 2,522 h | 0.913 | 414,818 | 15,400 | — |
| AI | 9 | 7,897,408 | 29,841,879 | 33,291,200 | 30 | 2,016 | 0 | 2,718 h | 0.896 | 405,874 | 14,803 | — |

**Fold**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 1 | 4,950,983 | 22,524,152 | 32,525,600 | 11 | 736 | 0 | 2,522 h | 0.693 | 404,304 | 30,603 | — |
| SW | 6 | 7,109,888 | 28,655,444 | 32,525,600 | 25 | 1,760 | 0 | 2,522 h | 0.881 | 423,145 | 16,282 | — |
| MX | 7 | 7,498,490 | 29,691,713 | 32,525,600 | 28 | 1,928 | 0 | 2,522 h | 0.913 | 414,818 | 15,400 | — |
| AI | 9 | 7,897,408 | 29,841,879 | 33,291,200 | 30 | 2,016 | 0 | 2,718 h | 0.896 | 405,874 | 14,803 | — |

| bar | most damage | least silver | fewest hired burned | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS beaten | TS no fit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| today | 29,841,879 | 32,525,600 | 11 | 736 | 0 | 2,522 h | 0.913 | 423,145 | 30,603 | — | 5 | 0 |
| fold | 29,841,879 | 32,525,600 | 11 | 736 | 0 | 2,522 h | 0.913 | 423,145 | 30,603 | — | 5 | 0 |

## first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)

**Today**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 2 | 20,225,697 | 81,258,598 | 34,921,200 | 15 | 11,072 | 24,120 | 2,861 h | 2.327 | 541,060 | 7,339 | 3,369 |
| SW | 5 | 22,900,552 | 89,196,808 | 35,230,800 | 24 | 9,424 | 28,200 | 2,911 h | 2.532 | 476,719 | 9,465 | 3,163 |
| MM | 6 | 24,310,932 | 93,298,414 | 35,230,800 | 26 | 10,272 | 28,200 | 2,911 h | 2.648 | 597,802 | 9,083 | 3,308 |
| MX | 8 | 25,783,940 | 97,458,367 | 36,436,800 | 32 | 14,232 | 28,200 | 3,210 h | 2.675 | 543,725 | 6,848 | 3,456 |
| AI | 10 | 26,452,846 | 102,971,902 | 37,316,000 | 34 | 17,888 | 27,040 | 3,439 h | 2.759 | 594,278 | 5,756 | 3,808 |

**Fold**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 2 | 20,225,697 | 81,258,598 | 34,921,200 | 15 | 11,072 | 24,120 | 2,861 h | 2.327 | 541,060 | 7,339 | 3,369 |
| SW | 5 | 22,900,552 | 89,196,808 | 35,230,800 | 24 | 9,424 | 28,200 | 2,911 h | 2.532 | 476,719 | 9,465 | 3,163 |
| MM | 6 | 24,310,932 | 93,298,414 | 35,230,800 | 26 | 10,272 | 28,200 | 2,911 h | 2.648 | 597,802 | 9,083 | 3,308 |
| MX | 8 | 25,783,940 | 97,458,367 | 36,436,800 | 32 | 14,232 | 28,200 | 3,210 h | 2.675 | 543,725 | 6,848 | 3,456 |
| AI | 10 | 26,452,846 | 102,971,902 | 37,316,000 | 34 | 17,888 | 27,040 | 3,439 h | 2.759 | 594,278 | 5,756 | 3,808 |

| bar | most damage | least silver | fewest hired burned | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS beaten | TS no fit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| today | 102,971,902 | 34,921,200 | 15 | 9,424 | 24,120 | 2,861 h | 2.759 | 597,802 | 9,465 | 3,808 | 0 | 3 |
| fold | 102,971,902 | 34,921,200 | 15 | 9,424 | 24,120 | 2,861 h | 2.759 | 597,802 | 9,465 | 3,808 | 0 | 3 |

## the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

**Today**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SS | 4 | 1,073,738 | 5,212,861 | 3,820,600 | 19 | 736 | 0 | 238 h | 1.364 | 189,918 | 7,083 | — |
| SW | 5 | 2,048,786 | 8,222,546 | 6,083,200 | 21 | 1,176 | 0 | 380 h | 1.352 | 265,255 | 6,992 | — |
| AI | 7 | 2,447,995 | 8,519,930 | 6,083,200 | 24 | 1,336 | 0 | 380 h | 1.401 | 261,725 | 6,377 | — |

**Fold**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SS | 4 | 1,073,738 | 5,212,861 | 3,820,600 | 19 | 736 | 0 | 238 h | 1.364 | 189,918 | 7,083 | — |
| SW | 5 | 2,048,786 | 8,222,546 | 6,083,200 | 21 | 1,176 | 0 | 380 h | 1.352 | 265,255 | 6,992 | — |
| AI | 7 | 2,447,995 | 8,519,930 | 6,083,200 | 24 | 1,336 | 0 | 380 h | 1.401 | 261,725 | 6,377 | — |

| bar | most damage | least silver | fewest hired burned | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS beaten | TS no fit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| today | 8,519,930 | 3,820,600 | 19 | 736 | 0 | 238 h | 1.401 | 265,255 | 7,083 | — | 6 | 0 |
| fold | 8,519,930 | 3,820,600 | 19 | 736 | 0 | 238 h | 1.401 | 265,255 | 7,083 | — | 6 | 0 |

## 2026-09-17 export, its setup (7 000 leadership)

**Today**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 4 | 3,203,983 | 15,079,846 | 10,186,900 | 26 | 2,112 | 0 | 683 h | 1.480 | 355,600 | 7,140 | — |
| SS | 6 | 3,549,139 | 16,115,314 | 8,695,000 | 32 | 2,544 | 0 | 583 h | 1.853 | 350,864 | 6,335 | — |
| SW | 7 | 4,442,817 | 18,796,348 | 10,906,900 | 35 | 2,760 | 0 | 731 h | 1.723 | 357,360 | 6,810 | — |
| MM | 11 | 5,230,687 | 21,363,106 | 10,957,600 | 47 | 3,536 | 0 | 739 h | 1.950 | 345,567 | 6,042 | — |
| MX | 14 | 5,913,067 | 22,770,620 | 10,957,600 | 55 | 4,000 | 0 | 739 h | 2.078 | 328,937 | 5,693 | — |
| AI | 26 | 6,603,524 | 23,619,920 | 15,179,600 | 92 | 6,608 | 0 | 1,793 h | 1.556 | 186,943 | 3,574 | — |

**Fold**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 4 | 3,203,983 | 15,079,846 | 10,186,900 | 26 | 2,112 | 0 | 683 h | 1.480 | 355,600 | 7,140 | — |
| SS | 6 | 3,549,139 | 16,115,314 | 8,695,000 | 32 | 2,544 | 0 | 583 h | 1.853 | 350,864 | 6,335 | — |
| SW | 7 | 4,442,817 | 18,796,348 | 10,906,900 | 35 | 2,760 | 0 | 731 h | 1.723 | 357,360 | 6,810 | — |
| MX | 14 | 5,913,067 | 22,770,620 | 10,957,600 | 55 | 4,000 | 0 | 739 h | 2.078 | 328,937 | 5,693 | — |
| AI | 26 | 6,603,524 | 23,619,920 | 15,179,600 | 92 | 6,608 | 0 | 1,793 h | 1.556 | 186,943 | 3,574 | — |

| bar | most damage | least silver | fewest hired burned | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS beaten | TS no fit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| today | 23,619,920 | 8,695,000 | 26 | 2,112 | 0 | 583 h | 2.078 | 357,360 | 7,140 | — | 6 | 3 |
| fold | 23,619,920 | 8,695,000 | 26 | 2,112 | 0 | 583 h | 2.078 | 357,360 | 7,140 | — | 6 | 3 |

## 2026-09-17 export, 12 000 leadership

**Today**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SS | 9 | 4,289,725 | 20,864,973 | 12,129,500 | 45 | 2,984 | 0 | 814 h | 1.720 | 308,097 | 6,992 | — |
| SW | 17 | 8,014,627 | 31,546,458 | 18,790,400 | 67 | 4,824 | 0 | 1,268 h | 1.679 | 333,911 | 6,539 | — |
| MX | 22 | 8,153,756 | 31,963,845 | 21,035,600 | 82 | 5,784 | 0 | 1,814 h | 1.520 | 290,661 | 5,526 | — |

**Fold**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 4 | 4,400,680 | 21,679,374 | 17,808,200 | 30 | 2,408 | 0 | 1,194 h | 1.217 | 369,197 | 9,003 | — |
| SS | 10 | 4,446,760 | 21,273,264 | 12,129,500 | 48 | 3,056 | 0 | 814 h | 1.754 | 297,347 | 6,961 | — |
| SW | 17 | 8,014,627 | 31,546,458 | 18,790,400 | 67 | 4,824 | 0 | 1,268 h | 1.679 | 333,911 | 6,539 | — |
| MX | 22 | 8,153,756 | 31,963,845 | 21,035,600 | 82 | 5,784 | 0 | 1,814 h | 1.520 | 290,661 | 5,526 | — |

| bar | most damage | least silver | fewest hired burned | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS beaten | TS no fit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| today | 31,963,845 | 12,129,500 | 45 | 2,984 | 0 | 814 h | 1.720 | 333,911 | 6,992 | — | 3 | 6 |
| fold | 31,963,845 | 12,129,500 | **30 (+33.3 %)** | **2,408 (+19.3 %)** | 0 | 814 h | **1.754 (+2.0 %)** | **369,197 (+10.6 %)** | **9,003 (+28.8 %)** | — | 3 | 2 |

## live account of 2026-09-18 (one hired type, 20 000 leadership)

**Today**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SS | 4 | 3,694,764 | 18,256,930 | 18,959,900 | 20 | 1,368 | 0 | 1,317 h | 0.963 | 309,021 | 13,346 | — |
| SW | 6 | 7,096,072 | 28,270,883 | 30,516,200 | 25 | 1,760 | 0 | 1,999 h | 0.926 | 317,110 | 16,063 | — |
| MX | 7 | 7,354,938 | 28,727,202 | 30,179,700 | 28 | 1,904 | 0 | 1,977 h | 0.952 | 307,403 | 15,088 | — |
| AI | 9 | 7,840,310 | 29,743,332 | 30,928,400 | 30 | 2,016 | 0 | 2,026 h | 0.962 | 304,167 | 14,754 | — |

**Fold**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SS | 4 | 3,694,764 | 18,256,930 | 18,959,900 | 20 | 1,368 | 0 | 1,317 h | 0.963 | 309,021 | 13,346 | — |
| SW | 6 | 7,096,072 | 28,270,883 | 30,516,200 | 25 | 1,760 | 0 | 1,999 h | 0.926 | 317,110 | 16,063 | — |
| MX | 7 | 7,354,938 | 28,727,202 | 30,179,700 | 28 | 1,904 | 0 | 1,977 h | 0.952 | 307,403 | 15,088 | — |
| AI | 9 | 7,840,310 | 29,743,332 | 30,928,400 | 30 | 2,016 | 0 | 2,026 h | 0.962 | 304,167 | 14,754 | — |

| bar | most damage | least silver | fewest hired burned | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS beaten | TS no fit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| today | 29,743,332 | 18,959,900 | 20 | 1,368 | 0 | 1,317 h | 0.963 | 317,110 | 16,063 | — | 9 | 0 |
| fold | 29,743,332 | 18,959,900 | 20 | 1,368 | 0 | 1,317 h | 0.963 | 317,110 | 16,063 | — | 9 | 0 |

## live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

**Today**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 4 | 4,008,742 | 19,234,820 | 15,338,100 | 32 | 2,296 | 0 | 1,010 h | 1.254 | 301,580 | 8,378 | — |
| SS | 10 | 4,559,792 | 20,649,596 | 12,339,900 | 50 | 3,064 | 0 | 814 h | 1.673 | 261,252 | 6,739 | — |
| SW | 14 | 7,096,423 | 28,140,302 | 17,072,400 | 61 | 4,056 | 0 | 1,124 h | 1.648 | 285,220 | 6,938 | — |
| MM | 17 | 7,706,408 | 29,851,070 | 17,179,200 | 70 | 4,872 | 0 | 1,149 h | 1.738 | 299,381 | 6,127 | — |
| MX | 19 | 7,987,079 | 30,693,083 | 17,179,200 | 76 | 5,040 | 0 | 1,149 h | 1.787 | 286,825 | 6,090 | — |
| AI | 24 | 8,238,793 | 31,714,657 | 18,768,000 | 88 | 6,192 | 0 | 1,539 h | 1.690 | 272,129 | 5,122 | — |

**Fold**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 4 | 4,008,742 | 19,234,820 | 15,338,100 | 32 | 2,296 | 0 | 1,010 h | 1.254 | 301,580 | 8,378 | — |
| SS | 10 | 4,559,792 | 20,649,596 | 12,339,900 | 50 | 3,064 | 0 | 814 h | 1.673 | 261,252 | 6,739 | — |
| SW | 14 | 7,096,423 | 28,140,302 | 17,072,400 | 61 | 4,056 | 0 | 1,124 h | 1.648 | 285,220 | 6,938 | — |
| MX | 19 | 7,987,079 | 30,693,083 | 17,179,200 | 76 | 5,040 | 0 | 1,149 h | 1.787 | 286,825 | 6,090 | — |
| AI | 24 | 8,238,793 | 31,714,657 | 18,768,000 | 88 | 6,192 | 0 | 1,539 h | 1.690 | 272,129 | 5,122 | — |

| bar | most damage | least silver | fewest hired burned | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS beaten | TS no fit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| today | 31,714,657 | 12,339,900 | 32 | 2,296 | 0 | 814 h | 1.787 | 301,580 | 8,378 | — | 1 | 0 |
| fold | 31,714,657 | 12,339,900 | 32 | 2,296 | 0 | 814 h | 1.787 | 301,580 | 8,378 | — | 1 | 0 |

## Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)

**Today**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 4 | 2,039,114 | 9,427,601 | 5,764,300 | 19 | 1,288 | 0 | 324 h | 1.636 | 325,749 | 7,320 | — |
| SW | 10 | 4,074,558 | 15,533,933 | 7,682,800 | 37 | 2,440 | 0 | 500 h | 2.022 | 300,662 | 6,366 | — |
| MX | 17 | 4,773,281 | 17,630,102 | 8,448,400 | 58 | 4,120 | 0 | 696 h | 2.087 | 237,879 | 4,279 | — |
| AI | 26 | 5,366,544 | 18,744,735 | 11,240,800 | 111 | 7,848 | 0 | 1,425 h | 1.668 | 133,301 | 2,388 | — |

**Fold**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 4 | 2,039,114 | 9,427,601 | 5,764,300 | 19 | 1,288 | 0 | 324 h | 1.636 | 325,749 | 7,320 | — |
| SW | 10 | 4,074,558 | 15,533,933 | 7,682,800 | 37 | 2,440 | 0 | 500 h | 2.022 | 300,662 | 6,366 | — |
| MX | 17 | 4,773,281 | 17,630,102 | 8,448,400 | 58 | 4,120 | 0 | 696 h | 2.087 | 237,879 | 4,279 | — |
| AI | 26 | 5,366,544 | 18,744,735 | 11,240,800 | 111 | 7,848 | 0 | 1,425 h | 1.668 | 133,301 | 2,388 | — |

| bar | most damage | least silver | fewest hired burned | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS beaten | TS no fit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| today | 18,744,735 | 5,764,300 | 19 | 1,288 | 0 | 324 h | 2.087 | 325,749 | 7,320 | — | 0 | 0 |
| fold | 18,744,735 | 5,764,300 | 19 | 1,288 | 0 | 324 h | 2.087 | 325,749 | 7,320 | — | 0 | 0 |

## the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)

**Today**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 3 | 2,010,108 | 8,260,768 | 7,241,900 | 16 | 1,448 | 0 | 477 h | 1.141 | 232,812 | 5,705 | — |
| SW | 4 | 2,249,888 | 8,980,108 | 7,241,900 | 19 | 1,664 | 0 | 477 h | 1.240 | 233,912 | 5,397 | — |
| MM | 10 | 3,285,305 | 12,086,359 | 9,849,200 | 37 | 5,264 | 0 | 1,024 h | 1.227 | 195,020 | 2,296 | — |
| MX | 15 | 4,358,805 | 15,306,859 | 9,849,200 | 52 | 6,344 | 0 | 1,024 h | 1.554 | 200,697 | 2,413 | — |
| AI | 25 | 3,370,177 | 10,899,547 | 6,653,700 | 133 | 17,504 | 0 | 936 h | 1.638 | 81,951 | 623 | — |

**Fold**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 3 | 2,010,108 | 8,260,768 | 7,241,900 | 16 | 1,448 | 0 | 477 h | 1.141 | 232,812 | 5,705 | — |
| SW | 4 | 2,249,888 | 8,980,108 | 7,241,900 | 19 | 1,664 | 0 | 477 h | 1.240 | 233,912 | 5,397 | — |
| MM | 10 | 3,285,305 | 12,086,359 | 9,849,200 | 37 | 5,264 | 0 | 1,024 h | 1.227 | 195,020 | 2,296 | — |
| MX | 15 | 4,358,805 | 15,306,859 | 9,849,200 | 52 | 6,344 | 0 | 1,024 h | 1.554 | 200,697 | 2,413 | — |
| AI | 25 | 3,370,177 | 10,899,547 | 6,653,700 | 133 | 17,504 | 0 | 936 h | 1.638 | 81,951 | 623 | — |

| bar | most damage | least silver | fewest hired burned | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS beaten | TS no fit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| today | 15,306,859 | 6,653,700 | 16 | 1,448 | 0 | 477 h | 1.638 | 233,912 | 5,705 | — | 0 | 0 |
| fold | 15,306,859 | 6,653,700 | 16 | 1,448 | 0 | 477 h | 1.638 | 233,912 | 5,705 | — | 0 | 0 |

## his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)

**Today**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 1 | 1,575,106 | 6,638,052 | 7,723,100 | 6 | 392 | 0 | 510 h | 0.860 | 296,617 | 16,934 | — |
| SS | 3 | 1,882,911 | 7,561,467 | 7,313,300 | 12 | 848 | 0 | 627 h | 1.034 | 318,189 | 8,917 | — |
| SW | 4 | 2,385,168 | 9,068,238 | 8,746,700 | 15 | 1,016 | 0 | 760 h | 1.037 | 306,324 | 8,925 | — |
| MM | 10 | 2,793,778 | 10,294,068 | 10,005,200 | 33 | 2,288 | 0 | 1,076 h | 1.029 | 170,126 | 4,499 | — |
| MX | 18 | 3,976,648 | 13,842,678 | 10,476,500 | 57 | 3,944 | 0 | 1,234 h | 1.321 | 164,062 | 3,510 | — |

**Fold**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 1 | 1,575,106 | 6,638,052 | 7,723,100 | 6 | 392 | 0 | 510 h | 0.860 | 296,617 | 16,934 | — |
| SS | 3 | 1,882,911 | 7,561,467 | 7,313,300 | 12 | 848 | 0 | 627 h | 1.034 | 318,189 | 8,917 | — |
| SW | 4 | 2,385,168 | 9,068,238 | 8,746,700 | 15 | 1,016 | 0 | 760 h | 1.037 | 306,324 | 8,925 | — |
| MM | 10 | 2,793,778 | 10,294,068 | 10,005,200 | 33 | 2,288 | 0 | 1,076 h | 1.029 | 170,126 | 4,499 | — |
| MX | 18 | 3,976,648 | 13,842,678 | 10,476,500 | 57 | 3,944 | 0 | 1,234 h | 1.321 | 164,062 | 3,510 | — |

| bar | most damage | least silver | fewest hired burned | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS beaten | TS no fit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| today | 13,842,678 | 7,313,300 | 6 | 392 | 0 | 510 h | 1.321 | 318,189 | 16,934 | — | 2 | 1 |
| fold | 13,842,678 | 7,313,300 | 6 | 392 | 0 | 510 h | 1.321 | 318,189 | 16,934 | — | 2 | 1 |

## his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)

**Today**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 1 | 1,513,076 | 7,402,685 | 8,369,100 | 15 | 1,056 | 0 | 756 h | 0.885 | 190,913 | 7,010 | — |
| SW | 5 | 2,509,413 | 10,156,338 | 9,503,600 | 25 | 1,792 | 0 | 967 h | 1.069 | 258,218 | 5,668 | — |
| MM | 8 | 2,549,800 | 10,197,781 | 10,729,000 | 34 | 2,416 | 0 | 1,288 h | 0.950 | 159,888 | 4,221 | — |
| MX | 10 | 2,873,382 | 11,196,175 | 11,037,400 | 39 | 2,808 | 0 | 1,328 h | 1.014 | 161,791 | 3,987 | — |
| AI | 11 | 3,160,072 | 11,585,381 | 11,202,400 | 41 | 2,888 | 0 | 1,354 h | 1.034 | 158,634 | 4,012 | — |

**Fold**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 1 | 1,513,076 | 7,402,685 | 8,369,100 | 15 | 1,056 | 0 | 756 h | 0.885 | 190,913 | 7,010 | — |
| SW | 5 | 2,509,413 | 10,156,338 | 9,503,600 | 25 | 1,792 | 0 | 967 h | 1.069 | 258,218 | 5,668 | — |
| MM | 8 | 2,549,800 | 10,197,781 | 10,729,000 | 34 | 2,416 | 0 | 1,288 h | 0.950 | 159,888 | 4,221 | — |
| MX | 10 | 2,873,382 | 11,196,175 | 11,037,400 | 39 | 2,808 | 0 | 1,328 h | 1.014 | 161,791 | 3,987 | — |
| AI | 11 | 3,160,072 | 11,585,381 | 11,202,400 | 41 | 2,888 | 0 | 1,354 h | 1.034 | 158,634 | 4,012 | — |

| bar | most damage | least silver | fewest hired burned | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS beaten | TS no fit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| today | 11,585,381 | 8,369,100 | 15 | 1,056 | 0 | 756 h | 1.069 | 258,218 | 7,010 | — | 2 | 1 |
| fold | 11,585,381 | 8,369,100 | 15 | 1,056 | 0 | 756 h | 1.069 | 258,218 | 7,010 | — | 2 | 1 |

## his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80)

**Today**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SS | 1 | 1,000,201 | 4,919,095 | 4,431,600 | 7 | 480 | 3,840 | 279 h | 1.110 | 131,856 | 10,248 | 1,281 |
| SW | 5 | 2,087,912 | 8,182,228 | 8,340,000 | 19 | 1,320 | 3,840 | 570 h | 0.981 | 109,005 | 6,199 | 2,131 |
| MX | 7 | 2,163,313 | 8,408,431 | 8,702,400 | 25 | 1,584 | 3,840 | 658 h | 0.966 | 100,404 | 5,308 | 2,190 |

**Fold**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SS | 1 | 1,000,201 | 4,919,095 | 4,431,600 | 7 | 480 | 3,840 | 279 h | 1.110 | 131,856 | 10,248 | 1,281 |
| SW | 5 | 2,087,912 | 8,182,228 | 8,340,000 | 19 | 1,320 | 3,840 | 570 h | 0.981 | 109,005 | 6,199 | 2,131 |
| MX | 7 | 2,163,313 | 8,408,431 | 8,702,400 | 25 | 1,584 | 3,840 | 658 h | 0.966 | 100,404 | 5,308 | 2,190 |

| bar | most damage | least silver | fewest hired burned | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS beaten | TS no fit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| today | 8,408,431 | 4,431,600 | 7 | 480 | 3,840 | 279 h | 1.110 | 131,856 | 10,248 | 2,190 | 2 | 1 |
| fold | 8,408,431 | 4,431,600 | 7 | 480 | 3,840 | 279 h | 1.110 | 131,856 | 10,248 | 2,190 | 2 | 1 |

## his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90)

**Today**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 1 | 1,846,812 | 8,183,996 | 6,127,800 | 5 | 352 | 3,960 | 375 h | 1.336 | 317,110 | 23,250 | 2,067 |
| SW | 2 | 2,924,497 | 11,417,051 | 8,090,400 | 8 | 544 | 5,760 | 506 h | 1.411 | 422,679 | 20,987 | 1,982 |
| MX | 4 | 3,025,937 | 11,721,371 | 8,695,200 | 14 | 808 | 4,320 | 661 h | 1.348 | 265,799 | 14,507 | 2,713 |

**Fold**

| stop | burned a march | damage a march | damage | silver | hired burned | gold | coins | queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 1 | 1,846,812 | 8,183,996 | 6,127,800 | 5 | 352 | 3,960 | 375 h | 1.336 | 317,110 | 23,250 | 2,067 |
| SW | 2 | 2,924,497 | 11,417,051 | 8,090,400 | 8 | 544 | 5,760 | 506 h | 1.411 | 422,679 | 20,987 | 1,982 |
| MX | 4 | 3,025,937 | 11,721,371 | 8,695,200 | 14 | 808 | 4,320 | 661 h | 1.348 | 265,799 | 14,507 | 2,713 |

| bar | most damage | least silver | fewest hired burned | least gold | fewest coins | shortest queue | dmg a silver | dmg a merc | dmg a gold | dmg a coin | TS beaten | TS no fit |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| today | 11,721,371 | 6,127,800 | 5 | 352 | 3,960 | 375 h | 1.411 | 422,679 | 23,250 | 2,713 | 5 | 2 |
| fold | 11,721,371 | 6,127,800 | 5 | 352 | 3,960 | 375 h | 1.411 | 422,679 | 23,250 | 2,713 | 5 | 2 |
