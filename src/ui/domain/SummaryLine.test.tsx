// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { SummaryLine } from './SummaryLine';

afterEach(cleanup);

test('every part is shown, with its group named for a screen reader', () => {
  render(
    <SummaryLine
      parts={[
        { group: 'guardsmen', text: 'G1–G4' },
        { group: 'specialists', text: 'S1–S2' },
        { group: 'engineers', text: 'no engineers', muted: true },
      ]}
    />,
  );

  expect(screen.getByText('G1–G4')).toBeTruthy();
  expect(screen.getByText('S1–S2')).toBeTruthy();
  expect(screen.getByText('no engineers')).toBeTruthy();
  expect(screen.getByText('Guardsmen')).toBeTruthy();
  expect(screen.getByText('Specialists')).toBeTruthy();
});

test('parts without a group need no marker', () => {
  render(<SummaryLine parts={[{ text: '25 types' }, { text: '4 sources on' }]} />);

  expect(screen.getByText('25 types')).toBeTruthy();
  expect(screen.getByText('4 sources on')).toBeTruthy();
});

test('the trailing slot is rendered at the end of the line', () => {
  render(<SummaryLine parts={[{ text: 'ABM6 ×22' }]} trailing={<button type="button">+3 more</button>} />);

  expect(screen.getByRole('button', { name: '+3 more' })).toBeTruthy();
});
