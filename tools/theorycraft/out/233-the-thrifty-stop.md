# The thrifty stop — a fifth stop read off the march horizon

experiment: 233 · armies: 19 · extraArmies: 0

Every rule starts from the rows the bar could have offered and did not (undominated ∧ in the band ∧ not a stop ∧ not a put-back generator) and is read against the army's sweet spot. Gold is reported, never gated.

- **thrifty** — the first rule, kept for comparison: burn ≤ the sweet spot's, damage below it, queue ≥ 10 % shorter, dmg/silver and dmg/merc ≥ 95 % of the sweet spot's; the most damage.
- **rated q40** — a stepping stone (damage and queue strictly between the next stop down's and the sweet spot's), **burn strictly below the next stop up's**, dmg/silver and dmg/merc ≥ 95 % of the sweet spot's, no queue gate; **the best owner's rating against the sweet spot** with the queue weighted at 40 (percent of queue worth one percent of damage, the app's own) and gold at 10.
- **rated q20** — a stepping stone (damage and queue strictly between the next stop down's and the sweet spot's), **burn strictly below the next stop up's**, dmg/silver and dmg/merc ≥ 95 % of the sweet spot's, no queue gate; **the best owner's rating against the sweet spot** with the queue weighted at 20 (percent of queue worth one percent of damage) and gold at 10.
- **rated q10** — a stepping stone (damage and queue strictly between the next stop down's and the sweet spot's), **burn strictly below the next stop up's**, dmg/silver and dmg/merc ≥ 95 % of the sweet spot's, no queue gate; **the best owner's rating against the sweet spot** with the queue weighted at 10 (percent of queue worth one percent of damage) and gold at 10.
- **rated q5** — a stepping stone (damage and queue strictly between the next stop down's and the sweet spot's), **burn strictly below the next stop up's**, dmg/silver and dmg/merc ≥ 95 % of the sweet spot's, no queue gate; **the best owner's rating against the sweet spot** with the queue weighted at 5 (percent of queue worth one percent of damage) and gold at 10.

Rows: HS burn-saver · SS silver-saver · SW sweet spot · MM more-mercs · MX steady max · AI all-in. `order`: `strict` = burn and damage both rise along the bar; `tie-burn` = the pick shares a burn level with a stop, damage rising (the criterion as written refuses a tie); `breaks` = damage or burn falls against a lower rung. Deltas are percent change over the sweet spot; `×` is the pick's ratio over the sweet spot's.

## Summary

### thrifty

10 of 19 armies get a pick; 3 strictly in the order, 5 sharing a burn level with a stop, 2 breaking it.

| army | pick | Δdmg % | Δsilver % | Δgold % | Δcoins % | Δqueue % | burn (sweet) | dmg/silver × | dmg/merc × | dmg/gold × | rate | bar with the pick |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| first-run army, Bear V ×1 (20 000 leadership) | none | | | | | | 1 | | | | | |
| first-run army, Bear V ×2 (20 000 leadership) | none | | | | | | 1 | | | | | |
| first-run army, Bear V ×3 (20 000 leadership) | none | | | | | | 1 | | | | | |
| first-run army, Bear V ×10 (20 000 leadership) | none | | | | | | 1 | | | | | |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | none | | | | | | 6 | | | | | |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 16,799,112 | -26.9 | -29.7 | -49.9 | +12.4 | -13.4 | 5 (5) | 1.04 | 1.00 | 1.46 | -12.2 | order breaks · noStopBeaten ✓ |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 282,129,906 | -0.3 | -17.7 | 0.0 | 0.0 | -18.5 | 5 (5) | 1.21 | 1.00 | 1.00 | 3.7 | order tie-burn · noStopBeaten ✓ |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 1,961,382 | -7.7 | -9.5 | 0.0 | 0.0 | -10.1 | 4 (5) | 1.02 | 1.23 | 0.92 | -1.6 | order tie-burn · noStopBeaten ✓ |
| 2026-09-17 export, its setup (7 000 leadership) | 4,098,844 | -7.7 | -20.0 | 0.0 | 0.0 | -19.9 | 7 (7) | 1.15 | 1.00 | 0.92 | -3.2 | order tie-burn · noStopBeaten ✓ |
| 2026-09-17 export, 12 000 leadership | 6,575,550 | -24.8 | -21.2 | -24.8 | 0.0 | -21.9 | 13 (17) | 0.95 | 0.97 | 1.00 | -10.3 | order strict · noStopBeaten ✓ |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | 5,546,047 | -22.1 | -29.8 | 0.0 | 0.0 | -30.4 | 6 (6) | 1.11 | 1.00 | 0.78 | -15.3 | order tie-burn · noStopBeaten ✓ |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | 5,501,565 | -22.6 | -24.2 | -21.4 | 0.0 | -24.9 | 11 (14) | 1.02 | 1.00 | 0.98 | -8.6 | order strict · noStopBeaten ✓ |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | none | | | | | | 10 | | | | | |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | none | | | | | | 15 | | | | | |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | 1,932,081 | -19.0 | -14.9 | -47.1 | 0.0 | -39.6 | 2 (4) | 0.95 | 1.05 | 1.53 | 4.4 | order breaks · noStopBeaten ✓ |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | none | | | | | | 5 | | | | | |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | 1,659,966 | -21.1 | -19.6 | -38.6 | 0.0 | -20.4 | 3 (5) | 0.98 | 1.02 | 1.29 | -1.0 | order strict · noStopBeaten ✓ |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | 2,144,572 | -27.1 | -23.9 | -47.1 | -30.8 | -26.3 | 1 (2) | 0.96 | 1.05 | 1.38 | 1.6 | order tie-burn · noStopBeaten ✓ |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | none | | | | | | 1 | | | | | |

### rated q40

2 of 19 armies get a pick; 0 strictly in the order, 2 sharing a burn level with a stop, 0 breaking it.

| army | pick | Δdmg % | Δsilver % | Δgold % | Δcoins % | Δqueue % | burn (sweet) | dmg/silver × | dmg/merc × | dmg/gold × | rate | bar with the pick |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| first-run army, Bear V ×1 (20 000 leadership) | none | | | | | | 1 | | | | | |
| first-run army, Bear V ×2 (20 000 leadership) | none | | | | | | 1 | | | | | |
| first-run army, Bear V ×3 (20 000 leadership) | none | | | | | | 1 | | | | | |
| first-run army, Bear V ×10 (20 000 leadership) | none | | | | | | 1 | | | | | |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | none | | | | | | 6 | | | | | |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 21,751,874 | -5.3 | -0.7 | +19.7 | -11.2 | -1.4 | 2 (5) | 0.95 | 1.55 | 0.79 | 6.3 | order tie-burn · noStopBeaten ✓ |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 282,129,906 | -0.3 | -17.7 | 0.0 | 0.0 | -18.5 | 5 (5) | 1.21 | 1.00 | 1.00 | 3.7 | order tie-burn · noStopBeaten ✓ |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | none | | | | | | 5 | | | | | |
| 2026-09-17 export, its setup (7 000 leadership) | none | | | | | | 7 | | | | | |
| 2026-09-17 export, 12 000 leadership | none | | | | | | 17 | | | | | |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | none | | | | | | 6 | | | | | |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | none | | | | | | 14 | | | | | |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | none | | | | | | 10 | | | | | |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | none | | | | | | 15 | | | | | |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | none | | | | | | 4 | | | | | |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | none | | | | | | 5 | | | | | |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | none | | | | | | 5 | | | | | |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | none | | | | | | 2 | | | | | |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | none | | | | | | 1 | | | | | |

### rated q20

2 of 19 armies get a pick; 0 strictly in the order, 2 sharing a burn level with a stop, 0 breaking it.

