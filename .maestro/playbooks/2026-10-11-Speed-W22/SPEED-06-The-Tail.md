# Speed 06: the tail of a pass, ordered by an estimated cost

Playbook: `2026-10-11-Speed-W22` (W22). Agent: pyrrhic. Project: `/home/remi/projects/pyrrhic-totalbattle`.
Plan: `docs/plans/next-speed.md` §1 step 6. Rules: top of `SPEED-01-Baseline-And-Gate.md`. Gate:
`.maestro/playbooks/Working/w22/gate.sh`, plus `.maestro/playbooks/Working/w18/passes.mjs` (BUDGET=ms prints the cut
probe ids).

**Why last.** It is the most complex step. The 10-07 export's "other" pass has 14.6 s of CPU (2.4 s at 6 workers)
and takes 2.8 s; on the owner's live account one probe took 5.2 s and ran alone for most of the last 2.9 s of a
6.9 s pass (dev trace). SPEED-01's job timings on the 10-11 export give the real size.

**What the owner wants (2026-10-11).** P1.3 (`w18-p13-longest-first`) ordered by each probe's time **from the last
run**, so the first run kept list order; it was dropped. The owner prefers **an estimate of each job's duration
relative to the others, computed from its inputs before it runs**, so the jobs are ordered longest first from the
very first Generate. Only the order matters: the estimate need not be in ms, it must **rank** the jobs well.

**What it may and may not change.** With no clock binding, answers are merged by probe index, so they are
identical whatever the order (advisor golden, browser hash). When the pass clock binds (a slow device), the cut
probes are a tail of the start order, so a new order cuts a different set: that is still a trade, shown to the
owner with figures at the HITL below. The estimate must be a **pure function of the job's inputs** (no timing,
no history, no device) so a given account always gets the same order and the same cut set on a given device.

## Tasks

- [ ] Find what drives a job's cost. From SPEED-01's `Working/w22/job-times-1011.json` and `job-times-1007.json`,
  plus the same timings on the benchmark armies (the 18 scenarios of `tests/engine/plan-scenarios.ts`, run through
  the advisor in-process, one lane, `Working/w22/job-times-bench.json`), read which input features explain a job's
  total ms: its plan input (stack types fielded, the three capacities, hired types, horizon, marches), the bar's
  stops, whether the probe changes the troop set, the job kind (probe, captains screen, confirm trio, baseline).
  Write in Notes the 3 longest jobs of the 10-11 export, what they ask, and which features set them apart. No code.

- [ ] Write the estimate. `src/worker/jobCost.ts`: `estimateCost(job: ProbeInput | …): number`, a relative cost
  from the features above, kept simple (a product or sum of a few terms with fitted exponents or weights, written
  as constants with a comment saying where they were fitted), cheap (well under 1 ms a job, computed on the main
  thread before dispatch), and pure. Fit it on the 10-11 export and the benchmark armies; **hold out the 10-07
  export** to check it. Report in Notes and in a theory file `tools/theorycraft/207-the-job-cost.test.ts`
  (`THEORY=1`, output `tools/theorycraft/out/207-the-job-cost.md`), per fixture and per pass:
  - Spearman ρ between estimate and measured ms;
  - whether the measured top 3 are in the estimated top 6;
  - the simulated wall at 6 workers (and 3) of list order, estimated-longest-first and **measured**-longest-first
    (the ideal), from the measured job times: how much of the ideal's gain the estimate recovers.
  Unit tests for `estimateCost` (monotone in each feature it uses, deterministic). Commit:
  `Worker: a relative cost estimate per advisor job, fitted (W22, experiment 207)`.

- [ ] Order the passes by it, on a branch `w22-cost-order`. Reuse the order plumbing of `w18-p13-longest-first`
  (`src/worker/jobOrder.ts`: `longestFirst`, `mapInOrder`, answers and `onSettled` indices back in the caller's
  order), but take the costs from `estimateCost` only, never from past times. Apply it in `runAdvisor` (the baseline
  first, then probes longest first) and `runCaptainAdvice` (confirm trios), and in `runCaptainUpgrades` if 207
  shows its jobs vary. Answers identical with no clock: advisor golden on three lanes, worker tests, browser hash
  (5 s clock and none). Measure the four passes (`passes.mjs`, min of 3) before and after on both exports and record
  them beside 207's simulated walls. Then `passes.mjs` with `BUDGET=2000` and `BUDGET=3000`, before and after, on
  the 10-11 export, and diff the cut ids: write in Notes which rows a slow device gains and loses.

- [ ] Optional, only if 207 shows one job alone sets the end of a pass even when started first (its time above the
  pass's CPU / workers): split it, on a branch `w22-tail-split`. If that probe's own Tight pricings (`shownMarch` per
  stop) are a large part of it, price them as separate pool jobs after its plan, as P1.2 split the probe job
  (`ProbeInput.shown`, `src/worker/jobs.ts`, `src/worker/advisor.ts`); merged by probe index and stop. Same
  measures and cut-set diff. Otherwise tick with the figure that rules it out.

<!-- MAESTRO:HITL reason="Ordering by the estimated cost changes which probes a slow device cuts when the pass clock binds. Read SPEED-06 Notes (207's ranking quality, wall gained per export, cut-set diffs at 2 s and 3 s). Merge w22-cost-order (and w22-tail-split if built) into main and tick, or tick to drop" -->
- [ ] Human step: merge `w22-cost-order` (and `w22-tail-split` if built), or drop.

- [ ] If merged: gate, fill "after 6" in `docs/plans/next-speed.md` §3 (production split harness ×3 on the 10-11
  export), commit the doc: `W22: the tail measured`. Otherwise write "dropped by the owner" in the plan and tick.

## Notes
