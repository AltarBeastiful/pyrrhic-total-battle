# Investigation 0017 — the plan's shape: the ray, the amortised finale, and the ladder scale the search never sampled

2026-09-15. The owner's question, in his words: *can't we do better than 1.56 and 705? what if we tweak to
get the silver down while still retaining some damage? did you analyse the curvature of this function? is
there a sweeter spot? … at some point I think we had 490 per merc with 2.11 silver per damage, is there
something we're missing here? … we should always compute what total marches would be using a stack with x
marches in to check the progression of total damage.*

This is the continuation of 0016. Same account, same engine, three new experiments (`68`, `69`, `70`), one
engine change and one UI change. Everything below is measured with the repo's engine through its own
exported scorer, and every number is reproducible from the commands in §14.

## 0. The short answer

- **1.56 a silver and 705,862 a mercenary are the frontier, not the grid.** A sweep twenty times finer than
  the planner's own, run from its own picks, found no shape clearing both ratios; the best challenger was
  **1.57 / 693,832** — the same silver rate and slightly worse per mercenary.
- **The curve is not the ladder degrading.** A plan is `K` repeats of one march plus a final march, so the
  repeat step is *exactly* constant (measured: Δ 1,845,662 damage / 1,567,200 silver, identical to the decimal
  from the second march on). The repeated march is a **ray**. The averages fall (1.91 → 1.06 a silver from
  K = 1 to K = 12) because the **final march is not a repeat** — it spends the stock the repeats burned — so
  it is one free march being amortised over more of them. §2.
- **Both ratios are properties of the shape, not of the plan**, which is why the whole frontier is reachable
  by walking one axis (§3), and why the UI now offers one control instead of three (§10).
- **The knee is ~11.9 M silver (K = 6)**, where a silver stops buying a damage. At the balanced pick's own
  spend (9.7 M) the rate is 1.02, so a million silver saved costs about a million damage. §4 and §5.
- **What was actually wrong: the ladder's scale.** The planner sampled it ten times and never refined it. The
  same shape at scale 3.45 instead of 3.2 is **+5.6 % damage**, and 3.45 is not one of the ten. Fixed, and
  measured: the best campaign went from 22,355,110 to **23,745,798** damage. §7.
- **A defect found on the way**: the new scorer accepted shapes the mercenary stock cannot field (§8). It had
  also been reachable through the exported `marchTarget` input, which no caller passes today.

## 1. Inputs

Same account as 0016 and the same request every experiment in this investigation builds: the owner's eight
troop types, his four mercenary types with the stock he holds, scenario C bonuses, and housing leadership
4,400 / authority 2,180 (`tools/theorycraft/68-shape-sweep.test.ts`, `PROFILE` + `HELD`).

| input | value |
|---|---|
| troop types | the eight the account can field |
| mercenary stock | EMH VI 14 · ABT VI 15 · LGN VI 16 · CHR VI 7 |
| housing | leadership 4,400 · authority 2,180 |
| bonuses | scenario C (guardsmen +159 % health / +189 % strength, double damage +3 %) |

Authority never binds — the whole stock is 52 units and every plan fields a fraction of it — so the two
scarce resources are **leadership** (which caps the ladder) and the **stock** (which caps the marches).

## 2. The plan is a ray plus a finale (`68`, §1)

A plan is `marches` repeats of one march plus a final march (`plan.ts`), so

```
total damage = K × damage(march) + damage(finale)      total silver = K × silver(march) + silver(finale)
```

Take one shape — EMH VI 10 · ABT VI 10 behind a 7-rung ladder at scale 1.5 — and march it 1 to 12 times:

| marches K | total damage | silver | per silver | per mercenary |
|---|---|---|---|---|
| 1 | 5,342,110 | 3,143,200 | 1.700 | 593,568 |
| 2 | 7,192,297 | 4,710,400 | 1.527 | 653,845 |
| 3 | 9,037,959 | 6,277,600 | 1.440 | 695,228 |
| 4 | 10,883,621 | 7,844,800 | 1.387 | 777,402 |
| 5 | 12,729,283 | 9,412,000 | 1.352 | 848,619 |

