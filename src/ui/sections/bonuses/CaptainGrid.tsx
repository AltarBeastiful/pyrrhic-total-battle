/**
 * The captains and the hero, as TotalStack's picker rather than as a list of switch rows (design
 * plan §7.3 as amended 2026-09-13, D-33).
 *
 * Every captain the tables know is on screen at once, so there is nothing to add: the grid *is* the
 * form and the summary. Tapping a tile sends that captain on this march, tapping its badge says what
 * level it is, and the fourth enlistment is refused out loud rather than silently ignored — the game
 * lets three ride, and a player who taps a fourth has to be told which of the three to take out.
 */
import { CaptainTile } from '@/ui/domain';
import { Banner } from '@/ui/kit';
import { Grid, Stack } from '@/ui/layout';

import type { CaptainTarget, CaptainTileRow, SourceGroup } from './rows';

/** What the card says when a fourth captain is tapped. One line, and never more than one. */
export const CAPTAIN_CAP_MESSAGE = 'Three captains at most; take one out first';

export interface CaptainGridProps {
  group: SourceGroup;
  tiles: CaptainTileRow[];
  onEnlist: (target: CaptainTarget) => void;
  onConfigure: (target: CaptainTarget) => void;
  /** True once a fourth enlistment was refused; cleared as soon as the march has room again. */
  isRefused: boolean;
}

export function CaptainGrid({ group, tiles, onEnlist, onConfigure, isRefused }: CaptainGridProps) {
  return (
    <Stack gap={2} as="section" aria-labelledby={`bonuses-${group.id}`}>
      <h4 id={`bonuses-${group.id}`} className="text-base font-medium">
        {group.title}
      </h4>
      <p className="text-muted text-sm">{group.caption}</p>
      {isRefused && <Banner tone="warn">{CAPTAIN_CAP_MESSAGE}</Banner>}
      {/*
        Four columns is the widest the layout grid offers; the plan asked for five, and the tile is
        sized so a fifth would fit the day `Grid` grows one.
      */}
      <Grid cols={{ base: 2, sm: 3, lg: 4 }} gap={2}>
        {tiles.map((tile) => (
          <CaptainTile
            key={tile.id}
            name={tile.name}
            {...(tile.bonusKey === undefined ? {} : { bonusKey: tile.bonusKey })}
            meta={tile.meta}
            isEnlisted={tile.isEnlisted}
            onEnlist={() => {
              onEnlist(tile.target);
            }}
            {...(tile.badge === undefined
              ? {}
              : {
                  badge: {
                    text: tile.badge.text,
                    isSet: tile.badge.isSet,
                    ...(tile.badge.label === undefined ? {} : { label: tile.badge.label }),
                    onPress: () => {
                      onConfigure(tile.target);
                    },
                  },
                })}
          />
        ))}
      </Grid>
    </Stack>
  );
}
