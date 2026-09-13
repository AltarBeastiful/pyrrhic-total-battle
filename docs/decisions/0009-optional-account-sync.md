# ADR-0009 — Optional signed-in account sync (self-hosted PocketBase)

Status: Proposed (2026-09-13)

Supersedes the sync half of ADR-0002 only. Everything else in ADR-0002 still holds.

## Context

ADR-0002 fixed a hard property: *no server we operate*. Cross-device use was pushed to a
user-supplied remote (investigation 0001), and the Gist adapter (S-45) was the result: the player
creates a GitHub token, pastes it into the app, and the app writes their profiles into a secret gist
on their own account.

It did not work as a feature. Creating a fine-grained token with exactly one permission, pasting it
into two browsers, and then reading a Pull/Push plan table is a system administrator's chore, not a
player's. The token is as wide as GitHub's API allows (*all* gists of the account), it sits in
`localStorage` on every device, and the whole profile is visible to GitHub in clear unless the player
also invents and remembers a passphrase that has no recovery path. Nobody used it, including the
owner.

Meanwhile the owner already runs a VPS with a Caddy in front of it (investigation 0010), so "a server
we operate" costs one container and no money. Investigation 0012 pinned and verified the whole
backend contract against PocketBase 0.40.4; S-49a built it (`ops/pocketbase/`).

The question this record answers: does a *backend* belong in Pyrrhic at all, and if so under which
constraints.

## Options considered

1. **Keep the app strictly client-only.** No sync at all beyond a JSON file and a share link.
   Honest, but cross-device use stays a manual export/import chore forever, and Safari evicts
   IndexedDB/localStorage after seven days of no interaction for a site that is not installed — so
   "no sync" is not only inconvenient, it can lose an account.
2. **Keep the user-supplied remote** (Gist, Drive, WebDAV, a generic endpoint). The property is
   preserved on paper, but every one of them charges the player a token, a scope decision and a
   storage-provider account before the feature does anything.
3. **One opt-in account against a backend we host**, storing a single opaque blob per user, with
   Google (or email/password) as the sign-in. The app keeps working, fully, with no account.

## Decision

Option 3, under five constraints that are the point of this record:

1. **Offline and anonymous stays the default and the whole product.** Every calculation, every
   profile, every saved march works with no network and no account, exactly as before. The account
   adds a Save button and a Load button; it never becomes the source of truth. Nothing is pushed or
   pulled in the background, on start-up, or on a timer — only on an explicit press (spec §8).
2. **The account is opt-in and reversible.** Signing out leaves the local document untouched. The
   server copy can be deleted by its owner (`deleteRule` on the collection), and so can the whole
   account, from the account menu: deleting the `users` record cascades to the `profiles` row, and
   the browser keeps every profile it had. Refusing to sign in costs nothing and hides nothing.
3. **The server stores one opaque blob per user and nothing else.** The `profiles` collection holds
   `{ user, data, version, updatedBy }`: the whole root document as the client wrote it, an
   optimistic version counter, and an opaque device id used only to word a conflict message. The
   server never parses, validates or migrates the blob — the client owns the schema (spec §8). There
   is no analytics, no logging of contents, no second collection.
4. **Nothing else leaves the browser.** ADR-0002's rule is unchanged for every other code path: no
   telemetry, no error reporting, no third-party CDN, no remote game data. The one origin the app
   may contact at run time is the backend, and only while a signed-in user is saving or loading. The
   service worker is forbidden from caching that origin (spec §5.6), so a stale cached profile can
   never masquerade as the server's.
5. **The backend origin is a build-time constant, and an empty one removes the feature.**
   `VITE_BACKEND_ORIGIN` is read at build time; when it is empty the account rows are not rendered,
   no client is constructed and the SDK chunk is never fetched. A fork that sets nothing gets exactly
   the app ADR-0002 describes, with no dead UI to explain.

An email address is **confirmed before the account may save**. The check lives in the hook
(`auth.verified()` → `403 {"data":{"reason":"email_not_verified"}}`), not in the collection's
`authRule`: refusing the sign-in itself would leave the app with no session from which to explain the
refusal or offer to send the email again. The two links those emails carry are answered by the app at
`…/password-reset` and `…/verify-email`, the way `…/oauth-callback` already is, and PocketBase's mail
templates are rewritten by a migration to point there rather than at its own dashboard.

Concurrency is a single optimistic `version`, checked server-side by an explicit
`POST /api/app/profile` hook that answers a deterministic **409** (investigation 0012). There is no
merge, no CRDT and no field-level resolution: on 409 the player is shown the two lossy choices in
plain words and offered a JSON export before either (spec §5.5). Deliberately out of scope, so that
nobody adds them by reflex: background sync, an outbox, realtime subscriptions, sharing between
accounts, server-side validation of the blob.

Consequence for S-45: the Gist adapter, its sync engine, its encryption layer and its Pull/Push
dialog are **removed**, not kept alongside. Two sync systems would double the conflict surface for a
feature that one person uses. Share links stay: they carry a march, not an account (ADR-0005).

## Consequences

- The "zero operating cost, no privacy policy needed" line of ADR-0002 no longer holds in full. A
  hosted instance holds player data and needs one sentence saying what it keeps and how to delete it.
  Cost is one container on a VPS that already exists.
- The project now has an operational dependency it can fail at: an unreachable backend, an expired
  OAuth client, a lost volume. All of them degrade to "the Save button reports an error", never to a
  broken app — which is the reason for constraint 1.
- A Google OAuth client id and a verified `<user>.github.io` in Search Console become release
  prerequisites for the hosted build. The redirect never names the backend host (spec §2.1), so the
  backend can move without touching Google.
- The OAuth callback must be a real path (`…/oauth-callback`), because Google forbids a fragment in a
  redirect URI (investigation 0012, deviation 9). On GitHub Pages that needs a build-time copy of
  `index.html` to `404.html`; it is the first thing in this project that depends on a host behaviour
  rather than on static files alone.
- The hosted instance needs an SMTP account (`ops/pocketbase/README.md` step 9a). Without one no
  address can be confirmed, so no account can save — and PocketBase answers `204` to a reset request
  whether or not the mail left, on purpose, so a broken mailer is invisible from the app. That is the
  price of not telling a stranger which addresses are registered.
- `navigator.storage.persist()` is now requested on first load. It is the counterpart to constraint 1:
  the local document stays the source of truth, so it had better survive.
- The stored blob is the whole root document, so a schema migration that the client can read is also
  what a second device receives. `src/state/migrations.ts` runs on a pulled blob exactly as it runs on
  a document read from `localStorage`.
