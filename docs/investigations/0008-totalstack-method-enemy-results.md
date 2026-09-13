# 0008 — TotalStack's stacking method, enemy stacks, sticky bar and results, observed (2026-09-13)

Observed live on totalstack.ca (Pro trial), ~1560 px wide, after a Generate with G1–G3, S1, four mercenaries,
Leadership 3 000, Authority 1 200, priority Damage / Silver. Companion to investigation 0006 (captains,
mercenaries, troop row). To be mimicked in arrangement, relative size and behaviour, in our theme.

## Stacking method

- One card "STACKING METHOD" holding **four wide option cards in a single row** (equal widths, ~90 px tall):
  title in small caps ("TOTAL OPTIMIZATION" + a "NEW" badge, "M'S PRESERVATION" + "POPULAR", "ELITE
  PRESERVATION", "CUSTOM KILL ORDER"), a one-line description under it, a small ⓘ after the description,
  and a **radio circle at the top-right corner** of the card. The selected card has an accent border, a
  tinted ground and a filled check in the circle. **The whole card is the target.**
- Under the row, a sub-panel "TROOP TYPE ALLOCATION" that reads "Auto-managed by Total Optimization" (or
  shows the four percentage fields when no preservation flag is on).
- On phones the four cards stack vertically (same anatomy).

## Enemy stacks

- One row: an icon + "ENEMY STACKS" heading with a one-line description on the left; on the right a panel
  with "ENEMY STACKS: 4" caption, a **three-segment control** (4 STANDARD / 8 DOUBLE / CUSTOM), then four
  small read-only or editable count fields with a glyph and a caps label (FLYING / MELEE / RANGED / MOUNTED).

## The sticky bar (bottom)

- Fixed to the bottom of the viewport, full width, ~90 px: **LEADERSHIP · AUTHORITY · DOMINANCE** as large
  plain number inputs (no steppers, ~40 px tall, value in 20 px bold), each with a glyph and a caps label
  above; then **SELECT PRIORITY** (a select: None / Maximum Damage / Damage / Silver) and a rounded
  **Generate** button with a glyph. Dominance shows a grey "0" placeholder when no monsters are selected.

## Results (appear under the form after Generate)

Two things at once:

1. **A right side panel** (fixed, ~300 px, scrolls with the page, hidden on phones): header
   "1,500 troops | 842 mercs" (coloured totals), then the objective as a vertical list of options (Average
   Damage highlighted, Damage / Silver, Damage / Dragon coin, Damage / Gold — each a row with a glyph), then
   **per pool** a caps heading with "used / total Pool" ("MERCENARIES 1,200 / 1,200 Authority"), and the
   list "name tier — count" (Death Chariot 6 … 8; Chariot 6 … 126; …), "MONSTERS 0 / 0 Dominance — None
   selected", "TROOPS 3,000 / 3,000 Leadership — Rider 3 … 1,500". This is the compact copy list.

2. **BATTLE SUMMARY card**:
   - Header row: glyph + "BATTLE SUMMARY", a "5 STACKS" badge on the right.
   - "RECOVERY PLAN ⓘ" as a three-segment control (RETRAIN ALL / REVIVE ALL / SELECTIVE).
   - Two columns: **Troops** (LEADERSHIP, DAMAGE BY TROOPS 1,038,240, STACKS 1) and **Mercenaries**
     (AUTHORITY, DAMAGE BY MERCENARIES 14,104,995, STACKS 4).
   - A row of figure tiles: 🔒 MINIMUM DAMAGE 13,840,219 · 🎯 AVERAGE DAMAGE 15,143,235 · DAMAGE / SILVER
     7.211 · DAMAGE / DRAGON COIN 0 · DAMAGE / GOLD 1,766.
   - ARMY RECOVERY COST: ⏳ TIME 14d 14h · 🪙 SILVER 2,100,000 · 🏵️ DRAGON COINS 0 · 💰 GOLD 8,576.
   - A caption "CLICK ANY PILL BELOW FOR DETAILS".
   - **BATTLE SIMULATION** block with toggles "REMOVE TYPE" and "MANUAL HP ORDER" (top right), then **one
     block per pool**: the pool total in the pool colour with its glyph ("3,000 🛡"), the stacks as **pills**
     (glyph + code + tier on the first line, the **count large** on the second: "RD 3 / 1,500"), a "Sort by
     total HP" switch; for mercenaries the pool total "1,200 👑", pills with an "∞" badge at the corner,
     "Sort by total HP" and "Round to 10s" switches, and "Drag pills to reorder" in manual mode.
   - **REMOVED FROM FORMATION — Tap to restore · Restore all**: the left-out types as small outlined pills
     (glyph + code) each with a "+" to restore (ARC 1, SP 1, RD 1, ARC 2, SP 2, RD 2, SW 1, SP 3, ARC 3).
   - Clicking a pill opens the unit detail popover (health, strength, damage taken, etc.).

## What we keep and what we change (for M-07/M-08)

Keep: the four full-card method options with the corner radio; the enemy segment + four count fields; the
sticky bar's plain inputs; the figure tiles (minimum, average, per-silver/coin/gold) and the recovery cost
row; per-pool blocks with pool totals and count pills where the count is the big number; the removed list
with "+" to restore; the side copy list on wide screens (ours is the March supporting pane).
Change (owner's earlier decisions): the sticky bar is at the top (app bar with the answer) rather than the
bottom; "the march as tiles" doubles as the exclusion control; the unit popover becomes a sheet built from
sentences; the battle journal stays folded.
