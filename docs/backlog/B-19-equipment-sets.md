---
type: reference
title: "B-19 Equipment sets, grade badges, tighter pills"
created: 2026-10-20
tags: [backlog, ui, bonuses, equipment, ready-for-agent]
related: ['[[README]]', '[[design-rules]]', '[[B-20-equipment-drag-and-drop]]']
---

# B-19 Equipment sets, grade badges, tighter pills

Status: ready-for-agent. Design settled in the 2026-10-20 grilling; the reference layout is the private proposals artifact (layout B, https://claude.ai/artifact/Jtpc5rcEKdwqD9oYC2LTn2). Cite [[design-rules]] in the brief.

## Problem Statement

The Equipment row of the Bonuses section is crowded: every piece is a wide pill printing its full bonus text, and six pieces of the same type look alike apart from their numbers. Players keep up to nine pieces at a high level and swap them between heroes, usually three or six at once (a hero has three slots, a march with two captains wants two sets worn). Today each piece is switched on one at a time, so changing the worn sets costs six to nine clicks. The quality of a piece is not visible at a glance, and the "captain wearing it" field is never read by anything.

## Solution

Pieces stay individual, with their own type, quality and bonus. The player may group any pieces into a named set, a loadout the player builds, optional and never required. A set has a tri-state toggle that switches all its pieces at once, while each piece still switches alone. Each piece shows a one-letter grade badge in the rarity colour and a tight bonus line. Pieces without a set live in a "No set" card. The row header shows a passive, faint counter of pieces worn against the slots of the selected captains.

## User Stories

1. As a new player, I want to add pieces without ever creating a set, so that the editor is no heavier than today.
2. As an experienced player, I want to group three pieces into a set, so that I can wear them in one click.
3. As a player with two captains, I want to switch two sets on with two clicks, so that I stop spending six to nine clicks.
4. As a player, I want to click one piece inside a set to switch it alone, so that a set never takes away single-piece control.
5. As a player, I want a set toggle that shows all, some or none through its fill only, so that no "On" text is needed to read it.
6. As a player, I want a click on a partly-on set to turn everything on and a click on a full set to turn everything off, so that it behaves like a normal tri-state checkbox.
7. As a player, I want each piece to carry a letter for its grade (P, C, U, R, E, L, A, G) in the in-game rarity colour, so that I see the quality without reading.
8. As a colour-blind player, I want the letter always shown with the colour and an outlined badge for a piece that is off, so that colour is never the only signal.
9. As a player, I want the bonus line on each piece written tightly (for example "+8 % HP/STR guardsmen +1"), so that the pill stays small and understandable.
10. As a player, I want the full bonus on hover and in the piece editor, so that nothing is hidden.
11. As a phone player, I want the piece editor to show the full breakdown, so that I am not blocked by the lack of hover.
12. As a player, I want a set to take a name I choose, so that I can call it "Alexander".
13. As a player, I want an unnamed set to suggest the shared equipment type when all its pieces are of one type, and "Set N" otherwise, so that sets read sensibly without effort.
14. As a player, I want to add a piece and pick an optional set in the same form, and have the set stay selected after each add, so that three pieces take three quick adds.
15. As a player, I want to create a new set from the Add equipment form, so that I do not need a separate flow.
16. As a player, I want a menu on each piece to move it to another set, a new set or no set, so that I can reorganise without dragging.
17. As a player, I want that menu to work on touch and by keyboard, so that reorganising is not mouse-only.
18. As a player, I want a set sheet to rename the set, remove one piece from it, ungroup it, or delete it with its pieces, so that I can manage membership in one place.
19. As a player, I want the set sheet to leave type and quality to the existing piece editor, so that I edit a piece the one way I already know.
20. As a player, I want a "No set" card that always shows, so that Add equipment has a home even with no sets.
21. As a player, I want a faint worn-versus-slots counter in the Equipment header (6 slots with no captain selected, otherwise 3 per captain), so that I notice an impossible loadout.
22. As a player testing a hypothesis, I want no blocking, no message and no toast while I select pieces, so that adding captains afterwards or wearing too much for a test is never in my way.
23. As a player, I want the counter to tint faintly when over, with the reason in its tooltip, so that the warning is there but quiet.
24. As a returning player, I want my saved profiles to load unchanged, so that nothing is lost by the update.
25. As a player importing an old export or share link, I want the same totals as before, so that sets are purely a view and never change a number.
26. As a maintainer, I want the dead wearer field removed, so that no data is kept that nothing reads.
27. As a maintainer, I want the kit story to show two captains each wearing a set of mixed qualities plus loose pieces, so that the layout is reviewed on a real case while the app itself shows no example on an empty profile.

## Implementation Decisions

- Data: each equipment piece gains one optional set reference. A set is implied by the shared reference; there is no separate list of sets. The pieces stay a flat list, and the "which pieces are switched on" list of piece ids is unchanged, so the engine, the sharing codec and the bonus totals do not change. A piece belongs to at most one set.
- Set name: stored per set as optional text with no link to a hero. It lives beside the pieces (the smallest shape that holds a name for a shared reference, decided at implementation). An empty name means "suggest": the shared type when every piece has one, else "Set N" by position.
- Schema migration: one version bump that drops the piece `name` (wearer) field and adds the optional set reference. Old saves, old exports and old share links load, with the field discarded silently and every total identical.
- Set toggle: tri-state, derived from its pieces. A click when not all pieces are on turns all on; a click when all are on turns all off. No exclusivity between sets.
- Slot counter: slots are 6 with no captain selected, else 3 per selected captain. This rule is the owner's; the engine models no slots, so it is a display only. The counter never blocks or messages, tints faintly when over, and explains itself in its tooltip.
- Grade badge: a letter per quality (poor P, common C, uncommon U, rare R, epic E, legendary L, ascendant A, godlike G) with a colour token per grade in the theme, defined for light and dark with contrast checked. A piece that is off shows an outlined badge with a transparent fill, so on and off differ in form as well as colour.
- Piece pill: grade badge, equipment name, and a tight bonus line using HP and STR abbreviations and the same "main stats only" content as today, with the full line on hover. No set-level sum is shown.
- Layout: the reference layout is cards per set (header with toggle, name, worn count and a gear; three-column chip grid), with a last card "No set" that has no toggle and is always visible. Phone width collapses the chip grid.
- Piece menu (the "move" control, a ⋯ on each piece) offers the existing sets, "New set" and "No set". It is the keyboard and touch route for moving; drag and drop is a separate item (B-20).
- Set sheet: opened from the set's gear. Holds the name, the list of pieces (each opens the existing piece editor), per-piece "Remove from set", "Ungroup all" and "Delete set and pieces". It has no "quality for all" control, because pieces in a set rarely share a quality or a type.
- Add equipment: gains an optional Set field whose last value is kept across adds, and a "New set" choice.
- Kit story: shows two captains each wearing a set of mixed qualities, plus loose pieces. The app shows no example on an empty profile.
- Wording: labels follow the "merc, not hired" and no-em-dash rules already in force.

## Testing Decisions

- A good test drives what the player sees and does and asserts the result, never the component structure. Tests are written once and run on the TypeScript and kernel paths, red on both first.
- Seam 1, the Bonuses section component test (prior art: the existing Bonuses section test): set toggle all, some and none and the click rules; single piece toggle inside a set; the "No set" card; grade letter and the outlined off state; the tight bonus text and full text on hover; the move menu by mouse and by keyboard; set sheet rename, remove from set, ungroup and delete; Add equipment with the kept Set field and "New set"; the counter's value for 0, 1, 2 and 3 captains, its tint when over, and that nothing blocks or messages during selection.
- Seam 2, state migration (prior art: the existing migrations test): an old save with a wearer name loads, the field is dropped, and an old export or share link gives identical totals. One case in the derive tests: the same switched-on pieces give the same bonus with or without sets.
- The kit story is covered by the existing kit page smoke tests, not a seam of its own.
- Theme test: every grade colour reaches contrast against its background in both themes (prior art: the theme tests).

## Out of Scope

- Drag and drop between sets (B-20).
- Any engine change: bonuses, totals, derive and the kernel are untouched.
- A set effect or set bonus: the game has none, sets are the player's own grouping.
- Linking a set to a hero or captain, and any rule that forces a slot limit.
- An example on an empty profile.
- Hiding the bonus line entirely: it stays, tightened.

## Acceptance criteria

- [ ] Reviewed at 1400 and 390 px in both schemes (rule 31); hover is never the only path to a bonus (rule 18); contrast and a non-colour signal on every badge (rule 24).
- [ ] Gate green: `pnpm typecheck`, `pnpm lint`, `pnpm test`, e2e after `pnpm build`.
- [ ] B-12 is closed as superseded.

## Further Notes

- Supersedes [[B-12-equipment-revamp]]; its T-21 question is answered here.

- Gate: `pnpm typecheck`, `pnpm lint`, `pnpm test`, and e2e after `pnpm build` (stale-dist rule). Benchmark does not apply, no engine path moves.
- Reuse the tier-colour thinking of S-92 for the grade tokens.
- The set suggestion rule (shared type else "Set N") was the owner's "name more precise if we only add guardsmen pieces" idea.
