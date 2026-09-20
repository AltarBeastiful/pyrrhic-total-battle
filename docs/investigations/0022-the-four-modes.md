# 0022 — the four stacking modes, defined; and the account that hires nothing (2026-09-20)

Asked by the owner after S-110 left the plan's default open: *"we need to revisit our understanding of
complete or total optimization. Or maybe without merc, we silently fallback to tier ladder. Assess that and
come back with a precise definition of each mode, explaining with examples when each would be best to use."*

Everything below is measured, not read off the code:
`tools/theorycraft/114-modes-without-mercs.test.ts` → `tools/theorycraft/out/114-modes-without-mercs.md`.
Damage is always the **worst opening** (the enemy strikes first, S-94), silver and queue are
`recoveryCosts` under the account's own recovery settings, and "hired lost" is the units a march never gets
back — one per chunk of ten of every **authority** stack fielded (a dominance monster is retrained, S-102).

## 1. What each mode actually decides

The app offers four, and they are **not four answers to one question**. Three of them answer *"in what order
should my stacks die?"* and one answers *"how do I spend a stock over a run of marches?"*.

The mechanic all four are built on: the enemy destroys **one stack per attack, always the one with the
highest total HP**, and every stack still alive strikes back in between. A stack's damage is therefore
decided by its *kill position*, not by its size. Everything below follows from that one fact.

### Tier ladder (`elite`) — the sizer, with no ceiling

Every pool is filled exactly, in a flat HP profile: one HP ceiling is solved per pool and each stack is given
`ceiling − i·δ`, cheapest-and-lowest-tier first, then single units are added round-robin until the pool is
spent to the last point. Kill order is Elite Preservation: engineers, then leadership by tier ascending, then
authority, then dominance.

**It decides nothing about your mercenaries.** The authority and dominance pools are sized the same way as
the leadership pool, so a mercenary stack can easily out-HP your smallest troop stack — and then the enemy
kills it *first*, before the troops it was hiding behind.

### Troops first (`ms`) — the sizer, with a ceiling on everything hired

