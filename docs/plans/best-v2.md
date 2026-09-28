# `Best` v2 — the space, what the climb misses, and what to do about it (S-143b)

Owner, 2026-09-29: *"is there still room for improvement for the best selector? are we trying every possible
combination in the space we have (max dominance/authority and merc stock?)"*.

**Short answer: no, and the room is real — but less than a first draft of this plan claimed, and the cheapest
fix is not the one it first proposed.** `Best` is a **coordinate climb**: one stack at a time, the plan's own
counts as the only start, **16 samples a stack** plus a step-1 refinement, at most three sweeps. The space it
climbs in is right — every count vector from the plan's own counts up to `min(shelter ceiling, owned stock)`
per fielded hired type, under the authority or dominance the housing pays — but it samples that space instead
of walking it, and it can only move one stack at a time. Measured on the 18 benchmark armies the app's own
criteria use: **on the stops where a raise can move at all, a stronger reading of the same space finds 3.9 %
more damage at the median and 27.3 % at the worst, on ~a third of them.**
`tools/theorycraft/out/181-best-headroom.md` (experiment 181).

## 1. The space, and what `Best` spends on it

| | measured |
|---|---|
| stops where a raise can move a count at all | **45** |
| the space — vectors in the box, per stop | **median 144**, max **908 684** |
| what `Best` evaluates | `Σ stacks` of ~16 coarse samples + a ±step refinement, ≤ 3 sweeps — a few hundred replays |
| what that costs | **0.4 ms** median, **3.1 ms** worst, on one stop |

The median space is smaller than a grid: three or four hired types, spans of a few counts each. That is what
the plan's own bar leaves — the plan trades the stock over four marches, the raise takes it back.

## 2. Five readings of the same space, and the gap to each

Experiment 181 walks the same box five stronger ways, each starting from or including the app's own answer and
scored the app's way (`applyCounts` → the march's **worst opening**, the figure the plan is ranked on). Every
one of them is bounded by the same ceiling, owned stock and housing as the app, so every win is a march the
game would take.

| reading | beats `Best` on | median gain | worst | cost, median / worst |
|---|---|---|---|---|
| **one stack, exhaustive** — the app's own neighbourhood and sweeps, every count walked | 10 of 45 | **+3.90 %** | +27.30 % | 0.4 / **6.9 ms** |
| **pairwise** — every pair, exhaustively, until no pair improves | 12 of 44 | +3.90 % | +27.30 % | 1.9 / 177.8 ms |
| **restarts** — the same climb from 12 seeded random starts | 14 of 45 | +3.88 % | +27.30 % | 9.9 / 119.7 ms |
| **exhaustive** — every vector, on the stops small enough (the **control**) | 14 of 42 | +3.88 % | +27.30 % | 2.1 / 3344 ms |
| **lowered** — the climb allowed *down* to zero, same bounds | 10 of 45 | +3.90 % | +27.30 % | 1.5 / 14.4 ms |

Three things to read out of that table, and the first one is the finding that changed this plan:

1. **Most of the gap is sampling, not the neighbourhood.** Walking every count instead of 16 samples, with
   the app's own one-stack-at-a-time climb, already closes **10 of the 14** gaps the full enumeration proves
   exist — at **0.4 ms median and 6.9 ms worst**, i.e. for almost nothing. The pairwise neighbourhood adds
   **2** more, and costs 178 ms at its worst.
2. **The enumeration is the control, not a candidate.** On the 42 stops whose box fits in 200 000 vectors,
   walking all of them improves on 14 — so the gaps are optima the climb misses, not artefacts of a luckier
   heuristic. The exhaustive method itself is far too slow to ship (3.3 s worst).
3. **The promise costs nothing measurable.** Letting the climb go *down* as well as up helps on 10 of 45
   stops — but never more than the pairwise reading does on the same stop, and strictly less on three. Once
   Step 1 is in, **the raise-only rule is free.**

