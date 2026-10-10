# Drill 01: Make the drill-down repeatable, pin the answers, count the cache hits

Playbook: `2026-10-10-Profile-Drilldown` (W18). Agent: pyrrhic. Project: `/home/remi/projects/pyrrhic-totalbattle`.
Plan: `docs/plans/profile-drilldown.md` (read §0 first: it holds the measured figures from the owner's trace).

## The rules of the whole playbook

- **Nothing moves but the clock.** Every plan, stop, position row, advisor row, `scored` count and benchmark figure
  must stay byte-identical. A change that moves any reading is a *trade*: stop, write it in Notes, and leave it for
  the owner. Never re-base a pin or a golden.
- **No cache without a census.** A cache is only built after this phase has counted, on real data, how often it
  would be hit and what each hit saves. Refactors that keep the answers exact may come before that.
- `scored` (the raise search's "vectors asked" counter) is pinned in `tests/golden/raise*.json`. New counters are
  added beside it; it is never changed.
- Do not stage `tools/theorycraft/out/benchmark-latest.*` unless a task says so, `todos.md`,
  `.maestro/playbooks/performance-optimization/`, or any `pyrrhic-my-account-*.json` at the repo root (personal data).
- Scratch output goes to `.maestro/playbooks/Working/w18/`.

## The two fixtures

- **Exactness fixture** (committed): the owner's export `tests/fixtures/pyrrhic-my-account-2026-09-17 (2).json`, read by
  `ownerProfile()` in `tests/engine/plan-scenarios.ts`. Experiments 190 to 195 run the advisor on it in-process
  (`createInlineClient` from `src/worker/client.ts`, `createCalcPool` from `src/worker/pool.ts`; see
  `tools/theorycraft/194-the-other-questions.test.ts` for the pattern).
- **Timing fixture** (the account the owner profiled, not committed): `pyrrhic-my-account-2026-10-07.json` at the repo
  root. Read it only when present; never copy it into the tree.

## Tasks

- [x] Commit the trace analysis as a tool. Create `tools/perf-trace/analyse.py` (Python 3, standard library plus the
  `perfetto` and `pandas` packages) that takes a `.pftrace` or `.pftrace.gz` path and prints four Markdown tables:
  (1) the `pyrrhic:*` phase slices (wall ms) with the `job:*` slices inside each (count, CPU sum, min/avg/max, how
  many tracks were busy, idle share = 1 − CPU / (wall × tracks)); (2) pool-worker CPU from
  `cpu_profile_stack_sample` on the threads whose samples contain `timedJob`, split by whether the stack contains
  `positionTrades` (Tight raise), `planCampaign`, else other, and within each by leaf kind (`kernel/` wasm, JS,
  unnamed, `(garbage collector)`); (3) an inclusive-time call tree under `runProbe`, depth 7, frames ≥ 1 %;
  (4) the same for the main thread (the `CrRendererMain` sampler, the thread whose samples contain
  `performWorkUntilDeadline`). Inclusive time walks `stack_profile_callsite.parent_id`. Use
  `perfetto.trace_processor.TraceProcessor`; if `~/.local/share/perfetto/prebuilts/trace_processor_shell-*`
  exists, pass it as `bin_path`. Add `tools/perf-trace/README.md` (how to install into a venv, how to run, what each
  table means). Run it on `/home/remi/Downloads/chrome-202696-18048.pftrace.gz` if that file exists and save the
  output as `.maestro/playbooks/Working/w18/trace-0-baseline.md`; check the totals match §0.1 of the plan
  (23.1 s wall, about 106 s pool CPU, Tight raise about 49 % of pool CPU). Commit: `Add the perf-trace analysis tool (W18 P0.1)`.

- [x] Pin the advisor's answers before anything moves. Write `tests/kernel/advisor-golden.test.ts`, in the style of
  `tests/kernel/golden-capture.test.ts` (with `CAPTURE=1` it writes, otherwise it compares). It runs, in-process on
  the exactness fixture (`ownerProfile()`; skip the test when it returns null): `runGenerate`'s plan for the
  fixture's setup, then the three advisor passes the profiling run makes (`src/ui/sections/march/profileRun.ts`:
  `computeAdvice('default')`, `computeCaptains`, `computeOther`), or their worker-level equivalents (`runAdvisor`,
  `runCaptainAdvice`, `runCaptainUpgrades` in `src/worker/`) when the UI functions need the stores. Store every
  row, every stop, every gain, every `ShownMarch` (counts, bill, deaths), the baseline bars and the `cut`/`failed`
  lists in `tests/golden/advisor.json`. Pass no clock: assert every `cut` list is empty, so the answer cannot
  depend on machine speed. Capture on HEAD, then run it twice in compare mode to prove it is deterministic.
  Note its run time in Notes. Commit: `Pin the advisor passes on the owner fixture (W18 gate)`.

- [x] Record the gate's own baseline. Copy the working-tree `tools/theorycraft/out/benchmark-latest.json` and `.md`
  to `.maestro/playbooks/Working/w18/benchmark-pre-w18.*` (they carry uncommitted changes of the owner; they must be
  restored from this copy after every gate run). Then run, and record pass/fail and time of each in Notes:
  `pnpm kernel:build`, `pnpm typecheck`, `pnpm lint`, `pnpm test` (it includes the golden-capture compare and the
  new advisor golden), `pnpm vitest run tests/engine/plan-benchmark.test.ts` alone (then diff the regenerated
  `benchmark-latest.json` against `git show HEAD:tools/theorycraft/out/benchmark-latest.json` ignoring timing and
  stamp fields; save the diff command as `.maestro/playbooks/Working/w18/bench-diff.sh`), and
  `pnpm vitest run tools/theorycraft/184-the-positions-on-the-kernel.test.ts`. Write the full gate as a script,
  `.maestro/playbooks/Working/w18/gate.sh`, that every later phase runs. Restore the two benchmark files afterwards.

- [x] Add census counters to the kernel's raise search, profile build only. In `kernel/assembly/index.ts`, beside
  `rScored`, count per raise call: `rBattles` (calls to `raiseScore`), `rRatings` (calls to `raiseRating`),
  `rRatingsOnHit` (calls to `raiseRating` from a memo hit, lines around `raisePointSlots` and the
  `raisePointWhole` twin near line 2256), `rKillOrders` (calls to `killOrderBy`, split by caller: score, rating,
  sizer). Expose them through a new export (do not widen the pinned stats block read by `src/kernel/raise.ts`, or
  widen it only at the end and keep `scored` at index 2). Gate them so the release build compiles them out or they
  cost nothing (an AssemblyScript global flag set by the `profile` target in `kernel/asconfig.json`, or a cheap
  always-on counter if a flag is not possible; measure `pnpm kernel:bench` before and after and record it).
  Read them in `src/kernel/raise.ts` into an optional `census` field, absent in release. Run the gate script; the
  goldens must not move.

- [x] Add census counters to the JS layer, profile build only (behind `DEEP_PROFILING` from `src/worker/jobTiming.ts`).
  Count, per job: in `runProbe` (`src/worker/jobs.ts`) the `show` calls, the hits of its `read` map, and for every
  `shownMarch` a key of (request fingerprint, `countsKey(counts)`) where the request fingerprint is a stable hash
  of the elite request's JSON. Report the keys with the job's timing message so the page can see repeats **across
  jobs** (same key priced in two probes, or in the baseline and a probe) and across passes. Also report the
  baseline input key of each pass (`runAdvisor` in `src/worker/advisor.ts`, `runCaptainAdvice` in
  `src/worker/captainAdvice.ts`): a stable hash of the `settings` sent to the baseline job. And in
  `src/ui/sections/march/generate.ts`, the keys (request fingerprint, counts) of the Tight pricing `client.positions`
  does for the bar, so overlap between Generate and the advisor baselines can be counted. No answer may change;
  run the gate script.

- [x] Run the census as experiment 196. Create `tools/theorycraft/196-the-cache-census.test.ts` (style of experiment
  194) that runs the same work as the profiling run on the exactness fixture, in-process, single worker, with the
  kernel census on (build with `pnpm kernel:build:profile` first; rebuild release with `pnpm kernel:build` after).
  If `pyrrhic-my-account-2026-10-07.json` is at the repo root, run it on that account too (path from an env var,
  default that file; skip when absent) and report both. Write `tools/theorycraft/out/196-the-cache-census.md` with,
  for each candidate cache below: entries stored, total hits, hits per entry (mean, median, max), the measured cost
  of one miss (time the call it would replace, median of the real calls), and the **projected saving** = hits ×
  miss cost, as ms and as a share of the run's total CPU. Candidates:
  - **K1 rated value memo**: inside one raise search, a memo hit under `rRated` still calls `raiseRating`
    (`killOrderBy` + `recoveryOf` + `raiseBurn`). Entries = distinct vectors rated; hits = `rRatingsOnHit`.
  - **K2 shared kill order**: on a memo miss under `rRated`, `raiseScore` and `raiseRating` both call
    `killOrderBy(types, rRows, …, T_ORDER)` on the same vector. Not a cache: count the duplicated calls.
  - **K3 `shownMarch` across jobs**: same (request, counts) priced in more than one job on the same pass or run.
  - **K4 baseline across passes**: identical baseline settings in the default, captains and other passes.
  - **K5 Generate ↔ baseline**: Tight pricings Generate already did that the advisor baseline repeats.
  - **K6 sizer's two journals**: in `sizerScore` (`kernel/assembly/index.ts` near line 748) and the twin near line
    371, `journalDamage(k, false)` and `journalDamage(k, true)` share `killOrderBy` and `attackOrderOf`; count the
    calls and time the shared part (a fusion candidate, not a cache).
  Also report, for the raise searches of the run: scored, distinct vectors, battles, ratings, kill orders, and the
  share of the rated searches' time spent in `raiseRating`. Run it, commit the test and the report:
  `Experiment 196: the cache census (W18 P0.3)`.

- [x] Write the census verdict. In `docs/plans/profile-drilldown.md`, add a section `## 5. The census (experiment 196)`
  with one row per candidate K1 to K6: projected saving, hits per entry, and a verdict by this rule, written in the
  section: **a cache is built only when it is hit on average at least twice per stored entry and its projected saving
  is at least 3 % of the run's CPU on either fixture**; a refactor (K2, K6) is done when it saves at least 2 %.
  Everything else is `WON'T DO` with its figures. Copy the verdicts into Notes below, since later phases read them
  from here. Commit: `W18: census verdicts`.

## Notes

(Each task writes its results here: figures, gate times, verdicts K1 to K6.)

### P0.1 trace tool (2026-10-10)

- `tools/perf-trace/analyse.py` + `README.md`. Run with the existing venv `/tmp/pfvenv/bin/python` (perfetto + pandas;
  rebuild it per the README if /tmp was cleared); it picks up
  `~/.local/share/perfetto/prebuilts/trace_processor_shell-55ba613fc6d4f71d`. ~9 s on the 100 MB trace.
- Output on the owner's trace: `.maestro/playbooks/Working/w18/trace-0-baseline.md`. **Matches §0.1**: phases 956 /
  7 021 / 8 312 / 6 860 ms = **23 149 ms** wall; pool CPU (job slices) **106.3 s**; Tight raise **49.1 %** of busy
  pool samples, planCampaign 47.5 % (JS 29.2, wasm 12.7, unnamed 5.5), GC 2.7 %. Idle share: upgrades 15.2 %,
  captains 22.7 %, other 23.9 %; generate ran all 5 jobs on 1 track.
- Differences from the hand analysis: the tool finds **7** pool samplers (utid 58 also runs `timedJob`; the plan used
  6), so busy samples are 508 k, not 503 k. Table 2 gives shares only: the median sample gap is ~170 µs and V8
  samples unevenly, so samples × gap (86 s) under-reads the slice CPU (106 s). Table 4 is rooted at the main
  thread's `(root)`: `(program)` 47.8 %, as in §0.4.

### W18 gate: the advisor golden (2026-10-10)

- `tests/kernel/advisor-golden.test.ts` → `tests/golden/advisor.json` (762 KB). Worker-level calls, not the UI
  functions (they run under the 20 s clock): `client.plan` with no `budgetMs`, the bar's 5 Tight tables
  (`client.positions` per stop, elite request), `runAdvisor` × 29 generic probes, `runCaptainAdvice` +
  `runCaptainUpgrades` on the lead trio, `runAdvisor` × `otherProbes` (17). Each pass gets `budgetMs: 1e9`
  (`Infinity` would make `setTimeout` fire at once); every `cut` list and `screenCut` is asserted empty.
- Fixture facts: 5 stops, opening at index 2 (sweet spot); the owner owns 3 captains, so the trio screen has
  **1** trio (the current one), 0 confirmed rows, 9 upgrade rows; no typed upgrades, so no `upgrades-mine`.
- Golden helpers moved to `tests/kernel/golden-io.ts` (shared with `golden-capture.test.ts`, which still passes).
- **Run time ~27 s** (one inline lane, in-process): capture 27.0 s, compare 27.1 s and 26.2 s — both compares
  pass, so the pin is deterministic.


### W18 gate: the baseline run (2026-10-10)

- The owner's uncommitted `benchmark-latest.{json,md}` (timings and the `run` stamp only, 19 × planMs/planCpuMs/searchMs)
  are copied to `.maestro/playbooks/Working/w18/benchmark-pre-w18.*`; `gate.sh` copies them back on exit (trap, also
  on SIGTERM), and the files were byte-checked restored after both runs.
- **`gate.sh`** (`bash .maestro/playbooks/Working/w18/gate.sh`, ~13 min, run it with a ≥ 15 min timeout or
  `nohup … &`): steps below, one line each to `gate-<stamp>.log.summary`, full output in `gate-<stamp>.log`, exit 1 if
  any step fails. **`bench-diff.sh`**: `jq -S` both sides with `run`, `planMs`, `planCpuMs`, `searchMs` deleted
  (`planBudgetMs`/`searchBudgetMs` are config and kept), then `diff`; empty output = identical.
- Baseline on HEAD e2c5437, all **PASS**:

  | step | result | time |
  | --- | --- | --- |
  | `pnpm kernel:build` | PASS | 3 s |
  | `pnpm typecheck` | PASS | 1 s (tsc -b incremental) |
  | `pnpm lint` | PASS | 20 s |
  | `pnpm test` (incl. golden-capture + advisor golden) | PASS, 143 files / 1 763 tests, 177 files skipped | 295 s (314 s on run 2) |
  | `plan-benchmark.test.ts` alone | PASS, 20 tests | 170 s |
  | `bench-diff.sh` vs HEAD | PASS, no difference | 0 s |
  | `184-the-positions-on-the-kernel` | PASS (with `THEORY=1`) | 143 s |

- Two traps found and handled in the script: (1) experiment 184 is `describe.skipIf(!process.env.THEORY)`, so the
  plain command only *skips*; the gate sets `THEORY=1`. (2) 184 rewrites its committed report
  `tools/theorycraft/out/184-the-positions-on-the-kernel.md` (+ `184-timings.json`): the committed copy dates from
  2026-10-01, before Tight by rating (1cb2ac9, 2026-10-07), so its Tight rows differ from a fresh run (e.g. tiers 3–5
  camp sweet-spot Tight 24,423,790 committed vs 23,620,690 now). That is a stale artefact, not a W18 move — the test
  holds the kernel to its golden and passes. The gate snapshots both files and puts them back; do not re-base them.
- The advisor golden alone: 27.1 s, passes (it runs inside `pnpm test`; it is not skipped).

### P0.2a kernel census counters (2026-10-10)

- **Flag**: the `profile` target in `kernel/asconfig.json` now has `"use": ["abort=", "CENSUS=1"]`; the kernel guards
  every count with `if (isDefined(CENSUS))`, a compile-time fold. The release wat differs from HEAD's by **one
  function only**: the new export `raiseCensus` returning 0 (plus type renumbering) — no global, no instruction in
  any hot path. Profile wasm 37 KB (debug info), release 29 KB.
- **Counters** (`kernel/assembly/index.ts`, beside `rScored`, reset at the top of each `raise()`): `cBattles`
  (`raiseScore` calls), `cRatings` (`raiseRating`), `cRatingsOnHit` (the two memo-hit paths: `raisePointSlots` and
  `raisePointWhole`), `cKillOrdersScore`, `cKillOrdersRating` (includes the plan's own bill read once before a
  `Tight` search), `cKillOrdersSizer` (`sizerScore` + `buildStacks`; instance total, **never reset** — the sizer runs
  in the plan instance, not in a raise instance, so experiment 196 reads it as a difference). Every count includes
  the plan's own march (one battle, one bill) rated before a `Tight` search.
- **Read**: new export `raiseCensus(ptr)` → `f64 × 6` `[battles, ratings, ratingsOnHit, killOrdersScore,
  killOrdersRating, killOrdersSizer]`, 1 on profile / 0 on release. The pinned stats block `[how, space, scored,
  answered]` is untouched. `src/kernel/raise.ts` adds `census?: RaiseCensus` (type in `src/engine/fast.ts`) to the
  `RaiseAnswer` only when the build counts; a release answer has no `census` key.
- **Test** `tests/kernel/raise-census.test.ts` (5 s; compiles the profile target to a temp dir): on every criteria
  army × `v2`/`safe`/`tight`, the profile kernel's answer equals the release one exactly (counts, how, space,
  scored), release has no census, `killOrdersScore == battles`, `ratingsOnHit ≤ ratings`, Tight
  `killOrdersRating == ratings + 1`, non-Tight rates nothing, and Tight memo hits occur.
