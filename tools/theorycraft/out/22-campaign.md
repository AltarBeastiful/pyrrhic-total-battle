# B3 — the campaign: closed forms and the best plan under a silver budget

Authority 2,000, so the hired caps bind: EMH6 92 · ABT6 76 · LGN6 72 · CHR6 37. Every stack of a march dies; the Temple returns `n − ceil(n/10)` of each stack, so **each hired stack loses exactly `ceil(n/10)` units a march, for ever**. Troops cost silver and time and come back in full. That one asymmetry is the whole campaign problem.

## 1. Closed forms of the `ceil(n/10)` rule

### (iv) first, the loss table — why counts want to be multiples of ten

A stack of `n` loses `ceil(n/10)` units whatever `n` is inside the chunk. Fielding 41 costs the same five units as fielding 50: nine free units are left at home for nothing.

| n fielded | ceil(n/10) lost | units wasted vs the next multiple of 10 | loss rate |
|---|---|---|---|
| 10 | 1 | 0 | 10.0 % |
| 11 | 2 | 9 | 18.2 % |
| 19 | 2 | 1 | 10.5 % |
| 20 | 2 | 0 | 10.0 % |
| 21 | 3 | 9 | 14.3 % |
| 29 | 3 | 1 | 10.3 % |
| 30 | 3 | 0 | 10.0 % |
| 31 | 4 | 9 | 12.9 % |
| 40 | 4 | 0 | 10.0 % |
| 41 | 5 | 9 | 12.2 % |
| 49 | 5 | 1 | 10.2 % |
| 50 | 5 | 0 | 10.0 % |
| 51 | 6 | 9 | 11.8 % |
| 76 | 8 | 4 | 10.5 % |
| 80 | 8 | 0 | 10.0 % |
| 92 | 10 | 8 | 10.9 % |

**Rule:** always field a multiple of ten of every hired type. At 41 the loss rate is 12.2 %; at 50 it is 10.0 % for 22 % more damage-carrying units.
### (i) how many marches a given `n` sustains

The first march is free of the slack, and every whole `ceil(n/10)` of slack above `n` buys one more:

```
marches(cap0, n) = floor((cap0 − n) / ceil(n/10)) + 1        (n ≤ cap0)
```

| stock cap0 | n fielded | ceil(n/10) | closed form | simulated | agree |
|---|---|---|---|---|---|
| 92 | 92 | 10 | 1 | 1 | ✓ |
| 92 | 46 | 5 | 10 | 10 | ✓ |
| 92 | 28 | 3 | 22 | 22 | ✓ |
| 92 | 20 | 2 | 37 | 37 | ✓ |
| 92 | 10 | 1 | 83 | 83 | ✓ |
| 76 | 76 | 8 | 1 | 1 | ✓ |
| 76 | 38 | 4 | 10 | 10 | ✓ |
| 76 | 23 | 3 | 18 | 18 | ✓ |
| 76 | 20 | 2 | 29 | 29 | ✓ |
| 76 | 10 | 1 | 67 | 67 | ✓ |
| 72 | 72 | 8 | 1 | 1 | ✓ |
| 72 | 36 | 4 | 10 | 10 | ✓ |
| 72 | 22 | 3 | 17 | 17 | ✓ |
| 72 | 20 | 2 | 27 | 27 | ✓ |
| 72 | 10 | 1 | 63 | 63 | ✓ |
| 37 | 37 | 4 | 1 | 1 | ✓ |
| 37 | 19 | 2 | 10 | 10 | ✓ |
| 37 | 11 | 2 | 14 | 14 | ✓ |
| 37 | 20 | 2 | 9 | 9 | ✓ |
| 37 | 10 | 1 | 28 | 28 | ✓ |

Closed form and simulation agree on every row: **yes**.
### (ii) the sustaining fraction for M marches is about 10/(M+9)

