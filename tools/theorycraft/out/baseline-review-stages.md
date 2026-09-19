# The baseline, stage by stage

21 readings of the bar, in the order the stories ran — every benchmark snapshot in `tools/theorycraft/out/`, so each story's effect on each scenario is one row. A figure carries the verdict against the **row above it**: ▲ harder-hitting, ▼ less, `=` identical to the unit, `+` a stop the stage gained, `—` a stop it does not offer.

| stage | reading | scenarios | run |
|---|---|---|---|
| 0 before | average damage (inferred) | 8 | 2026-09-17T19:55:51.678Z |
| 1 horizon-ceiling | average damage (inferred) | 10 | 2026-09-17T20:26:24.918Z |
| 2 shelter-unlimited-only | average damage (inferred) | 10 | 2026-09-17T20:59:31.174Z |
| 2b totalstack-rows | average damage (inferred) | 10 | 2026-09-17T21:04:06.839Z |
| 3 stops-on-fielded | average damage (inferred) | 10 | 2026-09-17T22:32:04.215Z |
| 3b totalstack-window | average damage (inferred) | 10 | 2026-09-18T00:21:46.882Z |
| 4 put-back | average damage (inferred) | 10 | 2026-09-18T02:07:47.195Z |
| 5 all-in-tail | average damage (inferred) | 10 | 2026-09-18T10:34:12.474Z |
| 6 shelter-all-types | average damage (inferred) | 10 | 2026-09-18T13:15:30.605Z |
| 7 curve-over-band | average damage (inferred) | 10 | 2026-09-18T14:58:24.575Z |
| 8 tail-on-repeated-stops | average damage (inferred) | 10 | 2026-09-18T16:07:27.932Z |
| 9 finale-gold | average damage (inferred) | 10 | 2026-09-18T16:19:34.759Z |
| 10 finale-silver | average damage (inferred) | 10 | 2026-09-18T17:28:04.907Z |
| 11 thrift-end | average damage (inferred) | 10 | 2026-09-19T00:18:22.166Z |
| 12 reliable-damage | worst-opening (inferred) | 10 | 2026-09-19T02:32:01.640Z |
| 13 dominance-monsters | worst-opening (inferred) | 11 | 2026-09-19T04:07:22.045Z |
| 14 coverage | worst-opening (inferred) | 12 | 2026-09-19T05:55:20.096Z |
| 15 band-yardstick | worst-opening (inferred) | 12 | 2026-09-19T07:04:03.776Z |
| 16 rare-stock-readings | worst-opening (inferred) | 12 | 2026-09-19T07:58:42.913Z |
| 17 totalstack-floors | worst-opening (inferred) | 15 | 2026-09-19T09:49:54.061Z |
| proposal (plan-baseline.proposed.json) | worst-opening | 15 | — |

## first-run army, Bear V ×3 (20 000 leadership)

| stage | stops | `sweet-spot` damage | `all-in` damage | vs best sizer |
|---|---|---|---|---|
| 0 before | 1 | + 14,168,526 | — | + 0.5882 |
| 1 horizon-ceiling | 1 | = 14,168,526 | — | = 0.5882 |
| 2 shelter-unlimited-only | 1 | = 14,168,526 | — | = 0.5882 |
| 2b totalstack-rows | 1 | = 14,168,526 | — | = 0.5882 |
| 3 stops-on-fielded | 2 | = 14,168,526 | + 14,505,126 | ▲ 0.6022 |
| 3b totalstack-window | 2 | = 14,168,526 | = 14,505,126 | = 0.6022 |
| 4 put-back | 2 | = 14,168,526 | = 14,505,126 | = 0.6022 |
| 5 all-in-tail | 2 | = 14,168,526 | ▲ 19,115,768 | ▲ 0.7936 |
| 6 shelter-all-types | 2 | = 14,168,526 | = 19,115,768 | = 0.7936 |
| 7 curve-over-band | 2 | = 14,168,526 | = 19,115,768 | = 0.7936 |
| 8 tail-on-repeated-stops | 2 | ▲ 18,779,168 | = 19,115,768 | = 0.7936 |
| 9 finale-gold | 2 | = 18,779,168 | = 19,115,768 | = 0.7936 |
| 10 finale-silver | 2 | = 18,779,168 | = 19,115,768 | = 0.7936 |
| 11 thrift-end | 2 | = 18,779,168 | ▲ 22,661,258 | ▲ 0.9408 |
| 12 reliable-damage | 2 | ▼ 18,413,408 | ▼ 18,750,008 | ▲ 1.0000 |
| 13 dominance-monsters | 2 | = 18,413,408 | = 18,750,008 | = 1.0000 |
| 14 coverage | 2 | = 18,413,408 | = 18,750,008 | = 1.0000 |
| 15 band-yardstick | 2 | = 18,413,408 | = 18,750,008 | = 1.0000 |
| 16 rare-stock-readings | 2 | = 18,413,408 | = 18,750,008 | = 1.0000 |
| 17 totalstack-floors | 2 | = 18,413,408 | = 18,750,008 | = 1.0000 |
| proposal (plan-baseline.proposed.json) | 2 | = 18,413,408 | = 18,750,008 | = 1.0000 |

