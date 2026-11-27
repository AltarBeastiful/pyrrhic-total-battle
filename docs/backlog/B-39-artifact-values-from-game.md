---
type: reference
title: "B-39 Artifact values from the game, by level and star"
created: 2026-11-27
tags: [backlog, artifacts, data, done]
related: ['[[B-38-game-data-artifacts-arena-capacity]]', '[[design-rules]]']
---

# B-39 Artifact values from the game, by level and star

Status: `done` (2026-11-27, merged on branch `b38-game-artifacts`, not pushed). From [[B-38-game-data-artifacts-arena-capacity]] (read it for the data and migration decisions). Cite [[design-rules]] in any UI brief.

Standing criteria: the benchmark rating does not regress; tests are written once and run on TS and kernel, red on both first.

## What to build

A player sets only an artifact's level and star, in the calculator or Prime Arena, and the app gives the game's own bonuses. A converter, run as a data script like the talent one, builds the artifact table from the `tb-analyze` export. Sixteen artifacts: the current fifteen plus Mars' Twin Blades. The typed percentage fields go away. The single random bonus keeps working as it does today until B-42. Bonuses against other players are not carried yet (B-41), and nothing in `tb-analyze` changes.

## Acceptance criteria

- [ ] One command rebuilds the artifact table from an export directory given as an argument or environment variable.
- [ ] The converter learns which unit-set size means which bonus key from the random option texts of the same export, and no size is hard-coded.
- [ ] The converter fails, naming the record, on an unknown effect kind, an unnamed or twice-claimed unit set, a missing artifact, or a level or star step that is missing or out of order.
- [ ] A hand-made export tests the decoding rules; with the real export present, the rebuilt table equals the committed one.
- [ ] Every artifact has 60 levels and 25 star steps (0.1 to 5.0); the total at a level and star is the level row plus the star row.
- [ ] Heart of the Forest at level 20, star 2.1 still gives army strength 258.
- [ ] Medallion of Unity gives no army strength; Ghostflame Lantern gives no plain army strength; Zeus' Lightning gives double damage chance from its stars and no army strength.
- [ ] The editor has no typed percentage fields and the "no level table yet" caveat is gone.
- [ ] Next schema version: manual values removed, level below 1 becomes 1, star 0.0 becomes 0.1. A new artifact starts at level 1, star 0.1. Old share links still open.
- [ ] Data version 2, with a changelog entry naming the three corrections.
- [ ] The data README documents the artifact table as generated; the research-capture parity test is amended only where the game contradicts the capture.

## Blocked by

None (can start immediately).
