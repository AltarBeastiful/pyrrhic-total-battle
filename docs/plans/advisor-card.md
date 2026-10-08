---
type: plan
title: The "What to upgrade next" card (W17 C4), design note
created: 2026-10-08
tags:
  - advisor
  - ui
related:
  - '[[Progression-Advisor-Plan]]'
  - '[[design-rules]]'
  - '[[tight-default]]'
---

# The "What to upgrade next" card — design note

What an implementer of W17 C4 needs: where the card goes, which rules it answers to, what it is built from,
and the state behind it. Source: `docs/plans/progression-advisor.md` §4 C4 and §7, and the owner's answers of
2026-10-08 in `.maestro/playbooks/Initiation/Phase-03-Advisor-Card-UI.md`.

## 1. What the card is

A **next-investment** card: "what should I upgrade first to get better marches?" The upgrades take time in the
game, so the answer is about future marches, never the one on screen. Wording reads "Next upgrade", "what each
one would bring", never "change this march". It is computed on a **Compute** button only (owner §7.5), never
on Generate.

**Placement: below the battle summary.** A new part of `MarchSection` (`src/ui/sections/march/MarchSection.tsx`)
right after part 4, `<PlanFold />`, and before the notices (part 5). It is a `Sections` child, so it gets the
pane's hairline and 16 px for free; it draws `null` when there is no plan, which removes its line with it
(the same trick `PlanFold` uses). On a desktop that is inside the sticky March pane (`shell/MarchPane.tsx`);
on a phone it is inside the March sheet. A long list makes the pane taller than the window: `usePaneStick`
already handles that with its tail stand, so no layout work (ship crowded, refactor later).

## 2. Design rules that apply (`docs/design-rules.md`)

| Rule | What it means for the card |
|---|---|
| 1 | The march's answer stays first: the card sits under the plan, never between the recap and the army. |
| 3, 4 | Configure once, generate often: the card is idle (one button line) until asked; the other stops are folded. |
| 5 | No duplication: the card never repeats the recap's figures; it shows only deltas. |
| 15 | Nothing without value: **no per-cost column** while no probe has a known cost (all v1 probes have none, so the column is absent entirely, header included); the cut note only when the cut fired; "no gain" rows stay (they are a fact), but no empty failure block. |
| 17 | One page scroll: the list is never in an inner scroller. |
| 18, 19 | Works one-handed at 390 px with no sideways scroll; text ≥ 13 px except the 12 px muted meta the pane already uses (`classes.meta`). |
| 20, 22 | No new colours: tone by text colour (`dimmed`, `red` for a failure line), glyphs for the families. |
| 21 | Glyphs through `Glyph` (`src/ui/domain/Glyph.tsx`): health 🛡️/strength ⚔️ marks exist as `BONUS_KEY_GLYPHS`; housing uses the pool's own glyph. |
| 23 | Stock Mantine only (`Button`, `Progress` or text progress, `Table`/`Stack`, `Text`, `Tooltip`), plus the kit's `Disclosure`. No new CSS module rules beyond what `march.module.css` already has. |
| 24 | A gain is said by a sign and a word, never by colour alone; Cancel and Compute reachable by keyboard; the progress has an `aria-live` text. |
| 26 | Our own words, sentence case: "What to upgrade next", "Compute", "Cancel", "12 / 29 done", "no gain". |
| 28 | Figures in the recap's own notation: compact with the exact figure on hover. |

Also: **"merc", not "hired"** in every label (memory rule; `docs/design.md` §7 glossary).

## 3. Existing pieces to reuse

- **Shape of the async module**: `src/ui/sections/march/positionsSearch.ts` — a zustand store, module-level
  client and `AbortController` (not store state), a key that is the plan's identity (`planId` WeakMap,
  `positionsKey(plan, request)`), `settle` dropping answers whose key is no longer on screen, `stop()` that
  aborts and forgets, and a hook with an effect that stops when the plan goes away. Copy this shape; export
  `planId` (or reuse `positionsKey`) rather than writing a second WeakMap.
