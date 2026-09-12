// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { Badge } from './Badge';

afterEach(cleanup);

test('a badge shows its text', () => {
  render(<Badge>25 types</Badge>);

  expect(screen.getByText('25 types')).toBeTruthy();
});

test('every semantic tone and both sizes render', () => {
  const tones = ['neutral', 'accent', 'info', 'ok', 'warn', 'danger'] as const;
  render(
    <>
      {tones.map((tone) => (
        <Badge key={tone} tone={tone} size={tone === 'neutral' ? 'sm' : 'md'}>
          {tone}
        </Badge>
      ))}
    </>,
  );

  for (const tone of tones) expect(screen.getByText(tone)).toBeTruthy();
});

test('the five group tones render', () => {
  const groups = ['guardsmen', 'specialists', 'engineers', 'monsters', 'mercenaries'] as const;
  render(
    <>
      {groups.map((group) => (
        <Badge key={group} tone={group}>
          {group}
        </Badge>
      ))}
    </>,
  );

  for (const group of groups) expect(screen.getByText(group)).toBeTruthy();
});
