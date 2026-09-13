# B3 (extension) — the leadership dimension of a campaign

Why this file exists: `sizeStacks` always fills the leadership, so `simulateCampaign` prices every march of a given troop set at the same silver and the march count is `S ÷ silver-per-march` **whatever the hired spend**. Spending the stock slowly therefore buys no extra marches inside the engine — it only makes each march weaker. The real trade is *fewer troops → cheaper march → more marches*, and it needs explicit counts.

Hired counts are multiples of ten wherever the cap allows (the `ceil(n/10)` rule charges the same for 28 as for 30). Two leadership choices per (subset, spend): **min L**, the smallest proportional scaling of the `msRelaxed` troop shape that keeps every troop stack strictly above the biggest hired stack, and **full L**, all 4,343. Campaign cap: 30 marches for the table that is comparable with `searchComplete`, and 300 for the uncapped one.

## Scenario B (bonuses proven in game) — the main one

### Retrain plan, at most 30 marches (comparable with `searchComplete`)

| budget S | best plan | spend | L | marches | stopped by | total avg damage | silver | gold | potions | EMH6/ABT6/LGN6/CHR6 left | `searchComplete` (same plan, ≤30) | hand / search |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2,000,000 | 7 types (ARC2 RD2 RD3 + hired) | 20 % (20/20/10/10) | min L 1,162 | 3 | silver | 5,680,053 | 1,895,400 | 987 | 7,020 | 86/70/69/34 | 6,079,306 (msRelaxed · 75 % · 1 marches · 8 types) | 93.4 % |
| 5,000,000 | 7 types (ARC2 RD2 RD3 + hired) | 100 % (92/76/72/37) | min L 4,343 | 2 | silver | 14,600,282 | 4,723,000 | 2,766 | 17,703 | 73/61/57/29 | 15,152,056 (msRelaxed · 100 % · 2 marches · 7 types) | 96.4 % |
| 10,000,000 | 7 types (ARC2 RD2 RD3 + hired) | 20 % (20/20/10/10) | min L 1,162 | 15 | silver | 28,400,265 | 9,477,000 | 4,935 | 35,100 | 62/46/57/22 | 30,396,530 (msRelaxed · 75 % · 5 marches · 8 types) | 93.4 % |
| 20,000,000 | 7 types (ARC2 RD2 RD3 + hired) | 20 % (20/20/10/10) | min L 1,162 | 30 | marches | 56,592,404 | 18,954,000 | 9,829 | 70,185 | 32/16/42/7 | 56,246,733 (msRelaxed · 75 % · 10 marches · 8 types) | 100.6 % |
| 40,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) | 30 % (30/20/20/10) | min L 2,430 | 30 | marches | 88,021,500 | 38,742,000 | 12,115 | 159,594 | 9/16/12/7 | 97,947,354 (ms · 40 % · 22 marches · 10 types) | 89.9 % |

### Revive plan (temple 15), at most 30 marches

| budget S | best plan | spend | L | marches | stopped by | total avg damage | silver | gold | potions | EMH6/ABT6/LGN6/CHR6 left | `searchComplete` (same plan, ≤30) | hand / search |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2,000,000 | 7 types (ARC2 RD2 RD3 + hired) | 20 % (20/20/10/10) | min L 1,162 | 30 | marches | 56,592,404 | 1,926,000 | 91,727 | 70,185 | 32/16/42/7 | 56,246,733 (msRelaxed · 75 % · 10 marches · 8 types) | 100.6 % |
| 5,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) | 50 % (50/40/40/20) | min L 4,037 | 23 | silver | 96,817,924 | 4,963,400 | 230,575 | 201,918 | 8/6/5/0 | 113,941,944 (ms · 25 % · 30 marches · 12 types) | 85.0 % |
| 10,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) | 50 % (50/40/40/20) | full L 4,343 | 30 | marches | 111,261,571 | 6,975,000 | 318,871 | 280,983 | 1/0/0/0 | 120,375,404 (ms · 25 % · 30 marches · 11 types) | 92.4 % |
| 20,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) | 50 % (50/40/40/20) | full L 4,343 | 30 | marches | 111,261,571 | 6,975,000 | 318,871 | 280,983 | 1/0/0/0 | 120,375,404 (ms · 25 % · 30 marches · 11 types) | 92.4 % |
| 40,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) | 50 % (50/40/40/20) | full L 4,343 | 30 | marches | 111,261,571 | 6,975,000 | 318,871 | 280,983 | 1/0/0/0 | 120,375,404 (ms · 25 % · 30 marches · 11 types) | 92.4 % |

### Retrain plan, uncapped (up to 300 marches)