What each further march adds:

| from | to | Δ damage | Δ silver | Δ damage / Δ silver |
|---|---|---|---|---|
| 1 | 2 | 1,850,187 | 1,567,200 | 1.1806 |
| 2 | 3 | 1,845,662 | 1,567,200 | **1.1777** |
| 3 | 4 | 1,845,662 | 1,567,200 | **1.1777** |
| 4 | 5 | 1,845,662 | 1,567,200 | **1.1777** |

The steps are identical to the decimal from the second march on: the same march, marched again. So the
repeated march is a ray whose exchange rate is fixed at 1.1777 a silver for this shape, and **neither ratio
moves because the march count changes** — what moves them is the finale. The averages drift toward the ray's
own rate as the final march is spread thinner (1.700 at K = 1 → 1.258 at K = 12, converging on 1.1777).

This is the answer to "did you analyse the curvature": the curvature the planner prints is **not** returns
diminishing along the ladder. It is the free final march being amortised, and the march count is the lever
that amortises it.

## 3. Both ratios are shape properties — so the frontier is one axis

Since `damage/silver ≈ D/S` and `damage/mercenary ≈ D/loss` for a shape, both of the owner's ratios are
functions of the **shape** — the mercenary counts, the ladder's depth, and the height of its floor — and not
of the plan's size. That makes the man's original instinct right in a precise sense: the plan *can* be
computed from one or two parameters, and the two the search actually uses are the **mercenary vector** and
the **ladder scale**, with the march count then walking the ray.

It also means the planner's three picks are three points on one axis, and a control over that axis can
replace them (the UI change in §10).

## 4. What the campaign totals as marches are added (`68`, §3)

Each row is the best plan whose repeated march the stock can field that many times (`shapeScorer`'s guard
rejects the rest — see §8). This is the table the owner asked for in so many words.

| marches | total damage | silver | mercs lost | per silver | per mercenary | Δ damage | Δ silver | marginal |
|---|---|---|---|---|---|---|---|---|
| 1 | 6,012,000 | 3,148,500 | 11 | 1.91 | 546,545 | — | — | — |
| 2 | 8,806,565 | 4,933,000 | 19 | 1.79 | 463,503 | 2,794,565 | 1,784,500 | 1.57 |
| 3 | 11,379,094 | 6,485,100 | 23 | 1.75 | 494,743 | 2,572,529 | 1,552,100 | 1.66 |
| 4 | 13,486,782 | 8,160,900 | 22 | 1.65 | 613,036 | 2,107,688 | 1,675,800 | 1.26 |
| 5 | 15,683,896 | 9,980,000 | 25 | 1.57 | 627,356 | 2,197,114 | 1,819,100 | 1.21 |
| 6 | 17,615,930 | 11,883,200 | 28 | 1.48 | 629,140 | 1,932,034 | 1,903,200 | **1.02** |
| 7 | 18,837,077 | 13,328,600 | 31 | 1.41 | 607,648 | 1,221,147 | 1,445,400 | 0.84 |
| 8 | 20,010,075 | 15,206,600 | 28 | 1.32 | 714,646 | 1,172,998 | 1,878,000 | 0.62 |
| 9 | 21,216,361 | 16,987,100 | 31 | 1.25 | 684,399 | 1,206,286 | 1,780,500 | 0.68 |
| 10 | 22,105,151 | 18,633,000 | 34 | 1.19 | 650,152 | 888,790 | 1,645,900 | 0.54 |
| 11 | 22,747,254 | 20,259,200 | 37 | 1.12 | 614,791 | 642,103 | 1,626,200 | 0.39 |
| 12 | 23,405,374 | 22,135,400 | 40 | 1.06 | 585,134 | 658,120 | 1,876,200 | 0.35 |

