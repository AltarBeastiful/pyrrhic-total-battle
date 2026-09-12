import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { tv } from 'tailwind-variants';

/**
 * A page and its supporting pane (Material 3's supporting-pane pattern, confirmed against the
 * configurators we measured against): **one page scroll**, everywhere. Two panes that scroll
 * independently make a wide screen feel like two windows and cost the page its scrollbar; the
 * answer is kept in view by sticking it, not by trapping the page.
 *
 * Below `xl` the halves are simply stacked and the page scrolls as one. From `xl` the end becomes a
 * fixed-width pane (`w-pane`) beside a fluid start, and `pane-sticky` parks it under the app bar
 * with a scrollbar of its own *only* when the march is taller than the viewport.
 */
const split = tv({
  slots: {
    root: 'flex flex-col gap-4 xl:flex-row xl:items-start xl:gap-6',
    start: 'min-w-0 xl:flex-1',
    end: 'min-w-0 xl:w-pane xl:shrink-0',
  },
  variants: {
    sticky: {
      true: { end: 'pane-sticky' },
      false: {},
    },
  },
  defaultVariants: { sticky: false },
});

export interface SplitProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  /** The page itself: what the player edits. Fluid from `xl` up. */
  start: ReactNode;
  /** The supporting pane: what the app answers. `w-pane` wide from `xl` up. */
  end: ReactNode;
  /**
   * Let the pane stay beside the page while it scrolls. `pane-sticky` is a plain utility class and
   * carries no breakpoint of its own, so the caller turns it on only where the pane really is beside
   * the page — below that it would give a phone a second scrollbar, which is the thing this layout
   * exists to avoid.
   */
  sticky?: boolean;
}

/** One column below `xl`, a page and its supporting pane above it — and one scrollbar either way. */
export function Split({ as: Tag = 'div', start, end, sticky, className, ...rest }: SplitProps) {
  const slots = split({ sticky });

  return (
    <Tag className={slots.root({ className })} {...rest}>
      <div className={slots.start()}>{start}</div>
      <div className={slots.end()}>{end}</div>
    </Tag>
  );
}
