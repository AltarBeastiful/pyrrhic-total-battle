/** W18 Drill 04b scratch: the worker-side split, counted only in the TIGHT_SPLIT build of the harness. */
export const split = { tight: 0, tightCalls: 0, plan: 0, planCalls: 0 };
export const time = <A extends unknown[], R>(fn: (...args: A) => R, key: 'tight' | 'plan') =>
  (...args: A): R => {
    const began = performance.now();
    try {
      return fn(...args);
    } finally {
      split[key] += performance.now() - began;
      split[key === 'tight' ? 'tightCalls' : 'planCalls'] += 1;
    }
  };
