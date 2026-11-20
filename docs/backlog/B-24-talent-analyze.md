---
type: reference
title: "B-24 Talent analyze: what each rank of this talent is worth to my army"
created: 2026-11-20
tags: [backlog, spec, talents, engine, ready-for-agent]
related: ['[[B-21-hero-talent-planner]]', '[[B-22-talent-priorities]]', '[[B-23-talent-usefulness]]', '[[design-rules]]']
---

# B-24 Talent analyze: what each rank of this talent is worth to my army

Status: `ready-for-agent`. Written from the 2026-11-20 grilling. Nothing is implemented. Rule numbers refer to [[design-rules]].

## Problem Statement

The talent detail panel shows what a rank adds in stat terms (for example "+3 % melee attack"), but not what it is worth to the army the player is about to march. The player cannot tell whether the last ranks of a talent still pay, or whether the first ranks do nearly all the work, without changing their account by hand and re-running the March.

## Solution

An **Analyze** button in the selected talent's detail panel. On press, the app prices the player's currently selected army with this talent at rank 0, at its maximum rank, and at up to three ranks in between, under two leadership shapes (the pool filled to 100 % and to 80 %). The panel shows a table of ranks with the march rating gain over rank 0 for each shape and their average, and below the table a line chart of the same numbers: the average bold, the two shapes faint and labelled. The result is kept until the account or the army changes, and then is marked stale.

## User Stories

1. As a player, I want an Analyze button in a talent's detail, so that I can ask what this talent is worth to my army without leaving the page.
2. As a player, I want nothing to be computed until I press it, so that browsing the tree stays instant.
3. As a player, I want the analysis to use the army I have selected in March, so that the answer is about the march I will actually send.
4. As a player, I want every other talent left as I have set it, so that the only thing that changes between points is this talent's rank.
5. As a player, I want rank 0 as the baseline, so that each gain reads as "what this talent adds, compared to not having it".
6. As a player, I want the gain expressed in march rating, so that the number is the same one the plan and the advisor use.
7. As a player, I want ranks 0, the maximum, and a few evenly spaced ranks between, so that I see the curve without waiting for every rank.
8. As a player, I want a talent with few ranks to be priced at every rank, so that short talents are exact.
9. As a player, I want the ranks to be whole numbers with no duplicates, so that the table has no repeated rows.
10. As a player, I want two leadership shapes (100 % and 80 %), so that I see whether the talent's value holds when my pool is smaller.
11. As a player, I want the average of the two shapes, so that I get one headline number per rank.
12. As a player, I want each shape also drawn faintly and labelled, so that I can see when the 80 % army behaves differently.
13. As a player, I want the table first and the chart after it, so that I read exact numbers before the picture.
14. As a player, I want the chart's x axis to be the rank and its y axis the percent gain, so that a flat tail is obvious.
15. As a player, I want the table and the chart to agree to the digit, so that I can trust either.
16. As a player, I want a progress state while it runs, so that I know the button did something.
17. As a player, I want to cancel a running analysis, so that I can move on to another talent.
18. As a player, I want selecting another talent to cancel the running analysis, so that a stale answer never lands on the wrong tile.
19. As a player, I want the result kept when I leave the talent and come back, so that I do not pay twice for the same question.
20. As a player, I want a kept result marked stale when my account or selected army changes, so that I never read an old number as current.
21. As a player, I want a Re-analyze button on a stale result, so that I can refresh it in one press.
22. As a player, I want a clear message when no army is selected or the army is empty, so that a disabled button explains itself.
23. As a player, I want a talent that gives nothing to this army to show a flat zero line, so that "useless for you" is an answer and not an error.
24. As a player, I want a talent whose value is non-numeric (an economy or archeology talent) to say so, so that I am not shown a meaningless zero.
25. As a player, I want the shapes named in the panel (for example "Pool 100 %" and "Pool 80 %"), so that I know what was averaged.
26. As a player, I want the chart to be readable on a phone, so that the panel does not overflow sideways at 390 px.
27. As a player, I want the chart and table to be reachable by keyboard and a screen reader, so that the result is not mouse-only.
28. As a player, I want the chart colours to pass the same contrast rules as the rest of the page in light and dark, so that I can read it in either theme.

## Implementation Decisions

