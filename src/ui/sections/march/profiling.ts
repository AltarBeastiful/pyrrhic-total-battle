/**
 * **Is the profiling run on offer?** (owner, 2026-10-10: a Generate that also asks every question, wrapped in
 * `console.profile`, guarded out of production and overridable when he wants it there.)
 *
 * On in `pnpm dev`; off in a production build and in the unit tests. Switched on in a build by any one of:
 *
 * - `VITE_PROFILING=1` at build time;
 * - `?profiling=1` in the address (`?profiling=0` switches it off again, for the dev server);
 * - `localStorage['pyrrhic.profiling'] = '1'` (`'0'` switches it off), which survives a reload.
 *
 * The run itself lives in `profileRun.ts` and is imported on the press, so a build that never presses the
 * button never loads it.
 */
const STORAGE_KEY = 'pyrrhic.profiling';

function queryFlag(): string | null {
  try {
    return new URLSearchParams(globalThis.location?.search ?? '').get('profiling');
  } catch {
    return null;
  }
}

function storedFlag(): string | null {
  try {
    return globalThis.localStorage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function profilingEnabled(): boolean {
  const override = queryFlag() ?? storedFlag();
  if (override === '1') return true;
  if (override === '0') return false;
  if (import.meta.env.VITE_PROFILING === '1') return true;
  return import.meta.env.DEV && import.meta.env.MODE !== 'test';
}
