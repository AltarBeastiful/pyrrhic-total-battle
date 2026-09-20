# 0024 — the capped hunter, and the row that was removed (2026-09-20)

Reported by the owner the same day: he generated a march, got **21 hunters of the 27 he holds** with a
180 000-HP gap between the last monster stack and the mercenaries, and a trade table carrying **two** rows —
Sweet spot and Steady max. *"I picked the last row expecting it to max out mercs, and it did not."*

Measured in `tools/theorycraft/123-the-capped-hunter.test.ts` →
`tools/theorycraft/out/123-the-capped-hunter.md`. Damage is the **worst opening** (S-94/S-108), which is what
the bar ranks on; silver is `recoveryCosts` under his own recovery settings.

**The reconstruction is exact before anything is concluded.** His account rebuilt — 5 600 leadership /
2 180 authority / **800** dominance, guardsmen I–III with the top tier's melee and ranged out, monsters III,
Aydae 48 ★3 alone, VIP 7, Ragnarok/Fenrir, army modernization at +1.5 % health on melee/ranged/mounted, EMH VI
stock **27** — reproduces **all ten stacks to the unit** (419 900 · 410 540 · 403 596 · 395 160 · 388 037 ·
310 500 · 308 776 · 306 658 · 296 400 · 208 467), all three pools (5 590/5 600, 21/2 180, 628/800), every
march figure (5 928 282 expected, 5 763 382 worst, 2 449 200 silver, 9 024 gold, 2 920 coins, 8d 6h, 3 hired
lost), both bar rows' six figures each (2.280 / 482 450 and 2.353 / 397 312), the fold (4 marches) and the
foot (22 582 807 over 9 717 200 silver, 11 of the stock gone). Nothing below is read off a lookalike.

## 1. The answer in one line

**21 is `largestSustained(27, 3)` — the horizon rule, and nothing else — and it is the wrong number even for
a four-march campaign: the descending sequence 27 · 24 · 21 · 18 burns the identical 11 chunks for the
identical 9 796 800 silver and deals 2.23 % more damage. The row that would have offered it, All in, was
built, fielded all 27, was offered, and was then deleted by the S-94 "beaten outright" rule.**

## 2. What caps the hunter at 21

Four ceilings, all on the march he was shown:

| ceiling | units | how |
|---|---|---|
| his stock | 27 | the cap on the mercenary card |
| his authority housing | 2 180 | `floor(2 180 / 1)` |
| the shelter (`shelterUnder`) | 39 | `ceil(388 037 / 9 927) − 1` |
| **the horizon (`largestSustained`)** | **21** | `largestSustained(27, 3)` |

A stop of a four-march horizon plays **3 repeats and a finale** (`planRepeats`), and a fielded stack of `c`
loses `ceil(c/10)` for good every march, so a stock of 27 lasts `floor((27 − c)/chunks(c)) + 1`:

| hunters | chunks | marches it lasts | enough for 3 repeats |
|---|---|---|---|
| 24 | 3 | 2 | no |
| 22 | 3 | 2 | no |
| **21** | **3** | **3** | **yes** |
| 20 | 2 | 4 | yes |

The same army at other horizons fields **27** (horizon 1 and 2), **24** (3), **21** (4), **20** (5), **19**
(6). The shelter at 39 and the stock at 27 never come near it.

## 3. Why the bar carried two rows

### More mercs — the burn axis has three points on it

`moreMercs` returns nothing when the steady max and the sweet spot are fewer than two chunks apart. Measured:
sweet spot **2**, steady max **3**, gap **1**. The bar's axis is `chunks(hunters)` over the authority pool
alone (S-102), and with the hunter capped at 21 that axis has exactly three values — 1 (1–10 hunters), 2
(11–20), 3 (21). A five-stop bar is being drawn on three points, two of which are already taken.

### Silver saver — no cheaper plan can reach the sweet spot's rate

`leastSilver` wants a banded plan left of the sweet spot that costs no more silver **and** returns at least
its damage a silver. Of 3 770 plans priced, 547 are in the band, **262** burn fewer chunks, **262** cost no
more silver, and **0** reach 2.280 a silver — the best rate anywhere left of the sweet spot is **2.254**.

