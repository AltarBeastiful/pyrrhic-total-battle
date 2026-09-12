/**
 * A panel that slides in over the page: from the bottom on a phone, from the right once there is
 * room (`sm`). It is a modal — focus is trapped inside it and returns to the trigger when it
 * closes — so it always carries a visible Close button as well as the Escape key.
 *
 * Give it a `trigger` to let it open itself, or drive `isOpen`/`onOpenChange` from the caller.
 */
import type { ReactNode } from 'react';
import {
  Dialog as RACDialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
  Text,
} from 'react-aria-components';
import { tv } from 'tailwind-variants';

import { CloseIcon } from '../icons';
import { cn } from './cn';
import { IconButton } from './IconButton';

const sheet = tv({
  slots: {
    overlay: [
      'fixed inset-0 z-50 flex items-end justify-center bg-fg/40',
      'sm:items-stretch sm:justify-end',
      'motion-safe:transition-opacity motion-safe:duration-sheet entering:opacity-0 exiting:opacity-0',
    ],
    // Material 3 shape scale: a bottom sheet's top corners are extra-large, a side sheet's leading
    // edge is one step down. `rounded-t-sheet` is 24 px and stands in for the 28 px `--radius-sheet`
    // this pass asked for; swap it the moment the token lands in `src/index.css`.
    modal: [
      'flex max-h-dvh w-full flex-col overflow-hidden rounded-t-sheet bg-raised shadow-modal',
      'sm:h-dvh sm:rounded-t-none sm:rounded-l-card',
      'motion-safe:transition-transform motion-safe:duration-sheet',
      'entering:translate-y-full exiting:translate-y-full',
      'sm:entering:translate-y-0 sm:exiting:translate-y-0',
      'sm:entering:translate-x-full sm:exiting:translate-x-full',
    ],
    dialog: 'flex min-h-0 flex-1 flex-col outline-none',
    header: 'flex items-start gap-3 border-b border-line px-4 py-3 sm:px-5',
    title: 'font-display text-lg text-fg',
    description: 'mt-2 block text-sm text-muted',
    body: 'min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5',
    footer: 'flex flex-wrap justify-end gap-2 border-t border-line px-4 py-3 sm:px-5',
  },
  variants: {
    size: {
      md: { modal: 'sm:max-w-md' },
      lg: { modal: 'sm:max-w-lg' },
    },
  },
  defaultVariants: { size: 'md' },
});

export interface SheetProps {
  /** A pressable that opens the sheet. Leave it out and drive `isOpen` instead. */
  trigger?: ReactNode;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  /** Names the dialog for assistive tech and heads the panel. */
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg';
  className?: string;
}

export function Sheet({
  trigger,
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
  className,
}: SheetProps) {
  const s = sheet({ size });
  const open = {
    ...(isOpen === undefined ? {} : { isOpen }),
    ...(onOpenChange === undefined ? {} : { onOpenChange }),
  };

  const body = (
    <ModalOverlay isDismissable className={s.overlay()} {...(trigger === undefined ? open : {})}>
      <Modal className={cn(s.modal(), className)}>
        <RACDialog className={s.dialog()}>
          {({ close }) => (
            <>
              <div className={s.header()}>
                <div className="min-w-0 flex-1">
                  <Heading slot="title" className={s.title()}>
                    {title}
                  </Heading>
                  {description === undefined ? null : (
                    <Text slot="description" className={s.description()}>
                      {description}
                    </Text>
                  )}
                </div>
                <IconButton label="Close" onPress={close}>
                  <CloseIcon />
                </IconButton>
              </div>
              <div className={s.body()}>{children}</div>
              {footer === undefined ? null : <div className={s.footer()}>{footer}</div>}
            </>
          )}
        </RACDialog>
      </Modal>
    </ModalOverlay>
  );

  if (trigger === undefined) return body;
  return (
    <DialogTrigger {...open}>
      {trigger}
      {body}
    </DialogTrigger>
  );
}
