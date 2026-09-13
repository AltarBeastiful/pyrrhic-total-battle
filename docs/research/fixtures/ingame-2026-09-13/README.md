# In-game capture, 2026-09-13 — the march that settled the attack order (S-30)

Account Zololar, temple 15 (revival cost ÷ 1.53). A deliberate 9-stack march was sent at an epic monster to
separate three candidate friendly-attack-order rules; the Temple and the unit cards were captured on the way.
Screenshots here are downscaled JPEGs; the full-size originals stay outside the repository
(`~/projects/tba/captures/{reports,recovery,unit-cards}/20260913-141952/`).

| file | what it shows |
|---|---|
| `report2-aydae-march-summary-p1.jpg` | the march (9 stacks + captain 37, all lost) and the 4 enemy squads |
| `report2-aydae-march-journal-p1…p8.jpg` | the 21 hit-list entries, verbatim |
| `revive-p1.jpg` | Temple header: "here you can revive up to **90 %** of your fallen troops", potion rows (3 potions per unit) |
| `revive-p6.jpg`, `revive-p7.jpg` | the gold rows with their sliders, and "Revive all 15.6 K gold" |
| `temple-building.jpg` | temple level 15, potion production and stock |
| `card-archer1-p1/p2.jpg` | a guardsman's card: base 50/150, features, Health +145.5 %, Strength +175.0 %, double damage +3.8 %, "revival cost reduced by 1.53 times", revival 4 gold (attack) / 40 silver (defence) |
| `card-swordsman1-p2.jpg` | the same card for a **Specialist**: Health +76.0 %, Strength +96.0 % — far below the guardsmen |
| `card-rider3-p2.jpg`, `card-arbalester6-p1.jpg` | Rider III (own +5 % double damage) and the mercenary |
| `report2-detail-archer1.jpg` | the troop-detail popup **inside the report** — the bonuses as they applied in this fight |

## The fight — "Epic Inferno squad" (K:319 X:511 Y:491), 13:27, Defeat, **enemy first**, 4 squads

Enemy squads (power): 32,299,564 (A) · 4,796,434 (B) · 3,632,642 (C) · 2,210,576 (D).
Our march, in the order the enemy wiped it (= total HP descending, 9/9):

| # | stack | units | total HP (enemy damage line) | hit damage | of which features | base damage |
|---|---|---|---|---|---|---|
| 1 | Arbalester VI (mercenary) | 2 | 27,758 | never struck | — | ≈10,906 |
| 2 | Spearman I | 20 | 7,289 | 3,260 | 390 | 2,870 |
| 3 | Archer I | 16 | 5,843 | 2,840 | 536 | 2,304 |
| 4 | Spearman II | 8 | 5,248 | 2,491 | 425 | 2,066 |
| 5 | Rider III | 2 | 4,665 | 2,771 | 935 | 1,836 |
| 6 | Rider I | 6 | 4,373 | 2,112 | 390 | 1,722 |
| 7 | Swordsman I (specialist) | 18 | 4,077 | 1,719 | 180 | 1,539 |
| 8 | Rider II | 3 | 3,936 | 2,079 | 530 | 1,549 |
| 9 | Archer II | 2 | 1,314 | 700 | 182 | 518 |

Hit list: `1 E>ABT6 · 2 SP1 · 3 E>SP1 · 4 ARC1 · 5 E>ARC1 · 6 SP2 · 7 E>SP2 · 8 RD3 · 9 RD1 · 10 RD2 ·
11 SW1 · 12 ARC2 · 13 E>RD3 · 14 RD1 (double damage 4,224 incl. 780) · 15 E>RD1 · 16 RD2 · 17 E>SW1 ·
18 ARC2 · 19 E>RD2 · 20 ARC2 · 21 E>ARC2`.

## The troop-detail popup inside the report (`report2-detail-archer1.jpg`)

Clicking a troop row in the report opens its card with the bonuses **that fight** was computed with — the
authority for reconciling a report, and different from the Army-tab card, which shows the account *now*.
Archer I, transcribed: *Guardsman, Human, Ranged unit*; Initiative 10, Food 5, Carrying capacity 100, Revival
cost after an attack 4 Gold / after defending 40 Silver. **Features**: strength against melee +52 %, against
flying +67 %. **Bonuses**: carrying capacity +5.5 %, chance to deal double damage **+3.0 %**, health
**+143.5 %**, health in a battle against another player +5.0 %, march speed +29.7 %, strength **+188.0 %**,
training cost −13.5 %, training speed +47.9 %, troop revival cost reduced by 1.53 times. **No
strike-two-squads line** — which is why entry 20 is probably not a proc.