It is arithmetic, not luck. A hunter costs no silver to retrain; the silver column is the troops it stands
behind. §4's sweep holds the troops still and moves only the hunter: silver is **2 449 200 at every hunter
count from 1 to 39** while damage climbs. On an account whose only hired stock is a mercenary, fielding fewer
of them is always a *worse* rate, so "cheaper and at least as efficient a silver" has nothing it can name.

### All in — built, offered, then deleted

The stop is not missing because it could not be built. At a horizon of **1** the same army carries it, and its
first march — which is horizon-independent, since the builder scores each march of its sequence at
`marches = 1` off the stock that is left — fields **27 hunters behind 154 monster units, 181 hired units in
all**, for 5 484 374 at 2 498 200 silver. The offer rule compares `filledOf`: **181 against 142**, and passes.
(The S-99 hired cut that `filledOf` reads is inert here — the bar is byte-identical with `refuseDroppedTypes`
off.)

So the row is offered and then removed, and one rule removes a row outright: **S-94**, *"the all-in is not
offered when a stop beside it beats it outright"* — another stop with at least its damage, at most its silver
and **strictly fewer** chunks burned. Rebuilt from its own measured first march and spent down the way the
builder spends it (27 · 24 · 21 · 18):

| arm | the sweet spot | the all-in | fires |
|---|---|---|---|
| damage (needs ≥) | 22 559 776 | ≈ 20 915 840 | yes |
| silver (needs ≤) | 9 866 600 | ≈ 9 992 800 | yes |
| chunks burned (needs **<**) | 9 | 11 | yes |

The control is the horizon-1 run: there the all-in burns 3 chunks and nothing on the bar burns **strictly**
fewer, the rule cannot fire, and the row survives. That is the whole difference between the two runs.

**A second weakness of the same stop, measured separately.** Its share walk scales *every* hired type by one
common share. His four monster types are uncapped, so each reads the whole dominance pool — 3 194 dominance
asked for against 800 housed, over-subscribed **4×** — and no share above 25 % is housable. The same share
lands on the hunter. With the sizer family switched off (`sizerShape: false`), which is what leaves the walk
alone, the All in comes back on his bar fielding **six** hunters — `floor(27 × 0.25)` to the unit.

**And the bar's composition is unstable across nearby accounts.** Dominance 800 → two rows; 900 → three, with
27 hunters; 1 000 → *silver saver* and sweet spot; 1 100 → two rows again; 1 200 → three. Stock 27 → two rows;
64 → three; 100 → sweet spot, more mercs, steady max.

## 4. Is 21 the right number?

The sweep holds his troops and monsters exactly as the Steady max fields them and moves only the hunter:

| hunters | worst opening | silver | chunks a march | 4-march campaign | chunks spent |
|---|---|---|---|---|---|
| 18 | 5 593 105 | 2 449 200 | 2 | 22 372 420 | 8 |
| **21 (the plan)** | **5 763 382** | 2 449 200 | **3** | **22 883 251** | **11** |
| 24 | 5 933 656 | 2 449 200 | 3 | 23 223 799 | 11 |
| **27** | **6 103 933** | 2 449 200 | **3** | **23 394 076** | **11** |

The campaign column spends the stock down: field `min(n, what is left)` each march, lose `chunks` of it.

- **On one march**, 27 hunters is **+5.91 %** (6 103 933 against 5 763 382) for the **same 3 chunks**, because
  `chunks(27)` and `chunks(21)` are both 3.
- **Over four marches**, the descending 27 · 24 · 21 · 18 is **+2.23 %** (23 394 076 against 22 883 251) for
  the **same 11 chunks and the same 9 796 800 silver**. The horizon cap buys nothing at all here: it gives up
  510 825 damage and saves neither a chunk of stock nor a piece of silver.