## first-run army, Bear V ×10 (20 000 leadership)

| stage | stops | `sweet-spot` damage | `all-in` damage | vs best sizer |
|---|---|---|---|---|
| 0 before | 1 | + 21,135,368 | — | + 0.8409 |
| 1 horizon-ceiling | 1 | = 21,135,368 | — | = 0.8409 |
| 2 shelter-unlimited-only | 1 | ▲ 21,732,276 | — | ▲ 0.8647 |
| 2b totalstack-rows | 1 | = 21,732,276 | — | = 0.8647 |
| 3 stops-on-fielded | 2 | = 21,732,276 | + 21,700,948 | = 0.8647 |
| 3b totalstack-window | 2 | = 21,732,276 | = 21,700,948 | = 0.8647 |
| 4 put-back | 2 | = 21,732,276 | = 21,700,948 | = 0.8647 |
| 5 all-in-tail | 2 | = 21,732,276 | = 21,700,948 | = 0.8647 |
| 6 shelter-all-types | 2 | ▼ 21,135,368 | = 21,700,948 | ▼ 0.8634 |
| 7 curve-over-band | 2 | = 21,135,368 | = 21,700,948 | = 0.8634 |
| 8 tail-on-repeated-stops | 2 | = 21,135,368 | = 21,700,948 | = 0.8634 |
| 9 finale-gold | 2 | = 21,135,368 | = 21,700,948 | = 0.8634 |
| 10 finale-silver | 2 | = 21,135,368 | = 21,700,948 | = 0.8634 |
| 11 thrift-end | 2 | = 21,135,368 | ▲ 25,039,888 | ▲ 0.9963 |
| 12 reliable-damage | 2 | ▼ 20,769,608 | ▼ 20,893,375 | ▼ 0.9877 |
| 13 dominance-monsters | 2 | = 20,769,608 | = 20,893,375 | = 0.9877 |
| 14 coverage | 2 | = 20,769,608 | = 20,893,375 | = 0.9877 |
| 15 band-yardstick | 2 | = 20,769,608 | = 20,893,375 | = 0.9877 |
| 16 rare-stock-readings | 2 | = 20,769,608 | = 20,893,375 | = 0.9877 |
| 17 totalstack-floors | 2 | = 20,769,608 | = 20,893,375 | = 0.9877 |
| proposal (plan-baseline.proposed.json) | 2 | = 20,769,608 | = 20,893,375 | = 0.9877 |

## first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)

| stage | stops | `sweet-spot` damage | `steady-max` damage | `all-in` damage | vs best sizer |
|---|---|---|---|---|---|
| 0 before | 3 | + 29,021,204 | + 30,057,473 | + 28,219,651 | + 0.9875 |
| 1 horizon-ceiling | 3 | = 29,021,204 | = 30,057,473 | = 28,219,651 | = 0.9875 |
| 2 shelter-unlimited-only | 3 | = 29,021,204 | = 30,057,473 | = 28,219,651 | = 0.9875 |
| 2b totalstack-rows | 3 | = 29,021,204 | = 30,057,473 | = 28,219,651 | = 0.9875 |
| 3 stops-on-fielded | 3 | = 29,021,204 | = 30,057,473 | = 28,219,651 | = 0.9875 |
| 3b totalstack-window | 3 | = 29,021,204 | = 30,057,473 | = 28,219,651 | = 0.9875 |
| 4 put-back | 3 | = 29,021,204 | = 30,057,473 | ▲ 28,781,642 | = 0.9875 |
| 5 all-in-tail | 3 | = 29,021,204 | = 30,057,473 | = 28,781,642 | = 0.9875 |
| 6 shelter-all-types | 3 | = 29,021,204 | = 30,057,473 | = 28,781,642 | = 0.9875 |
| 7 curve-over-band | 3 | = 29,021,204 | = 30,057,473 | = 28,781,642 | = 0.9875 |
| 8 tail-on-repeated-stops | 3 | = 29,021,204 | = 30,057,473 | = 28,781,642 | = 0.9875 |
| 9 finale-gold | 3 | = 29,021,204 | = 30,057,473 | = 28,781,642 | = 0.9875 |
| 10 finale-silver | 3 | = 29,021,204 | = 30,057,473 | = 28,781,642 | = 0.9875 |
| 11 thrift-end | 3 | = 29,021,204 | = 30,057,473 | ▲ 30,324,441 | ▲ 0.9963 |
| 12 reliable-damage | 3 | ▼ 28,655,444 | ▼ 29,691,713 | ▼ 29,841,879 | ▼ 0.9929 |
| 13 dominance-monsters | 3 | = 28,655,444 | = 29,691,713 | = 29,841,879 | = 0.9929 |
| 14 coverage | 3 | = 28,655,444 | = 29,691,713 | = 29,841,879 | = 0.9929 |
| 15 band-yardstick | 3 | = 28,655,444 | = 29,691,713 | = 29,841,879 | = 0.9929 |
| 16 rare-stock-readings | 3 | = 28,655,444 | = 29,691,713 | = 29,841,879 | = 0.9929 |
| 17 totalstack-floors | 3 | = 28,655,444 | = 29,691,713 | = 29,841,879 | = 0.9929 |
| proposal (plan-baseline.proposed.json) | 3 | = 28,655,444 | = 29,691,713 | = 29,841,879 | = 0.9929 |