The shapes behind those rows, which is where the mechanism shows:

```
1× 7 rungs@1.6  (10/10/10/5)      7× 7 rungs@1.7  (8/9/10/1)
2× 7 rungs@1.55 (10/11/11/5)      8× 7 rungs@1.9  (7/8/9/0)
3× 7 rungs@1.55 (10/11/11/5)      9× 7 rungs@2.15 (6/7/8/0)
4× 7 rungs@1.6  (10/10/10/4)     10× 7 rungs@2.45 (5/6/7/0)
5× 7 rungs@1.6  (10/10/10/3)     11× 7 rungs@2.85 (4/5/6/0)
6× 7 rungs@1.7  (9/10/10/2)      12× 7 rungs@3.45 (3/4/5/0)
```

(counts are EMH/ABT/LGN/CHR.) As marches are added the mercenaries **thin out** and the ladder's **scale
rises** to hold its absolute size, because the ladder is what the silver buys; the chariots drop out entirely
from K = 8, having only seven units to spend. Total damage rises monotonically, 6.0 M → 23.4 M, while damage
a silver falls 1.91 → 1.06. Nothing here is a law of the game — it is what the stock constraint does to the
shape as the run gets longer.

## 5. The curvature, and the sweet spot (`68`, §4)

The marginal column of §4, in order: 1.57, 1.66, 1.26, 1.21, 1.02, 0.84, 0.62, 0.68, 0.54, 0.39, 0.35.

- It falls at eight of the ten steps and rises at two (K = 2 → 3, and K = 8 → 9). So the curve is **mostly
  concave but not everywhere**: the rises are steps where the plan changes shape, not smooth curvature. A
  purely concave curve is the wrong model for this object.
- **The knee: the first slice that buys less than one damage a silver starts at 11,883,200 silver (K = 6).**
  Below it, every further silver buys more than a damage; above it, less.
- **At the sweet spot's own spend (9,726,800 silver) the going rate is 1.02 damage a silver** — the last
  million silver bought about 1,015,150 damage. So "tweak to get the silver down while retaining damage" has
  a price, and it is about one for one there: from K = 6 down to K = 4 you save 3.72 M silver and give up
  4.13 M damage (rate 1.11), keeping 77 % of the damage for 69 % of the silver.

## 6. Can we do better than 1.56 and 705,862? (`68`, §2 and §2b)

The sweep: for each of the planner's own picks, a hill-climb over the mercenary counts (steps to ±21, against
the planner's ±2), the ladder's depth (1–8) and the ladder's scale on a grid of **0.05** against the
planner's ten values — 16 rounds, alternating the three axes.

| | |
|---|---|
| the bar | 1.56 a silver **and** 705,862 a mercenary, together |
| the best challenger | **1.57 a silver and 693,832 a mercenary** (6× 7 rungs at scale 1.35, EMH 9 · ABT 10 · LGN 10) |
| verdict | **it does not clear both.** The planner's pick stands as undominated over every shape the sweep reached |

The two ratio peaks the sweep found were 2.66 a silver and 1,179,365 a mercenary — but those are *different*
plans at the opposite ends, and no single plan reaches both. That is what a trade-off line is.

Two honest qualifications:

1. **The "balanced" criterion is flat near the optimum.** It is `min(perSilver / peakSilver, perMerc /
   peakMerc)`, and at the planner's pick that reads 0.587 against the climb's 0.589 — a 0.4 % difference. The
   pick is *a* point on a flat ridge, not a sharp optimum, so it should be reported as "the plan the engine
   weighs both resources to choose" and not as "the best plan". What is genuinely decided is the **spend
   level**, which §5 answers.
2. **On the maximum-damage objective the planner was leaving more behind than on the balanced one** — which is
   §7.

## 7. What was actually wrong: the ladder's scale (`69`)

