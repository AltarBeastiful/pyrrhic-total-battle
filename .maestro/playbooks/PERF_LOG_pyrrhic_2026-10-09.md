---
type: report
title: Performance Log - pyrrhic 2026-10-09
created: 2026-10-09
tags:
  - performance
related:
  - '[[LOOP_00001_PLAN]]'
---

# Performance Log

---

## [2026-10-09] - Loop 00001 Complete

**Agent:** pyrrhic
**Project:** pyrrhic
**Loop:** 00001
**Status:** No PENDING fixes available

**Summary:**
- Items IMPLEMENTED: 0
- Items WON'T DO: 1 (pool eager boot, Finding 2)
- Items PENDING - MANUAL REVIEW: 0

**Recommendation:** Remaining candidates (Tactic 1 findings other than Finding 2, and later tactics) still need to be evaluated; no automatable win is pending.

---

## [2026-10-11] - W18 Profile Drill-Down Complete

**Agent:** pyrrhic
**Project:** pyrrhic
**Playbook:** 2026-10-10-Profile-Drilldown (Drills 01–06), plan `docs/plans/profile-drilldown.md`
**Status:** Done; two trades left for the owner

**Summary:**
- Items IMPLEMENTED: 5 (P2.1 incremental kill order e2c03f5; P1.2 probes start while the baseline plans af932e0; P1.5 Generate's bar on the pool fbb01c7; P3.4 step 1 the sizer shape as one kernel door 065d364; P4 the advisor card one render a frame 42e131a)
- Items WON'T DO: 7 (K1, K2, K3, K4/P1.1, K5, K6 under the census bars; P4.3 fewer `Box` wrappers, style + layout 103 ms a run)
- Items PENDING - MANUAL REVIEW: 2 trades on branches (P1.3 longest first, a1a6393; P1.4 captains one queue, b93dfe8, recommended dropped)

**Measured (2026-10-11, HEAD 42e131a, machine loaded ~6 % slow):** timing fixture in a production browser, four passes 11.2 s (Drill 04b) → 12.0 s, pool CPU 66 s at 87 % efficiency, answer hash unchanged; the owner's 23.1 s trace was a `dev:profile` build under a profiler. Main thread busy 22.6–23.8 % → 12.3–13.7 % of the run (experiment 200). One plan −7.6 to −8.3 % wall (in-process A/B); 197 profiled planner 488 → 461 ms (timing), 507 → 417 ms (exactness). Every golden, advisor row and benchmark figure but the timings unchanged.

**Recommendation:** The planner is the remaining lever (76 % of pool CPU): next candidates are the scorer's sizer branch after the memo (`scorer` 21 % JS-under) and `retypeRow` (38 % of the exactness fixture's planner). Owner: one new "Profile everything" trace on the real account to compare with the first.