M marches at a constant `n` need `n + (M−1)·ceil(n/10) ≤ cap0`. Dropping the ceiling, `n(1 + (M−1)/10) ≤ cap0`, i.e.

```
f = n / cap0 ≤ 10 / (M + 9)
```

The exact integer answer is the largest `n` with `marches(cap0, n) ≥ M`; it sits just above the continuous bound because the ceiling rounds the *loss* up, not the count.

| M marches | 10/(M+9) | exact max f (cap0 = 92) | exact n | n as a multiple of 10 | marches that n really gives |
|---|---|---|---|---|---|
| 1 | 1.0000 | 1.0000 | 92 | 90 | 1 |
| 2 | 0.9091 | 0.9022 | 83 | 80 | 2 |
| 3 | 0.8333 | 0.8261 | 76 | 70 | 4 |
| 4 | 0.7692 | 0.7609 | 70 | 70 | 4 |
| 5 | 0.7143 | 0.6957 | 64 | 60 | 6 |
| 6 | 0.6667 | 0.6522 | 60 | 60 | 6 |
| 8 | 0.5882 | 0.5435 | 50 | 50 | 9 |
| 10 | 0.5263 | 0.5109 | 47 | 40 | 14 |
| 12 | 0.4762 | 0.4348 | 40 | 40 | 14 |
| 15 | 0.4167 | 0.3913 | 36 | 30 | 21 |
| 20 | 0.3448 | 0.3261 | 30 | 30 | 21 |
| 25 | 0.2941 | 0.2174 | 20 | 20 | 37 |
| 30 | 0.2564 | 0.2174 | 20 | 20 | 37 |
### (iii) total hired units fielded over M marches, and the limit 10 × cap0

Fielding the sustaining `n = 10·cap0/(M+9)` M times puts `M·n = 10·cap0·M/(M+9)` hired units on the field in total. As M grows that tends to **10 × cap0**: because only a tenth of what you field is actually consumed, a stock of 92 can deliver about 920 unit-marches of damage — but only if you are willing to fight ~forever with tiny stacks.

| M | sustaining n (cap0 = 92) | total fielded M·n | % of the 920 limit |
|---|---|---|---|
| 1 | 92 | 92 | 10.0 % |
| 2 | 83 | 166 | 18.0 % |
| 3 | 76 | 228 | 24.8 % |
| 5 | 64 | 320 | 34.8 % |
| 10 | 47 | 470 | 51.1 % |
| 20 | 30 | 600 | 65.2 % |
| 30 | 20 | 600 | 65.2 % |
| 50 | 10 | 500 | 54.3 % |
| 100 | 0 | 0 | 0.0 % |
| 200 | 0 | 0 | 0.0 % |

This is the shape of the whole answer: **total damage rises with the number of marches and falls with the size of each**, and the product is what a budget has to be spent on.

## 1b. The same numbers out of `simulateCampaign`


Checked with the `elite` sizing, where the hired stacks go on top at their full caps (authority 2,000 does not bind), so "fielded" is exactly `marchTarget(cap, spend)` and the bookkeeping is visible.

| spend | EMH6 per march | closed-form marches | `simulateCampaign` marches at full size | EMH6 lost | EMH6 left |
|---|---|---|---|---|---|
| 100 % | 92 | 1 | 1 | 92 | 0 |
| 50 % | 46 | 10 | 10 | 92 | 0 |
| 30 % | 28 | 22 | 22 | 92 | 0 |
| 20 % | 19 | 37 | 37 | 92 | 0 |
| 10 % | 10 | 83 | 83 | 92 | 0 |

## 2. Best plan per silver budget (`searchComplete` vs a plain grid)


Campaign settings: at most 30 marches, silver budget S; a march whose retrain silver would push the running total past S is discarded and the campaign stops (`stoppedBy: "silver"`). Objective `avgDamage` = the sum of the marches' average damage. Spend levels 100 %, 75 %, 50 %, 40 %, 30 %, 25 %, 20 %, 15 %, 10 %.

