#!/usr/bin/env bash
#
# Smoke test for the Pyrrhic profile-sync backend (PocketBase v0.40.4).
# Implements the scriptable items of docs/research/pocketbase-profile-sync-spec.md §7.
#
#   ./smoke.sh [BASE_URL]
#
# Environment:
#   PB_URL        base URL (default: https://pyrrhic-backend.dynu.net, or $1)
#   PB_TOKEN      a *user* auth token; enables the write checks (5-9)
#   PB_TOKEN_B    a second user's token; enables the cross-account leak check (10)
#   PB_HOST       host/IP to probe for a publicly exposed 8090 (check 11)
#   PB_ORIGIN     expected CORS origin (default: https://altarbeastiful.github.io)
#   PB_EMAIL      an address the reset check may ask a mail for (default: a throwaway
#                 pyrrhic.test address, which exists nowhere and must still answer 204)
#
# Checks 12-15 create one throwaway account (`smoke-<timestamp>@pyrrhic.test`) to prove
# the email/password hardening: the minimum password length, the 403 an unconfirmed
# address gets from the save route, and the neutral answer to a reset request. The
# account is deleted again at the end, and with it the profile row it never wrote.
#
# Getting a token for a test account:
#   curl -s -X POST "$PB_URL/api/collections/users/auth-with-password" \
#     -H 'Content-Type: application/json' \
#     -d '{"identity":"you@example.com","password":"..."}' | jq -r .token
#   (or copy pb.authStore.token from the browser console after a Google sign-in)
#
# The write checks operate on the token owner's own profile and put it back
# afterwards: the stored blob is restored at version+2, or the record is deleted
# again if this script created it. The version counter does advance by 2 — that is
# unavoidable with an append-only counter, and harmless (clients re-pull).

set -uo pipefail

PB_URL="${1:-${PB_URL:-https://pyrrhic-backend.dynu.net}}"
PB_URL="${PB_URL%/}"
PB_TOKEN="${PB_TOKEN:-}"
PB_TOKEN_B="${PB_TOKEN_B:-}"
PB_HOST="${PB_HOST:-}"
PB_ORIGIN="${PB_ORIGIN:-https://altarbeastiful.github.io}"
PB_EMAIL="${PB_EMAIL:-nobody-has-this-address@pyrrhic.test}"

for bin in curl jq; do
	command -v "$bin" >/dev/null 2>&1 || { echo "smoke.sh needs $bin" >&2; exit 2; }
done

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

pass=0
fail=0
skip=0

if [ -t 1 ]; then
	G=$'\033[32m'; R=$'\033[31m'; Y=$'\033[33m'; N=$'\033[0m'
else
	G=''; R=''; Y=''; N=''
fi

