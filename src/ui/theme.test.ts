// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest';

import { applyTheme, resolveTheme, systemTheme, watchSystemTheme } from './theme';

afterEach(() => {
  delete document.documentElement.dataset.theme;
});

test('an explicit theme is written to the document', () => {
  applyTheme('dark');
  expect(document.documentElement.dataset.theme).toBe('dark');
  applyTheme('light');
  expect(document.documentElement.dataset.theme).toBe('light');
});

test('"system" resolves to the OS preference, and to light when it cannot be read', () => {
  // jsdom has no matchMedia: the fallback must be light rather than a crash.
  expect(systemTheme()).toBe('light');
  expect(resolveTheme('system')).toBe('light');
  applyTheme('system');
  expect(document.documentElement.dataset.theme).toBe('light');
});

test('watching the OS preference is a no-op when matchMedia is missing', () => {
  const stop = watchSystemTheme(() => 'system');
  expect(typeof stop).toBe('function');
  stop();
});