| army | pick | Δdmg % | Δsilver % | Δgold % | Δcoins % | Δqueue % | burn (sweet) | dmg/silver × | dmg/merc × | dmg/gold × | rate | bar with the pick |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| first-run army, Bear V ×1 (20 000 leadership) | none | | | | | | 1 | | | | | |
| first-run army, Bear V ×2 (20 000 leadership) | none | | | | | | 1 | | | | | |
| first-run army, Bear V ×3 (20 000 leadership) | none | | | | | | 1 | | | | | |
| first-run army, Bear V ×10 (20 000 leadership) | none | | | | | | 1 | | | | | |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | none | | | | | | 6 | | | | | |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 21,751,874 | -5.3 | -0.7 | +19.7 | -11.2 | -1.4 | 2 (5) | 0.95 | 1.55 | 0.79 | 6.3 | order tie-burn · noStopBeaten ✓ |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 282,129,906 | -0.3 | -17.7 | 0.0 | 0.0 | -18.5 | 5 (5) | 1.21 | 1.00 | 1.00 | 4.1 | order tie-burn · noStopBeaten ✓ |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | none | | | | | | 5 | | | | | |
| 2026-09-17 export, its setup (7 000 leadership) | none | | | | | | 7 | | | | | |
| 2026-09-17 export, 12 000 leadership | none | | | | | | 17 | | | | | |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | none | | | | | | 6 | | | | | |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | none | | | | | | 14 | | | | | |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | none | | | | | | 10 | | | | | |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | none | | | | | | 15 | | | | | |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | none | | | | | | 4 | | | | | |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | none | | | | | | 5 | | | | | |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | none | | | | | | 5 | | | | | |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | none | | | | | | 2 | | | | | |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | none | | | | | | 1 | | | | | |

### rated q10

2 of 19 armies get a pick; 0 strictly in the order, 2 sharing a burn level with a stop, 0 breaking it.

| army | pick | Δdmg % | Δsilver % | Δgold % | Δcoins % | Δqueue % | burn (sweet) | dmg/silver × | dmg/merc × | dmg/gold × | rate | bar with the pick |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| first-run army, Bear V ×1 (20 000 leadership) | none | | | | | | 1 | | | | | |
| first-run army, Bear V ×2 (20 000 leadership) | none | | | | | | 1 | | | | | |
| first-run army, Bear V ×3 (20 000 leadership) | none | | | | | | 1 | | | | | |
| first-run army, Bear V ×10 (20 000 leadership) | none | | | | | | 1 | | | | | |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | none | | | | | | 6 | | | | | |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 21,751,874 | -5.3 | -0.7 | +19.7 | -11.2 | -1.4 | 2 (5) | 0.95 | 1.55 | 0.79 | 6.4 | order tie-burn · noStopBeaten ✓ |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 282,129,906 | -0.3 | -17.7 | 0.0 | 0.0 | -18.5 | 5 (5) | 1.21 | 1.00 | 1.00 | 5.1 | order tie-burn · noStopBeaten ✓ |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | none | | | | | | 5 | | | | | |
| 2026-09-17 export, its setup (7 000 leadership) | none | | | | | | 7 | | | | | |
| 2026-09-17 export, 12 000 leadership | none | | | | | | 17 | | | | | |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | none | | | | | | 6 | | | | | |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | none | | | | | | 14 | | | | | |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | none | | | | | | 10 | | | | | |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | none | | | | | | 15 | | | | | |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | none | | | | | | 4 | | | | | |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | none | | | | | | 5 | | | | | |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | none | | | | | | 5 | | | | | |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | none | | | | | | 2 | | | | | |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | none | | | | | | 1 | | | | | |

### rated q5

5 of 19 armies get a pick; 0 strictly in the order, 5 sharing a burn level with a stop, 0 breaking it.

| army | pick | Δdmg % | Δsilver % | Δgold % | Δcoins % | Δqueue % | burn (sweet) | dmg/silver × | dmg/merc × | dmg/gold × | rate | bar with the pick |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| first-run army, Bear V ×1 (20 000 leadership) | none | | | | | | 1 | | | | | |
| first-run army, Bear V ×2 (20 000 leadership) | none | | | | | | 1 | | | | | |
| first-run army, Bear V ×3 (20 000 leadership) | none | | | | | | 1 | | | | | |
| first-run army, Bear V ×10 (20 000 leadership) | none | | | | | | 1 | | | | | |
| first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed) | none | | | | | | 6 | | | | | |
| first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp) | 21,751,874 | -5.3 | -0.7 | +19.7 | -11.2 | -1.4 | 2 (5) | 0.95 | 1.55 | 0.79 | 6.5 | order tie-burn · noStopBeaten ✓ |
| first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp) | 282,129,906 | -0.3 | -17.7 | 0.0 | 0.0 | -18.5 | 5 (5) | 1.21 | 1.00 | 1.00 | 6.9 | order tie-burn · noStopBeaten ✓ |
| the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows) | 1,884,530 | -11.3 | -18.6 | -2.7 | 0.0 | -19.1 | 4 (5) | 1.09 | 1.22 | 0.91 | 0.4 | order tie-burn · noStopBeaten ✓ |
| 2026-09-17 export, its setup (7 000 leadership) | 4,098,844 | -7.7 | -20.0 | 0.0 | 0.0 | -19.9 | 7 (7) | 1.15 | 1.00 | 0.92 | 0.2 | order tie-burn · noStopBeaten ✓ |
| 2026-09-17 export, 12 000 leadership | none | | | | | | 17 | | | | | |
| live account of 2026-09-18 (one hired type, 20 000 leadership) | none | | | | | | 6 | | | | | |
| live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000) | none | | | | | | 14 | | | | | |
| Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp) | none | | | | | | 10 | | | | | |
| the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited) | none | | | | | | 15 | | | | | |
| his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450) | none | | | | | | 4 | | | | | |
| his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120) | none | | | | | | 5 | | | | | |
| his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80) | none | | | | | | 5 | | | | | |
| his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90) | 2,137,145 | -27.3 | -26.1 | -47.1 | -30.8 | -28.1 | 1 (2) | 0.98 | 1.05 | 1.37 | 2.0 | order tie-burn · noStopBeaten ✓ |
| his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14) | none | | | | | | 1 | | | | | |

## Per army

### first-run army, Bear V ×1 (20 000 leadership)

- thrifty funnel: pool 0 → burn 0 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q40 funnel: pool 0 → burn 0 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q20 funnel: pool 0 → burn 0 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q10 funnel: pool 0 → burn 0 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q5 funnel: pool 0 → burn 0 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SW | 4,704,025 | 8,131,400 | 1 | 0 | 0 | 26 d 7 h | 0.58 | 112,200 | ∞ | ∞ | 0.0 |

**thrifty**: no row passes the gates.

**rated q40**: no row passes the gates.

**rated q20**: no row passes the gates.

**rated q10**: no row passes the gates.

**rated q5**: no row passes the gates.

### first-run army, Bear V ×2 (20 000 leadership)

- thrifty funnel: pool 0 → burn 0 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q40 funnel: pool 0 → burn 0 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q20 funnel: pool 0 → burn 0 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q10 funnel: pool 0 → burn 0 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q5 funnel: pool 0 → burn 0 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SW | 4,816,225 | 8,131,400 | 1 | 160 | 0 | 26 d 7 h | 0.59 | 224,400 | 30,101 | ∞ | 0.0 |

**thrifty**: no row passes the gates.

**rated q40**: no row passes the gates.

**rated q20**: no row passes the gates.

**rated q10**: no row passes the gates.

**rated q5**: no row passes the gates.

### first-run army, Bear V ×3 (20 000 leadership)

