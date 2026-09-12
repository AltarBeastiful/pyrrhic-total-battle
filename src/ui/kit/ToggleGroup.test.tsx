// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, test } from 'vitest';

import { ToggleGroup, ToggleItem } from './ToggleGroup';

afterEach(cleanup);

function Roles() {
  const [value, setValue] = useState<string[]>(['melee']);
  return (
    <ToggleGroup label="Role" selectionMode="multiple" value={value} onChange={setValue}>
      <ToggleItem id="melee" label="Melee">
        Melee
      </ToggleItem>
      <ToggleItem id="ranged" label="Ranged">
        Ranged
      </ToggleItem>
      <ToggleItem id="mounted" label="Mounted">
        Mounted
      </ToggleItem>
    </ToggleGroup>
  );
}

function Objective() {
  const [value, setValue] = useState<string | null>('damage');
  return (
    <ToggleGroup label="Objective" selectionMode="single" value={value} onChange={setValue}>
      <ToggleItem id="damage" label="Damage">
        Damage
      </ToggleItem>
      <ToggleItem id="survival" label="Survival">
        Survival
      </ToggleItem>
    </ToggleGroup>
  );
}

test('a multiple ToggleGroup presses and releases its items independently', () => {
  render(<Roles />);
  const group = screen.getByRole('toolbar', { name: 'Role' });
  const melee = within(group).getByRole('button', { name: 'Melee' });
  const ranged = within(group).getByRole('button', { name: 'Ranged' });
  expect(melee.getAttribute('aria-pressed')).toBe('true');

  fireEvent.click(ranged);
  expect(screen.getByRole('button', { name: 'Ranged' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('button', { name: 'Melee' }).getAttribute('aria-pressed')).toBe('true');

  fireEvent.click(melee);
  expect(screen.getByRole('button', { name: 'Melee' }).getAttribute('aria-pressed')).toBe('false');
});

test('a single ToggleGroup reads as a radio group and keeps one item on', () => {
  render(<Objective />);
  const group = screen.getByRole('radiogroup', { name: 'Objective' });
  fireEvent.click(within(group).getByRole('radio', { name: 'Survival' }));
  expect(screen.getByRole('radio', { name: 'Survival' }).getAttribute('aria-checked')).toBe('true');
  expect(screen.getByRole('radio', { name: 'Damage' }).getAttribute('aria-checked')).toBe('false');
});

test('ToggleGroup walks its items with the arrow keys', () => {
  render(<Roles />);
  const melee = screen.getByRole('button', { name: 'Melee' });
  const ranged = screen.getByRole('button', { name: 'Ranged' });
  melee.focus();

  fireEvent.keyDown(melee, { key: 'ArrowRight' });
  expect(document.activeElement).toBe(ranged);
});