ok()      { printf '%s  PASS%s  %s\n' "$G" "$N" "$1"; pass=$((pass + 1)); }
bad()     { printf '%s  FAIL%s  %s\n' "$R" "$N" "$1"; if [ $# -gt 1 ]; then printf '          %s\n' "$2"; fi; fail=$((fail + 1)); }
warn()    { printf '%s  SKIP%s  %s\n' "$Y" "$N" "$1"; skip=$((skip + 1)); }
section() { printf '\n== %s\n' "$1"; }
note()    { printf '          %s\n' "$1"; }

# call METHOD PATH [TOKEN] [JSON_BODY] -> sets $STATUS and $BODY.
# Must be invoked as a plain statement, never inside $( ), or the assignments
# would be lost with the subshell.
STATUS=""
BODY=""
call() {
	local method="$1" path="$2" token="${3:-}" payload="${4:-}"
	local args=(-sS --max-time 20 -o "$TMP/body" -w '%{http_code}' -X "$method" "${PB_URL}${path}")
	if [ -n "$token" ]; then args+=(-H "Authorization: ${token}"); fi
	if [ -n "$payload" ]; then args+=(-H 'Content-Type: application/json' --data "$payload"); fi
	: >"$TMP/body"
	STATUS="$(curl "${args[@]}" 2>/dev/null)" || STATUS="000"
	BODY="$(cat "$TMP/body")"
}

# cors_origin ORIGIN -> echoes the Access-Control-Allow-Origin of a preflight
cors_origin() {
	curl -sS --max-time 20 -o /dev/null -D - -X OPTIONS "${PB_URL}/api/app/profile" \
		-H "Origin: $1" \
		-H 'Access-Control-Request-Method: POST' \
		-H 'Access-Control-Request-Headers: authorization,content-type' 2>/dev/null \
		| tr -d '\r' | awk -F': ' 'tolower($1)=="access-control-allow-origin"{print $2}'
}

printf 'Pyrrhic PocketBase smoke test\n  target: %s\n' "$PB_URL"

# ---------------------------------------------------------------- reachability
section "Reachability and CORS"

call GET /api/health
if [ "$STATUS" = "200" ] && [ "$(jq -r '.code // empty' <<<"$BODY" 2>/dev/null)" = "200" ]; then
	ok "1. GET /api/health is 200"
else
	bad "1. GET /api/health is 200" "got $STATUS: $BODY"
fi

acao="$(cors_origin "$PB_ORIGIN")"
if [ "$acao" = "$PB_ORIGIN" ]; then
	ok "2. CORS allows ${PB_ORIGIN}"
else
	bad "2. CORS allows ${PB_ORIGIN}" "Access-Control-Allow-Origin was '${acao:-<none>}' (check --origins)"
fi

acao_bad="$(cors_origin "https://not-pyrrhic.example")"
if [ -z "$acao_bad" ]; then
	ok "3. CORS rejects an unknown origin"
else
	bad "3. CORS rejects an unknown origin" "got Access-Control-Allow-Origin: $acao_bad"
fi

# --------------------------------------------------------------- unauth access
section "Unauthenticated access"

call GET /api/collections/profiles/records
total="$(jq -r '.totalItems // empty' <<<"$BODY" 2>/dev/null)"
if [ "$STATUS" = "401" ] || [ "$STATUS" = "403" ]; then
	ok "4a. unauthenticated list is $STATUS"
elif [ "$STATUS" = "200" ] && [ "$total" = "0" ]; then
	ok "4a. unauthenticated list is an empty 200 (leaks nothing)"
else
	bad "4a. unauthenticated list returns nothing" "got $STATUS: $BODY"
fi

call POST /api/app/profile "" '{"data":{"x":1},"version":1,"deviceId":"smoke"}'
if [ "$STATUS" = "401" ]; then
	ok "4b. unauthenticated save is 401"
else
	bad "4b. unauthenticated save is 401" "got $STATUS: $BODY"
fi

# ------------------------------------------------------------------ save path
section "Authenticated save path"

if [ -z "$PB_TOKEN" ]; then
	warn "5-9. write checks (set PB_TOKEN to a test user's auth token)"
else
	call GET '/api/collections/profiles/records?perPage=1' "$PB_TOKEN"
	if [ "$STATUS" != "200" ]; then
		bad "5. pull own profile" "got $STATUS: $BODY"
	else
		rec_id="$(jq -r '.items[0].id // empty' <<<"$BODY")"
		orig_version="$(jq -r '.items[0].version // 0' <<<"$BODY")"
		orig_data="$(jq -c '.items[0].data // {"pyrrhicSmokeTest":true}' <<<"$BODY")"
		created_here=0
		if [ -z "$rec_id" ]; then created_here=1; fi
		if [ "$created_here" = "1" ]; then
			ok "5. pull own profile: no record yet (a first save must use version 1)"
		else
			ok "5. pull own profile: version ${orig_version}"
		fi

		next=$((orig_version + 1))
		call POST /api/app/profile "$PB_TOKEN" \
			"{\"data\":{\"pyrrhicSmokeTest\":true,\"at\":\"$(date -u +%FT%TZ)\"},\"version\":${next},\"deviceId\":\"smoke\"}"
		got="$(jq -r '.version // empty' <<<"$BODY" 2>/dev/null)"
		if [ "$STATUS" = "200" ] && [ "$got" = "$next" ]; then
			ok "6. save at version ${next} is 200 and echoes version ${next}"
		else
			bad "6. save at version ${next} is 200" "got $STATUS: $BODY"
		fi

		call POST /api/app/profile "$PB_TOKEN" \
			"{\"data\":{\"pyrrhicSmokeTest\":true},\"version\":${next},\"deviceId\":\"smoke\"}"
		sv="$(jq -r '.data.serverVersion // empty' <<<"$BODY" 2>/dev/null)"
		if [ "$STATUS" = "409" ] && [ "$sv" = "$next" ]; then
			ok "7. replaying version ${next} is 409 with serverVersion ${sv}"
		else
			bad "7. replaying version ${next} is 409 with serverVersion ${next}" "got $STATUS: $BODY"
		fi

		call POST /api/app/profile "Bearer ${PB_TOKEN}" \
			"{\"data\":{\"pyrrhicSmokeTest\":true},\"version\":${next},\"deviceId\":\"smoke\"}"
		if [ "$STATUS" = "409" ]; then
			ok "8. a 'Bearer ' prefixed Authorization header is accepted too"
		else
			bad "8. a 'Bearer ' prefixed Authorization header is accepted too" "got $STATUS: $BODY"
		fi

		call GET '/api/collections/profiles/records?perPage=1' "$PB_TOKEN"
		rec_id="$(jq -r '.items[0].id // empty' <<<"$BODY")"
		call PATCH "/api/collections/profiles/records/${rec_id}" "$PB_TOKEN" \
			'{"version":9999,"data":{"direct":true}}'
		if [ "$STATUS" = "403" ] || [ "$STATUS" = "404" ]; then
			ok "9. a direct PATCH with a valid token is refused ($STATUS)"
		else
			bad "9. a direct PATCH with a valid token is refused" "got $STATUS: $BODY"
		fi

		if [ "$created_here" = "1" ]; then
			call DELETE "/api/collections/profiles/records/${rec_id}" "$PB_TOKEN"
			note "restored: deleted the profile record this script created (HTTP $STATUS)"
		else
			call POST /api/app/profile "$PB_TOKEN" \
				"{\"data\":${orig_data},\"version\":$((next + 1)),\"deviceId\":\"smoke-restore\"}"
			note "restored: original blob written back at version $((next + 1)) (HTTP $STATUS)"
		fi
	fi
fi

# ------------------------------------------------------------------ isolation
section "Cross-account isolation"

if [ -z "$PB_TOKEN_B" ]; then
	warn "10. second-account check (set PB_TOKEN_B to another user's token)"
else
	call POST /api/collections/users/auth-refresh "$PB_TOKEN_B"
	me="$(jq -r '.record.id // empty' <<<"$BODY" 2>/dev/null)"
	call GET '/api/collections/profiles/records?perPage=200' "$PB_TOKEN_B"
	if [ "$STATUS" != "200" ]; then
		bad "10. list with another account's token" "got $STATUS: $BODY"
	elif [ -z "$me" ]; then
		bad "10. list with another account's token" "could not resolve PB_TOKEN_B's user id"
	else
		foreign="$(jq -r --arg me "$me" '[.items[] | select(.user != $me)] | length' <<<"$BODY")"
		if [ "${foreign:-1}" = "0" ]; then
			ok "10. another account's token sees only its own records ($(jq -r '.totalItems' <<<"$BODY") visible)"
		else
			bad "10. another account's token sees only its own records" "$foreign foreign record(s) visible"
		fi
	fi
fi

# ------------------------------------------------------------------- exposure
section "Host exposure"

if [ -z "$PB_HOST" ]; then
	warn "11. port 8090 probe (set PB_HOST to the server's public IP or hostname)"
else
	code="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 6 "http://${PB_HOST}:8090/api/health" 2>/dev/null)" || code="000"
	if [ "$code" = "000" ]; then
		ok "11. ${PB_HOST}:8090 is not reachable from here"
	else
		bad "11. ${PB_HOST}:8090 is not reachable" "got HTTP $code — PocketBase is exposed; remove any ports: mapping"
	fi
fi

# ------------------------------------------------------- email/password hardening
section "Email, password and confirmation"

STAMP="$(date -u +%Y%m%d%H%M%S)"
SMOKE_EMAIL="smoke-${STAMP}@pyrrhic.test"
SMOKE_PASSWORD="smoke-password-${STAMP}"

call POST /api/collections/users/records "" \
	"{\"email\":\"${SMOKE_EMAIL}\",\"password\":\"short123\",\"passwordConfirm\":\"short123\"}"
if [ "$STATUS" = "400" ] && grep -q 'validation_min_text_constraint' <<<"$BODY"; then
	ok "12. a password under the collection minimum is refused (400)"
elif [ "$STATUS" = "429" ]; then
	warn "12. password minimum: the rate limiter answered first (wait, or exclude this IP)"
else
	bad "12. a password under the collection minimum is refused" "got $STATUS: $BODY"
fi

smoke_id=""
smoke_token=""
call POST /api/collections/users/records "" \
	"{\"email\":\"${SMOKE_EMAIL}\",\"password\":\"${SMOKE_PASSWORD}\",\"passwordConfirm\":\"${SMOKE_PASSWORD}\"}"
if [ "$STATUS" != "200" ]; then
	warn "13-14. unconfirmed-save checks (could not create ${SMOKE_EMAIL}: HTTP $STATUS)"
else
	smoke_id="$(jq -r '.id // empty' <<<"$BODY")"
	call POST /api/collections/users/auth-with-password "" \
		"{\"identity\":\"${SMOKE_EMAIL}\",\"password\":\"${SMOKE_PASSWORD}\"}"
	smoke_token="$(jq -r '.token // empty' <<<"$BODY" 2>/dev/null)"
	if [ -z "$smoke_token" ] && [ "$STATUS" = "403" ]; then
		# An authRule of "verified = true" refuses the sign-in itself: that is the stricter
		# setting the README describes, not a failure of this script.
		ok "13. a new account cannot sign in at all: the collection requires a confirmed address"
		warn "14. unconfirmed save (no session to try it with under that rule)"
	elif [ -z "$smoke_token" ]; then
		bad "13. a new account signs in" "got $STATUS: $BODY"
	else
		ok "13. a new account signs in"
		call POST /api/app/profile "$smoke_token" \
			'{"data":{"pyrrhicSmokeTest":true},"version":1,"deviceId":"smoke"}'
		reason="$(jq -r '.data.reason // empty' <<<"$BODY" 2>/dev/null)"
		if [ "$STATUS" = "403" ] && [ "$reason" = "email_not_verified" ]; then
			ok "14. an unconfirmed account cannot save (403, reason email_not_verified)"
		else
			bad "14. an unconfirmed account cannot save" "got $STATUS: $BODY"
		fi
	fi
fi

# A reset for an address nobody has registered must answer exactly as one for an address
# that exists, or the endpoint tells strangers who has an account here.
call POST /api/collections/users/request-password-reset "" "{\"email\":\"${PB_EMAIL}\"}"
unknown_status="$STATUS"
call POST /api/collections/users/request-password-reset "" "{\"email\":\"${SMOKE_EMAIL}\"}"
if [ "$unknown_status" = "204" ] && [ "$STATUS" = "204" ]; then
	ok "15. a reset request is 204 for an unknown address and for a real one"
elif [ "$unknown_status" = "429" ] || [ "$STATUS" = "429" ]; then
	warn "15. reset request: the rate limiter answered first (3 per 5 minutes, by design)"
else
	bad "15. a reset request is 204 either way" "unknown: $unknown_status, real: $STATUS"
fi

if [ -n "$smoke_id" ] && [ -n "$smoke_token" ]; then
	call DELETE "/api/collections/users/records/${smoke_id}" "$smoke_token"
	note "restored: deleted the throwaway account ${SMOKE_EMAIL} (HTTP $STATUS)"
fi

printf '\n%s passed, %s failed, %s skipped\n' "$pass" "$fail" "$skip"
printf 'Not scriptable, do these by hand: Google sign-in on two devices, the conflict\n'
printf 'modal, the cascade delete of a users record, a real reset or confirmation email\n'
printf 'opening the app at /password-reset and /verify-email, and a restored backup.\n'

[ "$fail" -eq 0 ]
