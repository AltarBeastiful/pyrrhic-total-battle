# 263 — what the hero champion’s waves cost

Account /tmp/claude-1000/-home-remi-projects-pyrrhic-totalbattle/844d3a55-4057-4d2d-8707-a8a8bdeb3f6e/scratchpad/acct.json, setup Default; one inline worker, no clock; replayed on 15 workers.

| draw | batches | jobs | job time s | wall 1 worker s | wall on workers s | idle share |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 2 | 50 | 56.9 | 56.9 | 5.2 | 27 % |
| 2 | 1 | 154 | 173.1 | 173.1 | 12.9 | 10 % |
| 3 | 4 | 135 | 126.5 | 126.9 | 11.7 | 28 % |
| 4 | 1 | 35 | 39.0 | 39.0 | 3.5 | 25 % |
| 5 | 1 | 88 | 144.0 | 144.0 | 10.2 | 5 % |
| 6 | 1 | 42 | 114.6 | 114.6 | 10.4 | 26 % |

Pass wall on one worker 654.1 s; batches 654.6 s; main thread outside the batches -0.43 s (-0.07 % of the pass).
Jobs 504, mean 1.30 s, longest 5.08 s.
Replayed wall on 15 workers: 53.8 s of the 150 s clock.
Cuts: none.
Batch-by-batch wall 53.8 s against every job in one batch 46.3 s (the most batching could still save).
