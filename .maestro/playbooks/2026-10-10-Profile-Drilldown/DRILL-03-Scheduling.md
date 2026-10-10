# Drill 03: Scheduling, the 5.4 s of idle workers

Playbook: `2026-10-10-Profile-Drilldown` (W18). Agent: pyrrhic. Project: `/home/remi/projects/pyrrhic-totalbattle`.
Plan: `docs/plans/profile-drilldown.md` §0.3. Rules: top of `DRILL-01-Measure-And-Census.md` in this folder. Gate:
`.maestro/playbooks/Working/w18/gate.sh`, plus `tests/kernel/advisor-golden.test.ts` (in `pnpm test`).

The trace showed: each advisor pass plans its baseline alone first (about 600 ms, five workers idle), three times;
the captains pass waits between the trio screen and its probes; jobs go out in list order so the slowest decides
the end; Generate's four Tight pricings run on one worker.

**The one way scheduling can move an answer**: the pool's 20 s pass clock (`CAMPAIGN.budgets.extra`, used by
`runAdvisor` in `src/worker/advisor.ts` and `runCaptainAdvice` in `src/worker/captainAdvice.ts`). When it binds (a
slow phone, a huge account), the probes it cuts depend on the order jobs started. Results are merged by probe,
never by arrival, so with no cut the list cannot change. Every task here must keep that: same answers whenever
nothing is cut, and say in Notes how the set of cut probes changes when the clock binds (a trade for the owner if it
changes which rows a slow device shows).

## Tasks

- [x] One baseline per run (census item K4). Read Drill 01's Notes for K4. If the passes' baseline settings were not
  identical, tick with a note and do nothing. Otherwise add a small cache of the baseline answer keyed by the
  baseline's settings fingerprint (the same hash the census used), held by the module that owns the advisor pool
  (`advisorPool()` in `src/ui/sections/march/advisorSearch.ts`) and cleared on a new Generate and when the pool is
  disposed. `runAdvisor` and `runCaptainAdvice` take an optional `baseline` (or a `baselineFor(settings)` hook) and
  skip their baseline job when given one. The `onProgress` totals must stay right. Gate script; the advisor golden
  must be identical. Commit: `Advisor: one baseline per run (W18 K4)`.

- [x] Start the probes while the baseline plans. Today `runAdvisor` awaits the baseline job before it starts any
  probe, because a probe job reads its stops against the baseline (`readProbe` in `src/engine/advisor.ts`, called at
  the end of `runProbe` in `src/worker/jobs.ts`). Split the probe job so its `planCampaign` and its own `show`
  pricings start at once, and the `readProbe` step runs once the baseline is known: either a second small job per
  probe that is sent the baseline, or one job that receives the baseline by a follow-up message (see
  `src/worker/protocol.ts` and `src/worker/client.ts`). The per-job `read` memo of `runProbe` must still cover both
  steps (the re-priced baseline counts can equal a stop the probe already priced), so keep both steps on the same
  worker or carry the priced marches over. Do the same in `runCaptainAdvice`. Answers identical (advisor golden);
  record the wall time of each pass before and after (experiment 190 `tools/theorycraft/190-the-pool.test.ts`
  measures the pool) in Notes. Commit: `Advisor: probes start while the baseline plans (W18 P1.2)`.

- [ ] Longest jobs first. In `runAdvisor` and `runCaptainAdvice`, start the jobs in order of expected cost, longest
  first, while keeping the merge by probe index. Expected cost: the probe's time from the previous run of the same
  pass if known (kept in memory by probe id), else the plan input's size (stack types × leadership) as a proxy.
  Answers identical whenever nothing is cut. In Notes, write which probes a 20 s clock would cut before and after
  on the timing fixture, by simulating a slower device (divide the budget by the measured speed ratio of a phone,
  or use 5 s). If the cut set changes, this is a trade: leave the change on a branch and put a HITL note in
  Notes instead of committing to main. Otherwise commit: `Advisor: longest probes first (W18 P1.3)`.

- [ ] Remove the barrier in the captains pass. In `src/worker/captainAdvice.ts`, the screen job (`pool.map([screenJob])`,
  around line 178) and the probe jobs (around line 204) are awaited one after the other, and
  `src/ui/sections/march/captainSearch.ts` then runs `runCaptainUpgrades` after `runCaptainAdvice`. Read the code to
  see which step needs which answer; put every job that does not depend on another into one `pool.map` so the
  pool stays busy. Keep the results merged by index. Advisor golden identical. Commit: `Captains: one queue, no barrier (W18 P1.4)`.

