import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/App';
import '@/index.css';
import { createLocalStorageAdapter } from '@/state/storage';
import { initPersistence, useStore } from '@/state/store';
import { consumeShareFragment } from '@/ui/shareFragment';
import { applyTheme } from '@/ui/theme';
import { trackUnsavedChanges, withSaveTracking } from '@/ui/uiStore';

// `initPersistence` runs `loadStore(adapter)` (migrate, validate, quarantine a corrupt document) and
// then keeps writing the document back, debounced. The wrapper adds the "saved / unsaved" signal.
const adapter = withSaveTracking(createLocalStorageAdapter());
initPersistence(adapter);
trackUnsavedChanges();
applyTheme(useStore.getState().doc.ui.theme);

// A share link is decoded before the first paint and parked in the UI store; `LoadSharedDialog` asks
// what to do with it, and the fragment is stripped from the address bar straight away (ADR-0005).
void consumeShareFragment();

const container = document.getElementById('root');
if (!container) {
  throw new Error('Missing #root element in index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
