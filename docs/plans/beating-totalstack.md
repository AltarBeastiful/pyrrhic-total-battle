# Beating TotalStack on every marker — implementation plan (S-119)

**Owner, 2026-09-21**: *"write a plan to beat total stack everywhere … this should also include fixing the
no leadership at all on some cases."* → *"beat means using constrained resources to produce better damage
with a fixed silver/merc/gold/dragon coins set. So we can derive its being more efficient in the markers
related. verify we're using the proper heuristics or change them."* → **2026-09-22**: *"write the full plan
to improve our algorithm against all markers with totalstack as a benchmark minimum goal."*

Every figure below is measured, from the benchmark payload committed in **`43f212b`**
(`tools/theorycraft/out/benchmark-latest.{md,json}` — seventeen armies, 393 rows, all seventeen carrying
captured TotalStack rows since the capture of 2026-09-22). Nothing is recalled.

*It said `847ce14` until S-121, and that was the whole of §1's trouble below: `847ce14` is the payload from
**before** the capture completed. §1 and §2 are now written out of the run itself, by the standing at the end
of `benchmark-latest.md`, so the provenance cannot drift from the figures again.*

---

## 0. The objective, and what "minimum" means

**TotalStack is the floor, not the target.** The target is his own standing objective — *"best damage over a
campaign using my constrained resources"*. TotalStack is how we know we are not fooling ourselves: an army
where a public calculator does better is an army where our answer is provably improvable.

**The test is dominance at matched spend.**

> Take any march TotalStack answers with. Read its costs. **We beat it when the bar offers a stop that
> spends no more of any of them — within 5 % — and deals more damage.**

**"Any of them" is the four his sentence names**: silver, hired burned, revive gold, dragon coins. The
training queue is the fifth thing a march spends and it is **reported on every table and gates nothing** —
see §8, where the measurement that settled it is written down.

Every marker ratio follows by construction: more damage at no more cost makes `damage / silver`,
`damage / soldier`, `damage / monster` and `damage / dragon coin` each at least theirs. His *"all four ≥ 1.0
everywhere"* is the **derived reading**, not a second target. The per-reading best stop stays, because a stop
that dominates dominates on all of them at once.

**5 % is the tolerance he set** (*"ok to exceed within reasonable bounds"*). Swept over the payload the
verdict moves **4 → 5 → 5 → 6 → 6** beats at 0 / 5 / 10 / 20 / 50 %, and the sweep says two different things
— *(re-measured S-121; the figure written here first, `3 → 4 → 4 → 5 → 5`, matched no payload in the repo and
is withdrawn)*:

- **On the armies we are merely behind on, loosening does not rescue us.** One army crosses anywhere between
  0 % and 50 %, and §3's deficits — −77.9 %, −20.2 %, −13.9 %, −12.5 % — are nowhere near a gate. Those gaps
  are real.
- **On the three armies where no stop of ours fits at all, it does.** At 20 % that count drops **3 → 1**. So
  the tolerance *is* load-bearing for G0, and what that tells us is about G0 rather than about the gate —
  see below.

---

## 1. The markers, and where we stand on each

Six resources decide a march. Each row is **our best stop against their best captured row on that marker
alone**, over the seventeen armies.

| marker | direction | we win | tie | **we lose** |
|---|---|---|---|---|
| damage | max | 8 | 0 | **9** |
| silver | min | 13 | 0 | 4 |
| hired burned | min | 6 | 4 | **7** |
| revive gold | min | 7 | 3 | **7** |
| **dragon coins** | min | **0** | 15 | **2** |
| training queue | min | 12 | 0 | 5 |

**Re-measured 2026-09-22 (S-121), and it had been stale.** This table read 9/14/6/7/0/13 wins until then —
which is exactly what `git show 847ce14:tools/theorycraft/out/benchmark-latest.json` still gives, to the
digit. That payload is the **incomplete** capture, taken while the `optimize` route was still answering 403:
§2 was re-measured when the capture completed in `bf19b01` and this table was not, so it was scoring us
against two armies whose priority-search rows had not arrived yet. Four of the six markers moved by exactly
one army when they did. It is now written out of the run itself (`tests/engine/plan-benchmark.test.ts`, the
standing at the end of `benchmark-latest.md`), so it cannot go stale again.

