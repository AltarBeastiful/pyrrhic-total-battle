# 0020 — The plan's own screen: its rows get names, its bar gets a tip, its table gets a shape

2026-09-16. S-59. The owner's review of the screen the plan method draws, in his words:

> *two things ui related for the plan of optimize all: slider tooltip is hard to grasp. it represent the
> current selected one, and the name is unclear. Woudl be best to have tooltip be the one below the cursor,
> with animation on hover so we understand and find better names for it. Then the table below, same plan name
> is hard to catch and some info in it is already in the table. better names. then the table itself needs more
> styling to be more visual. We could use icons but better styling is needed. Or redrawn in another way. The
> text above is wayyy too big and might even be unecessary if the form itself is clear. Then we can move to
> actually showing this all the time or even not in a arrow down plan details. It becomes a new part of the
> recap when total optimization is choosen.*

Four of those five are decisions he has since taken explicitly (below). The fifth — the wall of prose — has a
history that matters: the paragraph exists because the **same reviewer** asked for it one day earlier, in the
2026-09-15 review that produced S-55 (`docs/investigations/0018-plan-horizon-and-the-fold.md:8`: *"What's
missing is the explanation on top … silver buys good damage, mercs also buys good damage but they are used
sparsely"*). So it is **moved, not deleted** — the general why goes behind the glyph that explains the line,
and the line keeps only what is true of *this* army.

Nothing on this screen is copied from TotalStack: the only screen of theirs ever observed is the **method
card** (`docs/investigations/0008-totalstack-method-enemy-results.md`), which has no plan list, no names, no
bar and no trade table. There is no reference for this pass — rule 26 governs, our words throughout.

## 1. What the screen was, measured

Measured on the owner's export (scenario C, 4 343 leadership / 2 000 authority, the app's horizon of 4) with
the code as it stood before this pass, by matching each carried row against the plan's own payload picks. Four
stops, each wearing a sentence rather than a name:

| # | the rule that produced it | troop stacks | hired a march | burned | damage a march | silver a march | damage a silver | **in the band?** |
|---|---|---|---|---|---|---|---|---|
| 1 | best damage a silver (`light`) | 1 | 140 | 17 | 2 587 599 | 446 600 | 5.79 | **no** |
| 2 | the knee | 7 | 45 | 7 | 3 133 504 | 1 567 700 | 2.00 | **no** |
| 3 | sweet spot (`balanced`) | 3 | 205 | 21 | 6 826 445 | 2 256 900 | 3.02 | yes |
| 4 | the plan (`chosenPoint`) | 3 | 207 | 22 | 6 920 621 | 2 354 500 | 2.94 | yes |

Three defects, all visible in that table:

1. **The names did not name.** `3 stacks · 205 hired · 2.3M silver a march` and `3 stacks · 207 hired · 2.4M
   silver a march` are one row apart and read as a typo. The silver figure in the name **is a column of the
   table below it**, and "stacks" means two different things in one row: the name counts troop rungs (1), the
   table counts every stack (5). `0018` §6 had already recorded the follow-up — "the real fix … needs the
   engine to hand the label over in parts".
2. **The band was not applied to the picks.** The owner's instruction of 2026-09-15 was *"just don't show the
   extremes, if we use a certain % of mercs or waay too much silver we're too far off from our goal of
   everything optimized"*; `inBand` guards `heavy` alone (`src/engine/plan.ts`), so two of the four stops were
   exactly those extremes — the leftmost being a **single-troop-stack march**, which is the plan
   `74-row-figures` §2b measured the band refusing and which the owner had already called "not a strategy".
3. **The prose stood where the answer should be.** Nine lines of general explanation, then two of analysis,
   above a two-row table.

The pane that holds all this was, measured at 1400×900 with the method chosen (`paneFrame`): **740 px of
March against 740 px of room**. It sticks by nothing at all. Unfolded it is 998 px and flows.

## 2. The five decisions

**D-1 — The four names, and a name is a definition.** The bar carries at most four rows, each defined over
the plans **inside the band**, cheapest first, and stated on the figures the row itself carries — the repeated
march's own damage, silver and hired units lost: **Best for silver** (the best damage a silver), **Spare the
stock** (the best damage a hired unit), **Sweet spot** (the plan the engine weighed both resources to choose —
where the bar opens), **Most damage** (the most damage a march of it does). A row that several definitions fit
wears the first of them; **a name already taken is not handed down to the runner-up**, because a name the row
above it contradicts is worse than a shorter bar. The knee stops being a stop — it stays in the payload, where
it belongs, because it is what *decides* the recommendation rather than an answer to offer.

