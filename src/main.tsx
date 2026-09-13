import { MantineProvider } from '@mantine/core';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/App';
// The layer order is declared by `global.css` and has to reach the bundler before either of the
// stylesheets it orders, so this import comes first (see the comment at the top of that file).
import '@/ui/global.css';
import '@mantine/core/styles.layer.css';
import '@/index.css';
import { captureInstallPrompt } from '@/pwa/install';
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
applyTheme(useStore.getState().doc.ui.theme);

// Offline support (S-50): the worker is registered on `load` and skipped in `pnpm dev` unless
// VITE_PWA_DEV=1; the install event is captured here because the browser fires it once, early.
registerServiceWorker();
captureInstallPrompt();

// A share link is decoded before the first paint and parked in the UI store; `LoadSharedDialog` asks
// what to do with it, and the fragment is stripped from the address bar straight away (ADR-0005).
void consumeShareFragment();

const container = document.getElementById('root');
if (!container) {
  throw new Error('Missing #root element in index.html');
}

createRoot(container).render(
  <StrictMode>
    <MantineProvider
      theme={theme}
      cssVariablesResolver={cssVariablesResolver}
      colorSchemeManager={documentColorSchemeManager()}
      defaultColorScheme="light"
    >
      <App />
    </MantineProvider>
  </StrictMode>,
);