So: **the count is not wrong for the rule it obeys, and the rule is the wrong shape for this stock.** 21 is
the largest *constant* count a stock of 27 repeats three times, which is exactly what `largestSustained` says.
It is beaten at equal cost by a campaign that does not repeat a constant — and that campaign is precisely what
the All in is for. **The missing row is the bug; 21 is its symptom.**

**A smaller finding on the way past.** The campaign the engine actually plans — three repeats and a re-sized
finale — is **22 582 807**, *below* the 22 883 251 of simply repeating the same march with the 18 hunters the
stock has left. Its finale is worth 5 292 661 where a repeat is worth 5 593 105. That is a separate defect and
is not diagnosed here.

## 5. The take-out is not implicated — but the re-size has a defect of its own

His screen listed SP I and SP II under "tap to put back", which suggested the S-107 re-size path. It did not
happen: his figures (5 763 382 worst, 2 449 200 silver) are the **plan's own stop to the unit**, and SP I /
SP II are types the *search* left out, not types he took out. Running the re-size caps the hunter at exactly
the same `largestSustained(27, 3)` = 21.

What the re-size *does* do is worth saying loudly. Pressing any pill on this stop re-derives the march at
**5 143 823** against the plan's **5 763 382** — **−10.7 %** — for **more** silver (2 498 200 against
2 449 200). The cause is in the counts: the re-size caps a monster at its **own pool** (S-102, *"a monster is
trained, not spent"*), so the sizer fills dominance from 628 to **798** of the 800, the troop stacks shrink to
pay for it (RD1 850 → 818, RD3 260 → 254) and the march loses a tenth of its damage. **A player who touches a
pill on a dominance account gets a worse march than the one he was offered.**

## 6. Proposals — with the benchmark risk named

None of these is applied; a fix to `src/engine/plan.ts` moves baselines, and only the owner registers those.

**A. Stop S-94 deleting the one offer the All in exists to make.** The rule was written so the stop could not
be a strictly worse plan; on this army it removes the only row that fields the whole stock. Narrow it so the
beating stop must also field **at least as many hired units** as the all-in, or refuse the drop when the
all-in is the only stop within a chunk of the stock. *Risk: the two armies S-94 was written for — the
2026-09-17 export at 12 000 leadership and the live camp of 2026-09-18 — get their all-in back, and both are
benchmark scenarios. This is the change that moves baselines.*

**B. Let a stop descend instead of repeating.** `largestSustained` is the constraint that a *constant* count
must survive the horizon. Where the descending sequence burns no more chunks than the flat one — measured
here, identical 11 — offering it costs nothing and pays 2.23 %. *Risk: every scenario whose stock is not a
multiple of ten shifts, which is most of the benchmark. Large.*

**C. Walk the all-in's share per pool, not across all pools.** Each hired type's own stock should be bounded
by what its pool can house *beside the others*, so a 4× over-subscribed monster camp cannot cut a mercenary
stock by 4×. *Risk: the all-in's shape on dominance armies only; no army without a monster camp moves.*

**D. Cap the monsters in `resizeMarchOver` at what the stop fields.** The whole-pool cap costs 10.7 % on his
march. *Risk: `tests/engine/plan-resize.test.ts` and the S-102 story's own measurements.*

**E. Say when the bar cannot be five stops.** His burn axis has three points on it, so three of the five rows
can never exist. That is a sentence the panel can write; no engine change and no benchmark risk.

The cheapest honest first move is **A + E**: A restores the row he went looking for, and E stops the bar
silently pretending a five-stop trade exists where the arithmetic allows two.

## 7. What this does not say

It does not say the Steady max is a bad march — 5 763 382 for 2 449 200 silver is the best flat repeat this
army has, and the plan found it. It does not price the descending campaign against the *silver* the player
actually holds; every figure here is at the plan's own unbudgeted spend. The all-in's campaign in §3 is
**rebuilt** from its measured first march — the builder re-sizes marches two to four and the engine's own
figures would differ; what is exact there is the burn, which is the arm that decides the drop. And nothing
here measures the enemy: every damage figure is the worst opening against his fixed 1/1/1/1 formation.
