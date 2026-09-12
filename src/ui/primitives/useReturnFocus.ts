import { useState } from 'react';

/**
 * Puts focus back where it came from when a dialog or a drawer closes.
 *
 * Radix returns focus to its own `Dialog.Trigger`, and nothing in this app uses one — every dialog
 * is opened from state, by a gear, a pill or a menu button — so without this the focus would land on
 * `<body>` and a keyboard player would have to walk the page again. The opener is captured while
 * rendering the first open frame, before Radix pulls focus into the panel.
 *
 * Returns the `onCloseAutoFocus` handler to hand to `Dialog.Content`.
 */
export function useReturnFocus(open: boolean): (event: Event) => void {
  const [wasOpen, setWasOpen] = useState(false);
  const [opener, setOpener] = useState<HTMLElement | null>(null);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setOpener(document.activeElement as HTMLElement | null);
  }

  return (event: Event) => {
    if (opener === null || opener === document.body || !opener.isConnected) return;
    event.preventDefault();
    opener.focus();
  };
}
