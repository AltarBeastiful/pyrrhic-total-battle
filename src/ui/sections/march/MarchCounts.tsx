/**
 * The counts to copy (design plan §7.5 step 3). The count is the one number a player retypes into
 * the game, so it is the biggest thing on the line and a tap on it puts it on the clipboard.
 *
 * One block, two shapes, chosen by a **container query** rather than by the viewport: the table from
 * 36 rem of the block's own width, a stack of rows below that — so the 360 dp March pane gets the
 * stacked shape on a 1600 px screen, which no media query could say.
 *
 * Editing is a mode, not a state every row is always in: outside it a tap on a count only copies,
 * inside it every count is a `NumberField` bound to the manual-edit model and the recap above
 * recomputes on every keystroke. The mode is a segmented control because it is a choice between two
 * ways of reading the same list, not a command.
 */
import {
  ActionIcon,
  Box,
  Button,
  Group,
  SegmentedControl,
  Stack,
  Table,
  Text,
  UnstyledButton,
} from '@mantine/core';
import { Copy, Info, Undo2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import type { UnitDef } from '@/engine/types';
import { MarchRow, MarchTable, UnitTile } from '@/ui/domain';
import { NumberField } from '@/ui/kit';
import { copyText } from '@/ui/profile/download';

import { amount } from './format';
import classes from './march.module.css';
import { countsText } from './rows';
import type { MarchStackRow } from './rows';

/** How long "Copied" stays on screen. */
const COPIED_MS = 1500;

/** The biggest count a hand edit may reach; past it the game would refuse the march anyway. */
const MAX_COUNT = 10_000_000;

/** The caption both shapes carry, so a test and a screen reader hear one list at any width. */
const CAPTION = 'The march, in the order the stacks fall';

/** A message that clears itself, for the two clipboard buttons. */
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

/** What the battle did to one stack, as separate readings rather than one dotted string (D-19). */
function facts(row: MarchStackRow): string[] {
  return [
    row.position === undefined
      ? 'not marching'
      : row.fallsLast
        ? `falls ${ordinal(row.position)}, and last of the troops`
        : `falls ${ordinal(row.position)}`,
    `${amount(row.hits)} ${row.hits === 1 ? 'hit' : 'hits'}`,
    `${amount(row.lost)} lost`,
    `${amount(row.reviveGold)} gold to revive`,
  ];
}

interface CountFieldProps {
  row: MarchStackRow;
  onCount: (unitId: string, count: number) => void;
}

/**
 * The count as a field. The row already says which unit it belongs to, so the field's own label is
 * hidden — it is still the accessible name, which is what a screen reader and a test ask for.
 */
function CountField({ row, onCount }: CountFieldProps) {
  return (
    <Box className={classes.quietLabel} w={120}>
      <NumberField
        label={`${row.unit.name} count`}
        value={row.stack.count}
        min={0}
        max={MAX_COUNT}
        onChange={(value) => {
          onCount(row.unit.id, value ?? 0);
        }}
      />
    </Box>
  );
}

/** The way into the unit sheet, in both shapes. */
function DetailsButton({ unit, onDetails }: { unit: UnitDef; onDetails: (unit: UnitDef) => void }) {
  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      size="md"
      aria-label={`Details: ${unit.name}`}
      onClick={() => {
        onDetails(unit);
      }}
    >
      <Info size={16} aria-hidden />
    </ActionIcon>
  );
}

interface RowProps {
  row: MarchStackRow;
  onCount: (unitId: string, count: number) => void;
  onDetails: (unit: UnitDef) => void;
}

/** The wide shape while the counts are being edited: the same six columns, the count as a field. */
function EditTableRow({ row, onCount, onDetails }: RowProps) {
  return (
    <Table.Tr>
      <Table.Td>
        <UnitTile unit={row.unit} size="sm" />
      </Table.Td>
      <Table.Td>
        <Text span size="sm" fw={500}>
          {row.unit.name}
        </Text>
      </Table.Td>
      <Table.Td ta="right">
        <CountField row={row} onCount={onCount} />
      </Table.Td>
      <Table.Td ta="right">{amount(row.hits)}</Table.Td>
      <Table.Td ta="right">{amount(row.lost)}</Table.Td>
      <Table.Td ta="right">
        <DetailsButton unit={row.unit} onDetails={onDetails} />
      </Table.Td>
    </Table.Tr>
  );
}

