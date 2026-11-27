---
type: reference
title: "B-41 Bonuses against other players count in Prime Arena"
created: 2026-11-27
tags: [backlog, artifacts, prime-arena]
related: ['[[B-38-game-data-artifacts-arena-capacity]]', '[[design-rules]]']
---

# B-41 Bonuses against other players count in Prime Arena

Status: `ready-for-agent`. From [[B-38-game-data-artifacts-arena-capacity]].

Standing criteria: the benchmark rating does not regress; tests are written once and run on TS and kernel, red on both first.

## What to build

The level and star bonuses "against other players" (Forest Crown, Mars' Twin Blades) count in Prime Arena totals and plans, in the same additive bracket as the others. The march calculator ignores them. Mars' Twin Blades' strike-two-squads chance from its stars is added to the existing strike-two-squads total.

## Acceptance criteria

- [ ] The converter carries the against-other-players level and star effects, marked as such.
- [ ] Prime Arena totals include them; calculator totals for the same artifacts do not.
- [ ] Mars' Twin Blades shows its strike-two-squads chance (tenths of a percent in the export) in both pages' totals; the battle model is unchanged.
- [ ] The data README and project plan record that artifact values against other players are kept and apply in Prime Arena only.
- [ ] The converter test covers the against-other-players mark and the strike-two unit.

## Blocked by

- [[B-39-artifact-values-from-game]]
