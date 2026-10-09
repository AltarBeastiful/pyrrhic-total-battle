---
type: reference
title: "B-12 Equipment revamp: less crowded preview, grade letter, bonus off the pill, sets moved between heroes"
created: 2026-10-09
tags: [backlog, equipment, ui, design-first]
related: ['[[00-inventory]]', 'T-16', 'T-18', 'T-19', 'T-20', 'T-21']
---

# B-12 Equipment revamp: less crowded preview, grade letter, bonus off the pill, sets moved between heroes

## Context

No equipment redesign story in `docs/PLAN.md`. `src/ui/sections/troops/` and `src/ui/sections/bonuses/` own the sheet. Tier steppers already colour by tier (S-92). T-17 is an illustration whose image is not in the repo.

## Problem

The preview is crowded and shows no real usage. Players keep at most 9 items at high level, usually a 3-piece set very high and the rest a bit lower, and move sets between heroes.

## Proposal

Design an artifact: a grade letter on the badge (colour from the tier palette), the bonus on hover and in the badge's configure popover, an example of real usage, and a data model that lets a set move to another hero. Build only after the owner chooses between whole sets per hero and one item at a time.

## First step

Design the revamp at `docs/design-canvas/equipment-revamp.dc.html` with 390 px and 1400 px frames, showing the owner's two heroes with a 3-piece set of different quality each.

## Acceptance criteria

- [ ] A design artifact is approved before any build.
- [ ] The badge shows the grade as a letter coloured by tier, with contrast verified and a text signal besides colour.
- [ ] Bonus is off the pill and reachable by tap (configure), not hover alone.
- [ ] A set can be moved to another hero and the 9-item cap is respected.
- [ ] Reviewed at 1400 and 390 px in both schemes (rule 31).

## Design rules touched

Rules 6, 18, 20, 23, 24, 31. Rules 18 (phone first, hover is never the only path), 19 (right-sized), 20 (colour means group), 23 (stock Mantine, themed), 24 (contrast, keyboard, colour never the only signal).

## Size

L: a data model change plus a redesign of a dense form and a design step.

## Dependencies

The T-21 decision (listed in [[03-needs-owner]]).

## Open questions for the owner

1. Whole sets per hero or one item at a time (T-21)?
2. Which grade letters (poor, uncommon, rare, ...)?
