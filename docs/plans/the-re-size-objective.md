# What a March edit answers with — implementation plan (S-117)

**Owner, 2026-09-20**: *"I'm not that sure any more that when removing or adding a troop — left out / put
back from the battle summary — we should not compute again the best possible outcome, checking if less
leadership buys us something."*

Measured in `tools/theorycraft/124-what-the-edit-answers-with.test.ts` →
`tools/theorycraft/out/124-what-the-edit-answers-with.md`, on four armies: the first-run army at 12 000
leadership, his live account of 2026-09-18 (20 000 · 83 EMH), the 2026-09-17 export on its own setup (four
hired types), and **the dominance account of investigation 0024** (5 600 / 2 180 / 800, four monster types,
27 hunters), which is the one where a press makes the march worse. Damage is the **worst opening**
(S-94/S-108), silver and queue are `recoveryCosts(...).plan`, burn is `hiredLost` — the three figures the bar
prints. Everything below is from that file.

**Built 2026-09-21**, in three commits — `caae039` (step 1), `35c440f` (steps 2 and 3) and this one.
Change 3 (the trades) is deliberately **not** built and is the owner's to ask for; §4 says why. What the
build measured against the plan is in §6.

## 0. What a press runs today

`removeFromFormation` / `putBackInMarch` (`src/ui/sections/march/formation.ts`) → `resizeMarch` →
`planStopAgain` (`src/ui/sections/march/generate.ts`) → `resizeMarchOver` (`src/engine/plan.ts`) through the
worker's `resize` job. It **does** recompute. Over exactly this family, at the **full** leadership pool:

- the sizer under each of its three methods, sheltered;
- the tight ladder over the same types at each of the ten `LADDER_GROWTHS`, hired stacks sheltered under it.

And it keeps the best by `beats`: **fewest unfielded, then highest damage** — silver and queue are tie-breaks
that only fire on an exact draw. Three consequences, each measured.

### A. The stop is not a candidate of its own re-size

Nothing in that family is *"the march on screen, with this one type taken out or put in, and nothing else
touched"*. So a press can only move the player to a **different** march — and the family is a strict subset
of what `planCampaign` searched to build the stop (mercenary vectors × depths × growths × a learned rung
order), so the different march can be worse.

**The press that changes no type at all** — a put-back whose type cannot be fielded, a `Put back all` over
types that do not fit — re-sizes over the stop's own troop set and still answers with something else. Of
**14 stops** across the four armies, **3 answer with less damage for no less silver**:

| army | stop | the stop | the same types, re-sized | damage | silver |
|---|---|---|---|---|---|
| the live account | sweet-spot | 7 096 072 · 7 732 100 · 6 | 6 276 619 · 7 809 000 · 7 | **88.5 %** | 101 % |
| the live account | steady-max | 7 354 938 · 7 732 100 · 7 | 6 276 619 · 7 809 000 · 7 | **85.3 %** | 101 % |
| 0024's account | steady-max | 5 763 382 · 2 449 200 · 3 | 5 143 823 · 2 498 200 · 3 | **89.3 %** | 102 % |

The last row **is** investigation 0024 §5 to the unit — 5 143 823 for 2 498 200 — reproduced here from an
independent rebuild of his account, which is the cross-check that the two measurements are of the same thing.
On his live account the press costs **14.7 % of the damage for 1 % more silver**. Nothing was asked for and
nothing was gained.

On the **33 real edits** (every stop, lowest fielded type out · highest fielded type out · one type back), the
churn usually does buy damage — the freed leadership is real — so the untouched march wins outright on only
**1** of the 33. But the direction is one-way: **18 of 33 answers cost more silver than the stop they edited
and 21 take longer to recover.** Taking ARC1 out of the export's *silver saver* answers with 196.8 % of the
damage of that same march with ARC1 simply dropped, for 177 % of its silver and **15 hired burnt against
6**. The thrift stop is not thrifty any more, and the player pressed one pill.

The reason is §E: the re-size is handed a hired budget that is not the stop's. A mercenary is capped at
`largestSustained(stock, repeats)` and a monster at its **whole pool**, so on the export's silver saver the
hunter's ceiling is **118 where the stop fields 20 — 5.9×** — and on 0024's account each of the four monster
types reads the whole 800 dominance, **5–6.3×** what the stop fields and the pool over-subscribed four times
over. That is S-107 and S-102 working exactly as specified; what nothing specified is that the objective on
top of them is damage alone.

### B. Yes — less leadership buys something, after an edit

