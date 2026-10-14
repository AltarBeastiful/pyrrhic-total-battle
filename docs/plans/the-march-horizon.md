# The march horizon — a reusable benchmark of every march the plan computes

**Type:** plan (benchmark/tooling). **Status:** shipped. **Created:** 2026-10-14.
**Related:** `docs/plans/the-stops-the-bar-offers.md` (the band and the stops), `docs/backlog/B-10-put-back-halves-trade.md`, `docs/plans/beating-totalstack.md` (the benchmark's criteria), investigations 0025/0026.

---

## 0. Context — why this exists

The bar offers **four or five** marches chosen from a set the plan computes but never shows. On the owner's
export of 2026-10-13 the band held **1,795 rows** and the bar offered **4**; at one burn level alone (three
mercenaries) the band spanned `7 d 9 h → 19 d 18 h` of training queue, and the bar showed exactly one of them.
The owner, 2026-10-13/14:

> *"everything above silver saver has a lot of training time … the big walls feel like expenditure lost as they
> can actually shelter way more mercs than the plan advises to lose. Maybe I am looking for the better trades,
> adding all ratings from the march."* → *"lets go for a fifth spot, first a full benchmark generating all
> marches, not just offered but computed … write the full table of marches, its ratings and criterias, and add a
> mark on which one we selected … a reliable benchmark that can be run again and won't be too hard to maintain…
> I think this one could be reused in the future."*

The same hole is in the standing benchmark: across its **19 armies the bar draws between 1 and 5 stops**
(`tools/theorycraft/out/benchmark-latest.json` — *Bear V ×1* is one row, the monster camps are five), and the
report prints **17–27 rows per army** where those rows are the sizers, the variants, the captured TotalStack
answers and the stops — **never the plans the stops were picked from.**

So: **the engine already finds the answers, the bar cannot show them.** Before designing a fifth stop we need to
see the whole horizon in one place, on every army, with the criteria and the owner's own rating on every row and
the offered stops marked. This plan builds that report. **The fifth stop is a later plan** (owner's decision).

**Owner decisions already taken (2026-10-14):**
1. Scope = **the plan's own candidate set** (`plan.trade` / `plan.frontier`) — what `planCampaign` already
   summarises and scores — not every shape the search prices.
2. **JSON committed to the repo; the giant human-readable markdown gitignored**; a one-page-per-army summary
   committed beside it.
3. **This plan is the benchmark only.**

---

## 1. What the report is

One run over the **19 benchmark armies** (`tests/engine/plan-scenarios.ts` — `commonScenarios()` 8 +
`ownerScenarios(profile)` 11), and for each army:

- **every march in the plan's own candidate set**, one row each — with its **ten readings**, its **criteria**
  flags, its **rating against the army's sweet spot** and the raw deltas, and the **selection marks** (which
  rows the bar offered, as which stop; which the put-back pass generated; which the band refused);
- a **census** of the deeper horizon (how many candidates the search summarised, how many were undominated, how
  many the band kept) so the size of what we *don't* list is on the page;
- a **summary** page per army for the repo, and the **JSON** with every row.

It answers, per army: *what does the bar show, what else did we compute, what is each one worth on all six
cost markers and four ratios, and where is the trade the bar cannot draw?*

---

## 2. Where the rows come from (the only engine call)

One `planCampaign` per army, over the request the **standing benchmark** already prices
(`tests/engine/plan-measure.ts:197-208` — `{ request, marchTarget: HORIZON, ...CAMPAIGN.planFixes, putBack:
CAMPAIGN.putBack }`, and **no `budgetMs`**), plus **two opt-in diagnostic flags** and no other change. The
library builds that `CampaignInput` itself (`plan-measure.ts`'s `runPlanOnce` is private and takes no extra
flags); an assertion in §8 catches any drift between the two builders.

| flag | payload | used for |
|---|---|---|
| `withTrade: true` | `plan.trade: PlanTotals[]` — the **band** (undominated ∧ in-band) | the row set |
| `withFrontier: true` | `plan.frontier: PlanFrontierRow[]` — every summarised candidate, each marked `onFrontier` / `undominated` / `inBand` / `stop` / `generatorOf` | the census **and** the undominated-but-refused rows |

Neither flag is set by the app (`buildPlanRequest` never sets them), so nothing on screen changes. Rows are
**deduped by `keyOf(counts)`** (`tools/theorycraft/plan-report.ts:49`) — the band repeats one march many times
for one label.

**One asymmetry to handle:** the **troops-only path never sets `frontier`** (`plan.ts:3600-3636` returns
`trade` only), so a merc-free army has `plan.frontier === undefined`. The library falls back to `trade` there and
says so in the census rather than reading `undefined`.

**Row set = every `frontier` row with `undominated === true`, plus the offered stops** (a put-back'd stop can be
off-band). Each row carries `inBand` so a refused row is visible as such. *(If the deduped undominated set is
too large to commit — see §7 — the fallback is the band alone, and the refused-undominated rows are counted
rather than listed; the size gate in §10 decides.)*

---

## 3. The row schema

Every figure comes from the row the engine already priced — **`PlanTotals.repeat`, no extra battle**
(`plan.ts:492-520`). That is the march the app's trade table prints, so the report and the screen agree.

```
identity   key (keyOf), counts (non-zero only), shape, label
readings   worst=repeat.damage · silver=repeat.silver · hired=repeat.mercLost
           gold=repeat.gold · coins=repeat.dragonCoins??0 · seconds=repeat.seconds
           perSilver · perHired (repeat.hiredDamage/max(1,mercLost)) · perGold · perCoin
campaign   totalDamage, silver, gold, dragonCoins, seconds, mercLost, marches
marks      undominated, inBand, onFrontier, stop?, generatorOf?
           fifthCandidate = undominated && inBand && stop === undefined
rating     vsSweet: { rate, dDamage, dSilver, dGold, dCoins, dQueue, dHired }
```

`Figures` and `ratios` are reused from `tools/theorycraft/plan-report.ts:57-157`; the ten readings are
`READINGS` (`plan-report.ts:105`), the criteria `CRITERIA` (`:118`). **`Figures.best`** (the army-strikes-first
opening) is the one field left out: it needs a second journal, i.e. a battle per row, and no reading divides by
it. Likewise a per-march `shelterMargin` (`plan-report.ts:171-195`) is computed **for the offered stops only** —
it needs a battle, and the census is not worth one per row.

---

## 4. Ratings, and what they are measured against

`rate(before, after, rates)` (`src/engine/rating.ts:43`) is **pairwise and explodes on large deltas** — its
`hired` term reads a 1 → 3 chunk change as "−200 %", and its `seconds` term divides by 40. It is the owner's
rating for two *near* marches (the put-back pass, the re-typing), **not a global selector**. So:

- **the primary column is the five raw deltas** (damage %, silver %, gold %, coins %, queue %), which is what
  the owner actually compares and what the plan already prints in §1 of `the-stops-the-bar-offers.md`;
- `rate` is carried **beside** them as a single sortable number, labelled with its caveat, never alone.

**Reference: the army's sweet spot** — the bar's `recommend` / where the app opens (`plan.recommend`,
`plan.ts:918`). The question the report answers is literally *"is there a better trade than the one you are
showing me?"*, so every row is rated against the default the owner sees. A second column against the army's
**cheapest stop** (the thrifty end) is cheap to add and answers *"what does spending more buy"*; it is included
as `vsCheapest` only if it does not double the JSON — the size gate decides (§7).

---

## 5. Marking "which one we selected"

Straight off `PlanFrontierRow` (`plan.ts:8056-8068`): `stop` (the `PlanPick` this row became), `generatorOf`
(the stop a put-back re-sized it into), `undominated`, `inBand`, `onFrontier`. Plus
**`fifthCandidate`** — `undominated && inBand && !stop` — the rows the bar *could* have offered and did not.
That column is the whole point of the report for the next plan.

---

## 6. Module layout

**A reusable library** — `tools/theorycraft/march-horizon.ts` (un-numbered, like `plan-report.ts`):

```ts
export interface HorizonRow extends Figures { key; counts; shape; label; campaign; marks; rating }
export interface ArmyHorizon { label; refused?; rows: HorizonRow[]; census; stops: {pick,key}[]; meta }
export function horizonOf(label: string, request: StackRequest): ArmyHorizon   // one planCampaign + the dedupe
export function renderHorizon(armies: ArmyHorizon[], meta): string  // the giant per-army table
export function renderSummary(armies: ArmyHorizon[], meta): string  // the committed one-pager
export function saveHorizon(file, armies, meta) / loadHorizon(file) // thin wrappers on plan-report's saveJson/loadJson
```

**A thin runnable experiment** — `tools/theorycraft/232-the-march-horizon.test.ts`:

```ts
describe.skipIf(!process.env.THEORY)('232 — the march horizon', () => {
  it('writes the horizon of every benchmark army', () => {
    const scenarios = [...commonScenarios(), ...ownerScenarios(ownerProfile())];
    … horizonOf each … saveJson(JSON) + writeFileSync(full MD) + writeFileSync(summary MD) …
  }, 600_000);
});
```

Everything it needs already exists: `Scenario` and the scenario lists (`plan-scenarios.ts`), `keyOf`/`Figures`/
`READINGS`/`saveJson` (`plan-report.ts`), `Report` (`harness.ts:374`) for the console echo, and `rate`
(`rating.ts`). **No new engine code, no config change, no new engine export, and no edit to
`plan-scenarios.ts`** — that file's two helpers define the golden corpus (`tests/golden/plans.json` is captured
over exactly `commonScenarios() + ownerScenarios(profile)` × 4 variants), so adding an army there would move a
golden.

