#!/usr/bin/env python3
"""Read a trace of the "Profile everything" run and print its Markdown tables.

    python tools/perf-trace/analyse.py path/to/trace.pftrace[.gz]
    python tools/perf-trace/analyse.py path/to/trace.json[.gz] [--maps dist/assets]

1. the `pyrrhic:*` phases and the `job:*` slices inside each (wall, CPU, busy tracks, idle share);
2. pool-worker CPU from the V8 samples, split Tight raise / planCampaign / other and by leaf kind;
3. an inclusive-time call tree under `runProbe` (pool workers);
4. an inclusive-time call tree of the main thread (the sampler running `performWorkUntilDeadline`);
5. (JSON traces with `devtools.timeline`) the main thread's own time per phase: scripting, GC, style, layout,
   paint, other, idle;
6. (JSON traces) the main thread's sampled JS per phase: React render (by component), React commit, other JS.

A Chrome JSON trace (`Tracing.start` through CDP, as `e2e/profile-trace.spec.ts` records) is read by
`chrome_json.py` with the standard library only; frame names of a production build come back from its source maps.

See README.md beside this file. W18 P0.1 (docs/plans/profile-drilldown.md).
"""

from __future__ import annotations

import argparse
import collections
import glob
import gzip
import math
import os
import shutil
import sys
import tempfile

from typing import TYPE_CHECKING

import chrome_json

if TYPE_CHECKING:
    from perfetto.trace_processor import TraceProcessor

IDLE = "(idle)"
GC = "(garbage collector)"


def open_trace(path: str) -> tuple[TraceProcessor, str | None]:
    """Start the trace processor, unzipping a `.gz` to a temporary file first."""
    from perfetto.trace_processor import TraceProcessor, TraceProcessorConfig

    tmp = None
    if path.endswith(".gz"):
        fd, tmp = tempfile.mkstemp(suffix=".pftrace")
        with gzip.open(path, "rb") as src, os.fdopen(fd, "wb") as dst:
            shutil.copyfileobj(src, dst)
        path = tmp
    bins = sorted(glob.glob(os.path.expanduser("~/.local/share/perfetto/prebuilts/trace_processor_shell-*")))
    config = TraceProcessorConfig(bin_path=bins[-1]) if bins else TraceProcessorConfig()
    return TraceProcessor(trace=path, config=config), tmp


class Stacks:  # the JSON path's twin is chrome_json.Stacks
    """Callsite paths, read once: callsite id -> list of frame names, root first."""

    def __init__(self, tp: TraceProcessor):
        self.callsites = {r.id: (r.parent_id, r.frame_id) for r in tp.query("select id, parent_id, frame_id from stack_profile_callsite")}
        self.frames = {r.id: r.name or "" for r in tp.query("select id, name from stack_profile_frame")}
        self._paths: dict[int, list[str]] = {}

    def path(self, callsite: int) -> list[str]:
        cached = self._paths.get(callsite)
        if cached is not None:
            return cached
        out = []
        c = callsite
        while c is not None:
            parent, frame = self.callsites[c]
            out.append(self.frames[frame])
            c = None if parent is None or (isinstance(parent, float) and math.isnan(parent)) else int(parent)
        out.reverse()
        self._paths[callsite] = out
        return out


def samples_by_thread(tp: TraceProcessor) -> dict[int, collections.Counter]:
    """utid -> Counter(callsite id -> sample count)."""
    out: dict[int, collections.Counter] = collections.defaultdict(collections.Counter)
    for r in tp.query("select utid, callsite_id c, count(*) n from cpu_profile_stack_sample group by utid, callsite_id"):
        out[r.utid][r.c] += r.n
    return out


