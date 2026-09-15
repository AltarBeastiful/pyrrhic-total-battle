# Investigation 0018 — the plan's horizon: why the hired stock was left out, and what the fold shows instead

2026-09-15. The owner's review of the Plan fold, in his words:

> *why is the full optimization mode leaving out a stack of mercs sometimes? It seems quite detrimental to
> damage. Also in the plan recap the full recap is a bit weird, i'm not going to commit to 14 marches
> anyway, better to show me the alternative table below where we show the details of silver/mercs
> economics. What's missing is the explanation on top … silver buys good damage, mercs also buys good
> damage but they are used sparsely to avoid running out too soon … The slider is good but we should have
> less option … so less values and the slider should still show where is the sweet spot so I can go back
> there easily. Best would be a ticked slider with a marker for the sweet spot.*

Two experiments (`tools/theorycraft/72-merc-left-out.test.ts`, `73-plan-horizon.test.ts`; full tables in
`out/72-merc-left-out.md` and `out/73-plan-horizon.md`), one engine change, and a rebuild of the fold.
Everything below is measured on the owner's own export through the engine's public API.

## 0. The short answer

- **The "left out" stack is the chariots, and the plan does march them** — the finale fields all 37. The
  repeated march carries none of them, and the March section marks `Object.keys(counts)`, the repeated
  march, so the row reads "left out" while the stock is spent in the last fight.
- **The owner is right per march**: holding the plan's own ladder and everything else identical, ten
  chariots are **+747,080 damage a march (+32.7 %)** and all 37 are **+941,832 (+41.2 %)**, at **zero extra
  silver**. The engine still drops them because a type fielded every march burns `ceil(n/10)` for good: from
  37 held, ten a march lasts 28 marches, and the campaign collapses from 66 repeats to 28.
- **Which is only a defect because of the horizon.** The plan the search returns is 67 marches, **313 days
  of training**; its own sweet spot is 64 marches, 175 days. `total = marches × damage(march)` prefers more
  marches of a smaller march, and nothing in the input bounds `marches`.
- **Bounded to the horizon the app now sets (10 marches, `CAMPAIGN.marches`), the omission disappears** and
  the plan is better on every axis the owner reads: 5,140,277 damage a march against 2,287,262 (+125 %),
  2.18 damage a silver against 1.36, 116 days against 313 — and all four hired types ride every march
  (epic monster hunters 50 · arbalesters 40 · legionaries 40 · chariots 20).
- **Three engine defects were found on the way** (§3), including one that quietly answered with counts from
  the wrong `largestFor` maximum at any target above 12.

## 1. Why the chariots were left out (experiment 72)

The dropped type is always `chariot-6` (37 held). The engine's own arithmetic and the real `simulateBattle`
**agree to 0.00 %** on the plan's march, so nothing is mis-scored; and reconstructing the same shape with the
chariots restored, ladder and all, every count beats the plan's march:

| chariots fielded | simulated damage | vs the plan | silver |
|---|---|---|---|
| 0 (what the plan fields) | 2,287,262 | — | 1,688,900 |
| 1 | 2,376,524 | +89,262 | 1,688,900 |
| 7 | 2,855,818 | +568,556 | 1,688,900 |
| 10 | 3,034,342 | **+747,080 (+32.7 %)** | 1,688,900 |
| 37 | 3,229,094 | +941,832 (+41.2 %) | 1,688,900 |

The mechanism is `lastsMarches(held, c) = floor((held − c) / ceil(c/10)) + 1` and a plan that is
`marches × damage(march)`: the chariot's ceiling at 66 repeats is 0, because no count of a 37-strong stock
survives 66 marches, so the grid can only offer chariot 0 there. Adding it raises the per-march damage by a
third and costs 32 repeats — and over 66 marches the repeats win. Two further facts: the ladder's floor is
`max(hired stack) × 1.25 × scale`, so from seven chariots up the engine switches to a shallower ladder; and
with a silver box the omission vanishes entirely (8 M → 29 marches, all four types; 3 M → 6 marches, 22
chariots).

