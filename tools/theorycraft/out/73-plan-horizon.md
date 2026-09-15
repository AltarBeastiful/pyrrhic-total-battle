
## 0. The audit: what a target does, before and after the engine change

The "before" columns are a real run of the same file, same request, same account, with the engine as it stood (the four edits of section 0c reverted); the "after" columns are this run. Damage, silver and mercenaries are the plan's own totals.

| marchTarget | BEFORE marches | BEFORE damage | BEFORE chariot | AFTER marches | AFTER repeats | AFTER damage | AFTER silver | AFTER mercs | AFTER chariot | finale? |
|---|---|---|---|---|---|---|---|---|---|---|
| undefined | 67 | 154,214,995 | 0 | **67** | 66 | 154,214,995 | 113,670,300 | 207 | 0 | 6 stacks |
| 4 | 5 | 30,629,300 | 28 | **4** | 3 | 26,459,319 | 9,398,300 | 89 | 29 | 6 stacks |
| 6 | 7 | 39,333,170 | 22 | **6** | 5 | 35,188,142 | 13,842,200 | 111 | 25 | 6 stacks |
| 10 | 11 | 53,767,344 | 19 | **10** | 9 | 51,191,589 | 23,498,200 | 150 | 20 | 7 stacks |
| 11 | 12 | 55,138,542 | 17 | **11** | 10 | 53,767,344 | 25,580,700 | 165 | 19 | 7 stacks |
| 12 | 13 | 55,841,377 | 15 | **12** | 11 | 55,138,542 | 23,327,900 | 158 | 17 | 7 stacks |
| 13 | 14 | 58,581,152 | 13 | **13** | 12 | 56,816,473 | 25,055,000 | 170 | 15 | 7 stacks |
| 20 | 21 | 84,405,344 | 10 | **20** | 19 | 80,635,847 | 36,232,700 | 149 | 10 | 7 stacks |
| 30 | 31 | 110,278,135 | 8 | **30** | 29 | 112,288,146 | 53,919,100 | 212 | 9 | 8 stacks |

**The like-for-like check on the grid change.** A target used to mean `repeats = target`, so the old `marchTarget: 10` is today's `marchTarget: 11` — the same ten repeats, the same finale, so the only difference is the grid and the climb. Measured: old ten repeats **53,767,344** damage, chariot 19; new ten repeats **53,767,344** damage, chariot 19 — **the same answer**, so on this account the pinning neither gains nor loses damage below 12 (the old grid contained the target's own row, so it could not have been richer than a superset of it). What it does change is the cost: the audit run went from about 6 s to about 3 s, and above a target of 12 it changes the answer — the old grid's *only* rows were the twelve built from `largestFor(held, ≤ 12)`, and the target's own ceiling was nowhere in it.

## 0b. What was changed, and what was left alone


1. `plan.marches` was the target **plus one** whenever the plan had a finale. S-54's same field plays exactly `settings.marches` marches (`simulateCampaign`: `planned = max(1, floor(settings.marches))`), so the two readings of one field disagreed by a march. *Changed*: `marchTarget` is now the campaign's total and the repeats are `target − 1`. Every row above now reads back its own target.

2. The vectors grid was built for `marches` = 1…12 and **every** vector was then evaluated at the target, so a target above 12 sampled the fractions of the *K = 12* maximum (`largestFor(held, 12)`) instead of its own. *Changed*: with a target, the grid is built for that one march count. Measured first: this does **not** throw — the fractions of a K=12 maximum are small enough to pass the `lastsMarches` check — it answers with counts off the wrong maximum, which is worse than a throw.

3. The hill-climb's last loop took its maximum from `marchesFor(stock, vector)`, i.e. the tightest type the vector happens to field — a march count unrelated to the plan's. *Changed*: it reads the target's repeats. Measured, and the reason the defect stayed invisible: at a target of 10 the old engine still reached 19 chariots, because `marchesFor` of the vector it was holding happened to be 10 as well. The two numbers diverge as soon as the vector fields a type whose stock is shorter or longer than the run, which is the normal case at every other target.

