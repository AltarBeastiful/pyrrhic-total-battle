/**
 * The game's own vocabulary as Unicode emoji, the way TotalStack writes it (owner's decision,
 * 2026-09-13). The mapping is the contract; which emoji draws a meaning is not, and neither is the
 * face it renders in — emoji use the platform's own font and we bundle none.
 *
 * In a module of its own because `Glyph.tsx` exports a component and nothing else.
 */
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
