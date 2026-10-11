# Speed 07: the final measure

Playbook: `2026-10-11-Speed-W22` (W22). Agent: pyrrhic. Project: `/home/remi/projects/pyrrhic-totalbattle`.
Plan: `docs/plans/next-speed.md` §3. Rules: top of `SPEED-01-Baseline-And-Gate.md`. Gate:
`.maestro/playbooks/Working/w22/gate.sh`.

## Tasks

- [ ] Full gate on HEAD, all PASS (record times in Notes). `pnpm build`, then `grep` `dist/` for the census and
  shadow names added in this playbook (`KILL_CHECK`, the rating census counters, any `isDefined(CENSUS)` site): none
  may appear in the release build.

- [ ] Production split harness ×3 on both timing fixtures (release kernel), answer hash unchanged; experiments 197
  and 184 in-process. Fill the last column of `docs/plans/next-speed.md` §3 and write a "Reading it" paragraph: what
  each step bought, measured where it was measurable, and which steps were `WON'T DO` with their figures.

- [ ] A production trace for the next round: `VITE_PROFILING=1 pnpm build && pnpm preview --port 4173 --strictPort`,
  then `PYRRHIC_TRACE=1 pnpm exec playwright test e2e/profile-trace.spec.ts`, and
  `python3 tools/perf-trace/analyse.py .maestro/playbooks/Working/w18/trace-prod.json.gz > Working/w22/trace-final.md`.
  Note the five largest kernel and JS self times in the plan as the next candidates.

- [ ] Update the plan's status line to done with the date and HEAD. Commit: `W22: final measure`.

## Notes
