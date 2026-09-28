/**
 * What a type is filed under, held against the real tables (`facets.ts`).
 *
 * The owner asked for the line on 2026-09-28 — *"in the details of a troop, add the category it fits in
 * (guardsmen, mounted for RD2; specialist melee for SW1…) … alert if something is missing"* — so this file
 * holds both readings: the words the unit sheet's heading wears, and the flag that says the app does not
 * carry a type's squad.
 */
import { expect, test } from 'vitest';

import { getUnits, unitById } from '@/data';
import type { UnitDef } from '@/data/types';

import { facetWords, squadUnknown } from './facets';
import { unitGroupOf } from './unitGroup';

function unit(id: string): UnitDef {
  const found = unitById(id);
  if (found === undefined) throw new Error(`${id} is not in the tables`);
  return found;
}

test('a type is filed under its own facets, the ones its bonuses reach', () => {
  // The owner's own two examples: a mounted guardsman and a melee specialist. The *family* is the heading's
  // ("Guardsmen II"), so the line carries what the heading does not.
  expect(facetWords(unit('rider-2'))).toEqual(['Mounted']);
  expect(facetWords(unit('swordsman-1'))).toEqual(['Melee']);
  expect(facetWords(unit('archer-1'))).toEqual(['Ranged']);
  // A monster is filed under its squad *and* its race — the two keys a monster's bonuses are bought on.
  expect(facetWords(unit('ancient-terror'))).toEqual(['Mounted', 'Beast']);
  // A beast among the troops carries its race too: battle griffins are beasts.
  expect(facetWords(unit('battle-griffin-5'))).toEqual(['Flying', 'Beast']);
  // An engineer has no facet but its family: its record carries no squad, and none on purpose.
  expect(facetWords(unit('catapult-1'))).toEqual([]);
  // A mercenary keeps its role word, because there it is *not* the word its heading wears: this one is paid
  // by the guardsmen bonuses its tags name, and the heading reads "Mercenaries".
  expect(facetWords(unit('epic-monster-hunter-6'))).toEqual(['Guardsmen']);
  // A monster-tagged mercenary is filed under the monster key as well: it is a mercenary the monster bonuses
  // pay.
  expect(facetWords(unit('abomination-6'))).toEqual(['Monster', 'Melee', 'Beast']);
});

test('the four mercenaries the pull left without a squad are flagged, and an engineer is not', () => {
  // Of the 2026-09-18 tables, four mercenaries carry a role and nothing else, and the app cannot say which
  // squad they fight in. The sheet says so rather than showing a shorter list.
  for (const id of [
    'epic-monster-hunter-5',
    'epic-monster-hunter-6',
    'epic-monster-hunter-7',
    'superior-epic-monster-hunter-2',
  ]) {
    expect(squadUnknown(unit(id)), `${id} is missing its squad`).toBe(true);
    expect(facetWords(unit(id))).toEqual(['Guardsmen']);
  }
  // Everything else is placed: the two examples, a monster, a beast among the troops, and a mercenary whose
  // tags do name a squad.
  for (const id of ['rider-2', 'swordsman-1', 'ancient-terror', 'battle-griffin-5', 'abomination-6']) {
    expect(squadUnknown(unit(id)), `${id} has a squad`).toBe(false);
  }
  // **An engineer is not missing anything** (`TroopRecord.category`, "absent for engineers"): nine alerts
  // that are not really alerts are an alert nobody reads (design rule 15).
  expect(squadUnknown(unit('catapult-1'))).toBe(false);
});

test('every type is either placed or flagged, and nothing in the tables is silently short', () => {
  // The invariant the sheet leans on: a heading with no facet word after it is exactly a *flagged* type, or
  // an engineer — never a type the app quietly shows less of than it has.
  const units = getUnits();
  const silent = units.filter((one) => facetWords(one).length === 0 && !squadUnknown(one));
  // The only types with no facet word *and* no flag are the engineers, whose record carries no squad by
  // design: every other type either says what it fights in or is flagged as not saying.
  expect(silent.length).toBeGreaterThan(0);
  expect([...new Set(silent.map((one) => unitGroupOf(one)))].sort()).toEqual(['engineers']);
  // And the flag is rare and named: the four above, out of every type the app carries.
  expect(units.filter((one) => squadUnknown(one)).map((one) => one.id)).toEqual([
    'epic-monster-hunter-5',
    'epic-monster-hunter-6',
    'epic-monster-hunter-7',
    'superior-epic-monster-hunter-2',
  ]);
});