| budget S | best plan | spend | L | marches | stopped by | total avg damage | silver | gold | potions | EMH6/ABT6/LGN6/CHR6 left | `searchComplete` (same plan, ≤30) | hand / search |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2,000,000 | 7 types (ARC2 RD2 RD3 + hired) | 20 % (20/20/10/10) | min L 1,162 | 3 | silver | 5,680,053 | 1,895,400 | 987 | 7,020 | 86/70/69/34 | 6,079,306 (msRelaxed · 75 % · 1 marches · 8 types) | 93.4 % |
| 5,000,000 | 7 types (ARC2 RD2 RD3 + hired) | 100 % (92/76/72/37) | min L 4,343 | 2 | silver | 14,600,282 | 4,723,000 | 2,766 | 17,703 | 73/61/57/29 | 15,152,056 (msRelaxed · 100 % · 2 marches · 7 types) | 96.4 % |
| 10,000,000 | 7 types (ARC2 RD2 RD3 + hired) | 20 % (20/20/10/10) | min L 1,162 | 15 | silver | 28,400,265 | 9,477,000 | 4,935 | 35,100 | 62/46/57/22 | 30,396,530 (msRelaxed · 75 % · 5 marches · 8 types) | 93.4 % |
| 20,000,000 | 7 types (ARC2 RD2 RD3 + hired) | 20 % (20/20/10/10) | min L 1,162 | 31 | silver | 58,247,343 | 19,585,800 | 10,106 | 72,504 | 30/14/41/6 | 56,246,733 (msRelaxed · 75 % · 10 marches · 8 types) | 103.6 % |
| 40,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) | 20 % (20/20/10/10) | min L 1,613 | 46 | silver | 91,313,862 | 39,435,800 | 12,338 | 162,438 | 5/0/26/0 | 97,947,354 (ms · 40 % · 22 marches · 10 types) | 93.2 % |

### Revive plan (temple 15), uncapped (up to 300 marches)

| budget S | best plan | spend | L | marches | stopped by | total avg damage | silver | gold | potions | EMH6/ABT6/LGN6/CHR6 left | `searchComplete` (same plan, ≤30) | hand / search |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2,000,000 | 7 types (ARC2 RD2 RD3 + hired) | 20 % (20/20/10/10) | min L 1,162 | 31 | silver | 58,247,343 | 1,990,200 | 94,734 | 72,504 | 30/14/41/6 | 56,246,733 (msRelaxed · 75 % · 10 marches · 8 types) | 103.6 % |
| 5,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) | 30 % (30/20/20/10) | min L 2,430 | 37 | silver | 99,453,134 | 4,884,000 | 224,176 | 195,912 | 2/6/4/0 | 113,941,944 (ms · 25 % · 30 marches · 12 types) | 87.3 % |
| 10,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) | 30 % (30/20/20/10) | full L 4,343 | 43 | stock | 133,323,643 | 9,997,500 | 452,323 | 400,302 | 0/0/0/0 | 120,375,404 (ms · 25 % · 30 marches · 11 types) | 110.8 % |
| 20,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) | 20 % (20/20/10/10) | full L 4,343 | 72 | stock | 176,041,232 | 16,740,000 | 748,636 | 665,835 | 0/0/0/0 | 120,375,404 (ms · 25 % · 30 marches · 11 types) | 146.2 % |
| 40,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) | 20 % (20/20/10/10) | full L 4,343 | 72 | stock | 176,041,232 | 16,740,000 | 748,636 | 665,835 | 0/0/0/0 | 120,375,404 (ms · 25 % · 30 marches · 11 types) | 146.2 % |

### The whole grid at S = 20,000,000 (retrain, ≤ 30 marches)

