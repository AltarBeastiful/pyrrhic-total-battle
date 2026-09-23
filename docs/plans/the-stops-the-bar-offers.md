# The stops the bar offers — implementation plan (W10)

**Status (2026-09-23): the hired saver and the fold are shipped — `burnSaver: 'silver', foldTo: 5` (§10).**
The guard of §9 was the first step and is superseded. One trade is owed to the owner (§10.4).

This plan exists because a comparison went out with a mandatory metric missing from it. The owner:
*"you're still missing one of the mandatory metric merc spent."* He was right — every table in the thread
that produced this plan read *damage a silver* and left *damage a merc* out, and when it was put back it
**changed which option was free and which one cost something**. So this document leads with the metric set
and refuses to state a result that does not carry all of it.

---

## 0. The finding, in one paragraph

The bar picks its stops off a frontier it has already computed, and it picks them **along silver**. Measured
over every captured TotalStack row on all seventeen benchmark armies (experiment 144): of the **22** rows no
stop of ours fits inside, **14** have an *undominated, in-band* plan on that same frontier that **does** fit,
and **6** of those out-damage the row outright. The plan found the answer; the bar never offered it. That
makes this a **pick rule**, not a search — which is the cheapest kind of gap there is.

---

## 1. The mandatory metric set

**Every table this workstream produces prints all of these. A result stated on a subset is not a result.**

| # | marker | direction | where it comes from |
|---|---|---|---|
| 1 | damage — the **worst opening** | max | `BattleScore.minDamage` (S-94, S-134) |
| 2 | silver | min | `recovery.silver` |
| 3 | **hired burned** (authority chunks of ten) | min | `chunks(count)` over `pool === 'authority'` (S-102) |
| 4 | gold | min | `recovery.gold` |
| 5 | dragon coins | min | `recovery.dragonCoins` |
| 6 | training queue, seconds | min · reported, not gated | `recovery.seconds` |

And the four **derived ratio floors**, which are the form the owner's goal is actually stated in
(*"at least the same as TotalStack full opt in silver/dmg, merc/dmg and monster/dmg"*):

| ratio | numerator | note |
|---|---|---|
| damage a silver | worst-opening damage | |
| **damage a merc** | the **hired stacks' own** damage (`hiredDamage`) | the one that was missing; S-105 fixed its numerator |
| damage a monster / a dragon coin | see `plan-yardsticks.ts` | `isMonsterUnit` decides which stock is which |
| damage a gold | worst-opening damage | setting-dependent — see §7 |

**Two of these do not move with the recovery setting and five of them do** (experiment 137): dragon coins
and the hired burn are a property of the march alone; silver ÷5.7–7.6, gold ×34–61 and the queue ÷4.3–5.4
between `retrain` and `revive`. Any figure in this plan is **at the app's own default**
(`{ mode: 'selective', reviveFamilies: ['monsters'] }`) unless it says otherwise.

---

## 2. What is measured, and what it says

Experiment 145, over every captured row on every army. "Floors down" counts armies where that rule reads
**worse than the bar does today** on *any* of the seven readings above.

| rule | rows dominated | rows no stop fits | floors down |
|---|---:|---:|---|
| the bar as it stands | 45 | 22 | — |
| **A** — re-axis all three stops onto the burn | 24 | 14 | **13 damage · 8 damage a merc** |
| **B** — keep today's stops, **add the lowest-burn** undominated in-band plan | **47** | **13** | **none** |
| **C** — keep today's stops, **add the best damage-a-silver** undominated plan | 47 | 20 | none |
| **B-swap** — B at three stops, `more-mercs` dropped | **47** | **13** | **1 — damage a merc** |

**A was this plan's own first proposal and it is dead.** It loses 21 dominated rows — one army falls from
nine to none — because the bar's present picks are already right on most armies.

**B and C open different rows**: B those refused on the **burn**, C those refused on **silver**. Neither
subsumes the other; B opens far more.

**The single cost of holding to three stops**, and the whole reason §1 exists:

> first-run army, monster tiers 3–5 at 900 dominance — **damage a merc 597,802.38 → 594,278.15** (−0.6 %)

Nothing moves on any army the owner actually plays.

---

## 3. The decision owed

**Three stops or four.** Both reach 47 dominated and 13 no-fit.

- **Four** — add `burn-saver`, keep `more-mercs`. Nothing anywhere reads worse on any of the seven markers.
- **Three** — add `burn-saver`, drop `more-mercs`. Identical §2 result; costs the −0.6 % above on one
  synthetic army.

