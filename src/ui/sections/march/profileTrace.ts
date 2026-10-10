/**
 * **The profiling run as a trace file** (owner, 2026-10-10: *"chrome asks to load the profile, it loads but it's
 * empty … maybe downloading the profile could solve the issue"*). `console.profile` records the page's own
 * thread, which is idle while the pool computes, so what DevTools saved had nothing in it. This writes what the
 * run did know — the phases on the page and every job on every worker — as Chrome trace events, which the
 * Performance panel's "Load profile…" and https://ui.perfetto.dev both open: one track per worker, one for the
 * phases, a bar per job.
 */
import type { JobTiming, PhaseSpan } from '@/worker/jobTiming';

interface TraceEvent {
  name: string;
  ph: 'X' | 'M';
  pid: number;
  tid: number;
  ts?: number;
  dur?: number;
  cat?: string;
  args?: Record<string, unknown>;
}

const PID = 1;
const PAGE = 1;

/** Chrome trace events, in microseconds from the first thing that happened. */
export function traceOf(
  spans: readonly PhaseSpan[],
  timings: readonly JobTiming[],
): { traceEvents: TraceEvent[] } {
  const starts = [...spans.map((one) => one.start), ...timings.map((one) => one.at - one.ms)];
  const origin = starts.length === 0 ? 0 : Math.min(...starts);
  const micro = (ms: number): number => Math.round((ms - origin) * 1000);

  const workers = [...new Set(timings.map((one) => one.worker))].sort();
  const tid = (worker: string): number => PAGE + 1 + workers.indexOf(worker);

  const events: TraceEvent[] = [
    { name: 'process_name', ph: 'M', pid: PID, tid: PAGE, args: { name: 'Pyrrhic' } },
    { name: 'thread_name', ph: 'M', pid: PID, tid: PAGE, args: { name: 'page: phases' } },
    ...workers.map((worker): TraceEvent => ({
      name: 'thread_name',
      ph: 'M',
      pid: PID,
      tid: tid(worker),
      args: { name: `worker ${worker}` },
    })),
    ...spans.map((span): TraceEvent => ({
      name: span.phase,
      cat: 'phase',
      ph: 'X',
      pid: PID,
      tid: PAGE,
      ts: micro(span.start),
      dur: Math.round((span.end - span.start) * 1000),
    })),
    ...timings.map((one): TraceEvent => ({
      name: one.kind,
      cat: 'job',
      ph: 'X',
      pid: PID,
      tid: tid(one.worker),
      ts: micro(one.at - one.ms),
      dur: Math.round(one.ms * 1000),
      args: { ms: Math.round(one.ms * 10) / 10 },
    })),
  ];
  return { traceEvents: events };
}

/** Hand the trace to the browser as a file. Display only; a host with no `document` does nothing. */
export function downloadTrace(trace: { traceEvents: TraceEvent[] }): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([JSON.stringify(trace)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pyrrhic-profile-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
