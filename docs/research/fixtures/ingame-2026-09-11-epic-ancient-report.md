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
  structure. Rounds/hits: 28 entries, 18 friendly hits, 10 enemy hits (one per stack).
- Each of our stacks always hits the same enemy squad (best strength-against, else the melee squad for RD3/CHR).
- Enemy squads lose a few units per hit (1–2), so the monster is far from dying — consistent with "damage" being the
  score, not a kill.

## What differs from TotalStack's model (**resolved 2026-09-13**)
- **Our attack order** was SP1, ARC1, ARC2, SP2, RD3, CHR, EMH, merc-A, merc-B — the HP-descending order
  **except that RD1 (3rd by HP) never attacked**: it was killed by the 3rd enemy attack while ARC2 took the 3rd
  friendly slot. TotalStack assumes the next attacker is always the next victim (RD1 would have attacked).
  **Settled by the 2026-09-13 march** (`docs/research/fixtures/ingame-2026-09-13/`): our stacks strike in
  **base-damage descending** order — `count × strength × (1 + Σ strength %)`, features excluded. Here that is
  SP1 135,936 > ARC1 134,385 > ARC2 133,691 > RD1 133,632 > SP2 132,969 > RD3 131,788 > CHR > EMH > merc-A >
  merc-B, so RD1 sits fourth and the enemy's third attack wipes it before its turn — exactly what the report
  shows. The engine reproduces both fights entry for entry with this rule.
- The captain and the dragon appear as "units" in the report (cards 36 ★★ and 38) but never in the hit list.

## Recovery data captured on the way
Temple level 15: "Coût de réanimation des troupes réduit de: divisé par 1.53" — matches the temple table (15 → 1.53).
Unit sheet: Archer I revive cost 4 gold in attack / 40 silver in defence; Rider I 8 gold / 80 silver.

---

# Second report — same monster, 2026-09-11 23:00, Défaite, **enemy first**, 4 enemy squads

Same army (SP1 944, ARC1 930, ARC2 514, SP2 513, RD1 464, RD3 143, CHR6 12, EMH6 22, merc-A 23, merc-B 23).
Health total was +143% in this fight (SP1 HP 944 × 150 × 2.43 = 344,088), strength unchanged.
Defenders: helmet III (melee) 1,420, lion II (mounted) 1,398, eagle II (flying) 897, robed II (ranged "swarm") 55,719.

| # | actor → target | damage | features |
|---|---|---|---|
| 1 | helmet 1,420 → SP1 † | 344,088 | – |
| 2 | ARC1 → eagle | 165,075 | 31,155 |
| 3 | lion 1,398 → ARC1 † | 338,985 | 127,119 |
| 4 | ARC2 → eagle (−1) | 179,951 | 46,723 |
| 5 | eagle 896 → RD1 † | 338,256 | – |
| 6 | SP2 → lion | 159,748 | 27,241 |
| 7 | robed 55,719 → ARC2 † | 337,235 | – |
| 8 | RD3 → robed (−183) | **396,280 "double dégâts"** | 133,618 |
| 9 | CHR → robed (−165) | 355,680 | 224,808 |
| 10 | EMH → helmet (−1) | 399,707 | 271,980 |
| 11 | merc-A → eagle (−2) | 348,289 | 222,433 |
| 12 | merc-B → lion (−2) | 254,334 | 128,915 |
| 13 | helmet 1,419 → SP2 † | 336,579 | – |
| 14 | RD3 → robed (−91) | 198,140 | 66,809 |
| 15 | lion 1,396 → RD3 † | 333,590 | – |
| 16 | CHR → robed (−165) | 355,680 | 224,808 |
| 17 | eagle 894 → CHR † | 332,424 | – |
| 18 | EMH → helmet (−1) | 399,707 | 271,980 |
| 19 | robed 55,115 → EMH † | 322,891 | – |
| 20 | merc-A → eagle (−1) | 348,289 | 222,433 |
| 21 | merc-B → lion (−1) | 254,334 | 128,915 |
| 22 | helmet 1,418 → merc-A † | 318,573 | – |
| 23 | merc-B → lion (−2) | 254,334 | 128,915 |
| 24 | lion 1,393 → merc-B † | 318,573 | – |

## Findings from the pair of reports
- **First strike is a coin flip, and the pair shows both outcomes**: 23:02 = our army struck first (SP1 attacked
  before dying), 23:00 = the monster struck first (SP1 died without attacking). Same army, same monster. This is
  exactly the Enemy-first / Army-first pair that TotalStack's journal toggle shows and that our summary reports as
  Minimum / Maximum with the Average in between (PLAN §3.5, story S-34).
- **Round structure confirmed with N = 4 and enemy first**: E, F, E, F, E, F, E, then the 5 survivors F;
  round 2: E, F, E, F, E, F, E, then survivors; round 3: E, F, E. Exactly the structure TotalStack's journal uses.
- **Double damage exists and is a plain ×2 on a hit**: entry 8 is 2 × 198,140 (entry 14) and the game labels it
  "double dégâts". Rider 3 had 5% (unit) + 3% (bonus) = 8%; one proc in 16 friendly hits across both reports.
- **Friendly attack order** (**answered 2026-09-13**): in both fights the sequence was SP1, ARC1, ARC2, SP2, RD3,
  CHR, EMH, merc-A, merc-B with **RD1 never attacking**, although RD1 is 3rd by HP. The rule is **base damage
  descending** (hit damage without the strength-against part), which ranks RD1 fourth here and wipes it before its
  turn. The two candidates recorded at the time — A "unit count descending" and B "foot units, then mounted, then
  monsters, then mercenaries" — are both refuted by the 2026-09-13 march, where an 18-unit Swordsman I stack
  struck *after* a 3-unit Rider II stack. The enemy's kill order stays pure HP-descending.
- The ranged "swarm" squad (55,719 units) loses 91–183 units per hit and still one-shots our stacks; monster HP
  pools are irrelevant to our result, only the number of enemy squads N matters.
