# 227 — what the push costs the clock

Medians over 9 runs of each piece (the Generate over 3: it is seconds, and a median of three is the same
number twice). `plan` is `planCampaign` — the worker's own job, **unchanged by this story**; `battle` is one
`applyCounts` replay, the unit the March is billed in; `push` is one `pushedCounts`, the arithmetic.

| army | stacks | plan | battle | push | push per re-derive (worst) | share of the plan |
|---|---|---|---|---|---|---|
| his camp of 2026-10-12 | 16 | 264 ms | 94 µs | 86 µs | 0.54 ms | 0.205 % |
| first-run army, Bear V ×1 (20 000 leadership) | 11 | 8 ms | 45 µs | 8 µs | 0.16 ms | 2.114 % |
| first-run army, Bear V ×2 (20 000 leadership) | 11 | 19 ms | 39 µs | 8 µs | 0.14 ms | 0.748 % |
| first-run army, Bear V ×3 (20 000 leadership) | 11 | 11 ms | 29 µs | 8 µs | 0.11 ms | 1.044 % |
| first-run army, Bear V ×10 (20 000 leadership) | 11 | 21 ms | 23 µs | 8 µs | 0.09 ms | 0.427 % |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 11 | 47 ms | 22 µs | 11 µs | 0.10 ms | 0.214 % |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 20 | 324 ms | 41 µs | 37 µs | 0.24 ms | 0.073 % |

## What the numbers say
- **The Generate is not touched.** The push lives in `src/ui/sections/march/raise.ts` and nothing under `src/engine/`, `src/worker/` or `kernel/` changed, so `planCampaign` — the job the worker runs, which is what "generating" costs — is the same code on the same plan. The column above is the same number with the push in the tree and with it out of it.
- **What it adds to the March**, worst case **0.54 ms** a re-derivation: **two battle replays** for the two pool lines' offers (none where a pool cannot be pushed), **a third** when a pool stands pushed — the worst case this table measures — and **three passes of arithmetic** (`pushedCounts`: the composed vector and one per pool), against the one replay the March already owed, so the replays go from one to three, and the arithmetic is `90 µs`-scale.
- **How often that runs**: the March re-derives when the answer, the raise position or an edit moves — not per progress tick (`progress` is not a dependency of the memo) — and a couple more times around a Generate as the plan's priced rows land.
- **As a share of the plan**: **0.073 %** on the heaviest army (his camp) to **2.114 %** on the trivial ones, which plan in milliseconds — the added work is the same tenth of a millisecond either way. Nothing of it is inside the plan.
- `pushedCounts` itself is bounded: one pass per stack of the march at most (the chain can only travel one link a pass), each pass linear in the stacks, and **no battle at all** — it reads counts and health.
