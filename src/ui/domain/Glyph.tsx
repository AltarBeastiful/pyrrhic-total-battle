/**
 * The game's own vocabulary, drawn the way TotalStack draws it: **Unicode emoji** (owner's decision,
 * 2026-09-13). A player reads ⚔️ as melee and 👑 as authority because that is what the game and the
 * reference tool show them, and a stroked Lucide sword is a translation of that, not the thing
 * itself. Interface chrome — chevrons, the gear, close, search, copy — stays Lucide: those are our
 * words, not the game's.
 *
 * Emoji render with the platform's own font. We bundle none for now, so a glyph is a *repetition* of
 * something already written in text, never the only thing saying what a control does: a `Glyph` with
 * no `label` is hidden from screen readers, and one with a label becomes an `img` carrying it.
 */
import type { CSSProperties } from 'react';

import { GLYPHS, type GlyphKind } from './glyphs';

export interface GlyphProps {
  kind: GlyphKind;
  /** The glyph's accessible name. Left out, the glyph is decoration beside a visible label. */
  label?: string;
  /** A multiplier on the surrounding text size; 1 is "the same size as the words". */
  scale?: number;
  className?: string;
}

const BASE: CSSProperties = {
  display: 'inline-block',
  lineHeight: 1,
  fontStyle: 'normal',
  verticalAlign: '-0.1em',
};

export function Glyph({ kind, label, scale = 1, className }: GlyphProps) {
  const style: CSSProperties = { ...BASE, fontSize: `${scale}em` };
  return label === undefined ? (
    <span aria-hidden="true" className={className} style={style}>
      {GLYPHS[kind]}
    </span>
  ) : (
    <span role="img" aria-label={label} className={className} style={style}>
      {GLYPHS[kind]}
    </span>
  );
}
