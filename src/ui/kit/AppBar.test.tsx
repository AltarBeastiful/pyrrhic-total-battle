// @vitest-environment jsdom
import { Button } from '@mantine/core';
import { cleanup, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { AppBar } from './AppBar';
import { renderWithTheme } from './testRender';

afterEach(cleanup);

test('the bar is the page banner and carries brand, answer and actions', () => {
  renderWithTheme(
    <AppBar brand={<span>Pyrrhic</span>} actions={<Button>Generate</Button>}>
      <span>15 143 235 damage</span>
    </AppBar>,
  );
  const banner = screen.getByRole('banner');
  expect(banner).toBeTruthy();
  expect(banner.textContent).toContain('Pyrrhic');
  expect(banner.textContent).toContain('15 143 235 damage');
  expect(screen.getByRole('button', { name: 'Generate' })).toBeTruthy();
});