## Scenario A (export bonuses)

### `searchComplete` (method × spend × every subset of the 12 types)

| budget S | marches | stopped by | method | spend | subset | total avg damage | silver used | gold | mercenaries left | evaluated | exhaustive | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2,000,000 | 1 | silver | msRelaxed | 75 % | ARC2 RD1 RD2 RD3 ABT6 CHR6 EMH6 LGN6 | 4,369,814 | 1,923,500 | 842 | EMH6 87 ABT6 71 LGN6 67 CHR6 34 | 110,781 | yes | 10,477 |
| 5,000,000 | 2 | silver | msRelaxed | 100 % | ARC2 RD2 RD3 ABT6 CHR6 EMH6 LGN6 | 10,751,842 | 4,723,000 | 2,657 | EMH6 76 ABT6 61 LGN6 57 CHR6 29 | 110,781 | yes | 12,583 |
| 10,000,000 | 5 | silver | msRelaxed | 75 % | ARC2 RD1 RD2 RD3 ABT6 CHR6 EMH6 LGN6 | 21,849,070 | 9,617,500 | 4,210 | EMH6 67 ABT6 51 LGN6 47 CHR6 22 | 110,781 | yes | 12,458 |
| 20,000,000 | 10 | silver | msRelaxed | 75 % | ARC2 RD1 RD2 RD3 ABT6 CHR6 EMH6 LGN6 | 40,064,916 | 19,235,000 | 7,807 | EMH6 42 ABT6 28 LGN6 26 CHR6 11 | 110,781 | yes | 11,687 |
| 40,000,000 | 24 | silver | msRelaxed | 30 % | ARC1 ARC2 RD1 RD2 RD3 SP1 SP2 SW1 ABT6 CHR6 EMH6 LGN6 | 71,430,216 | 39,218,400 | 8,040 | EMH6 44 ABT6 28 LGN6 24 CHR6 13 | 110,781 | yes | 10,760 |

### Plain grid: `simulateCampaign` over method × spend × three fixed subsets

