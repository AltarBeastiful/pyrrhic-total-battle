
## The account, and what is measured

Owner's export, scenario C, housing 4 343 leadership / 2 000 authority, horizon 10 marches. A **hole** is a plan the frontier offers that fields none of a type the account holds; `leftOut` is the engine's own count of the plans the band refused. Damages are the real battle (`marchResult` → `simulateBattle`).

## The frontier at 4 rows

**A band only applies when the caller asks for fewer rows than the frontier holds** — ask for the whole frontier and the band is bypassed, so its refusals cannot show. At 4 rows that is why `leftOut` reads as it does below.

| run | plans offered | **leftOut** | of them, holes | the recommended plan | its damage a march | its campaign total | the frontier's best total |
|---|---|---|---|---|---|---|---|
| the baseline | 5 | **14** | **1** | 35 · 40 · 40 · 20 | 4,488,244 | 45,415,176 | **51,191,589** |
| **fix B — the band refusal** | 5 | **17** | **0** | 35 · 40 · 40 · 20 | 4,488,244 | 45,415,176 | **51,191,589** |
| both fixes | 5 | **8** | **0** | 35 · 40 · 40 · 20 | 4,444,443 | 45,020,967 | **51,191,589** |

The cheapest five stops each run offers:

| # | the baseline | **fix B — the band refusal** | both fixes |
|---|---|---|---|
| 1 | 35 · 40 · 40 · 20 | 35 · 40 · 40 · 20 | 35 · 40 · 40 · 20 |
| 2 | 10 · 28 · 28 · 14 | 10 · 28 · 28 · 14 | 23 · 18 · 28 · 10 |
| 3 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 |
| 4 | 35 · 40 · **0** · 20 | 35 · 28 · 18 · 20 | 35 · 28 · 40 · 20 |
| 5 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 | 50 · 40 · 40 · 20 |

## The frontier at 24 rows

**A band only applies when the caller asks for fewer rows than the frontier holds** — ask for the whole frontier and the band is bypassed, so its refusals cannot show. At 24 rows that is why `leftOut` reads as it does below.

| run | plans offered | **leftOut** | of them, holes | the recommended plan | its damage a march | its campaign total | the frontier's best total |
|---|---|---|---|---|---|---|---|
| the baseline | 25 | **14** | **3** | 35 · 40 · 40 · 20 | 4,488,244 | 45,415,176 | **51,191,589** |
| **fix B — the band refusal** | 25 | **17** | **0** | 35 · 40 · 40 · 20 | 4,488,244 | 45,415,176 | **51,191,589** |
| both fixes | 25 | **8** | **0** | 35 · 40 · 40 · 20 | 4,444,443 | 45,020,967 | **51,191,589** |

The cheapest five stops each run offers:

| # | the baseline | **fix B — the band refusal** | both fixes |
|---|---|---|---|
| 1 | 35 · 40 · 40 · 20 | 35 · 40 · 40 · 20 | 35 · 40 · 40 · 20 |
| 2 | 10 · 28 · 28 · 14 | 10 · 28 · 28 · 14 | 23 · 18 · 28 · 10 |
| 3 | 23 · 18 · 28 · 9 | 23 · 18 · 28 · 9 | 23 · 28 · 10 · 14 |
| 4 | 23 · 28 · 28 · 14 | 23 · 28 · 18 · 14 | 23 · 28 · 28 · 14 |
| 5 | 50 · 28 · 18 · 20 | 23 · 28 · 28 · 14 | 50 · 28 · 18 · 20 |

## What the band refused, and whether the plan that wins is one of them

The point of B is that the **winner** is untouched: the engine still searches every shape, including the ones with a hole, and B only decides what the player is shown. A run where the recommended plan fields none of a type would mean the band was bypassed because it emptied.

| run | rows asked | plans the band refused | the winner drops a type? | the winner is in the band? |
|---|---|---|---|---|
| the baseline | 4 | 14 | no | yes |
| the baseline | 24 | 14 | no | yes |
| **fix B — the band refusal** | 4 | 17 | no | yes |
| **fix B — the band refusal** | 24 | 17 | no | yes |
| both fixes | 4 | 8 | no | yes |
| both fixes | 24 | 8 | no | yes |

## Does filling a hole still pay, under each run?


| run | offered plans with one hole | of those, improved by a token |
|---|---|---|
| the baseline | 3 | 3 |
| **fix B — the band refusal** | 0 | 0 |
| both fixes | 0 | 0 |