His standing instruction is *"keep 3 spot on the slider each time"*, revised 2026-09-23 to *"keep three
spots can mean keep the three best options"*. This plan does not choose for him.

---

## 4. The change

**One new pick, one new selector, no new search.** The frontier is already computed and already filtered to
`undominated && inBand`; nothing here widens it.

| # | file | change |
|---|---|---|
| 4.1 | `src/engine/plan.ts:560` | `PlanPick` gains `'burn-saver'` |
| 4.2 | `src/engine/plan.ts:~2339` | beside `offer(first, 'silver-saver')`, offer the band's **least-`mercLost`** row as `'burn-saver'`; ties broken by higher `totalDamage`, then lower `silver`, so the pick is deterministic |
| 4.3 | `src/engine/plan.ts:~2353` | the sort stays `silver`-ascending — the bar is drawn cheapest-first and `burn-saver` takes its place in that order, it does not lead by construction |
| 4.4 | `src/engine/plan.ts:543-560` | the `PlanPick` docstring gains `burn-saver`'s sentence: *the fewest mercenaries burned the band holds* |
| 4.5 | `src/ui/sections/march/…` | the stop's label and description. **Design rule 26**: no engine noun on screen |
| 4.6 | `src/config.ts` | if three stops is chosen, the `more-mercs` suppression goes behind `CAMPAIGN.planFixes` so both bars can be built and compared |

**Deliberately not done**: no change to the band, the knee, the frontier, `shelterUnder`, the sizers or any
search. If this plan requires one, it has become a different plan.

---

## 5. Tests

| # | file | assertion |
|---|---|---|
| 5.1 | `tests/engine/plan.test.ts` | `burn-saver` exists on an army whose band holds more than one burn level, and its `mercLost` is the minimum over the band |
| 5.2 | `tests/engine/plan.test.ts` | it is **deterministic** under a tie — two rows at equal burn resolve by damage then silver |
| 5.3 | `tests/engine/plan.test.ts` | an army whose band is a single row offers no `burn-saver` rather than a duplicate of `silver-saver` |
| 5.4 | `tests/engine/plan-criteria.test.ts` | `burn-saver` satisfies **every criterion the other stops do** — the shelter (S-87), the token floor, no dropped stocked type |
| 5.5 | `tests/engine/plan-shape.test.ts` | it is more than a single troop stack (experiment 72's criterion) |
| 5.6 | **new** `tests/engine/plan-stops.test.ts` | the **seven readings of §1** on every benchmark army: the bar's best after the change is `>=` the bar's best before, marker by marker. This is the regression test the missing metric would have caught |

5.6 is the one that matters. It is written **before** the engine change, run against today's engine to prove
it passes, then run after.

---

## 6. Non-regression protocol

1. `npx vitest run tests/engine/plan.test.ts tests/engine/plan-criteria.test.ts tests/engine/plan-shape.test.ts` — expect the **6** pre-existing reds (5 in `plan-criteria`, 1 in `plan-shape`) and no others.
2. Full suite — expect **13 failed / 527 passed**, the pre-existing set, and no new file failing.
3. `npx vitest run tests/engine/plan-benchmark.test.ts` — expect the **7** pre-existing reds.
4. `git diff tools/theorycraft/out/benchmark-latest.json` — every non-timing change enumerated in the commit message, none unexplained.
5. Re-run experiment 145 — the shipped rule must reproduce **47 / 13** and its floors-down row.

**No pin is re-based by me.** Where a pin moves, the commit states the old and new figure and the owner
registers it (`feedback-benchmark-non-regression`).

---

## 7. Risks, and what is *not* established

- **The 145 figures are at one recovery setting.** Gold and silver both move with it by factors of 5–60
  (§1), and `burn-saver` is picked on the burn — one of the two setting-independent markers — so the *pick*
  should be stable while the *rows it opens* may not be. **Unmeasured.** Cheapest check: re-run 145 under
  `retrain` and `revive`, as experiment 138 did for §2.
- **144's 14 is a lower bound.** The frontier was capped at 300 priced rows on five armies, one of which
  holds 1,999 undominated rows. B reaching 13 of 22 may not be the ceiling.
- **The remaining 8 rows** have nothing on the frontier that fits. They are W4's reach problem and are
  explicitly **out of scope here**.
- **A fifth stop is a UI question this plan cannot answer.** Four rows on the slider is already the most the
  bar has drawn; whether it reads well is the owner's and the design rules' call, not a measurement.
- **`more-mercs` was not shown to be useless**, only to be the stop earning its place least on the armies
  measured. If three is chosen, that is a judgement, and this plan says so rather than dressing it as a
  result.

---

## 8. Order

1. Owner decides three or four (§3).
2. Write 5.6, run it green against today's engine.
3. Implement §4.
4. §6, every step.
5. Re-run 138's sweep over the three recovery settings against the new bar (§7's first risk).
6. Commit with every moved figure named; the owner registers the pins.

