
## 1. `PlanTotals.repeat` against the real battle, to the unit

For every carried plan of every target, `repeat.damage` (the plan's own pricing of its repeated march) beside `marchResult(request, point.counts).summary.avgDamage` (the real `simulateBattle` on that very march — the call the March section makes), and the same for silver and the mercenaries one march loses.

| target | plan | marches | `repeat.damage` | battle `avgDamage` | Δ | `repeat.silver` | battle silver | Δ | `repeat.mercLost` | battle mercs | Δ | label |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 10 | **the plan** | 10 | 5,140,277 | 5,140,277 | **0** | 2,351,100 | 2,351,100 | 0 | 15 | 15 | 0 | `3 stacks · 150 hired · 2.4M silver a march` |
| 10 | recommend | 10 | 4,488,244 | 4,488,244 | **0** | 1,708,300 | 1,708,300 | 0 | 14 | 14 | 0 | `3 stacks · 135 hired · 1.7M silver a march` |
| 10 | knee | 10 | 5,140,277 | 5,140,277 | **0** | 2,351,100 | 2,351,100 | 0 | 15 | 15 | 0 | `3 stacks · 150 hired · 2.4M silver a march` |
| 10 | mostEfficient | 10 | 2,492,896 | 2,492,896 | **0** | 415,800 | 415,800 | 0 | 14 | 14 | 0 | `1 stack · 135 hired · 415.8K silver a march` |
| 10 | mostThrifty | 10 | 1,685,186 | 1,685,186 | **0** | 2,161,300 | 2,161,300 | 0 | 1 | 1 | 0 | `3 stacks · 9 hired · 2.2M silver a march` |
| 10 | row: 6 stacks · 19 hired · 1.5M silver a march | 10 | 2,022,669 | 2,022,669 | **0** | 1,485,700 | 1,485,700 | 0 | 2 | 2 | 0 | `6 stacks · 19 hired · 1.5M silver a march` |
| 10 | row: 6 stacks · 27 hired · 1.5M silver a march | 10 | 2,265,869 | 2,265,869 | **0** | 1,485,700 | 1,485,700 | 0 | 3 | 3 | 0 | `6 stacks · 27 hired · 1.5M silver a march` |
| 10 | row: 6 stacks · 35 hired · 1.5M silver a march | 10 | 2,532,629 | 2,532,629 | **0** | 1,485,700 | 1,485,700 | 0 | 4 | 4 | 0 | `6 stacks · 35 hired · 1.5M silver a march` |
| 10 | row: 6 stacks · 45 hired · 1.5M silver a march | 10 | 2,787,609 | 2,787,609 | **0** | 1,485,700 | 1,485,700 | 0 | 5 | 5 | 0 | `6 stacks · 45 hired · 1.5M silver a march` |
| 10 | row: 6 stacks · 37 hired · 1.5M silver a march | 10 | 2,570,914 | 2,570,914 | **0** | 1,487,600 | 1,487,600 | 0 | 4 | 4 | 0 | `6 stacks · 37 hired · 1.5M silver a march` |
| 10 | row: 6 stacks · 45 hired · 1.5M silver a march | 10 | 2,837,674 | 2,837,674 | **0** | 1,487,600 | 1,487,600 | 0 | 5 | 5 | 0 | `6 stacks · 45 hired · 1.5M silver a march` |
| 10 | row: 6 stacks · 55 hired · 1.5M silver a march | 10 | 3,153,348 | 3,153,348 | **0** | 1,487,600 | 1,487,600 | 0 | 6 | 6 | 0 | `6 stacks · 55 hired · 1.5M silver a march` |
| 10 | row: 7 stacks · 10 hired · 1.6M silver a march | 10 | 1,650,698 | 1,650,698 | **0** | 1,567,700 | 1,567,700 | 0 | 1 | 1 | 0 | `7 stacks · 10 hired · 1.6M silver a march` |
| 10 | row: 5 stacks · 58 hired · 1.7M silver a march | 10 | 3,145,398 | 3,145,398 | **0** | 1,657,200 | 1,657,200 | 0 | 7 | 7 | 0 | `5 stacks · 58 hired · 1.7M silver a march` |
| 10 | row: 5 stacks · 68 hired · 1.7M silver a march | 10 | 3,367,698 | 3,367,698 | **0** | 1,657,200 | 1,657,200 | 0 | 8 | 8 | 0 | `5 stacks · 68 hired · 1.7M silver a march` |
| 10 | row: 3 stacks · 135 hired · 1.7M silver a march | 10 | 4,488,244 | 4,488,244 | **0** | 1,708,300 | 1,708,300 | 0 | 14 | 14 | 0 | `3 stacks · 135 hired · 1.7M silver a march` |
| 10 | row: 4 stacks · 80 hired · 1.8M silver a march | 10 | 3,434,728 | 3,434,728 | **0** | 1,845,500 | 1,845,500 | 0 | 9 | 9 | 0 | `4 stacks · 80 hired · 1.8M silver a march` |
| 10 | row: 4 stacks · 78 hired · 1.8M silver a march | 10 | 3,418,464 | 3,418,464 | **0** | 1,841,200 | 1,841,200 | 0 | 9 | 9 | 0 | `4 stacks · 78 hired · 1.8M silver a march` |
| 10 | row: 4 stacks · 73 hired · 1.8M silver a march | 10 | 3,464,092 | 3,464,092 | **0** | 1,845,500 | 1,845,500 | 0 | 9 | 9 | 0 | `4 stacks · 73 hired · 1.8M silver a march` |
| 10 | row: 4 stacks · 83 hired · 1.8M silver a march | 10 | 3,686,392 | 3,686,392 | **0** | 1,845,500 | 1,845,500 | 0 | 10 | 10 | 0 | `4 stacks · 83 hired · 1.8M silver a march` |
| 10 | row: 4 stacks · 93 hired · 1.8M silver a march | 10 | 3,908,692 | 3,908,692 | **0** | 1,845,500 | 1,845,500 | 0 | 11 | 11 | 0 | `4 stacks · 93 hired · 1.8M silver a march` |
| 10 | row: 3 stacks · 116 hired · 2M silver a march | 10 | 4,062,460 | 4,062,460 | **0** | 1,989,200 | 1,989,200 | 0 | 12 | 12 | 0 | `3 stacks · 116 hired · 2M silver a march` |
| 10 | row: 3 stacks · 128 hired · 2M silver a march | 10 | 4,414,340 | 4,414,340 | **0** | 1,989,200 | 1,989,200 | 0 | 13 | 13 | 0 | `3 stacks · 128 hired · 2M silver a march` |
| 10 | row: 3 stacks · 110 hired · 2M silver a march | 10 | 4,014,200 | 4,014,200 | **0** | 1,989,200 | 1,989,200 | 0 | 11 | 11 | 0 | `3 stacks · 110 hired · 2M silver a march` |
| 10 | row: 3 stacks · 118 hired · 2M silver a march | 10 | 4,192,040 | 4,192,040 | **0** | 1,989,200 | 1,989,200 | 0 | 12 | 12 | 0 | `3 stacks · 118 hired · 2M silver a march` |
| 10 | row: 3 stacks · 138 hired · 2M silver a march | 10 | 4,636,640 | 4,636,640 | **0** | 1,989,200 | 1,989,200 | 0 | 14 | 14 | 0 | `3 stacks · 138 hired · 2M silver a march` |
| 10 | row: 3 stacks · 150 hired · 2M silver a march | 10 | 4,903,400 | 4,903,400 | **0** | 1,989,200 | 1,989,200 | 0 | 15 | 15 | 0 | `3 stacks · 150 hired · 2M silver a march` |
| 10 | row: 3 stacks · 150 hired · 2M silver a march | 10 | 4,910,056 | 4,910,056 | **0** | 1,999,500 | 1,999,500 | 0 | 15 | 15 | 0 | `3 stacks · 150 hired · 2M silver a march` |
| 10 | row: 3 stacks · 150 hired · 2M silver a march | 10 | 4,923,021 | 4,923,021 | **0** | 2,019,100 | 2,019,100 | 0 | 15 | 15 | 0 | `3 stacks · 150 hired · 2M silver a march` |
| 10 | row: 3 stacks · 150 hired · 2.1M silver a march | 10 | 4,956,309 | 4,956,309 | **0** | 2,070,100 | 2,070,100 | 0 | 15 | 15 | 0 | `3 stacks · 150 hired · 2.1M silver a march` |
| 10 | row: 3 stacks · 9 hired · 2.2M silver a march | 10 | 1,685,186 | 1,685,186 | **0** | 2,161,300 | 2,161,300 | 0 | 1 | 1 | 0 | `3 stacks · 9 hired · 2.2M silver a march` |
| 10 | row: 3 stacks · 150 hired · 2.2M silver a march | 10 | 5,023,240 | 5,023,240 | **0** | 2,172,100 | 2,172,100 | 0 | 15 | 15 | 0 | `3 stacks · 150 hired · 2.2M silver a march` |
| 10 | row: 3 stacks · 150 hired · 2.2M silver a march | 10 | 5,029,897 | 5,029,897 | **0** | 2,182,400 | 2,182,400 | 0 | 15 | 15 | 0 | `3 stacks · 150 hired · 2.2M silver a march` |
| 10 | row: 3 stacks · 150 hired · 2.2M silver a march | 10 | 5,043,915 | 5,043,915 | **0** | 2,204,000 | 2,204,000 | 0 | 15 | 15 | 0 | `3 stacks · 150 hired · 2.2M silver a march` |
| 10 | row: 3 stacks · 86 hired · 2.3M silver a march | 10 | 3,484,678 | 3,484,678 | **0** | 2,252,000 | 2,252,000 | 0 | 9 | 9 | 0 | `3 stacks · 86 hired · 2.3M silver a march` |
| 10 | row: 3 stacks · 98 hired · 2.3M silver a march | 10 | 3,732,438 | 3,732,438 | **0** | 2,252,000 | 2,252,000 | 0 | 10 | 10 | 0 | `3 stacks · 98 hired · 2.3M silver a march` |
| 10 | row: 3 stacks · 83 hired · 2.3M silver a march | 10 | 3,561,279 | 3,561,279 | **0** | 2,252,000 | 2,252,000 | 0 | 9 | 9 | 0 | `3 stacks · 83 hired · 2.3M silver a march` |
| 10 | row: 3 stacks · 95 hired · 2.3M silver a march | 10 | 3,959,259 | 3,959,259 | **0** | 2,256,900 | 2,256,900 | 0 | 10 | 10 | 0 | `3 stacks · 95 hired · 2.3M silver a march` |
| 10 | row: 3 stacks · 101 hired · 2.3M silver a march | 10 | 3,961,419 | 3,961,419 | **0** | 2,252,000 | 2,252,000 | 0 | 11 | 11 | 0 | `3 stacks · 101 hired · 2.3M silver a march` |
| 10 | row: 3 stacks · 113 hired · 2.3M silver a march | 10 | 4,339,908 | 4,339,908 | **0** | 2,252,000 | 2,252,000 | 0 | 12 | 12 | 0 | `3 stacks · 113 hired · 2.3M silver a march` |
| 10 | row: 3 stacks · 123 hired · 2.3M silver a march | 10 | 4,643,908 | 4,643,908 | **0** | 2,252,000 | 2,252,000 | 0 | 13 | 13 | 0 | `3 stacks · 123 hired · 2.3M silver a march` |
| 10 | row: 3 stacks · 113 hired · 2.3M silver a march | 10 | 4,359,399 | 4,359,399 | **0** | 2,256,900 | 2,256,900 | 0 | 12 | 12 | 0 | `3 stacks · 113 hired · 2.3M silver a march` |
| 10 | row: 3 stacks · 135 hired · 2.3M silver a march | 10 | 4,848,459 | 4,848,459 | **0** | 2,256,900 | 2,256,900 | 0 | 14 | 14 | 0 | `3 stacks · 135 hired · 2.3M silver a march` |
| 10 | row: 3 stacks · 103 hired · 2.3M silver a march | 10 | 4,137,099 | 4,137,099 | **0** | 2,256,900 | 2,256,900 | 0 | 11 | 11 | 0 | `3 stacks · 103 hired · 2.3M silver a march` |
| 10 | row: 3 stacks · 150 hired · 2.3M silver a march | 10 | 5,080,006 | 5,080,006 | **0** | 2,258,900 | 2,258,900 | 0 | 15 | 15 | 0 | `3 stacks · 150 hired · 2.3M silver a march` |
| 10 | row: 3 stacks · 150 hired · 2.3M silver a march | 10 | 5,089,113 | 5,089,113 | **0** | 2,272,600 | 2,272,600 | 0 | 15 | 15 | 0 | `3 stacks · 150 hired · 2.3M silver a march` |
| 10 | row: 3 stacks · 150 hired · 2.3M silver a march | 10 | 5,103,133 | 5,103,133 | **0** | 2,294,200 | 2,294,200 | 0 | 15 | 15 | 0 | `3 stacks · 150 hired · 2.3M silver a march` |
| 10 | row: 3 stacks · 150 hired · 2.4M silver a march | 10 | 5,140,277 | 5,140,277 | **0** | 2,351,100 | 2,351,100 | 0 | 15 | 15 | 0 | `3 stacks · 150 hired · 2.4M silver a march` |
| 10 | row: 2 stacks · 30 hired · 2.5M silver a march | 10 | 2,345,935 | 2,345,935 | **0** | 2,476,400 | 2,476,400 | 0 | 3 | 3 | 0 | `2 stacks · 30 hired · 2.5M silver a march` |
| 10 | row: 2 stacks · 20 hired · 2.5M silver a march | 10 | 2,163,641 | 2,163,641 | **0** | 2,476,400 | 2,476,400 | 0 | 2 | 2 | 0 | `2 stacks · 20 hired · 2.5M silver a march` |
| 20 | **the plan** | 20 | 3,991,487 | 3,991,487 | **0** | 1,793,900 | 1,793,900 | 0 | 7 | 7 | 0 | `6 stacks · 69 hired · 1.8M silver a march` |
| 20 | recommend | 20 | 3,881,730 | 3,881,730 | **0** | 1,654,100 | 1,654,100 | 0 | 7 | 7 | 0 | `6 stacks · 68 hired · 1.7M silver a march` |
| 20 | knee | 20 | 3,271,629 | 3,271,629 | **0** | 1,480,400 | 1,480,400 | 0 | 7 | 7 | 0 | `7 stacks · 50 hired · 1.5M silver a march` |
| 20 | mostEfficient | 20 | 1,255,214 | 1,255,214 | **0** | 207,200 | 207,200 | 0 | 7 | 7 | 0 | `1 stack · 68 hired · 207.2K silver a march` |
| 20 | mostThrifty | 20 | 1,842,823 | 1,842,823 | **0** | 1,650,900 | 1,650,900 | 0 | 1 | 1 | 0 | `6 stacks · 10 hired · 1.7M silver a march` |
| 20 | row: 7 stacks · 31 hired · 1.5M silver a march | 20 | 2,582,328 | 2,582,328 | **0** | 1,462,300 | 1,462,300 | 0 | 4 | 4 | 0 | `7 stacks · 31 hired · 1.5M silver a march` |
| 20 | row: 7 stacks · 40 hired · 1.5M silver a march | 20 | 2,882,433 | 2,882,433 | **0** | 1,462,300 | 1,462,300 | 0 | 5 | 5 | 0 | `7 stacks · 40 hired · 1.5M silver a march` |
| 20 | row: 7 stacks · 45 hired · 1.5M silver a march | 20 | 3,049,158 | 3,049,158 | **0** | 1,462,300 | 1,462,300 | 0 | 6 | 6 | 0 | `7 stacks · 45 hired · 1.5M silver a march` |
| 20 | row: 7 stacks · 24 hired · 1.5M silver a march | 20 | 2,013,772 | 2,013,772 | **0** | 1,462,300 | 1,462,300 | 0 | 3 | 3 | 0 | `7 stacks · 24 hired · 1.5M silver a march` |
| 20 | row: 7 stacks · 21 hired · 1.5M silver a march | 20 | 2,126,328 | 2,126,328 | **0** | 1,462,300 | 1,462,300 | 0 | 3 | 3 | 0 | `7 stacks · 21 hired · 1.5M silver a march` |
| 20 | row: 7 stacks · 45 hired · 1.5M silver a march | 20 | 3,104,904 | 3,104,904 | **0** | 1,480,400 | 1,480,400 | 0 | 6 | 6 | 0 | `7 stacks · 45 hired · 1.5M silver a march` |
| 20 | row: 7 stacks · 50 hired · 1.5M silver a march | 20 | 3,271,629 | 3,271,629 | **0** | 1,480,400 | 1,480,400 | 0 | 7 | 7 | 0 | `7 stacks · 50 hired · 1.5M silver a march` |
| 20 | row: 7 stacks · 21 hired · 1.5M silver a march | 20 | 2,143,209 | 2,143,209 | **0** | 1,480,400 | 1,480,400 | 0 | 3 | 3 | 0 | `7 stacks · 21 hired · 1.5M silver a march` |
| 20 | row: 7 stacks · 15 hired · 1.5M silver a march | 20 | 1,815,081 | 1,815,081 | **0** | 1,480,400 | 1,480,400 | 0 | 2 | 2 | 0 | `7 stacks · 15 hired · 1.5M silver a march` |
| 20 | row: 5 stacks · 73 hired · 1.5M silver a march | 20 | 3,430,318 | 3,430,318 | **0** | 1,514,200 | 1,514,200 | 0 | 9 | 9 | 0 | `5 stacks · 73 hired · 1.5M silver a march` |
| 20 | row: 7 stacks · 2 hired · 1.6M silver a march | 20 | 1,410,235 | 1,410,235 | **0** | 1,575,500 | 1,575,500 | 0 | 1 | 1 | 0 | `7 stacks · 2 hired · 1.6M silver a march` |
| 20 | row: 7 stacks · 4 hired · 1.6M silver a march | 20 | 1,415,414 | 1,415,414 | **0** | 1,579,300 | 1,579,300 | 0 | 1 | 1 | 0 | `7 stacks · 4 hired · 1.6M silver a march` |
| 20 | row: 7 stacks · 9 hired · 1.6M silver a march | 20 | 1,509,552 | 1,509,552 | **0** | 1,596,600 | 1,596,600 | 0 | 1 | 1 | 0 | `7 stacks · 9 hired · 1.6M silver a march` |
| 20 | row: 7 stacks · 6 hired · 1.6M silver a march | 20 | 1,554,515 | 1,554,515 | **0** | 1,629,800 | 1,629,800 | 0 | 1 | 1 | 0 | `7 stacks · 6 hired · 1.6M silver a march` |
| 20 | row: 6 stacks · 34 hired · 1.7M silver a march | 20 | 2,657,247 | 2,657,247 | **0** | 1,650,900 | 1,650,900 | 0 | 4 | 4 | 0 | `6 stacks · 34 hired · 1.7M silver a march` |
| 20 | row: 6 stacks · 43 hired · 1.7M silver a march | 20 | 2,957,352 | 2,957,352 | **0** | 1,650,900 | 1,650,900 | 0 | 5 | 5 | 0 | `6 stacks · 43 hired · 1.7M silver a march` |
| 20 | row: 6 stacks · 54 hired · 1.7M silver a march | 20 | 3,253,847 | 3,253,847 | **0** | 1,650,900 | 1,650,900 | 0 | 6 | 6 | 0 | `6 stacks · 54 hired · 1.7M silver a march` |
| 20 | row: 6 stacks · 65 hired · 1.7M silver a march | 20 | 3,764,323 | 3,764,323 | **0** | 1,650,900 | 1,650,900 | 0 | 7 | 7 | 0 | `6 stacks · 65 hired · 1.7M silver a march` |
| 20 | row: 6 stacks · 68 hired · 1.7M silver a march | 20 | 3,881,730 | 3,881,730 | **0** | 1,654,100 | 1,654,100 | 0 | 7 | 7 | 0 | `6 stacks · 68 hired · 1.7M silver a march` |
| 20 | row: 6 stacks · 24 hired · 1.7M silver a march | 20 | 2,353,247 | 2,353,247 | **0** | 1,650,900 | 1,650,900 | 0 | 3 | 3 | 0 | `6 stacks · 24 hired · 1.7M silver a march` |
| 20 | row: 6 stacks · 16 hired · 1.7M silver a march | 20 | 2,061,575 | 2,061,575 | **0** | 1,650,900 | 1,650,900 | 0 | 2 | 2 | 0 | `6 stacks · 16 hired · 1.7M silver a march` |
| 20 | row: 6 stacks · 26 hired · 1.7M silver a march | 20 | 2,365,575 | 2,365,575 | **0** | 1,650,900 | 1,650,900 | 0 | 3 | 3 | 0 | `6 stacks · 26 hired · 1.7M silver a march` |
| 20 | row: 6 stacks · 35 hired · 1.7M silver a march | 20 | 2,675,021 | 2,675,021 | **0** | 1,650,900 | 1,650,900 | 0 | 4 | 4 | 0 | `6 stacks · 35 hired · 1.7M silver a march` |
| 20 | row: 6 stacks · 10 hired · 1.7M silver a march | 20 | 1,842,823 | 1,842,823 | **0** | 1,650,900 | 1,650,900 | 0 | 1 | 1 | 0 | `6 stacks · 10 hired · 1.7M silver a march` |
| 20 | row: 6 stacks · 20 hired · 1.7M silver a march | 20 | 2,146,823 | 2,146,823 | **0** | 1,650,900 | 1,650,900 | 0 | 2 | 2 | 0 | `6 stacks · 20 hired · 1.7M silver a march` |
| 20 | row: 6 stacks · 69 hired · 1.8M silver a march | 20 | 3,958,693 | 3,958,693 | **0** | 1,750,900 | 1,750,900 | 0 | 7 | 7 | 0 | `6 stacks · 69 hired · 1.8M silver a march` |
| 20 | row: 6 stacks · 69 hired · 1.8M silver a march | 20 | 3,965,319 | 3,965,319 | **0** | 1,759,000 | 1,759,000 | 0 | 7 | 7 | 0 | `6 stacks · 69 hired · 1.8M silver a march` |
| 20 | row: 6 stacks · 69 hired · 1.8M silver a march | 20 | 3,970,384 | 3,970,384 | **0** | 1,767,600 | 1,767,600 | 0 | 7 | 7 | 0 | `6 stacks · 69 hired · 1.8M silver a march` |
| 20 | row: 6 stacks · 69 hired · 1.8M silver a march | 20 | 3,984,340 | 3,984,340 | **0** | 1,785,000 | 1,785,000 | 0 | 7 | 7 | 0 | `6 stacks · 69 hired · 1.8M silver a march` |
| 20 | row: 6 stacks · 69 hired · 1.8M silver a march | 20 | 3,991,487 | 3,991,487 | **0** | 1,793,900 | 1,793,900 | 0 | 7 | 7 | 0 | `6 stacks · 69 hired · 1.8M silver a march` |

**85 rows checked. The largest disagreement between `repeat.damage` and what the battle reports for the same march is 0.** The figure the owner saw was the row's `totalDamage / marches` — the plan spread over the finale too — which is a different quantity by construction; `repeat` is the one that agrees with the March.

## 2. The wider undominated frontier, with the shares the owner judges by

Asked for `alternatives: 100 000`, so the thinning keeps the whole frontier: a caller who asks for at least as many rows as the frontier holds is asking for the frontier, and gets it whole — which is what makes this table reproducible after the band ships. Section 3 is the UI's own call (4 rows), where the band applies.

**target 10** — the plan's own march fields 150 hired (54 % of the 277 held) at 5140277 damage and 2.18 damage a silver:

| label | marches | hired a march | % of stock | silver a march | damage a march | % of best march | damage / silver | hired vs plan | silver vs plan |
|---|---|---|---|---|---|---|---|---|---|
| 6 stacks · 19 hired · 1.5M silver a march | 10 | 19 | 6.9 % | 1,485,700 | 2,022,669 | 39 % | 1.59 | 13 % | 73 % |
| 6 stacks · 27 hired · 1.5M silver a march | 10 | 27 | 9.7 % | 1,485,700 | 2,265,869 | 44 % | 1.73 | 18 % | 79 % |
| 6 stacks · 35 hired · 1.5M silver a march | 10 | 35 | 12.6 % | 1,485,700 | 2,532,629 | 49 % | 1.88 | 23 % | 86 % |
| 6 stacks · 45 hired · 1.5M silver a march | 10 | 45 | 16.2 % | 1,485,700 | 2,787,609 | 54 % | 2.00 | 30 % | 92 % |
| 6 stacks · 37 hired · 1.5M silver a march | 10 | 37 | 13.4 % | 1,487,600 | 2,570,914 | 50 % | 1.89 | 25 % | 87 % |
| 6 stacks · 45 hired · 1.5M silver a march | 10 | 45 | 16.2 % | 1,487,600 | 2,837,674 | 55 % | 2.04 | 30 % | 94 % |
| 6 stacks · 55 hired · 1.5M silver a march | 10 | 55 | 19.9 % | 1,487,600 | 3,153,348 | 61 % | 2.20 | 37 % | 101 % |
| 7 stacks · 10 hired · 1.6M silver a march | 10 | 10 | 3.6 % | 1,567,700 | 1,650,698 | 32 % | 1.33 | 7 % | 61 % |
| 5 stacks · 58 hired · 1.7M silver a march | 10 | 58 | 20.9 % | 1,657,200 | 3,145,398 | 61 % | 1.97 | 39 % | 91 % |
| 5 stacks · 68 hired · 1.7M silver a march | 10 | 68 | 24.5 % | 1,657,200 | 3,367,698 | 66 % | 2.07 | 45 % | 95 % |
| 3 stacks · 135 hired · 1.7M silver a march **← sweet spot** | 10 | 135 | 48.7 % | 1,708,300 | 4,488,244 | 87 % | 2.58 | 90 % | 118 % |
| 4 stacks · 80 hired · 1.8M silver a march | 10 | 80 | 28.9 % | 1,845,500 | 3,434,728 | 67 % | 1.93 | 53 % | 89 % |
| 4 stacks · 78 hired · 1.8M silver a march | 10 | 78 | 28.2 % | 1,841,200 | 3,418,464 | 67 % | 1.90 | 52 % | 87 % |
| 4 stacks · 73 hired · 1.8M silver a march | 10 | 73 | 26.4 % | 1,845,500 | 3,464,092 | 67 % | 1.91 | 49 % | 88 % |
| 4 stacks · 83 hired · 1.8M silver a march | 10 | 83 | 30.0 % | 1,845,500 | 3,686,392 | 72 % | 2.01 | 55 % | 92 % |
| 4 stacks · 93 hired · 1.8M silver a march | 10 | 93 | 33.6 % | 1,845,500 | 3,908,692 | 76 % | 2.11 | 62 % | 97 % |
| 3 stacks · 116 hired · 2M silver a march | 10 | 116 | 41.9 % | 1,989,200 | 4,062,460 | 79 % | 2.11 | 77 % | 97 % |
| 3 stacks · 128 hired · 2M silver a march | 10 | 128 | 46.2 % | 1,989,200 | 4,414,340 | 86 % | 2.25 | 85 % | 103 % |
| 3 stacks · 110 hired · 2M silver a march | 10 | 110 | 39.7 % | 1,989,200 | 4,014,200 | 78 % | 2.04 | 73 % | 94 % |
| 3 stacks · 118 hired · 2M silver a march | 10 | 118 | 42.6 % | 1,989,200 | 4,192,040 | 82 % | 2.11 | 79 % | 97 % |
| 3 stacks · 138 hired · 2M silver a march | 10 | 138 | 49.8 % | 1,989,200 | 4,636,640 | 90 % | 2.32 | 92 % | 107 % |
| 3 stacks · 150 hired · 2M silver a march | 10 | 150 | 54.2 % | 1,989,200 | 4,903,400 | 95 % | 2.42 | 100 % | 111 % |
| 3 stacks · 150 hired · 2M silver a march | 10 | 150 | 54.2 % | 1,999,500 | 4,910,056 | 96 % | 2.42 | 100 % | 111 % |
| 3 stacks · 150 hired · 2M silver a march | 10 | 150 | 54.2 % | 2,019,100 | 4,923,021 | 96 % | 2.40 | 100 % | 110 % |
| 3 stacks · 150 hired · 2.1M silver a march | 10 | 150 | 54.2 % | 2,070,100 | 4,956,309 | 96 % | 2.36 | 100 % | 108 % |
| 3 stacks · 9 hired · 2.2M silver a march | 10 | 9 | 3.2 % | 2,161,300 | 1,685,186 | 33 % | 1.01 | 6 % | 46 % |
| 3 stacks · 150 hired · 2.2M silver a march | 10 | 150 | 54.2 % | 2,172,100 | 5,023,240 | 98 % | 2.29 | 100 % | 105 % |
| 3 stacks · 150 hired · 2.2M silver a march | 10 | 150 | 54.2 % | 2,182,400 | 5,029,897 | 98 % | 2.28 | 100 % | 105 % |
| 3 stacks · 150 hired · 2.2M silver a march | 10 | 150 | 54.2 % | 2,204,000 | 5,043,915 | 98 % | 2.27 | 100 % | 104 % |
| 3 stacks · 86 hired · 2.3M silver a march | 10 | 86 | 31.0 % | 2,252,000 | 3,484,678 | 68 % | 1.64 | 57 % | 75 % |
| 3 stacks · 98 hired · 2.3M silver a march | 10 | 98 | 35.4 % | 2,252,000 | 3,732,438 | 73 % | 1.72 | 65 % | 79 % |
| 3 stacks · 83 hired · 2.3M silver a march | 10 | 83 | 30.0 % | 2,252,000 | 3,561,279 | 69 % | 1.66 | 55 % | 76 % |
| 3 stacks · 95 hired · 2.3M silver a march | 10 | 95 | 34.3 % | 2,256,900 | 3,959,259 | 77 % | 1.81 | 63 % | 83 % |
| 3 stacks · 101 hired · 2.3M silver a march | 10 | 101 | 36.5 % | 2,252,000 | 3,961,419 | 77 % | 1.84 | 67 % | 84 % |
| 3 stacks · 113 hired · 2.3M silver a march | 10 | 113 | 40.8 % | 2,252,000 | 4,339,908 | 84 % | 1.97 | 75 % | 91 % |
| 3 stacks · 123 hired · 2.3M silver a march | 10 | 123 | 44.4 % | 2,252,000 | 4,643,908 | 90 % | 2.09 | 82 % | 96 % |
| 3 stacks · 113 hired · 2.3M silver a march | 10 | 113 | 40.8 % | 2,256,900 | 4,359,399 | 85 % | 1.98 | 75 % | 91 % |
| 3 stacks · 135 hired · 2.3M silver a march | 10 | 135 | 48.7 % | 2,256,900 | 4,848,459 | 94 % | 2.16 | 90 % | 99 % |
| 3 stacks · 103 hired · 2.3M silver a march | 10 | 103 | 37.2 % | 2,256,900 | 4,137,099 | 80 % | 1.87 | 69 % | 86 % |
| 3 stacks · 150 hired · 2.3M silver a march | 10 | 150 | 54.2 % | 2,258,900 | 5,080,006 | 99 % | 2.23 | 100 % | 103 % |
| 3 stacks · 150 hired · 2.3M silver a march | 10 | 150 | 54.2 % | 2,272,600 | 5,089,113 | 99 % | 2.23 | 100 % | 102 % |
| 3 stacks · 150 hired · 2.3M silver a march | 10 | 150 | 54.2 % | 2,294,200 | 5,103,133 | 99 % | 2.21 | 100 % | 102 % |
| 3 stacks · 150 hired · 2.4M silver a march **← the plan** | 10 | 150 | 54.2 % | 2,351,100 | 5,140,277 | 100 % | 2.18 | 100 % | 100 % |
| 2 stacks · 30 hired · 2.5M silver a march | 10 | 30 | 10.8 % | 2,476,400 | 2,345,935 | 46 % | 1.11 | 20 % | 51 % |
| 2 stacks · 20 hired · 2.5M silver a march | 10 | 20 | 7.2 % | 2,476,400 | 2,163,641 | 42 % | 1.04 | 13 % | 48 % |

**target 20** — the plan's own march fields 69 hired (25 % of the 277 held) at 3991487 damage and 2.23 damage a silver:

| label | marches | hired a march | % of stock | silver a march | damage a march | % of best march | damage / silver | hired vs plan | silver vs plan |
|---|---|---|---|---|---|---|---|---|---|
| 7 stacks · 31 hired · 1.5M silver a march | 20 | 31 | 11.2 % | 1,462,300 | 2,582,328 | 65 % | 1.81 | 45 % | 81 % |
| 7 stacks · 40 hired · 1.5M silver a march | 20 | 40 | 14.4 % | 1,462,300 | 2,882,433 | 72 % | 2.01 | 58 % | 90 % |
| 7 stacks · 45 hired · 1.5M silver a march | 20 | 45 | 16.2 % | 1,462,300 | 3,049,158 | 76 % | 2.11 | 65 % | 95 % |
| 7 stacks · 24 hired · 1.5M silver a march | 20 | 24 | 8.7 % | 1,462,300 | 2,013,772 | 50 % | 1.48 | 35 % | 66 % |
| 7 stacks · 21 hired · 1.5M silver a march | 20 | 21 | 7.6 % | 1,462,300 | 2,126,328 | 53 % | 1.53 | 30 % | 69 % |
| 7 stacks · 45 hired · 1.5M silver a march | 20 | 45 | 16.2 % | 1,480,400 | 3,104,904 | 78 % | 2.12 | 65 % | 95 % |
| 7 stacks · 50 hired · 1.5M silver a march | 20 | 50 | 18.1 % | 1,480,400 | 3,271,629 | 82 % | 2.21 | 72 % | 99 % |
| 7 stacks · 21 hired · 1.5M silver a march | 20 | 21 | 7.6 % | 1,480,400 | 2,143,209 | 54 % | 1.52 | 30 % | 68 % |
| 7 stacks · 15 hired · 1.5M silver a march | 20 | 15 | 5.4 % | 1,480,400 | 1,815,081 | 45 % | 1.33 | 22 % | 60 % |
| 5 stacks · 73 hired · 1.5M silver a march | 20 | 73 | 26.4 % | 1,514,200 | 3,430,318 | 86 % | 2.24 | 106 % | 101 % |
| 7 stacks · 2 hired · 1.6M silver a march | 20 | 2 | 0.7 % | 1,575,500 | 1,410,235 | 35 % | 1.02 | 3 % | 46 % |
| 7 stacks · 4 hired · 1.6M silver a march | 20 | 4 | 1.4 % | 1,579,300 | 1,415,414 | 35 % | 1.04 | 6 % | 47 % |
| 7 stacks · 9 hired · 1.6M silver a march | 20 | 9 | 3.2 % | 1,596,600 | 1,509,552 | 38 % | 1.08 | 13 % | 49 % |
| 7 stacks · 6 hired · 1.6M silver a march | 20 | 6 | 2.2 % | 1,629,800 | 1,554,515 | 39 % | 1.09 | 9 % | 49 % |
| 6 stacks · 34 hired · 1.7M silver a march | 20 | 34 | 12.3 % | 1,650,900 | 2,657,247 | 67 % | 1.66 | 49 % | 75 % |
| 6 stacks · 43 hired · 1.7M silver a march | 20 | 43 | 15.5 % | 1,650,900 | 2,957,352 | 74 % | 1.84 | 62 % | 83 % |
| 6 stacks · 54 hired · 1.7M silver a march | 20 | 54 | 19.5 % | 1,650,900 | 3,253,847 | 82 % | 2.00 | 78 % | 90 % |
| 6 stacks · 65 hired · 1.7M silver a march | 20 | 65 | 23.5 % | 1,650,900 | 3,764,323 | 94 % | 2.28 | 94 % | 102 % |
| 6 stacks · 68 hired · 1.7M silver a march **← sweet spot** | 20 | 68 | 24.5 % | 1,654,100 | 3,881,730 | 97 % | 2.34 | 99 % | 105 % |
| 6 stacks · 24 hired · 1.7M silver a march | 20 | 24 | 8.7 % | 1,650,900 | 2,353,247 | 59 % | 1.49 | 35 % | 67 % |
| 6 stacks · 16 hired · 1.7M silver a march | 20 | 16 | 5.8 % | 1,650,900 | 2,061,575 | 52 % | 1.34 | 23 % | 60 % |
| 6 stacks · 26 hired · 1.7M silver a march | 20 | 26 | 9.4 % | 1,650,900 | 2,365,575 | 59 % | 1.50 | 38 % | 67 % |
| 6 stacks · 35 hired · 1.7M silver a march | 20 | 35 | 12.6 % | 1,650,900 | 2,675,021 | 67 % | 1.67 | 51 % | 75 % |
| 6 stacks · 10 hired · 1.7M silver a march | 20 | 10 | 3.6 % | 1,650,900 | 1,842,823 | 46 % | 1.22 | 14 % | 55 % |
| 6 stacks · 20 hired · 1.7M silver a march | 20 | 20 | 7.2 % | 1,650,900 | 2,146,823 | 54 % | 1.39 | 29 % | 62 % |
| 6 stacks · 69 hired · 1.8M silver a march | 20 | 69 | 24.9 % | 1,750,900 | 3,958,693 | 99 % | 2.26 | 100 % | 102 % |
| 6 stacks · 69 hired · 1.8M silver a march | 20 | 69 | 24.9 % | 1,759,000 | 3,965,319 | 99 % | 2.25 | 100 % | 101 % |
| 6 stacks · 69 hired · 1.8M silver a march | 20 | 69 | 24.9 % | 1,767,600 | 3,970,384 | 99 % | 2.25 | 100 % | 101 % |
| 6 stacks · 69 hired · 1.8M silver a march | 20 | 69 | 24.9 % | 1,785,000 | 3,984,340 | 100 % | 2.23 | 100 % | 100 % |
| 6 stacks · 69 hired · 1.8M silver a march **← the plan** | 20 | 69 | 24.9 % | 1,793,900 | 3,991,487 | 100 % | 2.23 | 100 % | 100 % |

## 2b. Candidate rules, and what each keeps and drops

Every rule is anchored on the plan itself (`chosen`), so the plan always passes and no threshold is a free-standing number. "mercs" is the hired units the row's march fields against what the plan's own march fields; "silver" is the row's damage a silver against the plan's; "march" is the row's damage a march against the best march in the list; "stack" is the experiment-72 criterion that a march fields more than one troop stack.

**target 10** — 45 frontier rows; the plan fields 150 hired (54 % of stock), the best march is 5,140,277, the plan's return is 2.18 damage a silver:

| rule | keeps | drops | plan kept | sweet spot kept | mercs a march, kept range | damage a silver, kept range | the rows it drops that field ≥ 25 % of the stock |
|---|---|---|---|---|---|---|---|
| R1 mercs ≥ 25 % of the stock | 32/45 | 13 | yes | yes | 26–54 % | 1.64–2.58 | — |
| R2 mercs ≥ 50 % of the plan's mercs | 31/45 | 14 | yes | yes | 28–54 % | 1.64–2.58 | 73 hired, 1.91/silver |
| R3 silver ≥ 50 % of the plan's damage a silver | 43/45 | 2 | yes | yes | 4–54 % | 1.11–2.58 | — |
| R4 march ≥ 50 % of the best march (experiment 72) | 38/45 | 7 | yes | yes | 13–54 % | 1.64–2.58 | — |
| R5 more than one troop stack | 45/45 | 0 | yes | yes | 3–54 % | 1.01–2.58 | — |
| R2 ∧ R3 | 31/45 | 14 | yes | yes | 28–54 % | 1.64–2.58 | 73 hired, 1.91/silver |
| R2 ∧ R4 | 31/45 | 14 | yes | yes | 28–54 % | 1.64–2.58 | 73 hired, 1.91/silver |
| R2 ∧ R3 ∧ R4 ∧ R5 (the 72 rule, re-anchored) | 31/45 | 14 | yes | yes | 28–54 % | 1.64–2.58 | 73 hired, 1.91/silver |

**target 20** — 30 frontier rows; the plan fields 69 hired (25 % of stock), the best march is 3,991,487, the plan's return is 2.23 damage a silver:

| rule | keeps | drops | plan kept | sweet spot kept | mercs a march, kept range | damage a silver, kept range | the rows it drops that field ≥ 25 % of the stock |
|---|---|---|---|---|---|---|---|
| R1 mercs ≥ 25 % of the stock | 1/30 | 29 | **NO** | **NO** | 26–26 % | 2.24–2.24 | — |
| R2 mercs ≥ 50 % of the plan's mercs | 15/30 | 15 | yes | yes | 13–26 % | 1.67–2.34 | — |
| R3 silver ≥ 50 % of the plan's damage a silver | 26/30 | 4 | yes | yes | 4–26 % | 1.22–2.34 | — |
| R4 march ≥ 50 % of the best march (experiment 72) | 24/30 | 6 | yes | yes | 6–26 % | 1.34–2.34 | — |
| R5 more than one troop stack | 30/30 | 0 | yes | yes | 1–26 % | 1.02–2.34 | — |
| R2 ∧ R3 | 15/30 | 15 | yes | yes | 13–26 % | 1.67–2.34 | — |
| R2 ∧ R4 | 15/30 | 15 | yes | yes | 13–26 % | 1.67–2.34 | — |
| R2 ∧ R3 ∧ R4 ∧ R5 (the 72 rule, re-anchored) | 15/30 | 15 | yes | yes | 13–26 % | 1.67–2.34 | — |

## 3. The band the UI is handed (`alternatives: 4` — the call the bar makes)

A plan is carried when its march fields at least **half the hired troops the plan's own march fields**, returns at least **half the plan's own damage a silver**, and stands on **more than one troop stack**. Every part is measured against the plan itself, so the plan can never be banded out; the balanced sweet spot is anchored on the same two ratios, and is force-kept with it.

**target 10** — the frontier holds **45** plans, the bar is handed **5** and `leftOut` reads **14**; the plan's own march fields 150 hired at 2.18 damage a silver.
| # | label | marches | hired a march | % of stock | hired vs plan | silver a march | damage a march | damage / silver | damage/silver vs plan | pick | in the band |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `3 stacks · 135 hired · 1.7M silver a march` | 10 | 135 | 48.7 % | 90 % | 1,708,300 | 4,488,244 | 2.58 | 118 % | balanced | yes |
| 2 | `4 stacks · 80 hired · 1.8M silver a march` | 10 | 80 | 28.9 % | 53 % | 1,845,500 | 3,434,728 | 1.93 | 89 % | the sample | yes |
| 3 | `3 stacks · 150 hired · 2M silver a march` | 10 | 150 | 54.2 % | 100 % | 1,999,500 | 4,910,056 | 2.42 | 111 % | the sample | yes |
| 4 | `3 stacks · 95 hired · 2.3M silver a march` | 10 | 95 | 34.3 % | 63 % | 2,256,900 | 3,959,259 | 1.81 | 83 % | the sample | yes |
| 5 | `3 stacks · 150 hired · 2.4M silver a march` | 10 | 150 | 54.2 % | 100 % | 2,351,100 | 5,140,277 | 2.18 | 100 % | the plan | yes |

**What the band refused at 10** — every frontier row the bar no longer carries, and the part of the rule it fails:

| label | hired a march | % of stock | damage a march | damage / silver | troop stacks | fails |
|---|---|---|---|---|---|---|
| `6 stacks · 19 hired · 1.5M silver a march` | 19 | 6.9 % | 2,022,669 | 1.59 | 6 | fewer than half the plan's mercenaries |
| `6 stacks · 27 hired · 1.5M silver a march` | 27 | 9.7 % | 2,265,869 | 1.73 | 6 | fewer than half the plan's mercenaries |
| `6 stacks · 35 hired · 1.5M silver a march` | 35 | 12.6 % | 2,532,629 | 1.88 | 6 | fewer than half the plan's mercenaries |
| `6 stacks · 45 hired · 1.5M silver a march` | 45 | 16.2 % | 2,787,609 | 2.00 | 6 | fewer than half the plan's mercenaries |
| `6 stacks · 37 hired · 1.5M silver a march` | 37 | 13.4 % | 2,570,914 | 1.89 | 6 | fewer than half the plan's mercenaries |
| `6 stacks · 45 hired · 1.5M silver a march` | 45 | 16.2 % | 2,837,674 | 2.04 | 6 | fewer than half the plan's mercenaries |
| `6 stacks · 55 hired · 1.5M silver a march` | 55 | 19.9 % | 3,153,348 | 2.20 | 6 | fewer than half the plan's mercenaries |
| `7 stacks · 10 hired · 1.6M silver a march` | 10 | 3.6 % | 1,650,698 | 1.33 | 7 | fewer than half the plan's mercenaries |
| `5 stacks · 58 hired · 1.7M silver a march` | 58 | 20.9 % | 3,145,398 | 1.97 | 5 | fewer than half the plan's mercenaries |
| `5 stacks · 68 hired · 1.7M silver a march` | 68 | 24.5 % | 3,367,698 | 2.07 | 5 | fewer than half the plan's mercenaries |
| `4 stacks · 73 hired · 1.8M silver a march` | 73 | 26.4 % | 3,464,092 | 1.91 | 4 | fewer than half the plan's mercenaries |
| `3 stacks · 9 hired · 2.2M silver a march` | 9 | 3.2 % | 1,685,186 | 1.01 | 3 | fewer than half the plan's mercenaries; less than half the plan's damage a silver |
| `2 stacks · 30 hired · 2.5M silver a march` | 30 | 10.8 % | 2,345,935 | 1.11 | 2 | fewer than half the plan's mercenaries |
| `2 stacks · 20 hired · 2.5M silver a march` | 20 | 7.2 % | 2,163,641 | 1.04 | 2 | fewer than half the plan's mercenaries; less than half the plan's damage a silver |

The two ratio picks at 10: **light (most damage a silver)** 135 hired (48.7 % of stock), 4.60 damage a silver, 1 troop stacks — **banded out of the bar** (its field still names it); **heavy (most damage a mercenary)** 9 hired (3.2 % of stock), 1.01 damage a silver, 3 troop stacks — **banded out of the bar** (its field still names it). Measured, the band refuses both: the *light* pick is the cheapest plan the frontier has and stands on a single troop stack — the owner's own "the least silver plan would never be chosen … is not a strategy" — and the *heavy* pick is the one his words describe exactly, a march of a few mercenaries that spends its silver for almost nothing.

**target 20** — the frontier holds **30** plans, the bar is handed **5** and `leftOut` reads **15**; the plan's own march fields 69 hired at 2.23 damage a silver.
| # | label | marches | hired a march | % of stock | hired vs plan | silver a march | damage a march | damage / silver | damage/silver vs plan | pick | in the band |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `7 stacks · 40 hired · 1.5M silver a march` | 20 | 40 | 14.4 % | 58 % | 1,462,300 | 2,882,433 | 2.01 | 90 % | the sample | yes |
| 2 | `6 stacks · 43 hired · 1.7M silver a march` | 20 | 43 | 15.5 % | 62 % | 1,650,900 | 2,957,352 | 1.84 | 83 % | the sample | yes |
| 3 | `6 stacks · 68 hired · 1.7M silver a march` | 20 | 68 | 24.5 % | 99 % | 1,654,100 | 3,881,730 | 2.34 | 105 % | balanced | yes |
| 4 | `6 stacks · 35 hired · 1.7M silver a march` | 20 | 35 | 12.6 % | 51 % | 1,650,900 | 2,675,021 | 1.67 | 75 % | the sample | yes |
| 5 | `6 stacks · 69 hired · 1.8M silver a march` | 20 | 69 | 24.9 % | 100 % | 1,793,900 | 3,991,487 | 2.23 | 100 % | the plan | yes |

**What the band refused at 20** — every frontier row the bar no longer carries, and the part of the rule it fails:

| label | hired a march | % of stock | damage a march | damage / silver | troop stacks | fails |
|---|---|---|---|---|---|---|
| `7 stacks · 31 hired · 1.5M silver a march` | 31 | 11.2 % | 2,582,328 | 1.81 | 7 | fewer than half the plan's mercenaries |
| `7 stacks · 24 hired · 1.5M silver a march` | 24 | 8.7 % | 2,013,772 | 1.48 | 7 | fewer than half the plan's mercenaries |
| `7 stacks · 21 hired · 1.5M silver a march` | 21 | 7.6 % | 2,126,328 | 1.53 | 7 | fewer than half the plan's mercenaries |
| `7 stacks · 21 hired · 1.5M silver a march` | 21 | 7.6 % | 2,143,209 | 1.52 | 7 | fewer than half the plan's mercenaries |
| `7 stacks · 15 hired · 1.5M silver a march` | 15 | 5.4 % | 1,815,081 | 1.33 | 7 | fewer than half the plan's mercenaries |
| `7 stacks · 2 hired · 1.6M silver a march` | 2 | 0.7 % | 1,410,235 | 1.02 | 7 | fewer than half the plan's mercenaries; less than half the plan's damage a silver |
| `7 stacks · 4 hired · 1.6M silver a march` | 4 | 1.4 % | 1,415,414 | 1.04 | 7 | fewer than half the plan's mercenaries; less than half the plan's damage a silver |
| `7 stacks · 9 hired · 1.6M silver a march` | 9 | 3.2 % | 1,509,552 | 1.08 | 7 | fewer than half the plan's mercenaries; less than half the plan's damage a silver |
| `7 stacks · 6 hired · 1.6M silver a march` | 6 | 2.2 % | 1,554,515 | 1.09 | 7 | fewer than half the plan's mercenaries; less than half the plan's damage a silver |
| `6 stacks · 34 hired · 1.7M silver a march` | 34 | 12.3 % | 2,657,247 | 1.66 | 6 | fewer than half the plan's mercenaries |
| `6 stacks · 24 hired · 1.7M silver a march` | 24 | 8.7 % | 2,353,247 | 1.49 | 6 | fewer than half the plan's mercenaries |
| `6 stacks · 16 hired · 1.7M silver a march` | 16 | 5.8 % | 2,061,575 | 1.34 | 6 | fewer than half the plan's mercenaries |
| `6 stacks · 26 hired · 1.7M silver a march` | 26 | 9.4 % | 2,365,575 | 1.50 | 6 | fewer than half the plan's mercenaries |
| `6 stacks · 10 hired · 1.7M silver a march` | 10 | 3.6 % | 1,842,823 | 1.22 | 6 | fewer than half the plan's mercenaries |
| `6 stacks · 20 hired · 1.7M silver a march` | 20 | 7.2 % | 2,146,823 | 1.39 | 6 | fewer than half the plan's mercenaries |

The two ratio picks at 20: **light (most damage a silver)** 68 hired (24.5 % of stock), 4.71 damage a silver, 1 troop stacks — **banded out of the bar** (its field still names it); **heavy (most damage a mercenary)** 10 hired (3.6 % of stock), 1.22 damage a silver, 6 troop stacks — **banded out of the bar** (its field still names it). Measured, the band refuses both: the *light* pick is the cheapest plan the frontier has and stands on a single troop stack — the owner's own "the least silver plan would never be chosen … is not a strategy" — and the *heavy* pick is the one his words describe exactly, a march of a few mercenaries that spends its silver for almost nothing.

**Can the band empty the list?** No: the band is applied to the frontier and the **unbanded** frontier is handed back whenever the band would leave nothing, with `leftOut` reading 0 in that case. Measured here, the band keeps 31 of 45 at a target of 10, and 15 of 30 at a target of 20 — a strangled list would have been the reading of a rule applied to the wrong set.
