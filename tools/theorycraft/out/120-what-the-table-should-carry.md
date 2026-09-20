
## One army a row: which stop each fact names


| army | stops | Worst opening | Silver | Queue | Hired lost | Per silver | Per gold | Per hour of queue | Per dragon coin | Per hired | different rows |
|---|---|---|---|---|---|---|---|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership) | 1 | sweet-spot | sweet-spot | sweet-spot | sweet-spot | sweet-spot | — | sweet-spot | — | sweet-spot * | **1** |
| first-run army, Bear V ×2 (20 000 leadership) | 1 | sweet-spot | sweet-spot | sweet-spot | sweet-spot | sweet-spot | sweet-spot | sweet-spot | — | sweet-spot * | **1** |
| first-run army, Bear V ×3 (20 000 leadership) | 2 | all-in | sweet-spot | sweet-spot | sweet-spot | all-in | all-in | all-in | — | all-in * | **2** |
| first-run army, Bear V ×10 (20 000 leadership) | 2 | sweet-spot | sweet-spot | sweet-spot | sweet-spot | sweet-spot | sweet-spot | sweet-spot | — | all-in * | **1** |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | 4 | all-in | sweet-spot | sweet-spot | sweet-spot | sweet-spot | sweet-spot | sweet-spot | — | sweet-spot * | **2** |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 3 | steady-max | silver-saver | silver-saver | silver-saver | silver-saver | sweet-spot | silver-saver | — | sweet-spot * | **3** |
| 2026-09-17 export, its setup (7 000 leadership) | 5 | steady-max | silver-saver | silver-saver | silver-saver | more-mercs | sweet-spot | silver-saver | — | sweet-spot * | **4** |
| 2026-09-17 export, 12 000 leadership | 4 | steady-max | silver-saver | silver-saver | silver-saver | silver-saver | sweet-spot | silver-saver | — | sweet-spot * | **3** |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 4 | all-in | silver-saver | silver-saver | silver-saver | silver-saver | sweet-spot | silver-saver | — | silver-saver * | **3** |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 5 | all-in | silver-saver | silver-saver | silver-saver | all-in | sweet-spot | all-in | — | sweet-spot * | **3** |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | 4 | all-in | sweet-spot | sweet-spot | sweet-spot | all-in | sweet-spot | sweet-spot | — | sweet-spot * | **2** |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | 4 | steady-max | silver-saver | silver-saver | silver-saver | steady-max | sweet-spot | steady-max | — | sweet-spot * | **3** |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | 4 | steady-max | silver-saver | silver-saver | silver-saver | silver-saver | silver-saver | silver-saver | — | sweet-spot * | **2** |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | 5 | all-in | silver-saver | silver-saver | silver-saver | all-in | silver-saver | silver-saver | — | silver-saver * | **2** |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | 4 | steady-max | silver-saver | silver-saver | silver-saver | silver-saver | more-mercs | silver-saver | more-mercs | sweet-spot * | **3** |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | 3 | steady-max | sweet-spot | sweet-spot | sweet-spot | sweet-spot | more-mercs | sweet-spot | steady-max | sweet-spot * | **3** |

## Does the engine’s own note agree with the table’s mark?


The row already wears *“best a silver”* under its name (`PlanRow.bestFor`, the engine’s reading). If the table now marks the best cell of the Per silver column from `repeat`, the two must name the same row — or one screen says one thing two ways (design rule 5).

| army | the engine’s `bestFor.silver` | the column’s best cell | agree |
|---|---|---|---|
| first-run army, Bear V ×1 (20 000 leadership) | sweet-spot | sweet-spot | yes |
| first-run army, Bear V ×2 (20 000 leadership) | sweet-spot | sweet-spot | yes |
| first-run army, Bear V ×3 (20 000 leadership) | all-in | all-in | yes |
| first-run army, Bear V ×10 (20 000 leadership) | sweet-spot | sweet-spot | yes |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | sweet-spot | sweet-spot | yes |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | silver-saver | silver-saver | yes |
| 2026-09-17 export, its setup (7 000 leadership) | more-mercs | more-mercs | yes |
| 2026-09-17 export, 12 000 leadership | silver-saver | silver-saver | yes |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | silver-saver | silver-saver | yes |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | all-in | all-in | yes |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | all-in | all-in | yes |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | steady-max | steady-max | yes |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | silver-saver | silver-saver | yes |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | all-in | all-in | yes |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | silver-saver | silver-saver | yes |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | sweet-spot | sweet-spot | yes |

**16 of 16 agree.** So the mark and the note are one fact: the note names it in words under the row, the mark shows which cell it is, and the row’s accessible name may say it only once.

## The two questions, answered


**Is a best mark worth its ink?** Over **16 armies**, the marks land on **2.38 different stops on average**, and on **3** of them a single stop wins everything. The marks disagree on the rest, which is the table doing its job.

**Which rate columns name a stop nothing else does?**

| fact | names a stop on | is the only fact naming it on |
|---|---|---|
| Worst opening | 16 of 16 | **7** |
| Silver | 16 of 16 | **0** |
| Queue | 16 of 16 | **0** |
| Hired lost | 16 of 16 | **0** |
| Per silver | 16 of 16 | **1** |
| Per gold | 15 of 16 | **7** |
| Per hour of queue | 16 of 16 | **0** |
| Per dragon coin | 2 of 16 | **0** |

*`*` marks the fact nothing may call best: damage a hired unit (0019 §2.3).*
