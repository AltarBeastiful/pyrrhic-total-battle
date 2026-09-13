/**
 * The editor behind a **row's** gear (design plan §7.3): a sheet — from the bottom on a phone, from
 * the right once there is room — whose description line is where the figures are read in game, and
 * whose first block repeats the TOTAL, so the player sees the three figures move as they type.
 *
 * Chips edit in an anchored popover instead (D-34); a sheet is for the editors that are a form —
 * a piece of equipment, a permanent source, the temple.
 */
import { Button, Group, Paper, Stack, Text } from '@mantine/core';
import type { ReactNode } from 'react';

import { Sheet } from '@/ui/kit';

import type { TotalsSummary } from './rows';
import { TotalsFigures } from './TotalsFigures';

export interface SourceSheetProps {
  /** The source's own name; it is the sheet's accessible name too. */
  title: string;
  /** Where to find it in game, in our words. */
  where: string;
  summary: TotalsSummary;
  onClose: () => void;
  /** Given when the entry can be deleted; shown as the destructive button beside Done. */
  onRemove?: () => void;
  removeLabel?: string;
  size?: 'md' | 'lg';
  children: ReactNode;
}

export function SourceSheet({
  title,
  where,
  summary,
  onClose,
  onRemove,
  removeLabel = 'Remove',
  size = 'md',
  children,
}: SourceSheetProps) {
  return (
    <Sheet
      opened
      size={size}
      title={title}
      description={where}
      onClose={onClose}
      footer={
        <Group justify="flex-end" gap="sm">
          {onRemove !== undefined && (
            <Button variant="subtle" color="danger" onClick={onRemove}>
              {removeLabel}
            </Button>
          )}
          <Button onClick={onClose}>Done</Button>
        </Group>
      }
    >
      <Stack gap="md">
        <Paper bg="var(--pyr-sunken)" p="sm">
          <TotalsFigures summary={summary} size="sm" />
        </Paper>
        {children}
      </Stack>
    </Sheet>
  );
}

/** A labelled block of fields inside an editor. */
export function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Stack gap="xs" component="section" aria-label={label}>
      <Text size="sm" fw={500}>
        {label}
      </Text>
      {children}
    </Stack>
  );
}

/** What a source is worth right now, one line per key, as the editors list it. */
export function WorthList({ lines, empty }: { lines: string[]; empty: string }) {
  if (lines.length === 0)
    return (
      <Text size="sm" c="dimmed">
        {empty}
      </Text>
    );
  return (
    <Stack gap={2}>
      {lines.map((line) => (
        <Text key={line} size="sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {line}
        </Text>
      ))}
    </Stack>
  );
}
