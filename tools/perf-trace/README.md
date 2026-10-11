# perf-trace: read a Perfetto trace of the profiling run

`analyse.py` turns a Chrome/Perfetto trace of the "Profile everything" run (`?profiling=1`, see
`docs/plans/profile-drilldown.md`) into the four Markdown tables W18 compares before and after each step.

## Install

Python 3.10+ in a virtual environment of its own (keep it outside the repository):

```sh
python3 -m venv ~/.venvs/perf-trace
~/.venvs/perf-trace/bin/pip install perfetto pandas
```

The `perfetto` package downloads a `trace_processor_shell` binary on its first run. If one already sits in
`~/.local/share/perfetto/prebuilts/trace_processor_shell-*`, the script uses it (the newest by name) and nothing is
downloaded.

## Run

```sh
~/.venvs/perf-trace/bin/python tools/perf-trace/analyse.py ~/Downloads/chrome-202696-18048.pftrace.gz > trace.md
```

It takes a `.pftrace` or a `.pftrace.gz` (unzipped to a temporary file), or a Chrome JSON trace (`.json`,
`.json.gz`), such as the one `e2e/profile-trace.spec.ts` records from a production build:

```sh
python3 tools/perf-trace/analyse.py .maestro/playbooks/Working/w18/trace-prod.json.gz [--maps dist/assets]
```

A JSON trace is read by `chrome_json.py` with the standard library only (no venv needed): Perfetto reads its slices
but not its V8 samples. Frame names of a minified build come back from the build's source maps (`--maps`, default
`dist/assets`; the trace must come from that same build): the name is read off the original source at the frame's
mapped position, so React's own pre-minified production bundle resolves too. `--depth N` sets the depth of the two call
trees (default 7). A 100 MB trace takes about 10 s.

## The tables

1. **Phases and pool jobs.** One block per `pyrrhic:*` slice (generate, upgrades-default, captains, other) with its
   wall time, then the `job:*` slices that start inside it: count, CPU (summed slice duration: a job runs alone on
   its worker), min/avg/max, how many worker tracks ran one, and the idle share
   `1 − CPU / (wall × tracks)`, the part of the busy workers' time spent waiting. The totals are the run's wall and
   pool CPU.
2. **Pool-worker CPU by part.** The V8 CPU samples of the pool workers (the threads whose stacks contain
   `timedJob`), idle removed, split by whether the stack holds `positionTrades` (the Tight raise), `planCampaign`,
   or neither, and within each by the leaf frame: `kernel/` (wasm), JS, unnamed (builtins: allocation, `Map`,
   sort) or `(garbage collector)`. Read shares here; V8 does not sample at an even pace, so CPU time comes from
   table 1.
3. **Call tree under `runProbe`.** Inclusive samples per call path from `runProbe` down, all pool workers together,
   frames under 1 % of the root dropped. Inclusive time walks `stack_profile_callsite.parent_id`.
4. **Call tree of the main thread.** The same for the renderer's main thread (`CrRendererMain`, found as the sampler
   whose stacks contain `performWorkUntilDeadline`), from its `(root)` frame. In a dev build most of it is React's
   dev-only Performance Tracks and `(program)`; take a prod trace to size the page's real cost.
5. **The main thread's own time per phase** (JSON traces with `devtools.timeline`). Exclusive time of the main
   thread's events clipped to each phase, by category: scripting, GC, style (`UpdateLayoutTree`), layout, paint
   (`PrePaint`, `Paint`, `Layerize`, `Commit`), other; busy is their union, idle the rest of the wall.
6. **The main thread's JS per phase** (JSON traces). Its samples, weighted by the gap to the next: React render
   (the stack holds `renderWithHooks`; the component is the frame it called), React commit, other JS,
   `(program)`, GC; then React render by component.