- **One question, one job.** A new pure engine function answers: given the account, the selected army, a talent and a list of ranks and pool fills, return the march rating at each (rank, fill) pair. It builds each bonus total by setting only this talent's rank, re-sizes the army to the fill, and reads the rating with the same rating function the March and the advisor use. Everything else on the account is untouched.
- **Rating, not stat.** The gain is `rating(rank) / rating(0) - 1` per shape, expressed in percent. Rank 0 is "this talent removed", not "this talent as currently spent". **Amended by [[B-25-copy-talents-to-battle]]:** when the Hero Talents source matches the talent tree, the baseline is the held rank and only ranks above it are priced; the table names its baseline.
- **The army is the one selected in March, as is.** Troop types and counts are the current selection; only the leadership fill is re-sized per shape, using the existing re-size path.
- **Shapes** are a config entry with the values 100 and 80, so the owner can change them in the one place the other campaign knobs live. 80 is below the 90 % floor of the existing edit fills, where mercenaries start to drop out and damage falls off; the chart therefore labels each shape and does not hide the bend.
- **Ranks.** Rank 0, the maximum, and up to three evenly spaced whole ranks between (about 25 %, 50 %, 75 %), de-duplicated and sorted. A talent with four or fewer ranks is priced at every rank. At most five ranks times two shapes = ten ratings per analysis.
- **Average** is the plain mean of the shapes' percent gains at the same rank.
- **Execution.** The job runs on the calculation pool as one job per rank-and-shape pair, merged by position so one worker and six give the same answer. It takes an abort signal, reports progress, and carries no clock.
- **Caching.** The result is stored in the UI result store keyed by talent, ranks and shapes, with a fingerprint of the account bonuses and the selected army. A fingerprint mismatch marks the result stale; nothing is written to the saved account.
- **UI.** The button, the progress and cancel state, the table and the chart live in the talent detail panel. The chart is drawn after the table and follows the data-visualisation palette rules (one bold series, two faint series, direct labels, no colour-only meaning). Copy follows the "merc" wording rules and the one-sentence helper text rule.
- **Non-gain talents.** If a talent's stats have no effect on battle rating (economy, archeology, building production), the button is replaced by a one-line note and no job is run.
- **No schema change.** Nothing is added to the saved account.

## Testing Decisions

- **What a good test is.** It states inputs and checks what the player sees or what the function returns: ranks priced, gains, the average, stale and cancelled states. It does not look at how jobs are split across workers.
- **Seam 1, the engine entry point.** One table-driven test file for the analyze function, written once and run on both the TS and the kernel path, red on both first, then green on both. Cases: rank 0 gives exactly 0 % on every shape; a talent that adds nothing to the army gives a flat zero; gains never decrease with rank for a pure attack talent; the average equals the mean of the shapes; a talent with three ranks is priced at all four points; rank lists are sorted, unique and include 0 and max; the 100 % shape equals the March's own rating of the same army; an empty army returns a typed "nothing to analyze". Properties: results do not depend on job order or pool size; every other talent's rank is unchanged in each priced scenario.
- **Seam 2, the talents page.** One page component test in the style of the existing talents page test: the button is present on a battle talent and absent on an economy one; pressing it shows progress, then the table, then the chart; selecting another tile cancels; changing the account or the army marks the result stale and offers Re-analyze. No sideways overflow at 390 px is left to the end-to-end journey.
- **Benchmark gate.** The change touches no planning code, so the benchmark must be byte-identical; run it before the push as the standing criterion for engine items.
- **Prior art.** The hero report and captain screen tests (`heroReport.test.ts`, `captains.test.ts`) for job merging and progress; `TalentsPage.test.tsx` for the page; the talent usefulness work (B-23) for pricing a talent against an army.

## Out of Scope

- Analyzing several talents at once, or ranking all talents by this measure (B-23 covers usefulness ranking).
- Saving analyses to the account or sharing them in a link.
- More than two shapes, or a control to choose them on screen.
- Changing the planner's order of steps from the analysis.
- Pricing any army other than the one selected in March (for example the plan's lead march).
- Economy, archeology and other non-battle talents.

## Further Notes

- The two shapes are 100 % and 80 % at the owner's request on 2026-11-20. The existing `editFills` stop at 90 % because below it mercenaries start to go and the damage falls off a cliff; the 80 % line is expected to show that bend, and that is information, not a bug.
- Cost: ten ratings per analysis, each a re-size plus a rating read. Measure it on the live account before deciding whether progress needs more than a spinner.
- Suggested seams to confirm with the owner: (1) the analyze engine function, (2) the talents page. Everything else follows existing patterns.