Identical, with one extra rule: every authority and dominance stack is capped at **(the smallest live troop
stack's total HP) − 1**. That makes the game's own targeting rule work for you: every troop stack outweighs
every hired stack, so all the troops die before the first mercenary does, and the mercenaries strike on every
one of those rounds.

Two rules ride on it:

- **Allow damage trades** (`relaxedPreservation`) — after the ceiling has been applied, keep growing the
  hired stack whose next unit adds the most average damage, but only while the **worst** opening improves
  too. It lets a hired stack cross the floor when the damage really pays for it.
- **Monsters after mercenaries** (`strictMercsAboveMonsters`) — the dominance stacks go under the mercenary
  floor as well, not just under the troop floor.

**Monsters after troops** (`monstersLast`) is the same ceiling offered to the Tier ladder, for the dominance
pool only.

### Your own order (`custom`) — the sizer, with your kill order

The same sizing with the ranking replaced by your list; anything you leave off the list is appended in Elite
Preservation order. It changes *which* stack gets the higher HP target, and nothing else.

### Complete optimization (`plan`) — not a sizing at all

It is a **campaign planner**. Given the army and the enemy it chooses, for a run of `CAMPAIGN.marches`
marches (4 today):

1. **how many of each hired type to field every march** — fielding `n` loses `ceil(n/10)` for good, so a
   march of `n` lasts `floor((stock − n) / chunks(n)) + 1` marches: field less, march more;
2. **the troop shape under them** — either a *tight ladder* (rungs 2 % apart, the smallest stacks that still
   out-HP the mercenaries, at ten growth scales × eight depths) or the sizer over a **prefix** of the troop
   ranking;
3. **which of the resulting campaigns to offer**, as up to five stops on one bar — silver saver · sweet spot
   · more mercs · steady max · all-in.

It maximises total damage over the campaign, never one march, and it prices silver, gold, dragon coins and
the training queue for the whole run. It never returns one answer: the bar is the point.

## 2. What is true when the account hires nothing

**The three sizer modes collapse into one march** (§A of the report). On the first-run account
(Guardsmen I–III, Specialists I) at 4 100, 12 000 and 20 000 leadership, Tier ladder, Troops first, Troops
first + damage trades and Tier ladder + monsters after troops produce the **identical** counts to the unit at
every pool size — because every ceiling they differ by is written on the authority and dominance pools, and
those pools are empty. Only a deliberately perverse custom order is a different march, and it is worse:
925 723 → 885 965 at 4 100 leadership (−4.3 %), 2 710 128 → 2 593 752 at 12 000 (−4.3 %).

**The plan's own troops-only march *is* the Tier ladder march.** Not by measurement but by construction: when
a campaign outruns its stock, `planCampaign` builds the remaining marches with `troopsOnlyMarch()`, which is
`sizer([], 'elite')` — `sizeStacks` over every troop type with nothing hired in the request. The plan already
answers this question with the Tier ladder, and says so at the definition.

**Scaling that march is exactly linear** (§C). Sweeping the leadership a march may fill from 20 % to 100 % of
12 000: damage goes 541 615 → 2 710 128 in exact proportion and damage a silver is **0.56 at every single
row**. There is no knee, no efficient size, nothing to recommend — half a march costs half as much and deals
half as much.

**And the shapes a plan would choose between are all worse** (§F). The sizer over the first k types of the
plan's own troop ranking, k = 10 down to 1: 10 types is 2 710 128 for 4 878 400 silver (0.56 a silver), and
every prefix under it is worse *on both* — 9 types 2 587 949 for 5 108 400, 6 types 2 608 917 for 5 944 800,
2 types 2 359 238 for 8 400 000, one type alone **0** (a single stack is killed before it ever strikes). The
all-types march dominates the family. A bar drawn from it would carry exactly one stop.

**So the three sizer modes agree, and scaling and prefixing are both dead ends.** That was as far as this
file went on 2026-09-20 morning, and it drew the wrong conclusion from it — *"there is nothing to optimise"*.
A prefix is 10 of the 1 023 subsets, and every one of them was only ever asked for the sizer's shape.
Experiment 115 asked the whole question; §6 below is what it answers, and it is not this.

### Where the refusal's edge actually is (§B)

| account | plan |
|---|---|
| no mercenary, no monster | **refuses** |
| a mercenary type selected, stock 0 | **refuses** |
| one mercenary, stock **1** | answers — 1 stop |
| one mercenary, stock 20 | answers — 2 stops |
| no mercenary, monsters unlocked at tier 3 **and** dominance housed | answers — 2 stops |
| no mercenary, monsters unlocked but **no dominance housing** | **refuses** |

One hired unit of any kind is enough. The refusal is "this army can field nothing that is spent for good",
which is exactly the case in which the plan has nothing to plan.

## 3. The lever a troops-only army *does* have: the Objective

Not the method — the **Objective** in the command bar, which runs the priority search over subsets of the
types (§E, same army at 12 000 leadership):

| objective | damage | silver | queue | a silver | what it fields |
|---|---|---|---|---|---|
| no priority | 2 710 128 | 4 878 400 | 15d 18h | 0.56 | all ten types |
| Best worst case | **2 959 404** (+9.2 %) | 6 860 800 (+41 %) | 36d 23h | 0.43 | tiers 2 and 3 only |
| Highest average damage | 2 774 451 (+2.4 %) | 8 400 000 (+72 %) | 58d 8h | 0.33 | tier 3 only — three stacks |
| Damage per silver | 2 710 128 | 4 878 400 | 15d 18h | 0.56 | all ten types |

Two things worth keeping: *Best worst case* is the real offer here (+9.2 % damage for +41 % silver), and
*Highest average damage* is design rule 29's own trap on this army — it keeps the top tier alone, for 72 %
more silver and nearly four times the queue, and buys 2.4 %.

## 4. When each mode is the right one

| your account | use | why, measured |
|---|---|---|
| **No mercenary and no monster** (a new account, or an epic you fight on troops alone) | **Tier ladder**, and spend your attention on the Objective instead | All modes give the same march (§A); the Objective is worth +9.2 % (§E) |
| **Mercenaries, one epic fight, and you do not care what it costs** | **Troops first** | It shelters the hired stacks so they strike every round: 3 171 565 → 4 609 965 on one march (+45 %, §D); 4 457 185 → 6 198 747 on the owner's export (+39 %, §G) |
| **Mercenaries, and a run of fights over several days** | **Complete optimization**, then pick the stop | The bar is the answer: on the owner's export the silver saver is 16 115 314 for 8 695 000 silver and 32 hired lost, against the steady max's 22 770 620 for 10 957 600 and 55 (§G) |
| **Monsters in the march** | **Complete optimization**; failing that, Troops first or Tier ladder + monsters after troops | On the monster camp the plan's sweet spot is 24 977 427 against Troops first's 22 889 520 — **+9.1 %** for +9.4 % silver (§H). Tier ladder alone is 22 132 288, and the `monstersLast` rule alone recovers all of the gap to Troops first |
| **You have watched a battle report and you know the order you want** | **Your own order** | It is the only mode that lets you fix the order; it is otherwise strictly the sizer |

### The honest part: the plan is not always the biggest number

On the owner's export of 2026-09-17 at its own setup (§G), played four marches:

| mode | campaign damage | campaign silver | hired lost |
|---|---|---|---|
| Tier ladder | 18 589 604 | 10 957 600 | 93 |
| **Troops first** | **23 341 980** | 10 957 600 | 55 |
| Complete optimization · steady max | 22 770 620 | 10 957 600 | 55 |
| Complete optimization · all-in | 23 619 920 | 15 179 600 | 92 |

Troops first, re-generated each march on what the stock had left, beats the plan's steady max by **2.4 % at
identical silver and identical stock spent**. The plan's answer on that army is not a bigger number, it is a
**choice**: a silver saver at 69 % of the damage for 79 % of the silver and 34 % of the stock, and three
stops between. On the monster camp (§H) the plan does win outright, by 9.1 %, because there the shape of the
march is the question and the sizer has no opinion about it.

## 5. What to do about the mercenary-free account

> **Superseded by §6.** The three options below were written before the space had been searched, on the
> reading that the Tier ladder's march *was* the troops-only optimum. It is not. §6 replaces the
> recommendation; the options are kept because §6 is an argument against two of them.

The three options, against what is measured above.

**(a) Silently fall back to the Tier ladder.** Numerically correct — the plan's own troops-only march is the
Tier ladder's. But the Battle card would say *Complete optimization* while the March shows a march with no
plan block, no bar and no stops, and nothing on screen would say why. It is the failure design rule 24 exists
to prevent (*the form says what is wrong, in words*), and the first thing the owner would ask is where the
bar went. **Not recommended.**

**(b) Say it, and offer the march anyway.** Generate on the plan method with nothing hired answers with the
Tier ladder march and **one line above it**: *"Nothing in this army is spent for good, so there is nothing to
plan — this is your one march. Hire a mercenary and this becomes a campaign."* The card keeps the method the
player chose, the March is right, and the sentence is true. Cheap: no engine change at all, one branch in
`generate.ts` where the refusal is caught today, and the plan block simply does not draw.

**(c) Teach the plan to plan a troops-only army.** Not a one-line change — the empty hired vector is rejected
in two places (`counts.every(...)` in the grid and `fielded.length === 0` in `evaluateVector`) and the tight
ladder has no floor to be built from without a hired stack. And by §C and §F it would answer with **one stop,
and that stop would be the Tier ladder march**. It buys a consistent bar and nothing else. **Worth doing only
if the bar's presence matters more than the work.**

Recommendation as first written: **(b)**. §6 withdraws it.

## 6. Wording the glossary should carry

The four one-liners on the Battle card, re-read against what they do (`sections/battle/choices.ts`):

- **Complete optimization** — *"Plans the marches your army can fight: how big each one is, and what it
  carries."* Accurate, and the only one that mentions marches plural, which is the whole difference. Keep.
- **Tier ladder** — *"Your cheapest, lowest-tier stacks take the hits first."* True and it is what the mode
  does. What it does **not** say is that hired units are not protected; on an account with mercenaries that
  is the thing a player needs to know before choosing it.
- **Troops first** — *"Hired units only fall once all of your troops have."* Exact.
- **Your own order** — *"You decide which stack falls first."* Exact.

## 6. Is the fallback march actually the best play? — no (experiment 115)

Owner, the same day: *"if we KNOW for sure it's the best play with the given configuration and we've explored
all possibilities, then we've answered the complete optimization goal… check first it's actually the case."*
Checked. `tools/theorycraft/115-troops-only-optimum.test.ts` → `out/115-troops-only-optimum.md`.

**The search.** Same first-run army at 12 000 leadership, and this time the whole space:

- **all 1 023 non-empty subsets** of the ten troop types, each sized and fought. The technique is the
  project's own — investigation 0013 §2 enumerated the same 1 023 on the owner's army *"so each answer is the
  true optimum"*; what is new is asking it of an army that hires nothing;
- **a hill-climb on the raw counts** from the best subsets, moving leadership between two types at a time on
  a geometric ladder of step sizes, so the sizer's flat HP profile is tested rather than assumed (every
  climbed march is checked feasible before it is quoted);
