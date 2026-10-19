---
type: reference
title: "B-18 Menu dropdown on the left of the bar"
created: 2026-10-19
tags: [backlog, ui, shell]
related: ['[[README]]', '[[design-rules]]']
---

# B-18 Menu dropdown on the left of the bar

## What to build

A menu button next to the brand opens a dropdown with the app-level items: export, import and share link; theme; pool-line; install and update; About; and the profile management entries (rename, new, duplicate, delete). The old combined menu is gone. The dropdown is the slot where navigation links go once there are pages.

## Status

done (integration/b14-b18)

## Acceptance criteria

- [ ] The menu button sits next to the brand and opens the dropdown on every width.
- [ ] Every item the old combined menu held that is not in the account dropdown is reachable here, in the old section order, with dividers.
- [ ] Dialogs and the file input still open from their entries.
- [ ] Nothing remains of the old combined menu.
- [ ] Gate green: `pnpm typecheck`, `pnpm lint`, `pnpm test`, e2e after `pnpm build`.

## Design rules touched

Cite the menu and mobile rules of [[design-rules]] in the brief.

## Size

M

## Blocked by

[[B-17-account-icon-dropdown]]
