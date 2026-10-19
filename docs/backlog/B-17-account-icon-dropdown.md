---
type: reference
title: "B-17 Account icon with its own dropdown"
created: 2026-10-19
tags: [backlog, ui, shell, account]
related: ['[[README]]', '[[design-rules]]']
---

# B-17 Account icon with its own dropdown

## What to build

On the right of the top bar, an icon-only account control on every width, so it stays reachable on a phone. Signed in: a person icon or initial with a status dot. Signed out: a cloud-off icon with a muted dot. Its dropdown starts with the quick profile switcher (active profile checked, its name as the header), then Sign in, or account and Sign out, and the sync status. These entries leave the old combined menu.

## Status

done (integration/b14-b18)

## Acceptance criteria

- [ ] The account control is icon-only at every width and never wraps or hides on a phone.
- [ ] Signed-in and signed-out states are distinguishable by icon and dot.
- [ ] The dropdown lists profiles with the active one checked; picking one switches profile.
- [ ] Sign in, account, Sign out and sync status work as before.
- [ ] Keyboard and screen-reader labels exist for the icon and its state.
- [ ] Gate green: `pnpm typecheck`, `pnpm lint`, `pnpm test`, e2e after `pnpm build`.

## Design rules touched

Cite the mobile and accessibility rules of [[design-rules]] in the brief.

## Size

M

## Blocked by

None (can start immediately)