**The owner's live export, without touching the corpus.** The motivating account (2026-10-13) is not one of the
19. The experiment therefore appends **optional extra armies** read from `PYRRHIC_HORIZON_EXPORT` (a
comma-separated list of export paths), each turned into a request with `buildStackRequest` exactly as
`tools/theorycraft/harness.ts`'s `loadOwner` does — an experiment-local addition that never enters
`plan-scenarios.ts`. Run bare, the report is the 19 benchmark armies; with the env var, his current account is
on the page beside them.

---

## 7. Output and size policy

| artefact | path | committed |
|---|---|---|
| the machine-readable horizon | `tools/theorycraft/out/232-the-march-horizon.json` | **yes** |
| the one-pager per army | `tools/theorycraft/out/232-the-march-horizon.md` | **yes** |
| the full per-march table | `tools/theorycraft/out/232-the-march-horizon-full.md` | **no** — `.gitignore` gains one line |

`.gitignore` today excludes only `tools/theorycraft/out/benchmark-run.{json,md}`; the new full-table line goes
beside them. The JSON is committed because it is the artefact a later plan reads (the fifth stop's evidence);
it is kept small by the `keyOf` dedupe, the pruned schema (non-zero counts only, no `best`), and — if the size
gate demands it — the band-only fallback of §2. **Raw input is ~1,800 rows/army before dedupe; the gate
measures the deduped size on one army first.**

---

## 8. Determinism, cost, assertions

- **No `budgetMs`** anywhere: the answer must not depend on the machine (W17 A0). The kernel is mandatory
  (`tests/kernel/with-kernel.setup.ts` is a global setup).
- **Cost:** one `planCampaign` per army (already ~0.1–0.4 s each in the benchmark), and **no extra battle per
  row** (§3). The only new cost is `withFrontier`'s summarising of every candidate and the JSON serialisation —
  measured in the size gate (§10) before the schema is frozen.
- **Assertions** (cheap, non-pinning — the run must fail loudly if it breaks, not become a baseline):
  1. all 19 armies produced rows, none refused;
  2. every army's `stops.length` is **1…5** (the benchmark's own armies run from one stop — *Bear V ×1* — to
     five), and **every offered stop's row is present in `rows` with identical readings** — this is also the
     drift guard of §2: if the library's `CampaignInput` ever diverges from `plan-measure.ts`'s, the stops stop
     matching and the run goes red;
  3. for each army, the best row on `worst` is ≥ the bar's own `most damage` reading (the horizon contains the
     bar), and the census counts are `summarised ≥ undominated ≥ band`.
  No figure is pinned; this is a report, not a baseline (`feedback-benchmark-non-regression`: only the owner
  registers a baseline).