- **The pass**: `runAdvisor(input, probes, pool, { signal, onProgress, headline })` in `src/worker/advisor.ts`
  → `{ baseline, rows, cut, failed }`. Probes: `genericProbes()` (`src/engine/probes.ts`, 29 of them). Input:
  `buildPlanRequest(profile, setup)` (`src/state/derive.ts`), the same `CampaignInput` Generate plans with.
  Ranking per stop: `rankAdvice(rows, pick)` and `headlineOf(row, pick)` (`src/engine/advisor.ts`), so a move
  of the bar re-ranks without a new pass.
- **The pool**: `createCalcPool()` (`src/worker/pool.ts`), one module-level instance, lazily built. It falls
  back to one inline client with no worker; the card then says why in one line instead of computing
  (`canPrice()`-style check, `typeof Worker` / `client.mode === 'worker'`, as `positionsSearch.ts` does).
- **Cancellation from Generate**: `runGenerate` (`src/ui/sections/march/generate.ts`) calls
  `useRunStore.getState().start(...)`, which sets `plan: null`. The card's hook watches the plan's key like
  `usePositions` does, so a new Generate or a profile switch (`reset()`) aborts the pass and drops stale rows.
- **Headline stop**: `useRunStore((s) => s.planPick)` + `pickOf(plan, planPick).pick` (`runStore.ts`); the
  sweet spot by default is already what `openingPosition` lands on.
- **Numbers**: `compactTwo` (`src/ui/sections/march/format.ts`) for figures, `signedPercent` for the % of
  current damage, `amount` for the exact figure in the `title`. `DeltaText` (`src/ui/domain/DeltaText.tsx`)
  is the model for "sign + arrow + word, colour never alone", and its `exact` prop for hover digits.
- **Preview look**: the raise control's tooltip in `MarchPills.tsx` (`previewOf`, `figureWords`): `Glyph` +
  label + value + dimmed change, `Text size="xs"`, a `Group gap={6} wrap="nowrap"` per figure. Rows of the
  card copy that line.
- **Folds**: `Disclosure` from `src/ui/kit` for "Other stops" (title + summary, closed by default).
- **Headings and meta**: the plan block's heading in `PlanPanel.tsx` (`PlanFold`) and the 12 px dimmed meta
  (`classes.meta`) for "12 / 29 done".
- **Failure / note lines**: plain `Text size="sm" c="dimmed"` lines as `MarchShelterNote` / `MarchEditedNote`
  write them; an `Alert` only if the whole pass failed (the one tinted block allowed, `docs/design.md` §2).

## 4. State shape

```ts
type AdvisorStatus = 'idle' | 'running' | 'done' | 'cut' | 'cancelled' | 'failed';

interface AdvisorEntry {
  /** positionsKey-style identity of the plan + the account it was read for. */
  key: string;
  status: AdvisorStatus;
  /** Jobs settled / total (baseline + probes), from onProgress. */
  done: number;
  total: number;
  /** runAdvisor's answer, kept whole; the ranking per stop is derived (rankAdvice), not stored. */
  result: AdvisorResult | null;
  /** The baseline failed or the pass threw: one line of why. */
  error: string | null;
}

interface AdvisorState {
  entry: AdvisorEntry | null;
  begin(key: string, total: number): void;
  progress(key: string, done: number, total: number): void;
  settle(key: string, result: AdvisorResult): void; // 'cut' when result.cut.length > 0, else 'done'
  fail(key: string, message: string): void;
  cancel(): void; // abort, status 'cancelled', rows kept only if they are this key's
  stop(): void;   // abort and forget (new plan, profile switch)
}
```

- The **headline stop is not stored**: it is `pickOf(plan, planPick).pick` read at render, so moving the bar
  re-ranks the same rows (`rankAdvice(result.rows, pick)`).
- Every `settle`/`progress`/`fail` with a key that is not `entry.key` is dropped (`positionsSearch.ts` rule).
- The controller and the pool are module state, not store state.
- Generate never waits on the card: the pass runs on its own pool, separate from `getCalcClient()` and the
  positions client, and Generate cancels it rather than queueing behind it.

## 5. Row content

One row per probe, ranked on the headline stop:

- glyph + label (`Health +1 % ranged`), then the gain as **% of current damage** (`signedPercent`, from
  `StopAdvice.damagePercent`) and the damage it would reach in `compactTwo` with the exact figure on hover;
