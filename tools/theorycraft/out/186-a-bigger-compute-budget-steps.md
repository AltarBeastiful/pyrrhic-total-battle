# 186 E — the two levers that move the bar, stepped

D found two levers that move any stop: the seed climb’s `climbRounds` and the re-typing. Each is stepped alone here against ×1 on every benchmark army, to find where the first stop moves and what each step costs. `ms` is one wall-clock call, single-file run.

- **×1**: `budgetMs` 40,000, `PLAN_LIMITS` as shipped
- **climbRounds 24**: `budgetMs` 40,000, climbRounds 24
- **climbRounds 32**: `budgetMs` 40,000, climbRounds 32
- **climbRounds 40**: `budgetMs` 40,000, climbRounds 40
- **climbRounds 48**: `budgetMs` 40,000, climbRounds 48
- **climbRounds 64**: `budgetMs` 40,000, climbRounds 64
- **climbRounds 128**: `budgetMs` 40,000, climbRounds 128
- **climbRounds 256**: `budgetMs` 40,000, climbRounds 256
- **climbRounds 1,024**: `budgetMs` 40,000, climbRounds 1,024
- **retypeExhaustive 10,000**: `budgetMs` 40,000, retypeExhaustive 10,000
- **retypeExhaustive 20,000**: `budgetMs` 40,000, retypeExhaustive 20,000
- **retypeExhaustive 40,000**: `budgetMs` 40,000, retypeExhaustive 40,000
- **retypeClimbSteps 240**: `budgetMs` 40,000, retypeClimbSteps 240

## first-run army, Bear V ×1 (20 000 leadership)

| level | ms | stop | damage | silver | hired burned | gold | dragon coins | queue h | dmg/silver | dmg/hired | rated vs ×1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ×1 | 41 | SW | 18,479,500 | 32,525,600 | 1 | 0 | 0 | 2,524 | 0.568 | 112,200 | — |
| climbRounds 24 | 17 | SW | 18,479,500 | 32,525,600 | 1 | 0 | 0 | 2,524 | 0.568 | 112,200 | 0 |
| climbRounds 32 | 13 | SW | 18,479,500 | 32,525,600 | 1 | 0 | 0 | 2,524 | 0.568 | 112,200 | 0 |
| climbRounds 40 | 13 | SW | 18,479,500 | 32,525,600 | 1 | 0 | 0 | 2,524 | 0.568 | 112,200 | 0 |
| climbRounds 48 | 9 | SW | 18,479,500 | 32,525,600 | 1 | 0 | 0 | 2,524 | 0.568 | 112,200 | 0 |
| climbRounds 64 | 10 | SW | 18,479,500 | 32,525,600 | 1 | 0 | 0 | 2,524 | 0.568 | 112,200 | 0 |
| climbRounds 128 | 7 | SW | 18,479,500 | 32,525,600 | 1 | 0 | 0 | 2,524 | 0.568 | 112,200 | 0 |
| climbRounds 256 | 8 | SW | 18,479,500 | 32,525,600 | 1 | 0 | 0 | 2,524 | 0.568 | 112,200 | 0 |
| climbRounds 1,024 | 7 | SW | 18,479,500 | 32,525,600 | 1 | 0 | 0 | 2,524 | 0.568 | 112,200 | 0 |
| retypeExhaustive 10,000 | 6 | SW | 18,479,500 | 32,525,600 | 1 | 0 | 0 | 2,524 | 0.568 | 112,200 | 0 |
| retypeExhaustive 20,000 | 8 | SW | 18,479,500 | 32,525,600 | 1 | 0 | 0 | 2,524 | 0.568 | 112,200 | 0 |
| retypeExhaustive 40,000 | 6 | SW | 18,479,500 | 32,525,600 | 1 | 0 | 0 | 2,524 | 0.568 | 112,200 | 0 |
| retypeClimbSteps 240 | 6 | SW | 18,479,500 | 32,525,600 | 1 | 0 | 0 | 2,524 | 0.568 | 112,200 | 0 |

- climbRounds 24, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 32, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 40, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 48, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 64, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 128, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 256, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 1,024, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 10,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 20,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 40,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeClimbSteps 240, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0

## first-run army, Bear V ×2 (20 000 leadership)

| level | ms | stop | damage | silver | hired burned | gold | dragon coins | queue h | dmg/silver | dmg/hired | rated vs ×1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ×1 | 23 | SW | 18,703,900 | 32,525,600 | 2 | 160 | 0 | 2,524 | 0.575 | 168,300 | — |
| climbRounds 24 | 16 | SW | 18,703,900 | 32,525,600 | 2 | 160 | 0 | 2,524 | 0.575 | 168,300 | 0 |
| climbRounds 32 | 14 | SW | 18,703,900 | 32,525,600 | 2 | 160 | 0 | 2,524 | 0.575 | 168,300 | 0 |
| climbRounds 40 | 19 | SW | 18,703,900 | 32,525,600 | 2 | 160 | 0 | 2,524 | 0.575 | 168,300 | 0 |
| climbRounds 48 | 14 | SW | 18,703,900 | 32,525,600 | 2 | 160 | 0 | 2,524 | 0.575 | 168,300 | 0 |
| climbRounds 64 | 13 | SW | 18,703,900 | 32,525,600 | 2 | 160 | 0 | 2,524 | 0.575 | 168,300 | 0 |
| climbRounds 128 | 17 | SW | 18,703,900 | 32,525,600 | 2 | 160 | 0 | 2,524 | 0.575 | 168,300 | 0 |
| climbRounds 256 | 11 | SW | 18,703,900 | 32,525,600 | 2 | 160 | 0 | 2,524 | 0.575 | 168,300 | 0 |
| climbRounds 1,024 | 12 | SW | 18,703,900 | 32,525,600 | 2 | 160 | 0 | 2,524 | 0.575 | 168,300 | 0 |
| retypeExhaustive 10,000 | 22 | SW | 18,703,900 | 32,525,600 | 2 | 160 | 0 | 2,524 | 0.575 | 168,300 | 0 |
| retypeExhaustive 20,000 | 16 | SW | 18,703,900 | 32,525,600 | 2 | 160 | 0 | 2,524 | 0.575 | 168,300 | 0 |
| retypeExhaustive 40,000 | 59 | SW | 18,703,900 | 32,525,600 | 2 | 160 | 0 | 2,524 | 0.575 | 168,300 | 0 |
| retypeClimbSteps 240 | 16 | SW | 18,703,900 | 32,525,600 | 2 | 160 | 0 | 2,524 | 0.575 | 168,300 | 0 |

- climbRounds 24, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 32, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 40, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 48, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 64, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 128, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 256, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 1,024, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 10,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 20,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 40,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeClimbSteps 240, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0

## first-run army, Bear V ×3 (20 000 leadership)

| level | ms | stop | damage | silver | hired burned | gold | dragon coins | queue h | dmg/silver | dmg/hired | rated vs ×1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ×1 | 16 | SW | 18,703,900 | 32,525,600 | 3 | 0 | 0 | 2,524 | 0.575 | 112,200 | — |
| ×1 |  | AI | 19,040,500 | 32,525,600 | 3 | 480 | 0 | 2,524 | 0.585 | 224,400 | — |
| climbRounds 24 | 12 | SW | 18,703,900 | 32,525,600 | 3 | 0 | 0 | 2,524 | 0.575 | 112,200 | 0 |
| climbRounds 24 |  | AI | 19,040,500 | 32,525,600 | 3 | 480 | 0 | 2,524 | 0.585 | 224,400 | 0 |
| climbRounds 32 | 11 | SW | 18,703,900 | 32,525,600 | 3 | 0 | 0 | 2,524 | 0.575 | 112,200 | 0 |
| climbRounds 32 |  | AI | 19,040,500 | 32,525,600 | 3 | 480 | 0 | 2,524 | 0.585 | 224,400 | 0 |
| climbRounds 40 | 10 | SW | 18,703,900 | 32,525,600 | 3 | 0 | 0 | 2,524 | 0.575 | 112,200 | 0 |
| climbRounds 40 |  | AI | 19,040,500 | 32,525,600 | 3 | 480 | 0 | 2,524 | 0.585 | 224,400 | 0 |
| climbRounds 48 | 14 | SW | 18,703,900 | 32,525,600 | 3 | 0 | 0 | 2,524 | 0.575 | 112,200 | 0 |
| climbRounds 48 |  | AI | 19,040,500 | 32,525,600 | 3 | 480 | 0 | 2,524 | 0.585 | 224,400 | 0 |
| climbRounds 64 | 13 | SW | 18,703,900 | 32,525,600 | 3 | 0 | 0 | 2,524 | 0.575 | 112,200 | 0 |
| climbRounds 64 |  | AI | 19,040,500 | 32,525,600 | 3 | 480 | 0 | 2,524 | 0.585 | 224,400 | 0 |
| climbRounds 128 | 12 | SW | 18,703,900 | 32,525,600 | 3 | 0 | 0 | 2,524 | 0.575 | 112,200 | 0 |
| climbRounds 128 |  | AI | 19,040,500 | 32,525,600 | 3 | 480 | 0 | 2,524 | 0.585 | 224,400 | 0 |
| climbRounds 256 | 10 | SW | 18,703,900 | 32,525,600 | 3 | 0 | 0 | 2,524 | 0.575 | 112,200 | 0 |
| climbRounds 256 |  | AI | 19,040,500 | 32,525,600 | 3 | 480 | 0 | 2,524 | 0.585 | 224,400 | 0 |
| climbRounds 1,024 | 12 | SW | 18,703,900 | 32,525,600 | 3 | 0 | 0 | 2,524 | 0.575 | 112,200 | 0 |
| climbRounds 1,024 |  | AI | 19,040,500 | 32,525,600 | 3 | 480 | 0 | 2,524 | 0.585 | 224,400 | 0 |
| retypeExhaustive 10,000 | 9 | SW | 18,703,900 | 32,525,600 | 3 | 0 | 0 | 2,524 | 0.575 | 112,200 | 0 |
| retypeExhaustive 10,000 |  | AI | 19,040,500 | 32,525,600 | 3 | 480 | 0 | 2,524 | 0.585 | 224,400 | 0 |
| retypeExhaustive 20,000 | 10 | SW | 18,703,900 | 32,525,600 | 3 | 0 | 0 | 2,524 | 0.575 | 112,200 | 0 |
| retypeExhaustive 20,000 |  | AI | 19,040,500 | 32,525,600 | 3 | 480 | 0 | 2,524 | 0.585 | 224,400 | 0 |
| retypeExhaustive 40,000 | 10 | SW | 18,703,900 | 32,525,600 | 3 | 0 | 0 | 2,524 | 0.575 | 112,200 | 0 |
| retypeExhaustive 40,000 |  | AI | 19,040,500 | 32,525,600 | 3 | 480 | 0 | 2,524 | 0.585 | 224,400 | 0 |
| retypeClimbSteps 240 | 12 | SW | 18,703,900 | 32,525,600 | 3 | 0 | 0 | 2,524 | 0.575 | 112,200 | 0 |
| retypeClimbSteps 240 |  | AI | 19,040,500 | 32,525,600 | 3 | 480 | 0 | 2,524 | 0.585 | 224,400 | 0 |

- climbRounds 24, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 32, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 40, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 48, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 64, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 128, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 256, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 1,024, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 10,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 20,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 40,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeClimbSteps 240, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0

## first-run army, Bear V ×10 (20 000 leadership)

| level | ms | stop | damage | silver | hired burned | gold | dragon coins | queue h | dmg/silver | dmg/hired | rated vs ×1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ×1 | 27 | SW | 21,060,100 | 32,525,600 | 4 | 3,200 | 0 | 2,524 | 0.647 | 673,200 | — |
| ×1 |  | AI | 21,290,233 | 36,008,300 | 4 | 4,800 | 0 | 3,423 | 0.591 | 776,050 | — |
| climbRounds 24 | 21 | SW | 21,060,100 | 32,525,600 | 4 | 3,200 | 0 | 2,524 | 0.647 | 673,200 | 0 |
| climbRounds 24 |  | AI | 21,290,233 | 36,008,300 | 4 | 4,800 | 0 | 3,423 | 0.591 | 776,050 | 0 |
| climbRounds 32 | 16 | SW | 21,060,100 | 32,525,600 | 4 | 3,200 | 0 | 2,524 | 0.647 | 673,200 | 0 |
| climbRounds 32 |  | AI | 21,290,233 | 36,008,300 | 4 | 4,800 | 0 | 3,423 | 0.591 | 776,050 | 0 |
| climbRounds 40 | 20 | SW | 21,060,100 | 32,525,600 | 4 | 3,200 | 0 | 2,524 | 0.647 | 673,200 | 0 |
| climbRounds 40 |  | AI | 21,290,233 | 36,008,300 | 4 | 4,800 | 0 | 3,423 | 0.591 | 776,050 | 0 |
| climbRounds 48 | 18 | SW | 21,060,100 | 32,525,600 | 4 | 3,200 | 0 | 2,524 | 0.647 | 673,200 | 0 |
| climbRounds 48 |  | AI | 21,290,233 | 36,008,300 | 4 | 4,800 | 0 | 3,423 | 0.591 | 776,050 | 0 |
| climbRounds 64 | 20 | SW | 21,060,100 | 32,525,600 | 4 | 3,200 | 0 | 2,524 | 0.647 | 673,200 | 0 |
| climbRounds 64 |  | AI | 21,290,233 | 36,008,300 | 4 | 4,800 | 0 | 3,423 | 0.591 | 776,050 | 0 |
| climbRounds 128 | 19 | SW | 21,060,100 | 32,525,600 | 4 | 3,200 | 0 | 2,524 | 0.647 | 673,200 | 0 |
| climbRounds 128 |  | AI | 21,290,233 | 36,008,300 | 4 | 4,800 | 0 | 3,423 | 0.591 | 776,050 | 0 |
| climbRounds 256 | 18 | SW | 21,060,100 | 32,525,600 | 4 | 3,200 | 0 | 2,524 | 0.647 | 673,200 | 0 |
| climbRounds 256 |  | AI | 21,290,233 | 36,008,300 | 4 | 4,800 | 0 | 3,423 | 0.591 | 776,050 | 0 |
| climbRounds 1,024 | 17 | SW | 21,060,100 | 32,525,600 | 4 | 3,200 | 0 | 2,524 | 0.647 | 673,200 | 0 |
| climbRounds 1,024 |  | AI | 21,290,233 | 36,008,300 | 4 | 4,800 | 0 | 3,423 | 0.591 | 776,050 | 0 |
| retypeExhaustive 10,000 | 24 | SW | 21,060,100 | 32,525,600 | 4 | 3,200 | 0 | 2,524 | 0.647 | 673,200 | 0 |
| retypeExhaustive 10,000 |  | AI | 21,290,233 | 36,008,300 | 4 | 4,800 | 0 | 3,423 | 0.591 | 776,050 | 0 |
| retypeExhaustive 20,000 | 24 | SW | 21,060,100 | 32,525,600 | 4 | 3,200 | 0 | 2,524 | 0.647 | 673,200 | 0 |
| retypeExhaustive 20,000 |  | AI | 21,290,233 | 36,008,300 | 4 | 4,800 | 0 | 3,423 | 0.591 | 776,050 | 0 |
| retypeExhaustive 40,000 | 49 | SW | 21,060,100 | 32,525,600 | 4 | 3,200 | 0 | 2,524 | 0.647 | 673,200 | 0 |
| retypeExhaustive 40,000 |  | AI | 21,290,233 | 36,008,300 | 4 | 4,800 | 0 | 3,423 | 0.591 | 776,050 | 0 |
| retypeClimbSteps 240 | 18 | SW | 21,060,100 | 32,525,600 | 4 | 3,200 | 0 | 2,524 | 0.647 | 673,200 | 0 |
| retypeClimbSteps 240 |  | AI | 21,290,233 | 36,008,300 | 4 | 4,800 | 0 | 3,423 | 0.591 | 776,050 | 0 |

- climbRounds 24, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 32, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 40, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 48, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 64, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 128, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 256, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 1,024, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 10,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 20,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 40,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeClimbSteps 240, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0

## first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)

