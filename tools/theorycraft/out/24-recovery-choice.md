# B4 — retrain, revive, or a bit of both

Temple 15 on this account, so every revived unit costs `revival.gold / 1.53` — or **3 sacred potions**, the same 90 %, never both. The tenth of every stack (`ceil(n/10)`) cannot be revived and is recruited again, which is why a "revive all" still shows silver and a training timer.

## 1. The exchange rate per unit type


For one unit brought back by the Temple instead of the Army tab:

```
silver saved per gold spent  = training.silver × templeDivisor / revival.gold
silver saved per potion       = training.silver / 3
seconds saved per gold spent  = training.seconds × templeDivisor / revival.gold
```

The temple divisor is the *only* place the temple level enters: it never touches silver or time.

| rank | unit | training silver | training seconds | revival gold | gold at temple 15 | **silver per gold** | silver per potion | seconds per gold |
|---|---|---|---|---|---|---|---|---|
| 1 | RD3 | 1,400 | 840 | 8 | 5.23 | 267.75 | 466.67 | 160.65 |
| 2 | ARC2 | 500 | 180 | 4 | 2.61 | 191.25 | 166.67 | 68.85 |
| 3 | RD2 | 1,000 | 360 | 8 | 5.23 | 191.25 | 333.33 | 68.85 |
| 4 | SP2 | 500 | 180 | 4 | 2.61 | 191.25 | 166.67 | 68.85 |
| 5 | ARC1 | 300 | 15 | 4 | 2.61 | 114.75 | 100 | 5.74 |
| 6 | RD1 | 600 | 30 | 8 | 5.23 | 114.75 | 200 | 5.74 |
| 7 | SP1 | 300 | 15 | 4 | 2.61 | 114.75 | 100 | 5.74 |
| 8 | SW1 | 300 | 15 | 4 | 2.61 | 114.75 | 100 | 5.74 |
| 9 | ABT6 | — (hired) | — | 8 | 5.23 | 0 | 0 | 0 |
| 10 | CHR6 | — (hired) | — | 16 | 10.46 | 0 | 0 | 0 |
| 11 | EMH6 | — (hired) | — | 8 | 5.23 | 0 | 0 | 0 |
| 12 | LGN6 | — (hired) | — | 8 | 5.23 | 0 | 0 | 0 |

**Revive in this order when gold is short.** The ranking is `training.silver × 1.53 / revival.gold`, and it
is a property of the unit type alone — it does not depend on the march, the bonuses or the stack size.
Top of the list: **RD3** at 267.75 silver per gold. Bottom of the useful
list are the tier-1 types (ARC1, SP1, SW1, RD1) at 114.75 — a rider I costs twice the silver of an archer I
but also twice the revival gold, so they tie exactly.

**The four hired types are a different question entirely.** They have no training row, so reviving them
saves no silver at all — the ratio is 0. You revive them because the alternative is not "pay silver", it is
**losing them for ever**. Their gold is not optional: it is the rent on the stock, and it is charged under
the retrain plan too.

## 2. Selective recovery: what the game offers and what the ranking wants


The Temple offers TOP 1 / TOP 2 / TOP 3 / CUSTOM, and the engine implements "top-N by tier, retrain the rest" (`recoveryCosts` sorts by `unit.tier`). That is **not** the gold-efficient order: tier and `silver × 1.53 / gold` are different rankings. Below, both, for the owner's 8-type march.

### A (export bonuses) · owner's 8 types

March: SW1 1,794 · SP2 997 · RD2 497 · LGN6 47 · RD3 279 · ABT6 46 · CHR6 23 · EMH6 43 — 4,257,493 avg damage.

| plan | silver | gold | potions instead of gold | training time 0 % | damage / silver | damage / gold |
|---|---|---|---|---|---|---|
| retrain all | 1,924,300 | 842 | 423 | 7d 4h | 2.21 | 5,056.4 |
| revive all | 193,200 | 11,056 | 10,050 | 17h 17m | 22.04 | 385.08 |
| selective TOP 1 by tier (ABT6) | 1,924,300 | 842 | 423 | 7d 4h | 2.21 | 5,056.4 |
| selective TOP 2 by tier (ABT6 CHR6) | 1,924,300 | 842 | 423 | 7d 4h | 2.21 | 5,056.4 |
| selective TOP 3 by tier (ABT6 CHR6 EMH6) | 1,924,300 | 842 | 423 | 7d 4h | 2.21 | 5,056.4 |
| selective TOP 4 by tier (ABT6 CHR6 EMH6 LGN6) | 1,924,300 | 842 | 423 | 7d 4h | 2.21 | 5,056.4 |
| selective TOP 5 by tier (ABT6 CHR6 EMH6 LGN6 RD3) | 1,572,900 | 2,154 | 1,176 | 4d 17h | 2.71 | 1,976.55 |
| selective TOP 6 by tier (ABT6 CHR6 EMH6 LGN6 RD3 RD2) | 1,125,900 | 4,492 | 2,517 | 2d 20h | 3.78 | 947.79 |
| selective TOP 7 by tier (ABT6 CHR6 EMH6 LGN6 RD3 RD2 SP2) | 677,400 | 6,837 | 5,208 | 1d 0h | 6.29 | 622.71 |
| selective TOP 8 by tier (ABT6 CHR6 EMH6 LGN6 RD3 RD2 SP2 SW1) | 193,200 | 11,056 | 10,050 | 17h 17m | 22.04 | 385.08 |

