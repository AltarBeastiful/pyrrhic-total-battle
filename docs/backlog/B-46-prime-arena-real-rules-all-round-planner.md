---
type: reference
title: "B-46 Prime Arena: the game's own battle rules and an all-round planner"
created: 2026-11-27
tags: [backlog, prime-arena]
related: ['[[B-37-prime-arena-report-faithful-planner]]', '[[B-38-game-data-artifacts-arena-capacity]]', '[[B-39-artifact-values-from-game]]', '[[B-41-arena-against-players-bonuses]]', '[[design-rules]]']
---

# B-46 Prime Arena: the game's own battle rules and an all-round planner

Status: `done` (see Comments). From the 2026-11-27 grilling on two battle reports against one defender: the planner's squad lost 0-2, the game's default fill won 2-0. Evidence: theory-craft experiments 370 to 375 (transcript of the four rounds, fitted bonuses, target rule, forward replay, squad search). Cite [[design-rules]] in any UI brief. Supersedes the targeting, Arena source and opponent panel decisions of [[B-37-prime-arena-report-faithful-planner]].

Standing criteria: the benchmark rating does not regress (only the owner re-bases it); tests are written once, red first, then green.

## Problem Statement

The player generates a Prime Arena squad, the app says it wins both rounds, and in the game it loses both rounds. The game's default fill beats the same opponent. The app's battle does not follow the game's rules: it aims about half the hits at the wrong stack, ignores strength against beasts, giants, dragons and elementals, and adds the epic-monster bonus to every hit. It leaves out bonuses the game counts, so the player's own health and strength are far too low. It assumes opponents have only the army-wide part of the player's bonuses, so it believes cheap low-tier troops beat armies that are in fact several times stronger.

## Solution

The Arena battle follows the rules read from the reports, so that replaying both fights gives the same turns, targets, kills and survivor percentages as the game. The Arena counts the bonuses the game counts, with one typed row for what the app does not know. Generate with no enemy typed builds an all-round squad that does well against many balanced armies of the player's Guardsmen level carrying bonuses like the player's. When the player knows the enemy, they type its troops and counts and Generate counter-picks it (expected in about one use out of five).

## User Stories

1. As a player, I want each of my stacks to hit the enemy stack it would damage most, so that the simulated battle matches the game.
2. As a player, I want damage capped at what the target stack has left when it picks a target, so that a stack does not waste a hit the game would aim elsewhere.
3. As a player, I want ties between targets broken toward the enemy stack that would hit back hardest, so that targeting matches the game when several hits are equal.
4. As a player, I want strength against beasts, giants, dragons and elementals to count against monsters of that race, so that monster fights deal the game's damage.
5. As a player, I want strength against a race and against a troop type to add up on one hit, so that a unit with both gets both.
6. As a player, I want my strength against epic monsters left out of the Arena, so that Ghostflame Lantern does not inflate player-versus-player damage.
7. As a calculator user, I want my epic-monster marches unchanged, so that the Arena fix costs me nothing elsewhere.
8. As a player, I want turn order, damage carried over on a stack, no spill to other stacks, and the Specialist bonuses to keep working as today, so that what already matches the game still does.
9. As a player, I want Army Modernization to count in the Arena, so that my troop-type bonuses are right.
10. As a player, I want Monsters Boost to count in the Arena, so that my beast monsters are right.
11. As a player, I want an "other Arena bonus" row for army health and strength, so that I can close the gap to the game when the app lacks a source.
12. As a player, I want that row to count in the Arena only, so that my marches are not changed by it.
13. As a returning player, I want my saved squad and switches kept when these sources start counting, so that nothing I typed is lost.
14. As a player on two devices, I want the new row and the typed enemy synced, so that both devices agree.
15. As a player, I want old share links to keep opening, so that sharing still works.
16. As a player who does not know the enemy, I want Generate to build a squad that wins against many balanced armies, so that one press gives me a squad I can field against anyone.
17. As a player, I want those assumed enemies built from my Guardsmen level, so that I am not planned against troops I never meet.
18. As a player, I want assumed enemies to field every top-tier troop type and top-tier monster in roughly even shares, so that they look like the armies I meet.
19. As a player, I want assumed enemies to vary in size and bonus level up to somewhat above mine, so that a stronger opponent is covered.
20. As a player, I want assumed enemies to carry my troop-type and captain bonuses, so that the app does not underrate them.
21. As a player, I want no saved reference opponent to be needed, so that I have nothing to maintain.
22. As a player, I want squads ranked by wins first, then by how far ahead I finish, then by how I do in the bad cases, so that the plan is strong and safe.
23. As an attacker, I want the plan to assume I strike first in round 1, so that my role is respected.
24. As a defender, I want the plan to assume I strike first in round 2, with the same ranking, so that my defence squad is built the same way.
25. As a player, I want the same inputs to give the same plan, so that I can trust and compare plans.
26. As a player, I want Generate to answer within a minute with the page staying responsive, so that I can use it during the event.
27. As a player, I want the plan never worse than the default even fill against the same enemies, so that Generate cannot make me weaker than pressing nothing.
28. As a player who knows the enemy, I want to type its troop types and counts, so that the app can counter-pick it.
29. As a player, I want typed enemies to carry my bonuses, so that I only have to type what the game shows me.
30. As a player, I want to clear the typed enemy in one action, so that I return to the all-round plan.
31. As a player, I want the typed enemy kept after a reload, so that I can attack the same player again.
32. As a player, I want the page to say whether the plan is all-round or a counter-pick, so that I never field one thinking it is the other.
33. As a player, I want an all-round result to show the share of assumed enemies beaten, my average lead and my lead in the bad cases, so that I can judge the squad.
34. As a player, I want a counter-pick result to show the two rounds against the typed enemy with their battle log, so that I can compare it with the report afterwards.
35. As a player, I want an all-round result to show the two rounds against an even army of my own size, so that I still have a battle log to read.
36. As a player, I want the lead described in plain words (my survivors minus theirs), so that I know what the figure means.
37. As a player, I want the page to keep saying that blocked damage is not modelled, so that I know the limit.
38. As the owner, I want my four reported rounds kept as a regression test, so that a later change cannot silently break the battle rules.
39. As the owner, I want the planner's quality checked on armies it did not search against, so that it is not tuned to its own test.

