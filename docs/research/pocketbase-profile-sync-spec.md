# Profile Sync Backend — Implementation Spec

**Target:** a self-hosted PocketBase instance that lets a client-only PWA (React + Vite, deployed on GitHub Pages, IndexedDB as the local source of truth) store and retrieve a single per-user profile blob, authenticated with Google.

**Scope is deliberately small.** There is no sync engine. The user presses a Save button; the whole profile is overwritten server-side. On another device, the profile is pulled once and overwrites the local IndexedDB state. The only concurrency control is an optimistic version check.

---

## 0. Version caveat — read this first

PocketBase's Go/JS hook API and its JS SDK were restructured in v0.23. Collection naming, the `listAuthMethods()` response shape, the superuser CLI command and the `routerAdd` handler signature all changed at that boundary, and may change again.

This spec is written against **PocketBase v0.23+ with JS SDK v0.22+**. Pin an exact version in the Dockerfile and cross-check every API call below against the docs for that version before writing code. Where a detail is version-sensitive it is flagged inline with **[verify]**.

---

## 1. Architecture

```
Browser (PWA on GitHub Pages)
  │
  ├── Google OAuth  ── redirect back to the GitHub Pages origin
  │
  └── HTTPS ──► Caddy (VPS :443) ──► PocketBase (internal :8090)
                                         └── SQLite + uploaded files on a Docker volume
```

Two origins are involved:

| Role | Origin | Notes |
|---|---|---|
| Frontend | `https://<user>.github.io/<repo>/` | static, no secrets |
| Backend | `https://<backend-host>/` | PocketBase behind Caddy |

There is no cookie-based session. PocketBase issues a JWT that the SDK sends in the `Authorization` header, so there are no `SameSite` or third-party-cookie concerns between the two origins.

---

## 2. Google OAuth configuration

### 2.1 The important decision

PocketBase's default OAuth2 flow redirects Google back to `https://<backend-host>/api/oauth2-redirect`, which forces the **backend** host into the Google Cloud console. If the backend runs on a shared wildcard-DNS host (`sslip.io`, `nip.io`, `duckdns.org`), that host is not one you can prove ownership of, and publishing the consent screen may be refused.

**Use a frontend-hosted redirect instead.** PocketBase's `authWithOAuth2Code()` accepts an arbitrary `redirectUrl`, so the only host Google ever sees is the GitHub Pages origin. `github.io` is on the Public Suffix List, so `<user>.github.io` counts as its own registered domain and can be verified in Google Search Console by uploading an HTML file to the repo.

Net effect: the backend hostname never appears in any Google configuration, and can be changed later without touching the OAuth client.

### 2.2 Google Cloud console setup

1. Create a project, then an **OAuth client ID** of type *Web application*.
2. Authorized JavaScript origins: `https://<user>.github.io`
3. Authorized redirect URIs: `https://<user>.github.io/<repo>/oauth-callback`
   (must match `redirectUrl` in the client code byte for byte, including the trailing slash or absence of it)
4. Consent screen: External, scopes `openid`, `email`, `profile` only. These are non-sensitive, so no Google verification review is required.
5. Verify `<user>.github.io` in Search Console (HTML file upload method) and add it to the authorized domains.

### 2.3 PocketBase setup

Admin UI → Collections → `users` → Options → OAuth2 → enable Google, paste the client ID and client secret.

---

## 3. Data model

One collection. Create it through the admin UI or a migration file.

### Collection `profiles` (type: base)

| Field | Type | Constraints |
|---|---|---|
| `user` | relation → `users` | required, maxSelect 1, cascadeDelete **true**, **unique index** |
| `data` | json | required — the whole profile blob |
| `version` | number | required, min 1, integer |
| `updatedBy` | text | optional — opaque device id, for the conflict message |

The unique index on `user` is what guarantees one profile per account. Create it explicitly:

```sql
CREATE UNIQUE INDEX idx_profiles_user ON profiles (user);
```

`created` and `updated` are maintained by PocketBase automatically.

### API rules

| Rule | Expression |
|---|---|
| List | `user = @request.auth.id` |
| View | `user = @request.auth.id` |
| Create | `@request.auth.id != "" && user = @request.auth.id` |
| Update | `user = @request.auth.id && @request.body.version > version` |
| Delete | `user = @request.auth.id` |

The update rule is the concurrency control. PocketBase's filter syntax has no arithmetic, so `version + 1` cannot be expressed, but a strict `>` comparison against the stored value is sufficient: a client that loaded version *N* submits *N+1*, which is rejected if another device has already moved the record to *N+1* or beyond. **[verify]** that `@request.body.<field> > <field>` comparisons are supported in the pinned version; if not, fall back to the hook in §4.

---

## 4. Recommended: an explicit save endpoint

Relying on API rules alone works, but a rejected rule surfaces as a generic 400/403/404 that is indistinguishable from other failures, which makes the client's conflict handling guesswork.

Add a JS hook that owns the whole save path and returns a deterministic **409 Conflict**. Create `pb_hooks/main.pb.js`:

