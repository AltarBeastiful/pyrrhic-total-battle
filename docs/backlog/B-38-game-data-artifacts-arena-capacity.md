---
type: reference
title: "B-38 Game-extracted artifacts, Arena capacity and captain quick select"
created: 2026-11-27
tags: [backlog, artifacts, prime-arena, data]
related: ['[[B-33-prime-arena-input-model]]', '[[B-37-prime-arena-report-faithful-planner]]', '[[design-rules]]']
---

# B-38 Game-extracted artifacts, Arena capacity and captain quick select

Status: `ready-for-agent`. From the 2026-11-27 grilling. Pyrrhic changes only: the extraction itself lives in `tb-analyze` and is the owner's. Cite [[design-rules]] in any UI brief (rules 10, 12, 23 and 24 apply directly).

Standing criteria: the benchmark rating does not regress; tests are written once and run on TS and kernel, red on both first.

## Problem Statement

Artifacts are mostly typed by hand. Only Heart of the Forest has level and star values; for the others the player reads percentages off the artifact popup and types them. An artifact can hold only one random bonus, picked from a partial list with a free number, while the game gives up to five. Medallion of Unity, Zeus' Lightning and Ghostflame Lantern feed the wrong stats. In Prime Arena the player computes and types Leadership and Dominance by hand, and picks five captains one by one.

## Solution

Artifact values come from the game's own data: the player sets only level and star, steps them with + and −, and records the random bonuses the game rolled, one line per whole star. Prime Arena works out the maximum Leadership and Dominance from the squad, fills empty captain slots with the strongest captains, and offers a one-press "Pick 5 strongest".

## User Stories

1. As a player, I want an artifact's bonuses to follow from its level and star, so that I type no percentages.
2. As a player, I want every artifact's values to be the game's own, so that my totals match the game.
3. As a player, I want Medallion of Unity, Zeus' Lightning and Ghostflame Lantern to feed the stats the game feeds, so that my totals are right.
4. As a player, I want Mars' Twin Blades in the artifact grid, so that I can field it in Prime Arena.
5. As a player, I want artifacts that can change nothing here (march speed, production, mining, building, scouts) left out, so that the grid stays short.
6. As a player, I want a + and a − button on the artifact level, so that I can bump it without typing.
7. As a player, I want a + and a − button on the artifact star that moves one segment, so that 2.0 goes to 2.1.
8. As a player, I want the buttons to stop at level 1 and 60 and at star 0.1 and 5.0, so that I cannot enter an impossible artifact.
9. As a player, I want to see what the artifact gives at its current level and star in its editor, so that I can check it against the game.
10. As a player, I want one random bonus line per whole star reached, up to five, so that the editor mirrors my artifact.
11. As a player, I want each line to offer only the options that artifact can roll, so that I cannot record an impossible roll.
12. As a player, I want each line to offer only the three values the game can roll, so that I pick instead of type.
13. As a player, I want the same option allowed on several lines, so that duplicate rolls are recorded.
14. As a player, I want to leave a line empty, so that I can fill it in later.
15. As a player who lowered a star by mistake, I want hidden lines kept, so that raising the star brings them back.
16. As a player, I want hidden lines not to count, so that totals match the current star.
17. As a player, I want options that do not count on the current page marked "not counted", so that I know why totals do not move.
18. As a player, I want bonuses "against other players" to count in Prime Arena, so that arena totals are real.
19. As a player, I want bonuses "against other players" ignored by the march calculator, so that monster marches are unchanged.
20. As a player, I want strength against epic monsters to count as it does today, so that Ghostflame Lantern works on epic marches.
21. As a player, I want "chance to strike two squads" added to the existing strike-two-squads total, so that it is shown like the title bonuses.
22. As a returning player, I want my saved level and star kept, so that I do not set them again.
23. As a returning player, I want my old random bonus moved to line 1 with the nearest real value, so that it is not lost.
24. As a Prime Arena player, I want Leadership and Dominance set to the maximum of my squad, so that I do not add it up by hand.
25. As a Prime Arena player, I want the maximum recomputed when I change the squad's captains, so that it is never stale.
26. As a Prime Arena player, I want it recomputed when a selected captain's level changes, even if I changed it on another page, so that upgrades show up.
27. As a Prime Arena player, I want it recomputed when I equip, remove or edit Zeus' Lightning, so that its capacity bonus counts.
28. As a Prime Arena player, I want an "other capacity bonus %" field saved with the account, so that I can cover bonuses the app does not know.
29. As a Prime Arena player, I want to type over the filled values and have them stay until one of those inputs changes, so that I can match the game exactly.
30. As a Prime Arena player, I want my typed values kept after a reload, so that nothing moves behind my back.
31. As a Prime Arena player, I want a Max button, so that I can restore the maximum after typing.
32. As a Prime Arena player opening the page with fewer than five captains, I want the empty slots filled with my strongest captains, so that the squad is ready.
33. As a Prime Arena player, I want auto-select to keep the captains I already picked, so that my choice is respected.
34. As a Prime Arena player, I want "Pick 5 strongest" beside the captains heading, so that I can replace the whole selection at once.
35. As a Prime Arena player, I want newly selected captains to shine once, so that I see what changed.
36. As a player with reduced motion on, I want no shine animation, so that the page stays still.
37. As a player, I want level-0 captains never picked, so that captains I do not own stay out.
38. As a player with fewer than five owned captains, I want all of them picked and nothing else, so that auto-select never invents one.
39. As a calculator user, I want my march housing untouched by captain capacities, so that the calculator behaves as before.
40. As a player on two devices, I want the new artifact lines and capacity field synced, so that both agree.
41. As a player opening a share link, I want artifacts and arena inputs to arrive intact, including old links, so that sharing still works.
42. As the owner, I want the tables rebuilt from a new export by one command, so that a game update is cheap.
43. As the owner, I want the conversion to fail loudly on anything it does not understand, so that a changed game cannot slip in as a wrong table.
44. As the owner, I want leadership, authority and dominance per level stored for captains and the hero, so that later features can use them.