| level | ms | stop | damage | silver | hired burned | gold | dragon coins | queue h | dmg/silver | dmg/hired | rated vs ×1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ×1 | 54 | HS | 22,814,644 | 32,525,600 | 11 | 736 | 0 | 2,524 | 0.701 | 404,304 | — |
| ×1 |  | SW | 28,730,044 | 32,525,600 | 24 | 1,728 | 0 | 2,524 | 0.883 | 431,781 | — |
| ×1 |  | MX | 29,982,205 | 32,525,600 | 28 | 1,928 | 0 | 2,524 | 0.922 | 414,818 | — |
| ×1 |  | AI | 30,140,049 | 33,289,200 | 30 | 2,016 | 0 | 2,722 | 0.905 | 405,874 | — |
| climbRounds 24 | 48 | HS | 22,814,644 | 32,525,600 | 11 | 736 | 0 | 2,524 | 0.701 | 404,304 | 0 |
| climbRounds 24 |  | SW | 28,730,044 | 32,525,600 | 24 | 1,728 | 0 | 2,524 | 0.883 | 431,781 | 0 |
| climbRounds 24 |  | MX | 29,982,205 | 32,525,600 | 28 | 1,928 | 0 | 2,524 | 0.922 | 414,818 | 0 |
| climbRounds 24 |  | AI | 30,140,049 | 33,289,200 | 30 | 2,016 | 0 | 2,722 | 0.905 | 405,874 | 0 |
| climbRounds 32 | 43 | HS | 22,814,644 | 32,525,600 | 11 | 736 | 0 | 2,524 | 0.701 | 404,304 | 0 |
| climbRounds 32 |  | SW | 28,730,044 | 32,525,600 | 24 | 1,728 | 0 | 2,524 | 0.883 | 431,781 | 0 |
| climbRounds 32 |  | MX | 29,982,205 | 32,525,600 | 28 | 1,928 | 0 | 2,524 | 0.922 | 414,818 | 0 |
| climbRounds 32 |  | AI | 30,140,049 | 33,289,200 | 30 | 2,016 | 0 | 2,722 | 0.905 | 405,874 | 0 |
| climbRounds 40 | 38 | HS | 22,814,644 | 32,525,600 | 11 | 736 | 0 | 2,524 | 0.701 | 404,304 | 0 |
| climbRounds 40 |  | SW | 28,730,044 | 32,525,600 | 24 | 1,728 | 0 | 2,524 | 0.883 | 431,781 | 0 |
| climbRounds 40 |  | MX | 29,982,205 | 32,525,600 | 28 | 1,928 | 0 | 2,524 | 0.922 | 414,818 | 0 |
| climbRounds 40 |  | AI | 30,140,049 | 33,289,200 | 30 | 2,016 | 0 | 2,722 | 0.905 | 405,874 | 0 |
| climbRounds 48 | 32 | HS | 22,814,644 | 32,525,600 | 11 | 736 | 0 | 2,524 | 0.701 | 404,304 | 0 |
| climbRounds 48 |  | SW | 28,730,044 | 32,525,600 | 24 | 1,728 | 0 | 2,524 | 0.883 | 431,781 | 0 |
| climbRounds 48 |  | MX | 29,982,205 | 32,525,600 | 28 | 1,928 | 0 | 2,524 | 0.922 | 414,818 | 0 |
| climbRounds 48 |  | AI | 30,140,049 | 33,289,200 | 30 | 2,016 | 0 | 2,722 | 0.905 | 405,874 | 0 |
| climbRounds 64 | 36 | HS | 22,814,644 | 32,525,600 | 11 | 736 | 0 | 2,524 | 0.701 | 404,304 | 0 |
| climbRounds 64 |  | SW | 28,730,044 | 32,525,600 | 24 | 1,728 | 0 | 2,524 | 0.883 | 431,781 | 0 |
| climbRounds 64 |  | MX | 29,982,205 | 32,525,600 | 28 | 1,928 | 0 | 2,524 | 0.922 | 414,818 | 0 |
| climbRounds 64 |  | AI | 30,140,049 | 33,289,200 | 30 | 2,016 | 0 | 2,722 | 0.905 | 405,874 | 0 |
| climbRounds 128 | 33 | HS | 22,814,644 | 32,525,600 | 11 | 736 | 0 | 2,524 | 0.701 | 404,304 | 0 |
| climbRounds 128 |  | SW | 28,730,044 | 32,525,600 | 24 | 1,728 | 0 | 2,524 | 0.883 | 431,781 | 0 |
| climbRounds 128 |  | MX | 29,982,205 | 32,525,600 | 28 | 1,928 | 0 | 2,524 | 0.922 | 414,818 | 0 |
| climbRounds 128 |  | AI | 30,140,049 | 33,289,200 | 30 | 2,016 | 0 | 2,722 | 0.905 | 405,874 | 0 |
| climbRounds 256 | 33 | HS | 22,814,644 | 32,525,600 | 11 | 736 | 0 | 2,524 | 0.701 | 404,304 | 0 |
| climbRounds 256 |  | SW | 28,730,044 | 32,525,600 | 24 | 1,728 | 0 | 2,524 | 0.883 | 431,781 | 0 |
| climbRounds 256 |  | MX | 29,982,205 | 32,525,600 | 28 | 1,928 | 0 | 2,524 | 0.922 | 414,818 | 0 |
| climbRounds 256 |  | AI | 30,140,049 | 33,289,200 | 30 | 2,016 | 0 | 2,722 | 0.905 | 405,874 | 0 |
| climbRounds 1,024 | 31 | HS | 22,814,644 | 32,525,600 | 11 | 736 | 0 | 2,524 | 0.701 | 404,304 | 0 |
| climbRounds 1,024 |  | SW | 28,730,044 | 32,525,600 | 24 | 1,728 | 0 | 2,524 | 0.883 | 431,781 | 0 |
| climbRounds 1,024 |  | MX | 29,982,205 | 32,525,600 | 28 | 1,928 | 0 | 2,524 | 0.922 | 414,818 | 0 |
| climbRounds 1,024 |  | AI | 30,140,049 | 33,289,200 | 30 | 2,016 | 0 | 2,722 | 0.905 | 405,874 | 0 |
| retypeExhaustive 10,000 | 57 | HS | 22,814,644 | 32,525,600 | 11 | 736 | 0 | 2,524 | 0.701 | 404,304 | 0 |
| retypeExhaustive 10,000 |  | SW | 28,730,044 | 32,525,600 | 24 | 1,728 | 0 | 2,524 | 0.883 | 431,781 | 0 |
| retypeExhaustive 10,000 |  | MX | 29,982,205 | 32,525,600 | 28 | 1,928 | 0 | 2,524 | 0.922 | 414,818 | 0 |
| retypeExhaustive 10,000 |  | AI | 30,140,049 | 33,289,200 | 30 | 2,016 | 0 | 2,722 | 0.905 | 405,874 | 0 |
| retypeExhaustive 20,000 | 51 | HS | 22,814,644 | 32,525,600 | 11 | 736 | 0 | 2,524 | 0.701 | 404,304 | 0 |
| retypeExhaustive 20,000 |  | SW | 28,730,044 | 32,525,600 | 24 | 1,728 | 0 | 2,524 | 0.883 | 431,781 | 0 |
| retypeExhaustive 20,000 |  | MX | 29,982,205 | 32,525,600 | 28 | 1,928 | 0 | 2,524 | 0.922 | 414,818 | 0 |
| retypeExhaustive 20,000 |  | AI | 30,140,049 | 33,289,200 | 30 | 2,016 | 0 | 2,722 | 0.905 | 405,874 | 0 |
| retypeExhaustive 40,000 | 137 | HS | 22,814,644 | 32,525,600 | 11 | 736 | 0 | 2,524 | 0.701 | 404,304 | 0 |
| retypeExhaustive 40,000 |  | SW | 28,730,044 | 32,525,600 | 24 | 1,728 | 0 | 2,524 | 0.883 | 431,781 | 0 |
| retypeExhaustive 40,000 |  | MX | 29,982,205 | 32,525,600 | 28 | 1,928 | 0 | 2,524 | 0.922 | 414,818 | 0 |
| retypeExhaustive 40,000 |  | AI | 30,140,049 | 33,289,200 | 30 | 2,016 | 0 | 2,722 | 0.905 | 405,874 | 0 |
| retypeClimbSteps 240 | 32 | HS | 22,814,644 | 32,525,600 | 11 | 736 | 0 | 2,524 | 0.701 | 404,304 | 0 |
| retypeClimbSteps 240 |  | SW | 28,730,044 | 32,525,600 | 24 | 1,728 | 0 | 2,524 | 0.883 | 431,781 | 0 |
| retypeClimbSteps 240 |  | MX | 29,982,205 | 32,525,600 | 28 | 1,928 | 0 | 2,524 | 0.922 | 414,818 | 0 |
| retypeClimbSteps 240 |  | AI | 30,140,049 | 33,289,200 | 30 | 2,016 | 0 | 2,722 | 0.905 | 405,874 | 0 |

- climbRounds 24, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 32, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 40, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 48, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 64, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 128, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 256, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 1,024, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 10,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 20,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 40,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeClimbSteps 240, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0

## first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)

| level | ms | stop | damage | silver | hired burned | gold | dragon coins | queue h | dmg/silver | dmg/hired | rated vs ×1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ×1 | 576 | HS | 81,548,470 | 34,920,400 | 15 | 11,072 | 24,120 | 2,863 | 2.335 | 541,060 | — |
| ×1 |  | SW | 89,486,680 | 35,230,000 | 24 | 9,424 | 28,200 | 2,913 | 2.540 | 476,719 | — |
| ×1 |  | MM | 93,588,286 | 35,230,000 | 26 | 10,272 | 28,200 | 2,913 | 2.656 | 597,802 | — |
| ×1 |  | MX | 97,759,924 | 36,432,700 | 32 | 14,232 | 28,200 | 3,215 | 2.683 | 543,725 | — |
| ×1 |  | AI | 103,197,710 | 37,309,700 | 34 | 17,888 | 27,040 | 3,444 | 2.766 | 594,278 | — |
| climbRounds 24 | 552 | HS | 81,548,470 | 34,920,400 | 15 | 11,072 | 24,120 | 2,863 | 2.335 | 541,060 | 0 |
| climbRounds 24 |  | SW | 89,486,680 | 35,230,000 | 24 | 9,424 | 28,200 | 2,913 | 2.540 | 476,719 | 0 |
| climbRounds 24 |  | MM | 93,588,286 | 35,230,000 | 26 | 10,272 | 28,200 | 2,913 | 2.656 | 597,802 | 0 |
| climbRounds 24 |  | MX | 97,759,924 | 36,432,700 | 32 | 14,232 | 28,200 | 3,215 | 2.683 | 543,725 | 0 |
| climbRounds 24 |  | AI | 103,197,710 | 37,309,700 | 34 | 17,888 | 27,040 | 3,444 | 2.766 | 594,278 | 0 |
| climbRounds 32 | 607 | HS | 81,548,470 | 34,920,400 | 15 | 11,072 | 24,120 | 2,863 | 2.335 | 541,060 | 0 |
| climbRounds 32 |  | SW | 89,486,680 | 35,230,000 | 24 | 9,424 | 28,200 | 2,913 | 2.540 | 476,719 | 0 |
| climbRounds 32 |  | MM | 93,588,286 | 35,230,000 | 26 | 10,272 | 28,200 | 2,913 | 2.656 | 597,802 | 0 |
| climbRounds 32 |  | MX | 97,759,924 | 36,432,700 | 32 | 14,232 | 28,200 | 3,215 | 2.683 | 543,725 | 0 |
| climbRounds 32 |  | AI | 103,197,710 | 37,309,700 | 34 | 17,888 | 27,040 | 3,444 | 2.766 | 594,278 | 0 |
| climbRounds 40 | 705 | HS | 81,548,470 | 34,920,400 | 15 | 11,072 | 24,120 | 2,863 | 2.335 | 541,060 | 0 |
| climbRounds 40 |  | SW | 89,486,680 | 35,230,000 | 24 | 9,424 | 28,200 | 2,913 | 2.540 | 476,719 | 0 |
| climbRounds 40 |  | MM | 93,588,286 | 35,230,000 | 26 | 10,272 | 28,200 | 2,913 | 2.656 | 597,802 | 0 |
| climbRounds 40 |  | MX | 97,759,924 | 36,432,700 | 32 | 14,232 | 28,200 | 3,215 | 2.683 | 543,725 | 0 |
| climbRounds 40 |  | AI | 103,197,710 | 37,309,700 | 34 | 17,888 | 27,040 | 3,444 | 2.766 | 594,278 | 0 |
| climbRounds 48 | 673 | HS | 81,548,470 | 34,920,400 | 15 | 11,072 | 24,120 | 2,863 | 2.335 | 541,060 | 0 |
| climbRounds 48 |  | SW | 89,486,680 | 35,230,000 | 24 | 9,424 | 28,200 | 2,913 | 2.540 | 476,719 | 0 |
| climbRounds 48 |  | MM | 93,588,286 | 35,230,000 | 26 | 10,272 | 28,200 | 2,913 | 2.656 | 597,802 | 0 |
| climbRounds 48 |  | MX | 97,759,924 | 36,432,700 | 32 | 14,232 | 28,200 | 3,215 | 2.683 | 543,725 | 0 |
| climbRounds 48 |  | AI | 103,197,710 | 37,309,700 | 34 | 17,888 | 27,040 | 3,444 | 2.766 | 594,278 | 0 |
| climbRounds 64 | 817 | HS | 81,548,470 | 34,920,400 | 15 | 11,072 | 24,120 | 2,863 | 2.335 | 541,060 | 0 |
| climbRounds 64 |  | SW | 89,486,680 | 35,230,000 | 24 | 9,424 | 28,200 | 2,913 | 2.540 | 476,719 | 0 |
| climbRounds 64 |  | MM | 93,588,286 | 35,230,000 | 26 | 10,272 | 28,200 | 2,913 | 2.656 | 597,802 | 0 |
| climbRounds 64 |  | MX | 97,759,924 | 36,432,700 | 32 | 14,232 | 28,200 | 3,215 | 2.683 | 543,725 | 0 |
| climbRounds 64 |  | AI | 103,197,710 | 37,309,700 | 34 | 17,888 | 27,040 | 3,444 | 2.766 | 594,278 | 0 |
| climbRounds 128 | 1,285 | HS | 81,548,470 | 34,920,400 | 15 | 11,072 | 24,120 | 2,863 | 2.335 | 541,060 | 0 |
| climbRounds 128 |  | SW | 89,486,680 | 35,230,000 | 24 | 9,424 | 28,200 | 2,913 | 2.540 | 476,719 | 0 |
| climbRounds 128 |  | MM | 93,588,286 | 35,230,000 | 26 | 10,272 | 28,200 | 2,913 | 2.656 | 597,802 | 0 |
| climbRounds 128 |  | MX | 97,759,924 | 36,432,700 | 32 | 14,232 | 28,200 | 3,215 | 2.683 | 543,725 | 0 |
| climbRounds 128 |  | AI | 103,197,710 | 37,309,700 | 34 | 17,888 | 27,040 | 3,444 | 2.766 | 594,278 | 0 |
| climbRounds 256 | 1,902 | HS | **54,821,068** (−32.77 %) | **22,752,400** (−34.84 %) | **12** (−20.00 %) | **1,664** (−84.97 %) | **31,680** (+31.34 %) | 2,073 | 2.409 | 410,630 | −8.040 |
| climbRounds 256 |  | SW | **66,482,161** (−25.71 %) | **25,926,700** (−26.41 %) | 24 | **3,232** (−65.70 %) | **31,680** (+12.34 %) | 2,293 | 2.564 | 476,719 | −8.295 |
| climbRounds 256 |  | MX | **96,110,509** (−1.69 %) | **35,525,200** (−2.49 %) | 32 | **12,264** (−13.83 %) | **32,040** (+13.62 %) | 2,960 | 2.705 | 543,725 | +0.073 |
| climbRounds 256 |  | AI | **83,134,933** (−19.44 %) | **35,449,600** (−4.99 %) | **33** (−2.94 %) | **5,472** (−69.41 %) | **31,680** (+17.16 %) | 2,951 | 2.345 | 425,201 | −5.761 |
| climbRounds 1,024 | 8,143 | HS | **54,821,068** (−32.77 %) | **22,752,400** (−34.84 %) | **12** (−20.00 %) | **1,664** (−84.97 %) | **31,680** (+31.34 %) | 2,073 | 2.409 | 410,630 | −8.040 |
| climbRounds 1,024 |  | SW | **66,482,161** (−25.71 %) | **25,926,700** (−26.41 %) | 24 | **3,232** (−65.70 %) | **31,680** (+12.34 %) | 2,293 | 2.564 | 476,719 | −8.295 |
| climbRounds 1,024 |  | MX | **96,110,509** (−1.69 %) | **35,525,200** (−2.49 %) | 32 | **12,264** (−13.83 %) | **32,040** (+13.62 %) | 2,960 | 2.705 | 543,725 | +0.073 |
| climbRounds 1,024 |  | AI | **83,134,933** (−19.44 %) | **35,449,600** (−4.99 %) | **33** (−2.94 %) | **5,472** (−69.41 %) | **31,680** (+17.16 %) | 2,951 | 2.345 | 425,201 | −5.761 |
| retypeExhaustive 10,000 | 561 | HS | 81,548,470 | 34,920,400 | 15 | 11,072 | 24,120 | 2,863 | 2.335 | 541,060 | 0 |
| retypeExhaustive 10,000 |  | SW | 89,486,680 | 35,230,000 | 24 | 9,424 | 28,200 | 2,913 | 2.540 | 476,719 | 0 |
| retypeExhaustive 10,000 |  | MM | 93,588,286 | 35,230,000 | 26 | 10,272 | 28,200 | 2,913 | 2.656 | 597,802 | 0 |
| retypeExhaustive 10,000 |  | MX | 97,759,924 | 36,432,700 | 32 | 14,232 | 28,200 | 3,215 | 2.683 | 543,725 | 0 |
| retypeExhaustive 10,000 |  | AI | 103,197,710 | 37,309,700 | 34 | 17,888 | 27,040 | 3,444 | 2.766 | 594,278 | 0 |
| retypeExhaustive 20,000 | 530 | HS | 81,548,470 | 34,920,400 | 15 | 11,072 | 24,120 | 2,863 | 2.335 | 541,060 | 0 |
| retypeExhaustive 20,000 |  | SW | 89,486,680 | 35,230,000 | 24 | 9,424 | 28,200 | 2,913 | 2.540 | 476,719 | 0 |
| retypeExhaustive 20,000 |  | MM | 93,588,286 | 35,230,000 | 26 | 10,272 | 28,200 | 2,913 | 2.656 | 597,802 | 0 |
| retypeExhaustive 20,000 |  | MX | 97,759,924 | 36,432,700 | 32 | 14,232 | 28,200 | 3,215 | 2.683 | 543,725 | 0 |
| retypeExhaustive 20,000 |  | AI | 103,197,710 | 37,309,700 | 34 | 17,888 | 27,040 | 3,444 | 2.766 | 594,278 | 0 |
| retypeExhaustive 40,000 | 526 | HS | 81,548,470 | 34,920,400 | 15 | 11,072 | 24,120 | 2,863 | 2.335 | 541,060 | 0 |
| retypeExhaustive 40,000 |  | SW | 89,486,680 | 35,230,000 | 24 | 9,424 | 28,200 | 2,913 | 2.540 | 476,719 | 0 |
| retypeExhaustive 40,000 |  | MM | 93,588,286 | 35,230,000 | 26 | 10,272 | 28,200 | 2,913 | 2.656 | 597,802 | 0 |
| retypeExhaustive 40,000 |  | MX | 97,759,924 | 36,432,700 | 32 | 14,232 | 28,200 | 3,215 | 2.683 | 543,725 | 0 |
| retypeExhaustive 40,000 |  | AI | 103,197,710 | 37,309,700 | 34 | 17,888 | 27,040 | 3,444 | 2.766 | 594,278 | 0 |
| retypeClimbSteps 240 | 533 | HS | 81,548,470 | 34,920,400 | 15 | 11,072 | 24,120 | 2,863 | 2.335 | 541,060 | 0 |
| retypeClimbSteps 240 |  | SW | 89,486,680 | 35,230,000 | 24 | 9,424 | 28,200 | 2,913 | 2.540 | 476,719 | 0 |
| retypeClimbSteps 240 |  | MM | 93,588,286 | 35,230,000 | 26 | 10,272 | 28,200 | 2,913 | 2.656 | 597,802 | 0 |
| retypeClimbSteps 240 |  | MX | 97,759,924 | 36,432,700 | 32 | 14,232 | 28,200 | 3,215 | 2.683 | 543,725 | 0 |
| retypeClimbSteps 240 |  | AI | 103,197,710 | 37,309,700 | 34 | 17,888 | 27,040 | 3,444 | 2.766 | 594,278 | 0 |

- climbRounds 24, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 32, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 40, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 48, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 64, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 128, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 256, the bar's best against ×1's: most damage **−6.87 %** · least silver **+34.84 %** · fewest hired **+20.00 %** · dmg/silver **−2.19 %** · dmg/hired **−9.05 %**
- climbRounds 1,024, the bar's best against ×1's: most damage **−6.87 %** · least silver **+34.84 %** · fewest hired **+20.00 %** · dmg/silver **−2.19 %** · dmg/hired **−9.05 %**
- retypeExhaustive 10,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 20,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 40,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeClimbSteps 240, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0

## the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

