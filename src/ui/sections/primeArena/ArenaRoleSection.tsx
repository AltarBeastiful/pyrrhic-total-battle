/**
 * Which side the plan plays (B-37), as one small card in the arena's setup column. The role is a choice between
 * two options, so it is the calculator's own segmented control (rules 8, 23). The card's meta line says what the
 * form says (rule 6). There is no stack cap: the game sets none beyond one stack per troop type.
 */
import { SegmentedControl } from '@mantine/core';
import { useId } from 'react';

import { isPrimeArenaSide, PRIME_ARENA_SIDES } from '@/engine/primeArena';
import { Panel } from '@/ui/kit';

import { SIDE_NAME } from './ArenaMatch';
import { usePrimeArenaStore } from './primeArenaStore';

export function ArenaRoleSection() {
  const { role, setRole } = usePrimeArenaStore();
  const titleId = useId();
  return (
    <Panel
      component="section"
      aria-labelledby={titleId}
      title="Role"
      titleId={titleId}
      meta={SIDE_NAME[role]}
    >
      <SegmentedControl
        size="xs"
        fullWidth
        aria-label="Role"
        value={role}
        data={PRIME_ARENA_SIDES.map((side) => ({ value: side, label: SIDE_NAME[side] }))}
        onChange={(value) => {
          if (isPrimeArenaSide(value)) setRole(value);
        }}
      />
    </Panel>
  );
}
