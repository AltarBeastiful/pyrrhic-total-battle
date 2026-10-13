---
title: "228 — the captain lineup"
---

# 228 — the captain lineup

The captain pass weighed **trios** whatever the march fielded, so the owner’s one-captain march was read against C(8,3) = 56 trios — which two more captains to add, when his other captains march elsewhere. C5c weighs the lineups of the march’s **own size** instead. Each army is the owner’s 2026-10-07 account as the app plans it (`buildPlanRequest`), read twice on the same march: **new** at the march’s own size, **old** forced to trios. The oracle plans every candidate in full (no clock, `confirm` = the pool), so the gain is the true best of the pool, not a shortlist’s. Gains are in the owner’s `rate()`; one lane in Node, wall one thread’s.

## Readings

| army | reading | candidates | stops | stops with a gain | best lineup | gain % | wall ms |
|---|---|---|---|---|---|---|---|
| Aydae alone (9 000 leadership) — the live march | new (size 1) | 8 | 5 | 0 | aydae | 0.000 | 2,881 |
| Aydae alone (9 000 leadership) — the live march | old (trios) | 57 | 5 | 5 | aydae + ingrid + minamoto | 16.939 | 20,853 |
| Aydae alone (5 000 leadership) | new (size 1) | 8 | 5 | 0 | aydae | 0.000 | 1,107 |
| Aydae alone (5 000 leadership) | old (trios) | 57 | 5 | 5 | aydae + ingrid + leonidas | 12.607 | 8,313 |
| Aydae + Leonidas (2 on the march) | new (size 2) | 28 | 5 | 0 | aydae + leonidas | 0.000 | 9,220 |
| Aydae + Leonidas (2 on the march) | old (trios) | 57 | 5 | 5 | aydae + ingrid + leonidas | 6.570 | 19,570 |
| Aydae + Leonidas + Alexander (3 on the march) | new (size 3) | 56 | 5 | 2 | aydae + ingrid + leonidas | 3.334 | 20,354 |
| Bernard + Ingrid (2 on the march) | new (size 2) | 28 | 5 | 5 | aydae + ingrid | 35.907 | 10,960 |
| Bernard + Ingrid (2 on the march) | old (trios) | 57 | 5 | 5 | alexander + aydae + leonidas | 40.335 | 23,200 |

## What each says

**Aydae alone (9 000 leadership) — the live march — new (size 1)** (8 candidates, 2,881 ms). Marched: aydae. aydae is already the best of the 8 lineups: no stop gains.
**Aydae alone (9 000 leadership) — the live march — old (trios)** (57 candidates, 20,853 ms). Marched: aydae. 5 of 5 stops have a better lineup; the biggest is aydae + ingrid + minamoto on the silver-saver stop, **+16.94 %** on the owner's rating.
**Aydae alone (5 000 leadership) — new (size 1)** (8 candidates, 1,107 ms). Marched: aydae. aydae is already the best of the 8 lineups: no stop gains.
**Aydae alone (5 000 leadership) — old (trios)** (57 candidates, 8,313 ms). Marched: aydae. 5 of 5 stops have a better lineup; the biggest is aydae + ingrid + leonidas on the sweet-spot stop, **+12.61 %** on the owner's rating.
**Aydae + Leonidas (2 on the march) — new (size 2)** (28 candidates, 9,220 ms). Marched: aydae + leonidas. aydae + leonidas is already the best of the 28 lineups: no stop gains.
**Aydae + Leonidas (2 on the march) — old (trios)** (57 candidates, 19,570 ms). Marched: aydae + leonidas. 5 of 5 stops have a better lineup; the biggest is aydae + ingrid + leonidas on the sweet-spot stop, **+6.57 %** on the owner's rating.
**Aydae + Leonidas + Alexander (3 on the march) — new (size 3)** (56 candidates, 20,354 ms). Marched: alexander + aydae + leonidas. 2 of 5 stops have a better lineup; the biggest is aydae + ingrid + leonidas on the burn-saver stop, **+3.33 %** on the owner's rating.
**Bernard + Ingrid (2 on the march) — new (size 2)** (28 candidates, 10,960 ms). Marched: bernard + ingrid. 5 of 5 stops have a better lineup; the biggest is aydae + ingrid on the more-mercs stop, **+35.91 %** on the owner's rating.
**Bernard + Ingrid (2 on the march) — old (trios)** (57 candidates, 23,200 ms). Marched: bernard + ingrid. 5 of 5 stops have a better lineup; the biggest is alexander + aydae + leonidas on the more-mercs stop, **+40.33 %** on the owner's rating.

**Read**: with one captain on the march the new pass names a **single** captain to swap in, never a trio to add; the candidate count falls from C(8,3) = 56 (57 with the marched one) to C(8,1) = 8 (28 at two on the march), so the pass is cheaper by construction, and the reading stays the march’s own set — a swap the player can actually make.
