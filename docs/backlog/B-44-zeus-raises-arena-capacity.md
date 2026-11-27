---
type: reference
title: "B-44 Zeus' Lightning raises Prime Arena capacity"
created: 2026-11-27
tags: [backlog, artifacts, prime-arena]
related: ['[[B-38-game-data-artifacts-arena-capacity]]', '[[design-rules]]']
---

# B-44 Zeus' Lightning raises Prime Arena capacity

Status: `ready-for-agent`. From [[B-38-game-data-artifacts-arena-capacity]].

Standing criteria: the benchmark rating does not regress; tests are written once and run on TS and kernel, red on both first.

## What to build

Zeus' Lightning equipped in the Arena squad raises the maximum: Leadership by its level bonus plus its unlocked Leadership lines, Dominance by its level bonus plus its unlocked Dominance lines, both added to the other capacity bonus %.

## Acceptance criteria

- [ ] The converter carries Zeus' Lightning's level capacity bonus.
- [ ] The two pools use their own random lines; locked lines do not count.
- [ ] Equipping or removing Zeus, or changing its level, star or capacity lines, refills the pools.
- [ ] Zeus counts only when equipped in the Arena squad, never from the calculator's march.
- [ ] Prime Arena drops the "not counted" mark on these lines; the calculator keeps it and its housing is unchanged.

## Blocked by

- [[B-42-artifact-random-lines]]
- [[B-43-arena-capacity-from-squad]]
