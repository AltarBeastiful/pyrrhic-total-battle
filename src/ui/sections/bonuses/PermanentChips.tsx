/**
 * The permanent sources, as TotalStack draws them (investigation 0006): the same chips as the
 * captains, with a gear on each. They count on every march — there is no switch to flip — so the
 * chip and the gear are two names for the same target: open what this source is worth and type it
 * in.
 *
 * **On only while something is recorded** (owner, 2026-09-17: "always on takes the eyes a little
 * too much… greyed as unselected when nothing is set in them would be best, as nothing set in
 * always-on means kinda not on"). Eight chips lit in brass for eight sources that mostly said "—"
 * was eight things to look at for nothing; a permanent source with a value is on like any other
 * source that counts, and one without reads as off, which is what it is to the TOTAL. The pin the
 * chips wore went with it.
 *
 * The editor is a sheet rather than a popover: a permanent source is the free-form thirteen-key
 * form, which is a page, not a corner.
 */
import { Button, Group, Stack } from '@mantine/core';
import { Plus } from 'lucide-react';

import { useRovingTabs } from '@/ui/kit';

import type { PermanentCounting } from './bodyScope';
import classes from './bonuses.module.css';
import type { PermanentChipRow } from './chips';
import { SourceChip } from './SourceChip';

export interface PermanentChipsProps {
  chips: PermanentChipRow[];
  onEdit: (entryId: string) => void;
  onAdd: () => void;
  /**
   * A fight that counts only some of them (`BodyScope.counting`): the chip's body switches the source in or out of
   * the fight, the gear still opens its values, and a source the fight does not count is not drawn at all.
   */
  counting?: PermanentCounting;
}

export function PermanentChips({ chips, onEdit, onAdd, counting }: PermanentChipsProps) {
  const roving = useRovingTabs();
  const shown =
    counting === undefined
      ? chips
      : chips.filter((chip) => chip.builtin !== undefined && counting.builtins.includes(chip.builtin));

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
        {shown.map((chip) => {
          const key = chip.builtin ?? chip.id;
          const counted = counting?.isOn(key) ?? false;
          return (
            <SourceChip
              key={chip.id}
              name={chip.name}
              value={chip.value}
              details={chip.lines}
              dotted={chip.value !== ''}
              checked={counting === undefined ? chip.value !== '' : counted}
              toggleLabel={
                counting !== undefined
                  ? `${chip.name}, ${counted ? 'counted' : 'not counted'}`
                  : chip.value === ''
                    ? `Set ${chip.name}`
                    : `${chip.name}, on every march`
              }
              gearLabel={`Edit ${chip.name}`}
              onToggle={() => {
                if (counting === undefined) onEdit(chip.id);
                else counting.toggle(key, !counted);
              }}
              onGear={() => {
                onEdit(chip.id);
              }}
            />
          );
        })}
        {counting?.extras.map(({ key, name }) => {
          const counted = counting.isOn(key);
          return (
            <SourceChip
              key={key}
              name={name}
              checked={counted}
              toggleLabel={`${name}, ${counted ? 'counted' : 'not counted'}`}
              onToggle={() => {
                counting.toggle(key, !counted);
              }}
            />
          );
        })}
      </Group>
      {counting === undefined && (
        <Button
          variant="subtle"
          size="compact-sm"
          leftSection={<Plus size={14} aria-hidden />}
          w="fit-content"
          onClick={onAdd}
        >
          Add permanent source
        </Button>
      )}
    </Stack>
  );
}