| level | ms | stop | damage | silver | hired burned | gold | dragon coins | queue h | dmg/silver | dmg/hired | rated vs ×1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ×1 | 141 | SS | 5,268,771 | 3,803,700 | 19 | 736 | 0 | 235 | 1.385 | 189,918 | — |
| ×1 |  | SW | 8,530,502 | 6,087,200 | 21 | 1,176 | 0 | 381 | 1.401 | 265,255 | — |
| ×1 |  | AI | 8,985,057 | 6,085,400 | 24 | 1,336 | 0 | 381 | 1.476 | 261,725 | — |
| climbRounds 24 | 102 | SS | 5,268,771 | 3,803,700 | 19 | 736 | 0 | 235 | 1.385 | 189,918 | 0 |
| climbRounds 24 |  | SW | 8,530,502 | 6,087,200 | 21 | 1,176 | 0 | 381 | 1.401 | 265,255 | 0 |
| climbRounds 24 |  | AI | 8,985,057 | 6,085,400 | 24 | 1,336 | 0 | 381 | 1.476 | 261,725 | 0 |
| climbRounds 32 | 102 | SS | 5,268,771 | 3,803,700 | 19 | 736 | 0 | 235 | 1.385 | 189,918 | 0 |
| climbRounds 32 |  | SW | 8,530,502 | 6,087,200 | 21 | 1,176 | 0 | 381 | 1.401 | 265,255 | 0 |
| climbRounds 32 |  | AI | 8,985,057 | 6,085,400 | 24 | 1,336 | 0 | 381 | 1.476 | 261,725 | 0 |
| climbRounds 40 | 95 | SS | 5,268,771 | 3,803,700 | 19 | 736 | 0 | 235 | 1.385 | 189,918 | 0 |
| climbRounds 40 |  | SW | 8,530,502 | 6,087,200 | 21 | 1,176 | 0 | 381 | 1.401 | 265,255 | 0 |
| climbRounds 40 |  | AI | 8,985,057 | 6,085,400 | 24 | 1,336 | 0 | 381 | 1.476 | 261,725 | 0 |
| climbRounds 48 | 96 | SS | 5,268,771 | 3,803,700 | 19 | 736 | 0 | 235 | 1.385 | 189,918 | 0 |
| climbRounds 48 |  | SW | 8,530,502 | 6,087,200 | 21 | 1,176 | 0 | 381 | 1.401 | 265,255 | 0 |
| climbRounds 48 |  | AI | 8,985,057 | 6,085,400 | 24 | 1,336 | 0 | 381 | 1.476 | 261,725 | 0 |
| climbRounds 64 | 91 | SS | 5,268,771 | 3,803,700 | 19 | 736 | 0 | 235 | 1.385 | 189,918 | 0 |
| climbRounds 64 |  | SW | 8,530,502 | 6,087,200 | 21 | 1,176 | 0 | 381 | 1.401 | 265,255 | 0 |
| climbRounds 64 |  | AI | 8,985,057 | 6,085,400 | 24 | 1,336 | 0 | 381 | 1.476 | 261,725 | 0 |
| climbRounds 128 | 93 | SS | 5,268,771 | 3,803,700 | 19 | 736 | 0 | 235 | 1.385 | 189,918 | 0 |
| climbRounds 128 |  | SW | 8,530,502 | 6,087,200 | 21 | 1,176 | 0 | 381 | 1.401 | 265,255 | 0 |
| climbRounds 128 |  | AI | 8,985,057 | 6,085,400 | 24 | 1,336 | 0 | 381 | 1.476 | 261,725 | 0 |
| climbRounds 256 | 89 | SS | 5,268,771 | 3,803,700 | 19 | 736 | 0 | 235 | 1.385 | 189,918 | 0 |
| climbRounds 256 |  | SW | 8,530,502 | 6,087,200 | 21 | 1,176 | 0 | 381 | 1.401 | 265,255 | 0 |
| climbRounds 256 |  | AI | 8,985,057 | 6,085,400 | 24 | 1,336 | 0 | 381 | 1.476 | 261,725 | 0 |
| climbRounds 1,024 | 92 | SS | 5,268,771 | 3,803,700 | 19 | 736 | 0 | 235 | 1.385 | 189,918 | 0 |
| climbRounds 1,024 |  | SW | 8,530,502 | 6,087,200 | 21 | 1,176 | 0 | 381 | 1.401 | 265,255 | 0 |
| climbRounds 1,024 |  | AI | 8,985,057 | 6,085,400 | 24 | 1,336 | 0 | 381 | 1.476 | 261,725 | 0 |
| retypeExhaustive 10,000 | 119 | SS | 5,268,771 | 3,803,700 | 19 | 736 | 0 | 235 | 1.385 | 189,918 | 0 |
| retypeExhaustive 10,000 |  | SW | 8,530,502 | 6,087,200 | 21 | 1,176 | 0 | 381 | 1.401 | 265,255 | 0 |
| retypeExhaustive 10,000 |  | AI | 8,985,057 | 6,085,400 | 24 | 1,336 | 0 | 381 | 1.476 | 261,725 | 0 |
| retypeExhaustive 20,000 | 113 | SS | 5,268,771 | 3,803,700 | 19 | 736 | 0 | 235 | 1.385 | 189,918 | 0 |
| retypeExhaustive 20,000 |  | SW | 8,530,502 | 6,087,200 | 21 | 1,176 | 0 | 381 | 1.401 | 265,255 | 0 |
| retypeExhaustive 20,000 |  | AI | 8,985,057 | 6,085,400 | 24 | 1,336 | 0 | 381 | 1.476 | 261,725 | 0 |
| retypeExhaustive 40,000 | 284 | SS | 5,268,771 | 3,803,700 | 19 | 736 | 0 | 235 | 1.385 | 189,918 | 0 |
| retypeExhaustive 40,000 |  | SW | 8,530,502 | 6,087,200 | 21 | 1,176 | 0 | 381 | 1.401 | 265,255 | 0 |
| retypeExhaustive 40,000 |  | AI | 8,985,057 | 6,085,400 | 24 | 1,336 | 0 | 381 | 1.476 | 261,725 | 0 |
| retypeClimbSteps 240 | 99 | SS | 5,268,771 | 3,803,700 | 19 | 736 | 0 | 235 | 1.385 | 189,918 | 0 |
| retypeClimbSteps 240 |  | SW | 8,530,502 | 6,087,200 | 21 | 1,176 | 0 | 381 | 1.401 | 265,255 | 0 |
| retypeClimbSteps 240 |  | AI | 8,985,057 | 6,085,400 | 24 | 1,336 | 0 | 381 | 1.476 | 261,725 | 0 |

- climbRounds 24, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 32, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 40, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 48, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 64, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 128, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 256, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 1,024, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 10,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 20,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 40,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeClimbSteps 240, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0

## 2026-09-17 export, its setup (7 000 leadership)

| level | ms | stop | damage | silver | hired burned | gold | dragon coins | queue h | dmg/silver | dmg/hired | rated vs ×1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ×1 | 229 | HS | 15,427,347 | 10,155,600 | 26 | 2,064 | 0 | 680 | 1.519 | 354,012 | — |
| ×1 |  | SS | 16,259,746 | 8,670,400 | 32 | 2,496 | 0 | 577 | 1.875 | 349,573 | — |
| ×1 |  | SW | 19,031,865 | 10,907,600 | 35 | 2,760 | 0 | 731 | 1.745 | 357,360 | — |
| ×1 |  | MX | 24,300,665 | 10,959,000 | 55 | 4,000 | 0 | 740 | 2.217 | 340,059 | — |
| ×1 |  | AI | 24,945,884 | 12,717,200 | 73 | 5,360 | 0 | 1,213 | 1.962 | 253,556 | — |
| climbRounds 24 | 161 | HS | 15,427,347 | 10,155,600 | 26 | 2,064 | 0 | 680 | 1.519 | 354,012 | 0 |
| climbRounds 24 |  | SS | 16,259,746 | 8,670,400 | 32 | 2,496 | 0 | 577 | 1.875 | 349,573 | 0 |
| climbRounds 24 |  | SW | 19,031,865 | 10,907,600 | 35 | 2,760 | 0 | 731 | 1.745 | 357,360 | 0 |
| climbRounds 24 |  | MX | 24,300,665 | 10,959,000 | 55 | 4,000 | 0 | 740 | 2.217 | 340,059 | 0 |
| climbRounds 24 |  | AI | 24,945,884 | 12,717,200 | 73 | 5,360 | 0 | 1,213 | 1.962 | 253,556 | 0 |
| climbRounds 32 | 168 | HS | 15,427,347 | 10,155,600 | 26 | 2,064 | 0 | 680 | 1.519 | 354,012 | 0 |
| climbRounds 32 |  | SS | 16,259,746 | 8,670,400 | 32 | 2,496 | 0 | 577 | 1.875 | 349,573 | 0 |
| climbRounds 32 |  | SW | 19,031,865 | 10,907,600 | 35 | 2,760 | 0 | 731 | 1.745 | 357,360 | 0 |
| climbRounds 32 |  | MX | 24,300,665 | 10,959,000 | 55 | 4,000 | 0 | 740 | 2.217 | 340,059 | 0 |
| climbRounds 32 |  | AI | 24,945,884 | 12,717,200 | 73 | 5,360 | 0 | 1,213 | 1.962 | 253,556 | 0 |
| climbRounds 40 | 166 | HS | 15,427,347 | 10,155,600 | 26 | 2,064 | 0 | 680 | 1.519 | 354,012 | 0 |
| climbRounds 40 |  | SS | 16,259,746 | 8,670,400 | 32 | 2,496 | 0 | 577 | 1.875 | 349,573 | 0 |
| climbRounds 40 |  | SW | 19,031,865 | 10,907,600 | 35 | 2,760 | 0 | 731 | 1.745 | 357,360 | 0 |
| climbRounds 40 |  | MX | 24,300,665 | 10,959,000 | 55 | 4,000 | 0 | 740 | 2.217 | 340,059 | 0 |
| climbRounds 40 |  | AI | 24,945,884 | 12,717,200 | 73 | 5,360 | 0 | 1,213 | 1.962 | 253,556 | 0 |
| climbRounds 48 | 174 | HS | 15,427,347 | 10,155,600 | 26 | 2,064 | 0 | 680 | 1.519 | 354,012 | 0 |
| climbRounds 48 |  | SS | 16,259,746 | 8,670,400 | 32 | 2,496 | 0 | 577 | 1.875 | 349,573 | 0 |
| climbRounds 48 |  | SW | 19,031,865 | 10,907,600 | 35 | 2,760 | 0 | 731 | 1.745 | 357,360 | 0 |
| climbRounds 48 |  | MX | 24,300,665 | 10,959,000 | 55 | 4,000 | 0 | 740 | 2.217 | 340,059 | 0 |
| climbRounds 48 |  | AI | 24,945,884 | 12,717,200 | 73 | 5,360 | 0 | 1,213 | 1.962 | 253,556 | 0 |
| climbRounds 64 | 244 | HS | 15,427,347 | 10,155,600 | 26 | 2,064 | 0 | 680 | 1.519 | 354,012 | 0 |
| climbRounds 64 |  | SS | 16,259,746 | 8,670,400 | 32 | 2,496 | 0 | 577 | 1.875 | 349,573 | 0 |
| climbRounds 64 |  | SW | 19,031,865 | 10,907,600 | 35 | 2,760 | 0 | 731 | 1.745 | 357,360 | 0 |
| climbRounds 64 |  | MX | 24,300,665 | 10,959,000 | 55 | 4,000 | 0 | 740 | 2.217 | 340,059 | 0 |
| climbRounds 64 |  | AI | 24,945,884 | 12,717,200 | 73 | 5,360 | 0 | 1,213 | 1.962 | 253,556 | 0 |
| climbRounds 128 | 243 | HS | 15,427,347 | 10,155,600 | 26 | 2,064 | 0 | 680 | 1.519 | 354,012 | 0 |
| climbRounds 128 |  | SS | 16,259,746 | 8,670,400 | 32 | 2,496 | 0 | 577 | 1.875 | 349,573 | 0 |
| climbRounds 128 |  | SW | 19,031,865 | 10,907,600 | 35 | 2,760 | 0 | 731 | 1.745 | 357,360 | 0 |
| climbRounds 128 |  | MX | 24,300,665 | 10,959,000 | 55 | 4,000 | 0 | 740 | 2.217 | 340,059 | 0 |
| climbRounds 128 |  | AI | 24,945,884 | 12,717,200 | 73 | 5,360 | 0 | 1,213 | 1.962 | 253,556 | 0 |
| climbRounds 256 | 347 | HS | 15,427,347 | 10,155,600 | 26 | 2,064 | 0 | 680 | 1.519 | 354,012 | 0 |
| climbRounds 256 |  | SS | 16,259,746 | 8,670,400 | 32 | 2,496 | 0 | 577 | 1.875 | 349,573 | 0 |
| climbRounds 256 |  | SW | 19,031,865 | 10,907,600 | 35 | 2,760 | 0 | 731 | 1.745 | 357,360 | 0 |
| climbRounds 256 |  | MX | 24,300,665 | 10,959,000 | 55 | 4,000 | 0 | 740 | 2.217 | 340,059 | 0 |
| climbRounds 256 |  | AI | 24,945,884 | 12,717,200 | 73 | 5,360 | 0 | 1,213 | 1.962 | 253,556 | 0 |
| climbRounds 1,024 | 461 | HS | 15,427,347 | 10,155,600 | 26 | 2,064 | 0 | 680 | 1.519 | 354,012 | 0 |
| climbRounds 1,024 |  | SS | 16,259,746 | 8,670,400 | 32 | 2,496 | 0 | 577 | 1.875 | 349,573 | 0 |
| climbRounds 1,024 |  | SW | 19,031,865 | 10,907,600 | 35 | 2,760 | 0 | 731 | 1.745 | 357,360 | 0 |
| climbRounds 1,024 |  | MX | 24,300,665 | 10,959,000 | 55 | 4,000 | 0 | 740 | 2.217 | 340,059 | 0 |
| climbRounds 1,024 |  | AI | 24,945,884 | 12,717,200 | 73 | 5,360 | 0 | 1,213 | 1.962 | 253,556 | 0 |
| retypeExhaustive 10,000 | 470 | HS | 15,427,347 | 10,155,600 | 26 | 2,064 | 0 | 680 | 1.519 | 354,012 | 0 |
| retypeExhaustive 10,000 |  | SS | 16,259,746 | 8,670,400 | 32 | 2,496 | 0 | 577 | 1.875 | 349,573 | 0 |
| retypeExhaustive 10,000 |  | SW | 19,031,865 | 10,907,600 | 35 | 2,760 | 0 | 731 | 1.745 | 357,360 | 0 |
| retypeExhaustive 10,000 |  | MX | **24,300,698** (+0.00 %) | **10,958,900** (−0.00 %) | 55 | 4,000 | 0 | 740 | 2.217 | 340,059 | +0.000 |
| retypeExhaustive 10,000 |  | AI | 24,945,884 | 12,717,200 | 73 | 5,360 | 0 | 1,213 | 1.962 | 253,556 | 0 |
| retypeExhaustive 20,000 | 390 | HS | 15,427,347 | 10,155,600 | 26 | 2,064 | 0 | 680 | 1.519 | 354,012 | 0 |
| retypeExhaustive 20,000 |  | SS | 16,259,746 | 8,670,400 | 32 | 2,496 | 0 | 577 | 1.875 | 349,573 | 0 |
| retypeExhaustive 20,000 |  | SW | 19,031,865 | 10,907,600 | 35 | 2,760 | 0 | 731 | 1.745 | 357,360 | 0 |
| retypeExhaustive 20,000 |  | MX | **24,300,698** (+0.00 %) | **10,958,900** (−0.00 %) | 55 | 4,000 | 0 | 740 | 2.217 | 340,059 | +0.000 |
| retypeExhaustive 20,000 |  | AI | 24,945,884 | 12,717,200 | 73 | 5,360 | 0 | 1,213 | 1.962 | 253,556 | 0 |
| retypeExhaustive 40,000 | 402 | HS | 15,427,347 | 10,155,600 | 26 | 2,064 | 0 | 680 | 1.519 | 354,012 | 0 |
| retypeExhaustive 40,000 |  | SS | 16,259,746 | 8,670,400 | 32 | 2,496 | 0 | 577 | 1.875 | 349,573 | 0 |
| retypeExhaustive 40,000 |  | SW | 19,031,865 | 10,907,600 | 35 | 2,760 | 0 | 731 | 1.745 | 357,360 | 0 |
| retypeExhaustive 40,000 |  | MX | **24,300,698** (+0.00 %) | **10,958,900** (−0.00 %) | 55 | 4,000 | 0 | 740 | 2.217 | 340,059 | +0.000 |
| retypeExhaustive 40,000 |  | AI | 24,945,884 | 12,717,200 | 73 | 5,360 | 0 | 1,213 | 1.962 | 253,556 | 0 |
| retypeClimbSteps 240 | 148 | HS | 15,427,347 | 10,155,600 | 26 | 2,064 | 0 | 680 | 1.519 | 354,012 | 0 |
| retypeClimbSteps 240 |  | SS | 16,259,746 | 8,670,400 | 32 | 2,496 | 0 | 577 | 1.875 | 349,573 | 0 |
| retypeClimbSteps 240 |  | SW | 19,031,865 | 10,907,600 | 35 | 2,760 | 0 | 731 | 1.745 | 357,360 | 0 |
| retypeClimbSteps 240 |  | MX | 24,300,665 | 10,959,000 | 55 | 4,000 | 0 | 740 | 2.217 | 340,059 | 0 |
| retypeClimbSteps 240 |  | AI | 24,945,884 | 12,717,200 | 73 | 5,360 | 0 | 1,213 | 1.962 | 253,556 | 0 |

- climbRounds 24, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 32, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 40, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 48, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 64, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 128, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 256, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 1,024, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 10,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver **+0.00 %** · dmg/hired 0
- retypeExhaustive 20,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver **+0.00 %** · dmg/hired 0
- retypeExhaustive 40,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver **+0.00 %** · dmg/hired 0
- retypeClimbSteps 240, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0

## 2026-09-17 export, 12 000 leadership

