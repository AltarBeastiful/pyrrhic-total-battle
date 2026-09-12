/**
 * The unit sheet (design plan §7.6), which replaces the old popover: no grid of twelve labelled
 * numbers, each figure once, next to the sentence that gives it meaning.
 *
 * It opens from any tile (a long press) and from the Details button of a row, and it is the one
 * place that holds every action about a single type: keep it in, leave it out, edit its count.
 */
import type { ReactNode } from 'react';

import type { UnitDef } from '@/engine/types';
import { GROUP_LABEL, romanTier, StatBar, UnitTile, unitGroupOf } from '@/ui/domain';
import { Button, Sheet } from '@/ui/kit';
import { Cluster, Stack } from '@/ui/layout';

import { keepInMarch, removeFromFormation, stopKeeping } from './formation';
import { amount, duration, percent, ratio } from './format';
import type { MarchStackRow } from './rows';

/** One headed block of the sheet. */
function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack gap={1}>
      <h4 className="text-muted text-sm">{title}</h4>
      {children}
    </Stack>
  );
}

export interface UnitSheetProps {
  /** The type the sheet is about; `null` closes it. */
  unit: UnitDef | null;
  /** Its stack, when it is marching. */
  row?: MarchStackRow | undefined;
  /** Damage of the whole march, so the stack's share can be said as a share. */
  totalDamage: number;
  pinned: boolean;
  onOpenChange: (open: boolean) => void;
  /** Turns the counts into steppers; the sheet closes behind it. */
  onEditCount: () => void;
}

export function UnitSheet({ unit, row, totalDamage, pinned, onOpenChange, onEditCount }: UnitSheetProps) {
  if (unit === null) return null;

  const group = unitGroupOf(unit);
  const stack = row?.stack;
  const share =
    row === undefined || totalDamage <= 0 ? 0 : (row.stack.damagePerHit * row.hits * 100) / totalDamage;

  const close = (): void => {
    onOpenChange(false);
  };

  return (
    <Sheet
      isOpen
      onOpenChange={onOpenChange}
      title={unit.name}
      description={`${GROUP_LABEL[group]} ${romanTier(unit.tier)}`}
      footer={
        <>
          <Button
            onPress={() => {
              if (pinned) stopKeeping(unit.id);
              else keepInMarch(unit.id);
              close();
            }}
          >
            {pinned ? 'Stop keeping it' : 'Keep in march'}
          </Button>
          {row !== undefined && (
            <Button
              onPress={() => {
                onEditCount();
                close();
              }}
            >
              Edit count
            </Button>
          )}
          {row !== undefined && (
            <Button
              variant="danger"
              onPress={() => {
                removeFromFormation(unit.id);
                close();
              }}
            >
              Leave out
            </Button>
          )}
        </>
      }
    >
      <Stack gap={4}>
        <UnitTile unit={unit} size="lg" state={pinned ? 'pinned' : row === undefined ? 'leftOut' : 'on'} />

        <Block title="In this march">
          {row === undefined || stack === undefined ? (
            <p>Left out of this march. Keeping it in puts it back and holds it there.</p>
          ) : (
            <Stack gap={1}>
              <p>
                {`${amount(stack.count)} ${unit.name} land ${amount(row.hits)} `}
                {row.hits === 1 ? 'hit' : 'hits'}
                {` and deal ${percent(share)} of the damage.`}
              </p>
              <p className="text-muted text-sm">
                {row.position === undefined ? 'Not in the battle.' : `Falls number ${String(row.position)}.`}
                {` All ${amount(row.lost)} are lost: ${amount(row.reviveGold)} gold to revive them,`}
                {` or ${amount(row.retrainSilver)} silver and ${duration(row.retrainSeconds)} to retrain.`}
              </p>
            </Stack>
          )}
        </Block>

        {stack !== undefined && (
          <Block title="Why this size">
            <p>
              {`The stack has to reach ${amount(stack.totalHp)} health: ${amount(
                stack.hpPerUnit,
              )} each × ${amount(stack.count)} units.`}
            </p>
          </Block>
        )}

        <Block title="Unit">
          <Cluster gap={4} align="start">
            <StatBar
              label="Health"
              base={unit.health}
              boosted={stack?.hpPerUnit ?? unit.health}
              format={amount}
            />
            <StatBar
              label="Strength"
              base={unit.strength}
              boosted={stack?.strengthPerUnit ?? unit.strength}
              format={ratio}
            />
          </Cluster>
        </Block>
      </Stack>
    </Sheet>
  );
}
