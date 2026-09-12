/*
 * Pyrrhic's service worker — hand-written, no Workbox, no runtime dependency.
 *
 * It is served from `public/` so the dev server can hand it out unchanged (`VITE_PWA_DEV=1`);
 * `pnpm build` rewrites the two markers below with the real file list and a content hash
 * (see the `pyrrhic:pwa-precache` plugin in vite.config.ts and src/pwa/precache.ts).
 *
 * Policy, matching ADR-0002 (nothing leaves the browser): the worker only ever touches URLs on
 * its own origin. Navigations are network-first so a freshly deployed index.html is picked up,
 * falling back to the precached shell when there is no network; hashed assets are cache-first
 * because their name changes whenever their content does.
 */

const PRECACHE = /* precache-manifest */ [];
const VERSION = /* precache-version */ 'dev';

const CACHE_NAME = `pyrrhic-${VERSION}`;
const CACHE_PREFIX = 'pyrrhic-';
const SHELL_URL = new URL('index.html', self.location.href).href;
const SKIP_WAITING = 'pyrrhic:skip-waiting';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(
        // `reload` skips the HTTP cache: the install must fetch what was just deployed.
        PRECACHE.map((path) => new Request(new URL(path, self.location.href).href, { cache: 'reload' })),
      ),
    ),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

// The waiting worker takes over only when the user accepts the in-app "Update available" toast,
// so a running search never has its chunks swapped underneath it (see src/pwa/register.ts).
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === SKIP_WAITING) {
    void self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  // Chrome's devtools issue these; letting them through the cache logs a console error.
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // never proxy another origin

  event.respondWith(request.mode === 'navigate' ? handleNavigate(event) : handleAsset(event));
});

/** Network-first: the newest index.html wins, the precached shell keeps the app usable offline. */
async function handleNavigate(event) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(event.request);
    if (response.ok) {
      const copy = response.clone();
      event.waitUntil(cache.put(SHELL_URL, copy));
    }
    return response;
  } catch {
    const cached = (await cache.match(SHELL_URL)) || (await cache.match(event.request));
    return (
      cached ||
      new Response('Pyrrhic is offline and has not been stored in this browser yet.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    );
  }
}

/** Cache-first: every built asset carries a content hash in its name, so a hit is never stale. */
async function handleAsset(event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(event.request);
  if (cached) return cached;
  try {
    const response = await fetch(event.request);
    if (response.ok && response.type === 'basic') {
      const copy = response.clone();
      event.waitUntil(cache.put(event.request, copy));
    }
    return response;
  } catch {
    return Response.error();
  }
}
