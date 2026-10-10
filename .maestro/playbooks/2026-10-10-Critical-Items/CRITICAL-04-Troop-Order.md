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
- [x] Find the battle selection order. Search `src/data/` and `docs/reference/` for the in-game order of unit types shown on the battle selection screen (`grep -rni "battle" src/data docs/reference`). If an order is recorded, write it in Notes as a list of unit ids in order. If none is recorded, write in Notes: "The battle selection order is not in the repo. Owner to supply it: a screenshot of the battle selection, or the ordered list of unit ids." Then stop this playbook at this task (do not invent an order).

- [x] Write the failing test for the new order. In `src/ui/sections/troops/TroopsSection.test.tsx`, add a test that the troop rows render in the battle selection order from task 1 (same test shape as the existing ones in that file). Add a second test that the battle summary's order-by-health switch reorders the rows by health (lowest first) and that switching back restores the battle selection order. Run the test and confirm it is red for the right reason.

- [x] Add the battle selection order as data, not as code. Put the ordered unit ids in `src/data/` as a small table (a JSON file in the same style as `src/data/tables/*.json`), with a source note saying the order was read from the game's battle selection screen, on 2026-10-10 or the date in Notes. Do not hard-code the order in `rows.ts`. Add a `src/data/CHANGELOG.md` entry for the new table.

- [x] Use that order in the Troops card. In `src/ui/sections/troops/rows.ts`, make the display order come from the table; keep `sortForDisplay` only as the fallback for a unit id missing from the table, and say so in a comment. Do not change the group order in `rows.ts` line 18 unless task 1 showed the battle selection uses a different group order.

- [ ] Add the order-by-health switch to the battle summary. In `src/ui/sections/bonuses/TotalsFigures.tsx` (or the component that renders the battle summary, found with `grep -rn "summary.health" src/ui`), add a control that switches the troop list order between "battle selection" (default) and "health". The health order sorts by the unit's health, lowest first. The switch is a UI preference: keep it in local component state, not in the saved profile, and do not add a new store field. Use an accessible name on the control and a label that says what the list is ordered by. Follow `docs/design-rules.md` (rule 26 for wording; no em dashes in new user-visible text).

- [ ] Run the gate. `pnpm typecheck`, `pnpm lint`, `pnpm exec prettier --check` on changed files, and `pnpm test -- src/ui/sections/troops src/ui/sections/bonuses`. Then `pnpm test`. All must be green. Record counts in Notes. If the e2e suite covers the troops card, run `pnpm build` first (see the memory note: a running preview serves a stale build), then `pnpm e2e`.

- [ ] Commit this phase only. Stage only the files this phase changed (`git status --short` first). Do not stage `todos.md`, `.maestro/playbooks/performance-optimization/`, `tools/theorycraft/out/`, or `pyrrhic-my-account-2026-10-07.json`. Commit message: `Troops follow the battle selection order and can be ordered by health`. End the commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Manual Follow-Up (not executed by Auto Run)

- Owner to compare the troop list order with the battle selection screen in the game.
- Owner to confirm the health switch works on a phone-sized screen.
- Owner to confirm "Health" should read most health first (the kill order), as built, rather than lowest first.

## Notes

### Task 1 (2026-10-10, pyrrhic)

The battle selection order is not in the repo. Owner to supply it: a screenshot of the battle selection, or the ordered list of unit ids.

What was searched:

- `grep -rni "battle" src/data docs/reference`: hits only in `src/data/types.ts`, `src/data/data.test.ts` and unit names in `src/data/tables/*.json` (Battle Griffin, Battle Boar). `docs/reference/` holds only the Mantine spike files.
- `src/data/tables/troops.json` has no order, rank or position field; units carry `group`, `tier` and `category` only.
- `src/data/tables/orders.json` `troops` (65 ids) is the **default kill order** (first to die first, `OrderTables` in `src/data/types.ts`), used by the custom-order editor. It is not the battle selection order, so it was not reused.
- `docs/research/totalstack-review.md` line 111 notes TotalStack's "Reset order" (drag to match in-game order) but records no order.

