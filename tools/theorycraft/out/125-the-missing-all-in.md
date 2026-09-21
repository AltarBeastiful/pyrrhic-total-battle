
## A. Is this his bar?


His browser on 2026-09-21 draws **Sweet spot · Steady max** and a slider whose `aria-valuemax` is 1. The reconstruction below has to produce the same two rows before anything is concluded from it.

| stop | worst opening a march | silver a march | chunks a march | campaign damage | campaign silver |
|---|---|---|---|---|---|
| sweet-spot | 5,504,384 | 2,344,400 | 2 | 21,805,812 | 9,402,800 |
| steady-max | 6,210,578 | 2,498,900 | 3 | 23,924,394 | 9,866,300 |

**2 stops**: sweet-spot · steady-max. The bar also reports **50** plans left out of the band.

## B. The three rows the bar has not got, one rule at a time


### More mercs — the burn axis has no room on it

`moreMercs` returns nothing when the two ends are fewer than **two** chunks apart. Measured: the sweet spot burns **2** chunks a march, the steady max **3**, the gap is **1**. The rule needs ≥ 2, so this row cannot exist on this army — there is no rung strictly between them to name.

The axis itself is `chunks(hunters)` over the authority pool: a stock of **64** hunters spans **7** values (1–10 units is 1 chunk, 11–20 is 2, and so on), and two of them are already taken by the two stops on screen.

### Silver saver — nothing left of the sweet spot reaches its rate

`leftOfSweet` wants a march that burns **strictly fewer** chunks, costs **no more** silver and returns **at least** the sweet spot’s damage a silver. The sweet spot here burns **2** chunks a march at **2,344,400** silver and **2.32** damage a silver over the campaign.

So a candidate must burn at most **1** chunk — that is at most 10 hunters — and still reach **2.32** damage a silver. The sweep below holds the sweet spot’s troops and monsters exactly as it fields them and moves only the hunter, which is the only thing a thriftier march can change here.

| hunters | chunks a march | worst opening | silver a march | damage a silver |
|---|---|---|---|---|
| 0 | 0 | 4,369,208 | 2,126,000 | 2.06 |
| 5 | 1 | 4,653,002 | 2,344,400 | 1.99 |
| 10 | 1 | 4,936,796 | 2,344,400 | 2.11 |
| 15 | 2 | 5,220,590 | 2,344,400 | 2.23 |
| 20 | 2 | 5,504,384 | 2,344,400 | 2.35 |
| 25 | 3 | 5,571,004 | 2,344,400 | 2.38 |
| 30 | 3 | 5,059,561 | 2,344,400 | 2.16 |
| 40 | 4 | 5,059,561 | 2,344,400 | 2.16 |
| 50 | 5 | 5,059,561 | 2,344,400 | 2.16 |
| 64 | 7 | 5,059,561 | 2,344,400 | 2.16 |

**0** of the thriftier hunter counts reach the sweet spot's rate. The silver a march is **flat** — a mercenary is brought back for gold and costs no silver to retrain, so the silver column is the troops and the monsters standing behind it — while the damage climbs with every hunter. On an account whose only spendable stock is a mercenary, **fielding fewer of them is always a worse rate**, so "cheaper and at least as efficient a silver" has nothing it can name. That is arithmetic, not a threshold, and it is the same finding investigation 0024 §3 made on his other army.

### All in — built, and then?

At a horizon of **1** the same army **does** carry it: its first march fields **181** hired units against the steady max's **127**.

The offer rule (`filledOf(allIn) > filledOf(top)`) is **181 > 127** — it **passes**.

| | the all-in’s first march | the steady max’s repeat |
|---|---|---|
| hired units | 181 | 127 |
| worst opening | 6,050,986 | 6,210,578 |
| silver a march | 3,180,400 | 2,498,900 |
| chunks a march | 7 | 3 |

Hunters: the all-in's first march fields **64** of the **64** in stock, the steady max **25**.

## C. The S-94 drop, evaluated on the bar he has


Whatever the offer rule says, a bar that carries an `all-in` loses it when **another stop has at least its campaign damage, no more silver and strictly fewer chunks burned**. On the horizon-1 bar above that comparison can be made directly.

| horizon-1 stop | campaign damage | campaign silver | chunks burned |
|---|---|---|---|
| sweet-spot | 5,293,278 | 2,344,400 | 2 |
| more-mercs | 5,698,948 | 2,352,800 | 3 |
| steady-max | 6,017,134 | 2,450,600 | 4 |
| all-in | 6,050,986 | 3,180,400 | 7 |

**At the app's horizon of 4** the all-in spends the stock down 64 · 57 · 51 · 45, burning **24** chunks in all.

| march | hunters | worst opening | silver | chunks |
|---|---|---|---|---|
| 1 | 64 | 6,050,986 | 3,180,400 | 7 |
| 2 | 57 | 5,918,549 | 3,180,400 | 6 |
| 3 | 51 | 5,805,032 | 3,180,400 | 6 |
| 4 | 45 | 5,691,514 | 3,180,400 | 5 |

