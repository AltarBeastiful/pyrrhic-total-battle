/**
 * The permanent sources, as TotalStack draws them (investigation 0006): the same chips as the
 * captains, always highlighted and pinned, with a gear on each. They count on every march — there is no switch
 * to flip — so the chip and the gear are two names for the same target: open what this source is
 * worth and type it in.
 *
 * The editor is a sheet rather than a popover: a permanent source is the free-form thirteen-key
 * form, which is a page, not a corner.
 */
import { Button, Group, Stack } from '@mantine/core';
import { Plus } from 'lucide-react';

import { useRovingTabs } from '@/ui/kit';

import classes from './bonuses.module.css';
import type { PermanentChipRow } from './chips';
import { SourceChip } from './SourceChip';

export interface PermanentChipsProps {
  chips: PermanentChipRow[];
  onEdit: (entryId: string) => void;
  onAdd: () => void;
}

export function PermanentChips({ chips, onEdit, onAdd }: PermanentChipsProps) {
  const roving = useRovingTabs();

  return (
    <Stack gap="xs">
      <Group
        role="group"
        aria-label="Permanent sources"
        className={classes.gearGrid}
        gap={8}
        wrap="wrap"
        {...roving}
      >
        {chips.map((chip) => (
          <SourceChip
            key={chip.id}
            name={chip.name}
            value={chip.value}
            dotted={chip.value !== ''}
            pinned
            checked
            toggleLabel={`${chip.name}, on every march`}
            gearLabel={`Edit ${chip.name}`}
            onToggle={() => {
              onEdit(chip.id);
            }}
            onGear={() => {
              onEdit(chip.id);
            }}
          />
        ))}
      </Group>
      <Button
        variant="subtle"
        size="compact-sm"
        leftSection={<Plus size={14} aria-hidden />}
        w="fit-content"
        onClick={onAdd}
      >
        Add permanent source
      </Button>
    </Stack>
  );
}
