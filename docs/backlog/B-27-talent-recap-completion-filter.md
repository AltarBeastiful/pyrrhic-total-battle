---
type: reference
title: "B-27 Talent bonus recap hides by completion, with a floor"
created: 2026-11-20
tags: [backlog, spec, talents, ui, ready-for-agent]
related: ['[[B-26-talent-rank-chips]]', '[[design-rules]]']
---

# B-27 Talent bonus recap hides by completion, with a floor

Status: `done` (merged to main 2026-11-20). Written from the 2026-11-20 grilling. Blocked by: none (can run beside B-26).

## What to build

The tree's bonus recap hides a family when its bought ranks total two or fewer, so a 1/20 talent shows and a 1/1 talent hides. Replace the rule with completion.

- Completion of a family is its summed ranks (bought plus planned) divided by its summed max ranks.
- A family below 25 % completion is hidden. The threshold is a config constant.
- At least the top 4 families by bonus size always show, so the list is never empty.
- Rows keep their order by the larger of "now" and "after".
- "Show N more" reveals the hidden rows; its label states the new rule.

## Acceptance criteria

- [ ] A 1/20 talent is hidden and a 1/1 talent is shown (given enough other rows).
- [ ] With fewer than 4 families passing, the top 4 by size show anyway.
- [ ] The threshold lives in config, not in the component.
- [ ] "Show N more" counts exactly the hidden rows and reveals them.
- [ ] Tests cover the threshold edge, the floor and the order.
