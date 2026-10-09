# More calculations: a worker pool, a wider search, and a progression advisor (W17)

**Status: proposed 2026-10-03, reviewed the same day (verdict: sound with fixes; fixes folded in below:
A0, probe immutability, re-priced is not a floor, C5-0 captain conditions, measured timings).
Validated by the owner 2026-10-07 (answers in §7; Tight baseline and the loss flag folded into C3). Progress:
C1's probes shipped (`src/engine/probes.ts`, 3575369); A0 and A shipped 2026-10-08 (S-150; speed-up in
`tools/theorycraft/out/190-the-pool.md`); C3's reading in `src/engine/advisor.ts` and its pool job (`runProbe`
in `src/worker/jobs.ts`, the pass `runAdvisor` in `src/worker/advisor.ts`) 2026-10-08. C3's tests and experiment 191
(`tools/theorycraft/out/191-what-a-percent-is-worth.md`) 2026-10-08. C5-0's stored march type and the captain
conditions behind it 2026-10-09 (applied only once a march names its type; see §4 C5).** Owner, 2026-10-03: *"the end goal is to produce way more calculations, first
expanding the scope of search if it leads to better result; then start to produce recommendations for future
marches: check which talent point where would improve the march […], or where the next modernization of army
points could be spent, or other questions. […] helper for the player progression would be more interesting at
this point. So a worker based calculation could work as those would be separated calculations from the main
planning. […] For total computation budget, we can go up to 20 s."*

## 0. What this plan does not do, and why

**No Rust rewrite and no wasm threads.** The kernel (`kernel/assembly/`, ~2,600 lines, `runtime: stub`, only
exact math: `abs/ceil/floor/max/min/round/trunc`) *could* be ported bit-identically, but:

- AssemblyScript `-O3` and Rust release produce similar wasm for these loops: the port alone gains ~0–20 %.
- Wasm threads need `SharedArrayBuffer`, which needs COOP/COEP headers. GitHub Pages cannot send headers; the
  service-worker workaround only applies after a reload and COEP can break the Google OAuth flow.
- What remains on a plan is diffuse JS (`src/engine/plan.ts`, 7.7k lines) plus GC (~14 %): parallelising *inside*
  a kernel call cannot reach it.

The work the owner is asking for is **many independent plans**, which needs no shared memory: N ordinary module
workers, each with its own copy of the current kernel, each running a whole `planCampaign`. That works on every
browser the app runs on today and leaves the kernel untouched.

## 1. Rules of the phase

1. **The main plan is untouched until the owner trades.** The bar the player sees today is the reference; a
   wider search that changes a reading is a trade ([feedback: benchmark is non-regression]): measured on the 18
   benchmark armies + goldens, presented with its gains and losses, registered only by Rémi.
2. **Results never depend on the machine.** A budget is a *work count* (candidates, restarts, plans), never a
   duration. The 20 s clock is a safety cut that is reported (`cut: true`), never a search parameter. Same
   input → same answer on a 4-core phone and a 16-core desktop; only the wait differs. Merges are by job index,
   never by arrival order.

   **This is not true of the engine today** (review 2026-10-03): `planCampaign` reads `Date.now() + budgetMs`
   and calls `stop()` throughout (plan.ts:3324-3327, 4204-4621), and the re-typing has its own clock at
   `RETYPE_SHARE = 0.05` of the budget (plan.ts:96, 6530-6551; retype.ts:112-115). With N workers competing for
   a phone's cores, the 2 s re-typing cut fires first and changes answers. So step A includes:
   - **A0:** a work cap for the re-typing (and any other clock-bounded loop) that pool jobs use; `budgetMs` stays
     only as an outer cut. Add a top-level `budgetBound` flag on `CampaignPlan` (today only `retype.cut` exists,
     plan.ts:881). Gate: byte-identical goldens at default settings.
   - **The baseline every probe is compared against is re-planned inside the pool, under the same settings**,
     never taken from the main worker's plan.
