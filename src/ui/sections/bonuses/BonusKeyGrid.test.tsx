// @vitest-environment jsdom
/**
 * The thirteen-key editor's one visual rule (owner, 2026-09-17): every health and strength field
 * opens with its key's glyph, so the fields are told apart by the mark and not by reading thirteen
 * labels that all end in the same word. The glyph is decoration — hidden from a screen reader, the
 * label still says the key — and it is the same mark the key wears everywhere else.
 */
import { cleanup, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

import { GLYPHS } from '@/ui/domain';

import { renderWithTheme } from '../../kit/testRender';
import { BonusKeyGrid } from './BonusKeyGrid';

afterEach(cleanup);

test('every health and strength field opens with its key’s glyph, hidden from a reader', () => {
  renderWithTheme(<BonusKeyGrid value={{ health: {}, strength: {} }} onChange={vi.fn()} />);

  const cases: [string, string][] = [
    ['Melee health', GLYPHS.melee],
    ['Guardsmen strength', GLYPHS.guardsmen],
    ['Specialists health', GLYPHS.specialists],
    ['Monsters strength', GLYPHS.monsters],
    ['Dragons health', GLYPHS.dragon],
  ];
  for (const [label, glyph] of cases) {
    const field = screen.getByLabelText(label);
    const wrapper = field.closest('.mantine-Input-wrapper');
    expect(wrapper, `${label} has no input wrapper`).not.toBeNull();
    const mark = wrapper?.querySelector('[aria-hidden="true"]');
    expect(mark?.textContent, `${label} does not open with its glyph`).toBe(glyph);
  }
});
