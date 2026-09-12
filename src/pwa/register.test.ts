// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';

/**
 * The reload guard. `public/sw.js` calls `clients.claim()`, so `controllerchange` also fires on a
 * first visit — reloading there would drop the `#c=…` share fragment `main.tsx` has just consumed
 * and any edit still sitting in the debounced save.
 */

class FakeWorker extends EventTarget {
  readonly posted: unknown[] = [];
  state = 'installed';
  postMessage(message: unknown): void {
    this.posted.push(message);
  }
}

class FakeRegistration extends EventTarget {
  waiting: FakeWorker | null = null;
  installing: FakeWorker | null = null;
}

let container: EventTarget & { controller: unknown; register: ReturnType<typeof vi.fn> };
let registration: FakeRegistration;
let reload: ReturnType<typeof vi.fn>;
const realLocation = window.location;

/** A fresh copy of the module: its "already registered" state is module-level on purpose. */
async function loadModule() {
  vi.resetModules();
  return await import('./register');
}

beforeEach(() => {
  vi.stubEnv('VITE_PWA_DEV', '1');
  registration = new FakeRegistration();
  reload = vi.fn();

  const target = new EventTarget();
  container = Object.assign(target, {
    controller: null as unknown,
    register: vi.fn(() => Promise.resolve(registration)),
  });

  Object.defineProperty(navigator, 'serviceWorker', { value: container, configurable: true });
  Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
  // jsdom's `location.reload` is read-only, so the whole `location` is swapped for the test.
  Object.defineProperty(window, 'location', {
    value: { ...realLocation, reload },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  Object.defineProperty(window, 'location', { value: realLocation, configurable: true, writable: true });
  vi.unstubAllEnvs();
});

test('a first install claiming the page does not reload it', async () => {
  const { registerServiceWorker } = await loadModule();
  registerServiceWorker();
  await vi.waitFor(() => expect(container.register).toHaveBeenCalled());

  // What `clients.claim()` produces on a first visit: a controller where there was none.
  container.controller = new FakeWorker();
  container.dispatchEvent(new Event('controllerchange'));

  expect(reload).not.toHaveBeenCalled();
});

test('the page reloads on controllerchange only once the update toast was accepted', async () => {
  const { applyUpdate, isUpdateReady, registerServiceWorker, subscribeToUpdate } = await loadModule();

  // An update: a worker is already waiting and this page is controlled by the previous one.
  container.controller = new FakeWorker();
  registration.waiting = new FakeWorker();

  const changed = vi.fn();
  subscribeToUpdate(changed);
  registerServiceWorker();
  await vi.waitFor(() => expect(isUpdateReady()).toBe(true));
  expect(changed).toHaveBeenCalled();

  // Still nothing before the user accepts.
  container.dispatchEvent(new Event('controllerchange'));
  expect(reload).not.toHaveBeenCalled();

  applyUpdate();
  expect(registration.waiting.posted).toEqual([{ type: 'pyrrhic:skip-waiting' }]);

  container.dispatchEvent(new Event('controllerchange'));
  expect(reload).toHaveBeenCalledTimes(1);

  // A second event (or the safety-net timer) must not reload again.
  container.dispatchEvent(new Event('controllerchange'));
  expect(reload).toHaveBeenCalledTimes(1);
});

test('no update is announced when the page has no controller yet', async () => {
  const { isUpdateReady, registerServiceWorker } = await loadModule();
  registration.waiting = new FakeWorker();
  registerServiceWorker();
  await vi.waitFor(() => expect(container.register).toHaveBeenCalled());

  expect(isUpdateReady()).toBe(false);
  expect(reload).not.toHaveBeenCalled();
});

test('a blocked registration that resolves with nothing is survivable', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  container.register = vi.fn(() => Promise.resolve(undefined));

  const { isUpdateReady, registerServiceWorker } = await loadModule();
  registerServiceWorker();
  await vi.waitFor(() => expect(container.register).toHaveBeenCalled());

  expect(isUpdateReady()).toBe(false);
  expect(warn).not.toHaveBeenCalled();
});

test('nothing is registered during pnpm dev without VITE_PWA_DEV=1', async () => {
  vi.stubEnv('VITE_PWA_DEV', '');
  const { registerServiceWorker } = await loadModule();
  registerServiceWorker();
  expect(container.register).not.toHaveBeenCalled();
});
