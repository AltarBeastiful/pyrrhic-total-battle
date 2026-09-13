import { Stack } from '@mantine/core';

import { GROUP_LABEL, GroupMarker, UNIT_GROUPS } from '../../domain';
import type { KitStory } from '../story';

const story: KitStory = {
  name: 'GroupMarker',
  group: 'domain',
  render: () => (
    <Stack gap="xs">
      {UNIT_GROUPS.map((group) => (
        <GroupMarker key={group} group={group} label={GROUP_LABEL[group]} />
      ))}
      <GroupMarker group="mercenaries" />
    </Stack>
  ),
};

export default story;
