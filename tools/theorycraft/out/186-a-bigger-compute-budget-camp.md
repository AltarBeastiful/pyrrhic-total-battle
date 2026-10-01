# 186 B — the 20 000-dominance camp under a bigger compute budget

Experiment 129’s larger camp (monster tiers 3–7, 20 000 dominance, twenty uncapped types): the one army known to fill the plan’s clock. A’s three levels, then D’s levers one at a time; `ms` is one wall-clock call, single-file run.

- **×1**: `budgetMs` 40,000, `PLAN_LIMITS` as shipped
- **×2**: `budgetMs` 80,000, crossedTypes 4, climbSeeds 16, climbRounds 32, sweepRounds 32, retypeShare 0.1, retypeExhaustive 10,000, retypeClimbSteps 120
- **×4**: `budgetMs` 160,000, crossedTypes 5, climbSeeds 32, climbRounds 64, sweepRounds 64, retypeShare 0.2, retypeExhaustive 20,000, retypeClimbSteps 240
- **budgetMs ×4**: `budgetMs` 160,000, `PLAN_LIMITS` as shipped
- **crossedTypes 5**: `budgetMs` 40,000, crossedTypes 5
- **climbSeeds 32**: `budgetMs` 40,000, climbSeeds 32
- **climbRounds 64**: `budgetMs` 40,000, climbRounds 64
- **sweepRounds 64**: `budgetMs` 40,000, sweepRounds 64
- **retype ×4**: `budgetMs` 40,000, retypeShare 0.2, retypeExhaustive 20,000, retypeClimbSteps 240
- **climbRounds 24**: `budgetMs` 40,000, climbRounds 24
- **climbRounds 32**: `budgetMs` 40,000, climbRounds 32
- **climbRounds 48**: `budgetMs` 40,000, climbRounds 48