**Dragon coins is the marker we never win.** Fifteen of the seventeen armies spend no coin at all and read as
ties; of the three that do, we lose two — the monster camp at **27,040 against 22,880** and his TotalStack
profile at **3,840 against 1,920** — and **his usual setup is an exact tie at 4,320 each**. That is the
dominance pool, and it shares a root with G5.

**Silver and queue are our strengths** (13 and 12 wins) — the plan is built to ration. **Damage, burn and
gold are roughly even**, which is the honest summary: we are not behind across the board, we are behind in
specific, diagnosable places.

Read these as *marker floors*, not as the goal: winning a marker by fielding a tiny march is not winning.
§2 is the composite that cannot be gamed that way.

---

## 2. The composite: dominance at matched spend

At the 5 % tolerance, over all seventeen armies: **we beat them on 5**, are short on 9, and on **3 no stop of
ours fits their budget at all**.

**Re-measured 2026-09-22 on complete captures** — the cookie that entitles the `optimize` route is now
supplied from the environment, so all 168 answers came back 2xx and every army carries its priority-search
rows. §2 is no longer a lower bound on their side.

| ✓ beat | short | no stop fits |
|---|---|---|
| 7 000 export **+55.5 %** | Bear ×1, ×2 −0.2 % | monster camp, 900 dominance |
| his TotalStack profile +20.7 % | e2e seed −1.3 % | 12 000 export |
| camp 2026-09-19 dump +17.7 % | 4 000 case −2.8 % | camp of 2026-09-19, message |
| **his usual setup +4.3 %** | Bear ×10 −7.0 % | |
| live account +1.8 % | Bear ×3 −12.5 % | |
| | live account, evening −13.9 % | |
| | **Aydae alone −20.2 %** | |
| | **live camp 2026-09-18 −77.9 %** | |

**What the complete capture cost us, and it is the honest half of the story.** The two armies captured for
the first time that morning had only Generate rows while `optimize` was refused, so their verdicts flattered
us. With the priority searches in: **his usual setup +27.9 % → +4.3 %** and **Aydae alone −9.2 % → −20.2 %**.
Two registered pins moved with them — `Aydae alone`'s `externals.damageFloor` **1.09 → 0.79** (its hardest
row is now `priority search under Elite (averageDamage)` at 23,501,117 against our 18,744,735) and `his usual
setup`'s `externals.winsHired` **true → false** (their priority searches get 461,105 out of a hired soldier
chunk where our best stop gets 422,679).

The count did not move — 5 beats before and after — but four of the five are now his own large accounts and
the margin on the camp he plays is a twentieth of what it looked like.

---

## 3. The gaps, diagnosed

### G0 — No stop of ours is inside their budget (3 armies)

Every stop we offer spends more of at least one resource than their hardest row. We are not losing the
comparison, we are not in it. Invisible in the ratio table, where all three read as comfortable wins (1.226,
1.717, 1.297 a silver). **A coverage defect in the burn ladder, not a quality one.**

**And since S-121 the run names the resource**, which is the first thing W4 and W5 have to answer for:

| army | the marker every stop overspends | of their marches, none of ours fits |
|---|---|---|
| monster camp, 900 dominance | **gold** | 3 of 3 |
| 12 000 export | **hired burned** | 6 of 9 |
| camp of 2026-09-19, message | **silver** | 3 of 3 |

Three armies, three different resources — so this is one defect only in the sense that the ladder is too
narrow in every direction at once, not that one knob fixes all three.

**And two of the three are near misses, which is new** (S-121, from the tolerance sweep in §0). Widening the
gate to 20 % — not a proposal, a probe — puts a stop inside two of these budgets:

| army | at 5 % | at 20 % | at 50 % |
|---|---|---|---|
| camp of 2026-09-19, message | no stop fits | **+54.2 %** | +75.9 % |
| 12 000 export | no stop fits | −8.9 % | −8.9 % |
| monster camp, 900 dominance | no stop fits | no stop fits | **no stop fits** |

