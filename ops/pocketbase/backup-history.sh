#!/usr/bin/env bash
#
# Keep a history of PocketBase's nightly backup, using as little disk as it can (S-49c).
#
# PocketBase makes the backup itself at 03:00 and keeps one (pb_migrations/1791331200_sso.js:
# `backups.cron`, `cronMaxKeep = 1`), inside the volume. This script, run from the host's crontab
# half an hour later, copies that archive out of the container and keeps a history beside it:
#
#   * dedupe: the hash of `data.db` inside the archive (two archives of the same data differ only by
#     their timestamps). An unchanged database stores nothing, so a quiet day costs 0 bytes;
#   * retention: the newest 7 archives, then the newest of each ISO week for 8 weeks, then the
#     newest of each month for 12 months. The newest archive is never deleted.
#
# Everything stays on this host's disk: losing the VPS loses the history too (accepted by the
# owner, 2026-10-07; an rclone line to a bucket is the upgrade).
#
#   ./backup-history.sh [DEST]          DEST defaults to /home/ubuntu/pyrrhic-backups
#
# Crontab (crontab -e, as ubuntu):
#   30 3 * * * /home/ubuntu/pyrrhic/backup-history.sh >> /home/ubuntu/pyrrhic-backups/history.log 2>&1
#
# Restore: ops/pocketbase/README.md step 10 (upload the archive, POST /api/backups/{key}/restore,
# or unzip it over the volume with the stack stopped).

set -euo pipefail

CONTAINER="${PB_CONTAINER:-pyrrhic-pocketbase}"
DEST="${1:-/home/ubuntu/pyrrhic-backups}"
mkdir -p "$DEST"

stamp() { date -u '+%Y-%m-%dT%H:%M:%SZ'; }

latest="$(docker exec "$CONTAINER" sh -c 'ls -1t /pb_data/backups/*.zip 2>/dev/null | head -n 1')"
if [ -z "$latest" ]; then
	echo "$(stamp) no backup in the container yet"
	exit 0
fi

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
docker cp "$CONTAINER:$latest" "$tmp/backup.zip"

hash="$(python3 - "$tmp/backup.zip" <<'PY'
import hashlib, sys, zipfile
print(hashlib.sha256(zipfile.ZipFile(sys.argv[1]).read('data.db')).hexdigest())
PY
)"

if [ "$hash" = "$(cat "$DEST/.last-hash" 2>/dev/null || true)" ]; then
	echo "$(stamp) unchanged since the last stored archive"
else
	name="pyrrhic-$(date -u +%Y-%m-%d).zip"
	cp "$tmp/backup.zip" "$DEST/$name"
	echo "$hash" >"$DEST/.last-hash"
	echo "$(stamp) stored $name ($(du -h "$DEST/$name" | cut -f1))"
fi

# Retention, by the date in each file name. Prints what it deletes.
python3 - "$DEST" <<'PY'
import datetime, pathlib, sys
dest = pathlib.Path(sys.argv[1])
files = sorted(dest.glob('pyrrhic-????-??-??.zip'), reverse=True)  # newest first
day = lambda f: datetime.date.fromisoformat(f.stem[len('pyrrhic-'):])
keep = set(files[:7])
today = datetime.date.today()
weeks, months = set(), set()
for f in files:
    d = day(f)
    week, month = d.isocalendar()[:2], (d.year, d.month)
    if (today - d).days <= 8 * 7 and week not in weeks:
        weeks.add(week); keep.add(f)
    if (today - d).days <= 366 and month not in months:
        months.add(month); keep.add(f)
for f in files:
    if f not in keep:
        print('deleted', f.name)
        f.unlink()
PY
