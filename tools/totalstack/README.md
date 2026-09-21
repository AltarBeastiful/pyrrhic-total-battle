# `replay.mjs` — the capture kit, from the terminal

The capture kit (`docs/research/totalstack-capture-2026-09-18.md`) is a console snippet: the owner presses
**Generate** once per stacking method and once per method under a priority, the snippet records the request the
page itself sent for each `(route, flag set)` — its `url`, its `init` (method, headers, credentials) and its
`body` — and then `run()` replays those bodies over ten scenarios.

This script does the second half from the terminal. It reads the bases out of the fourth run's dataset,
`docs/research/fixtures/totalstack-2026-09-18-dataset-window.json`, and replays them over **ten scenarios the
benchmark has no TotalStack row for**. Every scenario is derived with the kit's own helpers (`zero`, `firstRun`,
`hire`, `owner`, `OWNER_WINDOW`), copied field for field, so no field name is guessed.

## Running it

```sh
node tools/totalstack/replay.mjs                                    # dry run — prints the bodies, sends nothing
TOTALSTACK_SESSION_ID=<uuid> node tools/totalstack/replay.mjs --send # sends them
```

`--send` **refuses to run** without `TOTALSTACK_SESSION_ID`, and says so: TotalStack identifies the caller by
the `x-session-id` header and this script takes that value from the environment only. It is never printed and
never written.

**Dry run is the default.** `--send` is the only thing that sends. Other flags: `--verbose` (print every forged
body instead of one per scenario), `--delay=<ms>` (400 by default, the kit's own pacing), `--origin=<url>`
(`https://totalstack.ca`), `--monster-min-tier=<n>`, `--out=<path>`.

9 bases × 12 scenarios = **168 answers** (40 Generate at priority _none_, 100 priority searches, one per
objective), sent one at a time, 400 ms apart — about two minutes plus the server's own time. A request that throws
or comes back outside 2xx is retried **once** and then recorded as it stands, status and all: a failure is a row
in the fixture, never a gap in it.

The answers land in `docs/research/fixtures/totalstack-2026-09-19-replay.json`, in the dataset's own shape —
`capturedAt`, `bases`, `results` with `method`, `scenario`, `priority`, `status`, `request`, `response` — so
`tests/engine/totalstack-rows.ts` can read it by adding the path to its `DATASETS` list.

**The 2026-09-19 trial ended 2026-09-20**, and the replays of that morning answered **403 on all 170
priority-search calls**. The owner is opening a new account (2026-09-22) for S-119's capture.

### Running S-119's capture

1. Sign in at `https://totalstack.ca` on the new account, with **Pro active** — the Generate route answers
   without it, the `optimize` route does not, and it is the `optimize` rows the benchmark most wants.
2. Open the devtools network panel, press **Generate** once, and copy the `x-session-id` header off any
   request to `/api/calculations`. It is a uuid.
3. Dry-run first and read the twelve scenario lines — the bodies are printed, nothing is sent:
   ```sh
   node tools/totalstack/replay.mjs
   ```
4. Then send:
   ```sh
   TOTALSTACK_SESSION_ID=<uuid> node tools/totalstack/replay.mjs --send --out=docs/research/fixtures/totalstack-2026-09-22-replay.json
   ```
   168 answers, 400 ms apart — about two minutes plus the server's time. A non-2xx is retried once and then
   recorded **as a row**, so a lapsed subscription shows up as 403s in the fixture rather than as silence.
5. Add the new path to `DATASETS` in `tests/engine/totalstack-rows.ts`, **last**, so no scenario an earlier
   run answered changes its row by this one's arrival (the rule S-101 set).

**What one good run buys**: the benchmark goes from **15 scored armies to 17**, and the 20 000-dominance camp
gets rows to stand against once it is registered.

## Headers, and the token

**Updated 2026-09-19**, from a `POST /api/calculations/optimize` the owner captured that came back 200. There
is **no authorization header at all**: the route is identified by `x-session-id` (a uuid, his session) and
`x-calculation-request-id` (a uuid the page mints per calculation). So the script sends

- `x-session-id` — from the environment variable **`TOTALSTACK_SESSION_ID`**, required by `--send`;
- `x-calculation-request-id` — a fresh `crypto.randomUUID()` **per request** (a retry gets a new one);
- `content-type: application/json`, `origin: https://totalstack.ca`, `referer: https://totalstack.ca/`;
- every other stored header from `init.headers`, forwarded opaquely, **minus** any key whose _name_ matches
  `/authorization|cookie|set-cookie|content-type|origin|referer|x-session-id|x-calculation-request-id/i`.

Keys are filtered **by name**. The script never reads, prints or writes a header value — the dry run prints
bodies only, and the fixture holds `url` and `body` per base, **no `init`**. Do not add a line that logs
headers.

**Every name the script sets is dropped from the stored headers first, and that is not cosmetic.** The capture
carries `Content-Type`; the script adds `content-type`. A JS object keeps both, and `fetch` builds `Headers`
from an object by **appending**, so the two casings merge into one comma-joined value —
`content-type: application/json, application/json`. No JSON body parser accepts that, so the server parsed no
body and its validator answered `{"message":"Required","field":""}` — an empty path, i.e. the root of the
schema: _the body itself is missing_. That is what made the first attempt fail 140/140 on both routes while the
earlier version, which forwarded the stored headers untouched, was answered 201. The dry run now prints the
final header **names**, flags any duplicate casing, and prints the serialised body's byte length and first 80
characters, so the same failure is visible without sending.

## The body schema

`TEMPLATE` in the script **is** his own 2026-09-19 request, verbatim from that 200: leadership 5 225, dominance
100, authority 2 120, monsters at tier 3, Epic Monster Hunter **V** 80 with bears and cyclopes at 6, guardsmen
+60/+60 and army +3/+3. Every scenario is built on it, so every key of the current schema goes out — including
the ones the 2026-09-18 bodies had none of: `dominanceValue`, `templeLevel`, `trainingCostReductions`,
`trainingSpeedBonuses`, `recoveryPlan`, `reviveAllTroops`, and the `giant` row of the two bonus maps.

The order is: **template → the stored base body → the scenario's fields**. Laying the stored body over the
template is what keeps each base's own method flags (`monsterSaving`, `enforceOrdering`, `relaxedPreservation`
…), its tier windows and **its bonuses** — the first-run army's zeros and the owner's export's guardsmen +54 —
rather than the template's. The two bonus maps are merged key-wise so `giant` is always present, and on the
Generate route (`/api/calculations`) the three optimize-only keys — `objective`, `deepOptimizationSeeds`,
`optimizationSeed` — are dropped unless the stored base had them (none does).

