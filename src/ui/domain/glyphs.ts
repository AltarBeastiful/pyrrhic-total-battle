/**
 * The game's own vocabulary as Unicode emoji, the way TotalStack writes it (owner's decision,
 * 2026-09-13). The mapping is the contract; which emoji draws a meaning is not, and neither is the
 * face it renders in — emoji use the platform's own font and we bundle none.
 *
 * In a module of its own because `Glyph.tsx` exports a component and nothing else.
 */
import type { BonusKey } from '../../data/types';

import dragonCoinArt from './art/dragon-coin.png';

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
 * The one mark the platform's emoji font cannot say (owner, 2026-09-21: *"we could use a png icon for
 * dragon coins"*). Every other glyph is an emoji, as rule 21 asks and as TotalStack writes them — but no
 * face in Unicode draws a **dragon coin**, so 🏵️ was a rosette standing in for the game's own piece of
 * art, on the two figures that decide whether a monster march is worth its rarest purse (`MarchRecap`).
 *
 * A kind listed here is drawn as that picture *inside the same 1.25 em box* as every glyph
 * (`Glyph.tsx`), so the line's metrics and the column of marks down a list of figures are unchanged. The
 * emoji stays in `GLYPHS` above: it is the word for the kind, the alt text a reader falls back to, and
 * the mark anything that reads the map rather than drawing the component still gets.
 */
export const GLYPH_ART: Partial<Record<GlyphKind, string>> = {
  dragonCoin: dragonCoinArt,
};

/**
 * Glyphs the platform draws in **the wrong metal** (owner, 2026-09-21: *"silver icon is actually
 * golden, lets use something closer to silver"*).
 *
 * 🪙 is the coin every emoji font has, and every one of them draws it in gold — beside 💰, which is
 * gold too, so the two purses a march is counted in wore one colour and the recap's "Silver to recover"
 * and "Gold to recover" could not be told apart at a glance. There is no silver coin in Unicode to
 * swap it for, and a medal or a bare disc is not a coin, so the mark stays the coin and the colour is
 * taken out of it: greyscale, a touch brighter, which is what silver looks like next to gold.
 *
 * A filter and not a second picture, because this is a *tint on the platform's own glyph* — it stays
 * whatever coin the reader's device draws, and no asset of ours can go stale against it.
 */
export const GREYED_GLYPHS: ReadonlySet<GlyphKind> = new Set<GlyphKind>(['silver']);

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