| budget S | best method | spend | subset | marches | total avg damage | silver used | gold | EMH6/ABT6/LGN6/CHR6 left | grid as % of `searchComplete` |
|---|---|---|---|---|---|---|---|---|---|
| 2,000,000 | msRelaxed | 100 % | 8 types (owner's) | 1 | 4,257,493 | 1,924,300 | 842 | 87/71/67/34 | 97.4 % |
| 5,000,000 | elite | 100 % | 12 types | 3 | 11,482,385 | 4,902,300 | 3,927 | 65/54/51/26 | 106.8 % |
| 10,000,000 | msRelaxed | 100 % | 8 types (owner's) | 5 | 21,287,465 | 9,621,500 | 4,210 | 67/51/47/22 | 97.4 % |
| 20,000,000 | msRelaxed | 100 % | 8 types (owner's) | 10 | 38,941,706 | 19,243,000 | 7,807 | 42/28/26/11 | 97.2 % |
| 40,000,000 | msRelaxed | 100 % | 12 types | 24 | 71,430,216 | 39,218,400 | 8,040 | 44/28/24/13 | 100.0 % |

### The spend curve (7-type `msRelaxed`, every spend level, per budget)

The lever the correction of 2026-09-14 exposed: with authority no longer binding, **how much of the stock to field per march** is the decision, not how much authority to buy.

| spend | EMH6 target | S=2 M | S=5 M | S=10 M | S=20 M | S=40 M |
|---|---|---|---|---|---|---|
| 100 % | 92 | 0 M / 0m | 11 M / 2m | 20 M / 4m | 34 M / 8m | 51 M / 16m |
| 75 % | 69 | 0 M / 0m | 9 M / 2m | 18 M / 4m | 33 M / 8m | 51 M / 16m |
| 50 % | 46 | 0 M / 0m | 7 M / 2m | 13 M / 4m | 27 M / 8m | 49 M / 16m |
| 40 % | 37 | 0 M / 0m | 6 M / 2m | 11 M / 4m | 23 M / 8m | 45 M / 16m |
| 30 % | 28 | 0 M / 0m | 5 M / 2m | 10 M / 4m | 19 M / 8m | 38 M / 16m |
| 25 % | 23 | 0 M / 0m | 4 M / 2m | 8 M / 4m | 17 M / 8m | 34 M / 16m |
| 20 % | 19 | 0 M / 0m | 4 M / 2m | 8 M / 4m | 15 M / 8m | 30 M / 16m |
| 15 % | 14 | 0 M / 0m | 3 M / 2m | 6 M / 4m | 13 M / 8m | 26 M / 16m |
| 10 % | 10 | 0 M / 0m | 3 M / 2m | 6 M / 4m | 11 M / 8m | 22 M / 16m |

*(cell = total average damage in millions / marches fought)*
### The rounding effect: a cap-derived spend versus the nearest multiple of ten

`marchTarget(cap, spend) = max(1, ceil(spend × cap))` gives ragged counts (92 × 0.3 = 28), and 28 loses the same three units as 30 — nine units left at home for nothing. The last column is the one to read: **units fielded per unit of stock consumed**, which is the real exchange rate of a campaign.

| spend | ragged counts | ragged loss/march | ragged units/loss | rounded counts | rounded loss/march | rounded units/loss |
|---|---|---|---|---|---|---|
| 100 % | 92/76/72/37 | 30 | 9.23 | 92/76/72/37 | 30 | 9.23 |
| 75 % | 69/57/54/28 | 22 | 9.45 | 70/60/50/30 | 21 | 10.00 |
| 50 % | 46/38/36/19 | 15 | 9.27 | 50/40/40/20 | 15 | 10.00 |
| 40 % | 37/31/29/15 | 13 | 8.62 | 40/30/30/10 | 11 | 10.00 |
| 30 % | 28/23/22/12 | 11 | 7.73 | 30/20/20/10 | 8 | 10.00 |
| 25 % | 23/19/18/10 | 8 | 8.75 | 20/20/20/10 | 7 | 10.00 |
| 20 % | 19/16/15/8 | 7 | 8.29 | 20/20/10/10 | 6 | 10.00 |
| 15 % | 14/12/11/6 | 7 | 6.14 | 10/10/10/10 | 4 | 10.00 |
| 10 % | 10/8/8/4 | 4 | 7.50 | 10/10/10/10 | 4 | 10.00 |

## Scenario B (bonuses proven in game)

### `searchComplete` (method × spend × every subset of the 12 types)

| budget S | marches | stopped by | method | spend | subset | total avg damage | silver used | gold | mercenaries left | evaluated | exhaustive | ms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2,000,000 | 1 | silver | msRelaxed | 75 % | ARC1 ARC2 RD2 RD3 ABT6 CHR6 EMH6 LGN6 | 6,079,306 | 1,923,900 | 842 | EMH6 87 ABT6 71 LGN6 67 CHR6 34 | 110,781 | yes | 10,169 |
| 5,000,000 | 2 | silver | msRelaxed | 100 % | ARC2 RD2 RD3 ABT6 CHR6 EMH6 LGN6 | 15,152,056 | 4,723,000 | 2,657 | EMH6 76 ABT6 61 LGN6 57 CHR6 29 | 110,781 | yes | 10,997 |
| 10,000,000 | 5 | silver | msRelaxed | 75 % | ARC1 ARC2 RD2 RD3 ABT6 CHR6 EMH6 LGN6 | 30,396,530 | 9,619,500 | 4,210 | EMH6 67 ABT6 51 LGN6 47 CHR6 22 | 110,781 | yes | 10,217 |
| 20,000,000 | 10 | silver | msRelaxed | 75 % | ARC1 ARC2 RD2 RD3 ABT6 CHR6 EMH6 LGN6 | 56,246,733 | 19,239,000 | 7,807 | EMH6 42 ABT6 28 LGN6 26 CHR6 11 | 110,781 | yes | 9,958 |
| 40,000,000 | 22 | silver | ms | 40 % | ARC1 ARC2 RD2 RD3 SP1 SP2 ABT6 CHR6 EMH6 LGN6 | 97,947,354 | 39,628,600 | 9,970 | EMH6 26 ABT6 13 LGN6 10 CHR6 1 | 110,781 | yes | 9,739 |

### Plain grid: `simulateCampaign` over method × spend × three fixed subsets

| budget S | best method | spend | subset | marches | total avg damage | silver used | gold | EMH6/ABT6/LGN6/CHR6 left | grid as % of `searchComplete` |
|---|---|---|---|---|---|---|---|---|---|
| 2,000,000 | elite | 100 % | 12 types | 1 | 5,946,764 | 1,603,300 | 1,464 | 82/68/64/33 | 97.8 % |
| 5,000,000 | elite | 100 % | 12 types | 3 | 16,618,251 | 4,809,900 | 3,927 | 65/54/51/26 | 109.7 % |
| 10,000,000 | elite | 100 % | 12 types | 6 | 30,153,619 | 9,619,800 | 6,688 | 46/38/36/18 | 99.2 % |
| 20,000,000 | elite | 100 % | 12 types | 12 | 51,211,224 | 19,239,600 | 9,926 | 22/18/17/8 | 91.0 % |
| 40,000,000 | ms | 100 % | 12 types | 24 | 91,259,712 | 38,479,200 | 7,272 | 44/28/24/13 | 93.2 % |

### The spend curve (7-type `msRelaxed`, every spend level, per budget)

The lever the correction of 2026-09-14 exposed: with authority no longer binding, **how much of the stock to field per march** is the decision, not how much authority to buy.

| spend | EMH6 target | S=2 M | S=5 M | S=10 M | S=20 M | S=40 M |
|---|---|---|---|---|---|---|
| 100 % | 92 | 0 M / 0m | 15 M / 2m | 28 M / 4m | 49 M / 8m | 75 M / 16m |
| 75 % | 69 | 0 M / 0m | 13 M / 2m | 26 M / 4m | 47 M / 8m | 74 M / 16m |
| 50 % | 46 | 0 M / 0m | 10 M / 2m | 20 M / 4m | 39 M / 8m | 71 M / 16m |
| 40 % | 37 | 0 M / 0m | 8 M / 2m | 17 M / 4m | 34 M / 8m | 66 M / 16m |
| 30 % | 28 | 0 M / 0m | 7 M / 2m | 14 M / 4m | 29 M / 8m | 57 M / 16m |
| 25 % | 23 | 0 M / 0m | 6 M / 2m | 13 M / 4m | 26 M / 8m | 52 M / 16m |
| 20 % | 19 | 0 M / 0m | 6 M / 2m | 12 M / 4m | 23 M / 8m | 47 M / 16m |
| 15 % | 14 | 0 M / 0m | 5 M / 2m | 10 M / 4m | 21 M / 8m | 41 M / 16m |
| 10 % | 10 | 0 M / 0m | 5 M / 2m | 9 M / 4m | 18 M / 8m | 36 M / 16m |

*(cell = total average damage in millions / marches fought)*
### The rounding effect: a cap-derived spend versus the nearest multiple of ten

`marchTarget(cap, spend) = max(1, ceil(spend × cap))` gives ragged counts (92 × 0.3 = 28), and 28 loses the same three units as 30 — nine units left at home for nothing. The last column is the one to read: **units fielded per unit of stock consumed**, which is the real exchange rate of a campaign.

| spend | ragged counts | ragged loss/march | ragged units/loss | rounded counts | rounded loss/march | rounded units/loss |
|---|---|---|---|---|---|---|
| 100 % | 92/76/72/37 | 30 | 9.23 | 92/76/72/37 | 30 | 9.23 |
| 75 % | 69/57/54/28 | 22 | 9.45 | 70/60/50/30 | 21 | 10.00 |
| 50 % | 46/38/36/19 | 15 | 9.27 | 50/40/40/20 | 15 | 10.00 |
| 40 % | 37/31/29/15 | 13 | 8.62 | 40/30/30/10 | 11 | 10.00 |
| 30 % | 28/23/22/12 | 11 | 7.73 | 30/20/20/10 | 8 | 10.00 |
| 25 % | 23/19/18/10 | 8 | 8.75 | 20/20/20/10 | 7 | 10.00 |
| 20 % | 19/16/15/8 | 7 | 8.29 | 20/20/10/10 | 6 | 10.00 |
| 15 % | 14/12/11/6 | 7 | 6.14 | 10/10/10/10 | 4 | 10.00 |
| 10 % | 10/8/8/4 | 4 | 7.50 | 10/10/10/10 | 4 | 10.00 |

## What B3 says


- **The stock is worth ten times itself, spread thin.** Only `ceil(n/10)` of every hired stack is really
  consumed, so 92 EMH6 can deliver ~920 unit-marches — but the sustaining size falls as `10·cap0/(M+9)`,
  so buying more marches means smaller stacks, and damage per march falls with them.
- **Inside `simulateCampaign`, spend cannot buy marches.** This is the single most important finding here,
  and it is easy to miss. `sizeStacks` always fills the leadership, so the retrain silver of a march depends
  only on its *troop* types, not on the hired spend at all: the number of marches a budget pays for is
  `S ÷ (silver per march)` whatever the spend. Spending the stock slowly therefore buys **no extra marches**
  — it only makes each march weaker. That is why the spend-curve table falls monotonically from 100 % to
  10 % in every column, and why the search keeps choosing high spend.
- **The only reason a low spend ever wins is HP, not thrift.** Under `ms`/`msRelaxed` the sizer caps each
  hired stack just under the smallest troop stack anyway (EMH6 43 of 92 in scenario A), so every spend level
  above ~47 % is the same march; below that the spend starts to bite and damage falls. A low spend "wins"
  in the search only when it keeps the stock alive long enough for the *later* marches of a long campaign.
- **To make spend a real lever you must also cut the leadership.** Fewer troops = less silver per march =
  more marches for the same S, and smaller troop stacks let the hired stacks be small without losing their
  place in the kill order. `simulateCampaign` cannot express that, so 23-campaign-leadership plays those
  campaigns by hand with explicit counts.
- **`searchComplete` is not a guaranteed optimum.** Its stage 1 shortlists the best `SHORTLIST` = 8 subsets
  by *single-battle* score and only then plays campaigns, so a subset that loses one battle and wins ten is
  invisible to it. The plain grid beats it by 6.8 % (A, S = 5 M) and 9.7 % (B, S = 5 M) with plain `elite`
  at 100 % spend on the 12 types, and loses to it elsewhere. Both numbers are in the tables above; the
  practical answer at any budget is the better of the two, and the gap is worth an engine issue.
- **Always field multiples of ten.** A multiple-of-ten plan always fields exactly **10.00 units per unit of
  stock consumed** — the theoretical maximum of the `ceil(n/10)` rule — while `marchTarget`'s ragged
  cap-derived counts drop to 9.23 at 100 % spend, 8.75 at 25 % and **6.14 at 15 %**. At 25 % spend the
  ragged 23/19/18/10 field 70 units for 8 lost; a rounded 20/20/20/10 fields the same 70 for 7. That is up
  to **63 % more damage-carrying units per unit of stock burnt, for free**, and neither `marchTarget` nor
  the UI does the rounding today.
