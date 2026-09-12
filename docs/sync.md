# Sync across devices (GitHub Gist)

Stories S-44 / S-45, investigation [0001](investigations/0001-cross-device-sync.md), ADR-0002.

Pyrrhic has no server. Sync is therefore **opt-in and user-owned**: the app writes your profiles into one
*secret* gist on **your** GitHub account, and contacts nothing else. Both directions are explicit — you
press *Check the gist*, read what would happen, then press *Apply plan*. There is no background sync, no
polling and no auto-push.

## Setting it up

1. Create a token: [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new).
   - Type: **fine-grained** personal access token.
   - Repository access: **none needed** (leave "Public repositories" / select none).
   - Permissions → **Account permissions → Gists: Read and write**. That is the only one.
   - Expiration: anything you like; the app tells you when the token stops working.
2. In Pyrrhic: **Sync → Settings**, paste the token, press **Test connection**. It reports the account and
   whether a `pyrrhic-sync` gist already exists. It creates nothing.
3. **Pull / Push → Check the gist → Apply plan**. The first push creates the secret gist and fills in the
   gist id, which is then reused.
4. On the second device: paste the **same token** (and the same passphrase, if you turned encryption on).
   The app finds the existing `pyrrhic-sync` gist by itself; check, then apply to receive the profiles.

Optional: **Encrypt the gist**. AES-GCM-256 with a key derived from a passphrase (PBKDF2-SHA256, 210 000
iterations, random salt). Every device that syncs this gist must use the same passphrase. **There is no
recovery** — without the passphrase the gist cannot be read, by you or by anyone.

## What is stored, and where

In the gist (one file per profile plus an index):

| File | Content |
| --- | --- |
| `index.json` | `{ pyrrhic: 'sync', version, kdf?, body }`. `body` is `{ profiles: [{ id, rev, docRev, updatedAt, name, deviceName }], tombstones: [{ id, deletedAt }] }`, or the encrypted envelope holding it. `kdf` (salt + iteration count) is the only thing that always stays in clear. |
| `profile-<id>.json` | Exactly the JSON export document of that profile — `{ schemaVersion, dataVersion, kind: 'profile', payload }` — or its encrypted envelope. |

Encrypted bodies are `{ enc: 'aes-gcm', salt, iv, data }`, all base64.

In this browser:

| Key | Content |
| --- | --- |
| `pyrrhic.v1` | Your profiles (unchanged; sync does not live here). |
| `pyrrhic.sync.v1` | `{ settings: { adapter, token, gistId, encrypt }, records }` — the token and, per profile, the revisions seen at the last successful sync. |
| `pyrrhic.sync.passphrase` (**sessionStorage**) | The passphrase, for this tab only. Never written to disk, never sent anywhere. |

The token and the passphrase are never part of a profile, an export file, a share link or the gist.

## How conflicts are decided

Each profile carries `rev`, `updatedAt` and `deviceId`; the gist index adds its own counter (`rev`) which
is what the optimistic-concurrency check uses (`docRev` is the profile's own revision, shown in the UI).
Per profile, comparing both sides with what was recorded at the last sync:

| Local | Gist | Action |
| --- | --- | --- |
| changed | unchanged | **Send** |
| unchanged | changed | **Receive** |
| changed | changed | **Conflict** — nothing happens until you choose |
| deleted here | unchanged | **Remove from the gist** (a tombstone is left there) |
| unchanged | deleted there | **Remove here** (a local tombstone is left) |
| deleted here | changed there | **Conflict** |
| changed here | deleted there | **Conflict** |

A conflict opens a dialog showing both sides (name, date, device, number of battle setups and saved
stacks) with three answers: **keep mine** (overwrite the gist), **keep theirs** (replace what is here) or
**keep both** (yours stays, theirs is added as a new profile and is sent on the next sync). Nothing is
ever merged silently.

## Threat model

- **GitHub sees your profile JSON in clear unless you turn encryption on.** A secret gist is not listed on
  your profile and is not indexed, but anyone who learns its URL can read it, and GitHub itself can always
  read it. With encryption on, GitHub holds ciphertext plus the salt; even profile names are inside the
  encrypted body.
- **Token scope.** *Gists: Read and write* lets the token read and write **all** gists of the account,
  not only this one — that is as narrow as GitHub's API allows. It cannot touch your repositories.
- **Token storage.** The token sits in this browser's `localStorage`, like any other setting, and is sent
  only to `api.github.com` in an `Authorization` header. Anyone with access to the browser profile (or an
  XSS in a fork of the app) can read it; revoke it on GitHub if that happens. *Forget token and sync
  state* clears it here.
- **No telemetry.** ADR-0002 still holds: the app contacts `api.github.com` only while you are syncing,
  and (only for a profile larger than 1 MB, which should not happen) `gist.githubusercontent.com` to read
  the oversized file — without the token.
- **Passphrase strength** is the whole security of the encrypted mode: PBKDF2 slows an attacker down, it
  does not save a four-letter passphrase.

## Limitations

- Explicit Pull/Push only. Auto-pull on open and auto-push after save are a later story.
- The sync unit is the **whole profile**: battle setups and saved stacks inside a profile are not merged
  one by one, the profile is taken from one side or the other (or both are kept).
- Turning encryption on for a gist that already holds profiles leaves those files in clear until each one
  is sent again; the index is re-encrypted on the first write.
- Turning encryption off again needs the passphrase (to read what is there) and a fresh push of every
  profile.
- Deletions are remembered as tombstones; only the 200 most recent are kept in the gist index.
- GitHub rate limits apply per token (5 000 requests/hour for a personal token); a sync costs a handful of
  requests, so this only matters if something is looping.
- One gist per account, found by its description `pyrrhic-sync`. If you keep several, set the gist id by
  hand in Settings.
