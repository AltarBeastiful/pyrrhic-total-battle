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
- Long term: Offer advices on what could improve greatly the plan, ex: "up the dominance..." or "add a monster..."
  - Could help the user tweak the marches even more or guide his next best moves in terms of research or training
- We should check again, on the cases with aydea, varying some parameters doesn't seem to produce linear results:
  - upping the leadership
  - upping army modernization strength (when monsters added), needs to be checked again if no dominance is selected
- Long term: Offer a quick way to use less monsters, we already have using less mercs in the plan table and thats mainly from my point of gaming. maybe user feedback could help there
- Long term: offer account with googlelogin, already planned and partly deployed (backend at lezast I think)
- UI: Help to know which hero is at what level. For now we have to click to see level and stars. Could at least be on hover. Would be best visually but might be too much. Perhaps the level could be in hte badge and entered hero woudl have a small icon with the star number. It would double as an indicator of any hero with the level entered. To design in an artifact first as we don't want to crowd the UI.
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
- We also have problems with higher troops depending on bonuses. adding ARC3 on my profile decreases rating of marches. See reference march below
- coulb be a safe push numbers of mercs or monsters to fill the stack
- Fill vip table with game data for each level
- Fix hall of fame form to match the actual game bonuses

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
