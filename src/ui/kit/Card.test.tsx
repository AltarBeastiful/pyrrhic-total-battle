// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { Card } from './Card';

afterEach(cleanup);

test('a card renders its children', () => {
  render(
    <Card>
      <p>Average damage 1.67 M</p>
    </Card>,
  );

  expect(screen.getByText('Average damage 1.67 M')).toBeTruthy();
});

test('the `as` prop chooses the element, so the page outline stays honest', () => {
  render(
    <>
      <Card as="article">
        <h2>March</h2>
      </Card>
      <Card as="section" aria-label="Bonuses">
        <p>Health +312 %</p>
      </Card>
    </>,
  );

  expect(screen.getByRole('article')).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Bonuses' })).toBeTruthy();
});

test('every tone and padding renders', () => {
  const tones = ['surface', 'raised', 'sunken', 'accent', 'info', 'warn', 'danger'] as const;
  const paddings = ['none', 'sm', 'md'] as const;
  render(
    <>
      {tones.map((tone) => (
        <Card key={tone} tone={tone}>
          <p>{tone}</p>
        </Card>
      ))}
      {paddings.map((padding) => (
        <Card key={padding} padding={padding}>
          <p>padding {padding}</p>
        </Card>
      ))}
    </>,
  );

  for (const tone of tones) expect(screen.getByText(tone)).toBeTruthy();
  for (const padding of paddings) expect(screen.getByText(`padding ${padding}`)).toBeTruthy();
});
