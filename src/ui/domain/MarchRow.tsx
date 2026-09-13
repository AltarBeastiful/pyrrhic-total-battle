/**
 * The march table (design plan §7.5): one row per stack, in the order the stacks fall. The row's
 * left edge carries the group's colour, and the count — the one number a player retypes into the
 * game — is the biggest thing on the line *and* a button that copies it.
 *
 * `MarchTable` is the wrapper: `Table` inside `Table.ScrollContainer`, so a six-column table never
 * forces the page sideways on a phone.
 */
import { Stack, Table, Text, UnstyledButton } from '@mantine/core';
import { useCallback, useEffect, useState, type ReactNode } from 'react';

import type { UnitDef } from '../../data/types';
import { UnitTile } from './UnitTile';
import { count as formatCount } from './format';
import { groupInk, unitGroupOf } from './unitGroup';

/** How long "Copied" stays on the line. */
const COPIED_MS = 1500;

/** "falls 3rd" — the place in the kill order, said the way a player says it. */
function ordinal(position: number): string {
  const rest = position % 100;
  if (rest >= 11 && rest <= 13) return `${position}th`;
  const last = position % 10;
  if (last === 1) return `${position}st`;
  if (last === 2) return `${position}nd`;
  if (last === 3) return `${position}rd`;
  return `${position}th`;
}

export interface MarchTableProps {
  /** Read to a screen reader in place of a visible title. */
  caption?: string;
  children: ReactNode;
}

export function MarchTable({ caption, children }: MarchTableProps) {
  return (
    <Table.ScrollContainer minWidth={480} type="native" w="100%" maw="100%">
      <Table verticalSpacing="xs" horizontalSpacing="xs" withRowBorders>
        {caption !== undefined && <Table.Caption>{caption}</Table.Caption>}
        <Table.Thead>
          <Table.Tr>
            <Table.Th />
            <Table.Th>Unit</Table.Th>
            <Table.Th ta="right">Count</Table.Th>
            <Table.Th ta="right">Hits</Table.Th>
            <Table.Th ta="right">Lost</Table.Th>
            <Table.Th ta="right">Revive</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{children}</Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

export interface MarchRowProps {
  unit: UnitDef;
  count: number;
  hits?: number;
  lost?: number;
  reviveSilver?: number;
  /** Place in the kill order, 1-based; shown as "falls 3rd". */
  position?: number;
  /** The method put this stack last on purpose. */
  fallsLast?: boolean;
  /** Called after the count has reached the clipboard. */
  onCopy?: (count: number) => void;
}

export function MarchRow({
  unit,
  count,
  hits,
  lost,
  reviveSilver,
  position,
  fallsLast = false,
  onCopy,
}: MarchRowProps) {
  const group = unitGroupOf(unit);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = globalThis.setTimeout(() => {
      setCopied(false);
    }, COPIED_MS);
    return () => {
      globalThis.clearTimeout(timer);
    };
  }, [copied]);

  const copy = useCallback(() => {
    // Absent on an insecure origin and in a test environment; copying is a convenience, never a
    // requirement, so its absence must not break the row.
    const clipboard = typeof navigator === 'undefined' ? undefined : navigator.clipboard;
    if (clipboard?.writeText) void clipboard.writeText(String(count)).catch(() => {});
    setCopied(true);
    onCopy?.(count);
  }, [count, onCopy]);

  const order =
    position === undefined
      ? fallsLast
        ? 'falls last'
        : undefined
      : fallsLast
        ? `falls ${ordinal(position)}, and last of the troops`
        : `falls ${ordinal(position)}`;

  return (
    <Table.Tr style={{ borderLeft: `4px solid ${groupInk(group)}` }}>
      <Table.Td>
        <UnitTile unit={unit} size="sm" />
      </Table.Td>
      <Table.Td>
        <Stack gap={0} miw={0}>
          <Text span size="sm" fw={500} truncate>
            {unit.name}
          </Text>
          {order !== undefined && (
            <Text span size="xs" c="dimmed" truncate>
              {order}
            </Text>
          )}
        </Stack>
      </Table.Td>
      <Table.Td ta="right">
        <Stack gap={0} align="flex-end">
          <UnstyledButton
            aria-label={`Copy ${formatCount(count)}, ${unit.name}`}
            onClick={copy}
            style={{ fontSize: 'var(--mantine-font-size-xl)', fontWeight: 600, lineHeight: 1.1 }}
          >
            {formatCount(count)}
          </UnstyledButton>
          <Text span role="status" size="xs" c="dimmed" mih="1.125rem">
            {copied ? 'Copied' : ''}
          </Text>
        </Stack>
      </Table.Td>
      <Table.Td ta="right">{hits === undefined ? '—' : formatCount(hits)}</Table.Td>
      <Table.Td ta="right">{lost === undefined ? '—' : formatCount(lost)}</Table.Td>
      <Table.Td ta="right">
        <Text span size="sm" c="dimmed">
          {reviveSilver === undefined ? '—' : formatCount(reviveSilver)}
        </Text>
      </Table.Td>
    </Table.Tr>
  );
}
