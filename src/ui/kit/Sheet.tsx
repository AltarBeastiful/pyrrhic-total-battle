/**
 * The side sheet (plan §3): a bottom sheet on a phone, a right-hand drawer from `sm` up — the same
 * component, anchored where the screen has room. Mantine returns focus to whatever opened it when it
 * closes, which is the one behaviour a sheet must never get wrong.
 *
 * It is portalled to `document.body` and stacked at 320, over every bar this app pins to an edge and
 * over the March sheet a phone opens it from (`theme.ts` carries the whole ladder). Left at
 * Mantine's own 200 it opened *behind* the command bar on a desktop and behind the March sheet on a
 * phone, which is the defect the owner found on 2026-09-13: the actions on it could not be reached.
 * Both are set here as well as in the theme, because a sheet that loses this is a sheet nobody can
 * use, and a default is easier to lose than a prop.
 */
import { Box, Divider, Drawer, Text } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import type { ReactNode } from 'react';

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
}

const SIZE = { sm: '20rem', md: '26rem', lg: '34rem' } as const;

/** Over the command bar (250) and over the March sheet a phone raises this one from (300). */
export const SHEET_Z_INDEX = 320;

export function Sheet({ opened, onClose, title, description, children, footer, size = 'md' }: SheetProps) {
  // `getInitialValueInEffect: false` so the first paint is already the right anchor; jsdom has no
  // `matchMedia`, and the fallback there is the phone shape, which is the one we test.
  const wide = useMediaQuery('(min-width: 48em)', false, { getInitialValueInEffect: false });

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
      zIndex={SHEET_Z_INDEX}
      closeButtonProps={{ 'aria-label': 'Close' }}
    >
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
    </Drawer>
  );
}
