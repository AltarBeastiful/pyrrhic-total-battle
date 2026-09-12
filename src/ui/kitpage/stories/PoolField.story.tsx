import { PoolField } from '../../domain';
import type { KitStory } from '../story';

const story: KitStory = {
  name: 'PoolField',
  group: 'domain',
  render: () => (
    <div className="flex flex-wrap gap-6">
      <PoolField pool="leadership" used={84300} total={84300} />
      <PoolField pool="authority" used={1240} total={4800} />
      <PoolField pool="dominance" used={0} total={620} />
      <PoolField pool="leadership" used={91000} total={84300} />
    </div>
  ),
};

export default story;
