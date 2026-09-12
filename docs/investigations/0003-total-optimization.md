# Investigation 0003 — what "Total Optimization" trades, and whether we should reproduce it

Story S-31, written 2026-09-12 from the captured runs `mp-10stacks` / `to-10stacks`
(`tests/fixtures/totalstack-2026-09-12-runs.json`) and from experiments against our own engine
(`sizeStacks` + `simulateBattle`). Applies to deferred item D-04 (story S-42).

## 1. What the captured run changes

Both runs share the same army (zero bonuses, leadership 3000 / authority 1200 / dominance 200, ten troop
types, four tier-3 monsters, four enemy squads) and the same troop counts, apart from a ±1 reshuffle inside
one HP tier (SP3 140/ARC3 141 becomes 141/140). **Every real difference is in the monster pool:**

| | WE | BB | ED | SG | dominance |
|---|---|---|---|---|---|
| M's Preservation | 11 | 5 | 4 | 4 | 123 / 200 |
| Total Optimization | 11 | **6** | **5** | 4 | **136** / 200 |

MP's rule is that no monster stack may reach the lowest troop stack (RD3, 70 × 960 = 67,200 HP). TO breaks it
twice: ED 5 = 67,500 HP (300 above the floor) and BB 6 = 70,200 HP (above *every* stack in the march).

Stacks are killed in total-HP-descending order, so that reorders the kill list. MP dies
SW1 → ARC1 → SP1 → RD1 → ARC2 → SP2 → ARC3 → RD2 → SP3 → RD3 → WE → SG → BB → ED; TO dies
**BB** → SW1 → … → RD2 → **ED** → SP3 → RD3 → WE → SG. Battle Boar moves from last to first, wiped by the
very first enemy attack; Emerald Dragon moves from last-but-one to tenth, ahead of the tier-3 specialists and
riders. Every troop stack gains one place (SP3 and RD3 two), hence one more hit each.

TotalStack's summary prices the trade: damage by troops 1,051,908 → 1,228,107 (+176,199), by monsters
1,101,936 → 996,962 (−104,974), minimum 2,118,629 → 2,157,167 (+1.8 %), average **2,153,844 → 2,225,069
(+3.3 %)**. The cost is paid in monsters: 13 more dominance, one more Boar and Dragon to bring back.
Retrain-all silver (1,294,800), dragon coins (1,080) and time (4d 11h) do not move — monsters train in chunks
of ten — but retrain gold goes 1,536 → 1,744 (+13.5 %) and damage per gold falls 1,402 → 1,276 (−9 %); damage
per silver improves 1.663 → 1.718.

## 2. Reproducing the trade with our engine

`sizeStacks` with `method: 'ms'` reproduces the MP run (monsters exactly WE 11 / BB 5 / ED 4 / SG 4, troops
within ±1). Forcing ED 5 and BB 6, then re-simulating:

| | minimum | average | maximum | leadership dmg | dominance dmg | retrain gold |
|---|---|---|---|---|---|---|
| MP | 1,355,672 | 1,384,005 | 1,383,152 | 705,237 | 678,768 | 1,536 |
| TO counts | 1,374,566 | 1,417,707 | 1,431,662 | 806,676 | 611,031 | 1,744 |
| delta | +1.4 % | **+2.4 %** | +3.5 % | +101,439 | −67,737 | +208 |

Our absolutes are ~36 % below TotalStack's because our summary counts the strength-against term once (the
journal and in-game formula) while TotalStack's counts it twice (`battle-model-observations.md` §2); the
direction, pool split and relative gain all match. Plain Elite Preservation on the same army (monsters
18/8/7/6, dominance 199) scores min 1,346,554 / avg 1,409,727 / gold 2,752: better average than MP, worse
minimum than both, dearer. TO alone beats MP on minimum *and* average.

**Does the simple rule find the same counts?** Greedy "+1 on the monster stack that most improves the average,
while dominance allows" starts exactly right — ED 4→5 (+12,742) then BB 5→6 (+20,960), TotalStack's answer —
and then **does not stop**: every further Boar adds +4,758 until the pool runs out (BB 16, dominance 196,
average 1,465,287, +5.9 %). The reason is structural: a stack at the top of the HP order is killed by the
first enemy attack, so it hits zero times enemy-first and once army-first. Each extra unit buys half a hit and
lifts only the maximum — from BB 6 on, the minimum is frozen at 1,374,566. Maximising the average alone
rewards dumping the whole dominance pool into one sacrificial stack: an artefact of the averaging, not advice.

One guard fixes it: **accept a step only when it improves the minimum as well as the average**. That
reproduces the captured run exactly — WE 11 / BB 6 / ED 5 / SG 4, dominance 136/200 — and halts on the third
step (minimum unchanged), in 12 `simulateBattle` calls.

An exhaustive sweep of every monster vector fitting dominance 200 shows TotalStack's output is *not* the
optimum of any objective we model: best average, minimum and (min+max)/2 are all WE 22 / BB 11 / ED 5 / SG 4 at
dominance 199 (avg 1,476,607); best damage/silver is WE 12 / BB 10 / ED 5 / SG 8. TO is an early stop of a
local search, and the min-guard stops in the same place.

Stability on other armies: the `mp-bear` army (MP leaves authority at 21/1200) gains a second Bear V — average
+6.5 %, minimum +6.1 %, gold 2,704 → 2,864 — then stops; with army +25/+25 bonuses only ED 4→5 is accepted;
raising dominance to 400 changes nothing, because the guard binds, not the pool. Each run costs 4–12
evaluations: milliseconds, no worker.

## 3. Proposal

Implement it as an **opt-in post-pass on M's Preservation**, not a separate stacking method: size the pools as
today, then greedily add one unit to the monster/mercenary stack that most improves the objective, accepting a
step only while the minimum damage also improves, stopping at housing, caps, or the first non-improving pass.
Roughly 80 lines in `src/engine` plus an option flag and a regression test pinned to `to-10stacks`; the UI must
mark each relaxed stack ("dies before your troops") and show the gold delta, since the whole point of MP is the
opposite promise. Half a day engine and tests, half a day UI.

Risks: the gain is modest (+2.4 % average, +1.4 % minimum); it rests entirely on the damage model, whose open
points are S-30's; the guard is fitted to one captured run; and it partly contradicts the reason a user picks
MP at all.

**Recommendation: pull D-04 back as a small story**, scoped as above — the min-guarded post-pass, not
TotalStack's "deep search with optimisation seeds". It is the cheapest change in the plan that dominates MP on
both damage metrics, it reproduces the reference output exactly, and it needs no change to the sizer. Do it
after S-30 settles the per-hit formula, behind a toggle that is off by default.

## 4. Open questions for an in-game check

1. Does an epic-monster fight always end with the whole march dead? If it can stop earlier, the kill order
   decides real losses and a relaxed Boar stack is a permanent cost, not just a reordering.
2. Does a stack at the top of the HP order really attack zero times when the enemy strikes first? That fact is
   the lever this post-pass pulls.
3. Both in-game reports show one mounted stack (Rider I) killed before its turn. If the friendly attack order
   is not exactly HP-descending, every hit count here shifts and the guard may stop elsewhere.
4. Is enemy targeting still pure HP-descending when a *monster* stack is the highest-HP one? Verified 10/10 in
   two reports, never with a monster on top.
5. Confirm the retrain-gold delta (+208 for one extra Boar and Dragon) on the in-game retrain screen, since
   damage-per-gold is the metric this trade worsens.
