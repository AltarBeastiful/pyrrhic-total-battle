# The order of death — implementation plan (S-116)

**Owner, 2026-09-20**: *"is the order of death proposed always optimal with troops, mercs and monsters? Even
if we put back or left out a troop in the summary"* — against his standing objective, *"best damage over a
campaign using my constrained resources"*.

Measured in `tools/theorycraft/122-the-order-of-death.test.ts` →
`tools/theorycraft/out/122-the-order-of-death.md`. Everything below is from the data tables and the engine.

## 0. The finding

**The arithmetic.** `src/data/tables/*.json`: **health = 3 × strength** for every guardsman, specialist,
mercenary and monster in the game — 56 of 65 troops, 69 of 69 mercenaries, 28 of 28 monsters — the nine
exceptions being the **engineers** at 6 ×. `hitDamage` (`src/engine/units.ts`) is exactly linear in the
count. So the damage a stack buys with each point of HP it puts on the field is

```
damage per HP = (strength / health) × (100 + strengthPercent + strengthAgainst) / (100 + healthPercent)
```

— **independent of the count, the tier and the pool cost.** A tier-1 archer and a tier-9 kraken carry the
same *base* damage per point of HP; only the bonuses each catches tell them apart.

**What the enemy does with it.** It destroys the highest-HP living stack first, so the queue is sorted by
*total* HP and the blows a stack lands are decided by its place in it. Damage is
`Σ hits(place) × hp(stack) × damagePerHp(type)`, and `hits(place)` rises down the queue. **The ideal order of
death is therefore damage-per-HP rising as total HP falls**: the type that turns HP into damage best should
be the smallest stack and die last.

**The engine does not order on that.** `shelterUnder` lowers *every* non-leadership stack to
`ceil(troopFloor / hp) − 1` — one flat ceiling, applied to each type independently, with no notion of which
hired stack deserves the late slots. Where one or two hired types sit under the floor that is harmless.
Where four monster types and a mercenary all sit under the same ceiling, their relative order falls out of
rounding.

**Measured on the owner's own account** (5 600 / 2 180 / 1 200, monsters III, EMH VI × 64):

| type | damage a point of HP |
|---|---|
| **EMH VI** (authority) | **1.91** |
| emerald dragon · stone gargoyle (dominance) | 1.38 |
| battle boar · water elemental (dominance) | 1.23 |
| troops, RD3 → SP1 (leadership) | 0.95 → 0.73 |

His mercenary is the best thing on the field and **the plan kills it fifth of nine, on one blow**, while four
monsters that turn HP into damage worse than it strike twice. Six inversions on that march.

**What they cost: 8.3 %.** Holding his troops, pools and stocks exactly as the plan fields them and searching
only the hired counts (deterministic hill-climb, `122` §D): **8 388 740 → 9 088 494**. The whole change is
**battle boar 49 → 48 and water elemental 103 → 104** — one unit off a monster drops it below two others and
buys it a second blow. No authority moves, so the hired burn is identical and the gain carries to the
campaign.

**With mercenaries alone the rule is already optimal.** The same search on the 2026-09-17 export's four
hired types finds **0 %**. So *"troops shield mercenaries"* stands exactly as the owner stated it in S-87;
what is wrong is only the ordering **among** the sheltered stacks, and it shows up when monsters are there.

**And a take-out makes it worse.** With ARC2 left out — the biggest stack, the one a player takes out
first — the plan re-sizes and EMH6, the best damage-per-HP stack on the field, lands in a slot where it
strikes **nothing at all**.

## 1. What the rule should be

**Keep the shelter exactly as it is** — it is the owner's rule, it is what protects the rare stock, and on a
mercenaries-only army it is already optimal. Add one thing under it:

> Among the stacks the shelter has lowered, **the higher a type's damage per point of HP, the lower its total
> HP must be.** Where two sheltered stacks would otherwise land within rounding distance of each other, the
> one that turns HP into damage better takes the lower place.

It is a *reordering*, not a reallocation: the measured 8.3 % came from moving one and two units, so the
first build is a **local pass**, not a search. Whether a local pass recovers all of the gap is a measurement
(§3), not an assumption.

## 2. Where it goes

- `shelterUnder` (`src/engine/plan.ts`) gains the ordering pass, because it is the one place every shape the
  plan answers with passes through (S-87) — the ladders, the finale (S-96) and the re-size.
