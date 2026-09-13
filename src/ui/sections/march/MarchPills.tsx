/**
 * The march as TotalStack's own recap, in our colours (design plan §5.5, the owner's corrections of
 * 2026-09-13): **one block per housing pool** — the pool's figure in the pool's colour beside its
 * glyph, then the stacks that pool paid for as two-line pills coloured by tier, as many across as
 * fit at 78 px. Under the pools, the types this march left out as a small outlined row. Under that,
 * the two things a player does with a whole march: copy every count, or edit them by hand.
 *
 * A press on a stack pill **takes that type out of the march** (owner, 2026-09-13): the march is
 * re-sized on the spot and the type drops into the "Left out" row, where a press puts it back. That
 * is the whole gesture — the ⓘ in the pill's corner is the unit sheet, and copying is "Copy all
 * counts" under the pools.
 *
 * It replaces three blocks that said the same thing three times (design rule 5): the grid of 44 px
 * unit tiles, the row of pool gauges, and the "counts to copy" table whose every figure is one
 * press away in the unit sheet. The pool's figure *is* the gauge, written rather than drawn; **the
 * pills are the counts**.
 */
import { Button, Group, Stack, Text } from '@mantine/core';
import { Copy, Pencil, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { UnitDef } from '@/engine/types';
import { Glyph, LeftOutPill, poolInk, StackPill } from '@/ui/domain';
import domainClasses from '@/ui/domain/domain.module.css';
import { copyText } from '@/ui/profile/download';

import { keepInMarch, removeFromFormation } from './formation';
import { amount } from './format';
import classes from './march.module.css';
import { countsText } from './rows';
import type { MarchStackRow, PoolRow } from './rows';

/** How long "Copied" stays on screen. */
const COPIED_MS = 1500;

/** What a pool is called in a sentence; the glyph is the game's own. */
const POOL_LABEL = {
  leadership: 'Leadership',
  authority: 'Authority',
  dominance: 'Dominance',
} as const;

/** A message that clears itself, for the one clipboard action left. */
function useFlash(): [string, (message: string) => void] {
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (message === '') return;
    const timer = globalThis.setTimeout(() => {
      setMessage('');
    }, COPIED_MS);
    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [message]);
  return [message, setMessage];
}

export interface MarchPillsProps {
  rows: PoolRow[];
  /** Types this march does not field; a press on one puts it back. */
  leftOut: UnitDef[];
  editing: boolean;
  onCount: (unitId: string, count: number) => void;
  /** A pill's corner mark: the unit sheet for that one type. */
  onDetails: (unit: UnitDef) => void;
}

/**
 * The march at a glance: the pools, their stacks, and what was left out. On a desktop the whole
 * pane stays on screen while the setup scrolls past it (`shell/MarchPane.tsx`), so this block and
 * the whole-march actions under it travel together and neither can cover the other.
 */
export function MarchPills({ rows, leftOut, editing, onCount, onDetails }: MarchPillsProps) {
  return (
    <Stack gap="lg">
      {rows.map((row) => {
        const over = row.used > row.capacity;
        return (
          <Stack key={row.pool} gap="xs">
            <Group gap={10} wrap="nowrap" align="center">
              <Text
                span
                fz="1.625rem"
                lh={1}
                fw={700}
                className={classes.poolFigure}
                c={over ? 'var(--mantine-color-danger-filled)' : poolInk(row.pool)}
              >
                {amount(row.used)}
              </Text>
              <Text span fz="1.375rem" lh={1}>
                <Glyph kind={row.pool} label={POOL_LABEL[row.pool]} />
              </Text>
              <Text span size="xs" c="dimmed">
                {`of ${amount(row.capacity)}`}
              </Text>
            </Group>
            {row.entries.length > 0 && (
              <div
                className={domainClasses.pillGrid}
                role="group"
                aria-label={`${POOL_LABEL[row.pool]} stacks`}
              >
                {row.entries.map((entry) => (
                  <StackPill
                    key={entry.unit.id}
                    unit={entry.unit}
                    count={entry.count}
                    state={entry.state}
                    editing={editing}
                    onCount={(next) => {
                      onCount(entry.unit.id, next);
                    }}
                    onLeaveOut={() => {
                      removeFromFormation(entry.unit.id);
                    }}
                    onDetails={() => {
                      onDetails(entry.unit);
                    }}
                  />
                ))}
              </div>
            )}
          </Stack>
        );
      })}

      {leftOut.length > 0 && (
        <Stack gap={6}>
          <Text span size="xs" c="dimmed">
            Left out — tap to put back
          </Text>
          <Group gap={6} wrap="wrap" role="group" aria-label="Left out of this march">
            {leftOut.map((unit) => (
              <LeftOutPill
                key={unit.id}
                unit={unit}
                onPutBack={() => {
                  keepInMarch(unit.id);
                }}
              />
            ))}
            <Button
              variant="subtle"
              size="compact-xs"
              onClick={() => {
                for (const unit of leftOut) keepInMarch(unit.id);
              }}
            >
              Put back all
            </Button>
          </Group>
        </Stack>
      )}
    </Stack>
  );
}

export interface MarchCountsBarProps {
  /** Every stack, for "Copy all counts". */
  countRows: MarchStackRow[];
  editing: boolean;
  onEditing: (editing: boolean) => void;
  /** Some count was changed by hand, so there is something to undo. */
  edited: boolean;
  onUndo: () => void;
}

/**
 * The two things a player does with a whole march, under the pills: copy every count at once, or
 * turn each pill's count into a field in place. **This row is the copy control** (owner,
 * 2026-09-13): a press on a pill leaves its type out, so there is no second, smaller copy hiding in
 * the grid — and the count on a pill is still text a player can select by hand.
 */
export function MarchCountsBar({ countRows, editing, onEditing, edited, onUndo }: MarchCountsBarProps) {
  const [flash, setFlash] = useFlash();

  return (
    <Group gap="sm" wrap="wrap">
      <Button
        size="compact-sm"
        variant="default"
        leftSection={<Copy size={14} aria-hidden />}
        onClick={() => {
          void copyText(countsText(countRows));
          setFlash('Copied');
        }}
      >
        Copy all counts
      </Button>
      {/* One toggle, not a pair of modes (owner, 2026-09-13): editing is a state the button names,
          and there is only one copy on the page — the button beside it. */}
      <Button
        size="compact-sm"
        variant={editing ? 'filled' : 'default'}
        aria-pressed={editing}
        leftSection={<Pencil size={14} aria-hidden />}
        onClick={() => {
          onEditing(!editing);
        }}
      >
        {editing ? 'Done editing' : 'Edit counts'}
      </Button>
      {edited && (
        <Button
          size="compact-sm"
          variant="default"
          leftSection={<Undo2 size={14} aria-hidden />}
          onClick={onUndo}
        >
          Undo
        </Button>
      )}
      <Text span role="status" size="xs" c="dimmed">
        {flash}
      </Text>
    </Group>
  );
}
