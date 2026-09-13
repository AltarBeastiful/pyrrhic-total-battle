/**
 * The two questions the frame asks the browser: how wide is it, and does this player want motion.
 *
 * `useSyncExternalStore` rather than an effect and a piece of state: the answer is read during the
 * first render (so the frame never paints the wrong column first) and the subscription is the
 * media query's own `change` event. Everything is guarded — jsdom and the service worker's global
 * have no `matchMedia`, and a test that renders the shell must not care.
 */
import { useCallback, useSyncExternalStore } from 'react';

/**
 * Below this width the page is one column: the march sits under the setup and the answer and
 * Generate are in the bottom app bar (design plan §5.1, frame V1).
 */
export const ONE_COLUMN = '(max-width: 1199px)';
/**
 * M3's *large* window, Mantine's `lg` breakpoint: from here the March is the 360 dp supporting pane
 * beside the page and there is no bottom bar.
 */
export const TWO_PANES = '(min-width: 1200px)';
/** Material 3's medium window: from here a card has room for a second column. */
export const MEDIUM = '(min-width: 600px)';
export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function list(query: string): MediaQueryList | null {
  if (typeof globalThis.matchMedia !== 'function') return null;
  return globalThis.matchMedia(query);
}

/** Answer the query once, outside React (event handlers, plain functions). */
export function mediaMatches(query: string): boolean {
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
    () => mediaMatches(query),
    () => false,
  );
}
