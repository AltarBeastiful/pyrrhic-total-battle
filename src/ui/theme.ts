/**
 * Theme application. The stored preference is `system | light | dark`; "system" is resolved to a
 * concrete value and written to `data-theme` on `<html>` so that Tailwind's `dark:` variant, the CSS
 * tokens and the native form controls (`color-scheme`) all agree.
 */
import type { Theme } from '@/state/schema';

export type ResolvedTheme = 'light' | 'dark';

const DARK_QUERY = '(prefers-color-scheme: dark)';

function media(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null;
  return window.matchMedia(DARK_QUERY);
}

export function systemTheme(): ResolvedTheme {
  return media()?.matches === true ? 'dark' : 'light';
}

export function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === 'system' ? systemTheme() : theme;
}

export function applyTheme(
  theme: Theme,
  root: HTMLElement | null = globalThis.document?.documentElement,
): void {
  if (!root) return;
  root.dataset.theme = resolveTheme(theme);
}

/**
 * Keep the document in sync while the OS preference changes. `currentTheme` is read on every event
 * so the subscription survives a preference change in the store.
 */
export function watchSystemTheme(currentTheme: () => Theme): () => void {
  const query = media();
  if (!query) return () => undefined;
  const listener = (): void => {
    if (currentTheme() === 'system') applyTheme('system');
  };
  query.addEventListener('change', listener);
  return () => {
    query.removeEventListener('change', listener);
  };
}
