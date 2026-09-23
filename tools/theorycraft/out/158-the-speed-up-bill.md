# 158 — the training-time hit, paid in the owner’s own speed-ups

Stock 13 606.6 h: 1 min × 487 · 15 min × 574 · 1 h × 510 · 3 h × 286 · 8 h × 102 · 15 h × 49 · 1 day × 439. One training order a troop stack, each covered as cheaply as the items left allow; campaign after campaign until an order cannot be covered. **Queue** is the orders’ total a campaign (four marches); **consumed** what the first campaign actually burns from the stock, waste included; **campaigns** how many whole ones the stock pays for. Shipped = the bar as it stands; re-typed = 157’s rated reading.

## Every stop of every test case

| use case | stop | orders a campaign | queue (shipped → re-typed) | consumed, 1st campaign (shipped → re-typed) | campaigns the stock pays (shipped → re-typed) |
|---|---|---:|---|---|---|
| first-run army, Bear V ×1 (20 000 leader | SW | 40 | 2,522 → 2,524 h (+0.1 %) | 2,522 → 2,524 h (waste 0.0 % → 0.0 %) | 5 → 5 |
| first-run army, Bear V ×2 (20 000 leader | SW | 40 | 2,522 → 2,524 h (+0.1 %) | 2,522 → 2,524 h (waste 0.0 % → 0.0 %) | 5 → 5 |
| first-run army, Bear V ×3 (20 000 leader | SW | 40 | 2,522 → 2,524 h (+0.1 %) | 2,522 → 2,524 h (waste 0.0 % → 0.0 %) | 5 → 5 |
| first-run army, Bear V ×3 (20 000 leader | AI | 40 | 2,522 → 2,524 h (+0.1 %) | 2,522 → 2,524 h (waste 0.0 % → 0.0 %) | 5 → 5 |
| first-run army, Bear V ×10 (20 000 leade | SW | 40 | 2,522 → 2,524 h (+0.1 %) | 2,522 → 2,524 h (waste 0.0 % → 0.0 %) | 5 → 5 |
| first-run army, Bear V ×10 (20 000 leade | AI | 33 | 3,417 → 3,423 h (+0.2 %) | 3,417 → 3,423 h (waste 0.0 % → 0.0 %) | 3 → 3 |
| first-run army, Epic Monster Hunter VI × | HS | 40 | 2,522 → 2,524 h (+0.1 %) | 2,522 → 2,524 h (waste 0.0 % → 0.0 %) | 5 → 5 |
| first-run army, Epic Monster Hunter VI × | SW | 40 | 2,522 → 2,524 h (+0.1 %) | 2,522 → 2,524 h (waste 0.0 % → 0.0 %) | 5 → 5 |
| first-run army, Epic Monster Hunter VI × | MX | 40 | 2,522 → 2,524 h (+0.1 %) | 2,522 → 2,524 h (waste 0.0 % → 0.0 %) | 5 → 5 |
| first-run army, Epic Monster Hunter VI × | AI | 38 | 2,718 → 2,722 h (+0.1 %) | 2,718 → 2,722 h (waste 0.0 % → 0.0 %) | 5 → 4 |
| first-run army, monster tiers 3–5 at 900 | HS | 76 | 2,861 → 2,863 h (+0.1 %) | 2,863 → 2,864 h (waste 0.0 % → 0.0 %) | 4 → 4 |
| first-run army, monster tiers 3–5 at 900 | SW | 79 | 2,911 → 2,913 h (+0.1 %) | 2,913 → 2,914 h (waste 0.1 % → 0.0 %) | 4 → 4 |
| first-run army, monster tiers 3–5 at 900 | MM | 79 | 2,911 → 2,913 h (+0.1 %) | 2,913 → 2,914 h (waste 0.1 % → 0.0 %) | 4 → 4 |
| first-run army, monster tiers 3–5 at 900 | MX | 73 | 3,210 → 3,215 h (+0.1 %) | 3,211 → 3,216 h (waste 0.0 % → 0.0 %) | 4 → 4 |
| first-run army, monster tiers 3–5 at 900 | AI | 67 | 3,439 → 3,444 h (+0.2 %) | 3,439 → 3,445 h (waste 0.0 % → 0.0 %) | 3 → 3 |
| the 4 000-leadership case of 2026-09-15  | SS | 32 | 238 → 237 h (−0.3 %) | 238 → 237 h (waste 0.0 % → 0.0 %) | 26 → 26 |
| the 4 000-leadership case of 2026-09-15  | SW | 32 | 380 → 381 h (+0.3 %) | 380 → 381 h (waste 0.0 % → 0.0 %) | 21 → 21 |
| the 4 000-leadership case of 2026-09-15  | AI | 32 | 380 → 381 h (+0.2 %) | 380 → 381 h (waste 0.0 % → 0.0 %) | 21 → 21 |
| 2026-09-17 export, its setup (7 000 lead | HS | 28 | 683 → 683 h (+0.0 %) | 683 → 683 h (waste 0.0 % → 0.0 %) | 16 → 16 |
| 2026-09-17 export, its setup (7 000 lead | SS | 28 | 583 → 583 h (+0.0 %) | 583 → 583 h (waste 0.0 % → 0.0 %) | 18 → 18 |
| 2026-09-17 export, its setup (7 000 lead | SW | 28 | 731 → 731 h (+0.0 %) | 731 → 731 h (waste 0.0 % → 0.0 %) | 16 → 16 |
| 2026-09-17 export, its setup (7 000 lead | MX | 28 | 739 → 740 h (+0.1 %) | 739 → 740 h (waste 0.0 % → 0.0 %) | 15 → 15 |
| 2026-09-17 export, its setup (7 000 lead | AI | 12 | 1,793 → 1,695 h (−5.5 %) | 1,793 → 1,695 h (waste 0.0 % → 0.0 %) | 7 → 8 |
| 2026-09-17 export, 12 000 leadership | HS | 28 | 1,194 → 1,195 h (+0.0 %) | 1,194 → 1,195 h (waste 0.0 % → 0.0 %) | 10 → 10 |
| 2026-09-17 export, 12 000 leadership | SS | 28 | 814 → 814 h (+0.0 %) | 814 → 814 h (waste 0.0 % → 0.0 %) | 14 → 14 |
| 2026-09-17 export, 12 000 leadership | SW | 28 | 1,268 → 1,269 h (+0.1 %) | 1,268 → 1,269 h (waste 0.0 % → 0.0 %) | 10 → 10 |
| 2026-09-17 export, 12 000 leadership | MX | 22 | 1,814 → 1,811 h (−0.2 %) | 1,814 → 1,811 h (waste 0.0 % → 0.0 %) | 7 → 7 |
| live account of 2026-09-18 (one hired ty | SS | 27 | 1,317 → 1,310 h (−0.5 %) | 1,317 → 1,310 h (waste 0.0 % → 0.0 %) | 10 → 10 |
| live account of 2026-09-18 (one hired ty | SW | 28 | 1,999 → 1,999 h | 1,999 → 1,999 h (waste 0.0 % → 0.0 %) | 6 → 6 |
| live account of 2026-09-18 (one hired ty | MX | 28 | 1,977 → 1,977 h | 1,977 → 1,977 h (waste 0.0 % → 0.0 %) | 6 → 6 |
| live account of 2026-09-18 (one hired ty | AI | 28 | 2,026 → 2,026 h | 2,026 → 2,026 h (waste 0.0 % → 0.0 %) | 6 → 6 |
| live account, evening (hunters 83, legio | HS | 28 | 1,010 → 1,013 h (+0.3 %) | 1,010 → 1,014 h (waste 0.0 % → 0.0 %) | 12 → 12 |
| live account, evening (hunters 83, legio | SS | 28 | 814 → 815 h (+0.1 %) | 814 → 815 h (waste 0.0 % → 0.0 %) | 14 → 14 |
| live account, evening (hunters 83, legio | SW | 28 | 1,124 → 1,125 h (+0.0 %) | 1,124 → 1,125 h (waste 0.0 % → 0.0 %) | 11 → 11 |
| live account, evening (hunters 83, legio | MX | 28 | 1,149 → 1,150 h (+0.1 %) | 1,149 → 1,150 h (waste 0.0 % → 0.0 %) | 11 → 11 |
| live account, evening (hunters 83, legio | AI | 22 | 1,539 → 1,540 h (+0.0 %) | 1,539 → 1,540 h (waste 0.0 % → 0.0 %) | 8 → 8 |
| Aydae alone, 4 975 (one captain, four hi | HS | 32 | 324 → 323 h (−0.3 %) | 324 → 323 h (waste 0.0 % → 0.0 %) | 23 → 23 |
| Aydae alone, 4 975 (one captain, four hi | SW | 29 | 500 → 500 h (+0.1 %) | 500 → 500 h (waste 0.0 % → 0.0 %) | 20 → 20 |
| Aydae alone, 4 975 (one captain, four hi | MX | 20 | 696 → 696 h (+0.1 %) | 696 → 696 h (waste 0.0 % → 0.0 %) | 18 → 18 |
| Aydae alone, 4 975 (one captain, four hi | AI | 9 | 1,425 → 1,425 h (+0.0 %) | 1,425 → 1,425 h (waste 0.0 % → 0.0 %) | 9 → 9 |
| the owner’s live camp of 2026-09-18 (arb | HS | 28 | 477 → 476 h (−0.1 %) | 477 → 476 h (waste 0.0 % → 0.0 %) | 20 → 20 |
| the owner’s live camp of 2026-09-18 (arb | SS | 13 | 753 → 521 h (−30.9 %) | 753 → 521 h (waste 0.0 % → 0.0 %) | 18 → 25 |
| the owner’s live camp of 2026-09-18 (arb | SW | 19 | 1,024 → 1,025 h (+0.0 %) | 1,024 → 1,025 h (waste 0.0 % → 0.0 %) | 13 → 13 |
| the owner’s live camp of 2026-09-18 (arb | MM | 10 | 1,839 → 1,839 h (+0.0 %) | 1,839 → 1,839 h (waste 0.0 % → 0.0 %) | 7 → 7 |
| the owner’s live camp of 2026-09-18 (arb | MX | 10 | 1,839 → 1,839 h (+0.0 %) | 1,839 → 1,839 h (waste 0.0 % → 0.0 %) | 7 → 7 |
| his camp of 2026-09-19, the localStorage | HS | 28 | 510 → 510 h (+0.1 %) | 510 → 510 h (waste 0.0 % → 0.0 %) | 21 → 21 |
| his camp of 2026-09-19, the localStorage | SS | 22 | 627 → 536 h (−14.5 %) | 627 → 536 h (waste 0.0 % → 0.0 %) | 18 → 21 |
| his camp of 2026-09-19, the localStorage | SW | 22 | 760 → 760 h (+0.0 %) | 760 → 760 h (waste 0.0 % → 0.0 %) | 16 → 16 |
| his camp of 2026-09-19, the localStorage | MM | 13 | 1,234 → 1,222 h (−1.0 %) | 1,234 → 1,222 h (waste 0.0 % → 0.0 %) | 11 → 11 |
| his camp of 2026-09-19, the localStorage | MX | 4 | 2,174 → 2,174 h | 2,174 → 2,174 h (waste -0.0 % → -0.0 %) | 6 → 6 |
| his camp of 2026-09-19, as his message r | HS | 20 | 756 → 747 h (−1.1 %) | 756 → 747 h (waste 0.0 % → 0.0 %) | 16 → 17 |
| his camp of 2026-09-19, as his message r | SW | 17 | 967 → 965 h (−0.2 %) | 967 → 965 h (waste -0.0 % → 0.0 %) | 13 → 13 |
| his camp of 2026-09-19, as his message r | MM | 11 | 1,288 → 1,216 h (−5.6 %) | 1,288 → 1,216 h (waste 0.0 % → 0.0 %) | 10 → 11 |
| his camp of 2026-09-19, as his message r | MX | 11 | 1,328 → 1,255 h (−5.5 %) | 1,328 → 1,255 h (waste -0.0 % → 0.0 %) | 10 → 10 |
| his camp of 2026-09-19, as his message r | AI | 11 | 1,354 → 1,304 h (−3.7 %) | 1,354 → 1,304 h (waste 0.0 % → 0.0 %) | 10 → 10 |
| his TotalStack profile of 2026-09-19 (5  | SS | 48 | 279 → 279 h (+0.1 %) | 279 → 279 h (waste 0.0 % → 0.0 %) | 19 → 19 |
| his TotalStack profile of 2026-09-19 (5  | SW | 45 | 570 → 571 h (+0.2 %) | 570 → 571 h (waste 0.0 % → 0.0 %) | 15 → 15 |
| his TotalStack profile of 2026-09-19 (5  | MX | 42 | 658 → 660 h (+0.2 %) | 658 → 660 h (waste 0.0 % → 0.0 %) | 14 → 14 |
| his usual setup of 2026-09-19 (Aydae alo | HS | 48 | 375 → 375 h (−0.0 %) | 375 → 375 h (waste 0.0 % → 0.0 %) | 17 → 17 |
| his usual setup of 2026-09-19 (Aydae alo | SW | 48 | 506 → 507 h (+0.1 %) | 506 → 507 h (waste 0.0 % → 0.0 %) | 15 → 15 |
| his usual setup of 2026-09-19 (Aydae alo | MX | 42 | 661 → 663 h (+0.2 %) | 661 → 663 h (waste 0.0 % → 0.0 %) | 14 → 14 |


## The global hit

Over all **61** stops of the 17 test cases, one campaign each:

| | shipped | re-typed | change |
|---|---:|---:|---:|
| queue, summed | 88,134 h | 87,544 h | -0.67 % |
| speed-ups consumed, first campaign, summed | 88,143 h | 87,552 h | -0.67 % |
| waste in that | 0.01 % | 0.01 % | |
| campaigns the stock pays, summed over stops | 692 | 704 | 1.73 % |

Stops whose queue grows: **42 of 61**. Stops the stock pays for fewer whole campaigns of: **1**:

- **first-run army, Epic Monster Hunter VI ×83 (20** AI: 5 → 4 campaigns

