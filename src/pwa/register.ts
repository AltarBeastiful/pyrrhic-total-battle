/**
 * Service-worker registration and the "an update is waiting" signal behind the account menu's "Update available" row.
 *
 * Registration lives outside React (it is called from `main.tsx`) so it happens once per page,
 * not once per mount, and so `<StrictMode>`'s double effects cannot register twice. Components
 * read the state through `useSyncExternalStore`.
 */

/** Must match the constant of the same purpose in `public/sw.js`. */
const SKIP_WAITING = 'pyrrhic:skip-waiting';

/** How long to wait for the new worker to take control before reloading anyway. */
const TAKEOVER_TIMEOUT_MS = 3_000;

const listeners = new Set<() => void>();

let updateReady = false;
let waitingWorker: ServiceWorker | null = null;
let started = false;
let reloading = false;
let updateAccepted = false;

function announce(worker: ServiceWorker): void {
  waitingWorker = worker;
  if (updateReady) return;
  updateReady = true;
  for (const listener of listeners) listener();
}

function reloadOnce(): void {
  if (reloading) return;
  reloading = true;
  window.location.reload();
}

/** Subscribe to "a new version is waiting"; returns the unsubscribe function. */
export function subscribeToUpdate(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isUpdateReady(): boolean {
  return updateReady;
}

/**
 * Let the waiting worker take over, then reload onto the new version. This is the *only* thing
 * that ever reloads the page: `clients.claim()` in the worker also fires `controllerchange` on a
 * first visit, and reloading there would throw away the share-link fragment `main.tsx` has just
 * consumed and any edit not yet written by the debounced save.
 */
export function applyUpdate(): void {
  updateAccepted = true;
  if (!waitingWorker) {
    reloadOnce();
    return;
  }
  waitingWorker.postMessage({ type: SKIP_WAITING });
  // `controllerchange` normally gets there first; this is the safety net so the button always works.
  window.setTimeout(reloadOnce, TAKEOVER_TIMEOUT_MS);
}

/**
 * Registers `sw.js`, which sits next to `index.html`: resolving it against the document URL is
 * what makes the same bundle work at a domain root and under a GitHub Pages sub-path.
 *
 * Does nothing during `pnpm dev` unless `VITE_PWA_DEV=1`, because a worker that precaches a dev
 * server's modules only gets in the way of hot reloading.
 */
export function registerServiceWorker(): void {
  if (started) return;
  if (import.meta.env.DEV && import.meta.env.VITE_PWA_DEV !== '1') return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  // Workers need a secure context; opening the bundle from disk (file://) is explicitly supported.
  if (!window.isSecureContext) return;
  started = true;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // Not on the first install: only once the user has accepted the update toast.
    if (updateAccepted) reloadOnce();
  });

  const start = (): void => {
    void register();
  };
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
}

async function register(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.register(new URL('sw.js', document.baseURI));
    // A blocked registration (enterprise policy, a test harness, private browsing) can resolve
    // with nothing at all rather than rejecting.
    if (!registration) return;

    // A worker already waiting from an earlier visit. `controller` tells the first install
    // (nothing to announce: the page is already running the only version there is) from an update.
    if (registration.waiting && navigator.serviceWorker.controller) {
      announce(registration.waiting);
    }

    registration.addEventListener('updatefound', () => {
      const installing = registration.installing;
      if (!installing) return;
      installing.addEventListener('statechange', () => {
        if (installing.state === 'installed' && navigator.serviceWorker.controller) {
          announce(installing);
        }
      });
    });
  } catch (error) {
    // Offline support is a bonus, never a requirement: the app works without it.
    console.warn('Pyrrhic: offline support is unavailable.', error);
  }
}
