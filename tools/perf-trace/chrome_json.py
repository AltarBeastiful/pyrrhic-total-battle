"""Read a Chrome JSON trace (`Tracing.start` through CDP, `streamFormat: 'json'`), standard library only.

Perfetto's trace processor reads the slices of such a trace but not its V8 samples (`ProfileChunk`), and the
frames of a production build are minified. This module gives `analyse.py` what it reads from a `.pftrace`:
the `pyrrhic:*` phases and `job:*` slices, and the samples as callsite paths with their frame names restored
from the build's source maps (`--maps dist/assets`). It adds what only a JSON trace with `devtools.timeline`
holds: the main thread's own time by category (scripting, GC, style, layout, paint), per phase.

W18 Drill 06, experiment 200 (docs/plans/profile-drilldown.md P0.2).
"""

from __future__ import annotations

import bisect
import collections
import gzip
import json
import os
import re
from dataclasses import dataclass

B64 = {c: i for i, c in enumerate("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/")}


def vlq(segment: str) -> list[int]:
    out, value, shift = [], 0, 0
    for ch in segment:
        digit = B64[ch]
        value += (digit & 31) << shift
        if digit & 32:
            shift += 5
            continue
        out.append(-(value >> 1) if value & 1 else value >> 1)
        value = shift = 0
    return out


NAMED = [
    re.compile(r"function\s*\*?\s*([\w$]+)"),  # function foo(
    re.compile(r"([\w$]+)\s*[:=]\s*(?:async\s+)?(?:function\b|<[^>]*>\s*\(|\(|[\w$]+\s*=>)"),  # foo = (…) =>, foo = <T>(…) =>, foo: function
    re.compile(r"(?:async\s+|get\s+|set\s+|static\s+)*([\w$]+)\s*\("),  # method foo(
]


class SourceMap:
    """One `.js.map`: generated (line, column) -> the name of the function that starts there in the original
    source. The map's own `names` miss most functions (React ships its production build minified, and the
    segment at V8's frame position is the `function` token), so the name is read off the original text."""

    def __init__(self, path: str):
        with open(path, encoding="utf-8") as f:
            m = json.load(f)
        self.texts: list[list[str] | None] = [None] * len(m["sources"])
        contents = m.get("sourcesContent") or []
        self._contents = contents
        # per generated line: (columns, (source, line, column) or None)
        self.lines: list[tuple[list[int], list[tuple[int, int, int] | None]]] = []
        src = sline = scol = 0
        for line in m["mappings"].split(";"):
            cols: list[int] = []
            origs: list[tuple[int, int, int] | None] = []
            col = 0
            for seg in line.split(","):
                if not seg:
                    continue
                v = vlq(seg)
                col += v[0]
                o = None
                if len(v) >= 4:
                    src += v[1]
                    sline += v[2]
                    scol += v[3]
                    o = (src, sline, scol)
                cols.append(col)
                origs.append(o)
            self.lines.append((cols, origs))

    def _line(self, src: int, line: int) -> str:
        t = self.texts[src]
        if t is None:
            body = self._contents[src] if src < len(self._contents) else None
            t = (body or "").split("\n")
            self.texts[src] = t
        return t[line] if line < len(t) else ""

    def name_at(self, line: int, column: int) -> str | None:
        """The original name of the function starting at a generated position (V8's frame position, 0-based)."""
        if line >= len(self.lines):
            return None
        cols, origs = self.lines[line]
        i = bisect.bisect_right(cols, column) - 1
        for k in (i, i + 1):
            if 0 <= k < len(cols) and origs[k] is not None:
                src, oline, ocol = origs[k]
                text = self._line(src, oline)
                # The name sits just before the position (`foo = (`, `foo(`) or just after (`function foo`).
                window = text[max(0, ocol - 60) : ocol + 60]
                at = min(60, ocol)
                best = None
                for rx in NAMED:
                    for mm in rx.finditer(window):
                        if mm.start() <= at + 12 and mm.end() >= at - 2:
                            best = best or mm.group(1)
                    if best:
                        break
                if best and best not in ("if", "for", "while", "switch", "return", "catch", "function"):
                    return best
        return None


class Maps:
    """Source maps of a build folder, loaded on first use, keyed by the script's file name."""

    def __init__(self, folder: str | None):
        self.folder = folder
        self._maps: dict[str, SourceMap | None] = {}

    def name(self, url: str, fn: str, line: int, column: int) -> str:
        if not self.folder or not url or line < 0:
            return fn
        base = url.rsplit("/", 1)[-1].split("?", 1)[0]
        if base not in self._maps:
            p = os.path.join(self.folder, base + ".map")
            self._maps[base] = SourceMap(p) if os.path.exists(p) else None
        m = self._maps[base]
        found = m.name_at(line, column) if m else None
        return found or fn


