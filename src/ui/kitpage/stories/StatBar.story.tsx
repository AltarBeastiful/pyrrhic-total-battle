import { StatBar } from '../../domain';
import type { KitStory } from '../story';

const number = (n: number) => n.toLocaleString('en-US');

const story: KitStory = {
  name: 'StatBar',
  group: 'domain',
  render: () => (
    <div className="flex flex-col gap-6">
      <StatBar label="Health" base={420} boosted={2154} format={number} />
      <StatBar label="Strength" base={380} boosted={1862} format={number} />
      <StatBar label="Health (no bonuses yet)" base={9600} boosted={9600} format={number} />
    </div>
  ),
};

export default story;
