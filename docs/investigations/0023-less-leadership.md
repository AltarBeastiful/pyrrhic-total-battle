# 0023 — a bit less leadership (2026-09-20)

Asked by the owner while S-113 was being scoped: *"we were supposed to also explore using a bit less
leadership, if the damage is still good and the ratios are better. Create a new report on this using the
theorycrafting and game knowledge we have."*

Every march this app has ever offered fills the leadership pool to its last point. That is an assumption
nothing had tested: the sizer's whole job is *"how big can each stack be"*, and the plan's stops vary the
army by **dropping whole types** (S-99, S-111), which under-fills leadership only as a side effect of a type
leaving. Nothing had asked what the same march is worth fielded **smaller**.

Measured in `tools/theorycraft/118-less-leadership.test.ts` →
`tools/theorycraft/out/118-less-leadership.md`. Damage is the **worst opening** (S-94/S-108) and so is the
hired/troop split — `damageByPool` splits the *midpoint*, and two arithmetics on one row is the bug S-108 was
written for. Silver and queue are `recoveryCosts` under each account's own recovery settings.

> **Corrected, 2026-09-20.** The first run of this investigation swept the raw `elite` ladder, which has **no
> shelter ceiling**, and reported a "damage cliff" as a property of the dial. The owner caught it: *"your
> cliff explanation is all wrong, merc should have been changed in numbers if the troops shrink. They should
> always be shielded to do more damage, that's the main point of the calculator!"* He is right, and the code
> agrees with him — `stacker.ts` applies `troopFloor - 1` under `ms`, and `planCampaign` applies
> `shelterUnder` to **every** shape it answers with (S-87). No march this app offers walks into that cliff.
> §§3–6 below are the corrected reading; the cliff survives only as §4, which is where it belongs: as the
> measurement of what the shelter is *worth*.

## 1. The answer in one line

**The dial is free while the player's hired stock is what limits his mercenaries, and costs mercenaries the
moment the shelter is what limits them instead.** That crossover is a closed form, it is different for every
account, and on one of the two hired armies measured it sits at exactly 100 % — which is to say some armies
should not turn the dial at all.

## 2. Troops only: exactly linear, and worth nothing as a ratio

A first-run army at 12 000 leadership, from 100 % of the pool down to 20 %:

| leadership | damage | of full | silver | of full | damage a silver |
|---|---|---|---|---|---|
| 100 % (12,000) | 2,710,128 | 100 % | 4,878,400 | 100 % | **0.56** |
| 75 % (9,000) | 2,032,269 | 75 % | 3,658,600 | 75 % | **0.56** |
| 50 % (6,000) | 1,354,681 | 50 % | 2,439,000 | 50 % | **0.56** |
| 20 % (2,400) | 541,615 | 20 % | 975,400 | 20 % | **0.56** |

Damage and silver both scale with the pool to the tenth of a per cent, so the rate is **0.56 at every fill**.
This is the flatness experiment 116 measured on the share axis, confirmed on the leadership axis: a
troops-only march has no efficient size, only a size you can afford. The dial is still a real control there —
it supplies 15 of the 17 undominated (damage, silver) marches on the joint frontier — but it is a *"spend
less today"* dial, never a *"spend better"* one.

## 3. With mercenaries, sheltered, the rate really does rise — up to a point

The owner's live account: 20 000 leadership, 83 epic monster hunters, one hired type, **every march
sheltered**:

| leadership | damage | of full | silver | damage a silver | hired units | hired lost | damage a hired unit |
|---|---|---|---|---|---|---|---|
| 100 % (20,000) | 6,729,633 | 100 % | 7,809,000 | 0.86 | 83 | 9 | 298,414 |
| 92 % (18,400) | 6,405,266 | **95.2 %** | 7,184,000 | 0.89 | 83 | 9 | 298,414 |
| 85 % (17,000) | 6,122,589 | 91 % | 6,637,600 | 0.92 | 83 | 9 | 298,414 |
| **75 %** (15,000) | 5,717,537 | 85 % | 5,856,200 | **0.98** | **83** | 9 | 298,414 |
| 70 % (14,000) | 5,419,461 | 80.5 % | 5,466,200 | **0.99** | **80** | **8** | **323,582** |
| 60 % (12,000) | 4,627,561 | 68.8 % | 4,685,600 | 0.99 | 68 | 7 | 314,337 |
| 50 % (10,000) | 3,865,733 | 57.4 % | 3,904,200 | 0.99 | 57 | 6 | 307,403 |