---

## 9. Validation, and what shipped (2026-09-23)

Experiment 146 (`tools/theorycraft/146-the-hired-saver-shipped.test.ts`) runs **`planCampaign` itself** with
and without the stop — 145 priced a raw frontier row beside the bar, and never saw the put-back pass, the
burn walk, the second dedupe, the tail or the `all-in` drop that the engine applies to every stop.

### 9.1 Four corrections to this plan

1. **§4.1–4.3 point at the wrong bar.** `plan.ts:~2339` is the **troops-only** bar, where no stop burns
   anything; the stops 145 measured are on the hired bar (`plan.ts:~4880`), which is sorted on the **burn**,
   not the silver. The change is there.
2. **§4.2's tie-break is not 145's rule, and it is worse.** Ties at one burn broken on damage read
   **45 / 16**; broken on silver (the band's own order, what 145 did) **47 / 13**. Shipped: silver.
3. **The stop breaks S-61 on three armies** (5.4 was not true as written). The fewest-burn plan can hit harder
   than a stop to its right: on the owner's live account it hits **5 478 162 at 1 burned**, the silver saver
   **3 694 764 at 4** — for half the silver, so neither beats the other and the burn-ordered bar cannot hold
   both. On Bear V ×10 it shares the sweet spot's burn.
4. **"Four rows is the most the bar has drawn" (§7) is not so**: the hired bar already carries up to five,
   and with the stop two armies reach **six** (the 7 000 export, the evening account).

### 9.2 The four rules, measured on the engine (all seven markers, three recovery settings)

| rule | default | retrain | revive | floors down | S-61 breaks |
|---|---|---|---|---|---|
| today | 45 / 22 | 47 / 20 | 45 / 20 | — | — |
| offer everywhere (`silver`) | 47 / 13 | 49 / 11 | 49 / 11 | none | 3 armies |
| same, damage tie (`damage`) | 45 / 16 | 47 / 14 | 47 / 14 | none | 4 armies |
| **withhold where it breaks the order (`guard`) — shipped** | **47 / 17** | **49 / 15** | **49 / 15** | **none** | **none** |
| fold the stops it out-hits (`fold`) | 47 / 13 | 49 / 11 | 49 / 11 | least silver, damage a silver/gold on 3 | none |

(rows dominated / rows no stop fits.) `guard` is the only rule that is a pure gain on every marker, every
setting and every criterion. No other stop moves on any army (`tests/engine/plan-stops.test.ts` asserts it).

### 9.3 The decision still owed

The four rows `guard` leaves unfitted and `silver` would open are the 12 000 export's — where the stop and the
silver saver are a **silver-against-burn trade** the burn-ordered bar cannot draw. Opening them needs either
S-61 relaxed for the thrift pair (as it already is for the `all-in`), or the fold of the next step choosing
between them. That is the owner's call, not a measurement.

### 9.4 Pins that moved (not re-based — the owner registers them)

`plan-benchmark` "stops on the bar", +1 on: Epic Monster Hunter ×83 (3 → 4), Aydae alone 4 975 (3 → 4),
evening account (5 → 6), live camp 09-18 (4 → 5), his camp as his message reads it (4 → 5), his camp
localStorage (4 → 5), his usual setup (2 → 3), and on two already-red armies (monster tiers 4 → 5, 7 000
export 5 → 6). `plan-criteria` "at his setup (7 000)" — already red on a ratio floor — now stops earlier, on
`expectCriteria`'s **≤ 5 stops**. No damage or ratio assertion moved. Suite: 18 failed / 1 129 passed, against
13 / 1 134 before; the five new reds are all stop-count pins.

### 9.5 Next: the fold

The owner, 2026-09-23: *"we should try to fold uninteresting stops … as long as we spend all the time possible
to find the best solutions, they can be filtered in the end to retain the three best ones."* So the search and
the stop rules keep offering everything; a final pass keeps the three best. It has to be measured the way 146
is — all seven markers, matched spend, the criteria — and 145's B-swap already shows the price of dropping a
stop is real (damage a merc −0.6 % on one army).

---

## 10. The fold, shipped (2026-09-23)

The owner, on 147 and 148: *"lets keep four spots … which should keep the sweet spot while ensuring we beat
everything … Can't we compute that before answering … I still think we need a low silver one that's actually
one. Is there really no way to keep the bar ordered?"*, then *"ok allow 5 stops and lets build from here"*.

### 10.1 What was measured before building

- **147** — every set of three stops, on ten readings (most damage; least silver, burn, gold, coins, training
  queue; damage a silver, a merc, a gold, a coin): 12 of 17 armies have a lossless three, but the lossless
  three often breaks the order or drops the sweet spot.
- **148** — the stops **and the whole band**, searched exhaustively under the owner's rules (order, a real
  low-silver stop within 5 %, the sweet spot unless it holds nothing alone, every TotalStack row still beaten
  and fitted). At four stops 16 of 17 pass and 13 lose nothing; **at five, 16 pass and 15 lose nothing**, and
  keeping the sweet spot always cost nothing. The band holds better savers: on the 12 000 export plan b·48
  costs the same 12,129,500 silver as the silver saver and hits harder, and burns just enough to stand right
  of the hired saver — the bar becomes ordered and loses nothing.