| level | ms | stop | damage | silver | hired burned | gold | dragon coins | queue h | dmg/silver | dmg/hired | rated vs ×1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ×1 | 1,661 | HS | 692,368,218 | 51,627,700 | 24 | 13,216 | 148,320 | 7,842 | 13.411 | 760,607 | — |
| ×1 |  | SW | 771,454,580 | 56,648,400 | 24 | 24,864 | 143,680 | 8,981 | 13.618 | 831,835 | — |
| ×1 |  | MX | 881,449,780 | 62,159,300 | 29 | 22,296 | 169,320 | 9,872 | 14.180 | 777,750 | — |
| ×1 |  | AI | 1,916,899,710 | 90,311,200 | 34 | 42,848 | 366,720 | 14,324 | 21.225 | 835,048 | — |
| ×2 | 2,010 | SS | 758,014,640 | 46,561,600 | 16 | 12,512 | 164,480 | 7,312 | 16.280 | 716,694 | new |
| ×2 |  | SW | **1,132,374,984** (+46.78 %) | **76,544,800** (+35.12 %) | **20** (−16.67 %) | **23,936** (−3.73 %) | **208,320** (+44.99 %) | 12,258 | 14.794 | 780,610 | +37.304 |
| ×2 |  | MM | 1,591,128,864 | 84,032,000 | 28 | 36,192 | 291,520 | 13,366 | 18.935 | 824,031 | new |
| ×2 |  | MX | **1,704,237,793** (+93.34 %) | **82,375,400** (+32.52 %) | **32** (+10.34 %) | **39,672** (+77.93 %) | **304,440** (+79.80 %) | 13,060 | 20.689 | 831,119 | +58.402 |
| ×2 |  | AI | **1,924,929,114** (+0.42 %) | **88,360,000** (−2.16 %) | 34 | **48,544** (+13.29 %) | **336,480** (−8.25 %) | 13,989 | 21.785 | 835,048 | −0.719 |
| ×4 | 5,605 | SS | 758,014,640 | 46,561,600 | 16 | 12,512 | 164,480 | 7,312 | 16.280 | 716,694 | new |
| ×4 |  | SW | **1,132,374,984** (+46.78 %) | **76,544,800** (+35.12 %) | **20** (−16.67 %) | **23,936** (−3.73 %) | **208,320** (+44.99 %) | 12,258 | 14.794 | 780,610 | +37.304 |
| ×4 |  | MM | 1,591,128,864 | 84,032,000 | 28 | 36,192 | 291,520 | 13,366 | 18.935 | 824,031 | new |
| ×4 |  | MX | **1,704,237,793** (+93.34 %) | **82,375,400** (+32.52 %) | **32** (+10.34 %) | **39,672** (+77.93 %) | **304,440** (+79.80 %) | 13,060 | 20.689 | 831,119 | +58.402 |
| ×4 |  | AI | **1,924,929,114** (+0.42 %) | **88,360,000** (−2.16 %) | 34 | **48,544** (+13.29 %) | **336,480** (−8.25 %) | 13,989 | 21.785 | 835,048 | −0.719 |
| budgetMs ×4 | 1,404 | HS | 692,368,218 | 51,627,700 | 24 | 13,216 | 148,320 | 7,842 | 13.411 | 760,607 | 0 |
| budgetMs ×4 |  | SW | 771,454,580 | 56,648,400 | 24 | 24,864 | 143,680 | 8,981 | 13.618 | 831,835 | 0 |
| budgetMs ×4 |  | MX | 881,449,780 | 62,159,300 | 29 | 22,296 | 169,320 | 9,872 | 14.180 | 777,750 | 0 |
| budgetMs ×4 |  | AI | 1,916,899,710 | 90,311,200 | 34 | 42,848 | 366,720 | 14,324 | 21.225 | 835,048 | 0 |
| crossedTypes 5 | 4,232 | HS | 692,368,218 | 51,627,700 | 24 | 13,216 | 148,320 | 7,842 | 13.411 | 760,607 | 0 |
| crossedTypes 5 |  | SW | 771,454,580 | 56,648,400 | 24 | 24,864 | 143,680 | 8,981 | 13.618 | 831,835 | 0 |
| crossedTypes 5 |  | MX | 881,449,780 | 62,159,300 | 29 | 22,296 | 169,320 | 9,872 | 14.180 | 777,750 | 0 |
| crossedTypes 5 |  | AI | 1,916,899,710 | 90,311,200 | 34 | 42,848 | 366,720 | 14,324 | 21.225 | 835,048 | 0 |
| climbSeeds 32 | 1,402 | HS | 692,368,218 | 51,627,700 | 24 | 13,216 | 148,320 | 7,842 | 13.411 | 760,607 | 0 |
| climbSeeds 32 |  | SW | 771,454,580 | 56,648,400 | 24 | 24,864 | 143,680 | 8,981 | 13.618 | 831,835 | 0 |
| climbSeeds 32 |  | MX | 881,449,780 | 62,159,300 | 29 | 22,296 | 169,320 | 9,872 | 14.180 | 777,750 | 0 |
| climbSeeds 32 |  | AI | 1,916,899,710 | 90,311,200 | 34 | 42,848 | 366,720 | 14,324 | 21.225 | 835,048 | 0 |
| climbRounds 64 | 2,628 | SS | 758,014,640 | 46,561,600 | 16 | 12,512 | 164,480 | 7,312 | 16.280 | 716,694 | new |
| climbRounds 64 |  | SW | **1,132,374,984** (+46.78 %) | **76,544,800** (+35.12 %) | **20** (−16.67 %) | **23,936** (−3.73 %) | **208,320** (+44.99 %) | 12,258 | 14.794 | 780,610 | +37.304 |
| climbRounds 64 |  | MM | 1,591,128,864 | 84,032,000 | 28 | 36,192 | 291,520 | 13,366 | 18.935 | 824,031 | new |
| climbRounds 64 |  | MX | **1,704,237,793** (+93.34 %) | **82,375,400** (+32.52 %) | **32** (+10.34 %) | **39,672** (+77.93 %) | **304,440** (+79.80 %) | 13,060 | 20.689 | 831,119 | +58.402 |
| climbRounds 64 |  | AI | **1,924,929,114** (+0.42 %) | **88,360,000** (−2.16 %) | 34 | **48,544** (+13.29 %) | **336,480** (−8.25 %) | 13,989 | 21.785 | 835,048 | −0.719 |
| sweepRounds 64 | 1,395 | HS | 692,368,218 | 51,627,700 | 24 | 13,216 | 148,320 | 7,842 | 13.411 | 760,607 | 0 |
| sweepRounds 64 |  | SW | 771,454,580 | 56,648,400 | 24 | 24,864 | 143,680 | 8,981 | 13.618 | 831,835 | 0 |
| sweepRounds 64 |  | MX | 881,449,780 | 62,159,300 | 29 | 22,296 | 169,320 | 9,872 | 14.180 | 777,750 | 0 |
| sweepRounds 64 |  | AI | 1,916,899,710 | 90,311,200 | 34 | 42,848 | 366,720 | 14,324 | 21.225 | 835,048 | 0 |
| retype ×4 | 1,381 | HS | 692,368,218 | 51,627,700 | 24 | 13,216 | 148,320 | 7,842 | 13.411 | 760,607 | 0 |
| retype ×4 |  | SW | 771,454,580 | 56,648,400 | 24 | 24,864 | 143,680 | 8,981 | 13.618 | 831,835 | 0 |
| retype ×4 |  | MX | 881,449,780 | 62,159,300 | 29 | 22,296 | 169,320 | 9,872 | 14.180 | 777,750 | 0 |
| retype ×4 |  | AI | 1,916,899,710 | 90,311,200 | 34 | 42,848 | 366,720 | 14,324 | 21.225 | 835,048 | 0 |
| climbRounds 24 | 1,621 | SS | 724,509,664 | 50,581,600 | 24 | 13,168 | 154,920 | 7,661 | 14.324 | 739,018 | new |
| climbRounds 24 |  | SW | **888,338,059** (+15.15 %) | **61,715,900** (+8.95 %) | **26** (+8.33 %) | **15,888** (−36.10 %) | **168,240** (+17.09 %) | 9,823 | 14.394 | 827,633 | +16.544 |
| climbRounds 24 |  | MX | **949,762,198** (+7.75 %) | **61,750,400** (−0.66 %) | 29 | **22,248** (−0.22 %) | **180,720** (+6.73 %) | 9,796 | 15.381 | 759,882 | +7.102 |
| climbRounds 24 |  | AI | 1,916,899,710 | 90,311,200 | 34 | 42,848 | 366,720 | 14,324 | 21.225 | 835,048 | 0 |
| climbRounds 32 | 1,818 | SS | 758,014,640 | 46,561,600 | 16 | 12,512 | 164,480 | 7,312 | 16.280 | 716,694 | new |
| climbRounds 32 |  | SW | **1,132,374,984** (+46.78 %) | **76,544,800** (+35.12 %) | **20** (−16.67 %) | **23,936** (−3.73 %) | **208,320** (+44.99 %) | 12,258 | 14.794 | 780,610 | +37.304 |
| climbRounds 32 |  | MM | 1,591,128,864 | 84,032,000 | 28 | 36,192 | 291,520 | 13,366 | 18.935 | 824,031 | new |
| climbRounds 32 |  | MX | **1,704,237,793** (+93.34 %) | **82,375,400** (+32.52 %) | **32** (+10.34 %) | **39,672** (+77.93 %) | **304,440** (+79.80 %) | 13,060 | 20.689 | 831,119 | +58.402 |
| climbRounds 32 |  | AI | **1,924,929,114** (+0.42 %) | **88,360,000** (−2.16 %) | 34 | **48,544** (+13.29 %) | **336,480** (−8.25 %) | 13,989 | 21.785 | 835,048 | −0.719 |
| climbRounds 48 | 2,171 | SS | 758,014,640 | 46,561,600 | 16 | 12,512 | 164,480 | 7,312 | 16.280 | 716,694 | new |
| climbRounds 48 |  | SW | **1,132,374,984** (+46.78 %) | **76,544,800** (+35.12 %) | **20** (−16.67 %) | **23,936** (−3.73 %) | **208,320** (+44.99 %) | 12,258 | 14.794 | 780,610 | +37.304 |
| climbRounds 48 |  | MM | 1,591,128,864 | 84,032,000 | 28 | 36,192 | 291,520 | 13,366 | 18.935 | 824,031 | new |
| climbRounds 48 |  | MX | **1,704,237,793** (+93.34 %) | **82,375,400** (+32.52 %) | **32** (+10.34 %) | **39,672** (+77.93 %) | **304,440** (+79.80 %) | 13,060 | 20.689 | 831,119 | +58.402 |
| climbRounds 48 |  | AI | **1,924,929,114** (+0.42 %) | **88,360,000** (−2.16 %) | 34 | **48,544** (+13.29 %) | **336,480** (−8.25 %) | 13,989 | 21.785 | 835,048 | −0.719 |

