---
type: plan
title: The other questions of the advisor (W17 step D), design note
created: 2026-10-09
tags:
  - advisor
  - sweeps
  - probes
related:
  - '[[Progression-Advisor-Plan]]'
  - '[[advisor-card]]'
  - '[[design-rules]]'
---

# The other questions of the advisor (W17 step D)

Step D of `docs/plans/progression-advisor.md` §5 lists five questions "none of which is designed". This note fixes
each as a **probe** (one changed request, one extra plan, read like the 29 generic probes) or a **sweep** (the same
probe at several sizes), the unit it is reported in, and its cost. Code goes in `src/engine/advisor-sweeps.ts`
(pure request edits, like `src/engine/probes.ts`) and runs as pool jobs through `runProbe`
(`src/worker/jobs.ts`), so the reading, the Tight pricing and the noise/reorder/worse flags of
`src/engine/advisor.ts` (`readProbe`, `headlineOf`) are reused unchanged. Nothing here edits `src/config.ts`
defaults, a pin, a golden or the benchmark.

## Common rules

- **A sweep is a list of probes.** Each step is a `Probe` (`id`, `family`, `label`, `apply`, optional `cost`) whose
  `apply` returns a new `StackRequest`/`CampaignInput` without mutating (the kernel keys tables on identity; share
  every untouched level, as `bonusProbe` and `housingProbe` do). The sweep adds no new job kind.
- **No `budgetMs` in any job** (A0): answers are identical on every device and pool size.
- **Unit: gain on the sweet spot**, the same headline as the C4 card (`headlineOf(row, 'sweet-spot')`): percent of
  the baseline's damage at the sweet-spot stop, with its cost change (silver, merc, time) as `costChange`. A gain is
  never shown negative: a step that reads worse is reported as "no gain" with the existing `worse` flag.
- **Cost model.** One step is one plan plus its Tight readings. Measured in experiment
  `tools/theorycraft/out/191-what-a-percent-is-worth.md`: 29 probes plus the baseline take 0.2 to 12.4 s of wall on
  one lane (a first-run army 224 ms; the 7 000-leadership export 12 403 ms), 16-core pool about x2 to x4
  (`out/190-the-pool.md`). Each question below states its step count; the sum against the 20 s budget is the gate of
  the experiment task (it decides which questions need their own button, as C5 did).

## 1. Dominance / leadership sweep (the owner's "reach a peak")

- **Sweep** of `Housing.dominance` (and, as a second family, `Housing.leadership`) by `+X`, X in steps of
  +2 %, +4 %, +8 %, +16 %, +32 % of the current pool (at least one slot, whole numbers, same rounding as
  `housingProbe`). Five plans per pool, ten for both.
- **Reported as** a curve of `(X, gain %)` and the **peak**: the first step where the marginal gain per step
  (gain divided by the extra percent of pool) falls below `ADVISOR_SWEEP.flattenBelow`, a new constant held in
  `src/config.ts` beside the other advisor constants (initial value 0.05 gain-percent per pool-percent, stated and
  changeable only by the owner). The curve is flagged, not hidden, when it is not monotone (noise of the plan
  search); the peak is read on the running maximum.
- **Cost:** 5 to 10 plans, so roughly 0.2 to 0.5 x the cost of the 29 generic probes. Fits the shared button.

## 2. Next troop tier unlocked

- **Probe**: add to `units` the troop types of the next tier that the profile does not yet have (one tier above
  `tiers[row].max` for the rows in use, from `src/data/types.ts` `UnitDef.tier`), with the existing stack/column
  rules for a top tier (`topTierExcluded`). Mercenaries and monsters are untouched. No new unit is invented; the unit
  list is read from the data files, filtered the way the app filters it.
- **Reported as** gain %, with the training bill of the new tier as the cost ("train tier N+1": silver and time from
  `UnitDef.training` / `cost`), so the card can rank it per cost like the typed upgrades of C2. One probe per
  unlockable row (guardsmen, specialists, engineers, monsters): at most 4 plans.
- **Cost:** at most 4 plans. Rows already at the top tier produce no probe (no section, as the captain section hides
  with no captain owned).

## 3. More merc stock

- **Probe**: `caps` raised by a step for every merc type the account holds a cap of: +10 %, +25 %, +50 % of the
  stock (whole units, at least `CHUNK` = 10, the training chunk the plan already uses). A step per type is not
  needed: the plan sizes all merc types together, so the sweep raises all caps at once; a per-type table is the
  later `user` probe family if the owner wants it.
- **Reported as** gain % per step, plus the **merc added** (units), so the player reads "x more merc is y %".
  Unlimited caps (absent keys) are left alone. An account with no merc stock gets no section (the plan already
  refuses a merc-free account, `docs/PLAN.md` S-61).
- **Cost:** 3 plans.

## 4. Horizon

- **Probe through the request, not a config edit**: `CampaignInput.marchTarget` set to 3, 4 and 5 on otherwise the
  same input; `CAMPAIGN.marches` (4) is read **only** to say which of the three is the baseline. Experiment 73
  (`tools/theorycraft/out/73-plan-horizon.md`) did this offline over 3 to 67 marches.
- **Reported as** per horizon: damage a march (gain % against the baseline horizon), merc burned a march, silver a
  march, and the campaign length (a stock too small for the horizon plays shorter, `plan.marches`). This is a
  trade, not a pure gain: three horizons side by side, never a ranked "best", the owner chooses the cadence.
- **Cost:** 2 extra plans (the baseline is the third), each with its own Tight readings.

## 5. Marginal value of silver

- **Probe**: `CampaignInput.silverBudget` plus and minus a delta, delta being 10 % of the baseline's silver bill
  (the plan's `silver` total) and at least one training chunk's worth; two plans (+ delta and - delta). With no
  budget set, the baseline spends what the stock and leadership allow: the probe sets the budget to the baseline
  bill minus delta (nothing to raise) and reports only the loss side, stating so.
- **Reported as** damage gain % per 1 000 silver on each side (the slope), so "the next silver buys x, the last
  silver you spend costs y". The two sides differing is the point; a flat plus side reads "silver is not binding".
- **Cost:** 2 plans.

## Totals and the budget

| question | plans | notes |
|---|---|---|
| dominance sweep | 5 (10 with leadership) | peak constant in `src/config.ts` |
| next troop tier | at most 4 | none if every row is at the top |
| more merc stock | 3 | none without a merc stock |
| horizon | 2 (+ baseline) | trade, not a ranking |
| silver | 2 | one side only with no budget set |

At most about 26 plans on top of the shared baseline, against 29 for the generic probes. Measured figures belong to
the experiment task (`out/<n>-the-other-questions.md`), which decides whether these ride the existing button or get
their own, within the 20 s budget.
