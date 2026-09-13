# 0012 — PocketBase version pin and `[verify]` answers (2026-09-13)

Backend groundwork for S-49a. Everything in `docs/research/pocketbase-profile-sync-spec.md`
that carries a **[verify]** flag is resolved below against the pinned version, with the
source consulted. Answers marked *(observed)* were reproduced against a throwaway
`0.40.4` container run locally — not on the server; nothing was deployed and no SSH
session was opened for this note.

## Pinned versions

| Thing | Pinned | Source |
|---|---|---|
| PocketBase | **v0.40.4** (2026-09-12) | <https://github.com/pocketbase/pocketbase/releases> — latest stable; the 0.22.x line is a maintenance branch, not a newer one |
| Docker image | **`ghcr.io/muchobien/pocketbase:0.40.4`** | ghcr tag list; image label `org.opencontainers.image.version=0.40.4`, `alpine:3.24.1` + the official binary |
| JS SDK | **`pocketbase@0.28.1`** (2026-09-05) | <https://github.com/pocketbase/js-sdk/releases>; SDK `>=0.22` is required for PocketBase `>=0.23` |
| Caddy | 2.11.4 (unchanged) | already on the host as `philou-web` (investigation 0010) |

The spec was written against 0.23; the pin is nine minor versions newer. Nothing in the
spec's design broke, but four details did — see *Deviations*.

## `[verify]` answers

| # | Spec item | Answer | Source |
|---|---|---|---|
| 1 | Hook API: `e.auth` | **Correct.** `let authRecord = e.auth`, `let isGuest = !e.auth`. *(observed: a guest POST returns 401 from our hook.)* | <https://pocketbase.io/docs/js-routing/> |
| 2 | Hook API: `e.bindBody(model)` | **Correct**, used with a `DynamicModel`. *(observed.)* | <https://pocketbase.io/docs/js-routing/> |
| 3 | Hook API: `$app.findFirstRecordByFilter(collection, filter, params)` | **Correct**, and it *throws* (`sql.ErrNoRows`) rather than returning null when there is no match — the spec's `try/catch` is required, not defensive. *(observed.)* | <https://pocketbase.io/jsvm/functions/_app.findFirstRecordByFilter.html> |
| 4 | Hook API: `new DynamicModel({...})` | **Exists, but the spec's shape value `data: null` panics.** Shape values are the Go types to bind into and may be `int64 / float64 / string / bool / slice / map` or the `nullString() nullFloat() nullInt() nullBool() nullArray() nullObject()` pointer helpers. `null` is not in that list: `newDynamicModel` calls `reflect.TypeOf(v).Kind()`, and `reflect.TypeOf(nil)` is nil. We use `nullObject()`. | `plugins/jsvm/binds.go` L1177-1266 @ v0.40.4; <https://pocketbase.io/docs/js-routing/> |
| 5 | `routerAdd` signature | **Unchanged:** `routerAdd(method, path, handler, ...middlewares)`, handler takes one `RequestEvent` and must `return e.json(status, body)`. Errors: `throw new BadRequestError/UnauthorizedError/ForbiddenError/NotFoundError/ApiError(status, msg, data)`. *(observed.)* | <https://pocketbase.io/docs/js-routing/> |
| 6 | `listAuthMethods()` shape | **`result.oauth2.providers` is correct for v0.40.4 + SDK 0.28.1.** The response also still carries the deprecated `authProviders`, `emailPassword`, `usernamePassword` top-level keys "until v0.22 support is dropped" — do not use them. *(observed: keys are `authProviders, emailPassword, mfa, oauth2, otp, password, usernamePassword`.)* | `apis/record_auth_methods.go` @ v0.40.4; `src/services/RecordService.ts` @ js-sdk v0.28.1 |
| 7 | `authURL` vs `authUrl` | **Use `authURL`.** The server returns *both*: `AuthURL string \`json:"authURL"\`` and, marked `deprecated: use AuthURL instead … will be removed after dropping v0.22 support`, `AuthUrl string \`json:"authUrl"\``. The SDK's `AuthProviderInfo` types only `authURL`, next to `state`, `codeVerifier`, `codeChallenge`, `codeChallengeMethod`. | `apis/record_auth_methods.go` L34-50 @ v0.40.4 |
| 8 | `authURL` already ends with `redirect_uri=` | **Yes**, verbatim: `provider.BuildAuthURL(info.State, urlOpts...) + "&redirect_uri=" // empty redirect_uri so that users can append their redirect url`. Both PocketBase's own docs and the SDK append the redirect **raw** (`provider.authURL + redirectURL`), not `encodeURIComponent`-ed. Either works for Google, but match the docs and keep the registered URI byte-identical. | `apis/record_auth_methods.go` L166-170; <https://pocketbase.io/docs/authentication/> |
| 9 | `@request.body.version > version` in API rules | **Supported in v0.40.4.** *(observed: with `updateRule = "user = @request.auth.id && @request.body.version > version"`, a `PATCH` with `version: 3` over a stored `2` succeeded; replaying `version: 3` was rejected.)* But the rejection surfaces as **404 "The requested resource wasn't found."**, which is exactly the indistinguishable failure the spec's §4 hook exists to avoid. Kept as a documented fallback in the migration's comments; the live rules deny direct writes. | <https://pocketbase.io/docs/api-rules-and-filters/> + observation |
| 10 | `Authorization` with or without `Bearer ` | **Both work; raw is canonical.** Verbatim in the source: `// the "Bearer" schema prefix is not required by PocketBase and it is supported only for compatibility with the defaults of some HTTP clients`, then `if len(token) > 7 && strings.EqualFold(token[:7], "Bearer ")`. *(observed: both forms accepted.)* `smoke.sh` check 8 asserts it. | `apis/middlewares.go` L211-221 @ v0.40.4 |
| 11 | Superuser CLI command | **`pocketbase superuser create <email> <password>` is correct** (`superuser` also has `upsert`, `update`, `delete`, `otp`, `ips`). **But `--dir=/pb_data` must be added** under this image: the binary's default data dir is `/usr/local/bin/pb_data`, so without it the command writes to an empty throwaway database and appears to succeed. *(observed.)* | `pocketbase superuser --help` @ 0.40.4 |
| 12 | JS migrations supported | **Yes.** `pb_migrations/<unix-timestamp>_<name>.js` with `migrate((app) => {…}, (app) => {…})`; CLI `migrate up / down [n] / create / collections / history-sync`. *(observed: our migration ran on first boot and produced the collection with the intended rules, fields and unique index.)* | <https://pocketbase.io/docs/js-migrations/>; `pocketbase migrate --help` |