Experiment 119 turned the dial on every stop **as generated**: 12 stops × 10 fills, **0 dominations**, and
S-115 was retired on it. It never turned the dial on a march the player had **edited**, which is a different
type set, a different floor and a different kill order. Turned there — 33 edits × 11 lower fills, **363
marches** — it gives **14 dominations**: at least the damage, no more silver, no more burn, and strictly
better on one of them.

| army | stop · edit | fill | damage | silver | queue | burn |
|---|---|---|---|---|---|---|
| the 2026-09-17 export | take out SP2 (all four stops) | **96 %** | 5 097 182 (**+2.2 %**) | 2 549 200 (−4 %) | −4.1 % | 15 = 15 |
| 0024's account | sweet-spot · take out SP2 | **90 %** | 5 255 703 (**+2.2 %**) | 2 257 200 (−9.6 %) | −9.3 % | 3 = 3 |
| 0024's account | steady-max · take out RD3 | **90 %** | 3 883 970 (**+0 %**) | 2 123 400 (−8.9 %) | −7.3 % | 3 = 3 |

The third row is the plainest: on that march the **last tenth of the leadership buys literally nothing** —
identical damage at 100 % and at 90 % — and is paid for with 207 600 silver and 41 070 seconds of queue. The
first two gain damage *because* the pool shrank: a smaller troop stack moves the kill order, and the hired
stacks that turn HP into damage best strike more (which is S-116's arithmetic seen from the other side).

Beside the 14 dominations, **26** of the 363 fills pass the owner's own put-back exchange rate
(`CAMPAIGN.putBack`: `silver-saved % / 5 + queue-saved % / 10 + damage change %`, taken when it recovers
faster, scores ≥ 0 and loses at most 3 %). Those are **trades**, not wins — up to −2.8 % of the damage for
−23.4 % of the silver — and §4 says what to do with them, which is not the same thing.

### C. Re-ranking the candidates alone is measured dead

The ladder growth list is itself a leadership dial (`ladder()` tests only `used <= leadership`), so small
marches are already on the table at the full pool and `beats` discards them. Re-ranking them under the
put-back rule was the cheapest conceivable fix, and it is worth nothing here: the three sizer methods answer
with the **identical march on all 33 edits** on every army measured, and **0 of 33** of those runners-up score
better than the shape the chooser takes. The ladder's own steps are too coarse to be the answer either — on
the live account the next growth down is **−10.6 % damage**. **Every one of the 14 dominations is the sizer
at a smaller pool**, which is a candidate that does not exist today.

### D. It costs nothing to look

One `resizeMarchOver` is **0.2–0.28 ms** on all four armies. A twelve-fill dial is **≈ 3 ms**, off the main
thread, in a job that has no budget because it has never needed one.

## 1. What to build

Three changes, all inside `resizeMarchOver`, in this order.

**1. The stop is a candidate of its own re-size.** `MarchWithin` gains the stop's own counts, and the
candidate list gains one more march built from them: the stop's counts with the edit applied — the taken-out
type dropped, or the put-back type sized into the leadership the stop left unused — and every hired stack
re-sheltered (`shelterCounts`, which lowers and never raises, so nothing else moves). It is then a candidate
like any other, and **`beats` is not touched**.

**Adding it is the whole fix, and the reason is arithmetic.** A first draft of this plan had the untouched
march also *win ties outright* — refuse any answer it was not dominated by. That rule is wrong: on the
export's silver saver the churned answer is 196.8 % of the untouched march's damage for 177 % of its silver,
which the untouched march does not dominate and must not beat, and the rule would have thrown away the
damage the freed leadership genuinely buys. It is also unnecessary. In **all four** cases where today's
answer is worse than the march it replaced — the three no-op presses and the one edit of §A — the untouched
march has **more damage**: 7 096 072 · 7 354 938 · 5 763 382 · 4 546 337 against 6 276 619 · 6 276 619 ·
5 143 823 · 3 883 970. Damage-first `beats` therefore picks it the moment it is in the list. The stop's march
never lost on the objective; it lost by not being on the table.

*Fixes:* the three no-op presses and the one dominated edit of §A. *Cannot break:* S-107's own test
(`hunters 450`, 38 → 72) keeps its answer, because the untouched candidate there carries 38 hunters and less
damage and loses on damage exactly as it should.

**2. The dial: the same shapes at lower fills, dominations only.** The shape loop runs at each fill of a
short list (`[100, 98, 96, 94, 92, 90]` is enough to catch all 14 — every domination measured is at one of
those five lower fills, and none was ever found below 90 %), and a lower fill is taken **only when it
dominates** the full-pool answer: at least its damage, no more silver, no more burn. **The count of 14 is
measured against today's answer and has to be re-measured after change 1**, which raises the full-pool answer
on four of the 33 edits and can only lower the yield; experiment 124 is re-run between the two steps for
exactly that reason. No new control, no new stop, nothing for the player to
decide — this is the *"just take the wins"* half of the owner's own question of 2026-09-20, which 119 could
not answer on a stop and can be answered here.

*Cost:* ≈ 3 ms a press. *Yield:* 14 of 363, up to +2.2 % damage for −9.6 % silver at identical burn.

**3. The trades, behind the policy that already exists.** The 26 put-back-rule fills are `CAMPAIGN.putBack`'s
business: the rates are already in the config, the plan already applies them silently at Generate time
(`putBackOn`), and the re-size is the one path that does not. Taking them is **consistent**; it is also a
trade nobody asked for, and 119's objection to swapping trades in silently still stands. So: the re-size
reads the same policy, and when it takes a trade **it says so in the line it already writes**
(`resizeWords`, `src/ui/sections/march/rows.ts`) — *"…and re-sized to 96 % of your leadership: 2.2 % less
damage for 8 % less silver and 10 % less queue."* That line exists precisely to say what the edit did.

**Not in scope, and measured so:** re-ranking the existing candidates under the put-back rule (§C, 0 of 33),
and re-planning the campaign on a pill press — the horizon, the finale and the bar stay the plan's, which is
S-104's *"without clicking Generate"* and is not in question.

## 2. Where it goes

- `resizeMarchOver` (`src/engine/plan.ts`) — all three changes. It is the one function a March edit on a plan
  runs, and it is reached from exactly one place in the app.
- `MarchWithin` gains `stop?: Record<string, number>` (the stop's own counts) and `fills?: readonly number[]`;
  `planStopAgain` (`src/ui/sections/march/generate.ts`) fills them from `pickOf(plan, planPick).counts`, which
  it already reads for `inStop`.
- `ResizedMarch` gains the fill it was sized at, so `resizeWords` can say it.
- `resizeWords` (`src/ui/sections/march/rows.ts`) gains the clause, under change 3 only.
- **A March edit on a sizer run** (`sizedAgain`, Elite / Military Science) is untouched: it is the sizer's own
  answer to the sizer's own question, and `sizeStacks` keeps its TotalStack parity.

## 3. The benchmark plan

The rule (owner, 2026-09-19): *"the benchmark is like non-regression tests. A given scenario should not be
worse, or it's a discrepancy, or a new baseline needs to be registered by me if the trade is ok."*

**The good news, and it is checkable in one command.** `resizeMarchOver` is called from
`src/worker/jobs.ts:45` and from nowhere else in `src/`, and among the tests only
`tests/engine/plan-resize.test.ts` reaches it — `grep -rn resizeMarchOver src tests`. **`planCampaign` never
calls it**, so no stop, no bar, no campaign figure and **no benchmark baseline can move**. This story is the
rare one whose blast radius is a single function behind a single worker message.

**Step 1 — the gate.** `pnpm vitest run tests/engine` on the same pre-existing failures it starts on, and the
regenerated `tools/theorycraft/out/benchmark-latest.json` **byte-identical on every leaf but `run` and
`planMs`**. Any leaf that moves means `resizeMarchOver` was reached from somewhere this plan did not find,
and that is the finding, not a number to re-register.

**Step 2 — what does move, and must be re-pinned with its reason.** `tests/engine/plan-resize.test.ts` is 24
tests, 36 s, all green today, and it pins **exact counts**: `hunters 450` at 38 → **72** and the TotalStack
profile at 49 → **62** after a take-out, with the ceiling arithmetic asserted to the unit. Change 2 can move
those, because a dominating fill fields a different march. Each moved pin is re-stated **with the fill it now
answers at and the three figures that made it dominate** — a pin that moves without a domination behind it is
a bug in the dial, not a new baseline.

**Step 3 — the three promises the file already holds stay held**, at every fill: every hired stack strictly
under the lowest troop stack, no hired count above the cap it was given, and every troop type asked for
fielded or named in `unfielded`. They are properties, not numbers, so they are asserted across the fill list
rather than re-pinned.

**Step 4 — two regression tests of this story's own**, both from §A, both currently failing:

- the live account's steady max, re-sized over **its own troop set**, must not come back at 85.3 % of its
  damage for more silver;
- 0024's account, same press, must not come back at 5 143 823 for 2 498 200 against 5 763 382 for 2 449 200.

**Step 5 — cost.** ≈ 3 ms a press, measured. The `resize` worker message has no budget and needs none, but
the figure goes in the commit so the next change to the fill list has something to be worse than.

## 4. The order, and the recommendation

**Do 1 and 2 as one story; hold 3 for the owner.**

**1 has no downside to weigh.** It cannot lower a figure — a candidate that only ever wins when it dominates
is monotone — it fixes a −14.7 % regression that fires on a press the player did not think of as a change at
all, and it closes investigation 0024 §5 and its proposal D at the same time.

**2 is a win and not a trade, which is the whole reason it is worth building here when it was not worth
building on a stop.** 119 retired the dial because on a generated stop it only ever traded damage for silver,
and no one can make that trade on the player's behalf. After an edit it **dominates** — the same damage or
more, for less silver, at identical burn — on 14 of 363. A win needs no control, no stop and no explanation.
It is also the direct answer to his question: *yes*, less leadership buys something, but only after an edit,
and only where it costs nothing to take.

**3 is his to decide**, because it is the one part that spends damage he did not agree to spend on that
press. The rates are already his (`CAMPAIGN.putBack`) and the plan already applies them; extending them to
the re-size is consistent, and the 26 fills are worth up to 23.4 % of the silver. It is a one-line config
reading and a clause in a sentence once 1 and 2 are in, so nothing is lost by holding it.

**What not to do, with the measurement behind it:** re-rank the candidates without adding the dial (§C: 0 of
33), and re-plan the campaign on a pill press (S-104).

## 5. What this does not say

It does not say the dial should ever be a control on the bar — 119 measured that and the answer stands for
stops. It does not measure the fill list below 50 % or between the grid's points, so *"14 of 363"* is a count
on one grid and a lower bound on what a finer one would find. It does not touch what the edit is **allowed to
spend** (§E, the 5.9× and the 6.3×): S-107 and S-102 both have their reasons and re-opening them is a
separate story with real benchmark risk, where this one has none. And every figure is the worst opening
against each account's own fixed enemy formation; nothing here measures a different enemy.

## 6. What the build measured, against what the plan predicted

| | the plan said | the build measured |
|---|---|---|
| no-op presses that lose damage | 3 of 14 → 0 | **3 → 0**, and a fourth (the live all-in, 90.6 %) came back to 100 % as well |
| the one dominated edit | fixed | **3 883 970 → 4 546 337, +17.1 %** |
| edits where churn should still win | untouched | untouched — the live silver saver still answers at 169.9 %, the export's at 166.6 % |
| the dial's yield after change 1 | "can only lower the yield" | **14 → 9** dominations on the four armies |
| what the shipped list takes | — | **5 of 33** edits on the four armies, **9 of 102** on the benchmark corpus |
| cost of the dial | ≈ 3 ms | **+0.83 to +1.18 ms** (5 fills shipped, not 12) |
| benchmark baselines moved | none | **none** — 18 leaves moved and every one is `run` or `planMs` |
| `plan-resize.test.ts` pins re-pinned | 38 → 72 and 49 → 62 expected to move | **neither moved**; 24/24 held and two tests were added |

**Two things the plan got wrong, both caught before they shipped.** §1's first draft had the untouched
march *win ties outright*, which would have refused the export's 196.8 %-damage answer; adding the
candidate is the whole fix, because in every case where the old answer was worse the untouched march has
more damage. And §3 step 2 expected the pinned counts to move: they did not, because the dial only ever
takes a march that dominates, and on those two camps nothing did.

**One thing the plan under-measured.** It sized the defect on four armies. On the benchmark corpus the
family falls short of the stop on **13 of 53** stops, worst **−22.9 %** — the 900-dominance camp answering
19 882 698 where its own stop deals 25 783 940. The regression test asserts that count is not zero, so a
future change that makes the contract vacuous fails rather than passes quietly.

**Driven in the real browser**, on 0024's account rebuilt from `localStorage` at 1 512 px: the plan draws
its sweet spot at **5 698 946** with EMH 17 · ED 19 · WE 44 · SG 16 · BB 21, which is experiment 124's §E
to the unit; taking Spearman II out answers **5 255 703 for 2 257 200 silver** — the predicted dialled
march — the pool bar reads **5 040 of 5 600 leadership**, the pane writes *"It fields 90 % of your
leadership: the rest bought no damage and cost silver."*, and the console is clean.
