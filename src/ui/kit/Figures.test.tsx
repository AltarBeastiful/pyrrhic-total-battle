// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { Figures } from './Figures';
import { renderWithTheme } from './testRender';

afterEach(cleanup);

test('each figure is a label/value pair in a description list', () => {
  const { container } = renderWithTheme(
    <Figures
      label="Army recovery cost"
      items={[
        { key: 'time', label: 'Time', value: '14d 14h' },
        { key: 'silver', label: 'Silver', value: '2 100 000' },
        { key: 'gold', label: 'Gold', value: '8 576' },
      ]}
    />,
  );
  expect(container.querySelectorAll('dt')).toHaveLength(3);
  expect(container.querySelectorAll('dd')).toHaveLength(3);
  expect(screen.getByText('2 100 000')).toBeTruthy();
  expect(screen.getByLabelText('Army recovery cost')).toBeTruthy();
});

test('a glyph may open a row without stealing the label', () => {
  renderWithTheme(
    <Figures
      items={[{ key: 'silver', label: 'Silver', value: '2 100 000', glyph: <span aria-hidden>x</span> }]}
    />,
  );
  expect(screen.getByText('Silver')).toBeTruthy();
});