So G0 is really **two** defects. On the first two armies the bar has a march that would win handsomely and
misses the budget by a few per cent of one resource — a ladder granularity problem, squarely W4. On the
monster camp no tolerance helps, because the obstruction is **gold** and every stop we offer pays it: that
one is W5 and W6, not W4. The +54.2 % is the strongest single piece of evidence in this file that the
damage is there and only the coverage is missing.

### G1 — The plan will not spend an unlimited stock (live camp, −77.9 %)

| row | damage | silver | burn | troop types |
|---|---|---|---|---|
| `TotalStack · Total Optimization` | **49,229,801** | 7,794,000 | 374 | 7 |
| **our own `Tier ladder · all types`** | **43,923,310** | 7,770,800 | 398 | 7 |
| our best stop (`steady-max`) | 15,306,859 | 9,849,200 | 52 | 4 |

**Our sizer is within 11 % of TotalStack. Our plan is 3.2× behind our own sizer.** Bears are unlimited here;
the ladder tops out at 52 chunks where the sizer spends 398. The ladder's ceiling is the search winner's
burn, and on an unlimited stock the winner is a thrifty deep ladder nowhere near the army's capacity. S-97
added a top pass for this and it is not enough. **The damage is provably reachable — our own sizer reaches
it.**

### G2 — Our sizer is out-sized at identical cost (4 000 case, −2.8 %)

`TotalStack · M's Preservation` **8,762,880** against our `Troops first · all types` 8,519,930 — same army,
same stock, **same silver, same burn, same eight troop types**. Nothing about horizons or objectives explains
it; our flat profile loses to theirs head to head. The cleanest isolated defect in the file.

### G3 — Their single-march search beats ours on small armies (−12.5 %)

Bear ×3: their `priority search under M's (averageDamage)` **21,427,548** at 56,000,000 silver; ours
18,722,192 at the *same* silver. Three troop types and three bears — small enough to solve near-exactly, so
this is correctness, not budget.

### G4 — The evening account, −13.9 % at matched cost

Their 36,832,597 against our all-in's 31,714,657. Unlimited hired type again; likely G1 in a milder form.

### The diagnostic that separates "we cannot" from "the bar does not" (S-121)

The standing's last column asks the same matched-spend question of **every algorithm the app offers** — the
two sizers, their three switches and all five objectives — rather than of the bar's stops. Where it stands
above the bar's own column, the damage is provably reachable by this engine today and the plan is simply not
reaching it. Six armies say so:

| army | the bar | any algorithm |
|---|---|---|
| live account, evening | 1/9 | **5/9** |
| his usual setup | 5/9 | **7/9** |
| e2e seed | 5/9 | **7/9** |
| camp of 2026-09-19, message | 0/3 | **2/3** |
| Aydae alone | 0/9 | **1/9** |
| live camp 2026-09-18 | 0/3 | 0/3 — the one G1 army where even the sizer is short at matched spend |

It is **never pinned and never a verdict**: it scores a product nobody ships. It is the cheapest existing
evidence for W4, and it is what turns "our plan loses" into "our plan will not spend what our own sizer
spends" on five of the six.

### G5 — Damage a monster, 0.911 on a dominance army

`his TotalStack profile`. The only ratio under the goal after S-118's pinning. **S-116 (the order of death)
is already written against this mechanism** — sheltered monster stacks ordered by rounding rather than by
damage per point of HP, measured at 8.3 % there. G5 is S-116's acceptance test, not separate work.

### G6 — Dragon coins, never won on an army that spends one (2026-09-22, corrected S-121)

§1: 0 wins, 2 losses, 15 ties. On the monster camp we spend **27,040 coins against their 22,880** and on his
TotalStack profile **3,840 against 1,920**; on his usual setup the two sides are level at 4,320. So the claim
this gap was first written with — *"on all three that do, we spend more"* — was one army too strong, and it
came from the same stale payload §1 did. The shape of it stands: we never come out **ahead** on a coin.
Shares a root with G5 — which monsters, in which order, at what size — but is measured on a different axis,
so it needs its own acceptance criterion.

---

## 4. The heuristics audit — his explicit mandate

*"verify we're using the proper heuristics or change them."* Each is a heuristic §1–§3 give grounds to
doubt. Each is **measure first, then decide**: an experiment before a change.