- **`pnpm kernel:bench`** (battleMany, not raise; release): before 1 047 337 / 369 048 battles/s, after
  1 076 158 / 353 278 — noise (the release code paths are identical).
- **Gate** (`gate-20261010-193850.log.summary`), all **PASS**: kernel:build 2 s, typecheck 1 s, lint 20 s,
  `pnpm test` 298 s, plan-benchmark 164 s, bench-diff vs HEAD no difference, 184 143 s. Goldens unmoved. Note: a
  gate run killed by a tool timeout (10 min) did **not** restore `benchmark-latest.*` (the trap did not fire);
  restored by hand from `benchmark-pre-w18.*` — always run the gate with `nohup … &`.

### Owner's steering (2026-10-10, 19:25) — applies to the rest of W18

- *"If we add code for profiling it should not be present when we disable it in production and avoid cluttering
  the code too much."* Every profiling hook must fold out of `pnpm build` (check the `dist/` bundle for a string
  of the new code, not just the source), and a hot function gets at most a line or two; the logic lives in a
  profiling module (`src/worker/census.ts`, `src/worker/jobTiming.ts`).
- Found doing so: Rolldown folds a module's **own** constant before it splits chunks, but an **imported** one
  (`DEEP_PROFILING`, `CENSUS`) only at minify time, after the chunks are linked — a helper the lazy `profileRun`
  chunk imports from the main chunk stays exported (dead) in production. Hot paths in one chunk fold fine; for a
  cross-chunk use, read the env in the module itself (`COUNTING` in `profileRun.ts`).

