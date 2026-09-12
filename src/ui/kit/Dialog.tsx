/**
 * A centred modal for a question that has to be answered before anything else happens. `role`
 * switches between the ordinary `dialog` and `alertdialog`; an alert dialog cannot be dismissed by
 * clicking the scrim, because losing it by accident is the whole thing an alert is guarding against.
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

const dialog = tv({
  slots: {
    overlay: [
      'fixed inset-0 z-50 flex items-center justify-center bg-fg/40 p-4',
      'motion-safe:transition-opacity motion-safe:duration-fast entering:opacity-0 exiting:opacity-0',
    ],
    modal: [
      'flex max-h-dvh w-full max-w-md flex-col overflow-hidden rounded-card border border-line bg-surface shadow-modal',
      'motion-safe:transition-all motion-safe:duration-fast',
      'entering:scale-95 entering:opacity-0 exiting:scale-95 exiting:opacity-0',
    ],
    panel: 'flex min-h-0 flex-col outline-none',
    header: 'flex items-start gap-3 px-5 pt-5',
    title: 'font-display text-lg text-fg',
    description: 'mt-1 block text-sm text-muted',
    body: 'min-h-0 overflow-y-auto px-5 py-4',
    footer: 'flex flex-wrap justify-end gap-2 px-5 pb-5',
  },
});

export interface DialogProps {
  /** A pressable that opens the dialog. Leave it out and drive `isOpen` instead. */
  trigger?: ReactNode;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  role?: 'dialog' | 'alertdialog';
  className?: string;
}

export function Dialog({
  trigger,
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  footer,
  role = 'dialog',
  className,
}: DialogProps) {
  const d = dialog();
  const open = {
    ...(isOpen === undefined ? {} : { isOpen }),
    ...(onOpenChange === undefined ? {} : { onOpenChange }),
  };

  const body = (
    <ModalOverlay
      isDismissable={role === 'dialog'}
      className={d.overlay()}
      {...(trigger === undefined ? open : {})}
    >
      <Modal className={cn(d.modal(), className)}>
        <RACDialog role={role} className={d.panel()}>
          {({ close }) => (
            <>
              <div className={d.header()}>
                <div className="min-w-0 flex-1">
                  <Heading slot="title" className={d.title()}>
                    {title}
                  </Heading>
                  {description === undefined ? null : (
                    <Text slot="description" className={d.description()}>
                      {description}
                    </Text>
                  )}
                </div>
                <IconButton label="Close" onPress={close}>
                  <CloseIcon />
                </IconButton>
              </div>
              <div className={d.body()}>{children}</div>
              {footer === undefined ? null : <div className={d.footer()}>{footer}</div>}
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
