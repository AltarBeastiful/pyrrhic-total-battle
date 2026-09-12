/**
 * The counts to copy (design plan §7.5 step 3). The count is the one number a player retypes into
 * the game, so it is the biggest thing on the line and a tap on it puts it on the clipboard.
 *
 * One card, two shapes, chosen by a **container query** rather than by the viewport: the card is the
 * table from 36 rem of its own width, and a stack of rows below that — so the 360 dp supporting pane
 * gets the stacked shape on a 1600 px screen, which no media query could say.
 *
 * Editing is a mode, not a state every row is always in: outside it a tap on a count only copies,
 * inside it every count is a stepper bound to the manual-edit model and the recap above recomputes
 * on every press.
 */
import { useEffect, useState } from 'react';

import type { UnitDef } from '@/engine/types';
import { MarchRow, MarchTable, UnitTile } from '@/ui/domain';
import { Button, IconButton, NumberStepper } from '@/ui/kit';
import { Cluster, Stack } from '@/ui/layout';
import { copyText } from '@/ui/profile/download';

import { CopyIcon, InfoIcon, PencilIcon, UndoIcon } from '../../icons';
import { amount } from './format';
import { countsText } from './rows';
import type { MarchStackRow } from './rows';

/** How long "Copied" stays on screen. */
const COPIED_MS = 1500;

/** The biggest count a hand edit may reach; past it the game would refuse the march anyway. */
const MAX_COUNT = 10_000_000;

/**
 * A stepper inside a row has no room for a label above it, and the row already says which unit it
 * belongs to; the name is kept for a screen reader, the way the Troops card keeps its tier labels.
 */
const QUIET_LABEL = '[&>span]:sr-only';

/** A message that clears itself, for the two clipboard buttons. */
function useFlash(): [string, (message: string) => void] {
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (message === '') return;
    const timer = window.setTimeout(() => {
      setMessage('');
    }, COPIED_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [message]);
  return [message, setMessage];
}

/** "falls 3rd" — where the stack stands in the kill order. */
function ordinal(position: number): string {
  const rest = position % 100;
  if (rest >= 11 && rest <= 13) return `${String(position)}th`;
  const last = position % 10;
  if (last === 1) return `${String(position)}st`;
  if (last === 2) return `${String(position)}nd`;
  if (last === 3) return `${String(position)}rd`;
  return `${String(position)}th`;
}

interface RowControlsProps {
  row: MarchStackRow;
  editing: boolean;
  onCount: (unitId: string, count: number) => void;
  onDetails: (unit: UnitDef) => void;
}

/** What sits beside a row in both shapes: the stepper while editing, and the way into the sheet. */
function RowControls({ row, editing, onCount, onDetails }: RowControlsProps) {
  return (
    <Cluster gap={1} wrap={false}>
      {editing && (
        <NumberStepper
          size="sm"
          label={`${row.unit.name} count`}
          value={row.stack.count}
          min={0}
          max={MAX_COUNT}
          onChange={(value) => {
            onCount(row.unit.id, value ?? 0);
          }}
          className={QUIET_LABEL}
        />
      )}
      <IconButton
        size="sm"
        label={`Details: ${row.unit.name}`}
        onPress={() => {
          onDetails(row.unit);
        }}
      >
        <InfoIcon />
      </IconButton>
    </Cluster>
  );
}

interface StackedRowProps extends RowControlsProps {
  onCopied: (message: string) => void;
}

/**
 * The narrow shape: the tile, the name and the count on one line, everything the battle did to the
 * stack under it. The count keeps the table's own accessible name, so a test or a screen reader
 * hears the same thing at both widths.
 */
function StackedRow({ row, editing, onCount, onDetails, onCopied }: StackedRowProps) {
  const { unit, stack } = row;
  const facts = [
    row.position === undefined ? null : `falls ${ordinal(row.position)}`,
    row.fallsLast ? 'falls last' : null,
    `${amount(row.hits)} ${row.hits === 1 ? 'hit' : 'hits'}`,
    `${amount(row.lost)} lost`,
    `${amount(row.reviveGold)} gold to revive`,
  ].filter((fact): fact is string => fact !== null);

  return (
    <Stack as="li" gap={1}>
      <Cluster gap={2} wrap={false}>
        <UnitTile unit={unit} size="sm" />
        <span className="min-w-0 flex-1 truncate">{unit.name}</span>
        <button
          type="button"
          aria-label={`Copy ${amount(stack.count)}, ${unit.name}`}
          onClick={() => {
            void copyText(String(stack.count));
            onCopied('Copied');
          }}
          className="text-stat font-display nums"
        >
          {amount(stack.count)}
        </button>
      </Cluster>
      <Cluster gap={2} justify="between">
        <span className="text-muted text-sm">{facts.join(' · ')}</span>
        <RowControls row={row} editing={editing} onCount={onCount} onDetails={onDetails} />
      </Cluster>
    </Stack>
  );
}

export interface MarchCountsProps {
  rows: MarchStackRow[];
  editing: boolean;
  onEditing: (editing: boolean) => void;
  /** Some count was changed by hand, so there is something to undo. */
  edited: boolean;
  onCount: (unitId: string, count: number) => void;
  onUndo: () => void;
  onDetails: (unit: UnitDef) => void;
}

export function MarchCounts({
  rows,
  editing,
  onEditing,
  edited,
  onCount,
  onUndo,
  onDetails,
}: MarchCountsProps) {
  const [flash, setFlash] = useFlash();

  return (
    <Stack gap={2}>
      <Cluster gap={2} justify="between">
        <h3 className="font-display text-lg">Counts to copy</h3>
        <Cluster gap={1}>
          <Button
            size="sm"
            icon={<CopyIcon />}
            onPress={() => {
              void copyText(countsText(rows));
              setFlash('Copied');
            }}
          >
            Copy all counts
          </Button>
          <Button
            size="sm"
            icon={<PencilIcon />}
            onPress={() => {
              onEditing(!editing);
            }}
          >
            {editing ? 'Done editing' : 'Edit counts'}
          </Button>
          {edited && (
            <Button size="sm" icon={<UndoIcon />} onPress={onUndo}>
              Undo
            </Button>
          )}
        </Cluster>
      </Cluster>

      <span role="status" className="text-muted text-sm">
        {flash}
      </span>

      {/* Wide enough for the table: the same rows, in columns. */}
      <div className="hidden @xl:block">
        <MarchTable caption="The march, in the order the stacks fall">
          {rows.map((row) => (
            <MarchRow
              key={row.unit.id}
              unit={row.unit}
              count={row.stack.count}
              hits={row.hits}
              lost={row.lost}
              reviveSilver={row.reviveGold}
              fallsLast={row.fallsLast}
              {...(row.position === undefined ? {} : { position: row.position })}
            >
              <RowControls row={row} editing={editing} onCount={onCount} onDetails={onDetails} />
            </MarchRow>
          ))}
        </MarchTable>
      </div>

      {/* Narrower than 36 rem — a phone, or the supporting pane at any width. */}
      <Stack as="ul" gap={3} className="@xl:hidden" aria-label="The march, in the order the stacks fall">
        {rows.map((row) => (
          <StackedRow
            key={row.unit.id}
            row={row}
            editing={editing}
            onCount={onCount}
            onDetails={onDetails}
            onCopied={setFlash}
          />
        ))}
      </Stack>
    </Stack>
  );
}
