A few ideas in random order, to verify plan and validate:

- plan table could show a hue around the sweet spot (and we could checkk that it's the best rated)
- [done — S-142] Mercs and monsters can be raised to what the troops still shelter, in tens or exactly, from the
  army block (a per-pool three-position control; the "best damage" position is written up as the next step).
  - [Ref] We still get some scenarios, especially without monsters where we could add more mercs while still protecting them without augmenting silver:
  - maybe somehting to consider when planning
  - OR let the user choose and add a small button on a stack of mercs that could be up, or a global button to say "in this config of troops, for that silver, use most mercs you can"
  - One last option would be to consider rouding to the nearest 10 when its still shielded.
- UI: When editiing counts, validate with enter key
- UI: Same in popup validate on entry
- UI: Help to know which hero is at what level. For now we have to click to see level and stars. Could at least be on hover. Would be best visually but might be too much. Perhaps the level could be in hte badge and entered hero woudl have a small icon with the star number. It would double as an indicator of any hero with the level entered. To design in an artifact first as we don't want to crowd the UI.
- Long term: Offer advices on what could improve greatly the plan, ex: "up the dominance..." or "add a monster..."
  - Could help the user tweak the marches even more or guide his next best moves in terms of research or training
- We should check again, on the cases with aydea, varying some parameters doesn't seem to produce linear results:
  - upping the leadership
  - upping army modernization strength (when monsters added), needs to be checked again if no dominance is selected
- Long term: Offer a quick way to use less monsters, we already have using less mercs in the plan table and thats mainly from my point of gaming. maybe user feedback could help there
- Long term: offer account with googlelogin, already planned and partly deployed (backend at lezast I think)
- UI: Remove em dashes in the UI (and possibly every files)
- UI: [Equipment] Revamp so preview is not so crowded, show an example of an actual usage.
  - ![alt text](image.png) on this picture two heroes have a 3 set equipement qui different quality each
  - Sets can be unequiped and requipped on another hero and usually are as we usually only keep a max of 9 items at high level and more probably a 3piece set very high and the rest a lit bit less
  - Change badge to display equipement grade (poor, uncommon...) using a letter and maybe code color ?
  - Don't show the bonus on the pill, show it on hover and when clicking on configure on the badge
  - Basically we could have sets (for each hero) that could be enabled or disabled toether but the UI would be complex. Or keep one item at a time, or somehting else if we find
- Long term: sliding leadership and dominance to check if we have high points in some markers.
  - We can even use actual planning algorithm as it's pretty fast now
  - One problem that could be addressed when doing this: With high dominance there seems to be a pattern of silver saving which keep minimal merc stack (usually 10 or under) and other plans which all pretty much fill dominance getting some pretty unequal stacks.
  - We could solve this by keeping track of monster spent, maybe making it less important using ranking (0.5 monster/dmg, 1 merc/dmg)
- UI [Mobile]: Press back on mobile closes popup (like troop settings..)
- coulb be a safe push numbers of mercs or monsters to fill the stack
- [done 2026-10-10, B-07] [game] Fill vip table with game data for each level
- [game] Fix hall of fame form to match the actual game bonuses
- maybe creating a quick change to numbers of mercs dying, at least giving some options. sometimes a heroe level increase or more leadership just make the merc dies go up too much and I would like to fine tune it sometimes. Only give me the best options tough and don't let me get lower than merc saver. Lets first check if theres spikes when moving that number
- Teaking the melee health, I discovered that sometimes we offer a way lesser trade, for example using the json below, I get a march with spIII and SW1 left out, if I add back SW1 I get 27M damage for dominance (so gold for reviving), mercs and silver. And the only way to get this trade tight now, is moving up the ladder in the table to next trade for more mercs. SO it might not be a problem but putting back troops seems to stack way too much mercs. and the only way to get good damage is to up hte mercs dead by 2-4 using the table. Might be linked to the mercs slider, but also users might feel that its hard to obtain. Maybe solution would be to help the user with another list of trades ? or an alternative one to let him understand why that trade can't be made with those settings. Its just weird as a user to improve a research, regenrate and get its damage cut in half in a seamlinglt bad trade. 
[text](pyrrhic-my-account-2026-10-07.json)
- [done, tight default 1cb2ac9] Tight almost alwyas feels better than as is and no other even compares as they always use more mercs. Lets first check if we cna optimize tight further to get better trades, then lets move it as default; removing the table and other options on the selector; lets keep as is for now, but lets add a hover to preview the trade it offers (usually a bit less gold and less damage), showing only silver, gold and damage.
- [done 2026-10-10, Critical 04; 12 units open as B-13] [UI] order troops as they appear in the battle selection. and allow to switch to order by health from hte battle summary.
- [done 2026-10-10, Critical 01] when logged out and logged in don't import the local profile each time. If possible lets import only if we create an account, lot when logging in. Logging in should just silently overwrite the profile with the account profile. Logging out should just puts us back to a new profile.
- [done 2026-10-10, Critical 03] putback shoudld follow tight rules but keeping the troops/merc/monster same set. Goal: put back and keep away a troop or contrary should end up idempotent.
- [dropped 2026-10-10, B-11] We also have problems with higher troops depending on bonuses. adding ARC3 on my profile decreases rating of marches. See reference march below
- With the new positions, I sometimes get amazing trades (at least right now as I'm pretty flush in gold) using tight on the lowest merc positions. And the slider now uses too many mercs on the other becaus eI have some stock. just got Tight 22.4M
  +74.4%
  4.1M
  +3.9%
  6.2K
  +204.4%
  8

For a march using tight (22.4)
SW1 3024
ARC1 1827
SP1 1671
RD1 797
ARC2 1008
SP2 924
RD2 440
ARC3 564
SP3 516
RD3 246
BB 27
ED 27
SG 23
WE 59
SPX6 3
CHR6 10
LGN6 20
EMH6 20
ABT6 19

And with as is (12.8):
SW1 3024
ARC1 1827
SP1 1671
RD1 797
ARC2 1008
SP2 924
RD2 440
ARC3 564
SP3 516
RD3 246
ED 9
LGN6 13
ABT6 14
EMH6 13
WE 20
CHR6 6
BB 8
SG 7
SPX6 1

Reference march
SP1 1377
SW1 2655
RD1 605
RD2 336
ARC1 1372
RD3 188
ARC2 759
SP3 424
SP2 751
EMH6 30
BB 18
SG 17
ED 19
WE 40
28/09 22:43

See docs/backlog/README.md for these ideas refined into backlog items.
