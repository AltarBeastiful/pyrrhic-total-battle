/**
 * The shelter note (S-141): when the largest hired stack sits within `CAMPAIGN.shelterWarning` of the lowest
 * troop stack, the March says so in one faint sentence; when it is not sheltered at all, it says the stronger
 * fact — unless the engine's own warnings already named that stack. `march.test.tsx` holds the fact that the
 * pane draws it.
 */
import { expect, test } from 'vitest';

import { CAMPAIGN } from '@/config';
import { getUnits } from '@/data';
import type { Pool, Stack } from '@/engine/types';

import { marginPercent, readShelter, shelterNote } from './shelter';

const UNITS = getUnits();
const RIDER = 'rider-3';
const HUNTER = 'epic-monster-hunter-6';

/** An engine stack reduced to what the shelter reads: its pool, its count and its total HP. */
function stack(unitId: string, pool: Pool, totalHp: number, count = 1): Stack {
  return {
    unitId,
    pool,
    count,
    hpPerUnit: totalHp,
    totalHp,
    strengthPerUnit: 0,
    target: 'melee',
    damagePerHit: 0,
    featuresDamage: 0,
    doubleDamageChance: 0,
    strikeTwoSquadsChance: 0,
  };
}

/** A march whose largest hired stack sits `margin` under a 1 000 000 HP troop floor. */
function march(margin: number, warnings: string[] = []): { stacks: Stack[]; warnings: string[] } {
  const floor = 1_000_000;
  return {
    stacks: [
      stack('archer-5', 'leadership', 3_000_000),
      stack(RIDER, 'leadership', floor),
      stack(HUNTER, 'authority', Math.round(floor * (1 - margin))),
      stack('epic-monster-hunter-5', 'authority', 10_000),
    ],
    warnings,
  };
}

test('the threshold is the owner’s 2 %', () => {
  expect(CAMPAIGN.shelterWarning).toBe(0.02);
});

test('the reading pairs the largest hired stack with the lowest troop stack', () => {
  const reading = readShelter(march(0.015).stacks);
  expect(reading?.hired.unitId).toBe(HUNTER);
  expect(reading?.troop.unitId).toBe(RIDER);
  expect(reading?.margin).toBeCloseTo(0.015, 6);
});

test('a march with no hired stack, or no troop stack, has no shelter to read', () => {
  expect(readShelter([stack(RIDER, 'leadership', 1_000)])).toBeNull();
  expect(readShelter([stack(HUNTER, 'authority', 1_000)])).toBeNull();
  // A stack typed down to nothing is not on the field.
  expect(readShelter([stack(RIDER, 'leadership', 0, 0), stack(HUNTER, 'authority', 10)])).toBeNull();
});

test('at 0.01 % it warns, and names both stacks and the margin', () => {
  expect(shelterNote(march(0.0001), UNITS)).toEqual({
    tone: 'thin',
    text:
      'Your Epic Monster Hunter VI stack is only 0.01% lighter than your Rider III stack: ' +
      'a small HP difference in game could see it fall before your troops.',
  });
});

test('at 1.5 % it still warns', () => {
  const note = shelterNote(march(0.015), UNITS);
  expect(note?.tone).toBe('thin');
  expect(note?.text).toContain('only 1.5% lighter');
});

test('at exactly 2 % it warns, and at 3 % it says nothing', () => {
  expect(shelterNote(march(0.02), UNITS)?.tone).toBe('thin');
  expect(shelterNote(march(0.03), UNITS)).toBeNull();
});

test('a hired stack over the troop floor gets the stronger sentence', () => {
  expect(shelterNote(march(-0.1), UNITS)).toEqual({
    tone: 'over',
    text: 'Your Epic Monster Hunter VI stack is heavier than your Rider III stack, so it falls before your troops.',
  });
  expect(shelterNote(march(0), UNITS)?.text).toBe(
    'Your Epic Monster Hunter VI stack is as heavy as your Rider III stack, so the game decides which falls first.',
  );
});

test('the stronger sentence is not written twice when the engine already named the stack', () => {
  expect(
    shelterNote(march(-0.1, ['Allow damage trades grew EMH6 to 300; it now falls before RD3.']), UNITS),
  ).toBeNull();
  // A warning about something else does not count.
  expect(shelterNote(march(-0.1, ['200 authority left unused; nothing else fits.']), UNITS)?.tone).toBe(
    'over',
  );
});

test('the margin is printed to two significant digits', () => {
  expect(marginPercent(0.0001)).toBe('0.01%');
  expect(marginPercent(0.00123)).toBe('0.12%');
  expect(marginPercent(0.015)).toBe('1.5%');
  expect(marginPercent(0.0000001)).toBe('less than 0.001%');
});