`plan.ts` builds the ladder's floor as `mercenaryHp × (1 + gap) × scale`, takes `scale` from ten fixed values
(`LADDER_GROWTHS`), and never refines it — while the mercenary counts *are* hill-climbed. `gap` and `scale`
are the same knob, so this is a single continuous axis sampled ten times.

Take the K = 12 shape from §4 — **whose mercenary counts, ladder depth and march count are all on the
planner's own grid** — and move only the scale:

| ladder scale | damage | silver |
|---|---|---|
| 3.2 (on the list) | 22,173,142 | 20,645,000 |
| **3.45 (not on the list)** | **23,405,374** | 22,135,400 |

**+1,232,232 damage, +5.6 %, from a scale no amount of searching could reach.** The ridge is narrow: at 3.5
the ladder drops from seven rungs to six and the total falls back to 19,114,270. And the cap binds too — the
mercenary-efficiency end reaches its best at scale **9.05**, where the list stops at 6.

**Fixed.** The planner's hill-climb now walks the ladder as well as the counts (`plan.ts`, `SCALE_STEPS`,
depth ±1 and a geometric scale neighbourhood, on top of the grid). Measured effect on the same account:

| | before | after |
|---|---|---|
| best campaign | 22,355,110 damage @ 22,221,000 silver | **23,745,798 @ 23,917,500** |
| the curve's last bucket | 21,317,229 | **23,745,798** |
| most damage a mercenary | 1,148,336 | **1,163,036** |
| the curve's final marginal | **−1.07 a silver** | +0.17 a silver |

That last row is the one to read: before the fix the curve *fell* at its dear end, because the coarse grid
could not improve on a plan it had already found with a different ladder. A frontier that goes down when you
spend more is the signature of a search gap, and it is gone.

**Residual.** `68`'s hand-built sweep still beats the planner on the mercenary rate — 1,179,365 against
1,163,036 (+1.4 %) at scale 9.05 — because the climb optimises **total damage** and never climbs that ridge
for its own sake. The next lever, if the owner wants it, is to run the climb once per objective rather than
once for damage.

## 8. A defect found on the way: shapes the stock cannot field

The first sweep produced a "plan" fielding mercenaries the account does not have — **70 lost from a stock of
52**. The cause: the scorer was given both a march count and a count vector, and checked only what the final
march would have left. But a shape is only a plan if `K × ceil(n / 10) ≤ held`, because fielding `n` loses a
chunk of ten per march, for good (`plan.ts`).

`planCampaign` had been safe by construction — it *derives* the march count from the counts (`marchesFor`) —
but the same hole was reachable through the exported `marchTarget` input, where the caller's count and the
vectors' counts need not agree. No caller passes `marchTarget` today, so nothing shipped wrong; it is now
closed at the scorer (`lastsMarches`, one rule shared by `marchesFor` and the guard), and the default path is
byte-identical (`out/67-curve.md` diffs clean against the pre-change run).

## 9. Three random shapes, to see what an average one is (`68`, §5)

261 random plans at K = 6, sampled inside what the stock can field:

| | shape | total damage | per silver | per mercenary |
|---|---|---|---|---|
| worst | 6× 2 rungs@2.01 (2/0/1/1) | 3,250,648 | 1.56 | 141,333 |
| median | 6× 3 rungs@2.22 (8/9/2/1) | 7,489,160 | 1.19 | 267,470 |
| best | 6× 8 rungs@1.1 (8/9/8/1) | 14,230,430 | 1.40 | 508,230 |

The frontier at K = 6 is 17,615,930. **The median random plan is 42 % of it**, and even the luckiest draw
falls short — the picks are the top of a thin tail, which is why they have to come from a search and not from
intuition. It also means an "average" plan is a bad plan, and the app should never present one as neutral.

## 10. The UI: one control over the trade

