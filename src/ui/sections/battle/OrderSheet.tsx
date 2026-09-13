/**
 * The control "Your own order" puts under the method cards: one button, and nothing else on the
 * first load. The sheet it opens — with the engine that rebuilds the order — is a chunk of its own,
 * fetched the first time the button is pressed (ui-foundation plan §6).
 */
import { Button } from '@mantine/core';
import { lazy, useState } from 'react';

import { LazySurface } from '@/ui/lazy';

const OrderSheetPanel = lazy(() =>
  import('./OrderSheetPanel').then((module) => ({ default: module.OrderSheetPanel })),
);

export function OrderSheet() {
  const [opened, setOpened] = useState(false);

  return (
    <>
      <Button
        variant="default"
        onClick={() => {
          setOpened(true);
        }}
      >
        Edit order
      </Button>
      <LazySurface isOpen={opened}>
        <OrderSheetPanel
          opened={opened}
          onClose={() => {
            setOpened(false);
          }}
        />
      </LazySurface>
    </>
  );
}
