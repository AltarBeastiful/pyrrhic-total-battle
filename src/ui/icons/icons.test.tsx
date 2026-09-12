// @vitest-environment jsdom
/**
 * The icon contract, checked on every glyph at once rather than one test per drawing: a glyph is an
 * `svg`, it inherits `currentColor`, and it is invisible to a screen reader unless the caller gives
 * it a name. Those three rules are what let a section drop an icon next to any label without
 * thinking about accessibility — and they hold whichever package drew the glyph, which is the point
 * of the wrappers in `Icon.tsx`.
 */
import { cleanup, render, screen } from '@testing-library/react';
import type { ComponentType } from 'react';
import { afterEach, expect, test } from 'vitest';

import * as icons from './index';
import type { IconProps } from './index';

afterEach(() => {
  cleanup();
});

const GLYPHS = Object.entries(icons).filter(([name]) => name.endsWith('Icon')) as [
  string,
  ComponentType<IconProps>,
][];

test('the set is complete: categories, groups, races, pools, sections and the verbs', () => {
  const names = new Set(GLYPHS.map(([name]) => name));
  for (const required of [
    'MeleeIcon',
    'RangedIcon',
    'MountedIcon',
    'FlyingIcon',
    'GuardsmenIcon',
    'SpecialistsIcon',
    'EngineersIcon',
    'MonstersIcon',
    'BeastIcon',
    'ElementalIcon',
    'DragonIcon',
    'GiantIcon',
    'LeadershipIcon',
    'AuthorityIcon',
    'DominanceIcon',
    'TroopsIcon',
    'MercenariesIcon',
    'MethodIcon',
    'BonusesIcon',
    'EnemyIcon',
    'HousingIcon',
    'ResultsIcon',
    'GenerateIcon',
    'PinIcon',
    'UnpinIcon',
    'UndoIcon',
    'ResetIcon',
    'SortIcon',
    'WarningIcon',
    'MinusIcon',
    'SyncIcon',
  ]) {
    expect(names).toContain(required);
  }
  expect(GLYPHS.length).toBeGreaterThanOrEqual(45);
});

test('the unit tile still finds a filled twin for every silhouette it can wear', () => {
  const names = new Set(GLYPHS.map(([name]) => name));
  for (const required of [
    'MeleeFillIcon',
    'RangedFillIcon',
    'MountedFillIcon',
    'FlyingFillIcon',
    'EngineersFillIcon',
    'BeastFillIcon',
    'ElementalFillIcon',
    'DragonFillIcon',
    'GiantFillIcon',
  ]) {
    expect(names).toContain(required);
  }
});

test.each(GLYPHS)('%s draws an svg that is decorative by default', (_name, Icon) => {
  const { container } = render(<Icon />);
  const svg = container.querySelector('svg');

  expect(svg).not.toBeNull();
  expect(svg?.getAttribute('aria-hidden')).toBe('true');
  expect(svg?.getAttribute('focusable')).toBe('false');
  // Colour and size come from the text around it, never from the glyph itself.
  expect(svg?.getAttribute('stroke')).toBe('currentColor');
  expect(svg?.getAttribute('width')).toMatch(/em$/);
  expect(svg?.getAttribute('height')).toMatch(/em$/);
  // One of the two grids the set is drawn on: Lucide's 24, or Game Icons' 512.
  expect(['0 0 24 24', '0 0 512 512']).toContain(svg?.getAttribute('viewBox'));
  expect(svg?.querySelector('title')).toBeNull();
});

test.each(GLYPHS)('%s becomes a named image when it is given a title', (name, Icon) => {
  render(<Icon title={`the ${name} mark`} />);
  const image = screen.getByRole('img', { name: `the ${name} mark` });

  expect(image.getAttribute('aria-hidden')).toBeNull();
  expect(image.querySelector('title')?.textContent).toBe(`the ${name} mark`);
});

test('a UnitBadge shows the tier and takes its group colour', () => {
  const { container } = render(<icons.UnitBadge group="guardsmen" category="ranged" tier={3} />);
  const badge = container.firstElementChild;

  expect(badge?.getAttribute('aria-hidden')).toBe('true');
  expect(badge?.className).toContain('border-group-guardsmen');
  expect(badge?.textContent).toBe('3');
  expect(badge?.querySelector('svg')).not.toBeNull();
});

test('a UnitBadge falls back to the group glyph when the unit has no category', () => {
  const { container } = render(<icons.UnitBadge group="engineers" tier={2} />);
  expect(container.querySelector('svg')).not.toBeNull();
  expect(container.firstElementChild?.className).toContain('border-group-engineers');
});

test('a titled UnitBadge is announced as one image, not as its parts', () => {
  render(<icons.UnitBadge group="monster" category="flying" tier={5} title="Flying monster, tier 5" />);
  const badge = screen.getByRole('img', { name: 'Flying monster, tier 5' });
  expect(badge.textContent).toBe('5');
});

test('a PoolBadge carries its pool glyph and an optional label', () => {
  const { container } = render(<icons.PoolBadge pool="authority" label="Authority" />);
  expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  expect(container.textContent).toBe('Authority');
  expect(container.querySelector('svg')).not.toBeNull();
});