## the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

| stage | stops | `sweet-spot` damage | `steady-max` damage | `all-in` damage | vs best sizer |
|---|---|---|---|---|---|
| 0 before | 3 | + 8,193,505 | + 8,331,398 | + 8,154,596 | + 0.9650 |
| 1 horizon-ceiling | 3 | = 8,193,505 | = 8,331,398 | = 8,154,596 | = 0.9650 |
| 2 shelter-unlimited-only | 3 | = 8,193,505 | = 8,331,398 | = 8,154,596 | = 0.9650 |
| 2b totalstack-rows | 3 | = 8,193,505 | = 8,331,398 | = 8,154,596 | = 0.9650 |
| 3 stops-on-fielded | 3 | = 8,193,505 | = 8,331,398 | = 8,154,596 | = 0.9650 |
| 3b totalstack-window | 3 | = 8,193,505 | = 8,331,398 | = 8,154,596 | = 0.9650 |
| 4 put-back | 3 | = 8,193,505 | = 8,331,398 | ▲ 8,394,732 | ▲ 0.9723 |
| 5 all-in-tail | 3 | = 8,193,505 | = 8,331,398 | = 8,394,732 | = 0.9723 |
| 6 shelter-all-types | 3 | = 8,193,505 | = 8,331,398 | = 8,394,732 | = 0.9723 |
| 7 curve-over-band | 3 | = 8,193,505 | = 8,331,398 | = 8,394,732 | = 0.9723 |
| 8 tail-on-repeated-stops | 3 | = 8,193,505 | = 8,331,398 | = 8,394,732 | = 0.9723 |
| 9 finale-gold | 3 | = 8,193,505 | = 8,331,398 | = 8,394,732 | = 0.9723 |
| 10 finale-silver | 3 | = 8,193,505 | = 8,331,398 | = 8,394,732 | = 0.9723 |
| 11 thrift-end | 3 | = 8,193,505 | = 8,331,398 | ▲ 8,628,782 | ▲ 0.9994 |
| 12 reliable-damage | 3 | ▼ 8,084,653 | ▼ 8,222,546 | ▼ 8,519,930 | ▲ 1.0000 |
| 13 dominance-monsters | 3 | = 8,084,653 | = 8,222,546 | = 8,519,930 | = 1.0000 |
| 14 coverage | 3 | = 8,084,653 | = 8,222,546 | = 8,519,930 | = 1.0000 |
| 15 band-yardstick | 3 | = 8,084,653 | = 8,222,546 | = 8,519,930 | = 1.0000 |
| 16 rare-stock-readings | 3 | = 8,084,653 | = 8,222,546 | = 8,519,930 | = 1.0000 |
| 17 totalstack-floors | 3 | = 8,084,653 | = 8,222,546 | = 8,519,930 | = 1.0000 |
| proposal (plan-baseline.proposed.json) | 3 | = 8,084,653 | = 8,222,546 | = 8,519,930 | = 1.0000 |

## 2026-09-17 export, its setup (7 000 leadership)