**Note on TOP N.** The engine ranks by `unit.tier`, and the four hired types are tier 6, so TOP 1 to TOP 4 revive *only mercenaries* — which costs exactly what retraining them costs, because a mercenary is bought back in gold either way. **The first four steps of the in-game selective plan change nothing at all on this account.** Only TOP 5 and beyond start saving silver, and they do it in tier order (RD3, then RD2, then SP2…), which happens to agree with the gold-efficient order here but need not in general.

**Gold-efficient frontier** — revive the troop types in `silver × 1.53 / gold` order:

| types revived (best first) | gold spent | silver paid | silver saved vs retrain all | silver saved per extra gold |
|---|---|---|---|---|
| (none — retrain all) | 842 | 1,924,300 | 0 | — |
| RD3 | 2,154 | 1,572,900 | 351,400 | 267.84 |
| RD3 + SP2 | 4,499 | 1,124,400 | 799,900 | 191.26 |
| RD3 + SP2 + RD2 | 6,837 | 677,400 | 1,246,900 | 191.19 |
| RD3 + SP2 + RD2 + SW1 | 11,056 | 193,200 | 1,731,100 | 114.77 |

### A (export bonuses) · single-march winner, 7 types

March: ARC2 1,699 · RD2 847 · EMH6 75 · RD3 475 · ABT6 76 · CHR6 37 · LGN6 72 — 5,573,521 avg damage.

| plan | silver | gold | potions instead of gold | training time 0 % | damage / silver | damage / gold |
|---|---|---|---|---|---|---|
| retrain all | 2,361,500 | 1,386 | 696 | 11d 16h | 2.36 | 4,021.3 |
| revive all | 237,200 | 11,600 | 8,850 | 1d 4h | 23.5 | 480.48 |
| selective TOP 1 by tier (ABT6) | 2,361,500 | 1,386 | 696 | 11d 16h | 2.36 | 4,021.3 |
| selective TOP 2 by tier (ABT6 CHR6) | 2,361,500 | 1,386 | 696 | 11d 16h | 2.36 | 4,021.3 |
| selective TOP 3 by tier (ABT6 CHR6 EMH6) | 2,361,500 | 1,386 | 696 | 11d 16h | 2.36 | 4,021.3 |
| selective TOP 4 by tier (ABT6 CHR6 EMH6 LGN6) | 2,361,500 | 1,386 | 696 | 11d 16h | 2.36 | 4,021.3 |
| selective TOP 5 by tier (ABT6 CHR6 EMH6 LGN6 RD3) | 1,763,700 | 3,618 | 1,977 | 7d 12h | 3.16 | 1,540.5 |
| selective TOP 6 by tier (ABT6 CHR6 EMH6 LGN6 RD3 ARC2) | 999,200 | 7,616 | 6,564 | 4d 8h | 5.58 | 731.82 |
| selective TOP 7 by tier (ABT6 CHR6 EMH6 LGN6 RD3 ARC2 RD2) | 237,200 | 11,600 | 8,850 | 1d 4h | 23.5 | 480.48 |

**Note on TOP N.** The engine ranks by `unit.tier`, and the four hired types are tier 6, so TOP 1 to TOP 4 revive *only mercenaries* — which costs exactly what retraining them costs, because a mercenary is bought back in gold either way. **The first four steps of the in-game selective plan change nothing at all on this account.** Only TOP 5 and beyond start saving silver, and they do it in tier order (RD3, then RD2, then SP2…), which happens to agree with the gold-efficient order here but need not in general.

**Gold-efficient frontier** — revive the troop types in `silver × 1.53 / gold` order:

