#!/usr/bin/env bash
# W18 gate: every later phase runs this. Nothing may move but the clock.
# Saves and restores the owner's uncommitted benchmark-latest.* around the run.
set -uo pipefail
ROOT="$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
cd "$ROOT"
W=.maestro/playbooks/Working/w18
OUT=tools/theorycraft/out
LOG=$W/gate-$(date +%Y%m%d-%H%M%S).log
# the advisor golden (tests/kernel/advisor-golden.test.ts) runs inside `pnpm test`; 184 needs THEORY=1.
fail=0
# 184 rewrites its committed report (stale since 2026-10-01, before Tight by rating): snapshot and put back.
SNAP=$(mktemp -d)
cp $OUT/184-the-positions-on-the-kernel.md $OUT/184-timings.json "$SNAP"/
restore() {
  cp $W/benchmark-pre-w18.json $OUT/benchmark-latest.json; cp $W/benchmark-pre-w18.md $OUT/benchmark-latest.md
  cp "$SNAP"/184-the-positions-on-the-kernel.md "$SNAP"/184-timings.json $OUT/; rm -rf "$SNAP"
}
trap restore EXIT
step() {
  local name="$1"; shift
  local t0=$(date +%s)
  if "$@" >>"$LOG" 2>&1; then r=PASS; else r=FAIL; fail=1; fi
  printf '%-48s %s %4ss\n' "$name" "$r" "$(( $(date +%s) - t0 ))" | tee -a "$LOG.summary"
}
step "pnpm kernel:build"            pnpm kernel:build
step "pnpm typecheck"               pnpm typecheck
step "pnpm lint"                    pnpm lint
step "pnpm test"                    pnpm test
step "plan-benchmark alone"         pnpm vitest run tests/engine/plan-benchmark.test.ts
step "benchmark diff vs HEAD"       bash $W/bench-diff.sh
step "184 positions on the kernel"  env THEORY=1 pnpm vitest run tools/theorycraft/184-the-positions-on-the-kernel.test.ts
echo "log: $LOG"
exit $fail
