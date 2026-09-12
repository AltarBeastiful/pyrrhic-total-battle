import * as RadixPopover from '@radix-ui/react-popover';
import type { ReactNode } from 'react';

import { cn } from './cn';

export interface PopoverProps {
  /** The element that opens the popover; rendered as the trigger itself (`asChild`). */
  trigger: ReactNode;
  children: ReactNode;
  /** Controlled mode; leave both out for an uncontrolled popover. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  /** Accessible name of the panel, for popovers whose content is not self-describing. */
  label?: string;
  className?: string;
}

/** Small floating panel (unit stats, a source editor, a help note). */
export function Popover({
  trigger,
  children,
  open,
  onOpenChange,
  side = 'bottom',
  align = 'start',
  label,
  className,
}: PopoverProps) {
  return (
    <RadixPopover.Root
      {...(open === undefined ? {} : { open })}
      {...(onOpenChange === undefined ? {} : { onOpenChange })}
    >
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={12}
          {...(label === undefined ? {} : { 'aria-label': label })}
          className={cn(
            'border-line bg-surface text-fg z-50 max-w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border p-3 text-sm shadow-lg',
            className,
          )}
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