- thrifty funnel: pool 0 → burn 0 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q40 funnel: pool 0 → burn 0 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q20 funnel: pool 0 → burn 0 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q10 funnel: pool 0 → burn 0 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q5 funnel: pool 0 → burn 0 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SW | 4,704,025 | 8,131,400 | 1 | 0 | 0 | 26 d 7 h | 0.58 | 112,200 | ∞ | ∞ | 0.0 |
| AI | 4,928,425 | 8,131,400 | 1 | 320 | 0 | 26 d 7 h | 0.61 | 336,600 | 15,401 | ∞ | 4.8 |

**thrifty**: no row passes the gates.

**rated q40**: no row passes the gates.

**rated q20**: no row passes the gates.

**rated q10**: no row passes the gates.

**rated q5**: no row passes the gates.

### first-run army, Bear V ×10 (20 000 leadership)

- thrifty funnel: pool 2 → burn 2 → below the sweet spot 2 → queue 1 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q40 funnel: pool 2 → burn 0 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q20 funnel: pool 2 → burn 0 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q10 funnel: pool 2 → burn 0 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q5 funnel: pool 2 → burn 0 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SW | 5,265,025 | 8,131,400 | 1 | 800 | 0 | 26 d 7 h | 0.65 | 673,200 | 6,581 | ∞ | 0.0 |
| AI | 5,581,060 | 9,919,400 | 1 | 1,440 | 0 | 45 d 11 h | 0.56 | 748,000 | 3,876 | ∞ | -8.2 |

**thrifty**: no row passes the gates.

**rated q40**: no row passes the gates.

**rated q20**: no row passes the gates.

**rated q10**: no row passes the gates.

**rated q5**: no row passes the gates.

### first-run army, Epic Monster Hunter VI ×83 (20 000 leadership — the e2e seed)

- thrifty funnel: pool 12 → burn 9 → below the sweet spot 9 → queue 3 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q40 funnel: pool 12 → burn 9 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q20 funnel: pool 12 → burn 9 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q10 funnel: pool 12 → burn 9 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q5 funnel: pool 12 → burn 9 → below the sweet spot 0 → queue 0 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 5,023,606 | 8,131,400 | 1 | 72 | 0 | 26 d 7 h | 0.62 | 431,781 | 69,772 | ∞ | -5.1 |
| SW | 7,182,511 | 8,131,400 | 6 | 432 | 0 | 26 d 7 h | 0.88 | 431,781 | 16,626 | ∞ | 0.0 |
| MX | 7,571,113 | 8,131,400 | 7 | 496 | 0 | 26 d 7 h | 0.93 | 425,613 | 15,264 | ∞ | 0.6 |
| AI | 7,973,870 | 8,513,200 | 9 | 592 | 0 | 30 d 10 h | 0.94 | 398,198 | 13,469 | ∞ | -4.0 |

**thrifty**: no row passes the gates.

**rated q40**: no row passes the gates.

**rated q20**: no row passes the gates.

**rated q10**: no row passes the gates.

**rated q5**: no row passes the gates.

### first-run army, monster tiers 3–5 at 900 dominance (hunters 83 · Bear V 6 — experiment 110’s camp)

- thrifty funnel: pool 19 → burn 9 → below the sweet spot 9 → queue 4 → dmg/silver 3 → dmg/merc 2 → rated above the sweet spot 2.
- rated q40 funnel: pool 19 → burn 9 → below the sweet spot 3 → queue 3 → dmg/silver 2 → dmg/merc 2 → rated above the sweet spot 1.
- rated q20 funnel: pool 19 → burn 9 → below the sweet spot 3 → queue 3 → dmg/silver 2 → dmg/merc 2 → rated above the sweet spot 1.
- rated q10 funnel: pool 19 → burn 9 → below the sweet spot 3 → queue 3 → dmg/silver 2 → dmg/merc 2 → rated above the sweet spot 1.
- rated q5 funnel: pool 19 → burn 9 → below the sweet spot 3 → queue 3 → dmg/silver 2 → dmg/merc 2 → rated above the sweet spot 1.

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 20,298,165 | 8,686,000 | 2 | 3,304 | 5,400 | 29 d 12 h | 2.34 | 733,818 | 6,144 | 3,759 | 1.2 |
| **rated q40 = rated q20 = rated q10 = rated q5** | 21,751,874 | 8,728,200 | 2 | 3,304 | 6,000 | 29 d 19 h | 2.49 | 805,781 | 6,583 | 3,625 | 6.3 |
| **thrifty** | 16,799,112 | 6,178,100 | 5 | 1,384 | 7,600 | 26 d 4 h | 2.72 | 520,974 | 12,138 | 2,210 | -17.2 |
| SW | 22,973,020 | 8,789,200 | 5 | 2,760 | 6,760 | 30 d 5 h | 2.61 | 520,974 | 8,324 | 3,398 | 0.0 |
| MM | 24,383,400 | 8,789,200 | 6 | 3,048 | 6,760 | 30 d 5 h | 2.77 | 669,208 | 8,000 | 3,607 | 1.1 |
| MX | 25,860,303 | 9,190,100 | 8 | 4,384 | 6,760 | 34 d 10 h | 2.81 | 590,048 | 5,899 | 3,825 | -6.6 |
| AI | 26,479,061 | 9,190,100 | 10 | 4,800 | 6,760 | 34 d 10 h | 2.88 | 470,578 | 5,516 | 3,917 | -13.4 |

**thrifty** vs the sweet spot: damage -26.9 % · silver -29.7 % · burn +0 · gold -49.9 % · coins +12.4 % · queue -13.4 % · dmg/silver ×1.04 · dmg/merc ×1.00 · dmg/gold ×1.46 · dmg/coin ×0.65. order breaks · noStopBeaten ✓.

  - fields archer-1 2,638, archer-2 1,354, archer-3 792, battle-boar 25, bear-5 2, desert-vanquisher 2, emerald-dragon 21, epic-monster-hunter-6 31, ettin 1, fearsome-manticore 2, flaming-centaur 2, gorgon-medusa 8, ice-phoenix 5, magic-dragon 6, many-armed-guardian 7, rider-1 1,293, rider-2 762, rider-3 388, spearman-2 1,555, spearman-3 840, stone-gargoyle 18

**rated q40** vs the sweet spot: damage -5.3 % · silver -0.7 % · burn -3 · gold +19.7 % · coins -11.2 % · queue -1.4 % · dmg/silver ×0.95 · dmg/merc ×1.55 · dmg/gold ×0.79 · dmg/coin ×1.07. order tie-burn · noStopBeaten ✓.

  - fields archer-1 3,042, archer-2 1,680, archer-3 939, bear-5 4, desert-vanquisher 3, emerald-dragon 10, epic-monster-hunter-6 10, ettin 3, fearsome-manticore 3, flaming-centaur 3, gorgon-medusa 10, ice-phoenix 8, magic-dragon 9, many-armed-guardian 10, rider-1 1,515, rider-2 837, rider-3 468, spearman-1 3,036, spearman-2 1,677, spearman-3 938, stone-gargoyle 10, swordsman-1 3,048

**rated q20** vs the sweet spot: damage -5.3 % · silver -0.7 % · burn -3 · gold +19.7 % · coins -11.2 % · queue -1.4 % · dmg/silver ×0.95 · dmg/merc ×1.55 · dmg/gold ×0.79 · dmg/coin ×1.07. order tie-burn · noStopBeaten ✓.

  - fields archer-1 3,042, archer-2 1,680, archer-3 939, bear-5 4, desert-vanquisher 3, emerald-dragon 10, epic-monster-hunter-6 10, ettin 3, fearsome-manticore 3, flaming-centaur 3, gorgon-medusa 10, ice-phoenix 8, magic-dragon 9, many-armed-guardian 10, rider-1 1,515, rider-2 837, rider-3 468, spearman-1 3,036, spearman-2 1,677, spearman-3 938, stone-gargoyle 10, swordsman-1 3,048

