/**
 * The base every Pyrrhic glyph is drawn on. Two packages supply the drawings (design plan D-16) and
 * this file is the only place that knows which: **Lucide** (ISC) for the verbs, the marks and the
 * section heads — one 24 grid, 2 stroke, round caps and joins — and **Game Icons** (CC BY 3.0, via
 * `react-icons/gi`) for the unit silhouettes, which are solid shapes on a 512 grid. Both are
 * bundled with the app: no icon font, no network request (ADR-0002). The credit line lives in the
 * About dialog.
 *
 * Whatever draws it, a glyph keeps one contract: `currentColor` only, sized in `em` so it matches
 * the text beside it, and decorative by default (`aria-hidden`) — the label next to it carries the
 * meaning. Pass `title` only when the glyph is the *only* thing saying what a control does, and it
 * becomes an `img` with that accessible name.
 */
import type { ReactNode, SVGProps } from 'react';
import type { LucideIcon } from 'lucide-react';
import type { IconBaseProps, IconType } from 'react-icons';

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children' | 'title'> {
  /** Accessible name. Leave it out for a glyph that only decorates a visible label. */
  title?: string;
}

/** A hair larger than the text beside it, and in `em` so it follows the font size. */
const SIZE = '1.15em';

/**
 * The one accessibility decision of the set, in one place: no name means the glyph is hidden from a
 * screen reader, a name means it is an `img` carrying it. A `<title>` element is drawn as well, for
 * everything that reads an SVG rather than the accessibility tree.
 */
function labelFor(title: string | undefined) {
  return title === undefined
    ? ({ 'aria-hidden': true } as const)
    : ({ role: 'img', 'aria-label': title } as const);
}

export interface GlyphProps extends IconProps {
  children: ReactNode;
}

/** A glyph drawn here rather than taken from a package: same grid, same stroke, same contract. */
export function Glyph({ title, children, ...rest }: GlyphProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      width={SIZE}
      height={SIZE}
      focusable="false"
      {...labelFor(title)}
      {...rest}
    >
      {title !== undefined && <title>{title}</title>}
      {children}
    </svg>
  );
}

/** Shorthand for a hand-drawn glyph that is a single path. */
export function PathGlyph({ d, ...props }: IconProps & { d: string }) {
  return (
    <Glyph {...props}>
      <path d={d} />
    </Glyph>
  );
}

export interface LucideGlyphProps extends IconProps {
  icon: LucideIcon;
}

/**
 * One Lucide drawing in the Pyrrhic contract. Every verb and mark of the set goes through here, so
 * a swap of drawing — or of icon package — is one line in `actions.tsx` and reaches no section.
 */
export function LucideGlyph({ icon: Drawing, title, ...rest }: LucideGlyphProps) {
  return (
    <Drawing width={SIZE} height={SIZE} focusable="false" {...labelFor(title)} {...rest}>
      {title !== undefined && <title>{title}</title>}
    </Drawing>
  );
}

export interface GameGlyphProps extends IconProps {
  icon: IconType;
}

/**
 * One Game Icons silhouette in the same contract. They are solid (`fill: currentColor`) where a
 * Lucide glyph is stroked, which is exactly what a unit tile wants: the shape still reads at 16 px.
 */
export function GameGlyph({ icon: Drawing, title, ...rest }: GameGlyphProps) {
  // `react-icons` draws its own children, so the `<title>` element goes through its `title` prop
  // rather than ours. Its props are `SVGAttributes<SVGElement>` with no `undefined` in the optional
  // members, which is the only thing between them and our `SVGProps<SVGSVGElement>`.
  return (
    <Drawing
      size={SIZE}
      focusable="false"
      {...labelFor(title)}
      {...(title === undefined ? {} : { title })}
      {...(rest as IconBaseProps)}
    />
  );
}
