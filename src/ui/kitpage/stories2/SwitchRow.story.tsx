import { Stack } from '@mantine/core';
import { useState } from 'react';

import { SwitchRow } from '../../kit2';
import type { KitStory } from '../story';

function Live() {
  const [on, setOn] = useState(true);
  return (
    <SwitchRow
      label="Sort by total HP"
      description="The strongest stack falls last, whatever its tier."
      checked={on}
      onChange={setOn}
    />
  );
}

const story: KitStory = {
  name: 'SwitchRow',
  group: 'kit',
  render: () => (
    <Stack gap="xs" maw={420}>
      <Live />
      <SwitchRow label="Unlimited" checked={false} onChange={() => {}} />
      <SwitchRow
        label="Revive with gold"
        description="Not available on this server."
        checked={false}
        disabled
        onChange={() => {}}
      />
    </Stack>
  ),
};

export default story;