Two things measurement forced on this decision, both found by running it rather than by reasoning about it
(`tools/theorycraft/out/86-slider-stops.md`):

- **The definitions are stated on the march, not on the campaign.** They were first written on
  `PlanTotals.damagePerSilver` and `totalDamage` — the plan-level figures — while the table prints the
  *repeated march's* figures, and the two disagree: the row named "Best for silver" wore a ratio the row above
  it beat. A name has to be true of the numbers beside it.
- **The candidates are the band *plus the recommendation*.** The sweet spot stands outside the band on this
  account (it fields no monster the plan does) and had the best damage a silver of everything on the bar, so
  the runner-up took the slot and the name was false a second time. Every plan the bar can carry now competes
  for every name.

Effect on the owner's account, measured after the change, at the app's horizon: **three rows** —
`spare-the-stock` (4 262 790 damage a march for 2 252 000 silver, 12 hired burned), `sweet-spot` (6 826 445 for
2 256 900, 21 burned) and `most-damage` (6 920 621 for 2 354 500, 22 burned) — with `leftOut` 45. **Best for
silver is absent because the sweet spot is itself the best damage a silver** (3.02 against the next plan's
2.96): a fourth row would have meant naming a plan whose ratio is beaten by the row above it, which is the
defect this pass exists to remove. Rows 1 and 2 of the table above leave the bar — they are the extremes the
band exists to refuse, and `leftOut` counts them.

**D-2 — The bar's tip is the plan under the cursor.** Not the selected one. Mantine's own floating label goes
(`label={null}`); the tip is ours, it follows the pointer along the track, it slides between stops rather than
jumping, it fades in and out, and it is clamped inside the pane at both ends. The row of the plan under the
cursor lights up in the table below it, so the bar and the table are one thing. Arrow keys and focus show it
too, at the thumb. `prefers-reduced-motion: reduce` keeps the tip and drops the motion (rule 24).

**D-3 — The trade is a table still, made visual.** A damage bar on every row (scaled to the loudest plan on
the list), a glyph on each column head through `Glyph`, compact figures for the two columns that carry seven
digits, the row on screen raised (`--pyr-raised`, the sanctioned mark), the sweet spot said in words on its
row. The bar is a **second ornament** on the page — `docs/design.md` §8 says only the kill-order column has
one — and the rule is amended rather than broken quietly.

**And the row is one level now.** The five heads stay — **Plan · Damage a march · Silver a march · Hired lost
· Per silver · Per hired** — and the last two become the *march's* ratios (`repeat.damage` over `repeat.silver`
and over `repeat.mercLost`) rather than the campaign's. They were the campaign's, beside three columns that
were the march's, which is what let a row named for a ratio be beaten by the row above it (§2, D-1); it also
means every figure on a row is a fact about the one march the recap above is drawing. The campaign totals
still exist, in "Fought to the end" at the foot of the block, where they always were.

**D-4 — The prose is cut to the analysis and the why moves behind a glyph.** One line in the muted meta ink
saying what the plan did for *this* army, with an ⓘ beside it carrying the general explanation on demand.

**D-5 — The plan is open when it arrives, and still collapsible.** It reads as part of the answer — no chevron
to hunt for — and the chevron stays, because the pane has exactly no room to spare (740 of 740) and closing it
is how a player gets the sticking pane back.

**D-6 — The sweet spot is the middle of the trade in hired stock.** Added the same day, from the owner's second
look at the built screen:

> *"no change in placement, just the sweet spot seems to be too similar with silver save, especially for merc
> spends."*

He was right, and not marginally. Measured on his account the old rule burned **21** hired units a march where
the two named ends burned **12** and **22** — a plan one unit from the dearest thing on the bar, saving no
stock at all, which was *also* the best damage a silver. And the old rule was doing exactly what it said: a
max-of-minimums rewards a plan that is excellent on one axis and strong on the other, and the axis it can
afford to be excellent on is the one whose peak is hardest to reach, so it walked to the silver end.

Two other principled re-aims were measured over the same trade before this one was chosen
(`tools/theorycraft/out/90-the-sweet-spot.md`), and neither moves: the **crossing** of the two relative
efficiencies lands at 20 burned, and re-anchoring the peaks on the offered plans changes nothing. On this army
the ratios genuinely cross up there, because each further hired unit burned buys **more** damage than the one
before it — 214 k damage a unit between 12 and 17 burned, 318 k between 17 and 22 — so the stock is worth
spending and no efficiency rule will decline to spend it.

