/**
 * The marches kept inside the profile (S-43), at the foot of the section and fetched only when the
 * fold is opened: a list you go and get, never something between the player and their counts.
 *
 * Saving, renaming, deleting and the side-by-side comparison ship as one chunk, because a player
 * who saves a march is the one who later compares two.
 */
import { ActionIcon, Button, Checkbox, Group, Paper, Stack, Table, Text, TextInput } from '@mantine/core';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';

import type { Profile, SavedStack } from '@/state/schema';
import { useStore } from '@/state/store';
import { Dialog } from '@/ui/kit';

import { amount, compactRatio, compactTwo, duration } from './format';
import { unitLabel } from './units';

const DATE = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' });

/** How many saved marches fit side by side before the table stops being readable on a phone. */
const MAX_COMPARED = 3;

// ---- Name dialog -------------------------------------------------------------------------------
export interface MarchNameDialogProps {
  opened: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  initialName: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

/** Save and Rename share one dialog: a single name, Enter to confirm. */
export function MarchNameDialog({
  opened,
  title,
  description,
  confirmLabel,
  initialName,
  onConfirm,
  onCancel,
}: MarchNameDialogProps) {
  const [name, setName] = useState(initialName);
  const [seed, setSeed] = useState(initialName);
  if (seed !== initialName) {
    setSeed(initialName);
    setName(initialName);
  }
  const trimmed = name.trim();
  const confirm = (): void => {
    if (trimmed !== '') onConfirm(trimmed);
  };

  return (
    <Dialog
      opened={opened}
      onClose={onCancel}
      title={title}
      size="sm"
      {...(description === undefined ? {} : { description })}
      footer={
        <Group gap="xs" justify="flex-end">
          <Button variant="default" onClick={onCancel}>
            Cancel
          </Button>
          <Button disabled={trimmed === ''} onClick={confirm}>
            {confirmLabel}
          </Button>
        </Group>
      }
    >
      <TextInput
        label="March name"
        value={name}
        autoComplete="off"
        onChange={(event) => {
          setName(event.currentTarget.value);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') confirm();
        }}
      />
    </Dialog>
  );
}

// ---- Comparison --------------------------------------------------------------------------------
interface Row {
  label: string;
  values: number[];
  format: (value: number) => string;
  /** Which end of the row is the good one; `none` for plain counts. */
  best: 'high' | 'low' | 'none';
}

function bestIndexes(row: Row): Set<number> {
  if (row.best === 'none' || row.values.length < 2) return new Set();
  if (new Set(row.values).size === 1) return new Set();
  const target = row.best === 'high' ? Math.max(...row.values) : Math.min(...row.values);
  const winners = new Set<number>();
  row.values.forEach((value, index) => {
    if (value === target) winners.add(index);
  });
  return winners;
}

/**
 * **How the comparison writes a figure** (S-148): the owner's short notation at the full budget of two
 * decimals, exactly as the recap's figures write theirs (`MarchRecap`'s `figure`) — the two screens compare
 * the same marches by the same figures, so they print them in one shape (design rule 5). Two decimals and not
 * the tight line's one: these cells stand alone in a table at 14 px, the room `format.ts`'s parameter calls
 * "where text can be large".
 *
 * **What stays exact here**, and it is the same cut the unit sheet takes: the "Stacks" row and every "Unit
 * counts" row are the counts a player **retypes into the game**, which is the whole reason the saved march is
 * kept — a "1.2K" there would be a figure nobody can type back in. `duration` is a queue, read in days and
 * hours.
 *
 * **The three rate rows take `compactRatio`, like the recap's two** (`MarchRecap`): below 100 it *is*
 * `ratio` to the last digit, so the ordinary case is the string the column always printed, and above it the
 * rate takes the shape the plan's trade, the damage split and the recap all print the same reading in
 * (design rule 5, one figure one shape). Leaving it on `ratio` while the recap's own rate moved would have
 * been two shapes for one reading on two screens a player reads side by side.
 */
const figure = (value: number): string => compactTwo(value, 2);

function compareRows(stacks: SavedStack[]): { metrics: Row[]; counts: Row[] } {
  const pick = (
    label: string,
    read: (stack: SavedStack) => number,
    format: (value: number) => string,
    best: Row['best'],
  ): Row => ({ label, values: stacks.map(read), format, best });

  const metrics: Row[] = [
    pick('Stacks', (stack) => stack.counts.length, amount, 'none'),
    pick('Expected damage', (stack) => stack.summary.avgDamage, figure, 'high'),
    pick('Damage', (stack) => stack.summary.minDamage, figure, 'high'),
    pick('Best opening', (stack) => stack.summary.maxDamage, figure, 'high'),
    pick('Damage per silver', (stack) => stack.summary.damagePerSilver, compactRatio, 'high'),
    pick('Damage per gold', (stack) => stack.summary.damagePerGold, compactRatio, 'high'),
    pick('Damage per dragon coin', (stack) => stack.summary.damagePerDragonCoin, compactRatio, 'high'),
    pick('Silver to recover', (stack) => stack.summary.recovery.silver, figure, 'low'),
    pick('Gold to recover', (stack) => stack.summary.recovery.gold, figure, 'low'),
    pick('Dragon coins to recover', (stack) => stack.summary.recovery.dragonCoins, figure, 'low'),
    pick('Time to recover', (stack) => stack.summary.recovery.seconds, duration, 'low'),
  ];

  const unitIds: string[] = [];
  for (const stack of stacks) {
    for (const entry of stack.counts) if (!unitIds.includes(entry.unitId)) unitIds.push(entry.unitId);
  }
  const counts: Row[] = unitIds.map((unitId) => ({
    label: unitLabel(unitId),
    values: stacks.map((stack) => stack.counts.find((entry) => entry.unitId === unitId)?.count ?? 0),
    format: amount,
    best: 'none',
  }));

  return { metrics, counts };
}

function CompareTable({ stacks }: { stacks: SavedStack[] }) {
  const { metrics, counts } = compareRows(stacks);
  const renderRows = (rows: Row[]): ReactNode =>
    rows.map((row) => {
      const winners = bestIndexes(row);
      return (
        <Table.Tr key={row.label}>
          <Table.Th scope="row">{row.label}</Table.Th>
          {row.values.map((value, index) => (
            <Table.Td key={`${row.label}-${String(index)}`} ta="right">
              <Text span size="sm" fw={winners.has(index) ? 600 : 400}>
                {row.format(value)}
              </Text>
              {winners.has(index) && <Text span size="xs" c="dimmed">{` best`}</Text>}
            </Table.Td>
          ))}
        </Table.Tr>
      );
    });

  return (
    <Table.ScrollContainer minWidth={380} type="native">
      <Table verticalSpacing={4} horizontalSpacing="xs" withRowBorders>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Figure</Table.Th>
            {stacks.map((stack) => (
              <Table.Th key={stack.id} ta="right">
                {stack.name}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {renderRows(metrics)}
          <Table.Tr>
            <Table.Th scope="row" colSpan={stacks.length + 1}>
              Unit counts
            </Table.Th>
          </Table.Tr>
          {renderRows(counts)}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}

// ---- The panel ---------------------------------------------------------------------------------
export interface SavedMarchesPanelProps {
  profile: Profile;
}

export function SavedMarchesPanel({ profile }: SavedMarchesPanelProps) {
  const renameSavedStack = useStore((state) => state.renameSavedStack);
  const removeSavedStack = useStore((state) => state.removeSavedStack);
  const [selected, setSelected] = useState<string[]>([]);
  const [renaming, setRenaming] = useState<SavedStack | null>(null);
  const [deleting, setDeleting] = useState<SavedStack | null>(null);
  const [comparing, setComparing] = useState(false);

  const stacks = profile.savedStacks;
  const chosen = stacks.filter((stack) => selected.includes(stack.id));

  const toggle = (id: string): void => {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((entry) => entry !== id)
        : current.length >= MAX_COMPARED
          ? current
          : [...current, id],
    );
  };

  return (
    <Paper p="sm" radius="sm" bg="var(--pyr-sunken)">
      <Stack gap="xs">
        {stacks.length === 0 ? (
          <Text size="sm" c="dimmed">
            Nothing saved yet. Generate a march and use “Save this march” to keep it for later.
          </Text>
        ) : (
          <Stack component="ul" gap="xs" aria-label="Saved marches">
            {stacks.map((stack) => (
              <Group component="li" key={stack.id} gap="xs" wrap="nowrap">
                <Stack gap={0} flex={1} miw={0}>
                  <Checkbox
                    size="xs"
                    label={stack.name}
                    checked={selected.includes(stack.id)}
                    disabled={!selected.includes(stack.id) && selected.length >= MAX_COMPARED}
                    onChange={() => {
                      toggle(stack.id);
                    }}
                  />
                  {/* **The saved march's own damage, in the notation** (S-148, and the same figure the
                      compare table's "Expected damage" row prints): the row is the one line a player reads
                      to tell one saved march from another, and eight digits of it are the least of what
                      tells them apart. This is a 12 px dimmed line, so the budget is the tight one, one
                      decimal (`compactTwo`), where the table's cells stand alone at 14 px and take two.
                      The march's name above it and its stack count after it are not figures the notation
                      touches: one is a name and the other is a count. */}
                  <Text span size="xs" c="dimmed" truncate>
                    {`${DATE.format(stack.createdAt)}, ${compactTwo(stack.summary.avgDamage, 1)} expected damage, ${String(stack.counts.length)} stacks`}
                  </Text>
                </Stack>
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="md"
                  aria-label={`Rename ${stack.name}`}
                  onClick={() => {
                    setRenaming(stack);
                  }}
                >
                  <Pencil size={14} aria-hidden />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="md"
                  aria-label={`Delete ${stack.name}`}
                  onClick={() => {
                    setDeleting(stack);
                  }}
                >
                  <Trash2 size={14} aria-hidden />
                </ActionIcon>
              </Group>
            ))}
          </Stack>
        )}

        <Group gap="xs" justify="flex-end">
          <Button
            size="compact-sm"
            variant="default"
            disabled={chosen.length < 2}
            onClick={() => {
              setComparing(true);
            }}
          >
            {`Compare (${String(chosen.length)})`}
          </Button>
        </Group>

        <MarchNameDialog
          opened={renaming !== null}
          title="Rename saved march"
          confirmLabel="Save"
          initialName={renaming?.name ?? ''}
          onConfirm={(name) => {
            if (renaming) renameSavedStack(renaming.id, name);
            setRenaming(null);
          }}
          onCancel={() => {
            setRenaming(null);
          }}
        />

        <Dialog
          role="alertdialog"
          opened={deleting !== null}
          onClose={() => {
            setDeleting(null);
          }}
          title="Delete saved march"
          description={`“${deleting?.name ?? ''}” will be removed from this profile. The result is not stored anywhere else, so this cannot be undone.`}
          size="sm"
          footer={
            <Group gap="xs" justify="flex-end">
              <Button
                variant="default"
                onClick={() => {
                  setDeleting(null);
                }}
              >
                Cancel
              </Button>
              <Button
                color="red"
                onClick={() => {
                  if (deleting) {
                    const { id } = deleting;
                    removeSavedStack(id);
                    setSelected((current) => current.filter((entry) => entry !== id));
                  }
                  setDeleting(null);
                }}
              >
                Delete march
              </Button>
            </Group>
          }
        />

        <Dialog
          opened={comparing}
          onClose={() => {
            setComparing(false);
          }}
          title="Compare saved marches"
          description="The best figure in each row is marked."
          size="lg"
        >
          {chosen.length >= 2 ? (
            <CompareTable stacks={chosen} />
          ) : (
            <Text size="sm">Pick at least two saved marches.</Text>
          )}
        </Dialog>
      </Stack>
    </Paper>
  );
}
