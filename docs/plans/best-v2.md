# `Best` v2 — the plan's counts as a seed, its limits as the box (S-143b)

Owner, 2026-09-29: *"is there still room for improvement for the best selector? are we trying every possible
combination in the space we have (max dominance/authority and merc stock?)"* — and then, on what to do with
the answer: *"no cost limit as it's experimental for now and will be moved to assemblyscript for
precomputations or improving the results. Basically in the planner we've narrowed the field of research now we
can hammer down to find the few percentage left of gain if the user needs it."*

So this is no longer a UI question with a frame budget. **The plan's own march is the seed, and the plan's own
limits are the box**: every count vector from what the plan fields up to `min(shelter ceiling, owned stock)` a
hired type, under the authority or dominance the housing pays. The question is only how much of that box the
shipped `Best` leaves, and what it costs to take the rest.

**Answer: 10 of the 43 stops where a position moves anything give up between 0.41 % and 5.45 % of damage
(median 2.29 %), and `Best v2` — built as a research module and benchmarked against everything that ships —
takes all of it without ever coming out below `Best`.** Measured in `tools/theorycraft/out/180-the-positions.md`
(all positions, every stop of every benchmark army) and `out/181-best-headroom.md` (the exposure study).

## 1. The space, and what `Best` spends on it

| | measured |
|---|---|
| stops where a raise can move a count at all | **45** |
| the box — vectors per stop | **median 144**, max **908 684** |
| what `Best` evaluates | ~16 samples a stack + a ±step refinement, ≤ 3 sweeps — a few hundred replays |
| what that costs | **0.5 ms** median, **3.3 ms** worst, on one stop |

The median box is tiny — three or four hired types, spans of a few counts each — which is what the plan's own
trade leaves for the raise to take back. The cost limit is gone by the owner's own call, so nothing below is
chosen for being cheap.

## 2. What the extra search is worth

**The exposure study** (experiment 181) climbs the same box five stronger ways, each bounded exactly as the
app is — the same ceiling, the same stock, the same housing — so every win is a march the game would take:

| reading | beats `Best` on | median gain | worst |
|---|---|---|---|
| one stack, exhaustive — *the sampling fix alone* | 6 of 45 | +1.15 % | +3.90 % |
| pairwise — every pair, exhaustively | 8 of 44 | +2.23 % | +5.45 % |
| seeded restarts | 10 of 45 | +2.71 % | +5.45 % |
| **exhaustive — the control** | **10 of 42** | **+2.80 %** | **+5.45 %** |
| lowered — allowed *below* the plan's counts | 6 of 45 | +1.15 % | +3.90 % |

The control matters in both directions: it is what makes the other four trustworthy (on the stops small enough
to walk whole, the optimum is *known*, not argued), and it is the ceiling on the whole exercise — **10 stops is
all there is** on this corpus, and the search's own 10 (the restarts) reach it. The gaps are concentrated: his
`live account, evening` (three stops), the 2026-09-17 export at 7 000 and 12 000 leadership (three), the
4 000-leadership case, his live camp of 2026-09-18, his usual setup of 2026-09-19 and the monster camp (one
each).

**`Best v2` against everything that ships** (experiment 180, every stop, every army). Over the 43 stops where
a position moves a count:

| | improved | unchanged | decreased |
|---|---|---|---|
| **Damage a march, `Best v2` vs `Best`** | **10** | 31 | **0** |
| Damage a silver, same comparison | 10 | 31 | 0 |
| Damage a hired | 6 | 32 | 3 |
| Silver | 0 | 41 | 0 |
| Gold | 4 | 32 | 5 |
| Dragon coins · Training queue | 0 | 41 | 0 |
| Merc lost | 1 | 39 | 1 |
| Hired units fielded | 4 | 31 | 6 |
| Shelter margin | 6 | 33 | 2 |

Damage gains: **+5.45 % at the best stop, +2.29 % median, +0.41 % at the smallest** — and never a loss. The
price is the same trade the positions have always made, in miniature: it fields **four** stops' worth of extra
units and **six** stops' worth of fewer (it is a damage answer, not a units answer), and the stock burnt and
the gold to revive them move with them. Silver, the coins and the training queue do not move at all.

