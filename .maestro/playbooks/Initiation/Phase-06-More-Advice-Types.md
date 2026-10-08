# Phase 06: The remaining advice types (W17 step D) and the portfolio experiment (B1)

This phase finishes "all types of advice": more dominance (swept to where the curve flattens), the next troop tier, more merc stock, the campaign horizon, and the marginal value of silver, each as a probe or a sweep over one on the same machinery. It closes with the node-only portfolio experiment (B1) that decides whether a wider search is worth the owner's trade. Source: `docs/plans/progression-advisor.md` §3 and §5. Constraints as in Phase 01 (benchmark never regresses, kernel path tests, reuse, UI cites `docs/design-rules.md`, commit per task with `Co-Authored-By: deepseek-flash <noreply@deepseek.com>`, no re-basing of pins). B2 and B3 (the portfolio merge and its UI) are the owner's call and are NOT in this phase.

## Tasks

- [ ] Read the step D list in `docs/plans/progression-advisor.md`, `docs/investigations/` and `docs/research/` for experiment 73 (horizon) and the dominance/leadership sweep notes, and `src/config.ts` (`CAMPAIGN.marches`, caps, silver budget). Write a short design note `docs/plans/advisor-step-d.md` (front matter, `[[Progression-Advisor-Plan]]` link) fixing, for each question, the probe or sweep, the unit it is reported in, and its cost; keep each section to what an implementer needs.

- [ ] Implement the sweeps in `src/engine/advisor-sweeps.ts` as pool jobs reusing Phase 02's reading:
  - **Dominance / leadership sweep**: gain as a function of +X, returning the curve and the point where it flattens ("peak" = marginal gain per step falls under a stated threshold held in `src/config.ts`)
  - **Next troop tier unlocked**: a new unit added to `units`
  - **More merc stock**: raised `caps` by a step
  - **Horizon**: `CAMPAIGN.marches` 3/4/5 as a probe through the request, not a config edit; the config value is read only for the baseline
  - **Marginal value of silver**: `silverBudget` plus or minus delta
  - Tests on synthetic requests: curve monotone-or-flagged, peak detection on a hand-built curve, gain never negative, determinism across pool sizes

- [ ] Write experiment `out/<n>-the-other-questions.md` over the 18 benchmark armies: per question the measured gains, the cost in wall and CPU time, and whether it fits the 20 s budget or needs its own button. Quote measured figures only (never recompute from memory). Link back to the plan.

- [ ] Add the cards or sections for these questions to the advisor UI (same patterns as Phases 03 and 05, cite `docs/design-rules.md`, "merc" wording, 390 px check, ship crowded). The dominance sweep draws as a small ranked table of steps with the flattening point marked, not a chart, unless an existing chart kit already exists in `src/ui/`. Component tests and an e2e step; `pnpm build` before `pnpm e2e`.

- [ ] B1 portfolio experiment (node only, no UI, no engine change): add a script that runs each candidate variant (default, `retypeExhaustive` 10 000, EXHAUSTIVE death order, `tierSeed`, `burnSaver`, `putBack`, `bandHired` modes) on the 18 armies plus the 20 000 camp at x2/x4/x8 work budgets through the pool. Write `out/<n>-the-portfolio.md` with, per variant, stops better / equal / worse versus default, sum of rating gained, cost in plan-ms, and a ranking by marginal gain per ms. End with a one-paragraph recommendation of whether B2 is worth building. Do not change any default, pin or golden.

- [ ] Run the full gate (`pnpm kernel:build`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build && pnpm e2e`), confirm benchmark and goldens unchanged, update `docs/plans/progression-advisor.md` status to reflect what shipped, add the `S-nn` rows to `docs/PLAN.md`, commit.

## Manual Follow-Up (not executed by Auto Run)

- Owner reads `out/<n>-the-portfolio.md` and decides whether B2/B3 go ahead; any change to the bar's readings is a trade only the owner registers.
- Owner reviews the advisor cards end to end.
