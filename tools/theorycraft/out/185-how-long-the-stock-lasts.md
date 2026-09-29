Every stop of every benchmark army, read the way the March’s unit detail sheet will read it: for a hired stack with an owned count, **how many identical marches the stock sustains** — `lastsMarches(caps[id], count)` — set against **how many the plan plays** (`planRepeats(row)`). The promise is that the sheet never promises more than the plan plays. The corpus is `criteriaScenarios()` planned with the app’s own call, exactly as experiments 183 and 184 make it.

## The promise, on every stop of every army


**18 armies, 63 stops, 105 type-readings, 0 armies the plan refuses.** **33 readings are exactly the repeats the plan plays; 72 are above them — +1 at the narrowest, +13 median, +992 at the widest; none is below.**

- **Stops set aside for a `sequence`**: 11 of 63 — the `all-in` and its kind, whose marches all differ, so the stop has no *"marches like this one"* for the sheet to promise (`planRepeats` answers 1 there; `plan.ts:1566`).
- **Type-readings skipped for want of a cap**: 12 — a hired type the account has no owned count for (an unlimited mercenary, one never capped). The sheet has nothing to divide by, and the plan’s own `sustain` is `Infinity` for exactly those (`plan.ts:3204`), so they carry no reading rather than a false one.
- **Stops whose repeat fields no capped hired type at all**: 0 — nothing to read, counted rather than dropped.
- **The repeats actually played** run 1 to 4 and the campaigns 4 to 4 marches (the horizon is 4).

## How much room the stock has over the repeats — the histogram


Each cell counts the **type-readings** whose ceiling sits that many identical marches above what the plan plays. The leftmost column is the useful case: the sheet’s figure is exactly the campaign’s own limit, and the player is being told something the plan already acted on.

| ceiling − repeats | readings |
|---|---|
| 0 (exact) | 33 |
| +1 | 3 |
| +2 | 5 |
| +3 | 3 |
| +4 | 4 |
| +5 | 4 |
| +8 | 7 |
| +9 | 3 |
| +10 | 1 |
| +11 | 2 |
| +12 | 3 |
| +13 | 3 |
| +16 | 1 |
| +17 | 1 |
| +24 | 1 |
| +30 | 3 |
| +33 | 1 |
| +37 | 1 |
| +38 | 2 |
| +47 | 1 |
| +48 | 2 |
| +49 | 1 |
| +57 | 1 |
| +59 | 2 |
| +68 | 1 |
| +71 | 4 |
| +78 | 1 |
| +101 | 1 |
| +108 | 1 |
| +130 | 2 |
| +138 | 1 |
| +155 | 1 |
| +439 | 1 |
| +473 | 1 |
| +990 | 2 |
| +992 | 1 |


## Does the sheet tell the truth about the campaign, or only about the march?


The sheet’s figure is per stack; the campaign is repeats, a finale and sometimes a troops-only tail. Reading the **smallest** ceiling over the hired types a stop’s repeat fields, against the two counts that matter:

- **Exactly the repeats the plan plays**: 22 of 52 stops with a reading.
- **At least the whole campaign the plan plays** (repeats + finale + tail): 32 of 52 stops — of those, **exactly the campaign** on 3.

- **Median room over the whole campaign**: 1 marches; **worst over-carry**: +472; **tightest**: -3.

A reading far above the campaign is honest and uninformative: the stock would carry more identical marches than the horizon asks for, so the sheet’s figure is not what stopped the plan — silver or the horizon did. The rows where the two are equal are the ones where the block says something the plan already acted on.


## What the reading is, and what it is not


`held` is `request.caps[unit.id]` — the account’s **own** owned count — and never the per-march ration a re-size applies (`largestSustained`, `plan.ts:1554`), which `raise.ts:314-320` documents as the distinction to keep: an overhaul that reads the ration answers a question the owner did not ask. `count` is the stop’s own repeated march, `row.counts`, so the figure is a property of the march the sheet is drawn under.

The plan reads are budgeted searches (`CAMPAIGN.budgets.plan`), so the **stops** a run offers can move with load on a busy machine; the promise is asserted on the readings themselves and no timing is pinned here.