| # | heuristic | where | the doubt |
|---|---|---|---|
| H1 | the burn ladder's ceiling is the search winner's burn | `plan.ts` | G0/G1 — on an unlimited stock the winner is thrifty, so the ladder never reaches capacity |
| H2 | the band refuses a stop fielding under half the winner's hired units | `plan.ts` | may be what removes the stops that would fit their budget (G0) |
| H3 | `beatsOnFigures` dominates on damage, silver and burn | `plan.ts` | **reads neither gold nor dragon coins** — a correctness gap against §0, and G6 is what it costs |
| H4 | the sizer's flat HP profile, `ceiling − i·δ` | `stacker.ts` | G2 — beaten at identical cost |
| H5 | `RANK_SPREAD`, the δ between stacks | `stacker.ts` | never swept against a rival; the obvious knob behind H4 |
| H6 | greedy descent + restarts in `searchPriority` | `search.ts` | G3 — 14 % behind on an army solvable exactly |
| H7 | the shelter's one flat ceiling per type | `stacker.ts` | G5/G6 — the relative order of sheltered stacks falls out of rounding |
| H8 | the knee that picks the sweet spot | `plan.ts` | picks on ratios, and ratios are now the derived marker rather than the target |
| H9 | the search is budget-bound on a large dominance pool | `plan.ts` | it fills any clock (§5.3), so its answer is the machine's |

---

## 5. Workstreams

### 5.0 W0 — The simulator stops doing the same work four times — **done 2026-09-22 (S-123)**

Not in this plan as written; slotted in at the owner's word (*"ok slot them in as long as you're using
benchmark and test to ensure no regression"*) because W3 is blocked on the planner filling any clock it is
given, and because the two defects were plainly dead work rather than a design.

`simulateBattle` walked the whole battle **four** times — `buildJournal` twice, then `hitsPerStack` twice to
recount hit counters the first pair had already counted — and sorted the attack order four times with it. It
now walks each orientation once and sorts once. Beside it, `battleScore` answers the **seven figures an
objective is scored on** and nothing else: the priority search reads one number off a candidate and was
paying for two journals with an entry list each, a pool split, and a freshly allocated 12-element
`modelNotes` array, thousands of times, for candidates it compared and threw away.

*Acceptance, and it is the strongest kind available here*: `tests/engine/battle-equivalence.test.ts` keeps
the **pre-refactor implementation verbatim** and deep-equals the whole `BattleSummary` against the new one
over every subset of every common army, plus the shapes a sized army never produces (no stacks, one stack,
enemy formations of 1, 2, 3, 4, 8 and 13 squads). If it passes, the refactor is invisible to every caller.

*Measured*: **1.17×** end-to-end on `searchPriority` over 14 runs, with `evaluated` **identical on every
one** — the same candidates explored, so no answer moved.

**And it measured something worth more than the speed-up.** Per candidate: `sizeStacks` **0.067–0.128 ms**
against the entire battle simulation's **0.005–0.017 ms**. **The sizer is 85–90 % of the cost and the battle
is ~10 %**, which is why the win is 1.17× and not the 3–5× it was guessed at. Whatever is done next for
speed is done to `stacker.ts`, not to `battle.ts`.

### 5.0b Where a clock actually binds — **done 2026-09-22 (S-124)**

The owner: *"pin where we spend time and especially where we're constrained by a budget."* Every army now
records `planMs`, `searchMs`, the number of search calls and whether the planner left **budget-bound**, and
the standing prints them. Nothing is asserted on a timing — a floor would be red on a slow machine — because
the point is not the number, it is what it licenses anyone to claim.

**And measured, it says something nobody had checked: on this benchmark, neither search is budget-bound.**

| | planner | priority search |
|---|---|---|
| armies that fill their clock | **0 of 17** | **0 of 17** |
| worst seen | monster camp, **9,643 ms of 40,000** (24 %) | monster camp, **1,957 ms a call of 8,000** (24 %) |

