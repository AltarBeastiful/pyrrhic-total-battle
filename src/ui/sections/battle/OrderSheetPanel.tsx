/**
 * The body of "Your own order" (design overhaul §7.4): the Battle card shows the rule, and the list
 * of stacks — which is long and nothing like a row of options — opens beside it. The whole file sits
 * behind `React.lazy`, which is what keeps the engine out of the first load; `OrderSheet.tsx` is the
 * button that asks for it.
 *
 * The order is stored as a plain list of unit ids; what the sheet shows is always the stored list
 * re-merged with the units currently in the march (ids that no longer exist are dropped, new ones
 * are appended in tier-ladder order), which is exactly what the engine does when it reads
 * `customOrder`.
 */
import { Alert, Button } from '@mantine/core';
import { RotateCcw } from 'lucide-react';
import { useMemo } from 'react';

import type { UnitDef } from '@/data/types';
import { buildKillOrder } from '@/engine';
import type { StackingOptions } from '@/engine';
import { buildUnits } from '@/state/derive';
import { selectActiveProfile, selectActiveSetup, useStore } from '@/state/store';
import { Sheet } from '@/ui/kit2';

import { KillOrderList } from './KillOrderList';

export interface OrderSheetPanelProps {
  opened: boolean;
  onClose: () => void;
}

export function OrderSheetPanel({ opened, onClose }: OrderSheetPanelProps) {
  const profile = useStore(selectActiveProfile);
  const setup = useStore(selectActiveSetup);
  const updateActiveSetup = useStore((state) => state.updateActiveSetup);

  const units = useMemo<UnitDef[]>(() => (profile === undefined ? [] : buildUnits(profile).units), [profile]);

  if (setup === undefined) return null;

  const options = setup.options;
  const stored = options.customOrder ?? [];
  // `StackingOptions` treats `customOrder` as strictly absent-or-present, so it is passed explicitly
  // rather than spread from the stored options (which type it as `string[] | undefined`).
  const base: StackingOptions = {
    method: options.method,
    strictMercsAboveMonsters: options.strictMercsAboveMonsters,
    monstersLast: options.monstersLast,
    roundTo10: options.roundTo10,
  };
  const defaultOrder = buildKillOrder(units, { ...base, method: 'elite' });
  const order = buildKillOrder(units, { ...base, method: 'custom', customOrder: stored });
  const unitsById = new Map(units.map((unit) => [unit.id, unit]));
  const isDefault = order.length === defaultOrder.length && order.every((id, i) => id === defaultOrder[i]);

  const setOrder = (next: string[]): void => {
    updateActiveSetup((current) => ({ options: { ...current.options, customOrder: next } }));
  };

  return (
    <Sheet
      size="lg"
      opened={opened}
      onClose={onClose}
      title="Order of the fall"
      description="First to fall at the top. Move a row with its two arrows; every move is announced."
      footer={
        <Button
          variant="subtle"
          leftSection={<RotateCcw size={14} aria-hidden />}
          disabled={isDefault}
          onClick={() => {
            setOrder(defaultOrder);
          }}
        >
          Back to the tier ladder
        </Button>
      }
    >
      {order.length === 0 ? (
        <Alert color="brass" variant="light">
          There is no stack to order yet. Pick tiers in Troops, or hire a mercenary.
        </Alert>
      ) : (
        <KillOrderList order={order} units={unitsById} onChange={setOrder} />
      )}
    </Sheet>
  );
}
