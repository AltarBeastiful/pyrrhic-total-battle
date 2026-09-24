/**
 * Precache list for the hand-written service worker.
 *
 * Kept apart from `vite.config.ts` (which is where the plugin that calls it lives) so that the
 * rules — what is cached, what is never cached, in which order — can be unit-tested without
 * running a build. Everything here is pure string work: no node APIs, no file system.
 */

/** The service worker's own file name, relative to the build output root. */
export const SERVICE_WORKER_FILE = 'sw.js';

/** The document the worker falls back to when a navigation cannot reach the network. */
export const APP_SHELL_FILE = 'index.html';

/**
 * What is worth precaching. Everything the app needs to start and calculate offline is a script,
 * a stylesheet, the shell document, the manifest or an icon; anything else (source maps above all)
 * would only inflate the install.
 */
const PRECACHEABLE = new Set([
  'css',
  'html',
  'ico',
  'js',
  'json',
  'png',
  'svg',
  // The AssemblyScript kernel the calculation worker loads (AssemblyScript roadmap, step 2): offline, the
  // plan runs on it as it does online.
  'wasm',
  'webmanifest',
  'woff',
  'woff2',
]);

/** Never precached: the worker itself (the browser fetches it), and source maps. */
const EXCLUDED = new Set([SERVICE_WORKER_FILE, `${SERVICE_WORKER_FILE}.map`]);

function normalise(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\.?\//, '');
}

function extensionOf(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1);
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
}

/**
 * Turns the emitted build output plus the verbatim `public/` files into the list the worker
 * installs. Paths stay relative to the build root so the worker can resolve them against its own
 * URL, which is what makes the same bundle work at a domain root and under a Pages sub-path.
 */
export function buildPrecacheList(files: Iterable<string>): string[] {
  const kept = new Set<string>();
  for (const file of files) {
    const path = normalise(file);
    if (path === '' || path.startsWith('../')) continue;
    if (EXCLUDED.has(path)) continue;
    if (!PRECACHEABLE.has(extensionOf(path))) continue;
    kept.add(path);
  }
  // The shell first (it is the one entry a cold offline start cannot do without), then the rest in
  // a stable order so an unchanged build produces a byte-identical worker.
  const rest = [...kept].filter((path) => path !== APP_SHELL_FILE).sort();
  return kept.has(APP_SHELL_FILE) ? [APP_SHELL_FILE, ...rest] : rest;
}

const MANIFEST_MARKER = /\/\* precache-manifest \*\/\s*\[[^\]]*\]/;
const VERSION_MARKER = /\/\* precache-version \*\/\s*'[^']*'/;
const BACKEND_MARKER = /\/\* backend-origin \*\/\s*'[^']*'/;

/** An origin and nothing else: no path, no query, no trailing slash. */
export function normaliseBackendOrigin(value: string | undefined): string {
  const trimmed = (value ?? '').trim();
  if (trimmed === '') return '';
  try {
    return new URL(trimmed).origin;
  } catch {
    throw new Error(`${SERVICE_WORKER_FILE}: VITE_BACKEND_ORIGIN is not a URL (${JSON.stringify(trimmed)})`);
  }
}

/**
 * Substitutes the precache list, the cache version and the account backend's origin into the worker
 * template (`public/sw.js`, which is also what the dev server serves as-is). The backend origin is
 * what the worker refuses to cache (ADR-0009, spec §5.6); an empty one means this build has no
 * account.
 */
export function renderServiceWorker(
  template: string,
  files: readonly string[],
  version: string,
  backendOrigin = '',
): string {
  if (!MANIFEST_MARKER.test(template)) {
    throw new Error(`${SERVICE_WORKER_FILE}: the /* precache-manifest */ marker is missing`);
  }
  if (!VERSION_MARKER.test(template)) {
    throw new Error(`${SERVICE_WORKER_FILE}: the /* precache-version */ marker is missing`);
  }
  if (!/^[A-Za-z0-9._-]+$/.test(version)) {
    throw new Error(`${SERVICE_WORKER_FILE}: unusable cache version ${JSON.stringify(version)}`);
  }
  if (!BACKEND_MARKER.test(template)) {
    throw new Error(`${SERVICE_WORKER_FILE}: the /* backend-origin */ marker is missing`);
  }
  const backend = normaliseBackendOrigin(backendOrigin);
  // Function replacements: a `$` in a file name must not be read as a capture reference.
  return template
    .replace(MANIFEST_MARKER, () => `/* precache-manifest */ ${JSON.stringify(files)}`)
    .replace(VERSION_MARKER, () => `/* precache-version */ '${version}'`)
    .replace(BACKEND_MARKER, () => `/* backend-origin */ '${backend}'`);
}
