# Phase 02: Generic probes and the noise-robust reading (W17 C1 and C3)

This phase builds the advisor's engine: pure probes that turn a march request into an upgraded request, and the reading that compares each upgraded plan to the current one without ever reporting a loss. It ends with a measured experiment ranking "what a percent is worth" on the 18 benchmark armies. No UI yet. Source: `docs/plans/progression-advisor.md` §4 C1 and C3. The same constraints as Phase 01 apply (benchmark never regresses, kernel path tests, reuse existing patterns, one commit per task with `Co-Authored-By: deepseek-flash <noreply@deepseek.com>`, no re-basing of pins).

## Tasks

- [x] Read `src/engine/types.ts`, `units.ts` (`effectiveUnit`), `battle.ts`, `rating.ts`, `campaign.ts`, `src/kernel/` plan bindings and `src/worker/jobs.ts`. Then implement `src/engine/probes.ts` with pure probe builders that NEVER mutate (the kernel recognises tables by identity, so build new objects: `{...req, totals: {...totals, health: {...totals.health, [key]: v + delta}}}`):
  - health % probe for each of the 13 bonus keys, strength % probe for the same 13, housing probes for leadership, authority and dominance (delta = +1 % of the current pool)
  - default delta +1 % on a bonus; a typed `Probe` shape `{ id, family, label, apply(req) }` that later phases (user-entered upgrades, captains) extend
  - unit tests proving inputs are not mutated and ids are unique and stable

- [ ] Implement the reading in `src/engine/advisor.ts` following C3 exactly, with these pieces:
  - **Re-priced**: the current stop's counts battled again under the upgraded request, no search
  - **Re-planned**: the upgraded request planned in full and the same stop taken from its bar
  - **Gain** = max(re-priced, re-planned, current) minus current, read with `rate()` and `CAMPAIGN.markerRates`, so a probe is never reported as a loss; a probe whose gain is 0 only because of the clamp is reported as "no gain", not dropped
  - diagnostics flags `noise` (re-planned < re-priced) and `reorder` (death order of the re-priced march changed)
  - the baseline is re-planned under the same settings as the probes, never taken from the main plan
  - per stop of the bar, with the headline stop selectable (default: the sweet spot)

- [ ] Add a job type in `src/worker/jobs.ts` / `protocol.ts` for one probe (request in, advisor row out) so the pool from Phase 01 can run all probes in job order, with the `CAMPAIGN.budgets.extra` deadline reported as `cut`. Add `src/engine/advisor.run.ts` (or equivalent) exposing `runAdvisor(input, probes, pool, { signal, onProgress })` returning ranked rows with progress callbacks (n / total).

- [ ] Write tests (kernel path): non-mutation, gain never negative, clamp-to-zero reported as no gain, `noise`/`reorder` flags on a hand-built case, deterministic results across pool sizes (N = 1 and 3 give identical output), cut reporting. Run them and fix failures in the code, not the expectations.

- [ ] Write experiment `out/<n>-what-a-percent-is-worth.md` over the 18 benchmark armies: per army the ranked probes with gain in `rate()` and % of current damage, the counts of `noise` and `reorder` flags per army, wall and CPU time for 29 probes plus baseline, and a sanity comparison with `docs/research` theory-craft 0015/0016 (the troop floor deciding merc damage should rank troop health high on the owner's army), quoting measured figures only. State explicitly whether any probe was clamped. Link `[[Progression-Advisor-Plan]]`.

- [ ] Fix anything the experiment exposes that is cheap and safe (for instance an unstable probe id); anything that would change a main-plan reading is reported in the experiment's "Left open" section instead and NOT changed. Run `pnpm kernel:build`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` and confirm goldens and benchmark are unchanged, add the next `S-nn` row to `docs/PLAN.md`, commit.

> Note (task 1): `src/engine/probes.ts` ships `Probe`, `bonusProbe`, `housingProbe`, `genericProbes()` (13 health + 13 strength + 3 housing, ids `health:<key>` / `strength:<key>` / `housing:<pool>`); housing delta is 1 % of the pool, rounded, minimum one slot. Tests in `tests/engine/probes.test.ts`.
