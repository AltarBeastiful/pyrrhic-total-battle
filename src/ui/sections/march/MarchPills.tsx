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

import { putBackAllInMarch, putBackInMarch, removeFromFormation } from './formation';
import { amount } from './format';
import classes from './march.module.css';
import { countsText, resizeWords } from './rows';
import type { LeftOutUnit, MarchStackRow, PoolRow } from './rows';
import { useRunStore } from './runStore';

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
export function MarchPills({ rows, editing, onCount, onDetails }: MarchPillsProps) {
  return (
    <Stack gap="lg">
      {rows.map((row) => {
        const over = row.used > row.capacity;
        return (
          <Stack key={row.pool} gap="xs">
            {/* The pool line, to the spacing contract (`MarchPaneSpacing.dc.html`, `.pool`): the
                figure **22/700** in the pool's colour, the glyph in a 20 px box, and "of 20 000
                leadership" at 12 px muted — the pool's *name*, which the line never said, so three
                figures over three grids of pills were told apart by an emoji alone. */}
            <Group gap={8} wrap="nowrap" align="center">
              <Text
                span
                fz="1.375rem"
                lh={1}
                fw={700}
                className={classes.poolFigure}
                c={over ? 'var(--mantine-color-danger-filled)' : poolInk(row.pool)}
              >
                {amount(row.used)}
              </Text>
              <Text span fz="1.25rem" lh={1}>
                <Glyph kind={row.pool} label={POOL_LABEL[row.pool]} />
              </Text>
              <Text span className={classes.meta} c="dimmed">
                {`of ${amount(row.capacity)} ${POOL_LABEL[row.pool].toLowerCase()}`}
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
    </Stack>
  );
}

/**
 * The types this march does not field — **its own part of the pane**, under a hairline (the spacing
 * contract's third section, `MarchPaneSpacing.dc.html`). It used to hang off the bottom of the pools
 * inside the same block, which is why the owner read the pane as one undivided run: a footnote and
 * the army it is a footnote to had the same separation as two pools.
 */
export interface MarchLeftOutProps {
  /** Types this march does not field, with the reason; a press on one puts it back. */
  leftOut: LeftOutUnit[];
}

export function MarchLeftOut({ leftOut }: MarchLeftOutProps) {
  if (leftOut.length === 0) return null;
  return (
    <Stack gap={8}>
      <Text span className={classes.meta} c="dimmed">
        Left out — tap to put back
      </Text>
      {/* One row, two kinds: the pill carries `data-left-out="you" | "search"` and says which in
          its name, because a player wants to know whether they took a type out or the solver did.
          The press is the same either way — the type goes back in and the sizer decides its count. */}
      <Group gap={8} wrap="wrap" role="group" aria-label="Left out of this march">
        {leftOut.map((entry) => (
          <LeftOutPill
            key={entry.unit.id}
            unit={entry.unit}
            reason={entry.reason}
            onPutBack={() => {
              putBackInMarch(entry.unit.id);
            }}
          />
        ))}
        <Button
          variant="subtle"
          size="compact-xs"
          onClick={() => {
            putBackAllInMarch(leftOut.map((entry) => entry.unit.id));
          }}
        >
          Put back all
        </Button>
      </Group>
    </Stack>
  );
}

/**
 * **What the last March edit did**, in one line under the pills (S-104; design rule 15, and rule 5 — the
 * pills say what is marching, the left-out row says what is not, and neither of them can say this).
 *
 * The owner, 2026-09-19: *"I'm able to put it back in and the plan then computes safely the best course of
 * action with the new parameters in mind … without putting out another, because then we're manually fixing
 * the reco without clicking Generate."* The plan bar keeps showing the plan's own stops — the bar's rows are
 * the plan's, the tweaked march is the pane's — so this line is where the pane says the two have parted, and
 * on what terms. It draws nothing until an edit has been computed (`RunState.resize`).
 */
export function MarchResized({ units }: { units: readonly UnitDef[] }) {
  const resize = useRunStore((state) => state.resize);
  if (resize === null) return null;
  return (
    <Text span role="status" className={classes.meta} c="dimmed">
      {resizeWords(resize, units)}
    </Text>
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
