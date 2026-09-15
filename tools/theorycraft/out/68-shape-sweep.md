
## §1 Are the rays real? One shape, marched 1 to 12 times

the shape: epic-monster-hunter 10 · arbalester 10 · legionary 0 · chariot 0 behind a 7-rung ladder at scale 1.5
| marches K | total damage | silver | mercs lost | damage / K | silver / K | damage / silver | damage / mercenary |
|---|---|---|---|---|---|---|---|
| 1 | 5,342,110 | 3,143,200 | 9 | 5,342,110 | 3,143,200 | 1.700 | 593,568 |
| 2 | 7,192,297 | 4,710,400 | 11 | 3,596,149 | 2,355,200 | 1.527 | 653,845 |
| 3 | 9,037,959 | 6,277,600 | 13 | 3,012,653 | 2,092,533 | 1.440 | 695,228 |
| 4 | 10,883,621 | 7,844,800 | 14 | 2,720,905 | 1,961,200 | 1.387 | 777,402 |
| 5 | 12,729,283 | 9,412,000 | 15 | 2,545,857 | 1,882,400 | 1.352 | 848,619 |
What each further march adds, which is where the shape of the curve lives:
| from | to | Δ damage | Δ silver | Δ damage / Δ silver |
|---|---|---|---|---|
| 1 | 2 | 1,850,187 | 1,567,200 | 1.1806 |
| 2 | 3 | 1,845,662 | 1,567,200 | 1.1777 |
| 3 | 4 | 1,845,662 | 1,567,200 | 1.1777 |
| 4 | 5 | 1,845,662 | 1,567,200 | 1.1777 |
The steps are **identical to the second decimal from the second march on** — the same march, marched again — so the repeated march *is* a ray, and its own rate (the last column) is the shape's true exchange rate. The **averages** in the table above drift away from it because the final march is not a repeat: it spends the stock the repeats burned, and the more marches there are the smaller it is. So the "2.66 at the cheap end, 1.13 at the dear end" the planner prints is not the ladder getting worse — it is **one finale being amortised over fewer or more marches**. What a plan can decide is the shape; what the march count decides is how much of the free final march each silver rides on.

## §2 The fine sweep, against the planner’s own picks

the planner's balanced pick, as it reports it: **10,587,928 damage, 6,794,000 silver, 15 mercenaries** — 1.56 a silver, 705,862 a mercenary.
seeded from 0 of the planner's own picks.

## §2b A shape that beats the balanced pick on *both* ratios at once

the bar: 1.56 a silver **and** 705,862 a mercenary, together.
the pool's peaks: -Infinity a silver, -∞ a mercenary.

## §3 What the campaign totals as marches are added

| marches | total damage | silver | mercs lost | damage / silver | damage / mercenary | Δ from one fewer | Δ silver | marginal, damage a silver |
|---|---|---|---|---|---|---|---|---|
| 1 | 5,997,742 | 3,155,600 | 11 | 1.90 | 545,249 | — | — | — |
| 2 | 8,806,565 | 4,933,000 | 19 | 1.79 | 463,503 | 2,808,823 | 1,777,400 | 1.58 |
| 3 | 11,379,094 | 6,485,100 | 23 | 1.75 | 494,743 | 2,572,529 | 1,552,100 | 1.66 |
| 4 | 13,486,782 | 8,160,900 | 22 | 1.65 | 613,036 | 2,107,688 | 1,675,800 | 1.26 |
| 5 | 15,683,896 | 9,980,000 | 25 | 1.57 | 627,356 | 2,197,114 | 1,819,100 | 1.21 |
| 6 | 17,615,930 | 11,883,200 | 28 | 1.48 | 629,140 | 1,932,034 | 1,903,200 | 1.02 |
| 7 | 18,837,077 | 13,328,600 | 31 | 1.41 | 607,648 | 1,221,147 | 1,445,400 | 0.84 |
| 8 | 20,010,075 | 15,206,600 | 28 | 1.32 | 714,646 | 1,172,998 | 1,878,000 | 0.62 |
| 9 | 21,216,361 | 16,987,100 | 31 | 1.25 | 684,399 | 1,206,286 | 1,780,500 | 0.68 |
| 10 | 22,105,151 | 18,633,000 | 34 | 1.19 | 650,152 | 888,790 | 1,645,900 | 0.54 |
| 11 | 22,747,254 | 20,259,200 | 37 | 1.12 | 614,791 | 642,103 | 1,626,200 | 0.39 |
| 12 | 23,405,374 | 22,135,400 | 40 | 1.06 | 585,134 | 658,120 | 1,876,200 | 0.35 |
the shape at each K, so a reader can see the ladder move rather than only the totals: 1× 7 rungs@1.7 (9/10/10/5) · 2× 7 rungs@1.55 (10/11/11/5) · 3× 7 rungs@1.55 (10/11/11/5) · 4× 7 rungs@1.6 (10/10/10/4) · 5× 7 rungs@1.6 (10/10/10/3) · 6× 7 rungs@1.7 (9/10/10/2) · 7× 7 rungs@1.7 (8/9/10/1) · 8× 7 rungs@1.9 (7/8/9/0) · 9× 7 rungs@2.15 (6/7/8/0) · 10× 7 rungs@2.45 (5/6/7/0) · 11× 7 rungs@2.85 (4/5/6/0) · 12× 7 rungs@3.45 (3/4/5/0)

## §4 The curvature, and the sweet spot

| from silver | to silver | damage bought | per silver |
|---|---|---|---|
| 3,155,600 | 4,933,000 | 2,808,823 | **1.58** |
| 4,933,000 | 6,485,100 | 2,572,529 | **1.66** |
| 6,485,100 | 8,160,900 | 2,107,688 | **1.26** |
| 8,160,900 | 9,980,000 | 2,197,114 | **1.21** |
| 9,980,000 | 11,883,200 | 1,932,034 | **1.02** |
| 11,883,200 | 13,328,600 | 1,221,147 | **0.84** |
| 13,328,600 | 15,206,600 | 1,172,998 | **0.62** |
| 15,206,600 | 16,987,100 | 1,206,286 | **0.68** |
| 16,987,100 | 18,633,000 | 888,790 | **0.54** |
| 18,633,000 | 20,259,200 | 642,103 | **0.39** |
| 20,259,200 | 22,135,400 | 658,120 | **0.35** |
the marginal falls at 8 of the 10 steps and rises at 2 — the curve is **not** everywhere concave: it has steps where more silver buys *more*, which is where the plan changes shape.
the first slice that buys less than 1 damage a silver starts at 11,883,200 silver.

## §5 Three random shapes, to show what an average one is

261 random shapes at K = 6: total damage from 3,250,648 to 14,230,430, median 7,489,160 (damage a silver 1.56–1.40, median 1.19).
| # | shape | total damage | silver | damage / silver | damage / mercenary |
|---|---|---|---|---|---|
| worst | 6× 2 rungs@2.01 (2/0/1/1) | 3,250,648 | 2,083,300 | 1.56 | 141,333 |
| median | 6× 3 rungs@2.22 (8/9/2/1) | 7,489,160 | 6,314,000 | 1.19 | 267,470 |
| best | 6× 8 rungs@1.1 (8/9/8/1) | 14,230,430 | 10,151,600 | 1.40 | 508,230 |
The median random shape is nowhere near the frontier — the picks are the top of a very thin tail, not the middle of a flat field. That is why they have to come from a search and not from intuition.
