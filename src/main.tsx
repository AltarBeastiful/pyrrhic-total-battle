import { MantineProvider } from '@mantine/core';
import { StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/App';
import '@mantine/core/styles.css';
import '@/ui/global.css';
import { accountErrorMessage, appRootUrl, isAccountConfigured, readCallback } from '@/account/client';
import { trackAccountChanges, useAccountStore } from '@/account/state';
import { captureInstallPrompt } from '@/pwa/install';
import { requestPersistentStorage } from '@/pwa/persist';
import { registerServiceWorker } from '@/pwa/register';
import { createLocalStorageAdapter } from '@/state/storage';
import { initPersistence, useStore } from '@/state/store';
import { consumeShareFragment } from '@/ui/shareFragment';
import { applyTheme, cssVariablesResolver, documentColorSchemeManager, theme } from '@/ui/theme';
import { trackUnsavedChanges, withSaveTracking } from '@/ui/uiStore';

// `initPersistence` runs `loadStore(adapter)` (migrate, validate, quarantine a corrupt document) and
// then keeps writing the document back, debounced. The wrapper adds the "saved / unsaved" signal.
const adapter = withSaveTracking(createLocalStorageAdapter());
initPersistence(adapter);
trackUnsavedChanges();
// After the document is loaded, so the load itself is not mistaken for an edit (S-49b).
trackAccountChanges();
applyTheme(useStore.getState().doc.ui.theme);

// Offline support (S-50): the worker is registered on `load` and skipped in `pnpm dev` unless
// VITE_PWA_DEV=1; the install event is captured here because the browser fires it once, early.
registerServiceWorker();
captureInstallPrompt();
// Ask the browser to keep this origin's storage (spec §5.7): the local document is the source of
// truth, and Safari evicts it after seven days of no interaction on a site that is not installed.
void requestPersistentStorage();

// A share link is decoded before the first paint and parked in the UI store; `LoadSharedDialog` asks
// what to do with it, and the fragment is stripped from the address bar straight away (ADR-0005).
void consumeShareFragment();

const container = document.getElementById('root');
if (!container) {
  throw new Error('Missing #root element in index.html');
}
const root = createRoot(container);

/** One React root for the whole page: a callback page and the app take turns in it, never stack. */
function render(node: ReactNode): void {
  root.render(
    <StrictMode>
      <MantineProvider
        theme={theme}
        cssVariablesResolver={cssVariablesResolver}
        colorSchemeManager={documentColorSchemeManager()}
        defaultColorScheme="light"
      >
        {node}
      </MantineProvider>
    </StrictMode>,
  );
}

function mount(): void {
  render(<App />);
}

/**
 * Leave a callback page: the one-time token goes out of the address bar first, then the app mounts
 * and the stored session is revalidated — a confirmation that has just been accepted is how the
 * account menu learns the address is confirmed.
 */
function backToApp(): void {
  window.history.replaceState(null, '', appRootUrl());
  mount();
  void useAccountStore.getState().restore();
}

/**
 * The three addresses that are an answer to something the account started elsewhere (S-49b, spec
 * §5.2): Google coming back, and the two links the backend's emails carry.
 *
 * They are real paths, served by the build-time copy of `index.html` to `404.html`
 * (`scripts/postbuild-404.mjs`) — Google forbids a fragment in a redirect URI, and a link in an
 * email should not carry one either. They are handled here rather than in a component because there
 * is no router in this app and because the one-time token must leave the address bar before anything
 * can copy it.
 *
 * Nothing about this blocks a normal start: the check is a synchronous look at the address.
 */
const callback = isAccountConfigured() ? readCallback() : null;

if (callback === null) {
  mount();
  // Revalidate a stored token (spec §5.1). Does nothing, and loads nothing, without one.
  void useAccountStore.getState().restore();
} else if (callback.kind === 'oauth') {
  void (async () => {
    try {
      const { completeGoogleSignIn } = await import('@/account/auth');
      const user = await completeGoogleSignIn();
      window.history.replaceState(null, '', appRootUrl());
      await useAccountStore.getState().adopt(user);
    } catch (error) {
      window.history.replaceState(null, '', appRootUrl());
      useAccountStore.setState({ error: accountErrorMessage(error) });
    } finally {
      mount();
    }
  })();
} else {
  // A page with one question in it, in place of the app. The chunk is fetched only here, so a normal
  // start never pays for it.
  const { kind, token } = callback;
  void import('@/ui/account/CallbackPages')
    .then(({ PasswordResetPage, VerifyEmailPage }) => {
      if (kind === 'password-reset') {
        render(
          <PasswordResetPage
            token={token}
            onDone={() => {
              backToApp();
              // The new password is the one to sign in with, so ask for it straight away.
              useAccountStore.getState().setDialog('signin');
            }}
          />,
        );
        return;
      }
      render(<VerifyEmailPage token={token} onDone={backToApp} />);
    })
    .catch(() => {
      // The account chunk could not be fetched: the app itself is still perfectly usable.
      backToApp();
    });
}
