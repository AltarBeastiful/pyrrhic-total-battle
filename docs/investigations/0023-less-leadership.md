# 0023 — a bit less leadership (2026-09-20)

Asked by the owner while S-113 was being scoped: *"we were supposed to also explore using a bit less
leadership, if the damage is still good and the ratios are better. Create a new report on this using the
theorycrafting and game knowledge we have."*

Every march this app has ever offered fills the leadership pool to its last point. That is an assumption
nothing has ever tested: the sizer's whole job is *"how big can each stack be"*, and the plan's stops vary
the army by **dropping whole types** (S-99, S-111), which under-fills leadership only as a side effect of a
type leaving. Nothing had asked what happens when the same march is fielded **smaller**.

Everything below is measured, not argued:
`tools/theorycraft/118-less-leadership.test.ts` → `tools/theorycraft/out/118-less-leadership.md`. Damage is
the **worst opening** (the enemy strikes first, S-94/S-108) and so is the hired/troop split — `damageByPool`
splits the *midpoint*, and mixing the two arithmetics on one row is the bug S-108 was written for. Silver and
queue are `recoveryCosts` under each account's own recovery settings. The sizer is the tier ladder at every
fill, so the dial is the only thing moving between rows.

## 1. The answer in one line

**On an army that hires nothing the dial buys nothing. On an army that hires, it buys a great deal — until it
falls off a cliff that can be computed before it is reached.**

## 2. Troops only: exactly linear, exactly worthless as a ratio

A first-run army at 12 000 leadership, from 100 % of the pool down to 20 %:

| leadership | damage | of full | silver | of full | damage a silver |
|---|---|---|---|---|---|
| 100 % (12,000) | 2,710,128 | 100 % | 4,878,400 | 100 % | **0.56** |
| 75 % (9,000) | 2,032,269 | 75 % | 3,658,600 | 75 % | **0.56** |
| 50 % (6,000) | 1,354,681 | 50 % | 2,439,000 | 50 % | **0.56** |
| 20 % (2,400) | 541,615 | 20 % | 975,400 | 20 % | **0.56** |

Damage and silver both scale with the pool to the tenth of a per cent, so the rate is **0.56 at every fill**,
and the best rate the sweep can find is 0.56. This is the same flatness experiment 116 measured on the share
axis, now confirmed on the leadership axis: a troops-only march has no efficient size, only a size you can
afford. The dial is still a real control there — 15 of the 17 undominated (damage, silver) marches on the
joint frontier come from it — but it is a *"spend less today"* dial, never a *"spend better"* one.

## 3. With mercenaries, the rate really does rise

The owner's live account — 20 000 leadership, 83 epic monster hunters, one hired type:

| leadership | damage | of full | silver | of full | damage a silver | hired damage |
|---|---|---|---|---|---|---|
| 100 % (20,000) | 6,729,633 | 100 % | 7,809,000 | 100 % | 0.86 | 2,685,730 |
| 92 % (18,400) | 6,405,266 | **95.2 %** | 7,184,000 | 92 % | **0.89** | 2,685,730 |
| 85 % (17,000) | 6,122,589 | 91 % | 6,637,600 | 85 % | **0.92** | 2,685,730 |
| 75 % (15,000) | 5,717,537 | 85 % | 5,856,200 | 75 % | **0.98** | 2,685,730 |
| 70 % (14,000) | 4,151,856 | 61.7 % | 5,466,200 | 70 % | 0.76 | **0** |

**Why it rises**: mercenaries cost **authority**, troops cost **leadership**. Turning the dial down cuts the
troops' damage *and* their silver bill in the same proportion, while the hired damage — 40 % of this march —
does not move at all. A constant numerator over a falling denominator is the whole of the effect.

What it is worth, on each army measured:

| army | best rate | at | damage kept | under a 95 % damage floor | silver saved there |
|---|---|---|---|---|---|
| first-run, no hired | 0.56 (+0 %) | 92 % | 92 % | +0 % | 146,000 |
| live account, 83 EMH | 0.98 (**+13.3 %**) | 75 % | 85 % | **+3.5 %** at 92 % | **625,000** |
| 2026-09-17 export, four hired types | 4.02 (**+146.8 %**) | 20 % | **49.4 %** | **+2 %** at 95 % | 136,400 |

