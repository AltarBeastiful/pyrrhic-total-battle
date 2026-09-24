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
| H3 | ~~`beatsOnFigures` dominates on damage, silver and burn~~ **fixed S-125** | `plan.ts` | It read neither gold nor coins — a real gap against §0. Widened, and **measured to change nothing**: 0 of 53 stops dominated before and after, no stop count moved. G6 was mis-attributed to it; that is H7/W6. |
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

### 5.5 W5 — The dominance test reads all the markers (H3) — **done 2026-09-22 (S-125), and it moved nothing**

`beatsOnFigures` — the one rule that removes a rung from the pool the sweet spot and the silver saver are
read off — judged on **damage, silver and the burn**. It now judges on damage and **all four costs the
owner's definition names**: silver, the burn, the revive gold and the dragon coins.

**Acceptance, and the honest reading of it.** The criterion as written — *"no stop survives that another
beats on all six markers"* — was **already met before the change**: experiment 130 asks it of every stop on
every benchmark army and reads **0 of 53** dominated, both before and after. And the widened rule changes
**no stop count on any of the seventeen armies**, no pin, and nothing on the benchmark.

**So W5 buys nothing measurable today, and it is kept anyway** — that is a judgement, and here is the case
for it. The rule is what decides which rungs are *comparable*, and until this story it was a dominance test
on two of the four currencies a march spends: a rung costing the same silver and the same hired chunks for
the same damage but twice the gold was declared its neighbour's equal. That it never *bit* on today's
ladders is a fact about today's ladders, not about the rule — **W4 is about to rebuild those ladders and W6
about to reorder the monsters**, and a ranking rule that is wrong-but-inert is the kind of thing that starts
biting silently the moment the thing it ranks changes.

It is also not vacuous: over the 136 campaign-level pairs of plan rows in the payload, exactly **one** is
called a beat by the old rule and **gold vetoes it**. The reading discriminates; it just does not bind where
`beatsOnFigures` is applied.

**G6 does not improve, and the measurement says why.** The three coin-spending armies are untouched, which
is what should have been expected: G6 is about *which* monsters are fielded, how many and in what order —
that is S-116, which is **W6** — and not about which rung of a burn ladder the sweet spot is read off. W5
was mis-filed as G6's fix in the first draft of this plan; W6 is its fix, and W5 is a correctness repair
standing on its own.

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

### 5.9 W9 — No leadership at all — **attempted and reverted 2026-09-22 (S-129)**

**The rule is reverted and W9 is open again.** What follows is what it bought, what it cost, and the
measurement that stopped it — all of it worth keeping, because the next attempt starts from here.

*The cost that stopped it.* Refusing a selection that another beats for the same stock made **`damage per
silver` answer within 2 % of `average damage` on 16 of 17 armies** — four of the five objectives went inert.
The reason is structural rather than a bug: on the search's own dominance army the troops add damage and cost
**only silver** (no chunks, no coins), so a filter that does not read silver discards every trade the
objective is about, and one that does read silver keeps the degenerate cheap march it was meant to remove.

