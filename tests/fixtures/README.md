# Engine regression fixtures

Verbatim copies of `docs/research/fixtures/` (captured 2026-09-12 from totalstack.ca with a Pro trial account,
plus the two in-game battle-report transcripts read from the game's journal on 2026-09-12). Provenance, the
shared army and the per-file contents are described in `docs/research/fixtures/README.md`; nothing here is
edited, so a re-capture is a straight `cp`. `.prettierignore` excludes this folder for the same reason.

- `totalstack-2026-09-12-runs.json` — the zero-bonus runs (Elite Preservation, M's Preservation, Total
  Optimization, Round-to-10s, both priority searches).
- `totalstack-2026-09-12-bonus-runs.json` — army +25/+25 and guardsmen +20/+20, engineers, Ragnarok, Arachne's.
- `totalstack-2026-09-12-mechanics-runs.json` — title special keys, a category bonus, a monster-race bonus,
  temple 20 with training reductions and all three recovery plans, M's Preservation with mercenaries.
- `totalstack-2026-09-12-journal-*.txt` — three battle journals, parsed by `tests/helpers/journal.ts`.
- `ingame-2026-09-11-epic-ancient-report.md` — the two real reports; the numbers are transcribed into
  `tests/engine/ingame-report.test.ts` (the file itself is prose, not machine-read).

The engine tests in `tests/engine/` read these files; the unit tables they need come from
`docs/research/totalstack-data/` through `tests/helpers/units.ts`. What does and does not reproduce exactly is
recorded in `docs/PLAN.md` §7 (entry of 2026-09-12) and in the header comment of each test file.
