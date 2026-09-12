import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { tv } from 'tailwind-variants';

/**
 * Column counts are written out rather than computed: Tailwind only ships the classes it can see in
 * the source, so `grid-cols-${n}` would produce nothing at build time.
 */
const grid = tv({
  base: 'grid',
  variants: {
    cols: {
      1: 'grid-cols-1',
      2: 'grid-cols-2',
      3: 'grid-cols-3',
      4: 'grid-cols-4',
    },
    sm: {
      1: 'sm:grid-cols-1',
      2: 'sm:grid-cols-2',
      3: 'sm:grid-cols-3',
      4: 'sm:grid-cols-4',
    },
    lg: {
      1: 'lg:grid-cols-1',
      2: 'lg:grid-cols-2',
      3: 'lg:grid-cols-3',
      4: 'lg:grid-cols-4',
    },
    gap: { 1: 'gap-1', 2: 'gap-2', 3: 'gap-3', 4: 'gap-4', 6: 'gap-6' },
  },
  defaultVariants: { cols: 1, gap: 3 },
});

export type GridColumns = 1 | 2 | 3 | 4;
export type GridGap = 1 | 2 | 3 | 4 | 6;

/** Either one count for every width, or a count per breakpoint (`base` is the phone). */
export type GridCols = GridColumns | { base?: GridColumns; sm?: GridColumns; lg?: GridColumns };

export interface GridProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  cols: GridCols;
  gap?: GridGap;
  children?: ReactNode;
}

/** A grid of equal columns, one count per breakpoint. */
export function Grid({ as: Tag = 'div', cols, gap, className, children, ...rest }: GridProps) {
  const responsive = typeof cols === 'number' ? { base: cols } : cols;
  const classes = grid({
    cols: responsive.base ?? 1,
    sm: responsive.sm,
    lg: responsive.lg,
    gap,
    className,
  });

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