| stage | stops | `silver-saver` damage | `sweet-spot` damage | `more-mercs` damage | `steady-max` damage | `all-in` damage | vs best sizer |
|---|---|---|---|---|---|---|---|
| 0 before | 4 | — | + 21,662,734 | + 22,133,839 | + 23,264,491 | + 22,518,504 | + 0.8964 |
| 1 horizon-ceiling | 4 | — | = 21,662,734 | = 22,133,839 | = 23,264,491 | = 22,518,504 | = 0.8964 |
| 2 shelter-unlimited-only | 4 | — | ▲ 22,045,361 | ▲ 22,485,059 | ▲ 24,814,601 | = 22,518,504 | ▲ 0.9562 |
| 2b totalstack-rows | 4 | — | = 22,045,361 | = 22,485,059 | = 24,814,601 | = 22,518,504 | = 0.9562 |
| 3 stops-on-fielded | 5 | + 16,747,720 | ▼ 20,924,965 | = 22,485,059 | = 24,814,601 | = 22,518,504 | = 0.9562 |
| 3b totalstack-window | 5 | = 16,747,720 | = 20,924,965 | = 22,485,059 | = 24,814,601 | = 22,518,504 | = 0.9562 |
| 4 put-back | 5 | = 16,747,720 | = 20,924,965 | = 22,485,059 | = 24,814,601 | = 22,518,504 | = 0.9562 |
| 5 all-in-tail | 5 | = 16,747,720 | = 20,924,965 | = 22,485,059 | = 24,814,601 | = 22,518,504 | = 0.9562 |
| 6 shelter-all-types | 4 | — | ▲ 21,662,734 | ▼ 22,133,839 | ▼ 23,264,491 | = 22,518,504 | ▼ 0.8964 |
| 7 curve-over-band | 4 | — | = 21,662,734 | = 22,133,839 | = 23,264,491 | = 22,518,504 | = 0.8964 |
| 8 tail-on-repeated-stops | 4 | — | = 21,662,734 | = 22,133,839 | = 23,264,491 | = 22,518,504 | = 0.8964 |
| 9 finale-gold | 4 | — | = 21,662,734 | = 22,133,839 | = 23,264,491 | = 22,518,504 | = 0.8964 |
| 10 finale-silver | 4 | — | = 21,662,734 | = 22,133,839 | = 23,264,491 | = 22,518,504 | = 0.8964 |
| 11 thrift-end | 4 | — | = 21,662,734 | = 22,133,839 | = 23,264,491 | ▲ 23,447,087 | ▲ 0.9035 |
| 12 reliable-damage | 5 | ▼ 16,217,218 | ▼ 20,079,262 | ▼ 21,834,211 | ▼ 22,770,620 | ▲ 23,619,920 | ▲ 0.9588 |
| 13 dominance-monsters | 5 | = 16,217,218 | = 20,079,262 | = 21,834,211 | = 22,770,620 | = 23,619,920 | = 0.9588 |
| 14 coverage | 5 | = 16,217,218 | = 20,079,262 | = 21,834,211 | = 22,770,620 | = 23,619,920 | = 0.9588 |
| 15 band-yardstick | 5 | ▼ 16,115,314 | ▼ 18,796,348 | ▼ 20,079,262 | = 22,770,620 | = 23,619,920 | = 0.9588 |
| 16 rare-stock-readings | 5 | = 16,115,314 | = 18,796,348 | = 20,079,262 | = 22,770,620 | = 23,619,920 | = 0.9588 |
| 17 totalstack-floors | 5 | = 16,115,314 | = 18,796,348 | = 20,079,262 | = 22,770,620 | = 23,619,920 | = 0.9588 |
| proposal (plan-baseline.proposed.json) | 5 | = 16,115,314 | = 18,796,348 | = 20,079,262 | = 22,770,620 | = 23,619,920 | = 0.9588 |

## 2026-09-17 export, 12 000 leadership

| stage | stops | `silver-saver` damage | `sweet-spot` damage | `more-mercs` damage | `steady-max` damage | `all-in` damage | vs best sizer |
|---|---|---|---|---|---|---|---|
| 0 before | 4 | + 25,145,044 | + 32,231,242 | — | + 32,518,195 | + 31,652,798 | + 0.9485 |
| 1 horizon-ceiling | 4 | = 25,145,044 | = 32,231,242 | — | = 32,518,195 | = 31,652,798 | = 0.9485 |
| 2 shelter-unlimited-only | 4 | = 25,145,044 | = 32,231,242 | — | = 32,518,195 | = 31,652,798 | = 0.9485 |
| 2b totalstack-rows | 4 | = 25,145,044 | = 32,231,242 | — | = 32,518,195 | = 31,652,798 | = 0.9485 |
| 3 stops-on-fielded | 4 | = 25,145,044 | = 32,231,242 | — | = 32,518,195 | = 31,652,798 | = 0.9485 |
| 3b totalstack-window | 4 | = 25,145,044 | = 32,231,242 | — | = 32,518,195 | = 31,652,798 | = 0.9485 |
| 4 put-back | 4 | = 25,145,044 | = 32,231,242 | — | = 32,518,195 | = 31,652,798 | = 0.9485 |
| 5 all-in-tail | 4 | = 25,145,044 | = 32,231,242 | — | = 32,518,195 | = 31,652,798 | = 0.9485 |
| 6 shelter-all-types | 4 | = 25,145,044 | = 32,231,242 | — | = 32,518,195 | = 31,652,798 | = 0.9485 |
| 7 curve-over-band | 4 | = 25,145,044 | = 32,231,242 | — | = 32,518,195 | = 31,652,798 | = 0.9485 |
| 8 tail-on-repeated-stops | 4 | = 25,145,044 | = 32,231,242 | — | = 32,518,195 | = 31,652,798 | = 0.9485 |
| 9 finale-gold | 4 | = 25,145,044 | = 32,231,242 | — | = 32,518,195 | = 31,652,798 | = 0.9485 |
| 10 finale-silver | 4 | = 25,145,044 | = 32,231,242 | — | = 32,518,195 | = 31,652,798 | = 0.9485 |
| 11 thrift-end | 5 | ▲ 25,905,397 | ▼ 28,748,251 | + 29,660,413 | ▼ 32,231,242 | ▲ 33,028,417 | ▲ 0.9634 |
| 12 reliable-damage | 4 | ▼ 22,586,784 | ▼ 27,104,076 | ▼ 28,986,315 | ▼ 31,546,458 | — | ▼ 0.9480 |
| 13 dominance-monsters | 4 | = 22,586,784 | = 27,104,076 | = 28,986,315 | = 31,546,458 | — | = 0.9480 |
| 14 coverage | 3 | ▼ 22,531,695 | ▲ 31,546,458 | — | ▲ 31,963,845 | — | ▲ 0.9605 |
| 15 band-yardstick | 3 | = 22,531,695 | = 31,546,458 | — | = 31,963,845 | — | = 0.9605 |
| 16 rare-stock-readings | 3 | = 22,531,695 | = 31,546,458 | — | = 31,963,845 | — | = 0.9605 |
| 17 totalstack-floors | 3 | = 22,531,695 | = 31,546,458 | — | = 31,963,845 | — | = 0.9605 |
| proposal (plan-baseline.proposed.json) | 3 | = 22,531,695 | = 31,546,458 | — | = 31,963,845 | — | = 0.9605 |