**rated q10** vs the sweet spot: damage -5.3 % · silver -0.7 % · burn -3 · gold +19.7 % · coins -11.2 % · queue -1.4 % · dmg/silver ×0.95 · dmg/merc ×1.55 · dmg/gold ×0.79 · dmg/coin ×1.07. order tie-burn · noStopBeaten ✓.

  - fields archer-1 3,042, archer-2 1,680, archer-3 939, bear-5 4, desert-vanquisher 3, emerald-dragon 10, epic-monster-hunter-6 10, ettin 3, fearsome-manticore 3, flaming-centaur 3, gorgon-medusa 10, ice-phoenix 8, magic-dragon 9, many-armed-guardian 10, rider-1 1,515, rider-2 837, rider-3 468, spearman-1 3,036, spearman-2 1,677, spearman-3 938, stone-gargoyle 10, swordsman-1 3,048

**rated q5** vs the sweet spot: damage -5.3 % · silver -0.7 % · burn -3 · gold +19.7 % · coins -11.2 % · queue -1.4 % · dmg/silver ×0.95 · dmg/merc ×1.55 · dmg/gold ×0.79 · dmg/coin ×1.07. order tie-burn · noStopBeaten ✓.

  - fields archer-1 3,042, archer-2 1,680, archer-3 939, bear-5 4, desert-vanquisher 3, emerald-dragon 10, epic-monster-hunter-6 10, ettin 3, fearsome-manticore 3, flaming-centaur 3, gorgon-medusa 10, ice-phoenix 8, magic-dragon 9, many-armed-guardian 10, rider-1 1,515, rider-2 837, rider-3 468, spearman-1 3,036, spearman-2 1,677, spearman-3 938, stone-gargoyle 10, swordsman-1 3,048

### first-run army, monster tiers 3–7 at 20 000 dominance (hunters 83 · Bear V 6 — experiment 129’s camp)

- thrifty funnel: pool 51 → burn 20 → below the sweet spot 20 → queue 19 → dmg/silver 19 → dmg/merc 5 → rated above the sweet spot 5.
- rated q40 funnel: pool 51 → burn 33 → below the sweet spot 21 → queue 21 → dmg/silver 20 → dmg/merc 9 → rated above the sweet spot 1.
- rated q20 funnel: pool 51 → burn 33 → below the sweet spot 21 → queue 21 → dmg/silver 20 → dmg/merc 9 → rated above the sweet spot 1.
- rated q10 funnel: pool 51 → burn 33 → below the sweet spot 21 → queue 21 → dmg/silver 20 → dmg/merc 9 → rated above the sweet spot 2.
- rated q5 funnel: pool 51 → burn 33 → below the sweet spot 21 → queue 21 → dmg/silver 20 → dmg/merc 9 → rated above the sweet spot 2.

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SS | 189,503,660 | 11,640,400 | 4 | 3,128 | 41,120 | 76 d 4 h | 16.28 | 716,694 | 60,583 | 4,609 | -12.8 |
| **thrifty = rated q40 = rated q20 = rated q10 = rated q5** | 282,129,906 | 15,742,600 | 5 | 5,984 | 52,080 | 104 d 3 h | 17.92 | 780,610 | 47,147 | 5,417 | 3.7 |
| SW | 283,093,746 | 19,136,200 | 5 | 5,984 | 52,080 | 127 d 16 h | 14.79 | 780,610 | 47,308 | 5,436 | 0.0 |
| MM | 397,782,216 | 21,008,000 | 7 | 9,048 | 72,880 | 139 d 6 h | 18.93 | 824,031 | 43,964 | 5,458 | 20.2 |
| MX | 480,990,543 | 22,090,000 | 8 | 12,048 | 84,120 | 145 d 17 h | 21.77 | 857,022 | 39,923 | 5,718 | 36.6 |
| AI | 482,648,331 | 22,090,000 | 10 | 12,464 | 84,120 | 145 d 17 h | 21.85 | 851,396 | 38,723 | 5,738 | 28.5 |

**thrifty** vs the sweet spot: damage -0.3 % · silver -17.7 % · burn +0 · gold 0.0 % · coins 0.0 % · queue -18.5 % · dmg/silver ×1.21 · dmg/merc ×1.00 · dmg/gold ×1.00 · dmg/coin ×1.00. order tie-burn · noStopBeaten ✓.

  - fields ancient-terror 3, archer-3 7,500, battle-boar 239, bear-5 2, black-dragon 3, crystal-dragon 8, desert-vanquisher 22, destructive-colossus 3, emerald-dragon 207, epic-monster-hunter-6 40, ettin 19, fearsome-manticore 20, flaming-centaur 21, gorgon-medusa 78, ice-phoenix 55, jungle-destroyer 7, magic-dragon 62, many-armed-guardian 71, rider-3 3,825, ruby-golem 7, stone-gargoyle 179, troll-rider 8, wind-lord 3

**rated q40** vs the sweet spot: damage -0.3 % · silver -17.7 % · burn +0 · gold 0.0 % · coins 0.0 % · queue -18.5 % · dmg/silver ×1.21 · dmg/merc ×1.00 · dmg/gold ×1.00 · dmg/coin ×1.00. order tie-burn · noStopBeaten ✓.

  - fields ancient-terror 3, archer-3 7,500, battle-boar 239, bear-5 2, black-dragon 3, crystal-dragon 8, desert-vanquisher 22, destructive-colossus 3, emerald-dragon 207, epic-monster-hunter-6 40, ettin 19, fearsome-manticore 20, flaming-centaur 21, gorgon-medusa 78, ice-phoenix 55, jungle-destroyer 7, magic-dragon 62, many-armed-guardian 71, rider-3 3,825, ruby-golem 7, stone-gargoyle 179, troll-rider 8, wind-lord 3

**rated q20** vs the sweet spot: damage -0.3 % · silver -17.7 % · burn +0 · gold 0.0 % · coins 0.0 % · queue -18.5 % · dmg/silver ×1.21 · dmg/merc ×1.00 · dmg/gold ×1.00 · dmg/coin ×1.00. order tie-burn · noStopBeaten ✓.

  - fields ancient-terror 3, archer-3 7,500, battle-boar 239, bear-5 2, black-dragon 3, crystal-dragon 8, desert-vanquisher 22, destructive-colossus 3, emerald-dragon 207, epic-monster-hunter-6 40, ettin 19, fearsome-manticore 20, flaming-centaur 21, gorgon-medusa 78, ice-phoenix 55, jungle-destroyer 7, magic-dragon 62, many-armed-guardian 71, rider-3 3,825, ruby-golem 7, stone-gargoyle 179, troll-rider 8, wind-lord 3

**rated q10** vs the sweet spot: damage -0.3 % · silver -17.7 % · burn +0 · gold 0.0 % · coins 0.0 % · queue -18.5 % · dmg/silver ×1.21 · dmg/merc ×1.00 · dmg/gold ×1.00 · dmg/coin ×1.00. order tie-burn · noStopBeaten ✓.

  - fields ancient-terror 3, archer-3 7,500, battle-boar 239, bear-5 2, black-dragon 3, crystal-dragon 8, desert-vanquisher 22, destructive-colossus 3, emerald-dragon 207, epic-monster-hunter-6 40, ettin 19, fearsome-manticore 20, flaming-centaur 21, gorgon-medusa 78, ice-phoenix 55, jungle-destroyer 7, magic-dragon 62, many-armed-guardian 71, rider-3 3,825, ruby-golem 7, stone-gargoyle 179, troll-rider 8, wind-lord 3

