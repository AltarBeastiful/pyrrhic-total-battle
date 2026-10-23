# The hero champion

Owner, 2026-10-22: *"for solo march we want the best hero, not to train all heroes to become semi good at solo
march."* The hero report's "best for solo" ranks the next star or level by marginal gain, which is why Bernard
(+5.36 at ★0→★1, +7.2 in all) sits in the top three. That answers "what does the next step buy", not "who is
the best hero, and where does my levelling effort go".

## Problem Statement

I level and star up heroes slowly. Stars are long and hard to get; levels are quicker. I need to know which
hero is the best solo hero **across the whole climb**, not just at the top: one who stays ahead of the others
as everyone gains a little. A cheap star that gives +2 on a hero who is still below Cleopatra on every march
is wasted. Some stars also lower the rating (a health boost that breaks a stacking pattern) and the next star
catches up; I have to be told about those, not shown a lone "a further star loses".

## Solution

The hero report becomes a story told with interface only, no explanatory prose (any text lives in tooltips):

1. **Roster**: every hero as a tile, grouped in S / A / B tiers. Heroes that another hero beats on every march
   (solo and trio) at every grid point are collapsed under a one-click **Replaced** row. Each tile carries a
   today → potential curve with a "you are here" marker.
2. **Right now**: the existing top-three solo podium, unchanged.
3. **Champion**: exactly one solo champion, always named, with a challenger and the grid points where the
   challenger overtakes. The champion is the hero with the highest average lead over the field across an
   absolute grid (provisional, see Experiment gate).
4. **Dips**: a star that lowers the rating shows as a valley on the curve. When a later star recovers past the
   pre-dip level, the two are advised as one package ("★2 loses 2.4, ★3 recovers it and gains +5"); when none
   does, the dip is flagged "don't star past here". Effort advice is always about the package.
5. **Alternatives**: for every hero the level-only path beside the star path (levels are the quick route),
   so something accessible is always on screen. There is no lock, toggle or manual entry.
6. **Trios**: the same curve-based ranking, secondary to the solo champion, with the surprising trios kept.

## User Stories

1. As a player, I want one named solo champion, so that I know where to put my levelling effort.
2. As a player, I want the champion chosen by how they compare across the whole climb, so that a hero who is only good at ★6 does not win.
3. As a player, I want every hero rated at the same star and level points, so that the comparison is fair whatever each hero's current state.
4. As a player, I want a "you are here" marker on each hero's curve, so that I see how far I am from each point.
5. As a player, I want a challenger shown beside the champion, so that I see how close the race is.
6. As a player, I want to see the grid points where the challenger overtakes the champion, so that I know when my choice would flip.
7. As a player, I want a hero whose next star is cheap but who stays below the champion everywhere to read as not worth the effort, so that I stop investing in Bernard-type heroes.
8. As a player, I want stars that lower the rating shown as valleys on the curve, so that I understand why a star "loses".
9. As a player, I want a valley followed by a catch-up advised as one package, so that I do not skip the star that unlocks the gain.
10. As a player, I want a dip with no catch-up flagged "don't star past here", so that I stop at the right rung.
11. As a player, I want the level-only path next to the star path for each hero, so that I have something accessible to do while a star is far away.
12. As a player, I want heroes grouped into S / A / B tiers, so that I read the roster at a glance.
13. As a player, I want heroes beaten everywhere collapsed under "Replaced", so that obsolete heroes do not clutter the report.
14. As a player, I want the Replaced row one click away, so that nothing is hidden for good.
15. As a player, I want the top-three podium to stay as it is, so that I still see who is best right now.
16. As a player, I want the same curve-based ranking for trios, below the solo champion, so that Aydae-type trio heroes still surface.
17. As a player, I want the surprising trios kept, so that I keep the insight I already value.
18. As a player, I want the page to be graphical, with explanations in tooltips, so that it reads as a story and not a wall of text.
19. As a player, I want the page to show cheap curves first and sharpen them when the full pass ends, so that I am not waiting on a blank screen.
20. As a player, I want the numbers I act on (champion, challenger, dips) to come from a full re-plan, so that I can trust them.
21. As a player, I want a "no clear margin" cue when champion and challenger are nearly level, so that I do not over-read a thin lead.
22. As the owner, I want an experiment that prints the grid curves, the champion and challenger, the valleys, and where the average-lead score disagrees with "rating at the highest star", so that I judge the score before any UI is built.
23. As the owner, I want the full-grid generation cost measured first, so that any speed-up is chosen from a number.

