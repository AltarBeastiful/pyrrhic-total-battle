# Phase 02: Generic probes and the noise-robust reading (W17 C1 and C3)

This phase builds the advisor's engine: pure probes that turn a march request into an upgraded request, and the reading that compares each upgraded plan to the current one without ever reporting a loss. It ends with a measured experiment ranking "what a percent is worth" on the 18 benchmark armies. No UI yet. Source: `docs/plans/progression-advisor.md` §4 C1 and C3. Constraints: the rules listed under "Rules for every task" in `.maestro/playbooks/Initiation/Phase-01-Worker-Pool.md` (read them first; each task runs in a fresh session) (benchmark never regresses, kernel path tests, reuse existing patterns, one commit per task with `Co-Authored-By: deepseek-flash <noreply@deepseek.com>`, no re-basing of pins).

## Tasks

- [x] Read `src/engine/types.ts`, `units.ts` (`effectiveUnit`), `battle.ts`, `rating.ts`, `campaign.ts`, `src/kernel/` plan bindings and `src/worker/jobs.ts`. Then implement `src/engine/probes.ts` with pure probe builders that NEVER mutate (the kernel recognises tables by identity, so build new objects: `{...req, totals: {...totals, health: {...totals.health, [key]: v + delta}}}`):
  - health % probe for each of the 13 bonus keys, strength % probe for the same 13, housing probes for leadership, authority and dominance (delta = +1 % of the current pool)
  - default delta +1 % on a bonus; a typed `Probe` shape `{ id, family, label, apply(req) }` that later phases (user-entered upgrades, captains) extend
  - unit tests proving inputs are not mutated and ids are unique and stable

> Note (task 1): `src/engine/probes.ts` ships `Probe`, `bonusProbe`, `housingProbe`, `genericProbes()` (13 health + 13 strength + 3 housing, ids `health:<key>` / `strength:<key>` / `housing:<pool>`); housing delta is 1 % of the pool, rounded, minimum one slot. Tests in `tests/engine/probes.test.ts`.

<!-- MAESTRO:MODEL tier="high" effort="high" reason="The reading and the probe job decide every figure the advisor shows; a wrong baseline or clamp silently misleads the player." -->

- [x] Implement the reading in `src/engine/advisor.ts` following C3 exactly, with these pieces:
  - `advisor.ts` stays pure engine and never imports `src/ui/`: it takes the Tight-priced figures as input. The Tight pricing itself (`positionTrades`, `OFFERED_POSITIONS` from `src/ui/sections/march/positions.ts`) runs in the worker job of the next task, as `src/worker/jobs.ts` already does for `runPositions`
  - **Baseline is Tight, as shown** (owner, 2026-10-07): current, re-priced and re-planned are each read after the Tight raise on that stop (the worker's positions step, `OFFERED_POSITIONS`), one Tight pricing per probe and stop inside the same job
  - **Re-priced**: the current stop's counts battled again under the upgraded request, no search
  - **Re-planned**: the upgraded request planned in full and the same stop taken from its bar
  - **Gain** = max(re-priced, re-planned, current) minus current, read with `rate()` and `CAMPAIGN.markerRates`, so a probe is never reported as a loss; a probe whose gain is 0 only because of the clamp is reported as "no gain", not dropped
  - diagnostics flags `noise` (re-planned < re-priced) and `reorder` (death order of the re-priced march changed)
  - a visible `worse` flag (re-planned after Tight < current) carried on the row with the re-planned figure, so a search regression is shown and reportable (owner, 2026-10-07)
  - the baseline is re-planned under the same settings as the probes, never taken from the main plan
  - per stop of the bar, with the headline stop selectable (the stop selected on the bar; sweet spot by default)

> Note (task 2, 2026-10-08): `src/engine/advisor.ts` reads marches already raised and battled (`ShownMarch`: Tight counts, a bill of the worst opening plus silver, gold, hired burn, dragon coins and queue — every marker `rate()` takes — and the death order). `readStop` gives `gain = max(0, rate(current, re-priced), rate(current, re-planned))`, `from` (`replanned` on a tie, `null` = no gain), `clamped` (both below current), `damagePercent`, and the flags `noise`, `reorder` (re-priced vs current death order, both as shown) and `worse` (with `replanned` and its rating on the row). `readProbe` reads every stop of the baseline bar in its order, the re-planned stop matched by `pick` (`null` when the upgraded bar has none); `headlineOf` = selected stop, else sweet spot, else first; `rankAdvice` sorts on the headline's gain, ties in probe order. The engine imports no config, so the rates are an argument (`CAMPAIGN.markerRates` from the caller). Tests: `tests/engine/advisor.test.ts` (13, hand-built marches, including 500 seeded trials of gain ≥ 0). Measured while building it (scratch run over the 19 benchmark plans of experiment 190, the 20 000-dominance camp included): the bar's picks are unique on every army, a Tight row priced alone equals the one priced beside `tightOld` on every stop, `withMethod(…, 'elite')` changes no Tight row, no stop lacks a troop floor; Tight costs 0.4–54 ms a bar on the other 18 but **63 s** on the 20 000-dominance camp (12.7 s a stop), so that camp's advisor pass will be cut at 20 s.

- [ ] Add a job type in `src/worker/jobs.ts` / `protocol.ts` / `client.ts` for one probe that does, in ONE worker round trip, the plan of the upgraded request (no `budgetMs`, W17 A0) and the Tight pricing of the stops read (`runPositions` with `OFFERED_POSITIONS`), returning the advisor row; the baseline is the same job with no probe. The pool (`src/worker/pool.ts`) takes jobs as `(client, signal) => Promise<T>`, so each probe is `(client, signal) => client.probe(…, signal)`; the 20 s is `pool.map(jobs, { budgetMs: CAMPAIGN.budgets.extra })` and unfinished jobs come back `{ kind: 'cut' }`. Add `src/engine/advisor.run.ts` (or equivalent) exposing `runAdvisor(input, probes, pool, { signal, onProgress })` returning ranked rows with progress callbacks (n / total).

<!-- MAESTRO:MODEL tier="medium" effort="medium" -->

- [ ] Write tests (kernel path): non-mutation, gain never negative, clamp-to-zero reported as no gain, `noise`/`reorder` flags on a hand-built case, deterministic results across pool sizes (N = 1 and 3 give identical output), cut reporting. Run them and fix failures in the code, not the expectations.

- [ ] Write experiment `out/<n>-what-a-percent-is-worth.md` over the 18 benchmark armies: per army the ranked probes with gain in `rate()` and % of current damage, the counts of `noise` and `reorder` flags per army, wall and CPU time for 29 probes plus baseline, and a sanity comparison with `docs/research` theory-craft 0015/0016 (the troop floor deciding merc damage should rank troop health high on the owner's army), quoting measured figures only. State explicitly whether any probe was clamped. Link `[[Progression-Advisor-Plan]]`.

- [ ] Fix anything the experiment exposes that is cheap and safe (for instance an unstable probe id); anything that would change a main-plan reading is reported in the experiment's "Left open" section instead and NOT changed. Run `pnpm kernel:build`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and confirm goldens and benchmark are unchanged, add the next `S-nn` row to `docs/PLAN.md`, commit.
