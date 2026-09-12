import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { tv } from 'tailwind-variants';

/**
 * The two-column frame of the desktop app (design plan D-10): the editor on the left, the result on
 * the right, each scrolling on its own so neither can push the other out of view. Below the
 * breakpoint the two columns are simply stacked and the page scrolls as one, which is what a phone
 * wants.
 *
 * The independent scroll is three classes working together: the root is exactly one viewport tall
 * and hides its own overflow, so the page itself cannot scroll; each column is that same height and
 * scrolls inside it.
 */
const split = tv({
  slots: {
    root: 'grid gap-4',
    start: 'min-w-0',
    end: 'min-w-0',
  },
  variants: {
    breakpoint: {
      md: {
        root: 'md:h-dvh md:grid-cols-12 md:overflow-hidden',
        start: 'md:h-dvh md:overflow-y-auto md:overscroll-contain',
        end: 'md:h-dvh md:overflow-y-auto md:overscroll-contain',
      },
      lg: {
        root: 'lg:h-dvh lg:grid-cols-12 lg:overflow-hidden',
        start: 'lg:h-dvh lg:overflow-y-auto lg:overscroll-contain',
        end: 'lg:h-dvh lg:overflow-y-auto lg:overscroll-contain',
      },
    },
    ratio: {
      '5/7': { root: '' },
      '1/1': { root: '' },
    },
  },
  compoundVariants: [
    { breakpoint: 'md', ratio: '5/7', class: { start: 'md:col-span-5', end: 'md:col-span-7' } },
    { breakpoint: 'md', ratio: '1/1', class: { start: 'md:col-span-6', end: 'md:col-span-6' } },
    { breakpoint: 'lg', ratio: '5/7', class: { start: 'lg:col-span-5', end: 'lg:col-span-7' } },
    { breakpoint: 'lg', ratio: '1/1', class: { start: 'lg:col-span-6', end: 'lg:col-span-6' } },
  ],
  defaultVariants: { breakpoint: 'lg', ratio: '5/7' },
});

export type SplitRatio = '5/7' | '1/1';
export type SplitBreakpoint = 'md' | 'lg';

export interface SplitProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** The left-hand column: what the player edits. */
  start: ReactNode;
  /** The right-hand column: what the app answers. */
  end: ReactNode;
  ratio?: SplitRatio;
  /** The width at which the single column becomes two. */
  breakpoint?: SplitBreakpoint;
}

/** Two columns that scroll independently from the breakpoint up, stacked below it. */
export function Split({ as: Tag = 'div', start, end, ratio, breakpoint, className, ...rest }: SplitProps) {
  const slots = split({ ratio, breakpoint });

  return (
    <Tag className={slots.root({ className })} {...rest}>
      <div className={slots.start()}>{start}</div>
      <div className={slots.end()}>{end}</div>
    </Tag>
  );
}