| stop | campaign damage | campaign silver | chunks burned |
|---|---|---|---|
| sweet-spot | 21,805,812 | 9,402,800 | 9 |
| steady-max | 23,924,394 | 9,866,300 | 12 |
| **all-in** (rebuilt) | 23,466,081 | 12,721,600 | **24** |

| beating stop | damage ≥ | silver ≤ | chunks < | S-94 fires |
|---|---|---|---|---|
| sweet-spot | no (21,805,812) | yes (9,402,800) | yes (9) | no |
| steady-max | yes (23,924,394) | yes (9,866,300) | yes (12) | **yes** |

**steady-max fires all three arms**, so S-94 removes the row: it is on the bar, and then it is taken off it.

**No stop beats it outright at horizon 1**, which is why it survives there.

## D. Is it this army, or is it a limit? — the two knobs he actually moves


The dominance pool and the hunter stock, swept around his own figures. Each cell is the bar the engine draws at the app’s own horizon of 4.

| dominance | stock | stops | sweet ⟶ steady chunks | all in? | why not |
|---|---|---|---|---|---|
| 0 | 27 | silver-saver · sweet-spot · steady-max · all-in | 1 | **yes** | — |
| 0 | 40 | silver-saver · sweet-spot · more-mercs · all-in · steady-max | 2 | **yes** | — |
| 0 | 64 | silver-saver · sweet-spot · steady-max | 1 | no | not even at horizon 1 |
| 0 | 100 | sweet-spot · more-mercs · steady-max · all-in | 5 | **yes** | — |
| 0 | 142 | sweet-spot · more-mercs · steady-max · all-in | 8 | **yes** | — |
| 200 | 27 | silver-saver · sweet-spot · all-in | — | **yes** | — |
| 200 | 40 | silver-saver · sweet-spot · more-mercs · steady-max · all-in | 2 | **yes** | — |
| 200 | 64 | silver-saver · sweet-spot · more-mercs · steady-max | 2 | no | not even at horizon 1 |
| 200 | 100 | silver-saver · sweet-spot · more-mercs · steady-max | 2 | no | not even at horizon 1 |
| 200 | 142 | silver-saver · sweet-spot · steady-max · all-in | 9 | **yes** | — |
| 400 | 27 | sweet-spot · all-in | — | **yes** | — |
| 400 | 40 | sweet-spot · steady-max · all-in | 1 | **yes** | — |
| 400 | 64 | sweet-spot · steady-max | 1 | no | not even at horizon 1 |
| 400 | 100 | sweet-spot · more-mercs · steady-max | 2 | no | not even at horizon 1 |
| 400 | 142 | sweet-spot · steady-max · all-in | 1 | **yes** | — |
| 600 | 27 | sweet-spot · steady-max · all-in | 1 | **yes** | — |
| 600 | 40 | sweet-spot · steady-max · all-in | 1 | **yes** | — |
| 600 | 64 | sweet-spot · steady-max | 1 | no | offered (181 > 127) then dropped |
| 600 | 100 | sweet-spot · more-mercs · steady-max · all-in | 2 | **yes** | — |
| 600 | 142 | sweet-spot · steady-max · all-in | 8 | **yes** | — |
| 800 | 27 | sweet-spot · steady-max | 1 | no | offered (181 > 142) then dropped |
| 800 | 40 | sweet-spot · steady-max | 1 | no | offered (194 > 166) then dropped |
| 800 | 64 | sweet-spot · steady-max · all-in | 1 | **yes** | — |
| 800 | 100 | sweet-spot · more-mercs · steady-max | 4 | no | offered (254 > 208) then dropped |
| 800 | 142 | sweet-spot · steady-max | 9 | no | fields no more hired than the steady max (296 vs 302) |
| 1,000 | 27 | silver-saver · sweet-spot | — | no | not offered or dropped |
| 1,000 | 40 | sweet-spot · more-mercs · steady-max · all-in | 2 | **yes** | — |
| 1,000 | 64 | silver-saver · sweet-spot · steady-max | 1 | no | offered (256 > 214) then dropped |
| 1,000 | 100 | sweet-spot · more-mercs · steady-max · all-in | 3 | **yes** | — |
| 1,000 | 142 | sweet-spot · more-mercs · steady-max · all-in | 8 | **yes** | — |
| 1,200 | 27 | sweet-spot · all-in · steady-max | 1 | **yes** | — |
| 1,200 | 40 | silver-saver · sweet-spot · steady-max · all-in | 1 | **yes** | — |
| 1,200 | 64 | silver-saver · sweet-spot · more-mercs · steady-max · all-in | 2 | **yes** | — |
| 1,200 | 100 | sweet-spot · more-mercs · steady-max · all-in | 4 | **yes** | — |
| 1,200 | 142 | sweet-spot · more-mercs · steady-max · all-in | 8 | **yes** | — |

**23 of 35** armies swept carry an `all-in`. Nothing in the code caps the number of stops — `PlanPick` has five and `offer` pushes whichever exist — so a short bar is always a rule declining a row, never a ceiling on how many rows may be drawn.