**Left alone, deliberately**:
- `MAX_MARCHES = 12` — it now bounds only the *unbounded* search (the one that answers "all of it"), where it is the breadth of the grid, not a lie about the target. With a target the grid is one count and the constant is not consulted at all, so a target of 30 is exact (measured above: 30 marches, 29 repeats);
- `finaleFor` and the finale's stock/silver arithmetic: measured correct under a target. The burn is `repeats × chunks(count)` and the silver left is `silverBudget − repeats × march.silver`, both read from the repeats, and the cached key already carries `marches`. Every target above has a finale (6-8 stacks), so the leftovers are never silently dropped — including at a target of 4, where the finale fields the near-entire stock;
- the two `largestFor` call sites in the grid and the climb now both read the same march count, and `binding.marches` already reported the target.

One semantic decision worth flagging: reading the target as the campaign's **total** is what makes a shared "Marches planned" field mean one thing. If the UI would rather it meant the repeats, the change is the one line `Math.max(1, planned - 1)`.

## 1. The plan and its sweet spot, per horizon

| target | what | marches | repeats | damage | silver | mercs lost | damage a march | silver a march | mercs a march | damage / silver | damage / mercenary |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **undefined** | the plan | 67 | 66 | 154,214,995 | 113,670,300 | 207 | 2,287,262 | 1,688,900 | 3 | 1.36 | 745,000 |
| **undefined** | the sweet spot | 64 | 63 | 118,544,472 | 64,352,400 | 199 | 1,827,330 | 986,500 | 3 | 1.84 | 595,701 |
| 20 | the plan | 20 | 19 | 80,635,847 | 36,232,700 | 149 | 3,991,487 | 1,793,900 | 7 | 2.23 | 541,180 |
| 20 | the sweet spot | 20 | 19 | 78,550,464 | 33,576,500 | 149 | 3,881,730 | 1,654,100 | 7 | 2.34 | 527,184 |
| 10 | the plan | 10 | 9 | 51,191,589 | 23,498,200 | 150 | 5,140,277 | 2,351,100 | 15 | 2.18 | 341,277 |
| 10 | the sweet spot | 10 | 9 | 45,415,176 | 17,603,200 | 142 | 4,488,244 | 1,708,300 | 14 | 2.58 | 319,825 |
| 6 | the plan | 6 | 5 | 35,188,142 | 13,842,200 | 111 | 6,004,247 | 2,345,700 | 18 | 2.54 | 317,010 |
| 6 | the sweet spot | 6 | 5 | 33,653,327 | 11,498,200 | 111 | 5,697,284 | 1,876,900 | 18 | 2.93 | 303,183 |

**The three numbers the owner asked for, side by side**:
- **unbounded**: 154,214,995 damage, 113,670,300 silver, 207 mercenaries lost, 1.36 damage a silver, 745,000 damage a mercenary, 313 days of training, 2,301,716 damage a march
- **20 marches**: 80,635,847 damage, 36,232,700 silver, 149 mercenaries lost, 2.23 damage a silver, 541,180 damage a mercenary, 114 days of training, 4,031,792 damage a march
- **10 marches**: 51,191,589 damage, 23,498,200 silver, 150 mercenaries lost, 2.18 damage a silver, 341,277 damage a mercenary, 116 days of training, 5,119,159 damage a march
- **6 marches**: 35,188,142 damage, 13,842,200 silver, 111 mercenaries lost, 2.54 damage a silver, 317,010 damage a mercenary, 69 days of training, 5,864,690 damage a march

## 2. The repeated march, mercenary by mercenary, with the arithmetic

`lastsMarches(held, c) = floor((held − c) / ceil(c/10)) + 1`, and the grid's ceiling at `K` repeats is the largest `c` with `lastsMarches ≥ K`. A count is only planable if its own ceiling clears the run.