## Deviations from the spec, and why

1. **`DynamicModel({ data: null, … })` → `nullObject()`.** `null` is not a legal shape
   value and panics in v0.40.4 (item 4). Consequence for the client: **the profile blob
   must be a JSON object at the top level.** A bare array or scalar is rejected with a
   400. *(observed.)*
2. **"Deny direct writes" is `null`, not `@request.auth.id = ""`.** The spec's expression
   is true for a guest (whose `@request.auth.id` *is* `""`), so it would have let
   anonymous clients create and update `profiles` records. A `null` rule means superusers
   only, which is what §4 intends; the hook writes through `$app.save()` and so bypasses
   API rules entirely. *(observed: `POST`/`PATCH` on the collection with a valid user
   token return 403 while the hook still works.)*
   `deleteRule` stays at §3's `user = @request.auth.id` so a user can remove their
   server-side copy; `smoke.sh` uses it to clean up after itself.
3. **The compose `command:` spells out every directory.** The image's entrypoint only
   injects `--dir=/pb_data --publicDir=/pb_public --hooksDir=/pb_hooks` when it is given
   no arguments, or only flags. Because our first argument is `serve`, all of them —
   plus `--migrationsDir=/pb_migrations` — have to be explicit, or PocketBase silently
   uses `/usr/local/bin/pb_data` and the volumes are ignored. Side effect: the image's
   `PB_ADMIN_EMAIL`/`PB_ADMIN_PASSWORD` convenience is inert, so the superuser is created
   with the CLI (item 11).