3. **Benchmark every step** (experiment + benchmark, ranked with `rate()`), as in W10–W16.
4. **One wall-clock budget for the whole extra pass: 20 s** (`CAMPAIGN.budgets.extra`, new). The main plan keeps
   its own budget and is never delayed by the extra pass.

## 2. Step A — the worker pool (infrastructure, clock-only)

**What.** `src/worker/pool.ts`: a pool of `N = clamp(navigator.hardwareConcurrency − 1, 1, 6)` workers running the
existing `calc.worker.ts` (same protocol, same kernel boot, `KernelUnavailableError` → WasmRequired panel as today).

- API: `pool.map(jobs: CalcRequest[], { deadline, signal }) → Promise<(Result | Cut)[]>`, results in **job order**.
- Scheduling: a shared queue; each idle worker takes the next job (in order; a cost hint can come later).
- If a worker fails to start, `createCalcClient` silently falls back to inline (client.ts:224-233). The pool must
  detect that and run with one worker or refuse; an "inline pool" would freeze the UI for 20 s.
- Each worker boots its own kernel (`loadKernel`, boot.ts:36-45). The wasm is 28 KB and already precached
  (precache.ts:30). Engine caches live per plan, and there's no `Math.random`, so reuse is safe. The kernel keeps
  one instance per bound request (kernel/plan.ts:341), so idle workers are terminated (memory on phones).
- Cancellation: the existing cooperative `cancel` message; a new Generate cancels the whole extra pass.
- The pool is **separate** from the page's main worker and from the raise client (`raiseSearch.ts`), so a 20 s
  pass never sits in front of a Generate.
- Lazy: workers start only when an extra pass is asked for, and are terminated after ~60 s idle (phone memory).
- Main-thread fallback (no `Worker`): run the jobs sequentially with the same deadline — same answers, slower.

**Gate.** Unit tests (`client.test.ts` style): order is preserved whatever the finishing order, cancel stops all
jobs, a job that throws doesn't kill the others. Benchmark: running the 18 armies' plans through the pool gives
byte-identical plans to the single worker (`tests/golden/`). Timing: report the speed-up for N = 1, 2, 4, 6 in
`out/<n>-the-pool.md`.

## 3. Step B — a wider search, if it pays (experiment first, then owner's trade)

The search knobs that have measured gains but were held or banked:

| knob | measured | why held |
|---|---|---|
| `retypeExhaustive` 5 000 → 10 000 | 12 stops better, 0 worse, +0.1–0.3 s | breaks the plan-stops queue bound (branch `w16-f1-retype-10000-held`) |
| EXHAUSTIVE death order (5 040) | +9.3 rating | loses the shortest queue on 2 owner camps; TS 2.08 → 2.97 s (patches `179-*`) |
| `climbRounds` | 32 only moves the 20 000 camp; ≥256 is **worse** (not monotone) | registered at 32 |
| plan variants (`tierSeed`, `burnSaver`, `putBack`, `bandHired` modes) | each wins on some armies, loses on others | one default had to be picked |

**The approach: a portfolio, not a bigger single search.** Run K variants of `planCampaign` in parallel (the
default + held/banked knobs + alternative flag sets), then **merge per stop**: for each of the bar's stops, keep
the default's answer unless a variant's answer for that stop is better on `rate()` under the stop's own rules
(band, shelter, queue bound, criteria floors). Because the default is always in the portfolio, a stop can only
stay the same or improve on its own rating. That is non-regression on the rating *by construction*, but a stop
whose counts change is still a trade on the readings, so it still goes through the owner.

- **B1 (experiment, node only, no UI):** run each candidate variant on the 18 armies (+ the 20 000 camp), at
  ×2/×4/×8 work budgets. Table: per variant, stops better / equal / worse vs default, Σ rating gained, cost in
  plan-ms. Rank variants by marginal gain per ms. Output `out/<n>-the-portfolio.md`.