## live account of 2026-09-18 (one hired type, 20 000 leadership)

| stage | stops | `silver-saver` damage | `sweet-spot` damage | `steady-max` damage | `all-in` damage | vs best sizer |
|---|---|---|---|---|---|---|
| 0 before | 4 | + 21,453,290 | + 29,677,128 | + 30,215,378 | + 31,218,724 | + 0.9912 |
| 1 horizon-ceiling | 4 | = 21,453,290 | = 29,677,128 | = 30,215,378 | = 31,218,724 | = 0.9912 |
| 2 shelter-unlimited-only | 4 | = 21,453,290 | = 29,677,128 | = 30,215,378 | = 31,218,724 | = 0.9912 |
| 2b totalstack-rows | 4 | = 21,453,290 | = 29,677,128 | = 30,215,378 | = 31,218,724 | = 0.9912 |
| 3 stops-on-fielded | 4 | ▼ 18,681,950 | = 29,677,128 | = 30,215,378 | = 31,218,724 | = 0.9912 |
| 3b totalstack-window | 4 | = 18,681,950 | = 29,677,128 | = 30,215,378 | = 31,218,724 | = 0.9912 |
| 4 put-back | 4 | = 18,681,950 | = 29,677,128 | = 30,215,378 | = 31,218,724 | = 0.9912 |
| 5 all-in-tail | 4 | = 18,681,950 | = 29,677,128 | = 30,215,378 | = 31,218,724 | = 0.9912 |
| 6 shelter-all-types | 4 | = 18,681,950 | = 29,677,128 | = 30,215,378 | = 31,218,724 | = 0.9912 |
| 7 curve-over-band | 4 | = 18,681,950 | = 29,677,128 | = 30,215,378 | = 31,218,724 | = 0.9912 |
| 8 tail-on-repeated-stops | 4 | = 18,681,950 | = 29,677,128 | = 30,215,378 | = 31,218,724 | = 0.9912 |
| 9 finale-gold | 4 | = 18,681,950 | = 29,677,128 | = 30,215,378 | = 31,218,724 | = 0.9912 |
| 10 finale-silver | 4 | = 18,681,950 | = 29,677,128 | = 30,215,378 | = 31,218,724 | = 0.9912 |
| 11 thrift-end | 4 | = 18,681,950 | = 29,677,128 | = 30,215,378 | ▲ 31,628,813 | ▲ 1.0042 |
| 12 reliable-damage | 4 | ▲ 20,891,829 | ▼ 28,270,883 | ▼ 28,727,202 | ▼ 29,743,332 | ▲ 1.1756 |
| 13 dominance-monsters | 4 | = 20,891,829 | = 28,270,883 | = 28,727,202 | = 29,743,332 | = 1.1756 |
| 14 coverage | 4 | = 20,891,829 | = 28,270,883 | = 28,727,202 | = 29,743,332 | = 1.1756 |
| 15 band-yardstick | 4 | = 20,891,829 | = 28,270,883 | = 28,727,202 | = 29,743,332 | = 1.1756 |
| 16 rare-stock-readings | 4 | = 20,891,829 | = 28,270,883 | = 28,727,202 | = 29,743,332 | = 1.1756 |
| 17 totalstack-floors | 4 | = 20,891,829 | = 28,270,883 | = 28,727,202 | = 29,743,332 | = 1.1756 |
| proposal (plan-baseline.proposed.json) | 4 | = 20,891,829 | = 28,270,883 | = 28,727,202 | = 29,743,332 | = 1.1756 |

## live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

