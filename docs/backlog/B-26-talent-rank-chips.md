---
type: reference
title: "B-26 Talent rank chips: fewer key ranks, full list in the same style"
created: 2026-11-20
tags: [backlog, spec, talents, ui, ready-for-agent]
related: ['[[B-24-talent-analyze]]', '[[design-rules]]']
---

# B-26 Talent rank chips: fewer key ranks, full list in the same style

Status: `done` (merged to main 2026-11-20). Written from the 2026-11-20 grilling. Blocked by: none (can start immediately).

## What to build

In a talent's detail, the key-ranks line is too long to read and "Show all ranks" opens a separate table that repeats the same information in another style.

- The key-ranks line shows about 5 chips: rank 1, the held rank, the next planned rank, the midpoint and the last rank. A `…` marks each gap.
- "Show all N ranks" expands the same chips, one per rank, wrapped, in a box that scrolls on its own and opens on the held rank. Same chip look and the same held / planned / open states. The separate table and its columns are removed.
- Cost and "adds" are not shown in the chip. They live in the tooltip and the screen-reader label only.

## Acceptance criteria

- [ ] The key line has at most 5 chips for any talent, fewer when the talent has fewer ranks, with no duplicates.
- [ ] The full list uses the same chips, wrapped, with the held rank in view on open; no table remains.
- [ ] Each chip's tooltip and accessible label give rank, cost, adds and total.
- [ ] Held, planned and open states keep their colours in light and dark, and pass the contrast rules.
- [ ] Readable at 390 px with no horizontal page scroll; keyboard reachable.
- [ ] Tests cover the chip picks, the expanded list and the labels.
