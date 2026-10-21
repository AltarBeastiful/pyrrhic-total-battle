# Captain upgrade worth

Owner, 2026-10-21: *"lets improve captain propositions, we should have a way to know which captain upgrade brings
up worth on average across the board, starting with the current march."*

Spec from the grilling session of 2026-10-21. Status: built 2026-10-21 (`runUpgradeWorth` in `src/worker/captainUpgrades.ts`,
`worthUpgrades` / `inferLevelGain` in the engine, `captainWorthCandidates` in the state layer, the profiling run's
captain phase). Experiment 246 (`tools/theorycraft/246-the-captain-worth.test.ts`, output `out/246-the-captain-worth-A.md`
and `-B.md`): **A** — no miss at K = 3, 5 or 8 on three accounts (186 / 186 / 183 probes, each with every table captain
added at level 1; the worthwhile set is only 1–2 probes, so recall is coarse); **B** — top 3 / 5 / 8 identical at every
level step on all cases, order identical except +1…+3 on the live camp (gains there are a few rating units, where the
rating steps in whole units). Tier 2 stays at `CAMPAIGN.captainWorthTop` = 8.
**Owner to confirm:** `CAMPAIGN.captainMaxLevel` (100) is a placeholder — the game data holds no max level. The
2026-09-24 browser fixture no longer parses (no `savedStacks`) and is left out of the cases.

## Problem

The upgrade pass (`src/worker/captainUpgrades.ts`, W17 C5b) asks one question per captain: the next star or the
next +1 level, read against the lead lineup's plan. A single level is too faint to read, so the list does not tell
the owner which upgrade is worth the most. There is no comparison across captains, and nothing shows whether the
pass misses an upgrade that would pay.

## Solution

One ranked list of captain upgrades, ordered by worth:

- **Worth** is the gain on the owner's rating (`CAMPAIGN.markerRates`) averaged over the five stops of the bar,
  never below 0. The per-stop gains are kept beside it.