**rated q5** vs the sweet spot: damage -0.3 % · silver -17.7 % · burn +0 · gold 0.0 % · coins 0.0 % · queue -18.5 % · dmg/silver ×1.21 · dmg/merc ×1.00 · dmg/gold ×1.00 · dmg/coin ×1.00. order tie-burn · noStopBeaten ✓.

  - fields ancient-terror 3, archer-3 7,500, battle-boar 239, bear-5 2, black-dragon 3, crystal-dragon 8, desert-vanquisher 22, destructive-colossus 3, emerald-dragon 207, epic-monster-hunter-6 40, ettin 19, fearsome-manticore 20, flaming-centaur 21, gorgon-medusa 78, ice-phoenix 55, jungle-destroyer 7, magic-dragon 62, many-armed-guardian 71, rider-3 3,825, ruby-golem 7, stone-gargoyle 179, troll-rider 8, wind-lord 3

### the 4 000-leadership case of 2026-09-15 (TotalStack’s query; TotalStack and Kai’s answers as rows)

- thrifty funnel: pool 10 → burn 10 → below the sweet spot 10 → queue 8 → dmg/silver 7 → dmg/merc 4 → rated above the sweet spot 4.
- rated q40 funnel: pool 10 → burn 10 → below the sweet spot 10 → queue 10 → dmg/silver 9 → dmg/merc 6 → rated above the sweet spot 0.
- rated q20 funnel: pool 10 → burn 10 → below the sweet spot 10 → queue 10 → dmg/silver 9 → dmg/merc 6 → rated above the sweet spot 0.
- rated q10 funnel: pool 10 → burn 10 → below the sweet spot 10 → queue 10 → dmg/silver 9 → dmg/merc 6 → rated above the sweet spot 0.
- rated q5 funnel: pool 10 → burn 10 → below the sweet spot 10 → queue 10 → dmg/silver 9 → dmg/merc 6 → rated above the sweet spot 2.

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SS | 1,073,738 | 766,600 | 4 | 144 | 0 | 2 d 0 h | 1.40 | 178,496 | 7,457 | ∞ | -29.2 |
| **rated q5** | 1,884,530 | 1,239,400 | 4 | 288 | 0 | 3 d 5 h | 1.52 | 337,542 | 6,544 | ∞ | -2.9 |
| **thrifty** | 1,961,382 | 1,377,100 | 4 | 296 | 0 | 3 d 14 h | 1.42 | 341,988 | 6,626 | ∞ | -1.6 |
| SW | 2,125,775 | 1,521,800 | 5 | 296 | 0 | 3 d 23 h | 1.40 | 277,147 | 7,182 | ∞ | 0.0 |
| AI | 2,577,346 | 1,521,100 | 7 | 408 | 0 | 3 d 23 h | 1.69 | 274,691 | 6,317 | ∞ | 9.5 |

**thrifty** vs the sweet spot: damage -7.7 % · silver -9.5 % · burn -1 · gold 0.0 % · coins 0.0 % · queue -10.1 % · dmg/silver ×1.02 · dmg/merc ×1.23 · dmg/gold ×0.92 · dmg/coin —. order tie-burn · noStopBeaten ✓.

  - fields arbalester-6 10, archer-1 673, archer-2 360, chariot-6 6, epic-monster-hunter-6 10, legionary-6 10, rider-1 318, rider-2 191, rider-3 103, spearman-1 534, spearman-2 291, swordsman-1 545

**rated q40**: no row passes the gates.

**rated q20**: no row passes the gates.

**rated q10**: no row passes the gates.

**rated q5** vs the sweet spot: damage -11.3 % · silver -18.6 % · burn -1 · gold -2.7 % · coins 0.0 % · queue -19.1 % · dmg/silver ×1.09 · dmg/merc ×1.22 · dmg/gold ×0.91 · dmg/coin —. order tie-burn · noStopBeaten ✓.

  - fields arbalester-6 10, archer-1 605, archer-2 324, chariot-6 6, epic-monster-hunter-6 10, legionary-6 9, rider-1 286, rider-2 172, rider-3 93, spearman-1 481, spearman-2 261, swordsman-1 491

### 2026-09-17 export, its setup (7 000 leadership)

- thrifty funnel: pool 32 → burn 13 → below the sweet spot 13 → queue 6 → dmg/silver 3 → dmg/merc 1 → rated above the sweet spot 1.
- rated q40 funnel: pool 32 → burn 32 → below the sweet spot 7 → queue 7 → dmg/silver 6 → dmg/merc 1 → rated above the sweet spot 0.
- rated q20 funnel: pool 32 → burn 32 → below the sweet spot 7 → queue 7 → dmg/silver 6 → dmg/merc 1 → rated above the sweet spot 0.
- rated q10 funnel: pool 32 → burn 32 → below the sweet spot 7 → queue 7 → dmg/silver 6 → dmg/merc 1 → rated above the sweet spot 0.
- rated q5 funnel: pool 32 → burn 32 → below the sweet spot 7 → queue 7 → dmg/silver 6 → dmg/merc 1 → rated above the sweet spot 1.

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 3,203,983 | 2,482,500 | 4 | 360 | 0 | 6 d 22 h | 1.29 | 407,682 | 8,900 | ∞ | -13.6 |
| SS | 3,549,139 | 1,985,200 | 6 | 504 | 0 | 5 d 13 h | 1.79 | 381,901 | 7,042 | ∞ | -9.9 |
| **thrifty = rated q5** | 4,098,844 | 2,178,700 | 7 | 576 | 0 | 6 d 2 h | 1.88 | 388,293 | 7,116 | ∞ | -3.2 |
| SW | 4,442,817 | 2,722,500 | 7 | 576 | 0 | 7 d 14 h | 1.63 | 388,293 | 7,713 | ∞ | 0.0 |
| MX | 6,148,584 | 2,740,100 | 14 | 1,016 | 0 | 7 d 17 h | 2.24 | 342,757 | 6,052 | ∞ | 10.6 |
| AI | 6,550,179 | 3,717,800 | 22 | 1,640 | 0 | 17 d 15 h | 1.76 | 220,200 | 3,994 | ∞ | -24.5 |

**thrifty** vs the sweet spot: damage -7.7 % · silver -20.0 % · burn +0 · gold 0.0 % · coins 0.0 % · queue -19.9 % · dmg/silver ×1.15 · dmg/merc ×1.00 · dmg/gold ×0.92 · dmg/coin —. order tie-burn · noStopBeaten ✓.

  - fields arbalester-6 20, archer-1 1,216, archer-2 649, chariot-6 10, epic-monster-hunter-6 20, legionary-6 20, rider-1 553, rider-2 313, rider-3 166, spearman-1 1,069, spearman-2 583

**rated q40**: no row passes the gates.

**rated q20**: no row passes the gates.

**rated q10**: no row passes the gates.

**rated q5** vs the sweet spot: damage -7.7 % · silver -20.0 % · burn +0 · gold 0.0 % · coins 0.0 % · queue -19.9 % · dmg/silver ×1.15 · dmg/merc ×1.00 · dmg/gold ×0.92 · dmg/coin —. order tie-burn · noStopBeaten ✓.

  - fields arbalester-6 20, archer-1 1,216, archer-2 649, chariot-6 10, epic-monster-hunter-6 20, legionary-6 20, rider-1 553, rider-2 313, rider-3 166, spearman-1 1,069, spearman-2 583

### 2026-09-17 export, 12 000 leadership

