# Sync across devices (optional account)

Stories S-49 and S-49c ([plan](plans/sso-accounts.md)), [ADR-0009](decisions/0009-optional-account-sync.md), spec
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

Open the menu, choose **Sign in…**, and pick a provider: **Google** or **Discord** (the buttons are the
ones the server offers, so the list can change without a new build). A small window opens on the
provider's own consent screen and closes again once you have agreed; you are back in Pyrrhic, signed in.
Pyrrhic asks Google for `openid`, `email` and `profile`, and Discord for `identify` and `email` — nothing
more. If the same address signs in through both, it is the same account.

**With an email and a password** — *switched off for now* (S-49c: the server has no mailer yet). The
code is kept; when it comes back, a *Sign in with email…* button appears under the providers, and
everything below applies.

Turn on **Create account** the first time. Passwords must be at least 10 characters. Pyrrhic then says
*Check your inbox to confirm your address*, because the server refuses to save profiles for an address
nobody has confirmed — open the link in that email, and the account is ready. Until you do, the account
menu carries a **Confirm your email address** row that sends the email again.

**If you forget the password.** *Forgot your password?* in the same dialog sends a link that opens
Pyrrhic at *Choose a new password*. The answer is the same whether or not the address has an account
— *if an account exists for this address, a reset link is on its way* — so the page never tells a
stranger who is registered. The link works once, expires in 30 minutes, and signs every device out.

*Sign out* leaves everything in this browser untouched.

## Changing or ending the account

Both live behind the row that names the account — *Signed in as you@example.com* — because the menu
is kept to four rows.

| Button | What it does |
| --- | --- |
| **Change password…** | Only while the server takes passwords. Asks for the current password and the new one twice. Every other device is signed out and will ask for the new password; this browser stays signed in. A Google or Discord account's password belongs to that provider. |
| **Delete account…** | Deletes the account and the copy of your profiles saved on it, for good. **Your profiles in this browser are not touched**, and Pyrrhic keeps working exactly as it does without an account. |

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

## The two addresses Pyrrhic answers besides its own

A link in an email opens Pyrrhic at a path rather than at the app itself (the provider sign-in comes
back to the account server, in its own window, not to the app). The
one-time token in the address is used and then removed from the address bar before the app starts, so
it cannot be copied out of a shared screen or a browser history.

| Path | What it is |
| --- | --- |
| `…/password-reset?token=…` | The *Choose a new password* page, from a reset email. |
| `…/verify-email?token=…` | Confirms the address, from a confirmation email. |

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