| stage | stops | `silver-saver` damage | `sweet-spot` damage | `more-mercs` damage | `steady-max` damage | `all-in` damage | vs best sizer |
|---|---|---|---|---|---|---|---|
| 0 before | 5 | + 22,179,294 | + 26,023,854 | + 27,096,537 | + 30,107,115 | + 29,111,661 | + 0.3733 |
| 1 horizon-ceiling | 5 | = 22,179,294 | = 26,023,854 | = 27,096,537 | = 30,107,115 | = 29,111,661 | = 0.3733 |
| 2 shelter-unlimited-only | 5 | = 22,179,294 | = 26,023,854 | = 27,096,537 | = 30,107,115 | = 29,111,661 | = 0.3733 |
| 2b totalstack-rows | 5 | = 22,179,294 | = 26,023,854 | = 27,096,537 | = 30,107,115 | = 29,111,661 | = 0.3733 |
| 3 stops-on-fielded | 5 | = 22,179,294 | ▲ 28,367,940 | ▲ 29,265,102 | = 30,107,115 | = 29,111,661 | = 0.3733 |
| 3b totalstack-window | 5 | = 22,179,294 | = 28,367,940 | = 29,265,102 | = 30,107,115 | = 29,111,661 | = 0.3733 |
| 4 put-back | 5 | = 22,179,294 | = 28,367,940 | = 29,265,102 | = 30,107,115 | = 29,111,661 | = 0.3733 |
| 5 all-in-tail | 5 | = 22,179,294 | = 28,367,940 | = 29,265,102 | = 30,107,115 | = 29,111,661 | = 0.3733 |
| 6 shelter-all-types | 5 | = 22,179,294 | = 28,367,940 | = 29,265,102 | = 30,107,115 | = 29,111,661 | = 0.3733 |
| 7 curve-over-band | 5 | = 22,179,294 | = 28,367,940 | = 29,265,102 | = 30,107,115 | = 29,111,661 | = 0.3733 |
| 8 tail-on-repeated-stops | 5 | = 22,179,294 | = 28,367,940 | = 29,265,102 | = 30,107,115 | = 29,111,661 | = 0.3733 |
| 9 finale-gold | 5 | = 22,179,294 | = 28,367,940 | = 29,265,102 | = 30,107,115 | = 29,111,661 | = 0.3733 |
| 10 finale-silver | 5 | = 22,179,294 | = 28,367,940 | = 29,265,102 | = 30,107,115 | = 29,111,661 | = 0.3733 |
| 11 thrift-end | 5 | = 22,179,294 | = 28,367,940 | = 29,265,102 | = 30,107,115 | ▲ 32,348,459 | ▲ 0.4011 |
| 12 reliable-damage | 4 | — | ▼ 25,539,281 | ▼ 28,140,302 | ▲ 30,693,083 | ▼ 31,714,657 | ▲ 0.8610 |
| 13 dominance-monsters | 4 | — | = 25,539,281 | = 28,140,302 | = 30,693,083 | = 31,714,657 | = 0.8610 |
| 14 coverage | 4 | — | = 25,539,281 | = 28,140,302 | = 30,693,083 | = 31,714,657 | = 0.8610 |
| 15 band-yardstick | 5 | ▲ 23,474,915 | ▲ 28,140,302 | ▲ 29,851,070 | = 30,693,083 | = 31,714,657 | = 0.8610 |
| 16 rare-stock-readings | 5 | = 23,474,915 | = 28,140,302 | = 29,851,070 | = 30,693,083 | = 31,714,657 | = 0.8610 |
| 17 totalstack-floors | 5 | = 23,474,915 | = 28,140,302 | = 29,851,070 | = 30,693,083 | = 31,714,657 | = 0.8610 |
| proposal (plan-baseline.proposed.json) | 5 | = 23,474,915 | = 28,140,302 | = 29,851,070 | = 30,693,083 | = 31,714,657 | = 0.8610 |

## first-run army, Bear V ×1 (20 000 leadership)

| stage | stops | `sweet-spot` damage | vs best sizer |
|---|---|---|---|
| 0 before | — | — | — |
| 1 horizon-ceiling | 1 | + 4,722,842 | + 0.1976 |
| 2 shelter-unlimited-only | 1 | = 4,722,842 | = 0.1976 |
| 2b totalstack-rows | 1 | = 4,722,842 | = 0.1976 |
| 3 stops-on-fielded | 1 | = 4,722,842 | = 0.1976 |
| 3b totalstack-window | 1 | = 4,722,842 | = 0.1976 |
| 4 put-back | 1 | = 4,722,842 | = 0.1976 |
| 5 all-in-tail | 1 | = 4,722,842 | = 0.1976 |
| 6 shelter-all-types | 1 | = 4,722,842 | = 0.1976 |
| 7 curve-over-band | 1 | = 4,722,842 | = 0.1976 |
| 8 tail-on-repeated-stops | 1 | ▲ 18,554,768 | ▲ 0.7764 |
| 9 finale-gold | 1 | = 18,554,768 | = 0.7764 |
| 10 finale-silver | 1 | = 18,554,768 | = 0.7764 |
| 11 thrift-end | 1 | = 18,554,768 | = 0.7764 |
| 12 reliable-damage | 1 | ▼ 18,189,008 | ▲ 0.9813 |
| 13 dominance-monsters | 1 | = 18,189,008 | = 0.9813 |
| 14 coverage | 1 | = 18,189,008 | = 0.9813 |
| 15 band-yardstick | 1 | = 18,189,008 | = 0.9813 |
| 16 rare-stock-readings | 1 | = 18,189,008 | = 0.9813 |
| 17 totalstack-floors | 1 | = 18,189,008 | = 0.9813 |
| proposal (plan-baseline.proposed.json) | 1 | = 18,189,008 | = 0.9813 |

## first-run army, Bear V ×2 (20 000 leadership)