- a clamped or zero row reads **"no gain"**, never a minus;
- `worse` adds a faint line: "the plan gets worse here: search issue" with the re-planned damage;
- no per-cost column (no v1 probe has a cost; rule 15);
- the other stops of the bar behind one `Disclosure` per card ("Other stops"), each a compact list in the
  same row shape.

Left open (for the story row): increments are fixed (+1 point, +1 % of a pool); the real step in the game
depends on the talent/research tree and is deferred. Hero level/star, trio swap and leadership/dominance
large-step probes are later probe families (C2, C5), and the card takes them as more rows with no change.

## 6. Two passes (Phase 04b, owner 2026-10-08)

The card has **two buttons and two independent passes**: "Compute my upgrades" (the typed list alone) and
"Compute default upgrades" (the 29 generic probes at their default increase: +1 point on a bonus line, +1 % of a
housing pool, read from `PROBE_BONUS_DELTA` / `PROBE_HOUSING_PERCENT`). `advisorSearch.ts` holds
`entries: { mine, default }`, each with its own key, `AbortController`, progress, answer, cut and failed lists;
they share the one pool, which queues their jobs. A new Generate, a profile switch or an account edit stops and
forgets both; a typed-list edit changes only the key of `mine`. Cancel is per kind. Each list sits under its own
heading ("Your upgrades", "Default upgrades") shown once it has rows; the ordering line stays on "Your upgrades".
"Compute my upgrades" with nothing typed is disabled beside one dimmed line, "Type an upgrade first."

## 7. What the gain costs the march (Phase 04b, engine side)

Display only: no rating, ranking or plan reads it, and the benchmark and goldens moved nothing when it landed.
In `src/engine/advisor.ts`:

- `gainReading(stop)`: the march the gain is read from, `replanned` where `from === 'replanned'`, `repriced`
  where `from === 'repriced'`, `null` with no gain. The card's damage line (`reachedDamage`) reads it too, so
  the damage and the cost a row prints are always one reading.
- `costChange(stop)`: `{ silver, gold, seconds }`, that reading's bill minus the current march's, raw amounts
  per march, negative where a cost falls; `null` on a row with no gain (clamped, or nothing moved), which
  prints no cost line.
- `outstandingSeconds(current.bill, change)`: `change.seconds` when its size is **larger than** both
  `share` of the current queue and `seconds`, a saving as much as a rise, else `null`. The bound is
  `CAMPAIGN.outstandingTraining` (`src/config.ts`, 10 % and 3 600 s); a change of exactly 10 % or exactly an
  hour is not printed. A third argument hands over another bound (for the experiment).

## 8. The march cost on the card (Phase 04b, card side)

`MarchCost` in `AdvisorCard.tsx`: one dimmed meta line under the damage line of every row with a gain, on the
headline list and on every folded stop, read off `costChange(stop)` (the same reading the damage line reads).

- **Words**: what rises follows "costs" with its plus, what falls follows "saves" with no minus, the two groups
  joined by "; " ("costs 🪙 +81K silver; saves 💰 64 gold"). Silver and gold in `compactTwo`, printed only when
  the change does not round to "0" there; the training time in the recap's `duration` shape ("⏳ +2d 3h
  training") only when `outstandingSeconds` returns it. Each figure wears the recap's glyph (silver, gold,
  time) and never wraps apart from it.
- **Nothing printed** on a "no gain" row, or when every figure rounds away: no "same cost" line (rule 15).
- **Hover**: the whole line's `title` names it the march cost and gives every printed figure in full and signed
  ("March cost: -300 400 silver, -64 gold, -3d 20h training"), so a typed upgrade's own price ("costs 4 talent
  points", the per-cost line under it) is never read as this one.
- **Rules**: 5, 15, 19, 20–24, 26, 28. Display only: no rating, ranking or plan reads it.
- **Measured** in experiment 192 (`tools/theorycraft/out/192-the-upgrade-cost-readout.md`, the default pass
  on 19 armies and the owner's account of 2026-10-07): a line under 69 of the 153 top-10 gaining rows; the 84
  others leave the bill exactly as it is (none rounds away). The 10 % / 1 h bound prints the time on 3 of 153
  (2.0 %) and on 30 of 605 readings over every stop (5.0 %), the share deciding; half the printed silver
  figures are under 0.1 % of the march. The best gain is the costliest in silver or gold on 12 of 19 armies.
