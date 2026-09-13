/**
 * The unit sheet (design plan §7.6, design rule 27), which replaced the old popover: no grid of
 * twelve labelled numbers. Each figure appears once, inside the sentence that gives it meaning.
 *
 * It opens from the figure under a tile and from a row's info button, and it is the one place that
 * holds every action about a single type: keep it in, leave it out, edit its count.
 */
import { Button, Group, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

import type { UnitDef } from '@/engine/types';
import { GROUP_LABEL, romanTier, StatBar, unitGroupOf, UnitTile } from '@/ui/domain';
import { Sections, Sheet } from '@/ui/kit';

import classes from './march.module.css';

import { keepInMarch, removeFromFormation, stopKeeping } from './formation';
import { amount, duration, percent, ratio } from './format';
import type { MarchStackRow } from './rows';

/**
 * One part of the sheet: the same head every figure on the page wears — **12 px muted above what it
 * is about** — and then the sentences (design rule 27: a unit's details read as prose, never as a
 * grid of labelled numbers). The parts themselves are told apart by `Sections`, so this sheet has
 * the March's rhythm rather than one of its own.
 */
function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack gap={6}>
      <Text component="h4" className={classes.meta} c="dimmed" fw={500}>
        {title}
      </Text>
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
  onClose: () => void;
  /** Turns the counts into fields; the sheet closes behind it. */
  onEditCount: () => void;
}

export function UnitSheet({ unit, row, totalDamage, pinned, onClose, onEditCount }: UnitSheetProps) {
  if (unit === null) return null;

  const group = unitGroupOf(unit);
  const stack = row?.stack;
  const share =
    row === undefined || totalDamage <= 0 ? 0 : (row.stack.damagePerHit * row.hits * 100) / totalDamage;

  return (
    <Sheet
      opened
      onClose={onClose}
      title={unit.name}
      description={`${GROUP_LABEL[group]} ${romanTier(unit.tier)}`}
      footer={
        <Group gap="xs">
          <Button
            variant="default"
            onClick={() => {
              if (pinned) stopKeeping(unit.id);
              else keepInMarch(unit.id);
              onClose();
            }}
          >
            {pinned ? 'Stop keeping it' : 'Keep in march'}
          </Button>
          {row !== undefined && (
            <Button
              variant="default"
              onClick={() => {
                onEditCount();
                onClose();
              }}
            >
              Edit count
            </Button>
          )}
          {row !== undefined && (
            <Button
              color="red"
              onClick={() => {
                removeFromFormation(unit.id);
                onClose();
              }}
            >
              Leave out
            </Button>
          )}
        </Group>
      }
    >
      <Sections>
        <UnitTile unit={unit} size="lg" state={pinned ? 'pinned' : row === undefined ? 'leftOut' : 'on'} />

        <Block title="In this march">
          {row === undefined || stack === undefined ? (
            <Text size="sm">Left out of this march. Keeping it in puts it back and holds it there.</Text>
          ) : (
            <Stack gap={4}>
              <Text size="sm">
                {`${amount(stack.count)} ${unit.name} land ${amount(row.hits)} `}
                {row.hits === 1 ? 'hit' : 'hits'}
                {` and deal ${percent(share)} of the damage.`}
              </Text>
              <Text size="xs" c="dimmed">
                {row.position === undefined ? 'Not in the battle.' : `Falls number ${String(row.position)}.`}
                {` All ${amount(row.lost)} are lost: ${amount(row.reviveGold)} gold to revive them,`}
                {` or ${amount(row.retrainSilver)} silver and ${duration(row.retrainSeconds)} to retrain.`}
              </Text>
            </Stack>
          )}
        </Block>

        {stack !== undefined && (
          <Block title="Why this size">
            <Text size="sm">
              {`The stack has to reach ${amount(stack.totalHp)} health: ${amount(
                stack.hpPerUnit,
              )} each × ${amount(stack.count)} units.`}
            </Text>
          </Block>
        )}

        <Block title="Unit">
          <Stack gap="sm">
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
          </Stack>
        </Block>
      </Sections>
    </Sheet>
  );
}
