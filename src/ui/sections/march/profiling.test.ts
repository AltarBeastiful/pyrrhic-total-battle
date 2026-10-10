// @vitest-environment jsdom
/**
 * The profiling run's gate (`profiling.ts`) and its order (`profileRun.ts`): off in the tests and in a
 * production build, on by `?profiling=1`, by the stored flag or by `VITE_PROFILING`, and one `console.profile`
 * wraps Generate and the advisor's passes in the order the card offers them.
 */
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

import { profilingEnabled } from './profiling';

afterEach(() => {
  vi.unstubAllEnvs();
  globalThis.localStorage.clear();
  globalThis.history.replaceState(null, '', '/');
});

test('is off under test and in a production build', () => {
  expect(profilingEnabled()).toBe(false);
  vi.stubEnv('MODE', 'production');
  vi.stubEnv('DEV', false);
  expect(profilingEnabled()).toBe(false);
});

test('a build flag, the address and the stored flag each switch it on', () => {
  vi.stubEnv('VITE_PROFILING', '1');
  expect(profilingEnabled()).toBe(true);
  vi.stubEnv('VITE_PROFILING', '');
  expect(profilingEnabled()).toBe(false);

  globalThis.localStorage.setItem('pyrrhic.profiling', '1');
  expect(profilingEnabled()).toBe(true);
  globalThis.localStorage.clear();

  globalThis.history.replaceState(null, '', '/?profiling=1');
  expect(profilingEnabled()).toBe(true);
});

test('the address and the stored flag switch it off over a build flag', () => {
  vi.stubEnv('VITE_PROFILING', '1');
  globalThis.history.replaceState(null, '', '/?profiling=0');
  expect(profilingEnabled()).toBe(false);
});

const calls: string[] = [];

vi.mock('./generate', () => ({
  runGenerate: () => {
    calls.push('generate');
    return Promise.resolve();
  },
}));
vi.mock('./advisorSearch', () => ({
  advisorKey: () => 'key',
  canAdvise: () => true,
  computeAdvice: (kind: string) => {
    calls.push(`advice:${kind}`);
    return Promise.resolve();
  },
}));
vi.mock('./captainSearch', () => ({
  captainKey: () => 'key',
  computeCaptains: () => {
    calls.push('captains');
    return Promise.resolve();
  },
}));
vi.mock('./otherSearch', () => ({
  otherKey: () => 'key',
  computeOther: () => {
    calls.push('other');
    return Promise.resolve();
  },
}));
vi.mock('./runStore', () => ({
  pickOf: () => ({ pick: 'sweet-spot' }),
  useRunStore: { getState: () => ({ plan: { silver: 1 }, planPick: 0 }) },
}));
vi.mock('@/state/derive', () => ({ buildPlanRequest: () => ({}) }));
vi.mock('@/state/store', () => ({
  selectActiveProfile: () => ({ upgrades: [], sources: { captains: [] } }),
  selectActiveSetup: () => ({}),
  useStore: { getState: () => ({}) },
}));

beforeEach(() => {
  calls.length = 0;
  // jsdom's console has neither; a browser's has both.
  Object.assign(console, { profile: vi.fn(), profileEnd: vi.fn() });
  vi.spyOn(console, 'table').mockImplementation(() => undefined);
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
});

test('one profile wraps Generate and the passes there is something to ask, in order', async () => {
  const { profileEverything } = await import('./profileRun');
  const report = await profileEverything();
  // No typed upgrade and no captain owned: those two phases are skipped, not run empty.
  expect(calls).toEqual(['generate', 'advice:default', 'other']);
  expect(report.phases.map((one) => one.phase)).toEqual(['generate', 'upgrades-default', 'other']);
  // eslint-disable-next-line no-console -- the spies are the assertion
  expect(console.profile).toHaveBeenCalledTimes(1);
  // eslint-disable-next-line no-console -- the spies are the assertion
  expect(console.profileEnd).toHaveBeenCalledTimes(1);
});
