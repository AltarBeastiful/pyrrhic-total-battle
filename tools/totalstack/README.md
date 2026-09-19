# `replay.mjs` — the capture kit, from the terminal

The capture kit (`docs/research/totalstack-capture-2026-09-18.md`) is a console snippet: the owner presses
**Generate** once per stacking method and once per method under a priority, the snippet records the request the
page itself sent for each `(route, flag set)` — its `url`, its `init` (method, headers, credentials) and its
`body` — and then `run()` replays those bodies over ten scenarios.

This script does the second half from the terminal. It reads the bases out of the fourth run's dataset,
`docs/research/fixtures/totalstack-2026-09-18-dataset-window.json`, and replays them over **seven scenarios the
benchmark has no TotalStack row for**. Every scenario is derived with the kit's own helpers (`zero`, `firstRun`,
`hire`, `owner`, `OWNER_WINDOW`), copied field for field, so no field name is guessed.

## Running it

```sh
node tools/totalstack/replay.mjs          # dry run — forges the bodies, prints them, sends nothing
node tools/totalstack/replay.mjs --send   # sends them
```

**Dry run is the default.** `--send` is the only thing that sends. Other flags: `--verbose` (print every forged
body instead of one per scenario), `--delay=<ms>` (400 by default, the kit's own pacing), `--origin=<url>`
(`https://totalstack.ca`), `--monster-min-tier=<n>`, `--out=<path>`.

9 bases × 7 scenarios = **98 answers** (28 Generate at priority _none_, 70 priority searches, one per
objective), sent one at a time, 400 ms apart — about a minute plus the server's own time. A request that throws
or comes back outside 2xx is retried **once** and then recorded as it stands, status and all: a failure is a row
in the fixture, never a gap in it.

The answers land in `docs/research/fixtures/totalstack-2026-09-19-replay.json`, in the dataset's own shape —
`capturedAt`, `bases`, `results` with `method`, `scenario`, `priority`, `status`, `request`, `response` — so
`tests/engine/totalstack-rows.ts` can read it by adding the path to its `DATASETS` list.

**The trial ends 2026-09-20.** After that the bases still replay but the answers will not come back.

## The token never leaves the request

`init.headers` holds the headers the owner's browser sent, which may carry his session token. The script
forwards that object to `fetch` untouched and **never reads, prints or writes a header value**. The dry run
prints bodies only. The fixture it writes holds `url` and `body` per base — **no `init`** — so nothing from the
headers reaches disk. Do not add a line that logs `init`.

Node's `fetch` has no cookie jar, so the `credentials: 'include'` the page relied on does nothing here. If the
answers come back 401/403 the session was a cookie the capture never recorded; set `TOTALSTACK_COOKIE` in the
environment and the script forwards it as a `Cookie` header, with the same rule — it is never printed and never
written. Failing that, paste the kit's snippet in the page console as before.

## The seven scenarios

| scenario                          | leadership / authority | hired (caps)                           | troop window                                                   | monsters      |
| --------------------------------- | ---------------------- | -------------------------------------- | -------------------------------------------------------------- | ------------- |
| `first-run, 1 bear`               | 20 000 / 40 000        | Bear V 1                               | first-run (G1–3, S1, nothing excluded, no bonuses)             | off           |
| `first-run, 2 bears`              | 20 000 / 40 000        | Bear V 2                               | ″                                                              | off           |
| `live camp of 2026-09-18`         | 4 975 / 2 180          | ABT 485 · LGN 1 002 · Bear V **9 999** | owner's (archer-3 · spearman-3 · swordsman-1 excluded)         | off           |
| `camp of 2026-09-19, hunters 450` | 4 975 / 2 180          | EMH 450                                | owner's, guardsmen melee+ranged and specialists melee excluded | off           |
| `camp of 2026-09-19, hunters 120` | 5 100 / 2 200          | EMH 120                                | ″                                                              | off           |
| `monsters, first-run army`        | 20 000 / 40 000        | none                                   | first-run                                                      | **tiers 1–9** |
| `monsters, owner's window`        | 4 975 / 2 180          | EMH 450                                | owner's, same category exclusions                              | **tiers 1–9** |

The first two fill the two bear armies `tests/engine/plan-scenarios.ts` pins and the kit answered only at 3 and
10 bears. The next three are the owner's own camps as his browser held them.

**"No cap" is `9999`.** TotalStack's body has no null or absent form for an uncapped type: `selectedMercenaryIds`
_is_ the set of hired ids and `mercenaryCaps` carries a number for each, so a type with no cap entry is a type
that is not hired at all. The kit expresses "unlimited" by hiring at a number nothing can reach — its `evening`
scenario hires legionaries at `9999`, and the doc calls that row "legionaries unlimited"; the answers field
~2 000 of them, bounded by the authority pool rather than by the cap. The bears of the 2026-09-18 camp are
hired the same way.

## The monsters scenarios

TotalStack switches the dominance pool on with **`monsterMinTier` / `monsterMaxTier`**, narrows it with
`excludedMonsterIds`, and answers in `monsterCounts`. Every base of the capture carries
`monsterMinTier: 3, monsterMaxTier: 0` — a maximum below the minimum, i.e. **off** — which is why all 140
captured answers have `monsterCounts: {}` and `dominanceValue: null`. **Total Optimization is
`monsterSaving=true`** (the doc's base table), so the two monsters scenarios are answered under it like every
other base.

The tiers come from the engine's own table, `src/data/tables/monsters.json`: 28 dominance monsters, four a tier,
**tiers 3 to 9** (Battle Boar, Emerald Dragon, Stone Gargoyle, Water Elemental at 3 … Devastator II, Fire
Phoenix II, Kraken II, Trickster II at 9). The script sends `monsterMinTier: 1` (the instruction's value —
harmless, since nothing below 3 exists) and `monsterMaxTier: 9`. Use `--monster-min-tier=3` to send the page's
own lower bound instead, should a monsters request come back outside 2xx.

**The request body carries no dominance field.** Its forty keys hold `monsterMinTier`, `monsterMaxTier` and
`excludedMonsterIds` and nothing else about the pool — no `dominanceValue`, no dominance housing. The _response_
reports a `dominanceValue` (`null` throughout the capture, because monsters were off). So the tiers are all a
scenario can send, and how much dominance the march may spend is the server's reading of the owner's own
profile. If the answers come back with `monsterCounts: {}` and a `dominanceValue` of `null` or `0`, that is the
profile saying it has no dominance, not the request failing to ask.

Note also that the monster _mercenaries_ — Bear V, Cyclops V, and every mercenary the engine tags `monster`
(`src/data/tables/mercenaries.json`) — are **not** these units. They are hired from the authority pool through
`selectedMercenaryIds`, and they are what the bear scenarios above field.
