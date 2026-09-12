# Game data tables

Everything Pyrrhic knows about Total Battle lives in `src/data/tables/*.json`. The files are plain JSON:
you can fix a value or add a unit straight from the GitHub web editor, without installing anything and
without reading a line of application code. This page explains what each table holds, where to read the
value in game, and how to send the change as a pull request.

- Format decision and validation rules: [ADR-0007](../decisions/0007-game-data-format-and-contributions.md)
- How to open a pull request: [CONTRIBUTING.md](../../CONTRIBUTING.md)
- What changed and when: [`src/data/CHANGELOG.md`](../../src/data/CHANGELOG.md)

## Provenance

The v1 values were read on **2026-09-12** from the public data tables the community calculator TotalStack
ships, reshaped into our own format, and are **still to be verified one by one against the in-game
screens**. They are game facts (health, strength, costs), not anyone's creation, but a number that nobody
has re-read in game can be wrong: if a table disagrees with your unit sheet, the game wins — open a pull
request with a screenshot. `version.json` records the date the tables were last verified, and the app shows
it in its About panel.

Two tables are deliberately incomplete and marked as such:

- **`vip.json`** — the VIP bonuses were not in the capture. Every level is currently `0`. Read them off the
  VIP screen in game (each level lists its army health and army strength bonus) and fill them in. Until then
  the app lets you type the total by hand.
- **artifact level tables** — only *Heart of the Forest* has its level and star tables. For the other
  artifacts the app asks you to type the percentage the artifact popup shows for your own level.

Player-versus-player values (everything the game labels "against players") are **not** kept: Pyrrhic is an
epic-monster calculator and PvP is out of scope.

## The tables

| File              | What it holds                                             | Where to read it in game                                    |
| ----------------- | --------------------------------------------------------- | ----------------------------------------------------------- |
| `troops.json`     | Leadership troops: guardsmen, specialists, engineers       | Unit sheet (tap a unit in the Barracks or in the army panel) |
| `monsters.json`   | Dominance monsters                                         | Unit sheet in the Lair                                       |
| `mercenaries.json`| Authority mercenaries                                      | Unit sheet in the Mercenary Camp                             |
| `captains.json`   | Captain health / strength / special progressions           | Captain screen, level and star rows                          |
| `equipment.json`  | Equipment pieces, bonuses per quality                      | Equipment item popup, quality by quality                     |
| `artifacts.json`  | Artifacts: which bonus they feed, level tables when known  | Artifact popup                                               |
| `titles.json`     | Titles and their army bonuses                              | Titles screen                                                |
| `heroes.json`     | The three heroes                                           | Hero screen                                                  |
| `otherPills.json` | The fixed "+25 %" Personal / Clan / Kingdom bonuses        | Bonus list on the march screen                               |
| `events.json`     | Event effects the engine models                            | Event screen while the event runs                            |
| `vip.json`        | VIP level → army health and strength                       | VIP screen                                                   |
| `temple.json`     | Temple level → revival cost divisor                        | Temple building screen                                       |
| `orders.json`     | Default kill orders and the captain picker order           | —                                                            |
| `version.json`    | `dataVersion`, verification date, notes                    | —                                                            |

All percentages are written the way the game shows them: `39.5` means "+39.5 %". All costs, health and
strength are whole numbers, as displayed, **before** any bonus.

## Fields

### Units (`troops.json`, `monsters.json`, `mercenaries.json`)