- **B2:** implement `planPortfolio(input, variants)` (`src/engine/portfolio.ts`) + the per-stop merge, with the
  K plans running as pool jobs. Only the variants that won something in B1 are kept.
- **B3 (owner's call):** present B1/B2's diff on the benchmark. On a yes, the bar shows the portfolio's stops;
  the main plan's stops are drawn at once and the portfolio replaces them when it is done, with a faint
  "improved" mark on a stop that changed (UI rule to be cited from `docs/design-rules.md`).

**Gate.** B1's table decides. If no variant gains anything worth the wait, B stops here and the pool serves C only.

## 4. Step C — the progression advisor (the main deliverable)

**The question:** *"Which upgrade gains my marches the most?"* Each candidate upgrade is a change to the march
request; each answer is a whole plan on the modified request, compared to the current plan. Every candidate is
independent, so it is one pool job.

### C1 — the probes (v1: generic, no game data needed)

A probe is a pure function `StackRequest → StackRequest` that **builds new objects and never mutates**: the
kernel recognises tables by identity (`sameArmy` compares `totals ===`, kernel/plan.ts:489-494; `marchBill` keys
on `byRequest.get(request)`, 465-471), so an in-place edit reads stale tables. `{...req, totals: {...totals,
health: {...totals.health, [key]: v + δ}}}`. `breakdown` is UI-only, and `effectiveUnit` recomputes from the
totals on every call (units.ts:102-133).

| family | probes | count |
|---|---|---|
| health % | `+δ` on `totals.health[key]` for each of the 13 bonus keys (4 categories, 4 groups, army, 4 races) | 13 |
| strength % | the same on `totals.strength[key]` | 13 |
| housing | `+δ` leadership, authority, dominance | 3 |
| specials (later) | double damage, strike two squads… | — |

Default `δ` = **+1 %** on a bonus and **+1 % of the current pool** on housing, so v1 answers *"which line is worth
the most per percent"*. That's 29 plans + the baseline. Measured (benchmark-latest.json, desktop node): the
owner's accounts plan in 148–477 ms, so 29 probes + 8 captain confirms ≈ 15 s of CPU, ~3 s on 6 desktop workers
and ~10–15 s on a phone. The 20 000-dominance camp now plans in 2,276 ms and is **not** budget-bound any more
(the comment at config.ts:249-263 is stale; fix it), but at ≈85 s of CPU for the whole set it doesn't fit 20 s
on a phone. There, the clock cuts it and `cut` is reported.

### C2 — user-entered upgrades (v2: what the next point *actually* gives)

The owner's suggestion, so the code stays simple first: the player types the next step of a source they are
looking at, e.g. *"Hero talent: +2 % mounted health, +1 % mounted strength"* or *"Army Modernization: +3 %
guardsmen strength"*, optionally with its cost (points, gold, days). Stored per profile (schema bump + migration +
fixture test, as every stored shape). Each entry is one probe; ranking is by gain, or by gain per cost when a cost
is typed. No talent-tree or modernization table is entered into `src/data/` until the owner asks for it; the probe
machinery doesn't care where the δ came from.

### C3 — the reading: one figure per probe, robust to search noise

**The search is not monotone** (`climbRounds ≥256` makes things worse), so a re-planned +1 % can come out *lower*
than the current plan by search noise alone, and the advisor must never say "this upgrade loses damage".

For each probe and each stop of the current bar:

1. **Re-priced** — the current stop's counts, battled again under the upgraded request (no search). This is **not**
   a guaranteed floor. The enemy wipes the highest-HP stack first (battle.ts:6), so a health probe can lift a
   merc stack above the troop floor and break the shelter or reorder the deaths. Strength reorders the attack
   order (battle.ts:63-69), and HP rounding (units.ts:133) can turn +1 % into zero.