```js
// POST /api/app/profile
// Body: { data: <any JSON>, version: <int>, deviceId: <string> }
// 200 -> { version, updated }
// 409 -> { code: 409, message: "conflict", data: { serverVersion, updated } }
routerAdd("POST", "/api/app/profile", (e) => {
  const auth = e.auth;
  if (!auth) {
    throw new UnauthorizedError("authentication required");
  }

  const body = new DynamicModel({ data: null, version: 0, deviceId: "" });
  e.bindBody(body);

  if (!Number.isInteger(body.version) || body.version < 1) {
    throw new BadRequestError("invalid version");
  }

  let record;
  try {
    record = $app.findFirstRecordByFilter(
      "profiles",
      "user = {:uid}",
      { uid: auth.id }
    );
  } catch (err) {
    record = null;
  }

  // First save for this account.
  if (!record) {
    if (body.version !== 1) {
      return e.json(409, {
        code: 409,
        message: "conflict",
        data: { serverVersion: 0 },
      });
    }
    const collection = $app.findCollectionByNameOrId("profiles");
    record = new Record(collection);
    record.set("user", auth.id);
    record.set("data", body.data);
    record.set("version", 1);
    record.set("updatedBy", body.deviceId);
    $app.save(record);
    return e.json(200, { version: 1, updated: record.get("updated") });
  }

  const serverVersion = record.getInt("version");
  if (body.version !== serverVersion + 1) {
    return e.json(409, {
      code: 409,
      message: "conflict",
      data: { serverVersion, updated: record.get("updated") },
    });
  }

  record.set("data", body.data);
  record.set("version", body.version);
  record.set("updatedBy", body.deviceId);
  $app.save(record);

  return e.json(200, { version: body.version, updated: record.get("updated") });
});
```

**[verify]** the hook API surface (`e.auth`, `e.bindBody`, `$app.findFirstRecordByFilter`, `DynamicModel`) against the pinned version — these names differ before v0.23.

Mount `pb_hooks` as a volume (see §6) so hooks can be edited without rebuilding the image. PocketBase hot-reloads them.

With this endpoint in place, tighten the collection's create and update rules to `@request.auth.id = ""` (deny all direct writes), so the hook is the only write path. Reads stay on the standard `GET /api/collections/profiles/records` route.

---

## 5. Client contract

### 5.1 Endpoints the frontend uses

| Purpose | Call |
|---|---|
| List OAuth providers | `pb.collection('users').listAuthMethods()` **[verify]** — the provider list moved to `result.oauth2.providers` in v0.23+ |
| Complete OAuth | `pb.collection('users').authWithOAuth2Code('google', code, codeVerifier, redirectUrl)` |
| Refresh token | `pb.collection('users').authRefresh()` |
| Pull profile | `pb.collection('profiles').getFirstListItem('')` — the view rule already scopes it to the caller |
| Push profile | `POST /api/app/profile` with the bearer token |

### 5.2 OAuth: exact sequence

**Step 1 — start (on the login button):**

```js
const methods = await pb.collection('users').listAuthMethods();
const google = methods.oauth2.providers.find(p => p.name === 'google');

// codeVerifier and state must survive the redirect
sessionStorage.setItem('pkce', JSON.stringify({
  codeVerifier: google.codeVerifier,
  state: google.state,
}));

const redirectUrl = `${window.location.origin}${import.meta.env.BASE_URL}oauth-callback`;
window.location.href = `${google.authURL}${encodeURIComponent(redirectUrl)}`;
```

`authURL` already ends with `redirect_uri=`, so the encoded redirect is appended, not assigned. **[verify]** — some versions expose this as `authUrl`.

**Step 2 — callback page (`/oauth-callback`):**

```js
const params = new URLSearchParams(window.location.search);
const stored = JSON.parse(sessionStorage.getItem('pkce') ?? '{}');

if (!params.get('code') || params.get('state') !== stored.state) {
  throw new Error('OAuth state mismatch');
}

await pb.collection('users').authWithOAuth2Code(
  'google',
  params.get('code'),
  stored.codeVerifier,
  redirectUrl,          // byte-identical to step 1
);

sessionStorage.removeItem('pkce');
```

The state check is not optional. Skipping it leaves the login flow open to CSRF.

**GitHub Pages caveat:** Pages has no SPA rewrite, so `/oauth-callback` 404s on a hard navigation. Either copy `index.html` to `404.html` at build time and let the router resolve the path client-side, or use a hash route (`#/oauth-callback`) — but note that Google strips nothing from the fragment, so a hash-based redirect URI must still be registered in full.

### 5.3 Save

