# Critical 04: Troop order matches the battle selection, with a switch to order by health

Source: `todos.md`, entry "[UI] order troops as they appear in the battle selection. and allow to switch to order by health from hte battle summary." Added to the todo list on 2026-10-10 and folded into the critical set with items 1 and 3 by the owner. Playbook: `2026-10-10-Critical-Items`. Agent: pyrrhic. Project: `/home/remi/projects/pyrrhic-totalbattle`.

## Target behaviour (owner's words, paraphrased from todos.md)

- Troop types are listed in the **same order the battle selection screen lists them**.
- The battle summary offers a way to switch the troop list to **order by health**, and back.

## Where the code is today

- `src/ui/sections/troops/rows.ts`: `sortForDisplay` (around line 88) sorts by tier, then by category (`CATEGORY_ORDER`: ranged, melee, mounted, flying). That is the order the Troops card uses today. It is not the battle selection order.
- `src/ui/sections/troops/rows.ts` line 18: the four groups are "in the order the game lists them" (guardsmen, specialists, engineers, monsters). Check whether the battle selection uses that group order too.
- `src/ui/sections/troops/TroopsSection.tsx` and `TroopsSection.test.tsx`: the Troops card that renders the rows.
- `src/ui/sections/bonuses/TotalsFigures.tsx` line 44: the battle summary already shows a `health` figure (`summary.health`). The switch goes there or next to it.
- The battle selection order is game data, not code. Look in `src/data/` (for example `src/data/tables/` and `src/data/CHANGELOG.md`) for a list or field that gives the in-game order of unit types. If none exists, the order must come from the owner: stop that task and write the question in Notes (see Tasks 1).

## Tasks

<!-- MAESTRO:HITL reason="Owner to supply the battle selection order: a screenshot of the game's battle selection screen, or the ordered list of unit ids. Record it in Notes, then tick this box." -->
- [ ] Find the battle selection order. Search `src/data/` and `docs/reference/` for the in-game order of unit types shown on the battle selection screen (`grep -rni "battle" src/data docs/reference`). If an order is recorded, write it in Notes as a list of unit ids in order. If none is recorded, write in Notes: "The battle selection order is not in the repo. Owner to supply it: a screenshot of the battle selection, or the ordered list of unit ids." Then stop this playbook at this task (do not invent an order).

- [ ] Write the failing test for the new order. In `src/ui/sections/troops/TroopsSection.test.tsx`, add a test that the troop rows render in the battle selection order from task 1 (same test shape as the existing ones in that file). Add a second test that the battle summary's order-by-health switch reorders the rows by health (lowest first) and that switching back restores the battle selection order. Run the test and confirm it is red for the right reason.

- [ ] Add the battle selection order as data, not as code. Put the ordered unit ids in `src/data/` as a small table (a JSON file in the same style as `src/data/tables/*.json`), with a source note saying the order was read from the game's battle selection screen, on 2026-10-10 or the date in Notes. Do not hard-code the order in `rows.ts`. Add a `src/data/CHANGELOG.md` entry for the new table.

- [ ] Use that order in the Troops card. In `src/ui/sections/troops/rows.ts`, make the display order come from the table; keep `sortForDisplay` only as the fallback for a unit id missing from the table, and say so in a comment. Do not change the group order in `rows.ts` line 18 unless task 1 showed the battle selection uses a different group order.

- [ ] Add the order-by-health switch to the battle summary. In `src/ui/sections/bonuses/TotalsFigures.tsx` (or the component that renders the battle summary, found with `grep -rn "summary.health" src/ui`), add a control that switches the troop list order between "battle selection" (default) and "health". The health order sorts by the unit's health, lowest first. The switch is a UI preference: keep it in local component state, not in the saved profile, and do not add a new store field. Use an accessible name on the control and a label that says what the list is ordered by. Follow `docs/design-rules.md` (rule 26 for wording; no em dashes in new user-visible text).

- [ ] Run the gate. `pnpm typecheck`, `pnpm lint`, `pnpm exec prettier --check` on changed files, and `pnpm test -- src/ui/sections/troops src/ui/sections/bonuses`. Then `pnpm test`. All must be green. Record counts in Notes. If the e2e suite covers the troops card, run `pnpm build` first (see the memory note: a running preview serves a stale build), then `pnpm e2e`.

- [ ] Commit this phase only. Stage only the files this phase changed (`git status --short` first). Do not stage `todos.md`, `.maestro/playbooks/performance-optimization/`, `tools/theorycraft/out/`, or `pyrrhic-my-account-2026-10-07.json`. Commit message: `Troops follow the battle selection order and can be ordered by health`. End the commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Manual Follow-Up (not executed by Auto Run)

- Owner to compare the troop list order with the battle selection screen in the game.
- Owner to confirm the health switch works on a phone-sized screen.

## Notes

### Task 1 (2026-10-10, pyrrhic)

The battle selection order is not in the repo. Owner to supply it: a screenshot of the battle selection, or the ordered list of unit ids.

What was searched:

- `grep -rni "battle" src/data docs/reference`: hits only in `src/data/types.ts`, `src/data/data.test.ts` and unit names in `src/data/tables/*.json` (Battle Griffin, Battle Boar). `docs/reference/` holds only the Mantine spike files.
- `src/data/tables/troops.json` has no order, rank or position field; units carry `group`, `tier` and `category` only.
- `src/data/tables/orders.json` `troops` (65 ids) is the **default kill order** (first to die first, `OrderTables` in `src/data/types.ts`), used by the custom-order editor. It is not the battle selection order, so it was not reused.
- `docs/research/totalstack-review.md` line 111 notes TotalStack's "Reset order" (drag to match in-game order) but records no order.

Tasks 2 to 7 wait on this. Once the order is in Notes, tick task 1 and the run resumes at task 2.