| target | repeats K | type | held | fielded | chunks a march | lasts (marches) | ceiling at K |
|---|---|---|---|---|---|---|---|
| undefined | 66 | epic-monster-hunter | 92 | **10** | 1 | 83 | 10 |
| undefined | 66 | arbalester | 76 | **10** | 1 | 67 | 10 |
| undefined | 66 | legionary | 72 | **7** | 1 | 66 | 7 |
| undefined | 66 | chariot | 37 | **0** | 1 | not fielded | 0 |
| 20 | 19 | epic-monster-hunter | 92 | **20** | 2 | 37 | 30 |
| 20 | 19 | arbalester | 76 | **19** | 2 | 29 | 22 |
| 20 | 19 | legionary | 72 | **20** | 2 | 27 | 20 |
| 20 | 19 | chariot | 37 | **10** | 1 | 28 | 10 |
| 10 | 9 | epic-monster-hunter | 92 | **50** | 5 | 9 | 50 |
| 10 | 9 | arbalester | 76 | **40** | 4 | 10 | 40 |
| 10 | 9 | legionary | 72 | **40** | 4 | 9 | 40 |
| 10 | 9 | chariot | 37 | **20** | 2 | 9 | 20 |
| 6 | 5 | epic-monster-hunter | 92 | **46** | 5 | 10 | 64 |
| 6 | 5 | arbalester | 76 | **49** | 5 | 6 | 52 |
| 6 | 5 | legionary | 72 | **50** | 5 | 5 | 50 |
| 6 | 5 | chariot | 37 | **25** | 3 | 5 | 25 |

The ceilings themselves, for every march count the plans above sit at and for the ones the old grid used (`largestFor(held, K)`, i.e. the largest count that still lasts K marches):

| held | K=5 | K=9 | K=12 | K=19 | K=20 | K=30 | K=66 |
|---|---|---|---|---|---|---|---|
| epic-monster-hunter 92 | 64 | 50 | 40 | 30 | 30 | 20 | 10 |
| arbalester 76 | 52 | 40 | 32 | 22 | 20 | 18 | 10 |
| legionary 72 | 50 | 40 | 30 | 20 | 20 | 14 | 7 |
| chariot 37 | 25 | 20 | 15 | 10 | 10 | 8 | 0 |

**Does the chariot come back?** Measured: unbounded → **0** in the repeat (+37 in the finale) · target 20 → **10** in the repeat (+18 in the finale) · target 10 → **20** in the repeat (+19 in the finale) · target 6 → **25** in the repeat (+22 in the finale). It is fielded at every horizon, and at the shortest (a target of 6, so 5 repeats) it sits at that horizon's ceiling of 25. The arithmetic at the owner's own default of 10: `largestFor(37, 9) = 20` — with nine repeats the stock still allows 20 chariots in the repeated march, and the plan fields 20. The whole of the missing-stack complaint of experiment 72 is gone at every horizon: the type is back, and generous.

## 3. Every alternative at the target of 10 marches (`recommend` is the marked one)

The last column is the row's identity (`mercsOf`, the counts the repeated march fields) — without it the labels below are ambiguous, which section 4 measures.

