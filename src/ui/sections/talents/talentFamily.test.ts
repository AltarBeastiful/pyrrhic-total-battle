import { expect, test } from 'vitest';

import { talents as TALENTS } from '@/data';
import { GLYPHS } from '@/ui/domain/glyphs';

import { talentFamily, talentIcons, treeOrder } from './talentFamily';

test('a trailing roman numeral is the tier and the rest is the family', () => {
  expect(talentFamily("Melee units' health III")).toEqual({
    family: "Melee units' health",
    tier: 3,
    numeral: 'III',
  });
  expect(talentFamily('Caravan speed IV')).toEqual({ family: 'Caravan speed', tier: 4, numeral: 'IV' });
  expect(talentFamily('Tile bonus V').tier).toBe(5);
});

test('a name with no numeral is its own family with no tier', () => {
  expect(talentFamily('Army strength')).toEqual({ family: 'Army strength', tier: null, numeral: null });
});

test('the icon is the stat, plus the unit kind the name speaks of', () => {
  expect(talentIcons("Melee units' health I", ['UNIT_HEALTH'])).toEqual({ stat: 'health', subject: 'melee' });
  expect(talentIcons("Siege engines' march speed II", ['MARCH_SPEED'])).toEqual({
    stat: 'marchSpeed',
    subject: 'engineers',
  });
  expect(talentIcons('Chance for guardsmen to deal double damage I', ['UNIT_CRIT'])).toEqual({
    stat: 'doubleDamage',
    subject: 'guardsmen',
  });
  // Owner, 2026-11-19: silver is the silver coin (the greyed glyph the rest of the app uses), not the wheat of food.
  expect(talentIcons('Silver production in the City I', ['MINE_PRODUCTION_SPEED'])).toEqual({
    stat: 'silver',
    subject: null,
  });
  expect(talentIcons('Food production in the City I', ['MINE_PRODUCTION_SPEED']).stat).toBe('production');
  expect(talentIcons('Tar production speed I', ['MINE_PRODUCTION_SPEED']).stat).toBe('production');
});

test('every talent in the tables gets icons that exist', () => {
  for (const t of TALENTS) {
    const { stat, subject } = talentIcons(t.name, t.stats);
    expect(GLYPHS[stat], t.name).toBeDefined();
    if (subject !== null) expect(GLYPHS[subject]).toBeDefined();
  }
});

test('tree order follows the game: row by row, left to right', () => {
  const nodes = [
    { id: 1, layout: { x: 5, y: 1 } },
    { id: 2, layout: { x: 3, y: 0 } },
    { id: 3, layout: { x: 1, y: 1 } },
  ];
  expect(treeOrder(nodes).map((n) => n.id)).toEqual([2, 3, 1]);
});

test('production of building resources wears the wood, stone and iron mark, not the wheat', () => {
  expect(talentIcons('Production of building resources in the City I', ['MINE_PRODUCTION_SPEED']).stat).toBe(
    'buildingResources',
  );
  expect(talentIcons('Food production in the City I', ['MINE_PRODUCTION_SPEED']).stat).toBe('production');
});