| subset | spend | hired counts | L choice | L | silver/march | marches | total avg damage | stopped by | mercenaries left |
|---|---|---|---|---|---|---|---|---|---|
| 7 types (ARC2 RD2 RD3 + hired) | 100 % | 92/76/72/37 | min L | 4,343 | 2,361,500 | 8 | 47,757,824 | silver | 36/30/28/14 |
| 7 types (ARC2 RD2 RD3 + hired) | 100 % | 92/76/72/37 | full L | 4,343 | 2,361,500 | 8 | 47,757,824 | silver | 36/30/28/14 |
| 7 types (ARC2 RD2 RD3 + hired) | 80 % | 70/60/60/30 | min L | 4,071 | 2,213,500 | 9 | 51,768,321 | silver | 36/28/27/13 |
| 7 types (ARC2 RD2 RD3 + hired) | 80 % | 70/60/60/30 | full L | 4,343 | 2,361,500 | 8 | 48,332,297 | silver | 40/32/30/15 |
| 7 types (ARC2 RD2 RD3 + hired) | 60 % | 60/50/40/20 | min L | 3,488 | 1,896,400 | 10 | 49,877,144 | silver | 36/28/32/17 |
| 7 types (ARC2 RD2 RD3 + hired) | 60 % | 60/50/40/20 | full L | 4,343 | 2,361,500 | 8 | 43,241,314 | silver | 45/36/40/21 |
| 7 types (ARC2 RD2 RD3 + hired) | 50 % | 50/40/40/20 | min L | 2,908 | 1,581,200 | 12 | 53,739,474 | silver | 33/28/25/13 |
| 7 types (ARC2 RD2 RD3 + hired) | 50 % | 50/40/40/20 | full L | 4,343 | 2,361,500 | 8 | 41,026,272 | silver | 52/44/40/21 |
| 7 types (ARC2 RD2 RD3 + hired) | 40 % | 40/30/30/10 | min L | 2,325 | 1,264,100 | 15 | 48,884,350 | silver | 32/31/27/22 |
| 7 types (ARC2 RD2 RD3 + hired) | 40 % | 40/30/30/10 | full L | 4,343 | 2,361,500 | 8 | 31,848,048 | silver | 60/52/48/29 |
| 7 types (ARC2 RD2 RD3 + hired) | 30 % | 30/20/20/10 | min L | 1,751 | 951,900 | 21 | 52,609,410 | silver | 29/34/30/16 |
| 7 types (ARC2 RD2 RD3 + hired) | 30 % | 30/20/20/10 | full L | 4,343 | 2,361,500 | 8 | 27,412,224 | silver | 68/60/56/29 |
| 7 types (ARC2 RD2 RD3 + hired) | 20 % | 20/20/10/10 | min L | 1,162 | 631,800 | 30 | 56,592,404 | marches | 32/16/42/7 |
| 7 types (ARC2 RD2 RD3 + hired) | 20 % | 20/20/10/10 | full L | 4,343 | 2,361,500 | 8 | 24,187,840 | silver | 76/60/64/29 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 100 % | 92/76/72/37 | min L | 4,343 | 2,308,300 | 8 | 47,459,033 | silver | 36/30/28/14 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 100 % | 92/76/72/37 | full L | 4,343 | 2,308,300 | 8 | 47,459,033 | silver | 36/30/28/14 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 80 % | 70/60/60/30 | min L | 4,343 | 2,308,300 | 8 | 47,834,555 | silver | 40/32/30/15 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 80 % | 70/60/60/30 | full L | 4,343 | 2,308,300 | 8 | 47,834,555 | silver | 40/32/30/15 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 60 % | 60/50/40/20 | min L | 4,343 | 2,308,300 | 8 | 46,387,913 | silver | 45/36/40/21 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 60 % | 60/50/40/20 | full L | 4,343 | 2,308,300 | 8 | 46,387,913 | silver | 45/36/40/21 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 50 % | 50/40/40/20 | min L | 4,037 | 2,145,700 | 9 | 50,182,101 | silver | 47/40/36/19 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 50 % | 50/40/40/20 | full L | 4,343 | 2,308,300 | 8 | 45,445,408 | silver | 52/44/40/21 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 40 % | 40/30/30/10 | min L | 3,229 | 1,716,100 | 11 | 43,996,359 | silver | 48/43/39/26 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 40 % | 40/30/30/10 | full L | 4,343 | 2,308,300 | 8 | 35,055,744 | silver | 60/52/48/29 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 30 % | 30/20/20/10 | min L | 2,430 | 1,291,400 | 15 | 45,295,680 | silver | 47/46/42/22 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 30 % | 30/20/20/10 | full L | 4,343 | 2,308,300 | 8 | 29,408,480 | silver | 68/60/56/29 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 20 % | 20/20/10/10 | min L | 1,613 | 857,300 | 23 | 53,741,386 | silver | 46/30/49/14 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 20 % | 20/20/10/10 | full L | 4,343 | 2,308,300 | 8 | 26,184,096 | silver | 76/60/64/29 |

### The leadership lever, isolated (same subset, same spend, min L vs full L)

The tables above mix three decisions. Here only the leadership moves: for every (subset, spend) the best of the two leadership choices is reported, so the ratio is the lever and nothing else.

