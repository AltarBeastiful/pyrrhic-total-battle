import * as RadixDialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

import { CloseIcon } from '../icons';
import { cn } from './cn';
import { OVERLAY_CLASS } from './Dialog';
import { IconButton } from './IconButton';

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  /** Desktop edge the panel is anchored to; phones always get the bottom sheet. */
  side?: 'right' | 'left';
}

/**
 * A Dialog variant for long secondary content (bonus breakdown, battle journal): a bottom sheet on
 * phones, a side panel from ~640px up.
 */
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = 'right',
}: DrawerProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={OVERLAY_CLASS} />
        <RadixDialog.Content
          className={cn(
            'border-line bg-surface text-fg fixed z-50 flex flex-col border shadow-xl',
            'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-2xl',
            'sm:inset-y-0 sm:max-h-none sm:w-[26rem] sm:rounded-none',
            side === 'right' ? 'sm:right-0 sm:left-auto' : 'sm:right-auto sm:left-0',
          )}
          {...(description === undefined ? { 'aria-describedby': undefined } : {})}
        >
          <div className="border-line flex items-start justify-between gap-3 border-b p-4">
            <div>
              <RadixDialog.Title className="text-base font-semibold">{title}</RadixDialog.Title>
              {description !== undefined && (
                <RadixDialog.Description className="text-muted mt-1 text-xs">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close asChild>
              <IconButton label="Close" icon={<CloseIcon />} />
            </RadixDialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto p-4">{children}</div>
          {footer !== undefined && (
            <div className="border-line flex flex-wrap justify-end gap-2 border-t p-4">{footer}</div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
