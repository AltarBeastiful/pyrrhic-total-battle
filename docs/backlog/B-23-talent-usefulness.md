---
type: reference
title: "B-23 Talent usefulness: value talents by what this army can use"
created: 2026-11-19
tags: [backlog, spec, talents, engine, ready-for-agent]
related: ['[[B-21-hero-talent-planner]]', '[[B-22-talent-priorities]]', '[[design-rules]]']
---

# B-23 Talent usefulness: value talents by what this army can use

Status: `ready-for-agent`. Written from the 2026-11-19 grilling. It builds on B-21 and B-22 (the planner and the priority plan). Nothing is implemented.

## Problem Statement

The talent planner values a rank by weighted percentage points, with every stat weight at 1 and a yes/no test on the unit kind. That treats very different bonuses as equal. Carrying capacity sits in the Battle goal and competes with strength, though it does nothing in a fight. Health on monsters is rarely worth much (bigger monsters are harder to shield), and a bonus for specialists is worth less when the army holds few of them. A Guardsman bonus can be worth a lot or a little depending on the stat. Economy and Archeology list stats the player does not care about (caravans, map mining), and the Archeology labels are wrong ("Crypt damage" is really exploration efficiency), so the plan buys talents the player never wanted and the player cannot say so.

## Solution

Each talent bonus gets a usefulness factor worked out from the account's army. Strength on a troop is 1; health, double-damage chance and the other combat stats are measured by the real engine as a ratio to strength, over the full scale of the talent, on several armies. The measurement is run here, in development, and shipped as a table. At runtime a stat's weight is the sum, over the troop groups the player can field (Guardsmen, specialist, monster), of the table ratio times that group's share of the army. A group the player cannot field counts 0, and one they unlock raises the weight by itself. Every stat in every goal also gets a tick, so the player says which bonuses they care about, with sensible defaults. Archeology gains crypt-type ticks (Common, Rare, Epic). The page shows each measured factor beside its weight.

## User Stories

1. As a player, I want carrying capacity to count for nothing in Battle by default, so that the plan does not spend points on a stat that does not fight.
2. As a player, I want to tick carrying capacity on if I want it, so that a default never locks me out.
3. As a player, I want a tick for every stat in every goal, so that I choose which bonuses I care about.
4. As a player, I want an unticked stat to count 0 in the plan, so that its talents are never bought for that goal.
5. As a player, I want sensible default ticks, so that a new account gets a good plan without setup.
6. As a player, I want Battle to default to strength, health and double-damage chance on, so that the plan serves the fight.
7. As a player, I want march speed and march speed against players off by default in Battle, so that speed does not outrank damage.
8. As a player, I want Economy to default to building, research, training speed and resource production on, so that the plan serves the common case.
9. As a player, I want crafting, storage, caravan, map mining and other economy bonuses off by default, so that they appear only when I want them.
10. As a player, I want Archeology to default to exploration efficiency, cost and explore-twice on, so that the plan serves crypt running.
11. As a player, I want crypt experience and crypt march range off by default, so that they appear only when I want them.
12. As a player, I want the Archeology stats named with the game's own words, so that I recognise them from the game.
13. As a player, I want a stat shared by two goals (tar production, tar capacity) to have one tick, so that I am never asked the same question twice.
14. As a player, I want Common, Rare and Epic crypt ticks, so that bonuses for a crypt type I never explore count for nothing.
15. As a player, I want the general crypt bonuses to count when any crypt type is ticked, so that they are not lost.
16. As a player, I want all crypt types ticked by default, so that nothing is hidden before I choose.
17. As a player, I want a health bonus to be worth what it is for the troops I field, so that the plan prefers the stat that helps my army.
18. As a player, I want health on monsters to be worth little when it does not stack well, so that the plan does not buy it for me.
19. As a player, I want a bonus for specialists to count in proportion to how many specialists I can field, so that a rarely used group gets little weight.
20. As a player, I want a bonus for a troop group I cannot field to count 0, so that nothing is wasted.
21. As a player, I want the weight to rise by itself when I unlock a troop group, so that I do not edit settings after an unlock.
22. As a player, I want a bonus measured over the whole range of the talent, so that late ranks are valued at what they are worth and not at the first point's value.
23. As a player, I want my own per-stat weights to multiply the measured factor, so that I can still say one stat matters more to me.
24. As a player, I want to see the measured factor next to each weight (for example "health x0.6, measured"), so that I understand why a talent ranks where it does.
25. As a player, I want that note readable on a phone without hovering, so that I can use it on touch.
26. As a player, I want a factor above 1 to be allowed, so that a stat that beats strength on my troops is valued as such.
27. As a player, I want the plan to give the same answer whenever I open the page with the same army, so that I trust it.
28. As a player, I want my ticks saved on my account, so that I find them on another device.
29. As a player, I want old saved weights and goals to keep working after the upgrade, so that nothing I set is lost.
30. As a player, I want the page to work at 390 px with no sideways scroll, so that I can set ticks on my phone.
31. As a player using a keyboard or screen reader, I want every tick and factor note to be labelled and reachable, so that I can use the page without a mouse.
32. As the owner, I want the usefulness ratios measured by the real engine, so that they are facts and not guesses.
33. As the owner, I want the measurement run on every benchmark scenario plus my own army, so that the result is shown to hold.
34. As the owner, I want a ratio that is unstable across armies to be flagged in the write-up, so that I decide what to do with it and nothing is hidden.
35. As the owner, I want the table committed as data with a hash of the troop data it came from, so that it can be rebuilt when the game changes.
36. As the owner, I want a test to fail when the troop data changes and the table is stale, so that stale ratios never ship.
37. As the owner, I want only me to accept a regenerated table, so that a rule of non-regression holds.
38. As the owner, I want the runtime to need no engine call for usefulness, so that the page stays fast.
39. As the owner, I want the weight function to be pure, so that it is tested like the rest of the engine.
40. As the owner, I want the single-stat, single-goal plan unchanged when every factor is 1, so that nothing I tested moves.

