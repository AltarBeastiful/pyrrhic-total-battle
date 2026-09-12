// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { App } from '@/App';

afterEach(() => {
  cleanup();
});

test('renders the application heading', () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1, name: 'Pyrrhic' })).toBeTruthy();
});
