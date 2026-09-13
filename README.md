# Pyrrhic

Pyrrhic works out which units to send against a Total Battle epic monster. You tell it what your account
owns — tier ranges, mercenaries and their caps, every bonus source — plus the housing you have free and the
monster you are hitting; it sizes each stack so the ones that die first are the ones you can afford to lose,
simulates the fight, and gives you the counts to type into the game along with the damage and the recovery
bill. It runs entirely in your browser: no account, no server, no telemetry, no network call of any kind
(ADR-0002). Profiles, saved marches and settings live in this browser's storage and can be exported as JSON
or handed over as a link that carries the whole configuration in the URL fragment, which browsers never send
anywhere.

## Stack

Vite and React 19 with TypeScript in strict mode. The UI is **Mantine 9** used as documented — the theme in
`src/ui/theme.ts` is generated from the design hues by `src/ui/palette.ts`, targeting relative luminance so
every group colour lands in the same contrast band, and sections compose stock components rather than
carrying their own CSS (ADR-0008). State is zustand, schemas and migrations are zod, unit tests are Vitest,
end-to-end and visual tests are Playwright. The app is a progressive web app with a hand-written service
worker (no PWA dependency) and ships to GitHub Pages from `main`.

## Running it

Node 22 (`.nvmrc`) and pnpm 10.

```sh
pnpm i
pnpm dev --port 5180
```

The component gallery — every kit and domain composite, in both colour schemes — is at `/#kit`. It exists in
development only; the production build folds the route away and never bundles it.

The service worker is not registered by `pnpm dev`, since it fights hot reloading. Start with
`VITE_PWA_DEV=1 pnpm dev` to exercise it.

## Testing

`pnpm test`, `pnpm lint`, `pnpm typecheck`, `pnpm format:check`, `pnpm data:check` and `pnpm build` are what
CI runs. The scripts do not forward a path filter, so call the runners directly for one file:

```sh
pnpm vitest run src/ui/kit/ChoiceList.test.tsx    # one unit test file
pnpm vitest run -t 'the arrows move'              # one test by name
pnpm exec playwright test e2e/troops.spec.ts      # one e2e spec
pnpm test:visual                                  # kit-page screenshots and axe, at 390 and 1280
pnpm contrast                                     # every contrast pair the palette promises, WCAG 2.2
pnpm size                                         # bundle budgets against a built dist/
```

`pnpm test:visual:update` re-baselines the screenshots after a deliberate change; `pnpm size` needs
`pnpm build` first. Playwright needs its browsers once: `pnpm exec playwright install`.

## Documentation

| Where                                          | What                                                                                                                                                                    |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/PLAN.md`](docs/PLAN.md)                 | Architecture, the engine specification, the milestones and the story status table; §7 is the running review log                                                         |
| [`docs/design-rules.md`](docs/design-rules.md) | The owner's UI and UX charter. When a rule and a plan disagree, the rule wins                                                                                           |
| [`docs/design.md`](docs/design.md)             | The design system as built: palette, surfaces, type, glyphs, component defaults, wording glossary                                                                       |
| [`docs/plans/`](docs/plans/)                   | The design overhaul (personas, journeys, cards, stories D-xx) and the UI foundation plans, including the Mantine migration                                              |
| [`docs/decisions/`](docs/decisions/)           | Architecture decision records, indexed in [`docs/decisions/README.md`](docs/decisions/README.md)                                                                        |
| [`docs/investigations/`](docs/investigations/) | Numbered findings: cross-device sync, the Google Drive requirements, TotalStack observed live, the Mantine spike, the frame spike, hosting, the rules-compliance review |
| [`docs/research/`](docs/research/)             | Game data tables, captured fixtures, the battle-model observations and the TotalStack review the engine was validated against                                           |

The kit's contract is in [`src/ui/kit/README.md`](src/ui/kit/README.md).

## Contributing game data

The tables under `src/data/tables/` are plain JSON and are meant to be edited by players, in the GitHub web
editor if that is all you have — no development environment required (ADR-0007). Read
[`docs/data/README.md`](docs/data/README.md) for what every table and field means and where to read the value
in game, then follow [`CONTRIBUTING.md`](CONTRIBUTING.md): edit the file, run `pnpm data:format` if you can,
bump `dataVersion`, add a changelog line, and attach the in-game evidence. Values nobody can check are not
merged; a value that disagrees with what is in the repository is useful information, not a problem. Schemas,
cross-table integrity and the engine regression tests all run on the pull request.

## Account sync

Signed-in sync across devices is **optional, opt-in and off by default**: a build without
`VITE_BACKEND_ORIGIN` has no account rows at all and never loads the SDK. See [`docs/sync.md`](docs/sync.md)
and [ADR-0009](docs/decisions/0009-optional-account-sync.md).

## Licence and assets

[AGPL-3.0-or-later](LICENSE); a hosted copy has to stay open too. Game data is factual and shared under the
same repository terms.

There are **no third-party icon assets**. Game concepts — units, groups, resources, states — are drawn with
the platform's own Unicode emoji through one `Glyph` component, the way the game and TotalStack write them,
so there is no icon licence to carry and nothing to fetch. Lucide (ISC) supplies the interface chrome only:
chevrons, gears, close buttons. Inter and Fraunces are bundled variable fonts under the SIL Open Font
License. Nothing is loaded from a CDN.
