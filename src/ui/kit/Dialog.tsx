/**
 * A modal question (plan §3). `Modal` for anything you can walk away from; `role="alertdialog"` for
 * the ones you cannot — a destructive confirmation, a corrupt document — which also stops a click on
 * the overlay from dismissing it.
 *
 * Mantine writes `role="dialog"` after its own prop spread, so the role cannot be passed in; it is
 * set on the element once it exists. That is one line rather than rebuilding `Modal` from its parts.
 *
 * It is set from a **ref callback**, not an effect. Outside a test environment `Modal` mounts its
 * content behind a transition, so on the render where `opened` flips true the body is not in the
 * tree yet and an effect keyed on `opened` finds nothing — which is exactly the case no jsdom test
 * could see (`env="test"` turns transitions off) and every browser had.
 */
import { Box, Divider, Modal, Text } from '@mantine/core';
import { useCallback, type ReactNode } from 'react';

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

/**
 * One step above a `Sheet` (320): a dialog is the one thing allowed to interrupt one — "Save this
 * march" is raised from inside the phone's March sheet — and it is portalled for the same reason a
 * sheet is. `theme.ts` carries the whole ladder and the defect that wrote it.
 */
export const DIALOG_Z_INDEX = 340;

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
  const body = useCallback(
    (node: HTMLDivElement | null) => {
      if (node === null || role !== 'alertdialog') return;
      node.closest('[role="dialog"]')?.setAttribute('role', 'alertdialog');
    },
    [role],
  );

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
      withinPortal
      zIndex={DIALOG_Z_INDEX}
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