- **a brute force** over a small case — four types, 600 leadership, counts in tens, **635 376 vectors** — so
  that at least once "the optimum" is a fact and not the best thing a search happened to reach.

**The answer.** The Tier ladder's all-types march is **rank 14 of 1 023 on damage** and **rank 1 of 1 023 on
damage a silver**. It is 2 710 128 for 4 878 400 silver against a best-of-family **2 959 404** for 6 860 800
— **91.6 %** of it — and the hill-climb reaches **3 047 818** for 6 872 800, which puts the ladder march at
**88.9 % of the best march found, at 71 % of its silver**. The damage/silver frontier of the subset family is
**25 marches** wide, from 705 718 at 3 600 000 silver to 2 959 404 at 6 860 800.

The brute force says the same thing from the other end, and sharpens it:

| | damage | silver |
|---|---|---|
| the sizer (Tier ladder) | 64 540 | 229 200 |
| best vector costing **no more** than the sizer | 64 134 | 228 000 |
| best vector at **any** price | **85 171** | 340 000 |

**At its own price the sizer is optimal** — nothing in 635 376 vectors beats it for the silver it spends (it
even edges the grid's best by 0.6 %, its own counts not being multiples of ten). Spend 48 % more silver and
there is **32 % more damage** on the table.

**So the contract is not met by handing back the Tier ladder march and calling it complete optimization.**
It is the right answer to *"what is the most damage per silver?"* and the wrong answer to *"what is the most
damage?"*, and 0019's definition — *a frontier, never a point* — is explicit that the second question is a
real one. A silent fallback would be telling the player we had explored everything when we had explored one
point of twenty-five.

**Two more things the search settles**, both worth their own story:

1. **The plan's troop family could not find this either.** Its shapes are the sizer over a *prefix* of
   `rankTroops`; the winning subset (the six tier-2 and tier-3 types) is **not** a prefix of that ranking —
   the k = 6 prefix is 2 608 917 against the winner's 2 959 404, **11.7 % short**. Teaching the plan to answer
   for a hired-free army by widening its prefix family would answer with the wrong march.
2. **The priority search already finds the optimum.** *Best worst case* on this army answers
   ARC2 2 570 · SP2 2 566 · RD2 1 280 · ARC3 1 437 · SP3 1 435 · RD3 716 for 2 959 404 — **the rank-1 subset
   of the 1 023, to the unit.** The machinery the answer needs is in the app already; it is the Objective
   control.
3. **And the sizer's flat profile leaves ~3 % on the table** even on the subset it is given (2 959 404 →
   3 047 818 under the hill-climb, +3.0 %). That is a finding about `sizeStacks`, not about the modes, and it
   applies to every march the app draws. Open.

