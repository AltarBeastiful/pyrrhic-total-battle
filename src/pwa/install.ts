/**
 * The `beforeinstallprompt` event, kept for the "Install app" button.
 *
 * The browser fires it once, early, and only when it considers the app installable; a component
 * that mounts later would miss it. So the event is captured at start-up (from `main.tsx`) and
 * components subscribe, the same shape as `register.ts`.
 */

/** Not in lib.dom: Chromium-only, and deliberately narrow — only what the button uses. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const listeners = new Set<() => void>();

let deferred: BeforeInstallPromptEvent | null = null;
let capturing = false;

function notify(): void {
  for (const listener of listeners) listener();
}

/** Subscribe to "this browser can install the app"; returns the unsubscribe function. */
export function subscribeToInstall(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isInstallAvailable(): boolean {
  return deferred !== null;
}

/** Starts listening. Safe to call more than once; does nothing outside a browser. */
export function captureInstallPrompt(): void {
  if (capturing || typeof window === 'undefined') return;
  capturing = true;

  window.addEventListener('beforeinstallprompt', (event) => {
    // Suppress the browser's own mini-infobar; the in-app button takes over.
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

/** Shows the browser's install dialog. The event is single-use, so the button goes away after. */
export async function promptInstall(): Promise<void> {
  const event = deferred;
  if (!event) return;
  deferred = null;
  notify();
  try {
    await event.prompt();
  } catch (error) {
    console.warn('Pyrrhic: the install prompt was not shown.', error);
  }
}