| Field                | Meaning                                                                             |
| -------------------- | ----------------------------------------------------------------------------------- |
| `id`                 | kebab-case identifier, e.g. `archer-1`. **Never change one**: saved profiles use it. |
| `name`               | Display name with the tier in roman numerals, e.g. `Archer I`.                        |
| `label`              | Short pill label used in results, uppercase, no spaces: `ARC1`, `SG`.                 |
| `group`              | Troops only: `guardsmen`, `specialist` or `engineers`.                                |
| `tier`               | Tier as shown on the sheet (1–9 today).                                               |
| `category`           | `melee`, `ranged`, `mounted` or `flying`. Engineers have none.                         |
| `race`               | `beast`, `elemental`, `dragon` or `giant`, when the sheet gives one.                  |
| `tags`               | Mercenaries only: every bonus key the unit benefits from (role, category, race).      |
| `cost`               | Housing per unit: leadership, dominance or authority depending on the table.           |
| `health`, `strength` | Base values on the sheet, per unit.                                                    |
| `strengthAgainst`    | The "Strength against …" lines of the sheet, as percentages.                            |
| `doubleDamageChance` | The unit's own chance to deal double damage, percent. Omit when it has none.            |
| `revival`            | `{ "gold": n }` — revival cost per unit, at temple level 0.                             |
| `training`           | `{ "seconds": n, "silver": n, "dragonCoins": n }` — `dragonCoins` only for monsters.    |
| `event`              | Mercenaries only: the event that has to run for the unit's event bonus to count.        |

`strengthAgainst` keys: `melee`, `ranged`, `mounted`, `flying`, `engineers`, `beasts`, `elementals`,
`dragons`, `giants`, `epicMonsters`, `swarmUnits`.

### `captains.json`

A captain gives `level × perLevel + stars[star]` percent on one key, separately for health and strength:

```json
{
  "id": "skadi",
  "name": "Skadi",
  "health": { "key": "guardsmen", "perLevel": 2, "stars": [0, 140, 280, 420, 560, 700, 840] },
  "strength": { "key": "guardsmen", "perLevel": 2, "stars": [0, 140, 280, 420, 560, 700, 840] }
}
```

- `key` is one of the 13 bonus keys: the four categories, `guardsmen`, `specialist`, `engineers`,
  `monster`, `army`, `beast`, `elemental`, `dragon`, `giant`.
- `perLevel` is the percent one captain level is worth (read two levels apart on the captain screen and
  take the difference).
- `stars` has exactly **7** entries, one per star level 0 to 6, each the total the stars add at that level.
- `special` uses the same shape for a special-strength key, e.g. Hercules'
  `armyStrengthAgainstEpicMonsters`.
- `note` carries a restriction the game states, e.g. "only on group marches".
- A captain the game has but whose numbers nobody has read yet is listed with **no** progression, so the
  picker still shows it. Filling one in is the easiest possible first contribution.

### `equipment.json`

One record per piece, one entry per quality (`poor` … `godlike`); each entry holds only what that quality
grants:

```json
{
  "id": "emerald-guardian",
  "name": "Emerald Guardian",
  "byQuality": {
    "godlike": {
      "health": { "melee": 128 },
      "strength": { "melee": 128 },
      "matchup": [{ "attacker": "melee", "target": "mounted", "value": 64 }]
    }
  }
}
```

`matchup` is the "melee strength against mounted" kind of line; `special` holds double-damage and
strike-two-squads chances.

### `artifacts.json`

`health`, `strength` and `special` each say **which key** the artifact feeds and, when the table is known,
the percentage per level and per star:

```json
{
  "id": "heart-of-the-forest",
  "name": "Heart of the Forest",
  "strength": { "key": "army", "levels": { "base": { "1": 42 }, "star": { "0.1": 48 } } },
  "randomBonusOptions": ["armyHealth", "armyStrength", "armyStrengthAndHealth"]
}
```

- `levels.base` keys are artifact levels `"1"`…`"60"`; `levels.star` keys use the in-game star notation
  `"0.1"`…`"5.0"`.
- When `levels` is missing the app asks the user to type the percentage the popup shows. Adding a level
  table is a welcome contribution: read the artifact popup at each level.
- `randomBonusOptions` lists the bonuses the artifact's random slot can roll.

### `titles.json`, `heroes.json`, `otherPills.json`

`bonus` is a single contribution: `health` and `strength` maps on the 13 keys, plus `special`. Svyatogor
carries `"aloneOnly": true` because the game only grants it when the hero marches alone.

