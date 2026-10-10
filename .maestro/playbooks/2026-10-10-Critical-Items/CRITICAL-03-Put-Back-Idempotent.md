# Critical 03: Putting a troop back follows Tight and is idempotent

Source: `todos.md`, entry "putback shoudld follow tight rules but keeping the troops/merc/monster same set. Goal: put back and keep away a troop or contrary should end up idempotent" and the earlier entry on the SW1 put-back (27M damage, trade halved). Same bug as backlog B-10 (`docs/backlog/B-10-put-back-halves-trade.md`). Critical item 3 of the 2026-10-10 review. Playbook: `2026-10-10-Critical-Items`. Agent: pyrrhic. Project: `/home/remi/projects/pyrrhic-totalbattle`.

## Target behaviour (owner's words, paraphrased from todos.md)

- Putting a left-out troop back raises the march with the **same rules as Tight**: the Tight raise (`src/kernel/raise.ts`, rated by `CAMPAIGN.markerRates`), not a different sizing that halves the trade.
- Putting a troop back keeps the **same set** of troop types, mercenaries and monsters that were on screen. A put-back adds the one type and sizes it; it does not re-type or drop the others.
- **Idempotent:** put a troop back, then take it out again, and the march returns to the exact counts it had before. Putting back a type that is already in is a no-op. Putting back twice is the same as once.
- All the calculation stays in the kernel (`kernel/assembly`, mirrored by `src/kernel/`), not in the TypeScript UI path.

## Where the code is today

- `src/ui/sections/march/formation.ts`: `removeFromFormation`, `putBackInMarch`, `putBackAllInMarch`. Each one calls `resizeMarch` with `putBack` or `tookOut`.
- `src/ui/sections/march/generate.ts`: `resizeMarch` (about line 263) reads the last snapshot and the run's `planPick`, sets included and left-out ids with `run.setIncluded`, then re-sizes. The Tight position is applied here (around lines 51 and 111).
- `src/engine/plan.ts`: the put-back pass (`PutBackPolicy`, `putBackScore`, around lines 188 and 304 to 316, and `CAMPAIGN.putBack` in `src/config.ts`). The pass can add a left-out type to a plan stop when the player's rates say it is worth it. This is where a put-back can change the set of stops and produce the halved trade.
- `src/kernel/raise.ts`: the Tight ranking (comment near line 88: "The owner's rates, which `Tight` ranks by"). Score memo noted near line 11.
- `src/ui/sections/march/picks.ts` (`putBackWords`, around line 206): the sentence shown after a put-back.
- Existing spec: `docs/PLAN.md` S-80 (put-back pass) and S-93 (tighter shape), `docs/plans/tight-default.md`, and `docs/backlog/B-10-put-back-halves-trade.md` for the fixture plan.
- Tests: `src/ui/sections/march/march.test.tsx`, `positionsSearch.test.tsx`, `raiseSource.test.tsx`, plus kernel tests under `tests/kernel/` (`bench.test.ts` exists there).
- Owner's data: `pyrrhic-my-account-2026-10-07.json` in the repo root is **untracked** and is the export that reproduces the bug. It is not a fixture yet. Do not commit it. Copy it to `tools/theorycraft/fixtures/` only in task 2, and only if that folder does not already have the owner's consent recorded in `docs/backlog/B-10-put-back-halves-trade.md`. If there is no consent, stop and write that in Notes.

## Tasks

- [x] Reproduce on the owner's export, write the findings. Turn `pyrrhic-my-account-2026-10-07.json` into a read-only reproduction using the existing theorycraft tooling (see `tools/theorycraft/` for how a fixture is loaded). Reproduce two marches: (a) the Tight march with SP3 and SW1 left out, and (b) the same march with SW1 put back. Record in Notes the damage, silver, mercs and monsters of each, and which stops the plan table offers. Do not change code in this task.

- [x] Write the failing tests first, on both the TypeScript and kernel paths (rule: "one test, both paths"). Add a test file that asserts three properties for the reproduced march: (1) **Tight rule**: after a put-back, the counts equal what the Tight raise gives for the same set of types; (2) **same set**: the set of troop types, mercenary stacks and monsters is unchanged except for the type put back; (3) **idempotent**: `removeFromFormation(x)` after `putBackInMarch(x)` restores the exact counts of the step before, and a second `putBackInMarch(x)` changes nothing. Run them and confirm they are red for the right reason. Do not loosen an assertion to get a green result.

- [x] Make the put-back follow Tight in the kernel. In `kernel/assembly` (and `src/kernel/raise.ts` for the TypeScript mirror), make the put-back sizing call the same Tight ranking as the raise position, without the put-back pass changing the set of other types. Keep the `resizeMarch` contract: it still takes `putBack`, but the sizer must size only the put-back type under Tight. The change must not touch the benchmark rating: check `tools/theorycraft/out/benchmark-latest.md` before and after, and the benchmark rating must not regress for any scenario (feedback rule: a scenario must never get worse).

