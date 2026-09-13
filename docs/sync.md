# Sync across devices (optional account)

Story S-49, [ADR-0009](decisions/0009-optional-account-sync.md), spec
[`research/pocketbase-profile-sync-spec.md`](research/pocketbase-profile-sync-spec.md), backend
runbook [`ops/pocketbase/README.md`](../ops/pocketbase/README.md).

**Pyrrhic works with no account, offline, exactly as before.** Everything is calculated and stored in
your browser. An account adds two buttons — *Save to account* and *Load from account* — and nothing
else. Nothing is sent anywhere unless you press one of them.

If the build you are using has no backend configured, the account rows are simply not there.

## What it does, and what it deliberately does not

- One **copy** of everything (every profile, every march setup, every saved march), stored as one
  opaque blob on the server. It is overwritten whole on every save.
- **No background sync.** No auto-push after an edit, no auto-pull on start, no polling, no realtime.
- **No merging.** Two devices that both changed something are a question you answer, not a guess the
  app makes.
- **Nothing else leaves the browser.** ADR-0002 still holds for every other code path: no telemetry,
  no error reporting, no third-party CDN. The service worker is forbidden from caching the backend.

## Signing in

**With Google.** One press, Google's own consent screen, back to Pyrrhic. The app asks for `openid`,
`email` and `profile` and nothing more. The redirect comes back to the app's own address
(`…/oauth-callback`), never to the backend, so the backend's hostname appears nowhere in Google's
configuration.

**With an email and a password.** Open *Sign in with email…*, turn on **Create account** the first
time. Passwords must be at least 8 characters. A verification email is sent if the instance has a
mailer; the account works either way.

*Sign out* leaves everything in this browser untouched.

## Saving and loading

| Row | What it does |
| --- | --- |
| **Save to account** | Uploads everything in this browser, overwriting the account's copy. Offered only when there is something new to save; it says *Saved* when it has. |
| **Load from account** | Replaces everything in this browser with the account's copy. Asks first whenever this browser has unsaved changes. |

The first time you sign in on a new device, the account's copy is fetched and you are **asked**
before it is applied — signing in never overwrites what is on screen.

## When two devices disagree

Every save carries a version number, one higher than the version this browser last saw. If another
device has saved in between, the server refuses with a conflict and Pyrrhic asks:

- **Load the other device's copy** — what you changed here since the last save is discarded.
- **Overwrite with this device** — what the other device saved is replaced by what is here.

Both lose something, which is why the dialog says so and offers **Export JSON first**. There is no
third answer: merging two armies field by field would be a guess.

## What is stored, and where

On the server, one record per account:

| Field | Content |
| --- | --- |
| `user` | The account it belongs to. Deleting the account deletes the record with it. |
| `data` | The whole root document, as your browser wrote it. The server never looks inside. |
| `version` | The optimistic counter. |
| `updatedBy` | An opaque device id, used only to word the conflict message. |

In this browser:

| Key | Content |
| --- | --- |
| `pyrrhic.v1` | Your profiles — the source of truth, with or without an account. |
| `pyrrhic.account.v1` | The session token, so you are not asked to sign in on every visit. |
| `pyrrhic.account.device.v1` | This browser's device id and the version it last saw. Never uploaded. |
| `pyrrhic.account.pkce` (**sessionStorage**) | The one-time sign-in verifier, for the length of the Google redirect only. |

## Limitations

- Saving offline fails and the Save button stays enabled. There is no queue and no replay.
- The unit is the **whole document**: profiles cannot be sent one at a time.
- An account cannot be shared with another player. Share links are for that, and they carry a march,
  not an account.
- Browsers evict storage. `navigator.storage.persist()` is requested on first load, and on iOS the
  app should be installed to the home screen; the account is what makes an eviction recoverable.

## Retired: GitHub Gist sync (S-45)

The previous sync wrote your profiles into a secret gist on your own GitHub account, using a
fine-grained token you created and pasted into every device, with optional passphrase encryption.
It was removed in ADR-0009 along with its Pull/Push dialog, its conflict planner and its crypto
layer: a one-permission token, a scope decision and a plan table are a system administrator's chore,
not a player's, and two sync systems would double the conflict surface.

If you have a `pyrrhic-sync` gist from that era, its files are plain JSON export documents — import
them one by one with **Import JSON** — and the token can be revoked on GitHub. The keys
`pyrrhic.sync.v1` and `pyrrhic.sync.passphrase` are no longer read by anything and can be deleted.