- thrifty funnel: pool 60 → burn 60 → below the sweet spot 60 → queue 31 → dmg/silver 3 → dmg/merc 3 → rated above the sweet spot 3.
- rated q40 funnel: pool 60 → burn 60 → below the sweet spot 46 → queue 46 → dmg/silver 3 → dmg/merc 3 → rated above the sweet spot 0.
- rated q20 funnel: pool 60 → burn 60 → below the sweet spot 46 → queue 46 → dmg/silver 3 → dmg/merc 3 → rated above the sweet spot 0.
- rated q10 funnel: pool 60 → burn 60 → below the sweet spot 46 → queue 46 → dmg/silver 3 → dmg/merc 3 → rated above the sweet spot 0.
- rated q5 funnel: pool 60 → burn 60 → below the sweet spot 46 → queue 46 → dmg/silver 3 → dmg/merc 3 → rated above the sweet spot 0.

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 4,400,680 | 4,370,200 | 4 | 360 | 0 | 12 d 4 h | 1.01 | 407,682 | 12,224 | ∞ | -25.7 |
| SS | 4,446,760 | 2,477,300 | 10 | 616 | 0 | 6 d 22 h | 1.80 | 287,777 | 7,219 | ∞ | -25.3 |
| **thrifty** | 6,575,550 | 3,703,800 | 13 | 920 | 0 | 10 d 8 h | 1.78 | 325,266 | 7,147 | ∞ | -12.8 |
| SW | 8,739,455 | 4,698,300 | 17 | 1,224 | 0 | 13 d 5 h | 1.86 | 336,530 | 7,140 | ∞ | 0.0 |
| MX | 8,796,722 | 5,340,800 | 22 | 1,544 | 0 | 20 d 18 h | 1.65 | 282,201 | 5,697 | ∞ | -12.0 |

**thrifty** vs the sweet spot: damage -24.8 % · silver -21.2 % · burn -4 · gold -24.8 % · coins 0.0 % · queue -21.9 % · dmg/silver ×0.95 · dmg/merc ×0.97 · dmg/gold ×1.00 · dmg/coin —. order strict · noStopBeaten ✓.

  - fields arbalester-6 40, archer-1 2,067, archer-2 1,104, chariot-6 16, epic-monster-hunter-6 24, legionary-6 34, rider-1 940, rider-2 532, rider-3 282, spearman-1 1,818, spearman-2 991

**rated q40**: no row passes the gates.

**rated q20**: no row passes the gates.

**rated q10**: no row passes the gates.

**rated q5**: no row passes the gates.

### live account of 2026-09-18 (one hired type, 20 000 leadership)

- thrifty funnel: pool 19 → burn 12 → below the sweet spot 12 → queue 6 → dmg/silver 6 → dmg/merc 6 → rated above the sweet spot 6.
- rated q40 funnel: pool 19 → burn 12 → below the sweet spot 11 → queue 11 → dmg/silver 5 → dmg/merc 5 → rated above the sweet spot 0.
- rated q20 funnel: pool 19 → burn 12 → below the sweet spot 11 → queue 11 → dmg/silver 5 → dmg/merc 5 → rated above the sweet spot 0.
- rated q10 funnel: pool 19 → burn 12 → below the sweet spot 11 → queue 11 → dmg/silver 5 → dmg/merc 5 → rated above the sweet spot 0.
- rated q5 funnel: pool 19 → burn 12 → below the sweet spot 11 → queue 11 → dmg/silver 5 → dmg/merc 5 → rated above the sweet spot 0.

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SS | 3,703,985 | 3,587,300 | 4 | 288 | 0 | 9 d 21 h | 1.03 | 323,582 | 12,861 | ∞ | -25.9 |
| **thrifty** | 5,546,047 | 5,406,200 | 6 | 432 | 0 | 14 d 18 h | 1.03 | 323,582 | 12,838 | ∞ | -15.3 |
| SW | 7,115,941 | 7,699,700 | 6 | 432 | 0 | 21 d 5 h | 0.92 | 323,582 | 16,472 | ∞ | 0.0 |
| MX | 7,374,807 | 7,699,700 | 7 | 488 | 0 | 21 d 5 h | 0.96 | 314,337 | 15,112 | ∞ | -1.0 |
| AI | 7,860,179 | 7,699,700 | 9 | 592 | 0 | 21 d 5 h | 1.02 | 298,414 | 13,277 | ∞ | -3.2 |

**thrifty** vs the sweet spot: damage -22.1 % · silver -29.8 % · burn +0 · gold 0.0 % · coins 0.0 % · queue -30.4 % · dmg/silver ×1.11 · dmg/merc ×1.00 · dmg/gold ×0.78 · dmg/coin —. order tie-burn · noStopBeaten ✓.

  - fields archer-1 3,386, archer-2 1,737, epic-monster-hunter-6 60, rider-1 1,355, rider-2 682, rider-3 391, spearman-1 2,535, spearman-2 1,438

**rated q40**: no row passes the gates.

**rated q20**: no row passes the gates.

**rated q10**: no row passes the gates.

**rated q5**: no row passes the gates.

### live account, evening (hunters 83, legionaries unlimited, chariots 10, arbalesters 60, 11 000)

- thrifty funnel: pool 38 → burn 29 → below the sweet spot 29 → queue 13 → dmg/silver 5 → dmg/merc 3 → rated above the sweet spot 3.
- rated q40 funnel: pool 38 → burn 37 → below the sweet spot 22 → queue 22 → dmg/silver 9 → dmg/merc 5 → rated above the sweet spot 0.
- rated q20 funnel: pool 38 → burn 37 → below the sweet spot 22 → queue 22 → dmg/silver 9 → dmg/merc 5 → rated above the sweet spot 0.
- rated q10 funnel: pool 38 → burn 37 → below the sweet spot 22 → queue 22 → dmg/silver 9 → dmg/merc 5 → rated above the sweet spot 0.
- rated q5 funnel: pool 38 → burn 37 → below the sweet spot 22 → queue 22 → dmg/silver 9 → dmg/merc 5 → rated above the sweet spot 0.

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 4,018,658 | 3,666,300 | 4 | 328 | 0 | 10 d 2 h | 1.10 | 388,797 | 12,252 | ∞ | -19.6 |
| SS | 4,559,792 | 2,681,700 | 10 | 600 | 0 | 7 d 8 h | 1.70 | 277,200 | 7,600 | ∞ | -18.3 |
| **thrifty** | 5,501,565 | 3,216,900 | 11 | 736 | 0 | 8 d 19 h | 1.71 | 305,272 | 7,475 | ∞ | -10.7 |
| SW | 7,108,497 | 4,243,200 | 14 | 936 | 0 | 11 d 17 h | 1.68 | 304,072 | 7,595 | ∞ | 0.0 |
| MX | 8,693,352 | 4,295,200 | 19 | 1,272 | 0 | 11 d 23 h | 2.02 | 303,341 | 6,834 | ∞ | 11.3 |
| AI | 9,336,448 | 4,979,300 | 25 | 1,816 | 0 | 19 d 4 h | 1.88 | 271,179 | 5,141 | ∞ | 1.2 |

**thrifty** vs the sweet spot: damage -22.6 % · silver -24.2 % · burn -3 · gold -21.4 % · coins 0.0 % · queue -24.9 % · dmg/silver ×1.02 · dmg/merc ×1.00 · dmg/gold ×0.98 · dmg/coin —. order strict · noStopBeaten ✓.

  - fields arbalester-6 29, archer-1 2,016, archer-2 1,034, chariot-6 5, epic-monster-hunter-6 35, legionary-6 30, rider-1 806, rider-2 406, rider-3 232, spearman-1 1,509, spearman-2 856

**rated q40**: no row passes the gates.

**rated q20**: no row passes the gates.

**rated q10**: no row passes the gates.

