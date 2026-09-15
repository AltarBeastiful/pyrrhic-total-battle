# 0019 — What "full optimization" means

Owner, 2026-09-15: *"How to optimize our given silver and mercs when generating stacks with the tool. We're still
trying to get the best bang for our buck here. Leverage that data and anchor a clear full optimization
definition, only using data to verify it."*

This file states the definition the tool is built on, and then verifies each clause against a measurement. It
adds no new arithmetic: everything below is `simulateBattle` on counts the engine produced, played with the
game's own decay. Experiments 77–83, outputs under `tools/theorycraft/out/`.

## 1. The definition

> **Full optimization is the set of marches — and the counts of each — that maximises the total damage the
> campaign deals, subject to the leadership and authority a march may spend, the permanent loss of
> `ceil(n/10)` of every hired stack that is fielded, and the silver the player is willing to spend.**
>
> It is a **campaign** objective, never a march objective; and it is a **frontier**, never a point, because two
> of the three resources are finite and trading one for the other is the actual decision.

Three consequences fall straight out of it, and each is measured below:

1. **A march is only as good as the campaign it belongs to.** The best possible single march is not the answer
   to a ten-march question.
2. **Which resource binds decides which *rate* is worth following.** Damage a silver is the right compass when
   silver is short and a distraction when it is not. Damage a mercenary is never the right compass at all.
3. **The horizon is part of the question, not a setting to leave alone.** "Best" is undefined until the player
   says how many marches the campaign is.

## 2. The clauses, each verified by a measurement

### 2.1 It is a campaign objective — the one-march optimum takes 82 % of it

Experiment 83, the owner's own account, ten marches, silver unlimited. Every row is played with the game's
decay and `simulateBattle`:

| objective | what a march fields | campaign damage | silver spent | hired lost |
|---|---|---|---|---|
| **the best campaign** (the plan's recommendation) | 35 · 40 · 40 · 20 | **46,118,086** | 17,083,000 | 140 |
| the best single march (the priority search) | 92 · 76 · 72 · 37 | 37,958,896 (**82.3 %**) | 13,029,000 | 193 |
| field everything you hold | 92 · 76 · 72 · 37 | 37,958,896 (**82.3 %**) | 13,029,000 | 193 |
| the best damage a mercenary | 0 · 0 · 0 · 9 | 16,851,860 | **21,613,000** | 10 |

**The best single march and "field everything" are the same march** — which is what the owner's instinct
correctly describes, and it is worth 82.3 % of the campaign. Experiment 79 says the same thing from the other
side on the same account: fielding everything and re-planning each march gives 35,661,622 over ten marches
against the plan's 45,415,176, **21.5 % worse**, because a march that fields 135 hunters burns 14 of them for
good and by march ten there is nothing left.

### 2.2 The rate to follow is the one whose resource binds

Experiment 83 again, the same five candidates, but the purse is set to the **cheapest** candidate's own
ten-march spend, 4,158,000 silver:

| objective | marches it could pay for | campaign damage | silver spent |
|---|---|---|---|
| **the best damage a silver** | **10** | **24,854,746** | 4,158,000 |
| the best single march | 3 | 14,205,005 | 3,908,700 |
| the best campaign | 2 | 9,277,448 | 3,416,600 |
| the best damage a mercenary | 1 | 1,685,186 | 2,161,300 |

Under a capped purse the *same* engine, on the *same* account, buys **1.75× more damage** by maximising damage
a silver than by maximising the campaign total — and 1.75× more than the one-march optimum. The two objectives
are not rivals; they are the answers to two different questions, and a tool that offers one of them silently
is answering a question the player may not have asked.

### 2.3 Damage a mercenary is never the compass

Experiment 82 swept the horizon from 1 to 30 marches on one arena. Damage a hired unit **rises monotonically**
with the horizon — 62,059 at one march to **435,961** at nineteen — while the march itself collapses:
at horizon 19 it fields *two hired units in the entire march*, and its damage a march is 871,921 against a peak
of 3,236,374. The rate is highest exactly where the march is worst. In experiment 83 it is worse still: the
"best damage a mercenary" plan spends the **most** silver of the five (21,613,000) for the **least** damage
(16,851,860), because a plan that rations the stock must buy its damage with troops instead.

A ratio can point a direction. It cannot name a stopping point, and this one points the wrong way.

### 2.4 The horizon is part of the question

Same sweep. Damage a march by horizon asked: **3,120,063** at one, a peak of **3,236,374** at three,
**1,982,910** at ten, **666,148** at fourteen — and **eleven of the thirty horizons have no plan at all**,
because a 60-unit purse cannot field anything that survives them. The spread is **434.6 %**.

**And the default changed because of it** (owner, 2026-09-15). `CAMPAIGN.marches` is **4**, not 10, because
that is the owner's own cadence — an epic event every three days, three or four marches each. Measured on his
account (`out/85-horizon-merc-cost.md`):

| horizon | hired a march | burned a march | damage a march | damage a silver |
|---|---|---|---|---|
| 3 | 227 | 24 | 5,983,998 | **3.63** |
| **4** | 205 | **21** | **6,826,445** | 3.02 |
| 10 | 135 | 14 | 4,638,724 | 2.72 |

Four burns **fewer** mercenaries than three and does **14 % more damage a march** — the peak of all ten
horizons. Ten, the old default, gave up a third of that damage for endurance the owner's cadence never uses.

So "the best march" is not a question until the horizon is named. It is also the mechanism behind the holes the
owner reported the same day: a long horizon forces the plan to field less of each type, and at horizon 8 the
chariots go to zero on that arena. The horizon creates the dropped type; the band fix (S-58 B) only decides
whether the player is *offered* it.

### 2.5 The resources that are actually scarce

Experiment 78, the owner's account: the march spends **155 authority of 2,000**, and the entire hired stock
would cost **314**. Authority is not a constraint and never appears as `binding`. The three that are: the
**leadership** a march may spend, the **hired stock** (irreplaceable — one unit in ten fielded is gone), and
**silver** (renewable, bought with time). The objective names all three for that reason.

## 3. What this means for the tool

- **Two questions, two answers, and the player should know which they are asking.**
  *"What do I march right now?"* is the priority search: one march, the best possible, which measured **beats
  both rival tools** on their own ground (3,837,194 against Kai's 3,804,567 and TotalStack's 3,258,657).
  *"What does a week of this cost me?"* is the plan: a horizon, a schedule, and the trade between silver and
  the stock.
- **Neither answer is "more mercenaries".** Fielding everything is the *same march* as the one-march optimum
  (2.1), and over a campaign it is 21.5 % worse.
- **The plan should say which resource binds** — it already does (`CampaignPlan.binding`), and that sentence is
  the one that tells the player which rate to follow.
- **The frontier is the answer, not a decoration.** 2.2 is the same account buying 1.75× more damage for the
  same silver by choosing a different point of it; that is the "bang for the buck" the owner is asking for, and
  it is only visible when the points are drawn side by side.

## 4. What this does not settle

- **Where the plan's recommendation sits.** Measured in `out/84-marginal-silver.md`: on the owner's account at
  the old horizon of ten, the first ~6 M of silver returns a **marginal 7.75 damage a silver** and everything
  past it returns **under 2.5**; the *average* rate peaks in the same bucket (4.60), so the two agree on where
  the common ground is. The engine's recommendation sits at **17.08 M** — nearly three times past the cliff —
  because `balanced` is the candidate that best balances damage *a silver* against damage *a mercenary*, and the
  mercenary ratio is the trap of §2.3: balancing against it drags the pick toward the end that spends most for
  least. The fix is a definition, not a constant: the recommendation should follow the resource that binds,
  which the app cannot know while the silver box is off the card (S-56). Open.
- **The horizon's default.** Settled at 4 (§2.4), on the owner's cadence rather than on arithmetic — and it is
  worth saying that 3 keeps the better *silver* rate, so the choice is which resource to favour, not which
  number is correct. The old value of ten gave up 39 % of the damage a march that a three-march
  horizon would field, and it is the number that creates the dropped types. What it should be is a question
  about how the player actually plays, not about arithmetic.
- **Silver's value over time.** The definition treats a silver spent as a silver spent; it has no model of how
  long the army takes to come back, which is what makes a cheap march repeatable.
- **Whether the campaign should be re-planned each march.** The definition optimises a *schedule*; a player
  re-generates with the stock they hold. Experiment 79 measured those two against each other once (21.5 % apart
  on one account) and the schedule won; it has not been measured at other horizons.