4. **Backups: no `sqlite3` in the image.** The spec's
   `docker compose exec pocketbase sqlite3 … ".backup"` cannot run —
   `ghcr.io/muchobien/pocketbase:0.40.4` is alpine + the binary only. Replaced by
   PocketBase's own backup engine: the admin UI cron + optional S3, or
   `POST /api/backups` → `GET /api/backups/{key}?token=<file token>` → off-host copy,
   restored with `POST /api/backups/{key}/restore`. *(observed: create, list, download
   and file-token all work; a 230 KB zip came back.)*
5. **One Caddy instance, not two.** The spec ships its own Caddy; per investigation 0010
   philou's Caddy already owns 80/443, so `ops/pocketbase/caddy/pyrrhic.caddy` is a site
   block for its `sites-enabled` import and the compose file has no Caddy service and no
   `ports:`.
6. **`--origins` also lists `http://localhost:5180`** (this repo's dev/Playwright port),
   not the spec's 5173.
7. **The hook rejects superuser tokens** (`e.auth.collection().name !== "users"` → 403).
   A superuser has no `users` record, so `record.set("user", auth.id)` would fail the
   relation validation with a confusing 400. *(observed.)*
8. **`record.getString("updated")`** rather than `record.get("updated")`: the latter
   returns a `types.DateTime` struct, which does not serialise to the plain string the
   client contract expects. The wire format is `2026-09-13 02:59:21.284Z` — note the
   space, it is **not** ISO-8601 with a `T`.

## What S-49b must do differently

- **Wrap the profile in an object.** `POST /api/app/profile`'s `data` must be a JSON
  object; arrays and scalars are 400s (deviation 1). An *empty* object is also a 400 —
  the `data` field is `required`, and PocketBase counts `{}` as blank.
- **`updated` is `"YYYY-MM-DD HH:MM:SS.sssZ"`**, not ISO-8601. `new Date(s)` parses it in
  Chrome and Firefox but not reliably everywhere; replace the space with `T` before
  parsing, or just display it.
- **Use `authURL`, and read providers from `methods.oauth2.providers`** — as the spec
  says; the deprecated aliases exist but will be removed.
- **Send the token raw** in `Authorization` (a `Bearer ` prefix also works, so a generic
  HTTP client that adds one is fine).
- **A rejected save is always 409 with `{ code, message, data: { serverVersion, updated } }`**;
  a brand-new account that sends anything other than `version: 1` gets
  `serverVersion: 0`. Nothing else returns 409, so the conflict modal can key on the
  status alone.
- **Direct record writes are gone.** `pb.collection('profiles').create/update()` returns
  403. Only `getFirstListItem('')` (read) and `POST /api/app/profile` (write) are
  available; `delete` still works if a "remove my cloud copy" action is ever wanted.
- **Pin `pocketbase@0.28.1`** in `package.json` when S-49b starts.
- **The OAuth redirect URI is frozen once registered with Google.** Decide hash route
  (`#/oauth-callback`) vs the `404.html` copy *before* creating the Google client;
  `ops/pocketbase/README.md` step 8 currently assumes the hash route.

## Files produced

```
ops/pocketbase/README.md                          deployment runbook + rollback
ops/pocketbase/docker-compose.yml                 pinned image, no ports, deploy_default
ops/pocketbase/caddy/pyrrhic.caddy                site block, admin UI denied by default
ops/pocketbase/pb_hooks/main.pb.js                POST /api/app/profile
ops/pocketbase/pb_migrations/1789300800_profiles.js   profiles collection + rules + index
ops/pocketbase/smoke.sh                           spec §7, the scriptable parts
```

Checks run locally: `node --check` on both JS files, `bash -n` on `smoke.sh`,
`docker compose config` on the compose file, `caddy validate --adapter caddyfile` and
`caddy fmt --diff` on the site block (Caddy 2.11.4), and `smoke.sh` itself against a
local `0.40.4` container — 12/12 pass, on both a fresh account and one with an existing
profile.

## Still the owner's call

1. The exact Dynu hostname (`pyrrhic-backend.dynu.net` is assumed throughout).
2. The two-line philou change (`sites-enabled` volume + `import`).
3. Hash route vs `404.html` for the OAuth callback — it freezes the Google redirect URI.
4. Backup target: built-in S3 (Backblaze B2 / Scaleway) or a nightly pull to the
   owner's machine.
5. Whether email/password sign-in stays enabled on `users` (it is on by default and
   `smoke.sh`'s write checks need some way to get a token).
