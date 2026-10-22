# Hero report

Owner, 2026-10-22: *"offer proper hero proposition on ask by the user. We should offer him all the insights he needs to
know where to put his effort next in terms of leveling up and stars. Also give him an insight on which hero is best for
solo or trio marches ... situational (more monsters), more mercs or different mercs."*

Spec from the grilling session of 2026-10-22. Status: built 2026-10-22 (`src/engine/heroReport.ts` model, `src/worker/heroReport.ts` pass `runHeroReport`,
`src/state/heroRoster.ts` lineups and catalog, `src/ui/sections/march/HeroReport.tsx` popup under the captain chips,
`CAMPAIGN.heroReport` in `config.ts`). Experiment 247 (`tools/theorycraft/247-the-hero-report.test.ts`, output
`out/247-the-hero-report.md`) on three owner accounts: **E1** — the best trio over the bar is the best on 4/4, 2/4 and
2/5 stops and gives up at most 4.8 rating on the others, so the footnote names the stops where another trio is best;
**E2** — more mercs and other mercs flip two heroes on the 2026-09-17 export and none elsewhere, more monsters could
not be read on any of the three (no monster in the army) and flips nothing on the 10-07 account: all three stay,
still pending validation; **E3** — a star is ranked per star (a ladder is not a bigger next step), a level step as
probed; a hero holds under 1 rating unit (`holdGain`), which leaves 21–23 of 30 on hold and every banner led by a
never-marched hero's star ladder (the experiment adds all table captains at level 1). **Known limit:** solo and trio are tier-1 readings (the lead march's counts re-priced under the lineup, as the worth list's tier 1), not a re-plan per lineup. **Owner, 2026-10-22 (after review):** heroes with no fighting line (economy) are left out; a hero limited to one kind of march (`onlyOn`: Amanitore, Hercules) is rated apart in a *Situational heroes* block (solo gain where it applies, no solo/trio place, no banner line); *other mercs* now adds the mercenary types the owner did not select (each held as many as his largest stock) instead of removing one. **Open:** tier 1 picks the exact best trio on only 57 % of stops (experiment 193: 28.9 % of rating lost at k = 1, 4.4 % at k = 3); the 246 A recall of 1.00 covers upgrades, not lineups. A confirm step on the top trios would close it. **Owner to confirm:** the
monster shift (move `monsterShift` squads toward the categories of the army's monsters), the other-mercs reading (the
mercenary the lead march uses most is taken out), and the difficulty draft in `config.ts`. It reuses the captain upgrade worth list
(`docs/plans/captain-upgrade-worth.md`: `runUpgradeWorth`, level probes, star ladder, tier 1 / tier 2) and the lineup
screen (`src/worker/captainAdvice.ts`, `src/state/captainLineups.ts`).

**Roles apart (owner, 2026-10-22, after the Leonidas drill-down, experiments 248/249).** Solo and trio marches weigh the
same, so they are no longer averaged: every upgrade is read in the lineup it plays in — each hero alone, and each member of
the best trio inside that trio — against the same lineup without it, on the lead march's counts re-priced (tier 1), then
the best `CAMPAIGN.heroReport.confirm` upgrades are planned in full (tier 2). The report has a banner and a top three per
role (`banner.solo` / `banner.trio`, `plan.solo` / `plan.trio`); a tile carries `soloUp` and, for a trio member, `trioUp`.
The worth list pass is no longer run by the report (the lead-lineup reading it gave is replaced by the two roles).
*Stars to add:* the star count with the best gain per star, told with the star it ends on, the change a further star
brings, and the count with the largest total when that is a different one. *The trade:* a star count whose net rating over
the bar (best reading per stop, planned in full) is below −`tradeWarn` (1) is named as worsening the trade. Measured on
the live camp and three battle profiles (`out/249-the-roles-apart.md`, tier-1-only run in `…-tier1-only.md`): the re-priced
reading alone puts the re-plan's top three in its own top three on 7/12 solo and 4/12 trio, so tier 2 ships; 81 of 200
upgrades have a single stop below −1 but only 7 a net below −1 (3 below −2), a single stop swings by 5 or more on the
re-plan's own noise, so the warning reads the net. Heroes with no fighting line are out; a hero limited to one march type
(Amanitore, Hercules) is rated apart in *Situational heroes*; *other mercs* adds the unselected merc types. Known limits:
a hero outside the best trio has no trio reading; tier 2 is bounded by `confirm` (120 plans); on a 6-hero account the pass
takes 25–35 s on one lane. Experiment 247's output predates this change.

**Trios, outliers and pairs (owner, 2026-10-22, experiment 250).** The best trio is no longer the re-priced screen's: the
best `trioConfirm` (8) trios are planned in full against the march with no hero planned the same way (experiment 250: on
the two owner accounts with at least four heroes the re-priced screen alone names a different trio from the oracle that
plans all 20, the confirmed top eight names the oracle's on both; 193 had 57 % of stops for the screen alone, 91 % for the
top eight). The matrix and the flips keep reading the re-priced default (`quick`), like the situations. Trios within
`outlierShare` (85 %) of the best are listed, up to `outlierMax` (4): those with a member that is no top-three solo hero are
told as a surprising match under the best trio, the others stay folded under *Other close trios*. Each hero tile says what
it pairs with: the troop types its lines name (`melee`, `monster`, … none for an army-wide hero) and the account's fielded
mercenaries that match, or "none fielded" — awareness only, no figure moves. Known limit: situations still read trios
re-priced only.

## Problem

The captain advice answers "which lineup" and the worth list answers "which upgrade", each as a flat result the owner
does not see. Nothing tells the owner, hero by hero, what role a hero plays (solo or in a trio), where levels and stars
pay, or whether the answer changes against more monsters or with more or different mercs.

