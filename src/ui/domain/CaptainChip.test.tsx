// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test, vi } from 'vitest';

import { renderWithTheme } from '../kit/testRender';
import { CaptainChip } from './CaptainChip';

afterEach(cleanup);

test('the chip says whether the captain rides, and pressing it changes that', async () => {
  const user = userEvent.setup();
  const onToggle = vi.fn();
  renderWithTheme(
    <CaptainChip name="Aydae" bonusKey="melee" bonus="HP +25 %" enlisted={false} onToggle={onToggle} />,
  );
  const chip = screen.getByRole('checkbox', { name: 'Send Aydae on this march' });
  await user.click(chip);
  expect(onToggle).toHaveBeenCalledTimes(1);
  expect(screen.getByText('HP +25 %')).toBeTruthy();
});

test('the gear is a second target that edits the level and never enlists anybody', async () => {
  const user = userEvent.setup();
  const onToggle = vi.fn();
  const onEditLevel = vi.fn();
  renderWithTheme(
    <CaptainChip name="Aydae" enlisted onToggle={onToggle} levelSet onEditLevel={onEditLevel} />,
  );

  await user.click(screen.getByRole('button', { name: 'Change Aydae’s level' }));
  expect(onEditLevel).toHaveBeenCalledTimes(1);
  expect(onToggle).not.toHaveBeenCalled();
});

test('a captain with nothing to set carries no gear', () => {
  renderWithTheme(<CaptainChip name="Ardan" enlisted={false} onToggle={() => {}} />);
  expect(screen.queryByRole('button', { name: /level/ })).toBeNull();
});

test('a recorded level is worn on the corner and the stars follow the name', () => {
  renderWithTheme(
    <CaptainChip
      name="Aydae"
      enlisted={false}
      onToggle={() => {}}
      level={60}
      star={3}
      onEditLevel={() => {}}
    />,
  );
  const gear = screen.getByRole('button', { name: 'Set Aydae’s level' });
  expect(gear.textContent).toBe('60');
  expect(gear.getAttribute('data-digits')).toBe('2');
  expect(document.getElementById(gear.getAttribute('aria-describedby') ?? '')?.textContent).toBe(
    'Level 60, 3 stars',
  );
  // 2 over 1, as icons.
  const rows = document.querySelectorAll('[data-shape="rows"] > span');
  expect([...rows].map((row) => row.querySelectorAll('svg').length)).toEqual([2, 1]);
});

test('a three-digit level widens the badge, and stars above the icon limit are written as a count', () => {
  renderWithTheme(
    <CaptainChip name="Heimdall" enlisted onToggle={() => {}} level={120} star={6} onEditLevel={() => {}} />,
  );
  const gear = screen.getByRole('button', { name: 'Set Heimdall’s level' });
  expect(gear.getAttribute('data-digits')).toBe('3');
  const count = document.querySelector('[data-shape="count"]');
  expect(count?.textContent).toBe('6');
  expect(count?.querySelectorAll('svg')).toHaveLength(1);
});

test('stars without a level keep the gear, and a chip with nothing recorded draws no stars', () => {
  const { unmount } = renderWithTheme(
    <CaptainChip name="Skadi" enlisted={false} onToggle={() => {}} star={1} onEditLevel={() => {}} />,
  );
  expect(screen.getByRole('button', { name: 'Set Skadi’s level' }).querySelector('svg')).not.toBeNull();
  expect(document.querySelector('[data-shape="one"]')).not.toBeNull();
  unmount();
  renderWithTheme(<CaptainChip name="Skadi" enlisted={false} onToggle={() => {}} onEditLevel={() => {}} />);
  expect(document.querySelector('[data-shape]')).toBeNull();
});

test('hovering a chip says what the captain is worth, one line per block', async () => {
  const user = userEvent.setup();
  renderWithTheme(
    <CaptainChip
      name="Aydae"
      enlisted={false}
      onToggle={() => {}}
      level={60}
      star={3}
      details={['+20 % health (guardsmen)', '+35 % strength (guardsmen)']}
      onEditLevel={() => {}}
    />,
  );
  await user.hover(screen.getByText('Aydae'));
  const tooltip = await screen.findByRole('tooltip');
  expect(tooltip.textContent).toBe('+20 % health (guardsmen)+35 % strength (guardsmen)');
});

test('a chip with nothing to say has no tooltip', async () => {
  const user = userEvent.setup();
  renderWithTheme(
    <CaptainChip name="Aydae" enlisted={false} onToggle={() => {}} level={60} onEditLevel={() => {}} />,
  );
  await user.hover(screen.getByText('Aydae'));
  await new Promise((resolve) => setTimeout(resolve, 600));
  expect(screen.queryByRole('tooltip')).toBeNull();
});
