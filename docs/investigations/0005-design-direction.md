# 0005 — Design direction (D-19)

Plan only; no source changed. Eight before-shots in `0005-design-direction/`, cited by short name.

## 1. Diagnosis against the calibration list

| Tell | Us | Shot |
|---|---|---|
| Cream + serif + warm-clay accent | **Yes.** `bg #f6f4ef` (guide: #F4F1EA), Fraunces on every card title, `accent #8e5017`. | `desktop-light-full` |
| Near-black + one bright accent | **Yes.** `#101319` and one amber `#d9963c`: Generate, FAB, every selected row, focus. | `desktop-dark-march` |
| Identical rounded cards, one shadow, washes | **Yes.** Five equal cards, each with border *and* shadow *and* tonal step (§8 rule 1: pick one); `--pyr-texture` adds two washes. | `desktop-light-full` |
| Middle-dot meta strings | **Yes, ~15 sites.** `avg 19.64M · min 19.05M · 15 hits`; `Tier 6 · Monster · Beast`. | `desktop-dark-march` |
| Eyebrow labels | **Yes.** Tracked caps (`ConflictDialog.tsx:44`, `Menu.tsx:35`), and a bare label over every block: `Tier`/`Role`/`Race` is three rows of chrome for one list. | `desktop-dark-battle` |
| Monospace data feel | **Half.** `font-mono` only in the share box, but every datum is a boxed code plus a tabular figure. | `phone-dark-march` |
| One radius regardless of hierarchy | **Yes.** `radius-card` on cards, dialogs, popovers, menus; `radius-control` on buttons, fields *and* tiles; chips are pills. | `kit-dark` |
| `→` in link/button text | **No** — two, prose and a comment. | — |

## 2. Grounding

**The kill order.** Research §3: every stack carries nearly the same total HP, decreasing by tiny
margins along the order in which they die — a chart waiting to be drawn, and ours alone.

**The three pools.** Leadership, Authority and Dominance are meters filled to the brim on the game's
Start March screen. We print `84,300 / 84,300` as text; it is a vessel.

**Roman numerals, square frames.** The game writes `Swordsman I`; its portraits we cannot ship, its
numerals cost nothing. Our tiles say `3`.

**Boldness in one place: the kill-order column** — each stack a flat bar as long as its total HP,
group-coloured, first to fall on top, under one huge damage figure. The rest stays iron and quiet.

## 3. Design plan

**Color.** Five group hues are fixed and load-bearing, so a sixth accent hue steals from them. The action
colour is therefore not a hue but **metal** — struck silver on dark, dark iron on light — which is also
what a march costs. The neutrals take a faint green cast (hue ≈ 155) from the guardsmen family. No cream:
light is limewashed stone.

Dark — **Slate** `#161A19` page · **Forge** `#1E2423` card · **Anvil** `#2B3231` raised/selected ·
**Chalk** `#E7ECE9` ink · **Ash** `#9DA7A3` muted · **Silver** `#D8E0DC` action and focus.
Light — **Limewash** `#ECEFEC` · **Paper** `#FAFBFA` · **Stone** `#DEE3DF` · **Pitch** `#131917` ·
**Slate-grey** `#565F5B` · **Iron** `#262E2B` action and focus.

Group hues and meanings keep, but the five `strong` inks even onto one lightness band (engineers down,
specialists up) and each `soft` becomes one tonal step tinted 12 % dark / 15 % light — tinted iron, not
five coloured blocks. `*-edge` retires: `strong` clears 4.5:1, so it clears 3:1. Semantics shrink to
**only destruction keeps a hue**: `danger` stays ember, `warn` is that ember as ink on `raised` with the
triangle, and `ok`/`info` drop the green and steel blue that collided with guardsmen and specialists.

**Type.** Both bundled families stay; their jobs swap. Fraunces stops titling every card — that is what
makes the page read as an article — and becomes **the numeral face**: the roman tier, and the hero figure.
Inter takes titles, heavier and tighter, and keeps column-compared figures tabular. Bringhurst's sizes
over our 13 px floor: **13** label (Inter 500) · **16** body (400/1.5) · **21** card title (600,
−0.015 em) · **24** stack count (600, tabular) · **48** expected damage (Fraunces 300, `opsz 144`,
`SOFT 0`, `WONK 0`). 14 and 20 die; measure ≤ 70 ch.

**Layout.** M3 structure unchanged. The setup column stops being five floating cards and becomes **one
continuous sheet** split by a full-bleed hairline and 32 px of space, so the March card is the page's
only radiused, elevated object — the truth about the hierarchy. Radius by what a thing is: sheet 0,
March card 12, controls 6, tiles 4 (square frames, like the game's), chips 6 (M3's chip corner), bottom
sheets 28, full round only on avatar and FAB. Inside the sheet, separation is hairline and space;
elevation is for the answer and overlays. Density by purpose: data rows 32 px desktop / 44 px touch,
controls 44 px. Left-aligned on an 8 px grid, figures right-aligned in column.

```
March pane (360 dp)              A Troops row
┌────────────────────────────┐
│ March            just now  │   ▌Guardsmen   ⟨I⟩──⟨III⟩ at III [ARC][SP][RD]
│ 19,639,721                 │   ▌Specialists ⟨I⟩──⟨ I ⟩ at I   [SW]
│ expected damage            │   ▌Engineers   ⟨none⟩
│ 19,048,721    15           │   ▌Monsters    ⟨none⟩
│ worst opening hits landed  │
│ 34,274,200    0            │   ▌ = 3 px group bar
│ silver        gold         │
│ Leadership ██████ 84,300   │
│              of 84,300     │
│ Falls first ────────────── │
│ ▌I  Swordsman I ███ 12,846 │
│ ▌I  Archer I    ███ 12,822 │
│ ▌I  Rider I     ██   6,386 │
│ ▌III Rider III  █    1,972 │
│ Falls last ─────────────── │
│ [Copy all counts] Edit     │
└────────────────────────────┘
```

**Principles.** 1. The only colour on the page is a unit's colour. 2. One object floats — the answer;
the setup is a page. 3. Length is a datum: a bar is a number the engine computed. 4. Structure replaces
separators: a dot string becomes cells, a caption, or a chip. 5. The game's words and numerals over
invented UI vocabulary.

## 4. Self-review — would I produce this for any similar brief?

Three parts failed. *The metal accent* is the house style of half the dark web; it survives only because
it is forced — five fixed unit hues mean any sixth competes with data — so I cast the neutrals green and
made light limewashed stone, not the grey-white I first wrote. *Fraunces for numbers*: my draft gave it
the tiers **and** the counts, but counts are compared down a column and Fraunces is not reliably tabular,
so it keeps the roman tier and the hero figure only. *The HP bars* are one step from decoration, kept
because their length is a number the engine computed. Also cut: steel-blue `info`, green `ok`, the
texture, pill chips, the `sm`/`lg` steps, `*-edge`.

## 5. Application list

### Token changes (`src/index.css`, both themes)

| `--pyr-*` | Dark old → new | Light old → new |
|---|---|---|
| `bg` | `#101319` → `#161A19` | `#f6f4ef` → `#ECEFEC` |
| `surface` | `#181c24` → `#1E2423` | `#ffffff` → `#FAFBFA` |
| `raised` | `#20252f` → `#2B3231` | `#eeebe4` → `#DEE3DF` |
| `sunken` | `#0a0d12` → `#101413` | `#e9e5db` → `#D5DBD7` |
| `fg` | `#e9e6df` → `#E7ECE9` | `#1c1a17` → `#131917` |
| `muted` | `#a7a49c` → `#9DA7A3` | `#5f5b55` → `#565F5B` |
| `line` | `#2b303a` → `#313938` | `#ddd8ce` → `#CFD5D1` |
| `field` | `#6b7484` → `#78837F` | `#857f76` → `#79837E` |
| `accent` | `#d9963c` → `#D8E0DC` | `#8e5017` → `#262E2B` |
| `accent-fg` | `#17120a` → `#161A19` | `#fff8f0` → `#FAFBFA` |
| `accent-soft` | `#3a2a12` → `#2B3231` | `#f6e3cc` → `#DEE3DF` |
| `accent-line` | `#9c7440` → `#8E9A95` | `#ab7238` → `#5B6560` |
| `info` / `info-soft` | `#74bde4` / `#132a38` → `#9DA7A3` / `#2B3231` | `#14608f` / `#dfeaf7` → `#565F5B` / `#DEE3DF` |
| `ok` / `ok-soft` | `#6fcf97` / `#14301f` → `#E7ECE9` / `#2B3231` | `#1c6b40` / `#d9efe2` → `#131917` / `#DEE3DF` |
| `warn` / `warn-soft` | `#f0a468` / `#3c2415` → `#E8A08F` / `#2B3231` | `#a24409` / `#fbe1d1` → `#8C3A2A` / `#DEE3DF` |
| `danger` / `danger-soft` | `#f2857c` / `#3a1a17` → `#EE8878` / `#3A2320` | `#ae2a20` / `#f9dedb` → `#A32C1F` / `#F3DCD7` |
| `info-fg`, `ok-fg`, `warn-fg` | tinted → `#161A19` | tinted → `#FAFBFA` |
| `group-guardsmen-strong` | `#7fd48f` → `#84CE93` | `#1f6b2e` → `#256B35` |
| `group-specialists-strong` | `#7fb2f0` → `#8FBCEE` | `#1f4f8a` → `#25568A` |
| `group-engineers-strong` | `#e6b85c` → `#DDB86E` | `#7a5410` → `#6F5417` |
| `group-monsters-strong` | `#c39af0` → `#C0A0EC` | `#5b2f8a` → `#5B368A` |
| `group-mercenaries-strong` | `#f08a8a` → `#EC9391` | `#8a2424` → `#8C3030` |
| `group-*-soft` (same order) | `#173321 #172436 #352a14 #2a1e38 #38191b` → `#2A3830 #2C363B #35362C #31333B #373130` | `#dff3df #dde9f7 #f8ecd0 #ebe0f5 #f8dede` → `#DAE0DD #DAE2E9 #E5E2D8 #E2DEE9 #EADDDC` |
| `group-*-edge` (5) | retired, alias `*-strong` | same |
| `texture` | two radial washes → removed | same |
| `--radius-card` | `0.75rem`, March card and overlays only | same |
| `--radius-control` | `0.5rem` → `0.375rem` | same |
| `--radius-tile` | new `0.25rem` | same |
| `--radius-chip` | `999px` → `0.375rem` | same |
| `--text-sm`, `--text-lg` | retired | same |
| `--text-title`, `--text-hero` | new `1.3125rem`, `3rem` | same |

Starting points; `pnpm contrast` is the gate, each nudged until all 170-odd pairs pass.

**Kit anatomy.** `Card` gains a flat variant (no radius, shadow or fill); only the March card keeps
elevation. `Badge`/chip square, its `accent` variant trading tint for `raised` + tick. `Segmented` and
`OptionList` selected = `raised` + a rule. `Banner`: `info`/`ok`/`warn` lose tinted grounds. `UnitTile`:
square frame, roman numeral. `NumberStepper`: the Troops pair joins one track. `PoolField`: fraction →
gauge. `MarchRow`/`MarchCounts`: HP bar column. `SummaryLine`, `Disclosure`, `StatBar`: dot strings →
cells. `Menu` section title loses caps and tracking. `.rule-accent` deleted.

**Copy.** Dots → structure: `AppBar.tsx:53` three labelled cells; `formation.ts:51` "4 squads: 1 each of
melee, ranged, mounted and flying."; aligned cells in `MarchCounts.tsx:138`, `MarchRow.tsx:176`;
`rows.ts:55` tier onto the tile, role and race as chips; `UnitSheet.tsx:59` → "Guardsmen III"; same for
`journal.ts:98`, `SavedStacks.tsx:267`, `SyncDialog.tsx:216/221/275`, `ConflictDialog.tsx:57`,
`labels.ts:198`. Eyebrows dropped at `ConflictDialog.tsx:44`, `Menu.tsx:35`, the `Tier`/`Role`/`Race`
rows and any header labelling one control; "expected damage" becomes a caption under its figure.

**Stays.** Group colours and their meaning; the 4.5:1 and 3:1 floors verified by `pnpm contrast`, `line`
the documented exemption; the M3 structure (supporting pane from large, 64 dp app bar, extended FAB below
large, 8/10/10 % state layers, outlined fields, tonal roles); bundled OFL fonts; the 13 px floor, tabular
figures, the focus ring, reduced motion; no arbitrary Tailwind values.

## 6. Applied (2026-09-13) — what shipped, and where it differs

Applied to `src/index.css`, the kit and the sections; `after-*.png` sits beside each `before-*.png`.
Amendments from the review, and the two places the plan was wrong:

- **The bar is damage, not health.** The flat-HP rule makes every stack's total HP nearly equal, so an HP
  column would have been identical bars. `MarchStackRow` now carries `damage` (summed from the enemy-first
  journal) and `damageShare` against the loudest stack; `DamageBar` draws it. No engine change.
- **Shape.** Controls stay at 8 px (M3 small) and chips move to 8 px; `--radius-tile` 4 px is new.
- **Type.** The tokens were remapped, not retired: `xs` 13 · `sm` 13 (alias) · `base` 16 · `lg` 21 · `xl` 24 ·
  `stat` 24 · new `hero` 3 rem. Measured: "VIII" is 19.5 px in a 32 px tile and 24.4 px in a 56 px one;
  "19,639,721" is 178 px in the 360 dp pane. All fit.
- **The primary stays unmistakable**: filled metal, `accent-fg` ink, 12–14:1, 44 px.
- **Shell**: the app bar carries the expected damage and the hits on a phone too (no tiles under 600 px, and
  the account trigger drops its visible name there to make the room); the extended FAB shows its label at the
  top of the page at every width and collapses only on scroll down.
- **Controls**: a step button is now only for a short ordered list. `NumberInput` (no buttons, selects its
  whole value on focus) is the default; `NumberStepper` is the same control with `buttons` on.
- **Deferred**: the dot strings and the tracked-caps label in `src/ui/sync/**` (another worker's tree); the
  `Tier`/`Role`/`Race` eyebrow rows in the mercenary picker, which the Mercenaries rework will take; the bonus
  and artifact sheets still use `NumberStepper` where `NumberInput` is the right control.
