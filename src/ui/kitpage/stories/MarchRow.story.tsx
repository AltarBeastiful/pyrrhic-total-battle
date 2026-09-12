import { MarchRow, MarchTable } from '../../domain';
import { SAMPLE_UNITS } from '../../domain/fixtures';
import type { KitStory } from '../story';

const counts = [2310, 1840, 96, 12, 22];
const hits = [1, 2, 1, 3, 1];
const lost = [412, 980, 12, 4, 22];
const revive = [9800, 7400, 2200, 18000, 0];

const story: KitStory = {
  name: 'MarchRow',
  group: 'domain',
  render: () => (
    <MarchTable caption="March, in the order the stacks fall">
      {SAMPLE_UNITS.map((unit, index) => (
        <MarchRow
          key={unit.id}
          unit={unit}
          count={counts[index] ?? 0}
          hits={hits[index] ?? 0}
          lost={lost[index] ?? 0}
          reviveSilver={revive[index] ?? 0}
          position={index + 1}
          fallsLast={unit.kind === 'mercenary'}
        />
      ))}
    </MarchTable>
  ),
};

export default story;