- [x] Make take-out and put-back a pair. Ensure `removeFromFormation` and `putBackInMarch` are inverses over the march: the counts after take-out then put-back equal the counts before take-out, and the reverse. If the existing put-back pass in `src/engine/plan.ts` replaces the stop instead of sizing one type, make the UI path (`resizeMarch`) skip that replacement when the edit is a `putBack` on the current march. Add a comment that states this rule where it is enforced.

- [x] Make the put-back sentence match the new behaviour. In `src/ui/sections/march/picks.ts` `putBackWords`, the sentence must describe the change to the march that actually happened. No new wording rules: follow design rules 15 and 26 in `docs/design-rules.md`.

- [ ] Run the gate. `pnpm typecheck`, `pnpm lint`, `pnpm exec prettier --check` on changed files, `pnpm test` and the kernel test (`pnpm kernel:build` followed by the kernel test path). All must be green. Run the benchmark (`pnpm bench:baseline` or the existing benchmark test) and compare with `tools/theorycraft/out/benchmark-latest.md`. Record the counts and any change in the ratings in Notes. If something was red before this phase, name it and do not fix it here.

- [ ] Commit this phase only. Stage only the files this phase changed (`git status --short` first). Do **not** stage `pyrrhic-my-account-2026-10-07.json`, `tools/theorycraft/out/benchmark-latest.*` (unless this phase regenerated them and the owner has not asked otherwise: if regenerated, do not stage them and say so in Notes), `.maestro/playbooks/performance-optimization/`, or `todos.md`. Commit message: `Put-back follows Tight on the same set and is idempotent with take-out`. End the commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Manual Follow-Up (not executed by Auto Run)

- Owner to try the put-back on his own account after the change: take SW1 out, put it back, take it out, and check the march returns to the same numbers.
- Owner to confirm the sentence shown after a put-back.

## Notes

### Task 1: reproduction (2026-10-10)

Experiment `tools/theorycraft/201-put-back.test.ts` (report `tools/theorycraft/out/201-put-back.md`) reads the root export in place, read only, the way experiment 193 does (`PYRRHIC_EXPORT_2026_10_07` names another path). It is not a fixture and was not copied anywhere. Run: `THEORY=1 pnpm vitest run tools/theorycraft/201-put-back.test.ts` (the vitest config swallows console output, so read the report file). It plans the active setup with `buildPlanRequest` + `planCampaign`, opens on `defaultPlanPosition` (sweet spot), and re-sizes with the exact arguments `planStopAgain` builds (`resizeMarchOver`, `CAMPAIGN.editFills`, `CAMPAIGN.putBack`), then applies Tight with `liftedCounts` (kernel). SP3 = `spearman-3`, SW1 = `swordsman-1`.

Plan table (whole army, 9 000 leadership / 2 000 authority / 1 200 dominance):

| stop | damage | silver | gold | mercs lost | SW1 / SP3 in? |
|---|---|---|---|---|---|
| burn-saver | 15,556,901 | 2,835,512 | 2,198 | 4 | yes / yes |
| silver-saver | 15,886,919 | 1,903,650 | 4,243 | 8 | no / no |
| **sweet-spot** (opens here) | 28,082,197 | 2,994,354 | 6,391 | 10 | yes / yes |
| more-mercs | 28,180,883 | 3,002,754 | 6,450 | 11 | yes / yes |
| steady-max | 31,591,959 | 3,184,800 | 8,625 | 14 | no / yes |

The marches (sweet spot as the stop being edited):

| march | damage | silver | gold | mercs (lost) | monsters |
|---|---|---|---|---|---|
| stop, Tight | 28,139,581 | 3,002,754 | 6,391 | 100 (10) | 140 |
| (a) SP3 + SW1 out, Tight | 30,743,234 | 2,986,200 | 8,721 | 134 (15) | 193 |
| (b) SW1 put back, Tight | **27,038,525** | 2,938,040 | 6,795 | 105 (13) | 150 |
| (c) SW1 out again, Tight | 30,743,234 | 2,986,200 | 8,721 | 134 (15) | 193 |
| (d) SW1 put back again, Tight | 27,038,525 | 2,938,040 | 6,795 | 105 (13) | 150 |

Findings:

