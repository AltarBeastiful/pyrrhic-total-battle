# Accounts by SSO: Google and Discord on the existing PocketBase (S-49c)

**Status: proposed 2026-10-07, assumptions checked against a local PocketBase 0.40.4 the same day (§4).**
Completes M8 (S-49). Owner, 2026-10-07: *"add accounts using sso with the leanest code possible (reuse existing
tool/libraries, simplifying if need be) … we can reuse our server main."*

Owner's decisions (2026-10-07):

| Question | Answer |
| --- | --- |
| Email/password | **Kept in the code, switched off.** No SMTP for now (Gmail app password when it comes back). |
| Providers | **Google and Discord.** |
| OAuth flow | **The SDK's own popup** (`authWithOAuth2({ provider })`) instead of our hand-written PKCE redirect. |
| Hosting | **App stays on GitHub Pages**, backend stays on main (`pyrrhic-pocketbase` behind philou's Caddy). |
| Backend name | **Dynu now** (`pyrrhic-backend.freeddns.org`), before any OAuth client is registered. |
| Backups | **On the server**: keep the latest backup, plus a deduplicated history that uses as little disk as possible. |
| OAuth consoles | **Claude fills them in, in the owner's Chrome**, one approval per step. |

## 1. Where M8 stands (2026-10-07)

- Backend live on main since 2026-09-13 at `pyrrhic-backend.92.5.91.253.sslip.io`; `/api/health` answers.
  `auth-methods` today: **password on, oauth2 off, no provider**, so nobody can sign in with Google yet.
- Client built (S-49b): Google via our own PKCE redirect to `…/oauth-callback`, email/password with confirm,
  reset, change and delete; save, load and conflict handling; NetworkOnly service-worker rule; `storage.persist()`.
- Not done yet: the OAuth client, SMTP, backups, the Dynu name, and moving ADR-0009 to Accepted.

## 2. What changes, and what is deleted

### 2.1 Client

1. **Sign-in = one button per provider the server lists.** When the sign-in dialog opens, it calls
   `listAuthMethods()` once (that is a user action, so ADR-0009 constraint 1 still holds), then draws one button
   per `oauth2.providers[]` entry, plus the existing *Sign in with email…* row **only if `password.enabled`**.
   The client has no list of providers and no feature flag: switching passwords back on later is one toggle on
   the server.
2. **Popup flow.** On the button's click, `pb.collection('users').authWithOAuth2({ provider, urlCallback })`.
   The window is opened **synchronously in the click handler** and `urlCallback` only sets its `location`:
   Safari blocks a popup opened after an `await` (the SDK's own note on `authWithOAuth2`). The SDK uses
   realtime (SSE) to receive the result, so the backend origin must stay NetworkOnly in the service worker, as
   it already is.
3. **Deleted:** `startGoogleSignIn` / `completeGoogleSignIn` / `readPkce`, `PKCE_SESSION_KEY`,
   `OAUTH_CALLBACK_FILE`, `oauthRedirectUrl`, `isOAuthCallback`, the `/oauth-callback` page and its tests.
   **Kept:** the `404.html` copy, which `/password-reset` and `/verify-email` still need while the password
   code is kept.
4. **Kept, but nothing reaches it:** all of the password code. The UI hides it because the server says it is
   off; its unit and e2e tests keep running against a local container that switches it on (§2.2).
5. Copy: *Sign in with Google*, *Sign in with Discord*. `docs/sync.md` is rewritten to match: the "Signing in"
   section, the PKCE storage key goes away, and the three addresses become two.

### 2.2 Server (`ops/pocketbase/`)

1. **Rename to `pyrrhic-backend.freeddns.org`** in `caddy/pyrrhic.caddy`, `PYRRHIC_APP_URL`/`--origins` stay the
   Pages origin, the *Application URL* setting, `smoke.sh`'s default `PB_URL`, and the GitHub variable
   `VITE_BACKEND_ORIGIN`. The sslip.io name stays in the site file for one release so that tokens already
   stored in browsers keep working, then it is removed.
2. **New migration `…_sso.js`** (no secrets in it):
   - `users.passwordAuth.enabled = false`, unless `PYRRHIC_PASSWORD_AUTH=on` (set only in
     `docker-compose.local.yml`, for e2e).
   - `users.oauth2.enabled = true`. The provider rows are created empty if missing; their **client id and
     secret are entered in the admin UI**, so they live only in `pb_data`, as today.
   - `settings.backups.cron = "0 3 * * *"`, `cronMaxKeep = 1` (the "latest" copy, made by PocketBase's own
     consistent snapshot; the image has no `sqlite3`).
3. **`pb_hooks/main.pb.js`: unchanged.** Accounts created through OAuth are marked verified when the provider
   confirms the email, so the `email_not_verified` gate never fires for them and stays in place for passwords.
4. **`smoke.sh`**: the write-path checks no longer sign in with a password. The script creates a throwaway
   user as superuser and gets a token from `POST /api/collections/users/impersonate/{id}`. A new check confirms
   `auth-methods` lists `google` and `discord` with `password.enabled = false`.
5. **`backup-history.sh` + one crontab line on main** (03:30, after PocketBase's 03:00 backup):
   - `docker cp` the newest `pb_backup_*.zip` out of the container to `/home/ubuntu/pyrrhic-backups/`;
   - **dedupe**: hash `data.db` inside the zip (each zip differs only by its timestamps). If the hash equals
     the last stored one, keep nothing, so days without any save cost 0 bytes;
   - **retention**: 7 daily, then one per ISO week for 8 weeks, then one per month for 12 months: at most ~27
     files of a few hundred kB;
   - restore = the existing step 10 of the README (`POST /api/backups/{key}/restore` after an upload, or unzip
     over the volume with the stack stopped).
   Known limit, accepted: everything lives on main's own disk. Losing the VPS loses the backups. An off-host
   copy (rclone to any bucket) is one line to add later.

### 2.3 OAuth clients (filled in from the owner's Chrome)

| | Google Cloud console | Discord developer portal |
| --- | --- | --- |
| App | project `pyrrhic`, OAuth client *Web application* | application `Pyrrhic`, OAuth2 |
| Redirect URI | `https://pyrrhic-backend.freeddns.org/api/oauth2-redirect` | same |
| Scopes | `openid email profile` (non-sensitive: no Google review) | `identify email` (PocketBase's defaults) |
| Domains | authorized domains: `pyrrhic-backend.freeddns.org` (`freeddns.org` is a Dynu domain on the Public Suffix List, so this name counts as its own domain), `altarbeastiful.github.io` for the home page | — |
| Publishing | consent screen *External*, **In production** (in *Testing*, only listed test users can sign in) | public, no bot |

The client id and secret are pasted into PocketBase's admin UI (*Collections → users → Options → OAuth2*).
Opening `/_/` needs the owner's IP in `pyrrhic.caddy` for the length of the session, as the README describes.

### 2.4 Docs

- **ADR-0009 amendment.** One sentence of it stops being true: "the redirect never names the backend
  host". With the popup, Google and Discord know the backend's name, so moving the backend means editing two
  redirect URIs. That is the cost of deleting the PKCE code, and the Dynu name exists to keep it rare. Status
  changes to **Accepted**.
- `ops/pocketbase/README.md` steps 8–10 rewritten (two providers, the migration, the backup script); the
  "owner decisions still open" list shrinks to SMTP.
- `docs/PLAN.md` M8: S-49a done once the steps in §3 pass; S-49c added.

## 3. Order of work and gates

| # | Step | Gate |
| --- | --- | --- |
| 1 | Dynu record → 92.5.91.253; Caddy site with both names; reload | `curl https://pyrrhic-backend.freeddns.org/api/health` = 200 with a valid certificate |
| 2 | Migration `…_sso.js` + `smoke.sh` on impersonation, local first | local: smoke all green, `auth-methods` = google+discord, password off; with `PYRRHIC_PASSWORD_AUTH=on` the existing password e2e is still green |
| 3 | Client: provider buttons, popup, PKCE code deleted | unit + e2e green (`pnpm build` first: Playwright serves a stale dist otherwise). A new e2e mocks `auth-methods` and checks that the buttons follow the server's list and that the email row disappears when password is off |
| 4 | Google + Discord apps in Chrome; secrets into the admin UI | `auth-methods` on prod lists both providers |
| 5 | Deploy migration and hooks to main; `VITE_BACKEND_ORIGIN` → Dynu; Pages rebuild | prod smoke green; **manual sign-in, save, load on desktop Chrome, desktop Firefox, the owner's phone** (popup + SSE on mobile is the one part not provable locally) |
| 6 | `backup-history.sh` + crontab on main | run it by hand twice: the first stores a file, the second (no change) stores nothing; one restore into a throwaway local container works |
| 7 | Docs (§2.4), sslip.io name dropped one release later | — |

Fallback if step 5 fails on the phone: the deleted PKCE redirect flow is restored from git (`46fd188`) for that
provider path only. That is why step 3 deletes code but step 5 is what proves the deletion was safe.

## 4. Checked on 2026-10-07 (local `ghcr.io/muchobien/pocketbase:0.40.4`, throwaway volume)

- `PATCH /api/collections/users` with `passwordAuth.enabled=false` and providers `google` + `discord` →
  accepted. `auth-methods` → `password.enabled=false`, both providers with authURLs at accounts.google.com and
  discord.com.
- With passwords off, `auth-with-password` → **403** "The collection is not configured to allow password
  authentication."
- `PATCH /api/settings` `backups: { cron: "0 3 * * *", cronMaxKeep: 1 }` → accepted. `POST /api/backups` → 204,
  a 227 kB zip in `/pb_data/backups` (an empty database).
- Superuser `POST /api/collections/users/impersonate/{id}` → a user token, and `POST /api/app/profile` with it
  → 200 `{version: 1}`. So `smoke.sh` does not need passwords.
- `GET /api/oauth2-redirect` exists (307).
- SDK 0.28.1 `authWithOAuth2` documents the Safari popup caveat and the custom `urlCallback`.
- Not checked: whether the production server holds any password accounts today. Switching passwords off locks
  those accounts out of their saved copy (their local data is untouched). See the open questions.

## 5. Answers to the open questions (owner, 2026-10-07)

- Password accounts on the live server are **test accounts only**: they are deleted during step 5.
- Dynu record **created by the owner**: `pyrrhic-backend.freeddns.org` → 92.5.91.253 (resolves).
- Phone test in step 5: **iPhone Safari and Android Chrome**.
- Implementation starts at once, in the order of §3, stopping at every gate and before every production or
  Chrome step.

## 6. S-49d — sign in and forget it: autosave, per-profile merge, profiles that belong to the account

Owner, 2026-10-07, after the first Google sign-in worked: *"I would prefer it saves automatically … just
login and forget about it, then take back the work on any of my devices"*; *"let me create things and when I
log in, warn me if there's already a profile with the same name and generate unique names that are still
readable"*; *"avoid users opening a previously saved profile in their account unidentified"* (a session that
expires must not leave the account's profiles on screen, editable, as if they were local).

This reverses ADR-0009 constraint 1 ("only on an explicit press") for a signed-in player; the app is unchanged
for everyone else.

**Ownership.** Signed in, every profile on screen belongs to the account. Signed out, every profile on screen
belongs to this browser alone. The device state remembers which account the document on screen belongs to
(`owner`), so a session that is gone, whether it expired or was cleared, is noticed at start-up even offline.

**Sync = merge, never replace.** `src/account/merge.ts` is pure: profiles are united by id, the newer
`updatedAt` wins (then `rev`), marches (setups) and saved marches are merged the same way inside a profile, and
tombstones (already in the document) remove what was deleted anywhere. Device-local fields (`deviceId`,
`deviceName`, `activeProfileId`, `ui`) stay this browser's.

- **Autosave:** 3 s after the last edit, and at once when the page is hidden (`fetch` with `keepalive`).
  The push carries the version this device last saw; on a 409, pull, merge, push again (at most 3 times).
- **Auto-load:** on start, on sign-in, when the tab becomes visible, and when the connection comes back:
  pull, merge, and push back if the merge added something the server did not have.
- **The one lossy case:** the same profile field edited on two devices between two syncs (both offline,
  typically). The newer edit wins at profile granularity, or at march granularity for march fields. No
  dialog: the owner accepted it as the price of "never click".
- **Removed:** the *Save to account* and *Load from account* rows, the Load and Conflict dialogs.

**Signing in.** Amended 2026-10-10 (owner, `todos.md`; playbook Critical 01): a sign-in **replaces** the
on-screen profiles with the account's, silently: nothing of this browser's own is copied into the account,
no dialog opens, and an account with no profiles gets a fresh one. Only **creating** the account (email
sign-up, or an OAuth sign-in whose answer says `meta.isNew`) copies the profiles this browser made while
signed out (touched ones only: an untouched default profile is dropped). A name the account already uses gets
the readable suffix the import already uses: `Main (local)`, then `Main (local 2)`, and a dialog lists what
was added and what was renamed.

**Leaving.** *Sign out* saves first, then removes the account's profiles from this browser and leaves a fresh
local profile. If the save fails (offline), they are kept in a local cache and the dialog says so. **Expiry**
(the server rejects the token): the account's profiles move to that cache (`pyrrhic.account.cache.v1`), unsaved
edits included, the screen shows a fresh local profile, a dialog says why, and signing in again brings them
back and saves them. Sessions last **30 days** (migration; PocketBase's default is 5) and are renewed at every
start, so an active player never sees an expiry.

**Showing it.** Signed out, the account button carries a *This browser only* marker and the profile row says
*Saved in this browser only*. Signed in: *Saved to your account*, *Saving…*, or *Offline: will save when
back online*.

**Account deletion** keeps this browser's profiles, now as local ones (as ADR-0009 promised).

**Gates:** merge unit tests (disjoint edits on two devices both survive; deletions win; renames on sign-in;
untouched default dropped); state tests with the fake client (autosave debounce, 409 retry, expiry to cache and
back); e2e against the local container with two browser contexts: edit on A, open B, see it; edit different
profiles on A and B, both survive; sign out hides; then the owner's phone test.

## 7. S-49e — two open screens in step, and a finer merge (2026-10-07)

Owner: *"when I have both devices opened on my account, what will happen if I make a change … what if I do a
change on the other device in the meantime?"* — S-49d answered only on focus/visibility, and merged a profile's
own settings as one block (troops edited on A lost to bonuses edited on B). Both fixed:

- **Realtime.** While signed in, the app subscribes to the account's `profiles` record (the SDK's realtime,
  already used by the OAuth popup; the list rule limits events to the owner). An event at a version ahead of
  the device's is pulled and merged at once; the device's own save echoes at a version it has, and is ignored.
  Window `focus` also pulls (two windows side by side are both "visible"). Realtime through philou's Caddy
  checked on main (`PB_CONNECT` arrives at once, with or without gzip).
- **Per-section merge.** `Profile.sectionUpdatedAt` (optional, so no schema version bump) records when each of
  `name`, `troops`, `mercenaries`, `sources`, `recovery`, `activeSetupId` was last edited; the store stamps the
  sections an edit changes. The merge takes each section from the copy that edited it last; an unstamped
  section counts as never edited, so an edit beats a leftover. Marches and saved marches stay record by record.
- The remaining loss: the same section of the same profile changed on two devices within the debounce (3 s)
  plus one round trip, or while both are offline.

