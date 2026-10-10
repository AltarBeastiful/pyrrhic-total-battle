/**
 * The profiling run's job timing (`jobTiming.ts`): nothing happens unless it is on, a job is reported even
 * when it throws, and the summary puts each timing in the phase it ended in.
 */
import { expect, test, vi } from 'vitest';

import { DEEP_PROFILING, summarise, timedJob, type JobTiming } from './jobTiming';

test('is off under test, so the worker posts nothing and the suite is untouched', () => {
  expect(DEEP_PROFILING).toBe(false);
  expect(timedJob('plan', () => 7)).toBe(7);
});

test('an enabled job is measured and broadcast, a throwing one too', () => {
  const posted: unknown[] = [];
  class Channel {
    postMessage(message: unknown): void {
      posted.push(message);
    }
  }
  vi.stubGlobal('BroadcastChannel', Channel);
  try {
    expect(timedJob('probe', () => 3, true)).toBe(3);
    expect(() =>
      timedJob(
        'plan',
        () => {
          throw new Error('x');
        },
        true,
      ),
    ).toThrow('x');
    expect(posted.map((one) => (one as JobTiming).kind)).toEqual(['probe', 'plan']);
  } finally {
    vi.unstubAllGlobals();
  }
});

test('the summary files each timing under the phase it ended in and counts the busy workers', () => {
  const timings: JobTiming[] = [
    { worker: 'a', kind: 'probe', ms: 100, at: 1050 },
    { worker: 'b', kind: 'probe', ms: 300, at: 1090 },
    { worker: 'a', kind: 'plan', ms: 50, at: 2500 },
  ];
  const { jobs, phases } = summarise(
    [
      { phase: 'upgrades', start: 1000, end: 1100 },
      { phase: 'other', start: 2000, end: 3000 },
    ],
    timings,
  );
  expect(jobs).toEqual([
    { phase: 'upgrades', kind: 'probe', jobs: 2, totalMs: 400, meanMs: 200, maxMs: 300 },
    { phase: 'other', kind: 'plan', jobs: 1, totalMs: 50, meanMs: 50, maxMs: 50 },
  ]);
  expect(phases[0]).toEqual({ phase: 'upgrades', wallMs: 100, cpuMs: 400, busy: 4, workers: 2 });
  expect(phases[1]).toEqual({ phase: 'other', wallMs: 1000, cpuMs: 50, busy: 0.1, workers: 1 });
});