## Implementation Decisions

- **Usefulness factor.** One value per (stat, troop group, segment of the stat's full scale). Strength on a troop is 1 by definition; the others are ratios to it. There is no upper cap and the floor is 0.
- **Stats measured by the engine.** Strength, health and double-damage chance. March speed, carrying capacity, economy and archeology stats are not measured; their weight is the player's tick and weight.
- **Troop groups.** Guardsmen, specialist, monster, taken within each unit kind. Tier is not part of the grouping.
- **Full scale and segments.** The full scale of a stat is the sum of all its talent ranks in the table. The ratio is measured at about 0, 25, 50, 75 and 100 % of it and stored per segment. A stat whose ratio varies less than 5 % across segments collapses to one number. The planner values a rank by the segment its current total falls in.
- **Armies.** The measurement runs on every benchmark scenario plus the owner's account army. A ratio is stable if it stays within 15 % of the median across armies; unstable ones are flagged in the table and in the experiment write-up and are never hidden. The owner decides, per flagged ratio, whether to keep the median or split by army shape.
- **Where it is built.** An experiment under the theorycraft tools generates the table. It is run in development and the result is committed as data. Only the owner accepts a regenerated table.
- **Staleness.** The table carries a hash of the troop data it was built from. A test compares it with the current data and fails on a mismatch. If the table cannot be built ahead of time for some stat, it is computed once and kept, never recomputed per plan.
- **Runtime weight.** For each stat the weight is the sum, over the troop groups the account can field, of the table ratio times that group's share of the army. Shares come from the account's available troops (stack caps or counts), not from a plan; with no army data, the table's default shares apply. A group the account cannot field contributes 0. The result multiplies the player's own per-stat weight. Specialist and monster shares follow the same rule, so a rarely fielded group has a small effect.
- **Pure and unstored.** The usefulness is a pure function of the table and the army, memoised on the army. It is not stored in account state and needs no schema change for the factor itself.
- **Ticks.** Each stat in each goal has a tick. A tick sets the existing weight to 1 and an untick sets it to 0; there is no second mechanism. The list is flat for now; grouping is a later story. A stat shared by two goals has one tick, so the Archeology goal inherits Economy's for tar production and tar capacity.
- **Defaults.** Battle on: strength, health, double-damage chance; off: carrying capacity, march speed, march speed against players. Economy on: building speed, research speed, training speed, resource production; off: crafting speed, storage, caravan capacity, clan caravan capacity, caravan speed, map mining speed, other economy bonuses. Archeology on: exploration efficiency, exploration cost, explore twice; off: crypt experience, crypt march range.
- **Crypt types.** Common, Rare and Epic ticks, all on by default, work like unit kinds. A per-type node counts only when its type is ticked. A general node (the all-crypts tag) counts when any type is ticked.
- **Labels.** Archeology stat labels become the game's words: exploration efficiency, chance to explore a Crypt twice, exploration cost, crypt experience. This ships first as its own small change.
- **Saved state.** The ticks and crypt types are new fields in the talents section, with defaults, and a schema migration that keeps every other field. A bad saved value falls back to the default. Save, sync and per-section merge follow the existing pattern.
- **Page.** Each weight shows its measured factor beside it as a faint note readable on touch (design rule 18). The page follows the design charter: every control labelled, no sideways scroll at 390 px, no em dashes in UI strings.
- **Order of work.** (a) Label fix. (b) Ticks, defaults and crypt types. (c) The measurement experiment and the table. (d) Runtime weighting and the on-screen factor.

## Testing Decisions

- **What a good test is.** It states the account and settings and checks what the player sees: the plan's order, the cards and the weights shown. It does not look at how the weights are computed.
- **Seam 1, the engine weight function.** One table-driven test file, written once, for the pure function that turns the table and the army into per-stat weights. Cases: strength is 1; an unavailable group contributes 0; unlocking a group raises the weight; a rarely fielded group has a small effect; a factor above 1 is kept; the floor is 0; a segment change moves the value; with every factor at 1 the plan equals today's plan. Carrying capacity counts 0 by default and counts when ticked. Crypt-type ticks gate per-type nodes, and a general node counts when any type is ticked. A stat shared by two goals has one tick.
- **Seam 2, the page.** One page component test in the style of the existing talents page test: untick a stat and see its talents leave the plan; tick a crypt type and see its nodes return; see the measured factor next to a weight; start from an old saved account and see the defaults. No sideways overflow at 390 px is left to the end-to-end journey.
- **Seam 3, the table.** A test that the table's hash matches the current troop data, and that the stable ratios stay within the stated bounds on the benchmark armies. A change to the table is accepted only by the owner, as with the benchmark.
- **Prior art.** The talents engine test and the talents page test from B-21 and B-22, and the benchmark pins in the theorycraft tests.

## Out of Scope

- Measuring march speed, carrying capacity, economy or archeology stats with the engine.
- Grouping the checklist into sections (a later story).
- Tier-level factors.
- A per-army-shape table (only if the owner asks after the stability report).
- Respec advice and anything B-21 and B-22 already exclude.

## Further Notes

- Carrying capacity is already part of the Battle goal today and competes at weight 1; that is the bug this removes.
- `SKLEP_*` stats map to exploration efficiency (strike damage), explore twice (crit chance), exploration cost (price cut) and crypt experience (experience); the code names stay.
- The unit-id tags 202, 17, 90 and 325 mark Common, Rare, Epic and all crypts in the talent table.
- **Decided during the build (2026-11-19).**
  - Strength is valued by troop group with a typical-share table from experiment 363 (guardsmen 1, army 1.11, mounted 0.41, melee 0.23, ranged 0.2, specialists 0.14, monsters 0.14, engineers 0.14 provisional, flying 0.06). The share of the player's own army is a later refinement. Health and double-damage chance stay at weight 1: the plan's damage figure cannot see them (health reorders the enemy's kill order; double damage is left out of the bill).
  - A troop group the player does not use (Guardsmen, Specialists, Monsters, Engineers) gets no points beyond the one opening rank a path to a stronger node needs. The group follows what the account fields and the player can switch it off or on (schema v14, `groupOverrides`).
  - "Other economy bonuses" is named for what it is: Tile bonus.
  - The page is in the address bar: `#talents` reloads to the talents page.
  - Tree tiles show the rank as a bar over the number; the plan-order number is gone from the tile (kept in the accessible name).

