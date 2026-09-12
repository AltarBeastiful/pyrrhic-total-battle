/**
 * The control that "Your own order" puts beside its rule: one button, and nothing else on the first
 * load. The sheet it opens — with the engine that rebuilds the order and the kit's drag and drop —
 * is a chunk of its own, fetched the first time the button is pressed (ui-foundation plan §6).
 */
import { lazy, useState } from 'react';

import { Button } from '@/ui/kit';
import { LazySurface } from '@/ui/lazy';

const OrderSheetPanel = lazy(() =>
  import('./OrderSheetPanel').then((module) => ({ default: module.OrderSheetPanel })),
);

export function OrderSheet() {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        onPress={() => {
          setOpen(true);
        }}
      >
        Edit order
      </Button>
      <LazySurface isOpen={isOpen}>
        <OrderSheetPanel isOpen={isOpen} onOpenChange={setOpen} />
      </LazySurface>
    </>
  );
}