## Implementation Decisions

### Data

- A converter, run as a data script like the talent one, builds the app tables from the `tb-analyze` hero and artifact export. The export directory is a command argument or an environment variable; no machine path is committed as a default requirement.
- Inputs it reads: the artifact export (per artifact: 60 levels, 25 star steps, random options, each with its effects) and the hero level export (per hero or captain and level: leadership, mastery, dominance).
- **16 artifacts**: the current fifteen plus Mars' Twin Blades. Existing artifact ids do not change.
- A percentage is the game coefficient minus 10 000, divided by 100. Strike-two-squads effects carry their value in the scale coefficient, in tenths of a percent; the random option texts confirm the unit.
- The export names a unit set only by its size. The converter learns which size means which bonus key from the random option texts of the same export, and fails on a size no text names, or one that two keys claim. Sizes differ between game snapshots, so they are never hard-coded.
- Star step *n* (1 to 25) is written in the existing notation 0.1 to 5.0; step 5*k* is *k*.0. There is no 0.0.
- An artifact's total at (level, star) is the sum of the level row and the star row. The two rows may feed different stats (Zeus' Lightning: levels give Leadership and Dominance; stars give double damage chance and authority).
- Effect kinds: counted bonuses (health, strength, special chances, strength against epic monsters), each optionally "against other players"; capacity bonuses (leadership, dominance); and kinds the app does not use (authority, march speed), kept so the option can be shown.
- Each random option has exactly three values, one per rarity (rare, epic, legendary).
- Capacity table: leadership, authority and dominance for levels 1 to 600, one row set for captains (the export gives all captains the same one, and the converter checks it) and one for the hero. "Mastery" in the export is authority.
- Data version goes from 1 to 2, with a changelog entry. The entry names the three corrections: Medallion of Unity loses army strength; Ghostflame Lantern loses plain army strength; Zeus' Lightning loses army strength and gains its capacity bonuses.
- The data README and the project plan say player-versus-player values are dropped and PvP is out of scope. Both are amended: artifact values against other players are kept and apply in Prime Arena only. The artifacts table is documented as generated, not hand-edited.

### Saved profile, sync and share

- Next schema version, with a migration.
- An artifact entry keeps level and star; the typed manual values are removed. The single random bonus becomes an ordered list of at most five lines, each empty or an option id plus a rarity. The value is read from the table, never stored.
- Migration: level below 1 becomes 1; star 0.0 becomes 0.1. An old random bonus moves to line 1 when its option exists for that artifact, with the rarity whose value is nearest (the lower one on a tie); otherwise it is dropped.
- A new artifact starts at level 1, star 0.1, no lines.
- The Prime Arena section gains the other capacity bonus % (default 0) and the capacity basis: a record of the inputs the last maximum was computed from.
- Share-link defaults and section merge cover the new fields.

### Bonus resolution