1. **The owner's 27M is reproduced**: 27,038,525 with SW1 put back, against 30,743,234 with it out (−12.1 % damage for −1.6 % silver; −29 mercs, −43 monsters). This is the "trade halved".
2. **Mechanism: SW1 is the lowest-HP troop stack, so putting it back lowers the shelter floor.** Every hired stack must stand under the weakest troop stack; 2 303 swordsmen-1 pull that floor down, and the re-size has to shed mercs (134 → 105) and monsters (193 → 150). The leadership SW1 takes (2 303) comes out of the stronger stacks too. The plan itself agrees SW1 costs damage at this level: steady-max, its highest-damage stop, already leaves SW1 out.
3. **The put-back did not use the `putBack` trade** (no `traded`, fill 100, shape `elite`), and it did **not** change the set: (b) has exactly the types of (a) plus `swordsman-1`. The set rule is already kept here.
4. **Tight moves nothing after an edit**: in (a)–(d) the Tight counts equal the re-sized counts. The re-sized march already sits on the shelter ceiling, so Tight has no room. The put-back is therefore "Tight on the same set" in its result, but by way of the sizer (`resizeMarchOver` elite shape) rather than the Tight raise.
5. **The walk is already idempotent at the engine level**: (c) = (a) and (d) = (b), count for count. Out → back → out → back cycles between the same two marches. What is *not* restored is the opening stop: (b) is not the sweet spot (27.04M vs 28.14M with Tight), because the re-size keeps SP3 out and re-sizes every stack. If task 2's idempotence test is pinned to these engine calls it may already be green; the red has to come from the UI path (`resizeMarch` / `planStopAgain`, run store state) or from the Tight-rule assertion (counts must equal the Tight raise on the same set, which here they do). Task 2 should check this before writing a test it expects red.
6. **"No tight trade at that point"**: the plan table is the Generate-time table over the whole army; after an edit the bar still shows the five stops above, none of which is the edited set, so no row matches the 27M march. That is a table/explanation issue, not a sizing bug.


### Task 2: the failing tests (2026-10-10)

`src/ui/sections/march/putBack.test.ts` drives the real presses (`removeFromFormation`, `putBackInMarch`) on the stores and the inline calc client, after a real `runGenerate` on the owner's export (read in place, read only; skipped when the file is absent, so it is skipped on any other machine). What it reads is what `useMarch` draws under the default position: the filed march with `liftedCounts(…, Tight)` over it. **Both paths**: the whole file runs on the plan kernel and on `decliningKernel` (TypeScript sizer and march); `Tight` is the kernel's on both, as the TS raise search is retired. Run: `pnpm vitest run src/ui/sections/march/putBack.test.ts` (~25 s).

Each of the five stops (chosen through `chosenStop`, so the bar opens on it) is walked with SW1 and SP3: a stop that fields the type takes it out and puts it back, a stop that leaves it out puts it back and takes it out.

Result: **12 red, 32 green, the same 6 reds on each path with the same counts.**

| stop | SW1 / SP3 in stop | round trip back to the stop (Tight rule) | same set | idempotent after the first edit |
|---|---|---|---|---|
| burn-saver | yes / yes | **red** (SW1 2 211 → 2 122; mercs 10 → 28 each) | green | green |
| silver-saver | no / no | **red** (lands on the "both out" re-size: archer-1 1 668 vs 1 138) | green | green |
| sweet-spot | yes / yes | green | green | green |
| more-mercs | yes / yes | green | green | green |
| steady-max | no / yes | **red** (lands on the full-set re-size: archer-1 1 579 vs 1 638) | green | green |

What the red says (the right reason): **the first edit leaves the stop and never comes back.** Any edit, put-back or take-out, replaces the stop's own march by the re-size of the new set (`planStopAgain` → `resizeMarchOver`), and the inverse edit gives the re-size of the stop's own set, which is not the stop. Sweet spot and more-mercs pass only because the re-size of their own set happens to pick the `stop` shape (S-117). After the first edit the walk is a function of the set alone: out/back cycles are exact, and a second put-back is a no-op (the sweet-spot `idempotent` tests are green). The set is kept on every walk. So tasks 3–4 should make the re-size of the stop's own set return the stop's own counts (and the burn-saver case shows the hired caps: the re-size raises mercs from the stop's 10 to 28 because `capOf` is the stock bound, not the stop's count).

