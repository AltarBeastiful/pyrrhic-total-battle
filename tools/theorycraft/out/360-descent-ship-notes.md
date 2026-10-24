# 360 — shipping the descent (300 V3) for burn-saver / silver-saver — progress notes

- 2026-10-24 start. Read 300/301/353, 290-common, plan.ts rated-stops pass (~8260), config planFixes.
- Facts: planCampaign is synchronous, runs inside one worker job (`runPlan`, src/worker/jobs.ts) -> cannot use the pool;
  Tight is not read inside planCampaign today (raise kernel global `raiseKernel()` in engine/fast.ts is reachable).
- Engine port src/engine/descent.ts (+ RaiseInput.restarts per call in engine/fast.ts, kernel/raise.ts): exp 360 parity
  on acct ★0-2: Tight bills identical to 290-common's applyCounts reading (full + proxy), descent rf identical to 300/353:
  burn 8.9073/22.6393/8.5992, silver ★1 9.2791 ★2 9.5219 (out/360-parity.txt).
- plan.ts pass after the rated stops (CampaignInput.descent, config planFixes.descent {maxVisits 60, topK 6}); guard: no
  hired count above the stop's (Hf floors dominance). Exp 360 RUN=acct/bench: moves exactly acct burn ★0/1/2, silver ★1/2,
  bench 4000 silver, 09-19 localStorage silver, 09-19 message burn (out/360-acct.txt, 360-bench.txt). Plan 0.4 -> 3.5 s.
- Fixture copied: tests/fixtures/pyrrhic-my-account-2026-10-22.json. Next: tests/engine/plan-descent.test.ts, suite.
- tests/engine/plan-descent.test.ts: red with descent off (2 red: ★0→★1 -16.50, ★0→★2 -1.05), green on (23/23).
- Full suite running -> scratchpad suite-360.txt. Timing experiment tools/theorycraft/361-descent-pool.test.ts written (352 replay, off/on arms).
- Suite: new reds = plan-rated-stops (4000 silver saver: descent move counted as a rated-stops move, pre-Tight rating 0.05;
  fixed by isolating that test with descent: undefined), advisor-golden, golden-capture plans.json (expected leaf moves).
  plan-benchmark GREEN. Pre-existing reds: raise.json + 4 raise-kernel (the exact Tight package).
- Recapturing goldens to scratchpad/golden-bak/new then restoring originals from scratchpad/golden-bak (IF INTERRUPTED: cp golden-bak/*.json tests/golden/).
- Goldens recaptured (restored after): plans.json 282 leaves over 12 entries (see report), advisor.json 27 leaves (other/rows/0/stops/1),
  raise.json only the 16 pre-existing package `scored` leaves, sizepool 0, raise-kernel same. Capture: plans TS==kernel assert passed.
- Next: 361 timing run -> out/361-descent-pool.txt
- 361 timing (min of 2): Generate steps 560 -> 4018 ms; live Generate+advisor one worker 50.6 -> 395.6 s, replayed on 15 workers
  5.6 -> 46.0 s (x8.2); position() calls 771 -> 8495 (every advisor probe plan runs the descent). DONE; report sent.