| plan | budget S | best subset · spend | min L: marches / damage | full L: marches / damage | min L wins by |
|---|---|---|---|---|---|
| retrain | 2,000,000 | 7 types (ARC2 RD2 RD3 + hired) · 20 % | 3 / 5,680,053 | 0 / 0 | ∞ (full L cannot afford one march) |
| retrain | 5,000,000 | 7 types (ARC2 RD2 RD3 + hired) · 100 % | 2 / 14,600,282 | 2 / 14,600,282 | 0.0 % |
| retrain | 10,000,000 | 7 types (ARC2 RD2 RD3 + hired) · 20 % | 15 / 28,400,265 | 4 / 12,093,920 | 134.8 % |
| retrain | 20,000,000 | 7 types (ARC2 RD2 RD3 + hired) · 20 % | 30 / 56,592,404 | 8 / 24,187,840 | 134.0 % |
| retrain | 40,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) · 30 % | 30 / 88,021,500 | 17 / 62,493,020 | 40.9 % |
| revive | 2,000,000 | 7 types (ARC2 RD2 RD3 + hired) · 20 % | 30 / 56,592,404 | 8 / 24,187,840 | 134.0 % |
| revive | 5,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) · 50 % | 23 / 96,817,924 | 21 / 94,985,988 | 1.9 % |
| revive | 10,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) · 50 % | 30 / 108,114,961 | 30 / 111,261,571 | -2.8 % |
| revive | 20,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) · 50 % | 30 / 108,114,961 | 30 / 111,261,571 | -2.8 % |
| revive | 40,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) · 50 % | 30 / 108,114,961 | 30 / 111,261,571 | -2.8 % |

### What reviving does, plan by plan (S = 20 M, ≤ 30 marches)

| subset | spend | L choice | retrain: marches / damage / silver / gold | revive: marches / damage / silver / gold | silver ratio |
|---|---|---|---|---|---|
| 7 types (ARC2 RD2 RD3 + hired) | 100 % | full L | 8 / 47,757,824 / 18,892,000 / 8,053 | 27 / 94,256,606 / 6,404,400 / 287,576 | ÷ 2.9 |
| 7 types (ARC2 RD2 RD3 + hired) | 80 % | full L | 8 / 48,332,297 / 18,892,000 / 7,982 | 28 / 97,917,337 / 6,641,600 / 298,081 | ÷ 2.8 |
| 7 types (ARC2 RD2 RD3 + hired) | 60 % | full L | 8 / 43,241,314 / 18,892,000 / 7,016 | 29 / 101,027,631 / 6,878,800 / 308,622 | ÷ 2.7 |
| 7 types (ARC2 RD2 RD3 + hired) | 50 % | full L | 8 / 41,026,272 / 18,892,000 / 6,400 | 30 / 102,821,602 / 7,116,000 / 318,946 | ÷ 2.7 |
| 7 types (ARC2 RD2 RD3 + hired) | 40 % | full L | 8 / 31,848,048 / 18,892,000 / 4,520 | 30 / 101,459,963 / 7,116,000 / 319,095 | ÷ 2.7 |
| 7 types (ARC2 RD2 RD3 + hired) | 30 % | full L | 8 / 27,412,224 / 18,892,000 / 3,392 | 30 / 100,497,680 / 7,116,000 / 318,538 | ÷ 2.7 |
| 7 types (ARC2 RD2 RD3 + hired) | 20 % | full L | 8 / 24,187,840 / 18,892,000 / 2,632 | 30 / 90,496,274 / 7,116,000 / 316,277 | ÷ 2.7 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 100 % | full L | 8 / 47,459,033 / 18,466,400 / 8,053 | 27 / 96,230,614 / 6,277,500 / 287,510 | ÷ 2.9 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 80 % | full L | 8 / 47,834,555 / 18,466,400 / 7,982 | 28 / 99,790,496 / 6,510,000 / 298,007 | ÷ 2.8 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 60 % | full L | 8 / 46,387,913 / 18,466,400 / 7,016 | 29 / 106,963,858 / 6,742,500 / 308,550 | ÷ 2.7 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 50 % | full L | 8 / 45,445,408 / 18,466,400 / 6,400 | 30 / 111,261,571 / 6,975,000 / 318,871 | ÷ 2.6 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 40 % | full L | 8 / 35,055,744 / 18,466,400 / 4,520 | 30 / 110,288,824 / 6,975,000 / 319,010 | ÷ 2.6 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 30 % | full L | 8 / 29,408,480 / 18,466,400 / 3,392 | 30 / 107,711,940 / 6,975,000 / 318,450 | ÷ 2.6 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 20 % | full L | 8 / 26,184,096 / 18,466,400 / 2,632 | 30 / 97,951,948 / 6,975,000 / 316,189 | ÷ 2.6 |


## Scenario A (export bonuses)

### Retrain plan, at most 30 marches (comparable with `searchComplete`)

