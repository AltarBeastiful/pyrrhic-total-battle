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
| what that costs | **0.4 ms** median, **2.6 ms** worst, on one stop |

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

*(The medians in that table are experiment 181's own helper, which takes the **upper** of the two middle values
on an even count; over the same ten stops the mean of the two — what §2's line below and experiment 182 report
— is **+2.29 %**. Both are in this repo's prose and they are the same measurement read two ways, so: 181's
numbers are upper medians, 180's and 182's are true ones.)*

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

**Where this ships: the March, as a fifth position** (owner, 2026-09-29: *"implement best V2 and add it to
the interface"* — which reverses the "not the March" reading this section first carried, and the owner is
the one who decides it). Built as follows, in `src/`:

| | |
|---|---|
| the algorithm | `src/engine/exact.ts` — `exactSearch(slots, score)`, a box and a scorer and **nothing else**: no battle, no march, no housing. It is written to be the thing the kernel or the plan's own search would run, and moving it there changes no caller |
| what a slot and a score *are* | `src/ui/sections/march/exact.ts` — the bounds are `raise.ts`'s own (`troopFloor`, `shelterCeiling`, the housing counted over every unit of the pool), the score is the app's own replay (`applyCounts`), and the seed is `raisedCounts`' own answer |
| the position | `RaiseMode` gains `v2`, `safe` and `tight` — the same search under no cap, under `Best`'s own burn and under the plan's own counts (§3.1). All three are drawn on **both hired blocks**, and pressing any of them on either sets both: the search is one search over the mercenaries and the monsters together (*"give another options for both"*) |
| where it runs | `src/worker/` — a `raise` job, on a **worker of its own** (`raiseSearch.ts`): a worker runs one job at a time, and this is the only job in the app measured in tens of seconds |
| what the pane shows while it runs | `raisedCounts` reads `v2` as `best`, so the counts, the figures and the sentences are a march the game would take from the first frame. The search is seeded with exactly those counts and takes strict improvements only, so the answer can only ever raise the damage over what is drawn |
| the wait | a stock Mantine `Loader` **inside the `Best v2` segment** and `aria-busy` on the control. Nothing else moves, on the owner's own rule about this control (*"it moves the ui its unpleasant"*) |

The cost is real and was not hidden: measured over every stop of every benchmark army (`out/182-v2-cost.md`),
`Best v2` is **2.7 ms** median over the 45 stops — **2.3 ms** on the 42 the box is small enough to walk — and
**51 s** at the worst, the owner's live camp of 2026-09-18 at its `more-mercs` stop, a box of 908 684 vectors
and one of the three stops it has to *search* rather than walk (their median is **15 s**). That is why it is a
position the player presses on purpose and not the fourth segment's own answer.

### 3.1 The two capped readings: `Safe` and `Tight` (S-144)

Owner, 2026-09-29: *"we could have a safe best-v2 that is bestv2 but accounting for merc lost and dmg/merc.
build it and benchmark it"*. The premise was checked before anything was built (`out/183-safe-raise.md`,
experiment 183, one pass over every stop of every benchmark army), and it turned out to be **mostly wrong in
the good direction**: `Best v2` is already close to stock-neutral. Its ten gains over `Best` cost extra
mercenary chunks on **one stop of forty-five** (the 7 000 export's `silver-saver`, +2.84 % damage for +2
chunks) and *save* one chunk on another.

What the measurement did find is two promises worth a position each, both of them the same search under a cap
on the burn — `Σ chunks(n)` over the authority stacks, `marchOf`'s own `mercLost`, pinned to the plan's own
figure on every stop by experiment 183:

| the position | what it may spend | over `Best` | over the plan's own counts |
|---|---|---|---|
| `Safe` | no more than the `Best` it replaces | 9 of 45 gains, +1.77 % median, **0 stops burning more** | 41 gained, 37 burning more (it is a raise) |
| `Tight` | no more than the plan's own counts — **not one extra chunk** | 0 gains (it is below `Best` by design) | **28 of 45 gained, +3.85 % median, +19.59 % at the best, and the burn is identical on all 45** |

`Tight`'s gain is not a contradiction: the plan sizes its hired stacks to a **trade**, not to tens, so a
count that sits inside a chunk can rise to the chunk's top for nothing — and on the dominance side the burn
does not move at all (S-102: a trained monster is a price, not a stock), which is where most of the 28 are.

**`damage a mercenary` is bounded, never maximised.** Ranking on `hiredDamage / mercLost` outright costs
**7.25 % median damage** (48.26 % at the worst) — investigation 0019's "trap", reproduced as one number — so
neither position optimises that ratio; they bound the stock and rank on damage, which is the same intent
without the trap. The two caps are implemented as one line of policy in `exact.ts` (`burnCap` + `RaiseRank`),
which is what keeps the three exhaustive positions one search and one box rather than three of each.