So **on every army this repo scores itself on, a faster engine returns the same plan sooner and nothing
more.** The one case measured to fill its clock is the **20 000-dominance camp** — experiment 129, 40,843 to
40,934 ms against a 40,000 ms cap — and it is not a scenario here *precisely because* it does not converge,
which is what W3 is for. Until W3 registers it, *"faster means better answers"* is a claim about **one army,
and it is not on the table**.

That correction matters because the argument had already been made the other way round twice in one
afternoon — W0's first justification, and then this section's own first draft — each time from the shape of
the code rather than from a reading. The second reading is the useful one: the priority search costs far
more of a run than the planner does (78 s over forty calls against 9.6 s on the monster camp), and inside a
call the **sizer** is 85–90 % of it. A run that wants to be shorter goes after `stacker.ts`.

### 5.0c AssemblyScript — **deferred, and on purpose**

The owner asked whether rewriting the hot planner in AssemblyScript would help. **Deferred until the data
model is refactored and a profile pins where the budgets bind**, for three reasons that do not need a WASM
toolchain to establish:

1. **Amdahl.** Any split that leaves the sizer in TypeScript caps the win at `1 / (its share)`. On the
   search's candidate loop the sizer is 85–90 %, so leaving it behind caps the whole exercise near 1.2×.
2. **Boundary placement.** `sizeStacks` produces the stacks `score()` consumes, inside the per-candidate
   loop. Putting those two on opposite sides of a WASM boundary marshals an army in and out thousands of
   times a plan — the worst available split, and the one a "port the scoring nucleus" proposal describes.
3. **The prerequisite is the experiment.** A WASM port needs a flat numeric interface: unit ids as dense
   integer indices, counts in typed arrays, no `Record<string, number>` or `Map<string, …>` in the hot loop.
   That refactor is required work either way — so **do it in TypeScript first**, where it can be debugged
   and where the 17-army benchmark can hold it to the unit. If it captures most of the win, the port is
   unnecessary; if it does not, it has produced the exact profile that would size one.
4. **And §5.0b removed the reason to hurry.** Nothing on this benchmark is budget-bound, so no amount of
   speed changes an answer here today. The one army where it would is the 20 000-dominance camp, and the
   honest way to reach it is W3 — make the search converge — not a faster implementation of a search that
   does not.

### 5.1 W1 — Make the target measurable — **done 2026-09-22 (S-121)**

Matched spend is the benchmark's **primary reading**, above the goal line on every army's table rather than
beside it. `tests/engine/matched-spend.ts` holds the arithmetic — pure, no engine import, twelve unit tests
of its own so a tolerance comparison is debuggable in a quarter of a second rather than only inside a
three-minute suite.

Each army now prints their hardest comparable march with its four costs, the bar's best stop inside that
budget at 5 % and the delta; how many of **all** their comparable marches the bar dominates and how many have
no stop of ours inside them at all; what **any** algorithm the app offers would have dominated (the
diagnostic that tells G1 and G4 apart from the rest); and the six marker floors. `Pinned.matched` carries a
floor on all seventeen: **fourteen pin the delta** at measured, and the **three G0 armies pin `fits: false`
and assert nothing** — a stop appearing inside their budget is the coverage defect being fixed, so it is
reported and left for him to register. Those three are unfloored until W4 gives them a stop. The run ends with a standing over every army — §1's and §2's tables,
written out of the payload, so neither can go stale again.

**Four things the build changed, each measured rather than argued** — three about the plan, one a defect it
found in the benchmark's own data:

1. **The gate is four costs, not five.** §2's table reproduces exactly on silver, gold, coins and burn, and
   not with the queue added — which also answers §8's second open question the other way round.
2. **§1 was stale**, measured on the incomplete capture; four of its six markers moved by one army.
3. **`expect.soft`**: every pin in `check` and `checkBaseline` now reports independently. Seven armies are
   red, and on each of them every assertion below the first failure was invisible.
4. **Eight armies carried two different captured marches under one name.** `methodOf` read `monsterSaving`
   on the Generate route — it is what *Total Optimization* means — and not on `optimize`, so the two
   `priority search under Elite` bases came back as twins with different counts (on the 12 000 export,
   22,753,836 for 21,763,200 silver and 7,807,482 for 33,600,000). No figure was wrong, because nothing that
   picks a row reads the name; what was wrong is that `asBaseline` keys `ratios.externals` by name through
   `Object.fromEntries`, so one of each pair would have **overwritten** the other in a registered baseline.
   Named apart now, and a hard assertion in `measure` refuses any table with two rows of one name.

