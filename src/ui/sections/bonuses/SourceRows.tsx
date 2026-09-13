/**
 * The groups the game does not show as chips (design plan §7.3): equipment, the odds and ends, the
 * events that are running, the temple.
 *
 * A source is a **row**, not a chip: a switch carrying the source's own name, what it is worth on
 * the right in tabular figures, and a gear at the end opening its editor. A source that counts on
 * every march has no switch at all — it wears the pin that means "on every march" everywhere else
 * in the app. Rows are 40 px, the plan's own figure.
 *
 * Progressive disclosure (D-35): a group with nothing configured in it is one "Add …" line and
 * nothing else, so a returning player reads the card without walking past eight empty headings.
 */
import { ActionIcon, Button, Group, Stack, Switch, Text } from '@mantine/core';
import { Plus, Settings } from 'lucide-react';

import { setActiveFlag, toggleActiveSource } from '@/state/actions/bonuses';
import { Glyph } from '@/ui/domain';

import type { EditorTarget, SourceGroup, SourceRow, ToggleTarget } from './rows';

function apply(target: ToggleTarget, on: boolean): void {
  if ('flag' in target) setActiveFlag(target.flag, on);
  else toggleActiveSource(target.list, target.id, on);
}

function Row({ row, onEdit }: { row: SourceRow; onEdit: (target: EditorTarget) => void }) {
  const value = row.value === '' ? 'nothing yet' : row.value;
  return (
    <Group role="listitem" gap="xs" wrap="nowrap" mih={40}>
      {row.locked === true ? (
        <Group gap={6} wrap="nowrap" flex={1} miw={0}>
          <Glyph kind="pin" label="On every march" />
          <Text size="sm" fw={500} truncate>
            {row.name}
          </Text>
        </Group>
      ) : (
        <Switch
          flex={1}
          miw={0}
          size="sm"
          label={row.name}
          checked={row.on}
          disabled={row.isDisabled ?? false}
          onChange={(event) => {
            if (row.toggle !== undefined) apply(row.toggle, event.currentTarget.checked);
          }}
        />
      )}
      <Text
        size="xs"
        c="dimmed"
        ta="right"
        flex={1}
        miw={0}
        truncate
        title={value}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </Text>
      {row.editor !== undefined && (
        <ActionIcon
          size="md"
          variant="subtle"
          color="gray"
          aria-label={`Edit ${row.name}`}
          onClick={() => {
            if (row.editor !== undefined) onEdit(row.editor);
          }}
        >
          <Settings size={16} aria-hidden />
        </ActionIcon>
      )}
    </Group>
  );
}

export interface SourceRowsProps {
  group: SourceGroup;
  onEdit: (target: EditorTarget) => void;
  onAdd: (group: SourceGroup) => void;
}

export function SourceRows({ group, onEdit, onAdd }: SourceRowsProps) {
  const addButton =
    group.add === undefined ? null : (
      <Button
        variant="subtle"
        size="compact-sm"
        leftSection={<Plus size={14} aria-hidden />}
        disabled={group.add.isDisabled}
        w="fit-content"
        onClick={() => {
          onAdd(group);
        }}
      >
        {group.add.label}
      </Button>
    );

  // D-35: nothing configured, nothing to read — the group is its Add line.
  if (group.rows.length === 0) {
    return (
      <Stack gap="xs">
        {group.empty !== '' && (
          <Text size="sm" c="dimmed">
            {group.empty}
          </Text>
        )}
        {addButton}
      </Stack>
    );
  }

  return (
    <Stack gap={2}>
      {/* A plain `role="list"` rather than a `<ul>`: the list markers would need a CSS reset and
          the roles say the same thing to a screen reader without one. */}
      <Stack role="list" gap={0}>
        {group.rows.map((row) => (
          <Row key={row.id} row={row} onEdit={onEdit} />
        ))}
      </Stack>
      {addButton}
    </Stack>
  );
}
