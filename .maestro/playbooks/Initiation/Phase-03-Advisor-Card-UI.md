# Phase 03: The "What to upgrade next" card (W17 C4)

This phase puts the advisor in front of the player: a card under the plan with a Compute button, progress, Cancel and a ranked list of upgrades. It is the first visible payoff of the advisor work. Source: `docs/plans/progression-advisor.md` §4 C4. Constraints: the rules listed under "Rules for every task" in `.maestro/playbooks/Initiation/Phase-01-Worker-Pool.md` (read them first; each task runs in a fresh session) (benchmark never regresses, kernel path, reuse patterns, commit per task with `Co-Authored-By: deepseek-flash <noreply@deepseek.com>`). Every task here that touches UI must read and cite `docs/design-rules.md` (list the rule numbers applied in the task's commit message or in the story row), copy the existing look (look at how the plan card and the March section's raise control are built, and the Mantine 9 kit already in `src/ui/`), say "merc" not "hired", and ship crowded rather than refactor the layout.

## Tasks

**Owner answers (2026-10-08), resolved from the step-back:**

- **Questions the card answers.** Globally: "what should I upgrade first to get better marches; what has the most impact on my marches with equivalent resources?" The upgrade can be any bonus, a hero level-up or star-up, swapping to a different trio of heroes for the march for more damage than the selected one, or a large damage gain from raising leadership or dominance. The card covers all of these probes and guides where the player goes next in the game.
- **Placement.** Below the battle summary for now. It shows what could be improved and what each change would bring.
- **Increments.** Probes use fixed increments for now. In the game the real step depends on where the player is in the talent/research tree; that is **deferred** (state it in the story row's "left open").
- **Use of an answer.** The player steers his progress with it: it tells him what to do next. Upgrades take time anyway, so the information only matters for future marches, not the one on screen. Wording and layout should read as "next investment", not "change this march now".

Where a task below says "under the plan panel", read it as "below the battle summary".

- [x] Read `docs/design-rules.md`, `docs/design.md`, `src/ui/` (find the plan panel, `positionsSearch.ts`, the raise control's hover preview in the March section (the positions table `PositionTrade.tsx` was removed in 1cb2ac9), `DeltaText`, the compact number formatters) and the store in `src/state/`. Write a short design note at `docs/plans/advisor-card.md` (front matter: type plan, tags advisor/ui, related `[[Progression-Advisor-Plan]]`) listing the rule numbers that apply, the existing components to reuse, and the state shape. Keep it to what an implementer needs.
  - Done 2026-10-08: `docs/plans/advisor-card.md` — placement as a `MarchSection` part right after `<PlanFold />`; rules 1, 3, 4, 5, 15, 17, 18, 19, 20, 21, 22, 23, 24, 26, 28; reuse map (positionsSearch.ts shape, runAdvisor/genericProbes/buildPlanRequest, createCalcPool, rankAdvice/headlineOf, compactTwo/signedPercent/amount, MarchPills tooltip look, Disclosure); state shape with headline derived from `planPick`, not stored. No pool is used in `src/ui/` yet: the card's hook builds the first one.

- [ ] Add advisor state: a store slice (or hook beside `positionsSearch.ts`) holding status (idle / running / done / cut / cancelled / failed), progress `n / total`, rows keyed by the plan's identity, and the selected headline stop. Computation runs ON DEMAND only (button), never on Generate; a new Generate or profile change cancels a running pass through the pool's signal and invalidates stale rows. Wire it to `runAdvisor` from Phase 02 and the pool from Phase 01. Unit-test the state machine (cancel, stale invalidation, cut, failure).

- [ ] Build the card component `src/ui/.../AdvisorCard.tsx` (follow the folder convention the plan panel uses):
  - Compute button, progress ("12 / 29 done"), Cancel, and a cut note when the 20 s safety cut fired
  - ranked list: label, gain, % of current damage, per-cost figure column present only when a cost is known (design rule on absent data)
  - headline = the selected bar stop (default sweet spot); other stops behind a disclosure
  - zero-gain probes shown as "no gain", never hidden, never as a loss; a row flagged `worse` adds a faint note "the plan gets worse here: search issue" with the re-planned figure
  - compact number notation via the existing `compactTwo`; exact figure on hover where the notation rounds
  - works at 390 px width with no sideways scroll

- [ ] Mount the card under the plan panel, behind the same visibility conditions as the plan (no card without a plan, nothing on a platform with no worker; there the card says why in one line). Reuse existing empty/failed-state patterns.

- [ ] Write component and integration tests following `positionsSearch.test.tsx`, `raiseSource.test.tsx` and `march.test.tsx` (page real, worker a double): compute shows ranked rows, Cancel stops it, Generate invalidates, a cut is labelled, the main plan's bar is never delayed (assert Generate dispatches before and independently of any advisor job). Run them red first where a gate is added, then green.

- [ ] Add an e2e journey step in `e2e/` (follow the plan journey): generate a plan, press Compute, wait for rows, assert the list and the 390 px layout. Run `pnpm build` before `pnpm e2e` (Playwright serves the built dist, a stale dist gives false results). Fix failures in the code.

- [ ] Run the full gate: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build && pnpm e2e`, confirm the benchmark moved no reading, add the `S-nn` row to `docs/PLAN.md` including the design rules cited and what is left open, commit.

## Manual Follow-Up (not executed by Auto Run)

- Owner review of the card's look and wording at desktop and phone widths.
- Owner answers to the open questions in `docs/plans/progression-advisor.md` §7 (headline stop, delta size, shared 20 s budget, auto-run vs button); confirmed by the owner 2026-10-07: selected-stop headline (sweet spot by default), +1 %, advisor-only budget, button only.
