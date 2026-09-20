# Total optimization as the one answer — implementation plan

Owner, 2026-09-20: *"the added bonus of total opti vs the ladder objective select is **insight**. A clear
table telling you the facts summed up and letting you choose easily and switch between objective with added
knowledge. In the long term we might not even need the other optimization techniques. And the slider — its
definition might be on ranked troops spent, but its **meaning**, the outcome it provides when changing it, is
based on balancing damage and constrained resource (silver, speedups, merc, dragon coin…), so even with no
merc the slider could be useful, and the table it recaps also."*

Everything here is rooted in measurement. The four experiments it stands on:

| | what it measured | file |
|---|---|---|
| 114 | what each mode decides, and what is left of them with no hired stock | `out/114-modes-without-mercs.md` |
| 115 | the troops-only optimum, by enumerating all 1 023 subsets, a hill-climb, and 635 376 brute-forced vectors | `out/115-troops-only-optimum.md` |
| 116 | which cheap search family contains that optimum | `out/116-troops-only-frontier.md` |
| 117 | the bar's stops against the Objective select's answers, on both sides of the hired line | `out/117-bar-versus-objectives.md` |

**This document was adversarially reviewed on 2026-09-20** (a subagent re-measuring every figure against the
cited file and probing `planTroopsOnly` over 270 and then 540 armies). Its findings are folded in: three
code defects it found are fixed and held by tests (§1), and every figure it marked wrong or misleading is
corrected below with the correction named, not silently edited.

## 0. The finding the plan is built on

The slider's **meaning** is the owner's sentence, and the measurements agree: every stop is a point on a
frontier of *damage against a resource that runs out*. Which resource that is depends on the army, and the
app has been assuming it is always the hired stock.

- On an army that **hires nothing**, the axis is silver (and the queue behind it). The march Generate answers
  with today is **rank 14 of 1 023 on damage** (115), and the frontier past it is real: `planTroopsOnly`
  returns **5–6** rows on the first-run army, **16** on a 19-type one and **22** on a 24-type one.
  *(Corrected: this said "22 to 34 marches wide". Those are 116's widths, and 116 pools an exhaustive
  enumeration with a family the planner does not search. The numbers above are `plan.curve.length` measured
  off the shipped planner.)*
- On a **bigger** army the Tier ladder march is not even the best *rate*: at G1–G6 · S1–S4 / 40 000 it reads
  **3.15** damage a silver where the frontier's best is **3.87** — 23 % better, 11 types instead of 24 (116).

## 1. S-111 — the plan answers for an army that hires nothing ✅ done

`planCampaign` threw *"no feasible plan for this army"* whenever nothing could be fielded that is spent for
good. It now hands that army to `planTroopsOnly`, which searches **tier windows ∪ greedy backward
elimination ∪ the whole army**, prices every shape with the app's own sizer, and returns the frontier as a
bar of stops — **one to three of them**, not always three: the review swept 270 troop-window × leadership
armies and found 60 with fewer, every G1-only army having exactly one.

**Why that family**: on the army small enough to check every one of the 1 023 subsets against, it contains
the **true optimum**, at 6 shapes priced instead of 1 023; the family the search already had — the sizer over
a prefix of `rankTroops` — reaches 91.6 % of it (91.7 % at 4 100 leadership) and 38.9 % of the best found on
a 24-type army. *(Corrected: this said "on all three armies small enough"; 116 enumerates exhaustively for
**one** 10-type army at three leadership pools. The review then extended the check itself — **11 of 11 armies
at 100.0 %**, including engineers-only, G1–G3 + engineers, a tier window with a hole below it, a hand-excluded
top tier, and a tier **gap** — so the family claim survives, and the reason it works is now stated: on every
army measured the optimum was a **contiguous tier window**.)*

**One sizing where the hired search crosses three**: `sizedShape` is asked for `elite` only, because 114 §A
measured `elite`, `ms` and `msRelaxed` producing identical counts to the unit on a hired-free army — the
ceilings that separate them are written on pools that are empty here.

**Held by** `tests/engine/plan-troops-only.test.ts`, nine tests. The contract one enumerates every subset at
three leadership pools and asserts the dearest stop **is** the true optimum (`toBe`, not "close to").

