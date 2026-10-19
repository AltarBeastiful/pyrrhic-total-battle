---
type: reference
title: "B-16 Bonuses: Artifacts and Titles open when something is active"
created: 2026-10-19
tags: [backlog, ui, bonuses]
related: ['[[README]]', '[[design-rules]]']
---

# B-16 Bonuses: Artifacts and Titles open when something is active

## What to build

Each of the Artifacts and Titles panels opens on load when its remembered state is open, or when at least one artifact or title is active. Otherwise it stays closed. The remembered state stays per device in localStorage, never in the saved document, share links or account sync. Collapsing a panel by hand holds for the session. The owner has not tested whether the current persistence fails, so the first step is to check the stored value and the load order.

## Status

done (integration/b14-b18)

## Acceptance criteria

- [ ] With an active artifact or title, the matching panel is open after a refresh and on reopening the site.
- [ ] With none active and no stored state, both panels are closed.
- [ ] A panel left open stays open after a refresh even with nothing active.
- [ ] The state is still not part of the saved document, share links or account sync.
- [ ] A remount test covers each case, and a check of why the current persistence did or did not hold is noted in the story.
- [ ] Gate green: `pnpm typecheck`, `pnpm lint`, `pnpm test`.

## Design rules touched

Whichever rule covers view preferences kept out of the document; cite it in the brief.

## Size

S

## Blocked by

None (can start immediately)

## Findings

- The persistence check: `readFold` already read `pyrrhic.ui.v1` on mount, and the remount cases passed before any change. What was missing was opening on an active item, and a document arriving after the first render.
- Switching profile re-resolves the folds, so a hand collapse holds only within a profile. This is kept as it is.