**The engine is right about its own shape. Its shape is not a strategy** — 66 repeats is 313 days of
training, which is what the owner meant by "i'm not going to commit to 14 marches anyway".

## 2. What the horizon does (experiment 73)

The plan the engine returns, per horizon (`marchTarget`), measured on the same account:

| horizon | marches | total damage | silver | damage a march | damage / silver | damage / mercenary | training | chariots a march |
|---|---|---|---|---|---|---|---|---|
| none | 67 | 154,214,995 | 113,670,300 | 2,287,262 | 1.36 | 745,000 | 313 d | **0** |
| 20 | 20 | 80,635,847 | 36,232,700 | 3,991,487 | 2.23 | 541,180 | 114 d | 10 |
| **10** | 10 | 51,191,589 | 23,498,200 | **5,140,277** | **2.18** | 341,277 | 116 d | **20** |
| 6 | 6 | 35,188,142 | 13,842,200 | 5,864,690 | 2.54 | 317,010 | 69 d | 25 |

The trade in one paragraph: on three of the four axes the unbounded plan is the worst of the four, and it
wins only on damage per mercenary (745,000 against 341,277) — a long run spends each chunk of ten it loses
over many more marches. Bounding to ten gives up 103 M damage of headroom nobody was going to play and buys
back 2.8 M damage a march, 197 days of training, and the four hired types of §1.

## 3. The engine changes

1. **`plan.marches` was the target plus one.** The repeats were the target and the finale was extra, so a
   "Marches planned" of 10 played 11 — where S-54's same field plays exactly 10. The target is now the
   campaign's total and the repeats are `target − 1`.
2. **The vectors grid was built for the wrong march count.** It came from `largestFor(held, K)` over
   K = 1…12 and every vector was then evaluated at the target, so a target above 12 sampled fractions of the
   *K = 12* maximum. With a target the grid is built for that one count. (Measured first: this does not
   throw, which is worse — it answers with counts off the wrong maximum.)
3. **The hill-climb read its own maximum from `marchesFor(vector)`** — the tightest type the vector happens
   to field, a march count unrelated to the plan's. It reads the target.
4. **The label did not identify its plan.** `9× 7 rungs + finale` named the engine's repeat count, so at a
   fixed horizon ten of sixteen rows wore the same name and a slider could not tell its stops apart. It is
   now the shape in the player's terms — `3 stacks · 135 hired · 1.6M silver a march` — in the March's own
   compact idiom. Presentation only: no number in the payload moved (proved, not assumed: FNV-1a over the
   whole `CampaignPlan` with every `label` key dropped is identical between the two label forms).

   Measured collisions after the change: **none at the default target of 10** (16 rows, 16 names), **one at
   a target of 20** — a one-decimal compass figure is coarser than the grouped number it replaced. A
   collision-free-at-every-horizon form exists (the campaign total: `3 stacks · 135 hired · 45.4M total`,
   also shorter) and was rejected because a campaign total is the figure the owner specifically does not
   plan by.

`MAX_MARCHES = 12` is left alone: it bounds the *unbounded* search's breadth, and a target bypasses it.

## 4. What the fold shows now

- **The thesis first**, in prose: damage is paid for twice over — silver, which comes back, and the hired
  stock, which does not; a stack loses a tenth of itself every march it is fielded, so the same stock is
  worth more spent thinly; the whole sequence is what shows which runs out first. Then the sweet spot the
  search found for *this* army, in its own figures.
- **The bar**, with one tick per plan, the sweet spot marked under the bar, and — once the bar leaves it —
  "Back to the sweet spot".
- **The trade, read a march at a time**: damage a march, silver a march, hired a march, damage per silver,
  damage per hired unit; the plan on screen and the sweet spot are each said in words on their row, and
  every row is a button that reads that plan. The campaign totals keep one muted line ("Fought to the end")
  instead of being the headline.
- **The horizon is set, not asked for** (corrected 2026-09-15, S-56): it is `CAMPAIGN.marches` in
  `src/config.ts` (10), read by `derive.ts` as the plan's `marchTarget`. When this was written the campaign
  card asked for it in a **Marches planned** field shared with the S-54 method; that field left the card
  with the method.