**No engine change** — it is the instrument. **No pin moved**: `bestSizer`, the ratio floors and the
baseline are untouched, and the only new floors are the ones this story measured.

### 5.2 W2 — Complete the external rows — **done 2026-09-22**

The `optimize` route answered **403 `proRequired`** to every terminal client while answering **200** to the
identical body in the page. Proven to be a cookie: same page, same body, same session id, only the flag
differing — `credentials: 'include'` 200, `credentials: 'omit'` 403 — and `document.cookie` empty, so an
**HttpOnly** one, stripped from Chrome's sanitised HAR export. `x-session-id` identifies the *calculation*
and entitles nobody.

`replay.mjs` takes **`TOTALSTACK_COOKIE`** from the environment beside the session id; with it, **168/168
answers came back 2xx** (120 optimize, 48 Generate) at 1.5 s pacing. `--emit` remains for running the
optimize half in the page when the cookie should not leave the browser.

*Done*: every army has its `priority search under Elite` and `under M's` rows, §2 is re-measured, and the two
pins the fuller comparison moved are re-pinned at measured.

### 5.3 W3 — Make the search converge on a large dominance pool (H9)

`CAMPAIGN.budgets.plan` is 40 s (raised 2026-09-22). The 20 000-dominance camp still runs 40,843–40,934 ms —
it fills whatever clock it is given, so its bar is the machine's and it cannot be registered. The four
captured answers it already has stay unusable until it converges.

*Acceptance*: that camp finishes inside the budget with margin over three runs; then it is registered as
scenario 18 with pins that are the engine's.

### 5.4 W4 — The burn ladder reaches the army's capacity (H1, H2)

The largest single win available. On an unlimited or very deep stock the ladder must extend to what the army
can actually field — our own sizer's 398 chunks on the live camp is the existence proof — and the band must
not delete the thrifty stops that would fit a rival's budget.

*Acceptance*: live camp −77.9 % → **positive**; the three G0 armies get a stop inside their budget; no army
regresses in §2. Expect stop counts and several pins to move — **he registers them**.

### 5.5 W5 — The dominance test reads all the markers (H3)

`beatsOnFigures` gains gold and dragon coins. Small, and a correctness fix against his own definition.

*Acceptance*: no stop survives that another beats on all six markers; G6's three armies improve, or the
measurement says why not.

### 5.6 W6 — The order of death (S-116) — G5, G6

Already specified in `docs/plans/the-order-of-death.md`: order sheltered stacks by damage per point of HP
rising as total HP falls, as a local reordering inside `shelterUnder`. Measured ceiling 8.3 % on his account,
0 % with mercenaries alone.

*Acceptance*: damage a monster ≥ 1.0 on his TotalStack profile; dragon coins no longer lost on all three
coin-spending armies.

### 5.7 W7 — Our flat profile against theirs (H4, H5)

Isolate on the 4 000 case, where the comparison is exactly controlled. Sweep `RANK_SPREAD` and the ceiling
solve; compare stack for stack against their M's Preservation answer.

*Acceptance*: ≥ +2.9 % at identical silver, burn and troop count on that case, and the finding stated as a
rule rather than a tuned constant.

### 5.8 W8 — The single-march search (H6)

The bear armies are small enough to enumerate. Establish the true optimum by exhaustive search offline, then
measure how far `searchPriority` is from it and why.

*Acceptance*: ≥ +12.5 % on Bear ×3 at the same silver; the gap to the exact optimum stated for each bear
army.

### 5.9 W9 — No leadership at all (his choice: tell now, floor after)

Eight of 227 rows field **no troop stack**: `damagePerSilver` on every army housing a dominance pool, and
`avgDamage` under Troops first on the evening account and Aydae-alone. `runGenerate` branches on the
objective before it reaches the sizer, so the method radio is inert.

- **W9a, telling**: the method radio says it is inert while an objective is selected; the March pane marks a
  troopless answer and names the objective that chose it. **No figure moves, no pin moves.**
