import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { tv } from 'tailwind-variants';

/** The only vertical rhythm in the app: a column with one of five gaps. */
const stack = tv({
  base: 'flex flex-col',
  variants: {
    gap: { 1: 'gap-1', 2: 'gap-2', 3: 'gap-3', 4: 'gap-4', 6: 'gap-6' },
    align: {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
    },
  },
  defaultVariants: { gap: 3, align: 'stretch' },
});

export type StackGap = 1 | 2 | 3 | 4 | 6;
export type StackAlign = 'start' | 'center' | 'end' | 'stretch';

export interface StackProps extends HTMLAttributes<HTMLElement> {
  /** The element to render; `div` unless the content is a list or a landmark. */
  as?: ElementType;
  gap?: StackGap;
  align?: StackAlign;
  children?: ReactNode;
}

/** A vertical run of children with a single, token-sized gap. */
export function Stack({ as: Tag = 'div', gap, align, className, children, ...rest }: StackProps) {
  return (
    <Tag className={stack({ gap, align, className })} {...rest}>
      {children}
    </Tag>
  );
}
