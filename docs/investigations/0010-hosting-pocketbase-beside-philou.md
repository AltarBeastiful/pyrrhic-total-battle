# 0010 — Hosting Pyrrhic's PocketBase beside philou on the "main" server (2026-09-13)

Read-only inspection over SSH (`ssh main`, 92.5.91.253, user ubuntu). Nothing was changed on the server.

## What is there

| Item | Value |
|---|---|
| Host | `main-20260820-1707`, ~10 GB RAM (9.2 GB available), 30 GB free on `/` |
| Docker | 29.8.0, Compose v5.5.1 |
| philou | one container `philou-web` = `caddy:2-alpine` (Caddy **v2.11.4**), ports 80/443 (+443/udp) bound on the host, static `file_server` for `/srv/philou` (the repo, read-only), Caddyfile at `/home/ubuntu/philou/deploy/caddy/Caddyfile` (site = `{$PHILOU_DOMAIN}` = `philou.92.5.91.253.sslip.io`), network `deploy_default`, volumes `deploy_caddy_data` / `deploy_caddy_config` |
| Ports 8090 / 2019 | free on the host |
| DNS | `philou.92.5.91.253.sslip.io` and `pyrrhic.92.5.91.253.sslip.io` both resolve to 92.5.91.253 (sslip.io answers any label) |
| Public Suffix List | `duckdns.org` and `github.io` are on it; **`sslip.io` and `nip.io` are not** |

## Can both services share the server with different names? Yes.

Only one process can own 80/443, and philou's Caddy already does. So Pyrrhic's backend does **not** run its
own Caddy: PocketBase joins philou's Docker network and philou's Caddy gets a second site block that
reverse-proxies to it. Caddy serves any number of hostnames from one instance, each with its own automatic
certificate, so `philou.…` and `pyrrhic.…` coexist.

### Layout

```
/home/ubuntu/philou/deploy/           (philou's repo — one small change, see below)
  docker-compose.yml                  + volume  ../../caddy-sites:/etc/caddy/sites-enabled:ro
  caddy/Caddyfile                     + line    import /etc/caddy/sites-enabled/*.caddy
/home/ubuntu/caddy-sites/             (shared, owned by ubuntu)
  pyrrhic.caddy                       Pyrrhic's site block (below)
/home/ubuntu/pyrrhic/                 (Pyrrhic's ops, from this repo's ops/pocketbase/)
  docker-compose.yml                  pocketbase only, no ports, network deploy_default (external)
  pb_hooks/main.pb.js                 the save endpoint from the spec
```

`pyrrhic.caddy`:

```
pyrrhic.92.5.91.253.sslip.io {
	encode zstd gzip
	reverse_proxy pocketbase:8090
	@admin path /_/*
	# keep the admin UI to the owner's network(s); adjust or use basic_auth
	respond @admin 403
	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
		X-Content-Type-Options "nosniff"
		Referrer-Policy "no-referrer"
	}
}
```

Pyrrhic's `docker-compose.yml`:

```yaml
services:
  pocketbase:
    image: ghcr.io/muchobien/pocketbase:0.23.x   # pin exactly after checking the spec's [verify] items
    restart: unless-stopped
    volumes:
      - pb_data:/pb_data
      - ./pb_hooks:/pb_hooks
    command: ["serve", "--http=0.0.0.0:8090", "--origins=https://<user>.github.io,http://localhost:5180"]
    networks: [deploy_default]
networks:
  deploy_default:
    external: true
volumes:
  pb_data:
```

Reload after editing a site file: `docker exec philou-web caddy reload --config /etc/caddy/Caddyfile`
(the directory is bind-mounted, so edits are visible; philou's own comment explains why the directory and
not the file is mounted).

The philou change is two lines in another project's repo; it needs the owner's go-ahead and should be
committed there ("caddy: import sites-enabled/*.caddy so other services on this host can add sites").

## Which free DNS

- **sslip.io (current, works):** resolves any `<label>.<ip>.sslip.io`; nothing to register. Because it is
  not on the Public Suffix List, Let's Encrypt's 50-certificates-per-week limit is counted for `sslip.io`
  as a whole, shared with every other sslip.io user; issuance can hit "too many certificates already
  issued". Caddy 2.11 falls back to ZeroSSL automatically, so in practice the certificate arrives, sometimes
  after retries. philou lives with this today.
- **DuckDNS (recommended for Pyrrhic's backend):** free, `pyrrhic-tb.duckdns.org` → 92.5.91.253 set in
  their dashboard; `duckdns.org` is on the PSL, so each subdomain is its own registered domain for rate
  limits; the name survives an IP change (update the record). Google never sees the backend host (the spec's
  frontend-hosted redirect), so either choice is fine for OAuth; the difference is only certificate
  reliability and a readable name.
- nip.io: same properties as sslip.io. A real domain (a few euros a year) remains the cleanest later.

## Checklist before S-49a starts

1. Owner: choose the name (`pyrrhic.92.5.91.253.sslip.io` now, or a DuckDNS name) and approve the
   two-line philou change.
2. Owner: the Google Cloud project and OAuth client (the spec §2.2) with the GitHub Pages origin only.
3. Pin the PocketBase image and check every `[verify]` in the spec against that version.
4. Backups: PocketBase's built-in S3 backups, or a nightly `sqlite3 .backup` + copy to the owner's machine
   (the same habit as the Claude history mirror).
