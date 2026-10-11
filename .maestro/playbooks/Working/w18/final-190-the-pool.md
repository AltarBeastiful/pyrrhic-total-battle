---
type: experiment
title: "190 — the pool's speed-up"
created: 2026-10-11
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
| 1 | 4,037 ms | 4,266 · 4,037 · 4,204 | ×1.00 | yes, 19/19 |
| 2 | 2,787 ms | 2,794 · 2,829 · 2,787 | ×1.45 | yes, 19/19 |
| 4 | 2,259 ms | 2,350 · 2,259 · 2,277 | ×1.79 | yes, 19/19 |
| 6 | 2,154 ms | 2,325 · 2,216 · 2,154 | ×1.87 | yes, 19/19 |

Sum of each job alone (warm, one worker): 4,115 ms; the longest job alone: 1,480 ms (first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp)), so no N can finish under it: the ceiling here is ×2.78.
Node, same inputs, single thread: 6,093 ms.

## The advisor's shape: one army planned 24 times (2026-09-17 export, its setup (7 000 leadership))

| N | wall (min of runs) | runs | speed-up |
|---|---|---|---|
| 1 | 7,635 ms | 8,051 · 7,898 · 7,635 | ×1.00 |
| 2 | 4,306 ms | 4,549 · 4,306 · 4,577 | ×1.77 |
| 4 | 2,727 ms | 2,892 · 2,803 · 2,727 | ×2.80 |
| 6 | 2,061 ms | 2,536 · 2,061 · 2,545 | ×3.70 |

## Per army

| army | alone in the browser | Node |
|---|---|---|
| 2026-09-17 export, its setup (7 000 leadership) | 333 ms | 716 ms |
| 2026-09-17 export, 12 000 leadership | 298 ms | 564 ms |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 180 ms | 253 ms |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 297 ms | 470 ms |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | 71 ms | 152 ms |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | 147 ms | 242 ms |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | 93 ms | 129 ms |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | 85 ms | 114 ms |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | 122 ms | 207 ms |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | 153 ms | 255 ms |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | 254 ms | 316 ms |
| first-run army, Bear V ×1 (20 000 leadership) | 14 ms | 13 ms |
| first-run army, Bear V ×2 (20 000 leadership) | 18 ms | 30 ms |
| first-run army, Bear V ×3 (20 000 leadership) | 8 ms | 11 ms |
| first-run army, Bear V ×10 (20 000 leadership) | 18 ms | 32 ms |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 42 ms | 67 ms |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 424 ms | 595 ms |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 1,480 ms | 1,812 ms |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 77 ms | 114 ms |

