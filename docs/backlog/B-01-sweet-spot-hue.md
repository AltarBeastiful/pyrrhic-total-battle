---
type: reference
title: "B-01 Hue around the sweet spot, and check it is the best rated"
created: 2026-10-09
tags: [backlog, plan-table, ui, experiment]
related: ['[[00-inventory]]', 'T-01', '[[progression-advisor]]', '[[the-stops-the-bar-offers]]']
---

# B-01 Hue around the sweet spot, and check it is the best rated

## Context

`src/ui/sections/march/PlanBar.tsx` (marks, about line 264) draws only a brass "Sweet spot" label on the slider mark. `PlanTrade.tsx` has no sweet-spot styling. `sweetSpotOf` in `src/state/runStore.ts` picks the stop; the stop definitions are in `docs/plans/the-stops-the-bar-offers.md`. S-151 and S-152 use the sweet spot only as the advisor's headline fallback. No experiment compares it with `rate()` over all stops.

## Problem

The plan table does not show where the sweet spot sits, and nobody has measured that the sweet spot is the best-rated stop. Both halves of the owner's note are open.

## Proposal

Run a one-off experiment that rates every stop of several saved accounts with `rate()` and reports whether the sweet spot is the argmax. If it is, add a hue on the sweet row in the plan table. If it is not, report the gap and let the owner choose between fixing the pick and renaming the mark.

## First step

Write `tools/theorycraft/196-sweet-spot-rated.test.ts` (next free experiment number) and its report `tools/theorycraft/out/196-sweet-spot-rated.md`: for each fixture account, rate every stop with `rate()` and print the argmax next to `sweetSpotOf`.

## Acceptance criteria

- [ ] The experiment report lists, per account, the rating of each stop and whether the sweet spot is the best, written under `tools/theorycraft/out/`.
- [ ] The plan table row for the sweet spot carries a hue that is a group or tier colour, not decoration, and a text signal as well as colour.
- [ ] The hue is visible and legible at 390 px and 1400 px in both schemes.

## Design rules touched

Rules 18, 20, 24 (see [[design-rules]]). Rules 18 (phone first, hover is never the only path), 19 (right-sized), 20 (colour means group), 23 (stock Mantine, themed), 24 (contrast, keyboard, colour never the only signal).

## Size

S: one experiment plus one style on an existing row; the experiment decides whether the UI half is needed.

## Dependencies

None. Reads the stops from the Tight default ([[tight-default]]).

## Open questions for the owner

1. If the sweet spot is not the best rated, should the pick change or the label?
