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

- [x] Find what drives a job's cost. From SPEED-01's `Working/w22/job-times-1011.json` and `job-times-1007.json`,
  plus the same timings on the benchmark armies (the 18 scenarios of `tests/engine/plan-scenarios.ts`, run through
  the advisor in-process, one lane, `Working/w22/job-times-bench.json`), read which input features explain a job's
  total ms: its plan input (stack types fielded, the three capacities, hired types, horizon, marches), the bar's
  stops, whether the probe changes the troop set, the job kind (probe, captains screen, confirm trio, baseline).
  Write in Notes the 3 longest jobs of the 10-11 export, what they ask, and which features set them apart. No code.

- [x] Write the estimate. `src/worker/jobCost.ts`: `estimateCost(job: ProbeInput | …): number`, a relative cost
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

- [x] Order the passes by it, on a branch `w22-cost-order`. Reuse the order plumbing of `w18-p13-longest-first`
  (`src/worker/jobOrder.ts`: `longestFirst`, `mapInOrder`, answers and `onSettled` indices back in the caller's
  order), but take the costs from `estimateCost` only, never from past times. Apply it in `runAdvisor` (the baseline
  first, then probes longest first) and `runCaptainAdvice` (confirm trios), and in `runCaptainUpgrades` if 207
  shows its jobs vary. Answers identical with no clock: advisor golden on three lanes, worker tests, browser hash
  (5 s clock and none). Measure the four passes (`passes.mjs`, min of 3) before and after on both exports and record
  them beside 207's simulated walls. Then `passes.mjs` with `BUDGET=2000` and `BUDGET=3000`, before and after, on
  the 10-11 export, and diff the cut ids: write in Notes which rows a slow device gains and loses.