- ×2, the bar's best against ×1's: most damage **+0.42 %** · least silver **+9.81 %** · fewest hired **+33.33 %** · dmg/silver **+2.64 %** · dmg/hired 0
- ×4, the bar's best against ×1's: most damage **+0.42 %** · least silver **+9.81 %** · fewest hired **+33.33 %** · dmg/silver **+2.64 %** · dmg/hired 0
- budgetMs ×4, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- crossedTypes 5, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbSeeds 32, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 64, the bar's best against ×1's: most damage **+0.42 %** · least silver **+9.81 %** · fewest hired **+33.33 %** · dmg/silver **+2.64 %** · dmg/hired 0
- sweepRounds 64, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retype ×4, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 24, the bar's best against ×1's: most damage 0 · least silver **+2.03 %** · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 32, the bar's best against ×1's: most damage **+0.42 %** · least silver **+9.81 %** · fewest hired **+33.33 %** · dmg/silver **+2.64 %** · dmg/hired 0
- climbRounds 48, the bar's best against ×1's: most damage **+0.42 %** · least silver **+9.81 %** · fewest hired **+33.33 %** · dmg/silver **+2.64 %** · dmg/hired 0

| level | ms | of its budget | stops | most damage | its silver |
|---|---|---|---|---|---|
| ×1 | 1,661 | 4 % | 4 | 1,916,899,710 | 90,311,200 |
| ×2 | 2,010 | 3 % | 5 | 1,924,929,114 | 88,360,000 |
| ×4 | 5,605 | 4 % | 5 | 1,924,929,114 | 88,360,000 |
| budgetMs ×4 | 1,404 | 1 % | 4 | 1,916,899,710 | 90,311,200 |
| crossedTypes 5 | 4,232 | 11 % | 4 | 1,916,899,710 | 90,311,200 |
| climbSeeds 32 | 1,402 | 4 % | 4 | 1,916,899,710 | 90,311,200 |
| climbRounds 64 | 2,628 | 7 % | 5 | 1,924,929,114 | 88,360,000 |
| sweepRounds 64 | 1,395 | 3 % | 4 | 1,916,899,710 | 90,311,200 |
| retype ×4 | 1,381 | 3 % | 4 | 1,916,899,710 | 90,311,200 |
| climbRounds 24 | 1,621 | 4 % | 4 | 1,916,899,710 | 90,311,200 |
| climbRounds 32 | 1,818 | 5 % | 5 | 1,924,929,114 | 88,360,000 |
| climbRounds 48 | 2,171 | 5 % | 5 | 1,924,929,114 | 88,360,000 |