| level | ms | stop | damage | silver | hired burned | gold | dragon coins | queue h | dmg/silver | dmg/hired | rated vs ×1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ×1 | 159 | HS | 22,404,202 | 17,808,900 | 30 | 2,408 | 0 | 1,195 | 1.258 | 369,197 | — |
| ×1 |  | SS | 21,759,602 | 12,071,500 | 48 | 3,016 | 0 | 807 | 1.803 | 293,994 | — |
| ×1 |  | SW | 34,445,770 | 18,793,200 | 67 | 4,824 | 0 | 1,269 | 1.833 | 333,911 | — |
| ×1 |  | MX | 34,617,571 | 20,720,700 | 82 | 5,784 | 0 | 1,811 | 1.671 | 290,661 | — |
| climbRounds 24 | 161 | HS | 22,404,202 | 17,808,900 | 30 | 2,408 | 0 | 1,195 | 1.258 | 369,197 | 0 |
| climbRounds 24 |  | SS | 21,759,602 | 12,071,500 | 48 | 3,016 | 0 | 807 | 1.803 | 293,994 | 0 |
| climbRounds 24 |  | SW | 34,445,770 | 18,793,200 | 67 | 4,824 | 0 | 1,269 | 1.833 | 333,911 | 0 |
| climbRounds 24 |  | MX | 34,617,571 | 20,720,700 | 82 | 5,784 | 0 | 1,811 | 1.671 | 290,661 | 0 |
| climbRounds 32 | 162 | HS | 22,404,202 | 17,808,900 | 30 | 2,408 | 0 | 1,195 | 1.258 | 369,197 | 0 |
| climbRounds 32 |  | SS | 21,759,602 | 12,071,500 | 48 | 3,016 | 0 | 807 | 1.803 | 293,994 | 0 |
| climbRounds 32 |  | SW | 34,445,770 | 18,793,200 | 67 | 4,824 | 0 | 1,269 | 1.833 | 333,911 | 0 |
| climbRounds 32 |  | MX | 34,617,571 | 20,720,700 | 82 | 5,784 | 0 | 1,811 | 1.671 | 290,661 | 0 |
| climbRounds 40 | 159 | HS | 22,404,202 | 17,808,900 | 30 | 2,408 | 0 | 1,195 | 1.258 | 369,197 | 0 |
| climbRounds 40 |  | SS | 21,759,602 | 12,071,500 | 48 | 3,016 | 0 | 807 | 1.803 | 293,994 | 0 |
| climbRounds 40 |  | SW | 34,445,770 | 18,793,200 | 67 | 4,824 | 0 | 1,269 | 1.833 | 333,911 | 0 |
| climbRounds 40 |  | MX | 34,617,571 | 20,720,700 | 82 | 5,784 | 0 | 1,811 | 1.671 | 290,661 | 0 |
| climbRounds 48 | 161 | HS | 22,404,202 | 17,808,900 | 30 | 2,408 | 0 | 1,195 | 1.258 | 369,197 | 0 |
| climbRounds 48 |  | SS | 21,759,602 | 12,071,500 | 48 | 3,016 | 0 | 807 | 1.803 | 293,994 | 0 |
| climbRounds 48 |  | SW | 34,445,770 | 18,793,200 | 67 | 4,824 | 0 | 1,269 | 1.833 | 333,911 | 0 |
| climbRounds 48 |  | MX | 34,617,571 | 20,720,700 | 82 | 5,784 | 0 | 1,811 | 1.671 | 290,661 | 0 |
| climbRounds 64 | 181 | HS | 22,404,202 | 17,808,900 | 30 | 2,408 | 0 | 1,195 | 1.258 | 369,197 | 0 |
| climbRounds 64 |  | SS | 21,759,602 | 12,071,500 | 48 | 3,016 | 0 | 807 | 1.803 | 293,994 | 0 |
| climbRounds 64 |  | SW | 34,445,770 | 18,793,200 | 67 | 4,824 | 0 | 1,269 | 1.833 | 333,911 | 0 |
| climbRounds 64 |  | MX | 34,617,571 | 20,720,700 | 82 | 5,784 | 0 | 1,811 | 1.671 | 290,661 | 0 |
| climbRounds 128 | 167 | HS | 22,404,202 | 17,808,900 | 30 | 2,408 | 0 | 1,195 | 1.258 | 369,197 | 0 |
| climbRounds 128 |  | SS | 21,759,602 | 12,071,500 | 48 | 3,016 | 0 | 807 | 1.803 | 293,994 | 0 |
| climbRounds 128 |  | SW | 34,445,770 | 18,793,200 | 67 | 4,824 | 0 | 1,269 | 1.833 | 333,911 | 0 |
| climbRounds 128 |  | MX | 34,617,571 | 20,720,700 | 82 | 5,784 | 0 | 1,811 | 1.671 | 290,661 | 0 |
| climbRounds 256 | 160 | HS | 22,404,202 | 17,808,900 | 30 | 2,408 | 0 | 1,195 | 1.258 | 369,197 | 0 |
| climbRounds 256 |  | SS | 21,759,602 | 12,071,500 | 48 | 3,016 | 0 | 807 | 1.803 | 293,994 | 0 |
| climbRounds 256 |  | SW | 34,445,770 | 18,793,200 | 67 | 4,824 | 0 | 1,269 | 1.833 | 333,911 | 0 |
| climbRounds 256 |  | MX | 34,617,571 | 20,720,700 | 82 | 5,784 | 0 | 1,811 | 1.671 | 290,661 | 0 |
| climbRounds 1,024 | 161 | HS | 22,404,202 | 17,808,900 | 30 | 2,408 | 0 | 1,195 | 1.258 | 369,197 | 0 |
| climbRounds 1,024 |  | SS | 21,759,602 | 12,071,500 | 48 | 3,016 | 0 | 807 | 1.803 | 293,994 | 0 |
| climbRounds 1,024 |  | SW | 34,445,770 | 18,793,200 | 67 | 4,824 | 0 | 1,269 | 1.833 | 333,911 | 0 |
| climbRounds 1,024 |  | MX | 34,617,571 | 20,720,700 | 82 | 5,784 | 0 | 1,811 | 1.671 | 290,661 | 0 |
| retypeExhaustive 10,000 | 461 | HS | 22,404,202 | 17,808,900 | 30 | 2,408 | 0 | 1,195 | 1.258 | 369,197 | 0 |
| retypeExhaustive 10,000 |  | SS | 21,759,602 | 12,071,500 | 48 | 3,016 | 0 | 807 | 1.803 | 293,994 | 0 |
| retypeExhaustive 10,000 |  | SW | 34,445,770 | 18,793,200 | 67 | 4,824 | 0 | 1,269 | 1.833 | 333,911 | 0 |
| retypeExhaustive 10,000 |  | MX | 34,617,571 | 20,720,700 | 82 | 5,784 | 0 | 1,811 | 1.671 | 290,661 | 0 |
| retypeExhaustive 20,000 | 404 | HS | 22,404,202 | 17,808,900 | 30 | 2,408 | 0 | 1,195 | 1.258 | 369,197 | 0 |
| retypeExhaustive 20,000 |  | SS | 21,759,602 | 12,071,500 | 48 | 3,016 | 0 | 807 | 1.803 | 293,994 | 0 |
| retypeExhaustive 20,000 |  | SW | 34,445,770 | 18,793,200 | 67 | 4,824 | 0 | 1,269 | 1.833 | 333,911 | 0 |
| retypeExhaustive 20,000 |  | MX | 34,617,571 | 20,720,700 | 82 | 5,784 | 0 | 1,811 | 1.671 | 290,661 | 0 |
| retypeExhaustive 40,000 | 402 | HS | 22,404,202 | 17,808,900 | 30 | 2,408 | 0 | 1,195 | 1.258 | 369,197 | 0 |
| retypeExhaustive 40,000 |  | SS | 21,759,602 | 12,071,500 | 48 | 3,016 | 0 | 807 | 1.803 | 293,994 | 0 |
| retypeExhaustive 40,000 |  | SW | 34,445,770 | 18,793,200 | 67 | 4,824 | 0 | 1,269 | 1.833 | 333,911 | 0 |
| retypeExhaustive 40,000 |  | MX | 34,617,571 | 20,720,700 | 82 | 5,784 | 0 | 1,811 | 1.671 | 290,661 | 0 |
| retypeClimbSteps 240 | 153 | HS | 22,404,202 | 17,808,900 | 30 | 2,408 | 0 | 1,195 | 1.258 | 369,197 | 0 |
| retypeClimbSteps 240 |  | SS | 21,759,602 | 12,071,500 | 48 | 3,016 | 0 | 807 | 1.803 | 293,994 | 0 |
| retypeClimbSteps 240 |  | SW | 34,445,770 | 18,793,200 | 67 | 4,824 | 0 | 1,269 | 1.833 | 333,911 | 0 |
| retypeClimbSteps 240 |  | MX | 34,617,571 | 20,720,700 | 82 | 5,784 | 0 | 1,811 | 1.671 | 290,661 | 0 |

- climbRounds 24, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 32, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 40, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 48, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 64, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 128, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 256, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 1,024, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 10,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 20,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 40,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeClimbSteps 240, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0

## live account of 2026-09-18 (one hired type, 20 000 leadership)

| level | ms | stop | damage | silver | hired burned | gold | dragon coins | queue h | dmg/silver | dmg/hired | rated vs ×1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ×1 | 35 | SS | 18,569,825 | 18,526,700 | 20 | 1,368 | 0 | 1,218 | 1.002 | 309,021 | — |
| ×1 |  | SW | 28,384,288 | 30,928,400 | 24 | 1,728 | 0 | 2,026 | 0.918 | 323,582 | — |
| ×1 |  | MX | 29,259,123 | 30,915,800 | 28 | 1,904 | 0 | 2,030 | 0.946 | 307,403 | — |
| ×1 |  | AI | 29,743,332 | 30,928,400 | 30 | 2,016 | 0 | 2,026 | 0.962 | 304,167 | — |
| climbRounds 24 | 29 | SS | 18,569,825 | 18,526,700 | 20 | 1,368 | 0 | 1,218 | 1.002 | 309,021 | 0 |
| climbRounds 24 |  | SW | 28,384,288 | 30,928,400 | 24 | 1,728 | 0 | 2,026 | 0.918 | 323,582 | 0 |
| climbRounds 24 |  | MX | 29,259,123 | 30,915,800 | 28 | 1,904 | 0 | 2,030 | 0.946 | 307,403 | 0 |
| climbRounds 24 |  | AI | 29,743,332 | 30,928,400 | 30 | 2,016 | 0 | 2,026 | 0.962 | 304,167 | 0 |
| climbRounds 32 | 31 | SS | 18,569,825 | 18,526,700 | 20 | 1,368 | 0 | 1,218 | 1.002 | 309,021 | 0 |
| climbRounds 32 |  | SW | 28,384,288 | 30,928,400 | 24 | 1,728 | 0 | 2,026 | 0.918 | 323,582 | 0 |
| climbRounds 32 |  | MX | 29,259,123 | 30,915,800 | 28 | 1,904 | 0 | 2,030 | 0.946 | 307,403 | 0 |
| climbRounds 32 |  | AI | 29,743,332 | 30,928,400 | 30 | 2,016 | 0 | 2,026 | 0.962 | 304,167 | 0 |
| climbRounds 40 | 31 | SS | 18,569,825 | 18,526,700 | 20 | 1,368 | 0 | 1,218 | 1.002 | 309,021 | 0 |
| climbRounds 40 |  | SW | 28,384,288 | 30,928,400 | 24 | 1,728 | 0 | 2,026 | 0.918 | 323,582 | 0 |
| climbRounds 40 |  | MX | 29,259,123 | 30,915,800 | 28 | 1,904 | 0 | 2,030 | 0.946 | 307,403 | 0 |
| climbRounds 40 |  | AI | 29,743,332 | 30,928,400 | 30 | 2,016 | 0 | 2,026 | 0.962 | 304,167 | 0 |
| climbRounds 48 | 37 | SS | 18,569,825 | 18,526,700 | 20 | 1,368 | 0 | 1,218 | 1.002 | 309,021 | 0 |
| climbRounds 48 |  | SW | 28,384,288 | 30,928,400 | 24 | 1,728 | 0 | 2,026 | 0.918 | 323,582 | 0 |
| climbRounds 48 |  | MX | 29,259,123 | 30,915,800 | 28 | 1,904 | 0 | 2,030 | 0.946 | 307,403 | 0 |
| climbRounds 48 |  | AI | 29,743,332 | 30,928,400 | 30 | 2,016 | 0 | 2,026 | 0.962 | 304,167 | 0 |
| climbRounds 64 | 38 | SS | 18,569,825 | 18,526,700 | 20 | 1,368 | 0 | 1,218 | 1.002 | 309,021 | 0 |
| climbRounds 64 |  | SW | 28,384,288 | 30,928,400 | 24 | 1,728 | 0 | 2,026 | 0.918 | 323,582 | 0 |
| climbRounds 64 |  | MX | 29,259,123 | 30,915,800 | 28 | 1,904 | 0 | 2,030 | 0.946 | 307,403 | 0 |
| climbRounds 64 |  | AI | 29,743,332 | 30,928,400 | 30 | 2,016 | 0 | 2,026 | 0.962 | 304,167 | 0 |
| climbRounds 128 | 31 | SS | 18,569,825 | 18,526,700 | 20 | 1,368 | 0 | 1,218 | 1.002 | 309,021 | 0 |
| climbRounds 128 |  | SW | 28,384,288 | 30,928,400 | 24 | 1,728 | 0 | 2,026 | 0.918 | 323,582 | 0 |
| climbRounds 128 |  | MX | 29,259,123 | 30,915,800 | 28 | 1,904 | 0 | 2,030 | 0.946 | 307,403 | 0 |
| climbRounds 128 |  | AI | 29,743,332 | 30,928,400 | 30 | 2,016 | 0 | 2,026 | 0.962 | 304,167 | 0 |
| climbRounds 256 | 33 | SS | 18,569,825 | 18,526,700 | 20 | 1,368 | 0 | 1,218 | 1.002 | 309,021 | 0 |
| climbRounds 256 |  | SW | 28,384,288 | 30,928,400 | 24 | 1,728 | 0 | 2,026 | 0.918 | 323,582 | 0 |
| climbRounds 256 |  | MX | 29,259,123 | 30,915,800 | 28 | 1,904 | 0 | 2,030 | 0.946 | 307,403 | 0 |
| climbRounds 256 |  | AI | 29,743,332 | 30,928,400 | 30 | 2,016 | 0 | 2,026 | 0.962 | 304,167 | 0 |
| climbRounds 1,024 | 36 | SS | 18,569,825 | 18,526,700 | 20 | 1,368 | 0 | 1,218 | 1.002 | 309,021 | 0 |
| climbRounds 1,024 |  | SW | 28,384,288 | 30,928,400 | 24 | 1,728 | 0 | 2,026 | 0.918 | 323,582 | 0 |
| climbRounds 1,024 |  | MX | 29,259,123 | 30,915,800 | 28 | 1,904 | 0 | 2,030 | 0.946 | 307,403 | 0 |
| climbRounds 1,024 |  | AI | 29,743,332 | 30,928,400 | 30 | 2,016 | 0 | 2,026 | 0.962 | 304,167 | 0 |
| retypeExhaustive 10,000 | 239 | SS | **18,597,488** (+0.15 %) | **18,481,400** (−0.24 %) | 20 | 1,368 | 0 | 1,221 | 1.006 | 309,021 | +0.191 |
| retypeExhaustive 10,000 |  | SW | **28,463,764** (+0.28 %) | **30,798,800** (−0.42 %) | 24 | 1,728 | 0 | 2,036 | 0.924 | 323,582 | +0.351 |
| retypeExhaustive 10,000 |  | MX | **29,318,730** (+0.20 %) | **30,818,600** (−0.31 %) | 28 | 1,904 | 0 | 2,037 | 0.951 | 307,403 | +0.257 |
| retypeExhaustive 10,000 |  | AI | **29,822,808** (+0.27 %) | **30,798,800** (−0.42 %) | 30 | 2,016 | 0 | 2,036 | 0.968 | 304,167 | +0.339 |
| retypeExhaustive 20,000 | 228 | SS | **18,597,488** (+0.15 %) | **18,481,400** (−0.24 %) | 20 | 1,368 | 0 | 1,221 | 1.006 | 309,021 | +0.191 |
| retypeExhaustive 20,000 |  | SW | **28,463,764** (+0.28 %) | **30,798,800** (−0.42 %) | 24 | 1,728 | 0 | 2,036 | 0.924 | 323,582 | +0.351 |
| retypeExhaustive 20,000 |  | MX | **29,318,730** (+0.20 %) | **30,818,600** (−0.31 %) | 28 | 1,904 | 0 | 2,037 | 0.951 | 307,403 | +0.257 |
| retypeExhaustive 20,000 |  | AI | **29,822,808** (+0.27 %) | **30,798,800** (−0.42 %) | 30 | 2,016 | 0 | 2,036 | 0.968 | 304,167 | +0.339 |
| retypeExhaustive 40,000 | 224 | SS | **18,597,488** (+0.15 %) | **18,481,400** (−0.24 %) | 20 | 1,368 | 0 | 1,221 | 1.006 | 309,021 | +0.191 |
| retypeExhaustive 40,000 |  | SW | **28,463,764** (+0.28 %) | **30,798,800** (−0.42 %) | 24 | 1,728 | 0 | 2,036 | 0.924 | 323,582 | +0.351 |
| retypeExhaustive 40,000 |  | MX | **29,318,730** (+0.20 %) | **30,818,600** (−0.31 %) | 28 | 1,904 | 0 | 2,037 | 0.951 | 307,403 | +0.257 |
| retypeExhaustive 40,000 |  | AI | **29,822,808** (+0.27 %) | **30,798,800** (−0.42 %) | 30 | 2,016 | 0 | 2,036 | 0.968 | 304,167 | +0.339 |
| retypeClimbSteps 240 | 29 | SS | 18,569,825 | 18,526,700 | 20 | 1,368 | 0 | 1,218 | 1.002 | 309,021 | 0 |
| retypeClimbSteps 240 |  | SW | 28,384,288 | 30,928,400 | 24 | 1,728 | 0 | 2,026 | 0.918 | 323,582 | 0 |
| retypeClimbSteps 240 |  | MX | 29,259,123 | 30,915,800 | 28 | 1,904 | 0 | 2,030 | 0.946 | 307,403 | 0 |
| retypeClimbSteps 240 |  | AI | 29,743,332 | 30,928,400 | 30 | 2,016 | 0 | 2,026 | 0.962 | 304,167 | 0 |

- climbRounds 24, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 32, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 40, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 48, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 64, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 128, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 256, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 1,024, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 10,000, the bar's best against ×1's: most damage **+0.27 %** · least silver **+0.24 %** · fewest hired 0 · dmg/silver **+0.39 %** · dmg/hired 0
- retypeExhaustive 20,000, the bar's best against ×1's: most damage **+0.27 %** · least silver **+0.24 %** · fewest hired 0 · dmg/silver **+0.39 %** · dmg/hired 0
- retypeExhaustive 40,000, the bar's best against ×1's: most damage **+0.27 %** · least silver **+0.24 %** · fewest hired 0 · dmg/silver **+0.39 %** · dmg/hired 0
- retypeClimbSteps 240, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0

## live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

