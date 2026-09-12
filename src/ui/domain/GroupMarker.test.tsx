// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { GroupMarker } from './GroupMarker';
import { UNIT_GROUPS } from './unitGroup';

afterEach(cleanup);

test('a marker without a label still names its group', () => {
  render(<GroupMarker group="monsters" />);

  expect(screen.getByText('Monsters')).toBeTruthy();
});

test('a label replaces the group name', () => {
  render(<GroupMarker group="guardsmen" label="G1–G4" />);

  expect(screen.getByText('G1–G4')).toBeTruthy();
  expect(screen.queryByText('Guardsmen')).toBeNull();
});

test('every group renders', () => {
  render(
    <>
      {UNIT_GROUPS.map((group) => (
        <GroupMarker key={group} group={group} label={group} />
      ))}
    </>,
  );

  for (const group of UNIT_GROUPS) expect(screen.getByText(group)).toBeTruthy();
});