Earlier draft finding, kept for the record: on the sweet-spot stop alone (experiment 201's walk), all three properties were already green; the red only appears on the other stops, which is why the test walks all five.

The test is committed red, as the TDD cycle asks; it is skipped wherever the export is absent, so CI is unaffected.


### Task 3: the put-back follows Tight on the same set (2026-10-10)

The fix sits where task 2's red pointed: the re-size of the stop's own set. `resizeMarchOver` (`src/engine/plan.ts`, the plan's re-size, which the `resize` job runs on both paths; the sizer under it is the kernel's) now answers with **the stop's own march, untouched**, when the types it is asked for are exactly the ids of the stop's counts (`sameSetAsStop`: troops + hired, no more, no less, every stop hired count within its cap). Before, the stop shape was ranked by damage against the re-sized shapes, so an edit and its inverse landed on a re-size of the stop's set instead of the stop (burn saver: mercs 10 → 28; silver saver and steady max: another troop split). Nothing else changes: any other set is re-sized as before, so a put-back still adds the one type to the set on screen, and the stop's march with Tight on top is the march the bar opened on (the "Tight rule" of the test).

On the instruction "the sizer must size only the put-back type under Tight": experiment 201 showed Tight moves nothing after an edit (the re-sized march already sits on the shelter ceiling), so the re-sized counts *are* the Tight counts on that set; no separate Tight sizing was added, and `src/kernel/raise.ts` / `kernel/assembly` are unchanged. The re-size itself is not ported to AssemblyScript (it never was); the one new rule lives in the engine function both paths call.

- `pnpm vitest run src/ui/sections/march/putBack.test.ts`: **44/44 green** (was 12 red), on the kernel and the TypeScript path.
- `tests/engine/plan-resize.test.ts` + `src/ui/sections/march/`: 351/351 green. Typecheck, eslint and prettier clean on `plan.ts`.
- Benchmark (`tests/engine/plan-benchmark.test.ts`, 20/20): `benchmark-latest.md` differs from the copy taken before the change only in the run stamp and the timing table; every rating row is identical (the benchmark does not call `resizeMarchOver`). The two `benchmark-latest.*` files were restored to their pre-run contents (they already carried uncommitted changes that are not this phase's) and are not staged. Before/after copies: `Working/c03-bench-before.*`, log `Working/c03-bench.log`.

Task 4 (take-out and put-back as a pair) is now green in the test as well; it remains for the next run to add the rule comment in the UI path and check the reverse direction on a non-stop march.



### Task 4: take-out and put-back as a pair (2026-10-10)

No engine change was needed after task 3. The pair holds because `planStopAgain` (`src/ui/sections/march/generate.ts`) always re-sizes **the stop** over the set that is in, never the march the last press left, so the answer is a function of the set alone, and the stop's own set answers with the stop (`sameSetAsStop`). The plan's put-back pass (`putBackOn`, which can swap a stop at Generate time) is never run on an edit; the only put-back rule an edit sees is the `CAMPAIGN.putBack` fill trade inside `resizeMarchOver`, itself a function of the set. Nothing had to be skipped. The rule is now stated in a comment on `planStopAgain`, where it is enforced.

Reverse direction off the stop: a new test in `putBack.test.ts` takes SP3 and SW1 out of the sweet spot, then for each puts it back and takes it out again, and checks the counts equal the step before. `pnpm vitest run src/ui/sections/march/putBack.test.ts`: **46/46 green** on both paths. Typecheck, eslint, prettier clean on the two changed files.


### Task 5: the put-back sentence (2026-10-10)

Two sentences speak about a put-back, and both could say something that had not happened after task 3:

- **The line under the pills** (`resizeWords`, `src/ui/sections/march/rows.ts`), written after every press. A press whose inverse lands back on the stop used to read "Re-sized … your merc stacks are re-sized to what the troops shelter", while the march is the stop's own, untouched. `MarchResize` now carries `onStop` (set in `planStopAgain` when the answer equals the stop count for count; always `false` on a sizer run), and the line then reads **"Back on the plan's march, count for count."**
- **The plan fold** (`PlanFold`, `PlanPanel.tsx`). `putBackWords` (`picks.ts`) describes the plan's Generate-time put-back on the stop, so it is now drawn only while the stop's march is on screen; a hand edit that leaves the stop replaces it with the existing "has changed" line. That warning used to key on `leftOutByPlayer` alone, so a put-back of a type the stop leaves out (steady max + SW1) showed no warning, and a round trip back to the stop kept one. It now reads the edit's own answer (`resize.onStop`), falling back to `leftOutByPlayer` when no edit has been computed; a standing raise still counts as a change (S-142), which with the Tight default means the warning stays up under Tight, as before.

No new wording rules (design rules 15 and 26): one existing line is swapped for a shorter true one, and one line is hidden when it describes nothing on screen.

Tests: `rows.test.ts` (the on-stop line), `PlanPanel.test.tsx` (the fold's two lines under an off-stop put-back and back on the stop; `resize` now reset in `beforeEach`), and `putBack.test.ts` checks `onStop` is `false` after the first press and `true` after its inverse on every stop, on both paths. `src/ui/sections/march/`: 324/324 green; `putBack.test.ts` 46/46; typecheck, eslint, prettier clean on the changed files.