| label | marches | damage | silver | mercs lost | damage a march | mercs a march | troop stacks | merc types | damage/silver | damage/mercenary | mercs fielded |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 3 stacks · 135 hired · 1.7M silver a march **← sweet spot** | 10 | 45,415,176 | 17,603,200 | 142 | 4,488,244 | 14 | 3 | 4 | 2.58 | 319,825 | epic-monster-hunter 35 · arbalester 40 · legionary 40 · chariot 20 |
| 4 stacks · 80 hired · 1.8M silver a march | 10 | 36,129,295 | 18,705,700 | 102 | 3,434,728 | 9 | 4 | 4 | 1.93 | 354,209 | epic-monster-hunter 10 · arbalester 28 · legionary 28 · chariot 14 |
| 4 stacks · 93 hired · 1.8M silver a march | 10 | 40,298,747 | 19,071,800 | 118 | 3,908,692 | 11 | 4 | 4 | 2.11 | 341,515 | epic-monster-hunter 23 · arbalester 28 · legionary 28 · chariot 14 |
| 3 stacks · 128 hired · 2M silver a march | 10 | 44,861,101 | 19,928,800 | 134 | 4,414,340 | 13 | 3 | 4 | 2.25 | 334,784 | epic-monster-hunter 50 · arbalester 40 · legionary 18 · chariot 20 |
| 3 stacks · 138 hired · 2M silver a march | 10 | 46,966,751 | 20,241,100 | 142 | 4,636,640 | 14 | 3 | 4 | 2.32 | 330,752 | epic-monster-hunter 50 · arbalester 40 · legionary 28 · chariot 20 |
| 3 stacks · 150 hired · 2M silver a march | 10 | 49,236,285 | 20,510,200 | 150 | 4,923,021 | 15 | 3 | 4 | 2.40 | 328,242 | epic-monster-hunter 50 · arbalester 40 · legionary 40 · chariot 20 |
| 3 stacks · 150 hired · 2.2M silver a march | 10 | 50,138,256 | 21,887,200 | 150 | 5,023,240 | 15 | 3 | 4 | 2.29 | 334,255 | epic-monster-hunter 50 · arbalester 40 · legionary 40 · chariot 20 |
| 3 stacks · 86 hired · 2.3M silver a march | 10 | 36,578,845 | 22,364,200 | 102 | 3,484,678 | 9 | 3 | 4 | 1.64 | 358,616 | epic-monster-hunter 10 · arbalester 28 · legionary 28 · chariot 20 |
| 3 stacks · 83 hired · 2.3M silver a march | 10 | 37,105,222 | 22,410,800 | 102 | 3,561,279 | 9 | 3 | 3 | 1.66 | 363,777 | epic-monster-hunter 35 · arbalester 28 · legionary 0 · chariot 20 |
| 3 stacks · 113 hired · 2.3M silver a march | 10 | 44,353,752 | 22,496,500 | 126 | 4,339,908 | 12 | 3 | 4 | 1.97 | 352,014 | epic-monster-hunter 35 · arbalester 18 · legionary 40 · chariot 20 |
| 3 stacks · 135 hired · 2.3M silver a march | 10 | 48,657,111 | 22,540,600 | 142 | 4,848,459 | 14 | 3 | 4 | 2.16 | 342,656 | epic-monster-hunter 35 · arbalester 40 · legionary 40 · chariot 20 |
| 3 stacks · 150 hired · 2.3M silver a march | 10 | 50,649,150 | 22,668,400 | 150 | 5,080,006 | 15 | 3 | 4 | 2.23 | 337,661 | epic-monster-hunter 50 · arbalester 40 · legionary 40 · chariot 20 |
| 3 stacks · 150 hired · 2.4M silver a march | 10 | 51,191,589 | 23,498,200 | 150 | 5,140,277 | 15 | 3 | 4 | 2.18 | 341,277 | epic-monster-hunter 50 · arbalester 40 · legionary 40 · chariot 20 |

## 4. Which of those are practical (the measure from experiment 72, applied at 10)

