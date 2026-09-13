# 0009 — The march summary and the Generate action: four frames (2026-09-13)

Four arrangements on our Mantine theme, with a generated march (19,639,721 expected · 19,048,721 worst ·
15 hits · 34,274,200 silver · ten troop stacks, two mercenary) and a plausible setup column. Dev-only page
at `#frame-spike`, `?v=1..4`; shots in `0009-summary-generate-spike/`, dark, 1400×900 and 390×844.

**Desktop is settled.** V1–V3 draw the same wide frame: app bar = brand + account, March as the 360 px
sticky supporting pane, its header carrying the figures *and* the primary Generate (`v1-desktop.jpg`). Only
V4 differs, and `v4-desktop.jpg` shows why it cannot stand — the bar repeats every figure and six troop
tiles of the pane 80 px below it. The open question is the phone.

## Scored against the charter

| | 1 answer | 2 Generate | 5 no duplication | 13 put back | 16 Material 3 | 17 scroll |
|---|---|---|---|---|---|---|
| **V1** bottom app bar | ✓ 2 figures + 2 tiles | intent ✓, letter ✗ — a *second* sticky bar | ✓ one dataset, two densities | ~ in the sheet | ✓ the canonical compact container (M3 attaches a FAB; ours, a filled button) | ✓ |
| **V2** FAB + chip | ~ one line, no tiles | ✓ one FAB | ✓ | ~ in the sheet | ✗ two stacked floating elements; M3 allows one | ✓ |
| **V3** top-bar summary | ✓ | ~ 40 px icon, no label | ✗ bar repeats the pane | ✓ | ✗ a two-line data surface (M3: short headline, ≤ 3 icons) | ✓ |
| **V4** current | ✓ | ✓ | ✗✗ | ✓ | ~ containers canonical, content not | ✓ |

## Cost on a 390×844 phone (measured in the page)

| | reserved, full width | floating | usable band | page height |
|---|---|---|---|---|
| **V1** | top 64 + bottom 64 = **128 px** (15.2 %) | — | **716 px**, never overlapped | 1 572 px |
| **V2** | top **64** | chip 170×32 + FAB 174×56 = a **174×100** corner | 780 px less that corner | 1 580 px |
| **V3** | top **64** | — | **780 px** | 2 520 px |
| **V4** | top **64** | FAB 174×56 | 780 px less that corner | 2 584 px |

V1/V2 spend ~950 px less page: the recap is a sheet, not a section. The floating variants
pay their 64 px elsewhere: in `v2-phone-scrolled.jpg` and `v4-phone.jpg` the FAB covers the method cards'
radio circles and the Authority field.

## Recommendation — V1

The only frame where answer and action are both permanently on screen without covering anything, and the
only one where opening the full recap does not take Generate away: `v1-phone-open.jpg` keeps the bar under
the sheet. `v2-phone-open.jpg` shows the alternative — FAB and chip land on two troop tiles, and hiding
them (plan §5.3) leaves the sheet with no Generate at all. V3 is cheapest in pixels but duplicates the
figures and turns the top bar into a dashboard; V4 is what we are replacing.

Taking V1 means **amending rule 2** ("one sticky app bar … no other sticky toolbar") to one bar per edge:
top carries identity and account, bottom the answer and Generate, at compact width only. Ask at the same
time whether a 64 px top bar holding a brand and an avatar earns its height (rule 15).

## To decide

1. **Truncation.** At 390 px the bar fits `19.6M · 34.3M silver` plus **two** whole troop tiles and a
   `+8 ⌃` marker beside a full "Generate" label; a glyph-only button buys a third. Tiles are never shrunk —
   a squeezed one reads `1…`. Two tiles + label, or three + glyph?
2. **Does the bar hide on scroll down?** M3's does; rule 5 says the answer stays. Proposal: it stays, only
   the sheet moves.
3. **Sheet height.** 72 % (608 px) shows the figures and six of ten tiles with the bar still visible below;
   full height would cover the bar and hide Generate. Proposal: half, draggable to full.