## Solution

A **Heroes report**, run only when the owner asks, shown in a full-page popup and kept until the next ask. One button
("Analyse my heroes") runs the lineup pass, the upgrade worth list and the role pass together. The March section and
`AdvisorCard` are untouched.

- **Metric**: the owner's rating (`CAMPAIGN.markerRates`) over the five stops of the bar, gain clamped at 0. Gain per
  cost where the owner typed a cost, raw gain otherwise; the unit is shown on every row.
- **Roles**: *solo* is a march with troops and exactly one hero; *trio* is three heroes. No duo role. A
  two-hero lineup may only appear as a partner or bench hint.
- **Situations**, all fixed in `config.ts`, no input: *more monsters* (enemy stack shifted toward monster squads by a
  fixed step), *more mercs* (allowance +25 %), *different mercs* (the plan's best alternative mix).
  **Pending validation (owner, 2026-10-22):** all three are an experiment; a situation that never flips a verdict is
  removed. Marked as such in `config.ts` and on the report.
- The march type (`SetupMarchType`) is not an input of the report; `onlyOn` heroes show as a condition tag.

### Blocks, in build order

1. **Verdict banner**: the top 2–3 actions with their gain; only 2 when the third gain is marginal.
2. **Roster board**: dense tiles, maximum information per pixel. Name, level and star glyphs, solo and trio-contribution
   bars on one scale, a verdict glyph (level / star / both / hold), a "flips under…" tag. Heroes that matter nowhere
   collapse into one line of names.
3. **What to do on the top 3 heroes**: level only, stars only, or both, naming the upgrade. No per-hero ladder charts.
4. **Best trio across all plans**: one trio chosen on its average over the five stops; per-stop numbers a footnote.
5. **Situation matrix**: heroes against {default, more monsters, more mercs, different mercs}, marking where the best
   hero flips.
6. **Worth getting** (low priority, last): unowned heroes only here. A `config.ts` list gives each captain a difficulty
   marker 0–10 (0 easiest to own; equal numbers form a tier), a first draft proposed from the captain table for the
   owner to correct. It recommends the highest-rated unowned hero among the easiest tier above what the owner holds.

## User stories

1. As the owner, I want a button that builds the hero report only when I ask, so that nothing runs on every Generate.
2. As the owner, I want the report in a full-page popup, kept until my next ask, so that I can come back to it.
3. As the owner, I want a banner of the top 2–3 actions, so that I know where to put effort next.
4. As the owner, I want the banner to show only 2 when the third gain is marginal, so that every line is worth it.
5. As the owner, I want a dense roster board, so that I read every hero's role and upgrade at a glance.
6. As the owner, I want heroes that matter nowhere collapsed into one line, so that they take no space.
7. As the owner, I want the top 3 heroes told level only, stars only, or both, so that I know what to upgrade.
8. As the owner, I want one best trio over the whole bar, so that the lineup is versatile and realistic.
9. As the owner, I want solo scored as one hero with troops, so that the role is a real march.
10. As the owner, I want a situation matrix with flips marked, so that I see when the best hero changes.
11. As the owner, I want the situations marked pending validation, so that I remember to judge them.
12. As the owner, I want unowned heroes only in a separate low-priority block ranked by difficulty, so that the
    main report holds what I can upgrade.
13. As the owner, I want gain per cost when I typed a cost and raw gain otherwise, with the unit shown, so that the
    order follows what I can afford.
14. As the owner, I want the March section and `AdvisorCard` unchanged, so that nothing else moves.
15. As the owner, I want one worker and six to give the same report, so that results never depend on timing.
16. As the owner, I want no benchmark scenario to get worse and no pin re-based, so that the plan is never costed.
17. As a developer, I want each test written once and run on the TS and kernel paths, so that the two never drift.
18. As a developer, I want the report tested through one entry point, so that a refactor breaks no test.

## Work, in order

### 0. Experiments (before each new pass)

- **E1 — solo and trio scores**: do the role scores rank the heroes sensibly on the benchmark cases, and is the best
  trio over the five-stop average stable against the per-stop best? Output to `tools/theorycraft/out`.
- **E2 — situations**: does any of the three situations flip a verdict on the benchmark cases and the live account?
  Decides which stay (pending validation).
- **E3 — verdict thresholds**: where does a third action become marginal; the cut and the "level / star / both" rule
  (knee of the gain against levels and stars from the existing probes).

### 1. Role pass (engine + worker)
Solo score, trio contribution and best trio over the bar, on the lineup screen and the tier 1 re-pricing.

### 2. Situation pass
The three fixed situations re-run the role pass; the flips are the output.

### 3. Report model
One data object: banner actions, roster tiles, top-3 plan, best trio, situation matrix. Pure, tested through the
single entry point.

### 4. UI
Button, full-page popup, blocks 1–5, results kept until the next ask. Design rules in `docs/design-rules.md` cited
in the brief.

### 5. Worth getting
Difficulty list in `config.ts`, draft from the captain table for the owner to correct, block 6.

## Testing decisions

- **One seam**: the hero report entry point. Input: the account's captains with levels and stars, the lead march,
  the rates. Output: the report model. Tests assert on actions, roles, trio and flips, not on job splitting.
- Each test runs on the TS and kernel paths, red on both first, then green on both.
- The benchmark is non-regression; only the owner registers a new baseline.

## Out of scope

- A duo role, a march-type input, any input for the situations.
- Unowned heroes outside block 6 (`captainsIncludeUnowned` stays off for the rest).
- Changing how a lineup is chosen, the stops of the bar, or the March section.

## Further notes

- `CAMPAIGN.captainMaxLevel` (100) stays a placeholder; the ranking does not depend on it.
- The situations and the monster shift step are pending validation; the experiment E2 decides what stays.
