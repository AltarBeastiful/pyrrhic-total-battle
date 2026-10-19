// @vitest-environment jsdom
/**
 * The top app bar after spike 0009: brand, menu and account, full stop. The test is mostly a guard
 * against the bar growing a second job again — it carried the figures and Generate until V1 was
 * adopted, and design rule 5 (do not duplicate) is what took them out.
 */
import { cleanup, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test } from 'vitest';

import { newRoot } from '@/state/defaults';
import { useStore } from '@/state/store';

import { renderWithTheme } from '../kit/testRender';
import { AppBar } from './AppBar';

beforeEach(() => {
  useStore.getState().replaceDocument(newRoot());
});

afterEach(() => {
  cleanup();
});

test('the bar is the banner, and the brand is the page’s one H1', () => {
  renderWithTheme(<AppBar />);
  const banner = screen.getByRole('banner');

  const brand = within(banner).getByRole('heading', { level: 1 });
  expect(brand.textContent).toBe('Pyrrhic');
});

test('the controls in it are the menu and the account icon', () => {
  renderWithTheme(<AppBar />);
  const banner = screen.getByRole('banner');

  expect(within(banner).getByRole('button', { name: 'Menu' })).toBeTruthy();
  // Nothing else: no Generate, no figures, no jump bar (design plan §5.1, `v4-desktop.jpg`).
  expect(within(banner).getByRole('button', { name: /^Profiles and account/ })).toBeTruthy();
  expect(within(banner).getAllByRole('button')).toHaveLength(2);
  expect(screen.queryByRole('button', { name: /Generate/ })).toBeNull();
});

test('the menu button sits next to the brand, before the account icon', () => {
  renderWithTheme(<AppBar />);
  const banner = screen.getByRole('banner');
  const [first, second] = within(banner).getAllByRole('button');
  expect(first?.getAttribute('aria-label')).toBe('Menu');
  expect(second?.getAttribute('aria-label')).toMatch(/^Profiles and account/);
});
