# ADR-0005 — Share-link encoding in the URL fragment

Status: Accepted (2026-09-12)

## Context
Users share stacks in clan chats (mostly Discord, whose message limit is 2,000 characters for non-Nitro users) and
move configs between their own devices. No server exists to mint short links (ADR-0002).

## Options considered
- Where: query string vs **fragment**. Fragments are never sent to the host and do not appear in server logs.
- Encoding: plain base64 JSON (large), `lz-string` (dependency, mediocre ratio, UTF-16 tricks), **deflate-raw via
  the native `CompressionStream`** (no dependency, best ratio; available in all evergreen browsers and Safari
  ≥ 16.4), MessagePack + short keys (extra dependency, marginal gain after deflate).
- Payload: full document vs **defaults stripped + short field aliases** defined once in the codec.

## Decision
`https://<host>/#c=<base64url( deflate-raw( UTF-8 JSON ) )>` with a leading version byte in the binary
(`0x01`) so the codec can change. The JSON payload is `{ k: "profile" | "battle", v: schemaVersion, d: dataVersion,
p: <payload with default values removed> }`. Field aliases (`leadership → l`, etc.) are applied only if needed to
meet the budget; measure first.

Budgets, enforced by a test: a **battle link** (setup + counts, no bonus tables) ≤ 1,500 characters so it fits a
Discord message with a sentence; a **profile link** ≤ 8,000 characters (well under browser limits; also offered
as a QR code, which is only feasible below ~2,900 alphanumeric characters, and as a JSON file otherwise).

On load, a fragment is decoded, migrated, validated, and presented in a dialog ("Load shared battle from <name>?
Add as new profile / apply to active profile / cancel"); the fragment is then removed from the address bar so a
reload does not re-prompt. Decoding never touches stored data until the user confirms.

If `CompressionStream` is unavailable (old browser), links can still be *read* by including a tiny inflate
fallback (`fflate`, ~8 KB) — decided at implementation time based on the measured need; generation may simply
require a modern browser.

## Consequences
- Zero-infrastructure sharing that carries everything needed to reproduce a result, including bonus totals.
- Long profile links are ugly; that is accepted, QR and file cover the remaining cases.
- The codec has round-trip tests for every schema version and a size test on realistic fixtures.
