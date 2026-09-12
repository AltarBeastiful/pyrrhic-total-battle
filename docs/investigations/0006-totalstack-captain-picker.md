# 0006 — TotalStack's captain picker, observed (2026-09-13)

Observed live on totalstack.ca (Pro trial account), Bonuses → By Source, at 1560 px. Noted to be mimicked in
behaviour, arrangement and relative size, in our own CSS (design plan D-34). Screenshots were not kept
(third-party UI); measurements are from the rendered page.

## Arrangement

- Group heading "Captains" with a small counter "1/3" right after it (13 px, muted); one italic helper line
  under it: "Captain bonuses only apply if they are going into battle."
- All 30 captains as **small chips in a dense wrapping row**: name only, ~32 px tall, ~13 px text, ~8 px
  gap, pill-shaped; 30 chips fit on two rows at ~1450 px of width. No portraits, no glyphs, no add button.
- Chips whose captain has stack data carry a **tiny gear badge overlapping the top-right corner** (~18 px
  circle). Captains without data (Proscope, Tengel, Doria, Stror, Carter, Dustan, Aurora, Farhad, Hercules,
  Helen; also Logos in their data) have **no gear**.
- A chip whose level has been set shows a **small dot after the name** (Aydae ●, Bernard ●).
- The same chip pattern is reused for Artifacts ("0/3", 15 chips, gear on each), Permanent (8 chips, gear
  on each, always highlighted), Titles (grouped Health / Strength / Other, value under the name), Other.
  Equipment alone uses an "Add" button (free-form pieces).

## Behaviour

- **Tap the chip body = enlist / remove** (toggle). Selected chip: filled cyan tint + 1 px cyan ring; the
  gear badge turns cyan too. Counter updates ("3/3").
- **Fourth selection is refused silently**: the chip does not highlight, the counter stays 3/3, no message.
- **Captains without data can still be enlisted** (Carter highlighted at 3/3), they just have no gear.
- **Tap the gear = a small popover anchored under the chip** (not a dialog): title = captain name, close ×,
  a sub-panel "CAPTAIN LEVEL" with "Base Level" (number input) and "Star Level" (select, "—" then ★0–7), and a
  footer line with the resulting bonus computed live: "Guardsmen's strength & health (base level) +20%".
  Escape closes it.
- Selecting a captain does not open the popover; levels are only reached through the gear.

## Mercenaries, same session (for D-23)

- Selected mercenaries are **tiny pills**: "EMH 5 ∞ 🐴" — code, tier, the cap (∞ when unlimited), category
  glyph, a remove × on the pill; "(4 selected)" after the heading, "Deselect all" on the right.
- "Hire Mercenary…" is a dropdown with a search field, one row of icon filters (role, category, race), then a
  list **grouped by tier ascending** ("TIER 5" header, then names), scrolling inside the dropdown.

## Troop selection and the frame (for reference)

- Four groups on **one line**: label, then two tiny selects "G1 — G3"; "Include at G3:" with three glyph
  toggles under the guardsmen selects only. The whole troop form is ~90 px tall.
- A **sticky bottom bar** holds Leadership, Authority, Dominance, Select priority and Generate.