| budget S | best plan | spend | L | marches | stopped by | total avg damage | silver | gold | potions | EMH6/ABT6/LGN6/CHR6 left | `searchComplete` (same plan, ≤30) | hand / search |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2,000,000 | 7 types (ARC2 RD2 RD3 + hired) | 20 % (20/20/10/10) | min L 1,161 | 3 | silver | 4,051,686 | 1,893,900 | 987 | 7,020 | 86/70/69/34 | 4,369,814 (msRelaxed · 75 % · 1 marches · 8 types) | 92.7 % |
| 5,000,000 | 7 types (ARC2 RD2 RD3 + hired) | 100 % (92/76/72/37) | min L 4,343 | 2 | silver | 10,153,202 | 4,723,000 | 2,766 | 17,709 | 73/61/57/29 | 10,751,842 (msRelaxed · 100 % · 2 marches · 7 types) | 94.4 % |
| 10,000,000 | 7 types (ARC2 RD2 RD3 + hired) | 20 % (20/20/10/10) | min L 1,161 | 15 | silver | 20,258,430 | 9,469,500 | 4,935 | 35,100 | 62/46/57/22 | 21,849,070 (msRelaxed · 75 % · 5 marches · 8 types) | 92.7 % |
| 20,000,000 | 7 types (ARC2 RD2 RD3 + hired) | 20 % (20/20/10/10) | min L 1,161 | 30 | marches | 40,357,716 | 18,939,000 | 9,829 | 70,185 | 32/16/42/7 | 40,064,916 (msRelaxed · 75 % · 10 marches · 8 types) | 100.7 % |
| 40,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) | 30 % (30/20/20/10) | min L 2,438 | 30 | marches | 60,825,043 | 38,862,000 | 12,115 | 160,224 | 9/16/12/7 | 71,430,216 (msRelaxed · 30 % · 24 marches · 12 types) | 85.2 % |

### Revive plan (temple 15), at most 30 marches

| budget S | best plan | spend | L | marches | stopped by | total avg damage | silver | gold | potions | EMH6/ABT6/LGN6/CHR6 left | `searchComplete` (same plan, ≤30) | hand / search |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2,000,000 | 7 types (ARC2 RD2 RD3 + hired) | 20 % (20/20/10/10) | min L 1,161 | 30 | marches | 40,357,716 | 1,926,000 | 91,639 | 70,185 | 32/16/42/7 | 40,064,916 (msRelaxed · 75 % · 10 marches · 8 types) | 100.7 % |
| 5,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) | 50 % (50/40/40/20) | min L 4,053 | 23 | silver | 65,860,151 | 4,974,900 | 231,476 | 202,815 | 8/6/5/0 | 86,136,027 (msRelaxed · 30 % · 29 marches · 12 types) | 76.5 % |
| 10,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) | 50 % (50/40/40/20) | full L 4,343 | 30 | marches | 73,761,975 | 6,975,000 | 318,871 | 281,073 | 1/0/0/0 | 88,828,879 (msRelaxed · 30 % · 30 marches · 12 types) | 83.0 % |
| 20,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) | 50 % (50/40/40/20) | full L 4,343 | 30 | marches | 73,761,975 | 6,975,000 | 318,871 | 281,073 | 1/0/0/0 | 88,828,879 (msRelaxed · 30 % · 30 marches · 12 types) | 83.0 % |
| 40,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) | 50 % (50/40/40/20) | full L 4,343 | 30 | marches | 73,761,975 | 6,975,000 | 318,871 | 281,073 | 1/0/0/0 | 88,828,879 (msRelaxed · 30 % · 30 marches · 12 types) | 83.0 % |

### Retrain plan, uncapped (up to 300 marches)

| budget S | best plan | spend | L | marches | stopped by | total avg damage | silver | gold | potions | EMH6/ABT6/LGN6/CHR6 left | `searchComplete` (same plan, ≤30) | hand / search |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2,000,000 | 7 types (ARC2 RD2 RD3 + hired) | 20 % (20/20/10/10) | min L 1,161 | 3 | silver | 4,051,686 | 1,893,900 | 987 | 7,020 | 86/70/69/34 | 4,369,814 (msRelaxed · 75 % · 1 marches · 8 types) | 92.7 % |
| 5,000,000 | 7 types (ARC2 RD2 RD3 + hired) | 100 % (92/76/72/37) | min L 4,343 | 2 | silver | 10,153,202 | 4,723,000 | 2,766 | 17,709 | 73/61/57/29 | 10,751,842 (msRelaxed · 100 % · 2 marches · 7 types) | 94.4 % |
| 10,000,000 | 7 types (ARC2 RD2 RD3 + hired) | 20 % (20/20/10/10) | min L 1,161 | 15 | silver | 20,258,430 | 9,469,500 | 4,935 | 35,100 | 62/46/57/22 | 21,849,070 (msRelaxed · 75 % · 5 marches · 8 types) | 92.7 % |
| 20,000,000 | 7 types (ARC2 RD2 RD3 + hired) | 20 % (20/20/10/10) | min L 1,161 | 31 | silver | 41,525,878 | 19,570,300 | 10,106 | 72,504 | 30/14/41/6 | 40,064,916 (msRelaxed · 75 % · 10 marches · 8 types) | 103.6 % |
| 40,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) | 20 % (20/20/10/10) | min L 1,621 | 46 | silver | 63,534,318 | 39,619,800 | 12,338 | 163,404 | 5/0/26/0 | 71,430,216 (msRelaxed · 30 % · 24 marches · 12 types) | 88.9 % |

