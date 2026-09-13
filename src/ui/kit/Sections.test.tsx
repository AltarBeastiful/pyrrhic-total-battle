// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { Sections } from './Sections';
import { renderWithTheme } from './testRender';
import classes from '../theme.module.css';

afterEach(cleanup);

test('every direct child is a part, and the parts are the children themselves', () => {
  const { container } = renderWithTheme(
    <Sections aria-label="A card">
      <div>one</div>
      <div>two</div>
      <div>three</div>
    </Sections>,
  );

  const block = screen.getByLabelText('A card');
  // The rule is a class on the container and a rule on `> *`, so a part is the caller's own element:
  // nothing is wrapped, nothing is inserted between them, and a part that is not rendered takes its
  // hairline with it rather than leaving an empty row behind.
  expect(block.children).toHaveLength(3);
  expect(container.querySelectorAll('hr')).toHaveLength(0);
});

test('it can be the section element itself, so a card needs no extra wrapper', () => {
  renderWithTheme(
    <Sections component="section" id="march" aria-label="March">
      <div>one</div>
    </Sections>,
  );

  const block = screen.getByLabelText('March');
  expect(block.tagName).toBe('SECTION');
  expect(block.id).toBe('march');
});

test('a caller may add the one class the frame needs without losing the language', () => {
  // The March pane passes the cap and the scroll it takes when a march is taller than the window;
  // whatever it passes, the separation language is still on the element.
  const own = classes.sections ?? '';
  renderWithTheme(
    <Sections aria-label="A card" className={own}>
      <div>one</div>
    </Sections>,
  );

  const block = screen.getByLabelText('A card');
  expect(block.className.split(' ').length).toBe(2);
});
