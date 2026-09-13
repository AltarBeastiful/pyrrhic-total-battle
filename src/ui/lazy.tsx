/**
 * The boundary every surface that is loaded on first open sits behind (ui-foundation plan §6, T-06).
 *
 * Nothing inside is imported until `isOpen` first turns true, and from then on it stays mounted: a
 * dialog that is closed again keeps its exit animation and gives focus back to what opened it, and
 * opening it a second time costs nothing.
 *
 * The placeholder is deliberately almost nothing. An overlay gets none at all — it covers the page
 * when it arrives, so a line of text under the button it came from would only be a flash — while a
 * surface that appears *inside* a card reserves its own height, so the card never jumps.
 */
import { Text } from '@mantine/core';
import { Suspense, useState } from 'react';
import type { ReactNode } from 'react';

/** Room held while the chunk arrives, in the theme's own units. */
const RESERVE = {
  row: '2.25rem',
  panel: '10rem',
} as const;

export interface LazySurfaceProps {
  /** True from the moment the surface is wanted; its chunk is fetched then, and only then. */
  isOpen: boolean;
  /** Room held while the chunk arrives. Leave it out for anything that opens *over* the page. */
  reserve?: keyof typeof RESERVE;
  children: ReactNode;
}

export function LazySurface({ isOpen, reserve, children }: LazySurfaceProps) {
  const [wanted, setWanted] = useState(isOpen);
  // Adjusting state during render rather than in an effect: the first open must not cost a paint.
  if (isOpen && !wanted) setWanted(true);
  if (!wanted) return null;

  return (
    <Suspense
      fallback={
        reserve === undefined ? null : (
          <Text
            component="p"
            role="status"
            size="sm"
            c="dimmed"
            style={{ display: 'flex', alignItems: 'center', minHeight: RESERVE[reserve] }}
          >
            Loading…
          </Text>
        )
      }
    >
      {children}
    </Suspense>
  );
}