@dataclass
class Slice:
    name: str
    ts: int  # µs
    dur: int  # µs
    track_id: int


@dataclass
class Profile:
    tid: int
    thread: str
    # node id -> (parent node id or None, frame name)
    nodes: dict[int, tuple[int | None, str]]
    # (timestamp µs, node id, duration µs) per sample; the duration is the gap to the next sample
    samples: list[tuple[int, int, int]]


class Stacks:
    """Callsite paths in the shape `analyse.Stacks` gives: callsite id -> list of frame names, root first.
    A callsite id here is (profile index, node id)."""

    def __init__(self, profiles: list[Profile]):
        self.profiles = profiles
        self._paths: dict[tuple[int, int], list[str]] = {}

    def path(self, callsite: tuple[int, int]) -> list[str]:
        cached = self._paths.get(callsite)
        if cached is not None:
            return cached
        p, node = callsite
        nodes = self.profiles[p].nodes
        out = []
        c: int | None = node
        while c is not None:
            parent, name = nodes[c]
            out.append(name)
            c = parent
        out.reverse()
        self._paths[callsite] = out
        return out


class ChromeJsonTrace:
    def __init__(self, path: str, maps_folder: str | None):
        opener = gzip.open if path.endswith(".gz") else open
        with opener(path, "rt", encoding="utf-8") as f:
            data = json.load(f)
        events = data["traceEvents"] if isinstance(data, dict) else data
        self.maps = Maps(maps_folder)
        self.threads: dict[int, str] = {}
        for e in events:
            if e.get("ph") == "M" and e.get("name") == "thread_name":
                self.threads[e["tid"]] = e["args"]["name"]
        self.main_tid = next((t for t, n in self.threads.items() if n == "CrRendererMain"), None)
        self._read_slices(events)
        self._read_profiles(events)
        self.timeline = [
            e for e in events if e.get("ph") == "X" and e.get("tid") == self.main_tid and "dur" in e
        ]

    # --- user timing ---------------------------------------------------------------------------------------------

    def _read_slices(self, events: list[dict]) -> None:
        open_: dict[tuple, list[dict]] = collections.defaultdict(list)
        slices: list[Slice] = []
        for e in sorted((e for e in events if e.get("cat") == "blink.user_timing" and e.get("ph") in "be"), key=lambda e: e["ts"]):
            key = (e["tid"], e["name"], json.dumps(e.get("id2") or e.get("id")))
            if e["ph"] == "b":
                open_[key].append(e)
            elif open_[key]:
                b = open_[key].pop()
                slices.append(Slice(e["name"], b["ts"], e["ts"] - b["ts"], e["tid"]))
        slices.sort(key=lambda s: s.ts)
        self.phases = [s for s in slices if s.name.startswith("pyrrhic:")]
        self.jobs = [s for s in slices if s.name.startswith("job:")]

    # --- samples -------------------------------------------------------------------------------------------------

    def _read_profiles(self, events: list[dict]) -> None:
        heads = {(e["pid"], e["id"]): e for e in events if e.get("name") == "Profile"}
        raw: dict[tuple, dict] = {}
        for e in events:
            if e.get("name") != "ProfileChunk":
                continue
            key = (e["pid"], e["id"])
            head = heads.get(key)
            if head is None:
                continue
            r = raw.setdefault(
                key, {"tid": head["tid"], "t": head["args"]["data"]["startTime"], "nodes": {}, "samples": []}
            )
            d = e["args"]["data"]
            cp = d.get("cpuProfile", {})
            for n in cp.get("nodes", []):
                cf = n["callFrame"]
                name = self.maps.name(
                    cf.get("url", ""), cf.get("functionName", ""), cf.get("lineNumber", -1), cf.get("columnNumber", -1)
                )
                r["nodes"][n["id"]] = (n.get("parent"), name)
            for node, delta in zip(cp.get("samples", []), d.get("timeDeltas", [])):
                r["t"] += delta
                r["samples"].append((r["t"], node))
        self.profiles: list[Profile] = []
        for r in raw.values():
            s = sorted(r["samples"])
            samples = [(t, n, (s[i + 1][0] - t) if i + 1 < len(s) else 0) for i, (t, n) in enumerate(s)]
            self.profiles.append(Profile(r["tid"], self.threads.get(r["tid"], "?"), r["nodes"], samples))
        self.stacks = Stacks(self.profiles)

    def by_thread(self) -> dict[int, collections.Counter]:
        """profile index -> Counter(callsite -> sample count), the shape `analyse.samples_by_thread` gives."""
        out: dict[int, collections.Counter] = {}
        for i, p in enumerate(self.profiles):
            out[i] = collections.Counter((i, n) for _, n, _ in p.samples)
        return out

    def sample_period_ms(self, idxs: list[int]) -> float:
        gaps = sorted(d for i in idxs for _, _, d in self.profiles[i].samples if d > 0)
        return gaps[len(gaps) // 2] / 1e3 if gaps else 0.0

    def main_profile(self) -> int | None:
        return next((i for i, p in enumerate(self.profiles) if p.tid == self.main_tid), None)


# --- the main thread's own time, by category ------------------------------------------------------------------

STYLE = {"UpdateLayoutTree", "RecalculateStyles", "ParseAuthorStyleSheet", "InvalidateLayout", "ScheduleStyleRecalculation"}
LAYOUT = {"Layout", "UpdateLayerTree", "IntersectionObserverController::computeIntersections"}
PAINT = {"PrePaint", "Paint", "PaintImage", "Layerize", "Commit", "CompositeLayers", "UpdateLayer", "Decode Image"}
SCRIPT = {
    "FunctionCall", "EvaluateScript", "RunMicrotasks", "EventDispatch", "TimerFire", "FireAnimationFrame",
    "HandlePostMessage", "UserTiming::Measure", "FireIdleCallback", "XHRReadyStateChange", "v8.compile",
    "v8.compileModule", "v8.evaluateModule", "v8.produceCache", "CompileScript",
}
CATEGORIES = ["scripting", "GC", "style", "layout", "paint", "other"]


def category(name: str) -> str:
    if name in STYLE:
        return "style"
    if name in LAYOUT:
        return "layout"
    if name in PAINT:
        return "paint"
    if name in ("MinorGC", "MajorGC") or name.startswith("V8.GC") or name.startswith("BlinkGC"):
        return "GC"
    if name in SCRIPT or name.startswith("V8.") or name.startswith("v8."):
        return "scripting"
    return "other"


def self_times(timeline: list[dict], lo: int, hi: int) -> tuple[collections.Counter, int]:
    """Exclusive µs per category of the main thread's events clipped to [lo, hi), and the busy µs (their union)."""
    evs = sorted(timeline, key=lambda e: (e["ts"], -e["dur"]))
    out: collections.Counter = collections.Counter()
    busy = 0
    stack: list[list] = []  # [end, category, child µs, own clipped µs]

    def clip(a: int, b: int) -> int:
        return max(0, min(b, hi) - max(a, lo))

    def pop() -> None:
        end, cat, child, own = stack.pop()
        out[cat] += max(0, own - child)
        if stack:
            stack[-1][2] += own

    for e in evs:
        start, end = e["ts"], e["ts"] + e["dur"]
        while stack and stack[-1][0] <= start:
            pop()
        own = clip(start, end)
        if not stack:
            busy += own
        stack.append([end, category(e["name"]), 0, own])
    while stack:
        pop()
    return out, busy


# --- React's share of the main thread's samples ----------------------------------------------------------------

RENDER = "renderWithHooks"
COMMIT = ("commitRoot", "commitRootImpl", "flushPassiveEffects", "commitMutationEffects", "commitLayoutEffects")


def react_split(trace: ChromeJsonTrace, lo: int, hi: int) -> tuple[collections.Counter, collections.Counter, int]:
    """µs of main-thread samples in [lo, hi): (part -> µs, component -> render µs, all sampled µs, idle out).

    A sample is React render when its stack holds `renderWithHooks`; the component is the frame it called.
    Commit when it holds one of COMMIT. The rest of JS is "other JS"; `(program)` and `(garbage collector)` are
    kept apart. Idle samples are dropped."""
    i = trace.main_profile()
    parts: collections.Counter = collections.Counter()
    comps: collections.Counter = collections.Counter()
    if i is None:
        return parts, comps, 0
    p = trace.profiles[i]
    for t, node, d in p.samples:
        if not lo <= t < hi:
            continue
        path = trace.stacks.path((i, node))
        leaf = path[-1]
        if leaf == "(idle)":
            continue
        if leaf in ("(program)", "(garbage collector)"):
            parts[leaf] += d
        elif RENDER in path:
            parts["React render"] += d
            k = path.index(RENDER)
            comps[path[k + 1] if k + 1 < len(path) else "(self)"] += d
        elif any(c in path for c in COMMIT):
            parts["React commit"] += d
        else:
            parts["other JS"] += d
    return parts, comps, sum(parts.values())