The two destinations this section named before are still open and still better homes for the *same* code:
the **plan's own search**, where a precomputation can afford a walk per candidate shape, and the
**AssemblyScript kernel**, where a few million vectors is milliseconds. `src/engine/exact.ts` is the module
either would take, unmodified.

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

**Where it stands, 2026-09-29.** All four hold, re-measured with the shipped module in the tree.

- **Gate 1, asserted**: `tools/theorycraft/181-best-headroom.test.ts` now runs the **shipped** search against
  its own walk, and on the **42 stops small enough to walk whole** the two are the same number — `42 are the
  optimum to the unit, none is short`. The walked set there is a subset of the walked set the March uses
  (`EXACT_BUDGET` 200 000 against `WALK_CAP` 300 000), so every box this file can enumerate is one the March
  enumerates too.
- **180** now reads `exactRaise` — the same function the worker runs — rather than a research twin
  (`tools/theorycraft/exact-best.ts` is deleted). Its `Best v2` column is **10 improved / 31 unchanged /
  0 decreased** against `Best` on damage a march and on damage a silver, over the same 63 stops: the gains are
  **+0.41 % at the smallest, +2.29 % median, +5.45 % at the best** (the evening account, `burn-saver`), and the
  ten are exactly the stops §2 named. No promise was broken.
- **The `Best` column did not move at all** — `Best` against `Best` is 0/41/0 on every one of the ten readings
  — because this story touches no engine path and changes nothing about the sampled climb.
- **`pnpm bench:baseline` moved not one figure**: its 19 tests pass, and the regenerated
  `out/benchmark-latest.md` differs from the previous run only in its timestamp line, which is the whole of
  what "no engine change" means here.
- `pnpm test` (1 755 passed on both engine paths), `pnpm typecheck`, `pnpm lint`, `prettier --check`, and the
  e2e journey on a fresh build — including the new press of `Best v2` in `e2e/generate.spec.ts`.

## 7. Open questions

- **The cell argument** (from the first draft, still unbuilt): `minDamage` is the enemy-first journal's own
  total, affine in the counts on any cell where the kill order and the attack order are both fixed — so the
  optimum of a cell is at a vertex and the whole box is `k! × k!` cells. It would make `Best` provable rather
  than walked-and-searched, and it is the natural thing to port to the kernel. The rounding of `damagePerHit`
  makes it "affine up to the per-hit rounding", so a cell's vertex is an upper bound to check, not the answer.
- **Which tie rule is right** — the app's two replays disagree (§5), and until that is settled a search's
  numbers depend on which one scores it.
- **Where the gain is worth having** — *answered 2026-09-29: the March, as a fifth position* (`Best v2`), on
  the owner's own instruction. It is 10 stops of 43, concentrated in four armies, all of them multi-type plan
  runs, and it is now a position the player presses when he wants it rather than one the pane pays for on
  every press. **The question underneath it is still open**: should the *plan's* own shape search spend the
  stock the raise spends? A plan that fielded the raised counts from the start would score better than the bar
  does today; the reason it does not is `largestSustained`, which is a rationing rule and not a bound of the
  game.
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

## 9. What the adversarial review of the *shipped* code changed (2026-09-29)

The plan was reviewed before it was built (§8). The **code** was reviewed the same day, adversarially and
independently, after the interface existed — and it found four things the test suite and the benchmark had
both missed. All four are fixed, and each has a test that is red on the old code.

1. **The key named the run, not the march.** `raiseSearchKey` was built on `snapshot.at`, and
   `resizeMarch` re-files a re-sized march under the **old stamp on purpose** (*"the same run, re-sized"*,
   `generate.ts`, so the objective comparison does not start again at every press on a pill). A search asked
   about the march *before* a put-back therefore answered the march *after* it: counts over the new shelter
   ceiling — with `MarchShelterNote` suppressed, because a raise is on — under the new plan's own count, or
   below the new `Best`, all silently, with `status` already `done` so not even the loader showed. The key is
   the **identity of the result object** now (`raiseSearchKey(result, modes)`); every writer of `last` stores
   a fresh `StackResult`, so it moves exactly when the march does. *This is the finding the benchmark could
   not have made: no experiment re-sizes a march.*
2. **The answer was a diff against the wrong baseline.** `exactRaise` reported only the stacks it *moved*,
   as a diff against the **plan's** counts — but the March merges it over the shipped **`Best`**'s answer, so
   wherever the search came back *down* to the plan's count the seed's higher one stayed. That is the
   two-stacks-only-improve-together move the pairwise neighbourhood exists for, so the vector on screen would
   be one the search never scored and could sit **below the `Best` it was seeded with** — the one promise the
   whole design rests on, and the one the theorycraft files could not see, because they merge over the plan's
   counts and not over the seed. The answer now carries **every stack it walked**.
