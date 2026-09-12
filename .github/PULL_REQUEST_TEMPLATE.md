<!--
Thanks for the pull request. Fill in the part that matches your change and delete the other one.
Game data: docs/data/README.md — Code: CONTRIBUTING.md
-->

## What changed

<!-- One or two sentences. For data: which table, which records, which fields. -->

## Game data

- [ ] Tables touched: <!-- e.g. src/data/tables/troops.json -->
- [ ] **In-game evidence** attached (screenshot of the unit sheet / captain screen / equipment popup, or a
      battle report). Which server / kingdom:
- [ ] `dataVersion` bumped in `src/data/tables/version.json`
- [ ] Line added to `src/data/CHANGELOG.md`
- [ ] `pnpm data:format` run (say so here if you could not run it)
- [ ] No `id` was renamed or removed — or, if one was, it is called out above because saved profiles
      reference ids

<!-- If your values disagree with the ones already in the repository, say which one your game shows. -->

## Code

- [ ] `pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm data:check` all pass
- [ ] Tests cover the new behaviour
- [ ] No network call, no analytics, no third-party asset added
- [ ] Wording is our own (nothing copied from another tool or from the game's help text)
- [ ] `docs/PLAN.md` or a decision record updated when the change affects them

## Anything the reviewer should know

<!-- Open questions, things you were unsure about, follow-ups you deliberately left out. -->