| level | ms | stop | damage | silver | hired burned | gold | dragon coins | queue h | dmg/silver | dmg/hired | rated vs ×1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ×1 | 130 | HS | 20,369,069 | 15,288,100 | 30 | 2,264 | 0 | 1,009 | 1.332 | 349,739 | — |
| ×1 |  | SS | 21,718,706 | 12,300,400 | 48 | 3,032 | 0 | 806 | 1.766 | 289,672 | — |
| ×1 |  | SW | 29,273,447 | 17,023,300 | 59 | 4,024 | 0 | 1,120 | 1.720 | 309,154 | — |
| ×1 |  | MX | 34,151,512 | 17,181,600 | 76 | 5,040 | 0 | 1,150 | 1.988 | 300,023 | — |
| ×1 |  | AI | 34,784,291 | 19,233,100 | 89 | 6,272 | 0 | 1,667 | 1.809 | 271,725 | — |
| climbRounds 24 | 129 | HS | 20,369,069 | 15,288,100 | 30 | 2,264 | 0 | 1,009 | 1.332 | 349,739 | 0 |
| climbRounds 24 |  | SS | 21,718,706 | 12,300,400 | 48 | 3,032 | 0 | 806 | 1.766 | 289,672 | 0 |
| climbRounds 24 |  | SW | 29,273,447 | 17,023,300 | 59 | 4,024 | 0 | 1,120 | 1.720 | 309,154 | 0 |
| climbRounds 24 |  | MX | 34,151,512 | 17,181,600 | 76 | 5,040 | 0 | 1,150 | 1.988 | 300,023 | 0 |
| climbRounds 24 |  | AI | 34,784,291 | 19,233,100 | 89 | 6,272 | 0 | 1,667 | 1.809 | 271,725 | 0 |
| climbRounds 32 | 139 | HS | 20,369,069 | 15,288,100 | 30 | 2,264 | 0 | 1,009 | 1.332 | 349,739 | 0 |
| climbRounds 32 |  | SS | 21,718,706 | 12,300,400 | 48 | 3,032 | 0 | 806 | 1.766 | 289,672 | 0 |
| climbRounds 32 |  | SW | 29,273,447 | 17,023,300 | 59 | 4,024 | 0 | 1,120 | 1.720 | 309,154 | 0 |
| climbRounds 32 |  | MX | 34,151,512 | 17,181,600 | 76 | 5,040 | 0 | 1,150 | 1.988 | 300,023 | 0 |
| climbRounds 32 |  | AI | 34,784,291 | 19,233,100 | 89 | 6,272 | 0 | 1,667 | 1.809 | 271,725 | 0 |
| climbRounds 40 | 179 | HS | 20,369,069 | 15,288,100 | 30 | 2,264 | 0 | 1,009 | 1.332 | 349,739 | 0 |
| climbRounds 40 |  | SS | 21,718,706 | 12,300,400 | 48 | 3,032 | 0 | 806 | 1.766 | 289,672 | 0 |
| climbRounds 40 |  | SW | 29,273,447 | 17,023,300 | 59 | 4,024 | 0 | 1,120 | 1.720 | 309,154 | 0 |
| climbRounds 40 |  | MX | 34,151,512 | 17,181,600 | 76 | 5,040 | 0 | 1,150 | 1.988 | 300,023 | 0 |
| climbRounds 40 |  | AI | 34,784,291 | 19,233,100 | 89 | 6,272 | 0 | 1,667 | 1.809 | 271,725 | 0 |
| climbRounds 48 | 155 | HS | 20,369,069 | 15,288,100 | 30 | 2,264 | 0 | 1,009 | 1.332 | 349,739 | 0 |
| climbRounds 48 |  | SS | 21,718,706 | 12,300,400 | 48 | 3,032 | 0 | 806 | 1.766 | 289,672 | 0 |
| climbRounds 48 |  | SW | 29,273,447 | 17,023,300 | 59 | 4,024 | 0 | 1,120 | 1.720 | 309,154 | 0 |
| climbRounds 48 |  | MX | 34,151,512 | 17,181,600 | 76 | 5,040 | 0 | 1,150 | 1.988 | 300,023 | 0 |
| climbRounds 48 |  | AI | 34,784,291 | 19,233,100 | 89 | 6,272 | 0 | 1,667 | 1.809 | 271,725 | 0 |
| climbRounds 64 | 155 | HS | 20,369,069 | 15,288,100 | 30 | 2,264 | 0 | 1,009 | 1.332 | 349,739 | 0 |
| climbRounds 64 |  | SS | 21,718,706 | 12,300,400 | 48 | 3,032 | 0 | 806 | 1.766 | 289,672 | 0 |
| climbRounds 64 |  | SW | **34,054,438** (+16.33 %) | **17,181,600** (+0.93 %) | **73** (+23.73 %) | **5,040** (+25.25 %) | 0 | 1,150 | 1.982 | 311,023 | +6.284 |
| climbRounds 64 |  | MX | **43,174,831** (+26.42 %) | **27,396,000** (+59.45 %) | **331** (+335.53 %) | **23,616** (+368.57 %) | 0 | 4,138 | 1.576 | 122,703 | −132.783 |
| climbRounds 128 | 202 | HS | 20,369,069 | 15,288,100 | 30 | 2,264 | 0 | 1,009 | 1.332 | 349,739 | 0 |
| climbRounds 128 |  | SS | 21,718,706 | 12,300,400 | 48 | 3,032 | 0 | 806 | 1.766 | 289,672 | 0 |
| climbRounds 128 |  | SW | **34,054,438** (+16.33 %) | **17,181,600** (+0.93 %) | **73** (+23.73 %) | **5,040** (+25.25 %) | 0 | 1,150 | 1.982 | 311,023 | +6.284 |
| climbRounds 128 |  | MX | **43,174,831** (+26.42 %) | **27,396,000** (+59.45 %) | **331** (+335.53 %) | **23,616** (+368.57 %) | 0 | 4,138 | 1.576 | 122,703 | −132.783 |
| climbRounds 256 | 205 | HS | 20,369,069 | 15,288,100 | 30 | 2,264 | 0 | 1,009 | 1.332 | 349,739 | 0 |
| climbRounds 256 |  | SS | 21,718,706 | 12,300,400 | 48 | 3,032 | 0 | 806 | 1.766 | 289,672 | 0 |
| climbRounds 256 |  | SW | **34,054,438** (+16.33 %) | **17,181,600** (+0.93 %) | **73** (+23.73 %) | **5,040** (+25.25 %) | 0 | 1,150 | 1.982 | 311,023 | +6.284 |
| climbRounds 256 |  | MX | **43,174,831** (+26.42 %) | **27,396,000** (+59.45 %) | **331** (+335.53 %) | **23,616** (+368.57 %) | 0 | 4,138 | 1.576 | 122,703 | −132.783 |
| climbRounds 1,024 | 210 | HS | 20,369,069 | 15,288,100 | 30 | 2,264 | 0 | 1,009 | 1.332 | 349,739 | 0 |
| climbRounds 1,024 |  | SS | 21,718,706 | 12,300,400 | 48 | 3,032 | 0 | 806 | 1.766 | 289,672 | 0 |
| climbRounds 1,024 |  | SW | **34,054,438** (+16.33 %) | **17,181,600** (+0.93 %) | **73** (+23.73 %) | **5,040** (+25.25 %) | 0 | 1,150 | 1.982 | 311,023 | +6.284 |
| climbRounds 1,024 |  | MX | **43,174,831** (+26.42 %) | **27,396,000** (+59.45 %) | **331** (+335.53 %) | **23,616** (+368.57 %) | 0 | 4,138 | 1.576 | 122,703 | −132.783 |
| retypeExhaustive 10,000 | 446 | HS | **20,397,713** (+0.14 %) | **15,244,600** (−0.28 %) | 30 | 2,264 | 0 | 1,010 | 1.338 | 349,739 | +0.195 |
| retypeExhaustive 10,000 |  | SS | 21,718,706 | 12,300,400 | 48 | 3,032 | 0 | 806 | 1.766 | 289,672 | 0 |
| retypeExhaustive 10,000 |  | SW | **29,309,669** (+0.12 %) | **16,975,300** (−0.28 %) | 59 | 4,024 | 0 | 1,125 | 1.727 | 309,154 | +0.170 |
| retypeExhaustive 10,000 |  | MX | **34,163,357** (+0.03 %) | **17,179,900** (−0.01 %) | 76 | 5,040 | 0 | 1,150 | 1.989 | 300,023 | +0.037 |
| retypeExhaustive 10,000 |  | AI | 34,784,291 | 19,233,100 | 89 | 6,272 | 0 | 1,667 | 1.809 | 271,725 | 0 |
| retypeExhaustive 20,000 | 411 | HS | **20,397,713** (+0.14 %) | **15,244,600** (−0.28 %) | 30 | 2,264 | 0 | 1,010 | 1.338 | 349,739 | +0.195 |
| retypeExhaustive 20,000 |  | SS | 21,718,706 | 12,300,400 | 48 | 3,032 | 0 | 806 | 1.766 | 289,672 | 0 |
| retypeExhaustive 20,000 |  | SW | **29,309,669** (+0.12 %) | **16,975,300** (−0.28 %) | 59 | 4,024 | 0 | 1,125 | 1.727 | 309,154 | +0.170 |
| retypeExhaustive 20,000 |  | MX | **34,163,357** (+0.03 %) | **17,179,900** (−0.01 %) | 76 | 5,040 | 0 | 1,150 | 1.989 | 300,023 | +0.037 |
| retypeExhaustive 20,000 |  | AI | 34,784,291 | 19,233,100 | 89 | 6,272 | 0 | 1,667 | 1.809 | 271,725 | 0 |
| retypeExhaustive 40,000 | 410 | HS | **20,397,713** (+0.14 %) | **15,244,600** (−0.28 %) | 30 | 2,264 | 0 | 1,010 | 1.338 | 349,739 | +0.195 |
| retypeExhaustive 40,000 |  | SS | 21,718,706 | 12,300,400 | 48 | 3,032 | 0 | 806 | 1.766 | 289,672 | 0 |
| retypeExhaustive 40,000 |  | SW | **29,309,669** (+0.12 %) | **16,975,300** (−0.28 %) | 59 | 4,024 | 0 | 1,125 | 1.727 | 309,154 | +0.170 |
| retypeExhaustive 40,000 |  | MX | **34,163,357** (+0.03 %) | **17,179,900** (−0.01 %) | 76 | 5,040 | 0 | 1,150 | 1.989 | 300,023 | +0.037 |
| retypeExhaustive 40,000 |  | AI | 34,784,291 | 19,233,100 | 89 | 6,272 | 0 | 1,667 | 1.809 | 271,725 | 0 |
| retypeClimbSteps 240 | 127 | HS | 20,369,069 | 15,288,100 | 30 | 2,264 | 0 | 1,009 | 1.332 | 349,739 | 0 |
| retypeClimbSteps 240 |  | SS | 21,718,706 | 12,300,400 | 48 | 3,032 | 0 | 806 | 1.766 | 289,672 | 0 |
| retypeClimbSteps 240 |  | SW | 29,273,447 | 17,023,300 | 59 | 4,024 | 0 | 1,120 | 1.720 | 309,154 | 0 |
| retypeClimbSteps 240 |  | MX | 34,151,512 | 17,181,600 | 76 | 5,040 | 0 | 1,150 | 1.988 | 300,023 | 0 |
| retypeClimbSteps 240 |  | AI | 34,784,291 | 19,233,100 | 89 | 6,272 | 0 | 1,667 | 1.809 | 271,725 | 0 |

- climbRounds 24, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 32, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 40, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 48, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 64, the bar's best against ×1's: most damage **+24.12 %** · least silver 0 · fewest hired 0 · dmg/silver **−0.28 %** · dmg/hired 0
- climbRounds 128, the bar's best against ×1's: most damage **+24.12 %** · least silver 0 · fewest hired 0 · dmg/silver **−0.28 %** · dmg/hired 0
- climbRounds 256, the bar's best against ×1's: most damage **+24.12 %** · least silver 0 · fewest hired 0 · dmg/silver **−0.28 %** · dmg/hired 0
- climbRounds 1,024, the bar's best against ×1's: most damage **+24.12 %** · least silver 0 · fewest hired 0 · dmg/silver **−0.28 %** · dmg/hired 0
- retypeExhaustive 10,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver **+0.04 %** · dmg/hired 0
- retypeExhaustive 20,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver **+0.04 %** · dmg/hired 0
- retypeExhaustive 40,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver **+0.04 %** · dmg/hired 0
- retypeClimbSteps 240, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0

## Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)

| level | ms | stop | damage | silver | hired burned | gold | dragon coins | queue h | dmg/silver | dmg/hired | rated vs ×1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ×1 | 91 | HS | 9,450,218 | 5,777,000 | 19 | 1,288 | 0 | 323 | 1.636 | 325,749 | — |
| ×1 |  | SW | 15,598,199 | 7,684,400 | 37 | 2,440 | 0 | 500 | 2.030 | 300,662 | — |
| ×1 |  | MX | 18,216,181 | 8,665,200 | 61 | 4,360 | 0 | 751 | 2.102 | 235,327 | — |
| ×1 |  | AI | 18,750,522 | 11,241,200 | 111 | 7,848 | 0 | 1,425 | 1.668 | 133,301 | — |
| climbRounds 24 | 94 | HS | 9,450,218 | 5,777,000 | 19 | 1,288 | 0 | 323 | 1.636 | 325,749 | 0 |
| climbRounds 24 |  | SW | 15,598,199 | 7,684,400 | 37 | 2,440 | 0 | 500 | 2.030 | 300,662 | 0 |
| climbRounds 24 |  | MX | 18,216,181 | 8,665,200 | 61 | 4,360 | 0 | 751 | 2.102 | 235,327 | 0 |
| climbRounds 24 |  | AI | 18,750,522 | 11,241,200 | 111 | 7,848 | 0 | 1,425 | 1.668 | 133,301 | 0 |
| climbRounds 32 | 94 | HS | 9,450,218 | 5,777,000 | 19 | 1,288 | 0 | 323 | 1.636 | 325,749 | 0 |
| climbRounds 32 |  | SW | 15,598,199 | 7,684,400 | 37 | 2,440 | 0 | 500 | 2.030 | 300,662 | 0 |
| climbRounds 32 |  | MX | 18,216,181 | 8,665,200 | 61 | 4,360 | 0 | 751 | 2.102 | 235,327 | 0 |
| climbRounds 32 |  | AI | 18,750,522 | 11,241,200 | 111 | 7,848 | 0 | 1,425 | 1.668 | 133,301 | 0 |
| climbRounds 40 | 108 | HS | 9,450,218 | 5,777,000 | 19 | 1,288 | 0 | 323 | 1.636 | 325,749 | 0 |
| climbRounds 40 |  | SW | 15,598,199 | 7,684,400 | 37 | 2,440 | 0 | 500 | 2.030 | 300,662 | 0 |
| climbRounds 40 |  | MX | 18,216,181 | 8,665,200 | 61 | 4,360 | 0 | 751 | 2.102 | 235,327 | 0 |
| climbRounds 40 |  | AI | 18,750,522 | 11,241,200 | 111 | 7,848 | 0 | 1,425 | 1.668 | 133,301 | 0 |
| climbRounds 48 | 112 | HS | 9,450,218 | 5,777,000 | 19 | 1,288 | 0 | 323 | 1.636 | 325,749 | 0 |
| climbRounds 48 |  | SW | 15,598,199 | 7,684,400 | 37 | 2,440 | 0 | 500 | 2.030 | 300,662 | 0 |
| climbRounds 48 |  | MX | 18,216,181 | 8,665,200 | 61 | 4,360 | 0 | 751 | 2.102 | 235,327 | 0 |
| climbRounds 48 |  | AI | 18,750,522 | 11,241,200 | 111 | 7,848 | 0 | 1,425 | 1.668 | 133,301 | 0 |
| climbRounds 64 | 122 | HS | 9,450,218 | 5,777,000 | 19 | 1,288 | 0 | 323 | 1.636 | 325,749 | 0 |
| climbRounds 64 |  | SW | 15,598,199 | 7,684,400 | 37 | 2,440 | 0 | 500 | 2.030 | 300,662 | 0 |
| climbRounds 64 |  | MX | 18,216,181 | 8,665,200 | 61 | 4,360 | 0 | 751 | 2.102 | 235,327 | 0 |
| climbRounds 64 |  | AI | 18,750,522 | 11,241,200 | 111 | 7,848 | 0 | 1,425 | 1.668 | 133,301 | 0 |
| climbRounds 128 | 190 | HS | 9,450,218 | 5,777,000 | 19 | 1,288 | 0 | 323 | 1.636 | 325,749 | 0 |
| climbRounds 128 |  | SW | 15,598,199 | 7,684,400 | 37 | 2,440 | 0 | 500 | 2.030 | 300,662 | 0 |
| climbRounds 128 |  | MX | 18,216,181 | 8,665,200 | 61 | 4,360 | 0 | 751 | 2.102 | 235,327 | 0 |
| climbRounds 128 |  | AI | 18,750,522 | 11,241,200 | 111 | 7,848 | 0 | 1,425 | 1.668 | 133,301 | 0 |
| climbRounds 256 | 350 | HS | 9,450,218 | 5,777,000 | 19 | 1,288 | 0 | 323 | 1.636 | 325,749 | 0 |
| climbRounds 256 |  | SW | 15,598,199 | 7,684,400 | 37 | 2,440 | 0 | 500 | 2.030 | 300,662 | 0 |
| climbRounds 256 |  | MX | 18,216,181 | 8,665,200 | 61 | 4,360 | 0 | 751 | 2.102 | 235,327 | 0 |
| climbRounds 256 |  | AI | 18,750,522 | 11,241,200 | 111 | 7,848 | 0 | 1,425 | 1.668 | 133,301 | 0 |
| climbRounds 1,024 | 1,065 | HS | 9,450,218 | 5,777,000 | 19 | 1,288 | 0 | 323 | 1.636 | 325,749 | 0 |
| climbRounds 1,024 |  | SW | **18,216,181** (+16.78 %) | **8,665,200** (+12.76 %) | **61** (+64.86 %) | **4,360** (+78.69 %) | 0 | 751 | 2.102 | 235,327 | −15.735 |
| climbRounds 1,024 |  | MM | 19,073,290 | 12,495,000 | 151 | 10,864 | 0 | 1,900 | 1.526 | 119,248 | new |
| climbRounds 1,024 |  | MX | **21,358,363** (+17.25 %) | **12,499,200** (+44.25 %) | **175** (+186.89 %) | **12,664** (+190.46 %) | 0 | 1,901 | 1.709 | 115,952 | −70.894 |
| retypeExhaustive 10,000 | 97 | HS | 9,450,218 | 5,777,000 | 19 | 1,288 | 0 | 323 | 1.636 | 325,749 | 0 |
| retypeExhaustive 10,000 |  | SW | 15,598,199 | 7,684,400 | 37 | 2,440 | 0 | 500 | 2.030 | 300,662 | 0 |
| retypeExhaustive 10,000 |  | MX | 18,216,181 | 8,665,200 | 61 | 4,360 | 0 | 751 | 2.102 | 235,327 | 0 |
| retypeExhaustive 10,000 |  | AI | 18,750,522 | 11,241,200 | 111 | 7,848 | 0 | 1,425 | 1.668 | 133,301 | 0 |
| retypeExhaustive 20,000 | 94 | HS | 9,450,218 | 5,777,000 | 19 | 1,288 | 0 | 323 | 1.636 | 325,749 | 0 |
| retypeExhaustive 20,000 |  | SW | 15,598,199 | 7,684,400 | 37 | 2,440 | 0 | 500 | 2.030 | 300,662 | 0 |
| retypeExhaustive 20,000 |  | MX | 18,216,181 | 8,665,200 | 61 | 4,360 | 0 | 751 | 2.102 | 235,327 | 0 |
| retypeExhaustive 20,000 |  | AI | 18,750,522 | 11,241,200 | 111 | 7,848 | 0 | 1,425 | 1.668 | 133,301 | 0 |
| retypeExhaustive 40,000 | 164 | HS | 9,450,218 | 5,777,000 | 19 | 1,288 | 0 | 323 | 1.636 | 325,749 | 0 |
| retypeExhaustive 40,000 |  | SW | 15,598,199 | 7,684,400 | 37 | 2,440 | 0 | 500 | 2.030 | 300,662 | 0 |
| retypeExhaustive 40,000 |  | MX | 18,216,181 | 8,665,200 | 61 | 4,360 | 0 | 751 | 2.102 | 235,327 | 0 |
| retypeExhaustive 40,000 |  | AI | 18,750,522 | 11,241,200 | 111 | 7,848 | 0 | 1,425 | 1.668 | 133,301 | 0 |
| retypeClimbSteps 240 | 85 | HS | 9,450,218 | 5,777,000 | 19 | 1,288 | 0 | 323 | 1.636 | 325,749 | 0 |
| retypeClimbSteps 240 |  | SW | 15,598,199 | 7,684,400 | 37 | 2,440 | 0 | 500 | 2.030 | 300,662 | 0 |
| retypeClimbSteps 240 |  | MX | 18,216,181 | 8,665,200 | 61 | 4,360 | 0 | 751 | 2.102 | 235,327 | 0 |
| retypeClimbSteps 240 |  | AI | 18,750,522 | 11,241,200 | 111 | 7,848 | 0 | 1,425 | 1.668 | 133,301 | 0 |