- The existing source resolution stays the one place artifact bonuses are added. "Against other players" effects are added only when the march type is the Arena, in the same additive bracket as the others.
- Only random lines unlocked by the current star count: line *k* needs star *k*.0 or higher.
- The "no level table yet" caveat disappears.

### Prime Arena capacity

- Leadership = floor of (sum of the squad captains' leadership at their level) × (1 + (Zeus level % + unlocked Zeus Leadership lines + other %) / 100). Dominance is the same with dominance and the Dominance lines. Zeus counts only when equipped in the squad. The hero is excluded. A level-0 captain adds nothing. Captains whose bonuses do not count in the Arena still add capacity. The floor must be exact, free of floating-point drift.
- The calculator's housing is never written. Authority stays 0 in the Arena.
- The maximum is applied when the capacity basis differs: squad captains, their levels, equipped Zeus with its level and unlocked capacity lines, other %. When the basis matches, typed values stay, including after a reload.
- A profile with no basis yet keeps typed values and adopts the basis, unless both pools are zero, in which case the maximum is applied.
- A Max button restores the maximum at any time. An "other capacity bonus %" field sits with the two pools.

### Prime Arena captain selection

- Ranking: highest level first; ties by the sum of the bonus points that count in the Arena at that level and star; then the picker's captain order. Only level 1 and above; one entry per captain.
- On each opening of the page, after the squad is first seeded from the march, empty slots are filled up to five. Captains already selected stay.
- "Pick 5 strongest", beside the captains heading and in Prime Arena only, replaces the selection at once, without confirmation.
- A selection change from either path goes through the same capacity rule.
- Newly selected captains get one short shine and no lasting marker. Nothing animates under reduced motion. The shine is view state: not saved, not synced.

### UI

- The shared artifact editor (calculator and Arena) holds level and star steppers, the unlocked random lines (option, then one of three values) and the resulting bonuses. The typed percentage fields are removed.
- The + and − controls follow the existing stepper pattern and live in the editor only; captains keep their current controls.
- "Not counted" depends on the page: against-other-players lines in the calculator; Leadership and Dominance lines in the calculator (the Arena counts them through the maximum); authority and march speed everywhere.
- New UI strings use no em dashes.

## Testing Decisions

- A good test checks external behaviour through the interface, never internals.
- **Converter seam**: a small hand-made export checks the decoding rules (percentage, strike-two unit, star notation, unit-set naming, every failure case); when the real export is on the machine, the whole tables are rebuilt and must equal what is committed. Prior art: the talent converter test.
- **Source resolution seam**: totals for a profile and a march type. Heart of the Forest keeps its known figure (level 20, star 2.1: army strength 258); the three corrected artifacts; locked lines ignored; duplicates stacked; against-other-players counted in the Arena only. Prior art: the artifact cases in the derivation tests and the Arena inputs tests.
- **Arena store seam**: auto-select, "Pick 5 strongest", and when the capacity is applied or left alone, asserted on the saved setup. Prior art: the Arena store tests.
- Migration and share round-trip in their existing tests.
- UI: render tests only for what the store cannot show: steppers and their bounds, line count per star, the "not counted" mark, the Max and "Pick 5 strongest" buttons.
- Table checks: 60 contiguous levels and 25 star steps per artifact, three values per random option, 600 capacity rows per set.
- The research-capture parity test is amended where the game data contradicts the capture; the Heart of the Forest parity stays.
- The benchmark is the non-regression gate (only the owner re-bases it). No committed fixture holds an artifact entry, so its numbers should not move.

## Out of Scope

- Any change in `tb-analyze`.
- The six captains the app lacks (Attila, Artemisia, Boudica, Hannibal Barca, Montezuma, Joan of Arc), until the export carries their names, bonuses and star bonuses.
- Replacing captain progressions with extracted ones.
- Artifacts other than the sixteen.
- Using captain or hero capacities in the march calculator; using authority anywhere; showing hero capacities.
- Modelling strike-two-squads in the battle; artifact upgrade costs or advice; auto-select in the calculator; the Defence squad.

## Further Notes

- Assumptions to check against the game when possible: against-other-players bonuses add to the normal ones; level and star rows add; the capacity formula. For the last, three armies from the battle report used in B-37 sit between −0.6 % and +11.7 % of their captains' summed values.
- Results change for players who typed artifact values or use the three corrected artifacts.
- The export in use at the time of writing comes from the older game snapshot. Values for the sixteen artifacts and the capacities match the newer one.
