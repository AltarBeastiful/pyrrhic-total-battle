---
type: reference
title: "B-04 Per-stack and global "use the most mercs for this silver" control"
created: 2026-10-09
tags: [backlog, raise, ui, design-first]
related: ['[[00-inventory]]', 'T-04', '[[B-03-silver-neutral-raise]]']
---

# B-04 Per-stack and global "use the most mercs for this silver" control

## Context

The global half exists as the raise control per pool (S-142, S-149, Tight default). `src/ui/sections/mercenaries/` has no per-stack control.

## Problem

The owner asked for a small button on a stack that raises just that stack, or a global "most mercs for that silver". Only the global form exists.

## Proposal

Design a per-stack raise on the mercenary pill that fills that stack to what troops still shelter and the silver allows. Decide in the artifact whether it replaces or sits beside the Tight raise.

## First step

Mock the pill with the raise button in `docs/design-canvas/merc-fill-button.dc.html` at 390 px, two lines per pool (rule 14).

## Acceptance criteria

- [ ] A design artifact is approved.
- [ ] The control raises one stack only, never past shelter or silver, and never below the merc saver.
- [ ] It is reachable by tap and keyboard with an accessible name.

## Design rules touched

Rules 6, 9, 14, 18, 19, 23, 24. Rules 18 (phone first, hover is never the only path), 19 (right-sized), 20 (colour means group), 23 (stock Mantine, themed), 24 (contrast, keyboard, colour never the only signal).

## Size

M: design plus a stateful control tied to the shelter calculation.

## Dependencies

Probably after B-03's measurement.

## Open questions for the owner

1. Per-stack button still wanted beside Tight?
