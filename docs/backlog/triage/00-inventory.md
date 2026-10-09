---
type: analysis
title: Todos triage, inventory of ideas in todos.md
created: 2026-10-09
tags: [backlog, triage]
related: ['[[progression-advisor]]']
---

# Inventory of `todos.md`

Source: `todos.md` (105 lines, last entry dated 28/09 22:43). Every idea is numbered `T-nn` in file order, with the original wording quoted. Compound bullets are split where they are separate asks; the parent is named in the "Part of" column. Classification comes in the next step of the triage ([[01-relevant]], [[02-done-or-obsolete]], [[03-needs-owner]]); this file only lists. Context read: `docs/PLAN.md` story table (S-01 to S-158), `docs/design-rules.md` (sections 1 to 7), `docs/plans/*.md` (19 plans, see [[progression-advisor]] at `docs/plans/progression-advisor.md`), and the 16 entries of `docs/research/`.

| Id | Part of | Area | Original wording (quoted) |
| --- | --- | --- | --- |
| T-01 | | Plan table | "plan table could show a hue around the sweet spot (and we could checkk that it's the best rated)" |
| T-02 | | Raise positions | "[done — S-142] Mercs and monsters can be raised to what the troops still shelter, in tens or exactly, from the army block (a per-pool three-position control; the "best damage" position is written up as the next step)." (already marked done by the owner) |
| T-03 | T-02 ref | Raise positions | "We still get some scenarios, especially without monsters where we could add more mercs while still protecting them without augmenting silver: maybe somehting to consider when planning" |
| T-04 | T-02 ref | Raise positions | "OR let the user choose and add a small button on a stack of mercs that could be up, or a global button to say "in this config of troops, for that silver, use most mercs you can"" |
| T-05 | T-02 ref | Raise positions | "One last option would be to consider rouding to the nearest 10 when its still shielded." |
| T-06 | | UI input | "UI: When editiing counts, validate with enter key" |
| T-07 | | UI input | "UI: Same in popup validate on entry" |
| T-08 | | UI heroes | "UI: Help to know which hero is at what level. For now we have to click to see level and stars. Could at least be on hover. Would be best visually but might be too much. Perhaps the level could be in hte badge and entered hero woudl have a small icon with the star number. It would double as an indicator of any hero with the level entered. To design in an artifact first as we don't want to crowd the UI." |
| T-09 | | Advice | "Long term: Offer advices on what could improve greatly the plan, ex: "up the dominance..." or "add a monster..."" |
| T-10 | T-09 | Advice | "Could help the user tweak the marches even more or guide his next best moves in terms of research or training" |
| T-11 | | Linearity check | "We should check again, on the cases with aydea, varying some parameters doesn't seem to produce linear results: upping the leadership" |
| T-12 | T-11 | Linearity check | "upping army modernization strength (when monsters added), needs to be checked again if no dominance is selected" |
| T-13 | | Monsters | "Long term: Offer a quick way to use less monsters, we already have using less mercs in the plan table and thats mainly from my point of gaming. maybe user feedback could help there" |
| T-14 | | Accounts | "Long term: offer account with googlelogin, already planned and partly deployed (backend at lezast I think)" |
| T-15 | | Wording | "UI: Remove em dashes in the UI (and possibly every files)" |
| T-16 | | Equipment | "UI: [Equipment] Revamp so preview is not so crowded, show an example of an actual usage." |
| T-17 | T-16 | Equipment | "![alt text](image.png) on this picture two heroes have a 3 set equipement qui different quality each" (the image file is not in the repo) |
| T-18 | T-16 | Equipment | "Sets can be unequiped and requipped on another hero and usually are as we usually only keep a max of 9 items at high level and more probably a 3piece set very high and the rest a lit bit less" |
| T-19 | T-16 | Equipment | "Change badge to display equipement grade (poor, uncommon...) using a letter and maybe code color ?" |
| T-20 | T-16 | Equipment | "Don't show the bonus on the pill, show it on hover and when clicking on configure on the badge" |
| T-21 | T-16 | Equipment | "Basically we could have sets (for each hero) that could be enabled or disabled toether but the UI would be complex. Or keep one item at a time, or somehting else if we find" |
| T-22 | | Sweeps | "Long term: sliding leadership and dominance to check if we have high points in some markers." |
| T-23 | T-22 | Sweeps | "We can even use actual planning algorithm as it's pretty fast now" |
| T-24 | T-22 | Sweeps | "One problem that could be addressed when doing this: With high dominance there seems to be a pattern of silver saving which keep minimal merc stack (usually 10 or under) and other plans which all pretty much fill dominance getting some pretty unequal stacks. We could solve this by keeping track of monster spent, maybe making it less important using ranking (0.5 monster/dmg, 1 merc/dmg)" |
| T-25 | | Mobile | "UI [Mobile]: Press back on mobile closes popup (like troop settings..)" |
| T-26 | | Raise positions | "coulb be a safe push numbers of mercs or monsters to fill the stack" |
| T-27 | | Game data | "[game] Fill vip table with game data for each level" |
| T-28 | | Game data | "[game] Fix hall of fame form to match the actual game bonuses" |
| T-29 | | Merc deaths | "maybe creating a quick change to numbers of mercs dying, at least giving some options. sometimes a heroe level increase or more leadership just make the merc dies go up too much and I would like to fine tune it sometimes. Only give me the best options tough and don't let me get lower than merc saver. Lets first check if theres spikes when moving that number" |
| T-30 | | Trades | "Teaking the melee health, I discovered that sometimes we offer a way lesser trade, for example using the json below, I get a march with spIII and SW1 left out, if I add back SW1 I get 27M damage for dominance (so gold for reviving), mercs and silver. And the only way to get this trade tight now, is moving up the ladder in the table to next trade for more mercs. SO it might not be a problem but putting back troops seems to stack way too much mercs. and the only way to get good damage is to up hte mercs dead by 2-4 using the table. Might be linked to the mercs slider, but also users might feel that its hard to obtain. Maybe solution would be to help the user with another list of trades ? or an alternative one to let him understand why that trade can't be made with those settings. Its just weird as a user to improve a research, regenrate and get its damage cut in half in a seamlinglt bad trade." Data: `[text](pyrrhic-my-account-2026-10-07.json)` (the file sits untracked in the repo root) |
| T-31 | | Tight | "Tight almost alwyas feels better than as is and no other even compares as they always use more mercs. Lets first check if we cna optimize tight further to get better trades," |
| T-32 | T-31 | Tight | "then lets move it as default; removing the table and other options on the selector; lets keep as is for now," |
| T-33 | T-31 | Tight | "but lets add a hover to preview the trade it offers (usually a bit less gold and less damage), showing only silver, gold and damage." |
| T-34 | | Rating | "We also have problems with higher troops depending on bonuses. adding ARC3 on my profile decreases rating of marches. See reference march below" (reference march: SP1 1377, SW1 2655, RD1 605, RD2 336, ARC1 1372, RD3 188, ARC2 759, SP3 424, SP2 751, EMH6 30, BB 18, SG 17, ED 19, WE 40) |
| T-35 | | Raise positions | "With the new positions, I sometimes get amazing trades (at least right now as I'm pretty flush in gold) using tight on the lowest merc positions. And the slider now uses too many mercs on the other becaus eI have some stock. just got Tight 22.4M +74.4% 4.1M +3.9% 6.2K +204.4% 8" with two sample marches (Tight 22.4M: SW1 3024, ARC1 1827, SP1 1671, RD1 797, ARC2 1008, SP2 924, RD2 440, ARC3 564, SP3 516, RD3 246, BB 27, ED 27, SG 23, WE 59, SPX6 3, CHR6 10, LGN6 20, EMH6 20, ABT6 19; as is 12.8M: same troops, ED 9, LGN6 13, ABT6 14, EMH6 13, WE 20, CHR6 6, BB 8, SG 7, SPX6 1) |

## Counts

35 ideas (T-02 and T-35 are the owner's own status or a report that carries data; T-17 is an illustration, not an ask).

## Notes for the classification step

- T-02 carries the owner's own "done" mark, citing S-142. S-143 to S-149 (the `Best`, `Safe`, `Tight` positions and the selector) follow it in `docs/PLAN.md` and touch T-03 to T-05, T-26 and T-35.
- T-09, T-10, T-22 to T-24 and T-11 to T-12 overlap the advisor plan, `docs/plans/progression-advisor.md` and `docs/plans/advisor-step-d.md` (S-150 to S-158).
- T-31 to T-33 overlap `docs/plans/tight-default.md`.
- T-14 is the SSO work, `docs/plans/sso-accounts.md` (ADR 0009 in `docs/decisions/`).
- T-34 and T-35 have reproducible data in the item; T-30 depends on the untracked `pyrrhic-my-account-2026-10-07.json`.