Since the frontier is one axis (§3), the three-way toggle became a position on it: a stock Mantine `Slider`
over `plan.alternatives` (cheapest first), opening where the engine's recommendation sits. Design rules
cited: **23** (a stock component, themed, not hand-styled), **24** (named for screen readers — `thumbLabel` —
and drivable by the arrow keys, which is what the panel's own test presses), **4** (the fold stays),
**29** (the sizing line says where on the trade the plan sits, read off its position rather than off a name).
The two ends are labelled because a non-dominated frontier has no "silver end" and "mercenary end" — silver
and mercenaries rise *together* along it — so the axis is named for what it spends.

Files: `runStore.ts` (`PlanPick` is now a position, `defaultPlanPosition`), `PlanPanel.tsx` (the slider and
`readAt`), `PlanPanel.test.tsx`.

## 11. What is proved, what is consistent, what is not verified

- **Proved by the engine's own arithmetic** (and reproducible): the repeat step is constant; both ratios are
  shape properties; the K = 12 shape at scale 3.45 beats the same shape at 3.2 by 5.6 %; the guard rejects
  infeasible shapes; the default `planCampaign` path is unchanged by §8's fix.
- **Consistent but search-dependent**: "no shape beats 1.56 / 705,862 on both" is a statement about every
  shape *the sweep reached*, not about every shape that exists. The sweep is a hill-climb from the planner's
  own picks, so a shape far from all of them would be missed. The claim is as strong as its seed set.
- **Not verified in game**: nothing here. Every number is the engine's, and the engine reproduces the
  2026-09-14 report line for line (0016 §1). The ladder's floor being `mercenaryHp × (1 + gap) × scale` is a
  modelling choice inside the planner, not a game rule — what it *buys* is what the engine measures.

## 12. Speed: the search got 16× faster on the way

The scale refinement added work (a climb on top of the grid), so it was worth asking what the search actually
costs. Two things were found, both behaviour-preserving:

1. **The final march was being searched once per ladder.** `makeScorer` searched the best final march over the
   same eighty ladders *inside* every one of the eighty ladders of the repeated march — 6,400 marches' worth
   of arithmetic per shape. But the final march depends on the stock the repeats burn and on the silver they
   leave, and on the repeated march's own ladder **not at all**. Without a silver budget (the app's default,
   and every figure in this document) it is now walked once per shape and march count.
   **9.7 s → 0.74 s** on a four-troop/three-mercenary army, and **50 s → 3.2 s** on the owner's account
   (`67-curve`).
2. **Each candidate's silver and losses were re-counted every time it was read.** `record` reads the *current*
   best's two ratios on every candidate it sees, and that re-ran the whole recovery arithmetic each time.
   They are counted once per candidate now: 0.74 s → **0.59 s**.

Together **9.7 s → 0.59 s (16×)** on the test army, with byte-identical output: the curve `67` prints is
unchanged to the digit, and the plan the frozen tests pin is the same plan. The repo's own suite went from
78 s to ~33 s with it, because it was the plan tests that were slow.

**Not faster, deliberately**: with a silver budget the final march *does* depend on each ladder — what is
left is what that ladder did not spend — so the cache cannot apply, and that path still walks the eighty.
`plan-shape.test.ts` cross-checks the two: a budget too large to bind must buy the identical plan.

## 12b. The reason the app showed none of it: the client dropped the answer

Everything above is the engine, and the engine was fine — the owner's report that Generate *never came back*
turned out to be one line in `src/worker/client.ts`. The client settles a job by switching on the response's
`kind`:

```
case 'stack'  …  case 'search'  case 'complete'  …  case 'cancelled'  …  case 'error'
```

— and there was **no `case 'plan'`**. The worker ran the search, replied in seconds, and the client
`settle()`d the pending entry (deleting it) and then matched nothing: no resolve, no reject, nothing left for
the abort or crash handlers to reject either. So the March pane sat on **Cancel** for ever, with no error and
no cancellation — the plan method had never worked in a browser since it was added.

