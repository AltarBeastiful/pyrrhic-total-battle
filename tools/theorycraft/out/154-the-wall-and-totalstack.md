# 154 — the troop wall on every use case, and the bar against TotalStack

Codes: **HS** hired saver · **SS** silver saver · **SW** sweet spot · **MM** more mercs · **MX** steady max · **AI** all in. Four-march campaigns, worst opening, default recovery; the queue is one training queue’s total over the four marches, speed bonuses on, no speed-up items.

## §1 — how many use cases switch to a single troop stack

**2 of 17** use cases put a single-stack stop on the bar — **3 of 61** stops in all.

| use case | stops before | stops with the wall | single-stack stops | most damage | best dmg a silver |
|---|---|---|---|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership) | SW | SW | — | 18,189,008 | 0.559 |
| first-run army, Bear V ×2 (20 000 leadership) | SW | SW | — | 18,413,408 | 0.566 |
| first-run army, Bear V ×3 (20 000 leadership) | SW · AI | SW · AI | — | 18,750,008 | 0.576 |
| first-run army, Bear V ×10 (20 000 leadership) | SW · AI | SW · AI | — | 20,893,375 | 0.639 |
| first-run army, Epic Monster Hunter VI ×83 (20 0 | HS · SW · MX · AI | HS · SW · MX · AI | — | 29,841,879 | 0.913 |
| first-run army, monster tiers 3–5 at 900 dominan | HS · SW · MM · MX · AI | HS · SW · MM · MX · AI | — | 102,971,902 | 2.759 |
| the 4 000-leadership case of 2026-09-15 (TotalSt | SS · SW · AI | SS · SW · AI | — | 8,519,930 | 1.401 |
| 2026-09-17 export, its setup (7 000 leadership) | HS · SS · SW · MX · AI | HS · SS · SW · MX · AI | — | 23,619,920 | 2.078 |
| 2026-09-17 export, 12 000 leadership | HS · SS · SW · MX | HS · SS · SW · MX | — | 31,963,845 | 1.754 |
| live account of 2026-09-18 (one hired type, 20 0 | SS · SW · MX · AI | SS · SW · MX · AI | — | 29,743,332 | 0.963 |
| live account, evening (hunters 83, legionaries u | HS · SS · SW · MX · AI | HS · SS · SW · MX · AI | — | 31,714,657 | 1.787 |
| Aydae alone, 4 975 (one captain, four hired type | HS · SW · MX · AI | HS · SW · MX · AI | — | 18,744,735 | 2.087 |
| the owner’s live camp of 2026-09-18 (arbalesters | HS · SW · MM · MX · AI | HS · SS · SW · MM · MX | MM (rider-3 2,441), MX (rider-3 2,441) | **15,306,859 → 30,986,506 (+102.4 %)** | **1.638 → 2.541 (+55.1 %)** |
| his camp of 2026-09-19, the localStorage dump (4 | HS · SS · SW · MM · MX | HS · SS · SW · MM · MX | MX (rider-3 2,390) | **13,842,678 → 23,589,127 (+70.4 %)** | **1.321 → 1.808 (+36.9 %)** |
| his camp of 2026-09-19, as his message reads it  | HS · SW · MM · MX · AI | HS · SW · MM · MX · AI | — | 11,585,381 | 1.069 |
| his TotalStack profile of 2026-09-19 (5 225 / 2  | SS · SW · MX | SS · SW · MX | — | 8,408,431 | 1.110 |
| his usual setup of 2026-09-19 (Aydae alone, 5 20 | HS · SW · MX | HS · SW · MX | — | 11,721,371 | 1.411 |


## §2 — our best row against TotalStack (17 use cases, the wall allowed)

Each cell is **ours / theirs**. “Our best row” is the stop ahead of their row on the most criteria.

| use case | our stop | their row | dmg a gold | dmg a silver | hired lost | damage | silver | gold | dragon coins | training queue | dmg a merc | dmg a coin | ahead–behind |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leader | SW | Total Optimization | = — / — | ✗ 0.56 / 0.56 | = 1 / 1 | ✗ 18.19M / 18.22M | ✓ 32.53M / 32.53M | = 0 / 0 | = 0 / 0 | ✓ 2,522h / 2,523h | = 112k / 112k | = — / — | 2–2 |
| first-run army, Bear V ×2 (20 000 leader | SW | Total Optimization | ✗ 115k / 115k | ✗ 0.57 / 0.57 | = 2 / 2 | ✗ 18.41M / 18.44M | ✓ 32.53M / 32.53M | = 160 / 160 | = 0 / 0 | ✓ 2,522h / 2,523h | = 168k / 168k | = — / — | 2–3 |
| first-run army, Bear V ×3 (20 000 leader | SW | Total Optimization | ✓ — / 39k | ✗ 0.57 / 0.58 | = 3 / 3 | ✗ 18.41M / 18.78M | ✓ 32.53M / 32.53M | ✓ 0 / 480 | = 0 / 0 | ✓ 2,522h / 2,523h | ✗ 112k / 224k | = — / — | 4–3 |
| first-run army, Bear V ×10 (20 000 leade | AI | Total Optimization | ✗ 4,353 / 6,500 | ✗ 0.58 / 0.64 | = 4 / 4 | ✓ 20.89M / 20.80M | ✗ 36.01M / 32.53M | ✗ 4,800 / 3,200 | = 0 / 0 | ✗ 3,417h / 2,523h | ✓ 776k / 673k | = — / — | 2–5 |
| first-run army, Epic Monster Hunter VI × | MX | Total Optimization | ✓ 15k / 15k | ✗ 0.91 / 0.92 | ✓ 28 / 29 | ✗ 29.69M / 29.89M | ✓ 32.53M / 32.53M | ✓ 1,928 / 1,952 | = 0 / 0 | ✓ 2,522h / 2,523h | ✓ 415k / 406k | = — / — | 6–2 |
| first-run army, monster tiers 3–5 at 900 | MM | Total Optimization | ✗ 9,083 / 20k | ✓ 2.65 / 2.25 | ✓ 26 / 32 | ✓ 93.30M / 79.77M | ✓ 35.23M / 35.45M | ✗ 10k / 4,072 | ✓ 28k / 32k | ✓ 2,911h / 2,951h | ✓ 598k / 422k | ✓ 3,308 / 2,518 | 8–2 |
| the 4 000-leadership case of 2026-09-15  | SS | Total Optimization | ✓ 7,083 / 6,273 | ✗ 1.36 / 1.38 | ✓ 19 / 24 | ✗ 5.21M / 8.38M | ✓ 3.82M / 6.08M | ✓ 736 / 1,336 | = 0 / 0 | ✓ 238h / 380h | ✗ 190k / 262k | = — / — | 5–3 |
| 2026-09-17 export, its setup (7 000 lead | MX | Total Optimization | ✗ 5,693 / 11k | ✓ 2.08 / 1.00 | ✗ 55 / 16 | ✓ 22.77M / 11.01M | ✓ 10.96M / 10.97M | ✗ 4,000 / 960 | = 0 / 0 | ✓ 739h / 741h | ✓ 329k / 274k | = — / — | 5–3 |
| 2026-09-17 export, 12 000 leadership | SW | Total Optimization | ✗ 6,539 / 11k | ✓ 1.68 / 1.00 | ✗ 67 / 24 | ✓ 31.55M / 18.83M | ✓ 18.79M / 18.80M | ✗ 4,824 / 1,664 | = 0 / 0 | ✓ 1,268h / 1,271h | ✓ 334k / 311k | = — / — | 5–3 |
| live account of 2026-09-18 (one hired ty | MX | Total Optimization | ✓ 15k / 14k | ✓ 0.95 / 0.93 | ✓ 28 / 30 | ✗ 28.73M / 29.22M | ✓ 30.18M / 31.34M | ✓ 1,904 / 2,016 | = 0 / 0 | ✓ 1,977h / 2,118h | ✓ 307k / 304k | = — / — | 7–1 |
| live account, evening (hunters 83, legio | SW | Total Optimization | ✓ 6,938 / 6,551 | ✗ 1.65 / 1.93 | ✓ 61 / 74 | ✗ 28.14M / 33.33M | ✓ 17.07M / 17.23M | ✓ 4,056 / 5,088 | = 0 / 0 | ✓ 1,124h / 1,165h | ✓ 285k / 277k | = — / — | 6–2 |
| Aydae alone, 4 975 (one captain, four hi | SW | Total Optimization | ✓ 6,366 / 6,242 | ✗ 2.02 / 2.10 | ✓ 37 / 40 | ✗ 15.53M / 16.38M | ✓ 7.68M / 7.79M | ✓ 2,440 / 2,624 | = 0 / 0 | ✓ 500h / 527h | ✓ 301k / 299k | = — / — | 6–2 |
| the owner’s live camp of 2026-09-18 (arb | HS | Total Optimization | ✓ 5,705 / 832 | ✗ 1.14 / 6.32 | ✓ 16 / 374 | ✗ 8.26M / 49.23M | ✓ 7.24M / 7.79M | ✓ 1,448 / 59k | = 0 / 0 | ✓ 477h / 527h | ✓ 233k / 109k | = — / — | 6–2 |
| his camp of 2026-09-19, the localStorage | HS | Total Optimization | ✓ 17k / 578 | ✓ 0.86 / 0.82 | ✓ 6 / 156 | ✓ 6.64M / 6.42M | ✓ 7.72M / 7.79M | ✓ 392 / 11k | = 0 / 0 | ✓ 510h / 527h | ✓ 297k / 0 | = — / — | 8–0 |
| his camp of 2026-09-19, as his message r | AI | Total Optimization | ✓ 4,012 / 2,225 | ✓ 1.03 / 0.82 | ✓ 41 / 42 | ✓ 11.59M / 6.59M | ✗ 11.20M / 7.99M | ✓ 2,888 / 2,960 | = 0 / 0 | ✗ 1,354h / 540h | ✓ 159k / 0 | = — / — | 6–2 |
| his TotalStack profile of 2026-09-19 (5  | MX | Total Optimization | ✓ 5,308 / 3,473 | ✓ 0.97 / 0.85 | ✓ 25 / 29 | ✓ 8.41M / 6.78M | ✗ 8.70M / 7.99M | ✓ 1,584 / 1,952 | = 3,840 / 3,840 | ✗ 658h / 485h | ✓ 100k / 0 | ✓ 2,190 / 1,766 | 7–2 |
| his usual setup of 2026-09-19 (Aydae alo | SW | Total Optimization | ✗ 21k / 36k | ✓ 1.41 / 1.09 | ✗ 8 / 4 | ✓ 11.42M / 9.17M | ✓ 8.09M / 8.45M | ✗ 544 / 256 | ✗ 5,760 / 4,320 | ✓ 506h / 601h | ✗ 423k / 437k | ✗ 1,982 / 2,123 | 4–6 |

| criterion | ours better | level | theirs better |
|---|---:|---:|---:|
| dmg a gold | 10 | 1 | 6 |
| dmg a silver | 8 | 0 | 9 |
| hired lost | 10 | 4 | 3 |
| damage | 8 | 0 | 9 |
| silver | 14 | 0 | 3 |
| gold | 10 | 2 | 5 |
| dragon coins | 1 | 15 | 1 |
| training queue | 14 | 0 | 3 |
| dmg a merc | 12 | 2 | 3 |
| dmg a coin | 2 | 14 | 1 |


## §3 — our row closest in damage against TotalStack

★ where it is not the §2 row.

| use case | our stop | their row | dmg a gold | dmg a silver | hired lost | damage | silver | gold | dragon coins | training queue | dmg a merc | dmg a coin | ahead–behind |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leader | SW | Total Optimization | = — / — | ✗ 0.56 / 0.56 | = 1 / 1 | ✗ 18.19M / 18.22M | ✓ 32.53M / 32.53M | = 0 / 0 | = 0 / 0 | ✓ 2,522h / 2,523h | = 112k / 112k | = — / — | 2–2 |
| first-run army, Bear V ×2 (20 000 leader | SW | Total Optimization | ✗ 115k / 115k | ✗ 0.57 / 0.57 | = 2 / 2 | ✗ 18.41M / 18.44M | ✓ 32.53M / 32.53M | = 160 / 160 | = 0 / 0 | ✓ 2,522h / 2,523h | = 168k / 168k | = — / — | 2–3 |
| first-run army, Bear V ×3 (20 000 leader | AI ★ | Total Optimization | ✗ 39k / 39k | ✗ 0.58 / 0.58 | = 3 / 3 | ✗ 18.75M / 18.78M | ✓ 32.53M / 32.53M | = 480 / 480 | = 0 / 0 | ✓ 2,522h / 2,523h | = 224k / 224k | = — / — | 2–3 |
| first-run army, Bear V ×10 (20 000 leade | SW ★ | Total Optimization | ✗ 6,491 / 6,500 | ✗ 0.64 / 0.64 | = 4 / 4 | ✗ 20.77M / 20.80M | ✓ 32.53M / 32.53M | = 3,200 / 3,200 | = 0 / 0 | ✓ 2,522h / 2,523h | = 673k / 673k | = — / — | 2–3 |
| first-run army, Epic Monster Hunter VI × | AI ★ | Total Optimization | ✗ 15k / 15k | ✗ 0.90 / 0.92 | ✗ 30 / 29 | ✗ 29.84M / 29.89M | ✗ 33.29M / 32.53M | ✗ 2,016 / 1,952 | = 0 / 0 | ✗ 2,718h / 2,523h | ✗ 406k / 406k | = — / — | 0–8 |
| first-run army, monster tiers 3–5 at 900 | HS ★ | Total Optimization | ✗ 7,339 / 20k | ✓ 2.33 / 2.25 | ✓ 15 / 32 | ✓ 81.26M / 79.77M | ✓ 34.92M / 35.45M | ✗ 11k / 4,072 | ✓ 24k / 32k | ✓ 2,861h / 2,951h | ✓ 541k / 422k | ✓ 3,369 / 2,518 | 8–2 |
| the 4 000-leadership case of 2026-09-15  | AI ★ | Total Optimization | ✓ 6,377 / 6,273 | ✓ 1.40 / 1.38 | = 24 / 24 | ✓ 8.52M / 8.38M | = 6.08M / 6.08M | = 1,336 / 1,336 | = 0 / 0 | = 380h / 380h | = 262k / 262k | = — / — | 3–0 |
| 2026-09-17 export, its setup (7 000 lead | HS ★ | Total Optimization | ✗ 7,140 / 11k | ✓ 1.48 / 1.00 | ✗ 26 / 16 | ✓ 15.08M / 11.01M | ✓ 10.19M / 10.97M | ✗ 2,112 / 960 | = 0 / 0 | ✓ 683h / 741h | ✓ 356k / 274k | = — / — | 5–3 |
| 2026-09-17 export, 12 000 leadership | SS ★ | Total Optimization | ✗ 6,961 / 11k | ✓ 1.75 / 1.00 | ✗ 48 / 24 | ✓ 21.27M / 18.83M | ✓ 12.13M / 18.80M | ✗ 3,056 / 1,664 | = 0 / 0 | ✓ 814h / 1,271h | ✗ 297k / 311k | = — / — | 4–4 |
| live account of 2026-09-18 (one hired ty | MX | Total Optimization | ✓ 15k / 14k | ✓ 0.95 / 0.93 | ✓ 28 / 30 | ✗ 28.73M / 29.22M | ✓ 30.18M / 31.34M | ✓ 1,904 / 2,016 | = 0 / 0 | ✓ 1,977h / 2,118h | ✓ 307k / 304k | = — / — | 7–1 |
| live account, evening (hunters 83, legio | AI ★ | Total Optimization | ✗ 5,122 / 6,551 | ✗ 1.69 / 1.93 | ✗ 88 / 74 | ✗ 31.71M / 33.33M | ✗ 18.77M / 17.23M | ✗ 6,192 / 5,088 | = 0 / 0 | ✗ 1,539h / 1,165h | ✗ 272k / 277k | = — / — | 0–8 |
| Aydae alone, 4 975 (one captain, four hi | SW | Total Optimization | ✓ 6,366 / 6,242 | ✗ 2.02 / 2.10 | ✓ 37 / 40 | ✗ 15.53M / 16.38M | ✓ 7.68M / 7.79M | ✓ 2,440 / 2,624 | = 0 / 0 | ✓ 500h / 527h | ✓ 301k / 299k | = — / — | 6–2 |
| the owner’s live camp of 2026-09-18 (arb | MX ★ | Total Optimization | ✓ 1,078 / 832 | ✗ 2.54 / 6.32 | ✓ 208 / 374 | ✗ 30.99M / 49.23M | ✗ 12.19M / 7.79M | ✓ 29k / 59k | = 0 / 0 | ✗ 1,839h / 527h | ✓ 144k / 109k | = — / — | 4–4 |
| his camp of 2026-09-19, the localStorage | HS | Total Optimization | ✓ 17k / 578 | ✓ 0.86 / 0.82 | ✓ 6 / 156 | ✓ 6.64M / 6.42M | ✓ 7.72M / 7.79M | ✓ 392 / 11k | = 0 / 0 | ✓ 510h / 527h | ✓ 297k / 0 | = — / — | 8–0 |
| his camp of 2026-09-19, as his message r | HS ★ | Total Optimization | ✓ 7,010 / 2,225 | ✓ 0.88 / 0.82 | ✓ 15 / 42 | ✓ 7.40M / 6.59M | ✗ 8.37M / 7.99M | ✓ 1,056 / 2,960 | = 0 / 0 | ✗ 756h / 540h | ✓ 191k / 0 | = — / — | 6–2 |
| his TotalStack profile of 2026-09-19 (5  | SW ★ | Total Optimization | ✓ 6,199 / 3,473 | ✓ 0.98 / 0.85 | ✓ 19 / 29 | ✓ 8.18M / 6.78M | ✗ 8.34M / 7.99M | ✓ 1,320 / 1,952 | = 3,840 / 3,840 | ✗ 570h / 485h | ✓ 109k / 0 | ✓ 2,131 / 1,766 | 7–2 |
| his usual setup of 2026-09-19 (Aydae alo | HS ★ | Total Optimization | ✗ 23k / 36k | ✓ 1.34 / 1.09 | ✗ 5 / 4 | ✗ 8.18M / 9.17M | ✓ 6.13M / 8.45M | ✗ 352 / 256 | ✓ 3,960 / 4,320 | ✓ 375h / 601h | ✗ 317k / 437k | ✗ 2,067 / 2,123 | 4–6 |

| criterion | ours better | level | theirs better |
|---|---:|---:|---:|
| dmg a gold | 7 | 1 | 9 |
| dmg a silver | 9 | 0 | 8 |
| hired lost | 7 | 5 | 5 |
| damage | 7 | 0 | 10 |
| silver | 11 | 1 | 5 |
| gold | 6 | 5 | 6 |
| dragon coins | 2 | 15 | 0 |
| training queue | 11 | 1 | 5 |
| dmg a merc | 8 | 5 | 4 |
| dmg a coin | 2 | 14 | 1 |