| stage | stops | `sweet-spot` damage | vs best sizer |
|---|---|---|---|
| 0 before | — | — | — |
| 1 horizon-ceiling | 1 | + 9,557,884 | + 0.3987 |
| 2 shelter-unlimited-only | 1 | = 9,557,884 | = 0.3987 |
| 2b totalstack-rows | 1 | = 9,557,884 | = 0.3987 |
| 3 stops-on-fielded | 1 | = 9,557,884 | = 0.3987 |
| 3b totalstack-window | 1 | = 9,557,884 | = 0.3987 |
| 4 put-back | 1 | = 9,557,884 | = 0.3987 |
| 5 all-in-tail | 1 | = 9,557,884 | = 0.3987 |
| 6 shelter-all-types | 1 | = 9,557,884 | = 0.3987 |
| 7 curve-over-band | 1 | = 9,557,884 | = 0.3987 |
| 8 tail-on-repeated-stops | 1 | ▲ 18,779,168 | ▲ 0.7833 |
| 9 finale-gold | 1 | = 18,779,168 | = 0.7833 |
| 10 finale-silver | 1 | = 18,779,168 | = 0.7833 |
| 11 thrift-end | 1 | = 18,779,168 | = 0.7833 |
| 12 reliable-damage | 1 | ▼ 18,413,408 | ▲ 0.9894 |
| 13 dominance-monsters | 1 | = 18,413,408 | = 0.9894 |
| 14 coverage | 1 | = 18,413,408 | = 0.9894 |
| 15 band-yardstick | 1 | = 18,413,408 | = 0.9894 |
| 16 rare-stock-readings | 1 | = 18,413,408 | = 0.9894 |
| 17 totalstack-floors | 1 | = 18,413,408 | = 0.9894 |
| proposal (plan-baseline.proposed.json) | 1 | = 18,413,408 | = 0.9894 |

## first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)

| stage | stops | `sweet-spot` damage | `more-mercs` damage | `steady-max` damage | vs best sizer |
|---|---|---|---|---|---|
| 0 before | — | — | — | — | — |
| 1 horizon-ceiling | — | — | — | — | — |
| 2 shelter-unlimited-only | — | — | — | — | — |
| 2b totalstack-rows | — | — | — | — | — |
| 3 stops-on-fielded | — | — | — | — | — |
| 3b totalstack-window | — | — | — | — | — |
| 4 put-back | — | — | — | — | — |
| 5 all-in-tail | — | — | — | — | — |
| 6 shelter-all-types | — | — | — | — | — |
| 7 curve-over-band | — | — | — | — | — |
| 8 tail-on-repeated-stops | — | — | — | — | — |
| 9 finale-gold | — | — | — | — | — |
| 10 finale-silver | — | — | — | — | — |
| 11 thrift-end | — | — | — | — | — |
| 12 reliable-damage | — | — | — | — | — |
| 13 dominance-monsters | 3 | + 91,948,255 | + 94,687,477 | + 95,348,743 | + 0.9113 |
| 14 coverage | 3 | = 91,948,255 | = 94,687,477 | = 95,348,743 | = 0.9113 |
| 15 band-yardstick | 3 | = 91,948,255 | = 94,687,477 | = 95,348,743 | = 0.9113 |
| 16 rare-stock-readings | 3 | = 91,948,255 | = 94,687,477 | = 95,348,743 | = 0.9113 |
| 17 totalstack-floors | 3 | = 91,948,255 | = 94,687,477 | = 95,348,743 | = 0.9113 |
| proposal (plan-baseline.proposed.json) | 3 | = 91,948,255 | = 94,687,477 | = 95,348,743 | = 0.9113 |

## Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)

| stage | stops | `sweet-spot` damage | `steady-max` damage | `all-in` damage | vs best sizer |
|---|---|---|---|---|---|
| 0 before | — | — | — | — | — |
| 1 horizon-ceiling | — | — | — | — | — |
| 2 shelter-unlimited-only | — | — | — | — | — |
| 2b totalstack-rows | — | — | — | — | — |
| 3 stops-on-fielded | — | — | — | — | — |
| 3b totalstack-window | — | — | — | — | — |
| 4 put-back | — | — | — | — | — |
| 5 all-in-tail | — | — | — | — | — |
| 6 shelter-all-types | — | — | — | — | — |
| 7 curve-over-band | — | — | — | — | — |
| 8 tail-on-repeated-stops | — | — | — | — | — |
| 9 finale-gold | — | — | — | — | — |
| 10 finale-silver | — | — | — | — | — |
| 11 thrift-end | — | — | — | — | — |
| 12 reliable-damage | — | — | — | — | — |
| 13 dominance-monsters | — | — | — | — | — |
| 14 coverage | 3 | + 15,533,933 | + 17,630,102 | + 18,744,735 | + 0.9483 |
| 15 band-yardstick | 3 | = 15,533,933 | = 17,630,102 | = 18,744,735 | = 0.9483 |
| 16 rare-stock-readings | 3 | = 15,533,933 | = 17,630,102 | = 18,744,735 | = 0.9483 |
| 17 totalstack-floors | 3 | = 15,533,933 | = 17,630,102 | = 18,744,735 | = 0.9483 |
| proposal (plan-baseline.proposed.json) | 3 | = 15,533,933 | = 17,630,102 | = 18,744,735 | = 0.9483 |