**Three defects the review found, fixed and each held by a test:**

1. **The gate was not the condition it claimed.** It read `stock > 0`, so an army holding a bear with **no
   authority housing** — stock it cannot field — went down the search's path and still threw. It now asks
   for a stock **and** pool room, which is what `fitsHousing` requires of every shape the search prices.
2. **A bar too short for a knee named one row and described another.** With fewer than three stops nothing
   wore `sweet-spot`, and the plan's own totals took the dearest stop while `recommend` took the cheapest —
   so `PlanBar` painted *Sweet spot* on the row `PlanTrade` called *Silver saver*. There is one stand now,
   and it wears the word the copy uses.
3. **Exact ties survived the frontier filter**, giving the reference table two rows with one React key (28 of
   540 armies). The frontier is deduplicated where it is defined.

`march:` no longer carries an unsound cast; an army whose housing fits no march at all throws a sentence
about **housing**, and `refusalOf` no longer tells that player to go and hire mercenaries.

**Non-regression, measured**: `pnpm vitest run tests/engine` ends on the same **17** failures it began on,
467 → 476 passing. The regenerated benchmark payload differs by `run` and 17 × `planMs` and **nothing else**,
so no snapshot was written. The review independently replayed the gate over all **34** scenarios of
`plan-scenarios.ts`: none is `hiresNothing`.

## 2. S-112 — the bar and the recap speak the army's own resources ✅ done

**The defect, on screen today.** Driven on a first-run account at 12 000 leadership with Complete
optimization, the bar draws correct stops and then says, about an army that hires nothing:

| where | what it says | file |
|---|---|---|
| the thesis | *"spending **0.0 of the hired stock** and 15d 18h of training each time"* | `PlanPanel.tsx:245` |
| the bar's ends | *"Fewest hired lost"* / *"Most hired lost"* | `PlanPanel.tsx` |
| the table | a **Hired lost** column of zeroes and a **Per hired** column of dashes | `PlanTrade.tsx` |
| the campaign line | *"Fought to the end: … with **0 of the hired stock** gone"* | `PlanPanel.tsx:332` |
| the left-out line | *"a march that fields a token share of the **hired stock**"* — and it draws, `leftOut` being 2 to 19 here | `PlanPanel.tsx:360` |
| the curve table | a column headed **"A mercenary"** over zeroes | `PlanPanel.tsx:403` |
| the curve note | *"beyond that the plan is buying damage with the **hired stock** rather than with silver"* | `PlanPanel.tsx:431` |
| the bar's tip | *"0 gold a march"*, unconditional | `PlanBar.tsx:330` |
| the binding sentence | *"**Nothing binds yet**"* on an army whose leadership is filled to the unit — `bindingSentence` never reads `binding.leadership` | `PlanPanel.tsx:117` |
| the recap | a **Hired lost: 0** row | `MarchRecap.tsx` |
| the glossary | `sweet-spot` defined as *"the knee of damage against **burn**"* | `docs/design.md:476` |

*(Corrected: the first draft named six readers and called the list sufficient. The review found eleven and a
twelfth — `refusalOf` — which is fixed in S-111.)*

**The change.** Every figure needed is already on the plan; this is a reading, not a search.

1. **The axis** is the resource the stops differ on — hired lost where anything is hired, silver otherwise.
   One derived value on the plan, not a config constant.
2. **The end labels, the thesis and the campaign line** follow the axis. The hired-free thesis is short:
   nothing drains, so the trade is damage against silver and the training queue.