## Summary against ×1

| level | stops better | equal | worse | new | dropped | best gain (rated) | worst (rated) | armies whose bar best moved, better / worse | planner total |
|---|---|---|---|---|---|---|---|---|---|
| ×1 | 0 | 0 | 0 | 0 | 0 | — | — | most damage 0/0 · least silver 0/0 · fewest hired 0/0 · dmg/silver 0/0 · dmg/hired 0/0 | 1,661 ms |
| ×2 | 2 | 0 | 1 | 2 | 1 | +58.402 20 000 camp · MX | −0.719 20 000 camp · AI | most damage 1/0 · least silver 1/0 · fewest hired 1/0 · dmg/silver 1/0 · dmg/hired 0/0 | 2,010 ms |
| ×4 | 2 | 0 | 1 | 2 | 1 | +58.402 20 000 camp · MX | −0.719 20 000 camp · AI | most damage 1/0 · least silver 1/0 · fewest hired 1/0 · dmg/silver 1/0 · dmg/hired 0/0 | 5,605 ms |
| budgetMs ×4 | 0 | 4 | 0 | 0 | 0 | — | — | most damage 0/0 · least silver 0/0 · fewest hired 0/0 · dmg/silver 0/0 · dmg/hired 0/0 | 1,404 ms |
| crossedTypes 5 | 0 | 4 | 0 | 0 | 0 | — | — | most damage 0/0 · least silver 0/0 · fewest hired 0/0 · dmg/silver 0/0 · dmg/hired 0/0 | 4,232 ms |
| climbSeeds 32 | 0 | 4 | 0 | 0 | 0 | — | — | most damage 0/0 · least silver 0/0 · fewest hired 0/0 · dmg/silver 0/0 · dmg/hired 0/0 | 1,402 ms |
| climbRounds 64 | 2 | 0 | 1 | 2 | 1 | +58.402 20 000 camp · MX | −0.719 20 000 camp · AI | most damage 1/0 · least silver 1/0 · fewest hired 1/0 · dmg/silver 1/0 · dmg/hired 0/0 | 2,628 ms |
| sweepRounds 64 | 0 | 4 | 0 | 0 | 0 | — | — | most damage 0/0 · least silver 0/0 · fewest hired 0/0 · dmg/silver 0/0 · dmg/hired 0/0 | 1,395 ms |
| retype ×4 | 0 | 4 | 0 | 0 | 0 | — | — | most damage 0/0 · least silver 0/0 · fewest hired 0/0 · dmg/silver 0/0 · dmg/hired 0/0 | 1,381 ms |
| climbRounds 24 | 2 | 1 | 0 | 1 | 1 | +16.544 20 000 camp · SW | — | most damage 0/0 · least silver 1/0 · fewest hired 0/0 · dmg/silver 0/0 · dmg/hired 0/0 | 1,621 ms |
| climbRounds 32 | 2 | 0 | 1 | 2 | 1 | +58.402 20 000 camp · MX | −0.719 20 000 camp · AI | most damage 1/0 · least silver 1/0 · fewest hired 1/0 · dmg/silver 1/0 · dmg/hired 0/0 | 1,818 ms |
| climbRounds 48 | 2 | 0 | 1 | 2 | 1 | +58.402 20 000 camp · MX | −0.719 20 000 camp · AI | most damage 1/0 · least silver 1/0 · fewest hired 1/0 · dmg/silver 1/0 · dmg/hired 0/0 | 2,171 ms |
