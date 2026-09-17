/**
 * The game's own vocabulary as Unicode emoji, the way TotalStack writes it (owner's decision,
 * 2026-09-13). The mapping is the contract; which emoji draws a meaning is not, and neither is the
 * face it renders in — emoji use the platform's own font and we bundle none.
 *
 * In a module of its own because `Glyph.tsx` exports a component and nothing else.
 */
import type { BonusKey } from '../../data/types';

export const GLYPHS = {
  // categories
  melee: '⚔️',
  ranged: '🏹',
  mounted: '🐴',
  flying: '🦅',
  // groups
  guardsmen: '🛡️',
  specialists: '🗡️',
  engineers: '⚙️',
  monsters: '💀',
  // The fifth family `UnitGroup` has always had and the set never did (`domain/unitGroup.ts`). Added
  // for the plan's trade, where "Hired lost" wore 👑 — the authority pool's glyph two blocks above it
  // on the same screen — against the one-meaning-per-glyph rule (`docs/design.md` §"Glyphs", rule 21).
  mercenaries: '🪖',
  army: '🏰',
  epicMonster: '👹',
  // races
  beast: '🐾',
  elemental: '🔥',
  dragon: '🐉',
  giant: '🗿',
  // housing pools (investigation 0008: leadership is a shield, authority a crown)
  leadership: '🛡️',
  authority: '👑',
  dominance: '💀',
  // figures
  minimumDamage: '🔒',
  averageDamage: '🎯',
  time: '⏳',
  silver: '🪙',
  dragonCoin: '🏵️',
  gold: '💰',
  // states
  unlimited: '∞',
  pin: '📌',
  warning: '⚠️',
} as const;

export type GlyphKind = keyof typeof GLYPHS;

/**
 * The glyph each of the thirteen bonus keys wears wherever it is a field or a row — "Melee health",
 * "Guardsmen strength", the TOTAL's audit — so that a form of thirteen look-alike fields can be told
 * apart at a glance (owner, 2026-09-17: "forms for bonuses melee health, ranged… could use icons to
 * differentiate troop type"). The key's own category, group or race, and the same mark the Battle
 * card's enemy fields and the unit tiles already wear for it: one meaning per glyph (rule 21).
 */
export const BONUS_KEY_GLYPHS: Record<BonusKey, GlyphKind> = {
  melee: 'melee',
  ranged: 'ranged',
  mounted: 'mounted',
  flying: 'flying',
  guardsmen: 'guardsmen',
  specialist: 'specialists',
  engineers: 'engineers',
  monster: 'monsters',
  army: 'army',
  beast: 'beast',
  elemental: 'elemental',
  dragon: 'dragon',
  giant: 'giant',
};

/** Whether a TOTAL row's key is one of the thirteen a glyph stands for, rather than a special key. */
export function isBonusKey(key: string): key is BonusKey {
  return Object.hasOwn(BONUS_KEY_GLYPHS, key);
}
