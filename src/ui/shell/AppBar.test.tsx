// @vitest-environment jsdom
/**
 * The top app bar after spike 0009: brand and account, full stop. The test is mostly a guard
 * against the bar growing a second job again — it carried the figures and Generate until V1 was
 * adopted, and design rule 5 (do not duplicate) is what took them out.
 */
import { act, cleanup, screen, within } from '@testing-library/react';
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

test('the one control in it is the account, named after the profile', () => {
  renderWithTheme(<AppBar />);
  const banner = screen.getByRole('banner');

  expect(within(banner).getByRole('button', { name: 'Account: My account' })).toBeTruthy();
  // Nothing else: no Generate, no figures, no jump bar (design plan §5.1, `v4-desktop.jpg`).
  expect(within(banner).getAllByRole('button')).toHaveLength(1);
  expect(screen.queryByRole('button', { name: /Generate/ })).toBeNull();
});

test('the account trigger follows the profile it names', () => {
  renderWithTheme(<AppBar />);
  const id = useStore.getState().doc.profiles[0]?.id;
  if (id === undefined) throw new Error('no profile to rename');
  act(() => {
    useStore.getState().renameProfile(id, 'Second account');
  });

  expect(screen.getByRole('button', { name: 'Account: Second account' })).toBeTruthy();
});