- [ ] Generate's Tight pricings in parallel. In `src/ui/sections/march/generate.ts` (around line 120), the bar's
  `client.positions` calls all go to the run's one `client`, so they run one after another on one worker. Send them
  over the advisor pool (or a pool sized to the bar) when it exists, keeping the answer order by stop. The opening
  stop's pricing must still land before the march is drawn (comment in that block). Unit tests in
  `src/ui/sections/march/*.test.ts` and the e2e suite (`pnpm build` first: a running preview serves a stale build)
  must pass. Commit: `Generate: price the bar in parallel (W18 P1.5)`.

- [ ] Re-measure this phase: experiment 190 and 196 timings, and the progress table in
  `docs/plans/profile-drilldown.md` §3. Commit the doc: `W18: Drill 03 measured`.

## Notes

### P1.1 one baseline per run (2026-10-10) — skipped, census says WON'T DO

- Drill 01's K4: the three passes' baseline settings **are** identical (2.00 hits per entry), but the projected
  saving is **2.66 % / 1.39 %** of run CPU (exactness / timing), under the 3 % cache bar, so the verdict is
  **WON'T DO** and "P1.1 dropped" (`docs/plans/profile-drilldown.md` §5). The playbook's rule "no cache without a
  census" decides: no baseline cache is built. K4's cost is wall time (the serial baseline head of each pass),
  which P1.2 below recovers without a cache. Ticked with no code change.

### P1.2 probes start while the baseline plans (2026-10-11)

- **How**: `runAdvisor` sends the baseline and every probe as **one** `pool.map` (baseline at index 0, so the
  merge by probe index and the `onProgress` total, probes + 1, are unchanged). A probe job that starts while the
  baseline is unknown makes two calls on its own lane: `client.probe({ plan })` (plan + show its bar), then, once
  the baseline resolves, `client.probe({ plan, against, shown })`. The new `ProbeInput.shown` (protocol) makes
  `runProbe` skip `planCampaign` and seed its `read` memo with the bar's marches by `countsKey`, i.e. exactly the
  memo the one-call job held when it reached `readProbe`, so it prices the same marches (carried over, not kept on
  a worker). A probe started after the baseline is known is one call, as before. A failed baseline aborts the
  pass at once and `runAdvisor` rethrows its error (new unit test: no probe reads after it); a cut baseline still
  answers `baseline: null` with every probe cut.
- **Captains: nothing to overlap.** In `runCaptainAdvice` every job after the baseline needs it before it can
  start: the screen prices the baseline's stop counts, and the confirm trios are the screen's shortlist. The
  barrier between screen and probes is P1.4's.
- **Answers identical**: the advisor golden passes, now run on **three** interleaved inline lanes (it was one, which
  never takes the split path); the browser run below hashes every pass's answer the same before and after
  (`a9612b9ca0a9`).
- **Wall time**: experiment 190 times `client.plan` jobs only, not the passes, so the passes were timed by a
  scratch runner in its style, `.maestro/playbooks/Working/w18/passes.mjs` (real pool of 6 module workers,
  headless Chromium, Vite dev, timing fixture, no clock, min of 2 runs after a warm-up; 16-thread Ryzen):

  | pass | before | after |
  | --- | --- | --- |
  | upgrades (29 generic probes) | 3 978 ms | 3 841 ms |
  | captain advice (baseline, screen, confirm) | 1 628 ms | 1 714 ms (code unchanged: noise) |
  | captains incl. upgrades | 4 998 ms | 5 216 ms (unchanged code: noise) |
  | other (17 probes) | 3 308 ms | 3 124 ms |

  Gain about 140–180 ms a pass, not the ~600 ms of a whole baseline: the probe that started beside the baseline
  still waits for it before reading, and the end of the pass is set by its slowest jobs (P1.3).
- **When the clock binds**: probes start earlier, in the same list order, so the cut set is a tail of probe order
  that can only get shorter (a subset of what was cut before); a probe that was read before is still read. If the
  baseline is cut, every probe is cut, as before, even ones whose own bar was ready.
- **Gate** (`gate-20261011-*.log.summary`): kernel:build, typecheck, `pnpm test` 271 s, plan-benchmark 158 s,
  bench-diff none, 184 108 s all PASS. Lint FAILED only on a Drill 02 scratch file the linter picks up
  (`Working/w18/tmp/index.p21.ts`), renamed `.ts.txt`; `pnpm lint` then passes.