*And the two cases are the same march.* `search.test.ts`'s *"finds the monsters-only peak that no chain of
one- or two-type drops leads to"* demands the search **find** a monsters-only march at ratio 4.3098; the
owner calls the troopless march on his own camp unplayable. They are structurally identical — a cheap,
high-ratio selection that empties the leadership pool — so no dominance rule keeps one and refuses the other.
A **floor** is needed, not a trade. (His revised reading of that test, 2026-09-22: it is about *coverage* —
*"in a march with dominance, find if varying monsters or dominance used or retiring monsters leads to
criteria improvement"* — so the peak must be **reachable**, not necessarily **answered with**.)

*And the criteria are not all in view.* The owner, same day: *"gold/dragon coins depending on the revival
setting. Are you sure you have all the criteria in view? monsters added more criteria to watch."* He is
right. The five markers are complete, but their **values depend on `RecoverySettings.plan.mode`** — under
`retrain` a monster costs silver, queue and **dragon coins** and no gold; under `revive` it costs **gold**;
under `selective` the top type of each listed family is revived and the rest retrained. The benchmark is not
even uniform: the 4 000 capture hardcodes `retrain` (`plan-scenarios.ts:330`) while his own profile default
is `{ mode: 'selective', reviveFamilies: ['monsters'] }`. **Every dominance verdict in this plan is
conditional on a setting nothing has varied**.

**Measured, experiment 137 (S-130)** — `retrain` against `revive`, on the three armies housing a dominance
pool:

| cost | movement across the three armies | |
|---|---|---|
| silver | 8,862,600 → 1,546,000 · 1,997,700 → 262,500 · 1,997,400 → 269,600 | **÷5.7 to ÷7.6** |
| gold | 1,392 → 84,576 · 576 → 20,568 · 648 → 22,104 | **×34 to ×61** |
| training queue | 2,654,580 → 612,630 · 436,620 → 80,865 · 440,295 → 85,530 | **÷4.3 to ÷5.4** |
| **dragon coins** | 7,920 → 7,920 · 960 → 960 · 1,080 → 1,080 | **unmoved** |
| **hired burned** | 10 → 10 · 8 → 8 · 9 → 9 | **unmoved** |

**Two of the five costs belong to the march alone; three belong to the march *and* the setting.** Coins are
what a monster costs to recruit again whatever else is revived, and the burn is the authority pool, which no
recovery plan touches. Silver, gold and the queue move by factors of five to sixty.

So a comparison taken on **coins and the burn** travels between accounts. One that reads **silver, gold or
the queue must say which setting it is on** — `damage per silver` on a revive account is asked of a silver
bill five times smaller than the same march on a retrain account, which is the same army and the same march
posing a different question. `selective · monsters`, the app's own default, sits with `retrain` rather than
between the two.

**What that obliges.** §2's matched-spend verdict prices both sides on our own engine, so it stays
internally consistent — but it is a verdict **at his settings**, and this plan says so from here on.
`STRATEGIES.stock`, the burn alone, is the one reading in `trades.ts` that is provably
setting-independent — an argument for it that was not available when it was written.

**And the caveat 137 left is now closed, experiment 138 (S-131)** — the real verdicts, not one synthetic
pair: §2's matched-spend standing per army, what each of the five objectives answers with under both sizer
methods, and the trade gates of S-128, each re-run under all three settings.

| what was re-asked | how many answers move with the setting |
|---|---|
| §2's verdict, per army | **3 of 17** |
| an objective's answer (army × method × objective) | **34 of 170** — and *all 34 are `damage per gold`* |
| a trade gate's verdict (army × strategy) | **0 of 68** |

**Four of the five objectives are setting-stable on every army.** `average damage`, `best worst case`,
`damage per silver` and `damage per dragon coin` answer with the identical shape under `retrain`, `revive`
and `selective · monsters`. That is the finding W9 was waiting on: **the troopless defect §5.9 is about is
not a property of a setting**, so the floor does not have to be stated per setting — and, being a rule about
*which unit types* a selection fields rather than about what they cost, it reads none of the three moving
columns at all.

**`damage per gold` is the one objective the setting owns**, and it owns it completely: 34 of 34. Under
`revive` it collapses to a troopless march on 15 of the 17 armies (`0t/1` or `0t/3`), where under `retrain`
and under the app's own default it fields troops everywhere. Nothing had seen this, because no run had ever
varied the mode. It is the same defect as `damage per silver`'s, on a larger population, and the same floor
answers both.

**The three armies whose §2 verdict moves, and the marker that moved it** (§D of the experiment, their
hardest row against the cheapest our stops come in at):

| army | setting | it turns on | theirs | ours |
|---|---|---|---:|---:|
| monster tiers 3–5 at 900 dominance | `retrain` **beat +22.2 %** → `selective` **no stop fits** | **gold** | 4,072 | **9,424** |
| his camp of 2026-09-19 (localStorage) | `retrain` **beat +17.7 %** → `revive` **no stop fits** | **silver** | 790,400 | **880,300** |
| his usual setup of 2026-09-19 | `beat +4.3 %` throughout; only the no-fit count moves | — | — | 4 → 2 rows |

Both obstructions are the **setting moving our side and their side by different factors**, never a march
getting worse. On the monster camp, `selective · monsters` revives the top monster type — which only *we*
field, since TotalStack answers with no monster at all — so our gold goes 1,952 → 9,424 while their 4,072
does not move, and §2's hard-zero-ish gate on a marker they barely spend closes. On his camp under `revive`
both silver bills fall about tenfold, but theirs falls 9.9× and ours 8.3×, so ours lands 6.1 % over a budget
the tolerance allows 5 % on — a near miss manufactured entirely by the setting.

**So §2's headline standing is a standing at the app's default.** At `selective · monsters` it is 5 beats,
9 short, 3 with no stop inside their budget — the figure this plan has always quoted. At **`retrain` it is
6 / 9 / 2**: the monster camp, G0's last holdout and the army §3 records as *"out on gold rather than by a
near miss"*, is a **+22.2 % beat** there. That is not a licence to re-quote the better number; it is the
measurement that says which setting the number belongs to, and that G0's residual on that army is a
recovery-plan artefact rather than a reach defect.

<details><summary>What the reverted rule bought, kept for the next attempt</summary>

`searchPriority` refuses a selection when **any other selection it evaluated has at least its damage for at
most its burn** — `STRATEGIES.stock` of `engine/trades.ts`, swept once over the field rather than compared
pairwise. That is the whole change, and it has no constant in it.

**The floor W9b specified turned out to be unnecessary**, which is the interesting part. Troops cost
leadership and **leadership is not burn** (`mercLost` is the authority pool alone, S-102), so a troopless
march is nearly always beaten by one that keeps its troops at *no extra cost in the rare resource*. Nothing
has to forbid a troopless answer when something already beats it. The benchmark's **8 troopless rows are
0**, and experiment 136 reads **0 of 85** answers beaten on stock where it read 17.

*One wrong turn worth recording*: comparing each candidate against the **whole army alone** — the obvious
cheap version — is wrong, and the benchmark caught it in one run. A candidate refused for being beaten by the
whole army is replaced by the next best *ratio*, which the refused one may itself beat: on Aydae alone,
12,671,899 at 874 chunks was refused and 8,599,955 at 871 took its place. It also left three troopless
answers standing, at 1, 0 and 0 chunks, because the whole army burns more than they do and so cannot beat
them. The field, not a reference march, is what a dominance test has to be taken over.

*What it is worth* — the defect the plan opened on:

| army · objective | before | after |
|---|---|---|
| his usual setup · Tier ladder · damage per silver | 1,436,400, **no troops**, 33 chunks | **11,780,261**, 2 troops, 33 |
| his usual setup · Troops first · damage per silver | 1,436,400, **no troops**, 33 chunks | **11,472,532**, 8 troops, **8** |
| Aydae alone · Troops first · average damage | 8,157,173, **no troops**, 874 | **23,501,117**, 1 troop, **224** |
| Aydae alone · Troops first · damage per silver | 12,929,213, 1 troop, 108 | **17,204,587**, 7 troops, **48** |

*Cost*: matched spend unmoved (five beats, no army worse). Two armies red because their **own sizer rows**
improved so far that `bestSizer` jumped and the plan's share of it fell under a pin — a rival getting better,
not a plan getting worse. Five `search.test.ts` pins move, and one of them,
*"finds the monsters-only peak that no chain of one- or two-type drops leads to"*, **asserts the very answer
the owner calls unplayable**. That test and this rule cannot both be right; which goes is his call.

</details>

**A correction, and the owner caught it** (2026-09-22). Experiment 139 reported that `Troops first · all
types` leaves **211 of 600 dominance** unspent on his own pools and this plan called it a leak. He asked
*"are you sure it's a dominance leak and not a dominance optimization? it feels you're missing something"* —
and he is right. `sizeStacks` sets `monsterCeiling = troopFloor - 1` whenever the method is `ms`
(`src/engine/stacker.ts:268-270`), so every monster stack is held **strictly below the lowest troop stack's
HP**. Filling the dominance pool would raise a monster stack over that line and make the rarest thing on the
field the enemy's first kill. The unspent 211 is the shelter binding — the rule he himself asked for on
2026-09-19 (*"fix why the monsters are not shielded in the generated stack"*) — doing exactly its job. The
Tier ladder fills the pool because it takes no such ceiling unless `monstersLast` is set
(`src/engine/stacker.ts:271`). **There is no leak here and nothing to fix**; what §A of 139 measures is a
shelter, and the section's own wording is what was wrong.

**The prefix family is not a §2 lever, and that retires a claim this plan made** (experiment 142, S-136,
2026-09-23). 139 measured that on **26 of 34** cells the best single type to drop is not the bottom of
`rankTroops`, so the sets it points at are outside the plan's prefix family by construction — and this plan
called that *"the real structural finding"*. Priced properly, it is not. 142 sweeps every prefix **with one
further type removed from inside it** — the smallest family that reaches those sets — and asks the §2
question of each: more worst-case damage for no more silver, gold, dragon coins or hired burn.

**0 of the 17 armies** have a non-prefix shape that is strictly better than the bar's best stop, at zero
tolerance. Eleven of them gain damage and **every single one buys it by spending more**. And §B: adding the
best non-prefix shape to the bar improves **no** army's matched-spend standing — not one row enters a budget
it was outside, not one more row is dominated.

139's count was over **damage alone**, and reading it as a §2 opportunity was the error. Widening the family
would buy damage the plan is right to refuse: §7's *"a different product, not a better one"*.

**One figure in it is worth keeping, and it belongs to G1 rather than here.** On the owner's live camp of
2026-09-18 — the −77.9 % army, this plan's widest deficit — `prefix 5 − rider-1` hits for **54,949,740**
against the steady max's **15,306,859**, which is **3.6×**. It is outside the stop's costs, so it is not a
§2 beat; what it says is that the damage on that army is *reachable* and the bar declines to spend for it.
That is exactly G1's diagnosis (*"the plan will not spend an unlimited stock"*) confirmed from a second
direction, and it is a question about the spend ceiling, not about which types the family reaches.

## 5.10 W10 — the bar does not offer what the plan already found (S-137/S-138, 2026-09-23)

**G0 is mostly a stop rule, not a reach problem, and that is measured.** Two experiments ran it down.

**143 — which marker refuses us, row by row.** Of the captured rows the bar fails to dominate, **22** have
no stop inside their budget and **46** we fit and simply hit less hard. The refusals are narrow: **`gold` 15
and `burned` 15**, silver 4, coins 2. **Six** are on a marker the rival spends *nothing* of, where no
tolerance can help. And **ten are within 20 %** of the budget. On the 12 000-leadership export — the worst
G0 army, six of nine rows out — the misses are **three chunks of burn** (45 against the 42 they allow) and
**27 gold** (2 984 against 2 956.8).

**Then the frontier.** That army's bar offers stops at **45 · 67 · 82** chunks, and the frontier they were
chosen from holds **476 rows at 44 or fewer** — the best burning **42** for **26 135 439**, which is *more*
damage than the silver saver's 20 864 973 at *less* burn, marked `undominated` **and** `inBand`, and offered
as nothing. The thrift end is picked by **silver**, so a plan that spends more silver for far less burn can
never be a pick however well it would fit a rival's budget.

**144 — so has the plan already reached it?** For every row no *stop* fits inside, every undominated
frontier row priced over the same horizon on the same arithmetic:

| | |
|---|---|
| rows with no stop of ours inside their budget | **22** |
| of those, rows an **undominated frontier plan does fit** | **14** |
| of those, plans that fit **and out-damage the row** | **6** |
| rows with nothing on the frontier that fits | **8** |

**Fourteen of the twenty-two are a stop rule; six are beats available with no new search at all.** All six
of the 12 000 export's no-fit rows are rescued, four as beats (+5.4 %, +5.4 %, +6.0 %, +6.0 %); his camp of
2026-09-19 as his message reads it gains two at **+31.9 %**. The counts are a **lower bound** — the frontier
was capped at 300 rows on five armies, one of which holds 1 999 undominated rows.

The remaining **8** are what W4's reach work is for, and they are now separated from the rest instead of
sharing one bucket with them.

**The implementation plan is `docs/plans/the-stops-the-bar-offers.md`** (S-139), which carries the whole
mandatory metric set — the six markers and the four ratio floors, *damage a merc* among them — because the
first version of this comparison left that one out and putting it back changed which option was free.

**What it needs is his decision, not more measurement.** The bar keeps three stops by his own instruction
(*"keep 3 spot on the slider each time"*), so this is not "offer more rows". The thrift end is currently the
**silver**-thriftiest undominated plan; the measurement says a **burn**-thriftiest one fits far more rival
budgets. Which end the slider's first stop should read — or whether it should carry both — is a product
call, and the figures above are what it should be taken on.

### 5.9b W9a — the telling (still open)

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
| 3 | ~~**W5** H3 reads gold + coins~~ **done 2026-09-22** | correctness vs the definition — **measured to move nothing**; G6's fix is W6, not this | none |
| 4 | **W4** burn ladder capacity | −77.9 % → positive, plus the 3 G0 armies | pins move |
| 5 | **W6** order of death (S-116) | G5 + G6, the coin marker | specified already |
| 6 | **W7** flat profile | +2.9 %, probably generalises | isolated |
| 7 | **W8** single-march search | +12.5 % on the bears | isolated |
| 8 | **W3** converge the big camp | scenario 18 registrable | engine work |
| 9 | **W9b** the floor — *attempted, reverted* | 8 troopless rows; a trade rule cannot do it, a floor can | blocked on the recovery-mode study |
| 10 | **W9a** the telling | the method radio says it is inert while an objective is selected | none |

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
- **S-140 — the message camp's stale finale (open, to revisit; owner, 2026-09-23).** On his camp of
  2026-09-19 as the message reads it, S-93's `tighterShape` lowers SW's repeat from 70 to 50 hunters but keeps
  the finale sized for the old repeat. A fourth repeat is then sustained and beats the finale on every reading:
  **+10.22** against SW once re-typed, +20.69 against the top stop (experiment 166). Shipped only guarded: the
  fourth repeat is handed back wherever it leaves a stop beaten, so this camp's gap stays open. Rejected for now:
  the plain variant (SW beats MX on this camp and on his usual setup, which breaks "no stop beaten") and
  dropping the beaten rung (TotalStack at matched spend 70 → 67, usual setup 5 → 2). To revisit: a rule that keeps
  the gain without a beaten stop and without losing the matched-spend standing.
- **S-141 — a shelter margin (banked; owner, 2026-09-24: "bank the margin in the backlog for now").** At HEAD
  63 of 135 marches on the bar shelter their hired stacks within 2 % of the lowest troop stack (the narrowest
  0.01 %), where a rounding or a stray bonus in game could flip which stack the enemy wipes first. Experiment 173
  (`tools/theorycraft/out/173-a-shelter-margin.md`) measured a configurable margin, `CAMPAIGN.shelterMargin`, with no UI:
  | margin | stops better / equal / worse | readings worse | TotalStack dominated | marches under 2 % |
  |---|---|---|---|---|
  | 1 % | 10 / 30 / 19 | 27 | 72/13 | 51 |
  | 2 % | 12 / 19 / 26 | 34 | 71/13 | 0 |
  | 5 % | 14 / 15 / 25 | 35 | 63/11 | 0 |
  At 2 % the live camp's steady max holds (49.19M → 48.63M) but its sweet spot falls 15.86M → 12.19M (−23 %), the
  evening bar goes 5 → 3 stops, and the 7 000 all-in drops. The owner judged 2 % fair and asked for a cheaper one.
  To revisit: why the sweet spot loses 23 % (a rung dropping out?), and whether sizing the troops up instead of
  the hired down keeps the damage. The engine change, margin 0 byte-identical to the bar, is kept as
  `docs/research/patches/s141-shelter-margin.patch` (applies to e1ded8e, 2026-09-24; the criteria rivals and
  the resize test must read the margin too). Meanwhile the March panel shows a faint warning on a thin shelter.
