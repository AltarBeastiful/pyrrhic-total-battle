/**
 * The families the card used to draw as switch rows — equipment, the odds and ends, the events that
 * are running, the temple — as **chips**, the captains' own anatomy (owner, 2026-09-17: "apply the
 * same design as heroes for all"; the canvas "Bonuses card redesign").
 *
 * A row was a switch, a value column on the far side of the card and a gear beyond that: forty
 * pixels a source, and the thing that configures a source nowhere near the thing that switches it
 * on. A chip is the name with what it is worth under it, on when it is tinted and ringed, the gear on
 * its own corner and the dot once something is recorded — so a whole family reads at a glance and
 * every control of a source is under one thumb. A source that counts on every march has no state to
 * switch: its body and its gear both open the editor, and it is on while something is recorded in
 * it and reads as off while nothing is (owner, 2026-09-17), the way the permanent chips do.
 *
 * Progressive disclosure (D-35): a family with nothing configured in it is its Add button and
 * nothing else, so a returning player reads the card without walking past empty headings.
 */
import { Button, Group, Stack } from '@mantine/core';
import { Plus } from 'lucide-react';

import { setActiveFlag, toggleActiveSource } from '@/state/actions/bonuses';
import { useRovingTabs } from '@/ui/kit';

import classes from './bonuses.module.css';
import type { EditorTarget, SourceGroup, SourceRow, ToggleTarget } from './rows';
import { SourceChip } from './SourceChip';

function apply(target: ToggleTarget, on: boolean): void {
  if ('flag' in target) setActiveFlag(target.flag, on);
  else toggleActiveSource(target.list, target.id, on);
}

/** The chip's accessible name says the state, because the ground colour cannot (rule 24). */
function toggleLabel(row: SourceRow): string {
  if (row.locked === true) return row.value === '' ? `Set ${row.name}` : `${row.name}, on every march`;
  return row.on ? `${row.name}, on for this march` : `Switch on ${row.name}`;
}

function Chip({ row, onEdit }: { row: SourceRow; onEdit: (target: EditorTarget) => void }) {
  const editor = row.editor;
  // A source switched on with nothing typed into it says so under its name, and nowhere else (owner,
  // 2026-09-13 — the card's "N on but empty" badge was retired): an em dash is how a table says "no
  // value", and the gear beside it is where the value is typed.
  const value = row.value === '' && editor !== undefined ? '—' : row.value;
  return (
    <SourceChip
      name={row.name}
      value={value}
      details={row.lines ?? []}
      checked={row.locked === true ? row.value !== '' : row.on}
      dotted={editor !== undefined && row.value !== ''}
      disabled={row.isDisabled ?? false}
      toggleLabel={toggleLabel(row)}
      onToggle={() => {
        if (row.locked === true && editor !== undefined) onEdit(editor);
        else if (row.toggle !== undefined) apply(row.toggle, !row.on);
      }}
      {...(editor === undefined
        ? {}
        : {
            gearLabel: `Edit ${row.name}`,
            onGear: () => {
              onEdit(editor);
            },
          })}
    />
  );
}

export interface SourceChipsProps {
  group: SourceGroup;
  onEdit: (target: EditorTarget) => void;
  onAdd: (group: SourceGroup) => void;
}

export function SourceChips({ group, onEdit, onAdd }: SourceChipsProps) {
  const roving = useRovingTabs();

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

  if (group.rows.length === 0) return addButton;

  return (
    <Stack gap="xs">
      <Group
        role="group"
        aria-label={group.title}
        className={classes.gearGrid}
        gap={8}
        wrap="wrap"
        {...roving}
      >
        {group.rows.map((row) => (
          <Chip key={row.id} row={row} onEdit={onEdit} />
        ))}
      </Group>
      {addButton}
    </Stack>
  );
}