### Revive plan (temple 15), uncapped (up to 300 marches)

| budget S | best plan | spend | L | marches | stopped by | total avg damage | silver | gold | potions | EMH6/ABT6/LGN6/CHR6 left | `searchComplete` (same plan, ≤30) | hand / search |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2,000,000 | 7 types (ARC2 RD2 RD3 + hired) | 20 % (20/20/10/10) | min L 1,161 | 31 | silver | 41,525,878 | 1,990,200 | 94,643 | 72,504 | 30/14/41/6 | 40,064,916 (msRelaxed · 75 % · 10 marches · 8 types) | 103.6 % |
| 5,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) | 30 % (30/20/20/10) | min L 2,438 | 37 | silver | 68,125,284 | 4,884,000 | 224,952 | 196,689 | 2/6/4/0 | 86,136,027 (msRelaxed · 30 % · 29 marches · 12 types) | 79.1 % |
| 10,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) | 30 % (30/20/20/10) | full L 4,343 | 43 | stock | 86,003,728 | 9,997,500 | 452,323 | 400,431 | 0/0/0/0 | 88,828,879 (msRelaxed · 30 % · 30 marches · 12 types) | 96.8 % |
| 20,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) | 20 % (20/20/10/10) | full L 4,343 | 72 | stock | 108,490,646 | 16,740,000 | 748,636 | 666,051 | 0/0/0/0 | 88,828,879 (msRelaxed · 30 % · 30 marches · 12 types) | 122.1 % |
| 40,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) | 20 % (20/20/10/10) | full L 4,343 | 72 | stock | 108,490,646 | 16,740,000 | 748,636 | 666,051 | 0/0/0/0 | 88,828,879 (msRelaxed · 30 % · 30 marches · 12 types) | 122.1 % |

### The whole grid at S = 20,000,000 (retrain, ≤ 30 marches)

| subset | spend | hired counts | L choice | L | silver/march | marches | total avg damage | stopped by | mercenaries left |
|---|---|---|---|---|---|---|---|---|---|
| 7 types (ARC2 RD2 RD3 + hired) | 100 % | 92/76/72/37 | min L | 4,343 | 2,361,500 | 8 | 33,199,537 | silver | 36/30/28/14 |
| 7 types (ARC2 RD2 RD3 + hired) | 100 % | 92/76/72/37 | full L | 4,343 | 2,361,500 | 8 | 33,199,537 | silver | 36/30/28/14 |
| 7 types (ARC2 RD2 RD3 + hired) | 80 % | 70/60/60/30 | min L | 4,062 | 2,208,600 | 9 | 34,839,394 | silver | 36/28/27/13 |
| 7 types (ARC2 RD2 RD3 + hired) | 80 % | 70/60/60/30 | full L | 4,343 | 2,361,500 | 8 | 33,821,671 | silver | 40/32/30/15 |
| 7 types (ARC2 RD2 RD3 + hired) | 60 % | 60/50/40/20 | min L | 3,487 | 1,895,900 | 10 | 35,064,714 | silver | 36/28/32/17 |
| 7 types (ARC2 RD2 RD3 + hired) | 60 % | 60/50/40/20 | full L | 4,343 | 2,361,500 | 8 | 30,049,598 | silver | 45/36/40/21 |
| 7 types (ARC2 RD2 RD3 + hired) | 50 % | 50/40/40/20 | min L | 2,908 | 1,581,200 | 12 | 37,883,001 | silver | 33/28/25/13 |
| 7 types (ARC2 RD2 RD3 + hired) | 50 % | 50/40/40/20 | full L | 4,343 | 2,361,500 | 8 | 28,316,584 | silver | 52/44/40/21 |
| 7 types (ARC2 RD2 RD3 + hired) | 40 % | 40/30/30/10 | min L | 2,324 | 1,263,600 | 15 | 34,194,446 | silver | 32/31/27/22 |
| 7 types (ARC2 RD2 RD3 + hired) | 40 % | 40/30/30/10 | full L | 4,343 | 2,361,500 | 8 | 21,396,456 | silver | 60/52/48/29 |
| 7 types (ARC2 RD2 RD3 + hired) | 30 % | 30/20/20/10 | min L | 1,752 | 952,400 | 20 | 35,210,160 | silver | 32/36/32/17 |
| 7 types (ARC2 RD2 RD3 + hired) | 30 % | 30/20/20/10 | full L | 4,343 | 2,361,500 | 8 | 18,100,008 | silver | 68/60/56/29 |
| 7 types (ARC2 RD2 RD3 + hired) | 20 % | 20/20/10/10 | min L | 1,161 | 631,300 | 30 | 40,357,716 | marches | 32/16/42/7 |
| 7 types (ARC2 RD2 RD3 + hired) | 20 % | 20/20/10/10 | full L | 4,343 | 2,361,500 | 8 | 15,733,800 | silver | 76/60/64/29 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 100 % | 92/76/72/37 | min L | 4,343 | 2,307,900 | 8 | 32,647,483 | silver | 36/30/28/14 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 100 % | 92/76/72/37 | full L | 4,343 | 2,307,900 | 8 | 32,647,483 | silver | 36/30/28/14 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 80 % | 70/60/60/30 | min L | 4,343 | 2,307,900 | 8 | 32,044,643 | silver | 40/32/30/15 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 80 % | 70/60/60/30 | full L | 4,343 | 2,307,900 | 8 | 32,044,643 | silver | 40/32/30/15 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 60 % | 60/50/40/20 | min L | 4,343 | 2,307,900 | 8 | 31,859,582 | silver | 45/36/40/21 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 60 % | 60/50/40/20 | full L | 4,343 | 2,307,900 | 8 | 31,859,582 | silver | 45/36/40/21 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 50 % | 50/40/40/20 | min L | 4,053 | 2,153,700 | 9 | 35,042,274 | silver | 47/40/36/19 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 50 % | 50/40/40/20 | full L | 4,343 | 2,307,900 | 8 | 31,567,944 | silver | 52/44/40/21 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 40 % | 40/30/30/10 | min L | 3,238 | 1,720,600 | 11 | 30,421,028 | silver | 48/43/39/26 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 40 % | 40/30/30/10 | full L | 4,343 | 2,307,900 | 8 | 23,717,576 | silver | 60/52/48/29 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 30 % | 30/20/20/10 | min L | 2,438 | 1,295,400 | 15 | 31,395,495 | silver | 47/46/42/22 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 30 % | 30/20/20/10 | full L | 4,343 | 2,307,900 | 8 | 19,490,888 | silver | 68/60/56/29 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 20 % | 20/20/10/10 | min L | 1,621 | 861,300 | 23 | 37,953,519 | silver | 46/30/49/14 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 20 % | 20/20/10/10 | full L | 4,343 | 2,307,900 | 8 | 17,124,680 | silver | 76/60/64/29 |