**rated q5**: no row passes the gates.

### Aydae alone, 4 975 (one captain, four hired types — experiment 103’s camp)

- thrifty funnel: pool 21 → burn 17 → below the sweet spot 17 → queue 10 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q40 funnel: pool 21 → burn 17 → below the sweet spot 13 → queue 13 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q20 funnel: pool 21 → burn 17 → below the sweet spot 13 → queue 13 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q10 funnel: pool 21 → burn 17 → below the sweet spot 13 → queue 13 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q5 funnel: pool 21 → burn 17 → below the sweet spot 13 → queue 13 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 2,041,005 | 1,312,900 | 4 | 264 | 0 | 3 d 1 h | 1.55 | 326,680 | 7,731 | ∞ | -24.5 |
| SW | 4,090,332 | 1,948,700 | 10 | 648 | 0 | 5 d 12 h | 2.10 | 295,181 | 6,312 | ∞ | 0.0 |
| MX | 4,774,124 | 2,203,800 | 17 | 1,208 | 0 | 8 d 5 h | 2.17 | 226,038 | 3,952 | ∞ | -9.8 |
| AI | 5,372,331 | 2,705,900 | 26 | 1,816 | 0 | 13 d 10 h | 1.99 | 164,796 | 2,958 | ∞ | -30.1 |

**thrifty**: no row passes the gates.

**rated q40**: no row passes the gates.

**rated q20**: no row passes the gates.

**rated q10**: no row passes the gates.

**rated q5**: no row passes the gates.

### the owner’s live camp of 2026-09-18 (arbalesters 485, legionaries 1 002, bears unlimited)

- thrifty funnel: pool 43 → burn 17 → below the sweet spot 17 → queue 13 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q40 funnel: pool 43 → burn 28 → below the sweet spot 10 → queue 10 → dmg/silver 3 → dmg/merc 0 → rated above the sweet spot 0.
- rated q20 funnel: pool 43 → burn 28 → below the sweet spot 10 → queue 10 → dmg/silver 3 → dmg/merc 0 → rated above the sweet spot 0.
- rated q10 funnel: pool 43 → burn 28 → below the sweet spot 10 → queue 10 → dmg/silver 3 → dmg/merc 0 → rated above the sweet spot 0.
- rated q5 funnel: pool 43 → burn 28 → below the sweet spot 10 → queue 10 → dmg/silver 3 → dmg/merc 0 → rated above the sweet spot 0.

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 2,016,069 | 1,761,200 | 3 | 304 | 0 | 4 d 20 h | 1.14 | 277,917 | 6,632 | ∞ | -21.2 |
| SS | 2,054,337 | 1,587,400 | 9 | 1,648 | 0 | 8 d 14 h | 1.29 | 155,938 | 1,247 | ∞ | -34.7 |
| SW | 4,358,805 | 2,635,500 | 15 | 1,936 | 0 | 12 d 10 h | 1.65 | 204,722 | 2,251 | ∞ | 0.0 |
| MM | 6,608,519 | 3,417,400 | 45 | 5,848 | 0 | 23 d 18 h | 1.93 | 146,856 | 1,130 | ∞ | -16.8 |
| MX | 12,433,369 | 3,481,800 | 87 | 12,872 | 0 | 24 d 4 h | 3.57 | 142,912 | 966 | ∞ | 24.0 |

**thrifty**: no row passes the gates.

**rated q40**: no row passes the gates.

**rated q20**: no row passes the gates.

**rated q10**: no row passes the gates.

**rated q5**: no row passes the gates.

### his camp of 2026-09-19, the localStorage dump (4 975 / 2 180, hunters 450)

- thrifty funnel: pool 20 → burn 8 → below the sweet spot 8 → queue 5 → dmg/silver 4 → dmg/merc 4 → rated above the sweet spot 4.
- rated q40 funnel: pool 20 → burn 16 → below the sweet spot 1 → queue 1 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q20 funnel: pool 20 → burn 16 → below the sweet spot 1 → queue 1 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q10 funnel: pool 20 → burn 16 → below the sweet spot 1 → queue 1 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q5 funnel: pool 20 → burn 16 → below the sweet spot 1 → queue 1 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 1,581,389 | 1,920,900 | 1 | 64 | 0 | 5 d 7 h | 0.82 | 291,224 | 24,709 | ∞ | -7.0 |
| **thrifty** | 1,932,081 | 1,929,300 | 2 | 144 | 0 | 5 d 7 h | 1.00 | 323,582 | 13,417 | ∞ | -0.3 |
| SS | 1,882,911 | 1,790,200 | 3 | 216 | 0 | 6 d 22 h | 1.05 | 323,582 | 8,717 | ∞ | -9.3 |
| SW | 2,385,168 | 2,268,000 | 4 | 272 | 0 | 8 d 18 h | 1.05 | 307,403 | 8,769 | ∞ | 0.0 |
| MM | 3,976,648 | 2,803,600 | 18 | 1,248 | 0 | 15 d 4 h | 1.42 | 156,398 | 3,186 | ∞ | -45.7 |
| MX | 6,050,983 | 3,346,000 | 38 | 2,688 | 0 | 23 d 6 h | 1.81 | 159,236 | 2,251 | ∞ | -118.8 |

**thrifty** vs the sweet spot: damage -19.0 % · silver -14.9 % · burn -2 · gold -47.1 % · coins 0.0 % · queue -39.6 % · dmg/silver ×0.95 · dmg/merc ×1.05 · dmg/gold ×1.53 · dmg/coin —. order breaks · noStopBeaten ✓.

  - fields archer-1 1,210, archer-2 621, epic-monster-hunter-6 20, rider-1 465, rider-2 243, rider-3 139, spearman-1 924, spearman-2 524

**rated q40**: no row passes the gates.

**rated q20**: no row passes the gates.

**rated q10**: no row passes the gates.

**rated q5**: no row passes the gates.

### his camp of 2026-09-19, as his message reads it (5 100 / 2 200, hunters 120)

- thrifty funnel: pool 26 → burn 8 → below the sweet spot 8 → queue 6 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q40 funnel: pool 26 → burn 13 → below the sweet spot 4 → queue 4 → dmg/silver 1 → dmg/merc 0 → rated above the sweet spot 0.
- rated q20 funnel: pool 26 → burn 13 → below the sweet spot 4 → queue 4 → dmg/silver 1 → dmg/merc 0 → rated above the sweet spot 0.
- rated q10 funnel: pool 26 → burn 13 → below the sweet spot 4 → queue 4 → dmg/silver 1 → dmg/merc 0 → rated above the sweet spot 0.
- rated q5 funnel: pool 26 → burn 13 → below the sweet spot 4 → queue 4 → dmg/silver 1 → dmg/merc 0 → rated above the sweet spot 0.

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 1,513,423 | 1,901,800 | 1 | 72 | 0 | 6 d 3 h | 0.80 | 323,582 | 21,020 | ∞ | -17.7 |
| SS | 1,852,405 | 1,795,200 | 2 | 144 | 0 | 4 d 22 h | 1.03 | 323,582 | 12,864 | ∞ | -10.4 |
| SW | 2,807,275 | 2,321,500 | 5 | 360 | 0 | 8 d 22 h | 1.21 | 323,582 | 7,798 | ∞ | 0.0 |
| MX | 2,875,325 | 2,528,100 | 10 | 720 | 0 | 12 d 13 h | 1.14 | 161,791 | 3,994 | ∞ | -30.4 |
| AI | 3,160,727 | 2,776,000 | 11 | 792 | 0 | 13 d 18 h | 1.14 | 161,791 | 3,991 | ∞ | -28.7 |

**thrifty**: no row passes the gates.

**rated q40**: no row passes the gates.

