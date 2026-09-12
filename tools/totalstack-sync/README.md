# totalstack-sync — the TotalStack data-drift check

Our game tables (`src/data/tables/*.json`) were bootstrapped from the factual game statistics that the
community calculator [TotalStack](https://totalstack.ca/) ships in its public JavaScript bundle, reshaped
into our own format and re-verified against in-game screens. The game changes; TotalStack updates quickly.
This tool answers one question: **do their numbers still agree with ours, and where exactly do they not?**

It is story S-05 in its **manual, local form**. Nothing here downloads anything, and no CI job runs it.

## Status (ADR-0001)

[ADR-0001](../../docs/decisions/0001-totalstack-drift-check.md) — "may we fetch their bundle
automatically?" — is **Proposed, decision pending** (story S-07). Until it is decided we use option 2 of
that ADR: a contributor saves the files from their own browser and runs the comparison locally. If the ADR
is later accepted, the same script can be pointed at freshly downloaded files by a scheduled job; the code
here does not need to change, because it takes file paths, not URLs.

## The manual procedure

1. Open <https://totalstack.ca/> in a browser, open the developer tools, and in the **Network** tab reload
   the page. Save `assets/index-*.js` (right-click → _Save as_). Click through the calculator once so the
   lazy chunks load too (`Home-*.js` and friends) and save those as well — the tables are spread over
   several chunks, and the tool tells you if one is missing.
2. Run the comparison on the files you saved:

   ```sh
   pnpm data:compare -- ~/Downloads/index-*.js ~/Downloads/Home-*.js
   ```

3. Read the Markdown report it prints. Exit code `0` means every compared table matches value for value;
   `1` means something differs (or a table was not found in the files you gave it).
4. **Paste the report into the pull request** that changes `src/data/tables`, under a
   "TotalStack comparison" heading. Disagreeing with TotalStack is allowed — the game is the authority, not
   they — but the disagreement has to be stated, with the in-game evidence, and `dataVersion` bumped
   (see [`docs/data/README.md`](../../docs/data/README.md)).

Do not commit the downloaded bundle: it is their file, and it is big. `docs/research/totalstack-data/`
already holds the capture the tables were bootstrapped from.

Two more modes:

```sh
pnpm data:compare -- --selftest                      # the tokenizer's own test cases
pnpm data:compare -- --explore [--out dir] <files>   # list every data-like literal in the files
```

`--explore` is for the day a table moves, gets a new shape, or the game gains one we do not model yet: it
prints every literal in the bundle that looks like data (with the minified variable name, so a human can
find it again in the file) and can write each one out as JSON.

## What it does

`compare.ts` is one dependency-free TypeScript file, run by Node's own type stripping like every script in
`scripts/`. Three rules keep it honest:

1. **It never evaluates the bundle.** `jsLiteralToJson` is a tokenizer that reads one minified
   object/array literal and returns data: bare and numeric keys, `!0`/`!1`, `1e3`, `.5`, all three quote
   characters and their escapes. What it cannot read is an error, never a silently wrong value. Bare
   identifiers become `"$ref:name"`, spreads `"$spread:name"`, calls `"$call:…"`, and an arrow function
   makes it refuse the literal outright — that is code, not data.
2. **It never looks a table up by its minified variable name.** Those change on every TotalStack build.
   Each table is found by its content, and the candidate is only accepted if its records have the right
   shape:

   | Our table          | Found as                                                                             |
   | ------------------ | ------------------------------------------------------------------------------------ |
   | `troops.json`      | the array containing `id:"archer-1"`                                                 |
   | `monsters.json`    | the array containing `id:"stone-gargoyle"`                                           |
   | `mercenaries.json` | the array containing `id:"cyclops-5"`                                                |
   | `captains.json`    | the object keyed by captain names whose values carry `bonusKey`/`starBonuses`        |
   | `equipment.json`   | the array whose records carry `bonusesByQuality`                                     |
   | `artifacts.json`   | the array whose records carry `randomBonusOptions`                                   |
   | `titles.json`      | the array whose records carry `playerOnlyHealthBonuses` (or the name "Battlemaster") |
   | `temple.json`      | the object keyed `"1"`…`"45"` whose values run 1.04 … 5.91                           |

   Finding the enclosing literal means scanning the chunk with strings, template substitutions, comments
   and regular expressions skipped, so a `]` inside `/[)]/` cannot throw the scan off.

3. **It reshapes their records into ours before diffing**, exactly as `scripts/data-tables.ts` and
   `docs/data/README.md` describe: `leadershipCost`/`dominanceCost`/`authorityCost` → `cost`,
   `revivalCost` → `revival`, `trainingTime` + `trainingCost` → `training`, `pillLabel` → `label` without
   its space, `Archer 1` → `Archer I`, ids slugged from names (`Guardsmen's Courage` →
   `guardsmens-courage`), engineers without a category, mercenary tags in our order, and every
   "against players" field dropped (PvP is out of scope). A naming difference therefore never shows up as
   drift; only a number, an id or a missing record does.

The report lists, per table: ids they have and we do not, ids we have and they do not, and every changed
field as `path | ours | theirs`.

## What it does not compare

- `heroes.json`, `otherPills.json`, `events.json`, `vip.json`, `orders.json`, `version.json` — no content
  locator. VIP was not in the capture at all; events and the hero/pill split are our own modelling. The
  report says so, so nobody reads a silent pass as a clean bill of health.
- Artifact **level tables** when the bundle keeps them in a shared variable the tool cannot follow. It
  follows the reference when the same chunk assigns it (that is how `heart-of-the-forest` is compared in
  full); otherwise the record is listed under "Not comparable" and its other fields are still compared.
- `mercenaries.json` → `event`: which event a mercenary belongs to is read from the game, not from them.

## Tests

`compare.test.ts` (vitest, node) builds a minified-looking bundle out of
`docs/research/totalstack-data/*.json` — bare keys, `!0`/`!1`, `3e3`, mixed quotes, a regular expression,
a template literal and a decoy string that pretends to be the troop table — and checks that the tool finds
all eight tables by content, reshapes them and reports **no** difference against `src/data/tables`. A second
bundle changes one value, adds a unit and removes a unit; the test asserts exactly those three findings.

## History

The first pass at this (September 2026) was three Python prototypes: `jsconv.py`, `extract_all.py` and
`extract_named.py`. `compare.ts` replaces all three — the tokenizer is a port of `jsconv.py` with unit
tests (`--selftest`), `--explore` replaces `extract_all.py`, and `extract_named.py` (which looked tables up
by minified name) is exactly what a drift check must not do. The Python files were therefore deleted rather
than kept as dead weight; `git log` has them if they are ever wanted.