**Every position against the plan's own march**, for the whole picture (63 stops, 155 position-readings):

| criterion | `Most, in tens` | `Most` | `Best` | `Best v2` |
|---|---|---|---|---|
| Damage a march | 31 ↑ / 1 ↓ | 39 ↑ / 2 ↓ | 41 ↑ / 0 ↓ | 41 ↑ / 0 ↓ |
| Damage a hired | 17 ↑ / 10 ↓ | 10 ↑ / 31 ↓ | 13 ↑ / 28 ↓ | 14 ↑ / 27 ↓ |
| Silver | 0 ↑ / 1 ↓ | 0 ↑ / 2 ↓ | 0 ↑ / 2 ↓ | 0 ↑ / 2 ↓ |
| Gold | 0 ↑ / 30 ↓ | 0 ↑ / 41 ↓ | 0 ↑ / 41 ↓ | 0 ↑ / 41 ↓ |
| Merc lost | 0 ↑ / 24 ↓ | 0 ↑ / 37 ↓ | 0 ↑ / 37 ↓ | 0 ↑ / 37 ↓ |
| Hired units fielded | 32 ↑ | 41 ↑ | 41 ↑ | 41 ↑ |
| Shelter margin | 9 = / 23 ↓ | 7 = / 34 ↓ | 13 = / 28 ↓ | 12 = / 29 ↓ |

Read the directions, not a score: a raise buys damage with the stock (`Merc lost`, gold and the queue go up),
and every one of them is *supposed* to. What `Best v2` adds to `Best` is only the 10 damage rows above.

## 3. What `Best v2` is

`tools/theorycraft/exact-best.ts`, and the two things that make it the answer rather than another heuristic:

- **The seed is the shipped answer.** `Best`'s own counts are one of the vectors it starts from, so `Best v2`
  is at least `Best` **by construction**, on every stop — the benchmark asserts it.
- **Two ways to the optimum, and which one a stop got is reported.** A box of `≤ 300 000` vectors is **walked
  whole** (the only place an optimum is known); a larger one gets a deterministic multi-start search —
  pairwise neighbourhood then one-stack, to convergence, from 64 seeded starts — which experiment 181 measured
  reaching the walked optimum on every stop where the two could be compared.

The walk's share is real: 42 of the 63 stops have a box small enough to enumerate, which is why the "control"
column and `Best v2`'s answer agree. The 11-type monster camp is where the box explodes (908 684 at its
widest) and where the search has to carry it.

**Where this ships is not the March.** Two destinations, both open, both the owner's: the **plan's own
search** (the engine, where a precomputation can afford an exhaustive walk per candidate shape) and the
**AssemblyScript kernel** (`src/kernel/`, where a full walk over a few million vectors is milliseconds). The
UI's `Best` — a position the player presses between two keystrokes — is the one place this shape does not
belong as it stands, which is why the module lives in `tools/theorycraft/` for now and nothing in `src/`
imports it.

## 4. The raise-only promise: keep it

`Best` never goes below the plan's own counts. The alternative was priced again after the correction below:
letting the climb go down to zero helps on **6 of 45** stops (median +1.15 %, worst +3.90 %) — and on the six
stops where both a downward move and a pairwise move were available, **the pairwise reading is better on 3 and
the downward one on none**. So the promise costs nothing measurable, it keeps `Best` comparable with `Most`
and with the plan, and it saves the March a sentence saying it cut a count.

## 5. What must not break — and one thing the benchmark found

- **The bounds are the box.** Ceiling = `ceil(troopFloor / hpPerUnit) − 1`, the expression `shelterUnder`
  uses (`raise.test.ts` pins the two together); the owned stock; the spare housing, **counted over every unit
  of the pool and not only the movable ones** (see §8 — this is the bug the first draft was built on).
  Experiment 180 asserts, per stop and per position, that no stack is over its ceiling, no pool over its
  housing and no stack over its stock.