## The twelve scenarios

| scenario                                | L / dominance / authority    | hired (caps)                                  | troop window                                                   | monsters      |
| --------------------------------------- | ---------------------------- | --------------------------------------------- | -------------------------------------------------------------- | ------------- |
| `first-run, 1 bear`                     | 20 000 / 100 / 40 000        | Bear V 1                                      | first-run (G1–3, S1, nothing excluded, no bonuses)             | off           |
| `first-run, 2 bears`                    | 20 000 / 100 / 40 000        | Bear V 2                                      | ″                                                              | off           |
| `live camp of 2026-09-18`               | 4 975 / 100 / 2 180          | ABT 485 · LGN 1 002 · Bear V **9 999**        | owner's (archer-3 · spearman-3 · swordsman-1 excluded)         | off           |
| `camp of 2026-09-19, hunters 450`       | 4 975 / 100 / 2 180          | EMH 450                                       | owner's, guardsmen melee+ranged and specialists melee excluded | off           |
| `camp of 2026-09-19, hunters 120`       | 5 100 / 100 / 2 200          | EMH 120                                       | ″                                                              | off           |
| `his TotalStack profile 2026-09-19`     | **5 225 / 100 / 2 120**      | EMH **V** 80 (caps also bears 6 · cyclopes 6) | the template's own                                             | **tier 3–3**  |
| `monsters, first-run army`              | 20 000 / **20 000** / 40 000 | none                                          | first-run                                                      | **tiers 3–9** |
| `monsters, owner's window`              | 4 975 / **20 000** / 2 180   | EMH 450                                       | owner's, same category exclusions                              | **tiers 3–9** |
| `monsters, camp 110 — dominance 900`    | 20 000 / **900** / 2 180     | EMH 83 · Bear V 6                             | first-run                                                      | **tiers 3–5** |
| `monsters, camp 110 — dominance 20 000` | 20 000 / **20 000** / 2 180  | EMH 83 · Bear V 6                             | first-run                                                      | **tiers 3–5** |
| **`Aydae alone, 4 975`**                | 4 975 / 100 / 2 180          | EMH 83 · LGN **9 999** · CHR 10 · ABT 60      | owner's, guardsmen melee+ranged excluded, **specialists kept** | off           |
| **`his usual setup 2026-09-19`**        | **5 200 / 200 / 2 000**      | EMH VI 90                                     | ″, G1–3 and S1–1                                               | **tier 3–3**  |