### The leadership lever, isolated (same subset, same spend, min L vs full L)

The tables above mix three decisions. Here only the leadership moves: for every (subset, spend) the best of the two leadership choices is reported, so the ratio is the lever and nothing else.

| plan | budget S | best subset · spend | min L: marches / damage | full L: marches / damage | min L wins by |
|---|---|---|---|---|---|
| retrain | 2,000,000 | 7 types (ARC2 RD2 RD3 + hired) · 20 % | 3 / 4,051,686 | 0 / 0 | ∞ (full L cannot afford one march) |
| retrain | 5,000,000 | 7 types (ARC2 RD2 RD3 + hired) · 100 % | 2 / 10,153,202 | 2 / 10,153,202 | 0.0 % |
| retrain | 10,000,000 | 7 types (ARC2 RD2 RD3 + hired) · 20 % | 15 / 20,258,430 | 4 / 7,866,900 | 157.5 % |
| retrain | 20,000,000 | 7 types (ARC2 RD2 RD3 + hired) · 20 % | 30 / 40,357,716 | 8 / 15,733,800 | 156.5 % |
| retrain | 40,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) · 30 % | 30 / 60,825,043 | 17 / 41,418,137 | 46.9 % |
| revive | 2,000,000 | 7 types (ARC2 RD2 RD3 + hired) · 20 % | 30 / 40,357,716 | 8 / 15,733,800 | 156.5 % |
| revive | 5,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) · 50 % | 23 / 65,860,151 | 21 / 64,545,168 | 2.0 % |
| revive | 10,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) · 50 % | 30 / 72,189,765 | 30 / 73,761,975 | -2.1 % |
| revive | 20,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) · 50 % | 30 / 72,189,765 | 30 / 73,761,975 | -2.1 % |
| revive | 40,000,000 | 8 types (ARC2 SP2 RD2 RD3 + hired) · 50 % | 30 / 72,189,765 | 30 / 73,761,975 | -2.1 % |

### What reviving does, plan by plan (S = 20 M, ≤ 30 marches)

