# Drill 04: The caches the census paid for

Playbook: `2026-10-10-Profile-Drilldown` (W18). Agent: pyrrhic. Project: `/home/remi/projects/pyrrhic-totalbattle`.
Plan: `docs/plans/profile-drilldown.md` §5 (census verdicts). Rules: top of `DRILL-01-Measure-And-Census.md` in this
folder. Gate: `.maestro/playbooks/Working/w18/gate.sh`.

**Every task here starts by reading the census verdict** for its item in Drill 01's Notes and in §5 of the plan,
re-running `tools/theorycraft/196-the-cache-census.test.ts` on the current HEAD (Drills 02 and 03 may have changed
the figures: a shared kill order makes K1's hits cheaper, one baseline per run removes some K3/K5 hits). If the
rerun no longer meets the rule (at least two hits per stored entry on average and a projected saving of at least
3 % of the run's CPU on one fixture), tick the task with the figures and `WON'T DO`, and change nothing.

A cache is exact only if what it stores is a pure function of its key. For each one, write the argument in the
commit message: what the key covers, what else the value depends on, and why that is fixed for the cache's life.

## Tasks

- [x] K1, the rated value memo. In `kernel/assembly/index.ts`, the raise memo stores a vector's damage; under
  `rRated` a memo hit still calls `raiseRating(known)` (`killOrderBy` + `recoveryOf` + `raiseBurn`), in
  `raisePointSlots` (around line 2126) and its twin (around line 2256). The rating depends on the vector and on the
  raise call's rated context (`rAsDamage`, `rAsSilver`, `rAsGold`, `rAsHired`, the three `H_RATE_*` header cells,
  `mode`, the request tables), which is fixed for one raise call, whereas the damage memo may be shared by several
  positions. So: a second dense array beside the damage memo, same index, holding the rated value, reset (NaN) at
  the start of every rated raise call, and read only under `rRated`. `raisePointSlots` must still write the slots
  into `rWork` on a hit if anything after reads `rWork` (check). `scored` unchanged (it counts asks, not battles).
  Memory: the damage memo can be 2²² entries; check the kernel's memory growth and `MEMO_CAP`, and allocate the
  rating array lazily, only for rated calls. Gate script, advisor golden identical; record `pnpm kernel:bench`,
  experiment 184 and experiment 196 figures before and after. Commit: `Kernel: memo the rated value of a vector (W18 K1)`.
  **WON'T DO (2026-10-11, 196 rerun on HEAD 05ab2d6).** Hits per entry 0.05 (376 / 7,369) exactness, 0.59
  (4,839,797 / 8,222,922) timing — under 2 on both; projected saving 4 ms = 0.01 % / 1,925 ms = 2.21 % — under 3 %.
  Nothing changed. See Notes.

- [x] K3, `shownMarch` across jobs. Only if the verdict holds. In `src/worker/jobs.ts`, `runProbe` keeps a `read` map
  per job. Move it to a per-worker LRU keyed by (request fingerprint, `countsKey`), bounded by entry count (size it
  from the census: the number of distinct keys of one full run, plus margin), cleared when the worker receives a
  new run id or a new data version. The fingerprint must cover the whole elite request (every field `shownMarch`
  reads, including totals and the method); use the census's hash and assert in a dev-only check that two requests
  with the same fingerprint are deep-equal. Hits depend on which worker gets which job, so the hit count varies run
  to run; the answers must not. Advisor golden identical with one worker and with six (run the golden test with
  both pool sizes). Commit: `Worker: Tight pricings shared across jobs (W18 K3)`.
  **WON'T DO (2026-10-11, 196 rerun on HEAD 05ab2d6).** Exact request key: 0.14 / 0.07 hits per entry, 0.11 % /
  0.94 %; kernel input key: 0.56 / 0.09, 0.20 % / 1.14 % (exactness / timing). Fails both bars. Nothing changed.

- [ ] K5, Generate's pricings reused by the advisor baseline. Only if the verdict holds and K4 (Drill 03) did not
  already remove these hits. Send the Tight pricings Generate made (`primeBar` in `src/ui/sections/march/generate.ts`)
  to the baseline job as known answers, keyed exactly like K3, only when the request fingerprints match. Advisor
  golden identical. Commit: `Advisor: the baseline reuses Generate's pricings (W18 K5)`.

- [ ] Re-measure this phase: experiment 196 on HEAD (hits now taken versus projected), and the progress table in
  `docs/plans/profile-drilldown.md` §3, one row per committed cache with its measured saving next to the census's
  projection. Commit the doc: `W18: Drill 04 measured`.

## Notes

### Verdicts re-checked on HEAD 05ab2d6 (2026-10-11)

- Experiment 196 rerun (`THEORY=1`, 83 s, profile kernel compiled to a temp dir, one lane): every census count is
  identical to the Drill 03 rerun and to the committed report; only the clock moved (run CPU 33.1 s exactness,
  86.9 s timing; Tight raise 0.57 % / 12.84 % of it). Rerun report and log:
  `.maestro/playbooks/Working/w18/d04-196-the-cache-census.md`, `d04-196.log`; the committed census stays the record
  (the rewritten `tools/theorycraft/out/196-the-cache-census.md` was restored).
- **K1**: 0.05 / 0.59 hits per entry; 0.01 % / 2.21 % → `WON'T DO`.
- **K3**: exact key 0.14 / 0.07 hits per entry, 37 ms 0.11 % / 814 ms 0.94 %; kernel key 0.56 / 0.09, 66 ms 0.20 % /
  989 ms 1.14 % → `WON'T DO`.