- climbRounds 24, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 32, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 40, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 48, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 64, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 128, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 256, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 1,024, the bar's best against ×1's: most damage **+13.91 %** · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 10,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 20,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 40,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeClimbSteps 240, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0

## the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)

| level | ms | stop | damage | silver | hired burned | gold | dragon coins | queue h | dmg/silver | dmg/hired | rated vs ×1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ×1 | 99 | HS | 8,820,632 | 7,251,100 | 16 | 1,448 | 0 | 476 | 1.216 | 257,643 | — |
| ×1 |  | SS | 8,947,961 | 6,704,900 | 34 | 5,480 | 0 | 747 | 1.335 | 171,510 | — |
| ×1 |  | SW | 16,776,469 | 9,957,500 | 57 | 7,224 | 0 | 1,078 | 1.685 | 208,269 | — |
| ×1 |  | MM | 31,715,963 | 13,734,000 | 218 | 30,120 | 0 | 2,289 | 2.309 | 145,486 | — |
| ×1 |  | MX | 49,190,513 | 13,927,200 | 344 | 51,192 | 0 | 2,321 | 3.532 | 142,996 | — |
| climbRounds 24 | 94 | HS | 8,820,632 | 7,251,100 | 16 | 1,448 | 0 | 476 | 1.216 | 257,643 | 0 |
| climbRounds 24 |  | SS | 8,947,961 | 6,704,900 | 34 | 5,480 | 0 | 747 | 1.335 | 171,510 | 0 |
| climbRounds 24 |  | SW | 16,776,469 | 9,957,500 | 57 | 7,224 | 0 | 1,078 | 1.685 | 208,269 | 0 |
| climbRounds 24 |  | MM | 31,715,963 | 13,734,000 | 218 | 30,120 | 0 | 2,289 | 2.309 | 145,486 | 0 |
| climbRounds 24 |  | MX | 49,190,513 | 13,927,200 | 344 | 51,192 | 0 | 2,321 | 3.532 | 142,996 | 0 |
| climbRounds 32 | 98 | HS | 8,820,632 | 7,251,100 | 16 | 1,448 | 0 | 476 | 1.216 | 257,643 | 0 |
| climbRounds 32 |  | SS | 8,947,961 | 6,704,900 | 34 | 5,480 | 0 | 747 | 1.335 | 171,510 | 0 |
| climbRounds 32 |  | SW | 16,776,469 | 9,957,500 | 57 | 7,224 | 0 | 1,078 | 1.685 | 208,269 | 0 |
| climbRounds 32 |  | MM | 31,715,963 | 13,734,000 | 218 | 30,120 | 0 | 2,289 | 2.309 | 145,486 | 0 |
| climbRounds 32 |  | MX | 49,190,513 | 13,927,200 | 344 | 51,192 | 0 | 2,321 | 3.532 | 142,996 | 0 |
| climbRounds 40 | 98 | HS | 8,820,632 | 7,251,100 | 16 | 1,448 | 0 | 476 | 1.216 | 257,643 | 0 |
| climbRounds 40 |  | SS | 8,947,961 | 6,704,900 | 34 | 5,480 | 0 | 747 | 1.335 | 171,510 | 0 |
| climbRounds 40 |  | SW | 16,776,469 | 9,957,500 | 57 | 7,224 | 0 | 1,078 | 1.685 | 208,269 | 0 |
| climbRounds 40 |  | MM | 31,715,963 | 13,734,000 | 218 | 30,120 | 0 | 2,289 | 2.309 | 145,486 | 0 |
| climbRounds 40 |  | MX | 49,190,513 | 13,927,200 | 344 | 51,192 | 0 | 2,321 | 3.532 | 142,996 | 0 |
| climbRounds 48 | 99 | HS | 8,820,632 | 7,251,100 | 16 | 1,448 | 0 | 476 | 1.216 | 257,643 | 0 |
| climbRounds 48 |  | SS | 8,947,961 | 6,704,900 | 34 | 5,480 | 0 | 747 | 1.335 | 171,510 | 0 |
| climbRounds 48 |  | SW | 16,776,469 | 9,957,500 | 57 | 7,224 | 0 | 1,078 | 1.685 | 208,269 | 0 |
| climbRounds 48 |  | MM | 31,715,963 | 13,734,000 | 218 | 30,120 | 0 | 2,289 | 2.309 | 145,486 | 0 |
| climbRounds 48 |  | MX | 49,190,513 | 13,927,200 | 344 | 51,192 | 0 | 2,321 | 3.532 | 142,996 | 0 |
| climbRounds 64 | 99 | HS | 8,820,632 | 7,251,100 | 16 | 1,448 | 0 | 476 | 1.216 | 257,643 | 0 |
| climbRounds 64 |  | SS | 8,947,961 | 6,704,900 | 34 | 5,480 | 0 | 747 | 1.335 | 171,510 | 0 |
| climbRounds 64 |  | SW | 16,776,469 | 9,957,500 | 57 | 7,224 | 0 | 1,078 | 1.685 | 208,269 | 0 |
| climbRounds 64 |  | MM | 31,715,963 | 13,734,000 | 218 | 30,120 | 0 | 2,289 | 2.309 | 145,486 | 0 |
| climbRounds 64 |  | MX | 49,190,513 | 13,927,200 | 344 | 51,192 | 0 | 2,321 | 3.532 | 142,996 | 0 |
| climbRounds 128 | 97 | HS | 8,820,632 | 7,251,100 | 16 | 1,448 | 0 | 476 | 1.216 | 257,643 | 0 |
| climbRounds 128 |  | SS | 8,947,961 | 6,704,900 | 34 | 5,480 | 0 | 747 | 1.335 | 171,510 | 0 |
| climbRounds 128 |  | SW | 16,776,469 | 9,957,500 | 57 | 7,224 | 0 | 1,078 | 1.685 | 208,269 | 0 |
| climbRounds 128 |  | MM | 31,715,963 | 13,734,000 | 218 | 30,120 | 0 | 2,289 | 2.309 | 145,486 | 0 |
| climbRounds 128 |  | MX | 49,190,513 | 13,927,200 | 344 | 51,192 | 0 | 2,321 | 3.532 | 142,996 | 0 |
| climbRounds 256 | 108 | HS | 8,820,632 | 7,251,100 | 16 | 1,448 | 0 | 476 | 1.216 | 257,643 | 0 |
| climbRounds 256 |  | SS | 8,947,961 | 6,704,900 | 34 | 5,480 | 0 | 747 | 1.335 | 171,510 | 0 |
| climbRounds 256 |  | SW | 16,776,469 | 9,957,500 | 57 | 7,224 | 0 | 1,078 | 1.685 | 208,269 | 0 |
| climbRounds 256 |  | MM | 31,715,963 | 13,734,000 | 218 | 30,120 | 0 | 2,289 | 2.309 | 145,486 | 0 |
| climbRounds 256 |  | MX | 49,190,513 | 13,927,200 | 344 | 51,192 | 0 | 2,321 | 3.532 | 142,996 | 0 |
| climbRounds 1,024 | 102 | HS | 8,820,632 | 7,251,100 | 16 | 1,448 | 0 | 476 | 1.216 | 257,643 | 0 |
| climbRounds 1,024 |  | SS | 8,947,961 | 6,704,900 | 34 | 5,480 | 0 | 747 | 1.335 | 171,510 | 0 |
| climbRounds 1,024 |  | SW | 16,776,469 | 9,957,500 | 57 | 7,224 | 0 | 1,078 | 1.685 | 208,269 | 0 |
| climbRounds 1,024 |  | MM | 31,715,963 | 13,734,000 | 218 | 30,120 | 0 | 2,289 | 2.309 | 145,486 | 0 |
| climbRounds 1,024 |  | MX | 49,190,513 | 13,927,200 | 344 | 51,192 | 0 | 2,321 | 3.532 | 142,996 | 0 |
| retypeExhaustive 10,000 | 205 | HS | **8,833,940** (+0.15 %) | **7,227,400** (−0.33 %) | 16 | 1,448 | 0 | 479 | 1.222 | 257,643 | +0.200 |
| retypeExhaustive 10,000 |  | SS | 8,947,961 | 6,704,900 | 34 | 5,480 | 0 | 747 | 1.335 | 171,510 | 0 |
| retypeExhaustive 10,000 |  | SW | 16,776,469 | 9,957,500 | 57 | 7,224 | 0 | 1,078 | 1.685 | 208,269 | 0 |
| retypeExhaustive 10,000 |  | MM | 31,715,963 | 13,734,000 | 218 | 30,120 | 0 | 2,289 | 2.309 | 145,486 | 0 |
| retypeExhaustive 10,000 |  | MX | 49,190,513 | 13,927,200 | 344 | 51,192 | 0 | 2,321 | 3.532 | 142,996 | 0 |
| retypeExhaustive 20,000 | 196 | HS | **8,833,940** (+0.15 %) | **7,227,400** (−0.33 %) | 16 | 1,448 | 0 | 479 | 1.222 | 257,643 | +0.200 |
| retypeExhaustive 20,000 |  | SS | 8,947,961 | 6,704,900 | 34 | 5,480 | 0 | 747 | 1.335 | 171,510 | 0 |
| retypeExhaustive 20,000 |  | SW | 16,776,469 | 9,957,500 | 57 | 7,224 | 0 | 1,078 | 1.685 | 208,269 | 0 |
| retypeExhaustive 20,000 |  | MM | 31,715,963 | 13,734,000 | 218 | 30,120 | 0 | 2,289 | 2.309 | 145,486 | 0 |
| retypeExhaustive 20,000 |  | MX | 49,190,513 | 13,927,200 | 344 | 51,192 | 0 | 2,321 | 3.532 | 142,996 | 0 |
| retypeExhaustive 40,000 | 176 | HS | **8,833,940** (+0.15 %) | **7,227,400** (−0.33 %) | 16 | 1,448 | 0 | 479 | 1.222 | 257,643 | +0.200 |
| retypeExhaustive 40,000 |  | SS | 8,947,961 | 6,704,900 | 34 | 5,480 | 0 | 747 | 1.335 | 171,510 | 0 |
| retypeExhaustive 40,000 |  | SW | 16,776,469 | 9,957,500 | 57 | 7,224 | 0 | 1,078 | 1.685 | 208,269 | 0 |
| retypeExhaustive 40,000 |  | MM | 31,715,963 | 13,734,000 | 218 | 30,120 | 0 | 2,289 | 2.309 | 145,486 | 0 |
| retypeExhaustive 40,000 |  | MX | 49,190,513 | 13,927,200 | 344 | 51,192 | 0 | 2,321 | 3.532 | 142,996 | 0 |
| retypeClimbSteps 240 | 86 | HS | 8,820,632 | 7,251,100 | 16 | 1,448 | 0 | 476 | 1.216 | 257,643 | 0 |
| retypeClimbSteps 240 |  | SS | 8,947,961 | 6,704,900 | 34 | 5,480 | 0 | 747 | 1.335 | 171,510 | 0 |
| retypeClimbSteps 240 |  | SW | 16,776,469 | 9,957,500 | 57 | 7,224 | 0 | 1,078 | 1.685 | 208,269 | 0 |
| retypeClimbSteps 240 |  | MM | 31,715,963 | 13,734,000 | 218 | 30,120 | 0 | 2,289 | 2.309 | 145,486 | 0 |
| retypeClimbSteps 240 |  | MX | 49,190,513 | 13,927,200 | 344 | 51,192 | 0 | 2,321 | 3.532 | 142,996 | 0 |

- climbRounds 24, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 32, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 40, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 48, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 64, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 128, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 256, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 1,024, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 10,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 20,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 40,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeClimbSteps 240, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0

## his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)

| level | ms | stop | damage | silver | hired burned | gold | dragon coins | queue h | dmg/silver | dmg/hired | rated vs ×1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ×1 | 43 | HS | 6,943,378 | 7,733,000 | 6 | 392 | 0 | 510 | 0.898 | 296,617 | — |
| ×1 |  | SS | 7,843,070 | 7,313,200 | 12 | 848 | 0 | 627 | 1.072 | 318,189 | — |
| ×1 |  | SW | 9,367,909 | 8,747,300 | 15 | 1,016 | 0 | 760 | 1.071 | 306,324 | — |
| ×1 |  | MM | 14,563,666 | 10,657,800 | 59 | 4,072 | 0 | 1,299 | 1.366 | 168,372 | — |
| ×1 |  | MX | 23,589,127 | 13,043,800 | 148 | 10,480 | 0 | 2,174 | 1.808 | 159,386 | — |
| climbRounds 24 | 41 | HS | 6,943,378 | 7,733,000 | 6 | 392 | 0 | 510 | 0.898 | 296,617 | 0 |
| climbRounds 24 |  | SS | 7,843,070 | 7,313,200 | 12 | 848 | 0 | 627 | 1.072 | 318,189 | 0 |
| climbRounds 24 |  | SW | 9,367,909 | 8,747,300 | 15 | 1,016 | 0 | 760 | 1.071 | 306,324 | 0 |
| climbRounds 24 |  | MM | 14,563,666 | 10,657,800 | 59 | 4,072 | 0 | 1,299 | 1.366 | 168,372 | 0 |
| climbRounds 24 |  | MX | 23,589,127 | 13,043,800 | 148 | 10,480 | 0 | 2,174 | 1.808 | 159,386 | 0 |
| climbRounds 32 | 37 | HS | 6,943,378 | 7,733,000 | 6 | 392 | 0 | 510 | 0.898 | 296,617 | 0 |
| climbRounds 32 |  | SS | 7,843,070 | 7,313,200 | 12 | 848 | 0 | 627 | 1.072 | 318,189 | 0 |
| climbRounds 32 |  | SW | 9,367,909 | 8,747,300 | 15 | 1,016 | 0 | 760 | 1.071 | 306,324 | 0 |
| climbRounds 32 |  | MM | 14,563,666 | 10,657,800 | 59 | 4,072 | 0 | 1,299 | 1.366 | 168,372 | 0 |
| climbRounds 32 |  | MX | 23,589,127 | 13,043,800 | 148 | 10,480 | 0 | 2,174 | 1.808 | 159,386 | 0 |
| climbRounds 40 | 36 | HS | 6,943,378 | 7,733,000 | 6 | 392 | 0 | 510 | 0.898 | 296,617 | 0 |
| climbRounds 40 |  | SS | 7,843,070 | 7,313,200 | 12 | 848 | 0 | 627 | 1.072 | 318,189 | 0 |
| climbRounds 40 |  | SW | 9,367,909 | 8,747,300 | 15 | 1,016 | 0 | 760 | 1.071 | 306,324 | 0 |
| climbRounds 40 |  | MM | 14,563,666 | 10,657,800 | 59 | 4,072 | 0 | 1,299 | 1.366 | 168,372 | 0 |
| climbRounds 40 |  | MX | 23,589,127 | 13,043,800 | 148 | 10,480 | 0 | 2,174 | 1.808 | 159,386 | 0 |
| climbRounds 48 | 35 | HS | 6,943,378 | 7,733,000 | 6 | 392 | 0 | 510 | 0.898 | 296,617 | 0 |
| climbRounds 48 |  | SS | 7,843,070 | 7,313,200 | 12 | 848 | 0 | 627 | 1.072 | 318,189 | 0 |
| climbRounds 48 |  | SW | 9,367,909 | 8,747,300 | 15 | 1,016 | 0 | 760 | 1.071 | 306,324 | 0 |
| climbRounds 48 |  | MM | 14,563,666 | 10,657,800 | 59 | 4,072 | 0 | 1,299 | 1.366 | 168,372 | 0 |
| climbRounds 48 |  | MX | 23,589,127 | 13,043,800 | 148 | 10,480 | 0 | 2,174 | 1.808 | 159,386 | 0 |
| climbRounds 64 | 35 | HS | 6,943,378 | 7,733,000 | 6 | 392 | 0 | 510 | 0.898 | 296,617 | 0 |
| climbRounds 64 |  | SS | 7,843,070 | 7,313,200 | 12 | 848 | 0 | 627 | 1.072 | 318,189 | 0 |
| climbRounds 64 |  | SW | 9,367,909 | 8,747,300 | 15 | 1,016 | 0 | 760 | 1.071 | 306,324 | 0 |
| climbRounds 64 |  | MM | 14,563,666 | 10,657,800 | 59 | 4,072 | 0 | 1,299 | 1.366 | 168,372 | 0 |
| climbRounds 64 |  | MX | 23,589,127 | 13,043,800 | 148 | 10,480 | 0 | 2,174 | 1.808 | 159,386 | 0 |
| climbRounds 128 | 34 | HS | 6,943,378 | 7,733,000 | 6 | 392 | 0 | 510 | 0.898 | 296,617 | 0 |
| climbRounds 128 |  | SS | 7,843,070 | 7,313,200 | 12 | 848 | 0 | 627 | 1.072 | 318,189 | 0 |
| climbRounds 128 |  | SW | 9,367,909 | 8,747,300 | 15 | 1,016 | 0 | 760 | 1.071 | 306,324 | 0 |
| climbRounds 128 |  | MM | 14,563,666 | 10,657,800 | 59 | 4,072 | 0 | 1,299 | 1.366 | 168,372 | 0 |
| climbRounds 128 |  | MX | 23,589,127 | 13,043,800 | 148 | 10,480 | 0 | 2,174 | 1.808 | 159,386 | 0 |
| climbRounds 256 | 35 | HS | 6,943,378 | 7,733,000 | 6 | 392 | 0 | 510 | 0.898 | 296,617 | 0 |
| climbRounds 256 |  | SS | 7,843,070 | 7,313,200 | 12 | 848 | 0 | 627 | 1.072 | 318,189 | 0 |
| climbRounds 256 |  | SW | 9,367,909 | 8,747,300 | 15 | 1,016 | 0 | 760 | 1.071 | 306,324 | 0 |
| climbRounds 256 |  | MM | 14,563,666 | 10,657,800 | 59 | 4,072 | 0 | 1,299 | 1.366 | 168,372 | 0 |
| climbRounds 256 |  | MX | 23,589,127 | 13,043,800 | 148 | 10,480 | 0 | 2,174 | 1.808 | 159,386 | 0 |
| climbRounds 1,024 | 35 | HS | 6,943,378 | 7,733,000 | 6 | 392 | 0 | 510 | 0.898 | 296,617 | 0 |
| climbRounds 1,024 |  | SS | 7,843,070 | 7,313,200 | 12 | 848 | 0 | 627 | 1.072 | 318,189 | 0 |
| climbRounds 1,024 |  | SW | 9,367,909 | 8,747,300 | 15 | 1,016 | 0 | 760 | 1.071 | 306,324 | 0 |
| climbRounds 1,024 |  | MM | 14,563,666 | 10,657,800 | 59 | 4,072 | 0 | 1,299 | 1.366 | 168,372 | 0 |
| climbRounds 1,024 |  | MX | 23,589,127 | 13,043,800 | 148 | 10,480 | 0 | 2,174 | 1.808 | 159,386 | 0 |
| retypeExhaustive 10,000 | 131 | HS | **6,960,984** (+0.25 %) | **7,706,100** (−0.35 %) | 6 | 392 | 0 | 511 | 0.903 | 296,617 | +0.320 |
| retypeExhaustive 10,000 |  | SS | 7,843,070 | 7,313,200 | 12 | 848 | 0 | 627 | 1.072 | 318,189 | 0 |
| retypeExhaustive 10,000 |  | SW | **9,372,321** (+0.05 %) | **8,747,400** (+0.00 %) | 15 | 1,016 | 0 | 760 | 1.071 | 306,324 | +0.047 |
| retypeExhaustive 10,000 |  | MM | 14,563,666 | 10,657,800 | 59 | 4,072 | 0 | 1,299 | 1.366 | 168,372 | 0 |
| retypeExhaustive 10,000 |  | MX | 23,589,127 | 13,043,800 | 148 | 10,480 | 0 | 2,174 | 1.808 | 159,386 | 0 |
| retypeExhaustive 20,000 | 120 | HS | **6,960,984** (+0.25 %) | **7,706,100** (−0.35 %) | 6 | 392 | 0 | 511 | 0.903 | 296,617 | +0.320 |
| retypeExhaustive 20,000 |  | SS | 7,843,070 | 7,313,200 | 12 | 848 | 0 | 627 | 1.072 | 318,189 | 0 |
| retypeExhaustive 20,000 |  | SW | **9,372,321** (+0.05 %) | **8,747,400** (+0.00 %) | 15 | 1,016 | 0 | 760 | 1.071 | 306,324 | +0.047 |
| retypeExhaustive 20,000 |  | MM | 14,563,666 | 10,657,800 | 59 | 4,072 | 0 | 1,299 | 1.366 | 168,372 | 0 |
| retypeExhaustive 20,000 |  | MX | 23,589,127 | 13,043,800 | 148 | 10,480 | 0 | 2,174 | 1.808 | 159,386 | 0 |
| retypeExhaustive 40,000 | 122 | HS | **6,960,984** (+0.25 %) | **7,706,100** (−0.35 %) | 6 | 392 | 0 | 511 | 0.903 | 296,617 | +0.320 |
| retypeExhaustive 40,000 |  | SS | 7,843,070 | 7,313,200 | 12 | 848 | 0 | 627 | 1.072 | 318,189 | 0 |
| retypeExhaustive 40,000 |  | SW | **9,372,321** (+0.05 %) | **8,747,400** (+0.00 %) | 15 | 1,016 | 0 | 760 | 1.071 | 306,324 | +0.047 |
| retypeExhaustive 40,000 |  | MM | 14,563,666 | 10,657,800 | 59 | 4,072 | 0 | 1,299 | 1.366 | 168,372 | 0 |
| retypeExhaustive 40,000 |  | MX | 23,589,127 | 13,043,800 | 148 | 10,480 | 0 | 2,174 | 1.808 | 159,386 | 0 |
| retypeClimbSteps 240 | 38 | HS | 6,943,378 | 7,733,000 | 6 | 392 | 0 | 510 | 0.898 | 296,617 | 0 |
| retypeClimbSteps 240 |  | SS | 7,843,070 | 7,313,200 | 12 | 848 | 0 | 627 | 1.072 | 318,189 | 0 |
| retypeClimbSteps 240 |  | SW | 9,367,909 | 8,747,300 | 15 | 1,016 | 0 | 760 | 1.071 | 306,324 | 0 |
| retypeClimbSteps 240 |  | MM | 14,563,666 | 10,657,800 | 59 | 4,072 | 0 | 1,299 | 1.366 | 168,372 | 0 |
| retypeClimbSteps 240 |  | MX | 23,589,127 | 13,043,800 | 148 | 10,480 | 0 | 2,174 | 1.808 | 159,386 | 0 |

