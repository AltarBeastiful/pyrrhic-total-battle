#!/usr/bin/env bash
# W18: diff the regenerated benchmark-latest.json against HEAD, ignoring timing and stamp fields
# (run, planMs, planCpuMs, searchMs). Exit 0 and print nothing when the figures are identical.
set -euo pipefail
cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"
F=tools/theorycraft/out/benchmark-latest.json
STRIP='del(.run) | walk(if type == "object" then del(.planMs, .planCpuMs, .searchMs) else . end)'
diff <(git show HEAD:$F | jq -S "$STRIP") <(jq -S "$STRIP" "$F")