### P0.2b JS census counters (2026-10-10)

- **`src/worker/census.ts`** (new): `CENSUS` = dev / `VITE_PROFILING=1` / Vitest; folds to `false` in a production
  build. Code writes notes (`noteCensus(() => note)`, built only when someone listens); a listener is
  `startCensus()` → `stop()` (nests). Notes: `probe` (per `runProbe` job: `shows`, `hits` of its `read` map,
  `priced: {key, ms}[]` with key = `stableKey(elite request)|countsKey(counts)` and the measured cost of that
  `shownMarch`), `baseline` (`pass: advisor | captains`, `stableKey(settings)`), `bar` (Generate's Tight pricing
  keys: every stop on a worker client, the chosen one inline). `stableKey` = cyrb53 of sorted-key JSON.
  `summariseCensus(notes)` → jobs, shows, readHits, priced, distinctPriced, repricedAcrossJobs (+ ms, K3),
  baselines / repeatedBaselines (K4), barPricings / barRepricedByProbes (K5).
- **Hooks**: `runProbe` one line (`show = CENSUS ? countShows(…, showOnce) : showOnce`); `runAdvisor` and
  `runCaptainAdvice` one `if (CENSUS) noteCensus(…)` each before the baseline job; `generate.ts` one block before
  the bar's pricing. `countsKey` is now exported from `jobs.ts` (Generate uses it for the key).
