import { SimpleGrid } from '@mantine/core';

import { PoolGauge } from '../../domain';
import type { KitStory } from '../story';

const story: KitStory = {
  name: 'PoolGauge',
  group: 'domain',
  render: () => (
    <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
      <PoolGauge pool="leadership" used={84300} total={84300} />
      <PoolGauge pool="authority" used={7200} total={12500} />
      <PoolGauge pool="dominance" used={3600} total={3200} />
    </SimpleGrid>
  ),
};

export default story;