2. **Re-planned** — the upgraded request planned in full, the same stop taken from its bar.
3. **Gain** = max(re-priced, re-planned, current) − current, read with `rate()` and `CAMPAIGN.markerRates`
   (`MARKER_RATES` isn't exported), the same yardstick the bar uses. Flags in the diagnostics: `noise` when
   re-planned < re-priced, `reorder` when the re-priced march's death order changed. They also measure the
   search's own noise, which is worth keeping.

**The baseline is Tight, as shown** (owner, 2026-10-07). Since 1cb2ac9 the March shows each stop raised by
Tight, which is applied after the plan (the worker's positions step, `OFFERED_POSITIONS`), not inside
`planCampaign`. So "current", "re-priced" and "re-planned" are each read **after Tight** on that stop: the
re-planned stop is Tight-priced under the upgraded request, as the March would show it after the upgrade. That
costs one Tight pricing per probe and stop read, inside the same pool job.

**A loss is shown, not hidden** (owner, 2026-10-07, todo of the same day: an upgraded research that halves the
damage after a re-Generate). The ranking still reads "no gain" for such a probe, but the row carries a visible
`worse` flag with the re-planned figure (*"the plan gets worse here: search issue"*), so the case can be
reported and reproduced. `worse` = re-planned (after Tight) < current.

Headline: the gain on the stop the player has selected on the bar (default: the sweet spot); the other stops are
behind a disclosure.

### C4 — the UI (its own story, after C1–C3 are measured)

A "What to upgrade next" card under the plan: a ranked list of probes (gain, % of the current damage, per-cost
when known), computed on demand ("Compute", not on every Generate, because it costs up to 20 s), with progress
(n / 29 done) and Cancel. Copy the reference look, cite `docs/design-rules.md` in the brief, ship crowded and
refactor the layout later. Labels say "merc", not "hired".

**Gates.**
- **C1:** experiment `out/<n>-what-a-percent-is-worth.md` on the 18 armies. Check that the rankings make sense
  against theory-craft 0015/0016 (e.g. the troop floor deciding merc damage implies troop health ranks high on
  the owner's army), with measured figures only.
- **C3:** zero probes shown as a loss (the `current` term in the max guarantees it), plus a count of `noise` and
  `reorder` flags per army; a probe whose gain is 0 only because of the clamp is shown as "no gain", not hidden.
- **Goldens:** unchanged (the advisor never touches the main plan).

### C5 — which captains to march with, and where the next star goes

Owner, 2026-10-03: *"which heroes should I best use for a march (given only spendable leadership, dominance,
number of heroes and merc stock and the current heroes level and stars), or recommendation on where to spend
the next star."*

What exists: the profile owns captains (`sources.captains`: `captainId`, `level`, `star`); a march switches on at
most 3 (`activeSources.captains`, `.max(3)`); each gives `level × perLevel + stars[star]` on **one** key for health
and/or strength, sometimes on a `special` key too (`captainValue`, derive.ts:285-297; `captains.json`, 30
captains). Stars stop at 6 (schema.ts:137).

**Conditions are not applied today**: the derivation adds every captain unconditionally. Amanitore's group-only
note (captains.json:29) and Hercules' epic-monsters note (:151) only produce text caveats (derive.ts:428-431), and
there is no march-type field to gate on. (`aloneOnly` belongs to a **hero**, Svyatogor, not a captain.) C5 needs
**C5-0** first: a march-type input (solo / group / epic monsters) and the derivation applying the conditions.
Without it, the advisor would happily recommend Amanitore for solo marches. That is a change to today's readings
for the accounts that have those captains → owner's trade.

> **C5-0, state and derivation, 2026-10-09.** `BattleSetup.marchType` (`'unspecified'` | `solo` | `group` |
> `epic`, schema v8, migration `7 → 8` on every setup and every saved march) and `onlyOn` on the two captains
> in `captains.json` (Amanitore `group`, Hercules `epic`). `captainCounts` (`derive.ts`) drops a captain
> limited to another kind of march from `resolveSources`, and its caveat says it is not counted; a restriction
> the march meets prints nothing. **The default `'unspecified'` applies no condition**, so every reading stays
> where it was (benchmark and goldens identical): the owner's trade is only taken by a player who picks a type.
> The three types are exclusive, as listed here; whether a group march against an epic monster should count
> both captains is the owner's to say. Svyatogor's `aloneOnly` (a hero) is not gated. The control on the setup
> card is the next task.

> **C5a screen, 2026-10-09.** `src/engine/captains.ts`: `allowedTrios` (distinct by `captainId`, the strongest entry
> of a duplicate, the march type's conditions applied through a predicate, fewer than three allowed captains make the
> one set of them), `screenTrios` and `rankTrios`. `src/state/captainTrios.ts` builds each trio's totals on the main
> thread (`resolveSources` + `aggregateBonuses` with `active.captains` swapped); the **current trio comes first with
> the march's own totals untouched**, so it rates 0 against itself and is never listed twice. The screen is ONE
> worker job (`kind: 'captains'`, `runCaptainScreen`): both readings per trio, without the Tight raise (the confirm
> step's), rated with `rate()` against the current trio's under the same pricing. (a) is `sizeStacks` under the
> March's `elite` method, (b) the current plan's stop counts battled again (`planMarch`); a trio's score on (b) is its
> best stop. Measured once: 1 140 trios x (1 sized + 5 stops) on the planner's small army, 0.39 s on the kernel.

> **C5a confirm, 2026-10-09.** `runCaptainAdvice` (`src/worker/captainAdvice.ts`): the current trio's plan, the screen, then
> the first `CAMPAIGN.captainConfirm` (8) trios of the screen (`shortlistTrios`; the re-priced screen by default since experiment 193, `both` stays an option) each
> planned in full as one pool job and read as a probe (`readProbe`). The answer is the best trio per stop with its gain,
> the current trio where none gains (never worse), and it lists the trios the clock cut or whose job failed. No job
> carries a clock; the order of the answer does not depend on the pool's size.

> **C5a experiment 193, 2026-10-09** (`tools/theorycraft/out/193-the-captain-trio.md`). No benchmark army has more than three
> captains, so the armies are the owner's 2026-10-07 roster (8 captains, 56 trios) as the app plans it and laid on the
> 2026-09-17 army: 7 armies, 35 stops, a better trio on 32. The sized screen's top-1 is the best trio on 4 of 35 stops, the
> re-priced screen's on 20 of 35; **k stays 8** (top-3 loses 4.4 % of the rating, 8 loses 0.3 %) and the shortlist is taken from the
> re-priced screen alone (finds the best on 32 of 35 against `both`'s 32 and loses 1.61 against 3.70). The captain pass costs
> 3.4-5.7 s wall on one lane; with the advisor's default pass (10.1-17.8 s) it is 13.5-23.0 s, over the 20 s on 3 of 7
> armies, so **C5 gets its own "Compute captains" button** and clock.

**Where it runs**: the worker only gets `CampaignInput` with totals already summed, and `derive.ts` imports the
tables, the store schema and config. Each trio's totals are built on the **main thread** (`resolveSources` +
`aggregateBonuses` with `active.captains` swapped, deduplicated by `captainId`, since the same captain can be
entered twice, derive.ts:155-157), and finished requests are shipped to the pool.

**C5a — the best trio.** The trio and the army choose each other: a mounted captain favours mounted stacks. So the
trio is part of the search, not a bonus picked before it:

1. **Screen**: every allowed trio of the owned captains (20 owned → C(20,3) = 1,140). Measured: `sizeStacks` +
   `simulateBattle` costs 0.05–0.14 ms a march on the kernel, so the whole screen is ~0.15 s and is **one** job
   (chunking buys nothing). Two screens are compared in the experiment: (a) `sizeStacks` with `options.method`
   (it is not the plan's sizer, so its top-1 may differ from the confirmed best), and (b) the current stops'
   counts re-priced under each trio. Rank by `rate()` on the bill.
2. **Confirm**: the top `k` trios (k = 8, a work count) planned in full (`planCampaign`, one pool job each), read
   as in C3 against the current trio's plan. The current trio is always in the set, so the answer is never worse
   than what the player marches with.
3. Output: the best trio per stop of the bar (the silver saver and the all-in may prefer different captains),
   with the gain over the current trio.

**C5b — the next star (or level).** For each owned captain below 6 stars, one probe: `star + 1` (and, separately, `level + 1`
or `+10`), **re-running C5a's choice** (a star on a captain that isn't in the best trio only matters if it puts
the captain into the trio). Cheap form first: the probe adds its δ (from `captains.json`, so no typing is needed,
unlike talents) to the current best trio when that captain is in it, and otherwise re-screens the trios that
contain it. Ranked by gain. Gain per star cost when the player types the cost (shards); otherwise by gain alone.

**Gate.** Experiment `out/<n>-the-captain-trio.md` on the benchmark armies carrying captains: how often the
screen's top-1 is the confirmed best (if almost always, drop step 2 to top-3), and the gain of the best trio
over the profile's current one. Cost must fit the 20 s with the other probes, or C5 gets its own button.

## 5. Step D — later questions on the same machinery

Each of these is a set of probes or a sweep over one. None is designed here:

- **Trades the owner hinted at:** +X dominance → how much more damage, swept over X, which reaches the peak
  ("reaching a peak" = where the curve flattens).
- **Next troop tier unlocked** (a new unit in `units`) and **more merc stock** (raised `caps`).
- **Horizon** (`CAMPAIGN.marches` 3/4/5…) as a probe instead of a config read (experiment 73 did this offline).
- **Marginal value of silver** (`silverBudget ± δ`).

**A step back, owed before C4 ships** (owner, 2026-10-07): once the pool and the probes are measured, take a
step back and think about *how the player uses* this machinery (which questions, where in the page, what a
player does with an answer) before the card's shape is fixed.

## 6. Order and size

| step | what | size | depends on |
|---|---|---|---|
| A0 | work cap for clock-bounded loops + `budgetBound` flag | 1 day | — |
| A | worker pool | 1–2 days | A0 |
| C5-0 | march type + captain conditions applied (owner's trade) | 1 day | — |
| C1 | generic probes + re-priced floor (engine + experiment) | 2 days | A |
| C3 | the reading, noise flags | 1 day | C1 |
| C4 | the card | 2 days | C3 |
| C2 | user-entered upgrades (schema bump) | 1–2 days | C4 |
| C5 | captain trio + next star/level | 2–3 days | C3, C5-0 (UI rides on C4) |
| B1 | portfolio experiment | 1–2 days | A (can run in parallel with C) |
| B2–B3 | portfolio merge, owner trade | 2 days | B1 + owner |

C goes before B because it's what the owner wants most and it can't regress the bar. B1 can run alongside C in
a worker branch.

## 7. The owner's answers (2026-10-07)

1. Headline stop: the stop selected on the bar (the sweet spot by default); the others behind a disclosure.
2. `δ` for v1: +1 % on each bonus line, +1 % of each housing pool.
3. The 20 s budget is the advisor's alone.
4. Captains: the trio is fixed per march type (solo / group / epic, C5-0); the advisor **suggests** the best
   trio and its gain and never swaps the active trio itself.
5. On a button ("Compute") only, never automatically after a Generate.
6. (new) Baseline: Tight as shown, see C3.
7. (new) A re-plan that comes out worse is shown as "no gain" with a visible `worse` flag, see C3.
