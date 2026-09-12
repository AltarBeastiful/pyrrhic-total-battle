import * as RadixDialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';

import { CloseIcon } from '../icons';
import { cn } from './cn';
import { IconButton } from './IconButton';
import { useReturnFocus } from './useReturnFocus';

export type DialogSize = 'sm' | 'md' | 'lg';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Rendered as the accessible description; omit when the body speaks for itself. */
  description?: ReactNode;
  children?: ReactNode;
  /** Right-aligned action row at the bottom (Cancel / confirm). */
  footer?: ReactNode;
  size?: DialogSize;
}

export const OVERLAY_CLASS = 'fixed inset-0 z-40 bg-black/55 backdrop-blur-[2px]';

const SIZES: Record<DialogSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
};

/** Modal dialog: full width with a comfortable gutter on phones, centred card on desktop. */
export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
}: DialogProps) {
  const onCloseAutoFocus = useReturnFocus(open);

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={OVERLAY_CLASS} />
        <RadixDialog.Content
          onCloseAutoFocus={onCloseAutoFocus}
          className={cn(
            'border-line bg-surface text-fg fixed top-1/2 left-1/2 z-50 max-h-[85dvh] w-[calc(100vw-2rem)]',
            'rounded-card shadow-modal -translate-x-1/2 -translate-y-1/2 overflow-y-auto border p-4 sm:p-5',
            SIZES[size],
          )}
          {...(description === undefined ? { 'aria-describedby': undefined } : {})}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <RadixDialog.Title className="font-display text-lg leading-tight font-semibold">
                {title}
              </RadixDialog.Title>
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
          {children}
          {footer !== undefined && <div className="mt-4 flex flex-wrap justify-end gap-2">{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
