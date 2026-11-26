/**
 * Which side the plan plays and how many stacks it may field (B-37), as one small card in the arena's setup
 * column. The role is a choice between two options, so it is the calculator's own segmented control (rules 8, 23);
 * the stack cap is a typed figure, so it is the shared number field that selects its value on focus (rule 9).
 * The card's meta line says what the form says (rule 6).
 */
import { Group, SegmentedControl, Stack, Text } from '@mantine/core';
import { useId } from 'react';

import { isPrimeArenaSide, PRIME_ARENA_SIDES } from '@/engine/primeArena';
import { MAX_ARENA_STACKS } from '@/state/schema';
import { NumberField, Panel } from '@/ui/kit';

import { SIDE_NAME } from './ArenaMatch';
import { usePrimeArenaStore } from './primeArenaStore';

export function ArenaRoleSection() {
  const { role, maxStacks, setRole, setMaxStacks } = usePrimeArenaStore();
  const titleId = useId();
  return (
    <Panel
      component="section"
      aria-labelledby={titleId}
      title="Role"
      titleId={titleId}
      meta={`${SIDE_NAME[role]} · up to ${String(maxStacks)} stacks`}
    >
      <Stack gap="xs">
        <SegmentedControl
          size="xs"
          aria-label="Role"
          value={role}
          data={PRIME_ARENA_SIDES.map((side) => ({ value: side, label: SIDE_NAME[side] }))}
          onChange={(value) => {
            if (isPrimeArenaSide(value)) setRole(value);
          }}
        />
        <Group gap="sm" align="flex-end" wrap="nowrap">
          <NumberField
            label="Most stacks"
            value={maxStacks}
            min={1}
            max={MAX_ARENA_STACKS}
            onChange={(value) => {
              if (value !== null) setMaxStacks(value);
            }}
            w={120}
          />
          <Text size="xs" c="dimmed" pb={8}>
            The game&rsquo;s real limit is unknown.
          </Text>
        </Group>
      </Stack>
    </Panel>
  );
}