## Implementation Decisions

- **Rating**: a hero's rating at a grid point is the existing solo rating on the lead march's bar, mercs included, the same quantity the report uses today.
- **Grid** (settled by experiments 260 and 261, 2026-10-23): per hero, from the level the hero is at up to the top level (`CAMPAIGN.captainMaxLevel`, 100), crossed with stars 0 to 6. A hero is compared only at points it reaches. The step is 10 levels, the hero's own level always included; the champion's and the challenger's curves are sharpened to 5. Experiment 260 measured the step-5 grid on the live account: 728 plans in 665 s on one worker (0.91 s a plan), about 45 s on the 15 workers of the owner's machine.
- **Reading**: every grid point is planned in full (`client.probe` against the march with no hero planned the same way) and rated as the mean gain over the stops of a **trimmed bar**: the stops kept are the silver saver, the sweet spot and the stop just below the all-in. The march with no hero has its own, shorter bar (burn saver, sweet spot, all-in), so against it the all-in is left out and the rest is read. The re-priced tier 1 is no longer shown anywhere: it differed from the full plan by more than 2 points on 551 of 728 readings (experiment 260).
- **Heroes in the race**: a hero that counts on one kind of march only (`onlyOn`: Amanitore on a group march, Hercules on an epic one) never enters the solo or trio race, whatever the setup's march type; it is listed apart, rated on its own.
- **Champion score (accepted 2026-10-23)**: for each hero, the average over the grid points it reaches of its rating minus the best rating among the other heroes that reach the same point, every point weighted equally; "leads at X of Y points" shown as a consistency check. Always one champion; the second is the challenger. On the owner's 2026-10-22 account it names Cleopatra (+14.1, leads at 70 of 70) with Leonidas second, and agrees with the rating at the highest star except for the order of the low heroes.
- **Valleys**: found on each hero's star curve at fixed level. A dip followed by a later rung that exceeds the pre-dip level forms a package; its advice is the package's total gain. A dip with no recovery is a dead end. **Noise guard (measured, experiment 262)**: the same point planned under five housings within ±2 % swings by a median 5.5 rating points (90th percentile 9.3, max 18.6; Leonidas 10.0, Cleopatra 1.6), more than most valleys are deep, so no depth threshold can separate a real valley from the plan's own noise (at 1, 2 and 3 noise floors it keeps none). Only 18 of 26 single-plan valleys survive in the mean of five. Therefore a curve the page tells a valley or a package from is the **mean of three plans** (housing −1 %, 0, +1 %), and a valley is told only when it is in that mean; the champion's, the challenger's and the advised trio members' star ladders are read this way (about 21 plans a hero at its own level), the other heroes keep their single plan and are told no valley. Averaging three cuts the noise by about 1.7.
- **Alternatives**: level-only and star paths per hero from the same grid; no lock, no shard or cost model (the app has no cost or blocker data for heroes, and none is added).
- **Tiers**: S is the champion zone, A serious challengers, B useful in some marches; the exact cut comes from the grid. A hero is Replaced when one other hero beats it on every point of the hero's own grid, so the other must reach every one of them (experiment 260 first compared on shared points only and declared a low-level hero beaten without ever meeting it at its own levels).
- **Trios** (experiment 261): the trios of the heroes that count on any march are planned as they stand (35 plans on the owner's account, 36 s), then for the best five the ladder of each member alone: stars 0 to 6 at the member's level, levels to 100 every 10 at its star, the other two held as they are. Secondary to the solo champion. The advice names the trio to grow (the best potential, not necessarily the best today: on the owner's account three trios sit within 0.3 today, and the one with the highest ★5 ceiling is advised) and the order of effort across its members. A ladder whose ★6 is below ★5 stops at ★5.
- **Speed**: the pass runs in waves under the report's own clock (150 s, the existing cut warning carries over), so the page always has a picture: (1) every hero at its own level, stars 0 to 6; (2) the remaining level steps, the leading heroes first; (3) the step-5 sharpening of the champion's and the challenger's curves; (4) the trios as they stand, then the ladders of the best five. A free tier-1 screen (0.1 s) only orders the jobs; its numbers are never shown. The page draws in place as each wave lands. The jobs are the existing `client.probe`, run through `pool.map`. **Kernel functions are created when the measured cost asks for them** (owner, 2026-10-23): the first build runs on what exists; after each wave is timed, any step that dominates the clock (the per-point plan, the trimmed-bar read, the champion-score or valley pass over the grid) gets an AssemblyScript function in `kernel/`, written once with its test running on both the TypeScript and the kernel paths (red on both first, then green on both), gated byte-identical against the TypeScript reference like the earlier ports. No kernel work is done on a guess.
- **Measured cost (experiment 263, 2026-10-23, 2026-10-11 account)**: the whole pass is 631 plans, 212 s on one worker and about 16.6 s replayed on 15 workers (mean plan 0.34 s, longest 0.85 s), against the 150 s clock. The main thread outside the plan batches (lineup totals, the champion's build, bookkeeping) is under 0.1 % of the pass, so the champion score, the valley pass and the trio build are not candidates. The plans dominate and already run in the kernel. **No kernel function is asked for**; the next lever, if the clock ever binds, is fewer plans. Batching: every valley, trio-ladder and three-plan read goes out as one pool batch (the tail where workers idle cost 16.6 s against 14.3 s for the floor of one batch).
- **Replaced upgrade ranking**: the marginal "best for solo / best for trio" upgrade lists give way to the curve-based views above; the top-three podium remains.
- The report keeps its own clock; the existing hero-report clock and its cut warning carry over.

## Testing Decisions

- Good tests assert external behaviour only: given an account, the engine returns the named champion, challenger, valleys, packages, tiers and replaced set. No test pins an internal structure.
- One seam: the hero report's engine function, the highest available. Each test is written once and runs on the TypeScript and the kernel paths, red on both first, then green on both.
- A thin render test checks the champion, the podium, the tiers and the Replaced row; the usual e2e pass follows `pnpm build`.
- Prior art: the existing hero-report experiments (246-251) and their tests under `tools/theorycraft`, and the benchmark's non-regression rule (a scenario must never get worse; only the owner registers a new baseline).

## Experiment gate

Before any UI work: a new numbered experiment under `tools/theorycraft`, run on the live account, that

1. generates the full grid for every hero and times it;
2. prints each hero's curve, the champion and challenger under the average-lead score, the valleys and packages;
3. lists where that score disagrees with the simple "rating at the highest star count" ranking.

The owner read it (2026-10-23): the average-lead score is accepted, and the full plan replaces tier 1. A noise calibration for the valleys comes before the screen is drawn.

## Out of Scope

- Shard, level or time costs for heroes, and any lock, toggle or manual entry.
- Changing the engine's rating itself.
- Attributing dips to health-boost stacking in the engine (the code does not model it; the experiment measures the dips as they come).
- The layout polish pass for crowded screens (its own story).

## Further Notes

- Conclusions drawn from experiments 260 and 261 on the 2026-10-22 account (the advice the page must be able to give): solo, Cleopatra with stars before levels (★1→★6 at L53 is +36, L53→L100 is +9; a level step of 10 is about +1.9; ★2 to ★6 add 2.8, 6.1, 5.6, 11.1, 11.0), nothing spent on the others; trio, Cleopatra first in stars, then Leonidas (stars, and levels as the quick route), then Aydae for the ★5 jump only (★4 alone is flat), Alexander/Ingrid/Bernard/Minamoto not worth the effort.
- Facts found 2026-10-22: no hero cost or blocker data exists; the max star is 6 for every hero; the level probes today are only 5, 10, 15; the full re-plan pass costs about 25-65 s per lane against a 150 s budget; "a further star loses" and "worsens the trade" currently come from re-plan noise and count changes, not stacking logic.
- Related: the hero report commits 4797836 to 251c984 and experiments 246-251; the gate experiments are 260 (solo grid, `tools/theorycraft/260-the-hero-champion.test.ts`) and 261 (trio ladders, `261-the-trio-ladders.test.ts`).