- **The one army that cannot be ordered**: the owner's live account of 2026-09-18. All four plans burning less
  than the silver saver's 4 a march hit 5.48M–6.13M against its 3.69M. There the order wins and the bar is
  the guard's.

### 10.2 The rule (`CampaignInput.foldTo`, `plan.ts`)

The bar is chosen **as a whole** at the end, over the stops and the band, to at most five: the order first
(S-61), the sweet spot second, then a real low-silver stop, then the fewest of the ten readings lost, then the
least in sum, then the fuller bar. A band plan enters **only by taking a saver's role truthfully** — the
silver saver as the bar's cheapest, the hired saver as its fewest burned. The engine cannot see TotalStack;
149 checks that the rule keeps what 148 could see.

### 10.3 Measured on the engine (149, against the guard of 54c7e3d)

No army reads worse on any of the ten readings; no criterion broken (order, S-93, ≤ 5, sweet spot, one name
each, two troop stacks); TotalStack rows **47 dominated, no stop fits 17 → 13** (148's own best); the two
six-stop bars fold to five by dropping more mercs; the fold adds at most 60 ms to a plan. The 12 000 export
gains the hired saver: fewest burned 45 → 30, least gold 2,984 → 2,408, damage a silver 1.720 → 1.754, damage
a merc 333,911 → 369,197, damage a gold 6,992 → 9,003.

### 10.4 The trade owed to the owner — the 7 000 export

The ten readings cannot see one thing the benchmark pins: **how far the bar's best stop inside TotalStack's
hardest march out-hits it**. On the 7 000 export that march is 13,742,586 for 3,472 gold and 51 burned; more
mercs fits inside it (3,536 gold, 47 burned, within 5 %) and hits **21,363,106, +55.5 %**; the steady max
does not (4,000 gold, 55 burned). Folding to five drops more mercs — it holds none of the ten readings alone —
and the best stop inside that budget becomes the sweet spot, **18,796,348, +36.8 %**. The pin (≥ 55.45 %)
is red and **not re-based**. The three ways out:

| on the 7 000 export | hardest-march margin | fewest burned | least gold | damage a gold |
|---|---:|---:|---:|---:|
| five stops, more mercs folded (shipped) | +36.8 % | 26 | 2,112 | 7,140 |
| five stops, hired saver folded (the bar before W10) | +55.5 % | 32 | 2,544 | 6,810 |
| six stops | +55.5 % | 26 | 2,112 | 7,140 |

### 10.5 Pins moved (not re-based)

`plan-benchmark` "stops on the bar" (pinned → now): Epic Monster Hunter ×83 3 → 4, Aydae 4 975 3 → 4, the owner's live camp
4 → 5, his usual setup 2 → 3; on already-red armies the 12 000 export 5 → 4, the 7 000 export 4 → 5, his camp
as his message reads it 4 → 5, his localStorage camp 4 → 5. `plan-benchmark` 7 000 export: the hardest-march
margin above. `plan-benchmark` 12 000 export: "the plan's best a hired beats the sizers" turns **green**.
`plan-criteria` at 12 000 (already red): the silver saver's damage a hired 302,304 → 287,777 against a floor of
645,213 — the silver saver there is now band plan b·48. Suite: 17 failed / 1 148 passed, against 13 / 1 134
before W10.