**rated q20**: no row passes the gates.

**rated q10**: no row passes the gates.

**rated q5**: no row passes the gates.

### his TotalStack profile of 2026-09-19 (5 225 / 2 120 / 100 dominance, monster tier 3, hunters V ×80)

- thrifty funnel: pool 20 → burn 20 → below the sweet spot 20 → queue 19 → dmg/silver 16 → dmg/merc 14 → rated above the sweet spot 14.
- rated q40 funnel: pool 20 → burn 20 → below the sweet spot 20 → queue 20 → dmg/silver 17 → dmg/merc 14 → rated above the sweet spot 0.
- rated q20 funnel: pool 20 → burn 20 → below the sweet spot 20 → queue 20 → dmg/silver 17 → dmg/merc 14 → rated above the sweet spot 0.
- rated q10 funnel: pool 20 → burn 20 → below the sweet spot 20 → queue 20 → dmg/silver 17 → dmg/merc 14 → rated above the sweet spot 0.
- rated q5 funnel: pool 20 → burn 20 → below the sweet spot 20 → queue 20 → dmg/silver 17 → dmg/merc 14 → rated above the sweet spot 0.

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SS | 1,000,201 | 811,300 | 1 | 72 | 960 | 2 d 4 h | 1.23 | 168,840 | 13,892 | 1,042 | -14.6 |
| **thrifty** | 1,659,966 | 1,700,000 | 3 | 216 | 960 | 4 d 23 h | 0.98 | 112,560 | 7,685 | 1,729 | -4.8 |
| SW | 2,104,714 | 2,115,100 | 5 | 352 | 960 | 6 d 6 h | 1.00 | 110,309 | 5,979 | 2,192 | 0.0 |
| MX | 2,168,812 | 2,235,700 | 7 | 440 | 960 | 7 d 11 h | 0.97 | 99,696 | 4,929 | 2,259 | -9.1 |

**thrifty** vs the sweet spot: damage -21.1 % · silver -19.6 % · burn -2 · gold -38.6 % · coins 0.0 % · queue -20.4 % · dmg/silver ×0.98 · dmg/merc ×1.02 · dmg/gold ×1.29 · dmg/coin ×0.79. order strict · noStopBeaten ✓.

  - fields archer-1 867, archer-2 437, battle-boar 3, emerald-dragon 4, epic-monster-hunter-5 30, rider-1 417, rider-2 236, rider-3 125, spearman-1 885, spearman-2 455, stone-gargoyle 3, water-elemental 10

**rated q40**: no row passes the gates.

**rated q20**: no row passes the gates.

**rated q10**: no row passes the gates.

**rated q5**: no row passes the gates.

### his usual setup of 2026-09-19 (Aydae alone, 5 200 / 2 000 / 200, monster tier 3, hunters VI ×90)

- thrifty funnel: pool 15 → burn 15 → below the sweet spot 15 → queue 11 → dmg/silver 4 → dmg/merc 3 → rated above the sweet spot 3.
- rated q40 funnel: pool 15 → burn 15 → below the sweet spot 15 → queue 15 → dmg/silver 7 → dmg/merc 4 → rated above the sweet spot 0.
- rated q20 funnel: pool 15 → burn 15 → below the sweet spot 15 → queue 15 → dmg/silver 7 → dmg/merc 4 → rated above the sweet spot 0.
- rated q10 funnel: pool 15 → burn 15 → below the sweet spot 15 → queue 15 → dmg/silver 7 → dmg/merc 4 → rated above the sweet spot 0.
- rated q5 funnel: pool 15 → burn 15 → below the sweet spot 15 → queue 15 → dmg/silver 7 → dmg/merc 4 → rated above the sweet spot 3.

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| HS | 1,850,137 | 1,378,300 | 1 | 72 | 960 | 3 d 12 h | 1.34 | 323,582 | 25,696 | 1,927 | -10.3 |
| **rated q5** | 2,137,145 | 1,501,300 | 1 | 72 | 1,080 | 3 d 20 h | 1.42 | 485,373 | 29,683 | 1,979 | -2.9 |
| **thrifty** | 2,144,572 | 1,545,800 | 1 | 72 | 1,080 | 3 d 22 h | 1.39 | 485,373 | 29,786 | 1,986 | -3.1 |
| SW | 2,941,677 | 2,031,600 | 2 | 136 | 1,560 | 5 d 8 h | 1.45 | 461,105 | 21,630 | 1,886 | 0.0 |
| MX | 3,031,810 | 2,233,600 | 4 | 224 | 1,080 | 7 d 12 h | 1.36 | 258,866 | 13,535 | 2,807 | -22.6 |

**thrifty** vs the sweet spot: damage -27.1 % · silver -23.9 % · burn -1 · gold -47.1 % · coins -30.8 % · queue -26.3 % · dmg/silver ×0.96 · dmg/merc ×1.05 · dmg/gold ×1.38 · dmg/coin ×1.05. order tie-burn · noStopBeaten ✓.

  - fields archer-1 621, archer-2 325, battle-boar 7, emerald-dragon 8, epic-monster-hunter-6 10, rider-1 304, rider-2 159, rider-3 87, spearman-1 596, spearman-2 351, stone-gargoyle 6, swordsman-1 1,013, water-elemental 18

**rated q40**: no row passes the gates.

**rated q20**: no row passes the gates.

**rated q10**: no row passes the gates.

**rated q5** vs the sweet spot: damage -27.3 % · silver -26.1 % · burn -1 · gold -47.1 % · coins -30.8 % · queue -28.1 % · dmg/silver ×0.98 · dmg/merc ×1.05 · dmg/gold ×1.37 · dmg/coin ×1.05. order tie-burn · noStopBeaten ✓.

  - fields archer-1 601, archer-2 315, battle-boar 8, emerald-dragon 7, epic-monster-hunter-6 10, rider-1 294, rider-2 154, rider-3 85, spearman-1 578, spearman-2 341, stone-gargoyle 6, swordsman-1 982, water-elemental 18

### his browser setup of 2026-09-24 (Aydae 50 ★3, 5 600 / 2 180 / 600, monster tier 3, hunters VI ×14)

- thrifty funnel: pool 18 → burn 18 → below the sweet spot 18 → queue 6 → dmg/silver 0 → dmg/merc 0 → rated above the sweet spot 0.
- rated q40 funnel: pool 18 → burn 18 → below the sweet spot 18 → queue 14 → dmg/silver 1 → dmg/merc 1 → rated above the sweet spot 0.
- rated q20 funnel: pool 18 → burn 18 → below the sweet spot 18 → queue 14 → dmg/silver 1 → dmg/merc 1 → rated above the sweet spot 0.
- rated q10 funnel: pool 18 → burn 18 → below the sweet spot 18 → queue 14 → dmg/silver 1 → dmg/merc 1 → rated above the sweet spot 0.
- rated q5 funnel: pool 18 → burn 18 → below the sweet spot 18 → queue 14 → dmg/silver 1 → dmg/merc 1 → rated above the sweet spot 0.

| row | worst | silver | burn | gold | coins | queue | dmg/silver | dmg/merc | dmg/gold | dmg/coin | rating |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| SW | 4,210,521 | 2,370,000 | 1 | 4,596 | 2,520 | 7 d 10 h | 1.78 | 489,636 | 916 | 1,671 | 0.0 |
| AI | 4,406,179 | 2,369,600 | 2 | 4,610 | 2,520 | 7 d 10 h | 1.86 | 342,746 | 956 | 1,748 | -15.4 |

**thrifty**: no row passes the gates.

**rated q40**: no row passes the gates.

**rated q20**: no row passes the gates.

**rated q10**: no row passes the gates.

**rated q5**: no row passes the gates.