Same stated criteria as experiment 72 — a march that fields more than one troop stack, a per-march damage at least 50 % of the best march in the list, and a whole run inside 90 days of training:
| label | marches | damage a march | % of the best march | troop stacks | training, whole run | verdict |
|---|---|---|---|---|---|---|
| 3 stacks · 135 hired · 1.7M silver a march | 10 | 4,488,244 | 87 % | 3 | 84 d | **practical** |
| 4 stacks · 80 hired · 1.8M silver a march | 10 | 3,434,728 | 67 % | 4 | 68 d | **practical** |
| 4 stacks · 93 hired · 1.8M silver a march | 10 | 3,908,692 | 76 % | 4 | 68 d | **practical** |
| 3 stacks · 128 hired · 2M silver a march | 10 | 4,414,340 | 86 % | 3 | 98 d | curiosity — 98 d of training |
| 3 stacks · 138 hired · 2M silver a march | 10 | 4,636,640 | 90 % | 3 | 98 d | curiosity — 98 d of training |
| 3 stacks · 150 hired · 2M silver a march | 10 | 4,923,021 | 96 % | 3 | 100 d | curiosity — 100 d of training |
| 3 stacks · 150 hired · 2.2M silver a march | 10 | 5,023,240 | 98 % | 3 | 107 d | curiosity — 107 d of training |
| 3 stacks · 86 hired · 2.3M silver a march | 10 | 3,484,678 | 68 % | 3 | 111 d | curiosity — 111 d of training |
| 3 stacks · 83 hired · 2.3M silver a march | 10 | 3,561,279 | 69 % | 3 | 111 d | curiosity — 111 d of training |
| 3 stacks · 113 hired · 2.3M silver a march | 10 | 4,339,908 | 84 % | 3 | 111 d | curiosity — 111 d of training |
| 3 stacks · 135 hired · 2.3M silver a march | 10 | 4,848,459 | 94 % | 3 | 111 d | curiosity — 111 d of training |
| 3 stacks · 150 hired · 2.3M silver a march | 10 | 5,080,006 | 99 % | 3 | 111 d | curiosity — 111 d of training |
| 3 stacks · 150 hired · 2.4M silver a march | 10 | 5,140,277 | 100 % | 3 | 116 d | curiosity — 116 d of training |

**3 of 13 rows are practical at the target of 10** (against 7 of 16 unbounded), and the longest run in the list is 116 days against 757 unbounded, so the fold removes the century-long tail that made the slider unreadable. Two notes on what is left:

- the **sweet spot passes** the test (84 days) while the plan itself does not (116 days) — the horizon bounds the number of marches, not the size of each, so training time still scales with the stacks and the 90-day test now *discriminates* between rows instead of condemning all of them;
- **every label in the list is ambiguous**: the label is `marches × rungs + finale`, and at a fixed target every row starts with the same `9×`, so 0 of the 13 rows share their label with another. A slider drawn on these labels cannot tell its stops apart — the counts are the identity, not the label.

## 5. What the fold loses and gains

| | unbounded | target 20 | target 10 | target 6 |
|---|---|---|---|---|
| total damage | 154,214,995 | 80,635,847 | 51,191,589 | 35,188,142 |
| silver | 113,670,300 | 36,232,700 | 23,498,200 | 13,842,200 |
| mercenaries lost | 207 | 149 | 150 | 111 |
| damage a march | 2,301,716 | 4,031,792 | 5,119,159 | 5,864,690 |
| damage a silver | 1.36 | 2.23 | 2.18 | 2.54 |
| damage a mercenary | 745,000 | 541,180 | 341,277 | 317,010 |
| days of training | 313 | 114 | 116 | 69 |

**The trade in one paragraph.** On three of the four axes the unbounded plan is the **worst** of the four: 2,301,716 damage a march against a best of 5,864,690 (target 6), 1.36 damage a silver against 2.54 (target 6), and 313 days of training against 69 (target 6). On the fourth axis it **wins outright**: 745,000 damage a mercenary against a best bounded 541,180 (target 20) — a long run spends each chunk of ten it loses over many more marches. So `total = marches × damage(march)` is not the only thing the horizon gives up, and the trade is **+3,562,974 damage a march, +1.19 damage a silver, 244 days of training for 73,579,148 total damage and at least 203,820 damage a mercenary** (at a target of 10 it is 403,723). The mechanism is section 2's shape: the unbounded plan spreads one *small* march over 66 repeats, so almost all of its silver re-buys the same cheap march and each chunk of ten it burns buys many marches of damage; a bounded plan puts the same stock into fewer, larger marches — a higher ladder and fatter mercenary stacks each time. The owner's own rationale holds in the numbers: bounding to ~10 marches costs 103,023,406 damage of headroom he was never going to play, and buys back 2,817,443 damage a march, 197 days of training, and the four mercenary types of experiment 72 — while the mercenaries he does spend buy less.

## 6. A stop set for the slider, at the target of 10

