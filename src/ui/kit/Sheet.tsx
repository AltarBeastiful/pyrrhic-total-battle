/**
 * The side sheet (plan §3): a bottom sheet on a phone, a right-hand drawer from `sm` up — the same
 * component, anchored where the screen has room. Mantine returns focus to whatever opened it when it
 * closes, which is the one behaviour a sheet must never get wrong.
 *
 * It is portalled to `document.body` and stacked at the ladder's sheet step — over every bar this
 * app pins to an edge and over the March sheet a phone opens it from (`LAYERS`, `theme.ts`). Left
 * at Mantine's own 200 it opened *behind* the command bar on a desktop and behind the March sheet
 * on a phone, which is the defect the owner found on 2026-09-13: the actions on it could not be
 * reached. That number lives in one place, because the step above it matters as much: a `Select`
 * opened inside this sheet needs a dropdown that clears it too (2026-09-28).
 */
import { Box, Divider, Drawer, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { KeyboardEvent, ReactNode } from 'react';

import { LAYERS } from '@/ui/theme';

import { isCommitEnter, nextTypedField } from './enterCommits';
import { useOpenEditor } from './openEditors';

export interface SheetProps {
  opened: boolean;
  onClose: () => void;
  /** The sheet's accessible name, and its visible title. */
  title: string;
  description?: ReactNode;
  children: ReactNode;
  /** A bar at the foot of the sheet: the one action it exists for. */
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /**
   * What Enter does in the sheet's last field. A sheet that saves as it is typed closes, which is the
   * default; one whose figures wait for a button (the custom mercenary's *Add*) says what that button
   * does instead.
   */
  onEnter?: () => void;
}

const SIZE = { sm: '20rem', md: '26rem', lg: '34rem' } as const;

export function Sheet({
  opened,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  onEnter,
}: SheetProps) {
  // `getInitialValueInEffect: false` so the first paint is already the right anchor; jsdom has no
  // `matchMedia`, and the fallback there is the phone shape, which is the one we test.
  const wide = useMediaQuery('(min-width: 48em)', false, { getInitialValueInEffect: false });

  // A sheet is a setup editor, so `Ctrl`/`⌘ + Enter` closes it on its way to the march
  // (`openEditors.ts`). Everything on one saves as it is typed — the footer's only word is Done —
  // so there is nothing for the close to lose.
  useOpenEditor(opened, onClose);

  // **Enter finishes a figure** (owner, 2026-10-02; `enterCommits.ts`): it walks to the next field of
  // the sheet, and on the last one it does what the footer's main button does — Done for a sheet that
  // saves as it is typed. A sheet of one field therefore closes on the first Enter.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (!isCommitEnter(event)) return;
    const field = event.target as HTMLInputElement;
    event.preventDefault();
    const next = nextTypedField(event.currentTarget, field);
    if (next !== null) {
      next.focus();
      return;
    }
    (onEnter ?? onClose)();
  };

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      title={title}
      position={wide ? 'right' : 'bottom'}
      size={wide ? SIZE[size] : 'auto'}
      radius="md"
      padding="md"
      withinPortal
      zIndex={LAYERS.sheet}
      closeButtonProps={{ 'aria-label': 'Close' }}
    >
      {description !== undefined && (
        <Text size="sm" c="dimmed" mb="sm">
          {description}
        </Text>
      )}
      <Box onKeyDown={onKeyDown}>{children}</Box>
      {/* The sheet's last part, told apart the way every card's parts are: one hairline with 16 px
          above and below (docs/design.md §4). It was 16 above and 8 below, which read as the footer
          hanging off the rule rather than as a part of its own. */}
      {footer !== undefined && (
        <Box mt="lg">
          <Divider mb="lg" />
          {footer}
        </Box>
      )}
    </Drawer>
  );
}
