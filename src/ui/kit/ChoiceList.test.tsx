// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, expect, test } from 'vitest';

import { ChoiceList } from './ChoiceList';
import { renderWithTheme } from './testRender';

const realMatchMedia = window.matchMedia;

/** Stand in for the browser: jsdom has no `matchMedia`, and its fallback answer is the phone. */
function stubWide(matches: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (media: string) => ({
      media,
      matches,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

afterEach(() => {
  cleanup();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: realMatchMedia,
  });
});

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
  // The row shape (jsdom answers `false` to every media query, which is the phone) names its control
  // by the title **alone** and hangs the sentence off it as a description — the same contract the
  // card has, and the one a browser's accessibility tree needs: on the built app, a row written
  // without it comes out as a bare `radio` with no name at all.
  const row = screen.getByRole('radio', { name: 'Tier ladder' });
  expect(row.getAttribute('aria-checked')).toBe('true');
  expect(screen.getByText('Fill from the top tier down.')).toBeTruthy();
  expect(document.getElementById(row.getAttribute('aria-describedby') ?? '')?.textContent).toBe(
    'Fill from the top tier down.',
  );
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

test('the cards layout names a card by its title alone and describes it with the sentence', () => {
  // Cards only exist from the medium window up (D-54); jsdom answers every query with `false`.
  stubWide(true);
  renderWithTheme(
    <ChoiceList layout="cards" columns={3} label="Method" value="ladder" onChange={() => {}} items={ITEMS} />,
  );
  const card = screen.getByRole('radio', { name: 'Tier ladder' });
  expect(card.getAttribute('aria-checked')).toBe('true');
  const describedBy = card.getAttribute('aria-describedby');
  expect(describedBy).not.toBeNull();
  expect(document.getElementById(describedBy ?? '')?.textContent).toBe('Fill from the top tier down.');
});

test('a collapsible list folds to the chosen option on a phone and unfolds on request', async () => {
  const user = userEvent.setup();
  renderWithTheme(
    <ChoiceList layout="cards" collapsible label="Method" value="ladder" onChange={() => {}} items={ITEMS} />,
  );
  // jsdom answers `matchMedia` with `false`, which is the phone shape.
  expect(screen.getAllByRole('radio')).toHaveLength(1);
  await user.click(screen.getByRole('button', { name: 'Change Method' }));
  expect(screen.getAllByRole('radio')).toHaveLength(3);
});