The recommendation is therefore stated in the resource that does not come back: **the best march whose burn is
closest to the middle of the range between the thriftiest and the dearest plan the bar can carry** — and where
the two sides of the middle are equally near, the **thriftier** one wins, because a band narrow enough to sit
either side of its own middle (measured on a small account: burns 19, 19, 20) is exactly the case where the
choice would otherwise fall back to the dearest plan on the bar. No free parameter — both
ends of the range are plans the engine found, and the middle is a consequence. Measured after the change: the
bar opens on **17 burned for 5 333 606 damage a march**, against the old rule's 21 for 6 826 445 — 19 % less of
the stack for 22 % less damage, at the same silver. The bar also gained a row: **4 stops** (12 · 17 · 22 · 22
burned) where it carried 3, and `leftOut` fell from 45 to 44.

`CampaignInput.withTrade` was added to make that measurable at all: the frontier the picks are drawn from was
computed and then thrown away, so no experiment could ask "where else could the sweet spot have been". It stays
as an opt-in field — a screen draws the four answers, and the trade is the set behind them.

**Amended the same day, and the amendment is about *where*. D-5 first put the block straight under the recap
figures — "a new part of the recap", read literally — which pushed the pills and their counts down the pane.
The owner, 2026-09-16: *"im not fond of moving the army down. We should first see the army then the details to
change them afterwards."* So the order is **answer · army · left out · plan**: the block is a *control* —
reading another plan puts another march on screen — and a control belongs after the thing it acts on, never
between the answer and the army. `PlanSizing`, the one line under the figures saying what the plan decided,
stays where it is: it is the answer, not the control. Pinned by J6, which measures the two on screen rather
than asserting a DOM order.

## 3. What the engine hands over

Presentation changes, but the identity of a row is the engine's to state: only `planCampaign` knows which
definition a row satisfies. So the carried row, which already carries a sentence, gains **which of the four
answers it is**.

```ts
/** Which of the four answers a row on the bar is (S-59). */
export type PlanPick = 'best-for-silver' | 'spare-the-stock' | 'sweet-spot' | 'most-damage';
```

- Each carried row gains `pick: PlanPick` — the identity is the engine's, the words are the UI's (rule 26).
  `label` is **kept**, and the app stops drawing it: the shape sentence is what a dozen recorded experiments
  (`tools/theorycraft/63`…`86`) quote as a row's identity, and deleting it would have rewritten their committed
  reports to say nothing about this pass.
- `alternatives` is the picks, cheapest first, deduplicated by counts: at most four rows, and a name that is
  already taken is not handed to the runner-up, so a bar may carry three or fewer. The sweet spot is offered
  whether or not the band would keep it: it is the recommendation and where the bar opens, and it is a
  candidate for every name.
- Unchanged: the band's three criteria, `leftOut`'s meaning, `curve`, `binding`, `recommend`, `knee`,
  `mostEfficient`, `mostThrifty`, the search itself.
- `alternatives` (the parameter) still only ever **truncates** the list; it can no longer invent rows.

## 4. Out of scope, recorded

- **The finale is still not drawn as a march** (`0018` §6). Untouched.
- **The silver budget is off the card** (S-56), so `binding.silver` is always false and the recommendation
  cannot follow the binding resource (`0019` §4, open). Untouched.
- **The 66-march unbounded plan** and the horizon as a config value: unchanged, `src/config.ts` stays the
  menu.

## 5. How it is proved

- `tools/theorycraft/86-slider-stops.test.ts` is **regenerated**: its subject is exactly this list, so it now
  prints each row's `pick` beside its shape sentence and its figures, at the app's horizon, the old default and
  a silver budget. Its committed `.md` changes; the rows that moved between the two reports are exactly the
  ones the band now refuses, and the file's header says so.
- `src/engine/plan.test.ts` gains the picks: four at most, cheapest first, all inside the band, the sweet spot
  present and marked, and the same four definitions hold whatever the horizon.
- `PlanPanel.test.tsx` is rewritten against names rather than sentences; a new test holds the tip (the hovered
  plan's name, not the selected one's) and the reduced-motion contract.
- `e2e/journeys.spec.ts` J6 is updated: the plan is open on arrival, the rows are named, the trade still has a
  head row and never an empty one.
- `e2e/generate.spec.ts` gains the measurement the pane needed anyway: the March with the plan chosen at
  1400×900, sticking or not, said out loud rather than assumed.
- Screenshots at 1400 and 390 px, both schemes, before and after.
