---
type: reference
title: "B-45 Prime Arena captain quick select"
created: 2026-11-27
tags: [backlog, prime-arena]
related: ['[[B-38-game-data-artifacts-arena-capacity]]', '[[design-rules]]']
---

# B-45 Prime Arena captain quick select

Status: `ready-for-agent`. From [[B-38-game-data-artifacts-arena-capacity]]. Cite [[design-rules]] (rules 23 and 24) in any UI brief. New UI strings use no em dashes.

Standing criteria: the benchmark rating does not regress; tests are written once and run on TS and kernel, red on both first.

## What to build

Opening Prime Arena fills the empty captain slots with the player's strongest captains, and a "Pick 5 strongest" button replaces the whole selection. Newly selected captains shine once.

Strongest: highest level first; ties by the sum of the bonus points that count in the Arena at that level and star; then the captain picker order. Level 1 and above only, one entry per captain.

## Acceptance criteria

- [ ] On each opening of the page, after the squad is first seeded from the march, empty slots fill up to five and chosen captains stay.
- [ ] With fewer than five owned captains, all of them are picked and no level-0 captain ever is.
- [ ] "Pick 5 strongest" sits beside the captains heading, in Prime Arena only, and replaces the selection without confirmation.
- [ ] Newly selected captains get one short shine and no lasting marker; under reduced motion nothing animates.
- [ ] The shine is view state: not saved, not synced.
- [ ] The selection from either path is saved like a hand-made one, so a capacity refill (B-43) follows it.
- [ ] The calculator's captain selection is unchanged.

## Blocked by

None (can start immediately).
