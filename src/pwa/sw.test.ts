/**
 * The routing decisions of the real `public/sw.js`, run as the browser runs it.
 *
 * The worker is plain JavaScript served verbatim, so it cannot import anything from `src/` and
 * cannot be tested by importing it. Instead the file is rendered exactly as the build renders it
 * (`renderServiceWorker`) and evaluated against a stub scope; what is asserted is whether the fetch
 * handler takes the request over at all.
 *
 * The one that matters is ADR-0009 / spec §5.6: the account backend is NetworkOnly. A cached profile
 * pull served after a save on another device is a silent conflict loop.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from 'vitest';

import { renderServiceWorker, SERVICE_WORKER_FILE } from './precache';

const TEMPLATE = readFileSync(path.join(process.cwd(), 'public', SERVICE_WORKER_FILE), 'utf8');
const ORIGIN = 'https://example.github.io/pyrrhic/';

type FetchHandler = (event: FakeFetchEvent) => void;

interface FakeFetchEvent {
  request: Request;
  respondWith: (response: unknown) => void;
  waitUntil: (promise: unknown) => void;
}

/** Evaluate the rendered worker and hand back its `fetch` listener. */
function loadWorker(backendOrigin: string): FetchHandler {
  const source = renderServiceWorker(TEMPLATE, ['index.html'], 'testcache', backendOrigin);
  const listeners = new Map<string, FetchHandler>();
  const scope = {
    location: new URL(SERVICE_WORKER_FILE, ORIGIN),
    addEventListener: (type: string, handler: FetchHandler) => listeners.set(type, handler),
    clients: { claim: () => Promise.resolve() },
    skipWaiting: () => Promise.resolve(),
  };
  const caches = {
    open: () => Promise.resolve({ match: () => Promise.resolve(undefined), put: () => Promise.resolve() }),
    keys: () => Promise.resolve([]),
    delete: () => Promise.resolve(true),
  };
  // The worker is evaluated, not imported: it is plain JS served verbatim and has no module shape.
  new Function('self', 'caches', 'fetch', source)(scope, caches, () => Promise.resolve(new Response('')));
  const handler = listeners.get('fetch');
  if (!handler) throw new Error('the worker registered no fetch listener');
  return handler;
}

/** True when the worker took the request over (and would therefore consult its cache). */
function handles(handler: FetchHandler, url: string): boolean {
  let taken = false;
  handler({
    request: new Request(url),
    respondWith: () => {
      taken = true;
    },
    waitUntil: () => undefined,
  });
  return taken;
}

test('the account backend is never handled by the worker', () => {
  const handler = loadWorker('https://pyrrhic-backend.dynu.net');
  expect(handles(handler, 'https://pyrrhic-backend.dynu.net/api/app/profile')).toBe(false);
  expect(handles(handler, 'https://pyrrhic-backend.dynu.net/api/collections/profiles/records')).toBe(false);
});

test('the app itself is still served from the cache', () => {
  const handler = loadWorker('https://pyrrhic-backend.dynu.net');
  expect(handles(handler, `${ORIGIN}assets/index-abc123.js`)).toBe(true);
});

test('another origin is left alone, backend or not', () => {
  const handler = loadWorker('');
  expect(handles(handler, 'https://api.github.com/gists')).toBe(false);
  expect(handles(handler, `${ORIGIN}assets/index-abc123.js`)).toBe(true);
});

test('a same-origin backend is bypassed too, which a cross-origin check alone would not do', () => {
  const handler = loadWorker(new URL(ORIGIN).origin);
  expect(handles(handler, `${ORIGIN}assets/index-abc123.js`)).toBe(false);
});
