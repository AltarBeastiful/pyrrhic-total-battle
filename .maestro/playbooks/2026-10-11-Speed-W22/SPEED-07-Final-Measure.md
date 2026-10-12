# Speed 07: the final measure

Playbook: `2026-10-11-Speed-W22` (W22). Agent: pyrrhic. Project: `/home/remi/projects/pyrrhic-totalbattle`.
Plan: `docs/plans/next-speed.md` §3. Rules: top of `SPEED-01-Baseline-And-Gate.md`. Gate:
`.maestro/playbooks/Working/w22/gate.sh`.

## Tasks

- [x] Full gate on HEAD, all PASS (record times in Notes). `pnpm build`, then `grep` `dist/` for the census and
  shadow names added in this playbook (`KILL_CHECK`, the rating census counters, any `isDefined(CENSUS)` site): none
  may appear in the release build.

- [x] Production split harness ×3 on both timing fixtures (release kernel), answer hash unchanged; experiments 197
  and 184 in-process. Fill the last column of `docs/plans/next-speed.md` §3 and write a "Reading it" paragraph: what
  each step bought, measured where it was measurable, and which steps were `WON'T DO` with their figures.

- [x] A production trace for the next round: `VITE_PROFILING=1 pnpm build && pnpm preview --port 4173 --strictPort`,
  then `PYRRHIC_TRACE=1 pnpm exec playwright test e2e/profile-trace.spec.ts`, and
  `python3 tools/perf-trace/analyse.py .maestro/playbooks/Working/w18/trace-prod.json.gz > Working/w22/trace-final.md`.
  Note the five largest kernel and JS self times in the plan as the next candidates.

- [x] Update the plan's status line to done with the date and HEAD. Commit: `W22: final measure`.

## Notes

- Gate on HEAD 9f30a45, all PASS: kernel:build 3 s, typecheck 0 s, lint 25 s, test 322 s, plan-benchmark 164 s,
  benchmark diff 0 s, exp 184 114 s. `dist/` grep: none of `KILL_CHECK`, `cKillOrders`, `cRatings`, `CENSUS`,
  `killOrderCheck` in any `.js` or the wasm (only W18's `raiseCensus` / `sizerCensus` release stubs).
- Production ×3: 10-11 11 742 ms, 63.6–64.6 s CPU, hash `a9c9defd5d22` present (two hashes printed, as in the
  baseline); 10-07 10 986 ms, 57.4–58.3 s, `a9612b9ca0a9`. Exp 197 (10-11): plan CPU 1 030 → 879 ms. Figures and
  "Reading it" in `docs/plans/next-speed.md` §3. Files: `Working/w22/prod-final-*.txt`, `197-final.md`, `184-final.md`.
- Trace: `Working/w22/trace-final.md` (on the exactness fixture, as the spec loads it); next candidates in the plan.
