---
type: reference
title: "B-29 Analyze all: keep, stale, row select"
created: 2026-11-20
tags: [backlog, spec, talents, ui, ready-for-agent]
related: ['[[B-28-talent-analyze-all]]', '[[B-24-talent-analyze]]']
---

# B-29 Analyze all: keep, stale, row select

Status: `done` (merged to main 2026-11-20). Written from the 2026-11-20 grilling. Blocked by: [[B-28-talent-analyze-all]].

## What to build

- The ranking is kept when the player leaves the page or the card and comes back, so the same question is not paid twice.
- It is marked stale when the account or the selected army changes, with a one-press Re-analyze.
- Selecting a row opens that talent in the tree, where the full single Analyze is one press away.

## Acceptance criteria

- [ ] Leaving and returning shows the kept result with no recomputation.
- [ ] Changing the account or the army marks it stale; Re-analyze refreshes it.
- [ ] A stale result is never shown as current.
- [ ] Selecting a row selects that talent and scrolls it into view.
- [ ] Tests cover keep, stale, re-analyze and row select.
