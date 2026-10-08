# Phase 08: Expand the relevant ideas into refined backlog items

This phase turns each idea that Phase 07 marked relevant or partly done into a numbered, self-contained backlog item with context, acceptance criteria, the design rules it touches and a size estimate. Documents only; no source changes. Constraints: cite files and stories, use the design rules by their number from `docs/design-rules.md`, benchmark non-regression and kernel-path testing are listed as standing acceptance criteria on every engine item, commit once at the end with `Co-Authored-By: deepseek-flash <noreply@deepseek.com>`.

## Tasks

- [ ] Read `docs/backlog/triage/README.md` and the triage files from Phase 07, `docs/design-rules.md` and the format of existing `docs/PLAN.md` story rows. Create `docs/backlog/` item files named `B-01-<slug>.md`, `B-02-...` for every `relevant` and `partly-done` idea (skip `needs-owner` ones; list them in the index as blocked on the owner). Each file has front matter (`type: reference`, `title`, `created`, `tags`, `related` with `[[T-nn]]` triage ids and relevant stories) and these sections: Context (what exists today, with file paths), Problem, Proposal, Acceptance criteria (verifiable, including "benchmark rating does not regress" and "tests pass on the kernel path" for engine work, and the rule numbers for UI work), Design rules touched, Size (S/M/L with a reason), Dependencies, Open questions for the owner.

- [ ] Refine the items that need design or investigation first. For each such item (equipment revamp, hero level indicator, merc-fill button, "use less monsters" option, dominance/leadership sweep overlap, higher-troop rating regression with ARC3, non-linear leadership results), add a "First step" section naming a concrete experiment or an artifact to design, with its expected output file path. For the ARC3 regression item, include the reference march data from `todos.md` verbatim as a fixture description.

- [ ] Write `docs/backlog/README.md` as the ordered index: a table of items with id, title, size, dependencies, rule numbers and a proposed order (cheap UI fixes first, game-data items, then investigations, then long-term), plus a section "Covered by the advisor playbook" mapping todos to the advisor phases and a section "Blocked on the owner". Do not edit `todos.md` itself except to append a final line pointing to `docs/backlog/README.md`.

- [ ] Run `pnpm format:check` for the new files (fix with prettier on those files only), verify every `[[wiki-link]]` resolves to an existing file under `docs/` (write a quick shell check and fix dangling ones), and commit.

## Manual Follow-Up (not executed by Auto Run)

- Owner picks which backlog items become stories and in what order.
