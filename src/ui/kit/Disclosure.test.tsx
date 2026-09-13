// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, expect, test } from 'vitest';

import { Disclosure, DisclosureGroup } from './Disclosure';
import { renderWithTheme } from './testRender';

afterEach(cleanup);

test('the header is a button that says whether it is open, and the summary stays visible', async () => {
  const user = userEvent.setup();
  renderWithTheme(
    <Disclosure title="Equipment" summary="+12 % attack">
      <p>Every piece of equipment</p>
    </Disclosure>,
  );
  const header = screen.getByRole('button', { name: /Equipment/ });
  expect(header.getAttribute('aria-expanded')).toBe('false');
  expect(screen.getByText('+12 % attack')).toBeTruthy();

  await user.click(header);
  expect(screen.getByRole('button', { name: /Equipment/ }).getAttribute('aria-expanded')).toBe('true');
  expect(screen.getByText('+12 % attack')).toBeTruthy();
});

test('a group of folds is an accordion, one open at a time', async () => {
  const user = userEvent.setup();
  renderWithTheme(
    <DisclosureGroup
      items={[
        { value: 'captains', title: 'Captains', summary: '2 of 3', children: <p>Captain rows</p> },
        { value: 'titles', title: 'Titles', summary: 'none', children: <p>Title rows</p> },
      ]}
    />,
  );
  const captains = screen.getByRole('button', { name: /Captains/ });
  await user.click(captains);
  expect(captains.getAttribute('aria-expanded')).toBe('true');

  await user.click(screen.getByRole('button', { name: /Titles/ }));
  expect(screen.getByRole('button', { name: /Captains/ }).getAttribute('aria-expanded')).toBe('false');
});