- **W9b, floor**: `searchPriority` refuses a selection with no troop stack (or fewer than two, the band's own
  criterion). Changes what four objectives answer on six armies — pins move, **he registers them**.

---

## 6. Order, and why

| # | work | unblocks / worth | risk |
|---|---|---|---|
| 0 | ~~**W0** the simulator's dead work~~ **done 2026-09-22** | 1.17×, and it found that the **sizer** is 85–90 % of a candidate | none — proven equivalent |
| 1 | ~~**W1** matched-spend instrument~~ **done 2026-09-22** | makes everything below measurable and non-regressing | none — no engine change |
| 2 | ~~**W2** complete external rows~~ **done 2026-09-22** | §2 is no longer a lower bound | — |
| 3 | **W5** H3 reads gold + coins | correctness vs the definition; cheap | small |
| 4 | **W4** burn ladder capacity | −77.9 % → positive, plus the 3 G0 armies | pins move |
| 5 | **W6** order of death (S-116) | G5 + G6, the coin marker | specified already |
| 6 | **W7** flat profile | +2.9 %, probably generalises | isolated |
| 7 | **W8** single-march search | +12.5 % on the bears | isolated |
| 8 | **W3** converge the big camp | scenario 18 registrable | engine work |
| 9 | **W9a** then **W9b** | 8 rows | W9b moves pins |

W1 and W2 come first because everything after them is judged by them. W5 is third because it is a correctness
gap against the definition and costs almost nothing.

---

## 7. What must not regress

- **The 5 beats of §2 stay beats.** That is what pinning them in W1 is for.
- **Silver and queue** (13 and 12 marker wins) are what the plan is for; a change that buys damage by
  spending freely is a different product, not a better one. They are the benchmark's only two aggregate
  floors, at exactly those counts.
- **The seven red armies already on the benchmark** are not in this plan. They carried **seven** visible
  assertions before S-121 and carry **fifteen** after it, because `expect.soft` stopped one failure hiding
  the rest: **10** of the damage-a-hired family (6 against the other calculators, 4 against the sizers), **3**
  stop counts and **2** `sweetNotAheadOnEither`. Nothing got worse — eight failures were always there and
  were invisible. Pinning any of them is a re-base and his call.
- **And six more outside it, measured 2026-09-22 (S-121) and pre-existing at `bf19b01`** — verified by
  running the two files in a worktree at `bf19b01`, where they fail identically. Five in
  `tests/engine/plan-criteria.test.ts` (the engine-tests army at horizon 4; the owner's 7 000 and 12 000; the
  sweet spot's campaign at 7 000; the monster camp's shelter criterion) and one in `plan-shape.test.ts`. **Five
  of the six are damage-a-hired floors** — `expected 261254 to be greater than or equal to 439833`, and four
  more of that shape — which is the same reading **10 of the benchmark's 15** failing assertions are on.
  They are recorded here so that "the tree was red before this work" is a measurement and not a claim, and
  because one reading — what a chunk of hired stock is worth — accounts for **15 of the 21** failures in the
  tree.
- **No pin is re-based by a worker.** A scenario must not get worse, or it is a discrepancy, or he registers
  the trade.

---

## 8. Still open

- **May a marker be exceeded beyond 5 % when the damage plainly pays for it?** The tolerance is uniform
  today; an army where they spend 0 gold makes gold a hard gate no damage can buy past.
- **Is the training queue a marker he wants gated**, or only reported? **Measured, S-121, and the guess
  written here first was wrong.** It read *"it is our second-best marker, so gating it costs nothing
  today"*. Adding `seconds` to the four costs of §0 takes the standing from **5 beats / 9 short / 3 with no
  stop inside their budget** to **3 / 10 / 4**: his own TotalStack profile falls **+20.7 % → −27.4 %**, his
  camp of 2026-09-19 goes from **+17.7 %** to no stop fitting at all, the live camp from −77.9 % to −81.8 %
  and the e2e seed from −1.3 % to −1.8 %. **Gating the queue costs two of the five armies we beat.** It is
  reported and not gated until he says otherwise, and it would constrain W4, which buys damage by fielding
  more.
