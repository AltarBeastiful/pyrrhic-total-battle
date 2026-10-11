import * as jobs from '@/worker/jobs';
import { split } from './split';

const channel = new BroadcastChannel('w18-split');
const wrap = <A extends unknown[], R>(kind: string, fn: (...args: A) => R) =>
  (...args: A): R => {
    split.tight = 0; split.tightCalls = 0; split.plan = 0; split.planCalls = 0;
    const began = performance.now();
    try {
      return fn(...args);
    } finally {
      channel.postMessage({ kind, ms: performance.now() - began, ...split });
    }
  };
export const runStack = wrap('stack', jobs.runStack);
export const runSearch = wrap('search', jobs.runSearch);
export const runPlan = wrap('plan', jobs.runPlan);
export const runResize = wrap('resize', jobs.runResize);
export const runRaise = wrap('raise', jobs.runRaise);
export const runPositions = wrap('positions', jobs.runPositions);
export const runProbe = wrap('probe', jobs.runProbe);
export const runCaptainScreen = wrap('captains', jobs.runCaptainScreen);
