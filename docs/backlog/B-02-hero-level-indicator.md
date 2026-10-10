---
type: reference
title: "B-02 Hero level and stars at a glance"
created: 2026-10-09
tags: [backlog, heroes, ui, design-first]
related: ['[[00-inventory]]', 'T-08']
---

# B-02 Hero level and stars at a glance

## Status (2026-10-10)

The owner says the hero level and stars indicator is good as it stands (the badge reads "Level 20, 4 stars", S-152 notes). Closed; nothing to build unless the owner reopens it.

## Context

Commits `61f04e3` (level in a tooltip), `f22c47d` (the tooltip says what the level buys), `e78d153` and `0da57a5` (level badge corner mark) shipped part of this. The captain chips live in `src/ui/sections/troops/` and the captain editor in the badge popover.

## Problem

A player still clicks to see level and stars, and the hover tooltip does nothing on touch. The owner wants a star-number icon on an entered hero that doubles as the "level entered" indicator, designed in an artifact first so the UI is not crowded.

## Proposal

Design the indicator as an artifact, get the owner's pick, then build it on the chip with stock Mantine parts and an accessible name. Hover stays as a bonus, never the only path.

## First step

Design three variants of the chip (star-number badge, corner pip, level-in-badge) as a static artifact at `docs/design-canvas/hero-level-indicator.dc.html`, with 390 px and 1400 px frames; the owner picks one.

## Acceptance criteria

- [ ] A design artifact exists and the owner approved one variant.
- [ ] An entered hero shows its star count (and level) on the chip without opening anything; an unentered hero looks different.
- [ ] The indicator has an accessible name and works by tap and keyboard.
- [ ] Reviewed at 1400 and 390 px in both schemes against the artifact (rule 31); contrast script passes.

## Design rules touched

Rules 7, 12, 18, 19, 20, 23, 24, 31. Rules 18 (phone first, hover is never the only path), 19 (right-sized), 20 (colour means group), 23 (stock Mantine, themed), 24 (contrast, keyboard, colour never the only signal).

## Size

M: a design step, then a small component change and a visual review at two widths.

## Dependencies

None.

## Open questions for the owner

1. Star number only, or level and stars together?
2. Should a hero with no level entered show an empty marker?