3. **A column draws only where it has a figure** (design rule 15) — `Hired lost` and `Per hired`. **Gold and
   dragon coins stay exactly where they are**, on the bar's tip and inside the silver cell.
   *(Corrected: the first draft said those two should become columns "when spent". They are not columns
   today, and `PlanTrade.tsx:165` records why — a seventh column measured **505 px in a 462 px pane** and was
   cut in the owner's 2026-09-16 review. Adding one would also break this story's own gate, that the hired
   bar's baselines are unchanged.)*
4. **`bindingSentence` reads `binding.leadership`**, so an army sized to the last point of its pool says so.
5. **The recap's `Hired lost` row** goes the way the dragon-coin row went in S-102: drawn when spent.
6. **`docs/design.md` §7's glossary entry** for `sweet-spot` is re-worded to the axis rather than to burn.

**Gate**: the e2e suite and the visual baselines for the hired bar unchanged; the troops-only bar carries no
word about a stock.

**Done, and measured.** All eleven readers changed, plus a twelfth the owner added while it was open: the
recap's hired line prints **damage a hired unit** instead of the share of the account's stock (his words of
2026-09-20 — *"the dmg per merc using a small notation: 265k, 1.23m… updated with each generate and troop
left out recalculation"*), on S-105's definition and S-108's opening, so it equals the bar's own *Per hired*
to the unit: `4 · 431.78K a hired unit` on the card against `431 781` on the bar. Gold and the dragon coins
stayed where they were. Driven in a browser at 1 400 px on both kinds of army — the troops-only bar carries
none of the twelve words, the hired bar carries every one. `pnpm vitest run src` 570 → 571, `tests/engine`
unchanged at 17 pre-existing failures / 476 passing, benchmark byte-identical but `run` and `planMs`,
`pnpm e2e` 51 passed.

## 3. S-113 — the insight table: the reason to choose this method

The owner's *"clear table telling you the facts summed up and letting you choose easily and switch between
objective with added knowledge"*.

**One row a stop, one column a fact**, and the objectives become *columns of the same rows* rather than a
control that re-runs a search and returns one march with nothing beside it. That is the whole of the insight:
the answer and its alternatives on one screen.

**But the table cannot simply grow, and this is the hard constraint of the story.** `docs/design.md` §7
hard-codes today's column list and §8 calls the row's damage bar *"the only addition this rule gets"*; the
seventh column was measured at 505 px in a 462 px pane and cut. So S-113 is a **layout** story before it is a
data story, and it has three honest options to measure rather than assume: a column set that changes with the
army (§2 item 3 already removes two on a troops-only bar), a second table behind a fold, or the objectives as
a **segmented control over the table** — one rate column at a time, the player switching. The third is the
closest to the owner's words (*"switch between objective"*) and costs no width at all.

Two things the measurements say the table must carry, because a player will not guess them:

- **A rate is not a ranking.** On the first-run army *Highest average damage* buys **+2.4 %** damage for
  **+72 %** silver and 3.7× the queue (114 §E) — design rule 29's trap, visible in one row.
- **The best rate and the most damage are different stops** on every army measured. The gap is **30 %** on
  the first-run army (0.56 a silver against 0.43 at the top) and **2.9 %** on the 24-type one.
  *(Corrected: the first draft illustrated "the gap is large" with the 24-type army's 3.87 against 3.76,
  which is its smallest.)*

**And one column must not be marked "best": damage a hired unit.** `docs/investigations/0019` §2.3 measured
that ratio rising monotonically with the horizon while the march collapses, and its §1 says outright that it
is *"never the right compass"*. It belongs in the table as a fact; a best-in-column mark on it would be the
trap §3 of that investigation warns about, one column over.

## 4. S-114 — the bar carries the objective corners, and the select can retire

Experiment 117 asked it: for each objective, what the priority search answers against the best stop.

| army | avg damage | worst case | a silver | a gold |
|---|---|---|---|---|
| first run, hires nothing | bar **+6.7 %** | **equal** | **equal** | *unmeasurable* |
| 2026-09-17 export, four hired types | bar **−4.0 %** | bar **−4.0 %** | bar **+12.1 %** | bar **+5.1 %** |

*(Corrected: the first draft read the hired-free gold cell as "both spend no gold". Neither march spends gold,
so the column has no denominator and the bar's "winner" there is its **weakest** march. The engine already
names this state — `isUnmeasurable` in `objectiveCompare.ts` — and the table has to say so rather than score
it.)*

**So: not yet, and the gap is structural.** On an army that hires nothing the bar already answers every
*measurable* objective at least as well. On a hired army it is **4 % short on pure damage**, which is 0019
§2.1 restated — the plan optimises a campaign, so its stops are deliberately not the best single march.
*(0019's "82.3 %" is a **ten**-march figure; this bar's horizon is `CAMPAIGN.marches` = 4, so it is the shape
of the argument that carries over, not the number.)*

**The story**: give the bar a stop for the one-march question — the priority search's own answer, scored onto
the frontier. **It is not free, and the review is right that it is not independent of S-113**: that stop has
`marches: 1` where every other row has 4, while `totalDamage` and `silver` — what the frontier filter and the
bar's ordering read — are *campaign* figures. Placed naively it lands at the cheap, low-damage end, the
opposite of the "cost be damned" end it is meant to be. So S-114 owns a decision S-113 must not pre-empt:
whether the bar compares campaigns or marches, and what a row with a different horizon means on it. It is
also the only story here that moves a benchmark baseline, which is the owner's to register.

## 5. S-115 — the leadership dial: a march that does not fill the pool

**Asked for by the owner** (2026-09-20): *"we were supposed to also explore using a bit less leadership, if
the damage is still good and the ratios are better."* Measured first, in
`docs/investigations/0023-less-leadership.md` and `tools/theorycraft/out/118-less-leadership.md`.

**What the measurement says the story is worth.** On the owner's live account, fielding **92 %** of the
leadership pool keeps **95.2 %** of the damage for **92 %** of the silver — 625,000 silver a march, at 0.89
damage a silver against 0.86. At 75 % the rate is **0.98, up 13.3 %**, for 85 % of the damage. On an army
that hires nothing the dial is exactly flat (0.56 at every fill) and buys nothing but a smaller bill.

**Why it is not a sixth stop on the bar.** Hired units lost is **9 at every fill** on the live account and 27
on the export: the dial moves silver and queue time and touches the burn axis the bar is ordered on not at
all. It is a second dimension, not a further point along the first. On the joint (damage, silver) frontier it
supplies 12 of 14 undominated marches on the live account — and the plan's own stops still hold both ends —
so the two families are complementary and the frontier wants both.

**The one thing that must not ship without its guard.** Between 75 % and 70 % the live account's hired damage
goes **2,685,730 → 0**: every troop rung shrinks below the hunters' 798,626 HP at once (the ladder sizes them
all alike), the hunters become the biggest stack on the field, and the biggest stack strikes zero times. 38 %
of the march's damage for a 6 % saving. The floor is **closed-form** — `fill ≥ hiredTop / troopFloor`, here
72.4 %, confirmed by bisection to the tenth — so the engine can compute it before it offers anything, and an
army whose hired stacks already stand above the lowest rung has no floor to fall through at all.

**The story, then**, in the order the risk sits:

1. `planTroopsOnly` and `planCampaign` gain the fill as a *second* search axis, bounded below by the floor —
   never an offer the engine knows costs the player every hired blow.
2. The stops carry which fill they field, and the block says it in the army's own words ("92 % of your
   leadership"), the way S-112 made every other line read the army it is about.
3. The floor is drawn, not hidden: *"below 72 % of your leadership your hunters stop striking"* is the single
   most useful sentence this investigation produced, and it is the kind of thing the player cannot work out
   from the screen.

**It moves a benchmark baseline** — a bar that offers cheaper marches is a bar whose scenarios change — which
is the owner's to register, and it wants S-113's table to land first: a dial with no table beside it is a
second control over the same one-row answer, which is the complaint S-113 exists to answer.

## 6. What is deliberately not in this plan

- **Changing the sizer's shape.** 115 §B measured hill-climbing past the sizer's flat HP profile gaining
  **1.4 – 4.3 %**. §C found the sizer **beating** the best vector on a grid stepped in tens (100.6 %) while
  reaching 75.8 % of the unbounded optimum — evidence that a coarse grid found nothing cheaper-and-better,
  **not** a proof of optimality at price. *(Corrected: the first draft claimed the latter.)* Either way it is
  a `sizeStacks` story with its own benchmark, not a UI change.
- **The method default.** S-110 left it open because the plan refused a first-run account; S-111 removes that
  refusal for every army that can field anything. What remains is an army whose pools are all zero — the
  literal default of a new profile — and the command bar already blocks Generate there with *"Add housing
  first"*, so the engine's refusal is unreachable from the UI. The share-link template must still be pinned
  at `elite` on the day the default moves (`src/share/codec.test.ts` names the trap).
- **Retiring Tier ladder / Troops first / Your own order.** 114 §D measures Troops first at **+45 %** on one
  march over Tier ladder on a hired army, and *Your own order* is the only way to fix the kill order by hand.
