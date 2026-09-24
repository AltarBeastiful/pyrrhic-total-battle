# Every death order, kept — implementation plan (W14)

**Status: proposed 2026-09-24.** The rating is the criterion at every step, including the rung order (step 5). Nothing here is built yet. Each step is measured and committed only if it passes the gate (§2).

The owner, 2026-09-24: *"Are we properly ordering them for maximizing criterias now? or do we still use some fixed rules?
are we actually testing all orders possible for troops death to maximize the marche … including heroes and all bonuses"*.

## 0. What is measured (experiment 175, `tools/theorycraft/out/175-every-death-order.md`)

The enemy always kills our highest-HP stack first, so a march's death order is **which troop type stands on which HP
level**. 175 used the AssemblyScript kernel to walk that whole space on every distinct march of every stop of the 18
benchmark armies: 129 marches, 2.23 × 10⁹ battles, `budgetMs` off, rated with `rate(·, ·, markerRates)`. Captains,
equipment, events and every other bonus are in the packed table, so every battle counts them.

- **55 of 129 marches leave more than 0.01 rating: +94.0 in total.** The best is +24.88 (+24.9 % damage, +0.06 % silver) on
  the silver saver of the owner's live camp of 2026-09-18. There are also +15.89 and +12.19 on his camps of 2026-09-19,
  +9.13 on the 12 000 export, and +6.49 on the 4 000 case.
- **Most of it is the pipeline, not the search.** `retypeMarch`, run directly on the shipped march, already reaches the
  best on **37** of the 55 (+72.7). The plan either never hands it that march, or does not keep what it finds.
- **The search's own gap is small.** On 18 marches the climb stops short, +5.19 in total (mostly +0.2 to +0.35 each). 48
  of the 55 are marches where the engine climbs (the space is over `EXHAUSTIVE` = 5 000); 7 are marches where it
  already walks every order.
- **Damage alone (A2):** 98 of 129 marches have a harder-hitting order, +0.72 % on average and +24.9 % at most. The
  ladder's rung order (`orderFor`) climbs on damage and is learned once per depth.
- **Guards:** on 5 silver savers the winner raises the stop's silver (+0.01 % to +2.08 %), which the engine refuses. No
  winner broke the shelter, the stop order or dominance between stops.
- **Unsheltered (A3, diagnostic only):** letting hired stacks stand above troops would add up to +11.97 on 25 marches.
  The shelter is the owner's rule (S-87), so this is **not** a step of this plan.

What the kernel changed: the same walk is now ~24× cheaper than in TS, and a whole plan is ×8.2 faster (91b4077). A
search that was out of the time budget in W13 (step 3, experiment 171: +107 % plan time) may now fit.

## 1. Where the 37 marches are lost (to be confirmed by step 1, not assumed)

Candidates, read from `plan.ts` (the re-typing pass, ~6110–6460):

| suspect | where | what it does |
|---|---|---|
| **a. the row-level silver-saver guard** | `retypeRowNow`, "a silver saver stays one" | if **any** march of a silver-saver row raises silver, the **whole row** is handed back, including marches whose re-typing costs no silver |
| **b. marches made after the pass** | the fold (`foldFinale`), S-94, the collision hand-backs, `keepReadings`, stops re-chosen after the pass | the shipped march is not the one that was re-typed, so the re-typing never saw it |
| **c. `keepReadings` hand-backs** | `keepReadings` | a stop gets its un-re-typed march back when a lost reading is worth more than the re-typing's rating |
| **d. the pass's own guards** | `retypeOne` | refused when the hired stacks moved or the shelter broke (175: no winner breaks the shelter, so this should be rare) |
| **e. the tail, band rows and the finale's own ladder** | not re-typed by design (§3.3 of W11), or re-typed before a later re-price | |

## 2. The gate (unchanged from W13, plus the two paths)

- 0 stops rated worse (`rate()` against HEAD on every army; stops paired by pick; a stop the bar re-chose is listed and
  rated against the stop it replaced);
- no bar reading worse on any army (the ten readings);
- TotalStack at matched spend no worse (70/13);
- the bar criteria hold (order, no stop beaten, shelter, sustain, ≤ 5 stops, sweet spot, S-58 B);
- the suite's reds unchanged by name, **on both paths** (TS and kernel), and the whole-plan equivalence between the two
  still 0 differences — every change lands in the TS reference and in the kernel together, or in TS only;
- plan time: measured in the browser's worker (kernel on) and in TS, against `RETYPE_SHARE` of the budget.

Runs are measured with `budgetMs` off. Pins that move are reported; only the owner registers a new baseline
(the non-regression rule).