## the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)

| stage | stops | `sweet-spot` damage | `more-mercs` damage | `steady-max` damage | `all-in` damage | vs best sizer |
|---|---|---|---|---|---|---|
| 0 before | — | — | — | — | — | — |
| 1 horizon-ceiling | — | — | — | — | — | — |
| 2 shelter-unlimited-only | — | — | — | — | — | — |
| 2b totalstack-rows | — | — | — | — | — | — |
| 3 stops-on-fielded | — | — | — | — | — | — |
| 3b totalstack-window | — | — | — | — | — | — |
| 4 put-back | — | — | — | — | — | — |
| 5 all-in-tail | — | — | — | — | — | — |
| 6 shelter-all-types | — | — | — | — | — | — |
| 7 curve-over-band | — | — | — | — | — | — |
| 8 tail-on-repeated-stops | — | — | — | — | — | — |
| 9 finale-gold | — | — | — | — | — | — |
| 10 finale-silver | — | — | — | — | — | — |
| 11 thrift-end | — | — | — | — | — | — |
| 12 reliable-damage | — | — | — | — | — | — |
| 13 dominance-monsters | — | — | — | — | — | — |
| 14 coverage | — | — | — | — | — | — |
| 15 band-yardstick | — | — | — | — | — | — |
| 16 rare-stock-readings | — | — | — | — | — | — |
| 17 totalstack-floors | 4 | + 8,980,108 | + 12,086,359 | + 15,306,859 | + 10,899,547 | + 0.3035 |
| proposal (plan-baseline.proposed.json) | 4 | = 8,980,108 | = 12,086,359 | = 15,306,859 | = 10,899,547 | = 0.3035 |

## his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)

| stage | stops | `silver-saver` damage | `sweet-spot` damage | `more-mercs` damage | `steady-max` damage | vs best sizer |
|---|---|---|---|---|---|---|
| 0 before | — | — | — | — | — | — |
| 1 horizon-ceiling | — | — | — | — | — | — |
| 2 shelter-unlimited-only | — | — | — | — | — | — |
| 2b totalstack-rows | — | — | — | — | — | — |
| 3 stops-on-fielded | — | — | — | — | — | — |
| 3b totalstack-window | — | — | — | — | — | — |
| 4 put-back | — | — | — | — | — | — |
| 5 all-in-tail | — | — | — | — | — | — |
| 6 shelter-all-types | — | — | — | — | — | — |
| 7 curve-over-band | — | — | — | — | — | — |
| 8 tail-on-repeated-stops | — | — | — | — | — | — |
| 9 finale-gold | — | — | — | — | — | — |
| 10 finale-silver | — | — | — | — | — | — |
| 11 thrift-end | — | — | — | — | — | — |
| 12 reliable-damage | — | — | — | — | — | — |
| 13 dominance-monsters | — | — | — | — | — | — |
| 14 coverage | — | — | — | — | — | — |
| 15 band-yardstick | — | — | — | — | — | — |
| 16 rare-stock-readings | — | — | — | — | — | — |
| 17 totalstack-floors | 4 | + 7,561,467 | + 9,068,238 | + 10,294,068 | + 13,842,678 | + 0.5534 |
| proposal (plan-baseline.proposed.json) | 4 | = 7,561,467 | = 9,068,238 | = 10,294,068 | = 13,842,678 | = 0.5534 |

## his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)

| stage | stops | `sweet-spot` damage | `more-mercs` damage | `steady-max` damage | `all-in` damage | vs best sizer |
|---|---|---|---|---|---|---|
| 0 before | — | — | — | — | — | — |
| 1 horizon-ceiling | — | — | — | — | — | — |
| 2 shelter-unlimited-only | — | — | — | — | — | — |
| 2b totalstack-rows | — | — | — | — | — | — |
| 3 stops-on-fielded | — | — | — | — | — | — |
| 3b totalstack-window | — | — | — | — | — | — |
| 4 put-back | — | — | — | — | — | — |
| 5 all-in-tail | — | — | — | — | — | — |
| 6 shelter-all-types | — | — | — | — | — | — |
| 7 curve-over-band | — | — | — | — | — | — |
| 8 tail-on-repeated-stops | — | — | — | — | — | — |
| 9 finale-gold | — | — | — | — | — | — |
| 10 finale-silver | — | — | — | — | — | — |
| 11 thrift-end | — | — | — | — | — | — |
| 12 reliable-damage | — | — | — | — | — | — |
| 13 dominance-monsters | — | — | — | — | — | — |
| 14 coverage | — | — | — | — | — | — |
| 15 band-yardstick | — | — | — | — | — | — |
| 16 rare-stock-readings | — | — | — | — | — | — |
| 17 totalstack-floors | 4 | + 10,156,338 | + 10,197,781 | + 11,196,175 | + 11,585,381 | + 1.0139 |
| proposal (plan-baseline.proposed.json) | 4 | = 10,156,338 | = 10,197,781 | = 11,196,175 | = 11,585,381 | = 1.0139 |
