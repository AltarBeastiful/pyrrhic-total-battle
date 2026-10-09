---
type: analysis
title: Todos triage, ideas that need an owner decision
created: 2026-10-09
tags: [backlog, triage]
related: ['[[00-inventory]]', '[[01-relevant]]', '[[02-done-or-obsolete]]']
---

# Needs the owner

| Id | Question for the owner | Why it blocks |
| --- | --- | --- |
| T-21 sets enabled or disabled together per hero, or one item at a time | Which model: whole sets per hero (complex UI), one item at a time, or something else? | The todo itself leaves it open; it shapes the whole T-16 revamp ([[01-relevant]] T-16, T-18 to T-20) and design rule 6 (the form is the summary) limits how complex it may be. |
| T-24 monsters spent as a tracked cost (0.5 monster per damage against 1 merc per damage) | Is a monster worth half a merc in the rating? | `rate()` weights come from `CAMPAIGN.markerRates` in `src/config.ts`; a new weight is a rating change, and the benchmark rule is that a scenario must never get worse, only the owner registers a new baseline. |
| T-28 hall of fame form to match the game | What does the in-game panel list? | `src/ui/sections/bonuses/rows.ts` line 547 says it mirrors "the army bonuses the building lists on its info panel"; without a screenshot or the list of bonuses the form cannot be matched. |
| T-29 quick control for how many mercs die, only the best options, never below merc saver | Is a control wanted before the spike check, and where (March pane or the plan bar)? | The owner wrote "first check if there are spikes when moving that number": a measurement (an advisor-style sweep of the merc-death count) precedes any control; the plan bar already has a hired saver stop (W10). |
| T-35 the slider uses too many mercs on the other positions because of stock | Which "slider" and what is the rule: cap the hired burn, or prefer Tight at the lowest merc position? | The report mixes the merc slider and the raise positions; sample marches are in [[00-inventory]]. Related to T-15's scope question: a decision on whether `As is` should follow the stock. |
| T-15 scope | "Possibly every file": UI strings only, or also source comments and docs? | Counts in [[01-relevant]]: about 120 candidate UI lines, 2,483 in `src`, 2,642 in `docs`. Design rule 26 (our own words) is the only related rule; rewriting history-bearing docs is the owner's call. |
