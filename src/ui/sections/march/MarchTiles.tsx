/**
 * The march as tiles (design plan §7.5 step 2, design rule 28): the unit types of the profile's
 * range laid out the way the Troops card lays them out — one row per group, `md` tiles — with the
 * types the search or the player left out in the same rows, dimmed.
 *
 * This block is the readable summary *and* the control. A tap on a marching tile leaves that type
 * out and re-sizes the march; a tap on a dimmed one keeps it in. Both gestures are the ones the
 * Troops card uses, and each tile says in words which of the two it is about to do — TotalStack's
 * "Removed from formation — tap to restore" without a second list to read.
 *
 * The count under a tile is the way into the unit sheet: the tile is a verb, the figure is a noun.
 */
import { Group, Stack, Text, UnstyledButton } from '@mantine/core';

import type { UnitDef } from '@/engine/types';
import { GROUP_LABEL, GroupMarker, UnitTile } from '@/ui/domain2';

import { keepInMarch, removeFromFormation } from './formation';
import { amount } from './format';
import { tileLabel } from './rows';
import type { TileRow } from './rows';

export interface MarchTilesProps {
  rows: TileRow[];
  /** The figure under a tile opens the unit sheet. */
  onDetails: (unit: UnitDef) => void;
}

export function MarchTiles({ rows, onDetails }: MarchTilesProps) {
  return (
    <Stack gap="xs">
      {rows.map((row) => (
        <Group
          key={row.group}
          gap="xs"
          align="flex-start"
          role="group"
          aria-label={`${GROUP_LABEL[row.group]} in the march`}
        >
          <GroupMarker group={row.group} />
          {row.entries.map((entry) => (
            <Stack
              key={entry.unit.id}
              gap={2}
              align="center"
              // The short code and the count, as data: the browser suite reads a march from them
              // without having to parse a tile's drawing.
              data-stack={entry.unit.label}
              data-count={String(entry.count)}
            >
              <UnitTile
                unit={entry.unit}
                size="md"
                state={entry.state}
                label={tileLabel(entry)}
                onPress={() => {
                  if (entry.state === 'leftOut') keepInMarch(entry.unit.id);
                  else removeFromFormation(entry.unit.id);
                }}
              />
              <UnstyledButton
                aria-label={`Details: ${entry.unit.name}`}
                onClick={() => {
                  onDetails(entry.unit);
                }}
              >
                <Text span size="xs" {...(entry.count > 0 ? {} : { c: 'dimmed' as const })}>
                  {entry.count > 0 ? amount(entry.count) : 'out'}
                </Text>
              </UnstyledButton>
            </Stack>
          ))}
        </Group>
      ))}
    </Stack>
  );
}