**Why the rate rises at all**: mercenaries cost **authority**, troops cost **leadership**. While the stock is
what limits the hired count, turning the dial down cuts the troops' damage *and* their silver bill in the
same proportion and leaves the hired damage — 40 % of this march — exactly where it was. A constant numerator
over a falling denominator is the whole of the effect: **0.86 → 0.98, up 14 %, with every hunter still on the
field.**

**And the dial gives stock back, which the first draft got wrong.** Hired units lost falls 9 → 8 → 7 → 6 as
the fill comes down, because the shelter ceiling starts binding and the sizer fields fewer hunters. The dial
is *not* orthogonal to the bar's burn axis; it is a second way of reaching a lower burn, and on this account
a better one at 70 %: **one chunk of stock less for 80.5 % of the damage, at 323 582 damage a hired unit
against 298 414** — the last three hunters of a stock of 83 cost a whole chunk of ten and buy 3.6 % more
hired damage.

## 4. What the shelter is worth: the same dial with it switched off

The same account, same fills, sized by the raw `elite` ladder, which keeps the hired count the authority
housing allows however small the troops become:

| leadership | hired units | tallest hired stack | lowest troop rung | striking | total damage | against sheltered |
|---|---|---|---|---|---|---|
| 75 % | 83 | 798,626 | 826,198 | 1 of 1 | 5,717,537 | 100 % |
| **70 %** | **83** | **798,626** | **771,620** | **0 of 1** | **4,151,856** | **76.6 %** |
| 50 % | 83 | 798,626 | 551,426 | 0 of 1 | 2,965,016 | 76.7 % |

At 70 % the unsheltered march puts the hunters at the **head** of the kill queue — 798 626 HP against a
771 620 top rung — and the biggest stack strikes zero times, so 2 685 730 damage becomes 0. The sheltered
march at the same fill fields **80** hunters at 769 760 HP, last in the queue, striking twice for 2 588 656.

**Same silver — 5 466 200 on both — and the sheltered march deals 30.5 % more damage while burning one chunk
of stock less.** That figure is the project's first goal in one number (`docs/PLAN.md` §1).

## 5. The crossover, in closed form

The hired count is the smaller of two bounds: **the stock the account owns** and **the shelter ceiling**,
`floor((troopFloor − 1) / hpPerUnit)`. The ladder's rungs all scale with the fill, so the ceiling scales with
it too, and the fill where the ceiling stops clearing the stock is

> **crossover = (stock × hpPerUnit) / troopFloor at the full pool** — the tallest hired stack the account
> could ever field, over the lowest rung it can build.

**Above it the dial is free of hired cost. Below it every point of leadership given up takes mercenaries with
it.** Measured against predicted:

| army | crossover | last fill fielding the whole stock | first fill fielding less |
|---|---|---|---|
| live account, 83 EMH | **72.4 %** | 75 % (83 units) | 70 % (80 units) |
| 2026-09-17 export, 129 hired units | **100.0 %** | 100 % (129 units) | 97 % (125 units) |

The ceiling is exact at every fill where it binds: it allows 80 at 70 %, 74 at 65 %, 68 at 60 %, 57 at 50 %,
and the sizer fields exactly 80, 74, 68 and 57.

## 6. Which is why one of these armies must not turn the dial

The 2026-09-17 export's stock (129 units, 361 152 HP) already sits **just under** its lowest rung (361 200 HP)
at the full pool. Its crossover is 100 %, so its mercenaries — carrying **5 084 274 of 6 198 747, 82 % of the
march** — start shrinking from the very first turn of the dial. Its best damage a silver is at **100 % of the
pool (2.26)**, and its sweep is not even monotone: 97 % of the leadership costs **13.6 %** of the damage,
because the four hired types re-shuffle under a lower floor.

So the two hired armies measured give **opposite** answers, and one formula tells them apart before any
search runs:

- **crossover < 100 %** (live account, 72.4 %) — there is a free region. Down to the crossover the dial buys
  rate at no cost in stock; past it, it trades damage for stock and silver together.
- **crossover ≥ 100 %** (the export) — the shelter already binds at the full pool. This march is as large as
  its troops can shelter, and every smaller one costs mercenaries. **Do not offer the dial.**

## 7. What this does not say

The model scores **damage dealt against a fixed enemy formation**. It cannot know that a smaller march is
still enough to take the target, or that a bigger one is overkill — that is the player's own read of the map,
and it is exactly the read the dial is there to serve. Nothing here argues for turning the dial down by
default; it argues for **offering** it where the crossover says it is free, and for saying so where it is not.
