// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { renderWithTheme } from '../kit/testRender';
import { GroupMarker } from './GroupMarker';

afterEach(cleanup);

test('the bar alone still announces the group', () => {
  renderWithTheme(<GroupMarker group="guardsmen" />);
  expect(screen.getByText('Guardsmen')).toBeTruthy();
});

test('a visible label replaces the announced one', () => {
  renderWithTheme(<GroupMarker group="monsters" label="Monsters M3–M5" />);
  expect(screen.getByText('Monsters M3–M5')).toBeTruthy();
  expect(screen.queryByText('Monsters')).toBeNull();
});
