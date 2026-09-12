import { useState, useSyncExternalStore } from 'react';

import { Button } from '@/ui/primitives';

import { applyUpdate, isUpdateReady, subscribeToUpdate } from './register';

/**
 * "Update available — reload", shown once a newly deployed service worker is installed and
 * waiting. Nothing is swapped behind the user's back: the new version takes over only when the
 * reload is accepted, so a long search is never interrupted mid-run.
 */
export function UpdateToast() {
  const ready = useSyncExternalStore(subscribeToUpdate, isUpdateReady, () => false);
  const [dismissed, setDismissed] = useState(false);

  if (!ready || dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-line bg-surface pointer-events-auto flex items-center gap-3 rounded-xl border px-3 py-2 shadow-lg"
    >
      <span className="text-sm">A new version of Pyrrhic is available.</span>
      <Button variant="primary" size="sm" onClick={applyUpdate}>
        Reload
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          setDismissed(true);
        }}
      >
        Later
      </Button>
    </div>
  );
}
