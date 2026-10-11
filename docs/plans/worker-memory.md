# Worker memory: what "Profile everything" holds, and what a phone can afford (W21)

**Status: proposed 2026-10-11.** Owner, 2026-10-11: *"the webapp memory jumps when doing profile everything. Is there a
good reason why it's so high? Are we sure this is workable on smaller phone devices? (we can expect 8 GB from almost
all phones but still)"* and, on the findings: *"look into reusing instance, let's keep the 60 s for now"*.

**The rule is W16's: nothing moves but the clock and the memory.** Every plan, stop, position row, advisor row and
benchmark figure stays byte-identical; a step that changes a reading is a trade and goes to the owner.

## 0. What was measured

Headless Chromium on the Vite dev server (not a production build), the owner's export
`pyrrhic-my-account-2026-10-07.json`, the four advisor passes (the work "Profile everything" does), RSS of the renderer
process (the page and its workers share it), `--expose-gc` to separate garbage from what is held. One run on a 16-thread
desktop; the figures move by ±100 MB between runs.

### 0.1 Where the renderer's memory goes (6 workers)

| part | MB |
|---|---:|
| page alone, after a forced GC | 260 |
| six workers loaded, each having run one plan, after a forced GC | ~730 (≈ 78 per worker) |
| after the full run, after a forced GC | 845–980 (the run holds 100–240 more) |
| peak during the run | 1 100–1 235 (100–270 of it garbage) |

### 0.2 It scales with the pool

| pool size | renderer peak | four passes |
|---|---:|---:|
| 1 | 488 MB | 41.5 s |
| 3 | 825 MB | 17.9 s |
| 6 | 1 127 MB | 13.1 s |

About 150 MB per worker at peak, 60–90 MB for the page. The pool is `min(6, cores − 1)` (`poolSize`,
`src/worker/pool.ts`), so an 8-core phone gets 6 workers, the 1 GB+ case.

### 0.3 The wasm instances are not the cost

The run makes **912 instances** (661 raise binds, 251 plan binds). In release they total **≈ 190 MB** of wasm memory
(125 MB raise, 65 MB plan; the largest raise instance is 4.25 MB, its score memo), across six workers. In the Node
golden run every one of them was still reachable after a forced GC (each raise instance lives as long as its base
`StackResult`, the plan binds by request and units).

**A trap found on the way:** `kernel/build/kernel.wasm` was the **profile** build (left by `pnpm dev:profile`). Its
`CENSUS` logs reserve 7.3 MB per instance, which inflates the instance memory ×9 (1.7 GB) and the renderer by ≈ 140 MB.
Measure memory only after `pnpm kernel:build`.

## 1. What a phone can afford

| device | limit | the 6-worker run |
|---|---|---|
| Android Chrome | tolerant on 8 GB devices | fits, with other apps squeezed |
| iOS Safari | tab killed somewhere near 1–1.5 GB (not measured here) | borderline |

Not tested on a phone yet; the figures are a desktop dev build, so a production build should be lower. Chromium's
own accounting also counts a wasm memory by its reserved size, which is why instance counts matter more than bytes.

## 2. The levers, ranked by saving per cost

| # | lever | saves | cost | trade? |
|---|---|---|---|---|
| M1 | **Cap the pool on phones** (3 on touch devices or small screens) | ≈ 150 MB per worker; 6 → 3 ≈ 300 MB | pool size is a constant; passes run ≈ 37 % longer | **yes** (wall time on phones) |
| M2 | **Bound the raise binds**: a small recently-used list per worker (4), as `UNIT_SIBLINGS` does for the plan kernel | part of the 125 MB raise memory, and fewer wasm memories for the GC to track | re-binding when a march comes back; no kernel change | no, if the benchmark holds |
| M3 | **True instance reuse**: one instance per worker, `setTable` again | ≤ 190 MB (≈ 17 % of the peak) | every module-level pointer in `kernel/assembly/index.ts` (`zRow`, `gDir`, `pcKey`, `sDir`, …) is allocated once per instance and sized by the type count; the heap is a bump allocator that never frees, so a reset must clear them all or it reuses stale tables | no, but needs the byte-identical gate and a new `reset` export |
| M4 | **Port more to the kernel** | the 100–270 MB of garbage, in part | the remaining JS is diffuse churn (kernel port paused, step 5); a bigger kernel makes each instance bigger | no |
| M5 | Idle teardown shorter than 60 s | the memory after a run | none | **kept at 60 s for now** (owner) |

## 3. Proposed steps

1. **M0, measure first** (no code): add a production-build run to the harness (`vite preview`, the real button with
   `?profiling=1`) and record the renderer peak at pool 6 and 3. Decide M1's number from it. The scratch harness lives
   in the session scratchpad; commit it beside `.maestro/playbooks/Working/w18/passes.mjs`.
2. **M2**, behind the benchmark: cap the raise binds, A/B the timing fixture, answers byte-identical.
3. **M1**, owner's call: a cap on touch devices or `navigator.deviceMemory` below 8 (absent in Safari, so the touch test
   is the one to use). Ship the number from M0.
4. **M3 only if** M0 and M2 still leave the instances above ~100 MB; it is the most invasive and the smallest saving.
5. Re-run the harness after each step and record the figures here.

## 4. Open questions for the owner

- **Wall time against memory on phones:** is +37 % on the full profile run (13 s → 18 s at 3 workers) acceptable for ≈ 300 MB?
- **Can you attach a phone** (Safari remote devtools or `chrome://inspect`) to read the real peak before M1's number is fixed?
