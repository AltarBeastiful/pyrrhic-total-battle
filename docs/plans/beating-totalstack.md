# Beating TotalStack on every marker — implementation plan (S-119)

**Owner, 2026-09-21**: *"write a plan to beat total stack everywhere … this should also include fixing the
no leadership at all on some cases."* → *"beat means using constrained resources to produce better damage
with a fixed silver/merc/gold/dragon coins set. So we can derive its being more efficient in the markers
related. verify we're using the proper heuristics or change them."* → **2026-09-22**: *"write the full plan
to improve our algorithm against all markers with totalstack as a benchmark minimum goal."*

Every figure below is measured, from the benchmark committed in `847ce14`
(`tools/theorycraft/out/benchmark-latest.{md,json}` — seventeen armies, 227 rows of our own algorithms since
S-118, all seventeen carrying captured TotalStack rows since the capture of 2026-09-22). Nothing is recalled.

---

## 0. The objective, and what "minimum" means

**TotalStack is the floor, not the target.** The target is his own standing objective — *"best damage over a
campaign using my constrained resources"*. TotalStack is how we know we are not fooling ourselves: an army
where a public calculator does better is an army where our answer is provably improvable.

**The test is dominance at matched spend.**

> Take any march TotalStack answers with. Read its costs. **We beat it when the bar offers a stop that
> spends no more of any of them — within 5 % — and deals more damage.**

Every marker ratio follows by construction: more damage at no more cost makes `damage / silver`,
`damage / soldier`, `damage / monster` and `damage / dragon coin` each at least theirs. His *"all four ≥ 1.0
everywhere"* is the **derived reading**, not a second target. The per-reading best stop stays, because a stop
that dominates dominates on all of them at once.

**5 % is the tolerance he set** (*"ok to exceed within reasonable bounds"*), and it is not load-bearing:
swept over the payload the verdict moves 3 → 4 → 4 → 5 → 5 beats at 0/5/10/20/50 %. **Loosening it does not
rescue us**, which is how we know every gap below is real rather than an artefact of a strict gate.

---

## 1. The markers, and where we stand on each

Six resources decide a march. Each row is **our best stop against their best captured row on that marker
alone**, over the seventeen armies.

| marker | direction | we win | tie | **we lose** |
|---|---|---|---|---|
| damage | max | 9 | 0 | **8** |
| silver | min | 14 | 0 | 3 |
| hired burned | min | 6 | 4 | **7** |
| revive gold | min | 7 | 3 | **7** |
| **dragon coins** | min | **0** | 14 | **3** |
| training queue | min | 13 | 0 | 4 |

**Dragon coins is the marker we never win.** The fourteen ties are armies that spend no coin; on **all three
that do**, we spend more than TotalStack. That is the dominance pool, and it shares a root with G5.

**Silver and queue are our strengths** (14 and 13 wins) — the plan is built to ration. **Damage, burn and
gold are roughly even**, which is the honest summary: we are not behind across the board, we are behind in
specific, diagnosable places.

Read these as *marker floors*, not as the goal: winning a marker by fielding a tiny march is not winning.
§2 is the composite that cannot be gamed that way.

---

## 2. The composite: dominance at matched spend

At the 5 % tolerance, over all seventeen armies: **we beat them on 5**, are short on 9, and on **3 no stop of
ours fits their budget at all**.

| ✓ beat | short | no stop fits |
|---|---|---|
| 7 000 export **+55.5 %** | Bear ×1, ×2 −0.2 % | monster camp, 900 dominance |
| **his usual setup +27.9 %** | e2e seed −1.3 % | 12 000 export |
| his TotalStack profile +20.7 % | 4 000 case −2.8 % | camp of 2026-09-19, message |
| camp 2026-09-19 dump +17.7 % | Bear ×10 −7.0 % | |
| live account +1.8 % | Aydae alone −9.2 % | |
| | Bear ×3 −12.5 % | |
| | live account, evening −13.9 % | |
| | **live camp 2026-09-18 −77.9 %** | |

**Known understatement**: the `optimize` route answered 403 to the terminal on 2026-09-22 (§5.2), so the
newer scenarios carry Generate rows only. "Their hardest row" is a *lower bound* on several armies and some
verdicts will get worse once the priority-search rows land. **W2 must complete before any of these numbers
is treated as final.**

---

## 3. The gaps, diagnosed

### G0 — No stop of ours is inside their budget (3 armies)

Every stop we offer spends more of at least one resource than their hardest row. We are not losing the
comparison, we are not in it. Invisible in the ratio table, where all three read as comfortable wins (1.226,
1.717, 1.297 a silver). **A coverage defect in the burn ladder, not a quality one.**

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

### G5 — Damage a monster, 0.911 on a dominance army

`his TotalStack profile`. The only ratio under the goal after S-118's pinning. **S-116 (the order of death)
is already written against this mechanism** — sheltered monster stacks ordered by rounding rather than by
damage per point of HP, measured at 8.3 % there. G5 is S-116's acceptance test, not separate work.

### G6 — Dragon coins, lost on every army that spends one (new, 2026-09-22)

§1: 0 wins, 3 losses, 14 ties. We field more monster chunks than TotalStack does for our damage on all three
dominance armies. Shares a root with G5 — which monsters, in which order, at what size — but is measured on a
different axis, so it needs its own acceptance criterion.

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

### 5.1 W1 — Make the target measurable (do first)

Matched spend becomes the benchmark's **primary reading**: a verdict column per army (their hardest
comparable row, our best stop inside their budget at 5 %, the delta), a pin per army so a regression is red,
and the six marker floors of §1 beside it. The ratio table stays as the derived reading.

*Acceptance*: every army prints a verdict; the five current beats are pinned; a run that turns a beat into a
short is red. **No engine change in W1** — it is the instrument.

### 5.2 W2 — Complete the external rows

The `optimize` route answers **403 `proRequired`** to any terminal client and **200** to the identical body
inside the page: his HAR of a 200 carries no cookie and no authorization header and `document.cookie` is
empty, so the entitlement rides on an **HttpOnly** cookie. `replay.mjs --emit=<path>` writes a console
snippet for the 120 optimize calls; run it in the page, drop the download into `docs/research/fixtures/`, add
it **last** to `DATASETS`.

*Acceptance*: every army has `priority search under Elite` and `under M's` rows; §2 re-measured. **Blocks the
honesty of every verdict in §2.**

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
| 1 | **W1** matched-spend instrument | makes everything below measurable and non-regressing | none — no engine change |
| 2 | **W2** complete external rows | honesty of every verdict | his hour, in the page |
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
- **Silver and queue** (14 and 13 marker wins) are what the plan is for; a change that buys damage by
  spending freely is a different product, not a better one.
- **The seven reds already on the benchmark** are not in this plan: four `winsHired` pins the plan now
  *beats*, and three stop counts. Pinning them is a re-base and his call.
- **No pin is re-based by a worker.** A scenario must not get worse, or it is a discrepancy, or he registers
  the trade.

---

## 8. Still open

- **May a marker be exceeded beyond 5 % when the damage plainly pays for it?** The tolerance is uniform
  today; an army where they spend 0 gold makes gold a hard gate no damage can buy past.
- **Is the training queue a marker he wants gated**, or only reported? It is our second-best marker, so
  gating it costs nothing today — but it would constrain W4, which buys damage by fielding more.