Owner supplied the order on 2026-10-10: the troop and monster lists below, copied from the battle selection screen. The owner said to take the order and disregard the numbers shown beside each name (those are counts, not part of the order). Each name is mapped to its unit id in the table; every name matched a table id.

Monsters (20, in game order):

```json
["wind-lord","black-dragon","destructive-colossus","ancient-terror","ruby-golem","jungle-destroyer","crystal-dragon","troll-rider","ettin","fearsome-manticore","flaming-centaur","desert-vanquisher","ice-phoenix","magic-dragon","many-armed-guardian","gorgon-medusa","stone-gargoyle","emerald-dragon","battle-boar","water-elemental"]
```

Troops (61, in game order):

```json
["battle-griffin-7","josephine-2","battle-griffin-6","josephine-1","smiter-2","whitemane-2","battle-griffin-5","siege-ballistae-7","smiter-1","whitemane-1","purifier-2","punisher-2","legitimist-2","duelist-2","siege-ballistae-6","mounted-knight-7","lion-rider-7","purifier-1","punisher-1","legitimist-1","duelist-1","catapult-5","mounted-knight-6","lion-rider-6","vulture-7","heavy-arbalester-7","heavy-halberdier-7","heavy-knight-7","deadshot-7","catapult-4","rider-5","lion-rider-5","vulture-6","heavy-arbalester-6","heavy-halberdier-6","heavy-knight-6","deadshot-6","catapult-3","rider-4","archer-5","spearman-5","swordsman-5","vulture-5","deadshot-5","catapult-2","rider-3","archer-4","spearman-4","swordsman-4","catapult-1","rider-2","archer-3","spearman-3","swordsman-3","rider-1","archer-2","spearman-2","swordsman-2","archer-1","spearman-1","swordsman-1"]
```

Table units absent from the owner's list (left out of the order, not invented a position): troops `corax-1`, `corax-2`, `royal-lion-1`, `royal-lion-2`; monsters `devastator-1`, `devastator-2`, `fire-phoenix-1`, `fire-phoenix-2`, `kraken-1`, `kraken-2`, `trickster-1`, `trickster-2`. Owner to say whether these appear on the battle selection screen and, if so, where.

Working files: `.maestro/playbooks/Working/order/` (the raw paste and the mapping).

Task 1 is ticked. Tasks 2 to 7 resume from here.

### Task 2 (2026-10-10, pyrrhic): the tests target the March pills, not the Troops card

**Read this before tasks 3 to 5.** The task text pointed at `TroopsSection.test.tsx` and at `TotalsFigures.tsx`, but neither holds a per-type troop list:

- The Troops card draws four group rows (two tier steppers each) and the top tier's chips. There is no list of troop types to put in battle selection order.
- `TotalsFigures.tsx` is the Bonuses card's army bonus totals (health %, strength %), not a battle summary.
- The per-type list that reads like the battle selection is **the March's pills** (`src/ui/sections/march/MarchPills.tsx`, built by `poolRows` in `src/ui/sections/march/rows.ts`). Today they are drawn in **kill order**, the order the engine returns the stacks in (most total health first, the order they fall; see `manual.ts` line 65 and the test "every stack has a pill, in kill order").

So the two tests went into `src/ui/sections/march/march.test.tsx`, after "every stack has a pill, in kill order":

1. "the pills follow the battle selection order by default, not the kill order": the Leadership pills are drawn in the owner's battle selection order (the list is written into the test as the spec, `BATTLE_SELECTION_ORDER`); a type the selection does not list (mercenaries, the 12 unlisted table units) keeps its kill-order place after the listed ones. Guards check the march has more than 2 stacks and that the two orders differ. Also expects a radio named "Battle" checked by default.
2. "a switch orders the pills by health, as the battle summary does, and back": a `radiogroup` named "Order the stacks by" with radios "Battle" and "Health". Health = the kill order (most health first), Battle restores the selection order, and nothing about the choice reaches the saved profile.

