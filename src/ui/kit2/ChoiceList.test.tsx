// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, expect, test } from 'vitest';

import { ChoiceList } from './ChoiceList';
import { renderWithTheme } from './testRender';

afterEach(cleanup);

const ITEMS = [
  { value: 'ladder', title: 'Tier ladder', description: 'Fill from the top tier down.' },
  { value: 'troops', title: 'Troops first', description: 'Spend leadership before authority.' },
  { value: 'own', title: 'Your own order', description: 'Follow the order you set.' },
];

function Example() {
  const [value, setValue] = useState('ladder');
  return (
    <>
      <ChoiceList label="Method" value={value} onChange={setValue} items={ITEMS} />
      <output>{value}</output>
    </>
  );
}

test('every choice is a radio with its title as the name, and one is chosen', () => {
  renderWithTheme(<Example />);
  expect(screen.getAllByRole('radio')).toHaveLength(3);
  expect(screen.getByRole('radio', { name: /Tier ladder/ }).getAttribute('aria-checked')).toBe('true');
  expect(screen.getByText('Fill from the top tier down.')).toBeTruthy();
});

test('the arrows move through the list and choose as they go', async () => {
  const user = userEvent.setup();
  renderWithTheme(<Example />);
  const first = screen.getByRole('radio', { name: /Tier ladder/ });
  first.focus();
  await user.keyboard('{ArrowDown}');
  expect(screen.getByRole('status').textContent).toBe('troops');
  await user.keyboard('{ArrowUp}');
  expect(screen.getByRole('status').textContent).toBe('ladder');
});

test('clicking a row chooses it', async () => {
  const user = userEvent.setup();
  renderWithTheme(<Example />);
  await user.click(screen.getByRole('radio', { name: /Your own order/ }));
  expect(screen.getByRole('status').textContent).toBe('own');
});
