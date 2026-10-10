/** The profiling run's trace file (`profileTrace.ts`): one track per worker, the phases on the page's, in µs. */
import { expect, test } from 'vitest';

import { traceOf } from './profileTrace';

test('phases on the page track and each job on its worker track, from the first event', () => {
  const { traceEvents } = traceOf(
    [{ phase: 'other', start: 1000, end: 1100 }],
    [
      { worker: 'b', kind: 'probe', ms: 40, at: 1090 },
      { worker: 'a', kind: 'plan', ms: 10, at: 1060 },
    ],
  );
  const names = traceEvents.filter((e) => e.name === 'thread_name').map((e) => e.args?.name);
  expect(names).toEqual(['page: phases', 'worker a', 'worker b']);
  const spans = traceEvents.filter((e) => e.ph === 'X');
  expect(spans.map((e) => [e.name, e.tid, e.ts, e.dur])).toEqual([
    ['other', 1, 0, 100_000],
    ['probe', 3, 50_000, 40_000],
    ['plan', 2, 50_000, 10_000],
  ]);
});

test('no events at all still gives a file DevTools can open', () => {
  expect(traceOf([], []).traceEvents.every((e) => e.ph === 'M')).toBe(true);
});