## Implementation Decisions

### Battle rules (the Arena match)

- A hit's strength against its target is the sum of the entry for the target's troop type, the entry for the target's race when it is a monster, and, for a Specialist hitting a troop, the Arena's +105. The Specialist x2 stays. These reproduce every uncapped logged hit within 0.001 %.
- The epic-monster strength-against special is not applied in the Arena. The march calculator's use of it does not change.
- Race strength-against is an Arena match change; the march calculator's behaviour does not change.
- Target rule, fitting 146 of 146 logged hits (replaces "category first, then the largest remaining pool"). From the prototype:

```
for each living enemy stack t:
  effective = min(hit(actor, t), remaining HP of t)     // hit before any double damage
  threat    = hit(t, actor)                             // t's own hit, on its living count, uncapped
target = max effective; equal effective (relative 1e-6) → max threat
```

- Turn order, per-stack damage pools without spill, round end, round share and match winner are unchanged; all matched the logs.
- Double damage stays an expected value in planning. The match accepts an optional record of which turns rolled double damage, used only to replay real reports.
- "Blocked" damage stays unmodelled.

### Arena bonuses

- Army Modernization and Monsters Boost join the permanent sources the Arena counts, each with its switch, on by default. This reverses part of the schema 20 change, so the next schema version restores the switches.
- Customization is not added: the logs do not show it either way.
- A new typed permanent source, "Other Arena bonus" (army health and strength), counts in the Arena only.
- Artifact values are the concern of [[B-39-artifact-values-from-game]] and [[B-41-arena-against-players-bonuses]]; this item does not change them.

### Planner

