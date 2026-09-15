
## 1. What the plan decided

| | epic-monster-hunter-6 | arbalester-6 | legionary-6 | chariot-6 |
|---|---|---|---|---|
| held | 92 | 76 | 72 | 37 |
| authority a unit costs | 1 | 1 | 1 | 2 |
| **the plan's repeated march** | **35** | **40** | **40** | **20** |
| its final march | 56 | 40 | 36 | 19 |
| authority the march spends | 155 of 2,000 |
| marches | 10 |
| damage a march (the plan's own arithmetic) | 4,488,244 |
| campaign total | 45,415,176 |

## 2. What each rule allows a *repeated* march to field

A march is repeated 9 times, so a count has to last that long: `lastsMarches` is `floor((held − n) / ceil(n/10)) + 1`.

| type | held | the plan fields | what lasts 9 marches | what lasts 1 march |
|---|---|---|---|---|
| epic-monster-hunter-6 | 92 | 35 | 50 | 92 |
| arbalester-6 | 76 | 40 | 40 | 76 |
| legionary-6 | 72 | 40 | 40 | 72 |
| chariot-6 | 37 | 20 | 20 | 37 |

**Authority the whole stock would cost: 314, against the 2,000 the march may spend.**

## 3. What the real battle pays for fielding more (the engine’s own `simulateBattle`)

Each row takes the plan’s own march and raises **one** type, leaving the rest as the plan set them. `marchResult` builds the stacks and runs the real battle, so this is what the game would do.

| type | count | authority spent | damage (real battle) | vs the plan | strikes | mercs lost |
|---|---|---|---|---|---|---|

| epic-monster-hunter-6 | 64 | 184 | **4,608,857** | 120,613 | 8 | 0 |
| epic-monster-hunter-6 | 50 | 170 | **4,718,736** | 230,492 | 8 | 0 |
| epic-monster-hunter-6 | 92 | 212 | **4,864,069** | 375,825 | 8 | 0 |
| arbalester-6 | 40 | 155 | **4,488,244** | 0 | 8 | 0 |
| arbalester-6 | 58 | 173 | **4,761,844** | 273,600 | 8 | 0 |
| arbalester-6 | 76 | 191 | **4,676,094** | 187,850 | 8 | 0 |
| legionary-6 | 40 | 155 | **4,488,244** | 0 | 8 | 0 |
| legionary-6 | 56 | 171 | **4,816,564** | 328,320 | 8 | 0 |
| legionary-6 | 72 | 187 | **4,812,514** | 324,270 | 8 | 0 |
| chariot-6 | 20 | 155 | **4,488,244** | 0 | 8 | 0 |
| chariot-6 | 29 | 173 | **4,756,030** | 267,786 | 8 | 0 |
| chariot-6 | 37 | 189 | **4,661,863** | 173,619 | 8 | 0 |

## 4. Every plan on the frontier, type by type — where a hired type goes to zero

The slider walks the frontier, and each stop is its own count vector. A type at **0** is a type that plan decided not to hire at all — which is what "some mercs not used" looks like on screen, and why putting one back and then moving the bar moves it out again.

| # | label | epic-monster-hunter-6 | arbalester-6 | legionary-6 | chariot-6 | marches | damage a march | silver a march |
|---|---|---|---|---|---|---|---|---|
| 1 | 3 stacks · 135 hired · 1.7M silver a march | 35 | 40 | 40 | 20 | 10 | 4,488,244 | 1,708,300 |
| 2 | 4 stacks · 80 hired · 1.8M silver a march | 10 | 28 | 28 | 14 | 10 | 3,434,728 | 1,845,500 |
| 3 | 3 stacks · 150 hired · 2M silver a march | 50 | 40 | 40 | 20 | 10 | 4,910,056 | 1,999,500 |
| 4 | 3 stacks · 95 hired · 2.3M silver a march **(1 at 0)** | 35 | 40 | **0** | 20 | 10 | 3,959,259 | 2,256,900 |
| 5 | 3 stacks · 150 hired · 2.4M silver a march | 50 | 40 | 40 | 20 | 10 | 5,140,277 | 2,351,100 |

1 of 5 plans on the frontier field none of at least one hired type. The recommended plan is not one of them; `leftOut` = 14, `binding` = {"silver":false,"mercenaries":false,"leadership":false,"marches":true}.

## 4b. How often a plan drops a whole type, as the frontier widens

The app asks for four rows (`CAMPAIGN.planAlternatives`); the engine also carries its own picks. A wider request shows how common the hole is.

| rows asked | plans on the frontier | of them, plans dropping a whole hired type |
|---|---|---|
| 4 | 5 | 1 |
| 8 | 9 | 0 |
| 12 | 13 | 1 |
| 24 | 25 | 3 |

## 5. The owner’s own proposal: a little of every type instead of none of one

Owner, 2026-09-15: *"We’re often leaving out one merc as a whole and it would be better to have a little of all of them… then also the march is more repeatable."* Tested on each frontier point that drops a type: the missing type is given a token count — 1, 5, 10, and the most that lasts the horizon — with **everything else left as the plan set it**, and the real battle is replayed.

**3 stacks · 110 hired · 2M silver a march** — fields none of legionary-6. Real battle, everything else unchanged:

| legionary-6 fielded | damage | vs the plan | strikes | lasts marches |
|---|---|---|---|---|
| 1 | **4,036,430** | +22,230 | 8 | 72 |
| 5 | **4,125,350** | +111,150 | 8 | 68 |
| 10 | **4,236,500** | +222,300 | 8 | 63 |
| 20 | **4,458,800** | +444,600 | 8 | 27 |
| 40 | **4,903,400** | +889,200 | 8 | 9 |

(None of legionary-6: 4,014,200 damage.)

**3 stacks · 83 hired · 2.3M silver a march** — fields none of legionary-6. Real battle, everything else unchanged:

| legionary-6 fielded | damage | vs the plan | strikes | lasts marches |
|---|---|---|---|---|
| 1 | **3,583,509** | +22,230 | 8 | 72 |
| 5 | **3,672,429** | +111,150 | 8 | 68 |
| 10 | **3,783,579** | +222,300 | 8 | 63 |
| 20 | **4,005,879** | +444,600 | 8 | 27 |
| 40 | **4,643,908** | +1,082,629 | 8 | 9 |

(None of legionary-6: 3,561,279 damage.)

**3 stacks · 95 hired · 2.3M silver a march** — fields none of legionary-6. Real battle, everything else unchanged:

| legionary-6 fielded | damage | vs the plan | strikes | lasts marches |
|---|---|---|---|---|
| 1 | **3,981,489** | +22,230 | 8 | 72 |
| 5 | **4,070,409** | +111,150 | 8 | 68 |
| 10 | **4,181,559** | +222,300 | 8 | 63 |
| 20 | **4,403,859** | +444,600 | 8 | 27 |
| 40 | **4,848,459** | +889,200 | 8 | 9 |

(None of legionary-6: 3,959,259 damage.)