- **Transport**: `timedJob` listens for the job's length and `reportTiming` adds `census` to the job's
  `JobTiming` message when non-empty; the profiling run listens on the page for its whole length, merges page and
  worker notes, prints `console.table(census)` and puts `census` on `pyrrhicProfile`.
- **Production bundle checked**: `pnpm build` → no `repricedAcrossJobs` / `summariseCensus` / `priced:[]` in any
  `dist/assets/*.js` (main, lazy `profileRun`, `calc.worker`); `VITE_PROFILING=1 pnpm build` has them.
- **Test** `src/worker/census.test.ts` (7 tests, ~1.4 s): stable key order-free, nesting listeners, counted show
  identical to plain and counts right, summary arithmetic, `runProbe` counted == uncounted, two `runAdvisor`
  passes on one input → 1 repeated baseline and every march re-priced across jobs.
- **Early finding for experiment 196**: a probe on a bonus line no unit reads still changes `request.totals`, so
  its request key differs and K3 as keyed (whole elite request) sees **no** repeat with the baseline even though
  the marches are identical. 196 should report K3 both ways (exact request key, and the key of the request with
  the probe's unread change normalised) or say the exact key under-counts.
- **Gate** (`gate-20261010-195829.log`), all **PASS**: kernel:build 3 s, typecheck 0 s, lint 21 s, `pnpm test`
  306 s, plan-benchmark 165 s, bench-diff vs HEAD no difference, 184 141 s. Goldens (raise, advisor) unmoved;
  `benchmark-latest.*` byte-checked restored.

### P0.3 experiment 196, the cache census (2026-10-10)

- `tools/theorycraft/196-the-cache-census.test.ts` → `tools/theorycraft/out/196-the-cache-census.md`
  (`THEORY=1`, ~85 s for both fixtures). The profile kernel is compiled to a temp dir (`loadProfileKernelModule`,
  now shared in `tests/kernel/load.ts` with `raise-census.test.ts`), so `kernel/build/kernel.wasm` is never
  swapped and no release rebuild is needed. Same work as the advisor golden (one inline lane, no clock, every
  `cut` asserted empty); the bar's 5 tables are priced one after the other so each is timed.
- How the costs are read: a raise call is timed around `position()`; job times by a timed lane; the sizer count
  from every kernel instance's `raiseCensus[5]` (WeakRef sweep after each job). A rating's cost is fitted over the
  Tight searches (ms = a + b·battles + c·ratings); on the exactness fixture the fit is not positive (tiny searches)
  and the trace share is used. K2/K6 split a cost with the trace's shares, measured by
  `.maestro/playbooks/Working/w18/k-shares.py` (raiseRating 38.4 % of Tight, its kill order 18.0 %; sizerScore
  0.40 % of busy pool CPU, its journals 0.25 %).
- **Figures** (run CPU in-process: exactness 34.0 s, timing 87.4 s):

  | candidate | exactness: hits / entry, saving | timing: hits / entry, saving |
  | --- | --- | --- |
  | K1 rated value memo | 0.05, 0.01 % | 0.59 (4.84 M hits / 8.22 M), 2.21 % |
  | K2 shared kill order | 7 369 dups, 0.09 % | 8.22 M dups, 1.76 % |
  | K3 exact key / kernel key | 0.14 → 0.12 % / 0.56 → 0.19 % | 0.07 → 0.97 % / 0.09 → 1.20 % |
  | K4 baseline × 3 passes | 2.00, **2.66 %** (452 ms × 2) | 2.00, 1.39 % (609 ms × 2) |
  | K5 exact / kernel key | 1.0 → 0.01 % / 22 → 0.14 % | 1.0 → 0.00 % / 8 → 1.05 % |
  | K6 sizer journals | 0.13 % ceiling | 0.13 % ceiling |

- **The surprise**: in-process the Tight raise is **13.3 %** of the timing account's CPU (0.55 % on the exactness
  fixture); in the owner's trace it was **49.1 %** of pool CPU. Same account, same 83 probes + 3 baselines. Not
  settled here; most likely the trace's wasm ran slower than in Node (DevTools profiling can keep wasm on the
  Liftoff tier, and `dev:profile` builds with debug info), so the trace over-weights every kernel cost. P0.4
  should check this before any kernel work is ranked on the trace's shares: time a worker job in the browser
  with no profiler attached.
