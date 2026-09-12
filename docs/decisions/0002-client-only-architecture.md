# ADR-0002 — Client-only architecture, static hosting, no telemetry

Status: Accepted (2026-09-12)

## Context
TotalStack is a SaaS with accounts, server-side calculation, billing and a chatbot. The stated goal of Pyrrhic is a
simple, fully free tool with no logging and no server-side storage. The whole problem (a few hundred unit types, a
few pools, small searches) fits comfortably in a browser.

## Options considered
1. **Static single-page app, no backend.** All state in the browser; sharing via URL fragment or file.
2. Static app plus an optional tiny backend for short links / sync (e.g. a key-value store).
3. Full-stack app like TotalStack.

## Decision
Option 1. The app is a static bundle deployable to GitHub Pages (or any static host, or opened from disk).
No network requests at runtime except loading the app itself: no analytics, no error reporting, no fonts from
third-party CDNs (fonts bundled or system stack), no remote data. Shared state travels in the URL **fragment**
(`#…`), which browsers never send to the server, so even a hosted copy learns nothing about users' armies.
Cross-device use is investigated separately (S-19) under the constraint "no server we operate"; if a backend is
ever wanted it must be user-supplied (their own WebDAV/Gist/Drive) and opt-in.

Licence: AGPL-3.0 (already in the repo). A hosted fork must publish its source, which protects the "free" goal.

## Consequences
- Zero operating cost, no privacy policy needed beyond "nothing leaves your browser".
- No server-side secrets, so the engine and all data are inspectable — good for trust and contributions.
- Limits: no short links (fragment can be long, see ADR-0005), no automatic sync, no usage statistics.
- Hash-based routing only (GitHub Pages has no rewrites); the app is effectively one page anyway.

## Amendment 2026-09-12 — bundled fonts

"No third-party font, no CDN" meant no network request for a font. Fonts bundled with the app (OFL-licensed
variable fonts installed from npm and served from our own origin, subject to the same offline precache as the
rest of the assets) keep the property that matters — nothing leaves the browser, nothing is fetched from a
third party at run time — and are allowed. Loading a font from a CDN remains forbidden.