def sample_period_ms(tp: TraceProcessor, utids: list[int]) -> float:
    """Median gap between two samples of one sampler, in ms (V8 samples about every 140 µs)."""
    if not utids:
        return 0.0
    q = f"""
      select (ts - lag(ts) over (partition by utid order by ts)) gap
      from cpu_profile_stack_sample where utid in ({",".join(map(str, utids))})"""
    gaps = sorted(r.gap for r in tp.query(q) if r.gap is not None and r.gap > 0)
    return gaps[len(gaps) // 2] / 1e6 if gaps else 0.0


def threads_with(stacks: Stacks, by_thread: dict[int, collections.Counter], frame: str) -> list[int]:
    return sorted(utid for utid, cnt in by_thread.items() if any(frame in stacks.path(c) for c in cnt))


def fmt(x: float, digits: int = 0) -> str:
    return f"{x:,.{digits}f}".replace(",", " ")


def pct(x: float) -> str:
    return f"{100 * x:.1f} %"


# --- table 1 -----------------------------------------------------------------------------------------------------


def table_phases(phases: list, jobs: list, ns: float = 1e6) -> None:
    """`phases` and `jobs` carry name, ts, dur (and track_id); `ns` is the clock units per ms."""
    print("## 1. Phases and pool jobs\n")
    print("Wall from the `pyrrhic:*` slices; job CPU is the summed duration of the `job:*` slices that start inside the")
    print("phase (one job runs alone on its worker). Idle share = 1 − CPU / (wall × busy tracks).\n")
    print("| phase | job | count | CPU ms | min | avg | max | tracks | idle share |")
    print("|---|---|---:|---:|---:|---:|---:|---:|---:|")
    total_wall = total_cpu = 0.0
    for ph in phases:
        inside = [j for j in jobs if ph.ts <= j.ts < ph.ts + ph.dur]
        wall = ph.dur / ns
        total_wall += wall
        tracks = len({j.track_id for j in inside})
        cpu = sum(j.dur for j in inside) / ns
        total_cpu += cpu
        idle = 1 - cpu / (wall * tracks) if tracks else float("nan")
        print(f"| **{ph.name}** ({fmt(wall)} ms wall) | all | {len(inside)} | {fmt(cpu)} | | | | {tracks} | {pct(idle) if tracks else '—'} |")
        by_name: dict[str, list] = collections.defaultdict(list)
        for j in inside:
            by_name[j.name].append(j)
        for name, js in sorted(by_name.items(), key=lambda kv: -sum(j.dur for j in kv[1])):
            durs = [j.dur / ns for j in js]
            t = len({j.track_id for j in js})
            c = sum(durs)
            print(
                f"| | `{name}` | {len(js)} | {fmt(c)} | {fmt(min(durs))} | {fmt(c / len(durs))} | {fmt(max(durs))} | {t} | "
                f"{pct(1 - c / (wall * t))} |"
            )
    print(f"| **total** | | {len(jobs)} | **{fmt(total_cpu)}** | | | | | |")
    print(f"\nTotal wall of the phases: **{fmt(total_wall)} ms**; pool CPU: **{fmt(total_cpu / 1000, 1)} s**.\n")


# --- table 2 -----------------------------------------------------------------------------------------------------


def leaf_kind(leaf: str) -> str:
    # A release kernel has no names: its frames read `wasm-function[N]`.
    if leaf.startswith(("kernel/", "wasm-function[")):
        return "wasm (kernel/)"
    if leaf == GC:
        return "garbage collector"
    if leaf == "":
        return "unnamed"
    return "JS"


def table_pool_cpu(stacks: Stacks, by_thread: dict[int, collections.Counter], pool: list[int], period: float) -> None:
    buckets: collections.Counter = collections.Counter()
    for utid in pool:
        for c, n in by_thread[utid].items():
            p = stacks.path(c)
            if not p or p[-1] == IDLE:
                continue
            part = "Tight raise (positionTrades)" if "positionTrades" in p else ("planCampaign" if "planCampaign" in p else "other")
            buckets[(part, leaf_kind(p[-1]))] += n
    total = sum(buckets.values())
    print("## 2. Pool-worker CPU by part and leaf kind\n")
    print(f"V8 samples on the {len(pool)} pool workers (threads whose stacks contain `timedJob`), idle removed; ")
    print(f"median sample gap {period * 1000:.0f} µs. Busy samples: {fmt(total)}. V8 does not sample at an even pace, so read")
    print("shares here and CPU time from table 1.\n")
    print("| part | leaf kind | samples | share |")
    print("|---|---|---:|---:|")
    parts: collections.Counter = collections.Counter()
    for (part, _), n in buckets.items():
        parts[part] += n
    for part, pn in parts.most_common():
        print(f"| **{part}** | all | {fmt(pn)} | **{pct(pn / total)}** |")
        for (pp, kind), n in sorted(buckets.items(), key=lambda kv: -kv[1]):
            if pp == part:
                print(f"| | {kind} | {fmt(n)} | {pct(n / total)} |")
    print()


# --- tables 3 and 4 ----------------------------------------------------------------------------------------------


def call_tree(stacks: Stacks, by_thread, utids: list[int], root: str, depth: int, min_share: float) -> tuple[int, list[str]]:
    """Inclusive samples per path prefix under the first `root` frame; returns (root samples, Markdown lines)."""
    agg: collections.Counter = collections.Counter()
    total = 0
    for utid in utids:
        for c, n in by_thread[utid].items():
            p = stacks.path(c)
            if root not in p or p[-1] == IDLE:
                continue
            i = p.index(root)
            sub = tuple(p[i : i + depth + 1])
            total += n
            for k in range(1, len(sub) + 1):
                agg[sub[:k]] += n
    children: dict[tuple, list[tuple]] = collections.defaultdict(list)
    for k in agg:
        if len(k) > 1:
            children[k[:-1]].append(k)
    lines: list[str] = []

    def walk(prefix: tuple, level: int) -> None:
        for k in sorted(children.get(prefix, []), key=lambda k: -agg[k]):
            share = agg[k] / total
            if share < min_share:
                continue
            name = k[-1] or "(unnamed)"
            lines.append(f"| {'&nbsp;&nbsp;' * level}{'└ ' if level else ''}`{name}` | {fmt(agg[k])} | {pct(share)} |")
            walk(k, level + 1)

    if total:
        lines.append(f"| `{root}` | {fmt(total)} | 100.0 % |")
        walk((root,), 1)
    return total, lines


def table_tree(title: str, intro: str, stacks: Stacks, by_thread, utids: list[int], root: str, depth: int) -> None:
    total, lines = call_tree(stacks, by_thread, utids, root, depth, 0.01)
    print(f"## {title}\n")
    print(intro)
    print(f"Inclusive samples, depth {depth}, frames ≥ 1 % of `{root}`.\n")
    if not total:
        print(f"_No samples under `{root}`._\n")
        return
    print("| frame | samples | share |")
    print("|---|---:|---:|")
    print("\n".join(lines))
    print()


def table_main_categories(trace: chrome_json.ChromeJsonTrace) -> list[float]:
    """Table 5; returns the busy share of each phase."""
    print("## 5. The main thread's own time per phase\n")
    print("Exclusive time of the renderer main thread's `devtools.timeline` / `v8.execute` events, clipped to each")
    print("phase: scripting (JS tasks, microtasks, posted messages), GC, style (`UpdateLayoutTree`), layout, paint")
    print("(`PrePaint`, `Paint`, `Layerize`, `Commit`), other (`HitTest` and the rest). Busy is their union;")
    print("idle = wall − busy. ms.\n")
    print("| phase | wall | busy | busy share | scripting | GC | style | layout | paint | other | idle |")
    print("|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|")
    shares = []
    rows = [(ph.name, ph.ts, ph.ts + ph.dur) for ph in trace.phases]
    if rows:
        rows.append(("**the run**", rows[0][1], rows[-1][2]))
    for name, lo, hi in rows:
        cats, busy = chrome_json.self_times(trace.timeline, lo, hi)
        wall = (hi - lo) / 1e3
        share = busy / 1e3 / wall if wall else 0.0
        if not name.startswith("**"):
            shares.append(share)
        cells = " | ".join(fmt(cats[c] / 1e3) for c in chrome_json.CATEGORIES)
        print(f"| {name} | {fmt(wall)} | {fmt(busy / 1e3)} | {pct(share)} | {cells} | {fmt(wall - busy / 1e3)} |")
    print()
    return shares


def table_react(trace: chrome_json.ChromeJsonTrace, top: int = 15) -> None:
    print("## 6. The main thread's JS per phase, from its samples\n")
    print("V8 samples of the main thread, idle dropped, each weighted by the gap to the next sample. React render:")
    print("the stack holds `renderWithHooks`, and the component is the frame it called; React commit: `commitRoot`")
    print("and the effects; `(program)` is the browser's own work outside JS. ms.\n")
    rows = [(ph.name, ph.ts, ph.ts + ph.dur) for ph in trace.phases]
    if rows:
        rows.append(("**the run**", rows[0][1], rows[-1][2]))
    parts_order = ["React render", "React commit", "other JS", "(program)", "(garbage collector)"]
    print("| phase | sampled | " + " | ".join(parts_order) + " |")
    print("|---|---:|" + "---:|" * len(parts_order))
    comps_by_phase = []
    for name, lo, hi in rows:
        parts, comps, total = chrome_json.react_split(trace, lo, hi)
        comps_by_phase.append(comps)
        print(f"| {name} | {fmt(total / 1e3)} | " + " | ".join(fmt(parts[p] / 1e3) for p in parts_order) + " |")
    print()
    if not rows:
        return
    run = comps_by_phase[-1]
    print(f"React render by component (the {top} largest over the run), ms:\n")
    print("| component | " + " | ".join(n for n, _, _ in rows) + " |")
    print("|---|" + "---:|" * len(rows))
    for comp, _ in run.most_common(top):
        print(f"| `{comp or '(anonymous)'}` | " + " | ".join(fmt(c[comp] / 1e3, 1) for c in comps_by_phase) + " |")
    print()


def main_json(args: argparse.Namespace) -> int:
    maps = args.maps if args.maps is not None else ("dist/assets" if os.path.isdir("dist/assets") else None)
    trace = chrome_json.ChromeJsonTrace(args.trace, maps)
    by_thread = trace.by_thread()
    stacks = trace.stacks
    pool = threads_with(stacks, by_thread, "timedJob")
    main_threads = [i for i in [trace.main_profile()] if i is not None]
    period = trace.sample_period_ms(pool)

    print(f"# Trace analysis: `{os.path.basename(args.trace)}`\n")
    print(f"Chrome JSON trace; source maps: `{maps}`. Pool-worker samplers (profile index): {pool}; main thread: "
          f"{main_threads}.\n")
    table_phases(trace.phases, trace.jobs, ns=1e3)
    table_pool_cpu(stacks, by_thread, pool, period)
    table_tree(
        "3. Call tree under `runProbe` (pool workers)",
        "Every advisor probe, all pool workers together.",
        stacks, by_thread, pool, "runProbe", args.depth,
    )
    table_tree(
        "4. Call tree on the main thread",
        "The renderer's main thread (`CrRendererMain`), all of it from its `(root)` frame, idle removed.",
        stacks, by_thread, main_threads, "(root)", args.depth,
    )
    table_main_categories(trace)
    table_react(trace)
    return 0


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("trace", help=".pftrace[.gz] (Perfetto) or .json[.gz] (Chrome JSON)")
    ap.add_argument("--depth", type=int, default=7, help="call-tree depth (default 7)")
    ap.add_argument("--maps", help="folder of the build's .js.map files (JSON traces; default dist/assets)")
    args = ap.parse_args()
    if args.trace.endswith((".json", ".json.gz")):
        return main_json(args)

    tp, tmp = open_trace(args.trace)
    try:
        stacks = Stacks(tp)
        by_thread = samples_by_thread(tp)
        pool = threads_with(stacks, by_thread, "timedJob")
        main_threads = threads_with(stacks, by_thread, "performWorkUntilDeadline")
        period = sample_period_ms(tp, pool)

        print(f"# Trace analysis: `{os.path.basename(args.trace)}`\n")
        print(f"Pool-worker samplers (utid): {pool}; main-thread sampler (utid): {main_threads}.\n")
        table_phases(
            list(tp.query("select name, ts, dur from slice where name like 'pyrrhic:%' order by ts")),
            list(tp.query("select name, ts, dur, track_id from slice where name like 'job:%' order by ts")),
        )
        table_pool_cpu(stacks, by_thread, pool, period)
        table_tree(
            "3. Call tree under `runProbe` (pool workers)",
            "Every advisor probe, all pool workers together.",
            stacks, by_thread, pool, "runProbe", args.depth,
        )
        table_tree(
            "4. Call tree on the main thread",
            "The renderer's main thread (`CrRendererMain`: the sampler whose stacks contain `performWorkUntilDeadline`,\n"
            "React's scheduler), all of it from its `(root)` frame, idle removed.",
            stacks, by_thread, main_threads, "(root)", args.depth,
        )
    finally:
        tp.close()
        if tmp:
            os.unlink(tmp)
    return 0


if __name__ == "__main__":
    sys.exit(main())
