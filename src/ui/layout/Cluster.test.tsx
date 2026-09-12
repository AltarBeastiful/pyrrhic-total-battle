// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { Cluster } from './Cluster';

afterEach(() => {
  cleanup();
});

test('a cluster is a wrapping, centred row by default', () => {
  render(
    <Cluster data-testid="cluster">
      <span>one</span>
      <span>two</span>
    </Cluster>,
  );
  const cluster = screen.getByTestId('cluster');
  expect(cluster.className.split(' ')).toEqual(
    expect.arrayContaining(['flex', 'flex-wrap', 'gap-2', 'items-center', 'justify-start']),
  );
  expect(cluster.textContent).toBe('onetwo');
});

test('wrapping can be turned off and the row can be spread apart', () => {
  render(<Cluster wrap={false} justify="between" align="baseline" data-testid="cluster" />);
  const cluster = screen.getByTestId('cluster');
  expect(cluster.className).toContain('flex-nowrap');
  expect(cluster.className).toContain('justify-between');
  expect(cluster.className).toContain('items-baseline');
});