### `events.json`

`strength` is the flat percentage the event adds to every unit (Ragnarok: 130). `enemyFormation` replaces
the enemy squad counts while the event runs (Arachne's: two of each). `activatesStrengthAgainst` names the
strength-against key the event switches on (Arachne's: `swarmUnits`).

### `temple.json`

`multiplier` maps temple level to the **divisor** applied to revival costs: at level 30 a revival costs
`revival.gold / 3.84`.

### `orders.json`

`troops` and `monsters` are the default kill orders (first to die first) the custom-order editor starts
from; `captains` is the order the captain picker lists captains in. Every id must exist in its table — the
tests check it.

## Adding or fixing data

1. Edit the JSON (GitHub's web editor is fine).
2. Run `pnpm data:format` if you can; it sorts and re-indents the file so the diff shows only your value.
   If you cannot run it, say so in the pull request and a maintainer will run it for you.
3. Run `pnpm data:check` and `pnpm test`. CI runs both anyway and names the file, the record and the field
   when something is wrong.
4. Bump `dataVersion` in `version.json` and add a line to `src/data/CHANGELOG.md` (see below).
5. Attach the in-game evidence (a screenshot of the unit sheet or a battle report) to the pull request.

### Worked example — a new unit

Tier 10 archers arrive. Open `troops.json` and add, anywhere (the formatter moves it into place):

```json
{
  "id": "archer-10",
  "name": "Archer X",
  "label": "ARC10",
  "group": "guardsmen",
  "tier": 10,
  "category": "ranged",
  "cost": 1,
  "health": 4300,
  "strength": 1430,
  "strengthAgainst": { "melee": 150, "flying": 195 },
  "revival": { "gold": 36 },
  "training": { "seconds": 240, "silver": 4800 }
}
```

Then add `"archer-10"` to `orders.troops` at the position it should die (the list runs from the first unit
to die to the last), bump `dataVersion`, and add the changelog line. Monsters and mercenaries work the same
way, in their own file, with `cost` meaning dominance or authority.

### Worked example — a captain

You own Farhad and the screen shows +1 % flying health per level, +15 % at one star and +30 % at two:

```json
{
  "id": "farhad",
  "name": "Farhad",
  "health": { "key": "flying", "perLevel": 1, "stars": [0, 15, 30, 0, 0, 0, 0] }
}
```

Leave the star levels you have not reached at `0` and say so in the pull request — a partial progression is
better than none, and the next player completes it.

### Worked example — an equipment piece

Add only the qualities you can actually see:

```json
{
  "id": "dragon-scale-shield",
  "name": "Dragon Scale Shield",
  "byQuality": {
    "epic": { "health": { "army": 12 }, "strength": { "army": 12 } },
    "legendary": { "health": { "army": 17 }, "strength": { "army": 17 } }
  }
}
```

## `dataVersion` and the changelog

`version.json` carries `dataVersion` (an integer), `verifiedOn` (the date the tables were last checked
against the game) and a short note. Saved profiles record the `dataVersion` they were built with, so the app
can tell the user "these numbers were computed with data v3" and, later, migrate.

Rules of thumb:

- **Any** change to a table bumps `dataVersion` by one.
- Every bump gets a line in `src/data/CHANGELOG.md`: what changed, and how it was verified.
- Renaming or deleting an `id` is a breaking change (saved profiles reference ids). Say so explicitly in the
  changelog line so the migration can be written.

## What the checks enforce

`pnpm data:check` (also run in CI):

- every file parses and matches its zod schema — unknown keys included, so a misspelt field is an error;
- every file is in canonical form (sorted by id, fixed key order, Prettier).

`pnpm test` adds the cross-table rules: unique ids, kill orders and the captain picker referencing units
that exist, engineers without a category, specialists melee-only below tier 5, four monsters per tier, seven
star steps per captain progression, contiguous artifact level tables — and a parity test proving the tables
still carry exactly the numbers of the research capture they were reshaped from.