Decision taken without the owner: **"Health" means the existing kill order (most total health first)**, not "lowest first" as task 5 says. Reason: the owner's words are "order by health from the battle summary", i.e. the game's own health order, and the pills already draw that order; keeping it as the switch's other side loses nothing. Owner to confirm the direction (Manual Follow-Up).

Red, for the right reason (`pnpm exec vitest run src/ui/sections/march/march.test.tsx -t "battle selection order by default|orders the pills by health"`): test 1 fails at the order assertion (drawn `swordsman-1, archer-1, ...` = kill order, expected `rider-3, rider-2, ...`); test 2 fails because no "Order the stacks by" radiogroup exists. Typecheck and eslint clean on the test file.

Consequences for the remaining tasks:

- Task 3 (data table): unchanged.
- Task 4: apply the order in `poolRows` (`src/ui/sections/march/rows.ts`), not in `src/ui/sections/troops/rows.ts`. Keep the engine (kill) order as the fallback for ids missing from the table. Update the old test "every stack has a pill, in kill order" to the new default (it pins the old order and goes red once task 4 lands).
- Task 5: the switch goes on the March pane next to the pills (a `SegmentedControl` like `MarchRaiseControl`, label "Order the stacks by", options "Battle" | "Health"), local component state only. `TotalsFigures.tsx` is not touched.


### Task 3 (2026-10-10, pyrrhic): the order is a data table

- `src/data/tables/battleSelection.json`: `{ source, troops (61), monsters (20) }`, copied from the Task 1 lists. `source` says it was read from the battle selection screen on 2026-10-10 and that unlisted units are left out on purpose.
- Wired like every other table: `BattleSelectionOrder` type (`src/data/types.ts`), strict `battleSelectionSchema` in `TABLE_SCHEMAS` (`src/data/schema.ts`), canonical key order in `scripts/data-tables.ts`, loader `battleSelection` exported from `src/data/index.ts`.
- New integrity test in `src/data/data.test.ts`: every listed id is a known troop/monster, each once.
- `src/data/CHANGELOG.md`: "v1, amended 2026-10-10 (no bump)". `dataVersion` stays 1, as with the 2026-10-09 amendment (display-only table, no value changed). The owner decides whether to bump anyway.
- Note for task 4: the march test spec lists **monsters first, then troops**. Concatenate `battleSelection.monsters` then `battleSelection.troops`.
- Checks: `vitest run src/data` 54/54, typecheck and eslint clean, prettier clean, `data:check` "15 tables valid and canonical". `pnpm data:check` fails in this shell because Node 22 has no `.ts` support (this was already true before the change). I ran it with `npx tsx scripts/data-check.ts` instead.

### Task 4 (2026-10-10, pyrrhic): the March pills follow the table

Applied where Task 2 pointed (the March pills), not in `src/ui/sections/troops/rows.ts`, which has no per-type list.

- `src/ui/sections/march/rows.ts`: new `PillOrder = 'battle' | 'health'` and an `order` option on `poolRows` (default `'battle'`). The rank is built from `battleSelection.monsters` then `battleSelection.troops` (`@/data`); nothing is hard-coded. A type the table does not list ranks after every listed one and the stable sort keeps it in kill order (comment on `battleRank`). `'health'` returns the engine's kill order untouched. `useMarch.ts` still calls `poolRows` without `order`, so the default applies; Task 5 passes the switch's value.
- `march.test.tsx`: "every stack has a pill, in kill order" became "... in battle selection order", pool by pool.
- `vitest run src/ui/sections/march`: 324 pass, 2 red, both only for the missing "Battle" / "Health" radios (Task 5). The order assertion of "the pills follow the battle selection order by default" now passes. Typecheck, eslint and prettier clean on the changed files.

