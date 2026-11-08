/**
 * Which keys each builtin permanent source can really carry, read off the Academy research tree
 * (tb_research_tree.json, 2026-11-01). A field the game has no line for is not drawn, so the sheet
 * asks only for numbers that exist on the screen it points at.
 *
 * - Army Modernization: Army, Melee, Ranged, Mounted, Flying and Siege Engines (engineers), strength
 *   and health. Scouts and Fortifications lines exist in game but have no key in the model.
 * - Monsters Boost: the four races, strength and health, and "strike two squads" per race. The
 *   "chance to block a strike" lines have no special key yet.
 *
 * - Hall of Fame: Army strength and Army health. Its third line, health against players, is not
 *   modelled: battles here are against monsters and crypts.
 *
 * Sources not listed here keep the full grid.
 */
import type { BonusKeyScope } from './BonusKeyGrid';

/** The Dragon screen grants Army health and Army strength only; the runes add to those same two lines. */
export const DRAGON_SCOPE: BonusKeyScope = { health: ['army'], strength: ['army'], special: [] };

const ARMY_MODERNIZATION_KEYS = ['army', 'melee', 'ranged', 'mounted', 'flying', 'engineers'] as const;
const RACE_KEYS = ['beast', 'giant', 'elemental', 'dragon'] as const;

export const PERMANENT_SCOPE: Record<string, BonusKeyScope | undefined> = {
  hallOfFame: { health: ['army'], strength: ['army'], special: [] },
  armyModernization: { health: ARMY_MODERNIZATION_KEYS, strength: ARMY_MODERNIZATION_KEYS, special: [] },
  monstersBoost: {
    health: RACE_KEYS,
    strength: RACE_KEYS,
    special: [
      'beastsStrikeTwoSquadsChance',
      'giantsStrikeTwoSquadsChance',
      'elementalsStrikeTwoSquadsChance',
      'dragonsStrikeTwoSquadsChance',
    ],
  },
};
