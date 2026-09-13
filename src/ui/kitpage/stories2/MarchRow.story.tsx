import { MarchRow, MarchTable } from '../../domain2';
import { SAMPLE_UNITS } from '../../domain2/fixtures';
import type { KitStory } from '../story';

const COUNTS = [1500, 980, 420, 60, 22];

const story: KitStory = {
  name: 'MarchRow',
  group: 'domain',
  render: () => (
    <MarchTable caption="The march, stack by stack">
      {SAMPLE_UNITS.map((unit, index) => (
        <MarchRow
          key={unit.id}
          unit={unit}
          count={COUNTS[index] ?? 0}
          hits={12 - index}
          lost={340 - index * 40}
          reviveSilver={90000 - index * 12000}
          position={index + 1}
          fallsLast={index === SAMPLE_UNITS.length - 1}
        />
      ))}
    </MarchTable>
  ),
};

export default story;
