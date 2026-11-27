---
type: reference
title: "B-37 Prime Arena: report-faithful match, role-aware planner"
created: 2026-11-26
tags: [backlog, prime-arena, done]
related: ['[[B-32-prime-arena-match-engine]]', '[[B-34-prime-arena-attack-planner]]', '[[design-rules]]']
---

# B-37 Prime Arena: report-faithful match, role-aware planner

Status: `done` (2026-11-27, merged on branch `prime-arena`, not pushed). From the 2026-11-26 grill-me on the Prime Arena page, the rules research and a real battle report (two fights, F1 won, F2 lost). Supersedes the match, scoring and planner assumptions of [[B-32-prime-arena-match-engine]] and [[B-34-prime-arena-attack-planner]]. Cite [[design-rules]] in any UI brief. Notes outside the repo: `prime-arena-decisions.md`, `prime-arena-rules-research.md`, `prime-report-transcript.md` in the session scratchpad.

## Problem Statement

The Prime Arena plan the owner gets is not trustworthy. The mirror opponent always draws, so plans cannot be ranked and the planner stops early (42 of 1,500 evaluations) and can lose 5-0 to its own even-split start. Captain and health bonuses do not change the plan. The battle model disagrees with a real report: round percent there is surviving housing cost, not headcount; damage accumulates per stack with leftover kept and no spill; turns alternate one stack at a time. Raid-only captains count when they should not, Monuments and Personal Technologies are wrong stand-ins, and the owner cannot choose to play attacker or defender.

## Solution

A match engine that reproduces the logged steps of the real report, a winner rule that uses the in-game wording, and a planner that picks the best army for a chosen role against a panel of plausible opponents (including under-filled armies), spends all housing, and is never worse than its even-split start. The Arena counts only the bonuses the game counts, with Monuments and Personal Technologies typed by hand.

## User Stories

1. As a player, I want the match to measure each round by surviving housing cost, so that the result matches the in-game percentages.
2. As a player, I want damage to accumulate on a stack with leftover kept and no spill, so that the simulated kills match the battle log.
3. As a player, I want sides to alternate one stack per turn, each side acting with its strongest stack that has not yet acted, so that turn order matches the game.
4. As a player, I want the attacker to lead round 1 and the defender round 2, so that role matters as in the game.
5. As a player, I want win both rounds to be a victory, so that the headline is right.
6. As a player, I want a 1-1 split decided by the higher surviving share in the round that side won, so that it follows the in-game wording.
7. As a player, I want equal shares to be a draw, so that ties are honest.
8. As a player, I want specialist x2 damage and the +105 % against non-monster troops applied, so that specialist troops are not undervalued.
9. As a player, I want double damage applied as its expected value, so that procs are counted without randomness.
10. As a player, I want "blocked" damage left unmodelled and said so, so that I know the limit.
11. As a player, I want to choose attacker or defender with the calculator's own segmented control, so that the plan fits my role.
12. As an attacker, I want the plan to maximise the mean over opponents at strength 0.8 to 1.0, so that I get a robust plan.
13. As a defender, I want the plan to maximise the worst case over opponents at strength 1.0 to 1.25, so that I am safe against strong attackers.
14. As a player, I want the panel to include under-filled armies, so that opponents who forgot to fill their housing are covered.
15. As a player, I want the result to show the panel it was tested against, so that I can judge the plan.
16. As a player, I want up to a configurable number of stacks (default 8), with lower tiers allowed and each unit in at most one stack, so that I can field what real players field.
17. As a player, I want the stack cap to be a setting, so that I can change it when the real limit differs.
18. As a player, I want the planner to spend all my housing with the best-scoring fill, so that no capacity is wasted.
19. As a player, I want a plan never worse than the even-split start, so that Generate does not make things worse.
20. As a player, I want the planner to try restarts and wider moves within a 60 s cap, so that it finds good plans.
21. As a player, I want captain, gear and health bonuses to change the plan, so that my setup matters.
22. As a player with Leonidas, I want his +280 % melee health to make the plan field melee when it pays, with no special rule.
23. As a player, I want the pool taken from my Guardsmen level (S and G at tiers 2 to L, M at tiers 3 to L), so that it matches the in-game unlocks.
24. As a player, I want raid-only captains (Amanitore, Hercules) not to count in the Arena, so that totals are real.
25. As a player, I want Monuments and Personal Technologies as typed permanent sources, so that they are counted correctly.
26. As a player, I want Artemisia left out until I type her bonuses, so that no number is invented.
27. As a player, I want Leadership and Dominance typed by hand and checked as maxed, so that the plan uses my real limits.
28. As the owner, I want the benchmark rating not to regress, so that nothing outside the Arena changes.

## Implementation Decisions

- Match engine: round share is surviving housing cost over starting cost; per-stack accumulating damage with no spill; alternating single-stack turns choosing the strongest unacted stack on current numbers; attacker leads round 1, defender round 2; round ends on a wipe or when no progress is possible.
- Match result: victory, defeat, draw by the in-game wording; scoring ranks by rounds won, then the winning-round survivor share.
- Specialist x2 and +105 % vs non-monster troops are Arena bonuses (absent from the troop data). Double damage by expected value; blocked damage unmodelled.
- Race-aware targeting is deferred until more logs exist.
- Inputs: pool from the Guardsmen level; an Arena march type that counts only unconditional captain bonuses; Monuments and Personal Technologies are real typed permanent sources and the mismatched stand-ins are removed; schema bump with migration, section merge and share defaults as in earlier Arena bumps.
- Planner: role input; opponent panel at role-dependent strengths with under-filled members; stack cap setting; spend-all-housing fill; start-from-even-split guarantee; restarts and wider moves; 60 s cap.
- UI: role segmented control, panel note in the result, stack cap setting.
- Leonidas gets no special rule.

## Testing Decisions

- A good test checks external behaviour through the interface, never internals.
- Match seam: replay F1 and F2 logged steps (the Swordsman IV damage fit, the wipe-leftover figures, the 54.55 / 12.74 / 9.04 / 22.98 shares). Where the transcript is unreadable, say so rather than inventing numbers.
- Planner seam: never worse than the start; spends all housing; role changes the plan; under-filled opponents in the panel; stack cap respected; +280 % melee health makes the plan field melee; plan changes with captain and health bonuses.
- Inputs seam: pool by Guardsmen level; Amanitore and Hercules excluded; typed Monuments and Personal Technologies counted; migration and share round-trip.
- UI seam: the existing Arena frame render test checks the role control and the panel note.
- Prior art: the existing prime-arena, planner, housing and inputs tests; kernel-and-TS setup shared by all tests; `plan-benchmark` as the non-regression gate (only the owner re-bases baselines).

## Out of Scope

- Race-aware targeting, modelling blocked damage, Artemisia, the Defence squad, scouts, siege and mercenaries, and any change outside the Prime Arena path.

## Further Notes

- The real stack limit is unknown (reports show 8) and may vary, hence the setting.
- The benchmark run in the housing work logged "1 of 19 armies ran"; a full `plan-benchmark` re-run is owed before the ticket closes.
