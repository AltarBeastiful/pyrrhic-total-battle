# Investigation 0001 — Using the same profiles, setups and stacks across devices

Story S-19. Constraint from ADR-0002: no server operated by the project; nothing leaves the browser unless the
user explicitly sends it somewhere they control.

## What "across devices" means for our users
Typical pairs: phone at the monster (reading housing values, sending the march) and desktop where the bonuses were
entered; or two phones. Frequency: bonus values change every few days; battle setups a few times a week; a stack
result is produced per march. Data size: a profile is 5–15 KB of JSON, a full document with a few profiles and
saved stacks well under 200 KB. Latency needs: none (no live collaboration).

## Options

| # | Option | Effort | Works on | Trust / privacy | Verdict |
|---|---|---|---|---|---|
| A | **Manual transfer**: profile link + QR code, JSON export/import, Web Share API (send the file with AirDrop / Nearby Share / any app) | already planned | everything | nothing leaves the device unless sent | Baseline, ship in M1 |
| B1 | **GitHub Gist adapter**: user pastes a fine-grained personal token (gist scope only); the app stores one secret gist | small (REST + CORS work, no OAuth app) | any browser | GitHub sees the JSON (optionally encrypted client-side) | First real sync adapter |
| B2 | **Google Drive `appDataFolder` adapter**: browser-only OAuth (PKCE via Google Identity Services), hidden per-app folder | medium; needs an OAuth client registered by the project and a check that `drive.appdata` stays a non-sensitive scope (else app verification) | any browser, most gamers have a Google account | Google sees the JSON unless encrypted | Second adapter, best UX for non-developers |
| B3 | Dropbox / OneDrive adapters | medium each | same | same | Only on demand |
| B4 | **WebDAV** (Nextcloud…) | small code, but CORS blocks it from a hosted page; only works with the user's own proxy | few | user-owned | No |
| B5 | **Generic REST endpoint** (`GET/PUT /doc` + bearer token) with a reference Cloudflare Worker in `tools/` that a clan leader can deploy in one click | small in the app, small worker | anyone willing to deploy; doubles as clan-shared storage | user/clan-owned | Nice opt-in, after B1/B2 |
| C | **Device-to-device**: WebRTC data channel with QR signalling (no server) | medium, clunky multi-QR exchange, both devices online at once | modern browsers | nothing leaves the pair | No; Web Share (A) covers the phone↔desktop case with less friction |
| D | Browser-native sync (`chrome.storage.sync`, Firefox Sync) | extension only | one browser family | vendor | No |
| E | Zero-knowledge relay operated by the project (client-side encryption, random id, key in fragment) | small code, but hosting, abuse handling, cost | everything | we hold ciphertext | Ruled out by ADR-0002; revisit only if the community asks and funds it |

## Recommendation
1. **M1 (now)**: option A, done well. Profile link + QR, battle link, JSON export/import, and a "Send to another
   device" button that uses `navigator.share({ files })` where available. This alone gives a reliable one-shot
   transfer between any two devices.
2. **M4/M5**: a **sync adapter interface** with two implementations, Gist (B1) then Google Drive (B2), and the generic
   endpoint (B5) with its reference worker. All adapters are opt-in, off by default, and show what is sent where.
3. **Optional client-side encryption** of the synced blob (WebCrypto AES-GCM, key from a passphrase via PBKDF2/Argon2)
   so the storage provider only ever holds ciphertext. Off by default, one checkbox.

### Sync model (simple, explicit, no CRDT)
- The remote holds **one document per profile** (plus a small index) rather than the whole store, so two devices
  editing different profiles never conflict.
- Every profile, battle setup and saved stack carries `id` (UUID), `updatedAt` (ms since epoch), and `rev`
  (integer); deletions leave a tombstone `{ id, deletedAt }` so a delete is not undone by the other device.
- Explicit **Pull / Push** buttons first, with "last synced" per profile. Auto-pull on app open and auto-push after
  save come later behind a setting.
- Conflict = both sides changed the same profile since the last sync (`rev` mismatch). Never auto-merge silently:
  show both versions (name, updatedAt, device name, counts) and offer "keep mine", "keep theirs", "keep both".
  Battle setups and saved stacks inside a profile are merged by id (newer `updatedAt` wins, tombstones respected).
- A `deviceName` (user-editable, e.g. "Rémi's phone") is stored locally and stamped on writes for readable conflicts.

### What the plan and ADRs must change now (cheap now, expensive later)
- ADR-0004 schema: add `id`, `updatedAt`, `rev`, `deviceId` to profiles, battle setups, saved stacks; add a
  `tombstones[]` list; keep each profile self-contained (no cross-profile references).
- Storage adapter interface gets a sibling `RemoteStore` interface:
  `list() → {id, rev, updatedAt}[]`, `get(id) → Doc`, `put(id, doc, expectedRev) → rev | Conflict`, `delete(id, expectedRev)`.
- Export file format = the same per-profile document, so "export then import on the other device" and "sync" are
  the same code path.
- Nothing else in the engine or UI is affected.

### Open points to settle before implementing B2
- Confirm the current Google classification of the `drive.appdata` scope and whether an unverified app shows a
  warning screen; if verification is required, ship B1 and B5 first.
- Decide whether the Google OAuth client id lives in the repo (it is not a secret for PKCE flows) — yes, with the
  allowed origins limited to the official host, so forks register their own.