- climbRounds 24, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 32, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 40, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 48, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 64, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 128, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 256, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 1,024, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 10,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 20,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 40,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeClimbSteps 240, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0

## his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)

| level | ms | stop | damage | silver | hired burned | gold | dragon coins | queue h | dmg/silver | dmg/hired | rated vs ×1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ×1 | 47 | HS | 6,737,415 | 7,674,900 | 6 | 408 | 0 | 571 | 0.878 | 307,403 | — |
| ×1 |  | SS | 7,388,536 | 7,201,600 | 8 | 576 | 0 | 473 | 1.026 | 323,582 | — |
| ×1 |  | SW | 11,149,707 | 9,268,300 | 20 | 1,424 | 0 | 854 | 1.203 | 320,346 | — |
| ×1 |  | MX | 11,353,857 | 9,888,100 | 35 | 2,504 | 0 | 1,116 | 1.148 | 183,055 | — |
| ×1 |  | AI | 11,589,922 | 10,706,600 | 41 | 2,888 | 0 | 1,305 | 1.083 | 158,634 | — |
| climbRounds 24 | 39 | HS | 6,737,415 | 7,674,900 | 6 | 408 | 0 | 571 | 0.878 | 307,403 | 0 |
| climbRounds 24 |  | SS | 7,388,536 | 7,201,600 | 8 | 576 | 0 | 473 | 1.026 | 323,582 | 0 |
| climbRounds 24 |  | SW | 11,149,707 | 9,268,300 | 20 | 1,424 | 0 | 854 | 1.203 | 320,346 | 0 |
| climbRounds 24 |  | MX | 11,353,857 | 9,888,100 | 35 | 2,504 | 0 | 1,116 | 1.148 | 183,055 | 0 |
| climbRounds 24 |  | AI | 11,589,922 | 10,706,600 | 41 | 2,888 | 0 | 1,305 | 1.083 | 158,634 | 0 |
| climbRounds 32 | 40 | HS | 6,737,415 | 7,674,900 | 6 | 408 | 0 | 571 | 0.878 | 307,403 | 0 |
| climbRounds 32 |  | SS | 7,388,536 | 7,201,600 | 8 | 576 | 0 | 473 | 1.026 | 323,582 | 0 |
| climbRounds 32 |  | SW | 11,149,707 | 9,268,300 | 20 | 1,424 | 0 | 854 | 1.203 | 320,346 | 0 |
| climbRounds 32 |  | MX | 11,353,857 | 9,888,100 | 35 | 2,504 | 0 | 1,116 | 1.148 | 183,055 | 0 |
| climbRounds 32 |  | AI | 11,589,922 | 10,706,600 | 41 | 2,888 | 0 | 1,305 | 1.083 | 158,634 | 0 |
| climbRounds 40 | 41 | HS | 6,737,415 | 7,674,900 | 6 | 408 | 0 | 571 | 0.878 | 307,403 | 0 |
| climbRounds 40 |  | SS | 7,388,536 | 7,201,600 | 8 | 576 | 0 | 473 | 1.026 | 323,582 | 0 |
| climbRounds 40 |  | SW | 11,149,707 | 9,268,300 | 20 | 1,424 | 0 | 854 | 1.203 | 320,346 | 0 |
| climbRounds 40 |  | MX | 11,353,857 | 9,888,100 | 35 | 2,504 | 0 | 1,116 | 1.148 | 183,055 | 0 |
| climbRounds 40 |  | AI | 11,589,922 | 10,706,600 | 41 | 2,888 | 0 | 1,305 | 1.083 | 158,634 | 0 |
| climbRounds 48 | 40 | HS | 6,737,415 | 7,674,900 | 6 | 408 | 0 | 571 | 0.878 | 307,403 | 0 |
| climbRounds 48 |  | SS | 7,388,536 | 7,201,600 | 8 | 576 | 0 | 473 | 1.026 | 323,582 | 0 |
| climbRounds 48 |  | SW | 11,149,707 | 9,268,300 | 20 | 1,424 | 0 | 854 | 1.203 | 320,346 | 0 |
| climbRounds 48 |  | MX | 11,353,857 | 9,888,100 | 35 | 2,504 | 0 | 1,116 | 1.148 | 183,055 | 0 |
| climbRounds 48 |  | AI | 11,589,922 | 10,706,600 | 41 | 2,888 | 0 | 1,305 | 1.083 | 158,634 | 0 |
| climbRounds 64 | 42 | HS | 6,737,415 | 7,674,900 | 6 | 408 | 0 | 571 | 0.878 | 307,403 | 0 |
| climbRounds 64 |  | SS | 7,388,536 | 7,201,600 | 8 | 576 | 0 | 473 | 1.026 | 323,582 | 0 |
| climbRounds 64 |  | SW | 11,149,707 | 9,268,300 | 20 | 1,424 | 0 | 854 | 1.203 | 320,346 | 0 |
| climbRounds 64 |  | MX | 11,353,857 | 9,888,100 | 35 | 2,504 | 0 | 1,116 | 1.148 | 183,055 | 0 |
| climbRounds 64 |  | AI | 11,589,922 | 10,706,600 | 41 | 2,888 | 0 | 1,305 | 1.083 | 158,634 | 0 |
| climbRounds 128 | 40 | HS | 6,737,415 | 7,674,900 | 6 | 408 | 0 | 571 | 0.878 | 307,403 | 0 |
| climbRounds 128 |  | SS | 7,388,536 | 7,201,600 | 8 | 576 | 0 | 473 | 1.026 | 323,582 | 0 |
| climbRounds 128 |  | SW | 11,149,707 | 9,268,300 | 20 | 1,424 | 0 | 854 | 1.203 | 320,346 | 0 |
| climbRounds 128 |  | MX | 11,353,857 | 9,888,100 | 35 | 2,504 | 0 | 1,116 | 1.148 | 183,055 | 0 |
| climbRounds 128 |  | AI | 11,589,922 | 10,706,600 | 41 | 2,888 | 0 | 1,305 | 1.083 | 158,634 | 0 |
| climbRounds 256 | 38 | HS | 6,737,415 | 7,674,900 | 6 | 408 | 0 | 571 | 0.878 | 307,403 | 0 |
| climbRounds 256 |  | SS | 7,388,536 | 7,201,600 | 8 | 576 | 0 | 473 | 1.026 | 323,582 | 0 |
| climbRounds 256 |  | SW | 11,149,707 | 9,268,300 | 20 | 1,424 | 0 | 854 | 1.203 | 320,346 | 0 |
| climbRounds 256 |  | MX | 11,353,857 | 9,888,100 | 35 | 2,504 | 0 | 1,116 | 1.148 | 183,055 | 0 |
| climbRounds 256 |  | AI | 11,589,922 | 10,706,600 | 41 | 2,888 | 0 | 1,305 | 1.083 | 158,634 | 0 |
| climbRounds 1,024 | 40 | HS | 6,737,415 | 7,674,900 | 6 | 408 | 0 | 571 | 0.878 | 307,403 | 0 |
| climbRounds 1,024 |  | SS | 7,388,536 | 7,201,600 | 8 | 576 | 0 | 473 | 1.026 | 323,582 | 0 |
| climbRounds 1,024 |  | SW | 11,149,707 | 9,268,300 | 20 | 1,424 | 0 | 854 | 1.203 | 320,346 | 0 |
| climbRounds 1,024 |  | MX | 11,353,857 | 9,888,100 | 35 | 2,504 | 0 | 1,116 | 1.148 | 183,055 | 0 |
| climbRounds 1,024 |  | AI | 11,589,922 | 10,706,600 | 41 | 2,888 | 0 | 1,305 | 1.083 | 158,634 | 0 |
| retypeExhaustive 10,000 | 126 | HS | 6,737,415 | 7,674,900 | 6 | 408 | 0 | 571 | 0.878 | 307,403 | 0 |
| retypeExhaustive 10,000 |  | SS | **7,409,620** (+0.29 %) | **7,180,800** (−0.29 %) | 8 | 576 | 0 | 473 | 1.032 | 323,582 | +0.346 |
| retypeExhaustive 10,000 |  | SW | 11,149,707 | 9,268,300 | 20 | 1,424 | 0 | 854 | 1.203 | 320,346 | 0 |
| retypeExhaustive 10,000 |  | MX | 11,353,857 | 9,888,100 | 35 | 2,504 | 0 | 1,116 | 1.148 | 183,055 | 0 |
| retypeExhaustive 10,000 |  | AI | 11,589,922 | 10,706,600 | 41 | 2,888 | 0 | 1,305 | 1.083 | 158,634 | 0 |
| retypeExhaustive 20,000 | 115 | HS | 6,737,415 | 7,674,900 | 6 | 408 | 0 | 571 | 0.878 | 307,403 | 0 |
| retypeExhaustive 20,000 |  | SS | **7,409,620** (+0.29 %) | **7,180,800** (−0.29 %) | 8 | 576 | 0 | 473 | 1.032 | 323,582 | +0.346 |
| retypeExhaustive 20,000 |  | SW | 11,149,707 | 9,268,300 | 20 | 1,424 | 0 | 854 | 1.203 | 320,346 | 0 |
| retypeExhaustive 20,000 |  | MX | 11,353,857 | 9,888,100 | 35 | 2,504 | 0 | 1,116 | 1.148 | 183,055 | 0 |
| retypeExhaustive 20,000 |  | AI | 11,589,922 | 10,706,600 | 41 | 2,888 | 0 | 1,305 | 1.083 | 158,634 | 0 |
| retypeExhaustive 40,000 | 116 | HS | 6,737,415 | 7,674,900 | 6 | 408 | 0 | 571 | 0.878 | 307,403 | 0 |
| retypeExhaustive 40,000 |  | SS | **7,409,620** (+0.29 %) | **7,180,800** (−0.29 %) | 8 | 576 | 0 | 473 | 1.032 | 323,582 | +0.346 |
| retypeExhaustive 40,000 |  | SW | 11,149,707 | 9,268,300 | 20 | 1,424 | 0 | 854 | 1.203 | 320,346 | 0 |
| retypeExhaustive 40,000 |  | MX | 11,353,857 | 9,888,100 | 35 | 2,504 | 0 | 1,116 | 1.148 | 183,055 | 0 |
| retypeExhaustive 40,000 |  | AI | 11,589,922 | 10,706,600 | 41 | 2,888 | 0 | 1,305 | 1.083 | 158,634 | 0 |
| retypeClimbSteps 240 | 39 | HS | 6,737,415 | 7,674,900 | 6 | 408 | 0 | 571 | 0.878 | 307,403 | 0 |
| retypeClimbSteps 240 |  | SS | 7,388,536 | 7,201,600 | 8 | 576 | 0 | 473 | 1.026 | 323,582 | 0 |
| retypeClimbSteps 240 |  | SW | 11,149,707 | 9,268,300 | 20 | 1,424 | 0 | 854 | 1.203 | 320,346 | 0 |
| retypeClimbSteps 240 |  | MX | 11,353,857 | 9,888,100 | 35 | 2,504 | 0 | 1,116 | 1.148 | 183,055 | 0 |
| retypeClimbSteps 240 |  | AI | 11,589,922 | 10,706,600 | 41 | 2,888 | 0 | 1,305 | 1.083 | 158,634 | 0 |

- climbRounds 24, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 32, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 40, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 48, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 64, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 128, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 256, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 1,024, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 10,000, the bar's best against ×1's: most damage 0 · least silver **+0.29 %** · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 20,000, the bar's best against ×1's: most damage 0 · least silver **+0.29 %** · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 40,000, the bar's best against ×1's: most damage 0 · least silver **+0.29 %** · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeClimbSteps 240, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0

## his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80)