- **It never loses damage.** Every neighbourhood takes strict improvements only; `Best v2` additionally starts
  from `Best`'s answer.
- **One march, one arithmetic.** Experiment 180 found that the app draws **two different battles from the same
  counts**: `planMarch` (the engine's result, what the pane shows for a plan stop) and `applyCounts` (the
  hand-edit replay, what it shows for a count edit) break a **total-HP tie** differently — `buildKillOrder`'s
  ranking against the base march's stack order — and that is worth **~1.8 % of damage** on the monster camp.
  Both paths agree on the plan's own counts, so nothing on screen is wrong today; they part company the moment
  a raise moves a count, and the benchmark had to read every position through the path the pane would use. A
  story of its own: one tie rule, in one place. (`manual.ts` against `plan.ts`.)
- **No engine change yet**: nothing under `src/engine` imports the raise, so `pnpm bench:baseline` cannot move
  — and if this moves into the plan's search, that gate becomes the thing to watch.

## 6. Gate

1. **The enumeration is the acceptance test.** With `Best v2` in place, the exhaustive column of experiment
   181 must show no gap at all: on every stop small enough to walk whole, the search's answer must equal the
   walk's.
2. **The promises, on every stop of every army** (experiment 180): `Best v2` not below `Best`; not below the
   plan; never over a ceiling, a stock or a housing; `Most` still the units answer.
3. **Non-regression**: experiment 180's `Best` column must not move, and `pnpm bench:baseline`'s readings must
   stay unmoved while nothing under `src/engine` imports any of this.
4. `pnpm test`, `pnpm typecheck`, `pnpm lint`, `prettier --check`, the e2e journey on a fresh build.

## 7. Open questions

- **The cell argument** (from the first draft, still unbuilt): `minDamage` is the enemy-first journal's own
  total, affine in the counts on any cell where the kill order and the attack order are both fixed — so the
  optimum of a cell is at a vertex and the whole box is `k! × k!` cells. It would make `Best` provable rather
  than walked-and-searched, and it is the natural thing to port to the kernel. The rounding of `damagePerHit`
  makes it "affine up to the per-hit rounding", so a cell's vertex is an upper bound to check, not the answer.
- **Which tie rule is right** — the app's two replays disagree (§5), and until that is settled a search's
  numbers depend on which one scores it.
- **Where the gain is worth having**: it is 10 stops of 43, concentrated in four armies, all of them multi-type
  plan runs. Is that "the few percent the user needs", or is the answer "the plan's own shape search should
  own this" — i.e. should the *plan* spend the stock the raise spends?
- **Does the raise belong in the plan at all?** Everything here spends stock the plan deliberately saved over
  four marches. A plan that fielded the raised counts from the start would score better than the bar does
  today; the reason it does not is `largestSustained`, which is a rationing rule, not a bound of the game.

## 8. What the review and the benchmark changed

The first draft of this plan claimed a much larger gap, and it was wrong twice over:

- **An independent adversarial review** (2026-09-29) caught four things, all fixed: the draft said the pairwise
  reading closes the whole gap (it does not — 8 of the 10), quoted its own report's "0.1 ms median" (a bug:
  `timed[0]` is the *minimum*; the median is 0.5 ms), quoted an unseeded `Math.random()` column as a
  measurement (seeded now), and priced the "field fewer units" option against the old `Best` rather than
  against v2.
- **The benchmark's own promise assertions caught a worse one.** The first version of the exposure study
  counted the housing against the **movable stacks only**, so a reading could spend the same dominance twice:
  its headline "+27.30 %" wins were **infeasible** (the stop already uses 199 of its 200 dominance), and
  `Best v2` — built on the same bug — came out *below* `Best` on the monster camp and over the housing in four
  places. With the fix the true exposure is **10 of 45 stops, median +2.80 %, worst +5.45 %** where the draft
  had said 14 of 42 and +27.30 %. The first draft's whole §2 was re-derived; §4's recommendation survived,
  and the ordering of §3 changed (the sampling fix is the cheap half after all, but with no cost limit the
  whole search ships as one).