**Why the climb misses, opened up on the worst case.** That stop's box is five hired types, three of which
cannot move (two at their stock, one at its ceiling):

```
stone-gargoyle 12..12 · epic-monster-hunter-6 19..19 · emerald-dragon 13..13
battle-boar 1..15 · water-elemental 2..32
```

`Best` answers **nothing** — the plan's counts exactly as they are (2 941 677) — while the pair move
`battle-boar 15 · water-elemental 31` is worth **3 744 681, +27.30 %**, a march that out-hits that same bar's
`steady-max` stop (3 031 810). Neither stack alone improves anything: raising one grows its total HP, so it
climbs the kill order and loses a round of strikes, and the units bought do not pay for the round; raising
**both** keeps their order among themselves and pays for both. The shipped position is not *wrong* here, only
short — what it leaves is the plan's own counts.

## 3. What v2 should be, in order of what it buys per millisecond

**Step 1 — walk every count (the sampling fix).** Replace the 16-sample grid with an exhaustive walk of each
stack's range, keeping the app's one-stack sweep. Measured: **10 of the 14 known gaps, +3.90 % median, 6.9 ms
worst.** This is the first thing to build because it is nearly free and it is most of the gap.

**Step 2 — the pairwise pass, sampled the way a single stack is.** One pair at a time, walking that pair's box
coarsely and refining around the best sample, sweeps until no pair improves. Measured gain: the **2** further
stops nothing else reaches (+1.76 % on the 4 000-leadership case, +2.84 % on the 7 000 export's silver saver).
**The cost is the design problem**: an exhaustive pair pass costs **177.8 ms** at its worst — and the boxes
grow as `k²/2` pairs, with **11 hired types** on the monster camp's widest stop (measured below). So the pair
box must be sampled, capped and budgeted exactly as the single-stack one is, and the budget has to be
documented (today the whole position costs 3.1 ms worst; a pairwise pass must be given a number the owner
accepts, in the same way `COARSE_SAMPLES` and `MAX_CLIMB_PASSES` are documented).

**Step 3 — restarts, only if Steps 1–2 still leave gaps.** 12 seeded starts find **14 of 45** — the control's
own set — but at 9.9 ms median and 119.7 ms worst, so a small seed count (2–4) with a budget is the most this
can be worth. *Seeded*: an unseeded version of this very experiment changed its headline between two runs of
the same code (13 of 45 → 14 of 45) — a benchmark that answers differently on the same input measures the dice.

**Step 4 — the exact answer, where the type count allows it.** `summary.minDamage` is the **enemy-first
journal's own total**, a plain sum of the per-hit damages of the stacks that act (`battle.ts:226`, `:294`) —
*not* the lesser of the two journals. On any cell where **both orders the battle walks are fixed** — the kill
order (total HP descending) and the attack order (base damage descending over *all* stacks) — the objective
and every constraint are affine in the counts (bounds, stock, housing, and the two orders' inequalities), so
the optimum of that cell is at a **vertex**, reachable by a bounded enumeration of breakpoints. The number of
cells is the number of (kill order × attack order) pairs: **k! × k!** *interleavings with the troops' own
order* — 576 at k = 4, astronomically more at k = 11. So this is only on the table for the small-type armies
(his four-type plan runs), and it is the only reading that would let `Best` say "the best" in the strict
sense. Say "affine **up to the per-hit rounding**": `damagePerHit = round(count × strength × …)`, so each term
is a staircase, and the linear relaxation bounds the optimum from above rather than equalling it.

**Step 1 alone is worth shipping on its own.** Steps 2–4 are each a separate measurement, and the gate below is
the same for all of them.

## 4. The raise-only promise: keep it (measured, not assumed)

`Best` today never goes below the plan's own count. The alternative was priced: a climb allowed down to **zero**
inside the same bounds is better on 10 of 45 stops (**+3.90 %** median, +27.30 % worst) — but it is never
*more* than the pairwise reading on any stop, and strictly less on three (`12 000 leadership · silver-saver`
+0.49 % against +2.80 %, `evening · burn-saver` +0.35 % against +5.45 %, `evening · silver-saver` +1.15 %
against +3.88 %). **So: keep the promise.** It costs nothing measurable once Step 1 is in, it keeps `Best`
comparable with `Most` and with the plan ("it fields at least what the plan fields"), and it saves the March a
sentence saying it cut a count — on a pane the owner has already asked to stop moving. A fifth position for a
"fewer units, more damage" march stays a design question, not a priced one, and this experiment is the reason.

## 5. What v2 must not break

- **The bounds are the space.** Ceiling = `ceil(troopFloor / hpPerUnit) − 1`, the expression `shelterUnder`
  uses (`raise.test.ts` pins the two together); the owned stock; the spare housing. Experiment 180 asserts
  every stop of every benchmark army is sheltered and inside its housing — v2 inherits that assertion.
- **It never loses damage.** Every reading here takes only strict improvements; v2's neighbourhoods must keep
  that by construction (an exhaustive pass does).
- **Main thread, and bounded.** The March re-derives on Generate, on a stop change, on a put-back and on a
  keystroke; the raise is arithmetic plus replays, never a worker. Today it costs 0.4 ms median / 3.1 ms worst
  — the budget v2 may spend is the owner's call, and it must be documented where the caps are today.
- **No engine change.** Nothing under `src/engine` imports `raise.ts`, so `pnpm bench:baseline` cannot move.

## 6. Gate

1. **The enumeration is the acceptance test**: re-run experiment 181 with v2 in place, and the exhaustive
   column must show **no gap at all** — on every stop small enough to walk whole, v2's answer must equal the
   walk's. (The five readings above are the before picture: 10 / 12 / 14 / 14 / 10 of 45 or 42.)
2. **Non-regression**: experiment 180's four-position table re-run, no stop may lose damage, and `Best`'s
   damage column must be at least today's on every stop.
3. **`raise.test.ts`** gains the 465-vector box as a fixture: the two-stack move that the 1-opt cannot see must
   come out of v2.
4. `pnpm test`, `pnpm typecheck`, `pnpm lint`, `prettier --check`, the e2e journey on a fresh build, and
   `pnpm bench:baseline` (readings unmoved).

## 7. Open questions

- **Is the cell argument airtight?** On integer counts the two orders are total, so every point of the box
  lies in exactly one cell — but at a cell's boundary the walk's tie-breaking picks an order whose value may
  be *lower* than that cell's affine extension. So the best cell-vertex is an upper bound. The 42 enumerable
  stops can decide it directly: does the walk's optimum ever sit strictly below the best cell value?
- **What is the budget?** Steps 2–3 want 100+ ms at their worst; the position is on the main thread. What is
  the number the owner will accept for a press of `Best`?
- **Is the plan's own march the right *only* start?** Restarts find 14 of 45 — is that the same interaction
  problem seen from another angle (in which case Step 2 subsumes it), or a genuine basin problem?
- **Does any of this belong in the engine** (`shelterCounts`' neighbourhood), so the plan's own search can use
  it and the bar stops leaving the room the raise exists to take?

## 8. What the independent review changed

This plan was reviewed adversarially before it was kept, and the review was right on four things that are now
fixed in it: the first draft claimed the pairwise reading "already finds the whole of the measured gap" (**it
finds 12 of 14**) and made that the gate; it quoted the report's "0.1 ms median" (a bug — `timed[0]` is the
**minimum**; the median is 0.4 ms) in §1 and §5; it quoted the restarts column as a measurement when it was
unseeded `Math.random()` (a re-run moved it 13 → 14 of 45, now seeded); and it priced "field fewer units"
against the *old* `Best` rather than against v2, which reverses the §4 recommendation. The review also caught
that the space is over **fielded** types only, that the worst case is 465 vectors with three types pinned,
that 11 hired types are reachable on the monster camp, and that `minDamage`'s definition needed the right
citation.
