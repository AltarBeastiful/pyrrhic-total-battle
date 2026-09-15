
## The account, and what is measured

Owner's export, scenario C, housing 4 343 leadership / 2 000 authority, horizon 10 marches (the app's own `CAMPAIGN.marches`). Held hired stock: epic-monster-hunter 92 · arbalester 76 · legionary 72 · chariot 37.

A **hole** is a plan the frontier offers that fields none of a type the account holds. Every damage figure below is the **real** battle (`marchResult` → `simulateBattle`), never the analytic scorer.

## The frontier at 4 rows

| run | plans offered | of them, holes | the recommended plan | its damage a march | its campaign total | the frontier's best a march | the frontier's best total | holes filled? |
|---|---|---|---|---|---|---|---|---|
| the baseline | 5 | **1** | 35 · 40 · 40 · 20 | 4,488,244 | 45,415,176 | 5,140,277 | **51,191,589** | yes |
| **fix A — the token floor** | 5 | **0** | 35 · 40 · 40 · 20 | 4,444,443 | 45,020,967 | 5,140,277 | **51,191,589** | yes |
| both fixes | 5 | **0** | 35 · 40 · 40 · 20 | 4,444,443 | 45,020,967 | 5,140,277 | **51,191,589** | yes |

The plans each run offers, cheapest first:

| # | the baseline | **fix A — the token floor** | both fixes |
|---|---|---|---|
| 1 | 35 · 40 · 40 · 20 | 35 · 40 · 40 · 20 | 35 · 40 · 40 · 20 |
| 2 | 10 · 28 · 28 · 14 | 23 · 18 · 28 · 10 | 23 · 18 · 28 · 10 |
| 3 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 |
| 4 | 35 · 40 · **0** · 20 | 35 · 28 · 40 · 20 | 35 · 28 · 40 · 20 |
| 5 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 |

## The frontier at 24 rows

| run | plans offered | of them, holes | the recommended plan | its damage a march | its campaign total | the frontier's best a march | the frontier's best total | holes filled? |
|---|---|---|---|---|---|---|---|---|
| the baseline | 25 | **3** | 35 · 40 · 40 · 20 | 4,488,244 | 45,415,176 | 5,140,277 | **51,191,589** | yes |
| **fix A — the token floor** | 25 | **0** | 35 · 40 · 40 · 20 | 4,444,443 | 45,020,967 | 5,140,277 | **51,191,589** | yes |
| both fixes | 25 | **0** | 35 · 40 · 40 · 20 | 4,444,443 | 45,020,967 | 5,140,277 | **51,191,589** | yes |

The plans each run offers, cheapest first:

| # | the baseline | **fix A — the token floor** | both fixes |
|---|---|---|---|
| 1 | 35 · 40 · 40 · 20 | 35 · 40 · 40 · 20 | 35 · 40 · 40 · 20 |
| 2 | 10 · 28 · 28 · 14 | 23 · 18 · 28 · 10 | 23 · 18 · 28 · 10 |
| 3 | 23 · 18 · 28 · 9 | 23 · 28 · 10 · 14 | 23 · 28 · 10 · 14 |
| 4 | 23 · 28 · 28 · 14 | 23 · 28 · 28 · 14 | 23 · 28 · 28 · 14 |
| 5 | 50 · 28 · 18 · 20 | 50 · 28 · 18 · 20 | 50 · 28 · 18 · 20 |
| 6 | 50 · 40 · 18 · 20 | 50 · 40 · 18 · 20 | 50 · 40 · 18 · 20 |
| 7 | 50 · 40 · **0** · 20 | 50 · 40 · 10 · 20 | 50 · 40 · 10 · 20 |
| 8 | 50 · 40 · 28 · 20 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 |
| 9 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 |
| 10 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 |
| 11 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 |
| 12 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 |
| 13 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 |
| 14 | 50 · 40 · 40 · 20 | 10 · 28 · 40 · 20 | 10 · 28 · 40 · 20 |
| 15 | 10 · 28 · 28 · 20 | 35 · 18 · 18 · 20 | 35 · 18 · 18 · 20 |
| 16 | 35 · 28 · **0** · 20 | 35 · 18 · 40 · 20 | 35 · 18 · 40 · 20 |
| 17 | 35 · 40 · **0** · 20 | 35 · 28 · 40 · 20 | 35 · 28 · 40 · 20 |
| 18 | 35 · 28 · 18 · 20 | 35 · 28 · 10 · 20 | 35 · 28 · 10 · 20 |
| 19 | 35 · 18 · 40 · 20 | 35 · 40 · 18 · 20 | 35 · 40 · 18 · 20 |
| 20 | 35 · 40 · 18 · 20 | 35 · 40 · 10 · 20 | 35 · 40 · 10 · 20 |
| 21 | 35 · 40 · 40 · 20 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 |
| 22 | 35 · 40 · 8 · 20 | 23 · 28 · 10 · 20 | 23 · 28 · 10 · 20 |
| 23 | 50 · 40 · 40 · 20 | 23 · 18 · 28 · 20 | 23 · 18 · 28 · 20 |
| 24 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 |
| 25 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 |

## Does filling a hole still pay, under each run?

The test 78 used, applied to whatever each run offers: for every offered plan with exactly one hole, the missing type is given a token count with everything else untouched, and the real battle is replayed. A run whose frontier still contains a plan that a token improves is still offering the owner a hole he would not choose.

| run | offered plans with one hole | of those, improved by a token | worst case |
|---|---|---|---|
| the baseline | 3 | 3 | 0 |
| **fix A — the token floor** | 0 | 0 | — |
| both fixes | 0 | 0 | — |
