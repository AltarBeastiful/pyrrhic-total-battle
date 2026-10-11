# Drill 06: The page, then the final measure

Playbook: `2026-10-10-Profile-Drilldown` (W18). Agent: pyrrhic. Project: `/home/remi/projects/pyrrhic-totalbattle`.
Plan: `docs/plans/profile-drilldown.md` §0.4. Rules: top of `DRILL-01-Measure-And-Census.md` in this folder. UI work
follows `docs/design-rules.md`.

**Deferred (owner, 2026-10-11):** run this drill only after Drill 05. Its figures depend on how much planner work
remains after the owner's planned cuts, so measuring the page now would measure a set of calculations that is about to
change.

In the dev trace the main thread was always busy, but a third of that was React's dev-only Performance Tracks
(`logComponentRender` → `performance.measure`), and layout and paint were not recorded. What looked real: one full
re-render of the advisor card per settled probe (`AdvisorCard` 93 renders, about 28 600 Mantine `Box` renders). This
phase first measures a production build, then fixes only what that shows.

## Tasks

- [x] Measure the page on a production build. Build with `VITE_PROFILING=1 pnpm build`, serve with `pnpm preview`, and
  with Playwright (the repo's e2e setup; see `playwright.config.ts`) load the exactness fixture's profile, press the
  "Profile everything" button (`src/ui/sections/march/ProfileAllButton.tsx`), and record a Chrome trace through CDP
  (`Tracing.start` with categories `devtools.timeline,blink.user_timing,v8.execute,disabled-by-default-v8.cpu_profiler`).
  Save it to `.maestro/playbooks/Working/w18/trace-prod.json.gz` and run `tools/perf-trace/analyse.py` on it (extend
  the tool if it cannot read JSON traces; Perfetto's trace processor can). Add a table of main-thread time by
  category: scripting (React render and commit, by component), style, layout, paint, idle, during each phase. Save it
  in Notes and as `tools/theorycraft/out/198-the-page-in-production.md`. Commit the script as
  `e2e/profile-trace.spec.ts` (skipped unless `PYRRHIC_TRACE=1`). Commit: `Experiment 198: the page in production`.

- [ ] If 198 shows the main thread busy more than 20 % of a phase, coalesce the advisor's updates. `onProgress` and the
  row results of `computeAdvice`, `computeCaptains` and `computeOther` (`src/ui/sections/march/advisorSearch.ts`,
  `captainSearch.ts`, `otherSearch.ts`) update the store once per settled job. Batch them to at most one store update
  per animation frame, and the rows once per pass. Then memoise the row components (`AdvisorRowLine`, `StopList`,
  `MarchCost`, under `src/ui/sections/march/`) on row identity, so a new answer re-renders only what changed.
  Otherwise tick with the 198 figures and `WON'T DO`. Unit tests and e2e green (`pnpm build` first). Re-run 198 and
  record before and after. Commit: `Advisor card: one render a frame (W18 P4)`.

- [ ] Final measure. On HEAD: experiment 196 (timings and hits), 197, 198, experiment 190 (pool wall per pass), and the
  benchmark timing table (`pnpm vitest run tests/engine/plan-benchmark.test.ts` alone; restore the owner's benchmark
  files after, from `.maestro/playbooks/Working/w18/benchmark-pre-w18.*`). Fill `docs/plans/profile-drilldown.md` §3
  and replace §4's estimates with measured figures. Append an entry to the performance log
  `.maestro/playbooks/PERF_LOG_pyrrhic_2026-10-09.md` (same format as its existing entries) summarising W18. Set the
  plan's status line to "done" with the date. Commit: `W18: final measure`.

## Manual Follow-Up (not executed by Auto Run)

- Owner: record one more "Profile everything" trace on the real account with `pnpm dev:profile` and compare it with
  the first (`tools/perf-trace/analyse.py old new`).
- Owner: the trades left for decision, if any were found (P2.5 warm start of a probe's Tight search from the
  baseline's answer; longest-first changing the cut set on a slow device). They are listed in the Notes of Drills 02
  and 03 and are not built by this playbook.

## Notes

### Experiment 200, the page in production (2026-10-11, HEAD 065d364)

**Numbering:** this drill's "198" is experiment **200** (`198-the-boundary` and `198b-the-glue` are Drill 04b's,
199 is reserved by backlog B-08). Read "198" in the tasks below as 200: `tools/theorycraft/out/200-the-page-in-production.md`.

Run: `VITE_PROFILING=1 pnpm build`, `pnpm preview --port 4174` (4173 was held by a preview running since
2026-10-10, left alone), `PYRRHIC_TRACE=1 PYRRHIC_TRACE_URL=http://127.0.0.1:4174 pnpm exec playwright test
e2e/profile-trace.spec.ts` (~16 s), then `python3 tools/perf-trace/analyse.py <trace>.json.gz`. Three runs:
`Working/w18/trace-prod{,-2,-3}.json.gz`, tables in `Working/w18/200-analyse{,-2,-3}.md`.

`analyse.py` could not read the JSON trace's samples (Perfetto imports its slices, not its `ProfileChunk`s, and
the frames are minified), so it gained a stdlib-only JSON path (`tools/perf-trace/chrome_json.py`): frame names
from the build's source maps (read off the original source, so React's pre-minified bundle resolves too), and two
tables, 5 (main-thread own time by category per phase) and 6 (React render by component, commit, other JS). The
Perfetto path is unchanged: re-run on the owner's first trace, identical to `trace-0-baseline.md`.

Main thread, busy share of each phase (union of its trace events; idle = the rest):

| phase | run 1 | run 2 | run 3 | scripting / GC / style / layout / paint, run 1, ms |
|---|---:|---:|---:|---|
| generate | 23.7 % | 22.5 % | 22.8 % | 83 / 0 / 8 / 34 / 12 |
| upgrades-default | 10.7 % | 9.9 % | 9.4 % | 181 / 21 / 10 / 16 / 126 |
| captains | 29.4 % | 28.1 % | 28.6 % | 360 / 17 / 4 / 6 / 48 |
| other | 40.4 % | 40.5 % | 38.6 % | 761 / 36 / 5 / 20 / 98 |
| the run (wall 7.9 / 9.4 / 10.5 s) | 23.8 % | 22.9 % | 22.6 % | 1 385 / 74 / 26 / 77 / 283 |

- **Over the 20 % bar in captains and other** (and generate, which is the plan's own render, not the advisor):
  the next task's coalescing applies.
- The cost is scripting, mostly React: render 899 ms, commit 168 ms of 1 990 ms sampled (run 1). Style 26 ms and
  layout 77 ms over the run: P4.3 (fewer `Box` wrappers for layout's sake) is not called for.
- Render by component: Mantine's `_Box` / `factory` / `polymorphicFactory` 725 of 899 ms; ours `AdvisorRowLine`
  21, `Figure` 18, `MarchCost` 16, `StopList` 9 ms. Captains and other render 248 and 507 ms against 92 ms for
  upgrades-default, with fewer probes.
- Pool: 93.5 % of its CPU is `planCampaign` (re-typing, `retypeRow`, 35 % of `runProbe`); the Tight raise is
  1.0 % on this fixture (the owner's 49 % was the timing fixture, dev build, before Drills 02–05).

