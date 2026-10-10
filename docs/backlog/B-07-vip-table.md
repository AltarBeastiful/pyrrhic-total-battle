---
type: reference
title: "B-07 Fill the VIP table with game data"
created: 2026-10-09
tags: [backlog, game-data]
related: ['[[00-inventory]]', 'T-27']
---

# B-07 Fill the VIP table with game data

**Done 2026-10-10.** `vip.json` has levels 0 to 25, `MAX_VIP_LEVEL` is 25, the data CHANGELOG has the entry and `data.test.ts` pins the corners. Hand-typed values now apply only above level 25.

## Context

`src/data/tables/vip.json` holds levels 0 to 15 with every bonus 0; `src/data/CHANGELOG.md` line 38 says "placeholders, all zero: the capture had no VIP table". `vipNeedsManual` in `src/state/derive.ts` lets the player type values meanwhile.

## Owner data (2026-10-10)

VIP gives army strength and army health, the same value for both. Levels run 1 to 25 (the table has 0 to 15, so it must grow to 25):

| Level | Bonus |
| --- | --- |
| 0 | 0 % |
| 1 to 8 | 0.5 % per level (4 % at 8) |
| 9 to 24 | +1 % per level (5 % at 9, 20 % at 24) |
| 25 | 25 % |

## Problem

Placeholders mean VIP bonuses are not computed from a level.

## Proposal

Fill the table from the game's VIP screens, add a data-changelog entry and a test that each level is non-zero where the game says so.

## Acceptance criteria

- [ ] `vip.json` has real values for levels 0 to 25 with the values above and a source note.
- [ ] `vipNeedsManual` stops asking for manual values.
- [ ] Benchmark rating does not regress for accounts without VIP; accounts with VIP change only by the table.

## Design rules touched

None.

## Size

S: data entry, once the values exist.

## Dependencies

None: the data is in hand. Check the units against `vip.json` (percent or fraction) before filling.

## Open questions for the owner

None.
