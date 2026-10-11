# 202 — screen with As is, then read the survivors with Tight

Generic probes on one inline lane, no clock. Worth = a gain of at least 0.25 (rating points ≈ % damage). Gains are the rows' best stop gain unless a pick is named.


## Per army

| army | probes | wall tight (ms) | wall as-is (ms) | as-is / tight | ρ best gain | ρ sweet-spot | worthy (tight) | top-gain gap |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| account pyrrhic-my-account-2026-10-07.json | 29 | 30,975 | 16,792 | 0.54 | 0.98 | 0.71 | 11 | 4.91 |
| 2026-09-17 export, its setup (7 000 leadership) | 29 | 14,573 | 14,358 | 0.99 | 0.97 | 1.00 | 1 | 3.06 |
| 2026-09-17 export, 12 000 leadership | 29 | 14,832 | 14,158 | 0.95 | 0.99 | 1.00 | 3 | 6.11 |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 29 | 7,735 | 10,345 | 1.34 | 1.00 | 1.00 | 4 | 0.64 |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 29 | 24,419 | 25,382 | 1.04 | 1.00 | 0.89 | 3 | 4.33 |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | 29 | 7,384 | 6,819 | 0.92 | 1.00 | 1.00 | 0 | 0.01 |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | 29 | 10,580 | 7,126 | 0.67 | 0.85 | 1.00 | 9 | 40.63 |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | 29 | 4,732 | 4,548 | 0.96 | 1.00 | 1.00 | 4 | 0.01 |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | 29 | 4,259 | 4,505 | 1.06 | 1.00 | 1.00 | 6 | 0.00 |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | 29 | 7,035 | 6,979 | 0.99 | 1.00 | 1.00 | 10 | 1.44 |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | 29 | 9,375 | 7,973 | 0.85 | 0.99 | 1.00 | 2 | 0.24 |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | 29 | 11,335 | 10,751 | 0.95 | 1.00 | 1.00 | 1 | 0.00 |
| first-run army, Bear V ×1 (20 000 leadership) | 29 | 271 | 192 | 0.71 | 1.00 | 1.00 | 3 | 0.00 |
| first-run army, Bear V ×2 (20 000 leadership) | 29 | 604 | 637 | 1.05 | 1.00 | 1.00 | 3 | 0.00 |
| first-run army, Bear V ×3 (20 000 leadership) | 29 | 420 | 419 | 1.00 | 1.00 | 1.00 | 3 | 0.04 |
| first-run army, Bear V ×10 (20 000 leadership) | 29 | 900 | 805 | 0.89 | 1.00 | 1.00 | 3 | 0.00 |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 29 | 1,882 | 1,746 | 0.93 | 1.00 | 1.00 | 4 | 0.00 |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 29 | 18,669 | 16,770 | 0.90 | 0.79 | 1.00 | 13 | 2.04 |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 29 | 5,295,790 | 53,751 | 0.01 | 0.17 | 0.51 | 13 | 12.41 |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 29 | 2,632 | 2,691 | 1.02 | 0.85 | 1.00 | 8 | 2.90 |

## Survivor rules against the Tight answer (pooled over the armies)

| rule | probes kept / read | Tight top 5 kept | worthy kept | gain missed | best probe missed in |
|---|---:|---:|---:|---:|---:|
| top 3 | 60 / 580 (10 %) | 52 / 100 | 49 / 104 | 43.0 % | 4 / 20 armies |
| top 5 | 100 / 580 (17 %) | 85 / 100 | 67 / 104 | 32.8 % | 3 / 20 armies |
| top 8 | 160 / 580 (28 %) | 92 / 100 | 82 / 104 | 23.7 % | 3 / 20 armies |
| top 12 | 240 / 580 (41 %) | 94 / 100 | 92 / 104 | 18.1 % | 2 / 20 armies |
| gain ≥ 0.25 × best | 82 / 580 (14 %) | 64 / 100 | 63 / 104 | 24.5 % | 4 / 20 armies |
| gain ≥ 0.5 × best | 54 / 580 (9 %) | 42 / 100 | 48 / 104 | 36.1 % | 4 / 20 armies |
| gain > 0 (any) | 238 / 580 (41 %) | 94 / 100 | 94 / 104 | 7.2 % | 3 / 20 armies |
| top 5 ∪ gain ≥ 0.25 × best | 113 / 580 (19 %) | 89 / 100 | 78 / 104 | 22.1 % | 3 / 20 armies |

Total wall: Tight 5,468,401 ms, As is 206,746 ms (0.04×). Largest per-stop gain gap anywhere: 40.63.
