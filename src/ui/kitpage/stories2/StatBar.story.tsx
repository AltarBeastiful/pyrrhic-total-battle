import { Stack } from '@mantine/core';

import { count, StatBar } from '../../domain2';
import type { KitStory } from '../story';

const story: KitStory = {
  name: 'StatBar',
  group: 'domain',
  render: () => (
    <Stack gap="md" maw={420}>
      <StatBar label="Health" base={420} boosted={620} format={count} />
      <StatBar label="Strength" base={380} boosted={380} format={count} />
      <StatBar label="Revive cost" base={2} boosted={2} format={(n) => `${n} gold`} />
    </Stack>
  ),
};

export default story;