Every figure checks out against the hit list: `16 × 150 × 2.435 = 5,843` is the enemy's damage line for that
stack (+143.5 % health), `16 × 50 × 2.88 = 2,304` its base damage (+188 % strength) and `16 × 50 × 0.67 = 536`
its features (the +67 % flying feature, its target being the flying squad) — and both features match
`strengthAgainst` for Archer I in `src/data/tables/troops.json` exactly (`{ melee: 52, flying: 67 }`).
The Army-tab card taken an hour later reads +145.5 % / +175.0 % / +3.8 %: bonuses that travel with the march
(the captain sent with it) and buffs that changed in between make the two differ, so **always reconcile a
report against its own popup**.

## What it settles

1. **The friendly attack order is base damage descending** — `count × strength × (1 + Σ strength %)`, i.e. the
   hit damage *without* the strength-against ("features") part. Here it differs from the HP order at exactly
   one pair: Swordsman I is the bigger stack (4,077 HP against Rider II's 3,936, so it dies first) but hits
   for less without its features (1,539 against 1,549, so it strikes second). The report shows Rider II
   striking first, at entries 10 and 16. The same rule explains the two 2026-09-11 fights, where Rider I —
   third by HP, fourth by damage — is wiped before its turn and never strikes: the engine now reproduces both
   of those reports entry for entry (28 and 24 lines), which it could not do with the HP-order rule.
   The two candidate rules of the 2026-09-11 write-up (A: unit count descending; B: foot units then mounted)
   are both **refuted** here: A would put Swordsman I (18 units) first of all, B would put it before the three
   rider stacks.
2. **The enemy still kills by total HP**, mercenary included: the two-unit Arbalester stack is the biggest by
   HP and is wiped by the very first attack, without ever striking. 9/9 kills, 29/29 across four reports.
3. **Double damage is a plain ×2 on the whole line**, features included: entry 14 is 4,224 incl. 780 against
   entry 9's 2,112 incl. 390.
4. **The game does not round HP per unit.** 20 Spearmen I total 7,289, which is not divisible by 20; a rounded
   per-unit value could only give 7,280 or 7,300. The game scales the stack and rounds once. TotalStack rounds
   per unit, which is the ±1 the older tests tolerate.
5. **Bonuses are per unit family, and the gap is what makes the two orders diverge.** Solved from the report:
   guardsmen melee/mounted ×2.4296 health, ×2.87 strength; guardsmen ranged ×2.4346 / ×2.88; the specialist
   Swordsman I only ×1.51 / ×1.71. The unit cards show higher headline figures (+145.5 % / +175.0 % for
   Archer I, +76.0 % / +96.0 % for Swordsman I), so some of the card's bonus does not apply to this fight —
   open for S-20; the engine test uses the report's own numbers.
6. **One line is unexplained**: entry 20, a second Archer II strike, placed right after the round's fourth and
   last enemy attack, on the same enemy squad and for the same 700 (incl. 182) as its other two lines — not
   doubled, not labelled. Our model produces 20 of the 21 entries. A strike-two-squads proc was the first
   guess, but the Army-tab cards captured the same afternoon list no such chance for Archer I, Archer II,
   Rider III, Swordsman I or Punisher I (they do list "chance to deal double damage +3.8 %"), so the title was
   probably not active and the rule behind the extra sweep is still open: our engine lets the end-of-round
   sweep run only over stacks that have not struck this round, which reproduces both 2026-09-11 fights but
   drops this line. To settle: the troop-detail popup inside the report (it lists the per-stack chances) or a
   fourth report.

## Recovery — what the game actually offers

There is **no retrain dialog and no hospital**. Retraining a lost unit is simply recruiting it again in the
Army tab at the training price; the Temple is the only recovery screen, and it says: *"here you can revive up
to **90 %** of your fallen troops"*, *"troops can only be revived for a limited amount of time"*. Each row is
one unit type with a slider, revivable either with **3 sacred potions per unit** or with **gold**; the footer
offers "Revive all" for the total (15.6 K gold on this account, most of it from earlier battles).

That is our chunk-of-ten rule, stated by the game: `n − chunks(n) = floor(0.9 n)` for every n, so "ten at a
time, one comes back free" and "up to 90 %" are the same sentence. The tenth unit of each chunk is not revived
at all — it has to be recruited again, which is exactly the training silver and training time a "revive all"
still costs (`chunks(n) × training.silver`, `chunks(n) × training.seconds`, both scaled by the training
discounts). Those two formulas reproduce TotalStack's revive-all silver (216,000 at temple 0 → 173,880 with
the guardsmen discount) and its revive-all duration (1 d 2 h → 21 h 40 m) exactly, closing the last two open
equations of S-30.

Sample gold rows (temple 15, ÷1.53): 16 units → 42 g, 18 → 47 g, 5 → 26 g, 1 → 3 g match
`round(n × revival.gold / 1.53)` with the table's 4 and 8 gold; a few rows read one gold higher
(7 → 19 instead of 18, 2 → 11 instead of 10), so the per-row rounding rule is not pinned. The aggregate our
engine reports is unaffected at the scale of a real march.