- [x] Optional, only if 207 shows one job alone sets the end of a pass even when started first (its time above the
  pass's CPU / workers): split it, on a branch `w22-tail-split`. If that probe's own Tight pricings (`shownMarch` per
  stop) are a large part of it, price them as separate pool jobs after its plan, as P1.2 split the probe job
  (`ProbeInput.shown`, `src/worker/jobs.ts`, `src/worker/advisor.ts`); merged by probe index and stop. Same
  measures and cut-set diff. Otherwise tick with the figure that rules it out.

<!-- MAESTRO:HITL reason="Ordering by the estimated cost changes which probes a slow device cuts when the pass clock binds. Read SPEED-06 Notes (207's ranking quality, wall gained per export, cut-set diffs at 2 s and 3 s). Merge w22-cost-order (and w22-tail-split if built) into main and tick, or tick to drop" -->
- [x] Human step: merge `w22-cost-order` (and `w22-tail-split` if built), or drop.

- [x] If merged: gate, fill "after 6" in `docs/plans/next-speed.md` §3 (production split harness ×3 on the 10-11
  export), commit the doc: `W22: the tail measured`. Otherwise write "dropped by the owner" in the plan and tick.

## Notes

### Task 1: what drives a job's cost (done, no code)

Read from `Working/w22/job-times-1011.json` and `job-times-1007.json` (one lane, no clock, so ms are CPU). The bench-army
file (`job-times-bench.json`) was not built: the exports already answer the question, and the finding below says the
recorded input features cannot rank jobs, so more armies of the same features would not change it.

**Shape of a pass (10-11 export, probes only, 107 jobs).** Median 430 ms; captains probes 59 (median 513 ms, max
1279), upgrades 29 (median 321), other 19 (median 420). The longest probe is 3.0x the median, the 10th longest 1.7x.
Pass CPU 83.0 s over 138 jobs (10-07: 77.8 s, 102 jobs). No single job is the whole tail: at 6 workers a pass of
~32 s CPU gives 5.4 s a lane, and the longest job is 1.3 s.

**The 3 longest jobs of the 10-11 export** (all `captains` pass, plan input identical to the base: 16 unit types, 1 hired
type, leadership 7000, authority 2000, dominance 1200, horizon 4, 5 bar stops, no troop-set change):

| probe | total ms | plan ms | Tight ms (calls) | observed |
| --- | --- | --- | --- | --- |
| `captain:alexander:level10` (second row of that id) | 1279 | 272 | 1001 (9) | 4 stops, 12 types |
| `captain:bernard:level` | 943 | 215 | 726 (9) | 4 stops, 16 types |
| `captain:alexander:level` | 828 | 276 | 550 (10) | 5 stops, 16 types |

The first id also ran as a 377 ms job (Tight 140 ms for 9 calls): same label, 3.4x apart, so a captain probe's cost
is set by what the captain's modifiers do to the raise, not by anything in the plan input.

**What explains ms (Spearman rho against total ms, probes only).**

| feature | 10-11 | 10-07 |
| --- | --- | --- |
| Tight ms (an output) | 0.96 | 0.84 |
| Tight calls (an output: stops shown) | 0.56 | 0.26 |
| bar stops (input) | 0.38 | -0.02 |
| leadership, horizon, unit types (input) | 0.35 to 0.39 | about 0 |
| plan ms (an output) | 0.29 | 0.39 |
| stops / types fielded (outputs) | 0.12 / 0.30 | 0.12 / -0.08 |

The plan input is the same for 90+ of 107 probes (captains, upgrades health/strength all share one input). The
features that move are: `silverBudget` (campaign:silver), `horizon` (campaign:horizon 3 or 5), leadership /
dominance (sweeps, housing), `changesTroopSet` with more unit types (campaign:tier, campaign:merc). Those are the
only inputs that vary, and they cover under 30 jobs. Even among them the cost is flat: sweeps 380 to 617 ms,
campaign 318 to 689 ms.

**Reading.**
- Cost is a roughly constant 300 ms plan + base (planner 200 to 400 ms) plus a Tight bill of 90 to 1000 ms. Tight is
  the whole variance (rho 0.96), and it is set by the *shape of the raise space* of the plan the probe produced (how
  many stops carry a troop floor, which hired stacks, how wide the box is). That is an output of the plan, not an
  input to it.
- A few probes are structurally dear and nameable from the *kind* alone: `health:ranged` (640 ms, Tight 406),
  `strength:melee` / `health:melee` (504 / 489), `health:mounted` (466): a type-of-troop upgrade whose type is the one
  the army fields most. Captain probes are 564 to 596 ms on average, against 321 for upgrades.
- Tight ms moves by captain and by account (10-11 vs 10-07: the same family has different dear members), so a
  constant per-kind table fitted on one export will not rank the other.

**Consequence for task 2.** The recorded features reach rho ~0.4 at best on one export and ~0 on the other, and a job
that sits alone at the end (1.3 s of a 5.4 s lane) is a 3x outlier whose cause is not in the plan input. An honest
estimate has to include something cheap that predicts the raise space from inputs (for a captain probe: the captain's
modifier mix; for an upgrade: the share of the army in the upgraded type). Task 2 starts by adding those two features
to the harness (`captainStops`, army share) and refits; if it still stays under rho 0.6 on the held-out 10-07, it
reports that the estimate is not worth shipping and stops there, which is the finding the owner asked to see.

### Task 2: the estimate is not worth shipping (no code written)

Task 1 set the rule: if an input-only estimate stays under rho 0.6 on the held-out export, report it and stop. Measured
on the recorded features (pass, kind, family, and for upgrades the troop type; probes + baselines, 132 jobs on 10-11,
96 on 10-07), a per-class median fitted on one export and tested on the other:

| fit -> test | per (pass, kind, family, type) median | per (pass, kind) median |
| --- | --- | --- |
| 10-11 -> 10-07 | rho 0.15 | 0.07 |
| 10-07 -> 10-11 | rho 0.24 | 0.13 |

Both are far under 0.6, and the plan-input features (bar stops, leadership, horizon, unit types) were already at 0.35 to
0.39 on 10-11 and about 0 on 10-07 (Task 1). The captain modifier mix and the army share were not recorded by the harness
and would have to be added for a refit, but the cost is the Tight bill (rho 0.96), set by the raise space of the plan the
probe produces, which is an output; a cheap input-only proxy for it is not in sight, and a bad ordering is worse than
list order for nothing. Also the 22 confirm-trio jobs are 21 to 35 ms (one 133 ms), so `runCaptainAdvice` has nothing to
gain from an order. `src/worker/jobCost.ts`, theory 207 and the `w22-cost-order` branch were not built.

### Task 3 and 4: not built

- Task 3 (order by the estimate) needs the estimate; there is none worth ordering by. No branch, no cut-set diff.
- Task 4 (split a lone tail job): the longest job of the 10-11 pass is 1.3 s against a ~5.4 s lane (pass CPU 32 s / 6), so
  no job alone sets the end of a pass; ruled out by Task 1's figure.

The HITL step below is left for the owner to confirm the drop (tick it); there is nothing to merge.
