/**
 * A small floating panel anchored to its trigger — the place for an explanation that is too long
 * for a tooltip and too short for a sheet. It is a non-modal dialog: Escape closes it, focus goes
 * back to the trigger, and the panel scrolls inside the viewport rather than pushing the page.
 */
import type { ReactNode } from 'react';
import {
  Dialog as RACDialog,
  DialogTrigger,
  Popover as RACPopover,
  type Placement,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { cn } from './cn';

const popover = tv({
  slots: {
    surface: [
      'max-h-96 w-72 max-w-full overflow-y-auto rounded-card border border-line bg-surface p-4 shadow-pop',
      'motion-safe:transition-all motion-safe:duration-fast entering:opacity-0 exiting:opacity-0',
    ],
    panel: 'text-base text-fg outline-none',
  },
});

export interface PopoverProps {
  /** The pressable the panel hangs from. */
  trigger: ReactNode;
  /** Accessible name for the panel when its content has no heading of its own. */
  label?: string;
  children: ReactNode;
  placement?: Placement;
  className?: string;
}

export function Popover({ trigger, label, children, placement = 'bottom', className }: PopoverProps) {
  const p = popover();
  return (
    <DialogTrigger>
      {trigger}
      <RACPopover placement={placement} className={cn(p.surface(), className)}>
        <RACDialog className={p.panel()} {...(label === undefined ? {} : { 'aria-label': label })}>
          {children}
        </RACDialog>
      </RACPopover>
    </DialogTrigger>
  );
}
