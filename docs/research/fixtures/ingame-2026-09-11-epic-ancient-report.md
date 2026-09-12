# In-game battle report — epic "Troupe Ancienne" (K:319 X:953 Y:417), 2026-09-11 23:02, result: Défaite

Read directly from the game's Journal on 2026-09-12. Account Zololar. Captain (level 36, ★★) and Dragon (level 38)
marched. Unit sheets in the report show the account's totals at the time: **Force +188%, Santé +144%** (Rider I sheet;
"+2%" category bonus is included for melee/ranged/mounted units — EMH, which has no category, shows 142%),
double-damage +3.0% (bonus) on top of the riders' own 5%, revival cost ÷1.53 (Temple 15). Initiative is 10 for
Archer I and Rider I alike (Vitesse 61 / 73), so initiative does not explain the attack order.

## Army sent (report list order) and the enemy
Attackers: ARC1 930, ARC2 514, SP1 944, SP2 513, RD1 464, RD3 143, EMH6 22, merc-A6 23, merc-B6 23, CHR6 12
(all lost). Total damage shown: 5.67M.
Defenders (3 squads): eagle II (flying) 337 (−6), helmet III (melee) 1,055 (−5), lion II (mounted) 631 (−7).

## Hit list (28 entries, verbatim numbers)
| # | actor → target | damage | of which "features" |
|---|---|---|---|
| 1 | SP1 944 → lion (mounted) | 154,344 | 18,408 |
| 2 | helmet 1,055 → SP1 † | 345,504 | – |
| 3 | ARC1 930 → eagle (flying) | 165,540 | 31,154 |
| 4 | lion 631 → ARC1 † | 340,380 | 127,642 |
| 5 | ARC2 514 → eagle (−1) | 180,414 | 46,723 |
| 6 | eagle 336 → RD1 † | 339,648 | – |
| 7 | SP2 513 → lion (−1) | 160,209 | 27,240 |
| 8 | RD3 143 → helmet | 131,788 | – |
| 9 | CHR 12 → helmet | 131,328 | – |
| 10 | EMH 22 → helmet (−2) | 400,153 | 271,979 |
| 11 | merc-A 23 → eagle (−2) | 348,726 | 222,433 |
| 12 | merc-B 23 → lion (−2) | 254,771 | 128,915 |
| 13 | helmet 1,053 → ARC2 † | 338,623 | – |
| 14 | SP2 → lion (−1) | 160,209 | 27,240 |
| 15 | lion 627 → SP2 † | 337,964 | – |
| 16 | RD3 → helmet | 131,788 | – |
| 17 | eagle 334 → RD3 † | 334,963 | – |
| 18 | CHR → helmet (−1) | 131,328 | – |
| 19 | EMH → helmet (−1) | 400,153 | 271,979 |
| 20 | merc-A → eagle (−1) | 348,726 | 222,433 |
| 21 | merc-B → lion (−1) | 254,771 | 128,915 |
| 22 | helmet 1,051 → CHR † | 333,792 | 103,590 |
| 23 | EMH → helmet (−1) | 400,153 | 271,979 |
| 24 | lion 626 → EMH † | 324,231 | – |
| 25 | merc-A → eagle (−2) | 348,726 | 222,433 |
| 26 | eagle 331 → merc-A † | 319,884 | – |
| 27 | merc-B → lion (−2) | 254,771 | 128,915 |
| 28 | helmet 1,050 → merc-B † | 319,884 | – |

## What this confirms (exact matches)
- **Enemy damage line = destroyed stack HP** = count × round?(base × (1 + Σ health)):
  RD1 464 × 300 × 2.44 = 339,648 ✓; SP1 944 × 150 × 2.44 = 345,504 ✓; ARC1 930 × 150 × 2.44 = 340,380 ✓;
  ARC2 514 × 270 × 2.44 = 338,623 ✓; SP2 513 × 270 × 2.44 = 337,964 ✓; RD3 143 × 960 × 2.44 = 334,963 ✓;
  CHR 12 × 11,400 × 2.44 = 333,792 ✓; merc 23 × 5,700 × 2.44 = 319,884 ✓; EMH 22 × 6,090 × 2.42 = 324,231 ✓.
- **Our damage per hit = count × str × (1 + Σ strength) + count × str × SA[target]** with SA on base strength:
  SP1 944 × 50 × 2.88 = 135,936 + 944 × 50 × 0.39 = 18,408 → 154,344 ✓; ARC2 514 × 90 × 2.89 = 133,691 +
  514 × 90 × 1.01 = 46,723 → 180,414 ✓; SP2 513 × 90 × 2.88 + 513 × 90 × 0.59 = 27,240 → 160,209 ✓;
  RD3 143 × 320 × 2.88 = 131,788 ✓ (no SA vs melee). Ranged units use 2.89 vs 2.88 for the others (+1% ranged strength).
- Damage is constant across hits (no randomness observed; no double-damage proc in 16 friendly hits).
- **Enemy target = our highest-HP living stack**, every time (10/10 kills), regardless of its own strength-against.
- **Round structure** with N = 3 enemy squads: round 1 (army first): F, E, F, E, F, E, then all survivors F;
  rounds 2+: E, F, E, F, E, F, then survivors F; final lone stack killed by an extra E. Identical to TotalStack's journal
  structure. Rounds/hits: 28 entries, 16 friendly hits, 12 enemy hits.
- Each of our stacks always hits the same enemy squad (best strength-against, else the melee squad for RD3/CHR).
- Enemy squads lose a few units per hit (1–2), so the monster is far from dying — consistent with "damage" being the
  score, not a kill.

## What differs from TotalStack's model (open)
- **Our attack order** was SP1, ARC1, ARC2, SP2, RD3, CHR, EMH, merc-A, merc-B — this is the HP-descending order
  **except that RD1 (3rd by HP) never attacked**: it was killed by the 3rd enemy attack while ARC2 took the 3rd
  friendly slot. TotalStack assumes the next attacker is always the next victim (RD1 would have attacked). So the
  game's friendly order is not simply HP order. Hypotheses to test on a second report: (a) the enemy's next victim is
  skipped in the friendly sequence, (b) mounted units act after foot units, (c) order follows the march list
  (ARC1, ARC2, SP1, SP2, RD1, RD3, mercs — rejected, SP1 attacked first). Effect on totals: at most one hit of one
  stack per round (~2–3% of damage) — small, but the engine should model it once known.
- The captain and the dragon appear as "units" in the report (cards 36 ★★ and 38) but never in the hit list.

## Recovery data captured on the way
Temple level 15: "Coût de réanimation des troupes réduit de: divisé par 1.53" — matches the temple table (15 → 1.53).
Unit sheet: Archer I revive cost 4 gold in attack / 40 silver in defence; Rider I 8 gold / 80 silver.
