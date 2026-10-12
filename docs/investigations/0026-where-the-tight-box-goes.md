# 0026 — where the `Tight` box goes: what the raise explores, what is provably dead, and what scales it (2026-10-12)

The owner asked four things on 2026-10-12: *"I want to explore reducing tight costs. I believe we explore blindly
a lot of possible troop placement and we should be able to do that more quickly. First we need to analyze what
exactly are we trying within the tight calculations, what takes time, what are we exploring. Then let's figure
out if any of those are always wrong for all marches (let's use the benchmark usecases for this). Then the goal
is to produce a set of business rules for the computation that would allow us to lower the size of the search
while lowering no march. We also need to think about scaling tight. Right now big accounts (high
leadership/dominance, more troops type) don't scale well."*

This round answers them, and **R1–R4 are implemented** (2026-10-12, §10): the box now carries only what its own
bounds accept, and a box that comes out under the walk cap is answered by a full walk. Every figure below is
measured; the artefacts are listed at the end.

`Tight` is **51.6 % of the pool CPU of a full Generate + advisor run** (investigation 0025), so it is the
largest single cost in the app. Five things came out of the census, in decreasing order of certainty:

1. **Half of every wall the raise walks is provably dead**, by an algebra that holds for every march (§3): an
   authority slot cannot field one unit above `10·⌈from / 10⌉` under `Tight`'s cap, and no slot can field what
   the pool's spare housing cannot pay for.
2. **The box is exponential in the monster stacks**, which no cap touches. On the benchmark the 3 stops of
   10¹⁵–10²⁵ vectors carry **99.7 %** of the raise's whole census wall; on the live account it is 287 of 769
   boxes carrying 74.4 %.
3. **The clamps make most searches exact.** After R1 + R2, **333 of the live account's 418 searched boxes fall
   under the walk cap** and are answered by a full walk — the exact optimum, not a heuristic's best (§4). The
   remaining 85 are the ones the restarts matter for.
4. **The 64 restarts are a real trade and not a free cut** — they buy nothing on the benchmark's 7 searched
   stops (count for count the same vector as one start, at 1/65 of the wall) but the live account's own probes
   do lose rating without them (§5), so the curve is a choice for the owner rather than a rule.
5. **Pinning the monsters at their shelter ceiling is not free** (§7) — measured, and rejected.

**R1–R4 shipped on 2026-10-12** (§9): the raise's wall on the live account goes **28 371 → 11 950 ms (×2.37)**
and the whole Generate + advisor pass **46.2 → 28.6 s (−38.2 %)**, with **0 counts moved** on the 340-position
golden replay and **10 of 921** live calls answering different — all ten *better*, none worse. The 64 restarts
(R5) and the wide-box memo (R7) are left open, measured and priced in §§5–6.

## 1. What `Tight` is, and what it explores

`Tight` is a search over **a box of hired counts** (`raise`, `kernel/assembly/index.ts`; wrapper
`src/kernel/raise.ts`). One `raise()` request carries a base march — the plan's own counts at one stop — and a
mode per hired pool, and answers with a count per type (`{...raisedCounts, ...exactRaise}`, the merge the March
draws).

- **A slot** is one hired stack the march fields and the search may move: its floor is the plan's own count (it
  is a raise, never a re-sizer) and its ceiling is `min(shelter ceiling, owned stock)`, where the shelter
  ceiling is the most units whose total HP stays strictly under the lowest troop stack's.
- **The box** is the product of the slots' widths, `Π (to − from + 1)` — reported as `space`.
- **The cap** (`RAISE_TIGHT`) is the plan's own authority burn: `Σ ⌈n / 10⌉` over the mercenary stacks
  (`raiseBurn`), and a vector over it is refused **before it is fought** (W16 B). Only the **mercenaries** have
  a cap at all (S-102: a trained monster is a price, not a stock).