3. **A real answer was thrown away.** `useMarch` merged the exhaustive counts only when the sampled climb had
   also found something (`raised !== null && …`). The gap this position exists to close is precisely a stop
   where the climb finds nothing and the search finds something, so the guard discarded exactly the answer
   that mattered. The merge is unconditional now.
4. **The wait was drawn on a control that was not waiting.** One `searching` boolean went to both hired
   blocks, so a mixed control (mercenaries on `Best v2`, monsters on `Most`) put a spinner, `aria-busy` and
   the hidden *"Searching every combination."* on the block that was not being searched. It is per pool now.

Two smaller ones were fixed in `src/engine/exact.ts` itself: a **negative `seed`** made every restart vector
fall below its slot's `from`, outside the box (folded into `[0, 2^32)` before anything is drawn), and a box
where **no vector is feasible** returned the start rather than nothing, handing a caller a count their own
scorer refuses (`null` now, from both branches). Neither is reachable from the March, and both are contracts
the module states, so both are held.

**What the review did not change**: the walk, the seeded multistart, the strict-improvement rule, the bounds,
or any figure in §1–§6. It is the same search; it is the *plumbing between the search and the pane* that was
wrong, which is the part no experiment in `tools/theorycraft/` drives.

## 10. What the second review of the *shipped* code changed (S-144)

The two capped positions reuse everything §3 built — the box, the bounds, the housing check, the seed, the
climb — and the only new machinery is a cap and a rank. Reviewed against that claim before the commit, on the
one axis that matters (does a capped position still keep every promise the uncapped one makes?):

1. **The spinner was drawn in all three exhaustive segments**, because the wrapper asked `isExhaustive(mode)`
   and not "is this the segment that is chosen". With three positions the defect the S-143b review had
   already fixed once could come back a different way — three spinners on a control that is searching once.
   It is `choice.mode === value` now, and the UI test that holds it (named `the fifth segment carries the wait
   itself` when this was written, `the chosen segment carries the wait itself` since S-145) is unchanged and
   still passes, which is why it was the one that caught this.
2. **`Tight`'s seed had to be the plan's own counts and not `Best`'s.** `exactSearch` fills a slot left out
   of `start` with its `from`, which on this box *is* the plan's count — so the promise "`Tight` cannot lose
   to the plan's own march" holds by construction, and it holds only because the seed and the cap are the
   same vector. Seeding it with `Best`'s counts would have left the promise resting on the search finding its
   way back down to a feasible vector, which the walk does and the multistart search does not owe anyone.
3. **The cap is the authority pool's alone**, because the burn is (`burnOf`, S-102). `safe` and `tight` on the
   monsters' block therefore answer exactly what `v2` answers — held by a test rather than left as a comment,
   since a reader who expects a cap there would be reading a bug into a working control.
