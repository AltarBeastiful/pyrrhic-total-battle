position() calls repo 771, pkg 771; answers (how + counts) differ on 0
repo: one worker 202992 ms, replayed on 15 workers 23378 ms, generate steps 4787 ms, Σ Tight 133922 ms
pkg: one worker 59408 ms, replayed on 15 workers 6521 ms, generate steps 612 ms, Σ Tight 18608 ms
repo: one worker 132339 ms, replayed on 15 workers 14723 ms, generate steps 1293 ms, Σ Tight 94967 ms
pkg: one worker 53591 ms, replayed on 15 workers 5886 ms, generate steps 496 ms, Σ Tight 17283 ms
min replayed wall on 15 workers: repo 14723 → pkg 5886 ms (×2.50, saved 8836 ms)
min one-worker wall: repo 132339 → pkg 53591 ms (×2.47)
min generate steps (plan + positions, serial): repo 1293 → pkg 496 ms
min Σ Tight: repo 94967 → pkg 17283 ms (×5.49)
