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

- [ ] Measure the page on a production build. Build with `VITE_PROFILING=1 pnpm build`, serve with `pnpm preview`, and
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