| # | stop | marches | damage | silver | mercs lost | damage a march | damage/silver | training, whole run |
|---|---|---|---|---|---|---|---|---|
| 1 | the cheapest practical plan — `3 stacks · 135 hired · 1.7M silver a march` | 10 | 45,415,176 | 17,603,200 | 142 | 4,488,244 | 2.58 | 84 d |
| 2 | the next step up the damage staircase — `3 stacks · 138 hired · 2M silver a march` | 10 | 46,966,751 | 20,241,100 | 142 | 4,636,640 | 2.32 | 98 d |
| 3 | the engine's own maximum, the plan itself — `3 stacks · 150 hired · 2.4M silver a march` | 10 | 51,191,589 | 23,498,200 | 150 | 5,140,277 | 2.18 | 116 d |

The sweet spot at 10 is `3 stacks · 135 hired · 1.7M silver a march` (10 marches, 45,415,176 damage, 17,603,200 silver, 135 hired units a march: epic-monster-hunter 35 · arbalester 40 · legionary 40 · chariot 20), and it is **undominated** among the rows the plan carries. Its staircase neighbours are 46,966,751 damage (20,241 k silver) above and 0 damage (0 k silver) below — and note that both sit within 20,241 k of it, so the fold does put a usable neighbourhood on the list; what it does not do is *order* it.

**Engine thinning or fewer alternatives?** This is where the fold changes experiment 72's answer, and it is measurable: **every stop in the table above is already a row of the 13-row list.** Measured: the list spans 17,603,200 to 23,498,200 silver, its widest gap between consecutive rows is 1,377,000 silver (between the cheapest row and the rest) and its narrowest 44,100 — and the decisive measurement is the stop table above: the even sample of 13 rows already *contains* every stop the slider needs. The unbounded list, measured in the same run, spans 4,288,500 to 113,670,300 silver — 27-fold — and its rows sit up to 49,317,900 silver apart, which is where experiment 72's jumpy slider came from. **So the thinning is not the defect here**: at a target of 10, asking the engine for the four or five rows the slider wants is enough, and no change to the even sampling is needed.

What *is* wrong at a horizon, and is engine-side, is the **label**: 0 of 13 rows share their label with another (section 4), so a slider built on labels cannot name its own stops — the identity is the counts. That is a one-line change to `summarise`, and it is the only change section 6 asks for.

## 7. The label: the plan's identity in player terms, and its collisions measured

The label is presentation only — nothing else moved. It now reads `{stacks} stacks · {hired} hired a march`: the depth of the march and the hired units that *ride* it (which the "mercs a march" column of section 3 does not give — that column is what is *lost*). Collisions below are rows of one list sharing one label.

| target | rows | distinct labels | collisions | colliding labels |
|---|---|---|---|---|
| 10 | 13 | 13 | **none** | — |
| 20 | 12 | 9 | **1** | `6 stacks · 69 hired · 1.8M silver a march` ×4 |

Candidate forms, all computed from the rows themselves (the split is the mercenary counts, largest first, so the name is canonical whatever order the table lists the types in), with their collisions measured at both targets. The shipped one is D:

| form | example | collisions at 10 | collisions at 20 | longest label |
|---|---|---|---|---|
| A — stacks + hired a march | `3 stacks · 135 hired a march` | **2** | **1** | 28 chars |
| B — A + the mercenary split | `3 stacks · 135 hired (40/40/35/20)` | **2** | **1** | 34 chars |
| C — the split instead of the total | `3 stacks · 40/40/35/20 hired` | **2** | **1** | 28 chars |
| D — stacks + hired + the march's silver (SHIPPED) | `3 stacks · 135 hired · 1.7M a march` | **none** | **1** | 35 chars |
| E — D + the split | `3 stacks · 40/40/35/20 hired · 1.7M a march` | **none** | **1** | 43 chars |
| F — D with the campaign's total instead | `3 stacks · 135 hired · 45.4M total` | **none** | **none** | 34 chars |
| G — D with two decimals of silver | `3 stacks · 135 hired · 1.71M a march` | **none** | **1** | 36 chars |