- No commit-worthy production change: test-side only (`tests/kernel/load.ts`, `raise-census.test.ts` reuse).


### Census verdicts K1 to K6 (2026-10-10) — later phases read these

Rule: a cache only when hits per entry ≥ 2 **and** projected saving ≥ 3 % of run CPU on either fixture; a refactor
(K2, K6) when it saves ≥ 2 %. Full table: `docs/plans/profile-drilldown.md` §5.

- **K1 rated value memo — WON'T DO.** 0.05 / 0.59 hits per entry; 0.01 % / 2.21 %.
- **K2 one kill order per rated battle — WON'T DO** (in-process). 0.09 % / 1.76 % < 2 %. **Re-open** if a browser
  run without the profiler confirms the trace's 49.1 % Tight share: it scales to ≈ 5.6 %.
- **K3 `shownMarch` across jobs — WON'T DO.** 0.14 / 0.07 (exact), 0.56 / 0.09 (kernel key) hits per entry;
  ≤ 1.20 %.
- **K4 one baseline across passes — WON'T DO** as a cache. 2.00 hits per entry, but 2.66 % / 1.39 % < 3 %. Its cost
  is wall (serial heads): P1.2 (no serial head) recovers it. P1.1 dropped.
- **K5 Generate ↔ advisor — WON'T DO** (in-process). Exact key 1.0 per entry; kernel key 22 / 8 per entry but
  0.14 % / 1.05 %. **Re-open** with K2 if the trace's share holds (≈ 3.9 %).
- **K6 sizer journals fused — WON'T DO.** 0.13 % ceiling on both.
- No cache, no census refactor is built. P2.1 (incremental kill order) is not a census item and stays open.
