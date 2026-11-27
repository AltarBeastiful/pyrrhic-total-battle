---
type: reference
title: "B-40 + and − on artifact level and star"
created: 2026-11-27
tags: [backlog, artifacts, done]
related: ['[[B-38-game-data-artifacts-arena-capacity]]', '[[design-rules]]']
---

# B-40 + and − on artifact level and star

Status: `done` (2026-11-27, merged on branch `b38-game-artifacts`, not pushed). From [[B-38-game-data-artifacts-arena-capacity]]. Cite [[design-rules]] (rules 10, 23 and 24) in any UI brief.

Standing criteria: the benchmark rating does not regress; tests are written once and run on TS and kernel, red on both first.

## What to build

A player bumps an artifact's level and star up or down with + and − in the artifact editor, in the calculator and Prime Arena.

## Acceptance criteria

- [ ] Level moves by 1 and stops at 1 and 60.
- [ ] Star moves by one segment (2.0 to 2.1, 1.4 to 2.0) and stops at 0.1 and 5.0.
- [ ] The resulting bonuses shown in the editor follow each press.
- [ ] The controls follow the existing stepper pattern, have accessible names and work from the keyboard.
- [ ] They appear in the editor only; captain controls are unchanged.

## Blocked by

- [[B-39-artifact-values-from-game]]
