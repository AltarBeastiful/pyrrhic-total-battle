---
type: reference
title: "B-07 Fill the VIP table with game data"
created: 2026-10-09
tags: [backlog, game-data]
related: ['[[00-inventory]]', 'T-27']
---

# B-07 Fill the VIP table with game data

## Context

`src/data/tables/vip.json` holds levels 0 to 15 with every bonus 0; `src/data/CHANGELOG.md` line 38 says "placeholders, all zero: the capture had no VIP table". `vipNeedsManual` in `src/state/derive.ts` lets the player type values meanwhile.

## Problem

Placeholders mean VIP bonuses are not computed from a level.

## Proposal

Fill the table from the game's VIP screens, add a data-changelog entry and a test that each level is non-zero where the game says so.

## Acceptance criteria

- [ ] `vip.json` has real values for levels 0 to 15 with a source note.
- [ ] `vipNeedsManual` stops asking for manual values.
- [ ] Benchmark rating does not regress for accounts without VIP; accounts with VIP change only by the table.

## Design rules touched

None.

## Size

S: data entry, once the values exist.

## Dependencies

Blocked on data only the owner can read from the game screen.

## Open questions for the owner

1. Can the owner supply the VIP bonuses per level (screenshots are enough)?