- Without a typed enemy, the opponent set is generated, replacing the mirror and heavy-class panel for both roles. Each assumed enemy fields the top-tier troop of every type (archer, spearman, rider, swordsman) and every top-tier monster of the player's Guardsmen level; each stack's share of its housing varies by up to ±25 % around even; army size is 80 to 120 % of the player's; bonuses are the player's full totals, health and strength scaled between 75 and 120 %. Generation is seeded.
- At least 16 assumed enemies per search. In experiment 375, 16 and 48 gave the same quality (98 to 100 % wins on 600 unseen enemies, average lead about 52 points per round); one reference enemy was less steady, and a build against one real enemy overfitted.
- Ranking over the set: share of matches won, then the mean lead (own survivor share minus the enemy's), plus the lead of the worst tenth. The same for attacker and defender; the role only decides who strikes first in each round. The worst-single-member rule for the defender goes away.
- With a typed enemy, the set is that one army, carrying the player's totals; ranking is match result, rounds won, then lead.
- The default even fill is always a candidate, so a plan is never worse than it on the ranking in use.
- Unchanged: stack cap setting (default 8), one stack per unit, spend-all fill, pool from the Guardsmen level, 60 s cap, work on the arena's own worker.
- The search must fit the cap with 16 enemies: per-unit effective figures are computed once per plan, not per hit. The experiment's unoptimised match ran about 9,000 matches a second.

### Saved profile, sync, share

- Next schema version with a migration: the two restored switches, the new source row, and the typed enemy (unit and count pairs, empty by default). Section merge and share-link defaults cover them, as in earlier Arena bumps.
- The typed enemy offers the units of every type up to the Guardsmen level.

### UI

- The enemy entry is a card in the arena's setup column, using the existing unit badges and number fields, with one clear action. Empty means all-round.
- The result names its mode. All-round: wins over the assumed enemies, mean lead, bad-case lead, and the two-round log against an even army of the player's size with the player's bonuses. Counter-pick: the two rounds against the typed enemy.
- New UI strings use no em dashes.

## Testing Decisions

- A good test checks external behaviour through the interface, never internals.
- **Match seam** (the main one): replay the four logged rounds from the starting armies. Assert for every turn the acting side and stack, the target, the living counts and the kills, and the round shares (lost match: 0 / 19 % and 0 / 26 %; won match: 31 / 0 % and 32 / 0 %). The fixture carries the transcript and the bonuses fitted in experiment 371. In experiment 373 three rounds were exact and the first lost round drifted by 2 units from turn 30, so refit health within the ranges the kills allow until it is exact; if it cannot be, report it, and do not loosen the assertion silently.
- Small match cases for each rule on its own: capped-damage targeting, the threat tie-break, race strength-against, no epic-monster bonus.
- **Planner seam**: without an enemy the plan beats the default even fill on a held-out set of generated enemies (different seed, never searched against); with a typed enemy it does at least as well against that enemy as the all-round plan; Guardsmen level fixes the enemies' tiers; same inputs give the same plan; housing spent and stack cap respected; both roles; the cap on time and evaluations holds.
- **Inputs, store and page seams**: Modernization, Monsters Boost and the new row counted in the Arena and the row ignored by the march calculator; migration and share round-trip; typed enemy saved, cleared and reflected in the fingerprint; the result names its mode.
- Prior art: the Arena engine, planner, planner-roles, housing and inputs tests; the Arena frame render and store tests; the migration and share codec tests.
- Existing tests that pin the old target rule, the old panel or the dropped switches are rewritten to the new behaviour; each rewrite is listed in the change's report.

## Out of Scope

- Importing battle reports, or fitting bonuses from a report inside the app.
- Saved enemy profiles; typing an enemy's bonuses.
- Modelling blocked damage or strike-two-squads.
- The Defence squad beyond the defender role, scouts, siege and mercenaries.
- Artifact values, capacities and captain quick select ([[B-38-game-data-artifacts-arena-capacity]]).
- Any change to the march calculator's results.

## Further Notes

- **Order.** The battle rules can start now. The sources, schema and planner inputs wait for the `b38-game-artifacts` branch to merge: it edits the same Arena inputs and takes a schema version.
- **Measure before shipping the planner.** Experiment 375 covered the attacker only, and half of its assumed enemies had the fitted bonuses of the reported defender; the generator here uses the player's own. Re-run the comparison with this generator, for both roles.
- **Owner's checks in game** (not blocking): talent "Monsters' strength II" is unranked while the node after it is ranked (the logs show its +45); Monuments and Personal Technologies are empty; Knight of Dalarna and Valkyrie Diadem typed values show health different from strength, which the game tables only give through random lines. About 77 army strength and 62 army health are unexplained today, and the B-39 values may change that figure.
- **In-game test owed.** Squad to field against the next tier IV enemy, with the report kept: Rider IV 10,374, Spearman IV 15,936, Swordsman III 7,590, Swordsman IV 8,471, Gorgon Medusa 161, Many-Armed Guardian 1,036. The model predicts a 2-0 win with a lead of about 50 points against the reported defender. It assumes the captains and bonuses of the 2026-11-27 export.
- **Limits of the evidence.** One opponent and two matches. The tie-break rests on about 30 tied hits. Tier III monster health and the player's Archer IV strength were never observed.

## Comments

### Build report, 2026-11-27

**Change from the spec.** "Turn order, damage pools ... unchanged": health per unit is no longer rounded in the Arena match. With whole-point health no value of seven stacks reproduces the logged kills; unrounded, every stack fits at a one-decimal health bonus and all four rounds replay exactly. The march calculator still rounds.

**Readings of the spec.** All-round ranking: wins, then (mean lead + bad-case lead). Bad-case lead: the value at the worst-tenth mark (as in experiment 375). Enemy shares: weights within 25 % of even, then normalised per pool (as in 375). The role never changes the squad, only who strikes first.

**Measured (experiment 376).** 600 unseen enemies, level IV: all-round plan 93 % wins, lead +35, bad case +5; default fill 53 %, +1, -30; both roles equal. 2-0 against the reported defender (lead +46). Planning time 2.7 s at level IV, 10.6 s at level IX on this machine. A counter-pick of the reported defender built with our bonuses on their side did worse against their fitted bonuses (lead +19) than the all-round plan.

**Tests rewritten to the new behaviour.**
- `prime-arena.test.ts`: "targets the living stack with the highest total HP first" replaced by the capped-damage and threat cases.
- `prime-arena-planner.test.ts`, `prime-arena-planner-roles.test.ts`: the opponent panel, the mirror headline, the defender worst case and the defender margin cases replaced by the generated-enemy, counter-pick and default-fill cases. `prime-arena-housing.test.ts`: inputs gain the level.
- `primeArenaInputs.test.ts`: Army Modernization and Monsters Boost are counted again (only Customization stays out).
- `PrimeArenaFrame.test.tsx`: permanent chips list, panel wording and "worst case" replaced by the mode wording. `primeArenaStore.test.ts`: the enemy joins the saved inputs and the fingerprint.
- `worker/client.test.ts`: level, and mode instead of aggregate. `store.test.ts`, `exportImport.test.ts`: eleven permanent rows. `migrations.test.ts` v25 case reads the current version. `codec.test.ts`: the enemy round trip.

### Review fixes, 2026-11-27

- A unit typed above the Guardsmen level keeps its field on the Enemy card.
- The even fill the plan is compared with opens no stack outside the top tier; the page calls it "an even fill of your top tier".
- "Beats X %" counts matches really won; draws are listed apart. A plan with nobody to field says so.

Checked: unit suite (2917 pass), end-to-end (71 pass; "what to upgrade next" and "talents journey" fail on phone and desktop, as before this work), and the page at 1400 and 390 px in both schemes with no console error and no sideways overflow.

**Left as found.** Experiments 370 to 375 are untracked; 370 and 371 use the removed panel API and 372 to 374 did not typecheck before, so `pnpm typecheck` fails in a checkout that holds them.

### No stack cap, 2026-11-27

Owner: the stacks of a squad are however many troop types the player has available. This replaces "Unchanged: stack cap setting (default 8)": the setting and its field are removed (schema v28), and a squad may field every unit of the pool, each once. The planner now stops at 20,000 scored squads by default (and still at 60 s), so equal inputs give an equal plan on a slower machine.

A climb free to split from the start loses its way among small stacks (at level IV with no bonuses it found 94 % where an eight-stack squad beats all 16), so the first climbs hold a squad to eight stacks, on half the budget, and the best is then climbed without that bound. Eight is a search setting, not a rule.

Experiment 376, 200 unseen enemies per level, wins of the all-round plan (old 8-stack cap in brackets): II 91 (91), III 90 (91), IV 93 (93), V 83 (86), VI 91 (71), VII 94 (68), VIII 96 (82), IX 100 (81). Level IV, the owner's, picks the same squad as before. Planning takes about 4 s at level IV and up to 24 s at levels V to IX on this machine.

From level VI the squad fields 20 to 27 stacks against assumed enemies of 12 (top tier only, as specified). Turn order between sides with such different stack counts was never seen in a report (both had 8), so treat those figures with caution.

Tests rewritten for it: planner "respects maxStacks" and the store, page, share, worker and migration cases that named the cap.