| level | ms | stop | damage | silver | hired burned | gold | dragon coins | queue h | dmg/silver | dmg/hired | rated vs ×1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ×1 | 174 | SS | 4,935,728 | 4,431,600 | 7 | 480 | 3,840 | 279 | 1.114 | 131,856 | — |
| ×1 |  | SW | 8,250,940 | 8,344,200 | 19 | 1,320 | 3,840 | 571 | 0.989 | 109,005 | — |
| ×1 |  | MX | 8,443,234 | 8,706,000 | 25 | 1,584 | 3,840 | 660 | 0.970 | 100,404 | — |
| climbRounds 24 | 168 | SS | 4,935,728 | 4,431,600 | 7 | 480 | 3,840 | 279 | 1.114 | 131,856 | 0 |
| climbRounds 24 |  | SW | 8,250,940 | 8,344,200 | 19 | 1,320 | 3,840 | 571 | 0.989 | 109,005 | 0 |
| climbRounds 24 |  | MX | 8,443,234 | 8,706,000 | 25 | 1,584 | 3,840 | 660 | 0.970 | 100,404 | 0 |
| climbRounds 32 | 166 | SS | 4,935,728 | 4,431,600 | 7 | 480 | 3,840 | 279 | 1.114 | 131,856 | 0 |
| climbRounds 32 |  | SW | 8,250,940 | 8,344,200 | 19 | 1,320 | 3,840 | 571 | 0.989 | 109,005 | 0 |
| climbRounds 32 |  | MX | 8,443,234 | 8,706,000 | 25 | 1,584 | 3,840 | 660 | 0.970 | 100,404 | 0 |
| climbRounds 40 | 178 | SS | 4,935,728 | 4,431,600 | 7 | 480 | 3,840 | 279 | 1.114 | 131,856 | 0 |
| climbRounds 40 |  | SW | 8,250,940 | 8,344,200 | 19 | 1,320 | 3,840 | 571 | 0.989 | 109,005 | 0 |
| climbRounds 40 |  | MX | 8,443,234 | 8,706,000 | 25 | 1,584 | 3,840 | 660 | 0.970 | 100,404 | 0 |
| climbRounds 48 | 208 | SS | 4,935,728 | 4,431,600 | 7 | 480 | 3,840 | 279 | 1.114 | 131,856 | 0 |
| climbRounds 48 |  | SW | 8,250,940 | 8,344,200 | 19 | 1,320 | 3,840 | 571 | 0.989 | 109,005 | 0 |
| climbRounds 48 |  | MX | 8,443,234 | 8,706,000 | 25 | 1,584 | 3,840 | 660 | 0.970 | 100,404 | 0 |
| climbRounds 64 | 197 | SS | 4,935,728 | 4,431,600 | 7 | 480 | 3,840 | 279 | 1.114 | 131,856 | 0 |
| climbRounds 64 |  | SW | 8,250,940 | 8,344,200 | 19 | 1,320 | 3,840 | 571 | 0.989 | 109,005 | 0 |
| climbRounds 64 |  | MX | 8,443,234 | 8,706,000 | 25 | 1,584 | 3,840 | 660 | 0.970 | 100,404 | 0 |
| climbRounds 128 | 232 | SS | 4,935,728 | 4,431,600 | 7 | 480 | 3,840 | 279 | 1.114 | 131,856 | 0 |
| climbRounds 128 |  | SW | 8,250,940 | 8,344,200 | 19 | 1,320 | 3,840 | 571 | 0.989 | 109,005 | 0 |
| climbRounds 128 |  | MX | 8,443,234 | 8,706,000 | 25 | 1,584 | 3,840 | 660 | 0.970 | 100,404 | 0 |
| climbRounds 256 | 308 | SS | 4,935,728 | 4,431,600 | 7 | 480 | 3,840 | 279 | 1.114 | 131,856 | 0 |
| climbRounds 256 |  | SW | 8,250,940 | 8,344,200 | 19 | 1,320 | 3,840 | 571 | 0.989 | 109,005 | 0 |
| climbRounds 256 |  | MX | 8,443,234 | 8,706,000 | 25 | 1,584 | 3,840 | 660 | 0.970 | 100,404 | 0 |
| climbRounds 1,024 | 471 | SS | 4,935,728 | 4,431,600 | 7 | 480 | 3,840 | 279 | 1.114 | 131,856 | 0 |
| climbRounds 1,024 |  | SW | 8,250,940 | 8,344,200 | 19 | 1,320 | 3,840 | 571 | 0.989 | 109,005 | 0 |
| climbRounds 1,024 |  | MX | 8,443,234 | 8,706,000 | 25 | 1,584 | 3,840 | 660 | 0.970 | 100,404 | 0 |
| retypeExhaustive 10,000 | 203 | SS | 4,935,728 | 4,431,600 | 7 | 480 | 3,840 | 279 | 1.114 | 131,856 | 0 |
| retypeExhaustive 10,000 |  | SW | 8,250,940 | 8,344,200 | 19 | 1,320 | 3,840 | 571 | 0.989 | 109,005 | 0 |
| retypeExhaustive 10,000 |  | MX | 8,443,234 | 8,706,000 | 25 | 1,584 | 3,840 | 660 | 0.970 | 100,404 | 0 |
| retypeExhaustive 20,000 | 176 | SS | 4,935,728 | 4,431,600 | 7 | 480 | 3,840 | 279 | 1.114 | 131,856 | 0 |
| retypeExhaustive 20,000 |  | SW | 8,250,940 | 8,344,200 | 19 | 1,320 | 3,840 | 571 | 0.989 | 109,005 | 0 |
| retypeExhaustive 20,000 |  | MX | 8,443,234 | 8,706,000 | 25 | 1,584 | 3,840 | 660 | 0.970 | 100,404 | 0 |
| retypeExhaustive 40,000 | 246 | SS | 4,935,728 | 4,431,600 | 7 | 480 | 3,840 | 279 | 1.114 | 131,856 | 0 |
| retypeExhaustive 40,000 |  | SW | 8,250,940 | 8,344,200 | 19 | 1,320 | 3,840 | 571 | 0.989 | 109,005 | 0 |
| retypeExhaustive 40,000 |  | MX | 8,443,234 | 8,706,000 | 25 | 1,584 | 3,840 | 660 | 0.970 | 100,404 | 0 |
| retypeClimbSteps 240 | 186 | SS | 4,935,728 | 4,431,600 | 7 | 480 | 3,840 | 279 | 1.114 | 131,856 | 0 |
| retypeClimbSteps 240 |  | SW | 8,250,940 | 8,344,200 | 19 | 1,320 | 3,840 | 571 | 0.989 | 109,005 | 0 |
| retypeClimbSteps 240 |  | MX | 8,443,234 | 8,706,000 | 25 | 1,584 | 3,840 | 660 | 0.970 | 100,404 | 0 |

- climbRounds 24, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 32, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 40, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 48, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 64, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 128, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 256, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 1,024, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 10,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 20,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 40,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeClimbSteps 240, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0

## his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90)

| level | ms | stop | damage | silver | hired burned | gold | dragon coins | queue h | dmg/silver | dmg/hired | rated vs ×1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ×1 | 223 | HS | 8,211,151 | 6,132,900 | 5 | 352 | 3,960 | 375 | 1.339 | 317,110 | — |
| ×1 |  | SW | 11,485,771 | 8,092,800 | 8 | 544 | 5,760 | 507 | 1.419 | 422,679 | — |
| ×1 |  | MX | 11,756,170 | 8,698,800 | 14 | 808 | 4,320 | 663 | 1.351 | 265,799 | — |
| climbRounds 24 | 218 | HS | 8,211,151 | 6,132,900 | 5 | 352 | 3,960 | 375 | 1.339 | 317,110 | 0 |
| climbRounds 24 |  | SW | 11,485,771 | 8,092,800 | 8 | 544 | 5,760 | 507 | 1.419 | 422,679 | 0 |
| climbRounds 24 |  | MX | 11,756,170 | 8,698,800 | 14 | 808 | 4,320 | 663 | 1.351 | 265,799 | 0 |
| climbRounds 32 | 224 | HS | 8,211,151 | 6,132,900 | 5 | 352 | 3,960 | 375 | 1.339 | 317,110 | 0 |
| climbRounds 32 |  | SW | 11,485,771 | 8,092,800 | 8 | 544 | 5,760 | 507 | 1.419 | 422,679 | 0 |
| climbRounds 32 |  | MX | 11,756,170 | 8,698,800 | 14 | 808 | 4,320 | 663 | 1.351 | 265,799 | 0 |
| climbRounds 40 | 266 | HS | 8,211,151 | 6,132,900 | 5 | 352 | 3,960 | 375 | 1.339 | 317,110 | 0 |
| climbRounds 40 |  | SW | 11,485,771 | 8,092,800 | 8 | 544 | 5,760 | 507 | 1.419 | 422,679 | 0 |
| climbRounds 40 |  | MX | 11,756,170 | 8,698,800 | 14 | 808 | 4,320 | 663 | 1.351 | 265,799 | 0 |
| climbRounds 48 | 286 | HS | 8,211,151 | 6,132,900 | 5 | 352 | 3,960 | 375 | 1.339 | 317,110 | 0 |
| climbRounds 48 |  | SW | 11,485,771 | 8,092,800 | 8 | 544 | 5,760 | 507 | 1.419 | 422,679 | 0 |
| climbRounds 48 |  | MX | 11,756,170 | 8,698,800 | 14 | 808 | 4,320 | 663 | 1.351 | 265,799 | 0 |
| climbRounds 64 | 279 | HS | 8,211,151 | 6,132,900 | 5 | 352 | 3,960 | 375 | 1.339 | 317,110 | 0 |
| climbRounds 64 |  | SW | 11,485,771 | 8,092,800 | 8 | 544 | 5,760 | 507 | 1.419 | 422,679 | 0 |
| climbRounds 64 |  | MX | 11,756,170 | 8,698,800 | 14 | 808 | 4,320 | 663 | 1.351 | 265,799 | 0 |
| climbRounds 128 | 373 | HS | 8,211,151 | 6,132,900 | 5 | 352 | 3,960 | 375 | 1.339 | 317,110 | 0 |
| climbRounds 128 |  | SW | 11,485,771 | 8,092,800 | 8 | 544 | 5,760 | 507 | 1.419 | 422,679 | 0 |
| climbRounds 128 |  | MX | 11,756,170 | 8,698,800 | 14 | 808 | 4,320 | 663 | 1.351 | 265,799 | 0 |
| climbRounds 256 | 540 | HS | 8,211,151 | 6,132,900 | 5 | 352 | 3,960 | 375 | 1.339 | 317,110 | 0 |
| climbRounds 256 |  | SW | 11,485,771 | 8,092,800 | 8 | 544 | 5,760 | 507 | 1.419 | 422,679 | 0 |
| climbRounds 256 |  | MX | 11,756,170 | 8,698,800 | 14 | 808 | 4,320 | 663 | 1.351 | 265,799 | 0 |
| climbRounds 1,024 | 717 | HS | 8,211,151 | 6,132,900 | 5 | 352 | 3,960 | 375 | 1.339 | 317,110 | 0 |
| climbRounds 1,024 |  | SW | 11,485,771 | 8,092,800 | 8 | 544 | 5,760 | 507 | 1.419 | 422,679 | 0 |
| climbRounds 1,024 |  | MX | 11,756,170 | 8,698,800 | 14 | 808 | 4,320 | 663 | 1.351 | 265,799 | 0 |
| retypeExhaustive 10,000 | 231 | HS | 8,211,151 | 6,132,900 | 5 | 352 | 3,960 | 375 | 1.339 | 317,110 | 0 |
| retypeExhaustive 10,000 |  | SW | 11,485,771 | 8,092,800 | 8 | 544 | 5,760 | 507 | 1.419 | 422,679 | 0 |
| retypeExhaustive 10,000 |  | MX | 11,756,170 | 8,698,800 | 14 | 808 | 4,320 | 663 | 1.351 | 265,799 | 0 |
| retypeExhaustive 20,000 | 215 | HS | 8,211,151 | 6,132,900 | 5 | 352 | 3,960 | 375 | 1.339 | 317,110 | 0 |
| retypeExhaustive 20,000 |  | SW | 11,485,771 | 8,092,800 | 8 | 544 | 5,760 | 507 | 1.419 | 422,679 | 0 |
| retypeExhaustive 20,000 |  | MX | 11,756,170 | 8,698,800 | 14 | 808 | 4,320 | 663 | 1.351 | 265,799 | 0 |
| retypeExhaustive 40,000 | 297 | HS | 8,211,151 | 6,132,900 | 5 | 352 | 3,960 | 375 | 1.339 | 317,110 | 0 |
| retypeExhaustive 40,000 |  | SW | 11,485,771 | 8,092,800 | 8 | 544 | 5,760 | 507 | 1.419 | 422,679 | 0 |
| retypeExhaustive 40,000 |  | MX | 11,756,170 | 8,698,800 | 14 | 808 | 4,320 | 663 | 1.351 | 265,799 | 0 |
| retypeClimbSteps 240 | 232 | HS | 8,211,151 | 6,132,900 | 5 | 352 | 3,960 | 375 | 1.339 | 317,110 | 0 |
| retypeClimbSteps 240 |  | SW | 11,485,771 | 8,092,800 | 8 | 544 | 5,760 | 507 | 1.419 | 422,679 | 0 |
| retypeClimbSteps 240 |  | MX | 11,756,170 | 8,698,800 | 14 | 808 | 4,320 | 663 | 1.351 | 265,799 | 0 |

- climbRounds 24, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 32, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 40, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 48, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 64, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 128, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 256, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 1,024, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 10,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 20,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 40,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeClimbSteps 240, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0

## his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14)

| level | ms | stop | damage | silver | hired burned | gold | dragon coins | queue h | dmg/silver | dmg/hired | rated vs ×1 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ×1 | 226 | SW | 16,842,084 | 9,480,000 | 4 | 18,384 | 10,080 | 711 | 1.777 | 489,636 | — |
| ×1 |  | AI | 17,086,508 | 9,479,200 | 6 | 18,397 | 10,080 | 711 | 1.803 | 367,227 | — |
| climbRounds 24 | 213 | SW | 16,842,084 | 9,480,000 | 4 | 18,384 | 10,080 | 711 | 1.777 | 489,636 | 0 |
| climbRounds 24 |  | AI | 17,086,508 | 9,479,200 | 6 | 18,397 | 10,080 | 711 | 1.803 | 367,227 | 0 |
| climbRounds 32 | 231 | SW | 16,842,084 | 9,480,000 | 4 | 18,384 | 10,080 | 711 | 1.777 | 489,636 | 0 |
| climbRounds 32 |  | AI | 17,086,508 | 9,479,200 | 6 | 18,397 | 10,080 | 711 | 1.803 | 367,227 | 0 |
| climbRounds 40 | 231 | SW | 16,842,084 | 9,480,000 | 4 | 18,384 | 10,080 | 711 | 1.777 | 489,636 | 0 |
| climbRounds 40 |  | AI | 17,086,508 | 9,479,200 | 6 | 18,397 | 10,080 | 711 | 1.803 | 367,227 | 0 |
| climbRounds 48 | 277 | SW | 16,842,084 | 9,480,000 | 4 | 18,384 | 10,080 | 711 | 1.777 | 489,636 | 0 |
| climbRounds 48 |  | AI | 17,086,508 | 9,479,200 | 6 | 18,397 | 10,080 | 711 | 1.803 | 367,227 | 0 |
| climbRounds 64 | 262 | SW | 16,842,084 | 9,480,000 | 4 | 18,384 | 10,080 | 711 | 1.777 | 489,636 | 0 |
| climbRounds 64 |  | AI | 17,086,508 | 9,479,200 | 6 | 18,397 | 10,080 | 711 | 1.803 | 367,227 | 0 |
| climbRounds 128 | 337 | SW | 16,842,084 | 9,480,000 | 4 | 18,384 | 10,080 | 711 | 1.777 | 489,636 | 0 |
| climbRounds 128 |  | AI | 17,086,508 | 9,479,200 | 6 | 18,397 | 10,080 | 711 | 1.803 | 367,227 | 0 |
| climbRounds 256 | 546 | SW | 16,842,084 | 9,480,000 | 4 | 18,384 | 10,080 | 711 | 1.777 | 489,636 | 0 |
| climbRounds 256 |  | AI | 17,086,508 | 9,479,200 | 6 | 18,397 | 10,080 | 711 | 1.803 | 367,227 | 0 |
| climbRounds 1,024 | 1,736 | SW | 16,842,084 | 9,480,000 | 4 | 18,384 | 10,080 | 711 | 1.777 | 489,636 | 0 |
| climbRounds 1,024 |  | AI | 17,086,508 | 9,479,200 | 6 | 18,397 | 10,080 | 711 | 1.803 | 367,227 | 0 |
| retypeExhaustive 10,000 | 346 | SW | 16,842,084 | 9,480,000 | 4 | 18,384 | 10,080 | 711 | 1.777 | 489,636 | 0 |
| retypeExhaustive 10,000 |  | AI | 17,086,508 | 9,479,200 | 6 | 18,397 | 10,080 | 711 | 1.803 | 367,227 | 0 |
| retypeExhaustive 20,000 | 313 | SW | 16,842,084 | 9,480,000 | 4 | 18,384 | 10,080 | 711 | 1.777 | 489,636 | 0 |
| retypeExhaustive 20,000 |  | AI | 17,086,508 | 9,479,200 | 6 | 18,397 | 10,080 | 711 | 1.803 | 367,227 | 0 |
| retypeExhaustive 40,000 | 293 | SW | 16,842,084 | 9,480,000 | 4 | 18,384 | 10,080 | 711 | 1.777 | 489,636 | 0 |
| retypeExhaustive 40,000 |  | AI | 17,086,508 | 9,479,200 | 6 | 18,397 | 10,080 | 711 | 1.803 | 367,227 | 0 |
| retypeClimbSteps 240 | 207 | SW | 16,842,084 | 9,480,000 | 4 | 18,384 | 10,080 | 711 | 1.777 | 489,636 | 0 |
| retypeClimbSteps 240 |  | AI | 17,086,508 | 9,479,200 | 6 | 18,397 | 10,080 | 711 | 1.803 | 367,227 | 0 |

- climbRounds 24, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 32, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 40, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 48, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 64, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 128, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 256, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- climbRounds 1,024, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 10,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 20,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeExhaustive 40,000, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0
- retypeClimbSteps 240, the bar's best against ×1's: most damage 0 · least silver 0 · fewest hired 0 · dmg/silver 0 · dmg/hired 0

## Summary against ×1

| level | stops better | equal | worse | new | dropped | best gain (rated) | worst (rated) | armies whose bar best moved, better / worse | planner total |
|---|---|---|---|---|---|---|---|---|---|
| ×1 | 0 | 0 | 0 | 0 | 0 | — | — | most damage 0/0 · least silver 0/0 · fewest hired 0/0 · dmg/silver 0/0 · dmg/hired 0/0 | 2,335 ms |
| climbRounds 24 | 0 | 63 | 0 | 0 | 0 | — | — | most damage 0/0 · least silver 0/0 · fewest hired 0/0 · dmg/silver 0/0 · dmg/hired 0/0 | 2,117 ms |
| climbRounds 32 | 0 | 63 | 0 | 0 | 0 | — | — | most damage 0/0 · least silver 0/0 · fewest hired 0/0 · dmg/silver 0/0 · dmg/hired 0/0 | 2,198 ms |
| climbRounds 40 | 0 | 63 | 0 | 0 | 0 | — | — | most damage 0/0 · least silver 0/0 · fewest hired 0/0 · dmg/silver 0/0 · dmg/hired 0/0 | 2,393 ms |
| climbRounds 48 | 0 | 63 | 0 | 0 | 0 | — | — | most damage 0/0 · least silver 0/0 · fewest hired 0/0 · dmg/silver 0/0 · dmg/hired 0/0 | 2,439 ms |
| climbRounds 64 | 1 | 60 | 1 | 0 | 1 | +6.284 live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) · SW | −132.783 live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) · MX | most damage 1/0 · least silver 0/0 · fewest hired 0/0 · dmg/silver 0/1 · dmg/hired 0/0 | 2,653 ms |
| climbRounds 128 | 1 | 60 | 1 | 0 | 1 | +6.284 live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) · SW | −132.783 live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) · MX | most damage 1/0 · least silver 0/0 · fewest hired 0/0 · dmg/silver 0/1 · dmg/hired 0/0 | 3,414 ms |
| climbRounds 256 | 2 | 55 | 4 | 0 | 2 | +6.284 live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) · SW | −132.783 live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) · MX | most damage 1/1 · least silver 1/0 · fewest hired 1/0 · dmg/silver 0/2 · dmg/hired 0/1 | 4,742 ms |
| climbRounds 1,024 | 2 | 52 | 6 | 1 | 3 | +6.284 live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) · SW | −132.783 live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) · MX | most damage 2/1 · least silver 1/0 · fewest hired 1/0 · dmg/silver 0/2 · dmg/hired 0/1 | 13,347 ms |
| retypeExhaustive 10,000 | 12 | 51 | 0 | 0 | 0 | +0.351 live account of 2026-09-18 (one hired type, 20 000 leadership) · SW | — | most damage 1/0 · least silver 2/0 · fewest hired 0/0 · dmg/silver 3/0 · dmg/hired 0/0 | 3,752 ms |
| retypeExhaustive 20,000 | 12 | 51 | 0 | 0 | 0 | +0.351 live account of 2026-09-18 (one hired type, 20 000 leadership) · SW | — | most damage 1/0 · least silver 2/0 · fewest hired 0/0 · dmg/silver 3/0 · dmg/hired 0/0 | 3,415 ms |
| retypeExhaustive 40,000 | 12 | 51 | 0 | 0 | 0 | +0.351 live account of 2026-09-18 (one hired type, 20 000 leadership) · SW | — | most damage 1/0 · least silver 2/0 · fewest hired 0/0 · dmg/silver 3/0 · dmg/hired 0/0 | 3,924 ms |
| retypeClimbSteps 240 | 0 | 63 | 0 | 0 | 0 | — | — | most damage 0/0 · least silver 0/0 · fewest hired 0/0 · dmg/silver 0/0 · dmg/hired 0/0 | 2,048 ms |
