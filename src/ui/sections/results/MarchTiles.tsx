/**
 * The march as tiles (design plan §7.5 step 2): the unit types of the profile's range, laid out the
 * way the Troops card lays them out — one row per group, `md` tiles, the stack count under each —
 * with the types the search or the player left out in the same rows, dimmed.
 *
 * This block is the readable summary *and* the control: a tap on a marching tile leaves that type
 * out and re-sizes the march, a tap on a dimmed one keeps it in. Both gestures are the same one the
 * Troops card uses, and each tile says in words which of the two it is about to do.
 */
import type { UnitDef } from '@/engine/types';
import { GroupMarker, GROUP_LABEL, UnitTile } from '@/ui/domain';
import { Cluster, Stack } from '@/ui/layout';

import { keepInMarch, removeFromFormation } from './formation';
import { amount } from './format';
import { tileLabel } from './rows';
import type { TileRow } from './rows';

export interface MarchTilesProps {
  rows: TileRow[];
  /** Long-pressing a tile opens the unit sheet. */
  onDetails: (unit: UnitDef) => void;
}

export function MarchTiles({ rows, onDetails }: MarchTilesProps) {
  return (
    <Stack gap={2}>
      {rows.map((row) => (
        <Cluster key={row.group} gap={2} role="group" aria-label={`${GROUP_LABEL[row.group]} in the march`}>
          <GroupMarker group={row.group} />
          {row.entries.map((entry) => (
            <Stack
              key={entry.unit.id}
              gap={1}
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
                onLongPress={() => {
                  onDetails(entry.unit);
                }}
              />
              {entry.count > 0 ? (
                <span className="nums text-sm">{amount(entry.count)}</span>
              ) : (
                <span className="text-muted text-sm">out</span>
              )}
            </Stack>
          ))}
        </Cluster>
      ))}
    </Stack>
  );
}
