---
type: reference
title: "B-14 Merc search: highlight, hire, clear, stay open"
created: 2026-10-19
tags: [backlog, ui, mercenaries, keyboard]
related: ['[[README]]', '[[design-rules]]']
---

# B-14 Merc search: highlight, hire, clear, stay open

## What to build

Typing in the Hire mercenary search highlights the first match. Up and Down move the highlight and Enter hires the highlighted merc. After a hire the text clears, the dropdown stays open and focus stays in the box, so several mercs go in one after another. Esc closes the dropdown and cancels the search.

## Status

done (integration/b14-b18)

## Acceptance criteria

- [ ] Every keystroke highlights the first result; Enter hires it.
- [ ] Up and Down move the highlight; Enter hires the highlighted one.
- [ ] After a hire the search text is empty, the dropdown is still open and the input keeps focus.
- [ ] Esc closes the dropdown and clears the search.
- [ ] Tests are written once and pass on both the TS and kernel paths; red first.
- [ ] Gate green: `pnpm typecheck`, `pnpm lint`, `pnpm test`.

## Design rules touched

Rules 1 to 3 of the keyboard-first family in [[design-rules]]; cite the exact numbers in the story brief.

## Size

S

## Blocked by

None (can start immediately)
