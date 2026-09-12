import { events as eventTable } from '@/data';
import { toggleActiveSource } from '@/state/actions/bonuses';
import type { BattleSetup } from '@/state/schema';

import { HelpNote, Pill } from '../../primitives';
import { BlockGlyph } from './glyphs';
import { formatPercent } from './labels';
import { Block, ChipGrid, ChipValueText } from './parts';

/**
 * Events (S-16): the seasonal events running on this march. Some add strength to the whole army, some
 * change what the monster fields, which is why the enemy section can end up overridden from here.
 */
export function EventsBlock({ setup }: { setup: BattleSetup }) {
  const active = setup.active.events;
  const overriding = eventTable.filter(
    (record) => record.enemyFormation !== undefined && active.includes(record.id),
  );

  return (
    <Block
      title="Events"
      icon={<BlockGlyph name="events" />}
      description="Switch on the event this march happens during. An event only counts while it runs."
      where="the Events screen — the banner names the one running now."
    >
      <ChipGrid>
        {eventTable.map((record) => (
          <Pill
            key={record.id}
            label={record.name}
            {...(record.strength === undefined
              ? {}
              : {
                  detail: <ChipValueText>{`Army ${formatPercent(record.strength)} strength`}</ChipValueText>,
                })}
            on={active.includes(record.id)}
            onToggle={(next) => {
              toggleActiveSource('events', record.id, next);
            }}
          />
        ))}
      </ChipGrid>
      {overriding.map((record) => (
        <HelpNote key={record.id} tone="warn">
          {record.name} decides the enemy formation for this march: the squads you set in the Enemy formation
          section are replaced while it is switched on.
        </HelpNote>
      ))}
    </Block>
  );
}
