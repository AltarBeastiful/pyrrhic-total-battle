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