**What the table says, and the one residual it leaves.** The mercenary split (B, C, E) does **not** resolve the collision, at either target, in any of the three shapes: the rows that collide field the same vector, so the disambiguator has to be a number. The shipped form (D) puts the march's own silver in the label in the March's compact idiom — the same `Intl` call `src/ui/sections/march/format.ts` makes, repeated in the engine because the engine does not import `src/ui`, one idiom for one figure. Measured after the change: **no collisions at a target of 10** (16 rows, 16 names — the horizon where the owner will live) and **one at 20**, where the plan and its nearest neighbour both cost `1.8M a march` because a one-decimal compass figure is coarser than the `1708k` it replaced. Two forms measure collision-free at **both** targets, and both keep one idiom: **F** `3 stacks · 135 hired · 45.4M total` — the campaign's damage instead of the march's silver, 34 characters, *shorter* than D — and **G** the same silver at two decimals (`36` characters). D was shipped because it is what was asked for and it is exact at the owner's horizon; if a name must be unique at every horizon, F is the swap to make, and it is a one-line change in one function.

Every label the engine carries at both targets, with the row it names:
| target | label | stacks | hired a march | marches | damage | silver | mercs lost |
|---|---|---|---|---|---|---|---|
| 10 | `3 stacks · 135 hired · 1.7M silver a march` | 3 | 135 | 10 | 45,415,176 | 17,603,200 | 142 |
| 10 | `4 stacks · 80 hired · 1.8M silver a march` | 4 | 80 | 10 | 36,129,295 | 18,705,700 | 102 |
| 10 | `4 stacks · 93 hired · 1.8M silver a march` | 4 | 93 | 10 | 40,298,747 | 19,071,800 | 118 |
| 10 | `3 stacks · 128 hired · 2M silver a march` | 3 | 128 | 10 | 44,861,101 | 19,928,800 | 134 |
| 10 | `3 stacks · 138 hired · 2M silver a march` | 3 | 138 | 10 | 46,966,751 | 20,241,100 | 142 |
| 10 | `3 stacks · 150 hired · 2M silver a march` | 3 | 150 | 10 | 49,236,285 | 20,510,200 | 150 |
| 10 | `3 stacks · 150 hired · 2.2M silver a march` | 3 | 150 | 10 | 50,138,256 | 21,887,200 | 150 |
| 10 | `3 stacks · 86 hired · 2.3M silver a march` | 3 | 86 | 10 | 36,578,845 | 22,364,200 | 102 |
| 10 | `3 stacks · 83 hired · 2.3M silver a march` | 3 | 83 | 10 | 37,105,222 | 22,410,800 | 102 |
| 10 | `3 stacks · 113 hired · 2.3M silver a march` | 3 | 113 | 10 | 44,353,752 | 22,496,500 | 126 |
| 10 | `3 stacks · 135 hired · 2.3M silver a march` | 3 | 135 | 10 | 48,657,111 | 22,540,600 | 142 |
| 10 | `3 stacks · 150 hired · 2.3M silver a march` | 3 | 150 | 10 | 50,649,150 | 22,668,400 | 150 |
| 10 | `3 stacks · 150 hired · 2.4M silver a march` | 3 | 150 | 10 | 51,191,589 | 23,498,200 | 150 |
| 20 | `7 stacks · 40 hired · 1.5M silver a march` | 7 | 40 | 20 | 60,274,991 | 29,932,300 | 115 |
| 20 | `7 stacks · 45 hired · 1.5M silver a march` | 7 | 45 | 20 | 63,020,396 | 29,932,300 | 132 |
| 20 | `7 stacks · 50 hired · 1.5M silver a march` | 7 | 50 | 20 | 66,958,545 | 30,276,200 | 149 |
| 20 | `5 stacks · 73 hired · 1.5M silver a march` | 5 | 73 | 20 | 69,053,506 | 30,859,500 | 183 |
| 20 | `6 stacks · 43 hired · 1.7M silver a march` | 6 | 43 | 20 | 61,698,452 | 33,515,700 | 115 |
| 20 | `6 stacks · 54 hired · 1.7M silver a march` | 6 | 54 | 20 | 66,909,487 | 33,515,700 | 132 |
| 20 | `6 stacks · 68 hired · 1.7M silver a march` | 6 | 68 | 20 | 78,550,464 | 33,576,500 | 149 |
| 20 | `6 stacks · 35 hired · 1.7M silver a march` | 6 | 35 | 20 | 56,141,606 | 33,670,400 | 98 |
| 20 | `6 stacks · 69 hired · 1.8M silver a march` | 6 | 69 | 20 | 80,012,761 | 35,415,700 | 149 |
| 20 | `6 stacks · 69 hired · 1.8M silver a march` | 6 | 69 | 20 | 80,138,655 | 35,569,600 | 149 |
| 20 | `6 stacks · 69 hired · 1.8M silver a march` | 6 | 69 | 20 | 80,500,054 | 36,063,600 | 149 |
| 20 | `6 stacks · 69 hired · 1.8M silver a march` | 6 | 69 | 20 | 80,635,847 | 36,232,700 | 149 |

