# 263 — what the hero champion’s waves cost

Account /tmp/claude-1000/-home-remi-projects-pyrrhic-totalbattle/844d3a55-4057-4d2d-8707-a8a8bdeb3f6e/scratchpad/acct.json, setup Default; one inline worker, no clock; replayed on 15 workers.

| draw | batches | jobs | job time s | wall 1 worker s | wall on workers s | idle share |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 2 | 50 | 47.9 | 47.9 | 4.3 | 26 % |
| 2 | 1 | 119 | 112.6 | 112.6 | 8.7 | 14 % |
| 3 | 4 | 86 | 72.0 | 72.4 | 7.8 | 38 % |
| 4 | 1 | 35 | 37.6 | 37.6 | 3.4 | 26 % |
| 5 | 1 | 81 | 129.0 | 129.0 | 9.0 | 5 % |

Pass wall on one worker 399.1 s; batches 399.5 s; main thread outside the batches -0.36 s (-0.09 % of the pass).
Jobs 371, mean 1.08 s, longest 3.62 s.
Replayed wall on 15 workers: 33.2 s of the 150 s clock.
Cuts: none.
Batch-by-batch wall 33.2 s against every job in one batch 27.0 s (the most batching could still save).