**The last two are S-119's, added 2026-09-22**, and they are the reason a new capture is worth running at all:
they are the only two armies on the benchmark with **no captured answer of any kind**, so
`plan-benchmark.test.ts` prints `—` for them on every reading and _"beat TotalStack everywhere"_ has two blind
spots — one of them **the camp the owner actually plays**. Both are built field for field from
`tests/engine/plan-scenarios.ts` (`aydaeAlone` and `usualSetup`); note that both keep the **melee specialist**,
unlike the two 2026-09-19 camps above, because their `topTierExcluded.specialists` is empty.

The first two fill the two bear armies `tests/engine/plan-scenarios.ts` pins and the kit answered only at 3 and
10 bears. The next three are the owner's own camps as his browser held them; the sixth is his TotalStack
profile as it stood on 2026-09-19. The last two mirror the two dominance camps
`tools/theorycraft/110-monster-shelter.test.ts` measures the plan on, so its tables and these answers line up.

**"No cap" is `9999`.** TotalStack's body has no null or absent form for an uncapped type: `selectedMercenaryIds`
_is_ the set of hired ids and `mercenaryCaps` carries a number for each, so a type with no cap entry is a type
that is not hired at all. The kit expresses "unlimited" by hiring at a number nothing can reach — its `evening`
scenario hires legionaries at `9999`, and the doc calls that row "legionaries unlimited"; the answers field
~2 000 of them, bounded by the authority pool rather than by the cap. The bears of the 2026-09-18 camp are
hired the same way.

## The monsters scenarios

TotalStack switches the dominance pool on with **`monsterMinTier` / `monsterMaxTier`**, narrows it with
`excludedMonsterIds`, and answers in `monsterCounts`. Every base of the 2026-09-18 capture carries
`monsterMinTier: 3, monsterMaxTier: 0` — a maximum below the minimum, i.e. **off** — which is why all 140
captured answers have `monsterCounts: {}` and `dominanceValue: null`. His 2026-09-19 request has them on, at
tier 3–3 with 100 dominance. **Total Optimization is
`monsterSaving=true`** (the doc's base table), so the two monsters scenarios are answered under it like every
other base.

The tiers come from the engine's own table, `src/data/tables/monsters.json`: 28 dominance monsters, four a tier,
**tiers 3 to 9** (Battle Boar, Emerald Dragon, Stone Gargoyle, Water Elemental at 3 … Devastator II, Fire
Phoenix II, Kraken II, Trickster II at 9). **The minimum sent is never below 3** — nothing exists there, and his
own 2026-09-19 request bottoms out at 3. `--monster-min-tier=<n>` raises it; it cannot lower it past 3.

**The request body carries no dominance field.** Its forty keys hold `monsterMinTier`, `monsterMaxTier` and
`excludedMonsterIds` and nothing else about the pool — no `dominanceValue`, no dominance housing. The _response_
reports a `dominanceValue` (`null` throughout the capture, because monsters were off). So the tiers are all a
scenario can send, and how much dominance the march may spend is the server's reading of the owner's own
profile. If the answers come back with `monsterCounts: {}` and a `dominanceValue` of `null` or `0`, that is the
profile saying it has no dominance, not the request failing to ask.

Note also that the monster _mercenaries_ — Bear V, Cyclops V, and every mercenary the engine tags `monster`
(`src/data/tables/mercenaries.json`) — are **not** these units. They are hired from the authority pool through
`selectedMercenaryIds`, and they are what the bear scenarios above field.
