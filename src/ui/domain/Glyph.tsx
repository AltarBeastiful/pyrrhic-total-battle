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
 *
 * **The glyph rule** (the owner's review of 2026-09-13, artboards `MarchPaneSpacing.dc.html` and
 * `MercenariesSpacing.dc.html`, `.g`): every emoji sits in a **fixed 1.25 em inline-flex box**,
 * line-height 1, `vertical-align: -0.2em`, and never as bare text. An emoji is drawn by whatever
 * font the platform hands it, whose ascent, descent and advance have nothing to do with Inter's: a
 * bare 🛡️ beside "20 000" pushed the whole line's baseline down and widened the row by however much
 * that particular device's emoji font felt like. Inside a box of its own it cannot: the line's
 * metrics come from Inter, the box is the same size on every device, and a row of figures with
 * glyphs down its left edge lines up. This is why the shape is a *class* and not a prop — there is
 * one box, it is not negotiable, and `scale` only moves the em it is measured in.
 */
import { GLYPHS, type GlyphKind } from './glyphs';
import classes from './domain.module.css';

export interface GlyphProps {
  kind: GlyphKind;
  /** The glyph's accessible name. Left out, the glyph is decoration beside a visible label. */
  label?: string;
  /** A multiplier on the surrounding text size; 1 is "the same size as the words". */
  scale?: number;
  className?: string;
}

export function Glyph({ kind, label, scale = 1, className }: GlyphProps) {
  const style = scale === 1 ? undefined : { fontSize: `${String(scale)}em` };
  const box = className === undefined ? classes.glyph : `${classes.glyph ?? ''} ${className}`;
  return label === undefined ? (
    <span aria-hidden="true" className={box} style={style}>
      {GLYPHS[kind]}
    </span>
  ) : (
    <span role="img" aria-label={label} className={box} style={style}>
      {GLYPHS[kind]}
    </span>
  );
}
