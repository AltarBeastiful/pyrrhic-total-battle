# Phase 07: Triage `todos.md` against the code

This phase reviews every idea in `todos.md` and decides, with evidence from the code and docs, whether it is still relevant, already done, or obsolete. It writes documents only and implements nothing. Output is a structured triage report that Phase 08 turns into backlog items. Constraints: write docs only (no source, test or config changes); every claim cites a file, story number or experiment; commit once at the end with `Co-Authored-By: deepseek-flash <noreply@deepseek.com>`.

## Tasks

- [x] Read `todos.md` in full, `docs/PLAN.md` (the story table), `docs/design-rules.md`, `docs/plans/*.md` and `docs/research/` filenames. Produce an inventory file `docs/backlog/triage/00-inventory.md` with front matter (`type: analysis`, `title`, `created`, `tags: [backlog, triage]`, `related: ['[[Progression-Advisor-Plan]]']`) listing every idea as an id `T-01`, `T-02`... in the order of `todos.md`, with the original wording quoted. Split compound bullets (for instance the Equipment revamp sub-bullets, the raise-positions reference with its sample marches) into separate ids where they are separate asks.
  - Done 2026-10-09: inventory written to `docs/backlog/triage/00-inventory.md` (35 ids, T-01 to T-35; compound bullets split).

- [x] For each inventoried idea, check the code and docs to classify it as `relevant`, `done` (cite the story or commit), `partly-done`, `obsolete` or `needs-owner` (the owner must decide), and note evidence. Specific checks to run rather than assume:
  - the sweet-spot hue on the plan table and whether the sweet spot is the best rated (search `src/ui/` and the plan's stop definitions)
  - raise positions and S-142/S-147/S-149 versus the "use more mercs while shielded" idea
  - Enter-to-validate on count edits and popups (search the edit components)
  - hero level on hover and the S-nn captain badge/tooltip work in the recent commits
  - non-linear results when raising leadership or army modernization (look for existing experiments and notes before concluding)
  - remove em dashes in UI strings: count them with grep over `src/` and `docs/` and report the numbers
  - VIP table and hall of fame in `src/data/`
  - the ARC3 rating-regression case: reproduce it by running the existing planner on the reference march data in `todos.md` if the data can be built from a fixture, and report the measured rating with and without ARC3; if it cannot be reproduced offline, say so
  - mobile back button closing popups, Google login (ADR 0009), sliding leadership/dominance (Phase 06 of the advisor playbook covers it), "less monsters" quick option
  Write one file per classification group, `docs/backlog/triage/01-relevant.md`, `02-done-or-obsolete.md`, `03-needs-owner.md`, each with front matter and `[[wiki-links]]` to the inventory ids and stories.
  - Done 2026-10-09: three files written. 12 relevant, 3 partly-done (in 01), 14 done and 1 obsolete (in 02), 5 needs-owner (in 03; T-15 also listed there for its scope). Em dash counts measured: 2,483 in `src/` (1,089 in `src/ui` non-test, about 120 on non-comment lines), 2,642 in `docs/`. VIP table is all-zero placeholders. T-34 (ARC3) was not reproduced offline: it needs the owner's full profile, only the untracked export exists.

- [ ] Write `docs/backlog/triage/README.md` (front matter, links to every triage file) summarising the counts per classification, the ideas that overlap with the advisor playbook (Phases 01-06) so they are not backlogged twice, and the ideas that conflict with a design rule (name the rule). Run `pnpm format:check` on the new files (fix with `pnpm prettier --write` on those files only), and commit.

## Manual Follow-Up (not executed by Auto Run)

- Owner reviews the `needs-owner` list and the done/obsolete calls before Phase 08 expands items.
