The **80** searched calls of the live workload,
sampled as the **top 40 by default wall ms plus a random 40 more** of the 418 the
default searches (66 of the sample are above `MEMO_CAP`, 4,194,304). Each row reads across the
starts, with the identical cap, rank, seed and sweep limit and only `EXACT_DEFAULTS.restarts` moved
(the default is 64). **default** is the real run's own `Tight` row; a cell is
`ms · rating`, and a trailing `*` marks an arm that answered **different counts** than the default.
**rating** is the owner’s `rate(as is, ·, markerRates)`.

| call | space | default | 1 start | 4 starts | 8 starts | 16 starts | 32 starts | 64 starts |
|---|---:|---:---:|---:|---:|---:|---:|---:|
| captains/probe captain:alexander:level10 · 52,228,800 | 52,228,800 | 741 · 17.34 | 9 · 17.34 | 43 · 17.34 | 88 · 17.34 | 175 · 17.34 | 359 · 17.34 | 732 · 17.34 |
| other/probe campaign:merc:50 · 3,948,291,072 | 3,948,291,072 | 423 · 0.00 | 7 · 0.00 | 25 · 0.00 | 51 · 0.00 | 103 · 0.00 | 206 · 0.00 | 408 · 0.00 |
| captains/probe captain:beowulf:star · 7,456,455 | 7,456,455 | 415 · 13.98 | 5 · 13.98 | 22 · 13.98 | 42 · 13.98 | 89 · 13.98 | 191 · 13.98 | 408 · 13.98 |
| captains/probe captain:brunhild:level10 · 9,792,900 | 9,792,900 | 381 · 17.66 | 5 · 17.55 * | 25 · 17.66 | 45 · 17.66 | 92 · 17.66 | 186 · 17.66 | 365 · 17.66 |
| captains/probe captain:bernard:level · 4,640,000 | 4,640,000 | 360 · 26.44 | 6 · 24.23 * | 24 · 26.44 | 43 · 26.44 | 85 · 26.44 | 170 · 26.44 | 338 · 26.44 |
| other/probe sweep:dominance:32 · 135,097,600 | 135,097,600 | 334 · 17.50 | 9 · 16.61 * | 18 · 17.05 * | 28 · 17.05 * | 62 · 17.05 * | 155 · 17.27 * | 328 · 17.44 * |
| upgrades/probe health:ranged · 5,372,136 | 5,372,136 | 308 · 13.51 | 4 · 13.51 | 17 · 13.51 | 33 · 13.51 | 70 · 13.51 | 148 · 13.51 | 282 · 13.51 |
| captains/probe captain:logos:level10 · 7,722,000 | 7,722,000 | 267 · 12.81 | 6 · 12.81 | 15 · 12.81 | 28 · 12.81 | 60 · 12.81 | 112 · 12.81 | 222 · 12.81 |
| captains/probe captain:alexander:star · 1,284,363,600 | 1,284,363,600 | 242 · 0.00 | 4 · 0.00 | 15 · 0.00 | 31 · 0.00 | 58 · 0.00 | 122 · 0.00 | 235 · 0.00 |
| captains/probe captain:brann:level10 · 7,722,000 | 7,722,000 | 236 · 12.81 | 6 · 12.81 | 16 · 12.81 | 29 · 12.81 | 61 · 12.81 | 115 · 12.81 | 226 · 12.81 |
| captains/probe captain:brann:star · 7,722,000 | 7,722,000 | 232 · 12.81 | 6 · 12.81 | 16 · 12.81 | 29 · 12.81 | 60 · 12.81 | 115 · 12.81 | 226 · 12.81 |
| captains/probe captain:logos:star · 7,722,000 | 7,722,000 | 231 · 12.81 | 6 · 12.81 | 16 · 12.81 | 28 · 12.81 | 59 · 12.81 | 112 · 12.81 | 219 · 12.81 |
| captains/probe captain:brann:level · 7,722,000 | 7,722,000 | 231 · 12.81 | 6 · 12.81 | 15 · 12.81 | 28 · 12.81 | 60 · 12.81 | 111 · 12.81 | 218 · 12.81 |
| captains/probe captain:beowulf:level · 7,722,000 | 7,722,000 | 229 · 12.81 | 5 · 12.81 | 15 · 12.81 | 28 · 12.81 | 59 · 12.81 | 112 · 12.81 | 222 · 12.81 |
| captains/probe captain:logos:level · 7,722,000 | 7,722,000 | 227 · 12.81 | 5 · 12.81 | 15 · 12.81 | 28 · 12.81 | 59 · 12.81 | 111 · 12.81 | 218 · 12.81 |
| captains/probe captain:aydae:level10 · 5,855,616 | 5,855,616 | 223 · 15.35 | 3 · 15.35 | 13 · 15.35 | 26 · 15.35 | 52 · 15.35 | 101 · 15.35 | 204 · 15.35 |
| captains/probe captain:aydae:star · 10,681,200 | 10,681,200 | 218 · 15.62 | 4 · 15.62 | 14 · 15.62 | 27 · 15.62 | 52 · 15.62 | 100 · 15.62 | 201 · 15.62 |
| captains/probe captain:minamoto:star · 4,942,080 | 4,942,080 | 218 · 11.65 | 4 · 11.65 | 12 · 11.65 | 24 · 11.65 | 47 · 11.65 | 99 · 11.65 | 199 · 11.65 |
| captains/probe captain:brunhild:level · 7,722,000 | 7,722,000 | 217 · 13.03 | 4 · 13.03 | 12 · 13.03 | 23 · 13.03 | 50 · 13.03 | 103 · 13.03 | 203 · 13.03 |
| other/probe campaign:tier:monster monster tier 4 · 7,020,000 | 7,020,000 | 215 · 15.74 | 3 · 13.48 * | 14 · 15.74 | 24 · 15.74 | 47 · 15.74 | 99 · 15.74 | 204 · 15.74 |
| upgrades/probe strength:melee · 5,372,136 | 5,372,136 | 206 · 13.52 | 4 · 13.52 | 12 · 13.52 | 25 · 13.52 | 49 · 13.52 | 97 · 13.52 | 190 · 13.52 |
| captains/probe captain:bernard:level · 5,405,400 | 5,405,400 | 203 · 13.10 | 3 · 13.10 | 12 · 13.10 | 23 · 13.10 | 47 · 13.10 | 92 · 13.10 | 192 · 13.10 |
| captains/probe captain:bernard:star · 5,559,840 | 5,559,840 | 195 · 13.08 | 4 · 13.08 | 11 · 13.08 | 23 · 13.08 | 45 · 13.08 | 93 · 13.08 | 186 · 13.08 |
| captains/probe captain:alexander:level · 4,447,872 | 4,447,872 | 189 · 13.78 | 4 · 13.78 | 11 · 13.78 | 24 · 13.78 | 50 · 13.78 | 94 · 13.78 | 183 · 13.78 |
| other/probe campaign:tier:troop guardsmen tier 4 · 16,188,228 | 16,188,228 | 177 · 7.93 | 3 · 7.93 | 11 · 7.93 | 22 · 7.93 | 45 · 7.93 | 88 · 7.93 | 166 · 7.93 |
| captains/probe captain:bernard:level10 · 4,633,200 | 4,633,200 | 177 · 13.24 | 4 · 13.08 * | 11 · 13.19 * | 22 · 13.19 * | 44 · 13.24 | 85 · 13.24 | 169 · 13.24 |
| captains/probe captain:leonidas:level10 · 4,602,240 | 4,602,240 | 175 · 13.10 | 3 · 13.10 | 9 · 13.10 | 19 · 13.10 | 40 · 13.10 | 79 · 13.10 | 160 · 13.10 |
| captains/probe captain:brunhild:level10 · 5,928,000 | 5,928,000 | 175 · 13.08 | 3 · 13.08 | 11 · 13.08 | 21 · 13.08 | 40 · 13.08 | 81 · 13.08 | 163 · 13.08 |
| captains/probe captain:alexander:level · 2,042,880 | 2,042,880 | 169 · 21.51 | 15 · 21.51 | 26 · 21.51 | 46 · 21.51 | 50 · 21.51 | 84 · 21.51 | 154 · 21.51 |
| captains/probe captain:brunhild:star · 7,722,000 | 7,722,000 | 168 · 12.92 | 8 · 12.92 | 11 · 12.92 | 19 · 12.92 | 40 · 12.92 | 79 · 12.92 | 154 · 12.92 |
| captains/probe captain:beowulf:star · 11,764,800 | 11,764,800 | 165 · 20.92 | 3 · 20.92 | 9 · 20.92 | 19 · 20.92 | 39 · 20.92 | 80 · 20.92 | 159 · 20.92 |
| captains/probe alexander,aydae,minamoto · 2,042,880 | 2,042,880 | 160 · 21.50 | 15 · 21.50 | 24 · 21.50 | 37 · 21.50 | 50 · 21.50 | 83 · 21.50 | 152 · 21.50 |
| generate/positions · 135,097,600 | 135,097,600 | 160 · 0.00 | 2 · 0.00 | 5 · 0.00 | 9 · 0.00 | 19 · 0.00 | 37 · 0.00 | 81 · 0.00 |
| captains/probe captain:minamoto:level · 51,865,920 | 51,865,920 | 159 · 12.24 | 3 · 12.06 * | 9 · 12.06 * | 20 · 12.24 | 34 · 12.24 | 76 · 12.24 | 147 · 12.24 |
| captains/probe captain:minamoto:level · 4,942,080 | 4,942,080 | 157 · 11.22 | 3 · 11.20 * | 10 · 11.22 | 18 · 11.22 | 37 · 11.22 | 75 · 11.22 | 148 · 11.22 |
| captains/probe captain:minamoto:level10 · 38,330,880 | 38,330,880 | 156 · 10.21 | 3 · 9.89 * | 8 · 9.96 * | 17 · 9.99 * | 33 · 9.99 * | 69 · 9.99 * | 137 · 10.21 |
| captains/probe captain:beowulf:level10 · 5,608,980 | 5,608,980 | 151 · 12.83 | 3 · 12.83 | 10 · 12.83 | 19 · 12.83 | 41 · 12.83 | 74 · 12.83 | 149 · 12.83 |
| captains/probe captain:minamoto:level · 2,000,320 | 2,000,320 | 149 · 21.32 | 16 · 21.32 | 25 · 21.32 | 36 · 21.32 | 50 · 21.32 | 78 · 21.32 | 145 · 21.32 |
| captains/probe captain:minamoto:star · 44,080,512 | 44,080,512 | 142 · 9.56 | 5 · 9.56 | 6 · 9.56 | 9 · 9.56 | 26 · 9.56 | 61 · 9.56 | 137 · 9.56 |
| other/probe sweep:dominance:16 · 135,097,600 | 135,097,600 | 132 · 12.53 | 6 · 12.27 * | 8 · 12.27 * | 13 · 12.27 * | 28 · 12.31 * | 56 · 12.53 | 122 · 12.53 |
| captains/probe captain:alexander:level · 833,064,960 | 833,064,960 | 27 · 0.00 | 1 · 0.00 | 2 · 0.00 | 3 · 0.00 | 6 · 0.00 | 13 · 0.00 | 24 · 0.00 |
| other/probe campaign:silver:minus · 135,097,600 | 135,097,600 | 77 · 0.00 | 1 · 0.00 | 5 · 0.00 | 9 · 0.00 | 19 · 0.00 | 37 · 0.00 | 73 · 0.00 |
| captains/probe captain:brann:level10 · 1,040,520 | 1,040,520 | 12 · 0.00 | 5 · 0.00 | 6 · 0.00 | 8 · 0.00 | 9 · 0.00 | 22 · 0.00 | 17 · 0.00 |
| captains/probe captain:leonidas:star · 26,556,924 | 26,556,924 | 36 · 0.00 | 1 · 0.00 | 2 · 0.00 | 4 · 0.00 | 8 · 0.00 | 18 · 0.00 | 34 · 0.00 |
| other/probe sweep:leadership:16 · 572,000 | 572,000 | 11 · 0.00 | 3 · 0.00 | 3 · 0.00 | 4 · 0.00 | 4 · 0.00 | 8 · 0.00 | 9 · 0.00 |
| captains/probe captain:alexander:level · 7,351,505 | 7,351,505 | 19 · 0.00 | 13 · 0.00 | 1 · 0.00 | 2 · 0.00 | 5 · 0.00 | 9 · 0.00 | 19 · 0.00 |
| other/probe sweep:dominance:4 · 678,132 | 678,132 | 9 · 0.00 | 3 · 0.00 | 4 · 0.00 | 4 · 0.00 | 8 · 0.00 | 9 · 0.00 | 16 · 0.00 |
| other/probe campaign:tier:monster monster tier 4 · 25,584,599,040 | 25,584,599,040 | 11 · 0.00 | 1 · 0.00 | 1 · 0.00 | 1 · 0.00 | 3 · 0.00 | 6 · 0.00 | 11 · 0.00 |
| captains/probe aydae,helen,ingrid · 26,556,924 | 26,556,924 | 35 · 0.00 | 1 · 0.00 | 3 · 0.00 | 4 · 0.00 | 9 · 0.00 | 18 · 0.00 | 33 · 0.00 |
| captains/probe captain:brann:level10 · 5,951,232 | 5,951,232 | 52 · 18.90 | 1 · 18.90 | 3 · 18.90 | 6 · 18.90 | 11 · 18.90 | 25 · 18.90 | 50 · 18.90 |
| captains/probe captain:aydae:star · 72,530,250 | 72,530,250 | 60 · 0.00 | 1 · 0.00 | 4 · 0.00 | 7 · 0.00 | 15 · 0.00 | 27 · 0.00 | 55 · 0.00 |
| captains/probe captain:beowulf:level · 42,384,384 | 42,384,384 | 44 · 0.00 | 1 · 0.00 | 3 · 0.00 | 6 · 0.00 | 11 · 0.00 | 22 · 0.00 | 43 · 0.00 |
| captains/probe captain:leonidas:level · 26,556,924 | 26,556,924 | 35 · 0.00 | 1 · 0.00 | 2 · 0.00 | 4 · 0.00 | 9 · 0.00 | 17 · 0.00 | 34 · 0.00 |
| captains/probe captain:alexander:star · 1,487,808 | 1,487,808 | 42 · 20.04 | 9 · 20.04 | 11 · 20.04 | 12 · 20.04 | 25 · 20.04 | 26 · 20.04 | 42 · 20.04 |
| captains/probe aydae,helen,ingrid · 326,700 | 326,700 | 5 · 8.22 | 4 · 8.22 | 2 · 8.22 | 2 · 8.22 | 2 · 8.22 | 3 · 8.22 | 4 · 8.22 |
| upgrades/probe strength:dragon · 135,097,600 | 135,097,600 | 80 · 0.00 | 5 · 0.00 | 6 · 0.00 | 11 · 0.00 | 19 · 0.00 | 66 · 0.00 | 76 · 0.00 |
| captains/probe captain:minamoto:level · 445,875 | 445,875 | 7 · 0.00 | 3 · 0.00 | 3 · 0.00 | 3 · 0.00 | 3 · 0.00 | 6 · 0.00 | 9 · 0.00 |
| captains/probe aydae,ingrid,leonidas · 3,825,360 | 3,825,360 | 119 · 13.15 | 21 · 13.15 | 25 · 13.15 | 42 · 13.15 | 46 · 13.15 | 80 · 13.15 | 116 · 13.15 |
| captains/probe captain:ingrid:level · 6,971,328 | 6,971,328 | 20 · 15.33 | 14 · 15.32 * | 1 · 15.32 * | 1 · 15.32 * | 4 · 15.33 | 10 · 15.33 | 20 · 15.33 |
| captains/probe captain:bernard:star · 3,705,599,820 | 3,705,599,820 | 50 · 0.00 | 2 · 0.00 | 4 · 0.00 | 16 · 0.00 | 12 · 0.00 | 24 · 0.00 | 47 · 0.00 |
| upgrades/probe health:flying · 131,805,000 | 131,805,000 | 79 · 0.00 | 2 · 0.00 | 5 · 0.00 | 10 · 0.00 | 19 · 0.00 | 37 · 0.00 | 74 · 0.00 |
| captains/probe captain:brunhild:star · 5,951,232 | 5,951,232 | 57 · 18.63 | 2 · 18.61 * | 4 · 18.63 | 6 · 18.63 | 13 · 18.63 | 29 · 18.63 | 55 · 18.63 |
| captains/probe captain:bernard:level10 · 424,125 | 424,125 | 7 · 0.00 | 3 · 0.00 | 2 · 0.00 | 3 · 0.00 | 4 · 0.00 | 6 · 0.00 | 9 · 0.00 |
| captains/probe captain:alexander:star · 16,558,080 | 16,558,080 | 53 · 16.09 | 3 · 16.09 | 6 · 16.09 | 6 · 16.09 | 12 · 16.09 | 28 · 16.09 | 52 · 16.09 |
| captains/probe captain:beowulf:level10 · 32,790,870 | 32,790,870 | 58 · 7.36 | 2 · 6.52 * | 3 · 6.52 * | 3 · 6.52 * | 11 · 6.52 * | 36 · 7.36 | 58 · 7.36 |
| captains/probe captain:alexander:level10 · 24,837,120 | 24,837,120 | 54 · 15.79 | 2 · 15.79 | 2 · 15.79 | 4 · 15.79 | 11 · 15.79 | 28 · 15.79 | 52 · 15.79 |
| captains/probe captain:bernard:level10 · 32,479,488 | 32,479,488 | 38 · 0.00 | 1 · 0.00 | 3 · 0.00 | 5 · 0.00 | 9 · 0.00 | 19 · 0.00 | 36 · 0.00 |
| captains/probe captain:leonidas:level10 · 26,556,924 | 26,556,924 | 36 · 0.00 | 1 · 0.00 | 2 · 0.00 | 4 · 0.00 | 9 · 0.00 | 17 · 0.00 | 33 · 0.00 |
| captains/probe captain:minamoto:level · 443,195,610 | 443,195,610 | 32 · 3.43 | 2 · 3.43 | 3 · 3.43 | 5 · 3.43 | 8 · 3.43 | 16 · 3.43 | 33 · 3.43 |
| captains/probe captain:minamoto:level · 32,182,920 | 32,182,920 | 40 · 0.00 | 1 · 0.00 | 2 · 0.00 | 5 · 0.00 | 9 · 0.00 | 18 · 0.00 | 38 · 0.00 |
| upgrades/probe housing:dominance · 12,474,000 | 12,474,000 | 8 · 1.24 | 0 · 1.24 | 1 · 1.24 | 1 · 1.24 | 2 · 1.24 | 4 · 1.24 | 7 · 1.24 |
| captains/probe captain:brann:star · 11,342,322 | 11,342,322 | 23 · 0.00 | 0 · 0.00 | 1 · 0.00 | 3 · 0.00 | 5 · 0.00 | 11 · 0.00 | 22 · 0.00 |
| upgrades/probe health:mounted · 12,073,600 | 12,073,600 | 8 · 1.09 | 0 · 1.09 | 1 · 1.09 | 2 · 1.09 | 2 · 1.09 | 4 · 1.09 | 7 · 1.09 |
| captains/probe captain:brann:star · 706,875 | 706,875 | 11 · 0.00 | 3 · 0.00 | 3 · 0.00 | 5 · 0.00 | 6 · 0.00 | 7 · 0.00 | 17 · 0.00 |
| other/probe campaign:silver:minus · 9,950,720 | 9,950,720 | 21 · 0.00 | 1 · 0.00 | 1 · 0.00 | 3 · 0.00 | 5 · 0.00 | 10 · 0.00 | 22 · 0.00 |
| captains/probe captain:alexander:level10 · 8,531,244,640 | 8,531,244,640 | 73 · 5.15 | 4 · 5.15 | 7 · 5.15 | 11 · 5.15 | 18 · 5.15 | 38 · 5.15 | 69 · 5.15 |
| captains/probe aydae,brunhild,ingrid · 1,040,520 | 1,040,520 | 13 · 0.00 | 5 · 0.00 | 6 · 0.00 | 7 · 0.00 | 10 · 0.00 | 18 · 0.00 | 13 · 0.00 |
| captains/probe captain:leonidas:level · 4,098,600 | 4,098,600 | 122 · 13.14 | 23 · 13.14 | 36 · 13.14 | 33 · 13.14 | 57 · 13.14 | 70 · 13.14 | 128 · 13.14 |
| captains/probe captain:brunhild:level · 11,342,322 | 11,342,322 | 23 · 0.00 | 1 · 0.00 | 2 · 0.00 | 3 · 0.00 | 6 · 0.00 | 12 · 0.00 | 21 · 0.00 |
| captains/probe captain:minamoto:level · 8,740,872 | 8,740,872 | 20 · 0.00 | 0 · 0.00 | 1 · 0.00 | 2 · 0.00 | 7 · 0.00 | 10 · 0.00 | 19 · 0.00 |

## What the numbers say

- **80 searched calls re-priced** (66 above `MEMO_CAP`), each at 6 arms (1…64 starts).

| starts | Σ ms | Σ rating given up | calls answering different counts |
|---:|---:|---:|---:|
| 1 | 362 | 7.277 | 12 |
| 4 | 784 | 2.040 | 7 |
| 8 | 1397 | 1.826 | 6 |
| 16 | 2661 | 1.737 | 4 |
| 32 | 5248 | 0.443 | 2 |
| 64 | 10250 | 0.056 | 1 |

- **1 start is NOT free on the live workload**: at 1 start the sample gives up **7.277** rating and **12** calls answer different counts. Worst stop: **other/probe campaign:tier:monster monster tier 4** (space 7,020,000), giving up **2.265**.
- Wall, whole sample: **362 ms at 1 start** vs **10250 ms at 64 starts** — ×28.3.
- **The clamp's own count**: of the 418 calls the default **searches**, **333** have a box the caller's own caps (216's `capsFor`) would bring to ≤ the walk cap (300,000) — the kernel would then **walk** them (exhaustive over the feasible set, an exact optimum rather than a heuristic's best). All **351** walked calls stay walked (the clamp only shrinks a box).
