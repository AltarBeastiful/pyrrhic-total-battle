#!/usr/bin/env python3
"""Where the pool CPU of one JS subtree goes: JS+builtins against wasm, by function.

Reads a Chrome JSON trace (standard library only, through `chrome_json.py`) of the "Profile everything" run and
answers the questions of W19 P0 for the pool workers:

1. Per-function SELF ranking (samples whose leaf is the function), all pool samples.
2. For each frame in --frames: its inclusive share, split into JS + builtins, wasm (`kernel/`, `wasm-function[N]`),
   GC; and its own self share.
3. Kernel (wasm) self time by nearest JS caller, under --under (default: the first of --frames).
4. Builtins (unnamed leaves) and GC by nearest JS frame, under --under.

Shares are of all pool-worker samples (idle removed), as `analyse.py` table 2. Usage:

    python3 tools/perf-trace/subtree.py trace.json.gz --frames planCampaign evaluateVector scorer sizer \\
        [--maps dist/assets] [--top 25] [--under evaluateVector]
"""

from __future__ import annotations

import argparse
import collections
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import chrome_json  # noqa: E402

GC = "(garbage collector)"
IDLE = {"(idle)", "(program)", "(root)"}


def kind(leaf: str) -> str:
    if leaf.startswith(("kernel/", "wasm-function[")):
        return "wasm"
    if leaf == GC:
        return "gc"
    if leaf == "":
        return "builtin"
    return "js"


def pct(x: float) -> str:
    return f"{100 * x:.1f} %"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("trace")
    ap.add_argument("--frames", nargs="+", default=["planCampaign", "evaluateVector", "scorer", "sizer"])
    ap.add_argument("--under", default=None, help="frame for tables 3 and 4 (default: first of --frames)")
    ap.add_argument("--maps", default=None)
    ap.add_argument("--top", type=int, default=25)
    args = ap.parse_args()
    under = args.under or args.frames[0]
    maps = args.maps if args.maps is not None else ("dist/assets" if os.path.isdir("dist/assets") else None)

    trace = chrome_json.ChromeJsonTrace(args.trace, maps)
    by_thread = trace.by_thread()
    stacks = trace.stacks
    pool = [i for i, cnt in by_thread.items() if any("timedJob" in stacks.path(c) for c in cnt)]
    if not pool:
        print("no pool worker (no stack holds `timedJob`)", file=sys.stderr)
        return 1

    paths: collections.Counter = collections.Counter()
    for i in pool:
        for c, n in by_thread[i].items():
            path = tuple(stacks.path(c))
            if path and path[-1] in IDLE:
                continue
            paths[path] += n
    total = sum(paths.values())
    print(f"# Subtree analysis: `{os.path.basename(args.trace)}`\n")
    print(f"{len(pool)} pool samplers, {total} non-idle samples. Shares are of all pool samples.\n")

    # 1. self ranking
    selfc: collections.Counter = collections.Counter()
    for path, n in paths.items():
        selfc[path[-1] or "(builtin)"] += n
    print("## 1. Self time by function\n\n| function | self |\n|---|---:|")
    for name, n in selfc.most_common(args.top):
        print(f"| `{name}` | {pct(n / total)} |")
    print()

    # 2. JS+builtins vs wasm per frame
    print("## 2. Per frame (inclusive subtree)\n")
    print("| frame | inclusive | JS | builtins | wasm | GC | self |\n|---|---:|---:|---:|---:|---:|---:|")
    for frame in args.frames:
        parts: collections.Counter = collections.Counter()
        own = 0
        for path, n in paths.items():
            if frame in path:
                parts[kind(path[-1])] += n
                if path[-1] == frame:
                    own += n
        inc = sum(parts.values())
        print(
            f"| `{frame}` | {pct(inc / total)} | {pct(parts['js'] / total)} | {pct(parts['builtin'] / total)} | "
            f"{pct(parts['wasm'] / total)} | {pct(parts['gc'] / total)} | {pct(own / total)} |"
        )
    print()

    # 3 and 4. nearest JS caller of wasm / builtins / GC under `under`
    near: dict[str, collections.Counter] = {"wasm": collections.Counter(), "builtin": collections.Counter(), "gc": collections.Counter()}
    for path, n in paths.items():
        k = kind(path[-1])
        if k == "js" or under not in path:
            continue
        caller = next((f for f in reversed(path[:-1]) if kind(f) == "js" and f and not f.startswith("js-to-wasm")), "(none)")
        near[k][caller] += n
    for title, k in (("3. Kernel (wasm) self by nearest JS caller", "wasm"),
                     ("4a. Builtins (unnamed leaves) by nearest JS frame", "builtin"),
                     ("4b. GC by nearest JS frame", "gc")):
        print(f"## {title} (under `{under}`)\n\n| JS frame | share |\n|---|---:|")
        for name, n in near[k].most_common(args.top):
            print(f"| `{name}` | {pct(n / total)} |")
        print()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
