/**
 * The one question the frame asks the browser: how wide is it. (It used to ask about motion too, for
 * the scroll a Generate started; nothing scrolls the page on the player's behalf any more.)
 *
 * `useSyncExternalStore` rather than an effect and a piece of state: the answer is read during the
 * first render (so the frame never paints the wrong column first) and the subscription is the
 * media query's own `change` event. Everything is guarded — jsdom and the service worker's global
 * have no `matchMedia`, and a test that renders the shell must not care.
 */
import { useCallback, useSyncExternalStore } from 'react';

/**
 * M3's *large* window, Mantine's `lg` breakpoint: from here the March is the 360 dp supporting pane
 * beside the page and there is no bottom bar. Below it the page is the setup alone, the answer and
 * Generate are in the bottom app bar, and the March is the sheet that opens from it.
 */
export const TWO_PANES = '(min-width: 1200px)';

function list(query: string): MediaQueryList | null {
  if (typeof globalThis.matchMedia !== 'function') return null;
  return globalThis.matchMedia(query);
}

/** Answer the query once, outside React. */
function matches(query: string): boolean {
  return list(query)?.matches === true;
}

/** Answer the query and re-render when it changes. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = list(query);
      if (media === null) return () => undefined;
      media.addEventListener('change', onChange);
      return () => {
        media.removeEventListener('change', onChange);
      };
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => matches(query),
    () => false,
  );
}
