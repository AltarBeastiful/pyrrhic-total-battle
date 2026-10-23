# 263 — what the hero champion’s waves cost

Account pyrrhic-my-account-2026-10-11.json, setup Default; one inline worker, no clock; replayed on 15 workers.

| wave | batches | jobs | job time s | wall 1 worker s | wall on workers s | idle share |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 2 | 43 | 13.0 | 13.0 | 1.5 | 41 % |
| 2 | 1 | 252 | 73.6 | 73.6 | 5.3 | 7 % |
| 3 | 4 | 86 | 34.5 | 34.8 | 3.4 | 32 % |
| 4 | 1 | 20 | 5.8 | 5.8 | 0.5 | 24 % |
| 5 | 1 | 188 | 70.0 | 70.0 | 4.9 | 4 % |
| 6 | 1 | 42 | 15.4 | 15.4 | 1.1 | 8 % |

Pass wall on one worker 212.4 s; batches 212.6 s; main thread outside the batches -0.19 s (-0.09 % of the pass).
Jobs 631, mean 0.34 s, longest 0.85 s.
Replayed wall on 15 workers: 16.6 s of the 150 s clock.
Cuts: none.
Batch-by-batch wall 16.6 s against every job in one batch 14.3 s (the most batching could still save).
