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

<!-- MAESTRO:HITL reason="P1.3 is a trade: at a binding pass clock it changes which probes are cut. Review branch w18-p13-longest-first (Notes, P1.3); merge it and tick, or tick to drop it" -->
- [ ] Longest jobs first. In `runAdvisor` and `runCaptainAdvice`, start the jobs in order of expected cost, longest
  first, while keeping the merge by probe index. Expected cost: the probe's time from the previous run of the same
  pass if known (kept in memory by probe id), else the plan input's size (stack types × leadership) as a proxy.
  Answers identical whenever nothing is cut. In Notes, write which probes a 20 s clock would cut before and after
  on the timing fixture, by simulating a slower device (divide the budget by the measured speed ratio of a phone,
  or use 5 s). If the cut set changes, this is a trade: leave the change on a branch and put a HITL note in
  Notes instead of committing to main. Otherwise commit: `Advisor: longest probes first (W18 P1.3)`.

<!-- MAESTRO:HITL reason="P1.4 is a trade with no measured gain: one more upgrade row cut at a binding clock. Branch w18-p14-captains-one-queue (Notes, P1.4); recommendation: drop it and tick" -->
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

### P1.3 longest probes first (2026-10-11) — a trade, left on branch `w18-p13-longest-first` (a1a6393)

- **How** (on the branch only): new `src/worker/jobOrder.ts` (+ test): `longestFirst(costs)` (ties in order),
  `expectedCosts(ids, times, proxy)`, `timeInto(job, id, times)`, `mapInOrder(pool, jobs, order)` (starts the jobs
  in `order`, answers and `onSettled` indices back in the caller's order). `runAdvisor` keeps the baseline first
  and starts the probes longest first; `runCaptainAdvice` does the same for its confirm trios. Expected cost =
  each probe's own job time on the last pass (module-level map by probe id / trio key; a split probe is timed
  without its wait for the baseline), used only when **every** probe of the pass has one (a time and a proxy are
  not on one scale); else stack types × leadership of the probe's plan.
- **Answers whenever nothing is cut: identical.** Advisor golden on three lanes passes; browser hash
  `a9612b9ca0a9` (no clock and 5 s clock) equals before.
- **Wall** (6 workers, timing fixture, min of 2): upgrades 3 827 → 3 911 ms, captains 5 147 → 5 097, other
  3 159 → 2 782 ms (−12 %); all four 13 808 → 13 542 ms. Small: the advisor's probes cost about the same
  (experiment 190 had said so), the other pass's sweeps and campaign probes do not.
- **Which probes a binding clock cuts** (`passes.mjs` with `BUDGET`, 6 workers; outputs
  `Working/w18/d03-p13-cut-{before,after}.txt`):
  - **5 s clock**: nothing cut, before or after (the passes take 2.8–3.9 s on this desktop).
  - **2 s clock** (a device ~2.5× slower than this one at 20 s): ~50 probes cut either way, and **the set
    changes**. Before, the tail of list order is cut (upgrades: `health:dragon` … `housing:*`; other: the
    leadership sweeps, the three next-tier probes, merc, horizon, silver). After, the longest start first, so
    the cut tail is the cheapest probes' instead: other now cuts the **dominance** sweeps and keeps the
    three next-tier probes and `horizon:5`; upgrades keeps `strength:ranged`, `housing:leadership`; confirm
    keeps `aydae,ingrid,minamoto` and cuts `aydae,carter,ingrid` instead. Same count (48/53 → 47/52), different
    rows on a slow device.
- **Owner's call**: merge `w18-p13-longest-first` (a slow phone shows a different set of rows, ~12 % faster
  "other" pass on desktop), or drop it. Not on main.

### P1.4 captains: one queue (2026-10-11) — no gain, a trade, left on branch `w18-p14-captains-one-queue` (b93dfe8)

- **Who needs what**: `runCaptainAdvice` is a true chain — the screen prices the baseline's stop counts, the
  confirm trios are the screen's shortlist; `runCaptainUpgrades` needs the lead trio (`leadTrio(advice.best)`, i.e.
  every confirm row) and its bar. The only jobs that did not depend on others were **inside**
  `runCaptainUpgrades`: an ask with ≤ `confirm` trios (a captain of the lead trio) plans at once, and a screened
  ask's plans need its own screen, not all nine. The branch puts the screens, then every ask's plan slots, in one
  `pool.map`; a screened slot awaits its ask's shortlist (screens listed first, so a lane has always started the
  screen a slot waits on). Merge unchanged: screen failures, then plan outcomes in (ask, trio) order.
- **Answers with no clock: identical** (worker tests, advisor golden on three lanes, browser hash
  `a9612b9ca0a9`). One unit test asserted the send order (`sent[1]` was the screened ask's plan); it now checks
  the plan is sent at all.
- **Wall: no gain.** Three interleaved A/B rounds (`Working/w18/d03-p14-ab.txt`, 6 workers, timing fixture), the
  upgrade part (captains − captain advice): before 3 300 / 3 483 / 3 354 ms, after 3 413 / 3 384 / 3 327 ms
  (means 3 379 vs 3 375). The three lead-trio plans move into the first wave and push three screens to the
  second, so the screened plans start no earlier.
- **Cut set at a binding clock changes**: at 2 s every upgrade is cut either way; at **3 s** before cuts the 3
  `minamoto` rows, after cuts those **and `captain:bernard:level10`** (3/3 runs each). One more row lost on a slow
  device for nothing: recommend dropping the branch.
