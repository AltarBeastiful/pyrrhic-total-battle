import { Group } from '@mantine/core';
import { useState } from 'react';

import { NumberField } from '../../kit';
import { Glyph } from '../../domain';
import type { KitStory } from '../story';

function Live() {
  const [value, setValue] = useState<number | null>(84300);
  return (
    <NumberField
      label="Leadership"
      value={value}
      onChange={setValue}
      leftSection={<Glyph kind="leadership" />}
      w={150}
    />
  );
}

const story: KitStory = {
  name: 'NumberField',
  group: 'kit',
  render: () => (
    <Group gap="md" wrap="wrap" align="flex-start">
      <Live />
      <NumberField label="Authority" value={12500} onChange={() => {}} w={150} />
      <NumberField
        label="Owned"
        value={null}
        allowEmpty
        placeholder="Unlimited"
        onChange={() => {}}
        w={150}
      />
      <NumberField
        label="Enemy army"
        value={0}
        onChange={() => {}}
        w={150}
        error="Type the army you are marching on"
      />
      <NumberField label="Dominance" value={3200} disabled onChange={() => {}} w={150} />
    </Group>
  ),
};

export default story;
