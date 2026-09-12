# ADR-0004 — Local persistence and versioned config schema

Status: Accepted (2026-09-12)

## Context
Users keep several game accounts, each with many bonus values that change as the account progresses, and they run
many marches with different captains/events/housing. Everything must survive reloads, be exportable, and remain
loadable after the app's data model evolves.

## Options considered
- Storage: **localStorage** (synchronous, ~5 MB, string values) vs IndexedDB (async, large, structured) vs the
  File System Access API (explicit files; Chromium only for write access).
- Shape: one root document vs many keys (TotalStack uses ~90 separate keys, which makes export/migration painful).
- Model: single flat "profile" vs three levels (Profile / Battle setup / Saved stack).

## Decision
- One root document under a single key `pyrrhic.v1`:
  `{ schemaVersion, dataVersion, activeProfileId, profiles: Profile[], ui }`. Written debounced (300 ms) through
  Zustand `persist`; read once at start and validated with zod. Size estimate: a profile is 5–15 KB of JSON, a
  saved stack 2–5 KB; localStorage is sufficient for hundreds of items. The storage layer is an adapter with
  `load()/save()` so IndexedDB (via `idb-keyval`) can replace it without touching the store.
- Three-level model:
  - **Profile** = one game account: unlocked tiers and exclusions, mercenary inventory and caps, all bonus source
    values (permanent, captains with levels, equipment, artifacts, other, events), temple/training values, default
    housing, and the lists below.
  - **Battle setup** (inside a profile) = the choices that change per march: active captains/artifacts/hero/event/
    other pills, housing values, enemy formation, method, priority, custom kill order.
  - **Saved stack** (inside a profile) = a frozen result: input snapshot (setup + totals), output counts, summary.
  A "quick" path must exist: the app works with the implicit default setup so a casual user never has to name one.
- **Migrations**: `schemaVersion` integer; `migrations/[n].ts` functions applied in order on load, on import and
  on share-link decode; each migration has a test with a fixture from the previous version. The zod schema is the
  single source of truth for the current version. Unknown extra fields are dropped with a console warning, never
  a crash. `dataVersion` records which game tables the saved values were entered against (unit ids may be renamed
  by a data migration).
- **Export/import**: JSON files (`pyrrhic-<profile>-<date>.json`) containing `{ schemaVersion, dataVersion, kind,
  payload }`; import shows a preview (profile name, counts, date) and asks "add as new / replace / cancel".
  Never silently overwrite.

## Amendment 2026-09-12 (from investigation 0001, cross-device sync)
Every profile, battle setup and saved stack carries `id` (UUID v4), `updatedAt` (epoch ms), `rev` (integer,
incremented on each write) and `deviceId`; the root document keeps `tombstones: {id, deletedAt}[]` and a
user-editable `deviceName`. Profiles are self-contained documents (no cross-profile references) so they can be
synced and exported one at a time. A `RemoteStore` interface (`list/get/put(expectedRev)/delete`) sits beside the
local storage adapter; adapters (Gist, Google Drive appData, generic endpoint) are opt-in and implemented later.

## Consequences
- One place to reason about persistence; export = the same document; share link = the same document minus defaults.
- Migration discipline is mandatory from day one (tests per version), which is cheap now and painful later.
- localStorage is per-origin: moving the hosted URL loses data unless the user exports. Documented in the UI.
