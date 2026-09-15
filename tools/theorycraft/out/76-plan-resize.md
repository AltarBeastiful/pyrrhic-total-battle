
## The plan, and the march Generate puts on screen

plan: **10 marches**
its march: rider-2 625 · archer-2 1,223 · rider-3 337 · arbalester-6 40 · chariot-6 20 · epic-monster-hunter-6 35 · legionary-6 40
the types the edit re-sizes (`includedUnitIds`): rider-2 · archer-2 · rider-3 · arbalester-6 · chariot-6 · epic-monster-hunter-6 · legionary-6

the caps it re-sizes them under: arbalester-6 40 · chariot-6 20 · epic-monster-hunter-6 35 · legionary-6 40 · rider-2 625 · archer-2 1,223 · rider-3 337

## Leaving each troop type **of the march** out, the way the pill does

| left out | the march after the re-size | same as before? |
|---|---|---|
| archer-2 | rider-2 625 · rider-3 337 · arbalester-6 40 · legionary-6 40 · chariot-6 20 · epic-monster-hunter-6 35 | changed |
| rider-2 | archer-2 1,223 · rider-3 337 · arbalester-6 40 · legionary-6 40 · chariot-6 20 · epic-monster-hunter-6 35 | changed |
| rider-3 | rider-2 625 · archer-2 1,223 · arbalester-6 40 · legionary-6 40 · chariot-6 20 · epic-monster-hunter-6 35 | changed |

## Putting back each type the plan left out

| put back | the march after the re-size | same as before? |
|---|---|---|
| archer-1 | archer-1 1,796 · archer-2 995 · rider-2 497 · rider-3 279 · arbalester-6 40 · legionary-6 40 · chariot-6 20 · epic-monster-hunter-6 35 | changed |
| rider-1 | rider-1 898 · archer-2 995 · rider-2 497 · rider-3 279 · arbalester-6 40 · legionary-6 40 · chariot-6 20 · epic-monster-hunter-6 35 | changed |
| spearman-1 | spearman-1 1,796 · archer-2 995 · rider-2 497 · rider-3 279 · arbalester-6 40 · legionary-6 40 · chariot-6 20 · epic-monster-hunter-6 35 | changed |
| spearman-2 | archer-2 1,223 · spearman-2 1,224 · rider-2 611 · rider-3 337 · arbalester-6 40 · legionary-6 40 · chariot-6 20 · epic-monster-hunter-6 35 | changed |
| swordsman-1 | arbalester-6 40 · legionary-6 40 · chariot-6 20 · epic-monster-hunter-6 35 · swordsman-1 2,797 · archer-2 604 · rider-2 302 · rider-3 169 | changed |

## The same leave-outs, with the plan's counts **not** used as caps

The one filter removed: the caps are the stock and the account's own ceilings, so a surviving troop may take up the leadership a left-out one frees.
| left out | the march after the re-size |
|---|---|
| archer-2 | rider-2 1,391 · rider-3 780 · epic-monster-hunter-6 92 · arbalester-6 76 · chariot-6 37 · legionary-6 72 |
| rider-2 | archer-2 2,781 · rider-3 781 · epic-monster-hunter-6 92 · arbalester-6 76 · chariot-6 37 · legionary-6 72 |
| rider-3 | archer-2 2,171 · rider-2 1,086 · epic-monster-hunter-6 92 · arbalester-6 76 · chariot-6 37 · legionary-6 72 |

## The fix: only the **hired** spend capped at the plan's — what the March does now

The plan rations the hired stock; the troops are rationed by leadership, which the sizer already respects. Capping the troop types at the plan's own counts is what leaves a left-out stack's leadership unused — so only the hired counts are capped, and the survivors take the leadership up. **This is what `generate.ts` stores now**: 2026-09-15, on the owner's report that a leave-out had stopped changing anything.
| left out | the march after the re-size |
|---|---|
its caps: arbalester-6 40 · chariot-6 20 · epic-monster-hunter-6 35 · legionary-6 40
| archer-2 | rider-2 1,391 · rider-3 780 · arbalester-6 40 · legionary-6 40 · chariot-6 20 · epic-monster-hunter-6 35 |
| rider-2 | archer-2 2,781 · rider-3 781 · arbalester-6 40 · legionary-6 40 · chariot-6 20 · epic-monster-hunter-6 35 |
| rider-3 | archer-2 2,171 · rider-2 1,086 · arbalester-6 40 · legionary-6 40 · chariot-6 20 · epic-monster-hunter-6 35 |

Putting back, under the same caps:
| put back | the march after the re-size |
|---|---|
| archer-1 | archer-1 1,796 · archer-2 995 · rider-2 497 · rider-3 279 · arbalester-6 40 · legionary-6 40 · chariot-6 20 · epic-monster-hunter-6 35 |
| rider-1 | rider-1 898 · archer-2 995 · rider-2 497 · rider-3 279 · arbalester-6 40 · legionary-6 40 · chariot-6 20 · epic-monster-hunter-6 35 |
| spearman-1 | spearman-1 1,796 · archer-2 995 · rider-2 497 · rider-3 279 · arbalester-6 40 · legionary-6 40 · chariot-6 20 · epic-monster-hunter-6 35 |
| spearman-2 | archer-2 1,221 · spearman-2 1,220 · rider-2 609 · rider-3 342 · arbalester-6 40 · legionary-6 40 · chariot-6 20 · epic-monster-hunter-6 35 |
| swordsman-1 | arbalester-6 40 · legionary-6 40 · chariot-6 20 · epic-monster-hunter-6 35 · swordsman-1 2,797 · archer-2 604 · rider-2 302 · rider-3 169 |

For reference, the account's own ceilings: arbalester-6 76 · chariot-6 37 · epic-monster-hunter-6 92 · legionary-6 72