- `damagePerHp` becomes an engine reading beside `effectiveUnit`, so the plan, the re-size and any test read
  one definition of it (design rule 5 applied to arithmetic).
- **The re-size must use it too** (S-107, `resizeMarch`): §C above is a re-size, and it is the worst case
  measured. A fix that does not reach the take-out path leaves the owner's own complaint unanswered.
- Nothing in the UI changes. The trade table, the bar and the recap read figures that will simply be better.

## 3. The benchmark plan

The rule (owner, 2026-09-19): *"the benchmark is like non-regression tests. A given scenario should not be
worse, or it's a discrepancy, or a new baseline needs to be registered by me if the trade is ok."*
`tests/engine/plan-baseline.ts` states what that means per stop: campaign **damage** not lower, **silver**
not higher, **hired units burned** not higher, **damage a silver** and **damage a hired unit** not lower,
and — where the registered file carries them — hired soldiers, monsters, dragon coins and their ratios;
a stop the baseline holds and the run does not offer is a **failure**, a stop the run adds is **news**.

**Step 0 — before touching the engine, widen the bench.** Of the 16 scenarios, **only two hold a dominance
pool at all** (his TotalStack profile of 2026-09-19 at 100 dominance, and his usual setup at 200). This story
is *about* monsters, so the bench cannot see it. **Add his account of 2026-09-20 as a scenario** — 5 600 /
2 180 / **1 200**, monsters tier III, EMH VI × 64, Aydae 48 ★3 — which fields **four monster types and 232
monster units** and is the army the defect was found on. Register its baseline **before** the change, so the
before/after is a registered comparison and not a story about itself.

**Step 1 — the gate that must hold on every run.** `pnpm vitest run tests/engine` and a leaf-by-leaf diff of
`tools/theorycraft/out/benchmark-latest.json` against the committed one. Only `run` and `planMs` may move by
themselves; **every other leaf that moves is the story's evidence and has to be explained in the commit**.

**Step 2 — what a *win* looks like, and what a *trade* looks like.** A reordering that raises damage at
identical silver and identical burn is a pure win: the baseline passes it, and it is reported as an
improvement for the owner to register. A reordering that raises damage while raising silver or burn is a
**trade**, it fails the baseline, and it is the owner's to accept — **workers never re-base a pin.** The two
must be told apart per scenario in the commit, not averaged.

**Step 3 — the ceiling to measure against.** §D of experiment 122 is a *lower bound on the true optimum*: a
deterministic hill-climb over the hired counts, on the same troops, pools and stocks. Report, per scenario,
the fraction of that gap the local pass recovers. **8.3 % on his account and 0 % on the export** are the two
numbers the build is scored against; a pass that recovers most of the first while moving the second not at
all is the shape success takes.

**Step 4 — cost.** The ordering pass runs inside `shelterUnder`, which runs once per shape the search prices,
so `planMs` is the thing to watch. The benchmark records it per scenario; a build that recovers the damage
and doubles the plan's time is a different trade and gets said out loud.

**Step 5 — the take-out.** `tests/engine/plan-resize.test.ts` gains the §C case directly: leave the biggest
troop stack out of the owner's account and assert the mercenary is not left on zero blows. That one is a
**regression test, not a benchmark row** — it is a rule about the order, and it should fail loudly rather
than move a figure.

## 4. Risks, and what would make this the wrong change

- **The shelter is the owner's instruction, not an optimisation.** If a reordering ever recovers damage by
  putting a hired stack *above* the troop floor, it is out of scope and must be refused: S-87 measured that
  trade at 6 242 452 unsheltered against 5 864 482 sheltered on his export and he chose the shelter.
- **Two stacks of one type.** The engine fields one stack per type; if the best order needs a type split in
  two, that is a bigger change than this story and belongs to its own (0016 records *"one-stack-per-type
  unproven"*).
- **The gain may be concentrated.** 0 % on a mercenaries-only army means most of the bench will not move at
  all. That is the expected shape, not a failure to find anything — and it is why Step 0 comes first.

## 5. Deliberately not in this plan

- **Changing which types the plan fields.** That is the subset question S-99 and S-111 own.
- **Changing the sizer's HP profile.** 115 §B/§C measured that separately; it is a `sizeStacks` story.
- **A full search over hired counts.** §D's hill-climb is a *measuring stick* here, not a shipping design:
  it prices hundreds of marches per shape, where the plan prices one.