### What to do instead

**Do not fall back, and do not add a sentence either — make the method answer the question it names.** For an
army that hires nothing, Complete optimization's honest answer is *the frontier over troop subsets*, which is
the same frontier the Objective control walks one corner at a time:

- the **silver saver** is the all-types march (0.56 a silver, rank 1 of 1 023);
- the **steady max** is the best-worst-case march (+9.2 % damage for +41 % silver);
- the stops between them are the 25-march frontier already measured.

That is a plan with no campaign in it — every march is identical and repeatable because nothing drains — and
it is exactly as much of an answer as the mercenary case gets: a bar, and the player's choice of where to
stand on it. It needs no new search: the subsets are enumerable (1 023 for ten types) and the app's own
priority search already lands on the corners.

## 7. The plan's slider and the Objective select are the same control

Owner, the same day: *"and for the plan slider, it's very similar to the objective select."* They are, and
§6 is why. Both name a **point on a frontier**; they differ only in which resources the frontier is drawn
over.

- The **Objective** picks a corner of one march's frontier — most damage, best worst case, most damage a
  silver, a gold, a coin — and the priority search returns the march at that corner.
- The **plan's stops** pick a point on a *campaign's* frontier — damage against silver against hired stock
  spent — and each is defined by a rule rather than by a parameter (0019 §3).

Where the account hires nothing the campaign axis is degenerate — nothing drains, every march repeats — and
the two collapse onto **the same frontier**. That is not a coincidence to design around; it is the same
question asked twice, and the app currently answers it in two different places, with two different controls,
one of which refuses to answer at all. Worth a story of its own: the bar and the Objective should be one
control, or the bar should be the one that carries the objectives.

*Also worth recording:* the plan **locks** the Objective while it is chosen (`OBJECTIVE_LOCKED_REASON`, owner
2026-09-15) on the reading that the plan decides it itself. §6 makes that reading exactly right for an army
with a stock to spread, and exactly wrong for one without — where the objective is the *only* thing there is
to decide.