| types revived (best first) | gold spent | silver paid | silver saved vs retrain all | silver saved per extra gold |
|---|---|---|---|---|
| (none — retrain all) | 1,386 | 2,361,500 | 0 | — |
| RD3 | 3,618 | 1,763,700 | 597,800 | 267.83 |
| RD3 + ARC2 | 7,616 | 999,200 | 1,362,300 | 191.22 |
| RD3 + ARC2 + RD2 | 11,600 | 237,200 | 2,124,300 | 191.27 |

### B (bonuses proven in game) · owner's 8 types

March: SW1 2,307 · SP2 796 · RD2 397 · RD3 223 · EMH6 35 · ABT6 37 · LGN6 37 · CHR6 18 — 4,474,506 avg damage.

| plan | silver | gold | potions instead of gold | training time 0 % | damage / silver | damage / gold |
|---|---|---|---|---|---|---|
| retrain all | 1,799,300 | 675 | 339 | 5d 21h | 2.49 | 6,628.9 |
| revive all | 181,500 | 10,886 | 10,386 | 14h 19m | 24.65 | 411.03 |
| selective TOP 1 by tier (ABT6) | 1,799,300 | 675 | 339 | 5d 21h | 2.49 | 6,628.9 |
| selective TOP 2 by tier (ABT6 CHR6) | 1,799,300 | 675 | 339 | 5d 21h | 2.49 | 6,628.9 |
| selective TOP 3 by tier (ABT6 CHR6 EMH6) | 1,799,300 | 675 | 339 | 5d 21h | 2.49 | 6,628.9 |
| selective TOP 4 by tier (ABT6 CHR6 EMH6 LGN6) | 1,799,300 | 675 | 339 | 5d 21h | 2.49 | 6,628.9 |
| selective TOP 5 by tier (ABT6 CHR6 EMH6 LGN6 RD3) | 1,519,300 | 1,720 | 939 | 3d 22h | 2.95 | 2,601.46 |
| selective TOP 6 by tier (ABT6 CHR6 EMH6 LGN6 RD3 RD2) | 1,162,300 | 3,587 | 2,010 | 2d 10h | 3.85 | 1,247.42 |
| selective TOP 7 by tier (ABT6 CHR6 EMH6 LGN6 RD3 RD2 SP2) | 804,300 | 5,459 | 4,158 | 22h 58m | 5.56 | 819.66 |
| selective TOP 8 by tier (ABT6 CHR6 EMH6 LGN6 RD3 RD2 SP2 SW1) | 181,500 | 10,886 | 10,386 | 14h 19m | 24.65 | 411.03 |

**Note on TOP N.** The engine ranks by `unit.tier`, and the four hired types are tier 6, so TOP 1 to TOP 4 revive *only mercenaries* — which costs exactly what retraining them costs, because a mercenary is bought back in gold either way. **The first four steps of the in-game selective plan change nothing at all on this account.** Only TOP 5 and beyond start saving silver, and they do it in tier order (RD3, then RD2, then SP2…), which happens to agree with the gold-efficient order here but need not in general.

**Gold-efficient frontier** — revive the troop types in `silver × 1.53 / gold` order:

| types revived (best first) | gold spent | silver paid | silver saved vs retrain all | silver saved per extra gold |
|---|---|---|---|---|
| (none — retrain all) | 675 | 1,799,300 | 0 | — |
| RD3 | 1,720 | 1,519,300 | 280,000 | 267.94 |
| RD3 + SP2 | 3,592 | 1,161,300 | 638,000 | 191.24 |
| RD3 + SP2 + RD2 | 5,459 | 804,300 | 995,000 | 191.22 |
| RD3 + SP2 + RD2 + SW1 | 10,886 | 181,500 | 1,617,800 | 114.76 |

### B (bonuses proven in game) · single-march winner, 7 types

March: ARC2 1,697 · RD2 848 · EMH6 75 · RD3 475 · ABT6 76 · CHR6 37 · LGN6 72 — 7,843,624 avg damage.