4. **`isExhaustive` replaced three `=== 'v2'` comparisons** (the control's spinner, the pane's silence, the
   store's "one standing rule") before any of them could be forgotten, which is the same mistake S-143b's
   own review made with `searching`.

## 11. What S-145 removed: the `Best` segment (2026-09-29)

The owner, on the finished control: *"take all positions against all benchmark cases and remove the ones that
never improves of the other, trying to simplify the slider without losing upgrading a march over different
criterias for cheap and all usecases"*. Experiment 180 is the answer to the first half — it prices every
position on **every stop of every benchmark army, all six plan-slider options**, and the second table it
prints is each position against the climb rather than against `Best` — and it is what removed the segment:

- **`Best` never beat `Safe`.** On the 41 stops the two both answered, `Safe`'s damage was equal or above on
  **41** and its burn equal or below on **41** — 9 damage gains, 1 chunk saved, none lost either way. That is
  not a benchmark coincidence: `Safe` is seeded with the climb's counts and accepts only vectors whose burn
  is at most the climb's, so the promise holds by construction (§3.1).
- **None of it is lost.** `raisedCounts` answers an exhaustive mode with the climb — that is what the March
  draws from the first frame and what every search is seeded with — so the segment's only unique offer was
  answering *without* the worker wait. The four unit answers, the three exhaustive ones and `As is` are the
  six segments now (`MarchPills.tsx`), and `RaiseMode` no longer names `best` at all.
- **It also closes S-144's open width defect.** Measured in a real browser at 390 px wide (a one-off
  Playwright spec, run and deleted like S-144's own): the seven segments were **370 px inside a 358 px
  control — 14 px over**, the last segment's right padding cut; the six are **350 px in the same 358 px
  control**, 8 px to spare, every label whole (`/tmp/raise-390-after.png`). The one-line `Most, in tens` →
  `Tens` refactor S-144 priced at 59 px is therefore no longer needed.

The doc above is kept as it was written — it is the reasoning of S-143b and S-144 and the numbers are still
the numbers — with `Best` read as **the climb** wherever it is the seed, and as **a segment that no longer
exists** wherever it is a position.

## 12. Where it landed: the kernel, and the trades under the plan (S-147, 2026-09-29)

Owner, 2026-09-29: *"take all positions remaining and implement them in assemblyscript. Goal is to offer them
as precomputed with the trades they offer visible to the user. for now you'll output the trades in a table
below the plan slider table and keep the slider leading to the ts version in the summary defaulting it to as
is to avoid duplication."* §3 named this destination for `src/engine/exact.ts` — *"the AssemblyScript kernel,
where a few million vectors is milliseconds"* — and this is that move, with §3's own packaging kept: the
algorithm is `src/engine/exact.ts`, the march-level half is `src/ui/sections/march/exact.ts` and `raise.ts`,
and the kernel is a third path beside them rather than a rewrite of either.

**The door.** `RaiseKernel` in `src/engine/fast.ts`, next to `PlanKernel` and asked the same way:
`positions.ts` calls `raiseKernel()?.position(...)` and falls back to the March's own TypeScript when the host
has no kernel — which, on the main thread, it never has. The kernel implements it in `src/kernel/raise.ts`
over one packed table per **(request, base march)**: the request as `packRequest` builds it, plus the raise's
own tie-break column.

**The tie-break is the port's one real decision.** §5 left "which tie rule is right" open: `applyCounts`
breaks a total-HP tie by base-stack index, `marchOf` by `buildKillOrder`'s rank. A position is *read* through
`applyCounts`, so a kernel scoring with its own battle would answer a different march — on the monster camp
that is ~1.8 % of damage, and it is exactly the class of defect a port must not introduce. So the packed table
carries `T.order` (each type's place in `base.stacks`) and the kernel's scorer sorts by it: the same march,
the same box, the same seed, and — because `ExactAnswer.scored` is now carried out of `exactRaise` — the same
route to the answer. `tests/kernel/raise-kernel.test.ts` holds every count, `how`, `space` and `scored` of
both paths together on the 18 benchmark armies.

**What it costs.** Experiment 184 (`out/184-the-positions-on-the-kernel.md`), every stop of every benchmark
army, all five positions on one march, both paths side by side:

| path | median ms a march | worst ms a march |
|---|---|---|
| the kernel | **0.6** | **2 347** |
| the March's TypeScript | 2.3 | 197 158 |

That is the whole reason the block can price five positions before they are asked; a platform that cannot run
a worker is not offered it at all (`positionsSearch.ts`), rather than freezing the page for minutes.

**The block** (`PositionTrade.tsx`, drawn by `PlanPanel` under the trade) prices the five on the stop the bar
is standing on: **damage, silver, gold and the mercenaries burnt**, each with its change against the plan's
own march under it, the baseline row left out because the bar's own row is one block above. Units are not a
column (owner, 2026-09-29: *"i don't care about units, they're cheap. I care about silver, gold and merc"*),
and gold is drawn only where a march pays any (design rule 15). **The whole bar is priced, not one stop of
it** (owner, same day: *"all those should have their table when clicking on the plan slider. Best is to
compute it ahead for all like the slider spots"*): one job a stop, the stop on screen first, so a press on the
slide is another table rather than another wait — 2 ms median and 2 108 ms worst a bar, against 33 ms and
197 s in TypeScript. It is the only place the five can be compared, and it is read rather than pressed: the
summary's control is where a press acts, and it is unchanged — *"keep the slider leading to the ts version"* —
including opening on `As is`.

**Two defects the real corpus caught** that the synthetic one could not, both worth writing down because they
are what a port gets wrong:

1. **`scored` counts what the scorer was asked, not what it fought.** `counting` wraps the caller's score, so
   a vector the housing refuses is a call the engine pays for; the kernel counted only the vectors that
   reached a battle, and reported 82 where the TypeScript reported 345 281.
2. **The two pools' climbs merge per pool.** `raisedCounts` merges what each `climbedCounts` answers; the
   kernel's climb wrote its whole vector back, so the dominance climb put its own answer over the authority
   one — leaving `Safe`'s cap at the *plan's* burn instead of the climb's, worth a −60-count answer on the
   monster camp's `burn-saver`. The synthetic corpus could not see it: its marches had the mercenaries already
   at their cap, so the authority pool had nothing to move.
