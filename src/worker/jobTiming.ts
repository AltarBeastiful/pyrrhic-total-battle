/**
 * **What each worker job cost, for the profiling run only** (owner, 2026-10-10: the page's `console.profile`
 * sees none of the pool's threads or the kernel that runs inside them).
 *
 * Every worker times each job it runs (`timedJob`) and broadcasts `{ worker, kind, ms, at }` on a
 * `BroadcastChannel`; the page's profiling run (`collectJobTimings`) listens while it runs and sums the jobs
 * per phase and kind. The kernel is called from inside those jobs, so its time is part of theirs, and the
 * worker's own `performance.measure('job:<kind>')` puts each job on that thread's Timings track in the
 * Performance panel. Nothing travels on the job protocol, the pool or the client: a build that never
 * listens loses nothing, and one that does not include this switch never posts.
 *
 * **Out of production by construction.** `DEEP_PROFILING` is `import.meta.env.DEV` or `VITE_PROFILING=1` at
 * build time (and never under Vitest), so in a production build it folds to `false` and the bundler drops the
 * branches in `calc.worker.ts` that read it. Build with `VITE_PROFILING=1` to have it in a build; take that
 * variable away, or do not run `pnpm dev`, to have none of it.
 */
export const DEEP_PROFILING: boolean =
  import.meta.env.MODE !== 'test' && (import.meta.env.DEV || import.meta.env.VITE_PROFILING === '1');

export const PROFILE_CHANNEL = 'pyrrhic-job-timing';

/** One job, or the worker's one-off start (`kind: 'boot'`: the kernel compiling). `at` is its end, epoch ms. */
export interface JobTiming {
  worker: string;
  kind: string;
  ms: number;
  at: number;
}

const isTiming = (value: unknown): value is JobTiming =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as JobTiming).worker === 'string' &&
  typeof (value as JobTiming).kind === 'string' &&
  typeof (value as JobTiming).ms === 'number' &&
  typeof (value as JobTiming).at === 'number';

// ---- the worker's side ---------------------------------------------------------------------------------
/** A short name for this thread, so a table can tell the pool's workers apart. */
let workerName: string | null = null;

let channel: BroadcastChannel | null = null;

/** Tell the page a span of this worker's time: also a measure on the worker's own Timings track. */
export function reportTiming(kind: string, began: number, enabled: boolean = DEEP_PROFILING): void {
  if (!enabled) return;
  const ended = performance.now();
  performance.measure(`job:${kind}`, { start: began, end: ended });
  channel ??= new BroadcastChannel(PROFILE_CHANNEL);
  workerName ??= Math.random().toString(36).slice(2, 6);
  const timing: JobTiming = {
    worker: workerName,
    kind,
    ms: ended - began,
    at: performance.timeOrigin + ended,
  };
  channel.postMessage(timing);
}

/** Run `work` and report how long it took, even when it throws. */
export function timedJob<T>(kind: string, work: () => T, enabled: boolean = DEEP_PROFILING): T {
  if (!enabled) return work();
  const began = performance.now();
  try {
    return work();
  } finally {
    reportTiming(kind, began, enabled);
  }
}

// ---- the page's side -----------------------------------------------------------------------------------
export interface TimingCollector {
  /** Stop listening and hand back every timing heard, in arrival order. */
  stop: () => JobTiming[];
}

/** Listen for the workers' timings until `stop()`. A host with no `BroadcastChannel` hears nothing. */
export function collectJobTimings(): TimingCollector {
  const heard: JobTiming[] = [];
  if (typeof BroadcastChannel === 'undefined') return { stop: () => heard };
  const listener = new BroadcastChannel(PROFILE_CHANNEL);
  listener.onmessage = (event: MessageEvent<unknown>) => {
    if (isTiming(event.data)) heard.push(event.data);
  };
  return {
    stop: () => {
      listener.close();
      return heard;
    },
  };
}

export interface PhaseSpan {
  phase: string;
  /** Epoch ms. */
  start: number;
  end: number;
}

export interface JobRow {
  phase: string;
  kind: string;
  jobs: number;
  totalMs: number;
  meanMs: number;
  maxMs: number;
}

export interface PhaseRow {
  phase: string;
  wallMs: number;
  /** Every worker's job time added up. */
  cpuMs: number;
  /** `cpuMs / wallMs`: how many workers were busy on average. */
  busy: number;
  workers: number;
}

const round = (value: number): number => Math.round(value * 10) / 10;

/**
 * Sum the timings heard into the phases they ended in. A job belongs to the phase whose span holds its end;
 * the `boot` of a worker started inside a phase counts there, which is where the compile was paid for.
 */
export function summarise(
  spans: readonly PhaseSpan[],
  timings: readonly JobTiming[],
): { jobs: JobRow[]; phases: PhaseRow[] } {
  const jobs: JobRow[] = [];
  const phases: PhaseRow[] = [];
  for (const span of spans) {
    // A little slack: the message can land a moment after the page's `await` returned.
    const inside = timings.filter((one) => one.at >= span.start && one.at <= span.end + 50);
    const kinds = [...new Set(inside.map((one) => one.kind))].sort();
    for (const kind of kinds) {
      const of = inside.filter((one) => one.kind === kind);
      const total = of.reduce((sum, one) => sum + one.ms, 0);
      jobs.push({
        phase: span.phase,
        kind,
        jobs: of.length,
        totalMs: round(total),
        meanMs: round(total / of.length),
        maxMs: round(Math.max(...of.map((one) => one.ms))),
      });
    }
    const wall = span.end - span.start;
    const cpu = inside.reduce((sum, one) => sum + one.ms, 0);
    phases.push({
      phase: span.phase,
      wallMs: round(wall),
      cpuMs: round(cpu),
      busy: wall > 0 ? round(cpu / wall) : 0,
      workers: new Set(inside.map((one) => one.worker)).size,
    });
  }
  return { jobs, phases };
}
