import { expect, test } from 'vitest';

import { ABYSS_MARAUDER, ARCHER, CATAPULT, FIRE_ELEMENTAL, SPEARMAN } from './fixtures';
import {
  GROUP_EDGE_BG,
  GROUP_EDGE_LEFT,
  GROUP_LABEL,
  GROUP_TONE,
  UNIT_GROUPS,
  unitGroupOf,
} from './unitGroup';

test('each kind and group maps to its interface family', () => {
  expect(unitGroupOf(ARCHER)).toBe('guardsmen');
  expect(unitGroupOf(SPEARMAN)).toBe('specialists');
  expect(unitGroupOf(CATAPULT)).toBe('engineers');
  expect(unitGroupOf(FIRE_ELEMENTAL)).toBe('monsters');
});

test('a mercenary is a mercenary whatever its tags say', () => {
  expect(ABYSS_MARAUDER.group).toBe('guardsmen');
  expect(unitGroupOf(ABYSS_MARAUDER)).toBe('mercenaries');
});

test('a troop with no group falls back to guardsmen', () => {
  const { group: _group, ...rest } = ARCHER;
  expect(unitGroupOf(rest)).toBe('guardsmen');
});

test('every group has a label and the three colour utilities', () => {
  for (const group of UNIT_GROUPS) {
    expect(GROUP_LABEL[group]).toBeTruthy();
    expect(GROUP_TONE[group]).toContain(`bg-group-${group}-soft`);
    expect(GROUP_TONE[group]).toContain(`text-group-${group}-strong`);
    expect(GROUP_TONE[group]).toContain(`border-group-${group}-edge`);
    expect(GROUP_EDGE_BG[group]).toBe(`bg-group-${group}-edge`);
    expect(GROUP_EDGE_LEFT[group]).toBe(`border-l-group-${group}-edge`);
  }
});
