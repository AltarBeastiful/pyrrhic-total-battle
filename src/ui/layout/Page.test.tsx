// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { Page } from './Page';

afterEach(() => {
  cleanup();
});

test('the page frame has gutters, a measure and room under the floating button', () => {
  render(<Page data-testid="page">content</Page>);
  const page = screen.getByTestId('page');
  expect(page.className.split(' ')).toEqual(
    expect.arrayContaining(['mx-auto', 'w-full', 'max-w-7xl', 'px-4', 'sm:px-6', 'pb-24']),
  );
  expect(page.textContent).toBe('content');
});

test('`as` makes it the landmark itself', () => {
  render(<Page as="main">content</Page>);
  expect(screen.getByRole('main').className).toContain('max-w-7xl');
});