| subset | spend | L choice | retrain: marches / damage / silver / gold | revive: marches / damage / silver / gold | silver ratio |
|---|---|---|---|---|---|
| 7 types (ARC2 RD2 RD3 + hired) | 100 % | full L | 8 / 33,199,537 / 18,892,000 / 8,053 | 27 / 62,119,233 / 6,404,400 / 287,576 | ÷ 2.9 |
| 7 types (ARC2 RD2 RD3 + hired) | 80 % | full L | 8 / 33,821,671 / 18,892,000 / 7,982 | 28 / 64,745,300 / 6,641,600 / 298,081 | ÷ 2.8 |
| 7 types (ARC2 RD2 RD3 + hired) | 60 % | full L | 8 / 30,049,598 / 18,892,000 / 7,016 | 29 / 66,952,788 / 6,878,800 / 308,622 | ÷ 2.7 |
| 7 types (ARC2 RD2 RD3 + hired) | 50 % | full L | 8 / 28,316,584 / 18,892,000 / 6,400 | 30 / 67,813,611 / 7,116,000 / 318,946 | ÷ 2.7 |
| 7 types (ARC2 RD2 RD3 + hired) | 40 % | full L | 8 / 21,396,456 / 18,892,000 / 4,520 | 30 / 66,758,297 / 7,116,000 / 319,095 | ÷ 2.7 |
| 7 types (ARC2 RD2 RD3 + hired) | 30 % | full L | 8 / 18,100,008 / 18,892,000 / 3,392 | 30 / 66,157,907 / 7,116,000 / 318,538 | ÷ 2.7 |
| 7 types (ARC2 RD2 RD3 + hired) | 20 % | full L | 8 / 15,733,800 / 18,892,000 / 2,632 | 30 / 58,842,606 / 7,116,000 / 316,277 | ÷ 2.7 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 100 % | full L | 8 / 32,647,483 / 18,463,200 / 8,053 | 27 / 62,975,155 / 6,277,500 / 287,510 | ÷ 2.9 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 80 % | full L | 8 / 32,044,643 / 18,463,200 / 7,982 | 28 / 64,433,828 / 6,510,000 / 298,007 | ÷ 2.8 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 60 % | full L | 8 / 31,859,582 / 18,463,200 / 7,016 | 29 / 70,355,828 / 6,742,500 / 308,550 | ÷ 2.7 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 50 % | full L | 8 / 31,567,944 / 18,463,200 / 6,400 | 30 / 73,761,975 / 6,975,000 / 318,871 | ÷ 2.6 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 40 % | full L | 8 / 23,717,576 / 18,463,200 / 4,520 | 30 / 73,050,409 / 6,975,000 / 319,010 | ÷ 2.6 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 30 % | full L | 8 / 19,490,888 / 18,463,200 / 3,392 | 30 / 71,124,883 / 6,975,000 / 318,450 | ÷ 2.6 |
| 8 types (ARC2 SP2 RD2 RD3 + hired) | 20 % | full L | 8 / 17,124,680 / 18,463,200 / 2,632 | 30 / 64,035,150 / 6,975,000 / 316,189 | ÷ 2.6 |


## What the leadership dimension says


- **Cutting the leadership is the only way silver buys more marches.** At full leadership the silver per
  march is fixed, so `S` and the troop set alone decide the march count. At min L the same `S` pays for
  substantially more marches, each one carrying the *same hired damage* — which is the free half. Scenario B,
  7 types at 20 % spend, min L 1,162 of 4,343: **15 marches instead of 4 for S = 10 M, and 28.4 M damage
  instead of 12.1 M — +135 %.** At S = 2 M full leadership cannot afford a single march and min L fights
  three.
- **Whether that wins depends on which constraint bites first.** At small and middling budgets silver binds
  and the cheap march wins outright (+134 %, +135 %, +41 % at S = 10, 20 and 40 M under retrain). At large
  budgets the stock binds: once `ceil(n/10)` has eaten the mercenaries, extra cheap marches are troop-only
  marches worth a fraction of a real one, and full leadership wins back — under the **revive** plan at
  S ≥ 10 M full L is already 2.8 % ahead.
- **Reviving moves the line, hard.** The Temple divides the silver per march by about ten, so a 2 M budget
  that bought three cheap marches under retrain buys thirty under revive: **56.6 M damage for 1.93 M silver
  and 91.7 K gold** — ten times the retrain plan's total at the same silver. Beyond that the constraint is
  no longer silver but gold (≈ 320 K for thirty marches) and stock, and the leadership lever stops mattering.
- **The ceiling of this account, at 20 % spend and revive, is ≈ 176 M total damage over 72 marches** (the
  uncapped table), at which point every mercenary is gone. That is the number 92 + 76 + 72 + 37 of stock is
  actually worth if it is spent ten units at a time instead of all at once.
- **`searchComplete` cannot express any of this**, because every march it plays is sized by `sizeStacks` at
  full leadership. Read the "hand / search" column with care: the hand grid only carries **two** subsets
  against the search's 4,095, so a figure below 100 % is the search winning on *subset choice*, not the
  leadership lever losing. The isolated table above is the lever on its own. The missing engine feature is a
  **troop budget** — a leadership target below the housing — in `CampaignSettings`.
