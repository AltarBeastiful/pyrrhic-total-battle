/**
 * A modal question (plan §3). `Modal` for anything you can walk away from; `role="alertdialog"` for
 * the ones you cannot — a destructive confirmation, a corrupt document — which also stops a click on
 * the overlay from dismissing it.
 *
 * Mantine writes `role="dialog"` after its own prop spread, so the role cannot be passed in; it is
 * set on the element once it exists. That is one line rather than rebuilding `Modal` from its parts.
 */
import { Box, Divider, Modal, Text } from '@mantine/core';
import { useEffect, useRef, type ReactNode } from 'react';

export interface DialogProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** The row of buttons at the foot: the confirmation and the way out. */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** `alertdialog` is the variant that interrupts: no overlay dismissal, no Escape. */
  role?: 'dialog' | 'alertdialog';
}

const SIZE = { sm: '22rem', md: '30rem', lg: '40rem' } as const;

export function Dialog({
  opened,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  role = 'dialog',
}: DialogProps) {
  const body = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!opened || role !== 'alertdialog') return;
    body.current?.closest('[role="dialog"]')?.setAttribute('role', 'alertdialog');
  }, [opened, role]);

  const alert = role === 'alertdialog';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      size={SIZE[size]}
      radius="md"
      padding="md"
      centered
      closeOnClickOutside={!alert}
      closeOnEscape={!alert}
      withCloseButton={!alert}
      closeButtonProps={{ 'aria-label': 'Close' }}
    >
      <Box ref={body}>
        {description !== undefined && (
          <Text size="sm" c="dimmed" mb="sm">
            {description}
          </Text>
        )}
        {children}
        {footer !== undefined && (
          <Box mt="lg">
            <Divider mb="sm" />
            {footer}
          </Box>
        )}
      </Box>
    </Modal>
  );
}