- **The rank** is the owner's own rating (`raiseRating`, experiment 188): `rate(as is, {damage, silver, gold,
  hired}, markerRates)`, so an extra unit is taken only when its damage is worth the silver, gold and burn it
  adds.
- **The search**: a box of at most `walkCap` (300 000) vectors is **walked whole** — the optimum, not a
  heuristic; a wider one is searched from `restarts + 1` (65) seeded starts, each a `pairwise` pass then a
  `climb` to convergence, taking strict improvements only.
- **The memo**: a dense score table over the box, shared by every position of a march — **switched off above
  `MEMO_CAP` (4 194 304)**, above which every repeated vector is fought again.

## 2. What the workload actually is (experiment 218, the live account)

One full Generate + advisor on `pyrrhic-my-account-2026-10-11.json`, release kernel, in-process:

| | count |
|---|---:|
| `positionTrades` calls | 921 |
| … carrying a box | 769 (152 do not) |
| … **walked** | 351 |
| … **searched** | **418** |
| … wider than `MEMO_CAP` | **287** — and they carry **74.4 %** of all call time |

Σ 28 377 ms for the whole workload; per call, mean 36.8 ms, **median 15.7 ms**. So the cost is not a long tail
of one crazy army — **the searched boxes are the majority of the calls**, and it is their own time that adds up.
The slowest calls are all dominance-heavy probes (`captains/probe …`, `other/probe …`), 1–8 monster slots, boxes
of 5 M – 4 G vectors, `scored` in the millions — not the Generate stops.

## 3. What is provably dead — the two exact clamps

**R1 — the chunk top (`Tight` only).** A slot's floor is the plan's own count, `chunks` is non-decreasing, and
the cap is `Σ chunks(planᵢ)` over the same stacks. So the cap holds **iff** no authority stack crosses its own
chunk boundary: `nᵢ ≤ 10·⌈planᵢ / 10⌉`. Every authority slot is therefore at most **10 movable values** wide,
whatever its shelter ceiling or stock — and a plan count that is a multiple of ten leaves the slot **unable to
move at all** under `Tight`, the chunk top being the count it already fields. The kernel does not apply this:
the slot runs to `min(ceiling, stock)`, and the vectors above the chunk top are enumerated and then refused.

**R2 — the housing spare (every position).** `Σ count × cost` per pool may not exceed the pool's housing
capacity, and every count's floor is the plan's own, so `nᵢ ≤ planᵢ + ⌊spare / costᵢ⌋` with
`spare = capacity − Σ planⱼ·costⱼ` over the pool. Also exact, and it binds hardest exactly where the plan fills
its pool.

**Measured on the benchmark (experiment 216, 52 stops with a box over 19 armies + the live account): 44.5 % of
the vectors of every box small enough to enumerate are refused by the burn cap alone** — the same 44.5 % that
sit above a slot's own chunk top, since the two conditions are the one fact. Arm B (R1) and arm C (R1 + R2)
hand the kernel the clamped box through the caller's own `caps`: **both answered the same counts on all 52
stops**.

## 4. What the clamps buy

*(Measured here through the caller's `caps`; §9 has the same A/B on the kernel that shipped.)*

| measure | shipped | clamped | |
|---|---:|---:|---|
| benchmark, the 48 stops whose box is under `MEMO_CAP` | 91 ms | **16 ms** | **17.6 %** (×5.7) |
| benchmark, whole census | 50 632 ms | 46 668 ms | 92.2 % — the rest is the 3 monster-camp stops (§6) |
| benchmark, stops that flip **searched → walked** | | **4** | now the *exact* optimum |
| live workload, box to box (218) | 29 704 ms | **13 053 ms** | **43.9 %** |
| live workload, whole (218) | 28 377 ms | | 46.0 % |

**A box that the clamp pulls under `walkCap` is answered exactly** — the optimum of what the bounds accept, not
the best a heuristic happened to find — so on those stops the clamp cannot lower a march, by construction. And
that is most of the live workload (218): **333 of the 418 searched calls have a clamped box of at most the walk
cap**, so the kernel would walk them; all 351 already-walked calls stay walked. **After R1 + R2 the live
workload is 684 walked calls and 85 searched ones**, against 351 and 418 as it ships.

**One defect, measured, and it is in the shortcut rather than the rule** (218): handing the clamp over as
`request.caps` also moves the **seed** — the kernel's own climb (`raisePool`) reads the same caps — so a
*searched* box climbs from somewhere else and lands somewhere else. **10 of 769 live calls moved a count**
(31 counts, all on monster stacks, e.g. `battle-boar 43→48`, `stone-gargoyle 35→32`), **all of them searched,
0 of the 351 walked boxes moved**. A walked box is exhaustive over a superset, so it cannot drift; that part is
proven and holds. An implementation must therefore clamp the **slot ceiling** (`rTo`) and leave the seed's
stock alone — or re-seed the search from the unclamped climb — and then measure the searched boxes on their own.

## 5. The restarts

`EXACT_DEFAULTS.restarts` is **64**: after the caller's own vector, 64 random starts each run a `pairwise` pass
and a `climb`. Experiment 221 prices the identical box, cap, rank, seed and sweep limit with **only that number
moved**, on every searched benchmark stop:

| stop | box | 1 start | 64 starts |
|---|---:|---:|---:|
| monster tiers 3–7 at 20 000 dominance · sweet-spot | 1.97 × 10²⁵ | 47.649 · **539 ms** | 47.649 · **43 850 ms** |
| … · more-mercs | 6.26 × 10¹⁷ | 13.786 · 102 ms | 13.786 · 6 796 ms |
| … · silver-saver | 3.77 × 10¹⁵ | 16.503 · 46 ms | 16.503 · 3 870 ms |
| the owner's live camp · more-mercs | 908 684 | 3.837 · 5 ms | 3.837 · 52 ms |
| the live account · all-in | 135 097 600 | 0.000 · 1 ms | 0.000 · 84 ms |
| 2026-09-17, 12 000 leadership · burn-saver | 729 267 | 0.000 · 3 ms | 0.000 · 13 ms |
| his TotalStack profile · steady-max | 351 900 | 0.000 · 2 ms | 0.000 · 6 ms |

**The answer is count for count identical at one start as at 64 — on all 7 stops — and the wall is linear in
the starts.** The pairwise pass enumerates the *whole* cross-product of every pair of slots, which on a wide box
is already millions of vectors floor by floor, so a random start mostly re-walks what attempt 0 walked. The
promise the restarts exist for (a basin the caller's own answer does not sit in) is not one this benchmark
holds.

**On the live account it is, and the curve is steep at both ends** (experiment 222: the same run as 218, the 40
slowest searched calls plus a seeded 40 more, 66 of the 80 above `MEMO_CAP`, priced at six restart counts with
everything else identical):

| starts | Σ ms (80 calls) | Σ rating given up | calls answering different counts |
|---:|---:|---:|---:|
| 1 | 362 | **7.277** | 12 |
| 4 | 784 | 2.040 | 7 |
| 8 | 1 397 | 1.826 | 6 |
| 16 | 2 661 | 1.737 | 4 |
| 32 | 5 248 | 0.443 | 2 |
| 64 (the default) | 10 250 | 0.056 | 1 |

The worst single call at one start is `other/probe campaign:tier:monster monster tier 4` (box 7 020 000), giving
up **2.265**; the 7–52 M `captains/probe …` boxes give up 0.1–1.5 each. So the benchmark's 7 searched stops
**understate** the restarts' worth — a trap worth naming, and the reason this figure had to be taken off the live
account rather than argued from §5's own table: the advisor's probes move leadership and dominance around the
account's camp, and those boxes sit in several basins where the benchmark's one does not. **The restarts are a
dial, not a defect**: the workload halves for 0.4 rating points across the 80 calls at 32, and a tenth of the
wall for 7.3 at 1. It is the owner's trade to strike, and R1/R2/R4 already remove the need to strike it on 333 of
the 418 searched calls.

## 6. What scales the box (experiment 220)

The benchmark monster camp, sweet spot, one axis at a time:

| axis | value | slots | box | after R1 | after R1+R2 | |
|---|---:|---:|---:|---:|---:|---|
| dominance | 900 | 2m/4M | 23 520 | 2 016 | 2 016 | walked |
| dominance | 2 000 | 2m/5M | 15 234 048 | **3** | 3 | searched |
| dominance | 20 000 | 2m/19M | 1.97 × 10²⁵ | 2.7 × 10¹¹ | 2.7 × 10¹¹ | searched |
| dominance | 50 000 | 2m/18M | 4.78 × 10²¹ | 6.3 × 10¹¹ | 6.3 × 10¹¹ | searched |
| leadership | 5 000 | 2m/0M | 45 | 6 | 6 | walked |
| leadership | 10 000 | 2m/20M | 2.74 × 10²⁴ | 3.2 × 10¹⁰ | 3.2 × 10¹⁰ | searched |
| leadership | 20 000 | 2m/19M | 1.97 × 10²⁵ | 2.7 × 10¹¹ | 2.7 × 10¹¹ | searched |

- **The monster stacks are the exponent.** Nineteen of them, each hundreds wide, is 10²⁵ — and the authority
  cap is silent there, which is why R1 alone takes the benchmark's Σ box from 1.97 × 10²⁵ to only 2.3 % of it
  while leaving the monster product untouched.
- **R2 is decisive exactly when the housing binds.** At 2 000 dominance the box is 15 234 048 and the clamped
  box is **3 vectors** — the plan's spare is nearly nothing, so almost every count is unpayable. At 20 000 the
  same clamp leaves 2.7 × 10¹¹: ample dominance pays for any monster count the shelter allows, so no per-slot
  bound exists.
- **Leadership is the other half**, and it acts through the shelter: a higher floor is a higher ceiling on
  every monster stack before the stock or the stock's cost is reached at all.

So the honest shape of the scaling answer is: **the mercenary side of the box is solved exactly and for free
(R1); the monster side is solved exactly when the dominance is tight (R2) and is untouched when it is ample.**
An account with many monster types and dominance to spare is the case that stays expensive.

## 7. What does not work: pinning the monsters at the ceiling

Experiment 217 swept each slot of the widest stops around the search's own answer: the damage is **spiky** (the
band within 0.1 % of a sweep's best is 1–6 counts wide, on slot ranges of up to 400), and the dominance counts of the
search's own answer sit **at, or one or two units under, their shelter ceiling** — the last kill position, which
strikes most. That shape suggests the rule "hold the monsters at the ceiling and search only the mercenaries",
which the kernel can already answer (`RAISE_TIGHT` on `authority` + `RAISE_MOST` on `dominance`) — and it would
take the 20 000 camp's 1.97 × 10²⁵ to 220 vectors.

Experiment 219 prices it on every benchmark stop that carries a monster slot, against the shipped search, on the
owner's own rating:

- **15 stops: the shipped search rates higher on 5, the rule on 0, 10 tie.** Σ box 1.97 × 10²⁵ → 1 148
  (10 800 ms… 4 ms), and Σ wall 49 347 ms → 4 ms.
- It **loses** where it matters: the three 20 000-dominance stops by 1.4–2.5 rating points, and the live
  account's `burn-saver` by **17.7 points — from +12.59 to −5.10, worse than `As is`**.

Rejected as a rule. The dominance stacks are near their ceilings in the *answers*, but they are not *always* at
them, and the difference is worth more than the whole cost of finding it.

## 8. The rules, ranked

Everything here is exact unless it says otherwise. Together they are the owner's "lower the size of the search
while lowering no march" — the numbers below are what each is measured to be worth.

| # | rule | kind | state |
|---|---|---|---|
| **R1** | clamp each **authority** slot's ceiling to `10·⌈from/10⌉` when the pool is `Tight` | exact, free | **shipped** (§10) |
| **R2** | clamp **every** slot's ceiling to the pool's housing spare | exact, free | **shipped** (§10) |
| **R3** | clamp `rTo` only, so the seed (`raiseClimb`) is untouched | required for R1/R2 to be answer-free | **shipped** (§10) |
| **R4** | **walk** when the clamped box fits `walkCap` | exact, and *improves* | **shipped** — falls out of R1/R2 |
| **R5** | a **restart policy**: fewer seeded starts for a box that is searched | trade, measured | open — the owner's dial (§5) |
| **R6** | **prune the walk** by partial feasibility (both bounds are monotone in every count) | exact | open; bounded by R1/R2 first |
| **R7** | a **memo that survives a wide box** (hash/arena rather than a dense table) | pure speed | open; R1/R2 pull most wide boxes under `MEMO_CAP` first |

R1 + R2 + R4 is the package that ships with no argument: it is the same search over a smaller box, the clamped
box that fits is answered *better* than before, and on the live account it turns 333 of the 418 searches into
walks. R5 is the second lever and it is the owner's own call — it is a price list, not a defect, and R1/R2/R4
leave only 85 of the live calls for it to price. R7 is the fallback if the monster side has to be left alone.

**Where each lands.** R5 is a caller-side figure — `EXACT_DEFAULTS.restarts` in `src/kernel/raise.ts`, the
argument `src/kernel/boot.ts` hands `createRaiseKernel` — so it is one line and no wasm rebuild. R1, R2 and R4
are in `raise()`'s slot loop (`kernel/assembly/index.ts`, where `rTo` is set) and R3 beside them; none of them
touches the scorer, the memo, the rank or the seed's own arithmetic. Any of them that moves a count on a
benchmark stop re-captures `tests/golden/raise.json` and `tests/golden/raise-kernel.json` the way experiment 215
did (`CAPTURE=1`), and the plan's own benchmark must not move (a position touches one march's counts, never the
campaign) — which is the gate the owner's own standing rule asks for: no scenario worse, and only he registers a
new baseline.

## 9. What shipped (R1–R4, 2026-10-12)

**The change is `raise()`'s slot loop.** A slot's ceiling is still `min(shelter ceiling, owned stock)`; two
clamps now cut it further, and nothing else in the kernel moved:

```ts
const spare1 = housingOf(1) - raiseUsed(rBase, 1);   // the plan's own usage, off the two housings
const spare2 = housingOf(2) - raiseUsed(rBase, 2);
const tightAuth = isTight(rAuth);
...
let to = Math.min(raiseCeiling(floor, hpPer(t)), f64At(rCaps, t));
if (cost > 0) to = Math.min(to, count + Math.floor((pool == 1 ? spare1 : spare2) / cost));   // R2
if (tightAuth && pool == 1) to = Math.min(to, CHUNK_TEN * chunks(count));                    // R1
if (to < count) to = count;
```

**R3 is the shape of the change rather than a line of it**: the clamp is written into `rTo` and never into
`rCaps`, and `raiseClimb` — the seed — reads `raiseCeiling` and `rCaps` itself. So the search still starts from
the vector `raisedCounts` answers with, a `Tight` still cannot come out below the plan's own march, and 218's
ten seed-driven drifts are gone: what is left is only the restart draws of a smaller box, measured below.
**R4 needs no line either** — `rSpace` is the product of the clamped widths, so a box that now fits `walkCap`
is walked, and a walk is the optimum.

### What it is worth (experiment 224 — the two kernels, one process, the live account)

The same one full Generate + advisor (218/222's harness, 921 calls), run before → after → before → after with
only the wasm swapped, min of the two rounds per arm:

| arm | with a box | walked | searched | Σ raise ms | Σ pass ms |
|---|---:|---:|---:|---:|---:|
| before | 769 | 351 | 418 | 28 371 | 46 231 |
| **after** | **506** | **421** | **85** | **11 950** | **28 594** |

- **The raise costs ×2.37 less (−57.9 %); the whole pass −38.2 %** (46.2 s → 28.6 s on one thread). The win is
  the flip: 333 boxes the multistart search used to take are now walked — exhaustive *and* cheap.
- **263 calls now have nothing to search at all** (769 → 506 boxes). Their answer is the merge the kernel
  builds anyway — the plan's own counts for a `Tight` — which is why `runRaise` no longer hands "no search ran"
  back as `null` (`src/worker/jobs.ts`): a `null` reads as "keep the climb", and **`Tight`'s climb is bounded
  by neither the burn nor the plan's counts**. `null` now means the position was not asked — no pool on an
  exhaustive position, or no troop to shelter under (`exact.ts`'s `how` carries the `null`).

### Is any march lowered?

- **The golden replay (experiment 223): 340 positions over 68 stops, `tests/golden/raise.json`'s own corpus —
  0 counts moved.** The box shrank on 59 and became empty on 25 (4 of them searches).
- **The live A/B (224): 10 of 921 calls answer different counts, and all 10 are better** — rating Δ **10 up /
  0 down** (+0.02…+0.11), on the dominance-heavy captain probes the golden corpus does not carry. 9 of the 10
  are still searches: a smaller box is a different climb, and it lands on a higher-rated vector.
- **`raise-kernel.json`: 0 moved leaves over the 1330 entries whose march is unchanged** (the two special
  marches — the fractional cost and the reversed stack order — were rebuilt on a base with room, because the
  sizer's own march has none; that is a different question, not a different answer).
- **The plan benchmark is untouched** (`pnpm bench:baseline`, 20/20) — a position moves one march's counts and
  never the campaign — and the **full suite is green: 152 files / 1971 tests**.

### The goldens, and the one thing to accept

Three captures moved, **all of them `how`/`space`/`scored` and not one count**: `raise.json` (144 leaves over
59 records), `raise-kernel.json` (126 over 45), `advisor.json` (18 over 6). This is the same re-base W16/215 did
for a smaller search; **the owner's rule is that he registers a baseline**, so it is flagged here rather than
buried — every answer, every figure and every criterion in them is unchanged.

The raise tests also gained one definition: `tests/kernel/seeded-marches.ts` now holds the corpus's seeded-march
generator (`raise-kernel`, `raise-census` and `raise-point` shared a copy each), and `roomyBase` — the sizer's
own march with its hired counts halved — is the deterministic base the whole-roster and tie-break entries use,
because the sizer's own march fills the housing and has had nothing to raise since the clamps.

## 10. Reproduce

```sh
# the censuses and the rules (each writes tools/theorycraft/out/<n>-*.md)
THEORY=1 pnpm vitest run tools/theorycraft/216-where-the-tight-box-goes.test.ts
THEORY=1 pnpm vitest run tools/theorycraft/217-the-shape-of-a-monster-slot.test.ts
THEORY=1 pnpm vitest run tools/theorycraft/218-the-live-raise-workload.test.ts
THEORY=1 pnpm vitest run tools/theorycraft/219-monsters-at-the-ceiling.test.ts
THEORY=1 pnpm vitest run tools/theorycraft/220-what-scales-the-tight-box.test.ts
THEORY=1 pnpm vitest run tools/theorycraft/221-what-the-restarts-buy.test.ts
THEORY=1 pnpm vitest run tools/theorycraft/222-the-restarts-on-the-live-workload.test.ts
THEORY=1 pnpm vitest run tools/theorycraft/223-the-clamps-on-every-golden-stop.test.ts   # the shipping gate
THEORY=1 pnpm vitest run tools/theorycraft/224-the-clamps-ab.test.ts                     # needs /tmp/kernel-{before,after}.wasm
```

`218` and `222` read `pyrrhic-my-account-2026-10-11.json` at the repo root (never committed).