**The report every step owes (the owner, 2026-09-24: *"make sure the plan doesn't forget to report on all march use cases
what it moves on all criterias and redo the bench with TotalStack after"*).** Each step's experiment writes, before vs
after, on the same armies and settings:

- **Every march use case, none skipped:** on every army of the benchmark, every stop of the bar (silver saver, sweet
  spot, more, steady max, all-in, and any stop the bar re-chose), and inside each stop, **every march it plays**: the
  repeated march, the finale, the troops-only tail, each march of the all-in's sequence, and the band rows. A use case
  the step does not touch is still listed, as "unchanged". Nothing is summarised away.
- **Every criterion, per march and per stop:**
  - worst-opening damage and best-opening damage;
  - silver, gold, hired burned, dragon coins and queue seconds;
  - damage per silver, per gold, per hired and per dragon coin;
  - the stop's rating `rate(before, after, markerRates)`;
  - the shelter margin (the lowest troop stack's HP over the highest hired stack's);
  - the sustain (how many marches the hired stocks last).
- **The bar as a whole, per army:**
  - the ten readings;
  - the bar criteria (order, no stop beaten, shelter, sustain, ≤ 5 stops, sweet spot, S-58 B);
  - which stops were re-chosen.
- **Counts:** stops better / equal / worse per army and in total. Every worse figure is listed with its value, even
  where the rating says the trade is worth it.
- **The benchmark rerun with TotalStack, after every step and again at the end of the plan.** Both paths are rerun: the
  full `plan-benchmark` (TS and kernel). The report gives TotalStack at matched spend (dominated / not dominated,
  against 70/13 today) and TotalStack's rows that still beat any stop on damage and rating (the 162 list: 2 today). It
  also gives the moved pins, each with its before and after value, so the owner can decide on each one.

## 3. Steps

1. **Experiment 176, the diagnosis.** Trace each of the 37 marches through the pipeline: was it handed to `retypeOne`?
   What came back, and which guard refused it (a–e)? Was the shipped march made after the pass, and by which step? The
   output is one table: march → cause → the rating it would have kept. **No engine change.** The steps below are
   ordered by what it finds; the rest of this section is the expected order. 176 also records the full per-march,
   per-criterion report of §2 for HEAD, so every later step compares with the same baseline, and reruns the benchmark
   with TotalStack at HEAD on both paths.
2. **The silver-saver guard, per march** (suspect a). Keep the rule ("a silver saver stays one"), but apply it to each
   march rather than to the row. Re-type a silver saver's march under **"silver must not rise"**: take the best
   assignment whose silver is not above the march's own. 175's "silver-guarded best" column says what this leaves.
   Expected: the +24.88 / +15.89 / +12.19 family, if 176 confirms they are silver savers lost whole.
3. **Re-type the marches made after the pass** (suspect b). Either move the pass after the steps that make new marches,
   or run a second pass over the marches the first one never saw, under the same guards and cache. Then run
   `keepReadings` and the fold's hand-back again. Measure which of the two passes the gate, and the time each adds.
4. **The search gap** (18 marches, +5.19). The kernel's batched walk (`enumerate`) is ~1 M battles/s. Two variants,
   measured:
   - (i) raise `EXHAUSTIVE` so the walk covers every space under a cap counted in battles (e.g. 50 000, about 50 ms in the kernel; a count, not a clock, so both paths choose the same);
   - (ii) keep the threshold and strengthen the climb: more seeds, 3-cycles, and restarts from the best twin.

   Pick the one that closes the most rating for the least time. The TS path keeps the same rule, so the two paths give
   the same plan (slower in TS).
5. **The ladder's rung order on the rating** (A2; **required**, the owner 2026-09-24: *"using rating shouldn't be optional
   but should be properly benchmarked"*). `orderFor` climbs on damage alone. It moves to `rate(·, ·, markerRates)`: a swap
   is taken when it rates above the current order, as `retypeMarch` already does. The extra cost per candidate is almost
   nothing, because one kernel call already returns the battle and its bill together (the 1.08 M battles/s of step 1
   include the bill). What costs is **how often** an order is learned. Three variants, each benchmarked in full (§2):
   - (a) the rating instead of damage, learned once per depth as today (~84 battles a depth, a few hundred a plan);
   - (b) (a) learned per (depth, mercenary vector), which is 171's variant;
   - (c) (b) plus scale, which is W13's step 3 (~3–4 × 10⁵ battles a plan: well under a second in the kernel, several
     seconds in TS).

   The report gives each variant's rating gain, the full per-march table of §2, the TotalStack rerun, and plan time on
   both paths. The cheapest variant that passes the gate is committed. If (b) or (c) passes but costs too much in TS,
   the owner decides: both paths must still give the same plan, so the TS fallback would get slower.

**Not in this plan:** lifting the shelter (A3). It is listed for the owner. If he wants it, it is his rule to change, and it
would be offered as a separate, rated candidate, as tier order was in W13.

## 4. Risks

- Step 3 changes the order of the plan's passes; the fold and `keepReadings` interact (166/167). Measure the stops the
  bar re-chooses, not just the marches.
- A per-march silver guard can make a silver saver's campaign cheaper in one march and dearer in another; the row's own
  silver must still not rise (the rule's intent).
- Raising `EXHAUSTIVE` makes the TS fallback slow on big spaces. The fallback must stay usable (the owner's camp under
  ~2 s in TS, as today); if it isn't, the kernel and TS would need different rules, which the equivalence forbids. So
  cap by a count of battles, not by time.
- Near-ties: gains of +0.01 to +0.03 (the first-run armies) are within `rate`'s tolerance and should not drive a change
  on their own.
