// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import { Glyph } from './Glyph';
import { GLYPHS } from './glyphs';

afterEach(cleanup);

test('a named glyph is an image carrying that name', () => {
  render(<Glyph kind="authority" label="Authority" />);
  const glyph = screen.getByRole('img', { name: 'Authority' });
  expect(glyph.textContent).toBe(GLYPHS.authority);
});

test('a glyph beside a visible label is hidden from screen readers', () => {
  const { container } = render(
    <span>
      <Glyph kind="melee" /> Melee
    </span>,
  );
  expect(screen.queryByRole('img')).toBeNull();
  expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe(GLYPHS.melee);
});

test('the mapping covers the game vocabulary the sections use', () => {
  for (const kind of [
    'melee',
    'ranged',
    'mounted',
    'flying',
    'leadership',
    'authority',
    'dominance',
  ] as const) {
    expect(GLYPHS[kind].length).toBeGreaterThan(0);
  }
  expect(GLYPHS.unlimited).toBe('∞');
});
