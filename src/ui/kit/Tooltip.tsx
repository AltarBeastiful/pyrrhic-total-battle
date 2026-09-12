/**
 * A short label that appears on hover or keyboard focus. It repeats visible text only — the name of
 * an icon button, a truncated value — because a tooltip is unreachable on a touch screen and must
 * never be the only place an instruction lives.
 */
import type { ReactNode } from 'react';
import { Tooltip as RACTooltip, TooltipTrigger, type Placement } from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { cn } from './cn';

const tooltip = tv({
  base: [
    'max-w-64 rounded-control border border-line bg-raised px-2 py-1 font-sans text-xs text-fg shadow-pop',
    'motion-safe:transition-opacity motion-safe:duration-fast entering:opacity-0 exiting:opacity-0',
  ],
});

export interface TooltipProps {
  /** The words shown. Keep them to a phrase; they repeat what is already on screen. */
  content: ReactNode;
  /** The trigger element — a kit `Button`, `IconButton` or any focusable kit control. */
  children: ReactNode;
  placement?: Placement;
  /** Hover delay in milliseconds; keyboard focus always shows it at once. */
  delay?: number;
  className?: string;
}

export function Tooltip({ content, children, placement = 'top', delay = 500, className }: TooltipProps) {
  return (
    <TooltipTrigger delay={delay}>
      {children}
      <RACTooltip placement={placement} className={cn(tooltip(), className)}>
        {content}
      </RACTooltip>
    </TooltipTrigger>
  );
}
