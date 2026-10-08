# Phase 05: Captain advice, the best trio and the next star (W17 C5-0, C5a, C5b)

This phase answers "which captains should I march with" and "where does my next star go". It first adds the march-type input and captain conditions (C5-0), then the trio search, then the star/level probes. Source: `docs/plans/progression-advisor.md` §4 C5. Constraints as in Phase 01 (benchmark never regresses, kernel path tests, reuse, UI cites `docs/design-rules.md`, commit per task with `Co-Authored-By: deepseek-flash <noreply@deepseek.com>`).

**Owner's-trade guard:** applying captain conditions changes today's readings for accounts with Amanitore or Hercules, and only the owner accepts that. So C5-0 ships the march-type input with a default that reproduces today's behaviour byte-for-byte (conditions NOT applied until the player picks a march type). The benchmark and goldens must show no moved reading; if they move, stop and fix the default.

## Tasks

<!-- MAESTRO:MODEL tier="high" effort="high" reason="Changes how bonuses are derived for stored accounts and must keep every current reading byte-identical by default; derivation, schema and share-link all interact." -->

- [ ] C5-0: read `src/state/derive.ts` (`captainValue`, the unconditional captain sum, caveat text at the Amanitore and Hercules notes), `src/data/captains.json` and the schema (`activeSources.captains`). Add a march-type input (solo / group / epic monsters) to the setup state with a default meaning "unspecified", under which derivation is unchanged; when set, apply the captain conditions (group-only, epic-monsters-only) instead of text caveats. Schema bump + migration + fixture test as in Phase 04, share-link handling per ADR 0005, and the sync merge as in Phase 04 (the march type is a stored field, merged with its profile section). Tests: default leaves every benchmark and golden reading identical; each condition gates the right captains once a type is chosen.

<!-- MAESTRO:MODEL tier="medium" effort="medium" -->

- [ ] Add the march-type control to the setup UI next to the captain controls (design-rules cited, ship crowded, 390 px check) with a tooltip saying what each type does to captains. Component test and an e2e assertion.

- [ ] C5a screen: implement `src/engine/captains.ts` enumerating every allowed trio of owned captains (deduplicated by `captainId`, conditions applied for the chosen march type), building each trio's totals on the MAIN thread (`resolveSources` + `aggregateBonuses` with `active.captains` swapped) and screening them as ONE worker job. Implement both screens the plan names, (a) `sizeStacks` with `options.method` and (b) the current stops' counts re-priced under each trio, ranked by `rate()`. Unit tests on a small synthetic roster.

- [ ] C5a confirm: take the top k trios (k = 8, a work count) plus the CURRENT trio, plan each in full as one pool job, read as in Phase 02's C3 reading against the current trio's plan, output the best trio per stop with the gain over the current trio. The answer can never be worse than the current trio. Tests: current trio always present, determinism across pool sizes, cut reporting.

- [ ] Write experiment `out/<n>-the-captain-trio.md` on the benchmark armies that carry captains: how often screen top-1 equals the confirmed best (and per the plan, whether confirm can drop to top-3), the gain of the best trio over the profile's current one, and wall/CPU cost against the 20 s budget together with the other probes. If the cost does not fit, give C5 its own button in the card and record that in the report.

- [ ] C5b: implement star and level probes for each owned captain below 6 stars (`star + 1`, separately `level + 1` and `+10`), taking the delta from `captains.json` (no typing). Cheap form first: add the delta to the current best trio when that captain is in it, otherwise re-screen the trios containing it. Rank by gain, or gain per star cost when the player types a cost (shards). Tests for the trio-membership logic.

- [ ] Add the captain section to the advisor card: best trio per stop with its gain, and the ranked next-star/level list; use the same card patterns, "Compute captains" button if the experiment demanded its own, progress and Cancel. Tests and an e2e step; `pnpm build` before `pnpm e2e`.

- [ ] Run the full gate (`pnpm kernel:build`, `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build && pnpm e2e`), confirm benchmark and goldens unchanged, add the `S-nn` rows to `docs/PLAN.md`, commit.

## Manual Follow-Up (not executed by Auto Run)

- Owner decides whether captain conditions should become the default for accounts that have not chosen a march type; that is a trade on today's readings.
- Answered 2026-10-07: trio fixed per march type; the advisor suggests the best trio and its gain, never swaps the active trio.
