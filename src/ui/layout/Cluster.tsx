import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { tv } from 'tailwind-variants';

/** A row that wraps: chips, buttons, anything that reads as a line of small things. */
const cluster = tv({
  base: 'flex',
  variants: {
    gap: { 1: 'gap-1', 2: 'gap-2', 3: 'gap-3', 4: 'gap-4', 6: 'gap-6' },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      baseline: 'items-baseline',
      stretch: 'items-stretch',
    },
    justify: {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
    },
    wrap: { true: 'flex-wrap', false: 'flex-nowrap' },
  },
  defaultVariants: { gap: 2, align: 'center', justify: 'start', wrap: true },
});

export type ClusterGap = 1 | 2 | 3 | 4 | 6;
export type ClusterAlign = 'start' | 'center' | 'end' | 'baseline' | 'stretch';
export type ClusterJustify = 'start' | 'center' | 'end' | 'between';

export interface ClusterProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  gap?: ClusterGap;
  align?: ClusterAlign;
  justify?: ClusterJustify;
  /** Wrapping is the default; turn it off only when the row is guaranteed to fit. */
  wrap?: boolean;
  children?: ReactNode;
}

/** A horizontal run of children that wraps onto the next line instead of overflowing. */
export function Cluster({
  as: Tag = 'div',
  gap,
  align,
  justify,
  wrap,
  className,
  children,
  ...rest
}: ClusterProps) {
  return (
    <Tag className={cluster({ gap, align, justify, wrap, className })} {...rest}>
      {children}
    </Tag>
  );
}