| plan | silver | gold | potions instead of gold | training time 0 % | damage / silver | damage / gold |
|---|---|---|---|---|---|---|
| retrain all | 2,361,500 | 1,386 | 696 | 11d 16h | 3.32 | 5,659.18 |
| revive all | 237,200 | 11,600 | 8,847 | 1d 4h | 33.07 | 676.17 |
| selective TOP 1 by tier (ABT6) | 2,361,500 | 1,386 | 696 | 11d 16h | 3.32 | 5,659.18 |
| selective TOP 2 by tier (ABT6 CHR6) | 2,361,500 | 1,386 | 696 | 11d 16h | 3.32 | 5,659.18 |
| selective TOP 3 by tier (ABT6 CHR6 EMH6) | 2,361,500 | 1,386 | 696 | 11d 16h | 3.32 | 5,659.18 |
| selective TOP 4 by tier (ABT6 CHR6 EMH6 LGN6) | 2,361,500 | 1,386 | 696 | 11d 16h | 3.32 | 5,659.18 |
| selective TOP 5 by tier (ABT6 CHR6 EMH6 LGN6 RD3) | 1,763,700 | 3,618 | 1,977 | 7d 12h | 4.45 | 2,167.94 |
| selective TOP 6 by tier (ABT6 CHR6 EMH6 LGN6 RD3 ARC2) | 1,000,200 | 7,610 | 6,558 | 4d 8h | 7.84 | 1,030.7 |
| selective TOP 7 by tier (ABT6 CHR6 EMH6 LGN6 RD3 ARC2 RD2) | 237,200 | 11,600 | 8,847 | 1d 4h | 33.07 | 676.17 |

**Note on TOP N.** The engine ranks by `unit.tier`, and the four hired types are tier 6, so TOP 1 to TOP 4 revive *only mercenaries* — which costs exactly what retraining them costs, because a mercenary is bought back in gold either way. **The first four steps of the in-game selective plan change nothing at all on this account.** Only TOP 5 and beyond start saving silver, and they do it in tier order (RD3, then RD2, then SP2…), which happens to agree with the gold-efficient order here but need not in general.

**Gold-efficient frontier** — revive the troop types in `silver × 1.53 / gold` order:

| types revived (best first) | gold spent | silver paid | silver saved vs retrain all | silver saved per extra gold |
|---|---|---|---|---|
| (none — retrain all) | 1,386 | 2,361,500 | 0 | — |
| RD3 | 3,618 | 1,763,700 | 597,800 | 267.83 |
| RD3 + ARC2 | 7,610 | 1,000,200 | 1,361,300 | 191.26 |
| RD3 + ARC2 + RD2 | 11,600 | 237,200 | 2,124,300 | 191.23 |


## 3. What reviving does to the campaign of B3


A march at full leadership costs the same silver every time, so the only thing that changes is *how much*. Reviving everything divides the troops' silver by about ten (only `ceil(n/10)` is recruited) and the training time by the same factor, and replaces it with gold. The stock still falls by `ceil(n/10)` a march either way — **nothing buys a mercenary back**.

| scenario | march | retrain silver | revive silver | ÷ | retrain gold | revive gold | potions instead | marches for 20 M silver (retrain) | marches for 20 M silver (revive) | gold for those marches |
|---|---|---|---|---|---|---|---|---|---|---|
| A | 8 types | 1,924,300 | 193,200 | 10.0 | 842 | 11,056 | 10,050 | 10 | 103 | 1,138,768 |
| A | 7 types | 2,361,500 | 237,200 | 10.0 | 1,386 | 11,600 | 8,850 | 8 | 84 | 974,400 |
| B | 8 types | 1,799,300 | 181,500 | 9.9 | 675 | 10,886 | 10,386 | 11 | 110 | 1,197,460 |
| B | 7 types | 2,361,500 | 237,200 | 10.0 | 1,386 | 11,600 | 8,847 | 8 | 84 | 974,400 |

- **Silver per march falls by a factor of ~10** (the tenth that cannot be revived), so a 20 M silver budget
  goes from ~11 marches to ~110 — except the stock runs out long before that: at 30 mercenaries lost a
  march, the full-cap plan has about 10 marches in it whatever the silver. Reviving therefore converts the
  owner's problem from "silver-bound" to "stock-bound and gold-bound", which is exactly the regime where
  B3's spend lever starts to matter.
- **The gold bill is the new constraint.** Reviving a full 7-type march costs ~11.6 K gold; thirty of them
  is ~350 K gold. If gold is short, the frontier tables above say which types to buy back first, and the
  answer is always the *expensive-to-train, cheap-to-revive* ones — RD3 first, then RD2 and SP2/ARC2.
- **Potions are the gold-free alternative at 3 per unit.** A full 7-type march needs ~8,850 potions to
  revive its 90 %; the same march is ~11.6 K gold. That sets the internal exchange rate of this account at
  roughly **1.3 gold per potion** — below that, pay gold; above it, spend potions.
- **Nothing here saves a mercenary.** The `ceil(n/10)` toll is untouched by the recovery plan: it is the
  10 % the Temple explicitly refuses, and the hired types have no Army-tab price at which to buy it back.
