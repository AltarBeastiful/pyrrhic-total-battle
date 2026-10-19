---
type: reference
title: "B-15 Merc quantity pills: keyboard flow"
created: 2026-10-19
tags: [backlog, ui, mercenaries, keyboard]
related: ['[[README]]', '[[design-rules]]']
---

# B-15 Merc quantity pills: keyboard flow

## What to build

Esc from the search moves focus to the quantity pill of the merc hired last (the trigger if none was hired). Enter on a focused pill opens its quantity editor. Tab and Shift+Tab walk the pills in displayed order, top to bottom, with or without an editor open. In an open editor, Tab commits the value and opens the next pill's editor, Shift+Tab does the same toward the previous one, and Esc cancels the edit and keeps focus on the pill. At the first and last pill focus leaves the list normally.

## Status

done (integration/b14-b18)

## Acceptance criteria

- [ ] Esc from the search focuses the last-hired merc's pill, or the trigger when none was hired.
- [ ] Enter on a focused pill opens its editor.
- [ ] Tab and Shift+Tab move between pills in displayed order, editor closed.
- [ ] With an editor open, Tab commits and opens the next editor; Shift+Tab goes to the previous; Esc cancels and keeps focus on the pill.
- [ ] Focus leaves the list at the first and last pill.
- [ ] Tests run on both the TS and kernel paths.
- [ ] Gate green: `pnpm typecheck`, `pnpm lint`, `pnpm test`.

## Design rules touched

Same keyboard rules as B-14.

## Size

S

## Blocked by

[[B-14-merc-search-keyboard]]
