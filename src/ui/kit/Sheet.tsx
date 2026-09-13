/**
 * The side sheet (plan §3): a bottom sheet on a phone, a right-hand drawer from `sm` up — the same
 * component, anchored where the screen has room. Mantine returns focus to whatever opened it when it
 * closes, which is the one behaviour a sheet must never get wrong.
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
