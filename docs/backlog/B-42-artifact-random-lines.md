---
type: reference
title: "B-42 Five random artifact bonus lines"
created: 2026-11-27
tags: [backlog, artifacts]
related: ['[[B-38-game-data-artifacts-arena-capacity]]', '[[design-rules]]']
---

# B-42 Five random artifact bonus lines

Status: `ready-for-agent`. From [[B-38-game-data-artifacts-arena-capacity]]. Cite [[design-rules]] in any UI brief. New UI strings use no em dashes.

Standing criteria: the benchmark rating does not regress; tests are written once and run on TS and kernel, red on both first.

## What to build

A player records the random bonuses the game rolled: one line per whole star reached, up to five. Each line picks one of the options that artifact can roll, then one of its three values (rare, epic, legendary). The same option may sit on several lines. This replaces the single typed random bonus.

## Acceptance criteria

- [ ] The converter carries every artifact's random options, each with exactly three values, and fails otherwise.
- [ ] Line *k* shows only at star *k*.0 or higher; a line can be left empty.
- [ ] Lowering the star keeps hidden lines but stops counting them; raising it brings them back.
- [ ] Duplicate options add up.
- [ ] A saved line stores the option and rarity, and the value is read from the table.
- [ ] Against-other-players lines count in Prime Arena only. Strength against epic monsters, double damage and strike-two-squads lines count as those totals do today.
- [ ] Every option stays selectable; those that do not count on the current page are marked "not counted" (against other players in the calculator; authority and march speed everywhere; Leadership and Dominance everywhere until B-44 counts them in Prime Arena).
- [ ] Next free schema version: an old random bonus moves to line 1 with the nearest of the three values (the lower on a tie) when the artifact can roll that option, and is dropped otherwise.
- [ ] Section sync, share defaults and old share links cover the new lines.
- [ ] Data version and changelog follow the table change.

## Blocked by

- [[B-41-arena-against-players-bonuses]]