- **Levels** are probed at +5, +10 and +15 (each clamped to the captain's max level). The levels between are
  inferred from the per-level bonus in the game data (`perLevel` in the captain progression, constant per level).
  A level step reports a gain per level so captains compare fairly. Where a captain's steps are not constant, the
  exact level is probed instead.
- **Stars** are probed one by one, every remaining star up to max, alone and cumulative (star+1, star+2, ...). No
  inference between stars: each brings a different bonus.
- **Two tiers.** Tier 1, *same march*: keep the current march's troops and size, re-price with the upgraded
  captain, no re-planning. A benched captain is swapped into the best slot of the current lineup (the existing
  re-priced lineup screen) and the same troops are re-priced. Tier 2, *regenerate*: re-plan the whole bar with the
  current settings for the top N of tier 1 (as the confirm step does today, `CAMPAIGN.captainUpgradeConfirm`).
  Both gains are reported.
- **One list** across all captains and both kinds of upgrade: captain, upgrade, tier 1 gain, tier 2 gain, gain per
  level for level steps. When the owner typed a cost, the order reads gain per cost; otherwise raw gain.

Where the list is shown to the owner is decided later. This work does not touch `AdvisorCard`.

## User stories

1. As the owner, I want one ranked list of captain upgrades, so that I can see which one is worth the most.
2. As the owner, I want each upgrade's worth to be its rating gain averaged over the five stops of the bar, so that
   one number summarises the whole bar.
3. As the owner, I want the per-stop gains kept beside the average, so that I can see which stop an upgrade helps.
4. As the owner, I want an upgrade never to read as a loss, so that the list only shows what could help.
5. As the owner, I want level upgrades probed at +5, +10 and +15, so that the gain is large enough to read.
6. As the owner, I want the levels in between inferred from the game data's per-level bonus, so that I do not pay
   for a probe at every level.
7. As the owner, I want a gain per level on every level step, so that captains with different step sizes compare
   fairly.
8. As the owner, I want a level step clamped to the captain's max level, so that no row asks for a level that does
   not exist.
9. As the owner, I want a captain whose level steps are uneven probed at the exact level, so that an inference never
   hides a jump.
10. As the owner, I want every remaining star of every captain probed, so that a large star bonus is never missed.
11. As the owner, I want stars probed alone and cumulative (star+1, star+2, ...), so that I can see whether to
    save for a later star.
12. As the owner, I want a tier 1 gain that keeps the current march's troops and size and only re-prices them, so
    that every upgrade has a fast, comparable number.
13. As the owner, I want a tier 2 gain that regenerates the bar with my current settings for the best upgrades, so
    that the verdict includes how the plan would change.
14. As the owner, I want both gains shown, so that I can see when regenerating changes the verdict.
15. As the owner, I want a benched captain's tier 1 gain to be their best lineup swap on the fixed march, so that
    captains outside the lead lineup are in the same list.
16. As the owner, I want the list to read gain per cost when I typed a cost, so that the order follows what I can
    afford.
17. As the owner, I want the list to read raw gain when I typed no cost, so that it still works without one.
18. As the owner, I want captains and upgrades of every kind in the one list, so that a star and a level step
    compete on worth.
19. As the owner, I want captains I do not own left out in production, so that the list only holds what I can
    actually upgrade.
20. As the owner, I want an experiment that tests tier 1 against a full regeneration on all benchmark cases, so
    that I know the cheap tier does not miss a worthwhile upgrade.
21. As the owner, I want the benchmark cases to include the captains they do not field, so that the experiment
    covers upgrades the cases never tried.
22. As the owner, I want the recall of tier 1 reported at K = 3, 5 and 8, so that I can pick the smallest N for
    tier 2.
23. As the owner, I want an experiment comparing the three level probes with exhaustive +1 to +15 probing, so that I
    know the inference ranks the same.
24. As the owner, I want the experiment results written to `tools/theorycraft/out`, so that I can read them later.
25. As the owner, I want the "Profile everything" captain phase to compute the new list, so that I can read it in
    the debug output.
26. As the owner, I want the March section and the advisor card left as they are, so that nothing changes on screen
    until I decide where the list goes.
27. As the owner, I want one worker and six to give the same list, so that a result never depends on timing.
28. As the owner, I want no benchmark scenario to get worse, so that the change never costs the plan.
29. As the owner, I want the pins left alone until I accept a trade, so that only I register a new baseline.
30. As a developer, I want each test written once and run on the TS and kernel paths, so that the two never drift.
31. As a developer, I want the pass tested through one entry point, so that a refactor of its jobs breaks no test.
32. As a developer, I want the design to change if an experiment finds a miss, so that a failed gate does not ship.

## Work, in order

### 1. Experiment A — does tier 1 miss a worthwhile upgrade?

For every benchmark case, with every captain the case does not field added at level 1, star 0: run tier 1 on every
upgrade, then regenerate every upgrade in full with no top-N cut. A *miss* is an upgrade ranked above K by tier 1
whose full-regeneration gain is at least 90 % of the best. Report recall at K = 3, 5 and 8. Target: no miss at
K = `captainConfirm` (8). Output to `tools/theorycraft/out`.

### 2. Experiment B — do +5/+10/+15 with inference rank like exhaustive probing?

Same setup. Run every level step from +1 to +15 in full and compare its ranking with the one built from the
three probes and the linear inference. Target: the same order of upgrades, and the same top K.

### 3. The pass

Only after A and B. Tier 1 and tier 2 in the captain upgrade pass, the +5/+10/+15 level probes with inference,
the star ladder, the benched-captain swap, and the one ranked list. If an experiment finds a miss, the design
changes here (a larger K, a different tier-1 read) before anything ships.

### 4. Profile everything

The captain phase of the profiling run (`Profile everything`, a debug list the owner does not see) computes the new
list instead of the old one. `captainsIncludeUnowned` stays off in production.

## Implementation decisions

- The unit of the answer is an upgrade row: captain, kind (star or level), size (stars or levels), tier 1 gain,
  tier 2 gain (absent when not regenerated), per-stop gains, gain per level (level steps only).
- A gain is the average over the bar's five stops of the rating gain against the lead lineup's plan. It is
  clamped at 0, so an upgrade never reads as a loss (as C3 reads a probe today).
- Level inference uses the captain progression's constant `perLevel`. The inferred gain for n levels is the gain
  of the nearest probe scaled by the bonus ratio, never invented from a fit of the gains alone.
- Tier 1 needs no new planner: it re-prices an existing plan under new totals. Tier 2 reuses the plan job of the
  current pass.
- Results are merged by position, never by arrival, and no job carries a clock, so one worker and six give one
  answer (as today).

## Testing decisions

- **One seam**: the captain upgrade pass. Input: the lead lineup, the current march, the account's captains with
  their levels and stars. Output: the ranked list. Every behaviour is tested through it: the three level probes and
  the inference, the star ladder, the benched-captain swap, the tier 1 to tier 2 handoff.
- A good test reads the list and asserts on gains, order and which rows exist; it does not assert on how the
  pass splits its jobs.
- Each test is written once and runs on the TS path and the kernel path, red on both first, then green on both
  (`captainUpgrades.test.ts` is the prior art).
- The experiments A and B sit outside the seam. They call the same entry point on the benchmark cases and are not
  unit tests.
- The profiling run is checked by one test that its captain phase calls the new pass and returns its list. Its
  output format is not tested.
- The plan benchmark is non-regression: no scenario gets worse, and the pins are never re-based without the owner.

## Out of scope

- Any UI: `AdvisorCard` and the March section stay as they are. Where the list shows is a later decision.
- Captains the account does not own in production (`captainsIncludeUnowned` stays off). Only the experiments add
  missing captains.
- Changing how a lineup is chosen, or the captain advice (lineup) pass.
- Changing the stops of the bar.

## Further notes

- The existing pass tries a benched captain in every lineup that fields it, screened and then confirmed; tier 1
  generalises that screen to every upgrade on the fixed march.
- If experiment A shows tier 1 ranks well enough at a small K, tier 2 can shrink and the pass gets cheaper; if not,
  the confirm count rises. That is the main thing the experiments decide.
