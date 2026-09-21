// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, test } from 'vitest';

import classes from './domain.module.css';
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

test('every glyph wears the fixed box, labelled or not, and `scale` only moves the em', () => {
  // The glyph rule (docs/design.md §5): the box is a class and never a prop, so no caller can ship
  // a bare emoji whose own font decides the line's metrics.
  const { container } = render(
    <span>
      <Glyph kind="silver" />
      <Glyph kind="gold" label="Gold" />
      <Glyph kind="pin" scale={0.7} />
    </span>,
  );
  const boxes = container.querySelectorAll(`.${String(classes.glyph)}`);
  expect(boxes).toHaveLength(3);
  // At `scale` 1 nothing is written inline at all: the class is the whole shape.
  expect((boxes[0] as HTMLElement).style.fontSize).toBe('');
  expect((boxes[2] as HTMLElement).style.fontSize).toBe('0.7em');
});

test('a kind with art of its own draws the picture inside the same box', () => {
  // The dragon coin is the one mark Unicode has no face for (owner, 2026-09-21). The picture is
  // decoration inside the box — the box is what carries the name — so a reader hears "Dragon coins"
  // once and never the emoji behind it.
  const { container } = render(<Glyph kind="dragonCoin" label="Dragon coins" />);
  const box = screen.getByRole('img', { name: 'Dragon coins' });
  expect(box.classList.contains(String(classes.glyph))).toBe(true);
  const art = container.querySelector('img');
  expect(art).not.toBeNull();
  expect(art?.getAttribute('alt')).toBe('');
  expect(art?.getAttribute('src')).toMatch(/dragon-coin/);
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