interface StackedRowProps extends RowProps {
  editing: boolean;
  onCopied: (message: string) => void;
}

/**
 * The narrow shape: the tile, the name and the count on one line, what the battle did to the stack
 * under it. The count keeps the table's own accessible name, so a test or a screen reader hears the
 * same thing at both widths.
 */
function StackedRow({ row, editing, onCount, onDetails, onCopied }: StackedRowProps) {
  const { unit, stack } = row;

  return (
    <Stack component="li" gap={2}>
      <Group gap="xs" wrap="nowrap">
        <UnitTile unit={unit} size="sm" />
        <Text span size="sm" fw={500} truncate flex={1} miw={0}>
          {unit.name}
        </Text>
        {editing ? (
          <CountField row={row} onCount={onCount} />
        ) : (
          <UnstyledButton
            aria-label={`Copy ${amount(stack.count)}, ${unit.name}`}
            onClick={() => {
              void copyText(String(stack.count));
              onCopied('Copied');
            }}
            style={{ fontSize: 'var(--mantine-font-size-xl)', fontWeight: 600, lineHeight: 1.1 }}
          >
            {amount(stack.count)}
          </UnstyledButton>
        )}
        <DetailsButton unit={unit} onDetails={onDetails} />
      </Group>
      <Group gap="sm" wrap="wrap">
        {facts(row).map((fact) => (
          <Text key={fact} span size="xs" c="dimmed">
            {fact}
          </Text>
        ))}
      </Group>
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
    <Stack gap="xs" className={classes.counts}>
      <Group justify="space-between" gap="xs">
        <Text component="h3" size="lg" fw={600}>
          Counts to copy
        </Text>
        <Group gap="xs">
          <Button
            size="compact-sm"
            variant="default"
            leftSection={<Copy size={14} aria-hidden />}
            onClick={() => {
              void copyText(countsText(rows));
              setFlash('Copied');
            }}
          >
            Copy all counts
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
        </Group>
      </Group>

      <Group justify="space-between" gap="xs">
        <SegmentedControl
          size="xs"
          aria-label="What a tap on a count does"
          value={editing ? 'edit' : 'copy'}
          data={[
            { value: 'copy', label: 'Copy counts' },
            { value: 'edit', label: 'Edit counts' },
          ]}
          onChange={(value) => {
            onEditing(value === 'edit');
          }}
        />
        <Text span role="status" size="xs" c="dimmed">
          {flash}
        </Text>
      </Group>

      {/* Wide enough for the table: the same rows, in columns. */}
      <Box className={classes.wide}>
        <MarchTable caption={CAPTION}>
          {rows.map((row) =>
            editing ? (
              <EditTableRow key={row.unit.id} row={row} onCount={onCount} onDetails={onDetails} />
            ) : (
              <MarchRow
                key={row.unit.id}
                unit={row.unit}
                count={row.stack.count}
                hits={row.hits}
                lost={row.lost}
                reviveSilver={row.reviveGold}
                fallsLast={row.fallsLast}
                {...(row.position === undefined ? {} : { position: row.position })}
              />
            ),
          )}
        </MarchTable>
      </Box>

      {/* Narrower than 36 rem — a phone, or the March pane at any width. The column is read top to
          bottom as the order the stacks fall, so it is captioned at both ends. */}
      <Box className={classes.narrow}>
        <Stack gap="xs">
          <Text span size="xs" c="dimmed">
            Falls first
          </Text>
          <Stack component="ul" gap="sm" aria-label={CAPTION}>
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
          <Text span size="xs" c="dimmed">
            Falls last
          </Text>
        </Stack>
      </Box>
    </Stack>
  );
}