```js
async function save(profile, currentVersion, deviceId) {
  const res = await fetch(`${BACKEND}/api/app/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: pb.authStore.token,
    },
    body: JSON.stringify({
      data: profile,
      version: currentVersion + 1,
      deviceId,
    }),
  });

  if (res.status === 409) {
    const { data } = await res.json();
    return { ok: false, conflict: true, serverVersion: data.serverVersion };
  }
  if (!res.ok) {
    return { ok: false, conflict: false };
  }

  const { version } = await res.json();
  return { ok: true, version };
}
```

Note that PocketBase expects the raw token in `Authorization`, **without** a `Bearer ` prefix. **[verify]** — recent versions accept both.

### 5.4 Client state

Persist alongside the profile in IndexedDB:

- `remoteVersion` — the version last successfully pulled or pushed. Starts at `0` for an account that has never saved.
- `deviceId` — a UUID generated once per browser profile, stored locally. Purely for the conflict message.
- `dirty` — boolean, set on every local mutation, cleared on a successful save. Drives the Save button's enabled state.

### 5.5 Conflict handling

On 409, do not resolve silently. Show a modal with the two options, both of which are lossy in one direction, and say so:

- **Load the server version** — discards unsaved local changes, applies the pulled blob to IndexedDB, sets `remoteVersion` to the server's.
- **Overwrite with this device** — re-pull to read the current `serverVersion`, then retry the save with `serverVersion + 1`.

Offer a JSON export before either branch, so a user who picks wrong has a recovery path.

### 5.6 Service worker

The service worker must **not** cache backend responses. Register a `NetworkOnly` strategy for the backend origin. A cached profile pull served from the SW cache after a save on another device produces a silent conflict loop that is extremely hard to diagnose.

### 5.7 IndexedDB eviction

Safari evicts IndexedDB after 7 days of no interaction for sites not installed to the home screen. Call `navigator.storage.persist()` on first load and tell iOS users to install the PWA. This is a pre-existing problem, but sync makes it recoverable rather than fatal.

---

## 6. Deployment

### `docker-compose.yml`

```yaml
services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:0.23.0   # pin exactly
    restart: unless-stopped
    volumes:
      - pb_data:/pb_data
      - ./pb_hooks:/pb_hooks
    command:
      - serve
      - --http=0.0.0.0:8090
      - --origins=https://<user>.github.io
    networks: [web]
    # no `ports:` — never expose 8090 on the host

  caddy:
    image: caddy:2-alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data
      - caddy_config:/config
    networks: [web]
    depends_on: [pocketbase]

networks:
  web:

volumes:
  pb_data:
  caddy_data:
  caddy_config:
```

`--origins` is the CORS allowlist. Without it PocketBase responds with `Access-Control-Allow-Origin: *`, which is not a vulnerability on its own given the bearer-token model, but there is no reason to leave it open. Add `http://localhost:5173` as a second comma-separated value during development.

### `Caddyfile`

```
<backend-host> {
	encode gzip
	reverse_proxy pocketbase:8090

	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
		X-Content-Type-Options "nosniff"
		Referrer-Policy "no-referrer"
	}
}
```

Caddy does not buffer responses by default, so PocketBase's SSE realtime endpoint works through it unmodified — relevant only if realtime is added later.

### Host hardening

- `ufw default deny incoming`, then allow 22, 80, 443 only.
- The compose file above publishes nothing but Caddy's ports; verify with `ss -tlnp` that 8090 is not listening on a public interface.
- Create the superuser once: `docker compose exec pocketbase /usr/local/bin/pocketbase superuser create <email> <password>` **[verify]** — this was `admin create` before v0.23.
- Consider restricting the `/_/` admin UI in Caddy to a known source IP.

### Backups

The entire state is `pb_data`, a SQLite file plus attachments.

1. Enable PocketBase's built-in scheduled backups (Settings → Backups) with an S3-compatible target — Backblaze B2 or Scaleway Object Storage both work and cost near nothing at this volume.
2. A Docker volume on a single VPS is not a backup. If the built-in S3 path is not used, schedule `docker compose exec pocketbase sqlite3 /pb_data/data.db ".backup /pb_data/backup.db"` followed by an off-host copy. Never `cp` a live SQLite file.
3. Test a restore once before going live.

---

## 7. Acceptance checklist

- [ ] Signing in with Google on device A creates exactly one `users` record and no `profiles` record.
- [ ] First Save on device A creates a `profiles` record with `version = 1`.
- [ ] Signing in on device B pulls the profile and overwrites local IndexedDB.
- [ ] Saving on B sets `version = 2`; saving on A afterwards (still holding version 1) returns 409 and shows the conflict modal.
- [ ] Choosing "load server version" on A leaves both devices at version 2 with identical data.
- [ ] A request to `GET /api/collections/profiles/records` with another user's token returns an empty list, not a 403 — verify it leaks nothing.
- [ ] A direct `PATCH /api/collections/profiles/records/<id>` with a valid token is rejected once the hook owns writes.
- [ ] `8090` is unreachable from the public internet.
- [ ] Deleting a `users` record cascades and removes the matching `profiles` record.
- [ ] A restored backup produces a working instance.

---

## 8. Deliberately out of scope

Listed so nobody implements them by reflex:

- Field-level merging, CRDTs, or last-write-wins resolution.
- Tombstones, an outbox queue, or offline write replay. Saving offline simply fails and the Save button stays enabled.
- Realtime subscriptions. The profile is pulled on sign-in and on explicit user action only.
- Sharing profiles between accounts.
- Server-side validation of the `data` blob's shape. The server stores opaque JSON; the client owns the schema and its migrations.
