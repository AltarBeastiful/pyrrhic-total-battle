/**
 * The base every Pyrrhic glyph is drawn on: inline SVG, no icon dependency, no network request
 * (ADR-0002). One grid (24×24), one stroke weight, round caps and joins, `currentColor` only — so an
 * icon takes the colour and the size of the text next to it and needs no per-icon styling.
 *
 * An icon is decorative by default (`aria-hidden`): the label beside it carries the meaning. Pass
 * `title` only when the glyph is the *only* thing saying what a control does, and it becomes an
 * `img` with that accessible name.
 */
import { useId } from 'react';
import type { ReactNode, SVGProps } from 'react';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> {
  /** Accessible name. Leave it out for a glyph that only decorates a visible label. */
  title?: string;
}

export interface GlyphProps extends IconProps {
  children: ReactNode;
}

export function Glyph({ title, children, ...rest }: GlyphProps) {
  const titleId = useId();
  const labelled =
    title === undefined
      ? ({ 'aria-hidden': true } as const)
      : ({ role: 'img', 'aria-labelledby': titleId } as const);

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      width="1.15em"
      height="1.15em"
      focusable="false"
      {...labelled}
      {...rest}
    >
      {title !== undefined && <title id={titleId}>{title}</title>}
      {children}
    </svg>
  );
}

/** Shorthand for the many glyphs that are a single path. */
export function PathGlyph({ d, ...props }: IconProps & { d: string }) {
  return (
    <Glyph {...props}>
      <path d={d} />
    </Glyph>
  );
}
