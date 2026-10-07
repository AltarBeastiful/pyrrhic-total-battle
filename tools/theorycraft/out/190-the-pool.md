---
type: experiment
title: "190 — the pool's speed-up"
created: 2026-10-07
tags: [w17, pool, advisor]
related: ["[[Progression-Advisor-Plan]]"]
---

# 190 — the pool's speed-up

The 19 benchmark armies (as the app plans them, with no `budgetMs`, as pool jobs do) planned through
`src/worker/pool.ts` with real module workers and the real kernel, headless Chromium, Vite dev server.
Machine: 16 logical cores (`navigator.hardwareConcurrency` 16), AMD Ryzen 7 PRO 6850U with Radeon Graphics.
Each N: one warm-up pass, then 3 timed passes. Jobs are taken in benchmark order (no cost hint).

| N | wall (min of runs) | runs | speed-up | plans identical to Node (`retype.ms` aside) |
|---|---|---|---|---|
| 1 | 4,085 ms | 4,085 · 4,106 · 4,135 | ×1.00 | yes, 19/19 |
| 2 | 2,598 ms | 2,761 · 2,598 · 2,666 | ×1.57 | yes, 19/19 |
| 4 | 2,154 ms | 2,295 · 2,237 · 2,154 | ×1.90 | yes, 19/19 |
| 6 | 2,014 ms | 2,244 · 2,025 · 2,014 | ×2.03 | yes, 19/19 |

Sum of each job alone (warm, one worker): 4,083 ms; the longest job alone: 1,531 ms (first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp)), so no N can finish under it: the ceiling here is ×2.67.
Node, same inputs, single thread: 5,723 ms.

## The advisor's shape: one army planned 24 times (2026-09-17 export, its setup (7 000 leadership))

| N | wall (min of runs) | runs | speed-up |
|---|---|---|---|
| 1 | 7,303 ms | 7,751 · 7,303 · 7,607 | ×1.00 |
| 2 | 4,144 ms | 4,314 · 4,144 · 4,340 | ×1.76 |
| 4 | 2,632 ms | 2,766 · 2,632 · 2,633 | ×2.77 |
| 6 | 1,860 ms | 2,445 · 1,860 · 2,400 | ×3.93 |

## Per army

| army | alone in the browser | Node |
|---|---|---|
| 2026-09-17 export, its setup (7 000 leadership) | 315 ms | 632 ms |
| 2026-09-17 export, 12 000 leadership | 284 ms | 434 ms |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 171 ms | 235 ms |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 294 ms | 419 ms |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | 77 ms | 137 ms |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | 143 ms | 220 ms |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | 86 ms | 124 ms |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | 76 ms | 110 ms |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | 134 ms | 202 ms |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | 156 ms | 253 ms |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | 226 ms | 297 ms |
| first-run army, Bear V ×1 (20 000 leadership) | 5 ms | 8 ms |
| first-run army, Bear V ×2 (20 000 leadership) | 13 ms | 26 ms |
| first-run army, Bear V ×3 (20 000 leadership) | 9 ms | 13 ms |
| first-run army, Bear V ×10 (20 000 leadership) | 17 ms | 25 ms |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 37 ms | 59 ms |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 438 ms | 568 ms |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 1,531 ms | 1,840 ms |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 71 ms | 121 ms |