The tests could not have caught it: every client test ran `createInlineClient()`, which resolves directly and
never goes near that switch. Diagnosed by wrapping `Worker` in the live page and logging what crossed the
boundary — the reply was there, with a filled `curve`, and the button still read `running`. Fixed with the
missing case plus a stand-in worker in `client.test.ts` that answers every kind the client can send and fails
if a job never settles ("plan never came back from the worker" is what it says when the case is removed
again).

The second thing the live check found is that the *slowness* was real, and worse than a single account's:

| authority-pool units in the request | before | after |
|---|---|---|
| 4 | 1.5 s | 1.5 s |
| 5 | 2.3 s | 2.1 s |
| 6 | 7.6 s | 2.1 s |
| 7 | 34 s | 1.7 s |

The grid was the cartesian product of five count choices per mercenary type — `5ⁿ`. A player's authority pool
is **every monster they own** (69 units on this account) and the picker lets them field any of them, so at
eight selected types the first march count alone wanted 390,625 shapes. It is now crossed over the four types
with the most to put on the field, with the rest riding one shared fraction of their own largest count
(`CROSSED_TYPES`), which is the old grid's size up to five types and stops growing past it. Measured cost of
the reduction on this account's numbers: 101,170,967 against the product's 101,187,141 (0.016 %), and
*identical* at five and six types.

## 13. What now pins all of this

`tests/engine/plan-shape.test.ts` (7 tests, ~6 s) is the file that makes a refactor of any of this safe:

- **the arithmetic** — the repeats are one march whatever the march count is; the total is exactly
  `K × march + finale`; the final march never burns more stock as more marches are run; the scorer refuses any
  shape the stock cannot field, and `lastsMarches` is the rule it refuses by, checked against hand-computed
  values (20 held, 11 fielded lasts 5 marches; 16 and 5 lasts 12);
- **the search's quality** — the figures this army produces, frozen, so a refactor that quietly stops looking
  at the ladder's scale, at the counts or at the finale fails there while satisfying every invariant
  `plan.test.ts` asserts. The two ratios are asserted as **floors**, not equalities: they may only improve.

## 14. Reproducing

```
THEORY=1 pnpm vitest run tools/theorycraft/68-shape-sweep.test.ts   # the ray, the sweep, the progression, the random sample (~2 min)
THEORY=1 pnpm vitest run tools/theorycraft/69-scale-grid.test.ts    # §7: the scale grid, isolated (~50 s)
THEORY=1 pnpm vitest run tools/theorycraft/70-export.test.ts        # the same curve as CSV (~70 s)
THEORY=1 pnpm vitest run tools/theorycraft/67-curve.test.ts         # the curve the UI reads (~50 s)
```

Each writes `tools/theorycraft/out/<name>.md`; `70` also writes `plan-curve.csv` and
`plan-progression.csv` — the frontier and the §4 progression as machine-readable rows, for plotting outside
the repo. One caveat to read them together with: **`70`'s progression and `68`'s §3 disagree at low K by up
to 9 %** (K = 1: 6,562,556 against 6,012,000) because `70` sweeps the counts where `68` climbs from
fractions. `70` is the denser search and its low-K rows are the better plans; `68`'s climb is the one whose
seeds are the planner's own picks.

And the tests that pin the engine itself (§13), which need no `THEORY` flag and run in seconds:

```
npx vitest run tests/engine/plan-shape.test.ts   # the arithmetic, the guard, the frozen figures (~6 s)
npx vitest run tests/engine/plan.test.ts         # the contract the UI relies on
npx vitest run src/ui/sections/march/PlanPanel.test.tsx   # the plan fold and its one control
```

The engine change lives in `src/engine/plan.ts`: `shapeScorer` / `makeScorer` / `lastsMarches` exported for
this purpose, `SCALE_STEPS` added to the hill-climb. `tests/engine/plan.test.ts` and the UI's own tests cover
it; the whole suite is 690 passing.
