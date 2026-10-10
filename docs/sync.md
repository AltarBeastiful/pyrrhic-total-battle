# Sync across devices (optional account)

Stories S-49 and S-49c ([plan](plans/sso-accounts.md)), [ADR-0009](decisions/0009-optional-account-sync.md), spec
[`research/pocketbase-profile-sync-spec.md`](research/pocketbase-profile-sync-spec.md), backend
runbook [`ops/pocketbase/README.md`](../ops/pocketbase/README.md).

**Pyrrhic works with no account, offline, exactly as before.** Everything is calculated and stored in
your browser. Sign in, and your profiles follow you to every device you sign in on: there is nothing to
press, ever (S-49d).

If the build you are using has no backend configured, the account rows are simply not there.

## What it does, and what it deliberately does not

- **Saves by itself.** While you are signed in, every change is saved to your account 3 seconds after you
  stop, and at once when you leave the page.
- **Live on every open screen.** When one device saves, every other device that has Pyrrhic open hears
  about it within a second and merges it in: no reload. Opening Pyrrhic, coming back to its tab, focusing
  its window, or coming back online catches up too.
- **Merges, piece by piece.** A profile edited on your phone and another edited on your PC both survive;
  so do the troops changed on one and the bonuses changed on the other in the *same* profile, and two
  marches of the same profile. Deleting a profile deletes it everywhere.
- **Nothing for anybody who is not signed in.** Signed out, the profiles on screen are this browser's
  alone, and the account button says so (a crossed-out cloud: *saved in this browser only*).
- **Nothing else leaves the browser.** ADR-0002 still holds for every other code path: no telemetry, no
  error reporting, no third-party CDN. The service worker is forbidden from caching the backend.

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

## Signing in on a browser that already has profiles

**Signing in** shows your account's profiles in place of this browser's own; nothing from this browser is
added to your account. **Creating** an account is the one time the profiles you made in that browser are
**added** to it. If the new account already has a profile with the same name, the one from this browser is
renamed in a way you can still read (`Main` becomes `Main (local)`, then `Main (local 2)`), and a short
message lists what was added and what was renamed. The untouched profile a new browser starts with is not
added.

## Signing out, and sessions that end

- **Sign out** saves what is not saved yet, then takes your account's profiles off this browser and leaves
  a fresh profile of its own. If it cannot save (offline), your last changes are kept here, put away, and
  saved the next time you sign in; a message says so.
- **A session that ends** (you have not opened Pyrrhic for 30 days, or the account was signed out
  elsewhere) does the same: your account's profiles are put away with every change you made, a message
  says why, and signing in again brings them back. Each visit renews the session.
- Offline but signed in, you stay signed in: saving waits for the connection, and the profile row says
  *Offline: saves when back online*.

## When two devices change the same thing

There is no question to answer. Changes are merged piece by piece: each profile's name, troops,
mercenaries, bonus sources and recovery settings, each march, each saved march. Only if the **same** piece
was changed on two devices within the same few seconds (or while both were offline) does the later change
win and the earlier one get lost.

## What is stored, and where

On the server, one record per account:

| Field | Content |
| --- | --- |
| `user` | The account it belongs to. Deleting the account deletes the record with it. |
| `data` | Every profile of the account, as your browsers merged them. The server never looks inside. |
| `version` | The optimistic counter. |
| `updatedBy` | An opaque device id. |

In this browser:

| Key | Content |
| --- | --- |
| `pyrrhic.v1` | Your profiles — the source of truth, with or without an account. |
| `pyrrhic.account.v1` | The session token, so you are not asked to sign in on every visit. |
| `pyrrhic.account.device.v1` | This browser's device id, the version it last saw, and which account the profiles on screen belong to. Never uploaded. |
| `pyrrhic.account.cache.v1` | Only after a session ended or an offline sign-out: the account's profiles, put away until you sign in again. |

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

- Saving offline waits; it is retried when the connection comes back, or at the next change.
- Each save uploads every profile of the account (merging happens in the browser, the server only keeps
  the latest copy).
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