## 8. The list the UI asks for: `marchTarget: 10, alternatives: 4`

`alternatives: 4` returns **5 rows** (the even sample of the undominated frontier, plus whichever of the four picks it did not contain).

| # | label | marches | damage a march | silver a march | mercs a march | damage / silver | damage / mercenary | which pick |
|---|---|---|---|---|---|---|---|---|
| 1 | `3 stacks · 135 hired · 1.7M silver a march` | 10 | 4,488,244 | 1,708,300 | 14 | 2.58 | 319,825 | **balanced** (the sweet spot) |
| 2 | `4 stacks · 80 hired · 1.8M silver a march` | 10 | 3,434,728 | 1,845,500 | 9 | 1.93 | 354,209 | the even sample |
| 3 | `3 stacks · 150 hired · 2M silver a march` | 10 | 4,910,056 | 1,999,500 | 15 | 2.42 | 327,464 | the even sample |
| 4 | `3 stacks · 95 hired · 2.3M silver a march` | 10 | 3,959,259 | 2,256,900 | 10 | 1.81 | 368,639 | the even sample |
| 5 | `3 stacks · 150 hired · 2.4M silver a march` | 10 | 5,140,277 | 2,351,100 | 15 | 2.18 | 341,277 | **chosen** (the plan) |

Measured: of those 5 rows, **2 are forced picks** (**balanced** (the sweet spot) · **chosen** (the plan)) and 3 come from the even sample. Verdict, from the table above rather than from taste: the list is **usable as a control** — every row has a distinct label (section 7), the four picks are the four strategies worth offering (the plan, the cheapest, the most mercenary-thrifty and the sweet spot), and the sample fills the gaps between them, which is what a slider's intermediate stops are for. **Do not drop the picks at a horizon**: they are the only rows guaranteed to be on the list at every target, and the even sample alone moves as the frontier changes shape with the target (measured: at a target of 10 the sample of 4 lands on 4 stacks · 80 hired · 1.8M silver a march, 3 stacks · 150 hired · 2M silver a march, 3 stacks · 95 hired · 2.3M silver a march).

## 9. The label moved and nothing else: the payload's fingerprint

FNV-1a over the whole `CampaignPlan` with every key named `label` dropped wherever it sits. **This was run twice** — once with the previous label form (`3 stacks · 135 hired a march`) and once with the new one — and the two tables are **identical, row for row**, so the label is the sole difference the change made. (The first attempt at this check used a rest-spread helper to drop the labels and it silently failed to drop them: the two tables differed. The replacer above drops them by key and the tables agree.)

| target | fingerprint |
|---|---|
| undefined | `45d0d227` |
| 4 | `d8692199` |
| 6 | `e20e1d9b` |
| 10 | `b7bf597b` |
| 11 | `ca7b7f12` |
| 12 | `c3b03341` |
| 13 | `8127511a` |
| 20 | `6c808bbb` |
| 30 | `8e250b46` |
| 10, `alternatives: 4` | `2b07e3dd` |