The export's +146.8 % is the warning in the table, not the prize: the best *rate* on a hired army is at the
smallest march the dial can make, because the hired damage is free of leadership and the troops are all that
is being paid for. A rate maximised alone walks the player down to half the damage. It is the same trap 0019
§2.3 named for damage-per-mercenary, on a new axis — **which is why the dial needs a damage floor beside it,
not a "best" mark.**

## 4. The cliff, and the closed form that predicts it

Between 75 % and 70 % on the live account the hired damage goes **2,685,730 → 0**: 38 % of the march's damage
for a 6 % saving. The kill order says exactly why.

**75 % of the pool** — the hunters are the *smallest* stack on the field, so they are killed last and strike
twice:

| # | stack | units | total HP | hits | damage |
|---|---|---|---|---|---|
| 1 | ARC1 | 3,491 | 837,840 | 0 | 0 |
| … | … | … | … | … | … |
| 7 | RD3 | 439 | 826,198 | 2 | 1,140,698 |
| 8 | **EMH6** | **83** | **798,626** | **2** | **2,685,730** |

**70 % of the pool** — the hunters have not changed (authority is untouched), but every troop stack has
shrunk below them, so they are now the *biggest* stack on the field. The biggest stack is destroyed first and
**strikes zero times**:

| # | stack | units | total HP | hits | damage |
|---|---|---|---|---|---|
| 1 | **EMH6** | **83** | **798,626** | **0** | **0** |
| 2 | ARC1 | 3,257 | 781,680 | 0 | 0 |
| … | … | … | … | … | … |

83 units were carrying 2,685,730 of 5,717,537 — 47 % of the march — and the dial threw them away in one
step of five per cent.

**It is a cliff and not a slope because of the ladder itself.** The tier ladder sizes every rung to nearly
the same total HP (837,840 … 826,198 at 75 %), so the whole troop wall crosses the hired stack's HP at one
fill rather than one rung at a time. That gives a closed form: the lowest rung is `troopFloor × fill`, it has
to stay above `hiredTop`, so the dial is safe down to

> **fill ≥ hiredTop / troopFloor** — here 798,626 / 1,102,852 = **72.4 %**

and the report **tests** the prediction rather than stating it: bisection to the tenth of a per cent finds
the last fill that keeps every hired blow at **72.4 %**. The prediction holds exactly.

## 5. Two regimes, and the app can tell them apart before it turns the dial

The 2026-09-17 export has no cliff at all: its tallest hired stack (1,331,818 HP) already stands **above** the
lowest rung (361,200) at the full pool, so the hired stacks are at the head of the queue before the dial is
touched, 3 of its 4 strike at every fill, and the hired damage is 1,641,448 from 100 % down to 20 %.

So there are exactly two regimes, and one comparison at the full pool tells them apart:

- **`hiredTop < troopFloor`** — the hired stacks are sheltered. The dial is safe down to
  `hiredTop / troopFloor` and catastrophic one step below it.
- **`hiredTop ≥ troopFloor`** — there is no shelter to lose. The dial costs troop damage and nothing else,
  all the way down.

## 6. The dial spends no hired stock, which is why it is a second control

Hired units lost is **9 at every fill** on the live account and **27 at every fill** on the export. The dial
moves silver and queue time; it does not touch the burn the plan's bar is ordered on. It is orthogonal to
that bar, not a sixth stop on it.

And the two families genuinely need each other. On the joint (damage, silver) frontier of the plan's stops
and the dial's marches together, the dial supplies **12 of 14** undominated marches on the live account,
**14 of 17** on the export and **15 of 17** on the first-run army — while the plan's stops still hold both
ends, `silver-saver` beating every dial march near its price (3,694,764 damage for 3,602,400 silver, against
the 65 % dial's 3,855,107 for 5,075,600) and `all-in` topping the whole frontier. Dropping a type and
shrinking every stack are different moves, and the frontier wants both.

## 7. What this does not say

The model scores **damage dealt against a fixed enemy formation**. It cannot know that a smaller march is
still enough to take the target, or that a bigger one is overkill — that is the player's own read of the map,
and it is precisely the read the dial is there to serve. Nothing here argues for turning the dial down by
default; it argues for **offering** it, with its floor drawn on.
