# 263 — what the hero champion’s waves cost

Account /tmp/claude-1000/-home-remi-projects-pyrrhic-totalbattle/844d3a55-4057-4d2d-8707-a8a8bdeb3f6e/scratchpad/acct.json, setup Default; one inline worker, no clock; replayed on 15 workers.

| draw | batches | jobs | job time s | wall 1 worker s | wall on workers s | idle share |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 2 | 50 | 49.9 | 49.9 | 4.5 | 26 % |
| 2 | 1 | 280 | 258.1 | 258.1 | 18.3 | 6 % |
| 3 | 4 | 100 | 82.8 | 83.2 | 8.6 | 36 % |
| 4 | 1 | 35 | 36.2 | 36.2 | 3.2 | 24 % |
| 5 | 1 | 175 | 270.8 | 270.8 | 19.4 | 7 % |
| 6 | 1 | 42 | 123.9 | 123.9 | 11.0 | 25 % |

Pass wall on one worker 821.9 s; batches 822.2 s; main thread outside the batches -0.29 s (-0.04 % of the pass).
Jobs 682, mean 1.20 s, longest 5.38 s.
Replayed wall on 15 workers: 65.0 s of the 150 s clock.
Cuts: none.
Batch-by-batch wall 65.0 s against every job in one batch 57.6 s (the most batching could still save).
