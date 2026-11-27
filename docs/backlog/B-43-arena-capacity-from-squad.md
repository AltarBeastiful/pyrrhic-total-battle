---
type: reference
title: "B-43 Prime Arena capacity maxes from the squad"
created: 2026-11-27
tags: [backlog, prime-arena, data, done]
related: ['[[B-38-game-data-artifacts-arena-capacity]]', '[[design-rules]]']
---

# B-43 Prime Arena capacity maxes from the squad

Status: `done` (2026-11-27, merged on branch `b38-game-artifacts`, not pushed). From [[B-38-game-data-artifacts-arena-capacity]] (read "Prime Arena capacity"). Cite [[design-rules]] in any UI brief. New UI strings use no em dashes.

Standing criteria: the benchmark rating does not regress; tests are written once and run on TS and kernel, red on both first.

## What to build

Prime Arena fills Leadership and Dominance with the squad's maximum. The converter stores leadership, authority and dominance per level (1 to 600) for captains and for the hero. Maximum = floor of (sum of the squad captains' value at their level) × (1 + other capacity bonus % / 100), without the hero. Zeus' Lightning joins the formula in B-44. The march calculator is untouched.

## Acceptance criteria

- [ ] The converter builds the capacity table, checks all captains share one set, and reads "mastery" as authority.
- [ ] Leadership and Dominance fill when the squad's captains change, when a selected captain's level changes (even from another page), or when the other % changes.
- [ ] A typed value stays until one of those changes, including after a reload.
- [ ] A saved profile with no capacity basis keeps its typed values and adopts the basis, unless both pools are zero, which fills them.
- [ ] A Max button restores the maximum at any time.
- [ ] An "other capacity bonus %" field, default 0, sits with the two pools.
- [ ] Level-0 captains add nothing; captains whose bonuses do not count in the Arena still add capacity.
- [ ] The floor is exact, with no floating-point drift.
- [ ] The calculator's housing is never written and Arena authority stays 0.
- [ ] Next free schema version; section sync and share links carry the new fields.

## Blocked by

- [[B-39-artifact-values-from-game]]
