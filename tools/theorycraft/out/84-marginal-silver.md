
## 1. The 4× silver is not buying mercenaries — it is buying troops

Both of the owner’s rows field **35 · 40 · 40 · 20 hired**. A troop stack is a sponge: the enemy kills highest-HP-first, one stack per attack, and every stack that survives an attack strikes. So silver spent on troops buys **strikes for the mercenaries**, and that is the only thing silver buys here.

| horizon | point | troops a march | hired a march | stacks | damage a march | silver a march |
|---|---|---|---|---|---|---|
| 10 | **mostEfficient** | 297 | 135 | 5 | 2,492,896 | 415,800 |
| 10 | **recommend** | 2,185 | 135 | 7 | 4,638,724 | 1,708,300 |
| 10 | **knee** | 3,007 | 150 | 7 | 5,140,277 | 2,351,100 |
| 3 | **mostEfficient** | 498 | 223 | 5 | 4,127,467 | 697,200 |
| 3 | **recommend** | 2,370 | 227 | 6 | 5,983,998 | 1,646,700 |
| 3 | **knee** | 3,017 | 250 | 6 | 6,316,748 | 2,096,200 |

## 2. The silver curve at horizon 10 — what the next slice buys

13 buckets, cheapest first. `planCampaign` keeps **the most damage found at each silver bucket**, so consecutive rows are neighbours on the real trade and the marginal column is honest: `(damage₂ − damage₁) / (silver₂ − silver₁)`. The average is what the whole spend returns; the **marginal** is what the *next* million returns, and it is the one that decides where to stop.

| # | campaign silver | campaign damage | avg damage a silver | **marginal** | hired lost |
|---|---|---|---|---|---|
| 1 | 3,079,000 | 11,322,172 | 3.68 | **—** | 62 |
| 2 | 3,583,000 | 11,573,308 | 3.23 | **0.50** | 62 |
| 3 | 4,410,800 | 15,666,218 | 3.55 | **4.94** | 78 |
| 4 | 5,083,100 | 20,580,296 | 4.05 | **7.31** | 118 |
| 5 | 5,970,700 | 27,457,044 | 4.60 | **7.75** | 142 |
| 6 | 7,290,100 | 30,428,859 | 4.17 | **2.25** | 150 |
| 7 | 8,524,900 | 31,044,144 | 3.64 | **0.50** | 150 |
| 8 | 10,812,700 | 36,772,251 | 3.40 | **2.50** | 142 |
| 9 | 13,240,000 | 38,538,876 | 2.91 | **0.73** | 150 |
| 10 | 15,762,700 | 44,210,445 | 2.80 | **2.25** | 142 |
| 11 | 19,138,600 | 46,424,346 | 2.43 | **0.66** | 142 |
| 12 | 22,986,100 | 50,857,293 | 2.21 | **1.15** | 150 |
| 13 | 23,498,200 | 51,191,589 | 2.18 | **0.65** | 150 |

## 2. The silver curve at horizon 3 — what the next slice buys

8 buckets, cheapest first. `planCampaign` keeps **the most damage found at each silver bucket**, so consecutive rows are neighbours on the real trade and the marginal column is honest: `(damage₂ − damage₁) / (silver₂ − silver₁)`. The average is what the whole spend returns; the **marginal** is what the *next* million returns, and it is the one that decides where to stop.

| # | campaign silver | campaign damage | avg damage a silver | **marginal** | hired lost |
|---|---|---|---|---|---|
| 1 | 2,594,200 | 8,636,702 | 3.33 | **—** | 39 |
| 2 | 3,116,800 | 11,874,017 | 3.81 | **6.19** | 61 |
| 3 | 3,456,000 | 14,241,958 | 4.12 | **6.98** | 72 |
| 4 | 4,163,200 | 15,365,990 | 3.69 | **1.59** | 78 |
| 5 | 5,313,000 | 17,800,374 | 3.35 | **2.12** | 72 |
| 6 | 6,412,300 | 18,532,900 | 2.89 | **0.67** | 74 |
| 7 | 7,401,500 | 19,159,486 | 2.59 | **0.63** | 74 |
| 8 | 8,184,000 | 17,369,498 | 2.12 | **-2.29** | 78 |

## 3. Horizon 3 against horizon 10, played for real

The owner’s own cadence: an epic event every three days, about three marches each. Both plans are played with the game’s decay and `simulateBattle`, beside the best single march (the priority search) for reference.

| strategy | what a march fields (hired) | marches fought | **campaign damage** | silver spent | hired lost | damage a silver |
|---|---|---|---|---|---|---|
| the plan at horizon 10 | 135 | 10 | **46,118,086** | 17,083,000 | 140 | 2.70 |
| the plan at horizon 3 | 227 | 3 | **17,417,875** | 4,940,100 | 70 | 3.53 |
| the best single march | 277 | 3 | **14,205,005** | 3,908,700 | 81 | 3.63 |
| the best single march | 277 | 10 | **37,958,896** | 13,029,000 | 193 | 2.91 |

**Per march, which is what the cadence actually asks:** the plan at horizon 3 fields 5,983,998 damage a march against horizon 10's 4,638,724 — the same engine, the same army, three marches instead of ten.
