# 162 — where TotalStack still wins

Every benchmark army, the plan as shipped (`CAMPAIGN.planFixes` with `retype: rated`, `CAMPAIGN.putBack`), four-march campaigns, worst opening. A TotalStack row (priced as the benchmark prices it: `asCaptured`, the captured march replayed while its stock lasts) is **kept** when every stop deals less damage than it **and** rates `rate(row, stop, markerRates) ≤ 0` (silver 5, gold 5, hired 5, coins 8, queue 40). Hired stacks are starred in the marches.

## A. The rows, army by army

| army | stops | TS rows | dominated at matched spend | no stop fits | beaten on damage or rating | **kept** |
|---|---:|---:|---:|---:|---:|---:|
| first-run army, Bear V ×1 (20 000 leadership | 1 | 3 | 3 | 0 | 3 | **0** |
| first-run army, Bear V ×2 (20 000 leadership | 1 | 3 | 3 | 0 | 3 | **0** |
| first-run army, Bear V ×3 (20 000 leadership | 2 | 9 | 8 | 0 | 9 | **0** |
| first-run army, Bear V ×10 (20 000 leadershi | 2 | 9 | 4 | 0 | 9 | **0** |
| first-run army, Epic Monster Hunter VI ×83 ( | 4 | 9 | 7 | 0 | 9 | **0** |
| first-run army, monster tiers 3–5 at 900 dom | 5 | 3 | 0 | 3 | 3 | **0** |
| the 4 000-leadership case of 2026-09-15 (Tot | 3 | 10 | 10 | 0 | 10 | **0** |
| 2026-09-17 export, its setup (7 000 leadersh | 5 | 9 | 6 | 3 | 9 | **0** |
| 2026-09-17 export, 12 000 leadership | 4 | 9 | 3 | 2 | 9 | **0** |
| live account of 2026-09-18 (one hired type,  | 4 | 9 | 9 | 0 | 9 | **0** |
| live account, evening (hunters 83, legionari | 5 | 9 | 6 | 0 | 9 | **0** |
| Aydae alone, 4 975 (one captain, four hired  | 4 | 9 | 0 | 0 | 9 | **0** |
| the owner’s live camp of 2026-09-18 (arbales | 5 | 3 | 0 | 0 | 0 | **3** |
| his camp of 2026-09-19, the localStorage dum | 5 | 3 | 2 | 1 | 3 | **0** |
| his camp of 2026-09-19, as his message reads | 5 | 3 | 2 | 1 | 3 | **0** |
| his TotalStack profile of 2026-09-19 (5 225  | 3 | 3 | 2 | 1 | 3 | **0** |
| his usual setup of 2026-09-19 (Aydae alone,  | 3 | 9 | 5 | 2 | 9 | **0** |
| **total** | | **112** | **70** | **13** | | **3** |

## B. Every kept row

### B1. the owner’s live camp of 2026-09-18 (arbales — TotalStack · M’s Preservation

- **TS march** (first): archer-1 1,001, spearman-1 1,000, rider-1 500, archer-2 555, spearman-2 555, rider-2 277, rider-3 155, bear-5 77*, legionary-6 277*, arbalester-6 286*
- **TS campaign**: dmg 35,412,012 · silver 7,797,200 · hired 260 · gold 60,352 · coins 0 · queue 527 h · dmg/silver 4.542 · dmg/hired 104,017 · dmg/gold 587 · dmg/coin —
- **closest stop MX** (first march): rider-3 2,441, arbalester-6 403*, bear-5 35*, legionary-6 215*
- **its campaign**: dmg 31,541,795 · silver 12,196,000 · hired 208 · gold 28,736 · coins 0 · queue 1,839 h · dmg/silver 2.586 · dmg/hired 146,044 · dmg/gold 1,098 · dmg/coin —
- **rating of our stop against the row**: -13.95 (damage -10.9 %)
- **TS wins on**: dmg, silver, queue, dmg/silver · **we win on**: hired, gold, dmg/hired, dmg/gold
- **shape** TS: troops spearman-1/spearman-2/rider-1/rider-2/rider-3/archer-1/archer-2 HP 302,000/301,365/294,000/293,066/291,710/240,240/239,760 · hired 640 HP 7,267,260/3,173,589/2,608,320 · leadership 4,975 · shelter margin 0.03
- **shape** ours: troops rider-3 HP 4,593,962 · hired 653 HP 3,675,360/3,303,300/2,463,255 · leadership 4,882 · shelter margin 1.25
- **rules on TS's march**: sheltered **no** · held hired types left out (S-58 B) none · over the 4-march sustain none · campaign clamped by stock no
- **L0 reading** (engine `planMarch` / benchmark `price` − 1): {"damage":0,"silver":0,"gold":0,"seconds":0} %
- **L1 shelter**: {"damage":-0.709,"rating":-33.421,"beatsBest":false,"hiredCut":236,"stillKept":false}
- **L2 re-type**: {"rating":0.018,"damage":0,"march":"spearman-1 1,000, spearman-2 555, rider-3 157, rider-2 277, rider-1 497, archer-1 1,001, archer-2 555, bear-5 77*, legionary-6 277*, arbalester-6 286*"}
- **L3 re-size on its types**: {"shape":"stop","rating":-33.421,"damage":-0.709,"march":"spearman-1 1,000, archer-1 1,001, spearman-2 555, rider-1 500, archer-2 555, rider-2 277, rider-3 155, arbalester-6 26*, bear-5 2*, legionary-6 20*"}
- **L5 our stop re-typed, no keepReadings**: {"rating":-13.9508,"damage":-0.1093,"againstOwnStop":0,"queue":0,"silver":0,"beats":false}
- **L6 unsheltered probes**: {"rowHiredOnOurTroops":{"rating":-11.168,"damage":0.122,"margin":0.632},"ourHiredOnRowTroops":{"rating":-24.822,"damage":-0.393},"eliteSizerUnsheltered":{"rating":-4.71,"damage":-0.048,"margin":0.038,"march":"archer-1 1,158, spearman-1 918, rider-1 470, archer-2 639, spearman-2 508, rider-2 260, rider-3 146, bear-5 77*, legionary-6 277*, arbalester-6 286*"}}
- **L4 frontier**: {"size":1032,"best":{"rating":-13.951,"inBand":true,"undominated":false,"stop":"steady-max","troops":1,"march":"rider-3 2,441, arbalester-6 403*, bear-5 35*, legionary-6 215*","bill":"dmg 31,541,795 · silver 12,196,000 · hired 208 · gold 28,736 · coins 0 · queue 1,839 h · dmg/silver 2.586 · dmg/hired 146,044 · dmg/gold 1,098 · dmg/coin —"},"moreDamage":0,"betterAny":0,"betterInBand":0,"betterUndominated":0,"betterUndomInBand":0}

### B2. the owner’s live camp of 2026-09-18 (arbales — TotalStack · Total Optimization

- **TS march** (first): archer-1 1,002, spearman-1 1,001, rider-1 501, archer-2 553, spearman-2 553, rider-2 277, rider-3 155, bear-5 61*, legionary-6 445*, arbalester-6 454* · last march: archer-1 1,002, spearman-1 1,001, rider-1 501, archer-2 553, spearman-2 553, rider-2 277, rider-3 155, bear-5 61*, legionary-6 445*, arbalester-6 355*
- **TS campaign**: dmg 49,229,801 · silver 7,794,000 · hired 374 · gold 59,176 · coins 0 · queue 527 h · dmg/silver 6.316 · dmg/hired 109,269 · dmg/gold 832 · dmg/coin —
- **closest stop MX** (first march): rider-3 2,441, arbalester-6 403*, bear-5 35*, legionary-6 215*
- **its campaign**: dmg 31,541,795 · silver 12,196,000 · hired 208 · gold 28,736 · coins 0 · queue 1,839 h · dmg/silver 2.586 · dmg/hired 146,044 · dmg/gold 1,098 · dmg/coin —
- **rating of our stop against the row**: -34.29 (damage -35.9 %)
- **TS wins on**: dmg, silver, queue, dmg/silver · **we win on**: hired, gold, dmg/hired, dmg/gold
- **shape** TS: troops spearman-1/spearman-2/rider-1/rider-2/rider-3/archer-1/archer-2 HP 302,302/300,279/294,588/293,066/291,710/240,480/238,896 · hired 960 HP 5,757,180/5,098,365/4,140,480 · leadership 4,975 · shelter margin 0.04
- **shape** ours: troops rider-3 HP 4,593,962 · hired 653 HP 3,675,360/3,303,300/2,463,255 · leadership 4,882 · shelter margin 1.25
- **rules on TS's march**: sheltered **no** · held hired types left out (S-58 B) none · over the 4-march sustain arbalester-6 454>371 · campaign clamped by stock **yes**
- **L0 reading** (engine `planMarch` / benchmark `price` − 1): {"damage":0,"silver":0,"gold":0,"seconds":0} %
- **L1 shelter**: {"damage":-0.791,"rating":-41.041,"beatsBest":false,"hiredCut":350,"stillKept":false}
- **L2 re-type**: {"rating":0.009,"damage":0,"march":"spearman-1 1,001, spearman-2 553, rider-3 157, rider-2 277, rider-1 497, archer-1 1,002, archer-2 553, bear-5 61*, legionary-6 445*, arbalester-6 454*"}
- **L3 re-size on its types**: {"shape":"stop","rating":-41.041,"damage":-0.791,"march":"spearman-1 1,001, archer-1 1,002, spearman-2 553, rider-1 501, archer-2 553, rider-2 277, rider-3 155, arbalester-6 26*, bear-5 2*, legionary-6 20*"}
- **L5 our stop re-typed, no keepReadings**: {"rating":-34.2884,"damage":-0.3593,"againstOwnStop":0,"queue":0,"silver":0,"beats":false}
- **L6 unsheltered probes**: {"rowHiredOnOurTroops":{"rating":-14.611,"damage":0.088,"margin":0.798},"ourHiredOnRowTroops":{"rating":-37.18,"damage":-0.563},"eliteSizerUnsheltered":{"rating":-3.362,"damage":-0.035,"margin":0.048,"march":"archer-1 1,158, spearman-1 918, rider-1 470, archer-2 639, spearman-2 508, rider-2 260, rider-3 146, bear-5 61*, legionary-6 445*, arbalester-6 454*"}}
- **L4 frontier**: {"size":1032,"best":{"rating":-34.288,"inBand":true,"undominated":false,"stop":"steady-max","troops":1,"march":"rider-3 2,441, arbalester-6 403*, bear-5 35*, legionary-6 215*","bill":"dmg 31,541,795 · silver 12,196,000 · hired 208 · gold 28,736 · coins 0 · queue 1,839 h · dmg/silver 2.586 · dmg/hired 146,044 · dmg/gold 1,098 · dmg/coin —"},"moreDamage":0,"betterAny":0,"betterInBand":0,"betterUndominated":0,"betterUndomInBand":0}

### B3. the owner’s live camp of 2026-09-18 (arbales — TotalStack · Elite Preservation

- **TS march** (first): archer-1 1,002, spearman-1 1,001, rider-1 501, archer-2 553, spearman-2 553, rider-2 277, rider-3 155, bear-5 61*, legionary-6 445*, arbalester-6 454* · last march: archer-1 1,002, spearman-1 1,001, rider-1 501, archer-2 553, spearman-2 553, rider-2 277, rider-3 155, bear-5 61*, legionary-6 445*, arbalester-6 355*
- **TS campaign**: dmg 49,229,801 · silver 7,794,000 · hired 374 · gold 59,176 · coins 0 · queue 527 h · dmg/silver 6.316 · dmg/hired 109,269 · dmg/gold 832 · dmg/coin —
- **closest stop MX** (first march): rider-3 2,441, arbalester-6 403*, bear-5 35*, legionary-6 215*
- **its campaign**: dmg 31,541,795 · silver 12,196,000 · hired 208 · gold 28,736 · coins 0 · queue 1,839 h · dmg/silver 2.586 · dmg/hired 146,044 · dmg/gold 1,098 · dmg/coin —
- **rating of our stop against the row**: -34.29 (damage -35.9 %)
- **TS wins on**: dmg, silver, queue, dmg/silver · **we win on**: hired, gold, dmg/hired, dmg/gold
- **shape** TS: troops spearman-1/spearman-2/rider-1/rider-2/rider-3/archer-1/archer-2 HP 302,302/300,279/294,588/293,066/291,710/240,480/238,896 · hired 960 HP 5,757,180/5,098,365/4,140,480 · leadership 4,975 · shelter margin 0.04
- **shape** ours: troops rider-3 HP 4,593,962 · hired 653 HP 3,675,360/3,303,300/2,463,255 · leadership 4,882 · shelter margin 1.25
- **rules on TS's march**: sheltered **no** · held hired types left out (S-58 B) none · over the 4-march sustain arbalester-6 454>371 · campaign clamped by stock **yes**
- **L0 reading** (engine `planMarch` / benchmark `price` − 1): {"damage":0,"silver":0,"gold":0,"seconds":0} %
- **L1 shelter**: {"damage":-0.791,"rating":-41.041,"beatsBest":false,"hiredCut":350,"stillKept":false}
- **L2 re-type**: {"rating":0.009,"damage":0,"march":"spearman-1 1,001, spearman-2 553, rider-3 157, rider-2 277, rider-1 497, archer-1 1,002, archer-2 553, bear-5 61*, legionary-6 445*, arbalester-6 454*"}
- **L3 re-size on its types**: {"shape":"stop","rating":-41.041,"damage":-0.791,"march":"spearman-1 1,001, archer-1 1,002, spearman-2 553, rider-1 501, archer-2 553, rider-2 277, rider-3 155, arbalester-6 26*, bear-5 2*, legionary-6 20*"}
- **L5 our stop re-typed, no keepReadings**: {"rating":-34.2884,"damage":-0.3593,"againstOwnStop":0,"queue":0,"silver":0,"beats":false}
- **L6 unsheltered probes**: {"rowHiredOnOurTroops":{"rating":-14.611,"damage":0.088,"margin":0.798},"ourHiredOnRowTroops":{"rating":-37.18,"damage":-0.563},"eliteSizerUnsheltered":{"rating":-3.362,"damage":-0.035,"margin":0.048,"march":"archer-1 1,158, spearman-1 918, rider-1 470, archer-2 639, spearman-2 508, rider-2 260, rider-3 146, bear-5 61*, legionary-6 445*, arbalester-6 454*"}}
- **L4 frontier**: {"size":1032,"best":{"rating":-34.288,"inBand":true,"undominated":false,"stop":"steady-max","troops":1,"march":"rider-3 2,441, arbalester-6 403*, bear-5 35*, legionary-6 215*","bill":"dmg 31,541,795 · silver 12,196,000 · hired 208 · gold 28,736 · coins 0 · queue 1,839 h · dmg/silver 2.586 · dmg/hired 146,044 · dmg/gold 1,098 · dmg/coin —"},"moreDamage":0,"betterAny":0,"betterInBand":0,"betterUndominated":0,"betterUndomInBand":0}


## C. The causes, ranked

| cause | rows | rating gap summed | armies |
|---|---:|---:|---|
| the shelter rule refuses it (its hired stand over its troops; sheltered, it falls below our stop) | 3 | 82.53 | the owner’s live camp of 2026-09-18 (arbales |

