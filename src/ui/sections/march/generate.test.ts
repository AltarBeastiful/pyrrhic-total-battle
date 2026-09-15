/**
 * The one thing in `generate.ts` that is a sentence rather than a run: what a player is told when the engine
 * refuses (design rule 26 — "planCampaign: no feasible plan for this army" is not a sentence for a player).
 *
 * The refusal itself is the plan method's and is reachable: an account with no mercenaries has nothing to
 * spread over the marches, and the card offers the method to everybody.
 */
import { expect, test } from 'vitest';

import { refusalOf } from './generate';

test('the plan method’s refusal is said in a player’s words', () => {
  const refusal = refusalOf(new Error('planCampaign: no feasible plan for this army'));
  expect(refusal).not.toMatch(/planCampaign|feasible/);
  expect(refusal).toContain('mercenaries');
});

test('any other failure is passed through, so a bug stays reportable', () => {
  expect(refusalOf(new Error('IndexedDB is unavailable'))).toBe('IndexedDB is unavailable');
  expect(refusalOf('not an error')).toBe('The calculation could not be finished.');
});
