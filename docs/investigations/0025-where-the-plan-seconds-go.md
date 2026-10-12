# 0025 — where the plan's seconds go, and the two levers that were already dead (2026-10-12)

The owner asked three questions on 2026-10-12: *"Are we using performant enough data structures to access the
game knowledge needed for the computations? If we take the bottom operation, what does it come to, where are we
spending those 60 s of computations? What kind of low-level operation is overused?"* Then: *"would limiting the
march horizon work? I don't want to impose blind computation quotas, I prefer smart limits that are backed to be
costless in terms of march rating by theorycrafting."*

**This round answered them and shipped one change: `35b610f` — the plan searches the elite sizer only, for
−17.2 % of the whole Generate + advisor wall.** Everything below is measured; where a figure is a projection it
says so.

## 1. Where the seconds go (measured)

The owner's live export `pyrrhic-my-account-2026-10-11.json`, production split harness (`.maestro/playbooks/
Working/w18/prod/run.mjs`, 6 workers): 142 jobs, **~64 s pool CPU**, 11.0 s wall at `1894a14`.

| part | pool CPU | share |
|---|---:|---:|
| Tight raise (`positionTrades`, 916 calls) | 32.9 s | **51.6 %** |
| `planCampaign` | 28.8 s | **45.1 %** |
| everything else | 2.0 s | 3.2 % |

Inside `planCampaign` the *doors* (JS → wasm) are 45.2 ms wasm + 16.2 ms glue of a 209.5 ms plan (exp 214);
the other ~70 % is JS that never crosses. **Wasm is not the bottleneck, and neither is looking up game
knowledge**: the tables are imported once and packed into flat `Float64Array`s (`src/kernel/layout.ts`), and
battles read them by index. The cost is the *search* — how many shapes a plan prices — plus the JS that packs
and allocates around each price.

## 2. Three experiments, two levers closed

All artefacts are committed except where noted; each test writes its own report under `tools/theorycraft/out/`.

| exp | question | verdict | files |
|---|---|---|---|
| **213** | does the re-typing walk repeat an input? | **No — 0.0 %**, on both the full and the coarse key. `retypeOne`'s own `retypeCache` (`plan.ts` ~6946) already dedupes 54.2 % of its calls. A walk memo recovers **0.00 ms/plan**. | `213-the-retype-repeat-census.test.ts`, `out/213-*.md`, `docs/research/patches/213-*.patch` |
| **214** | does batching the kernel doors pay? | **No — ≈0.05 % of the plan wall.** The doors' "glue" is JS *packing* (writing each stack's row and count into wasm, reading figures back, allocating a result), which a batch crossing repeats per element. A 40-round A/B disagreed in sign. The census also **moved**: `marchBill`, 90 699 calls when W18 measured it, is 31 calls a plan today, and the biggest door is now `sizerShape` (2.56 % of the plan wall). | `214-*.test.ts`, `out/214-*.md`, `docs/research/patches/214-*.patch` |
| **215** | which search knob is costless to restrict? | see below | `215-*.test.ts`, `out/215-*.md`, `out/215-*-stage1.md`, `docs/research/patches/215-*.patch` |

Exp 215's ranked table (plan CPU saved against stops moved, benchmark = 68 stops over 19 armies):

| knob | restriction | plan CPU | stops moved | verdict |
|---|---|---:|---:|---|
| `SIZER_DEPTHS` | drop `msRelaxed` | 36.1 % | 0 | **costless** |
| `SIZER_DEPTHS` | drop `ms` | 8.4 % | 0 | **costless** |
| `climbRounds` 32 → 8 / 16 | | 20.1 / 16.5 % | 3 (worst −24) | trade |
| `DEPTHS` no low / no high / middle | | 15.5 / 6.2 / 5.0 % | 15–28, some **lost** | trade |
| `LADDER_GROWTHS` every other | | 3.1 % | 6 | under the bar |
| `WINNER_RUNGS_DEPTH` off, `climbSeeds` 8→4, `sweepRounds` 16→8 | | ≈0 | 0–6 | under the bar |
| `advisorSweep.horizons` `[3,4,5]` → `[4]` | | 2 probe plans (973 ms) | 0 plan stops | costless (drops 2 advisor rows) |

**The `SIZER_DEPTHS` result was independently audited** (`215b-the-sizer-methods-audit.test.ts`, `out/215b-*.md`):
on the owner's live account, `keep elite only` leaves the whole plan **byte-identical** — the same sha256 in a
fresh process with the restricted arm first, so no warm cache can explain it — for **−47.2 % of plan CPU**
(329 → 174 ms, interleaved medians). The full benchmark under that restriction passes 20/20 and its two payloads
differ in **0 non-timing leaves**.

**One correction the audit forced:** dropping `elite` *alone* is **not** costless on the owner's account — it
changes the plan; the 19 benchmark armies just don't cover that case. The safe reduction is *keep `elite`, drop
the other two*, never "drop any of the three". And the costlessness holds only on the armies this repo measures.

## 3. What shipped (`35b610f`)

`SIZER_DEPTHS` in `src/engine/plan.ts` drops the `ms` and `msRelaxed` methods. They were put in by experiment 94
(2026-09-17) and made redundant by **W11's rated re-typing** (2026-09-23): each sizer method spawns a derived
vector the ladder grid then scores, and the re-typing re-chooses the very troops the methods differ by — so the
two extra methods cost a whole sweep each and change nothing.

Two golden captures moved by **`leftOut` only, always downward** (34 entries: 3 364→3 110, 470→444, …) — the
count of kept-but-unoffered plans, which falls with the smaller search. Every answered stop is unchanged. They
were re-captured (`CAPTURE=1`, then `pnpm format`: `writeGolden` emits 1-space JSON, the repo keeps 2-space).
Gate green: `kernel:build`, `typecheck`, `lint`, `format:check`, and **152 files / 1 971 tests**.

**End-to-end (same machine, same harness, same export, min of 3 runs):**

| | before `1894a14` | after `35b610f` | saved |
|---|---:|---:|---:|
| all passes (Generate + advisor) | 11 008 ms | **9 117 ms** | **−1 891 ms (−17.2 %)** |
| pool CPU (run 1) | 59 410 ms | 48 812 ms | −17.8 % |
| … `planCampaign` | 26 497 ms | 18 061 ms | **−32 %** |
| … Tight | 30 991 ms | 29 096 ms | −6 % (noise: Tight is untouched) |

The wall gains less than the CPU because Tight is now 59.6 % of pool CPU and unchanged — Amdahl, not a defect.

## 4. Open, and what was rejected

- **Rejected with numbers: porting the planner to wasm.** The doors are only ~29 % of the plan wall (21.6 % wasm
  + 7.7 % glue); ~70 % is JS that never crosses, dominated by allocation (156–183 MiB a plan, GC 11.7 %, exp
  197/206). AssemblyScript builds with `runtime: "stub"` — no GC — so the same code needs a manual alloc/arena
  redesign first. The earlier ports' ×2.2–×8.2 came from the *data-structure* change they carried, not the ISA.
- **The horizon is not a compute lever.** `CAMPAIGN.marches` (4) is a per-vector ceiling on repeats
  (`repeatsFor`), not a search dimension, so cutting it saves ~no CPU while moving the answer — and it is the
  *dominant lever of the answer*: exp 82–85 measured 4 as the peak damage of all ten horizons.
- **Next named target:** `sizerShape`, the biggest remaining door at 2.56 % of the plan wall. Beyond that, the
  levers left are algorithmic (how many shapes a plan prices) or a door-contract change — the caller handing the
  kernel compact data it expands itself, which is what exp 214 showed a batch crossing does *not* achieve.

## 5. State of the tree

- `main` is at `35b610f`, pushed to `origin/main`.
- **Uncommitted, deliberately:** `todos.md` (the owner's own edit); `pyrrhic-my-account-2026-10-07.json` (a
  timing fixture, documented as never committed); `tools/perf-trace/__pycache__/`; and
  `tools/theorycraft/out/215-runs/` — **4.6 MB** of per-restriction benchmark captures, ~13× the largest existing
  artefact in `out/`, regenerated by re-running exp 215 (the report carries every figure they back).
- The three census patches (`docs/research/patches/213/214/215-*`) are census-only and are **not applied** to the
  tree; `git apply` them to re-run their experiments.

## 6. Reproduce

```sh
# the experiments (each writes tools/theorycraft/out/<n>-*.md)
THEORY=1 pnpm vitest run tools/theorycraft/213-the-retype-repeat-census.test.ts
THEORY=1 pnpm vitest run tools/theorycraft/214-the-batch-door-prototype.test.ts
git apply docs/research/patches/215-search-knobs.patch   # 215 and 215b need it
THEORY=1 pnpm vitest run tools/theorycraft/215-the-search-knobs.test.ts
THEORY=1 pnpm vitest run tools/theorycraft/215b-the-sizer-methods-audit.test.ts
git apply -R docs/research/patches/215-search-knobs.patch

# the end-to-end production figures (build + headless Chromium, ~4 min an arm)
SPLIT=1 node .maestro/playbooks/Working/w18/prod/run.mjs pyrrhic-my-account-2026-10-11.json 6 3
```
