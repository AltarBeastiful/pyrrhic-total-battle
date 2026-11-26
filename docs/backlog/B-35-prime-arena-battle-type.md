---
type: reference
title: "B-35 Prime Arena battle type in the UI"
created: 2026-11-26
tags: [backlog, prime-arena, done]
related: ['[[B-32-prime-arena-match-engine]]', '[[design-rules]]']
---

# B-35 Prime Arena battle type in the UI

Status: `done` (2026-11-27, merged on branch `prime-arena`, not pushed). From the 2026-11-26 Prime Arena grilling. Cite [[design-rules]] in any UI brief.

## Context (shared by B-32 to B-36)

A Prime Arena stack optimizer, v1 for the **Attack squad only**, as a sixth battle type in the calculator. Rules (official support text, pasted by the owner): a match is two rounds between the same two armies, the attacker strikes first in Round 1 and the defender first in Round 2; each round starts from full armies; win both = victory, split = the higher surviving-troop share wins, equal = draw. Division = highest troop tier unlocked (GX); the pool is every Specialist and Monster troop at that tier (scouts, siege and mercenaries excluded, no training needed). Five captains, one shared gear and artifact loadout. Counting bonuses: captains, artifacts, equipment, enchantments and gems, Dragon, Hall of Fame, Monuments, Personal Technologies, talents. Not counting: titles, clan, kingdom, events, temporary bonuses. Leadership and Dominance typed by hand. Default opponent is a mirror (same composition, bonuses and gear). Candidates rank by rounds won, then total survivor share over both rounds.

Standing criteria: the benchmark rating does not regress; tests are written once and run on TS and kernel, red on both first; nothing outside the Prime Arena path changes.

## What to build

[[B-34-prime-arena-attack-planner]]

## Acceptance criteria

A sixth battle type with the B-33 inputs, a Generate button, and a result view with the stack list and a per-round battle log, in the style of TotalStack's stack list.

## Blocked by

M