---

## 9. Non-regression and risks

- **Nothing shipped moves.** The change is one new file under `tools/theorycraft/`, one test file, and one
  `.gitignore` line. No `planFixes`, no config, no engine edit — so `tests/golden/plans.json`, `raise.json`,
  `advisor.json`, `sizepool.json` and `benchmark-latest.*` are untouched (verified by a clean `git status`
  over `tests/` and by running the plan suite).
- **Risk — size.** The undominated set may be thousands of rows per army; mitigated by the dedupe, the pruned
  schema, and the band-only fallback (§2, §7). The gate measures this before anything is committed.
- **Risk — `rate()` misread.** Its `hired`/`seconds` terms are degenerate on large deltas; the raw deltas are
  the primary column for exactly this reason (§4).
- **Risk — drift from the engine.** The row schema reads `PlanTotals.repeat`; if that type changes the report
  breaks loudly (a type error), which is the wanted behaviour for a diagnostic.

---

## 10. Order of work

1. **Size gate (measure first).** A throwaway run of `horizonOf` on **one** army (the owner's export): print the
   raw band size, the deduped size, the undominated count, the `fifthCandidate` count, and the JSON bytes with
   the pruned schema. This decides band-only vs undominated, and `vsCheapest` yes/no.
2. Write `tools/theorycraft/march-horizon.ts` (library) against that decided schema.
3. Write `tools/theorycraft/232-the-march-horizon.test.ts` + the `.gitignore` line.
4. Run over all 19; commit the JSON + summary; leave the full table uncommitted.
5. Cross-check one army against `out/231-the-queue-across-the-band.md` (the band, by queue) so the new report is
   provably reading the same set.
6. Commit with the plan doc itself promoted to `docs/plans/the-march-horizon.md` (the repo keeps plans under
   `docs/plans/`; this file is the working copy).

---

## 11. Verification

```bash
# the run itself (writes out/232-the-march-horizon.{json,md} + the gitignored -full.md)
THEORY=1 pnpm vitest run tools/theorycraft/232-the-march-horizon.test.ts

# the same run with his current export beside the 19 armies
PYRRHIC_HORIZON_EXPORT="/home/remi/Downloads/pyrrhic-my-account-2026-10-13 (1).json" \
  THEORY=1 pnpm vitest run tools/theorycraft/232-the-march-horizon.test.ts

# nothing shipped moved
git status --short tests/ src/            # expect clean
npx vitest run tests/engine/plan-benchmark.test.ts tests/engine/plan-stops.test.ts

# eyeball
#  - every army present; stop rows marked with their pick; fifthCandidate non-empty on the owner's armies
#  - the owner's army: the 7 d 9 h / 6.9 M / 3-merc row from 231 is present and marked
#  - census: summarised ≥ undominated ≥ band, and the bar's own readings are inside the horizon
```

**Definition of done:** the JSON and the summary are committed, the full table regenerates on demand, the plan
benchmark and the goldens are untouched, and the next plan (the fifth stop) can read the JSON to choose its
rung.

---

## Size gate result

Measured 2026-10-14 on the owner's export of 2026-10-13 (one `planCampaign`, `withTrade` + `withFrontier`, 0.42 s) and a census of the 19 benchmark armies (`commonScenarios()` + `ownerScenarios(profile)`). Figures in `.maestro/playbooks/Working/march-horizon/size-gate.md` and `troops-only-census.txt`.

1. **Row set: undominated frontier rows + offered stops.** The owner's army is 75 rows (71 undominated + the 4 stops, deduped by `keyOf`; raw 2,248 undominated) = 76 KB of pruned JSON, a fifth of the 400 KB ceiling. Across the 19 armies the row sets total about 875 rows, so about 0.9 MB; the largest army (monster tiers 3–7 at 20 000 dominance) is 176 rows, about 180 KB. The band-alone fallback is not needed, so no refused-undominated count is carried. **The stops are not in the band**: all four offered stops of the owner's army are off-frontier put-back / all-in re-sizes (`onFrontier = false`, `undominated = false`, `inBand = true`), found in `frontier` with `stop` set and in no `trade` row, so the library must add them to the row set explicitly.
2. **`vsCheapest`: included.** It adds 19.2 % (band) and 18.8 % (undominated + stops) to the JSON, under the 25 % bar.
3. **Troops-only fallback (`frontier === undefined`, use `trade`): exercised by no benchmark army.** All 19 return a `frontier` (3 rows for Bear V ×1 up to 6,677 for monster tiers 3-5 at 900 dominance), including the single-monster "first-run" armies. The branch exists in the engine (plan.ts, the troops-only return, which sets `trade` but never `frontier`) and the library keeps it, flagged in the census, but only a hand-built mercenary-free request would reach it.

Open point for the library: `fifthCandidate` is defined as `undominated && inBand && stop === undefined`, which on the owner's army is the whole deduped band (37 rows) because no stop is a band row, and it includes one row that is the *generator* of the burn-saver. The library keeps the mark as defined and carries `generatorOf` beside it; the summary lists generator rows apart so a reader can discount them.

---

## Result

Measured 2026-10-14 from `tools/theorycraft/out/232-the-march-horizon.json` and the notes in
`.maestro/playbooks/Working/march-horizon/` (`run.md`, `crosscheck.md`, `nothing-moved.md`). The run is
`THEORY=1 pnpm vitest run tools/theorycraft/232-the-march-horizon.test.ts`: green, 152.8 s of vitest wall time
(about 2 m 34 s with startup), 19 armies, no `budgetMs`, and byte-identical across two re-runs (JSON, summary
and full report; the wall-clock `planMs` field was removed from `meta` to get there).

**Rows per army:** min 3, median 32, max 176, total 875 (the size gate's estimate of "about 875" held).

**JSON size:** 1,701,922 B committed form (indented), against the size gate's estimate of about 0.9 MB. The
gap is the campaign totals the rows carry after the run-1 fix (a stop-marked row takes the stop's own
`campaign`). The largest army (monster tiers 3–7 at 20 000 dominance) is 316,504 B compact, 79 % of the 400 KB
ceiling. Summary: 48,019 B, 19 sections, longest 33 lines. Full report: 394,343 B, gitignored.

| # | army | rows | stops | `fifthCandidate` |
|--:|---|--:|--:|--:|
| 1 | first-run, Bear V ×1 | 3 | 1 | 1 |
| 2 | first-run, Bear V ×2 | 4 | 1 | 1 |
| 3 | first-run, Bear V ×3 | 4 | 2 | 1 |
| 4 | first-run, Bear V ×10 | 6 | 2 | 3 |
| 5 | first-run, Epic Monster Hunter VI ×83 | 26 | 4 | 15 |
| 6 | first-run, monster tiers 3–5 at 900 dominance | 55 | 5 | 23 |
| 7 | first-run, monster tiers 3–7 at 20 000 dominance | 176 | 5 | 51 |
| 8 | the 4 000-leadership case of 2026-09-15 | 40 | 3 | 11 |
| 9 | 2026-09-17 export, its setup (7 000) | 59 | 5 | 33 |
| 10 | 2026-09-17 export, 12 000 | 96 | 4 | 62 |
| 11 | live account of 2026-09-18 (20 000) | 32 | 4 | 20 |
| 12 | live account, evening (11 000) | 81 | 5 | 39 |
| 13 | Aydae alone, 4 975 | 41 | 4 | 23 |
| 14 | the owner's live camp of 2026-09-18 | 81 | 5 | 44 |
| 15 | his camp of 2026-09-19, localStorage dump | 28 | 5 | 21 |
| 16 | his camp of 2026-09-19, as his message reads it | 32 | 5 | 26 |
| 17 | his TotalStack profile of 2026-09-19 | 49 | 3 | 22 |
| 18 | his usual setup of 2026-09-19 | 31 | 3 | 17 |
| 19 | his browser setup of 2026-09-24 | 31 | 2 | 19 |

`fifthCandidate` is non-empty on all 19. The bar draws 1–5 stops (as §0 said) where the horizon lists 3–176
rows.

**Cross-check against 231** (owner's export of 2026-10-13, run with `PYRRHIC_HORIZON_EXPORT`, 20 armies,
148.4 s; the committed outputs were backed up and restored byte-identical): all 4 distinct band rows of 231 and
all 4 of its stops are present in the army's 75 rows, **0 mismatches**; `fifthCandidate` = 37, equal to the
census figure (summarised 891, undominated 71, band 37; raw 5,757 / 2,248 / 1,795). The 7 d 9 h / 6.9 M /
3-merc row (worst 6,909,026, silver 2,288,300) is present with `undominated`, `inBand` and `fifthCandidate`
set, and **no `stop`**. That is right, not a gap: the bar's three-merc stop is the 18 d 14 h sweet spot
(10,002,509), and this is the row the bar passes over. The playbook text and §11 expected a stop mark on it;
§11 only requires "present and marked".

**Nothing shipped moved:** `git status --short tests/ src/` and the `tests/golden` / `benchmark-latest.*` diff
print nothing; `plan-benchmark` + `plan-stops` pass 81/81 unchanged. `pnpm typecheck`, eslint on the new files
and the 4 library unit tests are clean.

**What the fifth stop can read.** Each army in the JSON carries `rows` (every undominated frontier march plus the
offered stops, deduped by `keyOf`), and every row carries its ten readings, its criteria, its `rating` and
`vsCheapest` deltas against the sweet spot and the cheapest stop, its `campaign` totals, and its `marks`
(`undominated`, `inBand`, `onFrontier`, `stop`, `generatorOf`, `fifthCandidate`). The next plan can filter
`marks.fifthCandidate`, rank by the raw deltas (`dDamage`, `dSilver`, `dGold`, `dCoins`, `dQueue`; `rate` is
degenerate on large deltas, §4), and pick the rung. One caveat from the size gate stands: `fifthCandidate` is
the whole deduped band minus the stops, so it includes rows that are the `generatorOf` a stop (e.g. the
burn-saver's generator on the owner's army); read `generatorOf` beside it. The stops themselves are not band
rows (all four of the owner's are off-frontier put-back or all-in re-sizes), which is why the horizon adds
them explicitly. The `census` per army gives the size of the deeper horizon that is not listed. The rung
choice stays the owner's decision (§0, decision 3).
