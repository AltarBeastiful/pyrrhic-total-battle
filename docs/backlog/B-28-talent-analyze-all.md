---
type: reference
title: "B-28 Analyze all: rank every analysable talent for battle"
created: 2026-11-20
tags: [backlog, spec, talents, engine, ready-for-agent]
related: ['[[B-24-talent-analyze]]', '[[B-25-copy-talents-to-battle]]', '[[B-29-talent-analyze-all-keep-stale]]']
---

# B-28 Analyze all: rank every analysable talent for battle

Status: `done` (merged to main 2026-11-20). Written from the 2026-11-20 grilling. Blocked by: none (single Analyze is already shipped).

## What to build

An **Analyze all** button on the Talents page that answers "where do I put my points for battle".

- It prices every talent the march rating can read, with no restriction to a tree, so a future talent that gains a battle effect joins automatically. Talents the rating cannot read (archeology, economy today) are not priced; the card says "N not rated in battle".
- Each talent is priced exactly as single Analyze does: the same ranks, both pool shapes (100 % and 80 %), the same baseline rule (held rank when the source matches the tree). No cheaper pass.
- It runs on the calculation pool with a progress bar and a cancel button, merged by position so one worker and six agree.
- The result is a ranking card above the tree, collapsed until pressed. One row per talent: held rank, max rank, gain at max, gain per talent point from the held rank to max. Default sort is gain per point.

## Acceptance criteria

- [ ] The analysable set comes from the engine, not a hard-coded tree list.
- [ ] Results match single Analyze for the same talent, to the digit.
- [ ] Progress is shown and cancel stops the run without leaving a partial ranking.
- [ ] The not-rated count is stated.
- [ ] One test, run on both the TS and the kernel paths, red on both first.
- [ ] Readable at 390 px; keyboard and screen-reader reachable; colours pass contrast.
