# Investigation 0014 — TotalStack parity on the owner's 2026-09-13 export

2026-09-13, evening. The owner exported his profile (`pyrrhic-my-account-2026-09-13.json`: G2–G3 mounted-only
at G3 plus SW1, ARC1/SP1/RD1/ARC2 left out of the march, mercenaries EMH6 92 / ABT6 76 / LGN6 72 / CHR6 37,
housing 4,343 / 200 / 800, army +3 % / +3 %, Elite Preservation, RD3 pinned) and saw different damage, damage
per silver and priority answers on totalstack.ca. The same configuration was entered on TotalStack by hand
(Pro trial, Chrome) and every mode was run on both sides.

## 1. The march is the same

| mode | TotalStack | ours |
|---|---|---|
| EP, all 12 types | RD3 112 · RD2 201 · ARC2 403 · SP2 403 · RD1 364 · ARC1 726 · SP1 726 · SW1 731 · mercs 25/51/51/48 | 112 · 201 · 403 · 403 · 363 · 728 · 727 · 730 · mercs 25/51/51/48 |
| EP, the export's 8 types | RD3 278 · SP2 995 · RD2 498 · SW1 1,796 · mercs 25/51/51/48 | 279 · 997 · 497 · 1,794 · 25/51/51/48 |
| Total Optimization, 8 types | RD2 497 · SP2 995 · RD3 280 · SW1 1,794 · EMH6 43 · CHR6 23 · ABT6 46 · LGN6 47, authority 182/200 | M's Preservation + *Allow damage trades*: 497 · 997 · 279 · 1,794 · 43 / 23 / 46 / 47, 182/200 |
| Maximum Damage priority, full pool | RD3 341 · RD2 610 · SP2 1,220 · ARC2 1,221 + 4 mercs (drops ARC1, SP1, RD1, SW1) | `avgDamage`, exhaustive over 4,095 subsets: the same four types, 341 · 609 · 1,220 · 1,223 |

Every journal line is identical to the unit (ABT6 593,028 incl. 493,221; LGN6 385,662; CHR6 566,200;
SP2 58,757; RD2 72,722; RD3 89,242 …), the enemy's kill order is the same, and TotalStack's friendly attack
order in this journal is base-damage descending too (RD1 strikes before ARC1 and SP1, which out-HP it), the
rule settled in game on 2026-09-13. Retrain silver (1,923,500 vs 1,924,300), gold (1,416) and time (7 d 3 h)
agree; the ±1 counts are the per-unit HP rounding already tolerated by the fixtures.

## 2. Why the damage figures differ — TotalStack's summary, not the fight

TotalStack's Battle Summary uses `base + 2 × features` per hit (`battle-model-observations.md` §2) and its
implied maximum adds the first stack's army-first hit plus double damage priced at **twice** its chance.
On this army the strength-against part is enormous (EMH6 +609 %, ABT6 +509 %, CHR6 +493 %), so:

| 8-type EP march | TotalStack | ours | ours, recomputed with TotalStack's per-hit value |
|---|---|---|---|
| minimum | 4,555,372 | 2,750,191 | 4,557,479 |
| average | 5,312,632 | 3,097,078 | 5,201,071 (+ 2 × 5 % × rider/chariot damage ≈ TotalStack) |
| damage / silver | 2.762 | 1.609 | 2.703 |

Total Optimization: TotalStack minimum 7,607,442, ours recomputed the same way 7,606,577.

Damage per silver is the same formula in both tools — the displayed average divided by the retrain silver,
mercenaries costing silver in neither — so it inherits the numerator's inflation and nothing else. The
game's own report counts features once on every line (four reports, `fixtures/ingame-2026-09-13`); its
headline figure matches neither formula. We keep the journal sum: it is the number a player can add up.

## 3. Mercenaries: "die last" is a method, not a default

Under Elite Preservation **both** tools put the four mercenary stacks (≈ 300 k HP each at authority 200)
above the eight troop stacks (≈ 113 k, or ≈ 277 k with four troop types), so the mercenaries die first and
EMH6 never strikes when the enemy opens (TotalStack journal entry 1: *Monster squad dealt 301,104 damage to
your Epic Monster Hunter VI squad*, 0 hits). What the owner saw on TotalStack — mercenaries added "at the end"
— is its Total Optimization (the saved profile there has it selected), which sizes them just under the
smallest troop stack; our M's Preservation with *Allow damage trades* lands on the very same counts. The other
way to get them last is the Maximum Damage priority: with four troop types the troop stacks reach 339 k and
the mercenaries fall below them, which doubles their hits (damage by mercenaries 3,487,635 → 6,975,269).

On the export as it stands ours cannot reach TotalStack's Maximum Damage answer because ARC2 is excluded
from the march; with the exclusion lifted the two searches agree exactly.

## 4. Priorities

- TotalStack returns the **same** march for Maximum Damage and Damage / Silver on this army (checked twice,
  once after *Restore all*). Under its own formula the cheap-troop march (SW1 + ARC1 + four mercs) scores
  4.18 per silver against the 3.55 it returns, so its Damage / Silver search is not exhaustive.
- Ours separates them: on the export, `avgDamage` keeps SP2 · RD2 · RD3 · EMH6 · ABT6 · CHR6 (4,064,580) and
  `damagePerSilver` keeps SW1 · RD2 · RD3 and all four mercenaries (2.005 per silver, 3,713,486).
- "Only the best troops" is not what the fight rewards: with a flat HP profile every troop stack hits for
  about the same base damage, so the levers are the number of stacks and whether the troop stacks out-HP the
  mercenaries. Both tools keep four troop types for that reason.
- Damage per silver as a pure ratio still has the degenerate peak of 0013 §3: on the full pool ours picks
  SW1 + ARC1 + mercenaries (2.35). Open product question unchanged — a damage floor, or a "best per silver
  among marches within x % of the maximum".

## 5. What would actually be a step up

The search chooses unit types under one fixed sizing method. On this army the method matters more than the
subset: EP + `avgDamage` on the export gives 4,064,580, M's Preservation + trades 4,257,493 (+4.7 %), and on
the full pool both converge on the Maximum Damage march. A combined search — every method (EP, MP, MP with
trades) × every subset, best score wins, with the mercenary stacks either at full authority or sized just
below the smallest troop stack — is a few dozen lines on top of `searchPriority` and would answer the
owner's "optimise everything, mercenaries and order included" without a new sizer.
