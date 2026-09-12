# ADR-0001 — Fetching TotalStack's public bundle for the data-drift check

Status: **Proposed — decision pending** (story S-07). Until decided, only the manual local form of S-05 exists.

## Context
Our game tables were bootstrapped from the data tables shipped in TotalStack's public JavaScript bundle. The game
changes (new units, rebalances), and TotalStack tends to update quickly. An automated weekly job that downloads their
bundle, extracts the tables and diffs them against ours would tell us when to re-verify values in game.

Facts gathered on 2026-09-12: totalstack.ca publishes no terms of service and no privacy policy; `robots.txt`
allows `/` and disallows only `/admin/`, `/clan` and `/reset-password`; the tables are plain literals in a public,
unauthenticated asset. The values themselves are facts about the game, not TotalStack's creative work, but the
extraction targets their asset and their servers.

## Options considered
1. Automated weekly fetch in CI, diff, open an issue (no Claude, deterministic script).
2. Manual: a contributor downloads the bundle in a browser and runs the same script locally, pastes the diff into
   the PR. No automated traffic to their servers.
3. No comparison with TotalStack at all; rely on players reporting in-game changes.

## Decision (pending)
Default to option 2 now. Before enabling option 1: re-check for published terms, and ask on their Discord whether
they object to a weekly automated download of one asset. Record the answer here and flip the status. If they
object, keep option 2 permanently.

## Consequences
- The extraction code lives in `tools/totalstack-sync` and is written to locate tables by content, never by
  minified variable name, so it survives their builds either way.
- Our tables must be verifiable without TotalStack: every field maps to an in-game screen (ADR-0007), so option 3 is
  always a working fallback.
