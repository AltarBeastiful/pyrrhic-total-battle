# Pyrrhic profile-sync backend (S-49a)

**Live since 2026-09-13** at `https://pyrrhic-backend.92.5.91.253.sslip.io` (Let's Encrypt certificate; a Dynu
name can replace it later by editing `/home/ubuntu/caddy-sites/pyrrhic.caddy`, the `--origins`/`PYRRHIC_APP_URL`
values in `/home/ubuntu/pyrrhic/docker-compose.yml`, and the mail templates in the admin UI). Server paths:
`/home/ubuntu/pyrrhic/` (compose, hooks, migrations, `smoke.sh`, and `.superuser` — mode 600, the generated
superuser credentials; rotate them from the admin UI), `/home/ubuntu/caddy-sites/pyrrhic.caddy` (imported by
philou's Caddy from `/etc/caddy-sites/*.caddy`; philou commits 840a6e9 and 934dd24). Admin UI at `/_/` is
denied by default: put your public IP in the `not remote_ip` matcher of the site file and
`docker exec philou-web caddy reload --config /etc/caddy/Caddyfile`. Still to do in the admin UI: Google
OAuth client (owner), SMTP (owner), backup target.

Self-hosted PocketBase behind philou's Caddy on the "main" server, for the signed-in
account sync in `docs/PLAN.md` § M8.

- Spec: `docs/research/pocketbase-profile-sync-spec.md`
- Hosting design: `docs/investigations/0010-hosting-pocketbase-beside-philou.md`
- Every `[verify]` item, answered against the pinned version:
  `docs/investigations/0012-pocketbase-verification.md`

## Pinned versions

| Thing          | Version                                   | Why                                                                            |
| -------------- | ----------------------------------------- | ------------------------------------------------------------------------------ |
| PocketBase     | **v0.40.4** (2026-09-12)                  | latest stable release                                                          |
| Docker image   | **`ghcr.io/muchobien/pocketbase:0.40.4`** | the tag exists and its `org.opencontainers.image.version` label reads `0.40.4` |
| JS SDK (S-49b) | **`pocketbase@0.28.1`** (2026-09-05)      | latest; `>=0.22` is required for PocketBase `>=0.23`                           |
| Caddy          | **2.11.4**                                | already running on the host as `philou-web` (`caddy:2-alpine`)                 |

`ghcr.io/muchobien/pocketbase` is a thin wrapper: `alpine:3.24.1` + the official
`pocketbase` binary + an entrypoint script. No `sqlite3` binary is included.

Everything below was exercised against a throwaway `0.40.4` container locally; the
hook, the migrations and `smoke.sh` all pass there (14/14 with a token, 9/9 without).

## What is in this directory

```
docker-compose.yml            pocketbase only; no ports; joins philou's deploy_default
docker-compose.local.yml      dev/e2e override: publishes 8090, widens --origins. Never deployed.
caddy/pyrrhic.caddy           site block for philou's sites-enabled directory
pb_hooks/main.pb.js           POST /api/app/profile — the only write path
pb_migrations/1789300800_profiles.js   the `profiles` collection, fields, index, rules
pb_migrations/1789315200_account_hardening.js   password minimum, mail templates, rate limits
smoke.sh                      curl-based acceptance checks (spec §7) + the account checks
```

No secrets are committed. The Google client secret lives only in PocketBase's
settings (inside `pb_data`), and tokens only in the operator's shell.

## Owner decisions still open

1. The exact Dynu hostname. Everything here says **`pyrrhic-backend.dynu.net`**; if you
   pick a different Dynu domain, change it in `caddy/pyrrhic.caddy` and in `smoke.sh`'s
   default `PB_URL`.
2. Approval of the two-line philou change (step 2).
3. Whether the admin UI stays IP-restricted (`caddy/pyrrhic.caddy` denies `/_/*` to
   everyone by default; you open it to your IP while administering).
4. Backup target: PocketBase's built-in S3 backups (Backblaze B2 / Scaleway) or a
   nightly pull to your machine (step 10 has both).
5. Whether email/password sign-in stays enabled on the `users` collection. It is on by
   default and is useful for `smoke.sh`; disable it later if you want Google only.
6. **The SMTP account** (step 9a). Without one, PocketBase still answers every request
   normally — it simply never sends a confirmation or a reset email, and nobody can
   confirm an address, which means nobody can save. This is the one setting the app
   genuinely needs from you.
7. Whether to go further and refuse _sign-in itself_ to unconfirmed accounts
   (step 9c). Off by default, on purpose.

## Deployment

Everything runs as `ubuntu` on `main` (92.5.91.253). Nothing here needs `root`.

### 1. DNS

In the Dynu dashboard, create `pyrrhic-backend.dynu.net` as an **A record → 92.5.91.253**.
Wait for it to resolve before step 5, or Caddy will fail the ACME challenge and retry
with backoff.

```bash
dig +short pyrrhic-backend.dynu.net      # must print 92.5.91.253
```

### 2. The two-line philou change

In philou's repo (`/home/ubuntu/philou/deploy/`):

`docker-compose.yml`, on the `philou-web` service, add one volume:

```yaml
- ../../caddy-sites:/etc/caddy/sites-enabled:ro
```

`caddy/Caddyfile`, at the top level (outside every site block), add one line:

```
import /etc/caddy/sites-enabled/*.caddy
```

Then `mkdir -p /home/ubuntu/caddy-sites` (the bind source must exist, or Docker creates
it as root) and `docker compose up -d` in philou's deploy directory.

Commit message suggestion for philou:
`caddy: import sites-enabled/*.caddy so other services on this host can add sites`.

### 3. Place the files

From a checkout of this repo on your machine:

```bash
ssh main 'mkdir -p /home/ubuntu/pyrrhic /home/ubuntu/caddy-sites'
scp ops/pocketbase/docker-compose.yml            main:/home/ubuntu/pyrrhic/
scp -r ops/pocketbase/pb_hooks                   main:/home/ubuntu/pyrrhic/
scp -r ops/pocketbase/pb_migrations              main:/home/ubuntu/pyrrhic/
scp ops/pocketbase/smoke.sh                      main:/home/ubuntu/pyrrhic/
scp ops/pocketbase/caddy/pyrrhic.caddy           main:/home/ubuntu/caddy-sites/
```

Resulting layout:

```
/home/ubuntu/pyrrhic/docker-compose.yml
/home/ubuntu/pyrrhic/pb_hooks/main.pb.js
/home/ubuntu/pyrrhic/pb_migrations/1789300800_profiles.js
/home/ubuntu/pyrrhic/pb_migrations/1789315200_account_hardening.js
/home/ubuntu/caddy-sites/pyrrhic.caddy
```

`pb_data` is a **named Docker volume** (`pyrrhic_pb_data`), not a bind mount — the
compose file sets `name: pyrrhic` so that name is stable wherever you run it from.

### 4. Start PocketBase

```bash
cd /home/ubuntu/pyrrhic
docker compose up -d
docker compose logs -f --tail=50 pocketbase      # ctrl-C when you see "Server started"
```

The migrations in `pb_migrations/` run automatically on first boot: the first creates
the `profiles` collection, the second hardens the `users` collection and the rate
limiter (step 9b). Confirm from the host:

```bash
docker run --rm --network deploy_default curlimages/curl:latest \
  -s http://pocketbase:8090/api/health
# {"message":"API is healthy.","code":200,"data":{}}
```

There is deliberately **no `ports:` mapping**. 8090 exists only on `deploy_default`.

### 5. Publish the site through philou's Caddy

```bash
docker exec philou-web caddy reload --config /etc/caddy/Caddyfile
curl -s https://pyrrhic-backend.dynu.net/api/health
```

The first request may take a few seconds while Caddy obtains the certificate.
`dynu.net` is on the Public Suffix List, so the Let's Encrypt rate limits are counted
per `pyrrhic-backend.dynu.net`, not shared with strangers as they are on sslip.io.

### 6. Create the superuser

```bash
cd /home/ubuntu/pyrrhic
docker compose exec pocketbase /usr/local/bin/pocketbase superuser create \
  you@example.com 'a-long-password' --dir=/pb_data
```

`superuser create` is correct for v0.40.4 (it was `admin create` before v0.23).
**`--dir=/pb_data` is not optional**: the binary's default data directory is
`/usr/local/bin/pb_data`, so without it you would create a superuser in an empty
throwaway database. `superuser upsert` is the idempotent variant.

(The image also supports `PB_ADMIN_EMAIL` / `PB_ADMIN_PASSWORD`, but only when its
entrypoint builds the `serve` command itself. Our compose file passes an explicit
`serve …` command, so those variables are inert — and a password in compose is worse
than one typed once anyway.)

### 7. Open the admin UI, briefly

`caddy/pyrrhic.caddy` answers `403` to `/_/*` for everyone. To administer:

```bash
curl -4 ifconfig.me                                   # your current public IP
ssh main
sed -i 's/203\.0\.113\.1/<your.ip.here>/' /home/ubuntu/caddy-sites/pyrrhic.caddy
docker exec philou-web caddy reload --config /etc/caddy/Caddyfile
```

Then open `https://pyrrhic-backend.dynu.net/_/` and sign in as the superuser.
**Put `203.0.113.1` back and reload again when you are done** (203.0.113.0/24 is
TEST-NET-3 and belongs to nobody, so the matcher denies everyone).

### 8. Google OAuth

Google only ever sees the **GitHub Pages** origin — the backend hostname appears
nowhere in the Google console (spec §2.1), so you can rename the backend later
without touching the OAuth client.

In the Google Cloud console:

1. New project → **OAuth client ID**, type _Web application_.
2. Authorized JavaScript origins: `https://altarbeastiful.github.io`
3. Authorized redirect URIs: `https://altarbeastiful.github.io/pyrrhic-total-battle/oauth-callback`
   — byte-identical to the client's `redirectUrl`, **no trailing slash**.
   The spec's alternative hash route (`#/oauth-callback`) is **not usable with Google**:
   "Redirect URIs cannot contain the fragment component"
   (<https://developers.google.com/identity/protocols/oauth2/web-server>). S-49b must
   therefore copy `index.html` to `404.html` at build time and let the router resolve
   the path client-side — GitHub Pages serves `/pyrrhic-total-battle/404.html` for that
   URL. Keep the URI without a trailing slash so Vite's relative asset paths
   (`base: './'`) still resolve against `/pyrrhic-total-battle/`.
4. Consent screen: External; scopes `openid`, `email`, `profile` only (non-sensitive,
   so no Google verification review).
5. Verify `altarbeastiful.github.io` in Search Console (HTML-file upload into the repo)
   and add it to the authorized domains.

In the PocketBase admin UI: **Collections → `users` → gear → Options → OAuth2 →
enable → Google**, paste the client ID and client secret, save.

Check it from a browser (no auth needed):

```bash
curl -s https://pyrrhic-backend.dynu.net/api/collections/users/auth-methods \
  | jq '.oauth2.providers[] | {name, displayName}'
```

### 9. Other PocketBase settings

Still in the admin UI, **Settings → Application**:

- _Application URL_: `https://pyrrhic-backend.dynu.net`
- _Application name_: `Pyrrhic` — it is the `{APP_NAME}` in every email subject and body.
- _Proxy_ → tick "use a proxy header" and set it to **`X-Forwarded-For`**. Caddy sets
  that header; without this, every request looks like it comes from the Caddy
  container and the built-in rate limiter sees one client — **and the rate limits in
  step 9b would then throttle every player at once.**

#### 9a. Mail (SMTP) — owner inputs

The account cannot work without this: an address nobody confirms can never save
(`pb_hooks/main.pb.js` answers 403), and a forgotten password can never be reset.
PocketBase holds the password, so it cannot come from a file in this repo.

**Settings → Mail settings → Use SMTP mail server**, then five fields:

| Field              | What to put in it                                                  |
| ------------------ | ------------------------------------------------------------------ |
| _SMTP server host_ | e.g. `smtp.eu.mailgun.org`, `smtp.resend.com`, `ssl0.ovh.net`      |
| _Port_             | `587` with TLS off (STARTTLS), or `465` with _TLS_ ticked          |
| _Username_         | whatever the provider issued — often the full sending address      |
| _Password_         | the provider's API key or mailbox password; **it lives only here** |
| _Sender address_   | e.g. `no-reply@your-domain`, on a domain the provider may send for |
| _Sender name_      | `Pyrrhic`                                                          |

Use the admin UI's **Send test email** button before trusting it. A provider's free
tier is enough: this sends one email per new account and per forgotten password.

Two notes worth keeping:

- A domain with SPF and DKIM set up by the provider is the difference between "check
  your inbox" and "check your spam folder".
- PocketBase answers `204` to a reset request even when the mail fails to leave, on
  purpose: the endpoint must not tell a stranger which addresses are registered. So a
  broken SMTP setting is **invisible** from the app — only the test button and the
  container logs show it.

#### 9b. What `pb_migrations/1789315200_account_hardening.js` already did

It runs once, on the first boot after it is copied in, and `$app.settings()` is
writable from a migration in 0.40.4 — so none of this is an admin-UI chore:

| Setting                           | Value                                                               |
| --------------------------------- | ------------------------------------------------------------------- |
| `users` password minimum length   | **10** characters (PocketBase ships 8)                              |
| `users` _Reset password_ template | button links to `<PYRRHIC_APP_URL>/password-reset?token={TOKEN}`    |
| `users` _Verification_ template   | button links to `<PYRRHIC_APP_URL>/verify-email?token={TOKEN}`      |
| Rate limiter                      | **enabled**, with the rules below in front of PocketBase's own four |

| Label                        | Ceiling          | Why                |
| ---------------------------- | ---------------- | ------------------ |
| `users:authWithPassword`     | 10 per minute    | password guessing  |
| `users:requestPasswordReset` | 3 per 5 minutes  | mail cannon        |
| `users:requestVerification`  | 3 per 5 minutes  | mail cannon        |
| `users:confirmPasswordReset` | 10 per 5 minutes | token scanning     |
| `users:confirmVerification`  | 10 per 5 minutes | token scanning     |
| `users:create`               | 30 per hour      | signup floods      |
| `POST /api/app/profile`      | 30 per minute    | our own save route |

Labels are **route tags**, not paths, on purpose: PocketBase matches a tag before a
path, so `POST /api/collections/users/auth-with-password` as a label would have been
silently overruled by the shipped `*:auth` rule. Only `/api/app/profile`, which is
ours and carries no tag, is matched by path. (Verified tag by tag on 0.40.4.)

**The app origin in those two templates is read from the `PYRRHIC_APP_URL` environment
variable in `docker-compose.yml`, at the moment the migration runs — once.** If you
change that variable afterwards, nothing happens: edit the two templates by hand in
**Collections → `users` → gear → Options → Mail templates**, keeping
`?token={TOKEN}` exactly as it is.

To change a ceiling later: **Settings → Application → Rate limiting**, or edit the
migration before the first boot.

#### 9c. Optional: only confirmed accounts may sign in

The migration deliberately leaves `users` → _Options_ → **Authentication rule** empty.
Setting it to `verified = true` is supported (0.40.4 answers `403 "The request doesn't
satisfy the collection requirements to authenticate."`), and it is _stricter_ — but it
refuses the sign-in itself, so the app has no session from which to explain the refusal
or offer to send the email again. As shipped, an unconfirmed account signs in, sees
**Confirm your email address** in the account menu, and is refused only when it tries to
save. Change it in the admin UI if you prefer the stricter behaviour; nothing in the
client breaks (it maps that 403 to "This account is not confirmed yet").

#### 9d. Careful: the admin UI writes migration files

`--automigrate` is on by default, so **every collection change you make in the admin UI
writes a new file into `/pb_migrations`** — which is a bind mount of this repo's
`ops/pocketbase/pb_migrations/` when you run the local container. If a
`*_updated_users.js` appears there after you have been in the admin UI, it is that:
keep it (and commit it) if the change was deliberate, delete it if it was not. Settings
changes — SMTP, rate limits, proxy — write no file.

CORS is **not** an admin-UI setting: it is the `--origins` flag in `docker-compose.yml`,
currently `https://altarbeastiful.github.io,http://localhost:5180`
(5180 is this repo's Vite/Playwright port). Without the flag PocketBase answers
`Access-Control-Allow-Origin: *`. Changing it means editing the compose file and
`docker compose up -d`.

### 10. Backups

`pb_data` is the entire state. **The image has no `sqlite3` binary**, so the spec's
`sqlite3 ".backup"` command does not work here — use PocketBase's own backup engine,
which takes a consistent snapshot of the live database.

Preferred: **Settings → Backups** in the admin UI → enable the cron (e.g. `0 3 * * *`),
set "max keep" to 7, and configure an S3 target (Backblaze B2 or Scaleway; both cost
about nothing at this volume).

Or, off-host and credential-free, from your own machine:

```bash
PB=https://pyrrhic-backend.dynu.net
TOKEN=$(curl -s -X POST "$PB/api/collections/_superusers/auth-with-password" \
  -H 'Content-Type: application/json' \
  -d '{"identity":"you@example.com","password":"…"}' | jq -r .token)

curl -s -X POST "$PB/api/backups" -H "Authorization: $TOKEN" \
  -H 'Content-Type: application/json' -d '{}'                      # 204
KEY=$(curl -s "$PB/api/backups" -H "Authorization: $TOKEN" | jq -r 'sort_by(.modified) | last | .key')
FT=$(curl -s -X POST "$PB/api/files/token" -H "Authorization: $TOKEN" | jq -r .token)
curl -s -o "$KEY" "$PB/api/backups/$KEY?token=$FT"
```

Restore is `POST /api/backups/{key}/restore` (the app restarts itself), or, offline:
stop the stack, unzip the archive over the volume, start again.
**Test one restore before the first real user signs in.**

Never `cp` or `rsync` a live `data.db`; the WAL makes the copy unusable.

### 11. Host hardening

```bash
sudo ufw status                 # expect: deny incoming, allow 22/80/443 only
ss -tlnp | grep 8090            # expect: nothing
```

### 12. Smoke test

```bash
# read-only checks
./smoke.sh https://pyrrhic-backend.dynu.net

# with the write path (use a throwaway account, not your own profile)
PB_TOKEN=$(curl -s -X POST https://pyrrhic-backend.dynu.net/api/collections/users/auth-with-password \
  -H 'Content-Type: application/json' \
  -d '{"identity":"test@example.com","password":"…"}' | jq -r .token) \
PB_HOST=92.5.91.253 \
./smoke.sh https://pyrrhic-backend.dynu.net
```

It covers spec §7 items that can be scripted: health, CORS allow/deny, an
unauthenticated list that leaks nothing, an unauthenticated save rejected with 401, a
first save at version 1 returning 200, a replayed version returning a deterministic
409 with `serverVersion`, a direct `PATCH` refused, cross-account isolation, and 8090
being closed to the internet.

Checks 12-15 cover the email/password account: a password under the collection's
minimum refused with `validation_min_text_constraint`, a fresh account signing in, its
save refused with `403 {"data":{"reason":"email_not_verified"}}`, and a reset request
answering `204` for a registered address and an unknown one alike. They create one
throwaway `smoke-<timestamp>@pyrrhic.test` account and delete it again.

It restores whatever it touched. The remaining §7 items (two-device sign-in, the
conflict modal, cascade delete, a real email opening the app at `/password-reset` or
`/verify-email`, a restored backup) are manual.

## Rollback

Nothing here touches the app, the client, or philou's own site. Three levels:

1. **Undo a bad hook or migration.** `pb_hooks` and `pb_migrations` are bind mounts:
   edit or `scp` the previous file and `docker compose restart pocketbase`
   (hooks also hot-reload on their own). A migration that already ran can be reverted
   with `docker compose exec pocketbase /usr/local/bin/pocketbase migrate down 1 --dir=/pb_data --migrationsDir=/pb_migrations`
   — that **drops the `profiles` collection and its data**, so take a backup first.
2. **Take the backend offline.** `docker compose down` in `/home/ubuntu/pyrrhic`, then
   `rm /home/ubuntu/caddy-sites/pyrrhic.caddy` and
   `docker exec philou-web caddy reload --config /etc/caddy/Caddyfile`.
   philou is untouched throughout; its Caddyfile only gains an `import` of a directory
   that is then empty, which is legal. The `pyrrhic_pb_data` volume survives, so
   `docker compose up -d` brings everything back with its data.
3. **Undo the philou change.** Revert the two lines and `docker compose up -d` in
   philou's deploy directory.

Roll the version back the same way: change the tag in `docker-compose.yml` and
`docker compose up -d`. PocketBase migrates the schema **forward** on boot, so a
downgrade needs the backup taken before the upgrade — always
`POST /api/backups` before changing the image tag.

## Running it on a development machine (S-49b)

The production file publishes no port and allows only the GitHub Pages origin, so a
browser on your own machine can reach neither. `docker-compose.local.yml` is the
override that fixes both, and nothing else:

```bash
docker network create deploy_default          # once; philou owns it on the server
docker compose -f ops/pocketbase/docker-compose.yml \
               -f ops/pocketbase/docker-compose.local.yml up -d
docker compose -f ops/pocketbase/docker-compose.yml exec pocketbase \
  /usr/local/bin/pocketbase superuser upsert --dir=/pb_data dev@pyrrhic.local devdevdevdev
curl -s http://127.0.0.1:8090/api/health
```

The client reads the backend origin at **build** time, so both the dev server and the
Playwright suite need it in the environment:

```bash
VITE_BACKEND_ORIGIN=http://127.0.0.1:8090 pnpm dev
VITE_BACKEND_ORIGIN=http://127.0.0.1:8090 pnpm exec playwright test e2e/account.spec.ts
```

Without it the app has no account rows at all and `e2e/account.spec.ts` skips itself, which
is what keeps CI green without Docker. Google sign-in is not available locally (the OAuth
client is registered against the GitHub Pages origin); email/password is, and is what the
e2e suite uses.

Tear down with `docker compose -f ops/pocketbase/docker-compose.yml down -v` and
`docker network rm deploy_default`.