- **The policy numbers live in `src/config.ts`** (`CAMPAIGN.marches`, `planAlternatives`, `budgets.search` /
  `budgets.plan`; `maxMarches` and `budgets.complete` went with S-56), which is where the owner asked for
  them: *"number of marches could be a config in our config files so we can easily set it. Maybe later an
  advanced options in a menu in the UI."*
- **The trade carries about eight stops** (`planAlternatives: 4` plus the engine's own picks). Measured: at a
  horizon the frontier is continuous enough that an even sample lands next to the sweet spot, so the thinning
  needed no change — only the labels did.
- A refusal the plan method can produce — an account holding no hired stock has nothing to spread — no longer
  reaches the screen as `planCampaign: no feasible plan for this army`.

## 5. The second pass: the row figures, and the extremes off the bar

Two more instructions from the same review, and one more experiment (`74-row-figures`).

**"fix the row figures you saw"** — the rows spread a plan over *all* its marches, finale included, so the
plan the fold marks read 3,153,194 damage a march while the recap above it read 3,117,228 expected damage for
the very march it puts on screen. `PlanTotals.repeat` now carries the **repeated march's own** figures
(`{ damage, silver, mercLost }`), and the three "a march" columns read from it. Proved by measurement, not by
reading the arithmetic: for every carried plan of every horizon, `repeat.damage` equals what the real
battle reports for that march (`marchResult(request, counts).summary.avgDamage`) with a Δ of **0** — the same
for silver and for the mercenaries one march loses. The row and the recap now say the same number, to the
unit.

**"just don't show the extremes, if we use a certain % of mercs or waay too much silver we're too far off
from our goal of everything optimized"** — the trade is **banded**. Every threshold is anchored on the plan
itself, so the plan is always inside the band and no number is free-standing:

- a march that fields **at least half the hired troops the plan's own march fields** (the owner's "a certain
  % of mercs");
- returning **at least half the plan's own damage a silver** ("waay too much silver");
- and standing on **more than one troop stack** (experiment 72's criterion; the owner's "the least silver
  plan would never be chosen … is not a strategy" is that one-stack march exactly).

Measured (`74-row-figures` §2b, §3): the band keeps 31 of 45 frontier plans at a target of 10 and 15 of 30 at
20; **both ratio picks are refused at both** — the most-damage-per-silver pick is a single troop stack, and
the most-per-mercenary pick fields 10 hired a march (3.6 % of the stock) for 1.22 damage a silver, which is
the owner's sentence in numbers. `CampaignPlan.leftOut` carries the count so the fold can say what was cut
rather than letting the bar look like the whole trade, and the unbanded frontier is handed back (with
`leftOut` 0) if a band would ever empty the list.

The count and the list have to agree: a caller who asks for at least as many rows as the frontier holds is
handed the frontier whole, and `leftOut` reads **0** there — the field means "rows the band refused to hand
back", not "rows it would have refused if asked", because the UI prints that number beside a table of rows
the player can see.

## 6. Left open

- **The plan's name is still long for a phone.** `3 stacks · 135 hired · 1.6M silver a march` needs about
  three lines in a 390 px sheet's name column; the column was squeezed to one word per line until it was
  given a floor (`min-width: 8rem`) and the table scrolled sideways instead. A two-line cell — the shape on
  one line, the silver muted under it, as S-54's plans already draw their own names — is the real fix and
  needs the engine to hand the label over in parts.
- **The finale is not drawn as a march.** It fields the leftovers (37 chariots in the unbounded plan, 15-19
  at a horizon) and only its totals are folded into the plan's figures; the March section shows the repeated
  march. Showing it is a real piece of UI work and is not in this pass.
- **The horizon is a config value, not a preference** (S-56 took the field off the card): the owner's
  "advanced options in a menu" is still future work, and `src/config.ts` is the placeholder it was asked to
  be — now the only place the horizon is set.
- **The method's name**, "Complete optimization v2", is ours but reads as a version number to a player.
  Closed in S-56: the method is titled **Complete optimization**.
